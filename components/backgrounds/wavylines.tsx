// ─────────────────────────────────────────────────────────────
//  Wavylines — Framer Code Component
//  Animated WebGL plasma shader background
//  Fully editable colors + speed via property panel
//  Paste into Framer → Assets → Code → New File
// ─────────────────────────────────────────────────────────────

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


const VS = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`

const FS = `
  precision highp float;
  uniform vec2  iResolution;
  uniform float iTime;
  uniform vec3  uLineColor;
  uniform vec3  uBgColor1;
  uniform vec3  uBgColor2;
  uniform float uSpeed;

  const float gridSmoothWidth    = 0.015;
  const float axisWidth          = 0.05;
  const float majorLineWidth     = 0.025;
  const float minorLineWidth     = 0.0125;
  const float majorLineFrequency = 5.0;
  const float minorLineFrequency = 1.0;
  const float scale              = 5.0;
  const float minLineWidth       = 0.01;
  const float maxLineWidth       = 0.2;
  const float lineAmplitude      = 1.0;
  const float lineFrequency      = 0.2;
  const float warpFrequency      = 0.5;
  const float warpAmplitude      = 1.0;
  const float offsetFrequency    = 0.5;
  const float minOffsetSpread    = 0.6;
  const float maxOffsetSpread    = 2.0;
  const int   linesPerGroup      = 16;

  #define drawCircle(pos, radius, coord) \
    smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
  #define drawSmoothLine(pos, halfWidth, t) \
    smoothstep(halfWidth, 0.0, abs(pos - (t)))
  #define drawCrispLine(pos, halfWidth, t) \
    smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
  #define drawPeriodicLine(freq, width, t) \
    drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

  float random(float t) {
    return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
  }

  float getPlasmaY(float x, float hFade, float offset, float speed) {
    return random(x * lineFrequency + iTime * speed) * hFade * lineAmplitude + offset;
  }

  void main() {
    vec2 uv    = gl_FragCoord.xy / iResolution.xy;
    vec2 space = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.x * 2.0 * scale;

    float lineSpeed   = 1.0  * 0.2 * uSpeed;
    float warpSpeed   = 0.2  * 0.2 * uSpeed;
    float offsetSpeed = 1.33 * 0.2 * uSpeed;

    float hFade = 1.0 - (cos(uv.x * 6.28318) * 0.5 + 0.5);
    float vFade = 1.0 - (cos(uv.y * 6.28318) * 0.5 + 0.5);

    space.y += random(space.x * warpFrequency + iTime * warpSpeed)
               * warpAmplitude * (0.5 + hFade);
    space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0)
               * warpAmplitude * hFade;

    vec4 lines = vec4(0.0);

    for (int l = 0; l < linesPerGroup; l++) {
      float nIdx       = float(l) / float(linesPerGroup);
      float offsetTime = iTime * offsetSpeed;
      float offsetPos  = float(l) + space.x * offsetFrequency;
      float rand       = random(offsetPos + offsetTime) * 0.5 + 0.5;
      float halfWidth  = mix(minLineWidth, maxLineWidth, rand * hFade) / 2.0;
      float offset     = random(offsetPos + offsetTime * (1.0 + nIdx))
                         * mix(minOffsetSpread, maxOffsetSpread, hFade);
      float linePos    = getPlasmaY(space.x, hFade, offset, lineSpeed);
      float line       = drawSmoothLine(linePos, halfWidth, space.y) / 2.0
                       + drawCrispLine(linePos, halfWidth * 0.15, space.y);

      float circleX    = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
      vec2  circlePos  = vec2(circleX, getPlasmaY(circleX, hFade, offset, lineSpeed));
      float circle     = drawCircle(circlePos, 0.01, space) * 4.0;

      lines += (line + circle) * vec4(uLineColor, 1.0) * rand;
    }

    vec4 bg = mix(vec4(uBgColor1, 1.0), vec4(uBgColor2, 1.0), uv.x);
    bg     *= vFade;
    bg.a    = 1.0;
    bg     += lines;

    gl_FragColor = bg;
  }
`

function cssToRgb(color: string): [number, number, number] {
    if (typeof document === "undefined") return [0, 0, 0]
    const c = document.createElement("canvas")
    c.width = c.height = 1
    const ctx = c.getContext("2d")!
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0] / 255, d[1] / 255, d[2] / 255]
}

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, source)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(s))
        gl.deleteShader(s)
        return null
    }
    return s
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
    const vert = compileShader(gl, gl.VERTEX_SHADER, VS)
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FS)
    if (!vert || !frag) return null
    const prog = gl.createProgram()
    if (!prog) return null
    gl.attachShader(prog, vert)
    gl.attachShader(prog, frag)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error("Program error:", gl.getProgramInfoLog(prog))
        return null
    }
    return prog
}

export default function Wavylines(props) {
    const { lineColor, bgColor1, bgColor2, speed, borderRadius, style } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef({ lineColor, bgColor1, bgColor2, speed })
    propsRef.current = { lineColor, bgColor1, bgColor2, speed }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl")
        if (!gl) {
            console.warn("WebGL not supported.")
            return
        }

        const program = createProgram(gl)
        if (!program) return

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )

        const aPos = gl.getAttribLocation(program, "aVertexPosition")
        const uRes = gl.getUniformLocation(program, "iResolution")
        const uTime = gl.getUniformLocation(program, "iTime")
        const uLine = gl.getUniformLocation(program, "uLineColor")
        const uBg1 = gl.getUniformLocation(program, "uBgColor1")
        const uBg2 = gl.getUniformLocation(program, "uBgColor2")
        const uSpd = gl.getUniformLocation(program, "uSpeed")

        const resize = () => {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            gl.viewport(0, 0, canvas.width, canvas.height)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(canvas)

        let raf: number
        const t0 = performance.now()

        const render = () => {
            const t = (performance.now() - t0) / 1000
            const p = propsRef.current

            gl.clearColor(0, 0, 0, 1)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.useProgram(program)

            gl.uniform2f(uRes, canvas.width, canvas.height)
            gl.uniform1f(uTime, t)
            gl.uniform3fv(uLine, cssToRgb(p.lineColor))
            gl.uniform3fv(uBg1, cssToRgb(p.bgColor1))
            gl.uniform3fv(uBg2, cssToRgb(p.bgColor2))
            gl.uniform1f(uSpd, p.speed)

            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(aPos)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            raf = requestAnimationFrame(render)
        }

        raf = requestAnimationFrame(render)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            gl.deleteProgram(program)
            gl.deleteBuffer(buf)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: "block",
                width: "100%",
                height: "100%",
                borderRadius,
                ...style,
            }}
        />
    )
}

Wavylines.defaultProps = {
    lineColor: "#7033cc",
    bgColor1: "#1a1a4d",
    bgColor2: "#4d1a80",
    speed: 1.0,
    borderRadius: 0,
}

addPropertyControls(Wavylines, {
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#7033cc",
    },
    bgColor1: {
        type: ControlType.Color,
        title: "BG Left",
        defaultValue: "#1a1a4d",
    },
    bgColor2: {
        type: ControlType.Color,
        title: "BG Right",
        defaultValue: "#4d1a80",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1.0,
        min: 0,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 999,
    },
})
