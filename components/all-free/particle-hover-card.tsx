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
 * Portable WebGL 1 renderer for Particle Hover Card.
 *
 * `size` is the approximate grain diameter in CSS pixels. Every frame is a pure
 * function of progress and the seeded anchors: interrupted/reversed animations
 * retrace exactly. Images must be fully loaded; cross-origin sources must allow
 * anonymous texture uploads. This helper owns no animation or event listeners.
 */
type ParticleRenderOptions = {
    density: number
    size: number
    scatter: number
    direction: "left" | "right" | "up" | "down"
    colorMode: "image" | "custom"
    color: string
    fit: "cover" | "contain"
    positionX: number
    positionY: number
    seed: number
}

const PHC_SHADER_COMMON = `
uniform vec2 uFrame;
uniform vec2 uImageA;
uniform vec2 uImageB;
uniform vec2 uPosition;
uniform vec2 uDirection;
uniform float uFit;
uniform float uProgress;
uniform float uSeed;

float phcHash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
}

float phcNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(phcHash(i), phcHash(i + vec2(1.0, 0.0)), f.x),
        mix(phcHash(i + vec2(0.0, 1.0)), phcHash(i + vec2(1.0)), f.x),
        f.y
    );
}

// The base image and individual grains use this identical release front.
// Its range is [0.055, 0.830]; grain life ends no later than 0.990.
float phcRelease(vec2 uv) {
    float axis = dot(uv - 0.5, uDirection) + 0.5;
    vec2 offset = vec2(uSeed, uSeed * 0.731);
    float organic = 0.7 * phcNoise(uv * vec2(5.0, 6.0) + offset)
                  + 0.3 * phcNoise(uv * vec2(17.0, 21.0) + offset);
    return 0.055 + 0.680 * axis + 0.095 * organic;
}

// Texture UVs have their origin at bottom-left after UNPACK_FLIP_Y_WEBGL.
// Editor positionY uses the familiar top = 0%, bottom = 100% convention.
vec2 phcImageUV(vec2 uv, vec2 imageSize) {
    vec2 ratios = uFrame / imageSize;
    float scale = mix(max(ratios.x, ratios.y), min(ratios.x, ratios.y), uFit);
    vec2 box = imageSize * scale / uFrame;
    vec2 offset = (1.0 - box) * vec2(uPosition.x, 1.0 - uPosition.y);
    return (uv - offset) / box;
}

float phcInside(vec2 uv) {
    return step(0.0, uv.x) * step(uv.x, 1.0)
         * step(0.0, uv.y) * step(uv.y, 1.0);
}
`

const PHC_BASE_VERTEX = `
attribute vec2 aPosition;
varying mediump vec2 vUV;
void main() {
    vUV = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const PHC_BASE_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
${PHC_SHADER_COMMON}
uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
varying mediump vec2 vUV;

vec4 phcSampleImage(sampler2D imageTexture, vec2 imageSize) {
    vec2 uv = phcImageUV(vUV, imageSize);
    vec4 sampleColor = texture2D(imageTexture, clamp(uv, 0.0, 1.0));
    float alpha = sampleColor.a * phcInside(uv);
    return vec4(sampleColor.rgb * alpha, alpha);
}

void main() {
    float reveal = 0.0;
    if (uProgress >= 1.0) {
        reveal = 1.0;
    } else if (uProgress > 0.0) {
        float axis = dot(vUV - 0.5, uDirection) + 0.5;
        float earliestRelease = 0.055 + 0.680 * axis;
        // Organic noise stays in [0, 1]. The small guard also covers mediump
        // rounding; only the possible front needs the two noise evaluations.
        if (uProgress >= earliestRelease + 0.095 + 0.028 + 0.001) {
            reveal = 1.0;
        } else if (uProgress > earliestRelease - 0.001) {
            float release = phcRelease(vUV);
            reveal = smoothstep(release, release + 0.028, uProgress);
        }
    }

    // Most pixels need only one image sample. Keep contain and transparent
    // sources premultiplied in every branch, including the explicit endpoints.
    if (reveal <= 0.0) {
        gl_FragColor = phcSampleImage(uTextureA, uImageA);
    } else if (reveal >= 1.0) {
        gl_FragColor = phcSampleImage(uTextureB, uImageB);
    } else {
        gl_FragColor = mix(phcSampleImage(uTextureA, uImageA),
                           phcSampleImage(uTextureB, uImageB), reveal);
    }
}
`

const PHC_POINT_VERTEX = `
precision highp float;
${PHC_SHADER_COMMON}
attribute vec4 aParticle;
uniform float uScatter;
uniform float uPointSize;
uniform float uDPR;
uniform vec2 uPointRange;
varying mediump vec2 vImageUV;
varying mediump float vAlpha;
varying mediump float vPointSize;
varying mediump float vSpriteSize;

void main() {
    vec2 anchor = aParticle.xy;
    vec2 random = aParticle.zw;
    float release = phcRelease(anchor);
    float rawLife = (uProgress - release) / 0.160;
    float life = clamp(rawLife, 0.0, 1.0);

    float envelope = smoothstep(0.0, 0.110, life)
                   * (1.0 - smoothstep(0.340, 1.0, life));
    float grainVisible = step(0.0, rawLife) * step(rawLife, 1.0);
    vImageUV = phcImageUV(anchor, uImageA);
    vAlpha = envelope * grainVisible * phcInside(vImageUV) * 0.94;

    vec2 perpendicular = vec2(-uDirection.y, uDirection.x);
    float along = life * (0.38 + 0.98 * random.x);
    float across = (random.y - 0.5) * life * 0.86;
    across += 0.135 * sin(life * 4.084 + random.x * 6.283185)
                      * sin(life * 3.141593);
    // A small curl gives each grain a calm curved trajectory, with zero offset
    // at release. No time input is involved, so all motion is reversible.
    along += 0.045 * sin(life * 6.283185 + random.y * 6.283185)
                    * sin(life * 3.141593);
    vec2 displacement = (uDirection * along + perpendicular * across) * uScatter;
    vec2 position = anchor + displacement / uFrame;

    float diameter = uPointSize * mix(0.68, 1.30, random.x)
                   * (1.0 - 0.40 * smoothstep(0.40, 1.0, life));
    vPointSize = clamp(diameter * uDPR, uPointRange.x, uPointRange.y);
    // The filter may cover pixels outside the original grain. Reserve a full
    // device-pixel border on each side without enlarging the grain itself.
    vSpriteSize = min(vPointSize + 2.0, uPointRange.y);
    gl_PointSize = vSpriteSize;
    gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`

const PHC_POINT_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTextureA;
uniform float uCustomColor;
uniform vec4 uColor;
varying mediump vec2 vImageUV;
varying mediump float vAlpha;
varying mediump float vPointSize;
varying mediump float vSpriteSize;

float phcGrainCoverage(vec2 offsetPx) {
    float radiusPx = vPointSize * 0.5;
    float edgePx = clamp(1.5 / max(vPointSize, 1.0), 0.08, 0.8) * radiusPx;
    return 1.0 - smoothstep(radiusPx - edgePx, radiusPx, length(offsetPx));
}

void main() {
    if (vAlpha <= 0.0) discard;
    vec2 offsetPx = (gl_PointCoord - 0.5) * vSpriteSize;
    float filterOffset = min(0.25, (vSpriteSize - vPointSize) * 0.5);
    // Integrate the original circle over four subpixel samples. Its average
    // opacity and diameter stay the same as it crosses framebuffer pixels.
    // At the hardware point-size limit, reduce the filter to avoid clipping it.
    float coverage = 0.25 * (
        phcGrainCoverage(offsetPx + vec2(-filterOffset, -filterOffset)) +
        phcGrainCoverage(offsetPx + vec2( filterOffset, -filterOffset)) +
        phcGrainCoverage(offsetPx + vec2(-filterOffset,  filterOffset)) +
        phcGrainCoverage(offsetPx + vec2( filterOffset,  filterOffset)));
    if (coverage <= 0.0) discard;
    vec4 sampleColor = texture2D(uTextureA, clamp(vImageUV, 0.0, 1.0));
    vec3 color = mix(sampleColor.rgb, uColor.rgb, uCustomColor);
    float colorAlpha = mix(1.0, uColor.a, uCustomColor);
    float alpha = sampleColor.a * colorAlpha * vAlpha * coverage;
    gl_FragColor = vec4(color * alpha, alpha);
}
`

function createParticleRenderer(
    canvas: HTMLCanvasElement,
    imageA: HTMLImageElement,
    imageB: HTMLImageElement,
    options: ParticleRenderOptions
): { draw(progress: number, width: number, height: number, dpr: number): void; destroy(): void } | null {
    let gl: WebGLRenderingContext | null = null
    const buffers: WebGLBuffer[] = []
    const textures: WebGLTexture[] = []
    const programs: WebGLProgram[] = []
    let destroyed = false

    const cleanup = () => {
        if (destroyed) return
        destroyed = true
        if (!gl) return
        for (const buffer of buffers) gl.deleteBuffer(buffer)
        for (const texture of textures) gl.deleteTexture(texture)
        for (const program of programs) gl.deleteProgram(program)
    }

    try {
        if (!imageA.naturalWidth || !imageA.naturalHeight || !imageB.naturalWidth || !imageB.naturalHeight) return null
        gl = canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: "low-power",
        }) as WebGLRenderingContext | null
        if (!gl) return null
        const context = gl

        const compile = (type: number, source: string): WebGLShader | null => {
            const shader = context.createShader(type)
            if (!shader) return null
            context.shaderSource(shader, source)
            context.compileShader(shader)
            if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
                context.deleteShader(shader)
                return null
            }
            return shader
        }

        const makeProgram = (vertexSource: string, fragmentSource: string): WebGLProgram | null => {
            const vertex = compile(context.VERTEX_SHADER, vertexSource)
            if (!vertex) return null
            const fragment = compile(context.FRAGMENT_SHADER, fragmentSource)
            if (!fragment) {
                context.deleteShader(vertex)
                return null
            }
            const program = context.createProgram()
            if (!program) {
                context.deleteShader(vertex)
                context.deleteShader(fragment)
                return null
            }
            context.attachShader(program, vertex)
            context.attachShader(program, fragment)
            context.linkProgram(program)
            context.deleteShader(vertex)
            context.deleteShader(fragment)
            if (!context.getProgramParameter(program, context.LINK_STATUS)) {
                context.deleteProgram(program)
                return null
            }
            programs.push(program)
            return program
        }

        const baseProgram = makeProgram(PHC_BASE_VERTEX, PHC_BASE_FRAGMENT)
        const pointProgram = makeProgram(PHC_POINT_VERTEX, PHC_POINT_FRAGMENT)
        if (!baseProgram || !pointProgram) {
            cleanup()
            return null
        }

        const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback
        const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
        const density = Math.round(clamp(finite(options.density, 9000), 1500, 16000))
        const pointSize = clamp(finite(options.size, 1.8), 0.6, 4)
        const scatter = clamp(finite(options.scatter, 72), 0, 160)
        const positionX = clamp(finite(options.positionX, 50), 0, 100) / 100
        const positionY = clamp(finite(options.positionY, 50), 0, 100) / 100
        const seed = Math.floor(finite(options.seed, 1)) >>> 0
        let randomState = seed
        const random = () => {
            randomState = (randomState + 0x6D2B79F5) | 0
            let n = Math.imul(randomState ^ (randomState >>> 15), 1 | randomState)
            n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n
            return ((n ^ (n >>> 14)) >>> 0) / 4294967296
        }

        const anchors = new Float32Array(density * 4)
        for (let i = 0; i < anchors.length; i++) anchors[i] = random()
        const pointBuffer = context.createBuffer()
        const baseBuffer = context.createBuffer()
        if (pointBuffer) buffers.push(pointBuffer)
        if (baseBuffer) buffers.push(baseBuffer)
        if (!pointBuffer || !baseBuffer) {
            cleanup()
            return null
        }
        context.bindBuffer(context.ARRAY_BUFFER, pointBuffer)
        context.bufferData(context.ARRAY_BUFFER, anchors, context.STATIC_DRAW)
        context.bindBuffer(context.ARRAY_BUFFER, baseBuffer)
        context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), context.STATIC_DRAW)

        context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, 1)
        context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
        const makeTexture = (image: HTMLImageElement, unit: number): WebGLTexture | null => {
            const texture = context.createTexture()
            if (!texture) return null
            textures.push(texture)
            context.activeTexture(unit)
            context.bindTexture(context.TEXTURE_2D, texture)
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE)
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE)
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR)
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR)
            // May throw SecurityError for images that do not grant CORS access.
            context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image)
            return context.getError() === context.NO_ERROR ? texture : null
        }
        const textureA = makeTexture(imageA, context.TEXTURE0)
        const textureB = makeTexture(imageB, context.TEXTURE1)
        if (!textureA || !textureB) {
            cleanup()
            return null
        }

        let colorR = 1, colorG = 1, colorB = 1, colorA = 1
        if (options.colorMode === "custom") {
            // Let the browser parse all supported CSS color formats once.
            const swatch = document.createElement("canvas")
            swatch.width = swatch.height = 1
            const ink = swatch.getContext("2d", { willReadFrequently: true })
            if (ink) {
                ink.fillStyle = "#ffffff"
                ink.fillStyle = options.color || "#ffffff"
                ink.fillRect(0, 0, 1, 1)
                const rgba = ink.getImageData(0, 0, 1, 1).data
                colorR = rgba[0] / 255
                colorG = rgba[1] / 255
                colorB = rgba[2] / 255
                colorA = rgba[3] / 255
            }
        }

        const directionX = options.direction === "left" ? -1 : options.direction === "up" || options.direction === "down" ? 0 : 1
        const directionY = options.direction === "up" ? 1 : options.direction === "down" ? -1 : 0
        const pointRange = context.getParameter(context.ALIASED_POINT_SIZE_RANGE) as Float32Array
        const maxRenderbuffer = context.getParameter(context.MAX_RENDERBUFFER_SIZE) as number
        const baseAttribute = context.getAttribLocation(baseProgram, "aPosition")
        const pointAttribute = context.getAttribLocation(pointProgram, "aParticle")

        const setupProgram = (program: WebGLProgram) => {
            context.useProgram(program)
            const uniform = (name: string) => context.getUniformLocation(program, name)
            context.uniform2f(uniform("uImageA"), imageA.naturalWidth, imageA.naturalHeight)
            context.uniform2f(uniform("uImageB"), imageB.naturalWidth, imageB.naturalHeight)
            context.uniform2f(uniform("uPosition"), positionX, positionY)
            context.uniform2f(uniform("uDirection"), directionX, directionY)
            context.uniform1f(uniform("uFit"), options.fit === "contain" ? 1 : 0)
            context.uniform1f(uniform("uSeed"), (seed % 10007) * 0.0137)
            context.uniform1i(uniform("uTextureA"), 0)
            context.uniform1i(uniform("uTextureB"), 1)
            context.uniform1f(uniform("uScatter"), scatter)
            context.uniform1f(uniform("uPointSize"), pointSize)
            context.uniform2f(uniform("uPointRange"), pointRange[0], pointRange[1])
            context.uniform1f(uniform("uCustomColor"), options.colorMode === "custom" ? 1 : 0)
            context.uniform4f(uniform("uColor"), colorR, colorG, colorB, colorA)
            return {
                frame: uniform("uFrame"),
                progress: uniform("uProgress"),
                dpr: uniform("uDPR"),
            }
        }
        const baseUniforms = setupProgram(baseProgram)
        const pointUniforms = setupProgram(pointProgram)

        context.disable(context.DEPTH_TEST)
        context.disable(context.CULL_FACE)
        context.disable(context.SCISSOR_TEST)
        context.clearColor(0, 0, 0, 0)
        if (context.getError() !== context.NO_ERROR) {
            cleanup()
            return null
        }

        return {
            draw(progress: number, width: number, height: number, dpr: number) {
                if (destroyed || context.isContextLost() || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return
                const p = clamp(finite(progress, 0), 0, 1)
                const ratio = Math.min(Math.max(0.25, finite(dpr, 1)), maxRenderbuffer / width, maxRenderbuffer / height)
                const pixelWidth = Math.max(1, Math.round(width * ratio))
                const pixelHeight = Math.max(1, Math.round(height * ratio))
                if (canvas.width !== pixelWidth) canvas.width = pixelWidth
                if (canvas.height !== pixelHeight) canvas.height = pixelHeight
                context.viewport(0, 0, pixelWidth, pixelHeight)
                context.clear(context.COLOR_BUFFER_BIT)

                context.activeTexture(context.TEXTURE0)
                context.bindTexture(context.TEXTURE_2D, textureA)
                context.activeTexture(context.TEXTURE1)
                context.bindTexture(context.TEXTURE_2D, textureB)

                context.disable(context.BLEND)
                context.useProgram(baseProgram)
                context.uniform2f(baseUniforms.frame, width, height)
                context.uniform1f(baseUniforms.progress, p)
                context.bindBuffer(context.ARRAY_BUFFER, baseBuffer)
                context.enableVertexAttribArray(baseAttribute)
                context.vertexAttribPointer(baseAttribute, 2, context.FLOAT, false, 0, 0)
                context.drawArrays(context.TRIANGLE_STRIP, 0, 4)
                context.disableVertexAttribArray(baseAttribute)

                if (p > 0 && p < 1) {
                    context.enable(context.BLEND)
                    // Premultiplied blending preserves color over contain bars.
                    context.blendFunc(context.ONE, context.ONE_MINUS_SRC_ALPHA)
                    context.useProgram(pointProgram)
                    context.uniform2f(pointUniforms.frame, width, height)
                    context.uniform1f(pointUniforms.progress, p)
                    context.uniform1f(pointUniforms.dpr, ratio)
                    context.bindBuffer(context.ARRAY_BUFFER, pointBuffer)
                    context.enableVertexAttribArray(pointAttribute)
                    context.vertexAttribPointer(pointAttribute, 4, context.FLOAT, false, 0, 0)
                    context.drawArrays(context.POINTS, 0, density)
                    context.disableVertexAttribArray(pointAttribute)
                }
            },
            destroy: cleanup,
        }
    } catch {
        cleanup()
        return null
    }
}


type CardImage = { src: string; srcSet?: string; alt?: string }
type ContentSettings = { showTitle: boolean; title: string; hoverTitle: string; color: string; font: React.CSSProperties; description: string; descriptionColor: string; descriptionFont: React.CSSProperties; descriptionGap: number }
type AppearanceSettings = { radius: number; padding: number; background: string; overlay: number; shadow: string; fit: "cover" | "contain"; positionX: number; positionY: number }
type ParticleSettings = { density: number; size: number; scatter: number; direction: "left" | "right" | "up" | "down"; colorMode: "image" | "custom"; color: string; seed: number }
type MotionSettings = { duration: number; trigger: "hover" | "click" }
interface ParticleHoverCardProps {
    defaultImage?: CardImage
    hoverImage?: CardImage
    content?: Partial<ContentSettings>
    appearance?: Partial<AppearanceSettings>
    particles?: Partial<ParticleSettings>
    motion?: Partial<MotionSettings>
    link?: string
    newTab?: boolean
    transitionFrame?: number
    canvasState?: "default" | "hover" | "transition"
    style?: React.CSSProperties
}

const DEFAULT_IMAGE: CardImage = { src: "https://framerusercontent.com/images/SZ5rCNoSWQePyIuBcse9XzPclwk.jpg", alt: "Golden sand dunes under a blue evening sky" }
const HOVER_IMAGE: CardImage = { src: "https://framerusercontent.com/images/3p1hnfboMBEVNiQJbbetfPASMM.jpg", alt: "Warm sculpted desert dunes in soft light" }
const DEFAULT_CONTENT: ContentSettings = { showTitle: true, title: "Dunes", hoverTitle: "", color: "#FFFFFF", font: { fontFamily: '"Inter", sans-serif', fontSize: "26px", fontWeight: 500, letterSpacing: "-0.035em", lineHeight: "1.15em" }, description: "", descriptionColor: "rgba(255,255,255,0.85)", descriptionFont: { fontFamily: '"Inter", sans-serif', fontSize: "14px", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: "1.45em", textAlign: "left" }, descriptionGap: 8 }
const DEFAULT_APPEARANCE: AppearanceSettings = { radius: 24, padding: 28, background: "#181716", overlay: 0.5, shadow: "0px 16px 48px -16px rgba(28, 24, 19, 0.24), 0px 2px 6px 0px rgba(28, 24, 19, 0.06)", fit: "cover", positionX: 50, positionY: 50 }
const DEFAULT_PARTICLES: ParticleSettings = { density: 11000, size: 2.2, scatter: 92, direction: "right", colorMode: "image", color: "#F8D5A2", seed: 7 }
const DEFAULT_MOTION: MotionSettings = { duration: 1.5, trigger: "hover" }
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// A failed CORS request never prevents the regular image layer from rendering.
function loadParticleImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
            if (!img.naturalWidth) { reject(new Error("Empty image")); return }
            if (typeof img.decode === "function") img.decode().then(() => resolve(img), reject)
            else resolve(img)
        }
        img.onerror = () => reject(new Error("Image unavailable"))
        img.src = src
    })
}

// Keep one surface through a transition, including rapid direction reversals.
// A late-loading renderer may take over only at a matching endpoint or still frame.
function chooseParticleSurface(current: boolean, ready: boolean, progress: number, isStatic: boolean): boolean {
    return ready && (current || isStatic || progress === 0 || progress === 1)
}

function setParticleOpacity(element: HTMLElement | null, value: number) {
    if (!element) return
    const opacity = String(value)
    if (element.style.opacity !== opacity) element.style.opacity = opacity
}

/**
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 520
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function ParticleHoverCard(props: ParticleHoverCardProps) {
    const { defaultImage = DEFAULT_IMAGE, hoverImage = HOVER_IMAGE, link = "", newTab = false, canvasState = "default", transitionFrame = 50, style } = props
    const content = { ...DEFAULT_CONTENT, ...props.content }
    const appearance = { ...DEFAULT_APPEARANCE, ...props.appearance }
    const particles = { ...DEFAULT_PARTICLES, ...props.particles }
    const motion = { ...DEFAULT_MOTION, ...props.motion }
    const imageA = defaultImage?.src ? defaultImage : DEFAULT_IMAGE
    const imageB = hoverImage?.src ? hoverImage : imageA
    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const firstRef = React.useRef<HTMLImageElement>(null)
    const secondRef = React.useRef<HTMLImageElement>(null)
    const titleARef = React.useRef<HTMLSpanElement>(null)
    const titleBRef = React.useRef<HTMLSpanElement>(null)
    const rendererRef = React.useRef<ReturnType<typeof createParticleRenderer>>(null)
    const pendingRendererRef = React.useRef<(() => void) | null>(null)
    const canvasActiveRef = React.useRef(false)
    const dimensionsRef = React.useRef({ width: 0, height: 0, dpr: 1 })
    const progressRef = React.useRef(0)
    const targetRef = React.useRef(0)
    const rafRef = React.useRef(0)
    const timeRef = React.useRef(0)
    const visibleRef = React.useRef(true)
    const reducedRef = React.useRef(false)
    const pointerRef = React.useRef("mouse")
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [manual, setManual] = React.useState<boolean | null>(null)
    const [contextVersion, setContextVersion] = React.useState(0)
    const [imageAFailed, setImageAFailed] = React.useState(false)
    const [imageBFailed, setImageBFailed] = React.useState(false)
    const instanceId = React.useId().replace(/:/g, "")
    const className = `particle-card-${instanceId}`
    const hasLink = Boolean(link)
    const liveTarget = hasLink ? (hovered || focused) : motion.trigger === "click" ? Boolean(manual) : manual ?? (hovered || focused)
    const staticProgress = canvasState === "hover" ? 1 : canvasState === "transition" ? clamp01(transitionFrame / 100) : 0
    const displayedHover = isStatic ? staticProgress > 0.6 : liveTarget
    const configRef = React.useRef({ isStatic, staticProgress, duration: motion.duration, sameTitle: !content.hoverTitle || content.hoverTitle === content.title })
    configRef.current = { isStatic, staticProgress, duration: motion.duration, sameTitle: !content.hoverTitle || content.hoverTitle === content.title }

    const paint = React.useCallback((progress: number) => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return
        const p = clamp01(progress)
        const { width, height, dpr } = dimensionsRef.current
        const allowParticles = !reducedRef.current || configRef.current.isStatic
        if (pendingRendererRef.current && allowParticles && width > 0 && height > 0 && (p === 0 || p === 1 || configRef.current.isStatic)) {
            const initialize = pendingRendererRef.current
            pendingRendererRef.current = null
            initialize()
        }
        const renderer = rendererRef.current
        let useCanvas = chooseParticleSurface(canvasActiveRef.current, Boolean(renderer && allowParticles && width > 0 && height > 0), p, configRef.current.isStatic)
        if (useCanvas && renderer) {
            try { renderer.draw(p, width, height, dpr) }
            catch { renderer.destroy(); rendererRef.current = null; useCanvas = false }
        }
        canvasActiveRef.current = useCanvas
        setParticleOpacity(canvas, useCanvas ? 1 : 0)
        setParticleOpacity(firstRef.current, useCanvas ? 0 : 1 - p)
        setParticleOpacity(secondRef.current, useCanvas ? 0 : p)
        const sameTitle = configRef.current.sameTitle
        setParticleOpacity(titleARef.current, sameTitle ? 1 : 1 - clamp01((p - 0.18) / 0.22))
        setParticleOpacity(titleBRef.current, sameTitle ? 0 : clamp01((p - 0.58) / 0.22))
        const surface = useCanvas ? "particles" : "image"
        if (root.dataset.renderer !== surface) root.dataset.renderer = surface
    }, [])

    const stop = React.useCallback(() => {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
        timeRef.current = 0
    }, [])

    const start = React.useCallback(() => {
        if (rafRef.current || configRef.current.isStatic || !visibleRef.current || document.hidden) return
        // A display change can alter pixel density without changing CSS dimensions.
        dimensionsRef.current.dpr = Math.min(window.devicePixelRatio || 1, 2)
        if (progressRef.current === targetRef.current) { paint(progressRef.current); return }
        const tick = (now: number) => {
            rafRef.current = 0
            const elapsed = timeRef.current ? Math.min(48, now - timeRef.current) : 16.67
            timeRef.current = now
            const p = progressRef.current
            const target = targetRef.current
            const duration = reducedRef.current ? 160 : Math.max(0.25, configRef.current.duration) * 1000
            const step = elapsed / duration
            const next = target > p ? Math.min(target, p + step) : Math.max(target, p - step)
            progressRef.current = next
            paint(next)
            if (next !== target && visibleRef.current && !document.hidden) rafRef.current = requestAnimationFrame(tick)
            else timeRef.current = 0
        }
        rafRef.current = requestAnimationFrame(tick)
    }, [paint])

    React.useEffect(() => {
        if (isStatic) {
            stop()
            progressRef.current = staticProgress
            targetRef.current = staticProgress
            paint(staticProgress)
        } else { targetRef.current = liveTarget ? 1 : 0; start() }
    }, [isStatic, staticProgress, liveTarget, content.title, content.hoverTitle, hasLink, start, stop, paint])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const onResize = () => {
            dimensionsRef.current = { width: root.clientWidth, height: root.clientHeight, dpr: Math.min(window.devicePixelRatio || 1, 2) }
            paint(progressRef.current)
        }
        onResize()
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const onMotion = () => { reducedRef.current = media.matches; paint(progressRef.current) }
        onMotion()
        media.addEventListener("change", onMotion)
        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null
        resizeObserver?.observe(root)
        window.addEventListener("resize", onResize)
        const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => {
            visibleRef.current = entry.isIntersecting
            if (entry.isIntersecting) { paint(progressRef.current); start() } else stop()
        }, { rootMargin: "80px" }) : null
        observer?.observe(root)
        const onVisibility = () => document.hidden ? stop() : start()
        document.addEventListener("visibilitychange", onVisibility)
        return () => {
            stop(); resizeObserver?.disconnect(); observer?.disconnect()
            media.removeEventListener("change", onMotion)
            window.removeEventListener("resize", onResize)
            document.removeEventListener("visibilitychange", onVisibility)
        }
    }, [hasLink, paint, start, stop])

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        let cancelled = false
        pendingRendererRef.current = null
        canvasActiveRef.current = false
        rendererRef.current?.destroy()
        rendererRef.current = null
        setImageAFailed(false); setImageBFailed(false)
        paint(progressRef.current)
        Promise.all([loadParticleImage(imageA.src), loadParticleImage(imageB.src)]).then(([a, b]) => {
            if (cancelled) return
            // Decode above, then compile, upload, and warm the surface between transitions.
            pendingRendererRef.current = () => {
                if (cancelled) return
                rendererRef.current = createParticleRenderer(canvas, a, b, {
                    ...particles, fit: appearance.fit, positionX: appearance.positionX, positionY: appearance.positionY,
                })
            }
            paint(progressRef.current)
        }).catch(() => { if (!cancelled) paint(progressRef.current) })
        const lost = (event: Event) => { event.preventDefault(); rendererRef.current = null; paint(progressRef.current) }
        const restored = () => setContextVersion(v => v + 1)
        canvas.addEventListener("webglcontextlost", lost)
        canvas.addEventListener("webglcontextrestored", restored)
        return () => {
            cancelled = true
            pendingRendererRef.current = null
            canvasActiveRef.current = false
            canvas.removeEventListener("webglcontextlost", lost)
            canvas.removeEventListener("webglcontextrestored", restored)
            rendererRef.current?.destroy()
            rendererRef.current = null
        }
    }, [imageA.src, imageB.src, particles.density, particles.size, particles.scatter, particles.direction, particles.colorMode, particles.color, particles.seed, appearance.fit, appearance.positionX, appearance.positionY, contextVersion, hasLink, paint])

    const imageStyle: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: appearance.fit, objectPosition: `${appearance.positionX}% ${appearance.positionY}%`, pointerEvents: "none", userSelect: "none" }
    const title = content.title
    const hoverTitle = content.hoverTitle || title
    const effectiveImageA = imageAFailed ? DEFAULT_IMAGE : imageA
    const effectiveImageB = imageBFailed ? effectiveImageA : imageB
    const allowInteraction = !isStatic
    const description = content.description || ""
    const hasDescription = Boolean(description.trim())
    const descriptionId = `${className}-description`
    const Root: React.ElementType = hasLink ? "a" : "article"
    return (
        <Root
            ref={(node: HTMLElement | null) => { rootRef.current = node }}
            className={className}
            href={hasLink ? link : undefined}
            target={hasLink && newTab ? "_blank" : undefined}
            rel={hasLink && newTab ? "noopener noreferrer" : undefined}
            tabIndex={hasLink && isStatic ? -1 : undefined}
            aria-label={hasLink ? `Open ${title || "card"}${newTab ? " in a new tab" : ""}` : title || "Particle hover card"}
            aria-describedby={hasLink && hasDescription ? descriptionId : undefined}
            data-particle-card=""
            data-linked={hasLink ? "true" : "false"}
            data-state={displayedHover ? "hover" : "default"}
            onPointerEnter={(e: React.PointerEvent<HTMLElement>) => { pointerRef.current = e.pointerType; if (allowInteraction && e.pointerType === "mouse") { if (hasLink || motion.trigger === "hover") setManual(null); setHovered(true) } }}
            onPointerLeave={(e: React.PointerEvent<HTMLElement>) => { if (allowInteraction && e.pointerType === "mouse") { setHovered(false); if (hasLink || motion.trigger === "hover") setManual(null) } }}
            onPointerDownCapture={(e: React.PointerEvent<HTMLElement>) => { pointerRef.current = e.pointerType }}
            onFocusCapture={(e: React.FocusEvent<HTMLElement>) => { if (allowInteraction && e.target.matches(":focus-visible")) setFocused(true) }}
            onBlurCapture={(e: React.FocusEvent<HTMLElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setFocused(false); if (hasLink || (pointerRef.current === "mouse" && motion.trigger === "hover")) setManual(null) } }}
            onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => { if (e.key === "Escape" && allowInteraction) { setManual(false); setHovered(false); setFocused(false) } }}
            onClick={hasLink && isStatic ? (e: React.MouseEvent<HTMLElement>) => e.preventDefault() : undefined}
            style={{ width: "100%", height: "100%", ...style, display: "block", position: "relative", isolation: "isolate", overflow: "hidden", borderRadius: appearance.radius, background: appearance.background, boxShadow: appearance.shadow?.replace(/undefinedpx/g, "0px"), color: content.color, textDecoration: "none", cursor: hasLink ? "pointer" : undefined, touchAction: "manipulation", userSelect: "auto", WebkitTapHighlightColor: "transparent" }}
        >
            <style>{`
                .${className} .phc-hit:focus-visible { outline: 2px solid white; outline-offset: -7px; box-shadow: inset 0 0 0 9px rgba(0,0,0,.5); }
                .${className}[data-linked="true"]:focus-visible { outline: none; }
                .${className}[data-linked="true"]:focus-visible::after { content: ""; position: absolute; inset: 7px; border: 2px solid white; border-radius: ${Math.max(0, appearance.radius - 7)}px; box-shadow: 0 0 0 2px rgba(0,0,0,.65); pointer-events: none; z-index: 4; }
            `}</style>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, isolation: "isolate", pointerEvents: "none" }}>
                <img ref={firstRef} src={effectiveImageA.src} alt="" draggable={false} decoding="async" onError={() => setImageAFailed(true)} style={{ ...imageStyle, opacity: isStatic ? 1 - staticProgress : 1 }} />
                <img ref={secondRef} src={effectiveImageB.src} alt="" draggable={false} decoding="async" onError={() => setImageBFailed(true)} style={{ ...imageStyle, mixBlendMode: "plus-lighter", opacity: isStatic ? staticProgress : 0 }} />
            </div>
            <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none" }} />
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(180deg, transparent 48%, rgba(0,0,0,${appearance.overlay}) 100%)` }} />
            {!hasLink && <button
                type="button" className="phc-hit"
                aria-label={`Reveal alternate image${title ? `: ${title}` : ""}`}
                aria-pressed={displayedHover}
                aria-description={displayedHover ? imageB.alt : imageA.alt}
                aria-describedby={hasDescription ? descriptionId : undefined}
                tabIndex={isStatic ? -1 : 0}
                onClick={e => {
                    if (!allowInteraction) return
                    if (motion.trigger === "click" || pointerRef.current !== "mouse" || e.detail === 0) setManual(!liveTarget)
                }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", margin: 0, border: 0, padding: 0, borderRadius: "inherit", background: "transparent", appearance: "none", cursor: "pointer", touchAction: "manipulation", userSelect: "none", zIndex: 1 }}
            />}
            {(content.showTitle || hasDescription) && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", gap: content.showTitle && hasDescription ? content.descriptionGap : 0, padding: `min(${appearance.padding}px, 7%)`, pointerEvents: "none", zIndex: 2 }}>
                {content.showTitle && <div style={{ width: "100%", minWidth: 0, display: "grid", pointerEvents: "auto", ...content.font, color: content.color, overflowWrap: "anywhere", userSelect: "text", cursor: "text" }}>
                    <span ref={titleARef} aria-hidden={title !== hoverTitle && displayedHover} style={{ gridArea: "1 / 1", opacity: isStatic && title !== hoverTitle ? 1 - clamp01((staticProgress - .18) / .22) : 1, pointerEvents: title === hoverTitle || !displayedHover ? "auto" : "none" }}>{title}</span>
                    <span ref={titleBRef} aria-hidden={!displayedHover || title === hoverTitle} style={{ display: title === hoverTitle ? "none" : undefined, gridArea: "1 / 1", opacity: isStatic && title !== hoverTitle ? clamp01((staticProgress - .58) / .22) : 0, pointerEvents: displayedHover ? "auto" : "none" }}>{hoverTitle}</span>
                </div>}
                {hasDescription && <p id={descriptionId} style={{ width: "100%", minWidth: 0, margin: 0, pointerEvents: "auto", ...content.descriptionFont, color: content.descriptionColor, whiteSpace: "pre-wrap", overflowWrap: "anywhere", userSelect: "text", cursor: "text" }}>{description}</p>}
            </div>}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)", pointerEvents: "none", zIndex: 3 }} />
        </Root>
    )
}

addPropertyControls(ParticleHoverCard, {
    defaultImage: { type: ControlType.ResponsiveImage, title: "Default Image", description: "The image shown before interaction." },
    hoverImage: { type: ControlType.ResponsiveImage, title: "Hover Image", description: "The image revealed by the particle transition." },
    content: { type: ControlType.Object, title: "Content", controls: {
        showTitle: { type: ControlType.Boolean, title: "Show Title", defaultValue: true },
        title: { type: ControlType.String, title: "Default Title", defaultValue: "Dunes", hidden: p => !p.showTitle },
        hoverTitle: { type: ControlType.String, title: "Hover Title", defaultValue: "", hidden: p => !p.showTitle, description: "Leave empty to use the default title." },
        color: { type: ControlType.Color, title: "Text Color", defaultValue: "#FFFFFF" },
        font: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "26px", variant: "Medium", letterSpacing: "-0.035em", lineHeight: "1.15em", textAlign: "left" }, hidden: p => !p.showTitle },
        description: { type: ControlType.String, title: "Description", defaultValue: "", displayTextArea: true, description: "Optional text below the title. Leave empty to hide." },
        descriptionFont: { type: ControlType.Font, title: "Description Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "14px", variant: "Regular", letterSpacing: "-0.01em", lineHeight: "1.45em", textAlign: "left" }, hidden: p => !p.description?.trim() },
        descriptionColor: { type: ControlType.Color, title: "Description Color", defaultValue: "rgba(255,255,255,0.85)", hidden: p => !p.description?.trim() },
        descriptionGap: { type: ControlType.Number, title: "Description Gap", defaultValue: 8, min: 0, max: 32, step: 1, unit: "px", hidden: p => !p.showTitle || !p.description?.trim() },
    } },
    appearance: { type: ControlType.Object, title: "Appearance", controls: {
        radius: { type: ControlType.Number, title: "Radius", defaultValue: 24, min: 0, max: 80, unit: "px" },
        padding: { type: ControlType.Number, title: "Padding", defaultValue: 28, min: 12, max: 64, unit: "px" },
        background: { type: ControlType.Color, title: "Background", defaultValue: "#181716" },
        overlay: { type: ControlType.Number, title: "Image Shade", defaultValue: 0.5, min: 0, max: 0.9, step: 0.05 },
        shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEFAULT_APPEARANCE.shadow },
        fit: { type: ControlType.Enum, title: "Image Fit", options: ["cover", "contain"], optionTitles: ["Cover", "Contain"], defaultValue: "cover", displaySegmentedControl: true },
        positionX: { type: ControlType.Number, title: "Position X", defaultValue: 50, min: 0, max: 100, unit: "%" },
        positionY: { type: ControlType.Number, title: "Position Y", defaultValue: 50, min: 0, max: 100, unit: "%" },
    } },
    particles: { type: ControlType.Object, title: "Particles", controls: {
        density: { type: ControlType.Number, title: "Density", defaultValue: 11000, min: 1500, max: 16000, step: 500 },
        size: { type: ControlType.Number, title: "Size", defaultValue: 2.2, min: 0.6, max: 4, step: 0.05, unit: "px" },
        scatter: { type: ControlType.Number, title: "Scatter", defaultValue: 92, min: 0, max: 160, step: 1, unit: "px" },
        direction: { type: ControlType.Enum, title: "Direction", options: ["right", "left", "up", "down"], optionTitles: ["To Right", "To Left", "Upward", "Downward"], defaultValue: "right" },
        colorMode: { type: ControlType.Enum, title: "Color", options: ["image", "custom"], optionTitles: ["From Image", "Custom"], defaultValue: "image", displaySegmentedControl: true },
        color: { type: ControlType.Color, title: "Tint", defaultValue: "#F8D5A2", hidden: p => p.colorMode !== "custom" },
        seed: { type: ControlType.Number, title: "Pattern", defaultValue: 7, min: 1, max: 100, step: 1, description: "Changes the grain arrangement without changing the effect." },
    } },
    motion: { type: ControlType.Object, title: "Interaction", controls: {
        duration: { type: ControlType.Number, title: "Duration", defaultValue: 1.5, min: 0.4, max: 4, step: 0.1, unit: "s" },
        trigger: { type: ControlType.Enum, title: "Trigger", options: ["hover", "click"], optionTitles: ["Hover", "Click"], defaultValue: "hover", description: "Applies when Link is empty; touch taps toggle the image. Linked cards reveal on hover or keyboard focus and open their destination on click or tap. Reduced motion uses a gentle fade." },
    } },
    link: { type: ControlType.Link, title: "Link", defaultValue: "", description: "Optional destination for the entire card. Click or tap opens the link; hover and keyboard focus reveal the alternate image. Leave empty to use the card as an image toggle." },
    newTab: { type: ControlType.Boolean, title: "Open in New Tab", defaultValue: false },
    transitionFrame: { type: ControlType.Number, title: "Transition Frame", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%", hidden: p => p.canvasState !== "transition", description: "Inspect any still frame of the effect in Canvas." },
    canvasState: { type: ControlType.Enum, title: "Canvas State", options: ["default", "hover", "transition"], optionTitles: ["Default", "Hover", "Transition"], defaultValue: "default", description: "Choose the still frame shown in Canvas. Preview starts at Default.\n\nBuilt by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)" },
})
