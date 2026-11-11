import { useRef, useEffect } from "react"
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
import { OrbitControls } from "three-stdlib"

interface Globe3DProps {
    backgroundColor: string
    textureUrl: string
    viewSize: number
    autoRotate: boolean
    rotationSpeed: number
}
/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function Globe3D(props: Globe3DProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const canvas3DRef = useRef<HTMLCanvasElement>(null)
    const globeMeshRef = useRef<THREE.Mesh>()
    const sceneRef = useRef<THREE.Scene>()
    const cameraRef = useRef<THREE.OrthographicCamera>()
    const rendererRef = useRef<THREE.WebGLRenderer>()
    const controlsRef = useRef<OrbitControls>()

    useEffect(() => {
        if (!canvas3DRef.current || !wrapperRef.current) return

        const containerEl = wrapperRef.current
        const canvas3D = canvas3DRef.current

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas3D,
            alpha: true,
        })
        renderer.setPixelRatio(2)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(props.backgroundColor)
        sceneRef.current = scene

        const camera = new THREE.OrthographicCamera(-1.1, 1.1, 1.1, -1.1, 0, 3)
        camera.position.z = 1.1
        cameraRef.current = camera

        const controls = new OrbitControls(camera, canvas3D)
        controls.enablePan = false
        controls.enableZoom = false
        controls.enableDamping = true
        controls.autoRotate = props.autoRotate
        controls.autoRotateSpeed = props.rotationSpeed
        controlsRef.current = controls

        function createGlobe() {
            const globeGeometry = new THREE.IcosahedronGeometry(1, 28)

            // placeholder globe that matches background color
            const placeholderMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(props.backgroundColor),
            })

            const globeMesh = new THREE.Mesh(globeGeometry, placeholderMaterial)
            globeMeshRef.current = globeMesh
            sceneRef.current!.add(globeMesh)

            const url =
                props.textureUrl ||
                "https://essykings.github.io/JavaScript/earth.jpg"

            new THREE.TextureLoader().load(url, (texture) => {
                globeMesh.material = new THREE.MeshBasicMaterial({
                    map: texture,
                })
                globeMesh.material.needsUpdate = true
            })
        }

        function render() {
            controls.update()
            renderer.render(scene, camera)
            requestAnimationFrame(render)
        }

        function updateSize() {
            const rect = wrapperRef.current!.getBoundingClientRect()
            const width = rect.width > 0 ? rect.width : 300
            const height = rect.height > 0 ? rect.height : 300
            const minSide = Math.min(width, height)

            renderer.setSize(minSide, minSide)

            const half = props.viewSize / 2
            camera.left = -half
            camera.right = half
            camera.top = half
            camera.bottom = -half
            camera.updateProjectionMatrix()
        }

        createGlobe()
        updateSize()
        render()

        const resizeObserver = new ResizeObserver(() =>
            setTimeout(updateSize, 100)
        )
        resizeObserver.observe(containerEl)

        return () => {
            resizeObserver.disconnect()
            renderer.dispose()
        }
    }, [])

    // ✅ Consolidated updates
    useEffect(() => {
        if (
            !sceneRef.current ||
            !globeMeshRef.current ||
            !cameraRef.current ||
            !rendererRef.current ||
            !controlsRef.current
        )
            return

        // background update
        sceneRef.current.background = new THREE.Color(props.backgroundColor)

        // texture update (fallback to default when cleared)
        const material = globeMeshRef.current
            .material as THREE.MeshBasicMaterial
        const textureLoader = new THREE.TextureLoader()
        const url =
            props.textureUrl ||
            "https://essykings.github.io/JavaScript/earth.jpg" // fallback
        textureLoader.load(url, (tex) => {
            material.map = tex
            material.needsUpdate = true
        })

        // size & camera update
        const rect = wrapperRef.current!.getBoundingClientRect()
        const width = rect.width > 0 ? rect.width : 300
        const height = rect.height > 0 ? rect.height : 300
        const minSide = Math.min(width, height)
        rendererRef.current.setSize(minSide, minSide)

        const half = props.viewSize / 2
        cameraRef.current.left = -half
        cameraRef.current.right = half
        cameraRef.current.top = half
        cameraRef.current.bottom = -half
        cameraRef.current.updateProjectionMatrix()

        // ✅ autorotate live update
        controlsRef.current.autoRotate = props.autoRotate
        controlsRef.current.autoRotateSpeed = props.rotationSpeed
    }, [
        props.backgroundColor,
        props.textureUrl,
        props.viewSize,
        props.autoRotate,
        props.rotationSpeed,
    ])

    return (
        <div
            ref={wrapperRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                background: props.backgroundColor,
            }}
        >
            <canvas ref={canvas3DRef} style={{ position: "absolute" }} />
        </div>
    )
}

addPropertyControls(Globe3D, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
        description: "Background color of the scene behind the globe",
    },
    textureUrl: {
        type: ControlType.Image,
        title: "Globe Texture",
        defaultValue: "https://essykings.github.io/JavaScript/earth.jpg",
        description: "Image texture applied to the globe’s surface",
    },
    viewSize: {
        type: ControlType.Number,
        title: "View Size",
        defaultValue: 2.2,
        min: 0.5,
        max: 5,
        step: 0.1,
        displayStepper: true,
        description:
            "Controls the zoom level / scale of the globe (larger = zoomed out)",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        description: "Enable automatic globe rotation",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        displayStepper: true,
        description: "Speed of automatic rotation (higher = faster spin)",
    },
})
