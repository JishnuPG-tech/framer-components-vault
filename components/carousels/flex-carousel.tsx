// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, type CSSProperties } from "react"

// Flex Carousel: an endless image row bent by an invisible glass lens (WebGL2).

const DEFAULT_ITEMS = [
    { src: "https://framerusercontent.com/images/SH1VdPkNMVxhCGeTYaGF365Ek.jpg", alt: "Rippling bands of blue, pink and orange", title: "Spectrum" },
    { src: "https://framerusercontent.com/images/ytSL9iT6HRJbSHKaYSKqAb80AM.jpg", alt: "A man with a glinting earring against an orange backdrop", title: "Ember" },
    { src: "https://framerusercontent.com/images/x1LofDb2XIe5QuOe5jY1vNndw.jpg", alt: "The white corner of a building with blue windows under a pink sky", title: "Pastel Block" },
    { src: "https://framerusercontent.com/images/l6iDVhJTEGrrFqgqSnAXGH9p6Jw.jpg", alt: "A chrome humanoid sculpture with intricate details", title: "Automaton" },
    { src: "https://framerusercontent.com/images/FwKtOAqeb769PTgghmHvtKxOb3U.jpg", alt: "A person diving into blue water, seen from above", title: "Deep Blue" },
    { src: "https://framerusercontent.com/images/ZwuD0Y8guR5b8C6K22rQLTED5I.jpg", alt: "Layered, torn street posters on a wall", title: "Torn Layers" },
    { src: "https://framerusercontent.com/images/sfxuM1thCx3yrbD8eCxkSE5nM.jpg", alt: "Two blue beach chairs facing calm water", title: "Shoreline" },
    { src: "https://framerusercontent.com/images/ANjpceYxkSFgPe7hBk4ilb44KEw.jpg", alt: "A person in motion blur against a bright red and orange background", title: "Afterglow" },
    { src: "https://framerusercontent.com/images/5XS5IlsgE6CuePG9oe5rkvB5znc.jpg", alt: "The Holy Trinity Cathedral of Tbilisi against a blue sky", title: "Holy Trinity" },
    { src: "https://framerusercontent.com/images/6VylIgGk3ijvpiXD6qFmv7e3mU0.jpg", alt: "A woman wearing three stacked pairs of sunglasses", title: "Triple Shades" },
    { src: "https://framerusercontent.com/images/dH2Kw3LroR3gQRZcDFshZUfgy8.jpg", alt: "A fluted industrial chimney against a violet sky", title: "Fluted Tower" },
    { src: "https://framerusercontent.com/images/6PbFLFBEFu2DO6u8f6raQ97JFLQ.jpg", alt: "A sports car parked in front of a Yodobashi store at night", title: "Night Drive" },
    { src: "https://framerusercontent.com/images/Aid4Z7RcsWTbsf2Y0WM2LK9rk8.jpg", alt: "Two silhouettes behind textured glass", title: "Frosted" },
    { src: "https://framerusercontent.com/images/cqhdHONvzBf72g2wfDzmbWlkDtE.jpg", alt: "A blurred rainbow colored gradient", title: "Prism" },
    { src: "https://framerusercontent.com/images/WjeETUlXyzJk66kqkrz50p7R4w.jpg", alt: "A man with a blurred face in red and blue light", title: "Double Take" },
    { src: "https://framerusercontent.com/images/qMxzpfZMK4hJLBvh0mGngjxGgVc.jpg", alt: "Torn advertising posters in New York", title: "Paper Lips" },
]

const BEND_PRESETS: Record<string, any> = {
    liquid: { lensWidth: 0.74, lensHeight: 1.18, tilt: 62, roundness: 1, bend: 0.34, reach: 0.38, curl: "twist", dispersion: 0.45, liquid: 0, followCursor: false },
    ribbon: { lensWidth: 0.8, lensHeight: 0.8, tilt: 0, roundness: 1, bend: 0.34, reach: 0.34, curl: "twist", dispersion: 0.4, liquid: 0, followCursor: false },
    vortex: { lensWidth: 0.7, lensHeight: 0.95, tilt: 30, roundness: 1, bend: 0.46, reach: 0.3, curl: "twist", dispersion: 0.5, liquid: 0, followCursor: false },
    arch: { lensWidth: 0.8, lensHeight: 0.8, tilt: 0, roundness: 1, bend: 0.3, reach: 0.36, curl: "rise", dispersion: 0.4, liquid: 0, followCursor: false },
}

const CUSTOM_DEFAULTS = {
    lensWidth: 0.74,
    lensHeight: 1.18,
    tilt: -77,
    roundness: 1,
    bend: 0.61,
    reach: 0.9,
    curl: "twist",
    dispersion: 0.45,
    liquid: 0,
    followCursor: false,
}

const FIT_ASPECT: Record<string, number> = { portrait: 0.75, square: 1, landscape: 4 / 3 }
const TAPS = 12
const PIXEL_BUDGET = 4.5e6
const INTRO_DURATION: Record<string, number> = { rise: 2.1, bloom: 1.6, spin: 2.2, deal: 1.5, fade: 0.35 }

const wrap = (value: number, size: number) => ((((value + size / 2) % size) + size) % size) - size / 2
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3)
const easeOutQuint = (value: number) => 1 - Math.pow(1 - clamp01(value), 5)
const easeInOut = (value: number) => {
    const t = clamp01(value)
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Framer-hosted images can be scaled down server side, no need to upload 4K textures.
const textureSrc = (src: string) =>
    src.includes("framerusercontent.com/images/") && !src.includes("?") ? `${src}?scale-down-to=2048` : src

const cardVertex = `#version 300 es
in vec2 position;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vLocal;
void main() {
  vLocal = vec2(position.x, -position.y) * uRect.zw;
  vec2 px = uRect.xy + vLocal;
  gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
}
`

const cardFragment = `#version 300 es
precision highp float;
uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uImage;
uniform float uRadius;
uniform float uAlpha;
uniform float uReady;
uniform float uShift;
uniform float uDpr;
uniform vec3 uPlaceholder;
in vec2 vLocal;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float sd = roundedBox(vLocal, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
  float mask = clamp(0.5 - sd * uDpr, 0.0, 1.0);
  vec2 local = vLocal / uSize + 0.5;
  float cardAspect = uSize.x / uSize.y;
  float imageAspect = uImage.x / max(uImage.y, 1.0);
  vec2 scale = imageAspect > cardAspect ? vec2(cardAspect / imageAspect, 1.0) : vec2(1.0, imageAspect / cardAspect);
  scale /= 1.08;
  vec2 uv = vec2(local.x, 1.0 - local.y);
  uv = (uv - 0.5) * scale + 0.5;
  uv.x += uShift * (1.0 - scale.x) * 0.5;
  vec3 image = texture(tMap, uv).rgb;
  vec3 color = mix(uPlaceholder, image, uReady);
  float alpha = mask * uAlpha;
  fragColor = vec4(color * alpha, alpha);
}
`

const lensVertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const lensFragment = `#version 300 es
precision highp float;
uniform sampler2D tScene;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uAngle;
uniform float uExponent;
uniform float uInner;
uniform float uOuter;
uniform float uFlow;
uniform float uCurl;
uniform float uDispersion;
uniform float uStrength;
uniform float uSceneAlpha;
out vec4 fragColor;

void main() {
  vec2 frag = gl_FragCoord.xy / uDpr;
  vec2 uv = frag / uResolution;
  vec2 rel = frag - vec2(uCenter.x, uResolution.y - uCenter.y);
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  vec2 local = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
  vec2 k = max(abs(local) / uHalf, vec2(1e-5));
  float nd = pow(pow(k.x, uExponent) + pow(k.y, uExponent), 1.0 / uExponent);
  vec2 grad = pow(k, vec2(uExponent - 1.0)) * sign(local) / uHalf * pow(nd, 1.0 - uExponent);
  float glen = max(length(grad), 1e-6);
  float edge = (nd - 1.0) / glen;
  vec2 outward = grad / glen;
  vec2 normal = vec2(ca * outward.x - sa * outward.y, sa * outward.x + ca * outward.y);
  vec2 along = vec2(-normal.y, normal.x);

  float t = clamp((edge + uInner) / (uInner + uOuter), 0.0, 1.0);
  float ramp = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float slope = 16.0 * t * t * (1.0 - t) * (1.0 - t);
  float reachX = rel.x / (uResolution.x * 0.5);
  float side = smoothstep(0.02, 0.3, abs(reachX)) * (uCurl == 0.0 ? sign(reachX) : uCurl);
  float lift = ramp * side * uFlow * uStrength;
  vec2 swirl = along * along.y * side * slope * uFlow * uStrength * 0.35;
  vec2 drift = vec2(0.0, -lift) - swirl;
  vec2 shifted = uv + drift / uResolution;

  vec2 texels = uResolution * uDpr;
  vec2 gx = dFdx(shifted);
  vec2 gy = dFdy(shifted);
  gx *= min(1.0, 3.0 / max(length(gx * texels), 1e-4));
  gy *= min(1.0, 3.0 / max(length(gy * texels), 1e-4));

  vec4 color = textureGrad(tScene, shifted, gx, gy);
  vec2 spread = vec2(0.0, side * slope * uFlow * uStrength) / uResolution * uDispersion;
  float spreadPx = length(spread * texels);
  if (color.a > 0.002 && spreadPx > 0.25) {
    vec3 base = color.rgb / color.a;
    vec3 sumColor = vec3(0.0);
    vec3 sumWeight = vec3(0.0);
    for (int i = 0; i < ${TAPS}; i++) {
      float s = (float(i) + 0.5) / float(${TAPS});
      vec4 c = textureGrad(tScene, shifted + spread * (s - 0.5), gx, gy);
      vec3 w = max(1.0 - abs(vec3(s) - vec3(0.15, 0.5, 0.85)) * 2.6, 0.0) * c.a;
      sumColor += c.rgb * (w / max(c.a, 0.002));
      sumWeight += w;
    }
    vec3 split = mix(base, sumColor / max(sumWeight, vec3(1e-4)), clamp(sumWeight * 2.0, 0.0, 1.0));
    color.rgb = mix(color.rgb, clamp(split, 0.0, 1.0) * color.a, smoothstep(0.25, 1.5, spreadPx));
  }

  fragColor = color * uSceneAlpha;
}
`

// Minimal WebGL2 helpers (replace the ogl dependency of the original).
function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
    const program = gl.createProgram()!
    const shaders: WebGLShader[] = []
    for (const [type, source] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
    ] as [number, string][]) {
        const shader = gl.createShader(type)!
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(shader))
        gl.attachShader(program, shader)
        shaders.push(shader)
    }
    gl.bindAttribLocation(program, 0, "position")
    gl.linkProgram(program)
    shaders.forEach((shader) => gl.deleteShader(shader))
    const uniforms: Record<string, { loc: WebGLUniformLocation; type: number }> = {}
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(program, i)
        if (info) uniforms[info.name] = { loc: gl.getUniformLocation(program, info.name)!, type: info.type }
    }
    return { program, uniforms }
}

function setUniforms(gl: WebGL2RenderingContext, prog: ReturnType<typeof createProgram>, values: Record<string, any>) {
    for (const key in values) {
        const u = prog.uniforms[key]
        if (!u) continue
        const v = values[key]
        if (u.type === gl.FLOAT) gl.uniform1f(u.loc, v)
        else if (u.type === gl.FLOAT_VEC2) gl.uniform2fv(u.loc, v)
        else if (u.type === gl.FLOAT_VEC3) gl.uniform3fv(u.loc, v)
        else if (u.type === gl.FLOAT_VEC4) gl.uniform4fv(u.loc, v)
        else if (u.type === gl.SAMPLER_2D) gl.uniform1i(u.loc, v)
    }
}

function createGeometry(gl: WebGL2RenderingContext, points: number[]) {
    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
    return vao
}

const STYLES = `
.fc-root { cursor: grab; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; outline: none; }
.fc-root[data-static] { cursor: default; }
.fc-root[data-hover='open'] { cursor: zoom-in; }
.fc-root[data-hover='close'] { cursor: zoom-out; }
.fc-root[data-dragging] { cursor: grabbing; }
.fc-root:focus-visible { box-shadow: inset 0 0 0 2px rgba(128, 128, 140, 0.55); }
.fc-caption { position: absolute; left: 0; right: 0; top: calc(50% + var(--fc-half) * var(--fc-lift, 1) + var(--fc-offset, 22px)); display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 16px; pointer-events: none; text-align: center; animation: fc-reveal 900ms ease both; }
.fc-title { display: flex; flex-direction: column; align-items: center; max-width: 100%; animation: fc-title 520ms cubic-bezier(0.22, 1, 0.36, 1); }
.fc-subtitle { font-weight: 400; opacity: 0.6; }
.fc-count { display: inline-flex; align-items: center; gap: 3px; font-variant-numeric: tabular-nums; opacity: 0.5; transition: opacity 400ms ease; }
.fc-count[data-hidden] { opacity: 0; }
.fc-digits { display: inline-flex; }
.fc-digit { display: inline-block; height: 1em; line-height: 1em; overflow: hidden; }
.fc-reel { display: flex; flex-direction: column; transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1); }
.fc-reel span { height: 1em; }
.fc-slash { opacity: 0.6; }
.fc-live { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.fc-root[data-static] .fc-caption, .fc-root[data-static] .fc-title { animation: none; }
.fc-root[data-static] .fc-reel { transition: none; }
@keyframes fc-title { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fc-reveal { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .fc-caption, .fc-title { animation: none; } .fc-reel { transition: none; } }
`

function Digits({ value }: { value: number }) {
    return (
        <span className="fc-digits">
            {String(value)
                .padStart(2, "0")
                .split("")
                .map((digit, index) => (
                    <span key={index} className="fc-digit">
                        <span className="fc-reel" style={{ transform: `translateY(${-Number(digit) * 10}%)` }}>
                            {"0123456789".split("").map((n) => (
                                <span key={n}>{n}</span>
                            ))}
                        </span>
                    </span>
                ))}
        </span>
    )
}

interface CarouselItem {
    image?: { src?: string; srcSet?: string; alt?: string } | null
    title?: string
    subtitle?: string
}

interface FlexCarouselProps {
    items?: CarouselItem[]
    preset?: string
    intro?: string
    fit?: string
    cardHeight?: number
    gap?: number
    radius?: number
    lensWidth?: number
    lensHeight?: number
    tilt?: number
    roundness?: number
    bend?: number
    reach?: number
    curl?: string
    dispersion?: number
    liquid?: number
    followCursor?: boolean
    squeeze?: number
    focusOnClick?: boolean
    autoplay?: boolean
    interval?: number
    wheel?: string
    scrollSpeed?: number
    captions?: boolean
    textColor?: string
    titleFont?: CSSProperties
    counterFont?: CSSProperties
    captionOffset?: number
    onChange?: () => void
    onSelect?: () => void
    style?: CSSProperties
}

/**
 * Flex Carousel
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FlexCarousel(props: FlexCarouselProps) {
    const {
        items = [],
        preset = "custom",
        intro = "rise",
        fit = "natural",
        cardHeight = 0.5,
        gap = 12,
        radius = 0,
        squeeze = 0.2,
        focusOnClick = true,
        autoplay = false,
        interval = 4,
        wheel = "capture",
        scrollSpeed = 1.5,
        captions = true,
        textColor = "#FFFFFF",
        titleFont,
        counterFont,
        captionOffset = 22,
        onChange,
        onSelect,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const settingsRef = useRef<any>(null)
    const engineRef = useRef<any>(null)
    const callbacksRef = useRef({ onChange, onSelect })
    const [active, setActive] = useState(0)
    const [revealed, setRevealed] = useState(false)
    const [focusOpen, setFocusOpen] = useState(false)
    const [noWebgl, setNoWebgl] = useState(false)

    const lens = BEND_PRESETS[preset] || {
        lensWidth: props.lensWidth ?? CUSTOM_DEFAULTS.lensWidth,
        lensHeight: props.lensHeight ?? CUSTOM_DEFAULTS.lensHeight,
        tilt: props.tilt ?? CUSTOM_DEFAULTS.tilt,
        roundness: props.roundness ?? CUSTOM_DEFAULTS.roundness,
        bend: props.bend ?? CUSTOM_DEFAULTS.bend,
        reach: props.reach ?? CUSTOM_DEFAULTS.reach,
        curl: props.curl ?? CUSTOM_DEFAULTS.curl,
        dispersion: props.dispersion ?? CUSTOM_DEFAULTS.dispersion,
        liquid: props.liquid ?? CUSTOM_DEFAULTS.liquid,
        followCursor: props.followCursor ?? CUSTOM_DEFAULTS.followCursor,
    }

    // An item without an uploaded image falls back to the matching sample photo.
    const source: CarouselItem[] = items && items.length ? items : DEFAULT_ITEMS.map((item) => ({ title: item.title }))
    const list = source.map((item, index) => {
        const fallback = DEFAULT_ITEMS[index % DEFAULT_ITEMS.length]
        const src = item.image?.src
        return {
            src: src || fallback.src,
            alt: src ? item.image?.alt || item.title || "" : fallback.alt,
            title: item.title || "",
            subtitle: item.subtitle || "",
        }
    })
    const itemsKey = list.map((item) => item.src).join("|")
    const itemsRef = useRef(list)

    useEffect(() => {
        itemsRef.current = list
        callbacksRef.current = { onChange, onSelect }
        settingsRef.current = {
            intro: isStatic ? "none" : intro,
            cardHeight,
            gap,
            radius,
            fit,
            ...lens,
            followCursor: !isStatic && lens.followCursor,
            squeeze,
            focusOnClick,
            autoplay: !isStatic && autoplay,
            interval: Math.max(1, interval),
            wheel,
            scrollSpeed,
        }
        engineRef.current?.wake()
    })

    useEffect(() => {
        engineRef.current?.setItems(itemsRef.current)
    }, [itemsKey])

    useEffect(() => {
        const container = containerRef.current
        if (!container || typeof window === "undefined") return undefined

        const canvas = document.createElement("canvas")
        const gl = canvas.getContext("webgl2", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: isStatic,
        }) as WebGL2RenderingContext | null
        if (!gl) {
            setNoWebgl(true)
            setRevealed(true)
            return undefined
        }
        canvas.style.display = "block"
        canvas.style.position = "absolute"
        canvas.style.inset = "0"
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.setAttribute("aria-hidden", "true")
        container.prepend(canvas)

        const cardProgram = createProgram(gl, cardVertex, cardFragment)
        const lensProgram = createProgram(gl, lensVertex, lensFragment)
        const quad = createGeometry(gl, [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5])
        const triangle = createGeometry(gl, [-1, -1, 3, -1, -1, 3])

        const anisotropyExt = gl.getExtension("EXT_texture_filter_anisotropic")
        const blank = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, blank)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]))

        // Offscreen scene the lens pass samples from (mipmapped for textureGrad).
        const sceneTexture = gl.createTexture()
        const framebuffer = gl.createFramebuffer()
        let targetW = 2
        let targetH = 2
        const sizeTarget = (w: number, h: number) => {
            targetW = w
            targetH = h
            gl.bindTexture(gl.TEXTURE_2D, sceneTexture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        }
        sizeTarget(2, 2)
        gl.clearColor(0, 0, 0, 0)

        const reducedMotion = !isStatic && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)

        let slots: any[] = []
        let width = 1
        let height = 1
        let dpr = 1
        let pos = 0
        let vel = 0
        let goal = 0
        let mode = "spring"
        let wheelAt = 0
        let raf = 0
        let last = performance.now()
        let visible = true
        let alive = true
        let dirty = true
        let activeIndex = -1
        let interactedAt = -Infinity
        let autoplayAt = performance.now()
        let hasFocus = false
        let deform = 0
        let deformVel = 0
        let layout: any = null
        let resnap = false
        let hover = ""
        let lift = 1
        let energy = 0
        let lastPos = 0
        const lensState = { x: 0, y: 0, vx: 0, vy: 0, ready: false }
        const pointer = {
            x: 0,
            y: 0,
            over: false,
            down: false,
            id: -1,
            startX: 0,
            startY: 0,
            startPos: 0,
            dragging: false,
            touch: false,
            samples: [] as { x: number; t: number }[],
        }
        const introState = { kind: "none", t: 0, running: false, done: false, readyAt: 0 }
        const focus = { index: -1, pending: -1, t: 0, v: 0, target: 0 }
        let instances: { index: number; x0: number; x1: number; y0: number; y1: number }[] = []

        const loadSlot = (item: any, index: number) => {
            const texture = gl.createTexture()
            const slot: any = {
                item,
                index,
                texture,
                aspect: 0.8,
                loaded: false,
                failed: false,
                ready: 0,
                color: [0.5, 0.5, 0.5],
                image: [1, 1],
                dispose: () => {},
            }
            const image = new Image()
            image.crossOrigin = "anonymous"
            image.decoding = "async"
            image.onload = () => {
                if (!alive || !slots.includes(slot)) return
                try {
                    gl.bindTexture(gl.TEXTURE_2D, texture)
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
                    gl.generateMipmap(gl.TEXTURE_2D)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                    if (anisotropyExt) gl.texParameterf(gl.TEXTURE_2D, anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT, 8)
                } catch {
                    // Cross-origin image without CORS headers: keep the placeholder.
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
                    slot.failed = true
                    dirty = true
                    start()
                    return
                }
                slot.image = [image.naturalWidth || 1, image.naturalHeight || 1]
                slot.aspect = slot.image[0] / slot.image[1]
                try {
                    const probe = document.createElement("canvas")
                    probe.width = 8
                    probe.height = 8
                    const ctx = probe.getContext("2d", { willReadFrequently: true })
                    if (ctx) {
                        ctx.drawImage(image, 0, 0, 8, 8)
                        const data = ctx.getImageData(0, 0, 8, 8).data
                        const avg = [0, 0, 0]
                        for (let i = 0; i < data.length; i += 4) {
                            avg[0] += data[i]
                            avg[1] += data[i + 1]
                            avg[2] += data[i + 2]
                        }
                        slot.color = avg.map((v) => v / 64 / 255)
                    }
                } catch {
                    slot.color = [0.5, 0.5, 0.5]
                }
                slot.loaded = true
                if (isStatic || reducedMotion) slot.ready = 1
                dirty = true
                start()
            }
            image.onerror = () => {
                if (!alive) return
                slot.failed = true
                dirty = true
                start()
            }
            image.src = textureSrc(item.src)
            slot.dispose = () => {
                image.onload = null
                image.onerror = null
                gl.deleteTexture(texture)
            }
            return slot
        }

        const setItems = (next: any[]) => {
            slots.forEach((slot) => slot.dispose())
            slots = next.map(loadSlot)
            activeIndex = -1
            layout = null
            resnap = true
            focus.target = 0
            focus.t = 0
            focus.v = 0
            focus.pending = -1
            setFocusOpen(false)
            introState.readyAt = performance.now()
            dirty = true
            start()
        }

        const metrics = (s: any) => {
            const cardH = Math.max(24, s.cardHeight * height)
            const fixed = FIT_ASPECT[s.fit]
            const widths = slots.map((slot) => (fixed || slot.aspect) * cardH)
            const centers: number[] = []
            let cursor = 0
            for (let i = 0; i < widths.length; i++) {
                centers.push(cursor + widths[i] / 2)
                cursor += widths[i] + s.gap
            }
            return { cardH, widths, centers, gap: s.gap, loop: Math.max(cursor, 1) }
        }

        const nearest = (m: any, at: number) => {
            let best = 0
            let bestDist = Infinity
            for (let i = 0; i < m.centers.length; i++) {
                const dist = Math.abs(wrap(m.centers[i] - at, m.loop))
                if (dist < bestDist) {
                    bestDist = dist
                    best = i
                }
            }
            return best
        }

        const snapPoint = (m: any, at: number) => {
            const i = nearest(m, at)
            return at + wrap(m.centers[i] - at, m.loop)
        }

        const remap = (from: any, to: any, at: number) => {
            const i = nearest(from, at)
            const offset = wrap(at - from.centers[i], from.loop)
            const cycles = Math.round((at - offset - from.centers[i]) / from.loop)
            return cycles * to.loop + to.centers[i] + offset * (to.widths[i] / from.widths[i])
        }

        const step = (m: any, delta: number) => {
            let at = snapPoint(m, goal)
            let index = nearest(m, at)
            const n = m.centers.length
            for (let k = 0; k < Math.abs(delta); k++) {
                const next = (index + (delta > 0 ? 1 : n - 1)) % n
                const distance =
                    delta > 0
                        ? m.widths[index] / 2 + m.gap + m.widths[next] / 2
                        : -(m.widths[next] / 2 + m.gap + m.widths[index] / 2)
                at += distance
                index = next
            }
            goal = at
            mode = "spring"
            dirty = true
            start()
        }

        const goTo = (m: any, index: number) => {
            const i = ((index % m.centers.length) + m.centers.length) % m.centers.length
            goal = goal + wrap(m.centers[i] - goal, m.loop)
            mode = "spring"
            dirty = true
            start()
        }

        const openFocus = (index: number) => {
            focus.index = index
            focus.pending = -1
            focus.target = 1
            setFocusOpen(true)
            dirty = true
            start()
        }

        const closeFocus = () => {
            focus.pending = -1
            if (focus.target === 0) return false
            focus.target = 0
            setFocusOpen(false)
            dirty = true
            start()
            return true
        }

        const skipIntro = () => {
            if (introState.running) introState.t = 1
        }

        const introEffects = () => {
            const t = introState.running ? introState.t : introState.done ? 1 : 0
            const e: { sceneAlpha: number; strength: number; card: null | ((rel: number) => any) } = {
                sceneAlpha: 1,
                strength: 1,
                card: null,
            }
            if (!introState.done && !introState.running) {
                e.sceneAlpha = 0
                e.strength = 0
                return e
            }
            if (t >= 1) return e
            const kind = introState.kind
            if (kind === "rise") {
                e.strength = easeInOut((t - 0.3) / 0.65)
                e.card = (rel) => {
                    const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.34
                    const local = clamp01((t - delay) / 0.6)
                    return {
                        alpha: clamp01(local * 4),
                        x: 0,
                        y: (1 - easeOutQuint(local)) * height * 0.62,
                        scale: 0.5 + 0.5 * easeInOut((local - 0.18) / 0.82),
                    }
                }
            } else if (kind === "bloom") {
                e.strength = easeInOut((t - 0.2) / 0.8)
                e.card = (rel) => {
                    const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.25
                    const local = easeOut((t - delay) / 0.55)
                    return { alpha: local, x: 0, y: 0, scale: 0.92 + 0.08 * local }
                }
            } else if (kind === "spin") {
                e.sceneAlpha = easeOut(t / 0.25)
                e.strength = easeOut((t - 0.55) / 0.45)
            } else if (kind === "deal") {
                e.strength = easeOut((t - 0.45) / 0.5)
                e.card = (rel) => {
                    const spread = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.3
                    const local = easeOut((t - 0.12 - spread) / 0.5)
                    return { alpha: easeOut((t - spread) / 0.12), x: -rel * (1 - local), y: 0, scale: 1 }
                }
            } else {
                e.sceneAlpha = easeOut(t)
                e.strength = easeOut(t)
            }
            return e
        }

        const beginIntro = (s: any, m: any) => {
            const kind = reducedMotion && s.intro !== "none" ? "fade" : s.intro
            introState.kind = INTRO_DURATION[kind] ? kind : "none"
            introState.running = introState.kind !== "none"
            introState.done = !introState.running
            introState.t = 0
            if (introState.done) setRevealed(true)
            if (introState.kind === "spin") {
                const distance = m.loop * 1.6 + width
                pos = goal + distance
                vel = -distance * 3
                mode = "spring"
            }
        }

        const resize = () => {
            width = Math.max(1, container.clientWidth)
            height = Math.max(1, container.clientHeight)
            dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)))
            canvas.width = Math.max(2, Math.round(width * dpr))
            canvas.height = Math.max(2, Math.round(height * dpr))
            sizeTarget(canvas.width, canvas.height)
            dirty = true
            start()
        }

        const frame = (now: number) => {
            raf = 0
            if (!alive) return
            const s = settingsRef.current
            const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
            last = now
            if (!s || !slots.length) {
                if (visible) raf = requestAnimationFrame(frame)
                return
            }

            const m = metrics(s)
            const n = slots.length
            let animating = false

            if (resnap) {
                goal = snapPoint(m, goal)
                pos = goal
                vel = 0
                resnap = false
            } else if (layout && layout.loop !== m.loop) {
                pos = remap(layout, m, pos)
                goal = remap(layout, m, goal)
                pointer.startPos = pos + (pointer.x - pointer.startX)
                animating = true
            }
            layout = m

            if (!introState.running && !introState.done) {
                const allSettled = slots.every((slot) => slot.loaded || slot.failed)
                if (allSettled || now - introState.readyAt > 3500) {
                    goal = snapPoint(m, goal)
                    pos = goal
                    beginIntro(s, m)
                }
            }
            if (introState.running) {
                introState.t = Math.min(1, introState.t + dt / (INTRO_DURATION[introState.kind] || 1))
                if (introState.t >= 1) {
                    introState.running = false
                    introState.done = true
                    setRevealed(true)
                }
                animating = true
            }

            if (mode === "wheel" && now - wheelAt > 150) {
                goal = snapPoint(m, goal)
                mode = "spring"
            }
            if (!pointer.dragging) {
                const spinning = introState.running && introState.kind === "spin"
                const stiffness = spinning ? 9 : mode === "wheel" ? 80 : 55
                const damping = 2 * Math.sqrt(stiffness)
                const steps = Math.ceil(dt / (1 / 240))
                const h = dt / steps
                for (let i = 0; i < steps; i++) {
                    const acc = stiffness * (goal - pos) - damping * vel
                    vel += acc * h
                    pos += vel * h
                }
                if (Math.abs(goal - pos) < 0.05 && Math.abs(vel) < 0.5) {
                    pos = goal
                    vel = 0
                } else {
                    animating = true
                }
            } else {
                animating = true
            }

            if (Math.abs(pos) > m.loop * 8) {
                const shift = Math.round(pos / m.loop) * m.loop
                pos -= shift
                goal -= shift
                pointer.startPos -= shift
            }

            const current = nearest(m, pos)
            if (current !== activeIndex) {
                activeIndex = current
                setActive(current)
                callbacksRef.current.onChange?.()
            }

            if (focus.pending >= 0 && mode === "spring" && Math.abs(goal - pos) < 1.5 && Math.abs(vel) < 30) {
                if (current === focus.pending) openFocus(current)
                else focus.pending = -1
            }

            if (
                s.autoplay &&
                !reducedMotion &&
                introState.done &&
                focus.target === 0 &&
                focus.t < 0.01 &&
                !pointer.over &&
                !pointer.down &&
                !hasFocus &&
                mode === "spring" &&
                Math.abs(goal - pos) < 1 &&
                now - interactedAt > 3000 &&
                now - autoplayAt > s.interval * 1000
            ) {
                autoplayAt = now
                step(m, 1)
            }
            if (s.autoplay && !reducedMotion) animating = true

            const travel = Math.abs(pos - lastPos) / dt
            lastPos = pos
            const energyTarget = reducedMotion ? 0 : Math.min(travel / 2600, 1)
            energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? 0.07 : 0.35)))
            if (energy > 0.001) animating = true
            else energy = 0
            const liquidAmount = reducedMotion ? 0 : s.liquid
            const push = Math.max(-1, Math.min(1, vel / 2200))
            const deformStiffness = 120
            const deformDamping = 2 * Math.sqrt(deformStiffness) * 0.32
            deformVel += (deformStiffness * (push - deform) - deformDamping * deformVel) * dt
            deform += deformVel * dt
            if (Math.abs(deform) > 0.0005 || Math.abs(deformVel) > 0.005) animating = true
            else {
                deform = 0
                deformVel = 0
            }

            const focusStiffness = 64
            focus.v += (focusStiffness * (focus.target - focus.t) - 2 * Math.sqrt(focusStiffness) * focus.v) * dt
            focus.t += focus.v * dt
            if (Math.abs(focus.target - focus.t) < 0.0005 && Math.abs(focus.v) < 0.001) {
                focus.t = focus.target
                focus.v = 0
            } else {
                animating = true
            }
            const focusAmount = clamp01(focus.t)
            const focusEase = easeInOut(focusAmount)
            const focusW = focus.index >= 0 && focus.index < n ? m.widths[focus.index] : m.cardH
            const focusScale = Math.max(1, Math.min(1.3, (height * 0.84) / m.cardH, (width * 0.92) / focusW))
            const nextLift = 1 + (focusScale - 1) * focusEase
            if (Math.abs(nextLift - lift) > 0.0005) {
                lift = nextLift
                container.style.setProperty("--fc-lift", lift.toFixed(4))
            }

            const effects = introEffects()

            const homeX = width / 2
            const homeY = height / 2
            const follow = s.followCursor && pointer.over && !pointer.dragging && !pointer.touch && focus.target === 0
            const aimX = follow ? pointer.x : homeX
            const aimY = follow ? pointer.y : homeY
            if (!lensState.ready || isStatic) {
                lensState.x = homeX
                lensState.y = homeY
                lensState.ready = true
            }
            const lensK = 110
            const lensC = 2 * Math.sqrt(lensK) * 0.8
            lensState.vx += (lensK * (aimX - lensState.x) - lensC * lensState.vx) * dt
            lensState.vy += (lensK * (aimY - lensState.y) - lensC * lensState.vy) * dt
            lensState.x += lensState.vx * dt
            lensState.y += lensState.vy * dt
            if (
                Math.abs(aimX - lensState.x) + Math.abs(aimY - lensState.y) > 0.2 ||
                Math.abs(lensState.vx) + Math.abs(lensState.vy) > 0.5
            )
                animating = true

            const cardH = m.cardH
            let halfW = (s.lensWidth * width) / 2
            let halfH = (s.lensHeight * width) / 2
            const squash = Math.abs(deform) * liquidAmount
            halfW *= 1 + squash * 0.16
            halfH *= 1 - squash * 0.08
            const lensX = lensState.x - deform * 14 * liquidAmount

            for (let i = 0; i < n; i++) {
                const slot = slots[i]
                if (slot.loaded && slot.ready < 1) {
                    slot.ready = Math.min(1, slot.ready + dt / 0.45)
                    animating = true
                }
            }

            const waiting = !introState.done || slots.some((slot) => !slot.loaded && !slot.failed)
            if (dirty || animating || pointer.dragging) {
                dirty = false
                instances = []
                const shrink = 1 - clamp01(s.squeeze) * energy
                const draws: any[] = []
                for (let i = 0; i < n; i++) {
                    const w = m.widths[i]
                    const baseRel = wrap(m.centers[i] - pos, m.loop)
                    for (let k = -3; k <= 3; k++) {
                        const rel = baseRel + k * m.loop
                        if (Math.abs(rel) - w / 2 > width + 40) continue
                        const fx = effects.card ? effects.card(rel) : null
                        let x = homeX + rel + (fx ? fx.x : 0)
                        let scale = shrink * (fx ? fx.scale : 1)
                        let alpha = fx ? fx.alpha : 1
                        if (focusAmount > 0) {
                            if (i === focus.index && Math.abs(rel) < w) {
                                scale *= 1 + (focusScale - 1) * focusEase
                            } else {
                                const order = Math.min(Math.abs(rel) / width, 1) * 0.25
                                const part = easeInOut(focusAmount * 1.25 - order)
                                x += Math.sign(rel) * part * width * 0.7
                                alpha *= 1 - part
                            }
                        }
                        const cw = w * scale
                        if (alpha <= 0.001 || x + cw / 2 < -40 || x - cw / 2 > width + 40) continue
                        draws.push({ i, rel, x, y: homeY + (fx ? fx.y : 0), cw, ch: cardH * scale, alpha })
                    }
                }
                draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel))

                // Pass 1: flat cards into the offscreen scene.
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
                gl.viewport(0, 0, targetW, targetH)
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
                gl.useProgram(cardProgram.program)
                gl.bindVertexArray(quad)
                gl.activeTexture(gl.TEXTURE0)
                setUniforms(gl, cardProgram, {
                    tMap: 0,
                    uResolution: [width, height],
                    uDpr: dpr,
                    uRadius: s.radius,
                })
                for (const draw of draws) {
                    const slot = slots[draw.i]
                    gl.bindTexture(gl.TEXTURE_2D, slot.loaded ? slot.texture : blank)
                    setUniforms(gl, cardProgram, {
                        uRect: [draw.x, draw.y, draw.cw + 2, draw.ch + 2],
                        uSize: [draw.cw, draw.ch],
                        uImage: slot.image,
                        uAlpha: draw.alpha,
                        uReady: slot.loaded ? slot.ready : 0,
                        uShift: reducedMotion || isStatic ? 0 : Math.max(-1, Math.min(1, draw.rel / (width * 0.75))),
                        uPlaceholder: slot.color,
                    })
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    instances.push({
                        index: draw.i,
                        x0: draw.x - draw.cw / 2,
                        x1: draw.x + draw.cw / 2,
                        y0: draw.y - draw.ch / 2,
                        y1: draw.y + draw.ch / 2,
                    })
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                gl.bindTexture(gl.TEXTURE_2D, sceneTexture)
                gl.generateMipmap(gl.TEXTURE_2D)

                // Pass 2: the invisible glass bends the scene onto the screen.
                gl.viewport(0, 0, canvas.width, canvas.height)
                gl.disable(gl.BLEND)
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.useProgram(lensProgram.program)
                gl.bindVertexArray(triangle)
                const spanW = Math.max(halfW, 1)
                const spanH = Math.max(halfH, 1)
                const inner = Math.max(4, s.reach * (spanW + spanH) * 0.5)
                setUniforms(gl, lensProgram, {
                    tScene: 0,
                    uResolution: [width, height],
                    uDpr: dpr,
                    uCenter: [lensX, lensState.y],
                    uHalf: [spanW, spanH],
                    uAngle: (s.tilt * Math.PI) / 180,
                    uExponent: 2 + Math.pow(1 - clamp01(s.roundness), 1.5) * 10,
                    uInner: inner,
                    uOuter: inner * 1.6,
                    uFlow: s.bend * (spanW + spanH) * 0.45,
                    uCurl: s.curl === "rise" ? 1 : s.curl === "fall" ? -1 : 0,
                    uDispersion: s.dispersion * 0.12 * (1 + Math.abs(deform) * liquidAmount * 1.2),
                    uStrength: effects.strength * (1 - focusEase),
                    uSceneAlpha: effects.sceneAlpha,
                })
                gl.drawArrays(gl.TRIANGLES, 0, 3)
                gl.bindVertexArray(null)
            }

            let nextHover = ""
            if (pointer.over && !pointer.dragging && introState.done && s.focusOnClick) {
                const hit = instances.find(
                    (inst) =>
                        pointer.x >= inst.x0 && pointer.x <= inst.x1 && pointer.y >= inst.y0 && pointer.y <= inst.y1
                )
                if (focus.target > 0) nextHover = "close"
                else if (hit) nextHover = "open"
            }
            if (nextHover !== hover) {
                hover = nextHover
                if (hover) container.setAttribute("data-hover", hover)
                else container.removeAttribute("data-hover")
            }

            if (visible && (animating || waiting || dirty || pointer.down)) raf = requestAnimationFrame(frame)
        }

        const start = () => {
            if (raf || !visible || !alive) return
            last = performance.now()
            raf = requestAnimationFrame(frame)
        }

        const localPoint = (e: PointerEvent) => {
            const rect = container.getBoundingClientRect()
            return [e.clientX - rect.left, e.clientY - rect.top]
        }

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== undefined && e.button > 0) return
            skipIntro()
            const [x, y] = localPoint(e)
            pointer.down = true
            pointer.id = e.pointerId
            pointer.touch = e.pointerType === "touch"
            pointer.startX = x
            pointer.startY = y
            pointer.x = x
            pointer.y = y
            pointer.startPos = pos
            pointer.dragging = false
            pointer.samples = [{ x, t: performance.now() }]
            interactedAt = performance.now()
            if (Math.abs(vel) > 40) {
                goal = pos
                vel = 0
            }
            dirty = true
            start()
        }

        const onPointerMove = (e: PointerEvent) => {
            const [x, y] = localPoint(e)
            pointer.x = x
            pointer.y = y
            pointer.over = true
            if (pointer.down && e.pointerId === pointer.id) {
                const dx = x - pointer.startX
                const dy = y - pointer.startY
                const slop = pointer.touch ? 10 : 5
                if (!pointer.dragging) {
                    if (pointer.touch && Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx)) {
                        pointer.down = false
                        return
                    }
                    if (Math.abs(dx) > slop) {
                        pointer.dragging = true
                        pointer.startX = x
                        pointer.startPos = pos
                        closeFocus()
                        try {
                            container.setPointerCapture(e.pointerId)
                        } catch {
                            pointer.dragging = true
                        }
                        container.setAttribute("data-dragging", "")
                    }
                }
                if (pointer.dragging) {
                    pos = pointer.startPos - (x - pointer.startX)
                    goal = pos
                    vel = 0
                    const now = performance.now()
                    pointer.samples.push({ x, t: now })
                    while (pointer.samples.length > 2 && now - pointer.samples[0].t > 100) pointer.samples.shift()
                }
            }
            dirty = true
            start()
        }

        const onPointerUp = (e: PointerEvent) => {
            if (!pointer.down || e.pointerId !== pointer.id) return
            pointer.down = false
            container.removeAttribute("data-dragging")
            const s = settingsRef.current
            if (!s) return
            const m = metrics(s)
            interactedAt = performance.now()
            if (pointer.dragging) {
                pointer.dragging = false
                const now = performance.now()
                const first = pointer.samples[0]
                const lastSample = pointer.samples[pointer.samples.length - 1]
                let velocity = 0
                if (first && lastSample && lastSample.t > first.t && now - lastSample.t < 70) {
                    velocity = -((lastSample.x - first.x) / (lastSample.t - first.t)) * 1000
                }
                vel = velocity
                const landing = snapPoint(m, pos + velocity * 0.32)
                goal = landing
                if (Math.abs(velocity) > 400 && Math.abs(landing - pos) < 1) step(m, velocity > 0 ? 1 : -1)
                mode = "spring"
                start()
                return
            }
            if (closeFocus()) return
            const [x, y] = localPoint(e)
            const hit = instances.find((inst) => x >= inst.x0 && x <= inst.x1 && y >= inst.y0 && y <= inst.y1)
            if (!hit) return
            if (hit.index === activeIndex && Math.abs(goal - pos) < 2) {
                callbacksRef.current.onSelect?.()
                if (s.focusOnClick) openFocus(hit.index)
            } else {
                const rel = (hit.x0 + hit.x1) / 2 - width / 2
                goal = snapPoint(m, pos + rel)
                mode = "spring"
                if (s.focusOnClick) focus.pending = hit.index
                start()
            }
        }

        const onPointerLeave = () => {
            pointer.over = false
            dirty = true
            start()
        }

        const onPointerCancel = () => {
            pointer.down = false
            pointer.dragging = false
            container.removeAttribute("data-dragging")
            const s = settingsRef.current
            if (!s) return
            goal = snapPoint(metrics(s), pos)
            mode = "spring"
            start()
        }

        const onWheel = (e: WheelEvent) => {
            const s = settingsRef.current
            if (!s || e.ctrlKey) return
            let dx = e.deltaX
            let dy = e.deltaY
            if (e.shiftKey && Math.abs(dx) < Math.abs(dy)) {
                dx = dy
                dy = 0
            }
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1
            const horizontal = Math.abs(dx) > Math.abs(dy)
            if (!horizontal && s.wheel !== "capture") return
            e.preventDefault()
            skipIntro()
            interactedAt = performance.now()
            if (closeFocus()) return
            const delta = Math.max(-120, Math.min(120, (horizontal ? dx : dy) * unit))
            goal += delta * 1.25
            mode = "wheel"
            wheelAt = performance.now()
            start()
        }

        // On Page: the page scrolls freely and drags the row along with it.
        let lastScrollY = window.scrollY
        const onScroll = () => {
            const y = window.scrollY
            const delta = y - lastScrollY
            lastScrollY = y
            const s = settingsRef.current
            if (!s || s.wheel !== "scroll" || !visible || !delta || pointer.dragging) return
            // Only spin while the carousel is actually on screen, and ignore big jumps (anchor links, End key).
            const rect = container.getBoundingClientRect()
            if (rect.bottom <= 0 || rect.top >= window.innerHeight) return
            skipIntro()
            interactedAt = performance.now()
            closeFocus()
            goal += Math.max(-200, Math.min(200, delta)) * s.scrollSpeed
            mode = "wheel"
            wheelAt = performance.now()
            start()
        }

        const onKeyDown = (e: KeyboardEvent) => {
            const s = settingsRef.current
            if (!s) return
            const m = metrics(s)
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                skipIntro()
                closeFocus()
                interactedAt = performance.now()
                step(m, 1)
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                skipIntro()
                closeFocus()
                interactedAt = performance.now()
                step(m, -1)
            } else if (e.key === "Home") {
                e.preventDefault()
                closeFocus()
                goTo(m, 0)
            } else if (e.key === "End") {
                e.preventDefault()
                closeFocus()
                goTo(m, slots.length - 1)
            } else if (e.key === "Escape") {
                if (closeFocus()) e.preventDefault()
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                if (closeFocus() || activeIndex < 0) return
                callbacksRef.current.onSelect?.()
                if (s.focusOnClick) openFocus(activeIndex)
            }
        }

        const onFocus = () => {
            hasFocus = true
        }
        const onBlur = () => {
            hasFocus = false
        }
        const onVisibility = () => {
            if (!document.hidden) start()
        }

        // The editor canvas gets a still render: no listeners, no loop once settled.
        if (!isStatic) {
            container.addEventListener("pointerdown", onPointerDown)
            container.addEventListener("pointermove", onPointerMove)
            container.addEventListener("pointerup", onPointerUp)
            container.addEventListener("pointerleave", onPointerLeave)
            container.addEventListener("pointercancel", onPointerCancel)
            container.addEventListener("wheel", onWheel, { passive: false })
            container.addEventListener("keydown", onKeyDown)
            container.addEventListener("focus", onFocus)
            container.addEventListener("blur", onBlur)
            document.addEventListener("visibilitychange", onVisibility)
            window.addEventListener("scroll", onScroll, { passive: true })
        }

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)
        const intersectionObserver = isStatic
            ? null
            : new IntersectionObserver(([entry]) => {
                  visible = entry.isIntersecting
                  start()
              })
        intersectionObserver?.observe(container)

        engineRef.current = {
            wake: () => {
                dirty = true
                start()
            },
            setItems,
        }

        resize()
        setItems(itemsRef.current)

        return () => {
            alive = false
            visible = false
            engineRef.current = null
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            intersectionObserver?.disconnect()
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointerleave", onPointerLeave)
            container.removeEventListener("pointercancel", onPointerCancel)
            container.removeEventListener("wheel", onWheel)
            container.removeEventListener("keydown", onKeyDown)
            container.removeEventListener("focus", onFocus)
            container.removeEventListener("blur", onBlur)
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("scroll", onScroll)
            slots.forEach((slot) => slot.dispose())
            slots = []
            gl.getExtension("WEBGL_lose_context")?.loseContext()
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
        }
    }, [isStatic])

    const current = list[active] || list[0]
    const label = current ? current.title || current.alt || `Image ${active + 1}` : ""
    const half = Math.min(Math.max(cardHeight, 0.05), 1) * 50

    return (
        <div
            ref={containerRef}
            className="fc-root"
            data-static={isStatic ? "" : undefined}
            style={
                {
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    color: textColor,
                    "--fc-half": `${half}%`,
                    "--fc-offset": `${captionOffset}px`,
                } as CSSProperties
            }
            role="region"
            aria-roledescription="carousel"
            aria-label="Image carousel"
            tabIndex={isStatic ? undefined : 0}
        >
            <style>{STYLES}</style>
            {noWebgl && (
                // No WebGL2: a plain centered row so the content is still there.
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: `${50 - half}%`,
                        height: `${half * 2}%`,
                        display: "flex",
                        justifyContent: "center",
                        gap,
                    }}
                >
                    {list.slice(0, 5).map((item, index) => (
                        <img
                            key={index}
                            src={item.src}
                            alt={item.alt}
                            style={{ height: "100%", width: "auto", objectFit: "cover", borderRadius: radius, flexShrink: 0 }}
                        />
                    ))}
                </div>
            )}
            {captions && current && revealed && (
                <div className="fc-caption" aria-hidden="true">
                    <span key={active} className="fc-title" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.35, ...titleFont }}>
                        {current.title || current.alt}
                        {current.subtitle && <span className="fc-subtitle">{current.subtitle}</span>}
                    </span>
                    <span
                        className="fc-count"
                        data-hidden={focusOpen ? "" : undefined}
                        style={{ fontSize: 12, lineHeight: 1, ...counterFont }}
                    >
                        <Digits value={active + 1} />
                        <span className="fc-slash">/</span>
                        <span>{String(list.length).padStart(2, "0")}</span>
                    </span>
                </div>
            )}
            <div className="fc-live" aria-live="polite" aria-atomic="true">
                {`${label}, ${active + 1} of ${list.length}`}
            </div>
        </div>
    )
}

FlexCarousel.displayName = "Flex Carousel"

const hideLens = (props: FlexCarouselProps) => props.preset !== "custom"

addPropertyControls(FlexCarousel, {
    items: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Title" },
                subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_ITEMS.map((item) => ({ title: item.title, subtitle: "" })),
    },
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["custom", "liquid", "ribbon", "vortex", "arch"],
        optionTitles: ["Custom", "Liquid", "Ribbon", "Vortex", "Arch"],
        defaultValue: "custom",
    },
    lensWidth: {
        type: ControlType.Number,
        title: "Lens Width",
        min: 0.1,
        max: 2,
        step: 0.01,
        defaultValue: CUSTOM_DEFAULTS.lensWidth,
        hidden: hideLens,
    },
    lensHeight: {
        type: ControlType.Number,
        title: "Lens Height",
        min: 0.1,
        max: 2,
        step: 0.01,
        defaultValue: CUSTOM_DEFAULTS.lensHeight,
        hidden: hideLens,
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
        defaultValue: CUSTOM_DEFAULTS.tilt,
        hidden: hideLens,
    },
    roundness: {
        type: ControlType.Number,
        title: "Roundness",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: CUSTOM_DEFAULTS.roundness,
        hidden: hideLens,
    },
    bend: {
        type: ControlType.Number,
        title: "Bend",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: CUSTOM_DEFAULTS.bend,
        hidden: hideLens,
    },
    reach: {
        type: ControlType.Number,
        title: "Reach",
        min: 0.05,
        max: 1,
        step: 0.01,
        defaultValue: CUSTOM_DEFAULTS.reach,
        hidden: hideLens,
    },
    curl: {
        type: ControlType.Enum,
        title: "Curl",
        options: ["twist", "rise", "fall"],
        optionTitles: ["Twist", "Rise", "Fall"],
        defaultValue: CUSTOM_DEFAULTS.curl,
        displaySegmentedControl: true,
        hidden: hideLens,
    },
    dispersion: {
        type: ControlType.Number,
        title: "Dispersion",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: CUSTOM_DEFAULTS.dispersion,
        hidden: hideLens,
    },
    liquid: {
        type: ControlType.Number,
        title: "Liquid",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: CUSTOM_DEFAULTS.liquid,
        hidden: hideLens,
    },
    followCursor: {
        type: ControlType.Boolean,
        title: "Follow Cursor",
        defaultValue: CUSTOM_DEFAULTS.followCursor,
        hidden: hideLens,
    },
    intro: {
        type: ControlType.Enum,
        title: "Intro",
        options: ["rise", "bloom", "spin", "deal", "none"],
        optionTitles: ["Rise", "Bloom", "Spin", "Deal", "None"],
        defaultValue: "rise",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["natural", "portrait", "square", "landscape"],
        optionTitles: ["Natural", "Portrait", "Square", "Landscape"],
        defaultValue: "natural",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 0.1,
        max: 1,
        step: 0.01,
        defaultValue: 0.5,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 12,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
    squeeze: {
        type: ControlType.Number,
        title: "Squeeze",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.2,
    },
    focusOnClick: {
        type: ControlType.Boolean,
        title: "Click Focus",
        defaultValue: true,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
        defaultValue: 4,
        hidden: (props: FlexCarouselProps) => !props.autoplay,
    },
    wheel: {
        type: ControlType.Enum,
        title: "Scroll",
        options: ["capture", "scroll", "page"],
        optionTitles: ["Capture", "On Page", "Off"],
        defaultValue: "capture",
        description: "Capture: the wheel spins the carousel while hovering and holds the page. On Page: scrolling the page spins the carousel. Off: the page scrolls normally.",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        min: 0.2,
        max: 5,
        step: 0.1,
        defaultValue: 1.5,
        hidden: (props: FlexCarouselProps) => props.wheel !== "scroll",
    },
    captions: {
        type: ControlType.Boolean,
        title: "Captions",
        defaultValue: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        hidden: (props: FlexCarouselProps) => !props.captions,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Medium", lineHeight: "1.35em", letterSpacing: "0em" },
        hidden: (props: FlexCarouselProps) => !props.captions,
    },
    counterFont: {
        type: ControlType.Font,
        title: "Counter Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Regular", lineHeight: "1em", letterSpacing: "0em" },
        hidden: (props: FlexCarouselProps) => !props.captions,
    },
    captionOffset: {
        type: ControlType.Number,
        title: "Caption Gap",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 22,
        hidden: (props: FlexCarouselProps) => !props.captions,
    },
    onChange: { type: ControlType.EventHandler, title: "On Change" },
    onSelect: { type: ControlType.EventHandler, title: "On Select" },
})
