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


type PresetId =
    | "color-negative"
    | "monochrome-negative"
    | "amber-cyan"
    | "soft-contact-sheet"
    | "custom"
type NegativeColorMode = "color" | "monochrome"
type EntranceTrigger = "load" | "in-view"
type InteractionBehavior = "hold" | "pulse"
type EffectStyleMode = "inherit" | "custom"
type AspectMode = "image" | "custom"
type QualityMode = "fast" | "balanced" | "sharp"

interface ResponsiveImageValue {
    src?: string
    alt?: string
    srcSet?: string
}

interface EffectSettings {
    negativeAmount: number
    exposure: number
    contrast: number
    saturation: number
}

interface AppearanceSettings extends EffectSettings {
    colorMode: NegativeColorMode
    temperature: number
    tint: number
    grain: number
    bloom: number
    tonalSpread: number
}

interface AppearanceConfig extends AppearanceSettings {
    preset: PresetId
}

interface EntranceConfig {
    trigger: EntranceTrigger
    duration: number
    delay: number
    replay: boolean
}

interface HoverConfig extends EffectSettings {
    behavior: InteractionBehavior
    inDuration: number
    inDelay: number
    outDuration: number
    outDelay: number
    effect: EffectStyleMode
}

interface ClickConfig extends EffectSettings {
    behavior: InteractionBehavior
    duration: number
    effect: EffectStyleMode
}

interface AdvancedConfig {
    aspect: AspectMode
    customAspectRatio: number
    background?: string
    quality: QualityMode
}

interface NegativeExposureProps {
    image?: ResponsiveImageValue
    appearance?: AppearanceConfig
    entrance?: EntranceConfig
    hover?: HoverConfig
    click?: ClickConfig
    advanced?: AdvancedConfig
    style?: React.CSSProperties
}

interface RuntimeSettings extends AppearanceSettings {
    entrance: "none" | EntranceTrigger
    entranceDuration: number
    entranceDelay: number
    entranceReplay: boolean
    hoverEnabled: boolean
    hoverBehavior: InteractionBehavior
    hoverInDuration: number
    hoverInDelay: number
    hoverOutDuration: number
    hoverOutDelay: number
    clickEnabled: boolean
    clickBehavior: InteractionBehavior
    clickDuration: number
    renderScale: number
}

interface CanvasSize {
    width: number
    height: number
    pixelRatio: number
}

interface RendererUniforms {
    image: WebGLUniformLocation
    resolution: WebGLUniformLocation
    imageSize: WebGLUniformLocation
    progress: WebGLUniformLocation
    negativeAmount: WebGLUniformLocation
    exposure: WebGLUniformLocation
    contrast: WebGLUniformLocation
    saturation: WebGLUniformLocation
    temperature: WebGLUniformLocation
    tint: WebGLUniformLocation
    grain: WebGLUniformLocation
    bloom: WebGLUniformLocation
    tonalSpread: WebGLUniformLocation
    colorMode: WebGLUniformLocation
    pixelRatio: WebGLUniformLocation
}

interface WebGLRenderer {
    gl: WebGL2RenderingContext
    program: WebGLProgram
    positionBuffer: WebGLBuffer
    texture: WebGLTexture
    positionLocation: number
    uniforms: RendererUniforms
}

type RenderState = "loading" | "ready" | "fallback"
type SourceImageState = "loading" | "ready" | "error"

const DEFAULT_IMAGE: ResponsiveImageValue = {
    src: "https://framerusercontent.com/images/TbC1RpiFvPUhmwww9b9cdDs99w.jpeg",
    alt: "Portrait with a negative exposure treatment",
}

const PRESETS: Record<Exclude<PresetId, "custom">, AppearanceSettings> = {
    "color-negative": {
        colorMode: "color",
        negativeAmount: 1,
        exposure: 0,
        contrast: 1.05,
        saturation: 1.1,
        temperature: 0.08,
        tint: 0,
        grain: 0.08,
        bloom: 0.12,
        tonalSpread: 0.22,
    },
    "monochrome-negative": {
        colorMode: "monochrome",
        negativeAmount: 1,
        exposure: 0.05,
        contrast: 1.1,
        saturation: 0,
        temperature: 0,
        tint: 0,
        grain: 0.12,
        bloom: 0.1,
        tonalSpread: 0.24,
    },
    "amber-cyan": {
        colorMode: "color",
        negativeAmount: 1,
        exposure: -0.1,
        contrast: 1.2,
        saturation: 1.4,
        temperature: 0.18,
        tint: -0.05,
        grain: 0.1,
        bloom: 0.16,
        tonalSpread: 0.25,
    },
    "soft-contact-sheet": {
        colorMode: "color",
        negativeAmount: 1,
        exposure: 0.25,
        contrast: 0.85,
        saturation: 0.85,
        temperature: 0.06,
        tint: 0.03,
        grain: 0.16,
        bloom: 0.2,
        tonalSpread: 0.32,
    },
}

const DEFAULT_APPEARANCE: AppearanceConfig = {
    preset: "color-negative",
    ...PRESETS["color-negative"],
}

const DEFAULT_ENTRANCE: EntranceConfig = {
    trigger: "load",
    duration: 1.4,
    delay: 0,
    replay: false,
}

const DEFAULT_HOVER: HoverConfig = {
    behavior: "hold",
    inDuration: 0.35,
    inDelay: 0,
    outDuration: 0.45,
    outDelay: 0,
    effect: "inherit",
    negativeAmount: 1,
    exposure: 0,
    contrast: 1.05,
    saturation: 1.1,
}

const DEFAULT_CLICK: ClickConfig = {
    behavior: "hold",
    duration: 0.45,
    effect: "inherit",
    negativeAmount: 1,
    exposure: 0,
    contrast: 1.05,
    saturation: 1.1,
}

const DEFAULT_ADVANCED: AdvancedConfig = {
    aspect: "image",
    customAspectRatio: 0.75,
    background: "#000000",
    quality: "balanced",
}

const QUALITY_SCALE: Record<QualityMode, number> = {
    fast: 0.65,
    balanced: 0.9,
    sharp: 1,
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 out_color;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_image_size;
uniform float u_progress;
uniform float u_negative_amount;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_tint;
uniform float u_grain;
uniform float u_bloom;
uniform float u_tonal_spread;
uniform float u_pixel_ratio;
uniform int u_color_mode;

vec2 cover_uv(vec2 uv) {
    float frame_aspect = u_resolution.x / max(u_resolution.y, 1.0);
    float image_aspect = u_image_size.x / max(u_image_size.y, 1.0);

    if (image_aspect > frame_aspect) {
        float visible_width = frame_aspect / image_aspect;
        uv.x = (uv.x - 0.5) * visible_width + 0.5;
    } else {
        float visible_height = image_aspect / frame_aspect;
        uv.y = (uv.y - 0.5) * visible_height + 0.5;
    }

    return uv;
}

float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

float hash21(vec2 value) {
    value = fract(value * vec2(123.34, 456.21));
    value += dot(value, value + 45.32);
    return fract(value.x * value.y);
}

vec3 negative_color(vec3 source) {
    float source_luminance = luminance(source);
    vec3 base = u_color_mode == 1 ? vec3(source_luminance) : source;
    vec3 negative = 1.0 - base;

    negative *= exp2(clamp(u_exposure, -2.0, 2.0));
    negative = (negative - 0.5) * clamp(u_contrast, 0.5, 2.0) + 0.5;

    if (u_color_mode == 0) {
        float negative_luminance = luminance(negative);
        negative = mix(
            vec3(negative_luminance),
            negative,
            clamp(u_saturation, 0.0, 2.0)
        );
    }

    negative += vec3(0.12, 0.025, -0.12)
        * clamp(u_temperature, -1.0, 1.0);
    negative += vec3(0.08, -0.08, 0.08)
        * clamp(u_tint, -1.0, 1.0);

    return clamp(negative, 0.0, 1.0);
}

vec3 sample_negative(vec2 display_uv) {
    vec2 image_uv = cover_uv(clamp(display_uv, 0.0, 1.0));
    return negative_color(texture(u_image, image_uv).rgb);
}

void main() {
    vec2 image_uv = cover_uv(v_uv);
    vec3 source = texture(u_image, image_uv).rgb;
    vec3 negative = negative_color(source);

    float bloom_amount = clamp(u_bloom, 0.0, 1.0);
    if (bloom_amount > 0.001) {
        vec2 step_size = vec2(2.75) / max(u_resolution, vec2(1.0));
        vec3 bloom_sum = vec3(0.0);
        bloom_sum += sample_negative(v_uv + vec2(step_size.x, 0.0));
        bloom_sum += sample_negative(v_uv - vec2(step_size.x, 0.0));
        bloom_sum += sample_negative(v_uv + vec2(0.0, step_size.y));
        bloom_sum += sample_negative(v_uv - vec2(0.0, step_size.y));
        bloom_sum += sample_negative(v_uv + step_size);
        bloom_sum += sample_negative(v_uv - step_size);
        bloom_sum += sample_negative(v_uv + vec2(step_size.x, -step_size.y));
        bloom_sum += sample_negative(v_uv + vec2(-step_size.x, step_size.y));

        vec3 bloom_color = bloom_sum * 0.125;
        float bloom_gate = smoothstep(0.55, 0.92, luminance(bloom_color));
        negative = clamp(
            negative + bloom_color * bloom_gate * bloom_amount * 0.38,
            0.0,
            1.0
        );
    }

    float grain_size = max(1.0, 1.65 / max(u_pixel_ratio, 0.5));
    vec2 grain_coordinate = floor(image_uv * u_image_size / grain_size);
    float grain_value = hash21(grain_coordinate) - 0.5;
    negative = clamp(
        negative + grain_value * clamp(u_grain, 0.0, 1.0) * 0.24,
        0.0,
        1.0
    );

    float progress = clamp(u_progress, 0.0, 1.0);
    float spread = clamp(u_tonal_spread, 0.0, 0.85);
    float source_luminance = luminance(source);
    float tonal_delay = source_luminance * spread;
    float local_progress = clamp(
        (progress - tonal_delay) / max(1.0 - spread, 0.001),
        0.0,
        1.0
    );
    local_progress = local_progress * local_progress
        * (3.0 - 2.0 * local_progress);

    if (progress <= 0.0) {
        local_progress = 0.0;
    } else if (progress >= 1.0) {
        local_progress = 1.0;
    }

    vec3 treated = mix(
        source,
        negative,
        clamp(u_negative_amount, 0.0, 1.0)
    );
    vec3 final_color = mix(treated, source, local_progress);
    out_color = vec4(final_color, 1.0);
}
`

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

function compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
) {
    const shader = gl.createShader(type)
    if (!shader) throw new Error("WebGL could not create a shader")

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) || "Shader compile failed"
        gl.deleteShader(shader)
        throw new Error(message)
    }

    return shader
}

function requireUniform(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    name: string
) {
    const location = gl.getUniformLocation(program, name)
    if (location === null) throw new Error(`Missing WebGL uniform: ${name}`)
    return location
}

function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
    const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
    })

    if (!gl) throw new Error("WebGL2 is unavailable")

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        FRAGMENT_SHADER
    )
    const program = gl.createProgram()

    if (!program) {
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        throw new Error("WebGL could not create a program")
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const message = gl.getProgramInfoLog(program) || "Program link failed"
        gl.deleteProgram(program)
        throw new Error(message)
    }

    const positionBuffer = gl.createBuffer()
    const texture = gl.createTexture()

    if (!positionBuffer || !texture) {
        if (positionBuffer) gl.deleteBuffer(positionBuffer)
        if (texture) gl.deleteTexture(texture)
        gl.deleteProgram(program)
        throw new Error("WebGL could not allocate renderer resources")
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]),
        gl.STATIC_DRAW
    )

    const positionLocation = gl.getAttribLocation(program, "a_position")
    if (positionLocation < 0) {
        gl.deleteTexture(texture)
        gl.deleteBuffer(positionBuffer)
        gl.deleteProgram(program)
        throw new Error("Missing WebGL position attribute")
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([17, 17, 15, 255])
    )

    return {
        gl,
        program,
        positionBuffer,
        texture,
        positionLocation,
        uniforms: {
            image: requireUniform(gl, program, "u_image"),
            resolution: requireUniform(gl, program, "u_resolution"),
            imageSize: requireUniform(gl, program, "u_image_size"),
            progress: requireUniform(gl, program, "u_progress"),
            negativeAmount: requireUniform(gl, program, "u_negative_amount"),
            exposure: requireUniform(gl, program, "u_exposure"),
            contrast: requireUniform(gl, program, "u_contrast"),
            saturation: requireUniform(gl, program, "u_saturation"),
            temperature: requireUniform(gl, program, "u_temperature"),
            tint: requireUniform(gl, program, "u_tint"),
            grain: requireUniform(gl, program, "u_grain"),
            bloom: requireUniform(gl, program, "u_bloom"),
            tonalSpread: requireUniform(gl, program, "u_tonal_spread"),
            colorMode: requireUniform(gl, program, "u_color_mode"),
            pixelRatio: requireUniform(gl, program, "u_pixel_ratio"),
        },
    }
}

function disposeRenderer(renderer: WebGLRenderer | null) {
    if (!renderer || renderer.gl.isContextLost()) return
    renderer.gl.deleteTexture(renderer.texture)
    renderer.gl.deleteBuffer(renderer.positionBuffer)
    renderer.gl.deleteProgram(renderer.program)
}

function uploadImage(renderer: WebGLRenderer, image: HTMLImageElement) {
    const { gl } = renderer
    gl.bindTexture(gl.TEXTURE_2D, renderer.texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
    )
}

function resolveAppearance(config: AppearanceConfig | undefined) {
    const next = config ?? DEFAULT_APPEARANCE
    if (next.preset !== "custom") return PRESETS[next.preset]
    return {
        colorMode: next.colorMode ?? DEFAULT_APPEARANCE.colorMode,
        negativeAmount:
            next.negativeAmount ?? DEFAULT_APPEARANCE.negativeAmount,
        exposure: next.exposure ?? DEFAULT_APPEARANCE.exposure,
        contrast: next.contrast ?? DEFAULT_APPEARANCE.contrast,
        saturation: next.saturation ?? DEFAULT_APPEARANCE.saturation,
        temperature: next.temperature ?? DEFAULT_APPEARANCE.temperature,
        tint: next.tint ?? DEFAULT_APPEARANCE.tint,
        grain: next.grain ?? DEFAULT_APPEARANCE.grain,
        bloom: next.bloom ?? DEFAULT_APPEARANCE.bloom,
        tonalSpread: next.tonalSpread ?? DEFAULT_APPEARANCE.tonalSpread,
    }
}

function staticFilter(appearance: AppearanceSettings) {
    const brightness = Math.pow(2, appearance.exposure)
    const hue = appearance.temperature * -16 + appearance.tint * 12
    const grayscale =
        appearance.colorMode === "monochrome" ? "grayscale(1) " : ""
    return `${grayscale}invert(${appearance.negativeAmount}) brightness(${brightness}) contrast(${appearance.contrast}) saturate(${appearance.saturation}) hue-rotate(${hue}deg)`
}

/**
 * Negative Exposure
 *
 * A film-negative image treatment that develops tonally into the original,
 * with presets and composable entrance, hover, and click interactions.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NegativeExposure(props: NegativeExposureProps) {
    const {
        image = DEFAULT_IMAGE,
        appearance: appearanceConfig,
        entrance,
        hover,
        click,
        advanced,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const imageRef = React.useRef<HTMLImageElement | null>(null)
    const rendererRef = React.useRef<WebGLRenderer | null>(null)
    const textureReadyRef = React.useRef(false)
    const frameRef = React.useRef<number | null>(null)
    const delayRef = React.useRef<number | null>(null)
    const sequenceRef = React.useRef(0)
    const sizeRef = React.useRef<CanvasSize>({
        width: 0,
        height: 0,
        pixelRatio: 1,
    })
    const progressRef = React.useRef(0)
    const visibleRef = React.useRef(true)
    const playedRef = React.useRef(false)
    const hoveringRef = React.useRef(false)
    const persistentProgressRef = React.useRef(1)
    const reducedMotionRef = React.useRef(false)
    const initializeRef = React.useRef<() => void>(() => undefined)
    const [renderState, setRenderState] =
        React.useState<RenderState>("loading")
    const [sourceState, setSourceState] =
        React.useState<SourceImageState>("loading")
    const [imageAspect, setImageAspect] = React.useState(0.75)

    const appearance = React.useMemo(
        () => resolveAppearance(appearanceConfig),
        [appearanceConfig]
    )
    const resolvedAdvanced = React.useMemo(
        () => ({ ...DEFAULT_ADVANCED, ...advanced }),
        [advanced]
    )
    const runtime = React.useMemo<RuntimeSettings>(
        () => ({
            ...appearance,
            entrance: entrance?.trigger ?? "none",
            entranceDuration:
                entrance?.duration ?? DEFAULT_ENTRANCE.duration,
            entranceDelay: entrance?.delay ?? DEFAULT_ENTRANCE.delay,
            entranceReplay: entrance?.replay ?? DEFAULT_ENTRANCE.replay,
            hoverEnabled: hover !== undefined,
            hoverBehavior: hover?.behavior ?? DEFAULT_HOVER.behavior,
            hoverInDuration:
                hover?.inDuration ?? DEFAULT_HOVER.inDuration,
            hoverInDelay: hover?.inDelay ?? DEFAULT_HOVER.inDelay,
            hoverOutDuration:
                hover?.outDuration ?? DEFAULT_HOVER.outDuration,
            hoverOutDelay: hover?.outDelay ?? DEFAULT_HOVER.outDelay,
            clickEnabled: click !== undefined,
            clickBehavior: click?.behavior ?? DEFAULT_CLICK.behavior,
            clickDuration: click?.duration ?? DEFAULT_CLICK.duration,
            renderScale: QUALITY_SCALE[resolvedAdvanced.quality],
        }),
        [appearance, click, entrance, hover, resolvedAdvanced.quality]
    )
    const settingsRef = React.useRef(runtime)
    settingsRef.current = runtime

    const baseEffect = React.useMemo<EffectSettings>(
        () => ({
            negativeAmount: appearance.negativeAmount,
            exposure: appearance.exposure,
            contrast: appearance.contrast,
            saturation: appearance.saturation,
        }),
        [appearance]
    )
    const hoverEffect = React.useMemo<EffectSettings>(
        () =>
            hover?.effect === "custom"
                ? {
                      negativeAmount:
                          hover.negativeAmount ??
                          DEFAULT_HOVER.negativeAmount,
                      exposure:
                          hover.exposure ?? DEFAULT_HOVER.exposure,
                      contrast:
                          hover.contrast ?? DEFAULT_HOVER.contrast,
                      saturation:
                          hover.saturation ?? DEFAULT_HOVER.saturation,
                  }
                : baseEffect,
        [baseEffect, hover]
    )
    const clickEffect = React.useMemo<EffectSettings>(
        () =>
            click?.effect === "custom"
                ? {
                      negativeAmount:
                          click.negativeAmount ??
                          DEFAULT_CLICK.negativeAmount,
                      exposure:
                          click.exposure ?? DEFAULT_CLICK.exposure,
                      contrast:
                          click.contrast ?? DEFAULT_CLICK.contrast,
                      saturation:
                          click.saturation ?? DEFAULT_CLICK.saturation,
                  }
                : baseEffect,
        [baseEffect, click]
    )

    const baseEffectRef = React.useRef(baseEffect)
    const hoverEffectRef = React.useRef(hoverEffect)
    const clickEffectRef = React.useRef(clickEffect)
    const persistentEffectRef = React.useRef<EffectSettings>(baseEffect)
    const activeEffectRef = React.useRef<EffectSettings>(baseEffect)
    baseEffectRef.current = baseEffect
    hoverEffectRef.current = hoverEffect
    clickEffectRef.current = clickEffect

    const stopAnimation = React.useCallback(() => {
        sequenceRef.current += 1

        if (frameRef.current !== null && typeof window !== "undefined") {
            window.cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }
        if (delayRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(delayRef.current)
            delayRef.current = null
        }
    }, [])

    const drawFrame = React.useCallback((nextProgress: number) => {
        const renderer = rendererRef.current
        const loadedImage = imageRef.current
        const { width, height, pixelRatio } = sizeRef.current

        if (
            !renderer ||
            !textureReadyRef.current ||
            !loadedImage ||
            width === 0 ||
            height === 0 ||
            renderer.gl.isContextLost()
        ) {
            return
        }

        const { gl, uniforms } = renderer
        const current = activeEffectRef.current
        const treatment = settingsRef.current

        gl.viewport(0, 0, width, height)
        gl.disable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)
        gl.useProgram(renderer.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer)
        gl.enableVertexAttribArray(renderer.positionLocation)
        gl.vertexAttribPointer(
            renderer.positionLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        )
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, renderer.texture)
        gl.uniform1i(uniforms.image, 0)
        gl.uniform2f(uniforms.resolution, width, height)
        gl.uniform2f(
            uniforms.imageSize,
            loadedImage.naturalWidth || loadedImage.width || 1,
            loadedImage.naturalHeight || loadedImage.height || 1
        )
        gl.uniform1f(uniforms.progress, clamp01(nextProgress))
        gl.uniform1f(
            uniforms.negativeAmount,
            clamp01(current.negativeAmount)
        )
        gl.uniform1f(
            uniforms.exposure,
            Math.min(2, Math.max(-2, current.exposure))
        )
        gl.uniform1f(
            uniforms.contrast,
            Math.min(2, Math.max(0.5, current.contrast))
        )
        gl.uniform1f(
            uniforms.saturation,
            Math.min(2, Math.max(0, current.saturation))
        )
        gl.uniform1f(
            uniforms.temperature,
            Math.min(1, Math.max(-1, treatment.temperature))
        )
        gl.uniform1f(
            uniforms.tint,
            Math.min(1, Math.max(-1, treatment.tint))
        )
        gl.uniform1f(uniforms.grain, clamp01(treatment.grain))
        gl.uniform1f(uniforms.bloom, clamp01(treatment.bloom))
        gl.uniform1f(
            uniforms.tonalSpread,
            Math.min(0.85, Math.max(0, treatment.tonalSpread))
        )
        gl.uniform1i(
            uniforms.colorMode,
            treatment.colorMode === "monochrome" ? 1 : 0
        )
        gl.uniform1f(uniforms.pixelRatio, Math.max(0.5, pixelRatio))
        gl.drawArrays(gl.TRIANGLES, 0, 6)
    }, [])

    const setProgress = React.useCallback(
        (nextProgress: number) => {
            progressRef.current = clamp01(nextProgress)
            drawFrame(progressRef.current)
        },
        [drawFrame]
    )

    const animateTo = React.useCallback(
        (
            targetProgress: number,
            duration: number,
            delay: number,
            effect: EffectSettings,
            onComplete?: () => void
        ) => {
            stopAnimation()
            const sequence = sequenceRef.current
            const target = clamp01(targetProgress)
            const startProgress = progressRef.current
            const durationMs = Math.max(0, duration * 1000)
            const delayMs = Math.max(0, delay * 1000)
            activeEffectRef.current = effect

            const complete = () => {
                if (sequenceRef.current !== sequence) return
                frameRef.current = null
                delayRef.current = null
                setProgress(target)
                onComplete?.()
            }

            if (
                reducedMotionRef.current ||
                durationMs <= 0 ||
                Math.abs(target - startProgress) < 0.001
            ) {
                complete()
                return
            }
            if (
                typeof window === "undefined" ||
                typeof document === "undefined" ||
                !visibleRef.current ||
                document.hidden
            ) {
                return
            }

            const start = () => {
                if (sequenceRef.current !== sequence) return
                const startTime = window.performance.now()

                const run = (time: number) => {
                    if (
                        sequenceRef.current !== sequence ||
                        !visibleRef.current ||
                        document.hidden
                    ) {
                        frameRef.current = null
                        return
                    }

                    const elapsed = clamp01(
                        (time - startTime) / durationMs
                    )
                    const eased = easeOutCubic(elapsed)
                    setProgress(
                        startProgress + (target - startProgress) * eased
                    )

                    if (elapsed < 1) {
                        frameRef.current =
                            window.requestAnimationFrame(run)
                    } else {
                        complete()
                    }
                }

                frameRef.current = window.requestAnimationFrame(run)
            }

            if (delayMs > 0) {
                delayRef.current = window.setTimeout(() => {
                    delayRef.current = null
                    start()
                }, delayMs)
            } else {
                start()
            }
        },
        [setProgress, stopAnimation]
    )

    const initializeInteraction = React.useCallback(() => {
        if (!textureReadyRef.current) return

        stopAnimation()
        playedRef.current = false
        hoveringRef.current = false
        persistentProgressRef.current = 1
        persistentEffectRef.current = baseEffectRef.current
        activeEffectRef.current = baseEffectRef.current

        if (reducedMotionRef.current) {
            setProgress(1)
            playedRef.current = true
            return
        }

        const current = settingsRef.current
        if (current.entrance === "none") {
            setProgress(1)
            return
        }

        setProgress(0)
        if (
            current.entrance === "load" ||
            (current.entrance === "in-view" && visibleRef.current)
        ) {
            animateTo(
                1,
                current.entranceDuration,
                current.entranceDelay,
                baseEffectRef.current
            )
            playedRef.current = true
        }
    }, [animateTo, setProgress, stopAnimation])
    initializeRef.current = initializeInteraction

    React.useLayoutEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const canvas = canvasRef.current
        if (!canvas) return

        const setupRenderer = () => {
            disposeRenderer(rendererRef.current)
            rendererRef.current = null
            textureReadyRef.current = false

            try {
                const renderer = createRenderer(canvas)
                rendererRef.current = renderer
                if (imageRef.current) {
                    uploadImage(renderer, imageRef.current)
                    textureReadyRef.current = true
                    React.startTransition(() => setRenderState("ready"))
                    drawFrame(progressRef.current)
                }
            } catch (error) {
                console.warn("Negative Exposure renderer unavailable", error)
                React.startTransition(() => setRenderState("fallback"))
            }
        }

        const handleContextLost = (event: Event) => {
            event.preventDefault()
            stopAnimation()
            rendererRef.current = null
            textureReadyRef.current = false
            React.startTransition(() => setRenderState("fallback"))
        }
        const handleContextRestored = () => setupRenderer()

        canvas.addEventListener("webglcontextlost", handleContextLost)
        canvas.addEventListener(
            "webglcontextrestored",
            handleContextRestored
        )
        setupRenderer()

        return () => {
            canvas.removeEventListener(
                "webglcontextlost",
                handleContextLost
            )
            canvas.removeEventListener(
                "webglcontextrestored",
                handleContextRestored
            )
            disposeRenderer(rendererRef.current)
            rendererRef.current = null
            textureReadyRef.current = false
        }
    }, [drawFrame, isStatic, stopAnimation])

    React.useLayoutEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const node = rootRef.current
        const canvas = canvasRef.current
        if (!node || !canvas) return

        const measure = (width: number, height: number) => {
            const renderScale = Math.max(
                0.5,
                Math.min(1, settingsRef.current.renderScale)
            )
            const deviceScale = Math.min(
                Math.max(1, window.devicePixelRatio || 1),
                1.5
            )
            const pixelRatio = deviceScale * renderScale
            const nextWidth = Math.max(1, Math.round(width * pixelRatio))
            const nextHeight = Math.max(1, Math.round(height * pixelRatio))

            sizeRef.current = {
                width: nextWidth,
                height: nextHeight,
                pixelRatio,
            }
            if (
                canvas.width !== nextWidth ||
                canvas.height !== nextHeight
            ) {
                canvas.width = nextWidth
                canvas.height = nextHeight
            }
            drawFrame(progressRef.current)
        }

        const initialRect = node.getBoundingClientRect()
        measure(initialRect.width, initialRect.height)
        const observer = new ResizeObserver(entries => {
            const entry = entries[0]
            if (entry) {
                measure(entry.contentRect.width, entry.contentRect.height)
            }
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [drawFrame, isStatic, runtime.renderScale])

    React.useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        let cancelled = false
        React.startTransition(() => {
            setRenderState("loading")
            setSourceState("loading")
        })
        textureReadyRef.current = false
        stopAnimation()

        const nextImage = new Image()
        nextImage.crossOrigin = "anonymous"
        nextImage.decoding = "async"

        nextImage.onload = () => {
            if (cancelled) return
            imageRef.current = nextImage
            React.startTransition(() => {
                setSourceState("ready")
                setImageAspect(
                    (nextImage.naturalWidth || 1) /
                        Math.max(nextImage.naturalHeight || 1, 1)
                )
            })

            const renderer = rendererRef.current
            if (!renderer) {
                React.startTransition(() => setRenderState("fallback"))
                return
            }

            try {
                uploadImage(renderer, nextImage)
                textureReadyRef.current = true
                React.startTransition(() => setRenderState("ready"))
                initializeRef.current()
            } catch (error) {
                console.warn(
                    "Negative Exposure could not upload the image texture",
                    error
                )
                textureReadyRef.current = false
                React.startTransition(() => setRenderState("fallback"))
            }
        }
        nextImage.onerror = () => {
            if (cancelled) return
            imageRef.current = null
            textureReadyRef.current = false
            React.startTransition(() => {
                setSourceState("error")
                setRenderState("fallback")
            })
        }
        nextImage.src = image?.src || DEFAULT_IMAGE.src || ""

        return () => {
            cancelled = true
            nextImage.onload = null
            nextImage.onerror = null
        }
    }, [image?.src, isStatic, stopAnimation])

    React.useEffect(() => {
        if (isStatic) return
        if (!hoveringRef.current) {
            persistentEffectRef.current =
                runtime.clickEnabled && persistentProgressRef.current < 0.5
                    ? clickEffect
                    : baseEffect
            activeEffectRef.current = persistentEffectRef.current
        }
        drawFrame(progressRef.current)
    }, [
        appearance,
        baseEffect,
        clickEffect,
        drawFrame,
        hoverEffect,
        isStatic,
        runtime.clickEnabled,
        runtime.renderScale,
    ])

    React.useEffect(() => {
        if (isStatic || runtime.hoverEnabled || !hoveringRef.current) {
            return
        }
        hoveringRef.current = false
        stopAnimation()
        activeEffectRef.current = persistentEffectRef.current
        setProgress(persistentProgressRef.current)
    }, [
        isStatic,
        runtime.hoverEnabled,
        setProgress,
        stopAnimation,
    ])

    React.useEffect(() => {
        if (
            isStatic ||
            runtime.clickEnabled ||
            persistentProgressRef.current >= 0.5
        ) {
            return
        }
        hoveringRef.current = false
        persistentProgressRef.current = 1
        persistentEffectRef.current = baseEffectRef.current
        stopAnimation()
        activeEffectRef.current = baseEffectRef.current
        setProgress(1)
    }, [
        isStatic,
        runtime.clickEnabled,
        setProgress,
        stopAnimation,
    ])

    React.useEffect(() => {
        if (!isStatic) initializeInteraction()
    }, [initializeInteraction, isStatic, runtime.entrance])

    React.useEffect(() => {
        if (
            isStatic ||
            typeof window === "undefined" ||
            typeof IntersectionObserver === "undefined"
        ) {
            return
        }
        const node = rootRef.current
        if (!node) return

        const observer = new IntersectionObserver(
            entries => {
                const isVisible = Boolean(entries[0]?.isIntersecting)
                visibleRef.current = isVisible

                if (!isVisible) {
                    stopAnimation()
                    hoveringRef.current = false
                    activeEffectRef.current = persistentEffectRef.current

                    if (
                        settingsRef.current.entrance === "in-view" &&
                        settingsRef.current.entranceReplay
                    ) {
                        playedRef.current = false
                        setProgress(0)
                    } else {
                        setProgress(persistentProgressRef.current)
                    }
                    return
                }

                const current = settingsRef.current
                if (
                    current.entrance === "in-view" &&
                    (!playedRef.current || progressRef.current < 1)
                ) {
                    animateTo(
                        1,
                        current.entranceDuration,
                        current.entranceDelay,
                        baseEffectRef.current
                    )
                    playedRef.current = true
                } else if (
                    current.entrance === "load" &&
                    progressRef.current < 1
                ) {
                    animateTo(
                        1,
                        current.entranceDuration,
                        0,
                        baseEffectRef.current
                    )
                } else {
                    drawFrame(progressRef.current)
                }
            },
            { threshold: 0.08 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [animateTo, drawFrame, isStatic, setProgress, stopAnimation])

    React.useEffect(() => {
        if (
            isStatic ||
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            return
        }
        const media = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        const updatePreference = () => {
            reducedMotionRef.current = media.matches
            if (media.matches) {
                stopAnimation()
                hoveringRef.current = false
                persistentProgressRef.current = 1
                persistentEffectRef.current = baseEffectRef.current
                activeEffectRef.current = baseEffectRef.current
                setProgress(1)
            }
        }
        updatePreference()
        media.addEventListener("change", updatePreference)
        return () =>
            media.removeEventListener("change", updatePreference)
    }, [isStatic, setProgress, stopAnimation])

    React.useEffect(() => {
        if (
            isStatic ||
            typeof document === "undefined"
        ) {
            return
        }
        const handleVisibility = () => {
            if (document.hidden) {
                stopAnimation()
                hoveringRef.current = false
                activeEffectRef.current = persistentEffectRef.current
                setProgress(persistentProgressRef.current)
                return
            }

            const current = settingsRef.current
            if (
                visibleRef.current &&
                current.entrance === "load" &&
                progressRef.current < 1
            ) {
                animateTo(
                    1,
                    current.entranceDuration,
                    0,
                    baseEffectRef.current
                )
            } else if (
                visibleRef.current &&
                current.entrance === "in-view" &&
                !playedRef.current
            ) {
                animateTo(
                    1,
                    current.entranceDuration,
                    current.entranceDelay,
                    baseEffectRef.current
                )
                playedRef.current = true
            } else {
                drawFrame(progressRef.current)
            }
        }
        document.addEventListener("visibilitychange", handleVisibility)
        return () =>
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            )
    }, [animateTo, drawFrame, isStatic, setProgress, stopAnimation])

    React.useEffect(
        () => () => {
            stopAnimation()
            imageRef.current = null
        },
        [stopAnimation]
    )

    const handlePointerEnter = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        const current = settingsRef.current
        if (
            isStatic ||
            !current.hoverEnabled ||
            event.pointerType === "touch"
        ) {
            return
        }

        hoveringRef.current = true
        const target =
            persistentProgressRef.current >= 0.5 ? 0 : 1
        animateTo(
            target,
            current.hoverInDuration,
            current.hoverInDelay,
            hoverEffectRef.current,
            current.hoverBehavior === "pulse"
                ? () => {
                      animateTo(
                          persistentProgressRef.current,
                          settingsRef.current.hoverOutDuration,
                          settingsRef.current.hoverOutDelay,
                          hoverEffectRef.current,
                          () => {
                              hoveringRef.current = false
                              activeEffectRef.current =
                                  persistentEffectRef.current
                              setProgress(persistentProgressRef.current)
                          }
                      )
                  }
                : undefined
        )
    }

    const handlePointerLeave = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        const current = settingsRef.current
        if (
            isStatic ||
            !current.hoverEnabled ||
            event.pointerType === "touch"
        ) {
            return
        }

        hoveringRef.current = false
        animateTo(
            persistentProgressRef.current,
            current.hoverOutDuration,
            current.hoverOutDelay,
            hoverEffectRef.current,
            () => {
                activeEffectRef.current = persistentEffectRef.current
                setProgress(persistentProgressRef.current)
            }
        )
    }

    const activateClick = () => {
        const current = settingsRef.current
        if (isStatic || !current.clickEnabled) return

        hoveringRef.current = false
        if (current.clickBehavior === "pulse") {
            const target =
                persistentProgressRef.current >= 0.5 ? 0 : 1
            animateTo(
                target,
                current.clickDuration,
                0,
                clickEffectRef.current,
                () => {
                    animateTo(
                        persistentProgressRef.current,
                        current.clickDuration,
                        0,
                        clickEffectRef.current,
                        () => {
                            activeEffectRef.current =
                                persistentEffectRef.current
                            setProgress(persistentProgressRef.current)
                        }
                    )
                }
            )
            return
        }

        persistentProgressRef.current =
            persistentProgressRef.current >= 0.5 ? 0 : 1
        persistentEffectRef.current =
            persistentProgressRef.current < 0.5
                ? clickEffectRef.current
                : baseEffectRef.current
        animateTo(
            persistentProgressRef.current,
            current.clickDuration,
            0,
            clickEffectRef.current,
            () => {
                activeEffectRef.current = persistentEffectRef.current
                setProgress(persistentProgressRef.current)
            }
        )
    }

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>
    ) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        activateClick()
    }

    const imageSrc = image?.src || DEFAULT_IMAGE.src || ""
    const imageAlt = image?.alt ?? DEFAULT_IMAGE.alt ?? ""
    const incomingWidth = style?.width
    const incomingHeight = style?.height
    const shouldUseIntrinsicHeight =
        incomingHeight === undefined || incomingHeight === "auto"
    const resolvedAspectRatio =
        resolvedAdvanced.aspect === "custom"
            ? Math.max(0.1, resolvedAdvanced.customAspectRatio)
            : imageAspect
    const interactive = !isStatic && runtime.clickEnabled
    const showStatus =
        !isStatic &&
        sourceState !== "loading" &&
        (sourceState === "error" || renderState === "fallback")

    return (
        <div
            ref={rootRef}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onClick={interactive ? activateClick : undefined}
            onKeyDown={interactive ? handleKeyDown : undefined}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={
                interactive
                    ? `${imageAlt || "Image"}: click to ${
                          runtime.clickBehavior === "pulse"
                              ? "pulse"
                              : "toggle"
                      } negative exposure`
                    : undefined
            }
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                display: "block",
                width: incomingWidth ?? "100%",
                height: shouldUseIntrinsicHeight ? "auto" : incomingHeight,
                aspectRatio: String(resolvedAspectRatio),
                backgroundColor:
                    resolvedAdvanced.background ?? "transparent",
                cursor: interactive ? "pointer" : "default",
            }}
        >
            <img
                src={imageSrc}
                srcSet={image?.srcSet}
                alt={imageAlt}
                crossOrigin="anonymous"
                draggable={false}
                onLoad={event => {
                    if (isStatic) {
                        const node = event.currentTarget
                        React.startTransition(() =>
                            setImageAspect(
                                (node.naturalWidth || 1) /
                                    Math.max(node.naturalHeight || 1, 1)
                            )
                        )
                    }
                }}
                onError={() =>
                    React.startTransition(() => setSourceState("error"))
                }
                style={{
                    position: isStatic ? "relative" : "absolute",
                    inset: isStatic ? undefined : 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    pointerEvents: "none",
                    filter: isStatic
                        ? staticFilter(appearance)
                        : undefined,
                }}
            />

            {!isStatic && (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                        pointerEvents: "none",
                        opacity: renderState === "ready" ? 1 : 0,
                    }}
                />
            )}

            {showStatus && (
                <div
                    role="status"
                    style={{
                        position: "absolute",
                        left: 12,
                        bottom: 12,
                        maxWidth: "calc(100% - 24px)",
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: "rgba(16, 16, 16, 0.72)",
                        color: "#FFFFFF",
                        font: "500 11px/1.2 system-ui, sans-serif",
                        letterSpacing: "0.01em",
                        pointerEvents: "none",
                    }}
                >
                    {sourceState === "error"
                        ? "Image unavailable"
                        : "Showing clear-image fallback"}
                </div>
            )}
        </div>
    )
}

addPropertyControls(NegativeExposure, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        buttonTitle: "Appearance",
        icon: "effect",
        description:
            "Choose a film recipe. Custom reveals the full negative treatment.",
        defaultValue: DEFAULT_APPEARANCE,
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Preset",
                options: [
                    "color-negative",
                    "monochrome-negative",
                    "amber-cyan",
                    "soft-contact-sheet",
                    "custom",
                ],
                optionTitles: [
                    "Color Negative",
                    "Monochrome Negative",
                    "Amber Cyan",
                    "Soft Contact Sheet",
                    "Custom",
                ],
                defaultValue: DEFAULT_APPEARANCE.preset,
            },
            colorMode: {
                type: ControlType.Enum,
                title: "Color Mode",
                options: ["color", "monochrome"],
                optionTitles: ["Color", "Monochrome"],
                defaultValue: DEFAULT_APPEARANCE.colorMode,
                displaySegmentedControl: true,
                hidden: properties => properties.preset !== "custom",
            },
            negativeAmount: {
                type: ControlType.Number,
                title: "Negative",
                defaultValue: DEFAULT_APPEARANCE.negativeAmount,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: properties => properties.preset !== "custom",
            },
            exposure: {
                type: ControlType.Number,
                title: "Exposure",
                defaultValue: DEFAULT_APPEARANCE.exposure,
                min: -2,
                max: 2,
                step: 0.05,
                unit: " EV",
                hidden: properties => properties.preset !== "custom",
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                defaultValue: DEFAULT_APPEARANCE.contrast,
                min: 0.5,
                max: 2,
                step: 0.01,
                hidden: properties => properties.preset !== "custom",
            },
            saturation: {
                type: ControlType.Number,
                title: "Saturation",
                description: "Ignored in monochrome mode.",
                defaultValue: DEFAULT_APPEARANCE.saturation,
                min: 0,
                max: 2,
                step: 0.01,
                hidden: properties =>
                    properties.preset !== "custom" ||
                    properties.colorMode === "monochrome",
            },
            temperature: {
                type: ControlType.Number,
                title: "Temperature",
                defaultValue: DEFAULT_APPEARANCE.temperature,
                min: -1,
                max: 1,
                step: 0.01,
                hidden: properties => properties.preset !== "custom",
            },
            tint: {
                type: ControlType.Number,
                title: "Tint",
                defaultValue: DEFAULT_APPEARANCE.tint,
                min: -1,
                max: 1,
                step: 0.01,
                hidden: properties => properties.preset !== "custom",
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                description: "Stable image-space grain that does not shimmer.",
                defaultValue: DEFAULT_APPEARANCE.grain,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: properties => properties.preset !== "custom",
            },
            bloom: {
                type: ControlType.Number,
                title: "Bloom",
                defaultValue: DEFAULT_APPEARANCE.bloom,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: properties => properties.preset !== "custom",
            },
            tonalSpread: {
                type: ControlType.Number,
                title: "Tonal Spread",
                description:
                    "Separates shadow, midtone, and highlight development.",
                defaultValue: DEFAULT_APPEARANCE.tonalSpread,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: properties => properties.preset !== "custom",
            },
        },
    },
    entrance: {
        type: ControlType.Object,
        title: "Entrance",
        buttonTitle: "Entrance",
        icon: "interaction",
        optional: true,
        description:
            "Develop from negative to original on load or when entering view. Remove to disable.",
        defaultValue: DEFAULT_ENTRANCE,
        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Trigger",
                options: ["load", "in-view"],
                optionTitles: ["On Load", "In View"],
                defaultValue: DEFAULT_ENTRANCE.trigger,
                displaySegmentedControl: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: DEFAULT_ENTRANCE.duration,
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: DEFAULT_ENTRANCE.delay,
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
            },
            replay: {
                type: ControlType.Boolean,
                title: "Replay",
                description:
                    "Reset after leaving view so the entrance can play again.",
                defaultValue: DEFAULT_ENTRANCE.replay,
                hidden: properties => properties.trigger !== "in-view",
            },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        buttonTitle: "Add Hover",
        icon: "interaction",
        optional: true,
        description:
            "Hold or pulse the negative for mouse and pen pointers. Touch is ignored.",
        controls: {
            behavior: {
                type: ControlType.Enum,
                title: "Behavior",
                options: ["hold", "pulse"],
                optionTitles: ["Hold", "Pulse Once"],
                defaultValue: DEFAULT_HOVER.behavior,
                displaySegmentedControl: true,
            },
            inDuration: {
                type: ControlType.Number,
                title: "Enter",
                defaultValue: DEFAULT_HOVER.inDuration,
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
            },
            inDelay: {
                type: ControlType.Number,
                title: "Enter Delay",
                defaultValue: DEFAULT_HOVER.inDelay,
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
            },
            outDuration: {
                type: ControlType.Number,
                title: "Leave",
                defaultValue: DEFAULT_HOVER.outDuration,
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
            },
            outDelay: {
                type: ControlType.Number,
                title: "Leave Delay",
                defaultValue: DEFAULT_HOVER.outDelay,
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
            },
            effect: {
                type: ControlType.Enum,
                title: "Appearance",
                options: ["inherit", "custom"],
                optionTitles: ["Main Effect", "Custom"],
                defaultValue: DEFAULT_HOVER.effect,
                displaySegmentedControl: true,
            },
            negativeAmount: {
                type: ControlType.Number,
                title: "Negative",
                defaultValue: DEFAULT_HOVER.negativeAmount,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: properties => properties.effect !== "custom",
            },
            exposure: {
                type: ControlType.Number,
                title: "Exposure",
                defaultValue: DEFAULT_HOVER.exposure,
                min: -2,
                max: 2,
                step: 0.05,
                unit: " EV",
                hidden: properties => properties.effect !== "custom",
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                defaultValue: DEFAULT_HOVER.contrast,
                min: 0.5,
                max: 2,
                step: 0.01,
                hidden: properties => properties.effect !== "custom",
            },
            saturation: {
                type: ControlType.Number,
                title: "Saturation",
                defaultValue: DEFAULT_HOVER.saturation,
                min: 0,
                max: 2,
                step: 0.01,
                hidden: properties => properties.effect !== "custom",
            },
        },
    },
    click: {
        type: ControlType.Object,
        title: "Click",
        buttonTitle: "Add Click",
        icon: "interaction",
        optional: true,
        description:
            "Toggle or pulse with click, Enter, or Space.",
        controls: {
            behavior: {
                type: ControlType.Enum,
                title: "Behavior",
                options: ["hold", "pulse"],
                optionTitles: ["Hold", "Pulse Once"],
                defaultValue: DEFAULT_CLICK.behavior,
                displaySegmentedControl: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: DEFAULT_CLICK.duration,
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
            },
            effect: {
                type: ControlType.Enum,
                title: "Appearance",
                options: ["inherit", "custom"],
                optionTitles: ["Main Effect", "Custom"],
                defaultValue: DEFAULT_CLICK.effect,
                displaySegmentedControl: true,
            },
            negativeAmount: {
                type: ControlType.Number,
                title: "Negative",
                defaultValue: DEFAULT_CLICK.negativeAmount,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: properties => properties.effect !== "custom",
            },
            exposure: {
                type: ControlType.Number,
                title: "Exposure",
                defaultValue: DEFAULT_CLICK.exposure,
                min: -2,
                max: 2,
                step: 0.05,
                unit: " EV",
                hidden: properties => properties.effect !== "custom",
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                defaultValue: DEFAULT_CLICK.contrast,
                min: 0.5,
                max: 2,
                step: 0.01,
                hidden: properties => properties.effect !== "custom",
            },
            saturation: {
                type: ControlType.Number,
                title: "Saturation",
                defaultValue: DEFAULT_CLICK.saturation,
                min: 0,
                max: 2,
                step: 0.01,
                hidden: properties => properties.effect !== "custom",
            },
        },
    },
    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        buttonTitle: "Advanced",
        icon: "object",
        defaultValue: DEFAULT_ADVANCED,
        controls: {
            aspect: {
                type: ControlType.Enum,
                title: "Aspect",
                options: ["image", "custom"],
                optionTitles: ["Image", "Custom"],
                defaultValue: DEFAULT_ADVANCED.aspect,
                displaySegmentedControl: true,
            },
            customAspectRatio: {
                type: ControlType.Number,
                title: "Custom Ratio",
                description: "Width divided by height.",
                defaultValue: DEFAULT_ADVANCED.customAspectRatio,
                min: 0.1,
                max: 4,
                step: 0.01,
                hidden: properties => properties.aspect !== "custom",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                description:
                    "Shown behind transparent image areas. Remove for transparency.",
                defaultValue: DEFAULT_ADVANCED.background,
                optional: true,
            },
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                description:
                    "Higher quality uses more canvas pixels and more rendering work.",
                options: ["fast", "balanced", "sharp"],
                optionTitles: ["Fast", "Balanced", "Sharp"],
                defaultValue: DEFAULT_ADVANCED.quality,
                displaySegmentedControl: true,
            },
        },
    },
})
