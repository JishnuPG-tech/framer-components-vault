import * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion"

interface MenuItem {
    label: string
    link?: string
    newTab?: boolean
    color: string
}

interface BackgroundProps {
    show: boolean
    speed: number
    scale: number
    grain: number
    hover?: boolean
}

interface LiquidShaderNavbarProps {
    items: MenuItem[]
    active: number
    trigger: "hover" | "click" | "always"
    layout: "auto" | "row" | "stack"
    position: number
    canvasOpen: boolean
    tabLabel: string
    eyebrow: string
    showNumbers: boolean
    footerText: string
    footerLink?: string
    footerNewTab?: boolean
    font: CSSProperties
    textColor: string
    glassColor: string
    borderColor: string
    blur: number
    panelWidth: number
    railHeight: number
    radius: string
    itemPadding: string
    transition: any
    background: BackgroundProps
    style?: CSSProperties
}

const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace'
const M = 12
const RC = 10
const ROW_PAD = 4
const TAB_H = 28
const AMP = 9
const CREDIT = "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"
const NOISE =
    "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")"

const DEFAULT_ITEMS: MenuItem[] = [
    { label: "Home", color: "#6D5BFF" },
    { label: "Work", color: "#FF6A3D" },
    { label: "About", color: "#17B890" },
    { label: "Journal", color: "#FF3D7F" },
    { label: "Contact", color: "#2F7BFF" },
]

/* ───────── color helpers ───────── */

type RGB = [number, number, number]

function parseColor(input: string): RGB {
    let s = (input || "").trim()
    const v = s.match(/^var\(\s*--[^,]+,\s*(.+)\)$/)
    if (v) s = v[1].trim()
    try {
        const c = Color.toRgb(Color(s))
        if (isFinite(c.r) && isFinite(c.g) && isFinite(c.b)) return [c.r / 255, c.g / 255, c.b / 255]
    } catch (e) {}
    return [0.43, 0.36, 1]
}

function rgbToHsl([r, g, b]: RGB): RGB {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    if (max === min) return [0, 0, l]
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h = 0
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    return [h / 6, s, l]
}

function hslToRgb([h, s, l]: RGB): RGB {
    h = ((h % 1) + 1) % 1
    s = Math.min(1, Math.max(0, s))
    l = Math.min(1, Math.max(0, l))
    if (s === 0) return [l, l, l]
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    const f = (t: number) => {
        t = ((t % 1) + 1) % 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)]
}

function makePalette(color: string): RGB[] {
    const base = parseColor(color)
    const [h, s, l] = rgbToHsl(base)
    const cool = h > 0.33 && h < 0.83
    const target = cool ? 0.5 : h <= 0.33 ? 0.14 : 1.14
    const hl = h + (target - h) * 0.6
    return [
        hslToRgb([h - 0.04, s * 0.6, 0.03]),
        hslToRgb([h - 0.025, Math.min(1, s * 0.92), 0.17]),
        hslToRgb([h, s, Math.min(0.52, Math.max(0.4, l * 0.9))]),
        hslToRgb([h + (hl - h) * 0.3, s, Math.min(0.68, l + 0.1)]),
        hslToRgb([hl, Math.min(1, s * 0.9), 0.87]),
    ]
}

const css = (c: RGB, a = 1) =>
    "rgba(" + Math.round(c[0] * 255) + "," + Math.round(c[1] * 255) + "," + Math.round(c[2] * 255) + "," + a + ")"

const tint = (color: string, white: number, a: number) => {
    const c = parseColor(color)
    return css([c[0] + (1 - c[0]) * white, c[1] + (1 - c[1]) * white, c[2] + (1 - c[2]) * white], a)
}

/* ───────── shader background ───────── */

const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"

const FRAG = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 uRes;uniform float uTime;uniform float uScale;uniform float uWave;uniform vec2 uOrigin;",
    "uniform vec3 uA0;uniform vec3 uA1;uniform vec3 uA2;uniform vec3 uA3;uniform vec3 uA4;",
    "uniform vec3 uB0;uniform vec3 uB1;uniform vec3 uB2;uniform vec3 uB3;uniform vec3 uB4;",
    "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*f*(f*(f*6.-15.)+10.);",
    "float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));",
    "return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}",
    "float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*noise(p);p=mat2(1.5,1.1,-1.1,1.5)*p;a*=.36;}return s*1.18;}",
    "void main(){",
    "vec2 uv=gl_FragCoord.xy/uRes;",
    "float mn=min(uRes.x,uRes.y);",
    "vec2 p=(gl_FragCoord.xy-.5*uRes)/mn*uScale;",
    "vec2 o=(uOrigin-.5*uRes)/mn*uScale;",
    "float t=uTime;",
    "vec2 dv=p-o;float dist=length(dv);",
    "float R=uWave*(length(uRes)/mn*uScale+1.4)-.5;",
    "float live=step(.0005,uWave)*(1.-uWave);",
    "float ring=exp(-pow((dist-R)/.34,2.))*live;",
    "p+=dv/(dist+.001)*ring*.07;",
    "vec2 q=vec2(fbm(p+vec2(0.,t*.13)),fbm(p+vec2(5.2,1.3)-t*.1));",
    "vec2 r=vec2(fbm(p+1.9*q+vec2(1.7,9.2)+t*.08),fbm(p+1.9*q+vec2(8.3,2.8)-t*.065));",
    "vec2 w=p*.8+1.7*r;",
    "float f=fbm(w);",
    "float f2=fbm(w+vec2(.07,-.07));",
    "float sh=clamp((f2-f)/.07,-1.,1.);",
    "float m=1.-smoothstep(R-1.,R+.25,dist+(f-.5)*.5);",
    "vec3 c0=mix(uA0,uB0,m);vec3 c1=mix(uA1,uB1,m);vec3 c2=mix(uA2,uB2,m);vec3 c3=mix(uA3,uB3,m);vec3 c4=mix(uA4,uB4,m);",
    "float d=dot(uv-.5,vec2(.707,-.707));",
    "float v=clamp(.86+d*1.15+(f-.44)*1.6+(r.x-.44)*.7+sh*.05,0.,1.);",
    "vec3 col=mix(c0,c1,smoothstep(0.,.22,v));",
    "col=mix(col,c2,smoothstep(.18,.46,v));",
    "col=mix(col,c3,smoothstep(.44,.72,v));",
    "col=mix(col,c4,smoothstep(.8,1.03,v));",
    "col*=1.+sh*.28;",
    "col+=c4*pow(max(0.,1.-abs(f-r.y)*9.),2.)*.05*smoothstep(.3,.8,v);",
    "col+=mix(uB3,uB4,.5)*ring*.12;",
    "col*=1.-.2*dot(uv-.5,uv-.5);",
    "gl_FragColor=vec4(col,1.);}",
].join("\n")

function ShaderBackground(props: {
    color: string
    speed: number
    scale: number
    grain: number
    animated: boolean
    origin: React.MutableRefObject<{ x: number; y: number }>
}) {
    const { color, speed, scale, grain, animated, origin } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const from = useRef<RGB[]>(makePalette(color))
    const to = useRef<RGB[]>(makePalette(color))
    const wave = useRef(1)
    const waveOrigin = useRef({ x: 0, y: 0 })
    const lastColor = useRef(color)
    const settings = useRef({ speed, scale, grain, animated })
    const redraw = useRef<() => void>(() => {})
    settings.current = { speed, scale, grain, animated }
    const fallback = useMemo(() => makePalette(color), [color])

    useEffect(() => {
        if (lastColor.current === color) return
        lastColor.current = color
        const next = makePalette(color)
        if (settings.current.animated) {
            const e = 1 - Math.pow(1 - wave.current, 2)
            from.current = from.current.map((c, i) => c.map((v, j) => v + (to.current[i][j] - v) * e) as RGB)
            to.current = next
            wave.current = 0
            waveOrigin.current = { x: origin.current.x, y: origin.current.y }
        } else {
            from.current = next
            to.current = next
            wave.current = 1
        }
        redraw.current()
    }, [color])

    useEffect(() => {
        redraw.current()
    }, [speed, scale, grain])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" })
        if (!gl) return
        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)!
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            return sh
        }
        const prog = gl.createProgram()!
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
        gl.useProgram(prog)
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, "p")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const U = (n: string) => gl.getUniformLocation(prog, n)
        const uRes = U("uRes")
        const uTime = U("uTime")
        const uScale = U("uScale")
        const uWave = U("uWave")
        const uOrigin = U("uOrigin")
        const uA = [U("uA0"), U("uA1"), U("uA2"), U("uA3"), U("uA4")]
        const uB = [U("uB0"), U("uB1"), U("uB2"), U("uB3"), U("uB4")]

        let raf = 0
        let visible = true
        let time = 14
        let last = 0
        let disposed = false

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * 0.6
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            gl.viewport(0, 0, w, h)
        }

        const draw = (dt: number) => {
            const s = settings.current
            if (!s.animated) wave.current = 1
            if (wave.current < 1) wave.current = Math.min(1, wave.current + dt / 0.95)
            if (wave.current >= 1) from.current = to.current
            const eased = 1 - Math.pow(1 - wave.current, 2)
            for (let i = 0; i < 5; i++) {
                const a = from.current[i]
                const b = to.current[i]
                gl.uniform3f(uA[i], a[0], a[1], a[2])
                gl.uniform3f(uB[i], b[0], b[1], b[2])
            }
            const ratio = canvas.width / Math.max(1, canvas.clientWidth)
            gl.uniform2f(uOrigin, waveOrigin.current.x * ratio, canvas.height - waveOrigin.current.y * ratio)
            gl.uniform1f(uWave, eased)
            gl.uniform2f(uRes, canvas.width, canvas.height)
            gl.uniform1f(uTime, time)
            gl.uniform1f(uScale, s.scale)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const tick = (now: number) => {
            raf = 0
            if (disposed) return
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
            last = now
            time += dt * settings.current.speed
            draw(dt)
            if (settings.current.animated && visible && !document.hidden) raf = requestAnimationFrame(tick)
        }

        const kick = () => {
            if (disposed) return
            if (settings.current.animated) {
                if (!raf && visible && !document.hidden) {
                    last = 0
                    raf = requestAnimationFrame(tick)
                }
            } else {
                resize()
                draw(1)
            }
        }
        redraw.current = kick

        const ro = new ResizeObserver(() => {
            resize()
            if (!raf) draw(0)
        })
        ro.observe(canvas)
        const io = new IntersectionObserver((entries) => {
            visible = entries[0] ? entries[0].isIntersecting : true
            kick()
        })
        io.observe(canvas)
        const onVis = () => kick()
        document.addEventListener("visibilitychange", onVis)
        resize()
        kick()

        return () => {
            disposed = true
            redraw.current = () => {}
            if (raf) cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
        }
    }, [animated])

    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                background:
                    "linear-gradient(160deg," +
                    css(fallback[0]) +
                    " 0%," +
                    css(fallback[1]) +
                    " 38%," +
                    css(fallback[2]) +
                    " 72%," +
                    css(fallback[4]) +
                    " 100%)",
            }}
        >
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
            {grain > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: NOISE,
                        opacity: Math.min(1, grain * 12),
                        mixBlendMode: "overlay",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

/* ───────── shape ───────── */

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), Math.max(a, b))
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const n2 = (v: number) => Math.round(v * 100) / 100

interface Bead {
    kind: "bottom" | "right"
    lo: number
    hi: number
    peak: number
    amp: number
}

interface BeadPoint {
    x: number
    y: number
    span: number
    amp: number
}

function buildShape(o: { cw: number; S: number; xl: number; xr: number; bot: number; R: number; Rc: number; bead: Bead | null }) {
    const { cw, S, xl, xr, bot, bead } = o
    const wv = Math.max(0, xr - xl)
    const hv = Math.max(0, bot - S)
    let r = Math.max(0, Math.min(o.R, wv / 2, hv))
    let rc = Math.max(0, Math.min(o.Rc, xl, cw - xr))
    if (r + rc > hv) {
        const k = r + rc > 0 ? hv / (r + rc) : 0
        r *= k
        rc *= k
    }
    const A = (rad: number, sweep: number, x: number, y: number) =>
        " A" + n2(rad) + "," + n2(rad) + " 0 0 " + sweep + " " + n2(x) + "," + n2(y)
    const L = (x: number, y: number) => " L" + n2(x) + "," + n2(y)
    const C = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) =>
        " C" + n2(x1) + "," + n2(y1) + " " + n2(x2) + "," + n2(y2) + " " + n2(x) + "," + n2(y)
    const left = "0," + n2(S) + L(xl - rc, S) + A(rc, 1, xl, S + rc) + L(xl, bot - r) + A(r, 0, xl + r, bot)
    const corner = L(xr - r, bot) + A(r, 0, xr, bot - r)
    const right = L(xr, S + rc) + A(rc, 1, xr + rc, S) + L(cw, S)
    let bumpBottom = ""
    let bumpRight = ""
    let pt: BeadPoint | null = null
    if (bead && bead.amp > 0.15) {
        if (bead.kind === "bottom") {
            const lo = Math.max(bead.lo, xl + r + 2)
            const hi = Math.min(bead.hi, xr - r - 2)
            if (hi - lo > 12) {
                const pk = Math.min(hi - 6, Math.max(lo + 6, bead.peak))
                const y = bot + bead.amp
                bumpBottom =
                    L(lo, bot) +
                    C(lo + (pk - lo) * 0.5, bot, pk - (pk - lo) * 0.45, y, pk, y) +
                    C(pk + (hi - pk) * 0.45, y, hi - (hi - pk) * 0.5, bot, hi, bot)
                pt = { x: pk, y, span: hi - lo, amp: bead.amp }
            }
        } else {
            const lo = Math.max(bead.lo, S + rc + 2)
            const hi = Math.min(bead.hi, bot - r - 2)
            if (hi - lo > 12) {
                const pk = Math.min(hi - 6, Math.max(lo + 6, bead.peak))
                const x = xr + bead.amp
                bumpRight =
                    L(xr, hi) +
                    C(xr, hi - (hi - pk) * 0.5, x, pk + (hi - pk) * 0.45, x, pk) +
                    C(x, pk - (pk - lo) * 0.45, xr, lo + (pk - lo) * 0.5, xr, lo)
                pt = { x, y: pk, span: hi - lo, amp: bead.amp }
            }
        }
    }
    const edge = left + bumpBottom + corner + bumpRight + right
    return { edge: "M" + edge, fill: "M0,0 L" + edge + " L" + n2(cw) + ",0 Z", pt }
}

interface Rect {
    x: number
    y: number
    w: number
    h: number
}

interface Metrics {
    cw: number
    ch: number
    rowW: number
    contentW: number
    contentH: number
    tabW: number
    rects: Rect[]
    cta: Rect | null
}

const firstPx = (v: string | number | undefined, fallback: number) => {
    if (typeof v === "number") return v
    const m = String(v || "").match(/-?\d+(\.\d+)?/)
    return m ? parseFloat(m[0]) : fallback
}

const parsePadding = (v: string | number | undefined, fallback: number[]) => {
    if (typeof v === "number") return [v, v, v, v]
    const n = (String(v || "").match(/-?\d+(\.\d+)?/g) || []).map(Number)
    if (!n.length) return fallback
    if (n.length === 1) return [n[0], n[0], n[0], n[0]]
    if (n.length === 2) return [n[0], n[1], n[0], n[1]]
    if (n.length === 3) return [n[0], n[1], n[2], n[1]]
    return [n[0], n[1], n[2], n[3]]
}

/**
 * Liquid Shader Navbar
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 */
export default function LiquidShaderNavbar(props: LiquidShaderNavbarProps) {
    const {
        trigger,
        layout,
        position,
        canvasOpen,
        tabLabel,
        eyebrow,
        showNumbers,
        footerText,
        footerLink,
        footerNewTab,
        font,
        textColor,
        glassColor,
        borderColor,
        blur,
        panelWidth,
        transition,
        style,
    } = props
    const items = props.items && props.items.length ? props.items : DEFAULT_ITEMS
    const background: BackgroundProps = { show: true, speed: 1, scale: 0.9, grain: 0.03, hover: true, ...(props.background || {}) }
    const S = Math.max(0, typeof props.railHeight === "number" ? props.railHeight : 14)
    const R = firstPx(props.radius, 18)
    const pad = parsePadding(props.itemPadding, [14, 18, 14, 18])
    const fontSize = firstPx(font && (font.fontSize as any), 17)
    const itemH = Math.round(fontSize * 1.25 + pad[0] + pad[2])
    const sidePad = 10
    const hasCta = !!footerText
    const ctaIndex = items.length

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const frozen = isStatic || isCanvas
    const reduced = useReducedMotion()
    const instant = frozen || !!reduced
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const idC = "smc" + uid
    const idB = "smb" + uid

    const clampIndex = (i: number) => Math.min(items.length - 1, Math.max(0, Math.round(i) || 0))
    const [active, setActive] = useState(() => clampIndex((props.active || 1) - 1))
    const [openState, setOpen] = useState(false)
    const [hovered, setHovered] = useState<number | null>(null)
    const [m, setM] = useState<Metrics | null>(null)
    const [ready, setReady] = useState(false)
    const activeIndex = clampIndex(active)
    const hoverItem = hovered !== null && hovered < items.length ? hovered : null
    const hoverCta = hasCta && hovered === ctaIndex
    const hi = hoverItem !== null ? hoverItem : activeIndex
    const accent = items[activeIndex].color

    useEffect(() => {
        setActive(clampIndex((props.active || 1) - 1))
    }, [props.active, items.length])

    const rootRef = useRef<HTMLDivElement>(null)
    const bloomRef = useRef<HTMLDivElement>(null)
    const glassRef = useRef<HTMLDivElement>(null)
    const lightRef = useRef<HTMLDivElement>(null)
    const hitRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const probeRef = useRef<HTMLDivElement>(null)
    const labelRef = useRef<HTMLSpanElement>(null)
    const tabRef = useRef<HTMLButtonElement>(null)
    const ctaRef = useRef<HTMLDivElement>(null)
    const rowRefs = useRef<(HTMLLIElement | null)[]>([])
    const labelEls = useRef<(HTMLSpanElement | null)[]>([])
    const pathShadow = useRef<SVGPathElement>(null)
    const pathBase = useRef<SVGPathElement>(null)
    const pathCursor = useRef<SVGPathElement>(null)
    const pathBead = useRef<SVGPathElement>(null)
    const gradC = useRef<SVGRadialGradientElement>(null)
    const gradB = useRef<SVGRadialGradientElement>(null)
    const stopB0 = useRef<SVGStopElement>(null)
    const stopB1 = useRef<SVGStopElement>(null)
    const stopB2 = useRef<SVGStopElement>(null)
    const closeTimer = useRef<any>(null)
    const pointerType = useRef("mouse")
    const prevOpen = useRef<boolean | null>(null)
    const originRef = useRef({ x: 0, y: 0 })
    const openAt = useRef(0)
    const cache = useRef({ fill: "", light: "", bloom: "" })
    const visible = useRef(true)
    const ptr = useRef({ x: -999, y: -999, inside: false })
    const sim = useRef({
        head: 0,
        headV: 0,
        tail: 0,
        tailV: 0,
        hw: 30,
        amp: 0,
        ampV: 0,
        col: [109, 91, 255] as number[],
        sx: -999,
        sy: -999,
        pres: 0,
        time: 0,
        inited: false,
        mag: [] as number[][],
    })

    const w = useMotionValue(80)
    const h = useMotionValue(TAB_H)

    /* geometry */
    const availW = m ? Math.max(120, m.cw - 2 * (M + RC)) : 100000
    const mode: "row" | "stack" = layout === "row" || layout === "stack" ? layout : m && m.rowW > availW ? "stack" : "row"
    const alwaysOpen = trigger === "always" && mode === "row"
    const open = frozen ? !!canvasOpen || alwaysOpen : alwaysOpen || openState
    const show = open && (ready || instant)
    const pw = Math.max(Math.min(160, availW), Math.min(panelWidth, availW))
    const W = m ? (mode === "row" ? Math.min(m.contentW, availW) : pw) : 0
    const H = m ? Math.min(m.contentH, Math.max(60, m.ch - S - 16)) : 0
    const tabW = m ? m.tabW : 80
    const anchor = m ? (m.cw * position) / 100 : 0
    const cClosed = m ? clamp(anchor, tabW / 2 + M + RC, m.cw - tabW / 2 - M - RC) : 0
    const cOpen = m ? clamp(anchor, W / 2 + M + RC, m.cw - W / 2 - M - RC) : 0
    const contentLeft = cOpen - W / 2
    const boxH = S + Math.max(H, TAB_H) + 40

    const tRect = m ? (hoverCta && m.cta ? m.cta : m.rects[hi] || null) : null
    const beadColor = parseColor(hoverCta ? textColor : items[hi].color).map((v) => v * 255)
    let bCenter = 0
    let bLo = 0
    let bHi = 0
    let bHw = 30
    if (tRect) {
        if (mode === "row") {
            bCenter = contentLeft + tRect.x + tRect.w / 2
            bLo = contentLeft + tRect.x + 12
            bHi = contentLeft + tRect.x + tRect.w - 12
            bHw = clamp(tRect.w * 0.3, 20, 38)
        } else {
            bCenter = S + tRect.y + tRect.h / 2
            bLo = S + tRect.y + 8
            bHi = S + tRect.y + tRect.h - 8
            bHw = clamp(tRect.h * 0.42, 14, 22)
        }
    }
    const shaderColor = background.hover !== false && open ? items[hi].color : accent
    if (tRect && m && hovered !== null) {
        originRef.current = mode === "row" ? { x: bCenter, y: S + H + AMP } : { x: contentLeft + W + AMP, y: bCenter }
    }
    const cfg = useRef({
        center: 0,
        lo: 0,
        hi: 0,
        hw: 30,
        hovering: false,
        open: false,
        color: [109, 91, 255] as number[],
        mode: "row" as "row" | "stack",
        centers: [] as number[][],
        lit: -1,
    })
    cfg.current = {
        center: bCenter,
        lo: bLo,
        hi: bHi,
        hw: bHw,
        hovering: open && hovered !== null,
        open,
        color: beadColor,
        mode,
        centers: m ? m.rects.map((r) => [contentLeft + r.x + r.w / 2, S + r.y + r.h / 2]) : [],
        lit: open && hoverItem !== null ? hoverItem : -1,
    }

    /* measure */
    const measure = useCallback(() => {
        const root = rootRef.current
        const content = contentRef.current
        if (!root || !content) return
        const box = (el: HTMLElement | null) =>
            el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : { x: 0, y: 0, w: 0, h: 0 }
        const next: Metrics = {
            cw: root.clientWidth,
            ch: root.clientHeight,
            rowW: probeRef.current ? probeRef.current.offsetWidth : 0,
            contentW: content.offsetWidth,
            contentH: content.offsetHeight,
            tabW: (labelRef.current ? labelRef.current.offsetWidth : 48) + 30,
            rects: rowRefs.current.slice(0, items.length).map(box),
            cta: ctaRef.current ? box(ctaRef.current) : null,
        }
        setM((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }, [items.length])

    useLayoutEffect(() => {
        measure()
    })

    useEffect(() => {
        if (m && !ready) setReady(true)
    }, [m, ready])

    useEffect(() => {
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => measure())
        if (rootRef.current) ro.observe(rootRef.current)
        if (contentRef.current) ro.observe(contentRef.current)
        if (probeRef.current) ro.observe(probeRef.current)
        return () => ro.disconnect()
    }, [measure])

    /* draw */
    const geo = useRef({ cw: 0, S, R, tabW, W, H, cClosed, cOpen, mode })
    geo.current = { cw: m ? m.cw : 0, S, R, tabW, W, H, cClosed, cOpen, mode }

    const draw = useCallback(() => {
        const g = geo.current
        const s = sim.current
        const glass = glassRef.current
        const hit = hitRef.current
        const light = lightRef.current
        const bloom = bloomRef.current
        if (!glass || !hit || !g.cw) return
        const wv = Math.max(4, w.get())
        const hv = Math.max(4, h.get())
        const span = Math.max(1, g.W - g.tabW)
        const t = clamp01((wv - g.tabW) / span)
        const c = g.cClosed + (g.cOpen - g.cClosed) * t
        const xl = c - wv / 2
        const xr = c + wv / 2
        const bot = g.S + hv
        const row = g.mode === "row"
        let bead: Bead | null = null
        if (s.amp > 0.15) {
            const lo = Math.min(s.head, s.tail) - s.hw
            const hi = Math.max(s.head, s.tail) + s.hw
            const squash = Math.pow(clamp((2 * s.hw) / Math.max(1, hi - lo), 0.45, 1), 0.85)
            bead = {
                kind: row ? "bottom" : "right",
                lo,
                hi,
                peak: (s.head + s.tail) / 2 + (s.head - s.tail) * 0.2,
                amp: s.amp * squash,
            }
        }
        const shape = buildShape({ cw: g.cw, S: g.S, xl, xr, bot, R: g.R, Rc: RC, bead })
        const setClip = (el: HTMLElement, d: string) => {
            const v = 'path("' + d + '")'
            el.style.clipPath = v
            ;(el.style as any).webkitClipPath = v
        }
        const k = cache.current
        if (k.fill !== shape.fill) {
            k.fill = shape.fill
            setClip(glass, shape.fill)
            setClip(hit, shape.fill)
            if (light) setClip(light, shape.fill)
            if (pathShadow.current) pathShadow.current.setAttribute("d", shape.edge)
            if (pathBase.current) pathBase.current.setAttribute("d", shape.edge)
            if (pathCursor.current) pathCursor.current.setAttribute("d", shape.edge)
            if (pathBead.current) pathBead.current.setAttribute("d", shape.edge)
        }

        const cr = Math.round(s.col[0])
        const cg = Math.round(s.col[1])
        const cb = Math.round(s.col[2])
        const lr = Math.round(cr + (255 - cr) * 0.5)
        const lg = Math.round(cg + (255 - cg) * 0.5)
        const lb = Math.round(cb + (255 - cb) * 0.5)
        const Cc = (a: number) => "rgba(" + cr + "," + cg + "," + cb + "," + n2(a) + ")"
        const Lc = (a: number) => "rgba(" + lr + "," + lg + "," + lb + "," + n2(a) + ")"
        const pt = shape.pt
        const ar = pt ? clamp01(pt.amp / AMP) : 0
        const at = (x: number, y: number) => " at " + n2(x) + "px " + n2(y) + "px,"
        const parts: string[] = []
        if (pt) {
            if (row) {
                parts.push(
                    "radial-gradient(ellipse " + n2(pt.span * 0.17) + "px 3.2px" + at(pt.x, bot + pt.amp - 2.2) + "rgba(255,255,255," + n2(0.9 * ar) + ") 0%,rgba(255,255,255,0) 100%)," +
                        "radial-gradient(ellipse " + n2(pt.span * 0.4) + "px " + n2(pt.amp + 9) + "px" + at(pt.x, bot + pt.amp * 0.55) +
                        Lc(0.95 * ar) + " 0%," + Cc(0.55 * ar) + " 48%," + Cc(0) + " 100%)"
                )
                parts.push(
                    "radial-gradient(ellipse " + n2(Math.max(64, pt.span * 0.8)) + "px " + n2(hv * 0.8) + "px" + at(pt.x, bot) +
                        Cc(0.22 * ar) + " 0%," + Cc(0.06 * ar) + " 55%," + Cc(0) + " 100%)"
                )
            } else {
                parts.push(
                    "radial-gradient(ellipse 3.2px " + n2(pt.span * 0.17) + "px" + at(xr + pt.amp - 2.2, pt.y) + "rgba(255,255,255," + n2(0.9 * ar) + ") 0%,rgba(255,255,255,0) 100%)," +
                        "radial-gradient(ellipse " + n2(pt.amp + 9) + "px " + n2(pt.span * 0.4) + "px" + at(xr + pt.amp * 0.55, pt.y) +
                        Lc(0.95 * ar) + " 0%," + Cc(0.55 * ar) + " 48%," + Cc(0) + " 100%)"
                )
                parts.push(
                    "radial-gradient(ellipse " + n2(wv * 0.95) + "px " + n2(Math.max(30, pt.span * 0.8)) + "px" + at(xr, pt.y) +
                        Cc(0.24 * ar) + " 0%," + Cc(0.07 * ar) + " 55%," + Cc(0) + " 100%)"
                )
            }
        }
        if (s.pres > 0.01) {
            parts.push(
                "radial-gradient(ellipse 170px 110px" + at(s.sx, s.sy) + "rgba(255,255,255," + n2(0.08 * s.pres) + ") 0%,rgba(255,255,255,0) 72%)"
            )
        }
        const lbg = parts.length ? parts.join(",") : "none"
        if (light && k.light !== lbg) {
            k.light = lbg
            light.style.backgroundImage = lbg
        }
        if (bloom) {
            if (pt) {
                bloom.style.backgroundImage = row
                    ? "radial-gradient(ellipse " + n2(pt.span * 0.85) + "px 56px" + at(pt.x, bot + pt.amp) + Cc(0.46) + " 0%," + Cc(0.12) + " 46%," + Cc(0) + " 76%)," +
                      "radial-gradient(ellipse 230px 70px" + at(pt.x, g.S + hv * 0.55) + Cc(0.22) + " 0%," + Cc(0) + " 78%)"
                    : "radial-gradient(ellipse 56px " + n2(pt.span * 0.85) + "px" + at(xr + pt.amp, pt.y) + Cc(0.46) + " 0%," + Cc(0.12) + " 46%," + Cc(0) + " 76%)," +
                      "radial-gradient(ellipse " + n2(wv * 0.7) + "px 92px" + at(xl + wv / 2, pt.y) + Cc(0.26) + " 0%," + Cc(0) + " 78%)"
                bloom.style.opacity = String(n2(ar))
            } else {
                bloom.style.opacity = "0"
            }
        }
        if (gradC.current) {
            gradC.current.setAttribute("cx", String(n2(s.sx)))
            gradC.current.setAttribute("cy", String(n2(s.sy)))
        }
        if (pathCursor.current) pathCursor.current.style.opacity = String(n2(s.pres))
        if (pathBead.current) pathBead.current.style.opacity = pt ? String(n2(ar)) : "0"
        if (pt && gradB.current) {
            gradB.current.setAttribute("cx", String(n2(pt.x)))
            gradB.current.setAttribute("cy", String(n2(pt.y)))
            gradB.current.setAttribute("r", String(n2(Math.max(26, pt.span * 0.72))))
            const light = "rgb(" + lr + "," + lg + "," + lb + ")"
            const base = "rgb(" + cr + "," + cg + "," + cb + ")"
            if (stopB0.current) stopB0.current.setAttribute("stop-color", light)
            if (stopB1.current) stopB1.current.setAttribute("stop-color", base)
            if (stopB2.current) stopB2.current.setAttribute("stop-color", base)
        }
    }, [])

    useEffect(() => {
        const subs = [w, h].map((mv) => mv.on("change", draw))
        return () => subs.forEach((u) => u())
    }, [draw])

    /* liquid edge + cursor light simulation */
    const step = useCallback(
        (dt: number) => {
            const s = sim.current
            const c = cfg.current
            const p = ptr.current
            if (!geo.current.cw) return
            const wasIdle = !c.open && s.amp < 0.05 && s.pres < 0.01 && !p.inside
            s.time += dt
            let target = c.center
            if (c.hovering && p.inside) target = clamp(c.center + ((c.mode === "row" ? p.x : p.y) - c.center) * 0.3, c.lo, c.hi)
            const ampT = c.open && performance.now() - openAt.current > 300 ? AMP + Math.sin(s.time * 2.2) * 0.5 : 0
            if (!s.inited || (s.amp < 0.3 && ampT === 0)) {
                s.head = target
                s.tail = target
                s.headV = 0
                s.tailV = 0
                s.hw = c.hw
                s.inited = true
            }
            const sub = Math.max(1, Math.ceil(dt / 0.008))
            const hs = dt / sub
            for (let i = 0; i < sub; i++) {
                s.headV += (-560 * (s.head - target) - 40 * s.headV) * hs
                s.head += s.headV * hs
                s.tailV += (-200 * (s.tail - target) - 25 * s.tailV) * hs
                s.tail += s.tailV * hs
                s.ampV += (-300 * (s.amp - ampT) - 19 * s.ampV) * hs
                s.amp += s.ampV * hs
            }
            if (s.amp < 0) {
                s.amp = 0
                if (s.ampV < 0) s.ampV = 0
            }
            s.hw += (c.hw - s.hw) * (1 - Math.exp(-dt * 12))
            const kc = 1 - Math.exp(-dt * 9)
            for (let i = 0; i < 3; i++) s.col[i] += (c.color[i] - s.col[i]) * kc
            if (s.pres < 0.02 && p.inside) {
                s.sx = p.x
                s.sy = p.y
            }
            const kp = 1 - Math.exp(-dt * 18)
            s.sx += (p.x - s.sx) * kp
            s.sy += (p.y - s.sy) * kp
            s.pres += ((p.inside ? 1 : 0) - s.pres) * (1 - Math.exp(-dt * 6))
            const km = 1 - Math.exp(-dt * 11)
            for (let i = 0; i < c.centers.length; i++) {
                const el = labelEls.current[i]
                if (!el) continue
                let tx = 0
                let ty = 0
                if (c.lit === i) {
                    if (p.inside) {
                        tx = clamp((p.x - c.centers[i][0]) * 0.08, -4, 4)
                        ty = clamp((p.y - c.centers[i][1]) * 0.14, -2.5, 2.5)
                    }
                    if (c.mode === "stack") tx += 3
                }
                const o = s.mag[i] || (s.mag[i] = [0, 0])
                const nx = o[0] + (tx - o[0]) * km
                const ny = o[1] + (ty - o[1]) * km
                if (Math.abs(nx - o[0]) > 0.004 || Math.abs(ny - o[1]) > 0.004) {
                    o[0] = nx
                    o[1] = ny
                    el.style.transform = "translate3d(" + n2(nx) + "px," + n2(ny) + "px,0)"
                }
            }
            if (!wasIdle || s.amp > 0.05 || s.pres > 0.01) draw()
        },
        [draw]
    )

    useAnimationFrame((_, delta) => {
        if (instant || !visible.current) return
        step(Math.min(0.05, Math.max(0.001, delta / 1000)))
    })

    useEffect(() => {
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver((entries) => {
            visible.current = entries[0] ? entries[0].isIntersecting : true
        })
        io.observe(root)
        return () => io.disconnect()
    }, [])

    useEffect(() => {
        if (instant) return
        const onMove = (e: PointerEvent) => {
            const root = rootRef.current
            if (!root) return
            const r = root.getBoundingClientRect()
            const x = e.clientX - r.left
            const y = e.clientY - r.top
            ptr.current.x = x
            ptr.current.y = y
            ptr.current.inside = e.pointerType === "mouse" && x >= 0 && y >= 0 && x <= r.width && y <= r.height
        }
        const onOut = () => {
            ptr.current.inside = false
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        document.addEventListener("mouseleave", onOut)
        window.addEventListener("blur", onOut)
        return () => {
            window.removeEventListener("pointermove", onMove)
            document.removeEventListener("mouseleave", onOut)
            window.removeEventListener("blur", onOut)
        }
    }, [instant])

    /* drive open / close */
    useLayoutEffect(() => {
        if (!m) return
        if (prevOpen.current === null && alwaysOpen && !instant) {
            prevOpen.current = false
            w.set(m.tabW)
            h.set(TAB_H)
        }
        const changed = prevOpen.current !== null && prevOpen.current !== open
        prevOpen.current = open
        const tw = open ? W : m.tabW
        const th = open ? H : TAB_H
        if (!changed || instant) {
            w.stop()
            h.stop()
            w.set(tw)
            h.set(th)
            if (open && !openAt.current) openAt.current = 1
            draw()
            return
        }
        if (open) openAt.current = performance.now()
        const spring = transition && typeof transition === "object" ? transition : { type: "spring", stiffness: 300, damping: 30 }
        const controls = open
            ? [animate(w, tw, { ...spring }), animate(h, th, { ...spring, delay: 0.07 })]
            : [animate(h, th, { ...spring, delay: 0.1 }), animate(w, tw, { ...spring, delay: 0.19 })]
        return () => controls.forEach((c) => c.stop())
    }, [open, m, mode, W, H, instant])

    useLayoutEffect(() => {
        if (instant) {
            const s = sim.current
            const c = cfg.current
            s.head = c.center
            s.tail = c.center
            s.hw = c.hw
            s.amp = c.open ? AMP : 0
            s.col = c.color.slice()
            s.pres = 0
            s.inited = true
        }
        draw()
    })

    /* close behaviour */
    const cancelClose = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current)
        closeTimer.current = null
    }
    const scheduleClose = (delay: number) => {
        cancelClose()
        closeTimer.current = setTimeout(() => {
            setOpen(false)
            setHovered(null)
        }, delay)
    }
    useEffect(() => () => cancelClose(), [])

    useEffect(() => {
        if (!openState) return
        const onDown = (e: PointerEvent) => {
            const hit = hitRef.current
            if (hit && !hit.contains(e.target as Node)) {
                setOpen(false)
                setHovered(null)
            }
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false)
                setHovered(null)
                if (tabRef.current) tabRef.current.focus()
            }
        }
        document.addEventListener("pointerdown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [openState])

    const onTabEnter = (e: React.PointerEvent) => {
        if (trigger !== "hover" || e.pointerType !== "mouse") return
        cancelClose()
        setOpen(true)
    }
    const onTabClick = (e: React.MouseEvent) => {
        const mouseHover = trigger === "hover" && pointerType.current === "mouse" && e.detail !== 0
        if (mouseHover) {
            setOpen(true)
            return
        }
        setOpen((v) => !v)
    }
    const onHitLeave = (e: React.PointerEvent) => {
        if (e.pointerType !== "mouse") return
        setHovered(null)
        if (trigger === "hover") scheduleClose(240)
    }
    const onHitEnter = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") cancelClose()
    }
    const pulse = () => {
        if (!instant) sim.current.ampV += 230
    }
    const afterPick = () => {
        if (!alwaysOpen) scheduleClose(200)
    }
    const onSelect = (i: number) => {
        const r = m && m.rects[i]
        if (r) {
            originRef.current =
                mode === "row"
                    ? { x: contentLeft + r.x + r.w / 2, y: S + H + AMP }
                    : { x: contentLeft + W + AMP, y: S + r.y + r.h / 2 }
        }
        setHovered(i)
        setActive(i)
        pulse()
        afterPick()
    }

    /* styles */
    const ease = [0.22, 1, 0.36, 1] as const
    const reveal = (delay: number) =>
        instant ? { duration: 0 } : show ? { delay, duration: 0.55, ease } : { duration: 0.1, ease: "easeOut" as const }
    const shown = { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }
    const hiddenState =
        mode === "row" ? { opacity: 0, x: 0, y: -8, filter: "blur(6px)" } : { opacity: 0, x: -10, y: 0, filter: "blur(6px)" }
    const small: CSSProperties = {
        fontFamily: MONO,
        fontSize: 10,
        lineHeight: "12px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
    }
    const labelStyle: CSSProperties = { ...font, display: "block", whiteSpace: "nowrap", lineHeight: "1.25em" }
    const indexStyle: CSSProperties = {
        fontFamily: MONO,
        fontSize: 9,
        lineHeight: "10px",
        letterSpacing: "0.04em",
        marginLeft: 4,
        transform: "translateY(" + -Math.round(fontSize * 0.42) + "px)",
        flexShrink: 0,
    }
    const itemBase: CSSProperties = {
        display: "flex",
        alignItems: "center",
        height: itemH,
        width: mode === "stack" ? "100%" : undefined,
        boxSizing: "border-box",
        padding: "0 " + pad[1] + "px 0 " + pad[3] + "px",
        margin: 0,
        border: "none",
        background: "none",
        color: "inherit",
        font: "inherit",
        textDecoration: "none",
        textAlign: "left",
        whiteSpace: "nowrap",
        cursor: "pointer",
        borderRadius: 12,
        outlineOffset: -5,
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
    }
    const labelWrap: CSSProperties = { display: "flex", alignItems: "center", willChange: "transform" }
    const ctaStyle: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        fontFamily: (font && (font.fontFamily as string)) || "inherit",
        fontSize: 12.5,
        fontWeight: 500,
        lineHeight: "16px",
        letterSpacing: "0.005em",
        whiteSpace: "nowrap",
        color: "inherit",
        textDecoration: "none",
        border: "none",
        background: "none",
        margin: 0,
        cursor: "pointer",
        borderRadius: 8,
        outlineOffset: 2,
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
    }
    const ctaRowPad = "8px " + Math.max(8, pad[1] - 4) + "px 8px 14px"
    const rowWrap: CSSProperties = {
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
        height: itemH + ROW_PAD * 2,
        padding: ROW_PAD + "px " + sidePad + "px",
    }
    const listRow: CSSProperties = { display: "flex", listStyle: "none", margin: 0, padding: 0 }
    const divider: CSSProperties = {
        display: "block",
        width: 1,
        height: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0), currentColor 50%, rgba(255,255,255,0))",
        opacity: 0.28,
        margin: "0 2px 0 8px",
        flexShrink: 0,
    }
    const stackTop = eyebrow ? 18 : 12
    const stackBottom = hasCta ? 18 : 12
    const tabText = tabLabel || items[activeIndex].label
    const pad2 = (i: number) => String(i + 1).padStart(2, "0")
    const arrow = (lifted: boolean) => (
        <svg
            width="9"
            height="9"
            viewBox="0 0 9 9"
            aria-hidden
            style={{
                display: "block",
                marginLeft: 7,
                opacity: 0.85,
                transform: lifted ? "translate(1.5px,-1.5px)" : "translate(0px,0px)",
                transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
            }}
        >
            <path d="M1.5 7.5 L7.5 1.5 M3.2 1.5 H7.5 V5.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )

    const renderItem = (item: MenuItem, i: number) => {
        const lit = open && hoverItem === i
        const isActive = i === activeIndex
        const resting = open && hovered === null && isActive
        const strong = lit || resting
        const inner = (
            <span
                ref={(el: HTMLSpanElement | null) => {
                    labelEls.current[i] = el
                }}
                style={labelWrap}
            >
                <span
                    style={{
                        ...labelStyle,
                        opacity: strong ? 1 : isActive ? 0.9 : 0.56,
                        textShadow: "0 0 26px " + tint(item.color, 0.15, strong ? 0.75 : 0),
                        transition: "opacity 0.32s ease, text-shadow 0.5s ease",
                    }}
                >
                    {item.label}
                </span>
                {showNumbers && (
                    <span
                        style={{
                            ...indexStyle,
                            color: lit || isActive ? tint(item.color, 0.35, 1) : "inherit",
                            opacity: lit || isActive ? 1 : 0.38,
                            transition: "opacity 0.32s ease, color 0.32s ease",
                        }}
                    >
                        {pad2(i)}
                    </span>
                )}
            </span>
        )
        const common = {
            className: "liquid-shader-navbar-focus",
            tabIndex: open ? 0 : -1,
            "aria-current": isActive ? ("page" as const) : undefined,
            onPointerEnter: (e: React.PointerEvent) => {
                if (e.pointerType === "mouse") setHovered(i)
            },
            onFocus: () => setHovered(i),
            onBlur: () => setHovered((v) => (v === i ? null : v)),
            onClick: () => onSelect(i),
            style: itemBase,
        }
        return (
            <motion.li
                key={i}
                ref={(el: HTMLLIElement | null) => {
                    rowRefs.current[i] = el
                }}
                initial={false}
                animate={show ? shown : hiddenState}
                transition={reveal((mode === "row" ? 0.14 : 0.2) + i * 0.045)}
                style={{ opacity: 0, margin: 0, padding: 0, flexShrink: 0 }}
            >
                {item.link ? (
                    <a {...common} href={item.link} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}>
                        {inner}
                    </a>
                ) : (
                    <button type="button" {...common}>
                        {inner}
                    </button>
                )}
            </motion.li>
        )
    }

    const ctaNode = (padding: string) => {
        const common = {
            className: "liquid-shader-navbar-focus",
            tabIndex: open ? 0 : -1,
            onPointerEnter: (e: React.PointerEvent) => {
                if (e.pointerType === "mouse") setHovered(ctaIndex)
            },
            onFocus: () => setHovered(ctaIndex),
            onBlur: () => setHovered((v) => (v === ctaIndex ? null : v)),
            onClick: () => {
                pulse()
                afterPick()
            },
            style: { ...ctaStyle, padding, opacity: hoverCta ? 1 : 0.7, transition: "opacity 0.3s ease" } as CSSProperties,
        }
        const inner = (
            <>
                {footerText}
                {arrow(hoverCta)}
            </>
        )
        return footerLink ? (
            <a {...common} href={footerLink} target={footerNewTab ? "_blank" : undefined} rel={footerNewTab ? "noopener noreferrer" : undefined}>
                {inner}
            </a>
        ) : (
            <button type="button" {...common}>
                {inner}
            </button>
        )
    }

    const layer: CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: boxH, pointerEvents: "none" }

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                isolation: "isolate",
                color: textColor,
                pointerEvents: background.show ? "auto" : "none",
                ...style,
            }}
        >
            <style>
                {".liquid-shader-navbar-focus:focus{outline:none}.liquid-shader-navbar-focus:focus-visible{outline:2px solid currentColor}" +
                    "@keyframes liquid-shader-navbar-pulse{0%,100%{opacity:.55}50%{opacity:1}}"}
            </style>
            {background.show && (
                <ShaderBackground
                    color={shaderColor}
                    speed={background.speed}
                    scale={background.scale}
                    grain={background.grain}
                    animated={!instant}
                    origin={originRef}
                />
            )}
            <div ref={bloomRef} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0 }} />
            <div
                ref={glassRef}
                aria-hidden
                style={{
                    ...layer,
                    visibility: m ? "visible" : "hidden",
                    backgroundColor: glassColor,
                    backgroundImage:
                        NOISE + ",linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.02) 46%, rgba(255,255,255,0.06) 100%)",
                    backdropFilter: "blur(" + blur + "px) saturate(175%)",
                    WebkitBackdropFilter: "blur(" + blur + "px) saturate(175%)",
                }}
            />
            <div ref={lightRef} aria-hidden style={{ ...layer, visibility: m ? "visible" : "hidden", mixBlendMode: "screen" }} />
            <div
                ref={hitRef}
                onPointerEnter={onHitEnter}
                onPointerLeave={onHitLeave}
                style={{ position: "absolute", inset: 0, pointerEvents: "auto", visibility: m ? "visible" : "hidden" }}
            >
                <button
                    ref={tabRef}
                    type="button"
                    className="liquid-shader-navbar-focus"
                    aria-expanded={open}
                    aria-label={tabLabel || "Menu"}
                    tabIndex={alwaysOpen ? -1 : 0}
                    onPointerDown={(e) => {
                        pointerType.current = e.pointerType
                    }}
                    onPointerEnter={onTabEnter}
                    onClick={onTabClick}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: cClosed - tabW / 2,
                        width: tabW,
                        height: S + TAB_H,
                        padding: 0,
                        margin: 0,
                        border: "none",
                        background: "none",
                        color: "inherit",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: open ? "none" : "auto",
                        borderRadius: 10,
                        outlineOffset: -4,
                        WebkitTapHighlightColor: "transparent",
                        userSelect: "none",
                    }}
                >
                    <motion.span
                        initial={false}
                        animate={{ opacity: open ? 0 : 1 }}
                        transition={instant ? { duration: 0 } : open ? { duration: 0.12 } : { duration: 0.3, delay: 0.38 }}
                        style={{ display: "block", whiteSpace: "nowrap" }}
                    >
                        <span
                            ref={labelRef}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                                fontFamily: (font && (font.fontFamily as string)) || "inherit",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.01em",
                                lineHeight: "14px",
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    display: "block",
                                    width: 5,
                                    height: 5,
                                    borderRadius: 5,
                                    backgroundColor: tint(accent, 0.25, 1),
                                    boxShadow: "0 0 9px 1px " + tint(accent, 0, 0.9),
                                    transition: "background-color 0.6s ease, box-shadow 0.6s ease",
                                    animation: instant ? undefined : "liquid-shader-navbar-pulse 2.8s ease-in-out infinite",
                                }}
                            />
                            {tabText}
                        </span>
                    </motion.span>
                </button>
                <div
                    ref={contentRef}
                    aria-hidden={!open}
                    style={{
                        position: "absolute",
                        top: S,
                        left: contentLeft,
                        width: mode === "row" ? "max-content" : pw,
                        maxHeight: mode === "stack" && m ? Math.max(60, m.ch - S - 16) : undefined,
                        overflowY: mode === "stack" ? "auto" : "visible",
                        overflowX: mode === "stack" ? "hidden" : "visible",
                        boxSizing: "border-box",
                        pointerEvents: open ? "auto" : "none",
                    }}
                >
                    {mode === "row" ? (
                        <div style={rowWrap}>
                            <nav aria-label={tabLabel || "Menu"}>
                                <ul style={listRow}>{items.map(renderItem)}</ul>
                            </nav>
                            {hasCta && (
                                <>
                                    <motion.span
                                        aria-hidden
                                        initial={false}
                                        animate={{ opacity: show ? 0.28 : 0 }}
                                        transition={reveal(0.14 + items.length * 0.045)}
                                        style={{ ...divider, opacity: 0 }}
                                    />
                                    <motion.div
                                        ref={ctaRef}
                                        initial={false}
                                        animate={show ? shown : hiddenState}
                                        transition={reveal(0.18 + items.length * 0.045)}
                                        style={{ opacity: 0, display: "flex", alignItems: "center", height: itemH }}
                                    >
                                        {ctaNode(ctaRowPad)}
                                    </motion.div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div style={{ boxSizing: "border-box", padding: stackTop + "px 10px " + stackBottom + "px 10px" }}>
                            {!!eyebrow && (
                                <motion.div
                                    initial={false}
                                    animate={show ? shown : hiddenState}
                                    transition={reveal(0.16)}
                                    style={{ ...small, opacity: 0, padding: "0 0 10px " + pad[3] + "px" }}
                                >
                                    <span style={{ opacity: 0.5 }}>{eyebrow}</span>
                                </motion.div>
                            )}
                            <nav aria-label={tabLabel || "Menu"}>
                                <ul style={{ ...listRow, flexDirection: "column", gap: 2 }}>{items.map(renderItem)}</ul>
                            </nav>
                            {hasCta && (
                                <motion.div
                                    ref={ctaRef}
                                    initial={false}
                                    animate={show ? shown : hiddenState}
                                    transition={reveal(0.24 + items.length * 0.045)}
                                    style={{ opacity: 0, marginTop: 10, display: "flex", alignItems: "center", height: 40 }}
                                >
                                    {ctaNode("8px " + pad[1] + "px 8px " + pad[3] + "px")}
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div
                ref={probeRef}
                aria-hidden
                style={{ position: "absolute", left: 0, top: 0, width: "max-content", visibility: "hidden", pointerEvents: "none" }}
            >
                <div style={rowWrap}>
                    <ul style={listRow}>
                        {items.map((item, i) => (
                            <li key={i} style={{ margin: 0, padding: 0, flexShrink: 0 }}>
                                <span style={{ ...itemBase, width: undefined }}>
                                    <span style={labelWrap}>
                                        <span style={labelStyle}>{item.label}</span>
                                        {showNumbers && <span style={indexStyle}>{pad2(i)}</span>}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                    {hasCta && (
                        <>
                            <span style={divider} />
                            <div style={{ display: "flex", alignItems: "center", height: itemH }}>
                                <span style={{ ...ctaStyle, padding: ctaRowPad }}>
                                    {footerText}
                                    {arrow(false)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <svg
                aria-hidden
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible", visibility: m ? "visible" : "hidden" }}
            >
                <defs>
                    <radialGradient ref={gradC} id={idC} gradientUnits="userSpaceOnUse" cx={-999} cy={-999} r={180}>
                        <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.3" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient ref={gradB} id={idB} gradientUnits="userSpaceOnUse" cx={-999} cy={-999} r={60}>
                        <stop ref={stopB0} offset="0" stopColor="#ffffff" stopOpacity="1" />
                        <stop ref={stopB1} offset="0.55" stopColor="#ffffff" stopOpacity="0.6" />
                        <stop ref={stopB2} offset="1" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <path ref={pathShadow} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={3} />
                <path ref={pathBase} fill="none" stroke={borderColor} strokeWidth={1} />
                <path ref={pathCursor} fill="none" stroke={"url(#" + idC + ")"} strokeWidth={1} style={{ opacity: 0 }} />
                <path ref={pathBead} fill="none" stroke={"url(#" + idB + ")"} strokeWidth={1.5} style={{ opacity: 0 }} />
            </svg>
        </div>
    )
}

addPropertyControls(LiquidShaderNavbar, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 9,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Page" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#6D5BFF",
                    description: "Lights the edge on hover and floods the background once selected.",
                },
            },
        },
    },
    active: { type: ControlType.Number, title: "Active Item", defaultValue: 1, min: 1, max: 9, step: 1, displayStepper: true },
    trigger: {
        type: ControlType.Enum,
        title: "Opens",
        options: ["hover", "click", "always"],
        optionTitles: ["On Hover", "On Click", "Always Open"],
        defaultValue: "hover",
        description: "Always Open keeps the row visible. The stacked layout still opens on tap.",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["auto", "row", "stack"],
        optionTitles: ["Auto", "Row", "Stack"],
        defaultValue: "auto",
        description: "Auto stacks the links when the row no longer fits.",
    },
    position: { type: ControlType.Number, title: "Position", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
    canvasOpen: {
        type: ControlType.Boolean,
        title: "On Canvas",
        defaultValue: true,
        enabledTitle: "Open",
        disabledTitle: "Closed",
    },
    tabLabel: {
        type: ControlType.String,
        title: "Tab Label",
        defaultValue: "Menu",
        description: "Leave empty to show the active item.",
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "Navigate",
        description: "Shown in the stacked layout.",
    },
    showNumbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    footerText: { type: ControlType.String, title: "Extra Link", defaultValue: "Get in touch" },
    footerLink: { type: ControlType.Link, title: "Link", hidden: (p: any) => !p.footerText },
    footerNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p: any) => !p.footerText || !p.footerLink,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 17, lineHeight: "1.25em", letterSpacing: "-0.01em", variant: "Medium" } as any,
    },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    glassColor: { type: ControlType.Color, title: "Glass", defaultValue: "rgba(16, 14, 22, 0.5)" },
    borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(255, 255, 255, 0.18)" },
    blur: { type: ControlType.Number, title: "Blur", defaultValue: 28, min: 0, max: 80, step: 1, unit: "px" },
    panelWidth: { type: ControlType.Number, title: "Stack Width", defaultValue: 300, min: 180, max: 520, step: 2, unit: "px" },
    railHeight: { type: ControlType.Number, title: "Rail", defaultValue: 14, min: 0, max: 48, step: 1, unit: "px" },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "18px" },
    itemPadding: { type: ControlType.Padding, title: "Item Padding", defaultValue: "14px 18px 14px 18px" },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
    },
    background: {
        type: ControlType.Object,
        title: "Background",
        description: CREDIT,
        controls: {
            show: { type: ControlType.Boolean, title: "Shader", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
            hover: {
                type: ControlType.Boolean,
                title: "Color On",
                defaultValue: true,
                enabledTitle: "Hover",
                disabledTitle: "Click",
                hidden: (p: any) => p.show === false,
            },
            speed: { type: ControlType.Number, title: "Speed", defaultValue: 1, min: 0, max: 4, step: 0.1, hidden: (p: any) => p.show === false },
            scale: { type: ControlType.Number, title: "Scale", defaultValue: 0.9, min: 0.4, max: 3, step: 0.05, hidden: (p: any) => p.show === false },
            grain: { type: ControlType.Number, title: "Grain", defaultValue: 0.03, min: 0, max: 0.2, step: 0.005, hidden: (p: any) => p.show === false },
        },
    },
})
