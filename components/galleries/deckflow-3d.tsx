// Card Strand 3D v8.2: physical trading cards flowing through space in a spiral
// staircase, a straight row, a wave or a standing fan, shot with a cinematic camera.
// WebGL2 renderer: real card meshes (thickness, bevel), satin print with a clear
// acrylic border, studio lighting, shadows, depth of field and camera motion blur.

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


type ImageValue = { src: string; srcSet?: string; alt?: string } | string | undefined
type CardItem = { image?: ImageValue; title?: string; subtitle?: string }
type Layout = "spiral" | "row" | "wave" | "fan"

interface Props {
    cards: CardItem[]
    count: number
    cardWidth: number
    cardHeight: number
    cornerRadius: number
    thickness: number
    spacing: number
    lean: number
    showLabels: boolean
    cardBack: "art" | "design"
    radius: number
    layout: Layout | "arc"
    whipSpin: number
    autoFeature: boolean
    featureEvery: number
    flowSpeed: number
    flowDirection: "forward" | "reverse"
    pathAxis: "vertical" | "horizontal" | "diagonal"
    cameraMode: "cinematic" | "fixed" | "scroll"
    fixedShot: string
    shotLength: number
    whipTime: number
    closeness: number
    draggable: boolean
    hoverEffect: boolean
    hoverLift: number
    scrollMode: "none" | "flow" | "spin"
    scrollBoost: number
    quality: "auto" | "high" | "balanced" | "fast"
    depthOfField: number
    motionBlur: number
    lighting: number
    rimLight: string
    background: string
    demoBar: boolean
    cardMotion: number
    style?: React.CSSProperties
}

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1080&h=1520&q=85`
const DEFAULT_CARDS: CardItem[] = [
    { image: U("photo-1551808290-73c0fba381ce"), title: "Mira Sol", subtitle: "Bloom Series" },
    { image: U("photo-1659390048264-9e4103d8c0b4"), title: "Kade Rivers", subtitle: "Neon Series" },
    { image: U("photo-1673623250951-68692d52d841"), title: "Lena Hart", subtitle: "Bloom Series" },
    { image: U("photo-1727953332323-0c27ca507182"), title: "Theo Park", subtitle: "Street Series" },
    { image: U("photo-1690310694583-ab098570316b"), title: "Ava Monroe", subtitle: "Bloom Series" },
    { image: U("photo-1658590974767-989237290487"), title: "Nova Blue", subtitle: "Neon Series" },
    { image: U("photo-1785698853254-4cba47b0e2ee"), title: "Zuri Ade", subtitle: "Color Series" },
    { image: U("photo-1672775900349-530aeedcfe2f"), title: "Imani Cole", subtitle: "Gold Series" },
    { image: U("photo-1618510050510-d0903984e131"), title: "Rae Lin", subtitle: "Bloom Series" },
    { image: U("photo-1691679769924-4430510fbc4f"), title: "Jonas Vey", subtitle: "Neon Series" },
    { image: U("photo-1654198297045-c6355d1ffe75"), title: "Eli Strand", subtitle: "Street Series" },
    { image: U("photo-1793486299363-6160910b3098"), title: "Dre Mason", subtitle: "Court Series" },
    { image: U("photo-1779099979994-dbea2d038df8"), title: "Ola Wren", subtitle: "Bloom Series" },
    { image: U("photo-1765226343486-5c77f48e6a6e"), title: "Sasha Reed", subtitle: "Court Series" },
    { image: U("photo-1638409867784-4ed76ed742a1"), title: "Pia Lux", subtitle: "Color Series" },
    { image: U("photo-1587404461277-b5e78c00626a"), title: "June Ortiz", subtitle: "Color Series" },
]

// Camera shots, defined in the frame of the point the camera looks at:
// d = direction from target to eye as (card-up, side, along the strand), dist in card heights,
// roll in degrees, shift = target offset along the strand in cards, hold = relative hold time,
// enter = screen side the cards sweep in from at the start of the shot (x, y).
type Shot = { d: [number, number, number]; dist: number; roll: number; shift: number; hold: number; enter: [number, number] }
const SHOTS: Record<Layout, Shot[]> = {
    spiral: [
        { d: [0.25, 0.9, 0.35], dist: 3.2, roll: 28, shift: 0, hold: 1, enter: [-1, 1] },
        { d: [0.45, 0.55, 0.7], dist: 2.5, roll: -32, shift: 10, hold: 1, enter: [-1, -1] },
        { d: [0.3, -0.8, -0.5], dist: 2.9, roll: -20, shift: 20, hold: 0.9, enter: [1, 0.4] },
        { d: [0.1, 0.72, 0.68], dist: 1.75, roll: 18, shift: 30, hold: 0.8, enter: [0.3, 1] },
        { d: [0.55, 0.7, 0.45], dist: 4.6, roll: -42, shift: 40, hold: 1, enter: [1, -1] },
    ],
    row: [
        { d: [0.28, 0.75, 0.6], dist: 3.9, roll: 0, shift: 0, hold: 1, enter: [1, 0.3] },
        { d: [0.05, 0.72, 0.69], dist: 3.6, roll: -3, shift: 8, hold: 1, enter: [-1, 0] },
        { d: [0.25, 0.4, 0.88], dist: 4.2, roll: 4, shift: 16, hold: 0.9, enter: [0.6, -1] },
        { d: [0.6, 0.45, 0.66], dist: 5.0, roll: 18, shift: 24, hold: 0.9, enter: [-1, 1] },
        { d: [-0.1, 0.7, -0.7], dist: 3.4, roll: -8, shift: 32, hold: 0.9, enter: [1, -0.5] },
    ],
    wave: [
        { d: [0.6, 0.35, 0.72], dist: 5.2, roll: 14, shift: 0, hold: 1, enter: [-1, 1] },
        { d: [0.35, 0.6, 0.72], dist: 4.4, roll: -16, shift: 8, hold: 1, enter: [1, -0.6] },
        { d: [0.85, 0.15, 0.5], dist: 6.0, roll: 30, shift: 16, hold: 0.9, enter: [-1, -1] },
        { d: [0.5, -0.5, 0.7], dist: 4.2, roll: 6, shift: 24, hold: 0.9, enter: [0.4, 1] },
        { d: [0.7, 0.55, 0.45], dist: 6.2, roll: -10, shift: 32, hold: 0.9, enter: [1, 0] },
    ],
    // the fan is framed from inside the ring; dist is in ring radii here
    fan: [
        { d: [0.12, 1, 0], dist: 1.55, roll: 0, shift: 0, hold: 1.2, enter: [0, -1] },
        { d: [-0.18, 1, 0], dist: 1.3, roll: -4, shift: 1.5, hold: 1, enter: [-1, 0] },
        { d: [0.55, 0.85, 0], dist: 1.45, roll: 0, shift: -1.5, hold: 1, enter: [1, 0.5] },
        { d: [0.1, 0.92, 0.38], dist: 1.35, roll: 8, shift: 2.5, hold: 0.9, enter: [1, -1] },
        { d: [0.3, 1, -0.2], dist: 1.75, roll: -6, shift: -0.5, hold: 0.9, enter: [-1, 1] },
    ],
}

const LAYOUT_NAMES: Record<Layout, string> = { spiral: "SPIRAL", row: "STRAIGHT ROW", wave: "WAVE", fan: "STANDING FAN" }

// ---------- small math ----------
type V3 = [number, number, number]
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const nrm = (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1
    return [a[0] / l, a[1] / l, a[2] / l]
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// camera whip: starts fast, brakes softly into the next shot
const whip = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3.5)
const rotAxis = (v: V3, k: V3, a: number): V3 => {
    const c = Math.cos(a), s = Math.sin(a)
    const kv = cross(k, v), kd = dot(k, v)
    return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)]
}
const hash = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - Math.floor(x)
}
const srcOf = (img: ImageValue) => (typeof img === "string" ? img : img?.src || "")

function perspective(fovy: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan(fovy / 2)
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0])
}
function ortho(l: number, r: number, b: number, t: number, n: number, f: number) {
    return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1])
}
function lookAt(eye: V3, target: V3, up: V3) {
    const z = nrm([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]])
    const x = nrm(cross(up, z))
    const y = cross(z, x)
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1])
}
// out[off..off+16] = view * [X Y Z C] without allocating
function mulCols(out: Float32Array, off: number, a: Float32Array, X: V3, Y: V3, Z: V3, C: V3) {
    const cols = [X, Y, Z, C]
    for (let c = 0; c < 4; c++) {
        const v = cols[c], w = c === 3 ? 1 : 0
        for (let r = 0; r < 4; r++) out[off + c * 4 + r] = a[r] * v[0] + a[4 + r] * v[1] + a[8 + r] * v[2] + a[12 + r] * w
    }
}
function mul(a: Float32Array, b: Float32Array) {
    const o = new Float32Array(16)
    for (let c = 0; c < 4; c++)
        for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]
    return o
}
const xfP = (m: Float32Array, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]

let colorCtx: CanvasRenderingContext2D | null = null
const colorCache = new Map<string, V3>()
function toRGB(c: string, fallback: V3): V3 {
    const hit = colorCache.get(c)
    if (hit) return hit
    const v = parseColor(c, fallback)
    if (colorCache.size > 64) colorCache.clear()
    colorCache.set(c, v)
    return v
}
function parseColor(c: string, fallback: V3): V3 {
    if (typeof document === "undefined") return fallback
    if (!colorCtx) colorCtx = document.createElement("canvas").getContext("2d")
    if (!colorCtx) return fallback
    colorCtx.fillStyle = "#010203"
    colorCtx.fillStyle = c
    const s = String(colorCtx.fillStyle)
    if (s === "#010203") return fallback
    if (s[0] === "#") return [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255]
    const m = s.match(/[\d.]+/g)
    return m ? [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255] : fallback
}


// ---------- card mesh: rounded slab with bevels ----------
function buildCard(W: number, H: number, R: number, T: number) {
    const pos: number[] = [], nor: number[] = [], uv: number[] = [], part: number[] = [], idx: number[] = []
    const b = Math.min(1.4, T * 0.38)
    const zf = T / 2, zb = T / 2 - b
    const seg = 10
    const outline = (inset: number) => {
        const pts: [number, number, number, number][] = []
        const r = Math.max(0.5, R - inset), hw = W / 2 - inset, hh = H / 2 - inset
        const cs: [number, number, number][] = [[hw - r, hh - r, 0], [-(hw - r), hh - r, Math.PI / 2], [-(hw - r), -(hh - r), Math.PI], [hw - r, -(hh - r), Math.PI * 1.5]]
        for (const [cx, cy, a0] of cs)
            for (let i = 0; i <= seg; i++) {
                const a = a0 + (i / seg) * (Math.PI / 2)
                pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)])
            }
        return pts
    }
    const outer = outline(0), inner = outline(b)
    const N = outer.length
    const vtx = (x: number, y: number, z: number, n: V3, p: number, back = false) => {
        pos.push(x, y, z)
        nor.push(...n)
        uv.push(back ? 0.5 - x / W : 0.5 + x / W, 0.5 - y / H)
        part.push(p)
        return pos.length / 3 - 1
    }
    for (const side of [1, -1]) {
        const back = side < 0
        // flat face
        const c = vtx(0, 0, side * zf, [0, 0, side], back ? 1 : 0, back)
        const ring = inner.map(([x, y]) => vtx(x, y, side * zf, [0, 0, side], back ? 1 : 0, back))
        for (let i = 0; i < N; i++) {
            const j = (i + 1) % N
            if (side > 0) idx.push(c, ring[i], ring[j])
            else idx.push(c, ring[j], ring[i])
        }
        // bevel
        const bi = inner.map(([x, y, nx, ny]) => vtx(x, y, side * zf, nrm([nx * 0.55, ny * 0.55, side]), 2, back))
        const bo = outer.map(([x, y, nx, ny]) => vtx(x, y, side * zb, nrm([nx, ny, side * 0.3]), 2, back))
        for (let i = 0; i < N; i++) {
            const j = (i + 1) % N
            if (side > 0) idx.push(bi[i], bo[i], bo[j], bi[i], bo[j], bi[j])
            else idx.push(bi[i], bo[j], bo[i], bi[i], bi[j], bo[j])
        }
    }
    // side wall
    const top = outer.map(([x, y, nx, ny]) => vtx(x, y, zb, [nx, ny, 0], 2))
    const bot = outer.map(([x, y, nx, ny]) => vtx(x, y, -zb, [nx, ny, 0], 2))
    for (let i = 0; i < N; i++) {
        const j = (i + 1) % N
        idx.push(top[i], bot[i], bot[j], top[i], bot[j], top[j])
    }
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), part: new Float32Array(part), idx: new Uint16Array(idx) }
}

// ---------- shaders ----------
const VS_CARD = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNor;
layout(location=2) in vec2 aUv;
layout(location=3) in float aPart;
layout(location=4) in vec4 iM0;
layout(location=5) in vec4 iM1;
layout(location=6) in vec4 iM2;
layout(location=7) in vec4 iM3;
layout(location=8) in vec4 iMeta;
uniform mat4 uProj; uniform mat4 uLightVP;
out vec3 vPos; out vec3 vN; out vec2 vUv; out float vPart; out vec4 vMeta; out vec4 vLight; out vec2 vLocal;
void main(){
  mat4 mv = mat4(iM0, iM1, iM2, iM3);
  vec4 p = mv * vec4(aPos, 1.0);
  vPos = p.xyz; vN = mat3(mv) * aNor; vUv = aUv; vPart = aPart; vMeta = iMeta; vLocal = aPos.xy;
  vLight = uLightVP * p;
  gl_Position = uProj * p;
}`

const FS_CARD = `#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp sampler2DShadow;
in vec3 vPos; in vec3 vN; in vec2 vUv; in float vPart; in vec4 vMeta; in vec4 vLight; in vec2 vLocal;
uniform sampler2DArray uTex; uniform sampler2DShadow uShadow;
uniform vec2 uSize; uniform float uRadius; uniform float uMargin; uniform float uBackLayer;
uniform vec3 uKey; uniform vec3 uFill; uniform vec3 uRimDir; uniform vec3 uRimCol;
uniform float uExposure; uniform float uDepthScale; uniform vec2 uShadowTexel;
uniform int uPcf; uniform float uShadowOn; uniform float uPass;
out vec4 o;
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float shadowPCF(){
  if (uShadowOn < 0.5) return 1.0;
  vec3 s = vLight.xyz / vLight.w * 0.5 + 0.5;
  if (s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0) return 1.0;
  s.z -= 0.0015;
  if (uPcf <= 1) return texture(uShadow, s);
  vec2 d = uShadowTexel * 0.9;
  return 0.25 * (texture(uShadow, vec3(s.xy + vec2(-d.x, -d.y), s.z)) + texture(uShadow, vec3(s.xy + vec2(d.x, -d.y), s.z))
    + texture(uShadow, vec3(s.xy + vec2(-d.x, d.y), s.z)) + texture(uShadow, vec3(s.xy + vec2(d.x, d.y), s.z)));
}
float ggx(vec3 N, vec3 V, vec3 L, float rough){
  vec3 H = normalize(V + L);
  float NoH = max(dot(N, H), 0.0), NoL = max(dot(N, L), 0.0), VoH = max(dot(V, H), 0.0);
  float a = rough * rough, a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * d * d);
  float F = 0.04 + 0.96 * pow(1.0 - VoH, 5.0);
  return D * F / (4.0 * max(VoH * VoH, 0.05)) * NoL;
}
// studio environment: dark room, a big key softbox, a long strip light and a cool kicker
vec3 env(vec3 R, vec3 key, float rough){
  float w = rough * 0.6;
  float box = smoothstep(0.86 - w, 0.95, dot(R, key));
  float strip = smoothstep(0.95 - w, 0.995, dot(R, normalize(vec3(0.8, 0.15, 0.55))));
  float kick = smoothstep(0.9 - w, 0.985, dot(R, normalize(vec3(-0.2, -0.5, 0.85))));
  float top = smoothstep(0.55, 1.0, R.y) * 0.08;
  vec3 room = mix(vec3(0.004, 0.005, 0.008), vec3(0.03, 0.035, 0.05), clamp(R.y * 0.5 + 0.5, 0.0, 1.0));
  return room + vec3(1.0, 0.98, 0.95) * box * 1.6 + vec3(0.85, 0.92, 1.0) * strip * 1.4 + vec3(0.5, 0.75, 1.0) * kick * 0.6 + top;
}
vec3 tonemap(vec3 x){
  x = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  return pow(clamp(x, 0.0, 1.0), vec3(1.0 / 2.2));
}
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  bool face = vPart < 1.5;
  float d = sdRound(vLocal, uSize * 0.5, uRadius);
  // the print sits inside a clear acrylic frame: faces inside the margin are print, the rest is glass
  float glassAmt = face ? smoothstep(-uMargin - 0.5, -uMargin + 0.5, d) : 1.0;
  if (uPass < 0.5) { if (glassAmt > 0.5) discard; }
  else {
    if (glassAmt <= 0.5) discard;
    // only the side of the frame facing the camera: the far side would draw a second outline
    if (dot(N, V) < (face ? 0.0 : -0.15)) discard;
    // depth-only pass: the frame gets the card's depth, so focus and motion blur treat it as part of the card
    if (uPass > 1.5) { o = vec4(0.0, 0.0, 0.0, clamp(-vPos.z / uDepthScale, 0.0, 1.0)); return; }
  }
  if (dot(N, V) < 0.0) N = -N;
  float sh = shadowPCF();
  float NoV = max(dot(N, V), 0.0);
  vec3 R = reflect(-V, N);
  if (uPass < 0.5) {
    // ---- printed face: laminated satin print ----
    float layer = vMeta.x;
    if (vPart > 0.5 && uBackLayer >= 0.0) layer = uBackLayer;
    vec3 art = toLin(texture(uTex, vec3(vUv, layer)).rgb);
    float grime = vnoise(vLocal * 0.09) * 0.6 + vnoise(vLocal * 0.7) * 0.4;
    float rough = 0.18 + grime * 0.1;
    float fres = 0.04 + 0.96 * pow(1.0 - NoV, 5.0);
    float diffK = max(dot(N, uKey), 0.0) * sh;
    float diffF = max(dot(N, uFill), 0.0);
    vec3 col = art * (vec3(0.14, 0.15, 0.18) + vec3(1.0, 0.97, 0.93) * diffK * 1.45 + vec3(0.32, 0.36, 0.45) * diffF * 0.7);
    col += vec3(1.0, 0.97, 0.93) * ggx(N, V, uKey, rough) * sh * 1.6;
    col += env(R, uKey, rough) * (0.035 + fres * 0.9) * (0.4 + 0.6 * sh);
    // faint holographic foil that shifts with the viewing angle
    float ph = dot(vLocal, vec2(0.012, 0.02)) + NoV * 3.0;
    vec3 holo = 0.5 + 0.5 * cos(6.2832 * (ph + vec3(0.0, 0.33, 0.67)));
    col += holo * pow(1.0 - NoV, 2.0) * 0.06 * (0.3 + diffK);
    float rimT = pow(1.0 - NoV, 3.0) * max(dot(N, uRimDir) * 0.5 + 0.5, 0.0);
    col += uRimCol * rimT * 0.25;
    o = vec4(tonemap(col * uExposure), clamp(-vPos.z / uDepthScale, 0.0, 1.0));
  } else {
    // ---- clear acrylic: mostly see-through, bright reflections and edges ----
    bool edge = vPart > 1.5;
    float fres = 0.05 + 0.95 * pow(1.0 - NoV, 4.0);
    vec3 col = env(R, uKey, 0.04) * fres * 1.3;
    col += vec3(1.0, 0.98, 0.95) * ggx(N, V, uKey, 0.06) * (0.4 + 0.6 * sh) * 2.2;
    col += vec3(0.8, 0.88, 1.0) * ggx(N, V, uFill, 0.1) * 0.5;
    float rimT = pow(1.0 - NoV, 2.0) * max(dot(N, uRimDir) * 0.5 + 0.5, 0.0);
    col += uRimCol * rimT * (edge ? 1.1 : 0.6);
    // light carried through the slab from the print's edge, so frame and print read as one piece
    vec2 inUv = clamp(vUv, vec2(uMargin / uSize.x + 0.004, uMargin / uSize.y + 0.004), vec2(1.0 - uMargin / uSize.x - 0.004, 1.0 - uMargin / uSize.y - 0.004));
    vec3 edgeArt = toLin(textureLod(uTex, vec3(inUv, vMeta.x), 3.0).rgb);
    float k = face ? clamp((d + uMargin) / uMargin, 0.0, 1.0) : 1.0;
    float diffK = max(dot(N, uKey), 0.0) * sh;
    col += edgeArt * (0.35 + 0.5 * diffK) * (1.0 - 0.6 * k);
    col *= uExposure;
    float a = clamp(0.3 + 0.25 * (1.0 - k) + fres * 0.45 + dot(col, vec3(0.2)) + (edge ? 0.3 : 0.0), 0.0, 0.95);
    o = vec4(tonemap(col), a);
  }
}`

const VS_SHADOW = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=4) in vec4 iM0;
layout(location=5) in vec4 iM1;
layout(location=6) in vec4 iM2;
layout(location=7) in vec4 iM3;
uniform mat4 uLightVP;
void main(){ gl_Position = uLightVP * (mat4(iM0, iM1, iM2, iM3) * vec4(aPos, 1.0)); }`
const FS_SHADOW = `#version 300 es
precision mediump float;
void main(){}`

const VS_FS = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main(){ vec2 p = P[gl_VertexID]; vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`

const FS_BG = `#version 300 es
precision highp float;
in vec2 vUv; uniform vec3 uBg; uniform vec2 uRes;
out vec4 o;
void main(){
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float glow = exp(-dot(p - vec2(-0.35, 0.35), p - vec2(-0.35, 0.35)) * 2.5);
  vec3 c = uBg + vec3(0.012, 0.016, 0.03) * glow;
  o = vec4(c, 1.0);
}`


// Depth of field at half resolution: gather bokeh with a golden-angle spiral.
// Alpha keeps how much blur reached this pixel, so blurred foreground cards soften
// their own silhouettes in the final pass.
const FS_DOF = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uScene; uniform vec2 uTexel; uniform vec2 uScale; uniform float uFocus; uniform float uAperture; uniform float uMaxR; uniform int uTaps;
out vec4 o;
float coc(float z){ return clamp(abs(z - uFocus) / max(z, 0.02) * uAperture, 0.0, uMaxR); }
void main(){
  vec2 lim = uScale - uTexel;
  vec2 uv = min(vUv * uScale, lim);
  vec4 c0 = texture(uScene, uv);
  float r0 = coc(c0.a);
  vec3 acc = c0.rgb; float tot = 1.0; float reach = r0;
  for (int i = 0; i < 32; i++) {
    if (i >= uTaps) break;
    float fi = float(i) + 0.5;
    float rad = sqrt(fi / float(uTaps)) * uMaxR;
    float ang = fi * 2.39996;
    vec4 s = texture(uScene, clamp(uv + vec2(cos(ang), sin(ang)) * rad * uTexel, vec2(0.0), lim));
    float rs = coc(s.a);
    if (s.a > c0.a) rs = min(rs, r0 * 2.0);
    float m = smoothstep(rad - 1.0, rad + 1.0, rs);
    if (s.a < c0.a) reach = max(reach, rs * m);
    acc += mix(acc / tot, s.rgb, m);
    tot += 1.0;
  }
  o = vec4(acc / tot, reach / max(uMaxR, 0.001));
}`

// Final pass: sharp/blurred mix, per-pixel camera motion blur (reprojected from depth,
// so rolls and push-ins blur correctly), vignette and grain.
const FS_POST = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene; uniform sampler2D uDof;
uniform vec2 uScale; uniform vec2 uDScale; uniform vec2 uSTexel; uniform vec2 uDTexel;
uniform float uFocus; uniform float uAperture; uniform float uMaxR; uniform float uDofOn;
uniform mat4 uReproj; uniform vec2 uTan; uniform float uMb; uniform vec2 uRes; uniform float uTime; uniform float uDepthScale;
out vec4 o;
float coc(float z){ return clamp(abs(z - uFocus) / max(z, 0.02) * uAperture, 0.0, uMaxR); }
vec3 look(vec2 uv){
  uv = clamp(uv, vec2(0.0), vec2(1.0));
  vec4 s = texture(uScene, min(uv * uScale, uScale - uSTexel));
  if (uDofOn < 0.5) return s.rgb;
  vec4 b = texture(uDof, min(uv * uDScale, uDScale - uDTexel));
  float c = max(coc(s.a), b.a * uMaxR);
  return mix(s.rgb, b.rgb, smoothstep(0.6, 2.2, c));
}
void main(){
  vec2 vel = vec2(0.0);
  if (uMb > 0.0) {
    float d = texture(uScene, min(vUv * uScale, uScale - uSTexel)).a * uDepthScale;
    vec2 ndc = vUv * 2.0 - 1.0;
    vec4 pc = uReproj * vec4(ndc.x * uTan.x * d, ndc.y * uTan.y * d, -d, 1.0);
    if (pc.w > 0.0) {
      vel = (vUv - (pc.xy / pc.w * 0.5 + 0.5)) * uMb;
      float L = length(vel);
      if (L > 0.07) vel *= 0.07 / L;
    }
  }
  float px = length(vel * uRes);
  vec3 c;
  if (px < 1.5) c = look(vUv);
  else {
    // more samples plus a per-pixel offset, so fast whips smear smoothly instead of showing copies
    int n = int(clamp(px / 2.5, 4.0, 24.0));
    float jit = fract(sin(dot(vUv * uRes, vec2(41.3, 289.1))) * 9137.7) - 0.5;
    c = vec3(0.0);
    for (int i = 0; i < 24; i++) {
      if (i >= n) break;
      c += look(vUv + vel * ((float(i) + jit) / float(n) - 0.5));
    }
    c /= float(n);
  }
  vec2 p = vUv - 0.5; p.x *= uRes.x / uRes.y;
  c *= 1.0 - smoothstep(0.35, 1.05, length(p)) * 0.75;
  float g = fract(sin(dot(vUv * uRes + uTime * 61.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  c += g * 0.018;
  o = vec4(c, 1.0);
}`

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
    const make = (type: number, src: string) => {
        const s = gl.createShader(type)!
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader error")
        return s
    }
    const p = gl.createProgram()!
    gl.attachShader(p, make(gl.VERTEX_SHADER, vs))
    gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link error")
    return p
}

// ---------- card artwork ----------
function paintCard(ctx: CanvasRenderingContext2D, tw: number, th: number, item: CardItem, no: string, img: HTMLImageElement | null, labels: boolean, failed = false) {
    ctx.clearRect(0, 0, tw, th)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    if (img && img.naturalWidth) {
        const s = Math.max(tw / img.naturalWidth, th / img.naturalHeight)
        const w = img.naturalWidth * s, h = img.naturalHeight * s
        ctx.drawImage(img, (tw - w) / 2, (th - h) * 0.35, w, h)
    } else {
        const g = ctx.createLinearGradient(0, 0, 0, th)
        g.addColorStop(0, failed ? "#3a3a44" : "#f2b6d6")
        g.addColorStop(1, failed ? "#1c1c22" : "#9fc8ff")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, tw, th)
        if (failed) {
            // same look every time an image fails, so a broken source is easy to spot
            ctx.fillStyle = "rgba(255,255,255,0.55)"
            ctx.font = `700 ${Math.round(tw * 0.055)}px Inter, system-ui, sans-serif`
            ctx.textAlign = "center"
            ctx.fillText("IMAGE UNAVAILABLE", tw / 2, th * 0.42)
            ctx.textAlign = "left"
        }
    }
    if (!labels) return
    const m = tw * 0.1
    const bh = Math.round(th * 0.16)
    const by = th - bh - m * 0.6
    ctx.fillStyle = "#f7f7f5"
    ctx.fillRect(m, by, tw - m * 2, bh)
    const pad = tw * 0.05
    ctx.fillStyle = "#151515"
    ctx.font = `800 ${Math.round(bh * 0.3)}px Inter, "SF Pro Display", system-ui, sans-serif`
    ctx.fillText(String(item.title || "").toUpperCase(), m + pad, by + bh * 0.43, tw * 0.55)
    ctx.globalAlpha = 0.55
    ctx.font = `700 ${Math.round(bh * 0.17)}px Inter, system-ui, sans-serif`
    ctx.fillText(String(item.subtitle || "").toUpperCase(), m + pad, by + bh * 0.72, tw * 0.55)
    ctx.globalAlpha = 1
    // barcode block
    const bx = tw - m - pad - tw * 0.2, bw = tw * 0.2, bY = by + bh * 0.22, bH = bh * 0.56
    let x = bx
    let i = 0
    while (x < bx + bw) {
        const w = (1 + ((no.charCodeAt(1) + i * 7) % 3)) * (tw / 300)
        if (i % 2 === 0) ctx.fillRect(x, bY, w, bH)
        x += w + tw / 400
        i++
    }
}
function paintBack(ctx: CanvasRenderingContext2D, tw: number, th: number) {
    const g = ctx.createLinearGradient(0, 0, tw, th)
    g.addColorStop(0, "#1b2440")
    g.addColorStop(1, "#0d0f1c")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, tw, th)
    ctx.strokeStyle = "rgba(255,255,255,0.25)"
    ctx.lineWidth = 4
    ctx.strokeRect(tw * 0.1, tw * 0.1, tw * 0.8, th - tw * 0.2)
    ctx.fillStyle = "rgba(255,255,255,0.85)"
    ctx.font = `800 ${Math.round(tw * 0.08)}px Inter, system-ui, sans-serif`
    ctx.textAlign = "center"
    ctx.fillText("COLLECTOR", tw / 2, th / 2)
    ctx.textAlign = "left"
}

// quality tiers, best first. Auto starts at 1 and moves between them by measured frame time.
const TIERS = [
    { rs: 1, dpr: 2, msaa: true, pcf: 4, shadow: 1, taps: 24 },
    { rs: 1, dpr: 1.5, msaa: true, pcf: 1, shadow: 1, taps: 16 },
    { rs: 0.85, dpr: 1.5, msaa: true, pcf: 1, shadow: 1, taps: 16 },
    { rs: 0.8, dpr: 1.25, msaa: true, pcf: 1, shadow: 0, taps: 12 },
]

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CardRibbon3D(props: Props) {
    // the demo bar can switch layout and shot live without touching the real props
    const [demo, setDemo] = useState<Partial<Props>>({})
    const p = { ...defaults, ...props, ...(props.demoBar ? demo : {}) }
    const hudRef = useRef<HTMLDivElement>(null)
    // static contexts (editor canvas, exports, thumbnails) get a plain image fallback: no WebGL, no animation loop
    const isCanvas = useIsStaticRenderer()
    const [noGL, setNoGL] = useState(false)
    const [failedImages, setFailedImages] = useState(0)
    const items = useMemo(() => {
        const list = (p.cards || []).filter((c) => srcOf(c?.image))
        return list.length ? list : DEFAULT_CARDS
    }, [p.cards])

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const propsRef = useRef(p)
    propsRef.current = p
    const gfx = useRef<any>(null)
    const live = useRef({ t: 0, travel: 0, dragYaw: 0, dragPitch: 0, vYaw: 0, vPitch: 0, dragging: false, scrollTarget: 0, scrollPhase: 0, prog: 0, progTarget: 0, prevVP: null as Float32Array | null, focus: 0, mouse: null as null | [number, number], hoverK: null as null | number, hoverLocal: [0, 0] as [number, number], hoverAmt: new Map<number, number>(), hoverMix: 0, touchTimer: 0 as any, autoK: null as null | number, autoT: 0, clock: 0 })

    useEffect(() => {
        // static contexts never start WebGL or an animation loop; they show StaticFallback instead
        if (isCanvas) return
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" })
        if (!gl) {
            gfx.current = { failed: true }
            setNoGL(true)
            return
        }
        let progCard: WebGLProgram, progShadow: WebGLProgram, progBg: WebGLProgram, progDof: WebGLProgram, progPost: WebGLProgram
        try {
            progCard = compile(gl, VS_CARD, FS_CARD)
            progShadow = compile(gl, VS_SHADOW, FS_SHADOW)
            progBg = compile(gl, VS_FS, FS_BG)
            progDof = compile(gl, VS_FS, FS_DOF)
            progPost = compile(gl, VS_FS, FS_POST)
        } catch (e) {
            console.error(e)
            gfx.current = { failed: true }
            setNoGL(true)
            return
        }
        const U = (pr: WebGLProgram, names: string[]) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(pr, n)]))
        const uCard = U(progCard, ["uProj", "uLightVP", "uTex", "uShadow", "uSize", "uRadius", "uMargin", "uBackLayer", "uKey", "uFill", "uRimDir", "uRimCol", "uExposure", "uDepthScale", "uShadowTexel", "uPcf", "uShadowOn", "uPass"])
        const uShadow = U(progShadow, ["uLightVP"])
        const uBg = U(progBg, ["uBg", "uRes"])
        const uDof = U(progDof, ["uScene", "uTexel", "uScale", "uFocus", "uAperture", "uMaxR", "uTaps"])
        const uPost = U(progPost, ["uScene", "uDof", "uScale", "uDScale", "uSTexel", "uDTexel", "uFocus", "uAperture", "uMaxR", "uDofOn", "uReproj", "uTan", "uMb", "uRes", "uTime", "uDepthScale"])

        // geometry + instance buffers
        const vao = gl.createVertexArray()!
        const vb = { pos: gl.createBuffer()!, nor: gl.createBuffer()!, uv: gl.createBuffer()!, part: gl.createBuffer()!, idx: gl.createBuffer()!, inst: gl.createBuffer()! }
        gl.bindVertexArray(vao)
        const bindAttr = (buf: WebGLBuffer, loc: number, size: number) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            gl.enableVertexAttribArray(loc)
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
        }
        bindAttr(vb.pos, 0, 3); bindAttr(vb.nor, 1, 3); bindAttr(vb.uv, 2, 2); bindAttr(vb.part, 3, 1)
        gl.bindBuffer(gl.ARRAY_BUFFER, vb.inst)
        const STRIDE = 20 * 4
        for (let k = 0; k < 5; k++) {
            gl.enableVertexAttribArray(4 + k)
            gl.vertexAttribPointer(4 + k, 4, gl.FLOAT, false, STRIDE, k * 16)
            gl.vertexAttribDivisor(4 + k, 1)
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vb.idx)
        // same mesh, instances in back-to-front order for the see-through glass pass
        const vaoRev = gl.createVertexArray()!
        const instRev = gl.createBuffer()!
        gl.bindVertexArray(vaoRev)
        bindAttr(vb.pos, 0, 3); bindAttr(vb.nor, 1, 3); bindAttr(vb.uv, 2, 2); bindAttr(vb.part, 3, 1)
        gl.bindBuffer(gl.ARRAY_BUFFER, instRev)
        for (let k = 0; k < 5; k++) {
            gl.enableVertexAttribArray(4 + k)
            gl.vertexAttribPointer(4 + k, 4, gl.FLOAT, false, STRIDE, k * 16)
            gl.vertexAttribDivisor(4 + k, 1)
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vb.idx)
        gl.bindVertexArray(null)
        const fsVao = gl.createVertexArray()!

        const tex = gl.createTexture()!
        // shadow map
        const SH = 1024
        const shadowTex = gl.createTexture()!
        gl.bindTexture(gl.TEXTURE_2D, shadowTex)
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SH, SH)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL)
        const shadowFbo = gl.createFramebuffer()!
        gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        // Render targets are sized once per canvas size. The adaptive resolution only changes
        // the viewport inside them, so it never reallocates (no hitches).
        const rt: any = { w: 0, h: 0 }
        const makeTex = (w: number, h: number) => {
            const t = gl.createTexture()!
            gl.bindTexture(gl.TEXTURE_2D, t)
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            const f = gl.createFramebuffer()!
            gl.bindFramebuffer(gl.FRAMEBUFFER, f)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
            return { t, f }
        }
        const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 1)
        const setupTargets = (w: number, h: number) => {
            if (rt.w === w && rt.h === h) return
            if (rt.w) {
                gl.deleteRenderbuffer(rt.msColor); gl.deleteRenderbuffer(rt.msDepth); gl.deleteFramebuffer(rt.msFbo); gl.deleteRenderbuffer(rt.depth)
                gl.deleteTexture(rt.scene.t); gl.deleteFramebuffer(rt.scene.f); gl.deleteTexture(rt.dof.t); gl.deleteFramebuffer(rt.dof.f)
            }
            rt.w = w; rt.h = h
            rt.dw = Math.max(1, Math.ceil(w / 2)); rt.dh = Math.max(1, Math.ceil(h / 2))
            rt.msFbo = gl.createFramebuffer()
            gl.bindFramebuffer(gl.FRAMEBUFFER, rt.msFbo)
            rt.msColor = gl.createRenderbuffer()
            gl.bindRenderbuffer(gl.RENDERBUFFER, rt.msColor)
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, w, h)
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rt.msColor)
            rt.msDepth = gl.createRenderbuffer()
            gl.bindRenderbuffer(gl.RENDERBUFFER, rt.msDepth)
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h)
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rt.msDepth)
            rt.scene = makeTex(w, h)
            // plain depth so the scene can also be drawn without MSAA
            rt.depth = gl.createRenderbuffer()
            gl.bindRenderbuffer(gl.RENDERBUFFER, rt.depth)
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h)
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rt.depth)
            rt.dof = makeTex(rt.dw, rt.dh)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        }

        const g: any = { tier: 1, dprMax: 1.5, ft: 1 / 60, dts: 1 / 60, slowT: 0, fastT: 0, instCap: 0, gl, tex, layers: 0, backLayer: -1, geoKey: "", idxCount: 0, data: new Float32Array(0), sorted: new Float32Array(0), rev: new Float32Array(0), order: [] as number[], zs: new Float64Array(0), centerK: null as null | number, aniso: gl.getExtension("EXT_texture_filter_anisotropic") }
        gfx.current = g
        const s = live.current
        const test = typeof window !== "undefined" ? (window as any).__cardRibbonTest : null

        const resize = () => {
            const dpr = Math.min(g.dprMax || 1.5, window.devicePixelRatio || 1)
            const r = canvas.getBoundingClientRect()
            const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            g.cssW = Math.max(1, r.width)
            g.cssH = Math.max(1, r.height)
        }
        resize()
        const ro = new ResizeObserver(() => {
            resize()
            if (isCanvas && g.requestDraw) g.requestDraw()
        })
        ro.observe(canvas)

        // ---- camera timeline ----
        type Pose = { d: V3; dist: number; roll: number; shift: number; pan: [number, number]; zoom: number }
        const blend = (a: Shot, b: Shot, m: number): Pose => ({
            d: nrm([lerp(a.d[0], b.d[0], m), lerp(a.d[1], b.d[1], m), lerp(a.d[2], b.d[2], m)]),
            dist: lerp(a.dist, b.dist, m), roll: lerp(a.roll, b.roll, m), shift: lerp(a.shift, b.shift, m), pan: [0, 0], zoom: 1,
        })
        const entryTime = (q: Props) => Math.max(0.3, q.whipTime)
        const shotAt = (q: Props, lay: Layout, time: number): Pose => {
            const list = (test && test.shots && test.shots[lay]) || SHOTS[lay]
            const L = list.length
            if (q.cameraMode === "fixed") {
                g.shotIdx = Math.max(0, Math.min(L - 1, Number(q.fixedShot) - 1 || 0))
                const a = list[Math.max(0, Math.min(L - 1, Number(q.fixedShot) - 1 || 0))]
                const c = blend(a, a, 0)
                c.roll += Math.sin(time * 0.35) * 2.5
                return c
            }
            if (q.cameraMode === "scroll") {
                const f = Math.min(0.9999, Math.max(0, s.prog || 0)) * (L - 1)
                const k = Math.floor(f)
                return blend(list[k], list[k + 1], 0.5 - Math.cos((f - k) * Math.PI) / 2)
            }
            // cinematic: each shot sweeps in from a side of the screen, brakes, drifts, then whips out
            const E = entryTime(q), X = 0.32
            const durs = list.map((sh) => E + sh.hold * q.shotLength + X)
            const total = durs.reduce((a, b) => a + b, 0)
            const cycleIdx = Math.floor(time / total)
            let t = time - cycleIdx * total
            let k = 0
            while (k < L - 1 && t > durs[k]) {
                t -= durs[k]
                k++
            }
            const sh = list[k]
            g.shotIdx = k
            const hold = sh.hold * q.shotLength
            const c = blend(sh, sh, 0)
            const G = cycleIdx * L + k
            const sign = G % 2 === 0 ? 1 : -1
            const lap = lay === "fan" ? 0 : list[L - 1].shift + 10
            c.shift += cycleIdx * lap
            const e = t < E ? Math.pow(1 - t / E, 3.2) : 0
            const ht = Math.max(0, t - E)
            const x = ht > hold ? Math.pow(Math.min(1, (ht - hold) / X), 2.4) : 0
            const spin = q.whipSpin
            // entry: starts close and offset, travels along the strand, unrolls the spin
            // (a long-lens zoom: one card fills a corner, then the lens widens as the strand sweeps in)
            c.shift -= e * (lay === "fan" ? 3 : 6) * sign
            c.zoom = 1 - 0.62 * e
            c.dist *= 1 + 0.15 * e
            c.roll += e * spin * 0.7 * sign
            // hold: slow roll drift and a gentle push in
            c.roll += Math.min(ht, hold + X) * 1.8 * sign
            c.dist *= 1 - 0.035 * Math.min(1, ht / Math.max(0.1, hold))
            // exit: accelerating whip toward where the next shot comes from
            const nx = list[(k + 1) % L].enter
            c.roll -= x * spin * sign
            c.shift += x * (lay === "fan" ? 2 : 5) * sign
            c.zoom *= 1 - 0.3 * x
            c.pan = [sh.enter[0] * e - nx[0] * x * 1.3, sh.enter[1] * e - nx[1] * x * 1.3]
            return c
        }

        const draw = (dtIn: number) => {
            const q = propsRef.current
            if (!g.layers) return
            const dt = dtIn
            resize()
            if (g.mipDirty) {
                gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex)
                gl.generateMipmap(gl.TEXTURE_2D_ARRAY)
                g.mipDirty = false
            }
            const tier = isCanvas ? 1 : q.quality === "high" ? 0 : q.quality === "balanced" ? 1 : q.quality === "fast" ? 3 : g.tier
            const Q = TIERS[tier]
            g.dprMax = Q.dpr
            const rs = Q.rs
            const W = q.cardWidth, H = q.cardHeight, T = Math.max(0.5, q.thickness)
            const R = Math.min(q.cornerRadius, W / 2 - 1, H / 2 - 1)
            const geoKey = `${W}|${H}|${R}|${T}`
            if (geoKey !== g.geoKey) {
                const m = buildCard(W, H, R, T)
                gl.bindVertexArray(vao)
                gl.bindBuffer(gl.ARRAY_BUFFER, vb.pos); gl.bufferData(gl.ARRAY_BUFFER, m.pos, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, vb.nor); gl.bufferData(gl.ARRAY_BUFFER, m.nor, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, vb.uv); gl.bufferData(gl.ARRAY_BUFFER, m.uv, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, vb.part); gl.bufferData(gl.ARRAY_BUFFER, m.part, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vb.idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW)
                gl.bindVertexArray(vaoRev)
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vb.idx)
                g.idxCount = m.idx.length
                g.geoKey = geoKey
            }

            // ---- layout ----
            const lay: Layout = q.layout === "arc" ? "fan" : (q.layout as Layout)
            const Rin = Math.max(60, q.radius)
            const deg = Math.PI / 180
            let n = Math.max(20, Math.round(q.count))
            let gap = Math.max(T + 0.5, q.spacing)
            if (lay === "row") gap = Math.max(T + 0.5, q.spacing * 1.2, W * 0.24)
            if (lay === "wave") gap = Math.max(T + 0.5, q.spacing, W * 0.22)
            const Rf = Math.max(Rin * 1.8, H * 2.4)
            if (lay === "fan") {
                gap = Math.max(T + 0.5, q.spacing * 2, W * 0.42)
                n = Math.max(8, Math.min(n, Math.floor((Math.PI * 2 * Rf) / gap)))
                gap = (Math.PI * 2 * Rf) / n
            }
            const rise = (H * 5 + W) / (Math.PI * 2) // a stretched spring: other turns stay out of the shot
            const waveL = Rin * 0.55, waveA = Rin * 0.6
            const wavePhase = s.clock * 1.1 * (q.flowDirection === "reverse" ? -1 : 1) + (q.scrollMode !== "none" ? s.scrollPhase * 0.35 : 0)
            const UP: V3 = [0, 1, 0]
            // path: P = where card bottoms sit, T = direction of travel, R = card "up" before lean
            const frameAt = (s0: number): [V3, V3, V3] => {
                if (lay === "row") return [[s0, 0, 0], [1, 0, 0], UP]
                if (lay === "wave") {
                    // a ripple that keeps rolling down the strand (and rolls faster when you scroll),
                    // so the cards swing through the wave instead of sliding along a frozen path
                    const ph = s0 / waveL - wavePhase
                    const ph2 = ph * 0.5 + wavePhase * 0.45
                    return [[s0, waveA * 0.22 * Math.cos(ph2), waveA * Math.sin(ph)], nrm([1, -(waveA * 0.11 / waveL) * Math.sin(ph2), (waveA / waveL) * Math.cos(ph)]), UP]
                }
                if (lay === "fan") {
                    const th = s0 / Rf + Math.PI / 2
                    return [[Rf * Math.cos(th), 0, Rf * Math.sin(th)], [-Math.sin(th), 0, Math.cos(th)], UP]
                }
                const th = s0 / Rin
                return [[Rin * Math.cos(th), rise * th, Rin * Math.sin(th)], nrm([-Rin * Math.sin(th), rise, Rin * Math.cos(th)]), [Math.cos(th), 0, Math.sin(th)]]
            }
            // card orientation for each layout: returns [Y (card up), Z (face normal)]
            const leanBase = q.lean * deg
            const cardFrame = (tg: V3, r: V3): [V3, V3] => {
                if (lay === "spiral") {
                    // spiral staircase: cards stick out radially and are tipped toward the axis
                    const A = nrm(cross(tg, r))
                    return [r, nrm(add(scl(tg, Math.cos(leanBase)), scl(A, Math.sin(leanBase))))]
                }
                if (lay === "fan") {
                    // standing around a ring, facing its centre, tops tipped slightly outward
                    // turned 42 degrees like a hand of cards so neighbours overlap without touching
                    const inward: V3 = nrm(cross(tg, r))
                    const turn = 42 * deg
                    const face = nrm(add(scl(inward, Math.cos(turn)), scl(tg, Math.sin(turn))))
                    const lf = leanBase * 0.12
                    return [nrm(add(scl(r, Math.cos(lf)), scl(inward, -Math.sin(lf)))), nrm(add(scl(face, Math.cos(lf)), scl(r, Math.sin(lf))))]
                }
                // row and wave: upright cards leaning along the line like dominoes
                // (the wave leans back so its faces tip up toward the camera, like the payment-card reference)
                const la = leanBase * (lay === "row" ? 0.3 : -0.65)
                return [nrm(add(scl(r, Math.cos(la)), scl(tg, Math.sin(la)))), nrm(add(scl(tg, Math.cos(la)), scl(r, -Math.sin(la))))]
            }

            const dir = q.flowDirection === "reverse" ? -1 : 1
            const travelCards = s.travel + (q.scrollMode === "flow" ? s.scrollPhase : 0)
            const shot = shotAt(q, lay, s.t)
            if (hudRef.current) {
                const txt = `${LAYOUT_NAMES[lay]}  ·  SHOT ${String((g.shotIdx || 0) + 1).padStart(2, "0")}/${String(SHOTS[lay].length).padStart(2, "0")}  ·  ${q.cameraMode === "fixed" ? "FIXED" : q.cameraMode === "scroll" ? "SCROLL" : "CINEMATIC"}`
                if (hudRef.current.textContent !== txt) hudRef.current.textContent = txt
            }
            // the fan keeps the camera still and turns the ring; everything else flies along the strand
            const camTravel = lay === "fan" ? 0 : travelCards
            const cardOffset = lay === "fan" ? travelCards : 0
            const sC = (camTravel + shot.shift) * gap
            // Strand Axis turns the whole composition on screen (rotating the scene and camera together
            // would change nothing you can see)
            const axisTilt = 0
            const axisRoll = q.pathAxis === "horizontal" ? -Math.PI / 2 : q.pathAxis === "diagonal" ? -0.62 : 0
            const toW = (v: V3): V3 => v

            // ---- camera ----
            let Pc: V3, eT: V3, eR: V3
            if (lay === "row" || lay === "wave") {
                Pc = [sC, 0, 0]; eT = [1, 0, 0]; eR = UP
            } else [Pc, eT, eR] = frameAt(sC)
            const eA = nrm(cross(eT, eR))
            const tgtL = add(Pc, scl(eR, H * 0.5))
            let dl = add(add(scl(eR, shot.d[0]), scl(eA, shot.d[1])), scl(eT, shot.d[2]))
            const spinS = q.scrollMode === "spin" ? s.scrollPhase * 0.6 : 0
            dl = rotAxis(dl, eR, s.dragYaw * 0.017 + spinS)
            dl = rotAxis(dl, nrm(cross(dl, eR)), s.dragPitch * 0.017)
            const unit = lay === "fan" ? Rf : H
            // tall screens see a much narrower slice, so pull back until a phone shows most of the desktop width
            const portrait = Math.pow(Math.max(1, 1.5 / Math.max(0.2, g.cssW / g.cssH)), 0.6)
            const dist = shot.dist * unit * (2 - q.closeness) * portrait
            let target = toW(tgtL)
            let eye = toW(add(tgtL, scl(nrm(dl), dist)))
            let fwd = nrm([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]])
            let up = rotAxis(toW(eR), fwd, (shot.roll * Math.PI) / 180)
            // screen-space pan for entries and exits
            const fov = 2 * Math.atan(Math.tan((36 * Math.PI) / 360) * shot.zoom)
            if (shot.pan[0] || shot.pan[1]) {
                const right = nrm(cross(fwd, up)), cu = nrm(cross(right, fwd))
                const span = dist * Math.tan(fov / 2) * 1.15
                const off = add(scl(right, -shot.pan[0] * span), scl(cu, -shot.pan[1] * span))
                target = add(target, off)
                eye = add(eye, off)
            }
            fwd = nrm([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]])
            up = nrm(add(up, scl(fwd, -dot(up, fwd))))
            if (axisRoll) up = rotAxis(up, fwd, axisRoll)
            const view = lookAt(eye, target, up)
            const aspect = g.cssW / g.cssH
            const near = 4, far = 12000
            const proj = perspective(fov, aspect, near, far)
            const vp = mul(proj, view)

            // ---- instances ----
            const STR = 20
            if (g.data.length !== n * STR) {
                g.data = new Float32Array(n * STR)
                g.sorted = new Float32Array(n * STR)
                g.zs = new Float64Array(n)
                g.kIds = new Float64Array(n)
                g.order = Array.from({ length: n }, (_, i) => i)
                g.cmp = (a: number, b: number) => g.zs[b] - g.zs[a]
            }
            const D = g.data
            const kc = sC / gap + cardOffset
            const nItems = Math.max(1, g.layers - 1)
            const camW: V3 = eye
            // a featured card rises out of the line every few seconds (the one nearest the middle of the frame)
            if (q.autoFeature) {
                if (isCanvas) {
                    s.autoK = g.centerK
                    s.hoverAmt.clear()
                    if (s.autoK !== null) s.hoverAmt.set(s.autoK, 1)
                } else if (s.hoverK === null && !s.mouse) {
                    s.autoT += dt
                    const every = Math.max(2, q.featureEvery)
                    if (s.autoK === null && s.autoT > every) {
                        s.autoK = g.centerK
                        s.autoT = 0
                    } else if (s.autoK !== null && s.autoT > Math.min(2.6, every * 0.6)) {
                        s.autoK = null
                        s.autoT = 0
                    }
                } else {
                    // someone is pointing at the cards: drop the featured card and restart the wait
                    s.autoK = null
                    s.autoT = 0
                }
            } else s.autoK = null
            const hk = s.hoverK !== null ? s.hoverK : s.autoK
            const hAmtK = hk !== null ? s.hoverAmt.get(hk) || 0 : 0
            const lift = q.hoverLift
            let hoverFocus = 0
            for (let i = 0; i < n; i++) {
                const k = i + n * Math.round((kc - i) / n) // card id near the camera target
                g.kIds[i] = k
                const jit = hash(k) - 0.5, jit2 = hash(k + 91.7) - 0.5
                const [Pk, tg, r] = frameAt((k - cardOffset) * gap)
                let bottom = add(Pk, scl(r, H * 0.03 * jit2))
                let [Y, Z] = cardFrame(tg, r)
                // slight per-card tilt so the line never looks machined
                const tilt = jit * 0.06, yawJ = jit2 * 0.05
                const ax = nrm(cross(Y, Z))
                Y = rotAxis(Y, ax, tilt)
                Z = rotAxis(Z, ax, tilt)
                Z = rotAxis(Z, Y, yawJ)
                // each card pivots on its base, in its own plane, with a ripple running through the line:
                // tops spread and gather like a fanned hand of cards (in-plane, so neighbours never collide)
                const mo = lay === "wave" ? q.cardMotion : 0
                if (mo > 0) {
                    const sway = mo * (0.15 * Math.sin(k * 0.21 - s.clock * 1.5) + 0.06 * Math.sin(k * 0.07 + s.clock * 0.6 + jit * 3))
                    Y = rotAxis(Y, Z, sway)
                    Z = rotAxis(Z, Y, mo * 0.035 * Math.sin(k * 0.33 - s.clock * 2.1))
                }
                let X = nrm(cross(Y, Z))
                // neighbours of the featured or hovered card part to make room
                if (hk !== null && hAmtK > 0.001) {
                    const dk = k - hk
                    if (dk !== 0 && Math.abs(dk) <= 4) bottom = add(bottom, scl(tg, Math.sign(dk) * (5 - Math.abs(dk)) * gap * 0.22 * hAmtK * lift))
                }
                // grow in/out at the far ends of an open strand (always off screen)
                const edge = lay === "fan" ? 1 : Math.min(1, Math.abs(k - kc + n / 2) / 6, Math.abs(kc + n / 2 - k) / 6)
                const sc = Math.max(0.001, edge)
                let C = add(bottom, scl(Y, (H / 2) * sc))
                const a = s.hoverAmt.get(k) || 0
                if (a > 0.001) {
                    // featured or hovered card: rises straight up out of the line, nothing else
                    const e = a * a * (3 - 2 * a)
                    C = add(C, scl(Y, H * 0.34 * e * lift))
                }
                const Xw = toW(scl(X, sc)), Yw = toW(scl(Y, sc)), Zw = toW(scl(Z, sc)), Cw = toW(C)
                if (k === hk) hoverFocus = Math.hypot(Cw[0] - camW[0], Cw[1] - camW[1], Cw[2] - camW[2])
                mulCols(D, i * STR, view, Xw, Yw, Zw, Cw)
                const o = i * STR + 16
                D[o] = ((k % nItems) + nItems) % nItems
                D[o + 1] = 0; D[o + 2] = 0; D[o + 3] = 0
            }

            // ---- cull + sort front to back (cuts overdraw a lot), find the card in the middle ----
            const th2 = Math.tan(fov / 2)
            const bound = Math.hypot(W, H) * 0.55 + H * 0.4
            let nVis = 0
            let bestC = Infinity, centerK: null | number = null
            const order = g.order as number[]
            let lo = 0, hi = n - 1
            for (let i = 0; i < n; i++) {
                const o = i * STR
                const x = D[o + 12], y = D[o + 13], z = D[o + 14]
                const dz = -z
                const vis = dz > near - bound && Math.abs(x) < dz * th2 * aspect + bound * 1.3 && Math.abs(y) < dz * th2 + bound * 1.3
                g.zs[i] = z
                if (vis) {
                    order[lo++] = i
                    if (dz > near * 4) {
                        const sx = x / (dz * th2 * aspect), sy = y / (dz * th2)
                        const score = Math.hypot(sx, sy * 1.2) + Math.max(0, dz / dist - 1.2) * 0.6
                        if (score < bestC) {
                            bestC = score
                            centerK = g.kIds[i]
                        }
                    }
                } else order[hi--] = i
            }
            nVis = lo
            const visList = order.slice(0, nVis).sort(g.cmp)
            for (let j = 0; j < nVis; j++) order[j] = visList[j]
            const Ds = g.sorted
            for (let j = 0; j < n; j++) {
                const src = order[j] * STR, dst = j * STR
                for (let c = 0; c < STR; c++) Ds[dst + c] = D[src + c]
            }
            if (g.rev.length !== Ds.length) g.rev = new Float32Array(Ds.length)
            for (let j = 0; j < nVis; j++) {
                const src = (nVis - 1 - j) * STR, dst = j * STR
                for (let c = 0; c < STR; c++) g.rev[dst + c] = Ds[src + c]
            }
            const prevCenter = g.centerK
            g.centerK = bestC < 0.6 ? centerK : null
            if (isCanvas && q.autoFeature && g.centerK !== prevCenter && (g.centerRedraws || 0) < 3) {
                g.centerRedraws = (g.centerRedraws || 0) + 1
                g.requestDraw()
            }

            // ---- hover picking: ray from the cursor against every card ----
            let picked: null | number = null
            if (q.hoverEffect && s.mouse && !s.dragging && !isCanvas) {
                const rd = nrm([s.mouse[0] * th2 * aspect, s.mouse[1] * th2, -1])
                let best = Infinity, bl: [number, number] = [0, 0]
                let keep = false
                for (let i = 0; i < n; i++) {
                    const o = i * STR
                    const Xc: V3 = [D[o], D[o + 1], D[o + 2]], Yc: V3 = [D[o + 4], D[o + 5], D[o + 6]], Zc: V3 = [D[o + 8], D[o + 9], D[o + 10]]
                    const Cc: V3 = [D[o + 12], D[o + 13], D[o + 14]]
                    const den = dot(rd, Zc)
                    if (Math.abs(den) < 1e-5) continue
                    const t = dot(Cc, Zc) / den
                    if (t <= 0 || t >= best) continue
                    const pc: V3 = [rd[0] * t - Cc[0], rd[1] * t - Cc[1], rd[2] * t - Cc[2]]
                    const lx = dot(pc, Xc) / dot(Xc, Xc), ly = dot(pc, Yc) / dot(Yc, Yc)
                    // the card already pulled out keeps the hover while the cursor stays near it (no flicker)
                    const isCur = g.kIds[i] === s.hoverK
                    const pad = isCur ? 1.15 : 1
                    if (Math.abs(lx) <= (W / 2) * pad && Math.abs(ly) <= (H / 2) * pad) {
                        if (isCur) keep = true
                        best = t
                        picked = g.kIds[i]
                        bl = [lx / (W / 2), ly / (H / 2)]
                    }
                }
                if (keep && picked !== s.hoverK) picked = s.hoverK
                if (picked !== null) s.hoverLocal = [lerp(s.hoverLocal[0], bl[0], 0.25), lerp(s.hoverLocal[1], bl[1], 0.25)]
            }
            if (picked !== s.hoverK) {
                s.hoverK = picked
                if (wrapRef.current) wrapRef.current.style.cursor = picked !== null ? "pointer" : q.draggable ? "grab" : "default"
            }
            const active = s.hoverK !== null ? s.hoverK : s.autoK
            if (active !== null && !s.hoverAmt.has(active)) s.hoverAmt.set(active, 0)
            if (!isCanvas)
                s.hoverAmt.forEach((v, key) => {
                    const tgt = key === active ? 1 : 0
                    const nv = v + (tgt - v) * Math.min(1, dt * (s.hoverK !== null ? 7 : 3.5))
                    if (tgt === 0 && nv < 0.002) s.hoverAmt.delete(key)
                    else s.hoverAmt.set(key, nv)
                })

            // focus follows the camera target, or the featured / hovered card
            const focusDist = hoverFocus > 0 ? lerp(dist, hoverFocus, Math.min(1, Math.max(s.hoverMix * 1.2, hAmtK))) : dist
            s.focus = s.focus && dt > 0 ? lerp(s.focus, focusDist, Math.min(1, dt * 6)) : focusDist
            // reprojection for motion blur: current view -> previous frame's clip space
            const invView = new Float32Array([view[0], view[4], view[8], 0, view[1], view[5], view[9], 0, view[2], view[6], view[10], 0, eye[0], eye[1], eye[2], 1])
            const reproj = s.prevVP ? mul(s.prevVP, invView) : mul(vp, invView)
            const mbAmt = s.prevVP && dt > 0 && q.motionBlur > 0 ? 0.5 * q.motionBlur * Math.min(1.5, 1 / 60 / Math.max(dt, 1 / 240)) : 0
            s.prevVP = vp

            // ---- lights (view space, studio rig attached to the camera) ----
            const key = nrm([-0.55, 0.62, 0.55])
            const fill = nrm([0.7, -0.1, 0.5])
            const rimD = nrm([0.25, 0.4, -0.88])
            const tV = xfP(view, target)
            const lightEye: V3 = add(tV, scl(key, 5000))
            const lv = lookAt(lightEye, tV, Math.abs(key[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0])
            const ext = dist * 0.9 + H * 2.5
            const lightVP = mul(ortho(-ext, ext, -ext, ext, 100, 10000), lv)

            gl.bindVertexArray(vao)
            gl.bindBuffer(gl.ARRAY_BUFFER, vb.inst)
            if (g.instCap !== Ds.length) {
                gl.bufferData(gl.ARRAY_BUFFER, Ds, gl.DYNAMIC_DRAW)
                g.instCap = Ds.length
            } else gl.bufferSubData(gl.ARRAY_BUFFER, 0, Ds)
            gl.disable(gl.BLEND)
            gl.disable(gl.CULL_FACE)
            // ---- shadow pass ----
            if (Q.shadow) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFbo)
                gl.viewport(0, 0, SH, SH)
                gl.clear(gl.DEPTH_BUFFER_BIT)
                gl.enable(gl.DEPTH_TEST)
                gl.depthMask(true)
                gl.enable(gl.POLYGON_OFFSET_FILL)
                gl.polygonOffset(2, 4)
                gl.useProgram(progShadow)
                gl.uniformMatrix4fv(uShadow.uLightVP, false, lightVP)
                gl.drawElementsInstanced(gl.TRIANGLES, g.idxCount, gl.UNSIGNED_SHORT, 0, n)
                gl.disable(gl.POLYGON_OFFSET_FILL)
            }

            // ---- scene pass ----
            const cw = canvas.width, ch = canvas.height
            setupTargets(cw, ch)
            const w = Math.max(2, Math.round(cw * rs)), h = Math.max(2, Math.round(ch * rs))
            const msaa = Q.msaa && samples > 1
            gl.bindFramebuffer(gl.FRAMEBUFFER, msaa ? rt.msFbo : rt.scene.f)
            gl.viewport(0, 0, w, h)
            gl.disable(gl.DEPTH_TEST)
            gl.useProgram(progBg)
            gl.bindVertexArray(fsVao)
            gl.uniform3fv(uBg.uBg, toRGB(q.background, [0.012, 0.012, 0.018]))
            gl.uniform2f(uBg.uRes, w, h)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
            gl.clear(gl.DEPTH_BUFFER_BIT)
            gl.enable(gl.DEPTH_TEST)
            gl.depthMask(true)
            if (nVis > 0) {
                gl.useProgram(progCard)
                gl.bindVertexArray(vao)
                gl.uniformMatrix4fv(uCard.uProj, false, proj)
                gl.uniformMatrix4fv(uCard.uLightVP, false, lightVP)
                gl.uniform2f(uCard.uSize, W, H)
                gl.uniform1f(uCard.uRadius, R)
                gl.uniform1f(uCard.uMargin, Math.max(2.5, W * 0.045))
                gl.uniform1f(uCard.uBackLayer, q.cardBack === "design" ? g.backLayer : -1)
                gl.uniform3fv(uCard.uKey, key)
                gl.uniform3fv(uCard.uFill, fill)
                gl.uniform3fv(uCard.uRimDir, rimD)
                const rc = toRGB(q.rimLight, [0.45, 0.85, 1])
                gl.uniform3f(uCard.uRimCol, rc[0] * 1.3, rc[1] * 1.3, rc[2] * 1.3)
                gl.uniform1f(uCard.uExposure, 0.7 + q.lighting * 0.9)
                gl.uniform1f(uCard.uDepthScale, 8000)
                gl.uniform2f(uCard.uShadowTexel, 1 / SH, 1 / SH)
                gl.uniform1i(uCard.uPcf, Q.pcf)
                gl.uniform1f(uCard.uShadowOn, Q.shadow)
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex)
                gl.uniform1i(uCard.uTex, 0)
                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, shadowTex)
                gl.uniform1i(uCard.uShadow, 1)
                // pass 1: printed faces, front to back, writing depth
                gl.uniform1f(uCard.uPass, 0)
                gl.drawElementsInstanced(gl.TRIANGLES, g.idxCount, gl.UNSIGNED_SHORT, 0, nVis)
                // pass 2: clear acrylic frames and edges, back to front, blended over what is behind
                gl.bindVertexArray(vaoRev)
                gl.bindBuffer(gl.ARRAY_BUFFER, instRev)
                if (g.revCap !== g.rev.length) {
                    gl.bufferData(gl.ARRAY_BUFFER, g.rev, gl.DYNAMIC_DRAW)
                    g.revCap = g.rev.length
                } else gl.bufferSubData(gl.ARRAY_BUFFER, 0, g.rev, 0, nVis * STR)
                gl.uniform1f(uCard.uPass, 1)
                gl.depthMask(false)
                gl.enable(gl.BLEND)
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE)
                gl.drawElementsInstanced(gl.TRIANGLES, g.idxCount, gl.UNSIGNED_SHORT, 0, nVis)
                gl.disable(gl.BLEND)
                // pass 3: write the frames' depth into the alpha channel (used by focus and motion blur)
                gl.colorMask(false, false, false, true)
                gl.uniform1f(uCard.uPass, 2)
                gl.drawElementsInstanced(gl.TRIANGLES, g.idxCount, gl.UNSIGNED_SHORT, 0, nVis)
                gl.colorMask(true, true, true, true)
                gl.depthMask(true)
                gl.bindVertexArray(vao)
                gl.activeTexture(gl.TEXTURE0)
            }
            if (msaa) {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rt.msFbo)
                gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rt.scene.f)
                gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST)
            }

            const sScale: [number, number] = [w / cw, h / ch]
            const pxs = h / 760
            const aperture = 26 * pxs * q.depthOfField, maxR = Math.max(1, 22 * pxs * q.depthOfField)
            const dofOn = q.depthOfField > 0.01
            gl.disable(gl.DEPTH_TEST)
            gl.bindVertexArray(fsVao)
            // ---- depth of field (half resolution) ----
            const dw = Math.max(1, Math.ceil(w / 2)), dh = Math.max(1, Math.ceil(h / 2))
            if (dofOn) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, rt.dof.f)
                gl.viewport(0, 0, dw, dh)
                gl.useProgram(progDof)
                gl.bindTexture(gl.TEXTURE_2D, rt.scene.t)
                gl.uniform1i(uDof.uScene, 0)
                gl.uniform2f(uDof.uTexel, 1 / cw, 1 / ch)
                gl.uniform2f(uDof.uScale, sScale[0], sScale[1])
                gl.uniform1f(uDof.uFocus, s.focus / 8000)
                gl.uniform1f(uDof.uAperture, aperture)
                gl.uniform1f(uDof.uMaxR, maxR)
                gl.uniform1i(uDof.uTaps, Q.taps)
                gl.drawArrays(gl.TRIANGLES, 0, 3)
            }

            // ---- composite: depth of field mix + motion blur + finish ----
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0, 0, cw, ch)
            gl.useProgram(progPost)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, rt.scene.t)
            gl.uniform1i(uPost.uScene, 0)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, rt.dof.t)
            gl.uniform1i(uPost.uDof, 1)
            gl.activeTexture(gl.TEXTURE0)
            gl.uniform2f(uPost.uScale, sScale[0], sScale[1])
            gl.uniform2f(uPost.uDScale, dw / rt.dw, dh / rt.dh)
            gl.uniform2f(uPost.uSTexel, 0.5 / cw, 0.5 / ch)
            gl.uniform2f(uPost.uDTexel, 0.5 / rt.dw, 0.5 / rt.dh)
            gl.uniform1f(uPost.uFocus, s.focus / 8000)
            gl.uniform1f(uPost.uAperture, aperture)
            gl.uniform1f(uPost.uMaxR, maxR)
            gl.uniform1f(uPost.uDofOn, dofOn ? 1 : 0)
            gl.uniformMatrix4fv(uPost.uReproj, false, reproj)
            gl.uniform2f(uPost.uTan, th2 * aspect, th2)
            gl.uniform1f(uPost.uMb, mbAmt)
            gl.uniform2f(uPost.uRes, cw, ch)
            gl.uniform1f(uPost.uTime, s.t)
            gl.uniform1f(uPost.uDepthScale, 8000)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }
        g.draw = draw
        g.requestDraw = () => {
            if (g.pending) return
            g.pending = true
            requestAnimationFrame(() => {
                g.pending = false
                if (gfx.current !== g) return
                if (isCanvas) {
                    const q = propsRef.current
                    s.t = test && typeof test.t === "number" ? test.t : entryTime(q) + 0.8
                }
                draw(0)
            })
        }
        if (test) test.redraw = () => {
            g.centerRedraws = 0
            g.requestDraw()
        }

        const readProgress = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight
            return max > 0 ? window.scrollY / max : 0
        }

        if (isCanvas) {
            return () => {
                ro.disconnect()
                gfx.current = null
            }
        }

        s.progTarget = readProgress()
        s.prog = s.progTarget
        let lastY = window.scrollY
        const onScroll = () => {
            const q = propsRef.current
            const dir = q.flowDirection === "reverse" ? -1 : 1
            const dy = window.scrollY - lastY
            lastY = window.scrollY
            s.progTarget = readProgress()
            if (q.scrollMode !== "none") s.scrollTarget += dy * 0.02 * q.scrollBoost * dir
        }
        window.addEventListener("scroll", onScroll, { passive: true })

        let raf = 0
        let prev = performance.now()
        let visible = true
        const io = new IntersectionObserver((en) => {
            visible = en.some((x) => x.isIntersecting)
        })
        io.observe(canvas)
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop)
            const q = propsRef.current
            const raw = Math.max(0, (now - prev) / 1000)
            prev = now
            if (!visible || (test && test.manual)) return
            // smoothed time step: vsync jitter no longer shows up as uneven motion
            g.dts += (Math.min(raw, 1 / 20) - g.dts) * 0.2
            const dt = g.dts
            // auto quality: step down a tier when frames run long, back up when there is headroom
            if (q.quality === "auto") {
                g.ft = g.ft * 0.9 + Math.min(0.2, raw) * 0.1
                if (g.ft > 1 / 50) { g.slowT += raw; g.fastT = 0 }
                else if (g.ft < 1 / 58) { g.fastT += raw; g.slowT = 0 }
                else { g.slowT = 0; g.fastT = 0 }
                if (g.slowT > 1.5 && g.tier < TIERS.length - 1) { g.tier++; g.slowT = 0; g.ft = 1 / 60 }
                if (g.fastT > 5 && g.tier > 0) { g.tier--; g.fastT = 0 }
            }
            step(q, dt)
        }
        const step = (q: Props, dt: number) => {
            const dir = q.flowDirection === "reverse" ? -1 : 1
            s.hoverMix += ((s.hoverK !== null ? 1 : 0) - s.hoverMix) * Math.min(1, dt * 4)
            const slow = 1 - 0.9 * s.hoverMix
            s.t += dt * slow
            s.clock += dt * slow
            s.travel += q.flowSpeed * 6 * dir * dt * slow
            s.scrollPhase += (s.scrollTarget - s.scrollPhase) * Math.min(1, dt * 5)
            s.prog += (s.progTarget - s.prog) * Math.min(1, dt * 4)
            if (!s.dragging) {
                s.dragYaw += s.vYaw * dt
                s.dragPitch += s.vPitch * dt
                s.vYaw *= Math.pow(0.04, dt)
                s.vPitch *= Math.pow(0.04, dt)
                s.dragYaw *= Math.pow(0.6, dt)
                s.dragPitch *= Math.pow(0.4, dt)
            }
            draw(dt)
        }
        if (test) test.advance = (frames: number, fdt: number) => {
            for (let i = 0; i < frames; i++) step(propsRef.current, fdt)
        }
        raf = requestAnimationFrame(loop)
        return () => {
            cancelAnimationFrame(raf)
            io.disconnect()
            window.removeEventListener("scroll", onScroll)
            ro.disconnect()
            gfx.current = null
            const lose = gl.getExtension("WEBGL_lose_context")
            if (lose) lose.loseContext()
        }
    }, [isCanvas])

    // ---------- textures ----------
    const texKey = `${items.map((c) => srcOf(c.image) + "|" + c.title + "|" + c.subtitle).join(",")}|${p.cardWidth}|${p.cardHeight}|${p.showLabels}`
    useEffect(() => {
        const g = gfx.current
        if (!g || g.failed) return
        const gl: WebGL2RenderingContext = g.gl
        const TW = Math.min(1024, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 1024)
        const TH = Math.max(64, Math.round((TW * p.cardHeight) / p.cardWidth))
        const layers = items.length + 1
        const c = document.createElement("canvas")
        c.width = TW
        c.height = TH
        const ctx = c.getContext("2d")!
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, g.tex)
        gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, TW, TH, layers, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        if (g.aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, g.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(g.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 8))
        let cancelled = false
        const upload = (layer: number) => {
            if (cancelled || !gfx.current) return
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, g.tex)
            gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, TW, TH, 1, gl.RGBA, gl.UNSIGNED_BYTE, c)
            g.mipDirty = true
            if (isCanvas && g.requestDraw) g.requestDraw()
        }
        const pending: HTMLImageElement[] = []
        const failedSrcs: string[] = []
        const fail = (item: CardItem, i: number, no: string, src: string, why: unknown) => {
            if (cancelled) return
            paintCard(ctx, TW, TH, item, no, null, p.showLabels, true)
            upload(i)
            failedSrcs.push(src)
            setFailedImages(failedSrcs.length)
            console.warn(`CardRibbon3D: card ${i + 1} image failed to load, showing a placeholder instead (${src || "no source"})`, why)
        }
        setFailedImages(0)
        items.forEach((item, i) => {
            const no = String(i + 1).padStart(2, "0")
            paintCard(ctx, TW, TH, item, no, null, p.showLabels)
            upload(i)
            const src = srcOf(item.image)
            if (!src) {
                fail(item, i, no, src, "empty source")
                return
            }
            const img = new Image()
            pending.push(img)
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            img.onload = () => {
                if (cancelled) return
                if (!img.naturalWidth) return fail(item, i, no, src, "image has no size")
                try {
                    paintCard(ctx, TW, TH, item, no, img, p.showLabels)
                    upload(i)
                } catch (e) {
                    // usually a server that does not allow cross-origin use (CORS)
                    fail(item, i, no, src, e)
                }
            }
            img.onerror = (e) => fail(item, i, no, src, e)
            img.src = src
        })
        paintBack(ctx, TW, TH)
        upload(items.length)
        g.layers = layers
        g.backLayer = items.length
        if (isCanvas && g.requestDraw) g.requestDraw()
        return () => {
            cancelled = true
            for (const img of pending) {
                img.onload = null
                img.onerror = null
                img.src = ""
            }
        }
    }, [texKey, isCanvas])

    useEffect(() => {
        if (isCanvas && gfx.current?.requestDraw) {
            gfx.current.centerRedraws = 0
            gfx.current.requestDraw()
        }
    })

    // a drag in progress and the touch timer are both released if the component unmounts
    const dragEnd = useRef<null | (() => void)>(null)
    useEffect(() => () => {
        dragEnd.current?.()
        clearTimeout(live.current.touchTimer)
    }, [])

    const onPointerDown = (e: React.PointerEvent) => {
        if (!p.draggable || isCanvas) return
        dragEnd.current?.()
        const s = live.current
        s.dragging = true
        let lx = e.clientX, ly = e.clientY, lt = performance.now()
        const move = (ev: PointerEvent) => {
            const now = performance.now()
            const dt = Math.max(8, now - lt) / 1000
            const dx = (ev.clientX - lx) * 0.25, dy = (ev.clientY - ly) * 0.2
            s.dragYaw += dx
            s.dragPitch = Math.max(-50, Math.min(50, s.dragPitch - dy))
            s.vYaw = dx / dt
            s.vPitch = -dy / dt
            lx = ev.clientX; ly = ev.clientY; lt = now
        }
        const up = () => {
            s.dragging = false
            dragEnd.current = null
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", up)
        }
        dragEnd.current = up
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        // a vertical swipe hands the touch to page scrolling, which ends in pointercancel
        window.addEventListener("pointercancel", up)
    }

    const setMouse = (e: React.PointerEvent) => {
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        live.current.mouse = [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)]
    }
    const onPointerMove = (e: React.PointerEvent) => {
        if (e.pointerType !== "touch") setMouse(e)
    }
    const onPointerLeave = (e: React.PointerEvent) => {
        if (e.pointerType !== "touch") live.current.mouse = null
    }
    const onPointerUp = (e: React.PointerEvent) => {
        // on touch screens a tap pulls a card out for a moment
        if (e.pointerType === "touch" && p.hoverEffect) {
            setMouse(e)
            clearTimeout(live.current.touchTimer)
            live.current.touchTimer = setTimeout(() => (live.current.mouse = null), 2600)
        }
    }

    return (
        <div
            ref={wrapRef}
            data-failed-images={failedImages || undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onPointerUp={onPointerUp}
            style={{
                ...p.style, position: "relative", width: "100%", height: "100%", overflow: "hidden",
                background: p.background, cursor: p.draggable ? "grab" : "default", touchAction: p.draggable ? "pan-y" : "auto",
                userSelect: "none",
            }}
        >
            {!isCanvas && <canvas ref={canvasRef} role="img" aria-label={`3D gallery of ${items.length} cards`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />}
            {(isCanvas || noGL) && <StaticFallback items={items} p={p} />}
            {p.demoBar && <DemoBar p={p} accent={p.rimLight} hudRef={hudRef} onEnter={() => (live.current.mouse = null)} onPick={(patch) => {
                setDemo((d) => ({ ...d, ...patch }))
                // restart the camera so the new layout or shot plays its entrance
                live.current.t = 0
                live.current.autoK = null
                live.current.autoT = 0
            }} />}
        </div>
    )
}

// ---------- lightweight static fallback: editor canvas, exports, thumbnails, or no WebGL ----------
function StaticFallback(props: { items: CardItem[]; p: Props }) {
    const { items, p } = props
    const shown = Array.from({ length: 9 }, (_, i) => items[i % items.length])
    const mid = (shown.length - 1) / 2
    const w = Math.min(p.cardWidth, 150), h = (w * p.cardHeight) / p.cardWidth
    return (
        <div role="img" aria-label={`Gallery of ${items.length} cards`} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            {shown.map((c, i) => {
                const k = i - mid
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute", width: w, height: h, borderRadius: p.cornerRadius, overflow: "hidden",
                            transform: `translateX(${k * w * 0.42}px) translateY(${Math.abs(k) * 8}px) rotate(${k * 7}deg)`,
                            background: `center / cover no-repeat url("${srcOf(c?.image)}"), linear-gradient(180deg, #3a3a44, #1c1c22)`, border: `${Math.max(2, p.thickness)}px solid rgba(255,255,255,0.18)`,
                            boxShadow: `0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px ${p.rimLight}33`,
                        }}
                    >
                        {p.showLabels && c?.title ? (
                            <div style={{ position: "absolute", left: 6, right: 6, bottom: 6, padding: "4px 6px", borderRadius: 3, background: "rgba(255,255,255,0.92)", color: "#111", fontFamily: "Inter, system-ui, sans-serif", fontSize: 9, fontWeight: 800, letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {c.title}
                            </div>
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

// ---------- demo bar (for Marketplace previews; off by default) ----------
const mono = `"JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
function DemoBar(props: { p: Props; accent: string; hudRef: React.RefObject<HTMLDivElement>; onPick: (patch: Partial<Props>) => void; onEnter: () => void }) {
    const { p, accent, hudRef, onPick, onEnter } = props
    const lay = p.layout === "arc" ? "fan" : p.layout
    const stop = (e: React.PointerEvent) => e.stopPropagation()
    const btn = (label: string, active: boolean, onClick: () => void) => (
        <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={onClick}
            style={{
                fontFamily: mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "8px 12px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
                background: active ? accent : "rgba(255,255,255,0.04)", color: active ? "#0b0b0b" : "rgba(255,255,255,0.82)",
                border: `1px solid ${active ? accent : "rgba(255,255,255,0.12)"}`, transition: "background 0.15s, color 0.15s",
            }}
        >
            {label}
        </button>
    )
    const label = (t: string) => (
        <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: accent, padding: "0 6px 0 4px" }}>{t}</span>
    )
    const fixed = p.cameraMode === "fixed"
    return (
        <>
            <div
                onPointerDown={stop}
                onPointerMove={(e) => {
                    stop(e)
                    onEnter()
                }}
                style={{
                    position: "absolute", left: "50%", bottom: 22, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 6,
                    padding: 6, borderRadius: 10, background: "rgba(8,8,10,0.82)", border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", width: "max-content", maxWidth: "calc(100% - 24px)", flexWrap: "wrap", justifyContent: "center", cursor: "default",
                }}
            >
                {label("LAYOUT")}
                {(["spiral", "row", "wave", "fan"] as Layout[]).map((l) => btn(l === "row" ? "Row" : l === "fan" ? "Fan" : l, lay === l, () => onPick({ layout: l })))}
                {label("CAMERA")}
                {btn("Auto", !fixed, () => onPick({ cameraMode: "cinematic" }))}
                {SHOTS[lay as Layout].map((_, i) => String(i + 1)).map((n) => btn(n, fixed && p.fixedShot === n, () => onPick({ cameraMode: "fixed", fixedShot: n })))}
            </div>
            <div ref={hudRef} style={{ position: "absolute", left: 16, top: 14, fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: accent, opacity: 0.85, pointerEvents: "none" }} />
        </>
    )
}

const defaults = {
    cards: [] as CardItem[],
    count: 150,
    cardWidth: 170,
    cardHeight: 240,
    cornerRadius: 10,
    thickness: 3,
    spacing: 30,
    lean: 55,
    showLabels: true,
    cardBack: "art" as const,
    radius: 340,
    layout: "spiral" as const,
    whipSpin: 70,
    autoFeature: true,
    featureEvery: 4,
    flowSpeed: 0.25,
    flowDirection: "forward" as const,
    pathAxis: "vertical" as const,
    cameraMode: "cinematic" as const,
    fixedShot: "1",
    shotLength: 2.6,
    whipTime: 0.9,
    closeness: 1,
    draggable: true,
    hoverEffect: true,
    hoverLift: 1,
    scrollMode: "flow" as const,
    scrollBoost: 1,
    quality: "auto" as const,
    depthOfField: 1,
    motionBlur: 1,
    lighting: 0.6,
    rimLight: "#7fd8ff",
    background: "#030305",
    demoBar: false,
    cardMotion: 0.6,
}


addPropertyControls(CardRibbon3D, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Player Name" },
                subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "Series" },
            },
        },
    },
    layout: { type: ControlType.Enum, title: "Layout", options: ["spiral", "row", "wave", "fan"], optionTitles: ["Spiral", "Straight Row", "Wave", "Standing Fan"], defaultValue: "spiral" },
    cameraMode: { type: ControlType.Enum, title: "Camera", options: ["cinematic", "fixed", "scroll"], optionTitles: ["Cinematic", "Fixed Shot", "Scroll Driven"], defaultValue: "cinematic" },
    fixedShot: { type: ControlType.Enum, title: "Shot", options: ["1", "2", "3", "4", "5"], optionTitles: ["Opening", "Side Sweep", "Low Angle", "Close Up", "Wide"], defaultValue: "1", hidden: (p: Props) => p.cameraMode !== "fixed" },
    shotLength: { type: ControlType.Number, title: "Shot Hold", min: 1, max: 8, step: 0.1, unit: "s", defaultValue: 2.6, hidden: (p: Props) => p.cameraMode !== "cinematic" },
    whipTime: { type: ControlType.Number, title: "Entry Time", min: 0.3, max: 2.5, step: 0.05, unit: "s", defaultValue: 0.9, hidden: (p: Props) => p.cameraMode !== "cinematic" },
    whipSpin: { type: ControlType.Number, title: "Whip Spin", min: 0, max: 180, step: 5, unit: "°", defaultValue: 70, hidden: (p: Props) => p.cameraMode !== "cinematic" },
    closeness: { type: ControlType.Number, title: "Closeness", min: 0.4, max: 1.5, step: 0.05, defaultValue: 1 },
    flowSpeed: { type: ControlType.Number, title: "Drift Speed", min: 0, max: 1, step: 0.01, defaultValue: 0.25 },
    cardMotion: { type: ControlType.Number, title: "Card Motion", min: 0, max: 1, step: 0.05, defaultValue: 0.6, hidden: (p: Props) => p.layout !== "wave" },
    flowDirection: { type: ControlType.Enum, title: "Direction", options: ["forward", "reverse"], optionTitles: ["Forward", "Reverse"], displaySegmentedControl: true, defaultValue: "forward" },
    pathAxis: { type: ControlType.Enum, title: "Strand Axis", options: ["vertical", "horizontal", "diagonal"], optionTitles: ["Vertical", "Horizontal", "Diagonal"], defaultValue: "vertical" },
    scrollMode: { type: ControlType.Enum, title: "On Scroll", options: ["none", "flow", "spin"], optionTitles: ["Nothing", "Travel Along", "Orbit Around"], defaultValue: "flow" },
    scrollBoost: { type: ControlType.Number, title: "Scroll Amount", min: 0, max: 5, step: 0.1, defaultValue: 1, hidden: (p: Props) => p.scrollMode === "none" },
    draggable: { type: ControlType.Boolean, title: "Drag to Look", defaultValue: true },
    hoverEffect: { type: ControlType.Boolean, title: "Hover Pull-out", defaultValue: true },
    hoverLift: { type: ControlType.Number, title: "Pull Distance", min: 0.3, max: 2, step: 0.05, defaultValue: 1 },
    autoFeature: { type: ControlType.Boolean, title: "Feature a Card", defaultValue: true },
    featureEvery: { type: ControlType.Number, title: "Feature Every", min: 2, max: 12, step: 0.5, unit: "s", defaultValue: 4, hidden: (p: Props) => !p.autoFeature },
    quality: { type: ControlType.Enum, title: "Quality", options: ["auto", "high", "balanced", "fast"], optionTitles: ["Auto", "High", "Balanced", "Fast"], defaultValue: "auto" },
    depthOfField: { type: ControlType.Number, title: "Depth of Field", min: 0, max: 2, step: 0.05, defaultValue: 1 },
    motionBlur: { type: ControlType.Number, title: "Motion Blur", min: 0, max: 2, step: 0.05, defaultValue: 1 },
    lighting: { type: ControlType.Number, title: "Exposure", min: 0, max: 1, step: 0.05, defaultValue: 0.6 },
    rimLight: { type: ControlType.Color, title: "Edge Light", defaultValue: "#7fd8ff" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#030305" },
    demoBar: { type: ControlType.Boolean, title: "Demo Controls", defaultValue: false, description: "Shows a layout and shot switcher on top, tinted with Edge Light. Turn on for previews, keep off on real sites." },
    count: { type: ControlType.Number, title: "Card Count", min: 40, max: 300, step: 1, defaultValue: 150 },
    radius: { type: ControlType.Number, title: "Curve Size", min: 120, max: 2000, defaultValue: 340, hidden: (p: Props) => p.layout === "row" },
    spacing: { type: ControlType.Number, title: "Card Spacing", min: 4, max: 80, step: 0.5, defaultValue: 30 },
    lean: { type: ControlType.Number, title: "Card Lean", min: 0, max: 85, unit: "°", defaultValue: 55 },
    cardWidth: { type: ControlType.Number, title: "Card W", min: 60, max: 400, defaultValue: 170 },
    cardHeight: { type: ControlType.Number, title: "Card H", min: 80, max: 560, defaultValue: 240 },
    cornerRadius: { type: ControlType.Number, title: "Corners", min: 0, max: 40, defaultValue: 10 },
    thickness: { type: ControlType.Number, title: "Thickness", min: 1, max: 12, step: 0.5, defaultValue: 3 },
    showLabels: { type: ControlType.Boolean, title: "Labels", defaultValue: true },
    cardBack: { type: ControlType.Enum, title: "Card Back", options: ["art", "design"], optionTitles: ["Same Art", "Card Back"], defaultValue: "art" },
})
