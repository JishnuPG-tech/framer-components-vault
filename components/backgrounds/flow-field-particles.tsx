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

// Framer 的 Color 控件返回 hex 字符串，转成 RGB 整数
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

// 返回 "R,G,B" 字符串，供 rgba(...) 使用
// t: 0~1 的渐变位置；mode: 是否启用渐变
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

const DEFAULT_COLOR_START = 0xf2f0ea // 米白
const DEFAULT_COLOR_END = 0x87bbff // 冰蓝

// ============ 数学工具 ============

const TAU = Math.PI * 2
const TABLE_SIZE = 2048

const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))

const pseudoRandom = (seed: number) => {
    const t = Math.sin(seed * 127.1 + 311.7) * 43758.5453
    return t - Math.floor(t)
}

const isSafeCount = (n: number, max: number) =>
    Number.isSafeInteger(n) && n >= 0 && n <= max

function buildEaseTable(parameter: number): Float64Array {
    const accum = new Float64Array(TABLE_SIZE + 1)
    const shape = (t: number) =>
        Math.max(0, 1 - parameter) +
        Math.min(parameter, 1) * 0.035 +
        parameter * 5 * Math.abs(Math.cos(t + 0.55)) ** 8
    for (let i = 1; i <= TABLE_SIZE; i++) {
        accum[i] =
            accum[i - 1] +
            (shape(((i - 1) / TABLE_SIZE) * TAU) +
                shape((i / TABLE_SIZE) * TAU)) /
                2
    }
    const result = new Float64Array(TABLE_SIZE + 1)
    let cursor = 1
    for (let i = 0; i <= TABLE_SIZE; i++) {
        const target = (accum[TABLE_SIZE] * i) / TABLE_SIZE
        while (cursor < TABLE_SIZE && accum[cursor] < target) cursor++
        const frac =
            (target - accum[cursor - 1]) / (accum[cursor] - accum[cursor - 1])
        result[i] = ((cursor - 1 + frac) / TABLE_SIZE) * TAU
    }
    result[0] = 0
    result[TABLE_SIZE] = TAU
    return result
}

function lookup(table: Float64Array, t: number): number {
    const scaled = (t - Math.floor(t)) * (table.length - 1)
    const idx = Math.floor(scaled)
    return table[idx] + (table[idx + 1] - table[idx]) * (scaled - idx)
}

function computeFlowPoint(
    phase: number,
    lane: number,
    width: number,
    height: number,
    s: FlowSettings
) {
    const sinP = Math.sin(phase)
    const cosP = Math.cos(phase)
    const sinPc = Math.sin(phase + 0.55)
    const cosPc = Math.cos(phase + 0.55)
    const cross = phase * 3 + lane * 6
    const radialMul =
        1 +
        lane * s.bundleWidth * (0.55 + 0.45 * sinPc * sinPc) +
        Math.sin(cross) * s.bend
    const tangentMul =
        lane * s.bundleWidth * 0.9 * sinPc * cosPc +
        Math.cos(cross) * s.bend * 3
    const rx = width * s.orbitWidth
    const ry = height * s.orbitHeight
    const px = cosP * rx * radialMul
    const py = sinP * ry * radialMul
    const tx = rx * (-sinP * radialMul + cosP * tangentMul)
    const ty = ry * (cosP * radialMul + sinP * tangentMul)
    const tiltRad = (s.tilt * Math.PI) / 180
    const cosT = Math.cos(tiltRad)
    const sinT = Math.sin(tiltRad)
    return {
        x: width / 2 + px * cosT - py * sinT,
        y: height / 2 + px * sinT + py * cosT,
        tangentX: tx * cosT - ty * sinT,
        tangentY: tx * sinT + ty * cosT,
        brightness: 0.12 + 0.78 * Math.abs(Math.cos(phase + 0.55)) ** 8,
    }
}

function sizeFromUnit(u: number, s: FlowSettings): number {
    const n = clamp(u, 0, 1)
    return n < 0.5
        ? s.minSize + (s.medianSize - s.minSize) * (1 - (1 - n * 2) ** 3)
        : s.medianSize + (s.maxSize - s.medianSize) * (n * 2 - 1) ** 3
}

function lengthFromUnit(u: number, s: FlowSettings): number {
    const n = clamp(u, 0, 1)
    return n < 0.5
        ? s.minLength + (s.medianLength - s.minLength) * (1 - (1 - n * 2) ** 3)
        : s.medianLength + (s.maxLength - s.medianLength) * (n * 2 - 1) ** 3
}

function repelFromPointer(
    px: number,
    py: number,
    pointer: { x: number; y: number },
    radius: number
) {
    const dx = px - pointer.x
    const dy = py - pointer.y
    const dist = Math.hypot(dx, dy)
    if (dist === 0 || dist >= radius) return { x: 0, y: 0 }
    const force = (1 - dist / radius) * 3.2
    return { x: (dx / dist) * force, y: (dy / dist) * force }
}

// ============ 设置 ============

interface FlowSettings {
    countMultiplier: number
    minSize: number
    maxSize: number
    medianSize: number
    minLength: number
    maxLength: number
    medianLength: number
    density: number
    orbitWidth: number
    orbitHeight: number
    tilt: number
    bend: number
    bundleWidth: number
    speed: number
    autoMorph: number
    autoPeriod: number
    autoAmount: number
}

function validateSettings(input: Partial<FlowSettings>): FlowSettings {
    const out: FlowSettings = {
        countMultiplier: 1.5,
        minSize: 0.5,
        maxSize: 5,
        medianSize: 1,
        minLength: 1,
        maxLength: 1,
        medianLength: 1,
        density: 0.2,
        orbitWidth: 0.45,
        orbitHeight: 0.34,
        tilt: -10.5,
        bend: 0,
        bundleWidth: 0.65,
        speed: 1.15,
        autoMorph: 0,
        autoPeriod: 24,
        autoAmount: 0.6,
    }
    const allowNegative = ["tilt", "bend", "speed"]
    for (const key of Object.keys(out) as (keyof FlowSettings)[]) {
        const value = input[key]
        if (
            typeof value === "number" &&
            Number.isFinite(value) &&
            (allowNegative.includes(key) || value >= 0) &&
            (key !== "autoPeriod" || value > 0)
        ) {
            out[key] = value
        }
    }
    out.maxSize = Math.max(out.minSize, out.maxSize)
    out.autoMorph = out.autoMorph >= 0.5 ? 1 : 0
    out.medianSize = clamp(out.medianSize, out.minSize, out.maxSize)
    out.maxLength = Math.max(out.minLength, out.maxLength)
    out.medianLength = clamp(out.medianLength, out.minLength, out.maxLength)
    return out
}

function applyAutoMorph(
    s: FlowSettings,
    time: number,
    reducedMotion: boolean
): FlowSettings {
    if (!s.autoMorph || reducedMotion) return s
    const phase = (time / s.autoPeriod) * Math.PI * 2
    const sinA = Math.sin(phase)
    const sinB = Math.sin(phase * 2)
    const amt = s.autoAmount
    return validateSettings({
        ...s,
        density: s.density + 0.35 * amt * sinA,
        orbitHeight: s.orbitHeight - 0.12 * amt * sinA,
        tilt: s.tilt + 24 * amt * sinB,
        bend: s.bend + 0.05 * amt * sinA,
        speed: s.speed * (1 + 0.5 * amt * sinB),
    })
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
        if (mode !== "scroll") {
            return { active: true, opacity: 1 }
        }
        const start = Math.min(startProgress, endProgress)
        const end = Math.max(startProgress, endProgress)
        if (end - start <= 0.001) {
            return { active: false, opacity: 0 }
        }
        const span = end - start
        const fadeZone = span * clamp(fadeRange, 0.02, 0.5)

        // 起点为 0 时不淡入；终点为 1 时不淡出
        const fadeIn =
            start <= 0.001
                ? 1
                : Math.min(1, Math.max(0, (progress - start) / fadeZone))
        const fadeOut =
            end >= 0.999
                ? 1
                : Math.min(1, Math.max(0, (end - progress) / fadeZone))

        const opacity = Math.min(fadeIn, fadeOut)
        return {
            active: opacity > 0.02,
            opacity,
        }
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

        // ★ 视口感知：离开视口时暂停动画
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
// ============ 静态预览（编辑器画布 & 导出时使用） ============

function StaticFlowPreview({
    intensity,
    style,
}: {
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

        // 一次性绘制简化版粒子
        ctx.fillStyle = `rgba(242,240,234,${0.85 * intensity})`
        const count = 800
        for (let i = 0; i < count; i++) {
            // 使用和实际组件相同的 pseudoRandom
            const u = pseudoRandom(i + 1)
            const lane = (pseudoRandom(i + 20001) - 0.5) * 1.35
            const radius = pseudoRandom(i + 40001)

            // 简化版椭圆轨道分布
            const angle = u * Math.PI * 2
            const rx = w * 0.45
            const ry = h * 0.34
            const radialMul = 1 + lane * 0.65 * 0.6

            const px = Math.cos(angle) * rx * radialMul
            const py = Math.sin(angle) * ry * radialMul

            // 倾斜
            const tiltRad = (-10.5 * Math.PI) / 180
            const cosT = Math.cos(tiltRad)
            const sinT = Math.sin(tiltRad)

            const x = w / 2 + px * cosT - py * sinT
            const y = h / 2 + px * sinT + py * cosT

            // 亮度衰减（模拟真实的中心聚散效果）
            const brightness =
                0.12 + 0.78 * Math.abs(Math.cos(angle + 0.55)) ** 8
            const alpha = brightness * intensity

            // 尺寸
            const size = 0.5 + radius * 1.5

            ctx.fillStyle = `rgba(242,240,234,${alpha})`
            ctx.beginPath()
            ctx.arc(x, y, size / 2, 0, Math.PI * 2)
            ctx.fill()
        }
    }, [intensity])

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

// ============ 主组件 ============

interface Props {
    intensity: number
    countMultiplier: number
    speed: number
    density: number
    tilt: number
    bend: number
    orbitWidth: number
    orbitHeight: number
    bundleWidth: number
    minSize: number
    maxSize: number
    medianSize: number
    minLength: number
    maxLength: number
    medianLength: number
    autoMorph: boolean
    autoPeriod: number
    autoAmount: number
    visibilityMode: string
    startProgress: number
    endProgress: number
    fadeRange: number
    style?: React.CSSProperties
    colorMode: boolean
    colorStart: string
    colorEnd: string
}

export default function FlowFieldParticles(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()
    const colorMode = props.colorMode
    const colorStartInt = useMemo(
        () => parseColor(props.colorStart, DEFAULT_COLOR_START),
        [props.colorStart]
    )
    const colorEndInt = useMemo(
        () => parseColor(props.colorEnd, DEFAULT_COLOR_END),
        [props.colorEnd]
    )
    const settings = useMemo<FlowSettings>(
        () =>
            validateSettings({
                countMultiplier: props.countMultiplier,
                speed: props.speed,
                density: props.density,
                tilt: props.tilt,
                bend: props.bend,
                orbitWidth: props.orbitWidth,
                orbitHeight: props.orbitHeight,
                bundleWidth: props.bundleWidth,
                minSize: props.minSize,
                maxSize: props.maxSize,
                medianSize: props.medianSize,
                minLength: props.minLength,
                maxLength: props.maxLength,
                medianLength: props.medianLength,
                autoMorph: props.autoMorph ? 1 : 0,
                autoPeriod: props.autoPeriod,
                autoAmount: props.autoAmount,
            }),
        [
            props.countMultiplier,
            props.speed,
            props.density,
            props.tilt,
            props.bend,
            props.orbitWidth,
            props.orbitHeight,
            props.bundleWidth,
            props.minSize,
            props.maxSize,
            props.medianSize,
            props.minLength,
            props.maxLength,
            props.medianLength,
            props.autoMorph,
            props.autoPeriod,
            props.autoAmount,
        ]
    )

    const count = Math.round(9000 * settings.countMultiplier)
    const validCount = isSafeCount(count, 200000)

    const timeAccumulator = useRef(0)
    const morphAccumulator = useRef(0)
    const lastSettings = useRef<FlowSettings | null>(null)
    const easeTableCacheRef = useRef<{
        density: number
        table: Float64Array
    } | null>(null)

    const tables = useMemo(
        () => Array.from({ length: 33 }, (_, i) => buildEaseTable(i / 32)),
        []
    )

    const particles = useMemo(
        () =>
            Array.from({ length: validCount ? count : 0 }, (_, i) => ({
                u: pseudoRandom(i + 1),
                lane:
                    (pseudoRandom(i + 20001) - 0.5) *
                    (i % 4 === 0 ? 3.7 : 1.35),
                width: sizeFromUnit(pseudoRandom(i + 40001), settings),
                length: lengthFromUnit(pseudoRandom(i + 50001), settings),
                rate: 0.75 + pseudoRandom(i + 60001) * 0.5,
            })),
        [
            count,
            validCount,
            settings.minSize,
            settings.maxSize,
            settings.medianSize,
            settings.minLength,
            settings.maxLength,
            settings.medianLength,
        ]
    )

    const { active, opacity } = useScrollScene(
        props.visibilityMode,
        props.startProgress,
        props.endProgress,
        props.fadeRange
    )

    const canvasRef = useCanvas(
        useCallback(
            ({ context: ctx, viewport, pointer, delta, reducedMotion }) => {
                const { width, height } = viewport
                if (!validCount) {
                    ctx.clearRect(0, 0, width, height)
                    return
                }

                if (
                    settings.autoMorph &&
                    !reducedMotion &&
                    settings.speed !== 0
                ) {
                    morphAccumulator.current += delta
                } else if (!settings.autoMorph) {
                    morphAccumulator.current = 0
                }

                const targetSettings = applyAutoMorph(
                    settings,
                    morphAccumulator.current,
                    reducedMotion
                )

                const previous = lastSettings.current || settings
                const blend = 1 - Math.exp(-delta * 4)
                const smoothed: FlowSettings = { ...targetSettings }
                for (const key of [
                    "density",
                    "orbitHeight",
                    "tilt",
                    "bend",
                    "speed",
                ] as const) {
                    smoothed[key] =
                        previous[key] +
                        (targetSettings[key] - previous[key]) * blend
                }
                if (settings.speed === 0) smoothed.speed = 0
                lastSettings.current = smoothed

                const densityRaw =
                    Math.max(0, Math.min(1, smoothed.density)) * 32
                const densityIndex = Math.min(31, Math.floor(densityRaw))
                const densityFrac = densityRaw - densityIndex
                let highDensityTable: Float64Array | null = null
                if (smoothed.density > 1) {
                    const cached = easeTableCacheRef.current
                    if (
                        cached &&
                        Math.abs(cached.density - smoothed.density) < 0.001
                    ) {
                        highDensityTable = cached.table
                    } else {
                        highDensityTable = buildEaseTable(smoothed.density)
                        easeTableCacheRef.current = {
                            density: smoothed.density,
                            table: highDensityTable,
                        }
                    }
                }

                timeAccumulator.current +=
                    delta * smoothed.speed * (reducedMotion ? 0.025 : 1)

                ctx.clearRect(0, 0, width, height)
                ctx.lineCap = "round"

                for (let i = 0; i < count; i++) {
                    const p = particles[i]
                    const phase = p.u + timeAccumulator.current * 0.012 * p.rate

                    const phaseValue = highDensityTable
                        ? lookup(highDensityTable, phase)
                        : lookup(tables[densityIndex], phase) +
                          (lookup(tables[densityIndex + 1], phase) -
                              lookup(tables[densityIndex], phase)) *
                              densityFrac

                    const point = computeFlowPoint(
                        phaseValue,
                        p.lane,
                        width,
                        height,
                        smoothed
                    )

                    let px = point.x
                    let py = point.y

                    if (pointer.active && !reducedMotion) {
                        const force = repelFromPointer(
                            point.x,
                            point.y,
                            pointer,
                            Math.min(width, height) * 0.22
                        )
                        px += force.x * 9
                        py += force.y * 9
                    }

                    const edgeDist = Math.hypot(
                        (px - width / 2) / (width * 0.25),
                        (py - height / 2) / (height * 0.13)
                    )
                    const alpha =
                        (0.2 + point.brightness * 0.8) *
                        (1 - Math.min(0.9, Math.abs(p.lane) * 0.35)) *
                        Math.min(1, Math.max(0, (edgeDist - 0.8) * 2)) *
                        props.intensity

                    if (
                        !Number.isFinite(px) ||
                        !Number.isFinite(py) ||
                        alpha <= 0.01 ||
                        px < -20 ||
                        px > width + 20 ||
                        py < -20 ||
                        py > height + 20 ||
                        p.width === 0
                    ) {
                        continue
                    }

                    // 按粒子 X 位置映射渐变
                    const gradientT = px / width
                    const rgb = colorAt(
                        gradientT,
                        colorMode,
                        colorStartInt,
                        colorEndInt
                    )
                    const color = `rgba(${rgb},${alpha})`
                    ctx.strokeStyle = color
                    ctx.fillStyle = color

                    if (i % 3 === 0) {
                        const angle = Math.atan2(point.tangentY, point.tangentX)
                        ctx.lineWidth = p.width
                        ctx.beginPath()
                        ctx.moveTo(px, py)
                        ctx.lineTo(
                            px - Math.cos(angle) * p.length,
                            py - Math.sin(angle) * p.length
                        )
                        ctx.stroke()
                    } else {
                        ctx.beginPath()
                        ctx.arc(px, py, p.width / 2, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            },
            [props.intensity, particles, count, settings, tables, validCount]
        ),
        { active: active && !isStaticRenderer }
    )
    if (isStaticRenderer) {
        return (
            <StaticFlowPreview
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
                pointerEvents: "none",
                ...props.style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

// ============ Framer 属性面板 ============

addPropertyControls(FlowFieldParticles, {
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
    countMultiplier: {
        type: ControlType.Number,
        title: "数量倍数",
        defaultValue: 1.5,
        min: 0.25,
        max: 6,
        step: 0.25,
        displayStepper: true,
    },
    minSize: {
        type: ControlType.Number,
        title: "最小尺寸",
        defaultValue: 0.5,
        min: 0.5,
        max: 16,
        step: 0.5,
        unit: "px",
    },
    maxSize: {
        type: ControlType.Number,
        title: "最大尺寸",
        defaultValue: 5,
        min: 3,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    medianSize: {
        type: ControlType.Number,
        title: "尺寸中位数",
        defaultValue: 1,
        min: 0.5,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    minLength: {
        type: ControlType.Number,
        title: "最短长度",
        defaultValue: 1,
        min: 1,
        max: 160,
        step: 1,
        unit: "px",
    },
    maxLength: {
        type: ControlType.Number,
        title: "最长长度",
        defaultValue: 1,
        min: 1,
        max: 200,
        step: 1,
        unit: "px",
    },
    medianLength: {
        type: ControlType.Number,
        title: "长度中位数",
        defaultValue: 1,
        min: 1,
        max: 200,
        step: 1,
        unit: "px",
    },
    density: {
        type: ControlType.Number,
        title: "疏密对比",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.01,
    },
    orbitWidth: {
        type: ControlType.Number,
        title: "轨道宽度",
        defaultValue: 0.45,
        min: 0.15,
        max: 0.7,
        step: 0.01,
    },
    orbitHeight: {
        type: ControlType.Number,
        title: "轨道高度",
        defaultValue: 0.34,
        min: 0.12,
        max: 0.6,
        step: 0.01,
    },
    tilt: {
        type: ControlType.Number,
        title: "倾斜角度",
        defaultValue: -10.5,
        min: -90,
        max: 90,
        step: 0.5,
        unit: "°",
    },
    bend: {
        type: ControlType.Number,
        title: "弯曲幅度",
        defaultValue: 0,
        min: 0,
        max: 0.15,
        step: 0.005,
    },
    bundleWidth: {
        type: ControlType.Number,
        title: "粒子束宽",
        defaultValue: 0.65,
        min: 0.02,
        max: 0.65,
        step: 0.01,
    },
    speed: {
        type: ControlType.Number,
        title: "运动速度",
        defaultValue: 1.15,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    autoMorph: {
        type: ControlType.Boolean,
        title: "自动变换",
        defaultValue: false,
        enabledTitle: "开启",
        disabledTitle: "关闭",
    },
    autoPeriod: {
        type: ControlType.Number,
        title: "变换周期",
        defaultValue: 24,
        min: 8,
        max: 120,
        step: 1,
        unit: "秒",
    },
    autoAmount: {
        type: ControlType.Number,
        title: "变换幅度",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
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
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
        description: "页面滚动到此进度时开始淡入（0=顶部, 1=底部）",
    },
    endProgress: {
        type: ControlType.Number,
        title: "结束进度",
        defaultValue: 0.15,
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
