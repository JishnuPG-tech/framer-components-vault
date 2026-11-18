import { useEffect, useRef, useState } from "react"
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
 * Before / After Slider — free Framer component by Ahmed Nazmy
 * Drag, tap or use the arrow keys to compare two images.
 * Premium templates: https://www.framer.com/@ahmed-nazmy/
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
interface Props {
    before?: { src?: string; alt?: string }
    after?: { src?: string; alt?: string }
    beforeLabel: string
    afterLabel: string
    showLabels: boolean
    tintBefore: boolean
    autoSweep: boolean
    start: number
    radius: number
    handle: string
    icon: string
    style?: React.CSSProperties
}

const FALLBACK =
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"

export default function RevealCompare(props: Props) {
    const {
        before,
        after,
        beforeLabel = "Before",
        afterLabel = "After",
        showLabels = true,
        tintBefore = true,
        autoSweep = true,
        start = 50,
        radius = 24,
        handle = "#FFFFFF",
        icon = "#111418",
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const [pos, setPos] = useState(start)
    const [anim, setAnim] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)
    const afterSrc = after?.src || FALLBACK
    const beforeSrc = before?.src || afterSrc

    useEffect(() => setPos(start), [start])

    useEffect(() => {
        if (isStatic || !autoSweep || typeof IntersectionObserver === "undefined" || !ref.current) return
        const timers: ReturnType<typeof setTimeout>[] = []
        const io = new IntersectionObserver(
            ([e]) => {
                if (!e.isIntersecting) return
                io.disconnect()
                ;[[25, 600], [75, 1600], [start, 2600]].forEach(([p, t]) =>
                    timers.push(setTimeout(() => { setAnim(true); setPos(p) }, t))
                )
                timers.push(setTimeout(() => setAnim(false), 3600))
            },
            { threshold: 0.4 }
        )
        io.observe(ref.current)
        return () => { io.disconnect(); timers.forEach(clearTimeout) }
    }, [isStatic, autoSweep, start])

    const moveTo = (x: number) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        setPos(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)))
    }
    const ease = anim ? "0.9s cubic-bezier(.65,0,.35,1)" : "0s"
    const img: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", userSelect: "none" }
    const label: React.CSSProperties = { position: "absolute", top: 16, padding: "7px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: "inherit", pointerEvents: "none" }

    return (
        <div
            ref={ref}
            role="slider"
            tabIndex={0}
            aria-label="Compare before and after"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            onPointerDown={(e) => { dragging.current = true; setAnim(false); (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); moveTo(e.clientX) }}
            onPointerMove={(e) => { if (dragging.current) moveTo(e.clientX) }}
            onPointerUp={() => { dragging.current = false }}
            onPointerCancel={() => { dragging.current = false }}
            onKeyDown={(e) => {
                if (e.key === "ArrowLeft") { setAnim(false); setPos((p) => Math.max(0, p - 5)) }
                if (e.key === "ArrowRight") { setAnim(false); setPos((p) => Math.min(100, p + 5)) }
            }}
            style={{ position: "relative", overflow: "hidden", borderRadius: radius, cursor: "ew-resize", touchAction: "pan-y", userSelect: "none", width: "100%", height: "100%", minHeight: 200, background: "#1A1D21", ...style }}
        >
            <img src={afterSrc} alt={after?.alt || "After"} style={img} draggable={false} />
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)`, transition: `clip-path ${ease}` }}>
                <img src={beforeSrc} alt={before?.alt || "Before"} draggable={false} style={{ ...img, filter: tintBefore ? "sepia(.5) saturate(.55) brightness(.9)" : "none" }} />
            </div>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, marginLeft: -1, background: handle, transition: `left ${ease}`, pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", width: 52, height: 52, marginLeft: -26, marginTop: -26, borderRadius: 999, background: handle, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={icon} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" /></svg>
                </div>
            </div>
            {showLabels && <span style={{ ...label, left: 16, background: "rgba(0,0,0,.45)", color: "#FFFFFF", backdropFilter: "blur(10px)" }}>{beforeLabel}</span>}
            {showLabels && <span style={{ ...label, right: 16, background: "#FFFFFF", color: "#111418" }}>{afterLabel}</span>}
        </div>
    )
}

addPropertyControls(RevealCompare, {
    before: { type: ControlType.ResponsiveImage, title: "Before" },
    after: { type: ControlType.ResponsiveImage, title: "After" },
    showLabels: { type: ControlType.Boolean, title: "Labels", defaultValue: true },
    beforeLabel: { type: ControlType.String, title: "Before label", defaultValue: "Before", hidden: (p: Props) => !p.showLabels },
    afterLabel: { type: ControlType.String, title: "After label", defaultValue: "After", hidden: (p: Props) => !p.showLabels },
    tintBefore: { type: ControlType.Boolean, title: "Tint before", defaultValue: true },
    autoSweep: { type: ControlType.Boolean, title: "Auto sweep", defaultValue: true },
    start: { type: ControlType.Number, title: "Start", defaultValue: 50, min: 0, max: 100, unit: "%" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 24, min: 0, max: 80 },
    handle: { type: ControlType.Color, title: "Handle", defaultValue: "#FFFFFF" },
    icon: { type: ControlType.Color, title: "Arrows", defaultValue: "#111418" },
})
