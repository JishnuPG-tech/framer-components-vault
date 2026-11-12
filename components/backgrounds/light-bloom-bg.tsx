/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

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


const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_glow;
uniform float u_scale;
uniform float u_grain;
uniform vec3 u_colorCore;
uniform vec3 u_colorGlow;
uniform vec3 u_colorBg;

varying vec2 v_uv;

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));

    return mix(
        mix(a, b, u.x),
        mix(c, d, u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float v = 0.60 * vnoise(p);
    v += 0.30 * vnoise(p * 2.02 + vec2(31.4, 17.7));
    v += 0.15 * vnoise(p * 4.04 + vec2(11.9, 7.3));
    return v * 1.07;
}

void main() {
    vec2 uv = v_uv;

    float aspect =
        u_resolution.x /
        max(u_resolution.y, 1.0);

    float t = u_time;
    float scale = max(u_scale, 3.0);
    float x = (uv.x - 0.5) * aspect;

    float sway =
        (
            vnoise(
                vec2(
                    x * 0.7 + t * 0.07,
                    uv.y * 1.2 - t * 0.22
                )
            ) - 0.5
        )
        * 0.05
        * (0.4 + uv.y);

    float xs = x * (1.0 + uv.y * 0.04);

    float columns = fbm(
        vec2(
            xs * scale + sway * scale,
            t * 0.18
        )
    );

    float ray = pow(
        smoothstep(0.36, 0.72, columns),
        1.1
    );

    float streaks = vnoise(
        vec2(
            xs * scale * 3.0 + 7.0,
            t * 0.19
        )
    );

    ray *= 0.85 + 0.20 * streaks;

    float glow = max(u_glow, 0.05);

    float rise = pow(
        clamp(1.0 - uv.y, 0.0, 1.0),
        (
            1.5 +
            (1.0 - min(ray, 1.0)) * 0.6
        ) / glow
    );

    float riseCursor = pow(
        clamp(1.0 - uv.y, 0.0, 1.0),
        1.1 / glow
    );

    float light =
        ray *
        rise *
        (0.55 + 0.45 * glow)
        +
        rise *
        rise *
        0.30 *
        glow;

    float dx =
        (uv.x - u_mouse.x) *
        aspect;

    float cursor =
        exp(-dx * dx * 8.0);

    light +=
        cursor *
        riseCursor *
        (0.80 + 0.20 * ray) *
        1.05 *
        glow;

    vec3 col = u_colorBg;

    col = mix(
        col,
        u_colorGlow,
        clamp(light, 0.0, 1.0)
    );

    float white =
        pow(rise, 5.0) *
        (0.50 + 0.40 * ray) *
        glow
        +
        cursor *
        pow(riseCursor, 3.0) *
        (0.70 + 0.30 * ray) *
        0.9 *
        glow;

    col = mix(
        col,
        u_colorCore,
        clamp(
            smoothstep(0.30, 0.90, white),
            0.0,
            1.0
        )
    );

    col +=
        (hash12(gl_FragCoord.xy) - 0.5) *
        u_grain;

    gl_FragColor = vec4(
        clamp(col, 0.0, 1.0),
        1.0
    );
}
`

const STATIC_PREVIEW_TIME = 1.5

type RGB = [number, number, number]

type ColorPreset =
    | "Custom"
    | "Aurora"
    | "Violet"
    | "Ocean"
    | "Ember"
    | "Ice"
    | "Mono"

type AnimationPreset =
    | "Custom"
    | "Slow"
    | "Smooth"
    | "Flow"
    | "Pulse"
    | "Cinematic"
    | "Static"

interface PresetValues {
    core: string
    glow: string
    bg: string
}

interface AnimationValues {
    speed: number
    glow: number
    density: number
}

const COLOR_PRESETS: Record<Exclude<ColorPreset, "Custom">, PresetValues> = {
    Aurora: {
        core: "#FFFFFF",
        glow: "#27E8B5",
        bg: "#031510",
    },
    Violet: {
        core: "#FFFFFF",
        glow: "#6D35FF",
        bg: "#080313",
    },
    Ocean: {
        core: "#EFFFFF",
        glow: "#00AEEF",
        bg: "#00131D",
    },
    Ember: {
        core: "#FFF4D6",
        glow: "#FF4D18",
        bg: "#160502",
    },
    Ice: {
        core: "#FFFFFF",
        glow: "#78DFFF",
        bg: "#03101A",
    },
    Mono: {
        core: "#FFFFFF",
        glow: "#BFC5CC",
        bg: "#050505",
    },
}

const ANIMATION_PRESETS: Record<
    Exclude<AnimationPreset, "Custom">,
    AnimationValues
> = {
    Slow: {
        speed: 0.35,
        glow: 0.9,
        density: 5,
    },
    Smooth: {
        speed: 0.7,
        glow: 1,
        density: 6,
    },
    Flow: {
        speed: 1.15,
        glow: 1.05,
        density: 7,
    },
    Pulse: {
        speed: 1.65,
        glow: 1.2,
        density: 8,
    },
    Cinematic: {
        speed: 0.5,
        glow: 1.35,
        density: 4.5,
    },
    Static: {
        speed: 0,
        glow: 1,
        density: 6,
    },
}

function parseColor(color: string | undefined, fallback: RGB): RGB {
    if (!color) return fallback

    const value = color.trim().toLowerCase()

    if (value.startsWith("#")) {
        let hex = value.slice(1)

        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((char) => char + char)
                .join("")
        }

        if (hex.length === 8) {
            hex = hex.slice(0, 6)
        }

        if (hex.length === 6) {
            const num = parseInt(hex, 16)

            if (!Number.isNaN(num)) {
                return [
                    ((num >> 16) & 255) / 255,
                    ((num >> 8) & 255) / 255,
                    (num & 255) / 255,
                ]
            }
        }
    }

    const match = value.match(/rgba?\(([^)]+)\)/)

    if (match) {
        const parts = match[1].split(",").map((part) => parseFloat(part.trim()))

        if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
            return [
                Math.max(0, Math.min(255, parts[0])) / 255,
                Math.max(0, Math.min(255, parts[1])) / 255,
                Math.max(0, Math.min(255, parts[2])) / 255,
            ]
        }
    }

    return fallback
}

interface LightBloomKarimSaifProps {
    colorPreset?: ColorPreset
    animationPreset?: AnimationPreset
    color1?: string
    color2?: string
    color3?: string
    glowIntensity?: number
    waveDensity?: number
    animationSpeed?: number
    grainIntensity?: number
    mouseSensitivity?: number
}

const DEFAULT_COLORS = {
    core: [1, 1, 1] as RGB,
    glow: [0.357, 0.129, 1] as RGB,
    bg: [0, 0, 0] as RGB,
}

function getColors(props: LightBloomKarimSaifProps): PresetValues {
    if (props.colorPreset && props.colorPreset !== "Custom") {
        return COLOR_PRESETS[props.colorPreset]
    }

    return {
        core: props.color1 || "#FFFFFF",
        glow: props.color2 || "#5B21FF",
        bg: props.color3 || "#000000",
    }
}

function getAnimation(props: LightBloomKarimSaifProps): AnimationValues {
    if (props.animationPreset && props.animationPreset !== "Custom") {
        return ANIMATION_PRESETS[props.animationPreset]
    }

    return {
        speed: props.animationSpeed ?? 1,
        glow: props.glowIntensity ?? 1,
        density: props.waveDensity ?? 6,
    }
}

export default function LightBloomKarimSaif(props: LightBloomKarimSaifProps) {
    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)

    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const propsRef = React.useRef(props)

    const colorsRef = React.useRef(DEFAULT_COLORS)

    const renderRef = React.useRef<(() => void) | null>(null)

    const [glFailed, setGlFailed] = React.useState(false)

    const [contextEpoch, setContextEpoch] = React.useState(0)

    const effectiveColors = getColors(props)

    const effectiveAnimation = getAnimation(props)

    const previewKey = [
        props.colorPreset,
        props.animationPreset,
        props.color1,
        props.color2,
        props.color3,
        props.glowIntensity,
        props.waveDensity,
        props.animationSpeed,
        props.grainIntensity,
    ].join("|")

    React.useEffect(() => {
        propsRef.current = props

        const colors = getColors(props)

        colorsRef.current = {
            core: parseColor(colors.core, DEFAULT_COLORS.core),
            glow: parseColor(colors.glow, DEFAULT_COLORS.glow),
            bg: parseColor(colors.bg, DEFAULT_COLORS.bg),
        }
    }, [props])

    React.useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current

        if (!container || !canvas) return

        const cleanups: Array<() => void> = []

        const addCleanup = (cleanup: () => void) => {
            cleanups.push(cleanup)
        }

        let gl: WebGLRenderingContext | null = null
        let program: WebGLProgram | null = null
        let raf = 0
        let running = false
        let inView = true
        let lastFrame = 0
        let animTime = 0

        const target = {
            x: 0.5,
            y: 1,
        }

        const current = {
            x: 0.5,
            y: 1,
        }

        try {
            gl = (canvas.getContext("webgl", {
                alpha: false,
                depth: false,
                stencil: false,
                antialias: false,
                preserveDrawingBuffer: false,
            }) ??
                canvas.getContext(
                    "experimental-webgl"
                )) as WebGLRenderingContext | null

            if (!gl) {
                throw new Error("WebGL unavailable")
            }

            const compileShader = (type: number, source: string) => {
                const shader = gl!.createShader(type)

                if (!shader) {
                    throw new Error("Unable to create shader")
                }

                gl!.shaderSource(shader, source)

                gl!.compileShader(shader)

                if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
                    const info = gl!.getShaderInfoLog(shader)

                    gl!.deleteShader(shader)

                    throw new Error(info || "Shader compilation failed")
                }

                return shader
            }

            const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)

            const fragmentShader = compileShader(
                gl.FRAGMENT_SHADER,
                FRAGMENT_SHADER
            )

            program = gl.createProgram()

            if (!program) {
                throw new Error("Unable to create WebGL program")
            }

            gl.attachShader(program, vertexShader)

            gl.attachShader(program, fragmentShader)

            gl.linkProgram(program)

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                const info = gl.getProgramInfoLog(program)

                throw new Error(info || "Program linking failed")
            }

            gl.useProgram(program)

            const buffer = gl.createBuffer()

            if (!buffer) {
                throw new Error("Unable to create buffer")
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
                gl.STATIC_DRAW
            )

            const position = gl.getAttribLocation(program, "a_position")

            if (position < 0) {
                throw new Error("Missing shader attribute")
            }

            gl.enableVertexAttribArray(position)

            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

            const getUniform = (name: string) =>
                gl!.getUniformLocation(program!, name)

            const uniforms = {
                resolution: getUniform("u_resolution"),
                time: getUniform("u_time"),
                mouse: getUniform("u_mouse"),
                glow: getUniform("u_glow"),
                scale: getUniform("u_scale"),
                grain: getUniform("u_grain"),
                core: getUniform("u_colorCore"),
                glowColor: getUniform("u_colorGlow"),
                bg: getUniform("u_colorBg"),
            }

            const resize = () => {
                const rect = container.getBoundingClientRect()

                const dpr = Math.min(window.devicePixelRatio || 1, 2)

                const width = Math.max(1, Math.round(rect.width * dpr))

                const height = Math.max(1, Math.round(rect.height * dpr))

                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width
                    canvas.height = height
                }
            }

            const renderFrame = (now: number) => {
                if (!gl) return

                const delta = Math.min(
                    Math.max((now - lastFrame) / 1000, 0),
                    1 / 15
                )

                lastFrame = now

                const animation = getAnimation(propsRef.current)

                if (!isStatic) {
                    animTime += delta * Math.max(animation.speed, 0)
                }

                const sensitivity = Math.min(
                    Math.max(propsRef.current.mouseSensitivity ?? 0.1, 0.001),
                    1
                )

                const smoothing = 1 - Math.pow(1 - sensitivity, delta * 60)

                current.x += (target.x - current.x) * smoothing

                current.y += (target.y - current.y) * smoothing

                const colors = colorsRef.current

                resize()

                gl.viewport(0, 0, canvas.width, canvas.height)

                gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)

                gl.uniform1f(
                    uniforms.time,
                    isStatic ? STATIC_PREVIEW_TIME : animTime
                )

                gl.uniform2f(uniforms.mouse, current.x, current.y)

                gl.uniform1f(uniforms.glow, animation.glow)

                gl.uniform1f(uniforms.scale, animation.density)

                gl.uniform1f(
                    uniforms.grain,
                    propsRef.current.grainIntensity ?? 0.08
                )

                gl.uniform3f(
                    uniforms.core,
                    colors.core[0],
                    colors.core[1],
                    colors.core[2]
                )

                gl.uniform3f(
                    uniforms.glowColor,
                    colors.glow[0],
                    colors.glow[1],
                    colors.glow[2]
                )

                gl.uniform3f(
                    uniforms.bg,
                    colors.bg[0],
                    colors.bg[1],
                    colors.bg[2]
                )

                gl.clearColor(colors.bg[0], colors.bg[1], colors.bg[2], 1)

                gl.clear(gl.COLOR_BUFFER_BIT)

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            }

            if (isStatic) {
                const draw = () => {
                    lastFrame = performance.now()

                    renderFrame(lastFrame)
                }

                renderRef.current = draw

                draw()

                const resizeObserver = new ResizeObserver(draw)

                resizeObserver.observe(container)

                addCleanup(() => resizeObserver.disconnect())
            } else {
                const pointerMove = (event: PointerEvent) => {
                    const rect = container.getBoundingClientRect()

                    if (rect.width <= 0 || rect.height <= 0) {
                        return
                    }

                    if (
                        event.clientX < rect.left ||
                        event.clientX > rect.right ||
                        event.clientY < rect.top ||
                        event.clientY > rect.bottom
                    ) {
                        return
                    }

                    target.x = (event.clientX - rect.left) / rect.width

                    target.y = 1 - (event.clientY - rect.top) / rect.height
                }

                window.addEventListener("pointermove", pointerMove, {
                    passive: true,
                })

                addCleanup(() =>
                    window.removeEventListener("pointermove", pointerMove)
                )

                const resizeHandler = () => resize()

                window.addEventListener("resize", resizeHandler)

                addCleanup(() =>
                    window.removeEventListener("resize", resizeHandler)
                )

                const resizeObserver = new ResizeObserver(resize)

                resizeObserver.observe(container)

                addCleanup(() => resizeObserver.disconnect())

                const stop = () => {
                    running = false

                    if (raf) {
                        cancelAnimationFrame(raf)
                    }
                }

                const loop = (now: number) => {
                    if (!running) return

                    renderFrame(now)

                    raf = requestAnimationFrame(loop)
                }

                const start = () => {
                    if (running || !inView || document.hidden) {
                        return
                    }

                    running = true

                    lastFrame = performance.now()

                    raf = requestAnimationFrame(loop)
                }

                resize()

                lastFrame = performance.now()

                renderFrame(lastFrame)

                start()

                const intersectionObserver = new IntersectionObserver(
                    (entries) => {
                        inView = entries[0]?.isIntersecting ?? true

                        if (inView) {
                            start()
                        } else {
                            stop()
                        }
                    },
                    {
                        threshold: 0,
                    }
                )

                intersectionObserver.observe(container)

                addCleanup(() => intersectionObserver.disconnect())

                const visibilityChange = () => {
                    if (document.hidden) {
                        stop()
                    } else {
                        start()
                    }
                }

                document.addEventListener("visibilitychange", visibilityChange)

                addCleanup(() =>
                    document.removeEventListener(
                        "visibilitychange",
                        visibilityChange
                    )
                )

                const contextLost = (event: Event) => {
                    event.preventDefault()
                    stop()
                }

                const contextRestored = () => {
                    setContextEpoch((value) => value + 1)
                }

                canvas.addEventListener("webglcontextlost", contextLost)

                canvas.addEventListener("webglcontextrestored", contextRestored)

                addCleanup(() => {
                    canvas.removeEventListener("webglcontextlost", contextLost)

                    canvas.removeEventListener(
                        "webglcontextrestored",
                        contextRestored
                    )
                })
            }
        } catch {
            setGlFailed(true)
        }

        return () => {
            if (raf) {
                cancelAnimationFrame(raf)
            }

            running = false
            renderRef.current = null

            cleanups.forEach((cleanup) => cleanup())

            if (gl && program) {
                const shaders = gl.getAttachedShaders(program)

                if (shaders) {
                    shaders.forEach((shader) => gl!.deleteShader(shader))
                }

                gl.deleteProgram(program)
            }
        }
    }, [isStatic, contextEpoch])

    React.useEffect(() => {
        if (!isStatic) return

        renderRef.current?.()
    }, [isStatic, previewKey])

    const background = `radial-gradient(
            ellipse 130% 90% at 50% 115%,
            ${effectiveColors.glow} 0%,
            ${effectiveColors.bg} 70%
        )`

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 300,
                minHeight: 300,
                overflow: "hidden",
                background,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: glFailed ? "none" : "block",
                }}
            />
        </div>
    )
}

;(LightBloomKarimSaif as any).displayName = "Light Bloom Karim Saif"
;(LightBloomKarimSaif as any).defaultSize = {
    width: 300,
    height: 300,
}

addPropertyControls(LightBloomKarimSaif, {
    colorPreset: {
        type: ControlType.Enum,
        title: "Color Preset",
        options: [
            "Custom",
            "Aurora",
            "Violet",
            "Ocean",
            "Ember",
            "Ice",
            "Mono",
        ],
        optionTitles: [
            "Custom",
            "Aurora",
            "Violet",
            "Ocean",
            "Ember",
            "Ice",
            "Mono",
        ],
        defaultValue: "Violet",
        description:
            "Choose a complete color palette for the light bloom. Select Custom to use the individual color controls.",
    },

    animationPreset: {
        type: ControlType.Enum,
        title: "Animation Preset",
        options: [
            "Custom",
            "Slow",
            "Smooth",
            "Flow",
            "Pulse",
            "Cinematic",
            "Static",
        ],
        optionTitles: [
            "Custom",
            "Slow",
            "Smooth",
            "Flow",
            "Pulse",
            "Cinematic",
            "Static",
        ],
        defaultValue: "Smooth",
        description:
            "Choose a ready-made animation style. Select Custom to control speed, glow, and density individually.",
    },

    color1: {
        type: ControlType.Color,
        title: "Core Light",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.colorPreset !== "Custom",
        description:
            "Controls the bright core color used at the most intense parts of the light beams.",
    },

    color2: {
        type: ControlType.Color,
        title: "Bloom",
        defaultValue: "#5B21FF",
        hidden: (props) => props.colorPreset !== "Custom",
        description:
            "Controls the main color of the atmospheric bloom and illuminated rays.",
    },

    color3: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        hidden: (props) => props.colorPreset !== "Custom",
        description:
            "Controls the base background color behind the animated light field.",
    },

    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        min: 0.1,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        hidden: (props) => props.animationPreset !== "Custom",
        description:
            "Controls the overall brightness, spread, and intensity of the light bloom.",
    },

    waveDensity: {
        type: ControlType.Number,
        title: "Wave Density",
        min: 1,
        max: 24,
        step: 0.5,
        defaultValue: 6,
        hidden: (props) => props.animationPreset !== "Custom",
        description:
            "Controls the density and number of vertical light formations across the background.",
    },

    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        hidden: (props) => props.animationPreset !== "Custom",
        description:
            "Controls how quickly the light patterns move and evolve over time.",
    },

    grainIntensity: {
        type: ControlType.Number,
        title: "Grain",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.08,
        description:
            "Controls the intensity of the subtle film grain texture over the effect.",
    },

    mouseSensitivity: {
        type: ControlType.Number,
        title: "Mouse Sensitivity",
        min: 0.01,
        max: 1,
        step: 0.01,
        defaultValue: 0.1,
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
