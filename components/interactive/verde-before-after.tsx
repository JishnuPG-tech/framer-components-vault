// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react"

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface FirmennoBeforeAfterProps {
    before?: ImageValue
    after?: ImageValue
    start: number
    direction: "horizontal" | "vertical"
    mode: "drag" | "hover"
    fit: "cover" | "contain"
    radius: number
    showLabels: boolean
    beforeLabel: string
    afterLabel: string
    labelFont: CSSProperties
    labelColor: string
    labelFill: string
    lineColor: string
    lineWidth: number
    knobSize: number
    knobColor: string
    iconColor: string
    style?: CSSProperties
}

const DEFAULT_BEFORE: ImageValue = {
    src: "https://framerusercontent.com/images/Sv1uZcfJp5hPSzmxe6c9cSbCk.jpg",
    alt: "Before",
}
const DEFAULT_AFTER: ImageValue = {
    src: "https://framerusercontent.com/images/TCCvSGSXtCn5KNxxVFcva3hD0lA.jpg",
    alt: "After",
}

const clamp = (v: number) => Math.min(100, Math.max(0, v))

/**
 * Before After Compare — compare two images by dragging a handle.
 * Free component by Firmenno (firmenno.com).
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 448
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FirmennoBeforeAfter(props: FirmennoBeforeAfterProps) {
    const {
        before = DEFAULT_BEFORE,
        after = DEFAULT_AFTER,
        start,
        direction,
        mode,
        fit,
        radius,
        showLabels,
        beforeLabel,
        afterLabel,
        labelFont,
        labelColor,
        labelFill,
        lineColor,
        lineWidth,
        knobSize,
        knobColor,
        iconColor,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)
    const [pos, setPos] = useState(clamp(start))
    const horizontal = direction === "horizontal"

    useEffect(() => setPos(clamp(start)), [start])

    const moveTo = useCallback(
        (clientX: number, clientY: number) => {
            const el = ref.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const p = horizontal
                ? ((clientX - r.left) / r.width) * 100
                : ((clientY - r.top) / r.height) * 100
            setPos(clamp(p))
        },
        [horizontal]
    )

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (mode !== "drag") return
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        moveTo(e.clientX, e.clientY)
    }
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (mode === "hover" || dragging.current) moveTo(e.clientX, e.clientY)
    }
    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        dragging.current = false
        if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const step = e.shiftKey ? 10 : 2
        const back = horizontal ? "ArrowLeft" : "ArrowUp"
        const fwd = horizontal ? "ArrowRight" : "ArrowDown"
        if (e.key === back) setPos((p) => clamp(p - step))
        else if (e.key === fwd) setPos((p) => clamp(p + step))
        else if (e.key === "Home") setPos(0)
        else if (e.key === "End") setPos(100)
        else return
        e.preventDefault()
    }

    const shown = isStatic ? clamp(start) : pos
    const clip = horizontal
        ? `inset(0 ${100 - shown}% 0 0)`
        : `inset(0 0 ${100 - shown}% 0)`

    const img: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit,
        userSelect: "none",
        pointerEvents: "none",
        display: "block",
    }

    const label = (text: string, side: "start" | "end"): CSSProperties => ({
        position: "absolute",
        zIndex: 2,
        padding: "6px 12px",
        borderRadius: 999,
        background: labelFill,
        color: labelColor,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        ...labelFont,
        ...(horizontal
            ? { bottom: 16, [side === "start" ? "left" : "right"]: 16 }
            : { left: 16, [side === "start" ? "top" : "bottom"]: 16 }),
    })

    return (
        <div
            ref={ref}
            role="slider"
            aria-label="Before and after comparison"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(shown)}
            aria-orientation={direction}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: radius,
                touchAction: horizontal ? "pan-y" : "pan-x",
                cursor:
                    mode === "drag"
                        ? horizontal
                            ? "ew-resize"
                            : "ns-resize"
                        : "default",
                outline: "none",
                background: "#e9e6e0",
                ...props.style,
            }}
        >
            <img
                src={after.src}
                srcSet={after.srcSet}
                alt={after.alt || afterLabel}
                style={img}
                draggable={false}
            />
            <img
                src={before.src}
                srcSet={before.srcSet}
                alt={before.alt || beforeLabel}
                style={{ ...img, clipPath: clip }}
                draggable={false}
            />

            {showLabels && beforeLabel && (
                <span style={label(beforeLabel, "start")}>{beforeLabel}</span>
            )}
            {showLabels && afterLabel && (
                <span style={label(afterLabel, "end")}>{afterLabel}</span>
            )}

            <div
                aria-hidden
                style={{
                    position: "absolute",
                    zIndex: 3,
                    pointerEvents: "none",
                    background: lineColor,
                    ...(horizontal
                        ? {
                              top: 0,
                              bottom: 0,
                              left: `${shown}%`,
                              width: lineWidth,
                              transform: "translateX(-50%)",
                          }
                        : {
                              left: 0,
                              right: 0,
                              top: `${shown}%`,
                              height: lineWidth,
                              transform: "translateY(-50%)",
                          }),
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    zIndex: 4,
                    pointerEvents: "none",
                    width: knobSize,
                    height: knobSize,
                    borderRadius: "50%",
                    background: knobColor,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    left: horizontal ? `${shown}%` : "50%",
                    top: horizontal ? "50%" : `${shown}%`,
                    transform: "translate(-50%, -50%)",
                }}
            >
                <svg
                    width={knobSize * 0.5}
                    height={knobSize * 0.5}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={iconColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: horizontal ? "none" : "rotate(90deg)" }}
                >
                    <path d="M9 6l-6 6 6 6" />
                    <path d="M15 6l6 6-6 6" />
                </svg>
            </div>
        </div>
    )
}

addPropertyControls(FirmennoBeforeAfter, {
    before: { type: ControlType.ResponsiveImage, title: "Before" },
    after: { type: ControlType.ResponsiveImage, title: "After" },
    start: {
        type: ControlType.Number,
        title: "Start",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    mode: {
        type: ControlType.Enum,
        title: "Move On",
        options: ["drag", "hover"],
        optionTitles: ["Drag", "Hover"],
        defaultValue: "drag",
        displaySegmentedControl: true,
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 100,
        unit: "px",
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
    },
    beforeLabel: {
        type: ControlType.String,
        title: "Before Text",
        defaultValue: "Before",
        hidden: (p) => !p.showLabels,
    },
    afterLabel: {
        type: ControlType.String,
        title: "After Text",
        defaultValue: "After",
        hidden: (p) => !p.showLabels,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Semibold",
            letterSpacing: "0.02em",
            lineHeight: "1.2em",
        },
        hidden: (p) => !p.showLabels,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#16302B",
        hidden: (p) => !p.showLabels,
    },
    labelFill: {
        type: ControlType.Color,
        title: "Label Fill",
        defaultValue: "rgba(255, 255, 255, 0.9)",
        hidden: (p) => !p.showLabels,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line",
        defaultValue: "#FFFFFF",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 2,
        min: 0,
        max: 8,
        unit: "px",
    },
    knobSize: {
        type: ControlType.Number,
        title: "Handle",
        defaultValue: 44,
        min: 24,
        max: 96,
        unit: "px",
    },
    knobColor: {
        type: ControlType.Color,
        title: "Handle Fill",
        defaultValue: "#FFFFFF",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Handle Icon",
        defaultValue: "#1F5F55",
    },
})
