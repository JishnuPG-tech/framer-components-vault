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


// Scroll Warp Lite by Omnium Labs (free): scattered photos ride around a tall drum standing in the screen.
// Same drum as Scroll Warp; depth, photo size, gap, layout, speed and smoothing are fixed here.
// The full version (Scroll Warp) lets you set all of them.

const VERT = `
attribute vec2 aPos;
uniform vec4 uRect;   // x, y, w, h on the flat strip, css px (y down)
uniform vec2 uView;
uniform float uR;     // drum radius, px
uniform float uD;     // camera distance from the drum front, px
uniform mediump float uMax; // angle of the drum's visible edge (where the eye's line touches it)
uniform vec2 uUvScale, uUvOff;
varying vec2 vUv, vLocal;
varying float vTh;
void main() {
  vec2 p = uRect.xy + aPos * uRect.zw;
  vec2 c = uView * 0.5;
  vTh = (p.x - c.x) / uR;
  // past the visible edge the surface would fold back over itself: pin it to the edge
  float th = clamp(vTh, -uMax, uMax);
  float z = uR * (cos(th) - 1.0);
  float s = uD / (uD - z);
  vec2 q = vec2(c.x + uR * sin(th) * s, c.y + (p.y - c.y) * s);
  vec2 n = q / uView * 2.0 - 1.0;
  gl_Position = vec4(n.x, -n.y, 0.0, 1.0);
  vUv = uUvOff + aPos * uUvScale;
  vLocal = aPos * uRect.zw;
}`

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uCorner, uMax;
varying vec2 vUv, vLocal;
varying float vTh;
void main() {
  if (abs(vTh) > uMax) discard; // behind the drum's visible edge
  if (uCorner > 0.0) {
    vec2 q = abs(vLocal - uSize * 0.5) - (uSize * 0.5 - uCorner);
    if (length(max(q, 0.0)) > uCorner) discard;
  }
  gl_FragColor = texture2D(uTex, vUv);
}`

// grid mesh, enough columns for a smooth curve
const SEG = 32
const VERTS: number[] = []
const IDX: number[] = []
for (let y = 0; y <= SEG; y++) for (let x = 0; x <= SEG; x++) VERTS.push(x / SEG, y / SEG)
for (let y = 0; y < SEG; y++)
    for (let x = 0; x < SEG; x++) {
        const a = y * (SEG + 1) + x, b = a + 1, c = a + SEG + 1, d = c + 1
        IDX.push(a, b, c, b, d, c)
    }

// photo shapes for the placeholders (no photos added yet)
const SHAPES = [3 / 4, 4 / 3, 4 / 5, 1, 3 / 4, 5 / 4, 2 / 3, 4 / 3]
const TONES = [["#d9d3c9", "#b9b0a3"], ["#c9c4bd", "#9d968c"], ["#e3ddd3", "#c3b9aa"], ["#bdb6ab", "#8f877c"]]
const CANVAS_H = 800

// seeded random so the layout is the same on every load
const rnd = (i: number, k: number, seed: number) => {
    const s = Math.sin(i * 127.1 + k * 311.7 + seed * 74.7) * 43758.5453
    return s - Math.floor(s)
}

function placeholder(i: number): HTMLCanvasElement {
    const shape = SHAPES[i % SHAPES.length]
    const c = document.createElement("canvas")
    c.width = 480
    c.height = Math.round(480 / shape)
    const g = c.getContext("2d")!
    const [a, b] = TONES[i % TONES.length]
    const grad = g.createLinearGradient(0, 0, c.width * 0.4, c.height)
    grad.addColorStop(0, a)
    grad.addColorStop(1, b)
    g.fillStyle = grad
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = "rgba(0,0,0,0.35)"
    g.font = "500 28px ui-monospace, monospace"
    g.fillText(String(i + 1).padStart(2, "0"), 28, 52)
    return c
}

function reducedMotion() {
    return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type Photo = { tex: WebGLTexture | null; aspect: number }
type Rect = { x: number; y: number; w: number; h: number; shape: number }

/**
 * Scroll Warp Lite by Omnium Labs
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollWarpLite(props: any) {
    const { background = "rgba(0,0,0,0)", images = [], style } = props

    const box = React.useRef<HTMLDivElement>(null)
    const stage = React.useRef<HTMLDivElement>(null)
    const cv = React.useRef<HTMLCanvasElement>(null)
    const api = React.useRef<{ place: () => void; load: (srcs: string[]) => void } | null>(null)
    const P = React.useRef(props)
    P.current = props
    const isStatic = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas
    const srcs: string[] = (images || []).map((im: any) => im?.src).filter(Boolean)
    const key = srcs.join("|")
    const label = (images || []).map((im: any) => im?.alt).filter(Boolean).join(", ")

    React.useEffect(() => {
        const root = box.current, st = stage.current, canvas = cv.current
        if (!root || !st || !canvas) return
        const gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false })
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
        const vbuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(VERTS), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, "aPos")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const ibuf = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(IDX), gl.STATIC_DRAW)
        const U: Record<string, WebGLUniformLocation | null> = {}
        const u = (n: string) => (n in U ? U[n] : (U[n] = gl.getUniformLocation(prog, n)))

        const still = reducedMotion()
        let photos: Photo[] = []
        let layout: Rect[] = []
        let W = 0, H = 0, R = 1, D = 1, MAX = 1.5, stripW = 0, lead = 0, lastW = -1
        let cur = 0, target = 0, dirty = true, raf = 0, gen = 0

        const texture = (src: TexImageSource) => {
            const t = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, t)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            return t
        }

        let loaded: string | null = null
        const load = (list: string[]) => {
            if (list.join("|") === loaded) return
            loaded = list.join("|")
            const g = ++gen
            photos.forEach((p) => p.tex && gl.deleteTexture(p.tex))
            if (!list.length) {
                photos = SHAPES.map((s, i) => ({ tex: texture(placeholder(i)), aspect: s }))
            } else {
                photos = list.map((src) => {
                    const p: Photo = { tex: null, aspect: 1 }
                    const im = new Image()
                    im.crossOrigin = "anonymous"
                    im.onload = () => {
                        if (g !== gen) return
                        p.aspect = im.naturalWidth / im.naturalHeight
                        p.tex = texture(im)
                        place()
                    }
                    im.src = src
                    return p
                })
            }
            place()
        }

        const place = () => {
            const p = P.current
            W = root.clientWidth
            if (!W) return
            // screen height is read once per width, so the mobile address bar does not make it jump
            if (W !== lastW) {
                H = isStatic ? CANVAS_H : window.innerHeight
                lastW = W
            }
            const d = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.round(W * d)
            canvas.height = Math.round(H * d)
            gl.viewport(0, 0, canvas.width, canvas.height)
            R = (W * (p.drumRadius ?? 62)) / 100
            // camera distance: close = photos shrink a lot toward the edges, far = almost flat
            const depth = p.depth ?? 0.7
            D = W * (0.5 + Math.pow(1 - depth, 2) * 6)
            MAX = Math.acos(R / (R + D))
            const narrow = W < 700
            const slot = W * (narrow ? 0.7 : 0.36) * (p.photoSize ?? 1)
            const pad = H * 0.07
            const sc = p.scatter ?? 1, gap = p.gap ?? 32, seed = p.seed ?? 1
            const hit = (a: Rect, b: Rect) => a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap
            layout = []
            photos.forEach((ph, i) => {
                const shape = Math.min(1.6, Math.max(0.6, ph.tex ? ph.aspect : SHAPES[i % SHAPES.length]))
                const w = slot * (1 - sc * 0.5 * rnd(i, 1, seed))
                const h = Math.min(w / shape, H * 0.66)
                // scatter 0 = one calm row in the middle, 1 = anywhere from top to bottom
                const yFlat = (H - h) / 2
                const yScat = pad + (H - h - pad * 2) * rnd(i, 2, seed)
                const prev = layout[i - 1]
                // the next photo may slide under / over the previous one instead of always after it
                const x0 = prev ? prev.x + prev.w * (1 - sc * 0.75 * rnd(i, 3, seed)) + gap : 0
                const r: Rect = { x: x0, y: yFlat + (yScat - yFlat) * sc, w, h, shape: w / h }
                while (layout.slice(-3).some((o) => hit(r, o))) r.x += 8
                layout.push(r)
            })
            stripW = layout.length ? Math.max(...layout.map((r) => r.x + r.w)) : 0
            lead = R * MAX + W * 0.02
            st.style.height = H + "px"
            root.style.height = (isStatic ? H : H + (stripW + lead * 2) / Math.max(0.1, p.speed ?? 1)) + "px"
            if (isStatic) cur = target = stripW / 2 - W / 2
            dirty = true
            if (isStatic) draw()
        }

        const read = () => {
            const r = root.getBoundingClientRect()
            const travel = stripW + lead * 2
            const prog = Math.min(1, Math.max(0, -r.top / Math.max(1, root.offsetHeight - H)))
            // starts with the first photo just behind the right edge of the drum,
            // ends with the last one gone behind the left edge
            target = prog * travel - (W / 2 + lead)
            return r.bottom > 0 && r.top < window.innerHeight
        }

        const draw = () => {
            const p = P.current
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.uniform2f(u("uView"), W, H)
            gl.uniform1f(u("uR"), R)
            gl.uniform1f(u("uD"), D)
            gl.uniform1f(u("uMax"), MAX)
            gl.uniform1f(u("uCorner"), p.corners ?? 0)
            const reach = R * MAX
            layout.forEach((r, i) => {
                const ph = photos[i]
                const x = r.x - cur
                if (!ph || !ph.tex || x - W / 2 > reach || x + r.w - W / 2 < -reach) return
                // object-fit: cover
                let sx = 1, sy = 1
                if (ph.aspect > r.shape) sx = r.shape / ph.aspect
                else sy = ph.aspect / r.shape
                gl.uniform4f(u("uRect"), x, r.y, r.w, r.h)
                gl.uniform2f(u("uSize"), r.w, r.h)
                gl.uniform2f(u("uUvScale"), sx, sy)
                gl.uniform2f(u("uUvOff"), (1 - sx) / 2, (1 - sy) / 2)
                gl.bindTexture(gl.TEXTURE_2D, ph.tex)
                gl.drawElements(gl.TRIANGLES, IDX.length, gl.UNSIGNED_SHORT, 0)
            })
        }

        const frame = () => {
            raf = requestAnimationFrame(frame)
            if (!read()) return
            const prev = cur
            // Smoothing 0 = sticks to the scroll, 1 = long soft glide
            const k = still ? 1 : 0.03 + 0.25 * (1 - (P.current.smoothing ?? 0.75))
            cur += (target - cur) * k
            if (Math.abs(target - cur) < 0.05) cur = target
            if (cur !== prev || dirty) {
                draw()
                dirty = false
            }
        }

        api.current = { place, load }
        load(srcs)
        if (!isStatic) {
            read()
            cur = target
            raf = requestAnimationFrame(frame)
        }
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => root.clientWidth !== lastW && place()) : null
        ro?.observe(root)

        return () => {
            gen++
            cancelAnimationFrame(raf)
            ro?.disconnect()
            photos.forEach((p) => p.tex && gl.deleteTexture(p.tex))
            gl.deleteBuffer(vbuf)
            gl.deleteBuffer(ibuf)
            gl.deleteProgram(prog)
            api.current = null
        }
    }, [isStatic])

    React.useEffect(() => {
        api.current?.load(srcs)
    }, [key])

    // controls apply straight away
    React.useEffect(() => {
        api.current?.place()
    })

    return (
        <div ref={box} style={{ position: "relative", width: "100%", height: CANVAS_H, background, ...style }}>
            <div ref={stage} style={{ position: "sticky", top: 0, width: "100%", height: CANVAS_H, overflow: "hidden" }}>
                <canvas
                    ref={cv}
                    role="img"
                    aria-label={label || "Photo gallery"}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
                />
            </div>
        </div>
    )
}

addPropertyControls(ScrollWarpLite, {
    images: {
        type: ControlType.Array, title: "Photos", maxCount: 12,
        control: { type: ControlType.ResponsiveImage },
        description: "Up to 12 photos. Without photos you see grey placeholders.",
    },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0,0,0,0)", optional: true },
    drumRadius: {
        type: ControlType.Number, title: "Drum radius", defaultValue: 62, min: 20, max: 200, step: 1, unit: "%",
        description: "Size of the drum, as % of the component width. Scroll Warp (full) adds depth, photo size, gap, shuffle, speed and up to 40 photos.",
    },
    scatter: {
        type: ControlType.Number, title: "Scatter", defaultValue: 1, min: 0, max: 1, step: 0.01,
        description: "0 = one calm row in the middle, 1 = photos scattered at random heights and sizes.",
    },
    corners: { type: ControlType.Number, title: "Corners", defaultValue: 0, min: 0, max: 60, step: 1, unit: "px" },
})
