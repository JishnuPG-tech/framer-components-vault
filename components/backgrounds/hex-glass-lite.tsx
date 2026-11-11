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


// Hex Glass Lite by Omnium Labs: the free version of Hex Glass. Same shader, hexagons only,
// cell size and speed fixed; Background, Glow, Refraction, Irregular and Strength are the controls.
// On the canvas and with reduced motion it is one still frame; it pauses while off screen.

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
uniform float uDensity, uRefract, uBevel, uGrain, uShape, uMouseAmt, uSeam, uShine, uVignette, uIrreg, uWarp, uLight;
uniform vec3 uC0, uC1, uC2, uC3;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float g(vec2 p, vec2 c, float r){ vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }

// the light behind the glass, p in aspect units (0..a, 0..1): a lava lamp. Six soft blobs rise, sink
// and melt into each other; the whole thing is bent by layered waves so the shapes flow like a liquid.
vec3 field(vec2 p){
  float a = uRes.x / uRes.y, t = uTime;
  vec2 c = vec2(a * .5, .5), q = p - c;
  float amp = uWarp * .02 + uWarp * uWarp * .22;  // grows fast: calm blobs at 0, wild swirls at 1
  for (int i = 1; i <= 5; i++) {   // each pass turns 36 degrees and waves a little finer
    float fi = float(i);
    q = mat2(.809, .588, -.588, .809) * q;
    q.x += amp * cos(fi * 2.2 * q.y + t * .35 + fi);
    q.y += amp * sin(fi * 2.2 * q.x - t * .3 + fi * 1.7);
  }
  p = c - q;                       // five turns of 36 = 180, so flip back
  float v = 0.;
  for (int i = 0; i < 6; i++) {
    float fi = float(i), h1 = fract(sin(fi * 12.9898) * 43758.5), h2 = fract(sin(fi * 78.233) * 43758.5);
    vec2 b = vec2(a * (.12 + .76 * h1 + .06 * sin(t * .11 + fi)), .5 + .48 * sin(t * (.09 + .05 * h2) + fi * 2.1));
    v += .55 * g(p, b, .13 + .09 * h2 + .03 * sin(t * .2 + fi * 3.));
  }
  v += uMouseAmt * .6 * g(p, uMouse, .2);
  vec3 col = mix(uC0, uC1, smoothstep(0., .5, v));
  col = mix(col, uC2, smoothstep(.25, .9, v));
  return mix(col, uC3, smoothstep(.7, 1.6, v));
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes.y;
  vec2 q = uv * uDensity;
  q += uIrreg * .35 * vec2(sin(q.y * .7 + sin(q.x * .4) * 1.3), cos(q.x * .6 + sin(q.y * .5) * 1.1));   // wobbly, uneven cells
  vec2 gv, dir, push; float e;
  if (uShape < .5) {            // hexagons, edge at e = 1
    vec2 r = vec2(1., 1.7320508), h = r * .5;
    vec2 A = mod(q, r) - h, B = mod(q - h, r) - h;
    gv = dot(A, A) < dot(B, B) ? A : B;
    vec2 ap = abs(gv);
    e = max(dot(ap, vec2(.5, .8660254)), ap.x) * 2.;
    dir = gv / max(length(gv), 1e-4);
    push = dir * pow(e, 1.8);
  } else if (uShape < 1.5) {    // squares
    gv = fract(q) - .5;
    e = max(abs(gv.x), abs(gv.y)) * 2.;
    dir = abs(gv.x) > abs(gv.y) ? vec2(sign(gv.x), 0.) : vec2(0., sign(gv.y));
    push = sign(gv) * pow(abs(gv) * 2., vec2(1.8));
  } else {                      // vertical ribs
    gv = vec2(fract(q.x) - .5, 0.);
    e = abs(gv.x) * 2.;
    dir = vec2(sign(gv.x), 0.);
    push = vec2(sign(gv.x) * pow(abs(gv.x) * 2., 1.8), 0.);
  }
  vec2 id = q - gv;

  // the glass: every cell pushes what is behind it outwards, harder towards the rim, so each cell
  // holds a squeezed piece of the light and the light breaks at the rim
  float rnd = hash(id);
  vec2 sp = uv + (push * uRefract * 1.7 * (.8 + .4 * rnd) + (vec2(rnd, hash(id + 7.)) - .5) * uIrreg * .3) / uDensity;
  vec3 col = field(sp);

  // optional light and shine on the cells (a gentle dome with a bevelled rim)
  float s = smoothstep(1. - uBevel, 1., e);
  vec3 N = normalize(vec3(dir * s * .7 + gv * .35, 1.));
  float a = uRes.x / uRes.y;
  vec3 L = normalize(vec3(-.45 + (uMouse.x / a - .5) * .8 * uMouseAmt, .55 + (uMouse.y - .5) * .8 * uMouseAmt, .7));
  float sh = dot(N, L) - L.z;
  col *= 1. + uLight * sh * (sh < 0. ? .35 : 1.);
  float spec = pow(max(dot(N, normalize(L + vec3(0., 0., 1.))), 0.), 40.) * s * s;
  col += uC3 * spec * uShine;
  col *= mix(1., 1. - uSeam, smoothstep(.975, 1., e));

  vec2 vg = frag / uRes - .5;
  col *= 1. - dot(vg, vg) * uVignette * 1.5;
  col += (hash(frag + fract(uTime) * 100.) - .5) * uGrain * .15;
  gl_FragColor = vec4(col, 1.);
}`

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`
const DPR = () => Math.min((typeof window !== "undefined" && window.devicePixelRatio) || 1, 1.5)

// a Framer colour (hex, rgba or a colour token) as [r, g, b] 0..1
let PAINT: CanvasRenderingContext2D | null = null
const RGB = new Map<string, number[]>()
function rgb(c: string | undefined, fallback: string): number[] {
    // a linked colour style comes as var(--token, rgb(...)) /* {"name":...} */: drop the note, keep the colour
    let s = (c || fallback).replace(/\/\*[\s\S]*?\*\//g, "").trim()
    const tok = /^var\([^,]+,\s*(.+)\)\s*$/.exec(s)
    if (tok) s = tok[1]
    const hit = RGB.get(s)
    if (hit) return hit
    if (!PAINT) PAINT = document.createElement("canvas").getContext("2d")
    if (!PAINT) return [0, 0, 0]
    PAINT.fillStyle = "#000"
    PAINT.fillStyle = s
    const out = String(PAINT.fillStyle)
    const n = out[0] === "#" ? [1, 3, 5].map((i) => parseInt(out.slice(i, i + 2), 16) / 255) : (out.match(/[\d.]+/g) || ["0", "0", "0"]).slice(0, 3).map((x) => +x / 255)
    RGB.set(s, n)
    return n
}

function reducedMotion() {
    return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Hex Glass Lite by Omnium Labs
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HexGlassLite(props: any) {
    const { background = "#010A03", glow = "#00FF41", style } = props

    const host = React.useRef<HTMLDivElement>(null)
    const cv = React.useRef<HTMLCanvasElement>(null)
    const draw = React.useRef<(() => void) | null>(null)
    const P = React.useRef(props)
    P.current = props
    const [live, setLive] = React.useState(false)
    const isStatic = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas

    React.useEffect(() => {
        const box = host.current, canvas = cv.current
        if (!box || !canvas) return
        const gl = canvas.getContext("webgl", { antialias: false })
        if (!gl) return
        const sh = (type: number, src: string) => {
            const s = gl.createShader(type)!
            gl.shaderSource(s, src)
            gl.compileShader(s)
            return s
        }
        const prog = gl.createProgram()!
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
        gl.useProgram(prog)
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, "p")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const U: Record<string, WebGLUniformLocation | null> = {}
        const u = (n: string) => (n in U ? U[n] : (U[n] = gl.getUniformLocation(prog, n)))

        const still = isStatic || reducedMotion()
        let t = 20, last = performance.now(), raf = 0, visible = true
        // pointer in aspect units, eased; starts in the middle
        let mx = -1, my = 0.5, tx = -1, ty = 0.5

        const size = () => {
            const d = DPR()
            const w = Math.max(1, Math.round(box.clientWidth * d)), h = Math.max(1, Math.round(box.clientHeight * d))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
                gl.viewport(0, 0, w, h)
            }
        }
        // Glow zones: Glow Zone components send their Power (window event "hexglass-power") while their section is in the
        // middle of the screen; the strength eases to it. Hex Glass itself never reads the page. No zones = own Strength.
        let pw = -1
        const W = window as any
        let zone: number = typeof W.__hexGlassPower === "number" ? W.__hexGlassPower : -1
        const onZone = (e: Event) => { zone = Number((e as CustomEvent).detail) }
        window.addEventListener("hexglass-power", onZone)
        const zonePower = (fallback: number) => (zone < 0 ? fallback : zone)
        const render = () => {
            const p = P.current
            size()
            const a = canvas.width / canvas.height
            if (mx < 0) (mx = tx = a / 2)
            gl.uniform2f(u("uRes"), canvas.width, canvas.height)
            gl.uniform1f(u("uTime"), t)
            gl.uniform2f(u("uMouse"), mx, my)
            gl.uniform1f(u("uDensity"), box.clientHeight / 56)
            gl.uniform1f(u("uShape"), 0)
            gl.uniform1f(u("uRefract"), p.refraction ?? 0.35)
            gl.uniform1f(u("uBevel"), 0.25)
            gl.uniform1f(u("uShine"), 0.05)
            gl.uniform1f(u("uIrreg"), p.irregular ?? 0)
            gl.uniform1f(u("uWarp"), 0.45)
            gl.uniform1f(u("uLight"), 0.06)
            gl.uniform1f(u("uSeam"), 0)
            gl.uniform1f(u("uMouseAmt"), still ? 0 : 0.6)
            gl.uniform1f(u("uGrain"), 0.25)
            gl.uniform1f(u("uVignette"), 0.6)
            // the two in-between colours are mixed from Background and Glow
            const goal = zonePower(p.strength ?? 1)
            pw = pw < 0 || still ? goal : pw + (goal - pw) * 0.06
            const bg = rgb(p.background, "#010A03"), k = 0.35 + 0.65 * pw
            const hi = rgb(p.glow, "#00FF41").map((v) => v * k)
            const mix = (k: number) => bg.map((v, i) => v + (hi[i] - v) * k)
            gl.uniform3fv(u("uC0"), bg)
            gl.uniform3fv(u("uC1"), mix(0.23))
            gl.uniform3fv(u("uC2"), mix(0.56))
            gl.uniform3fv(u("uC3"), hi)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }
        const frame = (now: number) => {
            t += Math.min(now - last, 100) / 1000
            last = now
            mx += (tx - mx) * 0.05
            my += (ty - my) * 0.05
            render()
            raf = visible ? requestAnimationFrame(frame) : 0
        }
        const onMove = (e: PointerEvent) => {
            const r = box.getBoundingClientRect()
            if (!r.height) return
            tx = (e.clientX - r.left) / r.height
            ty = 1 - (e.clientY - r.top) / r.height
        }

        draw.current = render
        render()
        setLive(true)

        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => still && render()) : null
        ro?.observe(box)
        let io: IntersectionObserver | null = null
        if (!still) {
            window.addEventListener("pointermove", onMove, { passive: true })
            raf = requestAnimationFrame(frame)
            if (typeof IntersectionObserver !== "undefined") {
                io = new IntersectionObserver((list) => {
                    visible = list[list.length - 1].isIntersecting
                    if (visible && !raf) {
                        last = performance.now()
                        raf = requestAnimationFrame(frame)
                    }
                })
                io.observe(box)
            }
        }
        return () => {
            window.removeEventListener("hexglass-power", onZone)
            cancelAnimationFrame(raf)
            ro?.disconnect()
            io?.disconnect()
            window.removeEventListener("pointermove", onMove)
            gl.deleteBuffer(buf)
            gl.deleteProgram(prog)
            draw.current = null
            setLive(false)
        }
    }, [isStatic])

    // a still frame follows the controls straight away; the moving one picks them up on its next frame
    React.useEffect(() => {
        draw.current?.()
    })

    return (
        <div ref={host} style={{ position: "relative", overflow: "hidden", background, ...style }}>
            {!live && (
                <div
                    aria-hidden="true"
                    style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 70% at 55% 45%, ${glow} 0%, ${background} 100%)`, opacity: 0.6 }}
                />
            )}
            <canvas ref={cv} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        </div>
    )
}

addPropertyControls(HexGlassLite, {
    background: { type: ControlType.Color, title: "Background", defaultValue: "#010A03" },
    glow: {
        type: ControlType.Color, title: "Glow", defaultValue: "#00FF41",
        description: "Hex Glass (full) adds squares and ribs, cell size, speed, four colours, light, bevel, shine, grain, mouse and corner controls.",
    },
    refraction: { type: ControlType.Number, title: "Refraction", defaultValue: 0.35, min: 0, max: 1, step: 0.01, description: "How much each cell bends the light behind it." },
    irregular: { type: ControlType.Number, title: "Irregular", defaultValue: 0, min: 0, max: 1, step: 0.01, description: "0 = even cells, higher = wobbly, uneven glass." },
    strength: { type: ControlType.Number, title: "Strength", defaultValue: 1, min: 0, max: 1, step: 0.01, description: "How bright the glow is. Lower it behind long text." },
})
