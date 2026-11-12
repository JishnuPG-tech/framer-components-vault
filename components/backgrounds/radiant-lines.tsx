/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */

import * as React from "react"
// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─── Default Palettes ────────────────────────────────────────────────────────

export const DEFAULT_COLORS = [
    "#FF6B4A",
    "#2DD4BF",
    "#FBBF24",
    "#60A5FA",
    "#F472B6",
    "#A3E635",
    "#94A3B8",
]

export const PALETTES: Record<string, string[]> = {
    radiant: DEFAULT_COLORS,
    cyberpunk: ["#00F0FF", "#FFE600", "#FF003C", "#00FF66", "#7B00FF"],
    neon: ["#FF007F", "#7928CA", "#0070F3", "#00DFD8", "#FF4D4D", "#F5A623"],
    monochrome: ["#FFFFFF", "#E2E8F0", "#94A3B8", "#64748B", "#CBD5E1"],
    matrix: ["#00FF66", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
}

// ─── Engine Constants ────────────────────────────────────────────────────────

const DEPTH = 1000
const STIFFNESS = 70
const DAMPING = 32
const MASS = 0.5
const TRAVEL_PER_SEC = 2.4 * 60 // 144
const TRAIL_DT = 1 / 60

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RadiantLinesProps {
    starCount?: number
    displacement?: number
    baseSpeed?: number
    scrollSensitivity?: number
    reverseDirection?: boolean
    backgroundColor?: string
    palette?:
        | "radiant"
        | "cyberpunk"
        | "neon"
        | "monochrome"
        | "matrix"
        | "custom"
    colors?: string[]
    borderRadius?: number
    credits?: string
    style?: React.CSSProperties
    className?: string
    children?: React.ReactNode
}

type Star = {
    x: number
    y: number
    z: number
    pz: number
    color: string
}

interface EngineOptions {
    colors: string[]
    starCount: number
    displacement: number
    baseSpeed: number
    scrollSensitivity: number
    reverseDirection: boolean
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function resolvePalette(
    paletteName?: string,
    customColors?: string[]
): string[] {
    if (paletteName === "custom" && customColors && customColors.length > 0) {
        return customColors
    }
    if (paletteName && PALETTES[paletteName]) {
        return PALETTES[paletteName]
    }
    if (customColors && customColors.length > 0) {
        return customColors
    }
    return DEFAULT_COLORS
}

function displacementOf(value?: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return 1
    return Math.max(0, value)
}

function createStars(count: number, colors: string[]): Star[] {
    const stars: Star[] = []
    const palette = colors.length > 0 ? colors : DEFAULT_COLORS
    for (let i = 0; i < count; i++) {
        const z = Math.random() * DEPTH
        stars.push({
            x: (Math.random() - 0.5) * DEPTH,
            y: (Math.random() - 0.5) * DEPTH,
            z,
            pz: z,
            color: palette[i % palette.length]!,
        })
    }
    return stars
}

function findScrollParent(node: HTMLElement | null): HTMLElement | Window {
    if (typeof window === "undefined" || !node) {
        return typeof window !== "undefined"
            ? window
            : (null as unknown as Window)
    }
    let current = node.parentElement
    while (
        current &&
        current !== document.body &&
        current !== document.documentElement
    ) {
        const style = window.getComputedStyle(current)
        const overflowY = style.overflowY
        if (overflowY === "auto" || overflowY === "scroll") {
            return current
        }
        current = current.parentElement
    }
    return window
}

// ─── Static Snapshot Renderer (Canvas Preview / SSR / Static Export) ─────────

function drawStaticSnapshot(canvas: HTMLCanvasElement, options: EngineOptions) {
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const parent = canvas.parentElement
    const w = parent?.clientWidth || canvas.clientWidth || 800
    const h = parent?.clientHeight || canvas.clientHeight || 600
    const dpr =
        typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio || 1, 2)
            : 1

    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const cx = w / 2
    const cy = h / 2
    const focal = Math.max(w, h) * 0.5
    const warp = options.baseSpeed
    const travel = warp * TRAVEL_PER_SEC * displacementOf(options.displacement)
    const dir = options.reverseDirection ? 1 : -1
    const count = options.starCount
    const colors = options.colors.length > 0 ? options.colors : DEFAULT_COLORS

    for (let i = 0; i < count; i++) {
        // Deterministic pseudo-random distribution for consistent static renders
        const seedZ = ((i * 9973 + 137) % 10000) / 10000
        const seedX = ((i * 7919 + 541) % 10000) / 10000
        const seedY = ((i * 6271 + 317) % 10000) / 10000

        const z = 10 + seedZ * (DEPTH - 20)
        const x3d = (seedX - 0.5) * DEPTH
        const y3d = (seedY - 0.5) * DEPTH
        const color = colors[i % colors.length]!

        const pz = Math.min(DEPTH, Math.max(1.01, z + dir * travel * TRAIL_DT))

        const k = focal / z
        const x = cx + x3d * k
        const y = cy + y3d * k

        const pk = focal / pz
        const px = cx + x3d * pk
        const py = cy + y3d * pk

        if (
            (x < -50 && px < -50) ||
            (x > w + 50 && px > w + 50) ||
            (y < -50 && py < -50) ||
            (y > h + 50 && py > h + 50)
        ) {
            continue
        }

        const near = 1 - z / DEPTH
        const lineW = Math.max(0.8, near * (1.8 + warp * 0.12))
        const alpha = 0.35 + near * 0.65

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(x, y)
        ctx.strokeStyle = color
        ctx.globalAlpha = alpha
        ctx.lineWidth = lineW
        ctx.lineCap = "round"
        ctx.stroke()

        if (near > 0.45) {
            ctx.beginPath()
            ctx.arc(x, y, lineW * 0.9, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
        }
    }
    ctx.globalAlpha = 1
}

// ─── Live Dynamic Engine (IntersectionObserver, RAF, Spring Inertia) ─────────

function createRadiantLinesEngine(
    canvas: HTMLCanvasElement,
    initial: EngineOptions
) {
    let options: EngineOptions = { ...initial }

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return null

    let stars = createStars(options.starCount, options.colors)
    const size = { w: 0, h: 0 }
    let speed = options.baseSpeed
    let speedVel = 0
    let speedTarget = options.baseSpeed
    const dirSign = options.reverseDirection ? 1 : -1
    let dir = dirSign
    let reduce = false
    let raf = 0
    let destroyed = false
    let onScreen = true
    let lastFrame = performance.now()
    let lastScrollY = 0
    let lastScrollT = performance.now()

    let scrollTarget: HTMLElement | Window | null = null

    const resize = () => {
        const parent = canvas.parentElement
        if (!parent) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = parent.clientWidth
        const h = parent.clientHeight
        size.w = w
        size.h = h
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        wake()
    }

    const mqReduce =
        typeof window !== "undefined" && window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null

    const onReduce = () => {
        reduce = mqReduce ? mqReduce.matches : false
        if (reduce) {
            speedTarget = 0.06
            dir = options.reverseDirection ? 1 : -1
        }
        wake()
    }

    const readScrollY = () => {
        let y = 0
        if (
            scrollTarget &&
            scrollTarget !== window &&
            "scrollTop" in scrollTarget
        ) {
            y += (scrollTarget as HTMLElement).scrollTop
        }
        if (typeof window !== "undefined") {
            y += window.scrollY || window.pageYOffset || 0
        }
        return y
    }

    const applyWarp = (v: number) => {
        const currentDirSign = options.reverseDirection ? 1 : -1
        if (reduce) {
            speedTarget = 0.06
            dir = currentDirSign
            return
        }
        if (Math.abs(v) > 2) {
            dir = (v > 0 ? 1 : -1) * currentDirSign
        }
        const boost =
            options.scrollSensitivity > 0
                ? Math.min(
                      8 * options.scrollSensitivity,
                      (Math.abs(v) / 80) * options.scrollSensitivity
                  )
                : 0
        speedTarget = options.baseSpeed + boost
    }

    const onScroll = () => {
        const now = performance.now()
        const y = readScrollY()
        const dt = now - lastScrollT
        const v = dt > 0 ? ((y - lastScrollY) / dt) * 1000 : 0
        lastScrollY = y
        lastScrollT = now
        applyWarp(v)
    }

    const unbindScroll = () => {
        if (scrollTarget) {
            scrollTarget.removeEventListener("scroll", onScroll)
            scrollTarget = null
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("scroll", onScroll)
        }
    }

    const bindScroll = () => {
        unbindScroll()
        scrollTarget = findScrollParent(canvas)
        lastScrollY = readScrollY()
        lastScrollT = performance.now()

        if (scrollTarget && scrollTarget !== window) {
            scrollTarget.addEventListener("scroll", onScroll, { passive: true })
        }
        if (typeof window !== "undefined") {
            window.addEventListener("scroll", onScroll, { passive: true })
        }
    }

    bindScroll()

    const moving = () =>
        onScreen &&
        !reduce &&
        (typeof document === "undefined" ||
            document.visibilityState !== "hidden")

    function wake() {
        if (raf || destroyed) return
        lastFrame = performance.now()
        raf = requestAnimationFrame(tick)
    }

    const tick = (now: number) => {
        raf = 0
        if (destroyed) return

        const live = moving()
        const dt = live
            ? Math.min(0.05, Math.max(0, (now - lastFrame) / 1000))
            : 0
        lastFrame = now

        if (now - lastScrollT > 40 && !reduce) {
            applyWarp(0)
        }

        const accel =
            (STIFFNESS * (speedTarget - speed) - DAMPING * speedVel) / MASS
        speedVel += accel * dt
        speed += speedVel * dt

        const { w, h } = size
        if (w === 0 || h === 0) {
            if (live) raf = requestAnimationFrame(tick)
            return
        }

        const cx = w / 2
        const cy = h / 2
        const warp = reduce ? 0 : speed
        const focal = Math.max(w, h) * 0.5
        const currentColors =
            options.colors.length > 0 ? options.colors : DEFAULT_COLORS
        const travel =
            warp * TRAVEL_PER_SEC * displacementOf(options.displacement)

        ctx.clearRect(0, 0, w, h)

        for (let i = 0; i < stars.length; i++) {
            const star = stars[i]!
            star.z -= dir * travel * dt

            if (star.z <= 1) {
                star.z = DEPTH
                star.pz = DEPTH
                star.x = (Math.random() - 0.5) * DEPTH
                star.y = (Math.random() - 0.5) * DEPTH
                star.color =
                    currentColors[
                        Math.floor(Math.random() * currentColors.length)
                    ]!
            } else if (star.z >= DEPTH) {
                star.z = 1.5
                star.pz = 1.5
                star.x = (Math.random() - 0.5) * DEPTH
                star.y = (Math.random() - 0.5) * DEPTH
                star.color =
                    currentColors[
                        Math.floor(Math.random() * currentColors.length)
                    ]!
            } else {
                star.pz = Math.min(
                    DEPTH,
                    Math.max(1.01, star.z + dir * travel * TRAIL_DT)
                )
            }

            const k = focal / star.z
            const x = cx + star.x * k
            const y = cy + star.y * k

            const pk = focal / star.pz
            const px = cx + star.x * pk
            const py = cy + star.y * pk

            if (
                (x < -50 && px < -50) ||
                (x > w + 50 && px > w + 50) ||
                (y < -50 && py < -50) ||
                (y > h + 50 && py > h + 50)
            ) {
                continue
            }

            const near = 1 - star.z / DEPTH
            const lineW = Math.max(0.8, near * (1.8 + warp * 0.12))
            const alpha = 0.35 + near * 0.65

            ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(x, y)
            ctx.strokeStyle = star.color
            ctx.globalAlpha = alpha
            ctx.lineWidth = lineW
            ctx.lineCap = "round"
            ctx.stroke()

            if (near > 0.45) {
                ctx.beginPath()
                ctx.arc(x, y, lineW * 0.9, 0, Math.PI * 2)
                ctx.fillStyle = star.color
                ctx.fill()
            }
        }

        ctx.globalAlpha = 1
        if (live) raf = requestAnimationFrame(tick)
    }

    resize()

    const ro =
        typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(resize)
            : null
    if (canvas.parentElement && ro) ro.observe(canvas.parentElement)

    const io =
        typeof IntersectionObserver !== "undefined"
            ? new IntersectionObserver(([entry]) => {
                  onScreen = entry ? entry.isIntersecting : true
                  wake()
              })
            : null
    if (io) io.observe(canvas)

    const onVisibility = () => wake()
    if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibility)
    }

    if (mqReduce) {
        onReduce()
        mqReduce.addEventListener("change", onReduce)
    }

    wake()

    return {
        setOptions(next: Partial<EngineOptions>) {
            const prevCount = options.starCount
            const prevColors = options.colors.join(",")
            options = { ...options, ...next }

            const nextCount = options.starCount
            const nextColors = options.colors.join(",")
            if (nextCount !== prevCount || nextColors !== prevColors) {
                stars = createStars(nextCount, options.colors)
            }
            bindScroll()
            wake()
        },
        destroy() {
            destroyed = true
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            if (ro) ro.disconnect()
            if (io) io.disconnect()
            unbindScroll()
            if (typeof document !== "undefined") {
                document.removeEventListener("visibilitychange", onVisibility)
            }
            if (mqReduce) {
                mqReduce.removeEventListener("change", onReduce)
            }
        },
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RadiantLines(props: RadiantLinesProps) {
    const {
        starCount = 420,
        displacement = 1,
        baseSpeed = 0.28,
        scrollSensitivity = 1,
        reverseDirection = false,
        backgroundColor = "#000000",
        palette = "radiant",
        colors = DEFAULT_COLORS,
        borderRadius = 0,
        style,
        className,
        children,
    } = props

    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const engineRef = React.useRef<ReturnType<
        typeof createRadiantLinesEngine
    > | null>(null)

    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false

    const resolvedColors = React.useMemo(
        () => resolvePalette(palette, colors),
        [palette, colors]
    )

    // Static Renderer: Draw single snapshot without requestAnimationFrame loop
    React.useEffect(() => {
        if (!isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return

        const render = () => {
            drawStaticSnapshot(canvas, {
                starCount,
                colors: resolvedColors,
                displacement,
                baseSpeed,
                scrollSensitivity,
                reverseDirection,
            })
        }

        render()

        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(render)
                : null
        if (canvas.parentElement && ro) {
            ro.observe(canvas.parentElement)
        }

        return () => {
            if (ro) ro.disconnect()
        }
    }, [
        isStatic,
        starCount,
        resolvedColors,
        displacement,
        baseSpeed,
        scrollSensitivity,
        reverseDirection,
    ])

    // Dynamic Live Engine: Full animation, spring physics & scroll warping
    React.useEffect(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return

        engineRef.current = createRadiantLinesEngine(canvas, {
            starCount,
            colors: resolvedColors,
            displacement,
            baseSpeed,
            scrollSensitivity,
            reverseDirection,
        })

        return () => {
            engineRef.current?.destroy()
            engineRef.current = null
        }
    }, [isStatic])

    // Dynamically update options without rebuilding the engine
    React.useEffect(() => {
        if (isStatic || !engineRef.current) return
        engineRef.current.setOptions({
            starCount,
            colors: resolvedColors,
            displacement,
            baseSpeed,
            scrollSensitivity,
            reverseDirection,
        })
    }, [
        isStatic,
        starCount,
        resolvedColors,
        displacement,
        baseSpeed,
        scrollSensitivity,
        reverseDirection,
    ])

    return (
        <div
            className={className}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                borderRadius,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
            {children}
        </div>
    )
}

export { RadiantLines }

RadiantLines.defaultProps = {
    starCount: 420,
    displacement: 1,
    baseSpeed: 0.28,
    scrollSensitivity: 1,
    reverseDirection: false,
    backgroundColor: "#000000",
    palette: "radiant",
    colors: DEFAULT_COLORS,
    borderRadius: 0,
}

// ─── Property Controls ───────────────────────────────────────────────────────

// @ts-ignore
addPropertyControls(RadiantLines, {
    starCount: {
        type: ControlType.Number,
        title: "Star Count",
        min: 50,
        max: 1000,
        step: 10,
        defaultValue: 420,
        displayStepper: true,
        description: "Number of radiant star streaks",
    },
    displacement: {
        type: ControlType.Number,
        title: "Displacement",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        displayStepper: true,
        description: "Travel distance and tail streak multiplier",
    },
    baseSpeed: {
        type: ControlType.Number,
        title: "Base Speed",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.28,
        displayStepper: true,
        description: "Idle drift speed when resting",
    },
    scrollSensitivity: {
        type: ControlType.Number,
        title: "Scroll Warp",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        displayStepper: true,
        description: "Sensitivity to scroll velocity (0 disables scroll boost)",
    },
    reverseDirection: {
        type: ControlType.Boolean,
        title: "Reverse Dir",
        defaultValue: false,
        description: "Flip travel direction (inward vs outward)",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    palette: {
        type: ControlType.Enum,
        title: "Palette",
        options: [
            "radiant",
            "cyberpunk",
            "neon",
            "monochrome",
            "matrix",
            "custom",
        ],
        optionTitles: [
            "Radiant Rainbow",
            "Cyberpunk",
            "Neon Sunset",
            "Monochrome",
            "Matrix Green",
            "Custom",
        ],
        defaultValue: "radiant",
    },
    colors: {
        type: ControlType.Array,
        title: "Custom Colors",
        control: {
            type: ControlType.Color,
        },
        defaultValue: DEFAULT_COLORS,
        hidden: (props: any) => props.palette !== "custom",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
    },
    credits: {
        type: ControlType.Link,
        title: "Made by Wael",
        defaultValue: "https://x.com/Waeldesignz",
        description: "Made by [Wael](https://x.com/Waeldesignz)",
    },
})
