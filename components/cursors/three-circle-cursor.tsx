import * as React from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    color1: string
    color2: string
    color3: string
    size: number
    speed1: number
    speed2: number
    speed3: number
    offset: number
    opacity: number
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 * Three overlapping circles follow the native pointer at independent speeds.
 * @framerIntrinsicWidth 80
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ThreeCircleCursor(props: Props) {
    const { color1 = "#FF6B6B", color2 = "#FFC857", color3 = "#6C63FF", size = 36,
        speed1 = 18, speed2 = 10, speed3 = 5, offset = 26, opacity = 0.85, style } = props
    const isStatic = useIsStaticRenderer()
    const [host, setHost] = React.useState<HTMLElement | null>(null)
    const dots = React.useRef<(HTMLDivElement | null)[]>([])
    const layer = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
        if (isStatic || typeof document === "undefined") return
        setHost(document.body)
    }, [isStatic])
    React.useEffect(() => {
        if (isStatic || !host || typeof window === "undefined") return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
        const fine = window.matchMedia("(any-pointer: fine)")
        const positions = [0, 1, 2].map(() => ({ x: 0, y: 0 }))
        const speeds = [speed1, speed2, speed3]
        let x = 0, y = 0, frame = 0, last = 0, initialized = false
        const paint = () => positions.forEach((p, i) => {
            if (dots.current[i]) dots.current[i]!.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`
        })
        const tick = (now: number) => {
            frame = 0
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now
            let moving = false
            positions.forEach((p, i) => {
                const alpha = 1 - Math.exp(-Math.max(0.1, speeds[i]) * dt)
                p.x += (x - p.x) * alpha
                p.y += (y - p.y) * alpha
                if (Math.abs(x - p.x) + Math.abs(y - p.y) > 0.05) moving = true
            })
            paint()
            if (moving) frame = requestAnimationFrame(tick)
        }
        const hide = () => {
            if (layer.current) layer.current.style.opacity = "0"
            cancelAnimationFrame(frame)
            frame = 0
            initialized = false
        }
        const move = (event: PointerEvent) => {
            if (event.pointerType === "touch" || !fine.matches || reduced.matches) { hide(); return }
            x = event.clientX + offset
            y = event.clientY + offset
            if (!initialized) {
                positions.forEach(p => { p.x = x; p.y = y })
                initialized = true
                paint()
            }
            if (layer.current) layer.current.style.opacity = String(opacity)
            if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick) }
        }
        const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide() }
        const visibility = () => { if (document.hidden) hide() }
        window.addEventListener("pointermove", move, { passive: true })
        window.addEventListener("pointerout", leave)
        window.addEventListener("blur", hide)
        document.addEventListener("visibilitychange", visibility)
        reduced.addEventListener("change", hide)
        fine.addEventListener("change", hide)
        return () => {
            hide()
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerout", leave)
            window.removeEventListener("blur", hide)
            document.removeEventListener("visibilitychange", visibility)
            reduced.removeEventListener("change", hide)
            fine.removeEventListener("change", hide)
        }
    }, [host, isStatic, speed1, speed2, speed3, offset, opacity])
    const colors = [color1, color2, color3]
    const scales = [0.56, 0.78, 1]
    return <div aria-hidden="true" style={{ ...style, position: "relative", zIndex: 10, pointerEvents: "none", userSelect: "none", WebkitUserSelect: "none" }}>
        {isStatic ? colors.map((color, i) => <div key={i} style={{
            position: "absolute", left: "50%", top: "50%", width: size * scales[i], height: size * scales[i],
            borderRadius: "50%", background: color, pointerEvents: "none", userSelect: "none", WebkitUserSelect: "none", opacity, zIndex: 3 - i, transform: "translate(-50%, -50%)",
        }} />) : host && createPortal(<div ref={layer} aria-hidden="true" style={{
            position: "fixed", inset: 0, pointerEvents: "none", userSelect: "none", WebkitUserSelect: "none", zIndex: 10, opacity: 0, overflow: "hidden",
        }}>{colors.map((color, i) => <div key={i} ref={el => { dots.current[i] = el }} style={{
            position: "absolute", top: 0, left: 0, width: size * scales[i], height: size * scales[i],
            borderRadius: "50%", background: color, zIndex: 3 - i, willChange: "transform", pointerEvents: "none", userSelect: "none", WebkitUserSelect: "none",
        }} />)}</div>, host)}
    </div>
}

addPropertyControls(ThreeCircleCursor, {
    color1: { type: ControlType.Color, title: "Circle 1", defaultValue: "#FF6B6B" },
    color2: { type: ControlType.Color, title: "Circle 2", defaultValue: "#FFC857" },
    color3: { type: ControlType.Color, title: "Circle 3", defaultValue: "#6C63FF" },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 36,
        min: 12,
        max: 100,
        unit: "px",
        description: "Controls the diameter of the largest circle.",
    },
    speed1: {
        type: ControlType.Number,
        title: "Speed 1",
        defaultValue: 18,
        min: 1,
        max: 40,
        step: 1,
        description: "Controls how quickly Circle 1 follows the pointer. Higher values feel snappier.",
    },
    speed2: {
        type: ControlType.Number,
        title: "Speed 2",
        defaultValue: 10,
        min: 1,
        max: 40,
        step: 1,
        description: "Controls how quickly Circle 2 follows the pointer. Lower values create more lag.",
    },
    speed3: {
        type: ControlType.Number,
        title: "Speed 3",
        defaultValue: 5,
        min: 1,
        max: 40,
        step: 1,
        description: "Controls how quickly Circle 3 follows the pointer. Lower values create the longest trail.",
    },
    offset: {
        type: ControlType.Number,
        title: "Offset",
        defaultValue: 26,
        min: 0,
        max: 100,
        unit: "px",
        description: "Moves the circle trail away from the pointer position.",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Controls the overall visibility of the circles.\n\n[View Setup Example](https://framer.link/gGHGkAr)",
    },
})
