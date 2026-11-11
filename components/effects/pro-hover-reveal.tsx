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


export default function RevealLensHover(incomingProps) {
    // STEP 1: Intercept & Flatten (Framer Prop-Flattening Rule)
    const props = {
        ...incomingProps,
        ...(incomingProps.maskSettings || {}),
        ...(incomingProps.lensSettings || {}),
    }

    const isStatic = useIsStaticRenderer()
    const propsRef = useRef(props)
    const mountRef = useRef(null)

    // Keep propsRef fresh without triggering WebGL rebuilds
    useEffect(() => {
        propsRef.current = props
    }, [props])

    useEffect(() => {
        // Skip WebGL initialization entirely if rendering in a static context (Framer Canvas / Export)
        if (isStatic) return

        const container = mountRef.current
        if (!container) return

        let frameId
        let isIntersecting = true

        // 1. Core Scene Setup
        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        // --- COLOR FIX: Prevent WebGL from altering original image colors ---
        // By forcing linear output, we stop Three.js from applying unwanted gamma/sRGB shifts.
        if (THREE.LinearSRGBColorSpace !== undefined) {
            renderer.outputColorSpace = THREE.LinearSRGBColorSpace
        } else if (THREE.LinearEncoding !== undefined) {
            renderer.outputEncoding = THREE.LinearEncoding
        }

        container.appendChild(renderer.domElement)

        // 2. Uniforms & Shader Material
        const uniforms = {
            uImageTop: { value: null },
            uImageBg: { value: null },
            uResolution: { value: new THREE.Vector2() },
            uTopSize: { value: new THREE.Vector2() },
            uBgSize: { value: new THREE.Vector2() },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uHoverState: { value: 0.0 },
            uRadius: { value: 0.0 },
            uSoftness: { value: 0.0 },
            uLensEnable: { value: false },
            uLensIntensity: { value: 0.0 },
        }

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `

        const fragmentShader = `
            uniform sampler2D uImageTop;
            uniform sampler2D uImageBg;
            uniform vec2 uResolution;
            uniform vec2 uTopSize;
            uniform vec2 uBgSize;

            uniform vec2 uMouse;
            uniform float uHoverState;
            
            uniform float uRadius; 
            uniform float uSoftness;
            
            uniform bool uLensEnable;
            uniform float uLensIntensity;

            varying vec2 vUv;

            // Object-fit: cover logic for WebGL textures
            vec2 getCoverUv(vec2 uv, vec2 texSize, vec2 res) {
                vec2 ratio = res / texSize;
                float minRatio = max(ratio.x, ratio.y);
                vec2 newSize = texSize * minRatio;
                vec2 offset = (newSize - res) / 2.0;
                return (uv * res + offset) / newSize;
            }

            void main() {
                vec2 topSize = uTopSize.x > 0.0 ? uTopSize : vec2(1.0);
                vec2 bgSize  = uBgSize.x  > 0.0 ? uBgSize  : vec2(1.0);

                // Correct aspect ratio for perfect circle distance
                vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
                if (uResolution.y > uResolution.x) {
                    aspect = vec2(1.0, uResolution.y / uResolution.x);
                }
                
                vec2 p = (vUv - 0.5) * aspect;
                vec2 m = (uMouse - 0.5) * aspect;
                vec2 delta = p - m;
                float dist = length(delta);
                
                float currentRadius = uRadius * uHoverState;
                vec2 distortedUV = vUv;

                // Bulge / Lens Effect
                if (uLensEnable && uHoverState > 0.01) {
                    if (dist < currentRadius) {
                        float percent = dist / max(currentRadius, 0.001);
                        
                        // Smoothly transition the distortion factor so it seamlessly meets the edge
                        float bulgeFactor = smoothstep(1.0, 0.0, percent) * uLensIntensity;
                        
                        // Pull UVs towards the mouse to create a magnification/bulge effect
                        vec2 uvDelta = vUv - uMouse;
                        distortedUV = vUv - uvDelta * bulgeFactor;
                    }
                }

                vec2 uvTop = getCoverUv(vUv, topSize, uResolution);
                
                // Apply the distorted UV to the revealed background image for the lens effect
                vec2 uvBg  = getCoverUv(distortedUV, bgSize, uResolution);

                vec4 colorTop = uTopSize.x > 0.0 ? texture2D(uImageTop, uvTop) : vec4(0.0);
                vec4 colorBg  = uBgSize.x > 0.0 ? texture2D(uImageBg, uvBg) : vec4(0.0);

                // Progressive soft edges
                float soft = max(uSoftness, 0.001); 
                
                // 1.0 = Revealed (Inside), 0.0 = Hidden (Outside)
                float mask = 1.0 - smoothstep(currentRadius - soft, currentRadius + soft, dist);
                
                // Mix: Top image is visible by default, BG image revealed by mask
                gl_FragColor = mix(colorTop, colorBg, mask);
            }
        `

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            transparent: true,
        })
        const geometry = new THREE.PlaneGeometry(2, 2)
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // 3. Mouse Tracking & Interaction
        const targetMouse = new THREE.Vector2(0.5, 0.5)
        let targetHover = 0.0
        const currentMouse = new THREE.Vector2(0.5, 0.5)
        let currentHover = 0.0

        const updateMouse = (clientX, clientY) => {
            const rect = container.getBoundingClientRect()
            const x = (clientX - rect.left) / rect.width
            const y = 1.0 - (clientY - rect.top) / rect.height
            targetMouse.set(x, y)
            targetHover = 1.0
        }

        const onMouseMove = (e) => updateMouse(e.clientX, e.clientY)
        const onTouchMove = (e) => {
            if (e.touches.length > 0) {
                updateMouse(e.touches[0].clientX, e.touches[0].clientY)
            }
        }
        const onMouseLeave = () => (targetHover = 0.0)

        container.addEventListener("mousemove", onMouseMove)
        container.addEventListener("mouseleave", onMouseLeave)
        container.addEventListener("touchstart", onTouchMove, { passive: true })
        container.addEventListener("touchmove", onTouchMove, { passive: true })
        container.addEventListener("touchend", onMouseLeave)

        // 4. Responsive Sizing
        const resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect
            renderer.setSize(width, height)
            uniforms.uResolution.value.set(width, height)
        })
        resizeObserver.observe(container)

        // 5. Viewport Rendering Optimization
        const intersectionObserver = new IntersectionObserver((entries) => {
            isIntersecting = entries[0].isIntersecting
        })
        intersectionObserver.observe(container)

        // 6. Texture Loading Pipeline
        const textureLoader = new THREE.TextureLoader()
        let currentTopUrl = null
        let currentBgUrl = null
        let topTexture = null
        let bgTexture = null

        const loadTexture = (url, isTop) => {
            if (!url) return
            textureLoader.load(url, (tex) => {
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.generateMipmaps = false

                // --- COLOR FIX: Force raw pixel passthrough for exact original colors ---
                // This stops WebGL from pre-decoding colors, ensuring 100% accuracy.
                if (THREE.NoColorSpace !== undefined) {
                    tex.colorSpace = THREE.NoColorSpace
                } else if (THREE.LinearEncoding !== undefined) {
                    tex.encoding = THREE.LinearEncoding
                }

                if (isTop) {
                    if (topTexture) topTexture.dispose()
                    topTexture = tex
                    uniforms.uImageTop.value = topTexture
                    uniforms.uTopSize.value.set(
                        tex.image.width,
                        tex.image.height
                    )
                } else {
                    if (bgTexture) bgTexture.dispose()
                    bgTexture = tex
                    uniforms.uImageBg.value = bgTexture
                    uniforms.uBgSize.value.set(
                        tex.image.width,
                        tex.image.height
                    )
                }
            })
        }

        // 7. Render Loop
        const animate = () => {
            frameId = requestAnimationFrame(animate)

            // Pause if scrolled out of view
            if (!isIntersecting) return

            // Pause if in Editor and preview is disabled
            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !propsRef.current.editorPreview) return

            const p = propsRef.current

            // Check if URLs changed and load textures asynchronously
            if (p.topImage !== currentTopUrl) {
                currentTopUrl = p.topImage
                loadTexture(currentTopUrl, true)
            }
            if (p.bgImage !== currentBgUrl) {
                currentBgUrl = p.bgImage
                loadTexture(currentBgUrl, false)
            }

            // Sync uniforms directly from props
            uniforms.uRadius.value = p.radius / 100.0
            uniforms.uSoftness.value = p.softness / 100.0
            uniforms.uLensEnable.value = p.enableLens
            uniforms.uLensIntensity.value = p.lensIntensity / 100.0 // Map 0-100 to 0.0-1.0

            // Smooth Interpolations
            currentMouse.lerp(targetMouse, 0.1)
            currentHover += (targetHover - currentHover) * 0.1

            uniforms.uMouse.value.copy(currentMouse)
            uniforms.uHoverState.value = currentHover

            renderer.render(scene, camera)
        }
        animate()

        // 8. STRICT WEBGL CLEANUP (Prevents Hot-Reload Crashes)
        return () => {
            cancelAnimationFrame(frameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            container.removeEventListener("mousemove", onMouseMove)
            container.removeEventListener("mouseleave", onMouseLeave)
            container.removeEventListener("touchstart", onTouchMove)
            container.removeEventListener("touchmove", onTouchMove)
            container.removeEventListener("touchend", onMouseLeave)

            // Deep dispose of assets
            geometry.dispose()
            material.dispose()
            if (topTexture) topTexture.dispose()
            if (bgTexture) bgTexture.dispose()

            // Force GPU memory free and destroy context
            renderer.forceContextLoss()
            renderer.dispose()
            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [isStatic]) // Added isStatic dependency to effect array

    // If static renderer (e.g. exporting or optimizing in canvas), display a static fallback preview
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 100,
                    minHeight: 100,
                    position: "relative",
                    overflow: "hidden",
                    backgroundImage: `url(${props.topImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    ...props.style,
                }}
            />
        )
    }

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                ...props.style,
            }}
        />
    )
}

// STEP 2: Nested Defaults
RevealLensHover.defaultProps = {
    editorPreview: true,
    topImage:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop",
    bgImage:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop",
    maskSettings: {
        radius: 35,
        softness: 25,
    },
    lensSettings: {
        enableLens: true,
        lensIntensity: 50,
    },
}

// STEP 3: UI Categorization
addPropertyControls(RevealLensHover, {
    editorPreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Toggle active preview in the Framer editor.",
    },
    topImage: {
        type: ControlType.Image,
        title: "Top Image",
        description: "The image shown by default.",
    },
    bgImage: {
        type: ControlType.Image,
        title: "Reveal Image",
        description: "The image revealed on hover.",
    },
    maskSettings: {
        type: ControlType.Object,
        title: "Mask Detail",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 100,
                defaultValue: 35,
                unit: "%",
                displayStepper: true,
                description: "Size of the reveal mask.",
            },
            softness: {
                type: ControlType.Number,
                title: "Softness",
                min: 0,
                max: 100,
                defaultValue: 25,
                unit: "%",
                displayStepper: true,
                description: "Feathering on the edges.",
            },
        },
    },
    lensSettings: {
        type: ControlType.Object,
        title: "Lens / Bulge",
        controls: {
            enableLens: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
                description: "Turn magnification bulge on/off.",
            },
            lensIntensity: {
                type: ControlType.Number,
                title: "Intensity",
                min: 0,
                max: 100,
                defaultValue: 50,
                unit: "%",
                displayStepper: true,
                description: "Strength of the magnification.",
            },
        },
    },
})
