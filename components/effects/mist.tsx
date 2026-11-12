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


// Mist: drifting mist over a photo. The pointer parts it and it closes again by itself.
// It lifts as the page scrolls, by itself after a moment, or never. Taller than the screen, the photo stays pinned while it lifts.
// The photo is a plain image, always sharp; WebGL draws only the mist on top, at a low resolution, so it stays light on small devices.
// Fewer pixels when frames come late, nothing drawn off screen, a still frame for reduced motion.

type RGB = [number, number, number]

interface Img {
    src?: string
    srcSet?: string
    alt?: string
}

interface Props {
    image?: Img
    lifts: "scroll" | "time" | "never"
    after: number
    density: number
    drift: number
    color: string
    background: string
    pointer: boolean
    brush: number
    closes: boolean
    hint: string
    hintColor: string
    hintFont?: CSSProperties
    style?: CSSProperties
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => {
    const t = clamp((v - a) / (b - a))
    return t * t * (3 - 2 * t)
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const toRgb = (c: string | undefined, fallback: RGB): RGB => {
    const s = c || ""
    const h = /#([0-9a-f]{6})/i.exec(s)
    if (h) return [parseInt(h[1].slice(0, 2), 16) / 255, parseInt(h[1].slice(2, 4), 16) / 255, parseInt(h[1].slice(4, 6), 16) / 255]
    const r = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s)
    if (r) return [Number(r[1]) / 255, Number(r[2]) / 255, Number(r[3]) / 255]
    return fallback
}
const rgba = (c: RGB, a: number) => "rgba(" + Math.round(c[0] * 255) + ", " + Math.round(c[1] * 255) + ", " + Math.round(c[2] * 255) + ", " + a + ")"
const FOG: RGB = [0.43, 0.52, 0.54]
const NIGHT: RGB = [0.05, 0.075, 0.09]
const PALE: RGB = [0.906, 0.918, 0.902]

const FRAG = [
    "precision highp float;",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
    "uniform sampler2D uClear; uniform vec2 uRes; uniform float uTime; uniform float uLift; uniform float uIntro; uniform float uDensity; uniform vec3 uFog; uniform vec3 uThin;",
    "void main(){",
    "  vec2 s=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uRes; float t=uTime; float aspect=uRes.x/uRes.y;",
    "  vec2 fp=vec2(s.x*aspect,s.y);",
    "  float a=fbm(fp*1.25+vec2(t*.017,t*.003));",
    "  float b=fbm(fp*3.+vec2(-t*.03,t*.01)+a*1.7);",
    "  float banks=a*.55+b*.6;",
    "  float line=uLift*1.4-.25;",
    "  float stay=smoothstep(line-.16,line+.2,(1.-s.y)+(banks-.55)*.55);",
    "  float dens=(.66+.42*smoothstep(.3,.9,banks))*stay*(1.-uLift*.5)*uDensity;",
    "  dens*=1.-texture2D(uClear,s).r*.92;",
    "  dens=mix(1.,dens,smoothstep(0.,1.,uIntro));",
    "  vec3 fogc=mix(uFog,uThin,uLift)*(.9+.16*(1.-s.y));",
    "  float al=clamp(dens,0.,.97);",
    "  float wsp=fbm(vec2(s.x*aspect*2.2-t*.02,s.y*6.-t*.05));",
    "  float w=smoothstep(.55,.9,wsp)*smoothstep(.5,1.,s.y)*uLift*.2;",
    "  vec3 c=mix(fogc,fogc*1.08,w); al=al+(1.-al)*w;",
    "  c+=(hash(gl_FragCoord.xy+fract(t*7.)*91.)-.5)*.02;",
    "  gl_FragColor=vec4(c*al,al);",
    "}",
].join("\n")

function program(gl: WebGLRenderingContext, frag: string): WebGLProgram | null {
    const sh = (type: number, src: string) => {
        const s = gl.createShader(type)
        if (!s) return null
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null
        return s
    }
    const vs = sh(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}")
    const fs = sh(gl.FRAGMENT_SHADER, frag)
    if (!vs || !fs) return null
    const pr = gl.createProgram()
    if (!pr) return null
    gl.attachShader(pr, vs)
    gl.attachShader(pr, fs)
    gl.linkProgram(pr)
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null
    return pr
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function Mist(props: Props) {
    const { image, lifts, after, density, drift, color, background, pointer, brush, closes, hint, hintColor, hintFont, style } = props
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [drawing, setDrawing] = useState(false)
    const [touched, setTouched] = useState(false)
    const [lifted, setLifted] = useState(false)
    // canvas, export and thumbnails: no animation loop, a still frame instead
    const isStatic = useIsStaticRenderer()
    const src = image && image.src
    const fog = toRgb(color, FOG)
    const halo = toRgb(hintColor, PALE)

    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current, stage = stageRef.current, cv = canvasRef.current
        if (!root || !stage || !cv) return
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const coarse = window.matchMedia("(pointer: coarse)").matches
        const gl = cv.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false }) as WebGLRenderingContext | null
        if (!gl) return
        const pr = program(gl, FRAG)
        if (!pr) return
        gl.useProgram(pr)
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(pr, "p")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const U: Record<string, WebGLUniformLocation | null> = {}
        const u = (n: string) => (n in U ? U[n] : (U[n] = gl.getUniformLocation(pr, n)))
        // where the pointer has pushed the mist aside; it closes again by itself unless told otherwise
        const CW = 192, CH = 108
        const field = new Float32Array(CW * CH), pix = new Uint8Array(CW * CH * 4)
        let fieldLive = false
        const clearTex = gl.createTexture()
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, clearTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CW, CH, 0, gl.RGBA, gl.UNSIGNED_BYTE, pix)
        gl.uniform1i(u("uClear"), 0)
        // the brush stays round on screen whatever the shape of the frame
        const paint = (x: number, y: number, r: number, a: number) => {
            const W = Math.max(1, cv.clientWidth), H = Math.max(1, cv.clientHeight), R = r * Math.max(W, H)
            const cx = x * CW, cy = y * CH, rx = (R * CW) / W, ry = (R * CH) / H
            for (let j = Math.max(0, Math.floor(cy - ry)); j < Math.min(CH, Math.ceil(cy + ry)); j++)
                for (let i = Math.max(0, Math.floor(cx - rx)); i < Math.min(CW, Math.ceil(cx + rx)); i++) {
                    const d2 = ((i - cx) * (i - cx)) / (rx * rx) + ((j - cy) * (j - cy)) / (ry * ry)
                    if (d2 < 1) {
                        const k = j * CW + i
                        field[k] = Math.min(1, field[k] + a * (1 - d2) * (1 - d2))
                    }
                }
            fieldLive = true
        }
        const fogC = toRgb(color, FOG)
        const thin: RGB = [fogC[0] * 0.45 + 0.341, fogC[1] * 0.45 + 0.341, fogC[2] * 0.45 + 0.341]
        // the mist is soft: it needs few pixels
        let scale = coarse ? 0.6 : 0.8
        const start = performance.now()
        let raf = 0, last = start, intro = 0, judgeFrom = start + 1500, n = 0, sum = 0, skip = false, odd = false, visible = true, lift = 0, shownLift = -1, stillLift = -1, liftedSent = false, drawn = false, seenAt = 0
        const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting }, { rootMargin: "120px" })
        io.observe(root)
        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)
            const dt = Math.min(0.05, (now - last) / 1000)
            const gap = now - last
            last = now
            if (lifts === "scroll") {
                const r = root.getBoundingClientRect(), vh = window.innerHeight || 1
                lift = r.height > vh + 4 ? smooth(0.04, 0.62, clamp(-r.top / Math.max(1, r.height - vh))) : smooth(0, 1, clamp(-r.top / Math.max(1, r.height * 0.6)))
            } else if (lifts === "time") {
                // counted from the moment the mist is first on screen
                lift = seenAt ? smooth(0, 1, ((now - seenAt) / 1000 - Math.max(0, after || 0)) / 6) : 0
            } else lift = 0
            const shown = reduce ? Math.max(lift, 0.35) : lift
            if (Math.abs(shown - shownLift) > 0.002) {
                shownLift = shown
                stage.style.setProperty("--mist-lift", shown.toFixed(3))
            }
            if (!liftedSent && lift > 0.15) {
                liftedSent = true
                setLifted(true)
            }
            if (!visible) return
            if (!seenAt) seenAt = now
            if (reduce && stillLift >= 0 && Math.abs(lift - stillLift) < 0.002) return
            // a slow device draws fewer pixels, then every other frame
            if (now > judgeFrom && gap < 250) {
                n++
                sum += gap
                if (n >= 45) {
                    const avg = sum / n
                    n = 0
                    sum = 0
                    if (avg > 23 && scale > 0.41) scale = Math.max(0.4, scale * 0.8)
                    else if (avg > 23) skip = true
                }
            }
            if (skip && (odd = !odd)) return
            intro = Math.min(1, intro + dt / 3.2)
            if (fieldLive) {
                const f = closes ? Math.pow(0.994, dt * 60) : 1
                let any = false
                for (let k = 0; k < field.length; k++) {
                    const x = field[k] * f
                    field[k] = x < 0.004 ? 0 : x
                    if (field[k]) any = true
                    pix[k * 4] = (field[k] * 255) | 0
                }
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, clearTex)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CW, CH, 0, gl.RGBA, gl.UNSIGNED_BYTE, pix)
                fieldLive = closes ? any : false
            }
            const w = Math.max(1, Math.round(cv.clientWidth * scale)), h = Math.max(1, Math.round(cv.clientHeight * scale))
            if (cv.width !== w || cv.height !== h) {
                cv.width = w
                cv.height = h
                gl.viewport(0, 0, w, h)
            }
            gl.uniform2f(u("uRes"), w, h)
            gl.uniform1f(u("uTime"), reduce ? 30 : ((now - start) / 1000) * clamp(drift, 0, 4) + 11)
            gl.uniform1f(u("uLift"), shown)
            gl.uniform1f(u("uIntro"), reduce ? 1 : ease(intro))
            gl.uniform1f(u("uDensity"), clamp(density, 0, 1.6))
            gl.uniform3f(u("uFog"), fogC[0], fogC[1], fogC[2])
            gl.uniform3f(u("uThin"), thin[0], thin[1], thin[2])
            gl.drawArrays(gl.TRIANGLES, 0, 3)
            if (!drawn) {
                drawn = true
                setDrawing(true)
            }
            if (reduce) stillLift = lift
        }
        raf = requestAnimationFrame(frame)
        let lx = -1, ly = -1, lt = 0
        const at = (e: PointerEvent) => {
            const rr = cv.getBoundingClientRect()
            return [(e.clientX - rr.left) / rr.width, (e.clientY - rr.top) / rr.height]
        }
        const onMove = (e: PointerEvent) => {
            if (!pointer || lift > 0.7) return
            const [x, y] = at(e)
            const t = performance.now(), d = Math.hypot(x - lx, (y - ly) * 0.6)
            if (d < 0.02 && t - lt < 120) return
            paint(x, y, clamp(brush, 0.02, 0.3), 0.35)
            lx = x
            ly = y
            lt = t
            setTouched(true)
        }
        const onDown = (e: PointerEvent) => {
            if (!pointer || lift > 0.7) return
            const [x, y] = at(e)
            paint(x, y, clamp(brush, 0.02, 0.3) * 1.45, 0.9)
            setTouched(true)
        }
        stage.addEventListener("pointermove", onMove, { passive: true })
        stage.addEventListener("pointerdown", onDown)
        return () => {
            cancelAnimationFrame(raf)
            io.disconnect()
            stage.removeEventListener("pointermove", onMove)
            stage.removeEventListener("pointerdown", onDown)
        }
    }, [isStatic, lifts, after, density, drift, color, pointer, brush, closes])

    const showHint = pointer && !!hint && !touched && !lifted
    return (
        <div ref={rootRef} style={{ position: "relative", width: "100%", height: "100%", background, ...style }}>
            <div ref={stageRef} style={{ position: isStatic ? "relative" : "sticky", top: 0, width: "100%", height: isStatic ? "100%" : "min(100%, 100vh)", overflow: "hidden", touchAction: "pan-y" }}>
                {src ? (
                    <img
                        src={src}
                        srcSet={image && image.srcSet}
                        alt={(image && image.alt) || ""}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(calc(1.07 - var(--mist-lift, 0) * 0.05))", filter: "saturate(calc(0.6 + var(--mist-lift, 0) * 0.45)) brightness(calc(0.97 + var(--mist-lift, 0) * 0.06))" }}
                    />
                ) : null}
                {isStatic || !drawing ? (
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(" + rgba(fog, 0.66) + ", " + rgba(fog, 0.42) + " 55%, " + rgba(NIGHT, 0.2) + ")", pointerEvents: "none" }} />
                ) : null}
                <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", opacity: drawing ? 1 : 0, transition: "opacity 0.6s" }} />
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0, 0, 0, 0) 45%, rgba(0, 0, 0, 0.16) 100%)" }} />
                {!src && isStatic ? (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: hintColor, fontFamily: "Inter, sans-serif", fontSize: 14, opacity: 0.8 }}>Pick a photo in the Photo control</div>
                ) : null}
                {pointer && hint ? (
                    <p aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "50%", margin: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 12, color: hintColor, pointerEvents: "none", fontSize: 15, lineHeight: 1.4, ...hintFont, transform: "translateY(-50%)", opacity: showHint ? 0.92 : 0, transition: "opacity 1.2s" }}>
                        <span style={{ flex: "none", width: 8, height: 8, borderRadius: "50%", background: hintColor, boxShadow: "0 0 0 6px " + rgba(halo, 0.18) + ", 0 0 0 14px " + rgba(halo, 0.08) }} />
                        {hint}
                    </p>
                ) : null}
            </div>
        </div>
    )
}

Mist.defaultProps = {
    lifts: "scroll",
    after: 2,
    density: 1,
    drift: 1,
    color: "#6E858A",
    background: "#0D1317",
    pointer: true,
    brush: 0.07,
    closes: true,
    hint: "Part the mist",
    hintColor: "#E7EAE6",
}

addPropertyControls(Mist, {
    image: { type: ControlType.ResponsiveImage, title: "Photo" },
    lifts: { type: ControlType.Enum, title: "Lifts", options: ["scroll", "time", "never"], optionTitles: ["On scroll", "Over time", "Never"], defaultValue: "scroll", displaySegmentedControl: true },
    after: { type: ControlType.Number, title: "After", min: 0, max: 20, step: 0.5, unit: "s", defaultValue: 2, hidden: (p: Props) => p.lifts !== "time" },
    density: { type: ControlType.Number, title: "Density", min: 0.2, max: 1.4, step: 0.05, defaultValue: 1 },
    drift: { type: ControlType.Number, title: "Drift", min: 0, max: 3, step: 0.1, defaultValue: 1 },
    color: { type: ControlType.Color, title: "Mist", defaultValue: "#6E858A" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#0D1317" },
    pointer: { type: ControlType.Boolean, title: "Pointer", enabledTitle: "Parts", disabledTitle: "Off", defaultValue: true },
    brush: { type: ControlType.Number, title: "Brush", min: 0.03, max: 0.2, step: 0.01, defaultValue: 0.07, hidden: (p: Props) => !p.pointer },
    closes: { type: ControlType.Boolean, title: "Closes again", enabledTitle: "Yes", disabledTitle: "No", defaultValue: true, hidden: (p: Props) => !p.pointer },
    hint: { type: ControlType.String, title: "Hint", defaultValue: "Part the mist", hidden: (p: Props) => !p.pointer },
    hintColor: { type: ControlType.Color, title: "Hint color", defaultValue: "#E7EAE6", hidden: (p: Props) => !p.pointer || !p.hint },
    hintFont: { type: ControlType.Font, title: "Hint font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 15, lineHeight: "1.4em" }, hidden: (p: Props) => !p.pointer || !p.hint },
})
