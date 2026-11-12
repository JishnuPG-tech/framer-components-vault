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


/**
 * Aurora Gradient — an animated mesh gradient on a canvas.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function AuroraGradient(props) {
    const { colorA, colorB, colorC, speed, blur, grain, radius } = props
    const ref = useRef(null)

    // On the Framer canvas and during export there is no live frame loop to
    // drive. Animating anyway burns CPU in the editor and bakes artifacts into
    // exports, so paint a single representative frame and stop.
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const canvas = ref.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let raf = 0
        let t = 0
        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        const blobs = [
            { c: colorA, x: 0.3, y: 0.35, r: 0.55, sx: 0.9, sy: 1.3 },
            { c: colorB, x: 0.7, y: 0.4, r: 0.5, sx: -1.2, sy: 0.8 },
            { c: colorC, x: 0.5, y: 0.7, r: 0.6, sx: 0.7, sy: -1.0 },
        ]

        const paint = (t) => {
            const w = canvas.width
            const h = canvas.height
            ctx.clearRect(0, 0, w, h)
            for (const b of blobs) {
                const cx = (b.x + Math.sin(t * b.sx) * 0.12) * w
                const cy = (b.y + Math.cos(t * b.sy) * 0.12) * h
                const rad = b.r * Math.max(w, h)
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
                g.addColorStop(0, b.c)
                g.addColorStop(1, "transparent")
                ctx.globalCompositeOperation = "lighter"
                ctx.fillStyle = g
                ctx.beginPath()
                ctx.arc(cx, cy, rad, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        // Setting canvas.width CLEARS the canvas, so a resize must be followed by a
        // repaint. With the animation loop running that happens on the next frame;
        // in a static context there is no next frame, so repaint explicitly or the
        // component goes blank the first time it is resized.
        const STATIC_T = 2.1 // one frame with the blobs well separated
        const resize = () => {
            const r = canvas.getBoundingClientRect()
            canvas.width = Math.max(1, r.width * dpr)
            canvas.height = Math.max(1, r.height * dpr)
            if (isStatic) paint(STATIC_T)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(canvas)

        if (isStatic) {
            paint(STATIC_T)
            return () => ro.disconnect()
        }

        const loop = () => {
            paint(t)
            t += speed * 0.004
            raf = requestAnimationFrame(loop)
        }
        loop()

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
        }
    }, [colorA, colorB, colorC, speed, isStatic])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: radius,
                background: "#0b0b0f",
            }}
        >
            <canvas
                ref={ref}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    filter: `blur(${blur}px)`,
                }}
            />
            {grain > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: grain,
                        pointerEvents: "none",
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    }}
                />
            )}
        </div>
    )
}

AuroraGradient.defaultProps = {
    colorA: "#7C5CFF",
    colorB: "#FF5C8A",
    colorC: "#2ED8FF",
    speed: 1,
    blur: 40,
    grain: 0.12,
    radius: 16,
}

addPropertyControls(AuroraGradient, {
    colorA: { type: ControlType.Color, title: "Color A" },
    colorB: { type: ControlType.Color, title: "Color B" },
    colorC: { type: ControlType.Color, title: "Color C" },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 4,
        step: 0.1,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 120,
        step: 1,
    },
    grain: {
        type: ControlType.Number,
        title: "Grain",
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
    },
})
