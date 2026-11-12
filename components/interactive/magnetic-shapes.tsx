import * as React from "react"
import { useRef, useEffect, useLayoutEffect, useId } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Mode = "Lines" | "Emoji"
type Coloring = "Single" | "Gradient"
type ParticleMode = "Off" | "Repel" | "Attract"

type Pt = { x: number; y: number }

type Props = {
    // Layout
    rows: number
    columns: number

    // Mode
    mode: Mode

    // Shapes mode props
    shapeColor: string
    shapeWidth: number // px
    shapeHeight: number // px
    cornerRadius: number // px
    shapeColoring: Coloring
    gradientSeed: number

    // Emoji mode props
    emoji: string // fallback single emoji
    emojiSize: number // px
    emojiOpacity: number // 0..1
    emojiSet: string[] // list of emojis to randomly assign
    emojiSeed: number // seed for deterministic assignment

    // Motion
    baseAngle: number
    transitionMs: number // base transition for rotation & scale
    magnetStrength: number // >1 = stronger/faster response, <1 = softer/slower
    resetOnLeave: boolean

    // Auto-rotation (circular pointer path)
    autoRotateMode: "Off" | "Idle" | "Always"
    autoRotateRPM: number // rotations per minute
    autoRotateRadiusPct: number // % of half the shortest side
    autoRotateIdleDelayMs: number // inactivity time before Idle kicks in (even with cursor over component)

    // Particle mode (position displacement)
    particleMode: ParticleMode // Off | Repel | Attract
    particleRadius: number // px — influence radius
    particleMaxOffset: number // px — max translate at the pointer
    particleStrength: number // 0..2 — multiplier for displacement
    particleFalloff: number // 0.1..4 — curve exponent

    // Hover focus effects
    hoverEffectsEnabled: boolean
    hoverFocusScale: number // scale for the hovered item
    hoverOthersOpacity: number // opacity for non-hovered items (0..1)

    // Sizing
    fillParent: boolean
    containerSize: number // px

    // Connectors (Lines mode only)
    connectorsEnabled: boolean
    connectorColor: string
    connectorWidth: number // px
    connectorPreviewOpacity: number // 0..1
    connectorDurationMs: number

    className?: string
    style?: React.CSSProperties
}

export default function MagneticShapes({
    // Layout
    rows = 9,
    columns = 9,

    // Mode
    mode = "Lines",

    // Shapes
    shapeColor = "#efefef",
    shapeWidth = 6,
    shapeHeight = 36,
    cornerRadius = 0,
    shapeColoring = "Single",
    gradientSeed = 42,

    // Emoji (fallback)
    emoji = "😀",
    emojiSize = 24,
    emojiOpacity = 1,

    // Emoji set
    emojiSet = ["😀", "👀", "⭐️"],
    emojiSeed = 1234,

    // Motion
    baseAngle = -10,
    transitionMs = 160,
    magnetStrength = 1,
    resetOnLeave = true,

    // Auto-rotation
    autoRotateMode = "Off",
    autoRotateRPM = 1,
    autoRotateRadiusPct = 60,
    autoRotateIdleDelayMs = 1000,

    // Particle mode
    particleMode = "Off",
    particleRadius = 140,
    particleMaxOffset = 24,
    particleStrength = 1,
    particleFalloff = 1.25,

    // Hover focus
    hoverEffectsEnabled = true,
    hoverFocusScale = 1.1,
    hoverOthersOpacity = 0.35,

    // Sizing
    fillParent = true,
    containerSize = 400,

    // Connectors
    connectorsEnabled = true,
    connectorColor = "#ff3b3b",
    connectorWidth = 3,
    connectorPreviewOpacity = 0.25,
    connectorDurationMs = 300,

    className = "",
    style = {},
}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const isActiveRef = useRef(false) // “user is actively moving pointer” (resets by idle timer)
    const idleTimerRef = useRef<number | null>(null)
    const uid = useId()

    // Hover focus state
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    // ----- Emoji validation helpers -----
    const isSingleGrapheme = (s: string): boolean => {
        const t = (s ?? "").trim()
        if (!t) return false
        const Seg: any = (Intl as any)?.Segmenter
        if (typeof Seg === "function") {
            const seg = new Seg([], { granularity: "grapheme" })
            const it = seg.segment(t)
            let count = 0
            for (const _ of it) count++
            return count === 1
        }
        return Array.from(t).length === 1
    }
    const hasEmojiPictograph = (s: string): boolean =>
        /\p{Extended_Pictographic}/u.test((s ?? "").trim())
    const isValidEmoji = (s: string): boolean => {
        const t = (s ?? "").trim()
        return !!t && isSingleGrapheme(t) && hasEmojiPictograph(t)
    }

    // Validate fallback single emoji
    const chosenFallbackEmoji =
        mode === "Emoji" ? (isValidEmoji(emoji) ? emoji.trim() : "😀") : ""

    // Validate the emoji set; if none valid, fall back to single emoji
    const validEmojiSet = React.useMemo(
        () =>
            (emojiSet || []).map((e) => (e ?? "").trim()).filter(isValidEmoji),
        [emojiSet]
    )

    // Seeded RNG (Park–Miller)
    const makeRng = (seed: number) => {
        let s = Math.floor(seed) % 2147483647
        if (s <= 0) s += 2147483646
        return () => (s = (s * 16807) % 2147483647) / 2147483647
    }

    const total = Math.max(0, rows) * Math.max(0, columns)

    // Precompute a deterministic random emoji assignment for each cell.
    const assignedEmojis = React.useMemo(() => {
        if (mode !== "Emoji") return []
        const n = validEmojiSet.length
        const rng = makeRng(emojiSeed || 1)
        const out: string[] = new Array(total)
        for (let i = 0; i < total; i++) {
            if (n > 0) {
                const idx = Math.floor(rng() * n) % n
                out[i] = validEmojiSet[idx]
            } else {
                out[i] = chosenFallbackEmoji || "😀"
            }
        }
        return out
    }, [mode, validEmojiSet, emojiSeed, total, chosenFallbackEmoji])

    // ----- Unified update for rotation + particle displacement -----
    const updateFields = React.useCallback(
        (x: number, y: number) => {
            const el = containerRef.current
            if (!el) return

            const items =
                el.querySelectorAll<HTMLSpanElement>("span[data-mg-item]")
            const rect = el.getBoundingClientRect()
            const pr = Math.max(0, particleRadius)
            const maxOff =
                Math.max(0, particleMaxOffset) * Math.max(0, particleStrength)

            items.forEach((item) => {
                const r = item.getBoundingClientRect()
                const cx = r.left + r.width / 2
                const cy = r.top + r.height / 2

                // Rotation toward (x,y)
                const deg = (Math.atan2(y - cy, x - cx) * 180) / Math.PI
                item.style.setProperty("--rotate", `${deg}deg`)

                // Particle displacement
                if (particleMode !== "Off") {
                    const dx = x - cx
                    const dy = y - cy
                    const dist = Math.hypot(dx, dy) || 1
                    const within = dist < pr ? 1 : 0
                    const t = within ? 1 - dist / pr : 0 // 1 at center -> 0 at edge
                    const curveExp = Math.max(0.1, Math.min(4, particleFalloff))
                    const influence = Math.pow(Math.max(0, t), curveExp)
                    const nx = dx / dist
                    const ny = dy / dist

                    const sign = particleMode === "Attract" ? 1 : -1
                    const off = Math.min(maxOff, influence * maxOff)
                    const tx = sign * nx * off
                    const ty = sign * ny * off

                    item.style.setProperty("--tx", `${tx}px`)
                    item.style.setProperty("--ty", `${ty}px`)
                }
            })
        },
        [
            particleMode,
            particleRadius,
            particleMaxOffset,
            particleStrength,
            particleFalloff,
        ]
    )

    // Reset particle displacement vars
    const resetParticles = React.useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const items = el.querySelectorAll<HTMLSpanElement>("span[data-mg-item]")
        items.forEach((item) => {
            item.style.setProperty("--tx", `0px`)
            item.style.setProperty("--ty", `0px`)
        })
    }, [])

    // ----- Pointer-driven rotation/particles + idle tracking -----
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const items = el.querySelectorAll<HTMLSpanElement>("span[data-mg-item]")

        const armIdleTimer = () => {
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
            idleTimerRef.current = window.setTimeout(
                () => {
                    isActiveRef.current = false
                },
                Math.max(0, autoRotateIdleDelayMs)
            ) as unknown as number
        }

        const onPointerMove = (e: PointerEvent) => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            const { clientX, clientY } = e
            rafRef.current = requestAnimationFrame(() =>
                updateFields(clientX, clientY)
            )

            isActiveRef.current = true
            armIdleTimer()
        }

        const onPointerEnter = (e: PointerEvent) => {
            isActiveRef.current = true
            armIdleTimer()
            // nudge on enter
            updateFields(e.clientX, e.clientY)
        }

        const onPointerLeave = () => {
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
            isActiveRef.current = false
            setHoveredIndex(null)
            if (resetOnLeave) {
                items.forEach((item) =>
                    item.style.setProperty("--rotate", `${baseAngle}deg`)
                )
                resetParticles()
            }
        }

        el.addEventListener("pointermove", onPointerMove)
        el.addEventListener("pointerenter", onPointerEnter)
        el.addEventListener("pointerleave", onPointerLeave)

        // Initial aim so motion is visible immediately
        if (items.length) {
            const mid = Math.floor(items.length / 2)
            const r = items[mid].getBoundingClientRect()
            updateFields(r.left + r.width / 2, r.top + r.height / 2)
        }

        return () => {
            el.removeEventListener("pointermove", onPointerMove)
            el.removeEventListener("pointerenter", onPointerEnter)
            el.removeEventListener("pointerleave", onPointerLeave)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
        }
    }, [
        rows,
        columns,
        baseAngle,
        resetOnLeave,
        autoRotateIdleDelayMs,
        updateFields,
        resetParticles,
    ])

    // ----- Auto-rotation loop (also drives particles via virtual pointer) -----
    useEffect(() => {
        if (autoRotateMode === "Off") return

        let raf: number
        const tick = (ts: number) => {
            const el = containerRef.current
            if (!el) {
                raf = requestAnimationFrame(tick)
                return
            }

            const userActive = isActiveRef.current
            const shouldRun =
                autoRotateMode === "Always" ||
                (autoRotateMode === "Idle" && !userActive)

            if (shouldRun) {
                const rect = el.getBoundingClientRect()
                const cx = rect.left + rect.width / 2
                const cy = rect.top + rect.height / 2
                const radius =
                    Math.min(rect.width, rect.height) *
                    0.5 *
                    (autoRotateRadiusPct / 100)
                const theta = (ts / 60000) * (autoRotateRPM * 2 * Math.PI)
                const x = cx + Math.cos(theta) * radius
                const y = cy + Math.sin(theta) * radius

                // Use the same updater so rotation & particles follow the virtual pointer
                updateFields(x, y)
            }

            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [autoRotateMode, autoRotateRPM, autoRotateRadiusPct, updateFields])

    // ----- Utilities -----
    const rng = (seed: number) => {
        let s = seed % 2147483647 || 1
        if (s <= 0) s += 2147483646
        return () => (s = (s * 16807) % 2147483647) / 2147483647
    }
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // Base item style
    const itemStyleBase: React.CSSProperties =
        mode === "Lines"
            ? {
                  width: `${Math.max(1, shapeWidth)}px`,
                  height: `${Math.max(1, shapeHeight)}px`,
                  borderRadius: `${Math.max(0, cornerRadius)}px`,
                  display: "inline-block",
              }
            : {
                  fontSize: `${Math.max(1, emojiSize)}px`,
                  shapeHeight: 1,
                  display: "inline-block",
                  userSelect: "none",
              }

    // Gradient colors for Lines mode (computed per cell)
    const rand = rng(gradientSeed)
    const hueA = Math.floor(rand() * 360)
    const hueB = Math.floor(rand() * 360)
    const colorForIndex = (i: number) => {
        if (shapeColoring === "Single") return shapeColor
        const row = Math.floor(i / columns)
        const col = i % columns
        const u = columns > 1 ? col / (columns - 1) : 0
        const v = rows > 1 ? row / (rows - 1) : 0
        const t = (u + v) / 2
        const hue = lerp(hueA, hueB, t)
        return `hsl(${hue} 80% 55%)`
    }

    // ----- Connectors (smooth preview + draw) -----
    const [centers, setCenters] = React.useState<Pt[]>([])
    const [originIndex, setOriginIndex] = React.useState<number | null>(null)
    const [targetIndex, setTargetIndex] = React.useState<number | null>(null)
    const [pointerPt, setPointerPt] = React.useState<Pt | null>(null)
    const animKeyRef = useRef(0)

    const computeCenters = React.useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const items = Array.from(
            el.querySelectorAll<HTMLSpanElement>("span[data-mg-item]")
        )
        const rectContainer = el.getBoundingClientRect()
        const pts: Pt[] = items.map((n) => {
            const r = n.getBoundingClientRect()
            return {
                x: r.left - rectContainer.left + r.width / 2,
                y: r.top - rectContainer.top + r.height / 2,
            }
        })
        setCenters(pts)
    }, [])

    useLayoutEffect(() => {
        computeCenters()
    }, [
        rows,
        columns,
        mode,
        shapeWidth,
        shapeHeight,
        cornerRadius,
        emojiSize,
        computeCenters,
    ])

    useEffect(() => {
        const ro = new ResizeObserver(() => computeCenters())
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [computeCenters])

    // track pointer for preview line
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const onMove = (e: PointerEvent) => {
            if (!connectorsEnabled || originIndex === null) return
            const rect = el.getBoundingClientRect()
            setPointerPt({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        }
        el.addEventListener("pointermove", onMove)
        return () => el.removeEventListener("pointermove", onMove)
    }, [connectorsEnabled, originIndex])

    const handleEnter = (i: number) => {
        if (hoverEffectsEnabled) setHoveredIndex(i)
        if (!connectorsEnabled || mode !== "Lines") return

        if (originIndex === null) {
            setOriginIndex(i)
            setTargetIndex(null)
            animKeyRef.current++ // force remount for animation reset
            return
        }

        if (i !== originIndex) {
            setTargetIndex(i)
            animKeyRef.current++
        }
    }

    const clearConnectors = () => {
        setOriginIndex(null)
        setTargetIndex(null)
        setPointerPt(null)
        setHoveredIndex(null)
        animKeyRef.current++
    }

    // Effective transition for rotation & translation: higher magnetStrength => shorter duration (snappier)
    const effectiveRotateMs = (() => {
        const base = Math.max(0, transitionMs)
        const strength = Math.max(0.1, magnetStrength) // clamp
        return Math.round(base / strength)
    })()

    // Build grid items
    const spans = Array.from({ length: total }, (_, i) => {
        const styleBase: React.CSSProperties =
            mode === "Lines"
                ? { ...itemStyleBase, backgroundColor: colorForIndex(i) }
                : { ...itemStyleBase }

        // Determine content and opacity/scale
        const baseOpacity =
            mode === "Emoji" ? Math.max(0, Math.min(1, emojiOpacity)) : 1
        const isFocused = hoveredIndex === i
        const isDimmed =
            hoveredIndex !== null && hoveredIndex !== i && hoverEffectsEnabled
        const composedOpacity = isDimmed
            ? Math.max(0, Math.min(1, baseOpacity * hoverOthersOpacity))
            : baseOpacity
        const scale =
            isFocused && hoverEffectsEnabled
                ? Math.max(0.5, hoverFocusScale)
                : 1

        // Content: either emoji from assignedEmojis, or none for Lines mode
        const contentEmoji = mode === "Emoji" ? assignedEmojis[i] : null

        return (
            <span
                key={i}
                data-mg-item
                onMouseEnter={() => handleEnter(i)}
                style={
                    {
                        "--rotate": `${baseAngle}deg`,
                        "--scale": scale,
                        "--tx": "0px",
                        "--ty": "0px",
                        opacity: composedOpacity,
                        ...styleBase,
                    } as React.CSSProperties
                }
                aria-hidden={mode === "Lines" ? "true" : "false"}
            >
                {contentEmoji}
            </span>
        )
    })

    const sizeStyle: React.CSSProperties = fillParent
        ? { width: "100%", height: "100%" }
        : { width: `${containerSize}px`, height: `${containerSize}px` }

    // Prepare connector segments
    const preview: [Pt, Pt] | null =
        mode === "Lines" &&
        connectorsEnabled &&
        originIndex !== null &&
        pointerPt &&
        centers[originIndex]
            ? [centers[originIndex], pointerPt]
            : null

    const finalSeg: [Pt, Pt] | null =
        mode === "Lines" &&
        connectorsEnabled &&
        originIndex !== null &&
        targetIndex !== null &&
        centers[originIndex] &&
        centers[targetIndex]
            ? [centers[originIndex], centers[targetIndex]]
            : null

    const animKey = animKeyRef.current

    return (
        <div
            ref={containerRef}
            className={`magnetGrid-${escapeForCSS(uid)} ${className || ""}`}
            onMouseLeave={clearConnectors}
            style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                justifyItems: "center",
                alignItems: "center",
                touchAction: "none",
                pointerEvents: "auto",
                ...sizeStyle,
                ...style,
            }}
            role={mode === "Emoji" ? "img" : undefined}
            aria-label={
                mode === "Emoji"
                    ? `Grid of ${total} emojis that rotate toward the pointer`
                    : undefined
            }
        >
            <style>{`
        .magnetGrid-${escapeForCSS(uid)} [data-mg-item] {
          transform-origin: center;
          will-change: transform, opacity;
          transform:
            translate(var(--tx, 0px), var(--ty, 0px))
            rotate(var(--rotate, 0deg))
            scale(var(--scale, 1));
          transition:
            transform ${effectiveRotateMs}ms cubic-bezier(.2,.8,.2,1),
            opacity ${Math.max(0, Math.min(800, transitionMs))}ms ease-out;
        }
        .magnetGrid-${escapeForCSS(uid)} svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }
        .magnetGrid-${escapeForCSS(uid)} .preview-line {
          transition: x1 120ms ease, y1 120ms ease, x2 120ms ease, y2 120ms ease, opacity 160ms ease;
          opacity: ${Math.max(0, Math.min(1, connectorPreviewOpacity))};
        }
      `}</style>

            {/* Grid items */}
            {spans}

            {/* SVG overlay for connectors with smooth draw */}
            {mode === "Lines" && connectorsEnabled ? (
                <svg key={animKey} aria-hidden="true">
                    {/* Live preview to pointer: smooth endpoint transitions */}
                    {preview ? (
                        <line
                            className="preview-line"
                            x1={preview[0].x}
                            y1={preview[0].y}
                            x2={preview[1].x}
                            y2={preview[1].y}
                            stroke={connectorColor}
                            strokeWidth={connectorWidth}
                            strokeLinecap="round"
                        />
                    ) : null}

                    {/* Final connection path: animate stroke draw-on */}
                    {finalSeg ? (
                        <PathDraw
                            from={finalSeg[0]}
                            to={finalSeg[1]}
                            color={connectorColor}
                            width={connectorWidth}
                            durationMs={connectorDurationMs}
                        />
                    ) : null}
                </svg>
            ) : null}
        </div>
    )
}

/**
 * Draws a straight line from A to B with a "write-on" animation using stroke-dashoffset.
 * Remounting this component (by changing its React key) replays the animation.
 */
function PathDraw({
    from,
    to,
    color,
    width,
    durationMs,
}: {
    from: Pt
    to: Pt
    color: string
    width: number
    durationMs: number
}) {
    const pathRef = useRef<SVGPathElement | null>(null)

    useEffect(() => {
        const el = pathRef.current
        if (!el) return

        const total = el.getTotalLength
            ? el.getTotalLength()
            : Math.hypot(to.x - from.x, to.y - from.y)
        el.style.transition = "none"
        el.style.strokeDasharray = `${total}`
        el.style.strokeDashoffset = `${total}`
        // Force reflow
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.getBoundingClientRect()
        // Animate to 0 (draw on)
        el.style.transition = `stroke-dashoffset ${Math.max(
            50,
            durationMs
        )}ms cubic-bezier(.22,.61,.36,1)`
        el.style.strokeDashoffset = "0"
    }, [from.x, from.y, to.x, to.y, durationMs])

    const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
    return (
        <path
            ref={pathRef}
            d={d}
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            fill="none"
        />
    )
}

function escapeForCSS(id: string) {
    return id.replace(/[^a-zA-Z0-9-_]/g, "_")
}

/* ---- Framer Property Controls ---- */
addPropertyControls(MagneticShapes, {
    // Layout
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 9,
        min: 1,
        max: 30,
        step: 1,
        displayStepper: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 9,
        min: 1,
        max: 30,
        step: 1,
        displayStepper: true,
    },

    // Mode
    mode: {
        type: ControlType.Enum,
        title: "Content",
        options: ["Lines", "Emoji"],
        optionTitles: ["Lines", "Emoji"],
        defaultValue: "Lines",
    },

    // Shape controls
    shapeColoring: {
        type: ControlType.Enum,
        title: "Coloring",
        options: ["Single", "Gradient"],
        optionTitles: ["Single", "Gradient"],
        defaultValue: "Single",
        hidden: (p: Props) => p.mode !== "Lines",
    },
    shapeColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#efefef",
        hidden: (p: Props) =>
            p.mode !== "Lines" || p.shapeColoring === "Gradient",
    },
    shapeWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 6,
        min: 1,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (p: Props) => p.mode !== "Lines",
    },
    shapeHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 36,
        min: 1,
        max: 300,
        step: 1,
        unit: "px",
        hidden: (p: Props) => p.mode !== "Lines",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        hidden: (p: Props) => p.mode !== "Lines",
    },
    gradientSeed: {
        type: ControlType.Number,
        title: "Gradient Seed",
        description:
            "Changes the start/end hues of the gradient for Line coloring. Same seed = same gradient.",
        defaultValue: 42,
        min: 0,
        max: 9999,
        step: 1,
        hidden: (p: Props) =>
            p.mode !== "Lines" || p.shapeColoring !== "Gradient",
    },

    // Emoji controls
    emoji: {
        type: ControlType.String,
        title: "Emoji (fallback)",
        defaultValue: "😀",
        placeholder: "e.g. 👀",
        hidden: (p: Props) => p.mode !== "Emoji",
    },
    emojiSize: {
        type: ControlType.Number,
        title: "Emoji Size",
        defaultValue: 24,
        min: 8,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (p: Props) => p.mode !== "Emoji",
    },
    emojiOpacity: {
        type: ControlType.Number,
        title: "Emoji Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Props) => p.mode !== "Emoji",
    },
    emojiSet: {
        type: ControlType.Array,
        title: "Emoji Set",
        hidden: (p: Props) => p.mode !== "Emoji",
        defaultValue: ["😀", "👀", "⭐️"],
        propertyControl: {
            type: ControlType.String,
            placeholder: "Drop an emoji",
        },
    },
    emojiSeed: {
        type: ControlType.Number,
        title: "Emoji Seed",
        description:
            "Controls the repeatable random layout of emojis. Same seed = same distribution.",
        defaultValue: 1234,
        min: 0,
        max: 999999,
        step: 1,
        hidden: (p: Props) => p.mode !== "Emoji",
    },

    // Particle mode
    particleMode: {
        type: ControlType.Enum,
        title: "Particles",
        options: ["Off", "Repel", "Attract"],
        optionTitles: ["Off", "Repel", "Attract"],
        defaultValue: "Off",
    },
    particleRadius: {
        type: ControlType.Number,
        title: "Radius",
        description:
            "Influence radius around the pointer within which items are displaced.",
        defaultValue: 140,
        min: 20,
        max: 800,
        step: 5,
        unit: "px",
        hidden: (p: Props) => p.particleMode === "Off",
    },
    particleMaxOffset: {
        type: ControlType.Number,
        title: "Max Offset",
        description:
            "Maximum translation (in pixels) an item can move at the strongest influence.",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (p: Props) => p.particleMode === "Off",
    },
    particleStrength: {
        type: ControlType.Number,
        title: "Strength",
        description:
            "Multiplier for displacement. Increase to intensify the movement.",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
        hidden: (p: Props) => p.particleMode === "Off",
    },
    particleFalloff: {
        type: ControlType.Number,
        title: "Falloff",
        description:
            "Curve shaping how quickly influence fades with distance (higher = sharper falloff).",
        defaultValue: 1.25,
        min: 0.1,
        max: 4,
        step: 0.05,
        hidden: (p: Props) => p.particleMode === "Off",
    },

    // Hover effects
    hoverEffectsEnabled: {
        type: ControlType.Boolean,
        title: "Hover Effects",
        defaultValue: true,
    },
    hoverFocusScale: {
        type: ControlType.Number,
        title: "Focus Scale",
        defaultValue: 1.1,
        min: 1,
        max: 2,
        step: 0.01,
        hidden: (p: Props) => !p.hoverEffectsEnabled,
    },
    hoverOthersOpacity: {
        type: ControlType.Number,
        title: "Others Opacity",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Props) => !p.hoverEffectsEnabled,
    },

    // Connectors (only for Lines)
    connectorsEnabled: {
        type: ControlType.Boolean,
        title: "Connectors",
        defaultValue: true,
        hidden: (p: Props) => p.mode !== "Lines",
    },
    connectorColor: {
        type: ControlType.Color,
        title: "Connector Color",
        defaultValue: "#ff3b3b",
        hidden: (p: Props) => p.mode !== "Lines" || !p.connectorsEnabled,
    },
    connectorWidth: {
        type: ControlType.Number,
        title: "Connector Width",
        defaultValue: 3,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
        hidden: (p: Props) => p.mode !== "Lines" || !p.connectorsEnabled,
    },
    connectorPreviewOpacity: {
        type: ControlType.Number,
        title: "Preview Opacity",
        description:
            "Opacity of the temporary preview line shown while aiming the second point.",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Props) => p.mode !== "Lines" || !p.connectorsEnabled,
    },
    connectorDurationMs: {
        type: ControlType.Number,
        title: "Draw (ms)",
        description:
            "Duration of the draw-on animation for the final connector line.",
        defaultValue: 300,
        min: 50,
        max: 4000,
        step: 10,
        hidden: (p: Props) => p.mode !== "Lines" || !p.connectorsEnabled,
    },

    // Auto-rotation
    autoRotateMode: {
        type: ControlType.Enum,
        title: "Auto Rotate",
        options: ["Off", "Idle", "Always"],
        optionTitles: ["Off", "When Idle", "Always"],
        defaultValue: "Off",
    },
    autoRotateRPM: {
        type: ControlType.Number,
        title: "Speed (RPM)",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
        hidden: (p: Props) => p.autoRotateMode === "Off",
    },
    autoRotateRadiusPct: {
        type: ControlType.Number,
        title: "Radius (%)",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        hidden: (p: Props) => p.autoRotateMode === "Off",
    },
    autoRotateIdleDelayMs: {
        type: ControlType.Number,
        title: "Idle Delay (ms)",
        description:
            "When set to ‘When Idle’, auto-rotation starts after this many ms without pointer movement (even if the pointer sits over the component).",
        defaultValue: 1000,
        min: 0,
        max: 5000,
        step: 50,
        hidden: (p: Props) => p.autoRotateMode !== "Idle",
    },

    // Motion
    baseAngle: {
        type: ControlType.Number,
        title: "Base Angle",
        description:
            "Starting orientation for all items. Used on reset or before any pointer movement.",
        defaultValue: -10,
        min: -180,
        max: 180,
        step: 1,
        displayStepper: true,
    },
    transitionMs: {
        type: ControlType.Number,
        title: "Ease (ms)",
        description:
            "Base easing time for rotation/scale transitions. Actual rotation speed is affected by Magnet Strength.",
        defaultValue: 160,
        min: 0,
        max: 1000,
        step: 10,
    },
    magnetStrength: {
        type: ControlType.Number,
        title: "Magnet Strength",
        description: "Higher = snappier (shorter transition).",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    resetOnLeave: {
        type: ControlType.Boolean,
        title: "Reset on Leave",
        defaultValue: true,
    },

    // Sizing
    fillParent: {
        type: ControlType.Boolean,
        title: "Fill Parent",
        defaultValue: true,
    },
    containerSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 400,
        min: 100,
        max: 1200,
        step: 10,
        unit: "px",
        hidden: (p: Props) => p.fillParent === true,
        description:
            "Only works if the component is inside a wrapper stack.\n\nComponent crafted by [Vaibhav](https://contra.com/vaibhav_khulbe)",
    },
})
;(MagneticShapes as any).defaultProps = {
    rows: 9,
    columns: 9,
    mode: "Lines",

    lineColor: "#efefef",
    shapeWidth: 6,
    shapeHeight: 36,
    cornerRadius: 0,
    lineColoring: "Single",
    gradientSeed: 42,

    // Emoji defaults
    emoji: "😀",
    emojiSize: 24,
    emojiOpacity: 1,
    emojiSet: ["😀", "👀", "⭐️"],
    emojiSeed: 1234,

    // Particle defaults
    particleMode: "Off",
    particleRadius: 140,
    particleMaxOffset: 24,
    particleStrength: 1,
    particleFalloff: 1.25,

    // hover focus
    hoverEffectsEnabled: true,
    hoverFocusScale: 1.1,
    hoverOthersOpacity: 0.35,

    // connectors
    connectorsEnabled: true,
    connectorColor: "#ff3b3b",
    connectorWidth: 3,
    connectorPreviewOpacity: 0.25,
    connectorDurationMs: 300,

    // auto-rotation
    autoRotateMode: "Off",
    autoRotateRPM: 1,
    autoRotateRadiusPct: 60,
    autoRotateIdleDelayMs: 1000,

    // motion
    baseAngle: -10,
    transitionMs: 160,
    magnetStrength: 1,
    resetOnLeave: true,

    // sizing
    fillParent: true,
    containerSize: 400,
    width: 400,
    height: 400,
}
