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


/**
 * ORBITAL FIELD — generative orbital image system with velocity-driven
 * radial fluid displacement, directional stretching and chromatic aberration.
 *
 * Geometry — exact, and never touched by the distortion
 * ------------------------------------------------------
 * The centre is always (width/2, height/2). Orbit k has radius
 * (min(w,h)/2) * (orbitRadius + k * orbitSpacing), so every orbit is
 * concentric and everything scales with the component. Elements are split
 * evenly across orbits and placed at
 *
 *      angle_i = base_k + (2*PI / N_k) * i
 *      x = cx + R * cos(angle)     y = cy + R * sin(angle)
 *
 * with a single shared angular speed; counter-rotation only flips the sign.
 * Every element is the same size. No element carries a random position,
 * speed, size or radius — the only per-element randomness left is a fixed
 * offset into the fluid-noise field, which changes texture, not geometry.
 *
 * Rendering model
 * ---------------
 * Each element is ONE instanced quad. The fragment shader converts the pixel
 * into the element's orbital frame — n outward along the radius, tb backward
 * along the tangent — then rotates that frame by `psi` onto the stretch axis
 * (psi = 0 is the tangent, PI/2 the radius). Because the frame is polar, a
 * trail laid along the tangent is an arc of the element's own orbit: it curves
 * with the path instead of shearing flat, and the direction updates
 * continuously as the element travels.
 *
 * Along that axis the sampling coordinate is remapped through a power curve,
 * so the *image content itself* is pulled apart: the leading half stays a
 * crisp disc while the trailing half spreads over a long comet, displaced by
 * animated value noise (fluid warp). All of this happens in the shader, after
 * the exact position above has been computed — the element underneath is
 * still on its perfect circle.
 *
 * Chromatic aberration is spectral, not a 3-channel offset: N wavelength
 * samples each get their own stretch length, and coverage is accumulated PER
 * CHANNEL. A region only the long-wavelength samples reach therefore keeps the
 * background in the other channels — which is why the reference's trails read
 * as saturated cyan / yellow / magenta over white rather than as a grey blur.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

/* ------------------------------------------------------------------ types */

type FramerImage =
    | string
    | { src?: string; srcSet?: string; alt?: string }
    | null
    | undefined

export interface OrbitalFieldProps {
    /* content */
    images: FramerImage[]
    count: number
    fit: "cover" | "contain" | "fill"

    /* orbit — the geometry is rigid: equal spacing, equal speed, one centre */
    orbits: number
    orbitRadius: number
    orbitSpacing: number
    speed: number
    direction: "cw" | "ccw"
    counterRotate: boolean

    /* 3D — the whole ring plane is rotated, then projected */
    rotateX: number
    rotateY: number
    rotateZ: number
    perspective: number
    pointerParallax: number

    /* image */
    imageSize: number

    /* distortion — purely visual, never moves an element off its orbit */
    distortion: boolean
    strength: number
    threshold: number
    falloff: number
    velocityInfluence: number
    stretch: number
    stretchAxis: number
    fluidDisplacement: number
    chromatic: number
    edgeTrail: number

    animate: boolean
    background: string

    style?: React.CSSProperties
}

/* --------------------------------------------------------------- defaults */

/** Palette distilled from the reference: near-neutral field, jewel subjects. */
const DEFAULT_PALETTE: [string, string, string][] = [
    ["#0b2f1c", "#1f6b3a", "#d7f2b8"],
    ["#0a1a52", "#2b4ef0", "#bcd2ff"],
    ["#4a0f10", "#a8232a", "#ffb9a3"],
    ["#57534a", "#c9c6bd", "#ffffff"],
    ["#efe4bd", "#c9a53c", "#fffbe8"],
    ["#2a1a10", "#7a4622", "#f0c9a0"],
    ["#1b1b1d", "#4b4b52", "#e8e8ef"],
    ["#3c1430", "#8e2f72", "#ffc7ef"],
    ["#0d3138", "#1f8a92", "#c9fbff"],
    ["#241f0d", "#6f6528", "#f2ecc0"],
]

/**
 * Procedural stand-ins so the component is already composed the moment it is
 * dropped on the canvas. Replaced the instant the user supplies images.
 */
function makeDefaultTexture(index: number, size = 384): HTMLCanvasElement {
    const c = document.createElement("canvas")
    c.width = c.height = size
    const g = c.getContext("2d")!
    const [deep, mid, light] = DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]
    const rnd = mulberry32(index * 9871 + 13)

    const base = g.createLinearGradient(0, 0, size, size)
    base.addColorStop(0, deep)
    base.addColorStop(1, mid)
    g.fillStyle = base
    g.fillRect(0, 0, size, size)

    // Organic interior — a few soft lobes, like the subjects in the reference.
    for (let i = 0; i < 5; i++) {
        const cx = size * (0.2 + rnd() * 0.6)
        const cy = size * (0.2 + rnd() * 0.6)
        const rr = size * (0.14 + rnd() * 0.36)
        const grd = g.createRadialGradient(cx, cy, 0, cx, cy, rr)
        const tone = i % 2 === 0 ? light : deep
        grd.addColorStop(0, hexToRgba(tone, 0.85))
        grd.addColorStop(1, hexToRgba(tone, 0))
        g.fillStyle = grd
        g.fillRect(0, 0, size, size)
    }

    // Structure to stretch — each index gets a different kind of crop so the
    // default set does not read as one repeated motif.
    const kind = index % 3
    if (kind === 0) {
        for (let i = 0; i < 3; i++) {
            g.save()
            g.translate(size / 2, size / 2)
            g.rotate(rnd() * Math.PI)
            g.fillStyle = hexToRgba(i % 2 ? light : deep, 0.3 + rnd() * 0.3)
            g.fillRect(
                -size,
                -size * (0.03 + rnd() * 0.12),
                size * 2,
                size * (0.06 + rnd() * 0.24)
            )
            g.restore()
        }
    } else if (kind === 1) {
        g.lineCap = "round"
        for (let i = 0; i < 3; i++) {
            g.strokeStyle = hexToRgba(i % 2 ? light : deep, 0.28 + rnd() * 0.3)
            g.lineWidth = size * (0.03 + rnd() * 0.1)
            g.beginPath()
            g.arc(
                size * (0.1 + rnd() * 0.8),
                size * (0.1 + rnd() * 0.8),
                size * (0.2 + rnd() * 0.4),
                rnd() * 6.28,
                rnd() * 6.28 + 2.2
            )
            g.stroke()
        }
    } else {
        for (let i = 0; i < 4; i++) {
            g.save()
            g.translate(size * rnd(), size * rnd())
            g.rotate(rnd() * Math.PI)
            g.scale(1, 0.35 + rnd() * 0.5)
            g.fillStyle = hexToRgba(i % 2 ? light : deep, 0.25 + rnd() * 0.3)
            g.beginPath()
            g.arc(0, 0, size * (0.12 + rnd() * 0.3), 0, Math.PI * 2)
            g.fill()
            g.restore()
        }
    }

    // Directional light across the whole crop, not a sphere highlight.
    const spec = g.createLinearGradient(0, 0, size, size)
    spec.addColorStop(0, "rgba(255,255,255,0.26)")
    spec.addColorStop(0.6, "rgba(255,255,255,0.02)")
    spec.addColorStop(1, "rgba(0,0,0,0.18)")
    g.globalCompositeOperation = "overlay"
    g.fillStyle = spec
    g.fillRect(0, 0, size, size)
    g.globalCompositeOperation = "source-over"

    return c
}

function hexToRgba(hex: string, a: number) {
    const h = hex.replace("#", "")
    const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** Deterministic 0..1 hash — keeps the composition identical on every reload. */
function hash01(n: number) {
    const s = Math.sin(n * 127.1) * 43758.5453123
    return s - Math.floor(s)
}

function srcOf(img: FramerImage): string | null {
    if (!img) return null
    if (typeof img === "string") return img
    return img.src ?? null
}

function parseColor(css: string): [number, number, number] {
    if (typeof document === "undefined") return [1, 1, 1]
    const c = document.createElement("canvas")
    c.width = c.height = 1
    const g = c.getContext("2d")!
    g.fillStyle = "#ffffff"
    g.fillStyle = css
    g.fillRect(0, 0, 1, 1)
    const d = g.getImageData(0, 0, 1, 1).data
    const a = d[3] / 255
    // Un-premultiply against white so translucent backgrounds still give the
    // shader a sensible colour to disperse against.
    return [d[0] / 255, d[1] / 255, d[2] / 255].map((v) => v * a + (1 - a)) as [
        number,
        number,
        number,
    ]
}

/* --------------------------------------------------------------- shaders */

const VERT = /* glsl */ `#version 300 es
precision highp float;

in vec2  a_quad;     // unit quad corner, 0..1
in vec4  a_orbit;    // osculating radius, angle on it, dirSign, discRadius (screen px)
in vec4  a_dist;     // distortion01, trailLengthPx, arcSpanRadians, fluidAmount
in vec4  a_style;    // chromatic, seed, osculating centre x, y (px from canvas centre)
in vec4  a_uv;       // atlas cell: u0, v0, du, dv

uniform vec2  u_res;
uniform vec2  u_center;
uniform float u_psi;   // trail axis: 0 = orbital tangent, PI/2 = radial

out vec2 v_pos;
out vec4 v_orbit;
out vec4 v_dist;
out vec4 v_style;
out vec4 v_uv;

void main() {
    float R = a_orbit.x, th = a_orbit.y, sgn = a_orbit.z, s = a_orbit.w;
    float L = a_dist.y, arcSpan = a_dist.z;
    float fluid = a_dist.w * a_dist.x;

    // The trail hangs behind the head along the stretch axis. Its centreline
    // is an arc of the element's own orbit (plus any radial component), so
    // bound it by sampling that arc rather than assuming a straight box.
    vec2 oc = a_style.zw;
    vec2 lo = vec2(1e9), hi = vec2(-1e9);
    for (int i = 0; i < 5; i++) {
        float k = float(i) / 4.0;
        float rad = R + L * sin(u_psi) * k;
        float ang = th - sgn * arcSpan * k;
        vec2 p = oc + rad * vec2(cos(ang), sin(ang));
        lo = min(lo, p);
        hi = max(hi, p);
    }
    float pad = s * (1.55 + fluid * 1.4 + a_style.x * 2.0);
    lo -= pad; hi += pad;

    vec2 pos = mix(lo, hi, a_quad);
    v_pos = pos;
    v_orbit = a_orbit;
    v_dist = a_dist;
    v_style = a_style;
    v_uv = a_uv;

    vec2 clip = ((pos + u_center) / u_res) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

const FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_pos;
in vec4 v_orbit;
in vec4 v_dist;
in vec4 v_style;
in vec4 v_uv;

uniform sampler2D u_tex;
uniform vec2  u_texel;
uniform vec3  u_bg;
uniform float u_time;
uniform float u_psi;
uniform int   u_samples;

out vec4 fragColor;

const float PI = 3.14159265359;

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

/* Smooth visible-spectrum weights; normalisation happens by accumulation so
   the exact shape only affects the hue ramp, never the neutral case. */
vec3 spectrum(float f) {
    float r = exp(-pow((f - 0.08) * 3.6, 2.0)) + 0.5 * exp(-pow((f - 0.99) * 4.0, 2.0));
    float g = exp(-pow((f - 0.46) * 3.4, 2.0));
    float b = exp(-pow((f - 0.84) * 3.3, 2.0));
    return vec3(r, g, b) + 0.015;
}

vec4 sampleCell(vec2 local) {
    vec2 uv = local * 0.5 + 0.5;
    vec2 lo = v_uv.xy + u_texel * 0.5;
    vec2 hi = v_uv.xy + v_uv.zw - u_texel * 0.5;
    return texture(u_tex, clamp(v_uv.xy + uv * v_uv.zw, lo, hi));
}

void main() {
    float R = v_orbit.x, th = v_orbit.y, sgn = v_orbit.z, s = v_orbit.w;
    float dAmt = v_dist.x, L = max(v_dist.y, 1e-3);
    float fluid = v_dist.w * dAmt;
    float chroma = v_style.x, seed = v_style.y;

    // Relative to this element's own osculating circle — the circle that best
    // fits its projected path right here. On a flat, head-on ring that is just
    // the orbit itself; under a 3D tilt it is the local fit to the ellipse, so
    // the trail still follows the path the element actually travels on screen.
    vec2 q = v_pos - v_style.zw;
    float r = length(q);
    if (r < 1e-3) discard;
    float phi = atan(q.y, q.x);

    // ---- the element's own orbital frame ---------------------------------
    // n runs outward along the radius, tb runs backward along the orbit's
    // tangent. Both are measured from the element's exact circular position,
    // so nothing here can move the element off its path.
    float da = phi - th;
    da = mod(da + PI, 2.0 * PI) - PI;
    float n  = r - R;                // radial offset, outward positive
    float tb = -(da * R * sgn);      // arc offset, positive = behind the head

    // ---- rotate into the stretch axis ------------------------------------
    // psi = 0 puts the trail on the tangent (directly behind the element's
    // travel); psi = PI/2 puts it on the radius. Everything below works in
    // this rotated frame, which is what makes the stretch directional.
    float cp = cos(u_psi), sp0 = sin(u_psi);
    float ax =  tb * cp + n * sp0;   // along the trail
    float bx = -tb * sp0 + n * cp;   // across the trail

    float reach = L * (1.0 + max(chroma, 0.0) * 0.9) + s * 0.3;
    if (ax > reach || ax < -s * 1.15) discard;
    if (abs(bx) > s * (2.0 + fluid * 2.0 + chroma * 2.6)) discard;

    float kBase = clamp(ax / L, 0.0, 1.0);

    // Fluid displacement — achromatic, so it warps every wavelength alike.
    // Anisotropic: low frequency along the trail, high across it, so the warp
    // reads as drawn-out filaments rather than lumps.
    vec2 np = vec2(ax / s * 0.22, bx / s * 1.45) * 1.2
            + vec2(seed * 17.0, seed * 41.0)
            + vec2(u_time * 0.18, u_time * 0.11);
    float w1 = vnoise(np) - 0.5;
    float w2 = vnoise(np * 2.9 + 11.3) - 0.5;
    float w3 = vnoise(np * 6.1 - 4.7) - 0.5;
    float grow = smoothstep(0.0, 0.28, kBase) * fluid;
    float warpT = (w1 * 1.5 + w2 * 0.7 + w3 * 0.35) * grow * 0.42;
    float warpN = (w2 + w3 * 0.5) * grow * 0.3;

    // The first disc-radius of travel stays a 1:1 disc so the head keeps
    // reading as a clean circle; everything beyond it is what gets pulled.
    float head = mix(1.0, 0.74, dAmt);
    float gamma = mix(1.0, 0.58, dAmt);
    float taper = dAmt * 0.46;

    vec3 colAcc = vec3(0.0);
    vec3 aAcc   = vec3(0.0);
    vec3 wSum   = vec3(0.0);

    int samples = (dAmt < 0.015 || chroma < 0.002) ? 1 : u_samples;
    // Dither the wavelength positions so the finite sample count reads as
    // grain instead of ribbing across the trail.
    float jitter = hash21(gl_FragCoord.xy + u_time) - 0.5;

    for (int i = 0; i < samples; i++) {
        float f = samples == 1 ? 0.5 : clamp((float(i) + jitter) / float(samples - 1), 0.0, 1.0);
        vec3 tint = samples == 1 ? vec3(1.0) : spectrum(f);

        float sp = (f - 0.5) * 2.0;   // -1 long wavelength … +1 short

        // Dispersion has three components: each wavelength is pulled a
        // different distance (bands across the trail), released at a slightly
        // different rate (colour through the body) and refracted sideways
        // (complementary edges, exactly like the reference's streaks).
        float Li = L * (1.0 + chroma * sp * 1.1);
        float gi = gamma * (1.0 + chroma * sp * 0.42);

        float X, k;
        if (ax <= 0.0) {
            X = ax / s;                      // leading half is untouched
            k = 0.0;
        } else if (ax <= s) {
            // Trailing half of the head eases into the stretch.
            float u = ax / s;
            X = u * mix(1.0, head, smoothstep(0.0, 1.0, u));
            k = 0.0;
        } else {
            k = (ax - s) / max(Li - s, 1e-3);
            // Past the tip the coordinate must keep growing, otherwise the
            // mask boundary would run on forever as a half-covered sliver.
            X = k <= 1.0 ? head + (1.0 - head) * pow(k, gi) : 1.0 + (k - 1.0) * 6.0;
        }
        // Full width behind the head, then narrowing to a comet tip.
        float halfW = 1.0 - taper * pow(min(k, 1.0), 1.55);
        float Y = bx / max(s * halfW, 1e-3);

        X += warpN;
        // Sideways refraction grows down the trail, so the streak splits into
        // complementary warm / cool flanks the way the reference's do.
        // Refraction ramps in down the trail, so the streak reads as image
        // first and spectrum later rather than colouring straight off the head.
        Y += warpT + chroma * sp * (0.05 + 1.5 * pow(min(k, 1.0), 1.7));

        float d = length(vec2(X, Y));
        float aa = min(fwidth(d), 0.05) + 0.01;
        float mask = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, d);
        if (mask > 0.0) {
            // Image content stays upright in screen space while the geometry
            // follows the orbit, so the local frame is rotated back here. The
            // basis is rebuilt from the fragment's own angle, which is what
            // makes the trail curve along the orbit instead of shearing flat.
            vec2 radial = vec2(cos(phi), sin(phi));
            vec2 back = -sgn * vec2(-sin(phi), cos(phi));   // against travel
            vec2 alongDir = back * cp + radial * sp0;
            vec2 crossDir = -back * sp0 + radial * cp;
            vec4 texel = sampleCell(X * alongDir + Y * crossDir);
            float cov = texel.a * mask;
            colAcc += texel.rgb * cov * tint;
            aAcc   += cov * tint;
        }
        wSum += tint;
    }

    vec3 a = aAcc / wSum;                                  // per-channel coverage
    vec3 c = colAcc / max(aAcc, vec3(1e-4));               // per-channel colour
    float A = max(max(a.r, a.g), a.b);
    if (A < 0.002) discard;

    // Per-channel compositing against the known background: channels the
    // dispersed samples never reach keep the background and read as a
    // saturated complementary colour.
    vec3 premult = c * a + u_bg * (A - a);

    fragColor = vec4(premult, A);
}`

/* ------------------------------------------------------------------ engine */

interface ElementState {
    orbit: number
    /** Exact angular position on the orbit at t = 0. */
    phase: number
    /** +1 or -1 only — the magnitude is shared by every element. */
    dir: number
    /** Fixed offset into the fluid-noise field. Affects texture, never geometry. */
    seed: number
    image: number
}

interface EngineConfig
    extends Omit<OrbitalFieldProps, "images" | "style" | "background"> {
    bg: [number, number, number]
}

const STRIDE = 16 // floats per instance: orbit(4) dist(4) style(4) uv(4)

class OrbitalEngine {
    private canvas: HTMLCanvasElement
    private gl: WebGL2RenderingContext | null = null
    private ctx2d: CanvasRenderingContext2D | null = null
    private prog: WebGLProgram | null = null
    private vao: WebGLVertexArrayObject | null = null
    private instBuf: WebGLBuffer | null = null
    private tex: WebGLTexture | null = null
    private uni: Record<string, WebGLUniformLocation | null> = {}

    private data = new Float32Array(0)
    private els: ElementState[] = []
    private cfg: EngineConfig
    private drawables: (CanvasImageSource & {
        width: number
        height: number
    })[] = []
    private cells: { u: number; v: number; du: number; dv: number }[] = []
    private atlasSize = 1
    private raf = 0
    private t0 = 0
    private clock = 0
    private last = 0
    private w = 0
    private h = 0
    private dpr = 1
    private ready = false
    private imageToken = 0
    private disposed = false
    private lastFit = "cover"
    /** Scratch for depth sorting — reused so the loop allocates nothing. */
    private packed: { w: number; v: number[] }[] = []
    /** Pointer parallax, eased toward the target each frame. */
    tiltX = 0
    tiltY = 0
    private tiltTargetX = 0
    private tiltTargetY = 0

    /** True on the Framer canvas and during export: one still frame, no loop. */
    private readonly isStatic: boolean

    constructor(
        canvas: HTMLCanvasElement,
        cfg: EngineConfig,
        isStatic = false
    ) {
        this.canvas = canvas
        this.cfg = cfg
        this.isStatic = isStatic
        // Static contexts get the plain 2D path: clean circles in their exact
        // orbital positions, no shader, no animation loop.
        const gl = isStatic
            ? null
            : canvas.getContext("webgl2", {
                  alpha: true,
                  antialias: false,
                  premultipliedAlpha: true,
                  powerPreference: "high-performance",
              })
        if (gl) {
            this.gl = gl
            this.initGL(gl)
            canvas.addEventListener("webglcontextlost", this.onLost)
            canvas.addEventListener("webglcontextrestored", this.onRestored)
        } else {
            this.ctx2d = canvas.getContext("2d")
        }
        this.t0 = performance.now()
        this.last = this.t0
    }

    private onLost = (e: Event) => {
        e.preventDefault()
        this.ready = false
    }

    private onRestored = () => {
        const gl = this.canvas.getContext(
            "webgl2"
        ) as WebGL2RenderingContext | null
        if (!gl || this.disposed) return
        this.gl = gl
        this.tex = null
        this.initGL(gl)
        this.buildAtlas(this.lastFit)
        this.ready = true
    }

    private initGL(gl: WebGL2RenderingContext) {
        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)!
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.warn("[OrbitalField]", gl.getShaderInfoLog(sh))
            }
            return sh
        }
        const prog = gl.createProgram()!
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.warn("[OrbitalField]", gl.getProgramInfoLog(prog))
            this.gl = null
            this.ctx2d = this.canvas.getContext("2d")
            return
        }
        this.prog = prog

        const vao = gl.createVertexArray()!
        gl.bindVertexArray(vao)

        const quad = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, quad)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
            gl.STATIC_DRAW
        )
        const aQuad = gl.getAttribLocation(prog, "a_quad")
        gl.enableVertexAttribArray(aQuad)
        gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0)

        this.instBuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf)
        const names = ["a_orbit", "a_dist", "a_style", "a_uv"]
        names.forEach((name, i) => {
            const loc = gl.getAttribLocation(prog, name)
            gl.enableVertexAttribArray(loc)
            gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, STRIDE * 4, i * 16)
            gl.vertexAttribDivisor(loc, 1)
        })
        gl.bindVertexArray(null)
        this.vao = vao
        ;[
            "u_res",
            "u_center",
            "u_tex",
            "u_texel",
            "u_bg",
            "u_time",
            "u_psi",
            "u_samples",
        ].forEach((n) => (this.uni[n] = gl.getUniformLocation(prog, n)))

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.disable(gl.DEPTH_TEST)
    }

    /* ---------------------------------------------------------- resources */

    setConfig(cfg: EngineConfig) {
        const rebuild =
            cfg.count !== this.cfg.count ||
            cfg.orbits !== this.cfg.orbits ||
            cfg.counterRotate !== this.cfg.counterRotate ||
            cfg.direction !== this.cfg.direction
        this.cfg = cfg
        if (rebuild || this.els.length === 0) this.buildElements()
        if (this.isStatic) this.renderStill()
    }

    async setImages(sources: FramerImage[], fit: string) {
        const token = ++this.imageToken
        const urls = sources.map(srcOf).filter(Boolean) as string[]
        let drawables: (CanvasImageSource & { width: number; height: number })[]
        if (urls.length === 0) {
            drawables = Array.from({ length: 10 }, (_, i) =>
                makeDefaultTexture(i)
            )
        } else {
            const loaded = await Promise.all(urls.map((u) => loadImage(u)))
            if (token !== this.imageToken || this.disposed) return // superseded
            drawables = loaded.filter(Boolean) as typeof drawables
            if (drawables.length === 0)
                drawables = Array.from({ length: 10 }, (_, i) =>
                    makeDefaultTexture(i)
                )
        }
        this.drawables = drawables
        this.buildAtlas(fit)
        this.buildElements()
        this.ready = true
        if (this.isStatic) this.renderStill()
    }

    private buildAtlas(fit: string) {
        this.lastFit = fit
        const n = this.drawables.length
        const cols = Math.ceil(Math.sqrt(n))
        const rows = Math.ceil(n / cols)
        const cell = Math.max(
            64,
            Math.min(512, Math.floor(2048 / Math.max(cols, rows)))
        )
        const w = cols * cell
        const h = rows * cell
        const c = document.createElement("canvas")
        c.width = w
        c.height = h
        const g = c.getContext("2d")!
        g.imageSmoothingQuality = "high"

        this.cells = []
        for (let i = 0; i < n; i++) {
            const cx = (i % cols) * cell
            const cy = Math.floor(i / cols) * cell
            const img = this.drawables[i]
            const iw = img.width || 1
            const ih = img.height || 1
            if (fit === "fill") {
                g.drawImage(img, cx, cy, cell, cell)
            } else {
                const ratio =
                    fit === "contain"
                        ? Math.min(cell / iw, cell / ih)
                        : Math.max(cell / iw, cell / ih)
                const dw = iw * ratio
                const dh = ih * ratio
                g.drawImage(
                    img,
                    cx + (cell - dw) / 2,
                    cy + (cell - dh) / 2,
                    dw,
                    dh
                )
            }
            this.cells.push({
                u: cx / w,
                v: cy / h,
                du: cell / w,
                dv: cell / h,
            })
        }

        const gl = this.gl
        if (!gl) return
        if (!this.tex) this.tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.tex)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        try {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                c
            )
        } catch (e) {
            // Cross-origin images without CORS headers taint the canvas.
            console.warn(
                "[OrbitalField] image blocked by CORS, using defaults",
                e
            )
            this.drawables = Array.from({ length: 10 }, (_, i) =>
                makeDefaultTexture(i)
            )
            this.buildAtlas(fit)
            return
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        this.atlasSize = Math.max(w, h)
        this.atlasW = w
        this.atlasH = h
    }
    private atlasW = 1
    private atlasH = 1

    /* ----------------------------------------------------------- elements */

    private buildElements() {
        const { count, orbits, counterRotate, direction } = this.cfg
        const nImg = Math.max(1, this.cells.length || 1)
        const baseDir = direction === "cw" ? 1 : -1
        const nOrbits = Math.max(1, Math.min(orbits, count))
        const els: ElementState[] = []

        // Even split across orbits; any remainder goes one-per-orbit from the
        // inside out, so counts differ by at most one.
        const per = Math.floor(count / nOrbits)
        const extra = count % nOrbits

        for (let k = 0; k < nOrbits; k++) {
            const num = per + (k < extra ? 1 : 0)
            if (num <= 0) continue
            const step = (Math.PI * 2) / num // exact angular spacing
            // Each ring starts half a step further round than the last, so
            // rings interleave instead of lining up as spokes. Deterministic
            // and geometric — not jitter.
            const base = (k * step) / 2
            // Inner half of the rings runs one way, outer half the other, at
            // an identical speed magnitude.
            const dir =
                counterRotate && k >= Math.ceil(nOrbits / 2)
                    ? -baseDir
                    : baseDir

            for (let j = 0; j < num; j++) {
                els.push({
                    orbit: k,
                    phase: base + step * j,
                    dir,
                    seed: hash01(k * 73.3 + j * 19.7 + 4.21),
                    image: (k * per + j) % nImg,
                })
            }
        }

        this.els = els
        this.data = new Float32Array(Math.max(1, els.length) * STRIDE)
    }

    /* ------------------------------------------------------------- render */

    resize(w: number, h: number, dpr: number) {
        this.w = w
        this.h = h
        this.dpr = dpr
        this.canvas.width = Math.max(1, Math.round(w * dpr))
        this.canvas.height = Math.max(1, Math.round(h * dpr))
        this.canvas.style.width = w + "px"
        this.canvas.style.height = h + "px"
        this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height)
        if (this.isStatic) this.renderStill()
    }

    /** Pointer position as -1..1 across the component; drives the parallax. */
    setPointer(nx: number, ny: number) {
        const amount = this.cfg.pointerParallax * 14 // degrees at the far edge
        this.tiltTargetX = -ny * amount
        this.tiltTargetY = nx * amount
    }

    /** Draw a single frame. Used in static contexts instead of the loop. */
    renderStill() {
        if (this.disposed) return
        this.last = performance.now()
        this.frame()
    }

    /** Only true while the component is on screen AND the tab is visible. */
    private inView = true
    private pageVisible =
        typeof document === "undefined" ? true : !document.hidden

    /**
     * Pause the loop when the component scrolls out of view or the tab is
     * hidden, and resume when both are true again. Nothing is drawn — and no
     * CPU or GPU time is spent — while paused.
     */
    setActivity(state: { inView?: boolean; pageVisible?: boolean }) {
        if (state.inView !== undefined) this.inView = state.inView
        if (state.pageVisible !== undefined)
            this.pageVisible = state.pageVisible
        if (this.isStatic) return
        if (this.inView && this.pageVisible) this.start()
        else this.stop()
    }

    start() {
        if (this.isStatic) return this.renderStill()
        if (this.raf || this.disposed) return
        if (!this.inView || !this.pageVisible) return
        // Resuming: reset the frame clock so the pause is not counted as one
        // huge time step.
        this.last = performance.now()
        const tick = () => {
            this.frame()
            this.raf = requestAnimationFrame(tick)
        }
        this.raf = requestAnimationFrame(tick)
    }

    stop() {
        cancelAnimationFrame(this.raf)
        this.raf = 0
    }

    dispose() {
        this.stop()
        this.disposed = true
        this.canvas.removeEventListener("webglcontextlost", this.onLost)
        this.canvas.removeEventListener("webglcontextrestored", this.onRestored)
        const gl = this.gl
        if (!gl) return
        gl.deleteTexture(this.tex)
        gl.deleteBuffer(this.instBuf)
        gl.deleteVertexArray(this.vao)
        gl.deleteProgram(this.prog)
        // Browsers cap live WebGL contexts; Framer re-mounts components often.
        gl.getExtension("WEBGL_lose_context")?.loseContext()
        this.gl = null
    }

    private frame() {
        const now = performance.now()
        const dt = Math.min(0.05, (now - this.last) / 1000)
        this.last = now
        if (this.cfg.animate && !this.isStatic) this.clock += dt
        // Ease the pointer tilt so it glides rather than snapping.
        const ease = 1 - Math.pow(0.001, dt)
        this.tiltX += (this.tiltTargetX - this.tiltX) * ease
        this.tiltY += (this.tiltTargetY - this.tiltY) * ease
        if (!this.ready || this.w === 0) return

        const c = this.cfg
        const px = this.dpr
        const W = this.w
        const H = this.h
        const time = this.clock

        // ---- one shared centre, always the middle of the component --------
        const cx = W / 2
        const cy = H / 2

        // ---- everything scales off the short edge -------------------------
        const minDim = Math.min(W, H)
        const halfW = Math.max(1, W / 2)
        const halfH = Math.max(1, H / 2)
        const unit = minDim / 2
        // One angular speed, shared by every element on every orbit.
        const omegaMag = (c.speed * Math.PI) / 180
        // Identical size for every element: diameter = imageSize x short edge.
        const s = Math.max(1, c.imageSize * minDim * 0.5)
        const psiSin = Math.sin((c.stretchAxis * Math.PI) / 2)

        // ---- the ring plane, rotated in 3D and projected ------------------
        // Elements are positioned on the rotated plane but drawn facing the
        // viewer, so each one stays a true circle. Perspective then scales it
        // by depth, which is what reads as parallax.
        const m = rotationMatrix(
            ((c.rotateX + this.tiltX) * Math.PI) / 180,
            ((c.rotateY + this.tiltY) * Math.PI) / 180,
            (c.rotateZ * Math.PI) / 180
        )
        const camera = c.perspective > 0.01 ? c.perspective * minDim : 0
        const project = (px: number, py: number, out: number[]) => {
            const X = m[0] * px + m[1] * py
            const Y = m[3] * px + m[4] * py
            const Z = m[6] * px + m[7] * py
            // Depth divisor. Clamped so an element swinging behind the camera
            // cannot invert or blow up.
            const w = camera > 0 ? Math.max(0.2, 1 - Z / camera) : 1
            out[0] = X / w
            out[1] = Y / w
            out[2] = w
        }

        const els = this.els
        const d = this.data
        const p0: number[] = [0, 0, 1]
        const p1: number[] = [0, 0, 1]
        const p2: number[] = [0, 0, 1]
        const H_ANG = 0.02 // finite-difference step, radians

        const packed = this.packed
        for (let i = 0; i < els.length; i++) {
            const e = els[i]

            // 1 — exact orbital position on the plane: x = R cos θ, y = R sin θ,
            //     with θ advancing purely from time × speed.
            const R = Math.max(
                1,
                unit * (c.orbitRadius + e.orbit * c.orbitSpacing)
            )
            const omega = omegaMag * e.dir
            const theta = e.phase + omega * time

            // 2 — project the point and its neighbours, and read the tangent
            //     and curvature of the *projected* path from them.
            project(
                Math.cos(theta - H_ANG) * R,
                Math.sin(theta - H_ANG) * R,
                p0
            )
            project(Math.cos(theta) * R, Math.sin(theta) * R, p1)
            project(
                Math.cos(theta + H_ANG) * R,
                Math.sin(theta + H_ANG) * R,
                p2
            )

            const x = p1[0]
            const y = p1[1]
            const depthScale = 1 / p1[2]
            const size = Math.max(0.5, s * depthScale)

            const vx = (p2[0] - p0[0]) / 2
            const vy = (p2[1] - p0[1]) / 2
            const ax = p2[0] - 2 * x + p0[0]
            const ay = p2[1] - 2 * y + p0[1]
            const speed = Math.hypot(vx, vy) || 1e-6
            const cross = vx * ay - vy * ax

            // Osculating circle of the projected path. On a flat head-on ring
            // this is exactly the orbit; tilted, it is the local fit.
            let rho =
                Math.abs(cross) > 1e-9
                    ? (speed * speed * speed) / Math.abs(cross)
                    : 1e7
            rho = Math.min(Math.max(rho, size * 2.5), 1e7)
            let nx = -vy / speed
            let ny = vx / speed
            if (nx * ax + ny * ay < 0) {
                nx = -nx
                ny = -ny
            }
            const ocx = x + nx * rho
            const ocy = y + ny * rho
            const phi = Math.atan2(y - ocy, x - ocx)
            const dir = Math.sign((x - ocx) * vy - (y - ocy) * vx) || 1

            // 3 — how far into the peripheral region the projected position
            //     sits. Normalised per axis, so the threshold means the same
            //     thing in a square, a banner and a phone frame.
            const nEdge = Math.hypot(x / halfW, y / halfH)

            // 4 — distortion amount, from position and velocity only. It never
            //     feeds back into the orbit above.
            let dAmt = 0
            if (c.distortion) {
                const p = smoothstep(
                    c.threshold,
                    c.threshold + c.falloff,
                    nEdge
                )
                const vel = speed / H_ANG / Math.max(1e-3, unit)
                const velMix =
                    1 - c.velocityInfluence + c.velocityInfluence * vel
                const edge = 1 + c.edgeTrail * Math.max(0, nEdge - 0.9)
                dAmt = clamp01(p * c.strength * velMix * edge)
            }

            // 5 — trail length, capped so it can never wrap far enough round
            //     its own osculating circle to alias.
            const L = Math.min(size * (1 + dAmt * 9 * c.stretch), rho * 2.2)
            const arcSpan =
                (L * Math.sqrt(Math.max(0, 1 - psiSin * psiSin))) / rho

            packed[i] = {
                w: p1[2],
                v: [
                    rho,
                    phi,
                    dir,
                    size,
                    dAmt,
                    L,
                    arcSpan,
                    c.fluidDisplacement,
                    c.chromatic * Math.min(1, dAmt * 1.35),
                    e.seed,
                    ocx,
                    ocy,
                    e.image % this.cells.length,
                ],
            }
        }

        // Far elements first, so nearer ones occlude them correctly.
        packed.length = els.length
        packed.sort((a, b) => b.w - a.w)

        for (let i = 0; i < packed.length; i++) {
            const v = packed[i].v
            const o = i * STRIDE
            for (let k = 0; k < 12; k++) d[o + k] = v[k]
            const cell = this.cells[v[12]]
            d[o + 12] = cell.u
            d[o + 13] = cell.v
            d[o + 14] = cell.du
            d[o + 15] = cell.dv
        }

        const gl = this.gl
        if (!gl || !this.prog) return this.frame2d(cx, cy)

        gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        gl.clearColor(c.bg[0], c.bg[1], c.bg[2], 1)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // Instance geometry is authored in CSS pixels; scale to device pixels.
        if (px !== 1) {
            for (let i = 0; i < els.length; i++) {
                const o = i * STRIDE
                d[o] *= px // osculating radius
                d[o + 3] *= px // disc radius
                d[o + 5] *= px // trail length
                d[o + 10] *= px // osculating centre x
                d[o + 11] *= px // osculating centre y
            }
        }

        gl.useProgram(this.prog)
        gl.bindVertexArray(this.vao)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf)
        gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.tex)
        gl.uniform1i(this.uni.u_tex, 0)
        gl.uniform2f(this.uni.u_res, W * px, H * px)
        gl.uniform2f(this.uni.u_center, cx * px, cy * px)
        gl.uniform2f(this.uni.u_texel, 1 / this.atlasW, 1 / this.atlasH)
        gl.uniform3f(this.uni.u_bg, c.bg[0], c.bg[1], c.bg[2])
        gl.uniform1f(this.uni.u_time, time)
        gl.uniform1f(this.uni.u_psi, (c.stretchAxis * Math.PI) / 2)
        gl.uniform1i(this.uni.u_samples, minDim < 520 ? 9 : 17)
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, els.length)
        gl.bindVertexArray(null)
    }

    /** Minimal 2D fallback for the rare context without WebGL2. */
    private frame2d(cx: number, cy: number) {
        const g = this.ctx2d
        if (!g) return
        const c = this.cfg
        const px = this.dpr
        g.setTransform(px, 0, 0, px, 0, 0)
        g.clearRect(0, 0, this.w, this.h)
        g.fillStyle = `rgb(${c.bg.map((v) => Math.round(v * 255)).join(",")})`
        g.fillRect(0, 0, this.w, this.h)
        const d = this.data
        // Same axis convention as the shader: 0 = tangent, 1 = radius.
        const axis = (c.stretchAxis * Math.PI) / 2
        for (let i = 0; i < this.els.length; i++) {
            const o = i * STRIDE
            const R = d[o],
                th = d[o + 1],
                sgn = d[o + 2],
                s = d[o + 3],
                dAmt = d[o + 4]
            const img =
                this.drawables[
                    this.packed[i]
                        ? this.packed[i].v[12] % this.drawables.length
                        : 0
                ]
            // Screen angle of the trail axis: against travel, rotated by psi.
            const backAngle = th + (sgn > 0 ? -Math.PI / 2 : Math.PI / 2)
            const stretchAngle = backAngle + sgn * axis
            // Static preview (Framer canvas / export) shows plain circles.
            const stretchAmt = this.isStatic ? 0 : dAmt
            g.save()
            g.globalAlpha = 1 - stretchAmt * 0.35
            g.translate(
                cx + d[o + 10] + Math.cos(th) * R,
                cy + d[o + 11] + Math.sin(th) * R
            )
            g.rotate(stretchAngle)
            g.scale(1 + stretchAmt * 2.2 * c.stretch, 1)
            g.beginPath()
            g.arc(0, 0, s, 0, Math.PI * 2)
            g.clip()
            g.rotate(-stretchAngle)
            g.drawImage(img as CanvasImageSource, -s, -s, s * 2, s * 2)
            g.restore()
        }
    }
}

/** Decoded images are shared across instances and survive prop changes. */
const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

function loadImage(url: string): Promise<HTMLImageElement | null> {
    const hit = imageCache.get(url)
    if (hit) return hit
    const p = new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image()
        // Required: WebGL refuses to upload a texture from a tainted image.
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = url
    })
    imageCache.set(url, p)
    return p
}

function stripUndefined<T extends object>(o: T): Partial<T> {
    const out: any = {}
    for (const k in o) if ((o as any)[k] !== undefined) out[k] = (o as any)[k]
    return out
}

/** Rz · Ry · Rx, row-major. Screen y is down and +z points at the viewer, so
 *  a positive X angle tips the bottom of the ring toward you, as CSS does. */
function rotationMatrix(ax: number, ay: number, az: number): number[] {
    const cx = Math.cos(ax),
        sx = Math.sin(ax)
    const cy = Math.cos(ay),
        sy = Math.sin(ay)
    const cz = Math.cos(az),
        sz = Math.sin(az)
    return [
        cz * cy,
        cz * sy * sx - sz * cx,
        cz * sy * cx + sz * sx,
        sz * cy,
        sz * sy * sx + cz * cx,
        sz * sy * cx - cz * sx,
        -sy,
        cy * sx,
        cy * cx,
    ]
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
function smoothstep(a: number, b: number, x: number) {
    const t = clamp01((x - a) / Math.max(1e-5, b - a))
    return t * t * (3 - 2 * t)
}

/* --------------------------------------------------------------- component */

const DEFAULTS: Omit<OrbitalFieldProps, "style"> = {
    images: [],
    count: 24,
    fit: "cover",

    // Two rings, fitted to the reference with this renderer's own projection
    // (20 px residual on a 3548 px frame): 0.49 and 1.00 of half the short
    // side, the plane rotated 38° on X and 47° on Z, camera at 1.65x the
    // short side. That camera reproduces the reference's near/far size
    // pattern without being fitted to it.
    orbits: 2,
    orbitRadius: 0.49,
    orbitSpacing: 0.51,
    speed: 14,
    direction: "ccw",
    counterRotate: true,

    rotateX: 38,
    rotateY: 0,
    rotateZ: 47,
    perspective: 1.65,
    pointerParallax: 0.25,

    imageSize: 0.06,

    distortion: true,
    strength: 1,
    threshold: 0.8,
    falloff: 0.3,
    velocityInfluence: 0.35,
    stretch: 0.75,
    stretchAxis: 0,
    fluidDisplacement: 0.55,
    chromatic: 0.62,
    edgeTrail: 1,

    animate: true,
    background: "#FAFAF8",
}

export default function OrbitalField(userProps: Partial<OrbitalFieldProps>) {
    const props = React.useMemo(
        () => ({ ...DEFAULTS, ...stripUndefined(userProps) }),
        [userProps]
    )
    const { images, fit, background, style } = props
    const hostRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const engineRef = React.useRef<OrbitalEngine | null>(null)

    const bg = React.useMemo(() => parseColor(background), [background])
    const cfg = React.useMemo<EngineConfig>(() => {
        const { images: _i, style: _s, background: _b, ...rest } = props
        return { ...rest, bg }
    }, [props, bg])

    // Framer canvas and export: render a still frame, never run the loop.
    const isStatic = useIsStaticRenderer()

    const imageKey = React.useMemo(
        () => images.map(srcOf).join("|") + "::" + fit,
        [images, fit]
    )

    React.useEffect(() => {
        const canvas = canvasRef.current
        const host = hostRef.current
        if (!canvas || !host) return
        const engine = new OrbitalEngine(canvas, cfg, isStatic)
        engineRef.current = engine

        // Measure the LAYOUT box, never getBoundingClientRect: on the Framer
        // canvas the component sits inside a zoom transform, and the rect
        // returns the zoomed size. Sizing the canvas from that makes it
        // smaller than its host, which pins the artwork to the top-left
        // corner instead of the centre. contentBoxSize / offsetWidth are
        // both transform-independent.
        const measure = (entry?: ResizeObserverEntry) => {
            let w = host.offsetWidth
            let h = host.offsetHeight
            const box = entry?.contentBoxSize
            if (box && box.length) {
                w = box[0].inlineSize
                h = box[0].blockSize
            }
            engine.resize(w, h, Math.min(window.devicePixelRatio || 1, 2))
        }

        const ro = new ResizeObserver((entries) => measure(entries[0]))
        ro.observe(host)
        measure()

        const onMove = (ev: PointerEvent) => {
            const r = host.getBoundingClientRect()
            if (!r.width || !r.height) return
            engine.setPointer(
                ((ev.clientX - r.left) / r.width) * 2 - 1,
                ((ev.clientY - r.top) / r.height) * 2 - 1
            )
        }
        const onLeave = () => engine.setPointer(0, 0)
        if (!isStatic) {
            host.addEventListener("pointermove", onMove)
            host.addEventListener("pointerleave", onLeave)
        }

        // Pause the WebGL loop while the component is off screen or the tab is
        // hidden. A small margin wakes it just before it scrolls into view.
        let io: IntersectionObserver | null = null
        const onVisibility = () =>
            engine.setActivity({ pageVisible: !document.hidden })
        if (!isStatic) {
            if (typeof IntersectionObserver !== "undefined") {
                io = new IntersectionObserver(
                    (entries) =>
                        engine.setActivity({
                            inView: entries[entries.length - 1].isIntersecting,
                        }),
                    { rootMargin: "100px" }
                )
                io.observe(host)
            }
            document.addEventListener("visibilitychange", onVisibility)
        }

        engine.start()
        // The engine was created after the first image effect ran, so hand it
        // the images now.
        engine.setImages(images ?? [], fit)

        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", onVisibility)
            ro.disconnect()
            host.removeEventListener("pointermove", onMove)
            host.removeEventListener("pointerleave", onLeave)
            engine.dispose()
            engineRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic])

    React.useEffect(() => {
        engineRef.current?.setConfig(cfg)
    }, [cfg])

    React.useEffect(() => {
        engineRef.current?.setImages(images ?? [], fit)
    }, [imageKey])

    return (
        <div
            ref={hostRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    )
}

const hideDistortion = (p: OrbitalFieldProps) => !p.distortion

addPropertyControls(OrbitalField, {
    /* ------------------------------------------------------------ content */
    images: {
        defaultValue: DEFAULTS.images,
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 64,
        description:
            "Leave empty to use the built-in set. JPG / PNG / WebP, transparency supported.",
    },
    count: {
        defaultValue: DEFAULTS.count,
        type: ControlType.Number,
        title: "Elements",
        min: 1,
        max: 64,
        step: 1,
        displayStepper: true,
        description:
            "Split evenly across the orbits, then spaced evenly around each one.",
    },
    fit: {
        defaultValue: DEFAULTS.fit,
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        displaySegmentedControl: true,
        description: "How each image is cropped into its circle.",
    },

    /* -------------------------------------------------------------- orbit */
    orbits: {
        defaultValue: DEFAULTS.orbits,
        type: ControlType.Number,
        title: "Orbits",
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    orbitRadius: {
        defaultValue: DEFAULTS.orbitRadius,
        type: ControlType.Number,
        title: "Radius",
        min: 0.05,
        max: 1.4,
        step: 0.01,
        description:
            "Innermost orbit, as a share of half the shortest side. 1 touches the edge.",
    },
    orbitSpacing: {
        defaultValue: DEFAULTS.orbitSpacing,
        type: ControlType.Number,
        title: "Spacing",
        min: 0.02,
        max: 0.6,
        step: 0.01,
    },
    speed: {
        defaultValue: DEFAULTS.speed,
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 90,
        step: 0.5,
        unit: "°/s",
        description: "Shared by every element on every orbit.",
    },
    direction: {
        defaultValue: DEFAULTS.direction,
        type: ControlType.Enum,
        title: "Direction",
        options: ["ccw", "cw"],
        optionTitles: ["CCW", "CW"],
        displaySegmentedControl: true,
    },
    counterRotate: {
        defaultValue: DEFAULTS.counterRotate,
        type: ControlType.Boolean,
        title: "Counter-rotate",
        description: "Outer orbits reverse direction at the same speed.",
    },

    /* ----------------------------------------------------------------- 3D */
    rotateX: {
        defaultValue: DEFAULTS.rotateX,
        type: ControlType.Number,
        title: "Rotate X",
        min: -80,
        max: 80,
        step: 1,
        unit: "°",
        description:
            "Tips the ring plane forward. The whole system rotates; images keep facing you.",
    },
    rotateY: {
        defaultValue: DEFAULTS.rotateY,
        type: ControlType.Number,
        title: "Rotate Y",
        min: -80,
        max: 80,
        step: 1,
        unit: "°",
    },
    rotateZ: {
        defaultValue: DEFAULTS.rotateZ,
        type: ControlType.Number,
        title: "Rotate Z",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    perspective: {
        defaultValue: DEFAULTS.perspective,
        type: ControlType.Number,
        title: "Perspective",
        min: 0,
        max: 4,
        step: 0.05,
        description:
            "Camera distance, as a share of the shortest side. Lower is stronger; 0 is flat.",
    },
    pointerParallax: {
        defaultValue: DEFAULTS.pointerParallax,
        type: ControlType.Number,
        title: "Pointer tilt",
        min: 0,
        max: 1,
        step: 0.01,
        description: "How far the plane leans toward the cursor.",
    },

    /* -------------------------------------------------------------- image */
    imageSize: {
        defaultValue: DEFAULTS.imageSize,
        type: ControlType.Number,
        title: "Image size",
        min: 0.01,
        max: 0.3,
        step: 0.005,
        description:
            "Diameter as a share of the shortest side. Identical for every element.",
    },

    /* --------------------------------------------------------- distortion */
    distortion: {
        defaultValue: DEFAULTS.distortion,
        type: ControlType.Boolean,
        title: "Distortion",
    },
    strength: {
        defaultValue: DEFAULTS.strength,
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 2,
        step: 0.01,
        hidden: hideDistortion,
    },
    threshold: {
        defaultValue: DEFAULTS.threshold,
        type: ControlType.Number,
        title: "Threshold",
        min: 0.05,
        max: 1.4,
        step: 0.01,
        hidden: hideDistortion,
        description: "Where the peripheral region starts. 1 is the frame edge.",
    },
    falloff: {
        defaultValue: DEFAULTS.falloff,
        type: ControlType.Number,
        title: "Falloff",
        min: 0.05,
        max: 1.5,
        step: 0.01,
        hidden: hideDistortion,
    },
    velocityInfluence: {
        defaultValue: DEFAULTS.velocityInfluence,
        type: ControlType.Number,
        title: "Velocity",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: hideDistortion,
    },
    stretch: {
        defaultValue: DEFAULTS.stretch,
        type: ControlType.Number,
        title: "Stretch",
        min: 0,
        max: 2,
        step: 0.01,
        hidden: hideDistortion,
    },
    stretchAxis: {
        defaultValue: DEFAULTS.stretchAxis,
        type: ControlType.Number,
        title: "Stretch axis",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: hideDistortion,
        description:
            "0 follows the orbital tangent. 1 pulls outward along the radius.",
    },
    fluidDisplacement: {
        defaultValue: DEFAULTS.fluidDisplacement,
        type: ControlType.Number,
        title: "Fluid",
        min: 0,
        max: 1.5,
        step: 0.01,
        hidden: hideDistortion,
    },
    chromatic: {
        defaultValue: DEFAULTS.chromatic,
        type: ControlType.Number,
        title: "Chromatic",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: hideDistortion,
    },
    edgeTrail: {
        defaultValue: DEFAULTS.edgeTrail,
        type: ControlType.Number,
        title: "Edge trails",
        min: 0,
        max: 2,
        step: 0.01,
        hidden: hideDistortion,
    },

    /* ------------------------------------------------------- animation */
    animate: {
        defaultValue: DEFAULTS.animate,
        type: ControlType.Boolean,
        title: "Animate",
    },

    /* ----------------------------------------------------------- style */
    background: {
        defaultValue: DEFAULTS.background,
        type: ControlType.Color,
        title: "Background",
        description:
            "Painted, not transparent — the spectral split is computed against it.",
    },
})
