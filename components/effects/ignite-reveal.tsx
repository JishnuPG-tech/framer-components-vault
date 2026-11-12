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
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 560
 */

type ResponsiveImageValue =
    | string
    | { src?: string; srcSet?: string; alt?: string }
    | null
    | undefined

type TriggerMode = "hover" | "auto" | "manual"
type IgnitionMode =
    | "pointer"
    | "center"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "custom"

type IgniteRevealProps = {
    style?: React.CSSProperties
    image: ResponsiveImageValue
    trigger: TriggerMode
    active: boolean
    ignitionMode: IgnitionMode
    ignitionX: number
    ignitionY: number
    burnSpeed: number
    noiseScale: number
    noiseWeight: number
    glowWidth: number
    damageRange: number
    heatDistortion: number
    renderScale: number
    maxDpr: number
    pauseWhenOffscreen: boolean
    visibilityThreshold: number
}

type Resources = {
    simProgram: WebGLProgram | null
    vao: WebGLVertexArrayObject | null
    quadBuffer: WebGLBuffer | null
    imageTex: WebGLTexture | null
    uniforms: {
        image: WebGLUniformLocation | null
        progress: WebGLUniformLocation | null
        resolution: WebGLUniformLocation | null
        time: WebGLUniformLocation | null
        ignition: WebGLUniformLocation | null
        noiseScale: WebGLUniformLocation | null
        noiseWeight: WebGLUniformLocation | null
        glowWidth: WebGLUniformLocation | null
        damageRange: WebGLUniformLocation | null
        heatDistortion: WebGLUniformLocation | null
        imageAspect: WebGLUniformLocation | null
        canvasAspect: WebGLUniformLocation | null
    }
}

const DEFAULT_IMAGE_URL =
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"

const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 v_uv;

uniform sampler2D u_image;
uniform float u_progress;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_ignition;
uniform float u_noiseScale;
uniform float u_noiseWeight;
uniform float u_glowWidth;
uniform float u_damageRange;
uniform float u_heatDistortion;
uniform float u_imageAspect;
uniform float u_canvasAspect;

out vec4 outColor;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(st * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

vec2 coverUv(vec2 uv) {
    vec2 outUv = uv;
    if (u_imageAspect > u_canvasAspect) {
        float scale = u_canvasAspect / u_imageAspect;
        outUv.x = outUv.x * scale + (1.0 - scale) * 0.5;
    } else {
        float scale = u_imageAspect / u_canvasAspect;
        outUv.y = outUv.y * scale + (1.0 - scale) * 0.5;
    }
    return outUv;
}

void main() {
    vec4 baseColor = texture(u_image, coverUv(v_uv));

    vec2 aspectUV = v_uv;
    aspectUV.x *= u_resolution.x / u_resolution.y;

    float n = fbm(aspectUV * u_noiseScale);
    n = n * 0.5 + 0.5;

    vec2 aspectIgnition = u_ignition;
    aspectIgnition.x *= u_resolution.x / u_resolution.y;
    float distFromIgnition = distance(aspectUV, aspectIgnition);

    float structure = distFromIgnition + n * u_noiseWeight;

    float totalVisualAura = u_glowWidth + u_damageRange;
    float safeStart = -(totalVisualAura + 0.05);
    float maxDist = length(vec2(u_resolution.x / u_resolution.y, 1.0)) + u_noiseWeight;
    float safeEnd = maxDist + 0.1;
    float burnProgress = mix(safeStart, safeEnd, u_progress);

    if (structure < burnProgress) {
        discard;
    }

    float dist = structure - burnProgress;

    if (dist < u_glowWidth) {
        float t = dist / u_glowWidth;
        vec3 fire;
        if (t < 0.15) {
            fire = mix(vec3(0.01), vec3(0.1, 0.02, 0.01), t / 0.15);
        } else if (t < 0.5) {
            fire = mix(vec3(0.1, 0.02, 0.01), vec3(1.0, 0.4, 0.0), (t - 0.15) / 0.35);
        } else {
            fire = mix(vec3(1.0, 0.4, 0.0), vec3(0.0), clamp((t - 0.5) / 0.5, 0.0, 1.0));
        }
        outColor = vec4(fire, 1.0);
    } else {
        float damageDist = u_glowWidth + u_damageRange;

        if (dist < damageDist) {
            float heat = 1.0 - ((dist - u_glowWidth) / u_damageRange);
            vec2 offset = vec2(
                snoise(aspectUV * 20.0 + u_time * 5.0),
                snoise(aspectUV * 20.0 - u_time * 5.0)
            );
            vec2 heatUV = coverUv(v_uv + offset * u_heatDistortion * pow(heat, 3.0));
            vec3 damagedColor = texture(u_image, heatUV).rgb;

            float luminance = dot(damagedColor, vec3(0.299, 0.587, 0.114));
            vec3 finalDamagedColor;

            if (heat < 0.3) {
                float t = heat / 0.3;
                vec3 sepia = vec3(luminance) * vec3(1.2, 0.9, 0.5) * 0.9;
                finalDamagedColor = mix(damagedColor, sepia, t);
            } else if (heat < 0.8) {
                float t = (heat - 0.3) / 0.5;
                vec3 sepia = vec3(luminance) * vec3(1.2, 0.9, 0.5) * 0.9;
                vec3 heavyChar = vec3(luminance * 0.1);
                finalDamagedColor = mix(sepia, heavyChar, t);
            } else {
                float t = (heat - 0.8) / 0.2;
                vec3 heavyChar = vec3(luminance * 0.1);
                vec3 pitchBlack = vec3(0.0);
                finalDamagedColor = mix(heavyChar, pitchBlack, t);
            }

            outColor = vec4(finalDamagedColor, 1.0);
        } else {
            outColor = baseColor;
        }
    }
}
`

function createShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
            "[IgniteReveal] Shader compile failed:",
            gl.getShaderInfoLog(shader)
        )
        gl.deleteShader(shader)
        return null
    }
    return shader
}

function createProgram(
    gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string
): WebGLProgram | null {
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    if (!vs || !fs) return null

    const program = gl.createProgram()
    if (!program) return null
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(
            "[IgniteReveal] Program link failed:",
            gl.getProgramInfoLog(program)
        )
        gl.deleteProgram(program)
        return null
    }
    return program
}

function resolveImageUrl(value: ResponsiveImageValue): string {
    if (!value) return ""
    if (typeof value === "string") return value
    if (value.src) return value.src
    if (value.srcSet) {
        const first = value.srcSet.split(",")[0]?.trim()
        if (first) return first.split(/\s+/)[0] || ""
    }
    return ""
}

function resolveImageAlt(value: ResponsiveImageValue): string {
    if (!value || typeof value === "string") return "Ignite Reveal image"
    return value.alt || "Ignite Reveal image"
}

function getIgnitionFromMode(
    mode: IgnitionMode,
    customX: number,
    customY: number
): { x: number; y: number } {
    switch (mode) {
        case "left":
            return { x: 0.08, y: 0.5 }
        case "right":
            return { x: 0.92, y: 0.5 }
        case "top":
            return { x: 0.5, y: 0.92 }
        case "bottom":
            return { x: 0.5, y: 0.08 }
        case "custom":
            return {
                x: Math.min(1, Math.max(0, customX)),
                y: Math.min(1, Math.max(0, customY)),
            }
        case "center":
        default:
            return { x: 0.5, y: 0.5 }
    }
}

export function IgniteReveal(props: IgniteRevealProps) {
    const {
        style,
        image,
        trigger,
        active,
        ignitionMode,
        ignitionX,
        ignitionY,
        burnSpeed,
        noiseScale,
        noiseWeight,
        glowWidth,
        damageRange,
        heatDistortion,
        renderScale,
        maxDpr,
        pauseWhenOffscreen,
        visibilityThreshold,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const imageUrl = resolveImageUrl(image) || DEFAULT_IMAGE_URL
    const imageAlt = resolveImageAlt(image)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const glRef = React.useRef<WebGL2RenderingContext | null>(null)
    const resourcesRef = React.useRef<Resources | null>(null)
    const observerRef = React.useRef<IntersectionObserver | null>(null)
    const resizeObserverRef = React.useRef<ResizeObserver | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const imageRef = React.useRef<HTMLImageElement | null>(null)
    const sizeRef = React.useRef({ width: 0, height: 0 })
    const isVisibleRef = React.useRef(true)
    const currentProgressRef = React.useRef(0)
    const targetProgressRef = React.useRef(0)
    const ignitionRef = React.useRef({ x: 0.5, y: 0.5 })
    const startTimeRef = React.useRef(performance.now())

    React.useEffect(() => {
        const staticIgnition = getIgnitionFromMode(
            ignitionMode,
            ignitionX,
            ignitionY
        )
        if (ignitionMode !== "pointer") {
            ignitionRef.current = staticIgnition
        }
        if (trigger === "auto") targetProgressRef.current = 1
        if (trigger === "manual") targetProgressRef.current = active ? 1 : 0
        if (trigger === "hover" && ignitionMode !== "pointer") {
            ignitionRef.current = staticIgnition
        }
    }, [trigger, active, ignitionMode, ignitionX, ignitionY])

    React.useEffect(() => {
        if (isStaticRenderer) return
        const canvas = canvasRef.current
        if (!canvas) return

        const shouldAnimate = () => {
            if (!pauseWhenOffscreen) return !document.hidden
            return isVisibleRef.current && !document.hidden
        }

        const stopLoop = () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }

        const destroyResources = () => {
            const gl = glRef.current
            const res = resourcesRef.current
            if (gl && res) {
                if (res.imageTex) gl.deleteTexture(res.imageTex)
                if (res.quadBuffer) gl.deleteBuffer(res.quadBuffer)
                if (res.vao) gl.deleteVertexArray(res.vao)
                if (res.simProgram) gl.deleteProgram(res.simProgram)
            }
            resourcesRef.current = null
        }

        const initializeGpu = () => {
            const gl = glRef.current
            if (!gl) return false
            destroyResources()

            const simProgram = createProgram(
                gl,
                vertexShaderSource,
                fragmentShaderSource
            )
            if (!simProgram) return false
            const vao = gl.createVertexArray()
            const quadBuffer = gl.createBuffer()
            if (!vao || !quadBuffer) {
                gl.deleteProgram(simProgram)
                return false
            }

            gl.bindVertexArray(vao)
            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW
            )
            const positionLoc = gl.getAttribLocation(simProgram, "a_position")
            gl.enableVertexAttribArray(positionLoc)
            gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
            gl.bindVertexArray(null)

            resourcesRef.current = {
                simProgram,
                vao,
                quadBuffer,
                imageTex: null,
                uniforms: {
                    image: gl.getUniformLocation(simProgram, "u_image"),
                    progress: gl.getUniformLocation(simProgram, "u_progress"),
                    resolution: gl.getUniformLocation(
                        simProgram,
                        "u_resolution"
                    ),
                    time: gl.getUniformLocation(simProgram, "u_time"),
                    ignition: gl.getUniformLocation(simProgram, "u_ignition"),
                    noiseScale: gl.getUniformLocation(
                        simProgram,
                        "u_noiseScale"
                    ),
                    noiseWeight: gl.getUniformLocation(
                        simProgram,
                        "u_noiseWeight"
                    ),
                    glowWidth: gl.getUniformLocation(simProgram, "u_glowWidth"),
                    damageRange: gl.getUniformLocation(
                        simProgram,
                        "u_damageRange"
                    ),
                    heatDistortion: gl.getUniformLocation(
                        simProgram,
                        "u_heatDistortion"
                    ),
                    imageAspect: gl.getUniformLocation(
                        simProgram,
                        "u_imageAspect"
                    ),
                    canvasAspect: gl.getUniformLocation(
                        simProgram,
                        "u_canvasAspect"
                    ),
                },
            }
            return true
        }

        const updateImageTexture = () => {
            const gl = glRef.current
            const res = resourcesRef.current
            const imageNode = imageRef.current
            if (!gl || !res || !imageNode) return
            if (!res.imageTex) res.imageTex = gl.createTexture()
            if (!res.imageTex) return

            gl.bindTexture(gl.TEXTURE_2D, res.imageTex)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                imageNode
            )
            gl.bindTexture(gl.TEXTURE_2D, null)
        }

        const resizeCanvas = () => {
            const gl = glRef.current
            if (!gl) return
            const rect = canvas.getBoundingClientRect()
            const dpr =
                Math.max(1, Math.min(window.devicePixelRatio || 1, maxDpr)) *
                renderScale
            const width = Math.max(1, Math.floor(rect.width * dpr))
            const height = Math.max(1, Math.floor(rect.height * dpr))
            if (
                sizeRef.current.width === width &&
                sizeRef.current.height === height
            )
                return
            sizeRef.current = { width, height }
            canvas.width = width
            canvas.height = height
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`
        }

        const renderFrame = () => {
            const gl = glRef.current
            const res = resourcesRef.current
            const imageNode = imageRef.current
            if (!gl || !res || !imageNode || !res.imageTex) return
            if (!shouldAnimate()) return

            currentProgressRef.current +=
                (targetProgressRef.current - currentProgressRef.current) *
                Math.max(0.001, Math.min(0.3, burnSpeed))
            if (currentProgressRef.current < 0.001)
                currentProgressRef.current = 0

            gl.useProgram(res.simProgram)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.bindVertexArray(res.vao)
            gl.viewport(0, 0, sizeRef.current.width, sizeRef.current.height)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, res.imageTex)
            gl.uniform1i(res.uniforms.image, 0)

            gl.uniform1f(res.uniforms.progress, currentProgressRef.current)
            gl.uniform2f(
                res.uniforms.resolution,
                sizeRef.current.width,
                sizeRef.current.height
            )
            gl.uniform1f(
                res.uniforms.time,
                (performance.now() - startTimeRef.current) / 1000
            )
            gl.uniform2f(
                res.uniforms.ignition,
                ignitionRef.current.x,
                ignitionRef.current.y
            )
            gl.uniform1f(res.uniforms.noiseScale, noiseScale)
            gl.uniform1f(res.uniforms.noiseWeight, noiseWeight)
            gl.uniform1f(res.uniforms.glowWidth, glowWidth)
            gl.uniform1f(res.uniforms.damageRange, damageRange)
            gl.uniform1f(res.uniforms.heatDistortion, heatDistortion)
            gl.uniform1f(
                res.uniforms.imageAspect,
                imageNode.naturalWidth > 0 && imageNode.naturalHeight > 0
                    ? imageNode.naturalWidth / imageNode.naturalHeight
                    : 1
            )
            gl.uniform1f(
                res.uniforms.canvasAspect,
                sizeRef.current.width / Math.max(1, sizeRef.current.height)
            )
            gl.drawArrays(gl.TRIANGLES, 0, 6)
        }

        const loop = () => {
            renderFrame()
            const diff = Math.abs(
                targetProgressRef.current - currentProgressRef.current
            )
            const settled =
                diff < 0.0005 &&
                (currentProgressRef.current < 0.001 ||
                    currentProgressRef.current > 0.999)
            if (shouldAnimate() && !settled) {
                rafRef.current = requestAnimationFrame(loop)
            } else {
                rafRef.current = null
            }
        }

        const ensureLoop = () => {
            if (rafRef.current === null && shouldAnimate()) {
                rafRef.current = requestAnimationFrame(loop)
            }
        }

        const onPointerEnter = (event: PointerEvent) => {
            if (trigger !== "hover") return
            targetProgressRef.current = 1
            if (ignitionMode === "pointer") {
                const rect = canvas.getBoundingClientRect()
                ignitionRef.current = {
                    x: (event.clientX - rect.left) / rect.width,
                    y: 1 - (event.clientY - rect.top) / rect.height,
                }
            }
            ensureLoop()
        }

        const onPointerMove = (event: PointerEvent) => {
            if (ignitionMode !== "pointer") return
            if (trigger !== "hover" && trigger !== "manual") return
            const rect = canvas.getBoundingClientRect()
            ignitionRef.current = {
                x: (event.clientX - rect.left) / rect.width,
                y: 1 - (event.clientY - rect.top) / rect.height,
            }
        }

        const onPointerLeave = () => {
            if (trigger === "hover") {
                targetProgressRef.current = 0
                ensureLoop()
            }
        }

        const onVisibility = () => {
            if (document.hidden) {
                stopLoop()
            } else {
                ensureLoop()
            }
        }

        const onContextLost = (event: Event) => {
            event.preventDefault()
            stopLoop()
            resourcesRef.current = null
        }

        const onContextRestored = () => {
            const restored = canvas.getContext("webgl2", {
                premultipliedAlpha: false,
            })
            if (!restored) return
            glRef.current = restored
            restored.getExtension("EXT_color_buffer_float")
            restored.pixelStorei(restored.UNPACK_FLIP_Y_WEBGL, true)
            if (!initializeGpu()) return
            resizeCanvas()
            updateImageTexture()
            ensureLoop()
        }

        const gl = canvas.getContext("webgl2", { premultipliedAlpha: false })
        if (!gl) return
        glRef.current = gl
        gl.getExtension("EXT_color_buffer_float")
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        if (!initializeGpu()) return

        resizeObserverRef.current = new ResizeObserver(() => {
            resizeCanvas()
            ensureLoop()
        })
        resizeObserverRef.current.observe(canvas)

        if (pauseWhenOffscreen) {
            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    isVisibleRef.current = !!entry?.isIntersecting
                    if (isVisibleRef.current) ensureLoop()
                    else stopLoop()
                },
                { threshold: visibilityThreshold }
            )
            observerRef.current.observe(canvas)
        } else {
            isVisibleRef.current = true
        }

        document.addEventListener("visibilitychange", onVisibility)
        canvas.addEventListener("pointerenter", onPointerEnter)
        canvas.addEventListener("pointermove", onPointerMove)
        canvas.addEventListener("pointerleave", onPointerLeave)
        canvas.addEventListener("webglcontextlost", onContextLost, false)
        canvas.addEventListener(
            "webglcontextrestored",
            onContextRestored,
            false
        )

        resizeCanvas()

        const imageLoader = new Image()
        imageLoader.crossOrigin = "anonymous"
        imageLoader.decoding = "async"
        imageLoader.onload = () => {
            imageRef.current = imageLoader
            updateImageTexture()
            ensureLoop()
        }
        imageLoader.onerror = () => {
            imageRef.current = null
        }
        imageLoader.src = imageUrl

        // Prime ignition for non-pointer modes.
        if (ignitionMode !== "pointer") {
            ignitionRef.current = getIgnitionFromMode(
                ignitionMode,
                ignitionX,
                ignitionY
            )
        }
        if (trigger === "auto") targetProgressRef.current = 1
        if (trigger === "manual") targetProgressRef.current = active ? 1 : 0

        return () => {
            stopLoop()
            observerRef.current?.disconnect()
            resizeObserverRef.current?.disconnect()
            document.removeEventListener("visibilitychange", onVisibility)
            canvas.removeEventListener("pointerenter", onPointerEnter)
            canvas.removeEventListener("pointermove", onPointerMove)
            canvas.removeEventListener("pointerleave", onPointerLeave)
            canvas.removeEventListener("webglcontextlost", onContextLost, false)
            canvas.removeEventListener(
                "webglcontextrestored",
                onContextRestored,
                false
            )
            destroyResources()
            glRef.current = null
        }
    }, [
        isStaticRenderer,
        imageUrl,
        trigger,
        active,
        ignitionMode,
        ignitionX,
        ignitionY,
        burnSpeed,
        noiseScale,
        noiseWeight,
        glowWidth,
        damageRange,
        heatDistortion,
        renderScale,
        maxDpr,
        pauseWhenOffscreen,
        visibilityThreshold,
    ])

    if (isStaticRenderer) {
        return (
            <img
                src={imageUrl}
                alt={imageAlt}
                style={{ ...styles.staticImage, ...style }}
            />
        )
    }

    return <canvas ref={canvasRef} style={{ ...styles.canvas, ...style }} />
}

IgniteReveal.defaultProps = {
    image: { src: DEFAULT_IMAGE_URL },
    trigger: "hover",
    active: false,
    ignitionMode: "pointer",
    ignitionX: 0.5,
    ignitionY: 0.5,
    burnSpeed: 0.025,
    noiseScale: 3.5,
    noiseWeight: 0.4,
    glowWidth: 0.15,
    damageRange: 0.8,
    heatDistortion: 0.08,
    renderScale: 1,
    maxDpr: 2,
    pauseWhenOffscreen: true,
    visibilityThreshold: 0.1,
}

addPropertyControls(IgniteReveal, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        defaultValue: { src: DEFAULT_IMAGE_URL },
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "auto", "manual"],
        optionTitles: ["Hover", "Auto", "Manual"],
    },
    active: {
        type: ControlType.Boolean,
        title: "Active",
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.trigger !== "manual",
    },
    ignitionMode: {
        type: ControlType.Enum,
        title: "Ignition",
        options: [
            "pointer",
            "center",
            "left",
            "right",
            "top",
            "bottom",
            "custom",
        ],
        optionTitles: [
            "Pointer",
            "Center",
            "Left",
            "Right",
            "Top",
            "Bottom",
            "Custom",
        ],
    },
    ignitionX: {
        type: ControlType.Number,
        title: "Ignite X",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.ignitionMode !== "custom",
    },
    ignitionY: {
        type: ControlType.Number,
        title: "Ignite Y",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.ignitionMode !== "custom",
    },
    burnSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.005,
        max: 0.08,
        step: 0.001,
    },
    noiseScale: {
        type: ControlType.Number,
        title: "Noise Scale",
        min: 0.5,
        max: 8,
        step: 0.1,
    },
    noiseWeight: {
        type: ControlType.Number,
        title: "Noise Weight",
        min: 0,
        max: 1.2,
        step: 0.01,
    },
    glowWidth: {
        type: ControlType.Number,
        title: "Glow Width",
        min: 0.02,
        max: 0.6,
        step: 0.01,
    },
    damageRange: {
        type: ControlType.Number,
        title: "Damage",
        min: 0.05,
        max: 1.8,
        step: 0.01,
    },
    heatDistortion: {
        type: ControlType.Number,
        title: "Heat Warp",
        min: 0,
        max: 0.2,
        step: 0.005,
    },
    renderScale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.4,
        max: 1,
        step: 0.05,
    },
    maxDpr: {
        type: ControlType.Number,
        title: "Max DPR",
        min: 1,
        max: 3,
        step: 0.25,
    },
    pauseWhenOffscreen: {
        type: ControlType.Boolean,
        title: "Pause",
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    visibilityThreshold: {
        type: ControlType.Number,
        title: "Threshold",
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.pauseWhenOffscreen,
    },
})

const styles: Record<string, React.CSSProperties> = {
    canvas: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "block",
        overflow: "hidden",
        touchAction: "none",
        backgroundColor: "transparent",
    },
    staticImage: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
        backgroundColor: "transparent",
    },
}
