/**
 * Ribbon Hero — WebGL project ribbon for Framer
 *
 * A real Three.js / GLSL experience: eight video cards on a twisting S‑shaped
 * ribbon, virtual (non‑native) scrolling, a reflective perspective grid floor
 * and canvas‑drawn captions.
 *
 * DEPENDENCY: Three.js 0.160.0. Framer resolves `import … from "three"`
 * automatically. To pin the exact version, replace the import below with
 *   import * as THREE from "https://esm.sh/three@0.160.0"
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 * @framerDisableUnlink
 */
import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "three"

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

type ReducedMotionMode = "system" | "on" | "off"
type PreloadMode = "eager" | "lazy" | "metadata"
type PerformanceMode = "quality" | "balanced" | "performance"
type DebugMode = "off" | "normals" | "uv" | "depth" | "mask"
type CtaShape = "circle" | "rounded" | "square"
type CtaIcon = "auto" | "plus" | "arrow"

interface FramerImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface ProjectCard {
    title: string
    poster: string
    posterImage?: FramerImage
    video: string
    videoFile?: string
    aspect: number
    enabled: boolean
}

interface GeneralSettings {
    enabled: boolean
    fullViewport: boolean
    background: string
    breakpoint: number
    loader: boolean
    floor: boolean
    reflections: boolean
    reducedMotion: ReducedMotionMode
}

interface RibbonSettings {
    desktopCardHeight: number
    maxCardHeight: number
    mobileMargin: number
    desktopGap: number
    mobileGap: number
    desktopRadius: number
    mobileRadius: number
    initialX: number
    initialYPercent: number
    depth: number
    curveIntensity: number
    curveShape: number
    lean: number
    scrollSensitivity: number
    scrollSmoothing: number
    velocityIntensity: number
    maxDepthBoost: number
}

interface AnimationSettings {
    videoPreviews: boolean
    videoSpeed: number
    infinite: boolean
    touch: boolean
    keyboard: boolean
    hover: boolean
    hoverIntensity: number
    cardFade: number
    floorFade: number
}

interface TypographySettings {
    fontFamily: string
    loadGoogleFont: boolean
    desktopSize: number
    mobileSize: number
    weight: number
    letterSpacing: number
    color: string
    insetXDesktop: number
    insetXMobile: number
    insetBottom: number
}

interface CtaSettings {
    show: boolean
    background: string
    iconColor: string
    size: number
    shape: CtaShape
    icon: CtaIcon
}

interface FloorSettings {
    gridVisible: boolean
    gridColor: string
    gridOpacity: number
    gridSpacing: number
    depth: number
    reflectionIntensity: number
    reflectionFade: number
    shadowIntensity: number
}

interface AdvancedSettings {
    pixelRatio: number
    antialias: boolean
    debug: DebugMode
    performance: PerformanceMode
    preload: PreloadMode
    animateOnCanvas: boolean
}

interface Config {
    general: GeneralSettings
    cards: ProjectCard[]
    ribbon: RibbonSettings
    animation: AnimationSettings
    typography: TypographySettings
    cta: CtaSettings
    floor: FloorSettings
    advanced: AdvancedSettings
}

interface RibbonHeroProps {
    general?: Partial<GeneralSettings>
    cards?: Partial<ProjectCard>[]
    ribbon?: Partial<RibbonSettings>
    animation?: Partial<AnimationSettings>
    typography?: Partial<TypographySettings>
    cta?: Partial<CtaSettings>
    floor?: Partial<FloorSettings>
    advanced?: Partial<AdvancedSettings>
    style?: React.CSSProperties
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Defaults                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const POSTER_BASE =
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2F"
const posterUrl = (id: string): string => `${POSTER_BASE}${id}.png&w=1280&q=85`
const VIDEO_BASE = "https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/"

const card = (
    title: string,
    aspect: number,
    videoPath: string,
    posterId: string
): ProjectCard => ({
    title,
    poster: posterUrl(posterId),
    video: `${VIDEO_BASE}${videoPath}`,
    aspect,
    enabled: true,
})

const DEFAULT_CARDS: ProjectCard[] = [
    card(
        "Living Portrait",
        1.745,
        "aaaf/living-portrait-hero.mp4",
        "hf_20261031_044539_b7fde132-8c25-4dda-ab05-4e4be99bf3d3"
    ),
    card(
        "Moss Island",
        1.7,
        "aaaf/mossline-hero.mp4",
        "hf_20261106_032528_99eb9a00-a553-40b6-8b97-017e918971c6"
    ),
    card(
        "Flower Valley",
        1.735,
        "aaaf/fernhollow.mp4",
        "hf_20261103_061637_11907771-15ce-494b-81a4-9051861d6ce5"
    ),
    card(
        "Runway Lookbook",
        1.837,
        "aaaf/vell-lookbook.mp4",
        "hf_20261102_044911_1ad79156-a8dc-475a-8891-8408a9b61320"
    ),
    card(
        "Shelf Hero",
        1.526,
        "aaaf/vasari-vhs-hero.mp4",
        "hf_20261029_012401_8f947ed0-7b82-47d6-bdcd-b1ce1af0bf5f"
    ),
    card(
        "Solar Fog",
        1.658,
        "aaaf/lumen-roof-hero.mp4",
        "hf_20261102_041507_8e9c2d22-8be2-4652-8bbe-1f4556ea463a"
    ),
    card(
        "Honey Bee",
        1.33,
        "designs/honey-bee-melli-landing.mp4",
        "hf_20261017_154537_1384fa6d-282d-46e2-8748-a70be1cf681a"
    ),
    card(
        "Spider Web",
        1.61,
        "aaaf/found-spider.mp4",
        "hf_20261104_020746_7eebb7cf-e21b-4288-8211-0cb9d0728f48"
    ),
]

const DEFAULTS: Omit<Config, "cards"> = {
    general: {
        enabled: true,
        fullViewport: false,
        background: "#000000",
        breakpoint: 649,
        loader: true,
        floor: true,
        reflections: true,
        reducedMotion: "system",
    },
    ribbon: {
        desktopCardHeight: 43.5,
        maxCardHeight: 550,
        mobileMargin: 20,
        desktopGap: 10,
        mobileGap: 20,
        desktopRadius: 20,
        mobileRadius: 15,
        initialX: 100,
        initialYPercent: -17.7,
        depth: 1,
        curveIntensity: 1,
        curveShape: 1,
        lean: 1,
        scrollSensitivity: 1,
        scrollSmoothing: 0.1,
        velocityIntensity: 1,
        maxDepthBoost: 1.6,
    },
    animation: {
        videoPreviews: true,
        videoSpeed: 1,
        infinite: true,
        touch: true,
        keyboard: true,
        hover: true,
        hoverIntensity: 1,
        cardFade: 0.6,
        floorFade: 0.8,
    },
    typography: {
        fontFamily: "Inter Tight",
        loadGoogleFont: true,
        desktopSize: 18,
        mobileSize: 16,
        weight: 400,
        letterSpacing: -0.05,
        color: "#ffffff",
        insetXDesktop: 20,
        insetXMobile: 10,
        insetBottom: 10,
    },
    cta: {
        show: true,
        background: "#000000",
        iconColor: "#ffffff",
        size: 25,
        shape: "circle",
        icon: "auto",
    },
    floor: {
        gridVisible: true,
        gridColor: "#ffffff",
        gridOpacity: 0.08,
        gridSpacing: 0.2,
        depth: 6,
        reflectionIntensity: 0.5,
        reflectionFade: 0.5,
        shadowIntensity: 0.6,
    },
    advanced: {
        pixelRatio: 2,
        antialias: true,
        debug: "off",
        performance: "balanced",
        preload: "lazy",
        animateOnCanvas: false,
    },
}

const finite = (
    v: unknown,
    fallback: number,
    lo: number,
    hi: number
): number =>
    typeof v === "number" && Number.isFinite(v)
        ? Math.min(hi, Math.max(lo, v))
        : fallback

function normalizeCards(
    input: Partial<ProjectCard>[] | undefined
): ProjectCard[] {
    const list = Array.isArray(input) ? input : DEFAULT_CARDS
    return list.map((c, i) => ({
        title: typeof c.title === "string" ? c.title : `Project ${i + 1}`,
        poster: typeof c.poster === "string" ? c.poster : "",
        posterImage: c.posterImage,
        video: typeof c.video === "string" ? c.video : "",
        videoFile: typeof c.videoFile === "string" ? c.videoFile : "",
        aspect: finite(c.aspect, 1.6, 0.3, 4),
        enabled: c.enabled !== false,
    }))
}

function mergeConfig(p: RibbonHeroProps): Config {
    const c: Config = {
        general: { ...DEFAULTS.general, ...p.general },
        cards: normalizeCards(p.cards),
        ribbon: { ...DEFAULTS.ribbon, ...p.ribbon },
        animation: { ...DEFAULTS.animation, ...p.animation },
        typography: { ...DEFAULTS.typography, ...p.typography },
        cta: { ...DEFAULTS.cta, ...p.cta },
        floor: { ...DEFAULTS.floor, ...p.floor },
        advanced: { ...DEFAULTS.advanced, ...p.advanced },
    }
    const d = DEFAULTS
    c.general.breakpoint = finite(
        c.general.breakpoint,
        d.general.breakpoint,
        200,
        4000
    )
    c.ribbon.desktopCardHeight = finite(
        c.ribbon.desktopCardHeight,
        43.5,
        10,
        95
    )
    c.ribbon.maxCardHeight = finite(c.ribbon.maxCardHeight, 550, 80, 2000)
    c.ribbon.mobileMargin = finite(c.ribbon.mobileMargin, 20, 0, 200)
    c.ribbon.desktopGap = finite(c.ribbon.desktopGap, 10, 0, 400)
    c.ribbon.mobileGap = finite(c.ribbon.mobileGap, 20, 0, 400)
    c.ribbon.scrollSmoothing = finite(c.ribbon.scrollSmoothing, 0.1, 0.01, 1)
    c.ribbon.scrollSensitivity = finite(c.ribbon.scrollSensitivity, 1, 0.1, 5)
    c.ribbon.curveShape = finite(c.ribbon.curveShape, 1, 0, 1)
    c.animation.videoSpeed = finite(c.animation.videoSpeed, 1, 0.25, 4)
    c.animation.cardFade = finite(c.animation.cardFade, 0.6, 0.05, 5)
    c.animation.floorFade = finite(c.animation.floorFade, 0.8, 0.05, 5)
    c.floor.gridSpacing = finite(c.floor.gridSpacing, 0.2, 0.03, 2)
    c.floor.depth = finite(c.floor.depth, 6, 1, 20)
    c.advanced.pixelRatio = finite(c.advanced.pixelRatio, 2, 0.5, 2)
    c.cta.size = finite(c.cta.size, 25, 8, 80)
    return c
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Constants shared by CPU and GLSL                                           */
/* ────────────────────────────────────────────────────────────────────────── */

const FOV = 53.4
const CAM_Z = 41.18
const BANK = -0.16
const REAR_Y = 0.1
const REAR_Z = 0.2
const VTWIST = 1.8
const TAIL = 1.0
const SHIFT = -0.2
const DESKTOP_T = 1.15
const DESKTOP_LEAN = -0.12
const DESKTOP_DIAGONAL = 0.03
const FLOOR_OPACITY = 0.9
const PERF_DPR: Record<PerformanceMode, number> = {
    quality: 2,
    balanced: 1.5,
    performance: 1,
}
const PERF_REFLECTION_SCALE: Record<PerformanceMode, number> = {
    quality: 0.5,
    balanced: 0.5,
    performance: 0.35,
}
const DEBUG_INDEX: Record<DebugMode, number> = {
    off: 0,
    normals: 1,
    uv: 2,
    depth: 3,
    mask: 4,
}
const BIG_FLICK = 80
const MOBILE_REVEAL_MARGIN = 1.8

/* ────────────────────────────────────────────────────────────────────────── */
/* Shaders                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const GLSL_SHAPE = /* glsl */ `
#define PI 3.14159265359
float shapeFn(float q, float c, float tail) {
  float m = mix(1.0 - q * q, sin(PI * q), c);
  return m * exp(-tail * q * q);
}
float slopeFn(float q, float c, float tail) {
  float m = mix(1.0 - q * q, sin(PI * q), c);
  float dm = mix(-2.0 * q, PI * cos(PI * q), c);
  float e = exp(-tail * q * q);
  return dm * e + m * (-2.0 * tail * q * e);
}
`

const CARD_VERT = /* glsl */ `
${GLSL_SHAPE}
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uMobile;
uniform float uAxisHalf;
uniform float uHalfH;
uniform float uC;
uniform float uT;
uniform float uShift;
uniform float uD;
uniform float uTail;
uniform float uBank;
uniform float uVel;
uniform float uVelAbs;
uniform float uWind;
uniform float uVTwist;
uniform float uLean;
uniform float uDiag;
uniform float uRearY;
uniform float uRearZ;
uniform float uHover;
uniform float uHoverAmp;

varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDome;

float domeOf(vec2 uv) {
  vec2 c = (uv - 0.5) * 2.0;
  return pow(clamp(1.0 - dot(c, c) * 0.75, 0.0, 1.0), 1.5);
}

vec3 deform(vec2 lp) {
  // 1. hover dent (dome pushed away from the viewer)
  vec2 uv = lp / uSize + 0.5;
  vec3 p = vec3(lp, -uHoverAmp * uHover * domeOf(uv));
  // 2. model transformation
  p.xy += uCenter;
  // 3. mobile axis swap: s runs along the ribbon, t across it
  float s = mix(p.x, p.y, uMobile);
  float t = mix(p.y, p.x, uMobile);
  float z = p.z;
  float q = s / uAxisHalf * uT + uShift;
  // 4. wind rotation + velocity wring (twist about the ribbon axis)
  float a = uWind + uVTwist * uVel * q * exp(-q * q) * 0.35;
  float ca = cos(a);
  float sa = sin(a);
  float tw = t * ca - z * sa;
  z = t * sa + z * ca;
  t = tw;
  // 5. ribbon depth bend + banking roll
  float zc = -uD * shapeFn(q, uC, uTail);
  float roll = uBank * slopeFn(q, uC, uTail) / PI * uC;
  float cr = cos(roll);
  float sr = sin(roll);
  float t2 = t * cr - z * sr;
  float z2 = t * sr + z * cr;
  t = t2;
  z = z2 + zc;
  // 6. diagonal + rear lift
  float rear = smoothstep(-0.1, 1.0, q);
  t += uDiag * s + uRearY * uAxisHalf * uVelAbs * rear;
  z -= uRearZ * uAxisHalf * 0.25 * uVelAbs * rear;
  // 7. lean
  s += uLean * t / uHalfH;
  return mix(vec3(s, t, z), vec3(t, s, z), uMobile);
}

void main() {
  vec2 lp = position.xy * uSize;
  vec3 p0 = deform(lp);
  vec3 pu = deform(lp + vec2(uSize.x * 0.003, 0.0));
  vec3 pv = deform(lp + vec2(0.0, uSize.y * 0.003));
  vNormal = normalize(cross(pu - p0, pv - p0));
  vWorld = p0;
  vUv = uv;
  vDome = domeOf(uv);
  gl_Position = projectionMatrix * viewMatrix * vec4(p0, 1.0);
}
`

const CARD_FRAG = /* glsl */ `
uniform sampler2D uPoster;
uniform sampler2D uVideo;
uniform sampler2D uOverlay;
uniform float uVideoMix;
uniform float uOpacity;
uniform float uHover;
uniform float uDepthShade;
uniform float uAxisHalf;
uniform float uCardAspect;
uniform float uPosterAspect;
uniform float uVideoAspect;
uniform float uRadiusPx;
uniform float uDebug;
uniform vec2 uSizePx;

varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDome;

vec2 coverUv(vec2 uv, float mediaA, float cardA) {
  vec2 r = vec2(1.0);
  if (mediaA > cardA) { r.x = cardA / mediaA; } else { r.y = mediaA / cardA; }
  return (uv - 0.5) * r + 0.5;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  // media + overlay (sampled before any discard to keep derivatives valid)
  vec3 mp = texture2D(uPoster, coverUv(vUv, uPosterAspect, uCardAspect)).rgb;
  vec3 mv = texture2D(uVideo, coverUv(vUv, uVideoAspect, uCardAspect)).rgb;
  vec4 ov = texture2D(uOverlay, vUv);
  vec3 media = mix(mp, mv, uVideoMix);

  // rounded rectangle mask, anti-aliased with fwidth
  vec2 pp = (vUv - 0.5) * uSizePx;
  float d = sdRoundBox(pp, uSizePx * 0.5, uRadiusPx);
  float aa = max(fwidth(d), 0.0001);
  float mask = clamp(0.5 - d / aa, 0.0, 1.0);

  // analytic-normal lighting + Blinn-Phong sheen
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.0) { N = -N; }
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  float light = 0.8 + 0.27 * max(dot(N, L), 0.0);
  light *= 1.0 - 0.14 * uHover * vDome;
  vec3 Hh = normalize(L + V);
  float spec = pow(max(dot(N, Hh), 0.0), 48.0) * 0.1 * (1.0 + 0.8 * uHover * vDome);

  // depth darkening (desktop only: uDepthShade = 0 on mobile)
  float zn = vWorld.z / (uAxisHalf * 0.3);
  float shade = 1.0 - uDepthShade * (0.5 * clamp(-zn, 0.0, 1.0) - 0.08 * clamp(zn, 0.0, 1.0));

  vec3 col = media * light;
  col = mix(col, ov.rgb, ov.a);
  col *= shade;
  col += vec3(spec) * (1.0 - ov.a);

  if (uDebug > 0.5 && uDebug < 1.5) { col = N * 0.5 + 0.5; }
  else if (uDebug > 1.5 && uDebug < 2.5) { col = vec3(vUv, 0.0); }
  else if (uDebug > 2.5 && uDebug < 3.5) { col = vec3(clamp(-zn * 0.5 + 0.5, 0.0, 1.0)); }
  else if (uDebug > 3.5) { col = vec3(mask); }

  if (mask <= 0.002) { discard; }
  gl_FragColor = vec4(col, mask * uOpacity);
}
`

const FLOOR_VERT = /* glsl */ `
uniform mat4 uReflView;
uniform mat4 uReflProj;
varying vec3 vWorld;
varying vec4 vRefl;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vRefl = uReflProj * uReflView * wp;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const FLOOR_FRAG = /* glsl */ `
${GLSL_SHAPE}
uniform sampler2D uReflTex;
uniform vec3 uGridColor;
uniform float uGridOpacity;
uniform float uGridVisible;
uniform float uSpacing;
uniform float uReflIntensity;
uniform float uReflFade;
uniform float uShadow;
uniform float uOpacity;
uniform float uNearZ;
uniform float uFarZ;
uniform float uHalfH;
uniform float uAxisHalf;
uniform float uC;
uniform float uT;
uniform float uShift;
uniform float uD;
uniform float uTail;
varying vec3 vWorld;
varying vec4 vRefl;

void main() {
  vec2 g = vWorld.xz / uSpacing;
  vec2 fw = max(fwidth(g), vec2(0.00001));
  vec2 dl = abs(fract(g - 0.5) - 0.5) / fw;
  float gridLine = 1.0 - min(min(dl.x, dl.y), 1.0);
  gridLine *= 1.0 - smoothstep(0.35, 0.8, max(fw.x, fw.y));

  float t = clamp((uNearZ - vWorld.z) / (uNearZ - uFarZ), 0.0, 1.0);
  float farFade = 1.0 - smoothstep(0.3, 1.0, t);
  float nearFade = smoothstep(0.0, 0.05, t);

  // distance in front of the ribbon surface at this x
  float q = vWorld.x / uAxisHalf * uT + uShift;
  float zc = -uD * shapeFn(q, uC, uTail);
  float dz = vWorld.z - zc;
  float sig = uHalfH * 0.12;
  float shadow = exp(-(dz * dz) / (2.0 * sig * sig));

  vec2 ruv = vRefl.xy / vRefl.w * 0.5 + 0.5;
  ruv += vec2(sin(vWorld.x * 0.9 + vWorld.z * 0.35), cos(vWorld.z * 0.6 - vWorld.x * 0.2)) * 0.003;
  vec3 refl = texture2D(uReflTex, ruv).rgb;
  float rf = exp(-uReflFade * max(dz, 0.0) / uHalfH * 1.5);
  float lineMask = 0.12 + 0.88 * gridLine;

  vec3 col = uGridColor * gridLine * uGridOpacity * uGridVisible;
  col += refl * uReflIntensity * rf * lineMask;
  col *= 1.0 - uShadow * shadow * 0.75;
  col *= farFade * nearFade;
  gl_FragColor = vec4(col, uOpacity);
}
`

/* ────────────────────────────────────────────────────────────────────────── */
/* Small helpers                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const clamp = (v: number, lo: number, hi: number): number =>
    Math.min(hi, Math.max(lo, v))
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
const sleep = (ms: number): Promise<void> =>
    new Promise((r) => window.setTimeout(r, ms))
const smoothstepCpu = (a: number, b: number, x: number): number => {
    const t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}

interface RGBA {
    r: number
    g: number
    b: number
    a: number
}
const rgbaCss = (c: RGBA): string => `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`

/** Resolves any CSS colour (including Framer `var(--token…)` values) to RGBA. */
function makeColorResolver(host: HTMLElement) {
    const SENTINEL = "rgb(1, 2, 3)"
    const probe = document.createElement("span")
    probe.setAttribute("aria-hidden", "true")
    probe.style.cssText =
        "position:absolute;width:0;height:0;visibility:hidden;pointer-events:none"
    host.appendChild(probe)
    const cache = new Map<string, RGBA>()
    return {
        resolve(
            css: string,
            fallback: RGBA = { r: 0, g: 0, b: 0, a: 1 }
        ): RGBA {
            const hit = cache.get(css)
            if (hit) return hit
            probe.style.color = SENTINEL
            probe.style.color = css
            const computed = getComputedStyle(probe).color
            let out = fallback
            const m = computed.match(/rgba?\(([^)]+)\)/)
            if (
                m &&
                (computed !== SENTINEL ||
                    css.replace(/\s/g, "") === "rgb(1,2,3)")
            ) {
                const parts = m[1]
                    .split(/[\s,/]+/)
                    .filter(Boolean)
                    .map(Number)
                if (parts.length >= 3 && parts.every(Number.isFinite)) {
                    out = {
                        r: parts[0],
                        g: parts[1],
                        b: parts[2],
                        a: parts.length > 3 ? parts[3] : 1,
                    }
                }
            }
            cache.set(css, out)
            return out
        },
        clear(): void {
            cache.clear()
        },
        dispose(): void {
            probe.remove()
        },
    }
}

function injectFontLink(family: string): void {
    const id = `rh-font-${family.replace(/\W+/g, "-").toLowerCase()}`
    if (document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap`
    document.head.appendChild(link)
}

interface LetterSpacingContext extends CanvasRenderingContext2D {
    letterSpacing: string
}

function drawSpacedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    spacing: number
): void {
    const native = ctx as CanvasRenderingContext2D &
        Partial<LetterSpacingContext>
    if (typeof native.letterSpacing === "string") {
        native.letterSpacing = `${spacing}px`
        ctx.fillText(text, x, y)
        native.letterSpacing = "0px"
        return
    }
    let cx = x
    for (const ch of text) {
        ctx.fillText(ch, cx, y)
        cx += ctx.measureText(ch).width + spacing
    }
}

function measureSpaced(
    ctx: CanvasRenderingContext2D,
    text: string,
    spacing: number
): number {
    return ctx.measureText(text).width + spacing * text.length
}

function roundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Ribbon maths (CPU mirror of the vertex shader, used for hit testing)       */
/* ────────────────────────────────────────────────────────────────────────── */

interface Curve {
    mobile: number
    axisHalf: number
    halfH: number
    C: number
    T: number
    shift: number
    D: number
    tail: number
    bank: number
    vel: number
    velAbs: number
    wind: number
    vtwist: number
    lean: number
    diag: number
    rearY: number
    rearZ: number
}

function shapeCpu(q: number, c: number, tail: number): number {
    const m = (1 - q * q) * (1 - c) + Math.sin(Math.PI * q) * c
    return m * Math.exp(-tail * q * q)
}

function slopeCpu(q: number, c: number, tail: number): number {
    const m = (1 - q * q) * (1 - c) + Math.sin(Math.PI * q) * c
    const dm = -2 * q * (1 - c) + Math.PI * Math.cos(Math.PI * q) * c
    const e = Math.exp(-tail * q * q)
    return dm * e + m * (-2 * tail * q * e)
}

function deformCpu(
    cv: Curve,
    lx: number,
    ly: number,
    cx: number,
    cy: number,
    out: THREE.Vector3
): void {
    const mobile = cv.mobile > 0.5
    const px = lx + cx
    const py = ly + cy
    let s = mobile ? py : px
    let t = mobile ? px : py
    let z = 0
    const q = (s / cv.axisHalf) * cv.T + cv.shift
    const a = cv.wind + cv.vtwist * cv.vel * q * Math.exp(-q * q) * 0.35
    const tw = t * Math.cos(a) - z * Math.sin(a)
    z = t * Math.sin(a) + z * Math.cos(a)
    t = tw
    const zc = -cv.D * shapeCpu(q, cv.C, cv.tail)
    const roll = ((cv.bank * slopeCpu(q, cv.C, cv.tail)) / Math.PI) * cv.C
    const t2 = t * Math.cos(roll) - z * Math.sin(roll)
    const z2 = t * Math.sin(roll) + z * Math.cos(roll)
    t = t2
    z = z2 + zc
    const rear = smoothstepCpu(-0.1, 1, q)
    t += cv.diag * s + cv.rearY * cv.axisHalf * cv.velAbs * rear
    z -= cv.rearZ * cv.axisHalf * 0.25 * cv.velAbs * rear
    s += (cv.lean * t) / cv.halfH
    if (mobile) out.set(t, s, z)
    else out.set(s, t, z)
}

function pointInPolygon(poly: number[], x: number, y: number): boolean {
    let inside = false
    const n = poly.length / 2
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = poly[i * 2]
        const yi = poly[i * 2 + 1]
        const xj = poly[j * 2]
        const yj = poly[j * 2 + 1]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
            inside = !inside
    }
    return inside
}

/* ────────────────────────────────────────────────────────────────────────── */
/* WebGL engine                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

interface Engine {
    dispose(): void
    configChanged(): void
}

interface EngineOptions {
    stage: HTMLDivElement
    events: HTMLDivElement
    cards: ProjectCard[]
    getConfig: () => Config
    live: boolean
    onReady: () => void
    onContextLost: () => void
}

type VideoState = "idle" | "loading" | "ready" | "failed"

interface CardRT {
    cfg: ProjectCard
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
    uniforms: Record<string, THREE.IUniform>
    posterOwn: THREE.Texture | null
    overlayTex: THREE.CanvasTexture | null
    overlayKey: string
    video: HTMLVideoElement | null
    videoTex: THREE.VideoTexture | null
    videoAbort: AbortController | null
    videoState: VideoState
    videoFrames: number
    playing: boolean
    retryAt: number
    mix: number
    hover: number
    hoverTarget: number
    w: number
    h: number
    extent: number
    c: number
    pos: number
    onScreen: boolean
}

function createEngine(o: EngineOptions): Engine | null {
    const { stage, events, live } = o
    let cfg = o.getConfig()
    let disposed = false

    /* renderer ----------------------------------------------------------- */
    let renderer: THREE.WebGLRenderer
    try {
        renderer = new THREE.WebGLRenderer({
            antialias: cfg.advanced.antialias,
            alpha: false,
            stencil: false,
            powerPreference: "high-performance",
        })
    } catch {
        return null
    }
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    const canvas = renderer.domElement
    canvas.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;display:block"
    canvas.setAttribute("aria-hidden", "true")
    stage.appendChild(canvas)

    const abort = new AbortController()
    const signal = abort.signal
    const colors = makeColorResolver(stage)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2000)
    camera.position.set(0, 0, CAM_Z)
    camera.updateMatrixWorld(true)
    const mirrorCam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2000)
    mirrorCam.matrixWorldAutoUpdate = false

    /* shared resources --------------------------------------------------- */
    const geometry = new THREE.PlaneGeometry(1, 1, 48, 32)
    const mkTexture = (
        rgba: [number, number, number, number]
    ): THREE.DataTexture => {
        const t = new THREE.DataTexture(
            new Uint8Array(rgba),
            1,
            1,
            THREE.RGBAFormat
        )
        t.needsUpdate = true
        return t
    }
    const fallbackPoster = mkTexture([16, 16, 16, 255])
    const blackVideo = mkTexture([0, 0, 0, 255])
    const emptyOverlay = mkTexture([0, 0, 0, 0])

    const curve: Curve = {
        mobile: 0,
        axisHalf: 1,
        halfH: 1,
        C: 1,
        T: DESKTOP_T,
        shift: SHIFT,
        D: 0,
        tail: TAIL,
        bank: BANK,
        vel: 0,
        velAbs: 0,
        wind: 0,
        vtwist: VTWIST,
        lean: 0,
        diag: 0,
        rearY: 0,
        rearZ: 0,
    }
    const U: Record<string, THREE.IUniform> = {
        uMobile: { value: 0 },
        uAxisHalf: { value: 1 },
        uHalfH: { value: 1 },
        uC: { value: 1 },
        uT: { value: DESKTOP_T },
        uShift: { value: SHIFT },
        uD: { value: 0 },
        uTail: { value: TAIL },
        uBank: { value: BANK },
        uVel: { value: 0 },
        uVelAbs: { value: 0 },
        uWind: { value: 0 },
        uVTwist: { value: VTWIST },
        uLean: { value: 0 },
        uDiag: { value: 0 },
        uRearY: { value: 0 },
        uRearZ: { value: 0 },
        uHoverAmp: { value: 0 },
        uDepthShade: { value: 1 },
        uOpacity: { value: 0 },
        uDebug: { value: 0 },
    }
    const syncCurve = (): void => {
        U.uMobile.value = curve.mobile
        U.uAxisHalf.value = curve.axisHalf
        U.uHalfH.value = curve.halfH
        U.uC.value = curve.C
        U.uT.value = curve.T
        U.uShift.value = curve.shift
        U.uD.value = curve.D
        U.uVel.value = curve.vel
        U.uVelAbs.value = curve.velAbs
        U.uWind.value = curve.wind
        U.uLean.value = curve.lean
        U.uDiag.value = curve.diag
        U.uRearY.value = curve.rearY
        U.uRearZ.value = curve.rearZ
    }

    /* cards -------------------------------------------------------------- */
    const cardsRT: CardRT[] = o.cards.map((cc) => {
        const uniforms: Record<string, THREE.IUniform> = {
            uSize: { value: new THREE.Vector2(1, 1) },
            uCenter: { value: new THREE.Vector2() },
            uSizePx: { value: new THREE.Vector2(1, 1) },
            uRadiusPx: { value: 20 },
            uCardAspect: { value: cc.aspect },
            uPosterAspect: { value: cc.aspect },
            uVideoAspect: { value: cc.aspect },
            uPoster: { value: fallbackPoster },
            uVideo: { value: blackVideo },
            uOverlay: { value: emptyOverlay },
            uVideoMix: { value: 0 },
            uHover: { value: 0 },
        }
        const material = new THREE.ShaderMaterial({
            vertexShader: CARD_VERT,
            fragmentShader: CARD_FRAG,
            uniforms: { ...U, ...uniforms },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: true,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.frustumCulled = false
        mesh.visible = false
        scene.add(mesh)
        return {
            cfg: cc,
            mesh,
            uniforms,
            posterOwn: null,
            overlayTex: null,
            overlayKey: "",
            video: null,
            videoTex: null,
            videoAbort: null,
            videoState: "idle",
            videoFrames: 0,
            playing: false,
            retryAt: 0,
            mix: 0,
            hover: 0,
            hoverTarget: 0,
            w: 1,
            h: 1,
            extent: 1,
            c: 0,
            pos: 0,
            onScreen: false,
        }
    })

    /* floor + reflection -------------------------------------------------- */
    const floorGeometry = new THREE.PlaneGeometry(1, 1, 48, 24)
    floorGeometry.rotateX(-Math.PI / 2)
    const reflectionTarget = new THREE.WebGLRenderTarget(2, 2, {
        depthBuffer: true,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        generateMipmaps: false,
    })
    const floorU: Record<string, THREE.IUniform> = {
        uReflTex: { value: reflectionTarget.texture },
        uReflView: { value: mirrorCam.matrixWorldInverse },
        uReflProj: { value: camera.projectionMatrix },
        uGridColor: { value: new THREE.Color(1, 1, 1) },
        uGridOpacity: { value: 0.08 },
        uGridVisible: { value: 1 },
        uSpacing: { value: 4 },
        uReflIntensity: { value: 0.5 },
        uReflFade: { value: 0.5 },
        uShadow: { value: 0.6 },
        uOpacity: { value: 0 },
        uNearZ: { value: 36 },
        uFarZ: { value: -100 },
        uHalfH: U.uHalfH,
        uAxisHalf: U.uAxisHalf,
        uC: U.uC,
        uT: U.uT,
        uShift: U.uShift,
        uD: U.uD,
        uTail: U.uTail,
    }
    const floorMaterial = new THREE.ShaderMaterial({
        vertexShader: FLOOR_VERT,
        fragmentShader: FLOOR_FRAG,
        uniforms: floorU,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.frustumCulled = false
    floor.renderOrder = -1
    floor.visible = false
    scene.add(floor)

    /* state ---------------------------------------------------------------- */
    let cw = 1
    let ch = 1
    let mobile = false
    let halfH = 1
    let halfW = 1
    let k = 1
    let loopLength = 1
    let scrollMin = 0
    let scrollMax = 0
    let target = 0
    let current = 0
    let prevCurrent = 0
    let velSmoothed = 0
    let pool = 0
    let momentum = 0
    let dragging = false
    let revealStart = -1
    let rootVisible = true
    let docHidden = typeof document !== "undefined" && document.hidden
    let layoutDone = false
    let lastTime = 0
    let rafId = 0
    let stillQueued = false
    let overlayTimer = 0
    let fontKey = ""
    let hoverIndex = -1
    const pointer = { x: 0, y: 0, inside: false }

    const reducedQuery = window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null
    const isReduced = (): boolean => {
        const m = cfg.general.reducedMotion
        return m === "on"
            ? true
            : m === "off"
              ? false
              : !!reducedQuery && reducedQuery.matches
    }

    /* layout ---------------------------------------------------------------- */
    function layout(): void {
        cfg = o.getConfig()
        colors.clear()
        const prevMobile = mobile
        cw = Math.max(1, stage.clientWidth)
        ch = Math.max(1, stage.clientHeight)
        mobile = cw <= cfg.general.breakpoint

        const dpr = Math.min(
            window.devicePixelRatio || 1,
            cfg.advanced.pixelRatio,
            PERF_DPR[cfg.advanced.performance]
        )
        renderer.setPixelRatio(dpr)
        renderer.setSize(cw, ch, false)
        const bg = colors.resolve(cfg.general.background)
        renderer.setClearColor(
            new THREE.Color().setRGB(bg.r / 255, bg.g / 255, bg.b / 255),
            1
        )

        camera.aspect = cw / ch
        camera.updateProjectionMatrix()
        mirrorCam.projectionMatrix.copy(camera.projectionMatrix)
        mirrorCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse)
        halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z
        halfW = halfH * camera.aspect
        k = (2 * halfH) / ch

        const r = cfg.ribbon
        const gap = mobile ? r.mobileGap : r.desktopGap
        const radius = mobile ? r.mobileRadius : r.desktopRadius
        cardsRT.forEach((c) => {
            const a = c.cfg.aspect
            if (mobile) {
                c.w = Math.max(40, cw - 2 * r.mobileMargin)
                c.h = c.w / a
            } else {
                c.h = Math.min(
                    (ch * r.desktopCardHeight) / 100,
                    r.maxCardHeight
                )
                c.w = c.h * a
            }
            c.extent = mobile ? c.h : c.w
            ;(c.uniforms.uSize.value as THREE.Vector2).set(c.w * k, c.h * k)
            ;(c.uniforms.uSizePx.value as THREE.Vector2).set(c.w, c.h)
            c.uniforms.uRadiusPx.value = radius
            c.uniforms.uCardAspect.value = c.w / c.h
        })
        loopLength = 0
        cardsRT.forEach((c, i) => {
            c.c =
                i === 0
                    ? 0
                    : cardsRT[i - 1].c +
                      cardsRT[i - 1].extent / 2 +
                      gap +
                      c.extent / 2
            loopLength += c.extent + gap
        })
        loopLength = Math.max(1, loopLength)
        const initial = mobile ? (r.initialYPercent / 100) * ch : r.initialX
        scrollMin = Math.min(0, initial)
        scrollMax = cardsRT.length ? cardsRT[cardsRT.length - 1].c : 0
        if (!layoutDone || prevMobile !== mobile) {
            target = initial
            current = initial
            prevCurrent = initial
            pool = 0
            momentum = 0
            velSmoothed = 0
        }
        layoutDone = true

        // static curve parameters
        curve.mobile = mobile ? 1 : 0
        curve.axisHalf = mobile ? halfH : halfW
        curve.halfH = halfH
        curve.C = mobile ? 0 : r.curveShape
        curve.T = mobile ? 1 : DESKTOP_T
        curve.shift = mobile ? 0 : SHIFT
        curve.lean = mobile ? 0 : DESKTOP_LEAN * halfW * r.lean
        curve.diag = mobile ? 0 : DESKTOP_DIAGONAL
        curve.rearY = mobile ? 0 : REAR_Y
        curve.rearZ = mobile ? 0 : REAR_Z
        U.uDepthShade.value = mobile ? 0 : 1
        const hoverOn = !mobile && cfg.animation.hover && !isReduced()
        U.uHoverAmp.value = hoverOn
            ? halfH * 0.035 * cfg.animation.hoverIntensity
            : 0
        U.uDebug.value = DEBUG_INDEX[cfg.advanced.debug]
        syncCurve()

        layoutFloor(dpr)
        scheduleOverlays(false)
    }

    function layoutFloor(dpr: number): void {
        const f = cfg.floor
        const cardWorldH = (cardsRT[0] ? cardsRT[0].h : ch * 0.435) * k
        const floorY = -cardWorldH / 2 - halfH * 0.02
        const farZ = -f.depth * halfH
        const nearZ = 36
        const span = nearZ - farZ
        const width = 2 * halfW * ((CAM_Z - farZ) / CAM_Z) * 1.3
        floor.scale.set(width, 1, span)
        floor.position.set(0, floorY, (nearZ + farZ) / 2)
        floor.updateMatrixWorld(true)
        floorU.uNearZ.value = nearZ
        floorU.uFarZ.value = farZ
        floorU.uSpacing.value = halfH * f.gridSpacing
        const grid = colors.resolve(f.gridColor, {
            r: 255,
            g: 255,
            b: 255,
            a: 1,
        })
        ;(floorU.uGridColor.value as THREE.Color).setRGB(
            grid.r / 255,
            grid.g / 255,
            grid.b / 255
        )
        floorU.uGridOpacity.value = f.gridOpacity * grid.a
        floorU.uGridVisible.value = f.gridVisible ? 1 : 0
        floorU.uReflIntensity.value = f.reflectionIntensity
        floorU.uReflFade.value = f.reflectionFade
        floorU.uShadow.value = f.shadowIntensity

        // mirror the camera around the plane y = floorY
        const reflect = new THREE.Matrix4().set(
            1,
            0,
            0,
            0,
            0,
            -1,
            0,
            2 * floorY,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            1
        )
        mirrorCam.matrixWorldInverse
            .copy(camera.matrixWorldInverse)
            .multiply(reflect)
        mirrorCam.matrixWorld.copy(mirrorCam.matrixWorldInverse).invert()
        const scale = PERF_REFLECTION_SCALE[cfg.advanced.performance]
        reflectionTarget.setSize(
            Math.max(2, Math.round(cw * dpr * scale)),
            Math.max(2, Math.round(ch * dpr * scale))
        )
    }

    /* overlays (captions + CTA) ------------------------------------------- */
    function scheduleOverlays(immediate: boolean): void {
        window.clearTimeout(overlayTimer)
        if (immediate) {
            buildOverlays()
            return
        }
        overlayTimer = window.setTimeout(buildOverlays, 120)
    }

    function buildOverlays(): void {
        if (disposed) return
        const t = cfg.typography
        const cta = cfg.cta
        const scale = Math.min(window.devicePixelRatio || 1, 2)
        const size = mobile ? t.mobileSize : t.desktopSize
        const insetX = mobile ? t.insetXMobile : t.insetXDesktop
        const textColor = rgbaCss(
            colors.resolve(t.color, { r: 255, g: 255, b: 255, a: 1 })
        )
        const ctaBg = rgbaCss(colors.resolve(cta.background))
        const ctaFg = rgbaCss(
            colors.resolve(cta.iconColor, { r: 255, g: 255, b: 255, a: 1 })
        )
        const icon =
            cta.icon === "auto" ? (mobile ? "arrow" : "plus") : cta.icon
        const styleKey = [
            mobile,
            size,
            insetX,
            textColor,
            ctaBg,
            ctaFg,
            icon,
            scale,
            JSON.stringify(t),
            JSON.stringify(cta),
        ].join("|")

        cardsRT.forEach((c) => {
            const key = `${styleKey}|${c.w.toFixed(1)}|${c.h.toFixed(1)}|${c.cfg.title}`
            if (key === c.overlayKey) return
            c.overlayKey = key
            const cv = document.createElement("canvas")
            cv.width = Math.max(1, Math.ceil(c.w * scale))
            cv.height = Math.max(1, Math.ceil(c.h * scale))
            const ctx = cv.getContext("2d")
            if (!ctx) return
            ctx.scale(scale, scale)
            const rowCenterY =
                c.h -
                t.insetBottom -
                (cta.show ? Math.max(size, cta.size) : size) / 2

            // caption
            ctx.font = `${t.weight} ${size}px "${t.fontFamily}", "Inter Tight", system-ui, sans-serif`
            ctx.fillStyle = textColor
            ctx.textBaseline = "middle"
            const spacing = t.letterSpacing * size
            const maxWidth =
                c.w -
                insetX -
                (cta.show ? cta.size + t.insetBottom + 12 : insetX)
            let label = c.cfg.title
            while (
                label.length > 1 &&
                measureSpaced(ctx, label, spacing) > maxWidth
            ) {
                label = label.slice(0, -2).trimEnd() + "…"
            }
            if (label) drawSpacedText(ctx, label, insetX, rowCenterY, spacing)

            // CTA
            if (cta.show) {
                const s = cta.size
                const cx = c.w - t.insetBottom - s / 2
                const cy = c.h - t.insetBottom - s / 2
                ctx.fillStyle = ctaBg
                if (cta.shape === "circle") {
                    ctx.beginPath()
                    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2)
                    ctx.fill()
                } else {
                    roundedRectPath(
                        ctx,
                        cx - s / 2,
                        cy - s / 2,
                        s,
                        s,
                        cta.shape === "rounded" ? s * 0.3 : 2
                    )
                    ctx.fill()
                }
                ctx.strokeStyle = ctaFg
                ctx.lineWidth = 1.4
                ctx.lineCap = "round"
                ctx.lineJoin = "round"
                const a = s * 0.2
                ctx.beginPath()
                if (icon === "plus") {
                    ctx.moveTo(cx - a, cy)
                    ctx.lineTo(cx + a, cy)
                    ctx.moveTo(cx, cy - a)
                    ctx.lineTo(cx, cy + a)
                } else {
                    ctx.moveTo(cx - a, cy)
                    ctx.lineTo(cx + a, cy)
                    ctx.moveTo(cx + a * 0.15, cy - a * 0.85)
                    ctx.lineTo(cx + a, cy)
                    ctx.lineTo(cx + a * 0.15, cy + a * 0.85)
                }
                ctx.stroke()
            }

            const tex = new THREE.CanvasTexture(cv)
            tex.minFilter = THREE.LinearFilter
            tex.generateMipmaps = false
            const old = c.overlayTex
            c.overlayTex = tex
            c.uniforms.uOverlay.value = tex
            if (old) old.dispose()
        })
        requestRender()
    }

    async function ensureFont(): Promise<void> {
        const t = cfg.typography
        const key = `${t.fontFamily}|${t.weight}|${t.loadGoogleFont}`
        if (key === fontKey) return
        fontKey = key
        if (t.loadGoogleFont && t.fontFamily) injectFontLink(t.fontFamily)
        try {
            await Promise.race([
                document.fonts.load(`${t.weight} 16px "${t.fontFamily}"`),
                sleep(2500),
            ])
        } catch {
            /* the system fallback font is used */
        }
    }

    /* posters ---------------------------------------------------------------- */
    const textureLoader = new THREE.TextureLoader()
    textureLoader.setCrossOrigin("anonymous")
    const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy())

    function loadPoster(c: CardRT): Promise<void> {
        const url = (c.cfg.posterImage && c.cfg.posterImage.src) || c.cfg.poster
        if (!url) return Promise.resolve()
        return new Promise<void>((resolve) => {
            textureLoader.load(
                url,
                (tex) => {
                    if (disposed) {
                        tex.dispose()
                        resolve()
                        return
                    }
                    tex.anisotropy = maxAniso
                    c.posterOwn = tex
                    c.uniforms.uPoster.value = tex
                    const img = tex.image as { width?: number; height?: number }
                    if (img && img.width && img.height)
                        c.uniforms.uPosterAspect.value = img.width / img.height
                    requestRender()
                    resolve()
                },
                undefined,
                () => resolve()
            )
        })
    }

    /* videos ------------------------------------------------------------------ */
    function initVideo(c: CardRT): void {
        if (c.video || c.videoState === "failed") return
        const url = c.cfg.videoFile || c.cfg.video
        if (!url) {
            c.videoState = "failed"
            return
        }
        const v = document.createElement("video")
        const ac = new AbortController()
        c.video = v
        c.videoAbort = ac
        c.videoState = "loading"
        v.muted = true
        v.defaultMuted = true
        v.loop = true
        v.playsInline = true
        v.crossOrigin = "anonymous"
        v.disablePictureInPicture = true
        v.setAttribute("muted", "")
        v.setAttribute("playsinline", "")
        v.setAttribute("webkit-playsinline", "")
        v.preload = cfg.advanced.preload === "metadata" ? "metadata" : "auto"
        v.playbackRate = cfg.animation.videoSpeed
        v.addEventListener(
            "loadeddata",
            () => {
                if (disposed || c.videoState === "failed") return
                const tex = new THREE.VideoTexture(v)
                tex.minFilter = THREE.LinearFilter
                tex.generateMipmaps = false
                tex.needsUpdate = true
                c.videoTex = tex
                c.uniforms.uVideo.value = tex
                if (v.videoWidth && v.videoHeight)
                    c.uniforms.uVideoAspect.value = v.videoWidth / v.videoHeight
                c.videoFrames = 0
                c.videoState = "ready"
            },
            { signal: ac.signal }
        )
        v.addEventListener(
            "error",
            () => {
                c.videoState = "failed"
                c.playing = false
            },
            { signal: ac.signal }
        )
        v.src = url
        v.load()
    }

    function releaseVideo(c: CardRT): void {
        if (c.videoAbort) c.videoAbort.abort()
        if (c.video) {
            c.video.pause()
            c.video.removeAttribute("src")
            c.video.load()
        }
        if (c.videoTex) c.videoTex.dispose()
        c.video = null
        c.videoTex = null
        c.videoAbort = null
    }

    function startVideos(): void {
        if (
            !live ||
            !cfg.animation.videoPreviews ||
            isReduced() ||
            cfg.advanced.preload === "lazy"
        )
            return
        cardsRT.forEach(initVideo)
    }

    function manageVideo(c: CardRT, now: number, videosOn: boolean): void {
        const want = videosOn && !docHidden && rootVisible && c.onScreen
        if (want) {
            if (!c.video) initVideo(c)
            const v = c.video
            if (
                v &&
                c.videoState !== "failed" &&
                !c.playing &&
                now >= c.retryAt
            ) {
                c.playing = true
                v.playbackRate = cfg.animation.videoSpeed
                const p = v.play()
                if (p) {
                    p.catch(() => {
                        c.playing = false
                        c.retryAt = now + 1500
                    })
                }
            }
        } else if (c.playing && c.video) {
            c.video.pause()
            c.playing = false
        }
        if (c.videoState === "ready") c.videoFrames++
        const mixTarget =
            videosOn && c.videoState === "ready" && c.videoFrames > 3 ? 1 : 0
        c.mix += (mixTarget - c.mix) * 0.18
        if (Math.abs(mixTarget - c.mix) < 0.002) c.mix = mixTarget
        c.uniforms.uVideoMix.value = c.mix
    }

    function pauseAllVideos(): void {
        cardsRT.forEach((c) => {
            if (c.video && c.playing) c.video.pause()
            c.playing = false
        })
    }

    /* hit testing -------------------------------------------------------------- */
    const poly: number[] = []
    const dv = new THREE.Vector3()
    const OUTLINE_STEPS = 10

    function projectOutline(c: CardRT): void {
        const size = c.uniforms.uSize.value as THREE.Vector2
        const ctr = c.uniforms.uCenter.value as THREE.Vector2
        const hw = size.x / 2
        const hh = size.y / 2
        poly.length = 0
        for (let e = 0; e < 4; e++) {
            for (let i = 0; i < OUTLINE_STEPS; i++) {
                const f = i / OUTLINE_STEPS
                let lx: number
                let ly: number
                if (e === 0) {
                    lx = -hw + 2 * hw * f
                    ly = -hh
                } else if (e === 1) {
                    lx = hw
                    ly = -hh + 2 * hh * f
                } else if (e === 2) {
                    lx = hw - 2 * hw * f
                    ly = hh
                } else {
                    lx = -hw
                    ly = hh - 2 * hh * f
                }
                deformCpu(curve, lx, ly, ctr.x, ctr.y, dv)
                dv.project(camera)
                poly.push((dv.x * 0.5 + 0.5) * cw, (-dv.y * 0.5 + 0.5) * ch)
            }
        }
    }

    function hitTest(x: number, y: number): number {
        for (let i = 0; i < cardsRT.length; i++) {
            const c = cardsRT[i]
            if (!c.mesh.visible) continue
            projectOutline(c)
            if (pointInPolygon(poly, x, y)) return i
        }
        return -1
    }

    function setCursor(index: number): void {
        if (index === hoverIndex) return
        hoverIndex = index
        events.style.cursor = index >= 0 ? "pointer" : ""
    }

    /* per-frame update ------------------------------------------------------------ */
    function update(dt: number, now: number): void {
        const reduced = isReduced()
        const r = cfg.ribbon
        const an = cfg.animation

        // scroll model
        if (Math.abs(pool) > 0.01) {
            const release = pool * (1 - Math.exp(-dt * 9))
            pool -= release
            target += release
        } else pool = 0
        if (!dragging) {
            if (Math.abs(momentum) > 0.02) {
                target += momentum * dt * 60
                momentum *= Math.pow(0.94, dt * 60)
            } else momentum = 0
        }
        if (!an.infinite) target = clamp(target, scrollMin, scrollMax)
        const alpha = reduced ? 1 : 1 - Math.pow(1 - r.scrollSmoothing, dt * 60)
        current += (target - current) * alpha
        if (!mobile && !reduced) {
            const lag = cw * 1.5
            if (Math.abs(target - current) > lag)
                current = target - Math.sign(target - current) * lag
        }
        if (an.infinite && Math.abs(current) > loopLength * 50) {
            const shift = Math.round(current / loopLength) * loopLength
            current -= shift
            target -= shift
            prevCurrent -= shift
        }

        // velocity → curve
        const axisExtent = mobile ? ch : cw
        const rawVel = dt > 0 ? (current - prevCurrent) / dt / 60 : 0
        prevCurrent = current
        velSmoothed += (rawVel - velSmoothed) * (1 - Math.exp(-dt * 12))
        const vn = reduced
            ? 0
            : clamp(velSmoothed / (axisExtent / 18), -1.5, 1.5) *
              r.velocityIntensity
        const vAbs = Math.min(Math.abs(vn), 3)
        const boost = Math.min(1.1 * vAbs, r.maxDepthBoost)
        curve.vel = vn
        curve.velAbs = Math.min(vAbs, 1.5)
        curve.wind = mobile ? 0 : -0.04 * vn
        curve.D = Math.max(
            0,
            mobile
                ? halfH * 0.18 * boost * r.depth
                : halfW * 0.2 * (r.curveIntensity + boost) * r.depth
        )
        syncCurve()

        // card placement + visibility
        const half = axisExtent / 2
        cardsRT.forEach((c) => {
            let p = c.c - current
            if (an.infinite)
                p =
                    ((((p + loopLength / 2) % loopLength) + loopLength) %
                        loopLength) -
                    loopLength / 2
            c.pos = p
            const reach = half * MOBILE_REVEAL_MARGIN + c.extent / 2
            const visible = Math.abs(p) < reach
            c.mesh.visible = visible
            c.onScreen = visible
            const center = c.uniforms.uCenter.value as THREE.Vector2
            if (mobile) center.set(0, -p * k)
            else center.set(p * k, 0)
        })

        // hover
        const hoverOn = live && !mobile && an.hover && !reduced
        if (hoverOn && pointer.inside && !dragging) {
            let hit = -1
            for (let i = 0; i < cardsRT.length; i++) {
                const c = cardsRT[i]
                if (!c.mesh.visible) continue
                projectOutline(c)
                if (pointInPolygon(poly, pointer.x, pointer.y)) {
                    hit = i
                    break
                }
            }
            cardsRT.forEach((c, i) => (c.hoverTarget = i === hit ? 1 : 0))
            setCursor(hit)
        } else {
            cardsRT.forEach((c) => (c.hoverTarget = 0))
            setCursor(-1)
        }
        const hoverEase = 1 - Math.exp(-dt * 10)
        cardsRT.forEach((c) => {
            c.hover += (c.hoverTarget - c.hover) * hoverEase
            c.uniforms.uHover.value = c.hover
        })

        // videos
        if (live) {
            const videosOn = an.videoPreviews && !reduced
            cardsRT.forEach((c) => manageVideo(c, now, videosOn))
        }

        // reveal
        if (revealStart >= 0) {
            const tCards = clamp(
                (now - revealStart) / (an.cardFade * 1000),
                0,
                1
            )
            const tFloor = clamp(
                (now - revealStart) / (an.floorFade * 1000),
                0,
                1
            )
            U.uOpacity.value = easeOutCubic(tCards)
            floorU.uOpacity.value = FLOOR_OPACITY * easeOutCubic(tFloor)
        }
    }

    function render(): void {
        const showFloor =
            !mobile && cfg.general.floor && floorU.uOpacity.value > 0.001
        if (
            showFloor &&
            cfg.general.reflections &&
            cfg.floor.reflectionIntensity > 0.001
        ) {
            floor.visible = false
            renderer.setRenderTarget(reflectionTarget)
            renderer.setClearColor(0x000000, 0)
            renderer.render(scene, mirrorCam)
            renderer.setRenderTarget(null)
            const bg = colors.resolve(cfg.general.background)
            renderer.setClearColor(
                new THREE.Color().setRGB(bg.r / 255, bg.g / 255, bg.b / 255),
                1
            )
        }
        floor.visible = showFloor
        renderer.render(scene, camera)
    }

    function tick(now: number): void {
        rafId = requestAnimationFrame(tick)
        if (!rootVisible) {
            lastTime = now
            return
        }
        const dt = clamp((now - lastTime) / 1000, 0.001, 0.05)
        lastTime = now
        cfg = o.getConfig()
        update(dt, now)
        render()
    }

    function requestRender(): void {
        if (live || stillQueued || disposed) return
        stillQueued = true
        requestAnimationFrame(() => {
            stillQueued = false
            if (disposed) return
            cfg = o.getConfig()
            if (revealStart >= 0) {
                U.uOpacity.value = 1
                floorU.uOpacity.value = FLOOR_OPACITY
            }
            update(0.016, performance.now())
            render()
        })
    }

    /* input -------------------------------------------------------------------------- */
    function isActive(): boolean {
        return (
            cfg.general.fullViewport ||
            pointer.inside ||
            events.contains(document.activeElement)
        )
    }

    function attachInput(): void {
        events.addEventListener(
            "wheel",
            (e: WheelEvent) => {
                if (e.ctrlKey) return
                e.preventDefault()
                const unit =
                    e.deltaMode === 1
                        ? 16
                        : e.deltaMode === 2
                          ? mobile
                              ? ch
                              : cw
                          : 1
                const raw =
                    mobile || Math.abs(e.deltaY) >= Math.abs(e.deltaX)
                        ? e.deltaY
                        : e.deltaX
                const d = raw * unit * cfg.ribbon.scrollSensitivity
                if (!d) return
                const flick = Math.abs(d) >= BIG_FLICK || e.deltaMode !== 0
                if (flick) {
                    if (pool * d < 0) pool = 0
                    pool += d
                } else {
                    target += d
                }
                momentum = 0
            },
            { passive: false, signal }
        )

        // touch / pen drag with momentum
        let lastX = 0
        let lastY = 0
        let startX = 0
        let startY = 0
        let lastMove = 0
        let moved = 0
        let activeId = -1
        events.addEventListener(
            "pointerdown",
            (e: PointerEvent) => {
                if (e.pointerType === "mouse" || !cfg.animation.touch) return
                dragging = true
                activeId = e.pointerId
                lastX = startX = e.clientX
                lastY = startY = e.clientY
                lastMove = e.timeStamp
                moved = 0
                momentum = 0
                pool = 0
            },
            { signal }
        )
        events.addEventListener(
            "pointermove",
            (e: PointerEvent) => {
                const rect = events.getBoundingClientRect()
                pointer.x = e.clientX - rect.left
                pointer.y = e.clientY - rect.top
                if (e.pointerType === "mouse") pointer.inside = true
                if (!dragging || e.pointerId !== activeId) return
                const dx = e.clientX - lastX
                const dy = e.clientY - lastY
                lastX = e.clientX
                lastY = e.clientY
                const delta =
                    (mobile ? -dy : Math.abs(dx) >= Math.abs(dy) ? -dx : -dy) *
                    cfg.ribbon.scrollSensitivity
                target += delta
                moved = Math.hypot(e.clientX - startX, e.clientY - startY)
                const dtMs = Math.max(1, e.timeStamp - lastMove)
                lastMove = e.timeStamp
                momentum += (delta / (dtMs / 16.67) - momentum) * 0.4
            },
            { signal }
        )
        const endDrag = (e: PointerEvent): void => {
            if (e.pointerId !== activeId) return
            dragging = false
            activeId = -1
        }
        events.addEventListener("pointerup", endDrag, { signal })
        events.addEventListener("pointercancel", endDrag, { signal })
        events.addEventListener(
            "pointerleave",
            (e: PointerEvent) => {
                if (e.pointerType === "mouse") pointer.inside = false
            },
            { signal }
        )
        window.addEventListener(
            "keydown",
            (e: KeyboardEvent) => {
                if (!cfg.animation.keyboard || e.defaultPrevented) return
                if (e.ctrlKey || e.metaKey || e.altKey) return
                if (!isActive()) return
                const el = e.target as HTMLElement | null
                if (
                    el &&
                    (el.isContentEditable ||
                        /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
                )
                    return
                const page = ch * 0.9
                let d = 0
                switch (e.key) {
                    case "ArrowDown":
                    case "ArrowRight":
                        d = 100
                        break
                    case "ArrowUp":
                    case "ArrowLeft":
                        d = -100
                        break
                    case "PageDown":
                        d = page
                        break
                    case "PageUp":
                        d = -page
                        break
                    case " ":
                    case "Spacebar":
                        if (el && el.tagName === "BUTTON") return
                        d = e.shiftKey ? -page : page
                        break
                    default:
                        return
                }
                e.preventDefault()
                target += d * cfg.ribbon.scrollSensitivity
                momentum = 0
            },
            { signal }
        )
    }

    /* observers -------------------------------------------------------------------- */
    const resizeObserver =
        typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => {
                  if (disposed) return
                  layout()
                  requestRender()
              })
            : null
    if (resizeObserver) resizeObserver.observe(stage)

    const intersectionObserver =
        typeof IntersectionObserver !== "undefined"
            ? new IntersectionObserver((entries) => {
                  const entry = entries[entries.length - 1]
                  if (!entry) return
                  rootVisible = entry.isIntersecting
                  if (!rootVisible) pauseAllVideos()
              })
            : null
    if (intersectionObserver) intersectionObserver.observe(stage)

    document.addEventListener(
        "visibilitychange",
        () => {
            docHidden = document.hidden
            if (docHidden) pauseAllVideos()
        },
        { signal }
    )

    canvas.addEventListener(
        "webglcontextlost",
        (e: Event) => {
            e.preventDefault()
            if (!disposed) o.onContextLost()
        },
        { signal }
    )

    /* boot ------------------------------------------------------------------------- */
    layout()
    if (live) {
        attachInput()
        lastTime = performance.now()
        rafId = requestAnimationFrame(tick)
    }

    void (async () => {
        await Promise.race([
            Promise.all([ensureFont(), Promise.all(cardsRT.map(loadPoster))]),
            sleep(6000),
        ])
        if (disposed) return
        buildOverlays()
        startVideos()
        revealStart = performance.now()
        if (!live) {
            U.uOpacity.value = 1
            floorU.uOpacity.value = FLOOR_OPACITY
        }
        requestRender()
        o.onReady()
    })()

    return {
        configChanged(): void {
            if (disposed) return
            layout()
            const an = o.getConfig().animation
            cardsRT.forEach((c) => {
                if (c.video) c.video.playbackRate = an.videoSpeed
            })
            if (live && revealStart >= 0) {
                if (an.videoPreviews && !isReduced()) startVideos()
                else pauseAllVideos()
            }
            void ensureFont().then(() => {
                if (!disposed) scheduleOverlays(false)
            })
            requestRender()
        },
        dispose(): void {
            disposed = true
            cancelAnimationFrame(rafId)
            window.clearTimeout(overlayTimer)
            abort.abort()
            if (resizeObserver) resizeObserver.disconnect()
            if (intersectionObserver) intersectionObserver.disconnect()
            events.style.cursor = ""
            cardsRT.forEach((c) => {
                releaseVideo(c)
                if (c.posterOwn) c.posterOwn.dispose()
                if (c.overlayTex) c.overlayTex.dispose()
                c.mesh.material.dispose()
                scene.remove(c.mesh)
            })
            scene.remove(floor)
            geometry.dispose()
            floorGeometry.dispose()
            floorMaterial.dispose()
            reflectionTarget.dispose()
            fallbackPoster.dispose()
            blackVideo.dispose()
            emptyOverlay.dispose()
            colors.dispose()
            renderer.dispose()
            renderer.forceContextLoss()
            canvas.remove()
        },
    }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* React component                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const SR_ONLY: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

export default function RibbonHero(props: RibbonHeroProps) {
    const cfg = mergeConfig(props)
    const isStatic = useIsStaticRenderer()
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const mode: "none" | "still" | "live" = isStatic
        ? "none"
        : onCanvas && !cfg.advanced.animateOnCanvas
          ? "still"
          : "live"

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const cfgRef = useRef<Config>(cfg)
    cfgRef.current = cfg
    const engineRef = useRef<Engine | null>(null)
    const [ready, setReady] = useState(false)
    const [failed, setFailed] = useState(false)
    const [restart, setRestart] = useState(0)
    const [mobile, setMobile] = useState(false)

    const cards = cfg.cards.filter((c) => c.enabled)
    const cardsKey = JSON.stringify(cards)
    const settingsKey = JSON.stringify({ ...cfg, cards: null })
    const enabled = cfg.general.enabled

    // breakpoint tracking for the poster fallback layout
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const update = (): void =>
            setMobile(el.clientWidth <= cfgRef.current.general.breakpoint)
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [cfg.general.breakpoint])

    // create / destroy the WebGL scene (only when structure changes)
    useEffect(() => {
        const stage = stageRef.current
        const root = rootRef.current
        if (
            !stage ||
            !root ||
            mode === "none" ||
            !enabled ||
            cards.length === 0
        )
            return
        setReady(false)
        setFailed(false)
        const engine = createEngine({
            stage,
            events: root,
            cards,
            getConfig: () => cfgRef.current,
            live: mode === "live",
            onReady: () => setReady(true),
            onContextLost: () => setRestart((n) => n + 1),
        })
        if (!engine) {
            setFailed(true)
            return
        }
        engineRef.current = engine
        return () => {
            engine.dispose()
            engineRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardsKey, mode, enabled, cfg.advanced.antialias, restart])

    // apply visual / behavioural changes without rebuilding
    useEffect(() => {
        if (engineRef.current) engineRef.current.configChanged()
    }, [settingsKey])

    const fixed = cfg.general.fullViewport && !onCanvas
    const showFallback = mode === "none" || failed
    const showLoader =
        cfg.general.loader &&
        enabled &&
        mode !== "none" &&
        !ready &&
        !failed &&
        cards.length > 0

    const rootStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: cfg.general.background,
        touchAction: cfg.animation.touch ? "none" : "auto",
        WebkitUserSelect: "none",
        userSelect: "none",
        ...props.style,
        ...(fixed
            ? {
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 0,
              }
            : null),
    }

    const first = cards[0]
    const firstPoster = first
        ? (first.posterImage && first.posterImage.src) || first.poster
        : ""

    return (
        <div
            ref={rootRef}
            style={rootStyle}
            role="region"
            aria-label="Project ribbon"
        >
            <div ref={stageRef} style={{ position: "absolute", inset: 0 }} />

            {showFallback && firstPoster ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    <img
                        src={firstPoster}
                        alt={first ? first.title : ""}
                        style={{
                            width: mobile ? "calc(100% - 40px)" : "auto",
                            height: mobile ? "auto" : "43.5%",
                            maxWidth: "90%",
                            aspectRatio: String(first ? first.aspect : 1.6),
                            objectFit: "cover",
                            borderRadius: mobile
                                ? cfg.ribbon.mobileRadius
                                : cfg.ribbon.desktopRadius,
                        }}
                    />
                </div>
            ) : null}

            {showLoader ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        pointerEvents: "none",
                    }}
                    role="status"
                    aria-label="Loading"
                >
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            style={{
                                display: "block",
                                width: 14,
                                height: 2,
                                background: cfg.typography.color,
                            }}
                            initial={{ opacity: 0.2 }}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{
                                duration: 1.1,
                                repeat: Infinity,
                                delay: i * 0.16,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    )
}

RibbonHero.displayName = "Ribbon Hero"

/* ────────────────────────────────────────────────────────────────────────── */
/* Property controls                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

const numberControl = (
    title: string,
    defaultValue: number,
    min: number,
    max: number,
    step = 1,
    unit?: string
) => ({
    type: ControlType.Number as const,
    title,
    defaultValue,
    min,
    max,
    step,
    unit,
    displayStepper: true,
})
const boolControl = (title: string, defaultValue: boolean) => ({
    type: ControlType.Boolean as const,
    title,
    defaultValue,
    enabledTitle: "On",
    disabledTitle: "Off",
})
const colorControl = (title: string, defaultValue: string) => ({
    type: ControlType.Color as const,
    title,
    defaultValue,
})
const textControl = (title: string, defaultValue: string) => ({
    type: ControlType.String as const,
    title,
    defaultValue,
})
addPropertyControls(RibbonHero, {
    general: {
        type: ControlType.Object,
        title: "General",
        defaultValue: DEFAULTS.general,
        controls: {
            enabled: boolControl("Enabled", true),
            fullViewport: boolControl("Full Viewport", false),
            background: colorControl("Background", "#000000"),
            breakpoint: numberControl(
                "Mobile Breakpoint",
                649,
                300,
                1400,
                1,
                "px"
            ),
            loader: boolControl("Loader", true),
            floor: boolControl("Floor", true),
            reflections: boolControl("Reflections", true),
            reducedMotion: {
                type: ControlType.Enum,
                title: "Reduced Motion",
                options: ["system", "on", "off"],
                optionTitles: [
                    "Follow System",
                    "Always Reduce",
                    "Never Reduce",
                ],
                defaultValue: "system",
            },
        },
    },
    cards: {
        type: ControlType.Array,
        title: "Project Cards",
        defaultValue: DEFAULT_CARDS,
        control: {
            type: ControlType.Object,
            controls: {
                title: textControl("Title", "Project"),
                poster: textControl("Poster URL", ""),
                posterImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster Image",
                },
                video: textControl("Video URL", ""),
                videoFile: {
                    type: ControlType.File,
                    title: "Video File",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                aspect: numberControl("Aspect Ratio", 1.6, 0.5, 3, 0.001),
                enabled: boolControl("Visible", true),
            },
        },
    },
    ribbon: {
        type: ControlType.Object,
        title: "Ribbon",
        defaultValue: DEFAULTS.ribbon,
        controls: {
            desktopCardHeight: numberControl(
                "Card Height",
                43.5,
                15,
                90,
                0.5,
                "%"
            ),
            maxCardHeight: numberControl(
                "Max Card Height",
                550,
                150,
                1200,
                10,
                "px"
            ),
            mobileMargin: numberControl("Mobile Margin", 20, 0, 120, 1, "px"),
            desktopGap: numberControl("Desktop Gap", 10, 0, 200, 1, "px"),
            mobileGap: numberControl("Mobile Gap", 20, 0, 200, 1, "px"),
            desktopRadius: numberControl("Desktop Radius", 20, 0, 120, 1, "px"),
            mobileRadius: numberControl("Mobile Radius", 15, 0, 120, 1, "px"),
            initialX: numberControl(
                "Start Offset X",
                100,
                -2000,
                2000,
                10,
                "px"
            ),
            initialYPercent: numberControl(
                "Start Offset Y",
                -17.7,
                -100,
                100,
                0.1,
                "%"
            ),
            depth: numberControl("Ribbon Depth", 1, 0, 3, 0.05),
            curveIntensity: numberControl("Curve Intensity", 1, 0, 3, 0.05),
            curveShape: numberControl("Curve Shape", 1, 0, 1, 0.05),
            lean: numberControl("Lean", 1, -3, 3, 0.05),
            scrollSensitivity: numberControl(
                "Scroll Sensitivity",
                1,
                0.1,
                4,
                0.05
            ),
            scrollSmoothing: numberControl(
                "Scroll Smoothing",
                0.1,
                0.02,
                0.5,
                0.01
            ),
            velocityIntensity: numberControl(
                "Velocity Intensity",
                1,
                0,
                3,
                0.05
            ),
            maxDepthBoost: numberControl("Max Movement Depth", 1.6, 0, 4, 0.1),
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        defaultValue: DEFAULTS.animation,
        controls: {
            videoPreviews: boolControl("Video Previews", true),
            videoSpeed: numberControl("Video Speed", 1, 0.25, 3, 0.05, "x"),
            infinite: boolControl("Infinite Scroll", true),
            touch: boolControl("Touch", true),
            keyboard: boolControl("Keyboard", true),
            hover: boolControl("Hover", true),
            hoverIntensity: numberControl("Hover Intensity", 1, 0, 3, 0.05),
            cardFade: numberControl("Card Entrance", 0.6, 0.05, 3, 0.05, "s"),
            floorFade: numberControl("Floor Entrance", 0.8, 0.05, 3, 0.05, "s"),
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        defaultValue: DEFAULTS.typography,
        controls: {
            fontFamily: textControl("Font Family", "Inter Tight"),
            loadGoogleFont: boolControl("Load Google Font", true),
            desktopSize: numberControl("Desktop Size", 18, 8, 60, 1, "px"),
            mobileSize: numberControl("Mobile Size", 16, 8, 60, 1, "px"),
            weight: numberControl("Weight", 400, 100, 900, 100),
            letterSpacing: numberControl(
                "Letter Spacing",
                -0.05,
                -0.2,
                0.5,
                0.005,
                "em"
            ),
            color: colorControl("Color", "#ffffff"),
            insetXDesktop: numberControl(
                "Desktop Inset X",
                20,
                0,
                100,
                1,
                "px"
            ),
            insetXMobile: numberControl("Mobile Inset X", 10, 0, 100, 1, "px"),
            insetBottom: numberControl("Bottom Inset", 10, 0, 100, 1, "px"),
        },
    },
    cta: {
        type: ControlType.Object,
        title: "Card CTA",
        defaultValue: DEFAULTS.cta,
        controls: {
            show: boolControl("Show", true),
            background: colorControl("Background", "#000000"),
            iconColor: colorControl("Icon Color", "#ffffff"),
            size: numberControl("Size", 25, 12, 80, 1, "px"),
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["circle", "rounded", "square"],
                optionTitles: ["Circle", "Rounded", "Square"],
                defaultValue: "circle",
            },
            icon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["auto", "plus", "arrow"],
                optionTitles: ["Auto (Plus / Arrow)", "Plus", "Arrow"],
                defaultValue: "auto",
            },
        },
    },
    floor: {
        type: ControlType.Object,
        title: "Grid Floor",
        defaultValue: DEFAULTS.floor,
        controls: {
            gridVisible: boolControl("Grid", true),
            gridColor: colorControl("Grid Color", "#ffffff"),
            gridOpacity: numberControl("Grid Opacity", 0.08, 0, 1, 0.01),
            gridSpacing: numberControl("Grid Spacing", 0.2, 0.05, 1, 0.01),
            depth: numberControl("Floor Depth", 6, 1, 15, 0.5),
            reflectionIntensity: numberControl("Reflection", 0.5, 0, 2, 0.05),
            reflectionFade: numberControl("Reflection Fade", 0.5, 0, 4, 0.05),
            shadowIntensity: numberControl("Contact Shadow", 0.6, 0, 1, 0.05),
        },
    },
    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        defaultValue: DEFAULTS.advanced,
        controls: {
            pixelRatio: numberControl("Pixel Ratio", 2, 0.5, 2, 0.25),
            antialias: boolControl("Antialiasing", true),
            performance: {
                type: ControlType.Enum,
                title: "Performance",
                options: ["quality", "balanced", "performance"],
                optionTitles: ["Quality", "Balanced", "Performance"],
                defaultValue: "balanced",
            },
            preload: {
                type: ControlType.Enum,
                title: "Video Preload",
                options: ["lazy", "eager", "metadata"],
                optionTitles: ["When Visible", "Everything", "Metadata Only"],
                defaultValue: "lazy",
            },
            debug: {
                type: ControlType.Enum,
                title: "Shader Debug",
                options: ["off", "normals", "uv", "depth", "mask"],
                optionTitles: ["Off", "Normals", "UV", "Depth", "Mask"],
                defaultValue: "off",
            },
            animateOnCanvas: boolControl("Animate On Canvas", false),
        },
    },
})

RibbonHero.defaultProps = {
    general: DEFAULTS.general,
    cards: DEFAULT_CARDS,
    ribbon: DEFAULTS.ribbon,
    animation: DEFAULTS.animation,
    typography: DEFAULTS.typography,
    cta: DEFAULTS.cta,
    floor: DEFAULTS.floor,
    advanced: DEFAULTS.advanced,
}
