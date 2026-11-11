import { useEffect, useRef, useCallback, useMemo, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ============ 颜色工具 ============

function parseColor(c: any, fallback: number): number {
    if (typeof c === "number") return c
    if (typeof c === "string") {
        const v = parseInt(c.replace("#", ""), 16)
        return Number.isFinite(v) ? v : fallback
    }
    if (c && typeof c === "object" && typeof c.value === "string") {
        const v = parseInt(c.value.replace("#", ""), 16)
        return Number.isFinite(v) ? v : fallback
    }
    return fallback
}

function colorAt(t: number, mode: boolean, start: number, end: number): string {
    const sr = (start >> 16) & 255
    const sg = (start >> 8) & 255
    const sb = start & 255
    if (!mode) return `${sr},${sg},${sb}`
    const k = Math.max(0, Math.min(1, t))
    const er = (end >> 16) & 255
    const eg = (end >> 8) & 255
    const eb = end & 255
    return [
        Math.round(sr + (er - sr) * k),
        Math.round(sg + (eg - sg) * k),
        Math.round(sb + (eb - sb) * k),
    ].join(",")
}

const DEFAULT_COLOR_START = 0xf2f0ea
const DEFAULT_COLOR_END = 0x87bbff

// ============ 工具 ============

const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))

const isSafeCount = (n: number, max: number) =>
    Number.isSafeInteger(n) && n >= 0 && n <= max

// ============ 设置 ============

interface WireSettings {
    vertexCount: number
    nodeSpacing: number
    driftAmplitude: number
    nodeSize: number
    lineWidth: number
    lineOpacity: number
    shapeWidth: number
    shapeHeight: number
    twist: number
    rotation: number
    tilt: number
    speed: number
    glow: number
    connectionDensity: number
    pointerRange: number
    pointerHighlight: number
}

const DEFAULT_SETTINGS: WireSettings = {
    vertexCount: 5,
    nodeSpacing: 0.8,
    driftAmplitude: 0.65,
    nodeSize: 5,
    lineWidth: 1.5,
    lineOpacity: 0.7,
    shapeWidth: 0.75,
    shapeHeight: 0.7,
    twist: 0.4,
    rotation: 18,
    tilt: -10,
    speed: 1,
    glow: 0.7,
    connectionDensity: 1,
    pointerRange: 0.25,
    pointerHighlight: 1,
}

const ALLOW_NEGATIVE = ["speed", "twist", "rotation", "tilt"]

function validateSettings(input: Partial<WireSettings>): WireSettings {
    const out = { ...DEFAULT_SETTINGS }
    for (const key of Object.keys(out) as (keyof WireSettings)[]) {
        const value = input[key]
        if (
            typeof value === "number" &&
            Number.isFinite(value) &&
            (key !== "vertexCount" || Number.isSafeInteger(value)) &&
            (ALLOW_NEGATIVE.includes(key) || value >= 0)
        ) {
            out[key] = value
        }
    }
    return out
}

// ============ 顶点生成（对应原 F()） ============

interface Point3D {
    x: number
    y: number
    z: number
}

function computeVertices(time: number, s: WireSettings): Point3D[] {
    const count = s.vertexCount
    if (!Number.isSafeInteger(count) || count < 1 || count > 300) return []

    const points: Point3D[] = []
    const a = (time * Math.PI * 2) / 24

    for (let i = 0; i < count; i++) {
        // 斐波那契球面分布
        const n = 1 - (2 * (i + 0.5)) / count
        const o = Math.sqrt(1 - n * n)
        const s1 = i * 2.399963229728653
        const c = s.nodeSpacing * 0.5
        const l = s.driftAmplitude * 0.2

        const u =
            o * Math.cos(s1) * c + l * Math.sin(a * (1 + (i % 3)) + i * 1.71)
        const d = n * c + l * Math.sin(a * (2 + (i % 2)) + i * 2.37)
        const f =
            o * Math.sin(s1) * c +
            l * Math.cos(a * (1 + (i % 4)) + i * 3.13 + s.twist)

        points.push({
            x: u * Math.cos(a) + f * Math.sin(a),
            y: d,
            z: -u * Math.sin(a) + f * Math.cos(a),
        })
    }

    // 居中
    const center = points.reduce(
        (acc, p) => ({
            x: acc.x + p.x / count,
            y: acc.y + p.y / count,
            z: acc.z + p.z / count,
        }),
        { x: 0, y: 0, z: 0 }
    )
    for (const p of points) {
        p.x -= center.x
        p.y -= center.y
        p.z -= center.z
    }
    return points
}

// ============ 连线算法（对应原 de()） ============

function computeEdges(
    points: Point3D[],
    density: number,
    prevEdges: [number, number][]
): [number, number][] {
    const n = points.length
    if (n < 2) return []

    const key = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`
    const prevSet = new Set(prevEdges.map(([a, b]) => key(a, b)))

    // 所有点对及其代价（已有边有折扣，鼓励保持稳定）
    const allPairs: { a: number; b: number; cost: number }[] = []
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const dx = points[i].x - points[j].x
            const dy = points[i].y - points[j].y
            const dz = points[i].z - points[j].z
            const cost = Math.hypot(dx, dy, dz)
            allPairs.push({
                a: i,
                b: j,
                cost: cost * (prevSet.has(key(i, j)) ? 0.85 : 1),
            })
        }
    }
    allPairs.sort((p, q) => p.cost - q.cost || p.a - q.a || p.b - q.b)

    // Union-Find 生成最小生成树
    const parent = Array.from({ length: n }, (_, i) => i)
    const degree = new Array(n).fill(0)
    const find = (x: number): number => {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]]
            x = parent[x]
        }
        return x
    }

    const edges: [number, number][] = []
    const edgeSet = new Set<string>()
    const addEdge = (a: number, b: number) => {
        const k = key(a, b)
        if (edgeSet.has(k)) return
        edgeSet.add(k)
        edges.push([a, b])
        degree[a]++
        degree[b]++
    }

    for (const { a, b } of allPairs) {
        const ra = find(a)
        const rb = find(b)
        if (ra !== rb) {
            parent[ra] = rb
            addEdge(a, b)
        }
    }

    // 每个顶点至少保留 3 条支撑线
    const minDeg = Math.min(3, n - 1)
    for (const { a, b } of allPairs) {
        if (degree[a] < minDeg || degree[b] < minDeg) {
            addEdge(a, b)
        }
    }

    // 按 density 添加剩余边
    let extra = Math.round(
        (allPairs.length - edges.length) * clamp(density, 0, 1)
    )
    for (const { a, b } of allPairs) {
        if (!extra) break
        if (!edgeSet.has(key(a, b))) {
            addEdge(a, b)
            extra--
        }
    }

    return edges.sort((a, b) => a[0] - b[0] || a[1] - b[1])
}

// ============ 滚动场景 Hook ============

function useScrollScene(
    mode: string,
    startProgress: number,
    endProgress: number,
    fadeRange: number
) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (mode !== "scroll") return
        const update = () => {
            const doc = document.documentElement
            const max = doc.scrollHeight - window.innerHeight
            setProgress(max > 0 ? window.scrollY / max : 0)
        }
        update()
        window.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update, { passive: true })
        return () => {
            window.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
        }
    }, [mode])

    return useMemo(() => {
        if (mode !== "scroll") return { active: true, opacity: 1 }
        const start = Math.min(startProgress, endProgress)
        const end = Math.max(startProgress, endProgress)
        if (end - start <= 0.001) return { active: false, opacity: 0 }
        const span = end - start
        const fadeZone = span * clamp(fadeRange, 0.02, 0.5)
        const fadeIn =
            start <= 0.001
                ? 1
                : Math.min(1, Math.max(0, (progress - start) / fadeZone))
        const fadeOut =
            end >= 0.999
                ? 1
                : Math.min(1, Math.max(0, (end - progress) / fadeZone))
        const opacity = Math.min(fadeIn, fadeOut)
        return { active: opacity > 0.02, opacity }
    }, [mode, startProgress, endProgress, fadeRange, progress])
}

// ============ Canvas Hook ============

interface FrameInfo {
    context: CanvasRenderingContext2D
    viewport: { width: number; height: number; dpr: number }
    pointer: { x: number; y: number; active: boolean }
    elapsed: number
    delta: number
    reducedMotion: boolean
}

function useCanvas(
    onFrame: (info: FrameInfo) => void,
    options: { active?: boolean } = {}
) {
    const { active = true } = options
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const callbackRef = useRef(onFrame)
    callbackRef.current = onFrame
    const visibleRef = useRef(true)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let rafId = 0
        let lastTime = performance.now()
        let viewport = { width: 1, height: 1, dpr: 1 }
        const pointer = { x: 0, y: 0, active: false }
        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            viewport = { width: rect.width, height: rect.height, dpr }
            canvas.width = Math.max(1, Math.round(rect.width * dpr))
            canvas.height = Math.max(1, Math.round(rect.height * dpr))
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        const onPointerMove = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                pointer.x = x
                pointer.y = y
                pointer.active = true
            } else {
                pointer.active = false
            }
        }

        const onPointerOut = (event: PointerEvent) => {
            if (!event.relatedTarget) pointer.active = false
        }

        const tick = (time: number) => {
            const delta = Math.min(50, time - lastTime)
            lastTime = time
            if (active && visibleRef.current && !document.hidden) {
                callbackRef.current({
                    context: ctx,
                    viewport,
                    pointer,
                    elapsed: time / 1000,
                    delta: delta / 1000,
                    reducedMotion: motionQuery.matches,
                })
            }
            rafId = requestAnimationFrame(tick)
        }

        const onVisibility = () => {
            lastTime = performance.now()
        }

        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(canvas)
        // 视口感知
        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                visibleRef.current = entries[0]?.isIntersecting ?? true
                lastTime = performance.now()
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(canvas)
        window.addEventListener("pointermove", onPointerMove, {
            passive: true,
        })
        window.addEventListener("pointerout", onPointerOut, {
            passive: true,
        })
        document.addEventListener("visibilitychange", onVisibility)
        rafId = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(rafId)
            observer.disconnect()
            intersectionObserver.disconnect()
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerout", onPointerOut)
            document.removeEventListener("visibilitychange", onVisibility)
        }
    }, [active])

    return canvasRef
}

// ============ 主组件 ============

interface Props {
    intensity: number
    vertexCount: number
    nodeSpacing: number
    driftAmplitude: number
    nodeSize: number
    lineWidth: number
    lineOpacity: number
    shapeWidth: number
    shapeHeight: number
    twist: number
    rotation: number
    tilt: number
    speed: number
    glow: number
    connectionDensity: number
    pointerRange: number
    pointerHighlight: number
    visibilityMode: string
    startProgress: number
    endProgress: number
    fadeRange: number
    style?: React.CSSProperties
    colorMode: boolean
    colorStart: string
    colorEnd: string
}

export default function SpatialWireframe(props: Props) {
    const colorMode = props.colorMode
    const colorStartInt = useMemo(
        () => parseColor(props.colorStart, DEFAULT_COLOR_START),
        [props.colorStart]
    )
    const colorEndInt = useMemo(
        () => parseColor(props.colorEnd, DEFAULT_COLOR_END),
        [props.colorEnd]
    )
    const isStaticRenderer = useIsStaticRenderer()
    const settings = useMemo<WireSettings>(
        () =>
            validateSettings({
                vertexCount: props.vertexCount,
                nodeSpacing: props.nodeSpacing,
                driftAmplitude: props.driftAmplitude,
                nodeSize: props.nodeSize,
                lineWidth: props.lineWidth,
                lineOpacity: props.lineOpacity,
                shapeWidth: props.shapeWidth,
                shapeHeight: props.shapeHeight,
                twist: props.twist,
                rotation: props.rotation,
                tilt: props.tilt,
                speed: props.speed,
                glow: props.glow,
                connectionDensity: props.connectionDensity,
                pointerRange: props.pointerRange,
                pointerHighlight: props.pointerHighlight,
            }),
        [
            props.vertexCount,
            props.nodeSpacing,
            props.driftAmplitude,
            props.nodeSize,
            props.lineWidth,
            props.lineOpacity,
            props.shapeWidth,
            props.shapeHeight,
            props.twist,
            props.rotation,
            props.tilt,
            props.speed,
            props.glow,
            props.connectionDensity,
            props.pointerRange,
            props.pointerHighlight,
        ]
    )

    const valid = isSafeCount(settings.vertexCount, 300)

    const timeAccumulator = useRef(0)
    const edgesRef = useRef<{ count: number; edges: [number, number][] }>({
        count: 0,
        edges: [],
    })
    const offsetsRef = useRef<{ x: number; y: number }[]>([])
    const heatRef = useRef<{ x: number; y: number; heat: number }[]>([])
    const projectedRef = useRef<
        { x: number; y: number; z: number; heat: number }[]
    >([])
    const dragRef = useRef<{
        index: number
        pointerId: number
        target: { x: number; y: number }
        grab: { x: number; y: number }
    } | null>(null)

    const { active, opacity } = useScrollScene(
        props.visibilityMode,
        props.startProgress,
        props.endProgress,
        props.fadeRange
    )

    // 顶点数变化时复位偏移和高亮
    useEffect(() => {
        offsetsRef.current = []
        heatRef.current = []
        projectedRef.current = []
        dragRef.current = null
    }, [props.vertexCount])

    // 离开场景时清空拖动状态
    useEffect(() => {
        if (!active) dragRef.current = null
    }, [active])

    const canvasRef = useCanvas(
        useCallback(
            ({ context: ctx, viewport, pointer, delta, reducedMotion }) => {
                const { width, height } = viewport
                ctx.clearRect(0, 0, width, height)

                if (!valid) return

                timeAccumulator.current =
                    (timeAccumulator.current +
                        delta * settings.speed * (reducedMotion ? 0.025 : 1)) %
                    48

                const time = timeAccumulator.current
                const prevEdges =
                    edgesRef.current.count === settings.vertexCount
                        ? edgesRef.current.edges
                        : []

                const basePoints = computeVertices(time, settings)
                if (basePoints.length === 0) return

                // 偏移数组尺寸对齐
                if (offsetsRef.current.length !== basePoints.length) {
                    offsetsRef.current = basePoints.map(() => ({ x: 0, y: 0 }))
                }
                if (heatRef.current.length !== basePoints.length) {
                    heatRef.current = basePoints.map(() => ({
                        x: 0,
                        y: 0,
                        heat: 0,
                    }))
                }

                const minDim = Math.min(width, height)
                const rotRad = (settings.rotation * Math.PI) / 180
                const tiltRad = (settings.tilt * Math.PI) / 180

                // 投影到屏幕
                const projected: {
                    x: number
                    y: number
                    z: number
                    heat: number
                }[] = []

                for (let i = 0; i < basePoints.length; i++) {
                    const p = basePoints[i]

                    // 绕 Y 轴旋转（旋转 y/z）
                    const ry = p.y * Math.cos(rotRad) - p.z * Math.sin(rotRad)
                    const rz = p.y * Math.sin(rotRad) + p.z * Math.cos(rotRad)

                    // 透视除法
                    const persp = 2.5 / Math.max(0.5, 2.5 - rz)
                    const sx = p.x * minDim * settings.shapeWidth * persp
                    const sy = ry * minDim * settings.shapeHeight * persp

                    // 应用倾斜旋转
                    const cosT = Math.cos(tiltRad)
                    const sinT = Math.sin(tiltRad)
                    let screenX = width / 2 + sx * cosT - sy * sinT
                    let screenY = height / 2 + sx * sinT + sy * cosT

                    // 应用拖动偏移
                    const offset = offsetsRef.current[i]
                    const drag = dragRef.current
                    if (drag && drag.index === i) {
                        // 拖动中：使用鼠标位置
                        screenX = drag.target.x
                        screenY = drag.target.y
                        offset.x = drag.target.x - (screenX - offset.x)
                        offset.y = drag.target.y - (screenY - offset.y)
                        // 直接记录新偏移
                        // 注意：上面的数学有点绕，重写更清晰
                        offset.x = 0
                        offset.y = 0
                    } else {
                        screenX += offset.x
                        screenY += offset.y
                    }

                    // 鼠标高亮
                    let heat = heatRef.current[i].heat
                    if (pointer.active && !reducedMotion) {
                        const dx = screenX - pointer.x
                        const dy = screenY - pointer.y
                        const dist = Math.hypot(dx, dy)
                        const range = minDim * settings.pointerRange
                        const target =
                            range > 0 && dist < range
                                ? Math.max(0, 1 - dist / range) ** 2
                                : 0
                        const smooth = 1 - Math.exp(-Math.max(0, delta) * 10)
                        heat +=
                            (target * settings.pointerHighlight - heat) * smooth
                    } else {
                        const smooth = 1 - Math.exp(-Math.max(0, delta) * 10)
                        heat += (0 - heat) * smooth
                    }
                    heatRef.current[i] = { x: 0, y: 0, heat }

                    projected.push({
                        x: screenX,
                        y: screenY,
                        z: rz,
                        heat,
                    })
                }

                projectedRef.current = projected

                // 更新连线
                const normalizedPoints = projected.map((p) => ({
                    x: (p.x - width / 2) / minDim,
                    y: (p.y - height / 2) / minDim,
                    z: p.z,
                }))
                const edges = computeEdges(
                    normalizedPoints,
                    settings.connectionDensity,
                    prevEdges
                )
                edgesRef.current = {
                    count: settings.vertexCount,
                    edges,
                }

                ctx.lineCap = "round"
                ctx.shadowBlur = 0

                // 绘制连线（按深度排序）
                if (settings.lineWidth > 0) {
                    const sortedEdges = [...edges].sort((a, b) => {
                        const za = projected[a[0]].z + projected[a[1]].z
                        const zb = projected[b[0]].z + projected[b[1]].z
                        return za - zb
                    })
                    for (const [i, j] of sortedEdges) {
                        const pa = projected[i]
                        const pb = projected[j]
                        if (
                            !Number.isFinite(pa.x) ||
                            !Number.isFinite(pa.y) ||
                            !Number.isFinite(pb.x) ||
                            !Number.isFinite(pb.y)
                        ) {
                            continue
                        }
                        const edgeHeat = Math.max(pa.heat, pb.heat)
                        const alpha = Math.min(
                            1,
                            settings.lineOpacity *
                                Math.max(
                                    0.18,
                                    Math.min(1, 0.55 + (pa.z + pb.z) * 0.35)
                                ) +
                                edgeHeat * 0.45
                        )
                        ctx.beginPath()
                        ctx.moveTo(pa.x, pa.y)
                        ctx.lineTo(pb.x, pb.y)

                        const zAvg = (pa.z + pb.z) / 2
                        const edgeGradT = (zAvg + 1) / 2
                        const edgeRgb = colorAt(
                            edgeGradT,
                            colorMode,
                            colorStartInt,
                            colorEndInt
                        )
                        if (settings.glow > 0) {
                            ctx.strokeStyle = `rgba(${edgeRgb},${alpha * 0.08 * props.intensity})`

                            ctx.lineWidth =
                                settings.lineWidth +
                                Math.min(12, settings.glow * 5)
                            ctx.stroke()
                        }
                        ctx.strokeStyle = `rgba(${edgeRgb},${alpha * props.intensity})`
                        ctx.lineWidth =
                            settings.lineWidth *
                            (1 + Math.min(0.3, edgeHeat * 0.2))
                        ctx.stroke()
                    }
                }

                // 绘制节点（按深度排序）
                if (settings.nodeSize > 0) {
                    const sortedPoints = [...projected].sort(
                        (a, b) => a.z - b.z
                    )
                    for (const p of sortedPoints) {
                        if (!Number.isFinite(p.x) || !Number.isFinite(p.y))
                            continue

                        // 高亮光晕
                        const nodeGradT = (p.z + 1) / 2
                        const nodeRgb = colorAt(
                            nodeGradT,
                            colorMode,
                            colorStartInt,
                            colorEndInt
                        )
                        if (p.heat > 0.01) {
                            ctx.fillStyle = `rgba(${nodeRgb},${Math.min(0.2, p.heat * 0.12)})`
                            ctx.beginPath()
                            ctx.arc(
                                p.x,
                                p.y,
                                settings.nodeSize / 2 +
                                    Math.min(12, p.heat * 5),
                                0,
                                Math.PI * 2
                            )
                            ctx.fill()
                        }

                        // 实心点
                        const nodeAlpha = Math.min(
                            1,
                            settings.lineOpacity *
                                Math.max(0.25, 0.7 + p.z * 0.3) +
                                p.heat * 0.45
                        )
                        ctx.fillStyle = `rgba(${nodeRgb},${nodeAlpha * props.intensity})`
                        ctx.beginPath()
                        ctx.arc(
                            p.x,
                            p.y,
                            (settings.nodeSize / 2) *
                                (1 + Math.min(0.3, p.heat * 0.2)),
                            0,
                            Math.PI * 2
                        )
                        ctx.fill()
                    }
                }
            },
            [props.intensity, settings, valid]
        ),
        { active: active && !isStaticRenderer }
    )

    // ============ 鼠标拖动事件 ============

    const localCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const hitVertex = (
        coords: { x: number; y: number },
        radius: number
    ): number => {
        let best = -1
        let bestDist = radius
        const points = projectedRef.current
        points.forEach((p, i) => {
            const d = Math.hypot(p.x - coords.x, p.y - coords.y)
            if (
                d <= radius &&
                (d < bestDist ||
                    (Math.abs(d - bestDist) < 0.001 &&
                        (best < 0 || p.z > points[best].z)))
            ) {
                best = i
                bestDist = d
            }
        })
        return best
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!active || e.button !== 0 || dragRef.current) return
        if (settings.nodeSize <= 0) return

        const coords = localCoords(e)
        const hitRadius = Math.max(12, settings.nodeSize / 2 + 6)
        const idx = hitVertex(coords, hitRadius)
        if (idx < 0) return

        e.preventDefault()
        const p = projectedRef.current[idx]
        dragRef.current = {
            index: idx,
            pointerId: e.pointerId,
            target: { x: p.x, y: p.y },
            grab: { x: p.x - coords.x, y: p.y - coords.y },
        }
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.style.cursor = "grabbing"
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const coords = localCoords(e)
        const drag = dragRef.current
        if (drag && drag.pointerId === e.pointerId) {
            drag.target = {
                x: coords.x + drag.grab.x,
                y: coords.y + drag.grab.y,
            }
            // 同时更新偏移量（这就是最终存储的"手动位移"）
            // 下一帧渲染时会读取 offsetsRef
            const offset = offsetsRef.current[drag.index]
            if (offset) {
                offset.x =
                    drag.target.x -
                    (projectedRef.current[drag.index].x - offset.x)
                offset.y =
                    drag.target.y -
                    (projectedRef.current[drag.index].y - offset.y)
            }
            e.preventDefault()
        } else {
            const hitRadius = Math.max(12, settings.nodeSize / 2 + 6)
            e.currentTarget.style.cursor =
                settings.nodeSize > 0 && hitVertex(coords, hitRadius) >= 0
                    ? "grab"
                    : "default"
        }
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const drag = dragRef.current
        if (drag && drag.pointerId === e.pointerId) {
            // 把最终位置固化到 offsets
            const p = projectedRef.current[drag.index]
            if (p) {
                const offset = offsetsRef.current[drag.index]
                if (offset) {
                    offset.x = drag.target.x - (p.x - offset.x)
                    offset.y = drag.target.y - (p.y - offset.y)
                }
            }
            dragRef.current = null
            e.currentTarget.style.cursor = "default"
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId)
            }
        }
    }
    if (isStaticRenderer) {
        return (
            <StaticWireframePreview
                vertexCount={props.vertexCount}
                nodeSize={props.nodeSize}
                lineWidth={props.lineWidth}
                lineOpacity={props.lineOpacity}
                shapeWidth={props.shapeWidth}
                shapeHeight={props.shapeHeight}
                tilt={props.tilt}
                rotation={props.rotation}
                glow={props.glow}
                intensity={props.intensity}
                style={props.style}
            />
        )
    }
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                opacity,
                transition: "opacity 0.35s ease",
                ...props.style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: "pan-y",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handlePointerUp}
            />
        </div>
    )
}
// ============ 静态预览（编辑器画布 & 导出时使用） ============

function StaticWireframePreview({
    vertexCount,
    nodeSize,
    lineWidth,
    lineOpacity,
    shapeWidth,
    shapeHeight,
    tilt,
    rotation,
    glow,
    intensity,
    style,
}: {
    vertexCount: number
    nodeSize: number
    lineWidth: number
    lineOpacity: number
    shapeWidth: number
    shapeHeight: number
    tilt: number
    rotation: number
    glow: number
    intensity: number
    style?: React.CSSProperties
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const w = rect.width
        const h = rect.height
        const minDim = Math.min(w, h)

        const count = Math.max(1, Math.min(30, Math.round(vertexCount)))

        // 用固定分布生成顶点（Fibonacci 球面）
        const basePoints: { x: number; y: number; z: number }[] = []
        for (let i = 0; i < count; i++) {
            const n = 1 - (2 * (i + 0.5)) / count
            const o = Math.sqrt(1 - n * n)
            const s1 = i * 2.399963229728653
            const c = 0.8 * 0.5 // nodeSpacing 默认 0.8
            basePoints.push({
                x: o * Math.cos(s1) * c,
                y: n * c,
                z: o * Math.sin(s1) * c,
            })
        }
        // 居中
        const center = basePoints.reduce(
            (acc, p) => ({
                x: acc.x + p.x / count,
                y: acc.y + p.y / count,
                z: acc.z + p.z / count,
            }),
            { x: 0, y: 0, z: 0 }
        )

        const rotRad = (rotation * Math.PI) / 180
        const tiltRad = (tilt * Math.PI) / 180
        const cosT = Math.cos(tiltRad)
        const sinT = Math.sin(tiltRad)

        const projected = basePoints.map((p) => {
            const px = p.x - center.x
            const py = p.y - center.y
            const pz = p.z - center.z

            const ry = py * Math.cos(rotRad) - pz * Math.sin(rotRad)
            const rz = py * Math.sin(rotRad) + pz * Math.cos(rotRad)

            const persp = 2.5 / Math.max(0.5, 2.5 - rz)
            const sx = px * minDim * shapeWidth * persp
            const sy = ry * minDim * shapeHeight * persp

            return {
                x: w / 2 + sx * cosT - sy * sinT,
                y: h / 2 + sx * sinT + sy * cosT,
                z: rz,
            }
        })

        // 计算连线（简化版：距离最近的前 N 条边）
        const edges: [number, number][] = []
        const allPairs: { a: number; b: number; cost: number }[] = []
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dx = projected[i].x - projected[j].x
                const dy = projected[i].y - projected[j].y
                allPairs.push({
                    a: i,
                    b: j,
                    cost: Math.hypot(dx, dy),
                })
            }
        }
        allPairs.sort((p, q) => p.cost - q.cost)

        // 生成连接：每个顶点至少 3 条
        const degree = new Array(count).fill(0)
        const minDeg = Math.min(3, count - 1)
        const edgeSet = new Set<string>()
        for (const { a, b } of allPairs) {
            if (degree[a] < minDeg || degree[b] < minDeg) {
                const key = `${Math.min(a, b)}:${Math.max(a, b)}`
                if (!edgeSet.has(key)) {
                    edgeSet.add(key)
                    edges.push([a, b])
                    degree[a]++
                    degree[b]++
                }
            }
        }
        // 增加一些额外连线（模拟 connectionDensity = 1 的效果）
        const extra = Math.min(
            allPairs.length - edges.length,
            Math.round(allPairs.length * 0.3)
        )
        let added = 0
        for (const { a, b } of allPairs) {
            if (added >= extra) break
            const key = `${Math.min(a, b)}:${Math.max(a, b)}`
            if (!edgeSet.has(key)) {
                edgeSet.add(key)
                edges.push([a, b])
                added++
            }
        }

        ctx.lineCap = "round"

        // 画连线
        if (lineWidth > 0) {
            const sorted = [...edges].sort((p, q) => {
                const za = projected[p[0]].z + projected[p[1]].z
                const zb = projected[q[0]].z + projected[q[1]].z
                return za - zb
            })
            for (const [i, j] of sorted) {
                const pa = projected[i]
                const pb = projected[j]
                const alpha = Math.min(
                    1,
                    lineOpacity *
                        Math.max(
                            0.18,
                            Math.min(1, 0.55 + (pa.z + pb.z) * 0.35)
                        ) *
                        intensity
                )
                ctx.beginPath()
                ctx.moveTo(pa.x, pa.y)
                ctx.lineTo(pb.x, pb.y)
                if (glow > 0) {
                    ctx.strokeStyle = `rgba(242,240,234,${alpha * 0.08})`
                    ctx.lineWidth = lineWidth + Math.min(12, glow * 5)
                    ctx.stroke()
                }
                ctx.strokeStyle = `rgba(242,240,234,${alpha})`
                ctx.lineWidth = lineWidth
                ctx.stroke()
            }
        }

        // 画节点
        if (nodeSize > 0) {
            const sorted = [...projected].sort((p, q) => p.z - q.z)
            for (const p of sorted) {
                const alpha = Math.min(
                    1,
                    lineOpacity * Math.max(0.25, 0.7 + p.z * 0.3) * intensity
                )
                ctx.fillStyle = `rgba(242,240,234,${alpha})`
                ctx.beginPath()
                ctx.arc(p.x, p.y, nodeSize / 2, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    }, [
        vertexCount,
        nodeSize,
        lineWidth,
        lineOpacity,
        shapeWidth,
        shapeHeight,
        tilt,
        rotation,
        glow,
        intensity,
    ])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: "#070707",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

// ============ Framer 属性面板 ============

addPropertyControls(SpatialWireframe, {
    colorMode: {
        type: ControlType.Boolean,
        title: "启用渐变",
        defaultValue: false,
        enabledTitle: "渐变",
        disabledTitle: "单色",
    },
    colorStart: {
        type: ControlType.Color,
        title: "主色",
        defaultValue: "#F2F0EA",
        description: "单色模式下使用此颜色；渐变模式下作为起点",
    },
    colorEnd: {
        type: ControlType.Color,
        title: "渐变终点色",
        defaultValue: "#87BBFF",
        hidden: (props) => !props.colorMode,
    },
    intensity: {
        type: ControlType.Number,
        title: "亮度",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
    },
    vertexCount: {
        type: ControlType.Number,
        title: "顶点数",
        defaultValue: 5,
        min: 4,
        max: 30,
        step: 1,
        displayStepper: true,
        unit: "个",
    },
    nodeSpacing: {
        type: ControlType.Number,
        title: "顶点间距",
        defaultValue: 0.8,
        min: 0,
        max: 2,
        step: 0.01,
        unit: "×",
    },
    driftAmplitude: {
        type: ControlType.Number,
        title: "游动幅度",
        defaultValue: 0.65,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "×",
    },
    nodeSize: {
        type: ControlType.Number,
        title: "节点尺寸",
        defaultValue: 5,
        min: 0,
        max: 12,
        step: 0.1,
        unit: "px",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "连线粗细",
        defaultValue: 1.5,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "px",
    },
    lineOpacity: {
        type: ControlType.Number,
        title: "连线透明度",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.01,
    },
    shapeWidth: {
        type: ControlType.Number,
        title: "结构宽度",
        defaultValue: 0.75,
        min: 0.1,
        max: 1.5,
        step: 0.01,
    },
    shapeHeight: {
        type: ControlType.Number,
        title: "结构高度",
        defaultValue: 0.7,
        min: 0.1,
        max: 1.5,
        step: 0.01,
    },
    connectionDensity: {
        type: ControlType.Number,
        title: "连线丰富度",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    twist: {
        type: ControlType.Number,
        title: "结构扭转",
        defaultValue: 0.4,
        min: -3,
        max: 3,
        step: 0.05,
        unit: "rad",
    },
    rotation: {
        type: ControlType.Number,
        title: "观察俯仰",
        defaultValue: 18,
        min: -90,
        max: 90,
        step: 0.5,
        unit: "°",
    },
    tilt: {
        type: ControlType.Number,
        title: "倾斜角度",
        defaultValue: -10,
        min: -90,
        max: 90,
        step: 0.5,
        unit: "°",
    },
    speed: {
        type: ControlType.Number,
        title: "运动速度",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    glow: {
        type: ControlType.Number,
        title: "光晕强度",
        defaultValue: 0.7,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "×",
    },
    pointerRange: {
        type: ControlType.Number,
        title: "鼠标作用范围",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
    },
    pointerHighlight: {
        type: ControlType.Number,
        title: "鼠标高亮",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },

    // ============ 滚动控制 ============
    visibilityMode: {
        type: ControlType.Enum,
        title: "可见模式",
        defaultValue: "always",
        options: ["always", "scroll"],
        optionTitles: ["始终显示", "随滚动"],
        description: "单独用选「始终」；组合成滚动故事选「随滚动」",
    },
    startProgress: {
        type: ControlType.Number,
        title: "开始进度",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        description: "页面滚动到此进度时开始淡入",
    },
    endProgress: {
        type: ControlType.Number,
        title: "结束进度",
        defaultValue: 0.45,
        min: 0,
        max: 1,
        step: 0.01,
        description: "页面滚动到此进度时完全淡出",
    },
    fadeRange: {
        type: ControlType.Number,
        title: "过渡区比例",
        defaultValue: 0.4,
        min: 0.02,
        max: 0.5,
        step: 0.01,
        description: "淡入淡出各占区间长度的比例，越大越柔和",
    },
})
