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


export default function SpiralImageGallery(incomingProps) {
    const isStatic = useIsStaticRenderer()

    // STEP 1: Intercept & Flatten props to maintain clean internal code without deep nesting
    const props = {
        ...incomingProps,
        ...(incomingProps.gallery || {}),
        ...(incomingProps.animation || {}),
        ...(incomingProps.interaction || {}),
        ...(incomingProps.center || {}),
        ...(incomingProps.cursor || {}),
    }

    const wrapperRef = useRef(null)
    const backRef = useRef(null)
    const frontRef = useRef(null)
    const cursorRef = useRef(null)
    const tooltipRef = useRef(null)
    const titleRef = useRef(null)
    const subtitleRef = useRef(null)
    const isIntersecting = useRef(false)

    useEffect(() => {
        if (!wrapperRef.current || !backRef.current || !frontRef.current) return

        // Check our rendering context to decide if we should run an endless loop or a static snapshot
        const inEditor = RenderTarget.current() === RenderTarget.canvas
        const shouldAnimate = !isStatic && (!inEditor || props.editorPreview)

        // 1. Core Scene Setup
        const width = wrapperRef.current.clientWidth
        const height = wrapperRef.current.clientHeight

        const scene = new THREE.Scene()
        scene.background = null

        const camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            1000
        )
        camera.position.z = props.cameraDistance

        // 2. Dual WebGL Renderers for automatic HTML Sandwiched Sorting
        const rendererBack = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })
        const rendererFront = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })

        const setupRenderer = (renderer, mountTarget) => {
            renderer.setSize(width, height)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

            if (THREE.SRGBColorSpace) {
                renderer.outputColorSpace = THREE.SRGBColorSpace
            } else if (THREE.sRGBEncoding) {
                renderer.outputEncoding = THREE.sRGBEncoding
            }

            mountTarget.appendChild(renderer.domElement)
        }

        setupRenderer(rendererBack, backRef.current)
        setupRenderer(rendererFront, frontRef.current)

        // Setup Global Clipping Planes to cleanly slice the scene at the center (Z=0)
        rendererBack.clippingPlanes = [
            new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.1),
        ]
        rendererFront.clippingPlanes = [
            new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.1),
        ]

        const activeItems =
            props.items && props.items.length > 0 ? props.items : []

        // 3. Media Loading (Images & Videos) with associated text data
        const textureLoader = new THREE.TextureLoader()
        const loadedMedia = activeItems
            .map((item) => {
                if (!item.media) return null

                const url = item.media
                const isVideo =
                    url.match(/\.(mp4|webm|ogg|mkv)$/i) ||
                    (url.startsWith("blob:") && url.includes("video"))

                if (isVideo) {
                    const video = document.createElement("video")
                    video.src = url
                    video.crossOrigin = "anonymous"
                    video.loop = true
                    video.muted = true
                    video.playsInline = true
                    video.play().catch(() => {})

                    const texture = new THREE.VideoTexture(video)
                    texture.minFilter = THREE.LinearFilter
                    texture.magFilter = THREE.LinearFilter

                    if (THREE.SRGBColorSpace)
                        texture.colorSpace = THREE.SRGBColorSpace
                    else if (THREE.sRGBEncoding)
                        texture.encoding = THREE.sRGBEncoding

                    return {
                        texture,
                        isVideo: true,
                        video,
                        title: item.title,
                        subtitle: item.subtitle,
                    }
                } else {
                    // Update static snapshot when images finish downloading asynchronously
                    const texture = textureLoader.load(url, () => {
                        if (!shouldAnimate) {
                            rendererBack.render(scene, camera)
                            rendererFront.render(scene, camera)
                        }
                    })
                    if (THREE.SRGBColorSpace)
                        texture.colorSpace = THREE.SRGBColorSpace
                    else if (THREE.sRGBEncoding)
                        texture.encoding = THREE.sRGBEncoding

                    return {
                        texture,
                        isVideo: false,
                        title: item.title,
                        subtitle: item.subtitle,
                    }
                }
            })
            .filter(Boolean)

        const cards = []
        const galleryGroup = new THREE.Group()
        scene.add(galleryGroup)

        const totalHeight = props.ringsCount * props.verticalSpacing
        const offsetRad = props.spiralOffset * (Math.PI / 180)

        // 4. Geometry & Layout Mathematics (Wrapped to ensure safe execution when empty, while preventing early exit)
        if (loadedMedia.length > 0) {
            const geometry = new THREE.PlaneGeometry(
                props.cardWidth,
                props.cardHeight,
                16,
                16
            )

            for (let r = 0; r < props.ringsCount; r++) {
                for (let c = 0; c < props.cardsPerRing; c++) {
                    const index = r * props.cardsPerRing + c
                    // Use modulo to safely loop through the available loaded media
                    const dataIndex = index % loadedMedia.length
                    const mediaItem = loadedMedia[dataIndex]

                    const material = new THREE.MeshBasicMaterial({
                        map: mediaItem.texture,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 1,
                        depthWrite: false,
                    })

                    // Custom Shader Integration for Bend Effect & Border Radius
                    material.userData = {
                        uBend: { value: 0 },
                        uRadius: { value: props.borderRadius / 100 },
                        uAspect: { value: props.cardWidth / props.cardHeight },
                    }

                    material.onBeforeCompile = (shader) => {
                        shader.uniforms.uBend = material.userData.uBend
                        shader.uniforms.uRadius = material.userData.uRadius
                        shader.uniforms.uAspect = material.userData.uAspect

                        shader.vertexShader = `
                            uniform float uBend;
                            ${shader.vertexShader}
                        `.replace(
                            `#include <begin_vertex>`,
                            `
                            #include <begin_vertex>
                            float vDist = length(uv - 0.5) * 2.0;
                            float bendFactor = pow(vDist, 2.5);
                            transformed.z += bendFactor * abs(uBend); 
                            `
                        )

                        shader.fragmentShader = `
                            uniform float uRadius;
                            uniform float uAspect;
                            ${shader.fragmentShader}
                        `.replace(
                            `#include <dithering_fragment>`,
                            `
                            #include <dithering_fragment>
                            #ifdef USE_UV
                                if (uRadius > 0.0) {
                                    float maxR = min(0.5 * uAspect, 0.5);
                                    float r = min(uRadius, maxR);
                                    vec2 pos = abs(vUv - 0.5) * vec2(uAspect, 1.0);
                                    vec2 extents = vec2(0.5 * uAspect, 0.5) - r;
                                    vec2 d = pos - extents;
                                    float distCorner = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
                                    gl_FragColor.a *= 1.0 - smoothstep(r - 0.01, r + 0.01, distCorner);
                                }
                            #endif
                            `
                        )
                    }

                    const mesh = new THREE.Mesh(geometry, material)

                    let theta = 0
                    let y = 0

                    if (props.layoutType === "spiral") {
                        theta = (index / props.cardsPerRing) * Math.PI * 2
                        y =
                            (index / props.cardsPerRing) *
                                props.verticalSpacing -
                            totalHeight / 2
                    } else {
                        theta =
                            (c / props.cardsPerRing) * Math.PI * 2 +
                            r * offsetRad
                        y = r * props.verticalSpacing - totalHeight / 2
                    }

                    mesh.position.set(
                        Math.cos(theta) * props.radius,
                        y,
                        Math.sin(theta) * props.radius
                    )

                    mesh.userData = { theta, dataIndex }
                    mesh.lookAt(0, mesh.position.y, 0)

                    galleryGroup.add(mesh)
                    cards.push(mesh)
                }
            }
        }

        // 5. Interaction State & Raycasting
        let targetX = 0
        let targetY = 0
        let isDragging = false
        let previousX = 0
        let dragVelocityX = 0
        let wheelVelocity = 0
        let scrollBendState = 0
        let scrollUpVelocity = 0

        let mousePx = { x: -100, y: -100 }
        let cursorPx = { x: -100, y: -100 }
        const mouseNorm = new THREE.Vector2(0, 0)
        const raycaster = new THREE.Raycaster()
        let hoveredIndex = -1
        let currentAutoSpeed = props.rotationSpeed / 100

        const onPointerDown = (e) => {
            if (!props.dragRotate) return
            isDragging = true
            previousX = e.clientX
        }

        const onPointerMove = (e) => {
            const rect = wrapperRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            mousePx.x = x
            mousePx.y = y
            mouseNorm.x = (x / rect.width) * 2 - 1
            mouseNorm.y = -(y / rect.height) * 2 + 1

            targetX = mouseNorm.x
            targetY = mouseNorm.y

            if (isDragging && props.dragRotate) {
                const deltaX = e.clientX - previousX
                dragVelocityX += deltaX * 0.0005
                previousX = e.clientX
            }
        }

        const onPointerUp = () => {
            isDragging = false
        }

        const onWheel = (e) => {
            if (props.scrollRotate) {
                wheelVelocity += e.deltaY * 0.0001
            }
            scrollBendState += Math.abs(e.deltaY) * 0.005
            scrollUpVelocity += e.deltaY * 0.0005
        }

        wrapperRef.current.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        window.addEventListener("wheel", onWheel, { passive: true })

        // 6. Viewport Gating (Intersection Observer)
        const io = new IntersectionObserver((entries) => {
            isIntersecting.current = entries[0].isIntersecting
        })
        io.observe(wrapperRef.current)

        // 7. Responsive Sizing (Resize Observer)
        const resizeObserver = new ResizeObserver(() => {
            if (!wrapperRef.current) return
            const newWidth = wrapperRef.current.clientWidth
            const newHeight = wrapperRef.current.clientHeight
            rendererBack.setSize(newWidth, newHeight)
            rendererFront.setSize(newWidth, newHeight)
            camera.aspect = newWidth / newHeight
            camera.updateProjectionMatrix()

            // Force a frame render on resize if we are in static/paused mode
            if (!shouldAnimate) {
                rendererBack.render(scene, camera)
                rendererFront.render(scene, camera)
            }
        })
        resizeObserver.observe(wrapperRef.current)

        // 8. Animation Loop / Single Render
        let frameId

        const render = () => {
            // Only loop if we are allowed to animate
            if (shouldAnimate) {
                frameId = requestAnimationFrame(render)
                // In live mode, skip heavy calcs and renders if not visible
                if (!isIntersecting.current) return
            }

            // Raycasting for Hover UI
            raycaster.setFromCamera(mouseNorm, camera)
            const intersects = raycaster.intersectObjects(cards)

            if (intersects.length > 0 && !isDragging) {
                const obj = intersects[0].object
                hoveredIndex = obj.userData.dataIndex
                const hoveredData = loadedMedia[hoveredIndex]

                if (tooltipRef.current) {
                    tooltipRef.current.style.opacity = 1
                    // Track exact mouse position (no latency)
                    tooltipRef.current.style.transform = `translate3d(${mousePx.x}px, ${mousePx.y}px, 0)`
                }

                if (titleRef.current && hoveredData) {
                    titleRef.current.innerText = hoveredData.title || ""
                }
                if (subtitleRef.current && hoveredData) {
                    subtitleRef.current.innerText = hoveredData.subtitle || ""
                }
            } else {
                hoveredIndex = -1
                if (tooltipRef.current) {
                    tooltipRef.current.style.opacity = 0
                }
            }

            // Smoothly slow down rotation on hover
            const targetRotSpeed =
                hoveredIndex !== -1
                    ? (props.rotationSpeed / 100) * 0.05
                    : props.rotationSpeed / 100
            currentAutoSpeed += (targetRotSpeed - currentAutoSpeed) * 0.1

            // Cursor Parallax Update
            cursorPx.x += (mousePx.x - cursorPx.x) * 0.15
            cursorPx.y += (mousePx.y - cursorPx.y) * 0.15
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(calc(${cursorPx.x}px - 50%), calc(${cursorPx.y}px - 50%), 0)`
            }

            // Decay Interaction Velocities & States with user-defined Damping
            dragVelocityX *= props.damping
            wheelVelocity *= props.damping
            scrollUpVelocity *= props.damping
            scrollBendState *= props.damping
            scrollBendState = Math.min(scrollBendState, 5.0)

            const currentBend =
                scrollBendState * props.scrollBendIntensity * 0.2

            // Apply Group Rotation
            let rotationDelta = -currentAutoSpeed
            if (props.dragRotate) rotationDelta += dragVelocityX
            if (props.scrollRotate) rotationDelta += wheelVelocity
            galleryGroup.rotation.y += rotationDelta

            // Mouse Parallax
            camera.position.x +=
                (targetX * props.mouseInfluence - camera.position.x) * 0.05
            camera.position.y +=
                (targetY * props.mouseInfluence - camera.position.y) * 0.05
            camera.lookAt(0, 0, 0)

            const activeUpwardSpeed =
                props.upwardSpeed + scrollUpVelocity * props.scrollLiftIntensity

            // Cards Animation
            cards.forEach((card) => {
                if (card.material.userData.uBend) {
                    const yDist = Math.abs(card.position.y) / (totalHeight / 2)
                    const bulgeFactor = Math.max(0, 1 - yDist)
                    card.material.userData.uBend.value =
                        currentBend * bulgeFactor
                    card.material.userData.uRadius.value =
                        props.borderRadius / 100
                    card.material.userData.uAspect.value =
                        props.cardWidth / props.cardHeight
                }

                card.position.y += activeUpwardSpeed

                if (card.position.y > totalHeight / 2) {
                    card.position.y -= totalHeight
                } else if (card.position.y < -totalHeight / 2) {
                    card.position.y += totalHeight
                }

                card.position.x = Math.cos(card.userData.theta) * props.radius
                card.position.z = Math.sin(card.userData.theta) * props.radius
                card.lookAt(0, card.position.y, 0)

                const fadeStart = totalHeight * 0.25
                const dist = Math.abs(card.position.y)

                if (dist > fadeStart) {
                    const fadeDist = dist - fadeStart
                    const maxFade = totalHeight / 2 - fadeStart
                    card.material.opacity = Math.max(0, 1 - fadeDist / maxFade)
                } else {
                    card.material.opacity = 1
                }
            })

            rendererBack.render(scene, camera)
            rendererFront.render(scene, camera)
        }

        // Trigger initial single render or start the animation loop
        render()

        // 9. STRICT WEBGL CLEANUP (Now guaranteed to run because we avoided early returns)
        return () => {
            if (frameId) cancelAnimationFrame(frameId)

            if (wrapperRef.current) {
                wrapperRef.current.removeEventListener(
                    "pointerdown",
                    onPointerDown
                )
            }
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("wheel", onWheel)

            io.disconnect()
            resizeObserver.disconnect()

            scene.traverse((object) => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose()
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach((m) => m.dispose())
                        } else {
                            object.material.dispose()
                        }
                    }
                }
            })

            loadedMedia.forEach((m) => {
                if (m.texture) m.texture.dispose()
                if (m.video) {
                    m.video.pause()
                    m.video.removeAttribute("src")
                    m.video.load()
                }
            })

            rendererBack.forceContextLoss()
            rendererBack.dispose()

            rendererFront.forceContextLoss()
            rendererFront.dispose()

            scene.clear()

            if (
                backRef.current &&
                backRef.current.contains(rendererBack.domElement)
            ) {
                backRef.current.removeChild(rendererBack.domElement)
            }
            if (
                frontRef.current &&
                frontRef.current.contains(rendererFront.domElement)
            ) {
                frontRef.current.removeChild(rendererFront.domElement)
            }
        }
    }, [
        props.items,
        props.layoutType,
        props.radius,
        props.ringsCount,
        props.cardsPerRing,
        props.cardWidth,
        props.cardHeight,
        props.verticalSpacing,
        props.spiralOffset,
        props.rotationSpeed,
        props.upwardSpeed,
        props.mouseInfluence,
        props.cameraDistance,
        props.editorPreview,
        props.dragRotate,
        props.scrollRotate,
        props.scrollBendIntensity,
        props.scrollLiftIntensity,
        props.borderRadius,
        props.damping,
        isStatic,
    ])

    return (
        <div
            {...incomingProps}
            ref={wrapperRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                cursor: props.showCustomCursor ? "none" : "auto", // Keeps native cursor by default for accessibility
                ...incomingProps.style,
            }}
        >
            {/* Back 3D Canvas Layer */}
            <div
                ref={backRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            />

            {/* Connected Center Content Layer */}
            {props.centerContent && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) scale(${props.centerScale})`,
                        zIndex: 2,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        pointerEvents: "auto",
                    }}
                >
                    {props.centerContent}
                </div>
            )}

            {/* Front 3D Canvas Layer */}
            <div
                ref={frontRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 3,
                    pointerEvents: "none",
                }}
            />

            {/* Hover Tooltip Layer (Tracks exact mouse coordinates) */}
            <div
                ref={tooltipRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    opacity: 0,
                    pointerEvents: "none",
                    transition: "opacity 0.2s ease-in-out", // NOTE: Only transition opacity, transform updates instantly on move
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {/* Outline Circle centered on cursor */}
                <div
                    style={{
                        position: "absolute",
                        left: "-25px",
                        top: "-25px",
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.4)",
                    }}
                />

                {/* Glassmorphism Text Pill pushed to the right */}
                <div
                    style={{
                        marginLeft: "40px",
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "40px",
                        padding: "10px 24px 10px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M1 13L13 1M13 1H4M13 1V10"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            fontFamily: "system-ui, sans-serif",
                        }}
                    >
                        <span
                            ref={titleRef}
                            style={{
                                color: "white",
                                fontSize: "16px",
                                fontWeight: 600,
                                lineHeight: 1.2,
                            }}
                        >
                            Title
                        </span>
                        <span
                            ref={subtitleRef}
                            style={{
                                color: "rgba(255,255,255,0.75)",
                                fontSize: "13px",
                                lineHeight: 1.2,
                            }}
                        >
                            Subtitle
                        </span>
                    </div>
                </div>
            </div>

            {/* Parallax Custom Cursor Dot */}
            {props.showCustomCursor && (
                <div
                    ref={cursorRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: props.cursorSize,
                        height: props.cursorSize,
                        backgroundColor: props.cursorColor,
                        borderRadius: "50%",
                        pointerEvents: "none",
                        zIndex: 9999,
                    }}
                />
            )}
        </div>
    )
}

// STEP 2: Nested Defaults
SpiralImageGallery.defaultProps = {
    editorPreview: true,
    items: [
        {
            media: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
            title: "Agenzia Progetta",
            subtitle: "Web Design",
        },
        {
            media: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=800&auto=format&fit=crop",
            title: "Neon Dynamics",
            subtitle: "Branding",
        },
        {
            media: "https://images.unsplash.com/photo-1555448248-2571daf6344b?q=80&w=800&auto=format&fit=crop",
            title: "Studio Alpha",
            subtitle: "UI/UX",
        },
        {
            media: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=800&auto=format&fit=crop",
            title: "Future Vision",
            subtitle: "Development",
        },
        {
            media: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
            title: "Modern Space",
            subtitle: "Architecture",
        },
        {
            media: "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=800&auto=format&fit=crop",
            title: "Minimal Core",
            subtitle: "Design",
        },
    ],
    gallery: {
        layoutType: "rings",
        radius: 12,
        ringsCount: 4,
        cardsPerRing: 8,
        cardWidth: 2.5,
        cardHeight: 3.5,
        verticalSpacing: 4.5,
        spiralOffset: 15,
        cameraDistance: 22,
        borderRadius: 5,
    },
    animation: {
        rotationSpeed: 0.5,
        upwardSpeed: 0.02,
        mouseInfluence: 3,
    },
    interaction: {
        dragRotate: true,
        scrollRotate: true,
        damping: 0.92,
        scrollBendIntensity: 1.5,
        scrollLiftIntensity: 1,
    },
    cursor: {
        showCustomCursor: false, // Ensures native accessibility initially
        cursorColor: "#ffffff",
        cursorSize: 8,
    },
    center: {
        centerScale: 1,
    },
}

// STEP 3: UI Categorization
addPropertyControls(SpiralImageGallery, {
    editorPreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        description: "Toggle editor playback",
    },
    items: {
        type: ControlType.Array,
        title: "Gallery Items",
        description: "Add media and text",
        control: {
            type: ControlType.Object,
            controls: {
                media: {
                    type: ControlType.File,
                    title: "Media",
                    allowedFileTypes: [
                        "image/png",
                        "image/jpeg",
                        "image/webp",
                        "image/gif",
                        "video/mp4",
                        "video/webm",
                    ],
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Subtitle",
                },
            },
        },
    },
    cursor: {
        type: ControlType.Object,
        title: "Custom Cursor",
        controls: {
            showCustomCursor: {
                type: ControlType.Boolean,
                title: "Enable Custom",
                description: "Replaces default cursor",
            },
            cursorColor: {
                type: ControlType.Color,
                title: "Dot Color",
                description: "Color of trailing dot",
            },
            cursorSize: {
                type: ControlType.Number,
                title: "Dot Size",
                unit: "px",
                min: 2,
                max: 50,
                step: 1,
                description: "Width/Height",
            },
        },
    },
    centerContent: {
        type: ControlType.ComponentInstance,
        title: "Center Content",
        description: "Connect a frame",
    },
    center: {
        type: ControlType.Object,
        title: "Center Element",
        controls: {
            centerScale: {
                type: ControlType.Number,
                title: "Scale",
                unit: "x",
                min: 0.1,
                max: 10,
                step: 0.1,
                description: "Resize content",
            },
        },
    },
    gallery: {
        type: ControlType.Object,
        title: "Gallery Layout",
        controls: {
            layoutType: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["rings", "spiral"],
                optionTitles: ["Rings", "Spiral"],
                description: "Choose shape",
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Media Width",
                unit: "px",
                min: 0.5,
                max: 10,
                step: 0.1,
                description: "Card width",
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Media Height",
                unit: "px",
                min: 0.5,
                max: 10,
                step: 0.1,
                description: "Card height",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                unit: "%",
                min: 0,
                max: 50,
                step: 1,
                description: "Round corners",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                unit: "px",
                min: 5,
                max: 30,
                step: 0.5,
                description: "Cylinder width",
            },
            ringsCount: {
                type: ControlType.Number,
                title: "Total Rings",
                unit: "x",
                min: 1,
                max: 10,
                step: 1,
                description: "Number of rows",
            },
            cardsPerRing: {
                type: ControlType.Number,
                title: "Cards per Ring",
                unit: "x",
                min: 3,
                max: 24,
                step: 1,
                description: "Items in circle",
            },
            verticalSpacing: {
                type: ControlType.Number,
                title: "Row Spacing",
                unit: "px",
                min: 1,
                max: 10,
                step: 0.5,
                description: "Gap between rings",
            },
            spiralOffset: {
                type: ControlType.Number,
                title: "Spiral Offset",
                unit: "deg",
                min: 0,
                max: 90,
                step: 1,
                description: "Twist angle (for Rings)",
            },
            cameraDistance: {
                type: ControlType.Number,
                title: "Camera Zoom",
                unit: "px",
                min: 5,
                max: 50,
                step: 1,
                description: "Depth level",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interactions",
        controls: {
            dragRotate: {
                type: ControlType.Boolean,
                title: "Drag Rotate",
                description: "Spin on hold",
            },
            scrollRotate: {
                type: ControlType.Boolean,
                title: "Scroll Rotate",
                description: "Spin on scroll",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                unit: "x",
                min: 0.8,
                max: 0.99,
                step: 0.01,
                description: "Friction of spin",
            },
            scrollLiftIntensity: {
                type: ControlType.Number,
                title: "Scroll Lift",
                unit: "x",
                min: -5,
                max: 5,
                step: 0.1,
                description: "Move up on scroll",
            },
            scrollBendIntensity: {
                type: ControlType.Number,
                title: "Scroll Bend",
                unit: "x",
                min: 0,
                max: 5,
                step: 0.1,
                description: "Stronger air push effect",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            rotationSpeed: {
                type: ControlType.Number,
                title: "Rotation",
                unit: "%",
                min: -5,
                max: 5,
                step: 0.1,
                description: "Auto spin speed",
            },
            upwardSpeed: {
                type: ControlType.Number,
                title: "Move Up",
                unit: "%",
                min: -0.1,
                max: 0.1,
                step: 0.01,
                description: "Vertical lift",
            },
            mouseInfluence: {
                type: ControlType.Number,
                title: "Mouse Parallax",
                unit: "px",
                min: 0,
                max: 10,
                step: 0.5,
                description: "Depth reaction",
            },
        },
    },
})
