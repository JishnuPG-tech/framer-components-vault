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


type ImageSource = string | { src?: string; alt?: string }
type MediaItem = {
    type?: "image" | "video"
    image?: ImageSource
    video?: string
    poster?: ImageSource
    alt?: string
}
type Props = {
    livePreview?: boolean
    editorPreview?: boolean
    media?: MediaItem[]
    layout?: {
        cardWidth?: number
        cardHeight?: number
        gap?: number
        radius?: number
        scale?: number
        perspective?: number
    }
    motion?: {
        autoplay?: boolean
        speed?: number
        interval?: number
        flipDuration?: number
        direction?: number
        drag?: boolean
        hoverPause?: boolean
    }
    appearance?: { backColor?: string }
    quality?: { pixelRatio?: number; textureSize?: number }
    style?: React.CSSProperties
    id?: string
    className?: string
    [key: string]: any
}

const DEFAULT_MEDIA: MediaItem[] = [
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=85",
        alt: "Mist over green mountains",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85",
        alt: "Alpine peaks",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=85",
        alt: "Mountain under a starry sky",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85",
        alt: "Warm evening landscape",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=85",
        alt: "Sunlight in a forest",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85",
        alt: "Quiet lake and mountains",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=85",
        alt: "Mountain valley",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85",
        alt: "Blue sea and pale sand",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1000&q=85",
        alt: "Ocean at sunset",
    },
]
const DEFAULTS = {
    livePreview: true,
    media: DEFAULT_MEDIA,
    layout: {
        cardWidth: 400,
        cardHeight: 650,
        gap: 50,
        radius: 60,
        scale: 100,
        perspective: 1800,
    },
    motion: {
        autoplay: true,
        speed: 1,
        interval: 2,
        flipDuration: 1.8,
        direction: 1,
        drag: true,
        hoverPause: false,
    },
    appearance: { backColor: "#D7D8DC" },
    quality: { pixelRatio: 2, textureSize: 1536 },
}

// Measured against the supplied 60fps clip. Rotation and conveyor travel have
// separate easing: the row reaches its next position before the flap settles.
const TURN = [
    [0, 0],
    [0.15, 0],
    [0.3, 0.002],
    [0.4, 0.069],
    [0.45, 0.135],
    [0.5, 0.220095],
    [0.55, 0.34],
    [0.6, 0.4444],
    [0.65, 0.55],
    [0.7, 0.625273],
    [0.75, 0.685256],
    [0.8, 0.7333],
    [0.9, 0.804652],
    [1, 0.860791],
    [1.2, 0.926],
    [1.4, 0.968],
    [1.6, 0.992],
    [1.8, 1],
]
const TRAVEL = [
    [0, 0],
    [0.3, 0],
    [0.4, 0.06],
    [0.45, 0.1],
    [0.5, 0.14],
    [0.55, 0.25],
    [0.6, 0.44],
    [0.65, 0.52],
    [0.7, 0.66],
    [0.75, 0.74],
    [0.8, 0.8],
    [0.9, 0.9],
    [1, 0.92],
    [1.2, 0.98],
    [1.5, 1],
    [1.8, 1],
]

function sampleCurve(keys: number[][], t: number) {
    if (t <= 0) return 0
    if (t >= 1.8) return 1
    let i = 0
    while (i < keys.length - 2 && t > keys[i + 1][0]) i++
    const [x0, y0] = keys[i],
        [x1, y1] = keys[i + 1]
    const slope = (a: number, b: number) =>
        (keys[b][1] - keys[a][1]) / (keys[b][0] - keys[a][0])
    const d = slope(i, i + 1)
    const tangent = (j: number) => {
        if (j === 0) return slope(0, 1)
        if (j === keys.length - 1) return slope(j - 1, j)
        const a = slope(j - 1, j),
            b = slope(j, j + 1)
        return a * b <= 0 ? 0 : (2 * a * b) / (a + b)
    }
    const m0 = d === 0 ? 0 : tangent(i),
        m1 = d === 0 ? 0 : tangent(i + 1)
    const u = (t - x0) / (x1 - x0),
        u2 = u * u,
        u3 = u2 * u
    return (
        (2 * u3 - 3 * u2 + 1) * y0 +
        (u3 - 2 * u2 + u) * (x1 - x0) * m0 +
        (-2 * u3 + 3 * u2) * y1 +
        (u3 - u2) * (x1 - x0) * m1
    )
}
const modulo = (value: number, n: number) => ((value % n) + n) % n
const number = (value: any, fallback: number, min: number, max: number) =>
    Number.isFinite(Number(value))
        ? Math.min(max, Math.max(min, Number(value)))
        : fallback
const assetURL = (value?: ImageSource) =>
    typeof value === "string" ? value : value?.src || ""
const imageURL = (item: MediaItem) => assetURL(item.image)

const vertexShader = `
    uniform float uAngle;
    uniform float uWidth;
    uniform float uPerspective;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        // Every flap has its own perspective origin, as in the reference.
        // Flattening after projection prevents a global-camera distortion
        // from changing the animation of cards near the viewport edges.
        float hingeX = position.x + uWidth * 0.5;
        float x = hingeX * cos(uAngle);
        float z = hingeX * sin(uAngle);
        float zoom = uPerspective / max(1.0, uPerspective - z);
        vec3 p = vec3(x * zoom - uWidth * 0.5, position.y * zoom, 0.0);
        // Preserve perspective-correct texture interpolation across the hinge.
        gl_Position = (projectionMatrix * modelViewMatrix * vec4(p, 1.0)) / zoom;
    }
`
const fragmentShader = `
    uniform sampler2D uFront;
    uniform sampler2D uBack;
    uniform vec2 uFrontCrop;
    uniform vec2 uBackCrop;
    uniform float uFrontReady;
    uniform float uBackReady;
    uniform vec2 uSize;
    uniform float uRadius;
    uniform vec3 uFill;
    varying vec2 vUv;
    void main() {
        vec2 q = abs((vUv - 0.5) * uSize) - (uSize * 0.5 - uRadius);
        float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
        float aa = max(fwidth(sdf), 0.1);
        float alpha = 1.0 - smoothstep(-aa, aa, sdf);
        if (alpha < 0.01) discard;
        vec2 frontUV = (vUv - 0.5) * uFrontCrop + 0.5;
        vec2 backUV = (vec2(1.0 - vUv.x, vUv.y) - 0.5) * uBackCrop + 0.5;
        vec4 media = gl_FrontFacing ? texture2D(uFront, frontUV) : texture2D(uBack, backUV);
        float ready = gl_FrontFacing ? uFrontReady : uBackReady;
        gl_FragColor = vec4(mix(uFill, media.rgb, ready), alpha);
        #include <colorspace_fragment>
    }
`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 1350
 */
export default function FlipFlapShowcase(incomingProps: Props) {
    // Intercept and flatten grouped controls; the scene always uses flat props.
    const props = {
        ...DEFAULTS,
        ...DEFAULTS.layout,
        ...DEFAULTS.motion,
        ...DEFAULTS.appearance,
        ...DEFAULTS.quality,
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.motion || {}),
        ...(incomingProps.appearance || {}),
        ...(incomingProps.quality || {}),
    }
    const mountRef = useRef<HTMLDivElement>(null)
    const fallbackRef = useRef<HTMLImageElement>(null)
    const isIntersecting = useRef(true)
    const sceneAPI = useRef<{ refresh: () => void } | null>(null)
    const settings = useRef(props)
    settings.current = props
    const isStatic = useIsStaticRenderer()
    const shouldAnimate =
        !isStatic && (props.editorPreview ?? props.livePreview ?? true)
    const animateRef = useRef(shouldAnimate)
    animateRef.current = shouldAnimate

    // A value-based key prevents parent renders from rebuilding the WebGL context.
    // No array count limit is imposed; only the visible media window is decoded.
    const source = (
        Array.isArray(props.media) ? props.media : DEFAULT_MEDIA
    ).filter((item) => item && typeof item === "object")
    const mediaKey = JSON.stringify(
        source.map((item) => ({
            type: item.type || "image",
            image: imageURL(item),
            video: item.video || "",
            poster: assetURL(item.poster),
            alt:
                item.alt ||
                (typeof item.image === "object" ? item.image.alt : "") ||
                "",
        }))
    )
    const cardWidth = number(props.cardWidth, 400, 40, 1600)
    const cardHeight = number(props.cardHeight, 650, 40, 2000)
    const textureSize = number(props.textureSize, 1536, 256, 4096)
    const ratioLimit = number(props.pixelRatio, 2, 0.5, 3)

    useEffect(() => {
        const container = mountRef.current
        if (!container) return
        let disposed = false
        let frameId = 0
        let resizeObserver: ResizeObserver | null = null
        let intersectionObserver: IntersectionObserver | null = null
        let renderer: THREE.WebGLRenderer | null = null
        let lastFrame = 0
        let phase = 0
        let hover = false
        let dragging = false
        let keyboardPaused = false
        let dragX = 0,
            dragPhase = 0,
            dragPointer = -1
        let snapTarget: number | null = null
        let viewWidth = 1080,
            viewHeight = 1350
        let width = 1,
            height = 1
        let firstFrame = true
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100000)
        const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 1, 1)
        const textures = new Set<THREE.Texture>()
        const materials = new Set<THREE.ShaderMaterial>()
        const geometries = new Set<THREE.BufferGeometry>([geometry])
        const renderTargets = new Set<THREE.WebGLRenderTarget>()
        const listeners: Array<() => void> = []
        const items: MediaItem[] = JSON.parse(mediaKey).filter(
            (item: MediaItem) =>
                item.type === "video"
                    ? Boolean(item.video || item.poster)
                    : Boolean(imageURL(item))
        )
        type Asset = {
            texture: THREE.Texture | null
            aspect: number
            alive: boolean
            image?: HTMLImageElement
            canvas?: HTMLCanvasElement
            video?: HTMLVideoElement
            cleanup: Array<() => void>
            ready: boolean
            failed: boolean
        }
        const assets = new Map<number, Asset>()
        const cards: Array<{
            mesh: THREE.Mesh
            material: THREE.ShaderMaterial
            slot: number
        }> = []
        const needed = new Set<number>()
        const visibleVideos = new Set<HTMLVideoElement>()
        const fill = new THREE.Color("#D7D8DC")
        const blank = new THREE.DataTexture(
            new Uint8Array([255, 255, 255, 255]),
            1,
            1
        )
        blank.colorSpace = THREE.SRGBColorSpace
        blank.needsUpdate = true
        textures.add(blank)
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )

        const listen = (
            target: EventTarget,
            event: string,
            handler: EventListener,
            options?: AddEventListenerOptions
        ) => {
            target.addEventListener(event, handler, options)
            listeners.push(() =>
                target.removeEventListener(event, handler, options)
            )
        }
        const disposeAsset = (asset: Asset) => {
            asset.alive = false
            asset.cleanup.forEach((clean) => clean())
            if (asset.video) {
                asset.video.pause()
                asset.video.removeAttribute("src")
                asset.video.load()
            }
            if (asset.image) {
                asset.image.onload = null
                asset.image.onerror = null
                asset.image.src = ""
            }
            if (asset.texture) {
                asset.texture.dispose()
                textures.delete(asset.texture)
            }
            if (asset.canvas) {
                asset.canvas.width = 0
                asset.canvas.height = 0
            }
        }
        const canRun = () =>
            !disposed &&
            animateRef.current &&
            isIntersecting.current &&
            !document.hidden
        const motionAllowed = () => canRun() && !reducedMotion.matches
        const requestFrame = () => {
            if (disposed || !isIntersecting.current || document.hidden) return
            if (!animateRef.current) {
                cancelAnimationFrame(frameId)
                renderLoop(performance.now(), true)
                return
            }
            if (!frameId)
                frameId = requestAnimationFrame((time) =>
                    renderLoop(time, false)
                )
        }
        const decorateTexture = (texture: THREE.Texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            texture.generateMipmaps = false
            texture.anisotropy = Math.min(
                4,
                renderer?.capabilities.getMaxAnisotropy() || 1
            )
            textures.add(texture)
        }
        const loadImage = (asset: Asset, url: string) => {
            const img = new Image()
            asset.image = img
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            img.onload = () => {
                if (disposed || !asset.alive) return
                const maxSize = Math.min(
                    textureSize,
                    renderer?.capabilities.maxTextureSize || textureSize
                )
                const factor = Math.min(
                    1,
                    maxSize / Math.max(img.naturalWidth, img.naturalHeight)
                )
                const canvas = document.createElement("canvas")
                canvas.width = Math.max(
                    1,
                    Math.round(img.naturalWidth * factor)
                )
                canvas.height = Math.max(
                    1,
                    Math.round(img.naturalHeight * factor)
                )
                const context = canvas.getContext("2d")
                if (!context) return
                context.drawImage(img, 0, 0, canvas.width, canvas.height)
                if (asset.texture) {
                    asset.texture.dispose()
                    textures.delete(asset.texture)
                }
                if (asset.canvas) {
                    asset.canvas.width = 0
                    asset.canvas.height = 0
                }
                asset.canvas = canvas
                asset.aspect = img.naturalWidth / img.naturalHeight
                asset.texture = new THREE.CanvasTexture(canvas)
                decorateTexture(asset.texture)
                asset.ready = true
                // The texture owns the downsampled canvas. Release the original
                // decoded image, which may be much larger than the GPU limit.
                img.onload = null
                img.onerror = null
                img.src = ""
                asset.image = undefined
                requestFrame() // One frame also updates a paused Framer thumbnail.
            }
            img.onerror = () => {
                if (!disposed && asset.alive) {
                    asset.failed = true
                    requestFrame()
                }
            }
            img.src = url
        }
        const getAsset = (index: number): Asset | null => {
            if (!items.length) return null
            const id = modulo(index, items.length)
            const cached = assets.get(id)
            if (cached) return cached
            const item = items[id]
            const asset: Asset = {
                texture: null,
                aspect: cardWidth / cardHeight,
                alive: true,
                cleanup: [],
                ready: false,
                failed: false,
            }
            assets.set(id, asset)
            if (item.type === "video" && item.video) {
                const video = document.createElement("video")
                asset.video = video
                video.crossOrigin = "anonymous"
                video.muted = true
                video.loop = true
                video.playsInline = true
                video.preload = "auto"
                if (item.poster) video.poster = assetURL(item.poster)
                const loaded = () => {
                    if (disposed || !asset.alive || asset.ready) return
                    asset.aspect =
                        (video.videoWidth || cardWidth) /
                        (video.videoHeight || cardHeight)
                    asset.texture = new THREE.VideoTexture(video)
                    decorateTexture(asset.texture)
                    asset.ready = true
                    requestFrame()
                }
                const failure = () => {
                    if (disposed || !asset.alive || asset.failed) return
                    asset.failed = true
                    if (item.poster) loadImage(asset, assetURL(item.poster))
                    else requestFrame()
                }
                video.addEventListener("loadeddata", loaded)
                video.addEventListener("error", failure)
                asset.cleanup.push(() => {
                    video.removeEventListener("loadeddata", loaded)
                    video.removeEventListener("error", failure)
                })
                video.src = item.video
                video.load()
            } else loadImage(asset, imageURL(item) || assetURL(item.poster))
            return asset
        }
        const crop = (target: THREE.Vector2, aspect: number) => {
            const cardAspect = cardWidth / cardHeight
            target.set(
                aspect > cardAspect ? cardAspect / aspect : 1,
                aspect > cardAspect ? 1 : aspect / cardAspect
            )
        }
        const addCard = (slot: number) => {
            const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                toneMapped: false,
                uniforms: {
                    uAngle: { value: 0 },
                    uWidth: { value: cardWidth },
                    uPerspective: { value: 1700 },
                    uFront: { value: blank },
                    uBack: { value: blank },
                    uFrontCrop: { value: new THREE.Vector2(1, 1) },
                    uBackCrop: { value: new THREE.Vector2(1, 1) },
                    uFrontReady: { value: 0 },
                    uBackReady: { value: 0 },
                    uSize: { value: new THREE.Vector2(cardWidth, cardHeight) },
                    uRadius: { value: 60 },
                    uFill: { value: new THREE.Color("#D7D8DC") },
                },
            })
            materials.add(material)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.frustumCulled = false // CPU bounds cannot see the vertex hinge transform.
            mesh.renderOrder = slot + 10000
            scene.add(mesh)
            cards.push({ mesh, material, slot })
        }
        const resize = () => {
            if (disposed || !renderer) return
            const rect = container.getBoundingClientRect()
            width = Math.max(1, rect.width)
            height = Math.max(1, rect.height)
            const scale = number(settings.current.scale, 100, 10, 300) / 100
            viewHeight = 1350 / scale
            viewWidth = (viewHeight * width) / height
            camera.aspect = width / height
            camera.position.z =
                viewHeight /
                (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
            camera.updateProjectionMatrix()
            renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, ratioLimit)
            )
            renderer.setSize(width, height, false)
            const pitch = cardWidth + number(settings.current.gap, 50, 0, 600)
            const halfCount = Math.ceil(viewWidth / pitch / 2) + 2
            if (cards.length !== halfCount * 2 + 1) {
                cards.forEach((card) => {
                    scene.remove(card.mesh)
                    card.material.dispose()
                    materials.delete(card.material)
                })
                cards.length = 0
                for (let slot = -halfCount; slot <= halfCount; slot++)
                    addCard(slot)
            }
            requestFrame()
        }
        const pauseVideos = () =>
            assets.forEach((asset) => asset.video?.pause())

        function renderLoop(now: number, manual: boolean) {
            frameId = 0
            if (
                disposed ||
                !renderer ||
                !isIntersecting.current ||
                document.hidden
            )
                return
            const p = settings.current
            const interval = number(p.interval, 2, 0.3, 30)
            const duration = Math.min(
                interval,
                number(p.flipDuration, 1.8, 0.15, 20)
            )
            const delta = lastFrame
                ? Math.min(0.05, Math.max(0, (now - lastFrame) / 1000))
                : 0
            lastFrame = now
            const paused = dragging || keyboardPaused || (hover && p.hoverPause)
            if (snapTarget !== null && !dragging) {
                if (manual || !motionAllowed()) {
                    phase = snapTarget
                    snapTarget = null
                } else {
                    phase += (snapTarget - phase) * (1 - Math.exp(-delta * 14))
                    if (Math.abs(snapTarget - phase) < 0.0001) {
                        phase = snapTarget
                        snapTarget = null
                    }
                }
            } else if (!manual && motionAllowed() && p.autoplay && !paused) {
                phase +=
                    (delta *
                        number(p.speed, 1, 0.05, 6) *
                        (p.direction === -1 ? -1 : 1)) /
                    interval
            }
            const step = Math.floor(phase),
                fraction = phase - step
            const travel = sampleCurve(
                TRAVEL,
                Math.min(1.8, ((fraction * interval) / duration) * 1.8)
            )
            const gap = number(p.gap, 50, 0, 600),
                pitch = cardWidth + gap
            const radius = number(
                p.radius,
                60,
                0,
                Math.min(cardWidth, cardHeight) / 2
            )
            const perspective = number(
                p.perspective,
                1800,
                cardWidth * 1.5,
                10000
            )
            needed.clear()
            visibleVideos.clear()
            fill.set(p.backColor || "#D7D8DC")
            // Avoid accumulating very large numbers during long-running sessions.
            if (Math.abs(phase) > 1000000 && items.length)
                phase = modulo(phase, items.length)
            cards.forEach((card) => {
                const { mesh, material, slot } = card
                const localTime = ((fraction * interval) / duration) * 1.8
                const angle =
                    sampleCurve(TURN, Math.max(0, Math.min(1.8, localTime))) *
                    Math.PI
                mesh.position.x = slot * pitch - gap * travel
                const frontIndex = modulo(
                    slot + 1 + step * 3,
                    Math.max(1, items.length)
                )
                // A turned panel moves one slot to the left. Back-face indexing
                // compensates that move, so the next batch is continuous at reset.
                const backIndex = modulo(
                    slot + (step + 1) * 3,
                    Math.max(1, items.length)
                )
                const nearViewport =
                    Math.abs(mesh.position.x) < viewWidth / 2 + pitch * 1.5
                const front = nearViewport ? getAsset(frontIndex) : null
                const back = nearViewport ? getAsset(backIndex) : null
                if (nearViewport && items.length) {
                    needed.add(frontIndex)
                    needed.add(backIndex)
                }
                const u = material.uniforms
                u.uAngle.value = angle
                u.uRadius.value = radius
                u.uPerspective.value = perspective
                u.uFill.value.copy(fill)
                u.uFront.value = front?.texture || blank
                u.uBack.value = back?.texture || blank
                u.uFrontReady.value = front?.ready ? 1 : 0
                u.uBackReady.value = back?.ready ? 1 : 0
                crop(
                    u.uFrontCrop.value,
                    front?.aspect || cardWidth / cardHeight
                )
                crop(u.uBackCrop.value, back?.aspect || cardWidth / cardHeight)
                const showing = angle < Math.PI / 2 ? front : back
                const projectedCenter =
                    slot * pitch -
                    gap * travel -
                    (angle > Math.PI / 2 ? cardWidth : 0)
                if (
                    showing?.video &&
                    showing.ready &&
                    Math.abs(projectedCenter) < viewWidth / 2 + cardWidth &&
                    motionAllowed() &&
                    !paused &&
                    p.autoplay &&
                    !manual
                )
                    visibleVideos.add(showing.video)
                mesh.visible = nearViewport && items.length > 0
            })
            assets.forEach((asset, id) => {
                if (!needed.has(id)) {
                    disposeAsset(asset)
                    assets.delete(id)
                } else if (asset.video) {
                    if (visibleVideos.has(asset.video)) {
                        if (asset.video.paused && !asset.failed)
                            void asset.video.play().catch(() => {})
                    } else asset.video.pause()
                }
            })
            renderer.setClearColor(0x000000, 0)
            renderer.render(scene, camera)
            if (firstFrame) {
                firstFrame = false
                if (fallbackRef.current)
                    fallbackRef.current.style.visibility = "hidden"
            }
            if (!manual && canRun()) {
                const hasPlayingVideo = visibleVideos.size > 0
                if (
                    snapTarget !== null ||
                    (motionAllowed() && p.autoplay && !paused) ||
                    hasPlayingVideo
                )
                    frameId = requestAnimationFrame((time) =>
                        renderLoop(time, false)
                    )
            }
        }

        const cleanup = () => {
            if (disposed) return
            disposed = true
            cancelAnimationFrame(frameId)
            frameId = 0
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            listeners.forEach((remove) => remove())
            assets.forEach(disposeAsset)
            assets.clear()
            textures.forEach((texture) => texture.dispose())
            materials.forEach((material) => material.dispose())
            geometries.forEach((asset) => asset.dispose())
            renderTargets.forEach((target) => target.dispose())
            scene.clear()
            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (container && container.contains(renderer.domElement))
                    container.removeChild(renderer.domElement)
            }
            if (fallbackRef.current)
                fallbackRef.current.style.visibility = "visible"
            sceneAPI.current = null
        }

        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
            })
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.domElement.style.cssText =
                "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;"
            renderer.domElement.setAttribute("aria-hidden", "true")
            container.appendChild(renderer.domElement)
            container.setAttribute(
                "aria-label",
                items.length
                    ? `Media showcase, ${items.length} items. Use arrow keys to flip, space to pause.`
                    : "Media showcase. Add images or videos in the Media property."
            )
            sceneAPI.current = {
                refresh: () => {
                    lastFrame = 0
                    if (!animateRef.current) {
                        phase = Math.round(phase)
                        snapTarget = null
                        pauseVideos()
                    }
                    resize()
                },
            }
            resizeObserver = new ResizeObserver(resize)
            resizeObserver.observe(container)
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    isIntersecting.current = entries[0]?.isIntersecting ?? true
                    lastFrame = 0
                    if (isIntersecting.current) requestFrame()
                    else {
                        cancelAnimationFrame(frameId)
                        frameId = 0
                        pauseVideos()
                    }
                },
                { threshold: 0 }
            )
            intersectionObserver.observe(container)

            listen(container, "pointerdown", ((event: PointerEvent) => {
                if (!settings.current.drag || event.button !== 0) return
                dragging = true
                snapTarget = null
                dragX = event.clientX
                dragPhase = phase
                dragPointer = event.pointerId
                container.setPointerCapture(event.pointerId)
                container.style.cursor = "grabbing"
                requestFrame()
            }) as EventListener)
            listen(container, "pointermove", ((event: PointerEvent) => {
                if (!dragging || event.pointerId !== dragPointer) return
                const pitchPixels =
                    ((cardWidth + number(settings.current.gap, 50, 0, 600)) *
                        width) /
                    viewWidth
                phase =
                    dragPhase +
                    (dragX - event.clientX) / Math.max(60, pitchPixels)
                requestFrame()
            }) as EventListener)
            const release = ((event: PointerEvent) => {
                if (!dragging || event.pointerId !== dragPointer) return
                dragging = false
                if (container.hasPointerCapture(event.pointerId))
                    container.releasePointerCapture(event.pointerId)
                container.style.cursor = settings.current.drag
                    ? "grab"
                    : "default"
                snapTarget = Math.round(phase)
                if (!animateRef.current || reducedMotion.matches) {
                    phase = snapTarget
                    snapTarget = null
                }
                requestFrame()
            }) as EventListener
            listen(container, "pointerup", release)
            listen(container, "pointercancel", release)
            listen(container, "lostpointercapture", release)
            listen(container, "pointerenter", (() => {
                hover = true
                requestFrame()
            }) as EventListener)
            listen(container, "pointerleave", (() => {
                hover = false
                requestFrame()
            }) as EventListener)
            listen(container, "keydown", ((event: KeyboardEvent) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault()
                    snapTarget =
                        Math.round(phase) +
                        (event.key === "ArrowRight" ? 1 : -1)
                    if (!animateRef.current || reducedMotion.matches) {
                        phase = snapTarget
                        snapTarget = null
                    }
                    requestFrame()
                } else if (event.code === "Space") {
                    event.preventDefault()
                    keyboardPaused = !keyboardPaused
                    lastFrame = 0
                    requestFrame()
                }
            }) as EventListener)
            listen(document, "visibilitychange", (() => {
                lastFrame = 0
                if (document.hidden) {
                    cancelAnimationFrame(frameId)
                    frameId = 0
                    pauseVideos()
                } else requestFrame()
            }) as EventListener)
            listen(reducedMotion, "change", (() => {
                lastFrame = 0
                requestFrame()
            }) as EventListener)
            // A static editor has no infinite loop. Resizing, all input handlers,
            // prop updates, and async media completion explicitly push one frame.
            resize()
        } catch {
            cleanup() // A usable SSR/image fallback survives a failed WebGL mount.
        }
        return cleanup
    }, [mediaKey, cardWidth, cardHeight, textureSize, ratioLimit])

    useEffect(() => {
        sceneAPI.current?.refresh()
    }, [
        shouldAnimate,
        props.autoplay,
        props.speed,
        props.interval,
        props.flipDuration,
        props.direction,
        props.drag,
        props.hoverPause,
        props.backColor,
        props.radius,
        props.scale,
        props.gap,
        props.perspective,
    ])

    const first = source.find((item) => imageURL(item) || item.poster)
    const containerProps: Record<string, any> = { "data-flip-flap": "showcase" }
    Object.keys(incomingProps).forEach((key) => {
        if (
            key === "id" ||
            key === "className" ||
            key === "title" ||
            key.startsWith("aria-") ||
            key.startsWith("data-") ||
            /^on[A-Z]/.test(key)
        )
            containerProps[key] = incomingProps[key]
    })
    return (
        <div
            {...containerProps}
            ref={mountRef}
            role="region"
            tabIndex={0}
            aria-label="Media showcase. Use arrow keys to flip, space to pause."
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                ...props.style,
                position: "relative",
                overflow: "hidden",
                background: "transparent",
                touchAction: "pan-y",
                cursor: props.drag ? "grab" : "default",
            }}
        >
            {first && (
                <img
                    ref={fallbackRef}
                    src={imageURL(first) || assetURL(first.poster)}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{
                        position: "absolute",
                        width: `${(cardWidth / 1080) * 100}%`,
                        height: `${(cardHeight / 1350) * 100}%`,
                        maxWidth: "90%",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        objectFit: "cover",
                        borderRadius: props.radius,
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

FlipFlapShowcase.defaultProps = DEFAULTS

addPropertyControls(FlipFlapShowcase, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate the editor preview.",
    },
    media: {
        type: ControlType.Array,
        title: "Media",
        description: "Add and reorder images or videos.",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.type !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    description: "Shown if the video fails.",
                    hidden: (p: any) => p.type !== "video",
                },
                alt: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "",
                    description: "Describe this media.",
                },
            },
        },
        defaultValue: DEFAULT_MEDIA.map((item) => ({
            ...item,
            image: { src: imageURL(item), alt: item.alt },
        })),
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 400,
                min: 40,
                max: 1600,
                step: 1,
                unit: "px",
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 650,
                min: 40,
                max: 2000,
                step: 1,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 50,
                min: 0,
                max: 600,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Corners",
                defaultValue: 60,
                min: 0,
                max: 400,
                step: 1,
                unit: "px",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 100,
                min: 10,
                max: 300,
                step: 1,
                unit: "%",
                description: "Size relative to the reference.",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 1800,
                min: 800,
                max: 10000,
                step: 50,
                unit: "px",
                description: "Lower values deepen the fold.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0.05,
                max: 6,
                step: 0.05,
                unit: "×",
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 2,
                min: 0.3,
                max: 30,
                step: 0.1,
                unit: "s",
                description: "Time between folds.",
            },
            flipDuration: {
                type: ControlType.Number,
                title: "Fold Time",
                defaultValue: 1.8,
                min: 0.15,
                max: 20,
                step: 0.05,
                unit: "s",
                description: "How long a fold takes.",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                defaultValue: 1,
                options: [1, -1],
                optionTitles: ["Forward", "Reverse"],
                displaySegmentedControl: true,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
                description: "Drag or swipe to flip.",
            },
            hoverPause: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: false,
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            backColor: {
                type: ControlType.Color,
                title: "Loading",
                defaultValue: "#D7D8DC",
                description: "Color while media loads.",
            },
        },
    },
    quality: {
        type: ControlType.Object,
        title: "Quality",
        controls: {
            pixelRatio: {
                type: ControlType.Number,
                title: "Pixel Ratio",
                defaultValue: 2,
                min: 0.5,
                max: 3,
                step: 0.5,
                unit: "×",
                description: "Sharpness limit for the canvas.",
            },
            textureSize: {
                type: ControlType.Number,
                title: "Image Size",
                defaultValue: 1536,
                min: 256,
                max: 4096,
                step: 256,
                unit: "px",
                description: "Largest decoded image edge.",
            },
        },
    },
})
