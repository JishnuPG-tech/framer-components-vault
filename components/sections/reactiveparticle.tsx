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

import { useInView } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type Props = {
    image: ResponsiveImage
    backgroundColor: string

    resolution: number
    maxParticles: number

    particleSize: number
    idleMotion: number
    idleSpeed: number

    brushSize: number
    interactionStrength: number
    scatterForce: number
    zBounce: number

    returnSpeed: number
    friction: number
    sleepThreshold: number

    imageScale: number

    brightness: number
    contrast: number
    saturation: number

    removeWhite: boolean
    whiteThreshold: number

    showFallbackImage: boolean

    style?: React.CSSProperties
}

/**
 * User instructions:
 * Create a React/WebGL-powered particle system that converts any image into an interactive field of animated particles.
 * Responds to cursor movement with fluid motion, depth, and scattering effects while maintaining high performance.
 * Image-to-particle rendering with adjustable density, idle organic motion, sleep optimization, fully responsive.
 * Customization controls: resolution, particle size/idle, brush size/strength, scatter/z-bounce, return speed/friction,
 * image scale/bg color, brightness/contrast/saturation, optional white background removal.
 */

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ReactiveParticleImage(props: Props) {
    const {
        image = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        },
        backgroundColor,
        resolution,
        maxParticles,
        particleSize,
        idleMotion,
        idleSpeed,
        brushSize,
        interactionStrength,
        scatterForce,
        zBounce,
        returnSpeed,
        friction,
        sleepThreshold,
        imageScale,
        brightness,
        contrast,
        saturation,
        removeWhite,
        whiteThreshold,
        showFallbackImage,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const inView = useInView(rootRef, { amount: 0.1 })

    const glRef = React.useRef<WebGLRenderingContext | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const resizeObsRef = React.useRef<ResizeObserver | null>(null)

    const programRef = React.useRef<WebGLProgram | null>(null)
    const bufferPosRef = React.useRef<WebGLBuffer | null>(null)
    const bufferColorRef = React.useRef<WebGLBuffer | null>(null)

    const aPosRef = React.useRef<number>(-1)
    const aColorRef = React.useRef<number>(-1)
    const uResolutionRef = React.useRef<WebGLUniformLocation | null>(null)
    const uPointSizeRef = React.useRef<WebGLUniformLocation | null>(null)

    const particleCountRef = React.useRef<number>(0)

    // CPU simulation buffers
    const basePosRef = React.useRef<Float32Array | null>(null) // xyz
    const posRef = React.useRef<Float32Array | null>(null) // xyz
    const velRef = React.useRef<Float32Array | null>(null) // xyz
    const colorRef = React.useRef<Float32Array | null>(null) // rgb
    const seedRef = React.useRef<Float32Array | null>(null) // random per particle

    const sleepingRef = React.useRef<Uint8Array | null>(null)

    const pointerRef = React.useRef({
        active: false,
        x: 0,
        y: 0,
        // normalized to canvas pixels
        px: 0,
        py: 0,
        // velocity
        vx: 0,
        vy: 0,
        lastPx: 0,
        lastPy: 0,
        lastT: 0,
        inside: false,
        down: false,
    })

    const layoutRef = React.useRef({
        w: 1,
        h: 1,
        dpr: 1,
    })

    const imgRef = React.useRef<HTMLImageElement | null>(null)
    const imgKey = `${image?.src || ""}|${resolution}|${maxParticles}|${imageScale}|${brightness}|${contrast}|${saturation}|${removeWhite ? 1 : 0}|${whiteThreshold}`

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

    const createShader = React.useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
        const shader = gl.createShader(type)
        if (!shader) return null
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        if (!ok) {
            gl.deleteShader(shader)
            return null
        }
        return shader
    }, [])

    const createProgram = React.useCallback(
        (gl: WebGLRenderingContext) => {
            const vsSource = `
attribute vec3 a_pos;
attribute vec3 a_color;

uniform vec2 u_resolution;
uniform float u_pointSize;

varying vec3 v_color;

void main() {
    // a_pos.xy is in pixels, centered at (0,0) with +y down? We'll pass centered pixels with +y down.
    // Convert to clip space
    float x = a_pos.x / (u_resolution.x * 0.5);
    float y = -a_pos.y / (u_resolution.y * 0.5);
    float z = a_pos.z;

    gl_Position = vec4(x, y, 0.0, 1.0);

    float depth = 1.0 + (z * 0.25);
    gl_PointSize = max(1.0, u_pointSize * depth);

    v_color = a_color;
}
`.trim()

            const fsSource = `
precision mediump float;

varying vec3 v_color;

void main() {
    // Soft circular point
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    float alpha = smoothstep(1.0, 0.65, r2);
    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(v_color, alpha);
}
`.trim()

            const vs = createShader(gl, gl.VERTEX_SHADER, vsSource)
            const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
            if (!vs || !fs) return null

            const program = gl.createProgram()
            if (!program) return null
            gl.attachShader(program, vs)
            gl.attachShader(program, fs)
            gl.linkProgram(program)

            gl.deleteShader(vs)
            gl.deleteShader(fs)

            const ok = gl.getProgramParameter(program, gl.LINK_STATUS)
            if (!ok) {
                gl.deleteProgram(program)
                return null
            }
            return program
        },
        [createShader]
    )

    const ensureGL = React.useCallback(() => {
        if (typeof window === "undefined") return null
        const canvas = canvasRef.current
        if (!canvas) return null

        let gl = glRef.current
        if (gl && programRef.current && bufferPosRef.current && bufferColorRef.current) return gl

        gl = (canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
        }) as WebGLRenderingContext | null)!

        if (!gl) return null
        glRef.current = gl

        const program = createProgram(gl)
        if (!program) return null
        programRef.current = program

        const aPos = gl.getAttribLocation(program, "a_pos")
        const aColor = gl.getAttribLocation(program, "a_color")
        aPosRef.current = aPos
        aColorRef.current = aColor

        uResolutionRef.current = gl.getUniformLocation(program, "u_resolution")
        uPointSizeRef.current = gl.getUniformLocation(program, "u_pointSize")

        bufferPosRef.current = gl.createBuffer()
        bufferColorRef.current = gl.createBuffer()

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        return gl
    }, [createProgram])

    const setCanvasSize = React.useCallback(() => {
        if (typeof window === "undefined") return
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return

        const rect = root.getBoundingClientRect()
        const w = Math.max(1, Math.floor(rect.width))
        const h = Math.max(1, Math.floor(rect.height))
        const dpr = clamp(window.devicePixelRatio || 1, 1, 2)

        layoutRef.current.w = w
        layoutRef.current.h = h
        layoutRef.current.dpr = dpr

        const targetW = Math.max(1, Math.floor(w * dpr))
        const targetH = Math.max(1, Math.floor(h * dpr))

        if (canvas.width !== targetW) canvas.width = targetW
        if (canvas.height !== targetH) canvas.height = targetH

        const gl = glRef.current
        if (gl) {
            gl.viewport(0, 0, canvas.width, canvas.height)
        }
    }, [])

    const applyColorAdjustments = React.useCallback(
        (r: number, g: number, b: number) => {
            // r,g,b in [0..255]
            let rf = r / 255
            let gf = g / 255
            let bf = b / 255

            // brightness: -1..1
            const br = brightness
            rf = clamp01(rf + br)
            gf = clamp01(gf + br)
            bf = clamp01(bf + br)

            // contrast: 0..2 (we expose 0..2)
            const ct = contrast
            rf = clamp01((rf - 0.5) * ct + 0.5)
            gf = clamp01((gf - 0.5) * ct + 0.5)
            bf = clamp01((bf - 0.5) * ct + 0.5)

            // saturation: 0..2
            const sat = saturation
            const l = rf * 0.2126 + gf * 0.7152 + bf * 0.0722
            rf = clamp01(l + (rf - l) * sat)
            gf = clamp01(l + (gf - l) * sat)
            bf = clamp01(l + (bf - l) * sat)

            return [rf, gf, bf] as const
        },
        [brightness, contrast, saturation]
    )

    const buildParticlesFromImage = React.useCallback(async () => {
        if (typeof window === "undefined") return
        const root = rootRef.current
        if (!root) return

        const w = Math.max(1, Math.floor(layoutRef.current.w))
        const h = Math.max(1, Math.floor(layoutRef.current.h))
        if (w <= 1 || h <= 1) return

        const src = image?.src
        if (!src) return

        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.src = src

        await new Promise<void>((resolve, reject) => {
            const onLoad = () => resolve()
            const onErr = () => reject(new Error("Image failed to load"))
            img.onload = onLoad
            img.onerror = onErr
        }).catch(() => {})

        if (!img.naturalWidth || !img.naturalHeight) return
        imgRef.current = img

        // Fit image into component with imageScale
        const iw = img.naturalWidth
        const ih = img.naturalHeight
        const aspectImg = iw / ih
        const aspectBox = w / h

        let drawW = w
        let drawH = h
        if (aspectImg > aspectBox) {
            drawW = w
            drawH = Math.round(w / aspectImg)
        } else {
            drawH = h
            drawW = Math.round(h * aspectImg)
        }

        drawW = Math.max(1, Math.floor(drawW * imageScale))
        drawH = Math.max(1, Math.floor(drawH * imageScale))

        // Offscreen sampling resolution based on "resolution" step
        const step = clamp(Math.floor(resolution), 2, 20)
        const sampleW = Math.max(1, Math.floor(drawW / step))
        const sampleH = Math.max(1, Math.floor(drawH / step))

        const off = document.createElement("canvas")
        off.width = sampleW
        off.height = sampleH
        const ctx = off.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        ctx.clearRect(0, 0, sampleW, sampleH)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, sampleW, sampleH)

        const data = ctx.getImageData(0, 0, sampleW, sampleH).data

        // Determine particle positions centered in the component.
        const offsetX = Math.round((w - drawW) * 0.5)
        const offsetY = Math.round((h - drawH) * 0.5)

        // Map sampling pixels back to component pixels
        const scaleX = drawW / sampleW
        const scaleY = drawH / sampleH

        // First pass: count eligible pixels
        const threshold = clamp(whiteThreshold, 0.7, 1.0)
        const maxN = clamp(Math.floor(maxParticles), 500, 200000)

        let indices: number[] = []
        indices.length = 0

        for (let y = 0; y < sampleH; y++) {
            for (let x = 0; x < sampleW; x++) {
                const i = (y * sampleW + x) * 4
                const a = data[i + 3] / 255
                if (a <= 0.05) continue

                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]

                if (removeWhite) {
                    const rf = r / 255
                    const gf = g / 255
                    const bf = b / 255
                    if (rf >= threshold && gf >= threshold && bf >= threshold) continue
                }

                indices.push(i)
            }
        }

        if (indices.length === 0) {
            particleCountRef.current = 0
            basePosRef.current = null
            posRef.current = null
            velRef.current = null
            colorRef.current = null
            seedRef.current = null
            sleepingRef.current = null
            return
        }

        // If too many, randomly downsample for performance
        if (indices.length > maxN) {
            // Fisher-Yates partial shuffle
            for (let i = indices.length - 1; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0
                const tmp = indices[i]
                indices[i] = indices[j]
                indices[j] = tmp
            }
            indices = indices.slice(0, maxN)
        }

        const n = indices.length
        const basePos = new Float32Array(n * 3)
        const pos = new Float32Array(n * 3)
        const vel = new Float32Array(n * 3)
        const col = new Float32Array(n * 3)
        const seed = new Float32Array(n)
        const sleeping = new Uint8Array(n)

        for (let k = 0; k < n; k++) {
            const i = indices[k]
            const pixelIndex = i / 4
            const x = pixelIndex % sampleW
            const y = (pixelIndex / sampleW) | 0

            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            const [rf, gf, bf] = applyColorAdjustments(r, g, b)

            const px = offsetX + (x + 0.5) * scaleX
            const py = offsetY + (y + 0.5) * scaleY

            // center-origin in pixels (0,0 at center of component), y positive down
            const cx = px - w * 0.5
            const cy = py - h * 0.5

            const idx = k * 3
            basePos[idx + 0] = cx
            basePos[idx + 1] = cy
            basePos[idx + 2] = 0

            // Start at base (stable)
            pos[idx + 0] = cx
            pos[idx + 1] = cy
            pos[idx + 2] = 0

            vel[idx + 0] = 0
            vel[idx + 1] = 0
            vel[idx + 2] = 0

            col[idx + 0] = rf
            col[idx + 1] = gf
            col[idx + 2] = bf

            seed[k] = Math.random()
            sleeping[k] = 1
        }

        particleCountRef.current = n
        basePosRef.current = basePos
        posRef.current = pos
        velRef.current = vel
        colorRef.current = col
        seedRef.current = seed
        sleepingRef.current = sleeping

        // Upload color once
        const gl = ensureGL()
        if (!gl) return
        const program = programRef.current
        const bufferColor = bufferColorRef.current
        if (!program || !bufferColor) return

        gl.useProgram(program)
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor)
        gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW)
    }, [
        image?.src,
        resolution,
        maxParticles,
        imageScale,
        brightness,
        contrast,
        saturation,
        removeWhite,
        whiteThreshold,
        applyColorAdjustments,
        ensureGL,
    ])

    const uploadPositions = React.useCallback(() => {
        const gl = glRef.current
        const program = programRef.current
        const bufferPos = bufferPosRef.current
        const pos = posRef.current
        if (!gl || !program || !bufferPos || !pos) return

        gl.useProgram(program)
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos)
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW)
    }, [])

    const draw = React.useCallback(() => {
        const gl = glRef.current
        const program = programRef.current
        const bufferPos = bufferPosRef.current
        const bufferColor = bufferColorRef.current
        const n = particleCountRef.current
        if (!gl || !program || !bufferPos || !bufferColor || n <= 0) return

        const canvas = canvasRef.current
        if (!canvas) return

        gl.viewport(0, 0, canvas.width, canvas.height)

        // Clear with transparent; root handles background color
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.useProgram(program)

        const uRes = uResolutionRef.current
        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)

        const uPS = uPointSizeRef.current
        const dpr = layoutRef.current.dpr
        if (uPS) gl.uniform1f(uPS, particleSize * dpr)

        // a_pos
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos)
        gl.enableVertexAttribArray(aPosRef.current)
        gl.vertexAttribPointer(aPosRef.current, 3, gl.FLOAT, false, 0, 0)

        // a_color
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor)
        gl.enableVertexAttribArray(aColorRef.current)
        gl.vertexAttribPointer(aColorRef.current, 3, gl.FLOAT, false, 0, 0)

        gl.drawArrays(gl.POINTS, 0, n)
    }, [particleSize])

    const tick = React.useCallback(
        (t: number) => {
            rafRef.current = null

            const gl = glRef.current
            if (!gl) return

            const basePos = basePosRef.current
            const pos = posRef.current
            const vel = velRef.current
            const seed = seedRef.current
            const sleeping = sleepingRef.current
            const n = particleCountRef.current

            if (!basePos || !pos || !vel || !seed || !sleeping || n <= 0) {
                draw()
                return
            }

            const p = pointerRef.current
            const w = layoutRef.current.w * layoutRef.current.dpr
            const h = layoutRef.current.h * layoutRef.current.dpr

            // time step (ms -> s)
            const lastT = (tick as any)._lastT as number | undefined
            const dt = clamp(((t - (lastT ?? t)) * 0.001) || 0, 0, 0.033)
            ;(tick as any)._lastT = t

            const rs = clamp(returnSpeed, 0, 30)
            const fr = clamp(friction, 0, 10)
            const frMul = Math.exp(-fr * dt)

            const bs = clamp(brushSize, 1, 2000) * layoutRef.current.dpr
            const bs2 = bs * bs

            const strength = clamp(interactionStrength, 0, 20)
            const scatter = clamp(scatterForce, 0, 20)
            const zb = clamp(zBounce, 0, 20)

            const idleA = clamp(idleMotion, 0, 30) * layoutRef.current.dpr
            const idleS = clamp(idleSpeed, 0, 5)

            const sleepEps = clamp(sleepThreshold, 0.0001, 0.2)

            // Pointer state in centered pixel coords (dpr space)
            // Convert stored pointer px/py (CSS pixels) to dpr pixels, then center-origin
            const px = (p.px * layoutRef.current.dpr - w * 0.5) || 0
            const py = (p.py * layoutRef.current.dpr - h * 0.5) || 0
            const pvx = (p.vx * layoutRef.current.dpr) || 0
            const pvy = (p.vy * layoutRef.current.dpr) || 0

            const pointerActive = (p.inside && (p.down || p.active)) && strength > 0

            // Update
            for (let i = 0; i < n; i++) {
                const idx = i * 3

                // If sleeping and no pointer interaction, skip.
                if (sleeping[i] === 1 && !pointerActive && idleA <= 0) continue

                const x = pos[idx + 0]
                const y = pos[idx + 1]
                const z = pos[idx + 2]

                // Spring to base
                const bx = basePos[idx + 0]
                const by = basePos[idx + 1]
                const bz = basePos[idx + 2]

                let vx = vel[idx + 0]
                let vy = vel[idx + 1]
                let vz = vel[idx + 2]

                // Idle motion (small orbital wobble around base)
                if (idleA > 0) {
                    const s = seed[i]
                    const ph = (t * 0.001 * idleS + s * 6.2831853) % 6.2831853
                    const ix = Math.cos(ph) * idleA
                    const iy = Math.sin(ph * 0.97) * idleA
                    // Pull towards (base + idleOffset)
                    vx += ((bx + ix) - x) * (rs * 0.25) * dt
                    vy += ((by + iy) - y) * (rs * 0.25) * dt
                }

                vx += (bx - x) * rs * dt
                vy += (by - y) * rs * dt
                vz += (bz - z) * (rs * 0.75) * dt

                // Pointer brush
                if (pointerActive) {
                    const dx = x - px
                    const dy = y - py
                    const d2 = dx * dx + dy * dy
                    if (d2 < bs2) {
                        const d = Math.sqrt(d2) + 0.0001
                        const falloff = 1 - d / bs

                        // Radial push away + cursor-velocity influence for "trail"
                        const nx = dx / d
                        const ny = dy / d

                        const push = (scatter * falloff + strength * falloff) * 40 * dt
                        vx += nx * push
                        vy += ny * push

                        // Cursor velocity causes lateral smear
                        vx += -pvx * falloff * strength * 2 * dt
                        vy += -pvy * falloff * strength * 2 * dt

                        // Z bounce
                        vz += (zb * falloff) * 25 * dt

                        sleeping[i] = 0
                    }
                }

                // Friction
                vx *= frMul
                vy *= frMul
                vz *= frMul

                // Integrate
                let nxp = x + vx
                let nyp = y + vy
                let nzp = z + vz

                // Soft constrain z
                if (nzp > 80 * layoutRef.current.dpr) {
                    nzp = 80 * layoutRef.current.dpr
                    vz *= -0.2
                } else if (nzp < -80 * layoutRef.current.dpr) {
                    nzp = -80 * layoutRef.current.dpr
                    vz *= -0.2
                }

                pos[idx + 0] = nxp
                pos[idx + 1] = nyp
                pos[idx + 2] = nzp

                vel[idx + 0] = vx
                vel[idx + 1] = vy
                vel[idx + 2] = vz

                // Sleep check
                if (!pointerActive) {
                    const dx0 = bx - nxp
                    const dy0 = by - nyp
                    const dz0 = bz - nzp
                    const err = dx0 * dx0 + dy0 * dy0 + dz0 * dz0
                    const vv = vx * vx + vy * vy + vz * vz
                    if (err < sleepEps * sleepEps * 100 && vv < sleepEps * sleepEps) {
                        sleeping[i] = 1
                        pos[idx + 0] = bx
                        pos[idx + 1] = by
                        pos[idx + 2] = bz
                        vel[idx + 0] = 0
                        vel[idx + 1] = 0
                        vel[idx + 2] = 0
                    }
                }
            }

            uploadPositions()
            draw()

            if (inView && !isStatic) {
                rafRef.current = window.requestAnimationFrame(tick)
            }
        },
        [
            brushSize,
            interactionStrength,
            scatterForce,
            zBounce,
            returnSpeed,
            friction,
            idleMotion,
            idleSpeed,
            sleepThreshold,
            uploadPositions,
            draw,
            inView,
            isStatic,
        ]
    )

    const start = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) return
        rafRef.current = window.requestAnimationFrame(tick)
    }, [tick])

    const stop = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) {
            window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    // Init GL + resize observer
    React.useEffect(() => {
        if (typeof window === "undefined") return
        setCanvasSize()
        ensureGL()

        const root = rootRef.current
        if (!root) return

        const ro = new ResizeObserver(() => {
            setCanvasSize()
            // Rebuild particles to preserve correct centering/scaling
            buildParticlesFromImage()
        })
        ro.observe(root)
        resizeObsRef.current = ro

        return () => {
            ro.disconnect()
            resizeObsRef.current = null
        }
    }, [ensureGL, setCanvasSize, buildParticlesFromImage])

    // Build particles whenever relevant props change
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        setCanvasSize()
        ensureGL()
        buildParticlesFromImage()
    }, [imgKey, isStatic, setCanvasSize, ensureGL, buildParticlesFromImage])

    // Animation lifecycle
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        if (inView) start()
        else stop()

        return () => stop()
    }, [inView, start, stop, isStatic])

    // Pointer handlers
    const updatePointerFromEvent = React.useCallback((clientX: number, clientY: number) => {
        const root = rootRef.current
        if (!root) return

        const rect = root.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top

        const p = pointerRef.current
        const now = typeof performance !== "undefined" ? performance.now() : Date.now()
        const dt = Math.max(8, now - (p.lastT || now))
        const inv = 1 / dt

        p.lastT = now
        p.vx = (x - (p.lastPx || x)) * inv * 16.67
        p.vy = (y - (p.lastPy || y)) * inv * 16.67
        p.lastPx = x
        p.lastPy = y

        p.px = x
        p.py = y
        p.active = true
    }, [])

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            updatePointerFromEvent(e.clientX, e.clientY)
            pointerRef.current.inside = true
            if (!isStatic && inView) start()
        },
        [updatePointerFromEvent, start, inView, isStatic]
    )

    const onPointerEnter = React.useCallback(() => {
        pointerRef.current.inside = true
    }, [])

    const onPointerLeave = React.useCallback(() => {
        const p = pointerRef.current
        p.inside = false
        p.active = false
        p.down = false
        p.vx = 0
        p.vy = 0
    }, [])

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent) => {
            pointerRef.current.down = true
            updatePointerFromEvent(e.clientX, e.clientY)
            try {
                ;(e.currentTarget as any).setPointerCapture?.(e.pointerId)
            } catch {}
            if (!isStatic && inView) start()
        },
        [updatePointerFromEvent, start, inView, isStatic]
    )

    const onPointerUp = React.useCallback(() => {
        pointerRef.current.down = false
    }, [])

    // Static renderer fallback: show image only (optional)
    const fallback = showFallbackImage ? (
        <img
            src={image?.src}
            srcSet={image?.srcSet}
            alt={image?.alt || ""}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 1,
                pointerEvents: "none",
                userSelect: "none",
            }}
            draggable={false}
        />
    ) : null

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                touchAction: "none",
                ...style,
            }}
            onPointerMove={isStatic ? undefined : onPointerMove}
            onPointerEnter={isStatic ? undefined : onPointerEnter}
            onPointerLeave={isStatic ? undefined : onPointerLeave}
            onPointerDown={isStatic ? undefined : onPointerDown}
            onPointerUp={isStatic ? undefined : onPointerUp}
            role="img"
            aria-label={image?.alt || "Particle image"}
        >
            {(isStatic || !inView) && fallback}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

addPropertyControls(ReactiveParticleImage, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },

    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },

    resolution: {
        type: ControlType.Number,
        title: "Resolution",
        defaultValue: 5,
        min: 2,
        max: 20,
        step: 1,
        unit: "px",
    },
    maxParticles: {
        type: ControlType.Number,
        title: "Max Particles",
        defaultValue: 60000,
        min: 500,
        max: 200000,
        step: 500,
    },

    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 2.2,
        min: 1,
        max: 10,
        step: 0.1,
        unit: "px",
    },
    idleMotion: {
        type: ControlType.Number,
        title: "Idle Motion",
        defaultValue: 2,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "px",
    },
    idleSpeed: {
        type: ControlType.Number,
        title: "Idle Speed",
        defaultValue: 0.9,
        min: 0,
        max: 5,
        step: 0.1,
    },

    brushSize: {
        type: ControlType.Number,
        title: "Brush Size",
        defaultValue: 120,
        min: 10,
        max: 800,
        step: 5,
        unit: "px",
    },
    interactionStrength: {
        type: ControlType.Number,
        title: "Interaction",
        defaultValue: 3,
        min: 0,
        max: 20,
        step: 0.25,
    },
    scatterForce: {
        type: ControlType.Number,
        title: "Scatter",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 0.25,
    },
    zBounce: {
        type: ControlType.Number,
        title: "Z Bounce",
        defaultValue: 3,
        min: 0,
        max: 20,
        step: 0.25,
    },

    returnSpeed: {
        type: ControlType.Number,
        title: "Return Speed",
        defaultValue: 7,
        min: 0,
        max: 30,
        step: 0.25,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        defaultValue: 3.5,
        min: 0,
        max: 10,
        step: 0.1,
    },
    sleepThreshold: {
        type: ControlType.Number,
        title: "Sleep",
        defaultValue: 0.03,
        min: 0.001,
        max: 0.2,
        step: 0.001,
    },

    imageScale: {
        type: ControlType.Number,
        title: "Image Scale",
        defaultValue: 1,
        min: 0.5,
        max: 1.8,
        step: 0.01,
    },

    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        defaultValue: 0,
        min: -1,
        max: 1,
        step: 0.01,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
    },
    saturation: {
        type: ControlType.Number,
        title: "Saturation",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
    },

    removeWhite: {
        type: ControlType.Boolean,
        title: "Remove White",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    whiteThreshold: {
        type: ControlType.Number,
        title: "White Thresh",
        defaultValue: 0.92,
        min: 0.7,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.removeWhite,
    },

    showFallbackImage: {
        type: ControlType.Boolean,
        title: "Fallback Image",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})