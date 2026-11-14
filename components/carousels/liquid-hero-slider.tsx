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

import { useInView } from "framer-motion"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

type InteractionMode = "drag" | "arrows"

type FitMode = "cover" | "contain"

type TransitionEffect = "liquid" | "swirl" | "wave" | "zoomBlur"

interface Props {
    images: ResponsiveImageLike[]
    initialIndex: number

    fit: FitMode
    backgroundColor: string

    webgl: boolean
    transitionEffect: TransitionEffect
    strength: number
    rippleScale: number
    rippleSpeed: number

    duration: number

    interaction: InteractionMode
    dragThreshold: number
    showArrows: boolean
    showPagination: boolean

    autoplay: boolean
    autoplayDelay: number
    pauseOnHover: boolean

    borderRadius: string
    style?: React.CSSProperties
}

type GLResources = {
    canvas: HTMLCanvasElement
    gl: WebGLRenderingContext
    program: WebGLProgram
    buffer: WebGLBuffer
    aPos: number
    uTex0: WebGLUniformLocation
    uTex1: WebGLUniformLocation
    uProgress: WebGLUniformLocation
    uStrength: WebGLUniformLocation
    uTime: WebGLUniformLocation
    uResolution: WebGLUniformLocation
    uFitMode: WebGLUniformLocation
    uImg0Aspect: WebGLUniformLocation
    uImg1Aspect: WebGLUniformLocation
    uRippleScale: WebGLUniformLocation
    uTransitionEffect: WebGLUniformLocation
    tex0: WebGLTexture
    tex1: WebGLTexture
    img0?: HTMLImageElement
    img1?: HTMLImageElement
    w: number
    h: number
}

const DEFAULT_IMAGES: ResponsiveImageLike[] = [
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2 - Purple",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
]

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function normalizeImages(input?: ResponsiveImageLike[]) {
    const arr = (input ?? [])
        .filter(Boolean)
        .filter((x) => typeof x?.src === "string" && x.src.length > 0)
    return arr.length >= 1 ? arr : DEFAULT_IMAGES
}

function isFixedSize(style?: React.CSSProperties) {
    const w = style?.width
    const h = style?.height
    return { fixedW: w !== "100%", fixedH: h !== "100%" }
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) throw new Error("WebGL: shader create failed")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) || "Unknown shader error"
        gl.deleteShader(shader)
        throw new Error(info)
    }
    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    const program = gl.createProgram()
    if (!program) throw new Error("WebGL: program create failed")
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info =
            gl.getProgramInfoLog(program) || "Unknown program link error"
        gl.deleteProgram(program)
        throw new Error(info)
    }
    return program
}

function createTexture(gl: WebGLRenderingContext) {
    const tex = gl.createTexture()
    if (!tex) throw new Error("WebGL: texture create failed")
    gl.bindTexture(gl.TEXTURE_2D, tex)
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
    gl.bindTexture(gl.TEXTURE_2D, null)
    return tex
}

function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("Image load failed"))
        img.src = src
    })
}

function uploadTexture(
    gl: WebGLRenderingContext,
    tex: WebGLTexture,
    img: HTMLImageElement
) {
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.bindTexture(gl.TEXTURE_2D, null)
}

const VS = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

// Liquid distortion that peaks during transition (u_progress) but remains visible.
// Includes strong edge-fade so no top/bottom artifacts.
const FS = `
precision mediump float;

varying vec2 v_uv;

uniform sampler2D u_tex0;
uniform sampler2D u_tex1;

uniform float u_progress;
uniform float u_strength;
uniform float u_time;
uniform vec2 u_resolution;

uniform float u_fitMode; // 0=cover, 1=contain
uniform float u_img0Aspect;
uniform float u_img1Aspect;

uniform float u_rippleScale;
uniform float u_transitionEffect; // 0=liquid, 1=swirl, 2=wave, 3=zoomBlur

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec2 fitUV(vec2 uv, float imgAspect) {
  float containerAspect = u_resolution.x / max(1.0, u_resolution.y);
  
  vec2 result = uv;

  if (u_fitMode < 0.5) {
    // cover mode - fill the container, crop overflow
    if (imgAspect > containerAspect) {
      // image is wider - scale to fill height
      float scale = containerAspect / imgAspect;
      result.x = (uv.x - 0.5) * scale + 0.5;
    } else {
      // image is taller - scale to fill width
      float scale = imgAspect / containerAspect;
      result.y = (uv.y - 0.5) * scale + 0.5;
    }
  } else {
    // contain mode - fit inside container, show all
    if (imgAspect > containerAspect) {
      float scale = containerAspect / imgAspect;
      result.y = (uv.y - 0.5) / scale + 0.5;
    } else {
      float scale = imgAspect / containerAspect;
      result.x = (uv.x - 0.5) / scale + 0.5;
    }
  }

  return result;
}

vec4 safeSample(sampler2D t, vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0);
  }
  return texture2D(t, uv);
}

// Swirl effect
vec2 swirlUV(vec2 uv, float amount) {
  vec2 center = vec2(0.5, 0.5);
  vec2 offset = uv - center;
  float dist = length(offset);
  float angle = atan(offset.y, offset.x);
  angle += amount * (1.0 - dist) * 6.28318;
  return center + vec2(cos(angle), sin(angle)) * dist;
}

// Wave effect
vec2 waveUV(vec2 uv, float amount, float time) {
  float wave = sin(uv.y * 20.0 + time * 3.0) * amount;
  return vec2(uv.x + wave, uv.y);
}

// Zoom blur effect
vec4 zoomBlur(sampler2D tex, vec2 uv, float imgAspect, float amount) {
  vec2 center = vec2(0.5, 0.5);
  vec4 color = vec4(0.0);
  float total = 0.0;
  
  int samples = 12;
  for (int i = 0; i < 12; i++) {
    float scale = 1.0 + (float(i) / float(samples - 1)) * amount * 0.15;
    vec2 offset = (uv - center) * scale + center;
    vec2 fittedUV = fitUV(offset, imgAspect);
    color += safeSample(tex, fittedUV);
    total += 1.0;
  }
  
  return color / total;
}

void main() {
  float p = clamp(u_progress, 0.0, 1.0);
  float rf = max(0.25, u_rippleScale);

  float t = u_time;
  vec2 uv = v_uv;

  // Smooth edge fade to prevent artifacts - only at very edges
  float fadeWidth = 0.08;
  float edgeFade = smoothstep(0.0, fadeWidth, uv.x) * 
                   smoothstep(1.0, 1.0 - fadeWidth, uv.x) *
                   smoothstep(0.0, fadeWidth, uv.y) * 
                   smoothstep(1.0, 1.0 - fadeWidth, uv.y);

  // Smooth transition curve that peaks dramatically in the middle
  float transitionCurve = sin(p * 3.14159265);
  transitionCurve = pow(transitionCurve, 0.6) * 4.0;

  vec4 color0, color1;
  
  // LIQUID DISTORTION EFFECT
  if (u_transitionEffect < 0.5) {
    // Multi-layered noise for smooth water-like effect
    float n1 = noise(uv * (5.0 * rf) + vec2(t * 0.15, t * 0.12));
    float n2 = noise(uv * (10.0 * rf) + vec2(-t * 0.1, t * 0.14));
    float n3 = noise(uv * (20.0 * rf) + vec2(t * 0.08, -t * 0.09));
    float n = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);

    // Smooth flowing waves like water surface
    float wave1 = sin((uv.y * 10.0 + t * 1.2) + n * 4.0);
    float wave2 = sin((uv.x * 9.0 - t * 0.9) + n * 3.5);
    float wave3 = sin((uv.x * 6.0 + uv.y * 7.0 + t * 0.7) + n * 3.0);

    // Combine waves for organic water motion
    vec2 disp = vec2(wave1 + wave3 * 0.6, wave2 + wave3 * 0.6);
    disp += (n - 0.5) * 2.5;

    // Add circular ripple pattern from center
    vec2 center = vec2(0.5, 0.5);
    float dist = length(uv - center);
    float ripple = sin(dist * 25.0 * rf - t * 2.5) * exp(-dist * 2.5);
    disp += vec2(ripple) * 0.4;

    // Smooth directional flow
    vec2 dir = normalize(vec2(cos(t * 0.4), sin(t * 0.35)));
    disp = disp * 0.7 + dir * (n - 0.5) * 0.5;
    
    // Apply smooth displacement with edge fade
    float amplitude = u_strength * 35.0 * transitionCurve * edgeFade;

    // Apply displacement THEN fit
    vec2 uv0 = fitUV(uv + disp * amplitude * 0.02, max(0.0001, u_img0Aspect));
    vec2 uv1 = fitUV(uv - disp * amplitude * 0.02, max(0.0001, u_img1Aspect));

    color0 = safeSample(u_tex0, uv0);
    color1 = safeSample(u_tex1, uv1);
  }
  // SWIRL EFFECT
  else if (u_transitionEffect < 1.5) {
    float swirlAmount = transitionCurve * u_strength * 3.0;
    vec2 uv0 = fitUV(swirlUV(uv, swirlAmount), max(0.0001, u_img0Aspect));
    vec2 uv1 = fitUV(swirlUV(uv, -swirlAmount), max(0.0001, u_img1Aspect));
    
    color0 = safeSample(u_tex0, uv0);
    color1 = safeSample(u_tex1, uv1);
  }
  // WAVE EFFECT
  else if (u_transitionEffect < 2.5) {
    float waveAmount = transitionCurve * u_strength * 0.15;
    vec2 uv0 = fitUV(waveUV(uv, waveAmount, t), max(0.0001, u_img0Aspect));
    vec2 uv1 = fitUV(waveUV(uv, -waveAmount, t + 3.14159), max(0.0001, u_img1Aspect));
    
    color0 = safeSample(u_tex0, uv0);
    color1 = safeSample(u_tex1, uv1);
  }
  // ZOOM BLUR EFFECT
  else {
    float zoomAmount = transitionCurve * u_strength * 2.0;
    color0 = zoomBlur(u_tex0, uv, max(0.0001, u_img0Aspect), zoomAmount * (1.0 - p));
    color1 = zoomBlur(u_tex1, uv, max(0.0001, u_img1Aspect), zoomAmount * p);
  }

  // Smooth blend between images
  float blend = smoothstep(0.0, 1.0, p);
  gl_FragColor = mix(color0, color1, blend);
}
`

/**
 * Liquid Distortion Hero Slider
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LiquidDistortionHeroSlider(props: Props) {
    const {
        images: imagesProp = DEFAULT_IMAGES,
        initialIndex,
        fit,
        backgroundColor,
        webgl,
        transitionEffect,
        strength,
        rippleScale,
        rippleSpeed,
        duration,
        interaction,
        dragThreshold,
        showArrows,
        showPagination,
        autoplay,
        autoplayDelay,
        pauseOnHover,
        borderRadius,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const images = React.useMemo(() => normalizeImages(imagesProp), [imagesProp])
    const imagesKey = React.useMemo(() => images.map((i) => i?.src || "").join("|"), [images])
    const count = images.length

    const safeInitial = clamp(Math.floor(initialIndex || 0), 0, Math.max(0, count - 1))

    const [index, setIndex] = React.useState<number>(safeInitial)
    const [targetIndex, setTargetIndex] = React.useState<number>(safeInitial)
    const [isAnimating, setIsAnimating] = React.useState(false)
    const [fallback2D, setFallback2D] = React.useState(false)
    const [glReady, setGlReady] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)

    const hostRef = React.useRef<HTMLElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const glRef = React.useRef<GLResources | null>(null)

    const rafRef = React.useRef<number | null>(null)
    const lastFrameRef = React.useRef<number | null>(null)

    const loadTokenRef = React.useRef(0)
    const navTokenRef = React.useRef(0)

    const progressRef = React.useRef(0)
    const progressTargetRef = React.useRef(0)

    const animRef = React.useRef<
        | null
        | {
              active: boolean
              start: number
              from: number
              to: number
              duration: number
              next: number
          }
    >(null)

    const dragRef = React.useRef<{
        active: boolean
        pointerId: number | null
        startX: number
        lastX: number
        dx: number
    }>({
        active: false,
        pointerId: null,
        startX: 0,
        lastX: 0,
        dx: 0,
    })

    const inView = useInView(hostRef as React.RefObject<Element>, {
        margin: "200px 0px 200px 0px",
        amount: 0.15,
    })

    const fitModeUniform = fit === "contain" ? 1 : 0

    const current = images[clamp(index, 0, count - 1)]
    const next = images[clamp(targetIndex, 0, count - 1)]

    const stopRAF = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        lastFrameRef.current = null
    }, [])

    const renderGL = React.useCallback(
        (timeMs: number) => {
            const res = glRef.current
            if (!res) return
            const { gl } = res

            const t = (timeMs || 0) * 0.001 * rippleSpeed
            const p = clamp(progressRef.current, 0, 1)

            gl.viewport(0, 0, res.w, res.h)
            gl.useProgram(res.program)

            gl.uniform1i(res.uTex0, 0)
            gl.uniform1i(res.uTex1, 1)
            gl.uniform1f(res.uProgress, p)
            gl.uniform1f(res.uStrength, strength)
            gl.uniform1f(res.uTime, t)
            gl.uniform2f(res.uResolution, res.w, res.h)
            gl.uniform1f(res.uFitMode, fitModeUniform)
            gl.uniform1f(res.uRippleScale, Math.max(0.25, rippleScale))
            
            // Map transition effect to uniform value
            const effectMap = {
                liquid: 0,
                swirl: 1,
                wave: 2,
                zoomBlur: 3,
            }
            gl.uniform1f(res.uTransitionEffect, effectMap[transitionEffect] || 0)

            const a0 = res.img0 ? res.img0.naturalWidth / Math.max(1, res.img0.naturalHeight) : 1
            const a1 = res.img1 ? res.img1.naturalWidth / Math.max(1, res.img1.naturalHeight) : 1
            gl.uniform1f(res.uImg0Aspect, a0)
            gl.uniform1f(res.uImg1Aspect, a1)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, res.tex0)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, res.tex1)

            gl.bindBuffer(gl.ARRAY_BUFFER, res.buffer)
            gl.enableVertexAttribArray(res.aPos)
            gl.vertexAttribPointer(res.aPos, 2, gl.FLOAT, false, 0, 0)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        },
        [fitModeUniform, rippleScale, rippleSpeed, strength, transitionEffect]
    )

    const loop = React.useCallback(
        (timeMs: number) => {
            const allowGL = !isStatic && webgl && !fallback2D && glReady
            const a = animRef.current
            const d = dragRef.current

            const allowRun =
                allowGL &&
                (inView || a?.active || d.active || progressRef.current !== progressTargetRef.current)

            const last = lastFrameRef.current
            lastFrameRef.current = timeMs
            const dt = last == null ? 16.7 : Math.max(0, Math.min(64, timeMs - last))

            // Smooth follow for drag target.
            if (interaction === "drag" && d.active && !a?.active) {
                const target = clamp(progressTargetRef.current, 0, 1)
                const k = 1 - Math.pow(0.001, dt / 16.7)
                progressRef.current = lerp(progressRef.current, target, k)
            }

            // Animate release / arrow transitions
            if (a && a.active) {
                const t = clamp((timeMs - a.start) / Math.max(1, a.duration), 0, 1)
                const e = easeInOutCubic(t)
                progressRef.current = lerp(a.from, a.to, e)
                progressTargetRef.current = progressRef.current

                if (t >= 1) {
                    a.active = false
                    const nextIndex = a.next
                    
                    // Reset progress immediately
                    progressRef.current = 0
                    progressTargetRef.current = 0
                    
                    // Update state
                    React.startTransition(() => {
                        setIndex(nextIndex)
                        setTargetIndex(nextIndex)
                        setIsAnimating(false)
                    })
                    
                    // Reload textures to show only current image
                    if (glRef.current) {
                        const preloadNext = (nextIndex + 1) % count
                        void setTextures(nextIndex, preloadNext)
                    }
                } else {
                    React.startTransition(() => setIsAnimating(true))
                }
            }

            if (allowRun) renderGL(timeMs)

            const keepGoing =
                allowGL &&
                (
                    (a && a.active) ||
                    d.active ||
                    progressRef.current !== progressTargetRef.current ||
                    autoplay
                )

            if (typeof window !== "undefined" && keepGoing) {
                rafRef.current = window.requestAnimationFrame(loop)
            } else {
                rafRef.current = null
                lastFrameRef.current = null
            }
        },
        [autoplay, fallback2D, glReady, inView, interaction, isStatic, renderGL, webgl]
    )

    const ensureLoop = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) return
        rafRef.current = window.requestAnimationFrame(loop)
    }, [loop])

    const teardownGL = React.useCallback(() => {
        stopRAF()
        React.startTransition(() => setGlReady(false))
        const r = glRef.current
        glRef.current = null
        if (!r) return
        const { gl } = r
        try {
            gl.deleteTexture(r.tex0)
            gl.deleteTexture(r.tex1)
            gl.deleteBuffer(r.buffer)
            gl.deleteProgram(r.program)
        } catch {
            // ignore
        }
    }, [stopRAF])

    const resizeGL = React.useCallback(() => {
        if (typeof window === "undefined") return
        const res = glRef.current
        if (!res) return
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
        const hostRect = hostRef.current?.getBoundingClientRect()
        const rect = hostRect && hostRect.width > 0 && hostRect.height > 0 ? hostRect : res.canvas.getBoundingClientRect()
        const w = Math.max(1, Math.floor(rect.width * dpr))
        const h = Math.max(1, Math.floor(rect.height * dpr))
        if (w === res.w && h === res.h) return
        res.w = w
        res.h = h
        res.canvas.width = w
        res.canvas.height = h
    }, [])

    const setTextures = React.useCallback(
        async (i0: number, i1: number) => {
            const res = glRef.current
            if (!res) return

            const token = ++loadTokenRef.current
            try {
                const a = images[clamp(i0, 0, count - 1)]
                const b = images[clamp(i1, 0, count - 1)]
                const [img0, img1] = await Promise.all([loadImage(a.src), loadImage(b.src)])
                if (token !== loadTokenRef.current) return
                
                res.img0 = img0
                res.img1 = img1
                uploadTexture(res.gl, res.tex0, img0)
                uploadTexture(res.gl, res.tex1, img1)

                resizeGL()

                React.startTransition(() => setGlReady(true))

                // Force a first frame
                const now = typeof performance !== "undefined" ? performance.now() : Date.now()
                renderGL(now)
                ensureLoop()
            } catch (err) {
                console.warn("WebGL texture loading failed:", err)
                React.startTransition(() => setFallback2D(true))
                teardownGL()
            }
        },
        [count, ensureLoop, images, renderGL, resizeGL, teardownGL]
    )

    const initGL = React.useCallback(async () => {
        if (typeof window === "undefined") return
        if (isStatic) return
        if (!webgl) return
        if (!canvasRef.current) return
        if (glRef.current) return

        try {
            const canvas = canvasRef.current
            const gl =
                (canvas.getContext("webgl", {
                    alpha: true,
                    antialias: true,
                    premultipliedAlpha: true,
                    preserveDrawingBuffer: false,
                }) ||
                    canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null

            if (!gl) {
                React.startTransition(() => setFallback2D(true))
                return
            }

            const program = createProgram(gl, VS, FS)
            gl.useProgram(program)

            const aPos = gl.getAttribLocation(program, "a_pos")
            const uTex0 = gl.getUniformLocation(program, "u_tex0")
            const uTex1 = gl.getUniformLocation(program, "u_tex1")
            const uProgress = gl.getUniformLocation(program, "u_progress")
            const uStrength = gl.getUniformLocation(program, "u_strength")
            const uTime = gl.getUniformLocation(program, "u_time")
            const uResolution = gl.getUniformLocation(program, "u_resolution")
            const uFitMode = gl.getUniformLocation(program, "u_fitMode")
            const uImg0Aspect = gl.getUniformLocation(program, "u_img0Aspect")
            const uImg1Aspect = gl.getUniformLocation(program, "u_img1Aspect")
            const uRippleScale = gl.getUniformLocation(program, "u_rippleScale")
            const uTransitionEffect = gl.getUniformLocation(program, "u_transitionEffect")

            if (
                !uTex0 ||
                !uTex1 ||
                !uProgress ||
                !uStrength ||
                !uTime ||
                !uResolution ||
                !uFitMode ||
                !uImg0Aspect ||
                !uImg1Aspect ||
                !uRippleScale ||
                !uTransitionEffect
            ) {
                React.startTransition(() => setFallback2D(true))
                return
            }

            const buffer = gl.createBuffer()
            if (!buffer) throw new Error("WebGL: buffer create failed")
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

            const tex0 = createTexture(gl)
            const tex1 = createTexture(gl)

            glRef.current = {
                canvas,
                gl,
                program,
                buffer,
                aPos,
                uTex0,
                uTex1,
                uProgress,
                uStrength,
                uTime,
                uResolution,
                uFitMode,
                uImg0Aspect,
                uImg1Aspect,
                uRippleScale,
                uTransitionEffect,
                tex0,
                tex1,
                w: 1,
                h: 1,
            }

            resizeGL()

            // initial textures
            await setTextures(index, targetIndex)
        } catch {
            React.startTransition(() => setFallback2D(true))
            teardownGL()
        }
    }, [index, isStatic, resizeGL, setTextures, targetIndex, teardownGL, webgl])

    // init/teardown WebGL
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        if (!webgl || fallback2D) {
            React.startTransition(() => setGlReady(false))
            return
        }

        initGL()
        return () => teardownGL()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webgl, fallback2D, isStatic])

    // ResizeObserver
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        if (!webgl || fallback2D) return
        if (!hostRef.current) return

        const ResizeObserverImpl = (window as any).ResizeObserver
        if (typeof ResizeObserverImpl !== "function") return

        const ro = new ResizeObserverImpl(() => {
            resizeGL()
            ensureLoop()
        })

        ro.observe(hostRef.current)
        return () => ro.disconnect()
    }, [ensureLoop, fallback2D, isStatic, resizeGL, webgl])

    // keep indices in range when config changes
    React.useEffect(() => {
        const nextSafe = clamp(index, 0, Math.max(0, count - 1))
        const nextTargetSafe = clamp(targetIndex, 0, Math.max(0, count - 1))
        if (nextSafe !== index || nextTargetSafe !== targetIndex) {
            React.startTransition(() => {
                setIndex(nextSafe)
                setTargetIndex(nextTargetSafe)
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count])

    // respond to images list changes
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        if (!webgl || fallback2D) return
        if (!glRef.current) return

        const safeI = clamp(index, 0, Math.max(0, count - 1))
        
        // Reset animation state when images change
        animRef.current = null
        progressRef.current = 0
        progressTargetRef.current = 0
        
        React.startTransition(() => {
            setIsAnimating(false)
            setIndex(safeI)
            setTargetIndex(safeI)
        })
        
        // Load current image in both slots initially
        void setTextures(safeI, (safeI + 1) % count)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imagesKey])

    // initialIndex changes
    React.useEffect(() => {
        const nextSafe = clamp(Math.floor(initialIndex || 0), 0, Math.max(0, count - 1))
        if (nextSafe !== index && !isAnimating) {
            React.startTransition(() => {
                setIndex(nextSafe)
                setTargetIndex(nextSafe)
            })
            progressRef.current = 0
            progressTargetRef.current = 0
            if (typeof window !== "undefined" && !isStatic && webgl && !fallback2D && glRef.current) {
                void setTextures(nextSafe, nextSafe)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialIndex, count])

    const goTo = React.useCallback(
        async (nextIdx: number) => {
            if (count <= 1) return
            if (isAnimating) return

            const n = ((nextIdx % count) + count) % count
            if (n === index) return

            // cancel any previous nav in-flight
            const navToken = ++navTokenRef.current

            React.startTransition(() => {
                setIsAnimating(true)
                setTargetIndex(n)
            })

            const allowGL = typeof window !== "undefined" && !isStatic && webgl && !fallback2D && glRef.current

            if (allowGL) {
                // Ensure textures correspond to (index -> n) BEFORE anim starts
                await setTextures(index, n)
                if (navToken !== navTokenRef.current) return
            }

            // Start from 0 progress
            progressRef.current = 0
            progressTargetRef.current = 0

            const start = typeof performance !== "undefined" ? performance.now() : Date.now()
            animRef.current = {
                active: true,
                start,
                from: 0,
                to: 1,
                duration: Math.max(200, duration),
                next: n,
            }

            ensureLoop()
        },
        [count, duration, ensureLoop, fallback2D, index, isAnimating, isStatic, setTextures, webgl]
    )

    const goNext = React.useCallback(() => goTo(index + 1), [goTo, index])
    const goPrev = React.useCallback(() => goTo(index - 1), [goTo, index])

    // Autoplay
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        if (!autoplay) return
        if (count <= 1) return
        if (!inView) return
        if (pauseOnHover && hovered) return
        if (isAnimating) return

        const id = window.setTimeout(() => goNext(), Math.max(400, autoplayDelay)) as unknown as number
        return () => window.clearTimeout(id)
    }, [autoplay, autoplayDelay, count, goNext, hovered, inView, isAnimating, isStatic, pauseOnHover])

    const onPointerDown = React.useCallback(
        async (e: React.PointerEvent) => {
            if (interaction !== "drag") return
            if (count <= 1) return
            if (isAnimating) return

            const el = hostRef.current
            if (!el) return

            el.setPointerCapture?.(e.pointerId)

            dragRef.current = {
                active: true,
                pointerId: e.pointerId,
                startX: e.clientX,
                lastX: e.clientX,
                dx: 0,
            }

            // preload next on drag start
            const n = (index + 1) % count
            React.startTransition(() => setTargetIndex(n))

            const allowGL = typeof window !== "undefined" && !isStatic && webgl && !fallback2D && glRef.current
            if (allowGL) {
                await setTextures(index, n)
            }

            // Start from 0
            progressRef.current = 0
            progressTargetRef.current = 0
            ensureLoop()
        },
        [count, ensureLoop, fallback2D, index, interaction, isAnimating, isStatic, setTextures, webgl]
    )

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (interaction !== "drag") return
            const d = dragRef.current
            if (!d.active) return
            const el = hostRef.current
            if (!el) return

            const rect = el.getBoundingClientRect()
            const w = Math.max(1, rect.width)

            d.lastX = e.clientX
            d.dx = d.lastX - d.startX

            const raw = clamp(-d.dx / w, 0, 1)
            progressTargetRef.current = raw
            ensureLoop()
        },
        [ensureLoop, interaction]
    )

    const onPointerUp = React.useCallback(
        (e: React.PointerEvent) => {
            if (interaction !== "drag") return
            const d = dragRef.current
            if (!d.active) return

            d.active = false

            const el = hostRef.current
            if (el) el.releasePointerCapture?.(e.pointerId)

            const raw = clamp(progressRef.current, 0, 1)
            progressTargetRef.current = raw

            const shouldAdvance = raw >= clamp(dragThreshold, 0.05, 0.95)
            const to = shouldAdvance ? 1 : 0
            const nextIdx = shouldAdvance ? (index + 1) % count : index

            React.startTransition(() => setIsAnimating(true))

            const start = typeof performance !== "undefined" ? performance.now() : Date.now()
            animRef.current = {
                active: true,
                start,
                from: raw,
                to,
                duration: Math.max(180, duration * 0.7),
                next: nextIdx,
            }

            ensureLoop()
        },
        [count, dragThreshold, duration, ensureLoop, index, interaction]
    )

    const showGL = !isStatic && webgl && !fallback2D && glReady

    const { fixedW, fixedH } = isFixedSize(style)

    const rootStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor,
        borderRadius,
        userSelect: "none",
        touchAction: interaction === "drag" ? "pan-y" : "auto",
        ...(fixedW ? {} : { minWidth: 280 }),
        ...(fixedH ? {} : { minHeight: 180 }),
        ...style,
    }

    const imgStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit,
        display: "block",
    }

    const buttonStyle: React.CSSProperties = {
        appearance: "none",
        WebkitAppearance: "none",
        border: "none",
        outline: "none",
        padding: 10,
        width: 44,
        height: 44,
        borderRadius: 999,
        background: "rgba(0,0,0,0.35)",
        color: "#fff",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    }

    const dotWrapStyle: React.CSSProperties = {
        position: "absolute",
        left: 14,
        right: 14,
        bottom: 14,
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
    }

    return (
        <section
            ref={hostRef}
            aria-roledescription="carousel"
            aria-label="Liquid Distortion Hero Slider"
            style={rootStyle}
            onMouseEnter={() => {
                if (pauseOnHover) React.startTransition(() => setHovered(true))
            }}
            onMouseLeave={() => {
                if (pauseOnHover) React.startTransition(() => setHovered(false))
            }}
        >
            <img
                src={current?.src}
                srcSet={current?.srcSet}
                alt={current?.alt || ""}
                style={{
                    ...imgStyle,
                    opacity: showGL ? 0 : 1,
                    transition: "opacity 200ms ease",
                }}
                draggable={false}
            />

            {!showGL && targetIndex !== index && (
                <img
                    src={next?.src}
                    srcSet={next?.srcSet}
                    alt={next?.alt || ""}
                    style={{
                        ...imgStyle,
                        opacity: isAnimating ? 1 : 0,
                        transition: `opacity ${Math.max(180, duration)}ms ease`,
                    }}
                    draggable={false}
                />
            )}

            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: showGL ? "block" : "none",
                }}
            />

            <div
                role={interaction === "drag" ? "slider" : "group"}
                aria-label="Slide interaction surface"
                tabIndex={0}
                style={{
                    position: "absolute",
                    inset: 0,
                    cursor: interaction === "drag" ? "grab" : "default",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(e) => {
                    if (e.key === "ArrowRight") goNext()
                    if (e.key === "ArrowLeft") goPrev()
                    if (e.key === "Enter" && interaction === "arrows") goNext()
                }}
            />

            {showArrows && count > 1 && (
                <nav
                    aria-label="Slider controls"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            left: 14,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "auto",
                        }}
                    >
                        <button
                            type="button"
                            aria-label="Previous slide"
                            style={buttonStyle}
                            onClick={() => goPrev()}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M14.5 5L8 12l6.5 7"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            right: 14,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "auto",
                        }}
                    >
                        <button
                            type="button"
                            aria-label="Next slide"
                            style={buttonStyle}
                            onClick={() => goNext()}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M9.5 5L16 12l-6.5 7"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </nav>
            )}

            {showPagination && count > 1 && (
                <div style={dotWrapStyle} aria-hidden="true">
                    {images.slice(0, 12).map((_, i) => {
                        const active = i === index
                        return (
                            <div
                                key={i}
                                style={{
                                    width: active ? 18 : 7,
                                    height: 7,
                                    borderRadius: 999,
                                    background: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)",
                                    boxShadow: active ? "0 6px 18px rgba(0,0,0,0.20)" : "none",
                                    transition: "all 250ms ease",
                                }}
                            />
                        )
                    })}
                </div>
            )}
        </section>
    )
}

addPropertyControls(LiquidDistortionHeroSlider, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 12,
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
            },
        ],
    },
    initialIndex: {
        type: ControlType.Number,
        title: "Initial",
        defaultValue: 0,
        min: 0,
        max: 11,
        step: 1,
    },

    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },

    webgl: {
        type: ControlType.Boolean,
        title: "WebGL",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    transitionEffect: {
        type: ControlType.Enum,
        title: "Effect",
        options: ["liquid", "swirl", "wave", "zoomBlur"],
        optionTitles: ["Liquid", "Swirl", "Wave", "Zoom Blur"],
        defaultValue: "liquid",
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 0.12,
        min: 0,
        max: 0.35,
        step: 0.01,
    },
    rippleScale: {
        type: ControlType.Number,
        title: "Ripple Scale",
        defaultValue: 1,
        min: 0.5,
        max: 2.5,
        step: 0.05,
    },
    rippleSpeed: {
        type: ControlType.Number,
        title: "Ripple Speed",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1200,
        min: 400,
        max: 3000,
        step: 50,
        unit: "ms",
    },

    interaction: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["drag", "arrows"],
        optionTitles: ["Drag", "Arrows"],
        defaultValue: "drag",
        displaySegmentedControl: true,
    },
    dragThreshold: {
        type: ControlType.Number,
        title: "Drag Threshold",
        defaultValue: 0.22,
        min: 0.05,
        max: 0.75,
        step: 0.01,
        hidden: (p) => p.interaction !== "drag",
    },

    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showPagination: {
        type: ControlType.Boolean,
        title: "Pagination",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 3200,
        min: 800,
        max: 12000,
        step: 100,
        unit: "ms",
        hidden: (p) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => !p.autoplay,
    },

    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
})
