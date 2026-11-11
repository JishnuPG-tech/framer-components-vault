import { useRef, useEffect, useState, useId } from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"

interface GlassEdgeSettings {
    enabled?: boolean
    canvasPreview?: boolean
    left?: boolean
    right?: boolean
    top?: boolean
    bottom?: boolean
    edgeWidth?: number
    depth?: number
    ior?: number
    aberration?: number
    blur?: number
    blurReach?: number
    sheen?: number
    edgeLight?: number
    rim?: number
    rimColor?: string
    rimWidth?: number
    tint?: string
    tintAmount?: number
    grain?: number
    shade?: number
}
type GlassSettings = Required<GlassEdgeSettings>

interface GlassFade {
    enabled?: boolean
    /** Fade size, % of the host on that axis. */
    width?: number
    /** Fade size in px — overrides width when set. */
    px?: number
    /** Fade colour — falls back to the host/background colour. */
    color?: string
    left?: boolean
    right?: boolean
    top?: boolean
    bottom?: boolean
}

interface GlassEdgeProps {
    hostRef: React.RefObject<HTMLElement | null>
    settings?: GlassEdgeSettings
    fade?: GlassFade
    background?: string
    zIndex?: number
}

interface GlassEdgeHandle {
    refresh: () => void
}

const GLASS_EDGE_DEFAULTS: GlassSettings = {
    enabled: true,
    canvasPreview: false,
    left: true,
    right: true,
    top: false,
    bottom: false,
    edgeWidth: 70,
    depth: 1.35,
    ior: 2.2,
    aberration: 0.75,
    blur: 18,
    blurReach: 48,
    sheen: 0.12,
    edgeLight: 0.18,
    rim: 0.25,
    rimColor: "#FFFFFF",
    rimWidth: 1,
    tint: "#DCEBFF",
    tintAmount: 0.06,
    grain: 0.08,
    shade: 0.18,
}

const resolveGlass = (s?: GlassEdgeSettings): GlassSettings => {
    const out: any = { ...GLASS_EDGE_DEFAULTS }
    if (s)
        for (const key in s) {
            const v = (s as any)[key]
            if (v !== undefined) out[key] = v
        }
    return out
}

const glassAnySide = (s: GlassSettings) =>
    !!(s.left || s.right || s.top || s.bottom)

const clamp01 = (v: number) => Math.max(0, Math.min(1, v || 0))

/* ---------------- Shaders ---------------- */

const GLASS_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`

// uSides = (left, right, bottom, top), 1 = glass on that side.
const GLASS_FRAG_HEAD = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform vec2 uRes;
uniform vec4 uSides;
float frameDistance(vec2 p) {
    float far = 1.0e6;
    float l = uSides.x > 0.5 ? p.x : far;
    float r = uSides.y > 0.5 ? uRes.x - p.x : far;
    float b = uSides.z > 0.5 ? p.y : far;
    float t = uSides.w > 0.5 ? uRes.y - p.y : far;
    return min(min(l, r), min(b, t));
}
`

// Curved glass lip: Snell refraction through a normal that rolls outward
// toward each edge, per-channel IOR for dispersion, soft Fresnel sheen.
const GLASS_LENS_FRAG =
    GLASS_FRAG_HEAD +
    `
uniform sampler2D uScene;
uniform float uEdge;
uniform float uDepth;
uniform float uIor;
uniform float uSpread;
uniform float uSheen;
uniform float uGlint;

float lip(vec2 p) {
    float n = clamp(frameDistance(p) / uEdge, 0.0, 1.0);
    float eased = n * n * n * (n * (n * 6.0 - 15.0) + 10.0);
    return 1.0 - eased;
}

vec2 towardCentre(vec2 p) {
    float l = (1.0 - smoothstep(0.0, uEdge, p.x)) * uSides.x;
    float r = (1.0 - smoothstep(0.0, uEdge, uRes.x - p.x)) * uSides.y;
    float b = (1.0 - smoothstep(0.0, uEdge, p.y)) * uSides.z;
    float t = (1.0 - smoothstep(0.0, uEdge, uRes.y - p.y)) * uSides.w;
    vec2 v = vec2(l - r, b - t);
    return v / max(length(v), 0.0001);
}

vec2 shift(vec3 n, float eta) {
    return refract(vec3(0.0, 0.0, -1.0), n, 1.0 / max(eta, 1.001)).xy * uDepth;
}

vec3 grab(vec2 p) {
    return texture2D(uScene, clamp(p / uRes, vec2(0.0), vec2(1.0))).rgb;
}

vec3 lightRoom(vec3 d) {
    d = normalize(d);
    float key = pow(max(dot(d, normalize(vec3(-0.5, 0.7, 0.5))), 0.0), 16.0);
    float rim = pow(max(dot(d, normalize(vec3(0.8, -0.2, 0.55))), 0.0), 30.0);
    float panel = smoothstep(0.2, 0.85, abs(d.x)) * smoothstep(-0.4, 0.3, d.y);
    vec3 c = vec3(0.7 + 0.2 * d.y) - vec3(0.32) * panel;
    c += vec3(1.0, 0.98, 0.95) * key * 1.1;
    c += vec3(0.85, 0.93, 1.0) * rim * 0.8;
    return max(c, vec3(0.0));
}

void main() {
    vec2 p = vUv * uRes;
    float k = lip(p);
    if (k <= 0.00001) {
        gl_FragColor = vec4(grab(p), 1.0);
        return;
    }
    vec2 inward = towardCentre(p);
    vec2 side = vec2(-inward.y, inward.x);
    float along = dot(p, side);
    float slope = (0.97 + 0.008 * sin(along * 0.005) + 0.004 * sin(along * 0.011 + 2.0))
        * pow(k, 0.8);
    slope = min(slope, 0.995);
    vec3 n = vec3(-inward * slope, sqrt(1.0 - slope * slope));

    float steep = pow(clamp(1.0 - n.z, 0.0, 1.0), 1.15);
    float spread = uSpread * (0.12 + 0.88 * steep);

    vec3 base = grab(p + shift(n, uIor));
    vec3 col = base;
    if (spread > 0.0) {
        float r = 0.0;
        float b = 0.0;
        for (int i = 0; i < 3; i++) {
            float f = spread * (0.7 + 0.15 * float(i)) * 0.5;
            r += grab(p + shift(n, uIor * (1.0 - f))).r;
            b += grab(p + shift(n, uIor * (1.0 + f))).b;
        }
        col = vec3(r / 3.0, base.g, b / 3.0);
    }

    float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
    float fres = f0 + (1.0 - f0) * pow(1.0 - n.z, 5.0);
    vec3 env = lightRoom(reflect(vec3(0.0, 0.0, -1.0), n));
    col = mix(col, env, clamp(uSheen * fres * k, 0.0, 0.35));
    col += env * uGlint * fres * k * 0.25;
    gl_FragColor = vec4(col, 1.0);
}
`

// Separable 9-tap Gaussian (sigma ~2 texels) folded into 5 linear fetches.
const GLASS_BLUR_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uDir;
uniform vec2 uPre;
vec4 tap(vec2 uv) {
    if (uPre.y == 0.0) return texture2D(uSrc, uv);
    return 0.5 * (texture2D(uSrc, uv + uPre) + texture2D(uSrc, uv - uPre));
}
void main() {
    vec4 c = tap(vUv) * 0.2042;
    c += (tap(vUv + uDir * 1.4072) + tap(vUv - uDir * 1.4072)) * 0.3040;
    c += (tap(vUv + uDir * 3.294) + tap(vUv - uDir * 3.294)) * 0.0939;
    gl_FragColor = c;
}
`

// Picks the pyramid level whose blur matches the requested softness at this
// distance from the glass sides, crossfading between neighbours.
const GLASS_COMPOSE_FRAG =
    GLASS_FRAG_HEAD +
    `
uniform sampler2D uL0;
uniform sampler2D uL1;
uniform sampler2D uL2;
uniform sampler2D uL3;
uniform sampler2D uL4;
uniform sampler2D uL5;
uniform sampler2D uL6;
uniform float uSig[7];
uniform float uBlur;
uniform float uReach;
void main() {
    vec2 p = vUv * uRes;
    float t = clamp(1.0 - frameDistance(p) / max(uReach, 1.0), 0.0, 1.0);
    float s = uBlur * t * t * (3.0 - 2.0 * t);
    vec4 c;
    if (s <= 0.01) c = texture2D(uL0, vUv);
    else if (s < uSig[1]) c = mix(texture2D(uL0, vUv), texture2D(uL1, vUv), s / uSig[1]);
    else if (s < uSig[2]) c = mix(texture2D(uL1, vUv), texture2D(uL2, vUv), (s - uSig[1]) / (uSig[2] - uSig[1]));
    else if (s < uSig[3]) c = mix(texture2D(uL2, vUv), texture2D(uL3, vUv), (s - uSig[2]) / (uSig[3] - uSig[2]));
    else if (s < uSig[4]) c = mix(texture2D(uL3, vUv), texture2D(uL4, vUv), (s - uSig[3]) / (uSig[4] - uSig[3]));
    else if (s < uSig[5]) c = mix(texture2D(uL4, vUv), texture2D(uL5, vUv), (s - uSig[4]) / (uSig[5] - uSig[4]));
    else if (s < uSig[6]) c = mix(texture2D(uL5, vUv), texture2D(uL6, vUv), (s - uSig[5]) / (uSig[6] - uSig[5]));
    else c = texture2D(uL6, vUv);
    gl_FragColor = vec4(c.rgb, 1.0);
}
`

// Effective blur (device px) of each pyramid level.
const GLASS_LEVEL_SIGMA = Array.from({ length: 7 }, (_, k) =>
    k === 0 ? 0 : 2 * Math.sqrt((4 * (Math.pow(4, k) - 1)) / 3)
)

/* ---------------- WebGL renderer ---------------- */

interface GlassFrame {
    /** GL order: left, right, bottom, top (1 = glass on that side). */
    sides: [number, number, number, number]
    edge: number
    depth: number
    ior: number
    spread: number
    sheen: number
    glint: number
    blur: number
    reach: number
}

interface GlassRenderer {
    render: (source: HTMLCanvasElement, frame: GlassFrame) => void
    dispose: () => void
}

function createGlassRenderer(
    canvas: HTMLCanvasElement,
    onLost: () => void
): GlassRenderer | null {
    const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
    }) as WebGLRenderingContext | null
    if (!gl) return null

    const shaders: WebGLShader[] = []
    const compile = (type: number, src: string) => {
        const s = gl.createShader(type)
        if (!s) return null
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn("Glass shader:", gl.getShaderInfoLog(s))
            gl.deleteShader(s)
            return null
        }
        shaders.push(s)
        return s
    }
    const vs = compile(gl.VERTEX_SHADER, GLASS_VERT)
    if (!vs) return null

    interface Prog {
        program: WebGLProgram
        attrib: number
        u: (name: string) => WebGLUniformLocation | null
    }
    const programs: WebGLProgram[] = []
    const build = (fragSrc: string): Prog | null => {
        const fs = compile(gl.FRAGMENT_SHADER, fragSrc)
        if (!fs) return null
        const program = gl.createProgram()
        if (!program) return null
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn("Glass program:", gl.getProgramInfoLog(program))
            gl.deleteProgram(program)
            return null
        }
        programs.push(program)
        const cache = new Map<string, WebGLUniformLocation | null>()
        return {
            program,
            attrib: gl.getAttribLocation(program, "aPos"),
            u: (name) => {
                if (!cache.has(name))
                    cache.set(name, gl.getUniformLocation(program, name))
                return cache.get(name) ?? null
            },
        }
    }

    const lens = build(GLASS_LENS_FRAG)
    const blur = build(GLASS_BLUR_FRAG)
    const compose = build(GLASS_COMPOSE_FRAG)
    const freeShaders = () => {
        shaders.forEach((s) => gl.deleteShader(s))
        shaders.length = 0
    }
    if (!lens || !blur || !compose) {
        programs.forEach((p) => gl.deleteProgram(p))
        freeShaders()
        return null
    }

    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
    )

    const use = (prog: Prog) => {
        gl.useProgram(prog.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, quad)
        gl.enableVertexAttribArray(prog.attrib)
        gl.vertexAttribPointer(prog.attrib, 2, gl.FLOAT, false, 0, 0)
    }

    const makeTexture = (w: number, h: number) => {
        const tex = gl.createTexture()
        if (!tex) throw new Error("texture")
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
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
        return tex
    }

    interface Target {
        tex: WebGLTexture
        fb: WebGLFramebuffer
        w: number
        h: number
    }
    const makeTarget = (w: number, h: number): Target => {
        const tex = makeTexture(w, h)
        const fb = gl.createFramebuffer()
        if (!fb) throw new Error("framebuffer")
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            tex,
            0
        )
        if (
            gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
            gl.FRAMEBUFFER_COMPLETE
        )
            throw new Error("framebuffer incomplete")
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        return { tex, fb, w, h }
    }
    const dropTarget = (t?: Target) => {
        if (!t) return
        gl.deleteTexture(t.tex)
        gl.deleteFramebuffer(t.fb)
    }

    const sceneTex = makeTexture(1, 1)
    let levels: Target[] = []
    let halves: Target[] = []
    let sizeW = 0
    let sizeH = 0
    const freeLevels = () => {
        levels.forEach(dropTarget)
        halves.forEach(dropTarget)
        levels = []
        halves = []
    }
    const ensureLevels = (w: number, h: number, count: number) => {
        if (w !== sizeW || h !== sizeH) {
            freeLevels()
            sizeW = w
            sizeH = h
        }
        while (levels.length < count + 1) {
            const k = levels.length
            const lw = Math.max(1, Math.ceil(w / Math.pow(2, k)))
            const lh = Math.max(1, Math.ceil(h / Math.pow(2, k)))
            levels.push(makeTarget(lw, lh))
            if (k > 0) halves[k] = makeTarget(lw, lh)
        }
    }

    const sigmas = new Float32Array(7)
    const handleLost = (e: Event) => {
        e.preventDefault()
        onLost()
    }
    canvas.addEventListener("webglcontextlost", handleLost)

    return {
        render(source, f) {
            const W = source.width
            const H = source.height
            if (canvas.width !== W) canvas.width = W
            if (canvas.height !== H) canvas.height = H
            gl.disable(gl.BLEND)
            gl.disable(gl.SCISSOR_TEST)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, sceneTex)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                source
            )
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)

            const anySide = f.sides.some((v) => v > 0)
            let depthLevels = 0
            if (anySide && f.blur > 0.5) {
                depthLevels = 1
                while (
                    depthLevels < 6 &&
                    GLASS_LEVEL_SIGMA[depthLevels] < f.blur
                )
                    depthLevels++
                ensureLevels(W, H, depthLevels)
            }

            // Refraction pass
            use(lens)
            gl.bindFramebuffer(
                gl.FRAMEBUFFER,
                depthLevels ? levels[0].fb : null
            )
            gl.viewport(0, 0, W, H)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, sceneTex)
            gl.uniform1i(lens.u("uScene"), 0)
            gl.uniform2f(lens.u("uRes"), W, H)
            gl.uniform4f(lens.u("uSides"), ...f.sides)
            gl.uniform1f(lens.u("uEdge"), Math.max(1, f.edge))
            gl.uniform1f(lens.u("uDepth"), f.depth)
            gl.uniform1f(lens.u("uIor"), f.ior)
            gl.uniform1f(lens.u("uSpread"), f.spread)
            gl.uniform1f(lens.u("uSheen"), f.sheen)
            gl.uniform1f(lens.u("uGlint"), f.glint)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            if (!depthLevels) return

            // Blur pyramid
            use(blur)
            gl.uniform1i(blur.u("uSrc"), 0)
            for (let k = 1; k <= depthLevels; k++) {
                const from = levels[k - 1]
                const mid = halves[k]
                const to = levels[k]
                gl.bindFramebuffer(gl.FRAMEBUFFER, mid.fb)
                gl.viewport(0, 0, mid.w, mid.h)
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, from.tex)
                gl.uniform2f(blur.u("uDir"), 1 / mid.w, 0)
                gl.uniform2f(blur.u("uPre"), 0, 1 / from.h)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb)
                gl.viewport(0, 0, to.w, to.h)
                gl.bindTexture(gl.TEXTURE_2D, mid.tex)
                gl.uniform2f(blur.u("uDir"), 0, 1 / to.h)
                gl.uniform2f(blur.u("uPre"), 0, 0)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            }

            // Progressive composite to screen
            use(compose)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0, 0, W, H)
            for (let i = 0; i < 7; i++) {
                gl.activeTexture(gl.TEXTURE0 + i)
                gl.bindTexture(
                    gl.TEXTURE_2D,
                    levels[Math.min(i, depthLevels)].tex
                )
                gl.uniform1i(compose.u(`uL${i}`), i)
                sigmas[i] = i <= depthLevels ? GLASS_LEVEL_SIGMA[i] : 1e6
            }
            gl.uniform1fv(compose.u("uSig[0]"), sigmas)
            gl.uniform2f(compose.u("uRes"), W, H)
            gl.uniform4f(compose.u("uSides"), ...f.sides)
            gl.uniform1f(compose.u("uBlur"), f.blur)
            gl.uniform1f(compose.u("uReach"), f.reach)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            gl.activeTexture(gl.TEXTURE0)
        },
        dispose() {
            canvas.removeEventListener("webglcontextlost", handleLost)
            freeLevels()
            gl.deleteTexture(sceneTex)
            gl.deleteBuffer(quad)
            programs.forEach((p) => gl.deleteProgram(p))
            freeShaders()
        },
    }
}

/* ---------------- Settings → GPU frame, zones, mask ---------------- */

const glassFrameOf = (s: GlassSettings, dpr: number): GlassFrame => {
    const edge = Math.max(1, s.edgeWidth)
    return {
        sides: [
            s.left ? 1 : 0,
            s.right ? 1 : 0,
            s.bottom ? 1 : 0,
            s.top ? 1 : 0,
        ],
        edge: edge * dpr,
        depth: edge * Math.max(0, s.depth) * dpr,
        ior: Math.max(1.01, s.ior),
        spread: clamp01(s.aberration),
        sheen: Math.max(0, s.sheen),
        glint: Math.max(0, s.edgeLight),
        blur: Math.max(0, Math.min(100, s.blur)) * dpr,
        reach: Math.max(1, s.blurReach) * dpr,
    }
}

const glassZone = (len: number, s: GlassSettings) =>
    Math.min(Math.max(s.edgeWidth, s.blurReach) + 2, len * 0.45)

const glassSampleReach = (len: number, s: GlassSettings) =>
    glassZone(len, s) + s.edgeWidth * s.depth + 60

interface GlassRect {
    x: number
    y: number
    w: number
    h: number
}

const glassNearEdge = (
    r: GlassRect,
    W: number,
    H: number,
    s: GlassSettings
) => {
    if (r.w <= 0 || r.h <= 0) return false
    if (r.x > W || r.x + r.w < 0 || r.y > H || r.y + r.h < 0) return false
    const rx = glassSampleReach(W, s)
    const ry = glassSampleReach(H, s)
    return (
        (s.left && r.x < rx) ||
        (s.right && r.x + r.w > W - rx) ||
        (s.top && r.y < ry) ||
        (s.bottom && r.y + r.h > H - ry)
    )
}

const glassMaskOf = (W: number, H: number, s: GlassSettings) => {
    const soft = 28
    const band = (dir: string, len: number, a: boolean, b: boolean) => {
        const z = glassZone(len, s)
        const A = a ? "#000" : "transparent"
        const B = b ? "#000" : "transparent"
        return `linear-gradient(${dir}, ${A} 0px, ${A} ${z}px, transparent ${z + soft}px, transparent calc(100% - ${z + soft}px), ${B} calc(100% - ${z}px), ${B} 100%)`
    }
    const layers: string[] = []
    if (s.left || s.right) layers.push(band("to right", W, s.left, s.right))
    if (s.top || s.bottom) layers.push(band("to bottom", H, s.top, s.bottom))
    return layers.length ? layers.join(", ") : undefined
}

/* ---------------- Scene painting (mirror the DOM into a 2D canvas) ---------------- */

interface GlassSources {
    pictureFor: (src: string) => HTMLImageElement | null
    clipIsClean: (v: HTMLVideoElement) => boolean
}

const glassIsClear = (c: string) =>
    !c || c === "transparent" || /,\s*0(\.0+)?\s*\)$/.test(c)

const glassToClear = (ctx: CanvasRenderingContext2D, color: string) => {
    const prev = ctx.fillStyle
    ctx.fillStyle = "#000"
    ctx.fillStyle = color
    const n = String(ctx.fillStyle)
    ctx.fillStyle = prev
    if (n[0] === "#" && n.length >= 7) {
        const r = parseInt(n.slice(1, 3), 16)
        const g = parseInt(n.slice(3, 5), 16)
        const b = parseInt(n.slice(5, 7), 16)
        return `rgba(${r},${g},${b},0)`
    }
    const m = n.match(/rgba?\(([^)]+)\)/)
    if (!m) return "rgba(0,0,0,0)"
    const [r, g, b] = m[1].split(",").map((v) => parseFloat(v))
    return `rgba(${r || 0},${g || 0},${b || 0},0)`
}

const glassOpacity = (el: Element, stop: Element) => {
    let a = 1
    let n: Element | null = el
    while (n && n !== stop) {
        const o = parseFloat(getComputedStyle(n).opacity)
        if (!isNaN(o)) a *= o
        if (a <= 0.01) return 0
        n = n.parentElement
    }
    return a
}

const glassTraceRound = (
    ctx: CanvasRenderingContext2D,
    r: GlassRect,
    radius: number
) => {
    const { x, y, w, h } = r
    const q = Math.max(0, Math.min(radius, w / 2, h / 2))
    ctx.beginPath()
    ctx.moveTo(x + q, y)
    ctx.lineTo(x + w - q, y)
    ctx.arcTo(x + w, y, x + w, y + q, q)
    ctx.lineTo(x + w, y + h - q)
    ctx.arcTo(x + w, y + h, x + w - q, y + h, q)
    ctx.lineTo(x + q, y + h)
    ctx.arcTo(x, y + h, x, y + h - q, q)
    ctx.lineTo(x, y + q)
    ctx.arcTo(x, y, x + q, y, q)
    ctx.closePath()
}

const glassPaintFit = (
    ctx: CanvasRenderingContext2D,
    src: CanvasImageSource,
    sw: number,
    sh: number,
    r: GlassRect,
    fit: string
) => {
    if (!sw || !sh || r.w <= 0 || r.h <= 0) return
    if (fit === "fill") {
        ctx.drawImage(src, r.x, r.y, r.w, r.h)
        return
    }
    const k =
        fit === "contain"
            ? Math.min(r.w / sw, r.h / sh)
            : Math.max(r.w / sw, r.h / sh)
    const dw = sw * k
    const dh = sh * k
    ctx.drawImage(src, r.x + (r.w - dw) / 2, r.y + (r.h - dh) / 2, dw, dh)
}

const glassPaintMedia = (
    ctx: CanvasRenderingContext2D,
    media: HTMLElement,
    r: GlassRect,
    sources: GlassSources
) => {
    const fit = getComputedStyle(media).objectFit || "cover"
    if (media instanceof HTMLVideoElement) {
        if (media.readyState >= 2 && sources.clipIsClean(media))
            glassPaintFit(
                ctx,
                media,
                media.videoWidth,
                media.videoHeight,
                r,
                fit
            )
    } else if (media instanceof HTMLImageElement) {
        const pic = sources.pictureFor(media.currentSrc || media.src)
        if (pic)
            glassPaintFit(ctx, pic, pic.naturalWidth, pic.naturalHeight, r, fit)
    }
}

const glassPaintText = (
    ctx: CanvasRenderingContext2D,
    node: HTMLElement,
    r: GlassRect
) => {
    const text = (node.textContent || "").trim()
    if (!text) return
    const cs = getComputedStyle(node)
    const size = parseFloat(cs.fontSize) || 14
    const lh = parseFloat(cs.lineHeight) || size * 1.25
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`
    try {
        ;(ctx as any).letterSpacing =
            cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing
    } catch {}
    ctx.fillStyle = cs.color
    ctx.textBaseline = "middle"
    const lines: string[] = []
    let line = ""
    for (const word of text.split(/\s+/)) {
        const next = line ? line + " " + word : word
        if (line && ctx.measureText(next).width > r.w + 0.5) {
            lines.push(line)
            line = word
        } else line = next
    }
    if (line) lines.push(line)
    const align = cs.textAlign
    const centre = align === "center"
    const end = align === "right" || align === "end"
    const ax = centre ? r.x + r.w / 2 : end ? r.x + r.w : r.x
    ctx.textAlign = centre ? "center" : end ? "right" : "left"
    lines.forEach((ln, i) => ctx.fillText(ln, ax, r.y + lh * i + lh / 2))
}

// Rotation (radians) carried by a computed CSS transform.
const glassAngleOf = (transform: string) => {
    if (!transform || transform === "none") return 0
    const m = transform.match(/matrix(?:3d)?\(([^)]+)\)/)
    if (!m) return 0
    const v = m[1].split(",").map((n) => parseFloat(n))
    return Math.atan2(v[1] || 0, v[0] || 1)
}

// Untransformed rect of a descendant, in its tile's centred frame.
const glassWithinTile = (
    el: HTMLElement,
    tile: HTMLElement,
    frame: GlassRect
): GlassRect => {
    if (el === tile) return frame
    let x = 0
    let y = 0
    let n: HTMLElement | null = el
    while (n && n !== tile) {
        x += n.offsetLeft
        y += n.offsetTop
        n = n.offsetParent as HTMLElement | null
    }
    if (n !== tile) return frame
    return {
        x: frame.x + x,
        y: frame.y + y,
        w: el.offsetWidth,
        h: el.offsetHeight,
    }
}

function paintGlassScene(
    host: HTMLElement,
    scene: HTMLCanvasElement,
    s: GlassSettings,
    fade: GlassFade | undefined,
    fallbackBg: string | undefined,
    sources: GlassSources
): boolean {
    const W = host.offsetWidth
    const H = host.offsetHeight
    if (W < 2 || H < 2) return false
    const box = host.getBoundingClientRect()
    const k = box.width / W || 1
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const pw = Math.round(W * dpr)
    const ph = Math.round(H * dpr)
    if (scene.width !== pw) scene.width = pw
    if (scene.height !== ph) scene.height = ph
    const ctx = scene.getContext("2d")
    if (!ctx) return false
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.globalAlpha = 1

    const hostBg = getComputedStyle(host).backgroundColor
    const bg = glassIsClear(hostBg) ? fallbackBg || "#FFFFFF" : hostBg
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    const local = (el: Element): GlassRect => {
        const r = el.getBoundingClientRect()
        return {
            x: (r.left - box.left) / k,
            y: (r.top - box.top) / k,
            w: r.width / k,
            h: r.height / k,
        }
    }

    // Paint tiles back to front so overlaps match the live stacking.
    const tiles = Array.from(host.querySelectorAll<HTMLElement>("[data-glass]"))
        .map((el) => ({ el, z: parseInt(getComputedStyle(el).zIndex) || 0 }))
        .sort((a, b) => a.z - b.z)
        .map((e) => e.el)

    tiles.forEach((tile) => {
        const t = local(tile)
        if (!glassNearEdge(t, W, H, s)) return
        const alpha = glassOpacity(tile, host)
        if (alpha <= 0.01) return
        const own = (n: Element) => n.closest("[data-glass]") === tile
        const cs = getComputedStyle(tile)

        // Rotated tiles are drawn in their own frame, turned about the
        // centre of their on-screen bounding box.
        const angle = glassAngleOf(cs.transform)
        const tw = tile.offsetWidth
        const th = tile.offsetHeight
        const turned = Math.abs(angle) > 0.0005 && tw > 0 && th > 0
        const frame: GlassRect = turned
            ? { x: -tw / 2, y: -th / 2, w: tw, h: th }
            : t
        const place = (el: HTMLElement): GlassRect =>
            turned ? glassWithinTile(el, tile, frame) : local(el)

        ctx.save()
        if (turned) {
            ctx.translate(t.x + t.w / 2, t.y + t.h / 2)
            ctx.rotate(angle)
        }
        ctx.globalAlpha = alpha
        glassTraceRound(ctx, frame, parseFloat(cs.borderTopLeftRadius) || 0)
        ctx.clip()
        if (!glassIsClear(cs.backgroundColor)) {
            ctx.fillStyle = cs.backgroundColor
            ctx.fillRect(frame.x, frame.y, frame.w, frame.h)
        }
        tile.querySelectorAll<HTMLElement>("img, video").forEach((m) => {
            if (!own(m)) return
            const a = glassOpacity(m, tile)
            if (a <= 0.01) return
            ctx.globalAlpha = alpha * a
            glassPaintMedia(ctx, m, place(m), sources)
        })
        tile.querySelectorAll<HTMLElement>("[data-glass-scrim]").forEach(
            (sc) => {
                if (!own(sc)) return
                const a = glassOpacity(sc, tile)
                if (a <= 0.01) return
                const r = place(sc)
                const c = getComputedStyle(sc).color
                const clear = glassToClear(ctx, c)
                const g = ctx.createLinearGradient(0, r.y + r.h, 0, r.y)
                g.addColorStop(0, c)
                g.addColorStop(1, clear)
                ctx.globalAlpha = alpha * a
                ctx.fillStyle = g
                ctx.fillRect(r.x, r.y, r.w, r.h)
            }
        )
        tile.querySelectorAll<HTMLElement>("[data-glass-text]").forEach((n) => {
            if (!own(n)) return
            const a = glassOpacity(n, tile)
            if (a <= 0.01) return
            ctx.globalAlpha = alpha * a
            glassPaintText(ctx, n, place(n))
        })
        ctx.restore()
    })

    host.querySelectorAll<HTMLElement>("[data-glass-text]").forEach((n) => {
        if (n.closest("[data-glass]")) return
        const r = local(n)
        if (!glassNearEdge(r, W, H, s)) return
        const a = glassOpacity(n, host)
        if (a <= 0.01) return
        ctx.globalAlpha = a
        glassPaintText(ctx, n, r)
        ctx.globalAlpha = 1
    })

    if (fade && fade.enabled !== false) {
        const pct = Math.max(0, Math.min(50, fade.width ?? 16))
        const sx =
            fade.px != null
                ? Math.min(W / 2, Math.max(0, fade.px))
                : (W * pct) / 100
        const sy =
            fade.px != null
                ? Math.min(H / 2, Math.max(0, fade.px))
                : (H * pct) / 100
        if (sx > 0 || sy > 0) {
            const tone =
                fade.color && !glassIsClear(fade.color) ? fade.color : bg
            const clear = glassToClear(ctx, tone)
            const strip = (
                x0: number,
                y0: number,
                x1: number,
                y1: number,
                r: GlassRect
            ) => {
                const g = ctx.createLinearGradient(x0, y0, x1, y1)
                g.addColorStop(0, tone)
                g.addColorStop(1, clear)
                ctx.fillStyle = g
                ctx.fillRect(r.x, r.y, r.w, r.h)
            }
            if (fade.left !== false)
                strip(0, 0, sx, 0, { x: 0, y: 0, w: sx, h: H })
            if (fade.right !== false)
                strip(W, 0, W - sx, 0, { x: W - sx, y: 0, w: sx, h: H })
            if (fade.top === true)
                strip(0, 0, 0, sy, { x: 0, y: 0, w: W, h: sy })
            if (fade.bottom === true)
                strip(0, H, 0, H - sy, { x: 0, y: H - sy, w: W, h: sy })
        }
    }
    return true
}

const glassPictureCache =
    (store: Map<string, HTMLImageElement | null>, onLoad: () => void) =>
    (src: string) => {
        if (!src) return null
        if (!store.has(src)) {
            store.set(src, null)
            const im = new Image()
            im.crossOrigin = "anonymous"
            im.decoding = "async"
            im.onload = () => {
                store.set(src, im)
                onLoad()
            }
            im.onerror = () => {}
            im.src = src
        }
        return store.get(src) || null
    }

/* ---------------- Add-on layers (tint, grain, shade, rim) ---------------- */

const GLASS_GRAIN_TILE =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1.4 -0.2'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
    )

const GLASS_TOWARD = {
    left: "to right",
    right: "to left",
    top: "to bottom",
    bottom: "to top",
} as const

function GlassExtras(props: {
    s: GlassSettings
    ready: boolean
    zIndex?: number
}) {
    const { s, ready, zIndex } = props
    const lip = Math.max(1, s.edgeWidth)
    const tintAmt = clamp01(s.tintAmount)
    const rim = clamp01(s.rim)
    const grain = clamp01(s.grain)
    const shade = clamp01(s.shade)
    if (!ready || (!tintAmt && !rim && !grain && !shade)) return null
    const sides = (["left", "right", "top", "bottom"] as const).filter(
        (side) => s[side]
    )
    return (
        <>
            {sides.map((side) => {
                const upright = side === "left" || side === "right"
                const toward = GLASS_TOWARD[side]
                const strip: React.CSSProperties = upright
                    ? {
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          [side]: 0,
                          width: lip,
                      }
                    : {
                          position: "absolute",
                          left: 0,
                          right: 0,
                          [side]: 0,
                          height: lip,
                      }
                strip.pointerEvents = "none"
                strip.zIndex = zIndex
                const lipFade = `linear-gradient(${toward}, #000 0%, rgba(0,0,0,0.55) 45%, transparent 100%)`
                const rimInset = Math.max(1, lip * 0.07)
                const rimSize = Math.max(1, s.rimWidth)
                const rimStyle: React.CSSProperties = upright
                    ? {
                          top: 0,
                          bottom: 0,
                          [side]: rimInset,
                          width: rimSize,
                          background: `linear-gradient(to bottom, transparent 0%, ${s.rimColor} 30%, ${s.rimColor} 70%, transparent 100%)`,
                      }
                    : {
                          left: 0,
                          right: 0,
                          [side]: rimInset,
                          height: rimSize,
                          background: `linear-gradient(to right, transparent 0%, ${s.rimColor} 30%, ${s.rimColor} 70%, transparent 100%)`,
                      }
                return (
                    <React.Fragment key={side}>
                        {shade > 0 ? (
                            <div
                                data-glass-layer=""
                                style={{
                                    ...strip,
                                    background: `linear-gradient(${toward}, rgba(0,0,0,${0.55 * shade}) 0%, rgba(0,0,0,0) 35%)`,
                                }}
                            />
                        ) : null}
                        {tintAmt > 0 ? (
                            <div
                                data-glass-layer=""
                                style={{
                                    ...strip,
                                    background: s.tint,
                                    opacity: tintAmt,
                                    WebkitMaskImage: lipFade,
                                    maskImage: lipFade,
                                }}
                            />
                        ) : null}
                        {grain > 0 ? (
                            <div
                                data-glass-layer=""
                                style={{
                                    ...strip,
                                    backgroundImage: `url("${GLASS_GRAIN_TILE}")`,
                                    backgroundSize: "160px 160px",
                                    mixBlendMode: "overlay",
                                    opacity: grain,
                                    WebkitMaskImage: lipFade,
                                    maskImage: lipFade,
                                }}
                            />
                        ) : null}
                        {rim > 0 ? (
                            <div
                                data-glass-layer=""
                                style={{
                                    position: "absolute",
                                    pointerEvents: "none",
                                    zIndex,
                                    opacity: rim,
                                    mixBlendMode: "screen",
                                    ...rimStyle,
                                }}
                            />
                        ) : null}
                    </React.Fragment>
                )
            })}
        </>
    )
}

const glassCanvasStyle = (
    mask: string | undefined,
    ready: boolean,
    zIndex?: number
): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    pointerEvents: "none",
    zIndex,
    opacity: ready ? 1 : 0,
    WebkitMaskImage: mask,
    maskImage: mask,
})

/* ---------------- Static layer (canvas / export) ---------------- */

// Draws once when "Show on Canvas" is on. No rAF, no timers, no observers.
function GlassEdgeStill(props: GlassEdgeProps) {
    const s = resolveGlass(props.settings)
    const on = s.enabled && s.canvasPreview && glassAnySide(s)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const sceneRef = React.useRef<HTMLCanvasElement | null>(null)
    const rendererRef = React.useRef<GlassRenderer | null>(null)
    const pics = React.useRef(new Map<string, HTMLImageElement | null>())
    const propsRef = React.useRef(props)
    propsRef.current = props
    const [ready, setReady] = React.useState(false)
    const [size, setSize] = React.useState({ w: 700, h: 700 })

    const drawRef = React.useRef<() => void>(() => {})
    drawRef.current = () => {
        const host = propsRef.current.hostRef.current
        const r = rendererRef.current
        const scene = sceneRef.current
        if (!host || !r || !scene) return
        const st = resolveGlass(propsRef.current.settings)
        try {
            const ok = paintGlassScene(
                host,
                scene,
                st,
                propsRef.current.fade,
                propsRef.current.background,
                {
                    pictureFor: glassPictureCache(pics.current, () =>
                        drawRef.current()
                    ),
                    clipIsClean: () => false,
                }
            )
            if (!ok) return
            r.render(
                scene,
                glassFrameOf(st, scene.width / (host.offsetWidth || 1))
            )
            const w = host.offsetWidth
            const h = host.offsetHeight
            setSize((p) => (p.w === w && p.h === h ? p : { w, h }))
            setReady(true)
        } catch {
            setReady(false)
        }
    }

    React.useEffect(() => {
        if (!on) return
        const cv = canvasRef.current
        if (!cv) return
        if (!sceneRef.current)
            sceneRef.current = document.createElement("canvas")
        let r: GlassRenderer | null = null
        try {
            r = createGlassRenderer(cv, () => setReady(false))
        } catch {
            r = null
        }
        if (!r) return
        rendererRef.current = r
        return () => {
            r?.dispose()
            rendererRef.current = null
            setReady(false)
        }
    }, [on])

    React.useEffect(() => {
        if (on) drawRef.current()
    })

    if (!on) return null
    return (
        <>
            <canvas
                ref={canvasRef}
                data-glass-layer=""
                aria-hidden="true"
                style={glassCanvasStyle(
                    glassMaskOf(size.w, size.h, s),
                    ready,
                    props.zIndex
                )}
            />
            <GlassExtras s={s} ready={ready} zIndex={props.zIndex} />
        </>
    )
}

/* ---------------- Live layer ---------------- */

const glassToMs = (v: string) => {
    const n = parseFloat(v)
    if (isNaN(n)) return 0
    return v.trim().endsWith("ms") ? n : n * 1000
}

// Longest running time of the transitions/animations on an element.
const glassMotionSpan = (el: Element, kind: "transition" | "animation") => {
    const cs = getComputedStyle(el)
    const dur = (
        kind === "transition" ? cs.transitionDuration : cs.animationDuration
    )
        .split(",")
        .map(glassToMs)
    const delay = (
        kind === "transition" ? cs.transitionDelay : cs.animationDelay
    )
        .split(",")
        .map(glassToMs)
    const loops =
        kind === "animation"
            ? cs.animationIterationCount
                  .split(",")
                  .map((v) =>
                      v.trim() === "infinite" ? 1 : parseFloat(v) || 1
                  )
            : [1]
    let max = 0
    dur.forEach((d, i) => {
        const t = d * loops[i % loops.length] + (delay[i % delay.length] || 0)
        if (t > max) max = t
    })
    return Math.min(max, 8000)
}

const glassInLayer = (t: EventTarget | Node | null) =>
    t instanceof Element && !!t.closest("[data-glass-layer]")

const glassEdgeClipPlaying = (host: HTMLElement, s: GlassSettings) => {
    const W = host.offsetWidth
    const H = host.offsetHeight
    const box = host.getBoundingClientRect()
    const k = box.width / W || 1
    const clips = host.querySelectorAll<HTMLVideoElement>("[data-glass] video")
    for (let i = 0; i < clips.length; i++) {
        const v = clips[i]
        if (v.paused || v.readyState < 2) continue
        const r = v.getBoundingClientRect()
        const rect = {
            x: (r.left - box.left) / k,
            y: (r.top - box.top) / k,
            w: r.width / k,
            h: r.height / k,
        }
        if (glassNearEdge(rect, W, H, s)) return true
    }
    return false
}

// Starts locked out; runs only while the host is on screen and the tab is
// visible; sleeps whenever nothing under the glass is changing. It wakes on
// DOM style/class/src changes, CSS transitions/animations, pointer hover,
// media loads, playing edge videos, resize, and refresh().
const GlassEdgeLive = React.forwardRef<GlassEdgeHandle, GlassEdgeProps>(
    function GlassEdgeLive(props, ref) {
        const s = resolveGlass(props.settings)
        const [broken, setBroken] = React.useState(false)
        const on = s.enabled && glassAnySide(s) && !broken

        const canvasRef = React.useRef<HTMLCanvasElement>(null)
        const sceneRef = React.useRef<HTMLCanvasElement | null>(null)
        const rendererRef = React.useRef<GlassRenderer | null>(null)
        const propsRef = React.useRef(props)
        propsRef.current = props
        const onRef = React.useRef(on)
        onRef.current = on
        const seenRef = React.useRef(false)
        const tabRef = React.useRef(true)
        const readyRef = React.useRef(false)
        const [ready, setReady] = React.useState(false)
        const [size, setSize] = React.useState({ w: 700, h: 700 })
        const loop = React.useRef({ frame: 0, dirty: true, busyUntil: 0 })
        const pics = React.useRef(new Map<string, HTMLImageElement | null>())
        const cleanClips = React.useRef(
            new WeakMap<HTMLVideoElement, boolean>()
        )
        const probeRef = React.useRef<HTMLCanvasElement | null>(null)

        const permit = () => onRef.current && seenRef.current && tabRef.current

        const park = () => {
            const g = loop.current
            if (g.frame) cancelAnimationFrame(g.frame)
            g.frame = 0
        }

        const clipIsClean = (v: HTMLVideoElement) => {
            const known = cleanClips.current.get(v)
            if (known !== undefined) return known
            if (!probeRef.current) {
                probeRef.current = document.createElement("canvas")
                probeRef.current.width = 1
                probeRef.current.height = 1
            }
            let ok = false
            try {
                const pc = probeRef.current.getContext("2d", {
                    willReadFrequently: true,
                } as any) as CanvasRenderingContext2D | null
                if (pc) {
                    pc.drawImage(v, 0, 0, 1, 1)
                    pc.getImageData(0, 0, 1, 1)
                    ok = true
                }
            } catch {
                ok = false
            }
            cleanClips.current.set(v, ok)
            return ok
        }

        const pokeRef = React.useRef<() => void>(() => {})
        const tickRef = React.useRef<() => void>(() => {})

        const draw = () => {
            const host = propsRef.current.hostRef.current
            const r = rendererRef.current
            const scene = sceneRef.current
            if (!host || !r || !scene) return
            const st = resolveGlass(propsRef.current.settings)
            try {
                const ok = paintGlassScene(
                    host,
                    scene,
                    st,
                    propsRef.current.fade,
                    propsRef.current.background,
                    {
                        pictureFor: glassPictureCache(pics.current, () =>
                            pokeRef.current()
                        ),
                        clipIsClean,
                    }
                )
                if (!ok) return
                r.render(
                    scene,
                    glassFrameOf(st, scene.width / (host.offsetWidth || 1))
                )
                if (!readyRef.current) {
                    readyRef.current = true
                    setReady(true)
                }
            } catch {
                setBroken(true)
            }
        }

        tickRef.current = () => {
            const g = loop.current
            g.frame = 0
            if (!permit() || !rendererRef.current) return
            const host = propsRef.current.hostRef.current
            if (!host) return
            const st = resolveGlass(propsRef.current.settings)
            const now = performance.now()
            const live = glassEdgeClipPlaying(host, st)
            if (g.dirty || live || now < g.busyUntil) {
                g.dirty = false
                draw()
            }
            if (g.dirty || live || now < g.busyUntil)
                g.frame = requestAnimationFrame(() => tickRef.current())
        }

        pokeRef.current = () => {
            const g = loop.current
            g.dirty = true
            if (g.frame || !rendererRef.current || !permit()) return
            g.frame = requestAnimationFrame(() => tickRef.current())
        }

        const busy = (ms: number) => {
            const g = loop.current
            g.busyUntil = Math.max(g.busyUntil, performance.now() + ms)
            pokeRef.current()
        }

        React.useImperativeHandle(
            ref,
            () => ({ refresh: () => pokeRef.current() }),
            []
        )

        // Visibility gate: viewport + tab.
        React.useEffect(() => {
            const el = props.hostRef.current
            if (!el) return
            const sync = () => {
                if (seenRef.current && tabRef.current) pokeRef.current()
                else park()
            }
            const onTab = () => {
                tabRef.current = document.visibilityState !== "hidden"
                sync()
            }
            onTab()
            document.addEventListener("visibilitychange", onTab)
            let io: IntersectionObserver | null = null
            if (typeof IntersectionObserver === "undefined") {
                seenRef.current = true
                sync()
            } else {
                io = new IntersectionObserver(
                    (list) => {
                        seenRef.current = list.some((r) => r.isIntersecting)
                        sync()
                    },
                    { threshold: 0.01 }
                )
                io.observe(el)
            }
            return () => {
                document.removeEventListener("visibilitychange", onTab)
                io?.disconnect()
                seenRef.current = false
                park()
            }
        }, [props.hostRef])

        // WebGL renderer lifetime.
        React.useEffect(() => {
            if (!on) return
            const cv = canvasRef.current
            if (!cv) return
            if (!sceneRef.current)
                sceneRef.current = document.createElement("canvas")
            let r: GlassRenderer | null = null
            try {
                r = createGlassRenderer(cv, () => setBroken(true))
            } catch {
                r = null
            }
            if (!r) {
                setBroken(true)
                return
            }
            rendererRef.current = r
            pokeRef.current()
            return () => {
                park()
                r?.dispose()
                rendererRef.current = null
                readyRef.current = false
                setReady(false)
            }
        }, [on])

        // Wake signals from the host.
        React.useEffect(() => {
            if (!on) return
            const el = props.hostRef.current
            if (!el) return
            const read = () => {
                const w = el.offsetWidth || 700
                const h = el.offsetHeight || 700
                setSize((p) => (p.w === w && p.h === h ? p : { w, h }))
                pokeRef.current()
            }
            read()
            let ro: ResizeObserver | null = null
            if (typeof ResizeObserver === "undefined")
                window.addEventListener("resize", read)
            else {
                ro = new ResizeObserver(read)
                ro.observe(el)
            }
            const poke = (e: Event) => {
                if (!glassInLayer(e.target)) pokeRef.current()
            }
            const hover = (e: Event) => {
                if (!glassInLayer(e.target)) busy(120)
            }
            const onTransition = (e: Event) => {
                if (glassInLayer(e.target) || !(e.target instanceof Element))
                    return
                busy(glassMotionSpan(e.target, "transition") + 80)
            }
            const onAnimation = (e: Event) => {
                if (glassInLayer(e.target) || !(e.target instanceof Element))
                    return
                busy(glassMotionSpan(e.target, "animation") + 80)
            }
            const hoverEvents = ["pointerover", "pointerout", "pointerleave"]
            const mediaEvents = ["load", "loadeddata", "playing", "seeked"]
            hoverEvents.forEach((n) =>
                el.addEventListener(n, hover, { passive: true })
            )
            mediaEvents.forEach((n) => el.addEventListener(n, poke, true))
            el.addEventListener("transitionrun", onTransition)
            el.addEventListener("animationstart", onAnimation)
            el.addEventListener("animationiteration", onAnimation)
            let mo: MutationObserver | null = null
            if (typeof MutationObserver !== "undefined") {
                mo = new MutationObserver((records) => {
                    for (const r of records) {
                        if (!glassInLayer(r.target)) {
                            pokeRef.current()
                            return
                        }
                    }
                })
                mo.observe(el, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: ["style", "class", "src"],
                })
            }
            return () => {
                ro?.disconnect()
                window.removeEventListener("resize", read)
                hoverEvents.forEach((n) => el.removeEventListener(n, hover))
                mediaEvents.forEach((n) =>
                    el.removeEventListener(n, poke, true)
                )
                el.removeEventListener("transitionrun", onTransition)
                el.removeEventListener("animationstart", onAnimation)
                el.removeEventListener("animationiteration", onAnimation)
                mo?.disconnect()
            }
        }, [on, props.hostRef])

        // Settings or host content changed.
        React.useEffect(() => {
            pokeRef.current()
        })

        React.useEffect(() => () => park(), [])

        if (!on) return null
        return (
            <>
                <canvas
                    ref={canvasRef}
                    data-glass-layer=""
                    aria-hidden="true"
                    style={glassCanvasStyle(
                        glassMaskOf(size.w, size.h, s),
                        ready,
                        props.zIndex
                    )}
                />
                <GlassExtras s={s} ready={ready} zIndex={props.zIndex} />
            </>
        )
    }
)

/* ---------------- Property controls ---------------- */

const glassOff = (o: any) => o.enabled === false

const glassEdgeControls: any = {
    type: ControlType.Object,
    title: "Glass Edge",
    controls: {
        enabled: {
            type: ControlType.Boolean,
            title: "Enabled",
            defaultValue: true,
        },
        canvasPreview: {
            type: ControlType.Boolean,
            title: "Show on Canvas",
            defaultValue: false,
            hidden: glassOff,
        },
        left: {
            type: ControlType.Boolean,
            title: "Left",
            defaultValue: true,
            hidden: glassOff,
        },
        right: {
            type: ControlType.Boolean,
            title: "Right",
            defaultValue: true,
            hidden: glassOff,
        },
        top: {
            type: ControlType.Boolean,
            title: "Top",
            defaultValue: false,
            hidden: glassOff,
        },
        bottom: {
            type: ControlType.Boolean,
            title: "Bottom",
            defaultValue: false,
            hidden: glassOff,
        },
        edgeWidth: {
            type: ControlType.Number,
            title: "Edge Width",
            min: 10,
            max: 300,
            step: 1,
            unit: "px",
            defaultValue: 70,
            hidden: glassOff,
        },
        depth: {
            type: ControlType.Number,
            title: "Depth",
            min: 0,
            max: 4,
            step: 0.05,
            defaultValue: 1.35,
            hidden: glassOff,
        },
        ior: {
            type: ControlType.Number,
            title: "IOR",
            min: 1.05,
            max: 3,
            step: 0.05,
            defaultValue: 2.2,
            hidden: glassOff,
        },
        aberration: {
            type: ControlType.Number,
            title: "Aberration",
            min: 0,
            max: 1,
            step: 0.05,
            defaultValue: 0.75,
            hidden: glassOff,
        },
        blur: {
            type: ControlType.Number,
            title: "Blur",
            min: 0,
            max: 100,
            step: 1,
            unit: "px",
            defaultValue: 18,
            hidden: glassOff,
        },
        blurReach: {
            type: ControlType.Number,
            title: "Blur Reach",
            min: 1,
            max: 300,
            step: 1,
            unit: "px",
            defaultValue: 48,
            hidden: (o: any) => glassOff(o) || o.blur === 0,
        },
        sheen: {
            type: ControlType.Number,
            title: "Sheen",
            min: 0,
            max: 2,
            step: 0.05,
            defaultValue: 0.12,
            hidden: glassOff,
        },
        edgeLight: {
            type: ControlType.Number,
            title: "Edge Light",
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: 0.18,
            hidden: glassOff,
        },
        rim: {
            type: ControlType.Number,
            title: "Rim Line",
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: 0.25,
            hidden: glassOff,
        },
        rimColor: {
            type: ControlType.Color,
            title: "Rim Color",
            defaultValue: "#FFFFFF",
            hidden: (o: any) => glassOff(o) || !o.rim,
        },
        rimWidth: {
            type: ControlType.Number,
            title: "Rim Width",
            min: 0.5,
            max: 6,
            step: 0.5,
            unit: "px",
            defaultValue: 1,
            hidden: (o: any) => glassOff(o) || !o.rim,
        },
        tint: {
            type: ControlType.Color,
            title: "Tint",
            defaultValue: "#DCEBFF",
            hidden: glassOff,
        },
        tintAmount: {
            type: ControlType.Number,
            title: "Tint Amount",
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: 0.06,
            hidden: glassOff,
        },
        grain: {
            type: ControlType.Number,
            title: "Frost Grain",
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: 0.08,
            hidden: glassOff,
        },
        shade: {
            type: ControlType.Number,
            title: "Edge Shade",
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: 0.18,
            hidden: glassOff,
        },
    },
}

/* ================= Carousel ================= */

type MediaKind = "image" | "video"
type MediaSource = "upload" | "url"

interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface ArcCard {
    kind?: MediaKind
    source?: MediaSource
    image?: ImageValue
    imageUrl?: string
    video?: string
    videoUrl?: string
    poster?: ImageValue
    title?: string
    description?: string
    link?: string
    newTab?: boolean
}

interface ArcframeCarouselProps {
    media: ArcCard[]
    layout: { width: number; height: number; gap: number; curve: number }
    motion: { autoRotate: boolean; speed: number; direction: "left" | "right" }
    interaction: { drag: boolean; wheel: boolean }
    typography: {
        titleFont: any
        titleColor: string
        descriptionFont: any
        descriptionColor: string
    }
    cardStyle: { radius: string; shadow: string; border: any }
    hoverZoom: { enabled: boolean; scale: number; transition: number }
    overlay: { show: boolean; color: string; spread: number; height: number }
    lightbox: { enabled: boolean; backdropColor: string; borderRadius: number }
    glass: GlassEdgeSettings & { backdrop?: string }
}

const IMG_A =
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
const IMG_B =
    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg"
const IMG_C =
    "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg"
const IMG_D =
    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg"
const IMG_E =
    "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg"

const DEFAULT_CARDS: ArcCard[] = [
    {
        kind: "image",
        source: "upload",
        image: { src: IMG_A, alt: "Brass & Basalt" },
        title: "Brass & Basalt",
        description: "Warm metal against cold stone, caught in a single frame.",
    },
    {
        kind: "image",
        source: "upload",
        image: { src: IMG_B, alt: "The Long Exhale" },
        title: "The Long Exhale",
        description:
            "A pause stretched wide enough to let the light settle in.",
    },
    {
        kind: "image",
        source: "upload",
        image: { src: IMG_C, alt: "Orchard Static" },
        title: "Orchard Static",
        description: "Late-summer haze humming quietly between the rows.",
    },
    {
        kind: "image",
        source: "upload",
        image: { src: IMG_D, alt: "Glasshouse Hours" },
        title: "Glasshouse Hours",
        description:
            "Damp air, green shadows and the slow tick of growing things.",
    },
    {
        kind: "image",
        source: "upload",
        image: { src: IMG_E, alt: "Low Tide Ledger" },
        title: "Low Tide Ledger",
        description: "Everything the water left behind, counted one by one.",
    },
    {
        kind: "image",
        source: "upload",
        image: { src: IMG_B, alt: "Cinder Path" },
        title: "Cinder Path",
        description:
            "A narrow trail of embers leading somewhere worth the walk.",
    },
    {
        kind: "image",
        source: "upload",
        image: { src: IMG_D, alt: "Paper Weather" },
        title: "Paper Weather",
        description:
            "Thin clouds folding over a sky that can't make up its mind.",
    },
    {
        kind: "image",
        source: "upload",
        image: { src: IMG_C, alt: "North Window" },
        title: "North Window",
        description: "Cool, even light that lets every surface tell the truth.",
    },
]

// ——— Pure helpers (no markup, safe to share between branches) ———

const ARC_REACH = 600
const RAD_TO_DEG = 180 / Math.PI

function wrap(value: number, span: number) {
    return ((value % span) + span) % span
}

function arcAt(x: number, curveHeight: number) {
    const k = curveHeight / (ARC_REACH * ARC_REACH)
    return { y: k * x * x, deg: Math.atan(2 * k * x) * RAD_TO_DEG }
}

function imageOf(card: ArcCard) {
    return card.source === "url" ? card.imageUrl || "" : card.image?.src || ""
}

function videoOf(card: ArcCard) {
    return card.source === "url" ? card.videoUrl || "" : card.video || ""
}

function isVideo(card: ArcCard) {
    return card.kind === "video" && videoOf(card) !== ""
}

function resolve(props: Partial<ArcframeCarouselProps>) {
    const layout =
        props.layout ?? ({} as Partial<ArcframeCarouselProps["layout"]>)
    const motion =
        props.motion ?? ({} as Partial<ArcframeCarouselProps["motion"]>)
    const interaction =
        props.interaction ??
        ({} as Partial<ArcframeCarouselProps["interaction"]>)
    const type =
        props.typography ?? ({} as Partial<ArcframeCarouselProps["typography"]>)
    const card =
        props.cardStyle ?? ({} as Partial<ArcframeCarouselProps["cardStyle"]>)
    const zoom =
        props.hoverZoom ?? ({} as Partial<ArcframeCarouselProps["hoverZoom"]>)
    const shade =
        props.overlay ?? ({} as Partial<ArcframeCarouselProps["overlay"]>)
    const box =
        props.lightbox ?? ({} as Partial<ArcframeCarouselProps["lightbox"]>)

    return {
        media: props.media ?? DEFAULT_CARDS,
        slideWidth: layout.width ?? 210,
        slideHeight: layout.height ?? 300,
        gap: layout.gap ?? 28,
        curveHeight: layout.curve ?? 140,
        autoRotate: motion.autoRotate ?? true,
        speed: motion.speed ?? 1.5,
        direction: motion.direction ?? "left",
        enableDrag: interaction.drag ?? true,
        enableScroll: interaction.wheel ?? true,
        titleFont: type.titleFont ?? {
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: 1.2,
        },
        titleColor: type.titleColor ?? "#FFFFFF",
        descriptionFont: type.descriptionFont ?? {
            fontSize: "14px",
            lineHeight: 1.4,
        },
        descriptionColor: type.descriptionColor ?? "#CCCCCC",
        cardBorderRadius: card.radius ?? "16px",
        cardShadow: card.shadow ?? "0 20px 50px rgba(0,0,0,0.5)",
        cardBorder: card.border,
        hoverZoom: {
            enabled: zoom.enabled ?? true,
            scale: zoom.scale ?? 1.05,
            transition: zoom.transition ?? 0.3,
        },
        overlay: {
            show: shade.show ?? true,
            color: shade.color ?? "rgba(0, 0, 0, 0.8)",
            spread: shade.spread ?? 120,
            height: shade.height ?? 100,
        },
        lightbox: {
            enabled: box.enabled ?? true,
            backdropColor: box.backdropColor ?? "rgba(0, 0, 0, 0.85)",
            borderRadius: box.borderRadius ?? 16,
        },
        glass: props.glass ?? {},
        glassBackdrop: props.glass?.backdrop ?? "#000000",
    }
}

const GLASS_LAYER_Z = 1150

type Settings = ReturnType<typeof resolve>

// ——— Live-only hooks ———

function useOnScreen(ref: React.RefObject<HTMLElement>) {
    const [onScreen, setOnScreen] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setOnScreen(true)
            return
        }
        const io = new IntersectionObserver(
            ([entry]) => setOnScreen(entry.isIntersecting),
            { threshold: 0.01 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])
    return onScreen
}

function useTabVisible() {
    const [visible, setVisible] = useState(() =>
        typeof document === "undefined"
            ? true
            : document.visibilityState !== "hidden"
    )
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setVisible(document.visibilityState !== "hidden")
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return visible
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(mq.matches)
        sync()
        if (mq.addEventListener) {
            mq.addEventListener("change", sync)
            return () => mq.removeEventListener("change", sync)
        }
        mq.addListener(sync)
        return () => mq.removeListener(sync)
    }, [])
    return reduced
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function ArcframeCarousel(props: ArcframeCarouselProps) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticArcframeCarousel {...props} />
    return <LiveArcframeCarousel {...props} />
}

// ——— Static branch: plain divs, at rest, nothing running ———

function StaticArcframeCarousel(props: ArcframeCarouselProps) {
    const s = resolve(props)
    const count = s.media.length
    const stride = s.slideWidth + s.gap

    const slots: number[] = []
    if (count > 0) {
        const half = Math.min(7, Math.floor((count * 3 - 1) / 2))
        for (let k = -half; k <= half; k++) slots.push(k)
    }
    const hostRef = React.useRef<HTMLDivElement>(null)

    return (
        <div
            ref={hostRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {count === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(128,128,128,0.9)",
                        fontSize: 14,
                    }}
                >
                    Add cards to begin
                </div>
            )}
            {slots.map((k) => {
                const card = s.media[wrap(k, count)]
                const x = k * stride
                const { y, deg } = arcAt(x, s.curveHeight)
                const still = isVideo(card)
                    ? card.poster?.src || ""
                    : imageOf(card)
                return (
                    <div
                        key={k}
                        data-glass=""
                        style={{
                            position: "absolute",
                            left: `calc(50% + ${x - s.slideWidth / 2}px)`,
                            top: `calc(50% + ${y - s.slideHeight / 2}px)`,
                            width: s.slideWidth,
                            height: s.slideHeight,
                            transform: `rotate(${deg}deg)`,
                            zIndex: Math.max(1, Math.round(1000 - Math.abs(x))),
                            borderRadius: s.cardBorderRadius,
                            overflow: "hidden",
                            boxShadow: s.cardShadow,
                            backgroundColor: "#1e293b",
                            ...s.cardBorder,
                        }}
                    >
                        {isVideo(card) && !still ? (
                            <video
                                src={videoOf(card)}
                                muted
                                playsInline
                                autoPlay={false}
                                preload="metadata"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : still ? (
                            <img
                                src={still}
                                alt={card.title || "Card media"}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : null}
                    </div>
                )
            })}
            <GlassEdgeStill
                hostRef={hostRef}
                settings={s.glass}
                background={s.glassBackdrop}
                zIndex={GLASS_LAYER_Z}
            />
        </div>
    )
}

// ——— Live branch ———

function LiveArcframeCarousel(props: ArcframeCarouselProps) {
    const s = resolve(props)
    const count = s.media.length
    const ring = count > 0 ? [...s.media, ...s.media, ...s.media] : []
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")

    const rootRef = useRef<HTMLDivElement>(null)
    const cardEls = useRef(new Map<number, HTMLDivElement>())
    const videoEls = useRef(new Map<number, HTMLVideoElement>())
    const playing = useRef(new Set<number>())
    const size = useRef({ w: 0, h: 0 })
    const motion = useRef({
        offset: 0,
        target: 0,
        velocity: 0,
        last: 0,
        raf: 0,
        dragging: false,
        wheelUntil: 0,
        pointerDown: false,
        startX: 0,
        startY: 0,
        startTarget: 0,
        travel: 0,
        lastX: 0,
        lastT: 0,
        pressed: null as number | null,
    })

    const settingsRef = useRef<Settings>(s)
    settingsRef.current = s

    const [grabbing, setGrabbing] = useState(false)
    const [hovered, setHovered] = useState<number | null>(null)
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const onScreen = useOnScreen(rootRef)
    const tabVisible = useTabVisible()
    const reduced = useReducedMotion()
    const permitted = onScreen && tabVisible

    const permitRef = useRef(false)
    permitRef.current = permitted
    const reducedRef = useRef(false)
    reducedRef.current = reduced
    const lightboxRef = useRef(false)
    lightboxRef.current = openIndex !== null

    // Places every card on the arch and keeps card videos in step with
    // visibility. Reads refs only, so a frame from an older render is safe.
    const layout = () => {
        const { w, h } = size.current
        const p = settingsRef.current
        const n = p.media.length
        if (!w || !n) return
        const stride = p.slideWidth + p.gap
        const span = n * 3 * stride
        const reach = w / 2 + p.slideWidth
        const offset = motion.current.offset
        const mayPlay = permitRef.current && !lightboxRef.current

        cardEls.current.forEach((el, i) => {
            const x = wrap(i * stride + offset + span / 2, span) - span / 2
            const shown = Math.abs(x) < reach
            if (!shown) {
                if (el.style.display !== "none") el.style.display = "none"
            } else {
                const { y, deg } = arcAt(x, p.curveHeight)
                el.style.display = "block"
                el.style.transform = `translate3d(${w / 2 + x - p.slideWidth / 2}px, ${h / 2 + y - p.slideHeight / 2}px, 0) rotate(${deg}deg)`
                el.style.zIndex = String(
                    Math.max(1, Math.round(1000 - Math.abs(x)))
                )
            }

            const video = videoEls.current.get(i)
            if (!video) return
            const want = shown && mayPlay
            if (want && !playing.current.has(i)) {
                playing.current.add(i)
                const attempt = video.play()
                if (attempt && attempt.catch) {
                    attempt.catch(() => playing.current.delete(i))
                }
            } else if (!want && playing.current.has(i)) {
                playing.current.delete(i)
                video.pause()
            }
        })
    }

    const step = (now: number) => {
        const m = motion.current
        m.raf = 0
        if (!permitRef.current) {
            m.last = 0
            return
        }
        const dt = m.last ? Math.min(64, now - m.last) : 16.67
        m.last = now
        const frames = dt / 16.67
        const p = settingsRef.current

        const idle = !m.dragging && now > m.wheelUntil && !lightboxRef.current
        const cruising =
            idle && p.autoRotate && p.speed > 0 && !reducedRef.current

        if (idle) {
            if (cruising) {
                m.target +=
                    (p.direction === "left" ? -1 : 1) * dt * 0.05 * p.speed
            }
            if (Math.abs(m.velocity) > 0.01) {
                m.target += m.velocity * dt * 0.05
                m.velocity *= Math.pow(0.95, frames)
            } else {
                m.velocity = 0
            }
        }

        m.offset += (m.target - m.offset) * (1 - Math.pow(0.9, frames))
        layout()

        const settled =
            !cruising &&
            !m.dragging &&
            m.velocity === 0 &&
            now > m.wheelUntil &&
            Math.abs(m.target - m.offset) < 0.05

        if (settled) {
            m.offset = m.target
            layout()
            m.last = 0
            return
        }
        m.raf = requestAnimationFrame(step)
    }

    const wake = () => {
        const m = motion.current
        if (!m.raf && permitRef.current) {
            m.raf = requestAnimationFrame(step)
        }
    }

    const park = () => {
        const m = motion.current
        if (m.raf) cancelAnimationFrame(m.raf)
        m.raf = 0
        m.last = 0
        m.dragging = false
        m.pointerDown = false
        m.velocity = 0
        m.target = m.offset
        m.wheelUntil = 0
        playing.current.forEach((i) => videoEls.current.get(i)?.pause())
        playing.current.clear()
        setGrabbing(false)
    }

    // Measure the frame
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            size.current = { w: el.offsetWidth, h: el.offsetHeight }
            layout()
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Run only while on screen and the tab is visible
    useEffect(() => {
        if (permitted) {
            motion.current.last = 0
            layout()
            wake()
        } else {
            park()
        }
    }, [permitted])

    // Re-layout and wake when settings that affect motion change
    useEffect(() => {
        layout()
        wake()
    }, [
        count,
        reduced,
        s.autoRotate,
        s.speed,
        s.direction,
        s.slideWidth,
        s.slideHeight,
        s.gap,
        s.curveHeight,
    ])

    // Cancel everything on unmount
    useEffect(() => {
        return () => {
            const m = motion.current
            if (m.raf) cancelAnimationFrame(m.raf)
            m.raf = 0
            playing.current.forEach((i) => videoEls.current.get(i)?.pause())
            playing.current.clear()
        }
    }, [])

    // Wheel / trackpad scroll (non-passive so preventDefault sticks)
    useEffect(() => {
        const el = rootRef.current
        if (!el || !s.enableScroll) return
        const onWheel = (e: WheelEvent) => {
            if (lightboxRef.current) return
            e.preventDefault()
            const delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            const m = motion.current
            m.target += delta * 0.5
            m.wheelUntil = performance.now() + 150
            wake()
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [s.enableScroll])

    // Lightbox: Escape to close, lock page scroll, pause/resume card videos
    useEffect(() => {
        layout()
        wake()
        if (openIndex === null || typeof document === "undefined") return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenIndex(null)
        }
        window.addEventListener("keydown", onKey)
        const previous = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = previous
        }
    }, [openIndex])

    // ——— Pointer handling (drag + click → link or lightbox) ———

    const onPointerDown = (e: React.PointerEvent) => {
        if (lightboxRef.current) return
        const m = motion.current
        const hit = (e.target as HTMLElement).closest?.(
            `[data-${uid}-card]`
        ) as HTMLElement | null
        m.pressed = hit ? Number(hit.getAttribute(`data-${uid}-card`)) : null
        m.pointerDown = true
        m.startX = e.clientX
        m.startY = e.clientY
        m.travel = 0

        if (!s.enableDrag) return
        m.dragging = true
        m.startTarget = m.target
        m.lastX = e.clientX
        m.lastT = performance.now()
        m.velocity = 0
        setGrabbing(true)
        rootRef.current?.setPointerCapture(e.pointerId)
        wake()
    }

    const onPointerMove = (e: React.PointerEvent) => {
        const m = motion.current
        if (lightboxRef.current || !m.pointerDown) return
        m.travel = Math.max(
            m.travel,
            Math.abs(e.clientX - m.startX),
            Math.abs(e.clientY - m.startY)
        )
        if (!m.dragging) return
        const now = performance.now()
        const elapsed = now - m.lastT
        m.target = m.startTarget + (e.clientX - m.startX)
        if (elapsed > 0) m.velocity = ((e.clientX - m.lastX) / elapsed) * 16
        m.lastX = e.clientX
        m.lastT = now
        wake()
    }

    const onPointerUp = (e: React.PointerEvent) => {
        const m = motion.current
        if (lightboxRef.current) return
        const wasClick = m.pointerDown && m.travel < 8
        const pressed = m.pressed
        m.pointerDown = false
        m.pressed = null

        if (m.dragging) {
            m.dragging = false
            setGrabbing(false)
            const root = rootRef.current
            if (root && root.hasPointerCapture?.(e.pointerId)) {
                root.releasePointerCapture(e.pointerId)
            }
        }
        wake()

        if (!wasClick || pressed === null || count === 0) return
        const index = pressed % count
        const card = s.media[index]
        if (card?.link) {
            if (typeof window === "undefined") return
            if (card.newTab) {
                window.open(card.link, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = card.link
            }
        } else if (s.lightbox.enabled) {
            setOpenIndex(index)
        }
    }

    // ——— Render ———

    const zoom = s.hoverZoom.enabled ? s.hoverZoom.scale : 1
    const dur = s.hoverZoom.transition ?? 0.3
    const shade = s.overlay.color
    const overlayFill = `radial-gradient(ellipse ${s.overlay.spread}% ${s.overlay.height}% at 50% 100%, ${shade} 0%, color-mix(in srgb, ${shade} 75%, transparent) 25%, color-mix(in srgb, ${shade} 38%, transparent) 50%, transparent 100%)`

    const openCard = openIndex !== null ? s.media[openIndex] : null

    const lightboxNode =
        openCard && typeof document !== "undefined"
            ? createPortal(
                  <div
                      onClick={() => setOpenIndex(null)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerMove={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                      aria-label={openCard.title || "Media preview"}
                      style={{
                          position: "fixed",
                          inset: 0,
                          zIndex: 99999,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: s.lightbox.backdropColor,
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          padding: "40px 24px",
                          animation: `${uid}-fade 0.25s ease-out`,
                      }}
                  >
                      <style>{`
                          @keyframes ${uid}-fade {
                              from { opacity: 0; }
                              to { opacity: 1; }
                          }
                          @keyframes ${uid}-pop {
                              from { opacity: 0; transform: scale(0.94); }
                              to { opacity: 1; transform: scale(1); }
                          }
                      `}</style>
                      <button
                          onClick={(e) => {
                              e.stopPropagation()
                              setOpenIndex(null)
                          }}
                          aria-label="Close preview"
                          style={{
                              position: "fixed",
                              top: 20,
                              right: 20,
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              border: "none",
                              background: "rgba(255, 255, 255, 0.95)",
                              color: "#111",
                              fontSize: 18,
                              lineHeight: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              zIndex: 2,
                              boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                          }}
                      >
                          ✕
                      </button>
                      <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                              position: "relative",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              maxWidth: "min(1000px, 92vw)",
                              maxHeight: "88vh",
                              animation: `${uid}-pop 0.3s ease-out`,
                          }}
                      >
                          {isVideo(openCard) ? (
                              <video
                                  src={videoOf(openCard)}
                                  poster={openCard.poster?.src}
                                  controls
                                  autoPlay
                                  loop
                                  playsInline
                                  style={{
                                      maxWidth: "100%",
                                      maxHeight: "68vh",
                                      objectFit: "contain",
                                      borderRadius: s.lightbox.borderRadius,
                                      boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                                      display: "block",
                                      background: "#000",
                                  }}
                              />
                          ) : (
                              <img
                                  src={imageOf(openCard)}
                                  srcSet={
                                      openCard.source === "url"
                                          ? undefined
                                          : openCard.image?.srcSet
                                  }
                                  alt={
                                      openCard.image?.alt ||
                                      openCard.title ||
                                      "Preview image"
                                  }
                                  style={{
                                      maxWidth: "100%",
                                      maxHeight: "68vh",
                                      objectFit: "contain",
                                      borderRadius: s.lightbox.borderRadius,
                                      boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                                      display: "block",
                                  }}
                              />
                          )}
                          {(openCard.title || openCard.description) && (
                              <div
                                  style={{
                                      marginTop: 20,
                                      textAlign: "center",
                                      maxWidth: 640,
                                  }}
                              >
                                  {openCard.title && (
                                      <h3
                                          style={{
                                              margin: 0,
                                              marginBottom: openCard.description
                                                  ? 8
                                                  : 0,
                                              color: s.titleColor,
                                              ...s.titleFont,
                                          }}
                                      >
                                          {openCard.title}
                                      </h3>
                                  )}
                                  {openCard.description && (
                                      <p
                                          style={{
                                              margin: 0,
                                              color: s.descriptionColor,
                                              ...s.descriptionFont,
                                          }}
                                      >
                                          {openCard.description}
                                      </p>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>,
                  document.body
              )
            : null

    return (
        <div
            ref={rootRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: s.enableDrag
                    ? grabbing
                        ? "grabbing"
                        : "grab"
                    : "default",
                touchAction: s.enableDrag ? "none" : "pan-y",
                userSelect: "none",
            }}
        >
            {count === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(128,128,128,0.9)",
                        fontSize: 14,
                    }}
                >
                    Add cards to begin
                </div>
            )}

            {ring.map((card, index) => {
                const active = hovered === index
                const clickable = Boolean(card.link) || s.lightbox.enabled
                const mediaStyle: React.CSSProperties = {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    pointerEvents: "none",
                    transform:
                        active && s.hoverZoom.enabled
                            ? `scale(${zoom})`
                            : "scale(1)",
                    transition: `transform ${dur}s ease-out`,
                }
                const cardAttr = { [`data-${uid}-card`]: index }

                return (
                    <div
                        key={index}
                        {...cardAttr}
                        data-glass=""
                        ref={(el) => {
                            if (el) cardEls.current.set(index, el)
                            else cardEls.current.delete(index)
                        }}
                        onPointerEnter={() => setHovered(index)}
                        onPointerLeave={() =>
                            setHovered((h) => (h === index ? null : h))
                        }
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            display: "none",
                            width: s.slideWidth,
                            height: s.slideHeight,
                            borderRadius: s.cardBorderRadius,
                            overflow: "hidden",
                            boxShadow: s.cardShadow,
                            backgroundColor: "#1e293b",
                            cursor: clickable ? "pointer" : undefined,
                            ...s.cardBorder,
                        }}
                    >
                        {isVideo(card) ? (
                            <video
                                ref={(el) => {
                                    if (el) {
                                        videoEls.current.set(index, el)
                                    } else {
                                        videoEls.current.delete(index)
                                        playing.current.delete(index)
                                    }
                                }}
                                src={videoOf(card)}
                                poster={card.poster?.src}
                                crossOrigin={
                                    card.source === "url"
                                        ? undefined
                                        : "anonymous"
                                }
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                style={mediaStyle}
                            />
                        ) : (
                            <img
                                src={imageOf(card)}
                                srcSet={
                                    card.source === "url"
                                        ? undefined
                                        : card.image?.srcSet
                                }
                                alt={
                                    card.image?.alt ||
                                    card.title ||
                                    `Card ${(index % count) + 1}`
                                }
                                draggable={false}
                                style={mediaStyle}
                            />
                        )}

                        {s.overlay.show && (card.title || card.description) && (
                            <div
                                data-glass-scrim=""
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    color: shade,
                                    background: overlayFill,
                                    padding: 20,
                                    paddingTop: 60,
                                    opacity: active ? 1 : 0,
                                    transform: active
                                        ? "translateY(0)"
                                        : "translateY(20px)",
                                    transition: `opacity ${dur}s ease-out, transform ${dur}s ease-out`,
                                    pointerEvents: "none",
                                }}
                            >
                                {card.title && (
                                    <h3
                                        data-glass-text=""
                                        style={{
                                            margin: 0,
                                            marginBottom: card.description
                                                ? 8
                                                : 0,
                                            color: s.titleColor,
                                            ...s.titleFont,
                                        }}
                                    >
                                        {card.title}
                                    </h3>
                                )}
                                {card.description && (
                                    <p
                                        data-glass-text=""
                                        style={{
                                            margin: 0,
                                            color: s.descriptionColor,
                                            ...s.descriptionFont,
                                        }}
                                    >
                                        {card.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}

            <GlassEdgeLive
                hostRef={rootRef}
                settings={s.glass}
                background={s.glassBackdrop}
                zIndex={GLASS_LAYER_Z}
            />

            {lightboxNode}
        </div>
    )
}

// ——— Property controls ———

addPropertyControls(ArcframeCarousel, {
    media: {
        type: ControlType.Array,
        title: "Cards",
        description: "Each card holds its own image or video, text and link",
        control: {
            type: ControlType.Object,
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                source: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["upload", "url"],
                    optionTitles: ["Upload", "URL"],
                    displaySegmentedControl: true,
                    defaultValue: "upload",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: ({ kind, source }) =>
                        kind === "video" || source === "url",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    defaultValue: IMG_A,
                    placeholder: "https://…",
                    hidden: ({ kind, source }) =>
                        kind === "video" || source !== "url",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: ({ kind, source }) =>
                        kind !== "video" || source === "url",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    hidden: ({ kind, source }) =>
                        kind !== "video" || source !== "url",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    description: "Optional still shown before the video loads",
                    hidden: ({ kind }) => kind !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Fresh Frame",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue:
                        "A quiet line that sets the mood for this frame.",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.Link,
                    title: "CMS Link",
                    description:
                        "Optional page or CMS link — when set, clicking opens the link instead of the lightbox",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "Open In",
                    enabledTitle: "New Tab",
                    disabledTitle: "Same Tab",
                    defaultValue: false,
                    hidden: ({ link }) => !link,
                },
            },
        },
        defaultValue: DEFAULT_CARDS,
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Card Width",
                min: 100,
                max: 800,
                step: 10,
                unit: "px",
                defaultValue: 210,
            },
            height: {
                type: ControlType.Number,
                title: "Card Height",
                min: 100,
                max: 800,
                step: 10,
                unit: "px",
                defaultValue: 300,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: -50,
                max: 200,
                step: 2,
                unit: "px",
                defaultValue: 28,
            },
            curve: {
                type: ControlType.Number,
                title: "Curve",
                min: -500,
                max: 500,
                step: 10,
                defaultValue: 140,
                description: "Positive arches up, negative bows down",
            },
        },
        defaultValue: { width: 210, height: 300, gap: 28, curve: 140 },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 10,
                step: 0.1,
                defaultValue: 1.5,
                displayStepper: true,
                hidden: ({ autoRotate }) => !autoRotate,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                displaySegmentedControl: true,
                defaultValue: "left",
                hidden: ({ autoRotate }) => !autoRotate,
            },
        },
        defaultValue: { autoRotate: true, speed: 1.5, direction: "left" },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Wheel Scroll",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
        defaultValue: { drag: true, wheel: true },
    },
    typography: {
        type: ControlType.Object,
        title: "Text",
        description: "Used on the hover overlay and in the lightbox",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "18px",
                    variant: "Semibold",
                    lineHeight: "1.2em",
                },
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#FFFFFF",
            },
            descriptionFont: {
                type: ControlType.Font,
                title: "Desc Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    lineHeight: "1.4em",
                },
            },
            descriptionColor: {
                type: ControlType.Color,
                title: "Desc Color",
                defaultValue: "#CCCCCC",
            },
        },
    },
    cardStyle: {
        type: ControlType.Object,
        title: "Card Style",
        controls: {
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "16px",
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: "0 20px 50px rgba(0,0,0,0.5)",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
            },
        },
    },
    hoverZoom: {
        type: ControlType.Object,
        title: "Hover Zoom",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 1,
                max: 1.5,
                step: 0.05,
                defaultValue: 1.05,
                hidden: ({ enabled }) => !enabled,
            },
            transition: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.1,
                max: 1,
                step: 0.1,
                defaultValue: 0.3,
                unit: "s",
            },
        },
        defaultValue: { enabled: true, scale: 1.05, transition: 0.3 },
    },
    overlay: {
        type: ControlType.Object,
        title: "Hover Overlay",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0, 0, 0, 0.8)",
                hidden: ({ show }) => !show,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: 50,
                max: 200,
                step: 5,
                defaultValue: 120,
                unit: "%",
                hidden: ({ show }) => !show,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                min: 50,
                max: 200,
                step: 5,
                defaultValue: 100,
                unit: "%",
                hidden: ({ show }) => !show,
            },
        },
        defaultValue: {
            show: true,
            color: "rgba(0, 0, 0, 0.8)",
            spread: 120,
            height: 100,
        },
    },
    lightbox: {
        type: ControlType.Object,
        title: "Lightbox",
        description: "Cards with a link open the link instead",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            backdropColor: {
                type: ControlType.Color,
                title: "Backdrop",
                defaultValue: "rgba(0, 0, 0, 0.85)",
                hidden: ({ enabled }) => !enabled,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                step: 2,
                defaultValue: 16,
                unit: "px",
                hidden: ({ enabled }) => !enabled,
            },
        },
        defaultValue: {
            enabled: true,
            backdropColor: "rgba(0, 0, 0, 0.85)",
            borderRadius: 16,
        },
    },
    glass: {
        ...glassEdgeControls,
        controls: {
            ...glassEdgeControls.controls,
            backdrop: {
                type: ControlType.Color,
                title: "Backdrop",
                defaultValue: "#000000",
                description:
                    "Colour behind the cards under the glass — match your section background",
                hidden: glassOff,
            },
        },
    },
})
