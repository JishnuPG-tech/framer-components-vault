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


// --- Default Curated Architectural & Minimal Imagery ---
const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=2487&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2487&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506744626753-1fa44df31c7f?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=2600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=2487&auto=format&fit=crop",
]

// --- Shaders: Pure 1:1 Color Passthrough, Cover UV Fit & Distance Fog ---
const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`

const fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float uRadius;
    uniform float uAspect;
    uniform float uImageAspect;
    uniform float uOpacity;
    uniform float uBorderWidth;
    uniform vec3 uBorderColor;
    uniform float uBorderAlpha;
    uniform float uFadeStart;
    uniform float uFadeEnd;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    // Signed Distance Field for anti-aliased rounded rectangles
    float roundedBoxSDF(vec2 p, vec2 b, float r) {
        return length(max(abs(p) - b + r, 0.0)) - r;
    }

    // Aspect-ratio cover math: eliminates geometric stretching
    vec2 getCoverUV(vec2 uv, float cardAspect, float imgAspect) {
        vec2 scale = vec2(1.0);
        if (cardAspect > imgAspect) {
            scale = vec2(1.0, imgAspect / cardAspect);
        } else {
            scale = vec2(cardAspect / imgAspect, 1.0);
        }
        return (uv - 0.5) * scale + 0.5;
    }

    void main() {
        vec2 centerUv = vUv - 0.5;
        vec2 p = vec2(centerUv.x * uAspect, centerUv.y);
        vec2 b = vec2(0.5 * uAspect, 0.5);

        float dist = roundedBoxSDF(p, b, uRadius);
        float cardAlpha = smoothstep(0.003, -0.003, dist);

        if (cardAlpha < 0.001 || uOpacity < 0.001) discard;

        // Sample texture without color shifts, sheen wash, or gamma alteration
        vec2 coverUv = getCoverUV(vUv, uAspect, uImageAspect);
        vec4 texColor = texture2D(tDiffuse, coverUv);
        vec3 finalRgb = texColor.rgb;

        // Crisp border outline stroke without tinting image pixels
        if (uBorderWidth > 0.0001 && uBorderAlpha > 0.0) {
            float innerDist = dist + uBorderWidth;
            float borderMask = smoothstep(0.003, -0.003, dist) - smoothstep(0.003, -0.003, innerDist);
            finalRgb = mix(finalRgb, uBorderColor, clamp(borderMask * uBorderAlpha, 0.0, 1.0));
        }

        // Atmospheric Distance Falloff via Transparency (Never alters RGB hues)
        float depth = -vWorldPosition.z;
        float depthFog = smoothstep(uFadeEnd, uFadeStart, depth);
        float totalAlpha = cardAlpha * uOpacity * depthFog * texColor.a;

        gl_FragColor = vec4(finalRgb, totalAlpha);
    }
`

const isVideoSource = (url) => {
    if (!url || typeof url !== "string") return false
    const cleanUrl = url.split("?")[0].toLowerCase()
    return (
        cleanUrl.endsWith(".mp4") ||
        cleanUrl.endsWith(".webm") ||
        cleanUrl.endsWith(".ogg") ||
        cleanUrl.endsWith(".mov")
    )
}

export default function Infinite3DCarousel(incomingProps) {
    // RULE 9: Intercept & Flatten Nested Props
    const props = {
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.styling || {}),
        ...(incomingProps.interaction || {}),
    }

    const mountRef = useRef(null)
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.editorPreview ?? true)

    // Store latest props without triggering unmounts
    const propsRef = useRef(props)
    useEffect(() => {
        propsRef.current = props
    }, [props])

    // Internal states stored in refs to bypass React re-renders
    const isIntersecting = useRef(false)
    const frameId = useRef(0)
    const clock = useRef(new THREE.Clock())
    const inertiaVelocity = useRef(0)
    const isPointerDown = useRef(false)
    const pointerCurrent = useRef({ x: 0, y: 0 })
    const mouseTilt = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
    const triggerStaticRender = useRef(null)

    useEffect(() => {
        if (!mountRef.current) return

        const container = mountRef.current
        let width = container.clientWidth || 300
        let height = container.clientHeight || 300

        // --- 1. Scene & Renderer Setup ---
        // Native color passthrough: no color conversion to preserve raw pixel colors
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000000, 0)
        container.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        camera.position.z = props.cameraZ / 100

        // Camera tilt pivot group
        const stageGroup = new THREE.Group()
        scene.add(stageGroup)

        // --- 2. Fallback Texture ---
        const fallbackCanvas = document.createElement("canvas")
        fallbackCanvas.width = 2
        fallbackCanvas.height = 2
        const ctx = fallbackCanvas.getContext("2d")
        ctx.fillStyle = "#1e1e24"
        ctx.fillRect(0, 0, 2, 2)
        const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas)

        // --- 3. Material & Media Assets Setup ---
        const imagesToLoad =
            props.images && props.images.length > 0
                ? props.images
                : DEFAULT_IMAGES

        const cardWidth = props.cardWidth
        const cardHeight = props.cardHeight
        const cardAspect = cardWidth / cardHeight
        const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 1, 1)

        const parsedBorderColor = new THREE.Color(
            props.borderColor || "#ffffff"
        )
        const textures = []
        const materials = []
        const videoElements = []
        let loadedMediaCount = 0
        const textureLoader = new THREE.TextureLoader()

        imagesToLoad.forEach((url, i) => {
            textures[i] = fallbackTexture

            materials[i] = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    tDiffuse: { value: fallbackTexture },
                    uRadius: { value: props.borderRadius },
                    uAspect: { value: cardAspect },
                    uImageAspect: { value: cardAspect },
                    uOpacity: { value: 1.0 },
                    uBorderWidth: { value: props.borderWidth },
                    uBorderColor: { value: parsedBorderColor },
                    uBorderAlpha: { value: props.borderAlpha },
                    uFadeStart: { value: props.fadeStart / 100 },
                    uFadeEnd: { value: props.fadeEnd / 100 },
                },
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            })

            if (isVideoSource(url)) {
                // Video Element Loader
                const video = document.createElement("video")
                video.src = url
                video.crossOrigin = "anonymous"
                video.loop = true
                video.muted = true
                video.playsInline = true
                video.autoplay = true
                video.setAttribute("playsinline", "")
                video.setAttribute("webkit-playsinline", "")

                const vidTex = new THREE.VideoTexture(video)
                vidTex.generateMipmaps = false
                vidTex.minFilter = THREE.LinearFilter
                vidTex.magFilter = THREE.LinearFilter

                textures[i] = vidTex
                materials[i].uniforms.tDiffuse.value = vidTex
                videoElements.push(video)

                video.addEventListener("loadedmetadata", () => {
                    const vw = video.videoWidth || 1
                    const vh = video.videoHeight || 1
                    materials[i].uniforms.uImageAspect.value = vw / vh
                    loadedMediaCount++
                    if (
                        loadedMediaCount === imagesToLoad.length &&
                        !shouldAnimate
                    ) {
                        renderFrame(0)
                    }
                })

                video.play().catch(() => {})
            } else {
                // Static Image Loader
                textureLoader.load(
                    url,
                    (tex) => {
                        tex.generateMipmaps = true
                        tex.minFilter = THREE.LinearMipmapLinearFilter
                        tex.magFilter = THREE.LinearFilter
                        textures[i] = tex
                        materials[i].uniforms.tDiffuse.value = tex

                        const imgW =
                            tex.image?.naturalWidth || tex.image?.width || 1
                        const imgH =
                            tex.image?.naturalHeight || tex.image?.height || 1
                        materials[i].uniforms.uImageAspect.value = imgW / imgH

                        loadedMediaCount++
                        if (
                            loadedMediaCount === imagesToLoad.length &&
                            !shouldAnimate
                        ) {
                            renderFrame(0)
                        }
                    },
                    undefined,
                    () => {
                        loadedMediaCount++
                    }
                )
            }
        })

        // --- 4. Instantiate Dual-Column Funnel Cards ---
        const items = []
        const itemCount = props.itemCount
        const halfCount = Math.floor(itemCount / 2)
        let globalImageCounter = 0

        for (let i = 0; i < itemCount; i++) {
            const side = i % 2 === 0 ? 1 : -1
            const sideIndex = Math.floor(i / 2)
            const initialProgress = sideIndex / halfCount
            const imageIndex = globalImageCounter % imagesToLoad.length

            const mesh = new THREE.Mesh(geometry, materials[imageIndex])
            stageGroup.add(mesh)
            globalImageCounter++

            items.push({
                mesh,
                side,
                progress: initialProgress,
                imageIndex,
            })
        }

        // --- 5. High Performance Render Cycle ---
        const renderFrame = (delta = 0) => {
            const currentProps = propsRef.current
            const speed = currentProps.speed * 0.12
            const spread = currentProps.curveWidth / 100
            const depth = currentProps.curveDepth / 100
            const exponent = currentProps.curveExponent
            const maxRot = currentProps.maxAngle * (Math.PI / 180)
            const minScale = currentProps.minScale
            const scaleDist = currentProps.maxScale - minScale
            const dirMultiplier = currentProps.direction === "backward" ? -1 : 1

            // Dynamic Pointer Tilt Lerping
            if (shouldAnimate) {
                mouseTilt.current.x +=
                    (mouseTilt.current.targetX - mouseTilt.current.x) * 0.08
                mouseTilt.current.y +=
                    (mouseTilt.current.targetY - mouseTilt.current.y) * 0.08
            } else {
                mouseTilt.current.x = mouseTilt.current.targetX
                mouseTilt.current.y = mouseTilt.current.targetY
            }

            const tiltIntensity = (currentProps.tiltReactivity || 0) * 0.003
            stageGroup.rotation.y = mouseTilt.current.x * tiltIntensity
            stageGroup.rotation.x = -mouseTilt.current.y * tiltIntensity

            // Inertia Physics & Velocity damping
            if (shouldAnimate) {
                inertiaVelocity.current *= Math.pow(
                    1 - currentProps.dragFriction * 0.01,
                    delta * 60
                )
                if (Math.abs(inertiaVelocity.current) < 0.00001) {
                    inertiaVelocity.current = 0
                }
            } else {
                inertiaVelocity.current = 0
            }

            // Sync shared material uniforms cleanly once per frame
            const currentBorderColor = new THREE.Color(
                currentProps.borderColor || "#ffffff"
            )
            materials.forEach((mat) => {
                mat.uniforms.uRadius.value = currentProps.borderRadius
                mat.uniforms.uBorderWidth.value = currentProps.borderWidth
                mat.uniforms.uBorderColor.value = currentBorderColor
                mat.uniforms.uBorderAlpha.value = currentProps.borderAlpha
                mat.uniforms.uFadeStart.value = currentProps.fadeStart / 100
                mat.uniforms.uFadeEnd.value = currentProps.fadeEnd / 100
            })

            // Loop cards with velocity offset
            const flowOffset = shouldAnimate
                ? speed * delta * dirMultiplier + inertiaVelocity.current
                : 0

            items.forEach((item) => {
                if (shouldAnimate || flowOffset !== 0) {
                    item.progress += flowOffset
                }

                // Smooth bi-directional wrapping
                while (item.progress > 1) {
                    item.progress -= 1
                    if (materials.length > 0) {
                        item.imageIndex =
                            globalImageCounter % imagesToLoad.length
                        item.mesh.material = materials[item.imageIndex]
                        globalImageCounter++
                    }
                }
                while (item.progress < 0) {
                    item.progress += 1
                    if (materials.length > 0) {
                        item.imageIndex =
                            (globalImageCounter + imagesToLoad.length - 1) %
                            imagesToLoad.length
                        item.mesh.material = materials[item.imageIndex]
                        globalImageCounter++
                    }
                }

                const p = Math.max(0, Math.min(1, item.progress))

                // Curvature coordinate system
                const z = -depth * (1.0 - p)
                const x = item.side * spread * Math.pow(p, exponent)
                const y =
                    Math.sin(p * Math.PI * 1.5) *
                    (currentProps.curveHeight / 200)

                item.mesh.position.set(x, y, z)

                // Progressive scale & rotation
                const s = Math.max(
                    0.001,
                    minScale + scaleDist * Math.pow(p, 2.5)
                )
                item.mesh.scale.set(s, s, s)

                // Inward orientation
                item.mesh.rotation.y = -item.side * maxRot * Math.pow(p, 0.8)
                item.mesh.rotation.z = item.side * (p * 0.08)

                // Depth Sorting for artifact-free alpha blending
                item.mesh.renderOrder = Math.floor(p * 5000)
            })

            renderer.render(scene, camera)
        }

        triggerStaticRender.current = () => renderFrame(0)

        // --- 6. Interaction Event Handlers (Drag, Inertia & Parallax) ---
        const onPointerDown = (e) => {
            if (!propsRef.current.interactive) return
            isPointerDown.current = true
            pointerCurrent.current = { x: e.clientX, y: e.clientY }
            inertiaVelocity.current = 0
        }

        const onPointerMove = (e) => {
            const rect = container.getBoundingClientRect()
            const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
            mouseTilt.current.targetX = THREE.MathUtils.clamp(ndcX, -1, 1)
            mouseTilt.current.targetY = THREE.MathUtils.clamp(ndcY, -1, 1)

            if (!isPointerDown.current || !propsRef.current.interactive) {
                if (!shouldAnimate) renderFrame(0)
                return
            }

            const deltaX = e.clientX - pointerCurrent.current.x
            pointerCurrent.current = { x: e.clientX, y: e.clientY }

            const dragSens = (propsRef.current.dragSensitivity || 1) * 0.0018
            const step = deltaX * dragSens
            items.forEach((item) => {
                item.progress += step
            })
            inertiaVelocity.current = step * 0.65

            renderFrame(0)
        }

        const onPointerUp = () => {
            isPointerDown.current = false
        }

        const onWheel = (e) => {
            if (!propsRef.current.interactive) return
            const wheelSens = (propsRef.current.wheelSensitivity || 1) * 0.0004
            const delta =
                (Math.abs(e.deltaX) > Math.abs(e.deltaY)
                    ? e.deltaX
                    : e.deltaY) * wheelSens
            items.forEach((item) => {
                item.progress -= delta
            })
            inertiaVelocity.current -= delta * 0.4
            if (!shouldAnimate) renderFrame(0)
        }

        container.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        container.addEventListener("wheel", onWheel, { passive: true })

        // --- 7. Animation Loop ---
        const tick = () => {
            frameId.current = requestAnimationFrame(tick)
            if (!isIntersecting.current) return
            const delta = clock.current.getDelta()
            renderFrame(Math.min(delta, 0.1))
        }

        // --- 8. Responsive Resize & Viewport Observers ---
        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            width = entry.contentRect.width || 300
            height = entry.contentRect.height || 300
            renderer.setSize(width, height)
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderFrame(0)
        })
        resizeObserver.observe(container)

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isIntersecting.current = entry.isIntersecting
                if (entry.isIntersecting) {
                    clock.current.start()
                    videoElements.forEach((v) => v.play().catch(() => {}))
                } else {
                    videoElements.forEach((v) => v.pause())
                }
            },
            { threshold: 0.05 }
        )
        intersectionObserver.observe(container)

        if (shouldAnimate) {
            tick()
        } else {
            renderFrame(0)
        }

        // --- 9. RULE 2: Aggressive WebGL Context & Memory Cleanup ---
        return () => {
            cancelAnimationFrame(frameId.current)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            container.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("wheel", onWheel)

            videoElements.forEach((v) => {
                v.pause()
                v.removeAttribute("src")
                v.load()
            })

            geometry.dispose()
            fallbackTexture.dispose()
            materials.forEach((mat) => mat.dispose())
            textures.forEach((tex) => tex.dispose())

            scene.clear()

            renderer.forceContextLoss()
            renderer.dispose()

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        props.images?.join(","),
        props.itemCount,
        props.cardWidth,
        props.cardHeight,
        props.cameraZ,
        props.direction,
        shouldAnimate,
    ])

    // Push frame immediately when slider values change in paused mode
    useEffect(() => {
        if (!shouldAnimate && triggerStaticRender.current) {
            triggerStaticRender.current()
        }
    }, [props])

    return (
        <div
            {...props}
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                overflow: "hidden",
                position: "relative",
                cursor: props.interactive ? "grab" : "default",
                touchAction: "none",
                ...props.style,
            }}
        />
    )
}

// RULE 9: Nested Defaults for Grouped Properties
Infinite3DCarousel.defaultProps = {
    editorPreview: true,
    images: DEFAULT_IMAGES,
    speed: 0.6,
    direction: "forward",
    itemCount: 26,
    cardWidth: 1.8,
    cardHeight: 2.3,
    layout: {
        curveWidth: 520,
        curveDepth: 320,
        curveHeight: 0,
        curveExponent: 2.1,
        cameraZ: 140,
    },
    styling: {
        minScale: 0.08,
        maxScale: 1.95,
        maxAngle: 36,
        borderRadius: 0.04,
        borderWidth: 0.012,
        borderColor: "#ffffff",
        borderAlpha: 0.4,
        fadeStart: 180,
        fadeEnd: 340,
    },
    interaction: {
        interactive: true,
        dragSensitivity: 1.0,
        dragFriction: 8.0,
        wheelSensitivity: 1.0,
        tiltReactivity: 45,
    },
}

// Property Controls with Proper Units and Collapsible Nested Groups
addPropertyControls(Infinite3DCarousel, {
    editorPreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
    },
    images: {
        type: ControlType.Array,
        control: { type: ControlType.Image },
        title: "Image Feed",
        description: "Images or videos looped seamlessly.",
    },
    speed: {
        type: ControlType.Number,
        title: "Flow Speed",
        min: 0,
        max: 5,
        step: 0.05,
        displayStepper: true,
        unit: "x",
        description: "Velocity of the carousel stream.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "backward"],
        optionTitles: ["Toward Camera", "Away to Depth"],
        description: "Direction cards travel.",
    },
    itemCount: {
        type: ControlType.Number,
        title: "Mesh Count",
        min: 10,
        max: 60,
        step: 2,
        description: "Number of active card instances.",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        unit: "u",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        unit: "u",
    },
    layout: {
        type: ControlType.Object,
        title: "3D Tunnel Layout",
        controls: {
            curveWidth: {
                type: ControlType.Number,
                title: "Spread (px)",
                min: 100,
                max: 1800,
                step: 10,
                unit: "px",
                description: "Horizontal expansion spread.",
            },
            curveDepth: {
                type: ControlType.Number,
                title: "Depth (px)",
                min: 100,
                max: 1000,
                step: 10,
                unit: "px",
                description: "Length of the funnel.",
            },
            curveHeight: {
                type: ControlType.Number,
                title: "Wave Rise (px)",
                min: -300,
                max: 300,
                step: 10,
                unit: "px",
                description: "Vertical arch or wave.",
            },
            curveExponent: {
                type: ControlType.Number,
                title: "Funnel Curve",
                min: 0.8,
                max: 3.5,
                step: 0.1,
                unit: "exp",
                description: "1=Linear V, >1=Trumpet curve.",
            },
            cameraZ: {
                type: ControlType.Number,
                title: "Camera Z (px)",
                min: 50,
                max: 500,
                step: 5,
                unit: "px",
                description: "Eye distance to cards.",
            },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Card Aesthetics",
        controls: {
            minScale: {
                type: ControlType.Number,
                title: "Origin Scale (%)",
                min: 0.01,
                max: 0.8,
                step: 0.01,
                unit: "%",
                description: "Scale in far distance.",
            },
            maxScale: {
                type: ControlType.Number,
                title: "Exit Scale (%)",
                min: 1.0,
                max: 4.5,
                step: 0.05,
                unit: "%",
                description: "Scale at front viewport.",
            },
            maxAngle: {
                type: ControlType.Number,
                title: "Flank Angle (deg)",
                min: 0,
                max: 90,
                step: 1,
                unit: "deg",
                description: "Facing angle toward center.",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius (%)",
                min: 0,
                max: 0.5,
                step: 0.005,
                unit: "%",
                description: "Corner roundness SDF.",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border (px)",
                min: 0,
                max: 0.08,
                step: 0.002,
                unit: "px",
                description: "Card stroke thickness.",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
            },
            borderAlpha: {
                type: ControlType.Number,
                title: "Border Alpha (%)",
                min: 0,
                max: 1,
                step: 0.05,
                unit: "%",
            },
            fadeStart: {
                type: ControlType.Number,
                title: "Fog Start (px)",
                min: 50,
                max: 600,
                step: 10,
                unit: "px",
                description: "Near limit of depth fade.",
            },
            fadeEnd: {
                type: ControlType.Number,
                title: "Fog End (px)",
                min: 100,
                max: 1000,
                step: 10,
                unit: "px",
                description: "Far limit of depth fade.",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interactivity & Physics",
        controls: {
            interactive: {
                type: ControlType.Boolean,
                title: "Enable Drag & Wheel",
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Drag Factor (x)",
                min: 0.1,
                max: 4,
                step: 0.1,
                unit: "x",
            },
            dragFriction: {
                type: ControlType.Number,
                title: "Friction (%)",
                min: 1,
                max: 25,
                step: 0.5,
                unit: "%",
                description: "Momentum decay rate.",
            },
            wheelSensitivity: {
                type: ControlType.Number,
                title: "Wheel Factor (x)",
                min: 0.1,
                max: 4,
                step: 0.1,
                unit: "x",
            },
            tiltReactivity: {
                type: ControlType.Number,
                title: "Parallax Tilt (deg)",
                min: 0,
                max: 100,
                step: 5,
                unit: "deg",
                description: "Hover perspective response.",
            },
        },
    },
})
