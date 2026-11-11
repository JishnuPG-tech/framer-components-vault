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


// ─── Inline CSS ────────────────────────────────────────────────────────────────
const CSS = `
.ce-scroll::-webkit-scrollbar { display: none; }
.ce-scroll { scrollbar-width: none; -ms-overflow-style: none; }
`

// ─── Circle transitions data ───────────────────────────────────────────────────
function buildCircleTransitions() {
    const d = 80
    const cx = 960
    const cy = 540
    const raw: [number, number, number][] = [
        [cx - 3 * d, cy, d * 0.8],
        [cx + 3 * d, cy, d * 0.8],
        [cx, cy - 3 * d, d * 0.8],
        [cx, cy + 3 * d, d * 0.8],
        [cx - 2 * d, cy - 2 * d, d * 0.6],
        [cx + 2 * d, cy - 2 * d, d * 0.6],
        [cx - 2 * d, cy + 2 * d, d * 0.6],
        [cx + 2 * d, cy + 2 * d, d * 0.6],
        [cx - 4 * d, cy, d * 0.4],
        [cx + 4 * d, cy, d * 0.4],
        [cx, cy - 4 * d, d * 0.4],
        [cx, cy + 4 * d, d * 0.4],
        [cx, cy, d * 0.3],
    ]
    return raw.map(([icx, icy, ir]) => ({
        icx,
        icy,
        ir,
        fcx: cx,
        fcy: cy,
        fr: 4 * d,
    }))
}

function buildGridLines() {
    const lines: {
        key: string
        x1: number
        y1: number
        x2: number
        y2: number
    }[] = []
    const g = 48
    for (let i = 0; i <= 40; i++) {
        lines.push({ key: `v${i}`, x1: i * g, y1: 0, x2: i * g, y2: 1080 })
        if (i <= 22)
            lines.push({ key: `h${i}`, x1: 0, y1: i * g, x2: 1920, y2: i * g })
    }
    return lines
}

const CIRCLE_TRANSITIONS = buildCircleTransitions()
const GRID_LINES = buildGridLines()

// ─── Shared SVG layer ──────────────────────────────────────────────────────────
function GeometrySVG({
    progress,
    showGrid,
    gridColor,
}: {
    progress: number
    showGrid: boolean
    gridColor: string
}) {
    const gridOp = showGrid ? Math.max(0, 0.3 * (1 - progress * 1.5)) : 0
    return (
        <svg
            viewBox="0 0 1920 1080"
            style={{ width: "100%", height: "100%" }}
            preserveAspectRatio="xMidYMid slice"
        >
            <g>
                {GRID_LINES.map((l) => (
                    <line
                        key={l.key}
                        x1={l.x1}
                        y1={l.y1}
                        x2={l.x2}
                        y2={l.y2}
                        stroke={gridColor}
                        strokeWidth={1}
                        strokeOpacity={gridOp}
                        shapeRendering="crispEdges"
                    />
                ))}
            </g>
            <g>
                {CIRCLE_TRANSITIONS.map((t, i) => {
                    const cx = t.icx + (t.fcx - t.icx) * progress
                    const cy = t.icy + (t.fcy - t.icy) * progress
                    const r = t.ir + (t.fr - t.ir) * progress
                    const rot = progress * 360 * (i % 2 === 0 ? 1 : -1)
                    const op = Math.max(0.1, 1 - progress * 0.7)
                    return (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            stroke="rgba(245,245,245,0.3)"
                            strokeWidth={1}
                            fill="rgba(245,245,245,0.05)"
                            strokeOpacity={op}
                            fillOpacity={op * 0.05}
                            transform={`rotate(${rot} ${cx} ${cy})`}
                            vectorEffect="non-scaling-stroke"
                        />
                    )
                })}
            </g>
        </svg>
    )
}

// ─── Main Component ────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function CreativeExperience(props: {
    backgroundColor: string
    accentGlowColor: string
    circleSize: number
    maxCircleScale: number
    glowIntensity: number
    showGrid: boolean
    gridColor: string
    section1Image?: string
    section2Image?: string
    section3Image?: string
    style?: React.CSSProperties
}) {
    const {
        backgroundColor,
        accentGlowColor,
        circleSize,
        maxCircleScale,
        glowIntensity,
        showGrid,
        gridColor,
        section1Image,
        section2Image,
        section3Image,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const s1 =
        section1Image || "https://assets.codepen.io/7558/blue-orange-003.jpg"
    const s2 =
        section2Image || "https://assets.codepen.io/7558/blue-orange-001.jpg"
    const s3 =
        section3Image || "https://assets.codepen.io/7558/blue-orange-002.jpg"

    // ── Scroll animation state ───────────────────────────────────────────────
    const [progress, setProgress] = React.useState(0)
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const rafRef = React.useRef(0)

    const updateScroll = React.useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const max = el.scrollHeight - el.clientHeight
        const p = max > 0 ? Math.min(el.scrollTop / max, 1) : 0
        setProgress(p)
    }, [])

    React.useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        const onScroll = () => {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(updateScroll)
        }
        el.addEventListener("scroll", onScroll, { passive: true })
        updateScroll()
        return () => {
            el.removeEventListener("scroll", onScroll)
            cancelAnimationFrame(rafRef.current)
        }
    }, [updateScroll])

    // ── Derived animation values ─────────────────────────────────────────────
    const circleScale = 1 + progress * (maxCircleScale - 1)
    const shadowSize = progress * 150 * glowIntensity
    const shadowSpread = progress * 35 * glowIntensity
    const glowShadow =
        progress > 0.01
            ? `0 0 ${shadowSize}px ${shadowSpread}px ${accentGlowColor}`
            : "none"

    // ── Canvas placeholder ───────────────────────────────────────────────────
    if (isCanvas) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    overflow: "hidden",
                    background: backgroundColor,
                }}
            >
                <style>{CSS}</style>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 50,
                        pointerEvents: "none",
                    }}
                >
                    <GeometrySVG
                        progress={0}
                        showGrid={showGrid}
                        gridColor={gridColor}
                    />
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        zIndex: 60,
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            width: circleSize,
                            height: circleSize,
                            background: "#ffffff",
                            borderRadius: "50%",
                        }}
                    />
                </div>
                <div
                    style={{
                        position: "absolute",
                        bottom: 20,
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "rgba(245,245,245,0.35)",
                        fontSize: 11,
                        fontFamily: "'Courier New', monospace",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        whiteSpace: "nowrap",
                        zIndex: 100,
                    }}
                >
                    Scroll to animate — preview in browser
                </div>
            </div>
        )
    }

    // ── Full render ──────────────────────────────────────────────────────────
    return (
        <div
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
            }}
        >
            <style>{CSS}</style>

            {/* ── Geometric SVG background ────────────────────────────────── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 50,
                    pointerEvents: "none",
                }}
            >
                <GeometrySVG
                    progress={progress}
                    showGrid={showGrid}
                    gridColor={gridColor}
                />
            </div>

            {/* ── Center glowing circle ───────────────────────────────────── */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    zIndex: 60,
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        width: circleSize,
                        height: circleSize,
                        background: "#ffffff",
                        borderRadius: "50%",
                        transform: `scale(${circleScale})`,
                        transformOrigin: "center center",
                        boxShadow: glowShadow,
                    }}
                />
            </div>

            {/* ── Scrollable content ──────────────────────────────────────── */}
            <div
                ref={scrollRef}
                className="ce-scroll"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflowY: "auto",
                    zIndex: 10,
                }}
            >
                {/* Initial viewport spacer */}
                <div style={{ height: "100vh" }} />

                {/* Section 1 */}
                <div
                    style={{
                        height: "200vh",
                        backgroundImage: `url(${s1})`,
                        backgroundSize: "cover",
                        backgroundPosition: "50% 50%",
                    }}
                />

                {/* Section 2 */}
                <div
                    style={{
                        height: "200vh",
                        backgroundImage: `url(${s2})`,
                        backgroundSize: "cover",
                        backgroundPosition: "50% 50%",
                    }}
                />

                {/* Section 3 */}
                <div
                    style={{
                        height: "200vh",
                        backgroundImage: `url(${s3})`,
                        backgroundSize: "cover",
                        backgroundPosition: "50% 50%",
                    }}
                />
            </div>
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
CreativeExperience.defaultProps = {
    backgroundColor: "#0a0a0a",
    accentGlowColor: "rgba(255, 255, 0, 1)",
    circleSize: 80,
    maxCircleScale: 2.8,
    glowIntensity: 1,
    showGrid: true,
    gridColor: "rgba(245,245,245,0.15)",
}

// ─── Property Controls ────────────────────────────────────────────────────────
addPropertyControls(CreativeExperience, {
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#0a0a0a",
    },
    accentGlowColor: {
        title: "Glow Color",
        type: ControlType.Color,
        defaultValue: "rgba(255, 255, 0, 1)",
        description: "Center circle glow color at max scroll depth",
    },
    circleSize: {
        title: "Circle Size",
        type: ControlType.Number,
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "Base diameter of the center circle",
    },
    maxCircleScale: {
        title: "Max Scale",
        type: ControlType.Number,
        defaultValue: 2.8,
        min: 1,
        max: 8,
        step: 0.1,
        displayStepper: true,
        description: "How large the circle grows at full scroll depth",
    },
    glowIntensity: {
        title: "Glow Intensity",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
        displayStepper: true,
        description: "Multiplier for the glow shadow size",
    },
    showGrid: {
        title: "Grid",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    gridColor: {
        title: "Grid Color",
        type: ControlType.Color,
        defaultValue: "rgba(245,245,245,0.15)",
        hidden: (p) => !p.showGrid,
    },
    section1Image: {
        title: "Section 1 Img",
        type: ControlType.Image,
        description: "Background for first section",
    },
    section2Image: {
        title: "Section 2 Img",
        type: ControlType.Image,
        description: "Background for second section",
    },
    section3Image: {
        title: "Section 3 Img",
        type: ControlType.Image,
        description: "Background for third section",
    },
})
