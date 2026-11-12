import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Img = { src?: string; srcSet?: string; alt?: string } | undefined

interface ServicesRollProps {
    name1: string
    name2: string
    name3: string
    name4: string
    name5: string
    image1: Img
    image2: Img
    image3: Img
    image4: Img
    image5: Img
    eyebrow: string
    description: string
    manifesto: string
    font?: CSSProperties
    labelFont?: CSSProperties
    descFont?: CSSProperties
    color: string
    activeColor: string
    labelColor: string
    descColor: string
    accentColor: string
    background: string
    gap: number
    listWidth: number
    stacked: boolean
    imageWidth: number
    imageHeight: number
    indexMode: "left" | "top" | "hidden"
    headerStacked: boolean
    descWidth: number
    padding: string
    maxWidth: number
    showLine: boolean
    linePath: string
    lineColor: string
    lineStroke: number
    lineTop: number
    lineHeight: number
    stagger: number
    hold: number
    smooth: number
    indexDim: number
    markerSpin: number
    canvasItem: number
    fitVh: number
    effect: "waterfall" | "liquid" | "ripple" | "fade"
    intensity: number
    axis: "x" | "y"
    scramble: boolean
    pin: boolean
    pinLength: number
    designHeight: number
    style?: CSSProperties
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (t: number) => t * t * (3 - 2 * t)
const SCRAMBLE = "XO"
const DEFAULT_LINE =
    "M.5 37.322c240-50 470-60 520 40 60 130-320 150-310 250 10 120 251 190.456 390 140 213.5-77.5 320-370 520-360 190 10 360 260 260 360s-190-100-40-220c33.17-26.5 109.6-89 150-127"

// ---- Liquid image transition (WebGL1, no libraries) ----------------------------------------
// Displacement transition after Jesper Landberg's codepen (ReGGae/bmyYEj): the old image is pushed
// along a noise map as `p` grows while the new one starts displaced the other way and settles.
// Kept identical in ServicesRoll.tsx and ProcessFigure.tsx (Framer code files can't share imports).
type LiquidMode = "waterfall" | "liquid" | "ripple"
type Liquid = {
    ready: () => boolean
    load: (urls: (string | undefined)[]) => Promise<boolean>
    draw: (a: number, b: number, p: number) => void
    resize: () => void
    destroy: () => void
}
function createLiquid(canvas: HTMLCanvasElement, mode: LiquidMode, intensity: number, axis: "x" | "y" = "x"): Liquid | null {
    const hx = axis === "x" // streaks + flow run sideways
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false, alpha: true }) as WebGLRenderingContext | null
    // a canvas keeps one context for life: after destroy() (loseContext) a re-run of the effect gets the same,
    // lost context back, so bail to the DOM fallback instead of throwing on null shaders
    if (!gl || gl.isContextLost()) return null
    const vs = `attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`
    const fs = `precision mediump float;
varying vec2 v;
uniform sampler2D t1; uniform sampler2D t2; uniform sampler2D d;
uniform vec2 s1; uniform vec2 s2; uniform vec2 dir;
uniform float p; uniform float k; uniform vec2 flow;
vec2 cover(vec2 uv, vec2 s){ return (uv - 0.5) * s + 0.5; }
void main(){
  vec2 dv = texture2D(d, v + flow * p).rg * dir;
  vec4 a = texture2D(t1, cover(v + dv * k * p, s1));
  vec4 b = texture2D(t2, cover(v - dv * k * (1.0 - p), s2));
  gl_FragColor = mix(a, b, p);
}`
    const sh = (type: number, src: string) => {
        const o = gl.createShader(type)!
        gl.shaderSource(o, src)
        gl.compileShader(o)
        return o
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
    gl.useProgram(prog)
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "p")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const U = (n: string) => gl.getUniformLocation(prog, n)
    gl.uniform1i(U("t1"), 0)
    gl.uniform1i(U("t2"), 1)
    gl.uniform1i(U("d"), 2)
    gl.uniform1f(U("k"), intensity)
    // waterfall: the main push runs along the axis, a little wobble across it;
    // liquid: rocky blobs (like the codepen); ripple: soft rings
    if (mode === "waterfall") gl.uniform2f(U("dir"), hx ? 1 : 0.12, hx ? 0.12 : 1)
    else gl.uniform2f(U("dir"), 1, mode === "ripple" ? 0.6 : 1)
    gl.uniform2f(U("flow"), mode === "waterfall" && hx ? 0.35 : 0, mode === "waterfall" && !hx ? 0.35 : 0)

    const tex = (src: TexImageSource | null, repeat: boolean) => {
        const t = gl.createTexture()!
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        const w = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w)
        if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
        return t
    }

    // procedural displacement map (256², tileable value noise), so no extra asset is needed
    const N = 256
    const dc = document.createElement("canvas")
    dc.width = dc.height = N
    const dx = dc.getContext("2d")!
    const img = dx.createImageData(N, N)
    const G = 32
    const grid = Array.from({ length: G * G }, () => Math.random())
    const at = (x: number, y: number) => grid[((y + G) % G) * G + ((x + G) % G)]
    const noise = (x: number, y: number) => {
        const xi = Math.floor(x)
        const yi = Math.floor(y)
        const fx = x - xi
        const fy = y - yi
        const sx = fx * fx * (3 - 2 * fx)
        const sy = fy * fy * (3 - 2 * fy)
        const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx
        const bot = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx
        return top + (bot - top) * sy
    }
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const u = x / N
            const w = y / N
            let r = 0
            let g = 0
            if (mode === "waterfall") {
                // many thin columns, barely changing down the column → streaks
                // fine streaks along the axis (long one way, thin the other) + a gentle wobble across it
                const a = hx ? w : u
                const b = hx ? u : w
                const streak = noise(a * 48 + 3, b * 0.8) * 0.55 + noise(a * 96 + 11, b * 1.5) * 0.3 + noise(a * 12, b * 0.5) * 0.15
                const wob = noise(u * 6, w * 6)
                r = hx ? streak : wob
                g = hx ? wob : streak
            } else if (mode === "liquid") {
                r = noise(u * 4, w * 4) * 0.55 + noise(u * 8, w * 8) * 0.3 + noise(u * 16, w * 16) * 0.15
                g = noise(u * 4 + 9, w * 4 + 9) * 0.55 + noise(u * 8 + 9, w * 8 + 9) * 0.3 + noise(u * 16 + 9, w * 16 + 9) * 0.15
            } else {
                const c = Math.hypot(u - 0.5, w - 0.5)
                r = 0.5 + 0.5 * Math.sin(c * 40)
                g = 0.5 + 0.5 * Math.cos(c * 40)
            }
            const i = (y * N + x) * 4
            img.data[i] = r * 255
            img.data[i + 1] = g * 255
            img.data[i + 2] = 0
            img.data[i + 3] = 255
        }
    }
    dx.putImageData(img, 0, 0)
    gl.activeTexture(gl.TEXTURE2)
    const dispTex = tex(dc, true)

    let textures: { t: WebGLTexture; w: number; h: number }[] = []
    let ok = false
    let lost = false
    const onLost = (e: Event) => {
        e.preventDefault()
        lost = true
        ok = false
    }
    canvas.addEventListener("webglcontextlost", onLost)

    const resize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w
            canvas.height = h
        }
        gl.viewport(0, 0, w, h)
    }

    const coverScale = (iw: number, ih: number) => {
        const pa = canvas.clientWidth / Math.max(1, canvas.clientHeight)
        const ia = iw / Math.max(1, ih)
        return ia > pa ? [pa / ia, 1] : [1, ia / pa]
    }

    return {
        ready: () => ok && !lost,
        load: (urls) =>
            Promise.all(
                urls.map(
                    (u) =>
                        new Promise<HTMLImageElement | null>((res) => {
                            if (!u) return res(null)
                            const im = new Image()
                            im.crossOrigin = "anonymous"
                            im.decoding = "async"
                            im.onload = () => res(im)
                            im.onerror = () => res(null)
                            im.src = u
                        })
                )
            ).then((ims) => {
                if (lost || ims.some((m) => !m)) return false
                try {
                    gl.activeTexture(gl.TEXTURE0)
                    textures = ims.map((m) => ({ t: tex(m!, false), w: m!.naturalWidth, h: m!.naturalHeight }))
                } catch {
                    return false // e.g. a cross-origin image without CORS
                }
                ok = textures.length > 0
                resize()
                return ok
            }),
        draw: (a, b, p) => {
            if (!ok || lost) return
            const A = textures[Math.max(0, Math.min(textures.length - 1, a))]
            const B = textures[Math.max(0, Math.min(textures.length - 1, b))]
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, A.t)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, B.t)
            const s1 = coverScale(A.w, A.h)
            const s2 = coverScale(B.w, B.h)
            gl.uniform2f(U("s1"), s1[0], s1[1])
            gl.uniform2f(U("s2"), s2[0], s2[1])
            gl.uniform1f(U("p"), Math.max(0, Math.min(1, p)))
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        },
        resize,
        destroy: () => {
            canvas.removeEventListener("webglcontextlost", onLost)
            textures.forEach((t) => gl.deleteTexture(t.t))
            textures = []
            ok = false
            lost = true // a load() still in flight resolves to false instead of uploading into a dead context
            gl.deleteTexture(dispTex)
            gl.deleteBuffer(buf)
            gl.deleteProgram(prog)
            gl.getExtension("WEBGL_lose_context")?.loseContext()
        },
    }
}

/**
 * Services Roll: a self-contained, pinned services section. Big service names roll letter by letter like
 * little cubes (base face → active face) in a left-to-right wave as the section scrolls; images change
 * with a WebGL transition; an index list follows the active service and jumps to it on click.
 *
 * Everything (pin, header, index, names, image, line, footer) is rendered by this component, and it only
 * reads / writes its own DOM. Scroll listeners, the animation loop and WebGL run only while the section is
 * in or near the viewport (IntersectionObserver), and stop when it leaves.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function ServicesRoll(props: ServicesRollProps) {
    const {
        name1 = "BRAND IDENTITY",
        name2 = "ART DIRECTION",
        name3 = "DIGITAL DESIGN",
        name4 = "PACKAGING",
        name5 = "SPATIAL",
        image1,
        image2,
        image3,
        image4,
        image5,
        eyebrow = "SERVICES & APPROACH",
        description = "Each engagement is shaped by material, process and circumstance.",
        manifesto = "NO TEMPLATES. NO SHORTCUTS.\nEVERY BRAND WE BUILD STARTS WITH\nA BLANK PAGE AND A HARD QUESTION.",
        font,
        labelFont,
        descFont,
        color = "rgba(231, 243, 241, 0.68)",
        activeColor = "#CBF108",
        labelColor = "#E7F3F1",
        descColor = "rgba(231, 243, 241, 0.68)",
        accentColor = "#CBF108",
        background = "#041915",
        gap = 24,
        listWidth = 845,
        stacked = false,
        imageWidth = 380,
        imageHeight = 460,
        indexMode = "left",
        headerStacked = false,
        descWidth = 378,
        padding = "90px 60px 32px 60px",
        maxWidth = 1320,
        showLine = true,
        linePath = DEFAULT_LINE,
        lineColor = "rgba(231, 243, 241, 0.16)",
        lineStroke = 1,
        lineTop = 302,
        lineHeight = 494,
        stagger = 0.7,
        hold = 0.22,
        smooth = 0.14,
        indexDim = 0.5,
        markerSpin = 180,
        canvasItem = 2,
        fitVh = 10.4,
        effect = "waterfall",
        intensity = 0.35,
        axis = "x",
        scramble = true,
        pin = true,
        pinLength = 350,
        designHeight = 800,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const target = RenderTarget.current()
    const onCanvas = target === RenderTarget.canvas || target === RenderTarget.thumbnail
    // static renders (canvas, thumbnails, screenshots, export) show one finished frame, no pin
    const live = !onCanvas && !isStatic
    const pinned = live && pin
    const pinVh = Math.max(110, Math.min(1200, Number(pinLength) || 350))

    const names = [name1, name2, name3, name4, name5].filter((n) => n && n.trim())
    const images = [image1, image2, image3, image4, image5].slice(0, names.length)
    const n = names.length

    const sectionRef = useRef<HTMLElement>(null)
    const drums = useRef<HTMLElement[][]>([]) // [row][letter] → rotating drum
    const imgRefs = useRef<(HTMLDivElement | null)[]>([])
    const markerRefs = useRef<(HTMLSpanElement | null)[]>([])
    const labelRefs = useRef<(HTMLSpanElement | null)[]>([])
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const eyebrowRef = useRef<HTMLSpanElement>(null)
    const [seen, setSeen] = useState(!live) // header fade-in; static renders start finished

    useEffect(() => {
        const section = sectionRef.current
        if (!section || typeof window === "undefined") return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const lastA: number[] = []
        let liquid: Liquid | null = null
        let liquidTried = false
        let drawnF = NaN // last position drawn on the canvas (NaN = must redraw)
        const canvas = canvasRef.current
        const wantLiquid = live && !reduced && effect !== "fade" && !!canvas

        const drawLiquid = (f: number) => {
            if (!liquid || !liquid.ready()) return false
            if (f === drawnF) return true
            drawnF = f
            const i = Math.max(0, Math.min(n - 1, Math.floor(f)))
            const p = i >= n - 1 ? 0 : f - i
            liquid.draw(i, Math.min(n - 1, i + 1), p)
            return true
        }

        // paint every row / letter / image / index item for a (fractional) position f
        const paint = (f: number) => {
            const liquidOn = drawLiquid(f)
            for (let k = 0; k < n; k++) {
                const a = clamp01(1 - Math.abs(f - k))
                if (lastA[k] !== undefined && Math.abs(lastA[k] - a) < 0.0005) continue
                lastA[k] = a
                const row = drums.current[k] || []
                const m = row.length
                row.forEach((d, j) => {
                    const pos = m > 1 ? j / (m - 1) : 0
                    const lp = smoothstep(clamp01(a * (1 + stagger) - stagger * pos))
                    d.style.transform = `translateZ(-0.5em) rotateX(${(lp * 90).toFixed(2)}deg)`
                })
                const img = imgRefs.current[k]
                if (img && liquidOn) img.style.visibility = "hidden"
                else if (img) {
                    const o = smoothstep(a)
                    img.style.opacity = o.toFixed(3)
                    img.style.transform = `scale(${(1 + 0.06 * (1 - o)).toFixed(4)})`
                    img.style.zIndex = String(Math.round(o * 10))
                    img.style.visibility = o < 0.002 ? "hidden" : "visible"
                }
                const marker = markerRefs.current[k]
                if (marker) {
                    marker.style.opacity = a.toFixed(3)
                    marker.style.transform = `rotate(${((1 - a) * markerSpin * (f < k ? -1 : 1)).toFixed(2)}deg) scale(${a.toFixed(3)})`
                }
                const label = labelRefs.current[k]
                if (label) label.style.opacity = (indexDim + (1 - indexDim) * a).toFixed(3)
            }
        }
        const drawLine = (p: number) => {
            const path = pathRef.current
            if (!path) return
            path.style.strokeDashoffset = String(1 - p)
            path.style.visibility = p <= 0.0005 ? "hidden" : "visible"
        }

        if (!live) {
            paint(Math.max(0, Math.min(n - 1, canvasItem - 1)))
            drawLine(1)
            return
        }

        // own section only: scroll position → service position (with a hold on each item) and line progress
        const measure = () => {
            const r = section.getBoundingClientRect()
            const vh = window.innerHeight || 1
            const line = clamp01((vh - r.top) / (vh * 1.3))
            if (n < 2) return { f: 0, line }
            const travel = Math.max(1, r.height - vh)
            const p = clamp01((-r.top / travel - 0.04) / 0.92)
            const raw = p * (n - 1)
            const i = Math.min(n - 2, Math.floor(raw))
            const t = clamp01((raw - i - hold / 2) / Math.max(0.0001, 1 - hold))
            return { f: i + smoothstep(t), line }
        }

        let cur = measure()
        let f = cur.f
        let lineP = reduced ? 1 : 0
        let raf = 0
        let last = 0
        let active = false
        const tick = (t: number) => {
            raf = 0
            if (!active) return
            cur = measure()
            const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60
            last = t
            const k = reduced ? 1 : 1 - Math.pow(1 - smooth, dt * 60)
            f += (cur.f - f) * k
            if (Math.abs(cur.f - f) < 0.0005) f = cur.f
            const lineTarget = reduced ? 1 : cur.line
            lineP += (lineTarget - lineP) * (reduced ? 1 : 1 - Math.pow(0.9, dt * 60))
            if (Math.abs(lineTarget - lineP) < 0.0005) lineP = lineTarget
            paint(f)
            drawLine(lineP)
            if (f !== cur.f || lineP !== lineTarget) raf = requestAnimationFrame(tick)
            else last = 0
        }
        const kick = () => {
            if (active && !raf) raf = requestAnimationFrame(tick)
        }
        const onResize = () => {
            liquid?.resize()
            drawnF = NaN
            kick()
        }

        // eyebrow scramble: one pass the first time the section comes into view (writes only its own span)
        let scrambleRaf = 0
        const runScramble = () => {
            const el = eyebrowRef.current
            if (!el || !scramble || reduced) return
            const text = eyebrow
            const start = performance.now()
            let lastSwap = 0
            const frame = (now: number) => {
                const p = Math.min(1, (now - start) / 1200)
                if (now - lastSwap > 60 || p >= 1) {
                    lastSwap = now
                    const shown = Math.floor(p * text.length)
                    let out = ""
                    for (let i = 0; i < text.length; i++)
                        out += i < shown || /\s/.test(text[i]) ? text[i] : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]
                    el.textContent = out
                }
                if (p < 1) scrambleRaf = requestAnimationFrame(frame)
                else el.textContent = text
            }
            scrambleRaf = requestAnimationFrame(frame)
        }

        const start = () => {
            if (active) return
            active = true
            window.addEventListener("scroll", kick, { passive: true })
            window.addEventListener("resize", onResize)
            if (wantLiquid && !liquidTried && canvas) {
                liquidTried = true
                liquid = createLiquid(canvas, effect as LiquidMode, intensity, axis)
                liquid?.load(images.map((im) => im?.src)).then((ok) => {
                    if (!ok || !liquid) return
                    canvas.style.visibility = "visible"
                    for (let k = 0; k < n; k++) lastA[k] = -1 // repaint once with the canvas on
                    drawnF = NaN
                    paint(f)
                })
            }
            drawnF = NaN
            kick()
        }
        const stop = () => {
            if (!active) return
            active = false
            window.removeEventListener("scroll", kick)
            window.removeEventListener("resize", onResize)
            cancelAnimationFrame(raf)
            raf = 0
            last = 0
        }

        paint(f)
        drawLine(lineP)
        let first = true
        const io = new IntersectionObserver(
            ([e]) => {
                if (!e) return
                if (e.isIntersecting) {
                    start()
                    if (first) {
                        first = false
                        setSeen(true)
                        runScramble()
                    }
                } else stop()
            },
            { rootMargin: "25% 0px 25% 0px" }
        )
        io.observe(section)
        // the image box can change size without a window resize; only reacts while active
        const ro = canvas && wantLiquid && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => active && onResize()) : null
        if (canvas) ro?.observe(canvas)

        return () => {
            io.disconnect()
            ro?.disconnect()
            stop()
            cancelAnimationFrame(scrambleRaf)
            if (eyebrowRef.current) eyebrowRef.current.textContent = eyebrow
            liquid?.destroy()
            if (canvas) canvas.style.visibility = "hidden"
        }
    }, [live, names.join("|"), images.map((im) => im?.src).join("|"), stagger, hold, smooth, indexDim, markerSpin, canvasItem, effect, intensity, axis, scramble, eyebrow])

    // index items scroll the page to their service (own section geometry only)
    const goTo = (k: number) => {
        const section = sectionRef.current
        if (!section || typeof window === "undefined") return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const travel = section.offsetHeight - window.innerHeight
        const top = section.getBoundingClientRect().top + window.scrollY
        const y = top + Math.max(0, travel) * (0.04 + 0.92 * (n > 1 ? k / (n - 1) : 0))
        type Lenis = { scrollTo: (y: number, o?: object) => void }
        const w = window as Window & { lenis?: Lenis; __avrynLenis?: Lenis }
        const lenis = w.lenis && typeof w.lenis.scrollTo === "function" ? w.lenis : w.__avrynLenis
        if (lenis) lenis.scrollTo(y, reduced ? { immediate: true } : { duration: 1.2 })
        else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" })
    }

    // the two cube faces, shared by every letter
    const face = (c: string, back: boolean): CSSProperties => ({
        position: back ? "absolute" : "relative",
        left: 0,
        top: 0,
        display: "block",
        color: c,
        backfaceVisibility: "hidden",
        transform: back ? "rotateX(-90deg) translateZ(0.5em)" : "translateZ(0.5em)",
    })
    const frontFace = face(color, false)
    const backFace = face(activeColor, true)

    drums.current = []
    const fs = parseFloat(String(font?.fontSize ?? 96)) || 96
    // Fit Height: live it scales with the viewport; static renders use Canvas Height as the "viewport" so the
    // canvas matches what an equally tall browser window shows
    const vh = (px: number) =>
        fitVh <= 0
            ? `${px}px`
            : live
              ? `min(${px}px, ${((px / fs) * fitVh).toFixed(3)}vh)`
              : `${Math.min(px, (px / fs) * fitVh * (designHeight / 100)).toFixed(2)}px`
    const activeIdx = Math.max(0, Math.min(n - 1, canvasItem - 1))
    const fixedHeight = style?.height !== undefined && style?.height !== "auto"

    const label: CSSProperties = {
        fontSize: 12,
        letterSpacing: "-0.03em",
        lineHeight: 1.5,
        ...labelFont,
        color: labelColor,
        margin: 0,
    }

    const indexList = (dir: "column" | "row") => (
        <nav aria-label="Services" style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
            <ul
                style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: dir,
                    flexWrap: dir === "row" ? "wrap" : "nowrap",
                    gap: dir === "row" ? "8px 20px" : 8,
                }}
            >
                {names.map((name, k) => {
                    const a = k === activeIdx ? 1 : 0
                    return (
                        <li key={k}>
                            <button
                                type="button"
                                onClick={() => goTo(k)}
                                style={{
                                    all: "unset",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <span
                                    aria-hidden="true"
                                    ref={(el) => {
                                        markerRefs.current[k] = el
                                    }}
                                    style={{
                                        width: 6,
                                        height: 6,
                                        flexShrink: 0,
                                        background: labelColor,
                                        opacity: a,
                                        transform: `scale(${a})`,
                                    }}
                                />
                                <span
                                    ref={(el) => {
                                        labelRefs.current[k] = el
                                    }}
                                    style={{ ...label, opacity: indexDim + (1 - indexDim) * a }}
                                >
                                    {String(k + 1).padStart(2, "0")}&nbsp;&nbsp;{name}
                                </span>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )

    const roll = (
        <div
            style={
                stacked
                    ? { position: "relative", flex: "1 1 0", minWidth: 0, minHeight: 0, alignSelf: "stretch", display: "flex", flexDirection: "column", gap: vh(gap * 4) }
                    : { position: "relative", flex: "1 1 0", minWidth: 0, alignSelf: "stretch" }
            }
        >
            <div
                style={
                    stacked
                        ? { position: "relative", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: vh(gap), zIndex: 1 }
                        : {
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: listWidth,
                              maxWidth: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: vh(gap),
                              zIndex: 1,
                          }
                }
            >
                {names.map((name, k) => {
                    drums.current[k] = []
                    const on = !live && k === activeIdx
                    return (
                        <h3
                            key={k}
                            aria-label={name}
                            style={{
                                margin: 0,
                                whiteSpace: "nowrap",
                                fontWeight: 500,
                                ...font,
                                fontSize: vh(fs),
                                lineHeight: "1em",
                                perspective: "8em",
                                display: "flex",
                                height: "1em",
                                overflow: "hidden",
                            }}
                        >
                            {Array.from(name).map((ch, j) =>
                                ch === " " ? (
                                    <span key={j} aria-hidden="true" style={{ display: "inline-block", width: "0.28em" }} />
                                ) : (
                                    <span
                                        key={j}
                                        aria-hidden="true"
                                        ref={(el) => {
                                            if (el) drums.current[k].push(el)
                                        }}
                                        style={{
                                            position: "relative",
                                            display: "inline-block",
                                            transformStyle: "preserve-3d",
                                            transform: `translateZ(-0.5em) rotateX(${on ? 90 : 0}deg)`,
                                            willChange: live ? "transform" : undefined,
                                        }}
                                    >
                                        <span style={frontFace}>{ch}</span>
                                        <span style={backFace}>{ch}</span>
                                    </span>
                                )
                            )}
                        </h3>
                    )
                })}
            </div>
            <div
                aria-hidden="true"
                style={
                    stacked
                        ? { position: "relative", flex: "1 1 0", minHeight: 0, maxHeight: vh(imageHeight), width: "100%", overflow: "hidden", zIndex: 2 }
                        : {
                              position: "absolute",
                              right: 0,
                              top: "50%",
                              width: vh(imageWidth),
                              height: vh(imageHeight),
                              transform: "translateY(-50%)",
                              overflow: "hidden",
                              zIndex: 2,
                          }
                }
            >
                {images.map((img, k) =>
                    img?.src ? (
                        <div
                            key={k}
                            ref={(el) => {
                                imgRefs.current[k] = el
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: k === (live ? 0 : activeIdx) ? 1 : 0,
                                willChange: live ? "opacity, transform" : undefined,
                            }}
                        >
                            <img
                                src={img.src}
                                srcSet={img.srcSet}
                                sizes="(max-width: 809px) 100vw, 420px"
                                alt={img.alt ?? ""}
                                loading={k < 2 ? "eager" : "lazy"}
                                decoding="async"
                                draggable={false}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        </div>
                    ) : null
                )}
                {live && (
                    <canvas
                        ref={canvasRef}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 20, visibility: "hidden", display: "block" }}
                    />
                )}
            </div>
        </div>
    )

    const fade = (delay: number): CSSProperties =>
        live
            ? {
                  opacity: seen ? 1 : 0,
                  transform: seen ? "none" : "translateY(24px)",
                  transition: `opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
              }
            : {}

    return (
        <section
            ref={sectionRef}
            aria-label={eyebrow || "Services"}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: pinned ? `${pinVh}vh` : fixedHeight ? "100%" : designHeight,
                background,
            }}
        >
            <div
                style={{
                    position: pinned ? "sticky" : "relative",
                    top: 0,
                    width: "100%",
                    height: pinned ? "100svh" : "100%",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    padding,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                {showLine && linePath ? (
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 1491 495"
                        preserveAspectRatio="none"
                        fill="none"
                        style={{
                            position: "absolute",
                            left: "-1.7%",
                            top: lineTop,
                            width: "103.4%",
                            height: lineHeight,
                            overflow: "visible",
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    >
                        <path
                            ref={pathRef}
                            d={linePath}
                            pathLength={1}
                            stroke={lineColor}
                            strokeWidth={lineStroke}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            style={{ strokeDasharray: "1 1", strokeDashoffset: live ? 1 : 0, visibility: live ? "hidden" : "visible" }}
                        />
                    </svg>
                ) : null}
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        width: "100%",
                        maxWidth,
                        flex: "1 1 0",
                        minHeight: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                    }}
                >
                    <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", gap: indexMode === "top" ? 32 : 40 }}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: headerStacked ? "column" : "row",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 16,
                            }}
                        >
                            <h2 style={{ ...label, color: accentColor, whiteSpace: "pre" }}>
                                <span ref={eyebrowRef}>{eyebrow}</span>
                            </h2>
                            {description ? (
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 18,
                                        lineHeight: 1.5,
                                        ...descFont,
                                        color: descColor,
                                        width: headerStacked ? "100%" : descWidth,
                                        maxWidth: "100%",
                                        textAlign: headerStacked ? "left" : "right",
                                        ...fade(0.1),
                                    }}
                                >
                                    {description}
                                </p>
                            ) : null}
                        </div>
                        {indexMode === "top" ? indexList("row") : null}
                        <div
                            style={{
                                flex: "1 1 0",
                                minHeight: 0,
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 32,
                            }}
                        >
                            {indexMode === "left" ? indexList("column") : null}
                            {roll}
                        </div>
                    </div>
                    {manifesto ? <p style={{ ...label, whiteSpace: "pre-line", ...fade(0.2) }}>{manifesto}</p> : null}
                </div>
            </div>
        </section>
    )
}

const hideIfStacked = (p: Partial<ServicesRollProps>) => p.stacked === true

addPropertyControls(ServicesRoll, {
    name1: { type: ControlType.String, title: "Service 1", defaultValue: "BRAND IDENTITY" },
    image1: { type: ControlType.ResponsiveImage, title: "Image 1" },
    name2: { type: ControlType.String, title: "Service 2", defaultValue: "ART DIRECTION" },
    image2: { type: ControlType.ResponsiveImage, title: "Image 2" },
    name3: { type: ControlType.String, title: "Service 3", defaultValue: "DIGITAL DESIGN" },
    image3: { type: ControlType.ResponsiveImage, title: "Image 3" },
    name4: { type: ControlType.String, title: "Service 4", defaultValue: "PACKAGING" },
    image4: { type: ControlType.ResponsiveImage, title: "Image 4" },
    name5: { type: ControlType.String, title: "Service 5", defaultValue: "SPATIAL" },
    image5: { type: ControlType.ResponsiveImage, title: "Image 5" },
    eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "SERVICES & APPROACH" },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Each engagement is shaped by material, process and circumstance.",
        displayTextArea: true,
    },
    manifesto: {
        type: ControlType.String,
        title: "Footer Text",
        defaultValue: "NO TEMPLATES. NO SHORTCUTS.\nEVERY BRAND WE BUILD STARTS WITH\nA BLANK PAGE AND A HARD QUESTION.",
        displayTextArea: true,
    },
    font: { type: ControlType.Font, title: "Name Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 96, lineHeight: "1em" } },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: { fontSize: 12, letterSpacing: "-0.03em", lineHeight: "1.5em" },
    },
    descFont: { type: ControlType.Font, title: "Text Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 18, lineHeight: "1.5em" } },
    color: { type: ControlType.Color, title: "Color", defaultValue: "rgba(231, 243, 241, 0.68)" },
    activeColor: { type: ControlType.Color, title: "Active", defaultValue: "#CBF108" },
    labelColor: { type: ControlType.Color, title: "Label Color", defaultValue: "#E7F3F1" },
    descColor: { type: ControlType.Color, title: "Text Color", defaultValue: "rgba(231, 243, 241, 0.68)" },
    accentColor: { type: ControlType.Color, title: "Eyebrow Color", defaultValue: "#CBF108" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#041915" },
    indexMode: {
        type: ControlType.Enum,
        title: "Index",
        options: ["left", "top", "hidden"],
        optionTitles: ["Left", "Top", "Hidden"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    headerStacked: { type: ControlType.Boolean, title: "Stack Header", defaultValue: false },
    descWidth: { type: ControlType.Number, title: "Text Width", defaultValue: 378, min: 120, max: 800, step: 1, unit: "px", hidden: (p: Partial<ServicesRollProps>) => p.headerStacked === true },
    stacked: { type: ControlType.Boolean, title: "Stacked", defaultValue: false, description: "Phones: names on top, the image full width below." },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 24, min: 0, max: 120, step: 1, unit: "px" },
    listWidth: { type: ControlType.Number, title: "List Width", description: "Width the names are centred in.", defaultValue: 845, min: 200, max: 2000, step: 1, unit: "px", hidden: hideIfStacked },
    imageWidth: { type: ControlType.Number, title: "Image Width", defaultValue: 380, min: 100, max: 1000, step: 1, unit: "px", hidden: hideIfStacked },
    imageHeight: { type: ControlType.Number, title: "Image Height", defaultValue: 460, min: 100, max: 1200, step: 1, unit: "px" },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "90px 60px 32px 60px" },
    maxWidth: { type: ControlType.Number, title: "Max Width", defaultValue: 1320, min: 320, max: 2400, step: 10, unit: "px" },
    showLine: { type: ControlType.Boolean, title: "Line", defaultValue: true },
    linePath: {
        type: ControlType.String,
        title: "Line Path",
        description: "d attribute of one SVG path (1491 × 495 box).",
        defaultValue: DEFAULT_LINE,
        displayTextArea: true,
        hidden: (p: Partial<ServicesRollProps>) => p.showLine === false,
    },
    lineColor: { type: ControlType.Color, title: "Line Color", defaultValue: "rgba(231, 243, 241, 0.16)", hidden: (p: Partial<ServicesRollProps>) => p.showLine === false },
    lineStroke: { type: ControlType.Number, title: "Line Stroke", defaultValue: 1, min: 0.5, max: 8, step: 0.5, unit: "px", hidden: (p: Partial<ServicesRollProps>) => p.showLine === false },
    lineTop: { type: ControlType.Number, title: "Line Top", defaultValue: 302, min: -400, max: 1200, step: 1, unit: "px", hidden: (p: Partial<ServicesRollProps>) => p.showLine === false },
    lineHeight: { type: ControlType.Number, title: "Line Height", defaultValue: 494, min: 50, max: 1200, step: 1, unit: "px", hidden: (p: Partial<ServicesRollProps>) => p.showLine === false },
    stagger: { type: ControlType.Number, title: "Letter Wave", description: "0 = whole word at once. Higher = longer left-to-right wave.", defaultValue: 0.7, min: 0, max: 3, step: 0.05 },
    hold: { type: ControlType.Number, title: "Hold", description: "Share of each service's scroll where it stays still.", defaultValue: 0.22, min: 0, max: 0.8, step: 0.01 },
    smooth: { type: ControlType.Number, title: "Smooth", description: "Higher = follows the scroll tighter.", defaultValue: 0.14, min: 0.02, max: 1, step: 0.01 },
    indexDim: { type: ControlType.Number, title: "Index Dim", description: "Opacity of inactive index labels.", defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    markerSpin: { type: ControlType.Number, title: "Marker Spin", defaultValue: 180, min: 0, max: 360, step: 15, unit: "deg" },
    fitVh: { type: ControlType.Number, title: "Fit Height", description: "Names and image shrink on short screens (0 = off).", defaultValue: 10.4, min: 0, max: 30, step: 0.1, unit: "vh" },
    effect: {
        type: ControlType.Enum,
        title: "Image Effect",
        options: ["waterfall", "liquid", "ripple", "fade"],
        optionTitles: ["Waterfall", "Liquid", "Ripple", "Fade"],
        defaultValue: "waterfall",
    },
    intensity: { type: ControlType.Number, title: "Intensity", defaultValue: 0.35, min: 0.05, max: 1, step: 0.01, hidden: (p: Partial<ServicesRollProps>) => p.effect === "fade" },
    axis: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["x", "y"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "x",
        displaySegmentedControl: true,
        hidden: (p: Partial<ServicesRollProps>) => p.effect !== "waterfall" && p.effect !== undefined,
    },
    scramble: { type: ControlType.Boolean, title: "Scramble", description: "Eyebrow scrambles in when the section appears.", defaultValue: true },
    pin: { type: ControlType.Boolean, title: "Pin", defaultValue: true, description: "Section stays on screen for Pin Length while the services roll." },
    pinLength: { type: ControlType.Number, title: "Pin Length", description: "More = slower roll.", defaultValue: 350, min: 150, max: 1000, step: 10, unit: "vh", hidden: (p: Partial<ServicesRollProps>) => p.pin === false },
    designHeight: { type: ControlType.Number, title: "Canvas Height", description: "Height on the canvas when the layer is Fit.", defaultValue: 800, min: 300, max: 2000, step: 10, unit: "px" },
    canvasItem: { type: ControlType.Number, title: "Canvas Item", description: "Which service shows active on the canvas.", defaultValue: 2, min: 1, max: 5, step: 1 },
})
