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

const colorCache = new Map<
    string,
    { r: number; g: number; b: number; a: number }
>()
const colorToRgba = (color: string) => {
    if (colorCache.has(color)) return colorCache.get(color)!
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return { r: 0, g: 0, b: 0, a: 1 }
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    const res = { r: data[0], g: data[1], b: data[2], a: data[3] / 255 }
    colorCache.set(color, res)
    return res
}

export default function ParticleLogo(props: any) {
    const { logoUrl, logos, resolution } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const renderProps = useRef(props)
    renderProps.current = props

    const logosKey = JSON.stringify(logos)

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const gl = (canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
        }) ||
            canvas.getContext("experimental-webgl", {
                alpha: false,
                antialias: false,
            })) as WebGLRenderingContext | null
        if (!gl) return

        let width = container.clientWidth
        let height = container.clientHeight
        const dpr = window.devicePixelRatio || 1

        let particleCount = 0

        let p_layouts: {
            nx: Float32Array
            ny: Float32Array
            r: Float32Array
            g: Float32Array
            b: Float32Array
        }[] = []
        let p_x: Float32Array
        let p_y: Float32Array
        let p_vx: Float32Array
        let p_vy: Float32Array
        let p_layer: Uint8Array
        let p_offsetX: Float32Array
        let p_offsetY: Float32Array
        let p_speedX: Float32Array
        let p_speedY: Float32Array
        let p_randomSize: Float32Array

        let mouseX = width / 2
        let mouseY = height / 2
        let targetMouseX = width / 2
        let targetMouseY = height / 2

        let scrollProgress = 0

        const handleScroll = () => {
            const scrollTop =
                document.documentElement.scrollTop ||
                document.body.scrollTop ||
                window.scrollY
            const scrollHeight =
                document.documentElement.scrollHeight - window.innerHeight
            if (scrollHeight > 0) {
                scrollProgress = Math.min(
                    Math.max(scrollTop / scrollHeight, 0),
                    1
                )
            } else {
                scrollProgress = 0
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll()

        const vsSource = `
            attribute vec2 a_position;
            attribute float a_size;
            attribute float a_intensity;
            attribute float a_layerDim;
            attribute vec3 a_originalColor;

            uniform vec2 u_resolution;
            uniform vec3 u_activeColor;
            uniform vec3 u_inactiveColor;
            uniform float u_useOriginalColors;

            varying vec3 v_color;
            varying float v_size;

            void main() {
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
                gl_PointSize = a_size; // Size is strictly constant
                
                vec3 customColor = mix(u_inactiveColor, u_activeColor, a_intensity);
                vec3 baseColor = mix(customColor, a_originalColor, u_useOriginalColors);
                
                v_color = baseColor * a_layerDim;
                v_size = a_size;
            }
        `

        const fsSource = `
            precision mediump float;
            varying vec3 v_color;
            varying float v_size;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                float edge = 0.5;
                float smoothWidth = 1.0 / v_size;
                float alpha = 1.0 - smoothstep(edge - smoothWidth, edge, dist);
                if (alpha < 0.01) discard;
                gl_FragColor = vec4(v_color, alpha);
            }
        `

        const compileShader = (source: string, type: number) => {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader))
                gl.deleteShader(shader)
                return null
            }
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
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program))
            return
        }

        const a_position = gl.getAttribLocation(program, "a_position")
        const a_size = gl.getAttribLocation(program, "a_size")
        const a_intensity = gl.getAttribLocation(program, "a_intensity")
        const a_layerDim = gl.getAttribLocation(program, "a_layerDim")
        const a_originalColor = gl.getAttribLocation(program, "a_originalColor")

        const u_resolution = gl.getUniformLocation(program, "u_resolution")
        const u_activeColor = gl.getUniformLocation(program, "u_activeColor")
        const u_inactiveColor = gl.getUniformLocation(
            program,
            "u_inactiveColor"
        )
        const u_useOriginalColors = gl.getUniformLocation(
            program,
            "u_useOriginalColors"
        )

        const buffer = gl.createBuffer()
        let vertexData = new Float32Array(0)

        let isUnmounted = false

        const extractSpots = (img: HTMLImageElement) => {
            const aspect = img.height / img.width
            const sWidth = 500
            const sHeight = 500 * aspect
            const grid = sWidth / resolution

            const off = document.createElement("canvas")
            off.width = sWidth
            off.height = sHeight
            const ctx = off.getContext("2d")
            if (!ctx) return []

            ctx.fillStyle = "black"
            ctx.fillRect(0, 0, sWidth, sHeight)
            ctx.drawImage(img, 0, 0, sWidth, sHeight)

            const data = ctx.getImageData(0, 0, sWidth, sHeight).data
            const cols = Math.ceil(sWidth / grid)
            const rows = Math.ceil(sHeight / grid)

            const spots: {
                nx: number
                ny: number
                r: number
                g: number
                b: number
            }[] = []

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const px = Math.floor(i * grid + grid / 2)
                    const py = Math.floor(j * grid + grid / 2)

                    if (px >= sWidth || py >= sHeight) continue

                    const idx = (py * sWidth + px) * 4
                    if (
                        data[idx] > 50 ||
                        data[idx + 1] > 50 ||
                        data[idx + 2] > 50
                    ) {
                        spots.push({
                            nx: px / sWidth - 0.5,
                            ny: (py / sHeight - 0.5) * aspect,
                            r: data[idx] / 255,
                            g: data[idx + 1] / 255,
                            b: data[idx + 2] / 255,
                        })
                    }
                }
            }

            // Shuffle the spots randomly to create beautiful morph paths
            for (let i = spots.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                const temp = spots[i]
                spots[i] = spots[j]
                spots[j] = temp
            }

            return spots
        }

        const initParticles = async () => {
            const urlsToLoad: string[] = []
            if (logoUrl) urlsToLoad.push(logoUrl)
            if (logos && logos.length > 0) {
                urlsToLoad.push(...logos.filter((l: string) => l))
            }
            if (urlsToLoad.length === 0) urlsToLoad.push(defaultLogo)

            const loadedSpotsArray = await Promise.all(
                urlsToLoad.map((url: string) => {
                    return new Promise<
                        {
                            nx: number
                            ny: number
                            r: number
                            g: number
                            b: number
                        }[]
                    >((resolve) => {
                        const img = new Image()
                        img.crossOrigin = "Anonymous"
                        img.onload = () => resolve(extractSpots(img))
                        img.onerror = () => resolve([])
                        img.src = url
                    })
                })
            )

            const validSpotsArrays = loadedSpotsArray.filter(
                (arr) => arr.length > 0
            )
            if (validSpotsArrays.length === 0 || isUnmounted) return

            const maxSpots = Math.max(
                ...validSpotsArrays.map((arr) => arr.length)
            )
            const numLayers = 3
            particleCount = maxSpots * numLayers

            p_layouts = validSpotsArrays.map((spots) => {
                const nx = new Float32Array(particleCount)
                const ny = new Float32Array(particleCount)
                const r = new Float32Array(particleCount)
                const g = new Float32Array(particleCount)
                const b = new Float32Array(particleCount)
                let idx = 0
                for (let l = numLayers - 1; l >= 0; l--) {
                    for (let s = 0; s < maxSpots; s++) {
                        const spot = spots[s % spots.length]
                        nx[idx] = spot.nx
                        ny[idx] = spot.ny
                        r[idx] = spot.r
                        g[idx] = spot.g
                        b[idx] = spot.b
                        idx++
                    }
                }
                return { nx, ny, r, g, b }
            })

            p_x = new Float32Array(particleCount)
            p_y = new Float32Array(particleCount)
            p_vx = new Float32Array(particleCount)
            p_vy = new Float32Array(particleCount)
            p_layer = new Uint8Array(particleCount)
            p_offsetX = new Float32Array(particleCount)
            p_offsetY = new Float32Array(particleCount)
            p_speedX = new Float32Array(particleCount)
            p_speedY = new Float32Array(particleCount)
            p_randomSize = new Float32Array(particleCount)

            let idx = 0
            for (let l = numLayers - 1; l >= 0; l--) {
                for (let s = 0; s < maxSpots; s++) {
                    p_x[idx] = width / 2
                    p_y[idx] = height / 2
                    p_vx[idx] = 0
                    p_vy[idx] = 0
                    p_layer[idx] = l
                    p_offsetX[idx] = Math.random() * PI2
                    p_offsetY[idx] = Math.random() * PI2
                    p_speedX[idx] = 0.001 + Math.random() * 0.002
                    p_speedY[idx] = 0.001 + Math.random() * 0.002
                    p_randomSize[idx] = 0.3 + Math.random() * 1.2
                    idx++
                }
            }

            vertexData = new Float32Array(particleCount * 8)
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                vertexData.byteLength,
                gl.DYNAMIC_DRAW
            )

            gl.enableVertexAttribArray(a_position)
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 32, 0)

            gl.enableVertexAttribArray(a_size)
            gl.vertexAttribPointer(a_size, 1, gl.FLOAT, false, 32, 8)

            gl.enableVertexAttribArray(a_intensity)
            gl.vertexAttribPointer(a_intensity, 1, gl.FLOAT, false, 32, 12)

            gl.enableVertexAttribArray(a_layerDim)
            gl.vertexAttribPointer(a_layerDim, 1, gl.FLOAT, false, 32, 16)

            gl.enableVertexAttribArray(a_originalColor)
            gl.vertexAttribPointer(a_originalColor, 3, gl.FLOAT, false, 32, 20)
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
            targetMouseX = e.clientX - rect.left
            targetMouseY = e.clientY - rect.top
        }

        const handlePointerLeave = () => {
            targetMouseX = width / 2
            targetMouseY = height / 2
        }

        window.addEventListener("pointermove", handlePointerMove)
        container.addEventListener("pointerleave", handlePointerLeave)

        let animationFrameId: number

        const SPRING = 0.08
        const FRICTION = 0.8

        const render = () => {
            const time = performance.now()

            const {
                logoScale,
                size,
                randomSize,
                idleMovement,
                lensStrength,
                tiltStrength,
                parallaxStrength,
                hoverRadius,
                glowLayers,
                activeColor,
                inactiveColor,
                backgroundColor,
                useOriginalColors,
            } = renderProps.current

            mouseX += (targetMouseX - mouseX) * 0.15
            mouseY += (targetMouseY - mouseY) * 0.15

            const bgRgba = colorToRgba(backgroundColor)
            const activeRgba = colorToRgba(activeColor)
            const inactiveRgba = colorToRgba(inactiveColor)

            gl.viewport(0, 0, width * dpr, height * dpr)
            gl.clearColor(
                bgRgba.r / 255,
                bgRgba.g / 255,
                bgRgba.b / 255,
                bgRgba.a
            )
            gl.clear(gl.COLOR_BUFFER_BIT)

            if (particleCount === 0 || p_layouts.length === 0) {
                animationFrameId = requestAnimationFrame(render)
                return
            }

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            gl.useProgram(program)
            gl.uniform2f(u_resolution, width * dpr, height * dpr)
            gl.uniform3f(
                u_activeColor,
                activeRgba.r / 255,
                activeRgba.g / 255,
                activeRgba.b / 255
            )
            gl.uniform3f(
                u_inactiveColor,
                inactiveRgba.r / 255,
                inactiveRgba.g / 255,
                inactiveRgba.b / 255
            )
            gl.uniform1f(u_useOriginalColors, useOriginalColors ? 1.0 : 0.0)

            const renderSize = Math.min(width, height) * logoScale
            const renderWidth = renderSize
            const scaleFactor = renderWidth / 500

            const actualSize = size * scaleFactor
            const actualHoverRadius = hoverRadius * scaleFactor
            const actualIdleMovement = idleMovement * scaleFactor
            const actualLensStrength = lensStrength * scaleFactor * 20
            const actualParallaxStrength = parallaxStrength * scaleFactor * 5

            const cx = width / 2
            const cy = height / 2

            const mouseNormX = (mouseX - cx) / cx
            const mouseNormY = (mouseY - cy) / cy

            // 1. True 3D Rotation Matrix Math (Watching the cursor)
            const maxTilt = (tiltStrength * Math.PI) / 180
            const rotY = mouseNormX * maxTilt
            const rotX = -mouseNormY * maxTilt

            const cosX = Math.cos(rotX)
            const sinX = Math.sin(rotX)
            const cosY = Math.cos(rotY)
            const sinY = Math.sin(rotY)

            const perspective = 1000

            // Layout Morphing Index Calculation
            const scaledProgress = scrollProgress * (p_layouts.length - 1)
            const currentLayoutIdx = Math.floor(scaledProgress)
            const nextLayoutIdx = Math.min(
                currentLayoutIdx + 1,
                p_layouts.length - 1
            )
            let lerpFactor = scaledProgress - currentLayoutIdx
            const smoothLerp = lerpFactor * lerpFactor * (3 - 2 * lerpFactor)

            const layoutA = p_layouts[currentLayoutIdx]
            const layoutB = p_layouts[nextLayoutIdx]

            for (let i = 0; i < particleCount; i++) {
                const layerOffset = 1 - p_layer[i]

                // Scroll based Interpolation
                const interp_nx =
                    layoutA.nx[i] + (layoutB.nx[i] - layoutA.nx[i]) * smoothLerp
                const interp_ny =
                    layoutA.ny[i] + (layoutB.ny[i] - layoutA.ny[i]) * smoothLerp
                const interp_r =
                    layoutA.r[i] + (layoutB.r[i] - layoutA.r[i]) * smoothLerp
                const interp_g =
                    layoutA.g[i] + (layoutB.g[i] - layoutA.g[i]) * smoothLerp
                const interp_b =
                    layoutA.b[i] + (layoutB.b[i] - layoutA.b[i]) * smoothLerp

                // Base 3D Coordinates with Parallax effect applied
                const x =
                    interp_nx * renderWidth +
                    mouseNormX * actualParallaxStrength * layerOffset
                const y =
                    interp_ny * renderWidth +
                    mouseNormY * actualParallaxStrength * layerOffset
                const z = p_layer[i] * -40 // Depth separation between layers

                // Apply 3D Rotation (Tilt)
                let y1 = y * cosX - z * sinX
                let z1 = y * sinX + z * cosX
                let x2 = x * cosY + z1 * sinY
                let z2 = -x * sinY + z1 * cosY

                // Calculate screen distance for the Bulge
                const approxPScale = perspective / (perspective - z2)
                const approxScreenX = cx + x2 * approxPScale
                const approxScreenY = cy + y1 * approxPScale

                const dxCursor = mouseX - approxScreenX
                const dyCursor = mouseY - approxScreenY
                const dist = Math.sqrt(
                    dxCursor * dxCursor + dyCursor * dyCursor
                )

                let intensity = 0

                // 2. Sphere under cloth (Z-axis bulge, NO X/Y repulsion)
                if (dist < actualHoverRadius && dist > 0) {
                    const normalizedDist = dist / actualHoverRadius
                    // Cosine bell curve ensures perfectly smooth, seamless edges
                    const falloff =
                        (Math.cos(normalizedDist * Math.PI) + 1.0) * 0.5
                    intensity = falloff

                    // Push particles TOWARDS the camera (Z-axis) to create the bulge
                    const zPush = falloff * actualLensStrength
                    z2 += zPush

                    if (glowLayers === "first" && p_layer[i] !== 0) {
                        intensity = 0
                    }
                }

                // Final Perspective Projection
                const pScale = perspective / (perspective - z2)
                const targetX = cx + x2 * pScale
                const targetY = cy + y1 * pScale

                // Idle floating movement
                const idleX =
                    Math.sin(time * p_speedX[i] + p_offsetX[i]) *
                    actualIdleMovement
                const idleY =
                    Math.cos(time * p_speedY[i] + p_offsetY[i]) *
                    actualIdleMovement

                const finalTargetX = targetX + idleX
                const finalTargetY = targetY + idleY

                // Spring Physics
                const px = p_x[i]
                const py = p_y[i]
                const dx = finalTargetX - px
                const dy = finalTargetY - py

                let vx = p_vx[i]
                let vy = p_vy[i]

                if (
                    Math.abs(dx) > 0.05 ||
                    Math.abs(dy) > 0.05 ||
                    Math.abs(vx) > 0.05 ||
                    Math.abs(vy) > 0.05
                ) {
                    vx += dx * SPRING
                    vy += dy * SPRING
                    vx *= FRICTION
                    vy *= FRICTION
                    p_vx[i] = vx
                    p_vy[i] = vy
                    p_x[i] = px + vx
                    p_y[i] = py + vy
                } else {
                    p_x[i] = finalTargetX
                    p_y[i] = finalTargetY
                    p_vx[i] = 0
                    p_vy[i] = 0
                }

                // Write to WebGL Buffer
                let vIdx = i * 8

                vertexData[vIdx] = p_x[i] * dpr
                vertexData[vIdx + 1] = p_y[i] * dpr

                const finalParticleSize =
                    actualSize *
                    (1.0 - p_layer[i] * 0.1) *
                    (randomSize ? p_randomSize[i] : 1.0)
                vertexData[vIdx + 2] = finalParticleSize * dpr

                vertexData[vIdx + 3] = intensity
                vertexData[vIdx + 4] = 1.0 - p_layer[i] * 0.25
                vertexData[vIdx + 5] = interp_r
                vertexData[vIdx + 6] = interp_g
                vertexData[vIdx + 7] = interp_b
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData)

            gl.drawArrays(gl.POINTS, 0, particleCount)

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        return () => {
            isUnmounted = true
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("scroll", handleScroll)
            container.removeEventListener("pointerleave", handlePointerLeave)
            resizeObserver.disconnect()
            cancelAnimationFrame(animationFrameId)

            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
        }
    }, [logoUrl, resolution, logosKey])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
                backgroundColor: "transparent",
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

ParticleLogo.defaultProps = {
    logoUrl: "",
    logos: [],
    randomSize: false,
    useOriginalColors: false,
    logoScale: 0.8,
    resolution: 40,
    size: 8,
    idleMovement: 2,
    lensStrength: 5,
    tiltStrength: 15,
    parallaxStrength: 10,
    hoverRadius: 250,
    glowLayers: "all",
    activeColor: "#ccff00",
    inactiveColor: "#333333",
    backgroundColor: "rgba(5, 5, 5, 1)",
}

addPropertyControls(ParticleLogo, {
    logoUrl: { type: ControlType.Image, title: "Logo Image" },
    logos: {
        type: ControlType.Array,
        title: "Logos (Scroll Morph)",
        control: { type: ControlType.Image },
        defaultValue: [],
    },
    useOriginalColors: {
        type: ControlType.Boolean,
        title: "Original Colors",
        defaultValue: false,
    },
    logoScale: {
        type: ControlType.Number,
        title: "Logo Scale",
        defaultValue: 0.8,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        displayStepper: true,
    },
    resolution: {
        type: ControlType.Number,
        title: "Resolution",
        defaultValue: 40,
        min: 10,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    size: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 8,
        min: 1,
        max: 30,
    },
    randomSize: {
        type: ControlType.Boolean,
        title: "Random Size",
        defaultValue: false,
    },
    idleMovement: {
        type: ControlType.Number,
        title: "Idle Move",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 0.5,
    },
    lensStrength: {
        type: ControlType.Number,
        title: "Lens Strength",
        defaultValue: 5,
        min: 0,
        max: 20,
        step: 0.5,
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt Strength",
        defaultValue: 15,
        min: 0,
        max: 60,
        step: 1,
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax Str",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
    },
    hoverRadius: {
        type: ControlType.Number,
        title: "Hover Radius",
        defaultValue: 250,
        min: 50,
        max: 1000,
    },
    glowLayers: {
        type: ControlType.Enum,
        title: "Glow Effect",
        options: ["all", "first"],
        optionTitles: ["All Layers", "Front Layer Only"],
        defaultValue: "all",
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#ccff00",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive Color",
        defaultValue: "#333333",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(5, 5, 5, 1)",
    },
})
