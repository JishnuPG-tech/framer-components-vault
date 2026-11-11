import { useEffect, useRef, useState, useCallback } from "react"
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

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 */

// Real star catalog data based on Hipparcos catalog (brightest stars)
// Data includes: Right Ascension (RA), Declination (Dec), Magnitude, Color Index
const STAR_CATALOG = [
    // Sirius - brightest star
    { name: "Sirius", ra: 101.29, dec: -16.72, mag: -1.46, colorIndex: 0.0 },
    // Canopus
    { name: "Canopus", ra: 95.99, dec: -52.7, mag: -0.72, colorIndex: 0.15 },
    // Alpha Centauri
    {
        name: "Alpha Centauri",
        ra: 219.9,
        dec: -60.84,
        mag: -0.27,
        colorIndex: 0.71,
    },
    // Arcturus
    { name: "Arcturus", ra: 213.92, dec: 19.18, mag: -0.05, colorIndex: 1.23 },
    // Vega
    { name: "Vega", ra: 279.23, dec: 38.78, mag: 0.03, colorIndex: 0.0 },
    // Capella
    { name: "Capella", ra: 79.17, dec: 45.99, mag: 0.08, colorIndex: 0.8 },
    // Rigel
    { name: "Rigel", ra: 78.63, dec: -8.2, mag: 0.12, colorIndex: -0.03 },
    // Procyon
    { name: "Procyon", ra: 114.83, dec: 5.23, mag: 0.38, colorIndex: 0.42 },
    // Betelgeuse
    { name: "Betelgeuse", ra: 88.79, dec: 7.41, mag: 0.5, colorIndex: 1.5 },
    // Altair
    { name: "Altair", ra: 297.7, dec: 8.87, mag: 0.77, colorIndex: 0.22 },
    // Aldebaran
    { name: "Aldebaran", ra: 68.98, dec: 16.51, mag: 0.85, colorIndex: 1.54 },
    // Antares
    { name: "Antares", ra: 247.35, dec: -26.43, mag: 0.96, colorIndex: 1.83 },
    // Spica
    { name: "Spica", ra: 201.3, dec: -11.16, mag: 1.04, colorIndex: -0.24 },
    // Pollux
    { name: "Pollux", ra: 116.33, dec: 28.03, mag: 1.14, colorIndex: 1.0 },
    // Fomalhaut
    { name: "Fomalhaut", ra: 344.41, dec: -29.62, mag: 1.16, colorIndex: 0.09 },
    // Deneb
    { name: "Deneb", ra: 310.36, dec: 45.28, mag: 1.25, colorIndex: 0.09 },
    // Regulus
    { name: "Regulus", ra: 152.09, dec: 11.97, mag: 1.35, colorIndex: -0.11 },
    // Castor
    { name: "Castor", ra: 113.65, dec: 31.89, mag: 1.58, colorIndex: 0.03 },
]

// Generate additional background stars
const generateBackgroundStars = (count: number) => {
    const stars = []
    for (let i = 0; i < count; i++) {
        stars.push({
            name: `Star-${i}`,
            ra: Math.random() * 360,
            dec: (Math.random() - 0.5) * 180,
            mag: 2 + Math.random() * 4,
            colorIndex: -0.5 + Math.random() * 2.5,
        })
    }
    return stars
}

// Convert color index to RGB color (B-V color index)
const colorIndexToRGB = (colorIndex: number): THREE.Color => {
    // Blue stars: negative to 0
    // White stars: 0 to 0.3
    // Yellow stars: 0.3 to 0.6
    // Orange stars: 0.6 to 1.2
    // Red stars: 1.2+

    if (colorIndex < 0) {
        // Blue-white stars
        return new THREE.Color(
            0.6 + colorIndex * -0.4,
            0.7 + colorIndex * -0.3,
            1.0
        )
    } else if (colorIndex < 0.3) {
        // White stars
        return new THREE.Color(
            1.0,
            1.0 - colorIndex * 0.2,
            1.0 - colorIndex * 0.3
        )
    } else if (colorIndex < 0.6) {
        // Yellow-white stars
        const t = (colorIndex - 0.3) / 0.3
        return new THREE.Color(1.0, 1.0 - t * 0.2, 0.9 - t * 0.4)
    } else if (colorIndex < 1.2) {
        // Orange stars
        const t = (colorIndex - 0.6) / 0.6
        return new THREE.Color(1.0, 0.8 - t * 0.3, 0.5 - t * 0.3)
    } else {
        // Red stars
        const t = Math.min((colorIndex - 1.2) / 0.8, 1)
        return new THREE.Color(1.0, 0.5 - t * 0.3, 0.2 - t * 0.2)
    }
}

// Create a small radial gradient texture for soft, blurred star points
const createRadialStarTexture = (size: number = 64): THREE.Texture => {
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext("2d")
    if (!context) {
        // Fallback: return a white 1x1 texture
        const fallback = new ImageData(1, 1)
        const tex = new THREE.DataTexture(fallback.data, 1, 1)
        tex.needsUpdate = true
        return tex
    }

    const center = size / 2
    const gradient = context.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        center
    )
    // Core is bright, edges fade out smoothly for a blur/glow effect
    gradient.addColorStop(0.0, "rgba(255,255,255,1)")
    gradient.addColorStop(0.2, "rgba(255,255,255,0.85)")
    gradient.addColorStop(0.5, "rgba(255,255,255,0.35)")
    gradient.addColorStop(1.0, "rgba(255,255,255,0)")

    context.clearRect(0, 0, size, size)
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
    return texture
}

// Convert RA/Dec to Cartesian coordinates with scatter effect
const raDecToCartesian = (
    ra: number,
    dec: number,
    radius: number,
    scatterAmount: number = 100
) => {
    const raRad = (ra * Math.PI) / 180
    const decRad = (dec * Math.PI) / 180

    // Add scatter to radius for chaotic, non-uniform appearance
    const chaoticRadius = radius + (Math.random() - 0.5) * scatterAmount

    const x = chaoticRadius * Math.cos(decRad) * Math.cos(raRad)
    const y = chaoticRadius * Math.sin(decRad)
    const z = chaoticRadius * Math.cos(decRad) * Math.sin(raRad)

    return { x, y, z }
}

interface CosmosVisualizationProps {
    starCount: number
    starSize: number
    rotationSpeed: number
    zoomSpeed: number
    backgroundColor: string
    ambientLightIntensity: number
    interactionEnabled: boolean
    scatterAmount: number
    autoRotation: boolean
    autoRotationSpeed: number
    autoRotationAxis: string
    style?: React.CSSProperties
}

export default function CosmosVisualization(props: CosmosVisualizationProps) {
    const {
        starCount,
        starSize,
        rotationSpeed,
        zoomSpeed,
        backgroundColor,
        ambientLightIntensity,
        interactionEnabled,
        scatterAmount,
        autoRotation,
        autoRotationSpeed,
        autoRotationAxis,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const starsRef = useRef<THREE.Points | null>(null)
    const namedStarsRef = useRef<THREE.Group | null>(null)

    const animationFrameRef = useRef<number>()

    const [isDragging, setIsDragging] = useState(false)
    const [scale, setScale] = useState(1)

    const dragStartRef = useRef({ x: 0, y: 0 })
    const rotationRef = useRef({ x: 0, y: 0 })
    const autoRotationRef = useRef({ x: 0, y: 0, z: 0 })

    // Initialize Three.js scene
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        // Scene setup
        const scene = new THREE.Scene()
        sceneRef.current = scene

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            60,
            containerRef.current.clientWidth /
                containerRef.current.clientHeight,
            0.1,
            2000
        )
        camera.position.z = 300
        cameraRef.current = camera

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        })
        renderer.setSize(
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
        )
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        rendererRef.current = renderer

        // Create star field from catalog
        const allStars = [
            ...STAR_CATALOG,
            ...generateBackgroundStars(starCount),
        ]

        // Background stars (points)
        const backgroundStars = allStars.filter((s) => s.mag > 1.6)
        const positions = new Float32Array(backgroundStars.length * 3)
        const colors = new Float32Array(backgroundStars.length * 3)
        const sizes = new Float32Array(backgroundStars.length)

        backgroundStars.forEach((star, i) => {
            const radius = 400
            const pos = raDecToCartesian(
                star.ra,
                star.dec,
                radius,
                scatterAmount
            )
            positions[i * 3] = pos.x
            positions[i * 3 + 1] = pos.y
            positions[i * 3 + 2] = pos.z

            const color = colorIndexToRGB(star.colorIndex)
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b

            // Size based on magnitude (brighter = larger)
            sizes[i] = Math.max(1, (6 - star.mag) * starSize * 0.5)
        })

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        )
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

        const starTexture = createRadialStarTexture(64)
        const material = new THREE.PointsMaterial({
            size: starSize,
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: starTexture,
            alphaTest: 0.01,
        })

        const stars = new THREE.Points(geometry, material)
        starsRef.current = stars
        scene.add(stars)

        // Named bright stars (individual sprites)
        const namedStarsGroup = new THREE.Group()
        const brightStars = allStars.filter((s) => s.mag <= 1.6)

        brightStars.forEach((star) => {
            const radius = 400
            const pos = raDecToCartesian(
                star.ra,
                star.dec,
                radius,
                scatterAmount
            )

            // Create sprite for bright stars
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            if (!ctx) return

            canvas.width = 64
            canvas.height = 64

            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
            const color = colorIndexToRGB(star.colorIndex)
            gradient.addColorStop(
                0,
                `rgba(${color.r * 255},${color.g * 255},${color.b * 255},1)`
            )
            gradient.addColorStop(
                0.2,
                `rgba(${color.r * 255},${color.g * 255},${color.b * 255},0.8)`
            )
            gradient.addColorStop(
                0.5,
                `rgba(${color.r * 255},${color.g * 255},${color.b * 255},0.3)`
            )
            gradient.addColorStop(1, "rgba(255,255,255,0)")

            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, 64, 64)

            const texture = new THREE.CanvasTexture(canvas)
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
            })

            const sprite = new THREE.Sprite(spriteMaterial)
            const size = Math.max(15, (2 - star.mag) * starSize * 5)
            sprite.scale.set(size, size, 1)
            sprite.position.set(pos.x, pos.y, pos.z)
            sprite.userData = {
                name: star.name,
                magnitude: star.mag,
                colorIndex: star.colorIndex,
            }

            namedStarsGroup.add(sprite)
        })

        namedStarsRef.current = namedStarsGroup
        scene.add(namedStarsGroup)

        // Ambient light
        const ambientLight = new THREE.AmbientLight(
            0xffffff,
            ambientLightIntensity
        )
        scene.add(ambientLight)

        // Handle resize
        const handleResize = () => {
            if (!containerRef.current || !camera || !renderer) return

            const width = containerRef.current.clientWidth
            const height = containerRef.current.clientHeight

            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        }

        window.addEventListener("resize", handleResize)

        // Animation loop
        const animate = () => {
            if (!scene || !camera || !renderer) return

            // Apply automatic rotation if enabled
            if (autoRotation) {
                autoRotationRef.current.x += autoRotationSpeed * 0.0001
                autoRotationRef.current.y += autoRotationSpeed * 0.0001
                autoRotationRef.current.z += autoRotationSpeed * 0.0001
            }

            // Apply rotation
            scene.rotation.x =
                rotationRef.current.x +
                (autoRotation && autoRotationAxis.includes("X")
                    ? autoRotationRef.current.x
                    : 0)
            scene.rotation.y =
                rotationRef.current.y +
                (autoRotation && autoRotationAxis.includes("Y")
                    ? autoRotationRef.current.y
                    : 0)
            scene.rotation.z =
                autoRotation && autoRotationAxis.includes("Z")
                    ? autoRotationRef.current.z
                    : 0

            renderer.render(scene, camera)
            animationFrameRef.current = requestAnimationFrame(animate)
        }
        animate()

        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            renderer.dispose()
            geometry.dispose()
            material.dispose()
        }
    }, [autoRotation, autoRotationSpeed, autoRotationAxis])

    // Update scene when props change
    useEffect(() => {
        if (sceneRef.current) {
            sceneRef.current.background = new THREE.Color(backgroundColor)
        }
    }, [backgroundColor])

    useEffect(() => {
        if (starsRef.current) {
            const material = starsRef.current.material as THREE.PointsMaterial
            material.size = starSize
        }
    }, [starSize])

    // Mouse interaction handlers
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!interactionEnabled) return
            setIsDragging(true)
            dragStartRef.current = { x: e.clientX, y: e.clientY }
        },
        [interactionEnabled]
    )

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging || !interactionEnabled) return

            const deltaX = e.clientX - dragStartRef.current.x
            const deltaY = e.clientY - dragStartRef.current.y

            rotationRef.current.y += deltaX * rotationSpeed * 0.001
            rotationRef.current.x += deltaY * rotationSpeed * 0.001

            // Clamp X rotation to prevent flipping
            rotationRef.current.x = Math.max(
                -Math.PI / 2,
                Math.min(Math.PI / 2, rotationRef.current.x)
            )

            dragStartRef.current = { x: e.clientX, y: e.clientY }
        },
        [isDragging, rotationSpeed, interactionEnabled]
    )

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (!cameraRef.current || !interactionEnabled) return
            e.preventDefault()

            const delta = e.deltaY * zoomSpeed * 0.1
            cameraRef.current.position.z = Math.max(
                50,
                Math.min(1500, cameraRef.current.position.z + delta)
            )
        },
        [zoomSpeed, interactionEnabled]
    )

    // Scale animation when dragging
    useEffect(() => {
        if (isDragging) {
            setScale(1.12)
        } else {
            setScale(1)
        }
    }, [isDragging])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                cursor: interactionEnabled
                    ? isDragging
                        ? "grabbing"
                        : "grab"
                    : "default",
                userSelect: "none",
                transform: `scale(${scale})`,
                transition: "transform 0.25s cubic-bezier(0.4,0.4,0.0,1)",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    )
}

// Default props
CosmosVisualization.defaultProps = {
    starCount: 2000,
    starSize: 2,
    rotationSpeed: 3,
    zoomSpeed: 1,
    backgroundColor: "#000000",
    ambientLightIntensity: 0.5,
    interactionEnabled: true,
    scatterAmount: 100,
    autoRotation: false,
    autoRotationSpeed: 1,
    autoRotationAxis: "Y",
}

// Property Controls
addPropertyControls(CosmosVisualization, {
    starCount: {
        type: ControlType.Number,
        title: "Background Stars",
        min: 100,
        max: 10000,
        step: 100,
        defaultValue: 2000,
        displayStepper: true,
    },
    starSize: {
        type: ControlType.Number,
        title: "Star Size",
        min: 0.5,
        max: 10,
        step: 0.5,
        defaultValue: 2,
        description: "Base size multiplier for stars",
        unit: "px",
        displayStepper: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    ambientLightIntensity: {
        type: ControlType.Number,
        title: "Brightness",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 0.5,
        description: "Overall brightness of the starfield",
        displayStepper: true,
    },
    interactionEnabled: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
        description: "Allow users to rotate and zoom the starfield",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 3,
        description: "Sensitivity of mouse rotation control",
        displayStepper: true,
        hidden(props) {
            return !props.interactionEnabled
        },
    },
    zoomSpeed: {
        type: ControlType.Number,
        title: "Zoom Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        description: "Sensitivity of scroll wheel zoom",
        displayStepper: true,
        hidden(props) {
            return !props.interactionEnabled
        },
    },
    scatterAmount: {
        type: ControlType.Number,
        title: "Scatter Amount",
        min: 0,
        max: 300,
        step: 10,
        defaultValue: 100,
        description: "Randomness of star positions",
        displayStepper: true,
    },
    autoRotation: {
        type: ControlType.Boolean,
        title: "Auto Rotation",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
        description: "Automatically rotate the starfield",
    },
    autoRotationSpeed: {
        type: ControlType.Number,
        title: "Auto Rotation Speed",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 1,
        description: "Speed of automatic rotation",
        displayStepper: true,
        hidden(props) {
            return !props.autoRotation
        },
    },
    autoRotationAxis: {
        type: ControlType.Enum,
        title: "Rotation Axis",
        options: ["X", "Y", "Z", "XY", "XZ", "YZ", "XYZ"],
        defaultValue: "Y",
        description: "Which axes to rotate around automatically",
        hidden(props) {
            return !props.autoRotation
        },
    },
})
