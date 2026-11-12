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

import { motion, useMotionValue, useSpring } from "framer-motion"

type Orientation = "vertical" | "horizontal"
type Mode = "drag" | "hover"
type HandleStyle = "circle" | "bar" | "none"

interface BeforeAfterProps {
    before?: React.ReactNode
    after?: React.ReactNode
    start: number
    orientation: Orientation
    mode: Mode
    smoothing: number
    handle: HandleStyle
    handleSize: number
    handleColor: string
    dividerWidth: number
    dividerColor: string
}

/**
 * Before After - drag or hover a divider to wipe between two layers.
 *
 * The split position travels as a CSS custom property, so moving it changes only
 * a clip-path and never re-renders React or touches layout. Pointer handling is
 * on the element, with pointer capture so a drag survives leaving the frame, and
 * the handle is a real keyboard-operable slider.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BeforeAfter(props: BeforeAfterProps) {
    const {
        before,
        after,
        start,
        orientation,
        mode,
        smoothing,
        handle,
        handleSize,
        handleColor,
        dividerWidth,
        dividerColor,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)
    const handleRef = useRef<HTMLDivElement>(null)

    const vertical = orientation === "vertical"

    // A stiff spring reads as instant at smoothing 0 and trails at 10.
    const stiffness = 1400 / (1 + smoothing)
    const raw = useMotionValue(start)
    const split = useSpring(raw, {
        stiffness,
        damping: 2 * Math.sqrt(stiffness),
        mass: 1,
    })

    // A non-finite position falls back to the start value, so a bad reading can
    // never reach the clip-path or be announced to a screen reader as NaN.
    const clamp = (n: number) =>
        Math.min(Math.max(Number.isFinite(n) ? n : start, 0), 100)

    // The position lives in a motion value so moving it never re-renders React,
    // which also means a rendered aria-valuenow would stay frozen at the start
    // value. Write it straight to the slider instead, from the target position
    // rather than the spring, so a screen reader hears where the divider is
    // going and is not flooded with every in-between frame. Covers drag, hover,
    // keyboard and the spring back on hover leave, since all of them set raw.
    useEffect(() => {
        const el = handleRef.current
        if (!el) return
        const write = (v: number) =>
            el.setAttribute("aria-valuenow", String(Math.round(clamp(v))))
        write(raw.get())
        return raw.on("change", write)
    }, [raw, handle])

    const positionFrom = (event: React.PointerEvent<HTMLDivElement>) => {
        const root = rootRef.current
        if (!root) return null
        const rect = root.getBoundingClientRect()
        // A frame with no size yet (inside a closed tab or accordion, or before
        // first layout) has no meaningful position to read: 0 / 0 is NaN.
        if (rect.width === 0 || rect.height === 0) return null
        const ratio = vertical
            ? (event.clientX - rect.left) / rect.width
            : (event.clientY - rect.top) / rect.height
        return clamp(ratio * 100)
    }

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || mode !== "drag") return
        const next = positionFrom(event)
        if (next === null) return
        dragging.current = true
        // Keep tracking even if the pointer leaves the frame mid-drag.
        event.currentTarget.setPointerCapture(event.pointerId)
        raw.set(next)
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic) return
        if (mode === "drag" && !dragging.current) return
        const next = positionFrom(event)
        if (next !== null) raw.set(next)
    }

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic) return
        dragging.current = false
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    const onPointerLeave = () => {
        if (isStatic || mode !== "hover") return
        raw.set(start)
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (isStatic) return
        const step = event.shiftKey ? 10 : 2
        const current = raw.get()
        const back = vertical ? "ArrowLeft" : "ArrowUp"
        const forward = vertical ? "ArrowRight" : "ArrowDown"

        if (event.key === back) raw.set(clamp(current - step))
        else if (event.key === forward) raw.set(clamp(current + step))
        else if (event.key === "Home") raw.set(0)
        else if (event.key === "End") raw.set(100)
        else return

        event.preventDefault()
    }

    // On canvas the spring never runs, so drive everything from the static
    // start value and keep the component fully legible while designing.
    const pct = isStatic ? `${clamp(start)}%` : "calc(var(--split) * 1%)"

    const clip = vertical
        ? `inset(0 calc(100% - ${pct}) 0 0)`
        : `inset(0 0 calc(100% - ${pct}) 0)`

    const beforeStyle = {
        position: "absolute",
        inset: 0,
        clipPath: clip,
        WebkitClipPath: clip,
        "--split": split,
    } as unknown as React.CSSProperties

    const dividerStyle = {
        position: "absolute",
        background: dividerColor,
        pointerEvents: "none",
        "--split": split,
        ...(vertical
            ? {
                  top: 0,
                  bottom: 0,
                  left: pct,
                  width: dividerWidth,
                  marginLeft: -dividerWidth / 2,
              }
            : {
                  left: 0,
                  right: 0,
                  top: pct,
                  height: dividerWidth,
                  marginTop: -dividerWidth / 2,
              }),
    } as unknown as React.CSSProperties

    const handleStyle = {
        position: "absolute",
        display: "grid",
        placeItems: "center",
        background: handleColor,
        color: dividerColor,
        borderRadius: handle === "circle" ? "50%" : handleSize / 5,
        width: handle === "circle" ? handleSize : handleSize / 2.6,
        height: handle === "circle" ? handleSize : handleSize,
        cursor: vertical ? "ew-resize" : "ns-resize",
        boxShadow: "0 2px 10px rgba(0,0,0,0.28)",
        "--split": split,
        ...(vertical
            ? { top: "50%", left: pct, translate: "-50% -50%" }
            : { left: "50%", top: pct, translate: "-50% -50%" }),
    } as unknown as React.CSSProperties

    return (
        <div
            ref={rootRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                touchAction: "none",
                cursor:
                    mode === "drag"
                        ? vertical
                            ? "ew-resize"
                            : "ns-resize"
                        : "default",
            }}
        >
            <div style={{ position: "absolute", inset: 0 }}>{after}</div>
            <motion.div style={beforeStyle}>{before}</motion.div>

            {dividerWidth > 0 && <motion.div style={dividerStyle} />}

            {handle !== "none" && (
                <motion.div
                    ref={handleRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="Comparison position"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(clamp(start))}
                    aria-orientation={vertical ? "horizontal" : "vertical"}
                    onKeyDown={onKeyDown}
                    style={handleStyle}
                >
                    <svg
                        width={handleSize * 0.42}
                        height={handleSize * 0.42}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            transform: vertical ? undefined : "rotate(90deg)",
                        }}
                    >
                        <path d="M9 6 L4 12 L9 18" />
                        <path d="M15 6 L20 12 L15 18" />
                    </svg>
                </motion.div>
            )}
        </div>
    )
}

BeforeAfter.displayName = "Before After"

addPropertyControls(BeforeAfter, {
    before: {
        type: ControlType.Slot,
        title: "Before",
        description: "The layer revealed on the near side of the divider.",
        maxCount: 1,
    },
    after: {
        type: ControlType.Slot,
        title: "After",
        description: "The layer behind, revealed as the divider moves across.",
        maxCount: 1,
    },
    start: {
        type: ControlType.Number,
        title: "Start",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "vertical",
        options: ["vertical", "horizontal"],
        optionTitles: ["Left / Right", "Top / Bottom"],
        displaySegmentedControl: true,
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        description:
            "Drag holds its position. Hover follows the cursor and springs back.",
        defaultValue: "drag",
        options: ["drag", "hover"],
        optionTitles: ["Drag", "Hover"],
        displaySegmentedControl: true,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        description: "0 tracks exactly. Higher values trail behind.",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.5,
    },
    handle: {
        type: ControlType.Enum,
        title: "Handle",
        defaultValue: "circle",
        options: ["circle", "bar", "none"],
        optionTitles: ["Circle", "Bar", "None"],
    },
    handleSize: {
        type: ControlType.Number,
        title: "Handle Size",
        defaultValue: 44,
        min: 16,
        max: 120,
        step: 2,
        unit: "px",
        hidden: (props: Partial<BeforeAfterProps>) => props.handle === "none",
    },
    handleColor: {
        type: ControlType.Color,
        title: "Handle Fill",
        defaultValue: "#FFFFFF",
        hidden: (props: Partial<BeforeAfterProps>) => props.handle === "none",
    },
    dividerWidth: {
        type: ControlType.Number,
        title: "Divider",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "#FFFFFF",
    },
})
