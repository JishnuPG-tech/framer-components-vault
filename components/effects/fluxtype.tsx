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
 * FLUX TYPE
 * Interactive kinetic typography with a lightweight WebGL flow field.
 *
 * Framer requirements covered:
 * - React 18 compatible
 * - Static on Canvas/export via useIsStaticRenderer()
 * - Explicit sizing annotations and style prop support
 * - Default props plus visual Property Controls
 * - Reduced-motion, WebGL fallback, ResizeObserver, DPR cap
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 600
 */

type Effect = "magnet" | "repel" | "wave"
type ShaderMode = "aurora" | "plasma" | "mono"
type BlendMode = "normal" | "difference" | "screen" | "overlay"

type FontStyle = React.CSSProperties & {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
}

interface ContentSettings {
    text: string
    font: FontStyle
    color: string
    align: "left" | "center" | "right"
    maxWidth: number
}

interface InteractionSettings {
    effect: Effect
    strength: number
    radius: number
    lift: number
    idleMotion: boolean
    idleAmount: number
    speed: number
}

interface ShaderSettings {
    enabled: boolean
    mode: ShaderMode
    colorA: string
    colorB: string
    colorC: string
    speed: number
    scale: number
    grain: number
}

interface SurfaceSettings {
    background: string
    padding: number
    radius: number
    borderWidth: number
    borderColor: string
    glow: number
}

interface CursorSettings {
    show: boolean
    size: number
    color: string
}

interface FluxTypeProps {
    content: ContentSettings
    interaction: InteractionSettings
    shader: ShaderSettings
    surface: SurfaceSettings
    cursor: CursorSettings
    blendMode: BlendMode
    style?: React.CSSProperties
}

interface PointerState {
    x: number
    y: number
    targetX: number
    targetY: number
    active: number
    targetActive: number
    mouse: boolean
}

interface GlyphMotion {
    x: number
    y: number
    rotate: number
    scale: number
}

const defaultContent: ContentSettings = {
    text: "MOVE\nDIFFERENT",
    font: {
        fontFamily: "Inter, sans-serif",
        fontSize: 112,
        fontWeight: 800,
        lineHeight: "0.82em",
        letterSpacing: "-0.075em",
    },
    color: "#F4F1EA",
    align: "center",
    maxWidth: 900,
}

const defaultInteraction: InteractionSettings = {
    effect: "magnet",
    strength: 58,
    radius: 260,
    lift: 20,
    idleMotion: true,
    idleAmount: 7,
    speed: 0.75,
}

const defaultShader: ShaderSettings = {
    enabled: true,
    mode: "aurora",
    colorA: "#FF3D00",
    colorB: "#7C3AED",
    colorC: "#00E5FF",
    speed: 0.35,
    scale: 1.15,
    grain: 0.08,
}

const defaultSurface: SurfaceSettings = {
    background: "#070707",
    padding: 48,
    radius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    glow: 42,
}

const defaultCursor: CursorSettings = {
    show: true,
    size: 76,
    color: "#F4F1EA",
}

const vertexShader = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`

const fragmentShader = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_scale;
uniform float u_grain;
uniform float u_mode;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p = rotation * p * 2.03 + 10.7;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / max(u_resolution.y, 1.0);

    vec2 mouse = u_pointer - 0.5;
    mouse.x *= u_resolution.x / max(u_resolution.y, 1.0);
    float mouseGlow = exp(-4.8 * length(p - mouse));
    float t = u_time;

    vec2 flow = vec2(
        fbm(p * (2.1 * u_scale) + vec2(t * 0.15, -t * 0.09)),
        fbm(p * (2.4 * u_scale) + vec2(-t * 0.11, t * 0.13))
    );
    vec2 warped = p + (flow - 0.5) * (0.9 + mouseGlow * 0.45);
    float n = fbm(warped * (2.6 * u_scale) + t * 0.08);
    float ribbons = sin((warped.x + warped.y * 0.56 + n * 0.9) * 6.5 - t);
    float mixA = smoothstep(-0.8, 0.8, ribbons);
    float mixB = smoothstep(0.18, 0.9, n + mouseGlow * 0.42);

    vec3 color;
    if (u_mode < 0.5) {
        color = mix(u_colorA, u_colorB, mixA);
        color = mix(color, u_colorC, mixB * 0.78);
    } else if (u_mode < 1.5) {
        float plasma = 0.5 + 0.5 * sin(8.0 * length(warped) - t * 1.4 + n * 5.0);
        color = mix(u_colorA, u_colorB, plasma);
        color = mix(color, u_colorC, mouseGlow * 0.72 + n * 0.22);
    } else {
        float mono = smoothstep(0.18, 0.92, n + ribbons * 0.13 + mouseGlow * 0.3);
        color = mix(u_colorA, u_colorB, mono);
        color += u_colorC * mouseGlow * 0.28;
    }

    float vignette = smoothstep(1.05, 0.18, length(p));
    color *= 0.58 + vignette * 0.62;
    color += (hash(gl_FragCoord.xy + t) - 0.5) * u_grain;
    gl_FragColor = vec4(color, 1.0);
}`

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
    const x = clamp((value - edge0) / (edge1 - edge0), 0, 1)
    return x * x * (3 - 2 * x)
}

function lerp(from: number, to: number, amount: number) {
    return from + (to - from) * amount
}

function colorToRgb(color: string): [number, number, number] {
    const value = color.trim()
    const short = /^#([a-f\d])([a-f\d])([a-f\d])$/i.exec(value)
    if (short) {
        return [
            parseInt(short[1] + short[1], 16) / 255,
            parseInt(short[2] + short[2], 16) / 255,
            parseInt(short[3] + short[3], 16) / 255,
        ]
    }
    const hex = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(value)
    if (hex) {
        return [
            parseInt(hex[1], 16) / 255,
            parseInt(hex[2], 16) / 255,
            parseInt(hex[3], 16) / 255,
        ]
    }
    const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(value)
    if (rgb) {
        return [
            clamp(Number(rgb[1]) / 255, 0, 1),
            clamp(Number(rgb[2]) / 255, 0, 1),
            clamp(Number(rgb[3]) / 255, 0, 1),
        ]
    }
    return [1, 1, 1]
}

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
    }
    return shader
}

function createProgram(gl: WebGLRenderingContext) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader)
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader)
    if (!vertex || !fragment) return null
    const program = gl.createProgram()
    if (!program) return null
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program)
        return null
    }
    return program
}

/**
 * An Awwwards-style hero component: fluid shader field, magnetic glyphs,
 * chromatic glow, and an optional custom cursor.
 */
export default function FluxType(rawProps: FluxTypeProps) {
    const content = { ...defaultContent, ...(rawProps.content || {}) }
    const interaction = {
        ...defaultInteraction,
        ...(rawProps.interaction || {}),
    }
    const shader = { ...defaultShader, ...(rawProps.shader || {}) }
    const surface = { ...defaultSurface, ...(rawProps.surface || {}) }
    const cursor = { ...defaultCursor, ...(rawProps.cursor || {}) }
    const blendMode = rawProps.blendMode || "difference"
    const isStaticRenderer = useIsStaticRenderer()

    const rootRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const cursorRef = React.useRef<HTMLDivElement>(null)
    const glyphRefs = React.useRef<Array<HTMLSpanElement | null>>([])
    const centersRef = React.useRef<Array<{ x: number; y: number }>>([])
    const motionRef = React.useRef<Array<GlyphMotion>>([])
    const visibleRef = React.useRef(true)
    const [prefersReducedMotion, setPrefersReducedMotion] =
        React.useState(false)
    const pointerRef = React.useRef<PointerState>({
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        active: 0,
        targetActive: 0,
        mouse: false,
    })

    const characters = React.useMemo(
        () => Array.from(content.text || " "),
        [content.text]
    )

    const measureGlyphs = React.useCallback(() => {
        const root = rootRef.current
        if (!root) return
        const rootRect = root.getBoundingClientRect()
        centersRef.current = glyphRefs.current.map((glyph) => {
            if (!glyph) return { x: rootRect.width / 2, y: rootRect.height / 2 }
            const rect = glyph.getBoundingClientRect()
            return {
                x: rect.left - rootRect.left + rect.width / 2,
                y: rect.top - rootRect.top + rect.height / 2,
            }
        })
        const pointer = pointerRef.current
        if (pointer.x === 0 && pointer.y === 0) {
            pointer.x = pointer.targetX = rootRect.width / 2
            pointer.y = pointer.targetY = rootRect.height / 2
        }
    }, [])

    React.useLayoutEffect(() => {
        glyphRefs.current.length = characters.length
        motionRef.current = characters.map(() => ({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
        }))
        measureGlyphs()
    }, [characters, content.font, content.maxWidth, measureGlyphs])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measureGlyphs)
        observer.observe(root)
        return () => observer.disconnect()
    }, [measureGlyphs])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") return
        const observer = new IntersectionObserver(
            ([entry]) => {
                visibleRef.current = entry.isIntersecting
            },
            { rootMargin: "120px" }
        )
        observer.observe(root)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => {
            setPrefersReducedMotion(query.matches)
        }
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [])

    React.useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root || !shader.enabled) return

        const gl = canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
            depth: false,
            powerPreference: "high-performance",
        })
        if (!gl) {
            canvas.style.display = "none"
            return
        }

        const program = createProgram(gl)
        if (!program) {
            canvas.style.display = "none"
            return
        }
        canvas.style.display = "block"
        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const position = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

        const uniforms = {
            resolution: gl.getUniformLocation(program, "u_resolution"),
            pointer: gl.getUniformLocation(program, "u_pointer"),
            time: gl.getUniformLocation(program, "u_time"),
            scale: gl.getUniformLocation(program, "u_scale"),
            grain: gl.getUniformLocation(program, "u_grain"),
            mode: gl.getUniformLocation(program, "u_mode"),
            colorA: gl.getUniformLocation(program, "u_colorA"),
            colorB: gl.getUniformLocation(program, "u_colorB"),
            colorC: gl.getUniformLocation(program, "u_colorC"),
        }
        const rgbA = colorToRgb(shader.colorA)
        const rgbB = colorToRgb(shader.colorB)
        const rgbC = colorToRgb(shader.colorC)

        let frame = 0
        let start = performance.now()
        const render = (now: number) => {
            if (!visibleRef.current && !isStaticRenderer) {
                frame = requestAnimationFrame(render)
                return
            }
            const rect = root.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
            const width = Math.max(1, Math.round(rect.width * dpr))
            const height = Math.max(1, Math.round(rect.height * dpr))
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
                gl.viewport(0, 0, width, height)
            }

            const pointer = pointerRef.current
            const safeWidth = Math.max(rect.width, 1)
            const safeHeight = Math.max(rect.height, 1)
            const elapsed =
                ((isStaticRenderer || prefersReducedMotion ? 0 : now - start) /
                    1000) *
                shader.speed

            gl.uniform2f(uniforms.resolution, width, height)
            gl.uniform2f(
                uniforms.pointer,
                clamp(pointer.x / safeWidth, 0, 1),
                1 - clamp(pointer.y / safeHeight, 0, 1)
            )
            gl.uniform1f(uniforms.time, elapsed)
            gl.uniform1f(uniforms.scale, shader.scale)
            gl.uniform1f(uniforms.grain, shader.grain)
            gl.uniform1f(
                uniforms.mode,
                shader.mode === "plasma" ? 1 : shader.mode === "mono" ? 2 : 0
            )
            gl.uniform3f(uniforms.colorA, rgbA[0], rgbA[1], rgbA[2])
            gl.uniform3f(uniforms.colorB, rgbB[0], rgbB[1], rgbB[2])
            gl.uniform3f(uniforms.colorC, rgbC[0], rgbC[1], rgbC[2])
            gl.drawArrays(gl.TRIANGLES, 0, 3)

            if (!isStaticRenderer && !prefersReducedMotion) {
                frame = requestAnimationFrame(render)
            }
        }
        render(performance.now())

        const onContextLost = (event: Event) => event.preventDefault()
        canvas.addEventListener("webglcontextlost", onContextLost)
        return () => {
            cancelAnimationFrame(frame)
            canvas.removeEventListener("webglcontextlost", onContextLost)
            if (buffer) gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
            start = 0
        }
    }, [
        isStaticRenderer,
        shader.colorA,
        shader.colorB,
        shader.colorC,
        shader.enabled,
        shader.grain,
        shader.mode,
        shader.scale,
        shader.speed,
        prefersReducedMotion,
    ])

    React.useEffect(() => {
        let frame = 0
        const animateGlyphs = (now: number) => {
            if (!visibleRef.current && !isStaticRenderer) {
                frame = requestAnimationFrame(animateGlyphs)
                return
            }
            const pointer = pointerRef.current
            const reduced = prefersReducedMotion || isStaticRenderer
            const smoothing = reduced ? 1 : 0.13
            pointer.x = lerp(pointer.x, pointer.targetX, smoothing)
            pointer.y = lerp(pointer.y, pointer.targetY, smoothing)
            pointer.active = lerp(
                pointer.active,
                reduced ? 0 : pointer.targetActive,
                smoothing
            )

            const time = (now / 1000) * interaction.speed
            const radius = Math.max(interaction.radius, 1)
            glyphRefs.current.forEach((glyph, index) => {
                if (!glyph) return
                const center = centersRef.current[index]
                if (!center) return

                const dx = pointer.x - center.x
                const dy = pointer.y - center.y
                const distance = Math.max(Math.hypot(dx, dy), 0.001)
                const proximity =
                    (1 - smoothstep(0, radius, distance)) * pointer.active
                const direction = interaction.effect === "repel" ? -1 : 1
                const wave =
                    interaction.idleMotion && !reduced
                        ? Math.sin(time * 2.2 + index * 0.54) *
                          interaction.idleAmount
                        : 0

                let targetX =
                    (dx / distance) *
                    proximity *
                    interaction.strength *
                    direction
                let targetY =
                    (dy / distance) *
                    proximity *
                    interaction.strength *
                    direction
                if (interaction.effect === "wave") {
                    targetX *= 0.32
                    targetY =
                        wave +
                        Math.sin(time * 3 + index * 0.42) *
                            proximity *
                            interaction.strength *
                            0.46
                } else {
                    targetY += wave
                }

                const targetRotate =
                    ((dx / radius) * proximity * 14 +
                        wave * (index % 2 ? -0.16 : 0.16)) *
                    direction
                const targetScale = 1 + proximity * interaction.lift * 0.01
                const motion =
                    motionRef.current[index] ||
                    (motionRef.current[index] = {
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                    })
                motion.x = lerp(motion.x, targetX, reduced ? 1 : 0.16)
                motion.y = lerp(motion.y, targetY, reduced ? 1 : 0.16)
                motion.rotate = lerp(
                    motion.rotate,
                    targetRotate,
                    reduced ? 1 : 0.13
                )
                motion.scale = lerp(
                    motion.scale,
                    targetScale,
                    reduced ? 1 : 0.13
                )
                glyph.style.transform = `translate3d(${motion.x.toFixed(
                    2
                )}px, ${motion.y.toFixed(2)}px, 0) rotate(${motion.rotate.toFixed(
                    2
                )}deg) scale(${motion.scale.toFixed(3)})`
            })

            const cursorElement = cursorRef.current
            if (cursorElement) {
                cursorElement.style.transform = `translate3d(${(
                    pointer.x -
                    cursor.size / 2
                ).toFixed(2)}px, ${(pointer.y - cursor.size / 2).toFixed(
                    2
                )}px, 0) scale(${(0.72 + pointer.active * 0.28).toFixed(3)})`
                cursorElement.style.opacity =
                    cursor.show && pointer.mouse && !reduced
                        ? String(pointer.active)
                        : "0"
            }

            if (!reduced) frame = requestAnimationFrame(animateGlyphs)
        }
        frame = requestAnimationFrame(animateGlyphs)
        return () => cancelAnimationFrame(frame)
    }, [
        cursor.show,
        cursor.size,
        interaction.effect,
        interaction.idleAmount,
        interaction.idleMotion,
        interaction.lift,
        interaction.radius,
        interaction.speed,
        interaction.strength,
        isStaticRenderer,
        prefersReducedMotion,
    ])

    const updatePointer = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isStaticRenderer) return
            const rect = event.currentTarget.getBoundingClientRect()
            const pointer = pointerRef.current
            pointer.targetX = event.clientX - rect.left
            pointer.targetY = event.clientY - rect.top
            pointer.targetActive = 1
            pointer.mouse = event.pointerType === "mouse"
        },
        [isStaticRenderer]
    )

    const leavePointer = React.useCallback(() => {
        const pointer = pointerRef.current
        pointer.targetActive = 0
        pointer.mouse = false
    }, [])

    const fallbackBackground = `radial-gradient(circle at 25% 20%, ${shader.colorA} 0%, transparent 42%), radial-gradient(circle at 78% 72%, ${shader.colorC} 0%, transparent 44%), ${shader.colorB}`
    const textShadow =
        surface.glow > 0
            ? `0 0 ${surface.glow}px ${shader.colorC}66, 0 0 ${Math.max(
                  8,
                  surface.glow * 0.45
              )}px ${shader.colorA}55`
            : "none"

    return (
        <div
            ref={rootRef}
            onPointerEnter={updatePointer}
            onPointerMove={updatePointer}
            onPointerLeave={leavePointer}
            aria-label={content.text}
            role="img"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 240,
                minHeight: 220,
                isolation: "isolate",
                overflow: "hidden",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent:
                    content.align === "left"
                        ? "flex-start"
                        : content.align === "right"
                          ? "flex-end"
                          : "center",
                padding: surface.padding,
                borderRadius: surface.radius,
                border: `${surface.borderWidth}px solid ${surface.borderColor}`,
                background: surface.background,
                perspective: 900,
                cursor: cursor.show && !isStaticRenderer ? "none" : "default",
                touchAction: "pan-y",
                ...rawProps.style,
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    background: shader.enabled
                        ? fallbackBackground
                        : surface.background,
                    opacity: shader.enabled ? 0.86 : 1,
                }}
            />
            {shader.enabled && (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            )}
            <div
                aria-hidden="true"
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    maxWidth: content.maxWidth,
                    textAlign: content.align,
                    color: content.color,
                    mixBlendMode: blendMode,
                    textShadow,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    transformStyle: "preserve-3d",
                    ...content.font,
                }}
            >
                {characters.map((character, index) =>
                    character === "\n" ? (
                        <br key={`br-${index}`} />
                    ) : (
                        <span
                            key={`${character}-${index}`}
                            ref={(element) => {
                                glyphRefs.current[index] = element
                            }}
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre",
                                transformOrigin: "50% 58%",
                                willChange: isStaticRenderer
                                    ? "auto"
                                    : "transform",
                                backfaceVisibility: "hidden",
                            }}
                        >
                            {character === " " ? "\u00A0" : character}
                        </span>
                    )
                )}
            </div>
            <div
                ref={cursorRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    zIndex: 3,
                    top: 0,
                    left: 0,
                    width: cursor.size,
                    height: cursor.size,
                    borderRadius: "50%",
                    border: `1px solid ${cursor.color}`,
                    background: `${cursor.color}14`,
                    boxShadow: `0 0 ${cursor.size * 0.72}px ${cursor.color}26`,
                    mixBlendMode: "difference",
                    pointerEvents: "none",
                    opacity: 0,
                    willChange: "transform, opacity",
                }}
            />
        </div>
    )
}

FluxType.defaultProps = {
    content: defaultContent,
    interaction: defaultInteraction,
    shader: defaultShader,
    surface: defaultSurface,
    cursor: defaultCursor,
    blendMode: "difference",
}

addPropertyControls(FluxType, {
    content: {
        type: ControlType.Object,
        title: "Typography",
        icon: "object",
        controls: {
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: defaultContent.text,
                displayTextArea: true,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                defaultFontType: "sans-serif",
                defaultValue: defaultContent.font,
                controls: "extended",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: defaultContent.color,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: defaultContent.align,
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                min: 240,
                max: 1600,
                step: 10,
                unit: "px",
                defaultValue: defaultContent.maxWidth,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["magnet", "repel", "wave"],
                optionTitles: ["Magnet", "Repel", "Wave"],
                displaySegmentedControl: true,
                defaultValue: defaultInteraction.effect,
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                min: 0,
                max: 140,
                step: 1,
                defaultValue: defaultInteraction.strength,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 40,
                max: 600,
                step: 10,
                unit: "px",
                defaultValue: defaultInteraction.radius,
            },
            lift: {
                type: ControlType.Number,
                title: "Lift",
                min: 0,
                max: 60,
                step: 1,
                unit: "%",
                defaultValue: defaultInteraction.lift,
            },
            idleMotion: {
                type: ControlType.Boolean,
                title: "Idle",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: defaultInteraction.idleMotion,
            },
            idleAmount: {
                type: ControlType.Number,
                title: "Drift",
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                defaultValue: defaultInteraction.idleAmount,
                hidden: (props: InteractionSettings) => !props.idleMotion,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.1,
                max: 3,
                step: 0.05,
                defaultValue: defaultInteraction.speed,
            },
        },
    },
    shader: {
        type: ControlType.Object,
        title: "Shader",
        icon: "effect",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: defaultShader.enabled,
            },
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["aurora", "plasma", "mono"],
                optionTitles: ["Aurora", "Plasma", "Mono"],
                displaySegmentedControl: true,
                defaultValue: defaultShader.mode,
            },
            colorA: {
                type: ControlType.Color,
                title: "Color A",
                defaultValue: defaultShader.colorA,
            },
            colorB: {
                type: ControlType.Color,
                title: "Color B",
                defaultValue: defaultShader.colorB,
            },
            colorC: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: defaultShader.colorC,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: defaultShader.speed,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.35,
                max: 3,
                step: 0.05,
                defaultValue: defaultShader.scale,
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: 0,
                max: 0.3,
                step: 0.01,
                defaultValue: defaultShader.grain,
            },
        },
    },
    surface: {
        type: ControlType.Object,
        title: "Surface",
        icon: "color",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: defaultSurface.background,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 160,
                step: 4,
                unit: "px",
                defaultValue: defaultSurface.padding,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 120,
                step: 2,
                unit: "px",
                defaultValue: defaultSurface.radius,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                min: 0,
                max: 8,
                step: 1,
                unit: "px",
                defaultValue: defaultSurface.borderWidth,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: defaultSurface.borderColor,
            },
            glow: {
                type: ControlType.Number,
                title: "Text Glow",
                min: 0,
                max: 120,
                step: 2,
                unit: "px",
                defaultValue: defaultSurface.glow,
            },
        },
    },
    cursor: {
        type: ControlType.Object,
        title: "Cursor",
        icon: "interaction",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                enabledTitle: "Yes",
                disabledTitle: "No",
                defaultValue: defaultCursor.show,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 20,
                max: 220,
                step: 2,
                unit: "px",
                defaultValue: defaultCursor.size,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: defaultCursor.color,
            },
        },
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Text Blend",
        options: ["normal", "difference", "screen", "overlay"],
        optionTitles: ["Normal", "Difference", "Screen", "Overlay"],
        defaultValue: "difference",
    },
})
