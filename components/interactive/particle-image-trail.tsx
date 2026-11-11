import React, { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const defaultLogo = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="white"><path d="M 40 20 L 80 20 L 80 80 L 20 80 L 20 40 Q 20 20 40 20 Z" /><path d="M 120 20 L 160 20 Q 180 20 180 40 L 180 80 L 120 80 Z" /><path d="M 20 120 L 80 120 L 80 180 L 40 180 Q 20 180 20 160 Z" /><path d="M 120 120 L 180 120 L 180 160 Q 180 180 160 180 L 120 180 Z" /><path d="M 100 70 L 130 100 L 100 130 L 70 100 Z" /></svg>'
)}`

const PI2 = Math.PI * 2

// Cache the canvas to prevent massive memory leaks and frame drops
let colorCanvas: HTMLCanvasElement | null = null
let colorCtx: CanvasRenderingContext2D | null = null

const hexToRgb = (color: string) => {
    if (typeof document === "undefined") return { r: 1, g: 1, b: 1, a: 1 }
    if (!colorCanvas) {
        colorCanvas = document.createElement("canvas")
        colorCanvas.width = 1
        colorCanvas.height = 1
        colorCtx = colorCanvas.getContext("2d", { willReadFrequently: true })
    }
    if (!colorCtx) return { r: 1, g: 1, b: 1, a: 1 }

    colorCtx.clearRect(0, 0, 1, 1)
    colorCtx.fillStyle = color
    colorCtx.fillRect(0, 0, 1, 1)
    const data = colorCtx.getImageData(0, 0, 1, 1).data
    return {
        r: data[0] / 255,
        g: data[1] / 255,
        b: data[2] / 255,
        a: data[3] / 255,
    }
}

export default function ElegantSandTrail(props: any) {
    const { image, resolution, ignoreWhite, brightness, contrast, saturation } =
        props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const renderProps = useRef(props)
    renderProps.current = props

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            premultipliedAlpha: false,
        }) as WebGLRenderingContext
        if (!gl) return

        let width = container.clientWidth
        let height = container.clientHeight
        const dpr = window.devicePixelRatio || 1

        let particleCount = 0

        // Physics Arrays (Typed Arrays for instant V8 engine computation)
        let p_tx: Float32Array
        let p_ty: Float32Array
        let p_hx: Float32Array
        let p_hy: Float32Array
        let p_x: Float32Array
        let p_y: Float32Array
        let p_z: Float32Array
        let p_vx: Float32Array
        let p_vy: Float32Array
        let p_vz: Float32Array
        let p_offset: Float32Array
        let p_speed: Float32Array

        // SLEEP STATE OPTIMIZATION: Skips CPU math for non-moving particles
        let p_sleep: Uint8Array

        let mouseX = -10000
        let mouseY = -10000

        let trailX = -10000
        let trailY = -10000
        let prevTrailX = -10000
        let prevTrailY = -10000
        let isFirstHover = true

        let lastWidth = 0
        let lastHeight = 0
        let lastScale = 0

        // VS: Offloaded Sin/Cos idle floating and 3D Perspective Math entirely to the GPU
        const vsSource = `
            attribute vec3 a_position;
            attribute vec3 a_color;
            attribute vec2 a_idle;

            uniform vec2 u_resolution;
            uniform float u_size;
            uniform float u_time;
            uniform float u_idleMove;
            uniform float u_focalLength;

            varying vec3 v_color;

            void main() {
                // GPU-accelerated Idle Floating
                float floatX = sin(u_time * a_idle.x + a_idle.y) * u_idleMove;
                float floatY = cos(u_time * a_idle.x + a_idle.y) * u_idleMove;
                
                vec2 activeXY = a_position.xy + vec2(floatX, floatY);
                vec2 center = u_resolution * 0.5;
                
                // GPU-accelerated 3D Perspective Scaling (Dynamically scaled for responsiveness)
                float pScale = u_focalLength / max(u_focalLength - a_position.z, 10.0);
                vec2 displayPos = center + (activeXY - center) * pScale;
                
                vec2 clipSpace = (displayPos / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
                
                float lum = dot(a_color, vec3(0.299, 0.587, 0.114));
                // Reduced luminance penalty to prevent grid gaps in dark areas
                gl_PointSize = u_size * (0.8 + lum * 0.4) * pScale;
                v_color = a_color;
            }
        `

        const fsSource = `
            precision mediump float;
            varying vec3 v_color;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                if (dist > 0.5) discard;
                
                // Extremely soft, anti-aliased edges for the particles themselves
                float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                gl_FragColor = vec4(v_color, alpha);
            }
        `

        const compileShader = (source: string, type: number) => {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            return shader
        }

        const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER)
        const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER)
        if (!vertexShader || !fragmentShader) return

        const program = gl.createProgram()
        if (!program) return
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        const a_position = gl.getAttribLocation(program, "a_position")
        const a_color = gl.getAttribLocation(program, "a_color")
        const a_idle = gl.getAttribLocation(program, "a_idle")

        const u_resolution = gl.getUniformLocation(program, "u_resolution")
        const u_size = gl.getUniformLocation(program, "u_size")
        const u_time = gl.getUniformLocation(program, "u_time")
        const u_idleMove = gl.getUniformLocation(program, "u_idleMove")
        const u_focalLength = gl.getUniformLocation(program, "u_focalLength")

        // Split Data Buffers for massive bandwidth savings
        const posBuffer = gl.createBuffer()
        const colorBuffer = gl.createBuffer()
        const idleBuffer = gl.createBuffer()

        let posData = new Float32Array(0)
        let isUnmounted = false

        const extractSpots = (img: HTMLImageElement) => {
            const aspect = img.height / img.width
            const sWidth = 1000
            const sHeight = Math.floor(1000 * aspect)

            const off = document.createElement("canvas")
            off.width = sWidth
            off.height = sHeight
            const ctx = off.getContext("2d")
            if (!ctx) return []

            // Apply image filters before drawing to canvas
            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
            ctx.drawImage(img, 0, 0, sWidth, sHeight)

            const data = ctx.getImageData(0, 0, sWidth, sHeight).data

            const spots: {
                nx: number
                ny: number
                r: number
                g: number
                b: number
            }[] = []

            const cols = Math.floor(resolution)
            const rows = Math.floor(resolution * aspect)

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    // Anti-Moire Jitter: Breaks the perfect grid to eliminate hard edges/boxes
                    const jitterX = (Math.random() - 0.5) * (0.8 / cols)
                    const jitterY = (Math.random() - 0.5) * (0.8 / rows)

                    const nx = (i + 0.5) / cols - 0.5 + jitterX
                    const ny = ((j + 0.5) / rows - 0.5 + jitterY) * aspect

                    // Nearest neighbor pixel sampling (using exact center for accurate color)
                    const px = Math.floor(((i + 0.5) / cols) * sWidth)
                    const py = Math.floor(((j + 0.5) / rows) * sHeight)

                    if (px >= sWidth || py >= sHeight) continue

                    const idx = (py * sWidth + px) * 4
                    const r = data[idx]
                    const g = data[idx + 1]
                    const b = data[idx + 2]
                    const a = data[idx + 3]

                    if (a < 50) continue
                    if (ignoreWhite && r > 240 && g > 240 && b > 240) continue

                    spots.push({
                        nx,
                        ny,
                        r: r / 255,
                        g: g / 255,
                        b: b / 255,
                    })
                }
            }
            return spots
        }

        const initParticles = () => {
            const img = new Image()
            img.crossOrigin = "Anonymous"
            img.src = image || defaultLogo
            img.onload = () => {
                if (isUnmounted) return
                const spots = extractSpots(img)
                particleCount = spots.length

                p_tx = new Float32Array(particleCount)
                p_ty = new Float32Array(particleCount)
                p_hx = new Float32Array(particleCount)
                p_hy = new Float32Array(particleCount)
                p_x = new Float32Array(particleCount)
                p_y = new Float32Array(particleCount)
                p_z = new Float32Array(particleCount)
                p_vx = new Float32Array(particleCount)
                p_vy = new Float32Array(particleCount)
                p_vz = new Float32Array(particleCount)
                p_offset = new Float32Array(particleCount)
                p_speed = new Float32Array(particleCount)
                p_sleep = new Uint8Array(particleCount)

                // Separating Dynamic Positional Data from Static Color Data
                posData = new Float32Array(particleCount * 3)
                const colorData = new Float32Array(particleCount * 3)
                const idleData = new Float32Array(particleCount * 2)

                const initialRenderScale =
                    Math.min(width, height) *
                    (renderProps.current.imageScale || 0.8)

                for (let i = 0; i < particleCount; i++) {
                    p_tx[i] = spots[i].nx
                    p_ty[i] = spots[i].ny

                    // Start exactly at target
                    const initX = width / 2 + spots[i].nx * initialRenderScale
                    const initY = height / 2 + spots[i].ny * initialRenderScale

                    p_x[i] = initX
                    p_y[i] = initY
                    p_z[i] = 0

                    p_vx[i] = 0
                    p_vy[i] = 0
                    p_vz[i] = 0

                    const speed = 0.001 + Math.random() * 0.002
                    const offset = Math.random() * PI2

                    p_speed[i] = speed
                    p_offset[i] = offset

                    p_sleep[i] = 0

                    // Dynamic Pos Data
                    const pIdx = i * 3
                    posData[pIdx] = initX * dpr
                    posData[pIdx + 1] = initY * dpr
                    posData[pIdx + 2] = 0

                    // Load Static Colors
                    const cIdx = i * 3
                    colorData[cIdx] = spots[i].r
                    colorData[cIdx + 1] = spots[i].g
                    colorData[cIdx + 2] = spots[i].b

                    // Load Static Idle Data
                    const iIdx = i * 2
                    idleData[iIdx] = speed
                    idleData[iIdx + 1] = offset
                }

                // ALLOCATE Dynamic Positions perfectly once
                gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
                gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW)
                gl.enableVertexAttribArray(a_position)
                gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 12, 0)

                // Upload Static Colors (Sent exactly ONCE)
                gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
                gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW)
                gl.enableVertexAttribArray(a_color)
                gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 12, 0)

                // Upload Static Idle Data (Sent exactly ONCE)
                gl.bindBuffer(gl.ARRAY_BUFFER, idleBuffer)
                gl.bufferData(gl.ARRAY_BUFFER, idleData, gl.STATIC_DRAW)
                gl.enableVertexAttribArray(a_idle)
                gl.vertexAttribPointer(a_idle, 2, gl.FLOAT, false, 8, 0)
            }
        }

        initParticles()

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                width = entry.contentRect.width
                height = entry.contentRect.height
                canvas.width = width * dpr
                canvas.height = height * dpr
                canvas.style.width = `${width}px`
                canvas.style.height = `${height}px`
            }
        })
        resizeObserver.observe(container)

        const handlePointerMove = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouseX = e.clientX - rect.left
            mouseY = e.clientY - rect.top

            if (isFirstHover) {
                trailX = mouseX
                trailY = mouseY
                prevTrailX = mouseX
                prevTrailY = mouseY
                isFirstHover = false
            }
        }

        const handlePointerLeave = () => {
            mouseX = -10000
            mouseY = -10000
            trailX = -10000
            trailY = -10000
            prevTrailX = -10000
            prevTrailY = -10000
            isFirstHover = true
        }

        window.addEventListener("pointermove", handlePointerMove)
        container.addEventListener("pointerleave", handlePointerLeave)

        let animationFrameId: number

        // Math pointer caching for extreme JIT compilation speeds
        const { sqrt, cos, min, max, random, PI, abs } = Math

        const render = () => {
            if (isUnmounted) return
            const time = performance.now()

            const {
                particleSize,
                backgroundColor,
                brushSize,
                zPopForce,
                xyScatterForce,
                delaySpeed,
                returnSpeed,
                friction,
                imageScale,
                idleMove,
            } = renderProps.current

            const bgRgb = hexToRgb(backgroundColor)

            gl.viewport(0, 0, width * dpr, height * dpr)
            gl.clearColor(bgRgb.r, bgRgb.g, bgRgb.b, bgRgb.a)
            gl.clear(gl.COLOR_BUFFER_BIT)

            if (particleCount === 0) {
                animationFrameId = requestAnimationFrame(render)
                return
            }

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            // RESPONSIVE SCALING ENGINE
            const currentMinDim = min(width, height)
            const responsiveScale = currentMinDim / 800.0

            // The exact width of one grid cell in pixels
            const cellWidth = (currentMinDim * imageScale) / resolution

            // Scale particle size proportionally to the grid cell size.
            // A particleSize of 3 (default) will provide a 1.5x overlap to hide grid gaps perfectly.
            const scaledParticleSize = max(
                0.5,
                cellWidth * (particleSize / 2.0)
            )

            const scaledIdleMove = idleMove * responsiveScale
            const scaledBrushSize = max(0.1, brushSize * responsiveScale)
            const scaledZPopForce = zPopForce * responsiveScale
            const scaledXyScatterForce = xyScatterForce * responsiveScale
            const scaledFocalLength = 1000.0 * responsiveScale

            gl.useProgram(program)
            gl.uniform2f(u_resolution, width * dpr, height * dpr)
            gl.uniform1f(u_size, scaledParticleSize * dpr)
            gl.uniform1f(u_time, time)
            gl.uniform1f(u_idleMove, scaledIdleMove * dpr)
            gl.uniform1f(u_focalLength, scaledFocalLength)

            // Recalculate rigid Home Base only when scale/resize changes
            if (
                width !== lastWidth ||
                height !== lastHeight ||
                imageScale !== lastScale
            ) {
                lastWidth = width
                lastHeight = height
                lastScale = imageScale
                const cx = width / 2
                const cy = height / 2
                const renderScale = currentMinDim * imageScale

                for (let i = 0; i < particleCount; i++) {
                    p_hx[i] = cx + p_tx[i] * renderScale
                    p_hy[i] = cy + p_ty[i] * renderScale
                    p_sleep[i] = 0 // Wake ALL particles up to snap to new boundaries
                }
            }

            prevTrailX = trailX
            prevTrailY = trailY
            if (mouseX !== -10000) {
                trailX += (mouseX - trailX) * delaySpeed
                trailY += (mouseY - trailY) * delaySpeed
            }

            const dxLine = trailX - prevTrailX
            const dyLine = trailY - prevTrailY
            const lineLenSq = dxLine * dxLine + dyLine * dyLine
            const hitRadiusSq = scaledBrushSize * scaledBrushSize
            const invLineLenSq = lineLenSq > 0.0 ? 1.0 / lineLenSq : 0.0
            const brushMath = PI / scaledBrushSize

            // Bounding box for rapid spatial rejection
            const minX = min(trailX, prevTrailX) - scaledBrushSize
            const maxX = max(trailX, prevTrailX) + scaledBrushSize
            const minY = min(trailY, prevTrailY) - scaledBrushSize
            const maxY = max(trailY, prevTrailY) + scaledBrushSize

            for (let i = 0; i < particleCount; i++) {
                const hx = p_hx[i]
                const hy = p_hy[i]

                const inMouseBounds =
                    hx > minX && hx < maxX && hy > minY && hy < maxY

                // THE CPU SLEEP OPTIMIZATION: 99% of particles completely skip physics math
                if (p_sleep[i] === 1) {
                    if (inMouseBounds) {
                        p_sleep[i] = 0 // Wake up
                    } else {
                        continue // Instant skip
                    }
                }

                let px = p_x[i]
                let py = p_y[i]
                let pz = p_z[i]
                let vx = p_vx[i]
                let vy = p_vy[i]
                let vz = p_vz[i]

                // Active Physics Engine
                if (inMouseBounds) {
                    let projX = trailX
                    let projY = trailY

                    if (lineLenSq > 0.0) {
                        const t = max(
                            0,
                            min(
                                1,
                                ((hx - prevTrailX) * dxLine +
                                    (hy - prevTrailY) * dyLine) *
                                    invLineLenSq
                            )
                        )
                        projX = prevTrailX + t * dxLine
                        projY = prevTrailY + t * dyLine
                    }

                    const distSq =
                        (hx - projX) * (hx - projX) +
                        (hy - projY) * (hy - projY)

                    if (distSq < hitRadiusSq) {
                        const dist = sqrt(distSq)
                        const influence = (cos(dist * brushMath) + 1.0) * 0.5

                        if (random() > 0.2) {
                            vx +=
                                (random() - 0.5) *
                                scaledXyScatterForce *
                                influence
                            vy +=
                                (random() - 0.5) *
                                scaledXyScatterForce *
                                influence
                            vz +=
                                (random() * 0.6 + 0.4) *
                                scaledZPopForce *
                                influence
                        }
                    }
                }

                vx += (hx - px) * returnSpeed
                vy += (hy - py) * returnSpeed
                vz += (0 - pz) * returnSpeed

                vx *= friction
                vy *= friction
                vz *= friction

                px += vx
                py += vy
                pz += vz

                // Sleep State Check (Inlined for maximum CPU speed)
                if (
                    !inMouseBounds &&
                    vx > -0.1 &&
                    vx < 0.1 &&
                    vy > -0.1 &&
                    vy < 0.1 &&
                    vz > -0.1 &&
                    vz < 0.1
                ) {
                    const dx = hx - px
                    const dy = hy - py
                    if (
                        dx > -0.1 &&
                        dx < 0.1 &&
                        dy > -0.1 &&
                        dy < 0.1 &&
                        pz > -0.1 &&
                        pz < 0.1
                    ) {
                        p_sleep[i] = 1
                        px = hx
                        py = hy
                        pz = 0
                        vx = 0
                        vy = 0
                        vz = 0
                    }
                }

                p_vx[i] = vx
                p_vy[i] = vy
                p_vz[i] = vz
                p_x[i] = px
                p_y[i] = py
                p_z[i] = pz

                const idx = i * 3
                posData[idx] = px * dpr
                posData[idx + 1] = py * dpr
                posData[idx + 2] = pz
            }

            // Stream ONLY bare minimum positions to GPU memory
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData)
            gl.drawArrays(gl.POINTS, 0, particleCount)

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        return () => {
            isUnmounted = true
            window.removeEventListener("pointermove", handlePointerMove)
            container.removeEventListener("pointerleave", handlePointerLeave)
            resizeObserver.disconnect()
            cancelAnimationFrame(animationFrameId)
            gl.deleteBuffer(posBuffer)
            gl.deleteBuffer(colorBuffer)
            gl.deleteBuffer(idleBuffer)
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
        }
    }, [image, resolution, ignoreWhite, brightness, contrast, saturation])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                overflow: "hidden",
                position: "relative",
                backgroundColor: "transparent",
                ...props.style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    cursor: "default",
                }}
            />
        </div>
    )
}

ElegantSandTrail.defaultProps = {
    image: "",
    resolution: 120,
    imageScale: 0.8,
    particleSize: 3,
    idleMove: 1,
    brushSize: 60,
    delaySpeed: 0.1,
    zPopForce: 4,
    xyScatterForce: 1.5,
    returnSpeed: 0.015,
    friction: 0.88,
    ignoreWhite: false,
    backgroundColor: "#050505",
    brightness: 100,
    contrast: 100,
    saturation: 100,
}

addPropertyControls(ElegantSandTrail, {
    image: {
        type: ControlType.Image,
        title: "Portrait Image",
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        defaultValue: 100,
        min: 0,
        max: 300,
        step: 1,
        displayStepper: true,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        defaultValue: 100,
        min: 0,
        max: 300,
        step: 1,
        displayStepper: true,
    },
    saturation: {
        type: ControlType.Number,
        title: "Saturation",
        defaultValue: 100,
        min: 0,
        max: 300,
        step: 1,
        displayStepper: true,
    },
    resolution: {
        type: ControlType.Number,
        title: "Detail Density",
        defaultValue: 120,
        min: 20,
        max: 1000,
        step: 5,
        displayStepper: true,
    },
    imageScale: {
        type: ControlType.Number,
        title: "Image Scale",
        defaultValue: 0.8,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        displayStepper: true,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Base Size",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
    },
    idleMove: {
        type: ControlType.Number,
        title: "Idle Move",
        defaultValue: 1,
        min: 0,
        max: 30,
        step: 0.5,
    },
    brushSize: {
        type: ControlType.Number,
        title: "Brush Size",
        defaultValue: 60,
        min: 10,
        max: 300,
        step: 1,
        displayStepper: true,
    },
    delaySpeed: {
        type: ControlType.Number,
        title: "Trail Delay",
        defaultValue: 0.1,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        displayStepper: true,
    },
    zPopForce: {
        type: ControlType.Number,
        title: "Z-Axis Bounce",
        defaultValue: 4,
        min: 0.5,
        max: 20,
        step: 0.5,
    },
    xyScatterForce: {
        type: ControlType.Number,
        title: "Random Scatter",
        defaultValue: 1.5,
        min: 0,
        max: 20,
        step: 0.5,
    },
    returnSpeed: {
        type: ControlType.Number,
        title: "Return Speed",
        defaultValue: 0.015,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        displayStepper: true,
    },
    friction: {
        type: ControlType.Number,
        title: "Smoothness (Friction)",
        defaultValue: 0.88,
        min: 0.7,
        max: 0.99,
        step: 0.01,
    },
    ignoreWhite: {
        type: ControlType.Boolean,
        title: "Remove White BG",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050505",
    },
})
