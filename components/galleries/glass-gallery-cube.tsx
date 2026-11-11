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
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
    useAdaptiveQuality,
    useSensorBus,
} from "@vectorvesper/motion/react"

gsap.registerPlugin(ScrollTrigger)

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface GlassGalleryProps {
    images: string[]
    mode?: "square" | "rect" | "quad"
    cubeSize?: number
    autoSpinSpeed?: number
    scrollSpins?: number
    mouseTiltIntensity?: number
    backgroundColor?: string
    photoOpacity?: number
    glassThickness?: number
    glassRoughness?: number
    glassOpacity?: number
    glassColor?: string
    galleryItemWidth?: number
    galleryItemHeight?: number
    gridGapX?: number
    gridGapY?: number
    borderRadius?: number
    maxDpr?: number
}

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────

const HP = Math.PI / 2

const DEFAULT_IMAGES = [
    // Models / Portraits
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
    // Food
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800",
    // Nature
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800",
    "https://images.unsplash.com/photo-1472214222555-d404758b1c42?w=800",
    // Streets
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=800",
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800",
    // Clothing / Fashion
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
]

/** Face count per layout mode */
const FACE_COUNT: Record<string, number> = { square: 6, rect: 12, quad: 24 }

// ─────────────────────────────────────────────────────
// Layout Config (pure function, no allocations on render)
// ─────────────────────────────────────────────────────

function buildLayoutConfig(
    mode: "square" | "rect" | "quad",
    cubeSize: number,
    galleryItemWidth?: number,
    galleryItemHeight?: number,
    gridGapX?: number,
    gridGapY?: number
) {
    const qO = 0.715 * cubeSize
    const bO = 1.51 * cubeSize
    const rectS: [number, number] = [2.8 * cubeSize, 1.37 * cubeSize]
    const sqS: [number, number] = [2.8 * cubeSize, 2.8 * cubeSize]
    const qdS: [number, number] = [1.37 * cubeSize, 1.37 * cubeSize]

    type RawFace = {
        basePos: [number, number, number]
        baseRot: [number, number, number]
        foldedScale: [number, number]
        texIndex: number
        col: number
        row: number
        cols: number
        rows: number
    }
    let raw: RawFace[] = []

    if (mode === "square") {
        raw = [
            {
                basePos: [-bO, 0, 0],
                baseRot: [0, -HP, 0],
                foldedScale: sqS,
                texIndex: 0,
                col: 0,
                row: 0,
                cols: 3,
                rows: 2,
            },
            {
                basePos: [0, 0, bO],
                baseRot: [0, 0, 0],
                foldedScale: sqS,
                texIndex: 1,
                col: 1,
                row: 0,
                cols: 3,
                rows: 2,
            },
            {
                basePos: [bO, 0, 0],
                baseRot: [0, HP, 0],
                foldedScale: sqS,
                texIndex: 2,
                col: 2,
                row: 0,
                cols: 3,
                rows: 2,
            },
            {
                basePos: [0, 0, -bO],
                baseRot: [0, Math.PI, 0],
                foldedScale: sqS,
                texIndex: 3,
                col: 0,
                row: 1,
                cols: 3,
                rows: 2,
            },
            {
                basePos: [0, bO, 0],
                baseRot: [-HP, 0, 0],
                foldedScale: sqS,
                texIndex: 4,
                col: 1,
                row: 1,
                cols: 3,
                rows: 2,
            },
            {
                basePos: [0, -bO, 0],
                baseRot: [HP, 0, 0],
                foldedScale: sqS,
                texIndex: 5,
                col: 2,
                row: 1,
                cols: 3,
                rows: 2,
            },
        ]
    } else if (mode === "rect") {
        raw = [
            {
                basePos: [-bO, +qO, 0],
                baseRot: [0, -HP, 0],
                foldedScale: rectS,
                texIndex: 0,
                col: 0,
                row: 0,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [-bO, -qO, 0],
                baseRot: [0, -HP, 0],
                foldedScale: rectS,
                texIndex: 6,
                col: 0,
                row: 1,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [0, +qO, bO],
                baseRot: [0, 0, 0],
                foldedScale: rectS,
                texIndex: 1,
                col: 1,
                row: 0,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [0, -qO, bO],
                baseRot: [0, 0, 0],
                foldedScale: rectS,
                texIndex: 7,
                col: 1,
                row: 1,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [bO, +qO, 0],
                baseRot: [0, HP, 0],
                foldedScale: rectS,
                texIndex: 2,
                col: 2,
                row: 0,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [bO, -qO, 0],
                baseRot: [0, HP, 0],
                foldedScale: rectS,
                texIndex: 8,
                col: 2,
                row: 1,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [0, +qO, -bO],
                baseRot: [0, Math.PI, 0],
                foldedScale: rectS,
                texIndex: 3,
                col: 3,
                row: 0,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [0, -qO, -bO],
                baseRot: [0, Math.PI, 0],
                foldedScale: rectS,
                texIndex: 9,
                col: 3,
                row: 1,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [0, bO, -qO],
                baseRot: [-HP, 0, 0],
                foldedScale: rectS,
                texIndex: 4,
                col: 4,
                row: 0,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [0, bO, +qO],
                baseRot: [-HP, 0, 0],
                foldedScale: rectS,
                texIndex: 10,
                col: 4,
                row: 1,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [0, -bO, +qO],
                baseRot: [HP, 0, 0],
                foldedScale: rectS,
                texIndex: 5,
                col: 5,
                row: 0,
                cols: 6,
                rows: 2,
            },
            {
                basePos: [0, -bO, -qO],
                baseRot: [HP, 0, 0],
                foldedScale: rectS,
                texIndex: 11,
                col: 5,
                row: 1,
                cols: 6,
                rows: 2,
            },
        ]
    } else {
        raw = [
            {
                basePos: [-bO, +qO, -qO],
                baseRot: [0, -HP, 0],
                foldedScale: qdS,
                texIndex: 0,
                col: 0,
                row: 0,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-bO, -qO, -qO],
                baseRot: [0, -HP, 0],
                foldedScale: qdS,
                texIndex: 12,
                col: 0,
                row: 2,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-bO, +qO, +qO],
                baseRot: [0, -HP, 0],
                foldedScale: qdS,
                texIndex: 1,
                col: 1,
                row: 0,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-bO, -qO, +qO],
                baseRot: [0, -HP, 0],
                foldedScale: qdS,
                texIndex: 13,
                col: 1,
                row: 2,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-qO, +qO, bO],
                baseRot: [0, 0, 0],
                foldedScale: qdS,
                texIndex: 2,
                col: 2,
                row: 0,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-qO, -qO, bO],
                baseRot: [0, 0, 0],
                foldedScale: qdS,
                texIndex: 14,
                col: 2,
                row: 2,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [+qO, +qO, bO],
                baseRot: [0, 0, 0],
                foldedScale: qdS,
                texIndex: 3,
                col: 3,
                row: 0,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [+qO, -qO, bO],
                baseRot: [0, 0, 0],
                foldedScale: qdS,
                texIndex: 15,
                col: 3,
                row: 2,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [bO, +qO, +qO],
                baseRot: [0, HP, 0],
                foldedScale: qdS,
                texIndex: 4,
                col: 4,
                row: 0,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [bO, -qO, +qO],
                baseRot: [0, HP, 0],
                foldedScale: qdS,
                texIndex: 16,
                col: 4,
                row: 2,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [bO, +qO, -qO],
                baseRot: [0, HP, 0],
                foldedScale: qdS,
                texIndex: 5,
                col: 5,
                row: 0,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [bO, -qO, -qO],
                baseRot: [0, HP, 0],
                foldedScale: qdS,
                texIndex: 17,
                col: 5,
                row: 2,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [+qO, +qO, -bO],
                baseRot: [0, Math.PI, 0],
                foldedScale: qdS,
                texIndex: 6,
                col: 6,
                row: 0,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [+qO, -qO, -bO],
                baseRot: [0, Math.PI, 0],
                foldedScale: qdS,
                texIndex: 18,
                col: 6,
                row: 2,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-qO, +qO, -bO],
                baseRot: [0, Math.PI, 0],
                foldedScale: qdS,
                texIndex: 7,
                col: 7,
                row: 0,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-qO, -qO, -bO],
                baseRot: [0, Math.PI, 0],
                foldedScale: qdS,
                texIndex: 19,
                col: 7,
                row: 2,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-qO, bO, -qO],
                baseRot: [-HP, 0, 0],
                foldedScale: qdS,
                texIndex: 8,
                col: 0,
                row: 1,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-qO, bO, +qO],
                baseRot: [-HP, 0, 0],
                foldedScale: qdS,
                texIndex: 20,
                col: 1,
                row: 1,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [+qO, bO, -qO],
                baseRot: [-HP, 0, 0],
                foldedScale: qdS,
                texIndex: 9,
                col: 2,
                row: 1,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [+qO, bO, +qO],
                baseRot: [-HP, 0, 0],
                foldedScale: qdS,
                texIndex: 21,
                col: 3,
                row: 1,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-qO, -bO, +qO],
                baseRot: [HP, 0, 0],
                foldedScale: qdS,
                texIndex: 10,
                col: 4,
                row: 1,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [-qO, -bO, -qO],
                baseRot: [HP, 0, 0],
                foldedScale: qdS,
                texIndex: 22,
                col: 5,
                row: 1,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [+qO, -bO, +qO],
                baseRot: [HP, 0, 0],
                foldedScale: qdS,
                texIndex: 11,
                col: 6,
                row: 1,
                cols: 8,
                rows: 3,
            },
            {
                basePos: [+qO, -bO, -qO],
                baseRot: [HP, 0, 0],
                foldedScale: qdS,
                texIndex: 23,
                col: 7,
                row: 1,
                cols: 8,
                rows: 3,
            },
        ]
    }

    const gX = gridGapX ?? 0.12 * cubeSize
    const gY = gridGapY ?? (mode === "rect" ? 0.13 * cubeSize : 0.12 * cubeSize)
    const cols = raw[0]?.cols || 1
    const rows = raw[0]?.rows || 1

    return raw.map((f) => {
        const w = galleryItemWidth ?? f.foldedScale[0]
        const h = galleryItemHeight ?? f.foldedScale[1]
        const startX = -((cols - 1) * (w + gX)) / 2
        const startY = ((rows - 1) * (h + gY)) / 2
        return {
            ...f,
            flatScale: [w, h] as [number, number],
            flatPos: [
                startX + f.col * (w + gX),
                startY - f.row * (h + gY),
                0,
            ] as [number, number, number],
        }
    })
}

// ─────────────────────────────────────────────────────
// Static Fallback (editor / reduced-motion / pre-mount)
// ─────────────────────────────────────────────────────

function StaticFallback({ images, backgroundColor, borderRadius }: any) {
    const list = images && images.length > 0 ? images : DEFAULT_IMAGES
    const tiles = list.slice(0, 6)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: backgroundColor || "#000",
                borderRadius: `${borderRadius ?? 16}px`,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(2, 1fr)",
                gap: "12px",
                padding: "16px",
                boxSizing: "border-box",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
            }}
        >
            {tiles.map((src: string, i: number) => (
                <div
                    key={i}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: `${Math.max(0, (borderRadius ?? 16) - 8)}px`,
                        backgroundImage: `url(${src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: "1px solid rgba(255,255,255,0.05)",
                    }}
                />
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────
// Scene state: shared mutable struct between effects
// ─────────────────────────────────────────────────────

interface FaceMesh {
    mesh: THREE.Mesh
    material: THREE.MeshPhysicalMaterial
    config: ReturnType<typeof buildLayoutConfig>[number]
}

interface SceneState {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    group: THREE.Group
    coreLight: THREE.PointLight
    glassMesh: THREE.Mesh | null
    glassMaterial: THREE.MeshPhysicalMaterial | null
    faceMeshes: FaceMesh[]
    scrollTrigger: ScrollTrigger | null
    rafId: number
    containerRect: DOMRect | null
    unfoldEnd: number
    gridHeight: number
}

// ─────────────────────────────────────────────────────
// Interactive Three.js Component
// ─────────────────────────────────────────────────────

function InteractiveGlassGallery({
    images,
    mode = "quad",
    cubeSize = 0.5,
    autoSpinSpeed = 0.15,
    scrollSpins = 1.0,
    mouseTiltIntensity = 1.0,
    backgroundColor = "#000000",
    photoOpacity = 1.0,
    glassThickness = 1.3,
    glassRoughness = 0.12,
    glassOpacity = 0.16,
    glassColor = "#ffffff",
    galleryItemWidth,
    galleryItemHeight,
    gridGapX,
    gridGapY,
    borderRadius = 16,
    maxDpr,
    qualityTier = 0,
}: GlassGalleryProps & { qualityTier?: number }) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const scrollProgressRef = React.useRef(0.0)
    const sceneRef = React.useRef<SceneState | null>(null)

    // ── VV Sensor Bus: shared page-wide pointer ──
    const bus = useSensorBus()

    // ── Stable prop refs (rAF reads, never triggers re-mount) ──
    const propsRef = React.useRef({
        autoSpinSpeed,
        scrollSpins,
        mouseTiltIntensity,
        photoOpacity,
        glassThickness,
        glassRoughness,
        glassOpacity,
        glassColor,
    })
    React.useLayoutEffect(() => {
        propsRef.current = {
            autoSpinSpeed,
            scrollSpins,
            mouseTiltIntensity,
            photoOpacity,
            glassThickness,
            glassRoughness,
            glassOpacity,
            glassColor,
        }
    })

    // ── Stable image derivation (single memo, no double-join) ──
    const activeImages = React.useMemo(
        () => (images && images.length > 0 ? images : DEFAULT_IMAGES),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [images?.join(",")]
    )

    // ── DPR cap from device tier (static for lifetime of mount) ──
    const dprCap = React.useMemo(
        () => maxDpr ?? ([2, 1.5, 1][qualityTier] || 2),
        [maxDpr, qualityTier]
    )

    // ════════════════════════════════════════════════
    // EFFECT 1 — WebGL Setup (renderer, camera, lights, rAF)
    // Runs once. Never tears down unless DPR changes (static).
    // Reads dynamic content from sceneRef.faceMeshes / glassMesh.
    // ════════════════════════════════════════════════
    React.useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const w = container.clientWidth || window.innerWidth
        const h = container.clientHeight || window.innerHeight

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
        camera.position.z = 6.6

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: qualityTier === 0,
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap))
        // Skip shader error checks in production for speed
        renderer.debug.checkShaderErrors = false

        // ── Lights ──
        scene.add(new THREE.AmbientLight(0xffffff, 0.35))
        const dir1 = new THREE.DirectionalLight(0xffffff, 1.2)
        dir1.position.set(-8, 10, -2)
        scene.add(dir1)
        const dir2 = new THREE.DirectionalLight(0xffffff, 0.7)
        dir2.position.set(8, -5, 6)
        scene.add(dir2)
        scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.4))

        const coreLight = new THREE.PointLight(0xffffff, 0, 10, 1.6)
        scene.add(coreLight)

        const group = new THREE.Group()
        scene.add(group)

        const state: SceneState = {
            scene,
            camera,
            renderer,
            group,
            coreLight,
            glassMesh: null,
            glassMaterial: null,
            faceMeshes: [],
            scrollTrigger: null,
            rafId: 0,
            containerRect: container.getBoundingClientRect(),
            unfoldEnd: 1.0,
            gridHeight: 5,
        }
        sceneRef.current = state

        // ── Debounced resize ──
        let resizeTimer: ReturnType<typeof setTimeout>
        const onResize = () => {
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                const nw = container.clientWidth || window.innerWidth
                const nh = container.clientHeight || window.innerHeight
                camera.aspect = nw / nh
                camera.updateProjectionMatrix()
                renderer.setSize(nw, nh)
                state.containerRect = container.getBoundingClientRect()
            }, 150)
        }
        window.addEventListener("resize", onResize)

        // ── Animation loop ──
        let t = 0
        let lerpedProgress = 0
        let startRotY = 0
        let hasStartedScroll = false
        let lastTime = performance.now()
        const pointer = { x: 0, y: 0 }
        let isAnimating = false
        let isIntersecting = true
        let isDocumentVisible =
            typeof document === "undefined" ? true : !document.hidden
        let intersectionObserver: IntersectionObserver | null = null

        const animate = (time: number) => {
            if (!isAnimating) return

            const delta = Math.min(0.1, (time - lastTime) / 1000)
            lastTime = time
            const d60 = delta * 60

            const p = propsRef.current

            // ── Pointer from sensor bus (page-level → container NDC) ──
            const bp = bus.state.pointer
            const rect = state.containerRect
            if (rect && rect.width > 0) {
                pointer.x = ((bp.x - rect.left) / rect.width) * 2 - 1
                pointer.y = -((bp.y - rect.top) / rect.height) * 2 + 1
            }

            // ── Damping ──
            const damping = 1.0 - Math.exp(-0.12 * d60)
            const rotDamping = 1.0 - Math.exp(-0.08 * d60)
            const glassDamping = 1.0 - Math.exp(-0.15 * d60)

            // ── Scroll progress lerp ──
            lerpedProgress +=
                (scrollProgressRef.current - lerpedProgress) * damping
            const unfoldProgress = Math.min(
                1.0,
                lerpedProgress / state.unfoldEnd
            )
            const u = 1.0 - unfoldProgress

            // ── Rotation ──
            const spinSpeed = p.autoSpinSpeed ?? 0.15
            const tilt = p.mouseTiltIntensity ?? 1.0
            const spins = p.scrollSpins ?? 1.0

            if (scrollProgressRef.current === 0) {
                if (hasStartedScroll) {
                    t = group.rotation.y / Math.max(0.01, spinSpeed)
                    hasStartedScroll = false
                }
                t += delta
            } else if (!hasStartedScroll) {
                const wr =
                    ((group.rotation.y % (Math.PI * 2)) + Math.PI * 2) %
                    (Math.PI * 2)
                group.rotation.y = wr
                startRotY = wr
                hasStartedScroll = true
            }

            const rotEase = 0.5 * (1.0 - Math.cos(u * Math.PI))
            const targetRotX =
                (0.35 + 0.1 * Math.sin(t * 0.5) - pointer.y * tilt) * rotEase
            const targetRotY =
                scrollProgressRef.current === 0
                    ? t * spinSpeed + pointer.x * tilt
                    : (startRotY + pointer.x * tilt) * rotEase +
                      (1.0 - rotEase) * (spins * Math.PI * 2)
            const targetRotZ = (0.2 + 0.08 * Math.cos(t * 0.4)) * rotEase

            group.rotation.x += (targetRotX - group.rotation.x) * rotDamping
            group.rotation.y += (targetRotY - group.rotation.y) * rotDamping
            group.rotation.z += (targetRotZ - group.rotation.z) * rotDamping

            // ── Scale ──
            const aspect = camera.aspect
            const responsiveScale = aspect < 1.0 ? Math.max(0.65, aspect) : 1.0
            const targetScale = (0.55 + 0.45 * u) * responsiveScale
            const nextScale =
                group.scale.x + (targetScale - group.scale.x) * damping
            group.scale.set(nextScale, nextScale, nextScale)

            // ── Vertical scroll panning ──
            const fovRad = (camera.fov * Math.PI) / 180
            const vpH = 2 * Math.tan(fovRad / 2) * Math.abs(camera.position.z)
            const maxScroll = Math.max(0, state.gridHeight * nextScale - vpH)

            let targetY = 0
            if (lerpedProgress >= state.unfoldEnd && state.unfoldEnd < 0.99) {
                const slideEnd =
                    state.unfoldEnd + (1.0 - state.unfoldEnd) * 0.25
                if (lerpedProgress < slideEnd) {
                    targetY =
                        ((lerpedProgress - state.unfoldEnd) /
                            Math.max(0.001, slideEnd - state.unfoldEnd)) *
                        (-maxScroll / 2)
                } else {
                    targetY =
                        -maxScroll / 2 +
                        ((lerpedProgress - slideEnd) /
                            Math.max(0.001, 1.0 - slideEnd)) *
                            maxScroll
                }
            }
            group.position.y += (targetY - group.position.y) * damping

            // ── Glass material (live from propsRef) ──
            if (state.glassMaterial) {
                const glassTargetOp =
                    scrollProgressRef.current === 0.0
                        ? (p.glassOpacity ?? 0.16)
                        : 0.0
                state.glassMaterial.opacity +=
                    (glassTargetOp - state.glassMaterial.opacity) * glassDamping
                state.glassMaterial.thickness = p.glassThickness ?? 1.3
                state.glassMaterial.roughness = p.glassRoughness ?? 0.12
                state.glassMaterial.color.set(p.glassColor ?? "#ffffff")
            }
            if (state.glassMesh) {
                const glassScale = 0.001 + 0.999 * u
                state.glassMesh.scale.set(glassScale, glassScale, glassScale)
            }

            // ── Core light ──
            coreLight.color.set(p.glassColor ?? "#ffffff")
            coreLight.intensity = 5 * u

            // ── Face meshes ──
            const opacity = p.photoOpacity ?? 1.0
            const meshes = state.faceMeshes
            for (let i = 0; i < meshes.length; i++) {
                const { mesh, material, config: fc } = meshes[i]

                const tx = (1 - u) * fc.flatPos[0] + u * fc.basePos[0]
                const ty = (1 - u) * fc.flatPos[1] + u * fc.basePos[1]
                const tz = (1 - u) * fc.flatPos[2] + u * fc.basePos[2]

                mesh.position.x += (tx - mesh.position.x) * damping
                mesh.position.y += (ty - mesh.position.y) * damping
                mesh.position.z += (tz - mesh.position.z) * damping

                const tsx = (1 - u) * (fc.flatScale[0] / fc.foldedScale[0]) + u
                const tsy = (1 - u) * (fc.flatScale[1] / fc.foldedScale[1]) + u
                mesh.scale.set(tsx, tsy, 1.0)

                mesh.rotation.x +=
                    (fc.baseRot[0] * u - mesh.rotation.x) * damping
                mesh.rotation.y +=
                    (fc.baseRot[1] * u - mesh.rotation.y) * damping
                mesh.rotation.z +=
                    (fc.baseRot[2] * u - mesh.rotation.z) * damping

                const targetOp = 1.0 - (1.0 - opacity) * u
                material.opacity += (targetOp - material.opacity) * glassDamping

                material.color.setRGB(u, u, u)
                material.emissive.setRGB(1.0 - u, 1.0 - u, 1.0 - u)
            }

            renderer.render(scene, camera)

            if (isAnimating) {
                state.rafId = requestAnimationFrame(animate)
            }
        }

        const startAnimationLoop = () => {
            if (isAnimating) return
            isAnimating = true
            lastTime = performance.now()
            state.containerRect = container.getBoundingClientRect()
            state.rafId = requestAnimationFrame(animate)
        }

        const stopAnimationLoop = () => {
            if (!isAnimating) return
            isAnimating = false
            cancelAnimationFrame(state.rafId)
            state.rafId = 0
        }

        const syncAnimationState = () => {
            if (isIntersecting && isDocumentVisible) {
                startAnimationLoop()
            } else {
                stopAnimationLoop()
            }
        }

        const onVisibilityChange = () => {
            isDocumentVisible =
                typeof document === "undefined" ? true : !document.hidden
            syncAnimationState()
        }

        if (typeof IntersectionObserver !== "undefined") {
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0]
                    isIntersecting = !!entry?.isIntersecting
                    syncAnimationState()
                },
                { threshold: 0.01 }
            )
            intersectionObserver.observe(container)
        }

        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", onVisibilityChange)
        }

        syncAnimationState()

        return () => {
            stopAnimationLoop()
            if (intersectionObserver) {
                intersectionObserver.disconnect()
                intersectionObserver = null
            }
            if (typeof document !== "undefined") {
                document.removeEventListener(
                    "visibilitychange",
                    onVisibilityChange
                )
            }
            window.removeEventListener("resize", onResize)
            clearTimeout(resizeTimer)
            renderer.dispose()
            scene.clear()
            sceneRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dprCap])

    // ════════════════════════════════════════════════
    // EFFECT 2 — Content (meshes, glass, ScrollTrigger)
    // Only tears down when images / layout fundamentals change.
    // ════════════════════════════════════════════════
    React.useEffect(() => {
        const state = sceneRef.current
        const container = containerRef.current
        if (!state || !container) return

        const { group, renderer } = state

        // ── Caches ──
        const texCache = new Map<string, THREE.Texture>()
        const geoCache = new Map<string, THREE.PlaneGeometry>()
        const loader = new THREE.TextureLoader()
        const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy())

        // ── Glass cube ──
        const glassGeo = new THREE.BoxGeometry(
            3.02 * cubeSize,
            3.02 * cubeSize,
            3.02 * cubeSize
        )
        const glassMat = new THREE.MeshPhysicalMaterial({
            transmission: 1.0,
            roughness: propsRef.current.glassRoughness ?? 0.12,
            thickness: propsRef.current.glassThickness ?? 1.3,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            ior: 1.45,
            color: new THREE.Color(propsRef.current.glassColor ?? "#ffffff"),
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            depthWrite: false,
        })
        const glassMesh = new THREE.Mesh(glassGeo, glassMat)
        group.add(glassMesh)
        state.glassMesh = glassMesh
        state.glassMaterial = glassMat

        // ── Face meshes ──
        const faceCount = FACE_COUNT[mode] ?? 24
        const imageUrls = Array.from(
            { length: faceCount },
            (_, i) => activeImages[i % activeImages.length]
        )
        const config = buildLayoutConfig(
            mode,
            cubeSize,
            galleryItemWidth,
            galleryItemHeight,
            gridGapX,
            gridGapY
        )

        const faceMeshes: FaceMesh[] = []

        for (const fc of config) {
            const url = imageUrls[fc.texIndex]

            // Texture cache
            let tex: THREE.Texture
            if (texCache.has(url)) {
                tex = texCache.get(url)!
            } else {
                tex = loader.load(url)
                tex.colorSpace = THREE.SRGBColorSpace
                tex.minFilter = THREE.LinearMipmapLinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.anisotropy = maxAniso
                tex.generateMipmaps = true
                texCache.set(url, tex)
            }

            // Geometry cache
            const geoKey = `${fc.foldedScale[0]}:${fc.foldedScale[1]}`
            let geo: THREE.PlaneGeometry
            if (geoCache.has(geoKey)) {
                geo = geoCache.get(geoKey)!
            } else {
                geo = new THREE.PlaneGeometry(
                    fc.foldedScale[0],
                    fc.foldedScale[1]
                )
                geoCache.set(geoKey, geo)
            }

            const mat = new THREE.MeshPhysicalMaterial({
                map: tex,
                emissiveMap: tex,
                emissive: new THREE.Color("#ffffff"),
                transparent: true,
                opacity: 1.0,
                side: THREE.DoubleSide,
                roughness: 1.0,
                metalness: 0.0,
                clearcoat: 0.0,
                clearcoatRoughness: 0.25,
                depthWrite: true,
                toneMapped: false,
            })

            const mesh = new THREE.Mesh(geo, mat)
            mesh.position.set(fc.basePos[0], fc.basePos[1], fc.basePos[2])
            mesh.rotation.set(fc.baseRot[0], fc.baseRot[1], fc.baseRot[2])

            group.add(mesh)
            faceMeshes.push({ mesh, material: mat, config: fc })
        }
        state.faceMeshes = faceMeshes

        // ── ScrollTrigger ──
        const rows = mode === "quad" ? 3 : 2
        const itemH =
            galleryItemHeight ?? (mode === "square" ? 2.8 : 1.37) * cubeSize
        const gY = gridGapY ?? (mode === "rect" ? 0.13 : 0.12) * cubeSize
        const gridH = rows * itemH + (rows - 1) * gY
        const visualH = gridH * 0.55
        const vpH = 5.467
        const overflow = Math.max(0, visualH - vpH)

        let scrollDepth = "100%"
        let unfoldEndVal = 1.0
        if (overflow > 0) {
            const pct = overflow / vpH
            const depth = 100 + pct * 100
            scrollDepth = `${depth}%`
            unfoldEndVal = 100 / depth
        }

        state.unfoldEnd = unfoldEndVal
        state.gridHeight = gridH

        const scrollHintEl = container.querySelector<HTMLElement>(
            "[data-gg-scroll-hint]"
        )

        const st = ScrollTrigger.create({
            trigger: container,
            start: "top top",
            end: `+=${scrollDepth}`,
            pin: true,
            pinSpacing: true,
            scrub: 0.8,
            onUpdate: (self: any) => {
                if ((ScrollTrigger as any).isRefreshing) return
                scrollProgressRef.current = self.progress
                if (scrollHintEl) {
                    scrollHintEl.style.opacity = Math.max(
                        0,
                        1 - self.progress * 4.5
                    ).toString()
                }
            },
        })
        state.scrollTrigger = st
        state.containerRect = container.getBoundingClientRect()

        // Force ScrollTrigger refresh after textures settle
        const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300)

        return () => {
            clearTimeout(refreshTimer)
            group.remove(glassMesh)
            glassGeo.dispose()
            glassMat.dispose()

            for (const fm of faceMeshes) {
                group.remove(fm.mesh)
                fm.material.dispose()
            }
            texCache.forEach((t) => t.dispose())
            geoCache.forEach((g) => g.dispose())

            st.kill()

            const s = sceneRef.current
            if (s) {
                s.glassMesh = null
                s.glassMaterial = null
                s.faceMeshes = []
                s.scrollTrigger = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        activeImages,
        mode,
        cubeSize,
        galleryItemWidth,
        galleryItemHeight,
        gridGapX,
        gridGapY,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100vh",
                backgroundColor,
                touchAction: "pan-y",
                position: "relative",
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    outline: "none",
                }}
            />

            {/* Scroll Indicator */}
            <div
                data-gg-scroll-hint=""
                style={{
                    position: "absolute",
                    bottom: 40,
                    right: 40,
                    zIndex: 20,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    pointerEvents: "none",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "monospace",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.4em",
                    transition: "opacity 0.3s ease",
                }}
            >
                <span
                    style={{
                        animation:
                            "gg-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                    }}
                >
                    Scroll to Disintegrate
                </span>
                <div
                    style={{
                        width: 1,
                        height: 40,
                        background: "rgba(255,255,255,0.1)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            height: "50%",
                            background: "white",
                            animation: "gg-bounce 2s infinite ease-in-out",
                        }}
                    />
                </div>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes gg-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }
                @keyframes gg-pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
            `,
                }}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────
// Exported Component (VV quality gates)
// ─────────────────────────────────────────────────────

export default function GlassGalleryComponent(props: GlassGalleryProps) {
    const isStatic = useIsStaticRenderer()
    const { deviceTier } = useAdaptiveQuality()

    // Static editor preview → fallback grid
    if (isStatic) {
        return <StaticFallback {...props} />
    }

    return (
        <InteractiveGlassGallery
            {...props}
            qualityTier={deviceTier}
        />
    )
}

// ─────────────────────────────────────────────────────
// Property Controls
// ─────────────────────────────────────────────────────

addPropertyControls(GlassGalleryComponent, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        defaultValue: DEFAULT_IMAGES,
    },

    // Layout
    mode: {
        type: ControlType.Enum,
        title: "Layout Mode",
        group: "Layout",
        options: ["square", "rect", "quad"],
        optionTitles: ["Square (6)", "Rect (12)", "Quad (24)"],
        defaultValue: "quad",
    },
    cubeSize: {
        type: ControlType.Number,
        title: "Cube Size",
        group: "Layout",
        min: 0.1,
        max: 2.0,
        step: 0.05,
        defaultValue: 0.5,
    },
    galleryItemWidth: {
        type: ControlType.Number,
        title: "Item Width",
        group: "Layout",
        min: 0.1,
        max: 5.0,
        step: 0.05,
    },
    galleryItemHeight: {
        type: ControlType.Number,
        title: "Item Height",
        group: "Layout",
        min: 0.1,
        max: 5.0,
        step: 0.05,
    },
    gridGapX: {
        type: ControlType.Number,
        title: "Gap X",
        group: "Layout",
        min: 0.0,
        max: 2.0,
        step: 0.01,
    },
    gridGapY: {
        type: ControlType.Number,
        title: "Gap Y",
        group: "Layout",
        min: 0.0,
        max: 2.0,
        step: 0.01,
    },

    // Motion
    autoSpinSpeed: {
        type: ControlType.Number,
        title: "Auto Spin Speed",
        group: "Motion",
        min: 0.0,
        max: 2.0,
        step: 0.05,
        defaultValue: 0.15,
    },
    scrollSpins: {
        type: ControlType.Number,
        title: "Scroll Spins",
        group: "Motion",
        min: 0.0,
        max: 5.0,
        step: 0.1,
        defaultValue: 1.0,
    },
    mouseTiltIntensity: {
        type: ControlType.Number,
        title: "Mouse Tilt",
        group: "Motion",
        min: 0.0,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.0,
    },

    // Glass Style
    glassThickness: {
        type: ControlType.Number,
        title: "Glass Thickness",
        group: "Glass Style",
        min: 0.0,
        max: 5.0,
        step: 0.1,
        defaultValue: 1.3,
    },
    glassRoughness: {
        type: ControlType.Number,
        title: "Glass Roughness",
        group: "Glass Style",
        min: 0.0,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.12,
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Opacity",
        group: "Glass Style",
        min: 0.0,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.16,
    },
    glassColor: {
        type: ControlType.Color,
        title: "Glass Color",
        group: "Glass Style",
        defaultValue: "#ffffff",
    },

    // Global Style
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        group: "Global Style",
        defaultValue: "#000000",
    },
    photoOpacity: {
        type: ControlType.Number,
        title: "Photo Opacity",
        group: "Global Style",
        min: 0.0,
        max: 1.0,
        step: 0.05,
        defaultValue: 1.0,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        group: "Global Style",
        min: 0,
        max: 40,
        defaultValue: 16,
    },

    // Performance
    maxDpr: {
        type: ControlType.Number,
        title: "Max Pixel Ratio",
        group: "Performance",
        min: 0.5,
        max: 3.0,
        step: 0.25,
        description: "Override auto-detected DPR. Lower = faster on weak GPUs.",
    },
} as any)
