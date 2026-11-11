// Transmission — a lily rendered as live text.
//
// A signed-distance-field lily is raymarched in WebGL, then redrawn every frame
// as a grid of monospace glyphs. Scroll (or the Progress slider) tightens the
// grid, opens the bloom, lifts the camera and grows a decoder lens until the
// flower is the render. Pointer opens a lens, drag turns it, click pulses.
//
// Visual only — no copy, no overlays. Set type in Framer on top of it.
// Framer code component. No npm dependencies beyond react + framer.

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ============================================================ types */

type GlyphSetName = "ascii" | "binary" | "blocks"

type FontStyle = CSSProperties | undefined

interface Palette {
    tepal: string
    throat: string
    freckle: string
    filament: string
    anther: string
    stem: string
    rim: string
    background: string
    ink: string
    accent: string
}

interface Timing {
    gridFrom: number
    gridTo: number
    bloomFrom: number
    bloomTo: number
    pitchFrom: number
    pitchTo: number
    decodeFrom: number
    decodeTo: number
}

interface Grid {
    cellStart: number
    cellEnd: number
    cellStartMobile: number
    cellEndMobile: number
    aspect: number
    breakpoint: number
}

interface Flower {
    tiltClosed: number
    tiltOpen: number
    curl: number
    yawStart: number
    idleSpin: number
    distNear: number
    distFar: number
    pitchStart: number
    pitchEnd: number
    bloomStart: number
    bloomEnd: number
}

interface Fx {
    grain: number
    scanlines: number
    vignette: number
    chroma: number
    lensRim: number
    trace: number
    flicker: number
    glow: number
}

interface Quality {
    adaptive: boolean
    scale: number
    minScale: number
    maxScale: number
    maxScaleMobile: number
    steps: number
    stepsLow: number
    dprCap: number
}

interface Glyphs {
    set: GlyphSetName
    useCustom: boolean
    custom: string
}

interface Interaction {
    lens: boolean
    lensRadius: number
    lensRadiusMobile: number
    drag: boolean
    dragSensitivity: number
    pulse: boolean
    pulseSpeed: number
}

interface Props {
    style?: CSSProperties
    layout: "fill" | "track"
    trackVh: number
    source: "scroll" | "manual" | "auto"
    progress: number
    autoDuration: number
    autoMode: "once" | "loop" | "pingpong"
    respectReducedMotion: boolean
    background: string
    fade: boolean
    monoFont: FontStyle
    timing: Timing
    grid: Grid
    flower: Flower
    palette: Palette
    fx: Fx
    quality: Quality
    glyphs: Glyphs
    interaction: Interaction
}

/* ============================================================ defaults */

const GLYPH_SETS: Record<GlyphSetName, string> = {
    ascii: " .:-=+*oxX#%@",
    binary: " .·:01",
    blocks: " ·░▒▓█",
}

const D = {
    timing: {
        gridFrom: 0,
        gridTo: 0.34,
        bloomFrom: 0.12,
        bloomTo: 0.58,
        pitchFrom: 0.3,
        pitchTo: 0.72,
        decodeFrom: 0.66,
        decodeTo: 0.93,
    } as Timing,
    grid: {
        cellStart: 20,
        cellEnd: 9,
        cellStartMobile: 15,
        cellEndMobile: 8,
        aspect: 0.62,
        breakpoint: 700,
    } as Grid,
    flower: {
        tiltClosed: 1.3,
        tiltOpen: 0.12,
        curl: 0.75,
        yawStart: 0.6,
        idleSpin: 0.12,
        distNear: 4.1,
        distFar: 5,
        pitchStart: 0.28,
        pitchEnd: 1.18,
        bloomStart: 0.3,
        bloomEnd: 1,
    } as Flower,
    palette: {
        tepal: "rgb(237, 232, 214)",
        throat: "rgb(158, 184, 82)",
        freckle: "rgb(115, 31, 26)",
        filament: "rgb(199, 204, 158)",
        anther: "rgb(158, 61, 20)",
        stem: "rgb(56, 87, 31)",
        rim: "rgb(214, 240, 107)",
        background: "rgb(3, 4, 3)",
        ink: "rgb(232, 230, 214)",
        accent: "rgb(214, 240, 107)",
    } as Palette,
    fx: {
        grain: 0.015,
        scanlines: 0.12,
        vignette: 0.9,
        chroma: 6,
        lensRim: 0.7,
        trace: 0.18,
        flicker: 1,
        glow: 1,
    } as Fx,
    quality: {
        adaptive: true,
        scale: 0.6,
        minScale: 0.34,
        maxScale: 0.75,
        maxScaleMobile: 0.55,
        steps: 96,
        stepsLow: 70,
        dprCap: 2,
    } as Quality,
    glyphs: {
        set: "ascii",
        useCustom: false,
        custom: " .:-=+*oxX#%@",
    } as Glyphs,
    interaction: {
        lens: true,
        lensRadius: 128,
        lensRadiusMobile: 88,
        drag: true,
        dragSensitivity: 0.008,
        pulse: true,
        pulseSpeed: 0.55,
    } as Interaction,
}

/* ============================================================ helpers */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

const smooth = (a: number, b: number, v: number) => {
    if (b === a) return v >= b ? 1 : 0
    const t = clamp01((v - a) / (b - a))
    return t * t * (3 - 2 * t)
}

/** CSS colour string -> [r,g,b] in 0..1. Handles #rgb, #rrggbb, rgb(), rgba(). */
function toVec3(
    css: string | undefined,
    fallback: [number, number, number]
): [number, number, number] {
    if (!css) return fallback
    const s = css.trim()
    if (s[0] === "#") {
        const hex = s.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            const r = parseInt(hex[0] + hex[0], 16)
            const g = parseInt(hex[1] + hex[1], 16)
            const b = parseInt(hex[2] + hex[2], 16)
            return [r / 255, g / 255, b / 255]
        }
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            return [r / 255, g / 255, b / 255]
        }
        return fallback
    }
    const m = s.match(/rgba?\(([^)]+)\)/i)
    if (m) {
        const parts = m[1].split(/[,/\s]+/).filter(Boolean)
        const num = (p: string) =>
            p.indexOf("%") >= 0 ? (parseFloat(p) / 100) * 255 : parseFloat(p)
        const r = num(parts[0]),
            g = num(parts[1]),
            b = num(parts[2])
        if ([r, g, b].some((n) => Number.isNaN(n))) return fallback
        return [r / 255, g / 255, b / 255]
    }
    return fallback
}

const familyOf = (f: FontStyle, fallback: string) => {
    const fam = f && (f as CSSProperties).fontFamily
    return typeof fam === "string" && fam.length ? fam : fallback
}

const MONO_FALLBACK =
    '"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace'

/* ============================================================ shaders */

const VERT = `
precision highp float;
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`

const SCENE_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uBloom;
uniform float uYaw;
uniform float uPitch;
uniform float uPulse;
uniform float uCurl;
uniform float uGrain;
uniform int uSteps;
uniform vec2 uTilt;
uniform vec2 uDist;
uniform vec3 uTepal;
uniform vec3 uThroat;
uniform vec3 uFreckle;
uniform vec3 uFilament;
uniform vec3 uAnther;
uniform vec3 uStem;
uniform vec3 uRimC;
uniform vec3 uBgC;
varying vec2 vUv;

#define PI 3.14159265

vec2 rotv(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sdEllipsoid(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// One ring of n tepals via polar repetition. 'along' = 0 at base, 1 at tip.
float tepals(vec3 p, float n, float offs, float L, float W, float tilt, float curl, out float along, out float side) {
  float sector = 2.0 * PI / n;
  float a = atan(p.z, p.x) + offs;
  float id = floor(a / sector + 0.5);
  a -= id * sector;
  float r = length(p.xz);
  vec3 q = vec3(r * cos(a), p.y, r * sin(a));   // x: outward, y: up, z: across
  float flutter = sin(uTime * 1.3 + id * 1.7) * 0.03 + uPulse * 0.12 * sin(uTime * 22.0 + id);
  q.xy = rotv(q.xy, -(tilt + flutter));         // into petal frame
  q.y += curl * q.x * q.x;                      // recurved tips (lily)

  along = clamp(q.x / L, 0.0, 1.0);
  side = q.z / W;
  float thick = 0.024 * (1.0 - along * 0.45);
  float d = sdEllipsoid(q - vec3(L * 0.52, 0.0, 0.0), vec3(L * 0.52, thick, W));
  float bend = 2.0 * curl * q.x;
  d /= sqrt(1.0 + bend * bend);                 // undo the bend's stretch so marching stays exact
  return d;
}

// .x distance, .y material (1 tepal, 2 filament, 3 anther, 4 stem/base), .z along, .w side
vec4 map(vec3 p) {
  p.y -= 0.15;
  float b = uBloom;
  float tilt = mix(uTilt.x, uTilt.y, b);
  float curl = mix(0.0, uCurl, b);
  float al1, sd1, al2, sd2;
  float d1 = tepals(p, 3.0, 0.0, 0.98, 0.24, tilt, curl, al1, sd1);
  float d2 = tepals(p, 3.0, PI / 3.0, 0.92, 0.28, tilt + 0.1, curl * 0.9, al2, sd2);
  vec4 res = d1 < d2 ? vec4(d1, 1.0, al1, sd1) : vec4(d2, 1.0, al2, sd2);

  // receptacle + stem
  float base = sdEllipsoid(p - vec3(0.0, -0.06, 0.0), vec3(0.11, 0.16, 0.11));
  vec3 sp = p; sp.x += 0.08 * sin(sp.y * 1.2);
  float stem = sdCapsule(sp, vec3(0.0, -0.1, 0.0), vec3(0.0, -3.2, 0.0), 0.035);
  float bs = smin(base, stem, 0.08);
  res.x = smin(res.x, bs, 0.07);
  if (bs < d1 && bs < d2) res.yzw = vec3(4.0, 0.0, 0.0);

  // six filaments with anthers (polar repetition)
  float sector = PI / 3.0;
  float a = atan(p.z, p.x) + 0.5;
  a -= floor(a / sector + 0.5) * sector;
  float r = length(p.xz);
  vec3 q = vec3(r * cos(a), p.y, r * sin(a));
  vec3 tip = vec3(mix(0.08, 0.34, b), mix(0.45, 0.58, b), 0.0);
  float fil = sdCapsule(q, vec3(0.0), tip, 0.007);
  float ant = sdEllipsoid(q - tip - vec3(0.0, 0.015, 0.0), vec3(0.018, 0.02, 0.055));
  float pistil = sdCapsule(p, vec3(0.0), vec3(0.03, 0.66, 0.0), 0.01);
  pistil = min(pistil, length(p - vec3(0.03, 0.67, 0.0)) - 0.028);
  fil = min(fil, pistil);
  if (fil < res.x) res = vec4(fil, 2.0, 0.0, 0.0);
  if (ant < res.x) res = vec4(ant, 3.0, 0.0, 0.0);
  return res;
}

vec3 calcNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float h = 0.0015;
  return normalize(k.xyy * map(p + k.xyy * h).x + k.yyx * map(p + k.yyx * h).x +
                   k.yxy * map(p + k.yxy * h).x + k.xxx * map(p + k.xxx * h).x);
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 4; i++) {
    float h = 0.02 + 0.09 * float(i);
    occ += (h - map(p + h * n).x) * sca;
    sca *= 0.75;
  }
  return clamp(1.0 - 2.2 * occ, 0.0, 1.0);
}

void main() {
  vec2 frag = vUv * uRes;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;

  // orbit camera
  float k = smoothstep(0.3, 1.2, uPitch);                 // frame the head as the camera rises
  float dist = mix(uDist.x, uDist.y, k);
  vec3 target = vec3(0.0, mix(0.3, 0.12, k), 0.0);
  vec3 ro = target + dist * vec3(cos(uPitch) * sin(uYaw), sin(uPitch), cos(uPitch) * cos(uYaw));
  vec3 ww = normalize(target - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.9 * ww);

  // background: deep, faintly lit
  vec3 col = uBgC + 0.03 * vec3(0.8, 0.9, 0.6) * (1.0 - length(uv));

  float t = 0.5;
  vec4 hit = vec4(-1.0);
  for (int i = 0; i < 110; i++) {
    if (i >= uSteps) break;
    vec4 h = map(ro + rd * t);
    if (h.x < 0.0012 * t) { hit = vec4(t, h.yzw); break; }
    t += h.x * 0.75;
    if (t > 7.5) break;
  }

  if (hit.x > 0.0) {
    vec3 p = ro + rd * hit.x;
    vec3 n = calcNormal(p);
    float ao = calcAO(p, n);
    vec3 l1 = normalize(vec3(0.6, 0.9, 0.5));
    vec3 l2 = normalize(vec3(-0.7, 0.3, -0.6));
    float dif = clamp(dot(n, l1), 0.0, 1.0);
    float back = clamp(dot(-n, l1), 0.0, 1.0);           // light through thin petals
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
    float spec = pow(clamp(dot(reflect(rd, n), l1), 0.0, 1.0), 24.0);

    vec3 alb;
    if (hit.y < 1.5) {
      // ivory tepal, green throat, freckles near the base
      alb = mix(uThroat, uTepal, smoothstep(0.05, 0.4, hit.z));
      float fr = step(0.86, hash21(floor(vec2(hit.z * 60.0, hit.w * 18.0))));
      alb = mix(alb, uFreckle, fr * smoothstep(0.55, 0.2, hit.z) * smoothstep(0.08, 0.2, hit.z) * 0.8);
      alb *= 0.9 + 0.1 * smoothstep(0.0, 0.25, abs(hit.w));          // midrib
    } else if (hit.y < 2.5) {
      alb = uFilament;
    } else if (hit.y < 3.5) {
      alb = uAnther;
    } else {
      alb = uStem;
    }
    vec3 lin = vec3(0.0);
    lin += 1.35 * dif * vec3(1.0, 0.95, 0.85);
    lin += 0.55 * back * vec3(0.95, 0.9, 0.6) * (hit.y < 1.5 ? 1.0 : 0.2);
    lin += 0.25 * clamp(dot(n, l2), 0.0, 1.0) * vec3(0.55, 0.7, 1.0);
    lin += 0.12 * vec3(0.7, 0.8, 0.6);
    col = alb * lin * (0.35 + 0.65 * ao);
    col += spec * 0.25 * vec3(1.0, 0.98, 0.9);
    col += rim * uRimC * 0.35;                                       // pearl rim
  }

  col = pow(col, vec3(0.4545));
  col += (hash21(frag + fract(uTime)) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}
`

const ASCII_FRAG = `
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform float uGlyphs;
uniform float uCell;
uniform float uAspect;
uniform vec2 uPointer;
uniform float uGlowR;
uniform vec2 uLensC;
uniform float uLensR;
uniform float uRing;
uniform float uRingAmp;
uniform float uTime;
uniform float uFlicker;
uniform float uGlowGain;
uniform float uChroma;
uniform float uTrace;
uniform float uScan;
uniform float uVig;
uniform float uRimGain;
uniform vec3 uInk;
uniform vec3 uAccent;
varying vec2 vUv;

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 cs = vec2(uCell * uAspect, uCell);
  vec2 cell = floor(frag / cs);
  vec2 center = (cell + 0.5) * cs;
  vec2 local = fract(frag / cs);

  vec3 sc = texture2D(uScene, center / uRes).rgb;
  float lum = dot(sc, vec3(0.299, 0.587, 0.114));
  lum = smoothstep(0.05, 0.95, lum);

  float dp = length(center - uPointer);
  float glow = uGlowR > 0.0 ? smoothstep(uGlowR * 2.2, uGlowR * 0.6, dp) * uGlowGain : 0.0;
  float rr = (dp - uRing) / (uCell * 4.0);
  float ring = exp(-rr * rr) * uRingAmp;

  float tick = floor(uTime * 14.0);
  float h = hash21(cell + tick * 0.37);
  float scramble = step(1.0 - clamp(ring * 0.95 + uFlicker * lum * 0.08, 0.0, 1.0), h);

  float idx = floor(clamp(lum + glow * 0.1, 0.0, 1.0) * (uGlyphs - 1.0) + 0.5);
  float rnd = 1.0 + floor(hash21(cell * 1.7 + tick) * (uGlyphs - 1.0));
  idx = mix(idx, rnd, scramble);

  vec2 auv = vec2((idx + local.x) / uGlyphs, local.y);
  float g = texture2D(uAtlas, auv).r;
  float heat = clamp(glow * 0.75 + ring * 1.2 + scramble * 0.6, 0.0, 1.0);
  vec3 tint = mix(uInk, uAccent, heat);
  tint = mix(tint, sc * 1.25, uTrace);                     // keep a trace of the real colour
  vec3 col = tint * g * (0.28 + lum * 0.95 + glow * 0.25);

  // decoder lens: the true render, with chromatic aberration near the rim
  vec2 lv = frag - uLensC;
  float ld = length(lv);
  if (uLensR > 0.5) {
    float inside = 1.0 - smoothstep(uLensR - 1.5, uLensR + 1.5, ld);
    vec2 dir = lv / max(ld, 1e-3);
    float edge = smoothstep(uLensR * 0.55, uLensR, ld);
    vec2 uv = frag / uRes;
    vec2 off = dir * edge * uChroma / uRes;
    vec3 real = vec3(texture2D(uScene, uv - off).r, texture2D(uScene, uv).g, texture2D(uScene, uv + off).b);
    col = mix(col, real, inside);
    float rim = smoothstep(1.6, 0.0, abs(ld - uLensR));
    col += uAccent * rim * uRimGain;
  }

  // CRT whisper: faint scanlines + vignette
  col *= 1.0 - uScan + uScan * (0.5 + 0.5 * sin(frag.y * 1.6));
  vec2 q = frag / uRes - 0.5;
  col *= 1.0 - dot(q, q) * uVig;
  gl_FragColor = vec4(col, 1.0);
}
`

/* ============================================================ engine */

interface EngineOpts {
    font: string
    glyphs: string
    quality: Quality
    flower: Flower
    palette: Palette
    fx: Fx
    aspect: number
    breakpoint: number
    interaction: Interaction
}

class TransmissionEngine {
    private gl: WebGLRenderingContext
    private sceneProg: WebGLProgram
    private asciiProg: WebGLProgram
    private sceneU: Record<string, WebGLUniformLocation | null> = {}
    private asciiU: Record<string, WebGLUniformLocation | null> = {}
    private buf: WebGLBuffer
    private fbo: WebGLFramebuffer
    private sceneTex: WebGLTexture
    private atlas: WebGLTexture
    private glyphCount = 1
    private rtW = 2
    private rtH = 2

    private raf = 0
    private running = false
    private startT = performance.now()
    private last = performance.now()
    private frameTimes: number[] = []
    private dpr = 1
    private w = 1
    private h = 1
    private scale: number
    private maxScale: number
    private staticMode = false
    private dirty = true
    private disposed = false
    private qualitySig = ""

    opts: EngineOpts

    state = {
        bloom: 0.3,
        yaw: 0.6,
        pitch: 0.28,
        cell: 16,
        lensR: 0,
        decode: 0,
    }

    private pointer = { x: -9999, y: -9999, sx: -9999, sy: -9999, r: 0 }
    private ring = { r: 0, amp: 0 }
    private pulse = 0
    private autoYaw = 0

    stats = { fps: 60, scale: 0.6, cell: 16 }

    constructor(
        private canvas: HTMLCanvasElement,
        opts: EngineOpts
    ) {
        this.opts = opts
        const attrs: WebGLContextAttributes = {
            antialias: false,
            alpha: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
        }
        const gl = (canvas.getContext("webgl", attrs) ||
            canvas.getContext(
                "experimental-webgl",
                attrs
            )) as WebGLRenderingContext | null
        if (!gl) throw new Error("WebGL unavailable")
        this.gl = gl

        this.scale = opts.quality.scale
        this.maxScale = opts.quality.maxScale
        this.state.yaw = opts.flower.yawStart
        this.state.bloom = opts.flower.bloomStart
        this.state.pitch = opts.flower.pitchStart

        this.sceneProg = this.program(VERT, SCENE_FRAG)
        this.asciiProg = this.program(VERT, ASCII_FRAG)
        this.cacheUniforms()

        const buf = gl.createBuffer()
        if (!buf) throw new Error("WebGL buffer failed")
        this.buf = buf
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )

        const tex = gl.createTexture()
        const fbo = gl.createFramebuffer()
        const atlas = gl.createTexture()
        if (!tex || !fbo || !atlas) throw new Error("WebGL resources failed")
        this.sceneTex = tex
        this.fbo = fbo
        this.atlas = atlas

        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        this.sizeSceneTarget()

        this.setGlyphs(opts.glyphs)
        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.BLEND)
    }

    private compile(type: number, src: string) {
        const gl = this.gl
        const sh = gl.createShader(type)
        if (!sh) throw new Error("shader alloc failed")
        gl.shaderSource(sh, src)
        gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(sh)
            gl.deleteShader(sh)
            throw new Error("shader compile failed: " + log)
        }
        return sh
    }

    private program(vs: string, fs: string) {
        const gl = this.gl
        const p = gl.createProgram()
        if (!p) throw new Error("program alloc failed")
        const v = this.compile(gl.VERTEX_SHADER, vs)
        const f = this.compile(gl.FRAGMENT_SHADER, fs)
        gl.attachShader(p, v)
        gl.attachShader(p, f)
        gl.bindAttribLocation(p, 0, "aPos")
        gl.linkProgram(p)
        gl.deleteShader(v)
        gl.deleteShader(f)
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            const log = gl.getProgramInfoLog(p)
            gl.deleteProgram(p)
            throw new Error("program link failed: " + log)
        }
        return p
    }

    private cacheUniforms() {
        const gl = this.gl
        const names = (prog: WebGLProgram, list: string[]) => {
            const out: Record<string, WebGLUniformLocation | null> = {}
            for (const n of list) out[n] = gl.getUniformLocation(prog, n)
            return out
        }
        this.sceneU = names(this.sceneProg, [
            "uRes",
            "uTime",
            "uBloom",
            "uYaw",
            "uPitch",
            "uPulse",
            "uSteps",
            "uCurl",
            "uGrain",
            "uTilt",
            "uDist",
            "uTepal",
            "uThroat",
            "uFreckle",
            "uFilament",
            "uAnther",
            "uStem",
            "uRimC",
            "uBgC",
        ])
        this.asciiU = names(this.asciiProg, [
            "uScene",
            "uAtlas",
            "uRes",
            "uGlyphs",
            "uCell",
            "uAspect",
            "uPointer",
            "uGlowR",
            "uLensC",
            "uLensR",
            "uRing",
            "uRingAmp",
            "uTime",
            "uFlicker",
            "uGlowGain",
            "uChroma",
            "uTrace",
            "uScan",
            "uVig",
            "uRimGain",
            "uInk",
            "uAccent",
        ])
    }

    /** Build the glyph atlas: one row of cells, white glyphs on black. */
    setGlyphs(set: string) {
        const gl = this.gl
        const chars = Array.from(set.length ? set : " .:-=+*oxX#%@")
        const cw = 40
        const ch = 64
        const c = document.createElement("canvas")
        c.width = cw * chars.length
        c.height = ch
        const g = c.getContext("2d")
        if (!g) return
        g.fillStyle = "#000"
        g.fillRect(0, 0, c.width, c.height)
        g.fillStyle = "#fff"
        g.textAlign = "center"
        g.textBaseline = "middle"
        g.font = `500 50px ${this.opts.font}`
        chars.forEach((chr, i) => g.fillText(chr, i * cw + cw / 2, ch / 2 + 2))

        gl.bindTexture(gl.TEXTURE_2D, this.atlas)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        this.glyphCount = chars.length
        this.dirty = true
    }

    setOpts(o: Partial<EngineOpts>) {
        const q = o.quality
        // only re-allocate the march target when the numbers that size it actually moved,
        // otherwise a re-render would rebuild the texture every frame
        const sig = q
            ? `${q.scale}|${q.minScale}|${q.maxScale}|${q.maxScaleMobile}|${q.dprCap}`
            : ""
        Object.assign(this.opts, o)
        if (q && sig !== this.qualitySig) {
            this.qualitySig = sig
            this.maxScale =
                this.w < this.opts.breakpoint ? q.maxScaleMobile : q.maxScale
            this.scale = Math.min(Math.max(q.scale, q.minScale), this.maxScale)
            this.sizeSceneTarget()
        }
        this.dirty = true
    }

    resize(w: number, h: number) {
        this.w = Math.max(1, w)
        this.h = Math.max(1, h)
        this.dpr = Math.min(
            window.devicePixelRatio || 1,
            Math.max(1, this.opts.quality.dprCap)
        )
        this.maxScale =
            w < this.opts.breakpoint
                ? this.opts.quality.maxScaleMobile
                : this.opts.quality.maxScale
        this.scale = Math.min(this.scale, this.maxScale)
        this.canvas.width = Math.round(this.w * this.dpr)
        this.canvas.height = Math.round(this.h * this.dpr)
        this.canvas.style.width = this.w + "px"
        this.canvas.style.height = this.h + "px"
        this.sizeSceneTarget()
        this.dirty = true
    }

    private sizeSceneTarget() {
        const gl = this.gl
        this.rtW = Math.max(2, Math.round(this.w * this.scale))
        this.rtH = Math.max(2, Math.round(this.h * this.scale))
        gl.bindTexture(gl.TEXTURE_2D, this.sceneTex)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.rtW,
            this.rtH,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.sceneTex,
            0
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    setStatic(v: boolean) {
        this.staticMode = v
        this.dirty = true
    }

    setState(s: Partial<TransmissionEngine["state"]>) {
        Object.assign(this.state, s)
        this.dirty = true
    }

    setPointer(x: number, y: number, active: boolean) {
        this.pointer.x = x
        this.pointer.y = y
        if (this.pointer.sx < -999) {
            this.pointer.sx = x
            this.pointer.sy = y
        }
        const i = this.opts.interaction
        const r =
            this.w < this.opts.breakpoint ? i.lensRadiusMobile : i.lensRadius
        this.state.lensR = active && i.lens ? r : 0
        this.dirty = true
    }

    /** Drag-to-turn: yaw offset in radians. */
    nudgeYaw(dx: number) {
        this.state.yaw += dx
        this.dirty = true
    }

    pulseAt(x: number, y: number) {
        if (!this.opts.interaction.pulse) return
        this.pointer.x = x
        this.pointer.y = y
        this.ring.r = 0
        this.ring.amp = 1
        this.pulse = 1
        this.dirty = true
    }

    private frame(now: number) {
        const gl = this.gl
        const q = this.opts.quality
        const dt = Math.min(0.05, (now - this.last) / 1000)
        this.last = now
        const t = (now - this.startT) / 1000

        // adaptive resolution: watch the last 40 frames
        this.frameTimes.push(dt)
        if (this.frameTimes.length > 40) {
            const avg =
                this.frameTimes.reduce((a, b) => a + b, 0) /
                this.frameTimes.length
            this.frameTimes.length = 0
            this.stats.fps = Math.round(1 / Math.max(avg, 1e-3))
            if (!this.staticMode && q.adaptive) {
                if (avg > 0.021 && this.scale > q.minScale) {
                    this.scale = Math.max(q.minScale, this.scale - 0.08)
                    this.sizeSceneTarget()
                } else if (avg < 0.0135 && this.scale < this.maxScale) {
                    this.scale = Math.min(this.maxScale, this.scale + 0.04)
                    this.sizeSceneTarget()
                }
            }
            this.stats.scale = this.scale
        }

        const ease = this.staticMode ? 1 : 1 - Math.pow(0.001, dt)
        const p = this.pointer
        p.sx += (p.x - p.sx) * ease
        p.sy += (p.y - p.sy) * ease
        p.r +=
            (this.state.lensR - p.r) *
            (this.staticMode ? 1 : 1 - Math.pow(0.02, dt))
        if (!this.staticMode) this.autoYaw += dt * this.opts.flower.idleSpin
        this.ring.r +=
            dt * Math.max(this.w, this.h) * this.opts.interaction.pulseSpeed
        this.ring.amp *= Math.pow(0.3, dt)
        this.pulse *= Math.pow(0.12, dt)

        const d = this.dpr
        const fl = this.opts.flower
        const pal = this.opts.palette
        const fx = this.opts.fx

        // ---- pass one: the lily, into the low-res target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

        gl.useProgram(this.sceneProg)
        const su = this.sceneU
        gl.uniform2f(su.uRes, this.rtW, this.rtH)
        gl.uniform1f(su.uTime, this.staticMode ? 0 : t)
        gl.uniform1f(su.uBloom, this.state.bloom)
        gl.uniform1f(su.uYaw, this.state.yaw + this.autoYaw)
        gl.uniform1f(su.uPitch, this.state.pitch)
        gl.uniform1f(su.uPulse, this.pulse)
        gl.uniform1i(su.uSteps, this.scale < 0.45 ? q.stepsLow : q.steps)
        gl.uniform1f(su.uCurl, fl.curl)
        gl.uniform1f(su.uGrain, fx.grain)
        gl.uniform2f(su.uTilt, fl.tiltClosed, fl.tiltOpen)
        gl.uniform2f(su.uDist, fl.distNear, fl.distFar)
        const c3 = (
            loc: WebGLUniformLocation | null,
            css: string,
            fb: [number, number, number]
        ) => {
            const v = toVec3(css, fb)
            gl.uniform3f(loc, v[0], v[1], v[2])
        }
        c3(su.uTepal, pal.tepal, [0.93, 0.91, 0.84])
        c3(su.uThroat, pal.throat, [0.62, 0.72, 0.32])
        c3(su.uFreckle, pal.freckle, [0.45, 0.12, 0.1])
        c3(su.uFilament, pal.filament, [0.78, 0.8, 0.62])
        c3(su.uAnther, pal.anther, [0.62, 0.24, 0.08])
        c3(su.uStem, pal.stem, [0.22, 0.34, 0.12])
        c3(su.uRimC, pal.rim, [0.84, 0.94, 0.42])
        c3(su.uBgC, pal.background, [0.012, 0.014, 0.011])

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.viewport(0, 0, this.rtW, this.rtH)
        gl.drawArrays(gl.TRIANGLES, 0, 3)

        // ---- pass two: the glyph grid, at full resolution
        const decode = this.state.decode
        const diag = Math.hypot(this.w, this.h)
        const cx = p.sx < -999 ? this.w / 2 : p.sx
        const cy = p.sy < -999 ? this.h / 2 : p.sy
        const lensX = cx + (this.w / 2 - cx) * decode
        const lensY = cy + (this.h / 2 - cy) * decode
        const lensR = p.r + (diag * 0.6 - p.r) * decode

        gl.useProgram(this.asciiProg)
        const au = this.asciiU
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.sceneTex)
        gl.uniform1i(au.uScene, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.atlas)
        gl.uniform1i(au.uAtlas, 1)
        gl.uniform2f(au.uRes, this.w * d, this.h * d)
        gl.uniform1f(au.uGlyphs, this.glyphCount)
        gl.uniform1f(au.uCell, this.state.cell * d)
        gl.uniform1f(au.uAspect, this.opts.aspect)
        gl.uniform2f(au.uPointer, p.sx * d, (this.h - p.sy) * d)
        gl.uniform1f(au.uGlowR, p.r * d)
        gl.uniform2f(au.uLensC, lensX * d, (this.h - lensY) * d)
        gl.uniform1f(au.uLensR, lensR * d)
        gl.uniform1f(au.uRing, this.ring.r * d)
        gl.uniform1f(au.uRingAmp, this.ring.amp)
        gl.uniform1f(au.uTime, this.staticMode ? 0 : t)
        gl.uniform1f(au.uFlicker, this.staticMode ? 0 : fx.flicker)
        gl.uniform1f(au.uGlowGain, fx.glow)
        gl.uniform1f(au.uChroma, fx.chroma)
        gl.uniform1f(au.uTrace, fx.trace)
        gl.uniform1f(au.uScan, fx.scanlines)
        gl.uniform1f(au.uVig, fx.vignette)
        gl.uniform1f(au.uRimGain, fx.lensRim)
        c3(au.uInk, pal.ink, [0.91, 0.9, 0.84])
        c3(au.uAccent, pal.accent, [0.84, 0.94, 0.42])

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        gl.drawArrays(gl.TRIANGLES, 0, 3)

        this.stats.cell = this.state.cell
        this.dirty = false
    }

    private loop = (now: number) => {
        if (!this.running || this.disposed) return
        const settling =
            Math.abs(this.pointer.r - this.state.lensR) > 0.5 ||
            this.ring.amp > 0.01
        if (!this.staticMode || this.dirty || settling) this.frame(now)
        else this.last = now
        this.raf = requestAnimationFrame(this.loop)
    }

    play() {
        if (this.running || this.disposed) return
        this.running = true
        this.last = performance.now()
        this.raf = requestAnimationFrame(this.loop)
    }

    pause() {
        this.running = false
        cancelAnimationFrame(this.raf)
    }

    /** Draw exactly one frame (canvas / thumbnail / reduced motion). */
    renderOnce() {
        if (this.disposed) return
        this.frame(performance.now())
    }

    dispose() {
        this.disposed = true
        this.pause()
        const gl = this.gl
        gl.deleteProgram(this.sceneProg)
        gl.deleteProgram(this.asciiProg)
        gl.deleteBuffer(this.buf)
        gl.deleteFramebuffer(this.fbo)
        gl.deleteTexture(this.sceneTex)
        gl.deleteTexture(this.atlas)
        const lose = gl.getExtension("WEBGL_lose_context")
        if (lose) lose.loseContext()
    }
}

/* ============================================================ component */

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function Transmission(props: Partial<Props>) {
    const {
        style,
        layout = "fill",
        trackVh = 420,
        source = "scroll",
        progress: manualProgress = 0,
        autoDuration = 12,
        autoMode = "loop",
        respectReducedMotion = true,
        background = "rgb(10, 11, 9)",
        fade = true,
    } = props

    const timing = { ...D.timing, ...(props.timing || {}) }
    const grid = { ...D.grid, ...(props.grid || {}) }
    const flower = { ...D.flower, ...(props.flower || {}) }
    const palette = { ...D.palette, ...(props.palette || {}) }
    const fx = { ...D.fx, ...(props.fx || {}) }
    const quality = { ...D.quality, ...(props.quality || {}) }
    const glyphOpts = { ...D.glyphs, ...(props.glyphs || {}) }
    const interaction = { ...D.interaction, ...(props.interaction || {}) }

    const trackRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<TransmissionEngine | null>(null)
    const pRef = useRef(0)

    const [status, setStatus] = useState<"loading" | "ready" | "failed">(
        "loading"
    )
    const [systemReduced, setSystemReduced] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )

    const target = RenderTarget.current()
    const onCanvas =
        target === RenderTarget.canvas || target === RenderTarget.thumbnail
    const reduced = respectReducedMotion && systemReduced
    const staticMode = reduced || target === RenderTarget.thumbnail

    const monoFamily = familyOf(props.monoFont, MONO_FALLBACK)
    const glyphString = glyphOpts.useCustom
        ? glyphOpts.custom
        : GLYPH_SETS[glyphOpts.set] || GLYPH_SETS.ascii

    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const onChange = () => setSystemReduced(mq.matches)
        if (mq.addEventListener) mq.addEventListener("change", onChange)
        else mq.addListener(onChange)
        return () => {
            if (mq.removeEventListener)
                mq.removeEventListener("change", onChange)
            else mq.removeListener(onChange)
        }
    }, [])

    /* ---------------------------------------------------------- engine */
    const optsRef = useRef<EngineOpts>({
        font: monoFamily,
        glyphs: glyphString,
        quality,
        flower,
        palette,
        fx,
        aspect: grid.aspect,
        breakpoint: grid.breakpoint,
        interaction,
    })
    optsRef.current = {
        font: monoFamily,
        glyphs: glyphString,
        quality,
        flower,
        palette,
        fx,
        aspect: grid.aspect,
        breakpoint: grid.breakpoint,
        interaction,
    }

    useEffect(() => {
        const canvas = canvasRef.current
        const stage = stageRef.current
        if (!canvas || !stage) return
        let disposed = false
        let engine: TransmissionEngine | null = null
        let ro: ResizeObserver | null = null
        let io: IntersectionObserver | null = null
        let inView = true

        const onVis = () => {
            if (!engine) return
            if (document.hidden || !inView) engine.pause()
            else engine.play()
        }
        const onLost = (e: Event) => {
            e.preventDefault()
            setStatus("failed")
        }

        const boot = () => {
            if (disposed) return
            try {
                engine = new TransmissionEngine(canvas, optsRef.current)
            } catch (err) {
                console.warn("[transmission] WebGL unavailable", err)
                setStatus("failed")
                return
            }
            engineRef.current = engine
            engine.resize(stage.clientWidth, stage.clientHeight)
            ro = new ResizeObserver(
                () =>
                    engine &&
                    engine.resize(stage.clientWidth, stage.clientHeight)
            )
            ro.observe(stage)
            io = new IntersectionObserver((entries) => {
                inView = entries[0].isIntersecting
                onVis()
            })
            io.observe(stage)
            document.addEventListener("visibilitychange", onVis)
            canvas.addEventListener("webglcontextlost", onLost)
            engine.play()
            setStatus("ready")
        }

        const fontReady =
            typeof document !== "undefined" && (document as any).fonts
                ? (document as any).fonts.load(`500 50px ${monoFamily}`)
                : Promise.resolve()
        Promise.race([fontReady, new Promise((r) => setTimeout(r, 2000))]).then(
            boot,
            boot
        )

        return () => {
            disposed = true
            if (ro) ro.disconnect()
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            canvas.removeEventListener("webglcontextlost", onLost)
            if (engine) engine.dispose()
            engineRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monoFamily])

    // push live option changes into the engine — keyed on the values, not on every render
    const optsSig = JSON.stringify([
        quality,
        flower,
        palette,
        fx,
        grid.aspect,
        grid.breakpoint,
        interaction,
    ])
    useEffect(() => {
        const e = engineRef.current
        if (!e) return
        e.setOpts(optsRef.current)
        e.setStatic(staticMode)
        if (staticMode) e.renderOnce()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [optsSig, staticMode, status])

    useEffect(() => {
        const e = engineRef.current
        if (e) e.setGlyphs(glyphString)
    }, [glyphString, status])

    /* ------------------------------------------------------- progress */
    const apply = (v: number) => {
        pRef.current = v
        const e = engineRef.current
        if (!e) return
        const el = stageRef.current
        const mobile =
            (el ? el.clientWidth : window.innerWidth) < grid.breakpoint
        const res = smooth(timing.gridFrom, timing.gridTo, v)
        const cs = mobile ? grid.cellStartMobile : grid.cellStart
        const ce = mobile ? grid.cellEndMobile : grid.cellEnd
        e.setState({
            cell: cs - res * (cs - ce),
            bloom:
                flower.bloomStart +
                (flower.bloomEnd - flower.bloomStart) *
                    smooth(timing.bloomFrom, timing.bloomTo, v),
            pitch:
                flower.pitchStart +
                (flower.pitchEnd - flower.pitchStart) *
                    smooth(timing.pitchFrom, timing.pitchTo, v),
            decode: smooth(timing.decodeFrom, timing.decodeTo, v),
        })
        if (staticMode) e.renderOnce()
    }

    // the engine is built after the font race, so push the current progress once it exists
    useEffect(() => {
        if (status === "ready") apply(pRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status])

    // manual / canvas
    useEffect(() => {
        if (source === "manual" || onCanvas) apply(clamp01(manualProgress))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manualProgress, source, onCanvas, status])

    // scroll
    useEffect(() => {
        if (onCanvas || source !== "scroll") return
        const el = layout === "track" ? trackRef.current : stageRef.current
        if (!el) return
        let raf = 0
        let alive = true
        const read = () => {
            if (!alive) return
            const rect = el.getBoundingClientRect()
            const vh = window.innerHeight || 1
            const denom = rect.height - vh
            let v: number
            if (denom > 8) v = clamp01(-rect.top / denom)
            else v = clamp01((vh - rect.top) / (vh + rect.height))
            const snapped = reduced ? (v > 0.8 ? 1 : v > 0.35 ? 0.6 : 0) : v
            if (Math.abs(snapped - pRef.current) > 0.0005) apply(snapped)
            raf = requestAnimationFrame(read)
        }
        raf = requestAnimationFrame(read)
        return () => {
            alive = false
            cancelAnimationFrame(raf)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, layout, onCanvas, reduced, status])

    // auto
    useEffect(() => {
        if (onCanvas || source !== "auto") return
        let raf = 0
        const t0 = performance.now()
        const dur = Math.max(0.2, autoDuration) * 1000
        const step = () => {
            const e = (performance.now() - t0) / dur
            let v: number
            if (autoMode === "once") v = clamp01(e)
            else if (autoMode === "loop") v = e % 1
            else {
                const m = e % 2
                v = m > 1 ? 2 - m : m
            }
            apply(v)
            raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, autoDuration, autoMode, onCanvas, status])

    /* --------------------------------------- pointer: lens, drag, pulse */
    useEffect(() => {
        const stage = stageRef.current
        if (!stage || status !== "ready" || onCanvas) return
        const local = (e: PointerEvent) => {
            const r = stage.getBoundingClientRect()
            return { x: e.clientX - r.left, y: e.clientY - r.top }
        }
        let down: { x: number; y: number; moved: number } | null = null

        const move = (e: PointerEvent) => {
            const pt = local(e)
            const eng = engineRef.current
            if (!eng) return
            if (down) {
                const dx = pt.x - down.x
                down.moved += Math.abs(dx) + Math.abs(pt.y - down.y)
                down.x = pt.x
                down.y = pt.y
                if (interaction.drag)
                    eng.nudgeYaw(dx * interaction.dragSensitivity)
            }
            eng.setPointer(
                pt.x,
                pt.y,
                e.pointerType === "mouse" ? true : !!down
            )
        }
        const press = (e: PointerEvent) => {
            const pt = local(e)
            down = { x: pt.x, y: pt.y, moved: 0 }
            const eng = engineRef.current
            if (eng) eng.setPointer(pt.x, pt.y, true)
        }
        const release = (e: PointerEvent) => {
            if (!down) return
            const pt = local(e)
            const eng = engineRef.current
            if (eng && down.moved < 8) eng.pulseAt(pt.x, pt.y) // a click, not a drag
            down = null
            if (eng && e.pointerType !== "mouse")
                eng.setPointer(pt.x, pt.y, false)
        }
        const leave = (e: PointerEvent) => {
            down = null
            const pt = local(e)
            const eng = engineRef.current
            if (eng) eng.setPointer(pt.x, pt.y, false)
        }

        stage.addEventListener("pointermove", move)
        stage.addEventListener("pointerdown", press)
        window.addEventListener("pointerup", release)
        stage.addEventListener("pointercancel", leave)
        stage.addEventListener("pointerleave", leave)
        return () => {
            stage.removeEventListener("pointermove", move)
            stage.removeEventListener("pointerdown", press)
            window.removeEventListener("pointerup", release)
            stage.removeEventListener("pointercancel", leave)
            stage.removeEventListener("pointerleave", leave)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, onCanvas, interaction.drag, interaction.dragSensitivity])

    /* -------------------------------------------------------- styles */
    const rootStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        ...style,
        position: "relative",
        background,
        // "track" owns its own height so the sticky stage has something to travel through
        ...(layout === "track" ? { height: `${trackVh}vh` } : null),
    }

    const stageStyle: CSSProperties = {
        position: layout === "track" ? "sticky" : "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: layout === "track" ? "100vh" : "100%",
        overflow: "hidden",
        background,
        touchAction: "pan-y",
        cursor:
            interaction.lens || interaction.drag || interaction.pulse
                ? "crosshair"
                : "default",
        userSelect: "none",
        WebkitUserSelect: "none",
    }

    const canvasStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "block",
        opacity: status === "ready" ? 1 : 0,
        transition: fade && !reduced ? "opacity 1.4s ease" : "none",
    }

    return (
        <div ref={trackRef} style={rootStyle}>
            <div ref={stageRef} style={stageStyle} aria-hidden="true">
                <canvas ref={canvasRef} style={canvasStyle} />
            </div>
        </div>
    )
}

Transmission.displayName = "Transmission"

/* ============================================================ controls */

addPropertyControls(Transmission, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["fill", "track"],
        optionTitles: ["Fill frame", "Scroll track"],
        defaultValue: "fill",
        displaySegmentedControl: true,
    },
    trackVh: {
        type: ControlType.Number,
        title: "Track",
        min: 100,
        max: 1000,
        step: 10,
        unit: "vh",
        defaultValue: 420,
        hidden: (p: any) => p.layout !== "track",
    },
    source: {
        type: ControlType.Enum,
        title: "Driven by",
        options: ["scroll", "manual", "auto"],
        optionTitles: ["Scroll", "Manual", "Auto"],
        defaultValue: "scroll",
        displaySegmentedControl: true,
    },
    progress: {
        type: ControlType.Number,
        title: "Progress",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0,
        description: "Also previews the story on the canvas.",
    },
    autoDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 1,
        max: 60,
        step: 0.5,
        unit: "s",
        defaultValue: 12,
        hidden: (p: any) => p.source !== "auto",
    },
    autoMode: {
        type: ControlType.Enum,
        title: "Auto",
        options: ["once", "loop", "pingpong"],
        optionTitles: ["Once", "Loop", "Ping-pong"],
        defaultValue: "loop",
        hidden: (p: any) => p.source !== "auto",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgb(10, 11, 9)",
    },
    fade: { type: ControlType.Boolean, title: "Fade in", defaultValue: true },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced motion",
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
        defaultValue: true,
    },

    monoFont: {
        type: ControlType.Font,
        title: "Glyph font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: { fontFamily: "IBM Plex Mono" },
        displayFontSize: false,
        description: "Builds the glyph atlas. Monospace only.",
    },

    glyphs: {
        type: ControlType.Object,
        title: "Glyphs",
        icon: "object",
        controls: {
            set: {
                type: ControlType.Enum,
                title: "Set",
                options: ["ascii", "binary", "blocks"],
                optionTitles: ["ASCII", "Binary", "Blocks"],
                defaultValue: "ascii",
                displaySegmentedControl: true,
            },
            useCustom: {
                type: ControlType.Boolean,
                title: "Custom",
                defaultValue: false,
            },
            custom: {
                type: ControlType.String,
                title: "Ramp",
                defaultValue: D.glyphs.custom,
                description: "Darkest first. The leading space matters.",
                hidden: (p: any) => !p.useCustom,
            },
        },
    },

    timing: {
        type: ControlType.Object,
        title: "Timing",
        icon: "effect",
        controls: {
            gridFrom: {
                type: ControlType.Number,
                title: "Grid in",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.timing.gridFrom,
            },
            gridTo: {
                type: ControlType.Number,
                title: "Grid out",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.timing.gridTo,
            },
            bloomFrom: {
                type: ControlType.Number,
                title: "Bloom in",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.timing.bloomFrom,
            },
            bloomTo: {
                type: ControlType.Number,
                title: "Bloom out",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.timing.bloomTo,
            },
            pitchFrom: {
                type: ControlType.Number,
                title: "Lift in",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.timing.pitchFrom,
            },
            pitchTo: {
                type: ControlType.Number,
                title: "Lift out",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.timing.pitchTo,
            },
            decodeFrom: {
                type: ControlType.Number,
                title: "Decode in",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.timing.decodeFrom,
            },
            decodeTo: {
                type: ControlType.Number,
                title: "Decode out",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.timing.decodeTo,
            },
        },
    },

    grid: {
        type: ControlType.Object,
        title: "Grid",
        icon: "object",
        controls: {
            cellStart: {
                type: ControlType.Number,
                title: "Cell from",
                min: 4,
                max: 60,
                step: 0.5,
                unit: "px",
                defaultValue: D.grid.cellStart,
            },
            cellEnd: {
                type: ControlType.Number,
                title: "Cell to",
                min: 4,
                max: 60,
                step: 0.5,
                unit: "px",
                defaultValue: D.grid.cellEnd,
            },
            cellStartMobile: {
                type: ControlType.Number,
                title: "Cell from ▾",
                min: 4,
                max: 60,
                step: 0.5,
                unit: "px",
                defaultValue: D.grid.cellStartMobile,
            },
            cellEndMobile: {
                type: ControlType.Number,
                title: "Cell to ▾",
                min: 4,
                max: 60,
                step: 0.5,
                unit: "px",
                defaultValue: D.grid.cellEndMobile,
            },
            aspect: {
                type: ControlType.Number,
                title: "Cell ratio",
                min: 0.3,
                max: 1.2,
                step: 0.01,
                defaultValue: D.grid.aspect,
            },
            breakpoint: {
                type: ControlType.Number,
                title: "Breakpoint",
                min: 320,
                max: 1200,
                step: 10,
                unit: "px",
                defaultValue: D.grid.breakpoint,
            },
        },
    },

    flower: {
        type: ControlType.Object,
        title: "Flower",
        icon: "effect",
        controls: {
            bloomStart: {
                type: ControlType.Number,
                title: "Bloom from",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.flower.bloomStart,
            },
            bloomEnd: {
                type: ControlType.Number,
                title: "Bloom to",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.flower.bloomEnd,
            },
            tiltClosed: {
                type: ControlType.Number,
                title: "Tilt closed",
                min: 0,
                max: 2,
                step: 0.01,
                defaultValue: D.flower.tiltClosed,
            },
            tiltOpen: {
                type: ControlType.Number,
                title: "Tilt open",
                min: -0.5,
                max: 2,
                step: 0.01,
                defaultValue: D.flower.tiltOpen,
            },
            curl: {
                type: ControlType.Number,
                title: "Tepal curl",
                min: 0,
                max: 2,
                step: 0.01,
                defaultValue: D.flower.curl,
            },
            pitchStart: {
                type: ControlType.Number,
                title: "Pitch from",
                min: -0.5,
                max: 1.5,
                step: 0.01,
                defaultValue: D.flower.pitchStart,
            },
            pitchEnd: {
                type: ControlType.Number,
                title: "Pitch to",
                min: -0.5,
                max: 1.5,
                step: 0.01,
                defaultValue: D.flower.pitchEnd,
            },
            distNear: {
                type: ControlType.Number,
                title: "Dolly near",
                min: 2,
                max: 10,
                step: 0.1,
                defaultValue: D.flower.distNear,
            },
            distFar: {
                type: ControlType.Number,
                title: "Dolly far",
                min: 2,
                max: 10,
                step: 0.1,
                defaultValue: D.flower.distFar,
            },
            yawStart: {
                type: ControlType.Number,
                title: "Yaw",
                min: -6.3,
                max: 6.3,
                step: 0.01,
                defaultValue: D.flower.yawStart,
            },
            idleSpin: {
                type: ControlType.Number,
                title: "Idle spin",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.flower.idleSpin,
                description: "Radians per second.",
            },
        },
    },

    palette: {
        type: ControlType.Object,
        title: "Lily colours",
        icon: "color",
        controls: {
            tepal: {
                type: ControlType.Color,
                title: "Tepal",
                defaultValue: D.palette.tepal,
            },
            throat: {
                type: ControlType.Color,
                title: "Throat",
                defaultValue: D.palette.throat,
            },
            freckle: {
                type: ControlType.Color,
                title: "Freckles",
                defaultValue: D.palette.freckle,
            },
            filament: {
                type: ControlType.Color,
                title: "Filament",
                defaultValue: D.palette.filament,
            },
            anther: {
                type: ControlType.Color,
                title: "Anther",
                defaultValue: D.palette.anther,
            },
            stem: {
                type: ControlType.Color,
                title: "Stem",
                defaultValue: D.palette.stem,
            },
            rim: {
                type: ControlType.Color,
                title: "Rim light",
                defaultValue: D.palette.rim,
            },
            background: {
                type: ControlType.Color,
                title: "Void",
                defaultValue: D.palette.background,
            },
            ink: {
                type: ControlType.Color,
                title: "Glyph ink",
                defaultValue: D.palette.ink,
            },
            accent: {
                type: ControlType.Color,
                title: "Glyph heat",
                defaultValue: D.palette.accent,
            },
        },
    },

    fx: {
        type: ControlType.Object,
        title: "Effects",
        icon: "effect",
        controls: {
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: 0,
                max: 0.1,
                step: 0.001,
                defaultValue: D.fx.grain,
            },
            scanlines: {
                type: ControlType.Number,
                title: "Scanlines",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.fx.scanlines,
            },
            vignette: {
                type: ControlType.Number,
                title: "Vignette",
                min: 0,
                max: 2,
                step: 0.01,
                defaultValue: D.fx.vignette,
            },
            chroma: {
                type: ControlType.Number,
                title: "Chromatic",
                min: 0,
                max: 40,
                step: 0.5,
                unit: "px",
                defaultValue: D.fx.chroma,
            },
            lensRim: {
                type: ControlType.Number,
                title: "Lens rim",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: D.fx.lensRim,
            },
            trace: {
                type: ControlType.Number,
                title: "Colour trace",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.fx.trace,
            },
            flicker: {
                type: ControlType.Number,
                title: "Flicker",
                min: 0,
                max: 4,
                step: 0.05,
                defaultValue: D.fx.flicker,
            },
            glow: {
                type: ControlType.Number,
                title: "Pointer glow",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: D.fx.glow,
            },
        },
    },

    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        icon: "interact",
        controls: {
            lens: {
                type: ControlType.Boolean,
                title: "Lens",
                defaultValue: true,
            },
            lensRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 600,
                step: 1,
                unit: "px",
                defaultValue: D.interaction.lensRadius,
                hidden: (p: any) => !p.lens,
            },
            lensRadiusMobile: {
                type: ControlType.Number,
                title: "Radius ▾",
                min: 0,
                max: 600,
                step: 1,
                unit: "px",
                defaultValue: D.interaction.lensRadiusMobile,
                hidden: (p: any) => !p.lens,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag to turn",
                defaultValue: true,
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Sensitivity",
                min: 0,
                max: 0.05,
                step: 0.001,
                defaultValue: D.interaction.dragSensitivity,
                hidden: (p: any) => !p.drag,
            },
            pulse: {
                type: ControlType.Boolean,
                title: "Click pulse",
                defaultValue: true,
            },
            pulseSpeed: {
                type: ControlType.Number,
                title: "Pulse speed",
                min: 0.05,
                max: 3,
                step: 0.05,
                defaultValue: D.interaction.pulseSpeed,
                hidden: (p: any) => !p.pulse,
            },
        },
    },

    quality: {
        type: ControlType.Object,
        title: "Quality",
        icon: "effect",
        controls: {
            adaptive: {
                type: ControlType.Boolean,
                title: "Adaptive",
                defaultValue: true,
                description: "Drops march resolution when frames get slow.",
            },
            scale: {
                type: ControlType.Number,
                title: "March scale",
                min: 0.15,
                max: 1,
                step: 0.01,
                defaultValue: D.quality.scale,
            },
            minScale: {
                type: ControlType.Number,
                title: "Floor",
                min: 0.1,
                max: 1,
                step: 0.01,
                defaultValue: D.quality.minScale,
                hidden: (p: any) => !p.adaptive,
            },
            maxScale: {
                type: ControlType.Number,
                title: "Ceiling",
                min: 0.2,
                max: 1,
                step: 0.01,
                defaultValue: D.quality.maxScale,
            },
            maxScaleMobile: {
                type: ControlType.Number,
                title: "Ceiling ▾",
                min: 0.2,
                max: 1,
                step: 0.01,
                defaultValue: D.quality.maxScaleMobile,
            },
            steps: {
                type: ControlType.Number,
                title: "March steps",
                min: 16,
                max: 110,
                step: 1,
                defaultValue: D.quality.steps,
            },
            stepsLow: {
                type: ControlType.Number,
                title: "Steps (low)",
                min: 16,
                max: 110,
                step: 1,
                defaultValue: D.quality.stepsLow,
            },
            dprCap: {
                type: ControlType.Number,
                title: "DPR cap",
                min: 1,
                max: 3,
                step: 0.5,
                defaultValue: D.quality.dprCap,
            },
        },
    },
})
