// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion } from "framer-motion"
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type WheelEvent as ReactWheelEvent,
} from "react"

/**
 * Kern — Pills
 * One horizontal strip of photo pills under a wide, shallow lens.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1012
 * @framerIntrinsicHeight 462
 */

type DriveMode = "live" | "frozen"

type FramerImage =
    | string
    | {
          src?: string
          url?: string
          alt?: string
          altText?: string
      }

interface KernPillsProps {
    content?: unknown
    look?: unknown
    layout?: unknown
    motion?: unknown
    images?: FramerImage[]
    distortionStrength?: number
    distortion?: number
    zoom?: number
    aberration?: number
    gloss?: number
    verticalScale?: number
    pillWidth?: number
    pillHeight?: number
    corner?: number
    gap?: number
    autoScroll?: boolean
    inertia?: number
    viscosity?: number
    style?: CSSProperties
}

interface SceneParams {
    distortionStrength: number
    zoom: number
    aberration: number
    gloss: number
    verticalScale: number
    pillWidth: number
    pillHeight: number
    corner: number
    gap: number
    autoScroll: boolean
    inertia: number
    viscosity: number
    frozen: boolean
}

interface GpuTexture {
    texture: WebGLTexture
    width: number
    height: number
}

const SCENE_W = 1012
const SCENE_H = 462
const PILL_W = 370
const PILL_H = 214
const PILL_RADIUS = 107
const GAP = 38
const MAX_PIXEL_RATIO = 2
const MAX_IMAGES = 8
const AUTO_SCROLL_PX = 120
const SPRING_STIFFNESS = 120
const SPRING_DAMPING = 14
const SPRING_MASS = 1
const SHEEN_REST: [number, number] = [0.36, 0.62]

const PILLS: { src: string; alt: string }[] = [
    {
        src: "https://framerusercontent.com/images/LRMYGQtssf7cxsEW3vvT5Vp7xk.png",
        alt: "Elegant townhouses",
    },
    {
        src: "https://framerusercontent.com/images/nXv2WAAF5QwYfaUOtjI6GceF3nw.png",
        alt: "Pastel townhouses",
    },
    {
        src: "https://framerusercontent.com/images/egF6sqmHtrlHtXqnQnFnSSDnDg.png",
        alt: "Cobblestone mews",
    },
    {
        src: "https://framerusercontent.com/images/CVNFTeshuViGx7o9gsTkqpxly8.png",
        alt: "A set of keys",
    },
    {
        src: "https://framerusercontent.com/images/fSsN54XyylKtTjJ5jSn0TeqXps.png",
        alt: "Ornate facade",
    },
    {
        src: "https://framerusercontent.com/images/6pBZmYFRIEQVMazxyUuVrDVATPM.png",
        alt: "Minimalist hallway",
    },
]

const CELL_VERT = `
attribute vec2 aPosition;
uniform vec4 uRect;
uniform vec2 uView;
varying vec2 vLocal;
varying vec2 vUv;
void main() {
  vec2 css = uRect.xy + aPosition * uRect.zw;
  float glY = uView.y - css.y;
  vec2 clip = vec2(css.x / uView.x, glY / uView.y) * 2.0 - 1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  vLocal = aPosition;
  vUv = vec2(aPosition.x, 1.0 - aPosition.y);
}
`

const CELL_FRAG = `
precision highp float;
uniform sampler2D map;
uniform vec2 uSize;
uniform float uRadius;
uniform vec2 uImageSize;
uniform float uHasImage;
varying vec2 vLocal;
varying vec2 vUv;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (vLocal - 0.5) * uSize;
  vec2 b = uSize * 0.5;
  float rad = min(uRadius, min(b.x, b.y));
  float d = sdRoundedBox(p, b, rad);
  float alpha = 1.0 - smoothstep(-0.8, 0.8, d);
  if (alpha < 0.001) discard;
  if (uHasImage < 0.5 || uImageSize.x <= 0.0 || uImageSize.y <= 0.0) discard;
  float cellAspect = uSize.x / max(uSize.y, 0.001);
  float imgAspect = uImageSize.x / max(uImageSize.y, 0.001);
  vec2 coverUv = vUv;
  if (cellAspect > imgAspect) {
    float scale = imgAspect / cellAspect;
    coverUv = vec2(vUv.x, (vUv.y - 0.5) * scale + 0.5);
  } else {
    float scale = cellAspect / imgAspect;
    coverUv = vec2((vUv.x - 0.5) * scale + 0.5, vUv.y);
  }
  vec2 cover = clamp(coverUv, 0.001, 0.999);
  vec4 tex = texture2D(map, cover);
  gl_FragColor = vec4(tex.rgb, tex.a * alpha);
}
`

const QUAD_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
  vUv = aPosition;
}
`

const WARP_FRAG = `
precision highp float;
uniform sampler2D tDiffuse;
uniform float uDistortionStrength;
uniform float uZoom;
uniform float uAberration;
uniform float uAberrationRest;
uniform float uGlossIntensity;
uniform float uVerticalScale;
uniform vec2 uSheen;
varying vec2 vUv;

vec4 sampleBuffer(vec2 coord) {
  return texture2D(tDiffuse, clamp(coord, 0.001, 0.999));
}

void main() {
  float zoom = max(uZoom, 0.001);
  vec2 view = (vUv - 0.5) / zoom;
  float yScale = clamp(uVerticalScale, 0.05, 1.0);
  float halfX = 0.5 / zoom;
  float along = clamp(abs(view.x) / max(halfX, 0.0001), 0.0, 1.0);
  float bell = 1.0 - along * along;
  vec2 sampleP;
  if (uDistortionStrength >= 0.0) {
    float pinch = clamp(uDistortionStrength, 0.0, 1.5) * bell * 0.22;
    sampleP = vec2(view.x * (1.0 + pinch), view.y * (1.0 + pinch * yScale));
  } else {
    float t = clamp(-uDistortionStrength / 2.0, 0.0, 1.0);
    float sag = 0.22 * smoothstep(0.0, 0.85, t);
    float kx = 1.0 - sag * bell;
    float ky = 1.0 - sag * yScale * bell;
    sampleP = vec2(view.x * kx, view.y * ky);
  }
  vec2 sampleUV = clamp(vec2(0.5) + sampleP, 0.001, 0.999);
  vec4 center = sampleBuffer(sampleUV);
  float extra = max(uAberration - uAberrationRest, 0.0);
  float reach = clamp(extra / 0.05, 0.0, 1.0);
  float rimGate = smoothstep(mix(0.96, 0.62, reach), 1.0, along);
  vec2 split = vec2(uAberration * rimGate * mix(0.15, 0.45, reach), 0.0);
  vec4 redS = sampleBuffer(sampleUV + split);
  vec4 blueS = sampleBuffer(sampleUV - split);
  vec3 rgb = vec3(
    mix(center.r, redS.r, smoothstep(0.35, 0.85, redS.a)),
    center.g,
    mix(center.b, blueS.b, smoothstep(0.35, 0.85, blueS.a))
  );
  vec2 sp = vUv - uSheen;
  sp.y += (1.0 - bell) * 0.04;
  float catch = exp(-(sp.x * sp.x * 3.2 + sp.y * sp.y * 640.0));
  float gloss = clamp(uGlossIntensity, 0.0, 1.5) / 1.5;
  float reflection = catch * (0.35 + 0.65 * bell) * gloss;
  vec3 lit = min(rgb + vec3(reflection * 0.55), vec3(1.0));
  gl_FragColor = vec4(lit * center.a, center.a);
}
`

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function damp(current: number, target: number, lambda: number, dt: number): number {
    return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function springStep(
    value: number,
    velocity: number,
    target: number,
    dt: number
): [number, number] {
    const omega = Math.sqrt(SPRING_STIFFNESS / SPRING_MASS)
    const zeta = SPRING_DAMPING / (2 * Math.sqrt(SPRING_STIFFNESS * SPRING_MASS))
    const x = value - target
    const v = velocity
    if (zeta < 0.9999) {
        const wd = omega * Math.sqrt(1 - zeta * zeta)
        const e = Math.exp(-zeta * omega * dt)
        const cos = Math.cos(wd * dt)
        const sin = Math.sin(wd * dt)
        const a = x
        const b = (v + zeta * omega * x) / wd
        const nX = e * (a * cos + b * sin)
        const nV =
            e *
            ((b * wd - a * zeta * omega) * cos - (a * wd + b * zeta * omega) * sin)
        if (Math.abs(nX) < 0.001 && Math.abs(nV) < 0.001) {
            return [target, 0]
        }
        return [target + nX, nV]
    }
    const e = Math.exp(-omega * dt)
    const b = v + omega * x
    const nX = e * (x + b * dt)
    const nV = e * (b - omega * (x + b * dt))
    return [target + nX, nV]
}

function driveMode(isStatic: boolean, reducedMotion: boolean): DriveMode {
    if (isStatic || reducedMotion) {
        return "frozen"
    }
    return "live"
}

function isLive(mode: DriveMode): boolean {
    switch (mode) {
        case "live":
            return true
        case "frozen":
            return false
        default: {
            const exhaustive: never = mode
            return exhaustive
        }
    }
}

function unwrapControl(value: unknown): unknown {
    if (typeof value === "string") {
        const trimmed = value.trim()
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            try {
                return unwrapControl(JSON.parse(trimmed) as unknown)
            } catch {
                return value
            }
        }
        return value
    }
    if (
        value !== null &&
        typeof value === "object" &&
        "type" in value &&
        "value" in value
    ) {
        return unwrapControl((value as { value: unknown }).value)
    }
    return value
}

function readGroup(value: unknown): Record<string, unknown> | undefined {
    const raw = unwrapControl(value)
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        return undefined
    }
    const group: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(raw as Record<string, unknown>)) {
        group[key] = unwrapControl(entry)
    }
    return group
}

function controlNumber(value: unknown, fallback: number): number {
    const raw = unwrapControl(value)
    if (typeof raw === "number" && Number.isFinite(raw)) {
        return raw
    }
    if (typeof raw === "string" && raw.trim() !== "") {
        const parsed = Number(raw)
        if (Number.isFinite(parsed)) {
            return parsed
        }
    }
    return fallback
}

function controlBoolean(value: unknown, fallback: boolean): boolean {
    const raw = unwrapControl(value)
    if (typeof raw === "boolean") {
        return raw
    }
    return fallback
}

function resolveImageSrc(image: FramerImage): string {
    if (typeof image === "string") {
        return image
    }
    return image.src ?? image.url ?? ""
}

function readLink(value: unknown): string {
    const raw = unwrapControl(value)
    if (typeof raw === "string") {
        return raw
    }
    if (raw !== null && typeof raw === "object" && "href" in raw) {
        const href = (raw as { href?: unknown }).href
        return typeof href === "string" ? href : ""
    }
    return ""
}

function readPills(images: unknown): { src: string; alt: string; link: string }[] {
    const list = Array.isArray(images) ? images : []
    const entries = list
        .map((item) => {
            if (typeof item === "string") {
                return { src: item, alt: "", link: "" }
            }
            if (item === null || typeof item !== "object") {
                return { src: "", alt: "", link: "" }
            }
            const record = item as Record<string, unknown>
            const nested = record.image
            const source =
                nested === null || nested === undefined ? (item as FramerImage) : (nested as FramerImage)
            const src = resolveImageSrc(source)
            const alt =
                typeof source === "string" ? "" : (source.alt ?? source.altText ?? "")
            return { src, alt, link: readLink(record.link) }
        })
        .filter((entry) => entry.src.length > 0)
    if (entries.length > 0) {
        return entries.slice(0, MAX_IMAGES)
    }
    return PILLS.map((pill) => ({ src: pill.src, alt: pill.alt, link: "" }))
}

function scrollableAncestor(node: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = node.parentElement
    while (el) {
        const overflow = getComputedStyle(el).overflowY
        const scrolls =
            overflow === "auto" || overflow === "scroll" || overflow === "overlay"
        if (scrolls && el.scrollHeight - el.clientHeight > 4) {
            return el
        }
        el = el.parentElement
    }
    const doc = document.scrollingElement
    if (doc instanceof HTMLElement && doc.scrollHeight - doc.clientHeight > 4) {
        return doc
    }
    return null
}

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader {
    const shader = gl.createShader(type)
    if (!shader) {
        throw new Error("shader")
    }
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) ?? ""
        gl.deleteShader(shader)
        throw new Error(log)
    }
    return shader
}

function linkProgram(
    gl: WebGLRenderingContext,
    vert: string,
    frag: string
): WebGLProgram {
    const program = gl.createProgram()
    if (!program) {
        throw new Error("program")
    }
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vert))
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, frag))
    gl.bindAttribLocation(program, 0, "aPosition")
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program) ?? ""
        gl.deleteProgram(program)
        throw new Error(log)
    }
    return program
}

class Filmstrip {
    private gl: WebGLRenderingContext
    private cellProg: WebGLProgram
    private warpProg: WebGLProgram
    private quad: WebGLBuffer
    private fbo: WebGLFramebuffer
    private color: WebGLTexture
    private images = new Map<string, GpuTexture>()
    private loading = new Set<string>()
    private srcs: string[] = []
    private links: string[] = []
    private cells: { x: number; y: number; w: number; h: number; index: number }[] = []
    private travel = 0
    private params: SceneParams | null = null
    private cssW = 0
    private cssH = 0
    private bufferW = 0
    private bufferH = 0
    private offset = 140
    private velocity = 0
    private dragSpeed = 0
    private currentAberration = 0.028
    private flick: number[] = []
    private dragging = false
    private lastX = 0
    private lastT = 0
    private currentDistortion = -1.4
    private sheenX = SHEEN_REST[0]
    private sheenY = SHEEN_REST[1]
    private sheenVX = 0
    private sheenVY = 0
    private sheenTargetX = SHEEN_REST[0]
    private sheenTargetY = SHEEN_REST[1]
    private raf = 0
    private lastFrame = 0
    private shown = true
    private disposed = false

    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
        })
        if (!gl) {
            throw new Error("webgl")
        }
        this.gl = gl
        this.cellProg = linkProgram(gl, CELL_VERT, CELL_FRAG)
        this.warpProg = linkProgram(gl, QUAD_VERT, WARP_FRAG)
        const buffer = gl.createBuffer()
        if (!buffer) {
            throw new Error("buffer")
        }
        this.quad = buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
            gl.STATIC_DRAW
        )
        const frame = gl.createFramebuffer()
        const texture = gl.createTexture()
        if (!frame || !texture) {
            throw new Error("fbo")
        }
        this.fbo = frame
        this.color = texture
    }

    setImages(srcs: string[]): void {
        this.srcs = srcs.slice(0, MAX_IMAGES)
        for (const src of this.srcs) {
            this.load(src)
        }
    }

    setLinks(links: string[]): void {
        this.links = links.slice(0, MAX_IMAGES)
    }

    openAt(x: number, y: number): void {
        if (this.travel > 8 || typeof window === "undefined") {
            return
        }
        for (let i = this.cells.length - 1; i >= 0; i--) {
            const cell = this.cells[i]
            if (!cell) {
                continue
            }
            const inside =
                x >= cell.x && x <= cell.x + cell.w && y >= cell.y && y <= cell.y + cell.h
            const href = this.links[cell.index] ?? ""
            if (inside && href.length > 0) {
                window.open(href, "_blank", "noopener,noreferrer")
                return
            }
        }
    }

    setParams(params: SceneParams): void {
        this.params = params
        if (!this.dragging) {
            this.currentDistortion = params.distortionStrength
            this.currentAberration = params.aberration
        }
        if (params.frozen) {
            if (this.cssW >= 2) {
                this.draw()
            }
            return
        }
        this.startLoop()
    }

    setSize(cssW: number, cssH: number): void {
        const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
        this.cssW = cssW
        this.cssH = cssH
        this.bufferW = Math.max(2, Math.round(cssW * ratio))
        this.bufferH = Math.max(2, Math.round(cssH * ratio))
        const canvas = this.gl.canvas as HTMLCanvasElement
        canvas.width = this.bufferW
        canvas.height = this.bufferH
        this.allocTarget()
        this.draw()
    }

    setShown(shown: boolean): void {
        this.shown = shown
        if (!shown) {
            this.stopLoop()
            return
        }
        if (!this.params || this.params.frozen) {
            this.stopLoop()
            if (this.cssW >= 2) {
                this.draw()
            }
            return
        }
        this.startLoop()
    }

    pause(): void {
        this.stopLoop()
    }

    pointerDown(x: number): void {
        if (!this.params || this.params.frozen) {
            return
        }
        this.dragging = true
        this.travel = 0
        this.flick = []
        this.velocity = 0
        this.dragSpeed = 0
        this.lastX = x
        this.lastT = performance.now()
        this.startLoop()
    }

    pointerMove(x: number): void {
        if (!this.dragging || !this.params || this.params.frozen) {
            return
        }
        const now = performance.now()
        const delta = clamp(x - this.lastX, -180, 180)
        const dt = Math.max((now - this.lastT) / 1000, 1 / 120)
        this.travel += Math.abs(delta)
        this.offset -= delta
        if (Math.abs(delta) > 0.4) {
            const sample = clamp((-delta / dt) * this.params.inertia, -2400, 2400)
            this.dragSpeed = sample
            this.flick.push(sample)
            if (this.flick.length > 5) {
                this.flick.shift()
            }
        }
        this.lastX = x
        this.lastT = now
    }

    pointerUp(): void {
        this.dragging = false
        this.dragSpeed = 0
        let peak = 0
        for (const sample of this.flick) {
            if (Math.abs(sample) > Math.abs(peak)) {
                peak = sample
            }
        }
        if (this.flick.length > 0) {
            this.velocity = peak
        }
        this.flick = []
    }

    addScroll(delta: number): void {
        if (!this.params || this.params.frozen) {
            return
        }
        this.velocity = clamp(
            this.velocity + delta * 0.85 * this.params.inertia,
            -1400,
            1400
        )
        this.startLoop()
    }

    aimSheen(u: number, v: number): void {
        if (!this.params || this.params.frozen) {
            return
        }
        this.sheenTargetX = clamp(u, 0.08, 0.92)
        this.sheenTargetY = clamp(v, 0.08, 0.92)
        this.startLoop()
    }

    parkSheen(): void {
        this.sheenTargetX = SHEEN_REST[0]
        this.sheenTargetY = SHEEN_REST[1]
        if (this.params && !this.params.frozen) {
            this.startLoop()
        }
    }

    dispose(): void {
        this.disposed = true
        this.stopLoop()
        const gl = this.gl
        gl.deleteProgram(this.cellProg)
        gl.deleteProgram(this.warpProg)
        gl.deleteBuffer(this.quad)
        gl.deleteFramebuffer(this.fbo)
        gl.deleteTexture(this.color)
        for (const image of this.images.values()) {
            gl.deleteTexture(image.texture)
        }
        this.images.clear()
    }

    private load(src: string): void {
        if (this.images.has(src) || this.loading.has(src)) {
            return
        }
        this.loading.add(src)
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            this.loading.delete(src)
            if (this.disposed) {
                return
            }
            const gl = this.gl
            const texture = gl.createTexture()
            if (!texture) {
                return
            }
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
            } catch {
                gl.deleteTexture(texture)
                return
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            this.images.set(src, { texture, width: img.naturalWidth, height: img.naturalHeight })
            if (this.cssW >= 2) {
                this.draw()
            }
        }
        img.onerror = () => {
            this.loading.delete(src)
        }
        img.src = src
    }

    private draw(): void {
        const params = this.params
        if (!params || this.cssW < 2 || this.cssH < 2) {
            return
        }
        const gl = this.gl
        const scale = Math.min(this.cssW / SCENE_W, this.cssH / SCENE_H)
        const pillW = params.pillWidth * scale
        const pillH = params.pillHeight * scale
        const corner = clamp(params.corner * scale, 0, Math.min(pillW, pillH) * 0.5)
        const gap = params.gap * scale
        const stride = Math.max(pillW + gap, 1)
        const count = Math.max(this.srcs.length, 1)
        const span = stride * count
        const shift = ((this.offset % span) + span) % span
        const strength = params.frozen ? params.distortionStrength : this.currentDistortion
        const aberration = params.frozen ? params.aberration : this.currentAberration
        const sheenX = params.frozen ? SHEEN_REST[0] : this.sheenX
        const sheenY = params.frozen ? SHEEN_REST[1] : this.sheenY

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.viewport(0, 0, this.bufferW, this.bufferH)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.useProgram(this.cellProg)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
        const uRect = gl.getUniformLocation(this.cellProg, "uRect")
        const uView = gl.getUniformLocation(this.cellProg, "uView")
        const uSize = gl.getUniformLocation(this.cellProg, "uSize")
        const uRadius = gl.getUniformLocation(this.cellProg, "uRadius")
        const uImageSize = gl.getUniformLocation(this.cellProg, "uImageSize")
        const uHasImage = gl.getUniformLocation(this.cellProg, "uHasImage")
        gl.uniform2f(uView, this.cssW, this.cssH)
        gl.uniform2f(uSize, pillW, pillH)
        gl.uniform1f(uRadius, corner)
        gl.uniform1i(gl.getUniformLocation(this.cellProg, "map"), 0)
        const y = (this.cssH - pillH) / 2
        const start = Math.floor((shift - pillW) / stride) - 1
        this.cells = []
        for (let n = 0; n < count + 8; n++) {
            const i = start + n
            const x = i * stride - shift
            if (x > this.cssW + pillW) {
                break
            }
            if (x + pillW < -pillW) {
                continue
            }
            const index = ((i % count) + count) % count
            const src = this.srcs[index] ?? ""
            const image = this.images.get(src)
            this.cells.push({ x, y, w: pillW, h: pillH, index })
            gl.uniform4f(uRect, x, y, pillW, pillH)
            if (image) {
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, image.texture)
                gl.uniform2f(uImageSize, image.width, image.height)
                gl.uniform1f(uHasImage, 1)
            } else {
                gl.uniform2f(uImageSize, 0, 0)
                gl.uniform1f(uHasImage, 0)
            }
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }

        gl.disable(gl.BLEND)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, this.bufferW, this.bufferH)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.warpProg)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.color)
        gl.uniform1i(gl.getUniformLocation(this.warpProg, "tDiffuse"), 0)
        gl.uniform1f(gl.getUniformLocation(this.warpProg, "uDistortionStrength"), strength)
        gl.uniform1f(gl.getUniformLocation(this.warpProg, "uZoom"), params.zoom)
        gl.uniform1f(gl.getUniformLocation(this.warpProg, "uAberration"), aberration)
        gl.uniform1f(gl.getUniformLocation(this.warpProg, "uAberrationRest"), params.aberration)
        gl.uniform1f(gl.getUniformLocation(this.warpProg, "uGlossIntensity"), params.gloss)
        gl.uniform1f(gl.getUniformLocation(this.warpProg, "uVerticalScale"), params.verticalScale)
        gl.uniform2f(gl.getUniformLocation(this.warpProg, "uSheen"), sheenX, sheenY)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    private allocTarget(): void {
        const gl = this.gl
        gl.bindTexture(gl.TEXTURE_2D, this.color)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.bufferW,
            this.bufferH,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.color,
            0
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    private startLoop(): void {
        if (this.raf || this.disposed || !this.shown) {
            return
        }
        if (this.params?.frozen) {
            this.draw()
            return
        }
        this.lastFrame = performance.now()
        this.raf = requestAnimationFrame((now) => this.tick(now))
    }

    private stopLoop(): void {
        if (this.raf) {
            cancelAnimationFrame(this.raf)
            this.raf = 0
        }
    }

    private tick(now: number): void {
        if (this.disposed) {
            return
        }
        const params = this.params
        if (!params || params.frozen || !this.shown) {
            this.raf = 0
            if (params?.frozen && this.shown) {
                this.draw()
            }
            return
        }
        const dt = Math.min(Math.max((now - this.lastFrame) / 1000, 0.0001), 0.05)
        this.lastFrame = now
        if (!this.dragging) {
            const cruise = params.autoScroll ? -AUTO_SCROLL_PX : 0
            const lambda = 0.85 + clamp(params.viscosity, 0.2, 12) * 0.06
            const opposite =
                cruise !== 0 &&
                this.velocity !== 0 &&
                Math.sign(this.velocity) !== Math.sign(cruise)
            if (opposite) {
                this.velocity *= Math.exp(-lambda * dt)
                if (Math.abs(this.velocity) < 8) {
                    this.velocity = 0
                }
            } else {
                const excess = this.velocity - cruise
                this.velocity = cruise + excess * Math.exp(-lambda * dt)
            }
            this.offset += this.velocity * dt
        }
        this.dragSpeed *= Math.exp(-8 * dt)
        const speed = Math.max(Math.abs(this.velocity), Math.abs(this.dragSpeed))
        const extra = Math.min(Math.max(speed - 40, 0) * 0.00005, 0.08)
        const targetAberration = Math.min(params.aberration + extra, 0.14)
        this.currentAberration = damp(
            this.currentAberration,
            targetAberration,
            Math.max(params.viscosity, 0.01),
            dt
        )
        const flexCap = Math.min(Math.abs(params.distortionStrength) * 0.22, 0.16)
        const kick = Math.min(Math.abs(this.velocity) * 0.00032 * Math.max(params.inertia, 0), flexCap)
        const targetDist =
            params.distortionStrength >= 0
                ? Math.min(params.distortionStrength + kick, 1.5)
                : Math.max(params.distortionStrength - kick, -2)
        this.currentDistortion = damp(
            this.currentDistortion,
            targetDist,
            Math.max(params.viscosity, 0.01),
            dt
        )
        const sheenX = springStep(this.sheenX, this.sheenVX, this.sheenTargetX, dt)
        this.sheenX = sheenX[0]
        this.sheenVX = sheenX[1]
        const sheenY = springStep(this.sheenY, this.sheenVY, this.sheenTargetY, dt)
        this.sheenY = sheenY[0]
        this.sheenVY = sheenY[1]
        this.draw()
        const settled =
            !params.autoScroll &&
            !this.dragging &&
            Math.abs(this.velocity) < 0.4 &&
            Math.abs(this.currentDistortion - params.distortionStrength) < 0.002 &&
            Math.abs(this.currentAberration - params.aberration) < 0.001 &&
            Math.abs(this.sheenX - this.sheenTargetX) < 0.002 &&
            Math.abs(this.sheenY - this.sheenTargetY) < 0.002
        if (settled) {
            this.raf = 0
            return
        }
        this.raf = requestAnimationFrame((next) => this.tick(next))
    }
}

export default function Kern_Pills(props: KernPillsProps): ReactElement {
    const record = props as unknown as Record<string, unknown>
    const contentGroup = readGroup(props.content) ?? readGroup(record.$control__content)
    const lookGroup = readGroup(props.look) ?? readGroup(record.$control__look)
    const layoutGroup = readGroup(props.layout) ?? readGroup(record.$control__layout)
    const motionGroup = readGroup(props.motion) ?? readGroup(record.$control__motion)
    const images =
        (contentGroup?.images as FramerImage[] | undefined) ?? props.images ?? PILLS
    const pills = readPills(images)
    const zoom = controlNumber(lookGroup?.zoom ?? props.zoom, 1.14)
    const aberration = controlNumber(lookGroup?.aberration ?? props.aberration, 0.028)
    const gloss = controlNumber(lookGroup?.gloss ?? props.gloss, 0.5)
    const verticalScale = controlNumber(lookGroup?.verticalScale ?? props.verticalScale, 0.25)
    const pillWidth = controlNumber(layoutGroup?.pillWidth ?? props.pillWidth, PILL_W)
    const pillHeight = controlNumber(layoutGroup?.pillHeight ?? props.pillHeight, PILL_H)
    const corner = controlNumber(layoutGroup?.corner ?? props.corner, PILL_RADIUS)
    const gap = controlNumber(layoutGroup?.gap ?? props.gap, GAP)
    const autoScroll = motionGroup
        ? controlBoolean(motionGroup.autoScroll, true)
        : controlBoolean(props.autoScroll, true)
    const inertia = motionGroup
        ? controlNumber(motionGroup.inertia, 1.1)
        : controlNumber(props.inertia, 1.1)
    const viscosity = motionGroup
        ? controlNumber(motionGroup.viscosity, 5.5)
        : controlNumber(props.viscosity, 5.5)
    const warpStrength = controlNumber(
        lookGroup?.distortionStrength ??
            lookGroup?.distortion ??
            props.distortionStrength ??
            props.distortion,
        -1.4
    )
    const isStatic = useIsStaticRenderer()
    const reducedMotion = Boolean(useReducedMotion())
    const frozen = !isLive(driveMode(isStatic, reducedMotion))
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gpuRef = useRef<Filmstrip | null>(null)
    const pageScrollsRef = useRef(false)
    const [glEpoch, setGlEpoch] = useState(0)
    const liveRef = useRef<SceneParams>({
        distortionStrength: warpStrength,
        zoom,
        aberration,
        gloss,
        verticalScale,
        pillWidth,
        pillHeight,
        corner,
        gap,
        autoScroll: frozen ? false : autoScroll,
        inertia,
        viscosity,
        frozen,
    })
    const imagesRef = useRef(images)
    liveRef.current = {
        distortionStrength: warpStrength,
        zoom,
        aberration,
        gloss,
        verticalScale,
        pillWidth,
        pillHeight,
        corner,
        gap,
        autoScroll: frozen ? false : autoScroll,
        inertia,
        viscosity,
        frozen,
    }
    imagesRef.current = images

    useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root || typeof window === "undefined") {
            return
        }
        let alive = true
        let gpu: Filmstrip | null = null
        let intersecting = true
        const boot = () => {
            if (!alive) {
                return
            }
            const w = root.clientWidth
            const h = root.clientHeight
            if (w < 2 || h < 2) {
                gpu?.setShown(false)
                return
            }
            if (!gpu) {
                gpu = new Filmstrip(canvas)
                gpuRef.current = gpu
            }
            gpu.setImages(readPills(imagesRef.current).map((pill) => pill.src))
            gpu.setLinks(readPills(imagesRef.current).map((pill) => pill.link))
            gpu.setParams(liveRef.current)
            gpu.setSize(w, h)
            gpu.setShown(intersecting)
        }
        const onLost = (event: Event) => {
            event.preventDefault()
            gpuRef.current?.pause()
        }
        const onRestored = () => {
            if (alive) {
                setGlEpoch((epoch) => epoch + 1)
            }
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => {
                      boot()
                  })
                : null
        ro?.observe(root)
        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver((entries) => {
                intersecting = entries.some((entry) => entry.isIntersecting)
                if (!intersecting) {
                    gpu?.setShown(false)
                    return
                }
                boot()
            })
            io.observe(root)
        }
        boot()
        const scroller = scrollableAncestor(root)
        pageScrollsRef.current = scroller !== null
        const viewport =
            scroller === document.scrollingElement ||
            scroller === document.documentElement ||
            scroller === document.body
        const scrollTarget: EventTarget | null = scroller
            ? viewport
                ? window
                : scroller
            : null
        let lastScroll = viewport ? window.scrollY : (scroller?.scrollTop ?? 0)
        const onPageScroll = () => {
            const next = viewport ? window.scrollY : (scroller?.scrollTop ?? 0)
            const delta = next - lastScroll
            lastScroll = next
            if (delta !== 0) {
                gpuRef.current?.addScroll(delta)
            }
        }
        scrollTarget?.addEventListener("scroll", onPageScroll, { passive: true })
        return () => {
            alive = false
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            scrollTarget?.removeEventListener("scroll", onPageScroll)
            ro?.disconnect()
            io?.disconnect()
            gpu?.dispose()
            gpuRef.current = null
        }
    }, [glEpoch])

    useEffect(() => {
        const gpu = gpuRef.current
        if (!gpu) {
            return
        }
        gpu.setImages(pills.map((pill) => pill.src))
        gpu.setLinks(pills.map((pill) => pill.link))
        gpu.setParams(liveRef.current)
        if (frozen) {
            gpu.setShown(true)
        }
    }, [
        images,
        warpStrength,
        zoom,
        aberration,
        gloss,
        verticalScale,
        pillWidth,
        pillHeight,
        corner,
        gap,
        autoScroll,
        inertia,
        viscosity,
        frozen,
    ])

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch" && pageScrollsRef.current) {
            return
        }
        try {
            event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
            /* The pointer can already be released. */
        }
        gpuRef.current?.pointerDown(event.clientX)
    }
    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const u = (event.clientX - rect.left) / Math.max(rect.width, 1)
        const v = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1)
        gpuRef.current?.aimSheen(u, v)
        gpuRef.current?.pointerMove(event.clientX)
    }
    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            try {
                event.currentTarget.releasePointerCapture(event.pointerId)
            } catch {
                /* The pointer can already be released. */
            }
        }
        gpuRef.current?.pointerUp()
        const rect = event.currentTarget.getBoundingClientRect()
        gpuRef.current?.openAt(event.clientX - rect.left, event.clientY - rect.top)
        const inside =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        if (!inside) {
            gpuRef.current?.parkSheen()
        }
    }
    const onPointerLeave = () => {
        gpuRef.current?.parkSheen()
    }
    const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
        if (pageScrollsRef.current) {
            return
        }
        const delta =
            Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
        gpuRef.current?.addScroll(delta)
    }

    return (
        <div
            ref={rootRef}
            aria-label={
                pills
                    .map((pill) => pill.alt)
                    .filter((alt) => alt.length > 0)
                    .join(", ") || "Photo pills"
            }
            onPointerDown={frozen ? undefined : onPointerDown}
            onPointerMove={frozen ? undefined : onPointerMove}
            onPointerUp={frozen ? undefined : onPointerUp}
            onPointerCancel={frozen ? undefined : onPointerUp}
            onPointerLeave={frozen ? undefined : onPointerLeave}
            onWheel={frozen ? undefined : onWheel}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                touchAction: frozen ? "auto" : "pan-y",
                cursor: frozen ? "default" : "grab",
                ...props.style,
                backgroundColor: "transparent",
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

addPropertyControls(Kern_Pills, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            images: {
                type: ControlType.Array,
                title: "Images",
                maxCount: MAX_IMAGES,
                control: {
                    type: ControlType.Object,
                    controls: {
                        image: {
                            type: ControlType.ResponsiveImage,
                            title: "Image",
                        },
                        link: {
                            type: ControlType.Link,
                            title: "Link",
                        },
                    },
                },
                defaultValue: PILLS.map((pill) => ({
                    image: pill,
                    link: "",
                })),
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        controls: {
            distortionStrength: {
                type: ControlType.Number,
                title: "Distortion",
                defaultValue: -1.4,
                min: -2,
                max: 1.5,
                step: 0.01,
                description: "Neg = wide shallow dish. Pos = pinch that fills the frame.",
            },
            verticalScale: {
                type: ControlType.Number,
                title: "Vertical Scale",
                defaultValue: 0.25,
                min: 0.05,
                max: 1,
                step: 0.01,
                description: "Flattens the lens along the row.",
            },
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                defaultValue: 1.14,
                min: 0.5,
                max: 2,
                step: 0.01,
                description: "Magnification inside the glass.",
            },
            aberration: {
                type: ControlType.Number,
                title: "Aberration",
                defaultValue: 0.028,
                min: 0,
                max: 0.08,
                step: 0.001,
                description: "Fringe on the rim. In preview, a faster drag adds more, then it settles.",
            },
            gloss: {
                type: ControlType.Number,
                title: "Gloss",
                defaultValue: 0.5,
                min: 0,
                max: 1.5,
                step: 0.05,
                description: "A thin reflection along the lens. It caps before the photo blows out.",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            corner: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: PILL_RADIUS,
                min: 0,
                max: 210,
                step: 1,
                unit: "px",
                description: "0 is a sharp corner. Half the short side is a pill. Past that it stays a pill.",
            },
            pillWidth: {
                type: ControlType.Number,
                title: "Pill Width",
                defaultValue: PILL_W,
                min: 120,
                max: 640,
                step: 1,
                unit: "px",
            },
            pillHeight: {
                type: ControlType.Number,
                title: "Pill Height",
                defaultValue: PILL_H,
                min: 80,
                max: 420,
                step: 1,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: GAP,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description:
            "[Explore more components](https://www.framer.com/%40builtbykern/)\n[Made in Framer](https://www.framer.com/?via=builtbykern)",
        controls: {
            autoScroll: {
                type: ControlType.Boolean,
                title: "Auto Scroll",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "The row travels on its own. Off while the canvas is frozen.",
            },
            inertia: {
                type: ControlType.Number,
                title: "Inertia",
                defaultValue: 1.1,
                min: 0,
                max: 3,
                step: 0.1,
                description: "How far a drag keeps the row moving. Preview only. The canvas stays still.",
            },
            viscosity: {
                type: ControlType.Number,
                title: "Viscosity",
                defaultValue: 5.5,
                min: 0.2,
                max: 12,
                step: 0.1,
                description: "How quickly the glass settles after a move. Preview only. The canvas stays still.",
            },
        },
    },
})
