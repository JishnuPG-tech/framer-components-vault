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

import * as THREE from "three"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 320
 */

type LoopMode = "infinite" | "restart" | "off"

type ImageControls = {
    count: number
    [key: string]: string | number
}

type LayoutControls = {
    itemWidth: number
    itemHeight: number
    gap: number
    cameraZoom: number
    radius: number
}

type MotionControls = {
    drag: boolean
    dragSpeed: number
    wheel: boolean
    wheelSpeed: number
    autoplay: boolean
    autoplaySpeed: number
    pauseOnHover: boolean
    snap: boolean
    intro: boolean
    loopMode: LoopMode
    smoothness: number
    openSmoothness: number
}

type MarqueeControls = {
    initialGap: number
    restartGap: number
    endGap: number
}

type EffectControls = {
    wave: boolean
    wavePower: number
    vignette: boolean
    vignetteOpacity: number
    edgeFade: boolean
    edgeFadeOpacity: number
    quality: number
    meshDetail: number
}

type CloseControls = {
    showHint: boolean
    hintText: string
    textColor: string
    background: string
    font: React.CSSProperties
}

type Props = {
    images: ImageControls
    background: string
    layout: LayoutControls
    motion: MotionControls
    marquee: MarqueeControls
    effects: EffectControls
    close: CloseControls
}

type TextureImageLike = {
    naturalWidth?: number
    naturalHeight?: number
    width?: number
    height?: number
}

const EMPTY_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="

const MAX_IMAGES = 48
const DEFAULT_WIDTH = 1000
const DEFAULT_HEIGHT = 320
const MAX_RENDER_WIDTH = 2400
const MAX_RENDER_HEIGHT = 1200

const demoImages = [
    "https://picsum.photos/id/1015/1400/1800",
    "https://picsum.photos/id/1025/1400/1800",
    "https://picsum.photos/id/1035/1400/1800",
    "https://picsum.photos/id/1043/1400/1800",
    "https://picsum.photos/id/1050/1400/1800",
    "https://picsum.photos/id/1069/1400/1800",
    "https://picsum.photos/id/1084/1400/1800",
]

const defaultImages: ImageControls = {
    count: 7,
    ...Object.fromEntries(
        Array.from({ length: MAX_IMAGES }, (_, i) => [
            `image${i + 1}`,
            demoImages[i % demoImages.length],
        ])
    ),
}

const defaultFont: React.CSSProperties = {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: 500,
    lineHeight: "1em",
}

const vertexShader = `
varying vec2 vUv;
uniform float uOpen;
uniform float uIntro;
uniform vec2 uZoomScale;
uniform float uWaveStrength;

void main() {
    vUv = uv;

    vec3 pos = position;

    float angle = uOpen * 3.14159265 / 2.0;
    float wave = cos(angle);
    float centerWave = sin(length(uv - 0.5) * 15.0 + uOpen * 12.0) * 0.5 + 0.5;

    pos.x *= mix(1.0, uZoomScale.x + wave * centerWave * uWaveStrength, uOpen);
    pos.y *= mix(1.0, uZoomScale.y + wave * centerWave * uWaveStrength, uOpen);
    pos.y += (1.0 - uIntro) * -0.12;
    pos.z += (1.0 - uIntro) * -0.12;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImageRes;
uniform vec2 uPlaneSize;
uniform float uIntro;
uniform float uOpacity;
uniform float uRadius;

varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 screenSize, vec2 imageSize) {
    float screenRatio = screenSize.x / screenSize.y;
    float imageRatio = imageSize.x / imageSize.y;

    vec2 newSize = screenRatio < imageRatio
        ? vec2(imageSize.x * screenSize.y / imageSize.y, screenSize.y)
        : vec2(screenSize.x, imageSize.y * screenSize.x / imageSize.x);

    vec2 offset = screenRatio < imageRatio
        ? vec2((newSize.x - screenSize.x) / 2.0, 0.0)
        : vec2(0.0, (newSize.y - screenSize.y) / 2.0);

    return uv * screenSize / newSize + offset / newSize;
}

float roundedRectMask(vec2 uv, vec2 size, float radius) {
    if (radius <= 0.0001) return 1.0;

    float safeRadius = min(radius, min(size.x, size.y) * 0.48);
    vec2 p = (uv - 0.5) * size;
    vec2 b = size * 0.5 - vec2(safeRadius);
    vec2 q = abs(p) - b;

    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - safeRadius;
    float aa = min(size.x, size.y) * 0.006;

    return 1.0 - smoothstep(0.0, aa, d);
}

void main() {
    vec2 uv = coverUv(vUv, uRes, uImageRes);
    vec3 color = texture2D(uTex, uv).rgb;
    float mask = roundedRectMask(vUv, uPlaneSize, uRadius);

    gl_FragColor = vec4(color, uIntro * uOpacity * mask);
}
`

function safeSize(value: number, fallback: number, max: number) {
    if (!Number.isFinite(value) || value <= 0) return fallback
    return Math.min(Math.round(value), max)
}

function damp(current: number, target: number, speed: number, delta: number) {
    return THREE.MathUtils.damp(current, target, speed, delta)
}

function positiveModulo(value: number, length: number) {
    return ((value % length) + length) % length
}

function wrapPosition(value: number, length: number) {
    return positiveModulo(value + length / 2, length) - length / 2
}

function radiusToWorldUnits(radius: number, width: number, height: number) {
    const normalized = Math.max(0, radius) / 100
    return Math.min(normalized, Math.min(width, height) * 0.48)
}

function isTextureImageLike(value: unknown): value is TextureImageLike {
    return typeof value === "object" && value !== null
}

function getTextureImageSize(texture: THREE.Texture) {
    const source = texture.image as unknown

    if (!isTextureImageLike(source)) {
        return { width: 1200, height: 1600 }
    }

    const width =
        typeof source.naturalWidth === "number" && source.naturalWidth > 0
            ? source.naturalWidth
            : typeof source.width === "number" && source.width > 0
              ? source.width
              : 1200

    const height =
        typeof source.naturalHeight === "number" && source.naturalHeight > 0
            ? source.naturalHeight
            : typeof source.height === "number" && source.height > 0
              ? source.height
              : 1600

    return { width, height }
}

function createFallbackTexture() {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 96

    const ctx = canvas.getContext("2d")
    if (!ctx) {
        const texture = new THREE.DataTexture(
            new Uint8Array([220, 220, 220, 255]),
            1,
            1,
            THREE.RGBAFormat
        )
        texture.colorSpace = THREE.SRGBColorSpace
        texture.needsUpdate = true
        return texture
    }

    const gradient = ctx.createLinearGradient(0, 0, 64, 96)
    gradient.addColorStop(0, "#e8e8e8")
    gradient.addColorStop(0.5, "#cfcfcf")
    gradient.addColorStop(1, "#f4f4f4")

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 96)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true

    return texture
}

function getImageUrls(images: ImageControls) {
    const count = Math.max(
        1,
        Math.min(MAX_IMAGES, Math.round(Number(images?.count ?? 7)))
    )

    return Array.from({ length: count }, (_, i) => {
        const value = images?.[`image${i + 1}`]
        return typeof value === "string" && value.length > 0
            ? value
            : (demoImages[i % demoImages.length] ?? EMPTY_PNG)
    })
}

function StaticGalleryFallback({
    images,
    background,
    layout,
}: {
    images: ImageControls
    background: string
    layout: LayoutControls
}) {
    const imageUrls = React.useMemo(() => getImageUrls(images), [images])
    const radius = `${layout.radius}px`
    const visibleImages = imageUrls.slice(0, Math.min(imageUrls.length, 10))

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minWidth: 320,
                minHeight: 240,
                maxWidth: "100%",
                maxHeight: "100%",
                position: "relative",
                overflow: "hidden",
                background,
                borderRadius: radius,
                clipPath: `inset(0 round ${radius})`,
                WebkitClipPath: `inset(0 round ${radius})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                contain: "layout paint",
                isolation: "isolate",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    width: "100%",
                    height: "100%",
                    padding: 24,
                    transform: "translateX(-4%)",
                }}
            >
                {visibleImages.map((src, index) => (
                    <div
                        key={`${src}-${index}`}
                        style={{
                            flex: "0 0 auto",
                            width: 112,
                            height: "78%",
                            borderRadius: radius,
                            overflow: "hidden",
                            background: "#e8e8e8",
                        }}
                    >
                        <img
                            src={src}
                            alt=""
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

function InteractiveGallery(props: Partial<Props>) {
    const images = props.images ?? defaultImages
    const background = props.background ?? "#ffffff"

    const layout = {
        itemWidth: props.layout?.itemWidth ?? 1,
        itemHeight: props.layout?.itemHeight ?? 2.45,
        gap: props.layout?.gap ?? 0.16,
        cameraZoom: props.layout?.cameraZoom ?? 5,
        radius: props.layout?.radius ?? 20,
    }

    const motion = {
        drag: props.motion?.drag ?? true,
        dragSpeed: props.motion?.dragSpeed ?? 0.65,
        wheel: props.motion?.wheel ?? true,
        wheelSpeed: props.motion?.wheelSpeed ?? 0.55,
        autoplay: props.motion?.autoplay ?? true,
        autoplaySpeed: props.motion?.autoplaySpeed ?? 0.16,
        pauseOnHover: props.motion?.pauseOnHover ?? true,
        snap: props.motion?.snap ?? false,
        intro: props.motion?.intro ?? true,
        loopMode: props.motion?.loopMode ?? "infinite",
        smoothness: props.motion?.smoothness ?? 10,
        openSmoothness: props.motion?.openSmoothness ?? 8,
    }

    const marquee = {
        initialGap: props.marquee?.initialGap ?? -2.5,
        restartGap: props.marquee?.restartGap ?? 1.5,
        endGap: props.marquee?.endGap ?? 0.6,
    }

    const effects = {
        wave: props.effects?.wave ?? true,
        wavePower: props.effects?.wavePower ?? 0.95,
        vignette: props.effects?.vignette ?? false,
        vignetteOpacity: props.effects?.vignetteOpacity ?? 0.24,
        edgeFade: props.effects?.edgeFade ?? false,
        edgeFadeOpacity: props.effects?.edgeFadeOpacity ?? 0.28,
        quality: props.effects?.quality ?? 1,
        meshDetail: props.effects?.meshDetail ?? 14,
    }

    const close = {
        showHint: props.close?.showHint ?? true,
        hintText: props.close?.hintText ?? "Click anywhere to close",
        textColor: props.close?.textColor ?? "#111111",
        background: props.close?.background ?? "rgba(255,255,255,0.72)",
        font: props.close?.font ?? defaultFont,
    }

    const wrapperRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const activeItemRef = React.useRef<THREE.Mesh | null>(null)
    const [isOpen, setIsOpen] = React.useState(false)

    const imageUrls = React.useMemo(() => getImageUrls(images), [images])

    const closeActive = React.useCallback(() => {
        activeItemRef.current = null
        setIsOpen(false)
    }, [])

    React.useEffect(() => {
        const wrapper = wrapperRef.current
        const canvas = canvasRef.current
        if (!wrapper || !canvas) return

        const imageCount = Math.max(1, imageUrls.length)
        const isInfinite = motion.loopMode === "infinite"
        const isRestart = motion.loopMode === "restart"
        const isOff = motion.loopMode === "off"
        const poolCount = isInfinite
            ? Math.min(Math.max(imageCount * 2, 18), 96)
            : imageCount
        const centerOffset = isInfinite ? Math.floor(poolCount / 2) : 0

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })

        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setClearColor(new THREE.Color(background), 1)
        renderer.sortObjects = true

        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()
        const loader = new THREE.TextureLoader()
        loader.crossOrigin = "anonymous"

        const fallbackTexture = createFallbackTexture()
        const textureCache = new Map<number, THREE.Texture>()
        const meshes: THREE.Mesh[] = []
        const materials: THREE.ShaderMaterial[] = []

        let width = DEFAULT_WIDTH
        let height = DEFAULT_HEIGHT
        let viewportWidth = 1
        let viewportHeight = 1
        let progress = 0
        let targetProgress = 0
        let startOffset = 0
        let scrollDirection: 1 | -1 = 1
        let hoveredMesh: THREE.Mesh | null = null
        let isDragging = false
        let didDrag = false
        let lastX = 0
        let lastTime = window.performance.now()
        let frame = 0
        let userInteractingUntil = 0
        let isVisible = true
        let tabVisible = true

        const itemDistance = layout.itemWidth + layout.gap
        const loopWidth = poolCount * itemDistance
        const maxProgress = Math.max(0, imageCount - 1)

        function getPixelRatio() {
            const isMobile = window.innerWidth < 768
            const maxQuality = isMobile
                ? Math.min(effects.quality, 1)
                : Math.min(effects.quality, 1.35)

            return Math.min(window.devicePixelRatio || 1, maxQuality)
        }

        function getRightOffset(gap: number, overshoot = 0) {
            return (
                viewportWidth / 2 +
                layout.itemWidth / 2 +
                itemDistance * gap -
                overshoot
            )
        }

        function getLeftOffset(gap: number, overshoot = 0) {
            return (
                -viewportWidth / 2 -
                layout.itemWidth / 2 -
                itemDistance * gap -
                (imageCount - 1) * itemDistance +
                overshoot
            )
        }

        function getInitialRestartOffset() {
            return getRightOffset(marquee.initialGap)
        }

        function getFirstImageX(currentProgress: number) {
            return startOffset - currentProgress * itemDistance
        }

        function getLastImageX(currentProgress: number) {
            return (
                startOffset +
                (imageCount - 1) * itemDistance -
                currentProgress * itemDistance
            )
        }

        function applyStripPosition(offset: number) {
            startOffset = offset
            progress = 0
            targetProgress = 0

            meshes.forEach((mesh, index) => {
                mesh.position.x = startOffset + index * itemDistance
            })
        }

        function restartFromRight(overshoot: number) {
            applyStripPosition(getRightOffset(marquee.restartGap, overshoot))
        }

        function restartFromLeft(overshoot: number) {
            applyStripPosition(getLeftOffset(marquee.restartGap, overshoot))
        }

        function checkRestartLoop() {
            if (!isRestart || activeItemRef.current) return

            const leftLimit =
                -viewportWidth / 2 -
                layout.itemWidth / 2 -
                itemDistance * marquee.endGap

            const rightLimit =
                viewportWidth / 2 +
                layout.itemWidth / 2 +
                itemDistance * marquee.endGap

            if (scrollDirection === 1) {
                const lastX = getLastImageX(progress)
                if (lastX < leftLimit) restartFromRight(leftLimit - lastX)
            } else {
                const firstX = getFirstImageX(progress)
                if (firstX > rightLimit) restartFromLeft(firstX - rightLimit)
            }
        }

        function updateViewport() {
            const rect = wrapper.getBoundingClientRect()

            width = safeSize(rect.width, DEFAULT_WIDTH, MAX_RENDER_WIDTH)
            height = safeSize(rect.height, DEFAULT_HEIGHT, MAX_RENDER_HEIGHT)

            renderer.setSize(width, height, false)
            renderer.setPixelRatio(getPixelRatio())

            camera.aspect = width / height
            camera.position.z = layout.cameraZoom
            camera.updateProjectionMatrix()

            const vFov = THREE.MathUtils.degToRad(camera.fov)
            viewportHeight = 2 * Math.tan(vFov / 2) * camera.position.z
            viewportWidth = viewportHeight * camera.aspect

            materials.forEach((material) => {
                material.uniforms.uZoomScale.value.set(
                    viewportWidth / layout.itemWidth,
                    viewportHeight / layout.itemHeight
                )
            })
        }

        function assignTexture(
            material: THREE.ShaderMaterial,
            imageIndex: number
        ) {
            const safeIndex = imageIndex % imageUrls.length
            const cached = textureCache.get(safeIndex)

            if (cached) {
                const size = getTextureImageSize(cached)
                material.uniforms.uTex.value = cached
                material.uniforms.uImageRes.value.set(size.width, size.height)
                return
            }

            material.uniforms.uTex.value = fallbackTexture

            loader.load(
                imageUrls[safeIndex],
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace
                    texture.needsUpdate = true
                    textureCache.set(safeIndex, texture)

                    const size = getTextureImageSize(texture)
                    material.uniforms.uTex.value = texture
                    material.uniforms.uImageRes.value.set(
                        size.width,
                        size.height
                    )
                },
                undefined,
                () => {
                    material.uniforms.uTex.value = fallbackTexture
                }
            )
        }

        for (let i = 0; i < poolCount; i++) {
            const baseIndex = isInfinite ? i - centerOffset : i
            const imageIndex = isInfinite
                ? positiveModulo(baseIndex, imageCount)
                : i

            const radiusWorld = radiusToWorldUnits(
                layout.radius,
                layout.itemWidth,
                layout.itemHeight
            )

            const uniforms = {
                uOpen: { value: 0 },
                uIntro: { value: motion.intro ? 0 : 1 },
                uZoomScale: { value: new THREE.Vector2(1, 1) },
                uTex: { value: fallbackTexture },
                uRes: {
                    value: new THREE.Vector2(
                        layout.itemWidth,
                        layout.itemHeight
                    ),
                },
                uImageRes: { value: new THREE.Vector2(1200, 1600) },
                uPlaneSize: {
                    value: new THREE.Vector2(
                        layout.itemWidth,
                        layout.itemHeight
                    ),
                },
                uWaveStrength: { value: effects.wave ? effects.wavePower : 0 },
                uOpacity: { value: 1 },
                uRadius: { value: radiusWorld },
            }

            const segments = Math.max(4, Math.round(effects.meshDetail))
            const geometry = new THREE.PlaneGeometry(
                layout.itemWidth,
                layout.itemHeight,
                segments,
                segments
            )

            const material = new THREE.ShaderMaterial({
                uniforms,
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false,
                depthTest: false,
            })

            const mesh = new THREE.Mesh(geometry, material)

            mesh.position.x = baseIndex * itemDistance
            mesh.scale.setScalar(motion.intro ? 0.96 : 1)
            mesh.userData.index = i
            mesh.userData.baseIndex = baseIndex
            mesh.userData.baseX = baseIndex * itemDistance
            mesh.renderOrder = 1

            assignTexture(material, imageIndex)

            scene.add(mesh)
            meshes.push(mesh)
            materials.push(material)
        }

        function getPointer(event: PointerEvent | MouseEvent) {
            const rect = wrapper.getBoundingClientRect()
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        }

        function hitTest(event: PointerEvent | MouseEvent) {
            getPointer(event)
            raycaster.setFromCamera(pointer, camera)

            const hits = raycaster.intersectObjects(meshes, false)
            return hits.length ? (hits[0].object as THREE.Mesh) : null
        }

        function getTargetX(mesh: THREE.Mesh, index: number) {
            if (isInfinite) {
                const baseX = mesh.userData.baseX as number
                return wrapPosition(baseX - progress * itemDistance, loopWidth)
            }

            return startOffset + index * itemDistance - progress * itemDistance
        }

        function animate() {
            frame = requestAnimationFrame(animate)

            if (!isVisible || !tabVisible) {
                lastTime = window.performance.now()
                return
            }

            const now = window.performance.now()
            const delta = Math.min(0.04, (now - lastTime) / 1000)
            lastTime = now

            const activeMesh = activeItemRef.current
            const userIsInteracting = now < userInteractingUntil
            const hoverPaused =
                motion.pauseOnHover && hoveredMesh !== null && !activeMesh

            if (
                motion.autoplay &&
                !activeMesh &&
                !isDragging &&
                !userIsInteracting &&
                !hoverPaused
            ) {
                targetProgress += motion.autoplaySpeed * delta
            }

            if (Math.abs(targetProgress - progress) > 0.0005) {
                scrollDirection = targetProgress > progress ? 1 : -1
            }

            if (motion.snap && !activeMesh && !isDragging && !motion.autoplay) {
                targetProgress = damp(
                    targetProgress,
                    Math.round(targetProgress),
                    5,
                    delta
                )
            }

            if (isOff) {
                targetProgress = THREE.MathUtils.clamp(
                    targetProgress,
                    0,
                    maxProgress
                )
            }

            progress = damp(progress, targetProgress, motion.smoothness, delta)

            if (isInfinite && Math.abs(progress) > imageCount * 1000) {
                const shift = Math.trunc(progress / imageCount) * imageCount
                progress -= shift
                targetProgress -= shift
            }

            checkRestartLoop()

            const radiusWorld = radiusToWorldUnits(
                layout.radius,
                layout.itemWidth,
                layout.itemHeight
            )

            meshes.forEach((mesh, index) => {
                const material = mesh.material as THREE.ShaderMaterial
                const isActive = activeMesh === mesh
                const isHovered = hoveredMesh === mesh && !activeMesh

                let targetX = getTargetX(mesh, index)
                const distanceFromCenter = Math.abs(targetX / itemDistance)

                let targetOpacity =
                    1 - Math.min(distanceFromCenter * 0.035, 0.28)
                let targetScale = isHovered ? 1.055 : 1
                let targetZ = 0
                let targetOpen = 0
                let targetResX = layout.itemWidth
                let targetResY = layout.itemHeight
                let targetRadius = radiusWorld

                mesh.renderOrder = 1

                if (isActive) {
                    targetX = 0
                    targetOpacity = 1
                    targetScale = 1
                    targetZ = 0.32
                    targetOpen = 1
                    targetResX = viewportWidth
                    targetResY = viewportHeight
                    targetRadius = radiusToWorldUnits(
                        layout.radius,
                        viewportWidth,
                        viewportHeight
                    )
                    mesh.renderOrder = 999
                } else if (activeMesh) {
                    targetOpacity = 0.16
                    targetZ = -0.32
                }

                const wrapJumpLimit = viewportWidth + itemDistance * 4
                const distanceToTarget = Math.abs(mesh.position.x - targetX)

                if (
                    isInfinite &&
                    !isActive &&
                    distanceToTarget > wrapJumpLimit
                ) {
                    mesh.position.x = targetX
                } else {
                    mesh.position.x = damp(
                        mesh.position.x,
                        targetX,
                        isActive ? motion.openSmoothness : 16,
                        delta
                    )
                }

                mesh.position.z = damp(mesh.position.z, targetZ, 12, delta)
                mesh.scale.x = damp(mesh.scale.x, targetScale, 12, delta)
                mesh.scale.y = damp(mesh.scale.y, targetScale, 12, delta)

                material.uniforms.uIntro.value = damp(
                    material.uniforms.uIntro.value,
                    1,
                    7,
                    delta
                )
                material.uniforms.uOpen.value = damp(
                    material.uniforms.uOpen.value,
                    targetOpen,
                    motion.openSmoothness,
                    delta
                )
                material.uniforms.uOpacity.value = damp(
                    material.uniforms.uOpacity.value,
                    targetOpacity,
                    12,
                    delta
                )
                material.uniforms.uWaveStrength.value = effects.wave
                    ? effects.wavePower
                    : 0
                material.uniforms.uRadius.value = damp(
                    material.uniforms.uRadius.value,
                    targetRadius,
                    motion.openSmoothness,
                    delta
                )
                material.uniforms.uZoomScale.value.set(
                    viewportWidth / layout.itemWidth,
                    viewportHeight / layout.itemHeight
                )
                material.uniforms.uPlaneSize.value.set(targetResX, targetResY)
                material.uniforms.uRes.value.x = damp(
                    material.uniforms.uRes.value.x,
                    targetResX,
                    motion.openSmoothness,
                    delta
                )
                material.uniforms.uRes.value.y = damp(
                    material.uniforms.uRes.value.y,
                    targetResY,
                    motion.openSmoothness,
                    delta
                )
            })

            renderer.setRenderTarget(null)
            renderer.clear()
            renderer.render(scene, camera)
        }

        function handlePointerDown(event: PointerEvent) {
            isDragging = true
            didDrag = false
            lastX = event.clientX
            userInteractingUntil = window.performance.now() + 1400
            wrapper.style.cursor = "grabbing"

            try {
                wrapper.setPointerCapture(event.pointerId)
            } catch {}
        }

        function handlePointerMove(event: PointerEvent) {
            if (!isDragging && !activeItemRef.current) {
                hoveredMesh = hitTest(event)
            }

            wrapper.style.cursor =
                activeItemRef.current !== null
                    ? "pointer"
                    : hoveredMesh
                      ? "pointer"
                      : isDragging
                        ? "grabbing"
                        : "grab"

            if (!motion.drag || activeItemRef.current || !isDragging) return

            const deltaX = event.clientX - lastX
            const isMobile = window.innerWidth < 768
            const mobileFactor = isMobile ? 0.7 : 1

            if (Math.abs(deltaX) > 2) didDrag = true

            const movement = -deltaX * 0.014 * motion.dragSpeed * mobileFactor
            targetProgress += movement

            if (movement > 0) scrollDirection = 1
            if (movement < 0) scrollDirection = -1

            if (isOff) {
                targetProgress = THREE.MathUtils.clamp(
                    targetProgress,
                    0,
                    maxProgress
                )
            }

            lastX = event.clientX
            userInteractingUntil = window.performance.now() + 1400
        }

        function handlePointerUp(event: PointerEvent) {
            if (!isDragging) return

            isDragging = false
            wrapper.style.cursor = "grab"

            try {
                wrapper.releasePointerCapture(event.pointerId)
            } catch {}

            if (didDrag) return

            if (activeItemRef.current) {
                closeActive()
                return
            }

            const mesh = hitTest(event)

            if (mesh) {
                const worldX = mesh.position.x
                targetProgress += worldX / itemDistance

                if (isOff) {
                    targetProgress = THREE.MathUtils.clamp(
                        targetProgress,
                        0,
                        maxProgress
                    )
                }

                activeItemRef.current = mesh
                setIsOpen(true)
            }
        }

        function handlePointerLeave() {
            isDragging = false
            hoveredMesh = null
            wrapper.style.cursor = activeItemRef.current ? "pointer" : "grab"
        }

        function handleWheel(event: WheelEvent) {
            if (!motion.wheel || activeItemRef.current) return

            event.preventDefault()

            const wheelDelta =
                Math.abs(event.deltaY) > Math.abs(event.deltaX)
                    ? event.deltaY
                    : event.deltaX

            const movement = wheelDelta * 0.0048 * motion.wheelSpeed
            targetProgress += movement

            if (movement > 0) scrollDirection = 1
            if (movement < 0) scrollDirection = -1

            if (isOff) {
                targetProgress = THREE.MathUtils.clamp(
                    targetProgress,
                    0,
                    maxProgress
                )
            }

            userInteractingUntil = window.performance.now() + 1400
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") closeActive()
        }

        function handleVisibilityChange() {
            tabVisible = document.visibilityState === "visible"
        }

        updateViewport()

        if (isRestart) {
            applyStripPosition(getInitialRestartOffset())
        }

        animate()

        const resizeObserver = new ResizeObserver(updateViewport)
        resizeObserver.observe(wrapper)

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry?.isIntersecting ?? true
            },
            { threshold: 0.01 }
        )
        intersectionObserver.observe(wrapper)

        wrapper.style.cursor = "grab"

        wrapper.addEventListener("pointerdown", handlePointerDown)
        wrapper.addEventListener("pointermove", handlePointerMove)
        wrapper.addEventListener("pointerup", handlePointerUp)
        wrapper.addEventListener("pointerleave", handlePointerLeave)
        wrapper.addEventListener("wheel", handleWheel, { passive: false })
        window.addEventListener("keydown", handleKeyDown)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            cancelAnimationFrame(frame)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            wrapper.removeEventListener("pointerdown", handlePointerDown)
            wrapper.removeEventListener("pointermove", handlePointerMove)
            wrapper.removeEventListener("pointerup", handlePointerUp)
            wrapper.removeEventListener("pointerleave", handlePointerLeave)
            wrapper.removeEventListener("wheel", handleWheel)
            window.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )

            textureCache.forEach((texture) => texture.dispose())
            fallbackTexture.dispose()

            meshes.forEach((mesh) => {
                mesh.geometry.dispose()
                ;(mesh.material as THREE.ShaderMaterial).dispose()
            })

            renderer.dispose()
        }
    }, [
        imageUrls,
        background,
        layout.itemWidth,
        layout.itemHeight,
        layout.gap,
        layout.cameraZoom,
        layout.radius,
        motion.drag,
        motion.dragSpeed,
        motion.wheel,
        motion.wheelSpeed,
        motion.autoplay,
        motion.autoplaySpeed,
        motion.pauseOnHover,
        motion.snap,
        motion.intro,
        motion.loopMode,
        marquee.initialGap,
        marquee.restartGap,
        marquee.endGap,
        motion.smoothness,
        motion.openSmoothness,
        effects.wave,
        effects.wavePower,
        effects.quality,
        effects.meshDetail,
    ])

    const radius = `${layout.radius}px`

    return (
        <div
            ref={wrapperRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 320,
                minHeight: 240,
                maxWidth: "100%",
                maxHeight: "100%",
                position: "relative",
                overflow: "hidden",
                background,
                borderRadius: radius,
                clipPath: `inset(0 round ${radius})`,
                WebkitClipPath: `inset(0 round ${radius})`,
                isolation: "isolate",
                userSelect: "none",
                touchAction: "none",
                contain: "layout paint",
                transform: "translateZ(0)",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    borderRadius: radius,
                }}
            />

            {effects.vignette && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        borderRadius: radius,
                        clipPath: `inset(0 round ${radius})`,
                        WebkitClipPath: `inset(0 round ${radius})`,
                        background: `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${effects.vignetteOpacity}) 100%)`,
                    }}
                />
            )}

            {effects.edgeFade && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        borderRadius: radius,
                        clipPath: `inset(0 round ${radius})`,
                        WebkitClipPath: `inset(0 round ${radius})`,
                        background: `linear-gradient(90deg, rgba(0,0,0,${effects.edgeFadeOpacity}) 0%, transparent 18%, transparent 82%, rgba(0,0,0,${effects.edgeFadeOpacity}) 100%)`,
                    }}
                />
            )}

            {isOpen && close.showHint && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: 24,
                        transform: "translateX(-50%)",
                        padding: "8px 12px",
                        borderRadius: 999,
                        color: close.textColor,
                        background: close.background,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        ...close.font,
                    }}
                >
                    {close.hintText}
                </div>
            )}
        </div>
    )
}

export default function PrismFlowGallery(props: Partial<Props>) {
    const isStatic = useIsStaticRenderer()

    const images = props.images ?? defaultImages
    const background = props.background ?? "#ffffff"
    const layout = {
        itemWidth: props.layout?.itemWidth ?? 1,
        itemHeight: props.layout?.itemHeight ?? 2.45,
        gap: props.layout?.gap ?? 0.16,
        cameraZoom: props.layout?.cameraZoom ?? 5,
        radius: props.layout?.radius ?? 20,
    }

    if (isStatic) {
        return (
            <StaticGalleryFallback
                images={images}
                background={background}
                layout={layout}
            />
        )
    }

    return <InteractiveGallery {...props} />
}

PrismFlowGallery.defaultProps = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    images: defaultImages,
    background: "#ffffff",
    layout: {
        itemWidth: 1,
        itemHeight: 2.45,
        gap: 0.16,
        cameraZoom: 5,
        radius: 20,
    },
    motion: {
        drag: true,
        dragSpeed: 0.65,
        wheel: true,
        wheelSpeed: 0.55,
        autoplay: true,
        autoplaySpeed: 0.16,
        pauseOnHover: true,
        snap: false,
        intro: true,
        loopMode: "infinite",
        smoothness: 10,
        openSmoothness: 8,
    },
    marquee: {
        initialGap: -2.5,
        restartGap: 1.5,
        endGap: 0.6,
    },
    effects: {
        wave: true,
        wavePower: 0.95,
        vignette: false,
        vignetteOpacity: 0.24,
        edgeFade: false,
        edgeFadeOpacity: 0.28,
        quality: 1,
        meshDetail: 14,
    },
    close: {
        showHint: true,
        hintText: "Click anywhere to close",
        textColor: "#111111",
        background: "rgba(255,255,255,0.72)",
        font: defaultFont,
    },
}

addPropertyControls(PrismFlowGallery, {
    images: {
        type: ControlType.Object,
        title: "Images",
        defaultValue: defaultImages,
        controls: {
            count: {
                type: ControlType.Number,
                title: "Count",
                defaultValue: 7,
                min: 1,
                max: MAX_IMAGES,
                step: 1,
                displayStepper: true,
            },
            ...Object.fromEntries(
                Array.from({ length: MAX_IMAGES }, (_, i) => {
                    const index = i + 1

                    return [
                        `image${index}`,
                        {
                            type: ControlType.Image,
                            title: `Image ${index}`,
                            defaultValue:
                                demoImages[(index - 1) % demoImages.length],
                            hidden: (props: ImageControls) =>
                                (props?.count ?? 7) < index,
                        },
                    ]
                })
            ),
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            itemWidth: {
                type: ControlType.Number,
                title: "Item Width",
                defaultValue: 1,
                min: 0.4,
                max: 4,
                step: 0.05,
            },
            itemHeight: {
                type: ControlType.Number,
                title: "Item Height",
                defaultValue: 2.45,
                min: 0.6,
                max: 5,
                step: 0.05,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 0.16,
                min: 0,
                max: 2,
                step: 0.01,
            },
            cameraZoom: {
                type: ControlType.Number,
                title: "Camera",
                defaultValue: 5,
                min: 2,
                max: 10,
                step: 0.1,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 20,
                min: 0,
                max: 80,
                step: 1,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
            },
            dragSpeed: {
                type: ControlType.Number,
                title: "Drag Speed",
                defaultValue: 0.65,
                min: 0.1,
                max: 2,
                step: 0.05,
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Wheel",
                defaultValue: true,
            },
            wheelSpeed: {
                type: ControlType.Number,
                title: "Wheel Speed",
                defaultValue: 0.55,
                min: 0.1,
                max: 2,
                step: 0.05,
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            autoplaySpeed: {
                type: ControlType.Number,
                title: "Auto Speed",
                defaultValue: 0.16,
                min: 0.02,
                max: 1,
                step: 0.02,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: true,
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap",
                defaultValue: false,
            },
            intro: {
                type: ControlType.Boolean,
                title: "Intro",
                defaultValue: true,
            },
            loopMode: {
                type: ControlType.Enum,
                title: "Loop Mode",
                options: ["infinite", "restart", "off"],
                optionTitles: ["Infinite Loop", "Restart From Right", "Off"],
                defaultValue: "infinite",
            },
            smoothness: {
                type: ControlType.Number,
                title: "Smoothness",
                defaultValue: 10,
                min: 2,
                max: 18,
                step: 0.5,
            },
            openSmoothness: {
                type: ControlType.Number,
                title: "Open Smooth",
                defaultValue: 8,
                min: 2,
                max: 14,
                step: 0.5,
            },
        },
    },
    marquee: {
        type: ControlType.Object,
        title: "Marquee Loop",
        hidden: (props: Partial<Props>) => props.motion?.loopMode !== "restart",
        controls: {
            initialGap: {
                type: ControlType.Number,
                title: "Initial Gap",
                defaultValue: -2.5,
                min: -8,
                max: 8,
                step: 0.1,
            },
            restartGap: {
                type: ControlType.Number,
                title: "Restart Gap",
                defaultValue: 1.5,
                min: 0,
                max: 8,
                step: 0.1,
            },
            endGap: {
                type: ControlType.Number,
                title: "End Gap",
                defaultValue: 0.6,
                min: 0,
                max: 8,
                step: 0.1,
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        controls: {
            wave: {
                type: ControlType.Boolean,
                title: "Wave",
                defaultValue: true,
            },
            wavePower: {
                type: ControlType.Number,
                title: "Wave Power",
                defaultValue: 0.95,
                min: 0,
                max: 2,
                step: 0.05,
            },
            vignette: {
                type: ControlType.Boolean,
                title: "Vignette",
                defaultValue: false,
            },
            vignetteOpacity: {
                type: ControlType.Number,
                title: "Vignette",
                defaultValue: 0.24,
                min: 0,
                max: 1,
                step: 0.05,
            },
            edgeFade: {
                type: ControlType.Boolean,
                title: "Edge Fade",
                defaultValue: false,
            },
            edgeFadeOpacity: {
                type: ControlType.Number,
                title: "Edge Opacity",
                defaultValue: 0.28,
                min: 0,
                max: 1,
                step: 0.05,
            },
            quality: {
                type: ControlType.Number,
                title: "Quality",
                defaultValue: 1,
                min: 0.75,
                max: 1.5,
                step: 0.05,
            },
            meshDetail: {
                type: ControlType.Number,
                title: "Mesh Detail",
                defaultValue: 14,
                min: 4,
                max: 36,
                step: 1,
            },
        },
    },
    close: {
        type: ControlType.Object,
        title: "Close Hint",
        controls: {
            showHint: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            hintText: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "Click anywhere to close",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#111111",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(255,255,255,0.72)",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                defaultValue: defaultFont,
            },
        },
    },
})
