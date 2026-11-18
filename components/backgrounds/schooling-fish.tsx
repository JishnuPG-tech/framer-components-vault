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

// ============ 工具 ============

const TAU = Math.PI * 2
const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))

const isSafeCount = (n: number, max: number) =>
    Number.isSafeInteger(n) && n >= 0 && n <= max

// 线性同余随机（对应原文件 6917 seed）
function createRNG(seed: number) {
    let s = seed
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0
        return s / 4294967296
    }
}

// ============ 设置 ============

interface FishSettings {
    countMultiplier: number
    minSize: number
    maxSize: number
    speed: number
    cohesion: number
    separation: number
    alignment: number
    turning: number
    tailAmplitude: number
    pointerStrength: number
    glow: number
    color: number
}

const DEFAULT_SETTINGS: FishSettings = {
    countMultiplier: 5,
    minSize: 18,
    maxSize: 28,
    speed: 2.7,
    cohesion: 0.75,
    separation: 0.04,
    alignment: 1.95,
    turning: 1.8,
    tailAmplitude: 0.55,
    pointerStrength: 1,
    glow: 1.05,
    color: 10279679, // 0x9CDAFF 浅蓝
}

function validateSettings(input: Partial<FishSettings>): FishSettings {
    const out = { ...DEFAULT_SETTINGS }
    for (const key of Object.keys(out) as (keyof FishSettings)[]) {
        const v = input[key]
        if (typeof v !== "number" || !Number.isFinite(v)) continue
        if (key === "color") {
            if (Number.isInteger(v) && v >= 0 && v <= 0xffffff) out[key] = v
        } else if (v >= 0) {
            out[key] = v
        }
    }
    if (out.minSize > out.maxSize) {
        out.minSize = DEFAULT_SETTINGS.minSize
        out.maxSize = DEFAULT_SETTINGS.maxSize
    }
    return out
}

// ============ 鱼的结构 ============

interface Fish {
    x: number // 归一化坐标 0~1
    y: number
    vx: number
    vy: number
    phase: number
    size: number
}

function createFish(count: number, rng: () => number): Fish[] {
    return Array.from({ length: count }, () => {
        const angle = rng() * TAU
        const r = Math.sqrt(rng())
        const speedAngle = -0.3 + rng() * 0.6
        return {
            x: 0.5 + Math.cos(angle) * r * 0.3,
            y: 0.5 + Math.sin(angle) * r * 0.25,
            vx: Math.cos(speedAngle) * 0.12,
            vy: Math.sin(speedAngle) * 0.12,
            phase: rng() * TAU,
            size: rng(),
        }
    })
}

// ============ Boids 力计算（对应原 Te()） ============

const NEIGHBOR_RADIUS = 0.18

function computeBoidForce(
    self: Fish,
    allFish: Fish[],
    pointer: { x: number; y: number; active: boolean },
    s: FishSettings
): { x: number; y: number } {
    let sepX = 0
    let sepY = 0
    let cohX = 0
    let cohY = 0
    let alignVx = 0
    let alignVy = 0
    let count = 0

    for (const other of allFish) {
        if (other === self) continue
        const dx = other.x - self.x
        const dy = other.y - self.y
        const dist = Math.hypot(dx, dy)
        if (dist > NEIGHBOR_RADIUS || dist < 1e-8) continue

        cohX += dx
        cohY += dy
        alignVx += other.vx - self.vx
        alignVy += other.vy - self.vy
        count++

        // 分离力
        if (dist < s.separation) {
            const force = (1 - dist / s.separation) * 0.65
            sepX -= (dx / dist) * force
            sepY -= (dy / dist) * force
        }
    }

    let fx = 0
    let fy = 0

    if (count > 0) {
        // 聚群 + 对齐
        fx +=
            (cohX / count) * s.cohesion * 1.8 +
            (alignVx / count) * s.alignment * 1.2
        fy +=
            (cohY / count) * s.cohesion * 1.8 +
            (alignVy / count) * s.alignment * 1.2
    }

    fx += sepX
    fy += sepY

    // 鼠标避让
    if (pointer.active) {
        const dx = self.x - pointer.x
        const dy = self.y - pointer.y
        const dist = Math.hypot(dx, dy)
        if (dist < 0.2) {
            const force = (1 - dist / 0.2) * s.pointerStrength * 1.8
            fx += (dist ? dx / dist : 1) * force
            fy += (dist ? dy / dist : 0) * force
        }
    }

    return { x: fx, y: fy }
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
    countMultiplier: number
    minSize: number
    maxSize: number
    speed: number
    cohesion: number
    separation: number
    alignment: number
    turning: number
    tailAmplitude: number
    pointerStrength: number
    glow: number
    fishColor: string
    visibilityMode: string
    startProgress: number
    endProgress: number
    fadeRange: number
    style?: React.CSSProperties
}
/**
 * @framerSupportedLayoutWidth any-prefer-fill
 * @framerSupportedLayoutHeight any-prefer-fill
 */
export default function SchoolingFish(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()
    const settings = useMemo<FishSettings>(
        () =>
            validateSettings({
                countMultiplier: props.countMultiplier,
                minSize: props.minSize,
                maxSize: props.maxSize,
                speed: props.speed,
                cohesion: props.cohesion,
                separation: props.separation,
                alignment: props.alignment,
                turning: props.turning,
                tailAmplitude: props.tailAmplitude,
                pointerStrength: props.pointerStrength,
                glow: props.glow,
                color: parseColor(props.fishColor, 10279679),
            }),
        [
            props.countMultiplier,
            props.minSize,
            props.maxSize,
            props.speed,
            props.cohesion,
            props.separation,
            props.alignment,
            props.turning,
            props.tailAmplitude,
            props.pointerStrength,
            props.glow,
            props.fishColor,
        ]
    )

    const fishCount = Math.round(180 * settings.countMultiplier)
    const validCount = isSafeCount(fishCount, 2000)

    const fishRef = useRef<Fish[]>([])
    const timeRef = useRef(0)
    const viewportKeyRef = useRef("")

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
                ctx.clearRect(0, 0, width, height)

                if (!validCount) return

                const minDim = Math.min(width, height)
                const wN = width / minDim
                const hN = height / minDim
                const viewportKey = `${width}:${height}`

                // 数量或视口变化时重建鱼群
                if (
                    fishRef.current.length !== fishCount ||
                    viewportKeyRef.current !== viewportKey
                ) {
                    const rng = createRNG(6917)
                    fishRef.current = createFish(fishCount, rng)
                    viewportKeyRef.current = viewportKey
                }

                const dt = delta * settings.speed * (reducedMotion ? 0.12 : 1)
                timeRef.current += dt
                const t = timeRef.current

                // 空间哈希加速邻居查询
                const cellSize = NEIGHBOR_RADIUS
                const grid = new Map<string, Fish[]>()
                for (const f of fishRef.current) {
                    const gx = Math.floor(f.x / cellSize)
                    const gy = Math.floor(f.y / cellSize)
                    const key = `${gx},${gy}`
                    const bucket = grid.get(key) || []
                    bucket.push(f)
                    grid.set(key, bucket)
                }

                // 收集每条鱼附近的邻居
                const neighborBuckets: Fish[][] = new Array(
                    fishRef.current.length
                )
                for (let i = 0; i < fishRef.current.length; i++) {
                    const f = fishRef.current[i]
                    const gx = Math.floor(f.x / cellSize)
                    const gy = Math.floor(f.y / cellSize)
                    const neighbors: Fish[] = []
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            const bucket = grid.get(`${gx + dx},${gy + dy}`)
                            if (bucket) neighbors.push(...bucket)
                        }
                    }
                    neighborBuckets[i] = neighbors
                }

                // 计算所有鱼的受力
                const forces = fishRef.current.map((f, i) => {
                    const boid = computeBoidForce(
                        f,
                        neighborBuckets[i],
                        {
                            x: pointer.x / minDim,
                            y: pointer.y / minDim,
                            active: pointer.active && !reducedMotion,
                        },
                        settings
                    )

                    // 边缘吸引 + 群心引导
                    const centerX = wN * (0.5 + 0.22 * Math.sin(t * 0.14))
                    const centerY = hN * (0.5 + 0.17 * Math.cos(t * 0.19))
                    boid.x += (centerX - f.x) * 0.08 * settings.cohesion
                    boid.y += (centerY - f.y) * 0.08 * settings.cohesion
                    boid.x += Math.cos(t * 0.7 + f.phase) * 0.018
                    boid.y += Math.sin(t * 0.7 + f.phase) * 0.018

                    // 边界反弹
                    if (f.x < 0.1) boid.x += (0.1 - f.x) * 2
                    if (f.x > wN - 0.1) boid.x -= (f.x - wN + 0.1) * 2
                    if (f.y < 0.1) boid.y += (0.1 - f.y) * 2
                    if (f.y > hN - 0.1) boid.y -= (f.y - hN + 0.1) * 2

                    return boid
                })

                // 更新鱼的位置与速度
                const colorHex = `#${settings.color
                    .toString(16)
                    .padStart(6, "0")}`

                for (let i = 0; i < fishRef.current.length; i++) {
                    const f = fishRef.current[i]
                    const force = forces[i]

                    // 转向
                    const forceMag = Math.hypot(force.x, force.y)
                    const turnScale = forceMag > 0.65 ? 0.65 / forceMag : 1
                    f.vx += force.x * turnScale * dt * settings.turning
                    f.vy += force.y * turnScale * dt * settings.turning

                    // 归一化速度
                    const vMag = Math.hypot(f.vx, f.vy)
                    const targetSpeed = 0.1 + f.size * 0.045
                    if (vMag > 0) {
                        f.vx = (f.vx / vMag) * targetSpeed
                        f.vy = (f.vy / vMag) * targetSpeed
                    }

                    // 移动
                    f.x += f.vx * dt
                    f.y += f.vy * dt

                    // 渲染
                    const sizePx =
                        settings.minSize +
                        (settings.maxSize - settings.minSize) * f.size

                    if (
                        !Number.isFinite(f.x) ||
                        !Number.isFinite(f.y) ||
                        !Number.isFinite(sizePx) ||
                        sizePx > 10000
                    ) {
                        continue
                    }

                    const tailSwing =
                        Math.sin(t * 9 + f.phase) *
                        sizePx *
                        0.12 *
                        settings.tailAmplitude

                    ctx.save()
                    ctx.translate(f.x * minDim, f.y * minDim)
                    ctx.rotate(Math.atan2(f.vy, f.vx))

                    ctx.fillStyle = colorHex
                    ctx.strokeStyle = colorHex
                    ctx.globalAlpha = 0.55 + f.size * 0.4

                    // 鱼身（贝塞尔曲线）
                    ctx.beginPath()
                    ctx.moveTo(sizePx * 0.45, 0)
                    ctx.bezierCurveTo(
                        sizePx * 0.12,
                        -sizePx * 0.13,
                        -sizePx * 0.2,
                        -sizePx * 0.09,
                        -sizePx * 0.35,
                        tailSwing * 0.45
                    )
                    ctx.bezierCurveTo(
                        -sizePx * 0.15,
                        sizePx * 0.09,
                        sizePx * 0.13,
                        sizePx * 0.13,
                        sizePx * 0.45,
                        0
                    )
                    ctx.fill()

                    // 尾鳍
                    ctx.lineWidth = Math.max(0.5, sizePx * 0.025)
                    ctx.beginPath()
                    ctx.moveTo(-sizePx * 0.25, tailSwing * 0.3)
                    ctx.lineTo(-sizePx * 0.56, tailSwing - sizePx * 0.12)
                    ctx.lineTo(-sizePx * 0.47, tailSwing)
                    ctx.lineTo(-sizePx * 0.56, tailSwing + sizePx * 0.12)
                    ctx.lineTo(-sizePx * 0.25, tailSwing * 0.3)
                    ctx.stroke()

                    // 光晕
                    if (settings.glow > 0) {
                        ctx.globalAlpha = Math.min(0.28, settings.glow * 0.15)
                        ctx.lineWidth = sizePx * 0.16
                        ctx.beginPath()
                        ctx.moveTo(sizePx * 0.25, 0)
                        ctx.lineTo(-sizePx * 0.2, tailSwing * 0.25)
                        ctx.stroke()
                    }

                    // 眼睛
                    ctx.globalAlpha = 0.85
                    ctx.fillStyle = "#f0faff"
                    ctx.beginPath()
                    ctx.arc(
                        sizePx * 0.28,
                        -sizePx * 0.025,
                        Math.max(0.45, sizePx * 0.025),
                        0,
                        TAU
                    )
                    ctx.fill()

                    ctx.restore()
                }
            },
            [props.intensity, settings, fishCount, validCount]
        ),
        { active: active && !isStaticRenderer }
    )
    if (isStaticRenderer) {
        return (
            <StaticFishPreview
                fishColor={props.fishColor}
                minSize={props.minSize}
                maxSize={props.maxSize}
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
// ============ 静态预览（编辑器画布 & 导出时使用） ============

function StaticFishPreview({
    fishColor,
    minSize,
    maxSize,
    intensity,
    style,
}: {
    fishColor: string
    minSize: number
    maxSize: number
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

        // 用固定 seed 生成一群静止的鱼
        const count = 500
        const rng = createRNG(6917)
        const colorNum = parseColor(fishColor, 10279679)
        const colorHex = `#${colorNum.toString(16).padStart(6, "0")}`

        ctx.fillStyle = colorHex
        ctx.strokeStyle = colorHex

        for (let i = 0; i < count; i++) {
            // 位置
            const angle = rng() * Math.PI * 2
            const r = Math.sqrt(rng())
            const x = w * (0.5 + Math.cos(angle) * r * 0.35)
            const y = h * (0.5 + Math.sin(angle) * r * 0.3)

            // 朝向
            const heading = rng() * Math.PI * 2

            // 大小
            const sizeU = rng()
            const sizePx = minSize + (maxSize - minSize) * sizeU

            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(sizePx) ||
                sizePx > 10000
            ) {
                continue
            }

            // 静态摆尾（用随机相位固定一个偏移）
            const tailSwing = (rng() - 0.5) * sizePx * 0.2

            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(heading)

            // 鱼身（贝塞尔曲线）
            ctx.globalAlpha = 0.55 + sizeU * 0.4

            ctx.beginPath()
            ctx.moveTo(sizePx * 0.45, 0)
            ctx.bezierCurveTo(
                sizePx * 0.12,
                -sizePx * 0.13,
                -sizePx * 0.2,
                -sizePx * 0.09,
                -sizePx * 0.35,
                tailSwing * 0.45
            )
            ctx.bezierCurveTo(
                -sizePx * 0.15,
                sizePx * 0.09,
                sizePx * 0.13,
                sizePx * 0.13,
                sizePx * 0.45,
                0
            )
            ctx.fill()

            // 尾鳍
            ctx.lineWidth = Math.max(0.5, sizePx * 0.025)
            ctx.beginPath()
            ctx.moveTo(-sizePx * 0.25, tailSwing * 0.3)
            ctx.lineTo(-sizePx * 0.56, tailSwing - sizePx * 0.12)
            ctx.lineTo(-sizePx * 0.47, tailSwing)
            ctx.lineTo(-sizePx * 0.56, tailSwing + sizePx * 0.12)
            ctx.lineTo(-sizePx * 0.25, tailSwing * 0.3)
            ctx.stroke()

            // 眼睛
            ctx.globalAlpha = 0.85
            ctx.fillStyle = "#f0faff"
            ctx.beginPath()
            ctx.arc(
                sizePx * 0.28,
                -sizePx * 0.025,
                Math.max(0.45, sizePx * 0.025),
                0,
                Math.PI * 2
            )
            ctx.fill()

            ctx.restore()
        }
    }, [fishColor, minSize, maxSize, intensity])

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

addPropertyControls(SchoolingFish, {
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
        defaultValue: 5,
        min: 0,
        max: 5,
        step: 0.05,
        displayStepper: true,
        unit: "×",
    },
    minSize: {
        type: ControlType.Number,
        title: "最小鱼体长度",
        defaultValue: 18,
        min: 1,
        max: 40,
        step: 0.5,
        unit: "px",
    },
    maxSize: {
        type: ControlType.Number,
        title: "最大鱼体长度",
        defaultValue: 28,
        min: 1,
        max: 60,
        step: 0.5,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "游动速度",
        defaultValue: 2.7,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    cohesion: {
        type: ControlType.Number,
        title: "聚群程度",
        defaultValue: 0.75,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    separation: {
        type: ControlType.Number,
        title: "同伴间距",
        defaultValue: 0.04,
        min: 0,
        max: 0.15,
        step: 0.005,
    },
    alignment: {
        type: ControlType.Number,
        title: "同伴方向跟随",
        defaultValue: 1.95,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    turning: {
        type: ControlType.Number,
        title: "转向幅度",
        defaultValue: 1.8,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    tailAmplitude: {
        type: ControlType.Number,
        title: "摆尾幅度",
        defaultValue: 0.55,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    pointerStrength: {
        type: ControlType.Number,
        title: "鼠标避让强度",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    glow: {
        type: ControlType.Number,
        title: "发光强度",
        defaultValue: 1.05,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    fishColor: {
        type: ControlType.Color,
        title: "鱼群颜色",
        defaultValue: "#9CDAFF",
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
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.01,
        description: "页面滚动到此进度时开始淡入",
    },
    endProgress: {
        type: ControlType.Number,
        title: "结束进度",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        description: "页面滚动到此进度时完全淡出（设 1 则永不淡出）",
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
