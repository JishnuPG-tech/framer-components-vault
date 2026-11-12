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
 * Kern — Lens Warp
 * One photo grid under a single optical lens.
 */

type DriveMode = "live" | "frozen"

type FramerImage =
    | string
    | {
          src?: string
          url?: string
          srcSet?: string
          alt?: string
          altText?: string
      }

interface ContentControls {
    images?: FramerImage[]
}

interface LookControls {
    distortionStrength?: number
    distortion?: number
    radius?: number
    zoom?: number
    aberration?: number
    gloss?: number
    backgroundColor?: string
    fill?: string
}

interface LayoutControls {
    columns?: number
    gap?: number
    cellRadius?: number
}

interface MotionControls {
    autoScroll?: boolean
    inertia?: number
    viscosity?: number
}

interface PreviewControls {
    kern?: boolean
}

interface KernLensWarpProps {
    content?: ContentControls
    look?: LookControls
    layout?: LayoutControls
    motion?: MotionControls
    preview?: PreviewControls
    images?: FramerImage[]
    distortionStrength?: number
    distortion?: number
    radius?: number
    zoom?: number
    aberration?: number
    gloss?: number
    backgroundColor?: string
    fill?: string
    columns?: number
    gap?: number
    cellRadius?: number
    autoScroll?: boolean
    inertia?: number
    viscosity?: number
    style?: CSSProperties
}

interface SceneParams {
    distortionStrength: number
    radius: number
    zoom: number
    aberration: number
    gloss: number
    backgroundColor: string
    columns: number
    gap: number
    cellRadius: number
    autoScroll: boolean
    inertia: number
    viscosity: number
    frozen: boolean
}

const CLASS = "kern-lens-warp"
const MAX_PIXEL_RATIO = 2
const PAPER = "#F4F3F0"
const EXTRA_ROWS = 4
const AUTO_SCROLL_PX = 36
const MAX_IMAGES = 9
const VISIBLE_ROWS = 3

/** Drop stills from the BuiltByKern Lummi library. The Images control replaces them. */
const DEFAULT_IMAGES: FramerImage[] = [
    {
        src: "https://framerusercontent.com/images/LRMYGQtssf7cxsEW3vvT5Vp7xk.png",
        alt: "Elegant townhouses",
    },
    {
        src: "https://framerusercontent.com/images/nXv2WAAF5QwYfaUOtjI6GceF3nw.png",
        alt: "Pastel townhouses at dusk",
    },
    {
        src: "https://framerusercontent.com/images/egF6sqmHtrlHtXqnQnFnSSDnDg.png",
        alt: "Cobblestone street",
    },
    {
        src: "https://framerusercontent.com/images/CVNFTeshuViGx7o9gsTkqpxly8.png",
        alt: "Keys and townhouses",
    },
    {
        src: "https://framerusercontent.com/images/fSsN54XyylKtTjJ5jSn0TeqXps.png",
        alt: "Ornate building facade",
    },
    {
        src: "https://framerusercontent.com/images/6pBZmYFRIEQVMazxyUuVrDVATPM.png",
        alt: "Minimalist hallway",
    },
    {
        src: "https://framerusercontent.com/images/pY9zhug85SvHbWpBIBps8Ncnrw.png",
        alt: "Modern staircase",
    },
    {
        src: "https://framerusercontent.com/images/QLzbC3pIILT0rWVXYCItJjsqRbk.jpg",
        alt: "Quiet hallway",
    },
    {
        src: "https://framerusercontent.com/images/2IgQ3Ss6ou8U8LY0N9mBIozZ2Vw.jpg",
        alt: "Empty waiting room",
    },
]

const QUAD_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, aPosition.y * 0.5 + 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const CELL_VERT = `
attribute vec2 aPosition;
uniform vec4 uRect;
varying vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, aPosition.y * 0.5 + 0.5);
  gl_Position = vec4(uRect.xy + aPosition * uRect.zw, 0.0, 1.0);
}
`

const CELL_FRAG = `
precision highp float;
uniform sampler2D map;
uniform vec2 uSize;
uniform float uRadius;
uniform vec2 uImageSize;
uniform float uHasImage;
uniform vec3 uBgColor;
varying vec2 vUv;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  vec2 b = uSize * 0.5;
  float rad = min(uRadius, min(b.x, b.y));
  float d = sdRoundedBox(p, b, rad);
  float alpha = 1.0 - smoothstep(-0.8, 0.8, d);
  if (alpha < 0.001) {
    discard;
  }

  vec2 coverUv = vUv;
  if (uHasImage > 0.5 && uImageSize.x > 0.0 && uImageSize.y > 0.0) {
    float cellAspect = uSize.x / max(uSize.y, 0.001);
    float imgAspect = uImageSize.x / max(uImageSize.y, 0.001);
    if (cellAspect > imgAspect) {
      float scale = imgAspect / cellAspect;
      coverUv = vec2(vUv.x, (vUv.y - 0.5) * scale + 0.5);
    } else {
      float scale = cellAspect / imgAspect;
      coverUv = vec2((vUv.x - 0.5) * scale + 0.5, vUv.y);
    }
    vec4 tex = texture2D(map, coverUv);
    gl_FragColor = vec4(tex.rgb, tex.a * alpha);
    return;
  }
  gl_FragColor = vec4(uBgColor, alpha);
}
`

const WARP_FRAG = `
precision highp float;
uniform sampler2D tDiffuse;
uniform float uDistortionStrength;
uniform float uRadius;
uniform float uZoom;
uniform float uAberration;
uniform float uGlossIntensity;
uniform vec2 uSheen;
uniform vec3 uBgColor;
varying vec2 vUv;

vec4 sampleBuffer(vec2 coord) {
  if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) {
    return vec4(uBgColor, 1.0);
  }
  return texture2D(tDiffuse, coord);
}

void main() {
  vec2 uvDist = (vUv - vec2(0.5)) / max(uZoom, 0.0001);
  float dist = length(uvDist);
  float r = max(uRadius, 0.0001);
  float normDist = dist / r;
  float distSq = normDist * normDist;
  vec2 refractedUV;
  vec2 shadeDir;
  float shadeNorm;
  float slope;
  float bend = 0.0;
  if (uDistortionStrength >= 0.0) {
    vec2 raw = vUv + uvDist * distSq * uDistortionStrength;
    vec2 cDist = (vec2(0.0) - vec2(0.5)) / max(uZoom, 0.0001);
    float cSq = pow(length(cDist) / r, 2.0);
    vec2 cRefr = vec2(0.0) + cDist * cSq * uDistortionStrength;
    float span = max(abs(cRefr.x - 0.5), abs(cRefr.y - 0.5));
    float cover = span > 0.5 ? 0.5 / span : 1.0;
    refractedUV = clamp(vec2(0.5) + (raw - vec2(0.5)) * cover, 0.001, 0.999);
    shadeDir = dist > 0.0001 ? uvDist / dist : vec2(0.0);
    shadeNorm = normDist;
    slope = 2.0 * uDistortionStrength * normDist;
    bend = clamp(uDistortionStrength / 1.5, 0.0, 1.0);
  } else {
    vec2 p = vUv - vec2(0.5);
    float d = clamp(max(abs(p.x), abs(p.y)) * 2.0, 0.0, 1.0);
    float t = clamp(-uDistortionStrength / 2.0, 0.0, 1.0);
    float sag = 0.2 * smoothstep(0.0, 0.8, t);
    float k = 1.0 - sag * d * d;
    float kEdge = max(1.0 - sag, 0.75);
    refractedUV = clamp(vec2(0.5) + p * k / kEdge, 0.001, 0.999);
    shadeDir = length(p) > 0.0001 ? normalize(p) : vec2(0.0);
    shadeNorm = d;
    slope = 1.5 * sag * d;
    bend = smoothstep(0.0, 0.8, t);
  }
  float edge = clamp(max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0, 0.0, 1.0);
  float rim = smoothstep(0.62, 1.0, edge);
  float fringeAmt = uAberration * rim * mix(0.08, 0.22, bend);
  vec2 sp = vUv - uSheen;
  float bulge = exp(-dot(sp, sp) * 28.0);
  vec2 lensDir = length(sp) > 0.0001 ? normalize(sp) : vec2(0.0);
  float glassAmt = bulge * clamp(uGlossIntensity, 0.0, 1.5);
  vec2 glassNudge = sp * glassAmt * 0.008;
  float lensSplit = glassAmt * uAberration * 0.35;
  vec2 sampleUV = clamp(refractedUV + glassNudge, 0.001, 0.999);
  vec4 colR = sampleBuffer(clamp(sampleUV + shadeDir * fringeAmt + lensDir * lensSplit, 0.001, 0.999));
  vec4 colG = sampleBuffer(sampleUV);
  vec4 colB = sampleBuffer(clamp(sampleUV - shadeDir * fringeAmt - lensDir * lensSplit, 0.001, 0.999));
  vec3 split = vec3(colR.r, colG.g, colB.b);
  vec3 refractedRgb = mix(colG.rgb, split, 0.55);
  float alpha = colG.a;

  vec3 normal = normalize(vec3(-shadeDir * slope * 1.5, 1.0));
  vec3 lightDir = normalize(vec3(-0.25, 0.65, 0.72));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfVec = normalize(lightDir + viewDir);
  float specular = pow(max(dot(normal, halfVec), 0.0), 36.0);
  float rimMask = smoothstep(0.15, 0.75, shadeNorm) * smoothstep(1.25, 0.88, shadeNorm);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  float edgeGleam = fresnel * smoothstep(0.35, 0.95, shadeNorm) * 0.35;
  float gloss = clamp((specular * rimMask + edgeGleam) * uGlossIntensity, 0.0, 1.0);
  vec2 streakP = vUv - uSheen;
  float streak = exp(-(streakP.x * streakP.x * 3.2 + streakP.y * streakP.y * 80.0));
  float disc = exp(-dot(streakP, streakP) * 22.0);
  float pane = clamp((streak * 0.7 + disc * 0.22) * uGlossIntensity, 0.0, 1.0);
  vec3 rimLit = refractedRgb + vec3(gloss * 0.22) * (1.0 - refractedRgb);
  vec3 lit = rimLit + vec3(pane * 0.22) * (1.0 - rimLit);
  gl_FragColor = vec4(lit, alpha);
}
`

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

function resolveImageSrc(image: FramerImage | undefined): string {
    if (typeof image === "string" && image.length > 0) {
        return image
    }
    if (image && typeof image === "object") {
        const src = image.src ?? image.url
        if (typeof src === "string" && src.length > 0) {
            return src
        }
    }
    return ""
}

function parseCssColor(input: string): [number, number, number] {
    const value = input.trim()
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)
    if (hex && hex[1]) {
        let h = hex[1]
        if (h.length === 3) {
            h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
        }
        return [
            parseInt(h.slice(0, 2), 16) / 255,
            parseInt(h.slice(2, 4), 16) / 255,
            parseInt(h.slice(4, 6), 16) / 255,
        ]
    }
    const rgb =
        /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i.exec(value)
    if (rgb) {
        const r = Number(rgb[1])
        const g = Number(rgb[2])
        const b = Number(rgb[3])
        const scale = r > 1 || g > 1 || b > 1 ? 255 : 1
        return [r / scale, g / scale, b / scale]
    }
    return [0.9569, 0.9529, 0.9412]
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function damp(current: number, target: number, lambda: number, dt: number): number {
    return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function inertiaScale(inertia: number): number {
    return 0.25 + clamp(inertia, 0, 1) * 1.75
}

function viscosityLambda(viscosity: number): number {
    return 2 + clamp(viscosity, 0, 1) * 14
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

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) {
        return null
    }
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
    }
    return shader
}

function linkProgram(
    gl: WebGLRenderingContext,
    vertSrc: string,
    fragSrc: string,
    attrib: string
): WebGLProgram | null {
    const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
    if (!vert || !frag) {
        return null
    }
    const program = gl.createProgram()
    if (!program) {
        gl.deleteShader(vert)
        gl.deleteShader(frag)
        return null
    }
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.bindAttribLocation(program, 0, attrib)
    gl.linkProgram(program)
    gl.deleteShader(vert)
    gl.deleteShader(frag)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program)
        return null
    }
    return program
}

function springStep(
    value: number,
    velocity: number,
    target: number,
    dt: number
): [number, number] {
    const stiffness = 80
    const damping = 16
    const mass = 1
    const omega = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))
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
            ((b * wd - a * zeta * omega) * cos -
                (a * wd + b * zeta * omega) * sin)
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

interface GpuTexture {
    texture: WebGLTexture
    width: number
    height: number
    ready: boolean
    src: string
}

class OpticalGlass {
    private gl: WebGLRenderingContext | null
    private cellProg: WebGLProgram | null = null
    private warpProg: WebGLProgram | null = null
    private quad: WebGLBuffer | null = null
    private fbo: WebGLFramebuffer | null = null
    private fboTex: WebGLTexture | null = null
    private fboW = 0
    private fboH = 0
    private cellLocs: Record<string, WebGLUniformLocation | null> = {}
    private warpLocs: Record<string, WebGLUniformLocation | null> = {}
    private gpu: GpuTexture[] = []
    private params: SceneParams | null = null
    private cssW = 1
    private cssH = 1
    private offset = 0
    private velocity = 0
    private velDeriv = 0
    private currentDistortion = -1.4
    private dragging = false
    private sheenX = 0.36
    private sheenY = 0.68
    private sheenVX = 0
    private sheenVY = 0
    private sheenTargetX = 0.36
    private sheenTargetY = 0.68
    private lastY = 0
    private lastT = 0
    private raf = 0
    private lastFrame = 0
    private disposed = false
    private shown = false
    private blank: WebGLTexture | null = null

    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext("webgl", {
            alpha: false,
            antialias: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: true,
            powerPreference: "default",
        })
        this.gl = gl
        if (!gl) {
            return
        }
        this.cellProg = linkProgram(gl, CELL_VERT, CELL_FRAG, "aPosition")
        this.warpProg = linkProgram(gl, QUAD_VERT, WARP_FRAG, "aPosition")
        if (!this.cellProg || !this.warpProg) {
            return
        }
        this.quad = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )
        this.blank = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.blank)
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
            new Uint8Array([244, 243, 240, 255])
        )
        this.cellLocs = {
            map: gl.getUniformLocation(this.cellProg, "map"),
            uRect: gl.getUniformLocation(this.cellProg, "uRect"),
            uSize: gl.getUniformLocation(this.cellProg, "uSize"),
            uRadius: gl.getUniformLocation(this.cellProg, "uRadius"),
            uImageSize: gl.getUniformLocation(this.cellProg, "uImageSize"),
            uHasImage: gl.getUniformLocation(this.cellProg, "uHasImage"),
            uBgColor: gl.getUniformLocation(this.cellProg, "uBgColor"),
        }
        this.warpLocs = {
            tDiffuse: gl.getUniformLocation(this.warpProg, "tDiffuse"),
            uDistortionStrength: gl.getUniformLocation(
                this.warpProg,
                "uDistortionStrength"
            ),
            uRadius: gl.getUniformLocation(this.warpProg, "uRadius"),
            uZoom: gl.getUniformLocation(this.warpProg, "uZoom"),
            uAberration: gl.getUniformLocation(this.warpProg, "uAberration"),
            uGlossIntensity: gl.getUniformLocation(
                this.warpProg,
                "uGlossIntensity"
            ),
            uSheen: gl.getUniformLocation(this.warpProg, "uSheen"),
            uBgColor: gl.getUniformLocation(this.warpProg, "uBgColor"),
        }
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        this.tick = this.tick.bind(this)
    }

    get ok(): boolean {
        return (
            this.gl !== null &&
            this.cellProg !== null &&
            this.warpProg !== null
        )
    }

    setSize(cssW: number, cssH: number): void {
        const gl = this.gl
        if (!gl) {
            return
        }
        if (cssW < 2 || cssH < 2) {
            return
        }
        this.cssW = cssW
        this.cssH = cssH
        const dpr = Math.min(
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
            MAX_PIXEL_RATIO
        )
        const bw = Math.max(1, Math.round(this.cssW * dpr))
        const bh = Math.max(1, Math.round(this.cssH * dpr))
        const canvas = gl.canvas as HTMLCanvasElement
        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw
            canvas.height = bh
        }
        this.ensureFbo(bw, bh)
        this.draw()
    }

    setImages(srcs: string[]): void {
        const gl = this.gl
        if (!gl) {
            return
        }
        const next = srcs.filter((s) => s.length > 0).slice(0, MAX_IMAGES)
        const same =
            next.length === this.gpu.length &&
            next.every((src, i) => this.gpu[i] && this.gpu[i].src === src)
        if (same) {
            return
        }
        for (const item of this.gpu) {
            gl.deleteTexture(item.texture)
        }
        this.gpu = next.map((src) => this.loadTexture(src))
        this.draw()
    }

    setParams(params: SceneParams): void {
        this.params = params
        if (params.frozen || !this.shown) {
            this.velocity = 0
            this.velDeriv = 0
            this.currentDistortion = params.distortionStrength
            this.stopLoop()
            if (params.frozen && this.shown) {
                this.draw()
            }
            return
        }
        this.startLoop()
    }

    /** Hidden breakpoint copies stay allocated but do not tick. */
    setShown(shown: boolean): void {
        this.shown = shown
        if (!shown) {
            this.stopLoop()
            return
        }
        if (!this.params || this.params.frozen) {
            this.stopLoop()
            if (this.cssW >= 2 && this.cssH >= 2) {
                this.draw()
            }
            return
        }
        this.startLoop()
    }

    pause(): void {
        this.stopLoop()
    }

    pointerDown(y: number): void {
        if (!this.params || this.params.frozen) {
            return
        }
        this.dragging = true
        this.lastY = y
        this.lastT =
            typeof performance !== "undefined" ? performance.now() : 0
        this.velocity = 0
        this.velDeriv = 0
        this.startLoop()
    }

    pointerMove(y: number): void {
        if (!this.dragging || !this.params || this.params.frozen) {
            return
        }
        const now = typeof performance !== "undefined" ? performance.now() : 0
        const delta = clamp(y - this.lastY, -120, 120)
        const dt = Math.max((now - this.lastT) / 1000, 1 / 60)
        this.offset += delta
        this.velocity = clamp(
            (delta / dt) * 0.85 * inertiaScale(this.params.inertia),
            -720,
            720
        )
        this.velDeriv = 0
        this.lastY = y
        this.lastT = now
    }

    addScroll(delta: number): void {
        if (!this.params || this.params.frozen) {
            return
        }
        this.velocity = clamp(
            this.velocity +
                -delta * 0.85 * inertiaScale(this.params.inertia),
            -720,
            720
        )
        this.velDeriv = 0
        this.startLoop()
    }

    pointerUp(): void {
        this.dragging = false
    }

    /** Moves the pane reflection. u is left→right, v is bottom→top. */
    aimSheen(u: number, v: number): void {
        if (!this.params || this.params.frozen) {
            return
        }
        this.sheenTargetX = clamp(u, 0.08, 0.92)
        this.sheenTargetY = clamp(v, 0.08, 0.92)
        this.startLoop()
    }

    parkSheen(): void {
        if (this.dragging) {
            return
        }
        this.sheenTargetX = 0.36
        this.sheenTargetY = 0.68
        if (!this.params?.frozen) {
            this.startLoop()
        }
    }

    dispose(): void {
        this.disposed = true
        this.stopLoop()
        const gl = this.gl
        if (!gl) {
            return
        }
        for (const item of this.gpu) {
            gl.deleteTexture(item.texture)
        }
        this.gpu = []
        if (this.fbo) {
            gl.deleteFramebuffer(this.fbo)
        }
        if (this.fboTex) {
            gl.deleteTexture(this.fboTex)
        }
        if (this.blank) {
            gl.deleteTexture(this.blank)
        }
        if (this.quad) {
            gl.deleteBuffer(this.quad)
        }
        if (this.cellProg) {
            gl.deleteProgram(this.cellProg)
        }
        if (this.warpProg) {
            gl.deleteProgram(this.warpProg)
        }
        this.gl = null
    }

    private startLoop(): void {
        if (this.raf || this.disposed) {
            return
        }
        this.lastFrame =
            typeof performance !== "undefined" ? performance.now() : 0
        this.raf = requestAnimationFrame(this.tick)
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
        const dt = Math.min(Math.max((now - this.lastFrame) / 1000, 0.0001), 0.1)
        this.lastFrame = now
        if (!this.dragging) {
            const target = params.autoScroll ? -AUTO_SCROLL_PX : 0
            const stepped = springStep(this.velocity, this.velDeriv, target, dt)
            this.velocity = stepped[0]
            this.velDeriv = stepped[1]
            this.offset += this.velocity * dt
        }
        const flexCap = Math.min(Math.abs(params.distortionStrength) * 0.22, 0.16)
        const kick = Math.min(
            Math.abs(this.velocity) * 0.00032 * inertiaScale(params.inertia),
            flexCap
        )
        const targetDist =
            params.distortionStrength >= 0
                ? Math.min(params.distortionStrength + kick, 1.5)
                : Math.max(params.distortionStrength - kick, -2)
        this.currentDistortion = damp(
            this.currentDistortion,
            targetDist,
            Math.max(viscosityLambda(params.viscosity), 1),
            dt
        )
        const sheenX = springStep(this.sheenX, this.sheenVX, this.sheenTargetX, dt)
        this.sheenX = sheenX[0]
        this.sheenVX = sheenX[1]
        const sheenY = springStep(this.sheenY, this.sheenVY, this.sheenTargetY, dt)
        this.sheenY = sheenY[0]
        this.sheenVY = sheenY[1]
        this.draw()
        const idle =
            !this.dragging &&
            !params.autoScroll &&
            Math.abs(this.velocity) < 0.4 &&
            Math.abs(this.velDeriv) < 0.4 &&
            Math.abs(this.currentDistortion - params.distortionStrength) < 0.002 &&
            Math.abs(this.sheenX - this.sheenTargetX) < 0.004 &&
            Math.abs(this.sheenY - this.sheenTargetY) < 0.004 &&
            Math.abs(this.sheenVX) < 0.01 &&
            Math.abs(this.sheenVY) < 0.01
        if (idle) {
            this.velocity = 0
            this.velDeriv = 0
            this.currentDistortion = params.distortionStrength
            this.sheenX = this.sheenTargetX
            this.sheenY = this.sheenTargetY
            this.sheenVX = 0
            this.sheenVY = 0
            this.raf = 0
            return
        }
        this.raf = requestAnimationFrame(this.tick)
    }

    private loadTexture(src: string): GpuTexture {
        const gl = this.gl
        const item: GpuTexture = {
            texture: this.blank as WebGLTexture,
            width: 1,
            height: 1,
            ready: false,
            src,
        }
        if (!gl) {
            return item
        }
        const texture = gl.createTexture()
        if (!texture) {
            return item
        }
        item.texture = texture
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
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
            new Uint8Array([244, 243, 240, 255])
        )
        if (typeof Image === "undefined") {
            return item
        }
        const image = new Image()
        image.crossOrigin = "anonymous"
        image.onload = () => {
            if (this.disposed || !this.gl) {
                return
            }
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1)
            try {
                this.gl.texImage2D(
                    this.gl.TEXTURE_2D,
                    0,
                    this.gl.RGBA,
                    this.gl.RGBA,
                    this.gl.UNSIGNED_BYTE,
                    image
                )
            } catch {
                item.ready = false
                this.draw()
                return
            }
            item.width = image.naturalWidth || image.width
            item.height = image.naturalHeight || image.height
            item.ready = true
            this.draw()
        }
        image.onerror = () => {
            item.ready = false
            this.draw()
        }
        image.src = src
        return item
    }

    private ensureFbo(w: number, h: number): void {
        const gl = this.gl
        if (!gl) {
            return
        }
        if (this.fbo && this.fboTex && this.fboW === w && this.fboH === h) {
            return
        }
        if (this.fbo) {
            gl.deleteFramebuffer(this.fbo)
        }
        if (this.fboTex) {
            gl.deleteTexture(this.fboTex)
        }
        this.fboTex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.fboTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            w,
            h,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        )
        this.fbo = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.fboTex,
            0
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        this.fboW = w
        this.fboH = h
    }

    private bindQuad(program: WebGLProgram): void {
        const gl = this.gl
        if (!gl || !this.quad) {
            return
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
        gl.useProgram(program)
    }

    private draw(): void {
        const gl = this.gl
        const params = this.params
        if (
            !gl ||
            !params ||
            !this.cellProg ||
            !this.warpProg ||
            !this.fboTex
        ) {
            return
        }
        const bg = parseCssColor(params.backgroundColor)
        const gap = Math.max(0, params.gap)
        const requested = Math.max(2, Math.round(params.columns))
        const cols = this.cssW < 520 ? Math.min(requested, 2) : requested
        const cellRadius = Math.max(0, params.cellRadius)
        const bleed = Math.min(cellRadius, 8)
        const cellW = Math.max(
            (this.cssW + bleed * 2 - gap * (cols - 1)) / cols,
            8
        )
        const cellH = Math.max(
            (this.cssH + bleed * 2 - gap * (VISIBLE_ROWS - 1)) / VISIBLE_ROWS,
            8
        )
        const rows = VISIBLE_ROWS + EXTRA_ROWS
        const strideW = cellW + gap
        const strideH = cellH + gap
        const period = rows * strideH
        const gridW = cols * cellW + (cols - 1) * gap

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.viewport(0, 0, this.fboW, this.fboH)
        gl.clearColor(bg[0], bg[1], bg[2], 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        this.bindQuad(this.cellProg)
        gl.uniform3f(this.cellLocs.uBgColor, bg[0], bg[1], bg[2])
        gl.uniform1f(this.cellLocs.uRadius, cellRadius)
        gl.uniform2f(this.cellLocs.uSize, cellW, cellH)
        gl.uniform1i(this.cellLocs.map, 0)
        gl.activeTexture(gl.TEXTURE0)

        const pool = this.gpu.length > 0 ? this.gpu : []
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = -gridW / 2 + cellW / 2 + c * strideW
                const rawY =
                    (r - (rows - 1) / 2) * strideH + this.offset
                const wrapped =
                    ((((rawY + period / 2) % period) + period) % period) -
                    period / 2
                const ndcX = x / (this.cssW * 0.5)
                const ndcY = wrapped / (this.cssH * 0.5)
                const ndcHalfX = cellW / this.cssW
                const ndcHalfY = cellH / this.cssH
                gl.uniform4f(
                    this.cellLocs.uRect,
                    ndcX,
                    ndcY,
                    ndcHalfX,
                    ndcHalfY
                )
                const texIndex =
                    pool.length > 0 ? (r * cols + c) % pool.length : -1
                const gpu = texIndex >= 0 ? pool[texIndex] : null
                if (gpu && gpu.ready) {
                    gl.bindTexture(gl.TEXTURE_2D, gpu.texture)
                    gl.uniform1f(this.cellLocs.uHasImage, 1)
                    gl.uniform2f(
                        this.cellLocs.uImageSize,
                        gpu.width,
                        gpu.height
                    )
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, this.blank)
                    gl.uniform1f(this.cellLocs.uHasImage, 0)
                    gl.uniform2f(this.cellLocs.uImageSize, 1, 1)
                }
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, this.fboW, this.fboH)
        gl.disable(gl.BLEND)
        gl.clearColor(bg[0], bg[1], bg[2], 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        this.bindQuad(this.warpProg)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.fboTex)
        gl.uniform1i(this.warpLocs.tDiffuse, 0)
        gl.uniform1f(this.warpLocs.uDistortionStrength, this.currentDistortion)
        gl.uniform1f(this.warpLocs.uRadius, params.radius)
        gl.uniform1f(this.warpLocs.uZoom, params.zoom)
        gl.uniform1f(this.warpLocs.uAberration, params.aberration)
        gl.uniform1f(this.warpLocs.uGlossIntensity, params.gloss)
        gl.uniform2f(this.warpLocs.uSheen, this.sheenX, this.sheenY)
        gl.uniform3f(this.warpLocs.uBgColor, bg[0], bg[1], bg[2])
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
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

function imageLabel(images: FramerImage[] | undefined): string {
    const list = Array.isArray(images) && images.length > 0 ? images : DEFAULT_IMAGES
    const alts = list
        .map((image) =>
            typeof image === "string" ? "" : (image.alt ?? image.altText ?? "")
        )
        .filter((alt) => alt.length > 0)
    return alts.length > 0 ? alts.join(", ") : "Lens warp"
}

function collectSrcs(images: FramerImage[] | undefined): string[] {
    const list = Array.isArray(images) && images.length > 0 ? images : DEFAULT_IMAGES
    const srcs = list
        .map(resolveImageSrc)
        .filter((src) => src.length > 0)
        .slice(0, MAX_IMAGES)
    return srcs.length > 0 ? srcs : DEFAULT_IMAGES.map(resolveImageSrc)
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 1232
 */
export default function Kern_LensWarp(props: KernLensWarpProps): ReactElement {
    const record = props as unknown as Record<string, unknown>
    const contentGroup = readGroup(props.content) ?? readGroup(record.$control__content)
    const lookGroup = readGroup(props.look) ?? readGroup(record.$control__look)
    const layoutGroup = readGroup(props.layout) ?? readGroup(record.$control__layout)
    const motionGroup = readGroup(props.motion) ?? readGroup(record.$control__motion)
    const images =
        (contentGroup?.images as FramerImage[] | undefined) ??
        props.images ??
        DEFAULT_IMAGES
    const radius = controlNumber(lookGroup?.radius ?? props.radius, 1)
    const zoom = controlNumber(lookGroup?.zoom ?? props.zoom, 1.05)
    const aberration = controlNumber(lookGroup?.aberration ?? props.aberration, 0.012)
    const gloss = controlNumber(lookGroup?.gloss ?? props.gloss, 0.55)
    const columns = layoutGroup
        ? controlNumber(layoutGroup.columns, 3)
        : controlNumber(props.columns, 3)
    const gap = layoutGroup
        ? controlNumber(layoutGroup.gap, 8)
        : controlNumber(props.gap, 8)
    const cellRadius = layoutGroup
        ? controlNumber(layoutGroup.cellRadius, 32)
        : controlNumber(props.cellRadius, 32)
    const autoScroll = motionGroup
        ? controlBoolean(motionGroup.autoScroll, true)
        : controlBoolean(props.autoScroll, true)
    const inertia = motionGroup
        ? controlNumber(motionGroup.inertia, 0.42)
        : controlNumber(props.inertia, 0.42)
    const viscosity = motionGroup
        ? controlNumber(motionGroup.viscosity, 0.58)
        : controlNumber(props.viscosity, 0.58)
    const style = props.style
    const warpStrength = controlNumber(
        lookGroup?.distortionStrength ??
            lookGroup?.distortion ??
            props.distortionStrength ??
            props.distortion,
        -1.4
    )
    const paperRaw = lookGroup?.backgroundColor ?? lookGroup?.fill ?? props.backgroundColor ?? props.fill
    const paper = typeof paperRaw === "string" && paperRaw.length > 0 ? paperRaw : PAPER
    const isStatic = useIsStaticRenderer()
    const reducedMotion = Boolean(useReducedMotion())
    const mode = driveMode(isStatic, reducedMotion)
    const frozen = !isLive(mode)
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gpuRef = useRef<OpticalGlass | null>(null)
    const pageScrollsRef = useRef(false)
    const [glEpoch, setGlEpoch] = useState(0)
    const liveRef = useRef<SceneParams>({
        distortionStrength: warpStrength,
        radius,
        zoom,
        aberration,
        gloss,
        backgroundColor: paper,
        columns,
        gap,
        cellRadius,
        autoScroll: frozen ? false : autoScroll,
        inertia,
        viscosity,
        frozen,
    })
    const imagesRef = useRef(images)
    liveRef.current = {
        distortionStrength: warpStrength,
        radius,
        zoom,
        aberration,
        gloss,
        backgroundColor: paper,
        columns,
        gap,
        cellRadius,
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
        let gpu: OpticalGlass | null = null
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
                gpu = new OpticalGlass(canvas)
                gpuRef.current = gpu
            }
            gpu.setImages(collectSrcs(imagesRef.current))
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
        gpu.setImages(collectSrcs(images))
        gpu.setParams({
            distortionStrength: warpStrength,
            radius,
            zoom,
            aberration,
            gloss,
            backgroundColor: paper,
            columns,
            gap,
            cellRadius,
            autoScroll: frozen ? false : autoScroll,
            inertia,
            viscosity,
            frozen,
        })
    }, [
        images,
        warpStrength,
        radius,
        zoom,
        aberration,
        gloss,
        paper,
        columns,
        gap,
        cellRadius,
        autoScroll,
        inertia,
        viscosity,
        frozen,
    ])

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch" && pageScrollsRef.current) {
            return
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        gpuRef.current?.pointerDown(event.clientY)
    }
    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const u = (event.clientX - rect.left) / Math.max(rect.width, 1)
        const v = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1)
        gpuRef.current?.aimSheen(u, v)
        gpuRef.current?.pointerMove(event.clientY)
    }
    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
        gpuRef.current?.pointerUp()
        const rect = event.currentTarget.getBoundingClientRect()
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
            Math.abs(event.deltaY) > Math.abs(event.deltaX)
                ? event.deltaY
                : event.deltaX
        gpuRef.current?.addScroll(delta)
    }

    return (
        <div
            ref={rootRef}
            className={CLASS}
            aria-label={imageLabel(images)}
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
                backgroundColor: paper,
                touchAction: frozen ? "auto" : "pan-y",
                cursor: frozen ? "default" : "grab",
                ...style,
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
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

function hidePinchFields(props: {
    distortionStrength?: number
    look?: { distortionStrength?: number }
}): boolean {
    const nested = props.look?.distortionStrength
    const strength =
        typeof props.distortionStrength === "number"
            ? props.distortionStrength
            : typeof nested === "number"
              ? nested
              : -1.4
    return strength < 0
}

addPropertyControls(Kern_LensWarp, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            images: {
                type: ControlType.Array,
                title: "Images",
                control: { type: ControlType.ResponsiveImage },
                maxCount: MAX_IMAGES,
                defaultValue: DEFAULT_IMAGES,
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
                description: "Pos = pinch. Neg = concave dish (stable to −2).",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 1,
                min: 0.1,
                max: 1.5,
                step: 0.01,
                description: "Width of the pinch.",
                hidden: hidePinchFields,
            },
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                defaultValue: 1.05,
                min: 0.5,
                max: 2,
                step: 0.01,
                description: "Magnification of the pinch.",
                hidden: hidePinchFields,
            },
            aberration: {
                type: ControlType.Number,
                title: "Aberration",
                defaultValue: 0.012,
                min: 0,
                max: 0.08,
                step: 0.001,
                description: "Fringe only where the glass bends.",
            },
            gloss: {
                type: ControlType.Number,
                title: "Gloss",
                defaultValue: 0.55,
                min: 0,
                max: 2,
                step: 0.05,
                description: "Reflection that follows the pointer. Does not blow highlights.",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: PAPER,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            columns: {
                type: ControlType.Number,
                title: "Columns",
                defaultValue: 3,
                min: 2,
                max: 4,
                step: 1,
                displayStepper: true,
                description: "Phone width folds to 2.",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
            cellRadius: {
                type: ControlType.Number,
                title: "Cell Radius",
                defaultValue: 32,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoScroll: {
                type: ControlType.Boolean,
                title: "Auto Scroll",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            inertia: {
                type: ControlType.Number,
                title: "Inertia",
                defaultValue: 0.42,
                min: 0,
                max: 1,
                step: 0.01,
                description: "How long drag keeps the mosaic moving.",
            },
            viscosity: {
                type: ControlType.Number,
                title: "Viscosity",
                defaultValue: 0.58,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: () => true,
            },
        },
    },
    preview: {
        type: ControlType.Object,
        title: "Preview",
        controls: {
            kern: {
                type: ControlType.Boolean,
                title: "BuiltByKern",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "On",
                description:
                    "BuiltByKern\n[Explore more components](https://www.framer.com/@builtbykern/)",
            },
        },
    },
})
