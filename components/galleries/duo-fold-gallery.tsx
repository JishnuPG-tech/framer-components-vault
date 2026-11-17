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

import { useReducedMotion } from "framer-motion"

type Photo = { src: string; srcSet?: string; alt?: string }
type Slide = { image?: Photo; title?: string; category?: string; alt?: string; link?: string; newTab?: boolean }
interface DuoFoldGalleryProps {
    items?: Slide[]
    navigationColor?: string
    cover?: Photo
    startClosed?: boolean
    imageRatio?: number
    imageScale?: number
    stageRatio?: number
    radius?: string | number
    padding?: string | number
    duration?: number
    bend?: number
    autoplay?: boolean
    showAutoplayControl?: boolean
    autoplayDelay?: number
    autoplayLoop?: boolean
    pauseOnHover?: boolean
    showArrows?: boolean
    showCounter?: boolean
    counterFormat?: "padded" | "simple"
    counterMotion?: "fold" | "blur" | "none"
    counterDirection?: "up" | "down" | "left" | "right"
    counterSpeed?: number
    counterBlur?: number
    navigationGap?: string | number
    navigationOffset?: number
    buttonSize?: number
    buttonStyle?: "minimal" | "outline" | "filled"
    navigationFill?: string
    hoverDuration?: number
    navigationStyle?: "framed" | "minimal"
    navigationSurface?: string
    navigationBorder?: string
    navigationRadius?: string | number
    navigationFont?: React.CSSProperties
    fitViewport?: boolean
    viewportSpace?: number
    background?: string
    studioLight?: boolean
    surfaceLight?: string
    lightStrength?: number
    grain?: number
    backgroundPattern?: "none" | "grid"
    patternSize?: number
    patternOpacity?: number
    patternColor?: string
    imageShadow?: boolean
    accent?: string
    startItem?: number
    accessibleLabel?: string
    style?: React.CSSProperties
}

const COVER: Photo = {"src": "https://framerusercontent.com/images/l2FAew8TYrvpYbuumTH5WuJEVoU.png", "alt": "A monumental dark portal frames an orange sunset above misty water."}
const SAMPLES: Slide[] = [
    {
        "image": {
            "src": "https://framerusercontent.com/images/bn1fREGdpecZ36VLxJDh76jnsI.png",
            "alt": "A sculptural concrete spiral staircase rises above a dark blue sea."
        },
        "title": "Tidal Stair",
        "category": "TIDE / CONCRETE",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/eeh35amJOEbY4A9VUSVxKnKcgw.png",
            "alt": "A tall black monolith rises from sculpted dunes in warm evening light."
        },
        "title": "Dune Monolith",
        "category": "DUNE / GRAPHITE",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/fAxloOLatkFPt8XAoAHrLFxMj0.png",
            "alt": "A monumental concrete ring stands on a reflective salt flat beneath an orange sun."
        },
        "title": "Salt Ring",
        "category": "SALT / CONCRETE",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/7t69l9KAUmgQ3wT0XAg2CRfcwE.png",
            "alt": "A long concrete tunnel glows with a narrow red-orange seam of light."
        },
        "title": "Red Passage",
        "category": "PASSAGE / LIGHT",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/1Zp2ylXPwWy4rlHMLY62G57Vdsw.png",
            "alt": "A massive pale concrete arch spans a misty blue landscape."
        },
        "title": "Fog Arch",
        "category": "FOG / ARCHITECTURE",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/WutVHNvAB1DzOxjI8KN7hbI.png",
            "alt": "A polished silver sphere rests between sculptural blue glacier walls."
        },
        "title": "Glacial Orb",
        "category": "ICE / SILVER",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/kfoRRLKaJ5rS00NgFGTmW1H0p4.png",
            "alt": "A cantilevered concrete pavilion projects from a dark cliff above the sea."
        },
        "title": "Edge of Silence",
        "category": "CLIFF / CONCRETE",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/HimPayYuWxycZHhnzdnEJQuw.png",
            "alt": "A monumental folded chrome ribbon reflects orange sunlight in a barren landscape."
        },
        "title": "Chrome Fold",
        "category": "BASALT / CHROME",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/XMvgQZWn6hBsENknKTLj8n8lE.png",
            "alt": "A dark stone cube is split by a glowing fissure on an obsidian plateau."
        },
        "title": "Split Cube",
        "category": "OBSIDIAN / LIGHT",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/2yssBDFNQHxvFn8FKudjcWKWk7c.png",
            "alt": "A broad circular concrete disc stands above calm blue water on a narrow central column."
        },
        "title": "Tidal Disc",
        "category": "WATER / STEEL",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/15iPBMkkIHBApNnv0QfWYEgL5jA.png",
            "alt": "A sculptural circular basin frames a low orange sun in a desert crater."
        },
        "title": "Solar Crater",
        "category": "EARTH / SUN",
        "link": "",
        "newTab": false
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/LFfYOLr0rjUuE4T8Uif2eHBQ.png",
            "alt": "A dark obelisk catches amber light beneath a deep blue night sky."
        },
        "title": "Night Needle",
        "category": "NIGHT / GRAPHITE",
        "link": "",
        "newTab": false
    }
]
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const safe = (n: number | undefined, fallback: number) => typeof n === "number" && Number.isFinite(n) ? n : fallback

// Number motion follows the visible leaf, including a drag that turns back.
// A narrower transition window changes its pace without a competing timer.
function counterFrames(progress:number,pageDirection:number,motion:DuoFoldGalleryProps["counterMotion"]="fold",direction:DuoFoldGalleryProps["counterDirection"]="up",speed=1,blur=4) {
    const p=clamp(safe(progress,0),0,1)
    const q=clamp((p-.5)*clamp(safe(speed,1),1,3)+.5,0,1)
    const horizontal=direction==="left"||direction==="right"
    const sign=(direction==="down"||direction==="right"?-1:1)*(pageDirection<0?-1:1)
    const departing=clamp(q*2,0,1),arriving=clamp((q-.5)*2,0,1)
    if(motion==="none")return {outgoing:{transform:"none",filter:"none",opacity:1},incoming:{transform:"none",filter:"none",opacity:0}}
    if(motion==="blur") {
        const amount=clamp(safe(blur,4),0,12),axis=horizontal?"X":"Y"
        return {
            outgoing:{transform:`translate${axis}(${-departing*.45*sign}em)`,filter:`blur(${departing*amount}px)`,opacity:1-departing},
            incoming:{transform:`translate${axis}(${(1-arriving)*.45*sign}em)`,filter:`blur(${(1-arriving)*amount}px)`,opacity:arriving},
        }
    }
    const axis=horizontal?"Y":"X",rotationSign=horizontal?-sign:sign
    return {
        outgoing:{transform:`rotate${axis}(${-90*departing*rotationSign}deg)`,filter:"none",opacity:1-departing},
        incoming:{transform:`rotate${axis}(${90*(1-arriving)*rotationSign}deg)`,filter:"none",opacity:arriving},
    }
}
const wrap = (n: number, count: number) => (n % count + count) % count
function radii(value: string | number | undefined, width: number, height: number): number[] {
    const parts = String(value ?? "4%").trim().split("/")[0].split(/\s+/)
    const [a = "4%", b = a, c = a, d = b] = parts
    // Use one circular radius in DOM and WebGL, including the portrait cover.
    // A percentage refers to the full book's smaller dimension in both states.
    const maximum=Math.min(width*.5,height)*.5
    return [a, b, c, d].map(part => {
        const n=parseFloat(part), resolved=part.includes("%")?n*Math.min(width,height)/100:n
        return Number.isFinite(resolved)?clamp(resolved,0,maximum):0
    })
}

// The picture is projected onto the flat image plane. The folding surface
// reveals/crops that picture rather than squeezing it like ink on paper.
const PERSPECTIVE = .23
function foldPoint(distance:number,fold:number,bend:number,direction:number){
    const angle=fold*Math.PI, sine=Math.max(0,Math.sin(angle))
    const lift=sine*Math.min(1,1.08*Math.sqrt(sine))
    const x=-distance*Math.cos(angle)*direction
    const z=distance*lift-.055*bend*Math.sin(Math.PI*distance)*lift
    return {x,z}
}
function foldCenter(fold:number,bend:number,direction:number){
    let left=Math.min(0,direction),right=Math.max(0,direction)
    for(let i=0;i<=32;i++){const point=foldPoint(i/32,fold,bend,direction),x=point.x/(1-point.z*PERSPECTIVE);left=Math.min(left,x);right=Math.max(right,x)}
    return (left+right)/2
}
const VERTEX = `
precision highp float;
attribute vec2 aUV;
uniform float uProgress;
uniform float uDirection;
uniform float uBend;
uniform float uPart;
uniform float uCenter;
uniform vec2 uScale;
varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;
void main() {
    float angle=uProgress*3.14159265359;
    float sine=max(0.0,sin(angle));
    float lift=sine*min(1.0,1.08*sqrt(sine));
    float distance=1.0-aUV.x;
    float x=aUV.x, z=0.0;
    vec3 normal=vec3(0.0,0.0,1.0);
    if(uPart>.5){
        x=-distance*cos(angle);
        z=distance*lift-.055*uBend*sin(distance*3.14159265359)*lift;
        float dz=lift-.055*uBend*3.14159265359*cos(distance*3.14159265359)*lift;
        normal=normalize(vec3(dz*uDirection,0.0,cos(angle)));
        z+=.0002;
    }
    x*=uDirection;
    float y=aUV.y*2.0-1.0;
    float perspective=1.0-z*.23;
    // Screen-space translation preserves the optical image's pixel scale.
    gl_Position=vec4((x-uCenter*perspective)*uScale.x,y*uScale.y,-z*.08,perspective);
    vPosition=vec3(x,y,z);
    vNormal=normal;
    float u=uPart>.5?aUV.x*.5:.5+aUV.x*.5;
    vUV=vec2(uDirection>0.0?u:1.0-u,aUV.y);
}`
const FRAGMENT = `
precision highp float;
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform vec2 uFrontCrop;
uniform vec2 uBackCrop;
uniform vec4 uTextureSize;
uniform vec2 uViewport;
uniform vec2 uScale;
uniform float uCenter;
uniform vec2 uSize;
uniform vec4 uRadius;
uniform float uProgress;
uniform float uPart;
uniform float uDirection;
uniform float uDuo;
varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;
vec3 opticalSample(sampler2D photo,vec2 uv,vec2 textureSize,vec2 crop,float sigma){
    vec2 footprint=textureSize*crop/max(vec2(1.0),uViewport*uScale);
    float baseLevel=max(0.0,log2(max(footprint.x,footprint.y)));
    vec2 spread=sigma*vec2(uSize.y/uSize.x,1.0)*crop;
    vec2 texelSpread=spread*textureSize;
    // texture2D's third parameter adds bias to the implicit mip level.
    // Compensate for minification so smaller books do not blur twice.
    float level=max(0.0,log2(max(1.0,1.732*max(texelSpread.x,texelSpread.y)))-baseLevel);
    vec2 d=spread*1.25;
    vec3 c=texture2D(photo,uv,level).rgb*.28;
    c+=texture2D(photo,uv+vec2(d.x,0.0),level).rgb*.12;
    c+=texture2D(photo,uv-vec2(d.x,0.0),level).rgb*.12;
    c+=texture2D(photo,uv+vec2(0.0,d.y),level).rgb*.12;
    c+=texture2D(photo,uv-vec2(0.0,d.y),level).rgb*.12;
    c+=texture2D(photo,uv+d,level).rgb*.06;
    c+=texture2D(photo,uv-d,level).rgb*.06;
    c+=texture2D(photo,uv+vec2(d.x,-d.y),level).rgb*.06;
    c+=texture2D(photo,uv+vec2(-d.x,d.y),level).rgb*.06;
    return c;
}
void main(){
    bool moving=uPart>.5;
    bool face=uDirection>0.0?gl_FrontFacing:!gl_FrontFacing;
    bool backFace=moving&&!face;
    bool cover=backFace&&uDuo<.5;
    vec4 cornerRadius=backFace?uRadius.yxwz:uRadius;
    bool leftHalf=moving?uDirection>0.0:uDirection<0.0;
    vec2 halfSize=vec2(uSize.x*.5,uSize.y);
    vec2 coord=vec2((vUV.x-(leftHalf?0.0:.5))*uSize.x,vUV.y*uSize.y);
    float radius=coord.x<halfSize.x*.5?(coord.y<halfSize.y*.5?cornerRadius.w:cornerRadius.x):(coord.y<halfSize.y*.5?cornerRadius.z:cornerRadius.y);
    bool atHinge=leftHalf?coord.x>halfSize.x*.5:coord.x<halfSize.x*.5;
    if(atHinge)radius*=uDuo>.5?0.0:pow(uProgress,8.0);
    radius=min(radius,min(halfSize.x,halfSize.y)*.5);
    vec2 q=abs(coord-halfSize*.5)-(halfSize*.5-vec2(radius));
    float edge=length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;
    // Interior edges meet without a translucent seam on the open image.
    if(atHinge&&min(coord.y,halfSize.y-coord.y)>=radius)edge=min(edge,max(-coord.y,coord.y-halfSize.y));
    float alpha=1.0-smoothstep(-.6,.6,edge);
    if(alpha<.005)discard;
    // Derive projection from the same pixel coordinates on both draws.
    // This also makes texture derivatives identical at the shared spine.
    vec2 projected=(gl_FragCoord.xy/uViewport*2.0-1.0)/uScale+vec2(uCenter,0.0);
    vec2 uv=projected*.5+.5;
    if(cover){
        vec2 rest=vec2(uDirection>0.0?1.0-vUV.x*2.0:2.0-vUV.x*2.0,vUV.y);
        vec2 ray=vec2(projected.x+(1.0-uDirection)*.5,projected.y*.5+.5);
        uv=mix(ray,rest,smoothstep(.5,1.0,uProgress));
    }
    float lift=max(0.0,sin(uProgress*3.14159265359));
    float distance=clamp(leftHalf?1.0-vUV.x*2.0:vUV.x*2.0-1.0,0.0,1.0);
    float area=moving?smoothstep(cover?.45:.12,.96,distance)*lift:0.0;
    vec2 crop=backFace?uBackCrop:uFrontCrop;
    vec2 imageUV=(uv-.5)*crop+.5;
    // The reference keeps the inner surface crisp; softness gathers at the
    // raised outer edge instead of washing across the whole moving half.
    float blur=cover?.005*area*area:.0098*lift*lift*pow(distance,4.0);
    vec3 color;
    if(!moving)color=texture2D(uFront,imageUV).rgb;
    else color=backFace?opticalSample(uBack,imageUV,uTextureSize.zw,crop,blur):opticalSample(uFront,imageUV,uTextureSize.xy,crop,blur);
    if(moving){
        // The optical image lives on a black plane. Raised corners reveal
        // its black surround, and the blur softly crosses that boundary.
        if(cover){
            float softness=max(.0015,blur*2.0);
            vec2 inside=smoothstep(vec2(-softness),vec2(softness),uv)*(1.0-smoothstep(vec2(1.0-softness),vec2(1.0+softness),uv));
            float outer=1.0-.25*pow(distance,2.4)*lift;
            float stripe=exp(-pow((distance-.46)/.16,2.0));
            color=(color*outer+vec3(stripe*.035*lift))*inside.x*inside.y;
        }else{
            // Measured optical falloff: the highlight travels toward the edge
            // as the face rises; the photo stays clear near the hinge.
            float opticalAngle=uDuo>.5&&backFace?1.0-uProgress:uProgress;
            float tilt=smoothstep(.331,.414,opticalAngle);
            float highlightCenter=mix(.375,.45,tilt);
            float shadowStart=mix(.515,.54,tilt);
            float shadowStrength=mix(1.32,1.55,tilt);
            float gain=1.0-shadowStrength*lift*max(distance-shadowStart,0.0);
            float highlight=.11*lift*exp(-pow((distance-highlightCenter)/.185,2.0));
            // Fade into the black surround outside the projected image,
            // without dimming the original image boundary itself.
            float feather=max(.0015,.117*lift*distance);
            vec2 inside=smoothstep(vec2(-feather),vec2(0.0),uv)*(1.0-smoothstep(vec2(1.0),vec2(1.0+feather),uv));
            color=(color*gain+vec3(highlight))*inside.x*inside.y;
        }
    }

    if(uDuo>.5&&!moving){
        // A soft contact shadow keeps the two underlying halves connected.
        // Its sine envelope vanishes at both exact resting states.
        float shade=.085*lift*exp(-abs(projected.x)/(.045+.075*lift));
        color*=1.0-shade;
    }
    gl_FragColor=vec4(clamp(color,0.0,1.0),alpha);
}`

type Loaded = { texture: WebGLTexture; width: number; height: number; textureWidth:number; textureHeight:number }
type Renderer = { load: (src: string) => Promise<Loaded>; draw: (a: Loaded,b: Loaded,p: number,direction: number,bend: number,w: number,h: number,cardW: number,cardH: number,radius: number[],duo?: boolean) => void; destroy: () => void }
function makeRenderer(canvas: HTMLCanvasElement): Renderer | null {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true, depth: true })
    if (!gl) { console.warn("DuoFoldGallery: WebGL is unavailable; using the static image fallback."); return null }
    const shaders: WebGLShader[] = []
    const textures = new Map<string, Promise<Loaded>>()
    const loaded = new Map<string, { value: Loaded; used: number }>()
    const pending = new Map<string, { image: HTMLImageElement; reject: (reason: Error) => void }>()
    const resources = new Set<WebGLTexture>()
    let disposed = false, access = 0
    const shader = (type: number, source: string) => {
        const result = gl.createShader(type)
        if (!result) throw new Error("Shader unavailable")
        shaders.push(result); gl.shaderSource(result, source); gl.compileShader(result)
        if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(`Shader compilation failed: ${gl.getShaderInfoLog(result) || "No compiler log"}`)
        return result
    }
    const program = gl.createProgram(), buffer = gl.createBuffer()
    if (!program || !buffer) { if (program) gl.deleteProgram(program); if (buffer) gl.deleteBuffer(buffer); return null }
    try {
        gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT))
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Shader linking failed: ${gl.getProgramInfoLog(program) || "No linker log"}`)
    } catch (error) {
        console.warn("DuoFoldGallery: the fold renderer could not initialize; using the static image fallback.", error)
        shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program); gl.deleteBuffer(buffer); return null
    }
    const vertices: number[] = [], columns = 100, rows = 1
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        const l = x / columns, r = (x + 1) / columns, b = y / rows, t = (y + 1) / rows
        vertices.push(l, b, r, b, l, t, l, t, r, b, r, t)
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    gl.useProgram(program)
    const attribute = gl.getAttribLocation(program, "aUV")
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
    const uniforms = Object.fromEntries(["uProgress", "uDirection", "uBend", "uPart", "uCenter", "uDuo", "uTextureSize", "uViewport", "uScale", "uSize", "uRadius", "uFront", "uBack", "uFrontCrop", "uBackCrop"].map(name => [name, gl.getUniformLocation(program, name)]))
    const maxTextureSize = Math.min(2048, Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 2048)
    const release = (src: string) => {
        const entry = loaded.get(src)
        if (!entry) return
        gl.deleteTexture(entry.value.texture); resources.delete(entry.value.texture)
        loaded.delete(src); textures.delete(src)
    }
    // Eviction runs only after a draw has bound its two live textures. Neither
    // live texture can be deleted, even if it is older than a prefetched image.
    const trim = (a: Loaded, b: Loaded) => {
        if (loaded.size <= 6) return
        const candidates = Array.from(loaded.entries()).sort((a, b) => a[1].used - b[1].used)
        for (const [src, entry] of candidates) {
            if (loaded.size <= 6) break
            if (entry.value.texture !== a.texture && entry.value.texture !== b.texture) release(src)
        }
    }
    const load = (src: string): Promise<Loaded> => {
        if (disposed) return Promise.reject(new Error("Renderer disposed"))
        const existing = loaded.get(src)
        if (existing) existing.used = ++access
        const cached = textures.get(src)
        if (cached) return cached
        const promise = new Promise<Loaded>((resolve, reject) => {
            const image = new Image(); image.crossOrigin = "anonymous"; image.decoding = "async"
            const clear = () => { pending.delete(src); image.onload = null; image.onerror = null }
            pending.set(src, { image, reject })
            image.onload = () => {
                clear()
                if (disposed) { reject(new Error("Renderer disposed")); return }
                const texture = gl.createTexture()
                if (!texture) { reject(new Error("Texture unavailable")); return }
                resources.add(texture)
                try {
                    if (!image.naturalWidth || !image.naturalHeight) throw new Error("Image unavailable")
                    const maxPower=2**Math.floor(Math.log2(maxTextureSize))
                    const ratio=Math.min(1,maxPower/Math.max(image.naturalWidth,image.naturalHeight))
                    const small=document.createElement("canvas")
                    small.width=Math.min(maxPower,2**Math.ceil(Math.log2(Math.max(1,image.naturalWidth*ratio))))
                    small.height=Math.min(maxPower,2**Math.ceil(Math.log2(Math.max(1,image.naturalHeight*ratio))))
                    const context=small.getContext("2d")
                    if(!context)throw new Error("Texture resize unavailable")
                    context.drawImage(image,0,0,small.width,small.height)
                    const source:TexImageSource=small
                    gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);gl.generateMipmap(gl.TEXTURE_2D)
                    if (gl.isContextLost()) throw new Error("Graphics context unavailable")
                    const value = { texture, width: image.naturalWidth, height: image.naturalHeight,textureWidth:small.width,textureHeight:small.height }
                    loaded.set(src, { value, used: ++access }); resolve(value)
                } catch (error) { gl.deleteTexture(texture); resources.delete(texture); reject(error) }
            }
            image.onerror = () => { clear(); reject(new Error("Image unavailable")) }
            image.src = src
        })
        textures.set(src, promise)
        promise.catch(() => { if (textures.get(src) === promise) textures.delete(src) })
        return promise
    }
    const crop = (photo: Loaded, ratio: number) => { const imageRatio = photo.width / photo.height; return imageRatio > ratio ? [ratio / imageRatio, 1] : [1, imageRatio / ratio] }
    return {
        load,
        draw(a, b, p, direction, bend, w, h, cardW, cardH, radius, duo=false) {
            if (disposed || w <= 0 || h <= 0 || gl.isContextLost()) return
            const dpr = Math.min(window.devicePixelRatio || 1, 2), pixelW = Math.round(w * dpr), pixelH = Math.round(h * dpr)
            if (canvas.width !== pixelW || canvas.height !== pixelH) { canvas.width = pixelW; canvas.height = pixelH }
            gl.viewport(0, 0, pixelW, pixelH); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
            gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND)
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            gl.uniform2f(uniforms.uViewport,pixelW,pixelH);gl.uniform1f(uniforms.uCenter,duo?0:foldCenter(p,bend,direction));gl.uniform1f(uniforms.uDuo,duo?1:0);gl.uniform4f(uniforms.uTextureSize,a.textureWidth,a.textureHeight,b.textureWidth,b.textureHeight);
            gl.uniform1f(uniforms.uProgress, p); gl.uniform1f(uniforms.uDirection, direction); gl.uniform1f(uniforms.uBend, bend)
            gl.uniform2f(uniforms.uScale, cardW / w, cardH / h); gl.uniform2f(uniforms.uSize, cardW, cardH)
            gl.uniform4f(uniforms.uRadius, radius[0], radius[1], radius[2], radius[3])
            const ca = crop(a, cardW / cardH), cb = crop(b, cardW * (duo?1:.5) / cardH)
            gl.uniform2f(uniforms.uFrontCrop, ca[0], ca[1]); gl.uniform2f(uniforms.uBackCrop, cb[0], cb[1])
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.texture); gl.uniform1i(uniforms.uFront, 0)
            gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b.texture); gl.uniform1i(uniforms.uBack, 1)
            if(duo){
                // One leaf travels through 180 degrees over a full-width base.
                // Forward: old left + new right, covered by old right -> new left.
                gl.uniform1f(uniforms.uPart,0);gl.uniform1f(uniforms.uDirection,-direction)
                gl.drawArrays(gl.TRIANGLES,0,vertices.length/2)
                gl.uniform1f(uniforms.uDirection,direction)
                gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,b.texture)
                gl.uniform2f(uniforms.uFrontCrop,cb[0],cb[1])
                gl.drawArrays(gl.TRIANGLES,0,vertices.length/2)
                gl.uniform1f(uniforms.uDirection,-direction);gl.uniform1f(uniforms.uPart,1)
                gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,a.texture)
                gl.uniform2f(uniforms.uFrontCrop,ca[0],ca[1])
                gl.drawArrays(gl.TRIANGLES,0,vertices.length/2)
            }else{
                gl.uniform1f(uniforms.uPart,0);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2)
                gl.uniform1f(uniforms.uPart,1);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2)
            }
            trim(a, b)
        },
        destroy() {
            disposed = true
            pending.forEach(({ image, reject }) => { image.onload = null; image.onerror = null; image.src = ""; reject(new Error("Renderer disposed")) })
            pending.clear(); resources.forEach(texture => gl.deleteTexture(texture)); resources.clear()
            shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program); gl.deleteBuffer(buffer); textures.clear(); loaded.clear()
        }
    }
}
/**
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 985
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function DuoFoldGallery(props: DuoFoldGalleryProps) {
    const {items=SAMPLES,cover=COVER,startClosed=false,imageRatio=1.4,imageScale=82,stageRatio=1.3,radius="4%",padding="0px",duration=1.05,bend=1,autoplay=false,showAutoplayControl=false,autoplayDelay=3,autoplayLoop=true,pauseOnHover=true,showArrows=true,showCounter=true,counterFormat="padded",counterMotion="fold",counterDirection="up",counterSpeed=1,counterBlur=4,navigationGap=4,navigationOffset=26,buttonSize=44,buttonStyle="minimal",navigationFill="#343A40",hoverDuration=.18,navigationStyle="framed",navigationSurface="#24282C",navigationBorder="rgba(255,255,255,.085)",navigationRadius="999px",navigationFont,fitViewport=true,viewportSpace=112,background="#181A1C",studioLight=true,surfaceLight="#72808A",lightStrength=8,grain=1.2,backgroundPattern="grid",patternSize=96,patternOpacity=6.5,patternColor="#FFFFFF",imageShadow=true,navigationColor="#E5E8EB",accent="#A9BAC6",startItem=1,accessibleLabel="Image gallery",style}=props
    const data=React.useMemo(()=>Array.isArray(items)?items.filter(Boolean).map((entry,index)=>({...entry,image:entry.image?.src?entry.image:SAMPLES[index]?.image})):SAMPLES,[items])
    const coverPhoto=cover?.src?cover:COVER
    const count=data.length,initial=clamp(Math.round(safe(startItem,1))-1,0,Math.max(0,count-1))
    const [active,setActive]=React.useState(initial),[closed,setClosed]=React.useState(startClosed),[animating,setAnimating]=React.useState(false)
    const [dragging,setDragging]=React.useState(false)
    const [,refreshNavigation]=React.useState(0)
    const [measuredWidth,setMeasuredWidth]=React.useState(1280),[stageWidth,setStageWidth]=React.useState(0)
    const [failure,setFailure]=React.useState(false),[broken,setBroken]=React.useState<Record<string,boolean>>({}),[announcement,setAnnouncement]=React.useState("")
    const isStatic=useIsStaticRenderer(),reduced=useReducedMotion(),instant=isStatic||!!reduced
    const current=clamp(isStatic?initial:active,0,Math.max(0,count-1)),slide=data[current],isClosed=isStatic?false:closed
    const displayed=count?(isClosed?coverPhoto:slide?.image):undefined
    const id=React.useId().replace(/:/g,"")
    const root=React.useRef<HTMLDivElement>(null),mainButton=React.useRef<HTMLButtonElement>(null),imageLink=React.useRef<HTMLAnchorElement>(null)
    const stage=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null)
    const counterOut=React.useRef<HTMLSpanElement>(null),counterIn=React.useRef<HTMLSpanElement>(null)
    const displayCache=React.useRef(new Map<string,{image:HTMLImageElement;promise:Promise<void>}>())
    const renderer=React.useRef<Renderer|null>(null),frame=React.useRef(0),generation=React.useRef(0),busy=React.useRef(false)
    // The optional cover exists only before the first opening. Gallery
    // transitions keep the same wide image frame and commit one new image.
    const activeRef=React.useRef(initial),closedRef=React.useRef(startClosed)
    const queued=React.useRef<number[]>([]),requestedPage=React.useRef<number|null>(null),navigationIntent=React.useRef(0),drainQueueRef=React.useRef<()=>void>(()=>{})
    type Turning={ticket:number;intro:boolean;from:number;target:number;direction:number;progress:number;displayProgress:number;velocity:number;visualVelocity?:number;manual:boolean;automatic?:boolean;chasing?:boolean;fallback?:boolean;ready?:boolean;displayWidth?:number;displayPending?:Promise<void>;handoff?:number;a?:Loaded;b?:Loaded;settle?:number}
    const turning=React.useRef<Turning|null>(null)
    type Resume={end:number;queued:number[];requestedPage:number|null;intent:number}
    const gesture=React.useRef<{id:number;x:number;y:number;lastTime:number;moved:boolean;ticket?:number;anchorX?:number;baseProgress?:number;previousProgress?:number;relativeTravel?:number;resume?:Resume}|null>(null),suppressClick=React.useRef(false)
    const imgRatio=clamp(safe(imageRatio,1.4),.5,2.5),stageAspect=clamp(safe(stageRatio,1.3),.8,2.5)
    const scale=Math.min(clamp(safe(imageScale,82),35,88),76*imgRatio/stageAspect)
    const bookWidth=(stageWidth||measuredWidth)*scale/100
    const radiusCSS=radii(radius,bookWidth,bookWidth/imgRatio).map(value=>`${value}px`).join(" ")
    const live=React.useRef({data,count,instant,duration,bend,radius,coverPhoto,imgRatio,scale,counterMotion,counterDirection,counterSpeed,counterBlur});live.current={data,count,instant,duration,bend,radius,coverPhoto,imgRatio,scale,counterMotion,counterDirection,counterSpeed,counterBlur}
    const prepareDisplay=(photo:Photo|undefined,width:number)=>{
        if(!photo?.src||typeof Image==="undefined")return Promise.resolve()
        const sizes=`${Math.ceil(width)}px`,key=`${photo.src}\n${photo.srcSet||""}\n${sizes}`,cache=displayCache.current
        const existing=cache.get(key)
        if(existing){cache.delete(key);cache.set(key,existing);return existing.promise}
        const image=new Image();image.decoding="async"
        const promise=new Promise<void>((resolve,reject)=>{
            image.onload=()=>{image.onload=null;image.onerror=null;const decoded=typeof image.decode==="function"?image.decode():Promise.resolve();decoded.then(()=>resolve(),()=>resolve())}
            image.onerror=()=>{image.onload=null;image.onerror=null;reject(new Error("Display image unavailable"))}
            // Match the resting <img>'s candidate, not only the GL original.
            image.sizes=sizes;image.srcset=photo.srcSet||"";image.src=photo.src
        })
        cache.set(key,{image,promise})
        while(cache.size>6)cache.delete(cache.keys().next().value!)
        promise.catch(()=>{if(cache.get(key)?.promise===promise)cache.delete(key)})
        return promise
    }
    const drawTurn=(turn:Turning)=>{
        const engine=renderer.current,node=stage.current,cfg=live.current
        if(!engine||!node||!turn.a||!turn.b)return
        const width=node.clientWidth*cfg.scale/100,height=width/cfg.imgRatio
        const progress=turn.displayProgress
        // The index follows the visible fold; the total remains still.
        const numberFrames=counterFrames(progress,turn.direction,cfg.counterMotion,cfg.counterDirection,cfg.counterSpeed,cfg.counterBlur)
        if(counterOut.current)Object.assign(counterOut.current.style,numberFrames.outgoing)
        if(counterIn.current)Object.assign(counterIn.current.style,numberFrames.incoming)
        // Gallery turns sweep one leaf over a stable, full-width backing.
        // Only the optional introductory cover uses the original open pose.
        const fold=turn.intro?1-progress:progress
        engine.draw(turn.a,turn.b,fold,turn.direction,clamp(safe(cfg.bend,1),0,2.4),node.clientWidth,node.clientHeight,width,height,radii(cfg.radius,width,height),!turn.intro)
        setAnimating(true)
    }
    const followPointer=(turn:Turning)=>{
        if(turn.chasing||!turn.a||!turn.b)return
        turn.chasing=true
        let previous=performance.now()
        const tick=(time:number)=>{
            if(turn.ticket!==generation.current||!turn.manual){turn.chasing=false;return}
            const dt=Math.min(.05,Math.max(0,(time-previous)/1000));previous=time
            // Exact critically damped tracking carries both position and
            // instantaneous velocity through pointer changes and handoffs.
            // Its response is independent of 60/120Hz frame cadence.
            const frequency=24,offset=turn.displayProgress-turn.progress,velocity=safe(turn.visualVelocity,0)
            const combined=velocity+frequency*offset,decay=Math.exp(-frequency*dt)
            const position=turn.progress+(offset+combined*dt)*decay
            turn.displayProgress=clamp(position,0,1)
            turn.visualVelocity=position<0||position>1?0:(velocity-frequency*combined*dt)*decay
            if(Math.abs(turn.displayProgress-turn.progress)<.00005&&Math.abs(turn.visualVelocity)<.001){turn.displayProgress=turn.progress;turn.visualVelocity=0;turn.chasing=false}
            drawTurn(turn)
            if(turn.chasing)frame.current=requestAnimationFrame(tick)
        }
        frame.current=requestAnimationFrame(tick)
    }
    const finishTurn=(turn:Turning,commit:boolean)=>{
        if(turn.ticket!==generation.current)return
        const width=Math.ceil((stage.current?.clientWidth||measuredWidth)*live.current.scale/100)
        if(commit&&(turn.displayWidth!==width||turn.displayPending)){
            if(turn.displayWidth!==width){turn.displayWidth=width;turn.displayPending=prepareDisplay(live.current.data[turn.target]?.image,width)}
            // A resize may select a different responsive resource mid-turn.
            // Keep the completed canvas visible until that candidate is ready.
            const pending=turn.displayPending!,handoff=turn.handoff=(turn.handoff||0)+1
            const ready=()=>{if(turn.displayPending===pending)turn.displayPending=undefined;if(turn.handoff===handoff&&!turn.manual)finishTurn(turn,true)}
            pending.then(ready,ready);return
        }
        if(commit){
            closedRef.current=false;setClosed(false)
            activeRef.current=turn.target;setActive(turn.target)
            if(!turn.automatic)setAnnouncement(`Image ${turn.target+1} of ${live.current.count}. ${live.current.data[turn.target]?.alt||live.current.data[turn.target]?.image?.alt||""}`)
        }
        busy.current=false;turning.current=null;setAnimating(false)
        refreshNavigation(value=>value+1)
        drainQueueRef.current()
    }
    const settleTurn=(turn:Turning,end:number)=>{
        turn.handoff=(turn.handoff||0)+1
        turn.settle=end;turn.manual=false;turn.chasing=false
        if(turn.fallback){if(turn.ready)finishTurn(turn,end===1);return}
        if(!turn.a||!turn.b)return
        cancelAnimationFrame(frame.current)
        turn.progress=turn.displayProgress
        // One easing curve carries the leaf across the fixed center hinge.
        // Neither the clock nor its velocity restarts at the edge-on pose.
        const origin=turn.progress,initialVelocity=safe(turn.visualVelocity,0),requestedDelta=end-origin
        if(Math.abs(requestedDelta)<.000001){turn.progress=end;turn.displayProgress=end;drawTurn(turn);finishTurn(turn,end===1);return}
        // An opposite request first brakes the velocity already on screen.
        // Limit that continuation to 4.5% of a turn and keep it inside the leaf.
        const away=initialVelocity*requestedDelta<0
        const room=initialVelocity>0?1-origin:origin
        const brake=away?Math.min(.11,2*Math.min(room*.9,.045)/Math.abs(initialVelocity)):0
        const start=origin+initialVelocity*brake*.5,delta=end-start,distance=Math.abs(delta)
        const toward=away?0:Math.max(0,initialVelocity*Math.sign(delta))
        let length=clamp(safe(live.current.duration,1.05),.3,3)*Math.pow(distance,.6)
        length=Math.max(.26,length)
        // Ordinary turns retain their quintic timing. A faster hand release
        // uses monotone deceleration instead of clipping its initial velocity.
        const slope=toward*length/distance
        const blend=clamp((slope-2)/.5,0,1),decayMix=blend*blend*(3-2*blend)
        let elapsed=0
        let previous=performance.now()
        const tick=(time:number)=>{
            if(turn.ticket!==generation.current)return
            const dt=Math.min(.05,Math.max(0,(time-previous)/1000));previous=time;elapsed+=dt
            const done=elapsed>=brake+length
            if(elapsed<brake){
                const s=elapsed/brake,s2=s*s,s3=s2*s,s4=s3*s
                turn.progress=origin+initialVelocity*brake*(s-s3+.5*s4)
                turn.velocity=initialVelocity*(1-3*s2+2*s3)
            }else{
                const t=done?1:(elapsed-brake)/length,t2=t*t,t3=t2*t,t4=t3*t,t5=t4*t
                // Both curves have the same starting velocity. Blend only
                // where the quintic remains monotone, avoiding a threshold kink.
                const eased=decayMix===1?0:6*t5-15*t4+10*t3+slope*(t-6*t3+8*t4-3*t5)
                const easedSpeed=decayMix===1?0:(1-t)*(1-t)*((30-15*slope)*t2+2*slope*t+slope)
                const decayed=decayMix===0?0:1-Math.pow(1-t,slope)
                const decaySpeed=decayMix===0?0:slope*Math.pow(1-t,slope-1)
                const fraction=done?1:eased*(1-decayMix)+decayed*decayMix
                turn.progress=start+delta*fraction
                turn.velocity=done?0:delta/length*(easedSpeed*(1-decayMix)+decaySpeed*decayMix)
            }
            turn.displayProgress=turn.progress
            turn.visualVelocity=turn.velocity
            drawTurn(turn)
            if(done)finishTurn(turn,end===1)
            else frame.current=requestAnimationFrame(tick)
        }
        frame.current=requestAnimationFrame(tick)
    }
    const beginTurn=(intro:boolean,target:number,direction=1,manual=false,automatic=false)=>{
        const cfg=live.current
        if(!cfg.count||target<0||target>=cfg.count)return
        const turn:Turning={ticket:++generation.current,intro,from:activeRef.current,target,direction,progress:0,displayProgress:0,velocity:0,manual,automatic}
        busy.current=true;turning.current=turn;refreshNavigation(value=>value+1)
        const from=cfg.data[intro?target:turn.from]?.image?.src
        const to=intro?cfg.coverPhoto.src:cfg.data[target]?.image?.src
        const engine=renderer.current
        turn.fallback=cfg.instant||!engine||!from||!to
        const width=Math.ceil((stage.current?.clientWidth||measuredWidth)*cfg.scale/100);turn.displayWidth=width
        const displayReady=prepareDisplay(cfg.data[target]?.image,width)
        // Both full-width images are ready before the first frame. The back
        // face and revealed backing belong to the same destination image.
        const textures=turn.fallback?Promise.resolve(null):Promise.all([engine!.load(from!),engine!.load(to!)]).catch(error=>{
            if(turn.ticket===generation.current){console.warn("DuoFoldGallery: fold textures unavailable; using the display image.",error);turn.fallback=true}
            return null
        })
        Promise.all([textures,displayReady]).then(([images])=>{
            if(turn.ticket!==generation.current)return
            // Loading is not a visible fold yet. Recheck interaction gates so
            // a late texture/decode never starts a new animation under hover.
            if(turn.automatic&&!autoplayMayBegin.current()){finishTurn(turn,false);return}
            turn.ready=true
            if(!images){if(turn.settle!==undefined)finishTurn(turn,turn.settle===1);else if(!turn.manual)finishTurn(turn,true);return}
            turn.a=images[0];turn.b=images[1];drawTurn(turn)
            if(turn.settle!==undefined)settleTurn(turn,turn.settle)
            else if(!turn.manual)settleTurn(turn,1)
            else followPointer(turn)
        },(error)=>{if(turn.ticket===generation.current){if(turn.automatic&&!autoplayMayBegin.current()){finishTurn(turn,false);return}console.warn("DuoFoldGallery: an image could not load; switching without animation.",error);turn.ready=true;turn.fallback=true;if(turn.settle!==undefined)finishTurn(turn,turn.settle===1);else if(!turn.manual)finishTurn(turn,true)}})
    }
    const adjacentPage=(index:number,direction:number)=>{const count=live.current.count;return autoplay&&autoplayLoop&&count>1?(index+direction+count)%count:index+direction}
    const startStep=(direction:number)=>{
        const cfg=live.current
        if(isStatic||!cfg.count||(closedRef.current&&direction<0))return false
        const target=closedRef.current?activeRef.current:adjacentPage(activeRef.current,direction)
        if(target<0||target>=cfg.count)return false
        beginTurn(closedRef.current,target,direction)
        return true
    }
    drainQueueRef.current=()=>{
        if(!busy.current&&requestedPage.current!==null){
            const target=requestedPage.current;requestedPage.current=null
            if(target!==activeRef.current||closedRef.current){beginTurn(closedRef.current,target,target<activeRef.current?-1:1);return}
        }
        // Buffer at most one relative step. Repeated clicks cannot build a
        // long animation that keeps moving after the visitor stops clicking.
        while(!busy.current&&queued.current.length){
            const direction=queued.current.shift()!
            if(startStep(direction))break
        }
        refreshNavigation(value=>value+1)
    }
    const step=(direction:number)=>{
        const cfg=live.current
        if(isStatic||!cfg.count||(closedRef.current&&direction<0))return
        navigationIntent.current++
        if(turning.current)turning.current.automatic=false
        if(!busy.current){startStep(direction);return}
        requestedPage.current=null
        const turn=turning.current
        if(turn?.manual){
            // An explicit navigation command replaces the held drag. Release
            // its capture before settling so an old pointer-up cannot undo it.
            const held=gesture.current;gesture.current=null;setDragging(false);suppressClick.current=!!held
            if(held&&stage.current?.hasPointerCapture(held.id))stage.current.releasePointerCapture(held.id)
            queued.current=[];settleTurn(turn,turn.intro||direction===turn.direction?1:0);refreshNavigation(value=>value+1);return
        }
        if(turn&&!turn.intro&&!turn.manual){
            const end=direction===turn.direction?1:0
            if(end!==(turn.settle??1)){
                queued.current=[];settleTurn(turn,end);refreshNavigation(value=>value+1);return
            }
        }
        if(queued.current.length){
            if(queued.current[0]!==direction)queued.current=[]
            refreshNavigation(value=>value+1);return
        }
        const projected=turn?.settle===0?turn.from:turn?.target??activeRef.current
        const target=adjacentPage(projected,direction)
        if(target<0||target>=cfg.count)return
        queued.current=[direction];refreshNavigation(value=>value+1)
    }
    const toggle=()=>step(1)
    const goTo=(requested:number)=>{
        if(isStatic||!live.current.count)return
        const target=clamp(requested,0,live.current.count-1)
        navigationIntent.current++
        if(turning.current)turning.current.automatic=false
        queued.current=[];requestedPage.current=null
        if(busy.current){requestedPage.current=target;refreshNavigation(value=>value+1);return}
        if(target!==activeRef.current||closedRef.current)beginTurn(closedRef.current,target,target<activeRef.current?-1:1)
    }
    React.useEffect(()=>{
        const element=root.current,node=stage.current
        if(!element||!node||typeof ResizeObserver==="undefined")return
        const measure=()=>{setMeasuredWidth(element.clientWidth);setStageWidth(node.clientWidth);if(turning.current)drawTurn(turning.current)}
        const observer=new ResizeObserver(measure);observer.observe(element);observer.observe(node);measure()
        return()=>observer.disconnect()
    },[])
    React.useEffect(()=>{
        if(isStatic||!canvas.current)return
        const element=canvas.current
        const create=()=>{renderer.current?.destroy();renderer.current=makeRenderer(element);setFailure(!renderer.current)}
        create()
        const lost=(event:Event)=>{event.preventDefault();generation.current++;cancelAnimationFrame(frame.current);busy.current=false;turning.current=null;queued.current=[];requestedPage.current=null;const held=gesture.current;gesture.current=null;if(held&&stage.current?.hasPointerCapture(held.id))stage.current.releasePointerCapture(held.id);setDragging(false);suppressClick.current=!!held;renderer.current?.destroy();renderer.current=null;setAnimating(false);setFailure(true)}
        const restored=()=>create()
        element.addEventListener("webglcontextlost",lost);element.addEventListener("webglcontextrestored",restored)
        return()=>{generation.current++;cancelAnimationFrame(frame.current);renderer.current?.destroy();renderer.current=null;displayCache.current.clear();element.removeEventListener("webglcontextlost",lost);element.removeEventListener("webglcontextrestored",restored)}
    },[isStatic])
    React.useEffect(()=>{
        generation.current++;cancelAnimationFrame(frame.current);busy.current=false;turning.current=null;queued.current=[];requestedPage.current=null;gesture.current=null;activeRef.current=initial;closedRef.current=startClosed
        setActive(initial);setClosed(startClosed);setAnimating(false);setDragging(false);refreshNavigation(value=>value+1)
    },[initial,data,instant,startClosed,coverPhoto.src])
    React.useEffect(()=>{
        const width=(stage.current?.clientWidth||measuredWidth)*scale/100
        const neighbors=[current,current+1,current-1]
        if(autoplay&&autoplayLoop&&current===count-1)neighbors.push(0)
        if(autoplay&&autoplayLoop&&current===0)neighbors.push(count-1)
        for(const index of neighbors)if(index>=0&&index<count)prepareDisplay(data[index]?.image,width).catch(()=>{})
        if(instant||!renderer.current)return
        if(closed)renderer.current.load(coverPhoto.src).catch(()=>{})
        for(const index of neighbors){const entry=index>=0&&index<count?data[index]:undefined;if(entry?.image?.src)renderer.current.load(entry.image.src).catch(()=>{})}
    },[data,instant,failure,current,count,closed,coverPhoto.src,bookWidth,autoplay,autoplayLoop])
    // Autoplay waits for a completed leaf and a full viewing interval. Manual
    // activity replaces that interval; it never adds to the navigation queue.
    const [autoplayPaused,setAutoplayPaused]=React.useState(false)
    const [autoplayRevision,refreshAutoplay]=React.useState(0)
    const autoplayTimer=React.useRef<ReturnType<typeof setTimeout>|null>(null)
    const autoplayGate=React.useRef({paused:false,hovered:false,keyboard:false,visible:typeof document==="undefined"||document.visibilityState!=="hidden",inView:false})
    const autoplayMayBegin=React.useRef<()=>boolean>(()=>false)
    autoplayMayBegin.current=()=>{
        const gate=autoplayGate.current
        return autoplay&&!live.current.instant&&live.current.count>1&&!gate.paused&&!(pauseOnHover&&gate.hovered)&&!gate.keyboard&&gate.visible&&gate.inView
    }
    const clearAutoplay=()=>{if(autoplayTimer.current!==null){clearTimeout(autoplayTimer.current);autoplayTimer.current=null}}
    const refreshAutoplayDwell=()=>{clearAutoplay();refreshAutoplay(value=>value+1)}
    const noteAutoplayInput=()=>{
        if(!autoplay)return
        refreshAutoplayDwell()
    }
    const autoplayFocus=(target:EventTarget|null)=>{
        const element=target as HTMLElement|null
        return !!element&&!element.closest?.("[data-autoplay-toggle]")&&!!element.matches?.(":focus-visible")
    }
    const autoplayAtEnd=!autoplayLoop&&!isClosed&&current>=count-1
    // The icon expresses the visitor's choice, even while hover or visibility
    // temporarily suspends the timer. Mouse focus never becomes a sticky pause.
    const autoplayArmed=autoplay&&!autoplayPaused&&!autoplayAtEnd&&!instant&&count>1
    const toggleAutoplay=()=>{
        if(!autoplay||instant||count<2)return
        noteAutoplayInput();autoplayGate.current.keyboard=false
        if(autoplayAtEnd&&!busy.current){autoplayGate.current.paused=false;setAutoplayPaused(false);beginTurn(false,0,1);return}
        autoplayGate.current.paused=!autoplayGate.current.paused
        setAutoplayPaused(autoplayGate.current.paused)
    }
    React.useEffect(()=>{
        const element=root.current,gate=autoplayGate.current
        gate.paused=false
        gate.hovered=!!element?.matches?.(":hover")&&(typeof matchMedia==="undefined"||matchMedia("(hover: hover)").matches)
        gate.keyboard=typeof document!=="undefined"&&!!document.activeElement&&!!element?.contains(document.activeElement)&&autoplayFocus(document.activeElement)
        setAutoplayPaused(false);refreshAutoplayDwell()
    },[autoplay])
    React.useEffect(()=>{
        if(!autoplay||isStatic||typeof document==="undefined")return
        const gate=autoplayGate.current
        const visibility=()=>{gate.visible=document.visibilityState!=="hidden";refreshAutoplayDwell()}
        visibility();document.addEventListener("visibilitychange",visibility)
        const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>{
            const entry=entries[0];if(!entry)return
            const visible=entry.isIntersecting&&entry.intersectionRatio>=.35
            if(gate.inView!==visible){gate.inView=visible;refreshAutoplayDwell()}
        },{threshold:[0,.35]}):null
        if(observer&&root.current)observer.observe(root.current)
        else{gate.inView=true;refreshAutoplayDwell()}
        return()=>{clearAutoplay();observer?.disconnect();document.removeEventListener("visibilitychange",visibility)}
    },[autoplay,isStatic])
    React.useEffect(()=>{
        clearAutoplay()
        const available=()=>autoplayMayBegin.current()&&!busy.current&&!gesture.current&&!queued.current.length&&requestedPage.current===null
        if(!available()||autoplayAtEnd)return
        autoplayTimer.current=setTimeout(()=>{
            autoplayTimer.current=null
            if(!available())return
            const intro=closedRef.current,next=intro?activeRef.current:activeRef.current+1
            if(next>=live.current.count&&!autoplayLoop)return
            beginTurn(intro,next>=live.current.count?0:next,1,false,true)
        },clamp(safe(autoplayDelay,3),2,20)*1000)
        return clearAutoplay
    },[autoplay,autoplayPaused,autoplayRevision,autoplayDelay,autoplayLoop,pauseOnHover,instant,count,current,isClosed,animating,dragging,busy.current,data])
    const release=(event:React.PointerEvent<HTMLDivElement>,cancelled=false)=>{
        const g=gesture.current;if(!g||g.id!==event.pointerId)return
        gesture.current=null;setDragging(false)
        if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
        const turn=turning.current
        // A gesture owns only the turn that it began or explicitly caught.
        if(g.moved&&(!turn||g.ticket!==turn.ticket)){suppressClick.current=true;return}
        if(g.moved){
            suppressClick.current=true
            if(!turn)return
            const unit=1
            const idle=Math.max(0,event.timeStamp-g.lastTime)
            const velocity=cancelled||idle>120?0:clamp(turn.velocity*Math.exp(-idle/70),-1.1*unit,1.1*unit)
            if(g.resume){
                // A caught leaf follows the visitor's travel from the catch
                // point, regardless of how far autoplay had already advanced.
                const travel=g.relativeTravel??turn.progress-(g.baseProgress??turn.progress)
                const deliberate=!cancelled&&Math.abs(travel)>=.04&&Math.abs(travel+velocity*.065)>=.06
                const end=deliberate?(travel>0?1:0):g.resume.end
                if(!deliberate&&navigationIntent.current===g.resume.intent){queued.current=g.resume.queued.slice();requestedPage.current=g.resume.requestedPage}
                turn.velocity=velocity;settleTurn(turn,end);refreshNavigation(value=>value+1);return
            }
            // A gallery turn is one leaf sweep. Require deliberate travel,
            // then settle into exactly the adjacent image.
            const threshold=turn.intro?.5:.4
            const end=!cancelled&&turn.progress>=threshold*.8&&turn.progress+velocity*.065>=threshold?1:0
            turn.velocity=velocity*(velocity*(end-turn.progress)<0?.2:1)
            settleTurn(turn,end)
        }
    }
    const plannedPage=queued.current.reduce((page,direction)=>adjacentPage(page,direction),turning.current?.settle===0?turning.current.from:turning.current?.target??current)
    const manualLoop=autoplay&&autoplayLoop&&count>1
    const canRetarget=(direction:number)=>{const turn=turning.current;return !!turn&&((turn.manual&&(!turn.intro||direction>0))||(!turn.intro&&(direction===turn.direction?1:0)!==(turn.settle??1)))}
    const canPrevious=count>0&&((!isClosed&&(manualLoop||plannedPage>0))||canRetarget(-1))
    const canNext=count>0&&((!busy.current&&isClosed)||(!isClosed&&manualLoop)||plannedPage<count-1||canRetarget(1))
    // Place navigation relative to the resting picture, while keeping the
    // full stage available to the bending leaf above and behind the controls.
    const navigationInset=(100/stageAspect-scale/imgRatio)/2
    const hoverTime=clamp(safe(hoverDuration,.18),0,.6)
    const framed=navigationStyle==="framed"
    const arrowStyle:React.CSSProperties={position:"relative",display:"grid",placeItems:"center",boxSizing:"border-box",width:clamp(safe(buttonSize,44),44,72),height:clamp(safe(buttonSize,44),44,72),border:0,borderRadius:"50%",background:"transparent",color:navigationColor,cursor:"pointer",padding:0,flexShrink:0,touchAction:"manipulation",transition:instant?undefined:`opacity ${hoverTime}s ease`}
    const arrow=(direction:number)=><button className="flex-arrow" data-direction={direction} key={direction} type="button" disabled={direction<0?!canPrevious:!canNext} aria-label={direction<0?"Previous image":"Next image"} tabIndex={isStatic?-1:0} onPointerDown={event=>event.stopPropagation()} onClick={()=>step(direction)} style={arrowStyle}><span className="flex-arrow-icon" style={{position:"relative",display:"grid",placeItems:"center"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{transform:direction>0?"rotate(180deg)":undefined}}><path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span></button>
    const counterTurn=turning.current
    const numberFrames=counterFrames(counterTurn?.displayProgress??0,counterTurn?.direction??1,instant?"none":counterMotion,counterDirection,counterSpeed,counterBlur)
    const formatIndex=(value:number)=>counterFormat==="padded"?String(value).padStart(2,"0"):String(value)
    const counterWidth=`${Math.max(2,String(count).length)}ch`
    const fallback=<img onError={()=>{if(displayed?.src)setBroken(previous=>({...previous,[displayed.src]:true}))}} src={displayed?.src} srcSet={displayed?.srcSet} sizes={`${Math.ceil(bookWidth*(isClosed?.5:1))}px`} alt={isClosed?coverPhoto.alt||"Book cover":slide?.alt||slide?.image?.alt||slide?.title||`Image ${current+1}`} draggable={false} style={{display:"block",width:"100%",height:"100%",objectFit:"cover",borderRadius:radiusCSS,pointerEvents:"none"}}/>
    return <div ref={root} data-flex-gallery={id} data-renderer={isStatic?"canvas":reduced?"reduced-motion":failure?"fallback":"webgl"} role="region" aria-roledescription="flipbook" aria-label={accessibleLabel||"Image flipbook"} onPointerDownCapture={event=>{suppressClick.current=false;if(autoplay){autoplayGate.current.keyboard=false;if(event.pointerType==="touch")autoplayGate.current.hovered=false;noteAutoplayInput()}}} onPointerUpCapture={noteAutoplayInput} onPointerCancelCapture={noteAutoplayInput} onLostPointerCaptureCapture={noteAutoplayInput} onPointerEnter={event=>{if(autoplay&&event.pointerType!=="touch"){autoplayGate.current.hovered=true;refreshAutoplayDwell()}}} onPointerLeave={()=>{if(autoplay){autoplayGate.current.hovered=false;refreshAutoplayDwell()}}} onFocusCapture={event=>{if(autoplay){autoplayGate.current.keyboard=autoplayFocus(event.target);refreshAutoplayDwell()}}} onBlurCapture={event=>{if(autoplay&&!event.currentTarget.contains(event.relatedTarget as Node|null)){autoplayGate.current.keyboard=false;refreshAutoplayDwell()}}} onKeyDown={event=>{
        if(isStatic)return
        if(autoplay){autoplayGate.current.keyboard=!(event.target as HTMLElement).closest?.("[data-autoplay-toggle]");noteAutoplayInput()}
        suppressClick.current=false
        if(["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){
            event.preventDefault();if(event.target===imageLink.current)mainButton.current?.focus({preventScroll:true})
            if(event.key==="Home")goTo(0);else if(event.key==="End")goTo(count-1);else step(event.key==="ArrowLeft"?-1:1)
        }
    }} style={{position:"relative",boxSizing:"border-box",minWidth:0,background,backgroundImage:studioLight?`radial-gradient(ellipse closest-side at 50% 44%, color-mix(in srgb, ${surfaceLight} ${clamp(safe(lightStrength,8),0,40)}%, transparent), transparent 100%)`:undefined,...style,padding}}>
        {backgroundPattern==="grid"&&patternOpacity>0&&<div aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none",opacity:clamp(safe(patternOpacity,6.5),0,20)/100,backgroundImage:`linear-gradient(${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, transparent 1px)`,backgroundSize:`${clamp(safe(patternSize,96),32,240)}px ${clamp(safe(patternSize,96),32,240)}px`,backgroundPosition:"center center",maskImage:"radial-gradient(ellipse at 50% 44%, black 24%, transparent 76%)"}}/>}
        {grain>0&&<div aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none",opacity:clamp(safe(grain,1.2),0,8)/100,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Cpath fill='%23fff' filter='url(%23n)' d='M0 0h160v160H0z'/%3E%3C/svg%3E")`,maskImage:"radial-gradient(ellipse at center, black 35%, transparent 75%)"}}/>}
        <style>{`
            [data-flex-gallery="${id}"] .flex-stage-layout{container-type:inline-size}
            [data-flex-gallery="${id}"] button:focus-visible,[data-flex-gallery="${id}"] a:focus-visible{outline:2px solid ${accent};outline-offset:4px}
            [data-flex-gallery="${id}"] button:focus:not(:focus-visible),[data-flex-gallery="${id}"] a:focus:not(:focus-visible){outline:none}
            [data-flex-gallery="${id}"] button:disabled{opacity:.25;cursor:default!important}
            [data-flex-gallery="${id}"] .flex-arrow::before{content:"";position:absolute;inset:4px;border-radius:50%;box-sizing:border-box;border:${buttonStyle==="outline"?"1px solid color-mix(in srgb, currentColor 20%, transparent)":"1px solid transparent"};background:${buttonStyle==="filled"?navigationFill:"transparent"};transition:${instant?"none":`background-color ${hoverTime}s ease`}}
            [data-flex-gallery="${id}"] .flex-arrow:hover:not(:disabled)::before,[data-flex-gallery="${id}"] .flex-arrow:focus-visible::before{background:${navigationFill}}
            [data-flex-gallery="${id}"] .flex-arrow:active:not(:disabled)::before{background:color-mix(in srgb, ${navigationFill} 90%, ${navigationColor})}
        `}</style>
        <div className="flex-stage-layout" style={{position:"relative",width:"100%",maxWidth:fitViewport&&!isStatic?`max(240px, calc((100svh - ${clamp(safe(viewportSpace,112),64,320)}px) * ${stageAspect}))`:undefined,marginInline:"auto"}}>
        <div ref={stage} style={{position:"relative",width:"100%",aspectRatio:stageAspect,touchAction:"pan-y",userSelect:"none",pointerEvents:"none",cursor:dragging?"grabbing":undefined}}
            onPointerDown={event=>{
                if(isStatic||!count||event.button!==0||gesture.current)return
                suppressClick.current=false
                const g:NonNullable<typeof gesture.current>={id:event.pointerId,x:event.clientX,y:event.clientY,lastTime:event.timeStamp,moved:false}
                // Pointer down alone is still a click. Only horizontal intent
                // catches an in-flight page; tapping matches the Next control.
                gesture.current=g
            }}
            onPointerMove={event=>{
                const g=gesture.current;if(!g||g.id!==event.pointerId)return
                const dx=event.clientX-g.x,dy=event.clientY-g.y
                if(!g.moved&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){release(event,true);suppressClick.current=true;return}
                if(!g.moved&&Math.abs(dx)>6){
                    g.moved=true;setDragging(true);event.currentTarget.setPointerCapture(event.pointerId)
                    const caught=turning.current
                    if(caught){
                        caught.automatic=false
                        g.resume={end:caught.settle??1,queued:queued.current.slice(),requestedPage:requestedPage.current,intent:navigationIntent.current}
                        cancelAnimationFrame(frame.current);caught.settle=undefined;caught.manual=true;caught.chasing=false;caught.progress=caught.displayProgress;caught.velocity=0
                        queued.current=[];requestedPage.current=null;refreshNavigation(value=>value+1)
                    }
                    else{
                        const direction=dx<0?1:-1
                        const target=closedRef.current?activeRef.current:adjacentPage(activeRef.current,direction)
                        if(!closedRef.current||direction>0)beginTurn(closedRef.current,target,direction,true)
                    }
                    const turn=turning.current
                    if(turn){g.ticket=turn.ticket;g.baseProgress=turn.progress;g.previousProgress=turn.progress;g.anchorX=caught?event.clientX:g.x+Math.sign(dx)*6;turn.velocity=0}
                }
                const turn=turning.current
                if(g.moved&&turn&&g.ticket===turn.ticket&&g.baseProgress!==undefined&&g.anchorX!==undefined){
                    // Equal angular travel in both directions. Inverting the
                    // projected edge accelerated closing near the flat state.
                    const travel=Math.max(1,(stage.current?.clientWidth||500)*live.current.scale/100*(turn.intro ? .55 : .8))
                    // Keep intent outside the clamped render range. A backward
                    // catch near zero must still be allowed to return to zero.
                    g.relativeTravel=-(event.clientX-g.anchorX)/travel*turn.direction
                    const progress=clamp(g.baseProgress+g.relativeTravel,0,1)
                    const dt=(event.timeStamp-g.lastTime)/1000
                    if(dt>0){
                        const maximum=turn.intro?1.8:.9
                        const velocity=clamp((progress-(g.previousProgress??progress))/dt,-maximum,maximum)
                        turn.velocity+=(velocity-turn.velocity)*(1-Math.exp(-dt/.075))
                    }
                    turn.progress=progress;g.previousProgress=progress;followPointer(turn)
                }
                g.lastTime=event.timeStamp
            }}
            onPointerLeave={event=>{if(gesture.current&&!gesture.current.moved){release(event,true);suppressClick.current=true}}}
            onPointerUp={event=>release(event)} onPointerCancel={event=>release(event,true)} onLostPointerCapture={event=>release(event,true)}
            onClickCapture={event=>{if(suppressClick.current){event.preventDefault();event.stopPropagation();suppressClick.current=false}}}>
            {imageShadow&&<div aria-hidden="true" style={{position:"absolute",left:`${(100-scale*(isClosed?.5:1))/2}%`,top:"50%",width:`${scale*(isClosed?.5:1)}%`,aspectRatio:imgRatio*(isClosed?.5:1),transform:"translateY(-50%)",borderRadius:radiusCSS,boxShadow:"0 2px 5px rgba(0,0,0,.14), 0 14px 40px -16px rgba(0,0,0,.42)",pointerEvents:"none"}}/>}
            <div style={{position:"absolute",left:`${(100-scale*(isClosed?.5:1))/2}%`,top:"50%",width:`${scale*(isClosed?.5:1)}%`,aspectRatio:imgRatio*(isClosed?.5:1),transform:"translateY(-50%)",borderRadius:radiusCSS,opacity:animating?0:1,background:"rgba(128,128,128,.06)"}}>
                {displayed?.src&&!broken[displayed.src]?<button ref={mainButton} type="button" aria-label={isClosed?`Open flipbook. ${coverPhoto.alt||""}`:`${slide?.alt||slide?.image?.alt||slide?.title||`Image ${current+1}`}. ${current<count-1||manualLoop?"Next image":"Last image"}`} onClick={()=>{if(!isStatic)toggle()}} tabIndex={isStatic?-1:0} style={{display:"block",width:"100%",height:"100%",padding:0,border:0,borderRadius:radiusCSS,background:"transparent",pointerEvents:"auto",cursor:dragging?"grabbing":"grab"}}>{fallback}</button>:<button ref={mainButton} type="button" disabled={!count} onClick={()=>{if(!isStatic)toggle()}} style={{display:"grid",placeItems:"center",width:"100%",height:"100%",fontFamily:"Inter, sans-serif",fontSize:13,color:navigationColor,padding:20,textAlign:"center",border:0,borderRadius:radiusCSS,background:"transparent",pointerEvents:"auto"}}>{displayed?.src?"Image unavailable":"Add an image in Items"}</button>}
                {!isClosed&&slide?.link&&<a ref={imageLink} href={slide.link} target={slide.newTab?"_blank":undefined} rel={slide.newTab?"noopener noreferrer":undefined} aria-label="Open image link" tabIndex={isStatic||animating?-1:0} onPointerDown={event=>event.stopPropagation()} style={{position:"absolute",visibility:animating?"hidden":undefined,pointerEvents:"auto",bottom:8,right:8,width:44,height:44,display:"grid",placeItems:"center",borderRadius:4,background:"rgba(255,255,255,.9)",color:"#444",textDecoration:"none",fontSize:18}}>↗</a>}
            </div>
            {!isStatic&&<canvas ref={canvas} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",visibility:animating?"visible":"hidden"}}/>}
        </div>
        {(showArrows||showCounter||(autoplay&&showAutoplayControl))&&<div style={{position:"relative",zIndex:1,marginTop:`calc(${clamp(safe(navigationOffset,26),0,100)}px - ${navigationInset}cqw)`,paddingBottom:24}}><div role="group" aria-label="Gallery navigation" style={{position:"relative",display:"flex",width:"fit-content",maxWidth:"100%",boxSizing:"border-box",alignItems:"center",justifyContent:"center",gap:typeof navigationGap==="number"?clamp(navigationGap,0,64):navigationGap,marginInline:"auto",marginTop:0,padding:framed?1:0,border:framed?`1px solid ${navigationBorder}`:"1px solid transparent",borderRadius:navigationRadius,background:framed?navigationSurface:"transparent",boxShadow:undefined,color:navigationColor}}>
            {showArrows&&arrow(-1)}
            {showCounter&&<div aria-hidden="true" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,minHeight:22,minWidth:76,boxSizing:"border-box",paddingInline:4,fontFamily:"Inter, sans-serif",fontSize:12,fontWeight:500,letterSpacing:"-.01em",lineHeight:"1em",...navigationFont,fontVariantNumeric:"tabular-nums"}}>
                <span key={counterTurn?`turn-${counterTurn.ticket}`:`page-${current}-${isClosed}`} style={{position:"relative",display:"inline-block",width:counterWidth,height:"1.25em",perspective:160,textAlign:"center",overflow:counterMotion==="blur"?"hidden":undefined}}>
                    <span ref={counterOut} style={{position:"absolute",inset:0,display:"grid",placeItems:"center",backfaceVisibility:"hidden",...numberFrames.outgoing}}>{counterTurn?.intro||(!counterTurn&&isClosed)?"—":formatIndex((counterTurn?.from??current)+1)}</span>
                    {counterTurn&&<span ref={counterIn} style={{position:"absolute",inset:0,display:"grid",placeItems:"center",backfaceVisibility:"hidden",...numberFrames.incoming}}>{formatIndex(counterTurn.target+1)}</span>}
                </span>
                <span style={{opacity:.3,fontWeight:400}}>/</span>
                <span style={{opacity:.62,minWidth:counterWidth,textAlign:"center"}}>{formatIndex(count)}</span>
            </div>}
            {showArrows&&arrow(1)}
            {autoplay&&showAutoplayControl&&<button className="flex-arrow" data-autoplay-toggle type="button" aria-label={autoplayArmed?"Pause autoplay":"Play autoplay"} disabled={instant||count<2} tabIndex={isStatic?-1:0} onPointerDown={event=>event.stopPropagation()} onClick={toggleAutoplay} style={arrowStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{position:"relative"}}>
                    <g style={{opacity:autoplayArmed?1:0,transition:instant?undefined:`opacity ${hoverTime}s ease`}}><path d="M9 6.5v11m6-11v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></g>
                    <path d="m9 6 9 6-9 6V6Z" fill="currentColor" style={{opacity:autoplayArmed?0:1,transition:instant?undefined:`opacity ${hoverTime}s ease`}}/>
                </svg>
            </button>}
        </div></div>}
        </div>
        <span role="status" aria-live="polite" aria-atomic="true" style={{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>{announcement}</span>
    </div>
}

DuoFoldGallery.displayName = "Duo Fold Gallery"

addPropertyControls(DuoFoldGallery, {
    startClosed:{type:ControlType.Boolean,title:"Start Closed",defaultValue:false,description:"Optional introductory cover. Keep off for a gallery that starts directly on image 1."},
    cover:{type:ControlType.ResponsiveImage,title:"Cover",description:"Shown once before the first opening.",hidden:p=>!p.startClosed},
    items:{type:ControlType.Array,title:"Items",maxCount:30,defaultValue:SAMPLES,control:{type:ControlType.Object,controls:{image:{type:ControlType.ResponsiveImage,title:"Image"},title:{type:ControlType.String,title:"Title",defaultValue:""},alt:{type:ControlType.String,title:"Alt Text",defaultValue:""},link:{type:ControlType.Link,title:"Link",defaultValue:""},newTab:{type:ControlType.Boolean,title:"Open in New Tab",defaultValue:false,hidden:p=>!p.link}}}},
    imageRatio:{type:ControlType.Number,title:"Image Ratio",defaultValue:1.4,min:.5,max:2.5,step:.05},
    imageScale:{type:ControlType.Number,title:"Image Size",defaultValue:82,min:35,max:88,unit:"%"},
    stageRatio:{type:ControlType.Number,title:"Stage Ratio",defaultValue:1.3,min:.8,max:2.5,step:.05},
    fitViewport:{type:ControlType.Boolean,title:"Fit Viewport",defaultValue:true,description:"Keeps the image and navigation together on shorter screens."},
    viewportSpace:{type:ControlType.Number,title:"Screen Space",defaultValue:112,min:64,max:320,step:4,unit:"px",hidden:p=>!p.fitViewport},
    radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"4%",description:"Percentage corners use the book's smaller dimension in both open and closed states."},
    padding:{type:ControlType.Padding,title:"Padding",defaultValue:"0px"},
    duration:{type:ControlType.Number,title:"Duration",defaultValue:1.05,min:.3,max:3,step:.05,unit:"s"},
    bend:{type:ControlType.Number,title:"Bend",defaultValue:1,min:0,max:2.4,step:.05},
    autoplay:{type:ControlType.Boolean,title:"Autoplay",defaultValue:false,description:"Automatic folds pause while hidden, offscreen or using the keyboard. Respects reduced motion."},
    showAutoplayControl:{type:ControlType.Boolean,title:"Play / Pause",defaultValue:false,description:"Optional playback button in the navigation. Hover and keyboard focus pause autoplay independently.",hidden:p=>!p.autoplay},
    autoplayDelay:{type:ControlType.Number,title:"Viewing Time",defaultValue:3,min:2,max:20,step:.5,unit:"s",description:"Full viewing time after each completed fold or manual interaction.",hidden:p=>!p.autoplay},
    autoplayLoop:{type:ControlType.Boolean,title:"Loop",defaultValue:true,description:"Loop automatic turns, arrows and dragging seamlessly between the final and first images.",hidden:p=>!p.autoplay},
    pauseOnHover:{type:ControlType.Boolean,title:"Pause on Hover",defaultValue:true,hidden:p=>!p.autoplay},
    showArrows:{type:ControlType.Boolean,title:"Arrows",defaultValue:true},
    showCounter:{type:ControlType.Boolean,title:"Page Counter",defaultValue:true},
    navigationStyle:{type:ControlType.Enum,title:"Navigation",options:["framed","minimal"],optionTitles:["Framed","Minimal"],defaultValue:"framed",displaySegmentedControl:true,hidden:p=>!p.showArrows&&!p.showCounter&&!(p.autoplay&&p.showAutoplayControl)},
    navigationSurface:{type:ControlType.Color,title:"Nav Surface",defaultValue:"#24282C",hidden:p=>p.navigationStyle==="minimal"||(!p.showArrows&&!p.showCounter&&!(p.autoplay&&p.showAutoplayControl))},
    navigationBorder:{type:ControlType.Color,title:"Nav Border",defaultValue:"rgba(255,255,255,.085)",hidden:p=>p.navigationStyle==="minimal"||(!p.showArrows&&!p.showCounter&&!(p.autoplay&&p.showAutoplayControl))},
    navigationRadius:{type:ControlType.BorderRadius,title:"Nav Radius",defaultValue:"999px",hidden:p=>p.navigationStyle==="minimal"||(!p.showArrows&&!p.showCounter&&!(p.autoplay&&p.showAutoplayControl))},
    counterFormat:{type:ControlType.Enum,title:"Number Style",options:["padded","simple"],optionTitles:["01 / 12","1 / 12"],defaultValue:"padded",displaySegmentedControl:true,hidden:p=>!p.showCounter},
    counterMotion:{type:ControlType.Enum,title:"Number Motion",options:["fold","blur","none"],optionTitles:["Fold","Blur","None"],defaultValue:"fold",displaySegmentedControl:true,description:"Follows the image while dragging, reversing and releasing.",hidden:p=>!p.showCounter},
    counterDirection:{type:ControlType.Enum,title:"Direction",options:["up","down","left","right"],optionTitles:["Up","Down","Left","Right"],defaultValue:"up",description:"Forward motion. Previous-page turns mirror this direction.",hidden:p=>!p.showCounter||p.counterMotion==="none"},
    counterSpeed:{type:ControlType.Number,title:"Number Speed",defaultValue:1,min:1,max:3,step:.1,unit:"×",description:"Higher values shorten the number change around the fold's midpoint.",hidden:p=>!p.showCounter||p.counterMotion==="none"},
    counterBlur:{type:ControlType.Number,title:"Number Blur",defaultValue:4,min:0,max:12,step:.5,unit:"px",hidden:p=>!p.showCounter||p.counterMotion!=="blur"},
    navigationFont:{type:ControlType.Font,title:"Counter Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"12px",variant:"Medium",letterSpacing:"-0.01em",lineHeight:"1em"},hidden:p=>!p.showCounter},
    buttonStyle:{type:ControlType.Enum,title:"Button Style",options:["minimal","outline","filled"],optionTitles:["Minimal","Outline","Filled"],defaultValue:"minimal",hidden:p=>!p.showArrows&&!(p.autoplay&&p.showAutoplayControl)},
    buttonSize:{type:ControlType.Number,title:"Button Size",defaultValue:44,min:44,max:72,step:1,unit:"px",hidden:p=>!p.showArrows&&!(p.autoplay&&p.showAutoplayControl)},
    navigationFill:{type:ControlType.Color,title:"Hover Fill",defaultValue:"#343A40",hidden:p=>!p.showArrows&&!(p.autoplay&&p.showAutoplayControl)},
    hoverDuration:{type:ControlType.Number,title:"Hover Fade",defaultValue:.18,min:0,max:.6,step:.02,unit:"s",description:"Colour fade only. Arrow positions remain fixed.",hidden:p=>!p.showArrows&&!(p.autoplay&&p.showAutoplayControl)},
    navigationGap:{type:ControlType.Number,title:"Nav Gap",defaultValue:4,min:0,max:64,step:1,unit:"px",hidden:p=>!p.showArrows&&!p.showCounter&&!(p.autoplay&&p.showAutoplayControl)},
    navigationOffset:{type:ControlType.Number,title:"Image → Nav",defaultValue:26,min:0,max:100,step:1,unit:"px",description:"Distance from the resting image to the navigation.",hidden:p=>!p.showArrows&&!p.showCounter&&!(p.autoplay&&p.showAutoplayControl)},
    background:{type:ControlType.Color,title:"Background",defaultValue:"#181A1C"},
    studioLight:{type:ControlType.Boolean,title:"Ambient Light",defaultValue:true,description:"Subtle static illumination of the gallery surface."},
    surfaceLight:{type:ControlType.Color,title:"Light Color",defaultValue:"#72808A",hidden:p=>!p.studioLight},
    lightStrength:{type:ControlType.Number,title:"Light Strength",defaultValue:8,min:0,max:40,step:1,unit:"%",hidden:p=>!p.studioLight},
    grain:{type:ControlType.Number,title:"Surface Grain",defaultValue:1.2,min:0,max:8,step:.2,unit:"%",description:"Fine static texture. Set to 0 for a perfectly smooth surface."},
    backgroundPattern:{type:ControlType.Enum,title:"Pattern",options:["none","grid"],optionTitles:["None","Grid"],defaultValue:"grid",displaySegmentedControl:true},
    patternSize:{type:ControlType.Number,title:"Grid Size",defaultValue:96,min:32,max:240,step:4,unit:"px",hidden:p=>p.backgroundPattern!=="grid"},
    patternOpacity:{type:ControlType.Number,title:"Pattern Opacity",defaultValue:6.5,min:0,max:20,step:.5,unit:"%",hidden:p=>p.backgroundPattern!=="grid"},
    patternColor:{type:ControlType.Color,title:"Pattern Color",defaultValue:"#FFFFFF",hidden:p=>p.backgroundPattern!=="grid"},
    imageShadow:{type:ControlType.Boolean,title:"Image Shadow",defaultValue:true},
    navigationColor:{type:ControlType.Color,title:"Nav Color",defaultValue:"#E5E8EB",hidden:p=>!p.showArrows&&!p.showCounter&&!(p.autoplay&&p.showAutoplayControl)},
    accent:{type:ControlType.Color,title:"Focus Color",defaultValue:"#A9BAC6"},
    startItem:{type:ControlType.Number,title:"Start Item",defaultValue:1,min:1,max:30,step:1},
    accessibleLabel:{type:ControlType.String,title:"Accessible Label",defaultValue:"Image gallery",description:"Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"},
})
