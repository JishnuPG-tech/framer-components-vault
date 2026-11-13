// Water Ripple Button – a pill CTA whose fill is a live water surface.
// The pointer leaves a trail of ripples, a click drops a splash, light rain keeps it alive at rest.
// Height field simulated on the CPU (tiny grid, ~3 CSS px per cell), drawn with one WebGL fragment shader.
// © Matthias Ölschlegel
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


const CREDIT = "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"

// ─── Looks ────────────────────────────────────────────────────────────────────
type Look = { key: string; title: string; deep: string; surface: string; bands: string; light: string; text: string }
const LOOKS: Look[] = [
    { key: "lagoon", title: "Lagoon", deep: "#032F38", surface: "#14797F", bands: "#9FF2EA", light: "#E9FFFC", text: "#FFFFFF" },
    { key: "ocean", title: "Ocean", deep: "#040F2A", surface: "#1A47A0", bands: "#8DBBFF", light: "#EAF3FF", text: "#FFFFFF" },
    { key: "ink", title: "Ink", deep: "#06080B", surface: "#232A33", bands: "#7E8A99", light: "#F2F6FA", text: "#FFFFFF" },
    { key: "lilac", title: "Lilac", deep: "#1C0D3E", surface: "#6C43C8", bands: "#D9C6FF", light: "#FBF7FF", text: "#FFFFFF" },
    { key: "glacier", title: "Glacier", deep: "#8EC3DA", surface: "#E3F3FA", bands: "#5E9CB8", light: "#FFFFFF", text: "#0B2A3A" },
]
const LOOK_BY_KEY: Record<string, Look> = Object.fromEntries(LOOKS.map((l) => [l.key, l]))

// ─── Props ────────────────────────────────────────────────────────────────────
type ColorsProps = { custom?: boolean; deep?: string; surface?: string; bands?: string; light?: string }
type EffectProps = { size?: number; strength?: number; duration?: number; trail?: number; splash?: number; rain?: number; flow?: number; gloss?: number; swell?: number }
type TextProps = { font?: React.CSSProperties; colorAuto?: boolean; color?: string; textCase?: "none" | "upper" }
type IconProps = { kind?: "none" | "arrow" | "arrowUpRight"; size?: number; gap?: number }
type BorderProps = { width?: number; color?: string }
type HoverProps = { glow?: number; press?: number; focus?: string }
type Props = {
    title?: string
    link?: string
    newTab?: boolean
    look?: string
    colors?: ColorsProps
    effect?: EffectProps
    text?: TextProps
    icon?: IconProps
    border?: BorderProps
    padding?: string
    radius?: string
    shadow?: string
    hover?: HoverProps
    onClick?: (e: React.MouseEvent) => void
    label?: string
    style?: React.CSSProperties
}

const DEF = {
    title: "Get Started",
    padding: "22px 46px 22px 46px",
    radius: "999px",
    shadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.16), 0px 16px 36px -14px rgba(3, 30, 36, 0.6)",
    fontSize: 17,
}

type Palette = { deep: string; surface: string; bands: string; light: string; text: string }
function palette(p: Props): Palette {
    const base = LOOK_BY_KEY[p.look ?? "lagoon"] ?? LOOKS[0]
    const c = p.colors ?? {}
    const pal = c.custom
        ? { deep: c.deep ?? base.deep, surface: c.surface ?? base.surface, bands: c.bands ?? base.bands, light: c.light ?? base.light, text: base.text }
        : { ...base }
    const t = p.text ?? {}
    if (t.colorAuto === false && t.color) pal.text = t.color
    else if (c.custom) pal.text = luminance(parseColor(pal.surface)) > 0.55 ? "#0B1A22" : "#FFFFFF"
    return pal
}

// ─── Colour parsing (no DOM, works in SSR) ───────────────────────────────────
type RGB = [number, number, number]
function parseColor(input: string | undefined): RGB {
    const s = (input ?? "").trim().toLowerCase()
    let m = s.match(/^#([0-9a-f]{3,8})$/)
    if (m) {
        let h = m[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((ch) => ch + ch).join("")
        const n = parseInt(h.slice(0, 6), 16)
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }
    m = s.match(/^rgba?\(([^)]+)\)$/)
    if (m) {
        const parts = m[1].split(/[\s,\/]+/).filter(Boolean)
        const v = parts.slice(0, 3).map((x) => (x.endsWith("%") ? parseFloat(x) * 2.55 : parseFloat(x)) / 255)
        if (v.every((x) => isFinite(x))) return [v[0], v[1], v[2]]
    }
    m = s.match(/^hsla?\(([^)]+)\)$/)
    if (m) {
        const [hh, ss, ll] = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat)
        const h = (((hh % 360) + 360) % 360) / 360, sat = ss / 100, l = ll / 100
        const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p = 2 * l - q
        const f = (t: number) => {
            t = (t + 1) % 1
            return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
        }
        return [f(h + 1 / 3), f(h), f(h - 1 / 3)]
    }
    return [0.5, 0.5, 0.5]
}
const luminance = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

// ─── Water simulation ─────────────────────────────────────────────────────────
const CELL = 3 // CSS px per cell

class Water {
    cols = 0
    rows = 0
    prev = new Float32Array(0)
    cur = new Float32Array(0)
    tex = new Uint8Array(0)
    energy = 0

    resize(w: number, h: number) {
        const cols = Math.max(8, Math.round(w / CELL))
        const rows = Math.max(4, Math.round(h / CELL))
        if (cols === this.cols && rows === this.rows) return
        this.cols = cols
        this.rows = rows
        this.prev = new Float32Array(cols * rows)
        this.cur = new Float32Array(cols * rows)
        this.tex = new Uint8Array(cols * rows * 4)
        this.energy = 0
    }

    /** Add a soft bump at (x, y) in CSS px. Negative amp pushes the surface down. */
    drop(x: number, y: number, radiusCells: number, amp: number) {
        const { cols, rows, cur } = this
        const cx = x / CELL, cy = y / CELL
        const r = Math.max(0.8, radiusCells)
        const reach = Math.ceil(r * 2.2)
        const x0 = Math.max(0, Math.floor(cx - reach)), x1 = Math.min(cols - 1, Math.ceil(cx + reach))
        const y0 = Math.max(0, Math.floor(cy - reach)), y1 = Math.min(rows - 1, Math.ceil(cy + reach))
        const inv = 1 / (r * r)
        for (let j = y0; j <= y1; j++) {
            for (let i = x0; i <= x1; i++) {
                const dx = i + 0.5 - cx, dy = j + 0.5 - cy
                const d2 = (dx * dx + dy * dy) * inv
                if (d2 < 5) cur[j * cols + i] += amp * Math.exp(-d2)
            }
        }
        this.energy = Math.max(this.energy, Math.abs(amp))
    }

    step(damp: number) {
        const { cols, rows, prev, cur } = this
        let peak = 0
        for (let j = 0; j < rows; j++) {
            const up = (j > 0 ? j - 1 : j) * cols, dn = (j < rows - 1 ? j + 1 : j) * cols, row = j * cols
            for (let i = 0; i < cols; i++) {
                const l = i > 0 ? i - 1 : i, r = i < cols - 1 ? i + 1 : i
                let v = (cur[row + l] + cur[row + r] + cur[up + i] + cur[dn + i]) * 0.5 - prev[row + i]
                v *= damp
                prev[row + i] = v
                const a = v < 0 ? -v : v
                if (a > peak) peak = a
            }
        }
        this.prev = cur
        this.cur = prev
        this.energy = peak
    }

    /** Pack slope x, slope y and height into RGBA8 (row 0 = top). */
    pack() {
        const { cols, rows, cur, tex } = this
        for (let j = 0; j < rows; j++) {
            const up = (j > 0 ? j - 1 : j) * cols, dn = (j < rows - 1 ? j + 1 : j) * cols, row = j * cols
            for (let i = 0; i < cols; i++) {
                const l = i > 0 ? i - 1 : i, r = i < cols - 1 ? i + 1 : i
                const gx = (cur[row + r] - cur[row + l]) * 0.5
                const gy = (cur[dn + i] - cur[up + i]) * 0.5
                const o = (row + i) * 4
                tex[o] = clamp(gx * 1.6 * 127.5 + 127.5, 0, 255)
                tex[o + 1] = clamp(gy * 1.6 * 127.5 + 127.5, 0, 255)
                tex[o + 2] = clamp(cur[row + i] * 0.6 * 127.5 + 127.5, 0, 255)
                tex[o + 3] = 255
            }
        }
        return tex
    }

    clear() {
        this.prev.fill(0)
        this.cur.fill(0)
        this.energy = 0
    }
}

// ─── WebGL renderer ───────────────────────────────────────────────────────────
const VS = `attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); gl_Position = vec4(aPos, 0.0, 1.0); }`

const FS = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uH;
uniform vec2 uSize;      // CSS px
uniform float uTime;
uniform float uRefract;
uniform float uHover;
uniform float uGloss;
uniform float uRadius;
uniform vec3 uPointer;   // x, y in CSS px, z = presence
uniform vec3 uDeep, uSurface, uBands, uLight;
uniform float uLightBg;  // 1 on light looks: bands darken instead of glow
float lines(vec2 q, float t){
  float w = q.y * 4.2 + sin(q.x * 1.9 + t * 0.5) * 0.38 + sin(q.x * 4.7 - t * 0.7 + q.y * 2.0) * 0.12;
  float b = smoothstep(0.80, 1.0, 0.5 + 0.5 * sin(w * 6.2831));
  return b * (0.35 + 0.65 * smoothstep(-0.3, 0.9, sin(q.x * 3.3 - t * 0.4 + floor(w) * 1.7)));
}
float caustic(vec2 q, float t){
  vec2 p = q * vec2(7.0, 9.0);
  float a = sin(p.x + t * 0.6 + sin(p.y * 0.9 - t * 0.45) * 1.4) * sin(p.y - t * 0.35 + sin(p.x * 0.6 + t * 0.3));
  vec2 p2 = q * vec2(12.0, 14.0) + vec2(t * 0.2, -t * 0.15);
  float b = sin(p2.x + sin(p2.y * 0.8 + t) * 1.2) * sin(p2.y + sin(p2.x * 0.7 - t * 0.8));
  return pow(max(a, 0.0), 4.0) * 0.8 + pow(max(b, 0.0), 6.0) * 0.6;
}
void main(){
  vec4 s = texture2D(uH, vUv);
  vec2 g = (s.rg - 0.5) * 2.0;
  float h = (s.b - 0.5) * 2.0;
  vec3 n = normalize(vec3(-g * uRefract, 1.0));
  float aspect = uSize.x / max(uSize.y, 1.0);
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  vec2 px = vUv * uSize;
  vec2 d = (px - uPointer.xy) / max(uSize.y, 1.0);
  float spot = exp(-dot(d, d) * 2.2) * uPointer.z;
  vec2 off = n.xy * 0.11;
  float disp = 1.0 + length(g) * 4.0;
  vec3 L3 = vec3(lines(p + off * (1.0 + 0.07 * disp), uTime), lines(p + off, uTime), lines(p + off * (1.0 - 0.07 * disp), uTime));
  float c = caustic(p + off, uTime);
  float depth = 1.0 - vUv.y;
  vec3 col = mix(uDeep, uSurface, 0.22 + 0.62 * depth);
  float boost = 0.8 + 0.6 * uHover + 1.9 * spot;
  vec3 glow = (uBands * L3 * 0.15 + uBands * c * 0.12 * (1.0 + 3.0 * spot)) * boost;
  col = mix(col + glow, mix(col, uBands, L3.g * 0.35 + c * 0.2), uLightBg);
  vec3 Ld = normalize(vec3(-0.35, -0.65, 0.7));
  col *= 0.84 + 0.34 * dot(n, Ld);
  vec3 H = normalize(Ld + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 90.0);
  vec3 Hp = normalize(normalize(vec3(-d * 1.5, 0.6)) + vec3(0.0, 0.0, 1.0));
  float specP = pow(max(dot(n, Hp), 0.0), 60.0) * uPointer.z;
  col += uLight * (spec * (1.1 + 0.6 * uHover) + specP * 1.0) * uGloss;
  col += uLight * clamp(h, -1.0, 1.0) * 0.08 * (1.0 - uLightBg);
  col += uLight * (uHover * 0.03 + spot * 0.07);
  float r = min(uRadius, uSize.y * 0.5);
  vec2 q = abs(px - uSize * 0.5) - (uSize * 0.5 - r);
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float rim = exp(sd / (uSize.y * 0.07));
  col += uLight * rim * (0.08 + 0.2 * smoothstep(0.7, 0.0, vUv.y)) * (1.0 - 0.5 * uLightBg);
  float sx = (vUv.x - (fract(uTime * 0.06) * 1.8 - 0.4)) - (vUv.y - 0.5) * 0.25;
  col += uLight * exp(-sx * sx * 220.0) * 0.05 * (1.0 - uLightBg);
  col = mix(col, vec3(1.0) - exp(-col * 1.6) * 0.82, smoothstep(0.75, 1.4, max(col.r, max(col.g, col.b))));
  gl_FragColor = vec4(col, 1.0);
}`

type GLState = {
    gl: WebGLRenderingContext
    prog: WebGLProgram
    tex: WebGLTexture
    u: Record<string, WebGLUniformLocation | null>
    texW: number
    texH: number
}

function createGL(canvas: HTMLCanvasElement): GLState | null {
    let gl: WebGLRenderingContext | null = null
    try {
        gl = (canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" }) ||
            canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    } catch {
        gl = null
    }
    if (!gl) return null
    const sh = (type: number, src: string) => {
        const s = gl!.createShader(type)!
        gl!.shaderSource(s, src)
        gl!.compileShader(s)
        if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS) && !gl!.isContextLost()) {
            console.warn("[Water Ripple Button] shader:", gl!.getShaderInfoLog(s))
            return null
        }
        return s
    }
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS)
    if (!vs || !fs) return null
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.bindAttribLocation(prog, 0, "aPos")
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) return null
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    const u: Record<string, WebGLUniformLocation | null> = {}
    for (const name of ["uH", "uSize", "uTime", "uRefract", "uHover", "uGloss", "uDeep", "uSurface", "uBands", "uLight", "uLightBg", "uRadius", "uPointer"])
        u[name] = gl.getUniformLocation(prog, name)
    gl.uniform1i(u.uH, 0)
    return { gl, prog, tex, u, texW: 0, texH: 0 }
}

type PaintOpts = { w: number; h: number; time: number; hover: number; radius: number; pointer: [number, number, number] }
function paintWater(st: GLState, canvas: HTMLCanvasElement, water: Water, P: Palette, E: EffectProps, o: PaintOpts) {
    if (st.gl.isContextLost()) return
    const { gl, u } = st
    gl.viewport(0, 0, canvas.width, canvas.height)
    const data = water.pack()
    gl.bindTexture(gl.TEXTURE_2D, st.tex)
    if (st.texW !== water.cols || st.texH !== water.rows) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, water.cols, water.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
        st.texW = water.cols
        st.texH = water.rows
    } else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, water.cols, water.rows, gl.RGBA, gl.UNSIGNED_BYTE, data)
    const surf = parseColor(P.surface)
    gl.uniform2f(u.uSize, o.w, o.h)
    gl.uniform1f(u.uTime, o.time)
    gl.uniform1f(u.uRefract, 0.8 + (E.strength ?? 50) / 80)
    gl.uniform1f(u.uHover, o.hover)
    gl.uniform1f(u.uGloss, (E.gloss ?? 60) / 60)
    gl.uniform3fv(u.uDeep, parseColor(P.deep))
    gl.uniform3fv(u.uSurface, surf)
    gl.uniform3fv(u.uBands, parseColor(P.bands))
    gl.uniform3fv(u.uLight, parseColor(P.light))
    gl.uniform1f(u.uLightBg, luminance(surf) > 0.55 ? 1 : 0)
    gl.uniform1f(u.uRadius, o.radius)
    gl.uniform3f(u.uPointer, o.pointer[0], o.pointer[1], o.pointer[2])
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

/** One frame of the real shader with a fixed, gentle surface: the canvas (static renderer) shows what the live button looks like. */
function renderStill(w: number, h: number, P: Palette, E: EffectProps, radius: number): string | null {
    if (typeof document === "undefined") return null
    const canvas = document.createElement("canvas")
    const dpr = 2
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const st = createGL(canvas)
    if (!st) return null
    try {
        const water = new Water()
        water.resize(w, h)
        let seed = 7
        const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
        const rain = (E.rain ?? 15) / 100
        for (let k = 0; k < 3 + Math.round(rain * 8); k++) water.drop(rnd() * w, rnd() * h, 1.4 + rnd(), (rnd() < 0.5 ? -1 : 1) * 0.35)
        for (let k = 0; k < 14; k++) water.step(0.975)
        water.drop(w * 0.74, h * 0.55, 3.5, -0.45 * ((E.strength ?? 50) / 50))
        for (let k = 0; k < 10; k++) water.step(0.975)
        paintWater(st, canvas, water, P, E, { w, h, time: 3.2, hover: 0, radius, pointer: [0, 0, 0] })
        return canvas.toDataURL("image/png")
    } catch {
        return null
    } finally {
        st.gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
}

// ─── Shared bits ──────────────────────────────────────────────────────────────
function Arrow({ kind, size }: { kind: "arrow" | "arrowUpRight"; size: number }) {
    const d = kind === "arrow" ? "M3 8h10M9 4l4 4-4 4" : "M4.5 11.5l7-7M5.5 4.5h6v6"
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
            <path d={d} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function staticBackground(pal: Palette) {
    const lightBg = luminance(parseColor(pal.surface)) > 0.55
    const rgba = (c: string, a: number) => {
        const [r, g, b] = parseColor(c)
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
    }
    return [
        `radial-gradient(120% 90% at 30% 0%, ${rgba(pal.light, 0.12)} 0%, transparent 55%)`,
        `repeating-linear-gradient(176deg, transparent 0px, transparent 7px, ${rgba(pal.bands, lightBg ? 0.25 : 0.22)} 8.5px, transparent 10px)`,
        `linear-gradient(180deg, ${pal.surface} 0%, ${pal.deep} 100%)`,
    ].join(", ")
}

type Shell = {
    props: Props
    pal: Palette
    uid: string
    rootRef?: React.Ref<HTMLElement>
    pressed?: boolean
    events?: Record<string, unknown>
    children?: React.ReactNode
    labelRef?: React.Ref<HTMLSpanElement>
    background?: string
}

function renderShell({ props, pal, uid, rootRef, pressed, events, children, background, labelRef }: Shell) {
    const { title = DEF.title, link, newTab, text = {}, icon = {}, border = {}, hover = {}, padding = DEF.padding, radius = DEF.radius, shadow = DEF.shadow, label, style } = props
    const font = text.font ?? {}
    const hasLink = typeof link === "string" && link.trim() !== ""
    const iconKind = icon.kind ?? "none"
    const iconSize = icon.size ?? 16
    const pressScale = (hover.press ?? 97) / 100
    const bw = border.width ?? 1
    const focus = hover.focus ?? "#4D8DFF"
    const Tag = (hasLink ? "a" : "button") as "a"
    const linkAttrs = hasLink
        ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined }
        : { type: "button" as const }
    const content = (
        <>
            <style>{`.${uid}:focus-visible{outline:2px solid ${focus};outline-offset:3px}.${uid}{-webkit-tap-highlight-color:transparent}`}</style>
            {children}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    pointerEvents: "none",
                    zIndex: 1,
                    boxShadow: [
                        bw > 0 ? `inset 0 0 0 ${bw}px ${border.color ?? "rgba(255, 255, 255, 0.12)"}` : "",
                        "inset 0 1px 0 rgba(255, 255, 255, 0.34)",
                        "inset 0 -1px 0 rgba(0, 0, 0, 0.25)",
                        "inset 0 -14px 22px -14px rgba(0, 0, 0, 0.55)",
                    ]
                        .filter(Boolean)
                        .join(", "),
                }}
            />
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    pointerEvents: "none",
                    zIndex: 1,
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.06) 42%, rgba(255, 255, 255, 0) 52%)",
                    mixBlendMode: "screen",
                }}
            />
            <span
                ref={labelRef}
                style={{
                    position: "relative",
                    zIndex: 2,
                    willChange: "transform",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: icon.gap ?? 10,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    color: pal.text,
                    fontSize: DEF.fontSize,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                    ...font,
                    textTransform: (text.textCase ?? "none") === "upper" ? "uppercase" : "none",
                    textShadow: luminance(parseColor(pal.text)) > 0.5 ? "0 1px 1px rgba(0, 0, 0, 0.22)" : "0 1px 0 rgba(255, 255, 255, 0.5)",
                }}
            >
                {title}
                {iconKind !== "none" && <Arrow kind={iconKind} size={iconSize} />}
            </span>
        </>
    )
    return (
        <Tag
            ref={rootRef as React.Ref<HTMLAnchorElement>}
            className={uid}
            aria-label={label || undefined}
            onClick={props.onClick}
            {...linkAttrs}
            {...(events as object)}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                padding,
                borderRadius: radius,
                overflow: "hidden",
                isolation: "isolate",
                border: "none",
                margin: 0,
                font: "inherit",
                textDecoration: "none",
                cursor: "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "manipulation",
                background: background ?? pal.deep,
                boxShadow: (Array.isArray(shadow) ? (shadow as string[]).join(", ") : shadow) || undefined,
                transform: pressed ? `scale(${pressScale})` : "scale(1)",
                transition: "transform 0.28s cubic-bezier(0.3, 1.4, 0.5, 1)",
                ...style,
            }}
        >
            {content}
        </Tag>
    )
}

function useUid() {
    const id = (React as unknown as { useId?: () => string }).useId?.() ?? "x"
    return "lrb-" + id.replace(/[^a-zA-Z0-9_-]/g, "")
}

// ─── Static (canvas, thumbnails, no WebGL) ───────────────────────────────────
function StaticButton(props: Props) {
    const pal = palette(props)
    const uid = useUid()
    const rootRef = React.useRef<HTMLElement>(null)
    const [still, setStill] = React.useState<string | null>(null)
    const key = JSON.stringify([pal, props.effect ?? {}, props.radius ?? DEF.radius])
    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return
        let timer = 0, lastW = 0, lastH = 0
        const run = () => {
            const w = root.offsetWidth, h = root.offsetHeight
            if (w < 2 || h < 2 || (w === lastW && h === lastH)) return
            lastW = w
            lastH = h
            setStill(renderStill(w, h, pal, props.effect ?? {}, parseFloat(String(props.radius ?? DEF.radius)) || 999))
        }
        const schedule = () => {
            clearTimeout(timer)
            timer = window.setTimeout(run, 60)
        }
        schedule()
        const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null
        ro?.observe(root)
        return () => {
            clearTimeout(timer)
            ro?.disconnect()
        }
    }, [key])
    return renderShell({
        props,
        pal,
        uid,
        rootRef,
        background: still ? `url("${still}") center / 100% 100% no-repeat, ${pal.deep}` : staticBackground(pal),
    })
}

// ─── Live ─────────────────────────────────────────────────────────────────────
function LiveButton(props: Props) {
    const pal = palette(props)
    const uid = useUid()
    const rootRef = React.useRef<HTMLElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [fallback, setFallback] = React.useState(false)
    const [ready, setReady] = React.useState(false)
    const [pressed, setPressed] = React.useState(false)

    // everything the loop reads lives in a ref, so prop changes never restart WebGL
    const live = React.useRef({
        pal,
        effect: props.effect ?? {},
        glow: (props.hover?.glow ?? 60) / 100,
        kick: () => {},
        pointer: { inside: false, x: 0, y: 0, lastX: 0, lastY: 0, lastT: 0, has: false },
        hoverTarget: 0,
        radius: props.radius ?? DEF.radius,
    })
    live.current.radius = props.radius ?? DEF.radius
    const labelEl = React.useRef<HTMLSpanElement>(null)
    live.current.pal = pal
    live.current.effect = props.effect ?? {}
    live.current.glow = (props.hover?.glow ?? 60) / 100

    React.useEffect(() => {
        live.current.kick()
    }, [pal.deep, pal.surface, pal.bands, pal.light, JSON.stringify(props.effect ?? {}), props.hover?.glow])

    React.useEffect(() => {
        const canvas = canvasRef.current, root = rootRef.current
        if (!canvas || !root) return
        let st = createGL(canvas)
        if (!st) {
            setFallback(true)
            return
        }
        setReady(true)
        const water = new Water()
        const L = live.current
        const reduce = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
        let w = 0, h = 0, dpr = 1
        let raf = 0, running = false, visible = true, last = 0, acc = 0, time = 0, hover = 0, rainClock = 0, idleFrames = 0, pres = 0, swellClock = 1.2, floatY = 0
        const pending: { t: number; x: number; y: number; r: number; a: number }[] = []
        const radiusPx = () => parseFloat(String(L.radius)) || 999
        let disposed = false

        const resize = () => {
            const r = root.getBoundingClientRect()
            const nw = root.offsetWidth || r.width, nh = root.offsetHeight || r.height
            if (nw < 1 || nh < 1) return
            dpr = Math.min(2, window.devicePixelRatio || 1)
            w = nw
            h = nh
            canvas.width = Math.max(1, Math.round(w * dpr))
            canvas.height = Math.max(1, Math.round(h * dpr))
            water.resize(w, h)
            draw()
            kick()
        }

        const draw = () => {
            if (!st) return
            paintWater(st, canvas, water, L.pal, L.effect, { w, h, time, hover: hover * L.glow, radius: radiusPx(), pointer: [L.pointer.lastX, L.pointer.lastY, pres] })
        }

        const frame = (now: number) => {
            raf = 0
            if (disposed || !visible) {
                running = false
                return
            }
            const dt = clamp((now - (last || now)) / 1000, 0, 1 / 20)
            last = now
            const E = L.effect
            const still = !!reduce?.matches
            const flow = still ? 0 : (E.flow ?? 30) / 40
            time += dt * flow
            hover += (L.hoverTarget - hover) * Math.min(1, dt * 10)
            pres += (L.hoverTarget - pres) * Math.min(1, dt * 6)
            for (let k = pending.length - 1; k >= 0; k--) {
                pending[k].t -= dt
                if (pending[k].t <= 0) {
                    const q = pending.splice(k, 1)[0]
                    water.drop(q.x, q.y, q.r, q.a)
                }
            }
            const swell = (E.swell ?? 50) / 100
            if (!still && swell > 0 && w > 0) {
                swellClock -= dt
                if (swellClock <= 0) {
                    swellClock = 2.6 + Math.random() * 2.4
                    // a wave front entering from one end and rolling across
                    const fromLeft = Math.random() < 0.5
                    const x = fromLeft ? -CELL * 3 : w + CELL * 3
                    for (let y = CELL; y < h; y += CELL) water.drop(x, y, 4.5, -0.4 * swell)
                }
            }
            if (!still) {
                const rain = (E.rain ?? 15) / 100
                if (rain > 0 && w > 0) {
                    rainClock -= dt
                    if (rainClock <= 0) {
                        rainClock = (0.25 + Math.random() * 0.9) / (rain * 2.2)
                        water.drop(Math.random() * w, Math.random() * h, 1.2 + Math.random() * 1.3, (Math.random() < 0.5 ? -1 : 1) * 0.3 * (0.5 + rain))
                    }
                }
                const damp = 0.955 + ((E.duration ?? 55) / 100) * 0.04
                acc += dt * 60
                let n = 0
                while (acc >= 1 && n < 4) {
                    water.step(damp)
                    acc -= 1
                    n++
                }
                if (n === 4) acc = 0
            }
            draw()
            // the label floats on the water at its centre
            const lab = labelEl.current
            if (lab && water.cols > 0) {
                const ci = Math.floor(water.cols / 2), cj = Math.floor(water.rows / 2)
                const hc = water.cur[cj * water.cols + ci] || 0
                const target = still ? 0 : clamp(-hc * 2.2, -2.5, 2.5)
                floatY += (target - floatY) * Math.min(1, dt * 8)
                lab.style.transform = Math.abs(floatY) < 0.02 ? "" : `translateY(${floatY.toFixed(2)}px)`
            }
            const settling = Math.abs(L.hoverTarget - hover) > 0.002 || Math.abs(L.hoverTarget - pres) > 0.002 || pending.length > 0 || Math.abs(floatY) > 0.02
            const alive = !still && ((E.rain ?? 15) > 0 || (E.swell ?? 50) > 0 || (E.flow ?? 30) > 0 || water.energy > 0.003)
            if (alive || settling) {
                idleFrames = 0
            } else if (++idleFrames > 2) {
                running = false
                last = 0
                return
            }
            raf = requestAnimationFrame(frame)
        }

        const kick = () => {
            if (disposed || running || !visible) {
                if (!running && !disposed) draw()
                return
            }
            running = true
            last = 0
            raf = requestAnimationFrame(frame)
        }
        L.kick = kick

        // pointer → ripples
        const local = (e: PointerEvent) => {
            const r = root.getBoundingClientRect()
            const sx = r.width / (w || r.width || 1), sy = r.height / (h || r.height || 1)
            return { x: (e.clientX - r.left) / (sx || 1), y: (e.clientY - r.top) / (sy || 1) }
        }
        const sizeCells = () => 1.3 + ((L.effect.size ?? 50) / 100) * 3
        const strength = () => ((L.effect.strength ?? 50) / 50)
        const onEnter = (e: PointerEvent) => {
            const p = local(e)
            L.pointer.inside = true
            L.pointer.lastX = p.x
            L.pointer.lastY = p.y
            L.pointer.lastT = performance.now()
            if (e.pointerType === "mouse") L.hoverTarget = 1
            kick()
        }
        const onMove = (e: PointerEvent) => {
            if (reduce?.matches) return
            const p = local(e)
            const P = L.pointer
            const now = performance.now()
            const dt = Math.max(1, now - P.lastT) / 1000
            const dx = p.x - P.lastX, dy = p.y - P.lastY
            const dist = Math.hypot(dx, dy)
            const speed = dist / dt
            const trail = (L.effect.trail ?? 60) / 100
            if (trail > 0 && dist > 0.5) {
                const amp = -0.75 * trail * strength() * Math.min(1, speed / 500)
                const steps = Math.max(1, Math.ceil(dist / (CELL * 1.5)))
                for (let k = 1; k <= steps; k++) water.drop(P.lastX + (dx * k) / steps, P.lastY + (dy * k) / steps, sizeCells() * 0.8, amp / Math.sqrt(steps))
                kick()
            }
            P.lastX = p.x
            P.lastY = p.y
            P.lastT = now
        }
        const onLeave = () => {
            L.pointer.inside = false
            L.hoverTarget = 0
            kick()
        }
        const onDown = (e: PointerEvent) => {
            const p = local(e)
            const splash = (L.effect.splash ?? 70) / 100
            if (!reduce?.matches && splash > 0) {
                water.drop(p.x, p.y, sizeCells() * 2, -3.2 * splash * strength())
                water.drop(p.x, p.y, sizeCells() * 0.7, 1.6 * splash * strength())
                pending.push({ t: 0.16, x: p.x, y: p.y, r: sizeCells() * 1.1, a: -1.6 * splash * strength() })
            }
            L.pointer.lastX = p.x
            L.pointer.lastY = p.y
            L.pointer.lastT = performance.now()
            kick()
        }
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === "Enter" || e.key === " ") && !reduce?.matches && w > 0) {
                const splash = (L.effect.splash ?? 70) / 100
                water.drop(w / 2, h / 2, sizeCells() * 2, -1.4 * splash * strength())
                kick()
            }
        }
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("keydown", onKey)

        // only run while on screen and the tab is visible
        let onScreen = true
        const io =
            typeof IntersectionObserver === "function"
                ? new IntersectionObserver((entries) => {
                      onScreen = entries[entries.length - 1].isIntersecting
                      sync()
                  })
                : null
        io?.observe(root)
        const sync = () => {
            const was = visible
            visible = onScreen && !document.hidden
            if (visible && !was) kick()
        }
        document.addEventListener("visibilitychange", sync)
        const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null
        ro?.observe(root)
        const onReduce = () => {
            if (reduce?.matches) water.clear()
            kick()
        }
        reduce?.addEventListener?.("change", onReduce)

        const onLost = (e: Event) => {
            e.preventDefault()
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            running = false
        }
        const onRestored = () => {
            st = createGL(canvas)
            if (!st) setFallback(true)
            else draw(), kick()
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        resize()
        kick()

        return () => {
            disposed = true
            if (raf) cancelAnimationFrame(raf)
            L.kick = () => {}
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("keydown", onKey)
            io?.disconnect()
            ro?.disconnect()
            document.removeEventListener("visibilitychange", sync)
            reduce?.removeEventListener?.("change", onReduce)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            st?.gl.getExtension("WEBGL_lose_context")?.loseContext()
            st = null
        }
    }, [])

    const events = {
        onPointerDown: () => setPressed(true),
        onPointerUp: () => setPressed(false),
        onPointerLeave: () => setPressed(false),
        onPointerCancel: () => setPressed(false),
    }

    return renderShell({
        props,
        pal,
        uid,
        rootRef,
        pressed,
        events,
        labelRef: labelEl,
        // CSS water shows until the first WebGL frame (and stays if WebGL is missing)
        background: staticBackground(pal),
        children: !fallback && (
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none", zIndex: 0, opacity: ready ? 1 : 0 }}
            />
        ),
    })
}

/**
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-auto
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 66
 * @framerDisableUnlink
 */
export default function WaterRippleButton(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticButton {...props} />
    return <LiveButton {...props} />
}

WaterRippleButton.displayName = "Water Ripple Button"

const isCustom = (c: ColorsProps) => c.custom !== true
const noIcon = (i: IconProps) => (i.kind ?? "none") === "none"

addPropertyControls(WaterRippleButton, {
    title: { type: ControlType.String, title: "Title", defaultValue: DEF.title },
    link: { type: ControlType.Link, title: "Link", defaultValue: "" },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    look: {
        type: ControlType.Enum,
        title: "Look",
        options: LOOKS.map((l) => l.key),
        optionTitles: LOOKS.map((l) => l.title),
        defaultValue: "lagoon",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            custom: { type: ControlType.Boolean, title: "Mode", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Look" },
            deep: { type: ControlType.Color, title: "Deep", defaultValue: LOOKS[0].deep, hidden: isCustom },
            surface: { type: ControlType.Color, title: "Surface", defaultValue: LOOKS[0].surface, hidden: isCustom },
            bands: { type: ControlType.Color, title: "Lines", defaultValue: LOOKS[0].bands, hidden: isCustom },
            light: { type: ControlType.Color, title: "Highlight", defaultValue: LOOKS[0].light, hidden: isCustom, description: "Light surfaces draw the lines darker instead of brighter." },
        },
    },
    effect: {
        type: ControlType.Object,
        title: "Water",
        controls: {
            trail: { type: ControlType.Number, title: "Trail", defaultValue: 60, min: 0, max: 100, step: 1, unit: "%", description: "Ripples behind the moving pointer." },
            splash: { type: ControlType.Number, title: "Splash", defaultValue: 70, min: 0, max: 100, step: 1, unit: "%", description: "The drop on press or Enter." },
            size: { type: ControlType.Number, title: "Ripple Size", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
            strength: { type: ControlType.Number, title: "Strength", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
            duration: { type: ControlType.Number, title: "Duration", defaultValue: 55, min: 0, max: 100, step: 1, unit: "%", description: "How long rings keep spreading." },
            rain: { type: ControlType.Number, title: "Rain", defaultValue: 15, min: 0, max: 100, step: 1, unit: "%", description: "Small drops at rest. 0 = calm." },
            swell: { type: ControlType.Number, title: "Swell", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%", description: "A wave rolls across every few seconds. 0 = off." },
            flow: { type: ControlType.Number, title: "Flow", defaultValue: 30, min: 0, max: 100, step: 1, unit: "%", description: "Drift of the water lines. 0 = still." },
            gloss: { type: ControlType.Number, title: "Gloss", defaultValue: 60, min: 0, max: 100, step: 1, unit: "%" },
        },
    },
    text: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: DEF.fontSize, variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.2em" },
            },
            textCase: {
                type: ControlType.Enum,
                title: "Case",
                options: ["none", "upper"],
                optionTitles: ["As Typed", "Uppercase"],
                displaySegmentedControl: true,
                defaultValue: "none",
            },
            colorAuto: { type: ControlType.Boolean, title: "Color", defaultValue: true, enabledTitle: "Auto", disabledTitle: "Custom", description: "Auto follows the look." },
            color: { type: ControlType.Color, title: " ", defaultValue: "#FFFFFF", hidden: (t: TextProps) => t.colorAuto !== false },
        },
    },
    icon: {
        type: ControlType.Object,
        title: "Icon",
        controls: {
            kind: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["none", "arrowUpRight", "arrow"],
                optionTitles: ["None", "Arrow Up Right", "Arrow"],
                defaultValue: "none",
            },
            size: { type: ControlType.Number, title: "Size", defaultValue: 16, min: 8, max: 40, step: 1, unit: "px", hidden: noIcon },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: 10, min: 0, max: 40, step: 1, unit: "px", hidden: noIcon },
        },
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            width: { type: ControlType.Number, title: "Width", defaultValue: 1, min: 0, max: 8, step: 0.5, unit: "px" },
            color: { type: ControlType.Color, title: "Color", defaultValue: "rgba(255, 255, 255, 0.12)", hidden: (b: BorderProps) => b.width === 0 },
        },
    },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: DEF.padding },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: DEF.radius },
    shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEF.shadow },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            glow: { type: ControlType.Number, title: "Glow", defaultValue: 60, min: 0, max: 100, step: 1, unit: "%", description: "Lines and highlights brighten on hover." },
            press: { type: ControlType.Number, title: "Press Scale", defaultValue: 97, min: 85, max: 100, step: 1, unit: "%" },
            focus: { type: ControlType.Color, title: "Focus Ring", defaultValue: "#4D8DFF" },
        },
    },
    onClick: { type: ControlType.EventHandler },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "Accessible name (optional)",
        description: CREDIT,
    },
})
