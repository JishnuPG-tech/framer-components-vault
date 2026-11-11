// Cursor Orbit: a small planetary system that leans toward the cursor. Rings sit at different depths
// (outer rings follow further, inner ones less), bodies circle each ring at its own pace and a core
// glows at the centre. Made for dark heroes, behind a title.
// Tanmay's Cursor Orbit component, from tanmaykaper's portfolio. STUDIO day kit v1.1,
// (c) 2026 Tanmay Kaper. See LICENSE.md.
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


type Props = {
    rings: number
    bodies: number
    speed: number
    parallax: number
    tilt: number
    ringColor: string
    bodyColor: string
    coreColor: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */
export default function CursorOrbit(props: Props) {
    const { rings = 3, bodies = 2, speed = 20, parallax = 30, tilt = 64, ringColor = "rgba(180,190,255,0.5)", bodyColor = "rgb(143,179,255)", coreColor = "rgb(143,179,255)", style } = props
    const isStatic = useIsStaticRenderer()
    const ringRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const coreRef = React.useRef<HTMLDivElement>(null)
    const n = Math.max(1, Math.min(6, Math.round(rings)))
    const list = React.useMemo(() => Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1)
        const count = Math.max(1, Math.round(bodies) + (i % 2))
        return {
            size: 22 + t * 56, // % of the frame's shorter side
            stroke: 0.3 + t * 0.18,
            depth: 0.25 + t * 0.75,
            duration: Math.max(6, speed * (0.65 + i * 0.35)),
            body: 5 + i * 2,
            bodies: Array.from({ length: count }, (_, b) => ({ angle: (360 / count) * b + i * 17, opacity: 0.5 + ((b + i) % 5) * 0.1 })),
        }
    }), [n, bodies, speed])

    React.useEffect(() => {
        if (isStatic || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return
        const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
        let raf = 0
        const onMove = (e: PointerEvent) => {
            target.x = (e.clientX / innerWidth - 0.5) * parallax * 2
            target.y = (e.clientY / innerHeight - 0.5) * parallax * 2
            if (!raf) raf = requestAnimationFrame(step)
        }
        const step = () => {
            raf = 0
            cur.x += (target.x - cur.x) * 0.08
            cur.y += (target.y - cur.y) * 0.08
            list.forEach((r, i) => { const el = ringRefs.current[i]; if (el) el.style.translate = `${(cur.x * r.depth).toFixed(2)}px ${(cur.y * r.depth).toFixed(2)}px` })
            if (coreRef.current) coreRef.current.style.translate = `${(cur.x * 0.15).toFixed(2)}px ${(cur.y * 0.15).toFixed(2)}px`
            if (Math.abs(target.x - cur.x) > 0.05 || Math.abs(target.y - cur.y) > 0.05) raf = requestAnimationFrame(step)
        }
        addEventListener("pointermove", onMove, { passive: true })
        return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", onMove) }
    }, [list, parallax, isStatic])

    return (
        <div className="sdOrbit" style={{ "--ring": ringColor, "--body": bodyColor, "--core": coreColor, "--tilt": `${tilt}deg`, ...style } as React.CSSProperties} aria-hidden="true">
            <style>{CSS}</style>
            <div className="sdOrbit__sky">
                {list.map((r, i) => (
                    <div key={i} ref={(el) => { ringRefs.current[i] = el }} className="sdOrbit__ring" style={{ width: `${r.size}cqmin`, height: `${r.size}cqmin`, "--rad": `${r.size / 2}cqmin` } as React.CSSProperties}>
                        <div className="sdOrbit__plane" style={{ borderColor: `color-mix(in oklab, var(--ring) ${Math.round(r.stroke * 100 / 0.48)}%, transparent)` }}>
                            <div className="sdOrbit__spin" style={{ animationDuration: `${r.duration}s`, animationDirection: i % 2 ? "reverse" : "normal" }}>
                                {r.bodies.map((b, k) => (
                                    <i key={k} style={{ rotate: `${b.angle}deg`, opacity: b.opacity, "--b": `${r.body}px` } as React.CSSProperties} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={coreRef} className="sdOrbit__core" />
            </div>
        </div>
    )
}

const CSS = `
.sdOrbit { position: relative; overflow: hidden; container-type: size; pointer-events: none; }
.sdOrbit__sky { position: absolute; inset: 0; display: grid; place-items: center; perspective: 900px; }
.sdOrbit__ring, .sdOrbit__core { grid-area: 1 / 1; }
.sdOrbit__ring { position: relative; transform-style: preserve-3d; }
.sdOrbit__plane { position: absolute; inset: 0; border: 1px solid; border-radius: 50%; transform: rotateX(var(--tilt)); transform-style: preserve-3d; }
.sdOrbit__spin { position: absolute; inset: 0; animation: sdOrbit-spin linear infinite; }
.sdOrbit__spin i { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
.sdOrbit__spin i::after { content: ""; position: absolute; left: calc(var(--b) / -2); top: calc(-1 * var(--rad) - var(--b) / 2); width: var(--b); height: var(--b); border-radius: 50%; background: var(--body); box-shadow: 0 0 10px 2px color-mix(in oklab, var(--body) 60%, transparent); }
@keyframes sdOrbit-spin { to { transform: rotate(360deg); } }
.sdOrbit__core { width: 18px; height: 18px; border-radius: 50%; background: var(--core); box-shadow: 0 0 24px 6px color-mix(in oklab, var(--core) 55%, transparent), 0 0 80px 30px color-mix(in oklab, var(--core) 18%, transparent); }
@media (prefers-reduced-motion: reduce) { .sdOrbit__spin { animation: none; } }
`

addPropertyControls(CursorOrbit, {
    rings: { type: ControlType.Number, title: "Rings", min: 1, max: 6, step: 1, displayStepper: true, defaultValue: 3 },
    bodies: { type: ControlType.Number, title: "Bodies", min: 1, max: 6, step: 1, displayStepper: true, defaultValue: 2 },
    speed: { type: ControlType.Number, title: "Orbit time", min: 6, max: 80, step: 1, unit: "s", defaultValue: 20 },
    parallax: { type: ControlType.Number, title: "Parallax", min: 0, max: 120, step: 1, unit: "px", defaultValue: 30 },
    tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 80, step: 1, unit: "°", defaultValue: 64 },
    ringColor: { type: ControlType.Color, title: "Rings", defaultValue: "rgba(180,190,255,0.5)" },
    bodyColor: { type: ControlType.Color, title: "Bodies", defaultValue: "rgb(143,179,255)" },
    coreColor: { type: ControlType.Color, title: "Core", defaultValue: "rgb(143,179,255)" },
})
