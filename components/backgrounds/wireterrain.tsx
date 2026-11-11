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

// --- UTILS ---

const sanitizeColor = (c: string | THREE.Color): THREE.Color => {
    if (!c) return new THREE.Color(0xffffff)
    if (typeof c === "string") {
        if (c.startsWith("#") && c.length === 9) {
            return new THREE.Color(c.substring(0, 7))
        }
        if (c.includes("rgba")) {
            const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
            if (match) {
                return new THREE.Color(
                    `rgb(${match[1]}, ${match[2]}, ${match[3]})`
                )
            }
        }
    }
    return new THREE.Color(c)
}

const detectDeviceQuality = (): number => {
    if (typeof window === "undefined") return 1 // SSR fallback

    const cores = navigator.hardwareConcurrency || 4
    const memory = (navigator as any).deviceMemory || 8
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0
    const pixelRatio = window.devicePixelRatio || 1

    // Low-end: ≤2 cores, ≤2GB RAM, or mobile with high DPI
    if (cores <= 2 || memory <= 2 || (isMobile && pixelRatio > 2)) return 0
    // Mid-range: ≤4 cores, ≤4GB RAM, or any mobile
    if (cores <= 4 || memory <= 4 || isMobile) return 1
    // High-end
    return 2
}

// --- CLASS ---

class WireTerrainScene {
    container: HTMLElement
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    mesh: THREE.Mesh
    material: THREE.MeshBasicMaterial
    geometry: THREE.PlaneGeometry
    resizeObserver: ResizeObserver
    animationId: number | null = null
    time: number = 0

    constructor(container: HTMLElement, quality: number) {
        this.container = container

        // 1. Scene & Camera
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
        this.camera.position.z = 5

        const isCanvas = RenderTarget.current() === RenderTarget.canvas

        // 2. Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: !isCanvas && quality >= 2,
            powerPreference: isCanvas ? "low-power" : "high-performance",
            alpha: true,
        })

        // Adjust pixel ratio based on quality
        const pixelRatioMap: Record<number, number> = {
            0: 1,
            1: 1.5,
            2: Math.min(window.devicePixelRatio, 2),
        }
        const targetPixelRatio = isCanvas
            ? 1
            : (pixelRatioMap[quality as number] ?? 1.5)

        this.renderer.setPixelRatio(targetPixelRatio)

        // CSS optimization
        Object.assign(this.renderer.domElement.style, {
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
        })
        this.container.appendChild(this.renderer.domElement)

        // 3. Terrain Mesh
        this.geometry = new THREE.PlaneGeometry(40, 40, 40, 40)
        this.material = new THREE.MeshBasicMaterial({
            wireframe: true,
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.position.y = -2
        this.scene.add(this.mesh)

        // Add minimal fog
        this.scene.fog = new THREE.Fog(new THREE.Color(0x000000), 1, 20)

        // 4. Resize Observer
        this.resizeObserver = new ResizeObserver(this.handleResize)
        this.resizeObserver.observe(this.container)

        // Initial resize
        this.handleResize()
    }

    handleResize = () => {
        if (!this.container || !this.renderer || !this.camera) return
        const width = this.container.clientWidth || 400
        const height = this.container.clientHeight || 400
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(width, height)
    }

    update(props: any) {
        if (!this.scene || !this.material || !this.mesh) return

        this.scene.background = null
        this.renderer.setClearColor(0x000000, 0)

        this.material.color = sanitizeColor(props.terrainColor || "#00ff00")

        this.startAnimation(props.speed ?? 1.0)
    }

    startAnimation(speed: number) {
        if (this.animationId) cancelAnimationFrame(this.animationId)

        const animate = () => {
            if (!this.renderer || !this.scene || !this.camera || !this.mesh)
                return

            this.time += 0.01 * speed

            this.mesh.position.z = (this.time * 5) % 5

            this.renderer.render(this.scene, this.camera)
            this.animationId = requestAnimationFrame(animate)
        }
        animate()
    }

    dispose() {
        if (this.animationId) cancelAnimationFrame(this.animationId)
        this.resizeObserver.disconnect()

        if (this.container && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement)
        }

        this.renderer.dispose()
        this.geometry.dispose()
        this.material.dispose()
    }
}

/**
 * WireTerrain
 * Retro wireframe terrain animation with customizable colors and speed.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function WireTerrain(props) {
    const containerRef = React.useRef(null)
    const sceneRef = React.useRef<WireTerrainScene | null>(null)

    // Auto quality detection
    const effectiveQuality =
        props.quality === -1 ? detectDeviceQuality() : props.quality

    React.useEffect(() => {
        if (!containerRef.current) return

        const scene = new WireTerrainScene(
            containerRef.current,
            effectiveQuality
        )
        sceneRef.current = scene
        scene.update(props)

        return () => {
            scene.dispose()
            sceneRef.current = null
        }
    }, [effectiveQuality])

    React.useEffect(() => {
        if (sceneRef.current) {
            sceneRef.current.update(props)
        }
    }, [props.terrainColor, props.speed])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        />
    )
}

addPropertyControls(WireTerrain, {
    terrainColor: {
        type: ControlType.Color,
        title: "Terrain Color",
        defaultValue: "#00ff00",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1.0,
        min: 0,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        defaultValue: -1,
        options: [-1, 0, 1, 2],
        optionTitles: ["Auto", "Performance", "Balanced", "Quality"],
        description:
            "Auto detects device and adjusts for best performance. Powered by [framerhub](https://framerhub.io/)",
    },
})
