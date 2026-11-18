// WaveBarsAutoSVGLines — perfectly rounded bars via SVG <line> + round caps
import {
    useEffect,
    useRef,
    useCallback,
    useState,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface WaveBarsAutoSVGLinesProps {
    color: string
    bars: number
    gap: number
    minHeightPct: number
    maxHeightPct: number
    speed: number
    stagger: number
    opacity: number
    style?: CSSProperties
}

export default function WaveBars(props: WaveBarsAutoSVGLinesProps) {
    const {
        color = "#FFFFFF",
        bars = 10,
        gap = 16,
        minHeightPct = 0.2,
        maxHeightPct = 0.9,
        speed = 0.9,
        stagger = 0.55,
        opacity = 0.9,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const lineRefs = useRef<SVGLineElement[]>([])
    const rafRef = useRef<number | null>(null)
    const visibleRef = useRef(true)

    const [count, setCount] = useState<number>(Math.max(2, Math.floor(bars)))
    const [size, setSize] = useState({ width: 0, height: 0 })

    useEffect(() => setCount(Math.max(2, Math.floor(bars))), [bars])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (r) setSize({ width: r.width, height: r.height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const clamp = (v: number, min: number, max: number) =>
        Math.max(min, Math.min(max, v))
    const clamp01 = (v: number) => clamp(v, 0, 1)

    const valueToHeightPx = useCallback(
        (t: number) => {
            const min = clamp01(minHeightPct)
            const max = clamp01(maxHeightPct)
            const norm = min + (max - min) * clamp01(t)
            return norm * size.height
        },
        [minHeightPct, maxHeightPct, size.height]
    )

    // exact bar width (px) → strokeWidth
    const barWidthPx = (() => {
        if (size.width <= 0 || count <= 0) return 0
        const totalGaps = (count - 1) * gap
        return Math.max(1, (size.width - totalGaps) / count)
    })()

    const animate = useCallback(
        (startTs: number) => {
            const twoPI = Math.PI * 2
            const prefersReduced =
                typeof window !== "undefined" &&
                window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches

            const omega = twoPI * (prefersReduced ? speed * 0.35 : speed)
            const omega2 = omega * 1.7
            const phaseStep = twoPI * stagger

            const tick = (now: number) => {
                if (!visibleRef.current) {
                    rafRef.current = requestAnimationFrame(tick)
                    return
                }
                const t = (now - startTs) / 1000
                const n = lineRefs.current.length
                const h = size.height
                const w = barWidthPx

                if (h > 0 && w > 0) {
                    const centerY = h / 2
                    const maxDrawable = Math.max(0, h - w) // leave room for round caps
                    for (let i = 0; i < n; i++) {
                        const line = lineRefs.current[i]
                        if (!line) continue

                        // organic but cheap movement: 2 sines
                        const v1 = Math.sin(t * omega + i * phaseStep)
                        const v2 = Math.sin(t * omega2 - i * phaseStep * 0.6)
                        const mix = 0.7 * v1 + 0.3 * v2
                        const norm = 0.5 + 0.5 * mix // 0..1

                        // bar height clamped so that (barH + strokeWidth) ≤ container height
                        const desired = valueToHeightPx(norm)
                        const barH = Math.min(desired, maxDrawable)

                        // positions clamped to keep ends inside container
                        let y1 = centerY - barH / 2
                        let y2 = centerY + barH / 2
                        const pad = w / 2 // round cap radius
                        y1 = clamp(y1, pad, h - pad)
                        y2 = clamp(y2, pad, h - pad)

                        const x = i * (w + gap) + w / 2
                        line.setAttribute("x1", x.toFixed(2))
                        line.setAttribute("x2", x.toFixed(2))
                        line.setAttribute("y1", y1.toFixed(2))
                        line.setAttribute("y2", y2.toFixed(2))
                        line.setAttribute("stroke-width", w.toFixed(2)) // perfect round ends
                    }
                }

                rafRef.current = requestAnimationFrame(tick)
            }

            rafRef.current = requestAnimationFrame(tick)
        },
        [barWidthPx, gap, size.height, stagger, valueToHeightPx, speed]
    )

    useEffect(() => {
        if (isStatic) return

        const io = new IntersectionObserver(
            (entries) => {
                visibleRef.current = !!entries[0]?.isIntersecting
            },
            { root: null, threshold: 0 }
        )
        if (containerRef.current) io.observe(containerRef.current)

        const start = performance.now()
        animate(start)

        return () => {
            io.disconnect()
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [animate])

    // build refs
    const lines = []
    lineRefs.current = []
    for (let i = 0; i < count; i++) {
        // For static canvas, calculate initial positions
        let x1 = "0", y1 = "0", x2 = "0", y2 = "0", strokeWidth = "0"
        
        if (isStatic && size.height > 0 && barWidthPx > 0) {
            const centerY = size.height / 2
            const maxDrawable = Math.max(0, size.height - barWidthPx)
            
            // Simulate a frozen moment in the animation with varied heights
            const twoPI = Math.PI * 2
            const phaseStep = twoPI * stagger
            const frozenTime = 1.5 // arbitrary frozen moment
            const omega = twoPI * speed
            const omega2 = omega * 1.7
            
            const v1 = Math.sin(frozenTime * omega + i * phaseStep)
            const v2 = Math.sin(frozenTime * omega2 - i * phaseStep * 0.6)
            const mix = 0.7 * v1 + 0.3 * v2
            const norm = 0.5 + 0.5 * mix // 0..1
            
            const staticHeight = valueToHeightPx(norm)
            const barH = Math.min(staticHeight, maxDrawable)
            
            const pad = barWidthPx / 2
            let staticY1 = centerY - barH / 2
            let staticY2 = centerY + barH / 2
            staticY1 = clamp(staticY1, pad, size.height - pad)
            staticY2 = clamp(staticY2, pad, size.height - pad)
            
            const x = i * (barWidthPx + gap) + barWidthPx / 2
            x1 = x.toFixed(2)
            x2 = x.toFixed(2)
            y1 = staticY1.toFixed(2)
            y2 = staticY2.toFixed(2)
            strokeWidth = barWidthPx.toFixed(2)
        }
        
        lines.push(
            <line
                key={i}
                ref={(el) => {
                    if (el) lineRefs.current[i] = el
                }}
                x1={isStatic ? x1 : "0"}
                y1={isStatic ? y1 : "0"}
                x2={isStatic ? x2 : "0"}
                y2={isStatic ? y2 : "0"}
                stroke={color}
                opacity={opacity}
                strokeLinecap="round"
                strokeWidth={isStatic ? strokeWidth : undefined}
                shapeRendering="geometricPrecision"
            />
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden", // belt & suspenders
                ...style,
            }}
        >
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{ display: "block" }}
            >
                {lines}
            </svg>
        </div>
    )
}

addPropertyControls(WaveBars, {
    color: { type: ControlType.Color, title: "Color", defaultValue: "#FFFFFF" },
    bars: {
        type: ControlType.Number,
        title: "Bars",
        defaultValue: 10,
        min: 2,
        max: 32,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap (px)",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 1,
    },
    minHeightPct: {
        type: ControlType.Number,
        title: "Min %",
        description: "Minimum bar height as a percentage of container height (0 = 0%, 1 = 100%)",
        defaultValue: 0.2,
        min: 0,
        max: 0.9,
        step: 0.01,
    },
    maxHeightPct: {
        type: ControlType.Number,
        title: "Max %",
        description: "Maximum bar height as a percentage of container height (0 = 0%, 1 = 100%)",
        defaultValue: 0.9,
        min: 0.1,
        max: 1,
        step: 0.01,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed (Hz)",
        defaultValue: 0.9,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description: "Phase offset between bars - higher values create more wave-like motion",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.9,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
})
