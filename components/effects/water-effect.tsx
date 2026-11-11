import * as React from "react"
import { useCallback, useEffect, useRef } from "react"
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
 * WATER RIPPLE IMAGE
 * ------------------
 * Renders an image on a WebGL canvas and distorts it with a real-time
 * ripple / water-refraction effect. Small ripples trail the pointer on
 * hover, and a stronger ripple bursts outward on click — like a drop
 * hitting the surface of water.
 *
 * Falls back to a plain <img> on the Framer canvas, in static export,
 * and in thumbnails, since there's no pointer to react to there.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

// ---------------------------------------------------------------------------
// Types

type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type ObjectFit = "cover" | "contain"

interface WaterRippleImageProps {
    image?: ResponsiveImage
    objectFit: ObjectFit
    borderRadius: number
    hoverRipples: boolean
    hoverStrength: number
    clickStrength: number
    rippleSpeed: number
    rippleSize: number
    hoverFade: number
    clickFade: number
    highlightColor: string
    style?: React.CSSProperties
}

interface Ripple {
    x: number
    y: number
    start: number
    strength: number
    speed: number
    decay: number
}

// ---------------------------------------------------------------------------
// Tunable constants that aren't exposed as property controls

const MAX_RIPPLES = 18
const HOVER_THROTTLE_MS = 70
const CLICK_SPEED_MULT = 0.85
const FREQUENCY_CONSTANT = 512

// ---------------------------------------------------------------------------
// Shaders

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

function buildFragmentShader(maxRipples: number): string {
    return `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_image;
uniform vec2 u_imageSize;
uniform vec2 u_resolution;
uniform float u_time;
uniform int u_rippleCount;
uniform vec2 u_origin[${maxRipples}];
uniform float u_start[${maxRipples}];
uniform float u_strength[${maxRipples}];
uniform float u_speed[${maxRipples}];
uniform float u_decay[${maxRipples}];
uniform float u_frequency;
uniform float u_objectFit;
uniform vec3 u_highlight;

vec2 fitUV(vec2 uv, out bool inBounds) {
    float canvasAspect = u_resolution.x / u_resolution.y;
    float imageAspect = u_imageSize.x / u_imageSize.y;
    bool canvasWider = canvasAspect > imageAspect;
    bool cover = u_objectFit < 0.5;

    vec2 scale = vec2(1.0);
    if (cover) {
        if (canvasWider) {
            scale.y = imageAspect / canvasAspect;
        } else {
            scale.x = canvasAspect / imageAspect;
        }
    } else {
        if (canvasWider) {
            scale.x = canvasAspect / imageAspect;
        } else {
            scale.y = imageAspect / canvasAspect;
        }
    }

    vec2 result = (uv - 0.5) * scale + 0.5;
    inBounds = result.x >= 0.0 && result.x <= 1.0 && result.y >= 0.0 && result.y <= 1.0;
    return result;
}

void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / u_resolution.y;

    vec2 displacement = vec2(0.0);
    float highlight = 0.0;

    for (int i = 0; i < ${maxRipples}; i++) {
        if (i >= u_rippleCount) break;

        float age = u_time - u_start[i];
        if (age < 0.0) continue;

        vec2 diff = uv - u_origin[i];
        diff.x *= aspect;
        float dist = length(diff);
        vec2 dir = dist > 0.0001 ? diff / dist : vec2(0.0);

        float radius = age * u_speed[i];
        float ringWidth = 0.045 + radius * 0.35;
        float envelope = exp(-pow((dist - radius) / ringWidth, 2.0));
        float ageFade = exp(-age * u_decay[i]);
        float wave = sin((dist - radius) * u_frequency) * envelope * ageFade * u_strength[i];

        displacement += dir * wave;
        highlight += wave;
    }

    bool inBounds;
    vec2 sampleUV = fitUV(uv + displacement, inBounds);

    if (!inBounds) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec4 color = texture2D(u_image, clamp(sampleUV, 0.0, 1.0));
    color.rgb += highlight * u_highlight;
    gl_FragColor = color;
}
`
}

// ---------------------------------------------------------------------------
// WebGL helpers

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
            "WaterRippleImage shader error:",
            gl.getShaderInfoLog(shader)
        )
        gl.deleteShader(shader)
        return null
    }
    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
): WebGLProgram | null {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return null

    const program = gl.createProgram()
    if (!program) return null
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(
            "WaterRippleImage link error:",
            gl.getProgramInfoLog(program)
        )
        gl.deleteProgram(program)
        return null
    }
    return program
}

function parseColor(
    ctx: CanvasRenderingContext2D,
    colorStr: string
): [number, number, number] {
    try {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = "#000000"
        ctx.fillStyle = colorStr
        ctx.fillRect(0, 0, 1, 1)
        const data = ctx.getImageData(0, 0, 1, 1).data
        const alpha = data[3] / 255
        return [
            (data[0] / 255) * alpha,
            (data[1] / 255) * alpha,
            (data[2] / 255) * alpha,
        ]
    } catch (e) {
        return [0.7, 0.7, 0.7]
    }
}

// ---------------------------------------------------------------------------
// Component

export default function WaterRippleImage(props: WaterRippleImageProps) {
    const {
        image,
        objectFit,
        borderRadius,
        hoverRipples,
        hoverStrength,
        clickStrength,
        rippleSpeed,
        rippleSize,
        hoverFade,
        clickFade,
        highlightColor,
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const isRestricted = RenderTarget.hasRestrictions()
    const useStaticFallback = isStaticRenderer || isRestricted

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const colorCanvasRef = useRef<HTMLCanvasElement | null>(null)

    const glRef = useRef<WebGLRenderingContext | null>(null)
    const textureRef = useRef<WebGLTexture | null>(null)
    const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({})
    const imageSizeRef = useRef<[number, number]>([1, 1])

    const ripplesRef = useRef<Ripple[]>([])
    const rafRef = useRef<number | null>(null)
    const startTimeRef = useRef<number>(0)
    const lastHoverRef = useRef<number>(0)

    const originArrRef = useRef<Float32Array>(new Float32Array(MAX_RIPPLES * 2))
    const startArrRef = useRef<Float32Array>(new Float32Array(MAX_RIPPLES))
    const strengthArrRef = useRef<Float32Array>(new Float32Array(MAX_RIPPLES))
    const speedArrRef = useRef<Float32Array>(new Float32Array(MAX_RIPPLES))
    const decayArrRef = useRef<Float32Array>(new Float32Array(MAX_RIPPLES))

    // Latest prop-derived values, read by event handlers & the render loop
    // without forcing those callbacks to be re-created on every prop change.
    const tunablesRef = useRef({
        hoverRipples,
        hoverStrength,
        clickStrength,
        rippleSpeed,
        frequency: FREQUENCY_CONSTANT / Math.max(1, rippleSize),
        hoverDecay: Math.log(50) / Math.max(0.05, hoverFade),
        clickDecay: Math.log(50) / Math.max(0.05, clickFade),
        objectFit: objectFit === "contain" ? 1 : 0,
        highlight: [0.7, 0.7, 0.7] as [number, number, number],
        maxLife: Math.max(hoverFade, clickFade) * 2.2,
    })

    const render = useCallback(() => {
        const gl = glRef.current
        const canvas = canvasRef.current
        const uniforms = uniformsRef.current
        if (!gl || !canvas || !textureRef.current) return

        const t = (performance.now() - startTimeRef.current) / 1000
        const tunables = tunablesRef.current

        ripplesRef.current = ripplesRef.current.filter(
            (r) => t - r.start < tunables.maxLife
        )
        const ripples = ripplesRef.current

        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current)
        gl.uniform1i(uniforms.u_image, 0)
        gl.uniform2f(
            uniforms.u_imageSize,
            imageSizeRef.current[0],
            imageSizeRef.current[1]
        )
        gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height)
        gl.uniform1f(uniforms.u_time, t)
        gl.uniform1f(uniforms.u_frequency, tunables.frequency)
        gl.uniform1f(uniforms.u_objectFit, tunables.objectFit)
        gl.uniform3f(
            uniforms.u_highlight,
            tunables.highlight[0],
            tunables.highlight[1],
            tunables.highlight[2]
        )

        const origin = originArrRef.current
        const start = startArrRef.current
        const strength = strengthArrRef.current
        const speed = speedArrRef.current
        const decay = decayArrRef.current

        const n = Math.min(ripples.length, MAX_RIPPLES)
        origin.fill(0)
        start.fill(-1000)
        strength.fill(0)
        speed.fill(0)
        decay.fill(0)
        for (let i = 0; i < n; i++) {
            const r = ripples[i]
            origin[i * 2] = r.x
            origin[i * 2 + 1] = r.y
            start[i] = r.start
            strength[i] = r.strength
            speed[i] = r.speed
            decay[i] = r.decay
        }

        gl.uniform1i(uniforms.u_rippleCount, n)
        gl.uniform2fv(uniforms.u_origin, origin)
        gl.uniform1fv(uniforms.u_start, start)
        gl.uniform1fv(uniforms.u_strength, strength)
        gl.uniform1fv(uniforms.u_speed, speed)
        gl.uniform1fv(uniforms.u_decay, decay)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }, [])

    const loop = useCallback(() => {
        render()
        if (ripplesRef.current.length > 0) {
            rafRef.current = requestAnimationFrame(loop)
        } else {
            rafRef.current = null
        }
    }, [render])

    const ensureLoopRunning = useCallback(() => {
        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(loop)
        }
    }, [loop])

    const addRipple = useCallback(
        (
            x: number,
            y: number,
            strength: number,
            speedMult: number,
            decay: number
        ) => {
            const t = (performance.now() - startTimeRef.current) / 1000
            const list = ripplesRef.current
            if (list.length >= MAX_RIPPLES) list.shift()
            list.push({
                x,
                y,
                start: t,
                strength,
                speed: tunablesRef.current.rippleSpeed * speedMult,
                decay,
            })
            ensureLoopRunning()
        },
        [ensureLoopRunning]
    )

    const toUV = useCallback(
        (clientX: number, clientY: number): [number, number] => {
            const canvas = canvasRef.current
            if (!canvas) return [0.5, 0.5]
            const rect = canvas.getBoundingClientRect()
            const x = (clientX - rect.left) / rect.width
            const y = 1 - (clientY - rect.top) / rect.height
            return [x, y]
        },
        []
    )

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!tunablesRef.current.hoverRipples) return
            const now = performance.now()
            if (now - lastHoverRef.current < HOVER_THROTTLE_MS) return
            lastHoverRef.current = now
            const [x, y] = toUV(e.clientX, e.clientY)
            addRipple(
                x,
                y,
                tunablesRef.current.hoverStrength,
                1.0,
                tunablesRef.current.hoverDecay
            )
        },
        [toUV, addRipple]
    )

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            const [x, y] = toUV(e.clientX, e.clientY)
            addRipple(
                x,
                y,
                tunablesRef.current.clickStrength,
                CLICK_SPEED_MULT,
                tunablesRef.current.clickDecay
            )
        },
        [toUV, addRipple]
    )

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        const gl = glRef.current
        if (!canvas || !container || !gl) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const rect = container.getBoundingClientRect()
        const w = Math.max(1, Math.round(rect.width * dpr))
        const h = Math.max(1, Math.round(rect.height * dpr))
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w
            canvas.height = h
            render()
        }
    }, [render])

    const loadImage = useCallback(
        (src: string) => {
            const gl = glRef.current
            const texture = textureRef.current
            if (!gl || !texture) return
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                const currentGl = glRef.current
                const currentTexture = textureRef.current
                if (!currentGl || !currentTexture) return
                currentGl.bindTexture(currentGl.TEXTURE_2D, currentTexture)
                currentGl.pixelStorei(currentGl.UNPACK_FLIP_Y_WEBGL, true)
                currentGl.texImage2D(
                    currentGl.TEXTURE_2D,
                    0,
                    currentGl.RGBA,
                    currentGl.RGBA,
                    currentGl.UNSIGNED_BYTE,
                    img
                )
                imageSizeRef.current = [
                    img.naturalWidth || 1,
                    img.naturalHeight || 1,
                ]
                render()
            }
            img.src = src
        },
        [render]
    )

    // Initialize WebGL once (skipped entirely on the static-render paths,
    // where there's no pointer to react to and no reason to pay for it).
    useEffect(() => {
        if (useStaticFallback) return
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: false,
            antialias: true,
        })
        if (!gl) return

        const program = createProgram(
            gl,
            VERTEX_SHADER,
            buildFragmentShader(MAX_RIPPLES)
        )
        if (!program) return

        gl.useProgram(program)

        const posBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )
        const posLoc = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([16, 16, 18, 255])
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        glRef.current = gl
        textureRef.current = texture
        uniformsRef.current = {
            u_image: gl.getUniformLocation(program, "u_image"),
            u_imageSize: gl.getUniformLocation(program, "u_imageSize"),
            u_resolution: gl.getUniformLocation(program, "u_resolution"),
            u_time: gl.getUniformLocation(program, "u_time"),
            u_rippleCount: gl.getUniformLocation(program, "u_rippleCount"),
            u_frequency: gl.getUniformLocation(program, "u_frequency"),
            u_objectFit: gl.getUniformLocation(program, "u_objectFit"),
            u_highlight: gl.getUniformLocation(program, "u_highlight"),
            u_origin: gl.getUniformLocation(program, "u_origin[0]"),
            u_start: gl.getUniformLocation(program, "u_start[0]"),
            u_strength: gl.getUniformLocation(program, "u_strength[0]"),
            u_speed: gl.getUniformLocation(program, "u_speed[0]"),
            u_decay: gl.getUniformLocation(program, "u_decay[0]"),
        }

        startTimeRef.current = performance.now()
        resizeCanvas()
        render()

        const handleContextLost = (e: Event) => {
            e.preventDefault()
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
        canvas.addEventListener("webglcontextlost", handleContextLost)

        return () => {
            canvas.removeEventListener("webglcontextlost", handleContextLost)
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            gl.deleteTexture(texture)
            gl.deleteProgram(program)
            gl.deleteBuffer(posBuffer)
            glRef.current = null
            textureRef.current = null
        }
    }, [useStaticFallback, render, resizeCanvas])

    // Reload the texture whenever the selected image changes (this also
    // covers the initial load, since effects run after the first render).
    useEffect(() => {
        if (useStaticFallback) return
        if (image?.src) loadImage(image.src)
    }, [image?.src, useStaticFallback, loadImage])

    // A reusable 1x1 offscreen canvas for resolving the highlight color
    // (handles hex, rgba, hsl, named colors — anything a browser accepts).
    useEffect(() => {
        if (!colorCanvasRef.current) {
            const c = document.createElement("canvas")
            c.width = 1
            c.height = 1
            colorCanvasRef.current = c
        }
    }, [])

    // Keep tunablesRef in sync with the latest props, and repaint
    // immediately so tweaking sliders in Framer updates live even when
    // no ripple is currently animating.
    useEffect(() => {
        const ctx = colorCanvasRef.current?.getContext("2d")
        const highlight = ctx
            ? parseColor(ctx, highlightColor)
            : tunablesRef.current.highlight

        tunablesRef.current = {
            hoverRipples,
            hoverStrength,
            clickStrength,
            rippleSpeed,
            frequency: FREQUENCY_CONSTANT / Math.max(1, rippleSize),
            hoverDecay: Math.log(50) / Math.max(0.05, hoverFade),
            clickDecay: Math.log(50) / Math.max(0.05, clickFade),
            objectFit: objectFit === "contain" ? 1 : 0,
            highlight,
            maxLife: Math.max(hoverFade, clickFade) * 2.2,
        }

        if (!useStaticFallback && ripplesRef.current.length === 0) render()
    }, [
        hoverRipples,
        hoverStrength,
        clickStrength,
        rippleSpeed,
        rippleSize,
        hoverFade,
        clickFade,
        objectFit,
        highlightColor,
        useStaticFallback,
        render,
    ])

    // Keep the drawing buffer matched to the element's rendered size.
    useEffect(() => {
        if (useStaticFallback) return
        const container = containerRef.current
        if (!container || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => resizeCanvas())
        ro.observe(container)
        return () => ro.disconnect()
    }, [useStaticFallback, resizeCanvas])

    // ---- Render ----

    if (!image?.src) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#1a1a1c",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    fontFamily: "system-ui, sans-serif",
                    textAlign: "center",
                    padding: 16,
                    boxSizing: "border-box",
                    ...style,
                }}
            >
                Add an image
            </div>
        )
    }

    if (useStaticFallback) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius,
                    overflow: "hidden",
                    ...style,
                }}
            >
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={image.alt || ""}
                    sizes="100vw"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit,
                        display: "block",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            role="img"
            aria-label={image.alt || ""}
            style={{
                width: "100%",
                height: "100%",
                borderRadius,
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                touchAction: "pan-y",
                ...style,
            }}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

WaterRippleImage.displayName = "Water Ripple Image"

addPropertyControls(WaterRippleImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 200,
        defaultValue: 24,
    },
    hoverRipples: {
        type: ControlType.Boolean,
        title: "Hover Ripples",
        defaultValue: true,
    },
    hoverStrength: {
        type: ControlType.Number,
        title: "Hover Strength",
        min: 0,
        max: 0.08,
        step: 0.002,
        defaultValue: 0.022,
        hidden(props: WaterRippleImageProps) {
            return !props.hoverRipples
        },
    },
    clickStrength: {
        type: ControlType.Number,
        title: "Click Strength",
        min: 0,
        max: 0.2,
        step: 0.005,
        defaultValue: 0.07,
    },
    rippleSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.2,
        max: 2.5,
        step: 0.05,
        defaultValue: 0.9,
    },
    rippleSize: {
        type: ControlType.Number,
        title: "Ripple Size",
        min: 4,
        max: 40,
        step: 1,
        defaultValue: 16,
    },
    hoverFade: {
        type: ControlType.Number,
        title: "Hover Fade",
        min: 0.15,
        max: 2,
        step: 0.05,
        defaultValue: 0.6,
    },
    clickFade: {
        type: ControlType.Number,
        title: "Click Fade",
        min: 0.4,
        max: 4,
        step: 0.1,
        defaultValue: 1.8,
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: "rgba(255, 255, 255, 0.7)",
    },
})
