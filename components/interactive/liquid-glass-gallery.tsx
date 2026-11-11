// Video-first Framer component. After replacing an older instance, reset its
// Media property to load these video defaults; Framer preserves instance props.
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


export type GalleryMedia = {
    id?: string
    type?: "image" | "video"
    src?: string
    image?: string
    video?: string
    url?: string
    title?: string
    subtitle?: string
}
export type GalleryOptions = {
    widthPercent: number
    mobileWidthPercent: number
    aspect: number
    gap: number
    radius: number
    glass: number
    dispersion: number
    shine: number
    jelly: number
    friction: number
    sensitivity: number
    drift: number
    curvature: number
    titles: boolean
    pixelRatio: number
    intro: boolean
    hoverRadius: number
    hoverDepth: number
    thickness: number
    ior: number
    bevel: number
    maxPlayingVideos: number
    textFont: any
}
export const BASE_OPTIONS: GalleryOptions = {
    widthPercent: 20,
    mobileWidthPercent: 40,
    aspect: 4 / 3,
    gap: 4.5,
    radius: 16.6,
    glass: 100,
    dispersion: 32,
    shine: 100,
    jelly: 100,
    friction: 92,
    sensitivity: 150,
    drift: 0,
    curvature: 50,
    titles: true,
    pixelRatio: 1.5,
    intro: true,
    hoverRadius: 180,
    hoverDepth: 85,
    thickness: 206,
    ior: 2.3,
    bevel: 27.5,
    maxPlayingVideos: 8,
    textFont: {
        fontSize: "16px",
        variant: "Regular",
        letterSpacing: "0em",
        lineHeight: "1.5em",
    },
}
// Public MP4 demo clips. Replace them with your own uploads in Media.
export const DEFAULT_MEDIA: GalleryMedia[] = [
    {
        id: "856309",
        title: "Deep Surface",
        subtitle: "The sea, in constant motion.",
        type: "video",
        src: "https://videos.pexels.com/video-files/856309/856309-hd_1920_1080_30fps.mp4",
    },
    {
        id: "3130284",
        title: "Slow Signal",
        subtitle: "A different point of view.",
        type: "video",
        src: "https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_30fps.mp4",
    },
    {
        id: "7182019",
        title: "Common Sky",
        subtitle: "The city moves beneath the clouds.",
        type: "video",
        src: "https://videos.pexels.com/video-files/7182019/7182019-hd_1920_1080_25fps.mp4",
    },
    {
        id: "5008868",
        title: "Infinite City",
        subtitle: "A place that never stands still.",
        type: "video",
        src: "https://videos.pexels.com/video-files/5008868/5008868-hd_1920_1080_30fps.mp4",
    },
    {
        id: "854550",
        title: "Elsewhere",
        subtitle: "A moment beyond the everyday.",
        type: "video",
        src: "https://videos.pexels.com/video-files/854550/854550-hd_1920_1080_25fps.mp4",
    },
    {
        id: "4631568",
        title: "Blue Hour",
        subtitle: "The sea, in constant motion.",
        type: "video",
        src: "https://videos.pexels.com/video-files/4631568/4631568-hd_1280_720_24fps.mp4",
    },
]

const vertexShader = /* glsl */ `varying vec2 vUv;
varying vec3 vWorld;
uniform vec2 uSize;
uniform vec2 uVelocity;
uniform float uJelly;
uniform vec4 uTrails[8];
uniform vec2 uTrailDirections[8];
uniform float uHoverRadius;
uniform float uHoverDepth;
uniform float uCurvature;
uniform float uSphereRadius;

vec3 membrane(vec2 p) {
    float density=0.0;
    vec2 shear=vec2(0.0);
    for(int i=0;i<8;i++) {
        vec2 d=p-uTrails[i].xy;
        float radius=max(uHoverRadius,1.0);
        float w=exp(-dot(d,d)/(radius*radius*0.38))*uTrails[i].z;
        density+=w;
        shear+=(uTrailDirections[i]*0.16-d*0.11)*w;
    }
    return vec3(shear/(1.0+density),-uHoverDepth*(1.0-exp(-density)))*uJelly;
}
void main() {
    vUv=uv;
    vec3 p=(modelMatrix*vec4(position,1.0)).xyz;
    float sphere=max(uSphereRadius,1000.0);
    p.z=(sqrt(max(sphere*sphere-dot(p.xy,p.xy),1.0))-sphere)*uCurvature;
    // A shared world-space field keeps neighboring tiles connected visually.
    p+=membrane(p.xy);
    vec2 flow=clamp(uVelocity/1500.0,vec2(-1.0),vec2(1.0));
    float belly=sin(uv.x*3.141593)*sin(uv.y*3.141593);
    p.xy-=flow*belly*uSize.y*0.055*uJelly;
    p.z+=belly*min(length(flow),1.0)*uSize.y*0.08*uJelly;
    vWorld=p;
    gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);
}
`
const fragmentShader = /* glsl */ `precision highp float;
varying vec2 vUv;
varying vec3 vWorld;
uniform sampler2D uMap;
uniform sampler2D uLabel;
uniform vec2 uSize;
uniform vec2 uImageSize;
uniform float uRadius;
uniform float uGlass;
uniform float uDispersion;
uniform float uShine;
uniform float uTitles;
uniform float uReady;
uniform float uVideo;
uniform float uThickness;
uniform float uIor;
uniform float uBevel;

float roundedBox(vec2 p) {
    float r=min(uSize.x*uRadius,min(uSize.x,uSize.y)*0.49);
    vec2 q=abs(p)-uSize*.5+r;
    return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;
}
// Superelliptic cross-section: broad flat face, steep polished bevel.
float glassHeight(vec2 p) {
    float t=clamp(1.0+roundedBox(p)/max(uSize.x*uBevel,.001),0.0,1.0);
    return pow(max(1.0-pow(t,8.4),0.0),1.0/8.4)*uThickness;
}
vec2 cover(vec2 uv) {
    float a=uImageSize.x/max(uImageSize.y,1.0),b=uSize.x/uSize.y;
    return (uv-.5)*vec2(min(b/a,1.0),min(a/b,1.0))+.5;
}
vec3 content(vec2 uv) {
    uv=clamp(uv,0.0,1.0);
    vec3 c=texture2D(uMap,clamp(cover(uv),.001,.999)).rgb;
    if(uVideo>.5)c=mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));
    c=mix(vec3(.012,.023,.035),c,uReady);
    c*=1.0-(1.0-smoothstep(0.0,.48,uv.y))*.27*uTitles;
    vec4 label=texture2D(uLabel,uv);
    return mix(c,label.rgb,label.a*uTitles);
}
vec3 studio(vec3 r) {
    float angle=-2.0;
    r=vec3(r.x*cos(angle)-r.z*sin(angle),r.y,r.x*sin(angle)+r.z*cos(angle));
    vec3 room=mix(vec3(.003,.005,.009),vec3(.03,.045,.065),smoothstep(-.65,.9,r.y));
    float left=exp(-pow((r.x+.72)/.085,4.0))*smoothstep(-.7,-.35,r.y)*(1.0-smoothstep(.68,.9,r.y));
    float right=exp(-pow((r.x-.45)/.16,4.0))*smoothstep(-.65,-.25,r.y)*(1.0-smoothstep(.6,.9,r.y));
    float ceiling=exp(-pow((r.y-.78)/.1,4.0));
    return room+vec3(2.8,2.9,3.0)*left+vec3(.7,.85,1.0)*right+vec3(.8)*ceiling;
}
void main() {
    vec2 p=(vUv-.5)*uSize;
    float d=roundedBox(p),aa=max(fwidth(d)*.65,.4);
    float opacity=1.0-smoothstep(-aa,aa,d);
    if(opacity<.005)discard;
    float e=max(uSize.x*uBevel*.06,.35);
    vec2 slope=vec2(glassHeight(p+vec2(e,0))-glassHeight(p-vec2(e,0)),glassHeight(p+vec2(0,e))-glassHeight(p-vec2(0,e)))/(2.0*e);
    float magnitude=length(slope);
    slope*=min(magnitude,2.92)/max(magnitude,.0001);
    // Derive the moving surface basis, so dents also deform the reflections.
    vec3 dpdx=dFdx(vWorld),dpdy=dFdy(vWorld);
    vec2 duvdx=dFdx(vUv),duvdy=dFdy(vUv);
    vec3 tangent=normalize(dpdx*duvdy.y-dpdy*duvdx.y);
    vec3 bitangent=normalize(-dpdx*duvdy.x+dpdy*duvdx.x);
    vec3 surface=normalize(cross(tangent,bitangent));
    if(!gl_FrontFacing)surface=-surface;
    vec3 normal=normalize(surface-tangent*slope.x-bitangent*slope.y);
    vec3 viewDir=normalize(cameraPosition-vWorld);
    vec3 color=vec3(0.0);
    for(int channel=0;channel<3;channel++) {
        float ior=max(1.0001,uIor+uDispersion*(float(channel)*.5-.5));
        vec3 ray=refract(-viewDir,normal,1.0/ior);
        float distance=uThickness/max(abs(dot(ray,surface)),.05);
        vec2 refractedUv=vUv+vec2(dot(ray,tangent),dot(ray,bitangent))*distance*(uGlass*.41)/uSize;
        vec3 sampleColor=content(refractedUv);
        if(channel==0)color.r=sampleColor.r;
        else if(channel==1)color.g=sampleColor.g;
        else color.b=sampleColor.b;
    }
    vec3 reflected=studio(reflect(-viewDir,normal));
    float fresnel=.2+.8*pow(clamp(1.0-dot(normal,viewDir),0.0,1.0),5.0);
    float reflectionMix=min(fresnel*1.75,.27)*uShine;
    color=mix(color,reflected,clamp(reflectionMix,0.0,.7));
    float rim=smoothstep(-uSize.x*.0376,0.0,d)*.07*uShine;
    color+=vec3(rim);
    gl_FragColor=vec4(color,opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`

type CacheEntry = {
    texture: THREE.Texture
    label: THREE.CanvasTexture
    size: THREE.Vector2
    ready: boolean
    video?: HTMLVideoElement
    image?: HTMLImageElement
    used: number
    source: string
    playPending?: boolean
    playBlocked?: boolean
    listeners: Array<[string, EventListener]>
}
type Slot = {
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
    index: number
    entry?: CacheEntry
}
export type GalleryAPI = {
    setMedia: (items: GalleryMedia[]) => void
    setOptions: (options: Partial<GalleryOptions>) => void
    reset: () => void
    dispose: () => void
}

/** Called only from the mounting useEffect. Every GPU allocation is owned here. */
export function createLiquidGallery(
    container: HTMLDivElement,
    initial: GalleryOptions,
    initialMedia: GalleryMedia[],
    shouldAnimate: boolean,
    isIntersecting: React.MutableRefObject<boolean>,
    report?: (message: string) => void
): GalleryAPI {
    let frameId = 0,
        disposed = false,
        width = 1,
        height = 1,
        lastTime = 0,
        clock = 0
    let resizeObserver: ResizeObserver | undefined,
        intersectionObserver: IntersectionObserver | undefined
    let options = { ...initial },
        media = initialMedia,
        slots: Slot[] = [],
        gridCols = 0,
        gridRows = 0
    const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>()
    const renderTargets = new Set<THREE.WebGLRenderTarget>()
    const cache = new Map<number, CacheEntry>()
    const listeners: Array<
        [
            EventTarget,
            string,
            EventListener,
            boolean | AddEventListenerOptions | undefined,
        ]
    > = []
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 1, 20000)
    camera.position.z = 720
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.cssText =
        "display:block;width:100%;height:100%;touch-action:none;outline:none"
    renderer.domElement.setAttribute(
        "aria-label",
        "Infinite glass gallery. Drag or use arrow keys to explore."
    )
    renderer.domElement.tabIndex = 0
    container.appendChild(renderer.domElement)
    const placeholder = new THREE.DataTexture(
        new Uint8Array([52, 67, 81, 255]),
        1,
        1
    )
    placeholder.needsUpdate = true
    textures.add(placeholder)
    const plane = new THREE.PlaneGeometry(1, 1, 32, 24)
    geometries.add(plane)
    const target = new THREE.Vector2(0, 0),
        current = new THREE.Vector2(0, 0),
        velocity = new THREE.Vector2(0, 0),
        fling = new THREE.Vector2(0, 0),
        pointer = new THREE.Vector2(0, 0)
    let pointerId: number | null = null,
        px = 0,
        py = 0,
        pointerTime = 0,
        intro = shouldAnimate && options.intro ? 1 : 0
    const trailUniforms = Array.from(
        { length: 8 },
        () => new THREE.Vector4(0, 0, 0, 0)
    )
    const trailDirections = Array.from({ length: 8 }, () => new THREE.Vector2())
    const trailWorld = Array.from({ length: 8 }, () => new THREE.Vector2())
    const trailStrength = new Float32Array(8)
    const orbit = new THREE.Vector2()
    const pointerRay = new THREE.Raycaster(),
        pointerHit = new THREE.Vector3()
    const pointerSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -5000), 5000)
    const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    let trailIndex = 0,
        lastTrailTime = 0,
        lastHoverX = 0,
        lastHoverY = 0,
        hasHover = false
    function stampPointer(e: PointerEvent) {
        const rect = container.getBoundingClientRect()
        const sx = e.clientX - rect.left - width * 0.5,
            sy = height * 0.5 - (e.clientY - rect.top)
        pointer.set(sx / (width * 0.5), sy / (height * 0.5))
        pointerRay.setFromCamera(pointer, camera)
        const hit =
            options.curvature > 0
                ? pointerRay.ray.intersectSphere(pointerSphere, pointerHit)
                : pointerRay.ray.intersectPlane(pointerPlane, pointerHit)
        const worldX = hit ? pointerHit.x : sx * 0.9,
            worldY = hit ? pointerHit.y : sy * 0.9
        const now = performance.now(),
            dx = hasHover ? sx - lastHoverX : 0,
            dy = hasHover ? sy - lastHoverY : 0
        if (now - lastTrailTime > 25 || Math.hypot(dx, dy) > 6) {
            trailIndex = (trailIndex + 1) % 8
            trailWorld[trailIndex].set(worldX - current.x, worldY - current.y)
            trailDirections[trailIndex].set(
                Math.max(-80, Math.min(80, dx * 2)),
                Math.max(-80, Math.min(80, dy * 2))
            )
            trailStrength[trailIndex] = 1.7
            lastTrailTime = now
        }
        lastHoverX = sx
        lastHoverY = sy
        hasHover = true
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const mod = (n: number, m: number) => ((n % m) + m) % m
    const add = (
        target: EventTarget,
        name: string,
        fn: EventListener,
        opts?: boolean | AddEventListenerOptions
    ) => {
        target.addEventListener(name, fn, opts)
        listeners.push([target, name, fn, opts])
    }
    function releaseEntry(entry: CacheEntry) {
        if (entry.video) {
            entry.video.pause()
            entry.listeners.forEach(([n, f]) =>
                entry.video!.removeEventListener(n, f)
            )
            entry.video.removeAttribute("src")
            entry.video.load()
            entry.video.remove()
        }
        if (entry.image) {
            entry.image.onload = null
            entry.image.onerror = null
            entry.image.src = ""
        }
        if (entry.texture !== placeholder) {
            entry.texture.dispose()
            textures.delete(entry.texture)
        }
        entry.label.dispose()
        textures.delete(entry.label)
    }
    function labelFor(item: GalleryMedia, index: number) {
        let ff = "sans-serif"
        let weight = "500"
        let style = "normal"

        if (options.textFont) {
            if (typeof options.textFont === "string") {
                ff = options.textFont
            } else {
                if (options.textFont.fontFamily)
                    ff = options.textFont.fontFamily
                if (options.textFont.fontWeight)
                    weight = options.textFont.fontWeight
                if (options.textFont.fontStyle)
                    style = options.textFont.fontStyle
            }
        }

        const safeFamily =
            ff.includes(",") || ff.includes('"') || ff.includes("'")
                ? ff
                : `"${ff}"`

        const canvas = document.createElement("canvas")
        canvas.width = 1024
        canvas.height = 768
        const ctx = canvas.getContext("2d")!
        ctx.fillStyle = "rgba(255,255,255,.7)"
        ctx.font = `${style} 500 16px ${safeFamily}, monospace`
        ctx.fillText(
            String(index + 1).padStart(2, "0") +
                " / " +
                (item.type === "video" ? "MOTION" : "STILL"),
            58,
            64
        )
        ctx.fillStyle = "rgba(255,255,255,.48)"
        ctx.fillRect(58, 480, 908, 1.5)
        ctx.fillStyle = "#fff"
        ctx.font = `${style} ${weight} 120px ${safeFamily}, sans-serif`
        const title =
            item.title || (item.type === "video" ? "Moving Image" : "Untitled")
        const scale = Math.min(
            1,
            900 / Math.max(1, ctx.measureText(title).width)
        )
        ctx.save()
        ctx.translate(54, 624)
        ctx.scale(scale, scale)
        ctx.fillText(title, 0, 0)
        ctx.restore()
        ctx.font = `${style} normal 22px ${safeFamily}, sans-serif`
        ctx.fillStyle = "rgba(255,255,255,.72)"
        ctx.fillText(item.subtitle || "A moment, held in glass.", 58, 688, 900)
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        textures.add(texture)
        return texture
    }

    function refreshLabels() {
        if (disposed) return
        cache.forEach((entry, index) => {
            if (!media[index]) return
            const oldLabel = entry.label
            entry.label = labelFor(media[index], index)
            const slot = slots.find((s) => s.index === index)
            if (slot && slot.mesh.material.uniforms.uLabel) {
                slot.mesh.material.uniforms.uLabel.value = entry.label
            }
            oldLabel.dispose()
            textures.delete(oldLabel)
        })
        renderSingle()
    }

    if (document.fonts) {
        document.fonts.ready.then(refreshLabels)
    }

    function getEntry(index: number): CacheEntry {
        const existing = cache.get(index)
        if (existing) {
            existing.used = clock
            return existing
        }
        const item = media[index]
        const source =
            (item.type === "video" ? item.video : item.image) ||
            item.src ||
            item.url ||
            ""
        const entry: CacheEntry = {
            texture: placeholder,
            label: labelFor(item, index),
            size: new THREE.Vector2(4, 3),
            ready: false,
            used: clock,
            source,
            listeners: [],
        }
        cache.set(index, entry)
        const isCurrent = () => !disposed && cache.get(index) === entry
        if (item.type === "video") {
            const video = document.createElement("video")
            entry.video = video
            video.crossOrigin = "anonymous"
            video.muted = true
            video.loop = true
            video.playsInline = true
            video.preload = "auto"
            video.style.cssText =
                "position:absolute;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none"
            video.setAttribute("aria-hidden", "true")
            video.tabIndex = -1
            container.appendChild(video)
            const texture = new THREE.VideoTexture(video)
            texture.colorSpace = THREE.SRGBColorSpace
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            texture.generateMipmaps = false
            entry.texture = texture
            textures.add(texture)
            const loaded = () => {
                if (!isCurrent()) return
                entry.size.set(video.videoWidth || 4, video.videoHeight || 3)
                entry.ready = true
                texture.needsUpdate = true
                renderSingle()
            }
            const fail = () => {
                if (isCurrent())
                    report?.(
                        `Could not play ${item.title || "video"}. Use a browser-supported MP4 or WebM with cross-origin access.`
                    )
            }
            entry.listeners = [
                ["loadeddata", loaded],
                ["seeked", loaded],
                ["error", fail],
            ]
            entry.listeners.forEach(([n, f]) => video.addEventListener(n, f))
            video.src = source
            video.load()
        } else if (source) {
            const image = new Image()
            entry.image = image
            image.crossOrigin = "anonymous"
            image.decoding = "async"
            image.onload = () => {
                if (!isCurrent()) return
                const texture = new THREE.Texture(image)
                texture.colorSpace = THREE.SRGBColorSpace
                texture.minFilter = THREE.LinearFilter
                texture.generateMipmaps = false
                texture.needsUpdate = true
                textures.add(texture)
                entry.texture = texture
                entry.size.set(image.naturalWidth, image.naturalHeight)
                entry.ready = true
                renderSingle()
            }
            image.onerror = () => {
                if (isCurrent()) {
                    report?.(
                        `Could not load ${item.title || "image"}. Check its URL and cross-origin access.`
                    )
                    renderSingle()
                }
            }
            image.src = source
        }
        return entry
    }
    function makeSlot() {
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            uniforms: {
                uMap: { value: placeholder },
                uLabel: { value: placeholder },
                uSize: { value: new THREE.Vector2(1, 1) },
                uImageSize: { value: new THREE.Vector2(4, 3) },
                uVelocity: { value: velocity },
                uPointer: { value: pointer },
                uJelly: { value: 1 },
                uTime: { value: 0 },
                uTrails: { value: trailUniforms },
                uTrailDirections: { value: trailDirections },
                uHoverRadius: { value: 180 },
                uHoverDepth: { value: 85 },
                uThickness: { value: 100 },
                uIor: { value: 2.3 },
                uBevel: { value: 0.275 },
                uVideo: { value: 0 },
                uCurvature: { value: 1 },
                uSphereRadius: { value: 5000 },
                uRadius: { value: 0.166 },
                uGlass: { value: 0.72 },
                uDispersion: { value: 0.32 },
                uShine: { value: 0.7 },
                uTitles: { value: 1 },
                uReady: { value: 0 },
            },
        })
        materials.add(material)
        const mesh = new THREE.Mesh(plane, material)
        mesh.frustumCulled = false
        scene.add(mesh)
        slots.push({ mesh, index: -1 })
    }
    function layout() {
        const tileWidth =
            (width *
                (width < 700
                    ? options.mobileWidthPercent
                    : options.widthPercent)) /
            100
        const tileHeight = tileWidth / options.aspect
        const gap = (tileWidth * options.gap) / 100
        const stepX = tileWidth + gap,
            stepY = tileHeight + gap
        const cols = Math.ceil(width / stepX) + 4,
            rows = Math.ceil(height / stepY) + 4
        if (gridCols !== cols || gridRows !== rows) {
            gridCols = cols
            gridRows = rows
            while (slots.length < cols * rows) makeSlot()
        }
        const baseC = Math.floor(-current.x / stepX) - Math.floor(cols / 2)
        const baseR = Math.floor(-current.y / stepY) - Math.floor(rows / 2)
        const active = new Set<number>()
        const visibleVideoDistance = new Map<number, number>()
        let videoCount = 0
        for (let i = 0; i < 8; i++)
            trailUniforms[i].set(
                trailWorld[i].x + current.x,
                trailWorld[i].y + current.y,
                trailStrength[i],
                0
            )
        for (let n = 0; n < slots.length; n++) {
            const slot = slots[n]
            if (n >= cols * rows || media.length === 0) {
                slot.mesh.visible = false
                continue
            }
            const r = baseR + Math.floor(n / cols),
                c = baseC + (n % cols)
            let x = c * stepX + mod(r, 2) * stepX * 0.5 + current.x
            let y = r * stepY + current.y
            x *= 1 + intro * 1.7
            y *= 1 + intro * 1.7
            if (
                Math.abs(x) > width * 0.5 + tileWidth * 1.2 ||
                Math.abs(y) > height * 0.5 + tileHeight * 1.2
            ) {
                slot.mesh.visible = false
                continue
            }
            slot.mesh.visible = true
            const index = mod(c + r * 7, media.length)
            const entry = getEntry(index)
            active.add(index)
            slot.entry = entry
            slot.index = index
            const curve = options.curvature / 50
            slot.mesh.position.set(x, y, 0)
            slot.mesh.rotation.set(0, 0, 0)
            if (
                entry.video &&
                Math.abs(x) < width * 0.5 + tileWidth * 0.5 &&
                Math.abs(y) < height * 0.5 + tileHeight * 0.5
            )
                visibleVideoDistance.set(
                    index,
                    Math.min(
                        visibleVideoDistance.get(index) ?? Infinity,
                        x * x + y * y
                    )
                )
            slot.mesh.scale.set(tileWidth, tileHeight, 1)
            const u = slot.mesh.material.uniforms
            u.uMap.value = entry.texture
            u.uLabel.value = entry.label
            u.uImageSize.value.copy(entry.size)
            u.uSize.value.set(tileWidth, tileHeight)
            u.uJelly.value = reducedMotion.matches ? 0 : options.jelly / 100
            u.uTime.value = clock
            u.uRadius.value = Math.max(0.01, options.radius / 100)
            u.uHoverRadius.value = options.hoverRadius
            u.uHoverDepth.value = options.hoverDepth
            u.uThickness.value = (options.thickness * tileWidth) / 345.6
            u.uIor.value = options.ior
            u.uBevel.value = options.bevel / 100
            u.uVideo.value = entry.video ? 1 : 0
            u.uCurvature.value = curve
            u.uGlass.value = options.glass / 100
            u.uDispersion.value = options.dispersion / 100
            u.uShine.value = options.shine / 100
            u.uTitles.value = options.titles ? 1 : 0
            u.uReady.value = entry.ready ? 1 : 0
        }
        // Bound decoded videos and texture memory independently of the number of library items.
        const playing = new Set(
            [...visibleVideoDistance]
                .sort((a, b) => a[1] - b[1])
                .slice(0, options.maxPlayingVideos)
                .map(([index]) => index)
        )
        for (const [index, entry] of cache) {
            const play =
                playing.has(index) &&
                entry.video &&
                shouldAnimate &&
                isIntersecting.current &&
                !document.hidden
            if (play) {
                videoCount++
                if (
                    entry.video!.paused &&
                    !entry.playPending &&
                    !entry.playBlocked
                ) {
                    entry.playPending = true
                    entry
                        .video!.play()
                        .then(() => {
                            entry.playPending = false
                            if (
                                disposed ||
                                !isIntersecting.current ||
                                document.hidden
                            )
                                entry.video?.pause()
                        })
                        .catch(() => {
                            entry.playPending = false
                            entry.playBlocked = true
                        })
                }
            } else entry.video?.pause()
        }
        if (cache.size > Math.max(32, active.size + 8)) {
            const candidates = [...cache]
                .filter(([index]) => !active.has(index))
                .sort((a, b) => a[1].used - b[1].used)
            for (const [index, entry] of candidates) {
                if (cache.size <= Math.max(32, active.size + 8)) break
                releaseEntry(entry)
                cache.delete(index)
            }
        }
    }
    function draw() {
        if (disposed) return
        const orbitFactor = shouldAnimate && !reducedMotion.matches ? 0.12 : 1
        orbit.lerp(pointer, orbitFactor)
        const yaw = -orbit.x * 0.05,
            pitch = orbit.y * 0.05
        camera.position.set(
            Math.sin(yaw) * Math.cos(pitch) * 720,
            Math.sin(pitch) * 720,
            Math.cos(yaw) * Math.cos(pitch) * 720
        )
        camera.lookAt(0, 0, 0)
        camera.updateMatrixWorld()
        layout()
        renderer.render(scene, camera)
    }
    function renderSingle() {
        if (disposed || !isIntersecting.current || document.hidden) return
        if (shouldAnimate && frameId) return
        if (!shouldAnimate) {
            current.copy(target)
            velocity.set(0, 0)
            intro = 0
        }
        draw()
    }
    function tick(now: number) {
        frameId = 0
        if (disposed || !isIntersecting.current || document.hidden) return
        const dt = Math.min((now - lastTime) / 1000 || 1 / 60, 0.05)
        lastTime = now
        clock += dt
        for (let i = 0; i < 8; i++) trailStrength[i] *= Math.exp(-2.4 * dt)
        if (!shouldAnimate || reducedMotion.matches) {
            current.copy(target)
            velocity.set(0, 0)
            intro = 0
        } else {
            if (pointerId === null) target.x -= options.drift * dt
            // Reference spring: stiffness 80, damping 16, mass 0.5.
            // Small fixed substeps keep damping consistent on slow frames.
            const steps = Math.max(1, Math.ceil(dt * 120)),
                h = dt / steps
            for (let i = 0; i < steps; i++) {
                velocity.x +=
                    ((target.x - current.x) * 160 - velocity.x * 32) * h
                velocity.y +=
                    ((target.y - current.y) * 160 - velocity.y * 32) * h
                current.addScaledVector(velocity, h)
            }
            intro *= Math.exp(-dt * 5)
            if (intro < 0.001) intro = 0
        }
        draw()
        if (shouldAnimate) frameId = requestAnimationFrame(tick)
    }
    function start() {
        if (disposed || frameId || !isIntersecting.current || document.hidden)
            return
        lastTime = performance.now()
        if (shouldAnimate) frameId = requestAnimationFrame(tick)
        else renderSingle()
    }
    function stop() {
        cancelAnimationFrame(frameId)
        frameId = 0
        cache.forEach((entry) => entry.video?.pause())
    }
    function resize() {
        if (disposed) return
        const rect = container.getBoundingClientRect()
        width = Math.max(1, rect.width)
        height = Math.max(1, rect.height)
        camera.aspect = width / height
        camera.fov = (2 * Math.atan(height / 1600) * 180) / Math.PI
        camera.updateProjectionMatrix()
        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, options.pixelRatio)
        )
        renderer.setSize(width, height, false)
        renderSingle()
    }
    add(renderer.domElement, "pointerdown", ((e: PointerEvent) => {
        if (e.button !== 0 || pointerId !== null) return
        pointerId = e.pointerId
        stampPointer(e)
        cache.forEach((entry) => {
            entry.playBlocked = false
        })
        px = e.clientX
        py = e.clientY
        pointerTime = performance.now()
        fling.set(0, 0)
        renderer.domElement.setPointerCapture(e.pointerId)
        renderer.domElement.style.cursor = "grabbing"
        renderSingle()
    }) as EventListener)
    add(renderer.domElement, "pointermove", ((e: PointerEvent) => {
        stampPointer(e)
        if (e.pointerId === pointerId) {
            const now = performance.now(),
                dt = Math.max((now - pointerTime) / 1000, 0.008),
                dx = ((e.clientX - px) * options.sensitivity) / 100,
                dy = (-(e.clientY - py) * options.sensitivity) / 100
            target.x += dx
            target.y += dy
            fling.set(
                Math.max(-2600, Math.min(2600, (e.clientX - px) / dt)),
                Math.max(-2600, Math.min(2600, -(e.clientY - py) / dt))
            )
            px = e.clientX
            py = e.clientY
            pointerTime = now
        }
        renderSingle()
    }) as EventListener)
    const end = ((e: PointerEvent) => {
        if (e.pointerId !== pointerId) return
        pointerId = null
        if (performance.now() - pointerTime > 100 || e.type !== "pointerup")
            fling.set(0, 0)
        target.addScaledVector(
            fling,
            Math.max(0, (options.friction - 50) / 420)
        )
        fling.set(0, 0)
        if (renderer.domElement.hasPointerCapture(e.pointerId))
            renderer.domElement.releasePointerCapture(e.pointerId)
        renderer.domElement.style.cursor = "grab"
        renderSingle()
    }) as EventListener
    add(renderer.domElement, "pointerleave", (() => {
        hasHover = false
        pointer.set(0, 0)
        if (!shouldAnimate) trailStrength.fill(0)
        renderSingle()
    }) as EventListener)
    add(renderer.domElement, "pointerup", end)
    add(renderer.domElement, "pointercancel", end)
    add(renderer.domElement, "lostpointercapture", end)
    add(
        renderer.domElement,
        "wheel",
        ((e: WheelEvent) => {
            e.preventDefault()
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1
            target.x -= (e.deltaX * unit * options.sensitivity) / 100
            target.y += (e.deltaY * unit * options.sensitivity) / 100
            fling.set(0, 0)
            renderSingle()
        }) as EventListener,
        { passive: false }
    )
    add(renderer.domElement, "keydown", ((e: KeyboardEvent) => {
        const amount = width * 0.2
        if (e.key === "ArrowRight") target.x -= amount
        else if (e.key === "ArrowLeft") target.x += amount
        else if (e.key === "ArrowDown") target.y += amount
        else if (e.key === "ArrowUp") target.y -= amount
        else if (e.key === "Home") {
            target.set(0, 0)
            fling.set(0, 0)
        } else return
        e.preventDefault()
        renderSingle()
    }) as EventListener)
    add(document, "visibilitychange", (() => {
        if (document.hidden) stop()
        else start()
    }) as EventListener)
    add(renderer.domElement, "webglcontextlost", ((event: Event) => {
        event.preventDefault()
        stop()
        if (!disposed)
            report?.("Graphics paused. Reload the gallery to restore it.")
    }) as EventListener)
    renderer.domElement.style.cursor = "grab"
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    intersectionObserver = new IntersectionObserver((entries) => {
        isIntersecting.current = entries[0]?.isIntersecting ?? false
        if (isIntersecting.current) start()
        else stop()
    })
    intersectionObserver.observe(container)
    resize()
    start()
    return {
        setMedia(items) {
            media = items
            cache.forEach(releaseEntry)
            cache.clear()
            slots.forEach((slot) => {
                slot.index = -1
                slot.entry = undefined
            })
            renderSingle()
        },
        setOptions(next) {
            const fontChanged =
                JSON.stringify(options.textFont) !==
                JSON.stringify(next.textFont)
            options = { ...options, ...next }
            if (fontChanged) refreshLabels()
            resize()
        },
        reset() {
            target.set(0, 0)
            fling.set(0, 0)
            trailStrength.fill(0)
            pointer.set(0, 0)
            renderSingle()
        },
        dispose() {
            if (disposed) return
            disposed = true
            cancelAnimationFrame(frameId)
            frameId = 0
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            listeners.forEach(([target, name, fn, opts]) =>
                target.removeEventListener(name, fn, opts)
            )
            cache.forEach(releaseEntry)
            cache.clear()
            geometries.forEach((asset) => asset.dispose())
            materials.forEach((asset) => asset.dispose())
            textures.forEach((asset) => asset.dispose())
            renderTargets.forEach((asset) => asset.dispose())
            scene.clear()
            renderer.renderLists.dispose()
            renderer.forceContextLoss()
            renderer.dispose()
            if (container && container.contains(renderer.domElement))
                container.removeChild(renderer.domElement)
        },
    }
}

type Props = Partial<GalleryOptions> & {
    livePreview?: boolean
    editorPreview?: boolean
    media?: GalleryMedia[]
    layout?: Partial<GalleryOptions>
    styling?: Partial<GalleryOptions>
    motion?: Partial<GalleryOptions>
    performance?: Partial<GalleryOptions>
    style?: React.CSSProperties
    id?: string
    className?: string
    onError?: (message: string) => void
    apiRef?: React.MutableRefObject<GalleryAPI | null>
}
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function LiquidGlassGallery(incomingProps: Props) {
    const props = {
        ...BASE_OPTIONS,
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.styling || {}),
        ...(incomingProps.motion || {}),
        ...(incomingProps.performance || {}),
    }
    const mountRef = useRef<HTMLDivElement>(null)
    const api = useRef<GalleryAPI | null>(null)
    const isIntersecting = useRef(true)
    const latest = useRef(props)
    latest.current = props
    const isStatic = useIsStaticRenderer()
    const editorPreview = props.livePreview ?? props.editorPreview ?? true
    const shouldAnimate = !isStatic && editorPreview
    const mediaKey = JSON.stringify(props.media ?? DEFAULT_MEDIA)

    useEffect(() => {
        const container = mountRef.current
        if (!container) return
        let instance: GalleryAPI | null = null
        try {
            instance = createLiquidGallery(
                container,
                latest.current,
                latest.current.media ?? DEFAULT_MEDIA,
                shouldAnimate,
                isIntersecting,
                (message) => latest.current.onError?.(message)
            )
            api.current = instance
            if (latest.current.apiRef) latest.current.apiRef.current = instance
        } catch (error) {
            latest.current.onError?.("WebGL is unavailable in this browser.")
            container.setAttribute("data-render-error", String(error))
        }
        return () => {
            instance?.dispose()
            api.current = null
            if (latest.current.apiRef) latest.current.apiRef.current = null
        }
    }, [shouldAnimate])

    useEffect(() => {
        api.current?.setMedia(props.media ?? DEFAULT_MEDIA)
    }, [mediaKey])

    useEffect(() => {
        api.current?.setOptions(props)
    }, [
        props.widthPercent,
        props.mobileWidthPercent,
        props.aspect,
        props.gap,
        props.radius,
        props.glass,
        props.dispersion,
        props.shine,
        props.jelly,
        props.friction,
        props.sensitivity,
        props.drift,
        props.curvature,
        props.titles,
        props.pixelRatio,
        props.intro,
        props.hoverRadius,
        props.hoverDepth,
        props.thickness,
        props.ior,
        props.bevel,
        props.maxPlayingVideos,
        props.textFont,
    ])

    // Only valid DOM attributes are forwarded; control objects must not leak into HTML.
    const domProps = { id: props.id, className: props.className }
    const fontStyle =
        typeof props.textFont === "object" && props.textFont !== null
            ? props.textFont
            : { fontFamily: props.textFont || "sans-serif" }

    return (
        <div
            {...domProps}
            ref={mountRef}
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
                style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    ...fontStyle,
                }}
            >
                Typography Load
            </div>
        </div>
    )
}

LiquidGlassGallery.defaultProps = {
    livePreview: true,
    media: DEFAULT_MEDIA,
    textFont: {
        fontSize: "16px",
        variant: "Regular",
        letterSpacing: "0em",
        lineHeight: "1.5em",
    },
    layout: {
        widthPercent: 20,
        mobileWidthPercent: 40,
        aspect: 4 / 3,
        gap: 4.5,
        curvature: 50,
    },
    styling: {
        thickness: 206,
        ior: 2.3,
        bevel: 27.5,
        radius: 16.6,
        glass: 100,
        dispersion: 32,
        shine: 100,
        titles: true,
    },
    motion: {
        hoverRadius: 180,
        hoverDepth: 85,
        jelly: 100,
        friction: 92,
        sensitivity: 150,
        drift: 0,
        intro: true,
    },
    performance: { pixelRatio: 1.5, maxPlayingVideos: 8 },
}

addPropertyControls(LiquidGlassGallery, {
    textFont: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.5em",
        },
    },
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate in preview.",
    },
    media: {
        type: ControlType.Array,
        title: "Media",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "video",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (p: any) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.type !== "video",
                },
                src: {
                    type: ControlType.String,
                    title: "Media URL",
                    description: "Optional direct media URL.",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "A moment, held in glass.",
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            widthPercent: {
                type: ControlType.Number,
                title: "Tile Width",
                min: 15,
                max: 80,
                step: 1,
                unit: "%",
                defaultValue: 20,
            },
            mobileWidthPercent: {
                type: ControlType.Number,
                title: "Mobile Width",
                min: 35,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 40,
            },
            aspect: {
                type: ControlType.Number,
                title: "Aspect Ratio",
                min: 0.5,
                max: 2.5,
                step: 0.01,
                unit: ":1",
                defaultValue: 4 / 3,
                description: "Tile width ÷ height.",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 25,
                step: 0.5,
                unit: "%",
                defaultValue: 4.5,
                description: "Relative to tile width.",
            },
            curvature: {
                type: ControlType.Number,
                title: "Curve",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 50,
                description: "Bends the gallery in depth.",
            },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Glass & Style",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Corners",
                min: 1,
                max: 45,
                step: 0.1,
                unit: "%",
                defaultValue: 16.6,
            },
            glass: {
                type: ControlType.Number,
                title: "Refraction",
                min: 0,
                max: 150,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Bends media through glass.",
            },
            dispersion: {
                type: ControlType.Number,
                title: "Dispersion",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 32,
                description: "Color separation at edges.",
            },
            shine: {
                type: ControlType.Number,
                title: "Reflection",
                min: 0,
                max: 150,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Strength of glass highlights.",
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                min: 10,
                max: 350,
                step: 1,
                unit: "px",
                defaultValue: 206,
                description: "Optical depth at reference size.",
            },
            ior: {
                type: ControlType.Number,
                title: "Index",
                min: 1.01,
                max: 3,
                step: 0.01,
                unit: "×",
                defaultValue: 2.3,
                description: "How strongly light bends.",
            },
            bevel: {
                type: ControlType.Number,
                title: "Bevel",
                min: 5,
                max: 45,
                step: 0.5,
                unit: "%",
                defaultValue: 27.5,
                description: "Width of the rounded glass edge.",
            },
            titles: {
                type: ControlType.Boolean,
                title: "Titles",
                defaultValue: true,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            jelly: {
                type: ControlType.Number,
                title: "Jelly",
                min: 0,
                max: 150,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Pointer dents and drag deformation.",
            },
            friction: {
                type: ControlType.Number,
                title: "Glide",
                min: 50,
                max: 98,
                step: 1,
                unit: "%",
                defaultValue: 92,
                description: "Release travel after dragging.",
            },
            sensitivity: {
                type: ControlType.Number,
                title: "Drag Speed",
                min: 20,
                max: 200,
                step: 1,
                unit: "%",
                defaultValue: 150,
            },
            drift: {
                type: ControlType.Number,
                title: "Auto Drift",
                min: 0,
                max: 80,
                step: 1,
                unit: "px/s",
                defaultValue: 0,
            },
            hoverRadius: {
                type: ControlType.Number,
                title: "Touch Radius",
                min: 40,
                max: 400,
                step: 1,
                unit: "px",
                defaultValue: 180,
                description: "Area affected by the pointer.",
            },
            hoverDepth: {
                type: ControlType.Number,
                title: "Touch Depth",
                min: 0,
                max: 180,
                step: 1,
                unit: "px",
                defaultValue: 85,
                description: "Depth of the soft pointer dent.",
            },
            intro: {
                type: ControlType.Boolean,
                title: "Entrance",
                defaultValue: true,
                description: "Bring tiles together on load.",
            },
        },
    },
    performance: {
        type: ControlType.Object,
        title: "Performance",
        controls: {
            maxPlayingVideos: {
                type: ControlType.Number,
                title: "Playing Clips",
                min: 1,
                max: 24,
                step: 1,
                unit: "clips",
                defaultValue: 8,
                description: "Simultaneous visible videos.",
            },
            pixelRatio: {
                type: ControlType.Number,
                title: "Resolution",
                min: 1,
                max: 2,
                step: 0.25,
                unit: "×",
                defaultValue: 1.5,
                description: "Pixel ratio cap. Higher is sharper.",
            },
        },
    },
})
