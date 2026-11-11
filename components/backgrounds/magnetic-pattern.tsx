// MagneticPattern.tsx
// - Infinite tiling (auto-fills container)
// - Shapes: square, triangle, custom (center-anchored)
// - Symmetry-aware steering (square/triangle: 180°; custom selectable)
// - Spotlight opacity & distance-based scale (both toggleable)
// - Rotation effect toggleable
// - Position offset effect toggleable
// - Strict radius, smoothing, relax-to-nearest-symmetric-idle (when rotation enabled)
// - Smooth reset to initial state when pointer leaves
// - Trim edges toggle (overflow hidden/visible)
// - Centered grid alignment

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


type ShapeKind = "square" | "triangle" | "custom"
type Falloff = "linear" | "easeOut" | "gaussian"
type Layout = "grid" | "stagger"
type SymmetryMode = "none" | "deg180" | "deg90"
type Curve = "same" | "linear" | "easeOut" | "gaussian"

export default function MagneticPattern(props: {
    // layout/size
    gapX: number
    gapY: number
    itemW: number
    itemH: number
    layout: Layout
    bg: string

    // visuals
    fill: string
    stroke: string
    strokeWidth: number

    // shape
    shape: ShapeKind
    customPath: string
    customSymmetry: SymmetryMode

    // motion / pointer
    baseRotate: number
    randomJitter: number
    seed: number
    trackPointer: boolean
    rAFThrottle: number

    // influence
    radius: number
    strength: number
    falloff: Falloff
    smooth: number
    minWeight: number
    relax: number

    // toggles
    enableRotate: boolean
    enableOpacity: boolean
    enableScale: boolean
    enablePosition: boolean

    // spotlight opacity (when enabled)
    opacityMin: number
    opacityMax: number
    opacityCurve: Curve

    // scale effect (when enabled)
    scaleMin: number
    scaleMax: number
    scaleCurve: Curve

    // position effect (when enabled)
    posMax: number
    posCurve: Curve
    posInvert: boolean

    // container overflow
    trimEdges: boolean
}) {
    const {
        gapX,
        gapY,
        itemW,
        itemH,
        layout,
        bg,
        fill,
        stroke,
        strokeWidth,
        shape,
        customPath,
        customSymmetry,
        baseRotate,
        randomJitter,
        seed,
        trackPointer,
        rAFThrottle,
        radius,
        strength,
        falloff,
        smooth,
        minWeight,
        relax,
        enableRotate,
        enableOpacity,
        enableScale,
        enablePosition,
        opacityMin,
        opacityMax,
        opacityCurve,
        scaleMin,
        scaleMax,
        scaleCurve,
        posMax,
        posCurve,
        posInvert,
        trimEdges,
    } = props

    // ---------- seeded RNG ----------
    function rngFactory(s: number) {
        let t = s || 1
        return () => {
            t ^= t << 13
            t ^= t >> 17
            t ^= t << 5
            return ((t < 0 ? ~t + 1 : t) % 10000) / 10000
        }
    }
    const rand = React.useMemo(() => rngFactory(seed), [seed])

    const cellW = itemW + gapX
    const cellH = itemH + gapY

    // ---------- symmetry helpers ----------
    function symmetryPeriodDegForShape(
        shape: ShapeKind,
        customSym: SymmetryMode
    ): number {
        if (shape === "square" || shape === "triangle") return 180
        switch (customSym) {
            case "deg180":
                return 180
            case "deg90":
                return 90
            case "none":
            default:
                return 360
        }
    }
    const angleDiff = (a: number, b: number) => ((a - b + 540) % 360) - 180
    const clamp = (v: number, a: number, b: number) =>
        Math.max(a, Math.min(b, v))
    function nearestSymmetricAngle(
        targetDeg: number,
        referenceDeg: number,
        period: number
    ) {
        if (period <= 0 || period >= 360) return targetDeg
        const n = Math.round((referenceDeg - targetDeg) / period)
        return targetDeg + n * period
    }

    // ---------- falloffs & curves ----------
    function falloffWeight(dist: number) {
        if (radius <= 0 || dist >= radius) return 0
        const t = 1 - dist / radius // 1 near, 0 at edge
        switch (falloff) {
            case "linear":
                return t
            case "easeOut":
                return 1 - Math.pow(1 - t, 3)
            case "gaussian":
                return Math.exp(-Math.pow(dist / (radius * 0.5), 2))
            default:
                return t
        }
    }
    function mapCurve(w: number, curve: Curve) {
        const x = clamp(w, 0, 1)
        switch (curve) {
            case "same":
                return x
            case "linear":
                return x
            case "easeOut":
                return 1 - Math.pow(1 - x, 3)
            case "gaussian":
                return Math.exp(-Math.pow((1 - x) / 0.5, 2))
            default:
                return x
        }
    }
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // ---------- centered shapes ----------
    const ShapeSVG = React.useMemo(() => {
        const common = { fill, stroke, strokeWidth }
        switch (shape) {
            case "square":
                return (
                    <g transform={`translate(${itemW / 2}, ${itemH / 2})`}>
                        <rect
                            x={-itemW / 2}
                            y={-itemH / 2}
                            width={itemW}
                            height={itemH}
                            {...common}
                        />
                    </g>
                )
            case "triangle": {
                const p1 = `0,${-itemH / 2}`
                const p2 = `${-itemW / 2},${itemH / 2}`
                const p3 = `${itemW / 2},${itemH / 2}`
                return (
                    <g transform={`translate(${itemW / 2}, ${itemH / 2})`}>
                        <polygon points={`${p1} ${p2} ${p3}`} {...common} />
                    </g>
                )
            }
            case "custom":
                return (
                    <g transform={`translate(${itemW / 2}, ${itemH / 2})`}>
                        <g
                            transform={`translate(${-itemW / 2}, ${-itemH / 2})`}
                        >
                            <path
                                d={customPath || "M0 0 L10 0 L10 10 L0 10 Z"}
                                {...common}
                            />
                        </g>
                    </g>
                )
            default:
                return null
        }
    }, [shape, itemW, itemH, fill, stroke, strokeWidth, customPath])

    // ---------- measure container ----------
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })
    React.useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const cr = entry.contentRect
                setSize({ w: Math.max(0, cr.width), h: Math.max(0, cr.height) })
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ---------- auto grid (CENTERED) ----------
    const overscan = 1
    const cols = Math.max(1, Math.ceil(size.w / cellW) + overscan * 2)
    const rows = Math.max(1, Math.ceil(size.h / cellH) + overscan * 2)

    // grid size in center-to-center space
    const gridWidth = (cols - 1) * cellW
    const gridHeight = (rows - 1) * cellH

    // first center so grid is centered in container
    const baseX = size.w / 2 - gridWidth / 2
    const baseY = size.h / 2 - gridHeight / 2

    // ---------- positions (CENTERED) ----------
    type Pos = { cx: number; cy: number }
    const positions = React.useRef<Pos[]>([])
    positions.current = []
    for (let r = 0; r < rows; r++) {
        const staggerOffset =
            layout === "stagger" && r % 2 === 1 ? cellW / 2 : 0
        for (let c = 0; c < cols; c++) {
            const jx = randomJitter > 0 ? (rand() * 2 - 1) * randomJitter : 0
            const jy = randomJitter > 0 ? (rand() * 2 - 1) * randomJitter : 0
            positions.current.push({
                cx: baseX + c * cellW + staggerOffset + jx,
                cy: baseY + r * cellH + jy,
            })
        }
    }

    // ---------- state ----------
    const tileRefs = React.useRef<HTMLDivElement[]>([])
    tileRefs.current = []
    const addRef = (el: HTMLDivElement | null) =>
        el && tileRefs.current.push(el)

    const prevAngles = React.useRef<number[]>([])
    if (prevAngles.current.length !== rows * cols) {
        prevAngles.current = Array(rows * cols).fill(baseRotate)
    }

    // last-applied visuals (for smooth reset)
    const total = rows * cols
    const lastOpacity = React.useRef<number[]>([])
    const lastScale = React.useRef<number[]>([])
    const lastPosX = React.useRef<number[]>([])
    const lastPosY = React.useRef<number[]>([])
    if (lastOpacity.current.length !== total) {
        lastOpacity.current = Array(total).fill(props.enableOpacity ? 0 : 1)
    }
    if (lastScale.current.length !== total) {
        lastScale.current = Array(total).fill(
            props.enableScale ? props.scaleMin : 1
        )
    }
    if (lastPosX.current.length !== total) {
        lastPosX.current = Array(total).fill(0)
    }
    if (lastPosY.current.length !== total) {
        lastPosY.current = Array(total).fill(0)
    }

    // ---------- smooth reset machinery ----------
    const resetRAF = React.useRef<number | null>(null)
    const pointerInside = React.useRef<boolean>(false)

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const startSmoothReset = React.useCallback(
        (duration = 450) => {
            pointerInside.current = false
            if (resetRAF.current) cancelAnimationFrame(resetRAF.current)

            const period = symmetryPeriodDegForShape(shape, customSymmetry)

            const angleFrom = prevAngles.current.slice()
            const opacityFrom = lastOpacity.current.slice()
            const scaleFrom = lastScale.current.slice()
            const posXFrom = lastPosX.current.slice()
            const posYFrom = lastPosY.current.slice()

            const angleTo = angleFrom.map((a) =>
                nearestSymmetricAngle(baseRotate, a, period)
            )
            const opacityTo = Array(total).fill(enableOpacity ? 0 : 1)
            const scaleTo = Array(total).fill(enableScale ? scaleMin : 1)
            const posXTo = Array(total).fill(0)
            const posYTo = Array(total).fill(0)

            const t0 = performance.now()
            const step = () => {
                const now = performance.now()
                const t = clamp((now - t0) / duration, 0, 1)
                const k = easeOutCubic(t)

                for (let i = 0; i < tileRefs.current.length; i++) {
                    const el = tileRefs.current[i]
                    if (!el) continue

                    const a = angleFrom[i] + (angleTo[i] - angleFrom[i]) * k
                    const o =
                        opacityFrom[i] + (opacityTo[i] - opacityFrom[i]) * k
                    const s = scaleFrom[i] + (scaleTo[i] - scaleFrom[i]) * k
                    const px = posXFrom[i] + (posXTo[i] - posXFrom[i]) * k
                    const py = posYFrom[i] + (posYTo[i] - posYFrom[i]) * k

                    el.style.opacity = String(o)
                    el.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${a}deg) scale(${s})`

                    prevAngles.current[i] = a
                    lastOpacity.current[i] = o
                    lastScale.current[i] = s
                    lastPosX.current[i] = px
                    lastPosY.current[i] = py
                }

                if (t < 1 && !pointerInside.current) {
                    resetRAF.current = requestAnimationFrame(step)
                } else {
                    resetRAF.current = null
                    for (let i = 0; i < tileRefs.current.length; i++) {
                        prevAngles.current[i] = angleTo[i]
                        lastOpacity.current[i] = opacityTo[i]
                        lastScale.current[i] = scaleTo[i]
                        lastPosX.current[i] = posXTo[i]
                        lastPosY.current[i] = posYTo[i]
                    }
                }
            }
            resetRAF.current = requestAnimationFrame(step)
        },
        [
            shape,
            customSymmetry,
            baseRotate,
            enableOpacity,
            enableScale,
            scaleMin,
            total,
        ]
    )

    // ---------- pointer tracking ----------
    const rafLock = React.useRef<number | null>(null)
    const lastRun = React.useRef<number>(0)

    React.useEffect(() => {
        if (!trackPointer) return
        const el = containerRef.current
        if (!el) return

        const onEnter = () => {
            pointerInside.current = true
            if (resetRAF.current) {
                cancelAnimationFrame(resetRAF.current)
                resetRAF.current = null
            }
        }

        const onMove = (clientX: number, clientY: number) => {
            const now = performance.now()
            if (rafLock.current || now - lastRun.current < rAFThrottle) return
            rafLock.current = requestAnimationFrame(() => {
                rafLock.current = null
                lastRun.current = performance.now()

                const rect = el.getBoundingClientRect()
                const px = clientX - rect.left
                const py = clientY - rect.top

                const period = symmetryPeriodDegForShape(shape, customSymmetry)

                for (let i = 0; i < tileRefs.current.length; i++) {
                    const tDiv = tileRefs.current[i]
                    const p = positions.current[i]
                    if (!tDiv || !p) continue

                    const dx = px - p.cx
                    const dy = py - p.cy
                    const dist = Math.hypot(dx, dy)
                    const weight = falloffWeight(dist) // 0..1

                    // ----- ROTATION -----
                    let nextAngle = prevAngles.current[i]
                    if (enableRotate) {
                        const rawAim =
                            (Math.atan2(dy, dx) * 180) / Math.PI + baseRotate
                        const aim = nearestSymmetricAngle(
                            rawAim,
                            nextAngle,
                            period
                        )
                        if (weight <= minWeight) {
                            const idle = nearestSymmetricAngle(
                                baseRotate,
                                nextAngle,
                                period
                            )
                            const relaxStep = 1 - clamp(smooth + relax, 0, 0.95)
                            nextAngle =
                                nextAngle +
                                relaxStep * angleDiff(idle, nextAngle)
                        } else {
                            const steerStep =
                                (1 - clamp(smooth, 0, 0.95)) *
                                (strength * weight)
                            nextAngle =
                                nextAngle +
                                steerStep * angleDiff(aim, nextAngle)
                        }
                    } else {
                        nextAngle = baseRotate
                    }
                    prevAngles.current[i] = nextAngle

                    // ----- OPACITY -----
                    let opacity = 1
                    if (enableOpacity) {
                        const oT = mapCurve(weight, opacityCurve)
                        opacity =
                            dist >= radius
                                ? 0
                                : clamp(lerp(opacityMin, opacityMax, oT), 0, 1)
                    }

                    // ----- SCALE -----
                    let scale = 1
                    if (enableScale) {
                        const sT = mapCurve(weight, scaleCurve)
                        scale =
                            dist >= radius
                                ? scaleMin
                                : clamp(lerp(scaleMin, scaleMax, sT), 0.01, 10)
                    }

                    // ----- POSITION -----
                    let offX = 0
                    let offY = 0
                    if (enablePosition && posMax > 0) {
                        if (dist > 0.0001) {
                            const nx = dx / dist
                            const ny = dy / dist
                            const t = mapCurve(weight, posCurve)
                            const mag = (posInvert ? -1 : 1) * posMax * t
                            offX = nx * mag
                            offY = ny * mag
                        }
                    }

                    // apply + remember for smooth reset
                    tDiv.style.opacity = String(opacity)
                    tDiv.style.transform = `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) rotate(${nextAngle}deg) scale(${scale})`
                    lastOpacity.current[i] = opacity
                    lastScale.current[i] = scale
                    lastPosX.current[i] = offX
                    lastPosY.current[i] = offY
                }
            })
        }

        const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY)
        const onTouch = (e: TouchEvent) => {
            if (e.touches?.[0]) {
                onEnter()
                onMove(e.touches[0].clientX, e.touches[0].clientY)
            }
        }

        const onMouseEnter = () => onEnter()
        const onPointerEnter = () => onEnter()

        // leave → smooth reset
        const onMouseLeave = () => startSmoothReset()
        const onPointerOut = (e: PointerEvent) => {
            if (
                !e.relatedTarget ||
                !(e.currentTarget as Element).contains(e.relatedTarget as Node)
            ) {
                startSmoothReset()
            }
        }
        const onTouchEnd = () => startSmoothReset()
        const onTouchCancel = () => startSmoothReset()

        el.addEventListener("mouseenter", onMouseEnter, { passive: true })
        el.addEventListener("pointerenter", onPointerEnter as any, {
            passive: true,
        })
        el.addEventListener("mousemove", onMouse, { passive: true })
        el.addEventListener("touchmove", onTouch, { passive: true })
        el.addEventListener("mouseleave", onMouseLeave, { passive: true })
        el.addEventListener("pointerout", onPointerOut as any, {
            passive: true,
        })
        el.addEventListener("touchend", onTouchEnd, { passive: true })
        el.addEventListener("touchcancel", onTouchCancel, { passive: true })

        return () => {
            el.removeEventListener("mouseenter", onMouseEnter)
            el.removeEventListener("pointerenter", onPointerEnter as any)
            el.removeEventListener("mousemove", onMouse)
            el.removeEventListener("touchmove", onTouch)
            el.removeEventListener("mouseleave", onMouseLeave)
            el.removeEventListener("pointerout", onPointerOut as any)
            el.removeEventListener("touchend", onTouchEnd)
            el.removeEventListener("touchcancel", onTouchCancel)
            if (rafLock.current) cancelAnimationFrame(rafLock.current)
            if (resetRAF.current) cancelAnimationFrame(resetRAF.current)
        }
    }, [
        trackPointer,
        rAFThrottle,
        baseRotate,
        radius,
        strength,
        falloff,
        smooth,
        minWeight,
        relax,
        enableRotate,
        enableOpacity,
        enableScale,
        enablePosition,
        opacityMin,
        opacityMax,
        opacityCurve,
        scaleMin,
        scaleMax,
        scaleCurve,
        posMax,
        posCurve,
        posInvert,
        size.w,
        size.h,
        cellW,
        cellH,
        shape,
        customSymmetry,
        startSmoothReset,
    ])

    // ---------- render ----------
    const tiles: React.ReactNode[] = []
    let idx = 0
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const p = positions.current[idx]
            const neutral = !trackPointer

            const initialAngle =
                enableRotate && !neutral
                    ? (prevAngles.current[idx] ?? baseRotate)
                    : baseRotate
            const initialScale = enableScale && !neutral ? props.scaleMin : 1
            const initialOpacity = enableOpacity && !neutral ? 0 : 1

            lastOpacity.current[idx] = initialOpacity
            lastScale.current[idx] = initialScale
            lastPosX.current[idx] = 0
            lastPosY.current[idx] = 0

            tiles.push(
                <div
                    key={`${r}-${c}`}
                    ref={addRef}
                    style={{
                        position: "absolute",
                        left: p.cx,
                        top: p.cy,
                        width: itemW,
                        height: itemH,
                        opacity: initialOpacity,
                        transform: `translate(-50%, -50%) rotate(${initialAngle}deg) scale(${initialScale})`,
                        transformOrigin: "50% 50%",
                        pointerEvents: "none",
                        willChange: "transform, opacity",
                    }}
                >
                    <svg
                        width={itemW}
                        height={itemH}
                        viewBox={`0 0 ${itemW} ${itemH}`}
                        style={{ display: "block" }}
                    >
                        {ShapeSVG}
                    </svg>
                </div>
            )
            idx++
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 100, // minimum width in px
                minHeight: 100, // minimum height in px
                overflow: trimEdges ? "hidden" : "visible", // <-- fixed
                background: bg, // <-- fixed
                touchAction: "none",
            }}
        >
            {tiles}
        </div>
    )
}

MagneticPattern.defaultProps = {
    // Canvas default size
    width: 400,
    height: 400,

    // layout/size
    gapX: 12,
    gapY: 12,
    itemW: 24,
    itemH: 4,
    layout: "grid",
    bg: "transparent",

    // visuals
    fill: "#111827",
    stroke: "transparent",
    strokeWidth: 0,

    // shape
    shape: "square",
    customPath: "",
    customSymmetry: "none",

    // motion / pointer
    baseRotate: 0,
    randomJitter: 0,
    seed: 1337,
    trackPointer: true,
    rAFThrottle: 16,

    // influence
    radius: 220,
    strength: 1,
    falloff: "gaussian",
    smooth: 0.15,
    minWeight: 0.02,
    relax: 0.1,

    // toggles
    enableRotate: true,
    enableOpacity: false,
    enableScale: true,
    enablePosition: true,

    // spotlight opacity
    opacityMin: 0.1,
    opacityMax: 1.0,
    opacityCurve: "easeOut",

    // scale effect
    scaleMin: 0.8,
    scaleMax: 1.15,
    scaleCurve: "easeOut",

    // position effect
    posMax: 12,
    posCurve: "easeOut",
    posInvert: false,

    // overflow trimming
    trimEdges: true,
}

addPropertyControls(MagneticPattern, {
    layout: {
        title: "Layout",
        type: ControlType.Enum,
        options: ["grid", "stagger"],
        optionTitles: ["Grid", "Stagger"],
    },

    // overflow trim
    trimEdges: { title: "Trim edges", type: ControlType.Boolean },

    // size/layout
    gapX: {
        title: "Gap X",
        type: ControlType.Number,
        min: 0,
        max: 200,
        step: 1,
    },
    gapY: {
        title: "Gap Y",
        type: ControlType.Number,
        min: 0,
        max: 200,
        step: 1,
    },
    itemW: {
        title: "Item W",
        type: ControlType.Number,
        min: 2,
        max: 500,
        step: 1,
    },
    itemH: {
        title: "Item H",
        type: ControlType.Number,
        min: 2,
        max: 500,
        step: 1,
    },
    bg: { title: "Background", type: ControlType.Color },

    // visuals
    fill: { title: "Fill", type: ControlType.Color },
    stroke: { title: "Stroke", type: ControlType.Color },
    strokeWidth: {
        title: "Stroke W",
        type: ControlType.Number,
        min: 0,
        max: 12,
        step: 1,
    },

    // shape
    shape: {
        title: "Shape",
        type: ControlType.Enum,
        options: ["square", "triangle", "custom"],
        optionTitles: ["Square", "Triangle", "Custom"],
    },
    customPath: {
        title: "Custom Path",
        type: ControlType.String,
        hidden: (p) => p.shape !== "custom",
        displayTextArea: true,
    },
    customSymmetry: {
        title: "Custom Symmetry",
        type: ControlType.Enum,
        options: ["none", "deg180", "deg90"],
        optionTitles: ["None", "180°", "90°"],
        hidden: (p) => p.shape !== "custom",
    },

    // motion / pointer
    baseRotate: {
        title: "Base°",
        type: ControlType.Number,
        min: -180,
        max: 180,
        step: 1,
    },
    randomJitter: {
        title: "Jitter",
        type: ControlType.Number,
        min: 0,
        max: 40,
        step: 1,
    },
    seed: {
        title: "Seed",
        type: ControlType.Number,
        min: 0,
        max: 99999,
        step: 1,
    },

    trackPointer: { title: "Track Pointer", type: ControlType.Boolean },

    rAFThrottle: {
        title: "Throttle ms",
        type: ControlType.Number,
        min: 0,
        max: 100,
        step: 1,
        hidden: (p) => !p.trackPointer,
    },

    // influence (hidden when not tracking)
    radius: {
        title: "Radius px",
        type: ControlType.Number,
        min: 20,
        max: 2000,
        step: 10,
        hidden: (p) => !p.trackPointer,
    },
    strength: {
        title: "Strength",
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.trackPointer,
    },
    falloff: {
        title: "Falloff",
        type: ControlType.Enum,
        options: ["linear", "easeOut", "gaussian"],
        optionTitles: ["Linear", "EaseOut", "Gaussian"],
        hidden: (p) => !p.trackPointer,
    },
    smooth: {
        title: "Smoothing",
        type: ControlType.Number,
        min: 0,
        max: 0.9,
        step: 0.01,
        hidden: (p) => !p.trackPointer,
    },
    minWeight: {
        title: "Min weight",
        type: ControlType.Number,
        min: 0,
        max: 0.2,
        step: 0.005,
        hidden: (p) => !p.trackPointer,
    },
    relax: {
        title: "Relax",
        type: ControlType.Number,
        min: 0,
        max: 0.5,
        step: 0.01,
        hidden: (p) => !p.trackPointer,
    },

    // toggles (hidden when not tracking)
    enableRotate: {
        title: "Rotate on",
        type: ControlType.Boolean,
        hidden: (p) => !p.trackPointer,
    },
    enableOpacity: {
        title: "Opacity on",
        type: ControlType.Boolean,
        hidden: (p) => !p.trackPointer,
    },
    // spotlight opacity (hidden when not tracking or opacity disabled)
    opacityMin: {
        title: "Opacity min",
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.trackPointer || !p.enableOpacity,
    },
    opacityMax: {
        title: "Opacity max",
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.trackPointer || !p.enableOpacity,
    },
    opacityCurve: {
        title: "Opacity curve",
        type: ControlType.Enum,
        options: ["same", "linear", "easeOut", "gaussian"],
        optionTitles: ["Same", "Linear", "EaseOut", "Gaussian"],
        hidden: (p) => !p.trackPointer || !p.enableOpacity,
    },

    enableScale: {
        title: "Scale on",
        type: ControlType.Boolean,
        hidden: (p) => !p.trackPointer,
    },
    // scale effect (hidden when not tracking or scale disabled)
    scaleMin: {
        title: "Scale min",
        type: ControlType.Number,
        min: 0.1,
        max: 3,
        step: 0.01,
        hidden: (p) => !p.trackPointer || !p.enableScale,
    },
    scaleMax: {
        title: "Scale max",
        type: ControlType.Number,
        min: 0.1,
        max: 3,
        step: 0.01,
        hidden: (p) => !p.trackPointer || !p.enableScale,
    },
    scaleCurve: {
        title: "Scale curve",
        type: ControlType.Enum,
        options: ["same", "linear", "easeOut", "gaussian"],
        optionTitles: ["Same", "Linear", "EaseOut", "Gaussian"],
        hidden: (p) => !p.trackPointer || !p.enableScale,
    },

    enablePosition: {
        title: "Position on",
        type: ControlType.Boolean,
        hidden: (p) => !p.trackPointer,
    },
    // position effect (hidden when not tracking or position disabled)
    posMax: {
        title: "Pos max (px)",
        type: ControlType.Number,
        min: 0,
        max: 200,
        step: 1,
        hidden: (p) => !p.trackPointer || !p.enablePosition,
    },
    posCurve: {
        title: "Pos curve",
        type: ControlType.Enum,
        options: ["same", "linear", "easeOut", "gaussian"],
        optionTitles: ["Same", "Linear", "EaseOut", "Gaussian"],
        hidden: (p) => !p.trackPointer || !p.enablePosition,
    },
    posInvert: {
        title: "Invert (away)",
        type: ControlType.Boolean,
        hidden: (p) => !p.trackPointer || !p.enablePosition,
    },
})
