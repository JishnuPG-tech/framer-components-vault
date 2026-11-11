import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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
 * Curved Marquee
 * Text flows continuously along a sine-wave path.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 320
 */
export default function CurvedMarquee(props) {
    const {
        text,
        separator,
        gap,
        font,
        color,
        speed,
        direction,
        amplitude,
        wavelength,
        phase,
        pauseOnHover,
        playInCanvas,
        style,
    } = props

    const wrapRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const measureRef = useRef<SVGTextElement>(null)
    const textPathRef = useRef<SVGTextPathElement>(null)
    const hovered = useRef(false)

    const [size, setSize] = useState({ w: 1200, h: 320 })
    const [itemLen, setItemLen] = useState(0)
    const [pathLen, setPathLen] = useState(0)

    const pathId = "curved-marquee-" + React.useId().replace(/:/g, "")
    const item = separator ? `${text} ${separator}` : text
    const fontKey = JSON.stringify(font)

    // Track component size
    useEffect(() => {
        const el = wrapRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            setSize({ w: Math.max(1, width), h: Math.max(1, height) })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Build the wave path (extends one wavelength past each edge)
    const d = useMemo(() => {
        const { w, h } = size
        const cy = h / 2
        const wl = Math.max(50, wavelength)
        const start = -wl
        const end = w + wl
        const step = Math.max(4, wl / 60)
        const ph = (phase * Math.PI) / 180
        let p = ""
        for (let x = start; x <= end + step; x += step) {
            const y = cy + amplitude * Math.sin((x / wl) * Math.PI * 2 + ph)
            p += `${p ? " L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`
        }
        return p
    }, [size, amplitude, wavelength, phase])

    // Measure one item + path length (re-run when fonts finish loading)
    useLayoutEffect(() => {
        const measure = () => {
            if (measureRef.current)
                setItemLen(measureRef.current.getComputedTextLength())
            if (pathRef.current) setPathLen(pathRef.current.getTotalLength())
        }
        measure()
        if (typeof document !== "undefined" && document.fonts?.ready) {
            document.fonts.ready.then(measure)
        }
    }, [d, item, fontKey])

    const period = itemLen + gap
    const copies = period > 0 ? Math.ceil((pathLen + period) / period) + 1 : 1

    // Animation loop
    useEffect(() => {
        const tp = textPathRef.current
        if (!tp || period <= 0) return

        const isCanvas = RenderTarget.current() === RenderTarget.canvas
        const reduceMotion =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        if ((isCanvas && !playInCanvas) || reduceMotion || speed === 0) {
            tp.setAttribute("startOffset", String(-period / 2))
            return
        }

        let raf = 0
        let last = performance.now()
        let offset = 0

        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            if (!(pauseOnHover && hovered.current)) {
                offset = (offset + speed * dt) % period
            }
            const o = direction === "left" ? -offset : offset - period
            tp.setAttribute("startOffset", o.toFixed(2))
            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [period, speed, direction, pauseOnHover, playInCanvas])

    const textStyle: React.CSSProperties = {
        ...font,
        fill: color,
        whiteSpace: "pre",
    }

    return (
        <div
            ref={wrapRef}
            role="marquee"
            aria-label={text}
            onMouseEnter={() => (hovered.current = true)}
            onMouseLeave={() => (hovered.current = false)}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <svg
                aria-hidden="true"
                width={size.w}
                height={size.h}
                style={{ display: "block", overflow: "visible" }}
            >
                <path
                    ref={pathRef}
                    id={pathId}
                    d={d}
                    fill="none"
                    stroke="none"
                />

                {/* Hidden measuring element */}
                <text
                    ref={measureRef}
                    style={{ ...textStyle, visibility: "hidden" }}
                    x={-99999}
                    y={-99999}
                >
                    {item}
                </text>

                <text style={textStyle} dominantBaseline="middle">
                    <textPath
                        ref={textPathRef}
                        href={`#${pathId}`}
                        startOffset={0}
                    >
                        {Array.from({ length: copies }).map((_, i) => (
                            <tspan key={i} dx={i === 0 ? 0 : gap}>
                                {item}
                            </tspan>
                        ))}
                    </textPath>
                </text>
            </svg>
        </div>
    )
}

CurvedMarquee.defaultProps = {
    text: "Enterprise Technology. Built to Scale.",
    separator: "",
    gap: 48,
    font: { fontSize: 64 },
    color: "#571F9C",
    speed: 80,
    direction: "left",
    amplitude: 70,
    wavelength: 1700,
    phase: 0,
    pauseOnHover: false,
    playInCanvas: true,
}

addPropertyControls(CurvedMarquee, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: CurvedMarquee.defaultProps.text,
    },
    separator: {
        type: ControlType.String,
        title: "Separator",
        placeholder: "e.g. ·  ✦  /",
        defaultValue: "",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: 48,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 64 },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#571F9C",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 600,
        step: 5,
        unit: "px/s",
        defaultValue: 80,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },
    amplitude: {
        type: ControlType.Number,
        title: "Wave Height",
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: 70,
    },
    wavelength: {
        type: ControlType.Number,
        title: "Wave Length",
        min: 200,
        max: 5000,
        step: 10,
        unit: "px",
        defaultValue: 1700,
    },
    phase: {
        type: ControlType.Number,
        title: "Wave Shift",
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
        defaultValue: 0,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: false,
    },
    playInCanvas: {
        type: ControlType.Boolean,
        title: "Play in Canvas",
        defaultValue: true,
    },
})
