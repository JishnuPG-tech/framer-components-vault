import * as React from "react"
import { useRef, useEffect, useCallback, useId } from "react"
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
 * JellyButton
 * -----------
 * A customizable button whose outline behaves like soft jelly/rubber when the
 * cursor moves near its edge. The outline is sampled around a rounded rectangle
 * or pill shape based on `borderRadius`. If `borderRadius` is 0, the corners
 * remain perfectly sharp while the edges still stretch.
 *
 * Accessibility: renders as a semantic <button> (or <a> when a link is set)
 * so it gets native keyboard support (Enter/Space, or Enter for links),
 * focus handling, and correct screen-reader semantics for free — plus a
 * visible focus ring via :focus-visible.
 */

type Point = {
    x: number
    y: number
    nx: number
    ny: number
    isCorner?: boolean
}

function buildShapePoints(
    w: number,
    h: number,
    borderRadius: number,
    count: number
): Point[] {
    const r = Math.min(Math.max(0, borderRadius), w / 2, h / 2)
    const wTop = Math.max(w - 2 * r, 0)
    const hRight = Math.max(h - 2 * r, 0)
    const wBottom = Math.max(w - 2 * r, 0)
    const hLeft = Math.max(h - 2 * r, 0)
    const arcLen = (Math.PI * r) / 2

    const perim = wTop + hRight + wBottom + hLeft + 4 * arcLen
    const pts: Point[] = []
    const diag = Math.SQRT1_2 // 0.707 for diagonal normals on sharp corners

    const segments = [
        // 0: Top Edge
        { len: wTop, get: (t) => ({ x: r + t * wTop, y: 0, nx: 0, ny: -1 }) },
        // 1: TR Arc
        {
            len: arcLen,
            cornerNorm: [diag, -diag],
            get: (t) => {
                const a = -Math.PI / 2 + t * (Math.PI / 2)
                return {
                    x: w - r + r * Math.cos(a),
                    y: r + r * Math.sin(a),
                    nx: Math.cos(a),
                    ny: Math.sin(a),
                }
            },
        },
        // 2: Right Edge
        {
            len: hRight,
            get: (t) => ({ x: w, y: r + t * hRight, nx: 1, ny: 0 }),
        },
        // 3: BR Arc
        {
            len: arcLen,
            cornerNorm: [diag, diag],
            get: (t) => {
                const a = t * (Math.PI / 2)
                return {
                    x: w - r + r * Math.cos(a),
                    y: h - r + r * Math.sin(a),
                    nx: Math.cos(a),
                    ny: Math.sin(a),
                }
            },
        },
        // 4: Bottom Edge
        {
            len: wBottom,
            get: (t) => ({ x: w - r - t * wBottom, y: h, nx: 0, ny: 1 }),
        },
        // 5: BL Arc
        {
            len: arcLen,
            cornerNorm: [-diag, diag],
            get: (t) => {
                const a = Math.PI / 2 + t * (Math.PI / 2)
                return {
                    x: r + r * Math.cos(a),
                    y: h - r + r * Math.sin(a),
                    nx: Math.cos(a),
                    ny: Math.sin(a),
                }
            },
        },
        // 6: Left Edge
        {
            len: hLeft,
            get: (t) => ({ x: 0, y: h - r - t * hLeft, nx: -1, ny: 0 }),
        },
        // 7: TL Arc
        {
            len: arcLen,
            cornerNorm: [-diag, -diag],
            get: (t) => {
                const a = Math.PI + t * (Math.PI / 2)
                return {
                    x: r + r * Math.cos(a),
                    y: r + r * Math.sin(a),
                    nx: Math.cos(a),
                    ny: Math.sin(a),
                }
            },
        },
    ]

    for (let s = 0; s < segments.length; s++) {
        const seg = segments[s]
        if (seg.len <= 0) continue // Skip 0-length arcs/edges

        const segCount = Math.max(1, Math.round((seg.len / perim) * count))
        for (let i = 0; i < segCount; i++) {
            const t = i / segCount
            const p = seg.get(t) as Point

            // If radius is 0, the very first point of every straight edge is a sharp corner
            if (r === 0 && t === 0) {
                p.isCorner = true
                const prevArc = segments[(s + 7) % 8]
                if (prevArc.cornerNorm) {
                    p.nx = prevArc.cornerNorm[0]
                    p.ny = prevArc.cornerNorm[1]
                }
            } else {
                p.isCorner = false
            }

            pts.push(p)
        }
    }
    return pts
}

// Closed Catmull-Rom spline, breaking tension at sharp corners.
function pointsToSmoothPath(pts: Point[]): string {
    const n = pts.length
    if (n < 3) return ""
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `

    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n]
        const p1 = pts[i]
        const p2 = pts[(i + 1) % n]
        const p3 = pts[(i + 2) % n]

        // If p1 is a sharp corner, don't smooth its outgoing tangent
        const c1x = p1.isCorner ? p1.x : p1.x + (p2.x - p0.x) / 6
        const c1y = p1.isCorner ? p1.y : p1.y + (p2.y - p0.y) / 6

        // If p2 is a sharp corner, don't smooth its incoming tangent
        const c2x = p2.isCorner ? p2.x : p2.x - (p3.x - p1.x) / 6
        const c2y = p2.isCorner ? p2.y : p2.y - (p3.y - p1.y) / 6

        d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `
    }
    d += "Z"
    return d
}

export default function JellyButton(props) {
    const {
        text,
        link,
        openInNewTab,
        onClick: externalOnClick,
        font,
        textColor,
        baseColor,
        shadowColor,
        showGlow,
        glowColor,
        glowOpacity,
        paddingX,
        paddingY,
        borderRadius,
        segments,
        reactRadius,
        strength,
        stiffness,
        damping,
        smoothPasses,
        style,
        ...rest
    } = props

    const wrapRef = useRef<HTMLElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const basePathRef = useRef<SVGPathElement>(null)
    const sheenPathRef = useRef<SVGPathElement>(null)

    const basePoints = useRef<Point[]>([])
    const offsets = useRef<Float32Array>(new Float32Array(0))
    const velocities = useRef<Float32Array>(new Float32Array(0))
    const size = useRef({ w: 0, h: 0 })
    const mouse = useRef({ x: 0, y: 0, active: false })
    const rafId = useRef<number | null>(null)

    const isStatic = useIsStaticRenderer()

    // Unique, per-instance class so the :focus-visible ring below never
    // collides with other instances of this component on the same page.
    const rawId = useId().replace(/[^a-zA-Z0-9]/g, "")
    const focusClass = `jb-focus-${rawId}`

    const rebuildPoints = useCallback(() => {
        const el = wrapRef.current
        if (!el) return
        const w = el.clientWidth
        const h = el.clientHeight
        if (w <= 0 || h <= 0) return

        size.current = { w, h }
        const requestedCount = Math.max(12, Math.round(segments))

        // Build points
        const newPoints = buildShapePoints(w, h, borderRadius, requestedCount)
        basePoints.current = newPoints

        const actualCount = newPoints.length
        offsets.current = new Float32Array(actualCount * 2)
        velocities.current = new Float32Array(actualCount * 2)

        if (svgRef.current) {
            svgRef.current.setAttribute("viewBox", `0 0 ${w} ${h}`)
        }
    }, [segments, borderRadius])

    useEffect(() => {
        if (isStatic) return
        rebuildPoints()
        const ro = new ResizeObserver(() => rebuildPoints())
        if (wrapRef.current) ro.observe(wrapRef.current)
        return () => ro.disconnect()
    }, [isStatic, rebuildPoints])

    useEffect(() => {
        if (isStatic) return

        const onMove = (e: PointerEvent) => {
            const el = wrapRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const pad = reactRadius
            const withinPaddedBox =
                e.clientX > rect.left - pad &&
                e.clientX < rect.right + pad &&
                e.clientY > rect.top - pad &&
                e.clientY < rect.bottom + pad

            if (!withinPaddedBox) {
                mouse.current.active = false
                return
            }
            mouse.current.x = e.clientX - rect.left
            mouse.current.y = e.clientY - rect.top
            mouse.current.active = true
        }
        const onLeave = () => {
            mouse.current.active = false
        }

        window.addEventListener("pointermove", onMove, { passive: true })
        window.addEventListener("pointerdown", onMove, { passive: true })
        window.addEventListener("pointercancel", onLeave)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerdown", onMove)
            window.removeEventListener("pointercancel", onLeave)
        }
    }, [isStatic, reactRadius])

    const targetBuf = useRef<Float32Array>(new Float32Array(0))
    const targetBufSwap = useRef<Float32Array>(new Float32Array(0))

    useEffect(() => {
        if (isStatic) return

        const tick = () => {
            const pts = basePoints.current
            const offs = offsets.current
            const vels = velocities.current
            const { active, x: mx, y: my } = mouse.current
            const n = pts.length

            if (targetBuf.current.length !== n * 2) {
                targetBuf.current = new Float32Array(n * 2)
                targetBufSwap.current = new Float32Array(n * 2)
            }
            const targets = targetBuf.current

            for (let i = 0; i < n; i++) {
                let tx = 0
                let ty = 0
                if (active) {
                    const dx = mx - pts[i].x
                    const dy = my - pts[i].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < reactRadius) {
                        const falloff = 1 - dist / reactRadius
                        tx = pts[i].nx * strength * falloff
                        ty = pts[i].ny * strength * falloff
                    }
                }
                targets[i * 2] = tx
                targets[i * 2 + 1] = ty
            }

            const src = targets
            const dst = targetBufSwap.current
            for (let pass = 0; pass < smoothPasses; pass++) {
                for (let i = 0; i < n; i++) {
                    const prev = ((i - 1 + n) % n) * 2
                    const next = ((i + 1) % n) * 2
                    const cur = i * 2
                    dst[cur] =
                        src[prev] * 0.25 + src[cur] * 0.5 + src[next] * 0.25
                    dst[cur + 1] =
                        src[prev + 1] * 0.25 +
                        src[cur + 1] * 0.5 +
                        src[next + 1] * 0.25
                }
                dst.forEach((v, idx) => (src[idx] = v))
            }

            for (let i = 0; i < n; i++) {
                const ix = i * 2
                const iy = i * 2 + 1
                const tx = targets[ix]
                const ty = targets[iy]
                vels[ix] += (tx - offs[ix]) * stiffness
                vels[iy] += (ty - offs[iy]) * stiffness
                vels[ix] *= damping
                vels[iy] *= damping
                offs[ix] += vels[ix]
                offs[iy] += vels[iy]
            }

            const displaced = pts.map((p, i) => ({
                x: p.x + offs[i * 2],
                y: p.y + offs[i * 2 + 1],
                isCorner: p.isCorner,
            }))

            const d = pointsToSmoothPath(displaced)

            if (basePathRef.current) basePathRef.current.setAttribute("d", d)
            if (sheenPathRef.current) sheenPathRef.current.setAttribute("d", d)

            rafId.current = requestAnimationFrame(tick)
        }

        rafId.current = requestAnimationFrame(tick)
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current)
        }
    }, [isStatic, reactRadius, strength, stiffness, damping, smoothPasses])

    const staticPath = isStatic
        ? (() => {
              const w = 240
              const h = 72
              return pointsToSmoothPath(
                  buildShapePoints(w, h, borderRadius, 48)
              )
          })()
        : ""

    const linkUrl =
        typeof link === "string"
            ? link
            : link && typeof link === "object" && link.url
              ? link.url
              : ""
    const hasLink = Boolean(linkUrl)

    const handleClick = (e: React.MouseEvent) => {
        externalOnClick?.(e)
        // Native <a href> already navigates on its own; nothing extra needed
        // here for the link case. For the plain <button> case there's no
        // default action — this is just where a consumer's onClick runs.
    }

    const rootStyle: React.CSSProperties = {
        ...style,
        position: "relative",
        display: "inline-block",
        width: style?.width ?? "100%",
        height: style?.height ?? "100%",
        cursor: "pointer",
        overflow: "visible",
        userSelect: "none",
        // Reset native <button>/<a> chrome — the SVG underneath supplies
        // all visible styling, so the element itself should be invisible
        // except for its (custom) focus ring.
        background: "none",
        border: "none",
        margin: 0,
        padding: 0,
        font: "inherit",
        color: "inherit",
        textDecoration: "none",
        textAlign: "left",
        WebkitAppearance: "none",
        appearance: "none",
        outline: "none",
        borderRadius: `${Math.min(borderRadius, 999)}px`,
    }

    const sharedProps = {
        ...rest,
        ref: wrapRef,
        className: [rest.className, focusClass].filter(Boolean).join(" "),
        style: rootStyle,
        onClick: handleClick,
    }

    const content = (
        <>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                    filter: `drop-shadow(0px 10px 24px ${shadowColor})`,
                }}
                preserveAspectRatio="none"
                viewBox={isStatic ? "0 0 240 72" : undefined}
            >
                <defs>
                    {showGlow && (
                        <radialGradient id="jb-sheen" cx="35%" cy="20%" r="80%">
                            <stop
                                offset="0%"
                                stopColor={glowColor}
                                stopOpacity={glowOpacity}
                            />
                            <stop
                                offset="45%"
                                stopColor={glowColor}
                                stopOpacity={glowOpacity * 0.24}
                            />
                            <stop
                                offset="100%"
                                stopColor={glowColor}
                                stopOpacity={0}
                            />
                        </radialGradient>
                    )}
                </defs>

                <path
                    ref={basePathRef}
                    d={isStatic ? staticPath : undefined}
                    fill={baseColor}
                />
                {showGlow && (
                    <path
                        ref={sheenPathRef}
                        d={isStatic ? staticPath : undefined}
                        fill="url(#jb-sheen)"
                        style={{ pointerEvents: "none" }}
                    />
                )}
            </svg>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: textColor,
                    letterSpacing: "0.01em",
                    pointerEvents: "none",
                    boxSizing: "border-box",
                    padding: `${paddingY}px ${paddingX}px`,
                    whiteSpace: "nowrap",
                    ...font,
                }}
            >
                {text}
            </div>

            {/* Scoped focus-visible ring — only shown for keyboard focus,
                not on mouse click, and unique per instance. */}
            <style>{`
                .${focusClass}:focus-visible {
                    outline: 2px solid #7EC8FF;
                    outline-offset: 3px;
                }
            `}</style>
        </>
    )

    if (hasLink) {
        return (
            <a
                {...sharedProps}
                href={linkUrl}
                target={openInNewTab ? "_blank" : undefined}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
            >
                {content}
            </a>
        )
    }

    return (
        <button type="button" {...sharedProps}>
            {content}
        </button>
    )
}

JellyButton.defaultProps = {
    text: "Explore",
    link: "",
    openInNewTab: false,
    font: {
        fontFamily: "Inter, sans-serif",
        fontSize: 20,
        fontWeight: 700,
        lineHeight: "1.4em",
    },
    textColor: "#F2F6FF",
    baseColor: "#1B3E9C",
    shadowColor: "rgba(10, 20, 60, 0.55)",
    showGlow: true,
    glowColor: "#FFFFFF",
    glowOpacity: 0.25,
    paddingX: 28,
    paddingY: 14,
    borderRadius: 36,
    segments: 64,
    reactRadius: 80,
    strength: 12,
    stiffness: 0.22,
    damping: 0.75,
    smoothPasses: 5,
}

addPropertyControls(JellyButton, {
    text: { type: ControlType.String, title: "Text", defaultValue: "Explore" },
    link: { type: ControlType.Link, title: "Link" },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Open link in a new browser tab.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter, sans-serif",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: "1.4em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#F2F6FF",
    },
    baseColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#1B3E9C",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow",
        defaultValue: "rgba(10, 20, 60, 0.55)",
    },
    showGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showGlow,
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Opacity",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.showGlow,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 28,
        min: 0,
        max: 120,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 14,
        min: 0,
        max: 80,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 36,
        min: 0,
        max: 200,
        step: 1,
        description: "Corner radius of the button. Set to 0 for sharp corners.",
    },
    segments: {
        type: ControlType.Number,
        title: "Smoothness",
        defaultValue: 64,
        min: 16,
        max: 120,
        step: 4,
        description: "Number of points around the edge.",
    },
    reactRadius: {
        type: ControlType.Number,
        title: "React Radius",
        defaultValue: 80,
        min: 20,
        max: 240,
        description: "How close the cursor needs to be to trigger jelly.",
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 12,
        min: 0,
        max: 100,
        description: "Controls how far the edge stretches toward the cursor.",
    },
    smoothPasses: {
        type: ControlType.Number,
        title: "Cohesion",
        defaultValue: 5,
        min: 0,
        max: 10,
        step: 1,
        description:
            "Blends the pull across neighboring points to keep shapes smooth.",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 0.22,
        min: 0.02,
        max: 1,
        step: 0.01,
        description: "Higher values make the button snap back faster.",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 0.75,
        min: 0.3,
        max: 0.98,
        step: 0.01,
        description:
            "Controls how quickly the wobbly oscillation settles down.",
    },
})
