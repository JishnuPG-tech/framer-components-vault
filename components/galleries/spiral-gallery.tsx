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
// 1. TYPESCRIPT INTERFACES
// ==========================================
interface ContentProps {
    mediaType: "Images" | "Videos"
    imageCount: number
    images: string[]
    videos: string[]
}

interface LayoutProps {
    radius: number
    itemWidth: number
    itemHeight: number
    spiralHeight: number
    revolutions: number
    poleFlare: number
}

interface AppearanceProps {
    borderRadius: number
    cameraDistance: number
    edgeFadeStrength: number
    cinematicBackground: boolean
    cinematicBgColor: string
    cinematicBgOuterColor: string
    brightness: number
    contrast: number
    saturation: number
}

interface InteractionProps {
    scrollMode: "Page Scroll" | "Internal Wheel/Drag"
    scrollSensitivity: number
    damping: number
    autoPlay: boolean
    autoPlaySpeed: number
    windEffectStrength: number
}

interface CinematicSpiralProps extends React.HTMLAttributes<HTMLDivElement> {
    livePreview?: boolean
    content?: ContentProps
    layout?: LayoutProps
    appearance?: AppearanceProps
    interaction?: InteractionProps
    [key: string]: any // Fallback for flattened props
}

// ==========================================
// 2. MAIN COMPONENT EXPORT
// ==========================================
export default function CinematicSpiralCarousel(
    incomingProps: CinematicSpiralProps
) {
    // STEP 1: Intercept & Flatten (Strict Prop-Flattening Rule)
    const props = {
        ...incomingProps,
        ...(incomingProps.content || {}),
        ...(incomingProps.layout || {}),
        ...(incomingProps.appearance || {}),
        ...(incomingProps.interaction || {}),
    }

    const mountRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!mountRef.current) return

        // ------------------------------------------
        // A. State & Variable Initialization (Bypassing React State)
        // ------------------------------------------
        let isIntersecting = false
        let animationFrameId: number

        let currentScroll = 0
        let targetScroll = 0
        let autoScrollAccumulator = 0

        // Wind Effect tracking
        let lastScroll = 0
        let windVelocity = 0

        // Interaction state for drag
        let isDragging = false
        let startY = 0

        // ------------------------------------------
        // B. Core Three.js Setup
        // ------------------------------------------
        const width = mountRef.current.clientWidth
        const height = mountRef.current.clientHeight

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        mountRef.current.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            1000
        )
        camera.position.set(0, 0, props.cameraDistance)

        // ------------------------------------------
        // C. Asset Loading & Memory Management Arrays
        // ------------------------------------------
        const textureLoader = new THREE.TextureLoader()
        // CRITICAL: Prevent WebGL Tainted Canvas CORS error on Framer CDN images
        textureLoader.setCrossOrigin("anonymous")

        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

        // Arrays to hold assets for strict cleanup later
        const materialsToDispose: THREE.Material[] = []
        const geometriesToDispose: THREE.BufferGeometry[] = []
        const texturesToDispose: THREE.Texture[] = []
        const meshes: THREE.Mesh[] = []

        // Hardware accelerated video arrays
        const videoElements: HTMLVideoElement[] = []
        const videoTextures: Record<string, THREE.VideoTexture> = {}

        // ------------------------------------------
        // D. 4K Immersive Stars Background (Optional)
        // ------------------------------------------
        let starParticles: THREE.Points | null = null
        if (props.cinematicBackground) {
            const starsGeo = new THREE.BufferGeometry()
            const starsCount = 4000
            const posArray = new Float32Array(starsCount * 3)
            const colorArray = new Float32Array(starsCount * 3)

            const baseColor = new THREE.Color(props.cinematicBgOuterColor)
            const whiteColor = new THREE.Color(0xffffff)

            for (let i = 0; i < starsCount; i++) {
                // Spherical math for random distribution
                const r = 40 + Math.random() * 400
                const theta = 2 * Math.PI * Math.random()
                const phi = Math.acos(2 * Math.random() - 1)

                posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta)
                posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
                posArray[i * 3 + 2] = r * Math.cos(phi)

                // Blend star color with the deep space background color
                const mixColor = baseColor
                    .clone()
                    .lerp(whiteColor, Math.random() * 0.8 + 0.2)
                colorArray[i * 3] = mixColor.r
                colorArray[i * 3 + 1] = mixColor.g
                colorArray[i * 3 + 2] = mixColor.b
            }

            starsGeo.setAttribute(
                "position",
                new THREE.BufferAttribute(posArray, 3)
            )
            starsGeo.setAttribute(
                "color",
                new THREE.BufferAttribute(colorArray, 3)
            )

            // Custom shader for glowing, circular stars
            const starsMat = new THREE.ShaderMaterial({
                vertexShader: `
                    attribute vec3 color;
                    varying vec3 vColor;
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = (120.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    void main() {
                        vec2 coord = gl_PointCoord - vec2(0.5);
                        if(length(coord) > 0.5) discard;
                        float dist = length(coord);
                        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                        gl_FragColor = vec4(vColor, alpha * 0.9);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })

            starParticles = new THREE.Points(starsGeo, starsMat)
            scene.add(starParticles)
            geometriesToDispose.push(starsGeo)
            materialsToDispose.push(starsMat)
        }

        // ------------------------------------------
        // E. Carousel Geometry & Custom Shader Material
        // ------------------------------------------

        // Calculate the slice of a cylinder needed for perfect "Printed on a Pole" math
        const thetaLength = props.itemWidth / props.radius
        const thetaStart = Math.PI / 2 - thetaLength / 2
        const radialSegments = 64
        const heightSegments = 16

        const cylinderGeo = new THREE.CylinderGeometry(
            props.radius,
            props.radius,
            props.itemHeight,
            radialSegments,
            heightSegments,
            true, // openEnded
            thetaStart,
            thetaLength
        )
        geometriesToDispose.push(cylinderGeo)

        // ShaderMaterial Factory for rounded corners, Dynamic Flare, and Wind effects
        const createMaterial = (
            texture: THREE.Texture | null,
            isVideoTex: boolean
        ) => {
            if (texture && !isVideoTex) {
                texture.generateMipmaps = true
                texture.minFilter = THREE.LinearMipmapLinearFilter
                texture.colorSpace = THREE.SRGBColorSpace
                texture.anisotropy = maxAnisotropy
                texturesToDispose.push(texture)
            }

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: texture },
                    planeSize: {
                        value: new THREE.Vector2(
                            props.itemWidth,
                            props.itemHeight
                        ),
                    },
                    borderRadius: { value: props.borderRadius },
                    opacity: { value: 1.0 },
                    poleFlare: { value: props.poleFlare },
                    wind: { value: 0.0 },
                    brightness: { value: props.brightness },
                    contrast: { value: props.contrast },
                    saturation: { value: props.saturation },
                },
                vertexShader: `
                    varying vec2 vUv;
                    uniform float poleFlare;
                    uniform float wind;
                    
                    void main() {
                        vUv = uv;
                        vec4 worldPos = modelMatrix * vec4(position, 1.0);
                        
                        // Bend images outward dynamically based on Y distance
                        float yDist = worldPos.y;
                        vec2 outward = normalize(worldPos.xz);
                        float expansion = (yDist * yDist) * poleFlare;
                        worldPos.xz += outward * expansion;
                        
                        // Wind Effect: Inertial bending based on scroll velocity
                        float windFlutter = sin(vUv.x * 3.1415) * wind * 30.0;
                        worldPos.y -= windFlutter;
                        worldPos.xz -= outward * (vUv.y - 0.5) * wind * 20.0;
                        
                        gl_Position = projectionMatrix * viewMatrix * worldPos;
                    }
                `,
                fragmentShader: `
                    varying vec2 vUv;
                    uniform sampler2D map;
                    uniform vec2 planeSize;
                    uniform float borderRadius;
                    uniform float opacity;
                    uniform float brightness;
                    uniform float contrast;
                    uniform float saturation;

                    void main() {
                        vec2 px = vUv * planeSize;
                        vec2 halfSize = planeSize * 0.5;
                        
                        // SDF (Signed Distance Field) for crisp rounded borders
                        vec2 d = abs(px - halfSize) - halfSize + vec2(borderRadius);
                        float dist = length(max(d, 0.0)) - borderRadius;
                        
                        float edgeWidth = 0.02; 
                        float alpha = 1.0 - smoothstep(-edgeWidth, edgeWidth, dist);
                        
                        if (alpha < 0.01) discard; // Discard transparent pixels
                        
                        vec4 texColor = texture2D(map, vUv);
                        vec3 color = texColor.rgb;
                        
                        // Apply Brightness
                        color *= brightness;
                        
                        // Apply Contrast
                        color = (color - 0.5) * contrast + 0.5;
                        
                        // Apply Saturation
                        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
                        color = mix(vec3(luminance), color, saturation);
                        
                        gl_FragColor = vec4(color, texColor.a * alpha * opacity);
                        
                        // Correctly apply sRGB output encoding to fix dull/washed out colors
                        #include <tonemapping_fragment>
                        #include <colorspace_fragment>
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: true,
            })
            materialsToDispose.push(material)
            return material
        }

        // Generate the carousel meshes based on total image count
        const totalItems = props.imageCount
        const isVideoMode = props.mediaType === "Videos"
        const validImages =
            props.images && props.images.length > 0 ? props.images : []
        const validVideos =
            props.videos && props.videos.length > 0 ? props.videos : []
        const validMedia = isVideoMode ? validVideos : validImages

        for (let i = 0; i < totalItems; i++) {
            let texture: THREE.Texture | null = null

            if (validMedia.length > 0) {
                const url = validMedia[i % validMedia.length]

                if (isVideoMode) {
                    // Caching Logic: Prevents lagging by only creating 1 video element per unique URL
                    // and reusing the texture if mapped across multiple meshes.
                    if (!videoTextures[url]) {
                        const video = document.createElement("video")
                        video.src = url
                        video.crossOrigin = "anonymous"
                        video.loop = true
                        video.muted = true
                        video.playsInline = true
                        video.autoplay = true
                        video
                            .play()
                            .catch(() => console.warn("Video autoplay blocked"))

                        const vTex = new THREE.VideoTexture(video)
                        vTex.colorSpace = THREE.SRGBColorSpace
                        // CRITICAL PERFORMANCE TWEAK:
                        // Generating mipmaps for video every frame causes severe GPU lag.
                        vTex.generateMipmaps = false
                        vTex.minFilter = THREE.LinearFilter
                        vTex.magFilter = THREE.LinearFilter

                        videoTextures[url] = vTex
                        texturesToDispose.push(vTex)
                        videoElements.push(video)
                    }
                    texture = videoTextures[url]
                } else {
                    texture = textureLoader.load(url)
                }
            }

            const material = createMaterial(texture, isVideoMode)
            const mesh = new THREE.Mesh(cylinderGeo, material)
            scene.add(mesh)
            meshes.push(mesh)
        }

        // ------------------------------------------
        // F. Event Listeners & Interaction
        // ------------------------------------------
        const handleWheel = (e: WheelEvent) => {
            if (props.scrollMode === "Internal Wheel/Drag") {
                targetScroll += e.deltaY * props.scrollSensitivity
            }
        }

        const handleTouchStart = (e: TouchEvent) => {
            if (props.scrollMode === "Internal Wheel/Drag") {
                isDragging = true
                startY = e.touches[0].clientY
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return
            const y = e.touches[0].clientY
            const delta = startY - y
            targetScroll += delta * props.scrollSensitivity * 2
            startY = y
        }

        const handleTouchEnd = () => {
            isDragging = false
        }

        const handlePageScroll = () => {
            if (props.scrollMode === "Page Scroll") {
                targetScroll = window.scrollY * props.scrollSensitivity
            }
        }

        if (props.scrollMode === "Page Scroll") {
            window.addEventListener("scroll", handlePageScroll, {
                passive: true,
            })
            handlePageScroll()
        } else {
            const el = mountRef.current
            el.addEventListener("wheel", handleWheel, { passive: true })
            el.addEventListener("touchstart", handleTouchStart, {
                passive: true,
            })
            el.addEventListener("touchmove", handleTouchMove, { passive: true })
            el.addEventListener("touchend", handleTouchEnd, { passive: true })
        }

        // ------------------------------------------
        // G. Viewport & Resize Optimization Observers
        // ------------------------------------------
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect
                renderer.setSize(width, height)
                camera.aspect = width / height
                camera.updateProjectionMatrix()
            }
        })
        resizeObserver.observe(mountRef.current)

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isIntersecting = entry.isIntersecting
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(mountRef.current)

        // ------------------------------------------
        // H. The Main Render Animation Loop
        // ------------------------------------------
        const render = () => {
            // Check if we are inside the Framer Editor to respect Live Preview toggle
            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !props.livePreview) {
                animationFrameId = requestAnimationFrame(render)
                return
            }

            // Gated rendering: Only calculate math if visible on screen
            if (isIntersecting || inEditor) {
                if (props.autoPlay) {
                    autoScrollAccumulator += props.autoPlaySpeed
                }

                const totalScrollTarget = targetScroll + autoScrollAccumulator
                currentScroll +=
                    (totalScrollTarget - currentScroll) * props.damping

                // Calculate scroll delta to feed into the shader's wind effect
                let deltaScroll = currentScroll - lastScroll
                lastScroll = currentScroll
                windVelocity = windVelocity * 0.8 + deltaScroll * 0.2

                // Subtly rotate background stars
                if (starParticles) {
                    starParticles.rotation.y += 0.0003
                    starParticles.rotation.x += 0.0001
                    starParticles.rotation.y += deltaScroll * 0.08
                }

                // Position items along the spiral
                meshes.forEach((mesh, i) => {
                    let offset = i / totalItems + currentScroll
                    offset = offset - Math.floor(offset) // Wrap between 0.0 and 1.0

                    // Edge fade calculation
                    let itemOpacity = 1.0
                    const fadeThreshold = props.edgeFadeStrength
                    if (fadeThreshold > 0.001) {
                        if (offset < fadeThreshold) {
                            itemOpacity = offset / fadeThreshold
                        } else if (offset > 1.0 - fadeThreshold) {
                            itemOpacity = (1.0 - offset) / fadeThreshold
                        }
                    }

                    const mat = mesh.material as THREE.ShaderMaterial
                    mat.uniforms.opacity.value = Math.sin(
                        itemOpacity * (Math.PI / 2)
                    )
                    mat.uniforms.wind.value =
                        windVelocity * props.windEffectStrength

                    // Apply spiral math for Y position and rotation
                    const y = (offset - 0.5) * props.spiralHeight
                    const theta = offset * Math.PI * 2 * props.revolutions

                    mesh.position.y = y
                    mesh.rotation.y = theta
                })

                renderer.render(scene, camera)
            }
            animationFrameId = requestAnimationFrame(render)
        }
        render()

        // ------------------------------------------
        // I. STRICT WEBGL CLEANUP (Prevents Hot-Reload Crashes)
        // ------------------------------------------
        return () => {
            cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            // Remove event listeners safely
            if (props.scrollMode === "Page Scroll") {
                window.removeEventListener("scroll", handlePageScroll)
            } else {
                const el = mountRef.current
                if (el) {
                    el.removeEventListener("wheel", handleWheel)
                    el.removeEventListener("touchstart", handleTouchStart)
                    el.removeEventListener("touchmove", handleTouchMove)
                    el.removeEventListener("touchend", handleTouchEnd)
                }
            }

            // CRITICAL GPU Memory Freeing Architecture
            scene.clear()
            geometriesToDispose.forEach((g) => g.dispose())
            materialsToDispose.forEach((m) => m.dispose())
            texturesToDispose.forEach((t) => t.dispose())

            // Stop and destroy background video elements
            videoElements.forEach((video) => {
                video.pause()
                video.removeAttribute("src")
                video.load()
            })

            renderer.forceContextLoss() // Required for Framer editor stability
            renderer.dispose()

            if (mountRef.current && renderer.domElement) {
                if (mountRef.current.contains(renderer.domElement)) {
                    mountRef.current.removeChild(renderer.domElement)
                }
            }
        }
    }, [
        props.mediaType,
        props.images,
        props.videos,
        props.imageCount,
        props.radius,
        props.itemWidth,
        props.itemHeight,
        props.borderRadius,
        props.spiralHeight,
        props.revolutions,
        props.poleFlare,
        props.cameraDistance,
        props.edgeFadeStrength,
        props.cinematicBackground,
        props.cinematicBgColor,
        props.cinematicBgOuterColor,
        props.brightness,
        props.contrast,
        props.saturation,
        props.scrollMode,
        props.scrollSensitivity,
        props.damping,
        props.autoPlay,
        props.autoPlaySpeed,
        props.windEffectStrength,
        props.livePreview,
    ])

    return (
        <div
            {...props}
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100, // Prevents 0x0px invisible mounting dot on canvas
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                cursor:
                    props.scrollMode === "Internal Wheel/Drag"
                        ? "grab"
                        : "auto",
                background: props.cinematicBackground
                    ? `radial-gradient(circle at center, ${props.cinematicBgColor} 0%, ${props.cinematicBgOuterColor} 100%)`
                    : "transparent",
                ...props.style, // Spreads Framer's incoming layout engine styles
            }}
        />
    )
}

// ==========================================
// 3. STEP 2: NESTED DEFAULT PROPS
// ==========================================
CinematicSpiralCarousel.defaultProps = {
    width: "100%",
    height: 400,
    livePreview: true,
    content: {
        mediaType: "Images",
        imageCount: 20,
        images: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1618005191295-d85c4779db35?q=80&w=2564&auto=format&fit=crop",
        ],
        videos: ["https://www.w3schools.com/html/mov_bbb.mp4"],
    },
    layout: {
        radius: 7.7,
        itemWidth: 6,
        itemHeight: 4,
        spiralHeight: 30,
        revolutions: 1.5,
        poleFlare: 0.028,
    },
    appearance: {
        borderRadius: 0.2,
        cameraDistance: 20,
        edgeFadeStrength: 0.5,
        cinematicBackground: false,
        cinematicBgColor: "#0b0c10",
        cinematicBgOuterColor: "#000000",
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
    },
    interaction: {
        scrollMode: "Internal Wheel/Drag",
        scrollSensitivity: 0.0004,
        damping: 0.01,
        autoPlay: false,
        autoPlaySpeed: 0.001,
        windEffectStrength: 0.5,
    },
}

// ==========================================
// 4. STEP 3: FRAMER PROPERTY CONTROLS
// ==========================================
addPropertyControls(CinematicSpiralCarousel, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        description: "Toggle 3D rendering in the editor to save battery.",
        defaultValue: true,
    },
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            mediaType: {
                type: ControlType.Enum,
                title: "Media Type",
                options: ["Images", "Videos"],
                defaultValue: "Images",
            },
            imageCount: {
                type: ControlType.Number,
                title: "Total Items",
                description: "Number of mesh items mapped onto the spiral.",
                min: 1,
                max: 100,
                step: 1,
            },
            images: {
                type: ControlType.Array,
                title: "Images",
                control: {
                    type: ControlType.Image,
                },
                hidden(props) {
                    return props.mediaType === "Videos"
                },
            },
            videos: {
                type: ControlType.Array,
                title: "Videos",
                control: {
                    type: ControlType.File,
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                hidden(props) {
                    return props.mediaType === "Images"
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout (3D)",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Pole Radius",
                unit: "px",
                min: 2,
                max: 30,
                step: 0.1,
            },
            itemWidth: {
                type: ControlType.Number,
                title: "Item Width",
                unit: "px",
                min: 1,
                max: 20,
                step: 0.1,
            },
            itemHeight: {
                type: ControlType.Number,
                title: "Item Height",
                unit: "px",
                min: 1,
                max: 20,
                step: 0.1,
            },
            spiralHeight: {
                type: ControlType.Number,
                title: "Spiral Height",
                unit: "px",
                min: 0,
                max: 60,
                step: 1,
            },
            revolutions: {
                type: ControlType.Number,
                title: "Revolutions",
                description: "How many wraps around the pole.",
                min: 0.5,
                max: 10,
                step: 0.1,
            },
            poleFlare: {
                type: ControlType.Number,
                title: "Pole Bend",
                description: "Bends the cylinder outward exponentially.",
                min: 0,
                max: 0.1,
                step: 0.001,
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            brightness: {
                type: ControlType.Number,
                title: "Brightness",
                min: 0,
                max: 3,
                step: 0.05,
                displayStepper: true,
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                min: 0,
                max: 3,
                step: 0.05,
                displayStepper: true,
            },
            saturation: {
                type: ControlType.Number,
                title: "Saturation",
                min: 0,
                max: 3,
                step: 0.05,
                displayStepper: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                unit: "px",
                min: 0,
                max: 2,
                step: 0.01,
            },
            cameraDistance: {
                type: ControlType.Number,
                title: "Camera Z",
                unit: "px",
                min: 5,
                max: 60,
                step: 1,
            },
            edgeFadeStrength: {
                type: ControlType.Number,
                title: "Edge Fade",
                unit: "%",
                description: "Fades items as they approach top/bottom.",
                min: 0,
                max: 1.0,
                step: 0.01,
            },
            cinematicBackground: {
                type: ControlType.Boolean,
                title: "4K Stars BG",
                description: "Enables particle stars and gradient backdrop.",
            },
            cinematicBgColor: {
                type: ControlType.Color,
                title: "Nebula Center",
                hidden(props) {
                    return !props.cinematicBackground
                },
            },
            cinematicBgOuterColor: {
                type: ControlType.Color,
                title: "Space & Stars",
                hidden(props) {
                    return !props.cinematicBackground
                },
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            scrollMode: {
                type: ControlType.Enum,
                title: "Scroll Logic",
                options: ["Page Scroll", "Internal Wheel/Drag"],
            },
            scrollSensitivity: {
                type: ControlType.Number,
                title: "Sensitivity",
                min: 0.0001,
                max: 0.02,
                step: 0.0001,
                displayStepper: true,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                description: "Lower is smoother, higher is more responsive.",
                min: 0.01,
                max: 1.0,
                step: 0.01,
            },
            autoPlay: {
                type: ControlType.Boolean,
                title: "Auto Play",
            },
            autoPlaySpeed: {
                type: ControlType.Number,
                title: "Auto Speed",
                min: 0,
                max: 0.05,
                step: 0.0001,
                hidden(props) {
                    return !props.autoPlay
                },
            },
            windEffectStrength: {
                type: ControlType.Number,
                title: "Wind Effect",
                description: "Deforms images based on scroll velocity.",
                min: 0,
                max: 5,
                step: 0.1,
            },
        },
    },
})
