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


// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_LINES = [
    "BOCELLI",
    "BARCELONA",
    "TOKYO",
    "BUDAPEST",
    "HIROSHI",
    "MADRID",
    "ISTANBUL",
    "NAIROBI",
    "SEOUL",
    "BUENOS AIRES",
    "OSLO",
    "CAIRO",
    "JAKARTA",
    "LISBON",
    "TAIPEI",
    "MEXICO CITY",
    "ZURICH",
    "DUBAI",
]

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function FoldingDOM(props: any) {
    const {
        lines = DEFAULT_LINES,
        font,
        textColor = "#e3e5eb",
        bgColor = "#0f0f11",
        foldAngle = 65,
        mouseFollow = true,
        scrollSpeed = 80,
        scrollMode = "auto",
        textAlign = "left",
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // DOM refs — direct manipulation avoids React re-renders every frame
    const containerRef = React.useRef<HTMLDivElement>(null)
    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const topFoldRef = React.useRef<HTMLDivElement>(null)
    const centerFoldRef = React.useRef<HTMLDivElement>(null)
    const bottomFoldRef = React.useRef<HTMLDivElement>(null)
    const topContentRef = React.useRef<HTMLDivElement>(null)
    const centerContentRef = React.useRef<HTMLDivElement>(null)
    const bottomContentRef = React.useRef<HTMLDivElement>(null)
    const rafRef = React.useRef(0)

    // Prop mirrors — updated via individual effects so the RAF callback
    // always reads the latest value without needing to re-run
    const foldAngleRef = React.useRef(foldAngle)
    const scrollSpeedRef = React.useRef(scrollSpeed)
    const mouseFollowRef = React.useRef(mouseFollow)
    const scrollModeRef = React.useRef(scrollMode)
    // Captures component's viewport-top at the moment "scroll" mode activates.
    // getBoundingClientRect().top decreases as the page scrolls down, so
    // (initialTop - currentTop) gives us the scroll delta — works regardless
    // of whether Framer uses window scroll, a div scroll, or an iframe.
    const initialTopRef = React.useRef<number | null>(null)
    React.useEffect(() => {
        foldAngleRef.current = foldAngle
    }, [foldAngle])
    React.useEffect(() => {
        scrollSpeedRef.current = scrollSpeed
    }, [scrollSpeed])
    React.useEffect(() => {
        mouseFollowRef.current = mouseFollow
    }, [mouseFollow])
    React.useEffect(() => {
        scrollModeRef.current = scrollMode
        // Reset capture so the next tick re-snapshots the starting position
        if (scrollMode === "scroll") initialTopRef.current = null
    }, [scrollMode])

    // Container width drives font-size; only triggers a re-render on resize
    const [containerW, setContainerW] = React.useState(1200)

    // Height of one full content cycle for scroll-looping
    // lineHeightPx = fontSize * 1.1 = containerW * 0.08 * 1.1 = containerW * 0.088
    const singleRepeatHRef = React.useRef(DEFAULT_LINES.length * 1200 * 0.088)
    React.useEffect(() => {
        singleRepeatHRef.current = lines.length * containerW * 0.088
    }, [lines, containerW])

    // Spring-physics mouse state (all mutable, never triggers re-render)
    const anim = React.useRef({
        mouse: { x: 0, y: 0 },
        follower: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        scrollY: 0,
        targetScrollY: 0,
        lastTime: 0,
    })

    // ── ResizeObserver ─────────────────────────────────────────────────────────
    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => {
            setContainerW(e.contentRect.width)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ── Animation loop (direct DOM writes) ────────────────────────────────────
    React.useEffect(() => {
        if (isCanvas) return
        const el = containerRef.current
        if (!el) return

        // Mouse tracking
        const onMove = (e: MouseEvent) => {
            const r = el.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width - 0.5 // -0.5 … 0.5
            const ny = (e.clientY - r.top) / r.height - 0.5
            const len = Math.sqrt(nx * nx + ny * ny)
            const clamped = Math.min(0.45, len)
            const ang = Math.atan2(ny, nx)
            anim.current.mouse.x = Math.cos(ang) * clamped
            anim.current.mouse.y = Math.sin(ang) * clamped
        }
        const onLeave = () => {
            anim.current.mouse.x = 0
            anim.current.mouse.y = 0
        }
        el.addEventListener("mousemove", onMove)
        el.addEventListener("mouseleave", onLeave)

        // RAF tick — all animation logic here, no setState
        const tick = (ts: number) => {
            const s = anim.current
            const dt = Math.min(
                0.05,
                s.lastTime ? (ts - s.lastTime) / 1000 : 0.016
            )
            s.lastTime = ts

            // Spring physics — only active when mouseFollow is on
            if (mouseFollowRef.current) {
                const k = 0.04,
                    f = 0.76
                s.vel.x = (s.vel.x + (s.mouse.x - s.follower.x) * k) * f
                s.vel.y = (s.vel.y + (s.mouse.y - s.follower.y) * k) * f
                s.follower.x += s.vel.x
                s.follower.y += s.vel.y
            } else {
                // Smoothly return follower to origin
                s.follower.x = lerp(s.follower.x, 0, 0.06)
                s.follower.y = lerp(s.follower.y, 0, 0.06)
                s.vel.x *= 0.9
                s.vel.y *= 0.9
            }

            // Scroll position — auto-increment or track real page scroll
            if (scrollModeRef.current === "scroll") {
                // Poll getBoundingClientRect — reflects any scroll container
                // (window, Framer's internal scroller, iframe, etc.)
                const rect = el.getBoundingClientRect()
                if (initialTopRef.current === null) {
                    initialTopRef.current = rect.top
                }
                const delta = Math.max(0, initialTopRef.current - rect.top)
                s.scrollY = lerp(s.scrollY, delta, 0.1)
            } else {
                // Auto-scroll with seamless loop
                s.scrollY += scrollSpeedRef.current * dt
                const srh = singleRepeatHRef.current
                if (srh > 0) s.scrollY = s.scrollY % srh
            }

            // Compute all transform values
            const fy = s.follower.y
            const fx = s.follower.x
            const baseA = foldAngleRef.current
            const topRotX = -(baseA + fy * 18) // fold more/less with vertical mouse
            const bottomRotX = baseA - fy * 18
            const wX = fx * 55 // whole group drifts with mouse
            const wY = fy * 22

            // Read fold heights from DOM (updates automatically when container resizes)
            const topH = topFoldRef.current?.clientHeight ?? 200
            const ctrH = centerFoldRef.current?.clientHeight ?? 400
            const sy = s.scrollY

            // Apply transforms — no React diffing, straight DOM writes
            if (wrapperRef.current)
                wrapperRef.current.style.transform = `translate(${wX}px, ${wY}px)`
            if (topFoldRef.current)
                topFoldRef.current.style.transform = `rotateX(${topRotX}deg)`
            if (bottomFoldRef.current)
                bottomFoldRef.current.style.transform = `rotateX(${bottomRotX}deg)`

            // Offset each content block so its visible slice is continuous
            // top fold   → slice [sy .. sy+topH]
            // center fold → slice [sy+topH .. sy+topH+ctrH]
            // bottom fold → slice [sy+topH+ctrH ..]
            if (topContentRef.current)
                topContentRef.current.style.transform = `translateY(${-sy}px)`
            if (centerContentRef.current)
                centerContentRef.current.style.transform = `translateY(${-(sy + topH)}px)`
            if (bottomContentRef.current)
                bottomContentRef.current.style.transform = `translateY(${-(sy + topH + ctrH)}px)`

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(rafRef.current)
            el.removeEventListener("mousemove", onMove)
            el.removeEventListener("mouseleave", onLeave)
        }
    }, [isCanvas]) // stable — prop mirrors handle the rest

    // ── Canvas placeholder ─────────────────────────────────────────────────────
    if (isCanvas) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: bgColor,
                }}
            >
                <p
                    style={{
                        color: "#555",
                        fontFamily: "sans-serif",
                        fontSize: 14,
                        margin: 0,
                    }}
                >
                    View preview to watch animation
                </p>
            </div>
        )
    }

    // ── Live render ────────────────────────────────────────────────────────────

    // Font size is proportional to the measured container width
    const fontSize = containerW * 0.08

    // Repeat content 4× so scroll always has lines to show after looping
    const REPEAT = 4
    const allLines: string[] = Array.from(
        { length: REPEAT },
        () => lines
    ).flat()

    // Identical content block rendered inside each fold panel.
    // The RAF tick applies different translateY to each ref so they
    // show different "slices" of the same content, creating continuity.
    const renderContent = (ref: React.RefObject<HTMLDivElement>) => (
        <div
            ref={ref}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                willChange: "transform",
            }}
        >
            {allLines.map((line: string, i: number) => (
                <div
                    key={i}
                    style={{
                        ...font,
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        lineHeight: 1.1,
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                        padding: "0 8%",
                        textAlign: textAlign as any,
                        userSelect: "none" as const,
                        backfaceVisibility: "hidden" as const,
                    }}
                >
                    {line}
                </div>
            ))}
        </div>
    )

    // Gradient shadow placed at a fold hinge to reinforce depth
    const hingeShadow = (edge: "top" | "bottom") => ({
        position: "absolute" as const,
        [edge]: 0,
        left: 0,
        right: 0,
        height: "55%",
        background: `linear-gradient(to ${edge === "top" ? "bottom" : "top"}, rgba(0,0,0,0.5), transparent)`,
        pointerEvents: "none" as const,
        zIndex: 1,
    })

    return (
        <div
            ref={containerRef}
            style={{ ...style, overflow: "hidden", background: bgColor }}
        >
            {/* ── Perspective stage ── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: "1200px",
                    perspectiveOrigin: "50% 50%",
                }}
            >
                {/* ── Floating wrapper — drifts with mouse ── */}
                <div
                    ref={wrapperRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {/* ── TOP FOLD — hinged at its bottom edge ── */}
                    <div
                        ref={topFoldRef}
                        style={{
                            flex: "0 0 25%",
                            position: "relative",
                            overflow: "hidden",
                            transformOrigin: "50% 100%",
                            backfaceVisibility: "hidden" as const,
                        }}
                    >
                        {renderContent(topContentRef)}
                        {/* Shadow deepens toward the hinge */}
                        <div style={hingeShadow("bottom")} />
                    </div>

                    {/* ── CENTER FOLD — flat, no rotation ── */}
                    <div
                        ref={centerFoldRef}
                        style={{
                            flex: "0 0 50%",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {renderContent(centerContentRef)}
                        {/* Subtle shadows at both hinges */}
                        <div style={{ ...hingeShadow("top"), height: "20%" }} />
                        <div
                            style={{ ...hingeShadow("bottom"), height: "20%" }}
                        />
                    </div>

                    {/* ── BOTTOM FOLD — hinged at its top edge ── */}
                    <div
                        ref={bottomFoldRef}
                        style={{
                            flex: "0 0 25%",
                            position: "relative",
                            overflow: "hidden",
                            transformOrigin: "50% 0%",
                            backfaceVisibility: "hidden" as const,
                        }}
                    >
                        {renderContent(bottomContentRef)}
                        <div style={hingeShadow("top")} />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

FoldingDOM.defaultProps = {
    lines: DEFAULT_LINES,
    textColor: "#e3e5eb",
    bgColor: "#0f0f11",
    foldAngle: 65,
    mouseFollow: true,
    scrollSpeed: 80,
    scrollMode: "auto",
    textAlign: "left",
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(FoldingDOM, {
    lines: {
        title: "Lines",
        type: ControlType.Array,
        control: { type: ControlType.String, defaultValue: "CITY" },
        defaultValue: DEFAULT_LINES,
    },
    font: {
        title: "Font",
        type: ControlType.Font,
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: { fontFamily: "Inter", fontWeight: 700 },
    },
    textColor: {
        title: "Text Color",
        type: ControlType.Color,
        defaultValue: "#e3e5eb",
    },
    bgColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#0f0f11",
    },
    foldAngle: {
        title: "Fold Angle",
        type: ControlType.Number,
        defaultValue: 65,
        min: 30,
        max: 85,
        step: 1,
        unit: "°",
        description: "How far the top and bottom panels fold back.",
    },
    mouseFollow: {
        title: "Mouse Follow",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scrollMode: {
        title: "Scroll Mode",
        type: ControlType.Enum,
        options: ["auto", "scroll"],
        optionTitles: ["Auto", "Page Scroll"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    scrollSpeed: {
        title: "Scroll Speed",
        type: ControlType.Number,
        defaultValue: 80,
        min: 10,
        max: 400,
        step: 10,
        description: "Auto-scroll speed (px/s).",
        hidden: (props: any) => props.scrollMode === "scroll",
    },
    textAlign: {
        title: "Text Align",
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
})
