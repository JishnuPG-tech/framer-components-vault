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


// ============================================================================
// RULE 17: URL NORMALIZATION FOR ELIGIBLE CAROUSEL SLIDE LINKS
// ============================================================================
function normalizeUrl(rawUrl?: string): string | null {
    if (!rawUrl || typeof rawUrl !== "string") return null
    const trimmed = rawUrl.trim()
    if (!trimmed) return null

    const lower = trimmed.toLowerCase()
    if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:") ||
        lower.startsWith("vbscript:")
    ) {
        return null
    }

    if (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("mailto:") ||
        lower.startsWith("tel:") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("#")
    ) {
        return trimmed
    }

    if (lower.startsWith("www.")) {
        return `https://${trimmed}`
    }

    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(trimmed)) {
        return `https://${trimmed}`
    }

    return trimmed
}

// ============================================================================
// SLIDE INTERFACE & DEFAULT MEDIA ITEMS
// ============================================================================
interface SlideItem {
    mediaType?: "image" | "video"
    image?: string
    videoFile?: string
    videoUrl?: string
    title?: string
    link?: string
    openInNewTab?: boolean
}

const DEFAULT_SLIDES: SlideItem[] = [
    {
        mediaType: "image",
        image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=85",
        title: "MACHU PICCHU",
        link: "",
        openInNewTab: false,
        videoUrl: "",
    },
    {
        mediaType: "image",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
        title: "CHAMONIX",
        link: "",
        openInNewTab: false,
        videoUrl: "",
    },
    {
        mediaType: "image",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
        title: "MIMISA ROCKS",
        link: "",
        openInNewTab: false,
        videoUrl: "",
    },
    {
        mediaType: "image",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85",
        title: "MOUNT BROMO",
        link: "",
        openInNewTab: false,
        videoUrl: "",
    },
    {
        mediaType: "image",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85",
        title: "MORAINE LAKE",
        link: "",
        openInNewTab: false,
        videoUrl: "",
    },
]

// ============================================================================
// PROCEDURAL FALLBACK LANDSCAPE GENERATOR
// ============================================================================
function createFallbackLandscapeTexture(index: number): {
    canvas: HTMLCanvasElement
    texture: THREE.CanvasTexture
} {
    const palettes = [
        ["#1e3c40", "#3d6b58", "#d4a373", "#11191c"],
        ["#1b2a47", "#3a6073", "#78909c", "#0f1722"],
        ["#134e5e", "#71b280", "#e0c3fc", "#0b232b"],
        ["#2c1b2e", "#6b3e4b", "#d98a6c", "#140d16"],
        ["#163832", "#235347", "#8eb69b", "#0b1c19"],
    ]
    const pal = palettes[index % palettes.length]

    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 768
    const ctx = canvas.getContext("2d")
    if (ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, 768)
        sky.addColorStop(0, pal[0])
        sky.addColorStop(0.5, pal[1])
        sky.addColorStop(0.75, pal[2])
        sky.addColorStop(1, pal[3])
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, 512, 768)

        for (let layer = 0; layer < 3; layer++) {
            ctx.beginPath()
            const baseY = 380 + layer * 105
            ctx.moveTo(0, 768)
            for (let x = 0; x <= 512; x += 16) {
                const ridge =
                    Math.sin(x * 0.012 + index * 1.7 + layer * 2.1) * 65 +
                    Math.cos(x * 0.028 - layer) * 32
                ctx.lineTo(x, baseY + ridge)
            }
            ctx.lineTo(512, 768)
            ctx.closePath()
            ctx.fillStyle =
                layer === 0
                    ? "rgba(255,255,255,0.12)"
                    : layer === 1
                      ? "rgba(18, 28, 36, 0.55)"
                      : pal[3]
            ctx.fill()
        }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
    return { canvas, texture }
}

// ============================================================================
// HELPER: DRAW MEDIA SOURCE WITH "BACKGROUND-SIZE: COVER" + MORPH TRANSFORM
// ============================================================================
function drawMediaCover(
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    srcW: number,
    srcH: number,
    destW: number,
    destH: number,
    offsetX: number,
    scale: number,
    alpha: number
) {
    if (alpha <= 0.001 || srcW <= 0 || srcH <= 0) return

    const srcAspect = srcW / srcH
    const destAspect = destW / destH

    let drawW = destW
    let drawH = destH

    if (destAspect > srcAspect) {
        drawW = destW
        drawH = destW / srcAspect
    } else {
        drawH = destH
        drawW = destH * srcAspect
    }

    drawW *= scale
    drawH *= scale

    const x = (destW - drawW) * 0.5 + offsetX
    const y = (destH - drawH) * 0.5

    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
    try {
        ctx.drawImage(source, x, y, drawW, drawH)
    } catch {
        // Ignore transient decode state
    }
    ctx.restore()
}

// ============================================================================
// CUSTOM GLSL SHADERS FOR 3D PERSPECTIVE CARDS
// ============================================================================
const CARD_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const CARD_FRAGMENT_SHADER = `
uniform sampler2D uTexture;
uniform float uImageAspect;
uniform float uCardAspect;
uniform float uParallaxX;
uniform float uParallaxY;
uniform float uBrightness;
uniform float uOpacity;
uniform float uVignette;
uniform float uRadius;

varying vec2 vUv;

float roundedBoxSDF(vec2 centerPos, vec2 size, float radius) {
    vec2 q = abs(centerPos) - size + radius;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

void main() {
    if (uOpacity <= 0.001) discard;

    vec2 p = vUv - 0.5;
    float d = roundedBoxSDF(p, vec2(0.5), uRadius);
    float alphaMask = 1.0 - smoothstep(-0.003, 0.003, d);
    if (alphaMask <= 0.001) discard;

    vec2 ratio = vec2(
        min((uCardAspect / max(uImageAspect, 0.001)), 1.0),
        min((uImageAspect / max(uCardAspect, 0.001)), 1.0)
    );

    // Slight zoom margin so horizontal & hover parallax never expose texture edges
    vec2 zoomedRatio = ratio * 0.84;
    vec2 uv = vec2(
        vUv.x * zoomedRatio.x + (1.0 - zoomedRatio.x) * 0.5 + uParallaxX,
        vUv.y * zoomedRatio.y + (1.0 - zoomedRatio.y) * 0.5 + uParallaxY
    );

    vec4 texCol = texture2D(uTexture, clamp(uv, 0.002, 0.998));
    vec3 col = texCol.rgb * uBrightness;

    // Subtle radial vignette when hovered so floating title pops clearly
    float radialVig = smoothstep(0.15, 0.85, length(p)) * uVignette;
    col *= (1.0 - radialVig * 0.35);

    gl_FragColor = vec4(col, texCol.a * alphaMask * uOpacity);
}
`

const SHADOW_FRAGMENT_SHADER = `
uniform float uOpacity;
varying vec2 vUv;

void main() {
    if (uOpacity <= 0.001) discard;
    vec2 p = (vUv - 0.5) * 2.0;
    float dist = max(abs(p.x), abs(p.y));
    float falloff = 1.0 - smoothstep(0.52, 1.0, dist);
    gl_FragColor = vec4(0.0, 0.0, 0.0, falloff * 0.55 * uOpacity);
}
`

// ============================================================================
// MAIN FRAMER COMPONENT
// ============================================================================
/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 680
 */
export default function VoyagePerspectiveCarousel(incomingProps: any) {
    // STEP 1 (RULE 9): Intercept & flatten grouped props
    const props = {
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.typography || {}),
        ...(incomingProps.interaction || {}),
        ...(incomingProps.appearance || {}),
    }

    const mountRef = useRef<HTMLDivElement | null>(null)
    const canvasHostRef = useRef<HTMLDivElement | null>(null)
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const isIntersectingRef = useRef<boolean>(true)

    // Direct DOM refs for 60FPS zero-React-re-render overlay updates (RULE 6 & 7)
    const floatingTitleWrapRef = useRef<HTMLDivElement | null>(null)
    const floatingTitleTextRef = useRef<HTMLDivElement | null>(null)
    const centerLinkRef = useRef<HTMLAnchorElement | null>(null)

    const navTriggerRef = useRef<{ next: () => void; prev: () => void }>({
        next: () => {},
        prev: () => {},
    })
    const dragMovedRef = useRef<boolean>(false)

    // RULE 12: Static renderer & Live Preview check
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.livePreview ?? true)

    const rawSlides: SlideItem[] =
        Array.isArray(props.slides) && props.slides.length > 0
            ? props.slides
            : DEFAULT_SLIDES

    const slides: SlideItem[] = React.useMemo(() => {
        if (rawSlides.length >= 5) return rawSlides
        const padded: SlideItem[] = []
        while (padded.length < 5) {
            for (let i = 0; i < rawSlides.length && padded.length < 5; i++) {
                padded.push(rawSlides[i])
            }
        }
        return padded
    }, [rawSlides])

    const titleFont = props.titleFont || {}
    const textColor = props.textColor || "#FFFFFF"
    const showArrows = props.showArrows ?? true
    const arrowSize = Number(props.arrowSize ?? 44)
    const showBackdrop = props.showBackdrop ?? true
    const bgBlur = Number(props.bgBlur ?? 28)
    const bgDarkness = Number(props.bgDarkness ?? 58) / 100

    useEffect(() => {
        const container = mountRef.current
        const canvasHost = canvasHostRef.current
        if (!container || !canvasHost) return

        // Top-level scoped resources for strict WebGL cleanup (RULE 2)
        let frameId: number | null = null
        let resizeObserver: ResizeObserver | null = null
        let intersectionObserver: IntersectionObserver | null = null
        let renderer: THREE.WebGLRenderer | null = null
        let isDisposed = false

        const geometries: THREE.BufferGeometry[] = []
        const materials: THREE.Material[] = []
        const textures: THREE.Texture[] = []
        const videoElements: HTMLVideoElement[] = []

        const scene = new THREE.Scene()
        let width = Math.max(container.clientWidth, 100)
        let height = Math.max(container.clientHeight, 100)

        const camera = new THREE.PerspectiveCamera(38, width / height, 1, 3500)
        camera.position.set(0, 0, 920)

        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
            })
        } catch {
            return
        }

        renderer.setClearColor(0x000000, 0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(width, height)
        renderer.sortObjects = true
        renderer.domElement.style.display = "block"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        canvasHost.appendChild(renderer.domElement)

        // Configuration parameters
        const baseCardW = Number(props.cardWidth ?? 280)
        const baseCardH = Number(props.cardHeight ?? 420)
        const baseSpacing = Number(props.cardSpacing ?? 225)
        const tiltAngleRad = (Number(props.tiltAngle ?? 28) * Math.PI) / 180
        const baseDepthOffset = Number(props.depthOffset ?? 130)
        const borderRadiusPx = Number(props.borderRadius ?? 4)
        const transitionSpeedSec = Math.max(
            0.15,
            Number(props.transitionSpeed ?? 0.8)
        )
        const hoverParallaxRad =
            (Number(props.hoverParallax ?? 10) * Math.PI) / 180
        const titleParallaxPx = Number(props.titleParallax ?? 55)
        const imageParallaxAmount = Number(props.imageParallax ?? 18) / 100
        const sideDimmingRatio = Number(props.sideDimming ?? 45) / 100
        const enableDrag = Boolean(props.enableDrag ?? true)
        const autoplay = Boolean(props.autoplay ?? false)
        const autoplayInterval = Math.max(
            1.5,
            Number(props.autoplayInterval ?? 4.0)
        )

        const numSlides = slides.length

        // 1. Load & store per-slide Media Assets (Images & Live Videos)
        interface SlideMediaAsset {
            texture: THREE.Texture
            aspect: number
            drawable: CanvasImageSource
            drawableW: number
            drawableH: number
            videoEl: HTMLVideoElement | null
            title: string
            link?: string
            openInNewTab?: boolean
        }

        const mediaAssets: SlideMediaAsset[] = []
        const textureLoader = new THREE.TextureLoader()
        textureLoader.setCrossOrigin("anonymous")

        for (let i = 0; i < numSlides; i++) {
            const slide = slides[i]
            const fallback = createFallbackLandscapeTexture(i)
            textures.push(fallback.texture)

            const asset: SlideMediaAsset = {
                texture: fallback.texture,
                aspect: 512 / 768,
                drawable: fallback.canvas,
                drawableW: 512,
                drawableH: 768,
                videoEl: null,
                title:
                    typeof slide.title === "string" ? slide.title.trim() : "",
                link: slide.link,
                openInNewTab: slide.openInNewTab,
            }
            mediaAssets.push(asset)

            const videoSource =
                slide.mediaType === "video"
                    ? slide.videoFile || slide.videoUrl || ""
                    : ""

            // If a poster image is provided on a video slide (or normal image slide), load it
            if (slide.image) {
                textureLoader.load(
                    slide.image,
                    (loadedTex) => {
                        if (isDisposed) {
                            loadedTex.dispose()
                            return
                        }
                        loadedTex.minFilter = THREE.LinearFilter
                        loadedTex.magFilter = THREE.LinearFilter
                        loadedTex.needsUpdate = true
                        textures.push(loadedTex)

                        const img = loadedTex.image as
                            | HTMLImageElement
                            | undefined
                        const iw = img?.naturalWidth || img?.width || 512
                        const ih = img?.naturalHeight || img?.height || 768

                        // Only use image if video hasn't taken over yet
                        if (!asset.videoEl) {
                            asset.aspect = iw / ih
                            asset.texture = loadedTex
                            if (img) {
                                asset.drawable = img
                                asset.drawableW = iw
                                asset.drawableH = ih
                            }
                        }

                        if (!shouldAnimate) {
                            renderFrame(performance.now(), true)
                        }
                    },
                    undefined,
                    () => {}
                )
            }

            if (videoSource) {
                const vid = document.createElement("video")
                vid.crossOrigin = "anonymous"
                vid.loop = true
                vid.muted = true
                vid.playsInline = true
                vid.setAttribute("playsinline", "true")
                vid.setAttribute("webkit-playsinline", "true")
                vid.preload = "auto"
                vid.src = videoSource
                videoElements.push(vid)

                let videoActivated = false
                const activateVideo = () => {
                    if (isDisposed || videoActivated) return
                    videoActivated = true
                    const vw = vid.videoWidth || 720
                    const vh = vid.videoHeight || 1280
                    asset.aspect = vw / vh

                    const vidTex = new THREE.VideoTexture(vid)
                    vidTex.minFilter = THREE.LinearFilter
                    vidTex.magFilter = THREE.LinearFilter
                    vidTex.needsUpdate = true
                    textures.push(vidTex)

                    asset.texture = vidTex
                    asset.videoEl = vid
                    asset.drawable = vid
                    asset.drawableW = vw
                    asset.drawableH = vh

                    if (shouldAnimate) {
                        vid.play().catch(() => {})
                    } else {
                        renderFrame(performance.now(), true)
                    }
                }

                vid.addEventListener("loadeddata", activateVideo, {
                    once: true,
                })
                vid.addEventListener("canplay", activateVideo, { once: true })
                vid.load()
            }
        }

        // 2. Create 7 Virtual Card Slots (-3, -2, -1, 0, +1, +2, +3)
        // Using depthTest: false + Painter's Algorithm renderOrder so cards NEVER slice through each other!
        const SLOT_OFFSETS = [-3, -2, -1, 0, 1, 2, 3]
        const cardGeo = new THREE.PlaneGeometry(1, 1, 12, 12)
        const shadowGeo = new THREE.PlaneGeometry(1.22, 1.18)
        geometries.push(cardGeo, shadowGeo)

        const radiusNorm = Math.min(
            0.45,
            borderRadiusPx / Math.max(baseCardW, baseCardH, 1)
        )

        interface VirtualSlot {
            slotOffset: number
            group: THREE.Group
            mesh: THREE.Mesh
            shadowMesh: THREE.Mesh
            material: THREE.ShaderMaterial
            shadowMat: THREE.ShaderMaterial
            assignedSlideIdx: number
            currentDiff: number
            hoverScale: number
            hoverTiltX: number
            hoverTiltY: number
        }

        const virtualSlots: VirtualSlot[] = []

        for (let s = 0; s < SLOT_OFFSETS.length; s++) {
            const mat = new THREE.ShaderMaterial({
                vertexShader: CARD_VERTEX_SHADER,
                fragmentShader: CARD_FRAGMENT_SHADER,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                uniforms: {
                    uTexture: { value: mediaAssets[0].texture },
                    uImageAspect: { value: 512 / 768 },
                    uCardAspect: { value: baseCardW / baseCardH },
                    uParallaxX: { value: 0.0 },
                    uParallaxY: { value: 0.0 },
                    uBrightness: { value: 1.0 },
                    uOpacity: { value: 1.0 },
                    uVignette: { value: 0.0 },
                    uRadius: { value: radiusNorm },
                },
            })
            materials.push(mat)

            const shadowMat = new THREE.ShaderMaterial({
                vertexShader: CARD_VERTEX_SHADER,
                fragmentShader: SHADOW_FRAGMENT_SHADER,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                uniforms: {
                    uOpacity: { value: 1.0 },
                },
            })
            materials.push(shadowMat)

            const group = new THREE.Group()
            const mesh = new THREE.Mesh(cardGeo, mat)
            const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
            shadowMesh.position.set(0, -14, -16)

            group.add(shadowMesh)
            group.add(mesh)
            scene.add(group)

            virtualSlots.push({
                slotOffset: SLOT_OFFSETS[s],
                group,
                mesh,
                shadowMesh,
                material: mat,
                shadowMat,
                assignedSlideIdx: 0,
                currentDiff: SLOT_OFFSETS[s],
                hoverScale: 1,
                hoverTiltX: 0,
                hoverTiltY: 0,
            })
        }

        // Responsive scale calculation & Backdrop Canvas sizing
        let responsiveScale = 1
        const updateSize = (w: number, h: number) => {
            width = Math.max(w, 100)
            height = Math.max(h, 100)
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer?.setSize(width, height)

            if (bgCanvasRef.current) {
                // Keep internal backdrop resolution crisp when blur is low and fast when heavily blurred
                const scaleDown = bgBlur > 16 ? 0.45 : 0.85
                const targetCW = Math.max(
                    160,
                    Math.min(960, Math.round(width * scaleDown))
                )
                const targetCH = Math.max(
                    120,
                    Math.min(640, Math.round(height * scaleDown))
                )
                if (
                    bgCanvasRef.current.width !== targetCW ||
                    bgCanvasRef.current.height !== targetCH
                ) {
                    bgCanvasRef.current.width = targetCW
                    bgCanvasRef.current.height = targetCH
                }
            }

            const totalSceneSpanW = baseCardW + baseSpacing * 3.95
            const totalSceneSpanH = baseCardH * 1.25
            const visibleHAtZero =
                2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
            const visibleWAtZero = visibleHAtZero * camera.aspect

            responsiveScale = Math.min(
                1.25,
                (visibleWAtZero * 0.88) / Math.max(totalSceneSpanW, 1),
                (visibleHAtZero * 0.86) / Math.max(totalSceneSpanH, 1)
            )
        }

        updateSize(width, height)

        // Carousel & Hover State stored in closure (RULE 6: Bypass React State)
        let currentIndex = 0
        let targetIndex = 0
        let moveDirection = 1 // +1 = Next, -1 = Prev
        let lastActiveIntIdx = -1

        // Hovered slot & local pointer coordinates [-1, 1] for strong floating title parallax
        let hoveredSlotIdx = -1
        let cardLocalPointerX = 0
        let cardLocalPointerY = 0
        let smoothTitleOffsetX = 0
        let smoothTitleOffsetY = 0
        let smoothTitleRotX = 0
        let smoothTitleRotY = 0
        let smoothTitleOpacity = 0
        let smoothTitleScale = 0.88
        let displayedHoverTitle = ""

        // Drag state
        let isDragging = false
        let dragStartX = 0
        let dragStartTarget = 0
        let lastAutoplayTime = performance.now() * 0.001

        const wrapIndex = (idx: number): number => {
            return ((idx % numSlides) + numSlides) % numSlides
        }

        const projVec = new THREE.Vector3()

        // Real-time morphing backdrop renderer (supports both images & live playing videos)
        const renderBackdropMorph = (virtualIdx: number) => {
            if (!showBackdrop) return
            const bgCanvas = bgCanvasRef.current
            if (!bgCanvas) return
            const ctx = bgCanvas.getContext("2d")
            if (!ctx) return

            const cw = bgCanvas.width
            const ch = bgCanvas.height

            const floorIdx = wrapIndex(Math.floor(virtualIdx))
            const ceilIdx = wrapIndex(Math.floor(virtualIdx) + 1)
            const rawT = Math.max(
                0,
                Math.min(1, virtualIdx - Math.floor(virtualIdx))
            )

            // Responsive real-time morph blend curve: immediate reaction while dragging + smooth finish
            const smoothT = rawT * rawT * (3 - 2 * rawT)
            const morphT = rawT * 0.35 + smoothT * 0.65

            const assetA = mediaAssets[floorIdx]
            const assetB = mediaAssets[ceilIdx]

            ctx.clearRect(0, 0, cw, ch)

            if (assetA) {
                const srcA =
                    assetA.videoEl && assetA.videoEl.readyState >= 2
                        ? assetA.videoEl
                        : assetA.drawable
                const wA =
                    assetA.videoEl && assetA.videoEl.readyState >= 2
                        ? assetA.videoEl.videoWidth || assetA.drawableW
                        : assetA.drawableW
                const hA =
                    assetA.videoEl && assetA.videoEl.readyState >= 2
                        ? assetA.videoEl.videoHeight || assetA.drawableH
                        : assetA.drawableH

                // Base layer drawn at alpha 1.0 with subtle directional shift & zoom morph
                drawMediaCover(
                    ctx,
                    srcA,
                    wA,
                    hA,
                    cw,
                    ch,
                    -rawT * cw * 0.14,
                    1.0 + rawT * 0.07,
                    1.0
                )
            }

            if (assetB && rawT > 0.0005) {
                const srcB =
                    assetB.videoEl && assetB.videoEl.readyState >= 2
                        ? assetB.videoEl
                        : assetB.drawable
                const wB =
                    assetB.videoEl && assetB.videoEl.readyState >= 2
                        ? assetB.videoEl.videoWidth || assetB.drawableW
                        : assetB.drawableW
                const hB =
                    assetB.videoEl && assetB.videoEl.readyState >= 2
                        ? assetB.videoEl.videoHeight || assetB.drawableH
                        : assetB.drawableH

                // Incoming layer seamlessly morphs over base layer with C0 boundary continuity
                drawMediaCover(
                    ctx,
                    srcB,
                    wB,
                    hB,
                    cw,
                    ch,
                    (1.0 - rawT) * cw * 0.14,
                    1.07 - rawT * 0.07,
                    morphT
                )
            }
        }

        const updateDOMOverlays = (
            virtualIdx: number,
            dt: number,
            bypassLerp: boolean
        ) => {
            const activeIdx = Math.round(virtualIdx)
            const wrappedActive = wrapIndex(activeIdx)

            // 1. Update active slide link (Rule 17)
            if (wrappedActive !== lastActiveIntIdx) {
                lastActiveIntIdx = wrappedActive
                const s = mediaAssets[wrappedActive]

                if (centerLinkRef.current) {
                    const validUrl = normalizeUrl(s?.link)
                    if (validUrl) {
                        centerLinkRef.current.href = validUrl
                        if (s?.openInNewTab) {
                            centerLinkRef.current.target = "_blank"
                            centerLinkRef.current.rel = "noopener noreferrer"
                        } else {
                            centerLinkRef.current.removeAttribute("target")
                            centerLinkRef.current.removeAttribute("rel")
                        }
                        centerLinkRef.current.style.display = "block"
                    } else {
                        centerLinkRef.current.removeAttribute("href")
                        centerLinkRef.current.style.display = "none"
                    }
                }
            }

            // 2. Render real-time morphing backdrop (handles images & live playing videos)
            renderBackdropMorph(virtualIdx)

            // 3. Hover-only Floating Title with Strong 3D Parallax (RULE 7: Manual 3D Projection)
            const hoveredSlot =
                hoveredSlotIdx >= 0 && !isDragging
                    ? virtualSlots[hoveredSlotIdx]
                    : null
            const hoveredAsset = hoveredSlot
                ? mediaAssets[hoveredSlot.assignedSlideIdx]
                : null
            const hasHoverTitle = Boolean(
                hoveredAsset && hoveredAsset.title.length > 0
            )

            const targetOpacity = hasHoverTitle ? 1.0 : 0.0
            const targetScale = hasHoverTitle ? 1.0 : 0.88
            const targetOffsetX = hasHoverTitle
                ? cardLocalPointerX * titleParallaxPx
                : 0
            const targetOffsetY = hasHoverTitle
                ? -cardLocalPointerY * titleParallaxPx * 0.85
                : 14
            const targetRotY = hasHoverTitle ? cardLocalPointerX * 18 : 0
            const targetRotX = hasHoverTitle ? cardLocalPointerY * 16 : 0

            if (bypassLerp || !shouldAnimate) {
                smoothTitleOpacity = targetOpacity
                smoothTitleScale = targetScale
                smoothTitleOffsetX = targetOffsetX
                smoothTitleOffsetY = targetOffsetY
                smoothTitleRotX = targetRotX
                smoothTitleRotY = targetRotY
            } else {
                const lerpSpeed = Math.min(1, dt * 11)
                smoothTitleOpacity +=
                    (targetOpacity - smoothTitleOpacity) * lerpSpeed
                smoothTitleScale += (targetScale - smoothTitleScale) * lerpSpeed
                smoothTitleOffsetX +=
                    (targetOffsetX - smoothTitleOffsetX) * lerpSpeed
                smoothTitleOffsetY +=
                    (targetOffsetY - smoothTitleOffsetY) * lerpSpeed
                smoothTitleRotX += (targetRotX - smoothTitleRotX) * lerpSpeed
                smoothTitleRotY += (targetRotY - smoothTitleRotY) * lerpSpeed
            }

            if (hoveredSlot && hoveredAsset && hoveredAsset.title) {
                if (
                    floatingTitleTextRef.current &&
                    displayedHoverTitle !== hoveredAsset.title
                ) {
                    displayedHoverTitle = hoveredAsset.title
                    floatingTitleTextRef.current.textContent =
                        hoveredAsset.title
                }

                // Project hovered card's 3D world center into 2D screen pixels
                projVec.copy(hoveredSlot.group.position)
                projVec.z += 55 * responsiveScale
                projVec.project(camera)

                const screenX = (projVec.x * 0.5 + 0.5) * width
                const screenY = (-projVec.y * 0.5 + 0.5) * height

                if (floatingTitleWrapRef.current) {
                    floatingTitleWrapRef.current.style.left = `${screenX.toFixed(1)}px`
                    floatingTitleWrapRef.current.style.top = `${screenY.toFixed(1)}px`
                }
            }

            if (floatingTitleWrapRef.current) {
                floatingTitleWrapRef.current.style.opacity = String(
                    Math.max(0, Math.min(1, smoothTitleOpacity))
                )
                floatingTitleWrapRef.current.style.transform = `translate3d(calc(-50% + ${smoothTitleOffsetX.toFixed(1)}px), calc(-50% + ${smoothTitleOffsetY.toFixed(1)}px), 0) perspective(600px) rotateX(${smoothTitleRotX.toFixed(2)}deg) rotateY(${smoothTitleRotY.toFixed(2)}deg) scale(${smoothTitleScale.toFixed(3)})`
            }
        }

        // Expose Next / Prev triggers for arrow buttons
        navTriggerRef.current.next = () => {
            moveDirection = 1
            targetIndex = Math.round(targetIndex) + 1
            lastAutoplayTime = performance.now() * 0.001
            if (!shouldAnimate) {
                renderFrame(performance.now(), true)
            }
        }
        navTriggerRef.current.prev = () => {
            moveDirection = -1
            targetIndex = Math.round(targetIndex) - 1
            lastAutoplayTime = performance.now() * 0.001
            if (!shouldAnimate) {
                renderFrame(performance.now(), true)
            }
        }

        let prevTime = performance.now()

        const renderFrame = (now: number, bypassLerp = false) => {
            if (!renderer || isDisposed) return
            const dt = Math.min((now - prevTime) / 1000, 0.05)
            prevTime = now

            const timeSec = now * 0.001

            // Autoplay advancement when idle
            if (
                autoplay &&
                shouldAnimate &&
                !isDragging &&
                hoveredSlotIdx === -1 &&
                timeSec - lastAutoplayTime > autoplayInterval
            ) {
                moveDirection = 1
                targetIndex = Math.round(targetIndex) + 1
                lastAutoplayTime = timeSec
            }

            // RULE 12: Bypass lerping in static mode
            if (bypassLerp || !shouldAnimate) {
                currentIndex = targetIndex
            } else {
                const delta = targetIndex - currentIndex
                if (Math.abs(delta) > 0.001) {
                    moveDirection = delta > 0 ? 1 : -1
                }
                const speedFactor = (1 / transitionSpeedSec) * 4.8
                currentIndex += delta * Math.min(1, dt * speedFactor)
                if (
                    !isDragging &&
                    Math.abs(targetIndex - currentIndex) < 0.0006
                ) {
                    currentIndex = targetIndex
                }
            }

            // Mid-transition phase: 0 at integer stops, 1.0 halfway between slides (frac = ±0.5)
            const baseIntIndex = Math.round(currentIndex)
            const frac = currentIndex - baseIntIndex
            const midTransitionWave = Math.sin(Math.abs(frac) * Math.PI)

            const scaledW = baseCardW * responsiveScale
            const scaledH = baseCardH * responsiveScale
            const scaledSpacing = baseSpacing * responsiveScale
            const scaledDepth = baseDepthOffset * responsiveScale

            for (let s = 0; s < virtualSlots.length; s++) {
                const slot = virtualSlots[s]
                const slotIntIdx = baseIntIndex + slot.slotOffset
                const slideIdx = wrapIndex(slotIntIdx)
                const asset = mediaAssets[slideIdx]

                slot.assignedSlideIdx = slideIdx
                slot.material.uniforms.uTexture.value = asset.texture
                slot.material.uniforms.uImageAspect.value = asset.aspect

                // Continuous offset of this virtual slot from currentIndex
                const diff = slotIntIdx - currentIndex
                slot.currentDiff = diff
                const absDiff = Math.abs(diff)
                const sign = diff < 0 ? -1 : 1

                if (absDiff >= 2.98) {
                    slot.group.visible = false
                    continue
                }
                slot.group.visible = true

                // Anti-collision horizontal separation push when two cards pass near center (absDiff ~ 0.5)
                const centerPassPush =
                    midTransitionWave *
                    Math.exp(-Math.pow(absDiff - 0.5, 2) * 3.5) *
                    (scaledW * 0.22)

                let posX = 0
                let posY = 0
                let posZ = 0
                let baseRotY = 0
                let cardScaleFactor = 1
                let brightness = 1
                let opacity = 1

                if (absDiff <= 2.0) {
                    // FRONT 5-CARD FAN STAGE (Slots -2, -1, 0, +1, +2)
                    if (absDiff <= 1.0) {
                        posX =
                            diff * scaledSpacing +
                            sign * centerPassPush * Math.min(1, absDiff * 2.2)
                    } else {
                        posX =
                            sign *
                                scaledSpacing *
                                (1 + (absDiff - 1.0) * 0.86) +
                            sign * centerPassPush * 0.35
                    }

                    posZ = -Math.pow(absDiff, 1.05) * scaledDepth
                    cardScaleFactor = Math.max(0.62, 1 - absDiff * 0.085)

                    const tiltEase = 1 - midTransitionWave * 0.22
                    const smoothSign = Math.tanh(diff * 2.4)
                    baseRotY =
                        -smoothSign *
                        Math.min(1.22, Math.pow(absDiff, 0.78)) *
                        tiltAngleRad *
                        tiltEase

                    brightness = Math.max(
                        0.28,
                        1 - (absDiff / 2.2) * sideDimmingRatio
                    )
                    opacity = 1.0
                } else {
                    // OUTER WING LEAVE / ENTER ARC (2.0 < absDiff < 3.0)
                    const t = Math.max(0, Math.min(1, absDiff - 2.0))
                    const easeT = t * t * (3 - 2 * t)
                    const outerX = scaledSpacing * 1.86

                    posX =
                        sign * outerX * (1 - Math.sin(t * Math.PI * 0.5) * 0.24)
                    posY = Math.sin(t * Math.PI) * (scaledH * 0.03)
                    posZ =
                        -Math.pow(2.0, 1.05) * scaledDepth -
                        easeT * (scaledDepth * 1.55)

                    cardScaleFactor = (1 - 2.0 * 0.085) * (1 - easeT * 0.22)
                    baseRotY =
                        -sign *
                        Math.min(1.22, Math.pow(2.0, 0.78)) *
                        tiltAngleRad *
                        (1 + easeT * 0.45)

                    brightness = Math.max(
                        0.15,
                        (1 - (2.0 / 2.2) * sideDimmingRatio) * (1 - easeT * 0.5)
                    )
                    opacity = Math.max(0, 1 - easeT * 1.05)
                }

                // Per-slot interactive hover tilt & scale pop
                const isSlotHovered = s === hoveredSlotIdx && !isDragging
                const targetHovScale = isSlotHovered ? 1.035 : 1.0
                const targetHovTiltY = isSlotHovered
                    ? cardLocalPointerX * hoverParallaxRad
                    : 0
                const targetHovTiltX = isSlotHovered
                    ? -cardLocalPointerY * hoverParallaxRad * 0.85
                    : 0

                if (bypassLerp || !shouldAnimate) {
                    slot.hoverScale = targetHovScale
                    slot.hoverTiltX = targetHovTiltX
                    slot.hoverTiltY = targetHovTiltY
                } else {
                    const hLerp = Math.min(1, dt * 10)
                    slot.hoverScale +=
                        (targetHovScale - slot.hoverScale) * hLerp
                    slot.hoverTiltX +=
                        (targetHovTiltX - slot.hoverTiltX) * hLerp
                    slot.hoverTiltY +=
                        (targetHovTiltY - slot.hoverTiltY) * hLerp
                }

                const finalScale = cardScaleFactor * slot.hoverScale
                slot.group.position.set(posX, posY, posZ)
                slot.group.rotation.set(
                    slot.hoverTiltX,
                    baseRotY + slot.hoverTiltY,
                    0
                )
                slot.mesh.scale.set(
                    scaledW * finalScale,
                    scaledH * finalScale,
                    1
                )
                slot.shadowMesh.scale.set(
                    scaledW * finalScale,
                    scaledH * finalScale,
                    1
                )

                // Strict Painter's Algorithm renderOrder
                const incomingBias = diff * moveDirection > 0 ? 12 : 0
                const orderBase =
                    Math.round((10 - absDiff) * 1000) + incomingBias
                slot.shadowMesh.renderOrder = orderBase
                slot.mesh.renderOrder = orderBase + 1

                const hoverShiftX = isSlotHovered
                    ? -cardLocalPointerX * 0.045 * imageParallaxAmount
                    : 0
                const hoverShiftY = isSlotHovered
                    ? cardLocalPointerY * 0.045 * imageParallaxAmount
                    : 0

                slot.material.uniforms.uParallaxX.value =
                    Math.max(-2, Math.min(2, diff)) *
                        0.1 *
                        imageParallaxAmount +
                    hoverShiftX
                slot.material.uniforms.uParallaxY.value = hoverShiftY
                slot.material.uniforms.uBrightness.value = brightness
                slot.material.uniforms.uOpacity.value = opacity
                slot.material.uniforms.uVignette.value = isSlotHovered
                    ? 1.0
                    : 0.0
                slot.shadowMat.uniforms.uOpacity.value =
                    opacity * Math.max(0.12, 1 - absDiff * 0.26)
            }

            updateDOMOverlays(currentIndex, dt, bypassLerp)
            renderer.render(scene, camera)
        }

        // Raycaster for hover detection, local UV parallax, and side-card click selection
        const raycaster = new THREE.Raycaster()
        const pointerNDC = new THREE.Vector2()

        const performHoverRaycast = (clientX: number, clientY: number) => {
            const rect = container.getBoundingClientRect()
            pointerNDC.x =
                ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1
            pointerNDC.y =
                -((clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1
            raycaster.setFromCamera(pointerNDC, camera)

            const activeSlots = virtualSlots
                .map((slot, idx) => ({ slot, idx }))
                .filter(
                    ({ slot }) =>
                        slot.group.visible && Math.abs(slot.currentDiff) <= 2.15
                )
                .sort(
                    (a, b) => b.slot.mesh.renderOrder - a.slot.mesh.renderOrder
                )

            for (let i = 0; i < activeSlots.length; i++) {
                const { slot, idx } = activeSlots[i]
                const hits = raycaster.intersectObject(slot.mesh, false)
                if (hits.length > 0) {
                    hoveredSlotIdx = idx
                    if (hits[0].uv) {
                        cardLocalPointerX = (hits[0].uv.x - 0.5) * 2
                        cardLocalPointerY = (0.5 - hits[0].uv.y) * 2
                    }
                    return
                }
            }

            hoveredSlotIdx = -1
            cardLocalPointerX = 0
            cardLocalPointerY = 0
        }

        const handlePointerDown = (e: PointerEvent) => {
            if ((e.target as HTMLElement)?.closest("[data-carousel-arrow]")) {
                return
            }
            isDragging = enableDrag
            dragMovedRef.current = false
            dragStartX = e.clientX
            dragStartTarget = targetIndex
            lastAutoplayTime = performance.now() * 0.001
        }

        const handlePointerMove = (e: PointerEvent) => {
            if (isDragging && enableDrag) {
                const dx = e.clientX - dragStartX
                if (Math.abs(dx) > 6) {
                    dragMovedRef.current = true
                }
                const dragSensitivity = Math.max(160, width * 0.22)
                targetIndex = dragStartTarget - dx / dragSensitivity
                lastAutoplayTime = performance.now() * 0.001
            } else {
                performHoverRaycast(e.clientX, e.clientY)
            }

            if (!shouldAnimate) {
                renderFrame(performance.now(), true)
            }
        }

        const handlePointerUp = (e: PointerEvent) => {
            if ((e.target as HTMLElement)?.closest("[data-carousel-arrow]")) {
                isDragging = false
                return
            }

            const wasDragged = dragMovedRef.current
            isDragging = false

            if (wasDragged) {
                targetIndex = Math.round(targetIndex)
            } else {
                performHoverRaycast(e.clientX, e.clientY)
                if (hoveredSlotIdx >= 0) {
                    const clickedSlot = virtualSlots[hoveredSlotIdx]
                    const stepOffset = Math.round(clickedSlot.currentDiff)
                    if (Math.abs(stepOffset) >= 1) {
                        moveDirection = stepOffset > 0 ? 1 : -1
                        targetIndex = Math.round(targetIndex) + stepOffset
                    }
                }
            }

            if (!shouldAnimate) {
                renderFrame(performance.now(), true)
            }
        }

        const handlePointerLeave = () => {
            hoveredSlotIdx = -1
            cardLocalPointerX = 0
            cardLocalPointerY = 0
            if (isDragging) {
                isDragging = false
                targetIndex = Math.round(targetIndex)
            }
            if (!shouldAnimate) {
                renderFrame(performance.now(), true)
            }
        }

        container.addEventListener("pointerdown", handlePointerDown, {
            passive: true,
        })
        window.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })
        window.addEventListener("pointerup", handlePointerUp, {
            passive: true,
        })
        container.addEventListener("pointerleave", handlePointerLeave, {
            passive: true,
        })

        // RULE 4: Responsive sizing via ResizeObserver
        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const cr = entry.contentRect
                if (cr.width > 0 && cr.height > 0) {
                    updateSize(cr.width, cr.height)
                    if (!shouldAnimate) {
                        renderFrame(performance.now(), true)
                    }
                }
            }
        })
        resizeObserver.observe(container)

        // RULE 5 & 11: Viewport-Gated Rendering via IntersectionObserver
        intersectionObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0]) {
                    isIntersectingRef.current = entries[0].isIntersecting
                    for (let v = 0; v < videoElements.length; v++) {
                        if (entries[0].isIntersecting && shouldAnimate) {
                            videoElements[v].play().catch(() => {})
                        } else {
                            videoElements[v].pause()
                        }
                    }
                }
            },
            { threshold: 0.01 }
        )
        intersectionObserver.observe(container)

        // Initial render frame
        renderFrame(performance.now(), !shouldAnimate)

        // RULE 12: Continuous loop gated behind shouldAnimate
        const loop = (now: number) => {
            if (!shouldAnimate) return
            frameId = requestAnimationFrame(loop)
            if (!isIntersectingRef.current) return
            renderFrame(now, false)
        }

        if (shouldAnimate) {
            frameId = requestAnimationFrame(loop)
        }

        // RULE 2: STRICT WEBGL & VIDEO CLEANUP FOR FRAMER HOT-RELOADING
        return () => {
            isDisposed = true
            if (frameId !== null) {
                cancelAnimationFrame(frameId)
            }
            if (resizeObserver) {
                resizeObserver.disconnect()
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect()
            }

            container.removeEventListener("pointerdown", handlePointerDown)
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)
            container.removeEventListener("pointerleave", handlePointerLeave)

            for (let v = 0; v < videoElements.length; v++) {
                const vid = videoElements[v]
                vid.pause()
                vid.removeAttribute("src")
                vid.load()
            }
            videoElements.length = 0

            for (let i = 0; i < geometries.length; i++) {
                geometries[i].dispose()
            }
            for (let i = 0; i < materials.length; i++) {
                materials[i].dispose()
            }
            for (let i = 0; i < textures.length; i++) {
                textures[i].dispose()
            }

            scene.clear()

            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (canvasHost && canvasHost.contains(renderer.domElement)) {
                    canvasHost.removeChild(renderer.domElement)
                }
            }
        }
    }, [
        shouldAnimate,
        slides,
        showBackdrop,
        bgBlur,
        props.cardWidth,
        props.cardHeight,
        props.cardSpacing,
        props.tiltAngle,
        props.depthOffset,
        props.borderRadius,
        props.transitionSpeed,
        props.hoverParallax,
        props.titleParallax,
        props.imageParallax,
        props.sideDimming,
        props.enableDrag,
        props.autoplay,
        props.autoplayInterval,
    ])

    // RULE 10: Prevent 0x0px canvas mounting & enforce transparent background
    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        minWidth: 100,
        minHeight: 100,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "transparent",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "pan-y",
        ...props.style,
    }

    const bgCanvasStyle: React.CSSProperties = {
        position: "absolute",
        inset: -80,
        width: "calc(100% + 160px)",
        height: "calc(100% + 160px)",
        filter: `blur(${bgBlur}px) saturate(1.15)`,
        transform: "scale(1.08)",
        pointerEvents: "none",
        zIndex: 0,
        display: showBackdrop ? "block" : "none",
    }

    const arrowBtnBaseStyle: React.CSSProperties = {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        width: arrowSize,
        height: arrowSize,
        borderRadius: "50%",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 10,
        padding: 0,
        outline: "none",
        transition: "background-color 0.2s ease, transform 0.2s ease",
    }

    return (
        <div
            ref={mountRef}
            style={containerStyle}
            aria-label="3D Media Carousel"
        >
            {/* Optional Real-Time Morphing Media Backdrop Canvas (Images & Live Videos) */}
            <canvas ref={bgCanvasRef} style={bgCanvasStyle} />

            {/* Optional Atmospheric Dark Vignette Overlay */}
            {showBackdrop && bgDarkness > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        pointerEvents: "none",
                        background: `radial-gradient(circle at center, rgba(10,12,16,${(bgDarkness * 0.65).toFixed(2)}) 0%, rgba(6,8,12,${Math.min(0.96, bgDarkness + 0.22).toFixed(2)}) 100%)`,
                    }}
                />
            )}

            {/* Three.js WebGL Mount Host */}
            <div
                ref={canvasHostRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 3,
                    cursor: props.enableDrag ? "grab" : "pointer",
                }}
            />

            {/* Hover-Only Floating 3D Parallax Title Overlay */}
            <div
                ref={floatingTitleWrapRef}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate3d(-50%, -50%, 0)",
                    opacity: 0,
                    zIndex: 7,
                    pointerEvents: "none",
                    willChange: "transform, opacity",
                }}
            >
                <div
                    ref={floatingTitleTextRef}
                    style={{
                        color: textColor,
                        fontFamily:
                            titleFont.fontFamily ||
                            "Inter, system-ui, sans-serif",
                        fontWeight: titleFont.fontWeight || 800,
                        fontStyle: titleFont.fontStyle || "normal",
                        fontSize: titleFont.fontSize || "34px",
                        lineHeight: titleFont.lineHeight || "1.12",
                        letterSpacing: titleFont.letterSpacing || "4px",
                        textTransform: "uppercase",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        textShadow:
                            "0 16px 36px rgba(0, 0, 0, 0.85), 0 4px 12px rgba(0, 0, 0, 0.6)",
                    }}
                />
            </div>

            {/* RULE 17: Native HTML <a> Anchor for Linked Active Center Slide */}
            <a
                ref={centerLinkRef}
                aria-label="Open media link"
                onClick={(e) => {
                    if (dragMovedRef.current) {
                        e.preventDefault()
                    }
                }}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: Number(props.cardWidth ?? 280),
                    height: Number(props.cardHeight ?? 420),
                    transform: "translate(-50%, -50%)",
                    zIndex: 6,
                    display: "none",
                    cursor: "pointer",
                    background: "transparent",
                }}
            />

            {/* Left & Right Navigation Arrows */}
            {showArrows && (
                <>
                    <button
                        type="button"
                        data-carousel-arrow="prev"
                        aria-label="Previous slide"
                        onClick={() => navTriggerRef.current.prev()}
                        style={{
                            ...arrowBtnBaseStyle,
                            left: "max(18px, 5.5%)",
                        }}
                    >
                        <svg
                            width={Math.round(arrowSize * 0.46)}
                            height={Math.round(arrowSize * 0.46)}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <button
                        type="button"
                        data-carousel-arrow="next"
                        aria-label="Next slide"
                        onClick={() => navTriggerRef.current.next()}
                        style={{
                            ...arrowBtnBaseStyle,
                            right: "max(18px, 5.5%)",
                        }}
                    >
                        <svg
                            width={Math.round(arrowSize * 0.46)}
                            height={Math.round(arrowSize * 0.46)}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    )
}

// ============================================================================
// STEP 2 (RULE 9): NESTED DEFAULT PROPS
// ============================================================================
VoyagePerspectiveCarousel.defaultProps = {
    livePreview: true,
    slides: DEFAULT_SLIDES,
    layout: {
        cardWidth: 355,
        cardHeight: 460,
        cardSpacing: 225,
        tiltAngle: 23,
        depthOffset: 40,
        borderRadius: 0,
    },
    typography: {
        titleFont: {
            fontFamily:
                '"Bricolage Grotesque", "Bricolage Grotesque Placeholder", sans-serif',
            fontWeight: 600,
            fontStyle: "normal",
            fontSize: "34px",
            letterSpacing: "1.9px",
            lineHeight: "115%",
        },
        textColor: "rgb(255, 255, 255)",
    },
    interaction: {
        transitionSpeed: 2,
        hoverParallax: 12,
        titleParallax: 55,
        imageParallax: 18,
        enableDrag: true,
        autoplay: false,
        autoplayInterval: 4.0,
    },
    appearance: {
        showBackdrop: true,
        bgBlur: 80,
        bgDarkness: 48,
        sideDimming: 85,
        showArrows: true,
        arrowSize: 48,
    },
}

// ============================================================================
// STEP 3 (RULE 9, 13, 14, 16, 17): PROPERTY CONTROLS
// ============================================================================
addPropertyControls(VoyagePerspectiveCarousel, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        enabledTitle: "Live",
        disabledTitle: "Paused",
        description: "Run smooth 3D transitions in editor.",
    },
    slides: {
        type: ControlType.Array,
        title: "Media Items",
        description: "Add images or videos with optional hover titles.",
        defaultValue: DEFAULT_SLIDES,
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    description: "Choose photo or video media.",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    description: "Photo or video poster image.",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video File",
                    allowedFileTypes: ["mp4", "webm", "mov", "ogg"],
                    hidden: (item) => item?.mediaType !== "video",
                    description: "Upload MP4 or WebM video.",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    defaultValue: "",
                    hidden: (item) => item?.mediaType !== "video",
                    description: "Or paste external video URL.",
                },
                title: {
                    type: ControlType.String,
                    title: "Hover Title",
                    defaultValue: "",
                    description: "Optional floating title on hover.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Optional click URL for this item.",
                },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                    description: "Open link in a new tab.",
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "3D Card Layout",
        description: "Card dimensions and 3D fan geometry.",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 355,
                min: 160,
                max: 480,
                step: 5,
                unit: "px",
                description: "Center card width.",
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 460,
                min: 240,
                max: 680,
                step: 5,
                unit: "px",
                description: "Center card height.",
            },
            cardSpacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 225,
                min: 100,
                max: 420,
                step: 5,
                unit: "px",
                description: "Horizontal spread between cards.",
            },
            tiltAngle: {
                type: ControlType.Number,
                title: "3D Tilt",
                defaultValue: 23,
                min: 0,
                max: 55,
                step: 1,
                unit: "deg",
                description: "Inward perspective angle of side cards.",
            },
            depthOffset: {
                type: ControlType.Number,
                title: "Z Depth",
                defaultValue: 40,
                min: 40,
                max: 300,
                step: 5,
                unit: "px",
                description: "Backward depth step per card.",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 0,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
                description: "Corner rounding of cards.",
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Hover Title Style",
        description: "Font and color for floating hover title.",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "34px",
                    variant: "Semibold",
                    letterSpacing: "1.9px",
                    lineHeight: "115%",
                },
                description: "Font for floating hover title.",
            },
            textColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "rgb(255, 255, 255)",
                description: "Color of floating hover title.",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction & Parallax",
        description: "Transition speed, floating title parallax, and autoplay.",
        controls: {
            transitionSpeed: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 2,
                min: 0.2,
                max: 2.0,
                step: 0.05,
                unit: "s",
                description: "Slide animation duration.",
            },
            hoverParallax: {
                type: ControlType.Number,
                title: "Card Tilt",
                defaultValue: 12,
                min: 0,
                max: 22,
                step: 1,
                unit: "deg",
                description: "3D card tilt on cursor hover.",
            },
            titleParallax: {
                type: ControlType.Number,
                title: "Title Float",
                defaultValue: 55,
                min: 10,
                max: 120,
                step: 5,
                unit: "px",
                description: "Strong 3D parallax shift on hover title.",
            },
            imageParallax: {
                type: ControlType.Number,
                title: "Media Shift",
                defaultValue: 18,
                min: 0,
                max: 40,
                step: 2,
                unit: "%",
                description: "Inner media parallax intensity.",
            },
            enableDrag: {
                type: ControlType.Boolean,
                title: "Drag / Swipe",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Allow dragging across cards.",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Automatically advance slides.",
            },
            autoplayInterval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 4.0,
                min: 1.5,
                max: 12.0,
                step: 0.5,
                unit: "s",
                description: "Time between autoplay slides.",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Backdrop & Arrows",
        description:
            "Optional real-time morphing backdrop, card dimming, and arrow styling.\n\nMore components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            showBackdrop: {
                type: ControlType.Boolean,
                title: "Backdrop",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                description: "Toggle blurred morphing media backdrop.",
            },
            bgBlur: {
                type: ControlType.Number,
                title: "Backdrop Blur",
                defaultValue: 80,
                min: 0,
                max: 80,
                step: 2,
                unit: "px",
                hidden: (props) => props?.showBackdrop === false,
                description: "Blur amount on background media.",
            },
            bgDarkness: {
                type: ControlType.Number,
                title: "Darken Bg",
                defaultValue: 48,
                min: 0,
                max: 95,
                step: 2,
                unit: "%",
                hidden: (props) => props?.showBackdrop === false,
                description: "Darkness of backdrop vignette.",
            },
            sideDimming: {
                type: ControlType.Number,
                title: "Side Dim",
                defaultValue: 85,
                min: 0,
                max: 85,
                step: 5,
                unit: "%",
                description: "Brightness reduction on side cards.",
            },
            showArrows: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                description: "Display left and right arrows.",
            },
            arrowSize: {
                type: ControlType.Number,
                title: "Arrow Size",
                defaultValue: 48,
                min: 28,
                max: 72,
                step: 2,
                unit: "px",
                description: "Diameter of arrow buttons.",
            },
        },
    },
})
