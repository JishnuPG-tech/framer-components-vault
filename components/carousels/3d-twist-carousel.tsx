/*
 * Cincture — a twisting band of curved cards on a tilted ring.
 *
 * Marketplace compliance:
 * 1. Static renderer check: the exported entry calls useIsStaticRenderer()
 *    first and returns <StaticView/> on the canvas / during export. That branch
 *    is plain divs only — no WebGL, no motion, no transitions, no filters,
 *    no listeners, observers, timers or animation frames.
 * 2. Offscreen loop: the live requestAnimationFrame loop starts locked out and
 *    only runs once an IntersectionObserver reports the band on screen, the tab
 *    is visible, and the permit is re-checked at the top of every frame. Leaving
 *    the viewport parks the loop and clears drag / momentum. With auto-rotate
 *    off the loop sleeps once the band settles and wakes on drag, wheel over the
 *    band or content changes. prefers-reduced-motion disables auto-rotate and
 *    wheel spin.
 * 3. Media sources: images and videos come only from Framer upload controls
 *    and are filtered through a Framer-host allowlist (see MEDIA_HOSTS);
 *    there are no free-text remote URL inputs. Everything is cancelled on unmount.
 */
import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Card = {
    type?: "Image" | "Video"
    image?: { src?: string; alt?: string }
    video?: string
    alt?: string
    link?: string
}

/*
 * Media sources: cards only take Framer-managed uploads (ResponsiveImage and
 * File controls). There is no free-text URL input, and every source is checked
 * against an allowlist of Framer asset hosts before it is requested, so no
 * value can make the component fetch from an arbitrary domain. Cards without
 * an upload render a generated sample tile drawn locally — nothing remote.
 */
const MEDIA_HOSTS = [
    "framerusercontent.com",
    "framer.com",
    "framer.website",
    "framer.app",
]
function allowedSrc(raw?: string): string {
    const src = (raw || "").trim()
    if (!src) return ""
    if (src.startsWith("blob:") || src.startsWith("data:image/")) return src
    try {
        const base =
            typeof window !== "undefined"
                ? window.location.href
                : "https://framer.com/"
        const u = new URL(src, base)
        if (u.protocol !== "https:") return ""
        const h = u.hostname.toLowerCase()
        return MEDIA_HOSTS.some((d) => h === d || h.endsWith("." + d))
            ? u.href
            : ""
    } catch {
        return ""
    }
}

const DEFAULT_CARDS: Card[] = Array.from({ length: 8 }, () => ({
    type: "Image" as const,
    alt: "",
    link: "",
}))

/* Locally generated sample tiles for cards with no upload. */
const SAMPLE = [
    ["#2B48E8", "#8FB2FF"],
    ["#D9C6A8", "#F4E9D6"],
    ["#1D1F24", "#6E7380"],
    ["#EDEBE6", "#C9C5BC"],
    ["#0E1C4A", "#3F6BFF"],
    ["#B9A68C", "#E6DCCB"],
    ["#F2F2F0", "#BFC3CC"],
    ["#22262E", "#9AA4B5"],
]
function sampleCss(i: number) {
    const [a, b] = SAMPLE[i % SAMPLE.length]
    return `radial-gradient(circle at 62% 38%, ${b} 0%, ${b}00 46%), linear-gradient(160deg, ${b} 0%, ${a} 78%)`
}
function sampleCanvas(i: number) {
    const [a, b] = SAMPLE[i % SAMPLE.length]
    const w = 640
    const h = 680
    const cv = document.createElement("canvas")
    cv.width = w
    cv.height = h
    const ctx = cv.getContext("2d")
    if (!ctx) return cv
    const lin = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, h)
    lin.addColorStop(0, b)
    lin.addColorStop(0.78, a)
    ctx.fillStyle = lin
    ctx.fillRect(0, 0, w, h)
    const orb = ctx.createRadialGradient(
        w * 0.62,
        h * 0.38,
        0,
        w * 0.62,
        h * 0.38,
        w * 0.46
    )
    orb.addColorStop(0, b)
    orb.addColorStop(1, b + "00")
    ctx.fillStyle = orb
    ctx.fillRect(0, 0, w, h)
    return cv
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const DEG = Math.PI / 180

function cardsOf(props: any): Card[] {
    const list = props.cards
    return Array.isArray(list) && list.length ? list : DEFAULT_CARDS
}
function imageOf(c: Card) {
    return allowedSrc(c.image && c.image.src)
}
function videoOf(c: Card) {
    if (c.type !== "Video") return ""
    return allowedSrc(c.video)
}
function altOf(c: Card) {
    return c.alt || (c.image && c.image.alt) || ""
}

/* ------------------------------------------------------------------ */
/* Static view — plain divs only                                       */
/* ------------------------------------------------------------------ */

function StaticView(props: any) {
    const list = cardsOf(props)
    const band = props.band || {}
    const aspect = band.aspect ?? 1.05
    const radius = band.corner ?? 9
    const fill = props.placeholder || "#D9D9DB"
    const slots = [-2, -1, 0, 1, 2]
    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: props.background,
            }}
        >
            {props.surface?.shadow !== false && (
                <div
                    style={{
                        position: "absolute",
                        left: "15%",
                        right: "15%",
                        top: "68%",
                        height: "14%",
                        borderRadius: "50%",
                        background: `radial-gradient(ellipse at center, ${
                            props.surface?.shadowColor || "rgba(0,0,0,0.14)"
                        } 0%, rgba(0,0,0,0) 70%)`,
                    }}
                />
            )}
            {slots.map((s) => {
                const idx = ((s % list.length) + list.length) % list.length
                const c = list[idx]
                const img = imageOf(c)
                const vid = videoOf(c)
                const scale = 1 - Math.abs(s) * 0.14
                const w = 22 * scale
                const fit = {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover" as const,
                    display: "block",
                }
                return (
                    <div
                        key={s}
                        style={{
                            position: "absolute",
                            left: `${50 + s * 19 - w / 2}%`,
                            top: `${47 - Math.abs(s) * 3}%`,
                            width: `${w}%`,
                            aspectRatio: `1 / ${aspect}`,
                            transform: "translateY(-50%)",
                            borderRadius: `${radius}%`,
                            overflow: "hidden",
                            background: img || vid ? fill : sampleCss(idx),
                            zIndex: 10 - Math.abs(s),
                        }}
                    >
                        {vid ? (
                            <video
                                src={vid}
                                poster={img || undefined}
                                autoPlay={false}
                                preload="none"
                                muted
                                playsInline
                                style={fit}
                            />
                        ) : img ? (
                            <img src={img} alt={altOf(c)} style={fit} />
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* WebGL                                                               */
/* ------------------------------------------------------------------ */

const VS = `
attribute vec2 aUV;
uniform float uTheta0, uRot, uArcW, uH, uR;
uniform float uWAmp, uWPhase, uTAmp, uTPhase;
uniform float uCT, uST, uCR, uSR, uDist;
uniform mat4 uProj;
varying vec2 vUV;
varying vec3 vPos;
varying vec3 vNrm;
vec3 band(vec2 uv){
  float th = uTheta0 + uRot + (uv.x - 0.5) * uArcW;
  float s = sin(th); float c = cos(th);
  float wy = uWAmp * sin(2.0 * th + uWPhase);
  float ph = uTAmp * (sin(th + uTPhase) + 0.35 * sin(3.0 * th - 0.7 * uTPhase));
  float off = (uv.y - 0.5) * uH;
  float sp = sin(ph); float cp = cos(ph);
  vec3 p = vec3(uR * s + s * sp * off, wy + cp * off, uR * c + c * sp * off);
  float y2 = p.y * uCT - p.z * uST;
  float z2 = p.y * uST + p.z * uCT;
  return vec3(p.x * uCR - y2 * uSR, p.x * uSR + y2 * uCR, z2);
}
void main(){
  vec3 p = band(aUV);
  vec3 pu = band(aUV + vec2(0.003, 0.0));
  vec3 pv = band(aUV + vec2(0.0, 0.003));
  vNrm = normalize(cross(pu - p, pv - p));
  vPos = p;
  vUV = aUV;
  gl_Position = uProj * vec4(p.x, p.y, p.z - uDist, 1.0);
}`

const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;
uniform vec4 uFit;
uniform vec3 uBack;
uniform float uSolidBack, uRad, uAspect, uShade, uEye;
varying vec2 vUV;
varying vec3 vPos;
varying vec3 vNrm;
void main(){
  vec2 q = (vUV - 0.5) * vec2(1.0, uAspect);
  vec2 b = vec2(0.5, 0.5 * uAspect) - uRad;
  vec2 d = abs(q) - b;
  float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - uRad;
  float a = 1.0 - smoothstep(-0.007, 0.0, sd);
  if (a < 0.01) discard;
  vec3 V = normalize(vec3(0.0, 0.0, uEye) - vPos);
  vec3 N = normalize(vNrm);
  float facing = dot(N, V);
  vec3 col;
  if (facing >= 0.0) {
    col = texture2D(uTex, vUV * uFit.xy + uFit.zw).rgb;
  } else {
    N = -N;
    if (uSolidBack > 0.5) col = uBack * (0.94 + 0.06 * vUV.y);
    else col = texture2D(uTex, vec2(1.0 - vUV.x, vUV.y) * uFit.xy + uFit.zw).rgb * 0.93;
  }
  vec3 L = normalize(vec3(-0.35, 0.55, 1.0));
  float diff = max(dot(N, L), 0.0);
  float graze = abs(facing);
  float lit = clamp(0.8 + 0.28 * diff, 0.0, 1.05) * (0.84 + 0.16 * graze);
  col *= mix(1.0, lit, uShade);
  gl_FragColor = vec4(col * a, a);
}`

type Shape = {
    rot: number
    arcW: number
    H: number
    R: number
    wAmp: number
    wPhase: number
    tAmp: number
    tPhase: number
    ct: number
    st: number
    cr: number
    sr: number
}

function bandPoint(theta0: number, u: number, v: number, s: Shape) {
    const th = theta0 + s.rot + (u - 0.5) * s.arcW
    const sn = Math.sin(th)
    const cs = Math.cos(th)
    const wy = s.wAmp * Math.sin(2 * th + s.wPhase)
    const ph =
        s.tAmp *
        (Math.sin(th + s.tPhase) + 0.35 * Math.sin(3 * th - 0.7 * s.tPhase))
    const off = (v - 0.5) * s.H
    const sp = Math.sin(ph)
    const x = s.R * sn + sn * sp * off
    const y = wy + Math.cos(ph) * off
    const z = s.R * cs + cs * sp * off
    const y2 = y * s.ct - z * s.st
    const z2 = y * s.st + z * s.ct
    return [x * s.cr - y2 * s.sr, x * s.sr + y2 * s.cr, z2]
}

function hexToRgb(hex: string): [number, number, number] {
    const m = /rgba?\(([^)]+)\)/.exec(hex || "")
    if (m) {
        const p = m[1].split(",").map((n) => parseFloat(n))
        return [p[0] / 255, p[1] / 255, p[2] / 255]
    }
    let h = (hex || "#e8e8ea").replace("#", "")
    if (h.length === 3)
        h = h
            .split("")
            .map((c) => c + c)
            .join("")
    const n = parseInt(h.slice(0, 6), 16) || 0
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/* ------------------------------------------------------------------ */
/* Live view                                                           */
/* ------------------------------------------------------------------ */

function LiveView(props: any) {
    const hostRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props
    const engineRef = useRef<any>(null)
    const shownRef = useRef<Card[]>([])
    const [glFailed, setGlFailed] = useState(false)

    useEffect(() => {
        const host = hostRef.current
        const canvas = canvasRef.current
        if (!host || !canvas) return
        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
        }) as WebGLRenderingContext | null
        if (!gl) {
            setGlFailed(true)
            return
        }

        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)!
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            return sh
        }
        const prog = gl.createProgram()!
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS))
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            setGlFailed(true)
            return
        }
        gl.useProgram(prog)
        const U: Record<string, WebGLUniformLocation | null> = {}
        ;[
            "uTheta0",
            "uRot",
            "uArcW",
            "uH",
            "uR",
            "uWAmp",
            "uWPhase",
            "uTAmp",
            "uTPhase",
            "uCT",
            "uST",
            "uCR",
            "uSR",
            "uDist",
            "uProj",
            "uTex",
            "uBack",
            "uSolidBack",
            "uRad",
            "uAspect",
            "uShade",
            "uEye",
            "uFit",
        ].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)))

        // shared grid mesh
        const SU = 40
        const SV = 18
        const verts: number[] = []
        for (let j = 0; j <= SV; j++)
            for (let i = 0; i <= SU; i++) verts.push(i / SU, j / SV)
        const idx: number[] = []
        for (let j = 0; j < SV; j++)
            for (let i = 0; i < SU; i++) {
                const a = j * (SU + 1) + i
                const b = a + 1
                const c = a + SU + 1
                const d = c + 1
                idx.push(a, b, c, b, d, c)
            }
        const vbo = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
        const ibo = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(idx),
            gl.STATIC_DRAW
        )
        const aUV = gl.getAttribLocation(prog, "aUV")
        gl.enableVertexAttribArray(aUV)
        gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0)

        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.clearColor(0, 0, 0, 0)

        type Slot = {
            tex: WebGLTexture | null
            w: number
            h: number
            video: HTMLVideoElement | null
            live: boolean
        }
        const slots: Slot[] = []
        let uniqueCount = 1
        let lost = false

        // -------- state
        let cssW = 1
        let cssH = 1
        let rot = 0
        let vel = 0
        let autoCur = 0
        let tAmp = 0
        let wAmp = 0
        let tPhase = 0.6
        let wPhase = 0
        let dragging = false
        let dragVel = 0
        let hovering = false
        let raf = 0
        let last = 0
        let shape: Shape | null = null
        let proj = new Float32Array(16)
        let dist = 5
        let thetas: number[] = []
        let cardMap: number[] = []

        const gate = {
            inView: typeof IntersectionObserver === "undefined",
            tabOn: typeof document === "undefined" ? true : !document.hidden,
            reduced:
                typeof window !== "undefined" && window.matchMedia
                    ? window.matchMedia("(prefers-reduced-motion: reduce)")
                          .matches
                    : false,
        }
        const permit = () => gate.inView && gate.tabOn && !lost

        const settings = () => {
            const p = propsRef.current
            const band = p.band || {}
            const motion = p.motion || {}
            const twist = p.twist || {}
            const surface = p.surface || {}
            return {
                aspect: band.aspect ?? 1.05,
                gap: (band.gap ?? 4) / 100,
                corner: (band.corner ?? 9) / 100,
                tilt: (band.tilt ?? 17) * DEG,
                roll: (band.roll ?? 6) * DEG,
                zoom: band.zoom ?? 1.06,
                repeat: Math.max(1, Math.round(band.repeat ?? 1)),
                minCards: Math.max(3, Math.round(band.minCards ?? 12)),
                auto: motion.autoRotate ?? true,
                speed: (motion.speed ?? 12) * DEG,
                dir: motion.direction === "Right" ? -1 : 1,
                scroll: motion.scrollDrive ?? true,
                scrollK: (motion.scrollStrength ?? 1) * 0.0028,
                dragK: motion.dragStrength ?? 1,
                pauseHover: motion.pauseOnHover ?? false,
                friction: motion.friction ?? 1.8,
                twistBase: (twist.amount ?? 14) * DEG,
                react: twist.reactivity ?? 1,
                wave: ((twist.wave ?? 30) / 100) * 0.22,
                solidBack: surface.backFace === "Solid",
                back: surface.backColor || "#E9E9EA",
                shade: (surface.shading ?? 60) / 100,
            }
        }

        const resize = () => {
            const r = host.getBoundingClientRect()
            cssW = Math.max(1, r.width)
            cssH = Math.max(1, r.height)
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.round(cssW * dpr)
            canvas.height = Math.round(cssH * dpr)
        }

        const computeShape = (s: ReturnType<typeof settings>) => {
            const reps = Math.max(s.repeat, Math.ceil(s.minCards / uniqueCount))
            const N = uniqueCount * reps
            const step = (Math.PI * 2) / N
            const R = 1
            const arcW = step * (1 - s.gap)
            const H = R * arcW * s.aspect
            thetas = []
            cardMap = []
            for (let k = 0; k < N; k++) {
                thetas.push(-k * step)
                cardMap.push(k % uniqueCount)
            }
            shape = {
                rot,
                arcW,
                H,
                R,
                wAmp,
                wPhase,
                tAmp,
                tPhase,
                ct: Math.cos(s.tilt),
                st: Math.sin(s.tilt),
                cr: Math.cos(s.roll),
                sr: Math.sin(s.roll),
            }
            const aspect = cssW / cssH
            const fov = 30 * DEG
            const t = Math.tan(fov / 2)
            const halfW = R * 1.22
            const halfH = (H * 0.75 + R * Math.sin(s.tilt) + 0.15) * 1.25
            dist = Math.max(halfW / (t * aspect), halfH / t) + R * 0.55
            dist /= clamp(s.zoom, 0.3, 3)
            const f = 1 / t
            const n = 0.05
            const fa = 60
            proj = new Float32Array([
                f / aspect,
                0,
                0,
                0,
                0,
                f,
                0,
                0,
                0,
                0,
                (fa + n) / (n - fa),
                -1,
                0,
                0,
                (2 * fa * n) / (n - fa),
                0,
            ])
            return s
        }

        const project = (p: number[]) => {
            const z = p[2] - dist
            const w = -z
            const x = (proj[0] * p[0]) / w
            const y = (proj[5] * p[1]) / w
            return [(x * 0.5 + 0.5) * cssW, (1 - (y * 0.5 + 0.5)) * cssH, w]
        }

        const render = () => {
            if (lost) return
            const s = computeShape(settings())
            if (!shape) return
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.uniformMatrix4fv(U.uProj, false, proj)
            gl.uniform1f(U.uRot, shape.rot)
            gl.uniform1f(U.uArcW, shape.arcW)
            gl.uniform1f(U.uH, shape.H)
            gl.uniform1f(U.uR, shape.R)
            gl.uniform1f(U.uWAmp, shape.wAmp)
            gl.uniform1f(U.uWPhase, shape.wPhase)
            gl.uniform1f(U.uTAmp, shape.tAmp)
            gl.uniform1f(U.uTPhase, shape.tPhase)
            gl.uniform1f(U.uCT, shape.ct)
            gl.uniform1f(U.uST, shape.st)
            gl.uniform1f(U.uCR, shape.cr)
            gl.uniform1f(U.uSR, shape.sr)
            gl.uniform1f(U.uDist, dist)
            gl.uniform1f(U.uEye, dist)
            gl.uniform1f(U.uRad, Math.min(0.5, s.corner))
            gl.uniform1f(U.uAspect, s.aspect)
            gl.uniform1f(U.uShade, s.shade)
            gl.uniform1f(U.uSolidBack, s.solidBack ? 1 : 0)
            const bc = hexToRgb(s.back)
            gl.uniform3f(U.uBack, bc[0], bc[1], bc[2])
            gl.uniform1i(U.uTex, 0)
            gl.activeTexture(gl.TEXTURE0)

            const order = thetas
                .map((th, k) => ({ k, z: bandPoint(th, 0.5, 0.5, shape!)[2] }))
                .sort((a, b) => a.z - b.z)
            for (const sl of slots) {
                const v = sl && sl.video
                if (!v || !sl.live || v.readyState < 2 || !sl.tex) continue
                gl.bindTexture(gl.TEXTURE_2D, sl.tex)
                try {
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        0,
                        gl.RGBA,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        v
                    )
                } catch {
                    sl.live = false
                }
            }
            const ca = 1 / s.aspect
            for (const o of order) {
                const sl = slots[cardMap[o.k]]
                if (!sl || !sl.tex) continue
                const ia = sl.w / Math.max(1, sl.h)
                let fx = 1,
                    fy = 1
                if (ia > ca) fx = ca / ia
                else fy = ia / ca
                gl.uniform4f(U.uFit, fx, fy, (1 - fx) / 2, (1 - fy) / 2)
                gl.bindTexture(gl.TEXTURE_2D, sl.tex)
                gl.uniform1f(U.uTheta0, thetas[o.k])
                gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0)
            }
        }

        const pick = (mx: number, my: number) => {
            if (!shape) return -1
            const GU = 10
            const GV = 6
            let best = -1
            let bestD = Infinity
            for (let k = 0; k < thetas.length; k++) {
                const pts: number[][] = []
                for (let j = 0; j <= GV; j++)
                    for (let i = 0; i <= GU; i++)
                        pts.push(
                            project(bandPoint(thetas[k], i / GU, j / GV, shape))
                        )
                for (let j = 0; j < GV; j++)
                    for (let i = 0; i < GU; i++) {
                        const a = pts[j * (GU + 1) + i]
                        const b = pts[j * (GU + 1) + i + 1]
                        const c = pts[(j + 1) * (GU + 1) + i]
                        const d = pts[(j + 1) * (GU + 1) + i + 1]
                        for (const tri of [
                            [a, b, c],
                            [b, d, c],
                        ]) {
                            const [p0, p1, p2] = tri
                            const den =
                                (p1[1] - p2[1]) * (p0[0] - p2[0]) +
                                (p2[0] - p1[0]) * (p0[1] - p2[1])
                            if (Math.abs(den) < 1e-6) continue
                            const l0 =
                                ((p1[1] - p2[1]) * (mx - p2[0]) +
                                    (p2[0] - p1[0]) * (my - p2[1])) /
                                den
                            const l1 =
                                ((p2[1] - p0[1]) * (mx - p2[0]) +
                                    (p0[0] - p2[0]) * (my - p2[1])) /
                                den
                            const l2 = 1 - l0 - l1
                            if (l0 < 0 || l1 < 0 || l2 < 0) continue
                            const dd = l0 * p0[2] + l1 * p1[2] + l2 * p2[2]
                            if (dd < bestD) {
                                bestD = dd
                                best = k
                            }
                        }
                    }
            }
            return best < 0 ? -1 : cardMap[best]
        }

        // -------- loop
        const schedule = () => {
            if (!raf && permit()) {
                for (const sl of slots)
                    if (sl && sl.video && sl.video.paused)
                        sl.video.play().catch(() => {})
                raf = requestAnimationFrame(frame)
            }
        }
        const frame = (now: number) => {
            raf = 0
            if (!permit()) {
                last = 0
                return
            }
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
            last = now
            const s = settings()
            const autoTarget =
                s.auto &&
                !gate.reduced &&
                !(s.pauseHover && hovering) &&
                !dragging
                    ? s.speed * s.dir
                    : 0
            autoCur += (autoTarget - autoCur) * (1 - Math.exp(-dt * 2.5))
            if (!dragging) {
                vel *= Math.exp(-dt * s.friction)
                if (Math.abs(vel) < 0.0004) vel = 0
                rot += (autoCur + vel) * dt
            }
            const drive = clamp(dragging ? dragVel : vel, -5, 5)
            const react = gate.reduced ? 0 : s.react
            const tTarget =
                s.twistBase * (1 + react * 0.35 * Math.abs(drive)) +
                react * 0.1 * drive
            const wTarget = s.wave * (1 + react * 0.45 * Math.abs(drive))
            const k = 1 - Math.exp(-dt * 3.2)
            tAmp += (tTarget - tAmp) * k
            wAmp += (wTarget - wAmp) * k
            const moving = Math.abs(autoCur) > 1e-4 || vel !== 0 || dragging
            if (moving) {
                tPhase += dt * 0.22
                wPhase += dt * 0.16
            }
            render()
            const settled =
                !moving &&
                autoTarget === 0 &&
                Math.abs(tTarget - tAmp) < 1e-4 &&
                Math.abs(wTarget - wAmp) < 1e-4
            if (!settled || slots.some((sl) => sl && sl.live && sl.video))
                schedule()
        }
        const wake = () => schedule()

        // -------- input
        let downX = 0
        let downY = 0
        let lastX = 0
        let lastT = 0
        let moved = 0
        let pid = -1
        const onDown = (e: PointerEvent) => {
            if (e.button !== 0 && e.pointerType === "mouse") return
            dragging = true
            pid = e.pointerId
            downX = lastX = e.clientX
            downY = e.clientY
            lastT = performance.now()
            moved = 0
            dragVel = 0
            vel = 0
            canvas.style.cursor = "grabbing"
            try {
                canvas.setPointerCapture(e.pointerId)
            } catch {}
            wake()
        }
        const onMove = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect()
            if (dragging && e.pointerId === pid) {
                const dx = e.clientX - lastX
                const t = performance.now()
                const dts = Math.max(1, t - lastT) / 1000
                const k =
                    (Math.PI * 1.4 * settings().dragK) / Math.max(200, cssW)
                rot += dx * k
                dragVel = dragVel * 0.6 + ((dx * k) / dts) * 0.4
                lastX = e.clientX
                lastT = t
                moved = Math.max(
                    moved,
                    Math.hypot(e.clientX - downX, e.clientY - downY)
                )
                wake()
                return
            }
            hovering = true
            const hit = pick(e.clientX - r.left, e.clientY - r.top)
            const list = shownRef.current
            canvas.style.cursor =
                hit >= 0 && list[hit]?.link ? "pointer" : "grab"
            if (settings().pauseHover) wake()
        }
        const onUp = (e: PointerEvent) => {
            if (!dragging || e.pointerId !== pid) return
            dragging = false
            pid = -1
            canvas.style.cursor = "grab"
            if (performance.now() - lastT > 90) dragVel = 0
            vel = clamp(dragVel, -6, 6)
            if (moved < 6) {
                const r = canvas.getBoundingClientRect()
                const hit = pick(e.clientX - r.left, e.clientY - r.top)
                const list = shownRef.current
                const link = hit >= 0 ? list[hit]?.link : ""
                if (link) {
                    if (propsRef.current.newTab ?? true)
                        window.open(link, "_blank", "noopener,noreferrer")
                    else window.location.href = link
                }
            }
            wake()
        }
        const onLeave = () => {
            hovering = false
            wake()
        }

        const onWheel = (e: WheelEvent) => {
            if (!permit() || dragging) return
            const s = settings()
            if (!s.scroll || gate.reduced) return
            const r = canvas.getBoundingClientRect()
            if (pick(e.clientX - r.left, e.clientY - r.top) < 0) return
            const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
            vel = clamp(vel + clamp(d, -120, 120) * s.scrollK * s.dir, -6, 6)
            wake()
        }

        canvas.addEventListener("pointerdown", onDown)
        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("pointerup", onUp)
        canvas.addEventListener("pointercancel", onUp)
        canvas.addEventListener("pointerleave", onLeave)
        canvas.addEventListener("wheel", onWheel, { passive: true })

        const playVideos = (on: boolean) => {
            for (const sl of slots) {
                const v = sl && sl.video
                if (!v) continue
                if (on) v.play().catch(() => {})
                else v.pause()
            }
        }
        const park = () => {
            playVideos(false)
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            last = 0
            dragging = false
            dragVel = 0
            vel = 0
        }

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    gate.inView = entries.some((en) => en.isIntersecting)
                    if (gate.inView) wake()
                    else park()
                },
                { rootMargin: "80px" }
            )
            io.observe(host)
        }
        const onVis = () => {
            gate.tabOn = !document.hidden
            if (gate.tabOn) wake()
            else park()
        }
        document.addEventListener("visibilitychange", onVis)
        const mq = window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null
        const onMq = () => {
            gate.reduced = !!mq?.matches
            wake()
        }
        mq?.addEventListener?.("change", onMq)

        let ro: ResizeObserver | null = null
        resize()
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                resize()
                wake()
            })
            ro.observe(host)
        }

        const onLost = (e: Event) => {
            e.preventDefault()
            lost = true
            park()
        }
        canvas.addEventListener("webglcontextlost", onLost)

        const ensure = (i: number) => {
            if (!slots[i])
                slots[i] = { tex: null, w: 1, h: 1, video: null, live: false }
            const sl = slots[i]
            if (!sl.tex) {
                sl.tex = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, sl.tex)
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MAG_FILTER,
                    gl.LINEAR
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE
                )
            }
            return sl
        }
        const put = (sl: Slot, src: TexImageSource) => {
            gl.bindTexture(gl.TEXTURE_2D, sl.tex)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                src
            )
        }

        engineRef.current = {
            fill(i: number, rgb: [number, number, number], force: boolean) {
                if (lost) return
                if (!force && slots[i] && slots[i].tex && slots[i].w > 1) return
                const sl = ensure(i)
                sl.w = sl.h = 1
                sl.video = null
                sl.live = false
                gl.bindTexture(gl.TEXTURE_2D, sl.tex)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    1,
                    1,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    new Uint8Array([
                        rgb[0] * 255,
                        rgb[1] * 255,
                        rgb[2] * 255,
                        255,
                    ])
                )
                wake()
            },
            image(i: number, src: TexImageSource, w: number, h: number) {
                if (lost) return false
                const sl = ensure(i)
                try {
                    put(sl, src)
                } catch {
                    return false
                }
                sl.w = w
                sl.h = h
                sl.video = null
                sl.live = false
                wake()
                return true
            },
            video(i: number, v: HTMLVideoElement) {
                if (lost) return false
                const sl = ensure(i)
                try {
                    put(sl, v)
                } catch {
                    return false
                }
                sl.w = v.videoWidth || 16
                sl.h = v.videoHeight || 9
                sl.video = v
                sl.live = true
                if (permit()) v.play().catch(() => {})
                wake()
                return true
            },
            setCount(n: number) {
                uniqueCount = Math.max(1, n)
                for (let i = n; i < slots.length; i++) {
                    if (slots[i]?.tex) gl.deleteTexture(slots[i].tex)
                }
                slots.length = n
                wake()
            },
            wake,
        }

        return () => {
            park()
            io?.disconnect()
            ro?.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            mq?.removeEventListener?.("change", onMq)
            canvas.removeEventListener("pointerdown", onDown)
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerup", onUp)
            canvas.removeEventListener("pointercancel", onUp)
            canvas.removeEventListener("pointerleave", onLeave)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("wheel", onWheel)
            slots.forEach((sl) => sl?.tex && gl.deleteTexture(sl.tex))
            gl.deleteBuffer(vbo)
            gl.deleteBuffer(ibo)
            gl.deleteProgram(prog)
            engineRef.current = null
        }
    }, [])

    // -------- media
    const list = cardsOf(props)
    shownRef.current = list
    const placeholder = props.placeholder || "#D9D9DB"
    const mediaKey = JSON.stringify([
        list.map((c) => [imageOf(c), videoOf(c)]),
        placeholder,
    ])

    useEffect(() => {
        const eng = engineRef.current
        if (!eng) return
        let cancelled = false
        const videos: HTMLVideoElement[] = []
        const base = hexToRgb(placeholder)
        eng.setCount(list.length)
        list.forEach((card, i) => {
            eng.fill(i, base, false)
            const img = imageOf(card)
            const vid = videoOf(card)
            const loadImage = () => {
                if (!img) {
                    const cv = sampleCanvas(i)
                    eng.image(i, cv, cv.width, cv.height)
                    return
                }
                const el = new Image()
                el.crossOrigin = "anonymous"
                el.decoding = "async"
                el.onload = () => {
                    if (cancelled) return
                    const iw = el.naturalWidth || 1
                    const ih = el.naturalHeight || 1
                    const k = Math.min(1, 1200 / Math.max(iw, ih))
                    const cv = document.createElement("canvas")
                    cv.width = Math.max(1, Math.round(iw * k))
                    cv.height = Math.max(1, Math.round(ih * k))
                    const ctx = cv.getContext("2d")
                    if (!ctx) return
                    ctx.drawImage(el, 0, 0, cv.width, cv.height)
                    eng.image(i, cv, cv.width, cv.height)
                }
                el.src = img
            }
            if (vid) {
                loadImage() // poster while the video buffers
                const v = document.createElement("video")
                v.crossOrigin = "anonymous"
                v.muted = true
                v.loop = true
                v.playsInline = true
                v.setAttribute("playsinline", "")
                v.preload = "auto"
                v.onloadeddata = () => {
                    if (!cancelled) eng.video(i, v)
                }
                v.src = vid
                videos.push(v)
            } else {
                loadImage()
            }
        })
        return () => {
            cancelled = true
            videos.forEach((v) => {
                v.pause()
                v.removeAttribute("src")
                v.load()
            })
        }
    }, [mediaKey])

    useEffect(() => {
        engineRef.current?.wake()
    })

    if (glFailed) return <StaticView {...props} />

    const surface = props.surface || {}
    return (
        <div
            ref={hostRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: props.background,
            }}
        >
            {surface.shadow !== false && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "14%",
                        right: "14%",
                        top: "66%",
                        height: "16%",
                        borderRadius: "50%",
                        pointerEvents: "none",
                        background: `radial-gradient(ellipse at center, ${
                            surface.shadowColor || "rgba(0,0,0,0.14)"
                        } 0%, rgba(0,0,0,0) 70%)`,
                    }}
                />
            )}
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={list.map(altOf).filter(Boolean).join(", ")}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    cursor: "grab",
                    touchAction: "pan-y",
                    userSelect: "none",
                }}
            />
        </div>
    )
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Cincture(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticView {...props} />
    return <LiveView {...props} />
}

Cincture.defaultProps = {
    cards: DEFAULT_CARDS,
    background: "#E7E7E8",
    newTab: true,
    placeholder: "#D9D9DB",
}

addPropertyControls(Cincture, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["Image", "Video"],
                    defaultValue: "Image",
                    displaySegmentedControl: true,
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.type !== "Video",
                },
                alt: { type: ControlType.String, title: "Alt Text" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_CARDS,
    },
    band: {
        type: ControlType.Object,
        title: "Band",
        controls: {
            repeat: {
                type: ControlType.Number,
                title: "Repeat",
                min: 1,
                max: 6,
                step: 1,
                defaultValue: 1,
                displayStepper: true,
            },
            minCards: {
                type: ControlType.Number,
                title: "Min Cards",
                min: 3,
                max: 36,
                step: 1,
                defaultValue: 12,
                displayStepper: true,
            },
            aspect: {
                type: ControlType.Number,
                title: "Card Ratio",
                min: 0.6,
                max: 1.8,
                step: 0.01,
                defaultValue: 1.05,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 40,
                step: 1,
                unit: "%",
                defaultValue: 4,
            },
            corner: {
                type: ControlType.Number,
                title: "Corners",
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                defaultValue: 9,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: -45,
                max: 45,
                step: 1,
                unit: "°",
                defaultValue: 17,
            },
            roll: {
                type: ControlType.Number,
                title: "Roll",
                min: -30,
                max: 30,
                step: 1,
                unit: "°",
                defaultValue: 6,
            },
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                min: 0.5,
                max: 2,
                step: 0.01,
                defaultValue: 1.06,
            },
        },
    },
    twist: {
        type: ControlType.Object,
        title: "Twist",
        controls: {
            amount: {
                type: ControlType.Number,
                title: "Twist",
                min: 0,
                max: 60,
                step: 1,
                unit: "°",
                defaultValue: 14,
            },
            wave: {
                type: ControlType.Number,
                title: "Wave",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 30,
            },
            reactivity: {
                type: ControlType.Number,
                title: "Speed Flex",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 90,
                step: 1,
                unit: "°/s",
                defaultValue: 12,
                hidden: (p: any) => !p.autoRotate,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["Left", "Right"],
                defaultValue: "Left",
                displaySegmentedControl: true,
            },
            scrollDrive: {
                type: ControlType.Boolean,
                title: "Wheel Spin",
                defaultValue: true,
            },
            scrollStrength: {
                type: ControlType.Number,
                title: "Wheel Force",
                min: 0.1,
                max: 4,
                step: 0.05,
                defaultValue: 1,
                hidden: (p: any) => !p.scrollDrive,
            },
            dragStrength: {
                type: ControlType.Number,
                title: "Drag Force",
                min: 0.2,
                max: 4,
                step: 0.05,
                defaultValue: 1,
            },
            friction: {
                type: ControlType.Number,
                title: "Glide",
                min: 0.5,
                max: 6,
                step: 0.1,
                defaultValue: 1.8,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: false,
            },
        },
    },
    surface: {
        type: ControlType.Object,
        title: "Surface",
        controls: {
            backFace: {
                type: ControlType.Enum,
                title: "Inner Side",
                options: ["Mirror", "Solid"],
                defaultValue: "Mirror",
                displaySegmentedControl: true,
            },
            backColor: {
                type: ControlType.Color,
                title: "Inner Fill",
                defaultValue: "#E9E9EA",
                hidden: (p: any) => p.backFace !== "Solid",
            },
            shading: {
                type: ControlType.Number,
                title: "Shading",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 60,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Floor Shadow",
                defaultValue: true,
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow",
                defaultValue: "rgba(0,0,0,0.14)",
                hidden: (p: any) => !p.shadow,
            },
        },
    },
    placeholder: {
        type: ControlType.Color,
        title: "Loading Fill",
        defaultValue: "#D9D9DB",
    },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: true },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E7E7E8",
    },
})
