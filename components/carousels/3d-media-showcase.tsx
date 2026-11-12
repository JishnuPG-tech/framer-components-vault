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
 * 3D CAROUSEL (PRO EDITION)
 * High-performance, inertial, responsive 3D media stage built with Vanilla Three.js.
 * Features: Subdivided rounded cards, physical momentum, true-color media output,
 * dynamic mouse parallax, interactive story progress capsules, and video autosync.
 */

// Helper: Procedural Rounded Rectangle Geometry with normalized UVs
function createRoundedRectGeometry(width, height, radius, segments = 16) {
    const shape = new THREE.Shape()
    const x = -width / 2
    const y = -height / 2
    const r = Math.min(radius, width / 2, height / 2)

    shape.moveTo(x + r, y)
    shape.lineTo(x + width - r, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + r)
    shape.lineTo(x + width, y + height - r)
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    shape.lineTo(x + r, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - r)
    shape.lineTo(x, y + r)
    shape.quadraticCurveTo(x, y, x + r, y)

    const geometry = new THREE.ShapeGeometry(shape, segments)
    const pos = geometry.attributes.position
    const uvs = new Float32Array(pos.count * 2)

    for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) + width / 2) / width
        uvs[i * 2 + 1] = (pos.getY(i) + height / 2) / height
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
    return geometry
}

// Helper: Generates subtle floor ambient ground shadow texture procedurally
function createSoftGroundTexture() {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext("2d")
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, "rgba(0,0,0,0.5)")
    gradient.addColorStop(0.5, "rgba(0,0,0,0.15)")
    gradient.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(canvas)
}

export default function Carousel3D(incomingProps) {
    // RULE 9 (Step 1): Intercept & Flatten Properties
    const props = {
        ...incomingProps,
        ...(incomingProps.layoutSettings || {}),
        ...(incomingProps.interactionSettings || {}),
        ...(incomingProps.autoplaySettings || {}),
        ...(incomingProps.stylingSettings || {}),
    }

    const containerRef = useRef(null)
    const canvasMountRef = useRef(null)

    // RULE 12: Smart Camera Static Renderer Check
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.livePreview ?? true)

    // Mutable state container bypassing React render cycle (RULE 6)
    const stateRef = useRef({
        targetRotation: 0,
        currentRotation: 0,
        isDragging: false,
        startX: 0,
        startRotation: 0,
        pointerVelocity: 0,
        lastPointerX: 0,
        lastPointerTime: 0,
        isHovered: false,
        mouseTargetX: 0,
        mouseTargetY: 0,
        mouseX: 0,
        mouseY: 0,
        activeIndex: 0,
        slideTimer: 0,
        videos: [],
        progressPills: [],
        cardGroups: [],
        cardMaterials: [],
    })

    const isIntersecting = useRef(true)

    useEffect(() => {
        if (!canvasMountRef.current || !containerRef.current) return

        const container = canvasMountRef.current
        const hostContainer = containerRef.current
        const state = stateRef.current

        // Clean working arrays
        state.videos = []
        state.progressPills = []
        state.cardGroups = []
        state.cardMaterials = []

        let frameId
        let lastFrameTimestamp = performance.now()

        // 1. Scene, Camera, Renderer initialization
        const scene = new THREE.Scene()
        if (props.backgroundColor) {
            scene.background = new THREE.Color(props.backgroundColor)
        }

        const width = Math.max(container.clientWidth, 100)
        const height = Math.max(container.clientHeight, 100)

        const camera = new THREE.PerspectiveCamera(
            40,
            width / height,
            0.1,
            2000
        )
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(width, height)
        // Ensure 100% faithful, undistorted original colors
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.NoToneMapping
        container.appendChild(renderer.domElement)

        // Force Single Frame Renderer for static preview mode
        const forceRender = () => {
            if (renderer) renderer.render(scene, camera)
        }

        // Lighting for deep realistic reflections & metallic backs
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        scene.add(ambientLight)

        const topSpot = new THREE.DirectionalLight(0xffffff, 0.8)
        topSpot.position.set(0, 300, 300)
        scene.add(topSpot)

        // 2. Carousel Rigging & Geometry
        const carouselRig = new THREE.Group()
        scene.add(carouselRig)

        const items =
            props.mediaItems && props.mediaItems.length > 0
                ? props.mediaItems
                : defaultItems
        const itemCount = items.length
        const anglePerItem = (Math.PI * 2) / itemCount

        const pWidth = props.panelWidth
        const pHeight = props.panelHeight
        const radius =
            itemCount > 2
                ? pWidth / 2 / Math.tan(Math.PI / itemCount)
                : pWidth * 0.95

        const fovRad = (camera.fov * Math.PI) / 180
        const baseDist = radius + pHeight / 2 / Math.tan(fovRad / 2)
        camera.position.set(0, 0, baseDist + props.cameraDistance)
        camera.lookAt(0, 0, 0)

        // Floor Shadow Mesh
        const groundTexture = createSoftGroundTexture()
        const groundGeo = new THREE.PlaneGeometry(radius * 2.8, radius * 2.8)
        const groundMat = new THREE.MeshBasicMaterial({
            map: groundTexture,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
        })
        const groundMesh = new THREE.Mesh(groundGeo, groundMat)
        groundMesh.rotation.x = -Math.PI / 2
        groundMesh.position.y = -pHeight / 2 - 12
        scene.add(groundMesh)

        // Card Geometry Instances
        const cardFrontGeometry = createRoundedRectGeometry(
            pWidth,
            pHeight,
            props.borderRadius,
            24
        )
        const cardBackGeometry = createRoundedRectGeometry(
            pWidth + 1,
            pHeight + 1,
            props.borderRadius,
            24
        )

        // UV aspect ratio cover helper
        const applyCoverUV = (texture, mediaW, mediaH) => {
            if (!mediaW || !mediaH) return
            const mediaAspect = mediaW / mediaH
            const targetAspect = pWidth / pHeight
            if (mediaAspect > targetAspect) {
                const repeatX = targetAspect / mediaAspect
                texture.repeat.set(repeatX, 1)
                texture.offset.set((1 - repeatX) / 2, 0)
            } else {
                const repeatY = mediaAspect / targetAspect
                texture.repeat.set(1, repeatY)
                texture.offset.set(0, (1 - repeatY) / 2)
            }
            texture.needsUpdate = true
        }

        // Build individual carousel cards
        items.forEach((item, index) => {
            const cardGroup = new THREE.Group()
            const angle = index * anglePerItem

            cardGroup.position.x = radius * Math.sin(angle)
            cardGroup.position.z = radius * Math.cos(angle)
            cardGroup.rotation.y = angle

            let texture = null
            const src = item.type === "video" ? item.videoSrc : item.imageSrc

            if (item.type === "video" && src) {
                const video = document.createElement("video")
                video.src = src
                video.crossOrigin = "anonymous"
                video.loop = true
                video.muted = true
                video.playsInline = true
                video.autoplay = true

                state.videos.push({ video, index })

                texture = new THREE.VideoTexture(video)
                texture.colorSpace = THREE.SRGBColorSpace
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter

                video.addEventListener("loadedmetadata", () => {
                    applyCoverUV(texture, video.videoWidth, video.videoHeight)
                    if (!shouldAnimate) forceRender()
                })
            } else if (src) {
                const loader = new THREE.TextureLoader()
                texture = loader.load(src, (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace
                    tex.generateMipmaps = true
                    tex.minFilter = THREE.LinearMipmapLinearFilter
                    if (tex.image) {
                        applyCoverUV(tex, tex.image.width, tex.image.height)
                    }
                    if (!shouldAnimate) forceRender()
                })
            }

            // Front Surface Material - toneMapped: false preserves true pixel colors
            const frontMaterial = new THREE.MeshBasicMaterial({
                map: texture || null,
                color: 0xffffff,
                side: THREE.FrontSide,
                toneMapped: false,
            })
            const frontMesh = new THREE.Mesh(cardFrontGeometry, frontMaterial)
            cardGroup.add(frontMesh)
            state.cardMaterials.push(frontMaterial)

            // Back Physical Plate (Realistic chassis backing)
            const backMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(props.cardBackingColor || "#121214"),
                roughness: 0.4,
                metalness: 0.3,
                side: THREE.BackSide,
            })
            const backMesh = new THREE.Mesh(cardBackGeometry, backMaterial)
            backMesh.position.z = -0.5
            cardGroup.add(backMesh)

            // Story Progress Pill Bar Indicator
            const barWidth = pWidth * 0.88
            const barHeight = 4
            const barRadius = 2
            const pillY = pHeight / 2 - 20

            const pillGroup = new THREE.Group()
            pillGroup.position.set(0, pillY, 1.2)

            // Background pill track
            const trackGeo = createRoundedRectGeometry(
                barWidth,
                barHeight,
                barRadius,
                8
            )
            const trackMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.28,
            })
            const trackMesh = new THREE.Mesh(trackGeo, trackMat)
            pillGroup.add(trackMesh)

            // Active animated foreground bar
            const activeGeo = createRoundedRectGeometry(
                barWidth,
                barHeight,
                barRadius,
                8
            )
            activeGeo.translate(barWidth / 2, 0, 0)
            const activeMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(props.accentColor || "#ffffff"),
                transparent: true,
                opacity: 0.95,
            })
            const activeMesh = new THREE.Mesh(activeGeo, activeMat)
            activeMesh.position.x = -barWidth / 2
            activeMesh.scale.x = 0.001
            pillGroup.add(activeMesh)

            cardGroup.add(pillGroup)
            state.progressPills.push({ mesh: activeMesh, itemIndex: index })

            carouselRig.add(cardGroup)
            state.cardGroups.push(cardGroup)
        })

        // 3. User Interaction & Event Handlers
        const onPointerDown = (e) => {
            state.isDragging = true
            state.startX = e.clientX
            state.startRotation = state.targetRotation
            state.lastPointerX = e.clientX
            state.lastPointerTime = performance.now()
            state.pointerVelocity = 0
            hostContainer.style.cursor = "grabbing"
            if (!shouldAnimate) forceRender()
        }

        const onPointerMove = (e) => {
            const now = performance.now()
            const dt = Math.max(1, now - state.lastPointerTime)
            const dx = e.clientX - state.lastPointerX

            // Calculate instantaneous flick velocity
            state.pointerVelocity = (dx / dt) * 16.6
            state.lastPointerX = e.clientX
            state.lastPointerTime = now

            if (state.isDragging) {
                const totalDeltaX = e.clientX - state.startX
                state.targetRotation =
                    state.startRotation +
                    totalDeltaX * props.dragSensitivity * 0.005
                if (!shouldAnimate) forceRender()
            }

            // Parallax Tracking
            if (props.enableTilt) {
                const rect = hostContainer.getBoundingClientRect()
                state.mouseTargetX =
                    ((e.clientX - rect.left) / rect.width) * 2 - 1
                state.mouseTargetY = -(
                    ((e.clientY - rect.top) / rect.height) * 2 -
                    1
                )
            }
        }

        const onPointerUp = () => {
            if (!state.isDragging) return
            state.isDragging = false
            hostContainer.style.cursor = "grab"

            // Apply momentum throw
            state.targetRotation +=
                state.pointerVelocity * props.dragSensitivity * 0.02

            if (props.snapToFace) {
                const snapIndex = Math.round(
                    state.targetRotation / anglePerItem
                )
                state.targetRotation = snapIndex * anglePerItem
            }
            if (!shouldAnimate) forceRender()
        }

        const onWheel = (e) => {
            if (!props.enableWheel) return
            state.targetRotation -= e.deltaY * 0.0012
            if (props.snapToFace) {
                const snapIndex = Math.round(
                    state.targetRotation / anglePerItem
                )
                state.targetRotation = snapIndex * anglePerItem
            }
            if (!shouldAnimate) forceRender()
        }

        const onMouseEnter = () => {
            state.isHovered = true
        }

        const onMouseLeave = () => {
            state.isHovered = false
            state.mouseTargetX = 0
            state.mouseTargetY = 0
            if (state.isDragging) onPointerUp()
        }

        hostContainer.style.cursor = "grab"
        hostContainer.style.touchAction = "none"

        hostContainer.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        window.addEventListener("pointercancel", onPointerUp)
        hostContainer.addEventListener("wheel", onWheel, { passive: true })
        hostContainer.addEventListener("mouseenter", onMouseEnter)
        hostContainer.addEventListener("mouseleave", onMouseLeave)

        // 4. Responsive Resizing & Viewport Observers
        const resizeObserver = new ResizeObserver(() => {
            if (!container) return
            const w = Math.max(container.clientWidth, 100)
            const h = Math.max(container.clientHeight, 100)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
            if (!shouldAnimate) forceRender()
        })
        resizeObserver.observe(container)

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isIntersecting.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(container)

        // 5. 60FPS Render & Physics Loop
        const renderLoop = (timestamp) => {
            if (shouldAnimate) {
                frameId = requestAnimationFrame(renderLoop)
            }

            if (!isIntersecting.current && shouldAnimate) return

            const deltaSeconds = Math.min(
                (timestamp - lastFrameTimestamp) / 1000,
                0.1
            )
            lastFrameTimestamp = timestamp

            // Physics Damping & Friction
            if (shouldAnimate) {
                if (
                    !state.isDragging &&
                    Math.abs(state.pointerVelocity) > 0.01
                ) {
                    state.pointerVelocity *= props.momentum
                    state.targetRotation +=
                        state.pointerVelocity * 0.001 * props.dragSensitivity
                    if (
                        Math.abs(state.pointerVelocity) <= 0.01 &&
                        props.snapToFace
                    ) {
                        state.targetRotation =
                            Math.round(state.targetRotation / anglePerItem) *
                            anglePerItem
                    }
                }

                // Smooth Rotation Lerp
                state.currentRotation +=
                    (state.targetRotation - state.currentRotation) *
                    props.lerpSpeed

                // Parallax Camera Sway
                if (props.enableTilt) {
                    state.mouseX += (state.mouseTargetX - state.mouseX) * 0.06
                    state.mouseY += (state.mouseTargetY - state.mouseY) * 0.06
                    camera.position.x = state.mouseX * 35
                    camera.position.y = state.mouseY * 25
                    camera.lookAt(0, 0, 0)
                }
            } else {
                // RULE 12: Bypass lerp math during paused/static state for immediate snap
                state.currentRotation = state.targetRotation
            }

            carouselRig.rotation.y = state.currentRotation

            // Active Index Calculation
            let normalizedRot = state.currentRotation % (Math.PI * 2)
            if (normalizedRot < 0) normalizedRot += Math.PI * 2
            let activeIdx =
                Math.round((Math.PI * 2 - normalizedRot) / anglePerItem) %
                itemCount
            if (activeIdx < 0) activeIdx += itemCount
            state.activeIndex = activeIdx

            // Autoplay and story progress advancement
            const activeItem = items[state.activeIndex]
            const isVideoActive = activeItem && activeItem.type === "video"
            const duration = Math.max(props.slideDuration || 5, 1)

            if (
                shouldAnimate &&
                props.autoRotate &&
                (!props.pauseOnHover || !state.isHovered) &&
                !state.isDragging
            ) {
                if (!isVideoActive) {
                    state.slideTimer += deltaSeconds
                    if (state.slideTimer >= duration) {
                        state.slideTimer = 0
                        state.targetRotation -= anglePerItem
                    }
                }
            }

            // Update Cards: Unaltered original colors & Dynamic Scaling
            state.cardGroups.forEach((card, idx) => {
                const cardAngle = idx * anglePerItem
                const cardWorldAngle =
                    ((((cardAngle + state.currentRotation) % (Math.PI * 2)) +
                        Math.PI * 3) %
                        (Math.PI * 2)) -
                    Math.PI
                const distFromFront = Math.abs(cardWorldAngle)
                const focusFactor = Math.max(0, 1 - distFromFront / Math.PI)

                // Depth dimming (only if enabled by user, default is 0 for pure original colors)
                const mat = state.cardMaterials[idx]
                if (mat) {
                    if (props.depthDimming > 0) {
                        const dimMin = 1 - props.depthDimming / 100
                        const brightness = THREE.MathUtils.lerp(
                            dimMin,
                            1,
                            Math.pow(focusFactor, 1.8)
                        )
                        mat.color.setRGB(brightness, brightness, brightness)
                    } else {
                        mat.color.setRGB(1, 1, 1)
                    }
                }

                const scaleMin = props.inactiveScale / 100
                const scale = THREE.MathUtils.lerp(
                    scaleMin,
                    1,
                    Math.pow(focusFactor, 1.4)
                )
                card.scale.set(scale, scale, scale)

                // Synchronize progress bar capsules
                const pill = state.progressPills[idx]
                if (pill) {
                    if (idx === state.activeIndex) {
                        pill.mesh.visible = true
                        if (isVideoActive) {
                            const vRecord = state.videos.find(
                                (v) => v.index === idx
                            )
                            if (vRecord && vRecord.video.duration > 0) {
                                const prog =
                                    vRecord.video.currentTime /
                                    vRecord.video.duration
                                pill.mesh.scale.x = Math.min(
                                    Math.max(prog, 0.001),
                                    1
                                )
                            }
                        } else {
                            const prog = Math.min(
                                Math.max(state.slideTimer / duration, 0.001),
                                1
                            )
                            pill.mesh.scale.x = prog
                        }
                    } else {
                        pill.mesh.scale.x = 0.001
                        pill.mesh.visible = focusFactor > 0.5
                    }
                }
            })

            // Video Playback Control
            state.videos.forEach(({ video, index }) => {
                if (
                    index === state.activeIndex &&
                    !state.isDragging &&
                    isIntersecting.current
                ) {
                    if (video.paused) video.play().catch(() => null)
                    // Auto-advance carousel when active video reaches its end
                    if (
                        props.autoRotate &&
                        video.duration > 0 &&
                        video.currentTime >= video.duration - 0.15
                    ) {
                        video.currentTime = 0
                        state.targetRotation -= anglePerItem
                    }
                } else {
                    if (!video.paused) video.pause()
                }
            })

            renderer.render(scene, camera)
        }

        renderLoop(performance.now())

        // 6. Strict Cleanup Routine (RULE 2)
        return () => {
            if (frameId) cancelAnimationFrame(frameId)

            hostContainer.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("pointercancel", onPointerUp)
            hostContainer.removeEventListener("wheel", onWheel)
            hostContainer.removeEventListener("mouseenter", onMouseEnter)
            hostContainer.removeEventListener("mouseleave", onMouseLeave)

            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            state.videos.forEach(({ video }) => {
                video.pause()
                video.removeAttribute("src")
                video.load()
            })

            // Deep dispose of scene resources
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose()
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => {
                            if (m.map) m.map.dispose()
                            m.dispose()
                        })
                    } else {
                        if (obj.material.map) obj.material.map.dispose()
                        obj.material.dispose()
                    }
                }
            })

            groundTexture.dispose()
            scene.clear()

            // Critical WebGL context cleanup
            renderer.forceContextLoss()
            renderer.dispose()

            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        props.mediaItems,
        props.panelWidth,
        props.panelHeight,
        props.borderRadius,
        props.cameraDistance,
        props.backgroundColor,
        props.cardBackingColor,
        props.accentColor,
        props.dragSensitivity,
        props.momentum,
        props.lerpSpeed,
        props.snapToFace,
        props.autoRotate,
        props.slideDuration,
        props.pauseOnHover,
        props.enableWheel,
        props.enableTilt,
        props.depthDimming,
        props.inactiveScale,
        shouldAnimate,
    ])

    return (
        <div
            {...props}
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                userSelect: "none",
                ...props.style,
            }}
        >
            <div
                ref={canvasMountRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

// Sample High-Resolution Showcase Presets
const defaultItems = [
    {
        type: "image",
        imageSrc:
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
        videoSrc: "",
    },
    {
        type: "image",
        imageSrc:
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop",
        videoSrc: "",
    },
    {
        type: "image",
        imageSrc:
            "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1000&auto=format&fit=crop",
        videoSrc: "",
    },
    {
        type: "image",
        imageSrc:
            "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop",
        videoSrc: "",
    },
    {
        type: "image",
        imageSrc:
            "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=1000&auto=format&fit=crop",
        videoSrc: "",
    },
]

// RULE 9 (Step 2): Nested Defaults mirroring UI Structure
Carousel3D.defaultProps = {
    livePreview: true,
    mediaItems: defaultItems,
    layoutSettings: {
        panelWidth: 290,
        panelHeight: 480,
        borderRadius: 28,
        cameraDistance: 140,
        depthDimming: 0,
        inactiveScale: 85,
    },
    interactionSettings: {
        dragSensitivity: 1.6,
        momentum: 0.92,
        lerpSpeed: 0.08,
        snapToFace: true,
        enableWheel: true,
        enableTilt: true,
    },
    autoplaySettings: {
        autoRotate: false,
        slideDuration: 5,
        pauseOnHover: true,
    },
    stylingSettings: {
        backgroundColor: "",
        accentColor: "#ffffff",
        cardBackingColor: "#141416",
    },
}

// RULE 9 (Step 3), 13 (Units), and 14 (Concise Descriptions)
addPropertyControls(Carousel3D, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Preview 3D physics inside canvas.",
    },
    mediaItems: {
        type: ControlType.Array,
        title: "Media Carousel",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                },
                imageSrc: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden(item) {
                        return item.type !== "image"
                    },
                },
                videoSrc: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm"],
                    hidden(item) {
                        return item.type !== "video"
                    },
                },
            },
        },
        defaultValue: defaultItems,
    },
    layoutSettings: {
        type: ControlType.Object,
        title: "Dimensions & Scale",
        controls: {
            panelWidth: {
                type: ControlType.Number,
                title: "Width (px)",
                min: 120,
                max: 800,
                step: 10,
                unit: "px",
                defaultValue: 290,
                description: "Width of each 3D card.",
            },
            panelHeight: {
                type: ControlType.Number,
                title: "Height (px)",
                min: 150,
                max: 1000,
                step: 10,
                unit: "px",
                defaultValue: 480,
                description: "Height of each 3D card.",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius (px)",
                min: 0,
                max: 60,
                unit: "px",
                defaultValue: 28,
                description: "Corner roundness of cards.",
            },
            cameraDistance: {
                type: ControlType.Number,
                title: "Camera Offset (px)",
                min: -100,
                max: 600,
                step: 10,
                unit: "px",
                defaultValue: 140,
                description: "Distance from foreground card.",
            },
            depthDimming: {
                type: ControlType.Number,
                title: "Depth Dimming (%)",
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: 0,
                description: "Darkening applied to back cards.",
            },
            inactiveScale: {
                type: ControlType.Number,
                title: "Back Scale (%)",
                min: 50,
                max: 100,
                unit: "%",
                defaultValue: 85,
                description: "Scale of unfocused cards.",
            },
        },
    },
    interactionSettings: {
        type: ControlType.Object,
        title: "Physics & Motion",
        controls: {
            dragSensitivity: {
                type: ControlType.Number,
                title: "Drag Sensitivity",
                min: 0.2,
                max: 4,
                step: 0.1,
                defaultValue: 1.6,
                description: "Response speed when dragging.",
            },
            momentum: {
                type: ControlType.Number,
                title: "Momentum",
                min: 0.5,
                max: 0.98,
                step: 0.01,
                defaultValue: 0.92,
                description: "Throw inertia friction falloff.",
            },
            lerpSpeed: {
                type: ControlType.Number,
                title: "Lerp Smoothing",
                min: 0.02,
                max: 0.3,
                step: 0.01,
                defaultValue: 0.08,
                description: "Interpolation easing speed.",
            },
            snapToFace: {
                type: ControlType.Boolean,
                title: "Snap To Card",
                defaultValue: true,
                description: "Center nearest card on release.",
            },
            enableWheel: {
                type: ControlType.Boolean,
                title: "Wheel Scroll",
                defaultValue: true,
                description: "Rotate with trackpad / mousewheel.",
            },
            enableTilt: {
                type: ControlType.Boolean,
                title: "Mouse Parallax",
                defaultValue: true,
                description: "Tilt stage toward mouse pointer.",
            },
        },
    },
    autoplaySettings: {
        type: ControlType.Object,
        title: "Autoplay & Stories",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
                description: "Advance cards automatically.",
            },
            slideDuration: {
                type: ControlType.Number,
                title: "Duration (s)",
                min: 1,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: 5,
                description: "Seconds per static slide.",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on Hover",
                defaultValue: true,
                description: "Halt autoplay when mouse is over.",
            },
        },
    },
    stylingSettings: {
        type: ControlType.Object,
        title: "Colors & Appearance",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "",
                description: "Empty value keeps transparent canvas.",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Progress Color",
                defaultValue: "#ffffff",
                description: "Color of top story progress capsule.",
            },
            cardBackingColor: {
                type: ControlType.Color,
                title: "Card Chassis",
                defaultValue: "#141416",
                description: "Material tone on reverse card plate.",
            },
        },
    },
})
