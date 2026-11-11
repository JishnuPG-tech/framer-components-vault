import * as React from "react"
import { useEffect, useRef } from "react"
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
 * Aether Shader Background
 *
 * A full-bleed animated WebGL shader background. No text/content —
 * just the living gradient, meant to sit behind other layers in
 * Framer (stack it under a text stack with the layer set to fill).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`

// Fragment shader — speed, tint, scale, and glow exposed as uniforms
const FRAG_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform float uSpeed;
uniform float uScale;
uniform float uGlow;
uniform vec3 uTint;
#define FC gl_FragCoord.xy
#define R resolution
#define T (time * uSpeed)
#define MN min(R.x,R.y)

float pattern(vec2 uv) {
  float d = .0;
  for (float i = .0; i < 3.; i++) {
    uv.x += sin(T * (1. + i) + uv.y * 1.5) * .2;
    d += .005 / abs(uv.x);
  }
  return d;
}

vec3 scene(vec2 uv) {
  vec3 col = vec3(0);
  uv = vec2(atan(uv.x, uv.y) * 2. / 6.28318, -log(length(uv)) + T);
  for (float i = .0; i < 3.; i++) {
    int k = int(mod(i, 3.));
    col[k] += pattern(uv + i * uScale / MN);
  }
  return col;
}

void main() {
  vec2 uv = (FC - .5 * R) / MN;
  vec3 col = vec3(0);
  float s = 12., e = 9e-4 * uGlow;
  col += e / (sin(uv.x * s) * cos(uv.y * s));
  uv.y += R.x > R.y ? .5 : .5 * (R.y / R.x);
  col += scene(uv);
  col *= uTint;
  O = vec4(col, 1.);
}
`

export default function AetherShaderBG(props) {
    const { speed, scale, glow, tint, dprMax, clearColor } = props
    const isStatic = useIsStaticRenderer()

    const canvasRef = useRef(null)
    const programRef = useRef(null)
    const bufRef = useRef(null)
    const uniformsRef = useRef({})
    const rafRef = useRef(null)

    const compileShader = (gl, src, type) => {
        const sh = gl.createShader(type)
        gl.shaderSource(sh, src)
        gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(sh) || "Unknown shader error"
            gl.deleteShader(sh)
            throw new Error(info)
        }
        return sh
    }

    const createProgram = (gl, vs, fs) => {
        const v = compileShader(gl, vs, gl.VERTEX_SHADER)
        const f = compileShader(gl, fs, gl.FRAGMENT_SHADER)
        const prog = gl.createProgram()
        gl.attachShader(prog, v)
        gl.attachShader(prog, f)
        gl.linkProgram(prog)
        gl.deleteShader(v)
        gl.deleteShader(f)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(prog) || "Program link error"
            gl.deleteProgram(prog)
            throw new Error(info)
        }
        return prog
    }

    // Init GL once — skipped entirely on the Framer canvas/export (static render)
    useEffect(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl2", { alpha: true, antialias: true })
        if (!gl) return

        let prog
        try {
            prog = createProgram(gl, VERT_SRC, FRAG_SRC)
        } catch (e) {
            console.error(e)
            return
        }
        programRef.current = prog

        const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1])
        const buf = gl.createBuffer()
        bufRef.current = buf
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)

        gl.useProgram(prog)
        const posLoc = gl.getAttribLocation(prog, "position")
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        uniformsRef.current = {
            time: gl.getUniformLocation(prog, "time"),
            resolution: gl.getUniformLocation(prog, "resolution"),
            uSpeed: gl.getUniformLocation(prog, "uSpeed"),
            uScale: gl.getUniformLocation(prog, "uScale"),
            uGlow: gl.getUniformLocation(prog, "uGlow"),
            uTint: gl.getUniformLocation(prog, "uTint"),
        }

        const fit = () => {
            const dpr = Math.max(
                1,
                Math.min(window.devicePixelRatio || 1, dprMax)
            )
            const rect = canvas.getBoundingClientRect()
            const cssW = Math.max(1, rect.width)
            const cssH = Math.max(1, rect.height)
            const W = Math.floor(cssW * dpr)
            const H = Math.floor(cssH * dpr)
            if (canvas.width !== W || canvas.height !== H) {
                canvas.width = W
                canvas.height = H
            }
            gl.viewport(0, 0, canvas.width, canvas.height)
        }
        fit()
        const onResize = () => fit()
        const ro = new ResizeObserver(fit)
        ro.observe(canvas)
        window.addEventListener("resize", onResize)

        const loop = (now) => {
            const cc = clearColor || { r: 0, g: 0, b: 0, a: 1 }
            gl.clearColor(cc.r, cc.g, cc.b, cc.a)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.useProgram(prog)
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)

            const u = uniformsRef.current
            if (u.resolution)
                gl.uniform2f(u.resolution, canvas.width, canvas.height)
            if (u.time) gl.uniform1f(u.time, now * 1e-3)
            if (u.uSpeed) gl.uniform1f(u.uSpeed, speed)
            if (u.uScale) gl.uniform1f(u.uScale, scale)
            if (u.uGlow) gl.uniform1f(u.uGlow, glow)
            if (u.uTint) {
                const t = tint || { r: 1, g: 1, b: 1 }
                gl.uniform3f(u.uTint, t.r, t.g, t.b)
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            rafRef.current = requestAnimationFrame(loop)
        }

        const startLoop = () => {
            if (rafRef.current == null) {
                rafRef.current = requestAnimationFrame(loop)
            }
        }
        const stopLoop = () => {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }

        // Only render while the canvas is actually visible in the viewport —
        // pause the rAF loop off-screen and resume it when it scrolls back in.
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry && entry.isIntersecting) {
                    startLoop()
                } else {
                    stopLoop()
                }
            },
            { threshold: 0 }
        )
        io.observe(canvas)

        return () => {
            io.disconnect()
            ro.disconnect()
            window.removeEventListener("resize", onResize)
            stopLoop()
            if (bufRef.current) gl.deleteBuffer(bufRef.current)
            if (programRef.current) gl.deleteProgram(programRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dprMax, isStatic])

    if (isStatic) {
        // Static preview for the Framer canvas / export — no animation, no WebGL.
        const cc = clearColor || { r: 0, g: 0, b: 0, a: 1 }
        const t = tint || { r: 1, g: 1, b: 1 }
        const base = `rgb(${Math.round(cc.r * 255)}, ${Math.round(cc.g * 255)}, ${Math.round(cc.b * 255)})`
        const accent = `rgb(${Math.round(120 * t.r)}, ${Math.round(90 * t.g)}, ${Math.round(200 * t.b)})`
        return (
            <div
                role="img"
                aria-label="Animated shader background (static preview)"
                style={{
                    width: "100%",
                    height: "100%",
                    background: `radial-gradient(circle at 50% 50%, ${accent}, ${base} 70%)`,
                }}
            />
        )
    }

    return (
        <canvas
            ref={canvasRef}
            role="img"
            aria-label="Animated shader background"
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                userSelect: "none",
                touchAction: "none",
            }}
        />
    )
}

AetherShaderBG.defaultProps = {
    speed: 1,
    scale: 6,
    glow: 1,
    tint: { r: 1, g: 1, b: 1 },
    dprMax: 2,
    clearColor: { r: 0, g: 0, b: 0, a: 1 },
}

addPropertyControls(AetherShaderBG, {
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 6,
        min: 1,
        max: 20,
        step: 0.5,
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
    },
    tint: {
        type: ControlType.Object,
        title: "Tint",
        buttonTitle: "Edit",
        controls: {
            r: {
                type: ControlType.Number,
                title: "R",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            g: {
                type: ControlType.Number,
                title: "G",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            b: {
                type: ControlType.Number,
                title: "B",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
        },
    },
    dprMax: {
        type: ControlType.Number,
        title: "Max DPR",
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 0.5,
    },
    clearColor: {
        type: ControlType.Object,
        title: "Clear Color",
        buttonTitle: "Edit",
        controls: {
            r: {
                type: ControlType.Number,
                title: "R",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0,
            },
            g: {
                type: ControlType.Number,
                title: "G",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0,
            },
            b: {
                type: ControlType.Number,
                title: "B",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0,
            },
            a: {
                type: ControlType.Number,
                title: "A",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 1,
            },
        },
    },
})
