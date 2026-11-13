// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, startTransition } from "react"
// @ts-ignore
import * as THREE from "https://esm.sh/three@0.167.0"
// @ts-ignore
import { OrbitControls } from "https://esm.sh/three@0.167.0/examples/jsm/controls/OrbitControls.js?deps=three@0.167.0"

/**
 * 3D Hexagon Diagram
 *
 * A rotatable 3D diagram made of hexagonal columns.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HexagonalDiagram(props) {
    const {
        rows,
        cols,
        hexSize,
        minHeight,
        maxHeight,
        gap,
        animationMode = "wave",
        hexagonColors = {
            colorLow: "#E6D5B8",
            colorMid: "#6FB1B8",
            colorHigh: "#8B2635",
        },
        sceneColors = {
            backgroundColor: "transparent",
        },
        noiseScale,
        noiseSpeed,
        autoRotate,
        autoRotateSpeed,
        entranceAnimation,
        clickHeightMultiplier,
    } = props

    const { colorLow, colorMid, colorHigh } = hexagonColors
    const { backgroundColor } = sceneColors

    const containerRef = useRef(null)
    const [clickedHexagons, setClickedHexagons] = useState(new Set())

    useEffect(() => {
        if (!containerRef.current) return

        const container = containerRef.current
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        container.appendChild(renderer.domElement)

        const scene = new THREE.Scene()

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        )

        // Calculate grid dimensions to position camera
        const gridWidth = cols * hexSize * 1.732
        const gridDepth = rows * hexSize * 1.5
        const maxDim = Math.max(gridWidth, gridDepth)

        camera.position.set(maxDim, maxDim * 1.2, maxDim)
        camera.lookAt(0, 0, 0)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.autoRotate = autoRotate
        controls.autoRotateSpeed = autoRotateSpeed

        // Lights
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
        scene.add(hemiLight)

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
        dirLight.position.set(gridWidth / 2, maxDim, gridDepth / 2)
        dirLight.castShadow = true
        dirLight.shadow.mapSize.width = 2048
        dirLight.shadow.mapSize.height = 2048
        dirLight.shadow.camera.near = 0.5
        dirLight.shadow.camera.far = 5000
        const d = maxDim * 1.5
        dirLight.shadow.camera.left = -d
        dirLight.shadow.camera.right = d
        dirLight.shadow.camera.top = d
        dirLight.shadow.camera.bottom = -d
        scene.add(dirLight)

        // Geometry
        const geometry = new THREE.CylinderGeometry(
            hexSize * 0.95,
            hexSize * 0.95,
            1,
            6
        )
        geometry.translate(0, 0.5, 0) // Pivot at bottom

        const material = new THREE.MeshLambertMaterial({
            flatShading: true,
        })

        const count = rows * cols
        const mesh = new THREE.InstancedMesh(geometry, material, count)
        mesh.castShadow = true
        mesh.receiveShadow = true
        scene.add(mesh)

        const dummy = new THREE.Object3D()
        const color = new THREE.Color()
        const cLow = new THREE.Color(colorLow)
        const cMid = new THREE.Color(colorMid)
        const cHigh = new THREE.Color(colorHigh)

        // Raycaster for click detection
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        const handlePointerEvent = (event) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            let clientX, clientY

            // Handle both mouse and touch events
            if (event.type === "touchstart") {
                if (event.touches.length === 0) return
                clientX = event.touches[0].clientX
                clientY = event.touches[0].clientY
            } else {
                clientX = event.clientX
                clientY = event.clientY
            }

            mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObject(mesh)

            if (intersects.length > 0) {
                const instanceId = intersects[0].instanceId
                startTransition(() => {
                    setClickedHexagons((prev) => {
                        const newSet = new Set(prev)
                        if (newSet.has(instanceId)) {
                            newSet.delete(instanceId)
                        } else {
                            newSet.add(instanceId)
                        }
                        return newSet
                    })
                })
            }
        }

        container.addEventListener("click", handlePointerEvent)
        container.addEventListener("touchstart", handlePointerEvent)

        // Animation loop
        let time = 0
        let animationFrameId
        const startTime = Date.now()

        const animate = () => {
            time += 0.01 * noiseSpeed
            controls.update()

            const elapsed = (Date.now() - startTime) / 1000
            const entranceProgress = entranceAnimation
                ? Math.min(elapsed / 1.5, 1)
                : 1
            const easedEntrance = 1 - Math.pow(1 - entranceProgress, 3)

            let i = 0
            const hexW = Math.sqrt(3) * hexSize
            const hexH = 2 * hexSize
            const xSpacing = hexW + gap
            const zSpacing = hexH * 0.75 + gap

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const xOffset = (r % 2) * (xSpacing / 2)
                    const posX =
                        c * xSpacing + xOffset - (cols * xSpacing) / 2
                    const posZ = r * zSpacing - (rows * zSpacing) / 2

                    let noiseVal = 0

                    if (animationMode === "ripple") {
                        const cx = cols / 2
                        const cy = rows / 2
                        const dist = Math.sqrt(
                            Math.pow(c - cx, 2) + Math.pow(r - cy, 2)
                        )
                        const val = dist * noiseScale - time
                        noiseVal = (Math.sin(val) + 1) / 2
                    } else if (animationMode === "radial") {
                        const cx = cols / 2
                        const cy = rows / 2
                        const dist = Math.sqrt(
                            Math.pow(c - cx, 2) + Math.pow(r - cy, 2)
                        )
                        const maxDist = Math.sqrt(cx * cx + cy * cy)
                        noiseVal = (dist / maxDist + time * 0.2) % 1
                    } else if (animationMode === "spiral") {
                        const cx = cols / 2
                        const cy = rows / 2
                        const dx = c - cx
                        const dy = r - cy
                        const angle = Math.atan2(dy, dx)
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        const spiralVal = angle / (Math.PI * 2) + dist * noiseScale * 0.5 + time * 0.5
                        noiseVal = (Math.sin(spiralVal * Math.PI * 2) + 1) / 2
                    } else if (animationMode === "pulse") {
                        const pulseFreq = 2.0
                        const pulse = Math.sin(time * pulseFreq)
                        const sharpPulse = Math.pow((pulse + 1) / 2, 4) * 2 - 1
                        const cx = cols / 2
                        const cy = rows / 2
                        const dist = Math.sqrt(
                            Math.pow(c - cx, 2) + Math.pow(r - cy, 2)
                        )
                        const maxDist = Math.sqrt(cx * cx + cy * cy)
                        const distNorm = dist / maxDist
                        const wave = Math.sin(distNorm * Math.PI * 3 - time * pulseFreq)
                        const syncedBeat = sharpPulse * (1 - distNorm * 0.5) + wave * 0.3
                        noiseVal = Math.max(0, Math.min(1, (syncedBeat + 1) / 2))
                    } else {
                        const nx = c * noiseScale + time
                        const ny = r * noiseScale + time
                        noiseVal =
                            (Math.sin(nx) +
                                Math.cos(ny) +
                                Math.sin(nx * 0.5 + ny * 0.5)) /
                                3 +
                            0.5
                    }

                    // Height
                    const h =
                        (minHeight + noiseVal * (maxHeight - minHeight)) *
                        easedEntrance

                    // Apply click growth
                    let scaleMultiplier = 1
                    if (clickedHexagons.has(i)) {
                        scaleMultiplier = clickHeightMultiplier
                    }

                    dummy.position.set(posX, 0, posZ)
                    dummy.scale.set(1, Math.max(0.1, h * scaleMultiplier), 1)
                    dummy.updateMatrix()
                    mesh.setMatrixAt(i, dummy.matrix)

                    // Color
                    if (noiseVal < 0.5) {
                        color.lerpColors(cLow, cMid, noiseVal * 2)
                    } else {
                        color.lerpColors(cMid, cHigh, (noiseVal - 0.5) * 2)
                    }
                    mesh.setColorAt(i, color)

                    i++
                }
            }
            mesh.instanceMatrix.needsUpdate = true
            mesh.instanceColor.needsUpdate = true

            renderer.render(scene, camera)
            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

        // Handle resize
        const handleResize = () => {
            if (!containerRef.current) return
            const w = containerRef.current.clientWidth
            const h = containerRef.current.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }

        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(container)

        return () => {
            cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            container.removeEventListener("click", handlePointerEvent)
            container.removeEventListener("touchstart", handlePointerEvent)
            renderer.dispose()
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        rows,
        cols,
        hexSize,
        minHeight,
        maxHeight,
        gap,
        animationMode,
        colorLow,
        colorMid,
        colorHigh,
        noiseScale,
        noiseSpeed,
        backgroundColor,
        autoRotate,
        autoRotateSpeed,
        entranceAnimation,
        clickHeightMultiplier,
        clickedHexagons,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: backgroundColor,
                overflow: "hidden",
            }}
        />
    )
}

addPropertyControls(HexagonalDiagram, {
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 15,
        min: 2,
        max: 50,
        step: 1,
    },
    cols: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 15,
        min: 2,
        max: 50,
        step: 1,
    },
    hexSize: {
        type: ControlType.Number,
        title: "Hex Size",
        defaultValue: 5,
        min: 1,
        max: 20,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 0.5,
        min: 0,
        max: 5,
    },
    minHeight: {
        type: ControlType.Number,
        title: "Min Height",
        defaultValue: 5,
        min: 0,
        max: 100,
    },
    maxHeight: {
        type: ControlType.Number,
        title: "Max Height",
        defaultValue: 40,
        min: 10,
        max: 200,
    },
    animationMode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["wave", "ripple", "radial", "spiral", "pulse"],
        optionTitles: ["Wave", "Ripple", "Radial", "Spiral", "Pulse"],
        defaultValue: "wave",
        description: "Animation pattern: Wave (flowing sine waves), Ripple (expanding from center), Radial (circular gradient), Spiral (rotating pattern), Pulse (synchronized beats)",
    },
    noiseScale: {
        type: ControlType.Number,
        title: "Noise Scale",
        defaultValue: 0.3,
        min: 0.01,
        max: 1,
        step: 0.01,
    },
    noiseSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
    },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Rotate Speed",
        defaultValue: 1.0,
        min: 0,
        max: 10,
        step: 0.1,
        hidden: (props) => !props.autoRotate,
    },
    entranceAnimation: {
        type: ControlType.Boolean,
        title: "Entrance",
        defaultValue: true,
        description: "Animates hexagons growing from zero height when component first loads",
    },
    clickHeightMultiplier: {
        type: ControlType.Number,
        title: "Click Growth",
        defaultValue: 0.5,
        min: 0.1,
        max: 3,
        step: 0.1,
        description: "Height multiplier applied to hexagons when clicked (click again to toggle off)",
    },
    hexagonColors: {
        type: ControlType.Object,
        title: "Hexagon Colors",
        controls: {
            colorLow: {
                type: ControlType.Color,
                title: "Low",
                defaultValue: "#E6D5B8",
            },
            colorMid: {
                type: ControlType.Color,
                title: "Mid",
                defaultValue: "#6FB1B8",
            },
            colorHigh: {
                type: ControlType.Color,
                title: "High",
                defaultValue: "#8B2635",
            },
        },
        defaultValue: {
            colorLow: "#E6D5B8",
            colorMid: "#6FB1B8",
            colorHigh: "#8B2635",
        },
    },
    sceneColors: {
        type: ControlType.Object,
        title: "Scene Colors",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "transparent",
            },
        },
        defaultValue: {
            backgroundColor: "transparent",
        },
    },
})