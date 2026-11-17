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


type Img = { src: string; srcSet?: string; alt?: string }

type Props = {
    image?: Img
    imageFraming: { zoom: number; x: number; y: number; rotate: number }
    look: "dreamy" | "real"
    tint: string
    speed: number
    tilt: number
    holo: number
    size: number
    shatter: boolean
    reassemble: number
    // Dreamy
    depth: number
    hub: number
    data: number
    roundness: number
    frost: number
    blur: number
    density: number
    glow: number
    grain: number
    guides: boolean
    guideColor: string
    style?: React.CSSProperties
}

const defaults = {
    imageFraming: { zoom: 100, x: 0, y: 0, rotate: 0 },
    look: "real" as const,
    tint: "#050507",
    speed: 12,
    tilt: 18,
    holo: 37,
    size: 51,
    shatter: true,
    reassemble: 2.5,
    depth: 45,
    hub: 85,
    data: 80,
    roundness: 80,
    frost: 80,
    blur: 70,
    density: 70,
    glow: 15,
    grain: 35,
    guides: false,
    guideColor: "rgba(255,255,255,0.35)",
}

// ─── Geometry: an annulus cut into prism shards ─────────────────────────────
// Every shard is a closed prism (front face, back face, side walls). At rest the
// shards tile a perfect disc; the vertex shader pulls them apart on shatter.

const HOLE = 0.14
const HALF_T = 0.011 // half-thickness (radius = 1)
const STRIDE = 16 // pos3 nor3 uv2 face1 center3 rand4

function rng(seed: number) {
    return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function buildDisc() {
    const R = rng(11)
    const S = 22
    const rings = [HOLE, 0.38, 0.6, 0.8, 1]
    const ARC = 4
    const TAU = Math.PI * 2

    const grid = rings.map((r, j) => {
        const edge = j === 0 || j === rings.length - 1
        return Array.from({ length: S }, (_, k) => ({
            a: ((k + (R() - 0.5) * 0.55 + j * 0.31) / S) * TAU,
            r: edge ? r : r + (R() - 0.5) * 0.07,
        }))
    })
    const at = (j: number, k: number) => grid[j][((k % S) + S) % S]
    const arc = (
        p: { a: number; r: number },
        q: { a: number; r: number },
        rev = false
    ) => {
        let d = q.a - p.a
        while (d < 0) d += TAU
        while (d > TAU) d -= TAU
        const out: number[][] = []
        for (let i = 0; i <= ARC; i++) {
            const t = i / ARC
            const a = p.a + d * t
            const r = p.r + (q.r - p.r) * t
            out.push([Math.cos(a) * r, Math.sin(a) * r])
        }
        return rev ? out.reverse() : out
    }
    const xy = (p: { a: number; r: number }) => [
        Math.cos(p.a) * p.r,
        Math.sin(p.a) * p.r,
    ]

    const polys: number[][][] = []
    for (let j = 0; j < rings.length - 1; j++) {
        for (let k = 0; k < S; k++) {
            const a = at(j, k)
            const b = at(j, k + 1)
            const c = at(j + 1, k + 1)
            const d = at(j + 1, k)
            const inner = arc(a, b) // a … b
            const outer = arc(d, c, true) // c … d
            if (R() < 0.5) {
                polys.push([...inner, xy(c)])
                polys.push([xy(a), ...outer])
            } else {
                polys.push([...inner, xy(d)])
                polys.push([xy(b), ...outer])
            }
        }
    }

    const data: number[] = []
    const push = (
        x: number,
        y: number,
        z: number,
        nx: number,
        ny: number,
        nz: number,
        face: number,
        cx: number,
        cy: number,
        rnd: number[]
    ) => data.push(x, y, z, nx, ny, nz, x, y, face, cx, cy, 0, ...rnd)

    for (const poly0 of polys) {
        let area = 0
        for (let i = 0; i < poly0.length; i++) {
            const p = poly0[i]
            const q = poly0[(i + 1) % poly0.length]
            area += p[0] * q[1] - q[0] * p[1]
        }
        const poly = area < 0 ? [...poly0].reverse() : poly0
        let cx = 0
        let cy = 0
        poly.forEach((p) => ((cx += p[0]), (cy += p[1])))
        cx /= poly.length
        cy /= poly.length
        const rnd = [R(), R(), R(), R()]
        const n = poly.length

        for (let i = 0; i < n; i++) {
            const p = poly[i]
            const q = poly[(i + 1) % n]
            // front (+z) and back (−z)
            push(cx, cy, HALF_T, 0, 0, 1, 0, cx, cy, rnd)
            push(p[0], p[1], HALF_T, 0, 0, 1, 0, cx, cy, rnd)
            push(q[0], q[1], HALF_T, 0, 0, 1, 0, cx, cy, rnd)
            push(cx, cy, -HALF_T, 0, 0, -1, 1, cx, cy, rnd)
            push(q[0], q[1], -HALF_T, 0, 0, -1, 1, cx, cy, rnd)
            push(p[0], p[1], -HALF_T, 0, 0, -1, 1, cx, cy, rnd)

            // side wall; round edges get smooth radial normals
            const rp = Math.hypot(p[0], p[1])
            const rq = Math.hypot(q[0], q[1])
            let np: number[]
            let nq: number[]
            let wall = 2
            if (rp > 0.999 && rq > 0.999) {
                np = [p[0] / rp, p[1] / rp]
                nq = [q[0] / rq, q[1] / rq]
            } else if (rp < HOLE + 1e-3 && rq < HOLE + 1e-3) {
                np = [-p[0] / rp, -p[1] / rp]
                nq = [-q[0] / rq, -q[1] / rq]
            } else {
                const dx = q[0] - p[0]
                const dy = q[1] - p[1]
                const l = Math.hypot(dx, dy) || 1
                np = nq = [dy / l, -dx / l]
                wall = 3 // internal crack: hidden until it opens
            }
            push(p[0], p[1], HALF_T, np[0], np[1], 0, wall, cx, cy, rnd)
            push(p[0], p[1], -HALF_T, np[0], np[1], 0, wall, cx, cy, rnd)
            push(q[0], q[1], -HALF_T, nq[0], nq[1], 0, wall, cx, cy, rnd)
            push(p[0], p[1], HALF_T, np[0], np[1], 0, wall, cx, cy, rnd)
            push(q[0], q[1], -HALF_T, nq[0], nq[1], 0, wall, cx, cy, rnd)
            push(q[0], q[1], HALF_T, nq[0], nq[1], 0, wall, cx, cy, rnd)
        }
    }
    return new Float32Array(data)
}

// ─── Shaders ────────────────────────────────────────────────────────────────

const VERT = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv; attribute float aFace;
attribute vec3 aCen; attribute vec4 aRnd;
uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel; uniform mat3 uRot;
uniform float uExp;
varying vec3 vN; varying vec3 vW; varying vec3 vRad; varying vec2 vUv; varying float vFace;

vec3 rot(vec3 v, vec3 k, float a) {
  float c = cos(a), s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}

void main() {
  float p = clamp(uExp * 1.4 - aRnd.w * 0.4, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - p, 3.0);
  vec3 axis = normalize(aRnd.xyz - 0.5 + vec3(1e-3));
  float ang = e * (2.5 + aRnd.x * 5.0) * (aRnd.y > 0.5 ? 1.0 : -1.0);

  vec3 lp = aPos - aCen;
  if (aFace > 2.5) lp.z *= mix(0.6, 1.0, smoothstep(0.0, 0.05, p));
  vec3 local = rot(lp * (1.0 - p * 0.18), axis, ang);
  float cr = length(aCen.xy) + 1e-3;
  vec3 dir = normalize(vec3(aCen.xy / cr * (0.5 + cr), (aRnd.z - 0.5) * 1.8));
  vec3 pos = aCen + local + dir * e * (0.9 + aRnd.y * 1.5);

  vec4 w = uModel * vec4(pos, 1.0);
  w.y -= p * p * 1.1;

  vW = w.xyz;
  vN = uRot * rot(aNor, axis, ang);
  vRad = uRot * rot(normalize(vec3(aUv, 0.0) + vec3(1e-5)), axis, ang);
  vUv = aUv;
  vFace = aFace;
  gl_Position = uProj * uView * w;
}
`

const FRAG = `
precision highp float;
varying vec3 vN; varying vec3 vW; varying vec3 vRad; varying vec2 vUv; varying float vFace;
uniform sampler2D uTex; uniform vec3 uCam; uniform vec3 uL1; uniform vec3 uL2;
uniform float uTime; uniform float uHolo;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; }
  return s;
}
vec3 irid(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }

// Zucconi spectral approximation (nm → rgb)
vec3 bump3(vec3 x, vec3 y) { return clamp(1.0 - x * x - y, 0.0, 1.0); }
vec3 spectral(float w) {
  float x = (w - 400.0) / 300.0;
  if (x < 0.0 || x > 1.0) return vec3(0.0);
  return bump3(vec3(3.54541723, 2.86670055, 2.29421995) * (x - vec3(0.69548916, 0.49416934, 0.28269708)),
               vec3(0.02320775, 0.15936245, 0.53520021));
}

vec3 env(vec3 r) {
  vec3 c = mix(vec3(0.36, 0.37, 0.42), vec3(1.0), smoothstep(-0.4, 0.8, r.y));
  c += 1.4 * pow(max(dot(r, normalize(vec3(-0.6, 0.55, 0.6))), 0.0), 22.0);
  c += 0.9 * pow(max(dot(r, normalize(vec3(0.75, 0.1, 0.65))), 0.0), 50.0);
  return c;
}

vec3 grating(vec3 L, vec3 V, vec3 N, vec3 Rd) {
  vec3 H = normalize(L + V);
  vec3 T = normalize(cross(N, Rd));
  float u = abs(dot(Rd, L + V));
  float w = exp(-dot(T, H) * dot(T, H) * 60.0) * smoothstep(0.0, 0.25, dot(N, H));
  vec3 c = vec3(0.0);
  for (int m = 1; m <= 3; m++) c += spectral(1500.0 * u / float(m));
  return c * w;
}

void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCam - vW);
  vec3 R = reflect(-V, N);
  vec3 L1 = normalize(uL1), L2 = normalize(uL2);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
  float dif = 0.55 * max(dot(N, L1), 0.0) + 0.35 * max(dot(N, L2), 0.0);
  vec3 H1 = normalize(L1 + V), H2 = normalize(L2 + V);
  float sp = pow(max(dot(N, H1), 0.0), 110.0) + 0.6 * pow(max(dot(N, H2), 0.0), 70.0);
  vec2 p = vUv;
  float r = length(p);
  vec3 col;

  if (vFace < 0.5) {
    // ── Label side: printed art + holographic foil + glitter + clear coat
    vec3 alb = pow(texture2D(uTex, vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5)).rgb, vec3(2.2));
    float swirl = fbm(p * 1.7 + uTime * 0.03);
    vec3 film = irid(NV * 1.3 + r * 1.1 + swirl * 0.9 + dot(N, L1) * 0.6);
    float sheen = pow(max(dot(N, H1), 0.0), 5.0);
    col = alb * (0.66 + 0.5 * dif);
    col += film * uHolo * (0.03 + 0.22 * sheen + 0.18 * F);

    vec2 g = floor(p * 110.0);
    float h = hash(g);
    vec3 jit = vec3(hash(g + 3.1), hash(g + 7.7), hash(g + 11.3)) - 0.5;
    float tw = pow(max(dot(N, normalize(H1 + jit * 0.5)), 0.0), 420.0);
    col += step(0.82, h) * tw * 1.6 * uHolo * irid(h * 4.0 + NV);

    float hub = 1.0 - smoothstep(0.205, 0.215, r);
    vec3 clear = vec3(0.88, 0.89, 0.92) * (0.75 + 0.3 * dif) + film * 0.12 * uHolo;
    col = mix(col, clear, hub);
    col += env(R) * F * 0.45 + sp * 0.5;
  } else if (vFace < 1.5) {
    // ── Data side: mirror silver + diffraction grating + liquid holo
    vec3 Rd = normalize(vRad);
    vec3 base = vec3(0.72, 0.73, 0.76);
    vec3 c = base * env(R) * 0.72 + base * 0.14 * dif;
    float swirl = fbm(p * 1.25 + vec2(uTime * 0.04, -uTime * 0.03));
    vec3 liquid = irid(swirl * 1.7 + atan(p.y, p.x) * 0.318 + NV * 1.3 + dot(N, L1) * 0.8);
    float data = smoothstep(0.34, 0.355, r) * (1.0 - smoothstep(0.975, 0.99, r));
    vec3 diff = grating(L1, V, N, Rd) + 0.7 * grating(L2, V, N, Rd);
    c += data * uHolo * (diff * 1.7 + liquid * 0.4);
    c *= 1.0 - 0.035 * data * sin(r * 1100.0);
    float hub = 1.0 - smoothstep(0.33, 0.345, r);
    float ringMark = smoothstep(0.24, 0.245, r) * (1.0 - smoothstep(0.25, 0.255, r));
    vec3 frost = vec3(0.86, 0.87, 0.9) * (0.72 + 0.3 * dif) - ringMark * 0.12;
    c = mix(c, frost + env(R) * F * 0.3, hub);
    col = c + sp * 0.6;
  } else {
    // ── Edge
    col = vec3(0.8, 0.81, 0.84) * (0.45 + 0.55 * dif) + env(R) * 0.22
        + irid(NV * 2.5 + r * 2.0) * 0.18 * uHolo + sp * 0.4;
  }

  col = col / (1.0 + col * 0.16);
  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}
`

// ─── Small matrix helpers (column-major) ────────────────────────────────────

function perspective(fovy: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan(fovy / 2)
    const nf = 1 / (near - far)
    return new Float32Array([
        f / aspect,
        0,
        0,
        0,
        0,
        f,
        0,
        0,
        0,
        0,
        (far + near) * nf,
        -1,
        0,
        0,
        2 * far * near * nf,
        0,
    ])
}

// R = Rx(ax) · Ry(ay)
function rotation(ax: number, ay: number) {
    const cx = Math.cos(ax),
        sx = Math.sin(ax)
    const cy = Math.cos(ay),
        sy = Math.sin(ay)
    // rows of Rx·Ry
    const m = [
        [cy, 0, sy],
        [sx * sy, cx, -sx * cy],
        [-cx * sy, sx, cx * cy],
    ]
    const m3 = new Float32Array([
        m[0][0],
        m[1][0],
        m[2][0],
        m[0][1],
        m[1][1],
        m[2][1],
        m[0][2],
        m[1][2],
        m[2][2],
    ])
    const m4 = new Float32Array([
        m[0][0],
        m[1][0],
        m[2][0],
        0,
        m[0][1],
        m[1][1],
        m[2][1],
        0,
        m[0][2],
        m[1][2],
        m[2][2],
        0,
        0,
        0,
        0,
        1,
    ])
    return { m3, m4 }
}

// ─── Label texture: image drawn "cover" into a square, or a default holo print

type Framing = { zoom: number; x: number; y: number; rotate: number }

function drawLabel(img: HTMLImageElement | null, fr?: Framing) {
    const S = 1024
    const c = document.createElement("canvas")
    c.width = c.height = S
    const ctx = c.getContext("2d")!
    if (img) {
        const zoom = Math.max(0.1, (fr?.zoom ?? 100) / 100)
        const s = Math.max(S / img.naturalWidth, S / img.naturalHeight) * zoom
        const w = img.naturalWidth * s
        const h = img.naturalHeight * s
        // backdrop so zoomed-out images don't leave transparent gaps
        ctx.fillStyle = "#111"
        ctx.fillRect(0, 0, S, S)
        ctx.save()
        ctx.translate(
            S / 2 + ((fr?.x ?? 0) / 100) * S,
            S / 2 + ((fr?.y ?? 0) / 100) * S
        )
        ctx.rotate(((fr?.rotate ?? 0) * Math.PI) / 180)
        ctx.drawImage(img, -w / 2, -h / 2, w, h)
        ctx.restore()
        return c
    }
    const anyCtx = ctx as any
    if (anyCtx.createConicGradient) {
        const g = anyCtx.createConicGradient(-0.6, S / 2, S / 2)
        ;[
            "#f9d3ec",
            "#d9d2ff",
            "#c8f1ff",
            "#d8ffe9",
            "#fff2c9",
            "#ffd1e3",
            "#f9d3ec",
        ].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col))
        ctx.fillStyle = g
    } else {
        ctx.fillStyle = "#e9e3f6"
    }
    ctx.fillRect(0, 0, S, S)
    const rg = ctx.createRadialGradient(
        S / 2,
        S / 2,
        S * 0.1,
        S / 2,
        S / 2,
        S * 0.5
    )
    rg.addColorStop(0, "rgba(255,255,255,0.85)")
    rg.addColorStop(0.6, "rgba(255,255,255,0.1)")
    rg.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, S, S)
    return c
}

// ─── Dreamy look: one ray-marched volume ────────────────────────────────────
// The disc is a single signed-distance shape (an annulus with rounded edges).
// Per pixel: ray → frosted shell (fresnel) → refract → march the interior,
// where the label is extruded through the thickness and absorbed with
// Beer–Lambert. Deep samples read blurrier mips, so the core goes soft.
// Drawn as one billboard quad that only covers the object's bounding sphere.

const VOL_VERT = `
attribute vec2 aP;
uniform mat4 uProj; uniform mat4 uView; uniform float uBB;
varying vec3 vW;
void main() {
  vW = vec3(aP * uBB, 0.0);
  gl_Position = uProj * uView * vec4(vW, 1.0);
}
`

const VOL_FRAG = `
precision highp float;
varying vec3 vW;
uniform sampler2D uTex; uniform sampler2D uNoise;
uniform mat3 uRot; uniform vec3 uCam;
uniform float uHz; uniform float uK; uniform float uR;
uniform float uDens; uniform float uBlur; uniform float uFrost; uniform float uHolo;
uniform float uGlow; uniform float uExp; uniform float uTime; uniform float uSteps;
uniform float uHub; uniform float uData; uniform vec3 uL1o; uniform vec3 uL2o;

const float RC = 0.57;   // centre radius of the annulus (hole 0.14 … rim 1.0)
const float HW = 0.43;   // half width of the annulus

vec3 irid(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }

float sdf(vec3 p) {
  p /= 1.0 + uExp * 0.12;
  vec2 q = vec2(length(p.xy) - RC, p.z);
  vec2 d = abs(q) - vec2(HW, uHz) + uK;
  float s = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - uK;
  return s - uExp * 0.12;   // puffs up softly while dissolving
}

vec3 normalAt(vec3 p) {
  const vec2 e = vec2(0.0015, -0.0015);
  return normalize(e.xyy * sdf(p + e.xyy) + e.yyx * sdf(p + e.yyx) +
                   e.yxy * sdf(p + e.yxy) + e.xxx * sdf(p + e.xxx));
}

// Zucconi spectral approximation (nm → rgb)
vec3 bump3(vec3 x, vec3 y) { return clamp(1.0 - x * x - y, 0.0, 1.0); }
vec3 spectral(float w) {
  float x = (w - 400.0) / 300.0;
  if (x < 0.0 || x > 1.0) return vec3(0.0);
  return bump3(vec3(3.54541723, 2.86670055, 2.29421995) * (x - vec3(0.69548916, 0.49416934, 0.28269708)),
               vec3(0.02320775, 0.15936245, 0.53520021));
}

// CD data-layer diffraction: grooves run around the disc, so light splits
// into a rainbow along the radial direction.
vec3 grating(vec3 L, vec3 V, vec3 N, vec3 Rd) {
  vec3 H = normalize(L + V);
  vec3 T = cross(N, Rd);
  float u = abs(dot(Rd, L + V));
  float w = exp(-dot(T, H) * dot(T, H) * 45.0) * smoothstep(0.0, 0.3, dot(N, H));
  vec3 c = vec3(0.0);
  for (int m = 1; m <= 3; m++) c += spectral(1500.0 * u / float(m));
  return c * w;
}

// The metal layer sitting on the mid-plane: silver hub ring + mirrored data area.
vec4 midLayer(vec2 xy, vec3 V) {
  float r = length(xy);
  vec3 N = vec3(0.0, 0.0, V.z >= 0.0 ? 1.0 : -1.0);
  vec3 Rd = vec3(xy / max(r, 1e-4), 0.0);
  vec3 R = reflect(-V, N);
  float env = smoothstep(-0.5, 0.9, R.y) * 0.7 + 0.3;
  float sp = pow(max(dot(N, normalize(uL1o + V)), 0.0), 60.0) + 0.6 * pow(max(dot(N, normalize(uL2o + V)), 0.0), 40.0);

  // hub: brushed silver clamping ring with stacking ring and bevelled edges
  float hubM = smoothstep(0.165, 0.172, r) * (1.0 - smoothstep(0.332, 0.338, r));
  float lines = smoothstep(0.004, 0.0, abs(r - 0.245)) + smoothstep(0.004, 0.0, abs(r - 0.33)) * 0.8
              + smoothstep(0.004, 0.0, abs(r - 0.172)) * 0.6;
  vec3 Tg = cross(N, Rd);
  float g1 = dot(Tg, normalize(uL1o + V));
  float g2 = dot(Tg, normalize(uL2o + V));
  float aniso = exp(-g1 * g1 * 18.0) + 0.6 * exp(-g2 * g2 * 18.0);
  float envS = smoothstep(-0.3, 0.7, R.y) * 0.75 + 0.12;
  vec3 silver = vec3(0.62, 0.64, 0.69) * envS * (0.9 + 0.1 * sin(r * 700.0))
              + vec3(1.0) * aniso * 0.55 + lines * 0.3 + sp * 0.9;
  silver += grating(uL1o, V, N, Rd) * 0.35;      // a hint of rainbow on the metal too
  vec4 hub = vec4(silver, 0.9) * hubM * uHub;

  // data area: translucent mirror whose rainbow streaks move with the light
  float dataM = smoothstep(0.345, 0.36, r) * (1.0 - smoothstep(0.97, 0.985, r));
  vec3 diff = grating(uL1o, V, N, Rd) + 0.7 * grating(uL2o, V, N, Rd);
  vec3 mirror = vec3(0.7, 0.72, 0.76) * env * 0.35 + diff * 1.4 + sp * 0.5;
  float da = (0.12 + clamp(dot(diff, vec3(0.4)), 0.0, 0.7) + sp * 0.3) * dataM * uData;
  vec4 data = vec4(mirror * da, da);

  return vec4(hub.rgb + data.rgb * (1.0 - hub.a), hub.a + data.a * (1.0 - hub.a));
}

vec3 label(vec3 p, float bias) {
  vec2 u = p.xy;
  if (uExp > 0.001) u += (texture2D(uNoise, p.xy * 0.4 + p.z * 0.6 + uTime * 0.02).rg - 0.5) * uExp * 0.5;
  return texture2D(uTex, vec2(u.x * 0.5 + 0.5, 0.5 - u.y * 0.5), bias + uExp * 3.0).rgb;
}

void main() {
  vec3 rdW = normalize(vW - uCam);
  // world → object (uRot is orthonormal: v * M == transpose(M) * v)
  vec3 ro = uCam * uRot;
  vec3 rd = rdW * uRot;

  // bounding sphere
  float b = dot(ro, rd);
  float c = dot(ro, ro) - uR * uR;
  float h = b * b - c;
  if (h < 0.0) discard;
  h = sqrt(h);
  float t = max(0.0, -b - h);
  float tEnd = -b + h;

  // jump straight to the slab |z| <= hz (the sdf is never smaller than the slab
  // distance), so grazing rays don't stall on the flat faces
  if (abs(rd.z) > 1e-4) {
    float ta = (uHz * 1.12 - ro.z) / rd.z;
    float tb = (-uHz * 1.12 - ro.z) / rd.z;
    t = max(t, min(ta, tb));
    tEnd = min(tEnd, max(ta, tb));
  } else if (abs(ro.z) > uHz * 1.12) discard;
  if (t > tEnd) discard;

  // sphere-trace to the shell, remembering the closest miss for a soft halo
  float minD = 1e3;
  float tMin = t;
  bool hit = false;
  for (int i = 0; i < 64; i++) {
    float d = sdf(ro + rd * t);
    if (d < minD) { minD = d; tMin = t; }
    if (d < 0.0012) { hit = true; break; }
    t += max(d, 0.002);
    if (t > tEnd) break;
  }
  if (!hit && minD < 0.006) { hit = true; t = tMin; }

  if (!hit) {
    float halo = (1.0 - smoothstep(0.0, 0.035, minD)) * uFrost * 0.35 * (1.0 - uExp);
    if (halo < 0.004) discard;
    gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * halo, halo);
    return;
  }

  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  if (dot(n, rd) > 0.0) n = -n;                    // always face the viewer
  float NV = clamp(dot(n, -rd), 0.0, 1.0);
  float F = pow(1.0 - NV, 3.0);
  float side = 1.0 - abs(n.z);            // 0 on the flat faces, 1 on the rounded rim

  // interior: refract in, march, absorb
  vec3 ri = refract(rd, n, 0.8);
  if (dot(ri, ri) < 0.5) ri = rd;
  float L = min(2.4, (2.0 * uHz) / max(abs(ri.z), 0.12));
  float dt = L / uSteps;
  float sigma = uDens * 9.0 / (2.0 * uHz);
  vec3 acc = vec3(0.0);
  float T = 1.0;
  vec3 q = p + ri * dt * 0.5;
  vec3 prev = p;
  bool crossed = false;
  for (int i = 0; i < 20; i++) {
    if (float(i) >= uSteps) break;
    if (i > 0 && sdf(q) > 0.0) break;             // first sample always counts
    // crossing the mid-plane → composite the metal layer at the exact hit point
    if (!crossed && prev.z * q.z <= 0.0) {
      crossed = true;
      vec3 m = mix(prev, q, prev.z / (prev.z - q.z + 1e-6));
      vec4 ml = midLayer(m.xy, -ri) * (1.0 - uExp);
      acc += mix(T, 1.0, 0.45) * ml.rgb;     // shine scatters through the milky body
      T *= 1.0 - ml.a;
    }
    prev = q;
    float core = 1.0 - abs(q.z) / uHz;           // 0 at faces, 1 at mid-plane
    float rq = length(q.xy);
    vec3 cl = label(q, core * uBlur);
    cl *= 1.0 - core * 0.45;                     // denser, darker heart
    float clearHub = mix(0.08, 1.0, smoothstep(0.32, 0.37, rq) * uHub + (1.0 - uHub));
    float a = (1.0 - exp(-sigma * dt * (0.6 + 0.4 * core))) * clearHub;
    acc += T * a * cl;
    T *= 1.0 - a;
    if (T < 0.02 && crossed) break;
    q += ri * dt;
  }

  // shell: frosted milk at grazing angles and around the rounded rim, thin-film tint
  vec3 viewSide = -rd;
  float backView = smoothstep(-0.1, 0.25, -viewSide.z);   // looking at the data side
  vec3 film = irid(NV * 1.6 + side * 0.8 + atan(p.y, p.x) * 0.16 + uTime * 0.04);
  acc = mix(acc, acc * (0.55 + 0.9 * film), uHolo * (0.08 + 0.6 * backView));

  float rim = smoothstep(0.0, 0.7, side);
  float rr = length(p.xy);
  float band = max(1.0 - smoothstep(0.0, 0.2, 1.0 - rr), 1.0 - smoothstep(0.0, 0.1, rr - 0.14));
  float milk = clamp((F * 0.4 + max(rim, band * 0.8) * 0.8 + uExp * 0.5) * uFrost, 0.0, 0.94);
  vec3 milkCol = mix(vec3(0.84, 0.89, 0.96), film, 0.1 * uHolo) * (0.8 + 0.25 * NV);
  vec3 L1 = normalize(vec3(-0.45, 0.6, 0.8));
  float spec = pow(max(dot(n, normalize(L1 - rd)), 0.0), 24.0) * 0.18;

  float alpha = 1.0 - T;
  vec3 col = acc * (1.0 - milk * 0.75) + milkCol * milk + spec;
  alpha = alpha * (1.0 - milk) + milk + spec;
  col *= 1.0 + uGlow;
  float fade = 1.0 - smoothstep(0.55, 1.0, uExp);
  gl_FragColor = vec4(col * fade, clamp(alpha, 0.0, 1.0) * fade);
}
`

const LINE_VERT = `
attribute vec3 aP;
uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel;
void main() { gl_Position = uProj * uView * uModel * vec4(aP, 1.0); }
`

const LINE_FRAG = `
precision mediump float;
uniform vec4 uColor;
void main() { gl_FragColor = vec4(uColor.rgb * uColor.a, uColor.a); }
`

// ─── GL helpers ─────────────────────────────────────────────────────────────

function makeProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) {
    const compile = (type: number, code: string) => {
        const s = gl.createShader(type)
        if (!s) return null
        gl.shaderSource(s, code)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(s))
            gl.deleteShader(s)
            return null
        }
        return s
    }
    const vs = compile(gl.VERTEX_SHADER, vsSrc)
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc)
    if (!vs || !fs) return null
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.deleteProgram(prog)
        return null
    }
    const uniforms: Record<string, WebGLUniformLocation | null> = {}
    const U = (n: string) =>
        n in uniforms
            ? uniforms[n]
            : (uniforms[n] = gl.getUniformLocation(prog, n))
    const A = (n: string) => gl.getAttribLocation(prog, n)
    return { prog, U, A }
}

// model = R(rx,ry) · T(0,0,tz) · S(sx,sy,sz), written into `out`
function modelInto(
    out: Float32Array,
    rx: number,
    ry: number,
    sx: number,
    sy: number,
    sz: number,
    tz: number
) {
    const { m4 } = rotation(rx, ry)
    for (let k = 0; k < 3; k++) {
        out[k] = m4[k] * sx
        out[4 + k] = m4[4 + k] * sy
        out[8 + k] = m4[8 + k] * sz
        out[12 + k] = m4[8 + k] * tz
    }
    out[3] = out[7] = out[11] = 0
    out[15] = 1
    return out
}

function parseColor(str: string): [number, number, number, number] {
    try {
        const c = document.createElement("canvas")
        c.width = c.height = 1
        const ctx = c.getContext("2d")!
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = str
        ctx.fillRect(0, 0, 1, 1)
        const d = ctx.getImageData(0, 0, 1, 1).data
        return [d[0] / 255, d[1] / 255, d[2] / 255, d[3] / 255]
    } catch {
        return [1, 1, 1, 0.35]
    }
}

type FrameInfo = {
    proj: Float32Array
    view: Float32Array
    rx: number
    ry: number
    exp: number
    time: number
    pr: Props
    lagAt: (seconds: number) => [number, number]
    slices: number
    guide: [number, number, number, number]
}

type Renderer = { draw: (f: FrameInfo) => void; release: () => void }

// ─── Real renderer (solid shards) ───────────────────────────────────────────

function makeReal(
    gl: WebGLRenderingContext,
    tex: WebGLTexture
): Renderer | null {
    const P = makeProgram(gl, VERT, FRAG)
    if (!P) return null
    const verts = buildDisc()
    const count = verts.length / STRIDE
    const buf = gl.createBuffer()
    const attrs: [string, number, number][] = [
        ["aPos", 3, 0],
        ["aNor", 3, 3],
        ["aUv", 2, 6],
        ["aFace", 1, 8],
        ["aCen", 3, 9],
        ["aRnd", 4, 12],
    ]
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
    const locs = attrs.map(([n]) => P.A(n))

    return {
        draw(f) {
            gl.useProgram(P.prog)
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            attrs.forEach(([, size, off], i) => {
                const loc = locs[i]
                if (loc < 0) return
                gl.enableVertexAttribArray(loc)
                gl.vertexAttribPointer(
                    loc,
                    size,
                    gl.FLOAT,
                    false,
                    STRIDE * 4,
                    off * 4
                )
            })
            gl.enable(gl.DEPTH_TEST)
            gl.disable(gl.BLEND)
            gl.disable(gl.CULL_FACE)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.uniform1i(P.U("uTex"), 0)
            gl.uniformMatrix4fv(P.U("uProj"), false, f.proj)
            gl.uniformMatrix4fv(P.U("uView"), false, f.view)
            const { m3, m4 } = rotation(f.rx, f.ry)
            gl.uniformMatrix4fv(P.U("uModel"), false, m4)
            gl.uniformMatrix3fv(P.U("uRot"), false, m3)
            gl.uniform3f(P.U("uCam"), 0, 0, CAM_Z)
            gl.uniform3f(
                P.U("uL1"),
                -0.55 + Math.sin(f.time * 0.35) * 0.35,
                0.6,
                1.0
            )
            gl.uniform3f(
                P.U("uL2"),
                0.85,
                -0.25 + Math.cos(f.time * 0.27) * 0.25,
                0.6
            )
            gl.uniform1f(P.U("uTime"), f.time)
            gl.uniform1f(P.U("uHolo"), clamp01(f.pr.holo / 100, 1.5))
            gl.uniform1f(P.U("uExp"), smooth(f.exp))
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.drawArrays(gl.TRIANGLES, 0, count)
            locs.forEach((l) => l >= 0 && gl.disableVertexAttribArray(l))
        },
        release() {
            gl.deleteBuffer(buf)
            gl.deleteProgram(P.prog)
        },
    }
}

// ─── Dreamy renderer (ray-marched volume + optional wire case) ──────────────

function makeDreamy(
    gl: WebGLRenderingContext,
    tex: WebGLTexture
): Renderer | null {
    const S = makeProgram(gl, VOL_VERT, VOL_FRAG)
    const L = makeProgram(gl, LINE_VERT, LINE_FRAG)
    if (!S || !L) return null

    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]),
        gl.STATIC_DRAW
    )

    const v = [-1, 1]
    const edges: number[] = []
    for (const a of v)
        for (const b of v) {
            edges.push(-1, a, b, 1, a, b)
            edges.push(a, -1, b, a, 1, b)
            edges.push(a, b, -1, a, b, 1)
        }
    const box = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, box)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edges), gl.STATIC_DRAW)

    // smooth value noise (bilinear-filtered random texels), used for the dissolve
    const noise = gl.createTexture()
    const N = 32
    const px = new Uint8Array(N * N * 4)
    const R = rng(5)
    for (let i = 0; i < px.length; i++) px[i] = (R() * 255) | 0
    gl.bindTexture(gl.TEXTURE_2D, noise)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        N,
        N,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        px
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)

    const model = new Float32Array(16)
    const aQuad = S.A("aP")
    const aLine = L.A("aP")

    return {
        draw(f) {
            const pr = f.pr
            const e = smooth(f.exp)
            const hz = 0.012 + clamp01(pr.depth / 100, 1) * 0.29
            const k = Math.min(hz, 0.43) * clamp01(pr.roundness / 100, 1)
            const rBound = Math.sqrt(1 + hz * hz) * (1 + e * 0.12) + 0.06
            const bb =
                ((rBound * CAM_Z) /
                    Math.sqrt(CAM_Z * CAM_Z - rBound * rBound)) *
                1.02

            gl.disable(gl.DEPTH_TEST)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            gl.clear(gl.COLOR_BUFFER_BIT)

            if (pr.guides && f.guide[3] > 0) {
                gl.useProgram(L.prog)
                gl.bindBuffer(gl.ARRAY_BUFFER, box)
                gl.enableVertexAttribArray(aLine)
                gl.vertexAttribPointer(aLine, 3, gl.FLOAT, false, 0, 0)
                gl.uniformMatrix4fv(L.U("uProj"), false, f.proj)
                gl.uniformMatrix4fv(L.U("uView"), false, f.view)
                gl.uniformMatrix4fv(
                    L.U("uModel"),
                    false,
                    modelInto(model, f.rx, f.ry, 1.16, 1.16, hz + 0.12, 0)
                )
                gl.uniform4f(
                    L.U("uColor"),
                    f.guide[0],
                    f.guide[1],
                    f.guide[2],
                    f.guide[3]
                )
                gl.drawArrays(gl.LINES, 0, edges.length / 3)
                gl.disableVertexAttribArray(aLine)
            }

            gl.useProgram(S.prog)
            gl.bindBuffer(gl.ARRAY_BUFFER, quad)
            gl.enableVertexAttribArray(aQuad)
            gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, noise)
            gl.uniform1i(S.U("uTex"), 0)
            gl.uniform1i(S.U("uNoise"), 1)
            gl.uniformMatrix4fv(S.U("uProj"), false, f.proj)
            gl.uniformMatrix4fv(S.U("uView"), false, f.view)
            gl.uniformMatrix3fv(S.U("uRot"), false, rotation(f.rx, f.ry).m3)
            gl.uniform3f(S.U("uCam"), 0, 0, CAM_Z)
            gl.uniform1f(S.U("uBB"), bb)
            gl.uniform1f(S.U("uR"), rBound)
            gl.uniform1f(S.U("uHz"), hz)
            gl.uniform1f(S.U("uK"), Math.max(0.002, k))
            gl.uniform1f(S.U("uDens"), clamp01(pr.density / 100, 1.5))
            gl.uniform1f(S.U("uBlur"), clamp01(pr.blur / 100, 1) * 5)
            gl.uniform1f(S.U("uFrost"), clamp01(pr.frost / 100, 1.5))
            gl.uniform1f(S.U("uHolo"), clamp01(pr.holo / 100, 1.5))
            gl.uniform1f(S.U("uGlow"), clamp01(pr.glow / 100, 2))
            gl.uniform1f(S.U("uExp"), e)
            gl.uniform1f(S.U("uTime"), f.time)
            gl.uniform1f(S.U("uSteps"), f.slices)
            gl.uniform1f(S.U("uHub"), clamp01(pr.hub / 100, 1))
            gl.uniform1f(S.U("uData"), clamp01(pr.data / 100, 1.5))
            // lights live in world space; the shader works in object space → R^T · L
            const m3 = rotation(f.rx, f.ry).m3
            const toObj = (x: number, y: number, z: number) => {
                const l = Math.hypot(x, y, z)
                x /= l
                y /= l
                z /= l
                return [
                    m3[0] * x + m3[1] * y + m3[2] * z,
                    m3[3] * x + m3[4] * y + m3[5] * z,
                    m3[6] * x + m3[7] * y + m3[8] * z,
                ]
            }
            const l1 = toObj(-0.55 + Math.sin(f.time * 0.35) * 0.35, 0.6, 1.0)
            const l2 = toObj(0.85, -0.25 + Math.cos(f.time * 0.27) * 0.25, 0.6)
            gl.uniform3f(S.U("uL1o"), l1[0], l1[1], l1[2])
            gl.uniform3f(S.U("uL2o"), l2[0], l2[1], l2[2])
            gl.drawArrays(gl.TRIANGLES, 0, 6)
            gl.disableVertexAttribArray(aQuad)
            gl.activeTexture(gl.TEXTURE0)
        },
        release() {
            gl.deleteBuffer(quad)
            gl.deleteBuffer(box)
            gl.deleteTexture(noise)
            gl.deleteProgram(S.prog)
            gl.deleteProgram(L.prog)
        },
    }
}

const CAM_Z = 5
const clamp01 = (n: number, max = 1) => Math.max(0, Math.min(max, n))
const smooth = (e: number) => e * e * (3 - 2 * e)

const GRAIN_SVG =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Holographic CD
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 480
 * @framerDisableUnlink
 */
export default function HolographicCD(input: Props) {
    const p = { ...defaults, ...input } as Props
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const shadowRef = React.useRef<HTMLDivElement>(null)
    const propsRef = React.useRef(p)
    propsRef.current = p
    const triggerRef = React.useRef<() => void>(() => {})
    // bumps after a lost WebGL context is restored, so the scene is rebuilt
    const [glEpoch, setGlEpoch] = React.useState(0)
    // true when WebGL is unavailable: render a lightweight CSS disc instead
    const [noGL, setNoGL] = React.useState(false)
    // true while the disc is broken apart (mirrored to aria-pressed)
    const [broken, setBroken] = React.useState(false)

    const staticRenderer = useIsStaticRenderer()
    const still =
        RenderTarget.current() === RenderTarget.canvas || staticRenderer
    const src = p.image?.src || ""
    const look = p.look === "real" ? "real" : "dreamy"
    const id = `cd-${React.useId().replace(/:/g, "")}`
    const fr = { ...defaults.imageFraming, ...p.imageFraming }
    const framing = [fr.zoom, fr.x, fr.y, fr.rotate].join("|")

    // On the editor canvas there is no loop, so redraw when visual props change.
    const stillKey = still
        ? [
              p.holo,
              p.size,
              p.depth,
              p.hub,
              p.data,
              p.roundness,
              p.frost,
              p.blur,
              p.density,
              p.glow,
              p.guides,
              p.guideColor,
          ].join("|")
        : ""

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: look === "real",
            premultipliedAlpha: true,
            preserveDrawingBuffer: still,
            powerPreference: "default",
        })
        if (!gl) {
            setNoGL(true)
            return
        }

        // label texture (shared by both looks)
        const tex = gl.createTexture()!
        const upload = (source: HTMLCanvasElement) => {
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                source
            )
            gl.generateMipmap(gl.TEXTURE_2D)
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                gl.LINEAR_MIPMAP_LINEAR
            )
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        }
        upload(drawLabel(null))

        const renderer =
            look === "real" ? makeReal(gl, tex) : makeDreamy(gl, tex)
        if (!renderer) {
            gl.deleteTexture(tex)
            setNoGL(true)
            return
        }
        setNoGL(false)
        setBroken(false)
        gl.clearColor(0, 0, 0, 0)

        const view = new Float32Array([
            1,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            -CAM_Z,
            1,
        ])

        // ── state
        const BASE_X = -0.18
        const st = {
            rx: still ? -0.3 : BASE_X,
            ry: still ? -0.5 : -0.4,
            vx: 0,
            vy: 0,
            hx: 0,
            hy: 0,
            thx: 0,
            thy: 0,
            dragging: false,
            lastX: 0,
            lastY: 0,
            downX: 0,
            downY: 0,
            downT: 0,
            exp: 0,
            dir: 0 as -1 | 0 | 1,
            holdUntil: 0,
            time: 0,
        }

        // rotation history for the dreamy trail (time-based, frame-rate independent)
        const H = 128
        const histT = new Float32Array(H)
        const histX = new Float32Array(H).fill(st.rx)
        const histY = new Float32Array(H).fill(st.ry)
        let head = 0
        const pushHist = (t: number, x: number, y: number) => {
            head = (head + 1) % H
            histT[head] = t
            histX[head] = x
            histY[head] = y
        }
        const lagAt = (sec: number): [number, number] => {
            if (still || sec <= 0) return [st.rx + st.hx, st.ry + st.hy]
            const target = st.time - sec
            let a = head
            for (let k = 0; k < H - 1; k++) {
                const b = (a - 1 + H) % H
                if (histT[b] <= target || histT[b] === 0) {
                    const span = histT[a] - histT[b]
                    const t =
                        span > 0
                            ? Math.min(
                                  1,
                                  Math.max(0, (histT[a] - target) / span)
                              )
                            : 0
                    return [
                        histX[a] + (histX[b] - histX[a]) * t,
                        histY[a] + (histY[b] - histY[a]) * t,
                    ]
                }
                a = b
            }
            return [histX[a], histY[a]]
        }

        // ── performance budget
        const coarse = window.matchMedia?.("(pointer: coarse)").matches
        let sliceCap = coarse ? 8 : 16
        let dprCap = look === "real" ? 2 : coarse ? 0.9 : 1.25
        let ema = 1 / 60
        let frames = 0

        let guideStr = ""
        let guide: [number, number, number, number] = [1, 1, 1, 0.35]

        const draw = () => {
            const pr = propsRef.current
            const dpr = Math.min(dprCap, window.devicePixelRatio || 1)
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            gl.viewport(0, 0, w, h)
            const aspect = w / h
            const half = 1 / Math.max(0.3, Math.min(1, pr.size / 100))
            const fov = 2 * Math.atan(half / (aspect >= 1 ? 1 : aspect) / CAM_Z)
            if (pr.guideColor !== guideStr) {
                guideStr = pr.guideColor
                guide = parseColor(guideStr)
            }
            renderer.draw({
                proj: perspective(fov, aspect, 0.1, 50),
                view,
                rx: st.rx + st.hx,
                ry: st.ry + st.hy,
                exp: st.exp,
                time: st.time,
                pr,
                lagAt,
                slices: sliceCap,
                guide,
            })

            const sh = shadowRef.current
            if (sh) {
                const face = Math.abs(Math.cos(st.ry + st.hy))
                sh.style.opacity = `${(1 - Math.min(1, st.exp * 1.6)) * (0.35 + 0.65 * face)}`
                sh.style.transform = `translateX(-50%) scaleX(${0.35 + 0.65 * face})`
            }
        }

        let raf = 0
        let visible = true
        let alive = true
        let last = performance.now()

        const frame = (now: number) => {
            raf = 0
            if (!alive) return
            if (now - last < 1000 / 62) {
                if (visible) raf = requestAnimationFrame(frame)
                return
            }
            const rawDt = (now - last) / 1000
            const dt = Math.min(0.05, rawDt)
            last = now
            const pr = propsRef.current
            st.time += dt

            // adaptive quality: if frames run long, shed slices / resolution
            ema = ema * 0.94 + rawDt * 0.06
            if (++frames > 90 && look === "dreamy" && ema > 1 / 38) {
                sliceCap = Math.max(6, sliceCap - 3)
                dprCap = Math.max(0.6, dprCap - 0.2)
                frames = 0
                ema = 1 / 60
            }

            if (!st.dragging) {
                const idle = (Math.PI * 2) / Math.max(1, pr.speed)
                const k = 1 - Math.exp(-dt * 1.4)
                st.vy += (idle - st.vy) * k
                st.vx += (0 - st.vx) * k
                st.ry += st.vy * dt
                st.rx += st.vx * dt
                const TAU = Math.PI * 2
                const target = BASE_X + TAU * Math.round((st.rx - BASE_X) / TAU)
                st.rx += (target - st.rx) * (1 - Math.exp(-dt * 1.6))
            }
            const kh = 1 - Math.exp(-dt * 6)
            st.hx += (st.thx - st.hx) * kh
            st.hy += (st.thy - st.hy) * kh
            pushHist(st.time, st.rx + st.hx, st.ry + st.hy)

            if (st.dir === 1) {
                st.exp = Math.min(
                    1,
                    st.exp + dt / (look === "real" ? 1.5 : 1.8)
                )
                if (st.exp >= 1) {
                    st.dir = 0
                    st.holdUntil =
                        pr.reassemble > 0
                            ? now + pr.reassemble * 1000
                            : Infinity
                }
            } else if (st.dir === -1) {
                st.exp = Math.max(0, st.exp - dt / 1.3)
                if (st.exp <= 0) st.dir = 0
            } else if (st.exp >= 1 && now >= st.holdUntil) {
                st.dir = -1
                setBroken(false)
            }

            draw()
            if (visible) raf = requestAnimationFrame(frame)
        }

        const start = () => {
            if (still || raf || !alive) return
            last = performance.now()
            raf = requestAnimationFrame(frame)
        }

        triggerRef.current = () => {
            if (still || !propsRef.current.shatter) return
            if (st.dir === 1 || (st.exp > 0 && st.dir === 0)) st.dir = -1
            else st.dir = 1
            setBroken(st.dir === 1)
            start()
        }

        let cancelled = false
        if (src) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            const apply = () => {
                if (cancelled || !img.naturalWidth) return
                try {
                    upload(
                        drawLabel(img, {
                            ...defaults.imageFraming,
                            ...propsRef.current.imageFraming,
                        })
                    )
                } catch {
                    /* CORS-tainted: keep default label */
                }
                draw()
            }
            img.onload = apply
            img.onerror = () => {
                if (cancelled) return
                // label failed to load: reset to the default label and redraw
                try {
                    upload(drawLabel(null))
                } catch {
                    /* keep the current texture */
                }
                draw()
            }
            img.src = src
            // already cached → apply right away instead of waiting a frame
            if (img.complete) apply()
        }

        const release = () => {
            renderer.release()
            gl.deleteTexture(tex)
        }

        if (still) {
            draw()
            // the editor canvas may lay the frame out after mount; redraw on resize
            const ro =
                typeof ResizeObserver !== "undefined"
                    ? new ResizeObserver(() => !cancelled && draw())
                    : null
            ro?.observe(canvas)
            return () => {
                cancelled = true
                alive = false
                ro?.disconnect()
                release()
            }
        }

        // ── pointer
        const onDown = (ev: PointerEvent) => {
            st.dragging = true
            st.lastX = st.downX = ev.clientX
            st.lastY = st.downY = ev.clientY
            st.downT = performance.now()
            st.vx = st.vy = 0
            canvas.setPointerCapture?.(ev.pointerId)
            start()
        }
        const onMove = (ev: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            if (st.dragging) {
                const s = (Math.PI * 1.3) / Math.max(200, rect.width)
                const dx = (ev.clientX - st.lastX) * s
                const dy = (ev.clientY - st.lastY) * s
                st.ry += dx
                st.rx += dy
                st.vy = st.vy * 0.6 + (dx / 0.016) * 0.4
                st.vx = st.vx * 0.6 + (dy / 0.016) * 0.4
                st.lastX = ev.clientX
                st.lastY = ev.clientY
            } else if (ev.pointerType !== "touch") {
                const tilt = (propsRef.current.tilt * Math.PI) / 180
                st.thy =
                    ((ev.clientX - rect.left) / Math.max(1, rect.width) - 0.5) *
                    tilt *
                    2
                st.thx =
                    ((ev.clientY - rect.top) / Math.max(1, rect.height) - 0.5) *
                    tilt *
                    2
            }
        }
        const onUp = (ev: PointerEvent) => {
            if (!st.dragging) return
            st.dragging = false
            const moved = Math.hypot(
                ev.clientX - st.downX,
                ev.clientY - st.downY
            )
            if (moved < 6 && performance.now() - st.downT < 350)
                triggerRef.current()
        }
        const onLeave = () => {
            st.thx = st.thy = 0
        }
        canvas.addEventListener("pointerdown", onDown)
        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("pointerup", onUp)
        canvas.addEventListener("pointercancel", onUp)
        canvas.addEventListener("pointerleave", onLeave)

        const io = new IntersectionObserver(([en]) => {
            visible = en.isIntersecting
            if (visible) start()
        })
        io.observe(canvas)

        const onLost = (ev: Event) => {
            ev.preventDefault()
            alive = false
            if (raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }
        const onRestored = () => setGlEpoch((n) => n + 1)
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
            draw()
        else start()

        return () => {
            cancelled = true
            alive = false
            if (raf) cancelAnimationFrame(raf)
            io.disconnect()
            canvas.removeEventListener("pointerdown", onDown)
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerup", onUp)
            canvas.removeEventListener("pointercancel", onUp)
            canvas.removeEventListener("pointerleave", onLeave)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            release()
        }
    }, [src, still, look, stillKey, framing, glEpoch])

    const grain = look === "dreamy" ? clamp01(p.grain / 100, 1) : 0
    const interactive = !still && !!p.shatter
    React.useEffect(() => {
        if (!interactive) setBroken(false)
    }, [interactive])
    const label = p.image?.alt || "Holographic compact disc"
    const hole = "radial-gradient(circle, transparent 0 11%, #000 11.5%)"

    return (
        <div
            className={id}
            style={{
                // auto-sized instances get no size from Framer → fall back to 480×480
                width: 480,
                height: 480,
                ...p.style,
                position: "relative",
                background: p.tint,
                overflow: "hidden",
            }}
        >
            {look === "real" && (
                <div
                    ref={shadowRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: "5%",
                        width: `${Math.round(p.size * 0.7)}%`,
                        height: "7%",
                        transform: "translateX(-50%)",
                        borderRadius: "50%",
                        background:
                            "radial-gradient(closest-side, rgba(0,0,0,0.22), rgba(0,0,0,0))",
                        filter: "blur(6px)",
                        pointerEvents: "none",
                    }}
                />
            )}
            {noGL ? (
                <div
                    role="img"
                    aria-label={label}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: `${p.size}%`,
                        aspectRatio: "1",
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        background: src
                            ? `center / cover no-repeat url(${JSON.stringify(src)})`
                            : "conic-gradient(#e9e9f1, #c9d6ff, #ffd6f0, #d6fff3, #e9e9f1)",
                        WebkitMaskImage: hole,
                        maskImage: hole,
                    }}
                />
            ) : (
            <canvas
                key={look}
                ref={canvasRef}
                role={interactive ? "button" : "img"}
                tabIndex={interactive ? 0 : -1}
                aria-pressed={interactive ? broken : undefined}
                aria-label={
                    interactive
                        ? `${label}. ${broken ? "Activate to reassemble" : "Activate to break it apart"}`
                        : label
                }
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        triggerRef.current()
                    }
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    cursor: still ? "default" : "grab",
                    touchAction: "pan-y",
                }}
            />
            )}
            <style>{`
                .${id} canvas:focus { outline: none; }
                .${id} canvas:focus-visible { outline: 2px solid #4C8BF5; outline-offset: -3px; border-radius: 4px; }
            `}</style>
            {grain > 0 && (
                <>
                    <style>{`
                        .${id} .grain { position:absolute; inset:-50%; pointer-events:none; background-image:${GRAIN_SVG}; background-size:160px 160px; mix-blend-mode:overlay; opacity:${(grain * 0.5).toFixed(3)}; ${still ? "" : `animation:${id}-g .6s steps(3) infinite;`} }
                        @keyframes ${id}-g { 0%{transform:translate(0,0)} 33%{transform:translate(-7%,4%)} 66%{transform:translate(5%,-6%)} 100%{transform:translate(0,0)} }
                        @media (prefers-reduced-motion: reduce) { .${id} .grain { animation:none; } }
                    `}</style>
                    <div className="grain" aria-hidden="true" />
                </>
            )}
        </div>
    )
}

HolographicCD.defaultProps = defaults
HolographicCD.displayName = "CD"

const isReal = (props: any) => props.look === "real"

addPropertyControls(HolographicCD, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Label Image",
        description:
            "Image printed on the front of the disc (square recommended).",
    },
    imageFraming: {
        title: "Framing",
        type: ControlType.Object,
        hidden: (props: any) => !props.image,
        controls: {
            zoom: {
                title: "Zoom",
                type: ControlType.Number,
                defaultValue: defaults.imageFraming.zoom,
                min: 50,
                max: 400,
                step: 1,
                unit: "%",
            },
            x: {
                title: "Offset X",
                type: ControlType.Number,
                defaultValue: defaults.imageFraming.x,
                min: -50,
                max: 50,
                step: 1,
                unit: "%",
            },
            y: {
                title: "Offset Y",
                type: ControlType.Number,
                defaultValue: defaults.imageFraming.y,
                min: -50,
                max: 50,
                step: 1,
                unit: "%",
            },
            rotate: {
                title: "Rotate",
                type: ControlType.Number,
                defaultValue: defaults.imageFraming.rotate,
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
            },
        },
    },
    look: {
        type: ControlType.Enum,
        title: "Look",
        options: ["dreamy", "real"],
        optionTitles: ["Dreamy", "Real"],
        defaultValue: defaults.look,
        displaySegmentedControl: true,
    },
    tint: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: defaults.tint,
    },
    holo: {
        title: "Holo",
        type: ControlType.Number,
        defaultValue: defaults.holo,
        min: 0,
        max: 150,
        unit: "%",
    },
    size: {
        title: "Disc Size",
        type: ControlType.Number,
        defaultValue: defaults.size,
        min: 30,
        max: 100,
        unit: "%",
    },

    // Dreamy
    depth: {
        title: "Thickness",
        type: ControlType.Number,
        defaultValue: defaults.depth,
        min: 0,
        max: 100,
        unit: "%",
        description: "0 = real CD thickness, 100 = thick volume.",
        hidden: isReal,
    },
    hub: {
        title: "Silver Hub",
        type: ControlType.Number,
        defaultValue: defaults.hub,
        min: 0,
        max: 100,
        unit: "%",
        description: "Silver ring (hub) and clear center.",
        hidden: isReal,
    },
    data: {
        title: "CD Shine",
        type: ControlType.Number,
        defaultValue: defaults.data,
        min: 0,
        max: 150,
        unit: "%",
        description: "Rainbow diffraction from the inner reflective layer.",
        hidden: isReal,
    },
    roundness: {
        title: "Roundness",
        type: ControlType.Number,
        defaultValue: defaults.roundness,
        min: 0,
        max: 100,
        unit: "%",
        description: "How much the volume edges are rounded.",
        hidden: isReal,
    },
    frost: {
        title: "Frost",
        type: ControlType.Number,
        defaultValue: defaults.frost,
        min: 0,
        max: 150,
        unit: "%",
        description: "Milky translucent rim around the edges.",
        hidden: isReal,
    },
    blur: {
        title: "Inner Blur",
        type: ControlType.Number,
        defaultValue: defaults.blur,
        min: 0,
        max: 100,
        unit: "%",
        description: "How much the inside of the volume blurs.",
        hidden: isReal,
    },
    density: {
        title: "Density",
        type: ControlType.Number,
        defaultValue: defaults.density,
        min: 0,
        max: 150,
        unit: "%",
        hidden: isReal,
    },
    glow: {
        title: "Glow",
        type: ControlType.Number,
        defaultValue: defaults.glow,
        min: 0,
        max: 200,
        unit: "%",
        hidden: isReal,
    },
    grain: {
        title: "Grain",
        type: ControlType.Number,
        defaultValue: defaults.grain,
        min: 0,
        max: 100,
        unit: "%",
        hidden: isReal,
    },
    guides: {
        title: "Wire Case",
        type: ControlType.Boolean,
        defaultValue: defaults.guides,
        hidden: isReal,
    },
    guideColor: {
        title: "Wire Color",
        type: ControlType.Color,
        defaultValue: defaults.guideColor,
        hidden: (props: any) => isReal(props) || !props.guides,
    },

    speed: {
        title: "Spin (s)",
        type: ControlType.Number,
        defaultValue: defaults.speed,
        min: 1,
        max: 60,
        step: 1,
        description: "Time for one full rotation.",
    },
    tilt: {
        title: "Hover Tilt",
        type: ControlType.Number,
        defaultValue: defaults.tilt,
        min: 0,
        max: 35,
        unit: "°",
    },
    shatter: {
        title: "Click",
        type: ControlType.Boolean,
        defaultValue: defaults.shatter,
        enabledTitle: "Break",
        disabledTitle: "Off",
        description: "Real shatters into shards, Dreamy dissolves like mist.",
    },
    reassemble: {
        title: "Reassemble",
        type: ControlType.Number,
        defaultValue: defaults.reassemble,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "s",
        description: "0 = restore on the next click.",
        hidden: (props: any) => !props.shatter,
    },
})
