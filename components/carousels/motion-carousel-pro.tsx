import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ═══════════════════════════════════════════════════════════════ types ══ */

type Pic = { src?: string; alt?: string } | string | undefined

interface Card {
    media?: "Image" | "Video"
    image?: Pic
    imageUrl?: string
    video?: string
    videoUrl?: string
    revealImage?: Pic
    link?: string
}

interface Props {
    cards: Card[]
    layout: {
        cardHeight: number
        maxCardHeight: number
        gap: number
        radius: number
        startAt: number
        centreOnMobile: boolean
    }
    sheet: {
        curve: number
        bend: number
        lean: number
        parallax: number
        fringe: number
    }
    motion: {
        dragSpeed: number
        friction: number
        wheel: "off" | "horizontal" | "all"
        wheelSpeed: number
        drift: number
        pauseOnHover: boolean
        keyboard: boolean
    }
    hover: {
        ripple: number
        sink: number
        glow: number
        tilt: number
        revealTime: number
    }
    entrance: {
        style: "rise" | "sweep" | "fade" | "none"
        duration: number
        stagger: number
        delay: number
        replay: boolean
    }
    click: {
        action: "centre" | "open"
        newTab: boolean
    }
    scene: {
        background: string
        floor: boolean
        floorColor: string
    }
    style?: React.CSSProperties
}

/* ════════════════════════════════════════════════════════════ content ══ */

const photo = (id: string, w: number, h: number) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`

const STARTER: Card[] = [
    {
        media: "Image",
        imageUrl: photo("photo-1500530855697-b586d89ba3ee", 960, 1200),
        link: "",
    },
    {
        media: "Image",
        imageUrl: photo("photo-1469474968028-56623f02e42e", 1200, 760),
        link: "",
    },
    {
        media: "Image",
        imageUrl: photo("photo-1501785888041-af3ef285b470", 1200, 680),
        link: "",
    },
    {
        media: "Image",
        imageUrl: photo("photo-1441974231531-c6227db76b6e", 880, 1100),
        link: "",
    },
    {
        media: "Image",
        imageUrl: photo("photo-1506744038136-46273834b3fb", 900, 1200),
        link: "",
    },
    {
        media: "Image",
        imageUrl: photo("photo-1518837695005-2083093ee35b", 1050, 1400),
        link: "",
    },
    {
        media: "Image",
        imageUrl: photo("photo-1475924156734-496f6cac6ec1", 900, 1200),
        link: "",
    },
    {
        media: "Image",
        imageUrl: photo("photo-1447752875215-b2761acb3c5d", 1100, 1100),
        link: "",
    },
]

const BASE: Omit<Props, "cards" | "style"> = {
    layout: {
        cardHeight: 44,
        maxCardHeight: 560,
        gap: 12,
        radius: 20,
        startAt: 33,
        centreOnMobile: true,
    },
    sheet: { curve: 1, bend: 1, lean: 1, parallax: 1, fringe: 1 },
    motion: {
        dragSpeed: 1,
        friction: 2.6,
        wheel: "horizontal",
        wheelSpeed: 1,
        drift: 0,
        pauseOnHover: true,
        keyboard: true,
    },
    hover: { ripple: 1, sink: 1, glow: 1, tilt: 1, revealTime: 1.6 },
    entrance: {
        style: "rise",
        duration: 1.1,
        stagger: 0.08,
        delay: 0.1,
        replay: false,
    },
    click: { action: "centre", newTab: false },
    scene: {
        background: "#000000",
        floor: true,
        floorColor: "rgba(255,255,255,0.08)",
    },
}

const complete = (p: Partial<Props>): Props => ({
    cards: p.cards && p.cards.length ? p.cards : STARTER,
    style: p.style,
    layout: { ...BASE.layout, ...p.layout },
    sheet: { ...BASE.sheet, ...p.sheet },
    motion: { ...BASE.motion, ...p.motion },
    hover: { ...BASE.hover, ...p.hover },
    entrance: { ...BASE.entrance, ...p.entrance },
    click: { ...BASE.click, ...p.click },
    scene: { ...BASE.scene, ...p.scene },
})

const pickSrc = (pic: Pic, url?: string) => {
    if (typeof pic === "string") return pic
    if (pic && pic.src) return pic.src
    return (url || "").trim()
}

interface Entry {
    video: boolean
    src: string
    under: string
    link: string
    label: string
}

const toEntry = (c: Card, i: number): Entry => {
    const video = c.media === "Video"
    return {
        video,
        src: video
            ? (c.video || c.videoUrl || "").trim()
            : pickSrc(c.image, c.imageUrl),
        under: video ? "" : pickSrc(c.revealImage),
        link: c.link || "",
        label:
            (c.image && typeof c.image === "object" && c.image.alt) ||
            `Gallery item ${i + 1}`,
    }
}

/* ═══════════════════════════════════════════════════════════════ maths ══ */

const lim = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const settleTo = (from: number, to: number, speed: number, dt: number) =>
    to + (from - to) * Math.exp(-speed * dt)
const ramp = (lo: number, hi: number, v: number) => {
    const t = lim((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)
}
const wrapInto = (v: number, span: number) => v - span * Math.round(v / span)

// Sheet profile: an S-shaped swell built from a Gaussian derivative.
// hump(0) = 0, hump(±1) = ±1, and it fades out quickly past |s| ≈ 2.5.
const hump = (s: number) => s * Math.exp(0.5 * (1 - s * s))
const humpRate = (s: number) => (1 - s * s) * Math.exp(0.5 * (1 - s * s))
const PROFILE = {
    centre: 0.17,
    width: 0.42,
    depth: 0.15,
    pitch: -0.1,
    curl: 0.72,
    swell: 0.85,
    slant: 0.03,
    leanBase: 0.05,
    leanSpeed: 0.09,
}

type Mat = Float32Array

const frustum = (
    fovY: number,
    aspect: number,
    near: number,
    far: number
): Mat => {
    const t = 1 / Math.tan(fovY * 0.5)
    const m = new Float32Array(16)
    m[0] = t / aspect
    m[5] = t
    m[10] = -(far + near) / (far - near)
    m[11] = -1
    m[14] = (-2 * far * near) / (far - near)
    return m
}

// Camera at `eye`, looking at the origin, world-up = +Y.
const aimCamera = (ex: number, ey: number, ez: number): Mat => {
    const len = Math.hypot(ex, ey, ez) || 1
    const fx = ex / len,
        fy = ey / len,
        fz = ez / len
    let rx = fz,
        rz = -fx
    const rl = Math.hypot(rx, rz) || 1
    rx /= rl
    rz /= rl
    const ux = fy * rz,
        uy = fz * rx - fx * rz,
        uz = -fy * rx
    const m = new Float32Array(16)
    m[0] = rx
    m[4] = 0
    m[8] = rz
    m[1] = ux
    m[5] = uy
    m[9] = uz
    m[2] = fx
    m[6] = fy
    m[10] = fz
    m[12] = -(rx * ex + rz * ez)
    m[13] = -(ux * ex + uy * ey + uz * ez)
    m[14] = -(fx * ex + fy * ey + fz * ez)
    m[15] = 1
    return m
}

const compose = (a: Mat, b: Mat): Mat => {
    const out = new Float32Array(16)
    for (let col = 0; col < 4; col++) {
        const b0 = b[col * 4],
            b1 = b[col * 4 + 1],
            b2 = b[col * 4 + 2],
            b3 = b[col * 4 + 3]
        out[col * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3
        out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3
        out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3
        out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3
    }
    return out
}

// Card transform: translate(x) · yaw(β) · pitch(α) · scale(w, h, 1)
const cardMatrix = (
    m: Mat,
    x: number,
    y: number,
    w: number,
    h: number,
    alpha: number,
    beta: number
) => {
    const ca = Math.cos(alpha),
        sa = Math.sin(alpha),
        cb = Math.cos(beta),
        sb = Math.sin(beta)
    m[0] = cb * w
    m[1] = 0
    m[2] = -sb * w
    m[3] = 0
    m[4] = sb * sa * h
    m[5] = ca * h
    m[6] = cb * sa * h
    m[7] = 0
    m[8] = sb * ca
    m[9] = -sa
    m[10] = cb * ca
    m[11] = 0
    m[12] = x
    m[13] = y
    m[14] = 0
    m[15] = 1
}

/* ═════════════════════════════════════════════════════════════ shaders ══ */

const SHEET_COMMON = `
float hump(float s){ return s*exp(0.5*(1.0-s*s)); }
float humpRate(float s){ return (1.0-s*s)*exp(0.5*(1.0-s*s)); }
float smoother(float t){ t=clamp(t,0.0,1.0); return t*t*t*(t*(t*6.0-15.0)+10.0); }
float frontAt(float phase){ return smoother((phase-0.42)/0.58); }
float ringAt(float phase){ float t=clamp(phase/0.5,0.0,1.0); return 0.05+1.2*(1.0-(1.0-t)*(1.0-t)); }
float ringLife(float phase){ return sin(3.14159265*clamp(phase/0.62,0.0,1.0)); }
`

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUv;
uniform mat4 uModel, uViewProj;
uniform vec2 uSize, uFocus;
uniform float uHalfW, uCentre, uWidth, uDepth, uPitch, uCurl, uLiftY, uLiftZ, uRake, uSlant;
uniform float uHover, uPress, uPeel, uPhase, uClock, uWarp;
out vec2 vUv;
${SHEET_COMMON}
void main(){
  vUv = aUv;
  vec3 p = aPos;
  vec2 toFocus = (aUv - uFocus) * vec2(uSize.x / uSize.y, 1.0);
  float r = length(toFocus);
  float push;
  if (uPeel > 0.5) {
    float rr = ringAt(uPhase);
    float ring = exp(-pow((r - rr) * 8.0, 2.0)) * cos((r - rr) * 24.0) * ringLife(uPhase);
    float q = frontAt(uPhase);
    float edge = mix(2.2, -0.1, q);
    float lip = exp(-pow((r - edge) * 7.0, 2.0)) * q * (1.0 - q) * 4.0;
    push = (ring * 0.11 + lip * 0.06) * uWarp;
  } else {
    float wave = cos(r * 28.0 - uClock * 7.5) * exp(-r * 2.2);
    push = wave * 0.06 * uWarp * uHover - uHover * uPress * exp(-r * r * 2.5) * 0.035;
  }
  p.z += push * uSize.y;

  vec4 w = uModel * vec4(p, 1.0);
  float n = w.x / uHalfW;
  float s = (n - uCentre) / uWidth;
  float tip = uPitch * humpRate(s) + uCurl * smoothstep(0.3, 0.95, abs(n)) * sign(n);
  float ct = cos(tip), st = sin(tip);
  w.yz = vec2(ct * w.y - st * w.z, st * w.y + ct * w.z);
  w.z -= uDepth * hump(s);
  w.y += uSlant * w.x;
  float trail = 1.0 / (1.0 + exp(6.0 * (n + 0.35)));
  w.y += uLiftY * trail;
  w.z += uLiftZ * trail;
  w.z += uRake * tanh(1.6 * n) / tanh(1.6);
  gl_Position = uViewProj * w;
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex, uAlt;
uniform vec2 uMedia, uAltMedia, uSize, uFocus;
uniform float uOpacity, uRound, uHover, uPeel, uPhase, uClock, uSplit, uGlow, uWarp;
out vec4 fragColor;
${SHEET_COMMON}
vec2 fill(vec2 box, vec2 media, vec2 t){
  vec2 k = box / max(media, vec2(1.0));
  return (t - 0.5) * k / max(k.x, k.y) + 0.5;
}
vec2 inside(vec2 t){ return clamp(t, vec2(0.0015), vec2(0.9985)); }
void main(){
  vec2 ratio = vec2(uSize.x / uSize.y, 1.0);
  vec2 uv = fill(uSize, uMedia, vUv);
  vec2 uvB = fill(uSize, uAltMedia, vUv);
  vec2 toFocus = (vUv - uFocus) * ratio;
  float r = length(toFocus);
  vec2 outward = toFocus / max(r, 0.001) / ratio;
  vec4 c;
  if (uPeel > 0.5) {
    float q = frontAt(uPhase);
    float a = atan(toFocus.y, toFocus.x);
    float edge = mix(2.2, -0.1, q) + (0.04 * sin(4.0 * a + 6.0 * uPhase) + 0.018 * sin(9.0 * a - 4.0 * uPhase)) * (1.0 - q);
    float lip = exp(-pow((r - edge) * 11.0, 2.0)) * q * (1.0 - q) * 4.0;
    float rr = ringAt(uPhase);
    float ring = exp(-pow((r - rr) * 9.0, 2.0)) * ringLife(uPhase);
    float bend = (sin((r - edge) * 38.0) * lip * 0.03 + cos((r - rr) * 24.0) * ring * 0.016) * uWarp;
    vec4 front = texture(uTex, inside(uv + outward * bend));
    vec4 back = texture(uAlt, inside(uvB - outward * bend * 0.5));
    c = mix(front, back, smoothstep(edge - 0.05, edge + 0.05, r));
    if (q > 0.998) c = texture(uAlt, uvB);
  } else {
    float wave = cos(r * 28.0 - uClock * 7.5) * exp(-r * 2.2) * uHover;
    c = texture(uTex, inside(uv + outward * wave * 0.018 * uWarp));
    if (uSplit > 0.0004) {
      c.r = texture(uTex, inside(uv + vec2(uSplit, 0.0))).r;
      c.b = texture(uTex, inside(uv - vec2(uSplit, 0.0))).b;
    }
  }
  c.rgb += uHover * uGlow * 0.17 * exp(-r * r * 14.0);
  vec2 halfBox = ratio * 0.5;
  float rad = min(uRound, min(halfBox.x, halfBox.y));
  vec2 corner = abs(vUv * ratio - halfBox) - (halfBox - rad);
  float dist = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - rad;
  float soft = max(fwidth(dist), 0.0001);
  float alpha = c.a * uOpacity * clamp(0.5 - dist / soft, 0.0, 1.0);
  if (alpha < 0.012) discard;
  fragColor = vec4(c.rgb * alpha, alpha);
}`

const GROUND_VERT = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uModel, uViewProj;
out vec3 vWorld;
void main(){
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz;
  gl_Position = uViewProj * w;
}`

const GROUND_FRAG = `#version 300 es
precision highp float;
in vec3 vWorld;
uniform vec2 uCell;
uniform float uNear, uFar, uSpan, uOpacity;
uniform vec4 uInk;
out vec4 fragColor;
void main(){
  vec2 g = vWorld.xz / uCell;
  vec2 f = abs(fract(g - 0.5) - 0.5) / max(fwidth(g), vec2(0.0001));
  float line = 1.0 - min(min(f.x, f.y), 1.0);
  float depth = (uNear - vWorld.z) / (uNear - uFar);
  float fade = smoothstep(0.0, 0.05, depth) * (1.0 - smoothstep(0.12, 0.85, depth)) * (1.0 - smoothstep(0.55, 1.0, abs(vWorld.x) / uSpan));
  float a = uInk.a * line * fade * uOpacity;
  fragColor = vec4(uInk.rgb * a, a);
}`

/* ═══════════════════════════════════════════════════════════ GL helpers ══ */

interface Program {
    handle: WebGLProgram
    u: Record<string, WebGLUniformLocation | null>
}

const buildProgram = (
    gl: WebGL2RenderingContext,
    vert: string,
    frag: string
): Program => {
    const stage = (kind: number, text: string) => {
        const sh = gl.createShader(kind)!
        gl.shaderSource(sh, text)
        gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            const why = gl.getShaderInfoLog(sh) || "compile"
            gl.deleteShader(sh)
            throw new Error(why)
        }
        return sh
    }
    const vs = stage(gl.VERTEX_SHADER, vert)
    const fs = stage(gl.FRAGMENT_SHADER, frag)
    const handle = gl.createProgram()!
    gl.attachShader(handle, vs)
    gl.attachShader(handle, fs)
    gl.linkProgram(handle)
    gl.detachShader(handle, vs)
    gl.detachShader(handle, fs)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(handle, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(handle) || "link")
    const u: Program["u"] = {}
    const count = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(handle, i)
        if (info) u[info.name] = gl.getUniformLocation(handle, info.name)
    }
    return { handle, u }
}

interface Mesh {
    vao: WebGLVertexArrayObject
    count: number
    trash: WebGLBuffer[]
}

// Unit quad subdivided into cols × rows; lies in XY (or XZ when `floor`).
const buildMesh = (
    gl: WebGL2RenderingContext,
    cols: number,
    rows: number,
    floor: boolean
): Mesh => {
    const data: number[] = []
    for (let row = 0; row <= rows; row++) {
        const v = row / rows
        for (let col = 0; col <= cols; col++) {
            const u = col / cols
            if (floor) data.push(u - 0.5, 0, 0.5 - v, u, v)
            else data.push(u - 0.5, v - 0.5, 0, u, v)
        }
    }
    const order: number[] = []
    const stride = cols + 1
    for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
            const k = row * stride + col
            order.push(k, k + 1, k + stride, k + 1, k + stride + 1, k + stride)
        }
    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    const vb = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vb)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12)
    const ib = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(order),
        gl.STATIC_DRAW
    )
    gl.bindVertexArray(null)
    return { vao, count: order.length, trash: [vb, ib] }
}

const blankTexture = (gl: WebGL2RenderingContext) => {
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([20, 20, 20, 255])
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
}

const fillTexture = (
    gl: WebGL2RenderingContext,
    t: WebGLTexture,
    source: TexImageSource,
    mipmaps: boolean
) => {
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    try {
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source
        )
    } catch {
        return false
    }
    if (mipmaps) {
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
        )
    }
    return true
}

const colourReader = () => {
    const memo = new Map<string, [number, number, number, number]>()
    let probe: CanvasRenderingContext2D | null = null
    return (css: string): [number, number, number, number] => {
        const hit = memo.get(css)
        if (hit) return hit
        if (!probe) {
            const c = document.createElement("canvas")
            c.width = c.height = 1
            probe = c.getContext("2d", { willReadFrequently: true })
        }
        let out: [number, number, number, number] = [0, 0, 0, 1]
        if (probe) {
            probe.clearRect(0, 0, 1, 1)
            probe.fillStyle = "#000"
            probe.fillStyle = css
            probe.fillRect(0, 0, 1, 1)
            const px = probe.getImageData(0, 0, 1, 1).data
            out = [px[0] / 255, px[1] / 255, px[2] / 255, px[3] / 255]
        }
        if (memo.size > 40) memo.clear()
        memo.set(css, out)
        return out
    }
}

/* ═══════════════════════════════════════════════════════════════ media ══ */

interface Source {
    pixels: TexImageSource
    w: number
    h: number
    clip?: HTMLVideoElement
    real: boolean
}

const swatch = (n: number): Source => {
    const c = document.createElement("canvas")
    c.width = 600
    c.height = 760
    const g = c.getContext("2d")!
    const hue = (n * 53 + 200) % 360
    const fade = g.createLinearGradient(0, 0, 0, 760)
    fade.addColorStop(0, `hsl(${hue} 30% 24%)`)
    fade.addColorStop(1, `hsl(${(hue + 30) % 360} 34% 8%)`)
    g.fillStyle = fade
    g.fillRect(0, 0, 600, 760)
    return { pixels: c, w: 600, h: 760, real: false }
}

const fetchPicture = (url: string, n: number) =>
    new Promise<Source>((resolve) => {
        if (!url) return resolve(swatch(n))
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () =>
            resolve({
                pixels: img,
                w: img.naturalWidth || 1,
                h: img.naturalHeight || 1,
                real: true,
            })
        img.onerror = () => resolve(swatch(n))
        img.src = url
    })

const fetchClip = (url: string, n: number) =>
    new Promise<Source>((resolve) => {
        if (!url) return resolve(swatch(n))
        const clip = document.createElement("video")
        clip.crossOrigin = "anonymous"
        clip.muted = true
        clip.loop = true
        clip.playsInline = true
        clip.setAttribute("playsinline", "")
        clip.preload = "auto"
        let done = false
        const finish = () => {
            if (done) return
            done = true
            window.clearTimeout(guard)
            if (clip.videoWidth)
                resolve({
                    pixels: clip,
                    w: clip.videoWidth,
                    h: clip.videoHeight,
                    clip,
                    real: true,
                })
            else resolve(swatch(n))
        }
        const guard = window.setTimeout(finish, 4500)
        clip.addEventListener("loadeddata", finish, { once: true })
        clip.addEventListener("error", finish, { once: true })
        clip.src = url
        clip.load()
    })

/* ══════════════════════════════════════════════════════════════ engine ══ */

interface Deck {
    entry: Entry
    face: WebGLTexture
    back: WebGLTexture
    fw: number
    fh: number
    bw: number
    bh: number
    ratio: number
    clip?: HTMLVideoElement
    peel: boolean
}

interface Seat {
    deck: number
    x: number
    w: number
    hover: number
    phase: number
    clock: number
    fu: number
    fv: number
    rect: [number, number, number, number]
    rank: number
}

interface Driver {
    nudge: () => void
    reflow: () => void
    stop: () => void
}

function launch(
    canvas: HTMLCanvasElement,
    frame: HTMLElement,
    entries: Entry[],
    live: React.MutableRefObject<Props>,
    onBroken: () => void
): Driver | null {
    const gl = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        depth: true,
        premultipliedAlpha: true,
    })
    if (!gl) {
        onBroken()
        return null
    }
    let sheetProg: Program, groundProg: Program
    try {
        sheetProg = buildProgram(gl, VERT, FRAG)
        groundProg = buildProgram(gl, GROUND_VERT, GROUND_FRAG)
    } catch {
        onBroken()
        return null
    }
    const sheetMesh = buildMesh(gl, 40, 22, false)
    const groundMesh = buildMesh(gl, 1, 1, true)
    const colour = colourReader()

    const decks: Deck[] = entries.map((entry) => ({
        entry,
        face: blankTexture(gl),
        back: blankTexture(gl),
        fw: 4,
        fh: 5,
        bw: 4,
        bh: 5,
        ratio: 0.8,
        peel: false,
    }))
    let seats: Seat[] = []

    /* view */
    let width = 1,
        height = 1,
        density = 1,
        cardH = 1,
        cycle = 1,
        eyeZ = 1
    const FOV = (52 * Math.PI) / 180
    let viewProj: Mat = new Float32Array(16)
    const scratch = new Float32Array(16)
    const groundM = new Float32Array(16)

    /* motion state */
    const track = { pos: 0, vel: 0, goal: null as number | null, stiff: 60 }
    const flexState = { value: 0, speed: 0 }
    let sweep = 0,
        sweepVel = 0
    const eye = { x: 0, y: 0 }
    const grab = {
        on: false,
        startX: 0,
        startPos: 0,
        lastX: 0,
        lastT: 0,
        flick: 0,
        moved: false,
    }
    const pointer = { x: -1, y: -1, inside: false }
    let focused: Seat | null = null
    // entrance clock: seconds since the entrance started (only advances while on screen)
    let introT = 0,
        introOn = false,
        ready = false,
        introEnd = 0,
        seenOnce = false

    /* gating */
    let shown = typeof IntersectionObserver === "undefined"
    let tabOn = !document.hidden
    let still = false
    let ticking = 0
    let lastTick = 0
    let gone = false
    const allowed = () => !gone && shown && tabOn

    const motionPref = window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null
    still = !!(motionPref && motionPref.matches)

    /* layout */
    const measureFrame = () => {
        const opts = live.current.layout
        const box = frame.getBoundingClientRect()
        width = Math.max(1, box.width)
        height = Math.max(1, box.height)
        density = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.round(width * density)
        canvas.height = Math.round(height * density)
        cardH = Math.max(
            40,
            Math.min((opts.cardHeight / 100) * height, opts.maxCardHeight)
        )
        eyeZ = height / 2 / Math.tan(FOV / 2)

        const once = decks.reduce(
            (sum, d) => sum + d.ratio * cardH + opts.gap,
            0
        )
        const repeats = Math.max(
            1,
            Math.ceil((width * 1.8 + cardH * 2) / Math.max(1, once))
        )
        const prior = seats
        seats = []
        let x = 0
        for (let r = 0; r < repeats; r++)
            decks.forEach((d, i) => {
                const w = d.ratio * cardH
                const old = prior[seats.length]
                seats.push({
                    deck: i,
                    x,
                    w,
                    hover: old ? old.hover : 0,
                    phase: old ? old.phase : 0,
                    clock: old ? old.clock : 0,
                    fu: 0.5,
                    fv: 0.5,
                    rect: [0, 0, 0, 0],
                    rank: old ? old.rank : 0,
                })
                x += w + opts.gap
            })
        cycle = Math.max(1, x)

        const near = eyeZ * 0.6
        const far = -height * 4.5
        groundM.fill(0)
        groundM[0] = width * 8
        groundM[5] = 1
        groundM[10] = near - far
        groundM[13] = -cardH / 2 - height * 0.03
        groundM[14] = (near + far) / 2
        groundM[15] = 1
    }

    const midOf = (s: Seat) =>
        width / 2 +
        wrapInto(s.x + s.w / 2 + track.pos + sweep - width / 2, cycle)

    const placeStart = () => {
        const opts = live.current.layout
        const first = seats[0]
        if (!first) return
        const at = opts.centreOnMobile && width < 700 ? 0.5 : opts.startAt / 100
        track.pos = width * at - (first.x + first.w / 2)
        track.vel = 0
        track.goal = null
    }

    /* sheet shape, shared by the CPU hit test */
    const shape = () => {
        const p = live.current.sheet
        const hw = width / 2
        const f = still ? 0 : flexState.value
        return {
            hw,
            depth:
                hw *
                PROFILE.depth *
                p.curve *
                (1 + PROFILE.swell * Math.abs(f)),
            pitch: PROFILE.pitch * p.curve,
            curl: PROFILE.curl * f,
            liftY: hw * 0.05 * f,
            liftZ: hw * 0.1 * f,
            lean: hw * (-PROFILE.leanBase * p.lean - PROFILE.leanSpeed * f),
        }
    }
    type Shape = ReturnType<typeof shape>

    const toScreen = (x: number, y: number, z: number): [number, number] => {
        const m = viewProj
        const cw = m[3] * x + m[7] * y + m[11] * z + m[15]
        const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / cw
        const cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / cw
        return [(cx + 1) * 0.5 * width, (1 - cy) * 0.5 * height]
    }
    const bendPoint = (x: number, y: number, sh: Shape) => {
        const n = x / sh.hw
        const s = (n - PROFILE.centre) / PROFILE.width
        const tip =
            sh.pitch * humpRate(s) +
            sh.curl * ramp(0.3, 0.95, Math.abs(n)) * Math.sign(n)
        let yy = Math.cos(tip) * y
        let zz = Math.sin(tip) * y - sh.depth * hump(s)
        yy += PROFILE.slant * x
        const trail = 1 / (1 + Math.exp(6 * (n + 0.35)))
        yy += sh.liftY * trail
        zz += sh.liftZ * trail
        zz += (sh.lean * Math.tanh(1.6 * n)) / Math.tanh(1.6)
        return toScreen(x, yy, zz)
    }
    const outline = (seat: Seat, cx: number, sh: Shape) => {
        let l = 1e9,
            r = -1e9,
            t = 1e9,
            b = -1e9
        for (let i = 0; i <= 5; i++)
            for (let j = 0; j <= 3; j++) {
                const [sx, sy] = bendPoint(
                    cx + (i / 5 - 0.5) * seat.w,
                    (j / 3 - 0.5) * cardH,
                    sh
                )
                l = Math.min(l, sx)
                r = Math.max(r, sx)
                t = Math.min(t, sy)
                b = Math.max(b, sy)
            }
        seat.rect = [l, t, r, b]
    }
    const seatAt = (x: number, y: number) => {
        let found: Seat | null = null
        let best = 1e9
        for (const s of seats) {
            const [l, t, r, b] = s.rect
            if (x < l - 5 || x > r + 5 || y < t - 5 || y > b + 5) continue
            const d = Math.abs(x - (l + r) / 2)
            if (d < best) {
                best = d
                found = s
            }
        }
        return found
    }

    /* media */
    const setPlayback = (on: boolean) =>
        decks.forEach((d) => {
            if (!d.clip) return
            if (on && !still) d.clip.play().catch(() => {})
            else d.clip.pause()
        })

    Promise.all(
        decks.map(async (d, i) => {
            const main = d.entry.video
                ? await fetchClip(d.entry.src, i)
                : await fetchPicture(d.entry.src, i)
            if (gone) return
            if (!fillTexture(gl, d.face, main.pixels, !main.clip))
                fillTexture(gl, d.face, swatch(i).pixels, true)
            d.fw = main.w
            d.fh = main.h
            d.ratio = lim(main.w / main.h, 0.3, 3.2)
            d.clip = main.clip
            if (d.entry.under) {
                const alt = await fetchPicture(d.entry.under, i + 7)
                if (gone || !alt.real) return
                if (fillTexture(gl, d.back, alt.pixels, true)) {
                    d.bw = alt.w
                    d.bh = alt.h
                    d.peel = true
                }
            }
        })
    ).then(() => {
        if (gone) return
        measureFrame()
        placeStart()
        ready = true
        beginEntrance()
        if (allowed()) setPlayback(true)
        nudge()
    })

    /* entrance */
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)
    const beginEntrance = () => {
        const e = live.current.entrance
        introOn = true
        introT = 0
        // stagger by on-screen order, left to right
        const order = seats
            .map((s) => ({ s, x: midOf(s) }))
            .filter((o) => o.x > -width * 0.3 && o.x < width * 1.3)
            .sort((a, b) => a.x - b.x)
        seats.forEach((s) => (s.rank = order.length))
        order.forEach((o, i) => (o.s.rank = i))
        introEnd = e.delay + order.length * e.stagger + e.duration
        if (still || e.style === "none") {
            introT = introEnd + 1
            return
        }
    }
    // Sweep In: the strip glides in from the right, decelerating (ease-out cubic)
    const updateSweep = () => {
        const e = live.current.entrance
        if (e.style !== "sweep" || introT >= introEnd) {
            sweep = 0
            sweepVel = 0
            return
        }
        const dur = Math.max(0.05, e.duration)
        const t = lim((introT - e.delay) / dur, 0, 1)
        const span = width * 0.9
        sweep = span * Math.pow(1 - t, 3)
        sweepVel = t > 0 && t < 1 ? (-3 * span * Math.pow(1 - t, 2)) / dur : 0
    }
    const entranceOf = (s: Seat) => {
        const e = live.current.entrance
        if (introT >= introEnd || e.style === "none") return 1
        const local =
            (introT -
                e.delay -
                (e.style === "sweep" ? 0 : s.rank * e.stagger)) /
            Math.max(0.05, e.duration)
        return lim(local, 0, 1)
    }

    /* motion integration */
    const integrate = (dt: number) => {
        const opts = live.current.motion
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)))
        const h = dt / steps
        for (let i = 0; i < steps; i++) {
            if (track.goal !== null) {
                if (still && !grab.on) {
                    track.pos = track.goal
                    track.vel = 0
                } else {
                    const k = track.stiff
                    const c = 2 * Math.sqrt(k)
                    track.vel +=
                        (k * (track.goal - track.pos) - c * track.vel) * h
                    track.pos += track.vel * h
                }
            } else {
                track.pos += track.vel * h
                track.vel *= Math.exp(-opts.friction * h)
            }
        }
        if (
            track.goal !== null &&
            !grab.on &&
            Math.abs(track.goal - track.pos) < 0.25 &&
            Math.abs(track.vel) < 2
        ) {
            track.pos = track.goal
            track.vel = 0
            track.goal = null
        }
        if (track.goal === null && Math.abs(track.vel) < 2.5) track.vel = 0
        if (Math.abs(track.pos) > cycle * 3) {
            const shift = track.pos - wrapInto(track.pos, cycle)
            track.pos -= shift
            if (track.goal !== null) track.goal -= shift
            grab.startPos -= shift
        }

        // the sheet flexes like a damped spring chasing the scroll speed
        const p = live.current.sheet
        const want = still
            ? 0
            : Math.tanh((track.vel + sweepVel) / 1500) * p.bend
        const k = 70,
            c = 13
        for (let i = 0; i < steps; i++) {
            flexState.speed +=
                (k * (want - flexState.value) - c * flexState.speed) * h
            flexState.value += flexState.speed * h
        }
        if (
            want === 0 &&
            Math.abs(flexState.value) < 1e-4 &&
            Math.abs(flexState.speed) < 1e-3
        ) {
            flexState.value = 0
            flexState.speed = 0
        }
    }

    /* render */
    const paint = (sh: Shape) => {
        const p = live.current
        const bg = colour(p.scene.background)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(bg[0] * bg[3], bg[1] * bg[3], bg[2] * bg[3], bg[3])
        gl.clearDepth(1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        if (!ready) return

        const introAll =
            introT >= introEnd
                ? 1
                : lim(
                      (introT - p.entrance.delay) /
                          Math.max(0.05, p.entrance.duration),
                      0,
                      1
                  )
        if (p.scene.floor) {
            gl.disable(gl.DEPTH_TEST)
            gl.depthMask(false)
            gl.useProgram(groundProg.handle)
            const u = groundProg.u
            gl.uniformMatrix4fv(u.uModel, false, groundM)
            gl.uniformMatrix4fv(u.uViewProj, false, viewProj)
            gl.uniform2f(u.uCell, width / 15, height / 6)
            gl.uniform1f(u.uNear, eyeZ * 0.6)
            gl.uniform1f(u.uFar, -height * 4.5)
            gl.uniform1f(u.uSpan, width * 4)
            gl.uniform1f(u.uOpacity, introAll)
            gl.uniform4fv(u.uInk, colour(p.scene.floorColor))
            gl.bindVertexArray(groundMesh.vao)
            gl.drawElements(
                gl.TRIANGLES,
                groundMesh.count,
                gl.UNSIGNED_SHORT,
                0
            )
        }

        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LEQUAL)
        gl.depthMask(true)
        gl.useProgram(sheetProg.handle)
        const u = sheetProg.u
        gl.uniformMatrix4fv(u.uViewProj, false, viewProj)
        gl.uniform1i(u.uTex, 0)
        gl.uniform1i(u.uAlt, 1)
        gl.uniform1f(u.uHalfW, sh.hw)
        gl.uniform1f(u.uCentre, PROFILE.centre)
        gl.uniform1f(u.uWidth, PROFILE.width)
        gl.uniform1f(u.uDepth, sh.depth)
        gl.uniform1f(u.uPitch, sh.pitch)
        gl.uniform1f(u.uCurl, sh.curl)
        gl.uniform1f(u.uLiftY, sh.liftY)
        gl.uniform1f(u.uLiftZ, sh.liftZ)
        gl.uniform1f(u.uRake, sh.lean)
        gl.uniform1f(u.uSlant, PROFILE.slant)
        gl.uniform1f(u.uRound, p.layout.radius / cardH)
        gl.uniform1f(u.uPress, still ? 0 : p.hover.sink)
        gl.uniform1f(u.uGlow, p.hover.glow)
        gl.uniform1f(u.uWarp, still ? 0 : p.hover.ripple)
        gl.uniform1f(
            u.uSplit,
            still ? 0 : Math.abs(flexState.value) * 0.0045 * p.sheet.fringe
        )
        gl.bindVertexArray(sheetMesh.vao)

        for (const d of decks)
            if (d.clip && !d.clip.paused && d.clip.readyState >= 2)
                fillTexture(gl, d.face, d.clip, false)

        const tilt = still ? 0 : 0.09 * p.hover.tilt
        const style = p.entrance.style
        for (const s of seats) {
            const cx = midOf(s) - sh.hw
            if (cx + s.w < -width * 1.2 || cx - s.w > width * 1.2) continue
            const d = decks[s.deck]
            const t = entranceOf(s)
            const e = easeOut(t)
            let fade = t * t * (3 - 2 * t)
            let rise = 0,
                fold = 0,
                grow = 1
            if (style === "rise" && t < 1) {
                rise = -(1 - e) * cardH * 0.7
                fold = (1 - e) * 0.75
                grow = 0.88 + 0.12 * e
                fade = lim(t * 2.2, 0, 1)
            } else if (style === "sweep") fade = lim(t * 2.5, 0, 1)
            cardMatrix(
                scratch,
                cx,
                rise,
                s.w * grow,
                cardH * grow,
                -(s.fv - 0.5) * tilt * s.hover + fold,
                (s.fu - 0.5) * tilt * s.hover
            )
            gl.uniformMatrix4fv(u.uModel, false, scratch)
            gl.uniform2f(u.uSize, s.w, cardH)
            gl.uniform2f(u.uFocus, s.fu, s.fv)
            gl.uniform2f(u.uMedia, d.fw, d.fh)
            gl.uniform2f(u.uAltMedia, d.bw, d.bh)
            gl.uniform1f(u.uOpacity, fade)
            gl.uniform1f(u.uHover, s.hover)
            gl.uniform1f(u.uPeel, d.peel ? 1 : 0)
            gl.uniform1f(u.uPhase, s.phase)
            gl.uniform1f(u.uClock, s.clock)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, d.face)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, d.peel ? d.back : d.face)
            gl.drawElements(gl.TRIANGLES, sheetMesh.count, gl.UNSIGNED_SHORT, 0)
        }
        gl.bindVertexArray(null)
    }

    /* the loop */
    const tick = (now: number) => {
        ticking = 0
        if (!allowed()) return
        const p = live.current
        const dt = lim((now - (lastTick || now - 16.7)) / 1000, 1 / 240, 1 / 20)
        lastTick = now

        let lively = false

        if (introOn && introT < introEnd) {
            introT += dt
            lively = true
        }
        updateSweep()

        const drift = still ? 0 : p.motion.drift
        const drifting =
            ready &&
            drift !== 0 &&
            !grab.on &&
            track.goal === null &&
            !(p.motion.pauseOnHover && focused)
        if (drifting) track.pos -= drift * dt

        integrate(dt)
        if (
            track.goal !== null ||
            track.vel !== 0 ||
            flexState.value !== 0 ||
            grab.on
        )
            lively = true

        const par = still ? 0 : p.sheet.parallax
        const ex = pointer.inside
            ? (pointer.x / width - 0.5) * 0.1 * height * par
            : 0
        const ey = pointer.inside
            ? -(pointer.y / height - 0.5) * 0.045 * height * par
            : 0
        eye.x = settleTo(eye.x, ex, 4, dt)
        eye.y = settleTo(eye.y, ey, 4, dt)
        if (Math.abs(eye.x - ex) < 0.02 && Math.abs(eye.y - ey) < 0.02) {
            eye.x = ex
            eye.y = ey
        } else lively = true
        viewProj = compose(
            frustum(FOV, width / height, eyeZ * 0.02, eyeZ * 30),
            aimCamera(eye.x, eye.y, eyeZ)
        )

        const sh = shape()
        for (const s of seats) outline(s, midOf(s) - sh.hw, sh)
        focused =
            grab.on || !pointer.inside || !ready
                ? null
                : seatAt(pointer.x, pointer.y)

        for (const s of seats) {
            const d = decks[s.deck]
            const on = s === focused
            const target = on ? 1 : 0
            s.hover = settleTo(s.hover, target, on ? 12 : 10, dt)
            if (Math.abs(s.hover - target) < 0.001) s.hover = target
            else lively = true
            if (d.peel && !still) {
                const before = s.phase
                s.phase = lim(
                    s.phase +
                        (on
                            ? dt / Math.max(0.25, p.hover.revealTime)
                            : -dt / 0.75),
                    0,
                    1
                )
                if (s.phase !== before) lively = true
            } else s.phase = 0
            if (on && !d.peel && !still && p.hover.ripple > 0) {
                s.clock += dt
                lively = true
            } else if (s.hover === 0) s.clock = 0
            else if (!d.peel) s.clock += dt
            if (on) {
                const [l, t, r, b] = s.rect
                const fu = lim((pointer.x - l) / Math.max(1, r - l), 0.08, 0.92)
                const fv = lim(
                    1 - (pointer.y - t) / Math.max(1, b - t),
                    0.1,
                    0.9
                )
                s.fu = settleTo(s.fu, fu, 10, dt)
                s.fv = settleTo(s.fv, fv, 10, dt)
                if (Math.abs(s.fu - fu) > 0.001 || Math.abs(s.fv - fv) > 0.001)
                    lively = true
            }
        }

        if (!grab.on) canvas.style.cursor = focused ? "pointer" : "grab"

        paint(sh)

        if (decks.some((d) => d.clip && !d.clip.paused)) lively = true
        if (lively || drifting) ticking = requestAnimationFrame(tick)
    }

    const nudge = () => {
        if (ticking || !allowed()) return
        lastTick = 0
        ticking = requestAnimationFrame(tick)
    }

    const halt = () => {
        if (ticking) cancelAnimationFrame(ticking)
        ticking = 0
        grab.on = false
        track.vel = 0
        track.goal = null
        flexState.value = 0
        flexState.speed = 0
        pointer.inside = false
        setPlayback(false)
    }

    const recheck = () => {
        if (allowed()) {
            setPlayback(true)
            nudge()
        } else halt()
    }

    /* input */
    const at = (e: { clientX: number; clientY: number }) => {
        const r = canvas.getBoundingClientRect()
        return [e.clientX - r.left, e.clientY - r.top] as const
    }
    const visit = (url: string) => {
        if (!url) return
        if (live.current.click.newTab)
            window.open(url, "_blank", "noopener,noreferrer")
        else window.location.assign(url)
    }
    const press = (e: PointerEvent) => {
        if (!allowed() || (e.pointerType === "mouse" && e.button !== 0)) return
        const [x, y] = at(e)
        grab.on = true
        grab.moved = false
        grab.startX = grab.lastX = x
        grab.startPos = track.pos
        grab.lastT = performance.now()
        grab.flick = 0
        track.goal = track.pos
        track.stiff = 900
        pointer.x = x
        pointer.y = y
        pointer.inside = true
        try {
            canvas.setPointerCapture(e.pointerId)
        } catch {}
        canvas.style.cursor = "grabbing"
        nudge()
    }
    const glide = (e: PointerEvent) => {
        const [x, y] = at(e)
        pointer.x = x
        pointer.y = y
        pointer.inside = true
        if (grab.on) {
            const gain = live.current.motion.dragSpeed
            if (Math.abs(x - grab.startX) > 5) grab.moved = true
            track.goal = grab.startPos + (x - grab.startX) * gain
            const now = performance.now()
            const span = Math.max(1, now - grab.lastT)
            const inst = ((x - grab.lastX) / span) * 1000 * gain
            grab.flick = grab.flick * 0.6 + inst * 0.4
            grab.lastX = x
            grab.lastT = now
        }
        nudge()
    }
    const release = (e: PointerEvent) => {
        if (!grab.on) return
        grab.on = false
        try {
            canvas.releasePointerCapture(e.pointerId)
        } catch {}
        const idle = performance.now() - grab.lastT > 90
        if (grab.moved) {
            track.goal = null
            track.vel = still || idle ? 0 : lim(grab.flick, -4000, 4000)
        } else if (e.type === "pointerup") {
            track.goal = null
            track.vel = 0
            const [x, y] = at(e)
            const hit = seatAt(x, y)
            if (hit) {
                const url = decks[hit.deck].entry.link
                const offset = width / 2 - midOf(hit)
                if (
                    url &&
                    (live.current.click.action === "open" ||
                        Math.abs(offset) < 6)
                )
                    visit(url)
                else {
                    track.goal = track.pos + offset
                    track.stiff = 60
                }
            }
        } else track.goal = null
        nudge()
    }
    const exit = () => {
        pointer.inside = false
        if (!grab.on) canvas.style.cursor = "grab"
        nudge()
    }
    const scroll = (e: WheelEvent) => {
        const m = live.current.motion
        if (m.wheel === "off" || !allowed()) return
        let delta: number
        if (m.wheel === "horizontal") {
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
            delta = e.deltaX
        } else
            delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        e.preventDefault()
        const unit = e.deltaMode === 1 ? 30 : e.deltaMode === 2 ? height : 1
        delta *= unit * m.wheelSpeed
        track.goal = null
        if (still) track.pos -= delta
        else track.vel = lim(track.vel - delta * 9, -3200, 3200)
        nudge()
    }
    const key = (e: KeyboardEvent) => {
        if (!live.current.motion.keyboard) return
        const dir = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0
        if (!dir) return
        e.preventDefault()
        track.goal = (track.goal ?? track.pos) + dir * cardH * 0.9
        track.vel = 0
        track.stiff = 60
        nudge()
    }

    canvas.addEventListener("pointerdown", press)
    canvas.addEventListener("pointermove", glide)
    canvas.addEventListener("pointerup", release)
    canvas.addEventListener("pointercancel", release)
    canvas.addEventListener("pointerleave", exit)
    canvas.addEventListener("wheel", scroll, { passive: false })
    canvas.addEventListener("keydown", key)

    const onTab = () => {
        tabOn = !document.hidden
        recheck()
    }
    document.addEventListener("visibilitychange", onTab)

    const onPref = () => {
        still = !!(motionPref && motionPref.matches)
        if (still && introOn) introT = introEnd + 1
        recheck()
    }
    if (motionPref && motionPref.addEventListener)
        motionPref.addEventListener("change", onPref)

    let watcher: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
        watcher = new IntersectionObserver(
            (list) => {
                const was = shown
                shown = list.some((item) => item.isIntersecting)
                if (
                    shown &&
                    !was &&
                    seenOnce &&
                    ready &&
                    live.current.entrance.replay &&
                    !still
                )
                    beginEntrance()
                if (shown) seenOnce = true
                recheck()
            },
            { rootMargin: "80px 0px" }
        )
        watcher.observe(frame)
    }

    const keepAnchor = (fn: () => void) => {
        const anchor = ready && seats[0] ? midOf(seats[0]) / width : null
        fn()
        if (anchor !== null && seats[0]) {
            track.pos += anchor * width - midOf(seats[0])
            track.goal = null
            track.vel = 0
        }
    }

    const sizer =
        typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => {
                  keepAnchor(measureFrame)
                  nudge()
              })
            : null
    if (sizer) sizer.observe(frame)
    measureFrame()

    const onLost = (e: Event) => {
        e.preventDefault()
        halt()
        gone = true
        onBroken()
    }
    canvas.addEventListener("webglcontextlost", onLost)

    return {
        nudge,
        reflow: () => {
            keepAnchor(measureFrame)
            nudge()
        },
        stop: () => {
            gone = true
            if (ticking) cancelAnimationFrame(ticking)
            ticking = 0
            if (watcher) watcher.disconnect()
            if (sizer) sizer.disconnect()
            document.removeEventListener("visibilitychange", onTab)
            if (motionPref && motionPref.removeEventListener)
                motionPref.removeEventListener("change", onPref)
            canvas.removeEventListener("pointerdown", press)
            canvas.removeEventListener("pointermove", glide)
            canvas.removeEventListener("pointerup", release)
            canvas.removeEventListener("pointercancel", release)
            canvas.removeEventListener("pointerleave", exit)
            canvas.removeEventListener("wheel", scroll)
            canvas.removeEventListener("keydown", key)
            canvas.removeEventListener("webglcontextlost", onLost)
            decks.forEach((d) => {
                if (d.clip) {
                    d.clip.pause()
                    d.clip.removeAttribute("src")
                    d.clip.load()
                }
                gl.deleteTexture(d.face)
                gl.deleteTexture(d.back)
            })
            ;[sheetMesh, groundMesh].forEach((m) => {
                gl.deleteVertexArray(m.vao)
                m.trash.forEach((b) => gl.deleteBuffer(b))
            })
            gl.deleteProgram(sheetProg.handle)
            gl.deleteProgram(groundProg.handle)
        },
    }
}

/* ═══════════════════════════════════════════════════════ static branch ══ */

function FlatStrip(props: Props) {
    const { layout, scene, style } = props
    const items = props.cards.map(toEntry)
    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: scene.background,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `calc(${layout.startAt}% - ${Math.round(layout.maxCardHeight * 0.4)}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: layout.gap,
                }}
            >
                {items.map((it, i) => (
                    <div
                        key={i}
                        style={{
                            position: "relative",
                            flexShrink: 0,
                            height: `min(${layout.cardHeight}%, ${layout.maxCardHeight}px)`,
                            borderRadius: layout.radius,
                            overflow: "hidden",
                            background: "rgba(127,127,127,0.2)",
                            display: "flex",
                        }}
                    >
                        {!it.src ? (
                            <div
                                style={{ height: "100%", aspectRatio: "4 / 5" }}
                            />
                        ) : it.video ? (
                            <video
                                src={`${it.src}#t=0.1`}
                                muted
                                playsInline
                                autoPlay={false}
                                preload="metadata"
                                style={{
                                    display: "block",
                                    height: "100%",
                                    width: "auto",
                                }}
                            />
                        ) : (
                            <img
                                src={it.src}
                                alt={it.label}
                                draggable={false}
                                style={{
                                    display: "block",
                                    height: "100%",
                                    width: "auto",
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ═════════════════════════════════════════════════════════ live branch ══ */

function SheetStage(props: Props) {
    const { scene, style } = props
    const frameRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const driver = useRef<Driver | null>(null)
    const live = useRef(props)
    live.current = props
    const [broken, setBroken] = useState(false)

    const entries = useMemo(() => props.cards.map(toEntry), [props.cards])
    const mediaSig = entries
        .map((e) => `${e.video ? 1 : 0}:${e.src}:${e.under}`)
        .join("|")
    const entriesRef = useRef(entries)
    entriesRef.current = entries

    useEffect(() => {
        const canvas = canvasRef.current
        const frame = frameRef.current
        if (!canvas || !frame) return
        const d = launch(canvas, frame, entriesRef.current, live, () =>
            setBroken(true)
        )
        driver.current = d
        return () => {
            if (d) d.stop()
            driver.current = null
        }
    }, [mediaSig])

    const layoutSig = JSON.stringify(props.layout)
    useEffect(() => {
        if (driver.current) driver.current.reflow()
    }, [layoutSig])

    useEffect(() => {
        if (driver.current) driver.current.nudge()
    })

    if (broken) return <FlatStrip {...props} />

    return (
        <div
            ref={frameRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Media gallery"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: scene.background,
                isolation: "isolate",
            }}
        >
            <canvas
                ref={canvasRef}
                tabIndex={0}
                aria-label="Draggable gallery. Use the left and right arrow keys to move."
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    cursor: "grab",
                    touchAction: "pan-y",
                    userSelect: "none",
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                }}
            />
            <ul
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    margin: -1,
                    overflow: "hidden",
                    clipPath: "inset(50%)",
                    whiteSpace: "nowrap",
                }}
            >
                {entries.map((e, i) => (
                    <li key={i}>
                        {e.link ? <a href={e.link}>{e.label}</a> : e.label}
                    </li>
                ))}
            </ul>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════ export ══ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Sinuate(raw: Props) {
    const isStatic = useIsStaticRenderer()
    const props = complete(raw)
    if (isStatic) return <FlatStrip {...props} />
    return <SheetStage {...props} />
}

/* ════════════════════════════════════════════════════════════ controls ══ */

addPropertyControls(Sinuate, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 24,
        defaultValue: STARTER,
        control: {
            type: ControlType.Object,
            controls: {
                media: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["Image", "Video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "Image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (c: Card) => c.media === "Video",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    hidden: (c: Card) => c.media === "Video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (c: Card) => c.media !== "Video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                    hidden: (c: Card) => c.media !== "Video",
                },
                revealImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Hover Image",
                    description: "Optional. Peels in on hover.",
                    hidden: (c: Card) => c.media === "Video",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                min: 15,
                max: 90,
                step: 1,
                unit: "%",
                defaultValue: 44,
            },
            maxCardHeight: {
                type: ControlType.Number,
                title: "Max Height",
                min: 80,
                max: 1400,
                step: 10,
                unit: "px",
                defaultValue: 560,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 12,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 20,
            },
            startAt: {
                type: ControlType.Number,
                title: "First Card",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 33,
            },
            centreOnMobile: {
                type: ControlType.Boolean,
                title: "Centre < 700",
                defaultValue: true,
            },
        },
    },
    sheet: {
        type: ControlType.Object,
        title: "Ribbon",
        controls: {
            curve: {
                type: ControlType.Number,
                title: "Curve",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            bend: {
                type: ControlType.Number,
                title: "Speed Bend",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            lean: {
                type: ControlType.Number,
                title: "Lean",
                min: -3,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            fringe: {
                type: ControlType.Number,
                title: "Colour Split",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            dragSpeed: {
                type: ControlType.Number,
                title: "Drag",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            friction: {
                type: ControlType.Number,
                title: "Friction",
                min: 0.8,
                max: 10,
                step: 0.1,
                defaultValue: 2.6,
            },
            wheel: {
                type: ControlType.Enum,
                title: "Wheel",
                options: ["off", "horizontal", "all"],
                optionTitles: ["Off", "Horizontal", "All"],
                defaultValue: "horizontal",
            },
            wheelSpeed: {
                type: ControlType.Number,
                title: "Wheel Speed",
                min: 0.1,
                max: 3,
                step: 0.05,
                defaultValue: 1,
                hidden: (m: Props["motion"]) => m.wheel === "off",
            },
            drift: {
                type: ControlType.Number,
                title: "Auto Drift",
                min: -200,
                max: 200,
                step: 1,
                unit: "px/s",
                defaultValue: 0,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: true,
                hidden: (m: Props["motion"]) => !m.drift,
            },
            keyboard: {
                type: ControlType.Boolean,
                title: "Arrow Keys",
                defaultValue: true,
            },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            ripple: {
                type: ControlType.Number,
                title: "Ripple",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            sink: {
                type: ControlType.Number,
                title: "Press In",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: 0,
                max: 4,
                step: 0.05,
                defaultValue: 1,
            },
            revealTime: {
                type: ControlType.Number,
                title: "Peel Time",
                min: 0.3,
                max: 4,
                step: 0.05,
                unit: "s",
                defaultValue: 1.6,
            },
        },
    },
    entrance: {
        type: ControlType.Object,
        title: "Entrance",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["rise", "sweep", "fade", "none"],
                optionTitles: ["Rise", "Sweep In", "Fade", "None"],
                defaultValue: "rise",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.2,
                max: 4,
                step: 0.05,
                unit: "s",
                defaultValue: 1.1,
                hidden: (e: Props["entrance"]) => e.style === "none",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                min: 0,
                max: 0.5,
                step: 0.01,
                unit: "s",
                defaultValue: 0.08,
                hidden: (e: Props["entrance"]) =>
                    e.style === "none" || e.style === "sweep",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                min: 0,
                max: 3,
                step: 0.05,
                unit: "s",
                defaultValue: 0.1,
                hidden: (e: Props["entrance"]) => e.style === "none",
            },
            replay: {
                type: ControlType.Boolean,
                title: "Replay",
                description: "Play again each time it scrolls into view.",
                defaultValue: false,
                hidden: (e: Props["entrance"]) => e.style === "none",
            },
        },
    },
    click: {
        type: ControlType.Object,
        title: "Click",
        controls: {
            action: {
                type: ControlType.Enum,
                title: "Action",
                options: ["centre", "open"],
                optionTitles: ["Centre, Then Link", "Open Link"],
                defaultValue: "centre",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
            },
        },
    },
    scene: {
        type: ControlType.Object,
        title: "Scene",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000000",
            },
            floor: {
                type: ControlType.Boolean,
                title: "Floor Grid",
                defaultValue: true,
            },
            floorColor: {
                type: ControlType.Color,
                title: "Grid Colour",
                defaultValue: "rgba(255,255,255,0.08)",
                hidden: (s: Props["scene"]) => !s.floor,
            },
        },
    },
})
