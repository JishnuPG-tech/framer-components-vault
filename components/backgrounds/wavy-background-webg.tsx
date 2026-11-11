// Made with 💛 by Karim Saif
// Framer Marketplace Component: Wavy Background (WebGL2)

import React, { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Made with 💛 by Karim Saif

interface WavyConfig {
    zoomFactor: number
    baseWaveAmplitude: number
    randomWaveFactor: number
    waveFrequency: number
    timeFactor: number
    baseSwirlStrength: number
    swirlTimeMult: number
    noiseSwirlFactor: number
    fbmOctaves: number
}

// Preset configurations designed by Karim Saif
const PRESETS: Record<string, WavyConfig> = {
    "default-sea": {
        zoomFactor: 0.3,
        baseWaveAmplitude: 0.2,
        randomWaveFactor: 0.15,
        waveFrequency: 4.0,
        timeFactor: 0.25,
        baseSwirlStrength: 1.2,
        swirlTimeMult: 5.0,
        noiseSwirlFactor: 0.2,
        fbmOctaves: 8,
    },
    "gentle-flow": {
        zoomFactor: 0.2,
        baseWaveAmplitude: 0.1,
        randomWaveFactor: 0.05,
        waveFrequency: 2.0,
        timeFactor: 0.1,
        baseSwirlStrength: 0.5,
        swirlTimeMult: 2.0,
        noiseSwirlFactor: 0.1,
        fbmOctaves: 6,
    },
    "fast-storm": {
        zoomFactor: 0.5,
        baseWaveAmplitude: 0.4,
        randomWaveFactor: 0.3,
        waveFrequency: 8.0,
        timeFactor: 0.5,
        baseSwirlStrength: 2.5,
        swirlTimeMult: 8.0,
        noiseSwirlFactor: 0.5,
        fbmOctaves: 8,
    },
    "subtle-swirl": {
        zoomFactor: 0.25,
        baseWaveAmplitude: 0.15,
        randomWaveFactor: 0.1,
        waveFrequency: 3.0,
        timeFactor: 0.15,
        baseSwirlStrength: 2.0,
        swirlTimeMult: 4.0,
        noiseSwirlFactor: 0.3,
        fbmOctaves: 8,
    },
}

function buildFragmentShader(fbmOctaves: number): string {
    const fbmOctavesInt = Math.min(Math.max(Math.floor(fbmOctaves), 1), 8)

    return `#version 300 es

precision highp float;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;

uniform float uZoomFactor;
uniform float uBaseWaveAmplitude;
uniform float uRandomWaveFactor;
uniform float uWaveFrequency;
uniform float uTimeFactor;
uniform float uBaseSwirlStrength;
uniform float uSwirlTimeMult;
uniform float uNoiseSwirlFactor;

#define NUM_COLORS 20

vec3 seaColors[NUM_COLORS] = vec3[](
    vec3(0.0, 0.02, 0.05),
    vec3(0.0, 0.04, 0.08),
    vec3(0.0, 0.06, 0.12),
    vec3(0.0, 0.08, 0.18),
    vec3(0.0, 0.1, 0.24),
    vec3(0.0, 0.14, 0.32),
    vec3(0.0, 0.2, 0.4),
    vec3(0.0, 0.24, 0.48),
    vec3(0.0, 0.3, 0.55),
    vec3(0.05, 0.35, 0.6),
    vec3(0.08, 0.4, 0.65),
    vec3(0.1, 0.45, 0.7),
    vec3(0.15, 0.5, 0.75),
    vec3(0.2, 0.58, 0.8),
    vec3(0.25, 0.65, 0.85),
    vec3(0.3, 0.72, 0.9),
    vec3(0.4, 0.78, 0.92),
    vec3(0.5, 0.85, 0.95),
    vec3(0.7, 0.9, 0.97),
    vec3(0.85, 0.95, 1.0)
);

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float noise2D(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0)) +
    i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.792843 - 0.853734 * (a0 * a0 + h * h);

  vec3 g;
  g.x  = a0.x  * x0.x + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float freq = 1.0;
  for (int i = 0; i < ${fbmOctavesInt}; i++) {
    value += amplitude * noise2D(st * freq);
    freq *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;

  uv *= uZoomFactor;

  float t = uTime * uTimeFactor;

  float waveAmp = uBaseWaveAmplitude + uRandomWaveFactor * noise2D(vec2(t, 27.7));

  float waveX = waveAmp * sin(uv.y * uWaveFrequency + t);
  float waveY = waveAmp * sin(uv.x * uWaveFrequency - t);
  uv.x += waveX;
  uv.y += waveY;

  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  float swirlStrength = uBaseSwirlStrength * (1.0 - smoothstep(0.0, 1.0, r));

  angle += swirlStrength * sin(uTime + r * uSwirlTimeMult);
  uv = vec2(cos(angle), sin(angle)) * r;

  float n = fbm(uv);

  float swirlEffect = uNoiseSwirlFactor * sin(t + n * 3.0);
  n += swirlEffect;

  float noiseVal = clamp(0.5 * (n + 1.0), 0.0, 1.0);

  float idx = noiseVal * float(NUM_COLORS - 1);
  int iLow = int(floor(idx));
  int iHigh = int(min(float(iLow + 1), float(NUM_COLORS - 1)));
  float f = fract(idx);

  vec3 colLow = seaColors[iLow];
  vec3 colHigh = seaColors[iHigh];
  vec3 color = mix(colLow, colHigh, f);

  outColor = vec4(color, 1.0);
}
`
}

const vertexShaderSource = `#version 300 es
precision mediump float;

in vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

function createShaderProgram(
    gl: WebGL2RenderingContext,
    vsSource: string,
    fsSource: string
): WebGLProgram | null {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (!vertexShader) return null

    gl.shaderSource(vertexShader, vsSource)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Vertex shader error:", gl.getShaderInfoLog(vertexShader))
        gl.deleteShader(vertexShader)
        return null
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (!fragmentShader) {
        gl.deleteShader(vertexShader)
        return null
    }

    gl.shaderSource(fragmentShader, fsSource)
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error(
            "Fragment shader error:",
            gl.getShaderInfoLog(fragmentShader)
        )
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        return null
    }

    const program = gl.createProgram()
    if (!program) {
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        return null
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(
            "Could not link WebGL program:",
            gl.getProgramInfoLog(program)
        )
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        gl.deleteProgram(program)
        return null
    }

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    return program
}

interface WavyBackgroundProps {
    preset?: string
    zoomFactor?: number
    baseWaveAmplitude?: number
    randomWaveFactor?: number
    waveFrequency?: number
    timeFactor?: number
    baseSwirlStrength?: number
    swirlTimeMult?: number
    noiseSwirlFactor?: number
    fbmOctaves?: number
    ariaLabel?: string
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function WavyBackground(props: WavyBackgroundProps) {
    const {
        preset = "default-sea",
        zoomFactor = 0.3,
        baseWaveAmplitude = 0.2,
        randomWaveFactor = 0.15,
        waveFrequency = 4.0,
        timeFactor = 0.25,
        baseSwirlStrength = 1.2,
        swirlTimeMult = 5.0,
        noiseSwirlFactor = 0.2,
        fbmOctaves = 8,
        ariaLabel = "",
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [webglSupported, setWebglSupported] = React.useState(true)

    // Option A: If preset is selected (and not 'custom'), use fixed preset values.
    // Otherwise, use custom control props.
    const config: WavyConfig =
        preset !== "custom" && PRESETS[preset]
            ? PRESETS[preset]
            : {
                  zoomFactor,
                  baseWaveAmplitude,
                  randomWaveFactor,
                  waveFrequency,
                  timeFactor,
                  baseSwirlStrength,
                  swirlTimeMult,
                  noiseSwirlFactor,
                  fbmOctaves,
              }

    const configRef = useRef(config)
    configRef.current = config

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        let isDisposed = false
        let animationFrameId: number | null = null
        let isIntersecting = false
        let isRunning = false

        let gl: WebGL2RenderingContext | null = null
        let program: WebGLProgram | null = null
        let vao: WebGLVertexArrayObject | null = null
        let vbo: WebGLBuffer | null = null

        let uResolutionLoc: WebGLUniformLocation | null = null
        let uTimeLoc: WebGLUniformLocation | null = null
        let uZoomFactorLoc: WebGLUniformLocation | null = null
        let uBaseWaveAmplitudeLoc: WebGLUniformLocation | null = null
        let uRandomWaveFactorLoc: WebGLUniformLocation | null = null
        let uWaveFrequencyLoc: WebGLUniformLocation | null = null
        let uTimeFactorLoc: WebGLUniformLocation | null = null
        let uBaseSwirlStrengthLoc: WebGLUniformLocation | null = null
        let uSwirlTimeMultLoc: WebGLUniformLocation | null = null
        let uNoiseSwirlFactorLoc: WebGLUniformLocation | null = null

        const startTime = performance.now()

        const cleanupWebGL = () => {
            if (program && gl) gl.deleteProgram(program)
            if (vbo && gl) gl.deleteBuffer(vbo)
            if (vao && gl) gl.deleteVertexArray(vao)
            program = null
            vbo = null
            vao = null
        }

        const stopAnimation = () => {
            isRunning = false
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }

        const resize = () => {
            if (!container || !canvas || !gl || isDisposed) return
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            const width = Math.max(1, Math.floor(container.clientWidth * dpr))
            const height = Math.max(1, Math.floor(container.clientHeight * dpr))

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
                canvas.style.width = `${container.clientWidth}px`
                canvas.style.height = `${container.clientHeight}px`
                gl.viewport(0, 0, width, height)
            }
        }

        const updateUniforms = (elapsed: number) => {
            if (!gl || isDisposed) return
            const currentConfig = configRef.current

            if (uResolutionLoc)
                gl.uniform2f(uResolutionLoc, canvas.width, canvas.height)
            if (uTimeLoc) gl.uniform1f(uTimeLoc, elapsed)
            if (uZoomFactorLoc)
                gl.uniform1f(uZoomFactorLoc, currentConfig.zoomFactor)
            if (uBaseWaveAmplitudeLoc)
                gl.uniform1f(
                    uBaseWaveAmplitudeLoc,
                    currentConfig.baseWaveAmplitude
                )
            if (uRandomWaveFactorLoc)
                gl.uniform1f(
                    uRandomWaveFactorLoc,
                    currentConfig.randomWaveFactor
                )
            if (uWaveFrequencyLoc)
                gl.uniform1f(uWaveFrequencyLoc, currentConfig.waveFrequency)
            if (uTimeFactorLoc)
                gl.uniform1f(uTimeFactorLoc, currentConfig.timeFactor)
            if (uBaseSwirlStrengthLoc)
                gl.uniform1f(
                    uBaseSwirlStrengthLoc,
                    currentConfig.baseSwirlStrength
                )
            if (uSwirlTimeMultLoc)
                gl.uniform1f(uSwirlTimeMultLoc, currentConfig.swirlTimeMult)
            if (uNoiseSwirlFactorLoc)
                gl.uniform1f(
                    uNoiseSwirlFactorLoc,
                    currentConfig.noiseSwirlFactor
                )
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches

        const render = () => {
            if (
                !isIntersecting ||
                !isRunning ||
                isDisposed ||
                !gl ||
                !program ||
                !vao
            )
                return

            const elapsed = prefersReducedMotion
                ? 0
                : (performance.now() - startTime) * 0.001
            resize()

            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.useProgram(program)
            gl.bindVertexArray(vao)
            updateUniforms(elapsed)

            gl.drawArrays(gl.TRIANGLES, 0, 6)

            if (!prefersReducedMotion && isRunning && !isDisposed) {
                animationFrameId = requestAnimationFrame(render)
            }
        }

        const startAnimation = () => {
            if (
                isRunning ||
                isDisposed ||
                animationFrameId !== null ||
                !isIntersecting
            )
                return
            isRunning = true
            render()
        }

        const initWebGL = () => {
            cleanupWebGL()

            gl = canvas.getContext("webgl2", {
                alpha: false,
                antialias: false,
                powerPreference: "high-performance",
            })

            if (!gl) {
                console.warn(
                    "WebGL2 not supported, falling back to radial gradient."
                )
                setWebglSupported(false)
                return false
            }

            const fsSource = buildFragmentShader(configRef.current.fbmOctaves)
            program = createShaderProgram(gl, vertexShaderSource, fsSource)
            if (!program) {
                setWebglSupported(false)
                return false
            }

            gl.useProgram(program)

            const quadVertices = new Float32Array([
                -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
            ])

            vao = gl.createVertexArray()
            gl.bindVertexArray(vao)

            vbo = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
            gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)

            const aPositionLoc = gl.getAttribLocation(program, "aPosition")
            gl.enableVertexAttribArray(aPositionLoc)
            gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0)

            uResolutionLoc = gl.getUniformLocation(program, "uResolution")
            uTimeLoc = gl.getUniformLocation(program, "uTime")
            uZoomFactorLoc = gl.getUniformLocation(program, "uZoomFactor")
            uBaseWaveAmplitudeLoc = gl.getUniformLocation(
                program,
                "uBaseWaveAmplitude"
            )
            uRandomWaveFactorLoc = gl.getUniformLocation(
                program,
                "uRandomWaveFactor"
            )
            uWaveFrequencyLoc = gl.getUniformLocation(program, "uWaveFrequency")
            uTimeFactorLoc = gl.getUniformLocation(program, "uTimeFactor")
            uBaseSwirlStrengthLoc = gl.getUniformLocation(
                program,
                "uBaseSwirlStrength"
            )
            uSwirlTimeMultLoc = gl.getUniformLocation(program, "uSwirlTimeMult")
            uNoiseSwirlFactorLoc = gl.getUniformLocation(
                program,
                "uNoiseSwirlFactor"
            )

            setWebglSupported(true)
            return true
        }

        const handleContextLost = (event: Event) => {
            event.preventDefault()
            stopAnimation()
            cleanupWebGL()
            setWebglSupported(false)
        }

        const handleContextRestored = () => {
            if (isDisposed) return
            if (initWebGL()) {
                if (isStaticRenderer) {
                    resize()
                    if (gl && program && vao) {
                        gl.clear(gl.COLOR_BUFFER_BIT)
                        gl.useProgram(program)
                        gl.bindVertexArray(vao)
                        updateUniforms(0)
                        gl.drawArrays(gl.TRIANGLES, 0, 6)
                    }
                } else if (isIntersecting) {
                    startAnimation()
                }
            }
        }

        canvas.addEventListener("webglcontextlost", handleContextLost, false)
        canvas.addEventListener(
            "webglcontextrestored",
            handleContextRestored,
            false
        )

        if (!initWebGL()) {
            return () => {
                canvas.removeEventListener(
                    "webglcontextlost",
                    handleContextLost
                )
                canvas.removeEventListener(
                    "webglcontextrestored",
                    handleContextRestored
                )
            }
        }

        if (isStaticRenderer) {
            resize()
            if (gl && program && vao) {
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.useProgram(program)
                gl.bindVertexArray(vao)
                updateUniforms(0)
                gl.drawArrays(gl.TRIANGLES, 0, 6)
            }
            return () => {
                isDisposed = true
                canvas.removeEventListener(
                    "webglcontextlost",
                    handleContextLost
                )
                canvas.removeEventListener(
                    "webglcontextrestored",
                    handleContextRestored
                )
                cleanupWebGL()
            }
        }

        const resizeObserver = new ResizeObserver(() => resize())
        resizeObserver.observe(container)

        const intersectionObserver = new IntersectionObserver(([entry]) => {
            isIntersecting = entry.isIntersecting
            if (isIntersecting) {
                startAnimation()
            } else {
                stopAnimation()
            }
        })
        intersectionObserver.observe(container)

        return () => {
            isDisposed = true
            stopAnimation()
            canvas.removeEventListener("webglcontextlost", handleContextLost)
            canvas.removeEventListener(
                "webglcontextrestored",
                handleContextRestored
            )
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            cleanupWebGL()
        }
    }, [isStaticRenderer, config.fbmOctaves])

    return (
        <div
            ref={containerRef}
            {...(ariaLabel
                ? { "aria-label": ariaLabel }
                : { "aria-hidden": "true" })}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background:
                    "radial-gradient(circle at 50% 50%, #0a3150 0%, #00050d 70%)",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    opacity: webglSupported ? 1 : 0,
                    transition: "opacity 0.3s ease",
                }}
            />
        </div>
    )
}

// Option A: Hide sliders unless preset === "custom"
addPropertyControls(WavyBackground, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        defaultValue: "default-sea",
        options: [
            "default-sea",
            "gentle-flow",
            "fast-storm",
            "subtle-swirl",
            "custom",
        ],
        optionTitles: [
            "Default Sea",
            "Gentle Flow",
            "Fast Storm",
            "Subtle Swirl",
            "Custom",
        ],
        description:
            "Select a pre-made shader style by Karim Saif or choose Custom to unlock full controls.",
    },

    // --- Shader Controls (Hidden unless preset === 'custom') ---
    zoomFactor: {
        type: ControlType.Number,
        title: "Zoom Factor",
        defaultValue: 0.3,
        min: 0.05,
        max: 2.0,
        step: 0.05,
        hidden: (props) => props.preset !== "custom",
        description: "Scale of the procedural pattern by Karim Saif.",
    },
    baseWaveAmplitude: {
        type: ControlType.Number,
        title: "Base Amplitude",
        defaultValue: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        hidden: (props) => props.preset !== "custom",
        description: "Baseline domain warp distortion height.",
    },
    randomWaveFactor: {
        type: ControlType.Number,
        title: "Wave Variation",
        defaultValue: 0.15,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        hidden: (props) => props.preset !== "custom",
        description: "Random variation added to wave amplitude.",
    },
    waveFrequency: {
        type: ControlType.Number,
        title: "Wave Frequency",
        defaultValue: 4.0,
        min: 0.5,
        max: 20.0,
        step: 0.5,
        hidden: (props) => props.preset !== "custom",
        description: "Frequency multiplier for domain warp effect.",
    },
    timeFactor: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.25,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        hidden: (props) => props.preset !== "custom",
        description: "Global animation speed multiplier by Karim Saif.",
    },
    baseSwirlStrength: {
        type: ControlType.Number,
        title: "Swirl Strength",
        defaultValue: 1.2,
        min: 0.0,
        max: 5.0,
        step: 0.1,
        hidden: (props) => props.preset !== "custom",
        description: "Intensity of central swirl distortion.",
    },
    swirlTimeMult: {
        type: ControlType.Number,
        title: "Swirl Frequency",
        defaultValue: 5.0,
        min: 0.1,
        max: 10.0,
        step: 0.5,
        hidden: (props) => props.preset !== "custom",
        description: "Timing speed multiplier for central swirl.",
    },
    noiseSwirlFactor: {
        type: ControlType.Number,
        title: "Noise Motion",
        defaultValue: 0.2,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        hidden: (props) => props.preset !== "custom",
        description: "Noise modulation applied to the swirl pattern.",
    },
    fbmOctaves: {
        type: ControlType.Number,
        title: "Detail",
        defaultValue: 8,
        min: 1,
        max: 8,
        step: 1,
        hidden: (props) => props.preset !== "custom",
        description:
            "Controls the amount of fine procedural detail. Higher values create richer texture but use more GPU.",
    },

    // --- Footer Controls ---
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Wavy Background (WebGL2)",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

// Made with 💛 by Karim Saif
