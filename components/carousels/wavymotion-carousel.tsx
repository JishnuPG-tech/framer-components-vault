/**
 * FlagsCarousel
 * -------------
 * An infinite Three.js media carousel on a straight horizontal line. An ocean
 * swell rolls through the whole strip, lifting every image or video in turn. The strip drifts continuously at a steady speed
 * (no stepping, no snapping). Drag to scrub; a fling carries momentum and
 * eases back to the drift. Optional scroll navigation: mouse wheel / trackpad
 * over the carousel moves it. Faster movement = bigger swell. No text, no numbers.
 *
 * - Each item can be an image or a video, from an upload or a URL.
 * - Videos autoplay muted and loop; they pause when the carousel is off screen.
 * - Three.js is imported from the "three" npm package (no CDN).
 * - Animation only runs while the component is in the viewport.
 * - On the Framer canvas a static preview is shown instead.
 */
import { useEffect, useRef, useState } from "react"
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


type ImageValue = { src: string; srcSet?: string; alt?: string } | string

type MediaItem = {
    type?: "image" | "video"
    source?: "upload" | "url"
    image?: ImageValue
    imageUrl?: string
    video?: string
    videoUrl?: string
}

type ResolvedMedia = { kind: "image" | "video"; src: string }

interface Props {
    items: MediaItem[]
    autoplay: boolean
    speed: number
    direction: "left" | "right"
    scrollNav: boolean
    scrollSpeed: number
    scrollDirection: "normal" | "reverse"
    wind: number
    gust: number
    waveSpeed: number
    cardHeight: number
    cardRatio: number
    gap: number
    radius: number
    edgeFade: boolean
    draggable: boolean
    style?: React.CSSProperties
}

// ---------- Placeholder art (used when no images are set) ----------
const PALETTES: [string[], string[], string][] = [
    [
        ["#2a1b4a", "#c1446b", "#f59e5b"],
        ["#6b2f5c", "#3f1d47", "#1f0f2b"],
        "#fff1c9",
    ],
    [
        ["#e8f6ff", "#9fd0f0", "#4b8fc4"],
        ["#cfe7f5", "#7fb2d6", "#2f5f8a"],
        "#ffffff",
    ],
    [
        ["#eef6e9", "#a8d1ad", "#4f8a63"],
        ["#6b9e7a", "#2f6448", "#173c2b"],
        "#fffbe8",
    ],
    [
        ["#fff3d6", "#f7c873", "#e08b3a"],
        ["#e9a24f", "#cf7a32", "#a6551f"],
        "#fffaf0",
    ],
    [
        ["#1a1440", "#5b3a9e", "#d58bd1"],
        ["#4a2d7a", "#2e1a52", "#150c2e"],
        "#ffe3f4",
    ],
    [
        ["#fde7df", "#f6a48a", "#d85a30"],
        ["#c24e2a", "#8f3218", "#4a1b0c"],
        "#fff6ec",
    ],
    [
        ["#050b1f", "#0e2c5a", "#1f6aa5"],
        ["#0b2a4f", "#071c38", "#030d1d"],
        "#e9f2ff",
    ],
    [
        ["#f0fbf6", "#9fe1cb", "#1d9e75"],
        ["#5dcaa5", "#0f6e56", "#04342c"],
        "#ffffff",
    ],
]

function paintPlaceholder(i: number, seed: { v: number }): HTMLCanvasElement {
    const R = () => (seed.v = (seed.v * 16807) % 2147483647) / 2147483647
    const [sky, hills, sun] = PALETTES[i % PALETTES.length]
    const W = 400,
        H = 500
    const c = document.createElement("canvas")
    c.width = W
    c.height = H
    const g = c.getContext("2d")!
    const gr = g.createLinearGradient(0, 0, 0, H)
    sky.forEach((s, k) => gr.addColorStop(k / 2, s))
    g.fillStyle = gr
    g.fillRect(0, 0, W, H)
    g.fillStyle = sun
    g.beginPath()
    g.arc(60 + R() * 280, 90 + R() * 90, 26 + R() * 26, 0, Math.PI * 2)
    g.fill()
    hills.forEach((col, k) => {
        const base = H * (0.52 + k * 0.16),
            amp = H * (0.1 + R() * 0.12)
        const f = 0.008 + R() * 0.02,
            ph = R() * 9
        g.fillStyle = col
        g.beginPath()
        g.moveTo(0, H)
        for (let x = 0; x <= W; x += 6)
            g.lineTo(
                x,
                base -
                    Math.abs(Math.sin(x * f + ph)) * amp -
                    Math.sin(x * f * 3 + ph) * amp * 0.2
            )
        g.lineTo(W, H)
        g.fill()
    })
    return c
}

const imageSrc = (img?: ImageValue) =>
    typeof img === "string" ? img : img?.src

/** Turns a property-control item into { kind, src }, or null if it's empty. */
function resolveMedia(item: MediaItem): ResolvedMedia | null {
    if (!item) return null
    const kind = item.type === "video" ? "video" : "image"
    const fromUrl = item.source === "url"
    const src =
        kind === "video"
            ? fromUrl
                ? item.videoUrl
                : item.video
            : fromUrl
              ? item.imageUrl
              : imageSrc(item.image)
    const clean = (src || "").trim()
    return clean ? { kind, src: clean } : null
}

// ---------- Shaders ----------
const VERTEX = /* glsl */ `
uniform vec2 uCard; uniform float uX, uV, uT, uHX, uWind, uGust, uWave;
varying vec2 vUv; varying float vF, vS;
void main(){
  vUv = uv;
  vec2 l = position.xy * uCard;
  float s = uCard.x / 1.5;                                   // keep wave shape proportional to card size
  float amp = (uWind + min(uV, 1.) * uGust) * s;
  float t = uT * uWave;
  float fxw = l.x + uX;
  // Ocean: one swell rolls through the whole strip, plus a smaller cross-wave
  float fx = fxw / s;
  float z = (sin(fx * .9 - t * .6) * 1.1 + sin(fx * 1.7 + l.y / s * .8 - t) * .3) * amp;
  vec3 p = vec3(fxw, l.y, z);                                // straight horizontal strip
  vS = 1.;
  vF = smoothstep(uHX, uHX * .55, abs(fxw));
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`

const FRAGMENT = /* glsl */ `
uniform sampler2D map; uniform vec2 uCard; uniform float uCorner, uTexAsp;
varying vec2 vUv; varying float vF, vS;
void main(){
  vec2 uv = vUv; float ca = uCard.x / uCard.y;
  if (ca > uTexAsp) uv.y = (uv.y - .5) * (uTexAsp / ca) + .5; else uv.x = (uv.x - .5) * (ca / uTexAsp) + .5;
  vec2 q = abs(vUv - .5) * uCard - (uCard * .5 - uCorner);
  float d = length(max(q, 0.)) - uCorner;
  float a = smoothstep(.006, -.006, d) * clamp(vF * 1.4, 0., 1.);
  if (a < .01) discard;
  gl_FragColor = vec4(texture2D(map, uv).rgb, a);
}`

const CAM_Z = 5.8
const FOV = 50
const VISIBLE_H = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180)
const MAX_ASPECT = 4

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FlagsCarousel(props: Props) {
    const {
        items,
        autoplay,
        speed,
        direction,
        scrollNav,
        scrollSpeed,
        scrollDirection,
        wind,
        gust,
        waveSpeed,
        cardHeight,
        cardRatio,
        gap,
        radius,
        edgeFade,
        draggable,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)
    const inViewRef = useRef(false)
    const api = useRef<{ start: () => void; stop: () => void } | null>(null)
    const offRef = useRef(0) // keeps position when the scene rebuilds

    // Live-tunable values without rebuilding the scene
    const live = useRef({
        autoplay,
        speed,
        direction,
        scrollNav,
        scrollSpeed,
        scrollDirection,
        wind,
        gust,
        waveSpeed,
        edgeFade,
        draggable,
    })
    live.current = {
        autoplay,
        speed,
        direction,
        scrollNav,
        scrollSpeed,
        scrollDirection,
        wind,
        gust,
        waveSpeed,
        edgeFade,
        draggable,
    }

    const media = (items || [])
        .map(resolveMedia)
        .filter(Boolean) as ResolvedMedia[]
    const mediaKey = media.map((m) => m.kind + ":" + m.src).join("|")

    // --- Viewport detection ---
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    // --- Three.js scene ---
    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.domElement.style.display = "block"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        el.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 100)
        camera.position.set(0, 0, CAM_Z)
        camera.lookAt(0, 0, 0)

        const cardH = VISIBLE_H * (cardHeight / 100)
        const card = new THREE.Vector2(cardH * cardRatio, cardH)
        const spacing = card.x * (1 + gap / 100)
        const corner = Math.min(card.x, card.y) * (radius / 100)

        const count = media.length || 10
        // Enough cards that the wrap-around seam is always off screen
        const minCards =
            Math.ceil(
                (2 * ((VISIBLE_H * MAX_ASPECT) / 2 + card.x * 2)) / spacing
            ) + 1
        const total = Math.max(count, Math.ceil(minCards / count) * count)
        const loopLen = total * spacing

        const shared = {
            uCard: { value: card },
            uV: { value: 0 },
            uT: { value: 0 },
            uHX: { value: 1000 },
            uWind: { value: wind },
            uGust: { value: gust },
            uWave: { value: waveSpeed },
            uCorner: { value: corner },
        }

        const geometry = new THREE.PlaneGeometry(1, 1, 56, 32)
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin("anonymous")
        const seed = { v: 47 }
        const textures: THREE.Texture[] = []
        const materials: THREE.ShaderMaterial[] = []
        const meshes: THREE.Mesh[] = []
        const xUniforms: { value: number }[] = []

        // One texture per unique item, reused by repeated cards
        const uniqueTex: THREE.Texture[] = []
        const texAsp: { value: number }[] = []
        const videos: HTMLVideoElement[] = []
        for (let i = 0; i < count; i++) {
            const asp = { value: 400 / 500 }
            const m = media[i]
            let tex: THREE.Texture
            if (m && m.kind === "video") {
                const v = document.createElement("video")
                v.crossOrigin = "anonymous"
                v.muted = true
                v.defaultMuted = true
                v.loop = true
                v.playsInline = true
                v.setAttribute("playsinline", "")
                v.setAttribute("webkit-playsinline", "")
                v.preload = "auto"
                v.addEventListener("loadedmetadata", () => {
                    if (v.videoWidth && v.videoHeight)
                        asp.value = v.videoWidth / v.videoHeight
                })
                v.src = m.src
                videos.push(v)
                tex = new THREE.VideoTexture(v)
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.generateMipmaps = false
            } else if (m) {
                tex = loader.load(m.src, (t) => {
                    const img = t.image as HTMLImageElement
                    if (img?.width && img?.height)
                        asp.value = img.width / img.height
                })
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
            } else {
                tex = new THREE.CanvasTexture(paintPlaceholder(i, seed))
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
            }
            uniqueTex.push(tex)
            texAsp.push(asp)
            textures.push(tex)
        }

        for (let i = 0; i < total; i++) {
            const uX = { value: 0 }
            xUniforms.push(uX)
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    ...shared,
                    map: { value: uniqueTex[i % count] },
                    uTexAsp: texAsp[i % count],
                    uX,
                },
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                transparent: true,
                side: THREE.DoubleSide,
            })
            materials.push(mat)
            const mesh = new THREE.Mesh(geometry, mat)
            mesh.frustumCulled = false
            scene.add(mesh)
            meshes.push(mesh)
        }

        // --- Sizing ---
        let halfW = VISIBLE_H / 2
        const resize = () => {
            const w = el.clientWidth,
                h = el.clientHeight
            if (!w || !h) return
            renderer.setSize(w, h, false)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            halfW = (VISIBLE_H / 2) * camera.aspect
            draw(performance.now())
        }

        // --- Motion state ---
        const mod = (x: number, n: number) => ((x % n) + n) % n
        const wrap = (v: number, L: number) => mod(v + L / 2, L) - L / 2
        let off = offRef.current
        const target = () =>
            live.current.autoplay
                ? live.current.speed *
                  (live.current.direction === "left" ? 1 : -1)
                : 0
        let vel = target()
        let drag: { lx: number; lt: number } | null = null
        let raf = 0
        let lastT = 0
        let clock = 0

        const draw = (_now: number) => {
            const L = live.current
            shared.uWind.value = L.wind
            shared.uGust.value = L.gust
            shared.uWave.value = L.waveSpeed
            shared.uHX.value = L.edgeFade
                ? Math.min(halfW + card.x * 0.6, loopLen / 2)
                : loopLen
            shared.uT.value = clock
            for (let k = 0; k < total; k++) {
                const d = wrap((k - off) * spacing, loopLen)
                xUniforms[k].value = d
                meshes[k].renderOrder = -Math.round(Math.abs(d) * 10)
            }
            renderer.render(scene, camera)
        }

        const loop = (now: number) => {
            const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0
            lastT = now
            clock += dt
            if (!drag) {
                vel += (target() - vel) * (1 - Math.exp(-dt * 1.2))
                off += vel * dt
            }
            offRef.current = off
            const gustTarget = Math.min(1, Math.abs(vel) / 2)
            shared.uV.value += (gustTarget - shared.uV.value) * 0.06
            draw(now)
            raf = requestAnimationFrame(loop)
        }

        const start = () => {
            videos.forEach((v) => v.play().catch(() => {}))
            if (raf) return
            lastT = 0
            raf = requestAnimationFrame(loop)
        }
        const stop = () => {
            videos.forEach((v) => v.pause())
            if (!raf) return
            cancelAnimationFrame(raf)
            raf = 0
        }

        // --- Drag with momentum ---
        const pxPerCard = () =>
            Math.max(60, el.clientWidth / ((halfW * 2) / spacing))
        const onDown = (e: PointerEvent) => {
            if (!live.current.draggable) return
            drag = { lx: e.clientX, lt: performance.now() }
            vel = 0
            el.style.cursor = "grabbing"
        }
        const onMove = (e: PointerEvent) => {
            if (!drag) return
            const now = performance.now()
            const dCards = (e.clientX - drag.lx) / pxPerCard()
            const dt = Math.max(1, now - drag.lt) / 1000
            off -= dCards
            vel = -dCards / dt
            drag.lx = e.clientX
            drag.lt = now
        }
        const onUp = () => {
            if (!drag) return
            drag = null
            vel = Math.max(-6, Math.min(6, vel))
            el.style.cursor = live.current.draggable ? "grab" : "default"
        }
        // --- Scroll navigation ---
        // Moves the strip by `cards` and adds momentum that eases back to the auto speed.
        const nudge = (px: number) => {
            const L = live.current
            const cards =
                (px / pxPerCard()) *
                L.scrollSpeed *
                (L.scrollDirection === "reverse" ? -1 : 1)
            off += cards
            vel = Math.max(-6, Math.min(6, vel + cards * 6))
        }
        // Mouse wheel / trackpad while the pointer is over the carousel
        const onWheel = (e: WheelEvent) => {
            if (!live.current.scrollNav || drag) return
            const d =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            if (!d) return
            e.preventDefault()
            const px =
                e.deltaMode === 1
                    ? d * 16
                    : e.deltaMode === 2
                      ? d * el.clientHeight
                      : d
            nudge(px)
        }
        el.addEventListener("wheel", onWheel, { passive: false })

        el.addEventListener("pointerdown", onDown)
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onUp)

        const ro = new ResizeObserver(resize)
        ro.observe(el)
        resize()

        api.current = { start, stop }
        if (inViewRef.current) start()

        return () => {
            stop()
            api.current = null
            ro.disconnect()
            el.removeEventListener("wheel", onWheel)
            el.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
            videos.forEach((v) => {
                v.pause()
                v.removeAttribute("src")
                v.load()
            })
            textures.forEach((t) => t.dispose())
            materials.forEach((m) => m.dispose())
            geometry.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode === el)
                el.removeChild(renderer.domElement)
        }
    }, [isStatic, mediaKey, cardHeight, cardRatio, gap, radius])

    // --- Run / pause with viewport visibility ---
    useEffect(() => {
        inViewRef.current = inView
        if (inView) api.current?.start()
        else api.current?.stop()
    }, [inView])

    // --- Static canvas fallback: a row of gently tilted cards, no text ---
    if (isStatic) {
        const fallback = [
            "linear-gradient(#2a1b4a,#c1446b,#f59e5b)",
            "linear-gradient(#e8f6ff,#9fd0f0,#4b8fc4)",
            "linear-gradient(#eef6e9,#a8d1ad,#4f8a63)",
            "linear-gradient(#fff3d6,#f7c873,#e08b3a)",
            "linear-gradient(#1a1440,#5b3a9e,#d58bd1)",
        ]
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: `${gap * 0.4}%`,
                    overflow: "hidden",
                    perspective: 900,
                }}
            >
                {[0, 1, 2, 3, 4].map((i) => {
                    const m = media.length ? media[i % media.length] : null
                    const cardStyle: React.CSSProperties = {
                        flex: "none",
                        height: `${cardHeight}%`,
                        aspectRatio: `${cardRatio}`,
                        borderRadius: `${radius}%/${radius * cardRatio}%`,
                        overflow: "hidden",
                        background:
                            m && m.kind === "image"
                                ? `center / cover no-repeat url(${m.src})`
                                : fallback[i],
                        transform: `rotateY(${i % 2 ? -14 : 14}deg)`,
                        transformOrigin: "left center",
                        opacity: 1 - Math.abs(i - 2) * 0.25,
                    }
                    return (
                        <div key={i} style={cardStyle}>
                            {m && m.kind === "video" && (
                                <video
                                    src={m.src + "#t=0.1"}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    // --- Live component ---
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                touchAction: "pan-y",
                cursor: draggable ? "grab" : "default",
            }}
        />
    )
}

FlagsCarousel.defaultProps = {
    width: 1000,
    height: 800,
    items: [],
    autoplay: true,
    speed: 0.18,
    direction: "left",
    scrollNav: true,
    scrollSpeed: 1,
    scrollDirection: "normal",
    wind: 0.2,
    gust: 0.5,
    waveSpeed: 3,
    cardHeight: 35,
    cardRatio: 0.79,
    gap: 23,
    radius: 6,
    edgeFade: true,
    draggable: true,
}

addPropertyControls(FlagsCarousel, {
    items: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
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
                    hidden: (p: MediaItem) =>
                        p.type === "video" || p.source === "url",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…/photo.jpg",
                    hidden: (p: MediaItem) =>
                        p.type === "video" || p.source !== "url",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: MediaItem) =>
                        p.type !== "video" || p.source === "url",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    hidden: (p: MediaItem) =>
                        p.type !== "video" || p.source !== "url",
                },
            },
        },
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Auto rotate",
        defaultValue: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Auto speed",
        min: 0,
        max: 3,
        step: 0.01,
        defaultValue: 0.18,
        description: "Cards per second",
        hidden: (p: Props) => !p.autoplay,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
        hidden: (p: Props) => !p.autoplay,
    },
    scrollNav: {
        type: ControlType.Boolean,
        title: "Scroll nav",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        description: "Mouse wheel / trackpad over the carousel moves it.",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        hidden: (p: Props) => !p.scrollNav,
    },
    scrollDirection: {
        type: ControlType.Enum,
        title: "Scroll dir",
        options: ["normal", "reverse"],
        optionTitles: ["Normal", "Reverse"],
        displaySegmentedControl: true,
        defaultValue: "normal",
        hidden: (p: Props) => !p.scrollNav,
    },
    wind: {
        type: ControlType.Number,
        title: "Wind",
        min: 0,
        max: 0.8,
        step: 0.01,
        defaultValue: 0.2,
    },
    gust: {
        type: ControlType.Number,
        title: "Fling gust",
        min: 0,
        max: 1.5,
        step: 0.01,
        defaultValue: 0.5,
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave speed",
        min: 0,
        max: 8,
        step: 0.1,
        defaultValue: 3,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card height",
        min: 10,
        max: 90,
        step: 1,
        unit: "%",
        defaultValue: 35,
    },
    cardRatio: {
        type: ControlType.Number,
        title: "Card ratio",
        min: 0.4,
        max: 2,
        step: 0.01,
        defaultValue: 0.79,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 23,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 25,
        step: 0.5,
        unit: "%",
        defaultValue: 6,
    },
    edgeFade: {
        type: ControlType.Boolean,
        title: "Edge fade",
        defaultValue: true,
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Draggable",
        defaultValue: true,
    },
})
