"use client"
/**
 * Fluffy Button — Framer code component.
 * Made by Andrii
 * X: https://x.com/andriidesign1
 * Edit the defaults below or use the property controls at the end of this file.
 * Fur renderer adapted from the user-supplied Plush Tile — Originkit example.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, type Transition } from "framer-motion"
// 1. Value helpers and defaults
type RGBA = [number, number, number, number]
const COLOR_CACHE = new Map<string, RGBA | null>()
/** Cached per string, so the frame loop parses nothing and allocates nothing. */
function parseColor(input: string | undefined, fallback: RGBA): RGBA {
    if (typeof input !== "string") return fallback
    let hit = COLOR_CACHE.get(input)
    if (hit === undefined) {
        hit = parseColorRaw(input)
        COLOR_CACHE.set(input, hit)
    }
    return hit ?? fallback
}
function parseColorRaw(raw: string): RGBA | null {
    let s = raw.trim()
    const v = /^var\(\s*--[^,]+,\s*(.+)\)$/.exec(s)
    if (v) s = v[1].trim()
    if (s[0] === "#") {
        const h = s.slice(1)
        const x = (a: string) => parseInt(a, 16)
        let r: number,
            g: number,
            b: number,
            a = 255
        if (h.length === 3 || h.length === 4) {
            r = x(h[0] + h[0])
            g = x(h[1] + h[1])
            b = x(h[2] + h[2])
            if (h.length === 4) a = x(h[3] + h[3])
        } else if (h.length === 6 || h.length === 8) {
            r = x(h.slice(0, 2))
            g = x(h.slice(2, 4))
            b = x(h.slice(4, 6))
            if (h.length === 8) a = x(h.slice(6, 8))
        } else return null
        const out: RGBA = [r / 255, g / 255, b / 255, a / 255]
        return out.every(Number.isFinite) ? out : null
    }
    const m = /^(rgba?|hsla?)\(([^)]*)\)$/i.exec(s)
    if (!m) return null
    const parts = m[2].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null
    const num = (p: string, scale: number) =>
        p.endsWith("%") ? (parseFloat(p) / 100) * scale : parseFloat(p)
    const alpha = parts.length > 3 ? num(parts[3], 1) : 1
    let rgb: [number, number, number]
    if (m[1].toLowerCase().startsWith("rgb")) {
        rgb = [num(parts[0], 255) / 255, num(parts[1], 255) / 255, num(parts[2], 255) / 255]
    } else {
        const hh = (((parseFloat(parts[0]) % 360) + 360) % 360) / 360
        const ss = num(parts[1], 1),
            ll = num(parts[2], 1)
        const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
        const p = 2 * ll - q
        const f = (t: number) => {
            t = (t + 1) % 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }
        rgb = [f(hh + 1 / 3), f(hh), f(hh - 1 / 3)]
    }
    const out: RGBA = [rgb[0], rgb[1], rgb[2], alpha]
    return out.every(Number.isFinite) ? (out.map((c) => Math.min(1, Math.max(0, c))) as RGBA) : null
}
function num(v: unknown, d: number): number {
    return typeof v === "number" && Number.isFinite(v) ? v : d
}
const clampN = (v: unknown, lo: number, hi: number, d: number) =>
    Math.max(lo, Math.min(hi, num(v, d)))
const lin = (c: number) => Math.pow(c, 2.2)
const D2R = Math.PI / 180
const BG_FALLBACK: RGBA = [0.05, 0.05, 0.05, 1]
const FUR_FALLBACK: RGBA = [0.953, 0.929, 0.894, 1]
const LIGHT_FALLBACK: RGBA = [1, 0.957, 0.902, 1]
type ImageValue =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
      }
    | null
    | undefined
/** Reads both shapes ControlType.ResponsiveImage / Image hand us. */
const imageOf = (v: ImageValue): string =>
    typeof v === "string" ? v : v && typeof v.src === "string" ? v.src : ""
// ── defaults: one source of truth for the signature and the panel ──
const DEFAULT_LINK = "https://framer.link/framence-studio-2go649"
const DEFAULT_SHAPE = { radius: 75, puff: 10, inset: 12 }
const DEFAULT_INTERACTION = { enabled: true, reach: 10, strength: 10, breeze: 0, press: 3 }
const DEFAULT_HOVER_WIND = { enabled: true, strength: 5, speed: 0, duration: 1.5, direction: 0 }
const DEFAULT_HOVER_TRANSITION: Transition = {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 3,
}
const DEFAULT_HOVER_STYLE = { scale: 95, transition: DEFAULT_HOVER_TRANSITION }
type Fit = "contain" | "cover"
const DEFAULT_ARTWORK = { fit: "contain" as Fit, size: 80, offsetY: 0 }
type Artwork = typeof DEFAULT_ARTWORK
type Flow = "art" | "radial" | "down"
const DEFAULT_FUR = { density: 10, length: 10, lift: 10, frizz: 10, flow: "art" as Flow }
type Fur = typeof DEFAULT_FUR
/** Shared lighting defaults and internal shading constants. */
const DEFAULT_ADVANCED = {
    seed: 0,
    edgeFlow: 75,
    emboss: 0,
    rimShare: 26,
    clump: 100,
    hairWidth: 2,
    tipFade: 25,
    lens: 20,
    lightAngle: 90,
    lightHeight: 40,
    lightColor: "#B8ADFF",
    keyFalloff: 75,
    sheen: 25,
    crimp: 20,
    rootShade: 60,
    depthShade: 45,
    undercoat: 22,
    rimLight: 90,
    colorJitter: 22,
    bounce: 55,
}
type Advanced = typeof DEFAULT_ADVANCED
// Rendering budgets: density, strand segments, surface mesh, and texture sizes.
const STRANDS_PER_PX = 0.5
const MAX_STRANDS = 180000
// Segments per hair, drawn as two half-strands so every tip lands over every root.
const SEG = 4
const HALF_SEG = SEG / 2
const GRID = 48
const ART = 512
const FLOW = 64
const PIXEL_BUDGET = 1600000
// 2. GPU programs: surface, hair preparation, and strand rendering
const COMMON = /* glsl */ `
uniform vec2 uHalf;
uniform float uCorner, uBevel, uDome;
uniform mat3 uRot;
uniform float uCam;
uniform vec2 uFrame, uRollCS, uOff;

// Signed distance to the rounded-square footprint, and its gradient.
float sdTile(vec2 p, out vec2 g) {
    vec2 sp = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
    vec2 q = abs(p) - uHalf + uCorner;
    if (q.x > 0.0 && q.y > 0.0) { float l = length(q); g = q / l * sp; return l - uCorner; }
    g = q.x > q.y ? vec2(sp.x, 0.0) : vec2(0.0, sp.y);
    return max(q.x, q.y) - uCorner;
}
// Cushion: round bevel off the footprint edge plus a shallow dome.
vec3 surf(vec2 p, out vec3 n) {
    vec2 g; float d = sdTile(p, g);
    float e = max(-d, 0.0);
    float q = clamp(e / uBevel, 0.02, 1.0);
    float r = 1.0 - q;
    float rr = sqrt(1.0 - r * r);
    float z = uBevel * rr;
    float dz = r / rr;
    float span = min(uHalf.x, uHalf.y);
    float c = clamp(e / span, 0.0, 1.0);
    z += uDome * (1.0 - (1.0 - c) * (1.0 - c));
    dz += uDome * 2.0 * (1.0 - c) / span;
    n = normalize(vec3(g * dz, 1.0));
    return vec3(p, z);
}
// Tile-local point → NDC: turn, perspective, roll about the content centre, then offset.
vec2 toNdc(vec3 local) {
    vec3 w = uRot * local;
    vec2 xy = w.xy * (uCam / (uCam - w.z));
    xy = vec2(uRollCS.x * xy.x + uRollCS.y * xy.y, -uRollCS.y * xy.x + uRollCS.x * xy.y);
    return xy / uFrame + uOff;
}
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
`
const SHADE = /* glsl */ `
uniform sampler2D uArt;  // sRGB texture: samples arrive linear
uniform vec3 uLight, uBounceC, uKeyC;
uniform vec2 uDown;
uniform float uKeyLow, uKey, uFade;
float keyGrad(vec3 P0) {
    // Softbox above the tile: brighter toward the light's side of the tile.
    vec2 ld = uLight.xy;
    float l = length(ld);
    float k = l > 1e-3 ? dot((uRot * P0).xy, ld / l) / max(dot(abs(ld / max(l, 1e-3)), uHalf), 1e-3) : 0.0;
    // The cushion's lower roll sits in its own shadow above the floor.
    return mix(uKeyLow, 1.0, smoothstep(-1.15, 0.7, k)) * mix(0.5, 1.0, smoothstep(-1.1, -0.7, k));
}
vec2 artUv(vec2 p) { return vec2(p.x / uHalf.x, -p.y / uHalf.y) * 0.5 + 0.5; }
`
const UNDER_VERT = /* glsl */ `#version 300 es
precision highp float;
${COMMON}
${SHADE}
uniform float uUnder;
out vec2 vP;
out vec3 vCol;
const int G = ${GRID};
void main() {
    int cell = gl_VertexID / 6;
    int k = gl_VertexID % 6;
    ivec2 off = k == 0 ? ivec2(0, 0) : k == 1 || k == 4 ? ivec2(1, 0) : k == 2 || k == 3 ? ivec2(0, 1) : ivec2(1, 1);
    vec2 g = vec2(ivec2(cell % G, cell / G) + off) / float(G);
    vec2 p = (g * 2.0 - 1.0) * uHalf;
    vec3 N;
    vec3 P = surf(p, N);
    vec3 Nw = normalize(uRot * N);
    vec3 alb = texture(uArt, artUv(p)).rgb;
    float lam = max(dot(Nw, uLight), 0.0) * 0.75 + 0.25;
    vCol = alb * uUnder * vec3(1.0, 0.85, 0.7) * (uKeyC * lam * keyGrad(P) * uKey + uBounceC * max(dot(Nw.xy, uDown), 0.0) * 0.5);
    vP = p;
    gl_Position = vec4(toNdc(P), 0.0, 1.0);
}`
const UNDER_FRAG = /* glsl */ `#version 300 es
precision highp float;
${COMMON}
uniform float uPx;
uniform float uFade;
in vec2 vP;
in vec3 vCol;
out vec4 o;
void main() {
    vec2 g;
    // Slightly inside the footprint, so the rim's hair halo covers its edge.
    float d = sdTile(vP, g) + 0.012 * min(uHalf.x, uHalf.y);
    float a = (1.0 - smoothstep(-uPx, uPx, d)) * uFade;
    o = vec4(toSrgb(vCol) * a, a);
}`
// A thin ink foundation between fiber roots and tips keeps small Fur labels readable.
const LABEL_VERT = /* glsl */ `#version 300 es
precision highp float;
${COMMON}
uniform float uLabelLift;
out vec2 vUv;
const int G = ${GRID};
void main() {
    int cell = gl_VertexID / 6;
    int k = gl_VertexID % 6;
    ivec2 off = k == 0 ? ivec2(0, 0) : k == 1 || k == 4 ? ivec2(1, 0) : k == 2 || k == 3 ? ivec2(0, 1) : ivec2(1, 1);
    vec2 uv = vec2(ivec2(cell % G, cell / G) + off) / float(G);
    vec3 normal;
    vec3 P = surf((uv * 2.0 - 1.0) * uHalf, normal);
    P.z += uLabelLift;
    vUv = vec2(uv.x, 1.0 - uv.y);
    gl_Position = vec4(toNdc(P), 0.0, 1.0);
}`
const LABEL_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uLabelMask;
uniform vec4 uLabelColor;
uniform float uLabelStrength;
in vec2 vUv;
out vec4 o;
void main() {
    float coverage = smoothstep(0.2, 0.8, texture(uLabelMask, vUv).r);
    float alpha = coverage * uLabelStrength * uLabelColor.a;
    o = vec4(uLabelColor.rgb * alpha, alpha);
}`
const HASH = /* glsl */ `
uint hashu(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
float h01(uint x) { return float(hashu(x) >> 8) * (1.0 / 16777216.0); }
`
/**
 * Per-hair setup, run once per change through transform feedback (in a unit
 * surface, independent of its displayed size): root, surface frame, lie
 * direction, tuft pull. The per-frame strand shader just reads it back.
 */
const PREP_VERT = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${COMMON}
${HASH}
uniform sampler2D uFlow;
uniform float uLift, uSpread, uClump, uCs, uRimFrac, uEmboss;
uniform uint uSeed;
out vec4 oA; // root, crimp phase
out vec4 oB; // normal, lift
out vec4 oC; // lie direction, tuft brightness
out vec4 oD; // tuft pull, length factor (0 = no hair)
void main() {
    uint id = uint(gl_VertexID);
    uint hb = hashu(id + uSeed * 7919u) * 16u;
    float h0 = h01(hb), h1 = h01(hb + 1u), h2 = h01(hb + 2u), h3 = h01(hb + 3u);
    float h4 = h01(hb + 4u), h5 = h01(hb + 5u), h7 = h01(hb + 7u);
    vec2 g;
    vec2 p;
    float alive = 1.0;
    bool rim = h0 < uRimFrac;
    if (rim) {
        // Rim roots: march from the centre out to the edge along a random heading,
        // then sink a little way in, so the halo rings the whole silhouette.
        float an = h1 * 6.2831853;
        vec2 dir = vec2(cos(an), sin(an));
        float t = 0.0;
        for (int i = 0; i < 6; i++) t -= sdTile(dir * t, g);
        p = dir * t;
        sdTile(p, g);
        p -= g * (h2 * h2 * 0.45 * uBevel);
    } else {
        // Interior roots on the R2 low-discrepancy sequence: even cover at any count,
        // and a lower Density is a prefix of a higher one.
        uint k = id + uSeed * 100003u;
        vec2 r2 = vec2(float(k * 3242174889u + 2147483648u), float(k * 2447445414u + 2147483648u)) * (1.0 / 4294967296.0);
        p = (r2 * 2.0 - 1.0) * uHalf;
        if (sdTile(p, g) > 0.0) alive = 0.0;
    }
    vec3 N;
    vec3 P0 = surf(p, N);
    vec2 uv = vec2(p.x / uHalf.x, -p.y / uHalf.y) * 0.5 + 0.5;

    // Appliqué: the artwork's pile stands proud of the base fur, so its upper
    // edges catch the softbox and its lower edges fall into shade.
    const float TX = 1.0 / float(${FLOW});
    float hC = texture(uFlow, uv).b;
    float hx = (texture(uFlow, uv + vec2(TX, 0.0)).b - texture(uFlow, uv - vec2(TX, 0.0)).b) / (4.0 * TX * uHalf.x);
    float hy = -(texture(uFlow, uv + vec2(0.0, TX)).b - texture(uFlow, uv - vec2(0.0, TX)).b) / (4.0 * TX * uHalf.y);
    float inside = smoothstep(0.0, uBevel, -sdTile(p, g));
    P0.z += uEmboss * hC * inside;
    N = normalize(N - vec3(hx, hy, 0.0) * uEmboss * inside);

    // Lie direction from the flow field, projected onto the surface, fanned a little.
    vec2 fl = texture(uFlow, uv).rg * 2.0 - 1.0;
    vec3 t3 = vec3(fl.x, -fl.y, 0.0);
    vec3 T = t3 - N * dot(t3, N);
    float tl = length(T);
    T = tl > 0.05 ? T / tl : normalize(cross(N, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
    float fan = (h3 - 0.5) * uSpread;
    T = T * cos(fan) + cross(N, T) * sin(fan);

    // Tufts: hairs gather toward the nearest clump centre, so their tips meet and
    // dark partings open between clumps, as in real plush.
    vec2 ci = floor(p / uCs);
    vec2 best = p;
    float bd = 1e9;
    uint cid = 0u;
    for (int j = -1; j <= 1; j++)
        for (int i = -1; i <= 1; i++) {
            ivec2 cc = ivec2(ci) + ivec2(i, j);
            uint hh = hashu(uint(cc.x + 8192) * 73856093u ^ uint(cc.y + 8192) * 19349663u ^ (uSeed * 83492791u));
            vec2 pt = (vec2(cc) + vec2(h01(hh), h01(hh ^ 0x9e3779b9u))) * uCs;
            float d2 = dot(pt - p, pt - p);
            if (d2 < bd) { bd = d2; best = pt; cid = hh; }
        }
    vec3 pull = vec3(best - p, 0.0);
    pull = (pull - N * dot(pull, N)) * (rim ? 0.3 * uClump : uClump);
    float tuft = 1.0 + (h01(cid ^ 0x5bd1e995u) - 0.5) * 0.3;

    // At the whorl's source hair stands up in a crown instead of parting to the skin.
    float crown = mix(3.0, 1.0, texture(uFlow, uv).a);
    float lift = (rim ? max(uLift, 1.4) : uLift * crown) * (0.6 + 0.8 * h4);
    oA = vec4(P0, h7 * 6.2831853);
    oB = vec4(N, rim ? -lift : lift);
    oC = vec4(T, tuft);
    oD = vec4(pull, alive * (0.55 + 0.9 * h5));
    gl_Position = vec4(0.0);
}`
const PREP_FRAG = /* glsl */ `#version 300 es
precision highp float;
out vec4 o;
void main() { o = vec4(0.0); }`
const STRAND_VERT = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${COMMON}
${SHADE}
${HASH}
layout(location = 0) in vec4 aA;
layout(location = 1) in vec4 aB;
layout(location = 2) in vec4 aC;
layout(location = 3) in vec4 aD;
uniform vec2 uRes;
uniform vec3 uGrav;
uniform vec4 uBrush;  // local xy, radius, strength
uniform float uLen, uFrizz, uGrow, uTime, uBreeze, uWidth;
uniform vec4 uGust; // direction xy, envelope strength, flutter frequency
uniform float uGustTime;
uniform float uJitter, uTipFade, uRootShade, uSheen, uRim, uCount, uDepth;
uniform sampler2D uLabelMask;
uniform float uLegibility, uShag;
uniform uint uSeed;
uniform int uSegBase;
out vec4 vCol;
out float vDist;
out float vHalf;
out vec2 vCrimp;  // position along the hair, glint phase
const int SEG = ${SEG};

void main() {
    if (aD.w <= 0.0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vCol = vec4(0.0); vDist = 0.0; vHalf = 0.0; vCrimp = vec2(0.0); return; }
    int seg = (gl_VertexID >> 1) + uSegBase;
    float side = (gl_VertexID & 1) == 0 ? -1.0 : 1.0;
    float s = float(seg) / float(SEG);
    uint id = uint(gl_InstanceID);
    uint hb = hashu(id ^ (uSeed * 0x2545F491u) ^ 0xA511E9B3u);
    float hj = float(hb & 1023u) / 1023.0;
    float hw = float((hb >> 10) & 1023u) / 1023.0;
    float hc = float((hb >> 20) & 1023u) / 1023.0;

    float a = uHalf.x;
    vec3 P0 = aA.xyz * a;
    vec3 N = aB.xyz;
    vec3 T = aC.xyz;
    vec3 B = cross(N, T);
    float lift = abs(aB.w);
    float ph0 = aA.w;
    float curlF = 2.0 + 4.0 * hc;
    vec3 pull = aD.xyz * a;
    // Rim hairs have a negative lift marker; their visible length is slightly shorter.
    bool rimHair = aB.w < 0.0;
    vec2 labelRoot = texture(uLabelMask, artUv(P0.xy)).rg;
    float ink = smoothstep(0.25, 0.75, labelRoot.r) * uLegibility;
    float edgeGuard = smoothstep(0.015, 0.28, labelRoot.g) * uLegibility;
    float L = uLen * aD.w * uGrow * (rimHair ? 0.75 : 1.0);
    L *= mix(1.0, 0.08, max(ink, edgeGuard));
    P0.z += ink * uLen * 1.05;
    pull *= mix(1.0, 0.06, max(ink, edgeGuard));

    // Finger through the fur: strands near the cursor lean away from it and flatten.
    vec2 dv = P0.xy - uBrush.xy;
    float dd = dot(dv, dv);
    float fb = uBrush.w * exp(-dd / (uBrush.z * uBrush.z));
    vec3 bp = vec3(dv * inversesqrt(dd + 1e-6), 0.0);
    bp -= N * dot(bp, N);
    vec3 D0 = normalize(N * lift * (1.0 - 0.7 * min(fb, 1.0)) + T + bp * fb * 1.5);
    vec3 randomT = T * cos(hc * 6.2831853) + B * sin(hc * 6.2831853);
    D0 = mix(D0, normalize(N * (0.25 + 0.75 * clamp(lift, 0.0, 2.5)) + randomT * 0.85 + bp * fb), uShag * (rimHair ? 0.3 : 1.0));
    D0 = normalize(mix(D0, N, ink * 0.98));
    vec3 bend = T * 0.6 + uGrav * (rimHair ? 0.2 : 0.35) - N * lift * 0.3 + bp * fb * 1.5;
    vec2 wv = vec2(sin(uTime * 1.7 + P0.x * 6.0 + P0.y * 2.5 + hc * 1.5), cos(uTime * 1.3 + P0.y * 5.0 - P0.x * 3.0 + hj * 2.0));
    bend = mix(bend, randomT * 0.12 + uGrav * 0.12 + bp * fb, uShag);
    bend *= mix(1.0, 0.04, ink);
    bend += vec3(wv, 0.0) * uBreeze * mix(1.0, 0.1, ink);
    // A brief directional flutter affects fiber tips while the cushion stays still.
    float gustWave = sin(uGustTime * uGust.w * 6.2831853 + P0.x * 9.0 + P0.y * 7.0 + hc * 6.2831853);
    vec2 gustSide = vec2(-uGust.y, uGust.x);
    vec2 gustBend = uGust.xy * (0.9 + 0.25 * gustWave) + gustSide * (0.18 * gustWave);
    bend += vec3(gustBend, 0.0) * uGust.z * mix(1.0, 0.1, ink);

    // Position and tangent along the hair: rise, lie down along the flow, droop,
    // wander, a fine crimp, and the pull into its tuft toward the tip.
    float ph = ph0 + s * curlF;
    float curlAmount = mix(1.0, 0.03, ink) * mix(1.0, 0.62, uShag);
    float k1 = uFrizz * 0.18 * curlAmount, k2 = uFrizz * 0.08 * curlAmount;
    vec3 cw = B * sin(ph) + N * 0.4 * cos(ph);
    float cr = ph0 * 3.0 + s * 9.0;
    vec3 curl = cw * (k1 * s) + B * (sin(cr) * k2);
    vec3 dcurl = (B * cos(ph) - N * 0.4 * sin(ph)) * (curlF * k1 * s) + cw * k1 + B * (cos(cr) * 9.0 * k2);
    float rs = sqrt(s);
    vec3 P = P0 + L * (D0 * s + bend * (0.5 * s * s) + curl) + pull * (s * rs);
    vec3 dP = L * (D0 + bend * s + dcurl) + pull * (1.5 * rs);

    // Keep long background fibers outside the letter contours.
    if (uLegibility > 0.01 && labelRoot.r < 0.35 && texture(uLabelMask, artUv(P.xy)).r > 0.35) {
        float lo = 0.0, hi = 1.0;
        for (int k = 0; k < 4; k++) {
            float mid = (lo + hi) * 0.5;
            if (texture(uLabelMask, artUv(mix(P0.xy, P.xy, mid))).r > 0.30) hi = mid; else lo = mid;
        }
        P.xy = mix(P0.xy, P.xy, lo);
    }
    vec2 ndc = toNdc(P);
    vec2 dpx = (toNdc(P + dP * 0.02) - ndc) * uRes;
    vec2 perp = normalize(vec2(-dpx.y, dpx.x) + 1e-6);
    float w = uWidth * (1.0 - 0.5 * s) * (0.8 + 0.4 * hw) * (rimHair ? 0.75 : 1.0);
    float cov = min(w, 1.0);
    w = max(w, 1.0);
    // Half a pixel past the edge is all the coverage ramp below reaches.
    float hwid = 0.5 * w + 0.6;
    vDist = side * hwid;
    vHalf = 0.5 * w;
    vCrimp = vec2(s, hc * 6.2831853);
    gl_Position = vec4(ndc + perp * (side * hwid * 2.0) / uRes, 0.0, 1.0);

    // Kajiya-Kay hair under a top softbox, floor bounce from below, backlit rim.
    // Hairs drawn later sit on top: the R2 order keeps every prefix even, so the
    // first-drawn (buried) hairs shade darker and the last-drawn catch the light.
    vec3 Nw = normalize(uRot * N);
    vec3 Tw = normalize(uRot * dP);
    float layer = mix(1.0 - uDepth, 1.0, sqrt(float(id) / uCount));
    vec3 alb = texture(uArt, artUv(P0.xy)).rgb * (1.0 + (hj - 0.5) * 2.0 * uJitter) * aC.w * layer;
    float kg = keyGrad(P0);
    float tl2 = dot(Tw, uLight);
    float kk = sqrt(max(1.0 - tl2 * tl2, 0.0));
    float lam = max(dot(Nw, uLight), 0.0) * 0.9 + 0.1;
    // Light that reaches deep into pale fur has scattered off other hairs: its roots stay
    // lighter and its shadows go amber, not grey. Dyed fur keeps its own hue.
    float pale = min(min(alb.r, alb.g), alb.b) / max(max(alb.r, alb.g), max(alb.b, 1e-4));
    float ao1 = mix(1.0 - uRootShade * (1.0 - 0.35 * pale), 1.0, smoothstep(0.0, 1.0, s));
    vec3 ao = ao1 * mix(vec3(1.0), vec3(1.12, 0.94, 0.78), (1.0 - ao1) * pale);
    vec3 H = normalize(uLight + vec3(0.0, 0.0, 1.0));
    float th = dot(Tw, H);
    float sh = max(1.0 - th * th, 0.0);
    float spec = pow(sh, 24.0) * uSheen * kg * smoothstep(0.15, 0.9, s);
    float rimL = pow(1.0 - abs(Nw.z), 2.0) * s * uRim * kg * kg;
    vec3 sheenC = mix(alb * 1.6, vec3(1.0), 0.15 + 0.85 * pale * pale);
    // Pale fur out of the key is lit by light that has passed through other hairs: amber.
    vec3 warm = mix(vec3(1.0, 0.8, 0.62), vec3(1.0), mix(1.0, smoothstep(0.08, 0.6, lam * kg), pale));
    vec3 col = alb * (uKeyC * warm * lam * (0.55 + 0.45 * kk) * kg * ao * uKey + uBounceC * max(dot(Nw.xy, uDown), 0.0) * ao + uKeyC * rimL)
             + uKeyC * (sheenC * spec + alb * pow(sh, 8.0) * uSheen * 0.35 * kg);
    float al = cov * uFade * (1.0 - uTipFade * smoothstep(0.55, 1.0, s));
    vCol = vec4(toSrgb(col) * al, al);
}`
const STRAND_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform float uCrimpK;
in vec4 vCol;
in float vDist;
in float vHalf;
in vec2 vCrimp;
out vec4 o;
void main() {
    // Analytic coverage across the strand: smooth lines without MSAA.
    float cov = clamp(vHalf + 0.5 - abs(vDist), 0.0, 1.0);
    // A crimped fibre turns in and out of the light along its length: periodic glints,
    // far finer than the strand's own segments.
    float g = sin(vCrimp.x * 22.0 + vCrimp.y);
    float glint = 1.0 + uCrimpK * (g * g - 0.5);
    o = vec4(vCol.rgb * glint, vCol.a) * cov;
}`
// 3. Artwork, icons, and label masks — rebuilt only when inputs change
type ImageSource = { url: string; error: string }
/** Allow image sources only; keep relative paths relative for SSR and hydration. */
function normalizeImageUrl(raw: string): ImageSource {
    const source = raw.trim()
    if (!source) return { url: "", error: "" }
    if (/[\u0000-\u001f\u007f]/.test(source))
        return { url: "", error: "The image URL contains invalid control characters." }
    if (/^data:/i.test(source)) {
        const imageData = /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp|x-icon|vnd\.microsoft\.icon|svg\+xml)(?:;[^,]*)?,/i
        return imageData.test(source)
            ? { url: source, error: "" }
            : { url: "", error: "Use an image data URL, such as data:image/png or data:image/svg+xml." }
    }
    try {
        const url = new URL(source, "https://image-source.invalid/")
        const supported = url.protocol === "https:" || url.protocol === "http:" ||
            (url.protocol === "blob:" && /^blob:(?:https?:\/\/|null\/)/i.test(source))
        if (!supported)
            return { url: "", error: "Use an HTTPS, HTTP, relative, blob, or image data URL." }
        if (url.username || url.password)
            return { url: "", error: "Image URLs must not contain embedded credentials." }
        return { url: source, error: "" }
    } catch {
        return { url: "", error: "This image URL is not valid. Choose another image or check its address." }
    }
}
type ImgEntry = {
    img: HTMLImageElement | null
    done: boolean
    ok: boolean
    error: string
    listeners: Set<() => void>
}
const IMAGES = new Map<string, ImgEntry>()
function requestImage(raw: string, onReady: () => void): ImgEntry {
    // Defense in depth: no unsupported source reaches Image.src, even from a new caller.
    const source = normalizeImageUrl(raw)
    if (!source.url || source.error)
        return { img: null, done: true, ok: false, error: source.error || "No image selected.", listeners: new Set() }
    let entry = IMAGES.get(source.url)
    if (!entry) {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        entry = { img, done: false, ok: false, error: "", listeners: new Set() }
        const current = entry
        let timeout: number | undefined
        const finish = (ok: boolean, error = "") => {
            if (current.done) return
            window.clearTimeout(timeout)
            img.onload = img.onerror = null
            current.done = true
            current.ok = ok && img.naturalWidth > 0
            current.error = current.ok ? "" : error || "The image has no readable pixels."
            current.listeners.forEach((listener) => listener())
            current.listeners.clear()
        }
        img.onload = () => finish(true)
        img.onerror = () => finish(false, "The image could not be loaded. Check the URL and allow cross-origin image access (CORS), or upload it in Framer.")
        IMAGES.set(source.url, current)
        timeout = window.setTimeout(() => finish(false, "The image took too long to load. Check the connection or choose another image."), 15000)
        img.src = source.url
    }
    if (!entry.done) entry.listeners.add(onReady)
    return entry
}
type ImageAsset = {
    url: string
    status: "empty" | "loading" | "loaded" | "error"
    img: HTMLImageElement | null
    error: string
}
/** Interactive-only loading; unsubscribe so stale requests cannot replace a newer image. */
function useImageAsset(source: ImageSource, name: string) {
    const [asset, setAsset] = useState<ImageAsset>({ url: "", status: "empty", img: null, error: "" })
    useEffect(() => {
        if (!source.url || source.error) return
        let active = true
        let entry: ImgEntry
        const publish = () => {
            if (!active) return
            setAsset({ url: source.url, status: entry.done ? entry.ok ? "loaded" : "error" : "loading", img: entry.ok ? entry.img : null, error: entry.error })
        }
        entry = requestImage(source.url, publish)
        publish()
        return () => {
            active = false
            entry.listeners.delete(publish)
        }
    }, [source.url, source.error])
    const current: ImageAsset = source.error
        ? { url: "", status: "error", img: null, error: source.error }
        : !source.url
          ? { url: "", status: "empty", img: null, error: "" }
          : asset.url === source.url
            ? asset
            : { url: source.url, status: "loading", img: null, error: "" }
    useEffect(() => {
        if (current.status === "error")
            console.warn(`Fluffy Button — ${name}: ${current.error} The button is using its fallback.`)
    }, [name, current.status, current.error])
    const reject = (error: string) => {
        setAsset((previous) => previous.url === source.url
            ? { ...previous, status: "error", img: null, error }
            : previous)
    }
    return { ...current, reject }
}
const accessibleNameOf = (name: string | undefined, label: string | undefined) =>
    name?.trim() || label?.trim() || "Button"

type ButtonFont = Pick<
    CSSProperties,
    "fontFamily" | "fontSize" | "fontWeight" | "fontStyle" | "letterSpacing" | "lineHeight"
>
type ButtonIcon =
    "arrow-up-right" | "arrow-right" | "plus" | "check" | "heart" | "sparkle" | "custom"
const ICON_PATHS: Record<string, string> = {
    "arrow-up-right": "M6 18 18 6M6 6h12v12",
    "arrow-right": "M4 12h16M13 5l7 7-7 7",
    plus: "M12 4v16M4 12h16",
    check: "M4 12l5 5L20 6",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    sparkle: "M12 2l2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z",
}
type PaintOptions = {
    label: string
    arrow: boolean
    icon: ButtonIcon
    iconPosition: string
    iconSize: number
    iconGap: number
    iconImage: HTMLImageElement | null
    mode: string
    textColor: string
    font: ButtonFont
    aspect: number
    readability: number
}
function paintArt(
    ctx: CanvasRenderingContext2D,
    fur: RGBA,
    img: HTMLImageElement | null,
    art: Artwork,
    options: PaintOptions,
) {
    const w = ctx.canvas.width,
        h = ctx.canvas.height
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = `rgb(${Math.round(fur[0] * 255)},${Math.round(fur[1] * 255)},${Math.round(fur[2] * 255)})`
    ctx.fillRect(0, 0, w, h)
    if (options.mode === "image" && img) {
        const boxW = (w * art.size) / 100,
            boxH = (h * art.size) / 100
        const k =
            art.fit === "cover"
                ? Math.max(boxW / img.naturalWidth, boxH / img.naturalHeight)
                : Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight)
        const dw = img.naturalWidth * k,
            dh = img.naturalHeight * k
        ctx.save()
        ctx.beginPath()
        ctx.rect((w - boxW) / 2, (h - boxH) / 2, boxW, boxH)
        ctx.clip()
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2 + (h * art.offsetY) / 100, dw, dh)
        ctx.restore()
    }
    if (options.mode !== "fur") return
    const font = { ...BUTTON_FONT, ...options.font },
        label = options.label
    const family = font.fontFamily || '"SF Pro Display", system-ui, sans-serif'
    const weight = Math.max(options.readability > 0 ? 700 : 400, Number(font.fontWeight) || 600)
    const scale = h / Math.max(24, options.aspect)
    let px = Math.max(12, Math.min(h * 0.5, scale * parseFloat(String(font.fontSize || 24))))
    let iconPx = Math.max(12, options.iconSize) * scale
    let gap = Math.max(0, options.iconGap) * scale
    const showIcon = options.arrow && (options.icon !== "custom" || !!options.iconImage)
    const setFont = () => {
        ctx.font = `${font.fontStyle || "normal"} ${weight} ${px}px ${family}`
    }
    setFont()
    const measured = ctx.measureText(label).width + (showIcon ? iconPx + gap : 0)
    if (measured > w * 0.8) {
        const fit = (w * 0.8) / measured
        px *= fit
        iconPx *= fit
        gap *= fit
        setFont()
    }
    const labelWidth = ctx.measureText(label).width
    const start = (w - labelWidth - (showIcon ? iconPx + gap : 0)) / 2
    const leading = showIcon && options.iconPosition === "start"
    const textX = start + (leading ? iconPx + gap : 0)
    ctx.fillStyle = options.textColor
    ctx.strokeStyle = options.textColor
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.lineWidth = px * 0.025 * options.readability
    ctx.lineJoin = "round"
    if (options.readability > 0.01) ctx.strokeText(label, textX, h / 2 + px * 0.04)
    ctx.fillText(label, textX, h / 2 + px * 0.04)
    if (!showIcon) return
    const x = leading ? start : start + labelWidth + gap,
        y = h / 2 - iconPx / 2
    if (options.icon === "custom" && options.iconImage) {
        const tint = document.createElement("canvas")
        tint.width = tint.height = Math.ceil(iconPx)
        const t = tint.getContext("2d")!
        const image = options.iconImage,
            fit = iconPx / Math.max(image.naturalWidth, image.naturalHeight)
        t.drawImage(
            image,
            (iconPx - image.naturalWidth * fit) / 2,
            (iconPx - image.naturalHeight * fit) / 2,
            image.naturalWidth * fit,
            image.naturalHeight * fit,
        )
        t.globalCompositeOperation = "source-in"
        t.fillStyle = options.textColor
        t.fillRect(0, 0, iconPx, iconPx)
        ctx.drawImage(tint, x, y, iconPx, iconPx)
    } else {
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(iconPx / 24, iconPx / 24)
        ctx.lineWidth = 2.1
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.stroke(new Path2D(ICON_PATHS[options.icon] || ICON_PATHS["arrow-up-right"]))
        ctx.restore()
    }
}
/**
 * Edge-tangent flow: hair lies along the artwork's edges (structure-tensor
 * minor eigenvector, heavily smoothed) and falls back to a combed radial
 * whorl where the picture is flat, as on the reference's white fur.
 */
function buildFlow(
    small: CanvasRenderingContext2D,
    art: HTMLCanvasElement,
    mode: Flow,
    edge: number,
    fur: RGBA,
    out: Uint8Array,
) {
    const n = FLOW
    let data: Uint8ClampedArray | null = null
    try {
        small.clearRect(0, 0, n, n)
        small.drawImage(art, 0, 0, n, n)
        data = small.getImageData(0, 0, n, n).data
    } catch {
        data = null
    }
    // Appliqué mask: wherever the picture departs from the base fur, the pile is raised.
    const mask = new Float32Array(n * n)
    if (data) {
        for (let i = 0; i < n * n; i++) {
            const dr = data[i * 4] / 255 - fur[0],
                dg = data[i * 4 + 1] / 255 - fur[1],
                db = data[i * 4 + 2] / 255 - fur[2]
            mask[i] = Math.min(1, Math.sqrt(dr * dr + dg * dg + db * db) * 2.5)
        }
        // Blurred to a padded cross-section: each shape domes up from its edges.
        const tmpM = new Float32Array(n * n)
        for (let pass = 0; pass < 3; pass++) {
            for (let y = 0; y < n; y++)
                for (let x = 0; x < n; x++) {
                    let sum = 0
                    for (let k = -2; k <= 2; k++)
                        sum += mask[y * n + Math.min(n - 1, Math.max(0, x + k))]
                    tmpM[y * n + x] = sum / 5
                }
            for (let y = 0; y < n; y++)
                for (let x = 0; x < n; x++) {
                    let sum = 0
                    for (let k = -2; k <= 2; k++)
                        sum += tmpM[Math.min(n - 1, Math.max(0, y + k)) * n + x]
                    mask[y * n + x] = sum / 5
                }
        }
    }
    if (mode !== "art" || edge <= 0) data = null
    const E = new Float32Array(n * n)
    const F = new Float32Array(n * n)
    const G = new Float32Array(n * n)
    if (data) {
        const px = (x: number, y: number, c: number) =>
            data![
                ((Math.min(n - 1, Math.max(0, y)) * n + Math.min(n - 1, Math.max(0, x))) << 2) + c
            ] / 255
        for (let y = 0; y < n; y++)
            for (let x = 0; x < n; x++) {
                let e = 0,
                    f = 0,
                    g = 0
                for (let c = 0; c < 3; c++) {
                    const gx =
                        px(x + 1, y - 1, c) +
                        2 * px(x + 1, y, c) +
                        px(x + 1, y + 1, c) -
                        px(x - 1, y - 1, c) -
                        2 * px(x - 1, y, c) -
                        px(x - 1, y + 1, c)
                    const gy =
                        px(x - 1, y + 1, c) +
                        2 * px(x, y + 1, c) +
                        px(x + 1, y + 1, c) -
                        px(x - 1, y - 1, c) -
                        2 * px(x, y - 1, c) -
                        px(x + 1, y - 1, c)
                    e += gx * gx
                    f += gx * gy
                    g += gy * gy
                }
                const i = y * n + x
                E[i] = e
                F[i] = f
                G[i] = g
            }
        const tmp = new Float32Array(n * n)
        const blur = (a: Float32Array) => {
            const r = 3
            for (let pass = 0; pass < 2; pass++) {
                for (let y = 0; y < n; y++)
                    for (let x = 0; x < n; x++) {
                        let s = 0
                        for (let k = -r; k <= r; k++)
                            s += a[y * n + Math.min(n - 1, Math.max(0, x + k))]
                        tmp[y * n + x] = s / (2 * r + 1)
                    }
                for (let y = 0; y < n; y++)
                    for (let x = 0; x < n; x++) {
                        let s = 0
                        for (let k = -r; k <= r; k++)
                            s += tmp[Math.min(n - 1, Math.max(0, y + k)) * n + x]
                        a[y * n + x] = s / (2 * r + 1)
                    }
            }
        }
        blur(E)
        blur(F)
        blur(G)
    }
    let maxMag = 0
    for (let i = 0; i < n * n; i++) {
        const l1 = (E[i] + G[i]) / 2 + Math.sqrt(((E[i] - G[i]) / 2) ** 2 + F[i] * F[i])
        maxMag = Math.max(maxMag, Math.sqrt(l1))
    }
    const ref = Math.max(0.4 * maxMag, 0.05)
    for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
            const i = y * n + x
            const cx = (x + 0.5) / n - 0.5
            const cy = (y + 0.5) / n - 0.5
            const rl = Math.hypot(cx, cy) + 1e-6
            let bx: number, by: number
            if (mode === "down") {
                bx = cx * 0.4
                by = 1
            } else {
                // Combed whorl: outward from the centre with a little gravity, brushed
                // downward right at the centre so no starburst shows.
                const k = Math.min(1, rl * 5) / rl
                bx = cx * k
                by = cy * k + 0.1 + 0.9 * Math.max(0, 1 - rl * 4)
            }
            const bl = Math.hypot(bx, by) + 1e-6
            bx /= bl
            by /= bl
            // Near the whorl's source the base field fades out; mark it so hair stands up there.
            let src = Math.min(1, bl / 0.6)
            let dx = bx,
                dy = by
            if (data) {
                const e = E[i],
                    f = F[i],
                    g = G[i]
                const half = Math.sqrt(((e - g) / 2) ** 2 + f * f)
                const l1 = (e + g) / 2 + half
                const l2 = (e + g) / 2 - half
                let vx = e >= g ? l1 - g : f
                let vy = e >= g ? f : l1 - e
                const vl = Math.hypot(vx, vy)
                if (vl > 1e-9) {
                    vx /= vl
                    vy /= vl
                    // Comb along the edge without choosing a direction for it: take the base
                    // direction and remove only the part that would cross the edge (v is the
                    // edge normal). Picking a sign for the edge tangent instead flips it
                    // somewhere along every curved edge and opens a seam there.
                    const coh = (l1 - l2) / (l1 + l2 + 1e-9)
                    const w = Math.min(1, (Math.sqrt(l1) / ref) ** 2) * coh * edge
                    src = Math.max(src, w)
                    const across = (bx * vx + by * vy) * Math.min(w, 0.92)
                    dx = bx - vx * across
                    dy = by - vy * across
                    const dl = Math.hypot(dx, dy) + 1e-9
                    dx /= dl
                    dy /= dl
                }
            }
            out[i * 4] = Math.round((dx * 0.5 + 0.5) * 255)
            out[i * 4 + 1] = Math.round((dy * 0.5 + 0.5) * 255)
            out[i * 4 + 2] = Math.round(mask[i] * 255)
            out[i * 4 + 3] = Math.round(src * 255)
        }
}
// 4. Public props and Framer component
interface FluffyButtonProps {
    label?: string
    /** An optional, descriptive screen-reader name independent of the visible label. */
    accessibleName?: string
    link?: string
    newTab?: boolean
    labelStyle?: "clean" | "fur" | "image"
    /** Legacy key retained so existing Show icon settings keep their values. */
    arrow?: boolean
    icon?: ButtonIcon
    iconImage?: ImageValue
    iconPosition?: "start" | "end"
    iconSize?: number
    iconGap?: number
    textureStyle?: "plush" | "shag"
    furReadability?: number
    font?: ButtonFont
    furColor?: string
    textColor?: string
    image?: ImageValue
    artwork?: Partial<Artwork>
    shape?: {
        radius?: number
        puff?: number
        inset?: number
    }
    fur?: Partial<Fur>
    response?: {
        enabled?: boolean
        reach?: number
        strength?: number
        breeze?: number
        press?: number
    }
    /** One short gust per hover entry; independent of idle breeze and brushing. */
    hoverWind?: Partial<typeof DEFAULT_HOVER_WIND>
    hoverStyle?: {
        scale?: number
        transition?: Transition
    }
    quality?: "auto" | "high" | "eco"
    advanced?: Partial<Advanced>
    disabled?: boolean
    onTap?: () => void
    style?: CSSProperties
}
// Load the default typeface in new projects, where the preview font may not exist.
const DEFAULT_FONT_CSS = `/* vietnamese */
@font-face {
  font-family: 'Fluffy Button Mona Sans';
  font-style: normal;
  font-weight: 500;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/monasans/v4/o-0bIpQmx24alC5A4PNB6Ryti20_6n1iPHjc5aHdu2ui.woff2) format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Fluffy Button Mona Sans';
  font-style: normal;
  font-weight: 500;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/monasans/v4/o-0bIpQmx24alC5A4PNB6Ryti20_6n1iPHjc5aDdu2ui.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Fluffy Button Mona Sans';
  font-style: normal;
  font-weight: 500;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/monasans/v4/o-0bIpQmx24alC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`
const BUTTON_FONT: ButtonFont = {
    fontFamily: '"Fluffy Button Mona Sans", "Mona Sans", sans-serif',
    fontSize: "22px",
    fontWeight: 500,
    lineHeight: "1.1em",
    letterSpacing: "0px",
}
function InteractiveFluffyButton({
    label = "Get started",
    accessibleName = "",
    link = DEFAULT_LINK,
    newTab = true,
    labelStyle = "fur",
    arrow = false,
    icon = "arrow-up-right",
    iconImage,
    iconPosition = "end",
    iconSize = 22,
    iconGap = 12,
    textureStyle = "plush",
    furReadability = 85,
    font = BUTTON_FONT,
    furColor = "#E7E3FF",
    textColor = "#000000",
    image,
    artwork,
    shape,
    fur,
    response,
    hoverWind,
    hoverStyle,
    quality = "high",
    advanced,
    disabled = false,
    onTap,
    style,
}: FluffyButtonProps) {
    const rootRef = useRef<HTMLElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [ready, setReady] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const [reducedMotion, setReducedMotion] = useState(false)
    const shShape = { ...DEFAULT_SHAPE, ...shape }
    const rs = { ...DEFAULT_INTERACTION, ...response }
    const wind = { ...DEFAULT_HOVER_WIND, ...hoverWind }
    const hover = { ...DEFAULT_HOVER_STYLE, ...hoverStyle }
    const hasLink = Boolean(link)
    const onEditor = RenderTarget.current() === RenderTarget.canvas
    const art = { ...DEFAULT_ARTWORK, ...artwork }
    const fr = { ...DEFAULT_FUR, ...fur }
    const adv = { ...DEFAULT_ADVANCED, ...advanced }
    const artSource = normalizeImageUrl(labelStyle === "image" ? imageOf(image) : "")
    const iconSource = normalizeImageUrl(arrow && icon === "custom" ? imageOf(iconImage) : "")
    const artAsset = useImageAsset(artSource, "Artwork")
    const iconAsset = useImageAsset(iconSource, "Custom icon")
    const src = artSource.url
    const iconSrc = iconSource.url
    const effectiveIcon = icon === "custom" && (iconAsset.status === "error" || iconAsset.status === "empty")
        ? "arrow-up-right" : icon
    const readability = labelStyle === "fur" ? clampN(furReadability, 0, 100, 85) / 100 : 0
    const cfg = {
        iconSrc,
        artImage: artAsset.img,
        iconImage: iconAsset.img,
        imageState: artAsset.status + "|" + iconAsset.status,
        rejectArtwork: artAsset.reject,
        rejectIcon: iconAsset.reject,
        textureStyle,
        readability,
        src,
        furColor,
        radius: shShape.radius,
        puff: shShape.puff,
        inset: shShape.inset,
        breeze: rs.enabled && !disabled ? rs.breeze : 0,
        wind: { ...wind, enabled: wind.enabled && !disabled },
        art,
        fur: fr,
        rs: { reach: rs.reach, strength: rs.enabled && !disabled ? rs.strength : 0 },
        adv,
        quality,
        paint: {
            label,
            arrow,
            icon: effectiveIcon,
            iconPosition,
            iconSize,
            iconGap,
            iconImage: null as HTMLImageElement | null,
            mode: labelStyle,
            textColor,
            font,
            aspect: 88,
            readability,
        },
        artKey: [
            iconSrc,
            effectiveIcon,
            iconPosition,
            iconSize,
            iconGap,
            readability,
            textureStyle,
            src,
            art.fit,
            art.size,
            art.offsetY,
            furColor,
            fr.flow,
            adv.edgeFlow,
            label,
            arrow,
            labelStyle,
            textColor,
            JSON.stringify(font),
        ].join("|"),
    }
    const cfgRef = useRef(cfg)
    cfgRef.current = cfg
    const wakeRef = useRef<() => void>(() => {})
    const [generation, setGeneration] = useState(0)
    // Every prop change redraws, even when the loop has settled to zero.
    useEffect(() => wakeRef.current())
    useEffect(() => {
        const rootEl = rootRef.current
        const canvasEl = canvasRef.current
        if (!rootEl || !canvasEl) return
        setReady(false)
        const ctx = canvasEl.getContext("webgl2", {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
            powerPreference: "low-power",
            preserveDrawingBuffer: false,
        }) as WebGL2RenderingContext | null
        // The styled button and its label remain usable without WebGL2.
        if (!ctx) return
        const root: HTMLElement = rootEl
        const canvas: HTMLCanvasElement = canvasEl
        const gl: WebGL2RenderingContext = ctx
        const shaders: WebGLShader[] = []
        const programs: WebGLProgram[] = []
        const build = (vs: string, fs: string, varyings?: string[]) => {
            const compile = (type: number, s: string) => {
                const sh = gl.createShader(type)!
                gl.shaderSource(sh, s)
                gl.compileShader(sh)
                if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
                    throw new Error(gl.getShaderInfoLog(sh) || "shader")
                shaders.push(sh)
                return sh
            }
            const p = gl.createProgram()!
            gl.attachShader(p, compile(gl.VERTEX_SHADER, vs))
            gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs))
            if (varyings) gl.transformFeedbackVaryings(p, varyings, gl.INTERLEAVED_ATTRIBS)
            gl.linkProgram(p)
            if (!gl.getProgramParameter(p, gl.LINK_STATUS))
                throw new Error(gl.getProgramInfoLog(p) || "link")
            programs.push(p)
            return p
        }
        let underProg: WebGLProgram, prepProg: WebGLProgram, strandProg: WebGLProgram, labelProg: WebGLProgram
        try {
            underProg = build(UNDER_VERT, UNDER_FRAG)
            labelProg = build(LABEL_VERT, LABEL_FRAG)
            prepProg = build(PREP_VERT, PREP_FRAG, ["oA", "oB", "oC", "oD"])
            strandProg = build(STRAND_VERT, STRAND_FRAG)
        } catch (err) {
            console.error("Fluffy Button:", err)
            shaders.forEach((s) => gl.deleteShader(s))
            programs.forEach((p) => gl.deleteProgram(p))
            return
        }
        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        // Per-hair records (4 × vec4), written by the prep pass, read per instance by the strands.
        const STRIDE = 64
        const strandBuf = gl.createBuffer()
        const strandVao = gl.createVertexArray()
        const tf = gl.createTransformFeedback()
        gl.bindVertexArray(strandVao)
        gl.bindBuffer(gl.ARRAY_BUFFER, strandBuf)
        for (let i = 0; i < 4; i++) {
            gl.enableVertexAttribArray(i)
            gl.vertexAttribPointer(i, 4, gl.FLOAT, false, STRIDE, i * 16)
            gl.vertexAttribDivisor(i, 1)
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null)
        gl.bindVertexArray(vao)
        let capacity = 0
        // Inputs of the last prep run; it reruns only when one changes.
        const prepKey = new Float64Array(13).fill(NaN)
        let flowVersion = 0
        // Uniforms upload only when their value changed.
        type Slot = {
            loc: WebGLUniformLocation | null
            v: number[]
        }
        const makeU = (prog: WebGLProgram) => {
            const slots = new Map<string, Slot>()
            const slot = (name: string) => {
                let s = slots.get(name)
                if (!s) {
                    s = { loc: gl.getUniformLocation(prog, name), v: [NaN, NaN, NaN, NaN] }
                    slots.set(name, s)
                }
                return s
            }
            const same = (s: Slot, a: number, b: number, c: number, d: number) =>
                s.v[0] === a && s.v[1] === b && s.v[2] === c && s.v[3] === d
            const put = (s: Slot, a: number, b: number, c: number, d: number) => {
                s.v[0] = a
                s.v[1] = b
                s.v[2] = c
                s.v[3] = d
            }
            return {
                f1(name: string, a: number) {
                    const s = slot(name)
                    if (same(s, a, 0, 0, 0)) return
                    put(s, a, 0, 0, 0)
                    gl.uniform1f(s.loc, a)
                },
                u1(name: string, a: number) {
                    const s = slot(name)
                    if (same(s, a, 0, 0, 0)) return
                    put(s, a, 0, 0, 0)
                    gl.uniform1ui(s.loc, a)
                },
                i1(name: string, a: number) {
                    const s = slot(name)
                    if (same(s, a, 0, 0, 0)) return
                    put(s, a, 0, 0, 0)
                    gl.uniform1i(s.loc, a)
                },
                f2(name: string, a: number, b: number) {
                    const s = slot(name)
                    if (same(s, a, b, 0, 0)) return
                    put(s, a, b, 0, 0)
                    gl.uniform2f(s.loc, a, b)
                },
                f3(name: string, a: number, b: number, c: number) {
                    const s = slot(name)
                    if (same(s, a, b, c, 0)) return
                    put(s, a, b, c, 0)
                    gl.uniform3f(s.loc, a, b, c)
                },
                f4(name: string, a: number, b: number, c: number, d: number) {
                    const s = slot(name)
                    if (same(s, a, b, c, d)) return
                    put(s, a, b, c, d)
                    gl.uniform4f(s.loc, a, b, c, d)
                },
                m3(name: string, m: Float32Array) {
                    gl.uniformMatrix3fv(slot(name).loc, false, m)
                },
            }
        }
        const U_LB = makeU(labelProg)
        const U_UN = makeU(underProg)
        const U_ST = makeU(strandProg)
        const U_PR = makeU(prepProg)
        // Textures: artwork on unit 0, flow on unit 1.
        const artTex = gl.createTexture()
        const flowTex = gl.createTexture()
        const labelTex = gl.createTexture()
        const setupTex = (t: WebGLTexture | null, unit: number) => {
            gl.activeTexture(gl.TEXTURE0 + unit)
            gl.bindTexture(gl.TEXTURE_2D, t)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        }
        setupTex(artTex, 0)
        setupTex(flowTex, 1)
        setupTex(labelTex, 2)
        gl.useProgram(underProg)
        U_UN.i1("uArt", 0)
        gl.useProgram(strandProg)
        U_ST.i1("uArt", 0)
        U_ST.i1("uLabelMask", 2)
        gl.useProgram(labelProg)
        U_LB.i1("uLabelMask", 2)
        gl.useProgram(prepProg)
        U_PR.i1("uFlow", 1)
        const artCanvas = document.createElement("canvas")
        artCanvas.width = artCanvas.height = ART
        const artCtx = artCanvas.getContext("2d")!
        const smallCanvas = document.createElement("canvas")
        smallCanvas.width = smallCanvas.height = FLOW
        const smallCtx = smallCanvas.getContext("2d", { willReadFrequently: true })!
        const flowData = new Uint8Array(FLOW * FLOW * 4)
        const labelCanvas = document.createElement("canvas")
        const labelCtx = labelCanvas.getContext("2d", { willReadFrequently: true })!
        const haloCanvas = document.createElement("canvas")
        const haloCtx = haloCanvas.getContext("2d", { willReadFrequently: true })!
        let artKey = ""
        let artImgState = ""
        const tainted = new Set<string>()
        const rebuildArt = (
            c: typeof cfg,
            img: HTMLImageElement | null,
            iconImg: HTMLImageElement | null,
        ) => {
            const fur = parseColor(c.furColor, FUR_FALLBACK)
            artCanvas.width = 1024
            const safeInset = clampN(c.inset, 0, Math.min(cssW, cssH) * 0.35, 12)
            artCanvas.height = Math.max(
                128,
                Math.min(
                    2048,
                    Math.round(
                        (1024 * (cssH - 2 * safeInset)) / Math.max(24, cssW - 2 * safeInset),
                    ),
                ),
            )
            let options = {
                ...c.paint,
                iconImage: iconImg,
                aspect: Math.max(24, cssH - 2 * safeInset),
            }
            paintArt(artCtx, fur, img, c.art, options)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, artTex)
            try {
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.SRGB8_ALPHA8,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    artCanvas,
                )
            } catch {
                // Reset the tainted canvas and remove BOTH sources before retrying once.
                const message = "The image cannot be used as a fur texture. Upload it in Framer or use an image server with CORS enabled."
                if (img) {
                    tainted.add(c.src)
                    c.rejectArtwork(message)
                }
                if (iconImg) {
                    tainted.add(c.iconSrc)
                    c.rejectIcon(message)
                }
                options = { ...options, iconImage: null, icon: options.icon === "custom" ? "arrow-up-right" : options.icon }
                artCanvas.width = artCanvas.width
                paintArt(artCtx, fur, null, c.art, options)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.SRGB8_ALPHA8,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    artCanvas,
                )
            }
            const flow = (["art", "radial", "down"] as const).includes(c.fur.flow)
                ? c.fur.flow
                : DEFAULT_FUR.flow
            buildFlow(
                smallCtx,
                artCanvas,
                flow,
                clampN(c.adv.edgeFlow, 0, 100, DEFAULT_ADVANCED.edgeFlow) / 100,
                fur,
                flowData,
            )
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, flowTex)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                FLOW,
                FLOW,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                flowData,
            )
            labelCanvas.width = haloCanvas.width = artCanvas.width
            labelCanvas.height = haloCanvas.height = artCanvas.height
            paintArt(labelCtx, [0, 0, 0, 1], null, c.art, { ...options, textColor: "#FFFFFF" })
            haloCtx.filter = `blur(${Math.max(4, artCanvas.height * 0.035)}px)`
            haloCtx.drawImage(labelCanvas, 0, 0)
            const mask = labelCtx.getImageData(0, 0, labelCanvas.width, labelCanvas.height)
            const halo = haloCtx.getImageData(0, 0, haloCanvas.width, haloCanvas.height)
            for (let i = 0; i < mask.data.length; i += 4) {
                mask.data[i + 1] = halo.data[i]
                mask.data[i + 2] = 0
                mask.data[i + 3] = 255
            }
            labelCtx.putImageData(mask, 0, 0)
            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_2D, labelTex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, labelCanvas)
            flowVersion++
        }
        // Layout size from ResizeObserver only; never read per frame.
        let cssW = Math.max(1, root.offsetWidth)
        let cssH = Math.max(1, root.offsetHeight)
        let quality = 1
        let qualityMode = cfgRef.current.quality
        let rendered = false
        const applySize = () => {
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                cfgRef.current.quality === "eco" ? 1 : 2,
            )
            const budget = Math.min(
                1,
                Math.sqrt(PIXEL_BUDGET / Math.max(1, cssW * cssH * dpr * dpr)),
            )
            const k = dpr * budget * quality
            const w = Math.max(1, Math.round(cssW * k))
            const h = Math.max(1, Math.round(cssH * k))
            if (canvas.width !== w) canvas.width = w
            if (canvas.height !== h) canvas.height = h
        }
        applySize()
        const ro = new ResizeObserver((entries) => {
            const r = entries[0].contentRect
            cssW = Math.max(1, r.width)
            cssH = Math.max(1, r.height)
            applySize()
            wake()
        })
        ro.observe(root)
        // Pointer: handlers only record; the rect is read once per frame, only after a move or scroll.
        const ptr = { cx: 0, cy: 0, u: 0.5, v: 0.5, over: false, moved: false }
        let gustStartedAt: number | null = null
        const startGust = () => {
            const wind = cfgRef.current.wind
            if (!wind.enabled || clampN(wind.strength, 0, 10, DEFAULT_HOVER_WIND.strength) <= 0)
                return
            gustStartedAt = performance.now()
            wake()
        }
        const onMove = (e: PointerEvent) => {
            // Browsers re-send moves at the same spot after layout; those change nothing.
            if (ptr.over && e.clientX === ptr.cx && e.clientY === ptr.cy) return
            ptr.cx = e.clientX
            ptr.cy = e.clientY
            ptr.over = true
            ptr.moved = true
            wake()
        }
        const onLeave = () => {
            ptr.over = false
            wake()
        }
        const onUp = (e: PointerEvent) => {
            // On touch, lifting the finger ends the hover.
            if (e.pointerType !== "mouse") onLeave()
        }
        const onScroll = () => {
            if (ptr.over) ptr.moved = true
        }
        const onEnter = (event: PointerEvent) => {
            if (event.pointerType !== "touch") startGust()
            onMove(event)
        }
        const onDown = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") startGust()
            onMove(event)
        }
        const onKeyboardFocus = () => {
            if (root.matches(":focus-visible")) startGust()
        }
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("focusin", onKeyboardFocus)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("pointerup", onUp)
        root.addEventListener("pointercancel", onLeave)
        window.addEventListener("scroll", onScroll, { passive: true, capture: true })
        const mq =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        let reduced = !!mq?.matches
        const onMq = () => {
            reduced = !!mq?.matches
            setReducedMotion(reduced)
            wake()
        }
        setReducedMotion(reduced)
        mq?.addEventListener?.("change", onMq)
        // Off-screen instances and hidden tabs stop drawing entirely.
        let visible = true
        const io = new IntersectionObserver((es) => {
            visible = es[es.length - 1].isIntersecting
            wake()
        })
        io.observe(root)
        const onVis = () => wake()
        document.addEventListener("visibilitychange", onVis)
        let disposed = false
        let raf = 0
        const onLost = (e: Event) => {
            e.preventDefault()
            disposed = true
            setReady(false)
            cancelAnimationFrame(raf)
        }
        const onRestored = () => setGeneration((g) => g + 1)
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)
        // A fixed view prevents pointer-driven rotation. Only the fur responds.
        const onCanvas = RenderTarget.current() === RenderTarget.canvas
        const rot = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
        const view = { cam: 1, fx: 1, fy: 1 }
        const sh = {
            a: 1,
            b: 1,
            rc: 0,
            bevel: 0,
            dome: 0,
            lx: 0,
            ly: 0,
            lz: 1,
            dnx: 0,
            dny: -1,
            b0: 0,
            b1: 0,
            b2: 0,
            keyLow: 0,
            k0: 1,
            k1: 1,
            k2: 1,
        }
        const setShared = (U: ReturnType<typeof makeU>) => {
            U.f2("uHalf", sh.a, sh.b)
            U.f1("uCorner", Math.min(sh.rc, sh.a * 0.999))
            U.f1("uBevel", Math.max(sh.bevel, 1e-3))
            U.f1("uDome", sh.dome)
            U.m3("uRot", rot)
            U.f1("uCam", view.cam)
            U.f2("uFrame", view.fx, view.fy)
            U.f2("uRollCS", 1, 0)
            U.f2("uOff", 0, 0)
            U.f3("uLight", sh.lx, sh.ly, sh.lz)
            U.f3("uBounceC", sh.b0, sh.b1, sh.b2)
            U.f2("uDown", sh.dnx, sh.dny)
            U.f1("uKeyLow", sh.keyLow)
            U.f1("uKey", 1.9)
            U.f3("uKeyC", sh.k0, sh.k1, sh.k2)
            U.f1("uFade", 1)
        }
        const sm = { bx: 0, by: 0, bw: 0 }
        let clock = 0
        let lastDraw = -1
        let frameEma = 16.7
        let slowFrames = 0
        let fastFrames = 0
        let scheduled = false
        function wake() {
            if (disposed || scheduled) return
            scheduled = true
            raf = requestAnimationFrame(loop)
        }
        wakeRef.current = wake
        function loop(now: number) {
            scheduled = false
            if (disposed || !visible || document.hidden) {
                lastDraw = -1
                return
            }
            const c = cfgRef.current
            const adv = c.adv
            // Quality changes should take effect immediately, without a resize.
            if (qualityMode !== c.quality) {
                qualityMode = c.quality
                quality = 1
                applySize()
            }
            // Artwork: (re)build when the picture, its framing or the fur colour changed.
            const img = tainted.has(c.src) ? null : c.artImage
            const iconImg = tainted.has(c.iconSrc) ? null : c.iconImage
            const imgState = c.imageState
            const currentArtKey = c.artKey + "|" + cssW + "x" + cssH
            if (currentArtKey !== artKey || imgState !== artImgState) {
                artKey = currentArtKey
                artImgState = imgState
                rebuildArt(c, img, iconImg)
            }
            const breezeK =
                reduced || onCanvas ? 0 : clampN(c.breeze, 0, 10, DEFAULT_INTERACTION.breeze) / 10
            const tBw =
                ptr.over && !reduced && !onCanvas
                    ? clampN(c.rs.strength, 0, 10, DEFAULT_INTERACTION.strength) / 5
                    : 0
            const gustDuration = clampN(c.wind.duration, 0.1, 1.5, DEFAULT_HOVER_WIND.duration)
            const gustStrength = clampN(c.wind.strength, 0, 10, DEFAULT_HOVER_WIND.strength)
            const gustAge = gustStartedAt === null ? 0 : Math.max(0, (now - gustStartedAt) / 1000)
            const gustActive =
                gustStartedAt !== null &&
                gustAge < gustDuration &&
                c.wind.enabled &&
                gustStrength > 0 &&
                !reduced &&
                !onCanvas
            const gustProgress = Math.min(1, gustAge / gustDuration)
            // An immediate nudge followed by a soft decay; holding hover does not retrigger it.
            const gustEnvelope = gustActive ? Math.pow(1 - gustProgress, 2) : 0
            if (!gustActive) gustStartedAt = null
            const gustAngle = clampN(c.wind.direction, 0, 360, DEFAULT_HOVER_WIND.direction) * D2R
            const gustFrequency = 2 + 1.6 * clampN(c.wind.speed, 0, 10, DEFAULT_HOVER_WIND.speed)
            const active = ptr.moved || Math.abs(tBw - sm.bw) > 4e-3 || gustActive
            // 60 fps while anything moves; 30 fps for the breeze; nothing once settled.
            const gap = active ? 15 : 31
            if (lastDraw >= 0 && now - lastDraw < gap) {
                wake()
                return
            }
            const dt = lastDraw < 0 ? 0 : Math.min((now - lastDraw) / 1000, 1 / 20)
            if (lastDraw >= 0) {
                frameEma += (now - lastDraw - frameEma) * 0.1
                // Step resolution down when frames run long; win it back when there is room again.
                const target = gap + 2
                if (frameEma > target * 1.45) slowFrames++
                else slowFrames = 0
                if (frameEma < target * 1.1) fastFrames++
                else fastFrames = 0
                if (c.quality === "auto" && slowFrames > 20 && quality > 0.6) {
                    quality = Math.max(0.6, quality * 0.88)
                    slowFrames = 0
                    applySize()
                } else if (c.quality === "auto" && fastFrames > 180 && quality < 1) {
                    quality = Math.min(1, quality * 1.08)
                    fastFrames = 0
                    applySize()
                }
            }
            lastDraw = now
            clock = (clock + dt) % 3600
            let movedNow = false
            if (ptr.moved) {
                ptr.moved = false
                movedNow = true
                // Normalised against the box as displayed, so canvas zoom and scaled previews stay exact.
                const r = root.getBoundingClientRect()
                ptr.u = (ptr.cx - r.left) / Math.max(1, r.width)
                ptr.v = (ptr.cy - r.top) / Math.max(1, r.height)
            }
            // Geometry.
            const short = Math.min(cssW, cssH)
            const inset = clampN(c.inset, 0, short * 0.35, 12)
            const aFull = Math.max(8, cssW - 2 * inset) / short
            const bFull = Math.max(8, cssH - 2 * inset) / short
            const a = aFull
            const b = bFull
            const ratio = b / a
            const rc = Math.min(a, b) * (clampN(c.radius, 0, 100, 100) / 100)
            const pf = clampN(c.puff, 0, 10, DEFAULT_SHAPE.puff)
            const bevel = Math.min(a, b) * (0.06 + 0.032 * pf)
            const dome = Math.min(a, b) * 0.012 * pf
            const fov = clampN(adv.lens, 5, 60, DEFAULT_ADVANCED.lens) * D2R
            const cam = 1 / Math.tan(fov / 2)
            const minCss = Math.min(cssW, cssH)
            const fx = cssW / minCss
            const fy = cssH / minCss
            view.cam = cam
            view.fx = fx
            view.fy = fy
            // Brush: cursor ray → the tile's top plane, in tile-local coordinates.
            if (ptr.over) {
                const nx = ptr.u * 2 - 1
                const ny = 1 - ptr.v * 2
                const X = nx * fx,
                    Y = ny * fy
                const zTop = bevel + dome * 0.5
                const n0 = rot[6],
                    n1 = rot[7],
                    n2 = rot[8]
                const denom = X * n0 + Y * n1 - cam * n2
                if (Math.abs(denom) > 1e-6) {
                    const t = (zTop - cam * n2) / denom
                    const hx = X * t,
                        hy = Y * t,
                        hz = cam + -cam * t
                    const lx = rot[0] * hx + rot[1] * hy + rot[2] * hz
                    const ly = rot[3] * hx + rot[4] * hy + rot[5] * hz
                    if (sm.bw < 0.02) {
                        // Arriving: the parting opens where the cursor is, not sliding in from elsewhere.
                        sm.bx = lx
                        sm.by = ly
                    }
                    const kf = movedNow || dt > 0 ? 1 - Math.exp(-dt * 18) : 0
                    sm.bx += (lx - sm.bx) * kf
                    sm.by += (ly - sm.by) * kf
                }
            }
            sm.bw += (tBw - sm.bw) * (1 - Math.exp(-dt * 8))
            if (Math.abs(tBw - sm.bw) < 4e-3) sm.bw = tBw
            // The light is fixed in screen space; angle 90° points from the top.
            const la = clampN(adv.lightAngle, 0, 360, DEFAULT_ADVANCED.lightAngle) * D2R
            const le = clampN(adv.lightHeight, 0, 90, DEFAULT_ADVANCED.lightHeight) * D2R
            const lsx = Math.cos(la) * Math.cos(le),
                lsy = Math.sin(la) * Math.cos(le),
                lz = Math.sin(le)
            const lx = lsx,
                ly = lsy
            const dnx = 0,
                dny = -1
            // Gravity in tile-local space: R^T · down.
            const gx = rot[0] * dnx + rot[1] * dny
            const gy = rot[3] * dnx + rot[4] * dny
            const gz = rot[6] * dnx + rot[7] * dny
            const bg = parseColor("#0B0B0B", BG_FALLBACK)
            const fc = parseColor(c.furColor, FUR_FALLBACK)
            const bgl0 = lin(bg[0]),
                bgl1 = lin(bg[1]),
                bgl2 = lin(bg[2])
            const bounce = clampN(adv.bounce, 0, 100, DEFAULT_ADVANCED.bounce) / 100
            const fu = c.fur
            const density = clampN(fu.density, 0.5, 10, DEFAULT_FUR.density)
            const lengthK = clampN(fu.length, 0, 10, DEFAULT_FUR.length)
            const frizz = clampN(fu.frizz, 0, 10, DEFAULT_FUR.frizz) / 10
            const kPx = canvas.width / cssW
            // Count scales with the visible surface area and the selected density.
            const tileArea = aFull * bFull * minCss * minCss
            // A device still slow at the resolution floor also thins the coat; wider hairs keep it covered.
            const thin = Math.min(1, quality / 0.75)
            const count = Math.min(
                c.quality === "eco" ? 45000 : MAX_STRANDS,
                Math.round(
                    (c.textureStyle === "shag" ? 1.5 : 1) *
                        (density / 5) *
                        tileArea *
                        STRANDS_PER_PX *
                        thin,
                ),
            )
            const reach = clampN(c.rs.reach, 0, 10, DEFAULT_INTERACTION.reach)
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.disable(gl.BLEND)
            // Transparent surface: the parent page owns the background.
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            const kc = parseColor(adv.lightColor, LIGHT_FALLBACK)
            sh.a = a
            sh.b = b
            sh.rc = rc
            sh.bevel = bevel
            sh.dome = dome
            sh.lx = lx
            sh.ly = ly
            sh.lz = lz
            sh.dnx = dnx
            sh.dny = dny
            sh.b0 = bgl0 * bounce * 14
            sh.b1 = bgl1 * bounce * 14
            sh.b2 = bgl2 * bounce * 14
            sh.keyLow = 1 - clampN(adv.keyFalloff, 0, 100, DEFAULT_ADVANCED.keyFalloff) / 100
            sh.k0 = lin(kc[0])
            sh.k1 = lin(kc[1])
            sh.k2 = lin(kc[2])
            // 2. Undercoat: the dark skin between the hairs.
            gl.useProgram(underProg)
            setShared(U_UN)
            U_UN.f1("uUnder", clampN(adv.undercoat, 0, 100, DEFAULT_ADVANCED.undercoat) / 100)
            // One device pixel in tile units, for the undercoat's anti-aliased edge.
            U_UN.f1("uPx", 2 / (minCss * kPx))
            gl.drawArrays(gl.TRIANGLES, 0, GRID * GRID * 6)
            // 3. Hair records: rerun the prep pass only when what it builds from changed.
            const shag = c.textureStyle === "shag" ? 1 : 0
            const lenK = (0.012 + 0.013 * lengthK) * Math.min(1, ratio) * (shag ? 0.82 : 1)
            const liftV = 0.1 + 0.15 * clampN(fu.lift, 0, 10, DEFAULT_FUR.lift)
            const seed = Math.round(clampN(adv.seed, 0, 100, 0))
            const clump =
                (clampN(adv.clump, 0, 100, DEFAULT_ADVANCED.clump) / 100) * (shag ? 0.35 : 1)
            const rimFrac = clampN(adv.rimShare, 0, 50, DEFAULT_ADVANCED.rimShare) / 100
            const cornerU = Math.min(rc / a, 0.999)
            const bevelU = Math.max(bevel / a, 1e-3)
            const domeU = dome / a
            const embossU =
                Math.min(1, ratio) *
                (clampN(adv.emboss, 0, 100, DEFAULT_ADVANCED.emboss) / 100) *
                0.1
            const key = prepKey
            if (
                key[0] !== count ||
                key[1] !== seed ||
                key[2] !== rimFrac ||
                key[3] !== cornerU ||
                key[4] !== bevelU ||
                key[5] !== domeU ||
                key[6] !== liftV ||
                key[7] !== frizz ||
                key[8] !== clump ||
                key[9] !== lenK ||
                key[10] !== flowVersion ||
                key[11] !== embossU ||
                key[12] !== ratio
            ) {
                key[0] = count
                key[1] = seed
                key[2] = rimFrac
                key[3] = cornerU
                key[4] = bevelU
                key[5] = domeU
                key[6] = liftV
                key[7] = frizz
                key[8] = clump
                key[9] = lenK
                key[10] = flowVersion
                key[11] = embossU
                key[12] = ratio
                if (count > capacity) {
                    capacity = Math.min(MAX_STRANDS, Math.ceil(count * 1.25))
                    gl.bindBuffer(gl.ARRAY_BUFFER, strandBuf)
                    gl.bufferData(gl.ARRAY_BUFFER, capacity * STRIDE, gl.DYNAMIC_COPY)
                    gl.bindBuffer(gl.ARRAY_BUFFER, null)
                }
                gl.useProgram(prepProg)
                // Store hair roots in a unit surface; the strand pass applies the displayed size.
                U_PR.f2("uHalf", 1, ratio)
                U_PR.f1("uCorner", cornerU)
                U_PR.f1("uBevel", bevelU)
                U_PR.f1("uDome", domeU)
                U_PR.f1("uLift", liftV)
                U_PR.f1("uSpread", 0.5 + frizz * 0.6)
                U_PR.f1("uClump", clump)
                U_PR.f1("uCs", lenK * 0.75)
                U_PR.f1("uRimFrac", rimFrac)
                U_PR.f1("uEmboss", embossU)
                U_PR.u1("uSeed", seed)
                gl.enable(gl.RASTERIZER_DISCARD)
                gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf)
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, strandBuf)
                gl.beginTransformFeedback(gl.POINTS)
                gl.drawArrays(gl.POINTS, 0, count)
                gl.endTransformFeedback()
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null)
                gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
                gl.disable(gl.RASTERIZER_DISCARD)
            }
            // 4. Strands.
            gl.useProgram(strandProg)
            setShared(U_ST)
            U_ST.f2("uRes", canvas.width, canvas.height)
            U_ST.f3("uGrav", gx, gy, gz)
            U_ST.f4("uBrush", sm.bx, sm.by, Math.min(a, b) * (0.08 + 0.035 * reach), sm.bw)
            U_ST.f1("uLen", a * lenK)
            U_ST.f1("uFrizz", frizz)
            U_ST.f1("uShag", shag)
            U_ST.f1("uLegibility", c.readability)
            U_ST.f1("uGrow", 1)
            U_ST.f1("uTime", clock)
            U_ST.f1("uBreeze", breezeK * 0.35)
            U_ST.f4(
                "uGust",
                Math.cos(gustAngle),
                Math.sin(gustAngle),
                gustEnvelope * gustStrength * 0.3,
                gustFrequency,
            )
            U_ST.f1("uGustTime", gustActive ? Math.min(gustAge, gustDuration) : 0)
            U_ST.f1(
                "uWidth",
                (clampN(adv.hairWidth, 0.2, 4, DEFAULT_ADVANCED.hairWidth) *
                    kPx *
                    (shag ? 0.62 : 1)) /
                    Math.sqrt(thin),
            )
            U_ST.f1(
                "uJitter",
                (clampN(adv.colorJitter, 0, 50, DEFAULT_ADVANCED.colorJitter) / 100) *
                    (shag ? 0.55 : 1),
            )
            U_ST.f1("uTipFade", clampN(adv.tipFade, 0, 100, DEFAULT_ADVANCED.tipFade) / 100)
            U_ST.f1(
                "uRootShade",
                (clampN(adv.rootShade, 0, 100, DEFAULT_ADVANCED.rootShade) / 100) *
                    (shag ? 0.55 : 1),
            )
            U_ST.f1("uSheen", clampN(adv.sheen, 0, 100, DEFAULT_ADVANCED.sheen) / 100)
            U_ST.f1("uRim", clampN(adv.rimLight, 0, 100, DEFAULT_ADVANCED.rimLight) / 100)
            U_ST.f1("uCount", Math.max(1, count))
            U_ST.f1(
                "uDepth",
                (clampN(adv.depthShade, 0, 100, DEFAULT_ADVANCED.depthShade) / 100) *
                    (shag ? 0.55 : 1),
            )
            U_ST.u1("uSeed", seed)
            U_ST.f1("uCrimpK", clampN(adv.crimp, 0, 100, DEFAULT_ADVANCED.crimp) / 100)
            gl.bindVertexArray(strandVao)
            // Root halves of every hair first, then tip halves: real fur shows tips over roots.
            U_ST.i1("uSegBase", 0)
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (HALF_SEG + 1) * 2, count)
            if (c.paint.mode === "fur" && c.readability > 0) {
                gl.bindVertexArray(vao)
                gl.useProgram(labelProg)
                setShared(U_LB)
                const color = parseColor(c.paint.textColor, [0, 0, 0, 1])
                U_LB.f4("uLabelColor", color[0], color[1], color[2], color[3])
                U_LB.f1("uLabelLift", a * lenK * 1.05 * c.readability)
                // Small containers need a firmer core; the upper fiber tips stay visible.
                U_LB.f1("uLabelStrength", c.readability * c.readability * (cssW < 360 ? 0.95 : 0.8))
                gl.drawArrays(gl.TRIANGLES, 0, GRID * GRID * 6)
                gl.useProgram(strandProg)
                gl.bindVertexArray(strandVao)
            }
            U_ST.i1("uSegBase", HALF_SEG)
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (HALF_SEG + 1) * 2, count)
            gl.bindVertexArray(vao)
            if (!rendered) {
                rendered = true
                setReady(true)
            }
            if (active || breezeK > 0) wake()
        }
        const onFonts = () => {
            artKey = ""
            wake()
        }
        document.fonts?.addEventListener("loadingdone", onFonts)
        document.fonts?.ready.then(() => {
            if (!disposed) onFonts()
        })
        wake()
        return () => {
            disposed = true
            wakeRef.current = () => {}
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            document.fonts?.removeEventListener("loadingdone", onFonts)
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("focusin", onKeyboardFocus)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointerup", onUp)
            root.removeEventListener("pointercancel", onLeave)
            window.removeEventListener("scroll", onScroll, { capture: true })
            document.removeEventListener("visibilitychange", onVis)
            mq?.removeEventListener?.("change", onMq)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            if (gl.isContextLost()) return
            gl.deleteTexture(artTex)
            gl.deleteTexture(flowTex)
            gl.deleteTexture(labelTex)
            gl.deleteVertexArray(vao)
            gl.deleteVertexArray(strandVao)
            gl.deleteBuffer(strandBuf)
            gl.deleteTransformFeedback(tf)
            shaders.forEach((s) => gl.deleteShader(s))
            programs.forEach((p) => gl.deleteProgram(p))
        }
    }, [generation, hasLink])
    const Tag = hasLink ? motion.a : motion.button
    const inset = clampN(shShape.inset, 0, 64, 12)
    const squish = disabled || reducedMotion ? 1 : 1 - clampN(rs.press, 0, 12, 3) / 100
    const hoverScale = clampN(hover.scale, 80, 110, DEFAULT_HOVER_STYLE.scale) / 100
    const targetScale =
        disabled || reducedMotion || onEditor
            ? 1
            : (hovered ? hoverScale : 1) * (pressed ? squish : 1)
    const isFurLabel = ready && (labelStyle === "fur" || (labelStyle === "image" && artAsset.status === "loaded"))
    return (
        <Tag
            animate={{ scale: targetScale }}
            transition={
                disabled || reducedMotion || onEditor
                    ? { duration: 0 }
                    : pressed
                      ? { type: "tween", duration: 0.16, ease: [0.22, 1, 0.36, 1] }
                      : hover.transition
            }
            onHoverStart={() => {
                if (!disabled && !onEditor) setHovered(true)
            }}
            onHoverEnd={() => setHovered(false)}
            transformTemplate={(_, generated) => {
                const base = style?.transform && style.transform !== "none" ? style.transform : ""
                if (!generated || generated === "none") return base || "none"
                return base ? `${base} ${generated}` : generated
            }}
            ref={(element: HTMLButtonElement | HTMLAnchorElement | null) => {
                rootRef.current = element
            }}
            {...(link
                ? {
                      href: disabled || onEditor ? undefined : link,
                      target: newTab ? "_blank" : undefined,
                      rel: newTab ? "noopener noreferrer" : undefined,
                  }
                : { type: "button" as const, disabled })}
            aria-label={accessibleNameOf(accessibleName, label)}
            data-renderer="interactive"
            data-artwork-state={artAsset.status}
            data-icon-state={iconAsset.status}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={(event) => {
                if (!disabled && event.button === 0) setPressed(true)
            }}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onKeyDown={(event) => {
                if (!disabled && (event.key === " " || event.key === "Enter")) setPressed(true)
            }}
            onKeyUp={() => setPressed(false)}
            onFocus={(event) => setFocused(event.currentTarget.matches(":focus-visible"))}
            onBlur={() => {
                setFocused(false)
                setPressed(false)
            }}
            onClick={(event) => {
                if (disabled || onEditor) {
                    event.preventDefault()
                    return
                }
                onTap?.()
            }}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 400,
                height: 157,
                padding: "28px 40px",
                boxSizing: "border-box",
                border: 0,
                borderRadius: shShape.radius >= 80 ? 999 : shShape.radius,
                background: "transparent",
                color: textColor,
                textDecoration: "none",
                whiteSpace: "nowrap",
                ...BUTTON_FONT,
                ...font,
                touchAction: "manipulation",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                cursor: disabled ? "not-allowed" : "pointer",
                ...style,
                maxWidth: "100%",
                overflow: "visible",
                opacity: disabled ? 0.5 : style?.opacity,
                transform: undefined,
                transition: undefined,
                outline: focused ? `2px solid ${textColor}` : "none",
                outlineOffset: 4,
            }}
        >
            <style>{DEFAULT_FONT_CSS}</style>
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset,
                    borderRadius: shShape.radius >= 80 ? 999 : shShape.radius,
                    background: furColor,
                    boxShadow: "inset 0 -8px 14px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.15)",
                    opacity: ready ? 0 : 1,
                    pointerEvents: "none",
                }}
            />
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    opacity: ready ? 1 : 0,
                    pointerEvents: "none",
                }}
            />
            <span
                aria-hidden="true"
                style={{
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: iconPosition === "start" ? "row-reverse" : "row",
                    gap: `${iconGap}px`,
                    alignItems: "center",
                    pointerEvents: "none",
                    maxWidth: "100%",
                    overflow: "hidden",
                    opacity: isFurLabel ? 0 : 1,
                }}
            >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {label}
                </span>
                {arrow &&
                    (effectiveIcon === "custom" ? (
                        iconSrc && (
                            <img
                                src={iconSrc}
                                alt=""
                                aria-hidden="true"
                                style={{
                                    width: iconSize,
                                    height: iconSize,
                                    objectFit: "contain",
                                    flexShrink: 0,
                                }}
                            />
                        )
                    ) : (
                        <svg
                            width={iconSize}
                            height={iconSize}
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            focusable="false"
                            style={{ flexShrink: 0 }}
                        >
                            <path
                                d={ICON_PATHS[effectiveIcon] || ICON_PATHS["arrow-up-right"]}
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    ))}
            </span>
        </Tag>
    )
}
/** Static canvas/export preview: DOM and CSS only, with no GPU, observers, or frame loop. */
function StaticFluffyButton({
    label = "Get started", accessibleName = "", link = DEFAULT_LINK, newTab = true,
    labelStyle = "fur", arrow = false, icon = "arrow-up-right", iconImage,
    iconPosition = "end", iconSize = 22, iconGap = 12, image, artwork,
    font = BUTTON_FONT, furColor = "#E7E3FF", textColor = "#000000", shape,
    disabled = false, style,
}: FluffyButtonProps) {
    const artSource = normalizeImageUrl(labelStyle === "image" ? imageOf(image) : "")
    const iconSource = normalizeImageUrl(arrow && icon === "custom" ? imageOf(iconImage) : "")
    const [loadedArt, setLoadedArt] = useState("")
    const [failedArt, setFailedArt] = useState("")
    const [failedIcon, setFailedIcon] = useState("")
    const artError = artSource.error || (artSource.url && failedArt === artSource.url ? "Artwork could not be loaded. Choose another image." : "")
    const iconError = iconSource.error || (iconSource.url && failedIcon === iconSource.url ? "Custom icon could not be loaded. Using the built-in arrow." : "")
    const artworkVisible = Boolean(artSource.url && !artError && loadedArt === artSource.url)
    const customIcon = icon === "custom" && Boolean(iconSource.url) && !iconError
    const effectiveIcon = icon === "custom" ? "arrow-up-right" : icon
    const settings = { ...DEFAULT_SHAPE, ...shape }
    const art = { ...DEFAULT_ARTWORK, ...artwork }
    const radius = settings.radius >= 80 ? 999 : settings.radius
    const inset = clampN(settings.inset, 0, 64, 12)
    const notice = artError ? "Artwork unavailable" : iconError ? "Icon unavailable" :
        labelStyle === "image" && !artSource.url ? "Add artwork" :
        arrow && icon === "custom" && !iconSource.url ? "Add icon" : ""
    const Tag = link ? "a" : "button"
    return (
        <Tag
            {...(link ? { href: undefined } : { type: "button" as const, disabled })}
            aria-label={accessibleNameOf(accessibleName, label)}
            aria-disabled={disabled || undefined}
            data-renderer="static"
            data-artwork-state={artError ? "error" : artworkVisible ? "loaded" : artSource.url ? "loading" : "empty"}
            data-icon-state={iconError ? "error" : iconSource.url ? "selected" : "empty"}
            title={artError || iconError || undefined}
            style={{
                position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 400, height: 157, padding: "28px 40px", boxSizing: "border-box",
                border: 0, borderRadius: radius, background: "transparent", color: textColor,
                textDecoration: "none", whiteSpace: "nowrap", ...BUTTON_FONT, ...font, ...style,
                maxWidth: "100%", overflow: "visible", opacity: disabled ? 0.5 : style?.opacity,
            }}
        >
            <style>{DEFAULT_FONT_CSS}</style>
            <span aria-hidden="true" style={{
                position: "absolute", inset, borderRadius: radius, overflow: "hidden",
                backgroundColor: furColor,
                backgroundImage: "radial-gradient(ellipse at 38% 15%, rgba(255,255,255,.5), transparent 65%), repeating-linear-gradient(115deg, rgba(255,255,255,.15) 0px, transparent 1px, rgba(0,0,0,.035) 2px, transparent 3px)",
                boxShadow: "inset 0 -8px 14px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.15)",
            }}>
                {artSource.url && !artError && <img
                    src={artSource.url} alt="" aria-hidden="true"
                    onLoad={() => setLoadedArt(artSource.url)} onError={() => setFailedArt(artSource.url)}
                    style={{ position: "absolute", width: `${art.size}%`, height: `${art.size}%`, left: "50%", top: `${50 + art.offsetY}%`, transform: "translate(-50%, -50%)", objectFit: art.fit, opacity: artworkVisible ? 1 : 0 }}
                />}
            </span>
            <span aria-hidden="true" style={{
                position: "relative", display: "inline-flex", alignItems: "center", maxWidth: "100%",
                flexDirection: iconPosition === "start" ? "row-reverse" : "row", gap: iconGap,
                opacity: artworkVisible ? 0 : 1, overflow: "hidden", pointerEvents: "none",
            }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                {arrow && (customIcon ? <img src={iconSource.url} alt="" aria-hidden="true"
                    onError={() => setFailedIcon(iconSource.url)}
                    style={{ width: iconSize, height: iconSize, objectFit: "contain", flexShrink: 0 }} /> :
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
                        <path d={ICON_PATHS[effectiveIcon] || ICON_PATHS["arrow-up-right"]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>)}
            </span>
            {notice && <span aria-hidden="true" style={{ position: "absolute", bottom: 1, font: "10px/1.2 system-ui, sans-serif", color: textColor, opacity: 0.7 }}>{notice}</span>}
        </Tag>
    )
}
/**
 * A strand-rendered plush primary button, with a lightweight static canvas/export preview.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 157
 */
export default function FluffyButton(props: FluffyButtonProps) {
    const isStaticRenderer = useIsStaticRenderer()
    // Mounting a separate renderer means static output never even runs the heavy effects.
    return isStaticRenderer
        ? <StaticFluffyButton {...props} />
        : <InteractiveFluffyButton {...props} />
}

// 5. Editor controls — keys stay stable for existing instances.
addPropertyControls(FluffyButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get started",
        description:
            "The visible button text. Also used as the screen-reader name when Accessible name is empty.",
    },
    accessibleName: {
        type: ControlType.String,
        title: "Accessible name",
        defaultValue: "",
        placeholder: "e.g. Start your free trial",
        description: "Optional screen-reader name. Describe the action, especially for artwork or icon-only buttons. Leave empty to use Label. Include the visible label in a longer name when possible. Icons are decorative.",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: DEFAULT_LINK,
        description:
            "Choose a page or enter a URL for navigation. Leave empty for an action-only button. Tap can also run when a link is set.",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New tab",
        defaultValue: true,
        hidden: (props) => !props.link,
        description: "On opens the link in a new tab. Only shown when Link has a destination.",
    },
    labelStyle: {
        type: ControlType.Enum,
        title: "Label style",
        options: ["fur", "clean", "image"],
        optionTitles: ["Fur", "Crisp", "Artwork"],
        defaultValue: "fur",
        description:
            "Crisp = normal text above the fur. Fur = text made from short, raised fibers. Artwork = your image becomes the fur pattern.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: { fontSize: 22, lineHeight: "1.1em", letterSpacing: "0px" },
        hidden: (props) => props.labelStyle === "image",
        description:
            "Sets the label font and size. Fur labels use stronger strokes to stay readable. Try 24\u201328px for a standard button.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Label color",
        defaultValue: "#000000",
        hidden: (props) => props.labelStyle === "image",
        description:
            "Color of the text and built-in icon. Also tints a custom icon in Fur mode. Artwork keeps its own image colors.",
    },
    furReadability: {
        type: ControlType.Number,
        title: "Fur readability",
        min: 0,
        max: 100,
        defaultValue: 85,
        unit: "%",
        hidden: (props) => props.labelStyle !== "fur",
        description:
            "0 = unprotected fur lettering. Higher values strengthen the letter core and shorten fibers over text. Use 100% and 24px or larger labels for phone and tablet layouts. Smaller containers get extra contrast.",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Artwork",
        hidden: (props) => props.labelStyle !== "image",
        description:
            "Upload an image or transparent logo to turn into colored fur. If it fails, the readable Label stays visible. Supported: HTTPS, HTTP, relative, blob, and image data URLs. External images need CORS access for fur rendering.",
    },
    artwork: {
        type: ControlType.Object,
        title: "Art placement",
        hidden: (props) => props.labelStyle !== "image",
        controls: {
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["contain", "cover"],
                description:
                    "Contain shows the whole image. Cover fills the image area and crops overflow.",
                defaultValue: DEFAULT_ARTWORK.fit,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 10,
                max: 100,
                unit: "%",
                description:
                    "10\u2013100% of the available surface. Higher values make the artwork larger. Start at 80%.",
                defaultValue: DEFAULT_ARTWORK.size,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Y offset",
                min: -50,
                max: 50,
                unit: "%",
                description:
                    "Negative values move the artwork up; positive values move it down. 0 centers it.",
                defaultValue: DEFAULT_ARTWORK.offsetY,
            },
        },
        description:
            "Controls how your image fits on the button. These values do not change the button's size.",
    },
    arrow: {
        type: ControlType.Boolean,
        title: "Show icon",
        defaultValue: false,
        hidden: (props) => props.labelStyle === "image",
        description:
            "Show or hide the icon without changing the label. The saved property key remains arrow for compatibility.",
    },
    icon: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["arrow-up-right", "arrow-right", "plus", "check", "heart", "sparkle", "custom"],
        optionTitles: ["Arrow ↗", "Arrow →", "Plus", "Check", "Heart", "Sparkle", "Upload custom"],
        defaultValue: "arrow-up-right",
        hidden: (props) => !props.arrow || props.labelStyle === "image",
        description:
            "Choose a built-in icon or Upload custom. Available in Crisp and Fur label modes.",
    },
    iconImage: {
        type: ControlType.ResponsiveImage,
        title: "Custom icon",
        hidden: (props) => !props.arrow || props.icon !== "custom" || props.labelStyle === "image",
        description:
            "Upload a transparent PNG or SVG. Crisp keeps its colors; Fur uses its silhouette. An unavailable image falls back to the built-in arrow. Supports HTTPS, HTTP, relative, blob, and image data URLs. External images need CORS access.",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon side",
        options: ["start", "end"],
        optionTitles: ["Left", "Right"],
        defaultValue: "end",
        hidden: (props) => !props.arrow || props.labelStyle === "image",
        description: "Places the icon before or after the label.",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon size",
        min: 12,
        max: 48,
        defaultValue: 22,
        unit: "px",
        hidden: (props) => !props.arrow || props.labelStyle === "image",
        description: "Icon size in CSS pixels. 22px is a good match for a 24px label.",
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon gap",
        min: 0,
        max: 24,
        defaultValue: 12,
        unit: "px",
        hidden: (props) => !props.arrow || props.labelStyle === "image",
        description:
            "Space between the label and icon in CSS pixels. Start at 12px; 0 removes the gap.",
    },
    furColor: {
        type: ControlType.Color,
        title: "Fur color",
        defaultValue: "#E7E3FF",
        description:
            "Base color of the plush surface. Lighting can tint how it appears. Transparent areas of artwork show this color.",
    },
    textureStyle: {
        type: ControlType.Enum,
        title: "Texture",
        options: ["plush", "shag"],
        optionTitles: ["Combed plush", "Soft shag"],
        defaultValue: "plush",
        description:
            "Combed plush has a directional, brushed pile. Soft shag uses finer, more upright fibers with softer shading.",
    },
    fur: {
        type: ControlType.Object,
        title: "Fluff",
        controls: {
            length: {
                type: ControlType.Number,
                title: "Length",
                min: 0,
                max: 10,
                step: 0.1,
                description:
                    "0 = shortest fibers; 10 = longest. Higher values make a larger fuzzy edge. Start at 4\u20136.",
                defaultValue: DEFAULT_FUR.length,
            },
            density: {
                type: ControlType.Number,
                title: "Density",
                min: 0.5,
                max: 10,
                step: 0.1,
                description:
                    "0.5 = sparse; 10 = dense. Higher values add more strands and cost more to render. Start at 5.",
                defaultValue: DEFAULT_FUR.density,
            },
            lift: {
                type: ControlType.Number,
                title: "Lift",
                min: 0,
                max: 10,
                step: 0.1,
                description:
                    "0 = fibers lie flatter; 10 = fibers stand higher. Use with Length to control fluffiness. Start at 5.",
                defaultValue: DEFAULT_FUR.lift,
            },
            frizz: {
                type: ControlType.Number,
                title: "Frizz",
                min: 0,
                max: 10,
                step: 0.1,
                description:
                    "0 = straighter fibers; 10 = curlier, more irregular fibers. Start at 3\u20136 for an even pile.",
                defaultValue: DEFAULT_FUR.frizz,
            },
            flow: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["art", "radial", "down"],
                optionTitles: ["Follow artwork", "Radial", "Brushed down"],
                description:
                    "Follow artwork combs around image/text edges. Radial spreads outward. Brushed down falls downward. Most visible in Combed plush.",
                defaultValue: DEFAULT_FUR.flow,
            },
        },
        description:
            "Main fur settings. All 0\u201310 values are relative scales, not millimeters. Start with Length 6, Density 5, Lift 5, Frizz 6.",
    },
    shape: {
        type: ControlType.Object,
        title: "Shape",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Roundness",
                min: 0,
                max: 100,
                unit: "%",
                description:
                    "0% = square corners; 100% = fully rounded. A wide button at 100% becomes a pill.",
                defaultValue: DEFAULT_SHAPE.radius,
            },
            puff: {
                type: ControlType.Number,
                title: "Plumpness",
                min: 0,
                max: 10,
                step: 0.1,
                description:
                    "0 = flatter cushion; 10 = rounder, fuller cushion. This changes the body, not the fiber length. Start at 5.",
                defaultValue: DEFAULT_SHAPE.puff,
            },
            inset: {
                type: ControlType.Number,
                title: "Fur margin",
                min: 4,
                max: 32,
                unit: "px",
                description:
                    "Inner space for the fuzzy edge. Larger margins make the visible body smaller inside the same frame. Start at 12px.",
                defaultValue: DEFAULT_SHAPE.inset,
            },
        },
        description:
            "Controls the cushion shape and space for the fur edge. Resize the instance to change overall width and height.",
    },
    response: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Fur motion",
                description:
                    "Off stops cursor brushing and breeze. The button can still be clicked, and Press depth works separately.",
                defaultValue: DEFAULT_INTERACTION.enabled,
            },
            reach: {
                type: ControlType.Number,
                title: "Brush size",
                min: 0,
                max: 10,
                description:
                    "0 = small brush area; 10 = wide brush area around the cursor or finger. Start at 5.",
                defaultValue: DEFAULT_INTERACTION.reach,
            },
            strength: {
                type: ControlType.Number,
                title: "Brush force",
                min: 0,
                max: 10,
                description:
                    "0 = no brushing; 10 = strong parting and flattening. Start at 4\u20136.",
                defaultValue: DEFAULT_INTERACTION.strength,
            },
            breeze: {
                type: ControlType.Number,
                title: "Breeze",
                min: 0,
                max: 10,
                step: 0.1,
                description:
                    "0 = no idle movement; 10 = strong fiber movement. Try 0\u20131 for a subtle button.",
                defaultValue: DEFAULT_INTERACTION.breeze,
            },
            press: {
                type: ControlType.Number,
                title: "Press depth",
                min: 0,
                max: 12,
                unit: "%",
                description:
                    "How much the button shrinks while pressed. 0% = no shrink; 3% = subtle feedback; 12% = deep press.",
                defaultValue: DEFAULT_INTERACTION.press,
            },
        },
        description:
            "Controls brushing, idle movement, and pressing. Preview the page to try them; the editor shows a still surface.",
    },
    hoverStyle: {
        type: ControlType.Object,
        title: "Hover style",
        description:
            "The preview's 95% spring shrink is included in the shared component. It is separate from the fur's Hover wind.",
        controls: {
            scale: {
                type: ControlType.Number,
                title: "Size",
                min: 80,
                max: 110,
                step: 1,
                unit: "%",
                defaultValue: DEFAULT_HOVER_STYLE.scale,
                description:
                    "95% matches the preview. 100% keeps the button size unchanged; values above 100% enlarge it on hover.",
            },
            transition: {
                type: ControlType.Transition,
                title: "Transition",
                defaultValue: DEFAULT_HOVER_TRANSITION,
                description:
                    "Spring settings for the hover size change. The default matches the preview: stiffness 400, damping 40, mass 3.",
            },
        },
    },
    hoverWind: {
        type: ControlType.Object,
        title: "Hover wind",
        description:
            "One quick gust each time the pointer enters. It settles while you stay hovered. Touch and keyboard focus also trigger it. Separate from brushing and idle Breeze.",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: DEFAULT_HOVER_WIND.enabled,
                description:
                    "Switch the hover gust on or off. Your button and other interactions keep working.",
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                min: 0,
                max: 10,
                step: 0.1,
                defaultValue: DEFAULT_HOVER_WIND.strength,
                description:
                    "0 = no gust; 10 = strong push. Start at 2–3 for a small movement of the fur tips.",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 10,
                step: 0.1,
                defaultValue: DEFAULT_HOVER_WIND.speed,
                description:
                    "0 = slow flutter; 10 = fast flutter. This changes how quickly the fibers move, not how long the effect lasts. Start at 6.",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.1,
                max: 1.5,
                step: 0.05,
                unit: "s",
                defaultValue: DEFAULT_HOVER_WIND.duration,
                description:
                    "Time until the gust fully settles. 0.45s gives a quick burst. Shorter values end sooner; longer values fade more slowly.",
            },
            direction: {
                type: ControlType.Number,
                title: "Direction",
                min: 0,
                max: 360,
                step: 1,
                unit: "°",
                defaultValue: DEFAULT_HOVER_WIND.direction,
                description:
                    "Direction the wind pushes the fur: 0° right, 90° up, 180° left, 270° down.",
            },
        },
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        description:
            "Blocks clicks, links, and Tap actions, and dims the button. Use to show an unavailable action.",
    },
    onTap: {
        type: ControlType.EventHandler,
        title: "Tap",
        description:
            "Connect a Framer action that runs on pointer or keyboard activation. If Link is set, navigation also happens.",
    },
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        options: ["auto", "high", "eco"],
        optionTitles: ["Auto", "High", "Economy"],
        defaultValue: "high",
        description:
            "Auto adapts resolution to slower frames. High uses the full detail budget. Economy caps resolution and strand count. Start with Auto.",
    },
    advanced: {
        type: ControlType.Object,
        title: "Lighting & detail",
        controls: {
            seed: {
                type: ControlType.Number,
                title: "Fur seed",
                min: 0,
                max: 100,
                step: 1,
                description:
                    "A repeatable fur arrangement. A different integer creates a new pattern. 0 is a fixed seed, not a random mode.",
                defaultValue: DEFAULT_ADVANCED.seed,
            },
            hairWidth: {
                type: ControlType.Number,
                title: "Fiber width",
                min: 0.2,
                max: 2,
                step: 0.05,
                description:
                    "Base fiber width. Lower values look finer; higher values look thicker. Soft shag makes them finer again. Start near 0.85.",
                defaultValue: DEFAULT_ADVANCED.hairWidth,
            },
            clump: {
                type: ControlType.Number,
                title: "Clumping",
                min: 0,
                max: 100,
                unit: "%",
                description:
                    "0% = even pile; 100% = strong tufts with more visible gaps. Start at 20\u201335%.",
                defaultValue: DEFAULT_ADVANCED.clump,
            },
            emboss: {
                type: ControlType.Number,
                title: "Raised pattern",
                min: 0,
                max: 100,
                unit: "%",
                description:
                    "0% = flat color pattern; 100% = more raised pattern. Applies to Fur/Artwork. Fur readability adds its own letter protection.",
                defaultValue: DEFAULT_ADVANCED.emboss,
            },
            lightAngle: {
                type: ControlType.Number,
                title: "Light angle",
                min: 0,
                max: 360,
                unit: "°",
                description:
                    "Direction around the surface: 0\u00B0 from the right, 90\u00B0 from the top, 180\u00B0 from the left, 270\u00B0 from the bottom.",
                defaultValue: DEFAULT_ADVANCED.lightAngle,
            },
            lightHeight: {
                type: ControlType.Number,
                title: "Light height",
                min: 10,
                max: 90,
                unit: "°",
                description:
                    "10\u00B0 = grazing light that emphasizes texture; 90\u00B0 = light facing the surface directly. Start near 40\u00B0.",
                defaultValue: DEFAULT_ADVANCED.lightHeight,
            },
            lightColor: {
                type: ControlType.Color,
                title: "Light color",
                description:
                    "Color of the main light. White preserves the fur color more closely; colored light tints the whole surface.",
                defaultValue: DEFAULT_ADVANCED.lightColor,
            },
            sheen: {
                type: ControlType.Number,
                title: "Sheen",
                min: 0,
                max: 100,
                unit: "%",
                description:
                    "0% = matte fibers; 100% = stronger shiny highlights. Start at 15\u201330%.",
                defaultValue: DEFAULT_ADVANCED.sheen,
            },
            rootShade: {
                type: ControlType.Number,
                title: "Root shadow",
                min: 0,
                max: 100,
                unit: "%",
                description:
                    "0% = lighter roots; 100% = deeper shadows between strands. Start at 40\u201360%.",
                defaultValue: DEFAULT_ADVANCED.rootShade,
            },
        },
        description:
            "Optional finishing controls. Set the main Fluff values first, then adjust light, thickness, and shading here.",
    },
})
