import * as React from "react"
import { useRef, useEffect } from "react"
import * as THREE from "https://esm.sh/three"
import { SVGLoader } from "https://esm.sh/three/examples/jsm/loaders/SVGLoader.js"
import * as htmlToImage from "https://esm.sh/html-to-image"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------------------------------------------------------
// GLOBAL CACHE (Prevents memory leaks across multiple logos)
// ---------------------------------------------------------
let globalEnvTexture = null
const getEnvTexture = () => {
    if (globalEnvTexture) return globalEnvTexture
    if (typeof document === "undefined") return null

    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext("2d")

    // Lighter ambient base to prevent dark glass shadows
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, 1024, 512)

    const createSoftbox = (x, y, w, h, intensity) => {
        const grd = ctx.createLinearGradient(x, y, x, y + h)
        grd.addColorStop(0, `rgba(255, 255, 255, ${intensity})`)
        grd.addColorStop(1, `rgba(50, 50, 50, ${intensity * 0.2})`)
        ctx.fillStyle = grd
        ctx.shadowColor = "#ffffff"
        ctx.shadowBlur = 80
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, 60)
        else ctx.fillRect(x, y, w, h)
        ctx.fill()
    }

    createSoftbox(50, 100, 300, 312, 1.0)
    createSoftbox(674, 100, 300, 312, 1.0)
    createSoftbox(350, -50, 324, 150, 0.9) // Brightened top light

    globalEnvTexture = new THREE.CanvasTexture(canvas)
    globalEnvTexture.mapping = THREE.EquirectangularReflectionMapping
    return globalEnvTexture
}

// ---------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------
export default function GlassLogo(incomingProps) {
    const props = {
        ...incomingProps,
        ...(incomingProps.geometry || {}),
        ...(incomingProps.glass || {}),
        ...(incomingProps.environment || {}),
        ...(incomingProps.interaction || {}),
    }

    const mountRef = useRef(null)
    const wrapperId = useRef(
        "framer-bg-" + Math.random().toString(36).substring(2, 9)
    )

    // 1. REACT-BYPASS ARCHITECTURE
    const latestProps = useRef(props)
    latestProps.current = props

    const isIntersecting = useRef(false)
    const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
    const dragState = useRef({
        isDragging: false,
        prevX: 0,
        prevY: 0,
        tgtX: 0,
        tgtY: 0,
        curX: 0,
        curY: 0,
    })

    // Mounts EXACTLY ONCE to prevent Framer Canvas destruction
    useEffect(() => {
        if (!mountRef.current || typeof window === "undefined") return

        let isMounted = true
        let frameId
        let renderer, scene, camera
        let bgPlane, bgTexture, bgVideoElement
        let logoGroup, glassShaderMaterial, fboRenderTarget
        let currentImageAspect = 1
        let fboNeedsUpdate = true
        let localCaptureTimeout
        let captureRetries = 0
        let currentCaptureId = 0 // Prevents overlapping captures during rapid resizing

        let currentGeoHash = ""
        let currentBgHash = ""

        const width = mountRef.current.clientWidth
        const height = mountRef.current.clientHeight

        // Optimally capping pixel ratio at 2.5: Identical quality to 3 on retina, but saves ~44% GPU fill rate
        const pixelRatio = Math.min(window.devicePixelRatio, 2.5)

        // 2. ULTRA-HD RENDERER
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setPixelRatio(pixelRatio)
        renderer.setSize(width, height)

        // CRITICAL FIX: Clearing to pure white (transparent) instead of black (transparent) prevents dark fringing
        renderer.setClearColor(0xffffff, 0)

        // Perfect Color Accuracy (No Double Tone Mapping)
        renderer.toneMapping = THREE.NoToneMapping
        renderer.outputColorSpace = THREE.SRGBColorSpace
        mountRef.current.appendChild(renderer.domElement)

        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        camera.position.z = 5

        // 3. HARDWARE-SAFE FBO CATCHER (Ultra-Smooth 16-bit Float + MSAA)
        fboRenderTarget = new THREE.WebGLRenderTarget(
            Math.floor(width * pixelRatio),
            Math.floor(height * pixelRatio),
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.HalfFloatType, // Completely eliminates color banding strips
                generateMipmaps: false,
                colorSpace: THREE.SRGBColorSpace,
                samples: 8, // Hardware MSAA for smooth boundaries
            }
        )

        // 4. BACKGROUND SYSTEM (Image, Video, Component Snapshot)
        const updateBgPlaneScale = (currentWidth, currentHeight, imgAspect) => {
            if (!bgPlane) return
            const dist = camera.position.z - bgPlane.position.z
            const vFov = (camera.fov * Math.PI) / 180
            const planeHeight = 2 * Math.tan(vFov / 2) * dist
            const planeWidth = planeHeight * (currentWidth / currentHeight)

            const screenAspect = currentWidth / currentHeight
            let scaleX = planeWidth
            let scaleY = planeHeight

            if (screenAspect > imgAspect) scaleY = planeWidth / imgAspect
            else scaleX = planeHeight * imgAspect

            bgPlane.scale.set(scaleX, scaleY, 1)
            fboNeedsUpdate = true
        }

        const setupBgPlane = () => {
            if (!bgPlane) {
                const planeGeo = new THREE.PlaneGeometry(1, 1)
                const planeMat = new THREE.MeshBasicMaterial({
                    map: bgTexture,
                    depthWrite: false,
                })
                bgPlane = new THREE.Mesh(planeGeo, planeMat)
                bgPlane.position.z = -5
                scene.add(bgPlane)
            } else {
                bgPlane.material.map = bgTexture
                bgPlane.visible = true
            }
            updateBgPlaneScale(
                mountRef.current.clientWidth,
                mountRef.current.clientHeight,
                currentImageAspect
            )
            fboNeedsUpdate = true
        }

        const applySafeFallbackTexture = () => {
            const canvas = document.createElement("canvas")
            canvas.width = 128
            canvas.height = 128
            const ctx = canvas.getContext("2d")
            ctx.fillStyle = "rgba(255, 255, 255, 0.0)" // Clear transparent
            ctx.fillRect(0, 0, 128, 128)
            const tex = new THREE.CanvasTexture(canvas)
            tex.colorSpace = THREE.SRGBColorSpace
            if (bgTexture) bgTexture.dispose()
            bgTexture = tex
            currentImageAspect = 1
            setupBgPlane()
        }

        const captureComponent = async () => {
            currentCaptureId++
            const captureId = currentCaptureId

            const node = document.getElementById(wrapperId.current)
            if (
                !node ||
                !isMounted ||
                latestProps.current.bgType !== "Component"
            )
                return

            // Delay capture slightly if element layout hasn't computed yet
            if (node.clientWidth === 0 || node.clientHeight === 0) {
                if (captureRetries < 5) {
                    captureRetries++
                    localCaptureTimeout = setTimeout(captureComponent, 200)
                }
                return
            }

            try {
                // useCORS is critically required for Framer image cross-origin compatibility
                const dataUrl = await htmlToImage.toPng(node, {
                    pixelRatio: Math.min(window.devicePixelRatio, 2),
                    skipFonts: true,
                    useCORS: true,
                    backgroundColor: "transparent",
                    style: { transform: "none" }, // Prevent layout shift rendering bugs
                })

                // If a new capture started while this one was rendering, discard this one
                if (
                    !isMounted ||
                    latestProps.current.bgType !== "Component" ||
                    captureId !== currentCaptureId
                )
                    return

                new THREE.TextureLoader().load(dataUrl, (tex) => {
                    if (!isMounted || captureId !== currentCaptureId) return
                    if (bgTexture) bgTexture.dispose()
                    bgTexture = tex
                    bgTexture.colorSpace = THREE.SRGBColorSpace

                    // CRITICAL FIX: Anisotropic Mipmapping ensures smooth distortion edges
                    bgTexture.generateMipmaps = true
                    bgTexture.minFilter = THREE.LinearMipmapLinearFilter
                    bgTexture.magFilter = THREE.LinearFilter
                    bgTexture.anisotropy =
                        renderer.capabilities.getMaxAnisotropy()

                    currentImageAspect = tex.image.width / tex.image.height
                    setupBgPlane()
                })
            } catch (e) {
                if (captureId !== currentCaptureId) return
                console.warn(
                    "Glass Logo: FBO capture failed due to strict CORS. Applying safe fallback.",
                    e
                )
                applySafeFallbackTexture()
            }
        }

        const loadBackground = (type, imgUrl, vidUrl) => {
            if (bgVideoElement) {
                bgVideoElement.pause()
                bgVideoElement.removeAttribute("src")
                bgVideoElement.load()
                bgVideoElement = null
            }

            if (type === "Component") {
                clearTimeout(localCaptureTimeout)
                captureRetries = 0
                localCaptureTimeout = setTimeout(captureComponent, 300)
                return
            }

            if (type === "Image") {
                if (!imgUrl) {
                    if (bgPlane) bgPlane.visible = false
                    fboNeedsUpdate = true
                    return
                }
                new THREE.TextureLoader().load(imgUrl, (texture) => {
                    if (
                        !isMounted ||
                        latestProps.current.bgImage !== imgUrl ||
                        latestProps.current.bgType !== "Image"
                    ) {
                        texture.dispose()
                        return
                    }
                    if (bgTexture) bgTexture.dispose()

                    bgTexture = texture
                    bgTexture.colorSpace = THREE.SRGBColorSpace
                    bgTexture.anisotropy =
                        renderer.capabilities.getMaxAnisotropy()
                    bgTexture.generateMipmaps = true
                    bgTexture.minFilter = THREE.LinearMipmapLinearFilter
                    currentImageAspect =
                        texture.image.width / texture.image.height

                    setupBgPlane()
                })
            } else {
                if (!vidUrl) {
                    if (bgPlane) bgPlane.visible = false
                    fboNeedsUpdate = true
                    return
                }
                const video = document.createElement("video")
                video.crossOrigin = "anonymous"
                video.playsInline = true
                video.loop = true
                video.muted = true
                video.src = vidUrl
                video
                    .play()
                    .catch((e) => console.warn("Video auto-play blocked:", e))

                bgVideoElement = video

                video.addEventListener("loadedmetadata", () => {
                    if (
                        !isMounted ||
                        latestProps.current.bgVideo !== vidUrl ||
                        latestProps.current.bgType !== "Video"
                    ) {
                        video.pause()
                        video.removeAttribute("src")
                        video.load()
                        return
                    }
                    if (bgTexture) bgTexture.dispose()

                    bgTexture = new THREE.VideoTexture(video)
                    bgTexture.colorSpace = THREE.SRGBColorSpace
                    bgTexture.minFilter = THREE.LinearFilter
                    bgTexture.magFilter = THREE.LinearFilter
                    bgTexture.generateMipmaps = false

                    currentImageAspect = video.videoWidth / video.videoHeight
                    setupBgPlane()
                })
            }
        }

        // 5. HD GLSL SHADER (Smooth Anti-Aliasing & Adaptive Alpha Routing)
        glassShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                envMap: { value: getEnvTexture() },
                uIor: { value: 1.5 },
                uThickness: { value: 2.0 },
                uChromaticAberration: { value: 0.025 },
                uCoreRefraction: { value: 1.0 },
                uFrostBlur: { value: 0.5 },
                uColor: { value: new THREE.Color("#ffffff") },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal; 
                varying vec3 vWorldNormal; 
                varying vec3 vViewPosition; 
                varying vec3 vWorldPosition; 
                varying vec4 vScreenPos;
                void main() {
                    vUv = uv;
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    vec4 mvPosition = viewMatrix * worldPos;
                    vViewPosition = -mvPosition.xyz;
                    vNormal = normalize(normalMatrix * normal);
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    vScreenPos = projectionMatrix * mvPosition;
                    gl_Position = vScreenPos;
                }
            `,
            fragmentShader: `
                precision highp float;
                
                uniform sampler2D tDiffuse;
                uniform sampler2D envMap;
                uniform float uIor;
                uniform float uThickness;
                uniform float uChromaticAberration;
                uniform float uCoreRefraction;
                uniform float uFrostBlur;
                uniform vec3 uColor;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vWorldNormal;
                varying vec3 vViewPosition;
                varying vec3 vWorldPosition;
                varying vec4 vScreenPos;
                
                // Stochastic Jitter for filmic grain instead of cheap banding
                float rand(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vec2 screenUv = (vScreenPos.xy / vScreenPos.w) * 0.5 + 0.5;
                    vec3 viewDir = normalize(vViewPosition);
                    vec3 normal = normalize(vNormal);
                    
                    // Fresnel Effect
                    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);
                    
                    // High-Quality Core Lens Distortion
                    float coreFactor = pow(max(dot(normal, viewDir), 0.0), 2.0);
                    vec2 lensOffset = (screenUv - 0.5) * (uCoreRefraction * 0.15) * coreFactor;
                    
                    vec3 refractView = refract(-viewDir, normal, 1.0 / uIor);
                    vec2 offset = refractView.xy * (uThickness * 0.1) - lensOffset;
                    
                    // Equirectangular Environment mapping (Processed FIRST for fallback support)
                    vec3 worldViewDir = normalize(cameraPosition - vWorldPosition);
                    vec3 reflectWorld = reflect(-worldViewDir, normalize(vWorldNormal));
                    const float PI = 3.14159265359;
                    vec2 equirectUv = vec2(atan(reflectWorld.z, reflectWorld.x) / (2.0 * PI) + 0.5, asin(reflectWorld.y) / PI + 0.5);
                    vec3 reflection = texture2D(envMap, equirectUv).rgb * 2.5; // Boosted brightness for crystal clear look

                    vec3 transmission = vec3(0.0);
                    float bgAlpha = 0.0;
                    
                    // High-End Vogel Spiral Multi-Tap Blur
                    if (uFrostBlur > 0.001) {
                        float rnd = rand(screenUv) * 6.2831853;
                        const int SAMPLES = 24;
                        const float GOLDEN_ANGLE = 2.39996323;
                        float radius = 0.0;
                        float radiusStep = 1.0 / float(SAMPLES);
                        float blurMultiplier = uFrostBlur * 0.025;
                        
                        vec2 uvR = screenUv + offset * (1.0 + uChromaticAberration);
                        vec2 uvG = screenUv + offset;
                        vec2 uvB = screenUv + offset * (1.0 - uChromaticAberration);
                        
                        for (int i = 0; i < SAMPLES; i++) {
                            float theta = float(i) * GOLDEN_ANGLE + rnd;
                            radius += radiusStep;
                            vec2 blurOffset = vec2(cos(theta), sin(theta)) * radius * blurMultiplier;
                            
                            transmission.r += texture2D(tDiffuse, uvR + blurOffset).r;
                            transmission.g += texture2D(tDiffuse, uvG + blurOffset).g;
                            transmission.b += texture2D(tDiffuse, uvB + blurOffset).b;
                            bgAlpha += texture2D(tDiffuse, uvG + blurOffset).a;
                        }
                        transmission /= float(SAMPLES);
                        bgAlpha /= float(SAMPLES);
                    } else {
                        // Smooth 3-Channel Sampling without blur
                        transmission.r = texture2D(tDiffuse, screenUv + offset * (1.0 + uChromaticAberration)).r;
                        transmission.g = texture2D(tDiffuse, screenUv + offset).g;
                        transmission.b = texture2D(tDiffuse, screenUv + offset * (1.0 - uChromaticAberration)).b;
                        bgAlpha = texture2D(tDiffuse, screenUv + offset).a;
                    }
                    
                    // Apply true transmission tinting
                    transmission *= uColor;

                    // Physical fallback tint (Makes completely transparent/empty space look like premium white glass instead of black)
                    vec3 clearGlassTint = mix(uColor, reflection, 0.5);
                    transmission = mix(clearGlassTint, transmission, bgAlpha);
                    
                    // Pure white color preserves perfect transparency
                    vec3 finalColor = mix(transmission, reflection, fresnel * 0.8);

                    // Adaptive Alpha Routing ensures clear glass retains structure
                    float baseAlpha = max(0.25, fresnel * 0.85);
                    float outAlpha = mix(baseAlpha, 1.0, bgAlpha);
                    
                    gl_FragColor = vec4(finalColor, outAlpha);
                }
            `,
            transparent: true,
            side: THREE.FrontSide,
        })

        // 6. GEOMETRY GENERATOR
        logoGroup = new THREE.Group()
        scene.add(logoGroup)

        const rebuildGeometry = () => {
            const p = latestProps.current

            logoGroup.children.forEach((c) => {
                if (c.geometry) c.geometry.dispose()
                logoGroup.remove(c)
            })

            const createXGeometry = () => {
                const shape = new THREE.Shape()
                const w = 0.35,
                    L = 1.3
                const points = [
                    [-w, L],
                    [w, L],
                    [w, w],
                    [L, w],
                    [L, -w],
                    [w, -w],
                    [w, -L],
                    [-w, -L],
                    [-w, -w],
                    [-L, -w],
                    [-L, w],
                    [-w, w],
                ]
                const rotated = points.map(([x, y]) => {
                    const angle = Math.PI / 4
                    return [
                        x * Math.cos(angle) - y * Math.sin(angle),
                        x * Math.sin(angle) + y * Math.cos(angle),
                    ]
                })
                shape.moveTo(rotated[0][0], rotated[0][1])
                for (let i = 1; i < rotated.length; i++)
                    shape.lineTo(rotated[i][0], rotated[i][1])
                shape.lineTo(rotated[0][0], rotated[0][1])

                const customBevel =
                    p.bevelSize !== undefined ? p.bevelSize : 0.025
                const geo = new THREE.ExtrudeGeometry(shape, {
                    depth: p.extrudeDepth || 0.6,
                    bevelEnabled: customBevel > 0,
                    bevelSegments: 32,
                    curveSegments: 64, // CRITICAL FIX: Increased to smooth out curve interpolation
                    steps: 4, // CRITICAL FIX: Increased steps mathematically perfects normal interpolation
                    bevelSize: customBevel,
                    bevelThickness: customBevel,
                })
                geo.center()
                return geo
            }

            if (p.logoShape !== "Custom SVG" || !p.customSvg) {
                let geo
                if (p.logoShape === "Torus")
                    geo = new THREE.TorusGeometry(
                        0.8,
                        (p.extrudeDepth || 0.6) * 0.5,
                        64,
                        64
                    )
                else if (p.logoShape === "Sphere")
                    geo = new THREE.SphereGeometry(1.2, 64, 64)
                else geo = createXGeometry()
                logoGroup.add(new THREE.Mesh(geo, glassShaderMaterial))
            } else {
                new SVGLoader().load(p.customSvg, (data) => {
                    if (!isMounted) return
                    const paths = data.paths
                    let tempGroup = new THREE.Group()

                    paths.forEach((path) => {
                        SVGLoader.createShapes(path).forEach((shape) =>
                            tempGroup.add(
                                new THREE.Mesh(new THREE.ShapeGeometry(shape))
                            )
                        )
                    })

                    const box2D = new THREE.Box3().setFromObject(tempGroup)
                    const maxDim = Math.max(
                        box2D.getSize(new THREE.Vector3()).x,
                        box2D.getSize(new THREE.Vector3()).y
                    )
                    const safeScale = Math.min(
                        Math.max(maxDim > 0 ? 2.0 / maxDim : 1.0, 0.0001),
                        1000
                    )

                    const customBevel =
                        p.bevelSize !== undefined ? p.bevelSize : 0.025
                    const targetDepth = p.extrudeDepth || 0.6
                    const extrudeDepth = targetDepth / safeScale
                    const maxBevel = Math.min(
                        customBevel / safeScale,
                        extrudeDepth * 0.3
                    )

                    let svgGroup = new THREE.Group()

                    paths.forEach((path) => {
                        SVGLoader.createShapes(path).forEach((shape) => {
                            const geometry = new THREE.ExtrudeGeometry(shape, {
                                depth: extrudeDepth,
                                bevelEnabled: customBevel > 0,
                                bevelSegments: 32,
                                curveSegments: 64, // CRITICAL FIX: Increased
                                steps: 4, // CRITICAL FIX: Increased
                                bevelSize: maxBevel,
                                bevelThickness: maxBevel,
                            })
                            geometry.scale(safeScale, safeScale, safeScale)
                            geometry.rotateX(Math.PI)
                            geometry.computeVertexNormals()
                            geometry.computeBoundingBox()
                            svgGroup.add(
                                new THREE.Mesh(geometry, glassShaderMaterial)
                            )
                        })
                    })

                    const finalCenter = new THREE.Box3()
                        .setFromObject(svgGroup)
                        .getCenter(new THREE.Vector3())
                    svgGroup.position.set(
                        -finalCenter.x,
                        -finalCenter.y,
                        -finalCenter.z
                    )
                    logoGroup.add(svgGroup)
                    tempGroup.traverse((c) => {
                        if (c.geometry) c.geometry.dispose()
                    })
                })
            }
        }

        // 7. LIGHTING
        scene.add(new THREE.AmbientLight(0xffffff, 1.0))
        const d1 = new THREE.DirectionalLight(0xffffff, 2.5)
        d1.position.set(5, 5, 5)
        scene.add(d1)
        const d2 = new THREE.DirectionalLight(0xffffff, 1.5)
        d2.position.set(-5, -5, -5)
        scene.add(d2)

        // 8. EVENT LISTENERS
        const handlePointerDown = (e) => {
            if (!latestProps.current.dragRotate) return
            dragState.current.isDragging = true
            dragState.current.prevX = e.clientX
            dragState.current.prevY = e.clientY
        }

        const handlePointerMove = (e) => {
            if (latestProps.current.dragRotate) {
                if (dragState.current.isDragging) {
                    dragState.current.tgtY +=
                        (e.clientX - dragState.current.prevX) * 0.01
                    dragState.current.tgtX +=
                        (e.clientY - dragState.current.prevY) * 0.01
                    dragState.current.prevX = e.clientX
                    dragState.current.prevY = e.clientY
                }
            } else if (latestProps.current.mouseTrack) {
                const rect = mountRef.current.getBoundingClientRect()
                mouse.current.targetX =
                    (((e.clientX - rect.left) / rect.width) * 2 - 1) * 0.5
                mouse.current.targetY =
                    (-((e.clientY - rect.top) / rect.height) * 2 + 1) * 0.5
            }
        }

        const handlePointerUp = () => (dragState.current.isDragging = false)

        mountRef.current.addEventListener("pointerdown", handlePointerDown)
        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)
        window.addEventListener("pointercancel", handlePointerUp)

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width: w, height: h } = entry.contentRect
                if (w === 0 || h === 0) return
                camera.aspect = w / h
                camera.updateProjectionMatrix()
                renderer.setSize(w, h)
                fboRenderTarget.setSize(
                    Math.floor(w * pixelRatio),
                    Math.floor(h * pixelRatio)
                )

                // Instantly refresh the shader buffer during resize to prevent black flashes
                fboNeedsUpdate = true
                updateBgPlaneScale(w, h, currentImageAspect)

                if (latestProps.current.bgType === "Component") {
                    clearTimeout(localCaptureTimeout)
                    captureRetries = 0
                    localCaptureTimeout = setTimeout(captureComponent, 400)
                }
            }
        })
        resizeObserver.observe(mountRef.current)

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => (isIntersecting.current = entry.isIntersecting),
            { threshold: 0.1 }
        )
        intersectionObserver.observe(mountRef.current)

        // 9. HIGH-PERFORMANCE RENDER LOOP
        const clock = new THREE.Clock()

        const animate = () => {
            frameId = requestAnimationFrame(animate)
            const p = latestProps.current

            const inEditor =
                FramerRenderTarget.current() === FramerRenderTarget.canvas
            if ((inEditor && !p.editorPreview) || !isIntersecting.current)
                return

            const delta = clock.getDelta()
            const time = clock.getElapsedTime()

            // Tied Bevel into the Hash System to auto-update geometry on slider drag
            const newGeoHash = `${p.logoShape}-${p.customSvg}-${p.extrudeDepth}-${p.bevelSize}`
            if (currentGeoHash !== newGeoHash) {
                currentGeoHash = newGeoHash
                rebuildGeometry()
            }

            const bgHash = `${p.bgType}-${p.bgImage}-${p.bgVideo}`
            if (currentBgHash !== bgHash) {
                currentBgHash = bgHash
                loadBackground(p.bgType, p.bgImage, p.bgVideo)
            }

            // Fast Uniform Updates
            glassShaderMaterial.uniforms.uIor.value = p.ior || 1.5
            glassShaderMaterial.uniforms.uThickness.value = p.thickness || 2.0
            glassShaderMaterial.uniforms.uChromaticAberration.value =
                (p.dispersion || 2.5) * 0.01
            glassShaderMaterial.uniforms.uCoreRefraction.value =
                p.coreRefraction !== undefined ? p.coreRefraction : 1.0
            glassShaderMaterial.uniforms.uFrostBlur.value =
                p.frostBlur !== undefined ? p.frostBlur : 0.5
            glassShaderMaterial.uniforms.uColor.value.set(
                p.glassColor || "#ffffff"
            )
            logoGroup.scale.setScalar(p.logoScale || 1.0)

            if (p.dragRotate) {
                if (p.autoRotate && !dragState.current.isDragging) {
                    dragState.current.tgtY += delta * 0.5
                    dragState.current.tgtX += delta * 0.2
                }
                dragState.current.curX +=
                    (dragState.current.tgtX - dragState.current.curX) *
                    5 *
                    delta
                dragState.current.curY +=
                    (dragState.current.tgtY - dragState.current.curY) *
                    5 *
                    delta
                logoGroup.rotation.x = dragState.current.curX
                logoGroup.rotation.y = dragState.current.curY
            } else {
                if (p.mouseTrack) {
                    mouse.current.x +=
                        (mouse.current.targetX - mouse.current.x) * 5 * delta
                    mouse.current.y +=
                        (mouse.current.targetY - mouse.current.y) * 5 * delta
                    logoGroup.rotation.x = -mouse.current.y
                    logoGroup.rotation.y = mouse.current.x
                }
                if (p.autoRotate) {
                    logoGroup.rotation.y += delta * 0.5
                    logoGroup.rotation.x += delta * 0.2
                }
            }

            logoGroup.position.y =
                p.idleFloat !== false ? Math.sin(time * 2) * 0.05 : 0

            // Optimized Caching System
            const isVideoRender =
                p.bgType === "Video" &&
                p.bgVideo &&
                bgVideoElement &&
                bgVideoElement.readyState >= 2

            if (fboNeedsUpdate || isVideoRender) {
                logoGroup.visible = false
                if (bgPlane) bgPlane.visible = true // Display the plane purely to inject into the FBO Refraction buffer

                renderer.setRenderTarget(fboRenderTarget)
                renderer.clear()
                renderer.render(scene, camera)

                glassShaderMaterial.uniforms.tDiffuse.value =
                    fboRenderTarget.texture
                renderer.setRenderTarget(null)

                // Hides the screenshot from the main canvas render so the REAL HTML DOM handles the background interactivity
                if (bgPlane && p.bgType === "Component") {
                    bgPlane.visible = false
                }

                logoGroup.visible = true
                fboNeedsUpdate = false
            } else {
                // Ensure bgPlane is disabled on all general frames if overlaying over HTML Component
                if (bgPlane) {
                    bgPlane.visible = p.bgType !== "Component"
                }
            }

            renderer.render(scene, camera)
        }
        animate()

        // 10. STRICT WEBGL CLEANUP
        return () => {
            isMounted = false
            cancelAnimationFrame(frameId)
            clearTimeout(localCaptureTimeout)

            if (mountRef.current)
                mountRef.current.removeEventListener(
                    "pointerdown",
                    handlePointerDown
                )
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)
            window.removeEventListener("pointercancel", handlePointerUp)

            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            logoGroup.traverse((c) => {
                if (c.geometry) c.geometry.dispose()
                if (c.material)
                    Array.isArray(c.material)
                        ? c.material.forEach((m) => m.dispose())
                        : c.material.dispose()
            })

            if (bgPlane) {
                bgPlane.geometry.dispose()
                bgPlane.material.dispose()
            }
            if (bgTexture) bgTexture.dispose()
            if (bgVideoElement) {
                bgVideoElement.pause()
                bgVideoElement.removeAttribute("src")
                bgVideoElement.load()
            }
            glassShaderMaterial.dispose()
            fboRenderTarget.dispose()
            scene.clear()

            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (
                    mountRef.current &&
                    mountRef.current.contains(renderer.domElement)
                ) {
                    mountRef.current.removeChild(renderer.domElement)
                }
            }
        }
    }, [])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                touchAction: props.dragRotate ? "none" : "auto",
                ...props.style,
            }}
        >
            {/* Global style injections to strongly force the connected Component to fill the background completely */}
            <style>
                {`
                #${wrapperId.current} > div > * {
                    width: 100% !important;
                    height: 100% !important;
                    min-width: 100% !important;
                    min-height: 100% !important;
                    object-fit: cover;
                }
                `}
            </style>

            {/* The Connected Framer Component Wrapper */}
            {props.bgType === "Component" && props.bgComponent && (
                <div
                    id={wrapperId.current}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0,
                        display: "flex",
                        alignItems: "stretch",
                        justifyContent: "stretch",
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                        }}
                    >
                        {props.bgComponent}
                    </div>
                </div>
            )}

            {/* 3D Render Canvas wrapper */}
            {/* Passes hover clicks down to connected components seamlessly if DragRotate is disabled */}
            <div
                ref={mountRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                    pointerEvents: props.dragRotate ? "auto" : "none",
                }}
            />
        </div>
    )
}

// ---------------------------------------------------------
// FRAMER PROPERTY CONTROLS
// ---------------------------------------------------------
GlassLogo.defaultProps = {
    editorPreview: true,
    bgComponent: null, // Initialized
    geometry: {
        logoShape: "Custom SVG",
        customSvg: "",
        logoScale: 1.0,
        extrudeDepth: 0.6,
        bevelSize: 0.025,
    },
    environment: {
        bgType: "Image",
        bgImage: "",
        bgVideo: "",
    },
    glass: {
        glassColor: "#ffffff",
        thickness: 2.0,
        ior: 1.5,
        dispersion: 2.5,
        coreRefraction: 1.0,
        frostBlur: 0.5,
    },
    interaction: {
        idleFloat: true,
        dragRotate: false,
        mouseTrack: true,
        autoRotate: false,
    },
}

addPropertyControls(GlassLogo, {
    editorPreview: {
        title: "Live Preview",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    geometry: {
        title: "Geometry",
        type: ControlType.Object,
        controls: {
            logoShape: {
                title: "Shape",
                type: ControlType.Enum,
                options: ["X", "Torus", "Sphere", "Custom SVG"],
                defaultValue: "Custom SVG",
            },
            customSvg: {
                title: "Upload SVG",
                type: ControlType.File,
                allowedFileTypes: ["svg"],
                hidden: (props) => props.logoShape !== "Custom SVG",
            },
            logoScale: {
                title: "Scale",
                type: ControlType.Number,
                min: 0.1,
                max: 5.0,
                step: 0.1,
                defaultValue: 1.0,
            },
            extrudeDepth: {
                title: "3D Depth",
                type: ControlType.Number,
                min: 0.0,
                max: 2.0,
                step: 0.05,
                defaultValue: 0.6,
                hidden: (props) => props.logoShape === "Sphere",
            },
            bevelSize: {
                title: "Bevel (Edge)",
                type: ControlType.Number,
                min: 0.0,
                max: 0.08,
                step: 0.001,
                defaultValue: 0.025,
                hidden: (props) =>
                    props.logoShape === "Sphere" || props.logoShape === "Torus",
            },
        },
    },
    environment: {
        title: "Background Plate",
        type: ControlType.Object,
        controls: {
            bgType: {
                title: "Type",
                type: ControlType.Enum,
                options: ["Image", "Video", "Component"],
                defaultValue: "Image",
            },
            bgImage: {
                title: "Upload Image",
                type: ControlType.Image,
                hidden: (props) => props.bgType !== "Image",
            },
            bgVideo: {
                title: "Upload Video",
                type: ControlType.File,
                allowedFileTypes: ["mp4", "webm", "mov"],
                hidden: (props) => props.bgType !== "Video",
            },
        },
    },
    // MOVED TO ROOT LEVEL (Framer ignores Components inside Objects)
    bgComponent: {
        title: "Connect Frame",
        type: ControlType.ComponentInstance,
        hidden: (props) => props.environment?.bgType !== "Component",
    },
    glass: {
        title: "Liquid Glass",
        type: ControlType.Object,
        controls: {
            glassColor: {
                title: "Liquid Tint",
                type: ControlType.Color,
                defaultValue: "#ffffff",
            },
            coreRefraction: {
                title: "Core Refract",
                type: ControlType.Number,
                min: 0.0,
                max: 5.0,
                step: 0.1,
                defaultValue: 1.0,
            },
            thickness: {
                title: "Volume/Density",
                type: ControlType.Number,
                min: 0.1,
                max: 5.0,
                step: 0.1,
                defaultValue: 2.0,
            },
            ior: {
                title: "Refraction",
                type: ControlType.Number,
                min: 1.0,
                max: 2.33,
                step: 0.01,
                defaultValue: 1.5,
            },
            dispersion: {
                title: "Chromatic Ab.",
                type: ControlType.Number,
                min: 0.0,
                max: 10.0,
                step: 0.1,
                defaultValue: 2.5,
            },
            frostBlur: {
                title: "Frost Blur",
                type: ControlType.Number,
                min: 0.0,
                max: 2.0,
                step: 0.05,
                defaultValue: 0.5,
            },
        },
    },
    interaction: {
        title: "Interaction",
        type: ControlType.Object,
        controls: {
            idleFloat: {
                title: "Idle Float",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            dragRotate: {
                title: "Drag Rotate",
                type: ControlType.Boolean,
                defaultValue: false,
            },
            mouseTrack: {
                title: "Mouse Track",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            autoRotate: {
                title: "Auto Rotate",
                type: ControlType.Boolean,
                defaultValue: false,
            },
        },
    },
})
