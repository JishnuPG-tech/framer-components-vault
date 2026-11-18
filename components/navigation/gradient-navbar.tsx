/**
 * Gradient Navbar — a simple navigation bar (logo left, links, call to action right) on a soft, slowly drifting
 * mesh gradient. Hovering a link brightens its label while the whole gradient eases into that link's tint and a
 * faint glow gathers beneath it. Below the collapse width the links move into a smooth drop-down menu.
 * Built by Matthias Ölschlegel — https://dub.sh/dsw13
 */
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


type FontValue = React.CSSProperties & { [key: string]: unknown }

type Item = { title?: string; link?: string; newTab?: boolean; tint?: string }

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface LogoStyle {
    type?: "text" | "image"
    text?: string
    mark?: boolean
    react?: boolean
    image?: ImageValue
    height?: number
    font?: FontValue
    color?: string
    link?: string
    newTab?: boolean
}

interface CtaStyle {
    show?: boolean
    label?: string
    link?: string
    newTab?: boolean
    tint?: string
    fill?: string
    hoverFill?: string
    text?: string
    radius?: string
    padding?: string
}

interface GradientStyle {
    base?: string
    color1?: string
    color2?: string
    color3?: string
    color4?: string
    shift?: number
    glow?: boolean
    drift?: number
    scale?: number
    mouse?: number
    ease?: number
}

interface LinkStyle {
    text?: string
    hoverText?: string
    gap?: number
    align?: "center" | "end"
}

interface BarStyle {
    padding?: string
    radius?: string
    border?: { borderWidth?: number | string; borderStyle?: string; borderColor?: string } | null
    shadow?: string
}

interface MobileStyle {
    collapse?: number
    radius?: number
    icon?: string
}

interface Props {
    logo?: LogoStyle
    items?: Item[]
    cta?: CtaStyle
    font?: FontValue
    links?: LinkStyle
    gradient?: GradientStyle
    bar?: BarStyle
    mobile?: MobileStyle
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: Item[] = [
    { title: "Work", link: "", newTab: false, tint: "#FF8A4C" },
    { title: "Studio", link: "", newTab: false, tint: "#2FD9B0" },
    { title: "Journal", link: "", newTab: false, tint: "#4D8DFF" },
    { title: "Contact", link: "", newTab: false, tint: "#FF5FA2" },
]

const DEFAULT_SHADOW = "0px 12px 32px -16px rgba(10, 6, 30, 0.5)"

type RGB = [number, number, number]

const NAMED: Record<string, RGB> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    transparent: [0, 0, 0],
}

/** Parses hex, rgb()/rgba() and Framer colour tokens (var(--token, fallback)) without touching the DOM. */
function parseColor(value: string | undefined, fallback: RGB): RGB {
    if (!value) return fallback
    let v = value.trim()
    const token = /^var\(\s*--[^,]+,\s*(.+)\)$/.exec(v)
    if (token) v = token[1].trim()
    if (NAMED[v.toLowerCase()]) return NAMED[v.toLowerCase()]
    if (v[0] === "#") {
        let h = v.slice(1)
        if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("")
        if (h.length === 6 || h.length === 8) {
            const n = parseInt(h.slice(0, 6), 16)
            if (isFinite(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        }
        return fallback
    }
    const m = /^rgba?\(([^)]+)\)$/i.exec(v)
    if (m) {
        const parts = m[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(parseFloat)
        if (parts.length === 3 && parts.every((p) => isFinite(p))) return [parts[0], parts[1], parts[2]]
    }
    return fallback
}

function mix(a: RGB, b: RGB, t: number): RGB {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function rgba(c: RGB, a = 1) {
    return `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a.toFixed(3)})`
}

function clamp(v: number, a: number, b: number) {
    return v < a ? a : v > b ? b : v
}

/** Accepts 1–4 values (also Framer's per-side form) and always returns four valid lengths. */
function normPadding(value: string | number | undefined, fallback: string): string {
    if (typeof value === "number") return `${value}px`
    const parts = String(value ?? "")
        .trim()
        .split(/\s+/)
        .filter((t) => /^-?\d*\.?\d+(px|em|rem|%)?$/.test(t))
        .map((t) => (/^-?\d*\.?\d+$/.test(t) ? `${t}px` : t))
    if (parts.length === 0) return fallback
    const [t, r = t, b = t, l = r] = parts
    return `${t} ${r} ${b} ${l}`
}

// Resting position, drift radius and speed of each blob (in % of the bar).
const BLOBS = [
    { x: 8, y: 30, ax: 10, ay: 40, w: 0.21, p: 0.0, sx: 38, sy: 260 },
    { x: 38, y: 90, ax: 14, ay: 50, w: 0.17, p: 1.7, sx: 34, sy: 240 },
    { x: 66, y: 10, ax: 12, ay: 45, w: 0.19, p: 3.1, sx: 36, sy: 250 },
    { x: 94, y: 70, ax: 9, ay: 40, w: 0.15, p: 4.4, sx: 32, sy: 260 },
]

/** Builds the layered background for a given moment. `glow` = [x %, strength 0–1]. */
function paint(
    base: RGB,
    colors: RGB[],
    t: number,
    drift: number,
    glowColor: RGB,
    glowX: number,
    glowA: number,
    size?: { w: number; h: number }
) {
    // Blob height follows the bar, but never grows taller than about half its width (open mobile menu).
    const ry = (pct: number) => (size && size.h > 0 ? `${Math.min((size.h * pct) / 100, size.w * 0.42).toFixed(1)}px` : `${pct}%`)
    const layers: string[] = []
    if (glowA > 0.002) {
        layers.push(
            `radial-gradient(ellipse 22% ${ry(210)} at ${glowX.toFixed(2)}% 115%, ${rgba(glowColor, 0.85 * glowA)} 0%, ${rgba(glowColor, 0)} 70%)`
        )
    }
    for (let i = 0; i < BLOBS.length; i++) {
        const b = BLOBS[i]
        const a = t * b.w + b.p
        const x = b.x + Math.sin(a) * b.ax * drift
        const y = b.y + Math.cos(a * 1.3) * b.ay * drift
        layers.push(
            `radial-gradient(ellipse ${b.sx}% ${ry(b.sy)} at ${x.toFixed(2)}% ${y.toFixed(2)}%, ${rgba(colors[i], 0.8)} 0%, ${rgba(colors[i], 0)} 72%)`
        )
    }
    layers.push(rgba(base))
    return layers.join(", ")
}

// ---- Liquid shader -------------------------------------------------------------------------------------------------
const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"

// Domain-warped value noise: colours flow into each other like ink in water. Coordinates are in CSS px so the
// liquid keeps its scale on every bar size; the pointer pushes a soft swirl into the flow.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uPx, uTime, uScale, uGlowA, uGlowX;
uniform vec3 uBase, uC0, uC1, uC2, uC3, uGlow, uMouse;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){
 vec2 css=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uPx;
 vec2 p=css/uScale;
 vec2 m=uMouse.xy/uScale; vec2 d=p-m; float fall=exp(-dot(d,d)*3.5)*uMouse.z;
 float a=fall*1.4; p=m+mat2(cos(a),-sin(a),sin(a),cos(a))*d; p-=d*fall*.35;
 float t=uTime;
 vec2 q=vec2(fbm(p+vec2(0.,t*.16)),fbm(p+vec2(5.2,1.3)-vec2(t*.13,0.)));
 vec2 r=vec2(fbm(p+2.2*q+vec2(1.7,9.2)+t*.19),fbm(p+2.2*q+vec2(8.3,2.8)-t*.15));
 float f=fbm(p+1.8*r+vec2(t*.07,-t*.05));
 vec3 col=mix(uC0,uC1,smoothstep(.36,.6,f));
 col=mix(col,uC2,smoothstep(.6,.8,length(q)));
 col=mix(col,uC3,smoothstep(.5,.66,r.y)*.9);
 float lum=smoothstep(.25,.75,f*.55+r.x*.5);
 col=mix(uBase,col,.48+.52*lum);
 col=clamp(mix(vec3(dot(col,vec3(.299,.587,.114))),col,1.18),0.,1.);
 float gx=(css.x-uGlowX)/(uScale*.42); float gy=css.y/(uRes.y/uPx);
 col=mix(col,uGlow,clamp(uGlowA*exp(-gx*gx)*(.35+.65*gy),0.,1.));
 col+=(h(gl_FragCoord.xy+t)-.5)/255.;
 gl_FragColor=vec4(col,1.);
}`

interface LiquidUniforms {
    w: number
    h: number
    px: number
    time: number
    scale: number
    base: RGB
    colors: RGB[]
    glow: RGB
    glowA: number
    glowX: number
    mouse: [number, number, number]
}

/** Small WebGL1 renderer for the liquid. Returns null when WebGL is unavailable. */
function createLiquid(canvas: HTMLCanvasElement) {
    let gl: WebGLRenderingContext | null = null
    try {
        gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, premultipliedAlpha: false, powerPreference: "low-power" }) as WebGLRenderingContext | null
    } catch {
        gl = null
    }
    if (!gl) return null
    const g = gl
    const sh = (type: number, src: string) => {
        const o = g.createShader(type)!
        g.shaderSource(o, src)
        g.compileShader(o)
        return g.getShaderParameter(o, g.COMPILE_STATUS) ? o : null
    }
    const vs = sh(g.VERTEX_SHADER, VERT)
    const fs = sh(g.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return null
    const prog = g.createProgram()!
    g.attachShader(prog, vs)
    g.attachShader(prog, fs)
    g.linkProgram(prog)
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) return null
    g.useProgram(prog)
    const buf = g.createBuffer()
    g.bindBuffer(g.ARRAY_BUFFER, buf)
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW)
    const loc = g.getAttribLocation(prog, "p")
    g.enableVertexAttribArray(loc)
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0)
    const U = (name: string) => g.getUniformLocation(prog, name)
    const u = {
        res: U("uRes"), px: U("uPx"), time: U("uTime"), scale: U("uScale"), glowA: U("uGlowA"), glowX: U("uGlowX"),
        base: U("uBase"), c0: U("uC0"), c1: U("uC1"), c2: U("uC2"), c3: U("uC3"), glow: U("uGlow"), mouse: U("uMouse"),
    }
    const c3 = (l: WebGLUniformLocation | null, c: RGB) => g.uniform3f(l, c[0] / 255, c[1] / 255, c[2] / 255)
    return {
        draw(v: LiquidUniforms) {
            const W = Math.max(1, Math.round(v.w * v.px))
            const H = Math.max(1, Math.round(v.h * v.px))
            if (canvas.width !== W || canvas.height !== H) {
                canvas.width = W
                canvas.height = H
            }
            g.viewport(0, 0, W, H)
            g.uniform2f(u.res, W, H)
            g.uniform1f(u.px, v.px)
            g.uniform1f(u.time, v.time)
            g.uniform1f(u.scale, v.scale)
            g.uniform1f(u.glowA, v.glowA)
            g.uniform1f(u.glowX, v.glowX)
            c3(u.base, v.base)
            c3(u.c0, v.colors[0])
            c3(u.c1, v.colors[1])
            c3(u.c2, v.colors[2])
            c3(u.c3, v.colors[3])
            c3(u.glow, v.glow)
            g.uniform3f(u.mouse, v.mouse[0], v.mouse[1], v.mouse[2])
            g.drawArrays(g.TRIANGLES, 0, 3)
        },
        lost: () => g.isContextLost(),
        dispose() {
            g.getExtension("WEBGL_lose_context")?.loseContext()
        },
    }
}

function useCleanId() {
    const raw = React.useId()
    return "gn" + raw.replace(/[^a-zA-Z0-9_-]/g, "")
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function GradientNavbar(props: Props) {
    const { logo = {}, items: rawItems, cta = {}, font, links = {}, gradient = {}, bar = {}, mobile = {}, style } = props

    const items = rawItems && rawItems.length > 0 ? rawItems : DEFAULT_ITEMS
    const isStatic = useIsStaticRenderer()
    const uid = useCleanId()

    const linkText = links.text ?? "rgba(255, 255, 255, 0.72)"
    const linkHover = links.hoverText ?? "#FFFFFF"
    const linkGap = links.gap ?? 4
    const linkAlign = links.align ?? "center"

    const barPadding = normPadding(bar.padding, "12px 12px 12px 28px")
    const barRadius = bar.radius ?? "999px"
    const barShadow = bar.shadow ?? DEFAULT_SHADOW
    const border = bar.border === undefined ? { borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255, 255, 255, 0.1)" } : bar.border

    const showCta = cta.show ?? true
    const ctaPadding = normPadding(cta.padding, "13px 22px 13px 22px")
    const ctaRadius = cta.radius ?? "999px"
    const ctaFill = cta.fill ?? "#FFFFFF"
    const ctaHoverFill = cta.hoverFill ?? "rgba(255, 255, 255, 0.86)"
    const ctaText = cta.text ?? "#140F2B"

    const collapseAt = clamp(mobile.collapse ?? 720, 0, 4000)
    const iconColor = mobile.icon ?? "#FFFFFF"
    const menuRadius = clamp(mobile.radius ?? 32, 0, 80)

    // ---- Gradient palette -------------------------------------------------------------------------------------
    const base = parseColor(gradient.base ?? "#120C2A", [18, 12, 42])
    const palette: RGB[] = [
        parseColor(gradient.color1 ?? "#6B4DFF", [107, 77, 255]),
        parseColor(gradient.color2 ?? "#C04BFF", [192, 75, 255]),
        parseColor(gradient.color3 ?? "#3D7BFF", [61, 123, 255]),
        parseColor(gradient.color4 ?? "#FF6BB0", [255, 107, 176]),
    ]
    const shift = clamp((gradient.shift ?? 80) / 100, 0, 1)
    const glowOn = gradient.glow ?? true
    const drift = clamp((gradient.drift ?? 35) / 100, 0, 1)
    const liquidScale = clamp(gradient.scale ?? 100, 30, 300)
    const mouseAmt = clamp((gradient.mouse ?? 35) / 100, 0, 1)
    const ease = clamp(gradient.ease ?? 1.2, 0.1, 3)

    const tints = items.map((it) => parseColor(it.tint, palette[0]))
    // The logo picks up the hovered tint; the animation loop eases it in step with the gradient.
    const logoReact = logo.react ?? true
    const logoRGB = parseColor(logo.color ?? "#FFFFFF", [255, 255, 255])
    const ctaTint = parseColor(cta.tint ?? "#A88BFF", palette[0])

    const rootRef = React.useRef<HTMLElement>(null)
    const bgRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const menuButtonRef = React.useRef<HTMLButtonElement>(null)
    const rowRef = React.useRef<HTMLDivElement>(null)
    const orbTintRef = React.useRef<HTMLSpanElement>(null)
    const orbGlowRef = React.useRef<HTMLSpanElement>(null)
    const logoTextRef = React.useRef<HTMLSpanElement>(null)
    const logoImgRef = React.useRef<HTMLImageElement>(null)
    const [rowH, setRowH] = React.useState(0)
    React.useLayoutEffect(() => {
        const row = rowRef.current
        if (!row) return
        setRowH(row.offsetHeight)
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => setRowH(row.offsetHeight))
        ro.observe(row)
        return () => ro.disconnect()
    }, [])
    const [open, setOpen] = React.useState(false)
    const [hovered, setHovered] = React.useState<number>(-1) // -1 none, 0..n-1 items, n = CTA

    // Live values read by the animation loop without re-rendering.
    const live = React.useRef({
        base,
        palette,
        tints,
        ctaTint,
        shift,
        glowOn,
        drift,
        liquidScale,
        mouseAmt,
        ease,
        logoReact,
        logoRGB,
        target: -1,
        glowX: 50,
        mouse: { x: 0, y: 0, inside: false },
    })
    live.current.base = base
    live.current.palette = palette
    live.current.tints = tints
    live.current.ctaTint = ctaTint
    live.current.shift = shift
    live.current.glowOn = glowOn
    live.current.drift = drift
    live.current.liquidScale = liquidScale
    live.current.mouseAmt = mouseAmt
    live.current.ease = ease
    live.current.logoReact = logoReact
    live.current.logoRGB = logoRGB
    live.current.target = hovered

    const anim = React.useRef<{
        cur: RGB[]
        curBase: RGB
        glowColor: RGB
        glowA: number
        glowX: number
        t: number
        raf: number
        last: number
        visible: boolean
        kick: () => void
    } | null>(null)

    const targetOf = React.useCallback((index: number) => {
        const L = live.current
        if (index < 0) return null
        return index < L.tints.length ? L.tints[index] : L.ctaTint
    }, [])

    React.useEffect(() => {
        if (isStatic) return
        const el = bgRef.current
        const root = rootRef.current
        if (!el || !root) return
        const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        const L = live.current
        const state = {
            cur: L.palette.map((c) => [...c] as RGB),
            curBase: [...L.base] as RGB,
            midCols: L.palette.map((c) => [...c] as RGB),
            midBase: [...L.base] as RGB,
            glowColor: [...L.palette[0]] as RGB,
            midGlow: [...L.palette[0]] as RGB,
            glowA: 0,
            midA: 0,
            logoA: 0,
            midLogoA: 0,
            logoKey: "",
            glowX: 50,
            t: 0,
            raf: 0,
            last: 0,
            visible: true,
            h: 0,
            mouseA: 0,
            mx: 0,
            my: 0,
            kick: () => {},
        }
        anim.current = state

        const canvas = canvasRef.current
        let liquid = canvas ? createLiquid(canvas) : null
        let shown = false
        const onLost = (e: Event) => {
            e.preventDefault()
            liquid = null
            if (canvas) canvas.style.opacity = "0"
        }
        canvas?.addEventListener("webglcontextlost", onLost)

        const frame = (now: number) => {
            state.raf = 0
            const dt = state.last ? clamp((now - state.last) / 1000, 1 / 240, 1 / 20) : 1 / 60
            state.last = now
            const L = live.current
            const tint = targetOf(L.target)
            // Two chained low-pass filters: colours start moving gently instead of jumping, then settle softly.
            const k = reduce ? 1 : 1 - Math.exp(-dt / (L.ease * 0.24))
            let moving = false
            const chase = (mid: RGB, cur: RGB, goal: RGB) => {
                for (let j = 0; j < 3; j++) {
                    mid[j] += (goal[j] - mid[j]) * k
                    const d = mid[j] - cur[j]
                    if (Math.abs(goal[j] - cur[j]) > 0.3) moving = true
                    cur[j] += d * k
                }
            }
            for (let i = 0; i < 4; i++) {
                const goal = tint ? mix(L.palette[i], tint, L.shift * (0.8 + 0.2 * (i % 2))) : L.palette[i]
                chase(state.midCols[i], state.cur[i], goal)
            }
            chase(state.midBase, state.curBase, tint ? mix(L.base, tint, L.shift * 0.32) : L.base)
            if (tint) chase(state.midGlow, state.glowColor, tint)
            const glowGoal = tint && L.glowOn ? 1 : 0
            state.midA += (glowGoal - state.midA) * k
            state.glowA += (state.midA - state.glowA) * k
            const logoGoal = tint && L.logoReact ? 1 : 0
            state.midLogoA += (logoGoal - state.midLogoA) * k
            state.logoA += (state.midLogoA - state.logoA) * k
            if (Math.abs(logoGoal - state.logoA) > 0.002) moving = true
            state.glowX += (L.glowX - state.glowX) * (reduce ? 1 : 1 - Math.exp(-dt / 0.3))

            // Logo tint follows the same eased colour as the gradient.
            const a = state.logoA
            const g = state.glowColor
            const logoKey = `${a.toFixed(3)}|${g.map(Math.round).join(",")}|${L.logoRGB.join(",")}`
            if (logoKey !== state.logoKey) {
                state.logoKey = logoKey
                const orb = orbTintRef.current
                if (orb) {
                    orb.style.background = `radial-gradient(circle at 34% 30%, ${rgba(mix(g, [255, 255, 255], 0.55))} 0%, ${rgba(g)} 48%, ${rgba(mix(g, L.base, 0.45))} 100%)`
                    orb.style.opacity = a.toFixed(3)
                }
                const glowEl = orbGlowRef.current
                if (glowEl) {
                    glowEl.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,0.28), inset 0 3px 6px rgba(255,255,255,0.35), 0 0 ${14 + 6 * a}px ${rgba(mix([255, 255, 255], g, a), 0.12 + 0.63 * a)}`
                }
                const text = logoTextRef.current
                if (text) {
                    text.style.color = rgba(mix(L.logoRGB, g, 0.18 * a))
                    text.style.textShadow = a > 0.001 ? `0 0 16px ${rgba(g, 0.7 * a)}` : "none"
                }
                const img = logoImgRef.current
                if (img) img.style.filter = a > 0.001 ? `drop-shadow(0 0 10px ${rgba(g, 0.7 * a)})` : "none"
            }
            if (root.offsetHeight !== state.h) {
                state.h = root.offsetHeight
                moving = true
            }
            if (Math.abs(glowGoal - state.glowA) > 0.002 || Math.abs(L.glowX - state.glowX) > 0.05) moving = true

            const driftOn = !reduce && L.drift > 0
            // Flow 50 % = calm, 100 % = twice as fast.
            if (driftOn) state.t += dt * L.drift * 2

            // Pointer swirl eases in and out so the liquid never jumps.
            const M = L.mouse
            const mGoal = M.inside && !reduce ? L.mouseAmt : 0
            const km = 1 - Math.exp(-dt / 0.25)
            state.mouseA += (mGoal - state.mouseA) * km
            if (M.inside) {
                state.mx += (M.x - state.mx) * km
                state.my += (M.y - state.my) * km
            }
            if (Math.abs(mGoal - state.mouseA) > 0.002) moving = true

            if (liquid && !liquid.lost()) {
                const w = root.offsetWidth
                const hgt = root.offsetHeight
                const dpr = Math.min(window.devicePixelRatio || 1, 2)
                liquid.draw({
                    w,
                    h: hgt,
                    px: dpr * 0.5,
                    time: state.t + 20,
                    scale: 3.4 * L.liquidScale,
                    base: state.curBase,
                    colors: state.cur,
                    glow: state.glowColor,
                    glowA: Math.min(state.glowA * L.shift * 0.55, 0.6),
                    glowX: (state.glowX / 100) * w,
                    mouse: [state.mx, state.my, state.mouseA],
                })
                if (!shown && canvas) {
                    shown = true
                    canvas.style.opacity = "1"
                }
            } else el.style.background = paint(
                state.curBase,
                state.cur,
                state.t,
                L.drift,
                state.glowColor,
                state.glowX,
                Math.min(state.glowA * L.shift * 1.5, 1),
            { w: root.offsetWidth, h: root.offsetHeight }
            )
            if ((driftOn || moving) && state.visible && !document.hidden) state.raf = requestAnimationFrame(frame)
            else state.last = 0
        }

        state.kick = () => {
            if (!state.raf && state.visible && !document.hidden) state.raf = requestAnimationFrame(frame)
        }

        const io = new IntersectionObserver((entries) => {
            state.visible = entries[entries.length - 1].isIntersecting
            if (state.visible) state.kick()
        })
        io.observe(root)
        const onVis = () => state.kick()
        document.addEventListener("visibilitychange", onVis)
        state.kick()

        return () => {
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            canvas?.removeEventListener("webglcontextlost", onLost)
            liquid?.dispose()
            if (state.raf) cancelAnimationFrame(state.raf)
            anim.current = null
        }
    }, [isStatic, targetOf])

    // Restart the loop whenever the target or a setting changes.
    React.useEffect(() => {
        anim.current?.kick()
    })

    // Close the menu with Escape and when the bar grows past the collapse width.
    React.useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false)
                menuButtonRef.current?.focus()
            }
        }
        window.addEventListener("keydown", onKey)
        const root = rootRef.current
        let ro: ResizeObserver | null = null
        if (root && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                if (root.offsetWidth >= collapseAt) setOpen(false)
            })
            ro.observe(root)
        }
        return () => {
            window.removeEventListener("keydown", onKey)
            ro?.disconnect()
        }
    }, [open, collapseAt])

    const enter = (index: number, e?: React.PointerEvent | React.FocusEvent, touch = false) => {
        if (!touch && e && "pointerType" in e && e.pointerType !== "mouse") return
        const root = rootRef.current
        const target = e?.currentTarget as HTMLElement | undefined
        if (root && target) {
            const r = root.getBoundingClientRect()
            const t = target.getBoundingClientRect()
            if (r.width > 0) live.current.glowX = clamp(((t.left + t.width / 2 - r.left) / r.width) * 100, 0, 100)
        }
        setHovered(index)
    }
    const leave = (index: number) => setHovered((h) => (h === index ? -1 : h))

    // Touch has no hover: a tap tints the liquid, which then eases back after a moment.
    const tapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    React.useEffect(() => () => {
        if (tapTimer.current) clearTimeout(tapTimer.current)
    }, [])
    const hoverHandlers = (index: number) => ({
        onPointerEnter: (e: React.PointerEvent) => enter(index, e),
        onPointerLeave: (e: React.PointerEvent) => {
            if (e.pointerType === "mouse") leave(index)
        },
        onPointerDown: (e: React.PointerEvent) => {
            if (e.pointerType === "mouse") return
            enter(index, e, true)
            if (tapTimer.current) clearTimeout(tapTimer.current)
            tapTimer.current = setTimeout(() => leave(index), 2200)
        },
        onFocus: (e: React.FocusEvent) => enter(index, e),
        onBlur: () => leave(index),
    })

    // Single radius values are clamped to a true pill; per-corner values are used as they are.
    const singleRadius = /^\s*[\d.]+px\s*$/.test(barRadius) ? parseFloat(barRadius) : null
    const closedRadius = singleRadius !== null && rowH > 0 ? `${Math.min(singleRadius, rowH / 2)}px` : barRadius
    const openRadius = singleRadius !== null ? `${Math.min(singleRadius, menuRadius)}px` : barRadius
    const restBackground = paint(base, palette, 0, drift, palette[0], 50, 0)

    const linkProps = (link: string | undefined, newTab: boolean | undefined) =>
        link
            ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined }
            : { "aria-disabled": true as const }

    const c = `.${uid}`
    const css = `
${c}{container-type:inline-size;}
${c} *{box-sizing:border-box;}
${c} .gn-link{color:${linkText};transition:color .6s cubic-bezier(.25,.1,.25,1),opacity .6s;text-decoration:none;cursor:pointer;border-radius:10px;outline:none;-webkit-tap-highlight-color:transparent;}
${c} .gn-link:hover,${c} .gn-link[data-on="1"]{color:${linkHover};}
${c} .gn-link:focus-visible,${c} .gn-cta:focus-visible,${c} .gn-burger:focus-visible,${c} .gn-logo:focus-visible{outline:2px solid ${linkHover};outline-offset:2px;}
${c} .gn-cta{background:${ctaFill};color:${ctaText};transition:background .6s cubic-bezier(.25,.1,.25,1),transform .35s cubic-bezier(.2,.7,.2,1);text-decoration:none;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;}
${c} .gn-cta:hover{background:${ctaHoverFill};}
${c} .gn-cta:active{transform:scale(.97);}
${c} a[aria-disabled]{cursor:default;}
${c} .gn-burger{display:none;}
${c} .gn-panel{display:none;}
@container (max-width:${Math.max(collapseAt - 0.02, 0)}px){
${c} .gn-desk{display:none !important;}
${c} .gn-burger{display:flex;}
${c} .gn-panel{display:grid;}
}
${c} .gn-mark{animation:${uid}-spin 14s linear infinite;}

@keyframes ${uid}-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion:reduce){${c} .gn-mark{animation:none;}}
@media (prefers-reduced-motion:reduce){${c} .gn-panel,${c} .gn-panel-inner,${c} .gn-burger span{transition:none !important;}}
`

    const fontStyle: React.CSSProperties = {
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        lineHeight: "1.2em",
        ...font,
    }

    const logoNode =
        logo.type === "image" && logo.image?.src ? (
            <img
                src={logo.image.src}
                srcSet={logo.image.srcSet}
                alt={logo.image.alt || logo.text || "Logo"}
                ref={logoImgRef}
                style={{ height: logo.height ?? 26, width: "auto", display: "block" }}
                draggable={false}
            />
        ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                {(logo.mark ?? true) && (
                    <span
                        aria-hidden
                        className="gn-orb"
                        style={{ position: "relative", width: 20, height: 20, flexShrink: 0, borderRadius: 999 }}
                    >
                        <span
                            className="gn-mark"
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 999,
                                background: `conic-gradient(from 210deg, ${rgba(palette[0])}, ${rgba(palette[1])}, ${rgba(palette[3])}, ${rgba(palette[2])}, ${rgba(palette[0])})`,
                            }}
                        />
                        <span ref={orbTintRef} style={{ position: "absolute", inset: 0, borderRadius: 999, opacity: 0 }} />
                        <span
                            ref={orbGlowRef}
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 999,
                                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28), inset 0 3px 6px rgba(255,255,255,0.35), 0 0 14px rgba(255,255,255,0.12)",
                            }}
                        />
                    </span>
                )}
            <span
                ref={logoTextRef}
                style={{
                    fontSize: 19,
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: "1em",
                    ...logo.font,
                    color: logo.color ?? "#FFFFFF",
                    whiteSpace: "nowrap",
                }}
            >
                {logo.text ?? "Prisma"}
            </span>
            </span>
        )

    const ctaLabel = cta.label ?? "Get Started"
    const panelId = `${uid}-menu`

    return (
        <nav
            ref={rootRef}
            className={uid}
            aria-label="Main"
            onPointerMove={(e) => {
                const r = rootRef.current?.getBoundingClientRect()
                if (!r || e.pointerType !== "mouse") return
                const M = live.current.mouse
                M.x = e.clientX - r.left
                M.y = e.clientY - r.top
                M.inside = true
                anim.current?.kick()
            }}
            onPointerLeave={() => {
                live.current.mouse.inside = false
                anim.current?.kick()
            }}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                borderRadius: open ? openRadius : closedRadius,
                transition: "border-radius .5s cubic-bezier(.2,.7,.2,1)",
                overflow: "hidden",
                boxShadow: barShadow,
                isolation: "isolate",
                ...style,
            }}
        >
            <style>{css}</style>
            <div
                ref={bgRef}
                aria-hidden
                style={{ position: "absolute", inset: 0, zIndex: 0, background: restBackground, pointerEvents: "none" }}
            />
            {!isStatic && (
                <canvas
                    ref={canvasRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0,
                        display: "block",
                        pointerEvents: "none",
                        opacity: 0,
                        transition: "opacity .6s ease",
                    }}
                />
            )}
            {/* Soft top highlight so the gradient reads as a surface. */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                    borderRadius: "inherit",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%)",
                    ...(border
                        ? {
                              borderWidth: border.borderWidth,
                              borderStyle: border.borderStyle as React.CSSProperties["borderStyle"],
                              borderColor: border.borderColor,
                          }
                        : null),
                }}
            />
            <div
                ref={rowRef}
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    gridTemplateColumns: linkAlign === "center" ? "1fr auto 1fr" : "auto 1fr auto",
                    alignItems: "center",
                    columnGap: 16,
                    padding: barPadding,
                    minHeight: 0,
                }}
            >
                <a
                    className="gn-logo"
                    {...linkProps(logo.link, logo.newTab)}
                    style={{
                        gridColumn: 1,
                        justifySelf: "start",
                        display: "flex",
                        alignItems: "center",
                        textDecoration: "none",
                        borderRadius: 6,
                        outline: "none",
                    }}
                >
                    {logoNode}
                </a>

                <ul
                    className="gn-desk"
                    style={{
                        gridColumn: 2,
                        justifySelf: linkAlign === "center" ? "center" : "end",
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: linkGap,
                    }}
                    onPointerLeave={(e) => {
                        if (e.pointerType === "mouse") setHovered(-1)
                    }}
                >
                    {items.map((it, i) => (
                        <li key={i} style={{ display: "flex" }}>
                            <a
                                className="gn-link"
                                data-on={hovered === i ? "1" : "0"}
                                {...linkProps(it.link, it.newTab)}
                                {...hoverHandlers(i)}
                                style={{ ...fontStyle, padding: "8px 12px", whiteSpace: "nowrap", userSelect: "none" }}
                            >
                                {it.title ?? "Item"}
                            </a>
                        </li>
                    ))}
                </ul>

                <div style={{ gridColumn: 3, justifySelf: "end", display: "flex", alignItems: "center" }}>
                {showCta && (
                    <a
                        className="gn-cta gn-desk"
                        {...linkProps(cta.link, cta.newTab)}
                        {...hoverHandlers(items.length)}
                        style={{
                            ...fontStyle,
                            display: "inline-flex",
                            alignItems: "center",
                            padding: ctaPadding,
                            borderRadius: ctaRadius,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            userSelect: "none",
                        }}
                    >
                        {ctaLabel}
                    </a>
                )}

                <button
                    ref={menuButtonRef}
                    type="button"
                    className="gn-burger"
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen((o) => !o)}
                    style={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        border: "none",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        cursor: "pointer",
                        padding: 0,
                        outline: "none",
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    {[0, 1].map((n) => (
                        <span
                            key={n}
                            style={{
                                position: "absolute",
                                left: 14,
                                right: 14,
                                height: 1.5,
                                borderRadius: 2,
                                background: iconColor,
                                top: "50%",
                                transition: "transform .4s cubic-bezier(.2,.7,.2,1)",
                                transform: open
                                    ? `translateY(-50%) rotate(${n ? -45 : 45}deg)`
                                    : `translateY(calc(-50% ${n ? "+ 4px" : "- 4px"}))`,
                            }}
                        />
                    ))}
                </button>
                </div>
            </div>

            <div
                id={panelId}
                className="gn-panel"
                style={{
                    position: "relative",
                    zIndex: 1,
                    gridTemplateRows: open ? "1fr" : "0fr",
                    transition: "grid-template-rows .5s cubic-bezier(.2,.7,.2,1)",
                }}
                {...(!open ? { inert: "" as unknown as boolean, "aria-hidden": true } : {})}
            >
                <div className="gn-panel-inner" style={{ overflow: "hidden", minHeight: 0 }}>
                    <ul
                        onPointerLeave={(e) => {
                            if (e.pointerType === "mouse") setHovered(-1)
                        }}
                        style={{
                            listStyle: "none",
                            margin: 0,
                            padding: "4px 12px 12px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            opacity: open ? 1 : 0,
                            transform: open ? "none" : "translateY(-6px)",
                            transition: "opacity .4s cubic-bezier(.2,.7,.2,1), transform .5s cubic-bezier(.2,.7,.2,1)",
                        }}
                    >
                        {items.map((it, i) => (
                            <li key={i} style={{ display: "flex" }}>
                                <a
                                    className="gn-link"
                                    data-on={hovered === i ? "1" : "0"}
                                    {...linkProps(it.link, it.newTab)}
                                    {...hoverHandlers(i)}
                                    onClick={() => it.link && setOpen(false)}
                                    style={{
                                        ...fontStyle,
                                        fontSize: 22,
                                        letterSpacing: "-0.02em",
                                        width: "100%",
                                        padding: "12px 10px",
                                        userSelect: "none",
                                    }}
                                >
                                    {it.title ?? "Item"}
                                </a>
                            </li>
                        ))}
                        {showCta && (
                            <li style={{ display: "flex", paddingTop: 8 }}>
                                <a
                                    className="gn-cta"
                                    {...linkProps(cta.link, cta.newTab)}
                                    {...hoverHandlers(items.length)}
                                    onClick={() => cta.link && setOpen(false)}
                                    style={{
                                        ...fontStyle,
                                        display: "flex",
                                        justifyContent: "center",
                                        width: "100%",
                                        padding: ctaPadding,
                                        borderRadius: ctaRadius,
                                        userSelect: "none",
                                    }}
                                >
                                    {ctaLabel}
                                </a>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    )
}

GradientNavbar.displayName = "Gradient Navbar"

addPropertyControls(GradientNavbar, {
    logo: {
        type: ControlType.Object,
        title: "Logo",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["text", "image"],
                optionTitles: ["Text", "Image"],
                displaySegmentedControl: true,
                defaultValue: "text",
            },
            text: { type: ControlType.String, title: "Text", defaultValue: "Prisma", hidden: (p: LogoStyle) => p.type === "image" },
            mark: {
                type: ControlType.Boolean,
                title: "Mark",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: (p: LogoStyle) => p.type === "image",
            },
            react: {
                type: ControlType.Boolean,
                title: "Hover Tint",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "The logo picks up the hovered link's tint.",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 19, variant: "Semibold", letterSpacing: "-0.03em", lineHeight: "1em" },
                hidden: (p: LogoStyle) => p.type === "image",
            },
            color: { type: ControlType.Color, title: "Color", defaultValue: "#FFFFFF", hidden: (p: LogoStyle) => p.type === "image" },
            image: { type: ControlType.ResponsiveImage, title: "Image", hidden: (p: LogoStyle) => p.type !== "image" },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 26,
                min: 12,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (p: LogoStyle) => p.type !== "image",
            },
            link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
        },
    },
    items: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Item" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
                tint: {
                    type: ControlType.Color,
                    title: "Tint",
                    defaultValue: "#FF8A4C",
                    description: "The gradient eases toward this colour on hover.",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    cta: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
            label: { type: ControlType.String, title: "Label", defaultValue: "Get Started", hidden: (p: CtaStyle) => p.show === false },
            link: { type: ControlType.Link, title: "Link", defaultValue: "", hidden: (p: CtaStyle) => p.show === false },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p: CtaStyle) => p.show === false,
            },
            tint: { type: ControlType.Color, title: "Tint", defaultValue: "#A88BFF", hidden: (p: CtaStyle) => p.show === false },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "#FFFFFF", hidden: (p: CtaStyle) => p.show === false },
            hoverFill: {
                type: ControlType.Color,
                title: "Hover Fill",
                defaultValue: "rgba(255, 255, 255, 0.86)",
                hidden: (p: CtaStyle) => p.show === false,
            },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#140F2B", hidden: (p: CtaStyle) => p.show === false },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "999px", hidden: (p: CtaStyle) => p.show === false },
            padding: { type: ControlType.Padding, title: "Padding", defaultValue: "13px 22px 13px 22px", hidden: (p: CtaStyle) => p.show === false },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.2em" },
    },
    links: {
        type: ControlType.Object,
        title: "Link Style",
        controls: {
            text: { type: ControlType.Color, title: "Text", defaultValue: "rgba(255, 255, 255, 0.72)" },
            hoverText: { type: ControlType.Color, title: "Hover Text", defaultValue: "#FFFFFF" },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["center", "end"],
                optionTitles: ["Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: "center",
            },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: 4, min: 0, max: 60, step: 1, unit: "px" },
        },
    },
    gradient: {
        type: ControlType.Object,
        title: "Gradient",
        controls: {
            base: { type: ControlType.Color, title: "Base", defaultValue: "#120C2A" },
            color1: { type: ControlType.Color, title: "Color 1", defaultValue: "#6B4DFF" },
            color2: { type: ControlType.Color, title: "Color 2", defaultValue: "#C04BFF" },
            color3: { type: ControlType.Color, title: "Color 3", defaultValue: "#3D7BFF" },
            color4: { type: ControlType.Color, title: "Color 4", defaultValue: "#FF6BB0" },
            shift: {
                type: ControlType.Number,
                title: "Hover Shift",
                defaultValue: 80,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "How far the gradient moves toward the hovered link's tint.",
            },
            glow: { type: ControlType.Boolean, title: "Hover Glow", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
            ease: { type: ControlType.Number, title: "Transition", defaultValue: 1.2, min: 0.1, max: 3, step: 0.05, unit: "s" },
            drift: {
                type: ControlType.Number,
                title: "Flow",
                defaultValue: 35,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "Speed of the liquid. 0 % holds it still.",
            },
            scale: { type: ControlType.Number, title: "Scale", defaultValue: 100, min: 30, max: 300, step: 5, unit: "%" },
            mouse: { type: ControlType.Number, title: "Mouse Swirl", defaultValue: 35, min: 0, max: 100, step: 1, unit: "%" },
        },
    },
    bar: {
        type: ControlType.Object,
        title: "Bar",
        controls: {
            padding: { type: ControlType.Padding, title: "Padding", defaultValue: "12px 12px 12px 28px" },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "999px" },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: { borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255, 255, 255, 0.1)" },
            },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEFAULT_SHADOW },
        },
    },
    mobile: {
        type: ControlType.Object,
        title: "Mobile",
        controls: {
            collapse: {
                type: ControlType.Number,
                title: "Collapse Below",
                defaultValue: 720,
                min: 0,
                max: 2000,
                step: 10,
                unit: "px",
                description: "Narrower bars show a menu button instead of the links.",
            },
            icon: { type: ControlType.Color, title: "Icon", defaultValue: "#FFFFFF" },
            radius: {
                type: ControlType.Number,
                title: "Menu Radius",
                defaultValue: 32,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                description: "Corner radius while the menu is open.",
            },
        },
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
