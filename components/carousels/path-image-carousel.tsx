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


export default function PathCarousel(props) {
    // STEP 1: Intercept & Flatten Grouped Properties
    const mergedProps = {
        ...props,
        ...(props.content || {}),
        ...(props.styling || {}),
        ...(props.interaction || {}),
    }

    const mountRef = useRef(null)
    const domRefs = useRef([])
    const propsRef = useRef(mergedProps)

    // Keep propsRef updated without triggering expensive React re-renders in the loop
    useEffect(() => {
        propsRef.current = mergedProps
    }, [mergedProps])

    const progressRef = useRef({ current: 0, target: 0 })

    useEffect(() => {
        if (!mountRef.current) return

        let frameId
        let isIntersecting = true

        // --- 1. SCENE SETUP ---
        const scene = new THREE.Scene()
        const pathGroup = new THREE.Group() // Dedicated group for Path Offsets & Rotation
        scene.add(pathGroup)

        const aspect =
            mountRef.current.clientWidth / mountRef.current.clientHeight
        const camera = new THREE.OrthographicCamera(
            -aspect,
            aspect,
            1,
            -1,
            0.1,
            1000
        )
        camera.position.z = 100

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight
        )
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        mountRef.current.appendChild(renderer.domElement)

        // --- 2. SVG PARSING ---
        let baseCurve = null
        let pathDimensions = { x: 1, y: 1 }
        let isClosedPath = false

        const buildCurveFromPath = (dString) => {
            if (!dString) return
            try {
                isClosedPath = dString.trim().toLowerCase().endsWith("z")

                const ns = "http://www.w3.org/2000/svg"
                const svg = document.createElementNS(ns, "svg")
                const path = document.createElementNS(ns, "path")
                path.setAttribute("d", dString)
                svg.appendChild(path)
                svg.style.position = "absolute"
                svg.style.pointerEvents = "none"
                svg.style.opacity = "0"
                document.body.appendChild(svg)

                const length = path.getTotalLength() || 100
                const points = []
                const segments = 1000

                const loopSegments = isClosedPath ? segments - 1 : segments

                for (let i = 0; i <= loopSegments; i++) {
                    const pt = path.getPointAtLength((i / segments) * length)
                    points.push(new THREE.Vector3(pt.x, -pt.y, 0))
                }
                document.body.removeChild(svg)

                const box = new THREE.Box3().setFromPoints(points)
                const center = new THREE.Vector3()
                box.getCenter(center)
                const size = new THREE.Vector3()
                box.getSize(size)

                points.forEach((p) => p.sub(center))

                const maxDim = Math.max(size.x, size.y)
                if (maxDim > 0) {
                    points.forEach((p) => p.divideScalar(maxDim))
                    pathDimensions = { x: size.x / maxDim, y: size.y / maxDim }
                }

                baseCurve = new THREE.CatmullRomCurve3(points, isClosedPath)
            } catch (e) {
                console.error("Invalid SVG Path, using fallback.", e)
            }
        }

        const processSVGText = (text) => {
            const doc = new DOMParser().parseFromString(text, "image/svg+xml")
            const pathEl = doc.querySelector("path")
            if (pathEl) {
                buildCurveFromPath(pathEl.getAttribute("d"))
                return
            }
            const circleEl = doc.querySelector("circle")
            if (circleEl) {
                const cx = parseFloat(circleEl.getAttribute("cx") || 0)
                const cy = parseFloat(circleEl.getAttribute("cy") || 0)
                const r = parseFloat(circleEl.getAttribute("r") || 0)
                buildCurveFromPath(
                    `M ${cx - r}, ${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy} Z`
                )
                return
            }
            buildCurveFromPath("M 50 250 C 150 50, 350 450, 450 250")
        }

        if (mergedProps.svgFile) {
            fetch(mergedProps.svgFile)
                .then((res) => res.text())
                .then(processSVGText)
        } else {
            buildCurveFromPath("M 50 250 C 150 50, 350 450, 450 250")
        }

        // --- 3. OPTIMIZED VRAM CACHING & MEDIA MAPPING ---
        const validImages = Array.isArray(mergedProps.images)
            ? mergedProps.images
            : []
        const validVideos = Array.isArray(mergedProps.videos)
            ? mergedProps.videos
            : []
        const validFrames = Array.isArray(mergedProps.connectedFrames)
            ? mergedProps.connectedFrames
            : []

        let mediaList = [...validImages, ...validVideos].filter(Boolean)
        if (mediaList.length === 0 && validFrames.length === 0) {
            mediaList.push("https://framerusercontent.com/images/default.jpg")
        }

        const numMedia = mediaList.length
        const numFrames = validFrames.length
        const totalUnique = numMedia + numFrames || 1

        const texLoader = new THREE.TextureLoader()
        const uniqueUrls = Array.from(new Set(mediaList))
        const loadedMaterials = []
        const loadedTextures = []
        const videoMap = new Map()

        uniqueUrls.forEach((url) => {
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: null },
                    radius: { value: propsRef.current.imageRadius || 0 },
                    brightness: { value: propsRef.current.brightness ?? 1.0 },
                    contrast: { value: propsRef.current.contrast ?? 1.0 },
                    saturation: { value: propsRef.current.saturation ?? 1.0 },
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec2 vScale;
                    void main() {
                        vUv = uv;
                        vScale = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    #if defined( GL_OES_standard_derivatives )
                        #extension GL_OES_standard_derivatives : enable
                    #endif
                    uniform sampler2D map;
                    uniform float radius;
                    uniform float brightness;
                    uniform float contrast;
                    uniform float saturation;
                    varying vec2 vUv;
                    varying vec2 vScale;

                    float roundedBoxSDF(vec2 CenterPosition, vec2 Size, float Radius) {
                        return length(max(abs(CenterPosition) - Size + Radius, 0.0)) - Radius;
                    }

                    void main() {
                        vec4 texColor = texture2D(map, vUv);
                        vec2 pos = (vUv - 0.5) * vScale;
                        vec2 halfSize = vScale * 0.5;
                        float maxRadius = min(halfSize.x, halfSize.y);
                        float clampedRadius = min(radius, maxRadius);
                        float dist = roundedBoxSDF(pos, halfSize, clampedRadius);
                        float edge = fwidth(dist);
                        edge = max(edge, 0.001);
                        float alpha = 1.0 - smoothstep(0.0, edge, dist);
                        if (alpha <= 0.0) discard;

                        vec3 color = texColor.rgb;
                        color *= brightness;
                        color = (color - 0.5) * contrast + 0.5;
                        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
                        color = mix(vec3(luminance), color, saturation);
                        gl_FragColor = vec4(color, texColor.a * alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: true,
                extensions: { derivatives: true },
            })

            loadedMaterials.push({ url, mat })

            const isVideo =
                url.match(/\.(mp4|webm)$/i) || url.match(/\.(mp4|webm)/i)
            if (isVideo) {
                const video = document.createElement("video")
                video.src = url
                video.crossOrigin = "anonymous"
                video.loop = true
                video.muted = true
                video.playsInline = true
                video.play().catch((e) => console.warn("Video blocked", e))

                const tex = new THREE.VideoTexture(video)
                tex.colorSpace = THREE.SRGBColorSpace
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                mat.uniforms.map.value = tex
                loadedTextures.push(tex)
                videoMap.set(url, video)
            } else {
                texLoader.load(url, (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace
                    mat.uniforms.map.value = tex
                    mat.needsUpdate = true
                    loadedTextures.push(tex)
                })
            }
        })

        // Invisible material for Framer Node Intersections
        const frameHitboxMat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
        })

        const meshes = []
        const baseGeometry = new THREE.PlaneGeometry(1, 1)

        const MAX_POOL_SIZE = 150
        for (let i = 0; i < MAX_POOL_SIZE; i++) {
            const mesh = new THREE.Mesh(
                baseGeometry,
                loadedMaterials[0]?.mat || frameHitboxMat
            )
            mesh.userData.randomScaleX = Math.random()
            mesh.userData.randomScaleY = Math.random()
            mesh.userData.hoverState = 0
            mesh.visible = false
            pathGroup.add(mesh)
            meshes.push(mesh)
        }

        // --- 4. INTERACTIONS ---
        let isDragging = false
        let startX = 0
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2(-10000, -10000)

        const onPointerDown = (e) => {
            isDragging = true
            startX = e.clientX
            if (mountRef.current)
                mountRef.current.setPointerCapture(e.pointerId)
        }

        const onPointerMove = (e) => {
            if (mountRef.current) {
                const rect = mountRef.current.getBoundingClientRect()
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            }
            if (!isDragging) return
            const deltaX = e.clientX - startX
            progressRef.current.target +=
                deltaX * propsRef.current.dragSensitivity * 0.0001
            startX = e.clientX
        }

        const onPointerLeave = () => {
            mouse.x = -10000
            mouse.y = -10000
            isDragging = false
        }
        const onPointerUp = (e) => {
            isDragging = false
            if (mountRef.current)
                mountRef.current.releasePointerCapture(e.pointerId)
        }
        const onWheel = (e) => {
            if (!propsRef.current.enableScroll) return
            e.preventDefault()
            progressRef.current.target +=
                e.deltaY * propsRef.current.scrollSensitivity * 0.0001
        }

        mountRef.current.addEventListener("pointerdown", onPointerDown)
        mountRef.current.addEventListener("pointermove", onPointerMove)
        mountRef.current.addEventListener("pointerleave", onPointerLeave)
        mountRef.current.addEventListener("pointerup", onPointerUp)
        mountRef.current.addEventListener("pointercancel", onPointerUp)
        mountRef.current.addEventListener("wheel", onWheel, { passive: false })

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries.length) {
                renderer.setSize(
                    entries[0].contentRect.width,
                    entries[0].contentRect.height
                )
            }
        })
        resizeObserver.observe(mountRef.current)

        const intersectionObserver = new IntersectionObserver((entries) => {
            isIntersecting = entries[0].isIntersecting
        })
        intersectionObserver.observe(mountRef.current)

        // --- 5. ANIMATION LOOP ---
        const clock = new THREE.Clock()
        const reusableVector = new THREE.Vector3()

        const animate = () => {
            frameId = requestAnimationFrame(animate)
            if (!isIntersecting) return

            const delta = clock.getDelta()
            const state = progressRef.current
            const currentProps = propsRef.current
            const domRefsCurrent = domRefs.current

            const lerpFactor =
                1 - Math.pow(1 - currentProps.damping, delta * 60)
            state.current += (state.target - state.current) * lerpFactor

            // Handle Path Group Transformations
            pathGroup.position.x = currentProps.pathOffsetX || 0
            pathGroup.position.y = currentProps.pathOffsetY || 0
            pathGroup.rotation.z =
                (currentProps.pathRotation || 0) * (Math.PI / 180)

            const containerW = mountRef.current.clientWidth
            const containerH = mountRef.current.clientHeight
            const aspect = containerW / containerH
            const zoom = currentProps.cameraZoom

            if (
                camera.top !== zoom / 2 ||
                camera.right !== (zoom * aspect) / 2
            ) {
                camera.left = (zoom * aspect) / -2
                camera.right = (zoom * aspect) / 2
                camera.top = zoom / 2
                camera.bottom = zoom / -2
                camera.updateProjectionMatrix()
            }

            const targetW = zoom * aspect - currentProps.viewportInset
            const targetH = zoom - currentProps.viewportInset
            const scale = Math.max(
                0.001,
                Math.min(targetW / pathDimensions.x, targetH / pathDimensions.y)
            )

            const gapRatio = currentProps.imageGap / 100
            const requiredToFill = Math.ceil(1.0 / gapRatio) + 1
            const activeCount = Math.max(
                currentProps.imageCount,
                requiredToFill
            )
            const cycleLength = activeCount * gapRatio

            // Pass 1: Positioning, Baseline Scale & Material Assignment
            meshes.forEach((mesh, i) => {
                if (i < activeCount && baseCurve) {
                    let t =
                        (((state.current + i * gapRatio) % cycleLength) +
                            cycleLength) %
                        cycleLength
                    if (isClosedPath) t = t % 1.0

                    if (isClosedPath || t <= 1.0) {
                        mesh.visible = true

                        const randX = mesh.userData.randomScaleX || 0
                        const randY = mesh.userData.randomScaleY || 0
                        const sizeMultX = currentProps.randomSize
                            ? 1.0 +
                              (randX * 2 - 1) * currentProps.randomnessAmount
                            : 1.0
                        const sizeMultY = currentProps.randomSize
                            ? 1.0 +
                              (randY * 2 - 1) * currentProps.randomnessAmount
                            : 1.0

                        let finalW = currentProps.imageWidth * sizeMultX
                        let finalH = currentProps.imageHeight * sizeMultY

                        let pathScale = 1.0
                        if (!isClosedPath) {
                            const sDist = currentProps.scaleDistance / 100
                            if (sDist > 0) {
                                if (t < sDist)
                                    pathScale =
                                        currentProps.startScale +
                                        (1.0 - currentProps.startScale) *
                                            (t / sDist)
                                else if (t > 1.0 - sDist)
                                    pathScale =
                                        1.0 +
                                        (currentProps.endScale - 1.0) *
                                            ((t - (1.0 - sDist)) / sDist)
                            }
                        }

                        mesh.userData.baseW = finalW * pathScale
                        mesh.userData.baseH = finalH * pathScale
                        mesh.scale.set(
                            mesh.userData.baseW,
                            mesh.userData.baseH,
                            1
                        )

                        const uniqueIdx = i % totalUnique
                        const isFrame = numFrames > 0 && uniqueIdx >= numMedia

                        if (isFrame) {
                            mesh.material = frameHitboxMat
                        } else {
                            const url = mediaList[uniqueIdx]
                            const cachedMat = loadedMaterials.find(
                                (m) => m.url === url
                            )?.mat
                            if (cachedMat && mesh.material !== cachedMat)
                                mesh.material = cachedMat
                        }

                        baseCurve.getPointAt(t, reusableVector)
                        reusableVector.multiplyScalar(scale)
                        reusableVector.z = isClosedPath ? i * 0.001 : t * 0.1

                        mesh.position.copy(reusableVector)
                        mesh.quaternion.copy(camera.quaternion)
                        mesh.updateMatrixWorld() // Sync global transformations to hitboxes immediately
                    } else {
                        mesh.visible = false
                        const el = domRefsCurrent[i]
                        if (el)
                            el.style.transform = `translate(-10000px, -10000px)`
                    }
                } else {
                    mesh.visible = false
                    const el = domRefsCurrent[i]
                    if (el) el.style.transform = `translate(-10000px, -10000px)`
                }
            })

            // Run Raycast Interactions
            raycaster.setFromCamera(mouse, camera)
            const visibleMeshes = meshes.filter((m) => m.visible)
            const intersects = raycaster.intersectObjects(visibleMeshes)
            const hitMesh = intersects.length > 0 ? intersects[0].object : null
            const isAnyHovered = hitMesh !== null

            if (!isDragging && currentProps.autoScroll) {
                let speedMult =
                    isAnyHovered && currentProps.hoverPause ? 0.0 : 1.0
                state.target +=
                    currentProps.autoPlaySpeed * delta * 0.1 * speedMult
            }

            // Global Shader State Update
            loadedMaterials.forEach((m) => {
                m.mat.uniforms.radius.value = currentProps.imageRadius
                m.mat.uniforms.brightness.value = currentProps.brightness
                m.mat.uniforms.contrast.value = currentProps.contrast
                m.mat.uniforms.saturation.value = currentProps.saturation
            })

            // Pass 2: Layout DOM Overlay Node Projections
            const worldToPixels = containerW / (zoom * aspect)
            const basePxWidth = currentProps.imageWidth * worldToPixels
            const basePxHeight = currentProps.imageHeight * worldToPixels

            meshes.forEach((mesh, i) => {
                if (!mesh.visible) return

                const targetHover = mesh === hitMesh ? 1.0 : 0.0
                mesh.userData.hoverState +=
                    (targetHover - mesh.userData.hoverState) * lerpFactor * 2.5
                const hoverScaleMult =
                    1.0 + mesh.userData.hoverState * currentProps.hoverScale

                // Update physical WebGL dimensions
                mesh.scale.set(
                    mesh.userData.baseW * hoverScaleMult,
                    mesh.userData.baseH * hoverScaleMult,
                    1
                )

                const uniqueIdx = i % totalUnique
                const isFrame = numFrames > 0 && uniqueIdx >= numMedia

                if (isFrame) {
                    const el = domRefsCurrent[i]
                    if (el) {
                        mesh.getWorldPosition(reusableVector)
                        reusableVector.project(camera)

                        const x = (reusableVector.x * 0.5 + 0.5) * containerW
                        const y = (reusableVector.y * -0.5 + 0.5) * containerH
                        const zIndex = Math.round((1 - reusableVector.z) * 100)

                        const dynamicScaleX =
                            (mesh.userData.baseW / currentProps.imageWidth) *
                            hoverScaleMult
                        const dynamicScaleY =
                            (mesh.userData.baseH / currentProps.imageHeight) *
                            hoverScaleMult

                        el.style.width = `${basePxWidth}px`
                        el.style.height = `${basePxHeight}px`
                        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${dynamicScaleX}, ${dynamicScaleY})`
                        el.style.zIndex = zIndex
                        el.style.opacity = 1
                    }
                } else {
                    const el = domRefsCurrent[i]
                    if (el) el.style.transform = `translate(-10000px, -10000px)`
                }
            })

            renderer.render(scene, camera)
        }

        animate()

        // --- 6. STRICT WEBGL CLEANUP ---
        return () => {
            cancelAnimationFrame(frameId)
            if (mountRef.current) {
                mountRef.current.removeEventListener(
                    "pointerdown",
                    onPointerDown
                )
                mountRef.current.removeEventListener(
                    "pointermove",
                    onPointerMove
                )
                mountRef.current.removeEventListener(
                    "pointerleave",
                    onPointerLeave
                )
                mountRef.current.removeEventListener("pointerup", onPointerUp)
                mountRef.current.removeEventListener(
                    "pointercancel",
                    onPointerUp
                )
                mountRef.current.removeEventListener("wheel", onWheel)
            }
            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            baseGeometry.dispose()
            frameHitboxMat.dispose()
            loadedTextures.forEach((tex) => tex.dispose())
            loadedMaterials.forEach((m) => m.mat.dispose())

            videoMap.forEach((video) => {
                video.pause()
                video.removeAttribute("src")
                video.load()
            })

            scene.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose()
                    if (child.material)
                        Array.isArray(child.material)
                            ? child.material.forEach((m) => m.dispose())
                            : child.material.dispose()
                }
            })
            scene.clear()
            renderer.forceContextLoss()
            renderer.dispose()
            if (
                mountRef.current &&
                mountRef.current.contains(renderer.domElement)
            ) {
                mountRef.current.removeChild(renderer.domElement)
            }
        }
    }, [
        mergedProps.svgFile,
        Array.isArray(mergedProps.images) ? mergedProps.images.join(",") : "",
        Array.isArray(mergedProps.videos) ? mergedProps.videos.join(",") : "",
        Array.isArray(mergedProps.connectedFrames)
            ? mergedProps.connectedFrames.length
            : 0,
    ])

    // --- 7. REACT DOM OVERLAYS ---
    const gapRatio = (mergedProps.imageGap || 10) / 100
    const requiredToFill = Math.ceil(1.0 / gapRatio) + 1
    const activeCount = Math.max(mergedProps.imageCount || 15, requiredToFill)
    const safeActiveCount = Math.min(activeCount, 150)

    const validImages = Array.isArray(mergedProps.images)
        ? mergedProps.images
        : []
    const validVideos = Array.isArray(mergedProps.videos)
        ? mergedProps.videos
        : []
    const validFrames = Array.isArray(mergedProps.connectedFrames)
        ? mergedProps.connectedFrames
        : []
    const numMedia = validImages.length + validVideos.length
    const numFrames = validFrames.length
    const totalUnique = numMedia + numFrames || 1

    const overlayNodes = []
    for (let i = 0; i < safeActiveCount; i++) {
        const uniqueIdx = i % totalUnique
        const isFrame = numFrames > 0 && uniqueIdx >= numMedia

        if (isFrame) {
            const frameIndex = uniqueIdx - numMedia
            const FrameComponent = validFrames[frameIndex]
            overlayNodes.push(
                <div
                    key={`frame-${i}`}
                    ref={(el) => (domRefs.current[i] = el)}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transform:
                            "translate(-10000px, -10000px) translate(-50%, -50%)",
                        transformOrigin: "center center",
                        willChange: "transform, opacity",
                        pointerEvents: "auto",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        opacity: 0,
                    }}
                >
                    <div style={{ width: "100%", height: "100%" }}>
                        {FrameComponent}
                    </div>
                </div>
            )
        } else {
            overlayNodes.push(
                <div
                    key={`empty-${i}`}
                    ref={(el) => (domRefs.current[i] = el)}
                />
            )
        }
    }

    return (
        <div
            {...props}
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 500,
                minHeight: 400,
                ...props.style,
                position: "relative",
                touchAction: "none",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 10,
                }}
            >
                {overlayNodes}
            </div>
        </div>
    )
}

// STEP 2: Nested Defaults (Moved connectedFrames to Root)
PathCarousel.defaultProps = {
    connectedFrames: [],
    content: {
        images: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop",
        ],
        videos: [],
        svgFile: "",
        imageCount: 15,
    },
    styling: {
        imageWidth: 4.5,
        imageHeight: 6,
        imageRadius: 0.2,
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        pathOffsetX: 0,
        pathOffsetY: 0,
        pathRotation: 0,
        cameraZoom: 18,
        imageGap: 10,
        viewportInset: 0,
        randomSize: false,
        randomnessAmount: 0.5,
        startScale: 0.0,
        endScale: 0.0,
        scaleDistance: 15,
    },
    interaction: {
        damping: 0.08,
        autoScroll: true,
        autoPlaySpeed: 1.0,
        dragSensitivity: 15,
        enableScroll: true,
        scrollSensitivity: 15,
        hoverScale: 0.05,
        hoverPause: true,
    },
}

// STEP 3: UI Categorization (Moved connectedFrames to Root)
addPropertyControls(PathCarousel, {
    connectedFrames: {
        type: ControlType.Array,
        control: { type: ControlType.ComponentInstance },
        title: "Connect Frames",
        description: "Map native Framer layouts onto the path.",
    },
    content: {
        type: ControlType.Object,
        title: "Content",
        description: "Set the path and media.",
        controls: {
            svgFile: {
                type: ControlType.File,
                title: "Upload Path",
                allowedFileTypes: ["svg"],
            },
            images: {
                type: ControlType.Array,
                control: { type: ControlType.Image },
                title: "Images",
            },
            videos: {
                type: ControlType.Array,
                control: {
                    type: ControlType.File,
                    allowedFileTypes: ["mp4", "webm"],
                },
                title: "Videos",
            },
            imageCount: {
                type: ControlType.Number,
                title: "Total Items",
                min: 1,
                max: 100,
                step: 1,
            },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Styling",
        controls: {
            pathOffsetX: {
                type: ControlType.Number,
                title: "Path X",
                min: -100,
                max: 100,
                step: 0.5,
                displayStepper: true,
            },
            pathOffsetY: {
                type: ControlType.Number,
                title: "Path Y",
                min: -100,
                max: 100,
                step: 0.5,
                displayStepper: true,
            },
            pathRotation: {
                type: ControlType.Number,
                title: "Path Rot",
                min: -360,
                max: 360,
                step: 1,
            },
            viewportInset: {
                type: ControlType.Number,
                title: "Inset Bounds",
                min: -50,
                max: 50,
                step: 0.5,
            },
            imageWidth: {
                type: ControlType.Number,
                title: "Item Width",
                min: 1,
                max: 40,
                step: 0.1,
            },
            imageHeight: {
                type: ControlType.Number,
                title: "Item Height",
                min: 1,
                max: 40,
                step: 0.1,
            },
            imageRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 10,
                step: 0.1,
            },
            brightness: {
                type: ControlType.Number,
                title: "Brightness",
                min: 0,
                max: 3,
                step: 0.05,
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                min: 0,
                max: 3,
                step: 0.05,
            },
            saturation: {
                type: ControlType.Number,
                title: "Saturation",
                min: 0,
                max: 3,
                step: 0.05,
            },
            randomSize: { type: ControlType.Boolean, title: "Random Size" },
            randomnessAmount: {
                type: ControlType.Number,
                title: "Random Var",
                min: 0,
                max: 1,
                step: 0.05,
            },
            startScale: {
                type: ControlType.Number,
                title: "Start Scale",
                min: 0,
                max: 5,
                step: 0.1,
            },
            endScale: {
                type: ControlType.Number,
                title: "End Scale",
                min: 0,
                max: 5,
                step: 0.1,
            },
            scaleDistance: {
                type: ControlType.Number,
                title: "Scale Dist (%)",
                min: 1,
                max: 50,
                step: 1,
            },
            cameraZoom: {
                type: ControlType.Number,
                title: "Camera Zoom",
                min: 5,
                max: 100,
                step: 0.5,
            },
            imageGap: {
                type: ControlType.Number,
                title: "Gap (%)",
                min: 1,
                max: 100,
                step: 0.5,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            hoverScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                min: 0.0,
                max: 1.0,
                step: 0.05,
            },
            hoverPause: { type: ControlType.Boolean, title: "Hover Pause" },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                min: 0.01,
                max: 0.3,
                step: 0.01,
            },
            autoScroll: { type: ControlType.Boolean, title: "Auto Scroll" },
            autoPlaySpeed: {
                type: ControlType.Number,
                title: "Auto Speed",
                min: -5.0,
                max: 5.0,
                step: 0.1,
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Drag Factor",
                min: 1,
                max: 50,
                step: 1,
            },
            enableScroll: { type: ControlType.Boolean, title: "Wheel Scroll" },
            scrollSensitivity: {
                type: ControlType.Number,
                title: "Wheel Factor",
                min: 1,
                max: 50,
                step: 1,
            },
        },
    },
})
