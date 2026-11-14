import * as React from "react"
import { useRef, useEffect, useMemo, useState } from "react"
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


/** Vibrant Gradient Carousel — standalone Framer code component. */
type MediaItem = {
    title?: string
    type?: "image" | "video"
    image?: string | { src: string; srcSet?: string; alt?: string }
    video?: string
    poster?: string | { src: string }
    fit?: "cover" | "contain"
}
type Props = {
    livePreview?: boolean
    editorPreview?: boolean
    items?: MediaItem[]
    layout?: Partial<typeof DEFAULTS.layout>
    styling?: Partial<typeof DEFAULTS.styling>
    motion?: Partial<typeof DEFAULTS.motion>
    media?: Partial<typeof DEFAULTS.media>
    accessibility?: Partial<typeof DEFAULTS.accessibility>
    style?: React.CSSProperties
    className?: string
    id?: string
}
const DEFAULT_ITEMS: MediaItem[] = [
    { title: "Model accuracy · 95%", type: "image" },
    { title: "Image generation · 720", type: "image" },
    { title: "Power consumption · 25%", type: "image" },
    { title: "Image engine · 2.0", type: "image" },
]
const DEFAULTS = {
    livePreview: true,
    items: DEFAULT_ITEMS,
    layout: {
        cardWidth: 400,
        cardHeight: 460,
        spacing: 647,
        radius: 12,
        tilt: 0,
    },
    styling: {
        bend: 88,
        glow: 70,
        grain: 18,
        pixelRatio: 150,
    },
    motion: {
        autoplay: true,
        duration: 1.45,
        delay: 2.3,
        step: 2,
        drag: true,
        pauseOnHover: true,
    },
    media: {
        uploads: false,
        navigation: false,
        videoPlayback: true,
        resolution: 1024,
    },
    accessibility: { reducedMotion: true },
}
const srcOf = (value: MediaItem["image"]) =>
    typeof value === "string" ? value : value?.src || ""
const wrap = (i: number, n: number) => ((i % n) + n) % n
const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** Procedural default cards. Call in a browser effect; no external fonts or assets. */
function makeArtwork(index: number, quality: number = 1): HTMLCanvasElement {
    const scale = Math.max(
        0.25,
        Math.min(2, Number.isFinite(quality) ? quality : 1)
    )
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(768 * scale)
    canvas.height = Math.round(984 * scale)
    const ctx = canvas.getContext("2d", { alpha: false })!
    ctx.scale(canvas.width / 768, canvas.height / 984)
    const kind = ((Math.floor(index) % 4) + 4) % 4
    const W = 768,
        H = 984

    const blob = (
        x: number,
        y: number,
        rx: number,
        ry: number,
        color: string,
        opacity: number = 1
    ) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(rx, ry)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
        gradient.addColorStop(0, color)
        gradient.addColorStop(0.3, color)
        gradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.globalAlpha = opacity
        ctx.fillStyle = gradient
        ctx.fillRect(-1, -1, 2, 2)
        ctx.restore()
    }
    const line = (points: number[], color: string, width: number = 1) => {
        ctx.beginPath()
        for (let p = 0; p < points.length; p += 2) {
            if (p === 0) ctx.moveTo(points[p], points[p + 1])
            else ctx.lineTo(points[p], points[p + 1])
        }
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.stroke()
    }
    const label = (
        text: string,
        x: number,
        y: number,
        alpha: number = 0.72,
        size: number = 24
    ) => {
        ctx.save()
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.font = `400 ${size}px 'Helvetica Neue', Arial, sans-serif`
        ctx.fillText(text, x, y)
        ctx.restore()
    }
    const metric = (
        text: string,
        x: number,
        y: number,
        color: string,
        size: number = 210,
        glow: string = "rgba(0,0,0,0)"
    ) => {
        ctx.save()
        ctx.font = `200 ${size}px 'Segoe UI Light', 'Helvetica Neue', Arial, sans-serif`
        ctx.fillStyle = color
        ctx.shadowColor = glow
        ctx.shadowBlur = 13
        ctx.fillText(text, x, y)
        ctx.restore()
    }
    const dot = (x: number, y: number, radius: number, fill: string) => {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = fill
        ctx.fill()
    }

    if (kind === 0) {
        const base = ctx.createLinearGradient(0, 0, 0, H)
        base.addColorStop(0, "#ef6555")
        base.addColorStop(0.22, "#a1ad28")
        base.addColorStop(0.62, "#3f8c1f")
        base.addColorStop(1, "#ef516b")
        ctx.fillStyle = base
        ctx.fillRect(0, 0, W, H)
        ctx.globalCompositeOperation = "screen"
        blob(513, 134, 335, 339, "#ffe946", 0.96)
        blob(163, 262, 280, 375, "#a3d636", 0.65)
        blob(584, 696, 358, 388, "#77db33", 0.85)
        blob(290, 882, 446, 219, "#ffca86", 0.61)
        blob(576, 953, 270, 134, "#ff8cc5", 0.8)
        ctx.globalCompositeOperation = "source-over"
        blob(367, 505, 351, 365, "#123b0d", 0.93)
        blob(363, 504, 212, 224, "#12340c", 0.65)
    } else if (kind === 1) {
        ctx.fillStyle = "#17000e"
        ctx.fillRect(0, 0, W, H)
        ctx.globalCompositeOperation = "screen"
        blob(9, 485, 413, 347, "#ff007b", 0.95)
        blob(193, 444, 208, 164, "#eb388d", 0.73)
        blob(470, 947, 532, 215, "#84083c", 0.59)
        blob(768, 725, 218, 354, "#ca064c", 0.72)
        blob(664, -14, 422, 243, "#700827", 0.37)
        ctx.globalCompositeOperation = "source-over"
        blob(465, 520, 288, 362, "#11000d", 0.87)
    } else if (kind === 2) {
        ctx.fillStyle = "#000716"
        ctx.fillRect(0, 0, W, H)
        ctx.globalCompositeOperation = "screen"
        blob(102, 731, 667, 393, "#114ee9", 0.86)
        blob(755, 757, 334, 364, "#8dffff", 0.95)
        blob(709, 600, 443, 304, "#06abdd", 0.52)
        blob(562, 397, 391, 289, "#2527ad", 0.73)
        blob(123, 182, 243, 290, "#043239", 0.3)
        ctx.globalCompositeOperation = "source-over"
        blob(210, 255, 407, 380, "#010514", 0.91)
        blob(469, 981, 299, 166, "#001427", 0.77)
    } else {
        ctx.fillStyle = "#23093d"
        ctx.fillRect(0, 0, W, H)
        ctx.globalCompositeOperation = "screen"
        blob(554, 295, 503, 393, "#9519fa", 0.9)
        blob(647, 307, 306, 259, "#a146ff", 0.75)
        blob(555, 890, 428, 336, "#a73cff", 0.91)
        blob(743, 683, 266, 374, "#7806db", 0.63)
        blob(228, 971, 353, 145, "#4d166e", 0.72)
        ctx.globalCompositeOperation = "source-over"
        blob(266, 560, 457, 240, "#230631", 0.92)
    }

    // Fine monochromatic dither keeps large soft gradients smooth at all sizes.
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let random = 0x3eacf12d ^ (kind * 0x45d9f3b)
    for (let p = 0; p < pixels.data.length; p += 4) {
        random ^= random << 13
        random ^= random >>> 17
        random ^= random << 5
        const noise = ((random >>> 0) / 4294967295 - 0.5) * 4.2
        pixels.data[p] += noise
        pixels.data[p + 1] += noise
        pixels.data[p + 2] += noise
    }
    ctx.putImageData(pixels, 0, 0)
    ctx.restore()

    if (kind === 0) {
        label("AI Confidence", 47, 105, 0.64, 23)
        label("Prediction accuracy", 47, 143, 0.56, 22)
        ctx.save()
        ctx.strokeStyle = "rgba(245,249,171,0.34)"
        ctx.lineWidth = 3.2
        ctx.beginPath()
        ctx.arc(380, 506, 221, Math.PI * 1.05, Math.PI * 1.99)
        ctx.stroke()
        ctx.strokeStyle = "rgba(245,249,171,0.25)"
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(380, 506, 211, Math.PI * 1.06, Math.PI * 1.97)
        ctx.stroke()
        for (let i = 0; i < 38; i++) {
            const angle = Math.PI * (1.05 + (0.94 * i) / 37)
            const r = 221 + Math.sin(i * 1.81) * 3
            dot(
                380 + Math.cos(angle) * r,
                506 + Math.sin(angle) * r,
                3 + (i % 3),
                "rgba(247,249,172,0.24)"
            )
        }
        ctx.restore()
        metric("95", 232, 575, "#e7efb1", 212, "rgba(222,242,98,0.12)")
        metric("%", 481, 478, "rgba(231,239,177,0.83)", 70)
        label("AI-powered precision", 47, 908, 0.52, 22)
    } else if (kind === 1) {
        label("Weekly Credit hours", 48, 106, 0.67, 23)
        label("Image generation", 48, 143, 0.59, 22)
        ctx.save()
        ctx.strokeStyle = "rgba(255,145,170,0.095)"
        ctx.lineWidth = 3
        for (let i = 0; i < 67; i++) {
            const x = 84 + i * 9.2
            const amp =
                23 + Math.abs(Math.sin(i * 0.48) * Math.cos(i * 0.174)) * 95
            ctx.beginPath()
            ctx.moveTo(x, 604 - amp)
            ctx.lineTo(x, 604 + amp * 0.82)
            ctx.stroke()
        }
        ctx.restore()
        dot(109, 499, 35, "rgba(254,197,211,0.08)")
        dot(658, 499, 35, "rgba(254,197,211,0.05)")
        line([99, 499, 119, 499], "rgba(255,218,217,0.75)", 2.5)
        line([648, 499, 668, 499], "rgba(255,218,217,0.63)", 2.5)
        line([658, 489, 658, 509], "rgba(255,218,217,0.63)", 2.5)
        metric("720", 185, 575, "#ffe0b9", 208, "rgba(255,130,87,0.12)")
        label("Image engine v2.0", 48, 908, 0.48, 22)
    } else if (kind === 2) {
        label("AI Model Intelligence", 48, 107, 0.78, 23)
        label("AI Future Tools", 48, 145, 0.72, 22)
        metric("25", 239, 577, "#94f8f5", 214, "rgba(66,249,247,0.43)")
        metric("%", 479, 472, "#bcf6f6", 72, "rgba(66,249,247,0.16)")
        line(
            [142, 622, 220, 621, 326, 629, 438, 626, 539, 621, 644, 621],
            "rgba(131,244,255,0.19)",
            1.5
        )
        line(
            [220, 623, 346, 625, 431, 625, 487, 618, 644, 617],
            "rgba(135,248,255,0.78)",
            2.1
        )
        ctx.save()
        ctx.shadowBlur = 17
        ctx.shadowColor = "#93ffff"
        dot(220, 623, 10, "#ecffff")
        ctx.restore()
        dot(73, 652, 3, "rgba(154,233,255,0.7)")
        dot(704, 638, 3, "rgba(154,233,255,0.52)")
        label("Power Consumption", 48, 908, 0.74, 22)
    } else {
        label("Intelligence Engine", 48, 107, 0.64, 23)
        label("AI processing", 48, 145, 0.62, 22)
        label("Version", 582, 107, 0.4, 21)
        metric("2.0", 228, 577, "#f1d1ff", 211, "rgba(209,130,255,0.18)")
        line(
            [
                94, 639, 181, 630, 261, 643, 344, 634, 432, 637, 522, 628, 655,
                633,
            ],
            "rgba(196,143,243,0.065)",
            1.5
        )
        label("Built for the next generation", 48, 908, 0.48, 22)
    }

    // The original has a very fine highlight along the card edge.
    ctx.strokeStyle = "rgba(255,255,255,0.13)"
    ctx.lineWidth = 1.25
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3)
    return canvas
}

const vertexShader = `
    varying vec2 vUv;
    uniform float uSide, uBend, uWidth;
    void main() {
        vUv = uv;
        vec3 p = position;
        float outer = uSide > 0.0 ? 1.0 - uv.x : uv.x;
        float curve = pow(outer, 2.8);
        p.y *= 1.0 + abs(uSide) * uBend * (curve * .48 - .25);
        p.z += abs(uSide) * uBend * sin(uv.x * 3.14159265) * uWidth * .16;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
`
const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D uMap;
    uniform vec2 uSize, uMediaAspect;
    uniform float uRadius, uSide, uGlow, uAura, uGrain, uContain;
    float rounded(vec2 uv) {
        vec2 p = (uv - .5) * uSize;
        vec2 q = abs(p) - uSize * .5 + uRadius;
        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
        return 1.0 - smoothstep(-.9, .9, d);
    }
    vec3 sampleImage(vec2 uv) {
        vec2 ratio = uMediaAspect;
        if (uContain > .5) ratio = 1.0 / ratio.yx;
        vec2 p = (uv - .5) * ratio + .5;
        if (uContain > .5 && (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0)) return vec3(.035);
        return texture2D(uMap, clamp(p, .001, .999)).rgb;
    }
    void main() {
        vec2 uv = vUv;
        float side = abs(uSide);
        float centerBand = exp(-pow((uv.y - .5) * 12.0, 2.0));
        uv.x += side * sin(uv.y * 10.0 + uv.x * 4.0) * centerBand * .028;
        vec3 color = sampleImage(uv);
        if (uAura > .5) {
            vec2 expanded = (uv - .5) * 1.15 + .5;
            float b = .045;
            color = sampleImage(expanded) * .2;
            color += sampleImage(expanded + vec2(b, 0.0)) * .1;
            color += sampleImage(expanded - vec2(b, 0.0)) * .1;
            color += sampleImage(expanded + vec2(0.0, b)) * .1;
            color += sampleImage(expanded - vec2(0.0, b)) * .1;
            color += sampleImage(expanded + vec2(b, b)) * .1;
            color += sampleImage(expanded - vec2(b, b)) * .1;
            color += sampleImage(expanded + vec2(b, -b)) * .1;
            color += sampleImage(expanded + vec2(-b, b)) * .1;
            vec3 spectrum = .5 + .5 * cos((uv.x + uv.y * .65) * 9.0 + vec3(0.0, 2.1, 4.2));
            color = mix(color, spectrum, .65);
            float edge = pow(max(0.0, 1.0 - max(abs(uv.x - .5), abs(uv.y - .5)) * 2.0), .65);
            gl_FragColor = vec4(color, edge * uGlow * side * .75);
        } else {
            float fringe = side * .004;
            color.r = sampleImage(uv + vec2(fringe, 0.0)).r;
            color.b = sampleImage(uv - vec2(fringe, 0.0)).b;
            float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) - .5;
            color += grain * .026 * uGrain;
            color += side * centerBand * .085 * vec3(.2, .85, 1.0);
            gl_FragColor = vec4(color, rounded(vUv));
        }
        #include <colorspace_fragment>
    }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 680
 */
export default function VibrantGradientCarousel(incomingProps: Props) {
    // Merge each group defensively, then flatten. Core logic stays flat.
    const props = {
        ...DEFAULTS,
        ...incomingProps,
        ...DEFAULTS.layout,
        ...(incomingProps.layout || {}),
        ...DEFAULTS.styling,
        ...(incomingProps.styling || {}),
        ...DEFAULTS.motion,
        ...(incomingProps.motion || {}),
        ...DEFAULTS.media,
        ...(incomingProps.media || {}),
        ...DEFAULTS.accessibility,
        ...(incomingProps.accessibility || {}),
    }
    const isStatic = useIsStaticRenderer()
    const shouldAnimate =
        !isStatic && (props.editorPreview ?? props.livePreview ?? true)
    const mountRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const fallbackRef = useRef<HTMLDivElement>(null)
    const statusRef = useRef<HTMLSpanElement>(null)
    const countRef = useRef<HTMLSpanElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const isIntersecting = useRef(true)
    const positionRef = useRef(0)
    const targetRef = useRef(0)
    const urlsRef = useRef(new Set<string>())
    const apiRef = useRef<{
        move: (delta: number) => void
        reset: () => void
    } | null>(null)
    // State is used only for discrete file additions, never for motion or pointer updates.
    const [uploaded, setUploaded] = useState<MediaItem[]>([])
    const itemKey = JSON.stringify(incomingProps.items ?? DEFAULT_ITEMS)
    const configured = useMemo(
        () => JSON.parse(itemKey) as MediaItem[],
        [itemKey]
    )
    const items = useMemo(
        () => [...configured, ...uploaded],
        [configured, uploaded]
    )
    const sceneItems = items.length ? items : DEFAULT_ITEMS
    const first =
        sceneItems[wrap(Math.round(positionRef.current), sceneItems.length)]
    const rootProps = {
        id: incomingProps.id,
        className: incomingProps.className,
    }

    useEffect(
        () => () => {
            urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
            urlsRef.current.clear()
        },
        []
    )

    useEffect(() => {
        const container = mountRef.current
        const stage = stageRef.current
        if (!container || !stage) return
        let renderer: THREE.WebGLRenderer | null = null
        let placeholder: THREE.Texture | null = null
        let scene: THREE.Scene | null = null
        let camera: THREE.PerspectiveCamera | null = null
        let frameId = 0,
            resizeObserver: ResizeObserver | null = null
        let intersectionObserver: IntersectionObserver | null = null
        let alive = true,
            contextLost = false,
            width = 1,
            height = 1,
            hovering = false,
            dragging = false
        let reduced = false,
            lastTime = 0,
            elapsed = 0,
            holdUntil = props.delay
        let current = positionRef.current,
            target = targetRef.current,
            start = current,
            tweenStart = 0,
            tweening = Math.abs(target - current) > 0.0001
        let lastSelected = -1
        let pointerId = -1,
            downX = 0,
            downY = 0,
            dragStart = 0,
            moved = false
        const geometries = new Set<THREE.BufferGeometry>()
        const materials = new Set<THREE.Material>()
        const textures = new Set<THREE.Texture>()
        const renderTargets = new Set<THREE.WebGLRenderTarget>()
        const mediaCleanups = new Map<number, () => void>()
        const cache = new Map<
            number,
            {
                texture: THREE.Texture
                uv: THREE.Vector2
                video?: HTMLVideoElement
                title: string
            }
        >()
        const playRequested = new WeakSet<HTMLVideoElement>()
        const pending = new Map<number, { cancelled: boolean }>()
        const slots: {
            mesh: THREE.Mesh
            aura: THREE.Mesh
            material: THREE.ShaderMaterial
            auraMaterial: THREE.ShaderMaterial
            index: number
        }[] = []
        const listeners: (() => void)[] = []
        const artworkCanvases = new Map<number, HTMLCanvasElement>()
        const unitRatio = new THREE.Vector2(1, 1)
        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        const n = sceneItems.length
        const notice = (text: string) => {
            if (statusRef.current) statusRef.current.textContent = text
        }
        const listen = (
            node: EventTarget,
            name: string,
            fn: EventListener,
            options?: AddEventListenerOptions
        ) => {
            node.addEventListener(name, fn, options)
            listeners.push(() => node.removeEventListener(name, fn, options))
        }
        const active = () =>
            alive && !contextLost && isIntersecting.current && !document.hidden
        const animated = () => shouldAnimate && !reduced
        const coverRatio = (aspect: number) => {
            const card = props.cardWidth / props.cardHeight
            return aspect > card
                ? new THREE.Vector2(card / aspect, 1)
                : new THREE.Vector2(1, aspect / card)
        }
        const syncVideos = () =>
            cache.forEach((entry, index) => {
                const visible = slots.some(
                    (s) =>
                        s.index === index &&
                        s.mesh.visible &&
                        Math.abs(s.material.uniforms.uSide.value) < 1.2
                )
                if (entry.video) {
                    if (
                        active() &&
                        animated() &&
                        props.videoPlayback &&
                        visible
                    ) {
                        if (
                            entry.video.paused &&
                            !playRequested.has(entry.video)
                        ) {
                            playRequested.add(entry.video)
                            void entry.video.play().catch(() => {})
                        }
                    } else {
                        entry.video.pause()
                        playRequested.delete(entry.video)
                    }
                }
            })
        const pushFrame = () => {
            if (!alive || !renderer || !scene || !camera || !active()) return
            if (!animated()) current = target
            draw()
        }
        const loadItem = (index: number) => {
            if (cache.has(index) || pending.has(index)) return
            const item = sceneItems[index]
            const token = { cancelled: false }
            pending.set(index, token)
            const accept = (
                texture: THREE.Texture,
                ratio: number,
                video?: HTMLVideoElement
            ) => {
                if (!alive || token.cancelled) {
                    texture.dispose()
                    return
                }
                texture.colorSpace = THREE.SRGBColorSpace
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.generateMipmaps = false
                textures.add(texture)
                cache.set(index, {
                    texture,
                    uv: coverRatio(ratio),
                    video,
                    title: item.title || `Card ${index + 1}`,
                })
                pending.delete(index)
                pushFrame()
                syncVideos()
            }
            const fail = () => {
                if (!alive || token.cancelled) return
                const canvas = makeArtwork(index % 4, 1)
                accept(
                    new THREE.CanvasTexture(canvas),
                    canvas.width / canvas.height
                )
                notice(
                    `Could not load ${item.title || "media"}. Check the file or URL.`
                )
            }
            if (item.type === "video" && item.video) {
                const video = document.createElement("video")
                video.crossOrigin = "anonymous"
                video.muted = true
                video.loop = true
                video.playsInline = true
                video.preload = "auto"
                const ready = () => {
                    if (token.cancelled || !alive) return
                    const texture = new THREE.VideoTexture(video)
                    // A paused decoder may never deliver a new video-frame callback.
                    texture.needsUpdate = true
                    accept(
                        texture,
                        video.videoWidth / (video.videoHeight || 1),
                        video
                    )
                }
                video.addEventListener("loadeddata", ready, { once: true })
                video.addEventListener("error", fail, { once: true })
                mediaCleanups.set(index, () => {
                    video.removeEventListener("loadeddata", ready)
                    video.removeEventListener("error", fail)
                    video.pause()
                    video.removeAttribute("src")
                    video.load()
                })
                video.src = item.video
                video.load()
            } else if (item.type === "image" && srcOf(item.image)) {
                const img = new Image()
                img.crossOrigin = "anonymous"
                img.onload = () => {
                    if (token.cancelled || !alive) return
                    const canvas = document.createElement("canvas")
                    const scale = Math.min(
                        1,
                        props.resolution /
                            Math.max(img.naturalWidth, img.naturalHeight)
                    )
                    canvas.width = Math.max(
                        1,
                        Math.round(img.naturalWidth * scale)
                    )
                    canvas.height = Math.max(
                        1,
                        Math.round(img.naturalHeight * scale)
                    )
                    const ctx = canvas.getContext("2d")
                    if (!ctx) {
                        fail()
                        return
                    }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    accept(
                        new THREE.CanvasTexture(canvas),
                        img.naturalWidth / (img.naturalHeight || 1)
                    )
                }
                img.onerror = fail
                mediaCleanups.set(index, () => {
                    img.onload = null
                    img.onerror = null
                    img.src = ""
                })
                img.src = srcOf(item.image)
            } else {
                const art = wrap(index, 4)
                let canvas = artworkCanvases.get(art)
                if (!canvas) {
                    canvas = makeArtwork(
                        art,
                        Math.min(1.5, props.resolution / 768)
                    )
                    artworkCanvases.set(art, canvas)
                }
                accept(
                    new THREE.CanvasTexture(canvas),
                    canvas.width / canvas.height
                )
            }
        }
        let inDraw = false
        function draw() {
            if (inDraw || !renderer || !scene || !camera || !alive) return
            inDraw = true
            const base = Math.round(current)
            const keep = new Set<number>()
            for (let j = 0; j < slots.length; j++) {
                const slot = slots[j],
                    logical = base + j - 2
                const d = logical - current,
                    index = wrap(logical, n)
                slot.index = index
                slot.mesh.visible =
                    n > 1 ? Math.abs(d) < 1.75 : logical === base
                slot.aura.visible = slot.mesh.visible && Math.abs(d) > 0.35
                if (!slot.mesh.visible) continue
                keep.add(index)
                loadItem(index)
                const entry = cache.get(index)
                const side = Math.min(1.35, Math.abs(d)) * Math.sign(d)
                slot.mesh.position.set(
                    d * props.spacing,
                    -18,
                    -Math.abs(d) * 80
                )
                slot.mesh.rotation.set(
                    0,
                    d * Math.PI,
                    THREE.MathUtils.degToRad(props.tilt) *
                        (1 - Math.min(1, Math.abs(d)))
                )
                slot.aura.position.copy(slot.mesh.position)
                slot.aura.position.z -= 2
                slot.aura.rotation.copy(slot.mesh.rotation)
                for (const mat of [slot.material, slot.auraMaterial]) {
                    mat.uniforms.uSide.value = side
                    mat.uniforms.uMap.value = entry?.texture ?? placeholder
                    mat.uniforms.uMediaAspect.value.copy(entry?.uv ?? unitRatio)
                    mat.uniforms.uContain.value =
                        sceneItems[index].fit === "contain" ? 1 : 0
                }
            }
            // Retain only nearby media; large collections do not allocate one texture per item.
            cache.forEach((entry, index) => {
                if (!keep.has(index)) {
                    mediaCleanups.get(index)?.()
                    mediaCleanups.delete(index)
                    slots.forEach((slot) => {
                        for (const mat of [slot.material, slot.auraMaterial]) {
                            if (mat.uniforms.uMap.value === entry.texture)
                                mat.uniforms.uMap.value = placeholder
                        }
                    })
                    entry.texture.dispose()
                    textures.delete(entry.texture)
                    cache.delete(index)
                }
            })
            pending.forEach((token, index) => {
                if (!keep.has(index)) {
                    token.cancelled = true
                    pending.delete(index)
                    mediaCleanups.get(index)?.()
                    mediaCleanups.delete(index)
                }
            })
            renderer.render(scene, camera)
            positionRef.current = current
            const selected = wrap(Math.round(current), n)
            if (selected !== lastSelected) {
                if (countRef.current)
                    countRef.current.textContent = `${selected + 1} / ${n}`
                container?.setAttribute(
                    "aria-label",
                    `${sceneItems[selected].title || `Card ${selected + 1}`}. ${selected + 1} of ${n}.`
                )
                lastSelected = selected
            }
            inDraw = false
        }
        const moveTo = (next: number) => {
            target = next
            targetRef.current = next
            start = current
            tweenStart = elapsed
            tweening = true
            holdUntil = elapsed + props.duration + props.delay
            if (!animated()) {
                current = target
                tweening = false
            }
            pushFrame()
            resume()
        }
        function loop(timestamp: number) {
            frameId = 0
            if (!isIntersecting.current || !active()) return
            const dt = lastTime
                ? Math.min((timestamp - lastTime) / 1000, 0.05)
                : 0
            lastTime = timestamp
            elapsed += dt
            if (tweening && !dragging) {
                const t = Math.min(
                    1,
                    (elapsed - tweenStart) / Math.max(0.05, props.duration)
                )
                current = start + (target - start) * ease(t)
                if (t >= 1) {
                    current = target
                    tweening = false
                }
            }
            if (
                props.autoplay &&
                n > 1 &&
                !dragging &&
                !tweening &&
                !(hovering && props.pauseOnHover) &&
                elapsed >= holdUntil
            ) {
                moveTo(
                    Math.round(current) +
                        Math.max(1, Math.min(n - 1, Math.round(props.step)))
                )
            }
            draw()
            syncVideos()
            if (animated() && active() && !frameId)
                frameId = requestAnimationFrame(loop)
        }
        function pause() {
            cancelAnimationFrame(frameId)
            frameId = 0
            lastTime = 0
            syncVideos()
        }
        function resume() {
            if (!active()) return
            if (animated()) {
                if (!frameId) frameId = requestAnimationFrame(loop)
            } else pushFrame()
            syncVideos()
        }
        const resize = () => {
            if (!renderer || !camera) return
            width = Math.max(1, stage.clientWidth)
            height = Math.max(1, stage.clientHeight)
            const scale = Math.max(0.01, Math.min(width / 620, height / 680))
            camera.aspect = width / height
            camera.position.z =
                height / (2 * Math.tan(THREE.MathUtils.degToRad(22)) * scale)
            camera.updateProjectionMatrix()
            renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    props.pixelRatio / 100,
                    2
                )
            )
            renderer.setSize(width, height, false)
            pushFrame()
        }
        try {
            scene = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(44, 1, 0.1, 10000)
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
            })
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.domElement.style.cssText =
                "display:block;width:100%;height:100%;position:absolute;inset:0;"
            renderer.domElement.setAttribute("aria-hidden", "true")
            stage.appendChild(renderer.domElement)
            // Prepare the four small default artworks before the animation starts.
            // Their pixel generation must not interrupt the first carousel turn.
            sceneItems.forEach((item, index) => {
                if (
                    (item.type === "image" && srcOf(item.image)) ||
                    (item.type === "video" && item.video)
                )
                    return
                const art = wrap(index, 4)
                if (!artworkCanvases.has(art))
                    artworkCanvases.set(
                        art,
                        makeArtwork(art, Math.min(1.5, props.resolution / 768))
                    )
            })
            const placeholderCanvas = makeArtwork(0, 0.25)
            placeholder = new THREE.CanvasTexture(placeholderCanvas)
            placeholder.colorSpace = THREE.SRGBColorSpace
            textures.add(placeholder)
            const geometry = new THREE.PlaneGeometry(
                props.cardWidth,
                props.cardHeight,
                48,
                24
            )
            const auraGeometry = new THREE.PlaneGeometry(
                props.cardWidth * 1.1,
                props.cardHeight * 1.1,
                48,
                24
            )
            geometries.add(geometry)
            geometries.add(auraGeometry)
            for (let j = 0; j < 5; j++) {
                const makeMaterial = (aura: boolean) => {
                    const mat = new THREE.ShaderMaterial({
                        vertexShader,
                        fragmentShader,
                        side: THREE.DoubleSide,
                        transparent: true,
                        depthWrite: !aura,
                        uniforms: {
                            uMap: { value: placeholder },
                            uSide: { value: 0 },
                            uBend: { value: props.bend / 100 },
                            uWidth: { value: props.cardWidth },
                            uSize: {
                                value: new THREE.Vector2(
                                    props.cardWidth,
                                    props.cardHeight
                                ),
                            },
                            uMediaAspect: { value: new THREE.Vector2(1, 1) },
                            uRadius: { value: props.radius },
                            uGlow: { value: props.glow / 100 },
                            uAura: { value: aura ? 1 : 0 },
                            uGrain: { value: props.grain / 100 },
                            uContain: { value: 0 },
                        },
                    })
                    materials.add(mat)
                    return mat
                }
                const material = makeMaterial(false),
                    auraMaterial = makeMaterial(true)
                const mesh = new THREE.Mesh(geometry, material),
                    aura = new THREE.Mesh(auraGeometry, auraMaterial)
                scene.add(aura, mesh)
                slots.push({ mesh, aura, material, auraMaterial, index: -1 })
            }
            reduced = props.reducedMotion && motionQuery.matches
            resize()
            if (fallbackRef.current) fallbackRef.current.style.opacity = "0"
            resizeObserver = new ResizeObserver(resize)
            resizeObserver.observe(stage)
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    isIntersecting.current = entries[0]?.isIntersecting ?? false
                    if (isIntersecting.current) {
                        resize()
                        resume()
                    } else pause()
                },
                { threshold: 0.01 }
            )
            intersectionObserver.observe(container)
            listen(document, "visibilitychange", () => {
                if (document.hidden) pause()
                else resume()
            })
            listen(motionQuery, "change", () => {
                reduced = props.reducedMotion && motionQuery.matches
                if (reduced) {
                    current = target
                    tweening = false
                    pause()
                    pushFrame()
                } else resume()
            })
            listen(container, "pointerenter", () => {
                hovering = true
                pushFrame()
            })
            listen(container, "pointerleave", () => {
                hovering = false
                holdUntil = elapsed + props.delay
                pushFrame()
            })
            listen(container, "pointerdown", ((event: PointerEvent) => {
                if (
                    !props.drag ||
                    (event.target as HTMLElement).closest("button,input,a")
                )
                    return
                if (event.pointerType === "mouse" && event.button !== 0) return
                dragging = true
                tweening = false
                moved = false
                pointerId = event.pointerId
                downX = event.clientX
                downY = event.clientY
                dragStart = current
                container.setPointerCapture(pointerId)
                container.style.cursor = "grabbing"
                pushFrame()
            }) as EventListener)
            listen(container, "pointermove", ((event: PointerEvent) => {
                if (!dragging || event.pointerId !== pointerId) return
                const dx = event.clientX - downX,
                    dy = event.clientY - downY
                if (Math.abs(dx) > 5) moved = true
                if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
                    dragging = false
                    moveTo(Math.round(current))
                    return
                }
                const scale = Math.min(width / 620, height / 680)
                current = dragStart - dx / (props.spacing * scale)
                target = current
                targetRef.current = current
                pushFrame()
            }) as EventListener)
            const finishDrag = (event: Event) => {
                const e = event as PointerEvent
                if (e.pointerId !== pointerId) return
                if (container.hasPointerCapture(pointerId))
                    container.releasePointerCapture(pointerId)
                container.style.cursor = props.drag ? "grab" : "default"
                if (!dragging) return
                dragging = false
                if (!moved && e.type === "pointerup") {
                    const x =
                        e.clientX -
                        container.getBoundingClientRect().left -
                        width / 2
                    moveTo(
                        Math.round(current) +
                            (Math.abs(x) > width * 0.2 ? Math.sign(x) : 0)
                    )
                } else moveTo(Math.round(current))
            }
            listen(container, "pointerup", finishDrag)
            listen(container, "pointercancel", finishDrag)
            listen(container, "lostpointercapture", finishDrag)
            listen(container, "keydown", ((e: KeyboardEvent) => {
                if ((e.target as HTMLElement).closest("input")) return
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault()
                    moveTo(
                        Math.round(target) + (e.key === "ArrowRight" ? 1 : -1)
                    )
                }
                if (e.key === "Home") {
                    e.preventDefault()
                    moveTo(Math.round(target) - wrap(Math.round(target), n))
                }
                if (e.key === "End") {
                    e.preventDefault()
                    moveTo(
                        Math.round(target) - wrap(Math.round(target), n) + n - 1
                    )
                }
            }) as EventListener)
            listen(
                container,
                "wheel",
                ((e: WheelEvent) => {
                    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) && !e.shiftKey)
                        return
                    const delta = e.deltaX || e.deltaY
                    if (Math.abs(delta) < 8 || tweening) return
                    e.preventDefault()
                    moveTo(Math.round(current) + Math.sign(delta))
                }) as EventListener,
                { passive: false }
            )
            listen(renderer.domElement, "webglcontextlost", ((e: Event) => {
                e.preventDefault()
                contextLost = true
                pause()
                if (fallbackRef.current) fallbackRef.current.style.opacity = "1"
                notice("3D preview paused. Reload to restore it.")
            }) as EventListener)
            apiRef.current = {
                move: (delta) => moveTo(Math.round(target) + delta),
                reset: () => moveTo(0),
            }
            resume()
        } catch {
            notice("3D rendering is unavailable in this browser.")
            if (fallbackRef.current) fallbackRef.current.style.opacity = "1"
        }
        return () => {
            alive = false
            if (pointerId >= 0 && container.hasPointerCapture(pointerId))
                container.releasePointerCapture(pointerId)
            container.style.cursor = props.drag ? "grab" : "default"
            apiRef.current = null
            cancelAnimationFrame(frameId)
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            listeners.forEach((remove) => remove())
            pending.forEach((token) => {
                token.cancelled = true
            })
            pending.clear()
            mediaCleanups.forEach((cleanup) => cleanup())
            mediaCleanups.clear()
            geometries.forEach((geometry) => geometry.dispose())
            materials.forEach((material) => material.dispose())
            textures.forEach((texture) => texture.dispose())
            renderTargets.forEach((target) => target.dispose())
            cache.clear()
            artworkCanvases.clear()
            scene?.clear()
            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (stage && stage.contains(renderer.domElement))
                    stage.removeChild(renderer.domElement)
            }
        }
    }, [
        sceneItems,
        shouldAnimate,
        props.cardWidth,
        props.cardHeight,
        props.spacing,
        props.radius,
        props.tilt,
        props.bend,
        props.glow,
        props.grain,
        props.pixelRatio,
        props.autoplay,
        props.duration,
        props.delay,
        props.step,
        props.drag,
        props.pauseOnHover,
        props.videoPlayback,
        props.resolution,
        props.reducedMotion,
    ])

    useEffect(() => {
        const retained = new Set(
            uploaded.map((item) => item.video || srcOf(item.image))
        )
        urlsRef.current.forEach((url) => {
            if (!retained.has(url)) {
                URL.revokeObjectURL(url)
                urlsRef.current.delete(url)
            }
        })
    }, [uploaded])

    const addFiles = (files: FileList | null) => {
        if (!files) return
        const additions: MediaItem[] = []
        Array.from(files).forEach((file) => {
            if (
                !file.type.startsWith("image/") &&
                !file.type.startsWith("video/")
            )
                return
            const url = URL.createObjectURL(file)
            urlsRef.current.add(url)
            additions.push({
                title: file.name,
                type: file.type.startsWith("video/") ? "video" : "image",
                image: url,
                video: url,
                fit: "cover",
            })
        })
        if (additions.length)
            setUploaded((previous) => [...previous, ...additions])
        if (statusRef.current)
            statusRef.current.textContent = additions.length
                ? `Added ${additions.length} ${additions.length === 1 ? "file" : "files"}.`
                : "Choose image or video files."
        if (fileRef.current) fileRef.current.value = ""
    }
    return (
        <div
            {...rootProps}
            ref={mountRef}
            data-vibrant-carousel
            role="region"
            aria-roledescription="carousel"
            tabIndex={0}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                touchAction: "pan-y",
                cursor: props.drag ? "grab" : "default",
                ...props.style,
            }}
        >
            <style>{`
            [data-vibrant-carousel] { outline-offset: -3px; }
            [data-vibrant-carousel] .vgc-toolbar { opacity:0; transform:translateY(5px); transition:opacity .2s,transform .2s; }
            [data-vibrant-carousel]:hover .vgc-toolbar,[data-vibrant-carousel]:focus-within .vgc-toolbar { opacity:1; transform:translateY(0); }
            [data-vibrant-carousel] button { font:500 12px/1.2 Arial,sans-serif; color:#333; border:0; padding:10px 13px; border-radius:24px; background:rgba(255,255,255,.86); cursor:pointer; backdrop-filter:blur(10px); }
            [data-vibrant-carousel] button:hover { background:#fff; }
            [data-vibrant-carousel] button:focus-visible { outline:2px solid #6757ea; outline-offset:3px; }
            @media (hover:none) { [data-vibrant-carousel] .vgc-toolbar { opacity:1; transform:none; } }
            @media (prefers-reduced-motion:reduce) { [data-vibrant-carousel] .vgc-toolbar { transition:none; } }
        `}</style>
            <div
                ref={fallbackRef}
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        width: "34%",
                        aspectRatio: ".775",
                        borderRadius: props.radius,
                        background:
                            "radial-gradient(circle at 50% 52%,#143b05 0%,#447817 25%,#a4bd32 55%,#ffcf45 75%,#ec4771 100%)",
                        position: "relative",
                        color: "#fff",
                        fontFamily: "Arial,sans-serif",
                        overflow: "hidden",
                    }}
                >
                    {first.type === "image" && srcOf(first.image) ? (
                        <img
                            src={srcOf(first.image)}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: first.fit || "cover",
                            }}
                        />
                    ) : first.type === "video" && srcOf(first.poster) ? (
                        <img
                            src={srcOf(first.poster)}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        <>
                            <span
                                style={{
                                    position: "absolute",
                                    left: "8%",
                                    top: "8%",
                                    fontSize: 10,
                                }}
                            >
                                AI-powered intelligence
                                <br />
                                Model accuracy
                            </span>
                            <span
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: "clamp(28px,6vw,72px)",
                                    fontWeight: 300,
                                }}
                            >
                                95
                                <sup
                                    style={{
                                        position: "absolute",
                                        left: "65%",
                                        fontSize: 16,
                                    }}
                                >
                                    %
                                </sup>
                            </span>
                        </>
                    )}
                </div>
            </div>
            <div
                ref={stageRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            />
            {(props.uploads || props.navigation) && (
                <div
                    className="vgc-toolbar"
                    style={{
                        position: "absolute",
                        bottom: 18,
                        left: 18,
                        right: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        cursor: "default",
                    }}
                >
                    {props.navigation && (
                        <button
                            aria-label="Previous card"
                            onClick={() => apiRef.current?.move(-1)}
                        >
                            ←
                        </button>
                    )}
                    {props.navigation && (
                        <span
                            ref={countRef}
                            style={{
                                color: "#555",
                                font: "12px Arial,sans-serif",
                                minWidth: 46,
                                textAlign: "center",
                            }}
                        >
                            1 / {sceneItems.length}
                        </span>
                    )}
                    {props.navigation && (
                        <button
                            aria-label="Next card"
                            onClick={() => apiRef.current?.move(1)}
                        >
                            →
                        </button>
                    )}
                    {props.uploads && (
                        <button
                            onClick={() => fileRef.current?.click()}
                            aria-label="Add images or videos"
                        >
                            + Add media
                        </button>
                    )}
                    {uploaded.length > 0 && (
                        <button
                            aria-label="Remove session uploads"
                            onClick={() => {
                                setUploaded([])
                                positionRef.current = 0
                                targetRef.current = 0
                                if (statusRef.current)
                                    statusRef.current.textContent =
                                        "Uploads cleared."
                            }}
                        >
                            Reset uploads
                        </button>
                    )}
                </div>
            )}
            <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                aria-label="Upload images and videos"
                style={{ display: "none" }}
                onChange={(e) => addFiles(e.target.files)}
            />
            <span
                ref={statusRef}
                role="status"
                aria-live="polite"
                style={{
                    position: "absolute",
                    left: 12,
                    top: 12,
                    maxWidth: "calc(100% - 24px)",
                    font: "11px Arial,sans-serif",
                    color: "#555",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

VibrantGradientCarousel.defaultProps = DEFAULTS
addPropertyControls(VibrantGradientCarousel, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate the preview.",
    },
    items: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "New card",
                },
                type: {
                    type: ControlType.Enum,
                    title: "Content",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: MediaItem) => p.type !== "image",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: MediaItem) => p.type !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (p: MediaItem) => p.type !== "video",
                    description: "Static preview image.",
                },
                fit: {
                    type: ControlType.Enum,
                    title: "Fit",
                    options: ["cover", "contain"],
                    optionTitles: ["Fill card", "Show full media"],
                    defaultValue: "cover",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
        description: "Add any number of cards.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                defaultValue: 400,
                min: 100,
                max: 600,
                step: 1,
                unit: "px",
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                defaultValue: 460,
                min: 100,
                max: 700,
                step: 1,
                unit: "px",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 647,
                min: 200,
                max: 900,
                step: 1,
                unit: "px",
                description: "Distance between centers.",
            },
            radius: {
                type: ControlType.Number,
                title: "Corners",
                defaultValue: 12,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                defaultValue: 0,
                min: -20,
                max: 20,
                step: 0.5,
                unit: "deg",
            },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            bend: {
                type: ControlType.Number,
                title: "Side Curve",
                defaultValue: 88,
                min: 0,
                max: 150,
                step: 1,
                unit: "%",
                description: "Bends neighboring cards.",
            },
            glow: {
                type: ControlType.Number,
                title: "Aura",
                defaultValue: 70,
                min: 0,
                max: 150,
                step: 1,
                unit: "%",
                description: "Soft colored edges.",
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                defaultValue: 18,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            pixelRatio: {
                type: ControlType.Number,
                title: "Sharpness",
                defaultValue: 150,
                min: 100,
                max: 200,
                step: 25,
                unit: "%",
                description: "Higher uses more GPU.",
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
            duration: {
                type: ControlType.Number,
                title: "Turn Time",
                defaultValue: 1.45,
                min: 0.15,
                max: 5,
                step: 0.05,
                unit: "s",
            },
            delay: {
                type: ControlType.Number,
                title: "Hold Time",
                defaultValue: 2.3,
                min: 0,
                max: 15,
                step: 0.1,
                unit: "s",
            },
            step: {
                type: ControlType.Number,
                title: "Advance",
                defaultValue: 2,
                min: 1,
                max: 20,
                step: 1,
                unit: "cards",
                description: "Cards per automatic turn.",
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
            },
        },
    },
    media: {
        type: ControlType.Object,
        title: "Media & Controls",
        controls: {
            uploads: {
                type: ControlType.Boolean,
                title: "Visitor Upload",
                defaultValue: false,
                description: "Local session files.",
            },
            navigation: {
                type: ControlType.Boolean,
                title: "Navigation",
                defaultValue: false,
            },
            videoPlayback: {
                type: ControlType.Boolean,
                title: "Play Videos",
                defaultValue: true,
                description: "Muted while visible.",
            },
            resolution: {
                type: ControlType.Number,
                title: "Texture Size",
                defaultValue: 1024,
                min: 256,
                max: 2048,
                step: 256,
                unit: "px",
                description: "Maximum image texture edge.",
            },
        },
    },
    accessibility: {
        type: ControlType.Object,
        title: "Accessibility",
        controls: {
            reducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                defaultValue: true,
                description: "Respect device preference.",
            },
        },
    },
})
