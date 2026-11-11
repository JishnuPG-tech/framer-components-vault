// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"

type ShapeName = "asterisk" | "bauhaus" | "wave" | "cluster" | "rings"

interface Props {
    image?: { src: string } | string
    shapePreset: ShapeName
    dotColor: string
    background: string
    gridSize: number
    smear: number
    trailDecay: number
    trailIntensity: number
    cursorRadius: number
    baseGlow: number
    haloAmount: number
    autoplay: boolean
    autoplaySpeed: number
    respectMotionPreference: boolean
    width?: number | string
    height?: number | string
}

// Procedural shape painters. Each draws a white silhouette on the canvas
// the shader will sample. The shader only reads the red channel, so any
// bright fill on black works.
const SHAPES: Record<
    ShapeName,
    (ctx: CanvasRenderingContext2D, s: number) => void
> = {
    asterisk: (ctx, s) => {
        ctx.fillStyle = "#fff"
        const cx = s / 2,
            cy = s / 2
        const armW = s * 0.06,
            armL = s * 0.7
        const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]
        for (const a of angles) {
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(a)
            ctx.fillRect(-armW / 2, -armL / 2, armW, armL)
            ctx.restore()
        }
    },
    bauhaus: (ctx, s) => {
        ctx.fillStyle = "#fff"
        ctx.beginPath()
        ctx.arc(s * 0.35, s * 0.45, s * 0.18, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(s * 0.55, s * 0.28)
        ctx.lineTo(s * 0.55, s * 0.62)
        ctx.lineTo(s * 0.8, s * 0.45)
        ctx.closePath()
        ctx.fill()
        ctx.fillRect(s * 0.42, s * 0.66, s * 0.18, s * 0.18)
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = s * 0.025
        ctx.beginPath()
        ctx.arc(s * 0.5, s * 0.5, s * 0.42, 0, Math.PI * 2)
        ctx.stroke()
    },
    wave: (ctx, s) => {
        ctx.strokeStyle = "#fff"
        ctx.lineCap = "round"
        ctx.lineWidth = s * 0.07
        ctx.beginPath()
        const amp = s * 0.2
        const points = 200
        for (let i = 0; i <= points; i++) {
            const t = i / points
            const x = s * 0.08 + s * 0.84 * t
            const y = s * 0.5 + Math.sin(t * Math.PI * 4) * amp
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }
        ctx.stroke()
    },
    cluster: (ctx, s) => {
        ctx.fillStyle = "#fff"
        const items: Array<[number, number, string, number, number]> = [
            [0.5, 0.5, "plus", 0.32, 0],
            [0.2, 0.22, "bar", 0.13, Math.PI / 4],
            [0.8, 0.2, "bar", 0.14, -Math.PI / 4],
            [0.16, 0.78, "plus", 0.11, 0],
            [0.84, 0.8, "plus", 0.13, 0],
            [0.5, 0.12, "dot", 0.045, 0],
            [0.5, 0.88, "dot", 0.04, 0],
            [0.32, 0.84, "bar", 0.08, Math.PI / 3],
            [0.68, 0.16, "dot", 0.035, 0],
        ]
        for (const [nx, ny, type, sz, rot] of items) {
            const x = nx * s,
                y = ny * s,
                ss = sz * s
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(rot)
            if (type === "plus") {
                const t = ss * 0.22
                ctx.fillRect(-ss / 2, -t / 2, ss, t)
                ctx.fillRect(-t / 2, -ss / 2, t, ss)
            } else if (type === "bar") {
                ctx.fillRect(-ss / 2, -ss * 0.1, ss, ss * 0.2)
            } else if (type === "dot") {
                ctx.beginPath()
                ctx.arc(0, 0, ss, 0, Math.PI * 2)
                ctx.fill()
            }
            ctx.restore()
        }
    },
    rings: (ctx, s) => {
        ctx.strokeStyle = "#fff"
        ctx.fillStyle = "#fff"
        const cx = s / 2,
            cy = s / 2
        ctx.lineWidth = s * 0.035
        for (const r of [0.16, 0.28, 0.4]) {
            ctx.beginPath()
            ctx.arc(cx, cy, s * r, 0, Math.PI * 2)
            ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(cx, cy, s * 0.055, 0, Math.PI * 2)
        ctx.fill()
        ctx.lineWidth = s * 0.03
        for (let i = 0; i < 4; i++) {
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate((i * Math.PI) / 2)
            ctx.beginPath()
            ctx.moveTo(0, s * 0.43)
            ctx.lineTo(0, s * 0.48)
            ctx.stroke()
            ctx.restore()
        }
    },
}

function paintShape(ctx: CanvasRenderingContext2D, s: number, name: ShapeName) {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, s, s)
    const draw = SHAPES[name] || SHAPES.asterisk
    draw(ctx, s)
}

const VS =
    "attribute vec2 a; varying vec2 vUv; void main(){ vUv = a*0.5+0.5; gl_Position = vec4(a,0.0,1.0); }"

const TRAIL_FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform vec2 uRes;
uniform vec2 uMC;
uniform vec2 uMP;
uniform float uDecay;
uniform float uStamp;
float dSeg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a; vec2 ba = b - a;
  float h = clamp(dot(pa,ba) / max(dot(ba,ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h);
}
void main(){
  vec2 fc = vUv * uRes;
  float prev = texture2D(uPrev, vUv).r * uDecay;
  float d = dSeg(fc, uMP, uMC);
  float st = exp(-d*d / (uStamp*uStamp));
  gl_FragColor = vec4(max(prev, st), 0.0, 0.0, 1.0);
}
`

// Display shader: paints background, then adds LED light additively.
// Background uniform makes the "background" prop actually do something.
const DISP_FS = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform sampler2D uShape;
uniform sampler2D uTrail;
uniform float uGrid;
uniform float uSmear;
uniform float uTrailG;
uniform float uBase;
uniform float uHalo;
uniform vec3 uCol;
uniform vec3 uBg;
void main(){
  vec2 fc = vUv * uRes;
  vec2 cell = vec2(uGrid);
  vec2 cid = floor(fc / cell);
  vec2 cc = (cid + 0.5) * cell;
  vec2 inC = fc - cc;
  vec2 uv = cc / uRes;
  uv.y = 1.0 - uv.y;
  float scrA = uRes.x / uRes.y;
  vec2 c = uv - 0.5;
  if (scrA > 1.0) c.y *= 1.0 / scrA; else c.x *= scrA;
  vec2 sUv = c + 0.5;
  float b = 0.0; float ws = 0.0;
  for (int i = -8; i <= 8; i++){
    float fi = float(i);
    float w = exp(-fi*fi * 0.06);
    vec2 off = vec2(fi * uSmear * 0.013, 0.0);
    b += texture2D(uShape, sUv + off).r * w;
    ws += w;
  }
  b /= ws;
  float tr = texture2D(uTrail, cc / uRes).r;
  float bright = uBase + b * 0.85 + tr * uTrailG;
  float dotR = uGrid * 0.42 * clamp(bright, 0.0, 1.8);
  float dd = length(inC);
  float dot = smoothstep(dotR + 1.5, dotR - 1.5, dd);
  float halo = smoothstep(uGrid * 1.5, 0.0, dd) * bright * uHalo;
  vec3 light = uCol * (dot + halo);
  gl_FragColor = vec4(uBg + light, 1.0);
}
`

// Universal CSS color parser via 1x1 canvas. Handles hex, rgb/rgba,
// hsl/hsla, oklch, and named colors — anything the browser accepts.
const colorCanvas =
    typeof document !== "undefined" ? document.createElement("canvas") : null
if (colorCanvas) {
    colorCanvas.width = 1
    colorCanvas.height = 1
}
const colorCtx = colorCanvas ? colorCanvas.getContext("2d") : null
const colorCache = new Map<string, [number, number, number]>()

function parseColor(input: string): [number, number, number] {
    if (!input) return [0, 0, 0]
    const cached = colorCache.get(input)
    if (cached) return cached
    if (!colorCtx) return [0, 0, 0]
    colorCtx.clearRect(0, 0, 1, 1)
    colorCtx.fillStyle = "#000000"
    colorCtx.fillStyle = input
    colorCtx.fillRect(0, 0, 1, 1)
    const d = colorCtx.getImageData(0, 0, 1, 1).data
    const out: [number, number, number] = [d[0] / 255, d[1] / 255, d[2] / 255]
    colorCache.set(input, out)
    return out
}

export default function LedMatrixCursorTrail(props: Props) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props

    const apiRef = useRef<{
        updateShape: (img: HTMLImageElement | HTMLCanvasElement) => void
    } | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return

        const gl = canvas.getContext("webgl", {
            antialias: false,
            alpha: true,
            preserveDrawingBuffer: false,
        })
        if (!gl) return

        const DPR = Math.min(window.devicePixelRatio || 1, 2)

        const mkShader = (t: number, src: string) => {
            const s = gl.createShader(t)!
            gl.shaderSource(s, src)
            gl.compileShader(s)
            return s
        }
        const mkProg = (vs: string, fs: string) => {
            const p = gl.createProgram()!
            gl.attachShader(p, mkShader(gl.VERTEX_SHADER, vs))
            gl.attachShader(p, mkShader(gl.FRAGMENT_SHADER, fs))
            gl.linkProgram(p)
            return p
        }

        const trailProg = mkProg(VS, TRAIL_FS)
        const dispProg = mkProg(VS, DISP_FS)

        const quad = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, quad)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        )
        const bindQuad = (prog: WebGLProgram) => {
            gl.useProgram(prog)
            gl.bindBuffer(gl.ARRAY_BUFFER, quad)
            const aLoc = gl.getAttribLocation(prog, "a")
            gl.enableVertexAttribArray(aLoc)
            gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0)
        }

        const shapeTex = gl.createTexture()!
        gl.bindTexture(gl.TEXTURE_2D, shapeTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        // Initial paint — use whatever shapePreset is set at mount time
        const initShape = document.createElement("canvas")
        initShape.width = 1024
        initShape.height = 1024
        paintShape(
            initShape.getContext("2d")!,
            1024,
            propsRef.current.shapePreset
        )
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            initShape
        )

        apiRef.current = {
            updateShape(src) {
                gl.bindTexture(gl.TEXTURE_2D, shapeTex)
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    src
                )
            },
        }

        type FBO = {
            tex: WebGLTexture
            fbo: WebGLFramebuffer
            w: number
            h: number
        }
        let fboA: FBO | null = null
        let fboB: FBO | null = null

        const mkFBO = (w: number, h: number): FBO => {
            const tex = gl.createTexture()!
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                w,
                h,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null
            )
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            const fbo = gl.createFramebuffer()!
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                tex,
                0
            )
            gl.clearColor(0, 0, 0, 1)
            gl.clear(gl.COLOR_BUFFER_BIT)
            return { tex, fbo, w, h }
        }

        const resize = () => {
            const r = wrap.getBoundingClientRect()
            const w = Math.max(1, Math.floor(r.width * DPR))
            const h = Math.max(1, Math.floor(r.height * DPR))
            if (canvas.width === w && canvas.height === h && fboA) return
            canvas.width = w
            canvas.height = h
            if (fboA) {
                gl.deleteTexture(fboA.tex)
                gl.deleteFramebuffer(fboA.fbo)
            }
            if (fboB) {
                gl.deleteTexture(fboB.tex)
                gl.deleteFramebuffer(fboB.fbo)
            }
            fboA = mkFBO(w, h)
            fboB = mkFBO(w, h)
        }
        resize()

        const ro = new ResizeObserver(() => resize())
        ro.observe(wrap)

        const uTp = gl.getUniformLocation(trailProg, "uPrev")
        const uTr = gl.getUniformLocation(trailProg, "uRes")
        const uTmc = gl.getUniformLocation(trailProg, "uMC")
        const uTmp = gl.getUniformLocation(trailProg, "uMP")
        const uTd = gl.getUniformLocation(trailProg, "uDecay")
        const uTs = gl.getUniformLocation(trailProg, "uStamp")

        const uDr = gl.getUniformLocation(dispProg, "uRes")
        const uDs = gl.getUniformLocation(dispProg, "uShape")
        const uDt = gl.getUniformLocation(dispProg, "uTrail")
        const uDg = gl.getUniformLocation(dispProg, "uGrid")
        const uDsm = gl.getUniformLocation(dispProg, "uSmear")
        const uDtg = gl.getUniformLocation(dispProg, "uTrailG")
        const uDb = gl.getUniformLocation(dispProg, "uBase")
        const uDh = gl.getUniformLocation(dispProg, "uHalo")
        const uDc = gl.getUniformLocation(dispProg, "uCol")
        const uDbg = gl.getUniformLocation(dispProg, "uBg")

        let mx = canvas.width / 2,
            my = canvas.height / 2
        let pmx = mx,
            pmy = my
        let tmx = mx,
            tmy = my
        let active = false
        let lastInteraction = performance.now()
        let rafId = 0
        // Forward holder so the media-query listener can request a frame
        // without forward-referencing the const directly.
        const startFrame = { run: () => {} }

        // Respect prefers-reduced-motion. When true, we skip animation
        // entirely and render a single static frame so users don't see
        // a frozen canvas (which would be confusing).
        const motionQuery =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        let reduceMotion = motionQuery ? motionQuery.matches : false
        const onMotionChange = (e: MediaQueryListEvent) => {
            reduceMotion = e.matches
            if (!reduceMotion && !rafId) {
                startFrame.run()
            }
        }
        if (motionQuery) {
            // Modern listener with cross-browser fallback for Safari < 14
            if (motionQuery.addEventListener) {
                motionQuery.addEventListener("change", onMotionChange)
            } else if ((motionQuery as any).addListener) {
                ;(motionQuery as any).addListener(onMotionChange)
            }
        }

        const onEnter = () => {
            active = true
            lastInteraction = performance.now()
        }
        const onMove = (e: MouseEvent) => {
            const r = canvas.getBoundingClientRect()
            tmx = (e.clientX - r.left) * DPR
            tmy = canvas.height - (e.clientY - r.top) * DPR
            active = true
            lastInteraction = performance.now()
        }
        const onLeave = () => {
            active = false
        }
        const onTouch = (e: TouchEvent) => {
            const t = e.touches[0]
            if (!t) return
            const r = canvas.getBoundingClientRect()
            tmx = (t.clientX - r.left) * DPR
            tmy = canvas.height - (t.clientY - r.top) * DPR
            active = true
            lastInteraction = performance.now()
        }
        canvas.addEventListener("mouseenter", onEnter)
        canvas.addEventListener("mousemove", onMove)
        canvas.addEventListener("mouseleave", onLeave)
        canvas.addEventListener("touchstart", onTouch, { passive: true })
        canvas.addEventListener("touchmove", onTouch, { passive: true })

        // Lissajous-style autoplay. After 2 seconds of no real input, a
        // virtual cursor traces a smooth figure-eight so the component
        // never looks frozen on load or on touchless mobile previews.
        const startTime = performance.now()
        const frame = () => {
            const p = propsRef.current
            const now = performance.now()
            const idleMs = now - lastInteraction
            const shouldAutoplay = p.autoplay && idleMs > 2000 && !active

            if (shouldAutoplay) {
                // Lissajous figure with slow drift. Speed scales with prop.
                const t = (now - startTime) * 0.001 * p.autoplaySpeed
                const cx = canvas.width / 2
                const cy = canvas.height / 2
                const rx = canvas.width * 0.32
                const ry = canvas.height * 0.32
                tmx = cx + Math.sin(t * 0.7) * rx
                tmy = cy + Math.sin(t * 1.1 + 0.5) * ry
            }

            pmx = mx
            pmy = my
            mx += (tmx - mx) * 0.25
            my += (tmy - my) * 0.25

            const drawCursor = active || shouldAutoplay
            const stampX = drawCursor ? mx : -10000
            const stampY = drawCursor ? my : -10000
            const stampPX = drawCursor ? pmx : -10000
            const stampPY = drawCursor ? pmy : -10000

            const col = parseColor(p.dotColor)
            const bg = parseColor(p.background)
            const gridPx = Math.max(2, p.gridSize * DPR)

            bindQuad(trailProg)
            gl.bindFramebuffer(gl.FRAMEBUFFER, fboB!.fbo)
            gl.viewport(0, 0, fboB!.w, fboB!.h)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, fboA!.tex)
            gl.uniform1i(uTp, 0)
            gl.uniform2f(uTr, fboB!.w, fboB!.h)
            gl.uniform2f(uTmc, stampX, stampY)
            gl.uniform2f(uTmp, stampPX, stampPY)
            gl.uniform1f(uTd, p.trailDecay)
            gl.uniform1f(uTs, p.cursorRadius * DPR)
            gl.drawArrays(gl.TRIANGLES, 0, 6)

            bindQuad(dispProg)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, shapeTex)
            gl.uniform1i(uDs, 0)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, fboB!.tex)
            gl.uniform1i(uDt, 1)
            gl.uniform2f(uDr, canvas.width, canvas.height)
            gl.uniform1f(uDg, gridPx)
            gl.uniform1f(uDsm, p.smear)
            gl.uniform1f(uDtg, p.trailIntensity)
            gl.uniform1f(uDb, p.baseGlow)
            gl.uniform1f(uDh, p.haloAmount)
            gl.uniform3f(uDc, col[0], col[1], col[2])
            gl.uniform3f(uDbg, bg[0], bg[1], bg[2])
            gl.drawArrays(gl.TRIANGLES, 0, 6)

            const tmp = fboA
            fboA = fboB
            fboB = tmp

            // If user prefers reduced motion (and we're respecting it),
            // render a single static frame and stop the loop. Listener
            // above will restart it if the preference flips.
            if (p.respectMotionPreference && reduceMotion) {
                rafId = 0
                return
            }
            rafId = requestAnimationFrame(frame)
        }
        startFrame.run = () => {
            rafId = requestAnimationFrame(frame)
        }
        rafId = requestAnimationFrame(frame)

        return () => {
            cancelAnimationFrame(rafId)
            ro.disconnect()
            if (motionQuery) {
                if (motionQuery.removeEventListener) {
                    motionQuery.removeEventListener("change", onMotionChange)
                } else if ((motionQuery as any).removeListener) {
                    ;(motionQuery as any).removeListener(onMotionChange)
                }
            }
            canvas.removeEventListener("mouseenter", onEnter)
            canvas.removeEventListener("mousemove", onMove)
            canvas.removeEventListener("mouseleave", onLeave)
            canvas.removeEventListener("touchstart", onTouch)
            canvas.removeEventListener("touchmove", onTouch)
            gl.deleteProgram(trailProg)
            gl.deleteProgram(dispProg)
            gl.deleteBuffer(quad)
            gl.deleteTexture(shapeTex)
            if (fboA) {
                gl.deleteTexture(fboA.tex)
                gl.deleteFramebuffer(fboA.fbo)
            }
            if (fboB) {
                gl.deleteTexture(fboB.tex)
                gl.deleteFramebuffer(fboB.fbo)
            }
            apiRef.current = null
        }
    }, [])

    // Source-shape effect. If user uploaded an image, use it.
    // Otherwise paint the chosen preset.
    useEffect(() => {
        if (!apiRef.current) return
        const src =
            typeof props.image === "string"
                ? props.image
                : props.image && (props.image as any).src
        if (!src) {
            const c = document.createElement("canvas")
            c.width = 1024
            c.height = 1024
            paintShape(c.getContext("2d")!, 1024, props.shapePreset)
            apiRef.current.updateShape(c)
            return
        }
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            const size = 1024
            const c = document.createElement("canvas")
            c.width = size
            c.height = size
            const ctx = c.getContext("2d")!
            ctx.fillStyle = "#000"
            ctx.fillRect(0, 0, size, size)
            const ar = img.width / img.height
            let dw = size,
                dh = size
            if (ar > 1) {
                dh = size / ar
            } else {
                dw = size * ar
            }
            ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
            apiRef.current?.updateShape(c)
        }
        img.src = src
    }, [
        typeof props.image === "string"
            ? props.image
            : (props.image as any)?.src,
        props.shapePreset,
    ])

    return (
        <div
            ref={wrapRef}
            style={{
                width: "100%",
                height: "100%",
                background: props.background,
                overflow: "hidden",
                position: "relative",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    cursor: "none",
                }}
            />
        </div>
    )
}

LedMatrixCursorTrail.defaultProps = {
    shapePreset: "asterisk",
    dotColor: "#1EFF00",
    background: "#0A0A0A",
    gridSize: 9,
    smear: 0.6,
    trailDecay: 0.93,
    trailIntensity: 1.6,
    cursorRadius: 80,
    baseGlow: 0.05,
    haloAmount: 0.32,
    autoplay: true,
    autoplaySpeed: 0.6,
    respectMotionPreference: true,
    width: 800,
    height: 600,
}

addPropertyControls(LedMatrixCursorTrail, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Source",
    },
    shapePreset: {
        type: ControlType.Enum,
        title: "Shape",
        defaultValue: "asterisk",
        options: ["asterisk", "bauhaus", "wave", "cluster", "rings"],
        optionTitles: ["Asterisk", "Bauhaus", "Wave", "Cluster", "Rings"],
        hidden: (p: any) => Boolean(p.image && p.image.src),
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot color",
        defaultValue: "#1EFF00",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0A",
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid size",
        defaultValue: 9,
        min: 4,
        max: 30,
        step: 1,
        unit: "px",
    },
    smear: {
        type: ControlType.Number,
        title: "Smear",
        defaultValue: 0.6,
        min: 0,
        max: 2,
        step: 0.05,
    },
    trailDecay: {
        type: ControlType.Number,
        title: "Trail decay",
        defaultValue: 0.93,
        min: 0.5,
        max: 0.99,
        step: 0.01,
    },
    trailIntensity: {
        type: ControlType.Number,
        title: "Trail strength",
        defaultValue: 1.6,
        min: 0,
        max: 3,
        step: 0.05,
    },
    cursorRadius: {
        type: ControlType.Number,
        title: "Cursor radius",
        defaultValue: 80,
        min: 20,
        max: 250,
        step: 5,
        unit: "px",
    },
    baseGlow: {
        type: ControlType.Number,
        title: "Base grid",
        defaultValue: 0.05,
        min: 0,
        max: 0.3,
        step: 0.01,
    },
    haloAmount: {
        type: ControlType.Number,
        title: "Halo",
        defaultValue: 0.32,
        min: 0,
        max: 1,
        step: 0.02,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplaySpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.05,
        hidden: (p: any) => !p.autoplay,
    },
    respectMotionPreference: {
        type: ControlType.Boolean,
        title: "Reduced motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
})
