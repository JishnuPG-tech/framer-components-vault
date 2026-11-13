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


// --- Helper Functions ---
const parseColor = (colorStr) => {
    let c = new THREE.Color()
    let a = 1.0
    if (!colorStr) return { color: c, alpha: a }

    if (colorStr.startsWith("rgba") || colorStr.startsWith("hsla")) {
        const parts = colorStr.match(/[\d.]+/g)
        if (parts && parts.length >= 4) {
            a = parseFloat(parts[3])
        }
        c.setStyle(colorStr)
    } else if (colorStr.startsWith("#") && colorStr.length === 9) {
        a = parseInt(colorStr.slice(7, 9), 16) / 255
        c.set(colorStr.slice(0, 7))
    } else {
        c.set(colorStr)
    }
    return { color: c, alpha: a }
}

// --- Icons & UI Styles ---
const LocationIcon = ({ color, shadowColor }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0px 0px 4px ${shadowColor || color})` }}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C13.3807 11.5 14.5 10.3807 14.5 9C14.5 7.61929 13.3807 6.5 12 6.5C10.6193 6.5 9.5 7.61929 9.5 9C9.5 10.3807 10.6193 11.5 12 11.5Z"
            fill={color}
        />
    </svg>
)

const markerStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px 6px 6px",
    borderRadius: "30px",
    background: "rgba(30, 30, 30, 0.4)",
    backgroundImage:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.0) 100%)",
    backdropFilter: "blur(12px) saturate(120%)",
    WebkitBackdropFilter: "blur(12px) saturate(120%)",
    boxShadow:
        "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: "14px",
    fontWeight: 400,
    letterSpacing: "0.2px",
    pointerEvents: "none",
    willChange: "transform, opacity",
    zIndex: 10,
}

export default function VariableDotsGlobe(incomingProps) {
    // STEP 1: Intercept & Flatten Grouped Props
    const props = {
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.styling || {}),
        ...(incomingProps.dotSizing || {}),
        ...(incomingProps.interactions || {}),
    }

    const {
        style,
        backgroundColor,
        oceanColor,
        dotColor,
        dotDensity,
        rotationSpeed,
        globeScale,
        positionX,
        positionY,
        isFlat,
        edgeDotSize,
        interiorDotSize,
        edgeInfluence,
        sizeRandomness,
        enableHover,
        editorPreview,
        markers, // Intercept markers array
    } = props

    const isStatic = useIsStaticRenderer()
    const mountRef = useRef(null)
    const isIntersecting = useRef(false)
    const markersRef = useRef(markers)
    const markerElsRef = useRef([])

    // Update markers reference for the animation loop without restarting Three.js
    useEffect(() => {
        markersRef.current = markers
        markerElsRef.current = markerElsRef.current.slice(0, markers.length)
    }, [markers])

    useEffect(() => {
        if (!mountRef.current) return

        let width = mountRef.current.clientWidth
        let height = mountRef.current.clientHeight

        // 1. Scene Setup
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        camera.position.z = 3.5

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        const container = mountRef.current
        container.appendChild(renderer.domElement)

        const mainGroup = new THREE.Group()
        mainGroup.position.set(positionX, positionY, 0)
        scene.add(mainGroup)

        // Scale adjustment & Target Rotations for Damping
        const effectiveScale =
            Math.min(
                1,
                width / (isFlat ? Math.PI * 2.2 : 2.4),
                height / (isFlat ? Math.PI * 1.1 : 2.4)
            ) * globeScale
        mainGroup.scale.setScalar(effectiveScale)

        let targetRotationX = 0
        let targetRotationY = 0

        if (!isFlat) {
            mainGroup.rotation.set(0.2, -Math.PI / 4, 0)
            targetRotationX = 0.2
            targetRotationY = -Math.PI / 4
        }

        // 2. Base Mesh (Ocean)
        const parsedOcean = parseColor(oceanColor)
        const baseGeo = isFlat
            ? new THREE.PlaneGeometry(Math.PI * 2, Math.PI)
            : new THREE.SphereGeometry(0.98, 64, 64)

        const baseMat = new THREE.MeshBasicMaterial({
            color: parsedOcean.color,
            transparent: true,
            // Completely transparent in flat map style so it acts as an invisible raycast hit box
            opacity: isFlat ? 0 : parsedOcean.alpha,
            // Disable depthWrite if ocean is semi-transparent so back-facing dots are visible.
            depthWrite: isFlat ? false : parsedOcean.alpha >= 0.99,
        })
        const baseMesh = new THREE.Mesh(baseGeo, baseMat)
        baseMesh.renderOrder = 0
        mainGroup.add(baseMesh)

        // 3. Globe Dots (Async Image Load - Gradient Edge Detection & Randomness)
        let dotsMesh = null
        const parsedDot = parseColor(dotColor)

        const dotsUniforms = {
            color: { value: parsedDot.color },
            opacity: { value: parsedDot.alpha },
            uHoverPos: { value: new THREE.Vector3(0, 0, 0) },
            uHoverActive: { value: 0.0 },
            uHoverRadius: { value: 0.35 },
        }

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src =
            "https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png"
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext("2d")
                ctx.drawImage(img, 0, 0)
                const imgData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                )

                const positions = []
                const sizes = []
                const phi = Math.PI * (3 - Math.sqrt(5))
                const cols = Math.round(Math.sqrt(dotDensity * 2.0))
                const rows = Math.round(dotDensity / cols)
                const actualNumPoints = isFlat ? cols * rows : dotDensity

                // Smart Distance Falloff Calculation
                const dotArea =
                    (imgData.width * imgData.height) / actualNumPoints
                const dotSpacing = Math.sqrt(dotArea)
                const R = Math.max(1, Math.round(dotSpacing * edgeInfluence))

                // Precompute spiral search offsets ordered by distance for extreme performance
                const searchOffsets = []
                for (let dy = -R; dy <= R; dy++) {
                    for (let dx = -R; dx <= R; dx++) {
                        let dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist <= R) {
                            searchOffsets.push({ dx, dy, dist })
                        }
                    }
                }
                searchOffsets.sort((a, b) => a.dist - b.dist)

                for (let i = 0; i < actualNumPoints; i++) {
                    let x, y, z, u, v
                    if (isFlat) {
                        u = (i % cols) / (cols - 1)
                        v = Math.floor(i / cols) / (rows - 1)
                        if (v > 0.83) continue
                        x = (u - 0.5) * Math.PI * 2
                        y = (0.5 - v) * Math.PI
                        z = 0
                    } else {
                        y = 1 - (i / (dotDensity - 1)) * 2
                        const radiusAtY = Math.sqrt(1 - y * y)
                        const theta = phi * i
                        x = Math.cos(theta) * radiusAtY
                        z = Math.sin(theta) * radiusAtY
                        u = 0.5 + Math.atan2(x, z) / (2 * Math.PI)
                        v = 0.5 - Math.asin(y) / Math.PI
                    }

                    const px = Math.floor(u * imgData.width)
                    const py = Math.floor(v * imgData.height)

                    // In this specific image map, RED < 128 denotes land
                    if (imgData.data[(py * imgData.width + px) * 4] < 128) {
                        let minDist = R

                        // Execute high-speed expanding search for nearest water pixel
                        if (R > 0) {
                            for (let j = 0; j < searchOffsets.length; j++) {
                                const offset = searchOffsets[j]
                                let cx = px + offset.dx
                                let cy = py + offset.dy

                                // Globe wraps continuously on X-axis
                                if (cx < 0) cx += imgData.width
                                else if (cx >= imgData.width)
                                    cx -= imgData.width

                                if (cy >= 0 && cy < imgData.height) {
                                    if (
                                        imgData.data[
                                            (cy * imgData.width + cx) * 4
                                        ] >= 128
                                    ) {
                                        minDist = offset.dist
                                        break // Early exit guarantees closest water due to pre-sorting
                                    }
                                } else {
                                    // Treat poles as map boundaries (water)
                                    minDist = offset.dist
                                    break
                                }
                            }
                        }

                        // Calculate visual influence based on distance
                        let influenceRatio = R > 0 ? minDist / R : 1.0
                        let falloff = Math.pow(influenceRatio, 1.2) // Ease curve for falloff

                        // Interpolate base size
                        let baseSize =
                            interiorDotSize +
                            (edgeDotSize - interiorDotSize) * (1.0 - falloff)

                        // Apply Randomness Variance
                        let randOffset =
                            (Math.random() * 2.0 - 1.0) * sizeRandomness
                        let finalSize = Math.max(
                            0.1,
                            baseSize * (1.0 + randOffset)
                        )

                        positions.push(x, y, z)
                        sizes.push(finalSize * effectiveScale)
                    }
                }

                const geo = new THREE.BufferGeometry()
                geo.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(positions, 3)
                )
                geo.setAttribute(
                    "aSize",
                    new THREE.Float32BufferAttribute(sizes, 1)
                )

                const mat = new THREE.ShaderMaterial({
                    uniforms: dotsUniforms,
                    vertexShader: `
                        attribute float aSize;
                        uniform vec3 uHoverPos;
                        uniform float uHoverActive;
                        uniform float uHoverRadius;
                        
                        void main() { 
                            float dist = distance(position, uHoverPos);
                            float effect = smoothstep(uHoverRadius, 0.0, dist);
                            // Scale up to 1.5x in the epicenter of the hover
                            float scale = 1.0 + (effect * 0.5 * uHoverActive);

                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); 
                            gl_Position = projectionMatrix * mvPosition; 
                            gl_PointSize = (aSize * scale) * (2.0 / -mvPosition.z); 
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 color; 
                        uniform float opacity;
                        void main() { 
                            float dist = length(gl_PointCoord - vec2(0.5)); 
                            // Renders a perfectly flat 2D circle with antialiasing
                            float alpha = smoothstep(0.5, 0.45, dist) * opacity;
                            if (alpha < 0.01) discard; 
                            gl_FragColor = vec4(color, alpha); 
                        }
                    `,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.NormalBlending,
                })
                dotsMesh = new THREE.Points(geo, mat)
                dotsMesh.renderOrder = 1
                mainGroup.add(dotsMesh)
            } catch (e) {}
        }

        // 4. Interaction (Drag to Rotate & Hover Raycast)
        let isDragging = false
        let previousMousePosition = { x: 0, y: 0 }
        let dragVelocity = { x: 0, y: 0 }

        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2(-2, -2) // Initially off-screen
        let targetHoverActive = 0
        let currentHoverActive = 0
        const localHoverPos = new THREE.Vector3()

        const onPointerDown = (e) => {
            if (isFlat) return // Disable drag for flat map
            isDragging = true
            previousMousePosition = { x: e.clientX, y: e.clientY }
            dragVelocity = { x: 0, y: 0 }
        }

        const onPointerMove = (e) => {
            const rect = container.getBoundingClientRect()
            const clientX = e.clientX - rect.left
            const clientY = e.clientY - rect.top

            mouse.x = (clientX / width) * 2 - 1
            mouse.y = -(clientY / height) * 2 + 1

            if (!isFlat && isDragging) {
                const deltaX = e.clientX - previousMousePosition.x
                const deltaY = e.clientY - previousMousePosition.y

                dragVelocity.x = deltaX * 0.005
                dragVelocity.y = deltaY * 0.005

                targetRotationY += dragVelocity.x
                targetRotationX += dragVelocity.y

                previousMousePosition = { x: e.clientX, y: e.clientY }
            }
        }

        const onPointerUp = () => {
            if (isFlat) return
            isDragging = false
        }

        const onPointerLeave = () => {
            if (!isDragging) {
                mouse.x = -2
                mouse.y = -2
            }
        }

        container.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        container.addEventListener("pointerleave", onPointerLeave)

        // 5. Animation Loop & Visibility Observer
        let animationFrameId = null

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)

            // Viewport & Editor Render Control
            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !editorPreview) return
            if (!isStatic && !isIntersecting.current) return

            // Apply momentum, auto-rotation, and smooth damping
            if (!isFlat) {
                if (!isDragging) {
                    targetRotationY += rotationSpeed * 0.016
                    targetRotationY += dragVelocity.x
                    targetRotationX += dragVelocity.y
                    dragVelocity.x *= 0.95
                    dragVelocity.y *= 0.95
                }

                // Damping interpolation
                mainGroup.rotation.y +=
                    (targetRotationY - mainGroup.rotation.y) * 0.1
                mainGroup.rotation.x +=
                    (targetRotationX - mainGroup.rotation.x) * 0.1
            }

            renderer.render(scene, camera)

            // Raycast for Hover calculation after render to ensure matrix bindings are fresh
            if (enableHover) {
                raycaster.setFromCamera(mouse, camera)
                const intersects = raycaster.intersectObject(baseMesh)
                if (intersects.length > 0) {
                    targetHoverActive = 1.0
                    localHoverPos.copy(intersects[0].point)
                    baseMesh.worldToLocal(localHoverPos)
                } else {
                    targetHoverActive = 0.0
                }
            } else {
                targetHoverActive = 0.0
            }

            // Smooth Hover Transition
            currentHoverActive +=
                (targetHoverActive - currentHoverActive) * 0.15
            if (dotsMesh) {
                dotsMesh.material.uniforms.uHoverActive.value =
                    currentHoverActive
                if (currentHoverActive > 0.01) {
                    dotsMesh.material.uniforms.uHoverPos.value.copy(
                        localHoverPos
                    )
                }
            }

            // Update 3D projected Custom Markers
            if (markersRef.current && markersRef.current.length > 0) {
                markersRef.current.forEach((marker, idx) => {
                    const el = markerElsRef.current[idx]
                    if (!el) return

                    const latRad = marker.lat * (Math.PI / 180)
                    const lngRad = marker.lng * (Math.PI / 180)

                    let x, y, z
                    if (isFlat) {
                        x = lngRad
                        y = latRad
                        z = 0
                    } else {
                        y = Math.sin(latRad)
                        const radiusAtY = Math.cos(latRad)
                        x = Math.sin(lngRad) * radiusAtY
                        z = Math.cos(lngRad) * radiusAtY
                    }

                    const markerRadius = isFlat ? 1.0 : 1.02 // Float slightly above surface
                    const localPos = new THREE.Vector3(
                        x * markerRadius,
                        y * markerRadius,
                        z * markerRadius
                    )
                    if (isFlat) {
                        localPos.x = x
                        localPos.y = y
                        localPos.z = 0.05
                    }

                    const worldPos = localPos
                        .clone()
                        .applyMatrix4(mainGroup.matrixWorld)

                    let opacity = 1
                    if (!isFlat) {
                        const center = new THREE.Vector3(0, 0, 0).applyMatrix4(
                            mainGroup.matrixWorld
                        )
                        const normal = worldPos.clone().sub(center).normalize()
                        const dirToCamera = camera.position
                            .clone()
                            .sub(worldPos)
                            .normalize()
                        const dot = normal.dot(dirToCamera)

                        // Smooth fluid fade calculation to prevent abrupt popping
                        if (dot < -0.1) {
                            opacity = 0
                        } else if (dot < 0.2) {
                            opacity = (dot + 0.1) / 0.3
                        }
                    }

                    if (opacity > 0) {
                        worldPos.project(camera)
                        const screenX = (worldPos.x * 0.5 + 0.5) * width
                        const screenY = (-(worldPos.y * 0.5) + 0.5) * height

                        el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`
                        el.style.opacity = Math.max(
                            0,
                            Math.min(1, opacity)
                        ).toFixed(2)
                        el.style.visibility = "visible"
                    } else {
                        el.style.opacity = "0"
                        el.style.visibility = "hidden"
                    }
                })
            }
        }

        const visibilityObserver = new IntersectionObserver((entries) => {
            isIntersecting.current = entries[0].isIntersecting
        })
        visibilityObserver.observe(container)

        if (isStatic) {
            setTimeout(() => renderer.render(scene, camera), 100)
        } else {
            animate()
        }

        // Handle Resize
        const resizeObserver = new ResizeObserver((entries) => {
            width = entries[0].contentRect.width
            height = entries[0].contentRect.height
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        })
        resizeObserver.observe(container)

        // Strict WebGL Cleanup
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            visibilityObserver.disconnect()
            container.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointerleave", onPointerLeave)

            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose()
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach((m) => m.dispose())
                    } else {
                        object.material.dispose()
                    }
                }
            })
            scene.clear()

            renderer.forceContextLoss()
            renderer.dispose()
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        isFlat,
        dotColor,
        oceanColor,
        dotDensity,
        edgeDotSize,
        interiorDotSize,
        edgeInfluence,
        sizeRandomness,
        globeScale,
        rotationSpeed,
        positionX,
        positionY,
        enableHover,
        isStatic,
        editorPreview,
    ])

    // Generate matched shadow color once for UI rendering
    const parsedMarkerColor = parseColor(dotColor)
    const markerShadowColor = `rgba(${Math.round(parsedMarkerColor.color.r * 255)}, ${Math.round(parsedMarkerColor.color.g * 255)}, ${Math.round(parsedMarkerColor.color.b * 255)}, 0.4)`

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                ...style,
                position: "relative",
                background: isFlat ? "transparent" : backgroundColor, // Forced transparent on flat map mode
                overflow: "hidden",
                cursor: "default",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            {/* 3D Canvas Container */}
            <div
                ref={mountRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    zIndex: 1,
                }}
            />

            {/* Custom Markers UI Overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 2,
                    overflow: "hidden",
                }}
            >
                {markers.map((marker, idx) => (
                    <div
                        key={idx}
                        ref={(el) => (markerElsRef.current[idx] = el)}
                        style={{
                            ...markerStyle,
                            opacity: 0, // start invisible before initial projection
                        }}
                    >
                        <LocationIcon
                            color={dotColor}
                            shadowColor={markerShadowColor}
                        />
                        <span>{marker.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// STEP 2: Nested Default Props
VariableDotsGlobe.defaultProps = {
    style: { width: 500, height: 500 },
    editorPreview: true,
    markers: [{ label: "Netherlands", lat: 52.13, lng: 5.29 }],
    styling: {
        oceanColor: "rgba(0, 0, 0, 1)",
        dotColor: "rgba(100, 255, 100, 1)",
        backgroundColor: "rgba(0, 0, 0, 0)",
    },
    layout: {
        isFlat: false,
        globeScale: 1.0,
        rotationSpeed: 0.15,
        dotDensity: 15000,
        positionX: 0,
        positionY: 0,
    },
    dotSizing: {
        edgeDotSize: 22,
        interiorDotSize: 6,
        edgeInfluence: 3.5,
        sizeRandomness: 0.15,
    },
    interactions: {
        enableHover: true,
    },
}

// STEP 3: UI Categorization
addPropertyControls(VariableDotsGlobe, {
    editorPreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: VariableDotsGlobe.defaultProps.editorPreview,
    },
    markers: {
        type: ControlType.Array,
        title: "Markers",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Location",
                },
                lat: {
                    type: ControlType.Number,
                    title: "Latitude",
                    defaultValue: 0,
                    min: -90,
                    max: 90,
                    displayStepper: true,
                },
                lng: {
                    type: ControlType.Number,
                    title: "Longitude",
                    defaultValue: 0,
                    min: -180,
                    max: 180,
                    displayStepper: true,
                },
            },
        },
        defaultValue: VariableDotsGlobe.defaultProps.markers,
    },
    styling: {
        type: ControlType.Object,
        title: "Styling",
        controls: {
            oceanColor: {
                type: ControlType.Color,
                title: "Ocean Color",
                defaultValue: VariableDotsGlobe.defaultProps.styling.oceanColor,
                hidden(props) {
                    return (
                        props.isFlat === true ||
                        (props.layout && props.layout.isFlat === true)
                    )
                },
            },
            dotColor: {
                type: ControlType.Color,
                title: "Dot Color",
                defaultValue: VariableDotsGlobe.defaultProps.styling.dotColor,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue:
                    VariableDotsGlobe.defaultProps.styling.backgroundColor,
                hidden(props) {
                    return (
                        props.isFlat === true ||
                        (props.layout && props.layout.isFlat === true)
                    )
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            isFlat: {
                type: ControlType.Boolean,
                title: "Flat Map",
                defaultValue: VariableDotsGlobe.defaultProps.layout.isFlat,
            },
            globeScale: {
                type: ControlType.Number,
                title: "Globe Scale",
                defaultValue: VariableDotsGlobe.defaultProps.layout.globeScale,
                min: 0.1,
                max: 5.0,
                step: 0.05,
                displayStepper: true,
            },
            rotationSpeed: {
                type: ControlType.Number,
                title: "Globe Speed",
                defaultValue:
                    VariableDotsGlobe.defaultProps.layout.rotationSpeed,
                min: 0,
                max: 0.5,
                step: 0.01,
                displayStepper: true,
                hidden(props) {
                    return (
                        props.isFlat === true ||
                        (props.layout && props.layout.isFlat === true)
                    )
                },
            },
            positionX: {
                type: ControlType.Number,
                title: "Position X",
                defaultValue: VariableDotsGlobe.defaultProps.layout.positionX,
                min: -10,
                max: 10,
                step: 0.1,
                displayStepper: true,
            },
            positionY: {
                type: ControlType.Number,
                title: "Position Y",
                defaultValue: VariableDotsGlobe.defaultProps.layout.positionY,
                min: -10,
                max: 10,
                step: 0.1,
                displayStepper: true,
            },
            dotDensity: {
                type: ControlType.Number,
                title: "Dot Density",
                defaultValue: VariableDotsGlobe.defaultProps.layout.dotDensity,
                min: 2000,
                max: 80000,
                step: 1000,
            },
        },
    },
    dotSizing: {
        type: ControlType.Object,
        title: "Dot Sizing",
        controls: {
            edgeDotSize: {
                type: ControlType.Number,
                title: "Edge Size",
                defaultValue:
                    VariableDotsGlobe.defaultProps.dotSizing.edgeDotSize,
                min: 1,
                max: 50,
                step: 0.1,
                displayStepper: true,
            },
            interiorDotSize: {
                type: ControlType.Number,
                title: "Inner Size",
                defaultValue:
                    VariableDotsGlobe.defaultProps.dotSizing.interiorDotSize,
                min: 1,
                max: 50,
                step: 0.1,
                displayStepper: true,
            },
            edgeInfluence: {
                type: ControlType.Number,
                title: "Edge Falloff",
                defaultValue:
                    VariableDotsGlobe.defaultProps.dotSizing.edgeInfluence,
                min: 0,
                max: 15,
                step: 0.1,
                displayStepper: true,
            },
            sizeRandomness: {
                type: ControlType.Number,
                title: "Randomness",
                defaultValue:
                    VariableDotsGlobe.defaultProps.dotSizing.sizeRandomness,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
    },
    interactions: {
        type: ControlType.Object,
        title: "Interactions",
        controls: {
            enableHover: {
                type: ControlType.Boolean,
                title: "Hover Effect",
                defaultValue:
                    VariableDotsGlobe.defaultProps.interactions.enableHover,
            },
        },
    },
})
