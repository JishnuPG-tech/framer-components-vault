/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 540
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import {
    Renderer,
    Program,
    Mesh,
    Uniform,
    PointCloud,
    GeometryAttribute,
    TransformFeedback,
    Texture,
    Vec2,
} from "wtc-gl"

// ─── Shaders ─────────────────────────────────────────────────────────────────

const PARTICLE_VERT = /* glsl */ `#version 300 es

in vec2 position;
layout(location=0) in vec4 a_posvel;
layout(location=1) in vec4 a_lifeseed;
layout(location=2) in vec3 a_color;

out vec4 v_posvel;
out vec4 v_lifeseed;
out vec3 v_color;
out float v_alpha;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_mouse_velocity;
uniform sampler2D u_image;
uniform float u_image_aspect;

uniform float u_noise_strength;
uniform float u_noise_scale;
uniform float u_noise_time_scale;
uniform float u_mouse_strength;
uniform float u_mouse_proximity;
uniform float u_damping;
uniform float u_point_size;
uniform float u_alpha_mult;
uniform float u_life_min;
uniform float u_life_max;

vec2 coverUv(vec2 uv) {
  float canvasAspect = u_resolution.x / u_resolution.y;
  float scale = (u_image_aspect > canvasAspect)
    ? canvasAspect / u_image_aspect
    : u_image_aspect / canvasAspect;
  vec2 axis = (u_image_aspect > canvasAspect) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  return (uv - 0.5) * (axis * scale + (1.0 - axis)) + 0.5;
}

#define MOD3 vec3(.1031,.11369,.13787)
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * MOD3);
  p3 += dot(p3, p3.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3((p3.x+p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

float simplex_noise(vec3 p) {
  const float K1 = 0.333333333;
  const float K2 = 0.166666667;
  vec3 i  = floor(p + (p.x+p.y+p.z)*K1);
  vec3 d0 = p - (i - (i.x+i.y+i.z)*K2);
  vec3 e  = step(vec3(0.0), d0 - d0.yzx);
  vec3 i1 = e * (1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy*(1.0 - e);
  vec3 d1 = d0 - (i1 - K2);
  vec3 d2 = d0 - (i2 - 2.0*K2);
  vec3 d3 = d0 - (1.0 - 3.0*K2);
  vec4 h = max(0.6 - vec4(dot(d0,d0),dot(d1,d1),dot(d2,d2),dot(d3,d3)), 0.0);
  vec4 n = h*h*h*h * vec4(
    dot(d0, hash33(i)),
    dot(d1, hash33(i+i1)),
    dot(d2, hash33(i+i2)),
    dot(d3, hash33(i+1.0))
  );
  return dot(vec4(31.316), n);
}

void main() {
  vec2  position = a_posvel.xy;
  vec2  velocity = a_posvel.zw;
  float life     = a_lifeseed.x + 1.0;
  float maxLife  = a_lifeseed.y;
  vec2  seed     = a_lifeseed.zw;

  float angle      = simplex_noise(vec3(position * u_noise_scale, u_time * u_noise_time_scale + life * 0.05)) * 6.2831;
  vec2  noiseForce = vec2(cos(angle), sin(angle)) * u_noise_strength;

  vec2  toMouse    = position - u_mouse;
  float dist2      = dot(toMouse, toMouse);
  float proximity  = pow(u_mouse_proximity / (dist2 + u_mouse_proximity), 1.0);
  vec2  mouseForce = u_mouse_velocity * proximity * u_mouse_strength;

  velocity = velocity * u_damping + noiseForce + mouseForce;
  position = position + velocity;

  v_posvel   = vec4(position, velocity);
  v_lifeseed = vec4(life, maxLife, seed);
  v_color    = a_color;

  bool dead = life >= maxLife
           || position.x < 0.0 || position.x > u_resolution.x
           || position.y < 0.0 || position.y > u_resolution.y;

  if (dead) {
    vec3 h       = hash33(vec3(seed, u_time + life));
    vec2 newSeed = h.xy;
    vec2 uv      = fract(h.xy * 0.5 + 0.5);
    float newMaxLife = u_life_min + fract(h.z * 0.5 + 0.5) * (u_life_max - u_life_min);
    v_posvel     = vec4(uv * u_resolution, 0.0, 0.0);
    v_lifeseed   = vec4(0.0, newMaxLife, newSeed);
    v_color      = texture(u_image, coverUv(uv)).rgb;
  }

  float lifeRatio = v_lifeseed.x / max(v_lifeseed.y, 1.0);
  float alpha     = smoothstep(0.0, 0.05, lifeRatio) * (1.0 - smoothstep(0.85, 1.0, lifeRatio));
  gl_PointSize    = smoothstep(1.0, 0.5, lifeRatio) * u_point_size * alpha;
  v_alpha = alpha * u_alpha_mult;

  vec2 ndc  = v_posvel.xy / u_resolution * 2.0 - 1.0;
  ndc.y     = -ndc.y;
  gl_Position = vec4(ndc, 0.0, 1.0);
}`

const PARTICLE_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec4 v_lifeseed;
in vec3 v_color;
in float v_alpha;

out vec4 fragColor;

uniform float u_point_softness;

void main() {
  float dist  = length(gl_PointCoord - 0.5);
  float shape = 1.0 - smoothstep(u_point_softness, 0.5, dist);
  fragColor = vec4(v_color, v_alpha * shape);
}`

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimulationSettings {
    timeScale: number
    noiseStrength: number
    noiseScale: number
    noiseTimeScale: number
    mouseStrength: number
    mouseProximity: number
    mouseSmoothing: number
    mouseEnabled: boolean
    damping: number
    pointSize: number
    pointSoftness: number
    alphaMultiplier: number
    lifeMin: number
    lifeMax: number
    maxDpr: number
}

interface ImageParticlesOptions {
    container: HTMLElement
    image: string | HTMLImageElement | HTMLCanvasElement
    numParticles: number
    settings: SimulationSettings
    onReady?: () => void
}

// ─── WebGL engine ────────────────────────────────────────────────────────────

class ImageParticles {
    #playing = false
    #lastTime = 0

    numParticles: number
    settings: SimulationSettings
    onReady?: () => void
    renderer: Renderer
    gl: WebGL2RenderingContext
    canvasEl: HTMLCanvasElement
    u_time: Uniform
    u_resolution: Uniform
    u_mouse: Uniform
    u_mouse_velocity: Uniform
    u_image: Uniform
    u_image_aspect: Uniform
    u_noise_strength: Uniform
    u_noise_scale: Uniform
    u_noise_time_scale: Uniform
    u_mouse_strength: Uniform
    u_mouse_proximity: Uniform
    u_damping: Uniform
    u_point_size: Uniform
    u_point_softness: Uniform
    u_alpha_mult: Uniform
    u_life_min: Uniform
    u_life_max: Uniform
    particleMesh: Mesh | null = null
    transformFeedbacks: TransformFeedback | null = null

    _targetMouse = [-10000, -10000]
    _lastMouse = [-10000, -10000]
    _mouseVelocity = [0, 0]
    _resizeObserver: ResizeObserver | null = null
    _intersectionObserver: IntersectionObserver | null = null
    _visible = true

    constructor({
        container,
        image,
        numParticles,
        settings,
        onReady,
    }: ImageParticlesOptions) {
        this.numParticles = numParticles
        this.settings = settings
        this.onReady = onReady

        this.renderer = new Renderer({
            dpr: Math.min(
                typeof window !== "undefined" ? window.devicePixelRatio : 1,
                settings.maxDpr
            ),
            alpha: true,
        })
        this.gl = this.renderer.gl

        this.gl.depthMask(false)
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

        const canvas = this.gl.canvas as HTMLCanvasElement
        this.canvasEl = canvas
        // Start invisible — reveal is driven by CSS transition triggered in loadImage.
        canvas.style.cssText =
            "display:block;width:100%;height:100%;position:absolute;inset:0;touch-action:none;opacity:0;"
        container.appendChild(canvas)

        this.u_time = new Uniform({ name: "u_time", value: 0, kind: "float" })
        this.u_resolution = new Uniform({
            name: "u_resolution",
            value: [1, 1],
            kind: "float_vec2",
        })
        this.u_mouse = new Uniform({
            name: "u_mouse",
            value: [0, 0],
            kind: "float_vec2",
        })
        this.u_mouse_velocity = new Uniform({
            name: "u_mouse_velocity",
            value: [0, 0],
            kind: "float_vec2",
        })
        this.u_image = new Uniform({
            name: "u_image",
            value: null,
            kind: "texture",
        })
        this.u_image_aspect = new Uniform({
            name: "u_image_aspect",
            value: 1.0,
            kind: "float",
        })
        this.u_noise_strength = new Uniform({
            name: "u_noise_strength",
            value: settings.noiseStrength,
            kind: "float",
        })
        this.u_noise_scale = new Uniform({
            name: "u_noise_scale",
            value: settings.noiseScale,
            kind: "float",
        })
        this.u_noise_time_scale = new Uniform({
            name: "u_noise_time_scale",
            value: settings.noiseTimeScale,
            kind: "float",
        })
        this.u_mouse_strength = new Uniform({
            name: "u_mouse_strength",
            value: settings.mouseStrength,
            kind: "float",
        })
        this.u_mouse_proximity = new Uniform({
            name: "u_mouse_proximity",
            value: settings.mouseProximity,
            kind: "float",
        })
        this.u_damping = new Uniform({
            name: "u_damping",
            value: settings.damping,
            kind: "float",
        })
        this.u_point_size = new Uniform({
            name: "u_point_size",
            value: settings.pointSize,
            kind: "float",
        })
        this.u_point_softness = new Uniform({
            name: "u_point_softness",
            value: settings.pointSoftness,
            kind: "float",
        })
        this.u_alpha_mult = new Uniform({
            name: "u_alpha_mult",
            value: settings.alphaMultiplier,
            kind: "float",
        })
        this.u_life_min = new Uniform({
            name: "u_life_min",
            value: settings.lifeMin,
            kind: "float",
        })
        this.u_life_max = new Uniform({
            name: "u_life_max",
            value: settings.lifeMax,
            kind: "float",
        })

        this.render = this.render.bind(this)
        this.resize = this.resize.bind(this)
        this.pointerMove = this.pointerMove.bind(this)
        this.pointerLeave = this.pointerLeave.bind(this)

        this._resizeObserver = new ResizeObserver(this.resize)
        this._resizeObserver.observe(container)

        this._intersectionObserver = new IntersectionObserver(
            (entries) => {
                this._visible = entries[entries.length - 1].isIntersecting
                if (this.particleMesh) this.playing = this._visible
            },
            { threshold: 0 }
        )
        this._intersectionObserver.observe(container)

        canvas.addEventListener("pointermove", this.pointerMove)
        canvas.addEventListener("pointerleave", this.pointerLeave)

        this.resize()
        this.loadImage(image).catch(() => {})
    }

    applySettings(settings: SimulationSettings) {
        this.settings = settings
        this.u_noise_strength.value = settings.noiseStrength
        this.u_noise_scale.value = settings.noiseScale
        this.u_noise_time_scale.value = settings.noiseTimeScale
        this.u_mouse_strength.value = settings.mouseEnabled
            ? settings.mouseStrength
            : 0
        this.u_mouse_proximity.value = settings.mouseProximity
        this.u_damping.value = settings.damping
        this.u_point_size.value = settings.pointSize
        this.u_point_softness.value = settings.pointSoftness
        this.u_alpha_mult.value = settings.alphaMultiplier
        this.u_life_min.value = settings.lifeMin
        this.u_life_max.value = settings.lifeMax
    }

    async loadImage(src: string | HTMLImageElement | HTMLCanvasElement) {
        const img =
            src instanceof HTMLImageElement || src instanceof HTMLCanvasElement
                ? src
                : await new Promise<HTMLImageElement>((resolve, reject) => {
                      const i = new Image()
                      i.crossOrigin = "anonymous"
                      i.onload = () => resolve(i)
                      i.onerror = reject
                      i.src = src
                  })
        this.#setupScene(img)
        this.playing = this._visible

        // Trigger CSS reveal after 2 frames so the browser registers opacity:0
        // before starting the transition. Particles fade in first; the background
        // image (handled by React) fades in 600ms later via onReady.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.canvasEl.style.transition = "opacity 1.5s ease-out"
                this.canvasEl.style.opacity = "1"
                this.onReady?.()
            })
        })
    }

    #setupScene(img: HTMLImageElement | HTMLCanvasElement) {
        const gl = this.gl

        const tex = new Texture(gl, {
            generateMipmaps: false,
            minFilter: gl.LINEAR,
            magFilter: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            flipY: false,
        })
        tex.image = img
        tex.needsUpdate = true
        this.u_image.value = tex

        const offscreen = document.createElement("canvas")
        const iw = (img as HTMLImageElement).naturalWidth || img.width
        const ih = (img as HTMLImageElement).naturalHeight || img.height
        this.u_image_aspect.value = iw / ih
        offscreen.width = iw
        offscreen.height = ih
        const ctx2d = offscreen.getContext("2d")
        if (!ctx2d) return
        ctx2d.drawImage(img, 0, 0)
        const imageData = ctx2d.getImageData(0, 0, iw, ih)

        const N = this.numParticles
        const [w, h] = this.u_resolution.value
        const posvel = new Float32Array(N * 4)
        const lifeseed = new Float32Array(N * 4)
        const color = new Float32Array(N * 3)

        const canvasAspect = w / h
        const imageAspect = iw / ih
        const { lifeMin, lifeMax } = this.settings

        for (let i = 0; i < N; i++) {
            const x = Math.random() * w
            const y = Math.random() * h
            const maxLife = lifeMin + Math.random() * (lifeMax - lifeMin)

            posvel[i * 4] = x
            posvel[i * 4 + 1] = y
            posvel[i * 4 + 2] = (Math.random() - 0.5) * 0.5
            posvel[i * 4 + 3] = (Math.random() - 0.5) * 0.5

            lifeseed[i * 4] = Math.random() * maxLife
            lifeseed[i * 4 + 1] = maxLife
            lifeseed[i * 4 + 2] = Math.random() * 2 - 1
            lifeseed[i * 4 + 3] = Math.random() * 2 - 1

            let cu = x / w
            let cv = y / h
            if (imageAspect > canvasAspect) {
                cu = (cu - 0.5) * (canvasAspect / imageAspect) + 0.5
            } else {
                cv = (cv - 0.5) * (imageAspect / canvasAspect) + 0.5
            }
            cu = Math.max(0, Math.min(1, cu))
            cv = Math.max(0, Math.min(1, cv))
            const px = Math.min(Math.floor(cu * iw), iw - 1)
            const py = Math.min(Math.floor(cv * ih), ih - 1)
            const di = (py * iw + px) * 4
            color[i * 3] = imageData.data[di] / 255
            color[i * 3 + 1] = imageData.data[di + 1] / 255
            color[i * 3 + 2] = imageData.data[di + 2] / 255
        }

        const particleProgram = new Program(gl, {
            vertex: PARTICLE_VERT,
            fragment: PARTICLE_FRAG,
            uniforms: {
                u_time: this.u_time,
                u_resolution: this.u_resolution,
                u_mouse: this.u_mouse,
                u_mouse_velocity: this.u_mouse_velocity,
                u_image: this.u_image,
                u_image_aspect: this.u_image_aspect,
                u_noise_strength: this.u_noise_strength,
                u_noise_scale: this.u_noise_scale,
                u_noise_time_scale: this.u_noise_time_scale,
                u_mouse_strength: this.u_mouse_strength,
                u_mouse_proximity: this.u_mouse_proximity,
                u_damping: this.u_damping,
                u_point_size: this.u_point_size,
                u_point_softness: this.u_point_softness,
                u_alpha_mult: this.u_alpha_mult,
                u_life_min: this.u_life_min,
                u_life_max: this.u_life_max,
            },
            transparent: true,
            depthTest: false,
            transformFeedbackVaryings: ["v_posvel", "v_lifeseed", "v_color"],
        })

        this.transformFeedbacks = new TransformFeedback(gl, {
            program: particleProgram.program,
            transformFeedbacks: {
                a_posvel: {
                    data: posvel,
                    size: 4,
                    usage: gl.STREAM_COPY,
                    varying: "v_posvel",
                },
                a_lifeseed: {
                    data: lifeseed,
                    size: 4,
                    usage: gl.STREAM_COPY,
                    varying: "v_lifeseed",
                },
                a_color: {
                    data: color,
                    size: 3,
                    usage: gl.STREAM_COPY,
                    varying: "v_color",
                },
            },
        })

        const positionView = new Float32Array(N * 2)
        for (let i = 0; i < N; i++) {
            positionView[i * 2] = posvel[i * 4]
            positionView[i * 2 + 1] = posvel[i * 4 + 1]
        }

        const cloud = new PointCloud(gl, {
            particles: N,
            dimensions: 2,
            fillFunction: (pts: Float32Array) => {
                for (let i = 0; i < pts.length; i++) pts[i] = positionView[i]
            },
            attributes: {
                a_posvel: new GeometryAttribute({ size: 4, data: posvel }),
                a_lifeseed: new GeometryAttribute({ size: 4, data: lifeseed }),
                a_color: new GeometryAttribute({ size: 3, data: color }),
            },
            transformFeedbacks: this.transformFeedbacks,
        })

        this.particleMesh = new Mesh(gl, {
            mode: gl.POINTS,
            geometry: cloud,
            program: particleProgram,
        })
    }

    pointerMove(e: PointerEvent) {
        if (!this.settings.mouseEnabled) return

        const rect = this.canvasEl.getBoundingClientRect()
        const dpr = this.renderer.dpr

        if (this._targetMouse[0] < -9000) {
            this._lastMouse[0] = (e.clientX - rect.left) * dpr
            this._lastMouse[1] = (e.clientY - rect.top) * dpr
        }

        this._targetMouse[0] = (e.clientX - rect.left) * dpr
        this._targetMouse[1] = (e.clientY - rect.top) * dpr
        this.u_mouse.value = this._targetMouse
    }

    pointerLeave() {
        const dpr = this.renderer.dpr
        this._targetMouse[0] = -10000 * dpr
        this._targetMouse[1] = -10000 * dpr
        this._lastMouse[0] = this._targetMouse[0]
        this._lastMouse[1] = this._targetMouse[1]
        this.u_mouse.value = this._targetMouse
        this._mouseVelocity[0] = 0
        this._mouseVelocity[1] = 0
    }

    render(t: number) {
        const firstRun = this.#lastTime === 0
        const diff = t - this.#lastTime
        this.#lastTime = t

        if (this.#playing) requestAnimationFrame(this.render)
        if (firstRun) return

        this.u_time.value += diff * 0.00005 * this.settings.timeScale

        const smoothing = this.settings.mouseSmoothing
        const vx = this._targetMouse[0] - this._lastMouse[0]
        const vy = this._targetMouse[1] - this._lastMouse[1]
        this._mouseVelocity[0] += (vx - this._mouseVelocity[0]) * smoothing
        this._mouseVelocity[1] += (vy - this._mouseVelocity[1]) * smoothing
        this._lastMouse[0] = this._targetMouse[0]
        this._lastMouse[1] = this._targetMouse[1]
        this.u_mouse_velocity.value = this._mouseVelocity

        if (this.particleMesh) {
            this.renderer.render({
                scene: this.particleMesh,
                update: true,
                sort: false,
                frustumCull: false,
                clear: true,
            })
        }
    }

    resize() {
        const parent = this.canvasEl.parentElement
        if (!parent) return

        const { width, height } = parent.getBoundingClientRect()
        if (width <= 0 || height <= 0) return

        this.renderer.dimensions = new Vec2(width, height)
        this.u_resolution.value = [
            width * this.renderer.dpr,
            height * this.renderer.dpr,
        ]
    }

    set playing(v: boolean) {
        if (!this.#playing && v) {
            this.#playing = true
            this.#lastTime = 0
            requestAnimationFrame(this.render)
        } else if (!v) {
            this.#playing = false
        }
    }

    get playing() {
        return this.#playing
    }

    destroy() {
        this.#playing = false
        this._resizeObserver?.disconnect()
        this._intersectionObserver?.disconnect()
        this.canvasEl.removeEventListener("pointermove", this.pointerMove)
        this.canvasEl.removeEventListener("pointerleave", this.pointerLeave)
        this.canvasEl.remove()
    }
}

// ─── Framer component ────────────────────────────────────────────────────────

interface ParticlesGroup {
    count: number
    maxDpr: number
    size: number
    softness: number
    opacity: number
    lifeMin: number
    lifeMax: number
}

interface MotionGroup {
    speed: number
    noiseForce: number
    noiseScale: number
    noiseSpeed: number
    damping: number
}

interface MouseGroup {
    enabled: boolean
    force: number
    radius: number
    smoothing: number
}

interface ParticleImageProps {
    image: string
    showBackground: boolean
    backgroundColor: string
    particles: ParticlesGroup
    motion: MotionGroup
    mouse: MouseGroup
    style?: CSSProperties
}

function resolveImageSrc(image: string | { src?: string } | undefined): string {
    if (!image) return ""
    if (typeof image === "string") return image
    return image.src ?? ""
}

function buildSettings(props: ParticleImageProps): SimulationSettings {
    const { particles, motion, mouse } = props
    return {
        timeScale: motion.speed,
        noiseStrength: motion.noiseForce,
        noiseScale: motion.noiseScale,
        noiseTimeScale: motion.noiseSpeed,
        mouseStrength: mouse.force,
        mouseProximity: mouse.radius,
        mouseSmoothing: mouse.smoothing,
        mouseEnabled: mouse.enabled,
        damping: motion.damping,
        pointSize: particles.size,
        pointSoftness: particles.softness,
        alphaMultiplier: particles.opacity,
        lifeMin: particles.lifeMin,
        lifeMax: particles.lifeMax,
        maxDpr: particles.maxDpr,
    }
}

export default function ParticleImage(props: ParticleImageProps) {
    const {
        image,
        backgroundColor,
        showBackground,
        particles,
        motion,
        mouse,
        style,
    } = props

    // Destructure nested groups for stable useEffect deps.
    const { count: particleCount, maxDpr } = particles
    const {
        speed: timeScale,
        noiseForce: noiseStrength,
        noiseScale,
        noiseSpeed: noiseTimeScale,
        damping,
    } = motion
    const {
        size: pointSize,
        softness: pointSoftness,
        opacity: particleOpacity,
        lifeMin,
        lifeMax,
    } = particles
    const {
        enabled: mouseEnabled,
        force: mouseStrength,
        radius: mouseProximity,
        smoothing: mouseSmoothing,
    } = mouse

    const containerRef = useRef<HTMLDivElement>(null)
    const instanceRef = useRef<ImageParticles | null>(null)
    // bgReady tracks whether the current scene has fired onReady, used to
    // delay the background image fade-in 600ms after particles appear.
    const [bgReady, setBgReady] = useState(false)
    const bgReadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const imageSrc = resolveImageSrc(image)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Create / recreate the particle engine only when expensive inputs change.
    useEffect(() => {
        if (isCanvas) return
        const container = containerRef.current
        if (!container || !imageSrc) return

        // Reset bg reveal state for this new scene.
        setBgReady(false)
        if (bgReadyTimerRef.current) clearTimeout(bgReadyTimerRef.current)

        const instance = new ImageParticles({
            container,
            image: imageSrc,
            numParticles: particleCount,
            settings: buildSettings(props),
            onReady: () => {
                // Background image starts fading in 600ms after particles.
                bgReadyTimerRef.current = setTimeout(
                    () => setBgReady(true),
                    600
                )
            },
        })
        instanceRef.current = instance

        return () => {
            if (bgReadyTimerRef.current) clearTimeout(bgReadyTimerRef.current)
            instance.destroy()
            if (instanceRef.current === instance) instanceRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCanvas, imageSrc, particleCount, maxDpr])

    // Live-apply lightweight settings without rebuilding the simulation.
    useEffect(() => {
        if (isCanvas) return
        instanceRef.current?.applySettings(buildSettings(props))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isCanvas,
        timeScale,
        noiseStrength,
        noiseScale,
        noiseTimeScale,
        damping,
        lifeMin,
        lifeMax,
        pointSize,
        pointSoftness,
        particleOpacity,
        mouseEnabled,
        mouseStrength,
        mouseProximity,
        mouseSmoothing,
    ])

    const containerStyle: CSSProperties = {
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: backgroundColor,
    }

    // Edit mode: render only the static image, no WebGL.
    if (isCanvas) {
        return (
            <div style={containerStyle}>
                {imageSrc && (
                    <img
                        src={imageSrc}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                )}
            </div>
        )
    }

    return (
        <div ref={containerRef} style={containerStyle}>
            {/* Background image — CSS layer behind the WebGL canvas. */}
            {imageSrc && (
                <img
                    src={imageSrc}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        // transition must always be set BEFORE opacity changes,
                        // otherwise the browser applies both in one frame and skips the animation.
                        transition: "opacity 1.5s ease-out",
                        opacity: showBackground && bgReady ? 1 : 0,
                    }}
                />
            )}
            {/* WebGL canvas is appended to this div by ImageParticles. */}
        </div>
    )
}

ParticleImage.displayName = "Particle Image"

addPropertyControls(ParticleImage, {
    image: {
        type: ControlType.Image,
        title: "Image",
        defaultValue:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&h=900&fit=crop&auto=format",
        description:
            "Source image. Particle colors are sampled from this image.",
    },

    showBackground: {
        type: ControlType.Boolean,
        title: "Show Image",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
        description: "Display the full image behind the particle field.",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        description: "Fill color visible during loading and behind the canvas.",
    },

    particles: {
        type: ControlType.Object,
        title: "Particles",
        controls: {
            count: {
                type: ControlType.Number,
                title: "Count",
                defaultValue: 150000,
                min: 10000,
                max: 600000,
                step: 10000,
                displayStepper: true,
                description: "More particles = denser effect, higher GPU load.",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 4,
                min: 1,
                max: 12,
                step: 0.5,
                displayStepper: true,
                description: "Base size of each particle point.",
            },
            softness: {
                type: ControlType.Number,
                title: "Softness",
                defaultValue: 0.3,
                min: 0.1,
                max: 0.49,
                step: 0.01,
                displayStepper: true,
                description: "Edge softness of each particle dot.",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.5,
                min: 0.1,
                max: 1,
                step: 0.05,
                displayStepper: true,
                description: "Overall particle transparency.",
            },
            lifeMin: {
                type: ControlType.Number,
                title: "Life Min",
                defaultValue: 100,
                min: 10,
                max: 1000,
                step: 10,
                displayStepper: true,
                description: "Minimum particle lifespan in frames.",
            },
            lifeMax: {
                type: ControlType.Number,
                title: "Life Max",
                defaultValue: 400,
                min: 50,
                max: 2000,
                step: 10,
                displayStepper: true,
                description: "Maximum particle lifespan in frames.",
            },
            maxDpr: {
                type: ControlType.Number,
                title: "Max DPR",
                defaultValue: 2,
                min: 1,
                max: 3,
                step: 0.5,
                displayStepper: true,
                description:
                    "Caps device pixel ratio for performance on retina screens.",
            },
        },
    },

    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0,
                max: 5,
                step: 0.1,
                displayStepper: true,
                description: "Global animation speed multiplier.",
            },
            noiseForce: {
                type: ControlType.Number,
                title: "Noise Force",
                defaultValue: 0.04,
                min: 0,
                max: 0.2,
                step: 0.005,
                displayStepper: true,
                description: "How strongly the noise field pushes particles.",
            },
            noiseScale: {
                type: ControlType.Number,
                title: "Noise Scale",
                defaultValue: 0.004,
                min: 0.001,
                max: 0.02,
                step: 0.001,
                displayStepper: true,
                description:
                    "Size of the noise pattern. Lower = larger swirls.",
            },
            noiseSpeed: {
                type: ControlType.Number,
                title: "Noise Speed",
                defaultValue: 20,
                min: 0,
                max: 80,
                step: 1,
                displayStepper: true,
                description: "How fast the noise field evolves over time.",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: 0.98,
                min: 0.9,
                max: 0.999,
                step: 0.001,
                displayStepper: true,
                description:
                    "Velocity decay per frame. Higher = smoother drift.",
            },
        },
    },

    mouse: {
        type: ControlType.Object,
        title: "Mouse",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Mouse",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Enable cursor interaction with the particle field.",
            },
            force: {
                type: ControlType.Number,
                title: "Force",
                defaultValue: 0.08,
                min: 0,
                max: 0.5,
                step: 0.01,
                displayStepper: true,
                description:
                    "How strongly cursor movement pushes nearby particles.",
                hidden: (props: MouseGroup) => !props.enabled,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 1000,
                min: 100,
                max: 5000,
                step: 50,
                displayStepper: true,
                description: "Influence radius around the cursor in pixels.",
                hidden: (props: MouseGroup) => !props.enabled,
            },
            smoothing: {
                type: ControlType.Number,
                title: "Smoothing",
                defaultValue: 0.15,
                min: 0.01,
                max: 1,
                step: 0.01,
                displayStepper: true,
                description:
                    "Cursor momentum smoothing. Lower = more drift after movement.",
                hidden: (props: MouseGroup) => !props.enabled,
            },
        },
    },
})
