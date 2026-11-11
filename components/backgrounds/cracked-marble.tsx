import * as React from "react"
import { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`

const fragmentShaderSource = `
    precision mediump float;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_baseColor;
    uniform vec3 u_veinColor;
    uniform float u_scale;
    uniform float u_crackWidth;
    uniform float u_crackSharpness;

    float random(in vec2 _st) {
        return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(in vec2 _st) {
        vec2 i = floor(_st);
        vec2 f = fract(_st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(in vec2 _st) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
        for (int i = 0; i < 6; ++i) {
            v += a * noise(_st);
            _st = rot * _st * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y; // Fix Aspect Ratio
        st *= u_scale; 


        vec2 q = vec2(0.);
        q.x = fbm(st + 0.05 * u_time);
        q.y = fbm(st + vec2(1.0));

        vec2 r = vec2(0.);
        r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.06 * u_time);
        r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.06 * u_time);

        float f = fbm(st + r);

        
        float crackVal = abs(f * 2.0 - 1.0);
        crackVal = 1.0 - crackVal;
        crackVal = pow(crackVal, u_crackSharpness);

        float mixFactor = smoothstep(1.0 - u_crackWidth, 1.0, crackVal);
        
        // Coloring
        vec3 color = mix(u_baseColor, u_veinColor, mixFactor);

        gl_FragColor = vec4(color, 1.0);
    }
`

const hexToRgb = (input: string) => {
    if (!input) return [1, 1, 1]

    const color = input.trim().toLowerCase()

    let match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
    if (match) {
        return [
            parseInt(match[1], 16) / 255,
            parseInt(match[2], 16) / 255,
            parseInt(match[3], 16) / 255,
        ]
    }

    match = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(color)
    if (match) {
        const r = parseInt(match[1] + match[1], 16)
        const g = parseInt(match[2] + match[2], 16)
        const b = parseInt(match[3] + match[3], 16)
        return [r / 255, g / 255, b / 255]
    }

    match = /^rgba?\(([^)]+)\)$/.exec(color)
    if (match) {
        const parts = match[1].split(",").map((p) => p.trim())
        if (parts.length >= 3) {
            const parseChannel = (v: string) => {
                if (v.endsWith("%")) {
                    const n = parseFloat(v) || 0
                    return Math.max(0, Math.min(255, (n / 100) * 255))
                }
                return Math.max(0, Math.min(255, parseFloat(v) || 0))
            }
            const r = parseChannel(parts[0])
            const g = parseChannel(parts[1])
            const b = parseChannel(parts[2])
            return [r / 255, g / 255, b / 255]
        }
    }

    match = /^hsla?\(([^)]+)\)$/.exec(color)
    if (match) {
        const parts = match[1].split(",").map((p) => p.trim())
        if (parts.length >= 3) {
            const h = ((parseFloat(parts[0]) || 0) % 360) / 360
            const s = (parseFloat(parts[1]) || 0) / 100
            const l = (parseFloat(parts[2]) || 0) / 100

            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1
                if (t > 1) t -= 1
                if (t < 1 / 6) return p + (q - p) * 6 * t
                if (t < 1 / 2) return q
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
                return p
            }

            let r: number, g: number, b: number

            if (s === 0) {
                r = g = b = l
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s
                const p = 2 * l - q
                r = hue2rgb(p, q, h + 1 / 3)
                g = hue2rgb(p, q, h)
                b = hue2rgb(p, q, h - 1 / 3)
            }

            return [r, g, b]
        }
    }

    return [1, 1, 1]
}

/**
 * CrackedMarble
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CrackedMarble(props: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl")
        if (!gl) return

        const createShader = (
            gl: WebGLRenderingContext,
            type: number,
            source: string
        ) => {
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

        const vertexShader = createShader(
            gl,
            gl.VERTEX_SHADER,
            vertexShaderSource
        )
        const fragmentShader = createShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        )

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
        gl.useProgram(program)

        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

        const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW
        )

        const positionLocation = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

        const uTimeLoc = gl.getUniformLocation(program, "u_time")
        const uResLoc = gl.getUniformLocation(program, "u_resolution")
        const uBaseColorLoc = gl.getUniformLocation(program, "u_baseColor")
        const uVeinColorLoc = gl.getUniformLocation(program, "u_veinColor")
        const uScaleLoc = gl.getUniformLocation(program, "u_scale")
        const uCrackWidthLoc = gl.getUniformLocation(program, "u_crackWidth")
        const uCrackSharpnessLoc = gl.getUniformLocation(
            program,
            "u_crackSharpness"
        )

        if (
            !uTimeLoc ||
            !uResLoc ||
            !uBaseColorLoc ||
            !uVeinColorLoc ||
            !uScaleLoc ||
            !uCrackWidthLoc ||
            !uCrackSharpnessLoc
        ) {
            console.error("Failed to get one or more uniform locations.")
            return
        }

        let startTime = performance.now()
        let animationFrameId: number

        const render = () => {
            if (!gl || !canvas) return

            const displayWidth = canvas.clientWidth || 500
            const displayHeight = canvas.clientHeight || 500

            if (
                canvas.width !== displayWidth ||
                canvas.height !== displayHeight
            ) {
                canvas.width = displayWidth
                canvas.height = displayHeight
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
            }

            gl.clearColor(0.0, 0.0, 0.0, 1.0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            const currentTime = (performance.now() - startTime) / 1000
            gl.uniform1f(uTimeLoc, currentTime * props.speed)
            gl.uniform2f(uResLoc, canvas.width, canvas.height)

            const baseRGB = hexToRgb(props.baseColor)
            const veinRGB = hexToRgb(props.veinColor)
            gl.uniform3f(uBaseColorLoc, baseRGB[0], baseRGB[1], baseRGB[2])
            gl.uniform3f(uVeinColorLoc, veinRGB[0], veinRGB[1], veinRGB[2])

            gl.uniform1f(uScaleLoc, props.scale)
            gl.uniform1f(uCrackWidthLoc, props.crackWidth)
            gl.uniform1f(uCrackSharpnessLoc, props.crackSharpness)

            gl.drawArrays(gl.TRIANGLES, 0, 6)

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        return () => {
            cancelAnimationFrame(animationFrameId)
            gl.deleteProgram(program)
        }
    }, [
        props.baseColor,
        props.veinColor,
        props.scale,
        props.speed,
        props.crackWidth,
        props.crackSharpness,
    ])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
            }}
        />
    )
}

addPropertyControls(CrackedMarble, {
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#111111",
        description: "Base marble surface color",
    },
    veinColor: {
        type: ControlType.Color,
        title: "Crack Color",
        defaultValue: "#FFD700",
        description: "Color of the cracks/veins",
    },
    scale: {
        type: ControlType.Number,
        title: "Zoom Scale",
        defaultValue: 3.0,
        min: 0.5,
        max: 10,
        step: 0.1,
        description: "Overall zoom level of the pattern",
    },
    speed: {
        type: ControlType.Number,
        title: "Move Speed",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
        description: "Animation speed of the marble movement",
    },
    crackWidth: {
        type: ControlType.Number,
        title: "Crack Density",
        defaultValue: 0.4,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        description: "How wide and frequent the cracks appear",
    },
    crackSharpness: {
        type: ControlType.Number,
        title: "Sharpness",
        defaultValue: 4.0,
        min: 1.0,
        max: 10.0,
        step: 0.1,
        description: "Edge hardness of the cracks",
    },
})
