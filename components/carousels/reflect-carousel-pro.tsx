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


// Local planar mirror. All objects come from the same core Three.js module;
// no addon imports or Vector4 constructor are required.
function createPlanarMirror(
    geometry: THREE.BufferGeometry,
    options: {
        textureWidth: number
        textureHeight: number
        clipBias: number
        color: THREE.ColorRepresentation
    }
) {
    const target = new THREE.WebGLRenderTarget(
        Math.max(1, Math.floor(options.textureWidth)),
        Math.max(1, Math.floor(options.textureHeight)),
        { type: THREE.HalfFloatType, samples: 4 }
    )
    const textureMatrix = new THREE.Matrix4()
    const material = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: target.texture },
            color: { value: new THREE.Color(options.color) },
            textureMatrix: { value: textureMatrix },
        },
        vertexShader: `uniform mat4 textureMatrix;varying vec4 vUv;
        void main(){vUv=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform sampler2D tDiffuse;uniform vec3 color;varying vec4 vUv;
        void main(){if(vUv.w<=0.)discard;vec4 base=texture2DProj(tDiffuse,vUv);gl_FragColor=vec4(base.rgb*color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    })
    const mirror = new THREE.Mesh(geometry, material)
    const virtualCamera = new THREE.PerspectiveCamera()
    const plane = new THREE.Plane(),
        normal = new THREE.Vector3(),
        origin = new THREE.Vector3(),
        eye = new THREE.Vector3(),
        rotation = new THREE.Matrix4(),
        view = new THREE.Vector3(),
        look = new THREE.Vector3(),
        aim = new THREE.Vector3()
    mirror.onBeforeRender = (renderer, scene, camera) => {
        const source = camera as THREE.PerspectiveCamera
        origin.setFromMatrixPosition(mirror.matrixWorld)
        eye.setFromMatrixPosition(source.matrixWorld)
        rotation.extractRotation(mirror.matrixWorld)
        normal.set(0, 0, 1).transformDirection(rotation)
        view.subVectors(origin, eye)
        if (view.dot(normal) > 0) return
        view.reflect(normal).negate().add(origin)
        rotation.extractRotation(source.matrixWorld)
        look.set(0, 0, -1).transformDirection(rotation).add(eye)
        aim.subVectors(origin, look).reflect(normal).negate().add(origin)
        virtualCamera.position.copy(view)
        virtualCamera.up
            .set(0, 1, 0)
            .transformDirection(rotation)
            .reflect(normal)
        virtualCamera.lookAt(aim)
        virtualCamera.far = source.far
        virtualCamera.layers.mask = source.layers.mask
        virtualCamera.updateMatrixWorld()
        virtualCamera.projectionMatrix.copy(source.projectionMatrix)
        textureMatrix
            .set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
            .multiply(virtualCamera.projectionMatrix)
            .multiply(virtualCamera.matrixWorldInverse)
            .multiply(mirror.matrixWorld)
        plane
            .setFromNormalAndCoplanarPoint(normal, origin)
            .applyMatrix4(virtualCamera.matrixWorldInverse)
        const e = virtualCamera.projectionMatrix.elements,
            x = plane.normal.x,
            y = plane.normal.y,
            z = plane.normal.z,
            w = plane.constant
        const qx = (Math.sign(x) + e[8]) / e[0],
            qy = (Math.sign(y) + e[9]) / e[5],
            qw = (1 + e[10]) / e[14]
        const divisor = x * qx + y * qy - z + w * qw
        if (Math.abs(divisor) < 1e-10) return
        const scale = 2 / divisor
        e[2] = x * scale
        e[6] = y * scale
        e[10] = z * scale + 1 - options.clipBias
        e[14] = w * scale
        const previous = renderer.getRenderTarget(),
            xr = renderer.xr.enabled,
            shadows = renderer.shadowMap.autoUpdate
        mirror.visible = false
        try {
            renderer.xr.enabled = false
            renderer.shadowMap.autoUpdate = false
            renderer.setRenderTarget(target)
            renderer.state.buffers.depth.setMask(true)
            if (!renderer.autoClear) renderer.clear()
            renderer.render(scene, virtualCamera)
        } finally {
            renderer.xr.enabled = xr
            renderer.shadowMap.autoUpdate = shadows
            renderer.setRenderTarget(previous)
            mirror.visible = true
        }
    }
    return Object.assign(mirror, {
        getRenderTarget: () => target,
        dispose: () => target.dispose(),
    })
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 */
export default function InfiniteCurvedCarousel(incomingProps: any) {
    // STEP 1: INTERCEPT & FLATTEN PROPS
    const defaults = InfiniteCurvedCarousel.defaultProps
    const props = {
        ...defaults,
        ...incomingProps,
        ...defaults.content,
        ...(incomingProps.content || {}),
        ...defaults.layout,
        ...(incomingProps.layout || {}),
        ...defaults.style,
        ...(incomingProps.style || {}),
        ...defaults.interaction,
        ...(incomingProps.interaction || {}),
    }
    const {
        reflectionColor,
        contrast,
        saturation,
        brightness,
        fadeStrength,
        fadeLength,
        cameraFov,
        cameraY,
        cameraZ,
        ...containerStyle
    } = incomingProps.style || {}

    const mountRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.editorPreview ?? true)

    // Viewport gating
    const isIntersecting = useRef(false)

    useEffect(() => {
        if (!mountRef.current) return

        const container = mountRef.current
        let alive = true
        let frameId: number | undefined
        let targetScroll = 0
        let currentScroll = 0
        let isDragging = false
        let dragDistance = 0
        let previousPointerX = 0
        let hoveredMesh = null

        // Raycasting for cinematic hover & links
        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2(-2, -2) // Init off-screen

        // Track disposable assets for strict cleanup
        const textures = []
        const materials = []
        const geometries = []
        const meshes = []
        const videos = [] // Track video elements for cleanup
        const mediaCleanup: (() => void)[] = []
        let meshesData: any[] = []
        const raycastMeshes = [] // Meshes targeted for interaction

        // 1. SCENE SETUP
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(props.backgroundColor)

        // 2. CAMERA SETUP
        const camera = new THREE.PerspectiveCamera(
            props.cameraFov,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        )
        // Position camera and look slightly downward at the center to emphasize floor perspective
        camera.position.set(0, props.cameraY, props.cameraZ)
        camera.lookAt(0, props.itemHeight / 2, 0)

        // 3. RENDERER SETUP
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(container.clientWidth, container.clientHeight)

        // Ensure raw colors aren't unnecessarily crushed/saturated
        renderer.toneMapping = THREE.NoToneMapping
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)

        const renderFrame = () => {
            renderer.render(scene, camera)
            container.dataset.frames = String(
                Number(container.dataset.frames || 0) + 1
            )
        }

        // 4. CAROUSEL ARCHITECTURE
        const carouselGroup = new THREE.Group()
        scene.add(carouselGroup)

        // -------------------------------------------------------------
        // REFLECTOR SETUP (High Resolution & Glitch Fixes applied)
        // -------------------------------------------------------------

        // FIX: Highly subdivided plane prevents nonlinear depth precision artifacts (smearing)
        const reflectorGeometry = new THREE.PlaneGeometry(1000, 1000, 128, 128)
        geometries.push(reflectorGeometry)

        const pixelRatio = Math.min(window.devicePixelRatio, 2)
        const initWidth = container.clientWidth || window.innerWidth
        const initHeight = container.clientHeight || window.innerHeight

        // Cap resolution to 2048 to prevent VRAM overflow and texture corruption on massive monitors
        const maxResX = Math.min(initWidth * pixelRatio, 2048)
        const maxResY = Math.min(initHeight * pixelRatio, 2048)

        const mirror = createPlanarMirror(reflectorGeometry, {
            clipBias: 0.005, // FIX: Prevents bottom edge z-fighting against the floor
            textureWidth: maxResX,
            textureHeight: maxResY,
            color: props.reflectionColor,
        })

        // Ensure reflector renders in correct color space
        if (mirror.getRenderTarget) {
            const rt = mirror.getRenderTarget()
            if (rt && rt.texture) rt.texture.colorSpace = THREE.SRGBColorSpace
        }

        // FIX: Override Reflector Shader to eliminate edge smearing & fix over-saturation
        let frag = mirror.material.fragmentShader

        // 1. Prevent Edge pixel clamping/smearing when outside of virtual camera bounds
        frag = frag.replace(
            /void main\(\)\s*\{/,
            "void main() {\nvec2 projUv = vUv.xy / vUv.w;\nif (projUv.x < 0.0 || projUv.x > 1.0 || projUv.y < 0.0 || projUv.y > 1.0) discard;\n"
        )

        // 2. Replace the native "Overlay" blend mode with standard multiplication to preserve original image saturation
        frag = frag.replace(
            /blendOverlay\(\s*base\.rgb\s*,\s*color\s*\)/g,
            "(base.rgb * color)"
        )

        mirror.material.fragmentShader = frag

        mirror.rotation.x = -Math.PI / 2
        mirror.position.y = 0
        scene.add(mirror)
        materials.push(mirror.material)
        meshes.push(mirror)

        // -------------------------------------------------------------
        // FADE OVERLAY FOR REFLECTION (Adjustable Duration & Strength)
        // -------------------------------------------------------------
        const fadeGeometry = new THREE.PlaneGeometry(2000, 2000)
        geometries.push(fadeGeometry)

        const fadeEndDistance = Math.max(
            0.1,
            props.itemHeight * (props.fadeLength / 100) * 3.0
        )

        const fadeMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                bgColor: { value: new THREE.Color(props.backgroundColor) },
                fadeStart: { value: props.floorGap || 0.0 },
                fadeEnd: { value: (props.floorGap || 0.0) + fadeEndDistance },
                uCurveIntensity: { value: props.curveIntensity },
                fadeStrength: { value: props.fadeStrength / 100.0 },
            },
            vertexShader: `
                varying vec3 vWorldPos;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 bgColor;
                uniform float fadeStart;
                uniform float fadeEnd;
                uniform float uCurveIntensity;
                uniform float fadeStrength;
                varying vec3 vWorldPos;

                void main() {
                    float dist = 0.0;
                    if (uCurveIntensity == 0.0) {
                        dist = abs(vWorldPos.z);
                    } else {
                        float R = 2000.0 / uCurveIntensity;
                        dist = abs(length(vec2(vWorldPos.x, vWorldPos.z - R)) - R);
                    }
                    float alpha = smoothstep(fadeStart, fadeEnd, dist) * fadeStrength;
                    float alphaX = smoothstep(30.0, 50.0, abs(vWorldPos.x)) * fadeStrength;

                    gl_FragColor = vec4(bgColor, max(alpha, alphaX));
                }
            `,
        })
        materials.push(fadeMaterial)

        const fadePlane = new THREE.Mesh(fadeGeometry, fadeMaterial)
        fadePlane.rotation.x = -Math.PI / 2
        fadePlane.position.y = 0.01
        fadePlane.renderOrder = -1
        scene.add(fadePlane)
        meshes.push(fadePlane)

        // FIX: Hide the fade overlay dynamically only during the reflection's virtual render pass
        const mirrorReflect: any = mirror.onBeforeRender
        mirror.onBeforeRender = function (renderer, scene, camera) {
            if (fadePlane) fadePlane.visible = false
            if (mirrorReflect) mirrorReflect.call(this, renderer, scene, camera)
            if (fadePlane) fadePlane.visible = true
        }

        // Advanced Shader for the Cards (Corner Radius, Color Adjustments)
        const vertexShader = `
            varying vec2 vUv;
            varying vec2 vScale;
            void main() {
                vUv = uv;
                vScale = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `

        const fragmentShader = `
            uniform sampler2D tDiffuse;
            uniform vec2 uSize;
            uniform float uRadius;
            uniform float uContrast;
            uniform float uSaturation;
            uniform float uBrightness;
            varying vec2 vUv;
            varying vec2 vScale;

            void main() {
                vec2 scaledSize = uSize * vScale.x;
                vec2 halfSize = scaledSize / 2.0;
                vec2 pixelPos = (vUv - 0.5) * scaledSize;
                
                vec2 q = abs(pixelPos) - halfSize + uRadius;
                float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
                
                float edgeSoftness = 0.015;
                float alpha = 1.0 - smoothstep(-edgeSoftness, edgeSoftness, dist);

                if (alpha <= 0.01) discard;

                vec4 texColor = texture2D(tDiffuse, vUv);
                vec3 color = texColor.rgb;
                
                // Brightness
                color *= uBrightness;
                
                // Contrast
                color = (color - 0.5) * uContrast + 0.5;
                
                // Saturation
                float luma = dot(color, vec3(0.299, 0.587, 0.114));
                color = mix(vec3(luma), color, uSaturation);
                
                gl_FragColor = vec4(color, alpha);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `

        // 5. ASSET LOADING & MESH GENERATION
        // Only allow media uploaded to Framer or hosted on this site's own origin.
        const getSafeMediaUrl = (value: unknown): string | null => {
            if (typeof value !== "string" || !value.trim()) return null

            try {
                const url = new URL(value.trim(), window.location.href)
                const isSameOrigin = url.origin === window.location.origin
                const isFramerAsset =
                    url.protocol === "https:" &&
                    !url.port &&
                    (url.hostname === "framerusercontent.com" ||
                        url.hostname.endsWith(".framerusercontent.com"))

                if (
                    (url.protocol !== "https:" && url.protocol !== "http:") ||
                    url.username ||
                    url.password ||
                    (!isSameOrigin && !isFramerAsset)
                ) {
                    return null
                }

                return url.href
            } catch {
                return null
            }
        }

        const loadAsVideo = (src) => {
            return new Promise<THREE.Texture>((resolve, reject) => {
                const safeSrc = getSafeMediaUrl(src)
                if (!safeSrc) {
                    reject(
                        new Error(
                            "Only Framer-uploaded or same-origin media is allowed"
                        )
                    )
                    return
                }
                if (!alive) {
                    reject(new Error("Component disposed"))
                    return
                }
                const video = document.createElement("video")
                // Set the source after configuring CORS and playback.
                video.crossOrigin = "anonymous"
                video.loop = true
                video.muted = true
                video.playsInline = true
                video.autoplay = false

                videos.push(video)

                const ready = () => {
                    if (!alive) {
                        reject(new Error("Component disposed"))
                        return
                    }
                    if (shouldAnimate && isIntersecting.current)
                        video.play().catch(() => {})
                    const tex = new THREE.VideoTexture(video)
                    tex.colorSpace = THREE.SRGBColorSpace
                    tex.minFilter = THREE.LinearFilter
                    tex.generateMipmaps = false
                    textures.push(tex)
                    resolve(tex)
                }
                const failed = (err) => reject(err)
                video.addEventListener("loadeddata", ready, { once: true })
                video.addEventListener("error", failed, { once: true })
                mediaCleanup.push(() => {
                    video.removeEventListener("loadeddata", ready)
                    video.removeEventListener("error", failed)
                })
                video.src = safeSrc
                video.load()
            })
        }

        const loadMedia = (src) => {
            return new Promise<THREE.Texture>((resolve, reject) => {
                const safeSrc = getSafeMediaUrl(src)
                if (!safeSrc) {
                    reject(
                        new Error(
                            "Only Framer-uploaded or same-origin media is allowed"
                        )
                    )
                    return
                }
                const ext = safeSrc.split(".").pop().toLowerCase().split("?")[0]
                const videoExts = ["mp4", "webm", "ogg", "mov"]
                const isVid = videoExts.includes(ext)

                if (isVid) {
                    loadAsVideo(safeSrc).then(resolve).catch(reject)
                } else {
                    const pendingTexture = new THREE.TextureLoader().load(
                        safeSrc,
                        (tex) => {
                            if (!alive) {
                                tex.dispose()
                                reject(new Error("Component disposed"))
                                return
                            }
                            tex.colorSpace = THREE.SRGBColorSpace
                            tex.minFilter = THREE.LinearMipmapLinearFilter
                            tex.generateMipmaps = true
                            resolve(tex)
                        },
                        undefined,
                        () => {
                            if (alive)
                                loadAsVideo(safeSrc).then(resolve).catch(reject)
                            else reject(new Error("Component disposed"))
                        }
                    )
                    textures.push(pendingTexture)
                }
            })
        }

        let itemsArray = props.items || []
        if (itemsArray.length === 0 && props.media && props.media.length > 0) {
            itemsArray = props.media.map((m) => ({ media: m, link: "" }))
        }

        const validItems = itemsArray.filter(
            (item) => item && getSafeMediaUrl(item.media) !== null
        )

        let totalWidth = 0

        if (validItems.length === 0) {
            renderFrame()
        } else {
            Promise.all(
                validItems.map((item) =>
                    loadMedia(item.media).then((tex) => ({
                        tex,
                        link: item.link,
                    }))
                )
            )
                .then((loadedAssets) => {
                    if (!alive) {
                        loadedAssets.forEach((a) => a.tex.dispose())
                        return
                    }
                    const spacing = props.itemWidth + props.gap
                    const minimumMeshes = Math.max(20, Math.ceil(70 / spacing))
                    const multiplier = Math.ceil(
                        minimumMeshes / loadedAssets.length
                    )

                    const totalItems = loadedAssets.length * multiplier
                    totalWidth = totalItems * spacing
                    let meshIndex = 0

                    const geo = new THREE.PlaneGeometry(
                        props.itemWidth,
                        props.itemHeight
                    )
                    geometries.push(geo)

                    const assetMaterials = loadedAssets.map((asset) => {
                        const mat = new THREE.ShaderMaterial({
                            uniforms: {
                                tDiffuse: { value: asset.tex },
                                uSize: {
                                    value: new THREE.Vector2(
                                        props.itemWidth,
                                        props.itemHeight
                                    ),
                                },
                                uRadius: { value: props.cornerRadius },
                                uContrast: { value: props.contrast },
                                uSaturation: { value: props.saturation },
                                uBrightness: { value: props.brightness },
                            },
                            vertexShader,
                            fragmentShader,
                            transparent: true,
                            depthWrite: false,
                            side: THREE.DoubleSide,
                        })
                        materials.push(mat)
                        return mat
                    })

                    for (let i = 0; i < multiplier; i++) {
                        loadedAssets.forEach((asset, assetIdx) => {
                            const baseX = meshIndex * spacing

                            const mainMat = assetMaterials[assetIdx]

                            const mainMesh = new THREE.Mesh(geo, mainMat)
                            mainMesh.userData = {
                                link: asset.link,
                                originalIndex: meshIndex,
                            }
                            carouselGroup.add(mainMesh)
                            meshes.push(mainMesh)
                            raycastMeshes.push(mainMesh)

                            meshesData.push({
                                mainMesh,
                                baseX,
                                currentScale: 1.0,
                            })
                            meshIndex++
                        })
                    }

                    if (!shouldAnimate && alive) forceManualUpdate()
                })
                .catch((err) => {
                    if (alive) console.error("Error loading media:", err)
                })
        }

        const forceManualUpdate = () => {
            if (!alive) return
            raycaster.setFromCamera(pointer, camera)
            hoveredMesh =
                raycaster.intersectObjects(raycastMeshes)[0]?.object || null
            applyScrollLogic(true)
            renderFrame()
        }

        // Positioning Logic (With Curvature & Hover Pop)
        const applyScrollLogic = (snap = false) => {
            if (totalWidth === 0) return

            if (snap) {
                currentScroll = targetScroll
            } else {
                currentScroll += (targetScroll - currentScroll) * 0.05
            }

            meshesData.forEach((data) => {
                const isHoveredItem = data.mainMesh === hoveredMesh
                const targetItemScale = isHoveredItem ? props.hoverScale : 1.0

                if (snap) {
                    data.currentScale = targetItemScale
                } else {
                    data.currentScale +=
                        (targetItemScale - data.currentScale) * 0.1
                }

                data.mainMesh.scale.setScalar(data.currentScale)

                let initialX = data.baseX - totalWidth / 2
                let x = initialX + currentScroll
                let wrappedX =
                    ((((x + totalWidth / 2) % totalWidth) + totalWidth) %
                        totalWidth) -
                    totalWidth / 2

                // Calculate vertical lift to keep the bottom anchored to the floorGap
                const currentY =
                    props.floorGap + (props.itemHeight / 2) * data.currentScale
                // Add positive Z offset so hovered items move towards the camera (in front)
                const zPopOffset = (data.currentScale - 1.0) * 2.0

                // Make hovered mesh render on top of adjacent transparent items
                data.mainMesh.renderOrder = isHoveredItem ? 10 : 1

                if (props.curveIntensity === 0) {
                    data.mainMesh.position.set(wrappedX, currentY, zPopOffset)
                    data.mainMesh.rotation.set(0, 0, 0)
                } else {
                    const R = 2000 / props.curveIntensity
                    const angle = wrappedX / R

                    const curX = Math.sin(angle) * R
                    const curZ = R - Math.cos(angle) * R + zPopOffset

                    data.mainMesh.position.set(curX, currentY, curZ)
                    data.mainMesh.rotation.y = -angle
                }
            })
        }

        // 6. INTERACTION HANDLING
        const onPointerDown = (e) => {
            isDragging = true
            dragDistance = 0
            previousPointerX = e.clientX
        }

        const updatePointer = (e) => {
            const rect = container.getBoundingClientRect()
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        }

        const onPointerMove = (e) => {
            updatePointer(e)

            if (isDragging) {
                const deltaX = e.clientX - previousPointerX
                dragDistance += Math.abs(deltaX)
                targetScroll += deltaX * (props.dragSensitivity * 0.01)
                previousPointerX = e.clientX
            }

            if (!shouldAnimate && alive) forceManualUpdate()
        }

        const onPointerUp = (e) => {
            isDragging = false

            if (dragDistance < 5 && hoveredMesh) {
                const linkUrl = hoveredMesh.userData.link
                if (
                    linkUrl &&
                    typeof linkUrl === "string" &&
                    linkUrl.trim() !== ""
                ) {
                    const isExternal =
                        linkUrl.startsWith("http") ||
                        linkUrl.startsWith("mailto:") ||
                        linkUrl.startsWith("tel:")
                    if (isExternal) {
                        window.open(linkUrl, "_blank")
                    } else {
                        window.location.href = linkUrl
                    }
                }
            }
        }

        const onPointerLeave = () => {
            isDragging = false
            pointer.set(-2, -2)
        }

        const onWheel = (e) => {
            const delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : -e.deltaY
            targetScroll += delta * (props.dragSensitivity * 0.01)
            if (!shouldAnimate && alive) forceManualUpdate()
        }

        container.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        container.addEventListener("pointerleave", onPointerLeave)
        container.addEventListener("wheel", onWheel, { passive: true })

        // 7. RESPONSIVE RESIZING
        const resizeObserver = new ResizeObserver((entries) => {
            if (!alive) return
            for (let entry of entries) {
                const { width, height } = entry.contentRect
                if (width === 0 || height === 0) continue
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)

                if (mirror && typeof mirror.getRenderTarget === "function") {
                    const rt = mirror.getRenderTarget()
                    if (rt) {
                        const pr = Math.min(window.devicePixelRatio, 2)
                        rt.setSize(
                            Math.min(width * pr, 2048),
                            Math.min(height * pr, 2048)
                        )
                    }
                }

                if (!shouldAnimate && alive) forceManualUpdate()
            }
        })
        resizeObserver.observe(container)

        // 8. VIEWPORT GATING
        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isIntersecting.current = entry.isIntersecting
                if (!entry.isIntersecting) {
                    cancelAnimationFrame(frameId)
                    frameId = undefined
                    videos.forEach((v) => v.pause())
                } else if (shouldAnimate && !frameId) {
                    videos.forEach((v) => v.play().catch(() => {}))
                    tick()
                } else if (!shouldAnimate) forceManualUpdate()
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(container)

        // 9. ANIMATION LOOP
        const tick = () => {
            frameId = undefined
            if (!alive || !isIntersecting.current) return
            if (shouldAnimate) frameId = requestAnimationFrame(tick)

            raycaster.setFromCamera(pointer, camera)
            const intersects = raycaster.intersectObjects(raycastMeshes)

            if (intersects.length > 0) {
                hoveredMesh = intersects[0].object
            } else {
                hoveredMesh = null
            }

            const isHoveringLink =
                hoveredMesh &&
                hoveredMesh.userData.link &&
                hoveredMesh.userData.link.trim() !== ""
            if (isDragging) {
                container.style.cursor = "grabbing"
            } else if (isHoveringLink) {
                container.style.cursor = "pointer"
            } else if (hoveredMesh) {
                container.style.cursor = "grab"
            } else {
                container.style.cursor = "grab"
            }

            if (props.autoPlay && !isDragging && !hoveredMesh) {
                targetScroll -= props.speed * 0.02
            }

            applyScrollLogic(false)

            if (fadeMaterial) {
                fadeMaterial.uniforms.fadeStrength.value =
                    props.fadeStrength / 100.0
                const currentFadeEndDistance = Math.max(
                    0.1,
                    props.itemHeight * (props.fadeLength / 100) * 3.0
                )
                fadeMaterial.uniforms.fadeEnd.value =
                    (props.floorGap || 0.0) + currentFadeEndDistance
            }

            // Sync uniforms for live editing adjustments
            meshesData.forEach((data) => {
                if (data.mainMesh.material) {
                    data.mainMesh.material.uniforms.uContrast.value =
                        props.contrast
                    data.mainMesh.material.uniforms.uSaturation.value =
                        props.saturation
                    data.mainMesh.material.uniforms.uBrightness.value =
                        props.brightness
                    data.mainMesh.material.uniforms.uRadius.value =
                        props.cornerRadius
                }
            })

            renderFrame()
        }

        if (shouldAnimate) {
            isIntersecting.current = true
            tick()
        } else {
            forceManualUpdate()
        }

        // 10. STRICT CLEANUP
        return () => {
            alive = false
            cancelAnimationFrame(frameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            container.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointerleave", onPointerLeave)
            container.removeEventListener("wheel", onWheel)

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }

            scene.clear()

            mediaCleanup.splice(0).forEach((fn) => fn())
            videos.forEach((v) => {
                v.pause()
                v.removeAttribute("src")
                v.load()
            })

            if (mirror) {
                if (typeof mirror.dispose === "function") mirror.dispose()
                // The mirror owns and disposes its render target.
            }

            textures.forEach((t) => t.dispose())
            geometries.forEach((g) => g.dispose())
            materials.forEach((m) => m.dispose())

            renderer.forceContextLoss()
            renderer.dispose()
        }
    }, [
        props.items,
        props.itemWidth,
        props.itemHeight,
        props.gap,
        props.cornerRadius,
        props.floorGap,
        props.curveIntensity,
        props.backgroundColor,
        props.reflectionColor,
        props.fadeStrength,
        props.fadeLength,
        props.contrast,
        props.saturation,
        props.brightness,
        props.hoverScale,
        props.cameraFov,
        props.cameraY,
        props.cameraZ,
        props.autoPlay,
        props.speed,
        props.dragSensitivity,
        shouldAnimate,
    ])

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                overflow: "hidden",
                cursor: "grab",
                position: "relative",
                ...containerStyle,
            }}
        />
    )
}

// STEP 2: NESTED DEFAULTS
InfiniteCurvedCarousel.defaultProps = {
    editorPreview: true,
    content: {
        items: [],
    },
    layout: {
        itemWidth: 5,
        itemHeight: 6,
        gap: 0,
        cornerRadius: 0,
        floorGap: 0,
        curveIntensity: 100,
    },
    style: {
        backgroundColor: "#000000",
        reflectionColor: "#888888",
        contrast: 1.0,
        saturation: 1.0,
        brightness: 1.0,
        fadeStrength: 100,
        fadeLength: 50,
        cameraFov: 48,
        cameraY: 2.6,
        cameraZ: 23,
    },
    interaction: {
        autoPlay: true,
        speed: 0.5,
        dragSensitivity: 1.5,
        hoverScale: 1.08,
    },
}

// STEP 3: UI CATEGORIZATION
addPropertyControls(InfiniteCurvedCarousel, {
    editorPreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
    },
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            items: {
                type: ControlType.Array,
                title: "Items",
                control: {
                    type: ControlType.Object,
                    controls: {
                        media: {
                            type: ControlType.File,
                            title: "Media (Img/Vid)",
                            allowedFileTypes: [
                                "jpg",
                                "jpeg",
                                "png",
                                "webp",
                                "mp4",
                                "mov",
                                "webm",
                                "ogg",
                            ],
                        },
                        link: {
                            type: ControlType.Link,
                            title: "Click Link",
                        },
                    },
                },
                description:
                    "List of items with optional links. Array loops automatically.",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Dimensions",
        controls: {
            itemWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 5,
                min: 1,
                max: 20,
                step: 0.1,
                displayStepper: true,
            },
            itemHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 6,
                min: 1,
                max: 20,
                step: 0.1,
                displayStepper: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Item Gap",
                defaultValue: 0,
                min: 0,
                max: 10,
                step: 0.1,
                displayStepper: true,
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: 0,
                min: 0,
                max: 5,
                step: 0.05,
                displayStepper: true,
            },
            floorGap: {
                type: ControlType.Number,
                title: "Floor Gap",
                defaultValue: 0,
                min: 0,
                max: 5,
                step: 0.05,
                displayStepper: true,
            },
            curveIntensity: {
                type: ControlType.Number,
                title: "Curve",
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                displayStepper: true,
            },
        },
    },
    style: {
        type: ControlType.Object,
        title: "Styling",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000000",
            },
            reflectionColor: {
                type: ControlType.Color,
                title: "Reflection Tint",
                defaultValue: "#888888",
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                defaultValue: 1.0,
                min: 0,
                max: 3,
                step: 0.05,
                displayStepper: true,
            },
            saturation: {
                type: ControlType.Number,
                title: "Saturation",
                defaultValue: 1.0,
                min: 0,
                max: 3,
                step: 0.05,
                displayStepper: true,
            },
            brightness: {
                type: ControlType.Number,
                title: "Brightness",
                defaultValue: 1.0,
                min: 0,
                max: 3,
                step: 0.05,
                displayStepper: true,
            },
            fadeStrength: {
                type: ControlType.Number,
                title: "Fade Opacity",
                defaultValue: 100,
                min: 0,
                max: 100,
                unit: "%",
                displayStepper: true,
            },
            fadeLength: {
                type: ControlType.Number,
                title: "Fade Distance",
                defaultValue: 50,
                min: 0,
                max: 100,
                unit: "%",
                displayStepper: true,
            },
            cameraFov: {
                type: ControlType.Number,
                title: "Camera FOV",
                defaultValue: 48,
                min: 20,
                max: 120,
                step: 1,
                displayStepper: true,
            },
            cameraY: {
                type: ControlType.Number,
                title: "Camera Height",
                defaultValue: 2.6,
                min: 0,
                max: 20,
                step: 0.1,
                displayStepper: true,
            },
            cameraZ: {
                type: ControlType.Number,
                title: "Camera Depth",
                defaultValue: 23,
                min: 5,
                max: 50,
                step: 0.5,
                displayStepper: true,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        description:
            "More components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            autoPlay: {
                type: ControlType.Boolean,
                title: "Auto Play",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Play Speed",
                defaultValue: 0.5,
                min: -20,
                max: 20,
                step: 0.5,
                displayStepper: true,
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Drag Speed",
                defaultValue: 1.5,
                min: 1,
                max: 20,
                step: 0.5,
                displayStepper: true,
            },
            hoverScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                defaultValue: 1.08,
                min: 1.0,
                max: 1.5,
                step: 0.01,
                displayStepper: true,
            },
        },
    },
})
