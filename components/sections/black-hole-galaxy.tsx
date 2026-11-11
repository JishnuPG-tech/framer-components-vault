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


/**
 * PREMIUM BLACK HOLE GALAXY - Optimized Version
 */

export default function PremiumBlackHoleGalaxy(incomingProps) {
    // STEP 1: Intercept & Flatten
    const props = {
        ...incomingProps,
        ...(incomingProps.appearance || {}),
        ...(incomingProps.geometry || {}),
        ...(incomingProps.effects || {}),
        ...(incomingProps.cameraSettings || {}),
    }

    const mountRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // Store mutable props natively to update Settings smoothly
    const propsRef = useRef(props)
    propsRef.current = props

    useEffect(() => {
        if (!mountRef.current) return

        const shouldRenderStatic = isStatic && !props.livePreview
        let animationFrameId: number
        let isIntersecting = true

        const width = mountRef.current.clientWidth
        const height = mountRef.current.clientHeight

        // Performance Optimization: Reduce particle count significantly in the editor
        // but maintain high fidelity in the live preview/published site.
        const performanceCount = isStatic
            ? Math.min(props.particleCount, 15000)
            : props.particleCount

        // 1. Core Scene Environment
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(props.backgroundColor)

        let targetX = 0,
            targetY = 0,
            currentX = 0,
            currentY = 0

        const camera = new THREE.PerspectiveCamera(
            props.fov,
            width / height,
            0.1,
            100
        )
        camera.position.set(0, props.cameraPitch, props.cameraDistance)
        camera.lookAt(0, 0, 0)

        // 2. Ultra High-Fidelity Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: !isStatic, // Disable AA in editor for speed
            alpha: true,
            powerPreference: "high-performance",
        })

        const pixelRatio = Math.min(window.devicePixelRatio, 2)
        renderer.setPixelRatio(pixelRatio)
        renderer.setSize(width, height)
        mountRef.current.appendChild(renderer.domElement)

        // 3. Shaders
        const vertexShader = `
            uniform float uTime;
            uniform float uPixelRatio;
            uniform float uSizeBase;
            uniform float uVortexSpeed;
            attribute float size;
            attribute vec3 customColor;
            attribute float aDistance;
            attribute float aAngle;
            varying vec3 vColor;
            varying float vDistance;
            varying float vAngle;
            void main() {
                vColor = customColor;
                vDistance = aDistance;
                vAngle = aAngle;
                vec3 pos = position;
                float twist = (uTime * uVortexSpeed) / (vDistance + 0.1);
                float c = cos(twist);
                float s = sin(twist);
                float newX = pos.x * c - pos.z * s;
                float newZ = pos.x * s + pos.z * c;
                pos.x = newX;
                pos.z = newZ;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * uSizeBase * uPixelRatio * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `

        const fragmentShader = `
            uniform float uTime;
            uniform float uGlowSpeed;
            uniform vec3 uCenterColor;
            uniform float uPulseSpread;
            varying vec3 vColor;
            varying float vDistance;
            varying float vAngle;
            void main() {
                vec2 pt = gl_PointCoord - vec2(0.5);
                float d = length(pt);
                float alpha = exp(-d * d * 30.0);
                float core = exp(-d * d * 150.0);
                float flowPhase = vDistance * 1.5 - vAngle * 2.0 - uTime * uGlowSpeed;
                float flowStrength = pow(sin(flowPhase) * 0.5 + 0.5, 1.0 / uPulseSpread); 
                vec3 baseColor = mix(vColor, uCenterColor, core * 0.8);
                vec3 finalColor = baseColor + (baseColor * flowStrength * 1.8);
                float finalAlpha = alpha * (0.6 + flowStrength * 0.6);
                if (finalAlpha < 0.01) discard; 
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: pixelRatio },
                uSizeBase: { value: props.particleSize },
                uGlowSpeed: { value: props.glowSpeed },
                uVortexSpeed: { value: props.vortexSpeed },
                uCenterColor: {
                    value: new THREE.Color(props.centerLightColor),
                },
                uPulseSpread: { value: props.pulseSpread },
            },
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            vertexShader,
            fragmentShader,
            transparent: true,
        })

        // 4. Generate Geometry (Optimized Count)
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(performanceCount * 3)
        const colors = new Float32Array(performanceCount * 3)
        const sizes = new Float32Array(performanceCount)
        const distances = new Float32Array(performanceCount)
        const angles = new Float32Array(performanceCount)

        const coreC = new THREE.Color(props.coreColor)
        const midC = new THREE.Color(props.midColor)
        const edgeC = new THREE.Color(props.edgeColor)

        for (let i = 0; i < performanceCount; i++) {
            const i3 = i * 3
            const r = Math.random() * props.radius
            const spinAngle = r * props.spin
            const branchAngle =
                ((i % props.branches) / props.branches) * Math.PI * 2
            const perfectAngle = branchAngle + spinAngle

            const pwr = props.randomnessPower
            const rnd = props.randomness
            const randomX =
                Math.pow(Math.random(), pwr) *
                (Math.random() < 0.5 ? 1 : -1) *
                rnd *
                r
            const randomY =
                Math.pow(Math.random(), pwr) *
                (Math.random() < 0.5 ? 1 : -1) *
                rnd *
                r *
                0.15
            const randomZ =
                Math.pow(Math.random(), pwr) *
                (Math.random() < 0.5 ? 1 : -1) *
                rnd *
                r

            positions[i3] = Math.cos(perfectAngle) * r + randomX
            positions[i3 + 1] = randomY
            positions[i3 + 2] = Math.sin(perfectAngle) * r + randomZ

            distances[i] = r
            angles[i] = perfectAngle

            const mixedColor = new THREE.Color()
            const midThreshold = props.radius * 0.35
            if (r < midThreshold) {
                mixedColor.copy(coreC).lerp(midC, r / midThreshold)
            } else {
                mixedColor
                    .copy(midC)
                    .lerp(
                        edgeC,
                        (r - midThreshold) / (props.radius - midThreshold)
                    )
            }
            colors[i3] = mixedColor.r
            colors[i3 + 1] = mixedColor.g
            colors[i3 + 2] = mixedColor.b
            sizes[i] = 0.5 + Math.random() * 0.5
        }

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        )
        geometry.setAttribute(
            "customColor",
            new THREE.BufferAttribute(colors, 3)
        )
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
        geometry.setAttribute(
            "aDistance",
            new THREE.BufferAttribute(distances, 1)
        )
        geometry.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1))

        const galaxy = new THREE.Points(geometry, material)
        scene.add(galaxy)

        // Ambient Stars (Reduced in editor)
        const ambCount = isStatic
            ? Math.min(props.backgroundStarsCount, 200)
            : props.backgroundStarsCount

        const ambGeo = new THREE.BufferGeometry()
        const ambPos = new Float32Array(ambCount * 3)
        const ambColors = new Float32Array(ambCount * 3)
        const ambSizes = new Float32Array(ambCount)
        const ambDistances = new Float32Array(ambCount)
        const ambAngles = new Float32Array(ambCount)

        for (let i = 0; i < ambCount; i++) {
            const i3 = i * 3
            const x = (Math.random() - 0.5) * 60
            const y = (Math.random() - 0.5) * 60
            const z = (Math.random() - 0.5) * 60

            ambPos[i3] = x
            ambPos[i3 + 1] = y
            ambPos[i3 + 2] = z

            // Ambient stars generic colors
            ambColors[i3] = 0.9 + Math.random() * 0.1
            ambColors[i3 + 1] = 0.9 + Math.random() * 0.1
            ambColors[i3 + 2] = 1.0

            ambSizes[i] = 0.2 + Math.random() * 0.4

            // Required for shader layout interpolation so they don't crash and disappear
            ambDistances[i] = Math.sqrt(x * x + y * y + z * z)
            ambAngles[i] = Math.atan2(z, x)
        }

        ambGeo.setAttribute("position", new THREE.BufferAttribute(ambPos, 3))
        ambGeo.setAttribute(
            "customColor",
            new THREE.BufferAttribute(ambColors, 3)
        )
        ambGeo.setAttribute("size", new THREE.BufferAttribute(ambSizes, 1))
        ambGeo.setAttribute(
            "aDistance",
            new THREE.BufferAttribute(ambDistances, 1)
        )
        ambGeo.setAttribute("aAngle", new THREE.BufferAttribute(ambAngles, 1))

        const ambStars = new THREE.Points(ambGeo, material)
        scene.add(ambStars)

        // --- Master Animation Loop ---
        const clock = new THREE.Clock()
        const tick = () => {
            if (!isIntersecting) return
            const p = propsRef.current
            const elapsedTime = clock.getElapsedTime()
            const delta = clock.getDelta()

            material.uniforms.uTime.value = elapsedTime
            material.uniforms.uSizeBase.value = p.particleSize
            material.uniforms.uGlowSpeed.value = p.glowSpeed
            material.uniforms.uVortexSpeed.value = p.vortexSpeed
            material.uniforms.uCenterColor.value.set(p.centerLightColor)
            material.uniforms.uPulseSpread.value = p.pulseSpread

            galaxy.rotation.y += delta * p.rotationSpeed
            ambStars.rotation.y += delta * p.rotationSpeed * 0.15

            currentX += (targetX - currentX) * p.parallaxDamping
            currentY += (targetY - currentY) * p.parallaxDamping

            if (p.enableParallax) {
                camera.position.x = currentX * p.parallaxStrength * 5
                camera.position.y =
                    p.cameraPitch + currentY * p.parallaxStrength * 3
            } else {
                camera.position.x = 0
                camera.position.y = p.cameraPitch
            }
            camera.position.z = p.cameraDistance
            camera.fov = p.fov
            camera.updateProjectionMatrix()
            camera.lookAt(0, 0, 0)

            renderer.render(scene, camera)
            animationFrameId = requestAnimationFrame(tick)
        }

        const observer = new IntersectionObserver(([entry]) => {
            isIntersecting = entry.isIntersecting
            if (isIntersecting && !shouldRenderStatic) tick()
        })
        observer.observe(mountRef.current)

        const resizeObserver = new ResizeObserver(() => {
            if (!mountRef.current) return
            const w = mountRef.current.clientWidth
            const h = mountRef.current.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
            if (shouldRenderStatic) renderer.render(scene, camera)
        })
        resizeObserver.observe(mountRef.current)

        const onMouseMove = (e) => {
            targetX = (e.clientX / window.innerWidth) * 2 - 1
            targetY = -(e.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener("mousemove", onMouseMove)

        if (shouldRenderStatic) {
            renderer.render(scene, camera)
        } else {
            tick()
        }

        return () => {
            observer.disconnect()
            resizeObserver.disconnect()
            window.removeEventListener("mousemove", onMouseMove)
            cancelAnimationFrame(animationFrameId)
            if (
                mountRef.current &&
                renderer.domElement.parentNode === mountRef.current
            ) {
                mountRef.current.removeChild(renderer.domElement)
            }
            geometry.dispose()
            ambGeo.dispose()
            material.dispose()
            renderer.dispose()
        }
    }, [
        props.livePreview,
        props.backgroundColor,
        props.coreColor,
        props.midColor,
        props.edgeColor,
        props.particleCount,
        props.backgroundStarsCount,
        props.radius,
        props.branches,
        props.spin,
        props.randomness,
        props.randomnessPower,
    ])

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                // These ensure the component is clickable and visible in Framer
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                background: props.backgroundColor,
            }}
        />
    )
}

// STEP 2: Default Props
PremiumBlackHoleGalaxy.defaultProps = {
    width: 400,
    height: 400,
    livePreview: false,
    appearance: {
        backgroundColor: "#000000",
        centerLightColor: "#A8A8A8",
        coreColor: "#2200FF",
        midColor: "#00039E",
        edgeColor: "#482BFF",
    },
    geometry: {
        particleCount: 50000,
        backgroundStarsCount: 800,
        radius: 7.5,
        branches: 10,
        spin: 3.5,
        randomness: 0.25,
        randomnessPower: 3,
    },
    effects: {
        particleSize: 0.25,
        glowSpeed: 1.5,
        pulseSpread: 0.8,
        vortexSpeed: -0.4,
        rotationSpeed: 0.08,
    },
    cameraSettings: {
        cameraPitch: 5,
        cameraDistance: 17,
        fov: 45,
        enableParallax: true,
        parallaxStrength: 5,
        parallaxDamping: 0.01,
    },
}

// STEP 3: UI Categorization
addPropertyControls(PremiumBlackHoleGalaxy, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: false,
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            backgroundColor: { type: ControlType.Color, title: "Background" },
            centerLightColor: { type: ControlType.Color, title: "Center Glow" },
            coreColor: { type: ControlType.Color, title: "Core Color" },
            midColor: { type: ControlType.Color, title: "Mid Color" },
            edgeColor: { type: ControlType.Color, title: "Edge Color" },
        },
    },
    geometry: {
        type: ControlType.Object,
        title: "Geometry",
        controls: {
            particleCount: {
                type: ControlType.Number,
                title: "Density",
                min: 1000,
                max: 100000,
                step: 1000,
            },
            backgroundStarsCount: {
                type: ControlType.Number,
                title: "Ambience",
                min: 0,
                max: 2000,
                step: 100,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 5,
                max: 30,
                step: 0.5,
            },
            branches: {
                type: ControlType.Number,
                title: "Arms",
                min: 2,
                max: 10,
                step: 1,
            },
            spin: {
                type: ControlType.Number,
                title: "Spin Coil",
                min: -5,
                max: 5,
                step: 0.1,
            },
            randomness: {
                type: ControlType.Number,
                title: "Scatter",
                min: 0.1,
                max: 1,
                step: 0.05,
            },
            randomnessPower: {
                type: ControlType.Number,
                title: "Scatter Bias",
                min: 1,
                max: 10,
                step: 0.1,
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Simulation",
        controls: {
            particleSize: {
                type: ControlType.Number,
                title: "Star Size",
                min: 0,
                max: 5,
                step: 0.01,
            },
            glowSpeed: {
                type: ControlType.Number,
                title: "Pulse Speed",
                min: 0,
                max: 10,
                step: 0.1,
            },
            pulseSpread: {
                type: ControlType.Number,
                title: "Pulse Spread",
                min: 0.1,
                max: 3.0,
                step: 0.1,
            },
            vortexSpeed: {
                type: ControlType.Number,
                title: "Vortex Spin",
                min: -5,
                max: 5,
                step: 0.1,
            },
            rotationSpeed: {
                type: ControlType.Number,
                title: "Turn Speed",
                min: -2,
                max: 2,
                step: 0.05,
            },
        },
    },
    cameraSettings: {
        type: ControlType.Object,
        title: "Camera & Physics",
        controls: {
            cameraPitch: {
                type: ControlType.Number,
                title: "Cam Angle",
                min: 0,
                max: 20,
            },
            cameraDistance: {
                type: ControlType.Number,
                title: "Cam Zoom",
                min: 5,
                max: 50,
            },
            fov: { type: ControlType.Number, title: "FOV", min: 20, max: 90 },
            enableParallax: {
                type: ControlType.Boolean,
                title: "Mouse Parallax",
            },
            parallaxStrength: {
                type: ControlType.Number,
                title: "Strength",
                min: 0,
                max: 5,
                step: 0.1,
                hidden: (props) => !props.enableParallax,
            },
            parallaxDamping: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 0.01,
                max: 0.2,
                step: 0.01,
                hidden: (props) => !props.enableParallax,
            },
        },
    },
})
