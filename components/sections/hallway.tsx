// Hallway: a hero you walk through. Scrolling carries the camera down a quiet hallway lit only by the daylight in a
// doorway at its end; the cards hang on both walls and come into focus one after the other. At the end the camera
// passes through the doorway, which has the thickness of a real wall, into the picture outside, and the closing text
// appears. Live it draws the room with WebGL 2 while something moves; on the server, in the static export and where
// WebGL is missing it shows a calm still of the start. Made by KOJA Studios.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { Children, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"

// ------------------------------------------------------------------ values

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const sstep = (a: number, b: number, v: number) => {
    const t = clamp((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const round2 = (v: number) => Math.round(v * 100) / 100

/** The look of the room (night): plaster, stone floor, ceiling, haze and the daylight in the doorway (sRGB). */
const ROOM = { wall: "#5B544C", floor: "#3F3A34", ceil: "#4D4740", haze: "#0E0C0A", light: "#FFF0DA", amb: 0.007, rad: 10, ex: 1.8, lit: 0.58, density: 0.00016, gloss: 0.45, refl: 0.3, ao: 0.3, flash: 0.22 }
/** The speed dips by this share at each card and rises by it between them. */
const DIP = 0.15
/** The hallway is never shorter than three cards, so the doorway starts far away and soft. */
const MIN_HALL = 3
/** Heights of the cards in focus, as shares of the stage height (desktop) and around the middle (phone). */
const ROW_D = [0.02, -0.07, 0.06, -0.03, 0.08, -0.05, 0, 0.05, -0.08, 0.03]
const ROW_P = [0, 0.02, -0.015, 0.025, -0.01, 0.015]
/** Cards are laid out at their largest size and only scaled down, so they stay sharp at the reading place. */
const L = 1.6
const MAX_CARDS = 12
const LOAD_MS = 8000
/** A touch screen takes the outside picture at most this wide (device pixels): wider files stalled the arrival. */
const TOUCH_MAX_PX = 5760
const DEFAULT_SHADOW = "0px 30px 60px -28px rgba(0,0,0,0.7)"
const INK = "#ECE8E1"
const ENDING_INK = "#F5F1EA"
const ENDING_ON_LIGHT = "#1A1815"

// ------------------------------------------------------------------ types

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}
interface FontValue {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    fontSize?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
}
interface CardProps {
    image?: ImageValue
    title?: string
    meta?: string
    link?: string
    /** 0: a picture card; 1 and up: the frame from the Frames slot shown as this card */
    frame?: number
}
interface IntroProps {
    heading?: string
    text?: string
    label1?: string
    link1?: string
    label2?: string
    link2?: string
}
interface EndingProps {
    image?: ImageValue
    title?: string
    text?: string
    label?: string
    link?: string
    /** where the picture is looked at, across: -20 to 20 % (upright stages only) */
    shift?: number
}
interface MotionProps {
    focus?: number
    parallax?: number
    canvas?: "start" | "end"
}
interface LayoutProps {
    spread?: number
    tilt?: number
}
interface FontsProps {
    heading?: FontValue
    text?: FontValue
}
interface ColorsProps {
    intro?: string
    captions?: string
    light?: string
    ending?: string
}
interface StyleProps {
    radius?: string
    shadow?: string
}
interface Props {
    cards?: CardProps[]
    frames?: ReactNode
    onArrive?: () => void
    onCardClick?: () => void
    intro?: IntroProps
    ending?: EndingProps
    motion?: MotionProps
    layout?: LayoutProps
    fonts?: FontsProps
    colors?: ColorsProps
    styling?: StyleProps
    /** Framer's layout for the instance (size, position); it goes to the root unchanged (FP-7) */
    style?: CSSProperties
}

// ------------------------------------------------------------------ demo

/**
 * What a new instance shows. The pictures live in Framer's storage; a card shows its demo picture only while it has
 * no picture of its own and still carries the demo title at the same place (so editing a card never mixes content).
 */
const DEMO_CARDS: { title: string; meta: string; image: ImageValue }[] = [
    { title: "Hillside Cabin", meta: "Shelter, 2019", image: { src: "https://framerusercontent.com/images/E9PA1xibkYJU0dxgayYXMLenaHg.jpg", srcSet: "https://framerusercontent.com/images/E9PA1xibkYJU0dxgayYXMLenaHg.jpg?scale-down-to=512 410w, https://framerusercontent.com/images/E9PA1xibkYJU0dxgayYXMLenaHg.jpg?scale-down-to=1024 819w, https://framerusercontent.com/images/E9PA1xibkYJU0dxgayYXMLenaHg.jpg 1600w", alt: "" } },
    { title: "Village School", meta: "School, 2021", image: { src: "https://framerusercontent.com/images/7VeMb5JsfSs2BIjaXTiyYM1AwU.jpg", srcSet: "https://framerusercontent.com/images/7VeMb5JsfSs2BIjaXTiyYM1AwU.jpg?scale-down-to=512 410w, https://framerusercontent.com/images/7VeMb5JsfSs2BIjaXTiyYM1AwU.jpg?scale-down-to=1024 819w, https://framerusercontent.com/images/7VeMb5JsfSs2BIjaXTiyYM1AwU.jpg 1600w", alt: "" } },
    { title: "Reading Room", meta: "Library, 2022", image: { src: "https://framerusercontent.com/images/fuufQbad9sAUUhW6dqGCwJRX0o.jpg", srcSet: "https://framerusercontent.com/images/fuufQbad9sAUUhW6dqGCwJRX0o.jpg?scale-down-to=512 410w, https://framerusercontent.com/images/fuufQbad9sAUUhW6dqGCwJRX0o.jpg?scale-down-to=1024 819w, https://framerusercontent.com/images/fuufQbad9sAUUhW6dqGCwJRX0o.jpg 1600w", alt: "" } },
    { title: "Stone Hut", meta: "Shelter, 2023", image: { src: "https://framerusercontent.com/images/4JgfBFH1bNMyNFzxSoswQgmToeY.jpg", srcSet: "https://framerusercontent.com/images/4JgfBFH1bNMyNFzxSoswQgmToeY.jpg?scale-down-to=512 410w, https://framerusercontent.com/images/4JgfBFH1bNMyNFzxSoswQgmToeY.jpg?scale-down-to=1024 819w, https://framerusercontent.com/images/4JgfBFH1bNMyNFzxSoswQgmToeY.jpg 1600w", alt: "" } },
    { title: "Light Study", meta: "Interior, 2024", image: { src: "https://framerusercontent.com/images/e2hwnuhLh585kjHAIPx5ImHf7A.jpg", srcSet: "https://framerusercontent.com/images/e2hwnuhLh585kjHAIPx5ImHf7A.jpg?scale-down-to=512 410w, https://framerusercontent.com/images/e2hwnuhLh585kjHAIPx5ImHf7A.jpg?scale-down-to=1024 819w, https://framerusercontent.com/images/e2hwnuhLh585kjHAIPx5ImHf7A.jpg 1600w", alt: "" } },
    { title: "Coast Path", meta: "Site visit, 2026", image: { src: "https://framerusercontent.com/images/ksoYRefX4JrSEdqHNIlJidbHIZA.jpg", srcSet: "https://framerusercontent.com/images/ksoYRefX4JrSEdqHNIlJidbHIZA.jpg?scale-down-to=512 410w, https://framerusercontent.com/images/ksoYRefX4JrSEdqHNIlJidbHIZA.jpg?scale-down-to=1024 819w, https://framerusercontent.com/images/ksoYRefX4JrSEdqHNIlJidbHIZA.jpg 1600w", alt: "" } },
]
/** The demo list as the panel starts it (titles and metas; the pictures come from DEMO_CARDS by position). */
const DEMO_CARD_LIST: CardProps[] = DEMO_CARDS.map((d) => ({ title: d.title, meta: d.meta }))
const DEMO_ENDING = {
    title: "Kalsoy, Faroe Islands",
    text: "Our next shelter stands above the cliffs, at the end of the old sheep path. Building starts after the spring storms in 2027.",
    label: "Read about the shelter",
    // Framer's image service: 512 to 4096 and 5760 as steps (checked 28.10.2026, O11), the original is 7573 wide
    image: { src: "https://framerusercontent.com/images/S1dCPBNiiUjyDNSdEzAC7sFBc.jpg", srcSet: "https://framerusercontent.com/images/S1dCPBNiiUjyDNSdEzAC7sFBc.jpg?scale-down-to=512 512w, https://framerusercontent.com/images/S1dCPBNiiUjyDNSdEzAC7sFBc.jpg?scale-down-to=1024 1024w, https://framerusercontent.com/images/S1dCPBNiiUjyDNSdEzAC7sFBc.jpg?scale-down-to=2048 2048w, https://framerusercontent.com/images/S1dCPBNiiUjyDNSdEzAC7sFBc.jpg?scale-down-to=4096 4096w, https://framerusercontent.com/images/S1dCPBNiiUjyDNSdEzAC7sFBc.jpg?scale-down-to=5760 5760w, https://framerusercontent.com/images/S1dCPBNiiUjyDNSdEzAC7sFBc.jpg 7573w", alt: "Green ridge with a small lighthouse above a sheer sea cliff in the Faroe Islands" } as ImageValue,
    // upright screens see a narrow strip: the demo picture is looked at 15 % further left, added to Shift, so the
    // lighthouse and the ridge up to the cliff edge stand in it (round 10); pictures of the buyer start centred
    shift: -15,
}
const DEMO_INTRO: Required<IntroProps> = {
    heading: "Schools and shelters at the end of the road.",
    text: "Fourteen architects in Copenhagen. We build in the mountains and on the coasts of the North, and stay until the doors open.",
    label1: "Selected work",
    link1: "",
    label2: "Start a project",
    link2: "",
}

/** useLayoutEffect in the browser (the engine is ready before the first paint), useEffect on the server, where it does nothing. */
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

// ------------------------------------------------------------------ files (FP-4, FP-5, FP-12)

type LoadKind = "blocked" | "timeout" | "broken" | "unexpected"
/** Framer's storage and the page itself; nothing else is loaded. */
function allowedUrl(url: string): boolean {
    if (!url) return false
    if (url.startsWith("/") && !url.startsWith("//")) return true
    try {
        const u = new URL(url, typeof location !== "undefined" ? location.href : "https://framer.com/")
        if (typeof location !== "undefined" && u.origin === location.origin) return true
        return u.protocol === "https:" && (u.hostname === "framerusercontent.com" || u.hostname.endsWith(".framerusercontent.com"))
    } catch (e) {
        if (e instanceof TypeError) return false
        throw e
    }
}
/** Only candidates from allowed hosts stay in a srcset (FP-5: other addresses are never requested). */
function allowedSrcSet(srcSet: string): string {
    return srcSet
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && allowedUrl(s.split(/\s+/)[0]))
        .join(", ")
}
/** For the first render: the same answer on the server and in the browser (a path on the page or Framer's storage). */
function allowedStatic(url: string): boolean {
    if (url.startsWith("/") && !url.startsWith("//")) return true
    return /^https:\/\/([a-z0-9-]+\.)?framerusercontent\.com\//.test(url)
}
/**
 * How card i looks before the first frame is computed (server HTML, static export): depth i card distances, nothing
 * moving, measured in card distances so it holds for desktop and phone. Light from the doorway for a 1440 x 844 stage.
 */
function startLook(i: number, focus: number, n: number) {
    const sharp = focus < 0.01 ? 1 : 1 - sstep(0.06, 2.2 - 1.6 * focus, i)
    const veil = Math.pow(clamp((i - 0.3) / (6 - 0.3), 0, 1), 0.6) * 0.95
    const cap = 1 - sstep(0.1, 0.3, i)
    const W = 1440, H = 844, P = clamp(H * 1.3, 850, 1350), gap = P * 0.58, chf = H * 0.62
    const cw = Math.min(clamp(W * 0.2, 230, 330), Math.max(150, 0.5 * (H - 144)))
    const X = Math.min(W * 0.25, W / 2 - cw / 2 - 28), Y = (ROW_D[i % ROW_D.length] + 0.01) * H
    const dy = Y - (0.4 * H - chf / 2), dz = Math.max(n, MIN_HALL) * gap - i * gap, A = chf * 0.8 * chf
    const lit = ROOM.lit + (1 - ROOM.lit) * Math.pow(clamp((A / (Math.PI * (X * X + dy * dy + dz * dz) + A)) * 9, 0, 1), 0.8)
    return { sharp: round2(sharp), veil: round2(veil), cap: round2(cap), dim: round2(1 - lit) }
}
/** The intro height on a phone (text column `w` wide), for the first render only: lines from the length of the texts. */
function introHeightPhone(heading: string, text: string, links: boolean, r: number, t: number, w = 350) {
    const lines = (s: string, px: number, em: number) => (s ? Math.min(4, Math.max(1, Math.ceil((s.length * px * em) / w))) : 0)
    const hl = lines(heading, 34 * r, 0.45), tl = lines(text, 15 * t, 0.47)
    return Math.round(hl * 34 * r * 1.02 + (tl ? (hl ? 12 : 0) + tl * 15 * t * 1.45 : 0) + (links ? (hl || tl ? 16 : 0) + 15 * t * 1.45 + 4 : 0))
}
/** The smallest candidate of a srcset at least `min` wide (Framer's steps are 512, 1024, 2048, 4096 and the file). */
function smallCandidate(srcSet: string, src: string, min: number): string {
    const list = srcSet
        .split(",")
        .map((part) => part.trim().split(/\s+/))
        .map(([url, w]) => ({ url, w: w && w.endsWith("w") ? parseInt(w, 10) : NaN }))
        .filter((c) => c.url && Number.isFinite(c.w))
        .sort((a, b) => a.w - b.w)
    const hit = list.find((c) => c.w >= min)
    return hit ? hit.url : src
}
/** The one wording of every load error (editor canvas only). */
function loadReason(what: string, kind: LoadKind): string {
    if (kind === "blocked") return `The ${what} is not from Framer's image storage, so it is not loaded.`
    if (kind === "timeout") return `The ${what} did not load in time.`
    if (kind === "broken") return `The ${what} could not be opened.`
    return `The ${what} stopped loading.`
}

// ------------------------------------------------------------------ colours and style values

/** True when the element has keyboard focus (browsers without :focus-visible count every focus). */
function byKeyboard(el: Element): boolean {
    try {
        return el.matches(":focus-visible")
    } catch (err) {
        if (err instanceof SyntaxError) return true
        throw err
    }
}
/** A colour from Framer's Color control (also a colour style); anything else falls back. */
function cssColor(v: unknown, fallback: string): string {
    if (typeof v !== "string") return fallback
    const s = v.trim()
    return /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|color|var)\(.+\))$/i.test(s) ? s : fallback
}
/** Reads an rgb() string from the browser (colour styles and display-p3 included); null if unknown. */
function parseRgb(s: string): [number, number, number] | null {
    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
    if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255]
    const p = s.match(/color\(\s*(?:display-p3|srgb)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i)
    if (p) return [+p[1], +p[2], +p[3]]
    return null
}
const hexRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
/** True when two colours (rgb(), a colour style with an rgb() fallback, or #RRGGBB) are the same, compared by numbers. */
function sameRgb(a: string, b: string): boolean {
    const read = (v: string) => (/^#[0-9a-f]{6}$/i.test(v.trim()) ? hexRgb(v.trim()) : parseRgb(v))
    const x = read(a), y = read(b)
    return !!x && !!y && x.every((v, i) => Math.round(v * 255) === Math.round(y[i] * 255))
}
const toLinear = (c: [number, number, number]) => c.map((v) => Math.pow(v, 2.2)) as [number, number, number]
const mixRgb = (a: [number, number, number], b: [number, number, number], t: number) =>
    `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t) * 255)).join(",")})`
/** The first value of a BorderRadius string, in visible px, 0 to 24. */
function radiusPx(v: unknown): number {
    if (typeof v !== "string") return 3
    const n = parseFloat(v)
    return Number.isFinite(n) ? clamp(n, 0, 24) : 3
}
/** A BoxShadow string with every length times the layout factor; an unknown format gives the default. */
function shadowCss(v: unknown): string {
    const s = typeof v === "string" && v.trim() ? v.trim() : DEFAULT_SHADOW
    if (!/^[\w\s.,()#%+-]+$/.test(s) || !/px/.test(s)) return shadowCss(DEFAULT_SHADOW)
    return s.replace(/(-?\d*\.?\d+)px/g, (_m, n: string) => `${round2(parseFloat(n) * L)}px`)
}
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)
const str = (v: unknown) => (typeof v === "string" ? v : "")
/** Font values from Framer's Font control as inline style; sizes are set by the hallway. */
function fontStyle(f: FontValue | undefined, d: { weight: number; lineHeight: number; letterSpacing: string }): CSSProperties {
    const o: CSSProperties = { fontWeight: d.weight, lineHeight: d.lineHeight, letterSpacing: d.letterSpacing }
    if (!f || typeof f !== "object") return o
    if (typeof f.fontFamily === "string" && f.fontFamily) o.fontFamily = f.fontFamily
    if (f.fontWeight !== undefined) o.fontWeight = f.fontWeight as CSSProperties["fontWeight"]
    if (typeof f.fontStyle === "string") o.fontStyle = f.fontStyle
    if (f.lineHeight !== undefined && f.lineHeight !== "") o.lineHeight = f.lineHeight as CSSProperties["lineHeight"]
    if (f.letterSpacing !== undefined && f.letterSpacing !== "") o.letterSpacing = f.letterSpacing as CSSProperties["letterSpacing"]
    return o
}
const fontSizePx = (f: FontValue | undefined, d: number) => {
    const n = f && f.fontSize !== undefined ? parseFloat(String(f.fontSize)) : NaN
    return Number.isFinite(n) && n > 0 ? n : d
}

// ------------------------------------------------------------------ room shader (WebGL 2)

const VERT = `#version 300 es
void main() { vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0); gl_Position = vec4(p, 0.0, 1.0); }`

// The hallway seen from inside: walls at x = +-xw, ceiling and floor at y = yc and yf (y points down), an end wall at
// zEnd with a doorway on the floor, the wall as thick as uDoor.w. The only light is the daylight in the doorway: every
// point gets the share of the opening it can see (Lambert's polygon formula), plus light thrown back by the lit floor
// (from the centre of the opening); corners darken the indirect light only. Lime plaster, stone slabs with joints, a
// shadow gap at the wall base, a honed floor that softly mirrors the opening, haze, a filmic curve and dither.
const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uScale; uniform vec2 uVP; uniform float uP;
uniform vec3 uCam; uniform vec3 uRoom; uniform vec4 uDoor;
uniform vec3 uWall; uniform vec3 uFloor; uniform vec3 uCeil; uniform vec3 uHaze; uniform vec3 uLight;
uniform vec4 uK; uniform vec4 uF; uniform float uExp;
const float PI = 3.14159265;
const float BIG = 1e9;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float box(vec2 p, vec2 lo, vec2 hi, float r) {
  vec2 a = smoothstep(lo - r, lo + r, p) * (1.0 - smoothstep(hi - r, hi + r, p));
  return a.x * a.y;
}
float joint(float x, float s, float w, float aa) {
  float d = abs(fract(x / s + 0.5) - 0.5) * s;
  return (1.0 - smoothstep(w, w + aa, d)) * (1.0 - smoothstep(0.06 * s, 0.2 * s, aa));
}
float edgeF(vec3 a, vec3 b, vec3 n) {
  vec3 c = cross(a, b);
  float l = length(c);
  return l < 1e-6 ? 0.0 : acos(clamp(dot(a, b), -1.0, 1.0)) * dot(n, c) / l;
}
float doorF(vec3 p, vec3 n, float z) {
  float hw = uDoor.y * 0.5, y0 = uRoom.z - uDoor.z, y1 = uRoom.z;
  vec3 a = normalize(vec3(-hw, y0, z) - p), b = normalize(vec3(hw, y0, z) - p);
  vec3 c = normalize(vec3(hw, y1, z) - p), d = normalize(vec3(-hw, y1, z) - p);
  return abs(edgeF(a, b, n) + edgeF(b, c, n) + edgeF(c, d, n) + edgeF(d, a, n)) / (2.0 * PI);
}
float doorP(vec3 p, vec3 n, float z) {
  vec3 d = vec3(0.0, uRoom.z - uDoor.z * 0.5, z) - p;
  float r2 = dot(d, d);
  vec3 dn = d * inversesqrt(r2);
  float a = uDoor.y * uDoor.z;
  return max(dot(n, dn), 0.0) * max(dn.z, 0.0) * a / (PI * r2 + a);
}
vec3 shade(vec2 q, float eyeZ) {
  float ex = uCam.x, ey = uCam.y;
  float xw = uRoom.x, yc = uRoom.y, yf = uRoom.z;
  float zE = uDoor.x, hw = uDoor.y * 0.5, dh = uDoor.z, zF = zE + uDoor.w;
  vec3 L = uLight * uK.y;
  if (eyeZ >= zF) return L;
  float D = 0.0; int s = 0; bool inDoor = eyeZ >= zE;
  if (!inDoor) {
    float tw = BIG, tf = BIG, tc = BIG;
    if (q.x > 1e-6) tw = (xw - ex) / q.x; else if (q.x < -1e-6) tw = (-xw - ex) / q.x;
    if (q.y > 1e-6) tf = (yf - ey) / q.y; else if (q.y < -1e-6) tc = (yc - ey) / q.y;
    float te = zE - eyeZ;
    D = min(min(tw, tf), min(tc, te));
    if (D == te) {
      vec2 h = vec2(ex + q.x * D, ey + q.y * D);
      if (abs(h.x) < hw && h.y > yf - dh) inDoor = true; else s = 3;
    } else s = D == tf ? 1 : (D == tc ? 2 : 0);
  }
  if (inDoor) {
    float tj = BIG, tt = BIG, tl = BIG;
    if (q.x > 1e-6) tj = (hw - ex) / q.x; else if (q.x < -1e-6) tj = (-hw - ex) / q.x;
    if (q.y > 1e-6) tt = (yf - ey) / q.y; else if (q.y < -1e-6) tl = (yf - dh - ey) / q.y;
    float tF = zF - eyeZ;
    D = min(min(tj, tt), min(tl, tF));
    s = D == tF ? 7 : (D == tj ? 4 : (D == tt ? 6 : 5));
  }
  if (s == 7) return L;
  vec3 p = vec3(ex + q.x * D, ey + q.y * D, eyeZ + D);
  float pix = D / (uP * uScale);
  vec3 n; vec3 alb; float ao = 1.0; float trim = 1.0; vec2 st;
  float h = yf - yc;
  float side = p.x >= 0.0 ? 1.0 : -1.0;
  if (s == 1 || s == 6) {
    n = vec3(0.0, -1.0, 0.0); alb = uFloor; st = p.xz;
    float tz = uF.y, tx = xw * 2.0 / 3.0;
    alb *= 1.0 + (hash(floor(vec2(p.x / tx + 0.5, p.z / tz))) - 0.5) * 0.08;
    float az = pix / max(abs(q.y), 1e-3);
    trim *= 1.0 - 0.42 * max(joint(p.z, tz, 0.9, az), joint(p.x + tx * 0.5, tx, 0.9, pix));
    if (s == 1) ao = smoothstep(0.0, 0.34 * xw, xw - abs(p.x));
  } else if (s == 2) {
    n = vec3(0.0, 1.0, 0.0); alb = uCeil; st = p.xz;
    ao = smoothstep(0.0, 0.34 * xw, xw - abs(p.x));
  } else if (s == 0) {
    n = vec3(-side, 0.0, 0.0); alb = uWall; st = p.zy;
    ao = smoothstep(0.0, 0.26 * h, p.y - yc) * smoothstep(0.0, 0.26 * h, yf - p.y);
    trim *= 1.0 - 0.6 * (1.0 - smoothstep(4.0, 4.0 + pix, yf - p.y));
  } else if (s == 3) {
    n = vec3(0.0, 0.0, -1.0); alb = uWall; st = p.xy;
    ao = smoothstep(0.0, 0.22 * h, min(xw - abs(p.x), min(p.y - yc, yf - p.y)));
  } else {
    n = s == 4 ? vec3(-side, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    alb = uWall; st = s == 4 ? p.zy : p.xz;
  }
  alb *= 1.0 + (noise(st / 150.0) * 0.6 + noise(st / 40.0) * 0.4 - 0.5) * 0.08 + (noise(st / 5.0) - 0.5) * 0.03;
  float zL = s >= 4 ? zF : zE;
  float F = s == 3 ? 0.0 : doorF(p, n, zL);
  bool fl = s == 1 || s == 6;
  float Fb = fl ? doorP(vec3(side * xw * 0.98, yf - h * 0.4, p.z), vec3(-side, 0.0, 0.0), zL) * 0.5
                : doorP(vec3(p.x, yf, min(p.z, zL - 0.35 * dh)), vec3(0.0, -1.0, 0.0), zL);
  vec3 fill = (fl ? uWall : uFloor) * L * Fb * (s == 3 ? 1.8 : 0.55) + uK.x;
  vec3 col = alb * (L * F * mix(0.8, 1.0, ao) + fill * mix(uF.z, 1.0, ao)) * trim;
  // the doorway frame (round 11). The reveals are lime plaster close to neutral, so they take the colour of the
  // daylight; brightest at the opening and softer inwards, the head darker than the sides (it faces the ground outside);
  // fine shadows in the inner corners and along the threshold; the daylight overexposes a little at the edge of the
  // opening; a fine plaster grain where it can be seen
  if (s >= 4) {
    float lw = dot(alb, vec3(0.2126, 0.7152, 0.0722));
    col *= mix(vec3(1.0), vec3(lw) / max(alb, vec3(1e-4)), 0.75);
    float t = clamp((p.z - zE) / max(zF - zE, 1e-3), 0.0, 1.0);
    float grad = mix(0.46, 1.0, t * t * (3.0 - 2.0 * t));
    float head = s == 5 ? 0.6 : 1.0;
    float cw = 0.05 * dh;
    float corner = s == 4 ? smoothstep(0.0, cw, p.y - (yf - dh)) * smoothstep(0.0, cw * 0.5, yf - p.y)
                          : smoothstep(0.0, cw, hw - abs(p.x));
    float sill = s == 6 ? smoothstep(0.0, 0.025 * dh, p.z - zE) : 1.0;
    float grain = (noise(st * 0.9) - 0.5) * 0.07 * (1.0 - smoothstep(0.4, 1.6, pix));
    col *= grad * head * mix(0.5, 1.0, corner) * mix(0.55, 1.0, sill) * (1.0 + grain);
    col += mix(alb, vec3(lw), 0.75) * L * 0.32 * exp(-(zF - p.z) / (0.03 * dh)) * head * mix(0.6, 1.0, corner);
  } else if (s == 1) {
    // a field of daylight on the floor in the shape of the opening, running out softly into the hallway; a fine
    // shadow line where the hallway floor meets the threshold
    float u = zE - p.z;
    float reach = dh * 1.25 - uDoor.w;
    float sx = 0.03 * hw + 0.2 * u * hw / dh;
    float lat = 1.0 - smoothstep(hw - sx, hw + sx, abs(p.x));
    float run = 1.0 - smoothstep(0.0, reach, u);
    col += alb * L * 0.42 * lat * run * run;
    col *= mix(0.62, 1.0, smoothstep(0.0, 0.012 * dh, u));
  }
  if (s == 1) {
    float t = zE - p.z;
    vec2 hit = vec2(p.x + q.x * t, p.y - q.y * t);
    float m = box(hit, vec2(-hw, yf - dh), vec2(hw, yf), 0.06 * dh + 0.1 * t);
    float fres = 0.04 + 0.96 * pow(1.0 - q.y / length(vec3(q, 1.0)), 5.0);
    col += L * m * uK.w * fres * 0.06;
  }
  float fog = 1.0 - exp(-D * length(vec3(q, 1.0)) * uK.z);
  if (s >= 4) fog *= 0.25;
  return mix(col, uHaze, fog);
}
void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  vec2 q = (px - uVP) / uP;
  vec3 col = shade(q, uCam.z - uP) * uExp;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  vec2 v = px / (uRes / uScale) - 0.5;
  col *= 1.0 - dot(v, v) * 0.42;
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  o = vec4(col, 1.0);
}`
const UNIFORMS = ["uRes", "uScale", "uVP", "uP", "uCam", "uRoom", "uDoor", "uWall", "uFloor", "uCeil", "uHaze", "uLight", "uK", "uF", "uExp"] as const
type Uniforms = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>

/** Live instances on the page: from the second one on, a far instance gives its context back. */
const live = new Set<object>()
/** One scroll listener for all instances on the page, only while one is in view (FP-16). */
const scrollSubs = new Set<() => void>()
function onWindowScroll() {
    scrollSubs.forEach((f) => f())
}
function subscribeScroll(f: () => void) {
    if (scrollSubs.size === 0) window.addEventListener("scroll", onWindowScroll, { passive: true })
    scrollSubs.add(f)
}
function unsubscribeScroll(f: () => void) {
    scrollSubs.delete(f)
    if (scrollSubs.size === 0) window.removeEventListener("scroll", onWindowScroll)
}
/**
 * One ride at a time for the whole page. Only while it runs, any wheel, touch, key or press hands the page back at once:
 * read-only and passive, removed when the ride ends (FP-16).
 */
const RIDE_STOP = ["wheel", "touchstart", "keydown", "pointerdown"] as const
let rideFrame = 0
let rideOwner: object | null = null
function stopRide() {
    if (rideFrame) cancelAnimationFrame(rideFrame)
    if (rideOwner) for (const ev of RIDE_STOP) window.removeEventListener(ev, stopRide)
    rideFrame = 0
    rideOwner = null
}

// ------------------------------------------------------------------ engine

/** A card as the engine sees it. */
interface CardModel {
    kind: "picture" | "frame" | "plain"
    src: string
    srcSet: string
    alt: string
    hasLink: boolean
}
interface Options {
    cards: CardModel[]
    endSrc: string
    endSrcSet: string
    shift: number
    focus: number
    parallax: number
    spread: number
    tilt: number
    light: string
    /** no Light colour in the panel: the light takes its colour from the picture outside */
    lightAuto: boolean
    canvasEnd: boolean
    hasIntro: boolean
    /** the Ending colour is the light default: it turns dark when the picture outside does not come */
    endInkDefault: boolean
}
interface Hooks {
    note: (reason: string | null) => void
    arrive: () => void
    /** editor canvas: the instance is not taller than the stage, so there is no way to walk */
    short: (on: boolean) => void
}
interface Geo {
    W: number
    H: number
    phone: boolean
    P: number
    cw: number
    ch: number
    gap: number
    vp: { x: number; y: number }
    vp0: { x: number; y: number } | null
    far: number
    chf: number
    push: number
    xw: number
    yf: number
    yc: number
    zEnd: number
    dw: number
    dh: number
    T: number
    Dout: number
    delta: number
    bw: number
    bh: number
    /** phone: the first caption does not fit above the intro, so it waits until the intro has gone */
    capHide: boolean
}
interface CardRuntime {
    el: HTMLElement
    media: HTMLElement | null
    sharp: HTMLImageElement | null
    softImg: HTMLImageElement | null
    soft: HTMLImageElement | null
    veil: HTMLElement | null
    dim: HTMLElement | null
    cap: HTMLElement | null
    rf: HTMLElement | null
    rfImg: HTMLImageElement | null
    i: number
    side: number
    X: number
    Y: number
    lit: number
    shown: boolean
    rfShown: boolean
    softReady: boolean
    requested: boolean
    softImgOn: boolean
    o: number
    so: number
    vo: number
    co: number
    ro: number
    do: number
    zi: number
}

/**
 * The hallway: geometry, the walk, the spring, the room, the cards and the doorway. Written once per frame through
 * references; React only sets the first values.
 */
class Hall {
    private root: HTMLElement
    private stage: HTMLElement
    private hooks: Hooks
    private opt: Options
    private g!: Geo
    private cards: CardRuntime[] = []
    private intro: HTMLElement | null
    private photo: HTMLElement | null
    private outside: HTMLElement | null
    private endSharp: HTMLImageElement | null
    private endSoft: HTMLCanvasElement | null
    private endMid: HTMLCanvasElement | null
    private glare: HTMLElement | null
    private scrim: HTMLElement | null
    private endText: HTMLElement | null
    private expo: HTMLElement | null
    private canvas: HTMLCanvasElement | null
    /** where the room is drawn: the canvas on the page, or in the editor a fresh one for each picture */
    private surface: HTMLCanvasElement | null = null
    private frozenTimer = 0
    private loseExt: WEBGL_lose_context | null = null
    private gl: WebGL2RenderingContext | null = null
    private u: Uniforms | null = null
    private roomScale = 1
    private glState: "off" | "compiling" | "ready" | "lost" | "released" = "off"
    private endAr = 1.5
    private endBig = false
    private endSmall = false
    private endDecoded = false
    private endFailed = false
    /** the picture outside did not come (no soft stage either): the ending text sits on the light */
    private endGone = false
    /** the outside shows a picture (at least its soft stages): only then may it hide the room */
    private outsideReady = false
    private roomOff = false
    private decodeTurn = 0
    private endSizes = ""
    // the walk
    private target = 0
    private current = 0
    private vel = 0
    private mid = 0
    private midVel = 0
    private ptr = { x: 0, y: 0, tx: 0, ty: 0 }
    private raf = 0
    private last = 0
    private lastC = 0
    private lastT = 0
    private speed = 0
    private near = false
    private calm = false
    private arrived = false
    private destroyed = false
    private stageFixed = false
    private stickyKnown = false
    private rootH = 0
    private ro: ResizeObserver | null = null
    private io: IntersectionObserver | null = null
    private ioFar: IntersectionObserver | null = null
    private mq: MediaQueryList | null = null
    private mqScheme: MediaQueryList | null = null
    private fine: MediaQueryList | null = null
    private releaseTimer = 0
    private lightRgb: [number, number, number] = hexRgb(ROOM.light)
    private derivedLight: [number, number, number] | null = null
    private timers = new Set<number>()
    private canvasMode: boolean

    constructor(root: HTMLElement, opt: Options, hooks: Hooks, canvasMode: boolean) {
        this.root = root
        this.stage = root.querySelector(".hw-stage") as HTMLElement
        this.hooks = hooks
        this.opt = opt
        this.canvasMode = canvasMode
        this.intro = root.querySelector(".hw-intro")
        this.photo = root.querySelector(".hw-photo")
        this.outside = root.querySelector(".hw-out")
        this.endSharp = root.querySelector(".hw-end-sharp")
        this.endSoft = root.querySelector(".hw-end-soft")
        this.endMid = root.querySelector(".hw-end-mid")
        this.glare = root.querySelector(".hw-glare")
        this.scrim = root.querySelector(".hw-scrim")
        this.endText = root.querySelector(".hw-end-text")
        this.expo = root.querySelector(".hw-expo")
        this.canvas = root.querySelector(".hw-room")
        this.surface = this.canvas
        this.collectCards()
        this.readLight()
        this.fine = window.matchMedia("(hover: hover) and (pointer: fine)")
        this.ro = new ResizeObserver(() => this.measure())
        this.ro.observe(root)
        this.ro.observe(this.stage)
        // the intro too: a web font that arrives later makes it taller, and the cards above it make room
        if (this.intro) this.ro.observe(this.intro)
        if (canvasMode) {
            // the editor: no loop and no listeners besides the ResizeObserver; the start in perspective, not calm
            this.measure()
            return
        }
        this.mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        this.calm = this.mq.matches
        this.mq.addEventListener("change", this.onMotion)
        this.mqScheme = window.matchMedia("(prefers-color-scheme: dark)")
        this.mqScheme.addEventListener("change", this.onScheme)
        live.add(this)
        // the room is made when the hallway comes within one stage height of the view
        this.io = new IntersectionObserver(this.onIntersect, { rootMargin: "100% 0px 100% 0px" })
        this.io.observe(root)
        // a second, wider watch only decides when a far instance may give its context back
        this.ioFar = new IntersectionObserver(this.onFar, { rootMargin: "300% 0px 300% 0px" })
        this.ioFar.observe(root)
        root.addEventListener("pointermove", this.onPointer, { passive: true })
        root.addEventListener("pointerleave", this.onPointerLeave, { passive: true })
        this.measure()
    }

    update(opt: Options) {
        const relayout = opt.cards.length !== this.opt.cards.length || opt.spread !== this.opt.spread || opt.tilt !== this.opt.tilt || opt.hasIntro !== this.opt.hasIntro || opt.shift !== this.opt.shift || opt.parallax !== this.opt.parallax
        const lightChanged = opt.light !== this.opt.light || opt.lightAuto !== this.opt.lightAuto
        const endChanged = opt.endSrc !== this.opt.endSrc
        this.opt = opt
        this.collectCards()
        // the intro may have been switched off and on: watch the element that is there now
        const intro = this.root.querySelector<HTMLElement>(".hw-intro")
        if (intro !== this.intro) {
            if (this.intro) this.ro?.unobserve(this.intro)
            this.intro = intro
            if (intro) this.ro?.observe(intro)
        }
        if (lightChanged) this.readLight()
        if (endChanged) {
            this.endBig = false
            this.endSmall = false
            this.endDecoded = false
            this.endFailed = false
            this.endGone = false
            this.outsideReady = false
            this.endSizes = ""
            // the light goes back to the fixed colour until the new picture is there
            this.derivedLight = null
            this.readLight()
            // the old picture leaves at once, also from the soft stages
            this.endSharp?.removeAttribute("srcset")
            this.endSharp?.removeAttribute("src")
            for (const cv of [this.endSoft, this.endMid]) cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height)
        }
        this.endInk()
        if (relayout || endChanged) this.measure()
        else {
            this.render()
            if (this.canvasMode) this.scheduleFrozen()
        }
    }

    destroy() {
        this.destroyed = true
        cancelAnimationFrame(this.raf)
        this.timers.forEach((t) => window.clearTimeout(t))
        this.timers.clear()
        window.clearTimeout(this.releaseTimer)
        window.clearTimeout(this.frozenTimer)
        if (rideOwner === this) stopRide()
        this.ro?.disconnect()
        this.io?.disconnect()
        this.mq?.removeEventListener("change", this.onMotion)
        this.mqScheme?.removeEventListener("change", this.onScheme)
        this.ioFar?.disconnect()
        this.root.removeEventListener("pointermove", this.onPointer)
        this.root.removeEventListener("pointerleave", this.onPointerLeave)
        unsubscribeScroll(this.onScroll)
        live.delete(this)
        this.dropContext(true)
    }

    // ---------------------------------------------------------- DOM

    private collectCards() {
        const els = Array.from(this.root.querySelectorAll<HTMLElement>(".hw-card"))
        const rfs = Array.from(this.root.querySelectorAll<HTMLElement>(".hw-rf"))
        const old = this.cards
        this.cards = els.map((el, i) => {
            const prev = old[i] && old[i].el === el ? old[i] : null
            const c: CardRuntime = prev || {
                el,
                media: el.querySelector(".hw-media"),
                sharp: el.querySelector(".hw-sharp"),
                softImg: el.querySelector(".hw-soft-img"),
                soft: el.querySelector(".hw-soft"),
                veil: el.querySelector(".hw-veil"),
                dim: el.querySelector(".hw-dim"),
                cap: el.querySelector(".hw-ct"),
                rf: rfs.find((r) => r.dataset.i === String(i)) || null,
                rfImg: null,
                i,
                side: i % 2 === 0 ? 1 : -1,
                X: 0,
                Y: 0,
                lit: 1,
                // unknown at first: the first frame writes visibility, pointer events and the layer either way
                shown: false,
                rfShown: true,
                softReady: false,
                requested: false,
                softImgOn: true,
                o: -1,
                so: -1,
                vo: -1,
                co: -1,
                ro: -1,
                do: -1,
                zi: 0,
            }
            if (c.rf) c.rfImg = c.rf.querySelector("img")
            return c
        })
        // the first three come with the page (src in the server HTML); the others when they come near
        this.cards.forEach((c) => {
            if (!c.requested && (this.canvasMode || (c.sharp && c.sharp.getAttribute("src")))) this.request(c)
        })
    }

    /**
     * Sets the addresses of a card that comes near (1.5 sight distances) and watches the load. Every card picture goes
     * through this one path: allowed host before any request, time limit, one report (FP-4, FP-5, FP-12).
     */
    private request(c: CardRuntime) {
        if (c.requested) return
        c.requested = true
        const img = c.sharp
        if (!img) return
        const src = img.getAttribute("src") || img.getAttribute("data-src") || ""
        if (!src) return
        const what = `card ${c.i + 1} picture`
        if (!allowedUrl(src)) {
            this.report(what, "blocked")
            this.dropPicture(c)
            return
        }
        for (const im of [c.softImg, c.sharp]) {
            if (!im || im.getAttribute("src")) continue
            const srcset = allowedSrcSet(im.getAttribute("data-srcset") || "")
            if (srcset) im.srcset = srcset
            im.src = src
        }
        this.track(
            img,
            what,
            () => {
                // without the soft stage (picture not readable) the card keeps the blurred picture itself
                if (this.makeSoft(img, [c.soft, c.rfImg], 96, 120, 4)) {
                    c.softReady = true
                    this.softImg(c, false)
                }
                this.render()
            },
            () => this.dropPicture(c),
        )
    }
    /** A picture that does not come: the card stays a calm surface with its caption, never a broken image. */
    private dropPicture(c: CardRuntime) {
        for (const im of [c.sharp, c.softImg]) {
            if (!im) continue
            im.removeAttribute("srcset")
            im.removeAttribute("src")
            im.style.display = "none"
        }
        c.softImgOn = false
        c.softImg = null
    }

    /** Waits for an image with a time limit; the first result counts (FP-4). */
    private track(img: HTMLImageElement, what: string, ok: () => void, failed?: () => void) {
        let done = false
        const finish = (kind: LoadKind | null) => {
            if (done) return
            done = true
            window.clearTimeout(timer)
            this.timers.delete(timer)
            img.removeEventListener("load", onLoad)
            img.removeEventListener("error", onError)
            if (this.destroyed) return
            if (kind) {
                this.report(what, kind)
                failed?.()
                return
            }
            try {
                ok()
            } catch {
                // expected read-back errors are handled inside; anything else is reported, never thrown from a promise
                this.report(what, "unexpected")
                failed?.()
            }
        }
        const onLoad = () => {
            const at = img.currentSrc
            img.decode().then(
                () => finish(null),
                (e: unknown) => {
                    // a newer candidate of the srcset took over while decoding (new size): its own load event follows
                    if (!img.complete || img.currentSrc !== at) return
                    finish(e instanceof DOMException ? "broken" : "unexpected")
                },
            )
        }
        const onError = () => finish("broken")
        const timer = window.setTimeout(() => finish("timeout"), LOAD_MS)
        this.timers.add(timer)
        img.addEventListener("load", onLoad)
        img.addEventListener("error", onError)
        if (img.complete && img.naturalWidth > 0) onLoad()
        else if (img.complete && img.currentSrc) onError()
    }

    private report(what: string, kind: LoadKind) {
        this.hooks.note(loadReason(what, kind))
    }

    /** The soft version of a card picture as a small image (false if the picture cannot be read back). */
    private makeSoft(img: HTMLImageElement, outs: (HTMLImageElement | null)[], w: number, h: number, factor: number): boolean {
        const big = document.createElement("canvas")
        if (!this.softCanvas(img, big, w, h, factor)) return false
        // shown as a small picture, not as the canvas: a canvas becomes a layer of its own, and inside a rounded, masked
        // card that costs large offscreen surfaces (about 100 MB of graphics memory for the reflections alone)
        let url: string
        try {
            url = big.toDataURL("image/jpeg", 0.9)
        } catch (err) {
            // a picture without CORS cannot be read back; the caller keeps its fallback
            if (err instanceof DOMException) return false
            throw err
        }
        for (const o of outs) if (o) o.src = url
        return true
    }
    /**
     * The soft version drawn into a canvas (scaled down and up again; no ctx.filter, which WebKit lacks). The outside
     * picture keeps its soft stages as canvases: there the layer is the size of the whole picture, and a canvas layer
     * holds only its own small pixels, a picture layer would be rastered at the full size.
     */
    private softCanvas(img: HTMLImageElement, big: HTMLCanvasElement | null, w: number, h: number, factor: number): boolean {
        if (!big) return false
        const ctx = big.getContext("2d")
        const small = document.createElement("canvas")
        small.width = Math.max(1, Math.round(w / factor))
        small.height = Math.max(1, Math.round(h / factor))
        const sctx = small.getContext("2d")
        if (!ctx || !sctx) return false
        // cover the frame like object-fit: cover
        const iw = img.naturalWidth, ih = img.naturalHeight
        const s = Math.max(small.width / iw, small.height / ih)
        const dw = iw * s, dh = ih * s
        sctx.imageSmoothingEnabled = true
        sctx.imageSmoothingQuality = "high"
        sctx.drawImage(img, (small.width - dw) / 2, (small.height - dh) / 2, dw, dh)
        big.width = w
        big.height = h
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(small, 0, 0, w, h)
        return true
    }

    private readLight() {
        // without a Light colour in the panel: the colour taken from the picture outside, once it is there
        if (this.opt.lightAuto && this.derivedLight) {
            this.lightRgb = this.derivedLight
            this.stage.style.setProperty("--hw-light", mixRgb(this.derivedLight, this.derivedLight, 0))
            return
        }
        const probe = document.createElement("span")
        probe.style.color = this.opt.light
        probe.style.display = "none"
        this.root.appendChild(probe)
        const rgb = parseRgb(getComputedStyle(probe).color)
        this.root.removeChild(probe)
        this.lightRgb = rgb || hexRgb(ROOM.light)
        this.stage.style.setProperty("--hw-light", this.opt.light)
    }
    /**
     * The colour of the daylight from the picture outside: the mean of its brightest eighth (sky and light, not the
     * colour of the land), as bright as the fixed light and a little of the way back to grey, so it tints and never
     * paints. Needs a readable picture (CORS); otherwise the fixed light stays.
     */
    private deriveLight(img: HTMLImageElement) {
        const w = 60, h = Math.max(1, Math.round((60 * img.naturalHeight) / Math.max(1, img.naturalWidth)))
        const cv = document.createElement("canvas")
        cv.width = w
        cv.height = h
        const cx = cv.getContext("2d")
        if (!cx) return
        cx.drawImage(img, 0, 0, w, h)
        let d: Uint8ClampedArray
        try {
            d = cx.getImageData(0, 0, w, h).data
        } catch (err) {
            if (err instanceof DOMException) return
            throw err
        }
        const lum = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
        const px: { l: number; c: number[] }[] = []
        for (let i = 0; i < d.length; i += 4) {
            const c = [d[i], d[i + 1], d[i + 2]].map((v) => Math.pow(v / 255, 2.2))
            px.push({ l: lum(c), c })
        }
        px.sort((a, b) => b.l - a.l)
        const top = px.slice(0, Math.max(1, Math.round(px.length / 8)))
        const m = [0, 1, 2].map((k) => top.reduce((a, x) => a + x.c[k], 0) / top.length)
        const g = lum(toLinear(hexRgb(ROOM.light)))
        const k = g / Math.max(1e-4, lum(m))
        this.derivedLight = m.map((v) => Math.pow(clamp(v * k * 0.85 + g * 0.15, 0, 1), 1 / 2.2)) as [number, number, number]
        this.readLight()
        this.render()
        if (this.canvasMode) this.scheduleFrozen()
    }

    // ---------------------------------------------------------- events

    private onMotion = () => {
        this.calm = !!this.mq?.matches
        this.render()
    }
    private onScheme = () => {
        this.readLight()
        this.render()
    }
    private onIntersect = (entries: IntersectionObserverEntry[]) => {
        const e = entries[entries.length - 1]
        this.near = e.isIntersecting
        if (this.near) {
            subscribeScroll(this.onScroll)
            this.startRoom()
            this.target = this.progress()
            this.kick()
            window.clearTimeout(this.releaseTimer)
        } else unsubscribeScroll(this.onScroll)
    }
    private onFar = (entries: IntersectionObserverEntry[]) => {
        const e = entries[entries.length - 1]
        window.clearTimeout(this.releaseTimer)
        // from the second live instance on, one more than three stage heights away gives its context back after 2 s
        if (!e.isIntersecting && live.size > 1) this.releaseTimer = window.setTimeout(() => this.dropContext(false), 2000)
    }
    private onScroll = () => {
        this.checkSticky()
        if (this.stageFixed) this.followStage()
        this.target = this.progress()
        this.kick()
    }
    private onPointer = (e: PointerEvent) => {
        if (this.calm || !this.fine?.matches) return
        const r = this.stage.getBoundingClientRect()
        if (r.width <= 0 || r.height <= 0) return
        this.ptr.tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1)
        this.ptr.ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1)
        this.kick()
    }
    private onPointerLeave = () => {
        this.ptr.tx = 0
        this.ptr.ty = 0
        this.kick()
    }

    // ---------------------------------------------------------- the walk

    /** The rest after the arrival: one stage height, less on very low instances. */
    private rest() {
        return Math.min(this.g.H, Math.max(0, this.rootH - this.g.H) / 3)
    }
    private progress() {
        const r = this.root.getBoundingClientRect()
        this.rootH = r.height
        const range = this.rootH - this.g.H - this.rest()
        if (range <= 1) return 0
        return clamp(-r.top / range, 0, 1)
    }
    private units() {
        const n = this.cards.length, g = this.g, a = DIP
        const dp = g.T + g.P + g.delta
        const up = (dp / (g.gap * (1 - a))) * 1.35
        const hall = n + (Math.max(n, MIN_HALL) - n) / (1 - a)
        return { n, a, dp, up, hall, hold: 0.7, total: hall + up + 0.7 }
    }
    private camera(p: number) {
        const U = this.units(), g = this.g, a = U.a
        const u = p * U.total
        let c: number
        if (u <= U.n) c = g.gap * (u - (a / (2 * Math.PI)) * Math.sin(2 * Math.PI * u))
        else if (u <= U.hall) c = g.gap * (U.n + (1 - a) * (u - U.n))
        else if (u <= U.hall + U.up) {
            // a cubic that keeps the speed of the hallway and brakes softly to a stop
            const v = (u - U.hall) / U.up, m0 = (g.gap * (1 - a) * U.up) / U.dp
            c = g.zEnd + U.dp * (m0 * (v * v * v - 2 * v * v + v) + (3 * v * v - 2 * v * v * v))
        } else c = g.zEnd + U.dp
        return { c, u, U, after: clamp((u - U.hall - U.up) / U.hold, 0, 1) }
    }
    /** Where the camera looks: from beside the intro to the vanishing point, level on its way through the doorway. */
    private aim(c: number, still: boolean) {
        const g = this.g, U = this.units()
        const lev = still ? 0 : smoother(clamp((c - (g.zEnd - 0.5 * g.gap)) / (U.dp + 0.5 * g.gap), 0, 1))
        const away0 = clamp(c / g.gap, 0, 1)
        const baseX = g.vp0 ? lerp(g.vp0.x, g.vp.x, smoother(away0)) : g.vp.x
        return { away0, cx: lerp(baseX, 0, lev), cy: lerp(g.vp.y, 0, lev) }
    }
    /** The part of the frame that sees through the doorway: both faces of the thick wall cut it. */
    private doorClip(eyeZ: number, cx: number, cy: number, ex: number, ey: number): [number, number, number, number] {
        const g = this.g, zE = g.zEnd, zF = zE + g.T, hw = g.dw / 2, y0 = g.yf - g.dh, y1 = g.yf
        let l = 0, r = g.W, t = 0, b = g.H
        for (const z of [zE, zF]) {
            if (eyeZ >= z) continue
            const sz = g.P / (z - eyeZ)
            l = Math.max(l, g.W / 2 + cx + (-hw - ex) * sz)
            r = Math.min(r, g.W / 2 + cx + (hw - ex) * sz)
            t = Math.max(t, g.H / 2 + cy + (y0 - ey) * sz)
            b = Math.min(b, g.H / 2 + cy + (y1 - ey) * sz)
        }
        return [l, r, t, b]
    }

    private kick() {
        if (this.raf || this.destroyed || this.canvasMode) return
        this.last = performance.now()
        this.raf = requestAnimationFrame(this.tick)
    }
    /** Two critically damped springs one after the other: the speed builds up and fades out without a jolt. */
    private tick = (now: number) => {
        this.raf = 0
        try {
            const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000))
            this.last = now
            const steps = Math.ceil(dt / 0.008), h = dt / steps, w0 = 6.5
            for (let i = 0; i < steps; i++) {
                const a1 = w0 * w0 * (this.target - this.mid) - 2 * w0 * this.midVel
                this.midVel += a1 * h
                this.mid += this.midVel * h
                const a2 = w0 * w0 * (this.mid - this.current) - 2 * w0 * this.vel
                this.vel += a2 * h
                this.current += this.vel * h
            }
            if (Math.abs(this.target - this.current) < 0.00002 && Math.abs(this.vel) < 0.0002 && Math.abs(this.target - this.mid) < 0.00002 && Math.abs(this.midVel) < 0.0002) {
                this.current = this.mid = this.target
                this.vel = this.midVel = 0
            }
            const pt = 1 - Math.exp(-dt / 0.28)
            this.ptr.x += (this.ptr.tx - this.ptr.x) * pt
            this.ptr.y += (this.ptr.ty - this.ptr.y) * pt
            const pDone = Math.abs(this.ptr.tx - this.ptr.x) < 0.0005 && Math.abs(this.ptr.ty - this.ptr.y) < 0.0005
            this.render()
            if (this.current !== this.target || this.vel !== 0 || this.midVel !== 0 || !pDone) this.raf = requestAnimationFrame(this.tick)
        } catch (e) {
            // an unexpected fault stops the walk; visitors keep the still, the editor names the reason (FP-8)
            this.hooks.note(`The hallway stopped (${e instanceof Error ? e.message : "unknown error"}).`)
        }
    }

    // ---------------------------------------------------------- layout

    measure() {
        if (this.destroyed) return
        const W = this.stage.clientWidth, H = this.stage.clientHeight
        if (W <= 0 || H <= 0) return
        this.rootH = this.root.getBoundingClientRect().height
        const phone = W < 640
        const P = phone ? clamp(H * 1.05, 680, 1000) : clamp(H * 1.3, 850, 1350)
        const vp = phone ? { x: 0, y: -0.22 * H } : { x: 0.02 * W, y: -0.03 * H }
        const introH = this.intro ? this.intro.offsetHeight : 0
        const top = 72, bottom = H - introH - Math.max(28, H * 0.045) - 44
        let cw = phone ? clamp(Math.min(W * 0.64, ((bottom - top) * 0.86) / 1.25), 120, W * 0.64) : Math.min(clamp(W * 0.2, 230, 330), Math.max(150, 0.5 * (H - 144)))
        let yPhone = (top + bottom) / 2 + 10 - H / 2
        let capHide = false
        if (phone && introH > 0) {
            // the first caption keeps 24 px above the intro: the card moves up and gets smaller where the stage is low
            // (8 px more for the turned card, whose near edge stands a little taller)
            const capH = Math.max(0, ...this.cards.map((c) => (c.cap ? c.cap.offsetHeight / L : 0))) || 36
            const maxBottom = H - introH - Math.max(28, H * 0.045) - 32 - capH - 10
            // two plain limits, so the stylesheet can draw the same start before the engine runs (CSS min())
            cw = clamp(Math.min(cw, (maxBottom - top) / 1.25), 120, cw)
            yPhone = Math.min(yPhone, maxBottom - (cw * 1.25) / 2 - H / 2)
            capHide = top + cw * 1.25 > maxBottom + 0.5
        }
        const ch = cw * 1.25
        const gap = P * (phone ? 0.62 : 0.58)
        const spreadX = phone ? W * 0.075 * this.opt.spread : Math.min(W * 0.25 * this.opt.spread, W / 2 - cw / 2 - 28)
        // the first card stands beside the intro while the camera still looks past it: it keeps 24 px to the right edge
        const spread0 = phone ? spreadX : Math.min(spreadX, Math.max(0, W / 2 - cw / 2 - 24 - (this.opt.hasIntro ? 0.135 * W : vp.x)))
        const chf = phone ? Math.min(H * 0.5, W * 0.78 * 1.25) : H * 0.62
        const n = this.cards.length
        this.g = {
            W, H, phone, P, cw, ch, gap, vp,
            vp0: phone || !this.opt.hasIntro ? null : { x: 0.135 * W, y: -0.03 * H },
            far: gap * 6, chf, push: W * 0.05 * this.opt.parallax,
            xw: phone ? 0.56 * W : Math.max(0.42 * W, spreadX + cw / 2 + 0.07 * W),
            yf: 0.4 * H, yc: phone ? -0.62 * H : -0.5 * H,
            zEnd: Math.max(n, MIN_HALL) * gap, dw: chf * 0.8, dh: chf, T: chf * 0.8 * 0.32, Dout: P * 1.6, delta: chf * 0.8 * 0.15,
            bw: W, bh: H, capHide,
        }
        const g = this.g
        this.stage.style.setProperty("--hw-lw", `${cw * L}px`)
        this.stage.style.setProperty("--hw-lh", `${ch * L}px`)
        for (const c of this.cards) {
            c.X = c.side * (c.i === 0 ? spread0 : spreadX)
            const yFocus = phone ? yPhone + ROW_P[c.i % ROW_P.length] * H * 0.5 : ROW_D[c.i % ROW_D.length] * H - 0.02 * H
            c.Y = yFocus - vp.y
            // daylight from the doorway at the card (share of the opening, from its centre)
            const dx = c.X, dy = c.Y - (g.yf - g.dh / 2), dz = g.zEnd - c.i * gap, r2 = dx * dx + dy * dy + dz * dz, A = g.dw * g.dh
            c.lit = ROOM.lit + (1 - ROOM.lit) * Math.pow(clamp((A / (Math.PI * r2 + A)) * 9, 0, 1), 0.8)
        }
        this.fitPhoto()
        this.checkSticky()
        if (this.stageFixed) this.followStage()
        this.sizeRoom()
        this.target = this.canvasMode ? (this.opt.canvasEnd ? 1 : 0) : this.progress()
        this.current = this.mid = this.target
        this.vel = this.midVel = 0
        this.render()
        if (this.canvasMode) {
            this.hooks.short(this.rootH <= H + 1)
            this.scheduleFrozen()
        }
    }

    /**
     * The point of the outside picture that stands in the middle at the end. Shift moves it only on upright stages, where
     * a narrow strip of the picture is seen; wide stages keep it centred and need no extra enlargement for it.
     */
    private focusX(): number {
        return this.g.W < this.g.H ? clamp(0.5 + this.opt.shift / 100, 0.3, 0.7) : 0.5
    }
    private fitPhoto() {
        const g = this.g, U = this.units(), cEnd = g.zEnd + U.dp, zP = g.zEnd + g.T + g.Dout
        const ar = this.endAr
        const bw0 = Math.max(g.W, g.H * ar), bh0 = bw0 / ar
        const fx = this.focusX(), fy = 0.5
        const offs = this.fine?.matches ? [-1, -0.5, 0, 0.5, 1] : [0]
        const nearZ = Math.max(0, g.zEnd - 3 * g.gap)
        const cover = (l: number, r: number, t: number, b: number, x0: number, y0: number, k: number) =>
            Math.max((x0 - l) / (k * bw0 * fx), (r - x0) / (k * bw0 * (1 - fx)), (y0 - t) / (k * bh0 * fy), (b - y0) / (k * bh0 * (1 - fy)))
        let need = Math.max(1, cover(0, g.W, 0, g.H, g.W / 2, g.H / 2, 1))
        const at = (c: number) => {
            const eyeZ = c - g.P, { cx, cy } = this.aim(c, false)
            const sP = g.P / Math.max(1, zP - eyeZ), k = (g.Dout / g.P) * sP
            for (const px of offs)
                for (const py of offs) {
                    const ex = px * g.push, ey = py * g.push * 0.6
                    const [l, r, t, b] = this.doorClip(eyeZ, cx, cy, ex, ey)
                    if (r <= l || b <= t) continue
                    need = Math.max(need, cover(l, r, t, b, g.W / 2 + cx - ex * sP, g.H / 2 + cy - ey * sP, k))
                }
        }
        for (let i = 0; i <= 120; i++) at((nearZ * i) / 120)
        for (let i = 0; i <= 480; i++) at(nearZ + ((cEnd - nearZ) * i) / 480)
        g.bw = bw0 * need * 1.006
        g.bh = g.bw / ar
        if (this.photo) {
            // centred by transform, not margins: a new size (the real proportions arrive with the file) moves nothing
            this.photo.style.width = `${g.bw}px`
            this.photo.style.height = `${g.bh}px`
        }
        // the sharp picture in the size it has at the end; a touch screen takes at most TOUCH_MAX_PX device pixels
        const endW = Math.ceil(g.bw * (g.Dout / (g.Dout - g.delta)))
        const dpr = window.devicePixelRatio || 1
        this.endSizes = `${this.fine?.matches ? endW : Math.min(endW, Math.floor(TOUCH_MAX_PX / dpr))}px`
        if (this.endSharp && this.endBig && this.endSharp.sizes !== this.endSizes) {
            this.endSharp.sizes = this.endSizes
            this.decodeEnd()
        }
    }

    /**
     * The soft and middle stages of the outside picture come early, from a small file (the smallest candidate of the
     * srcset that is at least 720 wide); the large file from half of the way on, or earlier once the doorway shows the
     * middle stage larger than it holds (door()).
     */
    private loadEndSmall() {
        if (this.endSmall || !this.opt.endSrc) return
        this.endSmall = true
        const src = smallCandidate(allowedSrcSet(this.opt.endSrcSet), this.opt.endSrc, 720)
        if (!allowedUrl(src)) {
            this.report("outside picture", "blocked")
            this.lostEnd()
            return
        }
        const img = new Image()
        img.decoding = "async"
        // read back for the soft stages: Framer's storage answers with CORS (*), the page itself needs none
        img.crossOrigin = "anonymous"
        img.src = src
        this.track(img, "outside picture", () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                const ar = img.naturalWidth / img.naturalHeight
                if (Math.abs(ar - this.endAr) > 0.01) {
                    this.endAr = ar
                    this.fitPhoto()
                }
            }
            this.outsideReady = this.softCanvas(img, this.endSoft, 240, Math.round(240 / this.endAr), 4.6)
            this.softCanvas(img, this.endMid, 720, Math.round(720 / this.endAr), 4)
            if (this.opt.lightAuto) this.deriveLight(img)
            this.endGone = false
            this.endInk()
            this.render()
        }, () => this.lostEnd())
    }
    /** No picture outside: with the default Ending colour the text turns dark, as on an ending without a picture. */
    private lostEnd() {
        if (this.outsideReady) return
        this.endGone = true
        this.endInk()
    }
    private endInk() {
        const dark = this.endGone && this.opt.endInkDefault
        if (dark) {
            this.stage.style.setProperty("--hw-ending", ENDING_ON_LIGHT)
            this.stage.style.setProperty("--hw-ending-line", `color-mix(in srgb, ${ENDING_ON_LIGHT}, transparent 60%)`)
        } else for (const v of ["--hw-ending", "--hw-ending-line"]) this.stage.style.removeProperty(v)
    }

    /** The large outside picture (see loadEndSmall); it shows only once it is decoded (no stall on arrival). */
    private loadEnd() {
        const img = this.endSharp
        if (!img || this.endBig || !this.opt.endSrc) return
        this.endBig = true
        if (!allowedUrl(this.opt.endSrc)) {
            this.report("outside picture", "blocked")
            this.endFailed = true
            this.lostEnd()
            return
        }
        img.sizes = this.endSizes
        const endSet = allowedSrcSet(this.opt.endSrcSet)
        if (endSet) img.srcset = endSet
        img.src = this.opt.endSrc
        this.track(img, "outside picture", () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                const ar = img.naturalWidth / img.naturalHeight
                if (Math.abs(ar - this.endAr) > 0.01) {
                    this.endAr = ar
                    this.fitPhoto()
                }
            }
            this.endDecoded = true
            this.endGone = false
            this.endInk()
            this.render()
        }, () => {
            this.endFailed = true
            this.lostEnd()
        })
    }
    /** After a new size: the sharp picture shows again only once the new candidate is decoded. */
    private decodeEnd() {
        const img = this.endSharp
        if (!img || this.endFailed || !img.getAttribute("src")) return
        this.endDecoded = false
        const turn = ++this.decodeTurn
        const at = img.currentSrc
        img.decode().then(
            () => {
                if (this.destroyed || turn !== this.decodeTurn) return
                this.endDecoded = true
                this.render()
            },
            (e: unknown) => {
                if (this.destroyed || turn !== this.decodeTurn) return
                // the new size picked another file while decoding: decode that one once it is there
                if (!img.complete || img.currentSrc !== at) {
                    img.addEventListener("load", () => this.decodeEnd(), { once: true })
                    return
                }
                if (e instanceof DOMException) this.report("outside picture", "broken")
                else this.report("outside picture", "unexpected")
            },
        )
    }

    /** Does the stage stick? If an ancestor clips (Clip Content), it does not: then it follows by transform. */
    private checkSticky() {
        if (this.canvasMode || this.stickyKnown) return
        // decided once, on the first scroll into the section (at the top of the section both look the same)
        const r = this.root.getBoundingClientRect(), s = this.stage.getBoundingClientRect()
        if (r.top >= -1 || r.bottom <= s.height + 1) return
        this.stickyKnown = true
        if (Math.abs(s.top) <= 1) return
        this.stageFixed = true
        this.root.classList.add("hw-follow")
    }
    private followStage() {
        const r = this.root.getBoundingClientRect()
        this.stage.style.transform = `translateY(${clamp(-r.top, 0, Math.max(0, r.height - this.stage.clientHeight))}px)`
    }

    // ---------------------------------------------------------- room

    private startRoom() {
        if (this.glState === "ready" || this.glState === "compiling" || !this.canvas) return
        // a lost context has no extensions any more: the one from the start brings it back
        if (this.glState === "released" && this.loseExt) {
            // compiles again on webglcontextrestored; until then no second request
            this.glState = "compiling"
            this.loseExt.restoreContext()
            return
        }
        const gl = this.canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" })
        if (!gl) {
            this.root.classList.add("hw-nogl")
            this.hooks.note(this.canvasMode ? "WebGL 2 is not available here. Visitors see the walk without the room." : null)
            return
        }
        this.gl = gl
        this.loseExt = gl.getExtension("WEBGL_lose_context")
        this.canvas.addEventListener("webglcontextlost", this.onLost)
        this.canvas.addEventListener("webglcontextrestored", this.onRestored)
        this.compile()
    }
    /** Compiles and links the room; null if the device refuses (the reason goes to the editor). */
    private program(gl: WebGL2RenderingContext): { pr: WebGLProgram; fs: WebGLShader } | null {
        const sh = (type: number, src: string) => {
            const s = gl.createShader(type)
            if (!s) return null
            gl.shaderSource(s, src)
            gl.compileShader(s)
            return s
        }
        const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG)
        const pr = gl.createProgram()
        if (!vs || !fs || !pr) {
            this.failRoom("no shader")
            return null
        }
        gl.attachShader(pr, vs)
        gl.attachShader(pr, fs)
        gl.linkProgram(pr)
        return { pr, fs }
    }
    /** After linking: the uniforms, an empty vertex array (the triangle comes from gl_VertexID), ready. */
    private ready(gl: WebGL2RenderingContext, pr: WebGLProgram, fs: WebGLShader): boolean {
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
            this.failRoom(gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(pr) || "link failed")
            return false
        }
        gl.useProgram(pr)
        const u = {} as Uniforms
        for (const k of UNIFORMS) u[k] = gl.getUniformLocation(pr, k)
        this.u = u
        gl.bindVertexArray(gl.createVertexArray())
        this.glState = "ready"
        return true
    }
    private compile() {
        const gl = this.gl
        if (!gl) return
        const made = this.program(gl)
        if (!made) return
        const { pr, fs } = made
        this.glState = "compiling"
        const ext = gl.getExtension("KHR_parallel_shader_compile")
        const finish = () => {
            if (this.destroyed || !this.gl) return
            if (!this.ready(gl, pr, fs)) return
            this.root.classList.remove("hw-nogl")
            this.root.classList.add("hw-gl")
            this.sizeRoom()
            this.render()
        }
        // ask without waiting where the browser compiles in parallel; elsewhere the first question waits
        if (ext) {
            const poll = () => {
                if (this.destroyed) return
                if (gl.getProgramParameter(pr, ext.COMPLETION_STATUS_KHR)) finish()
                else {
                    const t = window.setTimeout(poll, 16)
                    this.timers.add(t)
                }
            }
            poll()
        } else {
            const t = window.setTimeout(finish, 0)
            this.timers.add(t)
        }
    }
    private failRoom(reason: string) {
        this.glState = "off"
        this.root.classList.add("hw-nogl")
        this.hooks.note(`The room could not be drawn (${reason}). Visitors see the walk without the room.`)
    }
    private onLost = (e: Event) => {
        e.preventDefault()
        this.glState = this.glState === "released" ? "released" : "lost"
        this.u = null
        this.root.classList.remove("hw-gl")
    }
    private onRestored = () => {
        this.glState = "off"
        this.compile()
    }
    private dropContext(final: boolean) {
        if (!this.gl) return
        const ext = this.loseExt
        if (final) {
            this.canvas?.removeEventListener("webglcontextlost", this.onLost)
            this.canvas?.removeEventListener("webglcontextrestored", this.onRestored)
            if (!this.gl.isContextLost()) ext?.loseContext()
            this.gl = null
            this.loseExt = null
            this.glState = "off"
            return
        }
        if (this.near || !ext || this.gl.isContextLost()) return
        this.glState = "released"
        ext.loseContext()
    }
    /** In the editor a new picture of the room only after a short quiet (a slider dragged in the panel). */
    private scheduleFrozen() {
        window.clearTimeout(this.frozenTimer)
        this.frozenTimer = window.setTimeout(() => this.drawFrozen(), 150)
    }
    /**
     * In the editor: the room drawn once on a fresh canvas, read back right after drawing in the same task (otherwise
     * the picture is empty), kept as the background of the stage, and the context given back: no live contexts there.
     */
    private drawFrozen() {
        if (this.destroyed || !this.g) return
        const cv = document.createElement("canvas")
        const gl = cv.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false })
        if (!gl) {
            this.root.classList.add("hw-nogl")
            this.hooks.note("WebGL 2 is not available here. Visitors see the walk without the room.")
            return
        }
        const made = this.program(gl)
        if (made && this.ready(gl, made.pr, made.fs)) {
            this.gl = gl
            this.surface = cv
            this.sizeRoom()
            this.render()
            const url = cv.toDataURL("image/jpeg", 0.9)
            this.stage.style.setProperty("--hw-frozen", `url(${url})`)
            this.root.classList.remove("hw-nogl")
            this.root.classList.add("hw-frozen")
        }
        gl.getExtension("WEBGL_lose_context")?.loseContext()
        this.gl = null
        this.u = null
        this.glState = "off"
        this.surface = this.canvas
    }
    private sizeRoom() {
        const cv = this.surface
        if (!cv || !this.g) return
        const { W, H } = this.g
        // one pixel per CSS pixel, at most 2.4 megapixels
        const s = Math.min(1, Math.sqrt(2.4e6 / (W * H)))
        const w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s))
        if (cv.width !== w || cv.height !== h) {
            cv.width = w
            cv.height = h
        }
        this.roomScale = w / W
        this.gl?.viewport(0, 0, w, h)
    }
    private drawRoom(vx: number, vy: number, ex: number, ey: number, c: number, near: number) {
        const gl = this.gl, U = this.u, g = this.g, cv = this.surface
        if (!gl || !U || this.glState !== "ready" || !cv) return
        const lin = (hex: string) => toLinear(hexRgb(hex))
        gl.uniform2f(U.uRes, cv.width, cv.height)
        gl.uniform1f(U.uScale, this.roomScale)
        gl.uniform2f(U.uVP, vx, vy)
        gl.uniform1f(U.uP, g.P)
        gl.uniform3f(U.uCam, ex, ey, c)
        gl.uniform3f(U.uRoom, g.xw, g.yc, g.yf)
        gl.uniform4f(U.uDoor, g.zEnd, g.dw, g.dh, g.T)
        gl.uniform3fv(U.uWall, lin(ROOM.wall))
        gl.uniform3fv(U.uFloor, lin(ROOM.floor))
        gl.uniform3fv(U.uCeil, lin(ROOM.ceil))
        gl.uniform3fv(U.uHaze, lin(ROOM.haze))
        gl.uniform3fv(U.uLight, toLinear(this.lightRgb))
        gl.uniform4f(U.uK, ROOM.amb, ROOM.rad, ROOM.density, ROOM.gloss)
        gl.uniform4f(U.uF, 0, g.gap * 0.42, ROOM.ao, near)
        gl.uniform1f(U.uExp, ROOM.ex)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    // ---------------------------------------------------------- frame

    private setO(c: CardRuntime, key: "o" | "so" | "vo" | "co" | "ro" | "do", el: HTMLElement | null, v: number) {
        if (!el) return
        const r = Math.round(v * 100) / 100
        if (c[key] === r) return
        c[key] = r
        el.style.opacity = String(r)
    }
    private softImg(c: CardRuntime, on: boolean) {
        if (!c.softImg || c.softImgOn === on) return
        c.softImgOn = on
        c.softImg.style.display = on ? "" : "none"
    }
    private show(c: CardRuntime, on: boolean) {
        if (c.shown === on) return
        c.shown = on
        // out of sight: no media, no layer; link and caption stay in the tree for the tab order (FP-3). A frame card keeps
        // its content (the card is transparent and takes no pointer there), so links and buttons in it stay reachable
        if (c.media && this.opt.cards[c.i]?.kind !== "frame") c.media.style.display = on ? "" : "none"
        c.el.style.willChange = on ? "transform, opacity" : "auto"
        c.el.style.pointerEvents = on ? "auto" : "none"
        if (!on) {
            c.el.style.opacity = "0"
            c.o = 0
            const g = this.g
            c.el.style.transform = `translate3d(${g.vp.x}px, ${g.vp.y}px, 0) scale(${(1 / (1 + g.far / g.P) / L).toFixed(4)})`
        }
    }

    render() {
        if (!this.g || this.destroyed) return
        const g = this.g, still = this.calm
        const p = this.canvasMode ? (this.opt.canvasEnd ? 1 : 0) : this.current
        const { c, u, U, after } = this.camera(p)
        const now = performance.now(), dt = (now - this.lastT) / 1000
        this.speed = dt > 0.25 || dt <= 0 ? 0 : this.speed + (Math.abs(c - this.lastC) / dt - this.speed) * Math.min(1, dt / 0.08)
        this.lastC = c
        this.lastT = now
        const blurAmt = still ? 0 : sstep(2.5 * g.gap, 9 * g.gap, this.speed)
        const { away0, cx, cy } = this.aim(c, still)
        // how much of the intro is still there (0 to 1); a caption that does not fit above it waits for it
        const io = 1 - sstep(0.04, 0.5, away0)
        const capWait = g.capHide && this.intro ? 1 - io : 1
        const ex = still ? 0 : this.ptr.x * g.push, ey = still ? 0 : this.ptr.y * g.push * 0.6
        const near = sstep(0.45, 1, c / g.zEnd)
        const focusRange = g.gap * (2.2 - 1.6 * this.opt.focus)
        const haze = mixRgb(hexRgb(ROOM.haze), this.lightRgb, (Math.round(near * 40) / 40) * 0.22)
        if (haze !== this.stage.style.getPropertyValue("--hw-haze")) this.stage.style.setProperty("--hw-haze", haze)
        // the camera stands: then a card without its soft canvas may show the CSS-blurred picture (never on moving layers)
        const camStill = still || (Math.abs(this.vel) < 1e-4 && Math.abs(this.midVel) < 1e-4)
        for (const cd of this.cards) {
            const dz = cd.i * g.gap - c
            if (!cd.requested && Math.abs(dz) < 1.5 * g.far) this.request(cd)
            const nearCut = g.phone ? -0.42 * g.P : -0.5 * g.P
            if (!still && (dz > g.far || dz < nearCut)) {
                this.show(cd, false)
                if (cd.rf && cd.rfShown) {
                    cd.rfShown = false
                    cd.rf.style.display = "none"
                }
                continue
            }
            this.show(cd, true)
            let sc: number, x: number, y: number, o: number, veil: number, sharp: number, cap: number
            let dim = still ? 0 : 1 - cd.lit
            if (still) {
                // calm: every card waits at its reading place, one fades into the next
                sc = 1
                x = cx + cd.X
                y = cy + cd.Y
                o = 1 - sstep(0.22 * g.gap, 0.58 * g.gap, Math.abs(dz))
                veil = 0
                sharp = 1
                cap = o
                if (g.phone) {
                    // phones: the cards stand in front of the doorway, so they fade over an opaque plate in the colour of
                    // the dark wall; the picture fades to dark, never to the light behind it
                    const plate = 1 - sstep(0.5 * g.gap, 0.58 * g.gap, Math.abs(dz))
                    dim = plate > 0.001 ? 1 - o / plate : 0
                    // the two captions never stand half on top of each other
                    cap = plate > 0.001 ? sstep(0.25, 1, o / plate) : 0
                    o = plate
                }
            } else {
                sc = g.P / (g.P + dz)
                x = cx + (cd.X - ex) * sc
                y = cy + (cd.Y - ey) * sc
                // on phones a passed card drops away below the frame, so the next one is never seen through it
                if (g.phone && dz < 0) y += (-dz / g.P) * g.H * 1.15
                const farFade = 1 - sstep(g.far * 0.7, g.far, dz)
                const nearFade = g.phone ? 1 - sstep(-0.08 * g.P, -0.34 * g.P, dz) : 1 - sstep(-0.2 * g.P, -0.46 * g.P, dz)
                o = farFade * nearFade
                veil = Math.pow(clamp((dz - 0.3 * g.gap) / (g.far - 0.3 * g.gap), 0, 1), 0.6) * 0.95
                const focusShare = this.opt.focus < 0.01 ? 1 : 1 - sstep(0.06 * g.gap, focusRange, Math.abs(dz))
                // until the soft canvas stands: the blurred picture while the camera stands, sharp while it moves
                if (cd.softReady) sharp = focusShare * (1 - 0.85 * blurAmt)
                else {
                    sharp = camStill ? focusShare : 1
                    this.softImg(cd, camStill)
                }
                cap = 1 - sstep(0.1 * g.gap, 0.3 * g.gap, Math.abs(dz))
            }
            cap *= capWait
            const tilt = still ? 0 : -cd.side * this.opt.tilt
            const turn = tilt ? ` perspective(${(g.P * L).toFixed(0)}px) rotateY(${tilt.toFixed(2)}deg)` : ""
            cd.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(sc / L).toFixed(4)})${turn}`
            this.setO(cd, "o", cd.el, o)
            this.setO(cd, "vo", cd.veil, veil)
            this.setO(cd, "so", cd.sharp, sharp)
            this.setO(cd, "co", cd.cap, cap)
            this.setO(cd, "do", cd.dim, dim)
            const zi = 20000 - Math.round(dz / 4)
            if (zi !== cd.zi) {
                cd.zi = zi
                cd.el.style.zIndex = String(zi)
            }
            // the mirror image in the floor: the card reflected at the floor plane, weaker in the haze
            if (cd.rf) {
                const ro = still || !cd.softReady ? 0 : o * (1 - veil * 0.85) * ROOM.refl * cd.lit * (g.phone ? 1 - 0.75 * (1 - clamp(c / g.gap, 0, 1)) : 1)
                if (ro < 0.004) {
                    if (cd.rfShown) {
                        cd.rfShown = false
                        cd.rf.style.display = "none"
                    }
                } else {
                    if (!cd.rfShown) {
                        cd.rfShown = true
                        cd.rf.style.display = ""
                    }
                    const yr = cy + (2 * g.yf - cd.Y - ey) * sc + (g.phone && dz < 0 ? (-dz / g.P) * g.H * 1.15 : 0)
                    cd.rf.style.transform = `translate3d(${x.toFixed(2)}px, ${yr.toFixed(2)}px, 0) scale(${(sc / L).toFixed(4)}, ${(-sc / L).toFixed(4)})${turn}`
                    this.setO(cd, "ro", cd.rf, ro)
                    cd.rf.style.zIndex = String(2000 - Math.round(dz / 10))
                }
            }
        }
        // the intro stays for the first card, then the eye leaves it: it steps back and goes out of focus
        if (this.intro) {
            const hb = still ? 0 : sstep(0.04, 0.5, away0)
            this.intro.style.opacity = io.toFixed(3)
            this.intro.style.transform = still ? "" : `translate3d(0, ${(-away0 * 28).toFixed(2)}px, 0)`
            this.intro.style.filter = hb > 0.02 && io >= 0.05 && !this.canvasMode ? `blur(${(hb * 6).toFixed(2)}px)` : ""
            this.intro.style.pointerEvents = io < 0.05 ? "none" : ""
        }
        this.loadEndSmall()
        if (!this.endBig && u > U.total * 0.5 - 0.0001) this.loadEnd()
        if (!this.endBig && (this.canvasMode || still)) this.loadEnd()
        const covered = this.door(c, u, U, after, cx, cy, ex, ey, still, blurAmt)
        // while the picture outside covers the whole stage the room is neither drawn nor shown: its canvas gives its
        // buffers back (about 90 MB of graphics memory on a 5K screen); it comes back drawn in the same frame
        if (!this.canvasMode && covered !== this.roomOff) {
            this.roomOff = covered
            if (this.canvas) this.canvas.style.display = covered ? "none" : ""
        }
        if (!covered) this.drawRoom(g.W / 2 + cx, g.H / 2 + cy, ex, ey, still ? 0 : c, still ? 0 : near)
        // On Arrive: once, when the way outside is half done going forward; again only after a return
        if (!this.canvasMode) {
            if (!this.arrived && after > 0.5) {
                this.arrived = true
                this.hooks.arrive()
            } else if (this.arrived && u < U.hall) this.arrived = false
        }
    }

    /** The doorway at the end: an opening in a thick wall with the world outside behind it. Places the outside; true when its picture covers the whole stage (then nothing of the room can be seen). */
    private door(c: number, u: number, U: ReturnType<Hall["units"]>, after: number, cx: number, cy: number, ex: number, ey: number, still: boolean, blurAmt: number): boolean {
        const g = this.g
        const out = this.outside, photo = this.photo
        if (!out || !photo) return false
        const eyeZ = (still ? 0 : c) - g.P
        const zE = g.zEnd, zF = zE + g.T
        const txt = sstep(0.25, 0.9, after)
        // the dark scrim only under light text: on the light of a missing picture it would grey the dark text's ground
        if (this.scrim) this.scrim.style.opacity = (this.endGone && this.opt.endInkDefault ? 0 : txt).toFixed(3)
        if (this.endText) {
            this.endText.style.opacity = txt.toFixed(3)
            this.endText.style.transform = still ? "" : `translate3d(0, ${((1 - txt) * 14).toFixed(2)}px, 0)`
            this.endText.style.pointerEvents = txt < 0.05 ? "none" : "auto"
        }
        const fx = (this.focusX() - 0.5) * g.bw
        const sharpOk = this.endDecoded ? 1 : 0
        if (still) {
            // calm: the picture fades in over the hallway at the end
            const o = this.canvasMode ? (this.opt.canvasEnd ? 1 : 0) : sstep(U.hall - 0.6, U.hall + 0.4, u)
            photo.style.transform = `translate(-50%, -50%) translate3d(${(-fx).toFixed(2)}px, 0, 0)`
            out.style.clipPath = ""
            out.style.opacity = o.toFixed(3)
            out.style.zIndex = "30000"
            out.style.display = o > 0 ? "block" : "none"
            if (this.glare) this.glare.style.opacity = "0"
            if (this.endSharp) this.endSharp.style.opacity = String(sharpOk)
            if (this.endMid) this.endMid.style.opacity = "1"
            if (this.expo) this.expo.style.display = "none"
            return this.outsideReady && o >= 0.999
        }
        // the picture is the world outside: a plane far behind the doorway that fills the frame once we are through
        const zP = zF + g.Dout
        const sP = g.P / Math.max(1, zP - eyeZ)
        const k = (g.Dout / g.P) * sP
        photo.style.transform = `translate(-50%, -50%) translate3d(${(cx - ex * sP - fx * k).toFixed(2)}px, ${(cy - ey * sP).toFixed(2)}px, 0) scale(${k.toFixed(4)})`
        const [l, r, t, b] = this.doorClip(eyeZ, cx, cy, ex, ey)
        out.style.clipPath = eyeZ >= zF ? "" : `inset(${t.toFixed(2)}px ${Math.max(0, g.W - r).toFixed(2)}px ${Math.max(0, g.H - b).toFixed(2)}px ${l.toFixed(2)}px)`
        const visible = r > l && b > t
        out.style.display = visible ? "block" : "none"
        out.style.opacity = visible ? "1" : "0"
        out.style.zIndex = String(20000 - Math.round((zE - c) / 4))
        // dimmed from afar, the shapes outside can be made out; bright for a moment on the way out, then the eye settles
        const dzDoor = zE - c
        const rise = sstep(zE, zF, eyeZ)
        const bump = Math.exp(-(((eyeZ - zF) / (g.T * 0.6)) ** 2))
        const settle = smoother(clamp(after / 0.45, 0, 1))
        const approach = 0.14 + 0.18 * sstep(0.6 * g.gap, 6 * g.gap, dzDoor)
        if (this.glare) this.glare.style.opacity = (Math.max(approach * (1 - rise), 0.32 * bump) * (1 - settle)).toFixed(3)
        const fo = bump * (1 - settle) * ROOM.flash
        if (this.expo) {
            this.expo.style.display = fo > 0.004 ? "block" : "none"
            this.expo.style.opacity = fo.toFixed(3)
        }
        // the eye focuses slowly on the way: from very soft far away over a middle blur to sharp
        const fb = this.opt.focus < 0.01 ? 0 : 0.9 * Math.pow(sstep(0.4 * g.gap, (2 + 6 * this.opt.focus) * g.gap, Math.max(0, dzDoor)), 0.85)
        // the middle stage (720 wide) grows large in the doorway sooner with few cards: then the large file comes early
        if (!this.endBig && fb < 0.8 && g.bw * k * (window.devicePixelRatio || 1) > 900) this.loadEnd()
        if (this.endMid) this.endMid.style.opacity = (1 - sstep(0.45, 1, fb)).toFixed(3)
        if (this.endSharp) this.endSharp.style.opacity = ((1 - sstep(0, 0.55, fb)) * (1 - 0.6 * blurAmt) * sharpOk).toFixed(3)
        // through the doorway the picture fills the frame (fitPhoto), its soft stage underneath is opaque
        return this.outsideReady && visible && eyeZ >= zF
    }

    // ---------------------------------------------------------- rides and focus

    /**
     * A ride to a place on the page: it pulls away slowly, travels, brakes softly; any input takes over at once.
     * It only runs after the visitor's own action (a pointer click on a link to a section of this page, or keyboard focus
     * on a card in the sticky stage, which keyboard users could not see otherwise), like the browser's own anchor jump: it
     * moves the page's scroll position and writes nothing outside the component (FP-16). A link opened from the keyboard
     * keeps the browser's own jump, so the next Tab starts at the target.
     */
    rideTo(toY: number, done?: () => void) {
        stopRide()
        const from = window.scrollY, dist = toY - from
        if (Math.abs(dist) < 2 || this.calm) {
            window.scrollTo({ top: toY, behavior: "instant" as ScrollBehavior })
            done?.()
            return
        }
        const D = Math.abs(dist), sign = Math.sign(dist)
        const tr = 1.1
        let vc = 1.3 * window.innerHeight
        if (D < vc * tr) vc = D / tr
        const tc = D / vc - tr, dur = (2 * tr + tc) * 1000
        const ramp = (t: number) => vc * (t / 2 - (tr / (2 * Math.PI)) * Math.sin((Math.PI * t) / tr))
        const pos = (t: number) => (t < tr ? ramp(t) : t < tr + tc ? vc * (tr / 2 + (t - tr)) : D - ramp(2 * tr + tc - t))
        const t0 = performance.now()
        rideOwner = this
        for (const ev of RIDE_STOP) window.addEventListener(ev, stopRide, { passive: true })
        const step = (now: number) => {
            const t = Math.min(1, (now - t0) / dur)
            window.scrollTo({ top: from + sign * pos(t * (dur / 1000)), behavior: "instant" as ScrollBehavior })
            if (t < 1) rideFrame = requestAnimationFrame(step)
            else {
                stopRide()
                done?.()
            }
        }
        rideFrame = requestAnimationFrame(step)
    }
    /** The page position where card i stands at the reading place (or the start, or the arrival outside). */
    scrollFor(i: number | "start" | "end"): number {
        const r = this.root.getBoundingClientRect()
        const top = r.top + window.scrollY
        const range = Math.max(1, r.height - this.g.H - this.rest())
        const U = this.units()
        const p = i === "start" ? 0 : i === "end" ? 1 : clamp(i / U.total, 0, 1)
        return top + p * range
    }
    focusCard(i: number | "start" | "end") {
        if (this.canvasMode) return
        this.rideTo(this.scrollFor(i))
    }
}

// ------------------------------------------------------------------ stylesheet

// One constant, no characters React escapes in text, every rule under the root class (hw-*). The calm surface where the
// room cannot be drawn uses the mean colours of the first picture of the room (#060605 top, #0A0807 middle, #070605
// walls, #050504 floor).
const CSS = `
.hw-root { position: relative; isolation: isolate; background: #050504; color: #ECE8E1; font-family: Inter, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.hw-root .hw-stage { position: sticky; top: 0; height: 100vh; max-height: 100%; overflow: hidden; contain: layout paint style; container-type: size; container-name: hw; background: radial-gradient(60% 70% at 52% 46%, #0A0807 0%, #070605 70%), linear-gradient(#060605, #050504); }
@supports (height: 100svh) { .hw-root .hw-stage { height: 100svh; } }
@supports (overflow: clip) { .hw-root .hw-stage { overflow: clip; } }
.hw-root.hw-follow .hw-stage { position: absolute; left: 0; right: 0; top: 0; }
.hw-root.hw-incanvas { background: #070605; container-type: inline-size; container-name: hwbox; }
.hw-root.hw-incanvas .hw-stage { position: relative; width: 100%; height: auto; aspect-ratio: 1.6; max-height: 100%; }
@container hwbox (max-width: 639.98px) { .hw-root.hw-incanvas .hw-stage { aspect-ratio: 390 / 844; } }
.hw-root .hw-room { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: 0; }
.hw-root.hw-gl .hw-room { opacity: 1; }
.hw-root.hw-gl .hw-stage { background: #050504; }
.hw-root.hw-frozen .hw-room { display: none; }
.hw-root.hw-frozen .hw-stage { background-image: var(--hw-frozen); background-size: cover; }
.hw-root .hw-refl { position: absolute; inset: 0; pointer-events: none; }
.hw-root .hw-cards { position: absolute; inset: 0; margin: 0; padding: 0; list-style: none; }
.hw-root .hw-cards { --hw-cw: min(clamp(230px, 20cqw, 330px), max(150px, calc((100cqh - 144px) * 0.5))); --hw-P: clamp(850px, 130cqh, 1350px); --hw-spx: min(calc(25cqw * var(--hw-spread, 1)), calc(50cqw - var(--hw-cw) / 2 - 28px)); }
.hw-root .hw-card { position: absolute; left: 50%; top: 50%; width: var(--hw-lw, calc(var(--hw-cw, 330px) * 1.6)); height: var(--hw-lh, calc(var(--hw-cw, 330px) * 2)); margin: calc(var(--hw-lh, calc(var(--hw-cw, 330px) * 2)) / -2) 0 0 calc(var(--hw-lw, calc(var(--hw-cw, 330px) * 1.6)) / -2); transform-origin: 50% 50%; backface-visibility: hidden; }
.hw-root .hw-card.hw-start { transform: translate3d(calc(var(--hw-cx0, 2cqw) + var(--i-side) * var(--hw-spx) * var(--i-s)), calc(-3cqh + var(--i-y) * 100cqh * var(--i-s)), 0) scale(calc(var(--i-s) / 1.6)) perspective(calc(var(--hw-P) * 1.6)) rotateY(calc(var(--i-side) * var(--hw-tilt, 12) * -1deg)); }
.hw-root .hw-cards .hw-card:first-child { --hw-spx: min(calc(25cqw * var(--hw-spread, 1)), calc(50cqw - var(--hw-cw) / 2 - 28px), max(0px, calc(50cqw - var(--hw-cw) / 2 - 24px - var(--hw-cx0, 2cqw)))); }
.hw-root .hw-card.hw-park { opacity: 0; pointer-events: none; transform: translate3d(2cqw, -3cqh, 0) scale(0.1); }
.hw-root .hw-card a.hw-link, .hw-root .hw-card .hw-plain { position: absolute; inset: 0; display: block; color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent; }
.hw-root .hw-media { position: absolute; inset: 0; overflow: hidden; border-radius: var(--hw-r, 4.8px); background: #070605; box-shadow: var(--hw-shadow); }
.hw-root img:not([src]) { visibility: hidden; }
.hw-root .hw-media img, .hw-root .hw-media canvas, .hw-root .hw-rf img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.hw-root .hw-soft, .hw-root .hw-soft-img { transform: scale(1.04); }
.hw-root .hw-soft-img { filter: blur(calc(var(--hw-lw, calc(var(--hw-cw, 330px) * 1.6)) * 0.023)); transform: scale(1.14); }
.hw-root .hw-veil { position: absolute; inset: -1px; background: var(--hw-haze, #0E0C0A); opacity: 0; pointer-events: none; }
.hw-root .hw-dim { position: absolute; inset: -1px; background: #000; opacity: 0; pointer-events: none; }
.hw-root .hw-frame { position: absolute; left: 0; top: 0; width: calc(100% / 1.6); height: calc(100% / 1.6); transform: scale(1.6); transform-origin: 0 0; }
.hw-root .hw-cap { position: absolute; left: 0; top: calc(100% + var(--hw-k, 1.6) * 10px); width: 100%; pointer-events: none; }
.hw-root .hw-ct { opacity: 0; }
.hw-root .hw-cap span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hw-root .hw-cap .hw-t { font-weight: 500; letter-spacing: -0.005em; line-height: 1.25; }
.hw-root .hw-cap .hw-m { margin-top: calc(var(--hw-k, 1.6) * 3px); line-height: 1.25; }
.hw-root .hw-card a.hw-link:focus { outline: none; }
.hw-root .hw-card a.hw-link:focus-visible .hw-media { outline: 3.2px solid var(--hw-ink); outline-offset: 3.2px; box-shadow: 0 0 0 9.6px #050504; }
.hw-root .hw-rf { position: absolute; left: 50%; top: 50%; width: var(--hw-lw, 528px); height: var(--hw-lh, 660px); margin: calc(var(--hw-lh, 660px) / -2) 0 0 calc(var(--hw-lw, 528px) / -2); overflow: hidden; border-radius: var(--hw-r, 4.8px); -webkit-mask-image: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.4) 28%, rgba(0, 0, 0, 0) 64%); mask-image: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.4) 28%, rgba(0, 0, 0, 0) 64%); }
.hw-root .hw-intro { position: absolute; z-index: 40000; left: max(48px, 5.5cqw); bottom: 13cqh; width: min(34cqw, 520px); color: var(--hw-intro); }
.hw-root .hw-intro h2 { margin: 0; font-size: var(--hw-h1); overflow-wrap: break-word; }
.hw-root .hw-intro .hw-p { font-size: var(--hw-p1); }
.hw-root .hw-end-text .hw-eh { font-size: var(--hw-h2); }
.hw-root .hw-end-text .hw-ep { font-size: var(--hw-p2); max-width: 44ch; }
.hw-root .hw-intro p { margin: 22px 0 0; max-width: 36ch; color: var(--hw-intro-soft); }
.hw-root .hw-go { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 12px 26px; }
.hw-root .hw-go a, .hw-root .hw-end-text a { color: inherit; text-decoration: none; padding-bottom: 3px; border-bottom: 1px solid var(--hw-line); }
.hw-root .hw-go .hw-lab { padding-bottom: 3px; border-bottom: 1px solid transparent; }
.hw-root .hw-go a:focus-visible, .hw-root .hw-end-text a:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
.hw-root .hw-out { position: absolute; inset: 0; display: none; }
.hw-root .hw-photo { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); transform-origin: 50% 50%; will-change: transform; }
.hw-root .hw-photo img, .hw-root .hw-photo canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.hw-root .hw-end-soft { transform: scale(1.04); }
.hw-root .hw-glare { position: absolute; inset: -1px; background: var(--hw-light); opacity: 0; }
.hw-root .hw-scrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10, 9, 8, 0.62), rgba(10, 9, 8, 0.18) 38%, rgba(10, 9, 8, 0) 60%); opacity: 0; }
.hw-root .hw-end-text { position: absolute; z-index: 30000; left: max(48px, 5.5cqw); right: max(48px, 5.5cqw); bottom: 10cqh; color: var(--hw-ending); opacity: 0; pointer-events: none; }
.hw-root .hw-end-text h2 { margin: 0; overflow-wrap: break-word; }
.hw-root .hw-end-text p { margin: 16px 0 0; }
.hw-root .hw-end-text a { display: inline-block; margin-top: 22px; border-bottom-color: var(--hw-ending-line); }
.hw-root .hw-end-text .hw-lab { display: inline-block; margin-top: 22px; }
.hw-root .hw-expo { position: absolute; inset: 0; z-index: 45000; display: none; background: var(--hw-light); opacity: 0; pointer-events: none; mix-blend-mode: screen; }
.hw-root .hw-veil, .hw-root .hw-sharp, .hw-root .hw-dim, .hw-root .hw-ct, .hw-root .hw-glare, .hw-root .hw-end-mid, .hw-root .hw-end-sharp { will-change: opacity; }
.hw-root .hw-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.hw-root .hw-note { position: absolute; left: 8px; bottom: 8px; z-index: 50000; max-width: calc(100% - 16px); padding: 6px 10px; border-radius: 4px; background: rgba(255, 255, 255, 0.94); color: rgb(28, 27, 25); box-shadow: 0 0 0 1px rgba(28, 27, 25, 0.16); font: 13px/18px system-ui, sans-serif; pointer-events: none; }
@media (hover: hover) and (pointer: fine) { .hw-root .hw-card a.hw-link .hw-sharp { transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1); } .hw-root .hw-card a.hw-link:hover .hw-sharp { transform: scale(1.035); } }
@container hw (max-width: 759px) {
  .hw-root .hw-end-text .hw-ep { font-size: var(--hw-p-phone); }
  .hw-root .hw-end-text .hw-eh { font-size: var(--hw-h2-phone); }
  .hw-root .hw-end-text { left: 20px; right: 20px; bottom: 32px; }
}
@container hw (max-width: 639.98px) {
  .hw-root .hw-intro { left: 20px; right: 20px; width: auto; bottom: max(28px, 4.5cqh); }
  .hw-root .hw-intro h2 { font-size: var(--hw-h1-phone); line-height: var(--hw-h1-lh-phone) !important; letter-spacing: var(--hw-h1-ls-phone) !important; }
  .hw-root .hw-intro .hw-p { font-size: var(--hw-p-phone); }
  .hw-root .hw-intro p { margin-top: 12px; }
  .hw-root .hw-go { margin-top: 16px; }
  .hw-root .hw-intro h2 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .hw-root .hw-intro p { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .hw-root .hw-cards { --hw-tmin: 24px; --hw-mmin: 22.4px; --hw-ih: var(--hw-introh, 0px); --hw-cw: clamp(120px, min(64cqw, calc((100cqh - var(--hw-ih) - max(28px, 4.5cqh) - 116px) * 0.688), calc((100cqh - var(--hw-ih) - max(28px, 4.5cqh) - 114px - var(--hw-caph, 36px)) * 0.8)), 64cqw); --hw-P: clamp(680px, 105cqh, 1000px); --hw-yp: min(calc((28px - var(--hw-ih) - max(28px, 4.5cqh)) / 2 + 10px), calc(50cqh - var(--hw-ih) - max(28px, 4.5cqh) - 42px - var(--hw-caph, 36px) - var(--hw-cw) * 0.625)); }
  .hw-root .hw-card.hw-start { transform: translate3d(calc(var(--i-side) * 7.5cqw * var(--hw-spread, 1) * var(--i-sp)), calc(-22cqh + (var(--hw-yp) + var(--i-yp) * 50cqh + 22cqh) * var(--i-sp)), 0) scale(calc(var(--i-sp) / 1.6)) perspective(calc(var(--hw-P) * 1.6)) rotateY(calc(var(--i-side) * var(--hw-tilt, 12) * -1deg)); }
}
@container hw (max-width: 374.98px) { .hw-root .hw-cards { --hw-ih: var(--hw-introh-n, var(--hw-introh, 0px)); } }
@media (prefers-reduced-motion: reduce) { .hw-root .hw-card a.hw-link .hw-sharp { transition: none; } }
`

// ------------------------------------------------------------------ component

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 5400
 * @framerDisableUnlink
 */
export default function Hallway(props: Props) {
    const { cards: cardsProp = DEMO_CARD_LIST, frames, onArrive, onCardClick, intro: introProp, ending: endingProp, motion, layout, fonts, colors, styling, style } = props
    const isStatic = useIsStaticRenderer()
    const inCanvas = RenderTarget.current() === RenderTarget.canvas
    const [mounted, setMounted] = useState(false)
    const [note, setNote] = useState<string | null>(null)
    const [short, setShort] = useState(false)
    const rootRef = useRef<HTMLElement>(null)
    const hallRef = useRef<Hall | null>(null)
    const hooksRef = useRef({ onArrive, onCardClick })
    hooksRef.current = { onArrive, onCardClick }
    const uid = `hw${useId().replace(/[^a-zA-Z0-9]/g, "")}`

    // ---- the model from the panel
    const frameList = useMemo(() => Children.toArray(frames), [frames])
    const cards = useMemo(() => {
        const list = Array.isArray(cardsProp) ? cardsProp.slice(0, MAX_CARDS) : []
        return list.map((c, i) => {
            const card = c && typeof c === "object" ? c : {}
            const title = str(card.title)
            const demo = DEMO_CARDS[i]
            const own = card.image && typeof card.image.src === "string" && card.image.src ? card.image : null
            // a demo picture only while the card has no picture of its own and still carries the demo title
            const image = own || (demo && title === demo.title && demo.image.src ? demo.image : null)
            const frameNo = Math.round(num(card.frame, 0))
            const frame = frameNo > 0 && frameNo <= frameList.length ? frameList[frameNo - 1] : null
            const link = frame ? "" : str(card.link)
            const noFrame = frameNo > 0 && !frame ? frameNo : 0
            return { i, title: title || `Card ${i + 1}`, meta: str(card.meta), link, image, frame, noFrame, alt: frame ? "" : str(image?.alt) }
        })
    }, [cardsProp, frameList])
    const intro = { ...DEMO_INTRO, ...(introProp && typeof introProp === "object" ? introProp : {}) }
    const hasIntro = !!(str(intro.heading) || str(intro.text) || str(intro.label1) || str(intro.label2))
    const ending = endingProp && typeof endingProp === "object" ? endingProp : {}
    const endTitle = str(ending.title ?? DEMO_ENDING.title)
    const ownEnd = ending.image && typeof ending.image.src === "string" && ending.image.src ? ending.image : null
    const endImage = ownEnd || (endTitle === DEMO_ENDING.title && DEMO_ENDING.image.src ? DEMO_ENDING.image : null)
    const endAlt = str(endImage?.alt)
    const shiftIn = clamp(num(ending.shift, 0), -20, 20)
    const shift = !ownEnd && endImage ? clamp(shiftIn + DEMO_ENDING.shift, -30, 20) : shiftIn
    const mo = motion && typeof motion === "object" ? motion : {}
    const lay = layout && typeof layout === "object" ? layout : {}
    const col = colors && typeof colors === "object" ? colors : {}
    const sty = styling && typeof styling === "object" ? styling : {}
    const light = cssColor(col.light, ROOM.light)
    const introInk = cssColor(col.intro, INK)
    const capInk = cssColor(col.captions, INK)
    const endInk = cssColor(col.ending, ENDING_INK)
    const endOnLight = !endImage && sameRgb(endInk, ENDING_INK)
    const radius = radiusPx(sty.radius)
    const options: Options = {
        cards: cards.map((c) => ({ kind: c.frame ? "frame" : c.image ? "picture" : "plain", src: c.image?.src || "", srcSet: c.image?.srcSet || "", alt: "", hasLink: !!c.link })),
        endSrc: endImage?.src || "",
        endSrcSet: endImage?.srcSet || "",
        shift,
        focus: clamp(num(mo.focus, 70), 0, 100) / 100,
        parallax: clamp(num(mo.parallax, 35), 0, 100) / 100,
        spread: clamp(num(lay.spread, 100), 50, 150) / 100,
        tilt: clamp(num(lay.tilt, 12), 0, 30),
        light,
        lightAuto: cssColor(col.light, "") === "",
        canvasEnd: mo.canvas === "end",
        hasIntro,
        endInkDefault: sameRgb(endInk, ENDING_INK),
    }
    const optionsRef = useRef(options)
    optionsRef.current = options
    const optionsKey = [
        options.cards.map((c) => `${c.kind}|${c.src}|${c.hasLink ? 1 : 0}`).join(","),
        options.endSrc, options.shift, options.focus, options.parallax, options.spread, options.tilt, options.light, options.lightAuto ? 1 : 0, options.canvasEnd ? 1 : 0, options.hasIntro ? 1 : 0, options.endInkDefault ? 1 : 0,
    ].join(";")

    useEffect(() => setMounted(true), [])

    // the engine lives while the instance does; it is made after the first paint, in the browser only
    const liveRun = mounted && (!isStatic || inCanvas)
    useBrowserLayoutEffect(() => {
        const root = rootRef.current
        if (!liveRun || !root) return
        const hall = new Hall(root, optionsRef.current, { note: (r) => setNote(r), arrive: () => hooksRef.current.onArrive?.(), short: (on) => setShort(on) }, inCanvas)
        hallRef.current = hall
        return () => {
            hall.destroy()
            hallRef.current = null
        }
    }, [liveRun, inCanvas])
    useEffect(() => {
        hallRef.current?.update(optionsRef.current)
    }, [optionsKey])

    // ---- links: a section on the same page is reached by a ride after a pointer click; from the keyboard (a click with
    // detail 0) the browser jumps itself and moves the Tab order there. Any other address navigates as usual. The target
    // is read by its id only (the address the buyer set), nothing outside the component is changed (FP-16)
    const go = (href: string, e: { preventDefault: () => void; detail: number }) => {
        if (!href || typeof location === "undefined" || e.detail === 0) return
        let url: URL
        try {
            url = new URL(href, location.href)
        } catch (err) {
            if (err instanceof TypeError) return
            throw err
        }
        const id = url.hash ? decodeURIComponent(url.hash.slice(1)) : ""
        if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && id) {
            const target = document.getElementById(id)
            const hall = hallRef.current
            if (target && hall) {
                e.preventDefault()
                const r = target.getBoundingClientRect()
                hall.rideTo(window.scrollY + r.top - Math.max(0, (window.innerHeight - r.height) / 2))
            }
        }
    }
    /** A label is a link only with a usable address; without one it stays text (no underline, no tab stop). */
    const hasHref = (href: string) => !!href && !/^\s*(javascript|vbscript):/i.test(href)
    const linkProps = (href: string) => {
        let external = false
        // known only in the browser: switched after the mount, so server and first render agree
        if (mounted && href) {
            try {
                external = new URL(href, location.href).origin !== location.origin
            } catch (err) {
                if (!(err instanceof TypeError)) throw err
            }
        }
        // without an address (or with a script address) the label stays text: no tab stop, no jump to the top
        if (!href || /^\s*(javascript|vbscript):/i.test(href)) return {}
        return external ? { href, target: "_blank", rel: "noopener" } : { href }
    }

    // a ride on keyboard focus only: a click focuses too, and the page must not move under the pointer
    const rideOnFocus = (where: number | "start" | "end") => (e: { target: EventTarget }) => {
        if (e.target instanceof Element && byKeyboard(e.target)) hallRef.current?.focusCard(where)
    }

    // ---- type: sizes follow the stage (cqw), the control size is the upper limit
    const hf = fonts?.heading, tf = fonts?.text
    const r = fontSizePx(hf, 64) / 64, t = fontSizePx(tf, 17) / 17
    const headingFont = fontStyle(hf, { weight: 500, lineHeight: 0.98, letterSpacing: "-0.038em" })
    const textFont = fontStyle(tf, { weight: 400, lineHeight: 1.45, letterSpacing: "0em" })
    // phones: the intro title a little tighter in leading and spacing (+0.04, +0.004em), like the reference
    const headLh = parseFloat(String(headingFont.lineHeight)), headLs = parseFloat(String(headingFont.letterSpacing))
    const headPhoneLh = Number.isFinite(headLh) ? String(round2(headLh + 0.04)) : "normal"
    const headPhoneLs = Number.isFinite(headLs) ? `${Math.round((headLs + 0.004) * 1000) / 1000}em` : "normal"
    const size = (min: number, fluid: number, max: number) => `max(11px, clamp(${round2(min)}px, ${round2(fluid)}cqw, ${round2(max)}px))`
    const vars = {
        "--hw-r": `${round2(radius * L)}px`,
        "--hw-spread": String(options.spread),
        "--hw-tilt": String(options.tilt),
        "--hw-cx0": hasIntro ? "13.5cqw" : "2cqw",
        "--hw-introh": `${hasIntro ? introHeightPhone(str(intro.heading), str(intro.text), !!(str(intro.label1) || str(intro.label2)), r, t) : 0}px`,
        // stages under 375 wide: a narrower text column, so more lines
        "--hw-introh-n": `${hasIntro ? introHeightPhone(str(intro.heading), str(intro.text), !!(str(intro.label1) || str(intro.label2)), r, t, 320) : 0}px`,
        // caption height for the start on phones, where titles stay at least 15 px and the second line 14 px (so about
        // 12 px at a hold, Jan and Konsti 29.10.2026); the engine measures it later; without an intro the limit is off
        "--hw-caph": hasIntro ? `${round2(Math.max(15, 14 * t) * 1.25 + (cards.some((c) => c.meta) ? 3 + Math.max(14, 12.5 * t) * 1.25 : 0))}px` : "-9999px",
        "--hw-h1": size(36 * r, 4.1 * r, 64 * r),
        "--hw-h1-phone": `${round2(Math.max(11, 34 * r))}px`,
        "--hw-p1": size(15 * t, 1.1 * t, 17 * t),
        "--hw-h2": size(40 * r, 5.6 * r, 88 * r),
        "--hw-h2-phone": `${round2(Math.max(11, 40 * r))}px`,
        "--hw-p2": size(15 * t, 1.2 * t, 18 * t),
        "--hw-p-phone": `${round2(Math.max(11, 15 * t))}px`,
        "--hw-h1-lh-phone": headPhoneLh,
        "--hw-h1-ls-phone": headPhoneLs,
        "--hw-k": String(L),
        "--hw-shadow": shadowCss(sty.shadow),
        "--hw-ink": capInk,
        "--hw-intro": introInk,
        "--hw-intro-soft": `color-mix(in srgb, ${introInk}, transparent 30%)`,
        "--hw-line": `color-mix(in srgb, ${introInk}, transparent 87%)`,
        "--hw-light": light,
        "--hw-ending": endOnLight ? ENDING_ON_LIGHT : endInk,
        "--hw-ending-line": `color-mix(in srgb, ${endOnLight ? ENDING_ON_LIGHT : endInk}, transparent 60%)`,
    } as CSSProperties

    const n = cards.length
    // editor hints: a load error first, then what keeps the hallway from working
    // a card that asks for a frame Frames does not have falls back to its picture (or plain surface), named here
    const lost = cards.find((c) => c.noFrame > 0)
    const hint = !inCanvas ? null
        : note || (n === 0 ? "No cards yet: add up to 12 under Cards." : lost ? `Card ${lost.i + 1}: Frames has no frame ${lost.noFrame}.` : short ? `Set the height to about ${350 + 40 * Math.max(MIN_HALL, n)}vh for the walk.` : null)

    return (
        <section
            ref={rootRef}
            className={`hw-root ${uid}${inCanvas ? " hw-incanvas" : ""}`}
            aria-label={str(intro.heading) || "Gallery"}
            style={{ ...style, ...vars }}
        >
            {/* static stylesheet: a module constant, no props or CMS values */}
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="hw-stage">
                <canvas className="hw-room" aria-hidden="true" />
                <div className="hw-refl" aria-hidden="true">
                    {cards.map((c) =>
                        c.image && !c.frame ? (
                            <div key={c.i} className="hw-rf" data-i={c.i} style={{ display: "none" }}>
                                <img alt="" decoding="async" draggable={false} />
                            </div>
                        ) : null,
                    )}
                </div>
                <div className="hw-out">
                    <div className="hw-photo" aria-hidden="true">
                        <canvas className="hw-end-soft" />
                        <canvas className="hw-end-mid" />
                        <img className="hw-end-sharp" alt={endImage?.alt || ""} decoding="async" style={{ opacity: 0 }} />
                        <div className="hw-glare" />
                    </div>
                    <div className="hw-scrim" aria-hidden="true" />
                </div>
                {hasIntro ? (
                    <div className="hw-intro">
                        {str(intro.heading) ? <h2 className="hw-h" style={headingFont}>{intro.heading}</h2> : null}
                        {str(intro.text) ? <p className="hw-p" style={textFont}>{intro.text}</p> : null}
                        {str(intro.label1) || str(intro.label2) ? (
                            <div className="hw-go" style={{ ...textFont, fontSize: 15 * t, fontWeight: 500 }}>
                                {str(intro.label1) ? (
                                    hasHref(str(intro.link1)) ? (
                                        <a {...linkProps(str(intro.link1))} onFocus={rideOnFocus("start")} onClick={(e) => go(str(intro.link1), e)}>
                                            {intro.label1}
                                        </a>
                                    ) : (
                                        <span className="hw-lab">{intro.label1}</span>
                                    )
                                ) : null}
                                {str(intro.label2) ? (
                                    hasHref(str(intro.link2)) ? (
                                        <a {...linkProps(str(intro.link2))} onFocus={rideOnFocus("start")} onClick={(e) => go(str(intro.link2), e)}>
                                            {intro.label2}
                                        </a>
                                    ) : (
                                        <span className="hw-lab">{intro.label2}</span>
                                    )
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                ) : null}
                <ul className="hw-cards" aria-label="Gallery">
                    {cards.map((c) => {
                        const pic = c.image && !c.frame
                        const ok = pic && c.image && allowedStatic(c.image.src || "")
                        const first = c.i < 3
                        const look = startLook(c.i, options.focus, n)
                        const later = { "data-src": c.image?.src || "", "data-srcset": c.image?.srcSet || "" } as Record<string, string>
                        const media = (
                            <div className="hw-media">
                                {c.frame ? (
                                    <div className="hw-frame">{c.frame}</div>
                                ) : pic ? (
                                    <>
                                        <img className="hw-soft-img" crossOrigin="anonymous" sizes="96px" {...(ok && first && !(c.i === 0 && isStatic && !inCanvas) ? { srcSet: c.image?.srcSet || undefined, src: c.image?.src } : later)} alt="" decoding="async" draggable={false} />
                                        <img className="hw-soft" alt="" decoding="async" draggable={false} />
                                        <img
                                            className="hw-sharp"
                                            crossOrigin="anonymous"
                                            sizes={`${Math.round(330 * L)}px`}
                                            {...(ok && first ? { srcSet: c.image?.srcSet || undefined, src: c.image?.src } : later)}
                                            {...(first ? ({ fetchpriority: c.i === 0 ? "high" : "auto" } as Record<string, string>) : {})}
                                            style={{ opacity: first ? look.sharp : 0 }}
                                            alt=""
                                            decoding="async"
                                            draggable={false}
                                        />
                                    </>
                                ) : null}
                                <div className="hw-dim" style={{ opacity: look.dim }} />
                                <div className="hw-veil" style={{ opacity: look.veil }} />
                            </div>
                        )
                        const caption = (
                            <div className="hw-cap">
                                <div className="hw-ct" style={{ color: "var(--hw-ink)", opacity: first ? look.cap : 0 }}>
                                    <span className="hw-t" style={{ ...textFont, fontWeight: 500, letterSpacing: "-0.005em", lineHeight: 1.25, fontSize: `max(${round2(Math.max(11, 14 * t) * L)}px, var(--hw-tmin, 0px))` }}>{c.title}</span>
                                    {c.alt ? (
                                        <span className="hw-sr" id={`${uid}-a${c.i}`}>
                                            {c.alt}
                                        </span>
                                    ) : null}
                                    {c.meta ? <span className="hw-m" style={{ ...textFont, lineHeight: 1.25, fontSize: `max(${round2(Math.max(11, 12.5 * t) * L)}px, var(--hw-mmin, 0px))`, color: `color-mix(in srgb, ${capInk}, transparent 30%)` }}>{c.meta}</span> : null}
                                </div>
                            </div>
                        )
                        return (
                            <li
                                key={c.i}
                                className={`hw-card ${first ? "hw-start" : "hw-park"}`}
                                style={{ zIndex: 20000 - c.i * 100, ...({ "--i-side": c.i % 2 === 0 ? 1 : -1, "--i-y": round2(ROW_D[c.i % ROW_D.length] + 0.01), "--i-yp": ROW_P[c.i % ROW_P.length], "--i-s": round2(1 / (1 + 0.58 * c.i) * 1e4) / 1e4, "--i-sp": round2(1 / (1 + 0.62 * c.i) * 1e4) / 1e4 } as CSSProperties) }}
                            >
                                {c.link ? (
                                    <a
                                        className="hw-link"
                                        {...linkProps(c.link)}
                                        aria-label={c.meta ? `${c.title}, ${c.meta}` : c.title}
                                        aria-describedby={c.alt ? `${uid}-a${c.i}` : undefined}
                                        onFocus={rideOnFocus(c.i)}
                                        onClick={(e) => {
                                            hooksRef.current.onCardClick?.()
                                            go(c.link, e)
                                        }}
                                    >
                                        {media}
                                        {caption}
                                    </a>
                                ) : (
                                    <div className="hw-plain" onFocus={c.frame ? rideOnFocus(c.i) : undefined}>
                                        {media}
                                        {caption}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
                {endTitle || str(ending.text ?? DEMO_ENDING.text) || str(ending.label ?? DEMO_ENDING.label) || endAlt ? (
                    <div className="hw-end-text">
                        {endAlt ? <span className="hw-sr">{endAlt}</span> : null}
                        {endTitle ? <h2 className="hw-eh" style={headingFont}>{endTitle}</h2> : null}
                        {str(ending.text ?? DEMO_ENDING.text) ? <p className="hw-ep" style={textFont}>{str(ending.text ?? DEMO_ENDING.text)}</p> : null}
                        {str(ending.label ?? DEMO_ENDING.label) ? (
                            hasHref(str(ending.link)) ? (
                                <a {...linkProps(str(ending.link))} onFocus={rideOnFocus("end")} onClick={(e) => go(str(ending.link), e)} style={{ ...textFont, fontSize: 15 * t, fontWeight: 500 }}>
                                    {str(ending.label ?? DEMO_ENDING.label)}
                                </a>
                            ) : (
                                <span className="hw-lab" style={{ ...textFont, fontSize: 15 * t, fontWeight: 500 }}>
                                    {str(ending.label ?? DEMO_ENDING.label)}
                                </span>
                            )
                        ) : null}
                    </div>
                ) : null}
                <div className="hw-expo" aria-hidden="true" />
                {inCanvas && hint ? <div className="hw-note" aria-hidden="true">{hint}</div> : null}
            </div>
        </section>
    )
}

// ------------------------------------------------------------------ panel (Framer)

const noFrame = (c: CardProps) => num(c.frame, 0) > 0
addPropertyControls(Hallway, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: MAX_CARDS,
        description: "Height in vh: about 350 plus 40 per card, counting at least 3.",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Card" },
                meta: { type: ControlType.String, title: "Caption", defaultValue: "" },
                link: { type: ControlType.Link, title: "Link", hidden: noFrame },
                frame: { type: ControlType.Number, title: "Frame", min: 0, max: MAX_CARDS, step: 1, displayStepper: true, defaultValue: 0, description: "A frame from Frames instead of the image; 0 for none." },
            },
        },
        defaultValue: DEMO_CARD_LIST,
    },
    frames: { type: ControlType.Slot, title: "Frames", description: "Your own frames. Pick one per card under Frame." },
    // flat: event handlers
    onArrive: { type: ControlType.EventHandler, title: "On Arrive", description: "Fires each time the visitor steps outside." },
    onCardClick: { type: ControlType.EventHandler, title: "Card Click" },
    intro: {
        type: ControlType.Object,
        title: "Intro",
        controls: {
            heading: { type: ControlType.String, title: "Heading", defaultValue: DEMO_INTRO.heading, displayTextArea: true },
            text: { type: ControlType.String, title: "Text", defaultValue: DEMO_INTRO.text, displayTextArea: true },
            label1: { type: ControlType.String, title: "Label 1", defaultValue: DEMO_INTRO.label1 },
            link1: { type: ControlType.Link, title: "Link 1" },
            label2: { type: ControlType.String, title: "Label 2", defaultValue: DEMO_INTRO.label2 },
            link2: { type: ControlType.Link, title: "Link 2" },
        },
    },
    ending: {
        type: ControlType.Object,
        title: "Ending",
        controls: {
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            title: { type: ControlType.String, title: "Title", defaultValue: DEMO_ENDING.title },
            text: { type: ControlType.String, title: "Text", defaultValue: DEMO_ENDING.text, displayTextArea: true },
            label: { type: ControlType.String, title: "Label", defaultValue: DEMO_ENDING.label },
            link: { type: ControlType.Link, title: "Link" },
            shift: { type: ControlType.Number, title: "Shift", min: -20, max: 20, step: 1, unit: "%", defaultValue: 0, description: "Negative shows more of the left. Phones and other portrait screens only." },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            focus: { type: ControlType.Number, title: "Blur", min: 0, max: 100, step: 1, unit: "%", defaultValue: 70, description: "Blur of the cards away from the reading spot." },
            parallax: { type: ControlType.Number, title: "Parallax", min: 0, max: 100, step: 1, unit: "%", defaultValue: 35, description: "How far the view follows the pointer." },
            canvas: { type: ControlType.Enum, title: "Canvas", options: ["start", "end"], optionTitles: ["Start", "End"], displaySegmentedControl: true, defaultValue: "start", description: "Only in the editor: shows the start or the arrival." },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            spread: { type: ControlType.Number, title: "Spread", min: 50, max: 150, step: 1, unit: "%", defaultValue: 100 },
            tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 30, step: 1, unit: "°", defaultValue: 12 },
        },
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        controls: {
            heading: { type: ControlType.Font, title: "Heading", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 64, variant: "Medium", lineHeight: "0.98em", letterSpacing: "-0.038em" } },
            text: { type: ControlType.Font, title: "Text", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 17, variant: "Regular", lineHeight: "1.45em", letterSpacing: "0em" } },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            intro: { type: ControlType.Color, title: "Intro", optional: true },
            captions: { type: ControlType.Color, title: "Captions", optional: true },
            light: { type: ControlType.Color, title: "Light", optional: true, description: "Empty: taken from the ending picture." },
            ending: { type: ControlType.Color, title: "Ending", defaultValue: ENDING_INK },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "3px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEFAULT_SHADOW },
        },
    },
})
