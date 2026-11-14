// crafted for Framer by nuwebu.com //
// v1.0.3

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

type Props = {
    speed: number
    brightness: number
    animate: boolean
    layerCount: number
    wavesPerLayer: number
    redColor: string
    greenColor: string
    blueColor: string
    softness: number
    amplitude: number
    rotation: number
    offsetX: number
    offsetY: number
    layerSpacing: number
    seed: number
    phase: number
    frequency: number
    style?: React.CSSProperties
}

const VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = (aPosition + 1.0) * 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 iResolution;
uniform float iTime;
uniform float uBrightness;
uniform float uSoftness;
uniform float uAmplitude;
uniform vec3 uRedColor;
uniform vec3 uGreenColor;
uniform vec3 uBlueColor;

uniform float uRotation;
uniform vec2 uOffset;
uniform int uLayerCount;
uniform int uWavesPerLayer;
uniform float uLayerSpacing;
uniform float uSeed;
uniform float uPhase;
uniform float uFrequency;

const int MAX_LAYERS = 6;
const int MAX_WAVES = 3;

float dist1(float a, float b) {
    return abs(a - b);
}

float vFn(in vec2 uv, float d, float o){
    // original: 1.0-smoothstep(0.0, d, distance(uv.x, 0.5 + sin(o+uv.y*3.0)*0.3));
    float x = 0.5 + sin(o + uv.y * 3.0 * uFrequency + uSeed + uPhase) * 0.3 * uAmplitude;
    return 1.0 - smoothstep(0.0, d, dist1(uv.x, x));
}

vec3 bFn(vec2 uv, float o) {
    float d = 0.05 + abs(sin(o * 0.2 + uSeed * 0.5 + uPhase * 0.5)) * 0.25 * dist1(uv.y + 0.5, 0.0);

    float r = vFn(uv + vec2(d * 0.25, 0.0), uSoftness, o);
    float g = vFn(uv - vec2(0.015, 0.005), uSoftness, o);
    float b = vFn(uv - vec2(d * 0.5, 0.015), uSoftness, o);

    vec3 col = vec3(0.0);
    if (uWavesPerLayer >= 1) col += r * uRedColor;
    if (uWavesPerLayer >= 2) col += g * uGreenColor;
    if (uWavesPerLayer >= 3) col += b * uBlueColor;
    return col;
}

void main() {
    // original: vec2 uv = fragCoord.xy / iResolution.y;
    vec2 uv = gl_FragCoord.xy / iResolution.y;

    float aspect = iResolution.x / iResolution.y;
    vec2 center = vec2(0.5 * aspect, 0.5);

    uv += uOffset;

    float s = sin(uRotation);
    float c = cos(uRotation);
    uv -= center;
    uv = mat2(c, -s, s, c) * uv;
    uv += center;

    vec3 col = vec3(0.0);

    float timeMul[MAX_LAYERS];
    timeMul[0] = 1.0;
    timeMul[1] = 1.5;
    timeMul[2] = 2.0;
    timeMul[3] = 2.5;
    timeMul[4] = 3.0;
    timeMul[5] = 3.5;

    float xOff[MAX_LAYERS];
    float layerCountF = max(1.0, float(uLayerCount));
    for (int i = 0; i < MAX_LAYERS; i++) {
        if (layerCountF == 1.0) {
            // Single layer: always centered
            xOff[i] = 0.0;
        } else {
            // Multiple layers: distribute from -0.5 to +0.5 (normalized)
            float normalizedPos = float(i) / (layerCountF - 1.0) - 0.5;
            // Scale by aspect ratio and spacing
            // When uLayerSpacing = 0: all at center (0.0)
            // When uLayerSpacing = 1: spread across viewport width with padding
            // Use 0.6 multiplier to leave room for wave width on edges
            xOff[i] = normalizedPos * aspect * 0.6 * uLayerSpacing;
        }
    }

    for (int i = 0; i < MAX_LAYERS; i++) {
        if (i >= uLayerCount) break;
        // Apply depth-based opacity: front layers (higher i) are more opaque
        float depthFactor = (float(i) + 1.0) / layerCountF;
        // Normalize time multiplier to maintain consistent base speed
        float normalizedTimeMul = 1.0 + (timeMul[i] - 1.0) * 0.5;
        col += bFn(uv + vec2(xOff[i], 0.0), iTime * normalizedTimeMul) * depthFactor;
    }

    // Apply brightness directly without additional normalization
    // The depthFactor ensures the closest layer (highest i) reaches full opacity
    col *= uBrightness;

    float lineA = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);

    vec3 outRgb = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(outRgb, lineA);
}
`

function parseRgba01(input: string): [number, number, number, number] {
    const h = (input || "#000000").trim()
    if (h.startsWith("rgb")) {
        const m = h.match(/rgba?\(([^)]+)\)/i)
        if (m && m[1]) {
            const parts = m[1].split(/\s*,\s*/).map((p) => p.trim())
            const r = Math.max(0, Math.min(255, parseFloat(parts[0] || "0")))
            const g = Math.max(0, Math.min(255, parseFloat(parts[1] || "0")))
            const b = Math.max(0, Math.min(255, parseFloat(parts[2] || "0")))
            const a = Math.max(0, Math.min(1, parseFloat(parts[3] || "1")))
            return [r / 255, g / 255, b / 255, a]
        }
        return [0, 0, 0, 1]
    }
    if (!h.startsWith("#")) return [0, 0, 0, 1]
    const raw = h.slice(1)

    if (raw.length === 3) {
        const r = parseInt(raw[0] + raw[0], 16)
        const g = parseInt(raw[1] + raw[1], 16)
        const b = parseInt(raw[2] + raw[2], 16)
        return [r / 255, g / 255, b / 255, 1]
    }

    if (raw.length === 6) {
        const r = parseInt(raw.slice(0, 2), 16)
        const g = parseInt(raw.slice(2, 4), 16)
        const b = parseInt(raw.slice(4, 6), 16)
        return [r / 255, g / 255, b / 255, 1]
    }

    if (raw.length === 8) {
        const r = parseInt(raw.slice(0, 2), 16)
        const g = parseInt(raw.slice(2, 4), 16)
        const b = parseInt(raw.slice(4, 6), 16)
        const a = parseInt(raw.slice(6, 8), 16)
        return [r / 255, g / 255, b / 255, a / 255]
    }

    return [0, 0, 0, 1]
}

function hexToRgb01(hex: string): [number, number, number] {
    const [r, g, b] = parseRgba01(hex)
    return [r, g, b]
}

function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader {
    const shader = gl.createShader(type)
    if (!shader) throw new Error("WebGL: createShader failed")

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!ok) {
        const log = gl.getShaderInfoLog(shader) || ""
        gl.deleteShader(shader)
        throw new Error(`WebGL: shader compile failed: ${log}`)
    }

    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
): WebGLProgram {
    const vert = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    const frag = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

    const program = gl.createProgram()
    if (!program) {
        gl.deleteShader(vert)
        gl.deleteShader(frag)
        throw new Error("WebGL: createProgram failed")
    }

    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)

    const ok = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!ok) {
        const log = gl.getProgramInfoLog(program) || ""
        gl.deleteProgram(program)
        gl.deleteShader(vert)
        gl.deleteShader(frag)
        throw new Error(`WebGL: program link failed: ${log}`)
    }

    gl.deleteShader(vert)
    gl.deleteShader(frag)

    return program
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function SmoothWaves(props: Props) {
    const {
        speed,
        brightness,
        animate,
        layerCount,
        wavesPerLayer,
        redColor,
        greenColor,
        blueColor,
        softness,
        amplitude,
        rotation,
        offsetX,
        offsetY,
        layerSpacing,
        seed,
        phase,
        frequency,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const target = RenderTarget.current()
    const isCanvas = target === RenderTarget.canvas
    const [webglFailed, setWebglFailed] = React.useState(false)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const containerRef = React.useRef<HTMLDivElement | null>(null)

    const rafRef = React.useRef<number | null>(null)
    const startTimeRef = React.useRef<number>(0)

    const glRef = React.useRef<WebGLRenderingContext | null>(null)
    const programRef = React.useRef<WebGLProgram | null>(null)
    const posBufferRef = React.useRef<WebGLBuffer | null>(null)

    const uniformsRef = React.useRef<{
        iResolution: WebGLUniformLocation | null
        iTime: WebGLUniformLocation | null
        uBrightness: WebGLUniformLocation | null
        uSoftness: WebGLUniformLocation | null
        uAmplitude: WebGLUniformLocation | null
        uRedColor: WebGLUniformLocation | null
        uGreenColor: WebGLUniformLocation | null
        uBlueColor: WebGLUniformLocation | null
        uRotation: WebGLUniformLocation | null
        uOffset: WebGLUniformLocation | null
        uLayerCount: WebGLUniformLocation | null
        uWavesPerLayer: WebGLUniformLocation | null
        uLayerSpacing: WebGLUniformLocation | null
        uSeed: WebGLUniformLocation | null
        uPhase: WebGLUniformLocation | null
        uFrequency: WebGLUniformLocation | null
    } | null>(null)

    const inView = useInView(containerRef, { amount: 0.15 })
    const effectiveInView = React.useMemo(() => {
        if (isCanvas) return true
        if (typeof window === "undefined") return true
        if (!("IntersectionObserver" in window)) return true
        return inView
    }, [inView, isCanvas])

    const colors = React.useMemo(() => {
        return {
            r: hexToRgb01(redColor),
            g: hexToRgb01(greenColor),
            b: hexToRgb01(blueColor),
        }
    }, [redColor, greenColor, blueColor])

    const uniformValues = React.useMemo(
        () => ({
            brightness,
            softness,
            amplitude,
            speed,
            rotation: (rotation * 3.141592653589793) / 180.0,
            offsetX,
            offsetY,
            layerCount: Math.max(1, Math.min(6, Math.round(layerCount))),
            wavesPerLayer: Math.max(1, Math.min(3, Math.round(wavesPerLayer))),
            layerSpacing,
            seed,
            phase: (phase * 3.141592653589793) / 180.0,
            frequency,
        }),
        [
            brightness,
            softness,
            amplitude,
            speed,
            rotation,
            offsetX,
            offsetY,
            layerCount,
            wavesPerLayer,
            layerSpacing,
            seed,
            phase,
            frequency,
        ]
    )

    const cleanupRaf = React.useCallback(() => {
        if (rafRef.current != null && typeof window !== "undefined") {
            window.cancelAnimationFrame(rafRef.current)
        }
        rafRef.current = null
    }, [])

    const draw = React.useCallback(
        (timeMs: number) => {
            const canvas = canvasRef.current
            const gl = glRef.current
            const program = programRef.current
            const uniforms = uniformsRef.current
            if (!canvas || !gl || !program || !uniforms) return

            const dpr =
                typeof window !== "undefined"
                    ? Math.max(1, window.devicePixelRatio || 1)
                    : 1

            const cssW = canvas.clientWidth
            const cssH = canvas.clientHeight
            const w = Math.max(1, Math.floor(cssW * dpr))
            const h = Math.max(1, Math.floor(cssH * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
                gl.viewport(0, 0, w, h)
            }

            gl.useProgram(program)

            // uniforms
            gl.uniform2f(uniforms.iResolution, w, h)
            if (startTimeRef.current === 0) {
                startTimeRef.current = timeMs
            }
            const t =
                ((timeMs - startTimeRef.current) / 1000.0) * uniformValues.speed
            gl.uniform1f(uniforms.iTime, t)
            gl.uniform1f(uniforms.uBrightness, uniformValues.brightness)
            gl.uniform1f(uniforms.uSoftness, uniformValues.softness)
            gl.uniform1f(uniforms.uAmplitude, uniformValues.amplitude)
            gl.uniform3f(
                uniforms.uRedColor,
                colors.r[0],
                colors.r[1],
                colors.r[2]
            )
            gl.uniform3f(
                uniforms.uGreenColor,
                colors.g[0],
                colors.g[1],
                colors.g[2]
            )
            gl.uniform3f(
                uniforms.uBlueColor,
                colors.b[0],
                colors.b[1],
                colors.b[2]
            )
            gl.uniform1f(uniforms.uRotation, uniformValues.rotation)
            gl.uniform2f(
                uniforms.uOffset,
                uniformValues.offsetX,
                uniformValues.offsetY
            )
            gl.uniform1i(uniforms.uLayerCount, uniformValues.layerCount)
            gl.uniform1i(uniforms.uWavesPerLayer, uniformValues.wavesPerLayer)
            gl.uniform1f(uniforms.uLayerSpacing, uniformValues.layerSpacing)
            gl.uniform1f(uniforms.uSeed, uniformValues.seed)
            gl.uniform1f(uniforms.uPhase, uniformValues.phase)
            gl.uniform1f(uniforms.uFrequency, uniformValues.frequency)

            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.drawArrays(gl.TRIANGLES, 0, 6)
        },
        [colors, uniformValues]
    )

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
        }) as WebGLRenderingContext | null

        glRef.current = gl
        if (!gl) {
            React.startTransition(() => setWebglFailed(true))
            return
        }

        try {
            const program = createProgram(gl, VERT, FRAG)
            programRef.current = program

            const posBuffer = gl.createBuffer()
            if (!posBuffer) throw new Error("WebGL: createBuffer failed")
            posBufferRef.current = posBuffer

            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
            // full screen quad
            const verts = new Float32Array([
                -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
            ])
            gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)

            gl.useProgram(program)

            const loc = gl.getAttribLocation(program, "aPosition")
            if (loc < 0) throw new Error("WebGL: aPosition not found")
            gl.enableVertexAttribArray(loc)
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

            uniformsRef.current = {
                iResolution: gl.getUniformLocation(program, "iResolution"),
                iTime: gl.getUniformLocation(program, "iTime"),
                uBrightness: gl.getUniformLocation(program, "uBrightness"),
                uSoftness: gl.getUniformLocation(program, "uSoftness"),
                uAmplitude: gl.getUniformLocation(program, "uAmplitude"),
                uRedColor: gl.getUniformLocation(program, "uRedColor"),
                uGreenColor: gl.getUniformLocation(program, "uGreenColor"),
                uBlueColor: gl.getUniformLocation(program, "uBlueColor"),
                uRotation: gl.getUniformLocation(program, "uRotation"),
                uOffset: gl.getUniformLocation(program, "uOffset"),
                uLayerCount: gl.getUniformLocation(program, "uLayerCount"),
                uWavesPerLayer: gl.getUniformLocation(
                    program,
                    "uWavesPerLayer"
                ),
                uLayerSpacing: gl.getUniformLocation(program, "uLayerSpacing"),
                uSeed: gl.getUniformLocation(program, "uSeed"),
                uPhase: gl.getUniformLocation(program, "uPhase"),
                uFrequency: gl.getUniformLocation(program, "uFrequency"),
            }

            gl.disable(gl.DEPTH_TEST)
            gl.disable(gl.CULL_FACE)
            gl.clearColor(0, 0, 0, 0)

            // Force immediate synchronous draw for marketplace preview
            draw(performance.now())

            return () => {
                cleanupRaf()
                const gl = glRef.current
                if (!gl) return
                const program = programRef.current
                const buf = posBufferRef.current
                if (program) gl.deleteProgram(program)
                if (buf) gl.deleteBuffer(buf)
                glRef.current = null
                programRef.current = null
                posBufferRef.current = null
                uniformsRef.current = null
            }
        } catch (e) {
            React.startTransition(() => setWebglFailed(true))
            console.warn("SmoothWaves: WebGL init failed", e)
        }
    }, [cleanupRaf, draw])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        cleanupRaf()

        const shouldAnimate = animate && effectiveInView && !isStatic
        if (!shouldAnimate) {
            draw(performance.now())
            return
        }

        const loop = (t: number) => {
            draw(t)
            rafRef.current = window.requestAnimationFrame(loop)
        }

        rafRef.current = window.requestAnimationFrame(loop)

        return cleanupRaf
    }, [animate, cleanupRaf, draw, effectiveInView, isStatic])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (animate && effectiveInView) return
        draw(performance.now())
    }, [draw, animate, effectiveInView])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...style,
            }}
            aria-label="Smooth Waves shader effect"
            role="img"
        >
            {webglFailed ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        boxSizing: "border-box",
                        color: "rgba(255,255,255,0.9)",
                        textAlign: "center",
                        fontSize: 14,
                        lineHeight: "1.3em",
                        fontWeight: 500,
                        fontFamily:
                            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                        background:
                            "radial-gradient(80% 80% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.0) 60%)",
                    }}
                    aria-label="WebGL unavailable"
                >
                    <span style={{ width: "100%" }}>
                        WebGL preview is unavailable.
                    </span>
                </div>
            ) : null}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    opacity: webglFailed ? 0 : 1,
                }}
            />
        </div>
    )
}

addPropertyControls(SmoothWaves, {
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    layerCount: {
        type: ControlType.Number,
        title: "Layers",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
    },
    wavesPerLayer: {
        type: ControlType.Number,
        title: "Waves/Layer",
        defaultValue: 3,
        min: 1,
        max: 3,
        step: 1,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        defaultValue: 1,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    softness: {
        type: ControlType.Number,
        title: "Softness",
        defaultValue: 0.01,
        min: 0.005,
        max: 0.05,
        step: 0.005,
    },
    amplitude: {
        type: ControlType.Number,
        title: "Amplitude",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.05,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 0,
        min: -2,
        max: 2,
        step: 0.01,
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 0,
        min: -2,
        max: 2,
        step: 0.01,
    },
    layerSpacing: {
        type: ControlType.Number,
        title: "Layer Spacing",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 0.1,
    },
    phase: {
        type: ControlType.Number,
        title: "Phase",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        unit: "deg",
    },
    frequency: {
        type: ControlType.Number,
        title: "Frequency",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    redColor: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#FF002B",
    },
    greenColor: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#FF7300",
    },
    blueColor: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#FFEA00",
        description: "\ncrafted by [nuwebu](https://nuwebu.com/)",
    },
})

SmoothWaves.displayName = "Smooth Waves"
