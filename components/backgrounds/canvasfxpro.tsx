// // CanvasFX Pro v3 — Framer Code Component (single file)
// Responsive with aspect control, grouped Property Controls, 30+ effects,
// performance caps (max tiles, quality), pointer-free (no hover, no events), HiDPI-safe.
// Paste as a Code Component in Framer.

import * as React from "react"
import { useEffect, useMemo, useRef } from "react"
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
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 540
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CanvasFXPro(props: Props) {
    const { layout, grid, shapes, fx, color, engine } = props

    // ---- Layout ----
    const aspectMode = layout?.aspectMode ?? "none"
    const aspectCustom = layout?.aspectCustom ?? 1.7778
    const minHeight = layout?.minHeight ?? 200

    // ---- Grid ----
    const density = grid?.density ?? 40
    const tileGap = grid?.tileGap ?? 0.06
    const jitter = grid?.jitter ?? 0.04

    // ---- Shapes ----
    const shape = shapes?.shape ?? ("rounded" as Shape)
    const tileRadius = shapes?.tileRadius ?? 0.16
    const ringThickness = shapes?.ringThickness ?? 0.18
    const strokeOnly = shapes?.strokeOnly ?? false
    const strokeWidth = shapes?.strokeWidth ?? 0.06
    const rotateTiles =
        shapes?.rotateTiles ?? ({ mode: "wave", max: 18 } as RotateTiles)

    // ---- Effects ----
    const effect = fx?.effect ?? ("swirl" as Effect)
    const edge = fx?.edge ?? 0.12
    const ripple = fx?.ripple ?? 5
    const tightness = fx?.tightness ?? 3
    const speed = fx?.speed ?? 0.03
    const globalRotation = fx?.globalRotation ?? 0
    const FX1 = fx?.fx1 ?? 1
    const FX2 = fx?.fx2 ?? 1
    const FX3 = fx?.fx3 ?? 1
    const FX4 = fx?.fx4 ?? 1

    // ---- Color ----
    const colorMode = color?.colorMode ?? ("palette" as ColorMode)
    const color1 = color?.color1 ?? "hsl(343, 90%, 50%)"
    const color2 = color?.color2 ?? "hsl(43, 90%, 50%)"
    const color3 = color?.color3 ?? "hsl(223, 90%, 50%)"
    const color4 = color?.color4 ?? ""
    const gradientAngle = color?.gradientAngle ?? 0
    const gradientRadial = color?.gradientRadial ?? false
    const useAutoBW = color?.useAutoBW ?? true
    const blankOverride = color?.blankOverride ?? "#000000"
    const globalAlpha = color?.globalAlpha ?? 1
    const composite = (color?.composite ??
        "source-over") as GlobalCompositeOperation

    // ---- Engine / Perf ----
    const seed = engine?.seed ?? 1337
    const fps = engine?.fps ?? 60
    const pause = engine?.pause ?? false
    const qualityScale = engine?.qualityScale ?? 1
    const maxTiles = engine?.maxTiles ?? 8000
    const renderMode = engine?.renderMode ?? ("full" as RenderMode)

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const lastFrameRef = useRef<number>(0)
    const timeRef = useRef<number>(0)

    // Dark scheme detection
    const isDarkScheme = useMemo(() => {
        if (typeof window === "undefined" || !("matchMedia" in window))
            return false
        return window.matchMedia("(prefers-color-scheme: dark)").matches
    }, [])

    const blankColor = useMemo(() => {
        if (!useAutoBW) return blankOverride || "#000"
        return isDarkScheme ? "#fff" : "#000"
    }, [useAutoBW, blankOverride, isDarkScheme])

    // Seeded RNG
    const rng = useMemo(() => mulberry32(seed >>> 0 || 1), [seed])

    // Palette
    const palette = useMemo(() => {
        const p = [color1, color2, color3, color4].filter(Boolean) as string[]
        return p.length
            ? p
            : ["hsl(343, 90%, 50%)", "hsl(43, 90%, 50%)", "hsl(223, 90%, 50%)"]
    }, [color1, color2, color3, color4])

    // Main loop
    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Resize to container with aspect handling
        const resizeToContainer = () => {
            const ratio =
                typeof window !== "undefined"
                    ? Math.max(1, window.devicePixelRatio || 1)
                    : 1
            let cssW = Math.max(1, container.clientWidth)
            let cssH = Math.max(minHeight || 1, container.clientHeight)

            if (cssH <= (minHeight || 0)) {
                const ar = aspectToNumber(aspectMode, aspectCustom)
                if (ar > 0)
                    cssH = Math.max(minHeight || 1, Math.round(cssW / ar))
            }

            const q = clamp(qualityScale, 0.25, 1)
            const bw = Math.max(1, Math.floor(cssW * ratio * q))
            const bh = Math.max(1, Math.floor(cssH * ratio * q))

            if (canvas.width !== bw || canvas.height !== bh) {
                canvas.width = bw
                canvas.height = bh
                canvas.style.width = cssW + "px"
                canvas.style.height = cssH + "px"
                ctx.setTransform(1, 0, 0, 1, 0, 0)
                ctx.scale(bw / cssW, bh / cssH)
            }
        }

        resizeToContainer()
        const ro = new ResizeObserver(resizeToContainer)
        ro.observe(container)

        // Build grid w/ tile cap
        let rows = 0
        let cols = 0
        let cell = 0
        let distanceMax = 1
        let colorGrid: string[][] = []
        let jitterGrid: { jx: number; jy: number }[][] = []

        const buildGrid = () => {
            const w = Math.max(1, canvas.clientWidth)
            const h = Math.max(1, canvas.clientHeight)

            const densEff = effectiveDensity(density, w, h, maxTiles)
            cell = Math.max(2, Math.min(w, h) / Math.max(1, densEff))
            cols = Math.max(1, Math.ceil(w / cell))
            rows = Math.max(1, Math.ceil(h / cell))
            distanceMax = Math.hypot(w / 2, h / 2)

            colorGrid = new Array(cols)
            jitterGrid = new Array(cols)
            for (let i = 0; i < cols; i++) {
                colorGrid[i] = new Array(rows)
                jitterGrid[i] = new Array(rows)
                for (let j = 0; j < rows; j++) {
                    if (colorMode === "palette")
                        colorGrid[i][j] =
                            palette[Math.floor(rng() * palette.length)] ||
                            blankColor
                    else colorGrid[i][j] = blankColor
                    const jx = (rng() * 2 - 1) * jitter * cell
                    const jy = (rng() * 2 - 1) * jitter * cell
                    jitterGrid[i][j] = { jx, jy }
                }
            }
        }

        buildGrid()
        const ro2 = new ResizeObserver(() => {
            resizeToContainer()
            buildGrid()
        })
        ro2.observe(canvas)

        const targetFrame = fps > 0 ? 1000 / fps : 0
        const rad = (deg: number) => (deg * Math.PI) / 180
        const gRot = rad(globalRotation)
        const cosR = Math.cos(gRot)
        const sinR = Math.sin(gRot)

        // Precompute constants per frame which don't depend on i/j
        const usesAngleSet = new Set<Effect>([
            "swirl",
            "angular",
            "spiralArms",
            "orbitals",
            "swirlDual",
            "orbitDrift",
            "sunburst",
            "angleRip",
            "meteor",
        ]) // effects that need angle

        const loop = (now: number) => {
            rafRef.current = requestAnimationFrame(loop)
            if (pause) return
            if (targetFrame) {
                const dt = now - lastFrameRef.current
                if (dt < targetFrame) return
                lastFrameRef.current = now
            }

            timeRef.current += speed
            const t = timeRef.current

            const w = canvas.clientWidth
            const h = canvas.clientHeight
            ctx.save()
            ctx.clearRect(0, 0, w, h)
            ctx.globalAlpha = clamp(globalAlpha, 0, 1)
            ctx.globalCompositeOperation = composite

            // Gradients
            let grad: CanvasGradient | null = null
            if (colorMode === "gradient") {
                const cx = w / 2,
                    cy = h / 2
                if (gradientRadial) {
                    const r = Math.hypot(cx, cy)
                    grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
                } else {
                    const a = rad(gradientAngle)
                    const r = Math.hypot(cx, cy)
                    const x1 = cx + Math.cos(a) * -r
                    const y1 = cy + Math.sin(a) * -r
                    const x2 = cx + Math.cos(a) * r
                    const y2 = cy + Math.sin(a) * r
                    grad = ctx.createLinearGradient(x1, y1, x2, y2)
                }
                const gColors = palette.length
                    ? palette
                    : [blankColor, invertColor(blankColor)]
                const stops = gColors.length
                for (let i = 0; i < stops; i++)
                    grad.addColorStop(i / (stops - 1 || 1), gColors[i])
            }

            const e1 = 0.5 - edge
            const e2 = 0.5 + edge
            const centerX = w / 2
            const centerY = h / 2
            const gapPx = clamp(tileGap, 0, 0.49) * cell
            const usable = Math.max(0, cell - gapPx * 2)

            // Optionally disable expensive transforms in FAST mode
            const allowRotation =
                renderMode === "full" &&
                rotateTiles?.mode !== "off" &&
                rotateTiles?.max > 0

            for (let i = 0; i < cols; i++) {
                const baseX = i * cell
                for (let j = 0; j < rows; j++) {
                    const baseY = j * cell
                    const { jx, jy } = jitterGrid[i][j]

                    // Tile center in field space
                    const cx = baseX + cell / 2 + jx
                    const cy = baseY + cell / 2 + jy
                    const rx = cosR * (cx - centerX) - sinR * (cy - centerY)
                    const ry = sinR * (cx - centerX) + cosR * (cy - centerY)
                    const dist = Math.hypot(rx, ry)
                    const distN = distanceMax > 0 ? dist / distanceMax : 0
                    const needAngle = usesAngleSet.has(effect)
                    const angle = needAngle ? Math.atan2(ry, rx) : 0

                    // ---- EFFECT FIELD ----
                    const wave = computeWave({
                        effect,
                        t,
                        rx,
                        ry,
                        i,
                        j,
                        dist,
                        distN,
                        angle,
                        tightness,
                        ripple,
                        fx1: FX1,
                        fx2: FX2,
                        fx3: FX3,
                        fx4: FX4,
                        pointer: null,
                        centerX,
                        centerY,
                    })

                    const wave01 = (wave + 1) / 2
                    const waveEdged = smoothStep(clamp(wave01, 0, 1), e1, e2)

                    // Tile rect & size
                    const size = usable * (0.18 + 0.82 * waveEdged)
                    const x = cx - size / 2
                    const y = cy - size / 2

                    // Color resolve
                    let fill: string | CanvasGradient = blankColor
                    if (colorMode === "palette") fill = colorGrid[i][j]
                    else if (colorMode === "gradient" && grad) fill = grad
                    else if (colorMode === "bw")
                        fill =
                            ((i + j) & 1) === 0
                                ? blankColor
                                : invertColor(blankColor)

                    ctx.fillStyle = fill as any
                    ctx.strokeStyle = fill as any
                    ctx.lineWidth = Math.max(1, strokeWidth * size)

                    const rot = allowRotation
                        ? resolveRotation(
                              rotateTiles!,
                              waveEdged,
                              i,
                              j,
                              timeRef.current
                          )
                        : 0
                    drawShapeFast(
                        ctx,
                        shape,
                        x,
                        y,
                        size,
                        tileRadius,
                        rot,
                        ringThickness,
                        strokeOnly
                    )
                }
            }

            ctx.restore()
        }

        rafRef.current = requestAnimationFrame(loop)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            ro.disconnect()
            ro2.disconnect()
        }
    }, [
        aspectMode,
        aspectCustom,
        minHeight,
        density,
        tileGap,
        shape,
        tileRadius,
        ringThickness,
        strokeOnly,
        strokeWidth,
        rotateTiles,
        jitter,
        effect,
        edge,
        ripple,
        tightness,
        speed,
        globalRotation,
        FX1,
        FX2,
        FX3,
        FX4,
        colorMode,
        color1,
        color2,
        color3,
        color4,
        gradientAngle,
        gradientRadial,
        useAutoBW,
        blankOverride,
        globalAlpha,
        composite,
        seed,
        fps,
        pause,
        qualityScale,
        maxTiles,
        renderMode,
    ])

    const ar = aspectToNumber(aspectMode, aspectCustom)
    const wrapperStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: aspectMode === "none" ? "100%" : "auto",
        minHeight: minHeight || undefined,
        ...(aspectMode !== "none" ? { aspectRatio: ar || undefined } : {}),
        display: "block",
    }

    return (
        <div ref={containerRef} style={wrapperStyle}>
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

/* ----------------------------- Utils ----------------------------- */
function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function clamp(x: number, a: number, b: number) {
    return Math.max(a, Math.min(b, x))
}

function smoothStep(x: number, edge1: number, edge2: number) {
    const t = clamp((x - edge1) / (edge2 - edge1), 0, 1)
    return t * t * (3 - 2 * t)
}

function invertColor(hexOrCss: string) {
    if (!hexOrCss || hexOrCss[0] !== "#") return "#ffffff"
    const hex = hexOrCss.replace("#", "")
    const bigint = parseInt(
        hex.length === 3
            ? hex
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : hex,
        16
    )
    const r = 255 - ((bigint >> 16) & 255)
    const g = 255 - ((bigint >> 8) & 255)
    const b = 255 - (bigint & 255)
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function hash2(i: number, j: number) {
    let x = i * 374761393 + j * 668265263
    x = (x ^ (x >> 13)) * 1274126177
    x = (x ^ (x >> 16)) >>> 0
    return (x % 10000) / 10000
}

function aspectToNumber(mode: AspectMode, custom?: number) {
    switch (mode) {
        case "1:1":
            return 1
        case "16:9":
            return 16 / 9
        case "4:3":
            return 4 / 3
        case "2:1":
            return 2
        case "custom":
            return Math.max(0.1, custom || 1)
        default:
            return 0
    }
}

function effectiveDensity(dens: number, w: number, h: number, cap: number) {
    const aspectFactor = (w * h) / Math.min(w, h) ** 2
    const maxD = Math.sqrt(Math.max(1, cap) / Math.max(0.0001, aspectFactor))
    return Math.min(dens, maxD)
}

function resolveRotation(
    rot: RotateTiles,
    waveEdged: number,
    i: number,
    j: number,
    t: number
) {
    const max = rot?.max || 0
    switch (rot?.mode) {
        case "wave":
            return (waveEdged - 0.5) * 2 * max
        case "random":
            return (hash2(i, j) - 0.5) * 2 * max
        case "spin":
            return ((t * 30) % 360) * (max / 180)
        default:
            return 0
    }
}

/* ----------------------------- Effects ----------------------------- */
function frac(x: number) {
    return x - Math.floor(x)
}
function saw(x: number) {
    return 2 * (frac(x / (2 * Math.PI)) - 0.5)
}

function computeWave(args: WaveArgs) {
    const {
        effect,
        t,
        rx,
        ry,
        i,
        j,
        dist,
        distN,
        angle,
        tightness,
        ripple,
        fx1,
        fx2,
        fx3,
        fx4,
    } = args

    const A = tightness
    const R = ripple
    const F1 = fx1
    const F2 = fx2
    const F3 = fx3
    const F4 = fx4

    switch (effect) {
        // 1–5: legacy
        case "swirl":
            return Math.sin(distN * A * (1 + R * distN) + angle - t)
        case "radial":
            return Math.sin(distN * (A + R) - t)
        case "angular":
            return Math.sin(angle * A + R * distN - t)
        case "noiseFlow":
            return Math.sin(
                (rx * 0.01 * (F1 || 1) + ry * 0.013 * (F2 || 1)) * A +
                    R * Math.sin(ry * 0.005 * (F3 || 1)) -
                    t
            )
        case "pulse":
            return Math.sin(t + distN * (R || 1))

        // 6–20: previous new ones
        case "rippleRings":
            return Math.sin(dist * 0.02 * (A * 0.8 + 0.2) * (F1 || 1) - t)
        case "vortex":
            return Math.sin(distN * A + angle * (R * 1.5 + 1) - t * 1.2)
        case "turbulence":
            return clamp(
                (Math.sin(rx * 0.02 * (F1 || 1) + t * 0.8) +
                    Math.cos(ry * 0.018 * (F2 || 1) - t * 0.6)) *
                    0.5,
                -1,
                1
            )
        case "checkerFlow":
            return (
                Math.sin(i * 0.8 * (F1 || 1) + t) *
                Math.cos(j * 0.9 * (F2 || 1) - t * 0.7)
            )
        case "spiralArms":
            return Math.sin(
                angle * Math.max(1, Math.round(F1 || 3)) +
                    Math.log(1 + distN * A * 4) -
                    t
            )
        case "bloomPulse":
            return (1 - distN) * Math.sin(t * (F1 || 1))
        case "lissajousGrid":
            return (
                Math.sin(i * 0.3 * (F1 || 1.5) - t) +
                Math.sin(j * 0.35 * (F2 || 1.0) + t * 0.8)
            )
        case "shearWave":
            return Math.sin((rx + ry * (F1 || 0.6)) * 0.02 * (F2 || 1) - t)
        case "orbitals":
            return Math.sin(distN * A + Math.sin(angle * 2 - t) * (R || 1))
        case "swirlDual": {
            const off = F1 || 120
            const dx = rx - off,
                dy = ry
            const d1 = Math.hypot(dx, dy)
            const d2 = Math.hypot(rx + off, ry)
            return (
                Math.sin(d1 * 0.02 * (A || 1) - t) *
                Math.cos(d2 * 0.02 * (R || 1) - t)
            )
        }
        case "attractor": {
            // pointer-free: attractor centered
            const d = Math.hypot(rx, ry)
            return Math.sin(d * 0.02 * (F1 || 1) - t)
        }
        case "waveCurls":
            return Math.sin(
                (rx * 0.015 * (F1 || 1) +
                    Math.sin(ry * 0.012 * (F2 || 1) + t)) *
                    A -
                    t
            )
        case "orbitDrift":
            return Math.sin(angle + t) * Math.cos(distN * (R + 1) - t)
        case "radialSaw":
            return clamp(saw(distN * (A + R) - t), -1, 1)
        case "timeChop":
            return Math.sin(
                distN * A + angle * R - Math.floor(t * (F1 || 6)) / (F1 || 6)
            )
        case "ringBeat":
            return Math.sin(
                (distN * A - t) * (1 + Math.sin(t * 0.5 * (F1 || 1)))
            )
        case "gridBend":
            return (
                Math.sin((i * 0.25 + j * 0.25) * (F1 || 1) + t) *
                Math.cos((i * 0.17 - j * 0.17) * (F2 || 1) - t)
            )
        case "angleRip":
            return Math.sin(angle * (F1 || 3) + distN * (F2 || 6) - t)

        // 21–30: NEW 10 effects (+ alias fix)
        case "moire":
            return Math.sin(
                (Math.sin(rx * 0.03 * (F1 || 1) + t) +
                    Math.sin(ry * 0.031 * (F2 || 1) - t)) *
                    (A * 0.8)
            )
        case "plasma": {
            const p =
                Math.sin(rx * 0.02 + t) +
                Math.sin(ry * 0.021 - t) +
                Math.sin(dist * 0.02)
            return clamp(p / 3, -1, 1)
        }
        case "cellNoise": {
            const c = Math.sin(i * (F1 || 1) + t) + Math.cos(j * (F2 || 1) - t)
            return Math.sin(c * 3)
        }
        case "shockwave": {
            const ring = dist * 0.02 - t * (F1 || 1)
            const k = 1 / (1 + ring * ring)
            return clamp(Math.sin(ring * (A + 1)) * k * 2, -1, 1)
        }
        case "shakewave": {
            const ring = dist * 0.02 - t * (F1 || 1)
            const k = 1 / (1 + ring * ring)
            return clamp(Math.sin(ring * (A + 1)) * k * 2, -1, 1)
        } // alias
        case "meteor": {
            const trail =
                Math.cos(angle * (F1 || 8) - t * 2) *
                Math.exp(-distN * (F2 || 4))
            return clamp(trail, -1, 1)
        }
        case "twirlNoise": {
            const tw = Math.sin(angle * (F1 || 5) + distN * (A + R) - t)
            const nf = Math.sin((rx * 0.012 + ry * 0.017) * (F2 || 1) + t * 0.5)
            return clamp((tw + nf) * 0.5, -1, 1)
        }
        case "gridPulse":
            return (
                Math.sin((i + t * (F1 || 1)) * 0.6) *
                Math.sin((j - t * (F2 || 1)) * 0.6)
            )
        case "sunburst": {
            const arms = Math.max(2, Math.round(F1 || 12))
            return Math.sin(angle * arms - t) * (1 - distN)
        }
        case "curtain":
            return (
                Math.sin(ry * 0.02 * (F1 || 1) - t) *
                Math.cos(rx * 0.01 * (F2 || 1))
            )
        case "zigzag": {
            const z =
                saw(rx * 0.02 * (F1 || 1) + t) * saw(ry * 0.02 * (F2 || 1) - t)
            return clamp(z, -1, 1)
        }

        default:
            return 0
    }
}

/* ----------------------------- Shapes ----------------------------- */
function drawShapeFast(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    x: number,
    y: number,
    size: number,
    radiusFrac: number,
    rotationDeg: number,
    ringThickness: number,
    strokeOnly: boolean
) {
    const r = clamp(radiusFrac, 0, 0.5) * size
    const cx = x + size / 2
    const cy = y + size / 2

    // Avoid save/restore if no rotation for perf
    if (rotationDeg) {
        ctx.save()
        const rad = (rotationDeg * Math.PI) / 180
        ctx.translate(cx, cy)
        ctx.rotate(rad)
        ctx.translate(-cx, -cy)
        drawCore()
        ctx.restore()
    } else {
        drawCore()
    }

    function drawCore() {
        switch (shape) {
            case "square": {
                strokeOnly
                    ? ctx.strokeRect(x, y, size, size)
                    : ctx.fillRect(x, y, size, size)
                break
            }
            case "rounded": {
                roundRect(ctx, x, y, size, size, r)
                strokeOnly ? ctx.stroke() : ctx.fill()
                break
            }
            case "circle": {
                ctx.beginPath()
                ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
                ctx.closePath()
                strokeOnly ? ctx.stroke() : ctx.fill()
                break
            }
            case "diamond": {
                ctx.beginPath()
                ctx.moveTo(cx, y)
                ctx.lineTo(x + size, cy)
                ctx.lineTo(cx, y + size)
                ctx.lineTo(x, cy)
                ctx.closePath()
                strokeOnly ? ctx.stroke() : ctx.fill()
                break
            }
            case "ring": {
                ctx.lineWidth = clamp(ringThickness, 0.02, 0.9) * size
                ctx.beginPath()
                ctx.arc(cx, cy, size / 2 - ctx.lineWidth / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.stroke()
                break
            }
            case "hex": {
                const s = size / 2
                const a = Math.PI / 3
                ctx.beginPath()
                for (let k = 0; k < 6; k++) {
                    const px = cx + s * Math.cos(a * k)
                    const py = cy + s * Math.sin(a * k)
                    k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
                }
                ctx.closePath()
                strokeOnly ? ctx.stroke() : ctx.fill()
                break
            }
            case "triangle": {
                ctx.beginPath()
                ctx.moveTo(cx, y)
                ctx.lineTo(x + size, y + size)
                ctx.lineTo(x, y + size)
                ctx.closePath()
                strokeOnly ? ctx.stroke() : ctx.fill()
                break
            }
            case "star": {
                const spikes = 5
                const outer = size / 2
                const inner = outer * 0.5
                let rot = (Math.PI / 2) * 3
                let px = cx,
                    py = cy
                ctx.beginPath()
                ctx.moveTo(cx, cy - outer)
                for (let i = 0; i < spikes; i++) {
                    px = cx + Math.cos(rot) * outer
                    py = cy + Math.sin(rot) * outer
                    ctx.lineTo(px, py)
                    rot += Math.PI / spikes
                    px = cx + Math.cos(rot) * inner
                    py = cy + Math.sin(rot) * inner
                    ctx.lineTo(px, py)
                    rot += Math.PI / spikes
                }
                ctx.lineTo(cx, cy - outer)
                ctx.closePath()
                strokeOnly ? ctx.stroke() : ctx.fill()
                break
            }
            case "cross": {
                const t = size * 0.3
                if (strokeOnly) {
                    ctx.strokeRect(cx - t / 2, y, t, size)
                    ctx.strokeRect(x, cy - t / 2, size, t)
                } else {
                    ctx.fillRect(cx - t / 2, y, t, size)
                    ctx.fillRect(x, cy - t / 2, size, t)
                }
                break
            }
        }
    }
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.lineTo(x + w - rr, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
    ctx.lineTo(x + w, y + h - rr)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
    ctx.lineTo(x + rr, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
    ctx.lineTo(x, y + rr)
    ctx.quadraticCurveTo(x, y, x + rr, y)
    ctx.closePath()
}

/* ----------------------- Types & Grouped Controls ----------------------- */
export type AspectMode = "none" | "1:1" | "16:9" | "4:3" | "2:1" | "custom"
export type RenderMode = "full" | "fast"
export type RotateTiles = {
    mode: "off" | "wave" | "random" | "spin"
    max: number
}
export type Shape =
    | "square"
    | "rounded"
    | "circle"
    | "diamond"
    | "ring"
    | "hex"
    | "triangle"
    | "star"
    | "cross"
export type Effect =
    | "swirl"
    | "radial"
    | "angular"
    | "noiseFlow"
    | "pulse"
    | "rippleRings"
    | "vortex"
    | "turbulence"
    | "checkerFlow"
    | "spiralArms"
    | "bloomPulse"
    | "lissajousGrid"
    | "shearWave"
    | "orbitals"
    | "swirlDual"
    | "attractor"
    | "waveCurls"
    | "orbitDrift"
    | "radialSaw"
    | "timeChop"
    | "ringBeat"
    | "gridBend"
    | "angleRip"
    // new 10
    | "moire"
    | "plasma"
    | "cellNoise"
    | "shockwave"
    | "shakewave"
    | "meteor"
    | "twirlNoise"
    | "gridPulse"
    | "sunburst"
    | "curtain"
    | "zigzag"
export type ColorMode = "palette" | "gradient" | "bw"

export type LayoutSettings = {
    aspectMode: AspectMode
    aspectCustom?: number
    minHeight?: number
}
export type GridSettings = { density: number; tileGap: number; jitter: number }
export type ShapeSettings = {
    shape: Shape
    tileRadius: number
    ringThickness: number
    strokeOnly: boolean
    strokeWidth: number
    rotateTiles: RotateTiles
}
export type EffectSettings = {
    effect: Effect
    edge: number
    ripple: number
    tightness: number
    speed: number
    globalRotation: number
    fx1: number
    fx2: number
    fx3: number
    fx4: number
}
export type ColorSettings = {
    colorMode: ColorMode
    color1: string
    color2: string
    color3: string
    color4: string
    gradientAngle: number
    gradientRadial: boolean
    useAutoBW: boolean
    blankOverride: string
    globalAlpha: number
    composite: GlobalCompositeOperation
}
export type EngineSettings = {
    seed: number
    fps: number
    pause: boolean
    qualityScale: number
    maxTiles: number
    renderMode: RenderMode
}
export type Props = {
    layout: LayoutSettings
    grid: GridSettings
    shapes: ShapeSettings
    fx: EffectSettings
    color: ColorSettings
    engine: EngineSettings
}

CanvasFXPro.defaultProps = {
    layout: {
        aspectMode: "none",
        aspectCustom: 1.7778,
        minHeight: 200,
    } as LayoutSettings,
    grid: { density: 40, tileGap: 0.06, jitter: 0.04 } as GridSettings,
    shapes: {
        shape: "rounded",
        tileRadius: 0.16,
        ringThickness: 0.18,
        strokeOnly: false,
        strokeWidth: 0.06,
        rotateTiles: { mode: "wave", max: 18 },
    } as ShapeSettings,
    fx: {
        effect: "swirl",
        edge: 0.12,
        ripple: 5,
        tightness: 3,
        speed: 0.03,
        globalRotation: 0,
        fx1: 1,
        fx2: 1,
        fx3: 1,
        fx4: 1,
    } as EffectSettings,
    color: {
        colorMode: "palette",
        color1: "hsl(343, 90%, 50%)",
        color2: "hsl(43, 90%, 50%)",
        color3: "hsl(223, 90%, 50%)",
        color4: "",
        gradientAngle: 0,
        gradientRadial: false,
        useAutoBW: true,
        blankOverride: "#000000",
        globalAlpha: 1,
        composite: "source-over",
    } as ColorSettings,
    engine: {
        seed: 1337,
        fps: 60,
        pause: false,
        qualityScale: 1,
        maxTiles: 8000,
        renderMode: "full",
    } as EngineSettings,
}

addPropertyControls(CanvasFXPro, {
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            aspectMode: {
                type: ControlType.Enum,
                title: "Aspect",
                options: ["none", "1:1", "16:9", "4:3", "2:1", "custom"],
                optionTitles: ["None", "1:1", "16:9", "4:3", "2:1", "Custom"],
            },
            aspectCustom: {
                type: ControlType.Number,
                title: "Custom AR",
                min: 0.2,
                max: 4,
                step: 0.01,
                hidden: (p) => p.layout?.aspectMode !== "custom",
            },
            minHeight: {
                type: ControlType.Number,
                title: "MinH",
                min: 0,
                max: 1200,
                step: 1,
                displayStepper: true,
            },
        },
    },
    grid: {
        type: ControlType.Object,
        title: "Grid",
        controls: {
            density: {
                type: ControlType.Number,
                title: "Density",
                min: 4,
                max: 200,
                step: 1,
                displayStepper: true,
            },
            tileGap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 0.49,
                step: 0.005,
            },
            jitter: {
                type: ControlType.Number,
                title: "Jitter",
                min: 0,
                max: 0.5,
                step: 0.005,
            },
        },
    },
    shapes: {
        type: ControlType.Object,
        title: "Shapes",
        controls: {
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: [
                    "square",
                    "rounded",
                    "circle",
                    "diamond",
                    "ring",
                    "hex",
                    "triangle",
                    "star",
                    "cross",
                ],
                optionTitles: [
                    "Square",
                    "Rounded",
                    "Circle",
                    "Diamond",
                    "Ring",
                    "Hex",
                    "Triangle",
                    "Star",
                    "Cross",
                ],
            },
            tileRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 0.5,
                step: 0.01,
                hidden: (p) => p.shapes?.shape !== "rounded",
            },
            ringThickness: {
                type: ControlType.Number,
                title: "Ring T",
                min: 0.02,
                max: 0.9,
                step: 0.01,
                hidden: (p) => p.shapes?.shape !== "ring",
            },
            strokeOnly: { type: ControlType.Boolean, title: "Stroke" },
            strokeWidth: {
                type: ControlType.Number,
                title: "StrokeW",
                min: 0.01,
                max: 0.4,
                step: 0.005,
            },
            rotateTiles: {
                type: ControlType.Object,
                title: "Rotate",
                controls: {
                    mode: {
                        type: ControlType.Enum,
                        options: ["off", "wave", "random", "spin"],
                        optionTitles: ["Off", "Wave", "Random", "Spin"],
                    },
                    max: {
                        type: ControlType.Number,
                        min: 0,
                        max: 180,
                        step: 1,
                        displayStepper: true,
                    },
                },
            },
        },
    },
    fx: {
        type: ControlType.Object,
        title: "Effect",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Type",
                options: [
                    "swirl",
                    "radial",
                    "angular",
                    "noiseFlow",
                    "pulse",
                    "rippleRings",
                    "vortex",
                    "turbulence",
                    "checkerFlow",
                    "spiralArms",
                    "bloomPulse",
                    "lissajousGrid",
                    "shearWave",
                    "orbitals",
                    "swirlDual",
                    "attractor",
                    "waveCurls",
                    "orbitDrift",
                    "radialSaw",
                    "timeChop",
                    "ringBeat",
                    "gridBend",
                    "angleRip",
                    "moire",
                    "plasma",
                    "cellNoise",
                    "shockwave",
                    "shakewave",
                    "meteor",
                    "twirlNoise",
                    "gridPulse",
                    "sunburst",
                    "curtain",
                    "zigzag",
                ],
                optionTitles: [
                    "Swirl",
                    "Radial",
                    "Angular",
                    "NoiseFlow",
                    "Pulse",
                    "RippleRings",
                    "Vortex",
                    "Turbulence",
                    "CheckerFlow",
                    "SpiralArms",
                    "BloomPulse",
                    "Lissajous",
                    "Shear",
                    "Orbitals",
                    "SwirlDual",
                    "Attractor",
                    "WaveCurls",
                    "OrbitDrift",
                    "RadialSaw",
                    "TimeChop",
                    "RingBeat",
                    "GridBend",
                    "AngleRip",
                    "Moire",
                    "Plasma",
                    "CellNoise",
                    "Shockwave",
                    "Shakewave",
                    "Meteor",
                    "TwirlNoise",
                    "GridPulse",
                    "Sunburst",
                    "Curtain",
                    "ZigZag",
                ],
            },
            edge: {
                type: ControlType.Number,
                title: "Edge",
                min: 0.01,
                max: 0.49,
                step: 0.005,
            },
            ripple: {
                type: ControlType.Number,
                title: "Ripple",
                min: 0,
                max: 10,
                step: 0.1,
            },
            tightness: {
                type: ControlType.Number,
                title: "Tight",
                min: 0.5,
                max: 8,
                step: 0.1,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 0.5,
                step: 0.001,
            },
            globalRotation: {
                type: ControlType.Number,
                title: "FieldRot",
                min: -180,
                max: 180,
                step: 1,
            },
            fx1: {
                type: ControlType.Number,
                title: "FX1",
                min: 0,
                max: 8,
                step: 0.01,
            },
            fx2: {
                type: ControlType.Number,
                title: "FX2",
                min: 0,
                max: 8,
                step: 0.01,
            },
            fx3: {
                type: ControlType.Number,
                title: "FX3",
                min: 0,
                max: 8,
                step: 0.01,
            },
            fx4: {
                type: ControlType.Number,
                title: "FX4",
                min: 0,
                max: 8,
                step: 0.01,
            },
        },
    },
    color: {
        type: ControlType.Object,
        title: "Color",
        controls: {
            colorMode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["palette", "gradient", "bw"],
                optionTitles: ["Palette", "Gradient", "B/W"],
            },
            color1: {
                type: ControlType.Color,
                title: "C1",
                hidden: (p) => p.color?.colorMode === "bw",
            },
            color2: {
                type: ControlType.Color,
                title: "C2",
                hidden: (p) => p.color?.colorMode === "bw",
            },
            color3: {
                type: ControlType.Color,
                title: "C3",
                hidden: (p) => p.color?.colorMode === "bw",
            },
            color4: {
                type: ControlType.Color,
                title: "C4",
                hidden: (p) => p.color?.colorMode === "bw",
            },
            gradientAngle: {
                type: ControlType.Number,
                title: "Grad°",
                min: 0,
                max: 360,
                step: 1,
                hidden: (p) =>
                    p.color?.colorMode !== "gradient" ||
                    p.color?.gradientRadial,
            },
            gradientRadial: {
                type: ControlType.Boolean,
                title: "Radial",
                hidden: (p) => p.color?.colorMode !== "gradient",
            },
            useAutoBW: {
                type: ControlType.Boolean,
                title: "Auto B/W",
                hidden: (p) => p.color?.colorMode !== "bw",
            },
            blankOverride: {
                type: ControlType.Color,
                title: "Blank",
                hidden: (p) =>
                    p.color?.colorMode !== "bw" || p.color?.useAutoBW,
            },
            globalAlpha: {
                type: ControlType.Number,
                title: "Alpha",
                min: 0.05,
                max: 1,
                step: 0.01,
            },
            composite: {
                type: ControlType.Enum,
                title: "Blend",
                options: [
                    "source-over",
                    "lighter",
                    "multiply",
                    "screen",
                    "overlay",
                    "difference",
                    "exclusion",
                    "color-dodge",
                    "color-burn",
                ],
                optionTitles: [
                    "Normal",
                    "Add",
                    "Multiply",
                    "Screen",
                    "Overlay",
                    "Diff",
                    "Excl",
                    "Dodge",
                    "Burn",
                ],
            },
        },
    },
    engine: {
        type: ControlType.Object,
        title: "Engine",
        controls: {
            seed: {
                type: ControlType.Number,
                title: "Seed",
                min: 0,
                max: 9999,
                step: 1,
                displayStepper: true,
            },
            fps: {
                type: ControlType.Number,
                title: "FPS",
                min: 0,
                max: 120,
                step: 1,
                displayStepper: true,
            },
            pause: { type: ControlType.Boolean, title: "Pause" },
            qualityScale: {
                type: ControlType.Number,
                title: "Quality",
                min: 0.25,
                max: 1,
                step: 0.01,
            },
            maxTiles: {
                type: ControlType.Number,
                title: "MaxTiles",
                min: 500,
                max: 20000,
                step: 100,
                displayStepper: true,
            },
            renderMode: {
                type: ControlType.SegmentedEnum,
                title: "Mode",
                options: ["full", "fast"],
                optionTitles: ["Full", "Fast"],
            },
        },
        description: "Made by [OtVos Studio](https://x.com/OtVosStudio)",
    },
})

/* ----------------------------- Types ----------------------------- */
type WaveArgs = {
    effect: Effect
    t: number
    rx: number
    ry: number
    i: number
    j: number
    dist: number
    distN: number
    angle: number
    tightness: number
    ripple: number
    fx1: number
    fx2: number
    fx3: number
    fx4: number
    pointer: null
    centerX: number
    centerY: number
}
