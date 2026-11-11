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


export default function CustomRubberSpheres(props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const {
        colors,
        count,
        baseSize,
        sizeRandomness,
        roughness,
        clearcoat,
        lightingPreset,
        gravityAnchor,
        damping,
        bounciness,
        mouseRepulsion,
        entranceStyle,
        parallaxFactor,
        backgroundColor,
    } = props

    useEffect(() => {
        if (!containerRef.current) return

        // Setup Viewport Observer for paused rendering
        let isVisible = true
        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisible = entry.isIntersecting
                })
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(containerRef.current)

        // Setup Scene, Camera, Renderer
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
        camera.position.z = 30
        const initialCameraY = 0

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setClearColor(0x000000, 0) // Transparent to allow React background color to show
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.useLegacyLights = false
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.1
        containerRef.current.appendChild(renderer.domElement)

        // Lighting Setup based on Preset
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffe0e0, 1.5)
        scene.add(hemiLight)

        const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
        scene.add(keyLight)

        const fillLight = new THREE.DirectionalLight(0xffd0d0, 1.0)
        scene.add(fillLight)

        const rimLight = new THREE.DirectionalLight(0xffffff, 1.5)
        scene.add(rimLight)

        if (lightingPreset === "Soft Studio") {
            hemiLight.intensity = 1.5
            keyLight.intensity = 2.0
            keyLight.position.set(15, 20, 20)
            fillLight.intensity = 1.0
            fillLight.position.set(-15, -10, 15)
            rimLight.intensity = 1.5
            rimLight.position.set(0, 20, -20)
        } else if (lightingPreset === "Bright Professional") {
            hemiLight.intensity = 2.0
            hemiLight.color.setHex(0xffffff)
            hemiLight.groundColor.setHex(0xf0f0f0)
            keyLight.intensity = 1.8
            keyLight.position.set(10, 30, 20)
            fillLight.intensity = 1.2
            fillLight.position.set(-15, 0, 15)
            rimLight.intensity = 1.0
            rimLight.position.set(0, -10, -20)
        } else if (lightingPreset === "Neutral Flat") {
            hemiLight.intensity = 2.5
            keyLight.intensity = 0.5
            keyLight.position.set(0, 0, 10)
            fillLight.intensity = 0.5
            fillLight.position.set(0, 0, -10)
            rimLight.intensity = 0.0
        }

        // Geometries & Materials
        const sphereGeo = new THREE.SphereGeometry(1, 64, 64)
        const sphereMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, // Base color white, instance colors will override
            roughness: roughness,
            metalness: 0.0,
            clearcoat: clearcoat,
            clearcoatRoughness: 0.7,
            reflectivity: 0.5,
        })

        // Instanced Mesh
        const spheresMesh = new THREE.InstancedMesh(sphereGeo, sphereMat, count)
        scene.add(spheresMesh)

        // Apply Colors from Array
        const palette = colors && colors.length > 0 ? colors : ["#FFA6B9"]
        const colorObj = new THREE.Color()
        for (let i = 0; i < count; i++) {
            const randomColor =
                palette[Math.floor(Math.random() * palette.length)]
            colorObj.set(randomColor)
            spheresMesh.setColorAt(i, colorObj)
        }
        spheresMesh.instanceColor.needsUpdate = true

        // Physics Data
        const positions: THREE.Vector3[] = []
        const velocities: THREE.Vector3[] = []
        const radii: number[] = []
        const targetRadii: number[] = []
        const rotations: THREE.Quaternion[] = []
        const rotAxes: THREE.Vector3[] = []
        const rotSpeeds: number[] = []

        const dummy = new THREE.Object3D()

        for (let i = 0; i < count; i++) {
            let startX = (Math.random() - 0.5) * 20
            let startY = (Math.random() - 0.5) * 20
            let startZ = (Math.random() - 0.5) * 10

            // Converge effect: Start from a wide outer radius and get sucked in
            if (entranceStyle === "Converge") {
                const dir = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize()
                const dist = 50 + Math.random() * 30
                startX = dir.x * dist
                startY = dir.y * dist
                startZ = dir.z * dist
            }

            positions.push(new THREE.Vector3(startX, startY, startZ))
            velocities.push(new THREE.Vector3(0, 0, 0))

            const targetR =
                baseSize * (1 + (Math.random() - 0.5) * sizeRandomness)
            targetRadii.push(targetR)
            radii.push(entranceStyle === "Pop In" ? 0.001 : targetR)

            const q = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                )
            )
            rotations.push(q)
            rotAxes.push(
                new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize()
            )
            rotSpeeds.push((Math.random() - 0.5) * 0.01)
        }

        // Gravity Anchor
        let targetCenter = new THREE.Vector3(0, 0, 0)
        if (gravityAnchor === "Bottom") targetCenter.set(0, -15, 0)
        if (gravityAnchor === "Top") targetCenter.set(0, 15, 0)

        // Hardcoded Exclusions
        const attractionStrength = 5
        const mouseEffectRadius = 8

        // Mouse Interaction
        const mouse = new THREE.Vector2()
        const mousePos = new THREE.Vector3(0, 0, -9999)
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        const raycaster = new THREE.Raycaster()

        const onMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            raycaster.ray.intersectPlane(plane, mousePos)
        }

        const onMouseLeave = () => {
            mousePos.set(0, 0, -9999)
        }

        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseleave", onMouseLeave)

        // Smooth Scroll Parallax Fix
        let targetCameraY = initialCameraY
        const onScroll = () => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const elementCenterY = rect.top + rect.height / 2
            const screenCenterY = window.innerHeight / 2
            const offset =
                (elementCenterY - screenCenterY) * 0.015 * parallaxFactor
            targetCameraY = initialCameraY - offset
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        onScroll()

        // Resize Handling
        const handleResize = () => {
            if (!containerRef.current) return
            const width = containerRef.current.clientWidth
            const height = containerRef.current.clientHeight
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        }
        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(containerRef.current)
        handleResize()

        // Physics Step Function
        const stepPhysics = () => {
            for (let i = 0; i < count; i++) {
                const p = positions[i]
                const v = velocities[i]

                // Attraction to center
                const dirToCenter = targetCenter.clone().sub(p)
                v.add(dirToCenter.multiplyScalar(attractionStrength * 0.001))

                // Mouse Repulsion
                if (mousePos.z !== -9999) {
                    const distToMouse = p.distanceTo(mousePos)
                    if (distToMouse < mouseEffectRadius) {
                        const repulseDir = p.clone().sub(mousePos).normalize()
                        const force =
                            (mouseEffectRadius - distToMouse) *
                            mouseRepulsion *
                            0.005
                        v.add(repulseDir.multiplyScalar(force))
                    }
                }

                // Limit maximum velocity to prevent explosions and extreme overshoots
                if (v.length() > 4) {
                    v.setLength(4)
                }

                // Apply velocity & damping
                v.multiplyScalar(damping)
                p.add(v)

                // Subtle tumbling rotation
                const rotStep = new THREE.Quaternion().setFromAxisAngle(
                    rotAxes[i],
                    rotSpeeds[i]
                )
                rotations[i].multiply(rotStep)
            }

            // Collision Resolution
            for (let iter = 0; iter < 3; iter++) {
                for (let i = 0; i < count; i++) {
                    for (let j = i + 1; j < count; j++) {
                        const p1 = positions[i]
                        const p2 = positions[j]
                        const minDist = radii[i] + radii[j]

                        // OPTIMIZATION: Fast AABB (Bounding Box) pre-check
                        // Prevents doing expensive .distanceTo() calculation for spheres far apart
                        if (
                            Math.abs(p1.x - p2.x) > minDist ||
                            Math.abs(p1.y - p2.y) > minDist ||
                            Math.abs(p1.z - p2.z) > minDist
                        ) {
                            continue
                        }

                        const dist = p1.distanceTo(p2)

                        if (dist < minDist) {
                            const overlap = minDist - dist
                            const dir = p1.clone().sub(p2).normalize()

                            // Position correction
                            const correction = dir.multiplyScalar(overlap * 0.5)
                            p1.add(correction)
                            p2.sub(correction)

                            // Velocity correction (bounce)
                            const v1 = velocities[i]
                            const v2 = velocities[j]
                            const relVel = v1.clone().sub(v2)
                            const speed = relVel.dot(dir)

                            if (speed < 0) {
                                const restitution = 0.3 + bounciness * 0.7
                                const impulse = dir.multiplyScalar(
                                    speed * restitution
                                )
                                v1.sub(impulse)
                                v2.add(impulse)
                            }
                        }
                    }
                }
            }
        }

        // Pre-settle physics if required
        if (entranceStyle === "Pre-settled") {
            for (let i = 0; i < 150; i++) {
                stepPhysics()
            }
        }

        // Animation Loop
        let animationFrameId: number

        const animate = () => {
            if (!isStatic) {
                animationFrameId = requestAnimationFrame(animate)
            }

            // GATE: Pause Physics and Render when not in viewport
            if (!isVisible && !isStatic) return

            // Smooth parallax lerp application
            camera.position.y += (targetCameraY - camera.position.y) * 0.05

            // Pop In Animation
            if (entranceStyle === "Pop In") {
                for (let i = 0; i < count; i++) {
                    radii[i] += (targetRadii[i] - radii[i]) * 0.05
                }
            }

            stepPhysics()

            // Update Matrices
            for (let i = 0; i < count; i++) {
                dummy.position.copy(positions[i])
                dummy.quaternion.copy(rotations[i])
                dummy.scale.setScalar(radii[i])
                dummy.updateMatrix()
                spheresMesh.setMatrixAt(i, dummy.matrix)
            }

            spheresMesh.instanceMatrix.needsUpdate = true
            renderer.render(scene, camera)
        }

        animate()

        // Cleanup
        return () => {
            if (!isStatic) cancelAnimationFrame(animationFrameId)
            intersectionObserver.disconnect()
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseleave", onMouseLeave)
            window.removeEventListener("scroll", onScroll)
            resizeObserver.disconnect()
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement)
            }
            renderer.dispose()
            sphereGeo.dispose()
            sphereMat.dispose()
        }
    }, [
        // Use JSON.stringify for arrays in dependency lists to handle deep equality
        JSON.stringify(colors),
        count,
        baseSize,
        sizeRandomness,
        roughness,
        clearcoat,
        lightingPreset,
        gravityAnchor,
        damping,
        bounciness,
        mouseRepulsion,
        entranceStyle,
        parallaxFactor,
        backgroundColor,
        isStatic,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                backgroundColor: backgroundColor,
                overflow: "hidden",
            }}
        />
    )
}

CustomRubberSpheres.defaultProps = {
    colors: ["#FFA6B9", "#FFD1DC", "#ffffff"],
    count: 75,
    baseSize: 1.2,
    sizeRandomness: 0.3,
    roughness: 0.45,
    clearcoat: 0.3,
    lightingPreset: "Soft Studio",
    gravityAnchor: "Center",
    damping: 0.92,
    bounciness: 0.5,
    mouseRepulsion: 3.0,
    entranceStyle: "Pre-settled",
    parallaxFactor: 1.0,
    backgroundColor: "transparent",
}

addPropertyControls(CustomRubberSpheres, {
    colors: {
        type: ControlType.Array,
        control: {
            type: ControlType.Color,
        },
        title: "Colors",
        defaultValue: ["#FFA6B9", "#FFD1DC", "#ffffff"],
    },
    count: {
        type: ControlType.Number,
        title: "Count",
        defaultValue: 75,
        min: 10,
        max: 150, // Lowered max count to guarantee smooth performance
        step: 1,
    },
    baseSize: {
        type: ControlType.Number,
        title: "Base Size",
        defaultValue: 1.2,
        min: 0.5,
        max: 3.0,
        step: 0.1,
    },
    sizeRandomness: {
        type: ControlType.Number,
        title: "Size Randomness",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },
    roughness: {
        type: ControlType.Number,
        title: "Roughness",
        defaultValue: 0.45,
        min: 0,
        max: 1,
        step: 0.05,
    },
    clearcoat: {
        type: ControlType.Number,
        title: "Clearcoat",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },
    lightingPreset: {
        type: ControlType.Enum,
        title: "Lighting",
        options: ["Soft Studio", "Bright Professional", "Neutral Flat"],
        defaultValue: "Soft Studio",
    },
    gravityAnchor: {
        type: ControlType.Enum,
        title: "Gravity Anchor",
        options: ["Center", "Bottom", "Top"],
        defaultValue: "Center",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 0.92,
        min: 0.8,
        max: 0.99,
        step: 0.01,
    },
    bounciness: {
        type: ControlType.Number,
        title: "Bounciness",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
    mouseRepulsion: {
        type: ControlType.Number,
        title: "Mouse Force",
        defaultValue: 3.0,
        min: 0,
        max: 10,
        step: 0.5,
    },
    entranceStyle: {
        type: ControlType.Enum,
        title: "Entrance Style",
        options: ["Pre-settled", "Pop In", "Converge"],
        defaultValue: "Pre-settled",
    },
    parallaxFactor: {
        type: ControlType.Number,
        title: "Parallax",
        defaultValue: 1.0,
        min: 0,
        max: 5,
        step: 0.1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
})
