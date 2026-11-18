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


interface CardItemInput {
    mediaType?: "image" | "video"
    image?: string
    videoFile?: string
    videoUrl?: string
    title?: string
    link?: string
}

const DEFAULT_CARDS: CardItemInput[] = [
    { mediaType: "image", title: "Soft Strokes" },
    { mediaType: "image", title: "Altitude" },
    { mediaType: "image", title: "Tactile" },
    { mediaType: "image", title: "Pixel Drift" },
    { mediaType: "image", title: "Return Key" },
    { mediaType: "image", title: "Daylight" },
]

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT_SHADER = `
uniform sampler2D uMap;
uniform vec2 uCardSize;
uniform float uRadius;
uniform float uMediaAspect;
uniform float uOpacity;
uniform float uAa;
uniform float uHasTexture;

varying vec2 vUv;

float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
    vec2 p = (vUv - 0.5) * uCardSize;
    vec2 halfSize = uCardSize * 0.5;
    float r = clamp(uRadius, 0.0, min(halfSize.x, halfSize.y));
    float d = sdRoundedBox(p, halfSize, r);

    float mask = 1.0 - smoothstep(-uAa, uAa, d);
    if (mask <= 0.002 || uOpacity <= 0.002) discard;

    float cardAspect = uCardSize.x / max(uCardSize.y, 0.0001);
    vec2 coverUv = vUv;
    if (uMediaAspect > 0.0001) {
        if (uMediaAspect > cardAspect) {
            float scale = cardAspect / uMediaAspect;
            coverUv.x = (vUv.x - 0.5) * scale + 0.5;
        } else {
            float scale = uMediaAspect / cardAspect;
            coverUv.y = (vUv.y - 0.5) * scale + 0.5;
        }
    }

    vec4 texColor = uHasTexture > 0.5
        ? texture2D(uMap, clamp(coverUv, 0.001, 0.999))
        : vec4(0.92, 0.92, 0.90, 1.0);

    gl_FragColor = vec4(texColor.rgb, mask * uOpacity);
}
`

function createDefaultArtworkCanvas(
    index: number,
    title: string
): HTMLCanvasElement {
    const w = 740
    const h = 1000
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return canvas

    const variant = ((index % 6) + 6) % 6

    if (variant === 0) {
        // Soft Strokes
        ctx.fillStyle = "#EAE8E3"
        ctx.fillRect(0, 0, w, h)

        ctx.save()
        ctx.translate(460, 420)
        ctx.rotate(0.45)
        const tipGrad = ctx.createLinearGradient(0, -180, 0, 220)
        tipGrad.addColorStop(0, "#E7C2CF")
        tipGrad.addColorStop(0.55, "#DE7CA3")
        tipGrad.addColorStop(1, "#C5457B")
        ctx.fillStyle = tipGrad
        ctx.beginPath()
        ctx.moveTo(0, 230)
        ctx.bezierCurveTo(-85, 80, -70, -110, 0, -190)
        ctx.bezierCurveTo(70, -110, 85, 80, 0, 230)
        ctx.fill()

        ctx.fillStyle = "#242424"
        ctx.fillRect(-38, -420, 76, 240)
        ctx.fillStyle = "#8C8C8A"
        ctx.fillRect(-40, -195, 80, 26)
        ctx.restore()

        // Tiny silhouette at tip
        ctx.fillStyle = "#222222"
        ctx.beginPath()
        ctx.arc(348, 692, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(345, 697, 6, 18)
    } else if (variant === 1) {
        // Altitude
        ctx.fillStyle = "#F0EDE8"
        ctx.fillRect(0, 0, w, h)

        ctx.fillStyle = "#6F6C67"
        ctx.font = "600 24px -apple-system, BlinkMacSystemFont, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("USE YOUR IMAGINATION.", w / 2, 165)

        // Jet shadow
        ctx.save()
        ctx.translate(330, 620)
        ctx.rotate(-0.42)
        ctx.filter = "blur(10px)"
        ctx.fillStyle = "rgba(40, 38, 36, 0.45)"
        ctx.beginPath()
        ctx.moveTo(150, 0)
        ctx.lineTo(35, -24)
        ctx.lineTo(-40, -135)
        ctx.lineTo(-65, -135)
        ctx.lineTo(-42, -26)
        ctx.lineTo(-125, -20)
        ctx.lineTo(-155, -62)
        ctx.lineTo(-175, -62)
        ctx.lineTo(-152, 0)
        ctx.lineTo(-175, 62)
        ctx.lineTo(-155, 62)
        ctx.lineTo(-125, 20)
        ctx.lineTo(-42, 26)
        ctx.lineTo(-65, 135)
        ctx.lineTo(-40, 135)
        ctx.lineTo(35, 24)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Red paper airplane
        ctx.save()
        ctx.translate(390, 415)
        ctx.rotate(-0.32)
        ctx.fillStyle = "#DB4B42"
        ctx.beginPath()
        ctx.moveTo(150, 0)
        ctx.lineTo(-120, -82)
        ctx.lineTo(-75, 0)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = "#B8342C"
        ctx.beginPath()
        ctx.moveTo(150, 0)
        ctx.lineTo(-75, 0)
        ctx.lineTo(-95, 52)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = "#E76860"
        ctx.beginPath()
        ctx.moveTo(150, 0)
        ctx.lineTo(-95, 52)
        ctx.lineTo(-120, 90)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
    } else if (variant === 2) {
        // Tactile
        const bgGrad = ctx.createLinearGradient(0, 0, w, h)
        bgGrad.addColorStop(0, "#6EB2E0")
        bgGrad.addColorStop(1, "#4C8EC4")
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, w, h)

        const caps = [
            { bg: "#ECECEB", text: "go", fg: "#1C1C1C" },
            { bg: "#EC6E22", text: "create", fg: "#FFFFFF" },
            { bg: "#ECECEB", text: "potion", fg: "#1C1C1C" },
            { bg: "#89CF33", text: "✌", fg: "#FFFFFF" },
        ]
        caps.forEach((cap, idx) => {
            const cy = 140 + idx * 175
            const cx = 290
            const cw = 160
            const ch = 152

            ctx.fillStyle = "rgba(0,0,0,0.18)"
            ctx.beginPath()
            ctx.roundRect(cx + 8, cy + 12, cw, ch, 26)
            ctx.fill()

            ctx.fillStyle = cap.bg
            ctx.beginPath()
            ctx.roundRect(cx, cy, cw, ch, 26)
            ctx.fill()

            ctx.fillStyle = "rgba(255,255,255,0.32)"
            ctx.beginPath()
            ctx.roundRect(cx + 16, cy + 14, cw - 32, ch - 34, 18)
            ctx.fill()

            ctx.fillStyle = cap.fg
            ctx.font =
                idx === 3
                    ? "700 58px -apple-system, BlinkMacSystemFont, sans-serif"
                    : "600 32px -apple-system, BlinkMacSystemFont, sans-serif"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(cap.text, cx + cw / 2, cy + ch / 2 - 4)
        })
    } else if (variant === 3) {
        // Pixel Drift
        ctx.fillStyle = "#EFEFEF"
        ctx.fillRect(0, 0, w, h)

        // Green stem
        ctx.strokeStyle = "#487E36"
        ctx.lineWidth = 14
        ctx.beginPath()
        ctx.moveTo(260, 740)
        ctx.quadraticCurveTo(350, 560, 425, 360)
        ctx.stroke()

        // Petals
        ctx.save()
        ctx.translate(430, 325)
        for (let p = 0; p < 16; p++) {
            ctx.save()
            ctx.rotate((p * Math.PI * 2) / 16)
            ctx.fillStyle = p % 2 === 0 ? "#D8478B" : "#E563A1"
            ctx.beginPath()
            ctx.ellipse(0, -82, 22, 62, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        }
        ctx.fillStyle = "#F0BA3E"
        ctx.beginPath()
        ctx.arc(0, 0, 28, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Pixel drift blocks
        const pixels = [
            { x: 310, y: 170, s: 34, c: "rgba(216,71,139,0.55)" },
            { x: 350, y: 205, s: 28, c: "rgba(229,99,161,0.5)" },
            { x: 265, y: 215, s: 26, c: "rgba(216,71,139,0.35)" },
            { x: 470, y: 230, s: 32, c: "rgba(229,99,161,0.45)" },
            { x: 385, y: 450, s: 36, c: "rgba(72,126,54,0.55)" },
            { x: 430, y: 475, s: 30, c: "rgba(95,154,70,0.45)" },
            { x: 340, y: 495, s: 28, c: "rgba(72,126,54,0.4)" },
        ]
        pixels.forEach((px) => {
            ctx.fillStyle = px.c
            ctx.fillRect(px.x, px.y, px.s, px.s)
        })

        ctx.fillStyle = "#2B2B2B"
        ctx.font = "600 22px -apple-system, BlinkMacSystemFont, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("uniform experiment", w / 2, 815)
        ctx.font = "400 20px -apple-system, BlinkMacSystemFont, sans-serif"
        ctx.fillText("Yuni Yoshida", w / 2, 890)
    } else if (variant === 4) {
        // Return Key
        ctx.fillStyle = "#8C0E22"
        ctx.fillRect(0, 0, w, h)

        ctx.save()
        ctx.translate(320, 540)
        ctx.rotate(-0.78)

        // Shadow
        ctx.fillStyle = "#180407"
        ctx.beginPath()
        ctx.roundRect(-130, -90, 260, 120, 28)
        ctx.roundRect(-20, -90, 150, 260, 28)
        ctx.fill()

        // White L-shaped Enter keycap
        const keyGrad = ctx.createLinearGradient(-120, -90, 120, 170)
        keyGrad.addColorStop(0, "#FFFFFF")
        keyGrad.addColorStop(1, "#D4D4D2")
        ctx.fillStyle = keyGrad
        ctx.beginPath()
        ctx.roundRect(-122, -98, 256, 120, 26)
        ctx.roundRect(-12, -98, 146, 256, 26)
        ctx.fill()

        ctx.fillStyle = "#222222"
        ctx.font = "500 34px -apple-system, BlinkMacSystemFont, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Enter", 0, -28)
        ctx.restore()

        // Bullet trail top right
        ctx.save()
        ctx.translate(530, 240)
        ctx.rotate(-0.78)
        const trail = ctx.createLinearGradient(-160, 0, 80, 0)
        trail.addColorStop(0, "rgba(255,255,255,0)")
        trail.addColorStop(1, "rgba(20,20,20,0.85)")
        ctx.fillStyle = trail
        ctx.fillRect(-160, -10, 220, 20)
        ctx.fillStyle = "#151515"
        ctx.beginPath()
        ctx.ellipse(70, 0, 32, 16, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    } else {
        // Daylight
        ctx.fillStyle = "#5B6973"
        ctx.fillRect(0, 0, w, h)

        // Warm diagonal light beam
        ctx.save()
        const beamGrad = ctx.createLinearGradient(w, 0, 120, h * 0.85)
        beamGrad.addColorStop(0, "#ECEAE4")
        beamGrad.addColorStop(0.65, "#CFCBC4")
        beamGrad.addColorStop(1, "rgba(91,105,115,0)")
        ctx.fillStyle = beamGrad
        ctx.beginPath()
        ctx.moveTo(w, 0)
        ctx.lineTo(w, 420)
        ctx.lineTo(140, 840)
        ctx.lineTo(75, 750)
        ctx.lineTo(420, 0)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        ctx.fillStyle = "rgba(35,40,45,0.45)"
        ctx.beginPath()
        ctx.ellipse(390, 390, 14, 42, 0.35, 0, Math.PI * 2)
        ctx.fill()
    }

    // Fallback label watermark only if custom title doesn't match default
    void title
    return canvas
}

function normalizeItems(
    rawItems: CardItemInput[] | undefined
): CardItemInput[] {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        return DEFAULT_CARDS
    }
    return rawItems.map((item, idx) => ({
        mediaType: item?.mediaType === "video" ? "video" : "image",
        image: typeof item?.image === "string" ? item.image : "",
        videoFile: typeof item?.videoFile === "string" ? item.videoFile : "",
        videoUrl: typeof item?.videoUrl === "string" ? item.videoUrl : "",
        title: typeof item?.title === "string" ? item.title : `Card ${idx + 1}`,
        link: typeof item?.link === "string" ? item.link : "",
    }))
}

interface CardSlotRuntime {
    group: THREE.Group
    cardMesh: THREE.Mesh
    cardMaterial: THREE.ShaderMaterial
    mediaTexture: THREE.Texture
    videoEl: HTMLVideoElement | null
    itemIndex: number
    link: string
    isVideo: boolean
}

/**
 * @framerDisableUnlink
 */
export default function CurvedCarousel3D(incomingProps: any) {
    // STEP 1: Intercept & Flatten grouped props
    const props = {
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.appearance || {}),
        ...(incomingProps.interaction || {}),
    }

    const {
        livePreview: _lp,
        ariaLabel: _al,
        items: _it,
        layout: _ly,
        appearance: _ap,
        interaction: _in,
        style: incomingStyle,
        ...restDomProps
    } = incomingProps

    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.livePreview ?? true)

    const mountRef = useRef<HTMLDivElement | null>(null)
    const a11yLiveRegionRef = useRef<HTMLDivElement | null>(null)
    const isIntersectingRef = useRef<boolean>(true)
    const renderNowRef = useRef<(() => void) | null>(null)
    const scrollStateRef = useRef<{
        current: number
        target: number
        initialized: boolean
    }>({
        current: props.initialIndex ?? 4,
        target: props.initialIndex ?? 4,
        initialized: false,
    })

    const normalizedItems = normalizeItems(props.items)
    const itemsKey = JSON.stringify(normalizedItems)

    // Live mutable ref for smooth real-time slider updates without WebGL rebuilds
    const liveConfigRef = useRef({
        cardScale: props.cardScale ?? 100,
        cardAspect: props.cardAspect ?? 0.74,
        spacing: props.spacing ?? 100,
        curveDepth: props.curveDepth ?? 100,
        tiltAngle: props.tiltAngle ?? 28,
        visibleRange: props.visibleRange ?? 2.6,
        borderRadius: props.borderRadius ?? 7,
        loop: props.loop ?? true,
        snapToCard: props.snapToCard ?? true,
        dragSensitivity: props.dragSensitivity ?? 100,
        damping: props.damping ?? 10,
        autoPlaySpeed: props.autoPlaySpeed ?? 0,
        wheelNavigation: props.wheelNavigation ?? false,
        shouldAnimate,
        itemCount: normalizedItems.length,
    })

    liveConfigRef.current = {
        cardScale: props.cardScale ?? 100,
        cardAspect: props.cardAspect ?? 0.74,
        spacing: props.spacing ?? 100,
        curveDepth: props.curveDepth ?? 100,
        tiltAngle: props.tiltAngle ?? 28,
        visibleRange: props.visibleRange ?? 2.6,
        borderRadius: props.borderRadius ?? 7,
        loop: props.loop ?? true,
        snapToCard: props.snapToCard ?? true,
        dragSensitivity: props.dragSensitivity ?? 100,
        damping: props.damping ?? 10,
        autoPlaySpeed: props.autoPlaySpeed ?? 0,
        wheelNavigation: props.wheelNavigation ?? false,
        shouldAnimate,
        itemCount: normalizedItems.length,
    }

    const initialIndex = props.initialIndex ?? 4

    // Update scroll starting index if initialIndex changes in editor
    useEffect(() => {
        const count = normalizedItems.length
        const clamped =
            count > 0 ? Math.max(0, Math.min(count - 1, initialIndex)) : 0
        if (!scrollStateRef.current.initialized) {
            scrollStateRef.current.current = clamped
            scrollStateRef.current.target = clamped
            scrollStateRef.current.initialized = true
        } else if (!shouldAnimate) {
            scrollStateRef.current.current = clamped
            scrollStateRef.current.target = clamped
        }
        renderNowRef.current?.()
    }, [initialIndex, itemsKey, shouldAnimate])

    // Push manual frame when continuous sliders change in static/paused mode
    useEffect(() => {
        if (!shouldAnimate) {
            renderNowRef.current?.()
        }
    }, [
        props.cardScale,
        props.cardAspect,
        props.spacing,
        props.curveDepth,
        props.tiltAngle,
        props.visibleRange,
        props.borderRadius,
        props.loop,
        shouldAnimate,
    ])

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        let frameId = 0
        let isDisposed = false
        let resizeObserver: ResizeObserver | null = null
        let intersectionObserver: IntersectionObserver | null = null
        let lastAnnouncedIndex = -1

        const geometriesToDispose: THREE.BufferGeometry[] = []
        const materialsToDispose: THREE.Material[] = []
        const texturesToDispose: THREE.Texture[] = []
        const videosToCleanup: HTMLVideoElement[] = []
        const slots: CardSlotRuntime[] = []

        const initWidth = Math.max(container.clientWidth, 100)
        const initHeight = Math.max(container.clientHeight, 100)

        const scene = new THREE.Scene()

        const camera = new THREE.PerspectiveCamera(
            48,
            initWidth / initHeight,
            0.1,
            100
        )
        const baseCamDist = 7.4
        const updateCameraDistance = (w: number, h: number) => {
            const aspect = w / Math.max(h, 1)
            const responsivePullback =
                aspect < 1.05 ? 1.05 / Math.max(aspect, 0.45) : 1
            camera.position.set(
                0,
                0,
                baseCamDist * Math.min(responsivePullback, 1.9)
            )
            camera.aspect = aspect
            camera.updateProjectionMatrix()
        }
        updateCameraDistance(initWidth, initHeight)

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(initWidth, initHeight)
        renderer.domElement.style.display = "block"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        container.appendChild(renderer.domElement)

        const maxAnisotropy = Math.min(
            renderer.capabilities.getMaxAnisotropy(),
            8
        )

        const cardGeometry = new THREE.PlaneGeometry(1, 1, 1, 1)
        geometriesToDispose.push(cardGeometry)

        const rawCount = normalizedItems.length
        const minLoopSlots =
            liveConfigRef.current.loop && rawCount > 0 && rawCount < 7
                ? Math.ceil(7 / rawCount) * rawCount
                : rawCount

        const mediaCache = new Map<
            number,
            {
                texture: THREE.Texture
                aspect: number
                videoEl: HTMLVideoElement | null
                onAspectCallbacks: Array<(asp: number) => void>
                onFallbackCallbacks: Array<
                    (tex: THREE.Texture, asp: number) => void
                >
            }
        >()

        const getOrCreateMedia = (itemIndex: number) => {
            const existing = mediaCache.get(itemIndex)
            if (existing) return existing

            const item = normalizedItems[itemIndex]
            const isVideo = item.mediaType === "video"
            const videoSrc = (item.videoFile || item.videoUrl || "").trim()
            const imageSrc = (item.image || "").trim()

            const entry: {
                texture: THREE.Texture
                aspect: number
                videoEl: HTMLVideoElement | null
                onAspectCallbacks: Array<(asp: number) => void>
                onFallbackCallbacks: Array<
                    (tex: THREE.Texture, asp: number) => void
                >
            } = {
                texture: new THREE.Texture(),
                aspect: 0.74,
                videoEl: null,
                onAspectCallbacks: [],
                onFallbackCallbacks: [],
            }

            if (isVideo && videoSrc) {
                const video = document.createElement("video")
                video.crossOrigin = "anonymous"
                video.loop = true
                video.muted = true
                video.playsInline = true
                video.setAttribute("playsinline", "")
                video.setAttribute("webkit-playsinline", "")
                video.autoplay = true
                video.preload = "auto"

                video.onerror = () => {
                    if (isDisposed) return
                    console.warn(
                        `[CurvedCarousel3D] Failed to load video: ${videoSrc}`
                    )
                    const fbCanvas = createDefaultArtworkCanvas(
                        itemIndex,
                        item.title || ""
                    )
                    const fbTex = new THREE.CanvasTexture(fbCanvas)
                    fbTex.minFilter = THREE.LinearMipmapLinearFilter
                    fbTex.magFilter = THREE.LinearFilter
                    fbTex.anisotropy = maxAnisotropy
                    texturesToDispose.push(fbTex)

                    entry.aspect = fbCanvas.width / fbCanvas.height
                    entry.texture = fbTex
                    entry.videoEl = null

                    entry.onAspectCallbacks.forEach((cb) => cb(entry.aspect))
                    entry.onFallbackCallbacks.forEach((cb) =>
                        cb(fbTex, entry.aspect)
                    )
                    if (!liveConfigRef.current.shouldAnimate) renderFrame()
                }

                video.src = videoSrc

                const vTex = new THREE.VideoTexture(video)
                vTex.minFilter = THREE.LinearFilter
                vTex.magFilter = THREE.LinearFilter
                vTex.generateMipmaps = false

                entry.texture = vTex
                entry.videoEl = video
                texturesToDispose.push(vTex)
                videosToCleanup.push(video)

                const handleMeta = () => {
                    if (isDisposed) return
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                        entry.aspect = video.videoWidth / video.videoHeight
                        entry.onAspectCallbacks.forEach((cb) =>
                            cb(entry.aspect)
                        )
                    }
                    if (!liveConfigRef.current.shouldAnimate) {
                        vTex.needsUpdate = true
                        renderFrame()
                    }
                }
                video.addEventListener("loadedmetadata", handleMeta)
                video.addEventListener("loadeddata", handleMeta)
                video.play().catch(() => {})
            } else if (!isVideo && imageSrc) {
                const fallbackCanvas = createDefaultArtworkCanvas(
                    itemIndex,
                    item.title || ""
                )
                const tex = new THREE.Texture(fallbackCanvas)
                tex.minFilter = THREE.LinearMipmapLinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.anisotropy = maxAnisotropy
                tex.needsUpdate = true
                entry.texture = tex
                texturesToDispose.push(tex)

                const img = new Image()
                img.crossOrigin = "anonymous"
                img.onerror = () => {
                    if (isDisposed) return
                    console.warn(
                        `[CurvedCarousel3D] Failed to load image: ${imageSrc}`
                    )
                    const fbCanvas = createDefaultArtworkCanvas(
                        itemIndex,
                        item.title || ""
                    )
                    tex.image = fbCanvas
                    tex.needsUpdate = true
                    entry.aspect = fbCanvas.width / fbCanvas.height
                    entry.onAspectCallbacks.forEach((cb) => cb(entry.aspect))
                    if (!liveConfigRef.current.shouldAnimate) renderFrame()
                }
                img.onload = () => {
                    if (isDisposed) return
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        entry.aspect = img.naturalWidth / img.naturalHeight
                        entry.onAspectCallbacks.forEach((cb) =>
                            cb(entry.aspect)
                        )
                    }
                    tex.image = img
                    tex.needsUpdate = true
                    if (!liveConfigRef.current.shouldAnimate) {
                        renderFrame()
                    }
                }
                img.src = imageSrc
            } else {
                const artCanvas = createDefaultArtworkCanvas(
                    itemIndex,
                    item.title || ""
                )
                const tex = new THREE.CanvasTexture(artCanvas)
                tex.minFilter = THREE.LinearMipmapLinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.anisotropy = maxAnisotropy
                tex.needsUpdate = true
                entry.texture = tex
                entry.aspect = artCanvas.width / artCanvas.height
                texturesToDispose.push(tex)
            }

            mediaCache.set(itemIndex, entry)
            return entry
        }

        for (let s = 0; s < minLoopSlots; s++) {
            const itemIndex = s % rawCount
            const item = normalizedItems[itemIndex]
            const mediaEntry = getOrCreateMedia(itemIndex)

            const group = new THREE.Group()

            const cardMaterial = new THREE.ShaderMaterial({
                vertexShader: VERTEX_SHADER,
                fragmentShader: FRAGMENT_SHADER,
                transparent: true,
                depthTest: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                uniforms: {
                    uMap: { value: mediaEntry.texture },
                    uCardSize: { value: new THREE.Vector2(2.22, 3.0) },
                    uRadius: { value: 0.21 },
                    uMediaAspect: { value: mediaEntry.aspect },
                    uOpacity: { value: 1.0 },
                    uAa: { value: 0.008 },
                    uHasTexture: { value: 1.0 },
                },
            })
            materialsToDispose.push(cardMaterial)

            mediaEntry.onAspectCallbacks.push((asp) => {
                cardMaterial.uniforms.uMediaAspect.value = asp
            })

            const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial)
            cardMesh.userData = { slotIndex: s }
            group.add(cardMesh)
            scene.add(group)

            const slotObj: CardSlotRuntime = {
                group,
                cardMesh,
                cardMaterial,
                mediaTexture: mediaEntry.texture,
                videoEl: mediaEntry.videoEl,
                itemIndex,
                link: item.link || "",
                isVideo: item.mediaType === "video",
            }

            mediaEntry.onFallbackCallbacks.push((newTex, newAspect) => {
                cardMaterial.uniforms.uMap.value = newTex
                cardMaterial.uniforms.uMediaAspect.value = newAspect
                slotObj.videoEl = null
            })

            slots.push(slotObj)
        }

        const raycaster = new THREE.Raycaster()
        const pointerNdc = new THREE.Vector2()
        let isDragging = false
        let hasDragged = false
        let pointerDownX = 0
        let lastPointerX = 0
        let dragVelocity = 0
        let lastMoveTime = performance.now()
        let lastFrameTime = performance.now()

        const smoothstep = (edge0: number, edge1: number, x: number) => {
            const t = Math.max(
                0,
                Math.min(1, (x - edge0) / Math.max(edge1 - edge0, 0.0001))
            )
            return t * t * (3 - 2 * t)
        }

        const getWrappedOffset = (
            slotIndex: number,
            scrollPos: number,
            total: number,
            isLoop: boolean
        ) => {
            if (!isLoop || total <= 0) {
                return slotIndex - scrollPos
            }
            const half = total * 0.5
            let diff = (slotIndex - scrollPos) % total
            if (diff < -half) diff += total
            if (diff > half) diff -= total
            diff =
                ((((slotIndex - scrollPos) % total) + total + half) % total) -
                half
            return diff
        }

        const getWrappedIndex = (
            target: number,
            total: number,
            isLoop: boolean
        ) => {
            if (total <= 0) return 0
            if (!isLoop) return Math.max(0, Math.min(total - 1, target))
            return ((target % total) + total) % total
        }

        const renderFrame = () => {
            if (isDisposed) return
            const cfg = liveConfigRef.current
            const totalSlots = slots.length
            if (totalSlots === 0) return

            const cardH = 3.0 * (cfg.cardScale / 100)
            const cardW = cardH * Math.max(0.25, cfg.cardAspect)
            const cornerR = (cfg.borderRadius / 100) * Math.min(cardW, cardH)
            const spacingFactor = cfg.spacing / 100
            const depthFactor = cfg.curveDepth / 100
            const tiltRad = (cfg.tiltAngle * Math.PI) / 180
            const visRange = Math.max(1, cfg.visibleRange)
            const containerH = Math.max(container.clientHeight, 100)
            const aaWorld = Math.max(0.004, (1.4 * cardH) / (containerH * 0.45))

            const scrollPos = scrollStateRef.current.current

            for (let i = 0; i < totalSlots; i++) {
                const slot = slots[i]
                const offset = getWrappedOffset(
                    i,
                    scrollPos,
                    totalSlots,
                    cfg.loop
                )
                const absOffset = Math.abs(offset)

                const isVisible = absOffset <= visRange + 0.35
                slot.group.visible = isVisible

                if (
                    slot.videoEl &&
                    cfg.shouldAnimate &&
                    isIntersectingRef.current
                ) {
                    if (isVisible && slot.videoEl.paused) {
                        slot.videoEl.play().catch(() => {})
                    } else if (!isVisible && !slot.videoEl.paused) {
                        slot.videoEl.pause()
                    }
                }

                if (!isVisible) continue

                const x =
                    Math.sin(offset * 0.28) *
                    8.4 *
                    spacingFactor *
                    (cfg.cardScale / 100)
                const z = -Math.pow(absOffset, 1.55) * 1.25 * depthFactor
                const y = 0
                const depthScale = 1 / (1 + 0.055 * absOffset)

                slot.group.position.set(x, y, z)
                slot.group.rotation.set(0, offset * tiltRad, 0)
                slot.group.scale.setScalar(depthScale)

                const fadeStart = Math.max(0.8, visRange - 1.15)
                const opacity =
                    1 - smoothstep(fadeStart, visRange + 0.1, absOffset)

                slot.cardMesh.scale.set(cardW, cardH, 1)
                slot.cardMaterial.uniforms.uCardSize.value.set(cardW, cardH)
                slot.cardMaterial.uniforms.uRadius.value = cornerR
                slot.cardMaterial.uniforms.uOpacity.value = opacity
                slot.cardMaterial.uniforms.uAa.value = aaWorld

                const baseOrder = Math.round(1000 - absOffset * 100)
                slot.cardMesh.renderOrder = baseOrder
            }

            renderer.render(scene, camera)

            const wrappedIdx = getWrappedIndex(
                Math.round(scrollPos),
                rawCount,
                cfg.loop
            )
            if (wrappedIdx !== lastAnnouncedIndex && rawCount > 0) {
                lastAnnouncedIndex = wrappedIdx
                if (a11yLiveRegionRef.current) {
                    const it = normalizedItems[wrappedIdx]
                    a11yLiveRegionRef.current.textContent = `Showing item ${wrappedIdx + 1} of ${rawCount}: ${it.title || "Untitled"}`
                }
            }
        }

        renderNowRef.current = () => {
            if (!liveConfigRef.current.shouldAnimate) {
                scrollStateRef.current.current = scrollStateRef.current.target
            }
            renderFrame()
        }

        const stepLoop = (now: number) => {
            if (isDisposed) return
            if (
                !liveConfigRef.current.shouldAnimate ||
                !isIntersectingRef.current
            ) {
                frameId = 0
                return
            }

            const dt = Math.min((now - lastFrameTime) / 1000, 0.05)
            lastFrameTime = now

            const cfg = liveConfigRef.current
            const state = scrollStateRef.current

            if (!isDragging && cfg.autoPlaySpeed > 0) {
                state.target += cfg.autoPlaySpeed * dt * 0.65
            }

            if (!cfg.loop && cfg.itemCount > 0) {
                state.target = Math.max(
                    0,
                    Math.min(cfg.itemCount - 1, state.target)
                )
            }

            const lerpFactor = 1 - Math.exp(-cfg.damping * dt)
            state.current += (state.target - state.current) * lerpFactor

            if (Math.abs(state.target - state.current) < 0.0002) {
                state.current = state.target
            }

            renderFrame()
            frameId = requestAnimationFrame(stepLoop)
        }

        const startLoop = () => {
            if (isDisposed || frameId !== 0) return
            if (
                liveConfigRef.current.shouldAnimate &&
                isIntersectingRef.current
            ) {
                lastFrameTime = performance.now()
                frameId = requestAnimationFrame(stepLoop)
            }
        }

        const stopLoop = () => {
            if (frameId !== 0) {
                cancelAnimationFrame(frameId)
                frameId = 0
            }
        }

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return
            isDragging = true
            hasDragged = false
            pointerDownX = e.clientX
            lastPointerX = e.clientX
            dragVelocity = 0
            lastMoveTime = performance.now()
            container.style.cursor = "grabbing"
            try {
                container.setPointerCapture(e.pointerId)
            } catch {
                // Ignore
            }

            slots.forEach((s) => {
                if (s.videoEl && s.group.visible && s.videoEl.paused) {
                    s.videoEl.play().catch(() => {})
                }
            })
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!isDragging) return
            const now = performance.now()
            const dx = e.clientX - lastPointerX
            const totalDx = Math.abs(e.clientX - pointerDownX)
            if (totalDx > 4) {
                hasDragged = true
            }

            const w = Math.max(container.clientWidth, 100)
            const sens = (liveConfigRef.current.dragSensitivity / 100) * 3.4
            const deltaIndex = -(dx / w) * sens

            scrollStateRef.current.target += deltaIndex
            if (!liveConfigRef.current.shouldAnimate) {
                scrollStateRef.current.current = scrollStateRef.current.target
                renderFrame()
            }

            const dt = Math.max(now - lastMoveTime, 8)
            dragVelocity = (deltaIndex / dt) * 16.67
            lastPointerX = e.clientX
            lastMoveTime = now
        }

        const onPointerUp = (e: PointerEvent) => {
            if (!isDragging) return
            isDragging = false
            container.style.cursor = "grab"
            try {
                if (container.hasPointerCapture(e.pointerId)) {
                    container.releasePointerCapture(e.pointerId)
                }
            } catch {
                // Ignore
            }

            const cfg = liveConfigRef.current
            if (hasDragged) {
                const momentum = Math.max(
                    -2.5,
                    Math.min(2.5, dragVelocity * 7.5)
                )
                scrollStateRef.current.target += momentum
                if (cfg.snapToCard) {
                    scrollStateRef.current.target = Math.round(
                        scrollStateRef.current.target
                    )
                }
                if (!cfg.loop && cfg.itemCount > 0) {
                    scrollStateRef.current.target = Math.max(
                        0,
                        Math.min(
                            cfg.itemCount - 1,
                            scrollStateRef.current.target
                        )
                    )
                }
            } else {
                const rect = container.getBoundingClientRect()
                pointerNdc.x =
                    ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1
                pointerNdc.y =
                    -((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1
                raycaster.setFromCamera(pointerNdc, camera)

                const visibleMeshes = slots
                    .filter((s) => s.group.visible)
                    .map((s) => s.cardMesh)
                const hits = raycaster.intersectObjects(visibleMeshes, false)
                if (hits.length > 0) {
                    const hitSlotIdx = hits[0].object.userData?.slotIndex
                    if (typeof hitSlotIdx === "number") {
                        const offset = getWrappedOffset(
                            hitSlotIdx,
                            scrollStateRef.current.current,
                            slots.length,
                            cfg.loop
                        )
                        if (Math.abs(offset) > 0.25) {
                            scrollStateRef.current.target = Math.round(
                                scrollStateRef.current.current + offset
                            )
                        } else {
                            const linkUrl = slots[hitSlotIdx]?.link?.trim()
                            if (linkUrl) {
                                window.open(
                                    linkUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                )
                            }
                        }
                    }
                }
            }

            if (!cfg.shouldAnimate) {
                scrollStateRef.current.current = scrollStateRef.current.target
                renderFrame()
            }
        }

        let wheelSnapTimer: ReturnType<typeof setTimeout> | null = null
        const onWheel = (e: WheelEvent) => {
            const cfg = liveConfigRef.current
            if (!cfg.wheelNavigation) return
            e.preventDefault()

            const delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            scrollStateRef.current.target +=
                delta * 0.0022 * (cfg.dragSensitivity / 100)

            if (!cfg.loop && cfg.itemCount > 0) {
                scrollStateRef.current.target = Math.max(
                    0,
                    Math.min(cfg.itemCount - 1, scrollStateRef.current.target)
                )
            }

            if (cfg.snapToCard) {
                if (wheelSnapTimer) clearTimeout(wheelSnapTimer)
                wheelSnapTimer = setTimeout(() => {
                    if (isDisposed) return
                    scrollStateRef.current.target = Math.round(
                        scrollStateRef.current.target
                    )
                    if (!liveConfigRef.current.shouldAnimate) {
                        scrollStateRef.current.current =
                            scrollStateRef.current.target
                        renderFrame()
                    }
                }, 140)
            }

            if (!cfg.shouldAnimate) {
                scrollStateRef.current.current = scrollStateRef.current.target
                renderFrame()
            }
        }

        const onKeyDown = (e: KeyboardEvent) => {
            const cfg = liveConfigRef.current
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                scrollStateRef.current.target =
                    Math.round(scrollStateRef.current.target) - 1
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                scrollStateRef.current.target =
                    Math.round(scrollStateRef.current.target) + 1
            } else {
                return
            }
            if (!cfg.loop && cfg.itemCount > 0) {
                scrollStateRef.current.target = Math.max(
                    0,
                    Math.min(cfg.itemCount - 1, scrollStateRef.current.target)
                )
            }
            if (!cfg.shouldAnimate) {
                scrollStateRef.current.current = scrollStateRef.current.target
                renderFrame()
            }
        }

        container.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        window.addEventListener("pointercancel", onPointerUp)
        container.addEventListener("wheel", onWheel, { passive: false })
        container.addEventListener("keydown", onKeyDown)

        resizeObserver = new ResizeObserver((entries) => {
            if (isDisposed) return
            for (const entry of entries) {
                const width = Math.max(entry.contentRect.width, 100)
                const height = Math.max(entry.contentRect.height, 100)
                updateCameraDistance(width, height)
                renderer.setPixelRatio(
                    Math.min(window.devicePixelRatio || 1, 2)
                )
                renderer.setSize(width, height)
                renderFrame()
            }
        })
        resizeObserver.observe(container)

        intersectionObserver = new IntersectionObserver(
            (entries) => {
                if (isDisposed) return
                const entry = entries[0]
                const visible = Boolean(entry && entry.isIntersecting)
                isIntersectingRef.current = visible

                if (visible) {
                    slots.forEach((s) => {
                        if (s.videoEl && s.group.visible) {
                            s.videoEl.play().catch(() => {})
                        }
                    })
                    if (liveConfigRef.current.shouldAnimate) {
                        startLoop()
                    } else {
                        renderFrame()
                    }
                } else {
                    stopLoop()
                    slots.forEach((s) => {
                        if (s.videoEl && !s.videoEl.paused) {
                            s.videoEl.pause()
                        }
                    })
                }
            },
            { threshold: 0.02 }
        )
        intersectionObserver.observe(container)

        if (!liveConfigRef.current.shouldAnimate) {
            scrollStateRef.current.current = scrollStateRef.current.target
            renderFrame()
        } else {
            renderFrame()
            startLoop()
        }

        return () => {
            isDisposed = true
            renderNowRef.current = null
            stopLoop()

            if (wheelSnapTimer) clearTimeout(wheelSnapTimer)

            container.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("pointercancel", onPointerUp)
            container.removeEventListener("wheel", onWheel)
            container.removeEventListener("keydown", onKeyDown)

            if (resizeObserver) {
                resizeObserver.disconnect()
                resizeObserver = null
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect()
                intersectionObserver = null
            }

            videosToCleanup.forEach((video) => {
                try {
                    video.pause()
                    video.removeAttribute("src")
                    video.load()
                } catch {
                    // Ignore
                }
            })

            geometriesToDispose.forEach((g) => g.dispose())
            materialsToDispose.forEach((m) => m.dispose())
            texturesToDispose.forEach((t) => t.dispose())

            scene.clear()

            renderer.forceContextLoss()
            renderer.dispose()

            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [itemsKey, shouldAnimate])

    return (
        <div
            {...restDomProps}
            ref={mountRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={props.ariaLabel || "Curved 3D Carousel"}
            aria-keyshortcuts="ArrowLeft ArrowRight"
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "pan-y",
                cursor: "grab",
                ...incomingStyle,
            }}
        >
            <div
                ref={a11yLiveRegionRef}
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            />
        </div>
    )
}

// STEP 2: Nested Default Props matching property group structure
CurvedCarousel3D.defaultProps = {
    livePreview: true,
    ariaLabel: "Curved 3D Carousel",
    items: DEFAULT_CARDS,
    layout: {
        cardScale: 100,
        cardAspect: 0.74,
        spacing: 100,
        curveDepth: 100,
        tiltAngle: 28,
        visibleRange: 2.6,
    },
    appearance: {
        borderRadius: 7,
    },
    interaction: {
        loop: true,
        snapToCard: true,
        dragSensitivity: 100,
        damping: 10,
        autoPlaySpeed: 0,
        wheelNavigation: false,
        initialIndex: 4,
    },
}

// STEP 3: Property Controls with Live Preview first, grouped sections, units, short descriptions, and bottom credit
addPropertyControls(CurvedCarousel3D, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate carousel inside Framer editor",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Accessible Name",
        defaultValue: "Curved 3D Carousel",
        description: "Screen reader announcement for the carousel.",
    },
    items: {
        type: ControlType.Array,
        title: "Cards",
        description: "Add as many images or videos as needed",
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (item) => item.mediaType === "video",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video File",
                    allowedFileTypes: ["mp4", "webm", "mov", "m4v"],
                    hidden: (item) => item.mediaType !== "video",
                    description: "Upload MP4 or WebM video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://...mp4",
                    hidden: (item) => item.mediaType !== "video",
                    description: "Or paste direct video link",
                },
                title: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Card Title",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    placeholder: "https://...",
                    description: "Optional URL when center card is clicked",
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardScale: {
                type: ControlType.Number,
                title: "Card Size",
                min: 50,
                max: 150,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Overall size of all cards",
            },
            cardAspect: {
                type: ControlType.Number,
                title: "Aspect Ratio",
                min: 0.4,
                max: 1.8,
                step: 0.02,
                unit: ":1",
                defaultValue: 0.74,
                description: "Card width relative to height",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                min: 50,
                max: 180,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Horizontal gap between cards",
            },
            curveDepth: {
                type: ControlType.Number,
                title: "Arc Depth",
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                defaultValue: 100,
                description: "3D depth curvature of carousel",
            },
            tiltAngle: {
                type: ControlType.Number,
                title: "Side Tilt",
                min: 0,
                max: 55,
                step: 1,
                unit: "°",
                defaultValue: 28,
                description: "Rotation angle per card step",
            },
            visibleRange: {
                type: ControlType.Number,
                title: "Visible Range",
                min: 1,
                max: 5,
                step: 0.5,
                unit: "cards",
                defaultValue: 2.6,
                description: "Cards faded in on each side",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            borderRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 30,
                step: 0.5,
                unit: "%",
                defaultValue: 7,
                description: "Roundness of card corners",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        description:
            "More components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            loop: {
                type: ControlType.Boolean,
                title: "Infinite Loop",
                defaultValue: true,
                description: "Wrap cards seamlessly around arc",
            },
            snapToCard: {
                type: ControlType.Boolean,
                title: "Snap to Card",
                defaultValue: true,
                description: "Center nearest card after dragging",
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Drag Speed",
                min: 30,
                max: 250,
                step: 5,
                unit: "%",
                defaultValue: 100,
                description: "How fast dragging spins cards",
            },
            damping: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 2,
                max: 25,
                step: 1,
                unit: "x",
                defaultValue: 10,
                description: "Spring damping speed",
            },
            autoPlaySpeed: {
                type: ControlType.Number,
                title: "Auto Drift",
                min: 0,
                max: 2,
                step: 0.05,
                unit: "x",
                defaultValue: 0,
                description: "Continuous automatic scroll speed",
            },
            wheelNavigation: {
                type: ControlType.Boolean,
                title: "Mouse Wheel",
                defaultValue: false,
                description: "Scroll cards using mouse wheel",
            },
            initialIndex: {
                type: ControlType.Number,
                title: "Start Card",
                min: 0,
                max: 50,
                step: 1,
                unit: "#",
                defaultValue: 4,
                description: "Initial centered card index",
            },
        },
    },
})
