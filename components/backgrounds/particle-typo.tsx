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


type InteractionMode = "cursor" | "auto" | "none"

type Props = {
    text: string
    textColor: string
    particleColor: string
    lineColor: string
    background: string
    backgroundEdge: string
    transparent: boolean
    fontFamily: string
    fontWeight: number
    fontSize: number
    density: number
    minRadius: number
    maxRadius: number
    lineDistance: number
    lineOpacity: number
    lineWidth: number
    maxLinks: number
    attraction: number
    friction: number
    cursorForce: number
    pressBoost: number
    interaction: InteractionMode
    autoSpeed: number
    pixelRatio: number
    style?: React.CSSProperties
}

type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    goalX: number
    goalY: number
    radius: number
}

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))

function hexToRgba(color: string, alpha: number) {
    if (!color.startsWith("#")) return color
    let hex = color.slice(1)
    if (hex.length === 3)
        hex = hex
            .split("")
            .map((c) => c + c)
            .join("")
    const value = Number.parseInt(hex.slice(0, 6), 16)
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

/**
 * Interactive particle typography for Framer.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ParticleTypo(props: Props) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const hostRef = React.useRef<HTMLDivElement>(null)
    const propsRef = React.useRef(props)
    const isStaticRenderer = useIsStaticRenderer()
    propsRef.current = props

    React.useEffect(() => {
        const canvas = canvasRef.current
        const host = hostRef.current
        if (!canvas || !host) return

        const context = canvas.getContext("2d", { alpha: true })
        if (!context) return

        let frame = 0
        let running = false
        let inViewport = false
        let pageVisible = !document.hidden
        let width = 1
        let height = 1
        let resolvedFontSize = 1
        let bufferWidth = 0
        let bufferHeight = 0
        let particles: Particle[] = []
        let pointer = { x: -10000, y: -10000, inside: false, down: false }
        let autoPhase = 0
        let rebuildQueued = true

        const rebuild = () => {
            const p = propsRef.current
            const sample = document.createElement("canvas")
            sample.width = Math.max(1, Math.floor(width))
            sample.height = Math.max(1, Math.floor(height))
            const sampleContext = sample.getContext("2d", {
                willReadFrequently: true,
            })
            if (!sampleContext) return

            const size = p.fontSize > 0 ? p.fontSize : resolvedFontSize
            sampleContext.font = `${p.fontWeight} ${size}px ${p.fontFamily || "Arial, sans-serif"}`
            sampleContext.textAlign = "center"
            sampleContext.textBaseline = "middle"
            sampleContext.fillStyle = p.textColor
            sampleContext.fillText(p.text || " ", width / 2, height / 2)

            const pixels = sampleContext.getImageData(
                0,
                0,
                sample.width,
                sample.height
            ).data
            const step = Math.max(4, Math.round(p.density))
            const next: Particle[] = []
            let seed = 2166136261
            const random = () => {
                seed ^= seed << 13
                seed ^= seed >>> 17
                seed ^= seed << 5
                return (seed >>> 0) / 4294967295
            }

            for (let y = 0; y < sample.height; y += step) {
                for (let x = 0; x < sample.width; x += step) {
                    if (pixels[(y * sample.width + x) * 4 + 3] > 80) {
                        next.push({
                            x: width / 2 + (random() - 0.5) * 12,
                            y: height / 2 + (random() - 0.5) * 12,
                            vx: 0,
                            vy: 0,
                            goalX: x,
                            goalY: y,
                            radius:
                                p.minRadius +
                                random() *
                                    Math.max(0, p.maxRadius - p.minRadius),
                        })
                    }
                }
            }
            particles = next.slice(0, 3500)
            rebuildQueued = false
        }

        const resize = () => {
            const rect = host.getBoundingClientRect()
            const nextWidth = Math.max(1, rect.width)
            const nextHeight = Math.max(1, rect.height)
            const dpr = clamp(
                window.devicePixelRatio || 1,
                1,
                propsRef.current.pixelRatio
            )
            const nextBufferWidth = Math.round(nextWidth * dpr)
            const nextBufferHeight = Math.round(nextHeight * dpr)

            // ResizeObserver can report the same fractional dimensions more
            // than once in Framer. Avoid reallocating the canvas buffer and
            // rebuilding particles unless something materially changed.
            if (
                nextBufferWidth === bufferWidth &&
                nextBufferHeight === bufferHeight
            )
                return

            width = nextWidth
            height = nextHeight
            bufferWidth = nextBufferWidth
            bufferHeight = nextBufferHeight
            resolvedFontSize = Math.min(
                width / Math.max(propsRef.current.text.length * 0.62, 2),
                height * 0.42
            )

            canvas.width = bufferWidth
            canvas.height = bufferHeight
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            context.setTransform(dpr, 0, 0, dpr, 0, 0)
            rebuildQueued = true
        }

        const observer = new ResizeObserver(resize)
        observer.observe(host)
        resize()

        const localPoint = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            pointer.x = event.clientX - rect.left
            pointer.y = event.clientY - rect.top
        }
        const onMove = (event: PointerEvent) => {
            localPoint(event)
            pointer.inside = true
        }
        const onEnter = (event: PointerEvent) => {
            localPoint(event)
            pointer.inside = true
        }
        const onLeave = () => {
            pointer.inside = false
            pointer.down = false
        }
        const onDown = (event: PointerEvent) => {
            localPoint(event)
            pointer.down = true
            canvas.setPointerCapture?.(event.pointerId)
        }
        const onUp = () => (pointer.down = false)

        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("pointerenter", onEnter)
        canvas.addEventListener("pointerleave", onLeave)
        canvas.addEventListener("pointerdown", onDown)
        canvas.addEventListener("pointerup", onUp)
        canvas.addEventListener("pointercancel", onUp)

        const draw = () => {
            if (!running) return
            const p = propsRef.current
            if (rebuildQueued) rebuild()
            context.clearRect(0, 0, width, height)

            if (p.interaction === "auto") {
                autoPhase += p.autoSpeed * 0.012
                pointer.x = width / 2 + Math.sin(autoPhase) * width * 0.32
                pointer.y =
                    height / 2 + Math.cos(autoPhase * 0.73) * height * 0.12
                pointer.inside = true
            }

            const active = p.interaction !== "none" && pointer.inside
            const force = p.cursorForce * (pointer.down ? p.pressBoost : 1)

            for (const node of particles) {
                if (active) {
                    const dx = node.x - pointer.x
                    const dy = node.y - pointer.y
                    const distanceSq = Math.max(100, dx * dx + dy * dy)
                    const magnitude = force / distanceSq
                    node.vx += dx * magnitude
                    node.vy += dy * magnitude
                }
                node.vx += (node.goalX - node.x) * p.attraction
                node.vy += (node.goalY - node.y) * p.attraction
                node.vx *= p.friction
                node.vy *= p.friction
                node.x += node.vx
                node.y += node.vy
            }

            if (p.lineDistance > 0 && p.lineOpacity > 0 && p.lineWidth > 0) {
                context.lineWidth = p.lineWidth
                context.lineCap = "round"

                // Spatial buckets keep the web genuinely local in every
                // direction. Array order is row-based and would create rails.
                const cellSize = Math.max(1, p.lineDistance)
                const buckets = new Map<string, number[]>()
                for (let i = 0; i < particles.length; i++) {
                    const node = particles[i]
                    const key = `${Math.floor(node.x / cellSize)},${Math.floor(node.y / cellSize)}`
                    const bucket = buckets.get(key)
                    if (bucket) bucket.push(i)
                    else buckets.set(key, [i])
                }

                const maximumLinks = Math.max(1, Math.round(p.maxLinks))
                for (let i = 0; i < particles.length; i++) {
                    const a = particles[i]
                    const cellX = Math.floor(a.x / cellSize)
                    const cellY = Math.floor(a.y / cellSize)
                    const candidates: { index: number; distance: number }[] = []

                    for (let offsetY = -1; offsetY <= 1; offsetY++) {
                        for (let offsetX = -1; offsetX <= 1; offsetX++) {
                            const bucket = buckets.get(
                                `${cellX + offsetX},${cellY + offsetY}`
                            )
                            if (!bucket) continue
                            for (const j of bucket) {
                                if (j <= i) continue
                                const b = particles[j]
                                const dx = a.x - b.x
                                const dy = a.y - b.y
                                const distance = Math.sqrt(dx * dx + dy * dy)
                                if (distance < p.lineDistance)
                                    candidates.push({ index: j, distance })
                            }
                        }
                    }

                    candidates.sort(
                        (left, right) => left.distance - right.distance
                    )
                    for (const candidate of candidates.slice(0, maximumLinks)) {
                        const b = particles[candidate.index]
                        context.strokeStyle = hexToRgba(
                            p.lineColor,
                            p.lineOpacity *
                                (1 - candidate.distance / p.lineDistance)
                        )
                        context.beginPath()
                        context.moveTo(a.x, a.y)
                        context.lineTo(b.x, b.y)
                        context.stroke()
                    }
                }
            }

            context.fillStyle = p.particleColor
            for (const node of particles) {
                context.beginPath()
                context.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
                context.fill()
            }
            frame = requestAnimationFrame(draw)
        }

        const startAnimation = () => {
            if (running || !inViewport || !pageVisible) return
            running = true
            frame = requestAnimationFrame(draw)
        }

        const stopAnimation = () => {
            running = false
            if (frame) {
                cancelAnimationFrame(frame)
                frame = 0
            }
        }

        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                inViewport = entry.isIntersecting
                if (inViewport) startAnimation()
                else stopAnimation()
            },
            { threshold: 0.01 }
        )

        const onVisibilityChange = () => {
            pageVisible = !document.hidden
            if (pageVisible) startAnimation()
            else stopAnimation()
        }

        visibilityObserver.observe(host)
        document.addEventListener("visibilitychange", onVisibilityChange)

        return () => {
            stopAnimation()
            visibilityObserver.unobserve(host)
            visibilityObserver.disconnect()
            document.removeEventListener("visibilitychange", onVisibilityChange)
            observer.unobserve(host)
            observer.disconnect()
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerenter", onEnter)
            canvas.removeEventListener("pointerleave", onLeave)
            canvas.removeEventListener("pointerdown", onDown)
            canvas.removeEventListener("pointerup", onUp)
            canvas.removeEventListener("pointercancel", onUp)
        }
    }, [
        props.text,
        props.textColor,
        props.fontFamily,
        props.fontWeight,
        props.fontSize,
        props.density,
        props.minRadius,
        props.maxRadius,
        props.pixelRatio,
        isStaticRenderer,
    ])

    const background = props.transparent
        ? "transparent"
        : `radial-gradient(circle at 50% 45%, ${props.background}, ${props.backgroundEdge})`

    // Framer's Canvas and export renderer need a synchronous DOM fallback.
    // Effects, ResizeObserver and canvas drawing are intentionally skipped.
    if (isStaticRenderer) {
        return (
            <div
                style={{
                    ...props.style,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background,
                    color: props.particleColor,
                    fontFamily: props.fontFamily,
                    fontWeight: props.fontWeight,
                    fontSize:
                        props.fontSize > 0
                            ? props.fontSize
                            : "clamp(32px, 14vw, 220px)",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                }}
                aria-label={`Particle text: ${props.text}`}
            >
                {props.text}
            </div>
        )
    }

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    return (
        <div
            ref={hostRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-label={`Particle text: ${props.text}`}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    touchAction: "none",
                    pointerEvents: isCanvas ? "none" : "auto",
                }}
            />
        </div>
    )
}

ParticleTypo.defaultProps = {
    text: "hello",
    textColor: "#FFFFFF",
    particleColor: "#080808",
    lineColor: "#080808",
    background: "#2BB0CC",
    backgroundEdge: "#0079A5",
    transparent: false,
    fontFamily: "Arial, sans-serif",
    fontWeight: 700,
    fontSize: 0,
    density: 12,
    minRadius: 2,
    maxRadius: 7,
    lineDistance: 48,
    lineOpacity: 0.55,
    lineWidth: 0.6,
    maxLinks: 5,
    attraction: 0.1,
    friction: 0.7,
    cursorForce: 1100,
    pressBoost: 2.5,
    interaction: "cursor",
    autoSpeed: 1,
    pixelRatio: 2,
}

addPropertyControls(ParticleTypo, {
    text: { type: ControlType.String, title: "Text", defaultValue: "hello" },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Arial, sans-serif",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: 700,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        min: 0,
        max: 500,
        step: 1,
        defaultValue: 0,
        description: "0 = Auto",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Mask",
        defaultValue: "#FFFFFF",
        description: "Used to generate the particle shape.",
    },
    particleColor: {
        type: ControlType.Color,
        title: "Particles",
        defaultValue: "#080808",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Lines",
        defaultValue: "#080808",
    },
    transparent: {
        type: ControlType.Boolean,
        title: "Background",
        enabledTitle: "Clear",
        disabledTitle: "Gradient",
        defaultValue: false,
    },
    background: {
        type: ControlType.Color,
        title: "Center",
        defaultValue: "#2BB0CC",
        hidden: (p) => p.transparent,
    },
    backgroundEdge: {
        type: ControlType.Color,
        title: "Edge",
        defaultValue: "#0079A5",
        hidden: (p) => p.transparent,
    },
    interaction: {
        type: ControlType.Enum,
        title: "Motion",
        options: ["cursor", "auto", "none"],
        optionTitles: ["Cursor", "Auto", "None"],
        displaySegmentedControl: true,
        defaultValue: "cursor",
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        hidden: (p) => p.interaction !== "auto",
    },
    cursorForce: {
        type: ControlType.Number,
        title: "Force",
        min: 0,
        max: 5000,
        step: 50,
        defaultValue: 1100,
        hidden: (p) => p.interaction === "none",
    },
    pressBoost: {
        type: ControlType.Number,
        title: "Press",
        min: 1,
        max: 8,
        step: 0.1,
        defaultValue: 2.5,
        hidden: (p) => p.interaction !== "cursor",
    },
    density: {
        type: ControlType.Number,
        title: "Spacing",
        min: 5,
        max: 30,
        step: 1,
        defaultValue: 12,
    },
    minRadius: {
        type: ControlType.Number,
        title: "Dot Min",
        min: 0.5,
        max: 12,
        step: 0.5,
        defaultValue: 2,
    },
    maxRadius: {
        type: ControlType.Number,
        title: "Dot Max",
        min: 1,
        max: 20,
        step: 0.5,
        defaultValue: 7,
    },
    lineDistance: {
        type: ControlType.Number,
        title: "Link Range",
        min: 0,
        max: 150,
        step: 1,
        defaultValue: 48,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Thread Width",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 0.6,
    },
    lineOpacity: {
        type: ControlType.Number,
        title: "Link Alpha",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
    },
    maxLinks: {
        type: ControlType.Number,
        title: "Web Links",
        min: 1,
        max: 12,
        step: 1,
        defaultValue: 5,
    },
    attraction: {
        type: ControlType.Number,
        title: "Return",
        min: 0.01,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.1,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        min: 0.3,
        max: 0.95,
        step: 0.01,
        defaultValue: 0.7,
    },
    pixelRatio: {
        type: ControlType.Number,
        title: "Quality",
        min: 1,
        max: 3,
        step: 0.5,
        defaultValue: 2,
    },
})
