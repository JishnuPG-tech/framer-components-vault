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

// ============ 设置 ============

interface SphereSettings {
    countMultiplier: number
    minSize: number
    maxSize: number
    medianSize: number
    sphereWidth: number
    sphereHeight: number
    tilt: number
    rotation: number
    twist: number
    speed: number
    lineOpacity: number
    glow: number
    hoverActivation: number
    activationBrightness: number
    activationSpeed: number
    activationFade: number
    activationColor: number
    activationColorEnd: number
    activationGradient: number
}

const DEFAULT_SETTINGS: SphereSettings = {
    countMultiplier: 0.25,
    minSize: 1.5,
    maxSize: 1.5,
    medianSize: 1.5,
    sphereWidth: 0.63,
    sphereHeight: 0.66,
    tilt: -10,
    rotation: 18,
    twist: 0.65,
    speed: 1.4,
    lineOpacity: 0.65,
    glow: 0.85,
    hoverActivation: 1,
    activationBrightness: 1.25,
    activationSpeed: 1,
    activationFade: 1.2,
    activationColor: 16748447, // 0xFF8F9F 珊瑚
    activationColorEnd: 8895487, // 0x87BBFF 冰蓝
    activationGradient: 1,
}

const ALLOW_NEGATIVE = ["tilt", "rotation", "twist", "speed"]

function validateSettings(input: Partial<SphereSettings>): SphereSettings {
    const out = { ...DEFAULT_SETTINGS }
    for (const key of Object.keys(out) as (keyof SphereSettings)[]) {
        const value = input[key]
        if (
            typeof value === "number" &&
            Number.isFinite(value) &&
            (ALLOW_NEGATIVE.includes(key) || value >= 0)
        ) {
            out[key] = value
        }
    }
    out.maxSize = Math.max(out.minSize, out.maxSize)
    out.medianSize = clamp(out.medianSize, out.minSize, out.maxSize)
    out.hoverActivation = out.hoverActivation >= 0.5 ? 1 : 0
    out.activationGradient =
        out.activationGradient === 0 || out.activationGradient === 1
            ? out.activationGradient
            : 1
    return out
}

// ============ 球面点计算（对应原文件 oe()） ============

interface SurfacePoint {
    x: number
    y: number
    z: number
}

interface ProjectedPoint {
    x: number
    y: number
    depth: number
    surface: SurfacePoint
}

function projectSpherePoint(
    u: number, // 0 ~ TAU
    lat: number, // 0 ~ π
    time: number,
    width: number,
    height: number,
    s: SphereSettings
): ProjectedPoint {
    // 经度（带 twist 扭转）
    const lon = lat + (time * TAU) / 24 + s.twist * Math.cos(u)

    // 3D 单位球面坐标
    const sx = Math.sin(u) * Math.cos(lon)
    const sy = -Math.cos(u)
    const sz = Math.sin(u) * Math.sin(lon)

    // 观察俯仰旋转
    const rotRad = (s.rotation * Math.PI) / 180
    const ry = sy * Math.cos(rotRad) - sz * Math.sin(rotRad)
    const rz = sy * Math.sin(rotRad) + sz * Math.cos(rotRad)

    // 屏幕投影
    const r = Math.min(width, height)
    const px = sx * r * s.sphereWidth
    const py = ry * r * s.sphereHeight

    // 屏幕倾斜
    const tiltRad = (s.tilt * Math.PI) / 180
    const cosT = Math.cos(tiltRad)
    const sinT = Math.sin(tiltRad)

    return {
        x: width / 2 + px * cosT - py * sinT,
        y: height / 2 + px * sinT + py * cosT,
        depth: rz,
        surface: { x: sx, y: ry, z: rz },
    }
}

// ============ 激活系统 ============

interface ActivationState {
    inside: boolean
    source: SurfacePoint | null
    cursor: SurfacePoint | null
    radius: number
    presence: number
}

function emptyActivation(): ActivationState {
    return {
        inside: false,
        source: null,
        cursor: null,
        radius: 0,
        presence: 0,
    }
}

// 鼠标命中检测（对应 ml()）
function hitSphere(
    pointer: { x: number; y: number; active: boolean },
    width: number,
    height: number,
    s: SphereSettings
): SurfacePoint | null {
    if (!pointer.active || s.sphereWidth <= 0 || s.sphereHeight <= 0) {
        return null
    }
    const tiltRad = (s.tilt * Math.PI) / 180
    const cosT = Math.cos(tiltRad)
    const sinT = Math.sin(tiltRad)
    const dx = pointer.x - width / 2
    const dy = pointer.y - height / 2
    const r = Math.min(width, height)
    const u = (dx * cosT + dy * sinT) / (r * s.sphereWidth)
    const v = (-dx * sinT + dy * cosT) / (r * s.sphereHeight)
    const f = u * u + v * v
    if (!Number.isFinite(f) || f > 1) return null
    return { x: u, y: v, z: Math.sqrt(Math.max(0, 1 - f)) }
}

// 球面两点夹角（对应 gl()）
function sphereAngle(a: SurfacePoint, b: SurfacePoint): number {
    const dot = a.x * b.x + a.y * b.y + a.z * b.z
    return Math.acos(Math.max(-1, Math.min(1, dot)))
}

// 某点的激活亮度（对应 _l()）
function activationAt(surface: SurfacePoint, state: ActivationState): number {
    if (!state.source || state.presence === 0) return 0
    const dist = sphereAngle(surface, state.source)
    const ringPos = Math.max(
        0,
        Math.min(1, (state.radius + 0.35 - dist) / 0.35)
    )
    // smoothstep
    const ring = ringPos * ringPos * (3 - 2 * ringPos)
    const cursorGlow = state.cursor
        ? Math.exp(-((sphereAngle(surface, state.cursor) / 0.3) ** 2))
        : 0
    return state.presence * ring * (1 + 0.35 * cursorGlow)
}

// 更新激活状态（对应 hl()）
function updateActivation(
    prev: ActivationState,
    pointer: { x: number; y: number; active: boolean },
    width: number,
    height: number,
    s: SphereSettings,
    delta: number,
    reducedMotion: boolean
): ActivationState {
    if (!s.hoverActivation) return emptyActivation()

    const hit = hitSphere(pointer, width, height, s)
    if (hit) {
        const isNew = !prev.source || prev.presence === 0
        return {
            inside: true,
            source: isNew ? hit : prev.source,
            cursor: hit,
            radius: reducedMotion
                ? Math.PI
                : Math.min(
                      Math.PI,
                      (isNew ? 0 : prev.radius) +
                          delta * s.activationSpeed * Math.PI
                  ),
            presence: Math.min(1, (isNew ? 0 : prev.presence) + delta * 5),
        }
    }

    // 鼠标离开
    const fade =
        s.activationFade === 0
            ? 0
            : Math.max(0, prev.presence - delta / s.activationFade)
    if (fade === 0) return emptyActivation()
    return { ...prev, inside: false, presence: fade }
}

// 颜色计算（对应 vl()）
function surfaceColor(
    s: SphereSettings,
    activation: number,
    gradientPos: number
): string {
    const a = clamp(activation, 0, 1)
    const g = s.activationGradient ? clamp(gradientPos, 0, 1) : 0
    const base = [242, 240, 234]
    const startC = [
        (s.activationColor >> 16) & 255,
        (s.activationColor >> 8) & 255,
        s.activationColor & 255,
    ]
    const endC = [
        (s.activationColorEnd >> 16) & 255,
        (s.activationColorEnd >> 8) & 255,
        s.activationColorEnd & 255,
    ]
    return [0, 1, 2]
        .map((i) => {
            const mix = startC[i] + (endC[i] - startC[i]) * g
            return Math.round(base[i] + (mix - base[i]) * a)
        })
        .join(",")
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
    medianSize: number
    sphereWidth: number
    sphereHeight: number
    tilt: number
    rotation: number
    twist: number
    speed: number
    lineOpacity: number
    glow: number
    hoverActivation: boolean
    activationBrightness: number
    activationSpeed: number
    activationFade: number
    activationColor: string
    activationColorEnd: string
    gradientMode: boolean
    visibilityMode: string
    startProgress: number
    endProgress: number
    fadeRange: number
    style?: React.CSSProperties
}

export default function SphericalArcs(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()
    const settings = useMemo<SphereSettings>(
        () =>
            validateSettings({
                countMultiplier: props.countMultiplier,
                minSize: props.minSize,
                maxSize: props.maxSize,
                medianSize: props.medianSize,
                sphereWidth: props.sphereWidth,
                sphereHeight: props.sphereHeight,
                tilt: props.tilt,
                rotation: props.rotation,
                twist: props.twist,
                speed: props.speed,
                lineOpacity: props.lineOpacity,
                glow: props.glow,
                hoverActivation: props.hoverActivation ? 1 : 0,
                activationBrightness: props.activationBrightness,
                activationSpeed: props.activationSpeed,
                activationFade: props.activationFade,
                activationColor: parseColor(props.activationColor, 16748447),
                activationColorEnd: parseColor(
                    props.activationColorEnd,
                    8895487
                ),
                activationGradient: props.gradientMode ? 1 : 0,
            }),
        [
            props.countMultiplier,
            props.minSize,
            props.maxSize,
            props.medianSize,
            props.sphereWidth,
            props.sphereHeight,
            props.tilt,
            props.rotation,
            props.twist,
            props.speed,
            props.lineOpacity,
            props.glow,
            props.hoverActivation,
            props.activationBrightness,
            props.activationSpeed,
            props.activationFade,
            props.activationColor,
            props.activationColorEnd,
            props.gradientMode,
        ]
    )

    const curveCount = Math.round(80 * settings.countMultiplier)
    const validCount = isSafeCount(curveCount, 1000)

    const timeAccumulator = useRef(0)
    const activationRef = useRef<ActivationState>(emptyActivation())

    const { active, opacity } = useScrollScene(
        props.visibilityMode,
        props.startProgress,
        props.endProgress,
        props.fadeRange
    )

    // 离开活动状态时清空激活
    useEffect(() => {
        if (!active) {
            activationRef.current = emptyActivation()
        }
    }, [active])

    const canvasRef = useCanvas(
        useCallback(
            ({ context: ctx, viewport, pointer, delta, reducedMotion }) => {
                const { width, height } = viewport
                ctx.clearRect(0, 0, width, height)

                if (!validCount) return

                timeAccumulator.current =
                    (timeAccumulator.current +
                        delta * settings.speed * (reducedMotion ? 0.025 : 1)) %
                    24

                activationRef.current = updateActivation(
                    activationRef.current,
                    pointer,
                    width,
                    height,
                    settings,
                    delta,
                    reducedMotion
                )

                ctx.lineCap = "round"

                const time = timeAccumulator.current
                const activation = activationRef.current

                // 每条曲线 u 从 0 到 π
                for (let c = 0; c < curveCount; c++) {
                    const u = (c / Math.max(1, curveCount)) * Math.PI
                    const unitPos = (c * 0.61803398875) % 1

                    // 曲线粗细（三次贝塞尔分布）
                    const thickness =
                        unitPos < 0.5
                            ? settings.minSize +
                              (settings.medianSize - settings.minSize) *
                                  (1 - (1 - unitPos * 2) ** 3)
                            : settings.medianSize +
                              (settings.maxSize - settings.medianSize) *
                                  (unitPos * 2 - 1) ** 3

                    if (thickness === 0) continue

                    // 流动头部位置
                    const flow = (((time / 8 + unitPos) % 1) + 1) % 1

                    // 沿曲线画 48 个分段
                    for (let i = 0; i < 48; i++) {
                        const point = projectSpherePoint(
                            ((i + 0.5) / 48) * TAU,
                            u,
                            time,
                            width,
                            height,
                            settings
                        )

                        // 流动头部的亮度衰减
                        const dist = (flow - i / 48 + 1) % 1
                        const headGlow = Math.exp(-dist * 22)
                        const depthNorm = (point.depth + 1) / 2

                        const act =
                            activationAt(point.surface, activation) *
                            settings.activationBrightness

                        const alpha = Math.min(
                            1,
                            (settings.lineOpacity *
                                (0.15 + depthNorm * 0.65 + headGlow * 0.8) +
                                act * 0.55) *
                                props.intensity
                        )

                        if (
                            alpha < 0.002 ||
                            !Number.isFinite(point.x) ||
                            !Number.isFinite(point.y)
                        ) {
                            continue
                        }

                        // 渐变位置
                        const gradientPos = activation.source
                            ? sphereAngle(point.surface, activation.source) /
                              Math.PI
                            : 0

                        const color = surfaceColor(settings, act, gradientPos)

                        ctx.strokeStyle = `rgba(${color},${alpha})`
                        ctx.lineWidth =
                            thickness *
                            (0.65 + depthNorm * 0.35) *
                            (1 + Math.min(0.2, act * 0.12))
                        ctx.shadowBlur = 0
                        ctx.beginPath()
                        for (let k = 0; k <= 3; k++) {
                            const sub = projectSpherePoint(
                                ((i + k / 3) / 48) * TAU,
                                u,
                                time,
                                width,
                                height,
                                settings
                            )
                            if (k === 0) ctx.moveTo(sub.x, sub.y)
                            else ctx.lineTo(sub.x, sub.y)
                        }

                        // 光晕（三次叠加）
                        const w = ctx.lineWidth
                        const glowWidth = Math.min(
                            12,
                            settings.glow * (1 + headGlow * 3) + act * 3
                        )
                        if (glowWidth > 0.1) {
                            ctx.lineWidth = w + glowWidth
                            ctx.strokeStyle = `rgba(${color},${alpha * 0.07})`
                            ctx.stroke()
                            ctx.lineWidth = w + glowWidth * 0.4
                            ctx.strokeStyle = `rgba(${color},${alpha * 0.1})`
                            ctx.stroke()
                        }

                        ctx.lineWidth = w
                        ctx.strokeStyle = `rgba(${color},${alpha})`
                        ctx.stroke()
                    }

                    // 曲线流动头部的光点
                    const head = projectSpherePoint(
                        flow * TAU,
                        u,
                        time,
                        width,
                        height,
                        settings
                    )
                    if (!Number.isFinite(head.x) || !Number.isFinite(head.y)) {
                        continue
                    }

                    const headAct =
                        activationAt(head.surface, activation) *
                        settings.activationBrightness
                    const headGradient = activation.source
                        ? sphereAngle(head.surface, activation.source) / Math.PI
                        : 0
                    const headColor = surfaceColor(
                        settings,
                        headAct,
                        headGradient
                    )

                    ctx.shadowColor = `rgba(${headColor},${Math.min(
                        0.8,
                        headAct * 0.4
                    )})`
                    ctx.shadowBlur = Math.min(
                        24,
                        settings.glow * 2 + headAct * 8
                    )
                    ctx.fillStyle = `rgba(${headColor},${Math.min(
                        1,
                        (settings.lineOpacity *
                            (0.3 + (head.depth + 1) * 0.35) +
                            headAct * 0.55) *
                            props.intensity
                    )})`
                    ctx.beginPath()
                    ctx.arc(head.x, head.y, thickness * 0.75, 0, TAU)
                    ctx.fill()
                }

                ctx.shadowBlur = 0
            },
            [props.intensity, settings, curveCount, validCount]
        ),
        { active: active && !isStaticRenderer }
    )
    if (isStaticRenderer) {
        return (
            <StaticSpherePreview
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

function StaticSpherePreview({
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

        const sphereW = 0.63
        const sphereH = 0.66
        const tiltRad = (-10 * Math.PI) / 180
        const cosT = Math.cos(tiltRad)
        const sinT = Math.sin(tiltRad)
        const rotRad = (18 * Math.PI) / 180
        const r = Math.min(w, h)

        // 画 20 条静止的弧线
        const curveCount = 20
        ctx.lineCap = "round"

        for (let c = 0; c < curveCount; c++) {
            const u = (c / curveCount) * Math.PI
            const unitPos = (c * 0.61803398875) % 1
            const thickness = 1.5

            ctx.strokeStyle = `rgba(242,240,234,${0.65 * intensity})`
            ctx.lineWidth = thickness
            ctx.beginPath()

            const SEGMENTS = 48
            for (let i = 0; i <= SEGMENTS; i++) {
                const theta = (i / SEGMENTS) * TAU
                // 与真实组件一致的球面投影（省略 time）
                const lon = u + 0.65 * Math.cos(theta)
                const sx = Math.sin(theta) * Math.cos(lon)
                const sy = -Math.cos(theta)
                const sz = Math.sin(theta) * Math.sin(lon)

                const ry = sy * Math.cos(rotRad) - sz * Math.sin(rotRad)
                const rz = sy * Math.sin(rotRad) + sz * Math.cos(rotRad)

                const px = sx * r * sphereW
                const py = ry * r * sphereH

                const x = w / 2 + px * cosT - py * sinT
                const y = h / 2 + px * sinT + py * cosT

                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()
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

// ============ Framer 属性面板 ============

addPropertyControls(SphericalArcs, {
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
        defaultValue: 0.25,
        min: 0.25,
        max: 4,
        step: 0.25,
        displayStepper: true,
    },
    minSize: {
        type: ControlType.Number,
        title: "最小粗细",
        defaultValue: 1.5,
        min: 0.1,
        max: 8,
        step: 0.1,
        unit: "px",
    },
    maxSize: {
        type: ControlType.Number,
        title: "最大粗细",
        defaultValue: 1.5,
        min: 0.1,
        max: 12,
        step: 0.1,
        unit: "px",
    },
    medianSize: {
        type: ControlType.Number,
        title: "粗细中位数",
        defaultValue: 1.5,
        min: 0.1,
        max: 12,
        step: 0.1,
        unit: "px",
    },
    sphereWidth: {
        type: ControlType.Number,
        title: "球体宽度",
        defaultValue: 0.63,
        min: 0.1,
        max: 0.8,
        step: 0.01,
    },
    sphereHeight: {
        type: ControlType.Number,
        title: "球体高度",
        defaultValue: 0.66,
        min: 0.1,
        max: 0.8,
        step: 0.01,
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
    rotation: {
        type: ControlType.Number,
        title: "观察俯仰",
        defaultValue: 18,
        min: -90,
        max: 90,
        step: 0.5,
        unit: "°",
    },
    twist: {
        type: ControlType.Number,
        title: "曲线扭转",
        defaultValue: 0.65,
        min: -3,
        max: 3,
        step: 0.05,
        unit: "rad",
    },
    speed: {
        type: ControlType.Number,
        title: "运动速度",
        defaultValue: 1.4,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    lineOpacity: {
        type: ControlType.Number,
        title: "曲线透明度",
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
    },
    glow: {
        type: ControlType.Number,
        title: "光晕强度",
        defaultValue: 0.85,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "×",
    },
    hoverActivation: {
        type: ControlType.Boolean,
        title: "鼠标激活",
        defaultValue: true,
        enabledTitle: "开启",
        disabledTitle: "关闭",
    },
    activationBrightness: {
        type: ControlType.Number,
        title: "激活亮度",
        defaultValue: 1.25,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "×",
    },
    activationSpeed: {
        type: ControlType.Number,
        title: "扩散速度",
        defaultValue: 1,
        min: 0.1,
        max: 4,
        step: 0.05,
        unit: "×",
    },
    activationFade: {
        type: ControlType.Number,
        title: "退光时间",
        defaultValue: 1.2,
        min: 0,
        max: 5,
        step: 0.05,
        unit: "秒",
    },
    activationColor: {
        type: ControlType.Color,
        title: "起始颜色",
        defaultValue: "#FF8F9F",
    },
    activationColorEnd: {
        type: ControlType.Color,
        title: "结束颜色",
        defaultValue: "#87BBFF",
    },
    gradientMode: {
        type: ControlType.Boolean,
        title: "双色渐变",
        defaultValue: true,
        enabledTitle: "双色",
        disabledTitle: "单色",
        description: "关闭时只用起始颜色",
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
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.01,
        description: "页面滚动到此进度时开始淡入（0=顶部, 1=底部）",
    },
    endProgress: {
        type: ControlType.Number,
        title: "结束进度",
        defaultValue: 0.35,
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
