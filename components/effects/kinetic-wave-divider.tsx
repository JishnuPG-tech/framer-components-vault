import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface WaveDividerProps {
    colour: string
    background: string
    direction: "up" | "down"
    layers: number
    swell: number
    waveLength: number
    speed: number
    flow: "left" | "right"
    responsive: boolean
    animate: boolean
    style?: CSSProperties
}

const LAYER_OPACITY = [1, 0.5, 0.25]

/**
 * Wave Divider
 *
 * A living, rolling wave edge for dividing page sections. The wave is drawn
 * in real pixels, so wider screens get more waves instead of a stretched one.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 80
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function WaveDivider(props: WaveDividerProps) {
    const {
        colour = "#00529B",
        background = "rgba(0, 0, 0, 0)",
        direction = "up",
        layers = 1,
        swell = 9,
        waveLength = 460,
        speed = 1,
        flow = "right",
        responsive = true,
        animate = true,
        style,
    } = props

    const svgRef = useRef<SVGSVGElement>(null)
    const pathRefs = useRef<(SVGPathElement | null)[]>([])
    const isStatic = useIsStaticRenderer()
    const count = Math.max(1, Math.min(3, Math.round(layers)))

    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return

        let w = 0
        let h = 0
        const measure = () => {
            const r = svg.getBoundingClientRect()
            w = r.width
            h = r.height
            svg.setAttribute("viewBox", `0 0 ${Math.max(1, w)} ${Math.max(1, h)}`)
        }
        measure()

        const reduced =
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const still = isStatic || reduced || !animate
        const sign = flow === "left" ? -1 : 1

        const draw = (ms: number) => {
            if (!w || !h) return
            const t = ms / 1000
            // Smart width: narrow screens get a gentler swell and tighter waves
            const scale = responsive ? Math.min(1, Math.max(0.55, w / 1000)) : 1
            const lambda = Math.max(40, waveLength * (0.7 + 0.3 * scale))
            const k1 = (Math.PI * 2) / lambda
            const k2 = (Math.PI * 2) / (lambda / 2.4)
            const gapRatio = 0.6 * (count - 1)
            // Keep the wave inside the element no matter how short it is
            let A = swell * scale
            A = Math.min(A, (h * 0.8 - 2) / (1.5 + gapRatio))
            A = Math.max(0, A)
            const gap = A * 0.6
            const base = 1.5 * A + gap * (count - 1) + 2

            const n = Math.max(24, Math.ceil(w / 5) + 1)
            for (let L = 0; L < count; L++) {
                const path = pathRefs.current[L]
                if (!path) continue
                const amp = A * (1 - 0.15 * L)
                const off = base - gap * L
                const v1 = speed * 52 * (1 + 0.25 * L) * sign
                const v2 = -speed * 34 * (1 + 0.25 * L) * sign
                const ph = L * 1.7
                let d = ""
                for (let i = 0; i < n; i++) {
                    const x = (i * w) / (n - 1)
                    let y =
                        off +
                        amp * Math.sin(k1 * (x - v1 * t) + ph) +
                        amp * 0.5 * Math.sin(k2 * (x - v2 * t) - ph)
                    if (direction === "down") y = h - y
                    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(2) + " "
                }
                d +=
                    direction === "down"
                        ? `L${w.toFixed(1)} -1 L0 -1 Z`
                        : `L${w.toFixed(1)} ${h + 1} L0 ${h + 1} Z`
                path.setAttribute("d", d)
            }
        }

        let raf = 0
        let running = false
        const loop = (ms: number) => {
            draw(ms)
            raf = requestAnimationFrame(loop)
        }
        const start = () => {
            if (running || still) return
            running = true
            raf = requestAnimationFrame(loop)
        }
        const stop = () => {
            running = false
            cancelAnimationFrame(raf)
        }

        draw(typeof performance !== "undefined" ? performance.now() : 0)

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                measure()
                if (!running) draw(performance.now())
            })
            ro.observe(svg)
        }

        let io: IntersectionObserver | null = null
        if (!still) {
            if (typeof IntersectionObserver !== "undefined") {
                io = new IntersectionObserver(
                    (entries) => {
                        if (entries[0] && entries[0].isIntersecting) start()
                        else stop()
                    },
                    { threshold: 0.01 }
                )
                io.observe(svg)
            } else start()
        }

        return () => {
            stop()
            if (ro) ro.disconnect()
            if (io) io.disconnect()
        }
    }, [isStatic, animate, flow, responsive, waveLength, swell, speed, direction, count])

    const order = []
    for (let L = count - 1; L >= 0; L--) order.push(L)

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background,
            }}
        >
            <svg
                ref={svgRef}
                aria-hidden="true"
                style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
            >
                {order.map((L) => (
                    <path
                        key={L}
                        ref={(el) => {
                            pathRefs.current[L] = el
                        }}
                        fill={colour}
                        fillOpacity={LAYER_OPACITY[L]}
                    />
                ))}
            </svg>
        </div>
    )
}

addPropertyControls(WaveDivider, {
    direction: {
        type: ControlType.Enum,
        title: "Facing",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        defaultValue: "up",
        displaySegmentedControl: true,
        description: "Up: waves on top, colour fills below. Down: colour hangs from above.",
    },
    colour: { type: ControlType.Color, title: "Colour", defaultValue: "#00529B" },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0, 0, 0, 0)",
    },
    layers: {
        type: ControlType.Number,
        title: "Layers",
        defaultValue: 1,
        min: 1,
        max: 3,
        step: 1,
        displayStepper: true,
    },
    swell: {
        type: ControlType.Number,
        title: "Swell",
        defaultValue: 9,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    waveLength: {
        type: ControlType.Number,
        title: "Wave Length",
        defaultValue: 460,
        min: 120,
        max: 1600,
        step: 10,
        unit: "px",
    },
    responsive: {
        type: ControlType.Boolean,
        title: "Smart Width",
        defaultValue: true,
        description: "Softens the swell and tightens the waves on narrow screens.",
    },
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 4,
        step: 0.1,
        hidden: (p: Partial<WaveDividerProps>) => !p.animate,
    },
    flow: {
        type: ControlType.Enum,
        title: "Flow",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
        hidden: (p: Partial<WaveDividerProps>) => !p.animate,
    },
})
