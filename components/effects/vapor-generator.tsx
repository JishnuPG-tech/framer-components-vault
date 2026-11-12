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


const { useEffect, useLayoutEffect, useMemo, useRef, useState } = React

/* ------------------------------------------------------------------ *
 * Vapor — GPU cloud / fog / mist / steam generator
 *
 * Single fullscreen triangle + fBm gradient noise fragment shader.
 * No textures, no libraries, no allocations in the render loop.
 *
 * Precision strategy (important — this is what keeps it stable):
 *  - Noise is PERIODIC (period 256 lattice cells) so the wind offset can
 *    be wrapped in JS with zero visible seam and coordinates never grow.
 *  - Lacunarity is exactly 2.0 with 90° per-octave rotation, so the wrap
 *    stays an exact multiple of the period through every octave.
 *  - "Evolve" is a circular drift driven by a phase wrapped at 2π, so
 *    time never grows either. The effect can run for hours without
 *    float32 breakdown or a visible jump.
 * ------------------------------------------------------------------ */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const TAU = Math.PI * 2
// Noise lattice period — must match P in the shader.
const PERIOD = 256
// Wind-offset wrap. 512 rather than 256 because the warp and depth layers
// sample the offset at 0.5x; 512 lands on a multiple of PERIOD at every
// octave AND at those half scales, so no layer shows a seam on wrap.
const WRAP = 512
const MAX_PIXELS = 1_200_000
// Framer has no min-size annotation, so this is enforced in CSS below.
const MIN_SIZE = 40

// Follows `target` using a Framer ControlType.Transition object. Handles the
// stiffness/damping form, the duration/bounce form, and tween/ease by treating
// duration as a time constant. Substepped so a dropped frame can't explode it.
function stepFollow(
    s: { x: number; v: number },
    target: number,
    dt: number,
    tr: any
) {
    const t = tr || {}
    const type = t.type || "spring"

    if (type === "tween" || type === "keyframes") {
        const dur = Math.max(
            0.016,
            typeof t.duration === "number" ? t.duration : 0.3
        )
        s.x += (target - s.x) * (1 - Math.exp((-dt * 3.2) / dur))
        s.v = 0
        return
    }

    const mass = typeof t.mass === "number" && t.mass > 0 ? t.mass : 1
    let stiffness = typeof t.stiffness === "number" ? t.stiffness : null
    let damping = typeof t.damping === "number" ? t.damping : null

    if (stiffness === null) {
        const dur = Math.max(
            0.05,
            typeof t.duration === "number" ? t.duration : 0.8
        )
        const bounce = typeof t.bounce === "number" ? t.bounce : 0.25
        const w = (2 * Math.PI) / dur
        stiffness = w * w * mass
        damping = 2 * clamp(1 - bounce, 0.05, 1) * Math.sqrt(stiffness * mass)
    }
    if (damping === null) damping = 2 * Math.sqrt(stiffness * mass)

    const steps = clamp(Math.ceil(dt / (1 / 120)), 1, 8)
    const h = dt / steps
    for (let i = 0; i < steps; i++) {
        s.v += ((-stiffness * (s.x - target) - damping * s.v) / mass) * h
        s.x += s.v * h
    }
}

type RGB = [number, number, number]
type RGBA = [number, number, number, number]

/* ---------------------------- color ------------------------------- */

let parseEl: HTMLCanvasElement | null = null
const colorCache = new Map<string, RGBA>()

function parseColor(input?: string): RGBA {
    if (!input) return [1, 1, 1, 1]
    const hit = colorCache.get(input)
    if (hit) return hit
    let out: RGBA = [1, 1, 1, 1]
    try {
        if (typeof document !== "undefined") {
            if (!parseEl) parseEl = document.createElement("canvas")
            const ctx = parseEl.getContext("2d")
            if (ctx) {
                ctx.fillStyle = "#ffffff"
                ctx.fillStyle = input
                const n = String(ctx.fillStyle)
                if (n.charAt(0) === "#") {
                    const h =
                        n.length === 4
                            ? n
                                  .slice(1)
                                  .split("")
                                  .map((c) => c + c)
                                  .join("")
                            : n.slice(1)
                    out = [
                        parseInt(h.slice(0, 2), 16) / 255,
                        parseInt(h.slice(2, 4), 16) / 255,
                        parseInt(h.slice(4, 6), 16) / 255,
                        1,
                    ]
                } else {
                    const m = n.match(/[-\d.]+/g)
                    if (m && m.length >= 3) {
                        out = [
                            Number(m[0]) / 255,
                            Number(m[1]) / 255,
                            Number(m[2]) / 255,
                            m.length > 3 ? Number(m[3]) : 1,
                        ]
                    }
                }
            }
        }
    } catch (e) {}
    colorCache.set(input, out)
    return out
}

// Tint that preserves the palette's internal luminance structure.
function applyTint(c: RGB, tint: RGB, amount: number): RGB {
    if (amount <= 0.001) return c
    const lc = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    const lt = 0.2126 * tint[0] + 0.7152 * tint[1] + 0.0722 * tint[2]
    const k = lt > 0.004 ? clamp(lc / lt, 0, 4) : 0
    return [
        lerp(c[0], tint[0] * k, amount),
        lerp(c[1], tint[1] * k, amount),
        lerp(c[2], tint[2] * k, amount),
    ]
}

/* ---------------------------- presets ----------------------------- */

type Preset = {
    scale: number
    form: number // -1 wide/flat  →  +1 tall/rising
    coverage: number
    softness: number
    contrast: number
    detail: number
    wispiness: number
    warp: number
    depth: number
    direction: number // 0 = up, 90 = right
    drift: number
    evolve: number
    concentration: number
    anchor: number
    spread: number
    feather: [number, number, number, number] // top right bottom left
    radial: number
    light: boolean
    lightAngle: number
    lightDistance: number
    lightStrength: number
    ambient: number
    glow: number
    lightColor: string
    colors: [string, string, string]
    opacity: number
    grain: number
    blend: string
}

const PRESETS: Record<string, Preset> = {
    clouds: {
        scale: 2.1,
        form: -0.3,
        coverage: 0.52,
        softness: 0.16,
        contrast: 1.0,
        detail: 5,
        wispiness: 0.1,
        warp: 0.35,
        depth: 0.45,
        direction: 90,
        drift: 0.35,
        evolve: 0.05,
        concentration: 0.25,
        anchor: 0.35,
        spread: 0.9,
        feather: [0.04, 0.1, 0.45, 0.1],
        radial: 0,
        light: true,
        lightAngle: 25,
        lightDistance: 0.35,
        lightStrength: 1.0,
        ambient: 0.34,
        glow: 0.22,
        lightColor: "#fff6e8",
        colors: ["#5b6880", "#c8d3e5", "#ffffff"],
        opacity: 1,
        grain: 0.03,
        blend: "normal",
    },
    fog: {
        scale: 1.4,
        form: -0.8,
        coverage: 0.62,
        softness: 0.4,
        contrast: 0.9,
        detail: 4,
        wispiness: 0,
        warp: 0.5,
        depth: 0.3,
        direction: 95,
        drift: 0.2,
        evolve: 0.03,
        concentration: 0.75,
        anchor: 0.86,
        spread: 0.55,
        feather: [0.55, 0.08, 0.02, 0.08],
        radial: 0,
        light: true,
        lightAngle: 40,
        lightDistance: 0.28,
        lightStrength: 0.45,
        ambient: 0.68,
        glow: 0.1,
        lightColor: "#ffffff",
        colors: ["#8b939d", "#c7cdd5", "#eff2f6"],
        opacity: 0.92,
        grain: 0.04,
        blend: "normal",
    },
    mist: {
        scale: 2.9,
        form: -0.5,
        coverage: 0.44,
        softness: 0.5,
        contrast: 1.35,
        detail: 5,
        wispiness: 0.25,
        warp: 0.65,
        depth: 0.35,
        direction: 78,
        drift: 0.28,
        evolve: 0.07,
        concentration: 0.55,
        anchor: 0.76,
        spread: 0.62,
        feather: [0.5, 0.12, 0.05, 0.12],
        radial: 0,
        light: true,
        lightAngle: 30,
        lightDistance: 0.3,
        lightStrength: 0.6,
        ambient: 0.58,
        glow: 0.16,
        lightColor: "#f4fbff",
        colors: ["#9fb0bd", "#dfe8ef", "#ffffff"],
        opacity: 0.72,
        grain: 0.05,
        blend: "normal",
    },
    steam: {
        scale: 3.3,
        form: 0.6,
        coverage: 0.37,
        softness: 0.4,
        contrast: 1.55,
        detail: 5,
        wispiness: 0.5,
        warp: 0.8,
        depth: 0.25,
        direction: 4,
        drift: 0.5,
        evolve: 0.13,
        concentration: 0.68,
        anchor: 0.92,
        spread: 0.78,
        feather: [0.35, 0.24, 0.06, 0.24],
        radial: 0,
        light: true,
        lightAngle: 20,
        lightDistance: 0.26,
        lightStrength: 0.7,
        ambient: 0.5,
        glow: 0.2,
        lightColor: "#ffffff",
        colors: ["#b3bec6", "#e7eef1", "#ffffff"],
        opacity: 0.7,
        grain: 0.05,
        blend: "normal",
    },
    smoke: {
        scale: 2.5,
        form: 0.4,
        coverage: 0.46,
        softness: 0.3,
        contrast: 1.45,
        detail: 6,
        wispiness: 0.62,
        warp: 1.0,
        depth: 0.4,
        direction: 12,
        drift: 0.4,
        evolve: 0.11,
        concentration: 0.5,
        anchor: 0.9,
        spread: 0.85,
        feather: [0.3, 0.2, 0.04, 0.2],
        radial: 0,
        light: true,
        lightAngle: 35,
        lightDistance: 0.3,
        lightStrength: 0.85,
        ambient: 0.22,
        glow: 0.12,
        lightColor: "#d8dee6",
        colors: ["#12141a", "#3a414b", "#8d96a1"],
        opacity: 0.9,
        grain: 0.06,
        blend: "normal",
    },
    haze: {
        scale: 0.9,
        form: -0.7,
        coverage: 0.7,
        softness: 0.6,
        contrast: 0.8,
        detail: 3,
        wispiness: 0,
        warp: 0.2,
        depth: 0,
        direction: 90,
        drift: 0.14,
        evolve: 0.02,
        concentration: 0.45,
        anchor: 0.6,
        spread: 0.95,
        feather: [0.3, 0.05, 0.3, 0.05],
        radial: 0,
        light: true,
        lightAngle: 55,
        lightDistance: 0.22,
        lightStrength: 0.35,
        ambient: 0.78,
        glow: 0.4,
        lightColor: "#ffd9a8",
        colors: ["#c3a184", "#e6d2bb", "#fff5e8"],
        opacity: 0.55,
        grain: 0.04,
        blend: "screen",
    },
    nebula: {
        scale: 1.7,
        form: 0.05,
        coverage: 0.5,
        softness: 0.26,
        contrast: 1.3,
        detail: 6,
        wispiness: 0.35,
        warp: 1.2,
        depth: 0.6,
        direction: 55,
        drift: 0.16,
        evolve: 0.045,
        concentration: 0.12,
        anchor: 0.5,
        spread: 1,
        feather: [0.25, 0.2, 0.25, 0.2],
        radial: 0.35,
        light: true,
        lightAngle: 300,
        lightDistance: 0.42,
        lightStrength: 1.2,
        ambient: 0.16,
        glow: 0.65,
        lightColor: "#ffd4f2",
        colors: ["#22093f", "#7a2ff2", "#ff96dc"],
        opacity: 0.95,
        grain: 0.05,
        blend: "screen",
    },
}

const TYPE_ALIASES: Record<string, keyof typeof PRESETS> = {
    cloud: "clouds",
    clouds: "clouds",
    cloudy: "clouds",
    cumulus: "clouds",
    sky: "clouds",
    fog: "fog",
    foggy: "fog",
    "ground fog": "fog",
    mist: "mist",
    misty: "mist",
    drizzle: "mist",
    steam: "steam",
    vapor: "steam",
    vapour: "steam",
    humid: "steam",
    smoke: "smoke",
    smokey: "smoke",
    smoky: "smoke",
    soot: "smoke",
    haze: "haze",
    hazy: "haze",
    dust: "haze",
    smog: "haze",
    nebula: "nebula",
    cosmic: "nebula",
    space: "nebula",
    aurora: "nebula",
}

function resolveType(enumValue: string, cms?: string): keyof typeof PRESETS {
    if (cms && typeof cms === "string" && cms.trim()) {
        const key = cms.trim().toLowerCase().replace(/[_-]+/g, " ")
        if (TYPE_ALIASES[key]) return TYPE_ALIASES[key]
        const found = Object.keys(TYPE_ALIASES).find(
            (k) => key.indexOf(k) !== -1
        )
        if (found) return TYPE_ALIASES[found]
    }
    return (PRESETS[enumValue] ? enumValue : "fog") as keyof typeof PRESETS
}

/* --------------------------- quality ------------------------------ */

type Tier = "high" | "balanced" | "low"

const TIERS: Record<
    Tier,
    {
        scale: number
        octaves: number
        lightOctaves: number
        fps: number
        depth: boolean
    }
> = {
    high: { scale: 1, octaves: 7, lightOctaves: 3, fps: 60, depth: true },
    balanced: { scale: 0.8, octaves: 5, lightOctaves: 2, fps: 60, depth: true },
    low: { scale: 0.55, octaves: 4, lightOctaves: 2, fps: 30, depth: false },
}

function detectTier(): Tier {
    if (typeof window === "undefined") return "balanced"
    const nav = navigator as any
    const cores = nav.hardwareConcurrency || 4
    const mem = nav.deviceMemory || 4
    if (nav.connection && nav.connection.saveData) return "low"
    const coarse =
        window.matchMedia &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches
    const small = window.innerWidth < 900
    if (coarse || small) return cores >= 8 && mem >= 6 ? "balanced" : "low"
    return cores >= 8 ? "high" : "balanced"
}

/* ---------------------------- shader ------------------------------ */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const NOISE = `
const float P = ${PERIOD}.0;
vec2 hash2(vec2 i) {
  i = mod(i, P);
  vec2 k = vec2(dot(i, vec2(127.1, 311.7)), dot(i, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(k) * 43758.5453);
}
float gnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash2(i), f);
  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float hash1(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}`

// Octave count is baked in as a literal: constant loop bounds are cheaper
// than a dynamic break, and lacunarity 2.0 + 90° rotation keeps the
// 256-cell period exact through every level.
const fbm = (name: string, oct: number) => `
float ${name}(vec2 p, vec2 dr) {
  float amp = 0.5, sum = 0.0, norm = 0.0;
  // Field is exactly periodic, so folding the domain is free of artifacts and
  // keeps coordinates small enough that fract() never quantizes.
  p = mod(p, P);
  for (int i = 0; i < ${oct}; i++) {
    float n = gnoise(p + dr);
    n = mix(n, 1.0 - 2.0 * abs(n), u_flow.z);
    sum += amp * n;
    norm += amp;
    p = mod(vec2(p.y, -p.x) * 2.0 + vec2(19.0, 47.0), P);
    dr = vec2(dr.y, -dr.x) * 1.32;
    amp *= 0.5;
  }
  return clamp(0.5 + 0.5 * sum / norm, 0.0, 1.0);
}`

type ShaderOpts = {
    oct: number
    lightOct: number
    backOct: number
    warp: boolean
    light: boolean
    glow: boolean
    grain: boolean
    depth: boolean
    pointer: boolean
}

function shaderKeyOf(o: ShaderOpts) {
    return [
        o.oct,
        o.lightOct,
        o.backOct,
        o.warp ? 1 : 0,
        o.light ? 1 : 0,
        o.glow ? 1 : 0,
        o.grain ? 1 : 0,
        o.depth ? 1 : 0,
        o.pointer ? 1 : 0,
    ].join(":")
}

function buildFragment(o: ShaderOpts) {
    return `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform vec2 u_res;
uniform vec2 u_phase;  // drift phase (radians), grain amount
uniform vec4 u_flow;   // offX, offY, wispiness, driftRadius
uniform vec4 u_geo;    // scale, stretchX, stretchY, warp
uniform vec4 u_shape;  // threshold, softness, contrast, intensity
uniform vec4 u_mask;   // feather T R B L
uniform vec4 u_mask2;  // concentration, anchor, spread, radial
uniform vec4 u_light2; // ambient, glow, sunX, sunY
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_lc;
${o.light ? "uniform vec4 u_light;  // dirX, dirY, strength, distance" : ""}
${o.depth ? "uniform vec4 u_back;   // scaleMul, opacity, offsetMul, thresholdShift" : ""}
${o.pointer ? "uniform vec4 u_ptr;    // x, y, strength, falloff" : ""}
${NOISE}
${fbm("fbmMain", o.oct)}
${o.light ? fbm("fbmLight", o.lightOct) : ""}
${o.depth ? fbm("fbmBack", o.backOct) : ""}

float shapeIt(float d, float shift) {
  float e = max(u_shape.y, 0.002);
  float t = u_shape.x + shift;
  return pow(smoothstep(t - e, t + e, d), u_shape.z);
}

void main() {
  vec2 uv = v_uv;
  float aspect = max(u_res.x, 1.0) / max(u_res.y, 1.0);
  vec2 pos = vec2(uv.x * aspect, uv.y);
${
    o.pointer
        ? `
  vec2 pv = pos - vec2(u_ptr.x * aspect, u_ptr.y);
  // Sign of u_ptr.z decides the direction: positive pushes the domain away
  // from the cursor, negative draws it in. The gaussian falls to zero at the
  // cursor itself, so an inward pull has no singularity at the centre.
  // u_ptr.w is 1/radius^2, so the falloff reaches 1/e exactly at the radius.
  pos += pv * exp(-dot(pv, pv) * u_ptr.w) * u_ptr.z;`
        : ""
}
  vec2 q = pos * u_geo.x * vec2(u_geo.y, u_geo.z) + u_flow.xy;

  // Bounded circular drift: never grows, never loses precision.
  vec2 dr = u_flow.w * vec2(cos(u_phase.x), sin(u_phase.x));
${
    o.warp
        ? `
  vec2 wq = q * 0.5;
  vec2 w = vec2(gnoise(wq + dr * 1.6), gnoise(wq + vec2(31.0, 17.0) - dr * 1.4));
  q += w * u_geo.w;`
        : ""
}
  float raw = fbmMain(q, dr);
  float d = shapeIt(raw, 0.0);

  float lit = 1.0;
${
    o.light
        ? `
  float dl = fbmLight(q + u_light.xy * u_light.w, dr);
  lit = exp(-max(0.0, dl - raw) * u_light.z * 9.0);`
        : ""
}
  lit = u_light2.x + (1.0 - u_light2.x) * lit;

  vec3 col = mix(u_c0, u_c1, smoothstep(0.0, 0.85, raw));
  col = mix(col, u_c2, smoothstep(0.28, 1.0, lit));

  float m = smoothstep(0.0, max(u_mask.x, 0.001), uv.y);
  m *= smoothstep(0.0, max(u_mask.z, 0.001), 1.0 - uv.y);
  m *= smoothstep(0.0, max(u_mask.w, 0.001), uv.x);
  m *= smoothstep(0.0, max(u_mask.y, 0.001), 1.0 - uv.x);
  float band = 1.0 - smoothstep(0.0, 1.0, abs(uv.y - u_mask2.y) / max(u_mask2.z, 0.002));
  m *= mix(1.0, band, u_mask2.x);
  float r = length((uv - 0.5) * vec2(aspect, 1.0));
  m *= mix(1.0, 1.0 - smoothstep(0.16, 0.64, r), u_mask2.w);

  float a = clamp(d * u_shape.w * m, 0.0, 1.0);
  vec3 rgb = col;
${
    o.depth
        ? `
  vec2 qb = pos * u_geo.x * u_back.x * vec2(u_geo.y, u_geo.z)
          + u_flow.xy * u_back.z + vec2(53.0, 11.0);
  float rawB = fbmBack(qb, dr * 0.7);
  float ab = clamp(shapeIt(rawB, u_back.w) * u_shape.w * u_back.y * m, 0.0, 1.0);
  vec3 colB = mix(u_c0, u_c1, smoothstep(0.0, 0.95, rawB));
  vec3 pre = rgb * a + colB * ab * (1.0 - a);
  a = a + ab * (1.0 - a);
  rgb = a > 0.0015 ? pre / a : rgb;`
        : ""
}
  rgb *= u_lc;
${
    o.glow
        ? `
  float g = exp(-length((uv - u_light2.zw) * vec2(aspect, 1.0)) * 3.0);
  rgb += u_lc * g * u_light2.y * (0.25 + 0.75 * d);
  a = clamp(a + g * u_light2.y * 0.22 * m, 0.0, 1.0);`
        : ""
}
${
    o.grain
        ? `
  float gr = hash1(gl_FragCoord.xy + fract(u_phase.x * 7.0)) - 0.5;
  rgb += gr * u_phase.y * 0.32;`
        : ""
}
  a = clamp(a + (hash1(gl_FragCoord.xy * 1.37) - 0.5) * 0.004, 0.0, 1.0);
  gl_FragColor = vec4(clamp(rgb, 0.0, 6.0) * a, a);
}`
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("[Vapor] shader error:", gl.getShaderInfoLog(sh))
        gl.deleteShader(sh)
        return null
    }
    return sh
}

const UNIFORMS = [
    "u_res",
    "u_phase",
    "u_flow",
    "u_geo",
    "u_shape",
    "u_mask",
    "u_mask2",
    "u_light",
    "u_light2",
    "u_back",
    "u_c0",
    "u_c1",
    "u_c2",
    "u_lc",
    "u_ptr",
]

/* --------------------------- defaults ----------------------------- */

const D_APPEARANCE = {
    palette: "preset",
    shadowColor: "#5b6880",
    midColor: "#c8d3e5",
    highlightColor: "#ffffff",
    grain: -1,
    blendMode: "auto",
}
const D_SHAPE = {
    values: "preset",
    scale: 2,
    coverage: 0.55,
    softness: 0.3,
    contrast: 1,
    detail: 5,
    wispiness: 0.2,
    warp: 0.5,
    depth: 0.35,
    form: -0.3,
}
const D_MOTION = {
    values: "preset",
    direction: 90,
    drift: 0.3,
    evolve: 0.06,
}
const D_INTERACT = {
    scroll: 0,
    scrollAngle: 0,
    scrollRange: "page",
    scrollTransition: { type: "spring", stiffness: 90, damping: 24, mass: 1 },
    cursor: 0,
    cursorRadius: 0.3,
    cursorOnTouch: false,
    tilt: 0,
    tiltAxis: "both",
    tiltInvert: false,
    tiltAsk: false,
}
const D_LIGHTING = {
    enabled: true,
    values: "preset",
    angle: 25,
    distance: 0.34,
    strength: 1,
    ambient: 0.35,
    glow: 0.25,
    color: "#fff6e8",
}
const D_MASK = {
    values: "preset",
    top: 0.1,
    right: 0.1,
    bottom: 0.4,
    left: 0.1,
    concentration: 0.4,
    anchor: 0.7,
    spread: 0.7,
    radial: 0,
}
const D_PERF = {
    quality: "auto",
    maxPixelRatio: 1.5,
    fpsLimit: "auto",
    pauseOffscreen: true,
    adaptive: true,
    reducedMotion: true,
}

interface Props {
    active?: boolean
    vaporType?: string
    cmsType?: string
    intensity?: number
    speed?: number
    tint?: string
    seed?: number
    appearance?: Partial<typeof D_APPEARANCE>
    shape?: Partial<typeof D_SHAPE>
    motion?: Partial<typeof D_MOTION>
    interaction?: Partial<typeof D_INTERACT>
    lighting?: Partial<typeof D_LIGHTING>
    mask?: Partial<typeof D_MASK>
    performance?: Partial<typeof D_PERF>
    style?: React.CSSProperties
}

const useIsoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect

/* -------------------------- component ----------------------------- */

/**
 * Vapor
 *
 * Minimum rendered size is enforced at 40x40 in CSS. Framer exposes no
 * min-size annotation, so minWidth/minHeight on the root is the only way.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 480
 * @framerDisableUnlink
 */
export default function Vapor(props: Props) {
    const {
        active = true,
        vaporType = "fog",
        cmsType = "",
        intensity = 1,
        speed = 1,
        tint = "rgba(0,0,0,0)",
        seed = 1,
        style,
    } = props

    const appearance = { ...D_APPEARANCE, ...(props.appearance || {}) }
    const shape = { ...D_SHAPE, ...(props.shape || {}) }
    const motion = { ...D_MOTION, ...(props.motion || {}) }
    const interaction = { ...D_INTERACT, ...(props.interaction || {}) }
    const lighting = { ...D_LIGHTING, ...(props.lighting || {}) }
    const mask = { ...D_MASK, ...(props.mask || {}) }
    const perf = { ...D_PERF, ...(props.performance || {}) }

    // Framer requires this: true on the canvas, during export, and for
    // thumbnails. Every animation and continuous effect below is gated on it,
    // which keeps the editor responsive and stops exports from tiling a
    // half-animated frame.
    const isStaticRenderer = useIsStaticRenderer()

    const preset = PRESETS[resolveType(vaporType, cmsType)]

    /* ---- resolve every parameter (preset vs. custom) ---- */
    const p = useMemo(() => {
        const useShape = shape.values === "custom"
        const useMask = mask.values === "custom"
        const useMotion = motion.values === "custom"
        const useLight = lighting.values === "custom"
        const usePalette = appearance.palette === "custom"

        const scale = useShape ? shape.scale : preset.scale
        const form = useShape ? shape.form : preset.form
        const coverage = useShape ? shape.coverage : preset.coverage
        const softness = useShape ? shape.softness : preset.softness
        const contrast = useShape ? shape.contrast : preset.contrast
        const detail = Math.round(useShape ? shape.detail : preset.detail)
        const wispiness = useShape ? shape.wispiness : preset.wispiness
        const warp = useShape ? shape.warp : preset.warp
        const depth = useShape ? shape.depth : preset.depth

        const direction = useMotion ? motion.direction : preset.direction
        const drift = useMotion ? motion.drift : preset.drift
        const evolve = useMotion ? motion.evolve : preset.evolve

        const lightOn = lighting.enabled
        const lightAngle = useLight ? lighting.angle : preset.lightAngle
        const lightDistance = useLight
            ? lighting.distance
            : preset.lightDistance
        const lightStrength = useLight
            ? lighting.strength
            : preset.lightStrength
        const ambient = useLight ? lighting.ambient : preset.ambient
        const glow = useLight ? lighting.glow : preset.glow
        const lightColorStr = useLight ? lighting.color : preset.lightColor

        const feather: [number, number, number, number] = useMask
            ? [mask.top, mask.right, mask.bottom, mask.left]
            : preset.feather
        const concentration = useMask
            ? mask.concentration
            : preset.concentration
        const anchor = useMask ? mask.anchor : preset.anchor
        const spread = useMask ? mask.spread : preset.spread
        const radial = useMask ? mask.radial : preset.radial

        const src = usePalette
            ? ([
                  appearance.shadowColor,
                  appearance.midColor,
                  appearance.highlightColor,
              ] as [string, string, string])
            : preset.colors

        const t = parseColor(tint)
        const tintRGB: RGB = [t[0], t[1], t[2]]
        const tintAmt = clamp(t[3], 0, 1)
        const cols = src.map((c) => {
            const rgba = parseColor(c)
            return applyTint([rgba[0], rgba[1], rgba[2]], tintRGB, tintAmt)
        }) as [RGB, RGB, RGB]

        const lcRaw = parseColor(lightColorStr)
        const lc: RGB = [lcRaw[0], lcRaw[1], lcRaw[2]]

        const grain = appearance.grain < 0 ? preset.grain : appearance.grain
        const blend =
            appearance.blendMode === "auto"
                ? preset.blend
                : appearance.blendMode

        // form: negative = wide horizontal banks, positive = rising columns
        const stretchX = 1 + Math.max(0, form) * 1.5
        const stretchY = 1 + Math.max(0, -form) * 2.2

        return {
            scale,
            stretchX,
            stretchY,
            threshold: lerp(0.86, 0.16, clamp(coverage, 0, 1)),
            softness: lerp(0.02, 0.45, clamp(softness, 0, 1)),
            contrast,
            detail,
            wispiness,
            warp,
            depth,
            direction,
            drift,
            evolve,
            intensity: clamp(intensity, 0, 4) * preset.opacity,
            lightOn,
            lightAngle,
            lightDistance,
            lightStrength,
            ambient,
            glow,
            lc,
            cols,
            feather,
            concentration,
            anchor,
            spread,
            radial,
            grain,
            blend,
        }
    }, [
        preset,
        JSON.stringify(shape),
        JSON.stringify(mask),
        JSON.stringify(motion),
        JSON.stringify(lighting),
        JSON.stringify(appearance),
        tint,
        intensity,
    ])

    /* ---- quality resolution ---- */
    const [tier, setTier] = useState<Tier>("balanced")
    const [degrade, setDegrade] = useState(0)

    useIsoLayout(() => {
        if (perf.quality === "auto") setTier(detectTier())
        else if (perf.quality === "static") setTier("low")
        else setTier(perf.quality as Tier)
        setDegrade(0)
    }, [perf.quality])

    const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const isStatic =
        isStaticRenderer ||
        perf.quality === "static" ||
        (perf.reducedMotion && prefersReduced)

    const tierCfg = TIERS[tier]
    const octaves = clamp(Math.min(p.detail, tierCfg.octaves) - degrade, 2, 7)
    const renderScale =
        tierCfg.scale * (degrade === 1 ? 0.8 : degrade >= 2 ? 0.6 : 1)
    const depthOn = p.depth > 0.01 && tierCfg.depth && degrade < 2
    const coarse =
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(pointer: coarse)").matches

    const pointerOn =
        p.intensity > 0 &&
        Math.abs(interaction.cursor) > 0.001 &&
        !isStatic &&
        (interaction.cursorOnTouch || !coarse)

    // Tilt is coarse-pointer only: a Surface or a gyro-equipped laptop
    // reporting orientation while someone types is not the intent.
    const tiltOn =
        active &&
        interaction.tilt > 0.001 &&
        coarse &&
        !(perf.reducedMotion && prefersReduced)

    const opts: ShaderOpts = {
        oct: octaves,
        lightOct: Math.min(tierCfg.lightOctaves, octaves),
        backOct: clamp(octaves - 2, 2, 4),
        warp: p.warp > 0.01,
        light: p.lightOn && p.lightStrength > 0.01,
        glow: p.glow > 0.01,
        grain: p.grain > 0.005,
        depth: depthOn,
        pointer: pointerOn,
    }
    const shaderKey = shaderKeyOf(opts)

    const fpsCap =
        perf.fpsLimit === "auto"
            ? tierCfg.fps
            : parseInt(String(perf.fpsLimit), 10)

    /* ---- refs ---- */
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const progRef = useRef<WebGLProgram | null>(null)
    const uniRef = useRef<Record<string, WebGLUniformLocation | null>>({})
    const bufRef = useRef<WebGLBuffer | null>(null)
    const sizeRef = useRef({ w: 1, h: 1 })
    const offRef = useRef({ x: 0, y: 0 })
    // Derived from the seed rather than random so server and client agree and
    // marketplace screenshots are reproducible.
    const phaseRef = useRef(
        (((Math.abs(seed || 0) * 2.399963) % TAU) + TAU) % TAU
    )
    const ptrRef = useRef({ x: 0.5, y: 0.5, cx: 0.5, cy: 0.5 })
    // x/y are the live normalized tilt, sx/sy the smoothed values actually
    // drawn. bx/by hold the neutral pose captured from the first reading.
    const tiltRef = useRef({
        x: 0,
        y: 0,
        sx: 0,
        sy: 0,
        based: false,
        bx: 0,
        by: 0,
    })
    const runningRef = useRef(false)
    const interRef = useRef(interaction)
    interRef.current = interaction
    const scrollRef = useRef({
        top: 0,
        height: 1,
        progress: 0,
        doc: 1,
        docAt: 0,
    })
    const scrollSpringRef = useRef({ x: 0, v: 0 })
    const lastRef = useRef(0)
    const rafRef = useRef(0)
    const pendingRef = useRef(false)
    const emaRef = useRef(16)
    const framesRef = useRef(0)
    const drawRef = useRef<() => void>(() => {})
    const paramsRef = useRef(p)
    paramsRef.current = p
    const [failed, setFailed] = useState(false)

    /* ---- seeded start offset (integer keeps the lattice phase clean) ---- */
    const seedOffset = useMemo(() => {
        const s = Math.abs(Math.round(seed || 0))
        return { x: (s * 37) % WRAP, y: (s * 91 + 13) % WRAP }
    }, [seed])

    useIsoLayout(() => {
        offRef.current.x = seedOffset.x
        offRef.current.y = seedOffset.y
    }, [seedOffset])

    /* ---- context creation ---- */
    useIsoLayout(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const attrs: WebGLContextAttributes = {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: "low-power",
            failIfMajorPerformanceCaveat: false,
        }
        const gl = (canvas.getContext("webgl", attrs) ||
            canvas.getContext(
                "experimental-webgl",
                attrs
            )) as WebGLRenderingContext | null
        if (!gl) {
            setFailed(true)
            return
        }
        glRef.current = gl
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        bufRef.current = buf
        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.clearColor(0, 0, 0, 0)

        const onLost = (e: Event) => {
            e.preventDefault()
            cancelAnimationFrame(rafRef.current)
        }
        canvas.addEventListener("webglcontextlost", onLost)

        return () => {
            canvas.removeEventListener("webglcontextlost", onLost)
            cancelAnimationFrame(rafRef.current)
            if (progRef.current) gl.deleteProgram(progRef.current)
            if (bufRef.current) gl.deleteBuffer(bufRef.current)
            progRef.current = null
            bufRef.current = null
            glRef.current = null
            const ext = gl.getExtension("WEBGL_lose_context")
            if (ext) ext.loseContext()
        }
    }, [])

    /* ---- program build / rebuild ---- */
    useIsoLayout(() => {
        const gl = glRef.current
        if (!gl) return
        const vs = compile(gl, gl.VERTEX_SHADER, VERT)
        const fs = compile(gl, gl.FRAGMENT_SHADER, buildFragment(opts))
        if (!vs || !fs) {
            setFailed(true)
            return
        }
        const prog = gl.createProgram()
        if (!prog) return
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        gl.deleteShader(vs)
        gl.deleteShader(fs)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.warn("[Vapor] link error:", gl.getProgramInfoLog(prog))
            gl.deleteProgram(prog)
            setFailed(true)
            return
        }
        if (progRef.current) gl.deleteProgram(progRef.current)
        progRef.current = prog
        gl.useProgram(prog)
        const loc = gl.getAttribLocation(prog, "a_pos")
        gl.bindBuffer(gl.ARRAY_BUFFER, bufRef.current)
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const map: Record<string, WebGLUniformLocation | null> = {}
        for (const name of UNIFORMS)
            map[name] = gl.getUniformLocation(prog, name)
        uniRef.current = map
    }, [shaderKey])

    /* ---- draw ---- */
    drawRef.current = () => {
        const gl = glRef.current
        const prog = progRef.current
        if (!gl || !prog || gl.isContextLost()) return
        const u = uniRef.current
        const cur = paramsRef.current
        const { w, h } = sizeRef.current

        gl.useProgram(prog)
        gl.viewport(0, 0, w, h)
        gl.uniform2f(u.u_res, w, h)
        gl.uniform2f(u.u_phase, phaseRef.current, cur.grain)

        // Scroll and tilt both express themselves as a translation of the
        // noise domain. `off` moves opposite the intended screen motion, and
        // the depth layer samples u_flow at 0.5x, so it lags behind the front
        // layer automatically — real parallax between the two.
        const inter = interRef.current
        let dx = 0
        let dy = 0

        if (inter.scroll > 0.001) {
            const r = (inter.scrollAngle * Math.PI) / 180
            const span = inter.scrollRange === "section" ? 1.15 : 2.2
            const amt = scrollSpringRef.current.x * inter.scroll * span
            dx -= Math.sin(r) * amt
            dy += Math.cos(r) * amt
        }

        if (inter.tilt > 0.001) {
            const t = tiltRef.current
            const s = inter.tiltInvert ? -1 : 1
            const k = inter.tilt * 0.5 * s
            if (inter.tiltAxis !== "vertical") dx += t.sx * k
            if (inter.tiltAxis !== "horizontal") dy += t.sy * k
        }

        gl.uniform4f(
            u.u_flow,
            offRef.current.x + dx * cur.scale * cur.stretchX,
            offRef.current.y + dy * cur.scale * cur.stretchY,
            cur.wispiness,
            0.2 + clamp(cur.evolve, 0, 0.5) * 3.2
        )
        gl.uniform4f(u.u_geo, cur.scale, cur.stretchX, cur.stretchY, cur.warp)
        gl.uniform4f(
            u.u_shape,
            cur.threshold,
            cur.softness,
            clamp(cur.contrast, 0.15, 4),
            cur.intensity
        )
        gl.uniform4f(
            u.u_mask,
            cur.feather[0],
            cur.feather[1],
            cur.feather[2],
            cur.feather[3]
        )
        gl.uniform4f(
            u.u_mask2,
            cur.concentration,
            cur.anchor,
            cur.spread,
            cur.radial
        )
        const la = (cur.lightAngle * Math.PI) / 180
        const lx = Math.sin(la)
        const ly = -Math.cos(la)
        gl.uniform4f(
            u.u_light,
            lx,
            ly,
            cur.lightStrength,
            cur.lightDistance * 1.2
        )
        gl.uniform4f(
            u.u_light2,
            clamp(cur.ambient, 0, 1),
            cur.glow,
            0.5 + lx * 0.52,
            0.5 + ly * 0.52
        )
        gl.uniform4f(u.u_back, 2, clamp(cur.depth, 0, 1) * 0.6, 0.5, 0.06)
        gl.uniform3f(u.u_c0, cur.cols[0][0], cur.cols[0][1], cur.cols[0][2])
        gl.uniform3f(u.u_c1, cur.cols[1][0], cur.cols[1][1], cur.cols[1][2])
        gl.uniform3f(u.u_c2, cur.cols[2][0], cur.cols[2][1], cur.cols[2][2])
        gl.uniform3f(u.u_lc, cur.lc[0], cur.lc[1], cur.lc[2])
        // Radius sets the gaussian falloff. Peak displacement would otherwise
        // scale with the radius, so a compensating factor keeps the strength
        // slider meaning the same thing at any range — capped at 2x so a very
        // tight radius can't turn into a visible pinch.
        const cr = clamp(inter.cursorRadius, 0.05, 1)
        gl.uniform4f(
            u.u_ptr,
            ptrRef.current.cx,
            ptrRef.current.cy,
            (inter.cursor || 0) * clamp(0.3 / cr, 0.35, 2),
            1 / (cr * cr)
        )

        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const requestDraw = () => {
        if (pendingRef.current) return
        pendingRef.current = true
        requestAnimationFrame(() => {
            pendingRef.current = false
            drawRef.current()
        })
    }

    /* ---- sizing ---- */
    useIsoLayout(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return

        const measure = () => {
            const rect = wrap.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            const dpr =
                typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
            let r = Math.min(dpr, perf.maxPixelRatio) * renderScale
            let w = Math.max(1, Math.round(rect.width * r))
            let h = Math.max(1, Math.round(rect.height * r))
            if (w * h > MAX_PIXELS) {
                const k = Math.sqrt(MAX_PIXELS / (w * h))
                w = Math.max(1, Math.round(w * k))
                h = Math.max(1, Math.round(h * k))
            }
            if (w !== sizeRef.current.w || h !== sizeRef.current.h) {
                sizeRef.current = { w, h }
                canvas.width = w
                canvas.height = h
            }
            scrollRef.current.top =
                rect.top + (typeof window !== "undefined" ? window.scrollY : 0)
            scrollRef.current.height = rect.height
            requestDraw()
        }

        measure()
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            ro.observe(wrap)
        } else if (typeof window !== "undefined") {
            window.addEventListener("resize", measure)
        }
        return () => {
            if (ro) ro.disconnect()
            else if (typeof window !== "undefined")
                window.removeEventListener("resize", measure)
        }
    }, [renderScale, perf.maxPixelRatio, shaderKey])

    /* ---- visibility gating ---- */
    const [onScreen, setOnScreen] = useState(true)
    useIsoLayout(() => {
        if (
            !perf.pauseOffscreen ||
            typeof IntersectionObserver === "undefined"
        ) {
            setOnScreen(true)
            return
        }
        const wrap = wrapRef.current
        if (!wrap) return
        const io = new IntersectionObserver(
            (entries) => setOnScreen(entries[0].isIntersecting),
            { rootMargin: "120px" }
        )
        io.observe(wrap)
        return () => io.disconnect()
    }, [perf.pauseOffscreen])

    const [tabVisible, setTabVisible] = useState(true)
    useEffect(() => {
        if (typeof document === "undefined") return
        const onVis = () => setTabVisible(!document.hidden)
        document.addEventListener("visibilitychange", onVis)
        return () => document.removeEventListener("visibilitychange", onVis)
    }, [])

    /* ---- pointer ---- */
    useEffect(() => {
        if (!pointerOn || typeof window === "undefined") return
        const onMove = (e: PointerEvent) => {
            const wrap = wrapRef.current
            if (!wrap) return
            const r = wrap.getBoundingClientRect()
            if (!r.width || !r.height) return
            ptrRef.current.x = (e.clientX - r.left) / r.width
            ptrRef.current.y = (e.clientY - r.top) / r.height
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        return () => window.removeEventListener("pointermove", onMove)
    }, [pointerOn])

    /* ---- device tilt (gyroscope) ---- */
    useEffect(() => {
        if (!tiltOn || typeof window === "undefined") return
        const DOE: any = (window as any).DeviceOrientationEvent
        if (!DOE) return

        const t = tiltRef.current
        t.based = false

        const onOrient = (e: any) => {
            if (e.gamma == null || e.beta == null) return
            // Rotate the raw axes into screen space so landscape behaves.
            let angle = 0
            const so = (screen as any).orientation
            if (so && typeof so.angle === "number") angle = so.angle
            else if (typeof (window as any).orientation === "number")
                angle = (window as any).orientation
            const r = (-angle * Math.PI) / 180
            const c = Math.cos(r)
            const s = Math.sin(r)
            const gx = e.gamma * c - e.beta * s
            const gy = e.gamma * s + e.beta * c

            // First reading becomes neutral, so however the phone is being
            // held at that moment reads as centered rather than fully pushed.
            if (!t.based) {
                t.based = true
                t.bx = gx
                t.by = gy
                t.sx = 0
                t.sy = 0
            }
            t.x = clamp((gx - t.bx) / 30, -1, 1)
            t.y = clamp((gy - t.by) / 30, -1, 1)

            // Still mode has no loop to smooth in, so snap and repaint once.
            if (!runningRef.current) {
                t.sx = t.x
                t.sy = t.y
                requestDraw()
            }
        }

        const recalibrate = () => {
            t.based = false
        }

        let attached = false
        const attach = () => {
            if (attached) return
            attached = true
            window.addEventListener("deviceorientation", onOrient)
            window.addEventListener("orientationchange", recalibrate)
        }

        let dropGesture: (() => void) | null = null

        if (typeof DOE.requestPermission === "function") {
            // iOS 13+ only grants orientation from inside a user gesture.
            if (!interaction.tiltAsk) return
            const onGesture = () => {
                DOE.requestPermission()
                    .then((res: string) => {
                        if (res === "granted") attach()
                    })
                    .catch(() => {})
                if (dropGesture) dropGesture()
            }
            dropGesture = () => {
                window.removeEventListener("touchend", onGesture)
                window.removeEventListener("click", onGesture)
                dropGesture = null
            }
            window.addEventListener("touchend", onGesture, { passive: true })
            window.addEventListener("click", onGesture)
        } else {
            attach()
        }

        return () => {
            if (dropGesture) dropGesture()
            if (attached) {
                window.removeEventListener("deviceorientation", onOrient)
                window.removeEventListener("orientationchange", recalibrate)
            }
            t.x = 0
            t.y = 0
            t.sx = 0
            t.sy = 0
            t.based = false
        }
    }, [tiltOn, interaction.tiltAsk])

    /* ---- scroll parallax ---- */
    useEffect(() => {
        if (!interaction.scroll || typeof window === "undefined") return
        const onScroll = () => {
            const s = scrollRef.current
            const vh = window.innerHeight || 1
            const now = Date.now()
            // Document height is re-read at most a few times a second: lazy
            // content changes it, but reading it per scroll event forces layout.
            if (now - s.docAt > 400) {
                s.docAt = now
                const de = document.documentElement
                s.doc = Math.max(1, (de ? de.scrollHeight : vh) - vh)
            }
            if (interRef.current.scrollRange === "section") {
                const center = s.top - window.scrollY + s.height / 2
                s.progress = clamp((center - vh / 2) / vh, -1.5, 1.5)
            } else {
                // Page range: 0 at the very top, 1 at the very bottom, so the
                // drift keeps developing for the entire scroll rather than
                // saturating once the section has passed the viewport.
                s.progress = clamp(window.scrollY / s.doc, 0, 1)
            }
            if (!runningRef.current) {
                const sp = scrollSpringRef.current
                sp.x = s.progress
                sp.v = 0
                requestDraw()
            }
        }
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [interaction.scroll, interaction.scrollRange, isStatic, onScreen])

    /* ---- animation loop ---- */
    const running = active && !isStatic && onScreen && tabVisible && !failed
    runningRef.current = running
    useEffect(() => {
        if (!running) {
            cancelAnimationFrame(rafRef.current)
            return
        }
        const interval = fpsCap > 0 ? 1000 / fpsCap - 1.5 : 0
        lastRef.current = 0
        framesRef.current = 0

        const tick = (now: number) => {
            rafRef.current = requestAnimationFrame(tick)
            // Seed the clock on the first frame and paint immediately.
            // Without this, lastRef stayed 0, `last` fell back to `now`, every
            // delta measured 0ms, and the throttle discarded every frame.
            if (lastRef.current === 0) {
                lastRef.current = now
                drawRef.current()
                return
            }
            const raw = now - lastRef.current
            if (interval > 0 && raw < interval) return
            lastRef.current = now
            const dt = clamp(raw / 1000, 0, 1 / 12)
            const cur = paramsRef.current
            const inter = interRef.current
            const sp = clamp(speed, 0, 6)

            // wind: exact 256-cell wrap → seamless forever
            const rad = (cur.direction * Math.PI) / 180
            const mx = Math.sin(rad)
            const my = -Math.cos(rad)
            const rate = cur.drift * sp * 0.22 * cur.scale * dt
            const ox = offRef.current.x - mx * rate * cur.stretchX
            const oy = offRef.current.y - my * rate * cur.stretchY
            offRef.current.x = ((ox % WRAP) + WRAP) % WRAP
            offRef.current.y = ((oy % WRAP) + WRAP) % WRAP

            // evolve: phase wrapped at 2π → bounded circular drift
            phaseRef.current =
                (phaseRef.current + cur.evolve * sp * dt * 9.5) % TAU

            // pointer easing
            const pr = ptrRef.current
            pr.cx += (pr.x - pr.cx) * clamp(dt * 5, 0, 1)
            pr.cy += (pr.y - pr.cy) * clamp(dt * 5, 0, 1)

            // scroll follow — drag and springiness come straight from the
            // user's Transition control
            if (inter.scroll > 0.001) {
                stepFollow(
                    scrollSpringRef.current,
                    scrollRef.current.progress,
                    dt,
                    inter.scrollTransition
                )
            }

            // tilt easing — sensors are noisy, so nothing reaches the shader
            // until it has been smoothed here
            const tl = tiltRef.current
            const tk = clamp(dt * 3.2, 0, 1)
            tl.sx += (tl.x - tl.sx) * tk
            tl.sy += (tl.y - tl.sy) * tk

            drawRef.current()

            if (perf.adaptive && degrade < 2) {
                framesRef.current++
                emaRef.current = emaRef.current * 0.9 + raw * 0.1
                const budget = fpsCap > 0 ? 1000 / fpsCap : 16.7
                if (framesRef.current > 90 && emaRef.current > budget * 1.55) {
                    framesRef.current = 0
                    emaRef.current = budget
                    setDegrade((d) => d + 1)
                }
            }
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [running, fpsCap, speed, shaderKey, perf.adaptive, degrade])

    /* ---- static / param-change redraw ---- */
    useEffect(() => {
        if (!running && active && !failed) requestDraw()
    })

    /* ---- render ---- */
    const blend = p.blend === "normal" ? undefined : (p.blend as any)

    if (failed) {
        const c = p.cols
        const rgb = (v: RGB) =>
            `rgb(${Math.round(v[0] * 255)},${Math.round(v[1] * 255)},${Math.round(
                v[2] * 255
            )})`
        return (
            <div
                ref={wrapRef}
                aria-hidden="true"
                role="presentation"
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    pointerEvents: "none",
                    ...style,
                    minWidth: MIN_SIZE,
                    minHeight: MIN_SIZE,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: "-15%",
                        opacity: clamp(p.intensity * 0.7, 0, 1),
                        mixBlendMode: blend,
                        background: `radial-gradient(60% 55% at 25% ${
                            p.anchor * 100
                        }%, ${rgb(c[2])} 0%, transparent 65%),
                        radial-gradient(55% 45% at 75% ${
                            p.anchor * 92
                        }%, ${rgb(c[1])} 0%, transparent 70%),
                        radial-gradient(80% 60% at 50% ${
                            p.anchor * 105
                        }%, ${rgb(c[0])} 0%, transparent 75%)`,
                        filter: "blur(34px)",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={wrapRef}
            aria-hidden="true"
            role="presentation"
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
                ...style,
                minWidth: MIN_SIZE,
                minHeight: MIN_SIZE,
            }}
        >
            {/* Always mounted: unmounting on Active=false would tear down the
                GL context and leave the refs null when it toggled back. */}
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    opacity: active ? 1 : 0,
                    mixBlendMode: blend,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

Vapor.displayName = "Vapor"

/* ----------------------- property controls ------------------------ */

const PRESET_HINT = "Follows the vapor type unless set to Custom."

addPropertyControls(Vapor, {
    active: {
        type: ControlType.Boolean,
        title: "Active",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "CMS-ready — bind to a Toggle field to switch per page.",
    },
    vaporType: {
        type: ControlType.Enum,
        title: "Type",
        options: ["clouds", "fog", "mist", "steam", "smoke", "haze", "nebula"],
        optionTitles: [
            "Clouds",
            "Fog",
            "Mist",
            "Steam",
            "Smoke",
            "Haze",
            "Nebula",
        ],
        defaultValue: "fog",
    },
    cmsType: {
        type: ControlType.String,
        title: "Type · CMS",
        defaultValue: "",
        placeholder: "fog",
        description:
            "Bind a CMS text or option field here to override Type. Accepts clouds, fog, mist, steam, smoke, haze, nebula.",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: 1,
        description: "CMS-ready — overall density and opacity.",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 1,
        description: "CMS-ready — multiplies drift and evolution. 0 freezes.",
    },
    tint: {
        type: ControlType.Color,
        title: "Tint",
        defaultValue: "rgba(0,0,0,0)",
        description:
            "CMS-ready — recolors the palette while keeping its light structure. Alpha sets the strength.",
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        min: 0,
        max: 9999,
        step: 1,
        defaultValue: 1,
        displayStepper: true,
        description:
            "CMS-ready — a different number gives a different formation.",
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "color",
        controls: {
            palette: {
                type: ControlType.Enum,
                title: "Palette",
                options: ["preset", "custom"],
                optionTitles: ["Preset", "Custom"],
                defaultValue: "preset",
                displaySegmentedControl: true,
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow",
                defaultValue: "#5b6880",
                hidden: (o: any) => o.palette !== "custom",
            },
            midColor: {
                type: ControlType.Color,
                title: "Body",
                defaultValue: "#c8d3e5",
                hidden: (o: any) => o.palette !== "custom",
            },
            highlightColor: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: "#ffffff",
                hidden: (o: any) => o.palette !== "custom",
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: -1,
                max: 1,
                step: 0.01,
                defaultValue: -1,
                description:
                    "-1 follows the preset. Grain hides gradient banding.",
            },
            blendMode: {
                type: ControlType.Enum,
                title: "Blend",
                options: [
                    "auto",
                    "normal",
                    "screen",
                    "lighten",
                    "overlay",
                    "soft-light",
                    "multiply",
                ],
                optionTitles: [
                    "Auto",
                    "Normal",
                    "Screen",
                    "Lighten",
                    "Overlay",
                    "Soft light",
                    "Multiply",
                ],
                defaultValue: "auto",
            },
        },
    },

    shape: {
        type: ControlType.Object,
        title: "Shape",
        icon: "effect",
        controls: {
            values: {
                type: ControlType.Enum,
                title: "Values",
                options: ["preset", "custom"],
                optionTitles: ["Preset", "Custom"],
                defaultValue: "preset",
                displaySegmentedControl: true,
                description: PRESET_HINT,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.2,
                max: 8,
                step: 0.05,
                defaultValue: 2,
                hidden: (o: any) => o.values !== "custom",
            },
            form: {
                type: ControlType.Number,
                title: "Form",
                min: -1,
                max: 1,
                step: 0.05,
                defaultValue: -0.3,
                description: "Left: flat banks. Right: rising columns.",
                hidden: (o: any) => o.values !== "custom",
            },
            coverage: {
                type: ControlType.Number,
                title: "Coverage",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.55,
                hidden: (o: any) => o.values !== "custom",
            },
            softness: {
                type: ControlType.Number,
                title: "Softness",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.3,
                hidden: (o: any) => o.values !== "custom",
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: 1,
                hidden: (o: any) => o.values !== "custom",
            },
            detail: {
                type: ControlType.Number,
                title: "Detail",
                min: 2,
                max: 7,
                step: 1,
                defaultValue: 5,
                displayStepper: true,
                description: "Noise octaves. The main cost lever.",
                hidden: (o: any) => o.values !== "custom",
            },
            wispiness: {
                type: ControlType.Number,
                title: "Wispiness",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.2,
                description: "Blends toward sharp ridges for smoke and steam.",
                hidden: (o: any) => o.values !== "custom",
            },
            warp: {
                type: ControlType.Number,
                title: "Turbulence",
                min: 0,
                max: 2,
                step: 0.01,
                defaultValue: 0.5,
                hidden: (o: any) => o.values !== "custom",
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.35,
                description:
                    "Adds a slower second layer behind for parallax. Costs about 40% more.",
                hidden: (o: any) => o.values !== "custom",
            },
        },
    },

    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "effect",
        controls: {
            values: {
                type: ControlType.Enum,
                title: "Values",
                options: ["preset", "custom"],
                optionTitles: ["Preset", "Custom"],
                defaultValue: "preset",
                displaySegmentedControl: true,
                description: PRESET_HINT,
            },
            direction: {
                type: ControlType.Number,
                title: "Direction",
                min: 0,
                max: 360,
                step: 1,
                unit: "°",
                defaultValue: 90,
                description: "0° drifts up, 90° drifts right.",
                hidden: (o: any) => o.values !== "custom",
            },
            drift: {
                type: ControlType.Number,
                title: "Drift",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.3,
                hidden: (o: any) => o.values !== "custom",
            },
            evolve: {
                type: ControlType.Number,
                title: "Evolve",
                min: 0,
                max: 0.5,
                step: 0.005,
                defaultValue: 0.06,
                description: "How fast the form itself churns.",
                hidden: (o: any) => o.values !== "custom",
            },
        },
    },

    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        icon: "effect",
        controls: {
            scroll: {
                type: ControlType.Number,
                title: "Scroll",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0,
                description: "Shifts the field as the section scrolls past.",
            },
            scrollAngle: {
                type: ControlType.Number,
                title: "Scroll dir",
                min: 0,
                max: 360,
                step: 1,
                unit: "°",
                defaultValue: 0,
                description:
                    "Where the vapor travels as the page scrolls down. 0° up, 90° right.",
                hidden: (o: any) => !o.scroll,
            },
            scrollRange: {
                type: ControlType.Enum,
                title: "Range",
                options: ["page", "section"],
                optionTitles: ["Whole page", "This section"],
                defaultValue: "page",
                displaySegmentedControl: true,
                description:
                    "Whole page keeps drifting until the scroll hits the bottom. This section only reacts while the section passes the viewport.",
                hidden: (o: any) => !o.scroll,
            },
            scrollTransition: {
                type: ControlType.Transition,
                title: "Follow",
                defaultValue: {
                    type: "spring",
                    stiffness: 90,
                    damping: 24,
                    mass: 1,
                },
                description:
                    "Drag and springiness of the follow. Lower stiffness or higher damping feels heavier.",
                hidden: (o: any) => !o.scroll,
            },
            cursor: {
                type: ControlType.Number,
                title: "Cursor",
                min: -0.6,
                max: 0.6,
                step: 0.01,
                defaultValue: 0,
                description:
                    "Positive pushes vapor away from the cursor. Negative draws it toward the cursor instead.",
            },
            cursorRadius: {
                type: ControlType.Number,
                title: "Cursor size",
                min: 0.05,
                max: 1,
                step: 0.01,
                defaultValue: 0.3,
                description:
                    "Reach of the cursor effect, as a fraction of the component height.",
                hidden: (o: any) => !o.cursor,
            },
            cursorOnTouch: {
                type: ControlType.Boolean,
                title: "On touch",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (o: any) => !o.cursor,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0,
                description:
                    "Gyroscope parallax on phones and tablets. Ignored on desktop.",
            },
            tiltAxis: {
                type: ControlType.Enum,
                title: "Tilt axis",
                options: ["both", "horizontal", "vertical"],
                optionTitles: ["Both", "Left · right", "Up · down"],
                defaultValue: "both",
                displaySegmentedControl: true,
                hidden: (o: any) => !o.tilt,
            },
            tiltInvert: {
                type: ControlType.Boolean,
                title: "Tilt dir",
                defaultValue: false,
                enabledTitle: "Follow",
                disabledTitle: "Oppose",
                description:
                    "Oppose reads as depth behind the screen. Follow reads as liquid in a container.",
                hidden: (o: any) => !o.tilt,
            },
            tiltAsk: {
                type: ControlType.Boolean,
                title: "iOS prompt",
                defaultValue: false,
                enabledTitle: "Ask",
                disabledTitle: "Skip",
                description:
                    "iOS needs permission for motion sensors. Ask shows the system dialog on first tap; Skip means tilt stays off on iPhone and iPad.",
                hidden: (o: any) => !o.tilt,
            },
        },
    },

    lighting: {
        type: ControlType.Object,
        title: "Lighting",
        icon: "effect",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Lighting",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Self-shadowing that gives the vapor volume. Off is noticeably cheaper.",
            },
            values: {
                type: ControlType.Enum,
                title: "Values",
                options: ["preset", "custom"],
                optionTitles: ["Preset", "Custom"],
                defaultValue: "preset",
                displaySegmentedControl: true,
                hidden: (o: any) => !o.enabled,
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                min: 0,
                max: 360,
                step: 1,
                unit: "°",
                defaultValue: 25,
                hidden: (o: any) => !o.enabled || o.values !== "custom",
            },
            distance: {
                type: ControlType.Number,
                title: "Depth",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.34,
                hidden: (o: any) => !o.enabled || o.values !== "custom",
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                min: 0,
                max: 2,
                step: 0.01,
                defaultValue: 1,
                hidden: (o: any) => !o.enabled || o.values !== "custom",
            },
            ambient: {
                type: ControlType.Number,
                title: "Ambient",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.35,
                hidden: (o: any) => !o.enabled || o.values !== "custom",
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.25,
                description: "Light scattering bloom at the light position.",
                hidden: (o: any) => !o.enabled || o.values !== "custom",
            },
            color: {
                type: ControlType.Color,
                title: "Light",
                defaultValue: "#fff6e8",
                hidden: (o: any) => !o.enabled || o.values !== "custom",
            },
        },
    },

    mask: {
        type: ControlType.Object,
        title: "Framing",
        icon: "effect",
        controls: {
            values: {
                type: ControlType.Enum,
                title: "Values",
                options: ["preset", "custom"],
                optionTitles: ["Preset", "Custom"],
                defaultValue: "preset",
                displaySegmentedControl: true,
                description: PRESET_HINT,
            },
            top: {
                type: ControlType.Number,
                title: "Fade top",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.1,
                hidden: (o: any) => o.values !== "custom",
            },
            right: {
                type: ControlType.Number,
                title: "Fade right",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.1,
                hidden: (o: any) => o.values !== "custom",
            },
            bottom: {
                type: ControlType.Number,
                title: "Fade bottom",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.4,
                hidden: (o: any) => o.values !== "custom",
            },
            left: {
                type: ControlType.Number,
                title: "Fade left",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.1,
                hidden: (o: any) => o.values !== "custom",
            },
            concentration: {
                type: ControlType.Number,
                title: "Banking",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.4,
                description: "Concentrates the vapor into a horizontal band.",
                hidden: (o: any) => o.values !== "custom",
            },
            anchor: {
                type: ControlType.Number,
                title: "Height",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.7,
                hidden: (o: any) => o.values !== "custom",
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: 0.05,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.7,
                hidden: (o: any) => o.values !== "custom",
            },
            radial: {
                type: ControlType.Number,
                title: "Vignette",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0,
                hidden: (o: any) => o.values !== "custom",
            },
        },
    },

    performance: {
        type: ControlType.Object,
        title: "Performance",
        // Sibling of `type` / `title` / `controls`. Inside `controls` every key
        // must be a control description, which is why a string there fails.
        description:
            "Crafted by [Joshua Roberts](https://joshuaroberts.design/) 🎨",
        controls: {
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                options: ["auto", "high", "balanced", "low", "static"],
                optionTitles: ["Auto", "High", "Balanced", "Low", "Still"],
                defaultValue: "auto",
                description:
                    "Auto reads the device. Still renders one frame and stops.",
            },
            maxPixelRatio: {
                type: ControlType.Number,
                title: "Max DPR",
                min: 0.5,
                max: 3,
                step: 0.1,
                defaultValue: 1.5,
                description:
                    "Caps retina rendering. 1.5 is invisible on vapor.",
            },
            fpsLimit: {
                type: ControlType.Enum,
                title: "Frame cap",
                options: ["auto", "60", "30", "24"],
                optionTitles: ["Auto", "60 fps", "30 fps", "24 fps"],
                defaultValue: "auto",
            },
            pauseOffscreen: {
                type: ControlType.Boolean,
                title: "Pause offscreen",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            adaptive: {
                type: ControlType.Boolean,
                title: "Auto downgrade",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description:
                    "Drops resolution and detail if frames start missing.",
            },
            reducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced motion",
                defaultValue: true,
                enabledTitle: "Respect",
                disabledTitle: "Ignore",
            },
        },
    },
})
