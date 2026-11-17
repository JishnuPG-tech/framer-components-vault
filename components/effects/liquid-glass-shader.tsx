// ============================================================
// LIQUID GLASS
// Premium Procedural Liquid Glass Distortion Shader for Framer
//
// Made with 💛 by Karim Saif
//
// Features:
// • Invisible liquid-glass surface
// • Cursor lens / refraction
// • Cursor enable / disable
// • Procedural glass distortion
// • Animated light movement
// • Ripple distortion
// • Blur / diffusion
// • Chromatic aberration
// • Multiple color presets
// • Responsive WebGL rendering
// • Viewport-aware rendering
// • Reduced-motion support
// • WebGL context recovery
// • No visible text inside the component
// • No external dependencies
// ============================================================

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


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

// ============================================================
// Types
// ============================================================

type ColorPreset =
    | "aurora"
    | "ocean"
    | "violet"
    | "sunset"
    | "emerald"
    | "monochrome"

interface LiquidGlassProps {
    refraction: number
    glassDistortion: number
    lightIntensity: number
    rippleRadius: number
    cursorInfluence: number
    cursorEnabled: boolean
    blur: number
    chromaticAberration: number
    speed: number
    colorPreset: ColorPreset
}

interface ColorSet {
    a: [number, number, number]
    b: [number, number, number]
    c: [number, number, number]
    d: [number, number, number]
}

// ============================================================
// Color Presets
// ============================================================

const COLOR_PRESETS: Record<ColorPreset, ColorSet> = {
    aurora: {
        a: [0.015, 0.008, 0.045],
        b: [0.09, 0.025, 0.2],
        c: [0.025, 0.28, 0.42],
        d: [0.45, 0.9, 0.82],
    },

    ocean: {
        a: [0.005, 0.015, 0.045],
        b: [0.008, 0.075, 0.2],
        c: [0.015, 0.32, 0.5],
        d: [0.35, 0.85, 0.95],
    },

    violet: {
        a: [0.025, 0.005, 0.07],
        b: [0.12, 0.015, 0.28],
        c: [0.4, 0.04, 0.58],
        d: [0.82, 0.42, 1.0],
    },

    sunset: {
        a: [0.055, 0.008, 0.012],
        b: [0.25, 0.025, 0.045],
        c: [0.68, 0.1, 0.055],
        d: [1.0, 0.55, 0.22],
    },

    emerald: {
        a: [0.002, 0.025, 0.02],
        b: [0.005, 0.13, 0.095],
        c: [0.01, 0.38, 0.2],
        d: [0.42, 0.95, 0.62],
    },

    monochrome: {
        a: [0.008, 0.008, 0.012],
        b: [0.055, 0.06, 0.075],
        c: [0.25, 0.27, 0.31],
        d: [0.9, 0.93, 1.0],
    },
}

// ============================================================
// Vertex Shader
// ============================================================

const VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

// ============================================================
// Fragment Shader
// ============================================================

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;

uniform vec2 uMouse;
uniform float uMouseActive;

uniform float uRefraction;
uniform float uGlassDistortion;
uniform float uLightIntensity;
uniform float uRippleRadius;
uniform float uCursorInfluence;
uniform float uBlur;
uniform float uChromaticAberration;
uniform float uSpeed;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorD;

// ------------------------------------------------------------
// Hash
// ------------------------------------------------------------

float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
}

// ------------------------------------------------------------
// Noise
// ------------------------------------------------------------

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(
        mix(a, b, f.x),
        mix(c, d, f.x),
        f.y
    );
}

// ------------------------------------------------------------
// FBM
// ------------------------------------------------------------

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
        value += noise(p) * amplitude;

        p =
            p * 2.02 +
            vec2(17.13, 9.37);

        amplitude *= 0.5;
    }

    return value;
}

// ------------------------------------------------------------
// Color Palette
// ------------------------------------------------------------

vec3 palette(float t) {
    t = clamp(t, 0.0, 1.0);

    float x =
        smoothstep(
            0.0,
            0.35,
            t
        );

    float y =
        smoothstep(
            0.25,
            0.72,
            t
        );

    float z =
        smoothstep(
            0.62,
            1.0,
            t
        );

    vec3 first =
        mix(
            uColorA,
            uColorB,
            x
        );

    vec3 second =
        mix(
            uColorB,
            uColorC,
            y
        );

    vec3 third =
        mix(
            uColorC,
            uColorD,
            z
        );

    vec3 result =
        mix(
            first,
            second,
            y
        );

    result =
        mix(
            result,
            third,
            z
        );

    return result;
}

// ------------------------------------------------------------
// Background
// ------------------------------------------------------------

vec3 backgroundColor(
    vec2 uv,
    float time
) {
    float largeNoise =
        fbm(
            uv * 1.45 +
            vec2(
                time * 0.025,
                -time * 0.018
            )
        );

    float mediumNoise =
        fbm(
            uv * 3.8 -
            vec2(
                time * 0.018,
                time * 0.012
            )
        );

    float waves =
        sin(
            uv.x * 5.0 +
            sin(
                uv.y * 3.5 +
                time * 0.18
            )
        );

    waves =
        waves * 0.5 +
        0.5;

    float diagonal =
        uv.x * 0.55 +
        uv.y * 0.45;

    float value =
        diagonal * 0.55 +
        largeNoise * 0.30 +
        mediumNoise * 0.10 +
        waves * 0.05;

    value =
        clamp(
            value,
            0.0,
            1.0
        );

    vec3 color =
        palette(value);

    // Moving light source A.
    vec2 lightA =
        vec2(
            0.25 +
            sin(time * 0.11) * 0.18,

            0.28 +
            cos(time * 0.09) * 0.16
        );

    // Moving light source B.
    vec2 lightB =
        vec2(
            0.76 +
            cos(time * 0.08) * 0.14,

            0.68 +
            sin(time * 0.07) * 0.16
        );

    float glowA =
        1.0 -
        smoothstep(
            0.0,
            0.75,
            distance(
                uv,
                lightA
            )
        );

    float glowB =
        1.0 -
        smoothstep(
            0.0,
            0.65,
            distance(
                uv,
                lightB
            )
        );

    color +=
        uColorD *
        glowA *
        0.08;

    color +=
        uColorC *
        glowB *
        0.06;

    return color;
}

// ------------------------------------------------------------
// Glass Distortion
// ------------------------------------------------------------

vec2 glassDistortion(
    vec2 uv,
    float time
) {
    float n1 =
        fbm(
            uv * 2.1 +
            vec2(
                time * 0.025,
                -time * 0.017
            )
        );

    float n2 =
        fbm(
            uv * 4.0 -
            vec2(
                time * 0.015,
                time * 0.022
            )
        );

    float waveX =
        sin(
            uv.y * 7.0 +
            n1 * 4.0 +
            time * 0.22
        );

    float waveY =
        cos(
            uv.x * 6.0 +
            n2 * 4.0 -
            time * 0.18
        );

    vec2 distortion =
        vec2(
            n1 - 0.5,
            n2 - 0.5
        );

    distortion.x +=
        waveX * 0.07;

    distortion.y +=
        waveY * 0.07;

    return distortion;
}

// ------------------------------------------------------------
// Cursor Lens
// ------------------------------------------------------------

vec2 cursorDistortion(
    vec2 uv,
    float time
) {
    vec2 delta =
        uv -
        uMouse;

    float distanceToMouse =
        length(delta);

    float radius =
        max(
            0.025,
            uRippleRadius
        );

    float influence =
        1.0 -
        smoothstep(
            0.0,
            radius,
            distanceToMouse
        );

    influence *=
        uMouseActive;

    vec2 direction =
        distanceToMouse > 0.0001
        ? delta / distanceToMouse
        : vec2(0.0);

    vec2 tangent =
        vec2(
            -direction.y,
            direction.x
        );

    float normalizedDistance =
        distanceToMouse /
        radius;

    float wave =
        sin(
            normalizedDistance * 18.0 -
            time * 2.2
        );

    float core =
        1.0 -
        smoothstep(
            0.0,
            0.72,
            normalizedDistance
        );

    // Lens pull.
    vec2 lens =
        direction *
        core *
        uRefraction *
        uCursorInfluence *
        0.085;

    // Ripple.
    lens +=
        direction *
        wave *
        influence *
        uGlassDistortion *
        0.025;

    // Tangential bending.
    lens +=
        tangent *
        wave *
        influence *
        uGlassDistortion *
        0.014;

    return lens;
}

// ------------------------------------------------------------
// Glass Sampling
// ------------------------------------------------------------

vec3 sampleGlass(
    vec2 uv,
    vec2 distortion
) {
    float pixel =
        1.0 /
        max(
            uResolution.x,
            uResolution.y
        );

    float blurAmount =
        uBlur *
        pixel *
        24.0;

    float chroma =
        uChromaticAberration *
        0.045;

    // Red.
    vec2 redOffset =
        distortion *
        (1.0 + chroma);

    redOffset.x +=
        blurAmount;

    vec3 redSample =
        backgroundColor(
            uv + redOffset,
            uTime
        );

    // Green.
    vec2 greenOffset =
        distortion;

    greenOffset.y +=
        blurAmount * 0.35;

    vec3 greenSample =
        backgroundColor(
            uv + greenOffset,
            uTime
        );

    // Blue.
    vec2 blueOffset =
        distortion *
        (1.0 - chroma);

    blueOffset.x -=
        blurAmount;

    vec3 blueSample =
        backgroundColor(
            uv + blueOffset,
            uTime
        );

    return vec3(
        redSample.r,
        greenSample.g,
        blueSample.b
    );
}

// ------------------------------------------------------------
// Glass Highlight
// ------------------------------------------------------------

float glassHighlight(
    vec2 uv,
    vec2 distortion,
    float time
) {
    vec2 light =
        vec2(
            0.5 +
            sin(time * 0.13) * 0.30,

            0.5 +
            cos(time * 0.11) * 0.25
        );

    vec2 direction =
        normalize(
            light - uv
        );

    float surface =
        fbm(
            uv * 5.0 +
            distortion * 8.0
        );

    float directional =
        sin(
            surface * 8.0 +
            dot(
                uv,
                direction
            ) * 5.0
        );

    directional =
        directional * 0.5 +
        0.5;

    float highlight =
        smoothstep(
            0.68,
            0.96,
            directional
        );

    return highlight;
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

void main() {
    vec2 uv =
        gl_FragCoord.xy /
        uResolution.xy;

    // Procedural glass.
    vec2 procedural =
        glassDistortion(
            uv,
            uTime
        );

    procedural *=
        uGlassDistortion *
        0.055;

    // Cursor lens.
    vec2 cursor =
        cursorDistortion(
            uv,
            uTime
        );

    vec2 distortion =
        procedural +
        cursor;

    // Sample distorted background.
    vec3 color =
        sampleGlass(
            uv,
            distortion
        );

    // --------------------------------------------------------
    // Cursor Glow
    // --------------------------------------------------------

    float cursorDistance =
        distance(
            uv,
            uMouse
        );

    float cursorGlow =
        1.0 -
        smoothstep(
            0.0,
            max(
                0.025,
                uRippleRadius
            ),
            cursorDistance
        );

    cursorGlow *=
        uMouseActive;

    // --------------------------------------------------------
    // Glass Fresnel
    // --------------------------------------------------------

    float distortionAmount =
        length(
            distortion
        );

    float fresnel =
        smoothstep(
            0.015,
            0.09,
            distortionAmount
        );

    color +=
        vec3(
            0.75,
            0.90,
            1.0
        ) *
        fresnel *
        uLightIntensity *
        0.13;

    // --------------------------------------------------------
    // Glass Highlight
    // --------------------------------------------------------

    float highlight =
        glassHighlight(
            uv,
            distortion,
            uTime
        );

    color +=
        vec3(1.0) *
        highlight *
        uLightIntensity *
        0.10;

    // --------------------------------------------------------
    // Cursor Highlight
    // --------------------------------------------------------

    color +=
        uColorD *
        cursorGlow *
        uLightIntensity *
        0.14;

    float cursorCore =
        1.0 -
        smoothstep(
            0.0,
            max(
                0.02,
                uRippleRadius * 0.42
            ),
            cursorDistance
        );

    cursorCore *=
        uMouseActive;

    color +=
        vec3(1.0) *
        cursorCore *
        uLightIntensity *
        0.055;

    // --------------------------------------------------------
    // Subtle Glass Veil
    // --------------------------------------------------------

    float veil =
        noise(
            uv * 12.0 +
            distortion * 8.0
        );

    color +=
        vec3(1.0) *
        veil *
        uGlassDistortion *
        0.012;

    // --------------------------------------------------------
    // Contrast
    // --------------------------------------------------------

    color =
        color /
        (
            color +
            vec3(0.20)
        );

    color =
        pow(
            color,
            vec3(0.92)
        );

    // --------------------------------------------------------
    // Vignette
    // --------------------------------------------------------

    vec2 vignetteUV =
        uv - 0.5;

    float vignette =
        1.0 -
        dot(
            vignetteUV,
            vignetteUV
        ) *
        0.48;

    color *=
        clamp(
            vignette,
            0.74,
            1.0
        );

    gl_FragColor =
        vec4(
            color,
            1.0
        );
}
`

// ============================================================
// WebGL Helpers
// ============================================================

function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type)

    if (!shader) {
        return null
    }

    gl.shaderSource(shader, source)

    gl.compileShader(shader)

    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

    if (!compiled) {
        console.error(
            "Liquid Glass shader compilation error:",
            gl.getShaderInfoLog(shader)
        )

        gl.deleteShader(shader)

        return null
    }

    return shader
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

    if (!vertexShader || !fragmentShader) {
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

    gl.deleteShader(vertexShader)

    gl.deleteShader(fragmentShader)

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS)

    if (!linked) {
        console.error(
            "Liquid Glass program linking error:",
            gl.getProgramInfoLog(program)
        )

        gl.deleteProgram(program)

        return null
    }

    return program
}

// ============================================================
// Main Component
// ============================================================

export default function LiquidGlass(props: LiquidGlassProps) {
    const {
        refraction,
        glassDistortion,
        lightIntensity,
        rippleRadius,
        cursorInfluence,
        cursorEnabled,
        blur,
        chromaticAberration,
        speed,
        colorPreset,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement | null>(null)

    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const glRef = React.useRef<WebGLRenderingContext | null>(null)

    const programRef = React.useRef<WebGLProgram | null>(null)

    const bufferRef = React.useRef<WebGLBuffer | null>(null)

    const uniformsRef = React.useRef<
        Record<string, WebGLUniformLocation | null>
    >({})

    const animationRef = React.useRef<number | null>(null)

    const destroyedRef = React.useRef(false)

    const visibleRef = React.useRef(true)

    const reducedMotionRef = React.useRef(false)

    const mouseActiveRef = React.useRef(false)

    const mouseRef = React.useRef({
        x: 0.5,
        y: 0.5,
    })

    const targetMouseRef = React.useRef({
        x: 0.5,
        y: 0.5,
    })

    const timeRef = React.useRef(0)

    const lastTimeRef = React.useRef(0)

    // ==========================================================
    // Initialize WebGL
    // ==========================================================

    const initializeWebGL = React.useCallback(() => {
        const canvas = canvasRef.current

        if (!canvas) {
            return false
        }

        const gl = canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
        })

        if (!gl) {
            console.warn("Liquid Glass: WebGL is not available.")

            return false
        }

        const program = createProgram(gl)

        if (!program) {
            return false
        }

        const buffer = gl.createBuffer()

        if (!buffer) {
            gl.deleteProgram(program)

            return false
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1, -1,

                1, -1,

                -1, 1,

                -1, 1,

                1, -1,

                1, 1,
            ]),
            gl.STATIC_DRAW
        )

        gl.useProgram(program)

        const positionLocation = gl.getAttribLocation(program, "aPosition")

        if (positionLocation < 0) {
            gl.deleteBuffer(buffer)

            gl.deleteProgram(program)

            return false
        }

        gl.enableVertexAttribArray(positionLocation)

        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

        const names = [
            "uResolution",
            "uTime",
            "uMouse",
            "uMouseActive",
            "uRefraction",
            "uGlassDistortion",
            "uLightIntensity",
            "uRippleRadius",
            "uCursorInfluence",
            "uBlur",
            "uChromaticAberration",
            "uSpeed",
            "uColorA",
            "uColorB",
            "uColorC",
            "uColorD",
        ]

        const uniforms: Record<string, WebGLUniformLocation | null> = {}

        for (const name of names) {
            uniforms[name] = gl.getUniformLocation(program, name)
        }

        gl.disable(gl.DEPTH_TEST)

        gl.disable(gl.BLEND)

        gl.clearColor(0, 0, 0, 1)

        glRef.current = gl

        programRef.current = program

        bufferRef.current = buffer

        uniformsRef.current = uniforms

        return true
    }, [])

    // ==========================================================
    // Resize
    // ==========================================================

    const resize = React.useCallback(() => {
        const container = containerRef.current

        const canvas = canvasRef.current

        const gl = glRef.current

        if (!container || !canvas || !gl) {
            return
        }

        const rect = container.getBoundingClientRect()

        const width = Math.max(1, Math.round(rect.width))

        const height = Math.max(1, Math.round(rect.height))

        const isMobile = window.innerWidth < 768

        const maxDPR = isMobile ? 1.5 : 2

        const dpr = Math.min(window.devicePixelRatio || 1, maxDPR)

        const pixelWidth = Math.max(1, Math.round(width * dpr))

        const pixelHeight = Math.max(1, Math.round(height * dpr))

        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth

            canvas.height = pixelHeight
        }

        canvas.style.width = `${width}px`

        canvas.style.height = `${height}px`

        gl.viewport(0, 0, pixelWidth, pixelHeight)
    }, [])

    // ==========================================================
    // Render
    // ==========================================================

    const render = React.useCallback(
        (timestamp: number) => {
            const gl = glRef.current

            const program = programRef.current

            const uniforms = uniformsRef.current

            if (!gl || !program || destroyedRef.current) {
                return
            }

            const previous = lastTimeRef.current

            let delta = (timestamp - previous) / 1000

            if (!Number.isFinite(delta) || delta < 0) {
                delta = 0
            }

            delta = Math.min(delta, 0.05)

            lastTimeRef.current = timestamp

            if (!reducedMotionRef.current && !isStaticRenderer) {
                timeRef.current += delta * speed
            }

            // Smooth cursor movement.
            const mouse = mouseRef.current

            const target = targetMouseRef.current

            mouse.x += (target.x - mouse.x) * 0.12

            mouse.y += (target.y - mouse.y) * 0.12

            const preset = COLOR_PRESETS[colorPreset] ?? COLOR_PRESETS.aurora

            gl.useProgram(program)

            const set1f = (name: string, value: number) => {
                const location = uniforms[name]

                if (location) {
                    gl.uniform1f(location, value)
                }
            }

            const set2f = (name: string, x: number, y: number) => {
                const location = uniforms[name]

                if (location) {
                    gl.uniform2f(location, x, y)
                }
            }

            const set3f = (name: string, value: [number, number, number]) => {
                const location = uniforms[name]

                if (location) {
                    gl.uniform3f(location, value[0], value[1], value[2])
                }
            }

            set2f("uResolution", gl.drawingBufferWidth, gl.drawingBufferHeight)

            set1f("uTime", timeRef.current)

            set2f("uMouse", mouse.x, mouse.y)

            set1f(
                "uMouseActive",
                cursorEnabled && mouseActiveRef.current ? 1 : 0
            )

            set1f("uRefraction", refraction)

            set1f("uGlassDistortion", glassDistortion)

            set1f("uLightIntensity", lightIntensity)

            set1f("uRippleRadius", rippleRadius)

            set1f("uCursorInfluence", cursorInfluence)

            set1f("uBlur", blur)

            set1f("uChromaticAberration", chromaticAberration)

            set1f("uSpeed", speed)

            set3f("uColorA", preset.a)

            set3f("uColorB", preset.b)

            set3f("uColorC", preset.c)

            set3f("uColorD", preset.d)

            gl.drawArrays(gl.TRIANGLES, 0, 6)
        },
        [
            refraction,
            glassDistortion,
            lightIntensity,
            rippleRadius,
            cursorInfluence,
            cursorEnabled,
            blur,
            chromaticAberration,
            speed,
            colorPreset,
            isStaticRenderer,
        ]
    )

    // ==========================================================
    // Animation Loop
    // ==========================================================

    const startAnimation = React.useCallback(() => {
        if (isStaticRenderer || destroyedRef.current) {
            return
        }

        if (animationRef.current !== null) {
            return
        }

        lastTimeRef.current = performance.now()

        const frame = (timestamp: number) => {
            animationRef.current = null

            if (destroyedRef.current) {
                return
            }

            if (!visibleRef.current) {
                return
            }

            render(timestamp)

            animationRef.current = requestAnimationFrame(frame)
        }

        animationRef.current = requestAnimationFrame(frame)
    }, [render, isStaticRenderer])

    // ==========================================================
    // Stop Animation
    // ==========================================================

    const stopAnimation = React.useCallback(() => {
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current)

            animationRef.current = null
        }
    }, [])

    // ==========================================================
    // Main Effect
    // ==========================================================

    React.useEffect(() => {
        const container = containerRef.current

        const canvas = canvasRef.current

        if (!container || !canvas) {
            return
        }

        destroyedRef.current = false

        // ------------------------------------------------------
        // Reduced Motion
        // ------------------------------------------------------

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

        reducedMotionRef.current = mediaQuery.matches

        const handleMotionChange = () => {
            reducedMotionRef.current = mediaQuery.matches
        }

        mediaQuery.addEventListener("change", handleMotionChange)

        // ------------------------------------------------------
        // Initialize WebGL
        // ------------------------------------------------------

        const initialized = initializeWebGL()

        if (!initialized) {
            mediaQuery.removeEventListener("change", handleMotionChange)

            return
        }

        resize()

        // ------------------------------------------------------
        // Resize Observer
        // ------------------------------------------------------

        const resizeObserver = new ResizeObserver(() => {
            resize()
        })

        resizeObserver.observe(container)

        // ------------------------------------------------------
        // Intersection Observer
        // ------------------------------------------------------

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                if (!entry) {
                    return
                }

                visibleRef.current = entry.isIntersecting

                if (visibleRef.current) {
                    if (!isStaticRenderer) {
                        startAnimation()
                    } else {
                        render(performance.now())
                    }
                } else {
                    stopAnimation()
                }
            },
            {
                threshold: 0,
            }
        )

        intersectionObserver.observe(container)

        // ------------------------------------------------------
        // Pointer Move
        // ------------------------------------------------------

        const handlePointerMove = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()

            if (rect.width <= 0 || rect.height <= 0) {
                return
            }

            const x = (event.clientX - rect.left) / rect.width

            const y = 1 - (event.clientY - rect.top) / rect.height

            targetMouseRef.current.x = Math.max(0, Math.min(1, x))

            targetMouseRef.current.y = Math.max(0, Math.min(1, y))

            mouseActiveRef.current = true
        }

        const handlePointerLeave = () => {
            mouseActiveRef.current = false
        }

        canvas.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })

        canvas.addEventListener("pointerleave", handlePointerLeave)

        // ------------------------------------------------------
        // Context Lost
        // ------------------------------------------------------

        const handleContextLost = (event: Event) => {
            event.preventDefault()

            stopAnimation()
        }

        // ------------------------------------------------------
        // Context Restored
        // ------------------------------------------------------

        const handleContextRestored = () => {
            if (destroyedRef.current) {
                return
            }

            initializeWebGL()

            resize()

            if (isStaticRenderer) {
                render(performance.now())
            } else if (visibleRef.current) {
                startAnimation()
            }
        }

        canvas.addEventListener("webglcontextlost", handleContextLost)

        canvas.addEventListener("webglcontextrestored", handleContextRestored)

        // ------------------------------------------------------
        // Initial Render
        // ------------------------------------------------------

        if (isStaticRenderer) {
            render(performance.now())
        } else {
            startAnimation()
        }

        // ------------------------------------------------------
        // Cleanup
        // ------------------------------------------------------

        return () => {
            destroyedRef.current = true

            stopAnimation()

            resizeObserver.disconnect()

            intersectionObserver.disconnect()

            mediaQuery.removeEventListener("change", handleMotionChange)

            canvas.removeEventListener("pointermove", handlePointerMove)

            canvas.removeEventListener("pointerleave", handlePointerLeave)

            canvas.removeEventListener("webglcontextlost", handleContextLost)

            canvas.removeEventListener(
                "webglcontextrestored",
                handleContextRestored
            )

            const gl = glRef.current

            const program = programRef.current

            const buffer = bufferRef.current

            if (gl && buffer) {
                gl.deleteBuffer(buffer)
            }

            if (gl && program) {
                gl.deleteProgram(program)
            }

            glRef.current = null

            programRef.current = null

            bufferRef.current = null

            uniformsRef.current = {}
        }
    }, [
        initializeWebGL,
        resize,
        render,
        startAnimation,
        stopAnimation,
        isStaticRenderer,
    ])

    // ==========================================================
    // Component
    // ==========================================================

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                background: "#08080D",
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: "none",
                }}
            />
        </div>
    )
}

// ============================================================
// Default Props
// ============================================================

LiquidGlass.defaultProps = {
    refraction: 0.65,
    glassDistortion: 0.55,
    lightIntensity: 0.75,
    rippleRadius: 0.24,
    cursorInfluence: 0.85,
    cursorEnabled: true,
    blur: 0.22,
    chromaticAberration: 0.18,
    speed: 0.35,
    colorPreset: "aurora",
}

// ============================================================
// Framer Property Controls
// ============================================================

addPropertyControls(LiquidGlass, {
    refraction: {
        type: ControlType.Number,
        title: "Refraction",
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description:
            "Controls how strongly the glass bends the background around the cursor.",
    },

    glassDistortion: {
        type: ControlType.Number,
        title: "Glass Distortion",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description:
            "Controls the organic deformation and movement of the invisible glass surface.",
    },

    lightIntensity: {
        type: ControlType.Number,
        title: "Light Intensity",
        defaultValue: 0.75,
        min: 0,
        max: 2,
        step: 0.01,
        displayStepper: true,
        description:
            "Controls the brightness of reflections, highlights, and optical glow.",
    },

    rippleRadius: {
        type: ControlType.Number,
        title: "Ripple Radius",
        defaultValue: 0.24,
        min: 0.05,
        max: 0.6,
        step: 0.01,
        displayStepper: true,
        description:
            "Controls the size of the interactive ripple and lens area around the cursor.",
    },

    cursorInfluence: {
        type: ControlType.Number,
        title: "Cursor Influence",
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description:
            "Controls how strongly pointer movement affects the liquid glass surface.",
    },

    cursorEnabled: {
        type: ControlType.Boolean,
        title: "Cursor",
        defaultValue: true,
        description:
            "Enable or disable the interactive cursor lens and glass distortion.",
    },

    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 0.22,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description:
            "Controls the softness and diffusion of the distorted glass effect.",
    },

    chromaticAberration: {
        type: ControlType.Number,
        title: "Chromatic Aberration",
        defaultValue: 0.18,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description:
            "Controls RGB color separation around distorted areas for an optical-glass effect.",
    },

    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.35,
        min: 0,
        max: 2,
        step: 0.01,
        displayStepper: true,
        description:
            "Controls the speed of the subtle animated movement inside the glass.",
    },

    colorPreset: {
        type: ControlType.Enum,
        title: "Color Preset",
        defaultValue: "aurora",
        options: [
            "aurora",
            "ocean",
            "violet",
            "sunset",
            "emerald",
            "monochrome",
        ],
        optionTitles: [
            "Aurora",
            "Ocean",
            "Violet",
            "Sunset",
            "Emerald",
            "Monochrome",
        ],
        description:
            "Choose the overall color atmosphere of the liquid glass background.",
    },
})

// ============================================================
// Made with 💛 by Karim Saif
// ============================================================
