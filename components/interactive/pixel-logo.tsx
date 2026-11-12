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


// ==========================================
// INTERFACES & TYPES
// ==========================================

interface VoxelLogoProps {
    livePreview: boolean
    image: string
    maskImage?: string
    useOriginalColor: boolean
    saturation: number
    color: string
    layout?: {
        gridSize: number
        depth: number
        gridThickness: number
        gridColor: string
        logoScale: number
    }
    material?: {
        roughness: number
        metalness: number
        clearcoat: number
        clearcoatRoughness: number
        opacity: number
    }
    animation?: {
        autoPlay: boolean
        autoPlaySpeed: number
        rotationAmount: number
        enableDragRotate: boolean
        cinematicHover: boolean
        localizedEffect: boolean
        effectRadius: number
        scatterAmount: number
        chaos: number
    }
    style?: React.CSSProperties
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function Voxel3DLogo(incomingProps: VoxelLogoProps) {
    // 1. Flatten Props Architecture
    const props = {
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.material || {}),
        ...(incomingProps.animation || {}),
    }

    const mountRef = useRef<HTMLDivElement>(null)
    const isIntersecting = useRef(true)

    // ==========================================
    // WEBGL & THREE.JS LOGIC
    // ==========================================
    useEffect(() => {
        if (!mountRef.current) return

        let frameId: number
        let instancedMesh: THREE.InstancedMesh | null = null
        let geometry: THREE.BoxGeometry | null = null
        let material: THREE.MeshPhysicalMaterial | null = null
        let gridTexture: THREE.CanvasTexture | null = null
        let envMap: THREE.Texture | null = null

        const currentMount = mountRef.current

        // 1. Scene Setup
        const scene = new THREE.Scene()

        const camera = new THREE.PerspectiveCamera(
            45,
            currentMount.clientWidth / currentMount.clientHeight,
            0.1,
            1000
        )
        camera.position.set(0, 0, 25)

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        currentMount.appendChild(renderer.domElement)

        // 2. Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.2)
        scene.add(ambientLight)

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
        keyLight.position.set(10, 20, 15)
        keyLight.castShadow = true
        keyLight.shadow.mapSize.width = 1024
        keyLight.shadow.mapSize.height = 1024
        keyLight.shadow.camera.near = 0.5
        keyLight.shadow.camera.far = 50
        keyLight.shadow.bias = -0.001
        scene.add(keyLight)

        const fillLight = new THREE.DirectionalLight(0xeef5ff, 0.5)
        fillLight.position.set(-10, -5, -10)
        scene.add(fillLight)

        // Studio Environment Map for Reflective Material Properties
        const pmremGenerator = new THREE.PMREMGenerator(renderer)
        pmremGenerator.compileEquirectangularShader()

        const envScene = new THREE.Scene()
        envScene.background = new THREE.Color(0xffffff)
        const envLight1 = new THREE.DirectionalLight(0xffffff, 5)
        envLight1.position.set(5, 5, 5)
        envScene.add(envLight1)
        const envLight2 = new THREE.DirectionalLight(0xaaccff, 3)
        envLight2.position.set(-5, 0, -5)
        envScene.add(envLight2)

        envMap = pmremGenerator.fromScene(envScene).texture
        scene.environment = envMap

        // 3. Dynamic Texture Generation for Grid Lines
        const createGridTexture = () => {
            const texSize = 256
            const canvas = document.createElement("canvas")
            canvas.width = texSize
            canvas.height = texSize
            const ctx = canvas.getContext("2d")

            if (!ctx) return null

            const thickness = props.gridThickness ?? 4
            const lineWidth = (thickness / 100) * texSize

            if (props.useOriginalColor) {
                ctx.fillStyle = "#ffffff"
                ctx.fillRect(0, 0, texSize, texSize)

                if (thickness > 0) {
                    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)"
                    ctx.lineWidth = lineWidth
                    ctx.strokeRect(
                        lineWidth / 2,
                        lineWidth / 2,
                        texSize - lineWidth,
                        texSize - lineWidth
                    )
                }
            } else {
                ctx.fillStyle = props.color
                ctx.fillRect(0, 0, texSize, texSize)

                if (thickness > 0) {
                    ctx.strokeStyle = props.gridColor || "#1A84C9"
                    ctx.lineWidth = lineWidth
                    ctx.strokeRect(
                        lineWidth / 2,
                        lineWidth / 2,
                        texSize - lineWidth,
                        texSize - lineWidth
                    )
                }
            }

            const texture = new THREE.CanvasTexture(canvas)
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
            return texture
        }

        // 4. Voxel Generation Logic
        const generateVoxels = async () => {
            const size = props.gridSize || 32
            const depth = props.depth || 4

            const canvas = document.createElement("canvas")
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (!ctx) return

            const drawDefaultShape = () => {
                ctx.clearRect(0, 0, size, size)
                ctx.fillStyle = "#2CA9FF"
                ctx.beginPath()
                ctx.moveTo(size * 0.25, size * 0.2)
                ctx.lineTo(size * 0.75, size * 0.5)
                ctx.lineTo(size * 0.5, size * 0.6)
                ctx.lineTo(size * 0.4, size * 0.9)
                ctx.fill()
            }

            // Load the Base Logo Image (Acts as Shape/Alpha)
            if (props.image) {
                try {
                    const res = await fetch(props.image)
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)

                    const img = new Image()
                    img.crossOrigin = "Anonymous"
                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = url
                    })

                    const aspect = img.width / img.height
                    let drawW = size
                    let drawH = size
                    let offsetX = 0
                    let offsetY = 0

                    if (aspect > 1) {
                        drawH = size / aspect
                        offsetY = (size - drawH) / 2
                    } else {
                        drawW = size * aspect
                        offsetX = (size - drawW) / 2
                    }

                    ctx.clearRect(0, 0, size, size)
                    ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
                    URL.revokeObjectURL(url)
                } catch (e) {
                    console.warn(
                        "Failed to load image for voxelization, falling back to default shape."
                    )
                    drawDefaultShape()
                }
            } else {
                drawDefaultShape()
            }

            const imgData = ctx.getImageData(0, 0, size, size).data

            // Load the Mask/Fill Image if provided (Acts as Color)
            let maskImgData: Uint8ClampedArray | null = null
            if (props.maskImage) {
                try {
                    const maskCanvas = document.createElement("canvas")
                    maskCanvas.width = size
                    maskCanvas.height = size
                    const maskCtx = maskCanvas.getContext("2d", {
                        willReadFrequently: true,
                    })

                    if (maskCtx) {
                        const res = await fetch(props.maskImage)
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)

                        const img = new Image()
                        img.crossOrigin = "Anonymous"
                        await new Promise((resolve, reject) => {
                            img.onload = resolve
                            img.onerror = reject
                            img.src = url
                        })

                        // Mask image uses 'cover' logic to fill the bounds
                        const aspect = img.width / img.height
                        let drawW = size
                        let drawH = size
                        let offsetX = 0
                        let offsetY = 0

                        if (aspect > 1) {
                            drawW = size * aspect
                            drawH = size
                            offsetX = (size - drawW) / 2
                        } else {
                            drawW = size
                            drawH = size / aspect
                            offsetY = (size - drawH) / 2
                        }

                        maskCtx.clearRect(0, 0, size, size)
                        maskCtx.drawImage(img, offsetX, offsetY, drawW, drawH)
                        URL.revokeObjectURL(url)

                        maskImgData = maskCtx.getImageData(
                            0,
                            0,
                            size,
                            size
                        ).data
                    }
                } catch (e) {
                    console.warn("Failed to load mask image.")
                }
            }

            const positions: {
                pos: [number, number, number]
                color: THREE.Color
            }[] = []

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4
                    const alpha = imgData[i + 3]

                    if (alpha > 128) {
                        const cx = x - size / 2
                        const cy = -(y - size / 2)

                        const r =
                            (maskImgData ? maskImgData[i] : imgData[i]) / 255
                        const g =
                            (maskImgData
                                ? maskImgData[i + 1]
                                : imgData[i + 1]) / 255
                        const b =
                            (maskImgData
                                ? maskImgData[i + 2]
                                : imgData[i + 2]) / 255

                        const pixelColor = new THREE.Color(r, g, b)

                        if (
                            props.saturation !== undefined &&
                            props.saturation !== 1.0
                        ) {
                            const hsl = { h: 0, s: 0, l: 0 }
                            pixelColor.getHSL(hsl)
                            pixelColor.setHSL(
                                hsl.h,
                                Math.min(
                                    1.0,
                                    Math.max(0.0, hsl.s * props.saturation)
                                ),
                                hsl.l
                            )
                        }

                        for (let z = 0; z < depth; z++) {
                            const cz = z - depth / 2
                            positions.push({
                                pos: [cx, cy, cz],
                                color: pixelColor,
                            })
                        }
                    }
                }
            }

            if (positions.length === 0) return

            // 5. Build Instanced Mesh
            const cubeSize = 1
            geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)

            gridTexture = createGridTexture()
            const isTransparent = (props.opacity ?? 1.0) < 1.0

            material = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                map: gridTexture,
                roughness: props.roughness ?? 1.0,
                metalness: props.metalness ?? 0.0,
                clearcoat: props.clearcoat ?? 0.0,
                clearcoatRoughness: props.clearcoatRoughness ?? 0.0,
                transparent: isTransparent,
                opacity: props.opacity ?? 1.0,
            })

            // Inject Custom Cinematic Vertex Shader for Magnetic/Shatter Effect
            material.onBeforeCompile = (shader) => {
                shader.uniforms.uIntensity = { value: 0.0 }
                shader.uniforms.uHoverPoint = {
                    value: new THREE.Vector3(0, 0, 0),
                }
                shader.uniforms.uEffectRadius = {
                    value: props.effectRadius ?? 5.0,
                }
                shader.uniforms.uLocalized = {
                    value: props.localizedEffect ? 1.0 : 0.0,
                }
                shader.uniforms.uScatterAmount = {
                    value: props.scatterAmount ?? 5.0,
                }
                shader.uniforms.uChaos = { value: props.chaos ?? 0.5 }
                shader.uniforms.uTime = { value: 0.0 }

                shader.vertexShader = `
                    uniform float uIntensity;
                    uniform vec3 uHoverPoint;
                    uniform float uEffectRadius;
                    uniform float uLocalized;
                    uniform float uScatterAmount;
                    uniform float uChaos;
                    uniform float uTime;
                    ${shader.vertexShader}
                `
                shader.vertexShader = shader.vertexShader.replace(
                    `#include <begin_vertex>`,
                    `
                    #include <begin_vertex>
                    
                    // Calculate World position of the specific voxel instance
                    vec3 worldInstancePos = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
                    float dist = distance(worldInstancePos, uHoverPoint);
                    
                    // Creates a soft radial falloff boundary based on the effect radius
                    float localFactor = 1.0 - clamp(dist / uEffectRadius, 0.0, 1.0);
                    localFactor = smoothstep(0.0, 1.0, localFactor);
                    
                    // Blend between global effect and localized effect based on toggle
                    float activeFactor = mix(uIntensity, uIntensity * localFactor, uLocalized);
                    
                    // Pseudo-random generation for organic, chaotic movement per block
                    float rand = fract(sin(dot(worldInstancePos.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                    
                    // 1. Cinematic Rotation (scaled by chaos amount)
                    float angle = activeFactor * 3.14159 * (rand * 2.0 - 1.0) * uChaos;
                    float s = sin(angle);
                    float c = cos(angle);
                    
                    mat3 rotZ = mat3(
                        c, -s, 0.0,
                        s,  c, 0.0,
                        0.0, 0.0, 1.0
                    );
                    mat3 rotX = mat3(
                        1.0, 0.0, 0.0,
                        0.0, c, -s,
                        0.0, s, c
                    );
                    
                    transformed = rotZ * rotX * transformed;
                    
                    // 2. Cinematic Displacement (Magnetic Levitation & Scatter)
                    // Scale breathing speed and amplitude based on chaos amount
                    float breath = sin(uTime * (1.0 + 2.0 * uChaos) + rand * 6.28) * (0.4 * uChaos) * activeFactor;
                    
                    // Push out on Z, scatter slightly on X/Y (X/Y scaled heavily by uChaos so it can be calmed down)
                    transformed.z += activeFactor * uScatterAmount * (0.5 + rand) + breath;
                    transformed.x += activeFactor * (rand * 2.0 - 1.0) * (uScatterAmount * 0.2 * uChaos);
                    transformed.y += activeFactor * (rand * 2.0 - 1.0) * (uScatterAmount * 0.2 * uChaos);

                    // 3. Subtle Scale Shift (Blended smoothly based on chaos amount)
                    float scaleMod = mix(1.0, mix(1.0, 0.3 + rand * 0.9, uChaos), activeFactor);
                    transformed *= scaleMod;
                    `
                )
                material.userData.shader = shader
            }

            instancedMesh = new THREE.InstancedMesh(
                geometry,
                material,
                positions.length
            )
            instancedMesh.castShadow = true
            instancedMesh.receiveShadow = true

            const dummy = new THREE.Object3D()

            let maxDim = 1
            let minX = Infinity,
                maxX = -Infinity
            let minY = Infinity,
                maxY = -Infinity

            positions.forEach((item, i) => {
                if (item.pos[0] < minX) minX = item.pos[0]
                if (item.pos[0] > maxX) maxX = item.pos[0]
                if (item.pos[1] < minY) minY = item.pos[1]
                if (item.pos[1] > maxY) maxY = item.pos[1]

                dummy.position.set(item.pos[0], item.pos[1], item.pos[2])
                dummy.updateMatrix()
                instancedMesh!.setMatrixAt(i, dummy.matrix)

                if (props.useOriginalColor) {
                    instancedMesh!.setColorAt(i, item.color)
                } else {
                    instancedMesh!.setColorAt(i, new THREE.Color(0xffffff))
                }
            })

            instancedMesh.instanceMatrix.needsUpdate = true
            if (instancedMesh.instanceColor) {
                instancedMesh.instanceColor.needsUpdate = true
            }

            const sizeX = maxX - minX + 1
            const sizeY = maxY - minY + 1
            maxDim = Math.max(sizeX, sizeY)

            const baseScale = 12 / maxDim
            const finalScale = baseScale * (props.logoScale ?? 1.0)
            instancedMesh.scale.set(finalScale, finalScale, finalScale)

            scene.add(instancedMesh)
        }

        generateVoxels()

        // 6. Interactivity & Raycasting State
        let mouseX = 0
        let mouseY = 0
        let smoothMouseX = 0
        let smoothMouseY = 0
        let targetRotX = 0
        let targetRotY = 0
        let baseRotationY = 0

        // Raycasting Logic
        const raycaster = new THREE.Raycaster()
        let isPointerInside = false
        let isHovered = false
        let currentIntensity = 0

        // Drag Interaction State
        let isDragging = false
        let previousPointerX = 0
        let previousPointerY = 0
        let dragRotX = 0
        let dragRotY = 0

        const getMouseNDC = (clientX: number, clientY: number) => {
            if (!currentMount) return { x: 0, y: 0 }
            const rect = currentMount.getBoundingClientRect()
            return {
                x: ((clientX - rect.left) / rect.width) * 2 - 1,
                y: -((clientY - rect.top) / rect.height) * 2 + 1,
            }
        }

        const handlePointerDown = (event: any) => {
            if (!props.enableDragRotate || !currentMount) return

            // RAYCAST: Verify user is actually clicking ON the logo
            const ndc = getMouseNDC(event.clientX, event.clientY)
            raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera)
            const intersects = instancedMesh
                ? raycaster.intersectObject(instancedMesh)
                : []

            if (intersects.length === 0) return // Cancel drag if clicking empty space

            isDragging = true
            previousPointerX = event.clientX
            previousPointerY = event.clientY
            currentMount.setPointerCapture(event.pointerId)
        }

        const handlePointerMove = (event: any) => {
            if (!currentMount) return

            if (isDragging && props.enableDragRotate) {
                const deltaX = event.clientX - previousPointerX
                const deltaY = event.clientY - previousPointerY
                dragRotY += deltaX * 0.01
                dragRotX += deltaY * 0.01
                previousPointerX = event.clientX
                previousPointerY = event.clientY
            }

            const ndc = getMouseNDC(event.clientX, event.clientY)
            mouseX = ndc.x
            mouseY = ndc.y
        }

        const handlePointerUp = (event: any) => {
            if (isDragging && currentMount) {
                isDragging = false
                currentMount.releasePointerCapture(event.pointerId)
            }
        }

        const handlePointerEnter = () => {
            isPointerInside = true
        }
        const handlePointerLeave = () => {
            isPointerInside = false
        }

        currentMount.addEventListener("pointerdown", handlePointerDown)
        currentMount.addEventListener("pointerenter", handlePointerEnter)
        currentMount.addEventListener("pointerleave", handlePointerLeave)
        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)

        // 7. Viewport Gating & Resize Logic
        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isIntersecting.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(currentMount)

        const resizeObserver = new ResizeObserver(() => {
            if (!currentMount) return
            const width = currentMount.clientWidth
            const height = currentMount.clientHeight
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        })
        resizeObserver.observe(currentMount)

        // 8. Animation Loop
        const animate = () => {
            frameId = requestAnimationFrame(animate)

            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !props.livePreview) return
            if (!isIntersecting.current) return

            if (instancedMesh) {
                // Raycast checking exclusively to the 3D model
                let hit: THREE.Intersection | null = null
                if (isPointerInside && !isDragging) {
                    raycaster.setFromCamera(
                        new THREE.Vector2(mouseX, mouseY),
                        camera
                    )
                    const intersects = raycaster.intersectObject(instancedMesh)
                    if (intersects.length > 0) hit = intersects[0]
                }

                // Freeze hover state if actively dragging the model
                if (!isDragging) isHovered = !!hit

                // Dynamically update cursor when hovering exactly over voxels
                if (currentMount && !isDragging) {
                    currentMount.style.cursor = isHovered
                        ? props.enableDragRotate
                            ? "grab"
                            : "pointer"
                        : "default"
                } else if (currentMount && isDragging) {
                    currentMount.style.cursor = "grabbing"
                }

                if (hit && material?.userData.shader) {
                    material.userData.shader.uniforms.uHoverPoint.value.copy(
                        hit.point
                    )
                }

                // Auto Play Rotation
                if (props.autoPlay && !isDragging) {
                    baseRotationY += (props.autoPlaySpeed ?? 1.0) * 0.02
                }

                // Smoothly pull toward mouse ONLY when exactly hovering logo
                const targetMX = isHovered ? mouseX : 0
                const targetMY = isHovered ? mouseY : 0
                smoothMouseX += (targetMX - smoothMouseX) * 0.1
                smoothMouseY += (targetMY - smoothMouseY) * 0.1

                // Combine accumulated rotations
                targetRotY =
                    baseRotationY +
                    dragRotY +
                    (!isDragging
                        ? smoothMouseX * (props.rotationAmount || 0)
                        : 0)
                targetRotX =
                    dragRotX +
                    (!isDragging
                        ? -smoothMouseY * (props.rotationAmount || 0)
                        : 0)

                // Smooth interpolation for rotation
                instancedMesh.rotation.y +=
                    (targetRotY - instancedMesh.rotation.y) * 0.05
                instancedMesh.rotation.x +=
                    (targetRotX - instancedMesh.rotation.x) * 0.05

                // Handle Cinematic Shader Uniform Updates
                if (material?.userData.shader) {
                    const targetIntensity =
                        isHovered && props.cinematicHover ? 1.0 : 0.0
                    currentIntensity +=
                        (targetIntensity - currentIntensity) * 0.08 // Smooth ease transition

                    material.userData.shader.uniforms.uIntensity.value =
                        currentIntensity
                    material.userData.shader.uniforms.uLocalized.value =
                        props.localizedEffect ? 1.0 : 0.0
                    material.userData.shader.uniforms.uEffectRadius.value =
                        props.effectRadius ?? 5.0
                    material.userData.shader.uniforms.uScatterAmount.value =
                        props.scatterAmount ?? 5.0
                    material.userData.shader.uniforms.uChaos.value =
                        props.chaos ?? 0.5
                    material.userData.shader.uniforms.uTime.value =
                        performance.now() * 0.001
                }
            }

            renderer.render(scene, camera)
        }

        animate()

        // 9. STRICT WEBGL CLEANUP ROUTINE
        return () => {
            cancelAnimationFrame(frameId)

            if (currentMount) {
                currentMount.removeEventListener(
                    "pointerdown",
                    handlePointerDown
                )
                currentMount.removeEventListener(
                    "pointerenter",
                    handlePointerEnter
                )
                currentMount.removeEventListener(
                    "pointerleave",
                    handlePointerLeave
                )
            }
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)

            intersectionObserver.disconnect()
            resizeObserver.disconnect()

            if (instancedMesh) {
                scene.remove(instancedMesh)
                instancedMesh.dispose()
            }
            if (geometry) geometry.dispose()
            if (gridTexture) gridTexture.dispose()

            if (material) {
                if (material.map) material.map.dispose()
                material.dispose()
            }

            if (envMap) envMap.dispose()
            if (pmremGenerator) pmremGenerator.dispose()

            scene.clear()

            // ESSENTIAL FOR FRAMER HOT-RELOADING: Free GPU memory
            renderer.forceContextLoss()
            renderer.dispose()

            if (currentMount && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement)
            }
        }
    }, [
        props.image,
        props.maskImage,
        props.useOriginalColor,
        props.saturation,
        props.color,
        props.gridSize,
        props.depth,
        props.gridThickness,
        props.gridColor,
        props.logoScale,
        props.roughness,
        props.metalness,
        props.clearcoat,
        props.clearcoatRoughness,
        props.opacity,
        props.autoPlay,
        props.autoPlaySpeed,
        props.rotationAmount,
        props.enableDragRotate,
        props.cinematicHover,
        props.localizedEffect,
        props.effectRadius,
        props.scatterAmount,
        props.chaos,
        props.livePreview,
    ])

    return (
        <div
            {...incomingProps}
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                touchAction: props.enableDragRotate ? "none" : "auto",
                ...incomingProps.style,
            }}
        />
    )
}

// ==========================================
// DEFAULT PROPS
// ==========================================
Voxel3DLogo.defaultProps = {
    livePreview: true,
    image: "",
    maskImage: "",
    useOriginalColor: true,
    saturation: 1.0,
    color: "#2CA9FF",
    layout: {
        gridSize: 32,
        depth: 5,
        gridThickness: 4,
        gridColor: "#1A84C9",
        logoScale: 1.0,
    },
    material: {
        roughness: 1.0,
        metalness: 0.0,
        clearcoat: 0.0,
        clearcoatRoughness: 0.0,
        opacity: 1.0,
    },
    animation: {
        autoPlay: true,
        autoPlaySpeed: 1.0,
        rotationAmount: 0.5,
        enableDragRotate: true,
        cinematicHover: true,
        localizedEffect: false,
        effectRadius: 5.0,
        scatterAmount: 6.0,
        chaos: 0.5,
    },
}

// ==========================================
// FRAMER PROPERTY CONTROLS
// ==========================================
addPropertyControls(Voxel3DLogo, {
    livePreview: {
        title: "Live Preview",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    image: {
        title: "Logo Image",
        type: ControlType.Image,
        description: "Upload a transparent PNG or SVG to voxelize.",
    },
    maskImage: {
        title: "Fill Image",
        type: ControlType.Image,
        description:
            "Replaces the logo's color with this image. Requires 'Use Logo Color' to be True.",
        hidden: (props) => props.useOriginalColor === false,
    },
    useOriginalColor: {
        title: "Use Logo Color",
        type: ControlType.Boolean,
        defaultValue: true,
        description:
            "Uses the image's original colors and creates dark simulated lines automatically.",
    },
    saturation: {
        title: "Saturation",
        type: ControlType.Number,
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 1.0,
        description: "Adjust image color saturation (1 = original).",
        hidden: (props) => props.useOriginalColor === false,
    },
    color: {
        title: "Voxel Color",
        type: ControlType.Color,
        defaultValue: "#2CA9FF",
        hidden: (props) => props.useOriginalColor === true,
    },
    layout: {
        title: "Layout & Shape",
        type: ControlType.Object,
        controls: {
            logoScale: {
                title: "Scale",
                type: ControlType.Number,
                min: 0.1,
                max: 5,
                step: 0.1,
                defaultValue: 1.0,
                description: "Overall size of the 3D logo.",
            },
            gridSize: {
                title: "Grid Detail",
                type: ControlType.Number,
                min: 16,
                max: 120,
                step: 1,
                defaultValue: 32,
                description: "Higher = smaller blocks, more detail.",
            },
            depth: {
                title: "Depth",
                type: ControlType.Number,
                min: 1,
                max: 20,
                step: 1,
                defaultValue: 5,
            },
            gridThickness: {
                title: "Line Thickness",
                type: ControlType.Number,
                min: 0,
                max: 20,
                step: 0.5,
                defaultValue: 4,
                description: "Thickness of the simulated grid lines.",
            },
            gridColor: {
                title: "Line Color",
                type: ControlType.Color,
                defaultValue: "#1A84C9",
            },
        },
    },
    material: {
        title: "Material (Reflective)",
        type: ControlType.Object,
        controls: {
            roughness: {
                title: "Roughness",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 1.0,
                description:
                    "Keep high for matte, drop to 0 for glossy/chrome.",
            },
            metalness: {
                title: "Metalness",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.0,
                description: "Turn up to simulate true metal reflections.",
            },
            clearcoat: {
                title: "Clearcoat",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.0,
            },
            clearcoatRoughness: {
                title: "Coat Rough",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.0,
            },
            opacity: {
                title: "Opacity",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 1.0,
                description: "Controls transparency level of the blocks.",
            },
        },
    },
    animation: {
        title: "Animation",
        type: ControlType.Object,
        controls: {
            autoPlay: {
                title: "Auto Play",
                type: ControlType.Boolean,
                defaultValue: true,
                description: "Continuously rotate the logo.",
            },
            autoPlaySpeed: {
                title: "Play Speed",
                type: ControlType.Number,
                min: -5,
                max: 5,
                step: 0.1,
                defaultValue: 1.0,
            },
            enableDragRotate: {
                title: "Drag to Rotate",
                type: ControlType.Boolean,
                defaultValue: true,
                description:
                    "Allow the user to click and drag to spin the logo.",
            },
            rotationAmount: {
                title: "Hover React",
                type: ControlType.Number,
                min: 0,
                max: 2,
                step: 0.1,
                defaultValue: 0.5,
                description: "How much it tilts towards the mouse on hover.",
            },
            cinematicHover: {
                title: "Cinematic Hover",
                type: ControlType.Boolean,
                defaultValue: true,
                description:
                    "Adds a dynamic magnetic scatter & levitation effect.",
            },
            scatterAmount: {
                title: "Scatter Lift",
                type: ControlType.Number,
                min: 1,
                max: 30,
                step: 0.5,
                defaultValue: 6.0,
                description: "How far the blocks push out toward the camera.",
                hidden: (props) => !props.cinematicHover,
            },
            chaos: {
                title: "Effect Chaos",
                type: ControlType.Number,
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 0.5,
                description:
                    "Dial back to calm the rotation and jitter of pixels down.",
                hidden: (props) => !props.cinematicHover,
            },
            localizedEffect: {
                title: "Localized FX",
                type: ControlType.Boolean,
                defaultValue: false,
                description: "Effect only happens on blocks near the cursor.",
                hidden: (props) => !props.cinematicHover,
            },
            effectRadius: {
                title: "FX Radius",
                type: ControlType.Number,
                min: 1,
                max: 20,
                step: 0.1,
                defaultValue: 5.0,
                hidden: (props) =>
                    !props.cinematicHover || !props.localizedEffect,
            },
        },
    },
})
