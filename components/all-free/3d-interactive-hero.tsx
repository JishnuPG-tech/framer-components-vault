import React, { useRef, useEffect, useState } from "react"
import gsap from "gsap"
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


interface HeroTunnelProps {
    isDarkMode: boolean
    customImages: string[]
}

export default function HeroTunnel({
    isDarkMode = true,
    customImages = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1488161628813-99c974c76949?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1521119989659-a83eee488058?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&fit=crop",
    ],
}: HeroTunnelProps) {
    // Treat the Framer canvas the same as export/SSG: no WebGL context,
    // no rAF loop, no scroll/resize listeners. Previously this only checked
    // useIsStaticRenderer(), so the full Three.js scene (renderer, animation
    // loop, scroll + resize listeners) spun up inside the editor canvas too.
    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = isStaticRenderer || isCanvas

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const segmentsRef = useRef<THREE.Group[]>([])
    const scrollPosRef = useRef(0)

    const [imageUrls, setImageUrls] = useState<string[]>(customImages)

    useEffect(() => {
        if (isStatic) return
        if (customImages && customImages.length > 0) {
            setImageUrls(customImages)
            refreshAllSegments(customImages)
        }
    }, [customImages, isStatic])

    const TUNNEL_WIDTH = 24
    const TUNNEL_HEIGHT = 16
    const SEGMENT_DEPTH = 6
    const NUM_SEGMENTS = 14
    const FLOOR_COLS = 6
    const WALL_ROWS = 4

    const COL_WIDTH = TUNNEL_WIDTH / FLOOR_COLS
    const ROW_HEIGHT = TUNNEL_HEIGHT / WALL_ROWS

    const refreshAllSegments = (pool: string[]) => {
        segmentsRef.current.forEach((segment) => {
            const toRemove: THREE.Object3D[] = []
            segment.traverse((c) => {
                if (c.name === "slab_image") toRemove.push(c)
            })
            toRemove.forEach((c) => {
                segment.remove(c)
                if (c instanceof THREE.Mesh) {
                    c.geometry.dispose()
                    if (c.material.map) c.material.map.dispose()
                    c.material.dispose()
                }
            })
            populateImages(
                segment,
                TUNNEL_WIDTH / 2,
                TUNNEL_HEIGHT / 2,
                SEGMENT_DEPTH,
                pool
            )
        })
    }

    const populateImages = (
        group: THREE.Group,
        w: number,
        h: number,
        d: number,
        customPool = imageUrls
    ) => {
        const textureLoader = new THREE.TextureLoader()
        const cellMargin = 0.4
        const activePool = customPool.length > 0 ? customPool : imageUrls

        const addImg = (
            pos: THREE.Vector3,
            rot: THREE.Euler,
            wd: number,
            ht: number
        ) => {
            const url =
                activePool[Math.floor(Math.random() * activePool.length)]
            const geom = new THREE.PlaneGeometry(
                wd - cellMargin,
                ht - cellMargin
            )
            const mat = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
            })

            textureLoader.load(url, (tex) => {
                tex.minFilter = THREE.LinearFilter
                mat.map = tex
                mat.needsUpdate = true
                gsap.to(mat, { opacity: 0.85, duration: 1 })
            })

            const m = new THREE.Mesh(geom, mat)
            m.position.copy(pos)
            m.rotation.copy(rot)
            m.name = "slab_image"
            group.add(m)
        }

        let lastFloorIdx = -999
        for (let i = 0; i < FLOOR_COLS; i++) {
            if (i > lastFloorIdx + 1 && Math.random() > 0.8) {
                addImg(
                    new THREE.Vector3(
                        -w + i * COL_WIDTH + COL_WIDTH / 2,
                        -h,
                        -d / 2
                    ),
                    new THREE.Euler(-Math.PI / 2, 0, 0),
                    COL_WIDTH,
                    d
                )
                lastFloorIdx = i
            }
        }

        let lastCeilIdx = -999
        for (let i = 0; i < FLOOR_COLS; i++) {
            if (i > lastCeilIdx + 1 && Math.random() > 0.88) {
                addImg(
                    new THREE.Vector3(
                        -w + i * COL_WIDTH + COL_WIDTH / 2,
                        h,
                        -d / 2
                    ),
                    new THREE.Euler(Math.PI / 2, 0, 0),
                    COL_WIDTH,
                    d
                )
                lastCeilIdx = i
            }
        }

        let lastLeftIdx = -999
        for (let i = 0; i < WALL_ROWS; i++) {
            if (i > lastLeftIdx + 1 && Math.random() > 0.8) {
                addImg(
                    new THREE.Vector3(
                        -w,
                        -h + i * ROW_HEIGHT + ROW_HEIGHT / 2,
                        -d / 2
                    ),
                    new THREE.Euler(0, Math.PI / 2, 0),
                    d,
                    ROW_HEIGHT
                )
                lastLeftIdx = i
            }
        }

        let lastRightIdx = -999
        for (let i = 0; i < WALL_ROWS; i++) {
            if (i > lastRightIdx + 1 && Math.random() > 0.8) {
                addImg(
                    new THREE.Vector3(
                        w,
                        -h + i * ROW_HEIGHT + ROW_HEIGHT / 2,
                        -d / 2
                    ),
                    new THREE.Euler(0, -Math.PI / 2, 0),
                    d,
                    ROW_HEIGHT
                )
                lastRightIdx = i
            }
        }
    }

    const createSegment = (zPos: number) => {
        const group = new THREE.Group()
        group.position.z = zPos

        const w = TUNNEL_WIDTH / 2
        const h = TUNNEL_HEIGHT / 2
        const d = SEGMENT_DEPTH

        const lineMaterial = new THREE.LineBasicMaterial({
            color: isDarkMode ? 0x555555 : 0xb0b0b0,
            transparent: true,
            opacity: isDarkMode ? 0.35 : 0.5,
        })

        const lineGeo = new THREE.BufferGeometry()
        const vertices: number[] = []

        for (let i = 0; i <= FLOOR_COLS; i++) {
            const x = -w + i * COL_WIDTH
            vertices.push(x, -h, 0, x, -h, -d)
            vertices.push(x, h, 0, x, h, -d)
        }

        for (let i = 1; i < WALL_ROWS; i++) {
            const y = -h + i * ROW_HEIGHT
            vertices.push(-w, y, 0, -w, y, -d)
            vertices.push(w, y, 0, w, y, -d)
        }

        vertices.push(-w, -h, 0, w, -h, 0)
        vertices.push(-w, h, 0, w, h, 0)
        vertices.push(-w, -h, 0, -w, h, 0)
        vertices.push(w, -h, 0, w, h, 0)

        lineGeo.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3)
        )

        const lines = new THREE.LineSegments(lineGeo, lineMaterial)
        group.add(lines)

        populateImages(group, w, h, d)
        return group
    }

    useEffect(() => {
        if (isStatic || !canvasRef.current || !containerRef.current) return

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(isDarkMode ? 0x050505 : 0xffffff)
        scene.fog = new THREE.FogExp2(isDarkMode ? 0x050505 : 0xffffff, 0.035)
        sceneRef.current = scene

        const width = containerRef.current.clientWidth || window.innerWidth
        const height = containerRef.current.clientHeight || window.innerHeight

        const camera = new THREE.PerspectiveCamera(
            70,
            width / height,
            0.1,
            1000
        )
        camera.position.set(0, 0, 0)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
        })

        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        rendererRef.current = renderer

        const segments: THREE.Group[] = []
        for (let i = 0; i < NUM_SEGMENTS; i++) {
            const z = -i * SEGMENT_DEPTH
            const segment = createSegment(z)
            scene.add(segment)
            segments.push(segment)
        }
        segmentsRef.current = segments

        let frameId: number
        let isVisible = false

        const animate = () => {
            if (!isVisible) return
            frameId = requestAnimationFrame(animate)

            if (!cameraRef.current || !sceneRef.current || !rendererRef.current)
                return

            const targetZ = -scrollPosRef.current * 0.05
            const currentZ = cameraRef.current.position.z
            cameraRef.current.position.z += (targetZ - currentZ) * 0.1

            const tunnelLength = NUM_SEGMENTS * SEGMENT_DEPTH
            const camZ = cameraRef.current.position.z

            segmentsRef.current.forEach((segment) => {
                if (segment.position.z > camZ + SEGMENT_DEPTH) {
                    let minZ = 0
                    segmentsRef.current.forEach(
                        (s) => (minZ = Math.min(minZ, s.position.z))
                    )
                    segment.position.z = minZ - SEGMENT_DEPTH

                    const toRemove: THREE.Object3D[] = []
                    segment.traverse((c) => {
                        if (c.name === "slab_image") toRemove.push(c)
                    })

                    toRemove.forEach((c) => {
                        segment.remove(c)
                        if (c instanceof THREE.Mesh) {
                            c.geometry.dispose()
                            if (c.material.map) c.material.map.dispose()
                            c.material.dispose()
                        }
                    })

                    populateImages(
                        segment,
                        TUNNEL_WIDTH / 2,
                        TUNNEL_HEIGHT / 2,
                        SEGMENT_DEPTH
                    )
                }

                if (segment.position.z < camZ - tunnelLength - SEGMENT_DEPTH) {
                    let maxZ = -999999
                    segmentsRef.current.forEach(
                        (s) => (maxZ = Math.max(maxZ, s.position.z))
                    )
                    segment.position.z = maxZ + SEGMENT_DEPTH

                    const toRemove: THREE.Object3D[] = []
                    segment.traverse((c) => {
                        if (c.name === "slab_image") toRemove.push(c)
                    })

                    toRemove.forEach((c) => {
                        segment.remove(c)
                        if (c instanceof THREE.Mesh) {
                            c.geometry.dispose()
                            if (c.material.map) c.material.map.dispose()
                            c.material.dispose()
                        }
                    })

                    populateImages(
                        segment,
                        TUNNEL_WIDTH / 2,
                        TUNNEL_HEIGHT / 2,
                        SEGMENT_DEPTH
                    )
                }
            })

            rendererRef.current.render(sceneRef.current, cameraRef.current)
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting
                if (isVisible) {
                    cancelAnimationFrame(frameId)
                    animate()
                } else {
                    cancelAnimationFrame(frameId)
                }
            },
            { threshold: 0 }
        )

        observer.observe(containerRef.current)

        const onScroll = () => {
            scrollPosRef.current = window.scrollY
        }

        window.addEventListener("scroll", onScroll)

        const handleResize = () => {
            if (!containerRef.current) return
            const w = containerRef.current.clientWidth || window.innerWidth
            const h = containerRef.current.clientHeight || window.innerHeight

            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }

        window.addEventListener("resize", handleResize)

        return () => {
            observer.disconnect()
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", handleResize)
            cancelAnimationFrame(frameId)
            renderer.dispose()
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic || !sceneRef.current) return

        const bgHex = isDarkMode ? 0x050505 : 0xffffff
        const fogHex = isDarkMode ? 0x050505 : 0xffffff
        const lineHex = isDarkMode ? 0x555555 : 0xb0b0b0
        const lineOp = isDarkMode ? 0x35 : 0.5

        sceneRef.current.background = new THREE.Color(bgHex)

        if (sceneRef.current.fog) {
            ;(sceneRef.current.fog as THREE.FogExp2).color.setHex(fogHex)
        }

        segmentsRef.current.forEach((segment) => {
            segment.children.forEach((child) => {
                if (child instanceof THREE.LineSegments) {
                    const mat = child.material as THREE.LineBasicMaterial
                    mat.color.setHex(lineHex)
                    mat.opacity = lineOp
                    mat.needsUpdate = true
                }
            })
        })
    }, [isDarkMode, isStatic])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDarkMode ? "#050505" : "#ffffff",
                    color: isDarkMode ? "#ffffff" : "#000000",
                    fontFamily: "sans-serif",
                    fontSize: "14px",
                    letterSpacing: "0.05em",
                }}
            >
                Tunnel Preview (Static Mode)
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100vh",
                position: "relative",
                overflow: "hidden",
                backgroundColor: isDarkMode ? "#050505" : "#ffffff",
                transition: "background-color 0.7s ease",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    zIndex: 0,
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: "100%", display: "block" }}
                />
            </div>
        </div>
    )
}

addPropertyControls(HeroTunnel, {
    isDarkMode: {
        type: ControlType.Boolean,
        title: "Dark Mode",
        defaultValue: true,
    },
    customImages: {
        type: ControlType.Array,
        title: "Tunnel Images",
        control: {
            type: ControlType.Image,
        },
        defaultValue: [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1488161628813-99c974c76949?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1521119989659-a83eee488058?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&fit=crop",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&fit=crop",
        ],
    },
})
