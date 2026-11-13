import * as React from "react"
import { useRef, useEffect } from "react"
import * as THREE from "three"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/** A self-contained SVG membrane and particle hologram. No remote shader/assets. */
type Props = {
    livePreview?: boolean
    editorPreview?: boolean
    svgFile?: string
    layout?: Partial<typeof LAYOUT>
    appearance?: Partial<typeof APPEARANCE>
    motion?: Partial<typeof MOTION>
    interaction?: Partial<typeof INTERACTION>
    performance?: Partial<typeof PERFORMANCE>
    style?: React.CSSProperties
    id?: string
    className?: string
    title?: string
    [key: string]: any
}

const LAYOUT = { scale: 75, depth: 20, tilt: 0 }
const APPEARANCE = {
    tint: "#000000",
    opacity: 100,
    grain: 0,
    iridescence: 90,
    glow: 34,
    aberration: 2.8,
    outline: true,
    outlineColor: "#000000",
}
const MOTION = { speed: 100, deformation: 3, rotation: 9 }
const INTERACTION = { hover: true, drag: true, strength: 10, smoothing: 0.22 }
const PERFORMANCE = {
    quality: "high",
    pixelRatio: 1.5,
    respectReducedMotion: true,
}

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 21"><path d="M0 0h14v7H7L0 0zm7 7h7v7H0l7-7zm-7 7h7v7l-7-7z" fill="white"/></svg>`
type Config = typeof LAYOUT &
    typeof APPEARANCE &
    typeof MOTION &
    typeof INTERACTION &
    typeof PERFORMANCE & { shouldAnimate: boolean }
type Engine = {
    configure: (config: Config) => void
    load: (url?: string) => void
}
type Mask = {
    texture: THREE.CanvasTexture
    alpha: Uint8Array
    distance: Float32Array
    width: number
    height: number
    aspect: number
    maxDistance: number
}

// Deterministic GPU noise: all animation runs on the GPU, without React updates.
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
 const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
 vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
 vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
 vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
 vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
 float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
 vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
 vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
 vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
 vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
 vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
 return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 flow(vec3 p,float t,float amount){
 float n=snoise(p*1.65+vec3(t*0.24,-t*0.18,t*0.13));
 float fold=sin(p.x*3.5+p.y*2.9+t*0.72);
 p.xy+=vec2(sin(p.y*2.7+t*0.63),cos(p.x*2.3-t*0.51))*amount*0.18;
 p+=normalize(vec3(p.xy,p.z+0.0001))*n*amount*0.42;
 p.z+=fold*amount*0.28;
 p.x+=sin(p.z*2.4+t*0.37)*amount*0.13;
 return p;
}
`

const SURFACE_VERTEX = `
uniform float uTime;uniform float uWarp;uniform float uDepth;
varying vec2 vUv;varying vec3 vWorld;varying vec3 vLocal;varying vec3 vNormalWorld;
${NOISE}
void main(){vUv=uv;vec3 base=position;base.z*=uDepth;vec3 bn=normalize(vec3(normal.xy,normal.z/max(uDepth,0.001)));vec3 tangent=normalize(cross(bn,abs(bn.z)<0.9?vec3(0.0,0.0,1.0):vec3(0.0,1.0,0.0)));vec3 bitangent=cross(bn,tangent);vec3 p=flow(base,uTime,uWarp);vec3 tx=flow(base+tangent*0.006,uTime,uWarp)-p;vec3 ty=flow(base+bitangent*0.006,uTime,uWarp)-p;vNormalWorld=normalize(mat3(modelMatrix)*cross(tx,ty));vLocal=p;vec4 world=modelMatrix*vec4(p,1.0);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}
`
const SURFACE_FRAGMENT = `
uniform sampler2D uMask;uniform vec3 uTint;uniform float uTime;uniform float uOpacity;uniform float uGrain;uniform float uIridescence;uniform float uOutline;uniform vec3 uOutlineColor;
varying vec2 vUv;varying vec3 vWorld;varying vec3 vLocal;varying vec3 vNormalWorld;
${NOISE}
float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
void main(){
 vec4 tex=texture2D(uMask,vUv);
 float mask=tex.a;if(mask<0.025)discard;
 vec3 n=normalize(vNormalWorld);vec3 eye=normalize(cameraPosition-vWorld);if(dot(n,eye)<0.0)n=-n;
 float facing=abs(dot(n,eye));float rim=pow(1.0-facing,2.0);
 float folds=snoise(vLocal*3.1+vec3(0.0,uTime*0.18,-uTime*0.13));
 float reflection=pow(max(0.0,dot(n,normalize(vec3(-0.6,0.9,1.0)))),5.0);
 float speck=hash(gl_FragCoord.xy+floor(uTime*24.0)*vec2(17.3,41.7));
 float grain=mix(0.8,0.16+speck*1.6,uGrain);
 float density=0.32+0.68*smoothstep(-0.62,0.6,folds);
 vec3 film=0.5+0.5*cos(vec3(0.0,2.094,4.188)+facing*12.0+folds*2.8+uTime*0.10);
 vec3 color=mix(uTint,film*1.3,uIridescence*clamp(rim*1.4+reflection*0.55,0.0,1.0));
 color*=0.7+rim*1.1+reflection*0.7;
 float alpha=smoothstep(0.025,0.8,mask)*uOpacity*density*(0.4+rim*0.85+reflection*0.34)*grain;

 float dist=tex.r*255.0;
 float outlineW=uOutline*(1.0-smoothstep(1.0,3.5,dist))*smoothstep(0.05,0.5,mask);
 color=mix(color,uOutlineColor*1.5,outlineW);
 alpha=clamp(alpha+outlineW*uOpacity*1.5,0.0,0.95);

 gl_FragColor=vec4(color,clamp(alpha,0.0,0.95));
}
`
const PARTICLE_VERTEX = `
attribute float aSeed;attribute float aLight;
uniform float uTime;uniform float uWarp;uniform float uDepth;uniform float uDpr;uniform float uPointSize;
varying float vSeed;varying float vLight;varying vec3 vLocal;
${NOISE}
void main(){vec3 p=position;p.z*=uDepth;p=flow(p,uTime,uWarp);vLocal=p;vSeed=aSeed;vLight=aLight;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=uPointSize*uDpr*(0.68+aSeed*0.68)*clamp(4.5/-mv.z,0.5,2.0);}
`
const PARTICLE_FRAGMENT = `
uniform vec3 uTint;uniform float uTime;uniform float uOpacity;uniform float uIridescence;varying float vSeed;varying float vLight;varying vec3 vLocal;
void main(){float d=length(gl_PointCoord-0.5);if(d>0.5)discard;float a=(1.0-smoothstep(0.12,0.5,d));float flicker=0.65+0.35*sin(vSeed*376.0+uTime*9.0);vec3 film=0.5+0.5*cos(vec3(0.0,2.094,4.188)+vSeed*35.0+vLocal.z*4.0);vec3 color=mix(uTint,film,uIridescence*0.65);gl_FragColor=vec4(color,a*uOpacity*vLight*flicker*1.6);}
`
// One local postprocess pass: subpixel RGB refraction plus a compact soft glow.
const POST_VERTEX = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`
const POST_FRAGMENT = `
uniform sampler2D uScene;uniform vec2 uResolution;uniform float uAberration;uniform float uGlow;varying vec2 vUv;
void main(){
 vec2 px=1.0/uResolution;vec2 axis=normalize(vUv-0.5+vec2(0.0001));vec2 shift=axis*px*uAberration;
 vec4 center=texture2D(uScene,vUv);vec4 red=texture2D(uScene,vUv+shift);vec4 blue=texture2D(uScene,vUv-shift);
 vec3 color=vec3(red.r,center.g,blue.b);float alpha=max(center.a,max(red.a,blue.a));
 vec2 g=px*2.5;vec4 halo=texture2D(uScene,vUv+vec2(g.x,0.0))+texture2D(uScene,vUv-vec2(g.x,0.0))+texture2D(uScene,vUv+vec2(0.0,g.y))+texture2D(uScene,vUv-vec2(0.0,g.y));
 halo+=0.5*(texture2D(uScene,vUv+g*2.0)+texture2D(uScene,vUv-g*2.0)+texture2D(uScene,vUv+vec2(g.x,-g.y)*2.0)+texture2D(uScene,vUv+vec2(-g.x,g.y)*2.0));halo/=6.0;
 color+=halo.rgb*uGlow*0.65;alpha=clamp(alpha+halo.a*uGlow*0.2,0.0,1.0);
 // The target stores premultiplied RGB. Return straight RGB for the canvas.
 gl_FragColor=vec4(alpha>0.0001?color/alpha:vec3(0.0),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
`

function finite(value: any, fallback: number, min: number, max: number) {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.min(max, Math.max(min, value))
        : fallback
}

/** Remove executable content and remote references before browser rasterization. */
function localPaints(value: string) {
    return value.replace(/url\(([^)]*)\)/gi, (_match, target: string) => {
        const reference = target
            .trim()
            .replace(/^(['"])(.*)\1$/, "$2")
            .trim()
        return reference.startsWith("#") ? `url(${reference})` : "none"
    })
}
function cleanSVG(source: string) {
    if (source.length > 2_000_000)
        throw new Error("Use an SVG smaller than 2 MB.")
    const doc = new DOMParser().parseFromString(source, "image/svg+xml")
    const svg = doc.documentElement
    if (doc.querySelector("parsererror") || svg.localName !== "svg")
        throw new Error("Choose a valid SVG file.")
    doc.querySelectorAll(
        "script,foreignObject,animate,animateMotion,animateTransform,set"
    ).forEach((node) => node.remove())
    for (const node of Array.from(doc.querySelectorAll("*"))) {
        for (const attr of Array.from(node.attributes)) {
            const name = attr.name.toLowerCase()
            const value = attr.value.trim()
            if (
                name.startsWith("on") ||
                name === "xml:base" ||
                ((name === "href" || name.endsWith(":href")) &&
                    !value.startsWith("#") &&
                    !/^data:image\/(png|jpeg|webp);base64,/i.test(value))
            )
                node.removeAttribute(attr.name)
            else if (/url\(/i.test(value))
                node.setAttribute(attr.name, localPaints(value))
        }
    }
    doc.querySelectorAll("style").forEach((node) => {
        node.textContent = localPaints(
            (node.textContent || "").replace(/@import[^;]*;?/gi, "")
        )
    })
    const vb = (svg.getAttribute("viewBox") || "")
        .trim()
        .split(/[\s,]+/)
        .map(Number)
    const w =
        vb.length === 4 ? vb[2] : parseFloat(svg.getAttribute("width") || "256")
    const h =
        vb.length === 4
            ? vb[3]
            : parseFloat(svg.getAttribute("height") || "256")
    if (!(w > 0 && h > 0 && Number.isFinite(w / h)))
        throw new Error("The SVG needs a valid viewBox.")
    if (!svg.hasAttribute("viewBox"))
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`)
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    const aspect = Math.min(16, Math.max(1 / 16, w / h))
    const width = aspect >= 1 ? 512 : Math.max(32, Math.round(512 * aspect))
    const height = aspect >= 1 ? Math.max(32, Math.round(512 / aspect)) : 512
    svg.setAttribute("width", String(width))
    svg.setAttribute("height", String(height))
    return { source: new XMLSerializer().serializeToString(svg), width, height }
}

/** Linear-time chamfer distance. Holes and separate islands stay independent. */
function distanceField(alpha: Uint8Array, width: number, height: number) {
    const d = new Float32Array(alpha.length)
    for (let i = 0; i < d.length; i++) d[i] = alpha[i] > 100 ? 1e6 : 0
    const diagonal = Math.SQRT2
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const i = y * width + x
            if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1)
            if (y > 0) {
                d[i] = Math.min(d[i], d[i - width] + 1)
                if (x > 0) d[i] = Math.min(d[i], d[i - width - 1] + diagonal)
                if (x + 1 < width)
                    d[i] = Math.min(d[i], d[i - width + 1] + diagonal)
            }
        }
    let max = 1
    for (let y = height - 1; y >= 0; y--)
        for (let x = width - 1; x >= 0; x--) {
            const i = y * width + x
            if (x + 1 < width) d[i] = Math.min(d[i], d[i + 1] + 1)
            if (y + 1 < height) {
                d[i] = Math.min(d[i], d[i + width] + 1)
                if (x > 0) d[i] = Math.min(d[i], d[i + width - 1] + diagonal)
                if (x + 1 < width)
                    d[i] = Math.min(d[i], d[i + width + 1] + diagonal)
            }
            max = Math.max(max, d[i])
        }
    return { distance: d, maxDistance: max }
}

function sample(mask: Mask, u: number, v: number) {
    const x = Math.min(
        mask.width - 1,
        Math.max(0, Math.round(u * (mask.width - 1)))
    )
    const y = Math.min(
        mask.height - 1,
        Math.max(0, Math.round((1 - v) * (mask.height - 1)))
    )
    return y * mask.width + x
}
function dome(mask: Mask, index: number) {
    return Math.min(1, mask.distance[index]) * 1.2
}
function domeAt(mask: Mask, u: number, v: number) {
    const x = Math.min(mask.width - 1, Math.max(0, u * (mask.width - 1)))
    const y = Math.min(
        mask.height - 1,
        Math.max(0, (1 - v) * (mask.height - 1))
    )
    const x0 = Math.floor(x),
        y0 = Math.floor(y),
        x1 = Math.min(mask.width - 1, x0 + 1),
        y1 = Math.min(mask.height - 1, y0 + 1)
    const top = THREE.MathUtils.lerp(
        mask.distance[y0 * mask.width + x0],
        mask.distance[y0 * mask.width + x1],
        x - x0
    )
    const bottom = THREE.MathUtils.lerp(
        mask.distance[y1 * mask.width + x0],
        mask.distance[y1 * mask.width + x1],
        x - x0
    )
    const d = THREE.MathUtils.lerp(top, bottom, y - y0)
    return Math.min(1, d) * 1.2
}
function maskSize(mask: Mask) {
    return {
        x: mask.aspect >= 1 ? 2.4 : 2.4 * mask.aspect,
        y: mask.aspect >= 1 ? 2.4 / mask.aspect : 2.4,
    }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 */
export default function LiquidSVGHologram(incomingProps: Props) {
    // Intercept and flatten grouped controls; the scene uses flat values only.
    const props = {
        ...incomingProps,
        ...LAYOUT,
        ...(incomingProps.layout || {}),
        ...APPEARANCE,
        ...(incomingProps.appearance || {}),
        ...MOTION,
        ...(incomingProps.motion || {}),
        ...INTERACTION,
        ...(incomingProps.interaction || {}),
        ...PERFORMANCE,
        ...(incomingProps.performance || {}),
        editorPreview:
            incomingProps.editorPreview ?? incomingProps.livePreview ?? true,
    }
    const mountRef = useRef<HTMLDivElement>(null)
    const statusRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<Engine | null>(null)
    const isIntersecting = useRef(true)
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.editorPreview ?? true)
    const configRef = useRef<Config>(null as any)
    configRef.current = { ...props, shouldAnimate }

    useEffect(() => {
        const container = mountRef.current
        if (!container) return
        // Every owned GPU resource is reachable by cleanup, including replacements.
        let renderer: THREE.WebGLRenderer | null = null
        let scene: THREE.Scene | null = null
        let camera: THREE.PerspectiveCamera | null = null
        let postScene: THREE.Scene | null = null
        let postCamera: THREE.OrthographicCamera | null = null
        let renderTarget: THREE.WebGLRenderTarget | null = null
        let resizeObserver: ResizeObserver | null = null
        let intersectionObserver: IntersectionObserver | null = null
        let frameId = 0
        let disposed = false
        let contextLost = false
        let lastTime = 0
        let time = 1.7
        let width = 1,
            height = 1,
            dpr = 1
        let loadVersion = 0
        let abortController: AbortController | null = null
        let activeImage: HTMLImageElement | null = null
        let mask: Mask | null = null
        const geometries = new Set<THREE.BufferGeometry>()
        const materials = new Set<THREE.Material>()
        const textures = new Set<THREE.Texture>()
        const renderTargets = new Set<THREE.WebGLRenderTarget>()
        const blobURLs = new Set<string>()
        const assetGeometries = new Set<THREE.BufferGeometry>()
        const group = new THREE.Group()
        let surfaceMaterial: THREE.ShaderMaterial | null = null
        let particleMaterial: THREE.ShaderMaterial | null = null
        let postMaterial: THREE.ShaderMaterial | null = null
        let config = configRef.current
        let pointerId: number | null = null
        let lastPointerX = 0,
            lastPointerY = 0
        let dragX = 0,
            dragY = 0
        let hoverX = 0,
            hoverY = 0
        let currentX = 0,
            currentY = 0
        let rebuildPending = false
        const tint = new THREE.Color()
        const outlineColor = new THREE.Color()
        let tintAlpha = 1
        const updateTint = () => {
            const value = config.tint || APPEARANCE.tint
            const rgba =
                /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i.exec(
                    value
                )
            tintAlpha = rgba ? finite(Number(rgba[4]), 1, 0, 1) : 1
            tint.set(rgba ? `rgb(${rgba[1]},${rgba[2]},${rgba[3]})` : value)

            const outVal = config.outlineColor || APPEARANCE.outlineColor
            const outRgba =
                /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i.exec(
                    outVal
                )
            outlineColor.set(
                outRgba
                    ? `rgb(${outRgba[1]},${outRgba[2]},${outRgba[3]})`
                    : outVal
            )
        }
        updateTint()
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )

        const setStatus = (message: string) => {
            if (disposed) return
            if (statusRef.current) {
                statusRef.current.textContent = message
                statusRef.current.style.display = message ? "grid" : "none"
            }
            container.setAttribute("data-status", message ? "message" : "ready")
        }
        const canAnimate = () =>
            config.shouldAnimate &&
            !(config.respectReducedMotion && reducedMotion.matches)
        const stop = () => {
            cancelAnimationFrame(frameId)
            frameId = 0
            lastTime = 0
        }

        const draw = (dt = 0) => {
            if (
                disposed ||
                contextLost ||
                !renderer ||
                !scene ||
                !camera ||
                !renderTarget ||
                !postScene ||
                !postCamera
            )
                return
            const animated = canAnimate()
            const targetX =
                dragX +
                hoverY *
                    THREE.MathUtils.degToRad(finite(config.strength, 22, 0, 90))
            const targetY =
                dragY +
                hoverX *
                    THREE.MathUtils.degToRad(finite(config.strength, 22, 0, 90))
            // A paused/static frame snaps straight to the final interaction pose.
            const blend = animated
                ? 1 - Math.exp(-dt / finite(config.smoothing, 0.22, 0.01, 2))
                : 1
            currentX += (targetX - currentX) * blend
            currentY += (targetY - currentY) * blend
            group.rotation.set(
                currentX +
                    THREE.MathUtils.degToRad(finite(config.tilt, 0, -90, 90)) +
                    Math.sin(time * 0.41) * 0.12,
                currentY +
                    time *
                        THREE.MathUtils.degToRad(
                            finite(config.rotation, 9, -90, 90)
                        ),
                Math.sin(time * 0.27) * 0.13
            )
            group.scale.setScalar(finite(config.scale, 60, 10, 160) / 100)
            const warp = finite(config.deformation, 42, 0, 100) / 100
            const depth = finite(config.depth, 82, 0, 150) / 100
            const opacity =
                (finite(config.opacity, 74, 0, 100) / 100) * tintAlpha
            for (const material of [surfaceMaterial, particleMaterial])
                if (material) {
                    material.uniforms.uTime.value = time
                    material.uniforms.uWarp.value = warp
                    material.uniforms.uDepth.value = depth
                    material.uniforms.uOpacity.value = opacity
                    material.uniforms.uTint.value.copy(tint)
                    material.uniforms.uIridescence.value =
                        finite(config.iridescence, 90, 0, 100) / 100
                }
            if (surfaceMaterial) {
                surfaceMaterial.uniforms.uGrain.value =
                    finite(config.grain, 80, 0, 100) / 100
                surfaceMaterial.uniforms.uOutline.value = config.outline
                    ? 1.0
                    : 0.0
                surfaceMaterial.uniforms.uOutlineColor.value.copy(outlineColor)
            }
            if (particleMaterial) {
                particleMaterial.uniforms.uDpr.value = dpr
                particleMaterial.uniforms.uPointSize.value =
                    0.76 + finite(config.grain, 80, 0, 100) / 200
            }
            if (postMaterial) {
                postMaterial.uniforms.uGlow.value =
                    finite(config.glow, 34, 0, 100) / 100
                postMaterial.uniforms.uAberration.value =
                    finite(config.aberration, 2.8, 0, 12) * dpr
            }
            renderer.setRenderTarget(renderTarget)
            renderer.setClearColor(0x000000, 0)
            renderer.clear()
            renderer.render(scene, camera)
            renderer.setRenderTarget(null)
            renderer.clear()
            renderer.render(postScene, postCamera)
        }
        const tick = (timestamp: number) => {
            frameId = 0
            if (
                disposed ||
                contextLost ||
                !isIntersecting.current ||
                document.hidden ||
                !canAnimate()
            ) {
                lastTime = 0
                return
            }
            const dt = lastTime
                ? Math.min((timestamp - lastTime) / 1000, 0.05)
                : 1 / 60
            lastTime = timestamp
            time += (dt * finite(config.speed, 100, 0, 300)) / 100
            draw(dt)
            // Exactly one owner of the infinite loop; static mode never schedules it.
            if (canAnimate() && isIntersecting.current && !document.hidden)
                frameId = requestAnimationFrame(tick)
        }
        const pushFrame = () => {
            if (disposed || contextLost) return
            if (!canAnimate()) {
                stop()
                draw()
                return
            }
            if (isIntersecting.current && !document.hidden && !frameId)
                frameId = requestAnimationFrame(tick)
        }
        const resize = () => {
            if (disposed || !renderer || !camera || !renderTarget) return
            const bounds = container.getBoundingClientRect()
            width = Math.max(1, bounds.width)
            height = Math.max(1, bounds.height)
            dpr = Math.min(
                window.devicePixelRatio || 1,
                finite(config.pixelRatio, 1.5, 1, 2)
            )
            renderer.setPixelRatio(dpr)
            renderer.setSize(width, height, false)
            camera.aspect = width / height
            camera.position.z = 4.5 / Math.min(1, camera.aspect)
            camera.updateProjectionMatrix()
            renderTarget.setSize(
                Math.max(1, Math.round(width * dpr)),
                Math.max(1, Math.round(height * dpr))
            )
            postMaterial?.uniforms.uResolution.value.set(
                width * dpr,
                height * dpr
            )
            draw()
            pushFrame()
        }

        const disposeGeometry = (geometry: THREE.BufferGeometry) => {
            geometry.dispose()
            geometries.delete(geometry)
            assetGeometries.delete(geometry)
        }
        const clearShape = () => {
            group.clear()
            for (const geometry of Array.from(assetGeometries))
                disposeGeometry(geometry)
        }
        const buildShape = () => {
            if (disposed || !mask || !surfaceMaterial || !particleMaterial)
                return
            clearShape()
            const size = maskSize(mask)
            const quality = config.quality
            const divisions =
                quality === "high" ? 192 : quality === "low" ? 80 : 136
            const nx = Math.max(
                20,
                Math.round(divisions * Math.min(1, mask.aspect))
            )
            const ny = Math.max(
                20,
                Math.round(divisions * Math.min(1, 1 / mask.aspect))
            )
            for (const side of [-1, 1]) {
                const geometry = new THREE.PlaneGeometry(size.x, size.y, nx, ny)
                geometries.add(geometry)
                assetGeometries.add(geometry)
                const position = geometry.attributes
                    .position as THREE.BufferAttribute
                const uv = geometry.attributes.uv as THREE.BufferAttribute
                for (let i = 0; i < position.count; i++)
                    position.setZ(
                        i,
                        side * domeAt(mask, uv.getX(i), uv.getY(i))
                    )
                geometry.computeVertexNormals()
                geometry.computeBoundingSphere()
                const mesh = new THREE.Mesh(geometry, surfaceMaterial)
                mesh.frustumCulled = false
                group.add(mesh)
            }
            // Sample mask pixels directly; even a very thin SVG cannot stall rejection sampling.
            const filled: number[] = []
            for (let i = 0; i < mask.alpha.length; i++)
                if (mask.alpha[i] > 120) filled.push(i)
            if (!filled.length)
                throw new Error("The SVG has no visible shapes.")
            const count =
                quality === "high" ? 64000 : quality === "low" ? 16000 : 36000
            const positions = new Float32Array(count * 3),
                seeds = new Float32Array(count),
                lights = new Float32Array(count)
            let randomSeed = 17431
            const random = () => {
                randomSeed = (Math.imul(1664525, randomSeed) + 1013904223) >>> 0
                return randomSeed / 4294967296
            }
            for (let i = 0; i < count; i++) {
                const index = filled[Math.floor(random() * filled.length)]
                const x = index % mask.width,
                    y = Math.floor(index / mask.width)
                const u = (x + random()) / mask.width,
                    v = 1 - (y + random()) / mask.height
                positions[i * 3] = (u - 0.5) * size.x
                positions[i * 3 + 1] = (v - 0.5) * size.y
                const shell =
                    random() < 0.72
                        ? random() < 0.5
                            ? -1
                            : 1
                        : random() * 2 - 1
                positions[i * 3 + 2] = dome(mask, index) * shell
                seeds[i] = random()
                lights[i] = 0.12 + random() * 0.36
            }
            const geometry = new THREE.BufferGeometry()
            geometries.add(geometry)
            assetGeometries.add(geometry)
            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3)
            )
            geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
            geometry.setAttribute(
                "aLight",
                new THREE.BufferAttribute(lights, 1)
            )
            const points = new THREE.Points(geometry, particleMaterial)
            points.frustumCulled = false
            group.add(points)
            draw()
            pushFrame()
        }

        const load = async (url?: string) => {
            const version = ++loadVersion
            abortController?.abort()
            abortController = new AbortController()
            if (activeImage) {
                activeImage.onload = null
                activeImage.onerror = null
                activeImage.src = ""
                activeImage = null
            }
            for (const oldURL of blobURLs) URL.revokeObjectURL(oldURL)
            blobURLs.clear()
            setStatus("Loading SVG…")
            let blobURL = ""
            try {
                let text = DEFAULT_SVG
                if (url) {
                    const response = await fetch(url, {
                        signal: abortController.signal,
                        credentials: "omit",
                    })
                    if (!response.ok)
                        throw new Error("The SVG could not be loaded.")
                    const length = Number(
                        response.headers.get("content-length") || 0
                    )
                    if (length > 2_000_000)
                        throw new Error("Use an SVG smaller than 2 MB.")
                    text = await response.text()
                }
                if (disposed || version !== loadVersion) return
                const cleaned = cleanSVG(text)
                blobURL = URL.createObjectURL(
                    new Blob([cleaned.source], { type: "image/svg+xml" })
                )
                blobURLs.add(blobURL)
                const image = new Image()
                activeImage = image
                const signal = abortController.signal
                await new Promise<void>((resolve, reject) => {
                    const aborted = () => {
                        image.onload = null
                        image.onerror = null
                        image.src = ""
                        reject(new DOMException("Canceled", "AbortError"))
                    }
                    const done = (error?: Error) => {
                        signal.removeEventListener("abort", aborted)
                        image.onload = null
                        image.onerror = null
                        error ? reject(error) : resolve()
                    }
                    signal.addEventListener("abort", aborted, { once: true })
                    image.onload = () => done()
                    image.onerror = () =>
                        done(new Error("The SVG could not be drawn."))
                    image.src = blobURL
                })
                image.onload = null
                image.onerror = null
                if (disposed || version !== loadVersion) return
                const canvas = document.createElement("canvas")
                canvas.width = cleaned.width + 8
                canvas.height = cleaned.height + 8
                const context = canvas.getContext("2d", {
                    willReadFrequently: true,
                })
                if (!context) throw new Error("SVG rendering is unavailable.")
                context.drawImage(image, 4, 4, cleaned.width, cleaned.height)
                const pixels = context.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                )
                let minX = canvas.width,
                    minY = canvas.height,
                    maxX = -1,
                    maxY = -1
                for (let y = 0; y < canvas.height; y++)
                    for (let x = 0; x < canvas.width; x++)
                        if (pixels.data[(y * canvas.width + x) * 4 + 3] > 0) {
                            minX = Math.min(minX, x)
                            maxX = Math.max(maxX, x)
                            minY = Math.min(minY, y)
                            maxY = Math.max(maxY, y)
                        }
                if (maxX < 0) throw new Error("The SVG has no visible shapes.")
                minX = Math.max(0, minX - 3)
                minY = Math.max(0, minY - 3)
                maxX = Math.min(canvas.width - 1, maxX + 3)
                maxY = Math.min(canvas.height - 1, maxY + 3)
                const cropped = document.createElement("canvas")
                cropped.width = maxX - minX + 1
                cropped.height = maxY - minY + 1
                const croppedContext = cropped.getContext("2d", {
                    willReadFrequently: true,
                })
                if (!croppedContext)
                    throw new Error("SVG rendering is unavailable.")
                croppedContext.drawImage(
                    canvas,
                    minX,
                    minY,
                    cropped.width,
                    cropped.height,
                    0,
                    0,
                    cropped.width,
                    cropped.height
                )
                const croppedPixels = croppedContext.getImageData(
                    0,
                    0,
                    cropped.width,
                    cropped.height
                )
                const rgba = croppedPixels.data
                const alpha = new Uint8Array(cropped.width * cropped.height)
                let maxAlpha = 0
                for (let i = 0; i < alpha.length; i++)
                    maxAlpha = Math.max(maxAlpha, rgba[i * 4 + 3])

                // Extract alpha first so distanceField can run on it
                for (let i = 0; i < alpha.length; i++) {
                    alpha[i] = Math.round(
                        (rgba[i * 4 + 3] * 255) / Math.max(1, maxAlpha)
                    )
                }
                const field = distanceField(
                    alpha,
                    cropped.width,
                    cropped.height
                )

                // The mask describes occupancy; Appearance > Opacity controls the material.
                // We store exact distance in the R channel to enable crisp outlines.
                for (let i = 0; i < alpha.length; i++) {
                    rgba[i * 4] = Math.min(
                        255,
                        Math.max(0, Math.round(field.distance[i]))
                    )
                    rgba[i * 4 + 1] = 255
                    rgba[i * 4 + 2] = 255
                    rgba[i * 4 + 3] = alpha[i]
                }
                croppedContext.putImageData(croppedPixels, 0, 0)

                const texture = new THREE.CanvasTexture(cropped)
                texture.colorSpace = THREE.NoColorSpace
                texture.generateMipmaps = false
                texture.minFilter = THREE.LinearFilter
                textures.add(texture)
                const oldMask = mask
                mask = {
                    texture,
                    alpha,
                    width: cropped.width,
                    height: cropped.height,
                    aspect: cropped.width / cropped.height,
                    ...field,
                }
                surfaceMaterial!.uniforms.uMask.value = texture
                buildShape()
                if (oldMask) {
                    oldMask.texture.dispose()
                    textures.delete(oldMask.texture)
                    const oldCanvas = oldMask.texture.image as HTMLCanvasElement
                    oldCanvas.width = 0
                    oldCanvas.height = 0
                }
                canvas.width = 0
                canvas.height = 0
                activeImage = null
                setStatus("")
                draw()
                pushFrame() // Async load also paints in the paused Framer canvas.
            } catch (error) {
                if (
                    !disposed &&
                    version === loadVersion &&
                    (error as Error).name !== "AbortError"
                )
                    setStatus(
                        (error as Error).message || "Choose a valid SVG file."
                    )
            } finally {
                if (blobURL) {
                    URL.revokeObjectURL(blobURL)
                    blobURLs.delete(blobURL)
                }
            }
        }

        const onPointerMove = (event: PointerEvent) => {
            const rect = container.getBoundingClientRect()
            if (config.hover && event.pointerType !== "touch") {
                hoverX =
                    ((event.clientX - rect.left) / Math.max(1, rect.width)) *
                        2 -
                    1
                hoverY =
                    ((event.clientY - rect.top) / Math.max(1, rect.height)) *
                        2 -
                    1
            }
            if (pointerId === event.pointerId) {
                dragY += (event.clientX - lastPointerX) * 0.008
                dragX += (event.clientY - lastPointerY) * 0.008
                dragX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, dragX))
                lastPointerX = event.clientX
                lastPointerY = event.clientY
            }
            pushFrame()
        }
        const onPointerDown = (event: PointerEvent) => {
            if (!config.drag || event.button !== 0 || pointerId !== null) return
            pointerId = event.pointerId
            lastPointerX = event.clientX
            lastPointerY = event.clientY
            container.setPointerCapture(event.pointerId)
            container.style.cursor = "grabbing"
            pushFrame()
        }
        const onPointerUp = (event: PointerEvent) => {
            if (pointerId !== event.pointerId) return
            pointerId = null
            if (container.hasPointerCapture(event.pointerId))
                container.releasePointerCapture(event.pointerId)
            container.style.cursor = config.drag ? "grab" : "default"
            pushFrame()
        }
        const onPointerLeave = () => {
            hoverX = 0
            hoverY = 0
            pushFrame()
        }
        const onDoubleClick = () => {
            dragX = 0
            dragY = 0
            hoverX = 0
            hoverY = 0
            pushFrame()
        }
        const onVisibility = () => {
            if (document.hidden) stop()
            else pushFrame()
        }
        const onReducedMotion = () => {
            stop()
            draw()
            pushFrame()
        }
        const onContextLost = (event: Event) => {
            event.preventDefault()
            contextLost = true
            stop()
            setStatus("Graphics paused. Reload this view.")
        }
        const onContextRestored = () => {
            contextLost = false
            setStatus("")
            resize()
            pushFrame()
        }

        const cleanup = () => {
            if (disposed) return
            disposed = true
            loadVersion++
            cancelAnimationFrame(frameId)
            frameId = 0
            abortController?.abort()
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointercancel", onPointerUp)
            container.removeEventListener("lostpointercapture", onPointerUp)
            container.removeEventListener("pointerleave", onPointerLeave)
            container.removeEventListener("dblclick", onDoubleClick)
            document.removeEventListener("visibilitychange", onVisibility)
            reducedMotion.removeEventListener("change", onReducedMotion)
            if (pointerId !== null && container.hasPointerCapture(pointerId))
                container.releasePointerCapture(pointerId)
            if (activeImage) {
                activeImage.onload = null
                activeImage.onerror = null
                activeImage.src = ""
                activeImage = null
            }
            for (const url of blobURLs) URL.revokeObjectURL(url)
            blobURLs.clear()
            group.clear()
            scene?.clear()
            postScene?.clear()
            for (const geometry of geometries) geometry.dispose()
            for (const material of materials) material.dispose()
            for (const texture of textures) {
                texture.dispose()
                if (texture.image instanceof HTMLCanvasElement) {
                    texture.image.width = 0
                    texture.image.height = 0
                }
            }
            for (const target of renderTargets) {
                target.texture.dispose()
                target.dispose()
            }
            geometries.clear()
            assetGeometries.clear()
            materials.clear()
            textures.clear()
            renderTargets.clear()
            if (renderer) {
                renderer.domElement.removeEventListener(
                    "webglcontextlost",
                    onContextLost
                )
                renderer.domElement.removeEventListener(
                    "webglcontextrestored",
                    onContextRestored
                )
                renderer.forceContextLoss()
                renderer.dispose()
                if (container && container.contains(renderer.domElement))
                    container.removeChild(renderer.domElement)
            }
            if (engineRef.current === engine) engineRef.current = null
        }
        const engine: Engine = {
            configure(next) {
                if (disposed) return
                const qualityChanged = config.quality !== next.quality
                const dprChanged = config.pixelRatio !== next.pixelRatio
                config = next
                updateTint()
                if (!config.hover) {
                    hoverX = 0
                    hoverY = 0
                }
                container.style.cursor = config.drag ? "grab" : "default"
                container.style.touchAction = config.drag ? "pan-y" : "auto"
                if (qualityChanged && mask && !rebuildPending) {
                    rebuildPending = true
                    // No new renderer/context during property slider changes.
                    buildShape()
                    rebuildPending = false
                }
                if (dprChanged) resize()
                if (!canAnimate()) stop()
                draw()
                pushFrame()
            },
            load: (url) => {
                void load(url)
            },
        }

        try {
            renderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: true,
                premultipliedAlpha: false,
                powerPreference: "high-performance",
            })
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.toneMapping = THREE.ACESFilmicToneMapping
            renderer.toneMappingExposure = 1.15
            renderer.domElement.style.cssText =
                "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;"
            renderer.domElement.setAttribute("aria-hidden", "true")
            container.appendChild(renderer.domElement)
            scene = new THREE.Scene()
            scene.add(group)
            camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
            camera.position.set(0, 0, 4.5)
            renderTarget = new THREE.WebGLRenderTarget(1, 1, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                depthBuffer: true,
                stencilBuffer: false,
            })
            renderTargets.add(renderTarget)
            const uniforms = () => ({
                uTime: { value: time },
                uWarp: { value: 0.42 },
                uDepth: { value: 0.82 },
                uTint: { value: new THREE.Color(APPEARANCE.tint) },
                uOpacity: { value: 0.74 },
                uIridescence: { value: 0.9 },
            })
            surfaceMaterial = new THREE.ShaderMaterial({
                vertexShader: SURFACE_VERTEX,
                fragmentShader: SURFACE_FRAGMENT,
                uniforms: {
                    ...uniforms(),
                    uMask: { value: null },
                    uGrain: { value: 0.8 },
                    uOutline: { value: APPEARANCE.outline ? 1.0 : 0.0 },
                    uOutlineColor: {
                        value: new THREE.Color(APPEARANCE.outlineColor),
                    },
                },
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
            })
            particleMaterial = new THREE.ShaderMaterial({
                vertexShader: PARTICLE_VERTEX,
                fragmentShader: PARTICLE_FRAGMENT,
                uniforms: {
                    ...uniforms(),
                    uDpr: { value: 1 },
                    uPointSize: { value: 1.16 },
                },
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
            materials.add(surfaceMaterial)
            materials.add(particleMaterial)
            postMaterial = new THREE.ShaderMaterial({
                vertexShader: POST_VERTEX,
                fragmentShader: POST_FRAGMENT,
                uniforms: {
                    uScene: { value: renderTarget.texture },
                    uResolution: { value: new THREE.Vector2(1, 1) },
                    uAberration: { value: 2.8 },
                    uGlow: { value: 0.34 },
                },
                depthTest: false,
                depthWrite: false,
                transparent: false,
            })
            materials.add(postMaterial)
            postScene = new THREE.Scene()
            postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
            const quadGeometry = new THREE.PlaneGeometry(2, 2)
            geometries.add(quadGeometry)
            postScene.add(new THREE.Mesh(quadGeometry, postMaterial))
            container.addEventListener("pointermove", onPointerMove, {
                passive: true,
            })
            container.addEventListener("pointerdown", onPointerDown)
            container.addEventListener("pointerup", onPointerUp)
            container.addEventListener("pointercancel", onPointerUp)
            container.addEventListener("lostpointercapture", onPointerUp)
            container.addEventListener("pointerleave", onPointerLeave)
            container.addEventListener("dblclick", onDoubleClick)
            document.addEventListener("visibilitychange", onVisibility)
            reducedMotion.addEventListener("change", onReducedMotion)
            renderer.domElement.addEventListener(
                "webglcontextlost",
                onContextLost
            )
            renderer.domElement.addEventListener(
                "webglcontextrestored",
                onContextRestored
            )
            resizeObserver = new ResizeObserver(resize)
            resizeObserver.observe(container)
            isIntersecting.current = true
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    isIntersecting.current = entries[0]?.isIntersecting ?? false
                    if (isIntersecting.current) {
                        lastTime = 0
                        draw()
                        pushFrame()
                    } else stop()
                },
                { threshold: 0 }
            )
            intersectionObserver.observe(container)
            engineRef.current = engine
            resize()
        } catch {
            setStatus("WebGL is unavailable in this browser.")
            cleanup()
        }
        return cleanup
    }, [])

    // Primitive dependencies keep grouped controls from recreating the WebGL context.
    useEffect(() => {
        engineRef.current?.configure(configRef.current)
    }, [
        shouldAnimate,
        props.scale,
        props.depth,
        props.tilt,
        props.tint,
        props.opacity,
        props.grain,
        props.iridescence,
        props.glow,
        props.aberration,
        props.outline,
        props.outlineColor,
        props.speed,
        props.deformation,
        props.rotation,
        props.hover,
        props.drag,
        props.strength,
        props.smoothing,
        props.quality,
        props.pixelRatio,
        props.respectReducedMotion,
    ])
    useEffect(() => {
        engineRef.current?.load(props.svgFile)
    }, [props.svgFile])

    // Forward Framer layout/DOM props only; control groups must not leak to the DOM.
    const domProps = {
        id: props.id,
        className: props.className,
        title: props.title,
        "data-framer-name": incomingProps["data-framer-name"],
        "aria-label": incomingProps["aria-label"] || "Animated SVG hologram",
    }
    return (
        <div
            {...domProps}
            ref={mountRef}
            role="img"
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                ...props.style,
            }}
        >
            <div
                ref={statusRef}
                role="status"
                aria-live="polite"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    display: "none",
                    placeItems: "center",
                    padding: 24,
                    color: "#b8bdca",
                    textAlign: "center",
                    font: "12px/1.5 system-ui, sans-serif",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

LiquidSVGHologram.defaultProps = {
    livePreview: true,
    svgFile: "",
    layout: LAYOUT,
    appearance: APPEARANCE,
    motion: MOTION,
    interaction: INTERACTION,
    performance: PERFORMANCE,
}

addPropertyControls(LiquidSVGHologram, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate in live previews.",
    },
    svgFile: {
        type: ControlType.File,
        title: "Upload SVG",
        allowedFileTypes: ["svg"],
        description: "Your shape becomes a hologram.",
    },
    layout: {
        type: ControlType.Object,
        title: "Shape",
        controls: {
            scale: {
                type: ControlType.Number,
                title: "Size",
                min: 10,
                max: 160,
                step: 1,
                unit: "%",
                defaultValue: 75,
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 0,
                max: 150,
                step: 1,
                unit: "%",
                defaultValue: 20,
                description: "Inflates the SVG into 3D.",
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: -90,
                max: 90,
                step: 1,
                unit: "°",
                defaultValue: 0,
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            tint: {
                type: ControlType.Color,
                title: "Tint",
                defaultValue: "#000000",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 100,
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 0,
                description: "Fine sparkling surface noise.",
            },
            iridescence: {
                type: ControlType.Number,
                title: "Rainbow",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 90,
                description: "Color shimmer on folds.",
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 34,
            },
            aberration: {
                type: ControlType.Number,
                title: "RGB Split",
                min: 0,
                max: 12,
                step: 0.1,
                unit: "px",
                defaultValue: 2.8,
                description: "Separates color at edges.",
            },
            outline: {
                type: ControlType.Boolean,
                title: "Outline",
                defaultValue: true,
                description: "Highlights the edge of the shape.",
            },
            outlineColor: {
                type: ControlType.Color,
                title: "Outline Color",
                defaultValue: "#000000",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 300,
                step: 1,
                unit: "%",
                defaultValue: 100,
            },
            deformation: {
                type: ControlType.Number,
                title: "Flow",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 3,
                description: "Strength of liquid folding.",
            },
            rotation: {
                type: ControlType.Number,
                title: "Spin",
                min: -90,
                max: 90,
                step: 0.5,
                unit: "°/s",
                defaultValue: 9,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            hover: {
                type: ControlType.Boolean,
                title: "Follow Pointer",
                defaultValue: true,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag to Turn",
                defaultValue: true,
                description: "Double-click resets the pose.",
            },
            strength: {
                type: ControlType.Number,
                title: "Hover Tilt",
                min: 0,
                max: 90,
                step: 1,
                unit: "°",
                defaultValue: 10,
            },
            smoothing: {
                type: ControlType.Number,
                title: "Smoothing",
                min: 0.01,
                max: 2,
                step: 0.01,
                unit: "s",
                defaultValue: 0.22,
                description: "Time to settle after movement.",
            },
        },
    },
    performance: {
        type: ControlType.Object,
        title: "Performance",
        controls: {
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                options: ["low", "balanced", "high"],
                optionTitles: ["Light", "Balanced", "High"],
                defaultValue: "high",
                description: "More detail uses more GPU.",
            },
            pixelRatio: {
                type: ControlType.Number,
                title: "Pixel Ratio",
                min: 1,
                max: 2,
                step: 0.25,
                unit: "×",
                defaultValue: 1.5,
                description: "Limits screen rendering density.",
            },
            respectReducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                defaultValue: true,
                description: "Honors device motion preference.",
            },
        },
    },
})
