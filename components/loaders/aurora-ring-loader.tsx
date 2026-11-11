import * as React from "react"
import { useEffect, useRef, useState } from "react"
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
 * Aurora Ring Loader
 * A looping, organic spectrum ring rendered with a single WebGL fragment shader.
 * No external dependencies. Pauses off-screen, in hidden tabs and for reduced motion.
 *
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 240
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */

type RGB = [number, number, number]

interface Props {
    speed: number
    ringSize: number
    thickness: number
    wobble: number
    glow: number
    highlight: number
    colorMode: "spectrum" | "custom"
    inner: string
    middle: string
    outer: string
    showDisc: boolean
    discOpacity: number
    background: string
    borderRadius: string
    quality: "low" | "medium" | "high"
    playing: boolean
    respectReducedMotion: boolean
}

const QUALITY_DPR = { low: 1, medium: 1.5, high: 2 }
const STATIC_TIME = 5.4

const VERT = `
attribute vec2 aPos;
void main() {
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uRing;
uniform float uThick;
uniform float uWobble;
uniform float uGlow;
uniform float uHighlight;
uniform float uDisc;
uniform float uDiscOpacity;
uniform float uCustom;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

const float PI = 3.14159265;

// red -> orange -> yellow -> green -> pale cyan -> blue -> indigo -> violet
vec3 spectrum(float t) {
    vec3 c = vec3(1.0, 0.05, 0.0);
    c = mix(c, vec3(1.0, 0.5, 0.0), smoothstep(0.00, 0.10, t));
    c = mix(c, vec3(0.95, 0.9, 0.15), smoothstep(0.08, 0.20, t));
    c = mix(c, vec3(0.2, 0.9, 0.45), smoothstep(0.18, 0.29, t));
    c = mix(c, vec3(0.78, 0.96, 1.0), smoothstep(0.27, 0.42, t));
    c = mix(c, vec3(0.0, 0.7, 1.0), smoothstep(0.40, 0.58, t));
    c = mix(c, vec3(0.1, 0.15, 0.95), smoothstep(0.55, 0.78, t));
    c = mix(c, vec3(0.2, 0.0, 0.45), smoothstep(0.75, 1.0, t));
    return c;
}

vec3 customRamp(float t) {
    vec3 c = mix(uC1, uC2, smoothstep(0.0, 0.5, t));
    return mix(c, uC3, smoothstep(0.4, 1.0, t));
}

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y) * 2.0;
    float r = length(p);
    float a = atan(p.y, p.x + 0.00001);
    float t = uTime;

    // Organic contour: integer angular harmonics, so the shape closes seamlessly
    float w =
        sin(a * 2.0 + t * 0.9) * 0.50 +
        sin(a * 3.0 - t * 1.3 + 1.7) * 0.35 +
        sin(a * 5.0 + t * 1.9 + 4.1) * 0.22 +
        sin(a * 7.0 - t * 2.6 + 2.3) * 0.12 +
        sin(a * 11.0 + t * 3.1) * 0.06;

    float R = uRing + w * uWobble * 0.12;
    float th = uThick * (1.0 + 0.3 * sin(a * 2.0 - t * 0.7 + 0.8) + 0.18 * sin(a * 3.0 + t * 1.1));
    float s = (r - R) / th;

    float tt = clamp(s, 0.0, 1.0);
    vec3 base = mix(spectrum(tt), customRamp(tt), step(0.5, uCustom));

    // Sharp inner edge, soft outer falloff
    float inner = smoothstep(-0.05, 0.03, s);
    float outer = 1.0 - smoothstep(0.55, 1.0, s);
    vec3 col = base * inner * outer;

    // Glow beyond the outer edge and a faint haze inside
    vec3 innerC = mix(vec3(1.0, 0.1, 0.0), uC1, step(0.5, uCustom));
    vec3 outerC = mix(vec3(0.15, 0.1, 0.8), uC3, step(0.5, uCustom));
    col += outerC * exp(-max(s - 0.2, 0.0) * 2.2) * inner * 0.22 * uGlow;
    col += innerC * (1.0 - inner) * exp(min(s, 0.0) * 10.0) * 0.18 * uGlow;

    // Travelling hot spot
    float ha = t * 0.7 + sin(t * 0.5) * 1.2;
    float da = abs(mod(a - ha + PI, 2.0 * PI) - PI);
    float q = (s - 0.12) / 0.14;
    col += vec3(1.0) * exp(-da * da * 40.0) * exp(-q * q) * uHighlight * 0.9;

    // Glass disc
    if (uDisc > 0.5) {
        float discR = 0.985;
        col *= 1.0 - smoothstep(discR - 0.006, discR + 0.004, r);
        float border = 1.0 - smoothstep(0.0, 0.012, abs(r - discR + 0.006));
        float rim = smoothstep(0.7, discR, r) * 0.06;
        col += vec3(0.55, 0.6, 0.8) * (border * 0.55 + rim) * uDiscOpacity;
    }

    col = clamp(col, 0.0, 1.0);
    float alpha = max(max(col.r, col.g), col.b);
    gl_FragColor = vec4(col, alpha); // premultiplied
}
`

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

function parseColor(input: string | undefined, fallback: RGB): RGB {
    if (!input || typeof input !== "string") return fallback
    let s = input.trim()
    const v = s.match(/^var\([^,]+,\s*(.+)\)$/)
    if (v) s = v[1].trim()

    if (s[0] === "#") {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4) {
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        }
        if (h.length >= 6) {
            const n = parseInt(h.slice(0, 6), 16)
            if (!isNaN(n)) {
                return [
                    ((n >> 16) & 255) / 255,
                    ((n >> 8) & 255) / 255,
                    (n & 255) / 255,
                ]
            }
        }
        return fallback
    }

    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
    if (m)
        return [
            clamp01(+m[1] / 255),
            clamp01(+m[2] / 255),
            clamp01(+m[3] / 255),
        ]
    return fallback
}

const UNIFORMS = [
    "uRes",
    "uTime",
    "uRing",
    "uThick",
    "uWobble",
    "uGlow",
    "uHighlight",
    "uDisc",
    "uDiscOpacity",
    "uCustom",
    "uC1",
    "uC2",
    "uC3",
] as const

export default function AuroraRingLoader(props: Props) {
    const {
        background,
        borderRadius,
        showDisc,
        colorMode,
        ringSize,
        thickness,
    } = props

    const isStatic = useIsStaticRenderer()
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props
    const syncRef = useRef<(() => void) | null>(null)
    const [glReady, setGlReady] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "low-power",
        })
        if (!gl) return

        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)
            if (!sh) return null
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                gl.deleteShader(sh)
                return null
            }
            return sh
        }

        const vs = compile(gl.VERTEX_SHADER, VERT)
        const fs = compile(gl.FRAGMENT_SHADER, FRAG)
        const program = gl.createProgram()
        if (!vs || !fs || !program) return

        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)
            return
        }
        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const aPos = gl.getAttribLocation(program, "aPos")
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

        const loc: Record<string, WebGLUniformLocation | null> = {}
        UNIFORMS.forEach(
            (name) => (loc[name] = gl.getUniformLocation(program, name))
        )

        let time = STATIC_TIME
        let raf = 0
        let last = 0
        let visible = true
        let colorKey = ""
        let colors: RGB[] = []

        const mq =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null

        const draw = () => {
            const p = propsRef.current
            const key = `${p.inner}|${p.middle}|${p.outer}`
            if (key !== colorKey) {
                colorKey = key
                colors = [
                    parseColor(p.inner, [1, 0.2, 0.1]),
                    parseColor(p.middle, [1, 0.9, 0.4]),
                    parseColor(p.outer, [0.2, 0.3, 1]),
                ]
            }
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.uniform2f(loc.uRes, canvas.width, canvas.height)
            gl.uniform1f(loc.uTime, time)
            gl.uniform1f(loc.uRing, p.ringSize)
            gl.uniform1f(loc.uThick, p.thickness)
            gl.uniform1f(loc.uWobble, p.wobble)
            gl.uniform1f(loc.uGlow, p.glow)
            gl.uniform1f(loc.uHighlight, p.highlight)
            gl.uniform1f(loc.uDisc, p.showDisc ? 1 : 0)
            gl.uniform1f(loc.uDiscOpacity, p.discOpacity)
            gl.uniform1f(loc.uCustom, p.colorMode === "custom" ? 1 : 0)
            gl.uniform3f(loc.uC1, colors[0][0], colors[0][1], colors[0][2])
            gl.uniform3f(loc.uC2, colors[1][0], colors[1][1], colors[1][2])
            gl.uniform3f(loc.uC3, colors[2][0], colors[2][1], colors[2][2])
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const resize = () => {
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                QUALITY_DPR[propsRef.current.quality] ?? 1.5
            )
            // clientWidth/Height ignore CSS transforms (Framer canvas zoom)
            const w = Math.max(1, Math.round(wrap.clientWidth * dpr))
            const h = Math.max(1, Math.round(wrap.clientHeight * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            draw()
        }

        const shouldRun = () =>
            !isStatic &&
            visible &&
            !document.hidden &&
            propsRef.current.playing &&
            !(propsRef.current.respectReducedMotion && mq && mq.matches)

        const frame = (now: number) => {
            raf = 0
            if (!shouldRun()) return
            const dt = Math.min((now - last) / 1000, 0.1)
            last = now
            time += dt * propsRef.current.speed
            draw()
            raf = requestAnimationFrame(frame)
        }

        const stop = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
        }

        const sync = () => {
            resize()
            if (shouldRun()) {
                if (!raf) {
                    last = performance.now()
                    raf = requestAnimationFrame(frame)
                }
            } else {
                stop()
            }
        }
        syncRef.current = sync

        const ro = new ResizeObserver(sync)
        ro.observe(wrap)

        const io = new IntersectionObserver((entries) => {
            visible = entries[entries.length - 1].isIntersecting
            sync()
        })
        io.observe(wrap)

        const onVisibility = () => sync()
        const onLost = (e: Event) => {
            e.preventDefault()
            stop()
            setGlReady(false)
        }
        document.addEventListener("visibilitychange", onVisibility)
        canvas.addEventListener("webglcontextlost", onLost)
        mq?.addEventListener("change", onVisibility)

        sync()
        setGlReady(true)

        return () => {
            stop()
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", onVisibility)
            canvas.removeEventListener("webglcontextlost", onLost)
            mq?.removeEventListener("change", onVisibility)
            syncRef.current = null
            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)
        }
    }, [isStatic])

    // Re-sync (redraw / start / stop) whenever a visual prop changes
    useEffect(() => {
        syncRef.current?.()
    }, [
        props.playing,
        props.ringSize,
        props.thickness,
        props.wobble,
        props.glow,
        props.highlight,
        props.colorMode,
        props.inner,
        props.middle,
        props.outer,
        props.showDisc,
        props.discOpacity,
        props.quality,
        props.respectReducedMotion,
    ])

    // CSS fallback: shown on the server / static export and until WebGL is ready
    const stops =
        colorMode === "custom"
            ? [
                  props.inner,
                  props.middle,
                  props.middle,
                  props.outer,
                  props.outer,
              ]
            : ["#ff2a00", "#ff8a00", "#e8f060", "#c7f4ff", "#1a28f2"]
    const r0 = ringSize * 100
    const th = thickness * 100
    const fallbackGradient = `radial-gradient(circle closest-side, transparent ${r0 - 1}%, ${stops[0]} ${r0}%, ${stops[1]} ${r0 + th * 0.15}%, ${stops[2]} ${r0 + th * 0.3}%, ${stops[3]} ${r0 + th * 0.5}%, ${stops[4]} ${r0 + th * 0.8}%, transparent ${r0 + th * 1.1}%)`

    return (
        <div
            ref={wrapRef}
            role="status"
            aria-label="Loading"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                borderRadius,
            }}
        >
            {!glReady && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            maxWidth: "100%",
                            aspectRatio: "1 / 1",
                            borderRadius: "50%",
                            background: fallbackGradient,
                            border: showDisc
                                ? "1px solid rgba(150,160,210,0.35)"
                                : "none",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
            )}
            <canvas
                ref={canvasRef}
                aria-hidden
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

AuroraRingLoader.displayName = "Aurora Ring Loader"

AuroraRingLoader.defaultProps = {
    speed: 1,
    ringSize: 0.58,
    thickness: 0.2,
    wobble: 0.5,
    glow: 0.6,
    highlight: 0.5,
    colorMode: "spectrum",
    inner: "#FF3B1F",
    middle: "#FFE066",
    outer: "#3B4BFF",
    showDisc: true,
    discOpacity: 0.5,
    background: "#000000",
    borderRadius: "0px",
    quality: "medium",
    playing: true,
    respectReducedMotion: true,
}

addPropertyControls(AuroraRingLoader, {
    playing: {
        type: ControlType.Boolean,
        title: "Playing",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 0.05,
    },
    ringSize: {
        type: ControlType.Number,
        title: "Ring Size",
        defaultValue: 0.58,
        min: 0.2,
        max: 0.85,
        step: 0.01,
    },
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 0.2,
        min: 0.05,
        max: 0.45,
        step: 0.01,
    },
    wobble: {
        type: ControlType.Number,
        title: "Wobble",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 0.6,
        min: 0,
        max: 2,
        step: 0.05,
    },
    highlight: {
        type: ControlType.Number,
        title: "Highlight",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Colors",
        defaultValue: "spectrum",
        options: ["spectrum", "custom"],
        optionTitles: ["Spectrum", "Custom"],
        displaySegmentedControl: true,
    },
    inner: {
        type: ControlType.Color,
        title: "Inner",
        defaultValue: "#FF3B1F",
        hidden: (p: Props) => p.colorMode !== "custom",
    },
    middle: {
        type: ControlType.Color,
        title: "Middle",
        defaultValue: "#FFE066",
        hidden: (p: Props) => p.colorMode !== "custom",
    },
    outer: {
        type: ControlType.Color,
        title: "Outer",
        defaultValue: "#3B4BFF",
        hidden: (p: Props) => p.colorMode !== "custom",
    },
    showDisc: {
        type: ControlType.Boolean,
        title: "Glass Disc",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    discOpacity: {
        type: ControlType.Number,
        title: "Disc Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p: Props) => !p.showDisc,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
    },
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        defaultValue: "medium",
        options: ["low", "medium", "high"],
        optionTitles: ["Low", "Medium", "High"],
        displaySegmentedControl: true,
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
})
