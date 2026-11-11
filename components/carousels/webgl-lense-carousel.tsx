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


/* ────────────────────────────────────────────────────────────────────────
   LiquidLensCarousel

   An endless media carousel seen through a glass lens. Each card can be
   an image (animated GIFs play) or a video, and each card can take its
   own size.

   The strip of cards is drawn into an offscreen texture, then a second
   pass bends it through a super-ellipse lens: the edges of the strip lift,
   twist or fall away, with a touch of colour dispersion where the bend is
   steepest.

   Drag, flick, scroll or use the arrow keys to move; the strip snaps card
   to card on a spring. Clicking the centred card zooms it into focus;
   clicking again (or Escape) releases it. Five entrance animations, five
   lens presets plus a fully custom lens, autoplay, and a caption with a
   rolling counter.

   Pure WebGL2 with no libraries: one program draws the rounded, cropped
   cards into a mipmapped render target, a second warps that target onto
   the screen. The loop only runs while something is moving or playing.

   ──────────────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────────
   GUIDE FOR EDITING THIS FILE (people and AI coding agents)

   This is a Framer code component: one file, one default export. Framer
   only allows imports from "react", "react-dom", "framer" and
   "framer-motion", so keep it self-contained (no npm packages, no CSS
   files, no other modules).

   ## Map, top to bottom
   1. Types ............ Props, ItemProp, EngineItem, LensProps, FontValue
   2. Defaults ......... SAMPLE_CARDS, BEND_PRESETS, DEFAULT_* objects
   3. Shaders .......... cardVertex / cardFragment (draws each card),
                         lensVertex / lensFragment (bend, colour split,
                         edge blur, tint)
   4. Helpers .......... colours, WebGL program/VAO setup, GIF decoder
   5. UI pieces ........ ArrowButtons, Digits (rolling counter), CSS string
   6. Component ........ LiquidLensCarousel()
        a. props → `settingsRef.current` (one flat settings object)
        b. one big effect = the engine: WebGL setup, card loading,
           physics, input handlers, render loop, cleanup
        c. JSX: canvas host, caption, arrows, cursor images, empty hint
   7. addPropertyControls ... the properties panel

   ## How a setting reaches the screen
   Property control → prop → merged with its DEFAULT_* object → copied
   into `settingsRef.current` in the effect without dependencies → read
   by the engine every frame as `s.<name>`. The engine is created once per
   mount and never restarts on prop changes (that would flash and reload
   every texture), so new settings must go through `settingsRef`, and
   the engine is woken with `engineRef.current.wake()`.

   ## Rules that keep it working
   - Keep existing control keys (items, preset, lens, cards, interaction,
     arrows, cursors, captions, edgeBlur, performance, intro). Renaming a
     key silently resets that setting on every placed instance.
   - Every control needs a default here and a `defaultValue` in the panel.
   - `useIsStaticRenderer()` is true on the Framer canvas, in export and
     thumbnails: draw a settled still frame there, with no intro, no
     autoplay and no input listeners.
   - Anything started in the engine effect (listeners, observers, timers,
     videos, GL objects) must be released in its cleanup function.
   - Textures are uploaded premultiplied and flipped (see `upload`);
     shaders output premultiplied colour.
   - Navigation modes are exclusive: Drag owns drag/wheel/side-card
     clicks, Arrows owns the buttons, Scroll owns page scroll. Gate new
     input on `nav()` / `dragAllowed()`.
   - Respect `prefers-reduced-motion` (`reducedMotion` in the engine).
   - Media must come from Framer-managed assets only. Pass every image,
     video, poster, icon or cursor URL through `framerAsset()` before it
     reaches an <img>, <video>, fetch() or texture, and never add a
     free-form URL field. This is a Framer Marketplace requirement.

   ## Common changes, where to make them
   - New lens preset: add an entry to BEND_PRESETS and to the `preset`
     control's options/optionTitles.
   - New intro animation: add a duration to INTRO_DURATION, a branch in
     `introEffects()` returning per-card { alpha, x, y, scale }, and an
     option in the `intro` control.
   - New card setting (e.g. a link per card): add it to ItemProp and
     EngineItem, map it in the `list` useMemo, add it to the `items`
     array control, then read it from `slots[i].item` in the engine.
   - New visual setting for all cards: add it to a DEFAULT_* object and
     the matching control, copy it into `settingsRef.current`, then use
     `s.<name>` in `frame()` or pass it as a shader uniform.
   - Shader change: uniforms are looked up by name automatically
     (`card.u.uName` / `lensProg.u.uName`); declare the uniform in GLSL
     and set it where the other uniforms of that pass are set.
   - Caption or arrow styling: the CSS string (classes start with lcc-)
     plus inline styles in the JSX.
   ──────────────────────────────────────────────────────────────────────── */

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}
interface ItemProp {
    type?: "image" | "video"
    image?: ImageValue
    video?: string
    poster?: ImageValue
    title?: string
    subtitle?: string
    sizeMode?: "auto" | "custom"
    width?: number
    height?: number
}

/* What the engine works with, one per card. */
interface EngineItem {
    kind: "image" | "gif" | "video"
    src: string
    poster: string
    alt: string
    title: string
    subtitle: string
    custom: { w: number; h: number } | null
    index: number
}
interface LensProps {
    width: number
    height: number
    tilt: number
    roundness: number
    bend: number
    reach: number
    curl: "twist" | "rise" | "fall"
    dispersion: number
    liquid: number
    followCursor: boolean
}
interface FontValue {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    fontSize?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
}
interface Props {
    style?: React.CSSProperties
    items: ItemProp[]
    preset: "liquid" | "ribbon" | "vortex" | "arch" | "custom"
    lens: LensProps
    intro: "rise" | "bloom" | "spin" | "deal" | "fade" | "none"
    cards: { height: number; gap: number; radius: number; fit: string; squeeze: number }
    interaction: {
        navigation: "drag" | "arrows" | "scroll"
        loop: boolean
        scrollRange: "viewport" | "section"
        focusOnClick: boolean
        captureWheel: boolean
        autoplay: boolean
        interval: number
    }
    cursors: {
        style: "system" | "custom"
        drag?: ImageValue
        dragging?: ImageValue
        open?: ImageValue
        close?: ImageValue
        size: number
    }
    arrows: {
        position: "sides" | "bottom"
        icon: "chevron" | "arrow" | "custom"
        prevIcon?: ImageValue
        nextIcon?: ImageValue
        iconSize: number
        size: number
        iconColor: string
        background: string
        radius: number
        offset: number
        gap: number
        blur: number
    }
    captions: {
        show: boolean
        counter: boolean
        color: string
        font: FontValue
        subtitleColor: string
        subtitleFont: FontValue
        counterColor: string
        counterFont: FontValue
        gap: number
        offset: number
    }
    performance: { quality: number }
    edgeBlur: { amount: number; start: number; range: number; curve: number; tint?: string; tintOpacity: number }
    onChange?: () => void
    onSelect?: () => void
}

/* Media is only ever loaded from Framer-managed assets: files uploaded to
   the project and served from framerusercontent.com over https. Anything
   else is dropped before a request is made, so a visitor's browser never
   contacts a host the component doesn't control. Every image, video,
   poster, icon and cursor source passes through this. */
const FRAMER_ASSET_HOST = "framerusercontent.com"
function framerAsset(src: string | undefined | null): string {
    if (!src || typeof src !== "string") return ""
    try {
        const url = new URL(src)
        if (url.protocol !== "https:") return ""
        const host = url.hostname.toLowerCase()
        return host === FRAMER_ASSET_HOST || host.endsWith("." + FRAMER_ASSET_HOST) ? url.href : ""
    } catch {
        return ""
    }
}

/* Shown only while the Cards list is empty, so a freshly inserted carousel
   looks finished. They disappear as soon as one card with an image is
   added. Replace or delete freely. */
const SAMPLE_IMAGE = (id: string) => "https://framerusercontent.com/images/" + id
const SAMPLE_CARDS: { src: string; alt: string; title: string }[] = [
    { src: SAMPLE_IMAGE("oK7QuUmAjNSQbnwsALWM94Gxnw.webp"), alt: "Sage green speaker with a perforated grille and two slider knobs", title: "Sage Sliders" },
    { src: SAMPLE_IMAGE("RghwsnyfmGaUcUyQjKnMuDnLRo.webp"), alt: "Side view of an aluminium headphone cup with USB-C port and headphone jack", title: "Port Side" },
    { src: SAMPLE_IMAGE("Mgq4tYdimYd1Aqmo3CE6cbf44.webp"), alt: "Close-up of a grey headphone ear cup with side buttons", title: "Quiet Grey" },
    { src: SAMPLE_IMAGE("Fml7R1VT8VoTLZZzdv0D4DrTEG8.webp"), alt: "Vintage Pioneer headphones hanging from a metal rail", title: "Pioneer Hang" },
    { src: SAMPLE_IMAGE("xHQrXyzRwT20DjrIozmpj2qCpWU.webp"), alt: "Blue and silver Sony Walkman cassette player", title: "Walkman Blue" },
    { src: SAMPLE_IMAGE("QLVZMnoP7FtKHCcVzVgkf4GEsPs.webp"), alt: "White record player with a grey platter, seen from above", title: "White Deck" },
    { src: SAMPLE_IMAGE("sau43WZg4dkpgUlaC45l0sl371c.webp"), alt: "Transparent headphones showing batteries and wiring inside", title: "Clear Circuit" },
]

const BEND_PRESETS: Record<string, Omit<LensProps, never>> = {
    liquid: { width: 0.74, height: 1.18, tilt: 62, roundness: 1, bend: 0.34, reach: 0.38, curl: "twist", dispersion: 0.45, liquid: 0, followCursor: false },
    ribbon: { width: 0.8, height: 0.8, tilt: 0, roundness: 1, bend: 0.34, reach: 0.34, curl: "twist", dispersion: 0.4, liquid: 0, followCursor: false },
    vortex: { width: 0.7, height: 0.95, tilt: 30, roundness: 1, bend: 0.46, reach: 0.3, curl: "twist", dispersion: 0.5, liquid: 0, followCursor: false },
    arch: { width: 0.8, height: 0.8, tilt: 0, roundness: 1, bend: 0.3, reach: 0.36, curl: "rise", dispersion: 0.4, liquid: 0, followCursor: false },
}
const DEFAULT_LENS = BEND_PRESETS.liquid
const DEFAULT_CARDS = { height: 50, gap: 12, radius: 0, fit: "natural", squeeze: 0.2 }
const DEFAULT_PERFORMANCE = { quality: 2 }
const DEFAULT_INTERACTION = {
    navigation: "drag" as const,
    loop: true,
    scrollRange: "viewport" as const,
    focusOnClick: true,
    captureWheel: true,
    autoplay: false,
    interval: 4,
}
const DEFAULT_CURSORS = { style: "system" as const, size: 64 }
const CURSOR_STATES = ["drag", "dragging", "open", "close"] as const
const DEFAULT_ARROWS = {
    position: "sides" as "sides" | "bottom",
    icon: "chevron" as "chevron" | "arrow" | "custom",
    prevIcon: undefined as ImageValue | undefined,
    nextIcon: undefined as ImageValue | undefined,
    iconSize: 45,
    size: 48,
    iconColor: "#FFFFFF",
    background: "rgba(255, 255, 255, 0.12)",
    radius: 100,
    offset: 24,
    gap: 12,
    blur: 12,
}
const DEFAULT_EDGE_BLUR = { amount: 10, start: 0, range: 100, curve: 1.5, tint: "", tintOpacity: 0.5 }
const DEFAULT_CAPTIONS = {
    show: true,
    counter: true,
    color: "#FFFFFF",
    font: {} as FontValue,
    subtitleColor: "rgba(255, 255, 255, 0.6)",
    subtitleFont: {} as FontValue,
    counterColor: "rgba(255, 255, 255, 0.6)",
    counterFont: {} as FontValue,
    gap: 6,
    offset: 18,
}

/* Font control value → inline text style, with fallbacks for unset fields. */
function fontStyle(f: FontValue | undefined, fallback: { size: number; weight: number; lineHeight: string }): React.CSSProperties {
    const v = f || {}
    return {
        fontFamily: v.fontFamily,
        fontWeight: v.fontWeight ?? fallback.weight,
        fontStyle: v.fontStyle,
        fontSize: v.fontSize ?? fallback.size,
        letterSpacing: v.letterSpacing,
        lineHeight: v.lineHeight ?? fallback.lineHeight,
    }
}

const FIT_ASPECT: Record<string, number> = { portrait: 0.75, square: 1, landscape: 4 / 3 }
const TAPS = 12
const PIXEL_BUDGET = 4.5e6
const INTRO_DURATION: Record<string, number> = { rise: 2.1, bloom: 1.6, spin: 2.2, deal: 1.5, fade: 0.35 }

const wrap = (value: number, size: number) => ((((value + size / 2) % size) + size) % size) - size / 2
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3)
const easeOutQuint = (v: number) => 1 - Math.pow(1 - clamp01(v), 5)
const easeInOut = (v: number) => {
    const t = clamp01(v)
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/* ── Shaders ───────────────────────────────────────────────────────────── */

const cardVertex = `#version 300 es
in vec2 position;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vLocal;
void main() {
  vLocal = vec2(position.x, -position.y) * uRect.zw;
  vec2 px = uRect.xy + vLocal;
  gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
}`

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
uniform vec4 uPlaceholder;
uniform float uZoom;
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
  scale /= uZoom;
  vec2 uv = vec2(local.x, 1.0 - local.y);
  uv = (uv - 0.5) * scale + 0.5;
  uv.x += uShift * (1.0 - scale.x) * 0.5;
  /* Textures are uploaded premultiplied, so transparent images stay clean. */
  vec4 tex = texture(tMap, uv);
  fragColor = mix(uPlaceholder, tex, uReady) * (mask * uAlpha);
}`

const lensVertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`

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
uniform float uBlur;
uniform float uBlurStart;
uniform float uBlurRange;
uniform float uBlurCurve;
uniform vec3 uTint;
uniform float uTintAmount;
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

  /* Edge blur amount, worked out first: where it fully covers a pixel,
     the colour split below would be blurred away, so it is skipped. */
  float bt = pow(clamp((edge - uBlurStart) / max(uBlurRange, 1.0), 0.0, 1.0), uBlurCurve) * uStrength;
  float br = uBlur * bt;

  vec2 spread = vec2(0.0, side * slope * uFlow * uStrength) / uResolution * uDispersion;
  float spreadPx = length(spread * texels);
  if (color.a > 0.002 && spreadPx > 0.25 && br < 2.0) {
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

  /* Edge blur: sharp inside the lens, building up past its edge. "edge" is
     the distance from the lens outline in px (negative inside). Each pixel
     gathers a spiral of samples from a pre-blurred mip level matched to the
     radius, so the ramp is smooth in one pass. */
  if (br > 0.35) {
    float lod = log2(max(1.0, br * uDpr * 0.5));
    vec4 acc = textureLod(tScene, shifted, lod);
    for (int i = 0; i < 16; i++) {
      float fi = float(i) + 0.5;
      float a = fi * 2.39996323;
      vec2 o = vec2(cos(a), sin(a)) * sqrt(fi / 16.0) * br / uResolution;
      acc += textureLod(tScene, shifted + o, lod);
    }
    color = mix(color, acc / 17.0, smoothstep(0.35, 2.0, br));
  }
  float ta = uTintAmount * bt;
  color = color * (1.0 - ta) + vec4(uTint * ta, ta);

  fragColor = color * uSceneAlpha;
}`

/* Framer colours can be hex, rgb(a) or var(--token, fallback); the alpha
   is folded into the tint amount. */
let colorCtx: CanvasRenderingContext2D | null = null
function toRgb3(input: string): number[] {
    if (typeof document === "undefined") return [0, 0, 0]
    let c = input.trim()
    const v = c.match(/^var\([^,]+,\s*(.+)\)$/)
    if (v) c = v[1].trim()
    if (!colorCtx) colorCtx = document.createElement("canvas").getContext("2d")
    if (!colorCtx) return [0, 0, 0]
    colorCtx.fillStyle = "#000"
    colorCtx.fillStyle = c
    const out = colorCtx.fillStyle as string
    if (out.startsWith("#")) {
        const n = parseInt(out.slice(1), 16)
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }
    const m = out.match(/[\d.]+/g)
    return m ? [+m[0] / 255, +m[1] / 255, +m[2] / 255] : [0, 0, 0]
}

function colorAlpha(input: string): number {
    const m = input.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/)
    return m && input.trim().startsWith("rgba") ? Math.max(0, Math.min(1, parseFloat(m[1]))) : 1
}

/* ── Minimal WebGL2 helpers (replacing ogl) ────────────────────────────── */

type GL = WebGL2RenderingContext
function makeProgram(gl: GL, vs: string, fs: string) {
    const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader compile failed")
        return s
    }
    const p = gl.createProgram()!
    const v = sh(gl.VERTEX_SHADER, vs)
    const f = sh(gl.FRAGMENT_SHADER, fs)
    gl.attachShader(p, v)
    gl.attachShader(p, f)
    gl.linkProgram(p)
    gl.deleteShader(v)
    gl.deleteShader(f)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "program link failed")
    const u: Record<string, WebGLUniformLocation | null> = {}
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(p, i)!
        u[info.name] = gl.getUniformLocation(p, info.name)
    }
    return { p, u }
}
function makeVao(gl: GL, prog: WebGLProgram, data: number[]) {
    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "position")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
    return { vao, buf }
}

/* ── Animated GIF decoding ─────────────────────────────────────────────
   WebGL only ever sees the first frame of an animated GIF, so GIFs are
   decoded here into fully composited RGBA frames and played back by the
   engine with each frame's own delay. */

interface GifData {
    width: number
    height: number
    frames: { data: Uint8ClampedArray; delay: number }[]
}

function lzwDecode(minCodeSize: number, data: Uint8Array, pixelCount: number): Uint8Array {
    const out = new Uint8Array(pixelCount)
    const clear = 1 << minCodeSize
    const eoi = clear + 1
    let codeSize = minCodeSize + 1
    let codeLimit = 1 << codeSize
    let next = eoi + 1
    const prefix = new Int16Array(4096)
    const suffix = new Uint8Array(4096)
    const stack = new Uint8Array(4097)
    for (let i = 0; i < clear; i++) { prefix[i] = -1; suffix[i] = i }
    let old = -1, first = 0, op = 0, bits = 0, datum = 0, dp = 0
    while (op < pixelCount) {
        while (bits < codeSize) {
            if (dp >= data.length) return out
            datum |= data[dp++] << bits
            bits += 8
        }
        let code = datum & (codeLimit - 1)
        datum >>= codeSize
        bits -= codeSize
        if (code === clear) {
            codeSize = minCodeSize + 1
            codeLimit = 1 << codeSize
            next = eoi + 1
            old = -1
            continue
        }
        if (code === eoi) break
        if (old === -1) {
            out[op++] = suffix[code]
            old = code
            first = code
            continue
        }
        const incoming = code
        let sp = 0
        if (code >= next) { stack[sp++] = first; code = old }
        while (code > eoi) { stack[sp++] = suffix[code]; code = prefix[code] }
        first = suffix[code]
        stack[sp++] = first
        if (next < 4096) {
            prefix[next] = old
            suffix[next] = first
            next++
            if (next === codeLimit && codeSize < 12) { codeSize++; codeLimit = 1 << codeSize }
        }
        old = incoming
        while (sp > 0 && op < pixelCount) out[op++] = stack[--sp]
    }
    return out
}

function decodeGif(buffer: ArrayBuffer): GifData | null {
    const b = new Uint8Array(buffer)
    if (b.length < 13 || b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) return null
    const W = b[6] | (b[7] << 8)
    const H = b[8] | (b[9] << 8)
    const flags = b[10]
    let p = 13
    let gct: Uint8Array | null = null
    if (flags & 0x80) {
        const n = 2 << (flags & 7)
        gct = b.subarray(p, p + n * 3)
        p += n * 3
    }
    const canvas = new Uint8ClampedArray(W * H * 4)
    const frames: GifData["frames"] = []
    let delay = 100, trans = -1, disposal = 0
    /* Keep memory sane: past ~60M pixels of frames, stop decoding. */
    const budget = 60e6
    while (p < b.length) {
        const code = b[p++]
        if (code === 0x3b) break
        if (code === 0x21) {
            const label = b[p++]
            if (label === 0xf9) {
                const size = b[p++]
                const pf = b[p]
                disposal = (pf >> 2) & 7
                const d = (b[p + 1] | (b[p + 2] << 8)) * 10
                delay = d < 20 ? 100 : d
                trans = pf & 1 ? b[p + 3] : -1
                p += size
                p++
            } else {
                while (p < b.length) { const sz = b[p++]; if (!sz) break; p += sz }
            }
            continue
        }
        if (code !== 0x2c) break
        const ix = b[p] | (b[p + 1] << 8), iy = b[p + 2] | (b[p + 3] << 8)
        const iw = b[p + 4] | (b[p + 5] << 8), ih = b[p + 6] | (b[p + 7] << 8)
        const f = b[p + 8]
        p += 9
        let ct = gct
        if (f & 0x80) {
            const n = 2 << (f & 7)
            ct = b.subarray(p, p + n * 3)
            p += n * 3
        }
        const interlaced = !!(f & 0x40)
        const minCode = b[p++]
        let len = 0
        for (let q = p; q < b.length; ) { const sz = b[q++]; if (!sz) break; len += sz; q += sz }
        const data = new Uint8Array(len)
        let o = 0
        while (p < b.length) { const sz = b[p++]; if (!sz) break; data.set(b.subarray(p, p + sz), o); o += sz; p += sz }
        if (!ct) continue
        const px = lzwDecode(minCode, data, iw * ih)
        const before = disposal === 3 ? canvas.slice() : null
        const rows: number[] = []
        if (interlaced) {
            for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let r = start; r < ih; r += step) rows.push(r)
        }
        for (let i = 0; i < iw * ih; i++) {
            const idx = px[i]
            if (idx === trans) continue
            const row = interlaced ? rows[(i / iw) | 0] : (i / iw) | 0
            const x = ix + (i % iw), y = iy + row
            if (x >= W || y >= H) continue
            const k = (y * W + x) * 4
            canvas[k] = ct[idx * 3]
            canvas[k + 1] = ct[idx * 3 + 1]
            canvas[k + 2] = ct[idx * 3 + 2]
            canvas[k + 3] = 255
        }
        frames.push({ data: canvas.slice(), delay })
        if (frames.length * W * H > budget) break
        if (disposal === 2) {
            for (let y = iy; y < Math.min(H, iy + ih); y++) canvas.fill(0, (y * W + ix) * 4, (y * W + Math.min(W, ix + iw)) * 4)
        } else if (disposal === 3 && before) {
            canvas.set(before)
        }
        trans = -1; disposal = 0; delay = 100
    }
    return frames.length ? { width: W, height: H, frames } : null
}

/* ── Arrow buttons ─────────────────────────────────────────────────────── */

function ArrowIcon({ kind, dir, size, color, prev, next }: { kind: string; dir: 1 | -1; size: number; color: string; prev?: ImageValue; next?: ImageValue }) {
    const prevSrc = framerAsset(prev?.src)
    const nextSrc = framerAsset(next?.src)
    if (kind === "custom" && (prevSrc || nextSrc)) {
        /* One uploaded icon is enough: the other side uses it mirrored. */
        const own = dir < 0 ? prevSrc : nextSrc
        const other = dir < 0 ? nextSrc : prevSrc
        const mirror = !own
        return (
            <img
                src={own || other}
                alt=""
                aria-hidden="true"
                draggable={false}
                style={{ width: size, height: size, objectFit: "contain", display: "block", transform: mirror ? "scaleX(-1)" : undefined }}
            />
        )
    }
    const d = kind === "arrow" ? "M5 12h14M13 6l6 6-6 6" : "M9 6l6 6-6 6"
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: dir < 0 ? "scaleX(-1)" : undefined, display: "block" }}
            aria-hidden="true"
        >
            <path d={d} />
        </svg>
    )
}

function ArrowButtons({
    style: a,
    prevDisabled,
    nextDisabled,
    onStep,
}: {
    style: typeof DEFAULT_ARROWS
    prevDisabled: boolean
    nextDisabled: boolean
    onStep: (delta: number) => void
}) {
    const button = (dir: 1 | -1, disabled: boolean) => (
        <button
            type="button"
            className="lcc-arrow"
            aria-label={dir < 0 ? "Previous" : "Next"}
            disabled={disabled}
            onClick={() => onStep(dir)}
            style={{
                width: a.size,
                height: a.size,
                borderRadius: Math.min(a.radius, a.size / 2),
                background: a.background,
                backdropFilter: a.blur ? `blur(${a.blur}px)` : undefined,
                WebkitBackdropFilter: a.blur ? `blur(${a.blur}px)` : undefined,
                ...(a.position === "sides"
                    ? { position: "absolute", top: "50%", marginTop: -a.size / 2, [dir < 0 ? "left" : "right"]: a.offset }
                    : {}),
            }}
        >
            <ArrowIcon
                kind={a.icon}
                dir={dir}
                size={Math.round((a.size * Math.max(10, Math.min(100, a.iconSize ?? 45))) / 100)}
                color={a.iconColor}
                prev={a.prevIcon}
                next={a.nextIcon}
            />
        </button>
    )
    if (a.position === "bottom") {
        return (
            <div className="lcc-arrows-row" style={{ bottom: a.offset, gap: a.gap }}>
                {button(-1, prevDisabled)}
                {button(1, nextDisabled)}
            </div>
        )
    }
    return (
        <>
            {button(-1, prevDisabled)}
            {button(1, nextDisabled)}
        </>
    )
}

/* ── Rolling digit counter ─────────────────────────────────────────────── */

function Digits({ value }: { value: number }) {
    return (
        <span className="lcc-digits">
            {String(value)
                .padStart(2, "0")
                .split("")
                .map((digit, index) => (
                    <span key={index} className="lcc-digit">
                        <span className="lcc-reel" style={{ transform: `translateY(${-Number(digit) * 10}%)` }}>
                            {"0123456789".split("").map((n) => (
                                <span key={n}>{n}</span>
                            ))}
                        </span>
                    </span>
                ))}
        </span>
    )
}

const CSS = `
.lcc-root { position: relative; overflow: hidden; isolation: isolate; outline: none; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; cursor: default; }
.lcc-root[data-cstate="drag"] { cursor: grab; }
.lcc-root[data-cstate="dragging"] { cursor: grabbing; }
.lcc-root[data-cstate="open"] { cursor: zoom-in; }
.lcc-root[data-cstate="close"] { cursor: zoom-out; }
.lcc-cursor { position: absolute; left: 0; top: 0; z-index: 3; pointer-events: none; will-change: transform; }
.lcc-cur { position: absolute; left: 0; top: 0; display: block; max-width: none; opacity: 0; transform: translate(-50%, -50%) scale(0.6); transition: opacity 0.15s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1); pointer-events: none; user-select: none; }
.lcc-root:focus-visible { box-shadow: inset 0 0 0 2px currentColor; }
.lcc-caption { position: absolute; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; pointer-events: none; text-align: center; }
.lcc-text { display: flex; flex-direction: column; align-items: center; animation: lcc-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
.lcc-title, .lcc-subtitle { display: block; }
.lcc-count { display: inline-flex; align-items: center; gap: 0.3em; font-variant-numeric: tabular-nums; transition: opacity 0.3s ease; }
.lcc-count[data-hidden] { opacity: 0; }
.lcc-digits { display: inline-flex; }
.lcc-digit { display: inline-block; height: 1.2em; line-height: 1.2em; overflow: hidden; }
.lcc-reel { display: flex; flex-direction: column; transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.lcc-reel > span { height: 1.2em; line-height: 1.2em; }
.lcc-arrow { z-index: 2; display: grid; place-items: center; padding: 0; border: none; cursor: pointer; transition: transform 0.2s ease, opacity 0.2s ease; -webkit-tap-highlight-color: transparent; }
.lcc-arrow:hover:not(:disabled) { transform: scale(1.06); }
.lcc-arrow:active:not(:disabled) { transform: scale(0.94); }
.lcc-arrow:disabled { opacity: 0.3; cursor: default; }
.lcc-arrow:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.lcc-arrows-row { position: absolute; left: 0; right: 0; z-index: 2; display: flex; justify-content: center; pointer-events: none; }
.lcc-arrows-row > .lcc-arrow { pointer-events: auto; }
.lcc-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes lcc-in { from { opacity: 0; transform: translateY(8px); filter: blur(4px); } to { opacity: 1; transform: none; filter: none; } }
@media (prefers-reduced-motion: reduce) { .lcc-text { animation: none; } .lcc-reel { transition: none; } }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 */
export default function LiquidLensCarousel(props: Props) {
    const { style, preset = "liquid", intro = "rise", onChange, onSelect } = props
    const cards = { ...DEFAULT_CARDS, ...(props.cards || {}) }
    const interaction = { ...DEFAULT_INTERACTION, ...(props.interaction || {}) }
    const arrows = { ...DEFAULT_ARROWS, ...(props.arrows || {}) }
    const captions = { ...DEFAULT_CAPTIONS, ...(props.captions || {}) }
    const lensProps = { ...DEFAULT_LENS, ...(props.lens || {}) }
    const edgeBlur = { ...DEFAULT_EDGE_BLUR, ...(props.edgeBlur || {}) }
    const performanceOpts = { ...DEFAULT_PERFORMANCE, ...(props.performance || {}) }

    const isStatic = useIsStaticRenderer()
    const cursors = { ...DEFAULT_CURSORS, ...(props.cursors || {}) }
    const instanceId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    /* Custom cursor images per state; a state without one keeps the system cursor. */
    const customCursors =
        cursors.style === "custom" && !isStatic
            ? CURSOR_STATES.map((st) => ({ state: st, src: framerAsset((cursors as any)[st]?.src) })).filter((c) => c.src)
            : []
    const cursorCss = customCursors
        .map(
            ({ state }) =>
                `.lcc-root[data-lcc-id="${instanceId}"][data-pointer="in"][data-cstate="${state}"]{cursor:none}` +
                `.lcc-root[data-lcc-id="${instanceId}"][data-pointer="in"][data-cstate="${state}"] .lcc-cur-${state}{opacity:1;transform:translate(-50%,-50%) scale(1)}`
        )
        .join("")
    const containerRef = React.useRef<HTMLDivElement>(null)
    const settingsRef = React.useRef<any>(null)
    const engineRef = React.useRef<any>(null)
    const callbacksRef = React.useRef({ onChange, onSelect })
    const [active, setActive] = React.useState(0)
    const [revealed, setRevealed] = React.useState(false)
    const [focusOpen, setFocusOpen] = React.useState(false)
    const [failed, setFailed] = React.useState(false)

    /* Framer items → engine items, one per usable card (an image or video
       must be set). With none, SAMPLE_CARDS stand in. */
    const items = props.items || []
    const itemsSig = JSON.stringify(items)
    const list: EngineItem[] = React.useMemo(() => {
        const out: (EngineItem & { orig: number })[] = []
        items.forEach((it, orig) => {
            if (!it) return
            const type = it.type || "image"
            const custom = it.sizeMode === "custom" ? { w: Math.max(20, it.width ?? 400), h: Math.max(20, it.height ?? 500) } : null
            const base = { title: it.title || "", subtitle: it.subtitle || "", custom, index: 0, poster: "", alt: "", orig }
            const imageSrc = framerAsset(it.image?.src)
            const videoSrc = framerAsset(it.video)
            if (type === "image" && imageSrc) {
                const src = imageSrc
                out.push({ ...base, kind: /\.gif($|[?#])/i.test(src) ? "gif" : "image", src, alt: it.image.alt || "" })
            } else if (type === "video" && videoSrc) {
                out.push({ ...base, kind: "video", src: videoSrc, poster: framerAsset(it.poster?.src) })
            }
        })
        const final = out.length
            ? out
            : SAMPLE_CARDS.map((d) => ({ ...d, kind: "image" as const, poster: "", subtitle: "", custom: null, index: 0, orig: -1 }))
        final.forEach((it, i) => (it.index = i))
        return final
    }, [itemsSig])
    const itemsRef = React.useRef(list)
    const itemsKey = list.map((it) => `${it.kind}:${it.src}:${it.custom ? it.custom.w + "x" + it.custom.h : "auto"}`).join("|")


    const lens = preset === "custom" ? lensProps : BEND_PRESETS[preset] || DEFAULT_LENS

    React.useEffect(() => {
        itemsRef.current = list
        callbacksRef.current = { onChange, onSelect }
        settingsRef.current = {
            /* Canvas and export draw the settled carousel, no intro. */
            intro: isStatic ? "none" : intro,
            cardHeight: Math.min(Math.max(cards.height / 100, 0.05), 1),
            gap: cards.gap,
            radius: cards.radius,
            fit: cards.fit,
            lensWidth: lens.width,
            lensHeight: lens.height,
            tilt: lens.tilt,
            roundness: lens.roundness,
            bend: lens.bend,
            reach: lens.reach,
            curl: lens.curl,
            dispersion: lens.dispersion,
            liquid: lens.liquid,
            followCursor: lens.followCursor,
            squeeze: cards.squeeze,
            focusOnClick: interaction.focusOnClick,
            autoplay: interaction.autoplay && !isStatic && interaction.navigation !== "scroll",
            interval: Math.max(1, interaction.interval),
            captureWheel: interaction.captureWheel,
            navigation: interaction.navigation,
            loop: interaction.loop !== false,
            scrollRange: interaction.scrollRange,
            quality: Math.max(0.5, Math.min(3, performanceOpts.quality)),
            blur: Math.max(0, edgeBlur.amount),
            blurStart: edgeBlur.start,
            blurRange: Math.max(1, edgeBlur.range),
            blurCurve: Math.max(0.2, edgeBlur.curve),
            tint: edgeBlur.tint ? toRgb3(edgeBlur.tint) : [0, 0, 0],
            tintAmount: edgeBlur.tint ? Math.max(0, Math.min(1, edgeBlur.tintOpacity)) * colorAlpha(edgeBlur.tint) : 0,
        }
        engineRef.current?.wake()
    })

    React.useEffect(() => {
        engineRef.current?.setItems(itemsRef.current)
    }, [itemsKey])

    React.useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const canvas = document.createElement("canvas")
        canvas.style.cssText = "display:block;width:100%;height:100%;position:absolute;inset:0"
        canvas.setAttribute("aria-hidden", "true")
        const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false }) as GL | null
        if (!gl) {
            setFailed(true)
            return
        }
        container.prepend(canvas)

        let card: ReturnType<typeof makeProgram>, lensProg: ReturnType<typeof makeProgram>
        try {
            card = makeProgram(gl, cardVertex, cardFragment)
            lensProg = makeProgram(gl, lensVertex, lensFragment)
        } catch {
            canvas.remove()
            setFailed(true)
            return
        }
        const quad = makeVao(gl, card.p, [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5])
        const tri = makeVao(gl, lensProg.p, [-1, -1, 3, -1, -1, 3])

        /* Offscreen target the cards are drawn into, mipmapped so the lens
           can sample it cleanly where it squeezes the image. */
        const targetTex = gl.createTexture()!
        const fbo = gl.createFramebuffer()!
        let targetW = 2, targetH = 2
        const setTargetSize = (w: number, h: number) => {
            targetW = w; targetH = h
            gl.bindTexture(gl.TEXTURE_2D, targetTex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTex, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        }
        setTargetSize(2, 2)

        const aniso = gl.getExtension("EXT_texture_filter_anisotropic")
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

        let dpr = 1
        let slots: any[] = []
        let width = 1
        let height = 1
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
        let captionHalf = -1
        let caught = false
        let cursorState = ""
        let sizedFor = 0
        const lensState = { x: 0, y: 0, vx: 0, vy: 0, ready: false }
        const pointer = { onButton: false, x: 0, y: 0, over: false, down: false, id: -1, startX: 0, startY: 0, startPos: 0, dragging: false, touch: false, samples: [] as { x: number; t: number }[] }
        const introState = { kind: "none", t: 0, running: false, done: false, readyAt: 0 }
        const focus = { index: -1, pending: -1, t: 0, v: 0, target: 0 }
        let instances: { index: number; x0: number; x1: number; y0: number; y1: number }[] = []

        /* ── Textures ── */
        const newTexture = () => {
            const t = gl.createTexture()!
            gl.bindTexture(gl.TEXTURE_2D, t)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
            return t
        }
        /* Uploads premultiplied and flipped. Returns false if the browser
           refuses the source. */
        /* Videos and GIFs replace their pixels every frame; when the size is
           unchanged the existing texture is overwritten in place instead of
           being reallocated. */
        const texSizes = new WeakMap<WebGLTexture, string>()
        const sourceSize = (src: any) =>
            src instanceof HTMLVideoElement
                ? `${src.videoWidth}x${src.videoHeight}`
                : src instanceof HTMLImageElement
                  ? `${src.naturalWidth}x${src.naturalHeight}`
                  : `${src.width}x${src.height}`
        const upload = (tex: WebGLTexture, source: TexImageSource, mipmap: boolean) => {
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
            const size = sourceSize(source)
            const inPlace = !mipmap && texSizes.get(tex) === size
            let ok = true
            try {
                if (inPlace) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source)
                else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
            } catch {
                ok = false
            }
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
            if (!ok) return false
            texSizes.set(tex, size)
            if (inPlace) return true
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            if (mipmap) {
                gl.generateMipmap(gl.TEXTURE_2D)
                if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8)
            }
            return true
        }
        /* Average colour, shown as the card's placeholder while it loads. */
        const averageColor = (source: CanvasImageSource): number[] => {
            try {
                const probe = document.createElement("canvas")
                probe.width = 8
                probe.height = 8
                const ctx = probe.getContext("2d", { willReadFrequently: true })
                if (!ctx) return [0.5, 0.5, 0.5, 1]
                ctx.drawImage(source, 0, 0, 8, 8)
                const data = ctx.getImageData(0, 0, 8, 8).data
                const avg = [0, 0, 0]
                for (let i = 0; i < data.length; i += 4) {
                    avg[0] += data[i]
                    avg[1] += data[i + 1]
                    avg[2] += data[i + 2]
                }
                return [...avg.map((v) => v / 64 / 255), 1]
            } catch {
                return [0.5, 0.5, 0.5, 1]
            }
        }
        const loadImage = (src: string) =>
            new Promise<HTMLImageElement>((res, rej) => {
                if (!framerAsset(src)) return rej(new Error("not a Framer asset"))
                const image = new Image()
                image.crossOrigin = "anonymous"
                image.decoding = "async"
                image.onload = () => res(image)
                image.onerror = () => rej(new Error("image failed"))
                image.src = src
            })

        /* ── Videos ── */
        const playAllowed = () => !isStatic && visible && !reducedMotion
        const makeVideo = (src: string) => {
            const v = document.createElement("video")
            v.crossOrigin = "anonymous"
            v.muted = true
            v.loop = true
            v.playsInline = true
            v.setAttribute("playsinline", "")
            v.preload = "auto"
            const sub: any = { el: v, tex: newTexture(), ready: false, failed: false, size: [16, 9], fresh: true, src, dead: false }
            v.addEventListener("loadedmetadata", () => {
                sub.size = [v.videoWidth || 16, v.videoHeight || 9]
                dirty = true
                start()
            })
            v.addEventListener("loadeddata", () => {
                if (sub.dead) return
                sub.size = [v.videoWidth || 16, v.videoHeight || 9]
                if (upload(sub.tex, v, false)) sub.ready = true
                else sub.failed = true
                dirty = true
                start()
                syncPlayback()
            })
            /* play() resolves later; wake the loop when frames start flowing. */
            v.addEventListener("playing", () => {
                dirty = true
                start()
            })
            v.addEventListener("error", () => {
                sub.failed = true
                dirty = true
                start()
            })
            /* Only re-upload when the video has actually painted a new frame. */
            const rvfc = (v as any).requestVideoFrameCallback?.bind(v)
            sub.hasRvfc = !!rvfc
            if (rvfc) {
                const tick = () => {
                    sub.fresh = true
                    if (!sub.dead) rvfc(tick)
                }
                rvfc(tick)
            }
            const safe = framerAsset(src)
            if (safe) v.src = safe
            else sub.failed = true
            sub.dispose = () => {
                sub.dead = true
                v.pause()
                v.removeAttribute("src")
                v.load()
                gl.deleteTexture(sub.tex)
            }
            return sub
        }
        /* Only videos on cards that are actually on screen play. */
        const syncPlayback = () => {
            const ok = playAllowed()
            for (const slot of slots) {
                const v = slot.video
                if (!v || !v.ready) continue
                const want = ok && slot.onScreen
                if (want && v.el.paused) v.el.play().catch(() => {})
                else if (!want && !v.el.paused) v.el.pause()
            }
        }

        const loadSlot = (item: EngineItem, index: number) => {
            const slot: any = {
                item,
                index,
                kind: item.kind,
                texture: newTexture(),
                aspect: 0.8,
                loaded: false,
                failed: false,
                ready: 0,
                color: [0.5, 0.5, 0.5, 1],
                image: [1, 1],
                video: null,
                gif: null,
                dead: false,
            }
            const settle = () => {
                dirty = true
                start()
            }
            const asImage = (src: string) =>
                loadImage(src)
                    .then((image) => {
                        if (slot.dead) return
                        if (!upload(slot.texture, image, true)) throw new Error("tainted")
                        slot.image = [image.naturalWidth || 1, image.naturalHeight || 1]
                        slot.aspect = slot.image[0] / slot.image[1]
                        slot.color = averageColor(image)
                        slot.loaded = true
                        settle()
                    })
                    .catch(() => {
                        if (slot.dead) return
                        slot.failed = true
                        settle()
                    })

            if (item.kind === "image") {
                asImage(item.src)
            } else if (item.kind === "gif") {
                ;(framerAsset(item.src) ? fetch(item.src, { mode: "cors" }) : Promise.reject())
                    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
                    .then((buf) => {
                        if (slot.dead) return
                        const gif = decodeGif(buf)
                        if (!gif) return asImage(item.src)
                        const first = new ImageData(gif.frames[0].data as any, gif.width, gif.height)
                        upload(slot.texture, first, false)
                        slot.gif = { ...gif, i: 0, acc: 0 }
                        slot.image = [gif.width, gif.height]
                        slot.aspect = gif.width / Math.max(1, gif.height)
                        const d = gif.frames[0].data
                        const mid = ((gif.height >> 1) * gif.width + (gif.width >> 1)) * 4
                        slot.color = [d[mid] / 255, d[mid + 1] / 255, d[mid + 2] / 255, 1]
                        slot.loaded = true
                        settle()
                    })
                    .catch(() => !slot.dead && asImage(item.src))
            } else if (item.kind === "video") {
                slot.video = makeVideo(item.src)
                if (item.poster) asImage(item.poster)
                /* Without a poster, the card counts as loaded on its first frame. */
                const poll = () => {
                    if (slot.dead) return
                    const v = slot.video
                    if (v.ready || v.failed) {
                        if (v.ready) {
                            slot.image = v.size
                            slot.aspect = v.size[0] / Math.max(1, v.size[1])
                            if (!item.poster) slot.color = [0.08, 0.08, 0.08, 1]
                            slot.loaded = true
                        } else if (!item.poster) slot.failed = true
                        settle()
                        return
                    }
                    setTimeout(poll, 120)
                }
                poll()
            }

            slot.dispose = () => {
                slot.dead = true
                gl.deleteTexture(slot.texture)
                slot.video?.dispose()
            }
            return slot
        }

        const setItems = (next: EngineItem[]) => {
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

        /* Card sizes: Custom cards keep their own pixel size; Auto cards take
           the shared height and their content's proportions (or the Shape
           setting). */
        const metrics = (s: any) => {
            const cardH = Math.max(24, s.cardHeight * height)
            const fixed = FIT_ASPECT[s.fit]
            const widths: number[] = []
            const heights: number[] = []
            for (const slot of slots) {
                const c = slot.item.custom
                if (c) {
                    widths.push(c.w)
                    heights.push(c.h)
                } else {
                    const aspect = fixed || slot.aspect
                    widths.push(aspect * cardH)
                    heights.push(cardH)
                }
            }
            const centers: number[] = []
            let cursor = 0
            for (let i = 0; i < widths.length; i++) {
                centers.push(cursor + widths[i] / 2)
                cursor += widths[i] + s.gap
            }
            return { cardH, widths, heights, centers, gap: s.gap, loop: Math.max(cursor, 1) }
        }

        /* Loop: the strip wraps forever. Off: it has two ends, and the
           first and last card can each come to rest in the centre. */
        const looping = () => settingsRef.current?.loop !== false
        const lo = (m: any) => m.centers[0] ?? 0
        const hi = (m: any) => m.centers[m.centers.length - 1] ?? 0
        const clampPos = (m: any, at: number) => (looping() ? at : Math.min(hi(m), Math.max(lo(m), at)))
        const nearest = (m: any, at: number) => {
            let best = 0
            let bestDist = Infinity
            const lp = looping()
            for (let i = 0; i < m.centers.length; i++) {
                const dist = Math.abs(lp ? wrap(m.centers[i] - at, m.loop) : m.centers[i] - at)
                if (dist < bestDist) {
                    bestDist = dist
                    best = i
                }
            }
            return best
        }
        const snapPoint = (m: any, at: number) => {
            const i = nearest(m, at)
            return looping() ? at + wrap(m.centers[i] - at, m.loop) : m.centers[i]
        }
        const remap = (from: any, to: any, at: number) => {
            const i = nearest(from, at)
            if (!looping()) return to.centers[i] + (at - from.centers[i]) * (to.widths[i] / from.widths[i])
            const offset = wrap(at - from.centers[i], from.loop)
            const cycles = Math.round((at - offset - from.centers[i]) / from.loop)
            return cycles * to.loop + to.centers[i] + offset * (to.widths[i] / from.widths[i])
        }
        const step = (m: any, delta: number) => {
            if (!looping()) {
                const i = Math.max(0, Math.min(m.centers.length - 1, nearest(m, goal) + delta))
                goal = m.centers[i]
                mode = "spring"
                dirty = true
                start()
                return
            }
            let at = snapPoint(m, goal)
            let index = nearest(m, at)
            const n = m.centers.length
            for (let k = 0; k < Math.abs(delta); k++) {
                const next = (index + (delta > 0 ? 1 : n - 1)) % n
                const distance = delta > 0 ? m.widths[index] / 2 + m.gap + m.widths[next] / 2 : -(m.widths[next] / 2 + m.gap + m.widths[index] / 2)
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
            goal = looping() ? goal + wrap(m.centers[i] - goal, m.loop) : m.centers[i]
            mode = "spring"
            dirty = true
            start()
        }
        let focusScrollY = 0
        const openFocus = (index: number) => {
            focusScrollY = window.scrollY
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
            const e: { sceneAlpha: number; strength: number; card: null | ((rel: number) => { alpha: number; x: number; y: number; scale: number }) } = { sceneAlpha: 1, strength: 1, card: null }
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
                    return { alpha: clamp01(local * 4), x: 0, y: (1 - easeOutQuint(local)) * height * 0.62, scale: 0.5 + 0.5 * easeInOut((local - 0.18) / 0.82) }
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

        /* Scroll mode: how far the page has scrolled through the carousel
           (Viewport) or through the tall section that holds a sticky
           carousel (Section), as 0..1. */
        let section: HTMLElement | null = null
        const findSection = () => {
            section = null
            const need = container.offsetHeight + window.innerHeight * 0.25
            for (let a = container.parentElement; a && a !== document.body; a = a.parentElement) {
                if (a.offsetHeight > need) {
                    section = a
                    break
                }
            }
        }
        const scrollProgress = (s: any) => {
            const vh = window.innerHeight || 1
            if (s.scrollRange === "section") {
                if (!section || !section.isConnected) findSection()
                if (section) {
                    const r = section.getBoundingClientRect()
                    return clamp01(-r.top / Math.max(1, r.height - vh))
                }
            }
            const r = container.getBoundingClientRect()
            /* 0 as the carousel's middle enters at the bottom, 1 as it leaves at the top. */
            return clamp01((vh - (r.top + r.height / 2)) / vh)
        }
        const onScroll = () => {
            if (settingsRef.current?.navigation !== "scroll") return
            if (focus.target > 0 && Math.abs(window.scrollY - focusScrollY) > 24) closeFocus()
            start()
        }

        const resize = () => {
            section = null
            width = Math.max(1, container.clientWidth)
            height = Math.max(1, container.clientHeight)
            const quality = settingsRef.current?.quality ?? 2
            dpr = Math.min(window.devicePixelRatio || 1, quality, Math.sqrt(PIXEL_BUDGET / (width * height)))
            sizedFor = quality
            canvas.width = Math.max(2, Math.round(width * dpr))
            canvas.height = Math.max(2, Math.round(height * dpr))
            setTargetSize(canvas.width, canvas.height)
            dirty = true
            start()
        }

        const frame = (now: number) => {
            raf = 0
            if (!alive) return
            const s = settingsRef.current
            const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
            last = now
            if (!s) {
                if (visible) raf = requestAnimationFrame(frame)
                return
            }
            if (!slots.length) {
                /* No cards: clear whatever was drawn and let the loop rest. */
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                gl.clearColor(0, 0, 0, 0)
                gl.clear(gl.COLOR_BUFFER_BIT)
                return
            }

            if (s.quality !== sizedFor) resize()
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
            const scrollMode = s.navigation === "scroll" && !isStatic
            if (scrollMode && introState.done && !pointer.dragging) {
                /* First card to last card across the scroll range. */
                const target = lo(m) + scrollProgress(s) * (hi(m) - lo(m))
                if (Math.abs(target - goal) > 0.05) {
                    goal = target
                    mode = "spring"
                }
            } else if (!looping() && !pointer.dragging) {
                goal = clampPos(m, goal)
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

            if (looping() && Math.abs(pos) > m.loop * 8) {
                const shift = Math.round(pos / m.loop) * m.loop
                pos -= shift
                goal -= shift
                pointer.startPos -= shift
            }

            const current = nearest(m, pos)
            /* The caption sits under the centred card, whatever its height. */
            const half = (m.heights[current] || m.cardH) / 2
            if (Math.abs(half - captionHalf) > 0.25) {
                captionHalf = half
                container.style.setProperty("--lcc-half", `${half.toFixed(1)}px`)
            }
            if (current !== activeIndex) {
                const first = activeIndex === -1
                activeIndex = current
                setActive(current)
                if (!first) callbacksRef.current.onChange?.()
            }

            if (focus.pending >= 0 && mode === "spring" && Math.abs(goal - pos) < 1.5 && Math.abs(vel) < 30) {
                if (current === focus.pending) openFocus(current)
                else focus.pending = -1
            }

            if (
                s.autoplay && s.navigation !== "scroll" && !reducedMotion && introState.done && focus.target === 0 && focus.t < 0.01 &&
                !pointer.over && !pointer.down && !hasFocus && mode === "spring" && Math.abs(goal - pos) < 1 &&
                now - interactedAt > 3000 && now - autoplayAt > s.interval * 1000
            ) {
                autoplayAt = now
                if (!looping() && nearest(m, goal) >= m.centers.length - 1) goTo(m, 0)
                else step(m, 1)
            }
            if (s.autoplay && !reducedMotion) animating = true

            const travel = Math.abs(pos - lastPos) / dt
            lastPos = pos
            const energyTarget = reducedMotion ? 0 : Math.min(travel / 2600, 1)
            energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? 0.07 : 0.35)))
            if (energy > 0.001) animating = true
            const liquidAmount = reducedMotion ? 0 : s.liquid
            const push = Math.max(-1, Math.min(1, vel / 2200))
            const deformStiffness = 120
            const deformDamping = 2 * Math.sqrt(deformStiffness) * 0.32
            deformVel += (deformStiffness * (push - deform) - deformDamping * deformVel) * dt
            deform += deformVel * dt
            if (Math.abs(deform) > 0.0005 || Math.abs(deformVel) > 0.005) animating = true

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
            const focusH = focus.index >= 0 && focus.index < n ? m.heights[focus.index] : m.cardH
            const focusScale = Math.max(1, Math.min(1.3, (height * 0.84) / focusH, (width * 0.92) / focusW))
            const nextLift = 1 + (focusScale - 1) * focusEase
            if (Math.abs(nextLift - lift) > 0.0005) {
                lift = nextLift
                container.style.setProperty("--lcc-lift", lift.toFixed(4))
            }

            const effects = introEffects()

            const homeX = width / 2
            const homeY = height / 2
            const follow = s.followCursor && pointer.over && !pointer.dragging && !pointer.touch && focus.target === 0
            const aimX = follow ? pointer.x : homeX
            const aimY = follow ? pointer.y : homeY
            if (!lensState.ready) {
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
            if (Math.abs(aimX - lensState.x) + Math.abs(aimY - lensState.y) > 0.2 || Math.abs(lensState.vx) + Math.abs(lensState.vy) > 0.5) animating = true

            let halfW = (s.lensWidth * width) / 2
            let halfH = (s.lensHeight * width) / 2
            const squash = Math.abs(deform) * liquidAmount
            halfW *= 1 + squash * 0.16
            halfH *= 1 - squash * 0.08
            const lensX = lensState.x - deform * 14 * liquidAmount

            const playing = playAllowed()
            for (let i = 0; i < n; i++) {
                const slot = slots[i]
                if (slot.loaded && slot.ready < 1) {
                    slot.ready = Math.min(1, slot.ready + dt / 0.45)
                    animating = true
                }
                /* GIFs: step through frames on their own delays. */
                const gif = slot.gif
                if (gif && playing && slot.onScreen && gif.frames.length > 1) {
                    gif.acc += dt * 1000
                    let moved = false
                    while (gif.acc >= gif.frames[gif.i].delay) {
                        gif.acc -= gif.frames[gif.i].delay
                        gif.i = (gif.i + 1) % gif.frames.length
                        moved = true
                    }
                    if (moved) upload(slot.texture, new ImageData(gif.frames[gif.i].data as any, gif.width, gif.height), false)
                    animating = true
                }
                /* Videos: copy each newly painted frame into its texture. */
                const v = slot.video
                if (v && slot.onScreen && v.ready && !v.el.paused) {
                    if (v.fresh || !v.hasRvfc) {
                        v.fresh = false
                        upload(v.tex, v.el, false)
                    }
                    animating = true
                }
            }

            const waiting = !introState.done
            if (dirty || animating || pointer.dragging) {
                dirty = false
                instances = []
                const shrink = 1 - clamp01(s.squeeze) * energy
                const draws: any[] = []
                for (let i = 0; i < n; i++) {
                    const w = m.widths[i]
                    const lp = looping()
                    const baseRel = lp ? wrap(m.centers[i] - pos, m.loop) : m.centers[i] - pos
                    for (let k = lp ? -3 : 0; k <= (lp ? 3 : 0); k++) {
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
                        draws.push({ i, rel, x, y: homeY + (fx ? fx.y : 0), cw, ch: m.heights[i] * scale, alpha, scale })
                    }
                }
                draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel))
                let screenChanged = false
                const seen = new Set(draws.map((d) => d.i))
                for (let i = 0; i < n; i++) {
                    const on = seen.has(i)
                    if (slots[i].onScreen !== on) {
                        slots[i].onScreen = on
                        screenChanged = true
                    }
                }
                if (screenChanged) syncPlayback()

                /* Pass 1: cards into the offscreen target. */
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
                gl.viewport(0, 0, targetW, targetH)
                gl.clearColor(0, 0, 0, 0)
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
                gl.useProgram(card.p)
                gl.bindVertexArray(quad.vao)
                const cu = card.u
                gl.uniform2f(cu.uResolution, width, height)
                gl.uniform1f(cu.uDpr, dpr)
                gl.uniform1i(cu.tMap, 0)
                gl.activeTexture(gl.TEXTURE0)
                const quadAt = (tex: WebGLTexture, cx: number, cy: number, w: number, h: number, img: number[], o: { alpha: number; ready: number; shift: number; zoom: number; radius: number; placeholder: number[] }) => {
                    gl.bindTexture(gl.TEXTURE_2D, tex)
                    gl.uniform4f(cu.uRect, cx, cy, w + 2, h + 2)
                    gl.uniform2f(cu.uSize, w, h)
                    gl.uniform2f(cu.uImage, img[0], img[1])
                    gl.uniform1f(cu.uAlpha, o.alpha)
                    gl.uniform1f(cu.uReady, o.ready)
                    gl.uniform1f(cu.uShift, o.shift)
                    gl.uniform1f(cu.uZoom, o.zoom)
                    gl.uniform1f(cu.uRadius, o.radius)
                    gl.uniform4f(cu.uPlaceholder, o.placeholder[0], o.placeholder[1], o.placeholder[2], o.placeholder[3])
                    gl.drawArrays(gl.TRIANGLES, 0, 6)
                }
                for (const d of draws) {
                    const slot = slots[d.i]
                    const live = slot.video && slot.video.ready
                    quadAt(live ? slot.video.tex : slot.texture, d.x, d.y, d.cw, d.ch, live ? slot.video.size : slot.image, {
                        alpha: d.alpha,
                        ready: live ? 1 : slot.ready,
                        shift: reducedMotion ? 0 : Math.max(-1, Math.min(1, d.rel / (width * 0.75))),
                        zoom: 1.08,
                        radius: s.radius,
                        placeholder: slot.color,
                    })
                    instances.push({ index: d.i, x0: d.x - d.cw / 2, x1: d.x + d.cw / 2, y0: d.y - d.ch / 2, y1: d.y + d.ch / 2 })
                }
                gl.disable(gl.BLEND)
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                gl.bindTexture(gl.TEXTURE_2D, targetTex)
                gl.generateMipmap(gl.TEXTURE_2D)

                /* Pass 2: bend the strip through the lens onto the screen. */
                gl.viewport(0, 0, canvas.width, canvas.height)
                gl.clearColor(0, 0, 0, 0)
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.useProgram(lensProg.p)
                gl.bindVertexArray(tri.vao)
                const lu = lensProg.u
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, targetTex)
                gl.uniform1i(lu.tScene, 0)
                gl.uniform2f(lu.uResolution, width, height)
                gl.uniform1f(lu.uDpr, dpr)
                gl.uniform2f(lu.uCenter, lensX, lensState.y)
                gl.uniform2f(lu.uHalf, Math.max(halfW, 1), Math.max(halfH, 1))
                gl.uniform1f(lu.uAngle, (s.tilt * Math.PI) / 180)
                gl.uniform1f(lu.uExponent, 2 + Math.pow(1 - clamp01(s.roundness), 1.5) * 10)
                const spanW = Math.max(halfW, 1)
                const spanH = Math.max(halfH, 1)
                const inner = Math.max(4, s.reach * (spanW + spanH) * 0.5)
                gl.uniform1f(lu.uInner, inner)
                gl.uniform1f(lu.uOuter, inner * 1.6)
                gl.uniform1f(lu.uFlow, s.bend * (spanW + spanH) * 0.45)
                gl.uniform1f(lu.uCurl, s.curl === "rise" ? 1 : s.curl === "fall" ? -1 : 0)
                gl.uniform1f(lu.uDispersion, s.dispersion * 0.12 * (1 + Math.abs(deform) * liquidAmount * 1.2))
                gl.uniform1f(lu.uStrength, effects.strength * (1 - focusEase))
                gl.uniform1f(lu.uSceneAlpha, effects.sceneAlpha)
                /* Blur is measured along the bend: 0% is where the bend begins
                   inside the lens, 100% is the lens outline. */
                gl.uniform1f(lu.uBlur, s.blur)
                gl.uniform1f(lu.uBlurStart, -inner + (s.blurStart / 100) * inner)
                gl.uniform1f(lu.uBlurRange, (s.blurRange / 100) * inner)
                gl.uniform1f(lu.uBlurCurve, s.blurCurve)
                gl.uniform3f(lu.uTint, s.tint[0], s.tint[1], s.tint[2])
                /* Tint alpha from the colour itself multiplies the opacity. */
                gl.uniform1f(lu.uTintAmount, s.tintAmount)
                gl.drawArrays(gl.TRIANGLES, 0, 3)
                gl.bindVertexArray(null)
            }

            /* Cursor state: open over a card that a click would focus (any card
               in Drag mode, only the centred one otherwise), close while a card
               is focused, drag / dragging in Drag mode, nothing over buttons. */
            let nextHover = ""
            if (pointer.over && !pointer.dragging && !pointer.onButton && introState.done && s.focusOnClick) {
                const hit = instances.find((inst) => pointer.x >= inst.x0 && pointer.x <= inst.x1 && pointer.y >= inst.y0 && pointer.y <= inst.y1)
                if (focus.target > 0) nextHover = "close"
                else if (hit && (s.navigation === "drag" || hit.index === activeIndex)) nextHover = "open"
            }
            const nextCursor = pointer.onButton
                ? "none"
                : pointer.dragging
                  ? "dragging"
                  : nextHover || (s.navigation === "drag" ? "drag" : "none")
            if (nextHover !== hover) {
                hover = nextHover
                if (hover) container.setAttribute("data-hover", hover)
                else container.removeAttribute("data-hover")
            }
            if (nextCursor !== cursorState) {
                cursorState = nextCursor
                container.setAttribute("data-cstate", cursorState)
            }

            if (visible && (animating || waiting || dirty || pointer.down)) raf = requestAnimationFrame(frame)
        }

        const start = () => {
            if (raf || !visible || !alive) return
            last = performance.now()
            raf = requestAnimationFrame(frame)
        }

        /* Each navigation mode owns its input:
           Drag   — drag/swipe, wheel (if captured), arrow keys, side-card clicks
           Arrows — the buttons and arrow keys only
           Scroll — the page scroll only
           Clicking the centred card to focus it works in all three. */
        const nav = () => settingsRef.current?.navigation || "drag"
        const dragAllowed = () => nav() === "drag"

        const localPoint = (e: PointerEvent | WheelEvent) => {
            const rect = container.getBoundingClientRect()
            return [e.clientX - rect.left, e.clientY - rect.top]
        }

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== undefined && e.button > 0) return
            /* Presses on the arrow buttons belong to the buttons, not the strip. */
            if ((e.target as Element | null)?.closest?.(".lcc-arrow")) return
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
            /* Drag mode: pressing on a moving strip catches it. */
            if (dragAllowed() && Math.abs(vel) > 40) {
                goal = pos
                vel = 0
                caught = true
            }
            dirty = true
            start()
        }

        const onPointerMove = (e: PointerEvent) => {
            const [x, y] = localPoint(e)
            pointer.x = x
            pointer.y = y
            pointer.over = true
            pointer.onButton = !!(e.target as Element | null)?.closest?.(".lcc-arrow")
            /* Custom cursor follows the mouse; touch has no cursor. Looked up
               each time, since it appears only once custom images are set. */
            const cursorEl = container.querySelector("[data-lcc-cursor]") as HTMLElement | null
            if (cursorEl) {
                if (e.pointerType === "mouse" || e.pointerType === "pen") {
                    cursorEl.style.transform = `translate3d(${x}px, ${y}px, 0)`
                    container.setAttribute("data-pointer", "in")
                } else container.removeAttribute("data-pointer")
            }
            if (pointer.down && e.pointerId === pointer.id) {
                const dx = x - pointer.startX
                const dy = y - pointer.startY
                const slop = pointer.touch ? 10 : 5
                if (!pointer.dragging) {
                    if (pointer.touch && Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx)) {
                        pointer.down = false
                        return
                    }
                    if (Math.abs(dx) > slop && dragAllowed()) {
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
                    if (!looping() && layout) {
                        /* Past an end the strip stretches instead of moving freely. */
                        const a = lo(layout), b = hi(layout)
                        if (pos < a) pos = a - (a - pos) * 0.35
                        else if (pos > b) pos = b + (pos - b) * 0.35
                    }
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
                const landing = snapPoint(m, clampPos(m, pos + velocity * 0.32))
                goal = landing
                if (Math.abs(velocity) > 400 && Math.abs(landing - pos) < 1) step(m, velocity > 0 ? 1 : -1)
                mode = "spring"
                start()
                return
            }
            /* A tap that only caught the strip lets it settle on a card. */
            if (caught) {
                caught = false
                goal = snapPoint(m, clampPos(m, pos))
                mode = "spring"
                start()
                return
            }
            if (closeFocus()) return
            const [x, y] = localPoint(e)
            const hit = instances.find((inst) => x >= inst.x0 && x <= inst.x1 && y >= inst.y0 && y <= inst.y1)
            if (!hit) return
            /* Scroll mode follows the page, so "settled" is looser there. */
            const settled = Math.abs(goal - pos) < (nav() === "scroll" ? 40 : 2)
            if (hit.index === activeIndex && settled) {
                callbacksRef.current.onSelect?.()
                if (s.focusOnClick) openFocus(hit.index)
            } else if (dragAllowed()) {
                /* Drag mode only: clicking a side card brings it to the centre. */
                const rel = (hit.x0 + hit.x1) / 2 - width / 2
                goal = snapPoint(m, clampPos(m, pos + rel))
                mode = "spring"
                if (s.focusOnClick) focus.pending = hit.index
                start()
            }
        }

        const onPointerLeave = () => {
            pointer.over = false
            pointer.onButton = false
            container.removeAttribute("data-pointer")
            dirty = true
            start()
        }

        const onPointerCancel = () => {
            pointer.down = false
            pointer.dragging = false
            caught = false
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
            if (s.navigation !== "drag") return
            if (!horizontal && !s.captureWheel) return
            e.preventDefault()
            skipIntro()
            interactedAt = performance.now()
            if (closeFocus()) return
            const delta = Math.max(-120, Math.min(120, (horizontal ? dx : dy) * unit))
            goal = clampPos(metrics(s), goal + delta * 1.25)
            mode = "wheel"
            wheelAt = performance.now()
            start()
        }

        const onKeyDown = (e: KeyboardEvent) => {
            const s = settingsRef.current
            if (!s) return
            /* Scroll mode: the page moves the strip, so only focus keys apply. */
            if (s.navigation === "scroll" && !["Escape", "Enter", " "].includes(e.key)) return
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

        const onFocus = () => { hasFocus = true }
        const onBlur = () => { hasFocus = false }
        const onVisibility = () => { if (!document.hidden) start() }
        const onLost = (e: Event) => { e.preventDefault(); setFailed(true) }
        canvas.addEventListener("webglcontextlost", onLost)

        /* No input on the Framer canvas or in export: just the settled frame. */
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
        const intersectionObserver = new IntersectionObserver(([entry]) => {
            visible = isStatic || entry.isIntersecting
            syncPlayback()
            start()
        })
        intersectionObserver.observe(container)

        engineRef.current = {
            wake: () => {
                dirty = true
                start()
            },
            /* Arrow buttons. */
            step: (delta: number) => {
                const s = settingsRef.current
                if (!s || !slots.length) return
                skipIntro()
                closeFocus()
                interactedAt = performance.now()
                step(metrics(s), delta)
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
            intersectionObserver.disconnect()
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
            canvas.removeEventListener("webglcontextlost", onLost)
            slots.forEach((slot) => slot.dispose())
            slots = []
            gl.deleteProgram(card.p)
            gl.deleteProgram(lensProg.p)
            gl.deleteBuffer(quad.buf)
            gl.deleteBuffer(tri.buf)
            gl.deleteVertexArray(quad.vao)
            gl.deleteVertexArray(tri.vao)
            gl.deleteTexture(targetTex)
            gl.deleteFramebuffer(fbo)
            gl.getExtension("WEBGL_lose_context")?.loseContext()
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
        }
    }, [isStatic])

    const current = list[active] || list[0]
    const label = current ? current.title || current.alt || `Image ${active + 1}` : ""
    const cardHalf = Math.min(Math.max(cards.height / 100, 0.05), 1) * 50

    return (
        <div
            ref={containerRef}
            className="lcc-root"
            style={
                {
                    width: 1200,
                    height: 700,
                    ...style,
                    "--lcc-half": `${cardHalf}%`,
                } as React.CSSProperties
            }
            data-nav={interaction.navigation}
            data-lcc-id={instanceId}
            role="region"
            aria-roledescription="carousel"
            aria-label="Image carousel"
            tabIndex={0}
        >
            <style>{CSS + cursorCss}</style>
            {customCursors.length > 0 && (
                <div data-lcc-cursor="" className="lcc-cursor" aria-hidden="true">
                    {customCursors.map(({ state, src }) => (
                        <img key={state} className={`lcc-cur lcc-cur-${state}`} src={src} alt="" draggable={false} style={{ width: cursors.size, height: "auto" }} />
                    ))}
                </div>
            )}
            {captions.show && current && (revealed || isStatic) && (
                <div
                    className="lcc-caption"
                    aria-hidden="true"
                    style={{
                        top: `calc(50% + var(--lcc-half) * var(--lcc-lift, 1) + ${captions.offset}px)`,
                        gap: captions.gap,
                    }}
                >
                    {(current.title || current.alt || current.subtitle) && (
                        <span key={active} className="lcc-text" style={{ gap: Math.max(0, captions.gap / 2) }}>
                            {(current.title || current.alt) && (
                                <span className="lcc-title" style={{ color: captions.color, ...fontStyle(captions.font, { size: 16, weight: 500, lineHeight: "1.3em" }) }}>
                                    {current.title || current.alt}
                                </span>
                            )}
                            {current.subtitle && (
                                <span className="lcc-subtitle" style={{ color: captions.subtitleColor, ...fontStyle(captions.subtitleFont, { size: 13, weight: 400, lineHeight: "1.4em" }) }}>
                                    {current.subtitle}
                                </span>
                            )}
                        </span>
                    )}
                    {captions.counter && (
                        <span
                            className="lcc-count"
                            data-hidden={focusOpen ? "" : undefined}
                            style={{ color: captions.counterColor, ...fontStyle(captions.counterFont, { size: 12, weight: 500, lineHeight: "1.2em" }) }}
                        >
                            <Digits value={active + 1} />
                            <span>/</span>
                            <span>{String(list.length).padStart(2, "0")}</span>
                        </span>
                    )}
                </div>
            )}
            {interaction.navigation === "arrows" && (
                <ArrowButtons
                    style={arrows}
                    prevDisabled={!interaction.loop && active <= 0}
                    nextDisabled={!interaction.loop && active >= list.length - 1}
                    onStep={(d) => engineRef.current?.step(d)}
                />
            )}
            <div className="lcc-live" aria-live="polite" aria-atomic="true">
                {`${label}, ${active + 1} of ${list.length}`}
            </div>
            {failed && (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: captions.color, opacity: 0.6, font: "13px system-ui" }}>
                    This carousel needs WebGL2.
                </div>
            )}
        </div>
    )
}

/* ── Controls: content, look of the lens, entrance, cards, behaviour,
      captions, events. ─────────────────────────────────────────────── */

const lensHidden = (p: any) => p.preset !== "custom"

addPropertyControls(LiquidLensCarousel, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum, title: "Type", options: ["image", "video"], optionTitles: ["Image", "Video"],
                    defaultValue: "image", displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage, title: "Image",
                    hidden: (p: any) => (p.type || "image") !== "image",
                    description: "Animated GIFs play. A video is far smaller and sharper than the same GIF.",
                },
                video: {
                    type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.type !== "video",
                    description: "Upload the video file to Framer. MP4 or WebM, short and compressed, works best.",
                },
                poster: {
                    type: ControlType.ResponsiveImage, title: "Poster",
                    hidden: (p: any) => p.type !== "video",
                },
                title: { type: ControlType.String, title: "Title", defaultValue: "" },
                subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "" },
                sizeMode: {
                    type: ControlType.Enum, title: "Size", options: ["auto", "custom"], optionTitles: ["Auto", "Custom"],
                    defaultValue: "auto", displaySegmentedControl: true,
                    description: "Auto uses the shared card height. Custom gives this card its own size.",
                },
                width: { type: ControlType.Number, title: "Width", defaultValue: 400, min: 20, max: 3000, step: 1, unit: "px", hidden: (p: any) => p.sizeMode !== "custom" },
                height: { type: ControlType.Number, title: "Height", defaultValue: 500, min: 20, max: 3000, step: 1, unit: "px", hidden: (p: any) => p.sizeMode !== "custom" },
            },
        },
        defaultValue: [],
        description: "Images (animated GIFs play) or videos, each with its own size if you like. While empty, sample cards are shown.",
    },
    preset: {
        type: ControlType.Enum,
        title: "Lens",
        options: ["liquid", "ribbon", "vortex", "arch", "custom"],
        optionTitles: ["Liquid", "Ribbon", "Vortex", "Arch", "Custom"],
        defaultValue: "liquid",
    },
    lens: {
        type: ControlType.Object,
        title: "Custom Lens",
        hidden: lensHidden,
        controls: {
            width: { type: ControlType.Number, title: "Width", defaultValue: DEFAULT_LENS.width, min: 0.1, max: 2, step: 0.01, description: "Share of the frame width." },
            height: { type: ControlType.Number, title: "Height", defaultValue: DEFAULT_LENS.height, min: 0.1, max: 2, step: 0.01 },
            tilt: { type: ControlType.Number, title: "Tilt", defaultValue: DEFAULT_LENS.tilt, min: -90, max: 90, step: 1, unit: "°" },
            roundness: { type: ControlType.Number, title: "Roundness", defaultValue: DEFAULT_LENS.roundness, min: 0, max: 1, step: 0.01, description: "1 is an ellipse, 0 a rounded rectangle." },
            bend: { type: ControlType.Number, title: "Bend", defaultValue: DEFAULT_LENS.bend, min: 0, max: 1, step: 0.01 },
            reach: { type: ControlType.Number, title: "Reach", defaultValue: DEFAULT_LENS.reach, min: 0.02, max: 1, step: 0.01, description: "How far inside the lens edge the bend starts." },
            curl: {
                type: ControlType.Enum, title: "Curl", options: ["twist", "rise", "fall"], optionTitles: ["Twist", "Rise", "Fall"],
                defaultValue: DEFAULT_LENS.curl, displaySegmentedControl: true,
                description: "Twist bends the sides opposite ways; Rise and Fall bend both the same way.",
            },
            dispersion: { type: ControlType.Number, title: "Dispersion", defaultValue: DEFAULT_LENS.dispersion, min: 0, max: 2, step: 0.01, description: "Colour split along the bend." },
            liquid: { type: ControlType.Number, title: "Liquid", defaultValue: DEFAULT_LENS.liquid, min: 0, max: 1, step: 0.01, description: "How much the lens wobbles with fast moves." },
            followCursor: { type: ControlType.Boolean, title: "Follow Cursor", defaultValue: DEFAULT_LENS.followCursor },
        },
    },
    edgeBlur: {
        type: ControlType.Object,
        title: "Edge Blur",
        controls: {
            amount: {
                type: ControlType.Number, title: "Blur", defaultValue: DEFAULT_EDGE_BLUR.amount, min: 0, max: 60, step: 0.5, unit: "px",
                description: "Strongest blur, reached at the far end of the ramp. 0 turns it off.",
            },
            start: {
                type: ControlType.Number, title: "Start", defaultValue: DEFAULT_EDGE_BLUR.start, min: -100, max: 200, step: 1, unit: "%",
                description: "Where the blur begins along the bend: 0% where the image starts to bend, 100% at the lens outline.",
                hidden: (p: any) => !p.amount && !p.tint,
            },
            range: {
                type: ControlType.Number, title: "Ramp", defaultValue: DEFAULT_EDGE_BLUR.range, min: 1, max: 300, step: 1, unit: "%",
                description: "Distance from sharp to full blur. 100% reaches full blur at the lens outline.",
                hidden: (p: any) => !p.amount && !p.tint,
            },
            curve: {
                type: ControlType.Number, title: "Falloff", defaultValue: DEFAULT_EDGE_BLUR.curve, min: 0.3, max: 4, step: 0.1,
                description: "1 builds evenly. Higher keeps more of the area near the lens sharp, then blurs quickly. Lower blurs sooner.",
                hidden: (p: any) => !p.amount && !p.tint,
            },
            tint: {
                type: ControlType.Color, title: "Tint", defaultValue: "rgba(0, 0, 0, 1)", optional: true,
                description: "Optional colour that fades in along with the blur.",
            },
            tintOpacity: {
                type: ControlType.Number, title: "Tint Opacity", defaultValue: 0.5, min: 0, max: 1, step: 0.01,
                hidden: (p: any) => !p.tint,
            },
        },
    },
    intro: {
        type: ControlType.Enum,
        title: "Intro",
        options: ["rise", "bloom", "spin", "deal", "fade", "none"],
        optionTitles: ["Rise", "Bloom", "Spin", "Deal", "Fade", "None"],
        defaultValue: "rise",
    },
    cards: {
        type: ControlType.Object,
        title: "Card Style",
        controls: {
            height: { type: ControlType.Number, title: "Height", defaultValue: DEFAULT_CARDS.height, min: 5, max: 100, step: 1, unit: "%", description: "Shared height of Auto-sized cards." },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: DEFAULT_CARDS.gap, min: 0, max: 200, step: 1, unit: "px" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: DEFAULT_CARDS.radius, min: 0, max: 200, step: 1, unit: "px" },
            fit: {
                type: ControlType.Enum, title: "Shape", options: ["natural", "portrait", "square", "landscape"],
                optionTitles: ["Natural", "Portrait", "Square", "Landscape"], defaultValue: DEFAULT_CARDS.fit,
                description: "For Auto-sized cards. Natural keeps each image's or video's own proportions.",
            },
            squeeze: { type: ControlType.Number, title: "Squeeze", defaultValue: DEFAULT_CARDS.squeeze, min: 0, max: 1, step: 0.01, description: "How much cards shrink while the strip is moving fast." },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Behaviour",
        controls: {
            navigation: {
                type: ControlType.Enum, title: "Navigate", options: ["drag", "arrows", "scroll"], optionTitles: ["Drag", "Arrows", "Scroll"],
                defaultValue: DEFAULT_INTERACTION.navigation, displaySegmentedControl: true,
                description: "Drag: drag, swipe and the wheel move the strip; clicking a side card centres it. Arrows: only the previous/next buttons move it. Scroll: only the page scroll moves it, first card to last. Arrow keys work in Drag and Arrows; clicking the centred card zooms it in every mode.",
            },
            loop: {
                type: ControlType.Boolean, title: "Loop", defaultValue: DEFAULT_INTERACTION.loop, enabledTitle: "Endless", disabledTitle: "Ends",
                description: "Ends stops at the first and last card, each of which can come to rest in the centre.",
            },
            scrollRange: {
                type: ControlType.Enum, title: "Scroll Over", options: ["viewport", "section"], optionTitles: ["Viewport", "Section"],
                defaultValue: DEFAULT_INTERACTION.scrollRange, displaySegmentedControl: true,
                hidden: (p: any) => p.navigation !== "scroll",
                description: "Viewport: plays out as the carousel crosses the screen. Section: for a sticky carousel inside a tall section, plays out across that section.",
            },
            focusOnClick: { type: ControlType.Boolean, title: "Click to Focus", defaultValue: DEFAULT_INTERACTION.focusOnClick },
            captureWheel: {
                type: ControlType.Boolean, title: "Scroll Wheel", defaultValue: DEFAULT_INTERACTION.captureWheel, enabledTitle: "Capture", disabledTitle: "Page",
                hidden: (p: any) => p.navigation === "scroll",
                description: "Capture turns vertical scrolling over the carousel into sliding. Page lets the page scroll and only uses sideways scrolling.",
            },
            autoplay: {
                type: ControlType.Boolean, title: "Autoplay", defaultValue: DEFAULT_INTERACTION.autoplay,
                hidden: (p: any) => p.navigation === "scroll",
            },
            interval: {
                type: ControlType.Number, title: "Interval", defaultValue: DEFAULT_INTERACTION.interval, min: 1, max: 20, step: 0.5, unit: "s",
                hidden: (p: any) => !p.autoplay || p.navigation === "scroll",
            },
        },
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        hidden: (p: any) => p.interaction?.navigation !== "arrows",
        controls: {
            position: {
                type: ControlType.Enum, title: "Position", options: ["sides", "bottom"], optionTitles: ["Sides", "Bottom"],
                defaultValue: DEFAULT_ARROWS.position, displaySegmentedControl: true,
            },
            icon: {
                type: ControlType.Enum, title: "Icon", options: ["chevron", "arrow", "custom"], optionTitles: ["Chevron", "Arrow", "Custom"],
                defaultValue: DEFAULT_ARROWS.icon, displaySegmentedControl: true,
            },
            prevIcon: {
                type: ControlType.ResponsiveImage, title: "Previous",
                hidden: (p: any) => p.icon !== "custom",
                description: "Upload one or both. With only one, the other button uses it mirrored. SVG or PNG with transparency works best.",
            },
            nextIcon: { type: ControlType.ResponsiveImage, title: "Next", hidden: (p: any) => p.icon !== "custom" },
            iconSize: { type: ControlType.Number, title: "Icon Size", defaultValue: DEFAULT_ARROWS.iconSize, min: 10, max: 100, step: 1, unit: "%", description: "Share of the button size." },
            size: { type: ControlType.Number, title: "Size", defaultValue: DEFAULT_ARROWS.size, min: 24, max: 120, step: 1, unit: "px" },
            iconColor: { type: ControlType.Color, title: "Icon Color", defaultValue: DEFAULT_ARROWS.iconColor, hidden: (p: any) => p.icon === "custom" },
            background: { type: ControlType.Color, title: "Fill", defaultValue: DEFAULT_ARROWS.background },
            blur: { type: ControlType.Number, title: "Glass Blur", defaultValue: DEFAULT_ARROWS.blur, min: 0, max: 40, step: 1, unit: "px" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: DEFAULT_ARROWS.radius, min: 0, max: 100, step: 1, unit: "px" },
            offset: {
                type: ControlType.Number, title: "Inset", defaultValue: DEFAULT_ARROWS.offset, min: 0, max: 300, step: 1, unit: "px",
                description: "Distance from the side edges, or from the bottom.",
            },
            gap: {
                type: ControlType.Number, title: "Gap", defaultValue: DEFAULT_ARROWS.gap, min: 0, max: 200, step: 1, unit: "px",
                hidden: (p: any) => p.position !== "bottom",
            },
        },
    },
    cursors: {
        type: ControlType.Object,
        title: "Cursor",
        controls: {
            style: {
                type: ControlType.Enum, title: "Style", options: ["system", "custom"], optionTitles: ["System", "Custom"],
                defaultValue: DEFAULT_CURSORS.style, displaySegmentedControl: true,
                description: "System uses grab, zoom-in and zoom-out. Custom shows your images and follows the mouse; any state left empty keeps the system cursor.",
            },
            open: {
                type: ControlType.ResponsiveImage, title: "Open",
                hidden: (p: any) => p.style !== "custom",
                description: "Over a card that a click opens into the close view.",
            },
            close: {
                type: ControlType.ResponsiveImage, title: "Close",
                hidden: (p: any) => p.style !== "custom",
                description: "While a card is open; a click zooms back out to the carousel.",
            },
            drag: {
                type: ControlType.ResponsiveImage, title: "Drag",
                hidden: (p: any) => p.style !== "custom",
                description: "Drag mode only: over the strip, ready to drag.",
            },
            dragging: {
                type: ControlType.ResponsiveImage, title: "Dragging",
                hidden: (p: any) => p.style !== "custom",
                description: "Drag mode only: while dragging.",
            },
            size: {
                type: ControlType.Number, title: "Size", defaultValue: DEFAULT_CURSORS.size, min: 12, max: 240, step: 1, unit: "px",
                hidden: (p: any) => p.style !== "custom",
            },
        },
    },
    performance: {
        type: ControlType.Object,
        title: "Performance",
        controls: {
            quality: {
                type: ControlType.Number, title: "Quality", defaultValue: DEFAULT_PERFORMANCE.quality, min: 0.5, max: 3, step: 0.25,
                description: "Highest pixel ratio the carousel draws at. Lower it for large heroes or slower devices; 1 is half the work of 2 on retina screens.",
            },
        },
    },
    captions: {
        type: ControlType.Object,
        title: "Caption",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_CAPTIONS.show },
            counter: { type: ControlType.Boolean, title: "Numbers", defaultValue: DEFAULT_CAPTIONS.counter, hidden: (p: any) => !p.show, description: "The card count, like 03 / 07." },
            font: {
                type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif",
                displayTextAlignment: false,
                defaultValue: { fontSize: "16px", variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.3em" },
                hidden: (p: any) => !p.show,
            },
            color: { type: ControlType.Color, title: "Title Color", defaultValue: DEFAULT_CAPTIONS.color, hidden: (p: any) => !p.show },
            subtitleFont: {
                type: ControlType.Font, title: "Subtitle Font", controls: "extended", defaultFontType: "sans-serif",
                displayTextAlignment: false,
                defaultValue: { fontSize: "13px", variant: "Regular", letterSpacing: "0em", lineHeight: "1.4em" },
                hidden: (p: any) => !p.show,
            },
            subtitleColor: { type: ControlType.Color, title: "Subtitle Color", defaultValue: DEFAULT_CAPTIONS.subtitleColor, hidden: (p: any) => !p.show },
            counterFont: {
                type: ControlType.Font, title: "Counter Font", controls: "extended", defaultFontType: "sans-serif",
                displayTextAlignment: false,
                defaultValue: { fontSize: "12px", variant: "Medium", letterSpacing: "0.02em", lineHeight: "1.2em" },
                hidden: (p: any) => !p.show || !p.counter,
            },
            counterColor: { type: ControlType.Color, title: "Counter Color", defaultValue: DEFAULT_CAPTIONS.counterColor, hidden: (p: any) => !p.show || !p.counter },
            gap: { type: ControlType.Number, title: "Spacing", defaultValue: DEFAULT_CAPTIONS.gap, min: 0, max: 60, step: 1, unit: "px", hidden: (p: any) => !p.show, description: "Space between title, subtitle and counter." },
            offset: { type: ControlType.Number, title: "Offset", defaultValue: DEFAULT_CAPTIONS.offset, min: -200, max: 200, step: 1, unit: "px", hidden: (p: any) => !p.show, description: "Distance below the cards." },
        },
    },
    onChange: { type: ControlType.EventHandler, title: "On Change" },
    onSelect: { type: ControlType.EventHandler, title: "On Select" },
})
