// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"

// Measure before the browser paints (client only) so the first frame is
// already the right size; falls back to useEffect on the server (no warning).
const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

type MediaType = "image" | "video"
type EffectMode =
    | "slide"
    | "fade"
    | "stack"
    | "zoom"
    | "parallax"
    | "flip"
    | "cards"
type ImgValue = { src?: string } | string | undefined
type ArrowLayout = "sides" | "grouped"
type CaptionPos = "bottom" | "top" | "below" | "above"
type ArrowMode = "default" | "custom"
type ArrowCorner =
    | "topLeft"
    | "topRight"
    | "topCenter"
    | "bottomLeft"
    | "bottomRight"
    | "bottomCenter"

type RawItem = {
    type?: MediaType
    image?: ImgValue
    video?: string
    poster?: ImgValue
    caption?: string
    link?: string
}
type Slide = {
    type: MediaType
    src?: string
    poster?: string
    caption?: string
    link?: string
}

interface Tf {
    x: number
    y: number
    z: number
    rotY: number
    rot?: number // in-plane (2D) rotation, for the Cards fan
    scale: number
    opacity: number
    zIndex: number
    inner: number
    innerScale: number
}

const ASPECTS: Record<string, number> = {
    "3:4": 3 / 4,
    "4:5": 4 / 5,
    "1:1": 1,
    "4:3": 4 / 3,
    "3:2": 3 / 2,
    "16:9": 16 / 9,
}

const DEFAULTS: Slide[] = [
    {
        type: "image",
        src: "https://framerusercontent.com/images/AwTTcIiqtZAceAXABWDjtx2U84g.jpg",
        caption: "Aperture",
    },
    {
        type: "image",
        src: "https://framerusercontent.com/images/xZfvoNc8OJ3rMjisxWiCErOO4s.jpg",
        caption: "Northlight",
    },
    {
        type: "image",
        src: "https://framerusercontent.com/images/iQEmpKPbXrczxMeKsD2tQMD4nI.jpg",
        caption: "Cadence",
    },
    {
        type: "image",
        src: "https://framerusercontent.com/images/YmKTXLk3mtmL6YEAAPWdemmW6g.jpg",
        caption: "Meridian",
    },
    {
        type: "image",
        src: "https://framerusercontent.com/images/UHBTTjmNrTIVqr7zegW9l6geJSM.jpg",
        caption: "Vellum",
    },
    {
        type: "image",
        src: "https://framerusercontent.com/images/xZ5z4pdalV3XbzqLveOiXbiASCY.jpg",
        caption: "Atlas Press",
    },
]

function resolveSrc(value: ImgValue): string | undefined {
    if (!value) return undefined
    return typeof value === "string" ? value : value.src
}

function clamp(v: number, lo: number, hi: number) {
    return v < lo ? lo : v > hi ? hi : v
}

// Per-slide transform for the chosen effect. `rel` is the slide's signed
// distance from the centered position, in slide units (0 = centered). The
// returned x/y are offsets FROM the already-centered slide (slides are
// centered with margin:auto), so no -50% translate is baked in here.
function effectTransform(
    mode: EffectMode,
    rel: number,
    step: number,
    intensity: number
): Tf {
    const a = clamp(rel, -4, 4)
    const ar = Math.abs(a)

    if (mode === "fade") {
        return {
            x: 0,
            y: 0,
            z: 0,
            rotY: 0,
            scale: 1,
            opacity: clamp(1 - ar, 0, 1),
            zIndex: Math.round(100 - ar * 10),
            inner: 0,
            innerScale: 1,
        }
    }

    if (mode === "parallax") {
        // editorial: slides ride a clean track while the image inside them
        // counter-drifts, so the photo lags the frame. The inner translate is
        // a % of the frame width and the image is overscanned by `innerScale`;
        // the drift MUST stay inside that overscan margin or it slides past its
        // own edge and reveals the slide background (the "cutting" bug).
        const innerScale = 1.28 // 14% overscan on each side
        const margin = ((innerScale - 1) / 2) * 100 * 0.95 // ~13.3% safe limit
        return {
            x: a * step,
            y: 0,
            z: 0,
            rotY: 0,
            scale: 1,
            opacity: clamp(1.5 - ar * 0.5, 0, 1),
            zIndex: Math.round(100 - ar * 10),
            inner: clamp(-a * 10 * intensity, -margin, margin),
            innerScale,
        }
    }

    if (mode === "flip") {
        // 3D card flip in place: cards share the center spot (x:0) and pivot on
        // Y through 180deg, so the outgoing card's BACK faces away (hidden by
        // backfaceVisibility) while the next turns in — one card visible at a
        // time, with a natural edge-on blank at the exact midpoint.
        return {
            x: 0,
            y: 0,
            z: 0,
            rotY: -clamp(a, -1, 1) * 180,
            scale: 1,
            opacity: clamp((0.5 - ar) * 6, 0, 1),
            zIndex: Math.round(100 - ar * 10),
            inner: 0,
            innerScale: 1,
        }
    }

    if (mode === "cards") {
        // fanned deck: upcoming cards fan out behind with a slight tilt;
        // passed cards slide off to the side.
        if (a >= 0) {
            const k = Math.min(a, 4)
            return {
                x: k * 10 * intensity,
                y: k * 8 * intensity,
                z: 0,
                rotY: 0,
                rot: k * 4 * intensity,
                scale: 1 - k * 0.05,
                opacity: clamp(1.3 - k * 0.34, 0, 1),
                zIndex: Math.round(100 - k * 10),
                inner: 0,
                innerScale: 1,
            }
        }
        return {
            x: a * step * 1.05,
            y: 0,
            z: 0,
            rotY: 0,
            rot: a * 8,
            scale: 1,
            opacity: clamp(1 + a * 0.8, 0, 1),
            zIndex: Math.round(100 + a * 10),
            inner: 0,
            innerScale: 1,
        }
    }

    if (mode === "stack") {
        if (a >= 0) {
            const k = Math.min(a, 4)
            return {
                x: k * 16 * intensity,
                y: k * 14 * intensity,
                z: 0,
                rotY: 0,
                scale: 1 - k * 0.06,
                opacity: clamp(1.3 - k * 0.3, 0, 1),
                zIndex: Math.round(100 - k * 10),
                inner: 0,
                innerScale: 1,
            }
        }
        return {
            x: a * step,
            y: 0,
            z: 0,
            rotY: 0,
            scale: 1,
            opacity: clamp(1 + a * 0.7, 0, 1),
            zIndex: Math.round(100 + a * 10),
            inner: 0,
            innerScale: 1,
        }
    }

    if (mode === "zoom") {
        const f = clamp(1 - ar, 0, 1)
        // neighbors sit at innerScale 1.2 (10% margin); clamp the counter-drift
        // so it can't slide past that margin and reveal the slide background
        return {
            x: a * step,
            y: 0,
            z: 0,
            rotY: 0,
            scale: 1,
            opacity: clamp(1.5 - ar * 0.5, 0, 1),
            zIndex: Math.round(100 - ar * 10),
            inner: clamp(-a * 10 * intensity, -9.5, 9.5),
            innerScale: 1.2 + f * 0.16 * intensity,
        }
    }

    // slide (default): clean horizontal track with neighbor peek.
    return {
        x: a * step,
        y: 0,
        z: 0,
        rotY: 0,
        scale: 1,
        opacity: clamp(1.5 - ar * 0.5, 0, 1),
        zIndex: Math.round(100 - ar * 10),
        inner: 0,
        innerScale: 1,
    }
}

function tfString(t: Tf): string {
    return (
        "translate3d(" +
        t.x.toFixed(2) +
        "px," +
        t.y.toFixed(2) +
        "px," +
        t.z.toFixed(2) +
        "px) rotateY(" +
        t.rotY.toFixed(2) +
        "deg) rotate(" +
        (t.rot ?? 0).toFixed(2) +
        "deg) scale(" +
        t.scale.toFixed(3) +
        ")"
    )
}

// Anchor a grouped arrow container to one corner with x/y insets.
function cornerAnchor(
    corner: ArrowCorner,
    x: number,
    y: number
): React.CSSProperties {
    switch (corner) {
        case "topLeft":
            return { top: y, left: x }
        case "topRight":
            return { top: y, right: x }
        case "topCenter":
            return { top: y, left: "50%", transform: "translateX(-50%)" }
        case "bottomLeft":
            return { bottom: y, left: x }
        case "bottomCenter":
            return { bottom: y, left: "50%", transform: "translateX(-50%)" }
        default:
            return { bottom: y, right: x }
    }
}

// Find the CMS ROW that wraps one media element: walk up until going one
// higher would pull in a second media (i.e. the next row). That largest
// single-media wrapper is the Collection List item, so its text is this
// slide's bound Text layer(s).
function rowTextFor(media: Element, probe: HTMLElement): string {
    let row: Element = media
    let el: Element | null = media.parentElement
    while (el && el !== probe) {
        if (el.querySelectorAll("img, video").length > 1) break
        row = el
        el = el.parentElement
    }
    if (row === media) return ""
    const raw = (row as HTMLElement).innerText || row.textContent || ""
    // first non-empty line = the primary text (title/caption)
    const line = raw
        .split("\n")
        .map((s) => s.trim())
        .find((s) => s.length > 0)
    return line || ""
}

// Read every <img>/<video> the user's slot rendered, plus the wrapping anchor
// href and the row's TEXT (a bound Text layer) as the caption — falling back
// to the img alt when the row has no text. The slot-probe pattern: let Framer
// render the Collection List off-screen, then read the DOM.
function extractFromProbe(probe: HTMLElement | null): Slide[] {
    if (!probe) return []
    const out: Slide[] = []
    const seen = new Set<string>()
    const medias = probe.querySelectorAll("img, video")
    medias.forEach((m) => {
        let src = ""
        const isVideo = m.tagName === "VIDEO"
        if (isVideo) {
            const v = m as HTMLVideoElement
            const source = v.querySelector("source")
            src = v.currentSrc || v.src || (source ? source.src : "")
        } else {
            const im = m as HTMLImageElement
            src = im.currentSrc || im.src || ""
        }
        if (!src || seen.has(src)) return
        seen.add(src)
        const anchor = m.closest("a")
        const rowText = rowTextFor(m, probe)
        const alt = !isVideo ? (m as HTMLImageElement).alt || "" : ""
        const caption = rowText || alt
        out.push({
            type: isVideo ? "video" : "image",
            src,
            caption,
            link: anchor ? anchor.getAttribute("href") || undefined : undefined,
        })
    })
    return out
}

// Click the real Framer-generated anchor inside the probe so dynamic CMS
// routes resolve correctly in Preview and live (not just same-origin).
function mediaSrc(m: Element): string {
    if (m.tagName === "VIDEO") {
        const v = m as HTMLVideoElement
        const s = v.querySelector("source")
        return v.currentSrc || v.src || (s ? s.src : "")
    }
    const im = m as HTMLImageElement
    return im.currentSrc || im.src || ""
}

// Click the CMS row's anchor by ROW INDEX (deduped in the same order as
// extractFromProbe), NOT by matching a src string. `currentSrc` is a responsive
// value the browser silently re-resolves (and MutationObserver can't see it, so
// the stored src drifts) — matching it breaks click-through after the layout
// settles or images upgrade resolution. Index stays stable.
function clickAnchorByIndex(probe: HTMLElement | null, idx: number): boolean {
    if (!probe || idx < 0) return false
    const medias = probe.querySelectorAll("img, video")
    const seen = new Set<string>()
    let k = -1
    for (let i = 0; i < medias.length; i++) {
        const ms = mediaSrc(medias[i])
        if (!ms || seen.has(ms)) continue
        seen.add(ms)
        k++
        if (k === idx) {
            const a = medias[i].closest("a") as HTMLAnchorElement | null
            if (a) {
                a.click()
                return true
            }
            return false
        }
    }
    return false
}

// Fallback: match by src (kept for the rare case the index path misses).
function clickSourceAnchor(probe: HTMLElement | null, src?: string): boolean {
    if (!probe || !src) return false
    const medias = probe.querySelectorAll("img, video")
    for (let i = 0; i < medias.length; i++) {
        if (mediaSrc(medias[i]) === src) {
            const a = medias[i].closest("a") as HTMLAnchorElement | null
            if (a) {
                a.click()
                return true
            }
        }
    }
    return false
}

function navigateManual(link?: string) {
    if (!link || typeof document === "undefined") return
    const a = document.createElement("a")
    a.href = link
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

// ---------------------------------------------------------------------------
// Optional WebGL2 hover FX — a single overlay canvas over the ACTIVE (centered)
// slide. Off by default; alpha is driven by an eased hover amount so it only
// appears when you hover the centered slide at rest, and stays invisible during
// drag / transitions (the real slides animate underneath). No npm deps.
// ---------------------------------------------------------------------------
type HoverMode =
    | "off"
    | "rgb"
    | "ripple"
    | "zoom"
    | "glitch"
    | "swirl"
    | "pixelate"
    | "shine"
const HOVER_MODE_IDX: Record<HoverMode, number> = {
    off: 0,
    rgb: 1,
    ripple: 2,
    zoom: 3,
    glitch: 4,
    swirl: 5,
    pixelate: 6,
    shine: 7,
}

const FX_VERT = `#version 300 es
precision highp float;
out vec2 v_uv;
void main(){
    vec2 p = vec2((gl_VertexID == 1) ? 3.0 : -1.0, (gl_VertexID == 2) ? 3.0 : -1.0);
    gl_Position = vec4(p, 0.0, 1.0);
    // 0..1 with y measured from the TOP so it matches CSS cursor space
    v_uv = vec2((p.x + 1.0) * 0.5, 1.0 - (p.y + 1.0) * 0.5);
}`

const FX_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_img;
uniform vec2 u_mouse;
uniform float u_hover;
uniform float u_time;
uniform int u_mode;
uniform float u_intensity;
uniform float u_radius;
uniform float u_baseScale;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// object-fit: cover mapping from box uv -> image uv, with the slider effect's
// inner scale (e.g. Zoom's 1.2) applied around center so the overlay matches
// the real slide instead of popping between scales.
vec2 coverUV(vec2 uv){
    uv = (uv - 0.5) / max(u_baseScale, 0.001) + 0.5;
    vec2 r = u_res / max(u_img, vec2(1.0));
    float f = max(r.x, r.y);
    vec2 size = u_img * f;
    vec2 off = (size - u_res) * 0.5;
    return (uv * u_res + off) / size;
}
void main(){
    vec2 uv = v_uv;
    vec2 m = u_mouse;
    float d = distance(uv, m);
    // fade the displacement out at the very edges so no sample reaches past
    // the image and streaks the border pixel
    float edge = smoothstep(0.0, 0.05, uv.x) * smoothstep(0.0, 0.05, 1.0 - uv.x)
               * smoothstep(0.0, 0.05, uv.y) * smoothstep(0.0, 0.05, 1.0 - uv.y);
    float infl = smoothstep(u_radius, 0.0, d) * u_hover * edge;
    vec2 dir = normalize(uv - m + vec2(1e-4));
    vec3 col;
    if (u_mode == 1) {
        // RGB shift — chromatic split that grows toward the cursor
        float amt = infl * 0.035 * u_intensity;
        col = vec3(
            texture(u_tex, coverUV(uv + dir * amt)).r,
            texture(u_tex, coverUV(uv)).g,
            texture(u_tex, coverUV(uv - dir * amt)).b
        );
    } else if (u_mode == 2) {
        // Ripple — a water wave radiating from the cursor
        float w = sin(d * 42.0 - u_time * 6.5) * 0.016 * u_intensity * infl;
        vec2 duv = uv + dir * w;
        float ca = infl * 0.012 * u_intensity;
        col = vec3(
            texture(u_tex, coverUV(duv + dir * ca)).r,
            texture(u_tex, coverUV(duv)).g,
            texture(u_tex, coverUV(duv - dir * ca)).b
        );
    } else if (u_mode == 3) {
        // Zoom lens — a soft magnifying bulge under the cursor
        float lens = infl * 0.4 * u_intensity;
        vec2 duv = uv - (uv - m) * lens;
        float ca = infl * 0.01 * u_intensity;
        col = vec3(
            texture(u_tex, coverUV(duv + dir * ca)).r,
            texture(u_tex, coverUV(duv)).g,
            texture(u_tex, coverUV(duv - dir * ca)).b
        );
    } else if (u_mode == 4) {
        // Glitch — horizontal slice tears + RGB split near the cursor row
        float rows = 14.0;
        float line = floor(uv.y * rows);
        float rnd = hash(vec2(line, floor(u_time * 14.0)));
        float vprox = smoothstep(u_radius, 0.0, abs(uv.y - m.y)); // shape only
        // everything scaled by u_hover so the glitch fully clears at rest
        float sh = (rnd - 0.5) * 0.08 * u_intensity * (0.35 + vprox) * step(0.6, rnd) * edge * u_hover;
        vec2 duv = uv + vec2(sh, 0.0);
        float ca = 0.02 * u_intensity * u_hover * edge * (0.4 + 0.6 * vprox);
        col = vec3(
            texture(u_tex, coverUV(duv + vec2(ca, 0.0))).r,
            texture(u_tex, coverUV(duv)).g,
            texture(u_tex, coverUV(duv - vec2(ca, 0.0))).b
        );
    } else if (u_mode == 5) {
        // Twist — a refined whirl: the rotation eases smoothly toward the
        // cursor (squared falloff) and stays gentle, so it reads as a soft
        // silk swirl rather than a hard rigid spin. A faint inward draw gives
        // a whirlpool depth and a whisper of chroma polishes the rim.
        vec2 p = uv - m;
        float fall = smoothstep(u_radius, 0.0, length(p)); // 1 at cursor -> 0
        float ang = fall * fall * 1.7 * u_intensity * u_hover * edge;
        float s = sin(ang), cc = cos(ang);
        vec2 rp = vec2(p.x * cc - p.y * s, p.x * s + p.y * cc);
        vec2 duv = m + rp * (1.0 - fall * 0.10 * u_intensity * u_hover);
        float ca = fall * 0.006 * u_intensity * u_hover;
        vec2 dir2 = normalize(p + vec2(1e-4));
        col = vec3(
            texture(u_tex, coverUV(duv + dir2 * ca)).r,
            texture(u_tex, coverUV(duv)).g,
            texture(u_tex, coverUV(duv - dir2 * ca)).b
        );
    } else if (u_mode == 6) {
        // Pixelate — a mosaic that grows near the cursor, resolves at rest
        float cells = mix(1000.0, 16.0, infl);
        vec2 blocky = (floor(uv * cells) + 0.5) / cells;
        vec2 duv = mix(uv, blocky, infl); // infl 0 -> exact uv -> plain
        col = texture(u_tex, coverUV(duv)).rgb;
    } else if (u_mode == 7) {
        // Shine — a diagonal light sheen that sweeps across while hovering
        col = texture(u_tex, coverUV(uv)).rgb;
        float sweep = fract(u_time * 0.4);
        float diag = uv.x * 0.7 + (1.0 - uv.y) * 0.3;
        float band = smoothstep(0.11, 0.0, abs(diag - sweep));
        col += band * u_hover * 0.5 * u_intensity;
    } else {
        col = texture(u_tex, coverUV(uv)).rgb;
    }
    // fully opaque: the overlay occludes the real <img> instead of blending
    // over it (blending two near-identical copies is what caused the shimmer).
    // u_hover drives the distortion amount only, not the alpha.
    o = vec4(col, 1.0);
}`

function compileFx(gl: WebGL2RenderingContext, type: number, src: string) {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh)
        gl.deleteShader(sh)
        throw new Error(log || "shader compile failed")
    }
    return sh
}

interface Props {
    width?: number
    height?: number
    source?: "manual" | "cms"
    items?: RawItem[]
    collectionSlot?: React.ReactNode
    layout?: {
        slideWidth?: number
        heightMode?: "aspect" | "fill"
        aspect?: keyof typeof ASPECTS
        gap?: number
    }
    motion?: {
        effect?: EffectMode
        intensity?: number
        smoothing?: number
        autoplay?: boolean
        autoplaySpeed?: number
        pauseOnHover?: boolean
        loop?: boolean
        drag?: boolean
        wheel?: boolean
    }
    navigation?: {
        showArrows?: boolean
        arrowMode?: ArrowMode
        prevArrow?: React.ReactNode
        nextArrow?: React.ReactNode
        prevArrowImage?: ImgValue
        nextArrowImage?: ImgValue
        arrowLayout?: ArrowLayout
        arrowCorner?: ArrowCorner
        offsetX?: number
        offsetY?: number
        arrowGap?: number
        arrowSize?: number
        arrowColor?: string
        arrowBackground?: boolean
        arrowBgColor?: string
        showDots?: boolean
        dotColor?: string
        dotActiveColor?: string
        dotSize?: number
        dotActiveWidth?: number
        dotGap?: number
        dotBottom?: number
    }
    hover?: {
        effect?: HoverMode
        intensity?: number
        radius?: number
    }
    caption?: {
        show?: boolean
        position?: CaptionPos
        font?: React.CSSProperties
        size?: number
        align?: "left" | "center" | "right"
        color?: string
        background?: boolean
        bgColor?: string
        padding?: number
    }
    style?: {
        background?: string
        radius?: number
        // legacy (pre-caption-group) — still read as a fallback
        showCaptions?: boolean
        captionColor?: string
    }
}

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CMSSlider(props: Props) {
    const {
        width,
        height,
        source,
        items,
        collectionSlot,
        layout,
        motion,
        navigation,
        hover,
        caption,
        style,
    } = props

    const src = source ?? "manual"

    const hoverMode = (hover?.effect ?? "off") as HoverMode
    const hoverIntensity = clamp(hover?.intensity ?? 1, 0, 2)
    const hoverRadius = clamp(hover?.radius ?? 0.55, 0.1, 1.5)

    const slideWidthPct = clamp(layout?.slideWidth ?? 64, 20, 100)
    const heightMode = layout?.heightMode ?? "aspect"
    const aspectKey = layout?.aspect ?? "3:2"
    const aspect = ASPECTS[aspectKey] ?? 3 / 2
    const gap = layout?.gap ?? 24

    const effect = motion?.effect ?? "slide"
    const intensity = clamp(motion?.intensity ?? 1, 0, 2)
    const ease = clamp(motion?.smoothing ?? 0.12, 0.02, 0.4)
    const autoplay = motion?.autoplay ?? false
    const autoMs = clamp(motion?.autoplaySpeed ?? 3.5, 0.5, 20) * 1000
    const pauseOnHover = motion?.pauseOnHover ?? true
    const loop = motion?.loop ?? true
    const dragEnabled = motion?.drag ?? true
    const wheel = motion?.wheel ?? false

    const showArrows = navigation?.showArrows ?? true
    const arrowMode = navigation?.arrowMode ?? "default"
    const prevArrow = navigation?.prevArrow
    const nextArrow = navigation?.nextArrow
    const prevArrowSrc = resolveSrc(navigation?.prevArrowImage)
    const nextArrowSrc = resolveSrc(navigation?.nextArrowImage)
    const arrowLayout = navigation?.arrowLayout ?? "sides"
    const arrowCorner = navigation?.arrowCorner ?? "bottomRight"
    const arrowOffX = navigation?.offsetX ?? 16
    const arrowOffY = navigation?.offsetY ?? 16
    const arrowGap = navigation?.arrowGap ?? 10
    const arrowSize = clamp(navigation?.arrowSize ?? 40, 16, 200)
    const arrowColor = navigation?.arrowColor ?? "#FFFFFF"
    const arrowBackground = navigation?.arrowBackground ?? true
    const arrowBgColor = navigation?.arrowBgColor ?? "rgba(0,0,0,0.28)"

    const showDots = navigation?.showDots ?? true
    const dotColor = navigation?.dotColor ?? "#FFFFFF"
    const dotActiveColor = navigation?.dotActiveColor ?? dotColor
    const dotSize = clamp(navigation?.dotSize ?? 8, 2, 40)
    const dotActiveWidth = clamp(navigation?.dotActiveWidth ?? 22, dotSize, 160)
    const dotGap = clamp(navigation?.dotGap ?? 8, 0, 60)
    const dotBottom = navigation?.dotBottom ?? 16

    const background = style?.background ?? "#0A0A0A"
    const radius = style?.radius ?? 12

    // Caption config (new group; falls back to the old style.* fields so any
    // existing instance keeps its captions).
    const capShow = caption?.show ?? style?.showCaptions ?? false
    const capPos = (caption?.position ?? "bottom") as CaptionPos
    const capFont = caption?.font ?? {}
    const capSize = clamp(caption?.size ?? 15, 8, 120)
    const capAlign = (caption?.align ?? "center") as "left" | "center" | "right"
    const capColor = caption?.color ?? style?.captionColor ?? "#FFFFFF"
    const capBg = caption?.background ?? true
    const capBgColor = caption?.bgColor ?? "rgba(0,0,0,0.55)"
    const capPad = clamp(caption?.padding ?? 16, 0, 160)
    const capOnCard = capPos === "bottom" || capPos === "top"

    const seedHeight = typeof height === "number" && height > 0 ? height : 520
    // Seed the WIDTH from the frame's real pixel width too (Framer passes it),
    // so the very first paint isn't computed from a wrong 800px guess and then
    // resized — that jump is the "small size flash" on load.
    const seedWidth = typeof width === "number" && width > 0 ? width : 800

    const isStatic = useIsStaticRenderer()

    const stageRef = useRef<HTMLDivElement>(null)
    const probeRef = useRef<HTMLDivElement>(null)
    const slideRefs = useRef<Array<HTMLDivElement | null>>([])
    const innerRefs = useRef<Array<HTMLDivElement | null>>([])

    const offsetRef = useRef(0)
    const targetRef = useRef(0)
    const downRef = useRef(false)
    const draggingRef = useRef(false)
    const startXRef = useRef(0)
    const startOffsetRef = useRef(0)
    const movedRef = useRef(0)
    const idxRef = useRef(0)
    const lastAutoRef = useRef(0)
    const hoverRef = useRef(false)
    const rafRef = useRef<number | null>(null)
    const velRef = useRef(0) // drag velocity (slide units/frame) for flick
    const lastVRef = useRef(0) // last offset sample, to derive velocity
    const lastTickRef = useRef(0) // for frame-rate-independent snap easing

    // ---- WebGL hover-FX refs (all no-op unless a Hover FX mode is chosen) ----
    const fxCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const fxGlRef = useRef<{
        gl: WebGL2RenderingContext
        program: WebGLProgram
        vao: WebGLVertexArrayObject
        tex: WebGLTexture
        loc: Record<string, WebGLUniformLocation | null>
    } | null>(null)
    const fxMouseRef = useRef<[number, number]>([0.5, 0.5]) // eased (drawn)
    const fxMouseTargetRef = useRef<[number, number]>([0.5, 0.5]) // raw cursor
    const fxHoverAmtRef = useRef(0)
    const fxLastNowRef = useRef(0) // for frame-rate-independent easing
    const fxLoadedRef = useRef<{ idx: number; img: [number, number] }>({
        idx: -1,
        img: [1, 1],
    })
    const fxLoadingRef = useRef(false)
    const fxFailedRef = useRef(false) // hard fail: no WebGL2 at all
    const fxTaintRef = useRef<Set<number>>(new Set()) // per-slide CORS taint
    const fxOverImageRef = useRef(false) // cursor is over the centered image
    const lastWheelRef = useRef(0) // suppress hover FX right after a scroll step

    const [index, setIndex] = useState(0)
    // Seed the measured size from the frame so the fit is correct on first
    // paint and SSR, before the ResizeObserver runs against the real box.
    const [stageSize, setStageSize] = useState({ w: seedWidth, h: seedHeight })
    const [probed, setProbed] = useState<Slide[]>([])

    const manual = useMemo<Slide[]>(() => {
        if (!items || items.length === 0) return DEFAULTS
        const list: Slide[] = []
        for (const it of items) {
            if (!it) continue
            const type: MediaType = it.type === "video" ? "video" : "image"
            list.push({
                type,
                src: type === "video" ? it.video : resolveSrc(it.image),
                poster: resolveSrc(it.poster),
                caption: it.caption,
                link: it.link,
            })
        }
        return list.length ? list : DEFAULTS
    }, [items])

    const slides = useMemo<Slide[]>(() => {
        if (src === "cms") return probed.length ? probed : DEFAULTS
        return manual
    }, [src, probed, manual])

    const n = slides.length

    // WIDTH-FIRST sizing: the card width is a share of the frame width (Slide
    // Width %). In Aspect mode the height follows from the ratio and is capped
    // to the frame height so it never crops; Fill makes the card full height.
    // The leftover frame width is the neighbor peek. Centered with margin:auto.
    //
    // NOTE: measurement uses clientWidth/clientHeight (true layout px), NOT
    // getBoundingClientRect — the latter is scaled by the Framer canvas zoom,
    // which made the card a different size in the editor vs live. clientWidth is
    // zoom-independent, so at the same frame size the card matches everywhere.
    const frameW = Math.max(40, stageSize.w)
    const frameH = Math.max(40, stageSize.h)
    let slideW = Math.max(40, Math.round((frameW * slideWidthPct) / 100))
    let slideH: number
    if (heightMode === "fill") {
        slideH = frameH
    } else {
        slideH = Math.round(slideW / aspect)
        if (slideH > frameH) {
            slideH = frameH
            slideW = Math.round(slideH * aspect)
        }
    }
    const step = slideW + gap

    // Live mirrors so the long-lived rAF / listeners read fresh values.
    const cfgRef = useRef({
        mode: effect,
        intensity,
        ease,
        autoplay,
        autoMs,
        pauseOnHover,
        loop,
        drag: dragEnabled,
        n,
        step,
    })
    cfgRef.current = {
        mode: effect,
        intensity,
        ease,
        autoplay,
        autoMs,
        pauseOnHover,
        loop,
        drag: dragEnabled,
        n,
        step,
    }
    const slidesRef = useRef<Slide[]>(slides)
    slidesRef.current = slides
    const sourceRef = useRef(src)
    sourceRef.current = src

    // The centered slide's inner image scale for the CURRENT slider effect
    // (Zoom scales the middle image ~1.2). The overlay must sample at the same
    // base scale, or engaging it "pops" the image between magnified and normal.
    const fxBaseScale = effectTransform(effect, 0, step, intensity).innerScale

    // Live mirror the hover-FX rAF reads without restarting.
    const fxCfgRef = useRef({
        modeIdx: HOVER_MODE_IDX[hoverMode],
        intensity: hoverIntensity,
        radius: hoverRadius,
        slideW,
        slideH,
        frameW,
        frameH,
        radiusPx: radius,
        baseScale: fxBaseScale,
    })
    fxCfgRef.current = {
        modeIdx: HOVER_MODE_IDX[hoverMode],
        intensity: hoverIntensity,
        radius: hoverRadius,
        slideW,
        slideH,
        frameW,
        frameH,
        radiusPx: radius,
        baseScale: fxBaseScale,
    }
    const fxOn = hoverMode !== "off" && !isStatic

    // Measure the stage with clientWidth/Height (zoom-independent layout px).
    // A LAYOUT effect so the real size is applied BEFORE the first paint, so
    // there's no visible small-size flash while it settles.
    useIsoLayoutEffect(() => {
        const stage = stageRef.current
        if (!stage) return
        const measure = () =>
            setStageSize((s) => {
                const w = stage.clientWidth || seedWidth
                const h = stage.clientHeight || seedHeight
                return s.w === w && s.h === h ? s : { w, h }
            })
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(stage)
        return () => ro.disconnect()
    }, [seedHeight, seedWidth])

    // CMS slot probe. Runs in canvas too (it only READS the slot DOM, no
    // animation) so connected CMS items show in the editor, not just live.
    useEffect(() => {
        if (src !== "cms") return
        const probe = probeRef.current
        if (!probe) return
        const update = () => setProbed(extractFromProbe(probe))
        update()
        const mo = new MutationObserver(update)
        mo.observe(probe, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true, // re-read when bound Text content changes
            attributeFilter: ["src", "srcset", "currentSrc", "href", "alt"],
        })
        return () => mo.disconnect()
    }, [src, collectionSlot])

    // Wheel driver (opt-in; traps page scroll while hovered). Smooth like Depth
    // Wave Gallery: the wheel/trackpad delta is accumulated into the SAME eased
    // target the drag uses (continuous, fractional), then it glide-snaps to the
    // nearest slide once the wheel goes idle — no discrete one-step-per-gesture
    // clunk, no trackpad-momentum runaway.
    useEffect(() => {
        if (isStatic || !wheel) return
        const stage = stageRef.current
        if (!stage) return
        let idleTimer: ReturnType<typeof setTimeout> | null = null
        const PPS = 110 // wheel pixels per slide-unit (bigger = less sensitive)
        const AHEAD = 2.4 // how far the target may lead the visible offset
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const raw =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            if (Math.abs(raw) < 0.5) return
            const c = cfgRef.current
            // mark the scroll so the hover FX stays out of its way
            const nowMs =
                typeof performance !== "undefined" ? performance.now() : 0
            lastWheelRef.current = nowMs
            lastAutoRef.current = nowMs // don't let autoplay fight the scroll
            // clamp a single event so one huge delta can't jump the whole track
            const d = clamp(raw, -60, 60) / PPS
            let v = targetRef.current + d
            // keep the target near what's on screen: momentum feel, but a hard
            // flick can't overshoot the whole gallery at once
            v = clamp(
                v,
                offsetRef.current - AHEAD,
                offsetRef.current + AHEAD
            )
            if (!c.loop) v = clamp(v, 0, Math.max(0, c.n - 1))
            targetRef.current = v
            // glide-snap to the nearest slide shortly after scrolling stops
            if (idleTimer) clearTimeout(idleTimer)
            idleTimer = setTimeout(() => {
                const cc = cfgRef.current
                let s = Math.round(targetRef.current)
                if (!cc.loop) s = clamp(s, 0, Math.max(0, cc.n - 1))
                targetRef.current = s
            }, 130)
        }
        stage.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            stage.removeEventListener("wheel", onWheel)
            if (idleTimer) clearTimeout(idleTimer)
        }
    }, [isStatic, wheel])

    // Main loop: autoplay, snap easing, and per-slide transforms.
    useEffect(() => {
        if (isStatic) return
        const tick = (now: number) => {
            const c = cfgRef.current
            // frame-rate-independent easing (like Depth Wave Gallery): a stall
            // or a 120Hz display never changes how fast the snap settles
            const dt =
                lastTickRef.current > 0
                    ? Math.min(0.05, (now - lastTickRef.current) / 1000)
                    : 1 / 60
            lastTickRef.current = now

            if (
                c.autoplay &&
                !downRef.current &&
                !(c.pauseOnHover && hoverRef.current) &&
                c.n > 1
            ) {
                if (now - lastAutoRef.current >= c.autoMs) {
                    lastAutoRef.current = now
                    let v = Math.round(targetRef.current) + 1
                    if (!c.loop) v = clamp(v, 0, Math.max(0, c.n - 1))
                    targetRef.current = v
                }
            } else {
                lastAutoRef.current = now
            }

            if (!draggingRef.current) {
                const k = 1 - Math.pow(1 - c.ease, dt * 60)
                offsetRef.current +=
                    (targetRef.current - offsetRef.current) * k
            }

            const cn = c.n
            for (let i = 0; i < cn; i++) {
                let rel = i - offsetRef.current
                if (c.loop && cn > 0) {
                    rel = ((rel % cn) + cn) % cn
                    if (rel > cn / 2) rel -= cn
                }
                const t = effectTransform(c.mode, rel, c.step, c.intensity)
                const el = slideRefs.current[i]
                if (el) {
                    el.style.transform = tfString(t)
                    el.style.opacity = t.opacity.toFixed(3)
                    el.style.zIndex = String(t.zIndex)
                }
                const inner = innerRefs.current[i]
                if (inner) {
                    inner.style.transform =
                        "translateX(" +
                        t.inner.toFixed(2) +
                        "%) scale(" +
                        t.innerScale.toFixed(3) +
                        ")"
                }
            }

            const wi =
                cn > 0
                    ? ((Math.round(offsetRef.current) % cn) + cn) % cn
                    : 0
            if (wi !== idxRef.current) {
                idxRef.current = wi
                setIndex(wi)
            }

            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [isStatic, n])

    // ---- hover FX: init the WebGL2 overlay once a mode is chosen -----------
    useEffect(() => {
        if (!fxOn) return
        const canvas = fxCanvasRef.current
        if (!canvas) return
        fxFailedRef.current = false
        let gl: WebGL2RenderingContext | null = null
        try {
            gl = canvas.getContext("webgl2", {
                premultipliedAlpha: false,
                alpha: true,
                antialias: true,
            })
        } catch (e) {
            gl = null
        }
        if (!gl) {
            fxFailedRef.current = true
            return
        }
        try {
            const vs = compileFx(gl, gl.VERTEX_SHADER, FX_VERT)
            const fs = compileFx(gl, gl.FRAGMENT_SHADER, FX_FRAG)
            const program = gl.createProgram()!
            gl.attachShader(program, vs)
            gl.attachShader(program, fs)
            gl.linkProgram(program)
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(program) || "link failed")
            }
            const vao = gl.createVertexArray()!
            const tex = gl.createTexture()!
            gl.bindTexture(gl.TEXTURE_2D, tex)
            // NO flip: v_uv is already top-down (y=0 at the top), so the image
            // must upload top-row-first. Flipping here mirrors it vertically,
            // which made the overlay appear upside-down on hover.
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            // 1x1 placeholder so the first frames have something to sample
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 20, 255]))
            const names = [
                "u_res", "u_img", "u_mouse", "u_hover", "u_time",
                "u_mode", "u_intensity", "u_radius", "u_baseScale",
            ]
            const loc: Record<string, WebGLUniformLocation | null> = {}
            names.forEach((n2) => (loc[n2] = gl!.getUniformLocation(program, n2)))
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            fxGlRef.current = { gl, program, vao, tex, loc }
            fxLoadedRef.current = { idx: -1, img: [1, 1] }
            fxTaintRef.current.clear()
            fxHoverAmtRef.current = 0
            fxLastNowRef.current = 0
        } catch (e) {
            fxFailedRef.current = true
        }
        return () => {
            const g = fxGlRef.current
            if (g) {
                g.gl.deleteTexture(g.tex)
                g.gl.deleteVertexArray(g.vao)
                g.gl.deleteProgram(g.program)
            }
            fxGlRef.current = null
        }
    }, [fxOn])

    // ---- hover FX: track the cursor in the active slide's box space --------
    useEffect(() => {
        if (!fxOn) return
        const stage = stageRef.current
        if (!stage) return
        const onMove = (e: PointerEvent) => {
            const rect = stage.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            const c = fxCfgRef.current
            // stage-space fraction (ratio is zoom-independent even on canvas)
            const fx = (e.clientX - rect.left) / rect.width
            const fy = (e.clientY - rect.top) / rect.height
            // the active slide sits centered in the stage — map into its box
            const bwf = c.slideW / Math.max(1, c.frameW)
            const bhf = c.slideH / Math.max(1, c.frameH)
            const blf = (1 - bwf) / 2
            const btf = (1 - bhf) / 2
            // only over the CENTERED IMAGE, not the peek/gaps around it — the
            // effect should apply to the image, not the whole slider area
            fxOverImageRef.current =
                fx >= blf && fx <= blf + bwf && fy >= btf && fy <= btf + bhf
            fxMouseTargetRef.current = [
                clamp((fx - blf) / Math.max(0.0001, bwf), 0, 1),
                clamp((fy - btf) / Math.max(0.0001, bhf), 0, 1),
            ]
        }
        const onLeave = () => {
            fxOverImageRef.current = false
        }
        stage.addEventListener("pointermove", onMove)
        stage.addEventListener("pointerleave", onLeave)
        return () => {
            stage.removeEventListener("pointermove", onMove)
            stage.removeEventListener("pointerleave", onLeave)
        }
    }, [fxOn])

    // ---- hover FX: render loop (only while a mode is on and in view) -------
    useEffect(() => {
        if (!fxOn) return
        let frame = 0
        let running = false
        const t0 = typeof performance !== "undefined" ? performance.now() : 0

        const loadActive = (idx: number, src2?: string) => {
            const store = fxGlRef.current
            if (!store || !src2 || fxLoadingRef.current) return
            fxLoadingRef.current = true
            const im = new Image()
            im.crossOrigin = "anonymous"
            im.onload = () => {
                const g = fxGlRef.current
                if (!g) {
                    fxLoadingRef.current = false
                    return
                }
                try {
                    g.gl.bindTexture(g.gl.TEXTURE_2D, g.tex)
                    g.gl.pixelStorei(g.gl.UNPACK_FLIP_Y_WEBGL, false)
                    g.gl.texImage2D(g.gl.TEXTURE_2D, 0, g.gl.RGBA, g.gl.RGBA, g.gl.UNSIGNED_BYTE, im)
                    fxLoadedRef.current = {
                        idx,
                        img: [im.naturalWidth || 1, im.naturalHeight || 1],
                    }
                } catch (e) {
                    // CORS-tainted image can't be uploaded — skip THIS slide
                    // only (show it plain) instead of killing FX for all slides
                    fxTaintRef.current.add(idx)
                }
                fxLoadingRef.current = false
            }
            im.onerror = () => {
                fxLoadingRef.current = false
            }
            im.src = src2
        }

        const tick = () => {
            if (!running) return
            const store = fxGlRef.current
            const canvas = fxCanvasRef.current
            const c = fxCfgRef.current
            if (!store || !canvas || fxFailedRef.current) {
                frame = requestAnimationFrame(tick)
                return
            }
            const { gl, program, vao, tex, loc } = store
            const dpr = Math.min(
                typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
                2
            )
            const Wd = Math.max(1, Math.round(c.slideW * dpr))
            const Hd = Math.max(1, Math.round(c.slideH * dpr))
            if (canvas.width !== Wd || canvas.height !== Hd) {
                canvas.width = Wd
                canvas.height = Hd
            }

            const now =
                typeof performance !== "undefined" ? performance.now() : 0
            // frame time (s), clamped so a tab-switch stall never jumps
            const dt =
                fxLastNowRef.current > 0
                    ? Math.min(0.05, (now - fxLastNowRef.current) / 1000)
                    : 1 / 60
            fxLastNowRef.current = now
            // convert a per-60fps-frame smoothing factor into a dt-correct one,
            // so easing feels identical on 60Hz and 120Hz displays
            const easeK = (perFrame: number) =>
                1 - Math.pow(1 - perFrame, dt * 60)

            // keep the texture in sync with the snapped active slide (skip
            // slides that already failed to upload, so we never reload-loop)
            const active = idxRef.current
            const slide = slidesRef.current[active]
            const isImg =
                !!slide &&
                slide.type !== "video" &&
                !!slide.src &&
                !fxTaintRef.current.has(active)
            if (
                isImg &&
                active !== fxLoadedRef.current.idx &&
                !fxTaintRef.current.has(active)
            ) {
                loadActive(active, slide!.src)
            }

            // engage only for image slides, hovering, and at rest (so slide
            // transitions and drags keep the overlay invisible)
            const atRest =
                Math.abs(offsetRef.current - Math.round(offsetRef.current)) <
                    0.02 && !downRef.current
            const engaged =
                isImg && // image slides only (never video)
                hoverRef.current &&
                fxOverImageRef.current && // cursor over the image, not the gaps
                atRest &&
                now - lastWheelRef.current > 220 && // not mid scroll-to-slide
                fxLoadedRef.current.idx === active

            // Distortion strength eases; the overlay OPACITY does NOT cross-fade
            // (that would blend the WebGL copy over the DOM <img> and shimmer).
            // Instead the overlay is fully opaque whenever it's shown, so it
            // cleanly occludes the real image, and only the distortion animates.
            const prevAmt = fxHoverAmtRef.current
            let amt = prevAmt
            if (!atRest) {
                // during a drag / slide change, drop instantly so the overlay
                // never freezes the moving center; the real slides take over
                amt = 0
            } else {
                const target = engaged ? 1 : 0
                amt += (target - amt) * easeK(engaged ? 0.16 : 0.3)
                if (amt < 0.0015 && !engaged) amt = 0
                else if (amt > 0.9985 && engaged) amt = 1
            }
            fxHoverAmtRef.current = amt

            // eased cursor (follow-lag) for smooth distortion. Snap to the
            // target while the overlay is invisible so it never swoops in from
            // a stale position on the first hover frame.
            const mt = fxMouseTargetRef.current
            const mc = fxMouseRef.current
            if (prevAmt < 0.002) {
                mc[0] = mt[0]
                mc[1] = mt[1]
            } else {
                const k = easeK(0.22)
                mc[0] += (mt[0] - mc[0]) * k
                mc[1] += (mt[1] - mc[1]) * k
            }

            // binary opacity: opaque while shown (no blend), hidden otherwise.
            // Show/hide happens when distortion is ~0, so the swap with the real
            // <img> is seamless (identical base image, no fade).
            const drawing = amt > 0.0015
            canvas.style.opacity = drawing ? "1" : "0"

            gl.viewport(0, 0, Wd, Hd)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            if (drawing) {
                // smootherstep the distortion so it eases with no hard start/stop
                const a = amt
                const uHover = a * a * a * (a * (a * 6 - 15) + 10)
                gl.useProgram(program)
                gl.bindVertexArray(vao)
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.uniform1i(loc.u_tex, 0)
                gl.uniform2f(loc.u_res, Wd, Hd)
                gl.uniform2f(loc.u_img, fxLoadedRef.current.img[0] * dpr, fxLoadedRef.current.img[1] * dpr)
                gl.uniform2f(loc.u_mouse, mc[0], mc[1])
                gl.uniform1f(loc.u_hover, uHover)
                gl.uniform1f(loc.u_time, (now - t0) / 1000)
                gl.uniform1i(loc.u_mode, c.modeIdx)
                gl.uniform1f(loc.u_intensity, c.intensity)
                gl.uniform1f(loc.u_radius, c.radius)
                gl.uniform1f(loc.u_baseScale, c.baseScale)
                gl.drawArrays(gl.TRIANGLES, 0, 3)
                gl.bindVertexArray(null)
            }
            frame = requestAnimationFrame(tick)
        }

        const start = () => {
            if (running) return
            running = true
            fxLastNowRef.current = 0 // reset dt so a resume never jumps
            frame = requestAnimationFrame(tick)
        }
        const stop = () => {
            running = false
            cancelAnimationFrame(frame)
        }
        const stage = stageRef.current
        if (!stage || typeof IntersectionObserver === "undefined") {
            start()
            return () => stop()
        }
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) start()
                    else stop()
                }
            },
            { threshold: 0 }
        )
        io.observe(stage)
        return () => {
            io.disconnect()
            stop()
        }
    }, [fxOn, n])

    // Navigation helpers (fresh closures each render — safe, not long-lived).
    const setTarget = (v: number) => {
        if (!loop) v = clamp(v, 0, Math.max(0, n - 1))
        targetRef.current = v
        if (typeof performance !== "undefined")
            lastAutoRef.current = performance.now()
    }
    const go = (dir: number) => setTarget(Math.round(targetRef.current) + dir)
    const goTo = (i: number) => {
        if (loop && n > 0) {
            const base = Math.round(targetRef.current)
            const cur = ((base % n) + n) % n
            let delta = (((i - cur) % n) + n) % n
            if (delta > n / 2) delta -= n
            setTarget(base + delta)
        } else {
            setTarget(i)
        }
    }

    const onPointerDown = (e: React.PointerEvent) => {
        if (isStatic) return
        downRef.current = true
        draggingRef.current = false
        startXRef.current = e.clientX
        startOffsetRef.current = offsetRef.current
        movedRef.current = 0
        velRef.current = 0
        lastVRef.current = offsetRef.current
        if (typeof performance !== "undefined")
            lastAutoRef.current = performance.now()

        const onMove = (ev: PointerEvent) => {
            if (!downRef.current) return
            const dx = ev.clientX - startXRef.current
            movedRef.current = Math.max(movedRef.current, Math.abs(dx))
            const c = cfgRef.current
            if (!c.drag) return
            if (Math.abs(dx) > 4) draggingRef.current = true
            let v = startOffsetRef.current - dx / Math.max(1, c.step)
            if (!c.loop) v = clamp(v, -0.15, Math.max(0, c.n - 1) + 0.15)
            // smoothed velocity (slide units per move) for flick momentum
            velRef.current = velRef.current * 0.7 + (v - lastVRef.current) * 0.3
            lastVRef.current = v
            offsetRef.current = v
            targetRef.current = v
        }
        const detach = () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("pointermove", onMove)
                window.removeEventListener("pointerup", onUp)
                window.removeEventListener("pointercancel", onCancel)
            }
            downRef.current = false
            draggingRef.current = false
            velRef.current = 0
        }
        // pointercancel (e.g. the browser hijacks the gesture for page scroll)
        // fires with NO pointerup — without this cleanup downRef/listeners leak
        // and later clicks get mis-measured and stop firing.
        const onCancel = () => {
            const c = cfgRef.current
            let v = Math.round(offsetRef.current)
            if (!c.loop) v = clamp(v, 0, Math.max(0, c.n - 1))
            targetRef.current = v
            detach()
        }
        const onUp = (ev: PointerEvent) => {
            const c = cfgRef.current
            const wasDragging = draggingRef.current
            const moved = movedRef.current
            if (wasDragging) {
                // flick momentum: project the release velocity forward, then
                // snap to the nearest slide (a fast swipe can carry a few)
                const proj =
                    offsetRef.current + clamp(velRef.current * 7, -4, 4)
                let v = Math.round(proj)
                if (!c.loop) v = clamp(v, 0, Math.max(0, c.n - 1))
                targetRef.current = v
            }
            detach()

            // Treat as a click if the pointer barely moved.
            if (moved < 6 && typeof document !== "undefined") {
                const el = document.elementFromPoint(
                    ev.clientX,
                    ev.clientY
                ) as HTMLElement | null
                const slideEl = el
                    ? (el.closest("[data-slide]") as HTMLElement | null)
                    : null
                if (slideEl) {
                    const di = parseInt(
                        slideEl.getAttribute("data-slide") || "-1",
                        10
                    )
                    const it = slidesRef.current[di]
                    if (it) {
                        if (sourceRef.current === "cms") {
                            // by index first (robust); src match as a fallback
                            if (!clickAnchorByIndex(probeRef.current, di))
                                clickSourceAnchor(probeRef.current, it.src)
                        } else navigateManual(it.link)
                    }
                }
            }
        }
        if (typeof window !== "undefined") {
            window.addEventListener("pointermove", onMove)
            window.addEventListener("pointerup", onUp)
            window.addEventListener("pointercancel", onCancel)
        }
    }

    // Initial / static transform (offset 0). The rAF overrides it when live.
    const baseStyleFor = (i: number): React.CSSProperties => {
        let rel = i - 0
        if (loop && n > 0) {
            rel = ((rel % n) + n) % n
            if (rel > n / 2) rel -= n
        }
        const t = effectTransform(effect, rel, step, intensity)
        return {
            transform: tfString(t),
            opacity: t.opacity,
            zIndex: t.zIndex,
        }
    }

    // Root FILLS its Framer box (height:100%) so it follows whatever height
    // you set on the frame — fixed px, fit, or 100vh — AND has a minHeight
    // floor of the frame height so it can't collapse in the canvas (where the
    // code-component wrapper can be auto-height). This keeps canvas, Preview,
    // and live the same size.
    const rootStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: seedHeight,
        background,
        overflow: "hidden",
        boxSizing: "border-box",
    }

    const stageStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        perspective: 1400,
        transformStyle: "preserve-3d",
        touchAction: dragEnabled ? "pan-y" : "auto",
        userSelect: "none",
        WebkitUserSelect: "none",
    }

    // Media never captures the drag: no native image drag-ghost, no selection,
    // and pointer events pass through to the stage so swiping moves the slider.
    const mediaStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        userSelect: "none",
        WebkitUserSelect: "none",
        pointerEvents: "none",
        ...({ WebkitUserDrag: "none" } as React.CSSProperties),
    }

    // Default chevron button (used when Arrow Style is Default).
    const defaultArrowVisual = (isPrev: boolean) => (
        <div
            style={{
                width: arrowSize,
                height: arrowSize,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: arrowBackground ? arrowBgColor : "transparent",
                backdropFilter: arrowBackground ? "blur(6px)" : undefined,
                WebkitBackdropFilter: arrowBackground ? "blur(6px)" : undefined,
                color: arrowColor,
            }}
        >
            <svg
                width={Math.round(arrowSize * 0.5)}
                height={Math.round(arrowSize * 0.5)}
                viewBox="0 0 24 24"
                fill="none"
            >
                <path
                    d={isPrev ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    )

    // Arrow content priority in Custom mode: dropped frame → uploaded image →
    // default chevron. In Default mode it is always the chevron.
    const renderArrow = (isPrev: boolean) => {
        const slotFrame =
            arrowMode === "custom" ? (isPrev ? prevArrow : nextArrow) : undefined
        const customSrc =
            arrowMode === "custom" && !slotFrame
                ? isPrev
                    ? prevArrowSrc
                    : nextArrowSrc
                : undefined
        const sized = !slotFrame // chevron + image use Arrow Size; a frame keeps its own size
        return (
            <button
                type="button"
                onClick={() => go(isPrev ? -1 : 1)}
                aria-label={isPrev ? "Previous slide" : "Next slide"}
                style={{
                    // reset native button chrome so it looks like the visual only
                    appearance: "none",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "auto",
                    ...(sized ? { width: arrowSize, height: arrowSize } : {}),
                }}
            >
                {slotFrame ? (
                    slotFrame
                ) : customSrc ? (
                    <img
                        src={customSrc}
                        alt={isPrev ? "Previous" : "Next"}
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                            pointerEvents: "none",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            ...({ WebkitUserDrag: "none" } as React.CSSProperties),
                        }}
                    />
                ) : (
                    defaultArrowVisual(isPrev)
                )}
            </button>
        )
    }

    return (
        <div style={rootStyle}>
            <div
                ref={stageRef}
                style={stageStyle}
                onPointerDown={onPointerDown}
                onMouseEnter={() => {
                    hoverRef.current = true
                }}
                onMouseLeave={() => {
                    hoverRef.current = false
                }}
            >
                {slides.map((it, i) => {
                    const base = baseStyleFor(i)
                    const slideStyle: React.CSSProperties = {
                        position: "absolute",
                        inset: 0,
                        margin: "auto",
                        width: slideW,
                        height: slideH,
                        borderRadius: radius,
                        overflow: "hidden",
                        background: "#000",
                        willChange: "transform, opacity",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: base.transform,
                        opacity: base.opacity,
                        zIndex: base.zIndex,
                    }
                    return (
                        <div
                            key={i}
                            data-slide={i}
                            ref={(el) => {
                                slideRefs.current[i] = el
                            }}
                            style={slideStyle}
                        >
                            <div
                                ref={(el) => {
                                    innerRefs.current[i] = el
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    willChange: "transform",
                                }}
                            >
                                {it.src ? (
                                    it.type === "video" ? (
                                        <video
                                            key={it.src}
                                            src={it.src}
                                            poster={it.poster}
                                            autoPlay={!isStatic}
                                            loop
                                            muted
                                            playsInline
                                            preload="metadata"
                                            draggable={false}
                                            style={mediaStyle}
                                        />
                                    ) : (
                                        <img
                                            src={it.src}
                                            alt={it.caption || ""}
                                            draggable={false}
                                            style={mediaStyle}
                                        />
                                    )
                                ) : null}
                            </div>
                            {capShow && capOnCard && it.caption ? (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        ...(capPos === "top"
                                            ? { top: 0 }
                                            : { bottom: 0 }),
                                        padding:
                                            capPos === "top"
                                                ? `${capPad}px 20px ${capPad + 16}px`
                                                : `${capPad + 16}px 20px ${capPad}px`,
                                        textAlign: capAlign,
                                        color: capColor,
                                        fontWeight: 500,
                                        letterSpacing: "-0.01em",
                                        ...capFont,
                                        fontSize: capSize,
                                        background: capBg
                                            ? `linear-gradient(${capPos === "top" ? "to bottom" : "to top"}, ${capBgColor}, transparent)`
                                            : "none",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                        WebkitUserSelect: "none",
                                    }}
                                >
                                    {it.caption}
                                </div>
                            ) : null}
                        </div>
                    )
                })}

                {/* Outside-the-card caption for the active slide (below/above) */}
                {capShow && !capOnCard && slides[index] && slides[index].caption ? (
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            width: slideW,
                            top:
                                capPos === "below"
                                    ? (frameH + slideH) / 2 + capPad
                                    : (frameH - slideH) / 2 - capPad,
                            transform:
                                capPos === "below"
                                    ? "translateX(-50%)"
                                    : "translate(-50%, -100%)",
                            textAlign: capAlign,
                            color: capColor,
                            fontWeight: 500,
                            letterSpacing: "-0.01em",
                            ...capFont,
                            fontSize: capSize,
                            pointerEvents: "none",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            zIndex: 160,
                        }}
                    >
                        {slides[index].caption}
                    </div>
                ) : null}

                {fxOn ? (
                    <canvas
                        ref={fxCanvasRef}
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            margin: "auto",
                            width: slideW,
                            height: slideH,
                            borderRadius: radius,
                            overflow: "hidden",
                            pointerEvents: "none",
                            zIndex: 150,
                            opacity: 0,
                        }}
                    />
                ) : null}
            </div>

            {showArrows ? (
                arrowLayout === "grouped" ? (
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 200,
                            display: "flex",
                            gap: arrowGap,
                            alignItems: "center",
                            ...cornerAnchor(arrowCorner, arrowOffX, arrowOffY),
                        }}
                    >
                        {renderArrow(true)}
                        {renderArrow(false)}
                    </div>
                ) : (
                    <>
                        <div
                            style={{
                                position: "absolute",
                                zIndex: 200,
                                left: arrowOffX,
                                top: "50%",
                                transform:
                                    "translateY(calc(-50% + " +
                                    arrowOffY +
                                    "px))",
                            }}
                        >
                            {renderArrow(true)}
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                zIndex: 200,
                                right: arrowOffX,
                                top: "50%",
                                transform:
                                    "translateY(calc(-50% + " +
                                    arrowOffY +
                                    "px))",
                            }}
                        >
                            {renderArrow(false)}
                        </div>
                    </>
                )
            ) : null}

            {showDots && n > 1 ? (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: dotBottom,
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: dotGap,
                        zIndex: 200,
                        alignItems: "center",
                    }}
                >
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => goTo(i)}
                            aria-label={"Go to slide " + (i + 1)}
                            aria-current={i === index ? "true" : undefined}
                            style={{
                                appearance: "none",
                                border: "none",
                                padding: 0,
                                margin: 0,
                                width: i === index ? dotActiveWidth : dotSize,
                                height: dotSize,
                                borderRadius: 999,
                                background:
                                    i === index ? dotActiveColor : dotColor,
                                opacity: i === index ? 1 : 0.5,
                                cursor: "pointer",
                                transition:
                                    "width 0.25s ease, opacity 0.25s ease",
                            }}
                        />
                    ))}
                </div>
            ) : null}

            {src === "cms" ? (
                <div
                    ref={probeRef}
                    style={{
                        position: "absolute",
                        left: -99999,
                        top: 0,
                        width: 1200,
                        height: 1,
                        opacity: 0,
                        pointerEvents: "none",
                        overflow: "hidden",
                    }}
                    aria-hidden
                >
                    {collectionSlot}
                </div>
            ) : null}
        </div>
    )
}

CMSSlider.displayName = "CMS Slider"

addPropertyControls(CMSSlider, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        defaultValue: "manual",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        displaySegmentedControl: true,
        description:
            "Manual lets you build slides by hand. CMS reads a Collection List you drop into the slot below.",
    },
    items: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 60,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Media",
                    defaultValue: "image",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    description: "Whether this slide is an image or a video.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "The slide image.",
                    hidden: (p: { type?: MediaType }) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    description:
                        "An mp4, webm, or mov file. Plays muted, looped, and inline.",
                    hidden: (p: { type?: MediaType }) => p.type !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    description: "Optional still shown before the video plays.",
                    hidden: (p: { type?: MediaType }) => p.type !== "video",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                    description: "Optional label shown over the slide.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Optional URL the slide points to when clicked.",
                },
            },
        },
        description: "The slides shown when Source is set to Manual.",
        hidden: (p: Partial<Props>) => p.source === "cms",
    },
    collectionSlot: {
        type: ControlType.ComponentInstance,
        title: "Collection",
        description:
            "Drop a Framer Collection List here. Each row's image (or video) becomes a slide; a Text layer in the row becomes the caption (falls back to the image's alt text); and a link on the row is used for click-through.",
        hidden: (p: Partial<Props>) => p.source !== "cms",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Size and shape of each slide.",
        controls: {
            slideWidth: {
                type: ControlType.Number,
                title: "Slide Width",
                defaultValue: 64,
                min: 20,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "How wide each slide is as a share of the frame width. Below 100% the neighboring slides peek in at the edges. In Aspect mode the height follows from the ratio (capped to the frame height); in Fill mode the slide is the full frame height.",
            },
            heightMode: {
                type: ControlType.Enum,
                title: "Height",
                defaultValue: "aspect",
                options: ["aspect", "fill"],
                optionTitles: ["Aspect", "Fill"],
                displaySegmentedControl: true,
                description:
                    "Aspect sets the slide height from the ratio below. Fill makes each slide the full frame height (Slide Width still controls its width).",
            },
            aspect: {
                type: ControlType.Enum,
                title: "Aspect",
                defaultValue: "3:2",
                options: ["3:4", "4:5", "1:1", "4:3", "3:2", "16:9"],
                optionTitles: [
                    "Portrait 3:4",
                    "Portrait 4:5",
                    "Square",
                    "Landscape 4:3",
                    "Landscape 3:2",
                    "Wide 16:9",
                ],
                description: "Shape of each slide in Aspect mode.",
                hidden: (p: { heightMode?: string }) => p.heightMode === "fill",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 24,
                min: 0,
                max: 160,
                step: 2,
                unit: "px",
                description: "Space between slides.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description:
            "The transition effect and how the slider advances. Drag, the arrows, the dots, autoplay, and the optional wheel all drive the same snap.",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                defaultValue: "slide",
                options: [
                    "slide",
                    "fade",
                    "parallax",
                    "zoom",
                    "stack",
                    "cards",
                    "flip",
                ],
                optionTitles: [
                    "Slide",
                    "Fade",
                    "Parallax",
                    "Zoom",
                    "Stack",
                    "Cards",
                    "Flip",
                ],
                description:
                    "Slide is a clean horizontal track. Fade crossfades in place. Parallax rides a track while the photo drifts inside the frame. Zoom pushes the center slide in. Stack deals slides like a deck. Cards fan out behind. Flip turns each card in 3D.",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 1,
                min: 0,
                max: 2,
                step: 0.05,
                description:
                    "Scales how strong the chosen effect reads. Has no influence on the plain Slide effect.",
            },
            smoothing: {
                type: ControlType.Number,
                title: "Smoothing",
                defaultValue: 0.12,
                min: 0.02,
                max: 0.4,
                step: 0.01,
                description:
                    "How softly the slider settles onto each slide. Lower glides longer.",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Advances the slider on a timer.",
            },
            autoplaySpeed: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 3.5,
                min: 0.5,
                max: 20,
                step: 0.5,
                unit: "s",
                description: "Seconds each slide is held before advancing.",
                hidden: (p: { autoplay?: boolean }) => !p.autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause On Hover",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Stops autoplay while the cursor is over the slider.",
                hidden: (p: { autoplay?: boolean }) => !p.autoplay,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Wraps seamlessly from the last slide back to the first.",
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Lets visitors drag or swipe between slides.",
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Scroll to Slide",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Turn this on to let the mouse wheel / trackpad advance the slider, one slide per gesture. Note: it traps page scroll while the cursor is over the slider, so it works best when the slider fills the screen (or in a section people scroll to and pause on).",
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        description: "The arrows and dots layered over the slider.",
        controls: {
            showArrows: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Shows the previous and next arrows.",
            },
            arrowMode: {
                type: ControlType.Enum,
                title: "Arrow Style",
                defaultValue: "default",
                options: ["default", "custom"],
                optionTitles: ["Default", "Custom"],
                displaySegmentedControl: true,
                description:
                    "Default uses the built-in chevrons. Custom uses, per side, the dropped frame below if set, otherwise the uploaded image.",
                hidden: (p: { showArrows?: boolean }) => !p.showArrows,
            },
            prevArrow: {
                type: ControlType.ComponentInstance,
                title: "Prev Frame",
                description:
                    "Optional. Drop any frame or component to use as the previous arrow.",
                hidden: (p: { showArrows?: boolean; arrowMode?: ArrowMode }) =>
                    !p.showArrows || p.arrowMode !== "custom",
            } as any,
            nextArrow: {
                type: ControlType.ComponentInstance,
                title: "Next Frame",
                description:
                    "Optional. Drop any frame or component to use as the next arrow.",
                hidden: (p: { showArrows?: boolean; arrowMode?: ArrowMode }) =>
                    !p.showArrows || p.arrowMode !== "custom",
            } as any,
            prevArrowImage: {
                type: ControlType.ResponsiveImage,
                title: "Prev Image",
                description:
                    "Custom previous arrow image. Used if no Prev Frame is set.",
                hidden: (p: { showArrows?: boolean; arrowMode?: ArrowMode }) =>
                    !p.showArrows || p.arrowMode !== "custom",
            },
            nextArrowImage: {
                type: ControlType.ResponsiveImage,
                title: "Next Image",
                description:
                    "Custom next arrow image. Used if no Next Frame is set.",
                hidden: (p: { showArrows?: boolean; arrowMode?: ArrowMode }) =>
                    !p.showArrows || p.arrowMode !== "custom",
            },
            arrowLayout: {
                type: ControlType.Enum,
                title: "Placement",
                defaultValue: "sides",
                options: ["sides", "grouped"],
                optionTitles: ["Sides", "Grouped"],
                displaySegmentedControl: true,
                description:
                    "Sides puts one arrow at each edge. Grouped places both together at a corner you choose.",
                hidden: (p: { showArrows?: boolean }) => !p.showArrows,
            },
            arrowCorner: {
                type: ControlType.Enum,
                title: "Corner",
                defaultValue: "bottomRight",
                options: [
                    "topLeft",
                    "topCenter",
                    "topRight",
                    "bottomLeft",
                    "bottomCenter",
                    "bottomRight",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Center",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Center",
                    "Bottom Right",
                ],
                description: "Which corner the grouped arrows sit in.",
                hidden: (p: {
                    showArrows?: boolean
                    arrowLayout?: ArrowLayout
                }) => !p.showArrows || p.arrowLayout !== "grouped",
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                defaultValue: 16,
                min: 0,
                max: 400,
                step: 1,
                unit: "px",
                description:
                    "Horizontal inset of the arrows from the edge or corner.",
                hidden: (p: { showArrows?: boolean }) => !p.showArrows,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 16,
                min: -400,
                max: 400,
                step: 1,
                unit: "px",
                description:
                    "Sides: nudges the arrows up or down from the vertical center. Grouped: inset from the top or bottom edge.",
                hidden: (p: { showArrows?: boolean }) => !p.showArrows,
            },
            arrowGap: {
                type: ControlType.Number,
                title: "Arrow Gap",
                defaultValue: 10,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                description: "Space between the two grouped arrows.",
                hidden: (p: {
                    showArrows?: boolean
                    arrowLayout?: ArrowLayout
                }) => !p.showArrows || p.arrowLayout !== "grouped",
            },
            arrowSize: {
                type: ControlType.Number,
                title: "Arrow Size",
                defaultValue: 40,
                min: 16,
                max: 200,
                step: 1,
                unit: "px",
                description:
                    "The size of each arrow button — the chevron or your uploaded image. Dropped frames keep their own size.",
                hidden: (p: { showArrows?: boolean }) => !p.showArrows,
            },
            arrowColor: {
                type: ControlType.Color,
                title: "Arrow Color",
                defaultValue: "#FFFFFF",
                description: "Color of the default chevron icons.",
                hidden: (p: { showArrows?: boolean; arrowMode?: ArrowMode }) =>
                    !p.showArrows || p.arrowMode === "custom",
            },
            arrowBackground: {
                type: ControlType.Boolean,
                title: "Arrow Backdrop",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Shows the blurred pill behind the default chevrons.",
                hidden: (p: { showArrows?: boolean; arrowMode?: ArrowMode }) =>
                    !p.showArrows || p.arrowMode === "custom",
            },
            arrowBgColor: {
                type: ControlType.Color,
                title: "Backdrop Color",
                defaultValue: "rgba(0,0,0,0.28)",
                description: "Color of the pill behind the default chevrons.",
                hidden: (p: {
                    showArrows?: boolean
                    arrowMode?: ArrowMode
                    arrowBackground?: boolean
                }) =>
                    !p.showArrows ||
                    p.arrowMode === "custom" ||
                    !p.arrowBackground,
            },
            showDots: {
                type: ControlType.Boolean,
                title: "Dots",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Shows the position dots along the bottom.",
            },
            dotColor: {
                type: ControlType.Color,
                title: "Dot Color",
                defaultValue: "#FFFFFF",
                description: "Color of the inactive dots.",
                hidden: (p: { showDots?: boolean }) => !p.showDots,
            },
            dotActiveColor: {
                type: ControlType.Color,
                title: "Active Color",
                defaultValue: "#FFFFFF",
                description: "Color of the dot for the current slide.",
                hidden: (p: { showDots?: boolean }) => !p.showDots,
            },
            dotSize: {
                type: ControlType.Number,
                title: "Dot Size",
                defaultValue: 8,
                min: 2,
                max: 40,
                step: 1,
                unit: "px",
                description: "Diameter of each dot.",
                hidden: (p: { showDots?: boolean }) => !p.showDots,
            },
            dotActiveWidth: {
                type: ControlType.Number,
                title: "Active Width",
                defaultValue: 22,
                min: 2,
                max: 160,
                step: 1,
                unit: "px",
                description:
                    "Width of the current slide's dot. Larger than Dot Size makes it a pill.",
                hidden: (p: { showDots?: boolean }) => !p.showDots,
            },
            dotGap: {
                type: ControlType.Number,
                title: "Dot Gap",
                defaultValue: 8,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                description: "Space between dots.",
                hidden: (p: { showDots?: boolean }) => !p.showDots,
            },
            dotBottom: {
                type: ControlType.Number,
                title: "Dot Offset",
                defaultValue: 16,
                min: 0,
                max: 400,
                step: 1,
                unit: "px",
                description: "Distance of the dots from the bottom edge.",
                hidden: (p: { showDots?: boolean }) => !p.showDots,
            },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover FX",
        description:
            "Optional WebGL effect that plays on the centered slide while you hover it (at rest). Turn it on for any of these; it stays invisible during drags and transitions.",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                options: [
                    "off",
                    "rgb",
                    "ripple",
                    "zoom",
                    "glitch",
                    "swirl",
                    "pixelate",
                    "shine",
                ],
                optionTitles: [
                    "Off",
                    "RGB Shift",
                    "Ripple",
                    "Zoom Lens",
                    "Glitch",
                    "Twist",
                    "Pixelate",
                    "Shine",
                ],
                defaultValue: "off",
                description:
                    "RGB Shift = chromatic split toward the cursor. Ripple = water wave from the cursor. Zoom Lens = a magnifying bulge. Glitch = slice tears + RGB split. Twist = a soft, refined whirl around the cursor. Pixelate = a mosaic that grows near the cursor. Shine = a light sheen that sweeps across.",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 1,
                hidden: (p: { effect?: HoverMode }) => (p.effect ?? "off") === "off",
                description: "Strength of the effect.",
            },
            radius: {
                type: ControlType.Number,
                title: "Reach",
                min: 0.1,
                max: 1.5,
                step: 0.05,
                defaultValue: 0.55,
                hidden: (p: { effect?: HoverMode }) => (p.effect ?? "off") === "off",
                description: "How far around the cursor the effect reaches.",
            },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Caption",
        description:
            "Show and style the caption (from the item's Caption field, or a CMS Text layer / image alt).",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Caption",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Show the caption on each slide.",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom", "top", "below", "above"],
                optionTitles: [
                    "On Card · Bottom",
                    "On Card · Top",
                    "Outside · Below",
                    "Outside · Above",
                ],
                defaultValue: "bottom",
                hidden: (p: { show?: boolean }) => !p.show,
                description:
                    "On Card overlays the caption inside the slide; Outside places it below or above the card (give the frame a little extra height for these).",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 15,
                    variant: "Medium",
                    lineHeight: "1.3em",
                },
                hidden: (p: { show?: boolean }) => !p.show,
                description: "Typeface, weight, and style for the caption.",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 8,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 15,
                hidden: (p: { show?: boolean }) => !p.show,
                description: "Caption font size.",
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: "center",
                hidden: (p: { show?: boolean }) => !p.show,
                description: "Horizontal alignment of the caption text.",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: (p: { show?: boolean }) => !p.show,
                description: "Caption text color.",
            },
            background: {
                type: ControlType.Boolean,
                title: "Scrim",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: (p: { show?: boolean; position?: CaptionPos }) =>
                    !p.show ||
                    p.position === "below" ||
                    p.position === "above",
                description:
                    "A soft gradient behind on-card captions so text stays readable over the image.",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Scrim Color",
                defaultValue: "rgba(0,0,0,0.55)",
                hidden: (p: {
                    show?: boolean
                    background?: boolean
                    position?: CaptionPos
                }) =>
                    !p.show ||
                    p.background === false ||
                    p.position === "below" ||
                    p.position === "above",
                description: "Color the scrim fades from.",
            },
            padding: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 16,
                hidden: (p: { show?: boolean }) => !p.show,
                description:
                    "Distance from the card edge (on card), or the gap to the card (outside).",
            },
        },
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        description:
            "Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works/)",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0A0A0A",
                description: "The color behind the slides.",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                description: "Rounds the corners of each slide.",
            },
        },
    },
})







