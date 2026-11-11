// ============================================================
// LIVING TOPOGRAPHY
// Premium Procedural Topographic Terrain Shader for Framer
//
// Made with 💛 by Karim Saif
//
// Procedural WebGL2 elevation-map background with:
// • Animated terrain
// • Regenerating contour lines
// • Cursor gravity well
// • Click waves
// • Multiple color presets
// • Custom colors
// • Monochrome mode
// • Responsive rendering
// • Viewport-aware rendering
// • WebGL context recovery
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
// TYPES
// ============================================================

type ColorPreset =
    | "aurora"
    | "violet"
    | "cyan"
    | "ember"
    | "ocean"
    | "mono"
    | "custom"

interface Props {
    colorPreset: ColorPreset

    primaryColor: string
    secondaryColor: string
    backgroundColor: string

    zoom: number
    lineDensity: number
    terrainDepth: number
    glow: number

    animationSpeed: number
    morphAmount: number

    cursorInteraction: boolean
    cursorStrength: number
    cursorRadius: number

    clickWaves: boolean
    waveStrength: number
    waveSpeed: number
    waveDecay: number

    monochrome: boolean

    quality: number
}

// ============================================================
// INTERNAL CONFIG
// ============================================================

interface Config {
    colorPreset: ColorPreset

    primaryColor: string
    secondaryColor: string
    backgroundColor: string

    zoom: number
    lineDensity: number
    terrainDepth: number
    glow: number

    animationSpeed: number
    morphAmount: number

    cursorInteraction: boolean
    cursorStrength: number
    cursorRadius: number

    clickWaves: boolean
    waveStrength: number
    waveSpeed: number
    waveDecay: number

    monochrome: boolean

    quality: number
}

interface WebGLResources {
    program: WebGLProgram
    vao: WebGLVertexArrayObject
    positionBuffer: WebGLBuffer

    locations: {
        resolution: WebGLUniformLocation | null
        time: WebGLUniformLocation | null

        zoom: WebGLUniformLocation | null
        density: WebGLUniformLocation | null
        depth: WebGLUniformLocation | null
        glow: WebGLUniformLocation | null

        animationSpeed: WebGLUniformLocation | null
        morphAmount: WebGLUniformLocation | null

        mouse: WebGLUniformLocation | null
        cursorEnabled: WebGLUniformLocation | null
        cursorStrength: WebGLUniformLocation | null
        cursorRadius: WebGLUniformLocation | null

        wavePosition: WebGLUniformLocation | null
        waveTime: WebGLUniformLocation | null
        waveEnabled: WebGLUniformLocation | null
        waveStrength: WebGLUniformLocation | null
        waveSpeed: WebGLUniformLocation | null
        waveDecay: WebGLUniformLocation | null

        primaryColor: WebGLUniformLocation | null
        secondaryColor: WebGLUniformLocation | null
        backgroundColor: WebGLUniformLocation | null

        monochrome: WebGLUniformLocation | null
    }
}

// ============================================================
// VERTEX SHADER
// ============================================================

const VERTEX_SHADER = `#version 300 es

in vec2 aPosition;

out vec2 vUv;

void main() {

    vUv =
        aPosition *
        0.5 +
        0.5;

    gl_Position =
        vec4(
            aPosition,
            0.0,
            1.0
        );
}
`

// ============================================================
// FRAGMENT SHADER
// ============================================================

const FRAGMENT_SHADER = `#version 300 es

precision highp float;

out vec4 outColor;

in vec2 vUv;

// ============================================================
// GLOBAL UNIFORMS
// ============================================================

uniform vec2 uResolution;
uniform float uTime;

uniform float uZoom;
uniform float uDensity;
uniform float uDepth;
uniform float uGlow;

uniform float uAnimationSpeed;
uniform float uMorphAmount;

uniform vec2 uMouse;
uniform float uCursorEnabled;
uniform float uCursorStrength;
uniform float uCursorRadius;

uniform vec2 uWavePosition;
uniform float uWaveTime;
uniform float uWaveEnabled;
uniform float uWaveStrength;
uniform float uWaveSpeed;
uniform float uWaveDecay;

uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform vec3 uBackgroundColor;

uniform float uMonochrome;

// ============================================================
// HASH
// ============================================================

float hash21(vec2 p) {

    p =
        fract(
            p *
            vec2(
                127.1,
                311.7
            )
        );

    p +=
        dot(
            p,
            p +
            19.19
        );

    return fract(
        p.x *
        p.y
    );
}

// ============================================================
// VALUE NOISE
// ============================================================

float noise(vec2 p) {

    vec2 i =
        floor(p);

    vec2 f =
        fract(p);

    f =
        f *
        f *
        (
            3.0 -
            2.0 *
            f
        );

    float a =
        hash21(i);

    float b =
        hash21(
            i +
            vec2(
                1.0,
                0.0
            )
        );

    float c =
        hash21(
            i +
            vec2(
                0.0,
                1.0
            )
        );

    float d =
        hash21(
            i +
            vec2(
                1.0,
                1.0
            )
        );

    return mix(
        mix(
            a,
            b,
            f.x
        ),
        mix(
            c,
            d,
            f.x
        ),
        f.y
    );
}

// ============================================================
// FBM
// ============================================================

float fbm(vec2 p) {

    float value =
        0.0;

    float amplitude =
        0.5;

    value +=
        noise(p) *
        amplitude;

    p =
        p *
        2.02 +
        17.13;

    amplitude *=
        0.5;

    value +=
        noise(p) *
        amplitude;

    p =
        p *
        2.01 +
        31.71;

    amplitude *=
        0.5;

    value +=
        noise(p) *
        amplitude;

    p =
        p *
        2.03 +
        57.31;

    amplitude *=
        0.5;

    value +=
        noise(p) *
        amplitude;

    return value;
}

// ============================================================
// TERRAIN
// ============================================================

float terrain(vec2 p) {

    float t =
        uTime *
        uAnimationSpeed *
        uMorphAmount;

    vec2 driftA =
        vec2(
            t *
            0.025,

            -t *
            0.018
        );

    vec2 driftB =
        vec2(
            -t *
            0.015,

            t *
            0.022
        );

    float large =
        fbm(
            p *
            0.55 +
            driftA
        );

    float medium =
        fbm(
            p *
            1.20 +
            driftB +
            11.7
        );

    float fine =
        fbm(
            p *
            2.35 -
            driftA *
            0.35 +
            43.1
        );

    float elevation =
        large *
        0.62 +

        medium *
        0.28 +

        fine *
        0.10;

    // ========================================================
    // CURSOR GRAVITY WELL
    // ========================================================

    if (
        uCursorEnabled >
        0.5
    ) {

        float distanceToCursor =
            distance(
                p,
                uMouse
            );

        float influence =
            1.0 -
            smoothstep(
                0.0,
                uCursorRadius,
                distanceToCursor
            );

        influence *=
            influence;

        elevation -=
            influence *
            uCursorStrength *
            0.24;

        float ripple =
            sin(
                distanceToCursor *
                17.0
            );

        elevation +=
            ripple *
            influence *
            uCursorStrength *
            0.065;
    }

    // ========================================================
    // CLICK WAVE
    // ========================================================

    if (
        uWaveEnabled >
        0.5 &&
        uWaveTime >=
        0.0
    ) {

        float distanceToWave =
            distance(
                p,
                uWavePosition
            );

        float front =
            distanceToWave -
            uWaveTime *
            uWaveSpeed;

        float wave =
            sin(
                front *
                18.0
            );

        float envelope =
            exp(
                -abs(front) *
                uWaveDecay
            );

        elevation +=
            wave *
            envelope *
            uWaveStrength *
            0.20;
    }

    return elevation;
}

// ============================================================
// TERRAIN NORMAL
// ============================================================

vec3 terrainNormal(
    vec2 p
) {

    float epsilon =
        0.012;

    float left =
        terrain(
            p -
            vec2(
                epsilon,
                0.0
            )
        );

    float right =
        terrain(
            p +
            vec2(
                epsilon,
                0.0
            )
        );

    float down =
        terrain(
            p -
            vec2(
                0.0,
                epsilon
            )
        );

    float up =
        terrain(
            p +
            vec2(
                0.0,
                epsilon
            )
        );

    float dx =
        right -
        left;

    float dy =
        up -
        down;

    return normalize(
        vec3(
            -dx *
            uDepth *
            2.4,

            -dy *
            uDepth *
            2.4,

            1.0
        )
    );
}

// ============================================================
// TERRAIN SPACE
// ============================================================

vec2 terrainSpace(
    vec2 uv
) {

    vec2 p =
        uv *
        2.0 -
        1.0;

    float aspect =
        uResolution.x /
        max(
            uResolution.y,
            1.0
        );

    p.x *=
        aspect;

    p *=
        uZoom;

    return p;
}

// ============================================================
// MAIN
// ============================================================

void main() {

    vec2 p =
        terrainSpace(
            vUv
        );

    float elevation =
        terrain(p);

    // ========================================================
    // CONTOUR LINES
    // ========================================================

    float contour =
        elevation *
        uDensity;

    float contourFraction =
        fract(
            contour
        );

    float contourDistance =
        min(
            contourFraction,
            1.0 -
            contourFraction
        );

    float lineWidth =
        mix(
            0.050,
            0.010,
            clamp(
                uDensity /
                40.0,
                0.0,
                1.0
            )
        );

    float line =
        1.0 -
        smoothstep(
            0.0,
            lineWidth,
            contourDistance
        );

    // ========================================================
    // FINE CONTOURS
    // ========================================================

    float fineContour =
        elevation *
        uDensity *
        2.0;

    float fineFraction =
        fract(
            fineContour
        );

    float fineDistance =
        min(
            fineFraction,
            1.0 -
            fineFraction
        );

    float fineLine =
        1.0 -
        smoothstep(
            0.0,
            lineWidth *
            0.30,
            fineDistance
        );

    line =
        max(
            line,
            fineLine *
            0.26
        );

    // ========================================================
    // MAJOR CONTOURS
    // ========================================================

    float majorContour =
        elevation *
        uDensity *
        0.20;

    float majorFraction =
        fract(
            majorContour
        );

    float majorDistance =
        min(
            majorFraction,
            1.0 -
            majorFraction
        );

    float majorLine =
        1.0 -
        smoothstep(
            0.0,
            lineWidth *
            1.55,
            majorDistance
        );

    line =
        max(
            line,
            majorLine *
            0.88
        );

    // ========================================================
    // LIGHT
    // ========================================================

    vec3 normal =
        terrainNormal(
            p
        );

    vec3 light =
        normalize(
            vec3(
                -0.45,
                0.55,
                0.85
            )
        );

    float lighting =
        dot(
            normal,
            light
        );

    lighting =
        lighting *
        0.5 +
        0.5;

    // ========================================================
    // COLOR
    // ========================================================

    float colorPosition =
        clamp(
            elevation *
            1.35 +
            0.15,
            0.0,
            1.0
        );

    vec3 terrainColor =
        mix(
            uSecondaryColor,
            uPrimaryColor,
            colorPosition
        );

    // ========================================================
    // MONOCHROME
    // ========================================================

    if (
        uMonochrome >
        0.5
    ) {

        float luminance =
            dot(
                terrainColor,
                vec3(
                    0.299,
                    0.587,
                    0.114
                )
            );

        terrainColor =
            vec3(
                luminance
            );
    }

    // ========================================================
    // GLOW
    // ========================================================

    float lineGlow =
        line *
        (
            0.65 +
            lighting *
            0.75
        ) *
        uGlow;

    float softGlow =
        1.0 -
        smoothstep(
            0.0,
            0.14,
            contourDistance
        );

    lineGlow +=
        softGlow *
        uGlow *
        0.035;

    // ========================================================
    // FINAL COLOR
    // ========================================================

    vec3 color =
        uBackgroundColor;

    color +=
        terrainColor *
        lineGlow;

    color +=
        terrainColor *
        line *
        0.28;

    color +=
        terrainColor *
        max(
            elevation,
            0.0
        ) *
        uDepth *
        0.018;

    // ========================================================
    // VIGNETTE
    // ========================================================

    vec2 centered =
        vUv *
        2.0 -
        1.0;

    float vignette =
        1.0 -
        dot(
            centered,
            centered
        ) *
        0.13;

    color *=
        clamp(
            vignette,
            0.72,
            1.0
        );

    // ========================================================
    // SUBTLE GRAIN
    // ========================================================

    float grain =
        hash21(
            gl_FragCoord.xy *
            0.07
        );

    color +=
        (
            grain -
            0.5
        ) *
        0.006;

    outColor =
        vec4(
            max(
                color,
                vec3(0.0)
            ),
            1.0
        );
}
`

// ============================================================
// SHADER COMPILATION
// ============================================================

function compileShader(
    gl: WebGL2RenderingContext,
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
            "Living Topography shader compilation error:",
            gl.getShaderInfoLog(shader)
        )

        gl.deleteShader(shader)

        return null
    }

    return shader
}

// ============================================================
// PROGRAM CREATION
// ============================================================

function createProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)

    const fragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        FRAGMENT_SHADER
    )

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
            "Living Topography program linking error:",
            gl.getProgramInfoLog(program)
        )

        gl.deleteProgram(program)

        return null
    }

    return program
}

// ============================================================
// RESOURCE CREATION
// ============================================================

function createResources(gl: WebGL2RenderingContext): WebGLResources | null {
    const program = createProgram(gl)

    if (!program) {
        return null
    }

    const positionLocation = gl.getAttribLocation(program, "aPosition")

    const positionBuffer = gl.createBuffer()

    const vao = gl.createVertexArray()

    if (!positionBuffer || !vao) {
        if (positionBuffer) {
            gl.deleteBuffer(positionBuffer)
        }

        if (vao) {
            gl.deleteVertexArray(vao)
        }

        gl.deleteProgram(program)

        return null
    }

    gl.bindVertexArray(vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

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

    gl.enableVertexAttribArray(positionLocation)

    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    gl.bindVertexArray(null)

    const locations = {
        resolution: gl.getUniformLocation(program, "uResolution"),

        time: gl.getUniformLocation(program, "uTime"),

        zoom: gl.getUniformLocation(program, "uZoom"),

        density: gl.getUniformLocation(program, "uDensity"),

        depth: gl.getUniformLocation(program, "uDepth"),

        glow: gl.getUniformLocation(program, "uGlow"),

        animationSpeed: gl.getUniformLocation(program, "uAnimationSpeed"),

        morphAmount: gl.getUniformLocation(program, "uMorphAmount"),

        mouse: gl.getUniformLocation(program, "uMouse"),

        cursorEnabled: gl.getUniformLocation(program, "uCursorEnabled"),

        cursorStrength: gl.getUniformLocation(program, "uCursorStrength"),

        cursorRadius: gl.getUniformLocation(program, "uCursorRadius"),

        wavePosition: gl.getUniformLocation(program, "uWavePosition"),

        waveTime: gl.getUniformLocation(program, "uWaveTime"),

        waveEnabled: gl.getUniformLocation(program, "uWaveEnabled"),

        waveStrength: gl.getUniformLocation(program, "uWaveStrength"),

        waveSpeed: gl.getUniformLocation(program, "uWaveSpeed"),

        waveDecay: gl.getUniformLocation(program, "uWaveDecay"),

        primaryColor: gl.getUniformLocation(program, "uPrimaryColor"),

        secondaryColor: gl.getUniformLocation(program, "uSecondaryColor"),

        backgroundColor: gl.getUniformLocation(program, "uBackgroundColor"),

        monochrome: gl.getUniformLocation(program, "uMonochrome"),
    }

    return {
        program,
        vao,
        positionBuffer,
        locations,
    }
}

// ============================================================
// RESOURCE DESTRUCTION
// ============================================================

function destroyResources(
    gl: WebGL2RenderingContext,
    resources: WebGLResources | null
) {
    if (!resources) {
        return
    }

    gl.deleteVertexArray(resources.vao)

    gl.deleteBuffer(resources.positionBuffer)

    gl.deleteProgram(resources.program)
}

// ============================================================
// COLOR HELPERS
// ============================================================

function hexToRgb(value: string): [number, number, number] {
    let hex = value.replace("#", "").trim()

    // Handle rgb()/rgba() values gracefully.
    if (value.startsWith("rgb")) {
        const numbers = value.match(/[\d.]+/g)

        if (numbers && numbers.length >= 3) {
            return [
                Math.min(255, Number(numbers[0])) / 255,

                Math.min(255, Number(numbers[1])) / 255,

                Math.min(255, Number(numbers[2])) / 255,
            ]
        }
    }

    if (hex.length === 3) {
        hex = hex
            .split("")
            .map((char) => char + char)
            .join("")
    }

    if (hex.length !== 6) {
        return [1, 1, 1]
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255

    const g = parseInt(hex.substring(2, 4), 16) / 255

    const b = parseInt(hex.substring(4, 6), 16) / 255

    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
        return [1, 1, 1]
    }

    return [r, g, b]
}

// ============================================================
// COLOR PRESETS
// ============================================================

function getColors(config: Config) {
    switch (config.colorPreset) {
        case "aurora":
            return {
                primary: "#67F7D4",

                secondary: "#6D8CFF",

                background: "#050811",
            }

        case "violet":
            return {
                primary: "#D79BFF",

                secondary: "#675BFF",

                background: "#080510",
            }

        case "cyan":
            return {
                primary: "#67E8FF",

                secondary: "#197DFF",

                background: "#031018",
            }

        case "ember":
            return {
                primary: "#FFD06B",

                secondary: "#FF5577",

                background: "#100605",
            }

        case "ocean":
            return {
                primary: "#6BE8FF",

                secondary: "#2457D6",

                background: "#031019",
            }

        case "mono":
            return {
                primary: "#FFFFFF",

                secondary: "#7A8494",

                background: "#050608",
            }

        case "custom":

        default:
            return {
                primary: config.primaryColor,

                secondary: config.secondaryColor,

                background: config.backgroundColor,
            }
    }
}

// ============================================================
// COMPONENT
// ============================================================

export default function LivingTopography(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()

    const configRef = React.useRef<Config>(props as Config)

    configRef.current = props as Config

    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const containerRef = React.useRef<HTMLDivElement>(null)

    const resourcesRef = React.useRef<WebGLResources | null>(null)

    const glRef = React.useRef<WebGL2RenderingContext | null>(null)

    const renderRef = React.useRef<((time: number) => void) | null>(null)

    const visibleRef = React.useRef(true)

    const destroyedRef = React.useRef(false)

    const animationFrameRef = React.useRef(0)

    const lastTimeRef = React.useRef(0)

    const mouseTargetRef = React.useRef({
        x: 999,
        y: 999,
    })

    const mouseCurrentRef = React.useRef({
        x: 999,
        y: 999,
    })

    const waveRef = React.useRef({
        x: 0,
        y: 0,
        time: -1,
    })

    const [webglSupported, setWebglSupported] = React.useState(true)

    // ========================================================
    // POINTER POSITION
    // ========================================================

    const getPointerPosition = React.useCallback((event: PointerEvent) => {
        const canvas = canvasRef.current

        if (!canvas) {
            return null
        }

        const rect = canvas.getBoundingClientRect()

        if (rect.width <= 0 || rect.height <= 0) {
            return null
        }

        const normalizedX = (event.clientX - rect.left) / rect.width

        const normalizedY = 1 - (event.clientY - rect.top) / rect.height

        const config = configRef.current

        return {
            x: (normalizedX * 2 - 1) * config.zoom * (rect.width / rect.height),

            y: (normalizedY * 2 - 1) * config.zoom,
        }
    }, [])

    // ========================================================
    // WEBGL INITIALIZATION
    // ========================================================

    React.useEffect(() => {
        const canvas = canvasRef.current

        const container = containerRef.current

        if (!canvas || !container) {
            return
        }

        destroyedRef.current = false

        const gl = canvas.getContext("webgl2", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
        })

        if (!gl) {
            setWebglSupported(false)

            return
        }

        glRef.current = gl

        setWebglSupported(true)

        let resources = createResources(gl)

        if (!resources) {
            setWebglSupported(false)

            return
        }

        resourcesRef.current = resources

        // ==================================================
        // RESIZE
        // ==================================================

        const resize = () => {
            const rect = container.getBoundingClientRect()

            const config = configRef.current

            const dpr = Math.min(window.devicePixelRatio || 1, 2)

            const quality = Math.max(0.5, Math.min(1, config.quality))

            const width = Math.max(1, Math.floor(rect.width * dpr * quality))

            const height = Math.max(1, Math.floor(rect.height * dpr * quality))

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width

                canvas.height = height

                gl.viewport(0, 0, width, height)
            }
        }

        resize()

        // ==================================================
        // RENDER
        // ==================================================

        const render = (now: number) => {
            if (destroyedRef.current) {
                return
            }

            if (!visibleRef.current) {
                return
            }

            const currentResources = resourcesRef.current

            if (!currentResources) {
                return
            }

            const config = configRef.current

            const delta = Math.min(
                0.05,
                lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0.016
            )

            lastTimeRef.current = now

            // Smooth cursor.
            mouseCurrentRef.current.x +=
                (mouseTargetRef.current.x - mouseCurrentRef.current.x) *
                Math.min(1, delta * 9)

            mouseCurrentRef.current.y +=
                (mouseTargetRef.current.y - mouseCurrentRef.current.y) *
                Math.min(1, delta * 9)

            // Advance click wave.
            if (waveRef.current.time >= 0) {
                waveRef.current.time += delta

                if (waveRef.current.time > 10) {
                    waveRef.current.time = -1
                }
            }

            const colors = getColors(config)

            const primary = hexToRgb(colors.primary)

            const secondary = hexToRgb(colors.secondary)

            const background = hexToRgb(colors.background)

            const locations = currentResources.locations

            gl.useProgram(currentResources.program)

            gl.bindVertexArray(currentResources.vao)

            // Resolution.
            if (locations.resolution) {
                gl.uniform2f(locations.resolution, canvas.width, canvas.height)
            }

            // Time.
            if (locations.time) {
                gl.uniform1f(locations.time, now / 1000)
            }

            // Terrain.
            if (locations.zoom) {
                gl.uniform1f(locations.zoom, config.zoom)
            }

            if (locations.density) {
                gl.uniform1f(locations.density, config.lineDensity)
            }

            if (locations.depth) {
                gl.uniform1f(locations.depth, config.terrainDepth)
            }

            if (locations.glow) {
                gl.uniform1f(locations.glow, config.glow)
            }

            // Animation.
            if (locations.animationSpeed) {
                gl.uniform1f(locations.animationSpeed, config.animationSpeed)
            }

            if (locations.morphAmount) {
                gl.uniform1f(locations.morphAmount, config.morphAmount)
            }

            // Cursor.
            if (locations.mouse) {
                gl.uniform2f(
                    locations.mouse,
                    mouseCurrentRef.current.x,
                    mouseCurrentRef.current.y
                )
            }

            if (locations.cursorEnabled) {
                gl.uniform1f(
                    locations.cursorEnabled,
                    config.cursorInteraction ? 1 : 0
                )
            }

            if (locations.cursorStrength) {
                gl.uniform1f(locations.cursorStrength, config.cursorStrength)
            }

            if (locations.cursorRadius) {
                gl.uniform1f(locations.cursorRadius, config.cursorRadius)
            }

            // Click wave.
            if (locations.wavePosition) {
                gl.uniform2f(
                    locations.wavePosition,
                    waveRef.current.x,
                    waveRef.current.y
                )
            }

            if (locations.waveTime) {
                gl.uniform1f(locations.waveTime, waveRef.current.time)
            }

            if (locations.waveEnabled) {
                gl.uniform1f(locations.waveEnabled, config.clickWaves ? 1 : 0)
            }

            if (locations.waveStrength) {
                gl.uniform1f(locations.waveStrength, config.waveStrength)
            }

            if (locations.waveSpeed) {
                gl.uniform1f(locations.waveSpeed, config.waveSpeed)
            }

            if (locations.waveDecay) {
                gl.uniform1f(locations.waveDecay, config.waveDecay)
            }

            // Colors.
            if (locations.primaryColor) {
                gl.uniform3f(
                    locations.primaryColor,
                    primary[0],
                    primary[1],
                    primary[2]
                )
            }

            if (locations.secondaryColor) {
                gl.uniform3f(
                    locations.secondaryColor,
                    secondary[0],
                    secondary[1],
                    secondary[2]
                )
            }

            if (locations.backgroundColor) {
                gl.uniform3f(
                    locations.backgroundColor,
                    background[0],
                    background[1],
                    background[2]
                )
            }

            // Monochrome.
            if (locations.monochrome) {
                gl.uniform1f(locations.monochrome, config.monochrome ? 1 : 0)
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6)

            gl.bindVertexArray(null)

            // ==================================================
            // IMPORTANT STATIC RENDERER FIX
            // ==================================================
            //
            // Static renderer:
            //     render once
            //
            // Live preview/site:
            //     continue RAF loop
            //
            if (
                !isStaticRenderer &&
                !destroyedRef.current &&
                visibleRef.current
            ) {
                animationFrameRef.current = requestAnimationFrame(render)
            }
        }

        renderRef.current = render

        // ==================================================
        // POINTER EVENTS
        // ==================================================

        const pointerMove = (event: PointerEvent) => {
            const point = getPointerPosition(event)

            if (!point) {
                return
            }

            mouseTargetRef.current = point
        }

        const pointerLeave = () => {
            mouseTargetRef.current = {
                x: 999,
                y: 999,
            }
        }

        const pointerDown = (event: PointerEvent) => {
            const config = configRef.current

            if (!config.clickWaves) {
                return
            }

            const point = getPointerPosition(event)

            if (!point) {
                return
            }

            waveRef.current = {
                x: point.x,

                y: point.y,

                time: 0,
            }
        }

        container.addEventListener("pointermove", pointerMove, {
            passive: true,
        })

        container.addEventListener("pointerleave", pointerLeave, {
            passive: true,
        })

        container.addEventListener("pointerdown", pointerDown, {
            passive: true,
        })

        // ==================================================
        // RESIZE OBSERVER
        // ==================================================

        const resizeObserver = new ResizeObserver(resize)

        resizeObserver.observe(container)

        // ==================================================
        // INTERSECTION OBSERVER
        // ==================================================

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                const nextVisible = entry?.isIntersecting ?? true

                if (nextVisible === visibleRef.current) {
                    return
                }

                visibleRef.current = nextVisible

                if (!nextVisible) {
                    cancelAnimationFrame(animationFrameRef.current)

                    animationFrameRef.current = 0

                    return
                }

                // Restart only for live rendering.
                if (!isStaticRenderer && !destroyedRef.current) {
                    lastTimeRef.current = performance.now()

                    animationFrameRef.current = requestAnimationFrame(render)
                }
            },
            {
                rootMargin: "150px",

                threshold: 0,
            }
        )

        intersectionObserver.observe(container)

        // ==================================================
        // WEBGL CONTEXT LOST
        // ==================================================

        const handleContextLost = (event: Event) => {
            event.preventDefault()

            cancelAnimationFrame(animationFrameRef.current)

            animationFrameRef.current = 0

            resourcesRef.current = null
        }

        // ==================================================
        // WEBGL CONTEXT RESTORED
        // ==================================================

        const handleContextRestored = () => {
            if (destroyedRef.current) {
                return
            }

            const restoredGl = glRef.current

            if (!restoredGl) {
                return
            }

            // Completely rebuild:
            // program
            // uniforms
            // VAO
            // vertex buffer
            const rebuiltResources = createResources(restoredGl)

            if (!rebuiltResources) {
                setWebglSupported(false)

                return
            }

            resourcesRef.current = rebuiltResources

            resize()

            lastTimeRef.current = performance.now()

            // Render once immediately after restore.
            if (renderRef.current && visibleRef.current) {
                renderRef.current(performance.now())
            }
        }

        canvas.addEventListener("webglcontextlost", handleContextLost)

        canvas.addEventListener("webglcontextrestored", handleContextRestored)

        // ==================================================
        // FIRST RENDER
        // ==================================================

        lastTimeRef.current = performance.now()

        if (renderRef.current) {
            if (isStaticRenderer) {
                // Exactly one render.
                renderRef.current(performance.now())
            } else {
                animationFrameRef.current = requestAnimationFrame(render)
            }
        }

        // ==================================================
        // CLEANUP
        // ==================================================

        return () => {
            destroyedRef.current = true

            cancelAnimationFrame(animationFrameRef.current)

            animationFrameRef.current = 0

            resizeObserver.disconnect()

            intersectionObserver.disconnect()

            container.removeEventListener("pointermove", pointerMove)

            container.removeEventListener("pointerleave", pointerLeave)

            container.removeEventListener("pointerdown", pointerDown)

            canvas.removeEventListener("webglcontextlost", handleContextLost)

            canvas.removeEventListener(
                "webglcontextrestored",
                handleContextRestored
            )

            const currentGl = glRef.current

            if (currentGl) {
                destroyResources(currentGl, resourcesRef.current)
            }

            resourcesRef.current = null

            renderRef.current = null

            glRef.current = null
        }
    }, [isStaticRenderer, getPointerPosition])

    // ========================================================
    // STATIC RENDER UPDATE
    // ========================================================
    //
    // When Framer is using its static renderer, controls may
    // change without rebuilding the WebGL system.
    //
    // Render exactly once after those prop changes.
    // ========================================================

    React.useEffect(() => {
        if (!isStaticRenderer) {
            return
        }

        if (destroyedRef.current) {
            return
        }

        if (!visibleRef.current) {
            return
        }

        if (renderRef.current) {
            renderRef.current(performance.now())
        }
    }, [
        isStaticRenderer,

        props.colorPreset,

        props.primaryColor,
        props.secondaryColor,
        props.backgroundColor,

        props.zoom,
        props.lineDensity,
        props.terrainDepth,
        props.glow,

        props.animationSpeed,
        props.morphAmount,

        props.cursorInteraction,
        props.cursorStrength,
        props.cursorRadius,

        props.clickWaves,
        props.waveStrength,
        props.waveSpeed,
        props.waveDecay,

        props.monochrome,

        props.quality,
    ])

    // ========================================================
    // WEBGL FALLBACK
    // ========================================================
    //
    // No visible text is shown.
    // If WebGL2 is unavailable, preserve the configured
    // background rather than leaving an empty transparent area.
    // ========================================================

    const fallbackBackground =
        props.colorPreset === "custom"
            ? props.backgroundColor
            : getColors(props as Config).background

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: fallbackBackground,
                touchAction: "none",
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
                    display: webglSupported ? "block" : "none",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

// ============================================================
// DEFAULT PROPS
// ============================================================

LivingTopography.defaultProps = {
    colorPreset: "aurora",

    primaryColor: "#67F7D4",

    secondaryColor: "#6D8CFF",

    backgroundColor: "#050811",

    zoom: 1,

    lineDensity: 18,

    terrainDepth: 1,

    glow: 1.2,

    animationSpeed: 0.35,

    morphAmount: 1,

    cursorInteraction: true,

    cursorStrength: 1,

    cursorRadius: 1.35,

    clickWaves: true,

    waveStrength: 1,

    waveSpeed: 0.75,

    waveDecay: 2.4,

    monochrome: false,

    quality: 0.85,
}

// ============================================================
// PROPERTY CONTROLS
// ============================================================

addPropertyControls(LivingTopography, {
    // ====================================================
    // COLORS
    // ====================================================

    colorPreset: {
        type: ControlType.Enum,

        title: "Color Preset",

        description:
            "Choose a predefined palette or select Custom to define your own terrain colors.",

        options: [
            "aurora",
            "violet",
            "cyan",
            "ember",
            "ocean",
            "mono",
            "custom",
        ],

        optionTitles: [
            "Aurora",
            "Violet",
            "Cyan",
            "Ember",
            "Ocean",
            "Monochrome",
            "Custom",
        ],

        defaultValue: "aurora",
    },

    primaryColor: {
        type: ControlType.Color,

        title: "Primary",

        description:
            "Controls the main highlight color used by the brightest contour lines.",

        defaultValue: "#67F7D4",

        hidden: (props) => props.colorPreset !== "custom",
    },

    secondaryColor: {
        type: ControlType.Color,

        title: "Secondary",

        description:
            "Controls the secondary terrain color blended through the elevation map.",

        defaultValue: "#6D8CFF",

        hidden: (props) => props.colorPreset !== "custom",
    },

    backgroundColor: {
        type: ControlType.Color,

        title: "Background",

        description:
            "Controls the base color behind the procedural contour terrain.",

        defaultValue: "#050811",

        hidden: (props) => props.colorPreset !== "custom",
    },

    monochrome: {
        type: ControlType.Boolean,

        title: "Monochrome",

        description:
            "Converts the selected palette into a monochrome luminance treatment.",

        defaultValue: false,
    },

    // ====================================================
    // TERRAIN
    // ====================================================

    zoom: {
        type: ControlType.Number,

        title: "Zoom",

        description:
            "Controls the camera scale of the procedural terrain. Higher values show a closer view.",

        min: 0.35,

        max: 3,

        step: 0.05,

        defaultValue: 1,
    },

    lineDensity: {
        type: ControlType.Number,

        title: "Line Density",

        description:
            "Controls the number of topographic elevation lines. Higher values create denser contours.",

        min: 4,

        max: 40,

        step: 1,

        defaultValue: 18,
    },

    terrainDepth: {
        type: ControlType.Number,

        title: "Terrain Depth",

        description:
            "Controls the apparent vertical depth and dimensional shading of the terrain.",

        min: 0,

        max: 2.5,

        step: 0.05,

        defaultValue: 1,
    },

    glow: {
        type: ControlType.Number,

        title: "Glow",

        description:
            "Controls the luminous intensity surrounding the contour lines.",

        min: 0,

        max: 3,

        step: 0.05,

        defaultValue: 1.2,
    },

    // ====================================================
    // ANIMATION
    // ====================================================

    animationSpeed: {
        type: ControlType.Number,

        title: "Animation Speed",

        description:
            "Controls how quickly the procedural terrain evolves over time. Set to zero for a static terrain.",

        min: 0,

        max: 1.5,

        step: 0.01,

        defaultValue: 0.35,
    },

    morphAmount: {
        type: ControlType.Number,

        title: "Morph Amount",

        description:
            "Controls the amount of continuous terrain deformation and movement.",

        min: 0,

        max: 2,

        step: 0.05,

        defaultValue: 1,
    },

    // ====================================================
    // CURSOR
    // ====================================================

    cursorInteraction: {
        type: ControlType.Boolean,

        title: "Cursor Well",

        description:
            "Creates a local gravity well around the pointer that bends and depresses the terrain.",

        defaultValue: true,
    },

    cursorStrength: {
        type: ControlType.Number,

        title: "Well Strength",

        description:
            "Controls the intensity of the cursor gravity-well deformation.",

        min: 0,

        max: 3,

        step: 0.05,

        defaultValue: 1,

        hidden: (props) => !props.cursorInteraction,
    },

    cursorRadius: {
        type: ControlType.Number,

        title: "Well Radius",

        description:
            "Controls the size of the terrain area affected by the cursor.",

        min: 0.25,

        max: 3,

        step: 0.05,

        defaultValue: 1.35,

        hidden: (props) => !props.cursorInteraction,
    },

    // ====================================================
    // CLICK WAVES
    // ====================================================

    clickWaves: {
        type: ControlType.Boolean,

        title: "Click Waves",

        description:
            "Creates an expanding wave that travels across the terrain when the user clicks.",

        defaultValue: true,
    },

    waveStrength: {
        type: ControlType.Number,

        title: "Wave Strength",

        description:
            "Controls the amount of terrain deformation produced by each click wave.",

        min: 0,

        max: 3,

        step: 0.05,

        defaultValue: 1,

        hidden: (props) => !props.clickWaves,
    },

    waveSpeed: {
        type: ControlType.Number,

        title: "Wave Speed",

        description:
            "Controls how quickly the click wave travels outward across the terrain.",

        min: 0.1,

        max: 2,

        step: 0.05,

        defaultValue: 0.75,

        hidden: (props) => !props.clickWaves,
    },

    waveDecay: {
        type: ControlType.Number,

        title: "Wave Decay",

        description:
            "Controls how quickly each click wave fades as it travels through the terrain.",

        min: 0.5,

        max: 6,

        step: 0.1,

        defaultValue: 2.4,

        hidden: (props) => !props.clickWaves,
    },

    // ====================================================
    // PERFORMANCE
    // ====================================================

    quality: {
        type: ControlType.Number,

        title: "Quality",

        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",

        min: 0.5,

        max: 1,

        step: 0.05,

        defaultValue: 0.85,
    },
})
