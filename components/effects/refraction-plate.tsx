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


type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type Palette = {
    background: string
    colorA: string
    colorB: string
    colorC: string
    foreground: string
    accent: string
    line: string
}

type ShaderSettings = {
    distortion: number
    frequency: number
    refraction: number
    chromatic: number
    pointerRadius: number
    pointerStrength: number
}

type MotionSettings = {
    enabled: boolean
    speed: number
    follow: number
    fps: 30 | 60
    staticPhase: number
}

type TextureSettings = {
    fit: "cover" | "contain"
    grain: number
    vignette: number
    overlay: number
    quality: "eco" | "balanced" | "high"
}

type LayoutSettings = {
    padding: number
    radius: number
    compactAt: number
}

type ChromeSettings = {
    show: boolean
    eyebrow: string
    title: string
    label: string
    index: string
}

export interface RefractionPlateProps {
    image?: ResponsiveImage
    palette?: Palette
    shader?: ShaderSettings
    motion?: MotionSettings
    texture?: TextureSettings
    layout?: LayoutSettings
    chrome?: ChromeSettings
    displayFont?: React.CSSProperties
    metaFont?: React.CSSProperties
    decorative?: boolean
    ariaLabel?: string
    style?: React.CSSProperties
}

const defaults: RefractionPlateProps = {
    palette: {
        background: "#090B12",
        colorA: "#FF5638",
        colorB: "#7252FF",
        colorC: "#CFFF4D",
        foreground: "#F5F2EA",
        accent: "#DFFF5F",
        line: "rgba(245, 242, 234, 0.24)",
    },
    shader: {
        distortion: 38,
        frequency: 44,
        refraction: 34,
        chromatic: 18,
        pointerRadius: 32,
        pointerStrength: 48,
    },
    motion: {
        enabled: true,
        speed: 34,
        follow: 14,
        fps: 60,
        staticPhase: 42,
    },
    texture: {
        fit: "cover",
        grain: 16,
        vignette: 42,
        overlay: 8,
        quality: "balanced",
    },
    layout: {
        padding: 26,
        radius: 30,
        compactAt: 600,
    },
    chrome: {
        show: true,
        eyebrow: "REFRACTION ENGINE / 06",
        title: "BEND THE\nVISIBLE",
        label: "LIVE OPTICS",
        index: "RP—01",
    },
    displayFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 600,
    },
    metaFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 600,
    },
    decorative: true,
    ariaLabel: "Animated refractive image effect",
}

type Point = { x: number; y: number }
type Renderer = {
    draw: (time: number) => void
    dispose: () => void
}

function clamp(value: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value))
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [])
    return reduced
}

function useViewportActivity(ref: React.RefObject<HTMLElement>) {
    const [inViewport, setInViewport] = React.useState(false)
    const [pageVisible, setPageVisible] = React.useState(false)

    React.useEffect(() => {
        const node = ref.current
        if (!node) return
        if (typeof IntersectionObserver === "undefined") {
            setInViewport(true)
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => setInViewport(entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [ref])

    React.useEffect(() => {
        if (typeof document === "undefined") return
        const update = () => setPageVisible(!document.hidden)
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])

    return inViewport && pageVisible
}

function cssColorToRgb(color: string): [number, number, number] {
    if (typeof document === "undefined") return [1, 1, 1]
    const context = document.createElement("canvas").getContext("2d")
    if (!context) return [1, 1, 1]
    context.fillStyle = "#ffffff"
    context.fillStyle = color
    const normalized = context.fillStyle
    const hex = normalized.match(/^#([\da-f]{6})$/i)
    if (hex) {
        const value = Number.parseInt(hex[1], 16)
        return [
            ((value >> 16) & 255) / 255,
            ((value >> 8) & 255) / 255,
            (value & 255) / 255,
        ]
    }
    const rgb = normalized.match(
        /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i
    )
    if (rgb)
        return [
            Number(rgb[1]) / 255,
            Number(rgb[2]) / 255,
            Number(rgb[3]) / 255,
        ]
    const p3 = normalized.match(
        /color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i
    )
    if (p3)
        return [
            clamp(Number(p3[1])),
            clamp(Number(p3[2])),
            clamp(Number(p3[3])),
        ]
    return [1, 1, 1]
}

const vertexShader = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`

const fragmentShader = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform vec2 u_textureSize;
    uniform float u_time;
    uniform float u_distortion;
    uniform float u_frequency;
    uniform float u_refraction;
    uniform float u_chromatic;
    uniform float u_pointerRadius;
    uniform float u_pointerStrength;
    uniform float u_grain;
    uniform float u_vignette;
    uniform float u_overlay;
    uniform float u_hasTexture;
    uniform float u_fit;
    uniform sampler2D u_texture;
    uniform vec3 u_background;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    uniform vec3 u_colorC;

    float hash(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
    }

    vec2 imageUv(vec2 uv, out float inside) {
        float viewAspect = u_resolution.x / max(1.0, u_resolution.y);
        float textureAspect = u_textureSize.x / max(1.0, u_textureSize.y);
        vec2 mapped = uv;
        if (u_fit < 0.5) {
            if (viewAspect > textureAspect) mapped.y = (uv.y - 0.5) * textureAspect / viewAspect + 0.5;
            else mapped.x = (uv.x - 0.5) * viewAspect / textureAspect + 0.5;
        } else {
            if (viewAspect > textureAspect) mapped.x = (uv.x - 0.5) * viewAspect / textureAspect + 0.5;
            else mapped.y = (uv.y - 0.5) * textureAspect / viewAspect + 0.5;
        }
        inside = step(0.0, mapped.x) * step(mapped.x, 1.0) * step(0.0, mapped.y) * step(mapped.y, 1.0);
        return mapped;
    }

    vec3 procedural(vec2 uv) {
        float sweep = smoothstep(-0.15, 0.95, uv.x + uv.y * 0.34);
        vec3 color = mix(u_colorA, u_colorB, sweep);
        float bloom = smoothstep(0.58, 0.0, distance(uv, vec2(0.73, 0.36)));
        color = mix(color, u_colorC, bloom * 0.9);
        float fold = sin((uv.x * 0.72 + uv.y) * 8.0 - u_time * 0.36) * 0.5 + 0.5;
        return mix(color, u_background, fold * 0.18);
    }

    vec3 imageColor(vec2 uv, vec2 displacement) {
        float insideR;
        float insideG;
        float insideB;
        vec2 redUv = imageUv(uv + displacement * (1.0 + u_chromatic), insideR);
        vec2 greenUv = imageUv(uv + displacement, insideG);
        vec2 blueUv = imageUv(uv + displacement * (1.0 - u_chromatic), insideB);
        float red = texture2D(u_texture, redUv).r * insideR;
        float green = texture2D(u_texture, greenUv).g * insideG;
        float blue = texture2D(u_texture, blueUv).b * insideB;
        float coverage = max(insideR, max(insideG, insideB));
        return mix(u_background, vec3(red, green, blue), coverage);
    }

    void main() {
        vec2 uv = v_uv;
        vec2 aspectUv = vec2(uv.x * u_resolution.x / max(1.0, u_resolution.y), uv.y);
        vec2 aspectPointer = vec2(u_pointer.x * u_resolution.x / max(1.0, u_resolution.y), u_pointer.y);
        float distanceToPointer = distance(aspectUv, aspectPointer);
        float lens = smoothstep(u_pointerRadius, 0.0, distanceToPointer);
        vec2 direction = normalize(aspectUv - aspectPointer + vec2(0.0001));
        direction.x *= u_resolution.y / max(1.0, u_resolution.x);

        float waveA = sin(uv.y * u_frequency + u_time * 1.15 + sin(uv.x * 7.0)) ;
        float waveB = cos(uv.x * u_frequency * 0.72 - u_time * 0.83 + uv.y * 5.0);
        vec2 flow = vec2(waveA, waveB) * u_distortion;
        vec2 displacement = flow + direction * lens * u_pointerStrength * u_refraction;

        vec3 color = u_hasTexture > 0.5
            ? imageColor(uv, displacement)
            : procedural(uv + displacement * 1.8);
        color = mix(color, u_colorC, lens * u_overlay);
        float grain = hash(gl_FragCoord.xy + floor(u_time * 24.0)) - 0.5;
        color += grain * u_grain;
        float vignette = smoothstep(0.92, 0.24, distance(uv, vec2(0.5)));
        color *= mix(1.0 - u_vignette, 1.0, vignette);
        gl_FragColor = vec4(color, 1.0);
    }
`

/**
 * A visibility-aware WebGL image refraction surface with a CSS fallback.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1180
 * @framerIntrinsicHeight 760
 */
type ResolvedProps = Omit<Required<RefractionPlateProps>, "image" | "style"> &
    Pick<RefractionPlateProps, "image" | "style">

export default function RefractionPlate(rawProps: RefractionPlateProps = {}) {
    const props = {
        ...defaults,
        ...rawProps,
        palette: { ...defaults.palette, ...rawProps.palette },
        shader: { ...defaults.shader, ...rawProps.shader },
        motion: { ...defaults.motion, ...rawProps.motion },
        texture: { ...defaults.texture, ...rawProps.texture },
        layout: { ...defaults.layout, ...rawProps.layout },
        chrome: { ...defaults.chrome, ...rawProps.chrome },
    } as ResolvedProps
    const {
        image,
        palette,
        shader,
        motion,
        texture,
        layout,
        chrome,
        displayFont,
        metaFont,
        decorative,
        ariaLabel,
        style,
    } = props
    const rootRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rendererRef = React.useRef<Renderer | null>(null)
    const frameRef = React.useRef<number | null>(null)
    const pointerRef = React.useRef<Point>({ x: 0.68, y: 0.42 })
    const pointerTargetRef = React.useRef<Point>({ x: 0.68, y: 0.42 })
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const viewportActive = useViewportActivity(rootRef)

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
            depth: false,
            powerPreference: "high-performance",
        })
        if (!gl) return

        const compile = (type: number, source: string) => {
            const shaderObject = gl.createShader(type)
            if (!shaderObject) return null
            gl.shaderSource(shaderObject, source)
            gl.compileShader(shaderObject)
            if (!gl.getShaderParameter(shaderObject, gl.COMPILE_STATUS)) {
                gl.deleteShader(shaderObject)
                return null
            }
            return shaderObject
        }
        const vertex = compile(gl.VERTEX_SHADER, vertexShader)
        const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader)
        if (!vertex || !fragment) return
        const program = gl.createProgram()
        if (!program) return
        gl.attachShader(program, vertex)
        gl.attachShader(program, fragment)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        )
        const position = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

        const uniform = (name: string) => gl.getUniformLocation(program, name)
        const uniforms = {
            resolution: uniform("u_resolution"),
            pointer: uniform("u_pointer"),
            textureSize: uniform("u_textureSize"),
            time: uniform("u_time"),
            distortion: uniform("u_distortion"),
            frequency: uniform("u_frequency"),
            refraction: uniform("u_refraction"),
            chromatic: uniform("u_chromatic"),
            pointerRadius: uniform("u_pointerRadius"),
            pointerStrength: uniform("u_pointerStrength"),
            grain: uniform("u_grain"),
            vignette: uniform("u_vignette"),
            overlay: uniform("u_overlay"),
            hasTexture: uniform("u_hasTexture"),
            fit: uniform("u_fit"),
            background: uniform("u_background"),
            colorA: uniform("u_colorA"),
            colorB: uniform("u_colorB"),
            colorC: uniform("u_colorC"),
        }
        const glTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, glTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 255])
        )

        const qualityDpr =
            texture.quality === "eco" ? 1 : texture.quality === "high" ? 2 : 1.5
        let textureWidth = 1
        let textureHeight = 1
        let hasTexture = false
        let disposed = false

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, qualityDpr)
            const width = Math.max(1, Math.round(rect.width * dpr))
            const height = Math.max(1, Math.round(rect.height * dpr))
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
                gl.viewport(0, 0, width, height)
            }
        }

        const setColor = (
            location: WebGLUniformLocation | null,
            color: string
        ) => {
            const [r, g, b] = cssColorToRgb(color)
            gl.uniform3f(location, r, g, b)
        }

        const draw = (time: number) => {
            if (disposed || gl.isContextLost()) return
            resize()
            gl.useProgram(program)
            gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
            gl.uniform2f(
                uniforms.pointer,
                pointerRef.current.x,
                1 - pointerRef.current.y
            )
            gl.uniform2f(uniforms.textureSize, textureWidth, textureHeight)
            gl.uniform1f(uniforms.time, time)
            gl.uniform1f(uniforms.distortion, (shader.distortion / 100) * 0.018)
            gl.uniform1f(uniforms.frequency, 5 + (shader.frequency / 100) * 28)
            gl.uniform1f(uniforms.refraction, shader.refraction / 100)
            gl.uniform1f(uniforms.chromatic, (shader.chromatic / 100) * 0.7)
            gl.uniform1f(
                uniforms.pointerRadius,
                0.05 + (shader.pointerRadius / 100) * 0.45
            )
            gl.uniform1f(
                uniforms.pointerStrength,
                (shader.pointerStrength / 100) * 0.055
            )
            gl.uniform1f(uniforms.grain, (texture.grain / 100) * 0.16)
            gl.uniform1f(uniforms.vignette, (texture.vignette / 100) * 0.72)
            gl.uniform1f(uniforms.overlay, texture.overlay / 100)
            gl.uniform1f(uniforms.hasTexture, hasTexture ? 1 : 0)
            gl.uniform1f(uniforms.fit, texture.fit === "contain" ? 1 : 0)
            setColor(uniforms.background, palette.background)
            setColor(uniforms.colorA, palette.colorA)
            setColor(uniforms.colorB, palette.colorB)
            setColor(uniforms.colorC, palette.colorC)
            gl.drawArrays(gl.TRIANGLES, 0, 6)
            canvas.style.opacity = "1"
        }

        const observer = new ResizeObserver(() =>
            draw((motion.staticPhase / 100) * Math.PI * 2)
        )
        observer.observe(canvas)

        if (image?.src) {
            const source = new Image()
            source.crossOrigin = "anonymous"
            if (image.srcSet) source.srcset = image.srcSet
            source.onload = () => {
                if (disposed) return
                textureWidth = source.naturalWidth || 1
                textureHeight = source.naturalHeight || 1
                gl.bindTexture(gl.TEXTURE_2D, glTexture)
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    source
                )
                hasTexture = true
                draw((motion.staticPhase / 100) * Math.PI * 2)
            }
            source.onerror = () =>
                draw((motion.staticPhase / 100) * Math.PI * 2)
            source.src = image.src
        }

        const renderer: Renderer = {
            draw,
            dispose: () => {
                disposed = true
                observer.disconnect()
                gl.deleteTexture(glTexture)
                gl.deleteBuffer(buffer)
                gl.deleteProgram(program)
                gl.deleteShader(vertex)
                gl.deleteShader(fragment)
            },
        }
        rendererRef.current = renderer
        draw((motion.staticPhase / 100) * Math.PI * 2)
        return () => {
            renderer.dispose()
            rendererRef.current = null
        }
    }, [
        image?.src,
        image?.srcSet,
        layout.radius,
        motion.staticPhase,
        palette.background,
        palette.colorA,
        palette.colorB,
        palette.colorC,
        shader.chromatic,
        shader.distortion,
        shader.frequency,
        shader.pointerRadius,
        shader.pointerStrength,
        shader.refraction,
        texture.fit,
        texture.grain,
        texture.overlay,
        texture.quality,
        texture.vignette,
    ])

    React.useEffect(() => {
        const shouldAnimate =
            motion.enabled &&
            !staticRenderer &&
            !reducedMotion &&
            viewportActive
        if (!shouldAnimate || !rendererRef.current) return
        const start = performance.now()
        const interval = 1000 / motion.fps
        let lastFrame = 0
        const tick = (now: number) => {
            if (now - lastFrame >= interval) {
                lastFrame = now
                const follow = clamp(motion.follow / 100, 0.02, 0.5)
                pointerRef.current.x +=
                    (pointerTargetRef.current.x - pointerRef.current.x) * follow
                pointerRef.current.y +=
                    (pointerTargetRef.current.y - pointerRef.current.y) * follow
                rendererRef.current?.draw(
                    (((now - start) / 1000) * motion.speed) / 35
                )
            }
            frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [
        motion.enabled,
        motion.follow,
        motion.fps,
        motion.speed,
        reducedMotion,
        staticRenderer,
        viewportActive,
    ])

    const onPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (staticRenderer || reducedMotion) return
            const rect = event.currentTarget.getBoundingClientRect()
            pointerTargetRef.current = {
                x: clamp((event.clientX - rect.left) / Math.max(1, rect.width)),
                y: clamp((event.clientY - rect.top) / Math.max(1, rect.height)),
            }
        },
        [reducedMotion, staticRenderer]
    )

    const onKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            const step = event.shiftKey ? 0.1 : 0.04
            const point = pointerTargetRef.current
            let next: Point | null = null
            if (event.key === "ArrowLeft")
                next = { x: point.x - step, y: point.y }
            if (event.key === "ArrowRight")
                next = { x: point.x + step, y: point.y }
            if (event.key === "ArrowUp")
                next = { x: point.x, y: point.y - step }
            if (event.key === "ArrowDown")
                next = { x: point.x, y: point.y + step }
            if (event.key === "Home") next = { x: 0.5, y: 0.5 }
            if (!next) return
            event.preventDefault()
            pointerTargetRef.current = { x: clamp(next.x), y: clamp(next.y) }
            pointerRef.current = pointerTargetRef.current
            rendererRef.current?.draw((motion.staticPhase / 100) * Math.PI * 2)
        },
        [motion.staticPhase]
    )

    const fallback = `
        radial-gradient(circle at 72% 36%, color-mix(in srgb, ${palette.colorC} 92%, transparent), transparent 30%),
        radial-gradient(circle at 28% 68%, color-mix(in srgb, ${palette.colorA} 82%, transparent), transparent 42%),
        linear-gradient(128deg, ${palette.colorB}, ${palette.background})
    `
    const css = `
        .refraction-root, .refraction-root * { box-sizing: border-box; }
        .refraction-root { container-type: size; position: relative; width: 100%; height: 100%; min-width: 240px; min-height: 280px; overflow: hidden; isolation: isolate; border-radius: ${layout.radius}px; color: ${palette.foreground}; background: ${fallback}; }
        .refraction-canvas { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 180ms ease; }
        .refraction-grain { position: absolute; inset: 0; z-index: 5; pointer-events: none; opacity: .12; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.88' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.36'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; }
        .refraction-frame { position: absolute; inset: ${layout.padding}px; z-index: 4; border: 1px solid ${palette.line}; border-radius: max(0px, ${layout.radius - layout.padding / 2}px); pointer-events: none; }
        .refraction-head, .refraction-foot { position: absolute; z-index: 6; left: ${layout.padding}px; right: ${layout.padding}px; display: flex; justify-content: space-between; gap: 20px; pointer-events: none; }
        .refraction-head { top: ${layout.padding}px; align-items: center; padding: 15px 16px 0; }
        .refraction-foot { bottom: ${layout.padding}px; align-items: flex-end; padding: 0 16px 15px; }
        .refraction-meta { font-size: clamp(9px, 1cqw, 13px); line-height: 1; letter-spacing: .14em; text-transform: uppercase; text-shadow: 0 1px 16px rgba(0,0,0,.34); }
        .refraction-title { max-width: 72%; white-space: pre-line; font-size: clamp(58px, 11.2cqw, 146px); line-height: .78; letter-spacing: -.07em; text-transform: uppercase; text-shadow: 0 3px 28px rgba(0,0,0,.16); }
        .refraction-status { display: flex; align-items: center; gap: 9px; padding: 10px 12px; border-radius: 999px; color: ${palette.background}; background: ${palette.accent}; }
        .refraction-status::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
        .refraction-root:focus-visible { outline: 3px solid ${palette.accent}; outline-offset: 4px; }
        @container (max-width: ${layout.compactAt}px) {
            .refraction-frame { inset: ${Math.max(16, layout.padding * 0.7)}px; }
            .refraction-head, .refraction-foot { left: ${Math.max(16, layout.padding * 0.7)}px; right: ${Math.max(16, layout.padding * 0.7)}px; }
            .refraction-head { top: ${Math.max(16, layout.padding * 0.7)}px; }
            .refraction-foot { bottom: ${Math.max(16, layout.padding * 0.7)}px; }
            .refraction-title { max-width: 94%; font-size: clamp(64px, 20cqw, 112px); }
            .refraction-label { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .refraction-canvas { transition: none; } }
    `

    return (
        <div
            ref={rootRef}
            className="refraction-root"
            style={{ ...style, ...displayFont }}
            role={decorative ? undefined : "img"}
            aria-hidden={decorative ? true : undefined}
            aria-label={decorative ? undefined : ariaLabel}
            tabIndex={decorative ? undefined : 0}
            onPointerMove={onPointerMove}
            onKeyDown={onKeyDown}
        >
            <style>{css}</style>
            <canvas
                ref={canvasRef}
                className="refraction-canvas"
                aria-hidden="true"
            />
            <div className="refraction-grain" />
            {chrome.show ? (
                <>
                    <div className="refraction-frame" />
                    <header
                        className="refraction-head refraction-meta"
                        style={metaFont}
                    >
                        <span>{chrome.eyebrow}</span>
                        <span>{chrome.index}</span>
                    </header>
                    <footer className="refraction-foot">
                        <div className="refraction-title">{chrome.title}</div>
                        <div
                            className="refraction-status refraction-meta"
                            style={metaFont}
                        >
                            <span className="refraction-label">
                                {chrome.label}
                            </span>
                        </div>
                    </footer>
                </>
            ) : null}
        </div>
    )
}

addPropertyControls(RefractionPlate, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    palette: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: { type: ControlType.Color, defaultValue: "#090B12" },
            colorA: { type: ControlType.Color, defaultValue: "#FF5638" },
            colorB: { type: ControlType.Color, defaultValue: "#7252FF" },
            colorC: { type: ControlType.Color, defaultValue: "#CFFF4D" },
            foreground: { type: ControlType.Color, defaultValue: "#F5F2EA" },
            accent: { type: ControlType.Color, defaultValue: "#DFFF5F" },
            line: {
                type: ControlType.Color,
                defaultValue: "rgba(245, 242, 234, 0.24)",
            },
        },
    },
    shader: {
        type: ControlType.Object,
        title: "Refraction",
        controls: {
            distortion: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 38,
            },
            frequency: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 44,
            },
            refraction: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 34,
            },
            chromatic: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 18,
            },
            pointerRadius: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 32,
            },
            pointerStrength: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 48,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            enabled: { type: ControlType.Boolean, defaultValue: true },
            speed: {
                type: ControlType.Number,
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 34,
            },
            follow: {
                type: ControlType.Number,
                min: 2,
                max: 50,
                step: 1,
                unit: "%",
                defaultValue: 14,
            },
            fps: {
                type: ControlType.Enum,
                options: [30, 60],
                optionTitles: ["30 FPS", "60 FPS"],
                defaultValue: 60,
                displaySegmentedControl: true,
            },
            staticPhase: {
                type: ControlType.Number,
                title: "Canvas Frame",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 42,
            },
        },
    },
    texture: {
        type: ControlType.Object,
        title: "Texture",
        controls: {
            fit: {
                type: ControlType.Enum,
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                defaultValue: "cover",
                displaySegmentedControl: true,
            },
            grain: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 16,
            },
            vignette: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 42,
            },
            overlay: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 8,
            },
            quality: {
                type: ControlType.Enum,
                options: ["eco", "balanced", "high"],
                optionTitles: ["Eco", "Balanced", "High"],
                defaultValue: "balanced",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            padding: {
                type: ControlType.Number,
                min: 10,
                max: 90,
                step: 1,
                unit: "px",
                defaultValue: 26,
            },
            radius: {
                type: ControlType.Number,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 30,
            },
            compactAt: {
                type: ControlType.Number,
                min: 320,
                max: 900,
                step: 10,
                unit: "px",
                defaultValue: 600,
            },
        },
    },
    chrome: {
        type: ControlType.Object,
        title: "Chrome",
        controls: {
            show: { type: ControlType.Boolean, defaultValue: true },
            eyebrow: {
                type: ControlType.String,
                defaultValue: "REFRACTION ENGINE / 06",
            },
            title: {
                type: ControlType.String,
                displayTextArea: true,
                defaultValue: "BEND THE\nVISIBLE",
            },
            label: { type: ControlType.String, defaultValue: "LIVE OPTICS" },
            index: { type: ControlType.String, defaultValue: "RP—01" },
        },
    },
    displayFont: {
        type: ControlType.Font,
        title: "Display Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    decorative: {
        type: ControlType.Boolean,
        title: "Decorative",
        defaultValue: true,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: defaults.ariaLabel,
        hidden: (p: Partial<RefractionPlateProps>) => p.decorative === true,
    },
})
