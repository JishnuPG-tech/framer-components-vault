import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/*! Water Float: Framer code component
 *  Made by Erni Hdz. All rights reserved.
 *  License: free to use inside your own Framer projects (personal or client work).
 *  Not allowed: redistributing, reselling or republishing this component or its source,
 *  alone or inside another template/component pack, and removing this notice.
 */
const AUTHOR_X = "https://x.com/framerlyco"

/* WATER FLOAT: an image floats above an endless water surface.
   - The image keeps its own shape (a PNG with a transparent background works best).
   - It bobs up and down, follows the cursor or finger a little, tilts in 3D and springs back.
   - Every dip, every fast move and every click makes ripples. The water bends the reflection.
   - Everything is drawn by one WebGL shader. Resolution adapts on slow devices. */

const DEFAULT_IMAGE = "https://framerusercontent.com/images/r4U6BiW5YcpqNlePJzMvHNfRA.png"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

interface Cfg {
    // float + pointer
    period: number
    lift: number
    gap: number
    follow: number
    range: number
    stiffness: number
    damping: number
    tiltMax: number
    wake: number
    // layout
    width: number
    cardX: number
    cardY: number
    horizon: number
    perspective: number
    camera: number
    // background
    bgTransparent: boolean
    bgColor: string
    // water
    look: string
    deep: string
    shallow: string
    skyTop: string
    skyHorizon: string
    sunAngle: number
    sunPower: number
    sunColor: string
    calm: number
    streak: number
    waveAngle: number
    waveFlow: number
    fade: number
    bodyAlpha: number
    // glow + shadow
    glow: number
    glowColor: string
    shadow: number
    shadowColor: string
    // reflection
    reflection: number
    reflLength: number
    reflBlur: number
    distort: number
    // ripples
    size: number
    speed: number
    rings: number
    wavelength: number
    strength: number
    life: number
    drops: number
    sharp: number
    rippleColor: string
    onClick: boolean
}

const DEF: Cfg = {
    period: 2.9,
    lift: 48,
    gap: 18,
    follow: 0.21,
    range: 31,
    stiffness: 121,
    damping: 10.5,
    tiltMax: 10,
    wake: 0.45,
    width: 46,
    cardX: 0.5,
    cardY: 0.72,
    horizon: 0.36,
    perspective: 1.5,
    camera: 1,
    bgTransparent: true,
    bgColor: "#0B0618",
    look: "water",
    deep: "#2A1457",
    shallow: "#8A5CC6",
    skyTop: "#6D4BB8",
    skyHorizon: "#E9B6E4",
    sunAngle: 30,
    sunPower: 0.8,
    sunColor: "#FFE9F8",
    calm: 0.32,
    streak: 2.3,
    waveAngle: 0,
    waveFlow: 1,
    fade: 0.2,
    bodyAlpha: 0.78,
    glow: 0.6,
    glowColor: "#F0A8E8",
    shadow: 0.35,
    shadowColor: "#12062B",
    reflection: 0.69,
    reflLength: 1.35,
    reflBlur: 0.51,
    distort: 1,
    size: 0.63,
    speed: 1.09,
    rings: 1.7,
    wavelength: 0.19,
    strength: 0.24,
    life: 1.7,
    drops: 2,
    sharp: 1,
    rippleColor: "#F3D9FF",
    onClick: true,
}

interface Props {
    image?: { src?: string; alt?: string }
    layout?: Partial<Cfg>
    motion?: Partial<Cfg>
    background?: Partial<Cfg>
    water?: Partial<Cfg>
    reflection?: Partial<Cfg>
    ripples?: Partial<Cfg>
    glow?: Partial<Cfg>
    style?: Any
}

/* ---------------- helpers ---------------- */

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))

let colorCtx: CanvasRenderingContext2D | null = null
const colorCache: Record<string, number[]> = {}
function parseColor(input: string): number[] {
    if (colorCache[input]) return colorCache[input]
    let c = input || "#000"
    const m = c.match(/^var\(\s*[^,]+,\s*(.+)\)$/)
    if (m) c = m[1]
    if (!colorCtx) {
        const cv = document.createElement("canvas")
        cv.width = cv.height = 1
        colorCtx = cv.getContext("2d", { willReadFrequently: true })
    }
    const x = colorCtx!
    x.clearRect(0, 0, 1, 1)
    x.fillStyle = "#000"
    x.fillStyle = c
    x.fillRect(0, 0, 1, 1)
    const d = x.getImageData(0, 0, 1, 1).data
    return (colorCache[input] = [d[0] / 255, d[1] / 255, d[2] / 255])
}

/* ---------------- shader ---------------- */

const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"

const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes,uCc,uCSize;
uniform float uCx,uHy,uF,uHc,uR0,uZ0,uTime,uYc,uD;
uniform vec4 uEv[8];
uniform float uSpeed,uLambda,uRings,uStr,uLife,uCalm,uStreak,uFade,uBody,uShadow,uLift,uSun,uMode,uSharp;
uniform float uGlowAmt,uRefl,uReflLen,uReflBlur,uDist,uWaveAng,uFlow;
uniform float uHasCard;
uniform vec3 uDeep,uShallow,uSkyTop,uSkyHor,uRipCol,uSunCol,uShadowCol,uSunDir,uGlowCol;
uniform vec3 uAx,uAy,uAz;
uniform vec2 uShift;
uniform sampler2D uCard;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}

float gLod;
float fn(vec2 p){return vn(p)*.5+vn(p*2.1+7.)*.3+vn(p*4.3+3.)*.2;}
// calm lake: long irregular streaks (not regular stripes), warped, fading out with distance
float amb(vec2 w){
 float ca=cos(uWaveAng),sa=sin(uWaveAng);
 vec2 wr=vec2(ca*w.x+sa*w.y,-sa*w.x+ca*w.y);
 vec2 q=vec2(wr.x/uR0*.26/uStreak,wr.y/uR0*2.6);
 float t=uTime*uFlow;
 vec2 warp=vec2(vn(q*.8+vec2(t*.05,0.)),vn(q*.8+9.-vec2(0.,t*.04)))-.5;
 q+=warp*1.4;
 float h=(fn(q+vec2(t*.035,t*.11))-.5)*2.+.55*(fn(q*2.3+vec2(-t*.05,t*.19))-.5)*2.;
 return uCalm*.022*h*gLod;
}
float ripple(vec2 w,vec4 e){
 float age=uTime-e.z;
 if(age<=0.||age>uLife)return 0.;
 float r=length(w-e.xy)/uR0;
 float amp=e.w*uStr;
 float decay=exp(-age/uLife*3.)/sqrt(r+.35)*smoothstep(0.,.08,age);
 // two wave groups travelling at different speeds (dispersion)
 float x1=r-age*uSpeed;
 float g1=exp(-pow(x1/(uRings*uLambda),2.))*cos(6.2832*x1/uLambda);
 float x2=r-age*uSpeed*.72;
 float g2=exp(-pow(x2/(uRings*uLambda*.7),2.))*cos(6.2832*x2/(uLambda*.55));
 return amp*decay*(g1+.45*g2);
}
float hgt(vec2 w){
 float h=amb(w);
 for(int i=0;i<8;i++){h+=ripple(w,uEv[i]);}
 return h;
}

// the image as seen by the camera (3D tilt); p in device pixels, y down
vec4 cardAt(vec2 p){
 if(uHasCard<.5)return vec4(0.);
 vec3 O=vec3(uCc,-uD);
 vec3 dir=vec3(p,0.)-O;
 float den=dot(uAz,dir);
 if(abs(den)<1e-4)return vec4(0.);
 float t=dot(uAz,vec3(0.,0.,uD))/den;
 vec3 loc=O+dir*t-vec3(uCc,0.);
 vec2 uv=vec2(dot(loc,uAx),dot(loc,uAy))/uCSize+.5;
 if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)return vec4(0.);
 vec4 tex=texture2D(uCard,uv);
 if(tex.a<.003)return vec4(0.);
 vec3 base=tex.rgb/max(tex.a,.001);
 return vec4(clamp(base,0.,1.),tex.a);
}

void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
 float dy=p.y-uHy;
 vec3 col=vec3(0.);float a=0.;
 if(dy>=1.){
  float gz=uF*uHc/dy;
  float gx=(p.x-uCx)*gz/uF;
  vec2 w=vec2(gx,gz);
  gLod=smoothstep(.015,.3,dy/uRes.y);
  float fx=max(uR0*.01,gz/uF*1.4);
  float fz=max(uR0*.01,gz*gz/(uF*uHc)*1.4);
  float h0=hgt(w),hx=hgt(w+vec2(fx,0.)),hz=hgt(w+vec2(0.,fz));
  vec3 n=normalize(vec3(-(hx-h0)/fx*.6*uSharp,1.,-(hz-h0)/fz*.6*uSharp));
  // fine detail that is filtered out with distance
  vec2 wm=vec2(cos(uWaveAng)*w.x+sin(uWaveAng)*w.y,-sin(uWaveAng)*w.x+cos(uWaveAng)*w.y);
  vec2 mq=wm/uR0*vec2(7.,16.);
  vec2 micro=vec2(vn(mq+vec2(uTime*.2,0.)),vn(mq+5.-vec2(0.,uTime*.17)))-.5;
  n=normalize(n+vec3(micro.x,0.,micro.y)*.07*uCalm*gLod);
  vec3 V=normalize(vec3(-gx,uHc,-gz));
  vec3 R=reflect(-V,n);
  float m=clamp(length(n.xz)*1.7,0.,1.);m=m*m*(3.-2.*m)*.9+m*.1;
  float fr=.04+.96*pow(1.-max(dot(n,V),0.),5.);
  fr=max(fr,.9*smoothstep(.3,0.,dy/uRes.y));
  vec3 sky=mix(uSkyHor,uSkyTop,pow(clamp(R.y,0.,1.),.5));
  float spec=pow(max(dot(R,uSunDir),0.),90.)*uSun;
  float facing=.5+.5*clamp(dot(normalize(n.xz+1e-4),normalize(uSunDir.xz+1e-4)),-1.,1.);
  if(uMode<.5){
   col=uRipCol*(.55+.45*facing)*m+uSunCol*spec;
   a=clamp(m*.95+spec,0.,1.);
  }else{
   vec3 body=mix(uShallow,uDeep,clamp(dy/uRes.y*2.2,0.,1.));
   float band=.5+.5*(n.z-.97)*30.;
   vec3 base=mix(body,sky,clamp(fr*1.3+band*.05,0.,1.));
   col=mix(base,uRipCol*(.6+.4*facing),m*.5)+uSunCol*spec;
   a=clamp(uBody+m*(1.-uBody)*.6+spec,0.,1.);
  }
  float fade=smoothstep(0.,uFade,dy/uRes.y);
  a*=fade;
  // soft light pool under the card
  vec2 d=(w-vec2(0.,uZ0))/uR0;
  vec2 dd=d*vec2(.8,1.7);
  float gl=uGlowAmt*exp(-dot(dd,dd)/.55)*fade*(.55+.45*(1.-uLift));
  col=mix(col,uGlowCol*(.8+.4*m),clamp(gl,0.,1.));a=max(a,gl*.9);
  // contact shadow
  vec2 de=d*vec2(1.,1.5);
  float sh=uShadow*exp(-dot(de,de)/.2)*(1.-uLift*.65)*fade;
  col=mix(col,uShadowCol,sh);a=max(a,sh*.85);
  // reflection of the card, mirrored on the water line and bent by the ripples
  if(uRefl>0.){
   float below=p.y-uYc;
   if(below>0.){
    vec2 off=vec2(n.x*1.4+(n.z)*.3,n.z*.7)*uDist*uCSize.y*.22*(.5+below/uCSize.y*.6);
    off.x+=(vn(vec2(p.y*.05,uTime*.9))-.5)*uDist*uCSize.x*.012*(1.+below/uCSize.y);
    vec2 pr=vec2(p.x,uYc-below)+off;
    vec4 c=cardAt(pr);
    float k=uRefl*exp(-below/(uCSize.y*uReflLen))*(1.-uReflBlur*smoothstep(0.,uCSize.y,below)*.5)*(.75+.25*fr);
    float ra=c.a*clamp(k,0.,1.);
    col=c.rgb*ra+col*a*(1.-ra);
    a=ra+a*(1.-ra);
    if(a>0.)col/=a;
   }
  }
 }
 // premultiply and draw the card on top
 vec3 pm=col*a;
 vec4 cd=cardAt(p);
 pm=cd.rgb*cd.a+pm*(1.-cd.a);
 a=cd.a+a*(1.-cd.a);
 gl_FragColor=vec4(pm,a);
}`

/* ---------------- engine ---------------- */

function createWater(
    root: HTMLElement,
    cv: HTMLCanvasElement,
    getCfg: () => Cfg,
    getImage: () => string | null,
    isStatic: boolean
) {
    const gl = cv.getContext("webgl", {
        premultipliedAlpha: true,
        alpha: true,
        antialias: false,
    }) as WebGLRenderingContext | null

    let pxCache: { src: Cfg; w: number; out: Cfg } | null = null
    /** Config with the image size resolved to pixels: a % of the component width (capped by its height), so it scales on any screen. */
    const cfgPx = (): Cfg => {
        const c = getCfg()
        const base = Math.min(W, H * 1.6)
        const w = Math.max(24, Math.round((clamp(c.width, 5, 100) / 100) * base))
        if (pxCache && pxCache.src === c && pxCache.w === w) return pxCache.out
        const out = { ...c, width: w }
        pxCache = { src: c, w, out }
        return out
    }
    let W = 0,
        H = 0,
        DPR = 1
    let destroyed = false
    let running = false
    let raf = 0
    const t0 = performance.now()
    let last = t0
    let lastCycle = -1
    let lastWake = 0
    const reduced =
        typeof matchMedia !== "undefined" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches
    const ev = new Float32Array(32) // 8 x (x, z, t0, strength)
    for (let i = 0; i < 8; i++) ev[i * 4 + 2] = -999
    let evIdx = 0
    const mouse = { x: 0, y: 0, on: false }
    const body = { x: 0, y: 0, vx: 0, vy: 0 }
    let cardTex: WebGLTexture | null = null
    let cardKey = ""
    let imgEl: HTMLImageElement | null = null
    let imgUrl = ""
    let hasCard = 0
    /** Height of the floating image: it keeps its own proportions (a placeholder ratio until it loads). */
    const cardH = (cfg: Cfg) => (imgEl && imgEl.naturalWidth ? (cfg.width * imgEl.naturalHeight) / imgEl.naturalWidth : cfg.width * 1.2)
    /** Adaptive resolution: drops when the device cannot keep up. */
    let quality = 1
    let ema = 16
    let lastFrame = 0
    let slowFrames = 0

    let prog: WebGLProgram | null = null
    const uLoc: Record<string, WebGLUniformLocation | null> = {}
    const U = (n: string) => {
        if (!(n in uLoc)) uLoc[n] = gl!.getUniformLocation(prog!, n)
        return uLoc[n]
    }
    if (gl) {
        const mk = (type: number, src: string) => {
            const s = gl.createShader(type)!
            gl.shaderSource(s, src)
            gl.compileShader(s)
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error("Water shader:", gl.getShaderInfoLog(s))
                return null
            }
            return s
        }
        const v = mk(gl.VERTEX_SHADER, VS)
        const f = mk(gl.FRAGMENT_SHADER, FS)
        if (v && f) {
            prog = gl.createProgram()!
            gl.attachShader(prog, v)
            gl.attachShader(prog, f)
            gl.bindAttribLocation(prog, 0, "a")
            gl.linkProgram(prog)
        }
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
        cardTex = gl.createTexture()
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, cardTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    /** Camera model shared by the shader and the card: a flat ground plane seen in perspective. */
    function camera(cfg: Cfg) {
        const hy = H * cfg.horizon
        const F = H * cfg.perspective
        const Hc = cfg.camera
        const yc = H * cfg.cardY
        const cx = W * cfg.cardX
        const dyc = Math.max(yc - hy, 4)
        const Z0 = (F * Hc) / dyc
        const R0 = (cfg.width * Z0) / F
        return { hy, F, Hc, yc, cx, Z0, R0 }
    }

    function drop(x: number, z: number, t: number, strength: number) {
        const o = evIdx * 4
        ev[o] = x
        ev[o + 1] = z
        ev[o + 2] = t
        ev[o + 3] = strength
        evIdx = (evIdx + 1) % 8
    }

    /** Uploads the image to a texture (at most 2x its display size, capped for memory). */
    function paintCard(cfg: Cfg) {
        if (!gl) return
        const url = getImage() || DEFAULT_IMAGE
        const key = url + "|" + cfg.width + "|" + (imgEl ? 1 : 0)
        if (key === cardKey) return
        cardKey = key
        if (url !== imgUrl) {
            imgUrl = url
            imgEl = null
            hasCard = 0
            const im = new Image()
            im.crossOrigin = "anonymous"
            im.onload = () => {
                if (imgUrl !== url) return
                imgEl = im
                cardKey = ""
                if (isStatic || !running) renderOnce()
            }
            im.src = url
        }
        if (!imgEl) return
        const ch = cardH(cfg)
        const S = clamp(2, 1, Math.min(2, 1400 / Math.max(cfg.width, ch)))
        const w = Math.max(2, Math.round(cfg.width * S))
        const h = Math.max(2, Math.round(ch * S))
        const c = document.createElement("canvas")
        c.width = w
        c.height = h
        const x = c.getContext("2d")!
        x.drawImage(imgEl, 0, 0, w, h)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, cardTex)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
        try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
            hasCard = 1
        } catch (err) {
            hasCard = 0
        }
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    }

    function draw(now: number) {
        if (destroyed || W === 0 || !gl || !prog || gl.isContextLost()) return
        const cfg = cfgPx()
        const dt = clamp((now - last) / 1000, 0.001, 0.05)
        last = now
        let t = (now - t0) / 1000
        const cam = camera(cfg)
        const live = !isStatic && !reduced
        paintCard(cfg)

        /* float cycle: sink to the lowest point at every whole period */
        let hNorm = 0.5
        let phase = 0.5
        if (live) {
            phase = t / Math.max(0.6, cfg.period)
            hNorm = 0.5 - 0.5 * Math.cos(phase * 6.2832)
            const cycle = Math.floor(phase)
            if (cycle !== lastCycle) {
                lastCycle = cycle
                if (cycle >= 0) {
                    const bottom = cycle * cfg.period
                    const n = Math.max(1, Math.round(cfg.drops))
                    const gxw = ((body.x * cam.Z0) / cam.F)
                    for (let k = 0; k < n; k++) drop(gxw, cam.Z0, bottom + k * 0.2, k === 0 ? 1 : 0.65)
                }
            }
        } else {
            t = 3
            hNorm = 0.4
            if (lastCycle !== 0) {
                lastCycle = 0
                drop(0, cam.Z0, 2.2, 1)
            }
        }

        /* elastic follow: pinned to the centre, pulled toward the pointer, springs back */
        let tx = 0
        let ty = 0
        if (live && mouse.on && cfg.follow > 0) {
            const bx = cam.cx
            const by = cam.yc - cfg.gap - cardH(cfg) / 2
            tx = (mouse.x - bx) * cfg.follow
            ty = (mouse.y - by) * cfg.follow
            const l = Math.hypot(tx, ty)
            if (l > cfg.range) {
                tx *= cfg.range / l
                ty *= cfg.range / l
            }
        }
        if (live) {
            const steps = 3
            const h = dt / steps
            for (let i = 0; i < steps; i++) {
                const ax = -cfg.stiffness * (body.x - tx) - cfg.damping * body.vx
                const ay = -cfg.stiffness * (body.y - ty) - cfg.damping * body.vy
                body.vx += ax * h
                body.vy += ay * h
                body.x += body.vx * h
                body.y += body.vy * h
            }
            const speed = Math.hypot(body.vx, body.vy)
            if (cfg.wake > 0 && speed > 90 && t - lastWake > 0.16) {
                lastWake = t
                drop((body.x * cam.Z0) / cam.F, cam.Z0, t, clamp((speed / 500) * cfg.wake, 0.12, 0.8))
            }
        } else {
            body.x = body.y = body.vx = body.vy = 0
        }
        const rx = (-body.y / Math.max(cfg.range, 1)) * cfg.tiltMax
        const ry = (body.x / Math.max(cfg.range, 1)) * cfg.tiltMax
        const bob = hNorm * cfg.lift
        const cardCx = cam.cx + body.x
        const hh = cardH(cfg)
        const cardCy = cam.yc - cfg.gap - bob - hh / 2 + body.y

        gl.viewport(0, 0, cv.width, cv.height)
        gl.disable(gl.BLEND)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(prog)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, cardTex)
        gl.uniform1i(U("uCard"), 0)
        gl.uniform1f(U("uHasCard"), hasCard)
        gl.uniform2f(U("uRes"), cv.width, cv.height)
        gl.uniform1f(U("uCx"), cam.cx * DPR)
        gl.uniform1f(U("uHy"), cam.hy * DPR)
        gl.uniform1f(U("uF"), cam.F * DPR)
        gl.uniform1f(U("uHc"), cam.Hc)
        gl.uniform1f(U("uR0"), cam.R0 * cfg.size)
        gl.uniform1f(U("uZ0"), cam.Z0)
        gl.uniform1f(U("uYc"), cam.yc * DPR)
        gl.uniform1f(U("uTime"), t)
        gl.uniform4fv(U("uEv"), ev)
        gl.uniform1f(U("uSpeed"), cfg.speed)
        gl.uniform1f(U("uLambda"), cfg.wavelength)
        gl.uniform1f(U("uRings"), cfg.rings)
        gl.uniform1f(U("uStr"), cfg.strength * 0.5)
        gl.uniform1f(U("uLife"), cfg.life)
        gl.uniform1f(U("uCalm"), cfg.calm)
        gl.uniform1f(U("uStreak"), Math.max(0.2, cfg.streak))
        gl.uniform1f(U("uFade"), cfg.fade)
        gl.uniform1f(U("uBody"), cfg.bodyAlpha)
        gl.uniform1f(U("uShadow"), cfg.shadow)
        gl.uniform1f(U("uGlowAmt"), cfg.glow)
        gl.uniform1f(U("uLift"), hNorm)
        gl.uniform1f(U("uSun"), cfg.sunPower)
        gl.uniform1f(U("uMode"), cfg.look === "clear" ? 0 : 1)
        gl.uniform1f(U("uSharp"), cfg.sharp)
        gl.uniform1f(U("uRefl"), cfg.reflection)
        gl.uniform1f(U("uReflLen"), cfg.reflLength)
        gl.uniform1f(U("uReflBlur"), cfg.reflBlur)
        gl.uniform1f(U("uDist"), cfg.distort)
        gl.uniform1f(U("uWaveAng"), (cfg.waveAngle * Math.PI) / 180)
        gl.uniform1f(U("uFlow"), cfg.waveFlow)
        const sa = (cfg.sunAngle * Math.PI) / 180
        gl.uniform3f(U("uSunDir"), Math.cos(sa) * 0.8, 0.55, Math.sin(sa) * 0.8 - 0.35)
        gl.uniform3fv(U("uDeep"), parseColor(cfg.deep))
        gl.uniform3fv(U("uShallow"), parseColor(cfg.shallow))
        gl.uniform3fv(U("uSkyTop"), parseColor(cfg.skyTop))
        gl.uniform3fv(U("uSkyHor"), parseColor(cfg.skyHorizon))
        gl.uniform3fv(U("uRipCol"), parseColor(cfg.rippleColor))
        gl.uniform3fv(U("uSunCol"), parseColor(cfg.sunColor))
        gl.uniform3fv(U("uShadowCol"), parseColor(cfg.shadowColor))
        gl.uniform3fv(U("uGlowCol"), parseColor(cfg.glowColor))
        /* image: 3D plane in device pixels */
        gl.uniform2f(U("uCc"), cardCx * DPR, cardCy * DPR)
        gl.uniform2f(U("uCSize"), cfg.width * DPR, hh * DPR)
        gl.uniform1f(U("uD"), 1500 * DPR)
        const ax = (rx * Math.PI) / 180
        const ay = (ry * Math.PI) / 180
        const cX = Math.cos(ax)
        const sX = Math.sin(ax)
        const cY = Math.cos(ay)
        const sY = Math.sin(ay)
        // R = Ry * Rx applied to the axes (screen y points down)
        gl.uniform3f(U("uAx"), cY, 0, -sY)
        gl.uniform3f(U("uAy"), sX * sY, cX, sX * cY)
        gl.uniform3f(U("uAz"), cX * sY, -sX, cX * cY)
        gl.uniform2f(U("uShift"), clamp(body.x / Math.max(cfg.range, 1), -1.5, 1.5), clamp(-body.y / Math.max(cfg.range, 1), -1.5, 1.5))
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    function loop(now: number) {
        if (!running || destroyed) return
        raf = requestAnimationFrame(loop)
        draw(now)
        /* adaptive resolution: if frames stay slow, render fewer pixels (never goes back up in a session) */
        if (lastFrame) {
            const ft = now - lastFrame
            if (ft < 250) ema = ema * 0.92 + ft * 0.08
            slowFrames = ema > 27 ? slowFrames + 1 : 0
            if (slowFrames > 20 && quality > 0.5) {
                quality = Math.max(0.5, quality * 0.8)
                slowFrames = 0
                ema = 16
                resize()
            }
        }
        lastFrame = now
    }
    function start() {
        if (running || isStatic || reduced || destroyed) return
        running = true
        last = performance.now()
        lastFrame = 0
        raf = requestAnimationFrame(loop)
    }
    function stop() {
        running = false
        cancelAnimationFrame(raf)
    }
    function renderOnce() {
        draw(performance.now())
    }

    /** Synchronous benchmark (works in background tabs): average ms per frame. */
    ;(window as Any).__waterBench = (n = 60) => {
        const s = performance.now()
        for (let i = 0; i < n; i++) draw(s + i * 16.7)
        if (gl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
        return Math.round(((performance.now() - s) / n) * 100) / 100
    }

    function resize() {
        const r = root.getBoundingClientRect()
        W = Math.max(1, Math.round(r.width))
        H = Math.max(1, Math.round(r.height))
        DPR = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4200000 / (W * H))) * quality
        cv.width = Math.max(1, Math.round(W * DPR))
        cv.height = Math.max(1, Math.round(H * DPR))
        renderOnce()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    resize()

    const setPointer = (e: PointerEvent) => {
        const b = root.getBoundingClientRect()
        mouse.x = e.clientX - b.left
        mouse.y = e.clientY - b.top
        mouse.on = true
    }
    const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch" && e.buttons === 0) return
        setPointer(e)
    }
    const onDown = (e: PointerEvent) => {
        setPointer(e)
        const cfg = cfgPx()
        if (!cfg.onClick) return
        const cam = camera(cfg)
        const dy = mouse.y - cam.hy
        if (dy < 6 || mouse.y < cam.yc - 4) return
        const gz = (cam.F * cam.Hc) / dy
        const gx = ((mouse.x - cam.cx) * gz) / cam.F
        drop(gx, gz, (performance.now() - t0) / 1000, 0.9)
    }
    const onUp = (e: PointerEvent) => {
        if (e.pointerType === "touch") mouse.on = false
    }
    const onLeave = () => {
        mouse.on = false
    }
    if (!isStatic) {
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerdown", onDown)
        window.addEventListener("pointerup", onUp)
        root.addEventListener("pointerleave", onLeave)
    }
    const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) start()
        else stop()
    })
    if (!isStatic) io.observe(root)

    return {
        refresh() {
            if (isStatic || !running) renderOnce()
        },
        destroy() {
            destroyed = true
            stop()
            ro.disconnect()
            io.disconnect()
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointerup", onUp)
            root.removeEventListener("pointerleave", onLeave)
            if (gl) {
                if (cardTex) gl.deleteTexture(cardTex)
                if (prog) gl.deleteProgram(prog)
                const ext = gl.getExtension("WEBGL_lose_context")
                if (ext) ext.loseContext()
            }
        },
    }
}

/* ---------------- component ---------------- */

/**
 * Water Float
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 750
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function WaterFloat(props: Props) {
    const { image, style } = props
    const cfg: Cfg = {
        ...DEF,
        ...(props.layout || {}),
        ...(props.motion || {}),
        ...(props.background || {}),
        ...(props.water || {}),
        ...(props.reflection || {}),
        ...(props.ripples || {}),
        ...(props.glow || {}),
    }
    const cfgRef = useRef<Cfg>(cfg)
    cfgRef.current = cfg
    const imgRef = useRef<string | null>(image?.src || null)
    imgRef.current = image?.src || null
    const isStatic = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.thumbnail
    const rootRef = useRef<HTMLDivElement>(null)
    const cvRef = useRef<HTMLCanvasElement>(null)
    const engRef = useRef<ReturnType<typeof createWater> | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        const root = rootRef.current
        const c = cvRef.current
        if (!root || !c) return
        const eng = createWater(root, c, () => cfgRef.current, () => imgRef.current, isStatic)
        engRef.current = eng
        return () => {
            eng.destroy()
            engRef.current = null
        }
    }, [isStatic])

    const cfgKey = JSON.stringify([cfg, image?.src])
    useEffect(() => {
        engRef.current?.refresh()
    }, [cfgKey])

    const fill: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
    }

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                touchAction: "pan-y",
                background: cfg.bgTransparent ? "transparent" : cfg.bgColor,
            }}
            role="img"
            aria-label={image?.alt || "Image floating on water"}
        >
            <canvas ref={cvRef} style={fill} aria-hidden="true" />
        </div>
    )
}

const num = (title: string, defaultValue: number, min: number, max: number, step: number, extra: Any = {}): Any => ({
    type: ControlType.Number,
    title,
    defaultValue,
    min,
    max,
    step,
    ...extra,
})
const more = (): Any => ({ type: ControlType.Boolean, title: "More options", defaultValue: false })
const adv = (p: Any) => !p.more
const clear = (p: Any) => p.look === "clear"

addPropertyControls(WaterFloat, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    layout: {
        type: ControlType.Object,
        title: "Size & position",
        icon: "object",
        controls: {
            width: num("Image size", 46, 5, 100, 1, { unit: "%" }),
            cardX: num("Horizontal position", 0.5, 0, 1, 0.01),
            cardY: num("Water line", 0.72, 0.3, 0.98, 0.01),
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Float & touch",
        icon: "interaction",
        controls: {
            more: more(),
            period: num("Float cycle", 2.9, 1, 12, 0.1, { unit: "s" }),
            lift: num("Float height", 48, 0, 200, 1, { unit: "px" }),
            gap: num("Gap at lowest", 18, 0, 80, 1, { unit: "px", hidden: adv }),
            follow: num("Cursor / finger pull", 0.21, 0, 1, 0.01),
            range: num("Max distance", 31, 10, 300, 1, { unit: "px", hidden: adv }),
            stiffness: num("Stiffness", 121, 10, 400, 1, { hidden: adv }),
            damping: num("Damping", 10.5, 1, 40, 0.5),
            tiltMax: num("3D tilt", 10, 0, 40, 1, { unit: "°" }),
            wake: num("Ripples when moving", 0.45, 0, 2, 0.05, { hidden: adv }),
        },
    },
    background: {
        type: ControlType.Object,
        title: "Background",
        icon: "color",
        controls: {
            bgTransparent: { type: ControlType.Boolean, title: "Transparent", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
            bgColor: { type: ControlType.Color, title: "Color", defaultValue: "#0B0618", hidden: (p: Any) => p.bgTransparent },
        },
    },
    water: {
        type: ControlType.Object,
        title: "Water",
        icon: "color",
        controls: {
            look: {
                type: ControlType.Enum,
                title: "Look",
                defaultValue: "water",
                options: ["water", "clear"],
                optionTitles: ["Realistic surface", "Clear (only ripples)"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            deep: { type: ControlType.Color, title: "Deep color", defaultValue: "#2A1457", hidden: clear },
            shallow: { type: ControlType.Color, title: "Shallow color", defaultValue: "#8A5CC6", hidden: clear },
            bodyAlpha: num("Opacity", 0.78, 0, 1, 0.01, { hidden: clear }),
            skyTop: { type: ControlType.Color, title: "Sky color (top)", defaultValue: "#6D4BB8", hidden: clear },
            skyHorizon: { type: ControlType.Color, title: "Sky color (horizon)", defaultValue: "#E9B6E4", hidden: clear },
            sunAngle: num("Light direction", 30, 0, 360, 1, { unit: "°" }),
            sunPower: num("Sparkle", 0.8, 0, 3, 0.05),
            sunColor: { type: ControlType.Color, title: "Sparkle color", defaultValue: "#FFE9F8" },
            calm: num("Ambient waves", 0.32, 0, 2, 0.01),
            streak: num("Wave length", 2.3, 0.3, 4, 0.05),
            waveAngle: num("Wave direction", 0, -60, 60, 1, { unit: "°" }),
            waveFlow: num("Wave speed", 1, -3, 3, 0.05),
            fade: num("Fade into background", 0.2, 0.02, 0.7, 0.01),
            horizon: num("Horizon height", 0.36, 0.05, 0.8, 0.01),
            perspective: num("Perspective", 1.5, 0.6, 4, 0.05),
            camera: num("Camera height", 1, 0.3, 4, 0.05),
        },
    },
    reflection: {
        type: ControlType.Object,
        title: "Reflection",
        icon: "effect",
        controls: {
            more: more(),
            reflection: num("Amount", 0.69, 0, 1, 0.01),
            reflLength: num("Length", 1.35, 0.1, 3, 0.01),
            reflBlur: num("Softness", 0.51, 0, 1, 0.01, { hidden: adv }),
            distort: num("Ripple distortion", 1, 0, 3, 0.01, { hidden: adv }),
        },
    },
    ripples: {
        type: ControlType.Object,
        title: "Ripples",
        icon: "effect",
        controls: {
            size: num("Size", 0.63, 0.3, 3, 0.01),
            speed: num("Spread speed", 1.09, 0.1, 3, 0.01),
            rings: num("Rings", 1.7, 0.5, 6, 0.1),
            wavelength: num("Ring spacing", 0.19, 0.12, 1.2, 0.01),
            strength: num("Strength", 0.24, 0, 3, 0.01),
            sharp: num("Sharpness", 1, 0.2, 3, 0.01),
            life: num("Duration", 1.7, 1, 8, 0.1, { unit: "s" }),
            drops: num("Rings per dip", 2, 1, 3, 1),
            rippleColor: { type: ControlType.Color, title: "Color", defaultValue: "#F3D9FF" },
            onClick: { type: ControlType.Boolean, title: "Click / tap makes ripples", defaultValue: true },
        },
    },
    glow: {
        type: ControlType.Object,
        title: "Glow & shadow",
        icon: "color",
        description: "Made by [Erni Hdz](" + AUTHOR_X + ")",
        controls: {
            more: more(),
            glow: num("Glow", 0.6, 0, 1.5, 0.01),
            glowColor: { type: ControlType.Color, title: "Glow color", defaultValue: "#F0A8E8" },
            shadow: num("Shadow", 0.35, 0, 1, 0.01, { hidden: adv }),
            shadowColor: { type: ControlType.Color, title: "Shadow color", defaultValue: "#12062B", hidden: adv },
        },
    },
})
