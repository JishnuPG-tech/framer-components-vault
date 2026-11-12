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


type Palette = {
    background: string
    colorA: string
    colorB: string
    colorC: string
    colorD: string
    foreground: string
    line: string
}

type FieldSettings = {
    intensity: number
    spread: number
    contrast: number
    ribbonCount: number
    glowCount: number
    seed: number
}

type MotionSettings = {
    enabled: boolean
    speed: number
    drift: number
    pointer: boolean
    pointerStrength: number
    fps: 30 | 60
    staticPhase: number
}

type TextureSettings = {
    grain: number
    grid: boolean
    gridSize: number
    vignette: number
}

type LayoutSettings = {
    radius: number
    padding: number
    compactAt: number
}

type ChromeSettings = {
    show: boolean
    label: string
    caption: string
    index: string
}

export interface HalationFieldProps {
    palette: Palette
    field: FieldSettings
    motion: MotionSettings
    texture: TextureSettings
    layout: LayoutSettings
    chrome: ChromeSettings
    metaFont: React.CSSProperties
    decorative: boolean
    ariaLabel: string
    style?: React.CSSProperties
}

const defaults: HalationFieldProps = {
    palette: {
        background: "#07070B",
        colorA: "#FF593D",
        colorB: "#8B5CFF",
        colorC: "#DFFF58",
        colorD: "#2ED9FF",
        foreground: "#F4F1EA",
        line: "rgba(244, 241, 234, 0.22)",
    },
    field: {
        intensity: 92,
        spread: 76,
        contrast: 112,
        ribbonCount: 5,
        glowCount: 7,
        seed: 14,
    },
    motion: {
        enabled: true,
        speed: 34,
        drift: 46,
        pointer: true,
        pointerStrength: 28,
        fps: 60,
        staticPhase: 38,
    },
    texture: {
        grain: 20,
        grid: true,
        gridSize: 54,
        vignette: 52,
    },
    layout: {
        radius: 28,
        padding: 26,
        compactAt: 560,
    },
    chrome: {
        show: true,
        label: "HALATION / FIELD",
        caption: "GENERATIVE LIGHT STUDY",
        index: "HF—03",
    },
    metaFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 600,
    },
    decorative: true,
    ariaLabel: "Animated abstract light field",
}

type Point = { x: number; y: number }

function clamp(value: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value))
}

function withAlpha(color: string, alpha: number) {
    const percentage = clamp(alpha) * 100
    return `color-mix(in srgb, ${color} ${percentage}%, transparent)`
}

function randomFactory(seed: number) {
    let value = Math.floor(seed * 1009) || 1
    return () => {
        value = (value * 16807) % 2147483647
        return (value - 1) / 2147483646
    }
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [])
    return reduced
}

/**
 * A generative, pointer-responsive light field for atmospheric Framer sections.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 */
export default function HalationField(rawProps: HalationFieldProps) {
    const props = {
        ...defaults,
        ...rawProps,
        palette: { ...defaults.palette, ...rawProps.palette },
        field: { ...defaults.field, ...rawProps.field },
        motion: { ...defaults.motion, ...rawProps.motion },
        texture: { ...defaults.texture, ...rawProps.texture },
        layout: { ...defaults.layout, ...rawProps.layout },
        chrome: { ...defaults.chrome, ...rawProps.chrome },
    }
    const {
        palette,
        field,
        motion,
        texture,
        layout,
        chrome,
        metaFont,
        decorative,
        ariaLabel,
        style,
    } = props
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const frameRef = React.useRef<number | null>(null)
    const pointerRef = React.useRef<Point>({ x: 0.5, y: 0.5 })
    const pointerTargetRef = React.useRef<Point>({ x: 0.5, y: 0.5 })
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    React.useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root) return
        const context = canvas.getContext("2d", { alpha: false })
        if (!context) return

        const colors = [
            palette.colorA,
            palette.colorB,
            palette.colorC,
            palette.colorD,
        ]
        const rand = randomFactory(field.seed)
        const glows = Array.from(
            { length: Math.max(1, Math.round(field.glowCount)) },
            (_, i) => ({
                x: 0.08 + rand() * 0.84,
                y: 0.08 + rand() * 0.84,
                radius: 0.22 + rand() * 0.25,
                phase: rand() * Math.PI * 2,
                speed: 0.45 + rand() * 0.7,
                color: colors[i % colors.length],
            })
        )
        const ribbons = Array.from(
            { length: Math.max(1, Math.round(field.ribbonCount)) },
            (_, i) => ({
                offset: rand(),
                phase: rand() * Math.PI * 2,
                amplitude: 0.1 + rand() * 0.18,
                width: 0.015 + rand() * 0.035,
                color: colors[(i + 1) % colors.length],
            })
        )

        let width = 1
        let height = 1
        let lastFrame = 0
        const resize = () => {
            const rect = root.getBoundingClientRect()
            width = Math.max(1, rect.width)
            height = Math.max(1, rect.height)
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.max(1, Math.round(width * dpr))
            canvas.height = Math.max(1, Math.round(height * dpr))
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            context.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        const draw = (timeSeconds: number) => {
            context.globalCompositeOperation = "source-over"
            context.filter = "none"
            context.fillStyle = palette.background
            context.fillRect(0, 0, width, height)

            const pointer = pointerRef.current
            const drift = field.spread / 100
            const motionAmount = motion.drift / 100
            const pointerAmount = motion.pointerStrength / 100
            const minSize = Math.min(width, height)

            context.globalCompositeOperation = "screen"
            for (const glow of glows) {
                const waveX = Math.sin(timeSeconds * glow.speed + glow.phase)
                const waveY = Math.cos(
                    timeSeconds * glow.speed * 0.73 + glow.phase
                )
                const baseX = glow.x + waveX * 0.13 * motionAmount
                const baseY = glow.y + waveY * 0.11 * motionAmount
                const x =
                    (baseX +
                        (pointer.x - 0.5) * pointerAmount * (glow.x - 0.5)) *
                    width
                const y =
                    (baseY +
                        (pointer.y - 0.5) * pointerAmount * (glow.y - 0.5)) *
                    height
                const radius = minSize * glow.radius * (0.72 + drift * 0.72)
                const gradient = context.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    radius
                )
                const alpha = clamp(field.intensity / 100) * 0.82
                gradient.addColorStop(0, withAlpha(glow.color, alpha))
                gradient.addColorStop(0.28, withAlpha(glow.color, alpha * 0.64))
                gradient.addColorStop(0.72, withAlpha(glow.color, alpha * 0.16))
                gradient.addColorStop(1, withAlpha(glow.color, 0))
                context.fillStyle = gradient
                context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
            }

            context.globalCompositeOperation = "lighter"
            context.lineCap = "round"
            for (const ribbon of ribbons) {
                const baseY = ribbon.offset * height
                const amplitude =
                    height * ribbon.amplitude * (0.7 + drift * 0.5)
                const sway = Math.sin(timeSeconds * 0.54 + ribbon.phase)
                const pointerShift =
                    (pointer.y - 0.5) * height * pointerAmount * 0.4
                const gradient = context.createLinearGradient(
                    0,
                    0,
                    width,
                    height
                )
                gradient.addColorStop(0, withAlpha(ribbon.color, 0))
                gradient.addColorStop(
                    0.28,
                    withAlpha(ribbon.color, (0.22 * field.intensity) / 100)
                )
                gradient.addColorStop(
                    0.64,
                    withAlpha(ribbon.color, (0.58 * field.intensity) / 100)
                )
                gradient.addColorStop(1, withAlpha(ribbon.color, 0))
                context.beginPath()
                context.moveTo(
                    -width * 0.1,
                    baseY + amplitude * sway + pointerShift
                )
                context.bezierCurveTo(
                    width * 0.24,
                    baseY - amplitude * (1 + sway),
                    width * 0.68,
                    baseY + amplitude * (1.2 - sway),
                    width * 1.1,
                    baseY - amplitude * sway
                )
                context.strokeStyle = gradient
                context.lineWidth = Math.max(8, minSize * ribbon.width)
                context.shadowColor = ribbon.color
                context.shadowBlur = Math.min(44, minSize * 0.035)
                context.stroke()
            }

            context.shadowBlur = 0
            context.globalCompositeOperation = "source-over"
            if (field.contrast !== 100) {
                context.globalCompositeOperation =
                    field.contrast > 100 ? "overlay" : "source-over"
                context.fillStyle =
                    field.contrast > 100
                        ? `rgba(7, 7, 11, ${clamp((field.contrast - 100) / 140)})`
                        : `rgba(255, 255, 255, ${clamp((100 - field.contrast) / 300)})`
                context.fillRect(0, 0, width, height)
            }
        }

        resize()
        const observer = new ResizeObserver(() => {
            resize()
            draw((motion.staticPhase / 100) * Math.PI * 2)
        })
        observer.observe(root)

        const staticTime = (motion.staticPhase / 100) * Math.PI * 2
        const shouldAnimate =
            motion.enabled && !staticRenderer && !reducedMotion
        if (!shouldAnimate) {
            draw(staticTime)
        } else {
            const frameInterval = 1000 / motion.fps
            const start = performance.now()
            const tick = (now: number) => {
                if (now - lastFrame >= frameInterval) {
                    lastFrame = now
                    pointerRef.current.x +=
                        (pointerTargetRef.current.x - pointerRef.current.x) *
                        0.055
                    pointerRef.current.y +=
                        (pointerTargetRef.current.y - pointerRef.current.y) *
                        0.055
                    draw(((now - start) / 1000) * (motion.speed / 100))
                }
                frameRef.current = requestAnimationFrame(tick)
            }
            frameRef.current = requestAnimationFrame(tick)
        }

        return () => {
            observer.disconnect()
            if (frameRef.current !== null)
                cancelAnimationFrame(frameRef.current)
        }
    }, [
        field.contrast,
        field.glowCount,
        field.intensity,
        field.ribbonCount,
        field.seed,
        field.spread,
        motion.drift,
        motion.enabled,
        motion.fps,
        motion.pointerStrength,
        motion.speed,
        motion.staticPhase,
        palette.background,
        palette.colorA,
        palette.colorB,
        palette.colorC,
        palette.colorD,
        reducedMotion,
        staticRenderer,
    ])

    const onPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!motion.pointer || staticRenderer || reducedMotion) return
            const rect = event.currentTarget.getBoundingClientRect()
            pointerTargetRef.current = {
                x: clamp((event.clientX - rect.left) / Math.max(1, rect.width)),
                y: clamp((event.clientY - rect.top) / Math.max(1, rect.height)),
            }
        },
        [motion.pointer, reducedMotion, staticRenderer]
    )

    const onPointerLeave = React.useCallback(() => {
        pointerTargetRef.current = { x: 0.5, y: 0.5 }
    }, [])

    const fallback = `
        radial-gradient(circle at 72% 30%, ${withAlpha(palette.colorC, 0.8)}, transparent 26%),
        radial-gradient(circle at 24% 72%, ${withAlpha(palette.colorA, 0.82)}, transparent 34%),
        radial-gradient(circle at 56% 64%, ${withAlpha(palette.colorB, 0.75)}, transparent 38%),
        ${palette.background}
    `
    const css = `
        .halation-root, .halation-root * { box-sizing: border-box; }
        .halation-root {
            container-type: size;
            position: relative;
            width: 100%;
            height: 100%;
            min-width: 220px;
            min-height: 220px;
            overflow: hidden;
            isolation: isolate;
            border-radius: ${layout.radius}px;
            background: ${fallback};
            color: ${palette.foreground};
        }
        .halation-canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
        .halation-grid, .halation-vignette, .halation-grain { position: absolute; inset: 0; pointer-events: none; }
        .halation-grid {
            opacity: ${texture.grid ? 0.19 : 0};
            background-image: linear-gradient(${palette.line} 1px, transparent 1px), linear-gradient(90deg, ${palette.line} 1px, transparent 1px);
            background-size: ${texture.gridSize}px ${texture.gridSize}px;
            mask-image: linear-gradient(to bottom, transparent, black 18%, black 78%, transparent);
        }
        .halation-vignette { background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${texture.vignette / 100}) 122%); }
        .halation-grain {
            opacity: ${texture.grain / 100};
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.32'/%3E%3C/svg%3E");
            mix-blend-mode: soft-light;
        }
        .halation-frame { position: absolute; inset: ${layout.padding}px; z-index: 5; border: 1px solid ${palette.line}; border-radius: max(0px, ${layout.radius - layout.padding / 2}px); pointer-events: none; }
        .halation-meta {
            position: absolute;
            z-index: 6;
            left: ${layout.padding}px;
            right: ${layout.padding}px;
            bottom: ${layout.padding}px;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
            padding: 0 16px 14px;
            font-size: clamp(9px, 1.05cqw, 13px);
            line-height: 1.25;
            letter-spacing: .14em;
            text-transform: uppercase;
            text-shadow: 0 1px 14px rgba(0,0,0,.6);
            pointer-events: none;
        }
        .halation-caption { opacity: .62; margin-top: 7px; }
        .halation-index { padding: 9px 11px; border: 1px solid ${palette.line}; border-radius: 999px; backdrop-filter: blur(10px); }
        @container (max-width: ${layout.compactAt}px) {
            .halation-frame { inset: ${Math.max(14, layout.padding * 0.7)}px; }
            .halation-meta { left: ${Math.max(14, layout.padding * 0.7)}px; right: ${Math.max(14, layout.padding * 0.7)}px; bottom: ${Math.max(14, layout.padding * 0.7)}px; padding: 0 12px 12px; }
            .halation-caption { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .halation-root * { animation: none !important; transition: none !important; } }
    `

    return (
        <div
            ref={rootRef}
            className="halation-root"
            style={style}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            aria-hidden={decorative ? true : undefined}
            role={decorative ? undefined : "img"}
            aria-label={decorative ? undefined : ariaLabel}
        >
            <style>{css}</style>
            <canvas
                ref={canvasRef}
                className="halation-canvas"
                aria-hidden="true"
            />
            <div className="halation-grid" />
            <div className="halation-vignette" />
            <div className="halation-grain" />
            {chrome.show ? (
                <>
                    <div className="halation-frame" />
                    <div className="halation-meta" style={metaFont}>
                        <div>
                            <div>{chrome.label}</div>
                            <div className="halation-caption">
                                {chrome.caption}
                            </div>
                        </div>
                        <div className="halation-index">{chrome.index}</div>
                    </div>
                </>
            ) : null}
        </div>
    )
}

HalationField.defaultProps = defaults

addPropertyControls(HalationField, {
    palette: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: { type: ControlType.Color, defaultValue: "#07070B" },
            colorA: {
                type: ControlType.Color,
                title: "Coral",
                defaultValue: "#FF593D",
            },
            colorB: {
                type: ControlType.Color,
                title: "Violet",
                defaultValue: "#8B5CFF",
            },
            colorC: {
                type: ControlType.Color,
                title: "Acid",
                defaultValue: "#DFFF58",
            },
            colorD: {
                type: ControlType.Color,
                title: "Cyan",
                defaultValue: "#2ED9FF",
            },
            foreground: { type: ControlType.Color, defaultValue: "#F4F1EA" },
            line: {
                type: ControlType.Color,
                defaultValue: "rgba(244, 241, 234, 0.22)",
            },
        },
    },
    field: {
        type: ControlType.Object,
        title: "Field",
        controls: {
            intensity: {
                type: ControlType.Number,
                min: 10,
                max: 140,
                step: 1,
                unit: "%",
                defaultValue: 92,
            },
            spread: {
                type: ControlType.Number,
                min: 10,
                max: 140,
                step: 1,
                unit: "%",
                defaultValue: 76,
            },
            contrast: {
                type: ControlType.Number,
                min: 40,
                max: 180,
                step: 1,
                unit: "%",
                defaultValue: 112,
            },
            ribbonCount: {
                type: ControlType.Number,
                min: 1,
                max: 10,
                step: 1,
                displayStepper: true,
                defaultValue: 5,
            },
            glowCount: {
                type: ControlType.Number,
                min: 2,
                max: 12,
                step: 1,
                displayStepper: true,
                defaultValue: 7,
            },
            seed: {
                type: ControlType.Number,
                min: 1,
                max: 99,
                step: 1,
                displayStepper: true,
                defaultValue: 14,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            enabled: { type: ControlType.Boolean, defaultValue: true },
            speed: {
                type: ControlType.Number,
                min: 5,
                max: 150,
                step: 1,
                unit: "%",
                defaultValue: 34,
            },
            drift: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 46,
            },
            pointer: { type: ControlType.Boolean, defaultValue: true },
            pointerStrength: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 28,
            },
            fps: {
                type: ControlType.Enum,
                options: [30, 60],
                optionTitles: ["30 FPS", "60 FPS"],
                defaultValue: 60,
                displaySegmentedControl: true,
            },
            staticPhase: {
                type: ControlType.Number,
                title: "Canvas Frame",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 38,
            },
        },
    },
    texture: {
        type: ControlType.Object,
        title: "Texture",
        controls: {
            grain: {
                type: ControlType.Number,
                min: 0,
                max: 60,
                step: 1,
                unit: "%",
                defaultValue: 20,
            },
            grid: { type: ControlType.Boolean, defaultValue: true },
            gridSize: {
                type: ControlType.Number,
                min: 18,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 54,
            },
            vignette: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 52,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            radius: {
                type: ControlType.Number,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 28,
            },
            padding: {
                type: ControlType.Number,
                min: 8,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 26,
            },
            compactAt: {
                type: ControlType.Number,
                min: 320,
                max: 900,
                step: 10,
                unit: "px",
                defaultValue: 560,
            },
        },
    },
    chrome: {
        type: ControlType.Object,
        title: "Chrome",
        controls: {
            show: { type: ControlType.Boolean, defaultValue: true },
            label: {
                type: ControlType.String,
                defaultValue: "HALATION / FIELD",
            },
            caption: {
                type: ControlType.String,
                defaultValue: "GENERATIVE LIGHT STUDY",
            },
            index: { type: ControlType.String, defaultValue: "HF—03" },
        },
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    decorative: {
        type: ControlType.Boolean,
        title: "Decorative",
        defaultValue: true,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: defaults.ariaLabel,
        hidden: (p: Partial<HalationFieldProps>) => p.decorative === true,
    },
})
