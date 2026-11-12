// ==========================================
// Gradient Karim Background
// Made with 💛 by Karim Saif
// ==========================================

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

type InteractionPreset = "none" | "ripple" | "cursor" | "rippleCursor"

type ColorPreset = "aurora" | "sunset" | "ocean" | "candy" | "fire" | "mono"

interface Ripple {
    x: number
    y: number
    time: number
}

interface GradientKarimBackgroundProps {
    noiseIntensity?: number
    noiseScale?: number
    noiseSpeed?: number
    waveNoiseIntensity?: number
    animationSpeed?: number

    colorPreset?: ColorPreset

    interaction?: InteractionPreset
    rippleStrength?: number
    rippleDuration?: number

    cursorInfluence?: number
    cursorRadius?: number
    cursorSmoothing?: number

    hoverScale?: number
    borderRadius?: number

    ariaLabel?: string
}

// ==========================================
// Color Presets
// ==========================================

const COLOR_PRESETS: Record<ColorPreset, string[]> = {
    aurora: [
        "#FAD4FB",
        "#FAC8E1",
        "#FAB615",
        "#FC681E",
        "#0D5DF4",
        "#0B4ABB",
        "#170E07",
    ],

    sunset: [
        "#FFE0C2",
        "#FFB36B",
        "#FF7043",
        "#E83E8C",
        "#7B2CBF",
        "#4C2AC4",
        "#241044",
    ],

    ocean: [
        "#D9F7FF",
        "#8BE8FF",
        "#21C7D9",
        "#087E8B",
        "#075985",
        "#123C69",
        "#061C2B",
    ],

    candy: [
        "#FFE5F1",
        "#FFB3D9",
        "#FF7EB6",
        "#C77DFF",
        "#7B61FF",
        "#4C3BCF",
        "#201044",
    ],

    fire: [
        "#FFF1C1",
        "#FFD166",
        "#FF9F1C",
        "#FF5A36",
        "#E63946",
        "#A91D35",
        "#3A1015",
    ],

    mono: [
        "#FFFFFF",
        "#D9D9D9",
        "#A6A6A6",
        "#737373",
        "#4A4A4A",
        "#242424",
        "#080808",
    ],
}

// ==========================================
// Hex → RGB
// ==========================================

function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace("#", "").trim()

    const value =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean

    const number = parseInt(value, 16)

    if (Number.isNaN(number)) {
        return [0, 0, 0]
    }

    return [
        ((number >> 16) & 255) / 255,
        ((number >> 8) & 255) / 255,
        (number & 255) / 255,
    ]
}

// ==========================================
// Vertex Shader
// WebGL 1 compatible
// ==========================================

const VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

// ==========================================
// Fragment Shader
// WebGL 1 compatible
// ==========================================

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;

uniform float uNoiseIntensity;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uWaveNoiseIntensity;
uniform float uAnimationSpeed;

uniform float uRippleStrength;
uniform float uRippleDuration;

uniform vec2 uRipplePositions[10];
uniform float uRippleTimes[10];
uniform int uRippleCount;

uniform vec2 uCursor;
uniform float uCursorInfluence;
uniform float uCursorRadius;

uniform vec3 uPalette[7];

// ==========================================
// Hash
// ==========================================

vec2 hash(vec2 p) {

    p = vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
    );

    return -1.0 + 2.0 *
        fract(
            sin(p) *
            43758.5453123
        );
}

// ==========================================
// 2D Noise
// ==========================================

float noise(vec2 p) {

    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u =
        f * f *
        (3.0 - 2.0 * f);

    float a =
        dot(
            hash(i),
            f
        );

    float b =
        dot(
            hash(i + vec2(1.0, 0.0)),
            f - vec2(1.0, 0.0)
        );

    float c =
        dot(
            hash(i + vec2(0.0, 1.0)),
            f - vec2(0.0, 1.0)
        );

    float d =
        dot(
            hash(i + vec2(1.0, 1.0)),
            f - vec2(1.0, 1.0)
        );

    return mix(
        mix(a, b, u.x),
        mix(c, d, u.x),
        u.y
    );
}

// ==========================================
// Simplex Noise
// ==========================================

vec3 mod289(vec3 x) {

    return x -
        floor(
            x *
            (1.0 / 289.0)
        ) *
        289.0;
}

vec4 mod289(vec4 x) {

    return x -
        floor(
            x *
            (1.0 / 289.0)
        ) *
        289.0;
}

vec4 permute(vec4 x) {

    return mod289(
        ((x * 34.0) + 1.0) * x
    );
}

vec4 taylorInvSqrt(vec4 r) {

    return 1.79284291400159 -
        0.85373472095314 * r;
}

float simplexNoise(vec3 v) {

    const vec2 C =
        vec2(
            1.0 / 6.0,
            1.0 / 3.0
        );

    const vec4 D =
        vec4(
            0.0,
            0.5,
            1.0,
            2.0
        );

    vec3 i =
        floor(
            v +
            dot(v, C.yyy)
        );

    vec3 x0 =
        v -
        i +
        dot(i, C.xxx);

    vec3 g =
        step(
            x0.yzx,
            x0.xyz
        );

    vec3 l =
        1.0 - g;

    vec3 i1 =
        min(
            g.xyz,
            l.zxy
        );

    vec3 i2 =
        max(
            g.xyz,
            l.zxy
        );

    vec3 x1 =
        x0 -
        i1 +
        C.xxx;

    vec3 x2 =
        x0 -
        i2 +
        C.yyy;

    vec3 x3 =
        x0 -
        D.yyy;

    i = mod289(i);

    vec4 p =
        permute(
            permute(
                permute(
                    i.z +
                    vec4(
                        0.0,
                        i1.z,
                        i2.z,
                        1.0
                    )
                )
                + i.y +
                vec4(
                    0.0,
                    i1.y,
                    i2.y,
                    1.0
                )
            )
            + i.x +
            vec4(
                0.0,
                i1.x,
                i2.x,
                1.0
            )
        );

    float n_ =
        0.142857142857;

    vec3 ns =
        n_ *
        D.wyz -
        D.xzx;

    vec4 j =
        p -
        49.0 *
        floor(
            p *
            ns.z *
            ns.z
        );

    vec4 x_ =
        floor(
            j *
            ns.z
        );

    vec4 y_ =
        floor(
            j -
            7.0 *
            x_
        );

    vec4 x =
        x_ *
        ns.x +
        ns.yyyy;

    vec4 y =
        y_ *
        ns.x +
        ns.yyyy;

    vec4 h =
        1.0 -
        abs(x) -
        abs(y);

    vec4 b0 =
        vec4(
            x.xy,
            y.xy
        );

    vec4 b1 =
        vec4(
            x.zw,
            y.zw
        );

    vec4 s0 =
        floor(b0) *
        2.0 +
        1.0;

    vec4 s1 =
        floor(b1) *
        2.0 +
        1.0;

    vec4 sh =
        -step(
            h,
            vec4(0.0)
        );

    vec4 a0 =
        b0.xzyw +
        s0.xzyw *
        sh.xxyy;

    vec4 a1 =
        b1.xzyw +
        s1.xzyw *
        sh.zzww;

    vec3 p0 =
        vec3(
            a0.xy,
            h.x
        );

    vec3 p1 =
        vec3(
            a0.zw,
            h.y
        );

    vec3 p2 =
        vec3(
            a1.xy,
            h.z
        );

    vec3 p3 =
        vec3(
            a1.zw,
            h.w
        );

    vec4 norm =
        taylorInvSqrt(
            vec4(
                dot(p0, p0),
                dot(p1, p1),
                dot(p2, p2),
                dot(p3, p3)
            )
        );

    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m =
        max(
            0.6 -
            vec4(
                dot(x0, x0),
                dot(x1, x1),
                dot(x2, x2),
                dot(x3, x3)
            ),
            0.0
        );

    m *= m;

    return 42.0 *
        dot(
            m * m,
            vec4(
                dot(p0, x0),
                dot(p1, x1),
                dot(p2, x2),
                dot(p3, x3)
            )
        );
}

// ==========================================
// Organic Warp
// ==========================================

vec2 warp(
    vec2 p,
    float time
) {

    float n1 =
        noise(
            p * 0.5 +
            vec2(
                time * 0.24,
                0.0
            )
        );

    float n2 =
        noise(
            p * 0.5 +
            vec2(
                0.0,
                time * 0.20
            )
        );

    float n3 =
        noise(
            p * 0.8 +
            vec2(
                -time * 0.30,
                time * 0.30
            )
        ) * 0.5;

    float n4 =
        noise(
            p * 1.2 +
            vec2(
                time * 0.30,
                -time * 0.30
            )
        ) * 0.3;

    return p +
        vec2(
            n1 + n3,
            n2 + n4
        ) *
        uWaveNoiseIntensity;
}

// ==========================================
// Cursor Influence
// ==========================================

vec2 applyCursor(
    vec2 uv
) {

    float radius =
        max(
            uCursorRadius,
            0.001
        );

    float distanceToCursor =
        distance(
            uv,
            uCursor
        );

    float influence =
        1.0 -
        smoothstep(
            0.0,
            radius,
            distanceToCursor
        );

    influence *=
        uCursorInfluence;

    vec2 direction =
        uv -
        uCursor;

    float directionLength =
        max(
            length(direction),
            0.0001
        );

    direction /=
        directionLength;

    return uv +
        direction *
        influence *
        0.20;
}

// ==========================================
// Ripple
// ==========================================

float rippleEffect(
    vec2 uv
) {

    float result = 0.0;

    for (
        int i = 0;
        i < 10;
        i++
    ) {

        if (
            i >= uRippleCount
        ) {
            break;
        }

        float elapsed =
            uRippleTimes[i];

        if (
            elapsed < 0.0 ||
            elapsed > uRippleDuration
        ) {
            continue;
        }

        vec2 position =
            uRipplePositions[i];

        float distanceToRipple =
            distance(
                uv,
                position
            );

        float radius =
            elapsed *
            1.15;

        float width =
            0.045;

        float ring =
            smoothstep(
                radius + width,
                radius,
                distanceToRipple
            ) *
            smoothstep(
                radius - width,
                radius,
                distanceToRipple
            );

        float fade =
            1.0 -
            smoothstep(
                0.0,
                uRippleDuration,
                elapsed
            );

        float wave =
            sin(
                distanceToRipple * 18.0 -
                elapsed * 9.0
            ) *
            0.5 +
            0.5;

        result +=
            ring *
            fade *
            wave *
            uRippleStrength;
    }

    return result;
}

// ==========================================
// Palette Gradient
// ==========================================

vec3 gradientColor(
    float t
) {

    t =
        clamp(
            t,
            0.0,
            1.0
        );

    float scaled =
        t * 6.0;

    int index =
        int(
            floor(scaled)
        );

    float localT =
        fract(scaled);

    if (index >= 6) {
        return uPalette[6];
    }

    float smoothT =
        smoothstep(
            0.0,
            1.0,
            localT
        );

    if (index == 0) {
        return mix(
            uPalette[0],
            uPalette[1],
            smoothT
        );
    }

    if (index == 1) {
        return mix(
            uPalette[1],
            uPalette[2],
            smoothT
        );
    }

    if (index == 2) {
        return mix(
            uPalette[2],
            uPalette[3],
            smoothT
        );
    }

    if (index == 3) {
        return mix(
            uPalette[3],
            uPalette[4],
            smoothT
        );
    }

    if (index == 4) {
        return mix(
            uPalette[4],
            uPalette[5],
            smoothT
        );
    }

    return mix(
        uPalette[5],
        uPalette[6],
        smoothT
    );
}

// ==========================================
// Grain
// ==========================================

float grainNoise(
    vec2 uv,
    float time
) {

    float seed =
        dot(
            uv,
            vec2(
                12.9898,
                78.233
            )
        );

    return fract(
        sin(seed) *
        43758.5453 +
        time * 2.0
    );
}

// ==========================================
// Main
// ==========================================

void main() {

    vec2 uv =
        (
            gl_FragCoord.xy -
            0.5 *
            uResolution
        ) /
        uResolution.y;

    float time =
        uTime *
        uAnimationSpeed;

    uv =
        applyCursor(
            uv
        );

    vec2 warped =
        warp(
            uv,
            time
        );

    float n =
        simplexNoise(
            vec3(
                warped *
                uNoiseScale,

                time *
                uNoiseSpeed
            )
        );

    warped +=
        n *
        uNoiseIntensity;

    float phase1 =
        time *
        0.6;

    float phase2 =
        time *
        0.4;

    float centerDistance =
        length(warped);

    float arch =
        1.0 -
        centerDistance *
        0.5;

    float wave1 =
        sin(
            warped.x *
            3.0 +
            phase1
        ) *
        0.5 *
        arch;

    float wave2 =
        sin(
            warped.x *
            5.0 -
            phase2
        ) *
        0.3 *
        arch;

    float wave3 =
        sin(
            warped.y *
            4.0 +
            phase1 *
            0.7
        ) *
        0.15;

    float parabola =
        -pow(
            warped.x,
            2.0
        ) *
        0.2;

    float breathing =
        sin(
            time *
            0.5
        ) *
        0.1 +
        0.9;

    float combined =
        (
            wave1 +
            wave2 +
            wave3 +
            parabola
        ) *
        breathing *
        0.3;

    float ripple =
        rippleEffect(
            uv
        );

    float gradientPosition =
        gl_FragCoord.y /
        uResolution.y;

    gradientPosition +=
        combined *
        0.3;

    gradientPosition +=
        ripple *
        0.2;

    float gradient =
        1.0 -
        gradientPosition;

    gradient =
        smoothstep(
            0.0,
            1.0,
            clamp(
                gradient,
                0.0,
                1.0
            )
        );

    vec3 color =
        gradientColor(
            gradient
        );

    color +=
        vec3(
            ripple *
            0.3
        );

    float grain =
        grainNoise(
            gl_FragCoord.xy /
            uResolution,
            time
        );

    color +=
        (
            grain -
            0.5
        ) *
        0.035;

    gl_FragColor =
        vec4(
            clamp(
                color,
                0.0,
                1.0
            ),
            1.0
        );
}
`

// ==========================================
// Shader Compilation
// ==========================================

function compileShader(
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

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Gradient Karim Background:", gl.getShaderInfoLog(shader))

        gl.deleteShader(shader)

        return null
    }

    return shader
}

// ==========================================
// Program Creation
// ==========================================

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)

    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

    if (!vertex || !fragment) {
        if (vertex) {
            gl.deleteShader(vertex)
        }

        if (fragment) {
            gl.deleteShader(fragment)
        }

        return null
    }

    const program = gl.createProgram()

    if (!program) {
        gl.deleteShader(vertex)
        gl.deleteShader(fragment)

        return null
    }

    gl.attachShader(program, vertex)

    gl.attachShader(program, fragment)

    gl.linkProgram(program)

    gl.deleteShader(vertex)
    gl.deleteShader(fragment)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(
            "Gradient Karim Background:",
            gl.getProgramInfoLog(program)
        )

        gl.deleteProgram(program)

        return null
    }

    return program
}

// ==========================================
// Component
// ==========================================

export default function GradientKarimBackground(
    props: GradientKarimBackgroundProps
) {
    const {
        noiseIntensity = 1.55,
        noiseScale = 2.0,
        noiseSpeed = 0.15,
        waveNoiseIntensity = 1.2,
        animationSpeed = 1.0,

        colorPreset = "aurora",

        interaction = "rippleCursor",

        rippleStrength = 0.3,
        rippleDuration = 2.0,

        cursorInfluence = 0.45,
        cursorRadius = 1.25,
        cursorSmoothing = 0.12,

        hoverScale = 1.02,
        borderRadius = 48,

        ariaLabel = "Animated gradient background by Karim Saif",
    } = props

    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const containerRef = React.useRef<HTMLDivElement>(null)

    const staticRenderer = useIsStaticRenderer()

    const glRef = React.useRef<WebGLRenderingContext | null>(null)

    const programRef = React.useRef<WebGLProgram | null>(null)

    const bufferRef = React.useRef<WebGLBuffer | null>(null)

    const frameRef = React.useRef<number | null>(null)

    const startTimeRef = React.useRef<number | null>(null)

    const visibleRef = React.useRef(false)

    const reducedMotionRef = React.useRef(false)

    const cursorRef = React.useRef({
        x: 0,
        y: 0,
    })

    const targetCursorRef = React.useRef({
        x: 0,
        y: 0,
    })

    const ripplesRef = React.useRef<Ripple[]>([])

    const resolutionRef = React.useRef({
        width: 1,
        height: 1,
    })

    const locationsRef = React.useRef<any>(null)

    // ==========================================
    // Initialize WebGL
    // ==========================================

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
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
        })

        if (!gl) {
            console.error("Gradient Karim Background: WebGL unavailable.")

            return false
        }

        // Existing valid resources.
        if (glRef.current === gl && programRef.current && bufferRef.current) {
            return true
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
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )

        gl.useProgram(program)

        const position = gl.getAttribLocation(program, "aPosition")

        locationsRef.current = {
            position,

            resolution: gl.getUniformLocation(program, "uResolution"),

            time: gl.getUniformLocation(program, "uTime"),

            noiseIntensity: gl.getUniformLocation(program, "uNoiseIntensity"),

            noiseScale: gl.getUniformLocation(program, "uNoiseScale"),

            noiseSpeed: gl.getUniformLocation(program, "uNoiseSpeed"),

            waveNoiseIntensity: gl.getUniformLocation(
                program,
                "uWaveNoiseIntensity"
            ),

            animationSpeed: gl.getUniformLocation(program, "uAnimationSpeed"),

            rippleStrength: gl.getUniformLocation(program, "uRippleStrength"),

            rippleDuration: gl.getUniformLocation(program, "uRippleDuration"),

            ripplePositions: gl.getUniformLocation(
                program,
                "uRipplePositions[0]"
            ),

            rippleTimes: gl.getUniformLocation(program, "uRippleTimes[0]"),

            rippleCount: gl.getUniformLocation(program, "uRippleCount"),

            cursor: gl.getUniformLocation(program, "uCursor"),

            cursorInfluence: gl.getUniformLocation(program, "uCursorInfluence"),

            cursorRadius: gl.getUniformLocation(program, "uCursorRadius"),

            palette: gl.getUniformLocation(program, "uPalette[0]"),
        }

        glRef.current = gl

        programRef.current = program

        bufferRef.current = buffer

        return true
    }, [])

    // ==========================================
    // Resize
    // ==========================================

    const resize = React.useCallback(() => {
        const canvas = canvasRef.current

        const container = containerRef.current

        const gl = glRef.current

        if (!canvas || !container || !gl) {
            return
        }

        const rect = container.getBoundingClientRect()

        const width = Math.max(1, rect.width)

        const height = Math.max(1, rect.height)

        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        const pixelWidth = Math.max(1, Math.round(width * dpr))

        const pixelHeight = Math.max(1, Math.round(height * dpr))

        if (canvas.width !== pixelWidth) {
            canvas.width = pixelWidth
        }

        if (canvas.height !== pixelHeight) {
            canvas.height = pixelHeight
        }

        resolutionRef.current = {
            width: pixelWidth,
            height: pixelHeight,
        }

        gl.viewport(0, 0, pixelWidth, pixelHeight)
    }, [])

    // ==========================================
    // Render
    // ==========================================

    const render = React.useCallback(
        (elapsed: number) => {
            const gl = glRef.current

            const program = programRef.current

            const buffer = bufferRef.current

            const locations = locationsRef.current

            if (!gl || !program || !buffer || !locations) {
                return
            }

            gl.useProgram(program)

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

            gl.enableVertexAttribArray(locations.position)

            gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0)

            const resolution = resolutionRef.current

            gl.uniform2f(
                locations.resolution,
                resolution.width,
                resolution.height
            )

            gl.uniform1f(locations.time, elapsed)

            gl.uniform1f(locations.noiseIntensity, noiseIntensity)

            gl.uniform1f(locations.noiseScale, noiseScale)

            gl.uniform1f(locations.noiseSpeed, noiseSpeed)

            gl.uniform1f(locations.waveNoiseIntensity, waveNoiseIntensity)

            gl.uniform1f(locations.animationSpeed, animationSpeed)

            // ======================================
            // Palette
            // ======================================

            const palette = COLOR_PRESETS[colorPreset] || COLOR_PRESETS.aurora

            const paletteRgb = palette.flatMap(hexToRgb)

            gl.uniform3fv(locations.palette, new Float32Array(paletteRgb))

            // ======================================
            // Cursor
            // ======================================

            const cursor = cursorRef.current

            gl.uniform2f(locations.cursor, cursor.x, cursor.y)

            const cursorEnabled =
                interaction === "cursor" || interaction === "rippleCursor"

            gl.uniform1f(
                locations.cursorInfluence,
                cursorEnabled ? cursorInfluence : 0
            )

            gl.uniform1f(locations.cursorRadius, cursorRadius)

            // ======================================
            // Ripple
            // ======================================

            const rippleEnabled =
                interaction === "ripple" || interaction === "rippleCursor"

            // FIX:
            // These were declared in the shader but
            // were not previously sent from React.

            gl.uniform1f(locations.rippleStrength, rippleStrength)

            gl.uniform1f(locations.rippleDuration, rippleDuration)

            const activeRipples = rippleEnabled
                ? ripplesRef.current.filter(
                      (ripple) => elapsed - ripple.time < rippleDuration
                  )
                : []

            ripplesRef.current = activeRipples

            const positions = new Float32Array(20)

            const times = new Float32Array(10)

            const count = Math.min(activeRipples.length, 10)

            for (let i = 0; i < count; i++) {
                const ripple = activeRipples[i]

                positions[i * 2] = ripple.x

                positions[i * 2 + 1] = ripple.y

                times[i] = elapsed - ripple.time
            }

            gl.uniform2fv(locations.ripplePositions, positions)

            gl.uniform1fv(locations.rippleTimes, times)

            gl.uniform1i(locations.rippleCount, count)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        },
        [
            noiseIntensity,
            noiseScale,
            noiseSpeed,
            waveNoiseIntensity,
            animationSpeed,
            rippleStrength,
            rippleDuration,
            interaction,
            cursorInfluence,
            cursorRadius,
            colorPreset,
        ]
    )

    // ==========================================
    // Stop Animation
    // ==========================================

    const stopAnimation = React.useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current)

            frameRef.current = null
        }
    }, [])

    // ==========================================
    // Start Animation
    // ==========================================

    const startAnimation = React.useCallback(() => {
        if (staticRenderer || reducedMotionRef.current || !visibleRef.current) {
            return
        }

        if (frameRef.current !== null) {
            return
        }

        startTimeRef.current = performance.now()

        const loop = (now: number) => {
            frameRef.current = null

            if (!visibleRef.current || reducedMotionRef.current) {
                return
            }

            const start = startTimeRef.current ?? now

            const elapsed = (now - start) / 1000

            const current = cursorRef.current

            const target = targetCursorRef.current

            const smoothing = Math.min(Math.max(cursorSmoothing, 0.001), 1)

            current.x += (target.x - current.x) * smoothing

            current.y += (target.y - current.y) * smoothing

            render(elapsed)

            frameRef.current = requestAnimationFrame(loop)
        }

        frameRef.current = requestAnimationFrame(loop)
    }, [staticRenderer, cursorSmoothing, render])

    // ==========================================
    // WebGL Lifecycle
    // ==========================================

    React.useEffect(() => {
        if (!initializeWebGL()) {
            return
        }

        resize()

        // Static renderer:
        // render exactly one frame and do not
        // create observers or animation loops.

        if (staticRenderer) {
            render(0)

            return
        }

        const resizeObserver = new ResizeObserver(() => {
            resize()

            if (reducedMotionRef.current) {
                render(0)
            }
        })

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        const canvas = canvasRef.current

        const contextLost = (event: Event) => {
            event.preventDefault()

            stopAnimation()

            // Old WebGL resources are no longer
            // valid after context loss.

            glRef.current = null

            programRef.current = null

            bufferRef.current = null

            locationsRef.current = null
        }

        const contextRestored = () => {
            // Rebuild the WebGL resources
            // against the restored context.

            if (initializeWebGL()) {
                resize()

                render(0)

                if (visibleRef.current && !reducedMotionRef.current) {
                    startAnimation()
                }
            }
        }

        canvas?.addEventListener("webglcontextlost", contextLost)

        canvas?.addEventListener("webglcontextrestored", contextRestored)

        return () => {
            resizeObserver.disconnect()

            canvas?.removeEventListener("webglcontextlost", contextLost)

            canvas?.removeEventListener("webglcontextrestored", contextRestored)

            stopAnimation()

            const gl = glRef.current

            if (gl && programRef.current) {
                gl.deleteProgram(programRef.current)
            }

            if (gl && bufferRef.current) {
                gl.deleteBuffer(bufferRef.current)
            }

            glRef.current = null

            programRef.current = null

            bufferRef.current = null

            locationsRef.current = null
        }
    }, [
        initializeWebGL,
        resize,
        render,
        staticRenderer,
        stopAnimation,
        startAnimation,
    ])

    // ==========================================
    // Reduced Motion + Animation
    // ==========================================

    React.useEffect(() => {
        if (staticRenderer) {
            return
        }

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

        const updateReducedMotion = () => {
            reducedMotionRef.current = mediaQuery.matches

            if (mediaQuery.matches) {
                stopAnimation()

                render(0)
            } else if (visibleRef.current) {
                startAnimation()
            }
        }

        updateReducedMotion()

        mediaQuery.addEventListener("change", updateReducedMotion)

        return () => {
            mediaQuery.removeEventListener("change", updateReducedMotion)

            stopAnimation()
        }
    }, [staticRenderer, render, startAnimation, stopAnimation])

    // ==========================================
    // Visibility
    // ==========================================

    React.useEffect(() => {
        if (staticRenderer) {
            return
        }

        const element = containerRef.current

        if (!element) {
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const isVisible = entries[0]?.isIntersecting ?? false

                visibleRef.current = isVisible

                if (isVisible) {
                    if (reducedMotionRef.current) {
                        render(0)
                    } else {
                        startAnimation()
                    }
                } else {
                    // IMPORTANT:
                    // Completely stop RAF while
                    // outside the viewport.

                    stopAnimation()
                }
            },
            {
                threshold: 0,
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()

            stopAnimation()
        }
    }, [staticRenderer, render, startAnimation, stopAnimation])

    // ==========================================
    // Pointer Move
    // ==========================================

    const handlePointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const element = containerRef.current

            if (!element) {
                return
            }

            const rect = element.getBoundingClientRect()

            if (rect.width <= 0 || rect.height <= 0) {
                return
            }

            const normalizedX = (event.clientX - rect.left) / rect.width

            const normalizedY = (event.clientY - rect.top) / rect.height

            // Match the shader's centered
            // coordinate system.

            const aspect = rect.width / rect.height

            targetCursorRef.current = {
                x: (normalizedX - 0.5) * aspect,

                y: 0.5 - normalizedY,
            }
        },
        []
    )

    // ==========================================
    // Pointer Leave
    // ==========================================

    const handlePointerLeave = React.useCallback(() => {
        targetCursorRef.current = {
            x: 0,
            y: 0,
        }
    }, [])

    // ==========================================
    // Ripple
    // ==========================================

    const handlePointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (interaction !== "ripple" && interaction !== "rippleCursor") {
                return
            }

            const element = containerRef.current

            if (!element) {
                return
            }

            const rect = element.getBoundingClientRect()

            if (rect.width <= 0 || rect.height <= 0) {
                return
            }

            const start = startTimeRef.current

            if (start === null) {
                return
            }

            const elapsed = (performance.now() - start) / 1000

            const normalizedX = (event.clientX - rect.left) / rect.width

            const normalizedY = (event.clientY - rect.top) / rect.height

            const aspect = rect.width / rect.height

            const x = (normalizedX - 0.5) * aspect

            const y = 0.5 - normalizedY

            ripplesRef.current = [
                ...ripplesRef.current,
                {
                    x,
                    y,
                    time: elapsed,
                },
            ].slice(-10)

            // Make sure animation is active
            // immediately after interaction.

            if (
                !staticRenderer &&
                !reducedMotionRef.current &&
                visibleRef.current
            ) {
                startAnimation()
            }
        },
        [interaction, staticRenderer, startAnimation]
    )

    // ==========================================
    // Render
    // ==========================================

    const isInteractive = interaction !== "none"

    const safeHoverScale = Math.max(1, Math.min(hoverScale, 1.1))

    return (
        <div
            ref={containerRef}
            data-gradient-karim-background
            role="img"
            aria-label={ariaLabel}
            style={{
                position: "relative",

                width: "100%",
                height: "100%",

                minWidth: 1,
                minHeight: 1,

                overflow: "hidden",

                borderRadius: `${Math.max(0, borderRadius)}px`,

                background: "transparent",

                transform: "translateZ(0)",

                contain: "layout paint size",

                isolation: "isolate",

                userSelect: "none",

                WebkitUserSelect: "none",

                WebkitTapHighlightColor: "transparent",

                // Per-instance CSS variable.
                // Prevents multiple Framer instances
                // from interfering with each other.

                ["--gradient-hover-scale" as any]: safeHoverScale,
            }}
            onPointerMove={isInteractive ? handlePointerMove : undefined}
            onPointerLeave={isInteractive ? handlePointerLeave : undefined}
            onPointerDown={isInteractive ? handlePointerDown : undefined}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",

                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,

                    width: "100%",
                    height: "100%",

                    display: "block",

                    pointerEvents: "none",

                    margin: 0,
                    padding: 0,
                    border: 0,
                }}
            />

            <style>
                {`
                    [data-gradient-karim-background] {
                        transition:
                            transform 180ms
                            cubic-bezier(
                                0.22,
                                1,
                                0.36,
                                1
                            );
                    }

                    [data-gradient-karim-background]:hover {
                        transform:
                            translateZ(0)
                            scale(
                                var(
                                    --gradient-hover-scale
                                )
                            );
                    }

                    @media (
                        prefers-reduced-motion: reduce
                    ) {
                        [data-gradient-karim-background] {
                            transition: none;
                        }
                    }
                `}
            </style>
        </div>
    )
}

// ==========================================
// Default Props
// ==========================================

GradientKarimBackground.defaultProps = {
    noiseIntensity: 1.55,

    noiseScale: 2.0,

    noiseSpeed: 0.15,

    waveNoiseIntensity: 1.2,

    animationSpeed: 1.0,

    colorPreset: "aurora",

    interaction: "rippleCursor",

    rippleStrength: 0.3,

    rippleDuration: 2.0,

    cursorInfluence: 0.45,

    cursorRadius: 1.25,

    cursorSmoothing: 0.12,

    hoverScale: 1.02,

    borderRadius: 48,

    ariaLabel: "Animated gradient background by Karim Saif",
}

// ==========================================
// Property Controls
// ==========================================

addPropertyControls(GradientKarimBackground, {
    // ======================================
    // COLOR
    // ======================================

    colorPreset: {
        type: ControlType.Enum,

        title: "Color Preset",

        options: ["aurora", "sunset", "ocean", "candy", "fire", "mono"],

        optionTitles: ["Aurora", "Sunset", "Ocean", "Candy", "Fire", "Mono"],

        defaultValue: "aurora",

        description:
            "Choose a curated color palette for the animated gradient.",
    },

    // ======================================
    // INTERACTION
    // ======================================

    interaction: {
        type: ControlType.Enum,

        title: "Interaction",

        options: ["none", "ripple", "cursor", "rippleCursor"],

        optionTitles: ["None", "Ripple", "Cursor Follow", "Ripple + Cursor"],

        defaultValue: "rippleCursor",

        description: "Choose how the gradient responds to pointer interaction.",
    },

    rippleStrength: {
        type: ControlType.Number,

        title: "Ripple Strength",

        defaultValue: 0.3,

        min: 0,

        max: 2,

        step: 0.05,

        displayStepper: true,

        hidden: (props) =>
            props.interaction !== "ripple" &&
            props.interaction !== "rippleCursor",

        description: "Controls the visual intensity of click ripples.",
    },

    rippleDuration: {
        type: ControlType.Number,

        title: "Ripple Duration",

        defaultValue: 2,

        min: 0.25,

        max: 5,

        step: 0.25,

        unit: "s",

        displayStepper: true,

        hidden: (props) =>
            props.interaction !== "ripple" &&
            props.interaction !== "rippleCursor",

        description: "Controls how long each ripple remains visible.",
    },

    cursorInfluence: {
        type: ControlType.Number,

        title: "Cursor Influence",

        defaultValue: 0.45,

        min: 0,

        max: 2,

        step: 0.05,

        displayStepper: true,

        hidden: (props) =>
            props.interaction !== "cursor" &&
            props.interaction !== "rippleCursor",

        description:
            "Controls how strongly the gradient bends toward the cursor.",
    },

    cursorRadius: {
        type: ControlType.Number,

        title: "Cursor Radius",

        defaultValue: 1.25,

        min: 0.1,

        max: 3,

        step: 0.05,

        displayStepper: true,

        hidden: (props) =>
            props.interaction !== "cursor" &&
            props.interaction !== "rippleCursor",

        description: "Controls the area of influence around the cursor.",
    },

    cursorSmoothing: {
        type: ControlType.Number,

        title: "Cursor Smooth",

        defaultValue: 0.12,

        min: 0.02,

        max: 0.5,

        step: 0.01,

        displayStepper: true,

        hidden: (props) =>
            props.interaction !== "cursor" &&
            props.interaction !== "rippleCursor",

        description: "Controls how smoothly the gradient follows the cursor.",
    },

    // ======================================
    // APPEARANCE
    // ======================================

    borderRadius: {
        type: ControlType.Number,

        title: "Radius",

        defaultValue: 48,

        min: 0,

        max: 300,

        step: 1,

        unit: "px",

        displayStepper: true,

        description: "Controls the corner radius of the shader container.",
    },

    hoverScale: {
        type: ControlType.Number,

        title: "Hover Scale",

        defaultValue: 1.02,

        min: 1,

        max: 1.1,

        step: 0.005,

        displayStepper: true,

        description:
            "Controls the subtle scale effect when hovering the component.",
    },

    // ======================================
    // SHADER
    // ======================================

    noiseIntensity: {
        type: ControlType.Number,

        title: "Noise",

        defaultValue: 1.55,

        min: 0,

        max: 5,

        step: 0.05,

        displayStepper: true,

        description: "Controls the amount of organic noise distortion.",
    },

    noiseScale: {
        type: ControlType.Number,

        title: "Noise Scale",

        defaultValue: 2,

        min: 0.1,

        max: 10,

        step: 0.1,

        displayStepper: true,

        description: "Controls the scale and detail of the noise pattern.",
    },

    noiseSpeed: {
        type: ControlType.Number,

        title: "Noise Speed",

        defaultValue: 0.15,

        min: 0,

        max: 2,

        step: 0.01,

        displayStepper: true,

        description: "Controls the movement speed of the noise.",
    },

    waveNoiseIntensity: {
        type: ControlType.Number,

        title: "Wave Warp",

        defaultValue: 1.2,

        min: 0,

        max: 5,

        step: 0.1,

        displayStepper: true,

        description: "Controls the amount of organic wave deformation.",
    },

    animationSpeed: {
        type: ControlType.Number,

        title: "Animation",

        defaultValue: 1,

        min: 0,

        max: 3,

        step: 0.05,

        displayStepper: true,

        description: "Controls the overall animation speed.",
    },

    // ======================================
    // ACCESSIBILITY
    // ======================================

    ariaLabel: {
        type: ControlType.String,

        title: "ARIA Label",

        defaultValue: "Animated gradient background by Karim Saif",

        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
