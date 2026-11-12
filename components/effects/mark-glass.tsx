// @framerDisableUnlink
import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const CREDIT =
    "[Explore more components](https://www.framer.com/%40builtbykern/)\n[Made in Framer](https://www.framer.com/?via=builtbykern)"

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragment = `#version 300 es
precision highp float;

uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uTime;
uniform float uWarpStrength;
uniform float uWarpScale;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uPointerStrength;
uniform float uRefraction;
uniform float uRipple;
uniform float uMotion;

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

vec4 sampleText(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0);
  }
  return texture(uTextTexture, uv);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float time = uTime * uSpeed;
  float scale = max(uWarpScale, 0.001);

  vec2 drift = vec2(time * 0.055, -time * 0.045);
  float n1 = fbm(uv * scale * 3.1 + drift);
  float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);
  vec2 ambient = (vec2(n1, n2) - 0.5) * uWarpStrength * 0.11 * uMotion;

  vec2 pointerDelta = uv - uPointer;
  vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);
  float dist = length(aspectDelta);
  float radius = max(uPointerInfluence, 0.001);
  float t = clamp(dist / radius, 0.0, 1.0);
  float lens = smoothstep(radius, 0.0, dist) * uPointerActive;
  float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;
  vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);

  float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;
  float rippleRing = (rippleWave - 0.5) * uRipple;
  vec2 pointerWarp = -dir * bulge * uPointerStrength * 0.045;
  pointerWarp += dir * rippleRing * bulge * uPointerStrength * 0.016;

  vec2 displaced = uv + ambient + pointerWarp;
  vec2 splitDir = ambient + pointerWarp;
  float splitLen = length(splitDir);
  splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);
  vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65);

  vec4 base = sampleText(displaced);
  float r = sampleText(displaced + split).r;
  float g = base.g;
  float b = sampleText(displaced - split).b;
  float a = max(max(sampleText(displaced + split).a, base.a), sampleText(displaced - split).a);

  vec3 color = vec3(r, g, b);
  fragColor = vec4(color, a);
}
`

interface GlassUniforms {
    uTextTexture: { value: { image: HTMLCanvasElement | null } }
    uResolution: { value: Float32Array }
    uPointer: { value: Float32Array }
    uPointerActive: { value: number }
    uTime: { value: number }
    uWarpStrength: { value: number }
    uWarpScale: { value: number }
    uSpeed: { value: number }
    uPointerInfluence: { value: number }
    uPointerStrength: { value: number }
    uRefraction: { value: number }
    uRipple: { value: number }
    uMotion: { value: number }
}

interface GlassPass {
    canvas: HTMLCanvasElement
    gl: WebGL2RenderingContext
    uniforms: GlassUniforms
    dpr: number
    setSize: (width: number, height: number) => void
    render: () => void
    remove: () => void
}

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) throw new Error("MarkGlass: shader could not be created.")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) || "MarkGlass: shader failed."
        gl.deleteShader(shader)
        throw new Error(log)
    }
    return shader
}

const createGlass = (canvas: HTMLCanvasElement): GlassPass => {
    const gl = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        depth: false,
        stencil: false,
    })
    if (!gl) throw new Error("MarkGlass: WebGL2 is unavailable.")

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertex)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragment)
    const program = gl.createProgram()
    if (!program) throw new Error("MarkGlass: program could not be created.")
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.bindAttribLocation(program, 0, "position")
    gl.bindAttribLocation(program, 1, "uv")
    gl.linkProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "MarkGlass: program failed to link.")
    }

    const buffer = gl.createBuffer()
    const texture = gl.createTexture()
    if (!buffer || !texture) throw new Error("MarkGlass: WebGL buffers could not be created.")
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 0, 3, -1, 2, 0, -1, 3, 0, 2]), gl.STATIC_DRAW)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const loc = {
        uTextTexture: gl.getUniformLocation(program, "uTextTexture"),
        uResolution: gl.getUniformLocation(program, "uResolution"),
        uPointer: gl.getUniformLocation(program, "uPointer"),
        uPointerActive: gl.getUniformLocation(program, "uPointerActive"),
        uTime: gl.getUniformLocation(program, "uTime"),
        uWarpStrength: gl.getUniformLocation(program, "uWarpStrength"),
        uWarpScale: gl.getUniformLocation(program, "uWarpScale"),
        uSpeed: gl.getUniformLocation(program, "uSpeed"),
        uPointerInfluence: gl.getUniformLocation(program, "uPointerInfluence"),
        uPointerStrength: gl.getUniformLocation(program, "uPointerStrength"),
        uRefraction: gl.getUniformLocation(program, "uRefraction"),
        uRipple: gl.getUniformLocation(program, "uRipple"),
        uMotion: gl.getUniformLocation(program, "uMotion"),
    }

    const uniforms: GlassUniforms = {
        uTextTexture: { value: { image: null } },
        uResolution: { value: new Float32Array([1, 1]) },
        uPointer: { value: new Float32Array([0.62, 0.4]) },
        uPointerActive: { value: 0 },
        uTime: { value: 0 },
        uWarpStrength: { value: 0.08 },
        uWarpScale: { value: 1.7 },
        uSpeed: { value: 0.55 },
        uPointerInfluence: { value: 0.42 },
        uPointerStrength: { value: 0.38 },
        uRefraction: { value: 0.018 },
        uRipple: { value: 1 },
        uMotion: { value: 1 },
    }

    let uploaded: HTMLCanvasElement | null = null
    const pass: GlassPass = {
        canvas,
        gl,
        uniforms,
        dpr: 1,
        setSize(width, height) {
            const nextWidth = Math.max(1, Math.floor(width * pass.dpr))
            const nextHeight = Math.max(1, Math.floor(height * pass.dpr))
            canvas.width = nextWidth
            canvas.height = nextHeight
            uniforms.uResolution.value[0] = nextWidth
            uniforms.uResolution.value[1] = nextHeight
        },
        render() {
            const image = uniforms.uTextTexture.value.image
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.useProgram(program)
            gl.disable(gl.DEPTH_TEST)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            if (image && image !== uploaded) {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
                uploaded = image
            }
            gl.uniform1i(loc.uTextTexture, 0)
            gl.uniform2fv(loc.uResolution, uniforms.uResolution.value)
            gl.uniform2fv(loc.uPointer, uniforms.uPointer.value)
            gl.uniform1f(loc.uPointerActive, uniforms.uPointerActive.value)
            gl.uniform1f(loc.uTime, uniforms.uTime.value)
            gl.uniform1f(loc.uWarpStrength, uniforms.uWarpStrength.value)
            gl.uniform1f(loc.uWarpScale, uniforms.uWarpScale.value)
            gl.uniform1f(loc.uSpeed, uniforms.uSpeed.value)
            gl.uniform1f(loc.uPointerInfluence, uniforms.uPointerInfluence.value)
            gl.uniform1f(loc.uPointerStrength, uniforms.uPointerStrength.value)
            gl.uniform1f(loc.uRefraction, uniforms.uRefraction.value)
            gl.uniform1f(loc.uRipple, uniforms.uRipple.value)
            gl.uniform1f(loc.uMotion, uniforms.uMotion.value)
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.enableVertexAttribArray(0)
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
            gl.enableVertexAttribArray(1)
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        },
        remove() {
            gl.deleteTexture(texture)
            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
        },
    }

    return pass
}

interface WarpFont {
    fontFamily?: string
    fontSize?: string | number | ReadonlyArray<string | number>
    fontWeight?: number | string
    fontStyle?: string
    letterSpacing?: string | number | ReadonlyArray<string | number>
    lineHeight?: string | number | ReadonlyArray<string | number>
    variant?: string
}

interface WarpGlass {
    warpStrength?: number
    warpScale?: number
    speed?: number
    pointerInfluence?: number
    pointerStrength?: number
    refraction?: number
    ripple?: boolean
}

interface MarkGlassProps {
    content?: { text?: string; font?: WarpFont }
    look?: { color?: string; field?: string; font?: WarpFont }
    motion?: WarpGlass
    glass?: WarpGlass
    style?: CSSProperties
}

interface RasterProps {
    text: string
    color: string
    field: string
    fontSize: string
    fontWeight: string | number
    fontStyle: string
    fontFamily: string
    letterSpacing: string
    lineHeight: string
    warpStrength: number
    warpScale: number
    speed: number
    pointerInfluence: number
    pointerStrength: number
    refraction: number
    ripple: boolean
}

const variantWeight: Record<string, number> = {
    Thin: 100,
    "Extra Light": 200,
    "Ultra Light": 200,
    Light: 300,
    Regular: 400,
    Normal: 400,
    Medium: 500,
    Semibold: 600,
    "Semi Bold": 600,
    Bold: 700,
    "Extra Bold": 800,
    Black: 900,
}

const defaultFont: WarpFont = {
    fontSize: "160px",
    variant: "Bold",
    letterSpacing: "-0.05em",
    lineHeight: "0.9em",
}

const cssFontSize = (value: WarpFont["fontSize"], fallback: string) => {
    if (typeof value === "number") return `${value}px`
    if (typeof value === "string" && value.trim()) return value
    if (Array.isArray(value) && value.length >= 2) return `${value[0]}${value[1]}`
    return fallback
}

const cssTracking = (value: WarpFont["letterSpacing"], fallback: string) => {
    if (typeof value === "number") return `${value}em`
    if (typeof value === "string" && value.trim()) return value
    if (Array.isArray(value) && value.length >= 2) return `${value[0]}${value[1]}`
    return fallback
}

const cssLineHeight = (value: WarpFont["lineHeight"], fallback: string) => {
    if (typeof value === "number") return String(value)
    if (typeof value === "string" && value.trim()) return value
    if (Array.isArray(value) && value.length >= 2) return `${value[0]}${value[1]}`
    return fallback
}

const plainText = (value: unknown, fallback: string) => {
    if (typeof value === "string") return value
    if (value && typeof value === "object" && "value" in value) {
        const inner = (value as { value?: unknown }).value
        if (typeof inner === "string") return inner
    }
    return fallback
}

const weightFromFont = (font: WarpFont) => {
    if (typeof font.fontWeight === "number") return font.fontWeight
    if (typeof font.fontWeight === "string" && font.fontWeight && font.fontWeight !== "normal") return font.fontWeight
    const variant = font.variant?.replace(/ Italic$/, "") ?? ""
    if (variant === "Italic") return 400
    return variantWeight[variant] ?? 700
}

const styleFromFont = (font: WarpFont) => {
    if (font.fontStyle === "italic") return "italic"
    if (font.variant?.includes("Italic")) return "italic"
    return "normal"
}

const flattenProps = (props: MarkGlassProps): RasterProps => {
    const font = props.content?.font ?? props.look?.font ?? defaultFont
    const motion = props.motion ?? props.glass ?? {}
    return {
        text: (() => {
            const line = plainText(props.content?.text, "BuiltByKern")
            return line.trim() ? line : "BuiltByKern"
        })(),
        color: typeof props.look?.color === "string" ? props.look.color : "#F4F3F0",
        field: typeof props.look?.field === "string" && props.look.field.trim() ? props.look.field : "#1C1B19",
        fontSize: cssFontSize(font.fontSize, "160px"),
        fontWeight: weightFromFont(font),
        fontStyle: styleFromFont(font),
        fontFamily: font.fontFamily || "inherit",
        letterSpacing: cssTracking(font.letterSpacing, "-0.05em"),
        lineHeight: cssLineHeight(font.lineHeight, "0.9em"),
        warpStrength: motion.warpStrength ?? 0.08,
        warpScale: motion.warpScale ?? 1.7,
        speed: motion.speed ?? 0.55,
        pointerInfluence: motion.pointerInfluence ?? 0.42,
        pointerStrength: motion.pointerStrength ?? 0.38,
        refraction: motion.refraction ?? 0.018,
        ripple: motion.ripple ?? true,
    }
}

const measureLine = (ctx: CanvasRenderingContext2D, line: string, letterSpacing: number) => {
    const chars = Array.from(line)
    const textWidth = chars.reduce((width, char) => width + ctx.measureText(char).width, 0)
    return textWidth + Math.max(0, chars.length - 1) * letterSpacing
}

const drawLine = (ctx: CanvasRenderingContext2D, line: string, x: number, y: number, letterSpacing: number) => {
    const chars = Array.from(line)
    let cursor = x - measureLine(ctx, line, letterSpacing) / 2

    chars.forEach((char, index) => {
        ctx.fillText(char, cursor, y)
        cursor += ctx.measureText(char).width + (index === chars.length - 1 ? 0 : letterSpacing)
    })
}

const lengthPx = (value: string, fontSizePx: number, unitlessScale: boolean) => {
    const amount = parseFloat(value)
    if (!Number.isFinite(amount)) return unitlessScale ? fontSizePx * 0.9 : 0
    if (value.endsWith("px")) return amount
    if (value.endsWith("em") || value.endsWith("rem") || unitlessScale) return amount * fontSizePx
    return amount
}

const buildTextCanvas = ({
    width,
    height,
    dpr,
    props,
    fontFamily,
}: {
    width: number
    height: number
    dpr: number
    props: RasterProps
    fontFamily: string
}) => {
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.floor(width * dpr))
    canvas.height = Math.max(1, Math.floor(height * dpr))

    const ctx = canvas.getContext("2d")
    if (!ctx) return canvas

    let fontSizePx = parseFloat(props.fontSize) || 160
    const fontWeight = String(props.fontWeight)
    const fontStyle = props.fontStyle
    let letterSpacing = lengthPx(props.letterSpacing, fontSizePx, false)
    let lineHeight = lengthPx(props.lineHeight, fontSizePx, true)

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillStyle = props.color
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    const lines = String(props.text || "").split("\n")
    const applyFont = () => {
        ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`
    }
    applyFont()

    const maxWidth = width * 0.86
    const maxHeight = height * 0.78
    const widest = Math.max(...lines.map((line) => measureLine(ctx, line, letterSpacing)), 1)
    const blockHeight = Math.max(lineHeight * lines.length, 1)
    const fit = Math.min(1, maxWidth / widest, maxHeight / blockHeight)

    if (fit < 1) {
        fontSizePx *= fit
        letterSpacing *= fit
        lineHeight *= fit
        applyFont()
    }

    const startY = height / 2 - (lineHeight * (lines.length - 1)) / 2
    lines.forEach((line, index) => drawLine(ctx, line, width / 2, startY + index * lineHeight, letterSpacing))

    return canvas
}

const syncUniforms = (uniforms: GlassUniforms, props: RasterProps) => {
    uniforms.uWarpStrength.value = props.warpStrength
    uniforms.uWarpScale.value = props.warpScale
    uniforms.uSpeed.value = props.speed
    uniforms.uPointerInfluence.value = props.pointerInfluence
    uniforms.uPointerStrength.value = props.pointerStrength
    uniforms.uRefraction.value = props.refraction
    uniforms.uRipple.value = props.ripple ? 1 : 0
}

/**
 * MarkGlass
 * A headline under glass. The bend holds still on the canvas and moves in preview.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 480
 */
export default function MarkGlass(props: MarkGlassProps) {
    const raster = flattenProps(props)
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(raster)
    const contextRef = useRef<{ uniforms?: GlassUniforms; rasterize: () => void } | null>(null)

    useEffect(() => {
        propsRef.current = raster
        if (contextRef.current) {
            if (contextRef.current.uniforms) syncUniforms(contextRef.current.uniforms, propsRef.current)
            contextRef.current.rasterize()
        }
    }, [
        raster.text,
        raster.color,
        raster.field,
        raster.fontSize,
        raster.fontWeight,
        raster.fontStyle,
        raster.fontFamily,
        raster.letterSpacing,
        raster.lineHeight,
        raster.warpStrength,
        raster.warpScale,
        raster.speed,
        raster.pointerInfluence,
        raster.pointerStrength,
        raster.refraction,
        raster.ripple,
    ])

    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas || typeof window === "undefined") return undefined

        let glass: GlassPass | undefined
        let resizeObserver: ResizeObserver | undefined
        let intersectionObserver: IntersectionObserver | undefined
        let raf = 0
        let disposed = false
        let contextLost = false
        let visible = true
        let pageVisible = !document.hidden
        let reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
        let rasterVersion = 0
        const staticRenderer = isStatic

        const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, activeTarget: 0 }
        const startTime = performance.now()

        let frozen = staticRenderer || reduceMotion
        const paintFlat = () => {
            const rect = container.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const current = propsRef.current
            const family =
                current.fontFamily === "inherit" ? window.getComputedStyle(container).fontFamily : current.fontFamily
            const bitmap = buildTextCanvas({
                width: rect.width,
                height: rect.height,
                dpr,
                props: current,
                fontFamily: family || "Inter, sans-serif",
            })
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            ctx.fillStyle = current.field
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(bitmap, 0, 0)
        }

        try {
            glass = createGlass(canvas)
        } catch (error) {
            console.warn("MarkGlass: WebGL could not be initialized.", error)
            paintFlat()
            const fallbackResize = new ResizeObserver(paintFlat)
            fallbackResize.observe(container)
            contextRef.current = { rasterize: paintFlat }
            return () => {
                disposed = true
                contextRef.current = null
                fallbackResize.disconnect()
            }
        }

        const holdStill = () => {
            if (!glass) return
            glass.uniforms.uMotion.value = 1
            glass.uniforms.uTime.value = 1.8
            glass.uniforms.uPointer.value[0] = 0.5
            glass.uniforms.uPointer.value[1] = 0.5
            glass.uniforms.uPointerActive.value = 0
        }
        if (frozen) holdStill()
        else glass.uniforms.uMotion.value = 1

        const renderOnce = () => {
            if (disposed || contextLost || !glass) return
            glass.render()
        }

        const rasterize = () => {
            const version = ++rasterVersion
            const draw = () => {
                if (disposed || contextLost || version !== rasterVersion || !glass) return
                const rect = container.getBoundingClientRect()
                if (rect.width <= 0 || rect.height <= 0) return

                const dpr = Math.min(window.devicePixelRatio || 1, 2)
                const family =
                    propsRef.current.fontFamily === "inherit"
                        ? window.getComputedStyle(container).fontFamily
                        : propsRef.current.fontFamily
                const textCanvas = buildTextCanvas({
                    width: rect.width,
                    height: rect.height,
                    dpr,
                    props: propsRef.current,
                    fontFamily: family || "Inter, sans-serif",
                })
                glass.uniforms.uTextTexture.value.image = textCanvas
                renderOnce()
            }

            if (document.fonts?.ready) {
                document.fonts.ready.then(draw).catch(draw)
                return
            }
            draw()
        }

        let lastWidth = 0
        let lastHeight = 0
        const resize = () => {
            if (disposed || contextLost || !glass) return
            const rect = container.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            if (rect.width === lastWidth && rect.height === lastHeight) return
            lastWidth = rect.width
            lastHeight = rect.height

            glass.dpr = Math.min(window.devicePixelRatio || 1, 2)
            glass.setSize(rect.width, rect.height)
            rasterize()
        }

        const placePointer = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            pointer.tx = (event.clientX - rect.left) / rect.width
            pointer.ty = 1 - (event.clientY - rect.top) / rect.height
            pointer.activeTarget = 1
        }

        const onPointerMove = (event: PointerEvent) => {
            placePointer(event)
        }

        const onPointerDown = (event: PointerEvent) => {
            placePointer(event)
        }

        const onPointerEnd = (event: PointerEvent) => {
            if (event.pointerType === "mouse") return
            pointer.activeTarget = 0
        }

        const onPointerLeave = () => {
            pointer.activeTarget = 0
        }

        const onContextLost = (event: Event) => {
            event.preventDefault()
            contextLost = true
            if (raf) cancelAnimationFrame(raf)
            raf = 0
        }

        const onVisibility = () => {
            pageVisible = !document.hidden
            if (frozen) return
            if (pageVisible && visible && !raf) raf = requestAnimationFrame(loop)
            if (!pageVisible && raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }

        const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)")
        const onReducedMotion = (event: MediaQueryListEvent) => {
            reduceMotion = event.matches
            frozen = staticRenderer || reduceMotion
            if (!glass) return
            if (frozen) {
                if (raf) cancelAnimationFrame(raf)
                raf = 0
                holdStill()
                renderOnce()
                return
            }
            glass.uniforms.uMotion.value = 1
            if (visible && pageVisible && !raf) raf = requestAnimationFrame(loop)
        }

        const loop = (now: number) => {
            if (disposed || contextLost || frozen || !glass) return

            const elapsed = (now - startTime) * 0.001
            const idleX = 0.5 + Math.sin(elapsed * 0.33) * 0.12
            const idleY = 0.5 + Math.cos(elapsed * 0.27) * 0.1
            const targetX = pointer.activeTarget > 0 ? pointer.tx : idleX
            const targetY = pointer.activeTarget > 0 ? pointer.ty : idleY
            const damping = pointer.activeTarget > 0 ? 0.12 : 0.035

            pointer.x += (targetX - pointer.x) * damping
            pointer.y += (targetY - pointer.y) * damping
            pointer.active += ((pointer.activeTarget > 0 ? 1 : 0.18) - pointer.active) * 0.06

            glass.uniforms.uPointer.value[0] = pointer.x
            glass.uniforms.uPointer.value[1] = pointer.y
            glass.uniforms.uPointerActive.value = reduceMotion ? pointer.active * 0.35 : pointer.active
            glass.uniforms.uTime.value = reduceMotion ? 0 : elapsed

            renderOnce()
            raf = requestAnimationFrame(loop)
        }

        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)

        intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting
                if (frozen) return
                if (visible && pageVisible && !raf) raf = requestAnimationFrame(loop)
                if (!visible && raf) {
                    cancelAnimationFrame(raf)
                    raf = 0
                }
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(container)

        if (!frozen) {
            canvas.addEventListener("pointerdown", onPointerDown)
            canvas.addEventListener("pointermove", onPointerMove)
            canvas.addEventListener("pointerup", onPointerEnd)
            canvas.addEventListener("pointercancel", onPointerEnd)
            canvas.addEventListener("pointerleave", onPointerLeave)
        }
        canvas.addEventListener("webglcontextlost", onContextLost, false)
        document.addEventListener("visibilitychange", onVisibility)
        mediaQuery?.addEventListener("change", onReducedMotion)

        syncUniforms(glass.uniforms, propsRef.current)
        contextRef.current = { uniforms: glass.uniforms, rasterize }
        resize()
        if (!frozen) raf = requestAnimationFrame(loop)

        return () => {
            disposed = true
            contextRef.current = null
            if (raf) cancelAnimationFrame(raf)
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            canvas.removeEventListener("pointerdown", onPointerDown)
            canvas.removeEventListener("pointermove", onPointerMove)
            canvas.removeEventListener("pointerup", onPointerEnd)
            canvas.removeEventListener("pointercancel", onPointerEnd)
            canvas.removeEventListener("pointerleave", onPointerLeave)
            canvas.removeEventListener("webglcontextlost", onContextLost)
            document.removeEventListener("visibilitychange", onVisibility)
            mediaQuery?.removeEventListener("change", onReducedMotion)

            if (!contextLost) {
                try {
                    glass?.remove()
                } catch (error) {
                    void error
                }
            }

        }
    }, [isStatic])

    const rootStyle: CSSProperties = {
        display: "block",
        width: "100%",
        height: "100%",
        minHeight: 220,
        overflow: "hidden",
        isolation: "isolate",
        borderRadius: "inherit",
        touchAction: "pan-y",
        ...props.style,
        position: "relative",
        backgroundColor: raster.field,
    }

    return (
        <div ref={containerRef} style={rootStyle} role="img" aria-label={raster.text}>
            <canvas
                ref={canvasRef}
                aria-hidden
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

MarkGlass.displayName = "MarkGlass"

addPropertyControls(MarkGlass, {
    content: {
        type: ControlType.Object,
        title: "Content",
        icon: "object",
        controls: {
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "BuiltByKern",
                displayTextArea: true,
                description: "The line.",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayTextAlignment: false,
                displayFontSize: true,
                defaultValue: {
                    fontSize: "160px",
                    variant: "Bold",
                    letterSpacing: "-0.05em",
                    lineHeight: "0.9em",
                },
                description: "Largest size. The line shrinks to fit the frame.",
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        icon: "color",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: "#F4F3F0",
                description: "The letters.",
            },
            field: {
                type: ControlType.Color,
                title: "Field",
                defaultValue: "#1C1B19",
                description: "The ground behind the letters.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "effect",
        controls: {
            warpStrength: {
                type: ControlType.Number,
                title: "Drift",
                defaultValue: 0.08,
                min: 0,
                max: 0.4,
                step: 0.01,
                description: "How far the letters drift at rest.",
            },
            warpScale: {
                type: ControlType.Number,
                title: "Cells",
                defaultValue: 1.7,
                min: 0.2,
                max: 4,
                step: 0.1,
                description: "Size of that drift.",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.55,
                min: 0,
                max: 2,
                step: 0.01,
                description: "How fast the drift moves.",
            },
            pointerInfluence: {
                type: ControlType.Number,
                title: "Lens",
                defaultValue: 0.42,
                min: 0.05,
                max: 1,
                step: 0.01,
                description: "How wide the cursor glass is.",
            },
            pointerStrength: {
                type: ControlType.Number,
                title: "Pull",
                defaultValue: 0.38,
                min: 0,
                max: 1,
                step: 0.01,
                description: "How hard the cursor pulls the letters.",
            },
            refraction: {
                type: ControlType.Number,
                title: "Fringe",
                defaultValue: 0.018,
                min: 0,
                max: 0.08,
                step: 0.001,
                description: "Color along the bent edge.",
            },
            ripple: {
                type: ControlType.Boolean,
                title: "Ripple",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "A soft ring in the cursor glass.",
            },
        },
        description: CREDIT,
    },
})
