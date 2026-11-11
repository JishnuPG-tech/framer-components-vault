import * as React from "react"
import { useEffect, useRef } from "react"
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

export default function QuantumMorphingMatrix(props) {
    const mountRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        // 1. Static Fallback & Master Toggle
        if (
            typeof window === "undefined" ||
            !mountRef.current ||
            isStatic ||
            !props.enablePreview
        )
            return

        // 2. Scene Setup
        const scene = new THREE.Scene()
        scene.fog = new THREE.FogExp2(props.bgColor, props.fogDensity)

        const camera = new THREE.PerspectiveCamera(
            60,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        )
        camera.position.z = 12

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight
        )
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.domElement.style.filter = `drop-shadow(0px 0px ${props.glowIntensity}px ${props.colorSphere})`
        mountRef.current.appendChild(renderer.domElement)

        // 3. Mathematical Pre-Calculation of States
        const particleCount = props.particleCount

        // Memory Buffers for the 3 States
        const posCloud = new Float32Array(particleCount * 3)
        const posSphere = new Float32Array(particleCount * 3)
        const posHelix = new Float32Array(particleCount * 3)

        const colCloud = new Float32Array(particleCount * 3)
        const colSphere = new Float32Array(particleCount * 3)
        const colHelix = new Float32Array(particleCount * 3)

        const cCloud = new THREE.Color(props.colorCloud)
        const cSphere = new THREE.Color(props.colorSphere)
        const cHelix = new THREE.Color(props.colorHelix)

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3

            // STATE 0: QUANTUM CLOUD (Chaos)
            posCloud[i3] = (Math.random() - 0.5) * 20
            posCloud[i3 + 1] = (Math.random() - 0.5) * 20
            posCloud[i3 + 2] = (Math.random() - 0.5) * 20
            colCloud[i3] = cCloud.r
            colCloud[i3 + 1] = cCloud.g
            colCloud[i3 + 2] = cCloud.b

            // STATE 1: FIBONACCI SPHERE (Order)
            const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount)
            const theta = Math.PI * (1 + Math.sqrt(5)) * i
            const rSphere = 4.5
            posSphere[i3] = rSphere * Math.cos(theta) * Math.sin(phi)
            posSphere[i3 + 1] = rSphere * Math.sin(theta) * Math.sin(phi)
            posSphere[i3 + 2] = rSphere * Math.cos(phi)
            colSphere[i3] = cSphere.r
            colSphere[i3 + 1] = cSphere.g
            colSphere[i3 + 2] = cSphere.b

            // STATE 2: DATA HELIX (Biology/Structure)
            const t = i / particleCount
            const helixRadius = 2.5
            const helixHeight = 16.0
            const helixTwists = 4.0
            const angle = t * Math.PI * 2 * helixTwists
            const strandOffset = i % 2 === 0 ? 0 : Math.PI

            posHelix[i3] = Math.cos(angle + strandOffset) * helixRadius
            posHelix[i3 + 1] = (t - 0.5) * helixHeight
            posHelix[i3 + 2] = Math.sin(angle + strandOffset) * helixRadius
            colHelix[i3] = cHelix.r
            colHelix[i3 + 1] = cHelix.g
            colHelix[i3 + 2] = cHelix.b
        }

        // Active Geometry Setup (Starts as Cloud)
        const geometry = new THREE.BufferGeometry()
        const currentPositions = new Float32Array(posCloud)
        const currentColors = new Float32Array(colCloud)

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(currentPositions, 3)
        )
        geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(currentColors, 3)
        )

        const material = new THREE.PointsMaterial({
            size: props.particleSize,
            vertexColors: true,
            transparent: true,
            opacity: props.particleOpacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })

        const particleSystem = new THREE.Points(geometry, material)
        scene.add(particleSystem)

        // 4. Morphing State Management
        let currentState = 0
        let targetState = 0
        let morphProgress = 1.0

        const stateTimer = setInterval(() => {
            currentState = targetState
            targetState = (targetState + 1) % 3
            morphProgress = 0.0
        }, props.morphInterval * 1000)

        function getTargetArrays(state) {
            if (state === 0) return { p: posCloud, c: colCloud }
            if (state === 1) return { p: posSphere, c: colSphere }
            return { p: posHelix, c: colHelix }
        }

        // Cubic Easing for buttery smooth transitions
        function easeInOutCubic(x) {
            return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
        }

        // 5. Interaction Variables
        let mouseX = 0,
            mouseY = 0
        let isVisible = false

        const onMouseMove = (e) => {
            if (!isVisible) return
            const rect = mountRef.current?.getBoundingClientRect()
            if (!rect) return
            mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1
        }
        window.addEventListener("mousemove", onMouseMove)

        // 6. Animation Loop
        let animationFrameId: number
        const clock = new THREE.Clock()

        const animate = () => {
            if (!isVisible) return
            animationFrameId = requestAnimationFrame(animate)
            const delta = clock.getDelta()
            const time = clock.getElapsedTime()

            // Interpolation Logic
            if (morphProgress < 1.0) {
                morphProgress += delta * props.morphSpeed
                if (morphProgress > 1.0) morphProgress = 1.0
            }

            const easeProgress = easeInOutCubic(morphProgress)
            const posAttr = geometry.attributes.position
            const colAttr = geometry.attributes.color
            const curP = posAttr.array as Float32Array
            const curC = colAttr.array as Float32Array

            const startArrays = getTargetArrays(currentState)
            const endArrays = getTargetArrays(targetState)

            // Extremely fast vertex array update loop
            for (let i = 0; i < particleCount * 3; i++) {
                curP[i] =
                    startArrays.p[i] +
                    (endArrays.p[i] - startArrays.p[i]) * easeProgress
                curC[i] =
                    startArrays.c[i] +
                    (endArrays.c[i] - startArrays.c[i]) * easeProgress
            }

            posAttr.needsUpdate = true
            colAttr.needsUpdate = true

            // Global Rotation Physics
            particleSystem.rotation.y = time * props.spinSpeed

            // Add extra vertical spin only when it forms the Helix
            if (targetState === 2) {
                particleSystem.rotation.x +=
                    (time * (props.spinSpeed * 0.5) -
                        particleSystem.rotation.x) *
                    0.05
            } else {
                particleSystem.rotation.x +=
                    (0 - particleSystem.rotation.x) * 0.05
            }

            // Camera Parallax
            camera.position.x +=
                (mouseX * props.parallaxStrength - camera.position.x) * 0.05
            camera.position.y +=
                (-mouseY * props.parallaxStrength - camera.position.y) * 0.05
            camera.lookAt(0, 0, 0)

            renderer.render(scene, camera)
        }

        // 7. Observer & Resize
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                isVisible = entry.isIntersecting
                if (isVisible) animate()
                else cancelAnimationFrame(animationFrameId)
            })
        })
        observer.observe(mountRef.current)

        const onResize = () => {
            if (!mountRef.current || !isVisible) return
            camera.aspect =
                mountRef.current.clientWidth / mountRef.current.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(
                mountRef.current.clientWidth,
                mountRef.current.clientHeight
            )
        }
        window.addEventListener("resize", onResize)
        const resizeObserver = new ResizeObserver(onResize)
        resizeObserver.observe(mountRef.current)

        // 8. Cleanup
        return () => {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("resize", onResize)
            clearInterval(stateTimer)
            observer.disconnect()
            resizeObserver.disconnect()
            cancelAnimationFrame(animationFrameId)

            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement)
            }
            geometry.dispose()
            material.dispose()
            renderer.dispose()
        }
    }, [
        props.bgColor,
        props.colorCloud,
        props.colorSphere,
        props.colorHelix,
        props.particleCount,
        props.particleSize,
        props.particleOpacity,
        props.glowIntensity,
        props.spinSpeed,
        props.morphInterval,
        props.morphSpeed,
        props.parallaxStrength,
        props.fogDensity,
        props.enablePreview,
        isStatic,
    ])

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                background: props.bgColor,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...props.style,
            }}
        >
            {/* Conditional Static Fallback */}
            {(isStatic || !props.enablePreview) && (
                <div
                    style={{
                        color: props.colorSphere,
                        opacity: 0.8,
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        padding: "12px 24px",
                        border: `1px solid ${props.colorSphere}`,
                        borderRadius: "100px",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    {isStatic
                        ? "Morphing Matrix (Static Mode)"
                        : "3D Preview Disabled"}
                </div>
            )}
        </div>
    )
}

// --- Default Props ---
QuantumMorphingMatrix.defaultProps = {
    enablePreview: false,
    bgColor: "#000002",
    colorCloud: "#4B0082", // Deep Indigo
    colorSphere: "#00E5FF", // Cyan
    colorHelix: "#FF0055", // Pink
    particleCount: 12000, // Balanced for 60fps across most devices
    particleSize: 0.04,
    particleOpacity: 0.8,
    glowIntensity: 30,
    spinSpeed: 0.1,
    morphInterval: 4.0, // Time between transformations (seconds)
    morphSpeed: 0.4, // How fast the particles fly to their new positions
    parallaxStrength: 2.0,
    fogDensity: 0.03,
}

// --- Framer Property Controls ---
addPropertyControls(QuantumMorphingMatrix, {
    // Rendering
    enablePreview: {
        type: ControlType.Boolean,
        title: "Enable 3D Render",
    },
    particleOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Neon Glow",
        min: 0,
        max: 80,
        step: 1,
    },
    fogDensity: {
        type: ControlType.Number,
        title: "Depth Fog",
        min: 0,
        max: 0.1,
        step: 0.01,
    },

    // Colors
    bgColor: {
        type: ControlType.Color,
        title: "Background",
    },
    colorCloud: {
        type: ControlType.Color,
        title: "Cloud Color",
    },
    colorSphere: {
        type: ControlType.Color,
        title: "Sphere Color",
    },
    colorHelix: {
        type: ControlType.Color,
        title: "Helix Color",
    },

    // Particles
    particleCount: {
        type: ControlType.Number,
        title: "Node Count",
        min: 2000,
        max: 25000,
        step: 1000,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Node Size",
        min: 0.01,
        max: 0.1,
        step: 0.005,
    },

    // Animation / Motion
    morphInterval: {
        type: ControlType.Number,
        title: "State Duration (s)",
        min: 2,
        max: 10,
        step: 0.5,
    },
    morphSpeed: {
        type: ControlType.Number,
        title: "Morph Speed",
        min: 0.1,
        max: 2.0,
        step: 0.1,
    },
    spinSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        min: 0,
        max: 1,
        step: 0.05,
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax Tilt",
        min: 0,
        max: 5,
        step: 0.1,
    },
})
