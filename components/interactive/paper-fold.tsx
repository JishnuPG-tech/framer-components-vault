import React, { useRef, useEffect, useState } from "react"
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
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function CurvedShader(props) {
    const {
        image = {
            src: "https://picsum.photos/1024/512?random=1",
            alt: "Default curved image",
        },
        stiffness = 0.05,
        damping = 0.7,
        bendSensitivity = 15.0,
    } = props

    const mountRef = useRef(null)
    const propsRef = useRef(props)
    const isStatic = useIsStaticRenderer()
    const [isInView, setIsInView] = useState(true)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        propsRef.current = props
    }, [props])

    // Intersection Observer for viewport detection
    useEffect(() => {
        if (!mountRef.current || isStatic) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsInView(entry.isIntersecting)
                })
            },
            { threshold: 0 }
        )

        observer.observe(mountRef.current)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    // Document visibility detection
    useEffect(() => {
        if (isStatic) return

        const handleVisibilityChange = () => {
            setIsVisible(document.visibilityState === "visible")
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [isStatic])

    useEffect(() => {
        // Skip WebGL setup for static renderer
        if (isStatic) return

        if (!mountRef.current) return

        const container = mountRef.current
        let width = container.clientWidth
        let height = container.clientHeight

        // 1. Scene & Camera Setup
        const scene = new THREE.Scene()
        const fov = 60
        const cameraZ = 14
        const camera = new THREE.PerspectiveCamera(
            fov,
            width / height,
            0.1,
            1000
        )
        camera.position.set(0, 0, cameraZ)

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(renderer.domElement)

        // 2. Initial Setup Variables
        let geometry = new THREE.PlaneGeometry(1, 1, 64, 64)
        let basePositions = null
        let currentImageAspect = 1

        const material = new THREE.MeshStandardMaterial({
            side: THREE.DoubleSide,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
        })

        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // --- THE FIX: DYNAMIC SIZING ---
        // Calculates the exact 3D dimensions to mimic "object-fit: cover"
        const updatePlaneSize = (imgAspect, contW, contH) => {
            // Calculate how high and wide the camera can see at Z=0
            const vFov = (fov * Math.PI) / 180
            const visibleHeight = 2 * Math.tan(vFov / 2) * cameraZ
            const visibleWidth = visibleHeight * (contW / contH)

            let planeW, planeH

            // object-fit: cover logic
            if (imgAspect > contW / contH) {
                // Image is wider than container
                planeH = visibleHeight
                planeW = visibleHeight * imgAspect
            } else {
                // Image is taller than container
                planeW = visibleWidth
                planeH = planeW / imgAspect
            }

            // Replace geometry with the newly calculated bounds
            geometry.dispose()
            geometry = new THREE.PlaneGeometry(planeW, planeH, 64, 64)
            mesh.geometry = geometry
            basePositions = Float32Array.from(
                geometry.attributes.position.array
            )
        }

        // 3. Load Image and apply sizing
        const textureLoader = new THREE.TextureLoader()
        textureLoader.setCrossOrigin("anonymous")

        const imageUrl = image?.src || "https://picsum.photos/1024/512?random=1"

        const imageTexture = textureLoader.load(imageUrl, (loadedTexture) => {
            currentImageAspect =
                loadedTexture.image.naturalWidth /
                loadedTexture.image.naturalHeight
            updatePlaneSize(
                currentImageAspect,
                container.clientWidth,
                container.clientHeight
            )
        })

        imageTexture.colorSpace = THREE.SRGBColorSpace
        material.map = imageTexture

        // 4. Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.8))
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
        dirLight.position.set(5, 10, 10)
        scene.add(dirLight)

        // 5. Physics Tracking
        const mouse = new THREE.Vector2(0, 0)
        const prevMouse = new THREE.Vector2(0, 0)
        const currentBend = new THREE.Vector2(0, 0)
        const bendVelocity = new THREE.Vector2(0, 0)

        let animationFrameId

        const handleMouseMove = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener("mousemove", handleMouseMove)

        // 6. Animation Loop
        const animate = () => {
            // Pause rendering when not in view or not visible
            if (!isInView || !isVisible) {
                animationFrameId = requestAnimationFrame(animate)
                return
            }

            animationFrameId = requestAnimationFrame(animate)

            const { stiffness, damping, bendSensitivity } = propsRef.current

            const mouseVelocityX = mouse.x - prevMouse.x
            const mouseVelocityY = mouse.y - prevMouse.y

            const maxBend = 0.8
            let targetBendX = Math.max(
                -maxBend,
                Math.min(maxBend, mouseVelocityX * bendSensitivity)
            )
            let targetBendY = Math.max(
                -maxBend,
                Math.min(maxBend, mouseVelocityY * bendSensitivity)
            )

            // Spring Physics
            const forceX = (targetBendX - currentBend.x) * stiffness
            const forceY = (targetBendY - currentBend.y) * stiffness

            bendVelocity.x += forceX
            bendVelocity.y += forceY
            bendVelocity.x *= damping
            bendVelocity.y *= damping
            currentBend.x += bendVelocity.x
            currentBend.y += bendVelocity.y

            prevMouse.x = mouse.x
            prevMouse.y = mouse.y

            if (basePositions) {
                const positions = geometry.attributes.position

                for (let i = 0; i < positions.count; i++) {
                    const origX = basePositions[i * 3]
                    const origY = basePositions[i * 3 + 1]

                    let newX = origX
                    let newY = origY
                    let newZ = 0

                    if (Math.abs(currentBend.x) > 0.0001) {
                        const radiusX = 1 / currentBend.x
                        const thetaX = origX / radiusX
                        newX = radiusX * Math.sin(thetaX)
                        newZ += radiusX * Math.cos(thetaX) - radiusX
                    }

                    if (Math.abs(currentBend.y) > 0.0001) {
                        const radiusY = 1 / currentBend.y
                        const thetaY = origY / radiusY
                        newY = radiusY * Math.sin(thetaY)
                        newZ += radiusY * Math.cos(thetaY) - radiusY
                    }

                    positions.setXYZ(i, newX, newY, newZ)
                }

                positions.needsUpdate = true
                geometry.computeVertexNormals()

                mesh.rotation.y = currentBend.x * 0.4
                mesh.rotation.x = -currentBend.y * 0.4
            }

            renderer.render(scene, camera)
        }

        animate()

        // 7. Handle Framer Canvas Resize
        const resizeObserver = new ResizeObserver(() => {
            if (!container) return
            width = container.clientWidth
            height = container.clientHeight
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)

            // Recalculate geometry so it always covers the new container size!
            if (currentImageAspect) {
                updatePlaneSize(currentImageAspect, width, height)
            }
        })
        resizeObserver.observe(container)

        // 8. Cleanup Memory
        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener("mousemove", handleMouseMove)
            resizeObserver.disconnect()

            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement)
            }

            geometry.dispose()
            material.dispose()
            imageTexture.dispose()
            renderer.dispose()
        }
    }, [image?.src, isStatic, isInView, isVisible])

    // Render static fallback for canvas/export contexts
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img
                    src={image?.src || "https://picsum.photos/1024/512?random=1"}
                    alt={image?.alt || "Curved image"}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={mountRef}
            style={{ width: "100%", height: "100%", cursor: "grab" }}
        />
    )
}

addPropertyControls(CurvedShader, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        min: 0.01,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.05,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 0.1,
        max: 0.99,
        step: 0.01,
        defaultValue: 0.7,
    },
    bendSensitivity: {
        type: ControlType.Number,
        title: "Sensitivity",
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 15.0,
    },
})
