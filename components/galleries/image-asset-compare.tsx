import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, useReducedMotion } from "framer-motion"

type ImageSource = {
    src: string
    srcSet?: string
    alt?: string
}

type LabelPosition = "top" | "bottom"

interface Props {
    before?: ImageSource
    after?: ImageSource
    start?: number
    showLabels?: boolean
    beforeLabel?: string
    afterLabel?: string
    labelPosition?: LabelPosition
    labelBg?: string
    labelColor?: string
    labelFont?: CSSProperties
    radius?: number
    lineColor?: string
    lineWidth?: number
    knobSize?: number
    knobBg?: string
    knobColor?: string
    jelly?: number
    drift?: number
    flick?: boolean
    style?: CSSProperties
}

type Sim = {
    pos: number // where the handle is
    tail: number // where the line ends are
    vel: number // speed of the line ends
    target: number | null // where a glide is heading
    raf: number
    last: number
}

const DEFAULT_W = 540
const DEFAULT_H = 352

const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v

const GLIDE_RATE = 9 // how quickly the handle eases to a target
const STIFFNESS = 520 // how hard the line ends chase the handle
const FLICK_SPEED = 0.002 // handle widths per ms that count as a throw
const FLICK_WINDOW = 80 // ms: a throw must end while still moving

/**
 * Image Compare
 * Drag a line across two images to reveal before and after.
 * The line bends with your swing, a flick throws it to the edge,
 * and the layers drift for a sense of depth.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 540
 * @framerIntrinsicHeight 352
 */
export default function ImageCompare(props: Props) {
    const {
        before,
        after,
        start = 50,
        showLabels = true,
        beforeLabel = "Before",
        afterLabel = "After",
        labelPosition = "top",
        labelBg = "rgba(0,0,0,0.48)",
        labelColor = "#FFFFFF",
        labelFont = {},
        radius = 20,
        lineColor = "#FFFFFF",
        lineWidth = 2,
        knobSize = 40,
        knobBg = "#FFFFFF",
        knobColor = "#111111",
        jelly = 50,
        drift = 8,
        flick = true,
        style,
    } = props

    // Canvas thumbnails and exports: draw once, never animate
    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const [held, setHeld] = useState(false)

    // DOM nodes painted directly each frame
    const rootRef = useRef<HTMLDivElement>(null)
    const afterRef = useRef<HTMLDivElement>(null)
    const beforeClipRef = useRef<HTMLDivElement>(null)
    const beforeRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const gripRef = useRef<HTMLDivElement>(null)
    const tagLeftRef = useRef<HTMLSpanElement>(null)
    const tagRightRef = useRef<HTMLSpanElement>(null)

    // Pause the loop the moment the component leaves the viewport
    const inView = useInView(rootRef, { amount: 0 })
    const inViewRef = useRef(inView)
    inViewRef.current = inView

    // Motion state lives in refs, never in React state
    const sim = useRef<Sim>({
        pos: clamp(start / 100, 0, 1),
        tail: clamp(start / 100, 0, 1),
        vel: 0,
        target: null,
        raf: 0,
        last: 0,
    })
    const size = useRef({ w: 0, h: 0 })
    const pointer = useRef<{ x: number; t: number; v: number } | null>(null)

    // Latest settings for the loop without restarting it
    const cfg = useRef({ jelly, drift, still: false })
    cfg.current = { jelly, drift, still: !!reduceMotion || isStatic }

    /* Paint: turn the current state into pixels */
    const paint = () => {
        const { w, h } = size.current
        if (!w || !h) return
        const s = sim.current
        const c = cfg.current
        const x = s.pos * w

        // How far the line bows. Ends trail the handle; the curve
        // always passes through the handle at mid height.
        const maxBend = c.still ? 0 : (c.jelly / 100) * 0.06 * w
        const bow = clamp((s.pos - s.tail) * w * 0.6, -maxBend, maxBend)
        const endX = (x - bow).toFixed(2)
        const ctrlX = (x + bow).toFixed(2)
        const mid = (h / 2).toFixed(2)

        pathRef.current?.setAttribute(
            "d",
            `M ${endX} 0 Q ${ctrlX} ${mid} ${endX} ${h}`
        )

        const cut = `path("M 0 0 L ${endX} 0 Q ${ctrlX} ${mid} ${endX} ${h} L 0 ${h} Z")`
        const clipEl = beforeClipRef.current
        if (clipEl) {
            clipEl.style.clipPath = cut
            clipEl.style.setProperty("-webkit-clip-path", cut)
        }

        if (gripRef.current) {
            gripRef.current.style.transform = `translate3d(${x}px, ${h / 2}px, 0) translate(-50%, -50%)`
        }

        // Depth: the layers slide gently against each other
        const shift = (s.pos - 0.5) * c.drift
        const grow = 1 + (c.drift * 2) / w
        if (afterRef.current) {
            afterRef.current.style.transform = `translate3d(${-shift}px, 0, 0) scale(${grow})`
        }
        if (beforeRef.current) {
            beforeRef.current.style.transform = `translate3d(${shift * 0.5}px, 0, 0) scale(${grow})`
        }

        // Labels fade as the line reaches them
        if (tagLeftRef.current) {
            tagLeftRef.current.style.opacity = String(
                clamp((s.pos - 0.12) * 5, 0, 1)
            )
        }
        if (tagRightRef.current) {
            tagRightRef.current.style.opacity = String(
                clamp((0.88 - s.pos) * 5, 0, 1)
            )
        }

        rootRef.current?.setAttribute(
            "aria-valuenow",
            String(Math.round(s.pos * 100))
        )
    }

    /* Jump straight to the resting state and stop the loop */
    const settle = () => {
        const s = sim.current
        if (s.target !== null) s.pos = s.target
        s.target = null
        s.tail = s.pos
        s.vel = 0
        if (s.raf) cancelAnimationFrame(s.raf)
        s.raf = 0
        paint()
    }

    /* Loop: runs only while something moves and the component is
       visible, then stops itself */
    const tick = (now: number) => {
        const s = sim.current
        const c = cfg.current

        if (!inViewRef.current || c.still) {
            settle()
            return
        }

        const dt = Math.min(0.032, (now - s.last) / 1000)
        s.last = now

        if (s.target !== null) {
            s.pos += (s.target - s.pos) * (1 - Math.exp(-dt * GLIDE_RATE))
            if (Math.abs(s.target - s.pos) < 0.0005) {
                s.pos = s.target
                s.target = null
            }
        }

        if (c.jelly <= 0) {
            s.tail = s.pos
            s.vel = 0
        } else {
            // Lower damping as jelly rises: firm at 0, wobbly at 100
            const damping = 60 - 36 * (c.jelly / 100)
            const force = STIFFNESS * (s.pos - s.tail) - damping * s.vel
            s.vel += force * dt
            s.tail += s.vel * dt
        }

        paint()

        const settled =
            s.target === null &&
            Math.abs(s.pos - s.tail) < 0.0005 &&
            Math.abs(s.vel) < 0.003
        if (settled) {
            settle()
            return
        }
        s.raf = requestAnimationFrame(tick)
    }

    const wake = () => {
        const s = sim.current
        if (s.raf) return
        // Never start frames when static, still, or offscreen
        if (cfg.current.still || !inViewRef.current) {
            settle()
            return
        }
        s.last = performance.now()
        s.raf = requestAnimationFrame(tick)
    }

    const glideTo = (to: number) => {
        sim.current.target = clamp(to, 0, 1)
        wake()
    }

    const ratioAt = (clientX: number): number => {
        const r = rootRef.current?.getBoundingClientRect()
        if (!r || r.width === 0) return sim.current.pos
        return clamp((clientX - r.left) / r.width, 0, 1)
    }

    // Track size, repaint on resize
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            size.current = { w: el.offsetWidth, h: el.offsetHeight }
            paint()
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Leaving the viewport mid motion: finish instantly, no frames offscreen
    useEffect(() => {
        if (!inView && sim.current.raf) settle()
    }, [inView])

    // New start position from the panel
    useEffect(() => {
        const s = sim.current
        s.pos = s.tail = clamp(start / 100, 0, 1)
        s.vel = 0
        s.target = null
        paint()
    }, [start])

    // Settings that change the picture
    useEffect(() => {
        paint()
    }, [drift, jelly, reduceMotion, isStatic])

    // Stop any frame still queued when removed
    useEffect(() => () => cancelAnimationFrame(sim.current.raf), [])

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
        const at = ratioAt(e.clientX)
        pointer.current = { x: at, t: performance.now(), v: 0 }
        setHeld(true)
        glideTo(at)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const p = pointer.current
        if (!p) return
        const at = ratioAt(e.clientX)
        const now = performance.now()
        const speed = (at - p.x) / Math.max(1, now - p.t)
        p.v = p.v * 0.3 + speed * 0.7
        p.x = at
        p.t = now
        const s = sim.current
        s.target = null
        s.pos = at
        paint()
        wake()
    }

    const endDrag = (
        e: React.PointerEvent<HTMLDivElement>,
        cancelled: boolean
    ) => {
        const p = pointer.current
        pointer.current = null
        setHeld(false)
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
        if (cancelled || !flick || !p) return
        const recent = performance.now() - p.t < FLICK_WINDOW
        if (recent && Math.abs(p.v) > FLICK_SPEED) glideTo(p.v > 0 ? 1 : 0)
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isStatic) return
        const s = sim.current
        const from = s.target ?? s.pos
        const step = e.shiftKey ? 0.2 : 0.05
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            glideTo(from - step)
        } else if (e.key === "ArrowRight") {
            e.preventDefault()
            glideTo(from + step)
        } else if (e.key === "Home") {
            e.preventDefault()
            glideTo(0)
        } else if (e.key === "End") {
            e.preventDefault()
            glideTo(1)
        }
    }

    const layer: CSSProperties = {
        position: "absolute",
        inset: 0,
        willChange: isStatic ? undefined : "transform",
    }

    const imageStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
    }

    const tag: CSSProperties = {
        position: "absolute",
        [labelPosition === "top" ? "top" : "bottom"]: 12,
        padding: "4px 8px",
        borderRadius: 8,
        background: labelBg,
        color: labelColor,
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 500,
        pointerEvents: "none",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        fontFamily: "Inter, system-ui, sans-serif",
        ...labelFont,
    }

    // Fixed, Fill and Relative pass a size in; Fit passes none,
    // so fall back to the default size instead of collapsing to 0
    const width = style?.width ?? DEFAULT_W
    const height = style?.height ?? DEFAULT_H

    const initial = clamp(start / 100, 0, 1)

    return (
        <div
            ref={rootRef}
            role="slider"
            tabIndex={isStatic ? -1 : 0}
            aria-label="Compare before and after"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(initial * 100)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endDrag(e, false)}
            onPointerCancel={(e) => endDrag(e, true)}
            onKeyDown={onKeyDown}
            style={{
                ...style,
                position: "relative",
                width,
                height,
                overflow: "hidden",
                borderRadius: radius,
                cursor: isStatic ? "default" : "ew-resize",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                outline: "none",
                isolation: "isolate",
            }}
        >
            {/* After: the full picture underneath */}
            <div ref={afterRef} style={layer}>
                {after?.src ? (
                    <img
                        src={after.src}
                        srcSet={after.srcSet}
                        alt={after.alt || ""}
                        draggable={false}
                        style={imageStyle}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            background:
                                "linear-gradient(135deg, #FF8A5B 0%, #7B61FF 100%)",
                        }}
                    />
                )}
            </div>

            {/* Before: on top, cut along the curved line */}
            <div
                ref={beforeClipRef}
                style={{ position: "absolute", inset: 0, overflow: "hidden" }}
            >
                <div ref={beforeRef} style={layer}>
                    {before?.src ? (
                        <img
                            src={before.src}
                            srcSet={before.srcSet}
                            alt={before.alt || ""}
                            draggable={false}
                            style={imageStyle}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                background:
                                    "linear-gradient(135deg, #1C1C1C 0%, #8C8C8C 100%)",
                            }}
                        />
                    )}
                </div>
            </div>

            {showLabels && (
                <>
                    <span ref={tagLeftRef} style={{ ...tag, left: 12 }}>
                        {beforeLabel}
                    </span>
                    <span ref={tagRightRef} style={{ ...tag, right: 12 }}>
                        {afterLabel}
                    </span>
                </>
            )}

            {/* The line */}
            <svg
                aria-hidden="true"
                width="100%"
                height="100%"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                    pointerEvents: "none",
                }}
            >
                <path
                    ref={pathRef}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={lineWidth}
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.24))" }}
                />
            </svg>

            {/* The knob */}
            <div
                ref={gripRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                    willChange: isStatic ? undefined : "transform",
                }}
            >
                <span
                    style={{
                        display: "grid",
                        placeItems: "center",
                        width: knobSize,
                        height: knobSize,
                        borderRadius: "50%",
                        background: knobBg,
                        color: knobColor,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                        transform: held ? "scale(1.12)" : "scale(1)",
                        transition: isStatic
                            ? undefined
                            : "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                >
                    <svg
                        width="20"
                        height="12"
                        viewBox="0 0 20 12"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M6 2L2 6l4 4M14 2l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </div>
        </div>
    )
}

ImageCompare.displayName = "Image Compare"

addPropertyControls(ImageCompare, {
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
    jelly: {
        type: ControlType.Number,
        title: "Jelly",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        description: "0 keeps the line straight, 100 makes it wobbly",
    },
    drift: {
        type: ControlType.Number,
        title: "Depth Drift",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 4,
        unit: "px",
    },
    flick: {
        type: ControlType.Boolean,
        title: "Flick to Edge",
        defaultValue: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 4,
        unit: "px",
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
        min: 1,
        max: 8,
        step: 1,
        unit: "px",
    },
    knobSize: {
        type: ControlType.Number,
        title: "Knob Size",
        defaultValue: 40,
        min: 24,
        max: 80,
        step: 4,
        unit: "px",
    },
    knobBg: { type: ControlType.Color, title: "Knob", defaultValue: "#FFFFFF" },
    knobColor: {
        type: ControlType.Color,
        title: "Knob Icon",
        defaultValue: "#111111",
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
        hidden: (p: Props) => !p.showLabels,
    },
    afterLabel: {
        type: ControlType.String,
        title: "After Text",
        defaultValue: "After",
        hidden: (p: Props) => !p.showLabels,
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Label Spot",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "top",
        displaySegmentedControl: true,
        hidden: (p: Props) => !p.showLabels,
    },
    labelBg: {
        type: ControlType.Color,
        title: "Label BG",
        defaultValue: "rgba(0,0,0,0.48)",
        hidden: (p: Props) => !p.showLabels,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#FFFFFF",
        hidden: (p: Props) => !p.showLabels,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 12, lineHeight: "16px" },
        hidden: (p: Props) => !p.showLabels,
    },
})
