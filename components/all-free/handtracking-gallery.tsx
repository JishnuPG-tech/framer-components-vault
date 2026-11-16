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


type Item = {
    image?: string
}

const defaultItems: Item[] = Array.from({ length: 12 }).map((_, i) => ({
    image: `https://picsum.photos/seed/wheel_${i + 1}/600/900`,
}))

type Props = {
    items?: Item[]
    cardWidth: number
    cardHeight: number
    borderRadius?: number
    tiltAngle?: number
    itemMultiplier?: number
    padding?: number
    preview?: {
        visibility?: boolean
        width?: number
        height?: number
        position?:
            | "topleft"
            | "topcenter"
            | "topright"
            | "centerleft"
            | "center"
            | "centerright"
            | "bottomleft"
            | "bottomcenter"
            | "bottomright"
        padding?: {
            top?: number
            left?: number
            bottom?: number
            right?: number
        }
    }
    rotationSpeed?: number
    style?: React.CSSProperties
}

const THREE_MODULE_URL = "https://unpkg.com/three@0.158.0/build/three.module.js"
const THREE_UMD_URL = "https://unpkg.com/three@0.158.0/build/three.min.js"

const VISION_MODULE_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs"
const VISION_WASM_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
const GESTURE_MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"

let threeModulePromise: Promise<any> | null = null
let visionModulePromise: Promise<any> | null = null

function getVisionModule(): Promise<any> {
    if (visionModulePromise) return visionModulePromise
    visionModulePromise = import(/* @vite-ignore */ VISION_MODULE_URL)
    return visionModulePromise
}

function getMediaSource(item: Item): string | null {
    return resolveImageSource(item.image)
}

type CachedTextureEntry = {
    texture: any
    refCount: number
    lastUsed: number
}

const TEXTURE_CACHE_TTL_MS = 60_000
const textureCache = new Map<string, CachedTextureEntry>()

const resolveImageSource = (image: any): string | null => {
    if (!image) return null
    if (typeof image === "string") return image
    if (typeof image === "object") {
        return image.src || image.url || image.default || null
    }
    return null
}

const getTextureCacheKey = (
    textureUrl: string,
    cardWidth: number,
    cardHeight: number
) => `${textureUrl}_${cardWidth}x${cardHeight}`

const retainCachedTexture = (cacheKey: string, count = 1) => {
    const entry = textureCache.get(cacheKey)
    if (!entry) return
    entry.refCount += count
    entry.lastUsed = performance.now()
}

const releaseCachedTexture = (cacheKey: string, count = 1) => {
    const entry = textureCache.get(cacheKey)
    if (!entry) return
    entry.refCount = Math.max(0, entry.refCount - count)
    entry.lastUsed = performance.now()
    pruneTextureCache()
}

const pruneTextureCache = () => {
    const now = performance.now()
    textureCache.forEach((entry, key) => {
        if (
            entry.refCount === 0 &&
            now - entry.lastUsed > TEXTURE_CACHE_TTL_MS
        ) {
            try {
                entry.texture?.dispose?.()
            } catch (e) {
                console.warn("Failed to dispose cached texture", e)
            }
            textureCache.delete(key)
        }
    })
}

const estimateCardPixelSize = (
    cardWidth: number,
    cardHeight: number,
    multiplier: number = 1,
    container?: HTMLDivElement | null
) => {
    if (!container) {
        return {
            width: Math.round(cardWidth * 300 * multiplier),
            height: Math.round(cardHeight * 300 * multiplier),
        }
    }

    const { clientWidth, clientHeight } = container
    const minDimension = Math.max(1, Math.min(clientWidth, clientHeight))
    const basePixels = minDimension * 0.6

    const safeCardHeight = Math.max(cardHeight, 0.1)
    return {
        width: Math.round(
            Math.min(
                1024, // High-quality resolution
                Math.max(256, basePixels * (cardWidth / safeCardHeight)) *
                    multiplier
            )
        ),
        height: Math.round(
            Math.min(1024, Math.max(256, basePixels) * multiplier)
        ),
    }
}

// Optimized texture loading with size-based caching and Canvas resizing
async function loadOptimizedTexture(
    textureUrl: string,
    targetWidth: number,
    targetHeight: number
): Promise<any> {
    const cacheKey = getTextureCacheKey(textureUrl, targetWidth, targetHeight)
    const cachedEntry = textureCache.get(cacheKey)
    if (cachedEntry) {
        cachedEntry.lastUsed = performance.now()
        return cachedEntry.texture
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    return new Promise((resolve, reject) => {
        img.onload = async () => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            if (!ctx) {
                throw new Error("Failed to get 2D context")
            }

            canvas.width = targetWidth
            canvas.height = targetHeight

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            const THREE = await getThreeModule()
            const texture = new THREE.CanvasTexture(canvas)

            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.magFilter = THREE.LinearFilter
            texture.wrapS = THREE.ClampToEdgeWrapping
            texture.wrapT = THREE.ClampToEdgeWrapping
            texture.flipY = true
            texture.premultiplyAlpha = false
            texture.colorSpace =
                (THREE as any).SRGBColorSpace ?? texture.colorSpace
            texture.anisotropy = 2 // Reduced from 16 for thermal

            textureCache.set(cacheKey, {
                texture,
                refCount: 0,
                lastUsed: performance.now(),
            })

            resolve(texture)
        }

        img.onerror = () => reject(new Error("Image load failed"))
        img.src = textureUrl
    })
}

function getThreeModule(): Promise<any> {
    if (threeModulePromise) return threeModulePromise
    threeModulePromise = (async () => {
        try {
            return await import(/* @vite-ignore */ THREE_MODULE_URL)
        } catch (err) {
            // Fallback to global THREE (UMD) once
            if ((window as any).THREE) return (window as any).THREE
            await new Promise<void>((resolve, reject) => {
                const s = document.createElement("script")
                s.src = THREE_UMD_URL
                s.async = true
                s.onload = () => resolve()
                s.onerror = () => reject(new Error("Failed to load THREE UMD"))
                document.head.appendChild(s)
            })
            return (window as any).THREE
        }
    })()
    return threeModulePromise
}

const PreviewOverlay = ({
    progress,
    multipliedItems,
    preview,
    cardWidth,
    cardHeight,
    isGestureActive,
    hovered,
}: {
    progress: number
    multipliedItems: Item[]
    preview: any
    cardWidth: number
    cardHeight: number
    isGestureActive: boolean
    hovered: number | null
}) => {
    const isEditor = RenderTarget.current() === RenderTarget.canvas
    const totalItems = multipliedItems.length
    if (totalItems === 0) return null

    // Determine which item to show
    let activeItem: Item | null = null
    const showPreview =
        preview.visibility !== false &&
        (isEditor || hovered !== null || isGestureActive)

    if (hovered !== null) {
        activeItem = multipliedItems[hovered % totalItems]
    } else if (isGestureActive) {
        const index = Math.round(progress * totalItems) % totalItems
        const activeIndex = index < 0 ? totalItems + index : index
        activeItem = multipliedItems[activeIndex]
    } else if (isEditor) {
        activeItem = multipliedItems[0]
    }

    if (!activeItem) return null

    const safeCardWidth = Math.max(cardWidth, 1)
    const aspectRatio = cardHeight / safeCardWidth
    const baseWidth = preview.width || 220
    const calculatedHeight = preview.height || baseWidth * aspectRatio

    const getPositionStyles = (position: string) => {
        const padding = preview.padding || {}
        const topPadding = padding.top ?? 20
        const leftPadding = padding.left ?? 20
        const bottomPadding = padding.bottom ?? 20
        const rightPadding = padding.right ?? 20

        const base = {
            top: "auto",
            bottom: "auto",
            left: "auto",
            right: "auto",
            transform: "none",
        }

        switch (position) {
            case "topleft":
                return {
                    ...base,
                    top: `${topPadding}px`,
                    left: `${leftPadding}px`,
                }
            case "topcenter":
                return {
                    ...base,
                    top: `${topPadding}px`,
                    left: "50%",
                    transform: "translateX(-50%)",
                }
            case "topright":
                return {
                    ...base,
                    top: `${topPadding}px`,
                    right: `${rightPadding}px`,
                }
            case "centerleft":
                return {
                    ...base,
                    top: "50%",
                    left: `${leftPadding}px`,
                    transform: "translateY(-50%)",
                }
            case "center":
                return {
                    ...base,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                }
            case "centerright":
                return {
                    ...base,
                    top: "50%",
                    right: `${rightPadding}px`,
                    transform: "translateY(-50%)",
                }
            case "bottomleft":
                return {
                    ...base,
                    bottom: `${bottomPadding}px`,
                    left: `${leftPadding}px`,
                }
            case "bottomcenter":
                return {
                    ...base,
                    bottom: `${bottomPadding}px`,
                    left: "50%",
                    transform: "translateX(-50%)",
                }
            case "bottomright":
                return {
                    ...base,
                    bottom: `${bottomPadding}px`,
                    right: `${rightPadding}px`,
                }
            default:
                return {
                    ...base,
                    bottom: `${bottomPadding}px`,
                    left: `${leftPadding}px`,
                }
        }
    }

    const positionStyles = getPositionStyles(preview.position || "bottomleft")

    return (
        <div
            style={{
                position: "fixed",
                ...positionStyles,
                width: `${baseWidth}px`,
                zIndex: 9999,
                transition: "opacity 0.4s ease, visibility 0s linear 0.4s",
                opacity: showPreview ? 1 : 0,
                visibility: showPreview ? "visible" : "hidden",
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: `${calculatedHeight}px`,
                    backgroundColor: "white",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <img
                    src={resolveImageSource(activeItem?.image) || ""}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        </div>
    )
}

// @framerDisableUnlink
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 */
export default function TDF_Mediapipe_3D_Gallery({
    items = defaultItems,
    cardWidth = 200,
    cardHeight = 300,

    borderRadius = 0.05,
    tiltAngle = -0.28,
    itemMultiplier = 1,
    padding = 0.2, // Default padding (20% of container)
    preview = {
        visibility: true,
        width: 220,
        height: 330,
        position: "bottomleft",
    },
    rotationSpeed = 100,
    style,
}: Props) {
    const useGesture = true
    const showCamera = true
    const cameraPlacement = "background"
    const containerRef = React.useRef<HTMLDivElement>(null)
    const rendererRef = React.useRef<any>(null)
    const sceneRef = React.useRef<any>(null)
    const cameraRef = React.useRef<any>(null)
    const groupRef = React.useRef<any>(null)
    const raycasterRef = React.useRef<any>(null)
    const pointerRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const hoveredRef = React.useRef<any>(null)
    const resizeObserverRef = React.useRef<ResizeObserver | null>(null)
    const blobRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null)
    const targetBlobRef = React.useRef({ x: 0.5, y: 0.5 })
    const currentBlobRef = React.useRef({ x: 0.5, y: 0.5 })
    const containerSizeRef = React.useRef({ w: 0, h: 0 })
    const containerDimensionsRef = React.useRef({ width: 0, height: 0 })
    const gestureRecognizerRef = React.useRef<any>(null)
    const lastVideoTimeRef = React.useRef<number>(-1)
    const lastAIProcessingTimeRef = React.useRef(0)
    const gestureVelocityRef = React.useRef(0)
    const animationStatesRef = React.useRef<
        Map<
            any,
            {
                targetY: number
                currentY: number
                targetScale: number
                currentScale: number
            }
        >
    >(new Map())
    const texturesRef = React.useRef<any[]>([])
    const cachedTextureUsageRef = React.useRef<Map<string, number>>(new Map())
    const scrollProgressRef = React.useRef(0)
    const currentScrollRef = React.useRef(0) // Current scroll value for smooth interpolation
    const rotationCountRef = React.useRef(0) // Track complete rotations to maintain continuous wheel movement
    const loadingStatesRef = React.useRef<Map<number, boolean>>(new Map()) // Track loading states for each card
    const animationFrameRef = React.useRef<number | null>(null)

    // States
    const [hovered, setHovered] = React.useState<number | null>(null)
    const [wheelLoaded, setWheelLoaded] = React.useState(false)
    const [currentProgress, setCurrentProgress] = React.useState(0)
    const [isGestureActive, setIsGestureActive] = React.useState(false)
    const [cameraStatus, setCameraStatus] = React.useState<
        "idle" | "loading" | "ready" | "error" | "blocked"
    >("idle")
    const [gestureStatus, setGestureStatus] = React.useState<
        "idle" | "loading" | "ready" | "error"
    >("idle")

    // Derived values
    const isEmbedded =
        typeof window !== "undefined" && window.self !== window.top
    const isFramerPreview = RenderTarget.current() === RenderTarget.preview

    // ResizeObserver: 어떤 해상도에서든 자동 대응
    React.useEffect(() => {
        const el = containerRef.current?.parentElement
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                containerSizeRef.current = {
                    w: entry.contentRect.width,
                    h: entry.contentRect.height,
                }
                // Trigger Three.js resize logic
                if (
                    rendererRef.current &&
                    cameraRef.current &&
                    groupRef.current
                ) {
                    const renderer = rendererRef.current
                    const camera = cameraRef.current
                    const group = groupRef.current
                    const { width, height } = entry.contentRect
                    renderer.setSize(width, height)
                    camera.aspect = Math.max(width, 1) / Math.max(height, 1)
                    camera.updateProjectionMatrix()

                    // Recalculate card positions/scales (logic from onResize)
                    const fovRad = (camera.fov * Math.PI) / 180
                    const cameraDistance = Math.sqrt(
                        camera.position.y ** 2 + camera.position.z ** 2
                    )
                    const frustumHeight =
                        2 * cameraDistance * Math.tan(fovRad / 2)
                    const frustumWidth = frustumHeight * camera.aspect
                    const frustumSize = Math.min(frustumWidth, frustumHeight)

                    const referenceFrustumHeight =
                        2 * cameraDistance * Math.tan(fovRad / 2)
                    const referenceFrustumSize = Math.min(
                        referenceFrustumHeight * 1.0,
                        referenceFrustumHeight
                    )
                    const newCardSizeRatio = frustumSize / referenceFrustumSize
                    const newRadius = (frustumSize / 2) * (1 - 2 * padding)

                    group.children.forEach((child: any) => {
                        if (child.userData.angle !== undefined) {
                            const angle = child.userData.angle
                            const x =
                                Math.round(newRadius * Math.sin(angle) * 1000) /
                                1000
                            const z =
                                Math.round(newRadius * Math.cos(angle) * 1000) /
                                1000
                            const depthOffset = Math.cos(angle) * 0.1
                            child.position.set(x, 0, z + depthOffset)
                            child.userData.originalPosition.set(
                                x,
                                0,
                                z + depthOffset
                            )
                        }
                        child.scale.set(newCardSizeRatio, newCardSizeRatio, 1)
                    })
                    renderer.render(sceneRef.current, camera)
                }
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [padding])

    // Memoize items to avoid redundant calculations
    const multipliedItems = React.useMemo(() => {
        if (!items || items.length === 0) return []
        const list: Item[] = []
        const multiplier = Math.max(1, itemMultiplier)
        for (let i = 0; i < multiplier; i++) {
            items.forEach((item, index) => {
                const resolvedImage =
                    resolveImageSource(item.image) || undefined
                list.push({
                    image: resolvedImage,
                })
            })
        }
        return list
    }, [items, itemMultiplier])

    // Smooth interpolation function
    const smoothLerp = (current: number, target: number, factor: number) => {
        return current + (target - current) * factor
    }

    // Periodically sync scroll progress state for the React preview overlay
    // Optimized: Throttle to ~15-20fps instead of 60fps to save CPU
    React.useEffect(() => {
        let lastSyncTime = 0
        let rafId: number
        const sync = (time: number) => {
            if (time - lastSyncTime >= 50) {
                // ~20fps
                setCurrentProgress(scrollProgressRef.current)
                lastSyncTime = time
            }
            rafId = requestAnimationFrame(sync)
        }
        rafId = requestAnimationFrame(sync)
        return () => cancelAnimationFrame(rafId)
    }, [])

    // Main scene rebuilding function
    const rebuildScene = React.useCallback(async () => {
        const container = containerRef.current
        if (!container) return

        // Set default dimensions if container is empty
        if (container.clientWidth === 0 || container.clientHeight === 0) {
            container.style.width = "100%"
            container.style.height = "200px"
        }

        const THREE = await getThreeModule()

        // Clean up previous animation frame
        if (animationFrameRef.current !== null)
            cancelAnimationFrame(animationFrameRef.current)
        const prevRenderer = rendererRef.current
        if (prevRenderer) {
            try {
                prevRenderer.dispose()
                if (prevRenderer.domElement?.parentElement) {
                    prevRenderer.domElement.parentElement.removeChild(
                        prevRenderer.domElement
                    )
                }
            } catch {
                // ignore
            }
            rendererRef.current = null
        }

        // Create new renderer with performance optimizations
        const renderer = new THREE.WebGLRenderer({
            antialias: true, // Keep antialiasing for visual quality
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            stencil: false,
            depth: true,
        })
        renderer.setPixelRatio(window.devicePixelRatio || 1) // Keep original pixel ratio
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.setClearColor(new THREE.Color(0x000000), 0) // Transparent background
        ;(renderer as any).outputColorSpace =
            (THREE as any).SRGBColorSpace ?? (renderer as any).outputColorSpace
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(75, 1, 0.01, 1000) // 75° field of view
        // Set camera aspect ratio
        const cw = Math.max(container.clientWidth, 1)
        const ch = Math.max(container.clientHeight, 1)
        camera.aspect = cw / ch
        camera.updateProjectionMatrix()
        // Position camera to center the wheel on screen
        const baseY = 400 // Adjusted Y distance to center the wheel on screen
        camera.position.set(0, baseY, baseY)
        camera.lookAt(0, 0, 0)
        // Store baseY for animation access
        ;(camera as any).baseY = baseY
        cameraRef.current = camera

        const ambient = new THREE.AmbientLight(0xffffff, 0.9)
        scene.add(ambient)
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5)
        scene.add(hemi)
        const dir = new THREE.DirectionalLight(0xffffff, 0.6)
        dir.position.set(5, 10, 7)
        scene.add(dir)

        const group = new THREE.Group()
        groupRef.current = group
        scene.add(group)
        // Apply tilt for 3D perspective
        group.rotation.x = tiltAngle

        // No scaleFactor - always scale 1.0, let radius calculation handle all sizing
        group.scale.setScalar(1.0)

        // Calculate wheel radius dynamically to fill container
        const calculateFrustumAndCardRatio = () => {
            const cw = Math.max(container.clientWidth, 1)
            const ch = Math.max(container.clientHeight, 1)
            const baseY = 400 // Camera Y/Z position
            const fovDeg = 75 // Vertical FOV in degrees
            const fovRad = (fovDeg * Math.PI) / 180 // Convert to radians

            // Calculate distance from camera to origin (where wheel is located)
            const cameraDistance = Math.sqrt(baseY * baseY + baseY * baseY) // = baseY * sqrt(2)

            // Calculate view frustum size at origin (where wheel is)
            const frustumHeight = 2 * cameraDistance * Math.tan(fovRad / 2)
            const frustumWidth = frustumHeight * (cw / ch) // Aspect ratio

            // Use smaller dimension to ensure wheel fits in both directions
            const frustumSize = Math.min(frustumWidth, frustumHeight)

            const referenceContainerSize = 800
            const referenceAspect = 1.0 // Assume square for reference
            const referenceFrustumHeight =
                2 * cameraDistance * Math.tan(fovRad / 2)
            const referenceFrustumWidth =
                referenceFrustumHeight * referenceAspect
            const referenceFrustumSize = Math.min(
                referenceFrustumWidth,
                referenceFrustumHeight
            )

            const cardSizeRatio = frustumSize / referenceFrustumSize
            const radius = (frustumSize / 2) * (1 - 2 * padding)

            return {
                radius: Math.max(radius, 1), // Ensure minimum radius of 1
                cardSizeRatio: cardSizeRatio,
            }
        }

        const { radius: calculatedWheelRadius, cardSizeRatio } =
            calculateFrustumAndCardRatio()

        const raycaster = new THREE.Raycaster()
        raycasterRef.current = raycaster

        // Initialize texture loader
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin("anonymous")
        loader.setPath("")

        // Clear previous texture cache
        texturesRef.current.forEach((t: any) => t?.dispose?.())
        texturesRef.current = []

        // Duplicate items based on multiplier
        const count = multipliedItems.length
        if (count === 0) {
            // Show placeholder ring when no items
            const geo = new THREE.TorusGeometry(1, 0.02, 8, 64)
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(0xdddddd) },
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    varying vec2 vUv;
                    void main() {
                        gl_FragColor = vec4(color, 1.0);
                    }
                `,
                side: THREE.DoubleSide,
            })
            const ring = new THREE.Mesh(geo, mat)
            scene.add(ring)
        }
        const twoPi = Math.PI * 2

        const textureSize = estimateCardPixelSize(
            cardWidth,
            cardHeight,
            window.devicePixelRatio || 1,
            container
        )

        // Process all textures with caching for better performance
        cachedTextureUsageRef.current = new Map()

        const texturePromises = multipliedItems.map(
            async (item: Item, i: number) => {
                const mediaSource = getMediaSource(item)
                let texture: any
                let cacheKey: string | null = null

                try {
                    if (mediaSource) {
                        cacheKey = getTextureCacheKey(
                            mediaSource,
                            textureSize.width,
                            textureSize.height
                        )
                        texture = await loadOptimizedTexture(
                            mediaSource,
                            textureSize.width,
                            textureSize.height
                        )

                        if (!texture) {
                            texture = await new Promise((resolve) => {
                                const img = new Image()
                                img.crossOrigin = "anonymous"
                                img.onload = () => {
                                    const canvas =
                                        document.createElement("canvas")
                                    const ctx = canvas.getContext("2d")!
                                    canvas.width = img.width
                                    canvas.height = img.height
                                    ctx.drawImage(img, 0, 0)
                                    const roundedTexture =
                                        new THREE.CanvasTexture(canvas)
                                    roundedTexture.needsUpdate = true
                                    roundedTexture.minFilter =
                                        THREE.LinearMipmapLinearFilter
                                    roundedTexture.magFilter =
                                        THREE.LinearFilter
                                    roundedTexture.generateMipmaps = true
                                    roundedTexture.wrapS =
                                        THREE.ClampToEdgeWrapping
                                    roundedTexture.wrapT =
                                        THREE.ClampToEdgeWrapping
                                    roundedTexture.flipY = true
                                    roundedTexture.premultiplyAlpha = false
                                    roundedTexture.colorSpace =
                                        (THREE as any).SRGBColorSpace ??
                                        roundedTexture.colorSpace
                                    roundedTexture.anisotropy = 2 // Reduced from 16
                                    resolve(roundedTexture)
                                }
                                img.onerror = () => resolve(null)
                                img.src = mediaSource
                            })
                        }
                    }
                } catch {
                    texture = null
                }

                if (texture && cacheKey) {
                    const cachedEntry = textureCache.get(cacheKey)
                    if (cachedEntry && cachedEntry.texture === texture) {
                        retainCachedTexture(cacheKey)
                        const usageMap = cachedTextureUsageRef.current
                        usageMap.set(
                            cacheKey,
                            (usageMap.get(cacheKey) || 0) + 1
                        )
                    } else if (!texturesRef.current.includes(texture)) {
                        texturesRef.current.push(texture)
                    }
                } else if (texture && !texturesRef.current.includes(texture)) {
                    texturesRef.current.push(texture)
                }
                return { texture, item, index: i, cacheKey }
            }
        )

        const textureResults = await Promise.all(texturePromises)

        // Create cards
        for (let i = 0; i < count; i++) {
            const { texture, item } = textureResults[i]
            const material = texture
                ? new THREE.MeshBasicMaterial({
                      map: texture,
                      transparent: true,
                      side: THREE.DoubleSide,
                  })
                : new THREE.MeshBasicMaterial({ color: 0xcccccc })

            const segments = borderRadius > 0 ? 32 : 1 // High quality rounding
            const geometry = new THREE.PlaneGeometry(
                cardWidth,
                cardHeight,
                segments,
                segments
            )

            if (borderRadius > 0) {
                const positions = geometry.attributes.position
                const radius = Math.min(cardWidth, cardHeight) * borderRadius
                for (let j = 0; j < positions.count; j++) {
                    const x = positions.getX(j)
                    const y = positions.getY(j)
                    const halfWidth = cardWidth / 2
                    const halfHeight = cardHeight / 2
                    let newX = x,
                        newY = y

                    if (x > halfWidth - radius && y > halfHeight - radius) {
                        const dx = x - (halfWidth - radius),
                            dy = y - (halfHeight - radius)
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist > radius) {
                            const angle = Math.atan2(dy, dx)
                            newX = halfWidth - radius + Math.cos(angle) * radius
                            newY =
                                halfHeight - radius + Math.sin(angle) * radius
                        }
                    } else if (
                        x < -halfWidth + radius &&
                        y > halfHeight - radius
                    ) {
                        const dx = x - (-halfWidth + radius),
                            dy = y - (halfHeight - radius)
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist > radius) {
                            const angle = Math.atan2(dy, dx)
                            newX =
                                -halfWidth + radius + Math.cos(angle) * radius
                            newY =
                                halfHeight - radius + Math.sin(angle) * radius
                        }
                    } else if (
                        x > halfWidth - radius &&
                        y < -halfHeight + radius
                    ) {
                        const dx = x - (halfWidth - radius),
                            dy = y - (-halfHeight + radius)
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist > radius) {
                            const angle = Math.atan2(dy, dx)
                            newX = halfWidth - radius + Math.cos(angle) * radius
                            newY =
                                -halfHeight + radius + Math.sin(angle) * radius
                        }
                    } else if (
                        x < -halfWidth + radius &&
                        y < -halfHeight + radius
                    ) {
                        const dx = x - (-halfWidth + radius),
                            dy = y - (-halfHeight + radius)
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist > radius) {
                            const angle = Math.atan2(dy, dx)
                            newX =
                                -halfWidth + radius + Math.cos(angle) * radius
                            newY =
                                -halfHeight + radius + Math.sin(angle) * radius
                        }
                    }
                    positions.setXYZ(j, newX, newY, 0)
                }
                positions.needsUpdate = true
            }

            const mesh = new THREE.Mesh(geometry, material)
            mesh.scale.set(cardSizeRatio, cardSizeRatio, 1)
            mesh.userData.index = i
            mesh.userData.originalPosition = new THREE.Vector3()

            const laneRadius = calculatedWheelRadius
            const angle = (i / count) * twoPi
            mesh.userData.angle = angle

            const x = Math.round(laneRadius * Math.sin(angle) * 1000) / 1000
            const z = Math.round(laneRadius * Math.cos(angle) * 1000) / 1000
            const depthOffset = Math.cos(angle) * 0.1
            mesh.position.set(x, 0, z + depthOffset)
            mesh.rotation.y = Math.PI / 2 + angle
            mesh.userData.originalPosition = new THREE.Vector3(
                x,
                0,
                z + depthOffset
            )

            group.add(mesh)
        }

        const onResize = () => {
            if (!container || !renderer || !camera) return
            const { clientWidth, clientHeight } = container
            if (
                renderer.domElement.width !== clientWidth ||
                renderer.domElement.height !== clientHeight
            ) {
                renderer.setSize(clientWidth, clientHeight)
                camera.aspect =
                    Math.max(clientWidth, 1) / Math.max(clientHeight, 1)
                camera.updateProjectionMatrix()
                if (groupRef.current) {
                    const {
                        radius: newRadius,
                        cardSizeRatio: newCardSizeRatio,
                    } = calculateFrustumAndCardRatio()
                    groupRef.current.children.forEach((child: any) => {
                        if (child.userData.angle !== undefined) {
                            const angle = child.userData.angle
                            const x =
                                Math.round(newRadius * Math.sin(angle) * 1000) /
                                1000
                            const z =
                                Math.round(newRadius * Math.cos(angle) * 1000) /
                                1000
                            const depthOffset = Math.cos(angle) * 0.1
                            child.position.set(x, 0, z + depthOffset)
                            child.userData.originalPosition.set(
                                x,
                                0,
                                z + depthOffset
                            )
                        }
                        child.scale.set(newCardSizeRatio, newCardSizeRatio, 1)
                    })
                }
            }
        }

        requestAnimationFrame(() => onResize())
        window.addEventListener("resize", onResize)

        const animate = (time: number) => {
            animationFrameRef.current = requestAnimationFrame(animate)

            let needsRender = false

            const targetRot =
                (scrollProgressRef.current + rotationCountRef.current) *
                Math.PI *
                2

            const prevRot = currentScrollRef.current
            currentScrollRef.current = smoothLerp(
                currentScrollRef.current,
                targetRot,
                0.1
            )

            if (Math.abs(currentScrollRef.current - prevRot) > 0.0001) {
                group.rotation.y = currentScrollRef.current
                needsRender = true
            }

            // Tilt effect
            const baseY = (camera as any).baseY || 400
            const targetX = -pointerRef.current.x * 250
            const targetY = baseY + pointerRef.current.y * 300
            const targetZ = baseY + Math.abs(pointerRef.current.x) * 150
            const tiltLerp = 0.1

            const prevCamX = camera.position.x
            const prevCamY = camera.position.y
            const prevCamZ = camera.position.z

            camera.position.x = smoothLerp(camera.position.x, targetX, tiltLerp)
            camera.position.y = smoothLerp(camera.position.y, targetY, tiltLerp)
            camera.position.z = smoothLerp(camera.position.z, targetZ, tiltLerp)

            if (
                Math.abs(camera.position.x - prevCamX) > 0.1 ||
                Math.abs(camera.position.y - prevCamY) > 0.1 ||
                Math.abs(camera.position.z - prevCamZ) > 0.1
            ) {
                camera.lookAt(0, 0, 0)
                needsRender = true
            }

            // Hover detection
            const normalizedRotation =
                (((group.rotation.y / (Math.PI * 2)) % 1) + 1) % 1
            const count = multipliedItems.length
            const itemIndex =
                count > 0
                    ? Math.round(normalizedRotation * count) % count
                    : null

            if (itemIndex !== null && itemIndex !== hovered) {
                setHovered(itemIndex)
                needsRender = true
            }

            // Animate cards
            group.children.forEach((child: any) => {
                if (
                    child.userData.originalPosition &&
                    child.userData.index !== undefined
                ) {
                    const originalPos = child.userData.originalPosition
                    if (!animationStatesRef.current.has(child)) {
                        animationStatesRef.current.set(child, {
                            targetY: 0,
                            currentY: 0,
                            targetScale: 1,
                            currentScale: 1,
                        })
                    }
                    const animState = animationStatesRef.current.get(child)!
                    const isHovered = child.userData.index === hovered
                    const newTargetY = isHovered ? 20 : 0
                    animState.targetY = newTargetY
                    const deltaY = animState.targetY - animState.currentY
                    if (Math.abs(deltaY) > 0.01) {
                        animState.currentY += deltaY * 0.1
                        child.position.set(
                            originalPos.x,
                            originalPos.y + animState.currentY,
                            originalPos.z
                        )
                        needsRender = true
                    }
                }
            })

            if (needsRender || RenderTarget.current() === RenderTarget.canvas) {
                renderer.render(scene, camera)
            }
        }
        requestAnimationFrame(animate)
        setWheelLoaded(true)

        return () => {
            if (animationFrameRef.current !== null)
                cancelAnimationFrame(animationFrameRef.current)
            animationStatesRef.current.clear()
            loadingStatesRef.current.clear()
            window.removeEventListener("resize", onResize)
            try {
                group.children.forEach((mesh: any) => {
                    if (mesh.geometry) mesh.geometry.dispose()
                    if (mesh.material?.dispose) mesh.material.dispose()
                })
            } catch {}
            try {
                if (renderer && renderer.dispose) renderer.dispose()
            } catch {}
            rendererRef.current = null
            while (container.firstChild)
                container.removeChild(container.firstChild)
        }
    }, [multipliedItems, padding, cardWidth, cardHeight, tiltAngle])

    React.useEffect(() => {
        if (!useGesture || RenderTarget.current() === RenderTarget.canvas)
            return
        let cancelled = false
        const initGesture = async () => {
            try {
                setGestureStatus("loading")
                const pkg = await getVisionModule()
                const { FilesetResolver, GestureRecognizer } = pkg
                const vision =
                    await FilesetResolver.forVisionTasks(VISION_WASM_URL)
                if (cancelled) return
                gestureRecognizerRef.current =
                    await GestureRecognizer.createFromOptions(vision, {
                        baseOptions: { modelAssetPath: GESTURE_MODEL_URL },
                        runningMode: "VIDEO",
                        numHands: 1,
                    })
                if (!cancelled) setGestureStatus("ready")
            } catch {
                if (!cancelled) setGestureStatus("error")
            }
        }
        initGesture()
        return () => {
            cancelled = true
            if (gestureRecognizerRef.current)
                gestureRecognizerRef.current.close()
        }
    }, [useGesture])

    const initCamera = React.useCallback(async () => {
        if (!useGesture) return

        const video = videoRef.current
        if (!video) return

        // Clean up previous stream if any
        if (video.srcObject) {
            const stream = video.srcObject as MediaStream
            stream.getTracks().forEach((t) => t.stop())
            video.srcObject = null
        }

        setCameraStatus("loading")
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 480 },
                    height: { ideal: 360 },
                    frameRate: { ideal: 24 },
                },
            })

            video.srcObject = stream
            await video.play()
            setCameraStatus("ready")
        } catch (err: any) {
            console.error("Camera init failed:", err)
            // Distinguish between iframe permission policy blocks and normal denials
            if (
                isEmbedded &&
                (err.name === "NotAllowedError" ||
                    err.name === "PermissionDeniedError")
            ) {
                setCameraStatus("blocked")
            } else {
                setCameraStatus("error")
            }

            if (
                err.name === "NotFoundError" ||
                err.name === "DevicesNotFoundError"
            ) {
                alert("No camera found. Please try on a mobile or laptop.")
            }
        }
    }, [useGesture])

    React.useEffect(() => {
        if (!useGesture || RenderTarget.current() === RenderTarget.canvas)
            return

        // Logic:
        // 1. If we are in Framer Preview or direct page -> Auto-init for convenience.
        // 2. If we are in an EXTERNAL embed (iframe) -> WAIT for user click (gesture) to avoid silent denial.
        if (videoRef.current && cameraStatus === "idle") {
            if (isEmbedded && !isFramerPreview) {
                // Keep it idle until button click
                return
            }
            initCamera()
        }
    }, [useGesture, initCamera, cameraStatus, isEmbedded, isFramerPreview])

    // Logic moved to top.

    // Track container dimensions efficiently to avoid per-frame layout thrashing
    React.useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect
                containerDimensionsRef.current = { width, height }
                if (canvasRef.current) {
                    canvasRef.current.width = width
                    canvasRef.current.height = height
                }
            }
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        if (
            !useGesture ||
            gestureStatus !== "ready" ||
            cameraStatus !== "ready"
        )
            return
        let animationFrame: number
        const processGesture = () => {
            if (videoRef.current && gestureRecognizerRef.current) {
                const video = videoRef.current
                if (video.readyState >= 2) {
                    const nowInMs = Date.now()

                    // AI cycle: 25fps (40ms) - balance between precision and load
                    if (
                        nowInMs - lastAIProcessingTimeRef.current >= 40 &&
                        video.currentTime !== lastVideoTimeRef.current
                    ) {
                        lastAIProcessingTimeRef.current = nowInMs
                        lastVideoTimeRef.current = video.currentTime
                        const result =
                            gestureRecognizerRef.current.recognizeForVideo(
                                video,
                                performance.now() // MediaPipe에 더 정확한 타임스탬프 전달
                            )

                        let activeGesture = ""
                        if (result.gestures && result.gestures.length > 0) {
                            const gesture = result.gestures[0][0].categoryName
                            activeGesture = gesture
                            if (gesture === "Open_Palm") {
                                gestureVelocityRef.current =
                                    0.008 * (rotationSpeed / 100)
                            } else if (gesture === "Closed_Fist") {
                                gestureVelocityRef.current = 0
                            }
                        } else {
                            gestureVelocityRef.current *= 0.95
                        }

                        // Update Blob UI via Ref
                        if (blobRef.current && containerRef.current) {
                            if (
                                result.landmarks &&
                                result.landmarks.length > 0
                            ) {
                                const landmarks = result.landmarks[0]
                                const indexTip = landmarks[9]

                                const vW = video.videoWidth
                                const vH = video.videoHeight
                                if (!vW || !vH) return

                                const { width: cW, height: cH } =
                                    containerDimensionsRef.current
                                if (cW === 0 || cH === 0) return

                                // Calculate object-fit: cover mapping
                                const scale = Math.max(cW / vW, cH / vH)
                                const ox = (vW * scale - cW) / 2
                                const oy = (vH * scale - cH) / 2

                                // Blob coordinates (including mirroring)
                                const bx =
                                    ((1 - indexTip.x) * vW * scale - ox) / cW
                                const by = (indexTip.y * vH * scale - oy) / cH
                                targetBlobRef.current = { x: bx, y: by }
                                currentBlobRef.current = { x: bx, y: by }

                                // Optimization: Only update state if it actually changed
                                if (!isGestureActive) setIsGestureActive(true)

                                const isFist = activeGesture === "Closed_Fist"
                                blobRef.current.style.background = isFist
                                    ? "radial-gradient(circle, rgba(255, 50, 50, 0.7) 0%, rgba(255, 50, 50, 0) 70%)"
                                    : "radial-gradient(circle, rgba(0, 255, 100, 0.6) 0%, rgba(0, 255, 100, 0) 70%)"
                                blobRef.current.style.transform = `scale(${isFist ? 0.8 : 1.2})`

                                // 3D 틸트
                                const targetX = bx * 2 - 1
                                const targetY = -(by * 2 - 1)
                                pointerRef.current.x =
                                    pointerRef.current.x * 0.7 + targetX * 0.3
                                pointerRef.current.y =
                                    pointerRef.current.y * 0.7 + targetY * 0.3

                                // Replicate video cover+mirror via 2D transform
                                if (canvasRef.current && showCamera) {
                                    if (!ctxRef.current)
                                        ctxRef.current =
                                            canvasRef.current.getContext("2d")
                                    const ctx = ctxRef.current
                                    if (ctx) {
                                        ctx.clearRect(0, 0, cW, cH)
                                        ctx.save()
                                        // 비디오의 object-fit:cover + scaleX(-1)을 그대로 재현
                                        ctx.translate(cW / 2, cH / 2) // 중심 기준
                                        ctx.scale(-scale, scale) // 미러 + 확대
                                        ctx.translate(-vW / 2, -vH / 2) // 비디오 원점 복구

                                        // 이제 비디오 원본 픽셀 좌표로 그리면 자동 정렬됨
                                        ctx.beginPath()
                                        ctx.strokeStyle =
                                            "rgba(0, 255, 100, 0.8)"
                                        ctx.lineWidth = 2 / scale // 선 두께 보정
                                        const connections = [
                                            [0, 1, 2, 3, 4],
                                            [0, 5, 6, 7, 8],
                                            [0, 9, 10, 11, 12],
                                            [0, 13, 14, 15, 16],
                                            [0, 17, 18, 19, 20],
                                            [5, 9, 13, 17, 5],
                                        ]
                                        connections.forEach((points) => {
                                            points.forEach((idx, i) => {
                                                const p = landmarks[idx]
                                                if (i === 0)
                                                    ctx.moveTo(
                                                        p.x * vW,
                                                        p.y * vH
                                                    )
                                                else
                                                    ctx.lineTo(
                                                        p.x * vW,
                                                        p.y * vH
                                                    )
                                            })
                                        })
                                        ctx.stroke()

                                        ctx.fillStyle = "#FF3333"
                                        const dotR = 2 / scale
                                        landmarks.forEach((p: any) => {
                                            ctx.beginPath()
                                            ctx.arc(
                                                p.x * vW,
                                                p.y * vH,
                                                dotR,
                                                0,
                                                Math.PI * 2
                                            )
                                            ctx.fill()
                                        })
                                        ctx.restore()
                                    }
                                }
                            } else {
                                blobRef.current.style.display = "none"
                                // Clear canvas when no hand detected
                                if (canvasRef.current && showCamera) {
                                    const ctx =
                                        canvasRef.current.getContext("2d")
                                    ctx?.clearRect(
                                        0,
                                        0,
                                        canvasRef.current.width,
                                        canvasRef.current.height
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 60fps Loop: Update blob position instantly
            if (blobRef.current && isGestureActive) {
                const pos = currentBlobRef.current
                blobRef.current.style.display = "block"
                blobRef.current.style.left = `${pos.x * 100}%`
                blobRef.current.style.top = `${pos.y * 100}%`
            } else if (blobRef.current) {
                blobRef.current.style.display = "none"
            }

            if (gestureVelocityRef.current > 0.0001)
                scrollProgressRef.current += gestureVelocityRef.current
            animationFrame = requestAnimationFrame(processGesture)
        }
        animationFrame = requestAnimationFrame(processGesture)
        return () => cancelAnimationFrame(animationFrame)
    }, [useGesture, gestureStatus, cameraStatus, showCamera])

    React.useEffect(() => {
        let cleanup: void | (() => void)
        let cancelled = false
        setWheelLoaded(false)
        rebuildScene().then((fn: any) => {
            if (!cancelled) cleanup = fn
        })
        return () => {
            cancelled = true
            if (cleanup) cleanup()
        }
    }, [multipliedItems, padding, cardWidth, cardHeight])

    return (
        <div
            style={{
                ...style,
                minWidth: "100px",
                minHeight: "100px",
                width: "100%",
                height: "100%",
            }}
        >
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    contain: "strict",
                    overflow: "hidden",
                    backgroundColor: "transparent",
                    zIndex: 1,
                }}
            />

            {wheelLoaded && (
                <PreviewOverlay
                    progress={currentProgress}
                    multipliedItems={multipliedItems}
                    preview={preview}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    isGestureActive={isGestureActive}
                    hovered={hovered}
                />
            )}

            {/* Visual Hand Blob */}
            {useGesture && (
                <div
                    ref={blobRef}
                    style={{
                        position: "absolute",
                        width: 40,
                        height: 40,
                        marginLeft: -20,
                        marginTop: -20,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(0, 255, 100, 0.6) 0%, rgba(0, 255, 100, 0) 70%)",
                        boxShadow: "0 0 20px rgba(0, 255, 100, 0.4)",
                        zIndex: 10000,
                        pointerEvents: "none",
                        transition: "background 0.3s ease",
                        display: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: 8,
                            height: 8,
                            marginLeft: -4,
                            marginTop: -4,
                            borderRadius: "50%",
                            backgroundColor: "#00FF66",
                        }}
                    />
                </div>
            )}

            {showCamera && useGesture && (
                <div
                    style={
                        cameraPlacement === "background"
                            ? {
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  zIndex: 0,
                                  overflow: "hidden",
                                  opacity: cameraStatus === "ready" ? 1 : 0,
                              }
                            : {
                                  position: "absolute",
                                  top: 10,
                                  right: 20,
                                  width: 140,
                                  height: 105,
                                  borderRadius: 12,
                                  overflow: "hidden",
                                  border: "2px solid rgba(255,255,255,0.3)",
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                  zIndex: 1000,
                                  backgroundColor: "#000",
                                  opacity: cameraStatus === "ready" ? 1 : 0,
                              }
                    }
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: "scaleX(-1)",
                        }}
                    />
                    <canvas
                        ref={canvasRef as any}
                        width={1}
                        height={1}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                            zIndex: 1001,
                        }}
                    />
                </div>
            )}

            {RenderTarget.current() !== RenderTarget.canvas &&
                cameraStatus !== "ready" &&
                cameraStatus !== "loading" &&
                (isEmbedded ||
                    cameraStatus === "error" ||
                    cameraStatus === "blocked") && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            background: "rgba(0, 0, 0, 0.45)",
                            backdropFilter: "blur(40px) saturate(180%)",
                            WebkitBackdropFilter: "blur(40px) saturate(180%)",
                            zIndex: 10003,
                            color: "white",
                            fontFamily:
                                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                maxWidth: "320px",
                                textAlign: "center",
                                padding: "40px 24px",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "600",
                                    marginBottom: "12px",
                                    letterSpacing: "-0.022em",
                                }}
                            >
                                {cameraStatus === "blocked" && isEmbedded
                                    ? "Camera Access Required"
                                    : "Gesture Control"}
                            </h2>
                            <p
                                style={{
                                    fontSize: "15px",
                                    lineHeight: "1.4",
                                    color: "rgba(255, 255, 255, 0.7)",
                                    marginBottom: "32px",
                                    fontWeight: "400",
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                {cameraStatus === "blocked" && isEmbedded
                                    ? "Camera permission is blocked in this embed. Please play in a new tab to enable controls."
                                    : "To interact with the 3D gallery using hand gestures, please enable your camera."}
                            </p>

                            {cameraStatus === "blocked" && isEmbedded ? (
                                <div
                                    onClick={() => {
                                        const url = window.location.href
                                        const win = window.open(url, "_blank")
                                        if (win) win.focus()
                                        else window.location.assign(url)
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "14px 0",
                                        backgroundColor: "#007AFF",
                                        color: "#FFFFFF",
                                        borderRadius: "12px",
                                        fontWeight: "600",
                                        fontSize: "16px",
                                        cursor: "pointer",
                                        transition:
                                            "background-color 0.2s ease",
                                        letterSpacing: "-0.01em",
                                    }}
                                    onMouseEnter={(e: any) =>
                                        (e.currentTarget.style.backgroundColor =
                                            "#0062CC")
                                    }
                                    onMouseLeave={(e: any) =>
                                        (e.currentTarget.style.backgroundColor =
                                            "#007AFF")
                                    }
                                >
                                    Play in New Tab
                                </div>
                            ) : (
                                <div
                                    onClick={() => initCamera()}
                                    style={{
                                        width: "100%",
                                        padding: "14px 0",
                                        backgroundColor: "#FFFFFF",
                                        color: "#000000",
                                        borderRadius: "12px",
                                        fontWeight: "600",
                                        fontSize: "16px",
                                        cursor: "pointer",
                                        transition: "opacity 0.2s ease",
                                        letterSpacing: "-0.01em",
                                    }}
                                    onMouseEnter={(e: any) =>
                                        (e.currentTarget.style.opacity = "0.9")
                                    }
                                    onMouseLeave={(e: any) =>
                                        (e.currentTarget.style.opacity = "1")
                                    }
                                >
                                    {cameraStatus === "error" ||
                                    cameraStatus === "blocked"
                                        ? "Allow Camera Access"
                                        : "Enable Camera"}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            {RenderTarget.current() === RenderTarget.canvas && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "white",
                        zIndex: 10002,
                        textAlign: "center",
                        padding: "20px",
                        gap: "12px",
                    }}
                >
                    <div style={{ fontSize: "16px", opacity: 0.9 }}>
                        1. Please check in Preview or Published mode.
                    </div>
                    <div style={{ fontSize: "16px", opacity: 0.9 }}>
                        2. Must be on a device with a camera.
                    </div>
                </div>
            )}
        </div>
    )
}

TDF_Mediapipe_3D_Gallery.defaultProps = {
    cardWidth: 200,
    cardHeight: 300,
    padding: 0.2,
    rotationSpeed: 100,
}
;(TDF_Mediapipe_3D_Gallery as any).displayName = "TDF_Mediapipe_3D_Gallery"

addPropertyControls(TDF_Mediapipe_3D_Gallery as any, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
    },
    itemMultiplier: {
        type: ControlType.Number,
        title: "Item Multiplier",
        min: 1,
        max: 20,
        step: 1,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.2,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 10,
        max: 1200,
        defaultValue: 200,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 10,
        max: 1200,
        defaultValue: 300,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0.01,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.05,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 100,
        unit: "%",
    },
    preview: {
        type: ControlType.Object,
        title: "Preview",
        description:
            "Explore more components at [THE DESIGN FUTURIST](https://thedesignfuturist.zip)",
        controls: {
            visibility: {
                type: ControlType.Boolean,
                title: "Visibility",
                defaultValue: true,
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                unit: "px",
                defaultValue: 220,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                unit: "px",
                defaultValue: 330,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: [
                    "topleft",
                    "topcenter",
                    "topright",
                    "centerleft",
                    "center",
                    "centerright",
                    "bottomleft",
                    "bottomcenter",
                    "bottomright",
                ],
                defaultValue: "bottomleft",
            },
        },
    },
})
