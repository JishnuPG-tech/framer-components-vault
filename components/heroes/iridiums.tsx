// Iridiums
//
// A pale, iridescent liquid metal.
//
// Metal has no colour of its own. Everything you see in it is the room around
// it, bent by the shape of the surface -- so the way to draw metal is not to
// draw metal at all. Build a room, build a liquid, and reflect one in the other.
//
// The room here is a photographic studio: a ceiling with strip lights, a
// horizon, two softboxes, and a floor throwing light back up. The liquid is a
// domain-warped height field, drifting. At every pixel the surface normal is
// measured, the view is reflected off it, and whatever that reflection lands on
// in the studio is what gets drawn.
//
// Building it this way is what separates it from a pattern that merely looks
// metallic. A painted pattern is a function of position, so it slides across the
// frame. A reflection is a function of the surface, so it compresses where the
// liquid folds, stretches where it flattens, pools in the dents and snaps across
// the ridges. That behaviour is what the eye reads as metal -- not the colour,
// and not the sharpness.
//
// Where the colour comes from
//
// Each channel is reflected at a slightly different angle, the way a real
// reflection disperses, which leaves a thin spectral fringe along every edge.
//
// That fringe is the whole picture at the shipped settings. Shadow and Highlight
// are the dark and bright halves of the room, and by default they sit almost on
// top of each other -- a near-white room, reflected in a near-white liquid. With
// the light and dark of the room collapsed together there is almost no grey
// structure left, so what survives is the dispersion: colour without contrast,
// which is exactly how mother-of-pearl and anodised titanium behave.
//
// Pull Shadow down toward slate and the room reappears, the horizon turns into a
// hard line, and the same component becomes hard chrome. It is one dial between
// two materials, so it is worth trying both before settling.
//
// Getting started
//
//   1. Shadow is the dial that matters. Near-white for pearl and oil-slick,
//      dark for chrome. Everything else is trim.
//   2. Dispersion carries the image at pale settings and is merely jewellery at
//      dark ones. If the surface looks washed out, this is the control to reach
//      for, not Exposure.
//   3. Relief is how hard the liquid is churning. Low is a still pool with long
//      calm reflections; high packs the whole room into every ripple.
//   4. Strips is how many lights are in the ceiling. More strips, finer detail
//      through every fold.
//   5. Tint colours the whole reflection. White is neutral; push it to ice,
//      lavender or warm beige.
//
// Two details do more for the realism than any amount of tuning, and both are
// usually missing from web metal. The highlights roll off instead of clipping,
// because reflected lights are far brighter than white and the image is
// tonemapped the way a camera would rather than clamped. And the surface is
// built on gradient noise rather than value noise -- value noise pins its
// extrema to a lattice, and specular reflection amplifies the derivative of the
// field, so that faint grid is precisely what reads as a cheap plasma shader.
//
// This is a background, so it deliberately ignores the cursor. Anything placed
// on it is free to own the pointer, and a background that answers the mouse
// competes with the thing it is meant to sell.
//
// Motion stops for visitors who ask for reduced motion, and on the canvas: both
// hold a still frame you can position with Still. Rendering pauses entirely
// while the component is scrolled out of view.

import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IridiumsProps {
    shadowColor?: string
    highlightColor?: string
    tintColor?: string
    angle?: number
    speed?: number
    scale?: number
    relief?: number
    strips?: number
    polish?: number
    lights?: number
    dispersion?: number
    fresnel?: number
    exposure?: number
    grain?: number
    vignette?: number
    stillPoint?: number
    style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------

/** A single oversized triangle. Cheaper than a quad and needs no buffers. */
const VERTEX_SRC = `#version 300 es
void main() {
    vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAGMENT_SRC = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uShadow;
uniform vec3 uHighlight;
uniform vec3 uTint;
uniform float uAngle;
uniform float uScale;
uniform float uRelief;
uniform float uStrips;
uniform float uPolish;
uniform float uLights;
uniform float uDispersion;
uniform float uFresnel;
uniform float uExposure;
uniform float uGrain;
uniform float uVignette;

// ---------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------

/**
 * Hash without trigonometry, after Dave Hoskins. Fast enough to afford several
 * octaves per pixel, which matters here because the surface is sampled three
 * times to get its normal.
 */
vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return -1.0 + 2.0 * fract((p3.xx + p3.yz) * p3.zy);
}

/**
 * Gradient noise, not value noise.
 *
 * This one swap does more for the result than any amount of tuning. Value noise
 * interpolates between values sampled at lattice corners, so its extrema are
 * pinned to the grid and the field carries a faint axis-aligned blockiness. On
 * a diffuse surface nobody notices. Under a sharp specular reflection, which
 * amplifies the derivative of the field, that blockiness is exactly what reads
 * as a cheap early-2000s plasma. Gradient noise puts zeroes at the corners and
 * varies the direction of steepest ascent instead, so the surface has no
 * preferred axis and the reflections stop looking woven.
 */
float gnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Quintic interpolant: continuous second derivative, so the reflection does
    // not crease along lattice boundaries.
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
        mix(dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
    );
}

/** Three octaves of the liquid surface. */
float ridged(vec2 q, float t) {
    return gnoise(q * 1.00 + vec2(t * 0.045, t * 0.031)) * 0.60
         + gnoise(q * 2.13 - vec2(t * 0.031, t * 0.052)) * 0.26
         + gnoise(q * 4.37 + vec2(t * 0.062, 0.0)) * 0.14;
}

/**
 * The flow. Two low-frequency fields drag the surface through itself, which is
 * what gives molten metal its long drawn-out creases instead of the even lumps
 * of plain noise.
 */
vec2 flowWarp(vec2 q, float t) {
    return vec2(
        gnoise(q * 0.72 + vec2(0.0, t * 0.075)),
        gnoise(q * 0.72 + vec2(4.3, -t * 0.061))
    );
}

// ---------------------------------------------------------------------------
// The studio
// ---------------------------------------------------------------------------

/** Rounded-box distance, used for the softboxes. */
float boxDist(vec2 p, vec2 halfSize) {
    vec2 d = abs(p) - halfSize;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/**
 * The room being reflected, evaluated in the direction of the reflected ray.
 * This is a procedural matcap: rather than sampling a captured environment
 * photograph, the studio is described analytically, so it stays sharp at any
 * resolution, needs no texture fetch, and can be recoloured from the panel.
 *
 * Everything here is deliberately high contrast. Reflections compress the whole
 * room into a few pixels wherever the liquid turns steeply, and a low-contrast
 * room survives that compression as flat grey.
 */
vec3 studio(vec3 r, float edge) {
    float el = r.y;

    // Floor: darker, falling away below, with a little bounce just under the
    // horizon where a real floor throws light back up.
    float down = clamp(-el, 0.0, 1.0);
    vec3 floorCol = mix(uShadow * 1.12, uShadow * 0.58, smoothstep(0.0, 0.8, down));

    // Ceiling: brightest overhead.
    float up = clamp(el, 0.0, 1.0);
    vec3 skyCol = mix(uHighlight * 0.80, uHighlight, smoothstep(0.0, 0.75, up));

    // The horizon. Nearly a step edge, and the single most identifying feature
    // of a polished surface.
    vec3 col = mix(floorCol, skyCol, smoothstep(-edge, edge, el));

    // Ceiling strip lights: evenly spaced bars above the horizon. These are
    // what give studio chrome its banding.
    float s = el * uStrips;
    float tri = abs(fract(s) * 2.0 - 1.0);
    float aa = max(edge * 1.5, fwidth(s) * 1.2);
    float strip = smoothstep(0.62 - aa, 0.62 + aa, tri) * smoothstep(0.0, 0.22, el);
    col += uHighlight * strip * uLights * 0.9;

    // Two softboxes. Bright, soft-edged and off-centre, so highlights have
    // somewhere specific to come from rather than being uniformly lit.
    float b1 = smoothstep(0.16, -0.01, boxDist(r.xy - vec2(-0.34, 0.46), vec2(0.30, 0.09)));
    float b2 = smoothstep(0.22, -0.01, boxDist(r.xy - vec2(0.42, 0.16), vec2(0.16, 0.20)));
    col += uHighlight * (b1 * 1.30 + b2 * 0.75) * uLights;

    // A single small hot spot. Real specular has one point far brighter than
    // everything else, and its absence is why fully procedural metal often
    // looks evenly lit and lifeless.
    float hot = smoothstep(0.30, 0.0, length(r.xy - vec2(-0.12, 0.66)));
    col += uHighlight * hot * hot * 1.7 * uLights;

    return col;
}

/** ACES filmic curve, fitted. Rolls highlights off instead of clipping them. */
vec3 tonemap(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec2 sp = p * uScale;
    float t = uTime;

    // --- the liquid --------------------------------------------------------

    // The warp is measured once and shared by the three surface samples below.
    // It is low frequency compared to the ridges, so reusing it costs nothing
    // visible and saves two thirds of the flow calculation.
    vec2 warped = sp + flowWarp(sp, t) * 0.85;

    float d = 0.0035;
    float h0 = ridged(warped, t);
    float hx = ridged(warped + vec2(d, 0.0), t) - h0;
    float hy = ridged(warped + vec2(0.0, d), t) - h0;

    vec3 n = normalize(vec3(
        -hx / d * uRelief,
        -hy / d * uRelief,
        1.0
    ));

    // --- the reflection ----------------------------------------------------

    // A slightly divergent view, so the reflection shifts across the frame the
    // way it would if you were standing over a real container rather than
    // looking at a flat sheet.
    vec3 view = normalize(vec3(p * 0.55, 1.0));
    vec3 r = reflect(-view, n);

    // Rotate the room, not the liquid, so Angle changes where the lights are
    // without disturbing the flow.
    float ca = cos(uAngle);
    float sa = sin(uAngle);
    r = vec3(r.x * ca - r.y * sa, r.x * sa + r.y * ca, r.z);

    // Sharpness of every edge in the room. Clamped against the on-screen rate
    // of change so it stays as tight as the pixel grid allows without
    // scintillating as the surface moves.
    float edge = max(mix(0.09, 0.002, clamp(uPolish, 0.0, 1.0)), fwidth(r.y) * 0.4);

    // Dispersion: each channel reflects at a slightly different angle, leaving
    // the thin spectral fringe that a single-sample reflection can never
    // produce.
    float dsp = uDispersion * 0.028;
    vec3 envR = studio(normalize(r + vec3(0.0, dsp, 0.0)), edge);
    vec3 envG = studio(r, edge);
    vec3 envB = studio(normalize(r - vec3(0.0, dsp, 0.0)), edge);
    vec3 env = vec3(envR.r, envG.g, envB.b);

    // Fresnel. Even metal brightens where the surface turns away from you, and
    // it is what makes the steep walls of each ripple catch the light.
    float f = pow(1.0 - clamp(dot(n, view), 0.0, 1.0), 4.0);
    env += uHighlight * f * uFresnel;

    env *= uTint;

    vec3 col = tonemap(env * uExposure);

    col *= 1.0 - uVignette * dot(p, p);

    // Grain last, so it sits on the image rather than being blended into it.
    // Without it a reflection this smooth bands badly on 8-bit displays.
    col += hash22(gl_FragCoord.xy + fract(t) * 137.0).x * uGrain * 0.5;

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a CSS colour to 0..1 RGB. Falls back to mid grey. */
function toRGB(input?: string): [number, number, number] {
    const fallback: [number, number, number] = [0.5, 0.5, 0.5]
    if (!input) return fallback
    const value = input.trim()

    const hex = value.match(/^#([0-9a-f]{3,8})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length === 3 || h.length === 4) {
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        }
        const n = parseInt(h.slice(0, 6), 16)
        if (Number.isNaN(n)) return fallback
        return [
            ((n >> 16) & 255) / 255,
            ((n >> 8) & 255) / 255,
            (n & 255) / 255,
        ]
    }

    const rgb = value.match(/rgba?\(([^)]+)\)/i)
    if (rgb) {
        const parts = rgb[1].split(",").map((s) => parseFloat(s))
        if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
            return [parts[0] / 255, parts[1] / 255, parts[2] / 255]
        }
    }

    const hsl = value.match(/hsla?\(([^)]+)\)/i)
    if (hsl) {
        const parts = hsl[1].split(",").map((s) => parseFloat(s))
        if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
            const h = (((parts[0] % 360) + 360) % 360) / 360
            const s = parts[1] / 100
            const l = parts[2] / 100
            if (s === 0) return [l, l, l]
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const pp = 2 * l - q
            const channel = (u: number) => {
                let z = u
                if (z < 0) z += 1
                if (z > 1) z -= 1
                if (z < 1 / 6) return pp + (q - pp) * 6 * z
                if (z < 1 / 2) return q
                if (z < 2 / 3) return pp + (q - pp) * (2 / 3 - z) * 6
                return pp
            }
            return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)]
        }
    }

    return fallback
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
    }
    return shader
}

/**
 * IRIDIUM
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Iridiums(props: IridiumsProps) {
    const {
        shadowColor = "#F2F2F2",
        highlightColor = "#FFFFFF",
        tintColor = "#FFFFFF",
        angle = 0,
        speed = 0.55,
        scale = 1.15,
        relief = 1.15,
        strips = 6,
        polish = 1,
        lights = 0.7,
        dispersion = 0.25,
        fresnel = 0.22,
        exposure = 1.05,
        grain = 0.018,
        vignette = 0.16,
        stillPoint = 0.5,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isStatic = useIsStaticRenderer()

    // Every animated value lives here so the render loop can read the latest
    // props without being torn down and rebuilt on each panel change.
    const settings = useRef({
        shadowColor,
        highlightColor,
        tintColor,
        angle,
        scale,
        relief,
        strips,
        polish,
        lights,
        dispersion,
        fresnel,
        exposure,
        grain,
        vignette,
    })
    settings.current = {
        shadowColor,
        highlightColor,
        tintColor,
        angle,
        scale,
        relief,
        strips,
        polish,
        lights,
        dispersion,
        fresnel,
        exposure,
        grain,
        vignette,
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl2", {
            antialias: false,
            alpha: false,
            powerPreference: "low-power",
        })
        if (!gl) return

        const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC)
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC)
        if (!vs || !fs) return
        const program = gl.createProgram()
        if (!program) return
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
        gl.useProgram(program)

        const uniform = (name: string) => gl.getUniformLocation(program, name)
        const uRes = uniform("uRes")
        const uTime = uniform("uTime")
        const uShadow = uniform("uShadow")
        const uHighlight = uniform("uHighlight")
        const uTint = uniform("uTint")
        const uAngle = uniform("uAngle")
        const uScale = uniform("uScale")
        const uRelief = uniform("uRelief")
        const uStrips = uniform("uStrips")
        const uPolish = uniform("uPolish")
        const uLights = uniform("uLights")
        const uDispersion = uniform("uDispersion")
        const uFresnel = uniform("uFresnel")
        const uExposure = uniform("uExposure")
        const uGrain = uniform("uGrain")
        const uVignette = uniform("uVignette")

        let width = 0
        let height = 0
        const resize = () => {
            // Capped at 1.5x rather than the usual 2x. The surface is sampled
            // three times per pixel for its normal, so this is the one place
            // where resolution genuinely costs, and a reflection this smooth
            // gains almost nothing from the last half.
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
            if (w === width && h === height) return
            width = w
            height = h
            canvas.width = w
            canvas.height = h
            gl.viewport(0, 0, w, h)
        }

        const draw = (seconds: number) => {
            resize()
            const s = settings.current
            const [shr, shg, shb] = toRGB(s.shadowColor)
            const [hir, hig, hib] = toRGB(s.highlightColor)
            const [tir, tig, tib] = toRGB(s.tintColor)
            gl.uniform2f(uRes, width, height)
            gl.uniform1f(uTime, seconds)
            gl.uniform3f(uShadow, shr, shg, shb)
            gl.uniform3f(uHighlight, hir, hig, hib)
            gl.uniform3f(uTint, tir, tig, tib)
            gl.uniform1f(uAngle, (s.angle * Math.PI) / 180)
            gl.uniform1f(uScale, Math.max(0.1, s.scale))
            gl.uniform1f(uRelief, Math.max(0.001, s.relief))
            gl.uniform1f(uStrips, s.strips)
            gl.uniform1f(uPolish, s.polish)
            gl.uniform1f(uLights, s.lights)
            gl.uniform1f(uDispersion, s.dispersion)
            gl.uniform1f(uFresnel, s.fresnel)
            gl.uniform1f(uExposure, s.exposure)
            gl.uniform1f(uGrain, s.grain)
            gl.uniform1f(uVignette, s.vignette)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const reduced =
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        // A still frame is not a blank one: Still picks which moment of the
        // flow is held, so the canvas and reduced-motion visitors both get a
        // composed image rather than an empty surface.
        //
        // Speed 0 lands here too. Without that, a stopped surface would hold
        // whichever frame happened to be at time zero and quietly ignore Still,
        // so the canvas and the published site would show different images. It
        // also means a frozen background costs nothing at all: no loop is
        // started, and the shader runs exactly once.
        if (isStatic || reduced || speed === 0) {
            const frozen = stillPoint * 60
            draw(frozen)
            const observer = new ResizeObserver(() => draw(frozen))
            observer.observe(canvas)
            return () => observer.disconnect()
        }

        // Off screen, the loop is cancelled rather than skipped. Leaving
        // requestAnimationFrame scheduling itself and returning early still
        // wakes the page every frame, for every instance, forever — which is
        // the cost the gating is meant to remove.
        //
        // Elapsed time accumulates only while running, so a background that
        // scrolls out and back resumes from the moment it paused instead of
        // jumping forward by however long it was away.
        let frame = 0
        let running = false
        let elapsed = 0
        let last = 0

        const loop = (now: number) => {
            elapsed += (now - last) / 1000
            last = now
            draw(elapsed * speed)
            frame = requestAnimationFrame(loop)
        }

        const startLoop = () => {
            if (running) return
            running = true
            last = performance.now()
            frame = requestAnimationFrame(loop)
        }

        const stopLoop = () => {
            if (!running) return
            running = false
            cancelAnimationFrame(frame)
            frame = 0
        }

        draw(0)

        const resizeObserver = new ResizeObserver(() => resize())
        resizeObserver.observe(canvas)

        // rootMargin starts the flow just before the background arrives, so it
        // is already moving by the time any of it is on screen.
        let inView: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            startLoop()
        } else {
            inView = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting))
                        startLoop()
                    else stopLoop()
                },
                { rootMargin: "200px" }
            )
            inView.observe(canvas)
        }

        return () => {
            stopLoop()
            resizeObserver.disconnect()
            inView?.disconnect()
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)
        }
    }, [isStatic, stillPoint, speed])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                backgroundColor: shadowColor,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    )
}

addPropertyControls(Iridiums, {
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow",
        description:
            "The dark half of the room, and the one dial that changes the material. Near-white gives pearl and oil-slick; dark gives hard chrome.",
        defaultValue: "#F2F2F2",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight",
        description:
            "The bright half of the room, and the colour of the lights.",
        defaultValue: "#FFFFFF",
    },
    tintColor: {
        type: ControlType.Color,
        title: "Tint",
        description:
            "The only place colour enters. White is true silver; push toward ice, lavender or beige.",
        defaultValue: "#FFFFFF",
    },
    polish: {
        type: ControlType.Number,
        title: "Polish",
        description:
            "Sharpens every edge in the room at once. The chrome dial.",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    relief: {
        type: ControlType.Number,
        title: "Relief",
        description:
            "How hard the liquid is churning. Low is a still pool, high packs the whole room into every ripple.",
        defaultValue: 1.15,
        min: 0.02,
        max: 2,
        step: 0.01,
    },
    strips: {
        type: ControlType.Number,
        title: "Strips",
        description: "How many strip lights are in the ceiling.",
        defaultValue: 6,
        min: 0.5,
        max: 12,
        step: 0.1,
    },
    lights: {
        type: ControlType.Number,
        title: "Lights",
        description: "Brightness of the strips, softboxes and hot spot.",
        defaultValue: 0.7,
        min: 0,
        max: 1.5,
        step: 0.01,
    },
    dispersion: {
        type: ControlType.Number,
        title: "Dispersion",
        description:
            "The spectral fringe on each reflected edge. At pale settings this carries the whole image.",
        defaultValue: 0.25,
        min: 0,
        max: 1.5,
        step: 0.01,
    },
    fresnel: {
        type: ControlType.Number,
        title: "Fresnel",
        description: "Extra brightness where the surface turns away from you.",
        defaultValue: 0.22,
        min: 0,
        max: 1,
        step: 0.01,
    },
    exposure: {
        type: ControlType.Number,
        title: "Exposure",
        defaultValue: 1.05,
        min: 0.3,
        max: 3,
        step: 0.01,
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1.15,
        min: 0.2,
        max: 4,
        step: 0.05,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description:
            "Slow is the point. A background should not ask for attention.",
        defaultValue: 0.55,
        min: 0,
        max: 3,
        step: 0.05,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        description: "Rotates the room, not the liquid.",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    grain: {
        type: ControlType.Number,
        title: "Grain",
        defaultValue: 0.018,
        min: 0,
        max: 0.08,
        step: 0.002,
    },
    vignette: {
        type: ControlType.Number,
        title: "Vignette",
        defaultValue: 0.16,
        min: 0,
        max: 0.6,
        step: 0.01,
    },
    stillPoint: {
        type: ControlType.Number,
        title: "Still",
        description:
            "Which moment of the flow is held on the canvas and for reduced motion.",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },
})

Iridiums.displayName = "Iridiums"
