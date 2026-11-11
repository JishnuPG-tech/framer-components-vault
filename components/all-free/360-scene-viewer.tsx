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

/**
 * User instructions:
 * "create a component where i can upload a 360 equirectangular image and i can view it as a 360 degree world.."
 */

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type Props = {
    image: ResponsiveImage
    backgroundColor: string
    autoRotate: boolean
    autoRotateSpeed: number
    initialYaw: number
    initialPitch: number
    minPitch: number
    maxPitch: number
    fov: number
    dragSensitivity: number
    invertDrag: boolean
    quality: number
    showFallbackImageOnError: boolean
    style?: React.CSSProperties
}

/**
 * 360° Scene Viewer
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SceneViewer360(props: Props) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "360 equirectangular panorama",
        },
        backgroundColor,
        autoRotate,
        autoRotateSpeed,
        initialYaw,
        initialPitch,
        minPitch,
        maxPitch,
        fov,
        dragSensitivity,
        invertDrag,
        quality,
        showFallbackImageOnError,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const inView = useInView(containerRef, { amount: 0.15 })

    const glRef = React.useRef<WebGLRenderingContext | null>(null)
    const programRef = React.useRef<WebGLProgram | null>(null)
    const buffersRef = React.useRef<{
        vbo: WebGLBuffer | null
        ibo: WebGLBuffer | null
        indexCount: number
    } | null>(null)
    const textureRef = React.useRef<WebGLTexture | null>(null)

    const rafRef = React.useRef<number | null>(null)
    const lastTimeRef = React.useRef<number>(0)

    const yawRef = React.useRef<number>((initialYaw * Math.PI) / 180)
    const pitchRef = React.useRef<number>((initialPitch * Math.PI) / 180)
    const isDraggingRef = React.useRef<boolean>(false)
    const lastPointerRef = React.useRef<{ x: number; y: number } | null>(null)

    const errorRef = React.useRef<string | null>(null)
    const [, forceRerender] = React.useReducer((x) => x + 1, 0)

    const clampPitch = React.useCallback(
        (pitchRad: number) => {
            const minR = (minPitch * Math.PI) / 180
            const maxR = (maxPitch * Math.PI) / 180
            return Math.max(minR, Math.min(maxR, pitchRad))
        },
        [minPitch, maxPitch]
    )

    React.useEffect(() => {
        yawRef.current = (initialYaw * Math.PI) / 180
        pitchRef.current = clampPitch((initialPitch * Math.PI) / 180)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialYaw, initialPitch, clampPitch])

    const stopRAF = React.useCallback(() => {
        if (rafRef.current != null && typeof window !== "undefined") {
            window.cancelAnimationFrame(rafRef.current)
        }
        rafRef.current = null
        lastTimeRef.current = 0
    }, [])

    const compileShader = React.useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
        const shader = gl.createShader(type)
        if (!shader) return null
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader)
            return null
        }
        return shader
    }, [])

    const buildProgram = React.useCallback(
        (gl: WebGLRenderingContext) => {
            const vsSource = `
attribute vec2 aPos;

uniform mat3 uRot;
uniform float uTanHalfFov;
uniform float uAspect;

varying vec2 vPos;

void main() {
    vPos = aPos;
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`.trim()

            const fsSource = `
precision highp float;

uniform sampler2D uTex;
uniform mat3 uRot;
uniform float uTanHalfFov;
uniform float uAspect;

varying vec2 vPos;

const float PI = 3.141592653589793;

void main() {
    // Build a view ray from screen position (vPos in clip space -1..1)
    vec3 ray = normalize(vec3(vPos.x * uAspect * uTanHalfFov, vPos.y * uTanHalfFov, -1.0));

    // Rotate ray into world space
    vec3 dir = uRot * ray;

    // Convert direction to equirectangular UV
    float lon = atan(dir.z, dir.x);
    float lat = asin(clamp(dir.y, -1.0, 1.0));

    float u = lon / (2.0 * PI) + 0.5;
    float v = 0.5 - lat / PI;

    vec2 uv = vec2(u, v);
    gl_FragColor = texture2D(uTex, uv);
}
`.trim()

            const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource)
            const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)
            if (!vs || !fs) return null

            const prog = gl.createProgram()
            if (!prog) return null

            gl.attachShader(prog, vs)
            gl.attachShader(prog, fs)
            gl.linkProgram(prog)

            gl.deleteShader(vs)
            gl.deleteShader(fs)

            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                gl.deleteProgram(prog)
                return null
            }

            return prog
        },
        [compileShader]
    )

    const createSphereMesh = React.useCallback(() => {
        // Fullscreen quad (two triangles) in clip space
        const vertexData = new Float32Array([
            -1, -1,
            1, -1,
            1, 1,
            -1, 1,
        ])

        const indexData = new Uint16Array([0, 1, 2, 0, 2, 3])
        return { vertexData, indexData, indexCount: indexData.length, useUint32: false }
    }, [])

    const ensureGL = React.useCallback(() => {
        if (typeof window === "undefined") return false
        const canvas = canvasRef.current
        if (!canvas) return false

        let gl = glRef.current
        if (!gl) {
            gl =
                (canvas.getContext("webgl", {
                    alpha: true,
                    antialias: true,
                    premultipliedAlpha: true,
                    preserveDrawingBuffer: false,
                }) as WebGLRenderingContext | null) || null
            glRef.current = gl
        }
        if (!gl) return false

        if (!programRef.current) {
            const program = buildProgram(gl)
            if (!program) return false
            programRef.current = program
        }

        if (!buffersRef.current) {
            const mesh = createSphereMesh()

            const vbo = gl.createBuffer()
            const ibo = gl.createBuffer()
            if (!vbo || !ibo) return false

            gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
            gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexData, gl.STATIC_DRAW)

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indexData, gl.STATIC_DRAW)

            buffersRef.current = { vbo, ibo, indexCount: mesh.indexCount }
        }

        if (!textureRef.current) {
            const tex = gl.createTexture()
            if (!tex) return false
            textureRef.current = tex

            gl.bindTexture(gl.TEXTURE_2D, tex)
            // 1x1 placeholder
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]))
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            // Default to NPOT-safe params; updated after image upload based on dimensions
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        }

        return true
    }, [buildProgram, createSphereMesh])

    const updateCanvasSize = React.useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const rect = container.getBoundingClientRect()
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const scale = Math.max(0.5, Math.min(2, quality)) * dpr

        const w = Math.max(1, Math.floor(rect.width * scale))
        const h = Math.max(1, Math.floor(rect.height * scale))

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w
            canvas.height = h
            canvas.style.width = "100%"
            canvas.style.height = "100%"
        }
    }, [quality])

    const loadTextureFromSrc = React.useCallback((src: string) => {
        const gl = glRef.current
        const tex = textureRef.current
        if (!gl || !tex) return

        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
            if (!glRef.current || !textureRef.current) return
            try {
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

                const isPowerOf2 = (v: number) => (v & (v - 1)) === 0
                const pot = isPowerOf2(img.width) && isPowerOf2(img.height)

                if (pot) {
                    gl.generateMipmap(gl.TEXTURE_2D)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                } else {
                    // NPOT textures cannot use mipmaps or REPEAT wrapping in WebGL1
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                }
                errorRef.current = null
                forceRerender()
            } catch (e) {
                errorRef.current = "Failed to upload image texture to WebGL (possibly CORS restricted)."
                forceRerender()
            }
        }

        img.onerror = () => {
            errorRef.current = "Failed to load the image."
            forceRerender()
        }

        img.src = src
    }, [])

    const drawFrame = React.useCallback(() => {
        const ok = ensureGL()
        if (!ok) return

        const gl = glRef.current
        const program = programRef.current
        const buffers = buffersRef.current
        const tex = textureRef.current
        const canvas = canvasRef.current
        if (!gl || !program || !buffers || !tex || !canvas) return

        updateCanvasSize()
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.disable(gl.CULL_FACE)
        gl.disable(gl.DEPTH_TEST)

        gl.useProgram(program)

        const aPos = gl.getAttribLocation(program, "aPos")

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vbo)
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 8, 0)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.ibo)

        // Rotation matrix from yaw/pitch
        const yaw = yawRef.current
        const pitch = pitchRef.current

        const cy = Math.cos(yaw)
        const sy = Math.sin(yaw)
        const cp = Math.cos(pitch)
        const sp = Math.sin(pitch)

        // R = Ry * Rx
        // Ry = [ cy 0 sy; 0 1 0; -sy 0 cy ]
        // Rx = [ 1 0 0; 0 cp -sp; 0 sp cp ]
        const r00 = cy
        const r01 = sy * sp
        const r02 = sy * cp
        const r10 = 0
        const r11 = cp
        const r12 = -sp
        const r20 = -sy
        const r21 = cy * sp
        const r22 = cy * cp

        const uRot = gl.getUniformLocation(program, "uRot")
        const uTanHalfFov = gl.getUniformLocation(program, "uTanHalfFov")
        const uAspect = gl.getUniformLocation(program, "uAspect")
        const uTex = gl.getUniformLocation(program, "uTex")

        const aspect = canvas.width / canvas.height
        const fovRad = (Math.max(20, Math.min(110, fov)) * Math.PI) / 180
        const tanHalfFov = Math.tan(fovRad * 0.5)

        gl.uniformMatrix3fv(uRot, false, new Float32Array([r00, r10, r20, r01, r11, r21, r02, r12, r22]))
        gl.uniform1f(uTanHalfFov, tanHalfFov)
        gl.uniform1f(uAspect, aspect)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.uniform1i(uTex, 0)

        gl.drawElements(gl.TRIANGLES, buffers.indexCount, gl.UNSIGNED_SHORT, 0)
    }, [ensureGL, fov, updateCanvasSize])

    const animate = React.useCallback(
        (t: number) => {
            if (typeof window === "undefined") return
            rafRef.current = window.requestAnimationFrame(animate)

            if (!inView || isStatic) return

            const last = lastTimeRef.current || t
            const dt = Math.min(0.05, Math.max(0, (t - last) / 1000))
            lastTimeRef.current = t

            if (autoRotate && !isDraggingRef.current) {
                yawRef.current += ((autoRotateSpeed * Math.PI) / 180) * dt
            }

            drawFrame()
        },
        [autoRotate, autoRotateSpeed, drawFrame, inView, isStatic]
    )

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        const ok = ensureGL()
        if (ok) {
            loadTextureFromSrc(image?.src)
            drawFrame()
        }

        stopRAF()
        rafRef.current = window.requestAnimationFrame(animate)

        return () => stopRAF()
    }, [animate, drawFrame, ensureGL, image?.src, isStatic, loadTextureFromSrc, stopRAF])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const el = containerRef.current
        if (!el) return

        const ro = new ResizeObserver(() => {
            updateCanvasSize()
            drawFrame()
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [drawFrame, updateCanvasSize])

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent) => {
            if (isStatic) return
            if (!canvasRef.current) return
            canvasRef.current.setPointerCapture?.(e.pointerId)
            isDraggingRef.current = true
            lastPointerRef.current = { x: e.clientX, y: e.clientY }
        },
        [isStatic]
    )

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (isStatic) return
            if (!isDraggingRef.current) return
            const last = lastPointerRef.current
            if (!last) return

            const dx = e.clientX - last.x
            const dy = e.clientY - last.y
            lastPointerRef.current = { x: e.clientX, y: e.clientY }

            const sign = invertDrag ? -1 : 1
            const sens = Math.max(0.05, Math.min(3, dragSensitivity))

            // pixels -> radians
            yawRef.current += sign * dx * 0.0025 * sens
            pitchRef.current = clampPitch(pitchRef.current + sign * dy * 0.0020 * sens)

            drawFrame()
        },
        [clampPitch, dragSensitivity, drawFrame, invertDrag, isStatic]
    )

    const onPointerUp = React.useCallback((e: React.PointerEvent) => {
        if (isStatic) return
        try {
            canvasRef.current?.releasePointerCapture?.(e.pointerId)
        } catch {
            // ignore
        }
        isDraggingRef.current = false
        lastPointerRef.current = null
    }, [isStatic])

    const hasError = !!errorRef.current
    const shouldFallback = hasError && showFallbackImageOnError

    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    backgroundColor,
                    ...style,
                }}
            >
                <img
                    src={image?.src}
                    alt={image?.alt || "360 panorama"}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                touchAction: "none",
                ...style,
            }}
            aria-label="360° Scene Viewer"
            role="application"
        >
            {!shouldFallback && (
                <canvas
                    ref={canvasRef}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                />
            )}

            {shouldFallback && (
                <img
                    src={image?.src}
                    alt={image?.alt || "360 panorama"}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                    draggable={false}
                />
            )}

            {hasError && (
                <div
                    style={{
                        position: "absolute",
                        left: 12,
                        right: 12,
                        bottom: 12,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontSize: 12,
                        lineHeight: "1.3em",
                        pointerEvents: "none",
                    }}
                    aria-live="polite"
                >
                    {errorRef.current}
                </div>
            )}
        </div>
    )
}

addPropertyControls(SceneViewer360, {
    image: { type: ControlType.ResponsiveImage, title: "360 Image" },
    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#000000" },
    autoRotate: { type: ControlType.Boolean, title: "Auto Rotate", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Rotate Speed",
        defaultValue: 8,
        min: -60,
        max: 60,
        step: 1,
        unit: "deg/s",
    },
    initialYaw: { type: ControlType.Number, title: "Initial Yaw", defaultValue: 0, min: -180, max: 180, step: 1, unit: "deg" },
    initialPitch: { type: ControlType.Number, title: "Initial Pitch", defaultValue: 0, min: -80, max: 80, step: 1, unit: "deg" },
    minPitch: { type: ControlType.Number, title: "Min Pitch", defaultValue: -70, min: -89, max: 0, step: 1, unit: "deg" },
    maxPitch: { type: ControlType.Number, title: "Max Pitch", defaultValue: 70, min: 0, max: 89, step: 1, unit: "deg" },
    fov: { type: ControlType.Number, title: "FOV", defaultValue: 75, min: 20, max: 110, step: 1, unit: "deg" },
    dragSensitivity: { type: ControlType.Number, title: "Drag Sens.", defaultValue: 1, min: 0.1, max: 3, step: 0.1 },
    invertDrag: { type: ControlType.Boolean, title: "Invert Drag", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    quality: { type: ControlType.Number, title: "Quality", defaultValue: 1, min: 0.5, max: 2, step: 0.1 },
    showFallbackImageOnError: {
        type: ControlType.Boolean,
        title: "Fallback",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})

SceneViewer360.displayName = "360° Scene Viewer"