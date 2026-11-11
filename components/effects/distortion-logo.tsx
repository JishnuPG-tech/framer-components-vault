// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, type CSSProperties } from "react"

interface DistortionLogoProps {
    source: "text" | "svg"
    text: string
    font: CSSProperties & { fontFamily?: string }
    sizing: "fixed" | "fit"
    fitScale: number
    svgFile?: string
    svgScale: number
    color: string
    backgroundColor: string
    dotSize: number
    spacing: number
    interactionRadius: number
    forceStrength: number
    mode: "repel" | "attract"
    gravity: number
    returnSpeed: number
    damping: number
    clickBurst: boolean
    burstStrength: number
    style?: CSSProperties
}

/**
 * Distortion Logo
 *
 * Turns any text or SVG into a living particle logo. Dots rest perfectly
 * still until the cursor disturbs them, then spring back with configurable
 * physics — gravity, repel or attract modes, click bursts, and damping.
 * Includes full font controls and auto-fit sizing.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DistortionLogo(props: DistortionLogoProps) {
    const {
        source = "text",
        text = "LOGO",
        font = {},
        sizing = "fixed",
        fitScale = 90,
        svgFile,
        svgScale = 80,
        color = "#A5A6F6",
        backgroundColor = "#000000",
        dotSize = 2.2,
        spacing = 6,
        interactionRadius = 90,
        forceStrength = 1.5,
        mode = "repel",
        gravity = 0.2,
        returnSpeed = 0.08,
        damping = 0.88,
        clickBurst = true,
        burstStrength = 12,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const fontKey = JSON.stringify(font)

    useEffect(() => {
        const canvasEl = canvasRef.current
        const containerEl = containerRef.current
        if (!canvasEl || !containerEl) return
        const maybeCtx = canvasEl.getContext("2d")
        if (!maybeCtx) return
        const canvas: HTMLCanvasElement = canvasEl
        const container: HTMLDivElement = containerEl
        const ctx: CanvasRenderingContext2D = maybeCtx

        let W = 0
        let H = 0
        let dpr = 1
        let particles: {
            hx: number
            hy: number
            x: number
            y: number
            vx: number
            vy: number
        }[] = []
        let animationFrame = 0
        let cancelled = false
        let svgImage: HTMLImageElement | null = null
        const mouse = { x: -99999, y: -99999 }

        function parsePx(value: unknown, fallback: number): number {
            if (typeof value === "number") return value
            if (typeof value === "string") {
                const n = parseFloat(value)
                if (!Number.isNaN(n)) return n
            }
            return fallback
        }

        function drawTextSource(octx: CanvasRenderingContext2D) {
            const weight = font.fontWeight || 700
            const fontStyle = font.fontStyle || "normal"
            const family = font.fontFamily || "sans-serif"
            octx.fillStyle = "#fff"
            const spacingValue = font.letterSpacing
            if (spacingValue !== undefined && "letterSpacing" in octx) {
                try {
                    ;(octx as any).letterSpacing =
                        typeof spacingValue === "number"
                            ? `${spacingValue}px`
                            : String(spacingValue)
                } catch {
                    // letterSpacing unsupported — skip
                }
            }

            let size = parsePx(font.fontSize, 120)
            if (sizing === "fit") {
                // Measure at a probe size, then scale so the text fills the frame
                const probe = 100
                octx.font = `${fontStyle} ${weight} ${probe}px ${family}`
                const metrics = octx.measureText(text)
                const textW = Math.max(metrics.width, 1)
                const ascent = metrics.actualBoundingBoxAscent
                const descent = metrics.actualBoundingBoxDescent
                const textH =
                    ascent !== undefined && descent !== undefined
                        ? Math.max(ascent + descent, 1)
                        : probe
                const targetW = (W * fitScale) / 100
                const targetH = (H * fitScale) / 100
                size = probe * Math.min(targetW / textW, targetH / textH)
            }

            octx.font = `${fontStyle} ${weight} ${size}px ${family}`
            octx.textAlign = "center"
            octx.textBaseline = "middle"
            octx.fillText(text, W / 2, H / 2)
        }

        function drawSvgSource(octx: CanvasRenderingContext2D) {
            if (!svgImage) return
            const iw = svgImage.naturalWidth || svgImage.width || 100
            const ih = svgImage.naturalHeight || svgImage.height || 100
            const maxW = (W * svgScale) / 100
            const maxH = (H * svgScale) / 100
            const scale = Math.min(maxW / iw, maxH / ih)
            const dw = iw * scale
            const dh = ih * scale
            octx.drawImage(svgImage, (W - dw) / 2, (H - dh) / 2, dw, dh)
        }

        function sampleSourcePoints(): { x: number; y: number }[] {
            const off = document.createElement("canvas")
            off.width = W
            off.height = H
            const octx = off.getContext("2d")
            if (!octx) return []

            if (source === "svg") {
                drawSvgSource(octx)
            } else {
                drawTextSource(octx)
            }

            let data: Uint8ClampedArray
            try {
                data = octx.getImageData(0, 0, W, H).data
            } catch {
                // Cross-origin taint — cannot sample
                return []
            }
            const pts: { x: number; y: number }[] = []
            const step = Math.max(2, spacing)
            for (let y = 0; y < H; y += step) {
                for (let x = 0; x < W; x += step) {
                    const alpha = data[(y * W + x) * 4 + 3]
                    if (alpha > 128) pts.push({ x, y })
                }
            }
            return pts
        }

        function buildParticles() {
            // No entrance effect: particles start at their home positions, at rest.
            particles = sampleSourcePoints().map((t) => ({
                hx: t.x,
                hy: t.y,
                x: t.x,
                y: t.y,
                vx: 0,
                vy: 0,
            }))
        }

        function renderFrame() {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, W, H)
            ctx.fillStyle = color
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]
                ctx.beginPath()
                ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        function physicsStep() {
            const radius = interactionRadius
            const dirSign = mode === "attract" ? -1 : 1
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]

                const dxHome = p.hx - p.x
                const dyHome = p.hy - p.y
                const distHome = Math.sqrt(dxHome * dxHome + dyHome * dyHome)
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)

                // Particle fully settled and cursor far away — keep it perfectly still.
                const dxm = p.x - mouse.x
                const dym = p.y - mouse.y
                const dm = Math.sqrt(dxm * dxm + dym * dym)
                const atRest = distHome < 0.1 && speed < 0.05
                if (atRest && dm >= radius) {
                    p.x = p.hx
                    p.y = p.hy
                    p.vx = 0
                    p.vy = 0
                    continue
                }

                // Spring back to home position
                p.vx += dxHome * returnSpeed
                p.vy += dyHome * returnSpeed

                // Gravity acts only on disturbed particles, so the resting logo stays exact
                if (!atRest) {
                    p.vy += gravity
                }

                // Cursor force
                if (dm < radius && dm > 0.0001) {
                    const force = ((radius - dm) / radius) * forceStrength
                    p.vx += (dxm / dm) * force * dirSign
                    p.vy += (dym / dm) * force * dirSign
                }

                p.vx *= damping
                p.vy *= damping
                p.x += p.vx
                p.y += p.vy
            }
        }

        function loop() {
            physicsStep()
            renderFrame()
            animationFrame = requestAnimationFrame(loop)
        }

        function resize() {
            const rect = container.getBoundingClientRect()
            const newW = Math.max(1, Math.round(rect.width))
            const newH = Math.max(1, Math.round(rect.height))
            if (newW === W && newH === H) return
            W = newW
            H = newH
            dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.round(W * dpr)
            canvas.height = Math.round(H * dpr)
            canvas.style.width = W + "px"
            canvas.style.height = H + "px"
            buildParticles()
            if (isStatic) renderFrame()
        }

        function onMouseMove(e: MouseEvent) {
            const rect = canvas.getBoundingClientRect()
            mouse.x = e.clientX - rect.left
            mouse.y = e.clientY - rect.top
        }
        function onMouseLeave() {
            mouse.x = -99999
            mouse.y = -99999
        }
        function onClick(e: MouseEvent) {
            if (!clickBurst) return
            const rect = canvas.getBoundingClientRect()
            const cx = e.clientX - rect.left
            const cy = e.clientY - rect.top
            const burstRadius = interactionRadius * 3
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]
                const dx = p.x - cx
                const dy = p.y - cy
                const d = Math.sqrt(dx * dx + dy * dy)
                if (d < burstRadius && d > 0.0001) {
                    const impulse = ((burstRadius - d) / burstRadius) * burstStrength
                    p.vx += (dx / d) * impulse
                    p.vy += (dy / d) * impulse
                }
            }
        }

        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(container)

        // Web fonts load lazily and canvas text never triggers a fetch,
        // so explicitly load the selected font, then re-sample.
        let fontListener: (() => void) | null = null
        if (source === "text" && typeof document !== "undefined" && document.fonts) {
            const size = parsePx(font.fontSize, 120)
            const weight = font.fontWeight || 700
            const fontStyle = font.fontStyle || "normal"
            const family = font.fontFamily || "sans-serif"
            const spec = `${fontStyle} ${weight} ${size}px ${family}`
            const rebuildFromFonts = () => {
                if (cancelled) return
                buildParticles()
                if (isStatic) renderFrame()
            }
            try {
                document.fonts.load(spec, text).then(rebuildFromFonts).catch(() => {})
            } catch {
                // invalid font spec — keep fallback rendering
            }
            document.fonts.ready.then(rebuildFromFonts).catch(() => {})
            // Catch fonts that finish loading later (e.g. Framer injects them async)
            fontListener = rebuildFromFonts
            document.fonts.addEventListener("loadingdone", fontListener)
        }

        // Load the SVG source, then rebuild
        if (source === "svg" && svgFile) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                if (cancelled) return
                svgImage = img
                buildParticles()
                if (isStatic) renderFrame()
            }
            img.src = svgFile
        }

        if (isStatic) {
            renderFrame()
        } else {
            canvas.addEventListener("mousemove", onMouseMove)
            canvas.addEventListener("mouseleave", onMouseLeave)
            canvas.addEventListener("click", onClick)
            animationFrame = requestAnimationFrame(loop)
        }

        return () => {
            cancelled = true
            ro.disconnect()
            canvas.removeEventListener("mousemove", onMouseMove)
            canvas.removeEventListener("mouseleave", onMouseLeave)
            canvas.removeEventListener("click", onClick)
            if (fontListener && typeof document !== "undefined" && document.fonts) {
                document.fonts.removeEventListener("loadingdone", fontListener)
            }
            cancelAnimationFrame(animationFrame)
        }
    }, [
        source,
        text,
        fontKey,
        sizing,
        fitScale,
        svgFile,
        svgScale,
        color,
        dotSize,
        spacing,
        interactionRadius,
        forceStrength,
        mode,
        gravity,
        returnSpeed,
        damping,
        clickBurst,
        burstStrength,
        isStatic,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                background: backgroundColor,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", cursor: clickBurst ? "pointer" : "default" }}
            />
        </div>
    )
}

DistortionLogo.displayName = "Distortion Logo"

addPropertyControls(DistortionLogo, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["text", "svg"],
        optionTitles: ["Text", "SVG"],
        defaultValue: "text",
        displaySegmentedControl: true,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "LOGO",
        hidden: (props) => props.source === "svg",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        defaultValue: {
            fontSize: "120px",
            variant: "Bold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
        hidden: (props) => props.source === "svg",
    },
    sizing: {
        type: ControlType.Enum,
        title: "Sizing",
        options: ["fixed", "fit"],
        optionTitles: ["Fixed", "Fit"],
        defaultValue: "fixed",
        displaySegmentedControl: true,
        hidden: (props) => props.source === "svg",
    },
    fitScale: {
        type: ControlType.Number,
        title: "Fit Scale",
        description: "Text size relative to the frame",
        defaultValue: 90,
        min: 10,
        max: 100,
        unit: "%",
        hidden: (props) => props.source === "svg" || props.sizing !== "fit",
    },
    svgFile: {
        type: ControlType.File,
        title: "SVG File",
        allowedFileTypes: ["svg"],
        hidden: (props) => props.source !== "svg",
    },
    svgScale: {
        type: ControlType.Number,
        title: "SVG Scale",
        defaultValue: 80,
        min: 10,
        max: 100,
        unit: "%",
        hidden: (props) => props.source !== "svg",
    },
    color: {
        type: ControlType.Color,
        title: "Dots",
        defaultValue: "#A5A6F6",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 2.2,
        min: 0.5,
        max: 10,
        step: 0.1,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        description: "Distance between dots — lower is denser",
        defaultValue: 6,
        min: 2,
        max: 20,
    },
    mode: {
        type: ControlType.Enum,
        title: "Cursor Mode",
        options: ["repel", "attract"],
        optionTitles: ["Repel", "Attract"],
        defaultValue: "repel",
        displaySegmentedControl: true,
    },
    interactionRadius: {
        type: ControlType.Number,
        title: "Radius",
        description: "Cursor influence radius",
        defaultValue: 90,
        min: 20,
        max: 400,
        unit: "px",
    },
    forceStrength: {
        type: ControlType.Number,
        title: "Force",
        defaultValue: 1.5,
        min: 0,
        max: 6,
        step: 0.1,
    },
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        description: "Pulls disturbed dots downward",
        defaultValue: 0.2,
        min: 0,
        max: 2,
        step: 0.05,
    },
    returnSpeed: {
        type: ControlType.Number,
        title: "Return Speed",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.3,
        step: 0.01,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        description: "Higher keeps momentum longer",
        defaultValue: 0.88,
        min: 0.5,
        max: 0.98,
        step: 0.01,
    },
    clickBurst: {
        type: ControlType.Boolean,
        title: "Click Burst",
        defaultValue: true,
    },
    burstStrength: {
        type: ControlType.Number,
        title: "Burst Power",
        defaultValue: 12,
        min: 1,
        max: 40,
        hidden: (props) => !props.clickBurst,
    },
})
