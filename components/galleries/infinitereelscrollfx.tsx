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

// ─── Shaders (inlined from source) ──────────────────────────────────────────

const VERT_VERTICAL = `
uniform float uScrollSpeed;
uniform float uCurveStrength;
uniform float uCurveFrequency;
varying vec2 vUv;
#define PI 3.141592653
void main() {
  vec3 pos = position;
  vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  float xDisplacement = uCurveStrength * cos(worldPosition.y * uCurveFrequency);
  pos.x += xDisplacement;
  pos.x -= uCurveStrength;
  float yDisplacement = -sin(uv.x * PI) * uScrollSpeed;
  pos.y += yDisplacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}
`

const VERT_HORIZONTAL = `
uniform float uScrollSpeed;
uniform float uCurveStrength;
uniform float uCurveFrequency;
varying vec2 vUv;
#define PI 3.141592653
void main() {
  vec3 pos = position;
  vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  float yDisplacement = uCurveStrength * cos(worldPosition.x * uCurveFrequency);
  pos.y += yDisplacement;
  pos.y -= uCurveStrength;
  float xDisplacement = -sin(uv.y * PI) * uScrollSpeed;
  pos.x += xDisplacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}
`

const FRAG = `
precision highp float;
uniform sampler2D uTexture;
uniform vec2 uPlaneSizes;
uniform vec2 uImageSizes;
varying vec2 vUv;
void main() {
  vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
  );
  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
  gl_FragColor = texture2D(uTexture, uv);
}
`

// ─── Utilities ───────────────────────────────────────────────────────────────

const mod = (n: number, m: number) => ((n % m) + m) % m

// ─── Types ───────────────────────────────────────────────────────────────────

type ColConfig = {
    position: [number, number, number]
    rotation?: [number, number, number]
    imageSize: [number, number]
    gap: number
    curveFrequency: number
    curveStrength: number
    wheelFactor: number
    wheelDirection: number
    direction: "vertical" | "horizontal"
}

type GroupConfig = {
    position?: [number, number, number]
    rotation?: [number, number, number]
    columns: ColConfig[]
}

type Preset = {
    cameraPosition: [number, number, number]
    cameraRotation?: [number, number, number]
    groups: GroupConfig[]
}

// ─── Experiment Presets (exact values from source) ───────────────────────────

const PI = Math.PI

const PRESETS: Record<string, Preset> = {
    "1": {
        cameraPosition: [0, 0, 3],
        groups: [
            {
                columns: [
                    {
                        position: [0, 0, 0],
                        imageSize: [1, 1],
                        gap: 0.05,
                        curveFrequency: 0.4,
                        curveStrength: 1,
                        wheelFactor: 0.4,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [1.1, 0, 0],
                        imageSize: [1, 1],
                        gap: 0.05,
                        curveFrequency: 0.4,
                        curveStrength: 1,
                        wheelFactor: 0.5,
                        wheelDirection: -1,
                        direction: "vertical",
                    },
                    {
                        position: [-1.1, 0, 0],
                        imageSize: [1, 1],
                        gap: 0.05,
                        curveFrequency: 0.4,
                        curveStrength: 1,
                        wheelFactor: 0.3,
                        wheelDirection: -1,
                        direction: "vertical",
                    },
                ],
            },
        ],
    },
    "2": {
        cameraPosition: [0, 0, 3],
        groups: [
            {
                columns: [
                    {
                        position: [2.5, 0, 0],
                        imageSize: [1.8, 0.6],
                        gap: 0.1,
                        curveFrequency: 0.3,
                        curveStrength: -1.2,
                        wheelFactor: 0.5,
                        wheelDirection: -1,
                        direction: "vertical",
                    },
                    {
                        position: [-2.5, 0, 0],
                        imageSize: [1.8, 0.6],
                        gap: 0.1,
                        curveFrequency: 0.3,
                        curveStrength: 1.2,
                        wheelFactor: 0.5,
                        wheelDirection: -1,
                        direction: "vertical",
                    },
                    {
                        position: [0, 0, 0],
                        imageSize: [1.6, 1],
                        gap: 0.1,
                        curveFrequency: 0,
                        curveStrength: 0,
                        wheelFactor: 0.25,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                ],
            },
        ],
    },
    "3": {
        cameraPosition: [0, 0, 3],
        cameraRotation: [0, 0, PI / 5],
        groups: [
            {
                columns: [
                    {
                        position: [-1.2, 0, 0],
                        imageSize: [0.8, 1],
                        gap: 0,
                        curveFrequency: 0.4,
                        curveStrength: 0.9,
                        wheelFactor: 0.2,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [-0.6, 0, 0],
                        imageSize: [0.8, 1],
                        gap: 0,
                        curveFrequency: 0.4,
                        curveStrength: 0.6,
                        wheelFactor: 0.3,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [0, 0, 0],
                        imageSize: [0.8, 1],
                        gap: 0,
                        curveFrequency: 0,
                        curveStrength: 0,
                        wheelFactor: 0.4,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [0.6, 0, 0],
                        imageSize: [0.8, 1],
                        gap: 0,
                        curveFrequency: 0.4,
                        curveStrength: -0.6,
                        wheelFactor: 0.5,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [1.2, 0, 0],
                        imageSize: [0.8, 1],
                        gap: 0,
                        curveFrequency: 0.4,
                        curveStrength: -0.9,
                        wheelFactor: 0.6,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                ],
            },
        ],
    },
    "4": {
        cameraPosition: [0, 0, 3],
        groups: [
            {
                columns: [
                    {
                        position: [0, 0, 0],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.5,
                        curveStrength: -1,
                        wheelFactor: 0.4,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [0, 0, 0],
                        rotation: [0, 0, PI / 5],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.5,
                        curveStrength: 1,
                        wheelFactor: 0.3,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [2, 0, 0],
                        rotation: [0, 0, -PI / 6],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.5,
                        curveStrength: 1.4,
                        wheelFactor: 0.2,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [-2, 0, 0],
                        rotation: [0, 0, -PI / 8],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.5,
                        curveStrength: 1.4,
                        wheelFactor: 0.5,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [2, 0, 0],
                        rotation: [0, 0, PI / 8],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.3,
                        curveStrength: -1.8,
                        wheelFactor: 0.35,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [-1.7, 0, 0],
                        rotation: [0, 0, PI / 9],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.3,
                        curveStrength: -1.8,
                        wheelFactor: 0.45,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                ],
            },
        ],
    },
    "5": {
        cameraPosition: [0, 0, 3],
        groups: [
            {
                position: [0, 0.4, 0],
                columns: [
                    {
                        position: [0, -0.8, 0],
                        imageSize: [1, 1],
                        gap: 0,
                        curveFrequency: 0.9,
                        curveStrength: 0.5,
                        wheelFactor: 0.4,
                        wheelDirection: 1,
                        direction: "horizontal",
                    },
                    {
                        position: [0, 0, 0],
                        imageSize: [1, 1],
                        gap: 0,
                        curveFrequency: 1,
                        curveStrength: 0.4,
                        wheelFactor: 0.3,
                        wheelDirection: 1,
                        direction: "horizontal",
                    },
                    {
                        position: [0, 0.8, 0],
                        imageSize: [1, 1],
                        gap: 0,
                        curveFrequency: 1.1,
                        curveStrength: 0.3,
                        wheelFactor: 0.2,
                        wheelDirection: 1,
                        direction: "horizontal",
                    },
                ],
            },
        ],
    },
    "6": {
        cameraPosition: [0, 0, 3],
        groups: [
            {
                rotation: [0, 0, PI / 4],
                columns: [
                    {
                        position: [-1.3, 0, 0],
                        imageSize: [2, 1.1],
                        gap: 0.05,
                        curveFrequency: 0.4,
                        curveStrength: 1.2,
                        wheelFactor: 0.1,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [-2.3, 0, 0],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.4,
                        curveStrength: 7.5,
                        wheelFactor: 0.2,
                        wheelDirection: -1,
                        direction: "vertical",
                    },
                    {
                        position: [-0.4, 0, 0],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.4,
                        curveStrength: 7.5,
                        wheelFactor: 0.2,
                        wheelDirection: -1,
                        direction: "vertical",
                    },
                ],
            },
            {
                rotation: [0, 0, PI / 4],
                columns: [
                    {
                        position: [1.3, 0, 0],
                        imageSize: [2, 1.1],
                        gap: 0.05,
                        curveFrequency: 0.4,
                        curveStrength: -1.2,
                        wheelFactor: 0.1,
                        wheelDirection: -1,
                        direction: "vertical",
                    },
                    {
                        position: [2.3, 0, 0],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.4,
                        curveStrength: -7.5,
                        wheelFactor: 0.2,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                    {
                        position: [0.4, 0, 0],
                        imageSize: [0.3, 0.4],
                        gap: 0,
                        curveFrequency: 0.4,
                        curveStrength: -7.5,
                        wheelFactor: 0.2,
                        wheelDirection: 1,
                        direction: "vertical",
                    },
                ],
            },
        ],
    },
}

// ─── Default Images ──────────────────────────────────────────────────────────

const DEFAULT_IMAGES = [
    "https://i.ibb.co.com/Cs8cwFTP/Serene-Portrait-Outdoors.png",
    "https://i.ibb.co.com/0yWZKcM6/Smiling-Man-Portrait.png",
    "https://i.ibb.co.com/2YvKtrYg/visualelectric-1759560765488.png",
    "https://i.ibb.co.com/Z6bz0qss/visualelectric-1759560770609.png",
    "https://i.ibb.co.com/Y4pb4Bbx/visualelectric-1760165065844.jpg",
    "https://i.ibb.co.com/PsL75TgK/visualelectric-1760165086031.png",
    "https://i.ibb.co.com/ZR4SyfRB/Woman-in-Green-Jacket.png",
    "https://i.ibb.co.com/kgQhD7QS/visualelectric-1771663523750.png",
    "https://i.ibb.co.com/NnSzLT32/Joyful-Portrait-Outdoors.png",
    "https://i.ibb.co.com/mCCVNWQc/Man-Relaxing-Outdoors.png",
    "https://i.ibb.co.com/whtHQDTQ/Playful-Starry-Portrait.png",
    "https://i.ibb.co.com/HTSTYBCt/Neutral-Portrait.png",
    "https://i.ibb.co.com/G4KFgXJC/Futuristic-Portrait.png",
    "https://i.ibb.co.com/DDg9CmcY/Cheerful-Sunglasses-Portrait.png",
]

// ─── Texture loading (lazy-init to avoid SSR crash) ─────────────────────────

let texCache: Map<string, THREE.Texture> | null = null
let texLoader: THREE.TextureLoader | null = null

const loadTex = (url: string): THREE.Texture => {
    if (!texCache) texCache = new Map()
    if (!texLoader) texLoader = new THREE.TextureLoader()
    const cached = texCache.get(url)
    if (cached) return cached
    const tex = texLoader.load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace
        t.needsUpdate = true
    })
    texCache.set(url, tex)
    return tex
}

// ─── Tracked mesh type ───────────────────────────────────────────────────────

type TrackedMesh = {
    mesh: THREE.Mesh
    material: THREE.ShaderMaterial
    colIdx: number
}

// ─── Main Framer Component ───────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function InfiniteReel(props: any) {
    const { experiment, images, backgroundColor, scrollSpeed, style } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rafRef = React.useRef<number>(0)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Build image list — ensure minimum 12 for smooth looping
    // Handles both plain string URLs and ResponsiveImage objects { src, srcSet, alt }
    const imageList = React.useMemo<string[]>(() => {
        const raw = images && images.length > 0 ? images : DEFAULT_IMAGES
        const src: string[] = raw
            .map((img: any) =>
                typeof img === "string" ? img : (img?.src ?? "")
            )
            .filter(Boolean)
        const list = [...src]
        while (list.length < 12) {
            list.push(...src)
        }
        return list.slice(0, Math.max(12, src.length))
    }, [images])

    // ─── Three.js setup ──────────────────────────────────────────────────

    React.useEffect(() => {
        if (isCanvas) return
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container || imageList.length === 0) return

        const preset = PRESETS[experiment] || PRESETS["1"]

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        const { width: cw, height: ch } = container.getBoundingClientRect()
        renderer.setSize(cw, ch)

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(backgroundColor)

        // Camera
        const camera = new THREE.PerspectiveCamera(50, cw / ch, 0.1, 100)
        camera.position.set(...preset.cameraPosition)
        if (preset.cameraRotation) {
            camera.rotation.set(...preset.cameraRotation)
        }

        // Shared geometry (16x16 segments for smooth curve deformation)
        const planeGeo = new THREE.PlaneGeometry(1, 1, 16, 16)

        // Track all meshes per column for animation
        const allColumns: {
            meshes: TrackedMesh[]
            config: ColConfig
            totalSpan: number
        }[] = []

        let colGlobalIdx = 0

        // Total column count — used to spread images evenly across columns
        const totalCols = preset.groups.reduce(
            (sum, grp) => sum + grp.columns.length,
            0
        )

        // Build scene from preset
        for (const grp of preset.groups) {
            const group = new THREE.Group()
            if (grp.position) group.position.set(...grp.position)
            if (grp.rotation) group.rotation.set(...grp.rotation)
            scene.add(group)

            for (const col of grp.columns) {
                const colGroup = new THREE.Group()
                colGroup.position.set(...col.position)
                if (col.rotation) colGroup.rotation.set(...col.rotation)
                group.add(colGroup)

                const colMeshes: TrackedMesh[] = []
                const imgCount = imageList.length
                const isVert = col.direction === "vertical"
                const totalSpan =
                    imgCount * (isVert ? col.imageSize[1] : col.imageSize[0]) +
                    imgCount * col.gap

                // Offset this column so it starts at a different image
                const colOffset = Math.floor(
                    (colGlobalIdx / Math.max(1, totalCols)) * imageList.length
                )

                for (let i = 0; i < imgCount; i++) {
                    const tex = loadTex(
                        imageList[(colOffset + i) % imageList.length]
                    )
                    const material = new THREE.ShaderMaterial({
                        uniforms: {
                            uTexture: { value: tex },
                            uScrollSpeed: { value: 0 },
                            uPlaneSizes: {
                                value: new THREE.Vector2(
                                    col.imageSize[0],
                                    col.imageSize[1]
                                ),
                            },
                            uImageSizes: {
                                value: new THREE.Vector2(400, 400),
                            },
                            uCurveStrength: { value: col.curveStrength },
                            uCurveFrequency: { value: col.curveFrequency },
                        },
                        vertexShader: isVert ? VERT_VERTICAL : VERT_HORIZONTAL,
                        fragmentShader: FRAG,
                    })

                    // Update image sizes when texture loads
                    tex.addEventListener("update", () => {
                        if (tex.image) {
                            material.uniforms.uImageSizes.value.set(
                                tex.image.width || 400,
                                tex.image.height || 400
                            )
                        }
                    })

                    const mesh = new THREE.Mesh(planeGeo, material)
                    mesh.scale.set(col.imageSize[0], col.imageSize[1], 1)

                    if (isVert) {
                        mesh.position.set(
                            0,
                            i * (col.imageSize[1] + col.gap),
                            0
                        )
                    } else {
                        mesh.position.set(
                            i * (col.imageSize[0] + col.gap),
                            0,
                            0
                        )
                    }

                    colGroup.add(mesh)
                    colMeshes.push({
                        mesh,
                        material,
                        colIdx: colGlobalIdx,
                    })
                }

                allColumns.push({
                    meshes: colMeshes,
                    config: col,
                    totalSpan,
                })
                colGlobalIdx++
            }
        }

        // Scroll state
        const scroll = {
            targetVelocity: 0,
            currentVelocity: 0,
            touchStart: 0,
            touchLast: 0,
            isTouching: false,
        }

        // Input handlers
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            scroll.targetVelocity += e.deltaY * 0.5 * scrollSpeed
        }

        const onTouchStart = (e: TouchEvent) => {
            scroll.isTouching = true
            scroll.touchStart = e.touches[0].clientY
            scroll.touchLast = scroll.touchStart
        }

        const onTouchMove = (e: TouchEvent) => {
            if (!scroll.isTouching) return
            e.preventDefault()
            const y = e.touches[0].clientY
            const delta = scroll.touchLast - y
            scroll.targetVelocity += delta * 2.0 * scrollSpeed
            scroll.touchLast = y
        }

        const onTouchEnd = () => {
            scroll.isTouching = false
        }

        canvas.addEventListener("wheel", onWheel, { passive: false })
        canvas.addEventListener("touchstart", onTouchStart, {
            passive: true,
        })
        canvas.addEventListener("touchmove", onTouchMove, { passive: false })
        canvas.addEventListener("touchend", onTouchEnd, { passive: true })

        // Animation loop
        const tick = () => {
            rafRef.current = requestAnimationFrame(tick)

            // Smooth velocity
            scroll.currentVelocity +=
                (scroll.targetVelocity - scroll.currentVelocity) * 0.1
            scroll.targetVelocity *= 0.9

            // Tiny threshold to stop jitter
            if (Math.abs(scroll.currentVelocity) < 0.001) {
                scroll.currentVelocity = 0
            }

            const velocity = scroll.currentVelocity

            // Update each column
            for (const col of allColumns) {
                const cfg = col.config
                const isVert = cfg.direction === "vertical"
                const scrollVal =
                    velocity * 0.005 * cfg.wheelFactor * cfg.wheelDirection

                for (const tm of col.meshes) {
                    // Move meshes
                    if (isVert) {
                        tm.mesh.position.y -= scrollVal
                        // Wrap
                        tm.mesh.position.y =
                            mod(
                                tm.mesh.position.y + col.totalSpan / 2,
                                col.totalSpan
                            ) -
                            col.totalSpan / 2
                    } else {
                        tm.mesh.position.x += scrollVal
                        // Wrap
                        tm.mesh.position.x =
                            mod(
                                tm.mesh.position.x + col.totalSpan / 2,
                                col.totalSpan
                            ) -
                            col.totalSpan / 2
                    }

                    // Update scroll speed uniform
                    if (isVert) {
                        tm.material.uniforms.uScrollSpeed.value = scrollVal
                    } else {
                        tm.material.uniforms.uScrollSpeed.value = -scrollVal
                    }
                }
            }

            renderer.render(scene, camera)
        }

        rafRef.current = requestAnimationFrame(tick)

        // Resize
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                if (width === 0 || height === 0) continue
                renderer.setSize(width, height)
                camera.aspect = width / height
                camera.updateProjectionMatrix()
            }
        })
        ro.observe(container)

        // Cleanup
        return () => {
            cancelAnimationFrame(rafRef.current)
            ro.disconnect()
            canvas.removeEventListener("wheel", onWheel)
            canvas.removeEventListener("touchstart", onTouchStart)
            canvas.removeEventListener("touchmove", onTouchMove)
            canvas.removeEventListener("touchend", onTouchEnd)
            for (const col of allColumns) {
                for (const tm of col.meshes) {
                    tm.material.dispose()
                }
            }
            planeGeo.dispose()
            renderer.dispose()
        }
    }, [isCanvas, imageList, experiment, backgroundColor, scrollSpeed])

    // Placeholder for editor
    if (isCanvas) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor,
                    color: "#999",
                    fontSize: 14,
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
            >
                View preview to watch animation
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                touchAction: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    inset: 0,
                    touchAction: "none",
                    display: "block",
                }}
            />
        </div>
    )
}

InfiniteReel.defaultProps = {
    experiment: "1",
    images: [],
    backgroundColor: "#000000",
    scrollSpeed: 1,
}

addPropertyControls(InfiniteReel, {
    experiment: {
        title: "Experiment",
        type: ControlType.Enum,
        defaultValue: "1",
        options: ["1", "2", "3", "4", "5", "6"],
        optionTitles: [
            "1 — 3 Wavy Columns",
            "2 — Center + Curved Wings",
            "3 — 5 Tilted Columns",
            "4 — 6 Scattered Streams",
            "5 — 3 Horizontal Rows",
            "6 — Diamond Symmetry",
        ],
        description: "Select a carousel layout preset",
    },
    images: {
        title: "Images",
        type: ControlType.Array,
        control: {
            type: ControlType.ResponsiveImage,
        },
        description: "Add images for the carousel. Uses defaults if empty.",
    },
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#000000",
    },
    scrollSpeed: {
        title: "Scroll Speed",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        description: "Global scroll speed multiplier",
    },
})
