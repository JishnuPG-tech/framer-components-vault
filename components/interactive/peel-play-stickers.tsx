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

interface Props {
    sticker?: string | { src: string }
    rotation?: number
    curlAmount?: number
    shadow?: number
    alt?: string
    residue?: number
    peelDistance?: number
    backColor?: string
    sound?: boolean
    volume?: number
    placeSound?: boolean
    placeVolume?: number
    shadowBlur?: number
    shadowOpacity?: number
    shadowDistance?: number
    showResidue?: boolean
    traceDuration?: number
    material?: string
    finish?: string
    style?: React.CSSProperties
}
const vertex = `
attribute vec2 uv;
uniform vec2 bend;
uniform float line,radius,angle,elevation,aspect,fit;
varying vec2 tex;
varying float normalZ,normalX,height;
void main(){
 tex=uv;
 vec2 p=vec2(uv.x-.5,(uv.y-.5)/aspect);
 float d=max(0.,dot(p,bend)-line);
 float a=min(d/radius,angle);
 float tail=max(0.,d-angle*radius);
 float projected=sin(a)*radius+cos(a)*tail;
 height=(1.-cos(a))*radius+sin(a)*tail+elevation;
 vec2 q=p+bend*(projected-d);
 normalZ=cos(a);normalX=sin(a);
 gl_Position=vec4(q.x*fit*2./3.,-q.y*fit*2./3.,-height*.3,1.);
}`
const fragment = `
precision mediump float;
uniform sampler2D photo;
uniform vec3 backing;
uniform float material,finish;
uniform vec2 lightPosition;
varying vec2 tex;
varying float normalZ,normalX,height;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec4 c=texture2D(photo,tex);
 if(c.a<.008)discard;
 float grain=(hash(floor(tex*1200.))-.5);
 float light=.84+.16*abs(normalZ)-.07*normalX;
 
 vec3 front=c.rgb*light+grain*(material<.5?.008:material<1.5?.035:.016);
 float phase=dot(tex,vec2(.9,-.6))+normalX*.28+dot(lightPosition,vec2(.19,.12));
 vec3 rainbow=.56+.44*cos(6.28318*(phase*1.8+vec3(0.,.33,.67)));
 float sheen=pow(max(0.,1.-abs(tex.x+tex.y*.45-.7-lightPosition.x*.3-normalX*.3)),18.);
 if(material<.5)front=mix(front,vec3(1.),sheen*.16);
 if(material>1.5&&material<2.5)front=mix(front,front*(.72+rainbow*.5)+rainbow*.1,.3);
 if(material>2.5)front=mix(front,vec3(1.),sheen*.24);
 if(finish>.5&&finish<1.5){front=mix(front,front*(.55+rainbow*.8)+rainbow*.16,.72);front=mix(front,vec3(1.),sheen*.45);}
 else if(finish>1.5&&finish<2.5){float sparkle=hash(floor(tex*240.));float twinkle=pow(max(0.,sin(sparkle*60.+phase*18.)),24.);front+=step(.965,sparkle)*twinkle*(.35+rainbow*.65);front=mix(front,vec3(1.),sheen*.10);}
 else if(finish>2.5){front=mix(front,front+rainbow*.18,sheen*.8+.1);front=mix(front,vec3(1.),sheen*.18);}

 vec3 back=backing*(.88+.12*abs(normalZ))+grain*.022;
 back+=c.rgb*.012;
 vec3 color=gl_FrontFacing?front:back;
 gl_FragColor=vec4(color*c.a,c.a);
}`
function renderer(
    canvas: HTMLCanvasElement,
    src: string,
    onReady: (a: number) => void
) {
    const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
    })
    if (!gl) return null
    const compile = (type: number, text: string) => {
        const s = gl.createShader(type)!
        gl.shaderSource(s, text)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            throw Error(gl.getShaderInfoLog(s) || "Shader")
        return s
    }
    const vs = compile(gl.VERTEX_SHADER, vertex),
        fs = compile(gl.FRAGMENT_SHADER, fragment),
        program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)
    const N = 100,
        vertices: number[] = [],
        indices: number[] = []
    // Counterclockwise front faces after screen Y inversion.
    for (let y = 0; y <= N; y++)
        for (let x = 0; x <= N; x++) {
            vertices.push(x / N, y / N)
            if (x < N && y < N) {
                const a = y * (N + 1) + x
                indices.push(a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2)
            }
        }
    const vb = gl.createBuffer(),
        ib = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vb)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    )
    const loc = gl.getAttribLocation(program, "uv")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uniforms: any = {}
    ;[
        "bend",
        "line",
        "radius",
        "angle",
        "elevation",
        "aspect",
        "fit",
        "backing",
        "photo",
        "material",
        "finish",
        "lightPosition",
    ].forEach((k) => (uniforms[k] = gl.getUniformLocation(program, k)))
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    let loaded = false,
        aspect = 1,
        disposed = false
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => {
        if (disposed) return
        aspect = image.naturalWidth / image.naturalHeight
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        )
        loaded = true
        onReady(aspect)
    }
    image.src = src
    return {
        draw(s: any, size: number, fit: number, color: string) {
            if (!loaded || disposed) return
            const dpr = Math.min(window.devicePixelRatio || 1, 2),
                px = Math.round(size * 3 * dpr)
            if (canvas.width !== px) {
                canvas.width = canvas.height = px
            }
            gl.viewport(0, 0, px, px)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.useProgram(program)
            gl.uniform2f(uniforms.bend, s.nx, s.ny)
            for (const k of ["line", "radius", "angle", "elevation"])
                gl.uniform1f(uniforms[k], s[k])
            gl.uniform1f(uniforms.aspect, aspect)
            gl.uniform1f(uniforms.fit, fit)
            gl.uniform1f(
                uniforms.material,
                ["vinyl", "paper", "foil", "rigid"].indexOf(
                    s.material || "vinyl"
                )
            )
            gl.uniform1f(
                uniforms.finish,
                ["print", "chrome", "glitter", "clear"].indexOf(
                    s.finish || "print"
                )
            )
            gl.uniform2f(uniforms.lightPosition, s.lightX || 0, s.lightY || 0)
            const parsed = (() => {
                const c = document.createElement("canvas").getContext("2d")
                if (!c) return [232, 229, 223]
                c.fillStyle = "#e8e5df"
                try {
                    c.fillStyle = color || "#e8e5df"
                } catch {}
                const v = c.fillStyle
                if (/^#[0-9a-f]{6}$/i.test(v)) {
                    const n = parseInt(v.slice(1), 16)
                    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
                }
                const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
                return m ? [+m[1], +m[2], +m[3]] : [232, 229, 223]
            })()
            gl.uniform3f(
                uniforms.backing,
                parsed[0] / 255,
                parsed[1] / 255,
                parsed[2] / 255
            )
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
        },
        dispose() {
            disposed = true
            image.onload = null
            image.onerror = null
            gl.deleteTexture(texture)
            gl.deleteBuffer(vb)
            gl.deleteBuffer(ib)
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)
        },
    }
}

function peelAudio() {
    let ctx: AudioContext | null = null,
        source: AudioBufferSourceNode | null = null,
        gain: GainNode | null = null,
        filter: BiquadFilterNode | null = null
    const unlock = () => {
        try {
            if (!ctx) {
                ctx = new AudioContext()
                const buffer = ctx.createBuffer(
                        1,
                        ctx.sampleRate * 3,
                        ctx.sampleRate
                    ),
                    data = buffer.getChannelData(0)
                let low = 0
                for (let i = 0; i < data.length; i++) {
                    const n = Math.random() * 2 - 1
                    low += 0.18 * (n - low)
                    const grain =
                        0.15 +
                        0.85 *
                            Math.pow(
                                Math.sin(i * 0.0017) * Math.sin(i * 0.0093),
                                4
                            )
                    data[i] = (n - low) * grain
                }
                source = ctx.createBufferSource()
                source.buffer = buffer
                source.loop = true
                filter = ctx.createBiquadFilter()
                filter.type = "bandpass"
                filter.frequency.value = 3800
                filter.Q.value = 0.55
                gain = ctx.createGain()
                gain.gain.value = 0
                source.connect(filter)
                filter.connect(gain)
                gain.connect(ctx.destination)
                source.start()
            }
            if (ctx.state !== "running") void ctx.resume().catch(() => {})
        } catch {}
    }
    const move = (speed: number, volume: number) => {
        if (!ctx || !gain || !source || !filter) return
        const t = ctx.currentTime,
            v = Math.min(1, Math.max(0, speed))
        gain.gain.cancelScheduledValues(t)
        gain.gain.setTargetAtTime(Math.pow(v, 0.6) * volume * 0.32, t, 0.018)
        gain.gain.setTargetAtTime(0, t + 0.075, 0.035)
        source.playbackRate.setTargetAtTime(0.85 + v * 0.45, t, 0.04)
        filter.frequency.setTargetAtTime(2400 + v * 2800, t, 0.025)
    }
    const stop = () => {
        if (ctx && gain) {
            const t = ctx.currentTime
            gain.gain.cancelScheduledValues(t)
            gain.gain.setTargetAtTime(0, t, 0.025)
        }
    }
    const place = (volume: number) => {
        if (!ctx || ctx.state !== "running" || volume <= 0) return
        try {
            const t = ctx.currentTime,
                duration = 0.2,
                buffer = ctx.createBuffer(
                    1,
                    Math.floor(ctx.sampleRate * duration),
                    ctx.sampleRate
                ),
                data = buffer.getChannelData(0)
            let low = 0
            for (let i = 0; i < data.length; i++) {
                const n = Math.random() * 2 - 1
                low += 0.12 * (n - low)
                data[i] = (n - low) * (1 - i / data.length)
            }
            const noise = ctx.createBufferSource()
            noise.buffer = buffer
            const filter2 = ctx.createBiquadFilter()
            filter2.type = "bandpass"
            filter2.frequency.setValueAtTime(1150, t)
            filter2.Q.value = 0.8
            const g = ctx.createGain()
            g.gain.setValueAtTime(0.0001, t)
            g.gain.exponentialRampToValueAtTime(
                Math.max(0.0002, volume * 0.14),
                t + 0.012
            )
            g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
            noise.connect(filter2)
            filter2.connect(g)
            g.connect(ctx.destination)
            noise.start(t)
            noise.stop(t + duration + 0.02)
            const osc = ctx.createOscillator(),
                og = ctx.createGain()
            osc.type = "sine"
            osc.frequency.setValueAtTime(135, t)
            osc.frequency.exponentialRampToValueAtTime(68, t + 0.14)
            og.gain.setValueAtTime(0.0001, t)
            og.gain.exponentialRampToValueAtTime(
                Math.max(0.0002, volume * 0.16),
                t + 0.008
            )
            og.gain.exponentialRampToValueAtTime(0.0001, t + 0.17)
            osc.connect(og)
            og.connect(ctx.destination)
            osc.start(t)
            osc.stop(t + 0.19)
        } catch {}
    }
    return {
        unlock,
        move,
        stop,
        place,
        dispose() {
            try {
                source?.stop()
                source?.disconnect()
                filter?.disconnect()
                gain?.disconnect()
                void ctx?.close().catch(() => {})
            } catch {}
            ctx = null
        },
    }
}

function ResidueTrace(props: { duration: number; children: React.ReactNode }) {
    const [fading, setFading] = React.useState(false),
        [expired, setExpired] = React.useState(false)
    React.useEffect(() => {
        setFading(false)
        setExpired(false)
        if (props.duration === 0) return
        const a = setTimeout(
            () => setFading(true),
            (props.duration * 1000 * 2) / 3
        )
        const b = setTimeout(() => setExpired(true), props.duration * 1000)
        return () => {
            clearTimeout(a)
            clearTimeout(b)
        }
    }, [props.duration])
    if (expired) return null
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                opacity: fading ? 0 : 1,
                transition: `opacity ${Math.max(1, props.duration / 3)}s linear`,
            }}
        >
            {props.children}
        </div>
    )
}
const rotate = (x: number, y: number, a: number) => {
    a *= Math.PI / 180
    return {
        x: x * Math.cos(a) - y * Math.sin(a),
        y: x * Math.sin(a) + y * Math.cos(a),
    }
}
const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v))
function peeledPolygon(
    nx: number,
    ny: number,
    line: number,
    aspect: number,
    w: number,
    h: number
) {
    const c = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ],
        out: { x: number; y: number }[] = []
    const val = (p: { x: number; y: number }) =>
        (p.x - 0.5) * nx + ((p.y - 0.5) / Math.max(0.0001, aspect)) * ny - line
    for (let i = 0; i < 4; i++) {
        const a = c[i],
            b = c[(i + 1) % 4],
            va = val(a),
            vb = val(b),
            ia = va > 0,
            ib = vb > 0
        if (ia) out.push(a)
        if (ia !== ib) {
            const t = va / (va - vb)
            out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
        }
    }
    return out
        .map((p) => `${(p.x * w).toFixed(2)},${(p.y * h).toFixed(2)}`)
        .join(" ")
}
function project(p: any, s: any) {
    const d = Math.max(0, p.x * s.nx + p.y * s.ny - s.line),
        a = Math.min(d / s.radius, s.angle),
        tail = Math.max(0, d - s.angle * s.radius),
        q = Math.sin(a) * s.radius + Math.cos(a) * tail
    return { x: p.x + s.nx * (q - d), y: p.y + s.ny * (q - d) }
}
/** @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 340
 */
export default function PeelableSticker({
    sticker,
    rotation = -6,
    curlAmount = 1,
    shadow = 1,
    shadowBlur = 12,
    shadowOpacity = 0.24,
    shadowDistance = 5,
    alt = "PNG sticker",
    residue = 0.24,
    peelDistance = 170,
    backColor = "#e8e5df",
    sound = true,
    volume = 0.55,
    placeSound = true,
    placeVolume = 0.55,
    showResidue = true,
    traceDuration = 60,
    material = "vinyl",
    finish = "print",
    style,
}: Props) {
    const isStaticRenderer = useIsStaticRenderer()
    const [isVisible, setIsVisible] = React.useState(false)
    const staticRef = React.useRef(isStaticRenderer),
        visibleRef = React.useRef(isVisible)
    staticRef.current = isStaticRenderer
    visibleRef.current = isVisible
    const src = typeof sticker === "string" ? sticker : sticker?.src
    const host = React.useRef<HTMLDivElement>(null),
        sheet = React.useRef<HTMLDivElement>(null),
        canvas = React.useRef<HTMLCanvasElement>(null),
        engine = React.useRef<any>(null),
        liveResidue = React.useRef<SVGSVGElement>(null),
        liveResiduePoly = React.useRef<SVGPolygonElement>(null)
    const [ready, setReady] = React.useState(false),
        [marks, setMarks] = React.useState<any[]>([]),
        [dims, setDims] = React.useState({ w: 280, h: 340 })
    const audio = React.useRef<ReturnType<typeof peelAudio> | null>(null)
    React.useEffect(
        () => () => {
            audio.current?.dispose()
        },
        []
    )
    React.useEffect(() => {
        if (!sound) audio.current?.stop()
    }, [sound])
    const uid = React.useId().replace(/:/g, "")
    const state = React.useRef<any>({
        x: 0,
        y: 0,
        nx: 1,
        ny: 0,
        line: 0.6,
        targetLine: 0.6,
        radius: 0.065,
        angle: Math.PI,
        targetAngle: Math.PI,
        elevation: 0,
        targetElevation: 0,
        phase: "idle",
        aspect: 1,
        frame: 0,
        last: 0,
        drag: null,
        reduced: false,
        hold: null,
    })
    const settings = React.useRef<any>({})
    settings.current = {
        rotation,
        curlAmount,
        shadow,
        shadowBlur,
        shadowOpacity,
        shadowDistance,
        residue,
        peelDistance,
        backColor,
        dims,
        sound,
        volume,
        placeSound,
        placeVolume,
        showResidue,
        material,
        finish,
    }
    const tickRef = React.useRef<(t: number) => void>(() => {})
    const wake = () => {
        const s = state.current
        if (staticRef.current || !visibleRef.current) return
        if (!s.frame) {
            s.last = performance.now()
            s.frame = requestAnimationFrame((t) => tickRef.current(t))
        }
    }
    tickRef.current = (time: number) => {
        const s = state.current,
            o = settings.current
        s.frame = 0
        if (staticRef.current || !visibleRef.current) {
            audio.current?.stop()
            return
        }
        const dt = Math.min(0.04, (time - s.last) / 1000 || 0.016)
        s.last = time
        const ease = 1 - Math.exp(-dt * (s.reduced ? 45 : 24))
        s.material = o.material
        s.finish = o.finish
        const previousLine = s.line
        s.line += (s.targetLine - s.line) * ease
        if (o.sound && s.phase === "peeling")
            audio.current?.move(
                Math.abs(previousLine - s.line) / Math.max(0.001, dt) / 2,
                o.volume
            )
        s.angle += (s.targetAngle - s.angle) * (1 - Math.exp(-dt * 13))
        s.elevation += (s.targetElevation - s.elevation) * ease
        const size = Math.max(o.dims.w, o.dims.h),
            art = Math.min(o.dims.w, o.dims.h * s.aspect)
        if (
            s.phase === "peeling" &&
            s.drag &&
            !s.drag.detached &&
            s.line <= s.drag.min + 0.002
        ) {
            audio.current?.stop()
            const d = s.drag
            d.detached = true
            s.phase = "free"
            s.targetAngle = s.reduced ? 0 : 0.14
            s.targetElevation = 0.06
            const g = project(d.grip, s),
                r = rotate(g.x * art, g.y * art, o.rotation)
            s.hold = {
                grip: d.grip,
                offsetX: d.px - s.x - r.x,
                offsetY: d.py - s.y - r.y,
            }
            if (o.showResidue)
                setMarks((m) => [
                    ...m,
                    {
                        x: d.originX,
                        y: d.originY,
                        id: Date.now(),
                        seed: Math.floor(Math.random() * 9999) + 1,
                    },
                ])
        }
        if (s.hold && (s.phase === "free" || s.phase === "landing")) {
            const h = s.hold,
                d = s.drag
            const px = d ? d.px : h.px,
                py = d ? d.py : h.py
            const g = project(h.grip, s),
                r = rotate(g.x * art, g.y * art, o.rotation)
            s.x = px - h.offsetX - r.x
            s.y = py - h.offsetY - r.y
        }
        if (liveResidue.current && liveResiduePoly.current) {
            const points =
                s.phase === "peeling" && o.showResidue && s.line < 0.6
                    ? peeledPolygon(
                          s.nx,
                          s.ny,
                          s.line,
                          s.aspect,
                          o.dims.w,
                          o.dims.h
                      )
                    : ""
            liveResiduePoly.current.setAttribute("points", points)
            liveResidue.current.style.opacity = points
                ? String(clamp(o.residue * 1.5, 0, 0.6))
                : "0"
            liveResidue.current.style.transform = `translate(${s.x}px,${s.y}px) rotate(${o.rotation}deg)`
        }
        if (sheet.current) {
            const lift = Math.max(0, s.elevation * art)
            const distance = (o.shadowDistance + lift * 0.22) * o.shadow,
                dx = 0,
                dy = distance
            const blur = (o.shadowBlur + lift * 0.32) * o.shadow,
                opacity = clamp(o.shadowOpacity + s.elevation * 0.12, 0, 0.8)
            sheet.current.style.transform = `translate(${s.x}px,${s.y}px) rotate(${o.rotation}deg)`
            sheet.current.style.filter =
                o.shadow <= 0
                    ? "none"
                    : `drop-shadow(${dx.toFixed(2)}px ${dy.toFixed(2)}px ${blur.toFixed(2)}px rgba(24,20,16,${opacity.toFixed(3)}))`
        }
        engine.current?.draw(s, size, art / size, o.backColor)
        const unsettled =
            Math.abs(s.line - s.targetLine) > 0.00008 ||
            Math.abs(s.angle - s.targetAngle) > 0.001 ||
            Math.abs(s.elevation - s.targetElevation) > 0.00008
        if (!unsettled && (s.phase === "landing" || s.phase === "returning")) {
            s.phase = "idle"
            s.hold = null
            s.line = s.targetLine = 0.8
            s.angle = s.targetAngle = Math.PI
            s.elevation = 0
            engine.current?.draw(s, size, art / size, o.backColor)
        }
        if (s.drag || unsettled)
            s.frame = requestAnimationFrame((t) => tickRef.current(t))
    }
    React.useEffect(() => {
        if (isStaticRenderer) return
        const el = host.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            visibleRef.current = true
            setIsVisible(true)
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = !!entry?.isIntersecting
                visibleRef.current = visible
                setIsVisible(visible)
                if (!visible) {
                    const s = state.current
                    if (s.frame) {
                        cancelAnimationFrame(s.frame)
                        s.frame = 0
                    }
                    s.drag = null
                    s.hold = null
                    s.phase = "idle"
                    s.x = s.y = 0
                    s.line = s.targetLine = 0.8
                    s.angle = s.targetAngle = Math.PI
                    s.elevation = s.targetElevation = 0
                    audio.current?.stop()
                }
            },
            { root: null, rootMargin: "100px", threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStaticRenderer])
    React.useEffect(() => {
        if (isStaticRenderer) return
        const el = host.current
        if (!el) return
        const r = new ResizeObserver(([e]) =>
            setDims({ w: e.contentRect.width, h: e.contentRect.height })
        )
        r.observe(el)
        return () => r.disconnect()
    }, [isStaticRenderer])
    React.useEffect(() => {
        if (!isStaticRenderer && isVisible) wake()
    }, [
        isStaticRenderer,
        isVisible,
        dims,
        rotation,
        shadow,
        shadowBlur,
        shadowOpacity,
        shadowDistance,
        backColor,
        material,
        finish,
    ])
    React.useEffect(() => {
        if (isStaticRenderer || !isVisible || !src || !canvas.current) return
        const s = state.current
        setReady(false)
        setMarks([])
        s.x = s.y = 0
        s.line = s.targetLine = 0.8
        s.angle = s.targetAngle = Math.PI
        s.phase = "idle"
        s.drag = null
        s.hold = null
        const r = renderer(canvas.current, src, (a) => {
            s.aspect = a
            setReady(true)
            wake()
        })
        engine.current = r
        return () => {
            r?.dispose()
            engine.current = null
        }
    }, [src, isStaticRenderer, isVisible])
    React.useEffect(() => {
        if (isStaticRenderer) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => {
            state.current.reduced = q.matches
        }
        update()
        q.addEventListener("change", update)
        return () => {
            q.removeEventListener("change", update)
            cancelAnimationFrame(state.current.frame)
        }
    }, [isStaticRenderer])
    const down = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer || !visibleRef.current || e.button !== 0 || !src)
            return
        const s = state.current
        if (s.phase !== "idle") return
        const rect = host.current!.getBoundingClientRect(),
            scale = rect.width / dims.w
        s.drag = {
            id: e.pointerId,
            sx: e.clientX,
            sy: e.clientY,
            px: 0,
            py: 0,
            originX: s.x,
            originY: s.y,
            scale,
            detached: false,
            min: -0.5,
            grip: { x: 0.5, y: 0 },
        }
        s.phase = "peeling"
        s.radius =
            ({ vinyl: 0.058, paper: 0.043, foil: 0.065, rigid: 0.24 }[
                material
            ] || 0.058) / Math.max(0.5, curlAmount)
        s.angle = s.targetAngle = Math.PI
        s.elevation = s.targetElevation = 0
        if (sound || placeSound) {
            if (!audio.current) audio.current = peelAudio()
            audio.current.unlock()
        }
        e.currentTarget.setPointerCapture(e.pointerId)
        e.preventDefault()
        wake()
    }
    const move = (e: React.PointerEvent<HTMLDivElement>) => {
        const s = state.current,
            d = s.drag
        if (!d || d.id !== e.pointerId) return
        const dx = (e.clientX - d.sx) / d.scale,
            dy = (e.clientY - d.sy) / d.scale
        d.px = d.originX + dx
        d.py = d.originY + dy
        const localLight = rotate(dx, dy, -rotation)
        s.lightX = Math.max(-1, Math.min(1, localLight.x / 150))
        s.lightY = Math.max(-1, Math.min(1, localLight.y / 150))
        if (!d.detached) {
            const p = rotate(dx, dy, -rotation),
                length = Math.hypot(p.x, p.y)
            if (length > 4) {
                s.nx = -p.x / length
                s.ny = -p.y / length
            }
            const support = (Math.abs(s.nx) + Math.abs(s.ny) / s.aspect) * 0.5
            d.min = -support
            d.grip = {
                x: s.nx >= 0 ? 0.5 : -0.5,
                y: (s.ny >= 0 ? 0.5 : -0.5) / s.aspect,
            }
            const art = Math.min(dims.w, dims.h * s.aspect)
            // The hand retreats by arc length minus its projected length.
            const pull =
                (Math.max(0, length - 4) / art) *
                (art /
                    (Math.max(80, peelDistance) *
                        (material === "rigid"
                            ? 1.3
                            : material === "paper"
                              ? 0.9
                              : 1)))
            let lo = 0,
                hi = 3
            for (let i = 0; i < 28; i++) {
                const mid = (lo + hi) / 2,
                    a = Math.min(mid / s.radius, Math.PI),
                    tail = Math.max(0, mid - Math.PI * s.radius)
                const retreat =
                    mid - (Math.sin(a) * s.radius + Math.cos(a) * tail)
                if (retreat < pull) lo = mid
                else hi = mid
            }
            s.targetLine = support - (lo + hi) / 2
        }
        wake()
    }
    const endDrag = (e: React.PointerEvent<HTMLDivElement>, cancel = false) => {
        const s = state.current,
            d = s.drag
        if (!d || d.id !== e.pointerId) return
        s.drag = null
        audio.current?.stop()
        if (d.detached && !cancel) {
            s.phase = "landing"
            s.targetAngle = 0
            s.targetElevation = 0
            s.hold.px = d.px
            s.hold.py = d.py
            if (settings.current.placeSound)
                audio.current?.place(settings.current.placeVolume)
        } else {
            s.phase = "returning"
            s.hold = null
            s.x = d.originX
            s.y = d.originY
            s.targetLine = 0.8
            s.targetAngle = Math.PI
            s.targetElevation = 0
        }
        if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId)
        wake()
    }
    const size = Math.max(dims.w, dims.h),
        art = Math.min(dims.w, dims.h * state.current.aspect)
    if (isStaticRenderer) {
        return (
            <div
                style={{
                    width: 280,
                    height: 340,
                    ...style,
                    position: "relative",
                    overflow: "visible",
                    pointerEvents: "none",
                }}
            >
                {src && (
                    <img
                        src={src}
                        alt={alt}
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                            transform: `rotate(${rotation}deg)`,
                            filter:
                                shadow <= 0
                                    ? "none"
                                    : `drop-shadow(0px ${shadowDistance * shadow}px ${shadowBlur * shadow}px rgba(24,20,16,${clamp(shadowOpacity, 0, 0.8)}))`,
                        }}
                    />
                )}
            </div>
        )
    }
    return (
        <div
            ref={host}
            style={{
                width: 280,
                height: 340,
                ...style,
                position: "relative",
                overflow: "visible",
                pointerEvents: "none",
            }}
        >
            {src && showResidue && (
                <svg
                    ref={liveResidue}
                    aria-hidden
                    viewBox={`0 0 ${dims.w} ${dims.h}`}
                    width={dims.w}
                    height={dims.h}
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "visible",
                        opacity: 0,
                        pointerEvents: "none",
                        transform: `rotate(${rotation}deg)`,
                    }}
                >
                    <defs>
                        <clipPath id={uid + "-live-clip"}>
                            <polygon ref={liveResiduePoly} points="" />
                        </clipPath>
                        <filter
                            id={uid + "-live-glue"}
                            x="-3%"
                            y="-3%"
                            width="106%"
                            height="106%"
                            colorInterpolationFilters="sRGB"
                        >
                            <feTurbulence
                                type="fractalNoise"
                                baseFrequency=".023 .033"
                                numOctaves="2"
                                seed="37"
                                result="patchNoise"
                            />
                            <feColorMatrix
                                in="patchNoise"
                                type="matrix"
                                values="0 0 0 0 .72 0 0 0 0 .70 0 0 0 0 .65 0 0 0 12 -6.6"
                                result="patches"
                            />
                            <feTurbulence
                                type="fractalNoise"
                                baseFrequency=".5 .25"
                                numOctaves="3"
                                seed="44"
                                result="fibres"
                            />
                            <feColorMatrix
                                in="fibres"
                                type="matrix"
                                values="0 0 0 0 .74 0 0 0 0 .72 0 0 0 0 .67 0 0 0 1.5 -.2"
                                result="texture"
                            />
                            <feComposite
                                in="texture"
                                in2="patches"
                                operator="in"
                                result="broken"
                            />
                            <feComposite
                                in="broken"
                                in2="SourceAlpha"
                                operator="in"
                                result="adhesive"
                            />
                            <feGaussianBlur
                                in="adhesive"
                                stdDeviation=".18"
                                result="soft"
                            />
                            <feDropShadow
                                in="soft"
                                dx=".2"
                                dy=".45"
                                stdDeviation=".25"
                                floodColor="#443e32"
                                floodOpacity=".24"
                            />
                        </filter>
                    </defs>
                    <image
                        href={src}
                        width={dims.w}
                        height={dims.h}
                        preserveAspectRatio="xMidYMid meet"
                        filter={`url(#${uid}-live-glue)`}
                        clipPath={`url(#${uid}-live-clip)`}
                    />
                </svg>
            )}
            {src &&
                showResidue &&
                marks.map((m) => (
                    <ResidueTrace key={m.id} duration={traceDuration}>
                        <svg
                            aria-hidden
                            viewBox={`0 0 ${dims.w} ${dims.h}`}
                            width={dims.w}
                            height={dims.h}
                            style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "visible",
                                transform: `translate(${m.x}px,${m.y}px) rotate(${rotation}deg)`,
                                opacity: Math.min(0.4, residue),
                                pointerEvents: "none",
                            }}
                        >
                            <defs>
                                <filter
                                    id={uid + "-glue-" + m.id}
                                    x="-3%"
                                    y="-3%"
                                    width="106%"
                                    height="106%"
                                    colorInterpolationFilters="sRGB"
                                >
                                    <feTurbulence
                                        type="fractalNoise"
                                        baseFrequency=".023 .033"
                                        numOctaves="2"
                                        seed={m.seed}
                                        result="patchNoise"
                                    />
                                    <feColorMatrix
                                        in="patchNoise"
                                        type="matrix"
                                        values="0 0 0 0 .72 0 0 0 0 .70 0 0 0 0 .65 0 0 0 12 -6.6"
                                        result="patches"
                                    />
                                    <feTurbulence
                                        type="fractalNoise"
                                        baseFrequency=".5 .25"
                                        numOctaves="3"
                                        seed={m.seed + 7}
                                        result="fibres"
                                    />
                                    <feColorMatrix
                                        in="fibres"
                                        type="matrix"
                                        values="0 0 0 0 .74 0 0 0 0 .72 0 0 0 0 .67 0 0 0 1.5 -.2"
                                        result="texture"
                                    />
                                    <feComposite
                                        in="texture"
                                        in2="patches"
                                        operator="in"
                                        result="broken"
                                    />
                                    <feComposite
                                        in="broken"
                                        in2="SourceAlpha"
                                        operator="in"
                                        result="adhesive"
                                    />
                                    <feGaussianBlur
                                        in="adhesive"
                                        stdDeviation=".18"
                                        result="soft"
                                    />
                                    <feDropShadow
                                        in="soft"
                                        dx=".2"
                                        dy=".45"
                                        stdDeviation=".25"
                                        floodColor="#443e32"
                                        floodOpacity=".24"
                                    />
                                </filter>
                            </defs>
                            <image
                                href={src}
                                width={dims.w}
                                height={dims.h}
                                preserveAspectRatio="xMidYMid meet"
                                filter={`url(#${uid}-glue-${m.id})`}
                            />
                        </svg>
                    </ResidueTrace>
                ))}

            <div
                ref={sheet}
                style={{
                    position: "absolute",
                    inset: 0,
                    transform: `rotate(${rotation}deg)`,
                    pointerEvents: "none",
                }}
            >
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        opacity: ready ? 0 : 1,
                        pointerEvents: "none",
                    }}
                />
                <canvas
                    ref={canvas}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: size * 3,
                        height: size * 3,
                        transform: "translate(-50%,-50%)",
                        opacity: ready ? 1 : 0,
                        pointerEvents: "none",
                    }}
                />
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={alt + ". Pull to peel. Escape resets."}
                    onPointerDown={down}
                    onPointerMove={move}
                    onPointerUp={(e) => endDrag(e)}
                    onPointerCancel={(e) => endDrag(e, true)}
                    onLostPointerCapture={(e) => {
                        if (state.current.drag) endDrag(e, true)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            const s = state.current
                            s.drag = null
                            s.hold = null
                            s.phase = "returning"
                            s.x = s.y = 0
                            s.targetLine = 0.8
                            s.targetAngle = Math.PI
                            s.targetElevation = 0
                            setMarks([])
                            wake()
                        }
                        const v: Record<string, number[]> = {
                            ArrowLeft: [-10, 0],
                            ArrowRight: [10, 0],
                            ArrowUp: [0, -10],
                            ArrowDown: [0, 10],
                        }
                        if (v[e.key]) {
                            e.preventDefault()
                            const s = state.current
                            s.x += v[e.key][0]
                            s.y += v[e.key][1]
                            wake()
                        }
                    }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: art,
                        height: art / state.current.aspect,
                        transform: "translate(-50%,-50%)",
                        pointerEvents: "auto",
                        touchAction: "none",
                        cursor: "grab",
                        userSelect: "none",
                    }}
                />
            </div>
        </div>
    )
}
PeelableSticker.displayName = "Peelable Sticker"
addPropertyControls(PeelableSticker, {
    sticker: { type: ControlType.Image, title: "Sticker image" },
    alt: {
        type: ControlType.String,
        title: "Alt text",
        defaultValue: "Peelable sticker",
    },
    material: {
        type: ControlType.Enum,
        title: "Material",
        options: ["vinyl", "paper", "foil", "rigid"],
        optionTitles: ["Vinyl", "Paper", "Foil", "Rigid"],
        defaultValue: "vinyl",
    },
    finish: {
        type: ControlType.Enum,
        title: "Finish",
        options: ["print", "chrome", "glitter", "clear"],
        optionTitles: ["Print", "Chrome holo", "Glitter", "Clear holo"],
        defaultValue: "print",
    },
    backColor: {
        type: ControlType.Color,
        title: "Paper backing color",
        defaultValue: "#e8e5df",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: -6,
        min: -180,
        max: 180,
    },
    curlAmount: {
        type: ControlType.Number,
        title: "Curl",
        defaultValue: 1,
        min: 0.5,
        max: 1.5,
        step: 0.05,
    },
    peelDistance: {
        type: ControlType.Number,
        title: "Pull distance",
        defaultValue: 170,
        min: 80,
        max: 650,
        unit: "px",
    },
    shadow: {
        type: ControlType.Number,
        title: "Shadow strength",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow blur",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
    },
    shadowOpacity: {
        type: ControlType.Number,
        title: "Shadow opacity",
        defaultValue: 0.24,
        min: 0,
        max: 0.8,
        step: 0.01,
    },
    shadowDistance: {
        type: ControlType.Number,
        title: "Shadow distance",
        defaultValue: 5,
        min: 0,
        max: 40,
        step: 1,
    },
    showResidue: {
        type: ControlType.Boolean,
        title: "Leave marks",
        defaultValue: true,
    },
    residue: {
        type: ControlType.Number,
        title: "Mark strength",
        defaultValue: 0.24,
        min: 0,
        max: 0.4,
        step: 0.01,
        hidden: (p) => !p.showResidue,
    },
    traceDuration: {
        type: ControlType.Number,
        title: "Mark duration",
        defaultValue: 60,
        min: 0,
        max: 300,
        step: 5,
        unit: "s",
        hidden: (p) => !p.showResidue,
    },
    sound: {
        type: ControlType.Boolean,
        title: "Peel sound",
        defaultValue: true,
    },
    volume: {
        type: ControlType.Number,
        title: "Peel volume",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.sound,
    },
    placeSound: {
        type: ControlType.Boolean,
        title: "Place sound",
        defaultValue: true,
    },
    placeVolume: {
        type: ControlType.Number,
        title: "Place volume",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.placeSound,
        description: "Created by [Zulfiqar Islahqamat](https://zizouinvoid.me)",
    },
})
