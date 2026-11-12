import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ───────────────── helpers
type Img = { src: any }
type Shape = "rounded" | "circle"
type Fit = "cover" | "contain" | "center" | "fill"

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const decay = (basePerFrame: number, dt: number) =>
    Math.pow(basePerFrame, dt * 60)

function getImgSrc(x: any) {
    if (!x) return null
    if (typeof x === "string") return x
    const ks = ["src", "srcSet", "url", "default", "1x", "2x"] as const
    const k = ks.find((k) => typeof (x as any)[k] === "string" && (x as any)[k])
    return k ? (x as any)[k] : null
}
function mulberry32(seed: number) {
    let t = seed >>> 0
    return () => {
        t += 0x6d2b79f5
        let r = Math.imul(t ^ (t >>> 15), 1 | t)
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
}
const randInt = (rng: () => number, lo: number, hi: number) =>
    lo + Math.floor(rng() * (hi - lo + 1))

// ───────────────── props (no Utilities)
interface Props {
    images: Img[]

    layout: { type: "hex" | "rect"; spacing: number; hexYRatio: number }
    sizing: {
        centerSize: number
        edgeSize: number
        minDrawSize: number
        sizeCurve: number
        parabC: number
    }
    packing: { pullIn: number; pullCurve: number }
    render: {
        shape: Shape
        radius: number
        radiusMax: boolean
        contentFit: Fit
        alphaByScale: boolean
    }
    motion: {
        overscroll: number
        springStiffness: number
        springDamping: number
        friction: number
        dragSmooth: number
    }
    repeat: {
        repeatEnabled: boolean
        repeatSeed: number
        repeatTilesX: number
        repeatTilesY: number
        avoidAdjDuplicates: boolean
    }
}

type Slot = { x: number; y: number; imgIndex: number }
type Grid = { slots: Slot[]; width: number; height: number }

// ───────────────── grid builder
function buildGridFinite(opts: {
    N: number
    layout: "hex" | "rect"
    spacing: number
    hexY: number
    repeatEnabled: boolean
    repX: number
    repY: number
    seed: number
    avoidAdj: boolean
}): Grid {
    const {
        N,
        layout,
        spacing,
        hexY,
        repeatEnabled,
        repX,
        repY,
        seed,
        avoidAdj,
    } = opts
    if (N <= 0) return { slots: [], width: 0, height: 0 }

    const stepX = spacing
    const stepY = layout === "hex" ? spacing * hexY : spacing
    const baseCols = Math.max(1, Math.ceil(Math.sqrt(N)))
    const baseRows = Math.max(1, Math.ceil(N / baseCols))
    const baseW = (baseCols - 1) * stepX + stepX
    const baseH = (baseRows - 1) * stepY + stepY

    if (!repeatEnabled) {
        const slots: Slot[] = []
        let k = 0
        for (let r = 0; r < baseRows; r++) {
            for (let c = 0; c < baseCols; c++) {
                if (k >= N) break
                const ox = layout === "hex" && r & 1 ? stepX / 2 : 0
                const x = -baseW / 2 + stepX / 2 + c * stepX + ox
                const y = -baseH / 2 + stepY / 2 + r * stepY
                slots.push({ x, y, imgIndex: k })
                k++
            }
        }
        return { slots, width: baseW, height: baseH }
    }

    const nx = 2 * repX + 1
    const ny = 2 * repY + 1
    const totalW = baseW * nx
    const totalH = baseH * ny
    const startX = -totalW / 2 + stepX / 2
    const startY = -totalH / 2 + stepY / 2

    const rng = mulberry32(seed >>> 0)
    const imgAt = (r: number, c: number, grid: number[][], count: number) => {
        if (count <= 0) return 0
        let tries = 0
        let pick = randInt(rng, 0, count - 1)
        const left = c > 0 ? grid[r]?.[c - 1] : -1
        const up = r > 0 ? grid[r - 1]?.[c] : -1
        const upDiag = r > 0 ? grid[r - 1]?.[c - (r & 1 ? 1 : 0)] : -1
        while (tries < 6 && avoidAdj) {
            if (pick !== left && pick !== up && pick !== upDiag) break
            pick = randInt(rng, 0, count - 1)
            tries++
        }
        if (avoidAdj && (pick === left || pick === up || pick === upDiag))
            pick = (pick + 1) % count
        return pick
    }

    const colsTot = baseCols * nx
    const rowsTot = baseRows * ny
    const idxGrid: number[][] = Array.from({ length: rowsTot }, () =>
        Array(colsTot).fill(0)
    )
    for (let rr = 0; rr < rowsTot; rr++)
        for (let cc = 0; cc < colsTot; cc++)
            idxGrid[rr][cc] = imgAt(rr, cc, idxGrid, N)

    const slots: Slot[] = []
    for (let by = 0; by < ny; by++) {
        for (let bx = 0; bx < nx; bx++) {
            const blockX = startX + bx * baseW
            const blockY = startY + by * baseH
            for (let r = 0; r < baseRows; r++) {
                for (let c = 0; c < baseCols; c++) {
                    const rr = by * baseRows + r
                    const cc = bx * baseCols + c
                    const ox = layout === "hex" && r & 1 ? stepX / 2 : 0
                    const x = blockX + c * stepX + ox
                    const y = blockY + r * stepY
                    slots.push({ x, y, imgIndex: idxGrid[rr][cc] })
                }
            }
        }
    }
    return { slots, width: totalW, height: totalH }
}

function rubberband(current: number, min: number, max: number, k: number) {
    if (current < min) return min - (min - current) * k
    if (current > max) return max + (current - max) * k
    return current
}
/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
// ───────────────── component
export default function apple_grid_view(pp: Partial<Props>) {
    const defaults: Props = {
        images: [],
        layout: { type: "hex", spacing: 120, hexYRatio: 0.866 },
        sizing: {
            centerSize: 150,
            edgeSize: 14,
            minDrawSize: 6,
            sizeCurve: 2.3,
            parabC: 20,
        },
        packing: { pullIn: 42, pullCurve: 2.2 },
        render: {
            shape: "circle",
            radius: 18,
            radiusMax: false,
            contentFit: "cover",
            alphaByScale: true,
        },
        motion: {
            overscroll: 0.18,
            springStiffness: 0.18,
            springDamping: 0.85,
            friction: 0.92,
            dragSmooth: 0.25,
        },
        repeat: {
            repeatEnabled: false,
            repeatSeed: 1337,
            repeatTilesX: 1,
            repeatTilesY: 1,
            avoidAdjDuplicates: true,
        },
    }

    const p: Props = {
        ...defaults,
        ...pp,
        layout: { ...defaults.layout, ...(pp.layout ?? {}) },
        sizing: { ...defaults.sizing, ...(pp.sizing ?? {}) },
        packing: { ...defaults.packing, ...(pp.packing ?? {}) },
        render: { ...defaults.render, ...(pp.render ?? {}) },
        motion: { ...defaults.motion, ...(pp.motion ?? {}) },
        repeat: { ...defaults.repeat, ...(pp.repeat ?? {}) },
    }

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const wrapRef = useRef<HTMLDivElement | null>(null)

    const panRaw = useRef({ x: 0, y: 0, vx: 0, vy: 0 }) // px/s
    const panView = useRef({ x: 0, y: 0 })
    const dragging = useRef(false)
    const last = useRef({ x: 0, y: 0 })
    const lastMoveT = useRef<number>(0)
    const pid = useRef<number | null>(null)

    const cache = useRef<HTMLImageElement[]>([])
    const [loaded, setLoaded] = useState(0)

    const gridRef = useRef<Grid>({ slots: [], width: 0, height: 0 })
    const rebuildGrid = () => {
        gridRef.current = buildGridFinite({
            N: p.images.length,
            layout: p.layout.type,
            spacing: p.layout.spacing,
            hexY: p.layout.hexYRatio,
            repeatEnabled: p.repeat.repeatEnabled,
            repX: Math.max(0, Math.floor(p.repeat.repeatTilesX)),
            repY: Math.max(0, Math.floor(p.repeat.repeatTilesY)),
            seed: p.repeat.repeatSeed,
            avoidAdj: p.repeat.avoidAdjDuplicates,
        })
        const b = currentBounds(false)
        panRaw.current.x = clamp(panRaw.current.x, b.minX, b.maxX)
        panRaw.current.y = clamp(panRaw.current.y, b.minY, b.maxY)
    }
    useEffect(rebuildGrid, [
        p.images,
        p.layout.type,
        p.layout.spacing,
        p.layout.hexYRatio,
        p.repeat.repeatEnabled,
        p.repeat.repeatTilesX,
        p.repeat.repeatTilesY,
        p.repeat.repeatSeed,
        p.repeat.avoidAdjDuplicates,
    ])

    useEffect(() => {
        cache.current = []
        setLoaded(0)
        for (let i = 0; i < p.images.length; i++) {
            const src = getImgSrc(p.images[i]?.src)
            const img = new Image()
            img.decoding = "async"
            img.onload = () => setLoaded((v) => v + 1)
            if (src) img.src = src
            cache.current.push(img)
        }
    }, [p.images])

    useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const down = (e: PointerEvent) => {
            e.preventDefault()
            dragging.current = true
            pid.current = e.pointerId
            try {
                el.setPointerCapture(e.pointerId)
            } catch {}
            last.current = { x: e.clientX, y: e.clientY }
            lastMoveT.current = e.timeStamp
            el.style.cursor = "grabbing"
        }
        const move = (e: PointerEvent) => {
            if (!dragging.current) return
            e.preventDefault()
            const nowT = e.timeStamp
            const dtm = Math.max(0.001, (nowT - lastMoveT.current) / 1000)
            lastMoveT.current = nowT

            const dx = e.clientX - last.current.x
            const dy = e.clientY - last.current.y
            last.current = { x: e.clientX, y: e.clientY }

            const b = currentBounds(true)
            const nx = rubberband(
                panRaw.current.x + dx,
                b.minX,
                b.maxX,
                p.motion.overscroll
            )
            const ny = rubberband(
                panRaw.current.y + dy,
                b.minY,
                b.maxY,
                p.motion.overscroll
            )

            panRaw.current.vx = (nx - panRaw.current.x) / dtm
            panRaw.current.vy = (ny - panRaw.current.y) / dtm
            panRaw.current.x = nx
            panRaw.current.y = ny
        }
        const up = (e: PointerEvent) => {
            e.preventDefault()
            dragging.current = false
            if (pid.current != null) {
                try {
                    el.releasePointerCapture(pid.current)
                } catch {}
            }
            el.style.cursor = "grab"
            pid.current = null
        }
        el.addEventListener("pointerdown", down, { passive: false } as any)
        window.addEventListener("pointermove", move, { passive: false } as any)
        window.addEventListener("pointerup", up, { passive: false } as any)
        el.style.cursor = "grab"
        return () => {
            el.removeEventListener("pointerdown", down as any)
            window.removeEventListener("pointermove", move as any)
            window.removeEventListener("pointerup", up as any)
        }
    }, [p.motion.overscroll])

    function currentBounds(allowExtra: boolean) {
        const wrap = wrapRef.current!
        const r = wrap.getBoundingClientRect()
        const W = r.width,
            H = r.height
        const GW = gridRef.current.width,
            GH = gridRef.current.height
        const halfX = Math.max(0, (GW - W) / 2)
        const halfY = Math.max(0, (GH - H) / 2)

        const stepY =
            p.layout.type === "hex"
                ? p.layout.spacing * p.layout.hexYRatio
                : p.layout.spacing
        const padX = allowExtra
            ? Math.max(p.layout.spacing, p.sizing.centerSize) * 0.5
            : 0
        const padY = allowExtra ? Math.max(stepY, p.sizing.centerSize) * 0.5 : 0

        return {
            minX: -halfX - padX,
            maxX: halfX + padX,
            minY: -halfY - padY,
            maxY: halfY + padY,
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current,
            wrap = wrapRef.current
        if (!canvas || !wrap) return
        const ctx = canvas.getContext("2d")!

        const resize = () => {
            const r = wrap.getBoundingClientRect()
            const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
            canvas.width = Math.floor(r.width * dpr)
            canvas.height = Math.floor(r.height * dpr)
            canvas.style.width = `${r.width}px`
            canvas.style.height = `${r.height}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(wrap)

        let running = true
        let prev = performance.now()

        const loop = () => {
            if (!running) return
            const now = performance.now()
            const dt = Math.min(0.05, (now - prev) / 1000)
            prev = now

            const r = wrap.getBoundingClientRect()
            const W = r.width,
                H = r.height
            const CX = W / 2,
                CY = H / 2

            if (!dragging.current) {
                panRaw.current.x += panRaw.current.vx * dt
                panRaw.current.y += panRaw.current.vy * dt

                const f = decay(p.motion.friction, dt)
                panRaw.current.vx *= f
                panRaw.current.vy *= f

                const b = currentBounds(false)
                const tx = clamp(panRaw.current.x, b.minX, b.maxX)
                const ty = clamp(panRaw.current.y, b.minY, b.maxY)

                const k = p.motion.springStiffness * 60
                panRaw.current.vx += (tx - panRaw.current.x) * k * dt
                panRaw.current.vy += (ty - panRaw.current.y) * k * dt

                const d = decay(p.motion.springDamping, dt)
                panRaw.current.vx *= d
                panRaw.current.vy *= d
            }

            const smooth = dragging.current
                ? clamp(p.motion.dragSmooth, 0, 0.6)
                : 0.25
            panView.current.x = lerp(
                panView.current.x,
                panRaw.current.x,
                smooth
            )
            panView.current.y = lerp(
                panView.current.y,
                panRaw.current.y,
                smooth
            )

            ctx.clearRect(0, 0, W, H)

            const gx = panView.current.x + CX
            const gy = panView.current.y + CY

            const list = gridRef.current.slots
                .map((s) => {
                    let cx = s.x + gx,
                        cy = s.y + gy
                    const dx = cx - CX,
                        dy = cy - CY
                    const a = 2.5 * W,
                        b = 2.5 * H
                    let z =
                        p.sizing.parabC *
                            (-(dx * dx) / (a * a) - (dy * dy) / (b * b)) +
                        1
                    z = clamp(z, 0, 1)

                    const tSize = Math.pow(z, p.sizing.sizeCurve)
                    const d =
                        p.sizing.edgeSize +
                        (p.sizing.centerSize - p.sizing.edgeSize) * tSize

                    const dist = Math.hypot(dx, dy)
                    if (dist > 1e-6) {
                        const pull =
                            p.packing.pullIn *
                            Math.pow(1 - z, p.packing.pullCurve)
                        cx += ((CX - cx) / dist) * pull
                        cy += ((CY - cy) / dist) * pull
                    }
                    return { cx, cy, d, imgIndex: s.imgIndex }
                })
                .filter((it) => it.d >= p.sizing.minDrawSize)
            list.sort((A, B) => A.d - B.d)

            for (const it of list) {
                const w = it.d,
                    h = it.d
                const x = it.cx - w / 2,
                    y = it.cy - h / 2
                const img = cache.current[it.imgIndex]

                ctx.save()
                // clip (circle / rounded)
                if (p.render.shape === "circle") {
                    ctx.beginPath()
                    ctx.arc(it.cx, it.cy, it.d / 2, 0, Math.PI * 2)
                    ctx.clip()
                } else {
                    const rr2 = p.render.radiusMax
                        ? Math.min(w, h) / 2
                        : Math.min(p.render.radius, Math.min(w, h) / 2)
                    ctx.beginPath()
                    ctx.moveTo(x + rr2, y)
                    ctx.lineTo(x + w - rr2, y)
                    ctx.quadraticCurveTo(x + w, y, x + w, y + rr2)
                    ctx.lineTo(x + w, y + h - rr2)
                    ctx.quadraticCurveTo(x + w, y + h, x + w - rr2, y + h)
                    ctx.lineTo(x + rr2, y + h)
                    ctx.quadraticCurveTo(x, y + h, x, y + h - rr2)
                    ctx.lineTo(x, y + rr2)
                    ctx.quadraticCurveTo(x, y, x + rr2, y)
                    ctx.closePath()
                    ctx.clip()
                }

                if (p.render.alphaByScale) {
                    const tLocal = clamp(
                        (it.d - p.sizing.edgeSize) /
                            Math.max(
                                1,
                                p.sizing.centerSize - p.sizing.edgeSize
                            ),
                        0,
                        1
                    )
                    ctx.globalAlpha = tLocal
                }

                if (!img || !img.complete) {
                    ctx.fillStyle = "#141414"
                    ctx.fillRect(x, y, w, h)
                } else {
                    const ir = img.width / img.height,
                        cr = w / h
                    if (p.render.contentFit === "cover") {
                        let sx = 0,
                            sy = 0,
                            sw = img.width,
                            sh = img.height
                        if (ir > cr) {
                            sh = img.height
                            sw = sh * cr
                            sx = (img.width - sw) / 2
                        } else {
                            sw = img.width
                            sh = sw / cr
                            sy = (img.height - sh) / 2
                        }
                        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
                    } else if (p.render.contentFit === "contain") {
                        let dw = w,
                            dh = h,
                            dx = x,
                            dy = y
                        if (ir > cr) {
                            dh = w / ir
                            dy = y + (h - dh) / 2
                        } else {
                            dw = h * ir
                            dx = x + (w - dw) / 2
                        }
                        ctx.drawImage(
                            img,
                            0,
                            0,
                            img.width,
                            img.height,
                            dx,
                            dy,
                            dw,
                            dh
                        )
                    } else if (p.render.contentFit === "center") {
                        const dw = Math.min(w, img.width),
                            dh = Math.min(h, img.height)
                        ctx.drawImage(
                            img,
                            0,
                            0,
                            dw,
                            dh,
                            x + (w - dw) / 2,
                            y + (h - dh) / 2,
                            dw,
                            dh
                        )
                    } else {
                        ctx.drawImage(
                            img,
                            0,
                            0,
                            img.width,
                            img.height,
                            x,
                            y,
                            w,
                            h
                        )
                    }
                }
                ctx.globalAlpha = 1
                ctx.restore()
            }

            requestAnimationFrame(loop)
        }
        const id = requestAnimationFrame(loop)
        return () => {
            cancelAnimationFrame(id)
            running = false
            ro.disconnect()
        }
    }, [
        p.images,
        p.layout.type,
        p.layout.spacing,
        p.layout.hexYRatio,
        p.sizing.centerSize,
        p.sizing.edgeSize,
        p.sizing.minDrawSize,
        p.sizing.sizeCurve,
        p.sizing.parabC,
        p.packing.pullIn,
        p.packing.pullCurve,
        p.render.shape,
        p.render.radius,
        p.render.radiusMax,
        p.render.contentFit,
        p.render.alphaByScale,
        p.motion.overscroll,
        p.motion.springStiffness,
        p.motion.springDamping,
        p.motion.friction,
        p.motion.dragSmooth,
        p.repeat.repeatEnabled,
        p.repeat.repeatTilesX,
        p.repeat.repeatTilesY,
        p.repeat.repeatSeed,
        p.repeat.avoidAdjDuplicates,
        loaded,
    ])

    return (
        <div
            ref={wrapRef}
            style={{ width: "100%", height: "100%", position: "relative" }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: "none",
                }}
            />
        </div>
    )
}

// ───────────────── controls (no Utilities, no Rect, no Focus Shadow)
addPropertyControls(apple_grid_view, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["hex", "rect"],
                defaultValue: "hex",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                min: 60,
                max: 280,
                step: 1,
                defaultValue: 120,
            },
            hexYRatio: {
                type: ControlType.Number,
                title: "Hex Y",
                min: 0.7,
                max: 1.0,
                step: 0.01,
                defaultValue: 0.866,
                hidden: (props: any) => props.layout?.type !== "hex",
                description: "Vertical factor for the hex grid (≈√3/2).",
            },
        },
    },

    sizing: {
        type: ControlType.Object,
        title: "Sizing",
        controls: {
            centerSize: {
                type: ControlType.Number,
                title: "Center Size",
                min: 40,
                max: 260,
                step: 1,
                defaultValue: 150,
            },
            edgeSize: {
                type: ControlType.Number,
                title: "Edge Size",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 14,
            },
            minDrawSize: {
                type: ControlType.Number,
                title: "Skip < px",
                min: 0,
                max: 24,
                step: 1,
                defaultValue: 6,
                description:
                    "Do not draw below this diameter (perf + reduces shimmering).",
            },
            sizeCurve: {
                type: ControlType.Number,
                title: "Size Curve",
                min: 1,
                max: 4,
                step: 0.1,
                defaultValue: 2.3,
                description:
                    "Non-linearity: >1 = stronger focus at the center.",
            },
            parabC: {
                type: ControlType.Number,
                title: "Parab C",
                min: 8,
                max: 40,
                step: 0.5,
                defaultValue: 20,
                description:
                    "Paraboloid curvature: higher = faster falloff towards edges.",
            },
        },
    },

    packing: {
        type: ControlType.Object,
        title: "Packing",
        controls: {
            pullIn: {
                type: ControlType.Number,
                title: "Inward Pull",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 42,
                description:
                    "How much items are nudged toward center as scale decreases.",
            },
            pullCurve: {
                type: ControlType.Number,
                title: "Pull Curve",
                min: 1,
                max: 4,
                step: 0.1,
                defaultValue: 2.2,
                description: "Exponent for the inward pull curve.",
            },
        },
    },

    render: {
        type: ControlType.Object,
        title: "Render",
        controls: {
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["rounded", "circle"],
                defaultValue: "circle",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 18,
                hidden: (p: any) =>
                    p.render?.shape !== "rounded" || p.render?.radiusMax,
            },
            radiusMax: {
                type: ControlType.Boolean,
                title: "Max Radius",
                defaultValue: false,
                hidden: (p: any) => p.render?.shape !== "rounded",
                description: "Rounds corners to half the side (pill/circle).",
            },
            contentFit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["cover", "contain", "center", "fill"],
                defaultValue: "cover",
            },
            alphaByScale: {
                type: ControlType.Boolean,
                title: "Fade with Scale",
                defaultValue: true,
                description: "Smaller bubbles fade out.",
            },
        },
    },

    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            overscroll: {
                type: ControlType.Number,
                title: "Overscroll",
                min: 0,
                max: 0.6,
                step: 0.02,
                defaultValue: 0.18,
                description: "Elasticity outside bounds (0 = off).",
            },
            springStiffness: {
                type: ControlType.Number,
                title: "Spring k",
                min: 0.05,
                max: 0.5,
                step: 0.01,
                defaultValue: 0.18,
                description: "Snap-back strength when releasing drag.",
            },
            springDamping: {
                type: ControlType.Number,
                title: "Spring d",
                min: 0.7,
                max: 0.98,
                step: 0.01,
                defaultValue: 0.85,
                description: "Damping for the snap-back.",
            },
            friction: {
                type: ControlType.Number,
                title: "Friction",
                min: 0.8,
                max: 0.99,
                step: 0.01,
                defaultValue: 0.92,
            },
            dragSmooth: {
                type: ControlType.Number,
                title: "Drag Smooth",
                min: 0,
                max: 0.6,
                step: 0.01,
                defaultValue: 0.25,
                description: "Low-pass filter while dragging (0 = raw).",
            },
        },
    },

    repeat: {
        type: ControlType.Object,
        title: "Repeat",
        controls: {
            repeatEnabled: {
                type: ControlType.Boolean,
                title: "Random Repeat",
                defaultValue: false,
            },
            repeatSeed: {
                type: ControlType.Number,
                title: "Seed",
                min: 0,
                max: 1e9,
                step: 1,
                defaultValue: 1337,
                hidden: (p: any) => !p.repeat?.repeatEnabled,
            },
            repeatTilesX: {
                type: ControlType.Number,
                title: "Repeat X ±",
                min: 0,
                max: 4,
                step: 1,
                defaultValue: 1,
                hidden: (p: any) => !p.repeat?.repeatEnabled,
                description: "How many base blocks to the left/right.",
            },
            repeatTilesY: {
                type: ControlType.Number,
                title: "Repeat Y ±",
                min: 0,
                max: 4,
                step: 1,
                defaultValue: 1,
                hidden: (p: any) => !p.repeat?.repeatEnabled,
                description: "How many base blocks above/below.",
            },
            avoidAdjDuplicates: {
                type: ControlType.Boolean,
                title: "Avoid Adjacent Dups",
                defaultValue: true,
                hidden: (p: any) => !p.repeat?.repeatEnabled,
                description:
                    "Avoid the same image directly adjacent to neighbors.",
            },
        },
        description: "Made by [OtVos Studio](https://x.com/OtVosStudio)",
    },
})
