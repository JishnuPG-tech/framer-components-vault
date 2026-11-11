// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

// SCROLL PATH TEXT
//
// The line of type lies on one long curved path in world space and never
// moves. Scrolling walks a typing head along that path; the camera holds the
// head at the anchor — the middle of the frame — so each character appears at
// the centre as the head reaches it, and the ones already typed trail away
// behind while the world tilts around them.

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A circular arc with straight tangent lines extending from both ends, drawn
 * with its apex at the origin. `bend` is +1 for a line that arches over and
 * -1 for one that dips under.
 */
function buildArcPath(
    length: number,
    radius: number,
    bend: number,
    maxSweep: number
): string {
    const half = length / 2

    if (!isFinite(radius) || radius > 1e7) {
        return `M ${-half} 0 L ${half} 0`
    }

    const phi = Math.min(half / radius, maxSweep / 2)
    const tail = Math.max(0, half - phi * radius)

    const ax = -radius * Math.sin(phi)
    const ay = bend * radius * (1 - Math.cos(phi))
    const bx = radius * Math.sin(phi)
    const by = ay

    // Unit tangent at the arc's end is (cos phi, bend * sin phi).
    const sx = ax - tail * Math.cos(phi)
    const sy = ay + bend * tail * Math.sin(phi)
    const ex = bx + tail * Math.cos(phi)
    const ey = by + bend * tail * Math.sin(phi)

    const largeArc = phi * 2 > Math.PI ? 1 : 0
    const sweep = bend > 0 ? 1 : 0
    const n = (v: number) => Math.round(v * 100) / 100

    return [
        `M ${n(sx)} ${n(sy)}`,
        tail > 0.5 ? `L ${n(ax)} ${n(ay)}` : "",
        `A ${n(radius)} ${n(radius)} 0 ${largeArc} ${sweep} ${n(bx)} ${n(by)}`,
        tail > 0.5 ? `L ${n(ex)} ${n(ey)}` : "",
    ]
        .filter(Boolean)
        .join(" ")
}

/**
 * Curve is the steepest tilt the line reaches, at either end of it. Spreading
 * that angle over the whole string keeps the arc smooth whatever the string's
 * length, and stops it doubling back. 0 gives a straight line.
 */
function radiusFromCurve(curveDeg: number, span: number): number {
    const deg = Math.max(0, Math.min(85, curveDeg))
    if (deg < 0.5 || span <= 0) return Infinity
    return span / ((deg * Math.PI) / 180)
}

/** Where a point sits relative to the apex, at a signed distance along the path. */
function pointAtArc(u: number, radius: number, bend: number, phi: number) {
    if (!isFinite(radius)) return { x: u, y: 0, angle: 0 }
    const s = u < 0 ? -1 : 1
    const a = Math.abs(u)
    if (a <= phi * radius) {
        const t = a / radius
        return {
            x: s * radius * Math.sin(t),
            y: bend * radius * (1 - Math.cos(t)),
            angle: s * bend * t,
        }
    }
    const rest = a - phi * radius
    return {
        x: s * (radius * Math.sin(phi) + rest * Math.cos(phi)),
        y: bend * (radius * (1 - Math.cos(phi)) + rest * Math.sin(phi)),
        angle: s * bend * phi,
    }
}

/* -------------------------------------------------------------------------- */
/* Size observer                                                               */
/* -------------------------------------------------------------------------- */

function useElementSize<T extends HTMLElement>() {
    const ref = useRef<T | null>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return

        const read = () => {
            const r = el.getBoundingClientRect()
            setSize((prev) =>
                Math.abs(prev.width - r.width) < 0.5 &&
                Math.abs(prev.height - r.height) < 0.5
                    ? prev
                    : { width: r.width, height: r.height }
            )
        }

        read()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", read)
            return () => window.removeEventListener("resize", read)
        }

        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return [ref, size] as const
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 800
 */
export default function ScrollPathText(props: any) {
    const {
        // content
        text = "SCROLL-DRIVEN TEXT THAT FOLLOWS A CURVED PATH",
        font,
        textColor = "currentColor",
        letterSpacing = 0,
        uppercase = true,

        // type size
        sizeMode = "fluid",
        fluidSize = 11,

        // shape
        curve = 50,
        bend: bendMode = "over",
        anchorX = 50,
        anchorY = 50,
        follow = 100,
        baselineShift = 0,

        // motion
        scrollMode = "pinned",
        scrollLength = 300,
        stickyHeight = 100,
        travel = 100,
        reveal = 35,
        smoothing = 60,

        // caret
        caret = false,
        caretWidth = 4,

        // frame
        background = "transparent",
        radius: cornerRadius = 0,
        padding = 0,

        // dev
        showPath = false,
        previewProgress = 50,

        style,
    } = props

    // True on the canvas, in thumbnails and during export. Everything that
    // moves is switched off behind this: no scroll subscription, no spring,
    // no per-frame writes — just one frame painted at the preview position.
    const staticRender = useIsStaticRenderer()

    // Stable id so multiple instances never share a <path>.
    const uid = useRef("spt-" + Math.random().toString(36).slice(2, 9)).current

    const sectionRef = useRef<HTMLDivElement | null>(null)
    const [boxRef, boxSize] = useElementSize<HTMLDivElement>()
    const measureRef = useRef<SVGTextElement | null>(null)

    const label = uppercase ? String(text).toUpperCase() : String(text)
    const chars = useMemo(() => Array.from(label), [label])

    const W = Math.max(boxSize.width, 1)
    const H = Math.max(boxSize.height, 1)

    const baseFont: any = useMemo(
        () => ({
            fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
            fontSize: 120,
            fontWeight: 700,
            ...(font || {}),
        }),
        [font]
    )

    const fontSize =
        sizeMode === "fluid"
            ? (Math.max(1, Math.min(40, fluidSize)) / 100) * W
            : parseFloat(baseFont.fontSize) || 120

    const fontStyle: any = useMemo(
        () => ({ ...baseFont, fontSize }),
        [baseFont, fontSize]
    )

    /* --- per-character advances ------------------------------------------ */
    // Cumulative offsets come from one probe element, so kerning and letter
    // spacing are baked in and the glyphs land exactly where a single
    // <textPath> would have put them.
    const [metrics, setMetrics] = useState<{ cum: number[]; total: number }>({
        cum: [0],
        total: 0,
    })

    useLayoutEffect(() => {
        let cancelled = false

        const measure = () => {
            const node = measureRef.current
            if (!node || cancelled || chars.length === 0) return
            try {
                const cum: number[] = [0]
                for (let i = 1; i <= chars.length; i++) {
                    cum.push(node.getSubStringLength(0, i))
                }
                const total = cum[cum.length - 1]
                if (!(total > 0)) return
                setMetrics((prev) =>
                    Math.abs(prev.total - total) < 0.5 &&
                    prev.cum.length === cum.length
                        ? prev
                        : { cum, total }
                )
            } catch (e) {
                /* not laid out yet */
            }
        }

        measure()
        const raf = requestAnimationFrame(measure)

        const fonts: any = (document as any).fonts
        if (fonts?.ready?.then) fonts.ready.then(measure)

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
        }
    }, [label, chars.length, fontStyle, letterSpacing])

    /* --- geometry --------------------------------------------------------- */
    const T = metrics.total || W * 1.4
    const MAX_SWEEP = (170 * Math.PI) / 180

    const bend = bendMode === "under" ? -1 : 1
    const followK = Math.max(0, Math.min(100, follow)) / 100
    const ax = (Math.max(0, Math.min(100, anchorX)) / 100) * W
    const ay = (Math.max(0, Math.min(100, anchorY)) / 100) * H

    // The head runs from one end of the string to the other, so the curve is
    // spread over exactly the string and there is no dead scroll at the ends.
    const span = T / 2
    const radius = radiusFromCurve(curve, span)
    const pathLength = T + 2 * W
    const phi = isFinite(radius)
        ? Math.min(pathLength / 2 / radius, MAX_SWEEP / 2)
        : 0

    const d = useMemo(
        () => buildArcPath(pathLength, radius, bend, MAX_SWEEP),
        [pathLength, radius, bend]
    )

    // Offset of the string's first character along the path.
    const startS = pathLength / 2 - T / 2
    const S = (span * Math.max(travel, 1)) / 100

    /* --- scroll ----------------------------------------------------------- */
    const pinned = scrollMode === "pinned" && !staticRender

    /* --- painting --------------------------------------------------------- */
    const paneRef = useRef<HTMLDivElement | null>(null)
    const worldRef = useRef<SVGGElement | null>(null)
    const caretRef = useRef<SVGGElement | null>(null)
    const charRefs = useRef<Array<SVGTextElement | null>>([])
    const lastOpacity = useRef<number[]>([])
    const progressRef = useRef(0)

    const revealK = Math.max(0, Math.min(100, reveal)) / 100

    // Fresh nodes start at opacity 0, so the cache has to forget with them.
    useLayoutEffect(() => {
        lastOpacity.current = []
    }, [chars, metrics])

    const paint = (p: number) => {
        const s = (2 * p - 1) * S
        const at = pointAtArc(s, radius, bend, phi)

        if (worldRef.current) {
            worldRef.current.setAttribute(
                "transform",
                `translate(${(ax - at.x).toFixed(2)} ${(
                    ay -
                    at.y * followK
                ).toFixed(2)})`
            )
        }

        if (caretRef.current) {
            caretRef.current.setAttribute(
                "transform",
                `translate(${ax} ${ay}) rotate(${(
                    (at.angle * 180) /
                    Math.PI
                ).toFixed(2)})`
            )
        }

        // How much of the line the head has passed.
        const typed = s + T / 2
        const cum = metrics.cum

        for (let i = 0; i < chars.length; i++) {
            const el = charRefs.current[i]
            if (!el) continue
            const from = cum[i] ?? 0
            const to = cum[i + 1] ?? from
            const width = Math.max(to - from, 1)
            // A character is fully on once the head reaches its far edge.
            const fade = Math.max(revealK * 2 * width, 0.5)
            const o = Math.max(0, Math.min(1, (typed - (to - fade)) / fade))
            const rounded = Math.round(o * 100) / 100
            if (lastOpacity.current[i] !== rounded) {
                lastOpacity.current[i] = rounded
                el.style.opacity = String(rounded)
            }
        }
    }

    // The loop reaches paint through a ref, so a settings change never leaves
    // a stale closure running and never restarts the easing mid-flight.
    const paintRef = useRef(paint)
    useLayoutEffect(() => {
        paintRef.current = paint
        if (!staticRender) paint(progressRef.current)
    })

    /* --- viewport gate ----------------------------------------------------
       Nothing is subscribed while the section is off screen. An instance that
       nobody can see costs exactly one IntersectionObserver entry.           */

    const [inView, setInView] = useState(true)

    useEffect(() => {
        if (staticRender) return
        const el = boxRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) setInView(entry.isIntersecting)
            },
            // a screen of slack either side, so it is already caught up by
            // the time the first pixel of it appears
            { rootMargin: "100% 0px 100% 0px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [staticRender])

    /* --- the scroll loop --------------------------------------------------
       Progress is measured from the element's own rect, so it works under any
       scroll implementation, including transform-based smooth scrolling. The
       loop only exists while the section is in view, and it parks itself as
       soon as the easing has caught up with the scroll position.             */

    useEffect(() => {
        if (staticRender || !inView) return

        let raf = 0
        let running = false
        let current = progressRef.current

        const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

        const measure = () => {
            const vh = window.innerHeight || 1
            if (pinned) {
                const el = sectionRef.current
                if (!el) return 0
                const r = el.getBoundingClientRect()
                const pane = paneRef.current?.offsetHeight || vh
                const run = r.height - pane
                return run <= 0 ? 0 : clamp01(-r.top / run)
            }
            const el = boxRef.current
            if (!el) return 0
            const r = el.getBoundingClientRect()
            const run = vh + r.height
            return run <= 0 ? 0 : clamp01((vh - r.top) / run)
        }

        const ease =
            0.06 + (1 - Math.max(0, Math.min(100, smoothing)) / 100) * 0.94

        const frame = () => {
            const target = measure()
            current += (target - current) * ease
            if (Math.abs(target - current) < 0.0002) current = target
            progressRef.current = current
            paintRef.current(current)
            if (current !== target) {
                raf = requestAnimationFrame(frame)
            } else {
                running = false
                raf = 0
            }
        }

        const kick = () => {
            if (running) return
            running = true
            raf = requestAnimationFrame(frame)
        }

        // Snap on the way in rather than easing from a stale position.
        current = measure()
        progressRef.current = current
        paintRef.current(current)

        window.addEventListener("scroll", kick, { passive: true })
        window.addEventListener("resize", kick)

        return () => {
            window.removeEventListener("scroll", kick)
            window.removeEventListener("resize", kick)
            if (raf) cancelAnimationFrame(raf)
            running = false
        }
    }, [staticRender, inView, pinned, smoothing])

    // The Framer canvas has no scroll, so freeze at a chosen position.
    const staticP = Math.max(0, Math.min(100, previewProgress)) / 100
    useLayoutEffect(() => {
        if (staticRender) paint(staticP)
    })

    /* --- nodes ------------------------------------------------------------ */
    const textProps: any = {
        ...fontStyle,
        fill: textColor,
        letterSpacing,
        dominantBaseline: "middle",
        style: {
            ...fontStyle,
            letterSpacing,
            whiteSpace: "pre",
        },
    }

    const svg = (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: "block", overflow: "visible" }}
            aria-hidden
        >
            <defs>
                <path id={uid} d={d} fill="none" />
            </defs>

            {/* probe: one laid-out copy of the string, used for its metrics */}
            <text
                ref={measureRef}
                x={0}
                y={-9999}
                visibility="hidden"
                {...textProps}
            >
                {label}
            </text>

            <g ref={worldRef}>
                {showPath && (
                    <use
                        href={`#${uid}`}
                        stroke={textColor}
                        strokeWidth={1}
                        strokeOpacity={0.3}
                        fill="none"
                    />
                )}
                {chars.map((ch, i) =>
                    ch.trim() === "" ? null : (
                        <text
                            key={i}
                            ref={(el) => {
                                charRefs.current[i] = el
                            }}
                            {...textProps}
                            textAnchor="start"
                            dy={baselineShift}
                            opacity={0}
                        >
                            <textPath
                                href={`#${uid}`}
                                startOffset={startS + (metrics.cum[i] ?? 0)}
                            >
                                {ch}
                            </textPath>
                        </text>
                    )
                )}
            </g>

            {caret && (
                <g ref={caretRef}>
                    <rect
                        x={-caretWidth / 2}
                        y={-fontSize * 0.42}
                        width={caretWidth}
                        height={fontSize * 0.84}
                        fill={textColor}
                    />
                </g>
            )}
        </svg>
    )

    const box = (
        <div
            ref={boxRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                borderRadius: cornerRadius,
                overflow: "hidden",
                color: "inherit",
            }}
        >
            {svg}
            {/* The glyphs are drawn as separate nodes and faded in, so the SVG
                is hidden from assistive tech and the line is offered here once,
                whole and in reading order. */}
            <span
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    margin: -1,
                    padding: 0,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    clipPath: "inset(50%)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {label}
            </span>
        </div>
    )

    if (!pinned) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    padding,
                    boxSizing: "border-box",
                }}
            >
                {box}
            </div>
        )
    }

    return (
        <div
            ref={sectionRef}
            style={{
                ...style,
                width: "100%",
                // The layer's own height wins when it is tall enough, so the
                // page keeps its normal stacking. Length is the floor.
                height: "100%",
                minHeight: `${Math.max(scrollLength, 100)}vh`,
                position: "relative",
            }}
        >
            <div
                ref={paneRef}
                style={{
                    position: "sticky",
                    top: 0,
                    height: `${stickyHeight}vh`,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding,
                    boxSizing: "border-box",
                }}
            >
                {box}
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Property controls                                                           */
/* -------------------------------------------------------------------------- */

addPropertyControls(ScrollPathText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "SCROLL-DRIVEN TEXT THAT FOLLOWS A CURVED PATH",
        displayTextArea: true,
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 120,
            fontWeight: 700,
            lineHeight: 1,
        },
    },
    sizeMode: {
        type: ControlType.Enum,
        title: "Size",
        defaultValue: "fluid",
        options: ["fluid", "fixed"],
        optionTitles: ["Fluid", "Fixed"],
        displaySegmentedControl: true,
        description:
            "Fluid scales the type with the frame's width, which is what a full-bleed section wants. Fixed uses the size set on Font.",
    },
    fluidSize: {
        type: ControlType.Number,
        title: "Type size",
        defaultValue: 11,
        min: 2,
        max: 40,
        step: 0.5,
        unit: "%",
        hidden: (p: any) => p.sizeMode === "fixed",
        description: "Font size as a share of the frame's width.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: 0,
        min: -20,
        max: 40,
        step: 0.5,
        displayStepper: true,
    },

    curve: {
        type: ControlType.Number,
        title: "Curve",
        defaultValue: 50,
        min: 0,
        max: 85,
        step: 1,
        unit: "°",
        description:
            "The steepest tilt the line reaches, at its far ends. Spread over the whole string, so it holds however long the text is. 0 is a straight line.",
    },
    bend: {
        type: ControlType.Enum,
        title: "Bend",
        defaultValue: "over",
        options: ["over", "under"],
        optionTitles: ["Over ⌒", "Under ⌄"],
        displaySegmentedControl: true,
    },

    anchorX: {
        type: ControlType.Number,
        title: "Anchor X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description:
            "Where in the frame characters appear. Everything already typed trails off to the left of it.",
    },
    anchorY: {
        type: ControlType.Number,
        title: "Anchor Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    follow: {
        type: ControlType.Number,
        title: "Follow",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description:
            "How much of the path's rise and fall the camera tracks. 100 pins the typing point to the anchor; 0 pans sideways only and lets the line drift out of frame.",
    },
    baselineShift: {
        type: ControlType.Number,
        title: "Baseline",
        defaultValue: 0,
        min: -200,
        max: 200,
        step: 1,
    },

    scrollMode: {
        type: ControlType.Enum,
        title: "Scroll",
        defaultValue: "pinned",
        options: ["pinned", "inline"],
        optionTitles: ["Pinned section", "In flow"],
        displaySegmentedControl: true,
    },
    scrollLength: {
        type: ControlType.Number,
        title: "Length",
        defaultValue: 300,
        min: 100,
        max: 1000,
        step: 25,
        unit: "vh",
        hidden: (p: any) => p.scrollMode !== "pinned",
        description:
            "Minimum scroll the animation is spread across. Set the layer's own height (Framer takes vh) to control it exactly.",
    },
    stickyHeight: {
        type: ControlType.Number,
        title: "Pane",
        defaultValue: 100,
        min: 20,
        max: 100,
        step: 5,
        unit: "vh",
        hidden: (p: any) => p.scrollMode !== "pinned",
    },
    travel: {
        type: ControlType.Number,
        title: "Travel",
        defaultValue: 100,
        min: 20,
        max: 200,
        step: 5,
        unit: "%",
        description:
            "100 ends with the last character landing on the anchor. Above 100 keeps going, so the finished line sweeps off to the left.",
    },
    reveal: {
        type: ControlType.Number,
        title: "Reveal",
        defaultValue: 35,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description:
            "How softly each character arrives. 0 is a hard typewriter snap; higher fades it in over the last stretch before it lands.",
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },

    caret: {
        type: ControlType.Boolean,
        title: "Caret",
        defaultValue: false,
    },
    caretWidth: {
        type: ControlType.Number,
        title: "Caret width",
        defaultValue: 4,
        min: 1,
        max: 40,
        step: 1,
        hidden: (p: any) => !p.caret,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
    },

    previewProgress: {
        type: ControlType.Number,
        title: "Preview",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description:
            "Position shown on the canvas, where there is no scrolling.",
    },
    showPath: {
        type: ControlType.Boolean,
        title: "Show path",
        defaultValue: false,
    },
})
