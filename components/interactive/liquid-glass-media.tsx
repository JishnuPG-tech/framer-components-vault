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


// --- DEFAULT PROPS ---
// STEP 2: Nested Defaults mirroring the UI categorization
const defaultProps = {
    editorPreview: true,
    media: {
        mediaType: "Shader",
        image: "",
        videoUrl:
            "https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-2226-large.mp4",
    },
    styling: {
        color1: "#00000a",
        color2: "#0516c4",
        color3: "#00b7ff",
        color4: "#ffaa00",
    },
    layout: {
        fluteCount: 40,
        fluteAngle: 0,
        curvature: 0,
        fluteDirection: "None",
        fluteMoveSpeed: 0.5,
        speed: 0.2,
        refraction: 0.04,
        edgeRefraction: 0.02,
        chromaticAberration: 0.015,
        fluidScale: 1.5,
    },
}

export default function PremiumFlutedGlass(incomingProps) {
    // STEP 1: Intercept & Flatten Props
    const props = {
        ...defaultProps,
        ...incomingProps,
        ...(incomingProps.media || {}),
        ...(incomingProps.styling || {}),
        ...(incomingProps.layout || {}),
    }

    const mountRef = useRef(null)
    const isIntersecting = useRef(true)
    const propsRef = useRef(props)

    // Keep propsRef updated without triggering React re-renders in the animation loop
    useEffect(() => {
        propsRef.current = props
    }, [props])

    useEffect(() => {
        if (!mountRef.current) return

        let frameId
        const container = mountRef.current

        // 1. Scene Setup
        const scene = new THREE.Scene()

        // Orthographic Camera perfectly mapping the plane to the viewport
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const renderer = new THREE.WebGLRenderer({
            antialias: false, // Anti-aliasing handled mathematically in shader
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(container.clientWidth, container.clientHeight)
        container.appendChild(renderer.domElement)

        // Texture Loading Fundamentals
        const dummyTex = new THREE.DataTexture(
            new Uint8Array([0, 0, 0, 0]),
            1,
            1
        )
        dummyTex.needsUpdate = true

        const videoElement = document.createElement("video")
        videoElement.crossOrigin = "anonymous"
        videoElement.loop = true
        videoElement.muted = true
        videoElement.playsInline = true
        videoElement.autoplay = true

        let currentTexture = null
        let activeMedia = "Shader"
        let lastImageUrl = null
        let lastVideoUrl = null

        // 2. Uniforms
        const uniforms = {
            uTime: { value: 0 },
            uResolution: {
                value: new THREE.Vector2(
                    container.clientWidth,
                    container.clientHeight
                ),
            },
            // Media Uniforms
            uTexture: { value: dummyTex },
            uHasTexture: { value: 0.0 },
            uMediaResolution: { value: new THREE.Vector2(1, 1) },

            // Layout & Styling Uniforms
            uFluteCount: { value: propsRef.current.fluteCount },
            uFluteAngle: {
                value: propsRef.current.fluteAngle * (Math.PI / 180),
            },
            uCurvature: { value: propsRef.current.curvature },
            uFluteOffset: { value: 0 }, // For the movement flow
            uRefraction: { value: propsRef.current.refraction },
            uEdgeRefraction: {
                value: propsRef.current.edgeRefraction,
            },
            uChromaticAberration: {
                value: propsRef.current.chromaticAberration,
            },
            uFluidScale: { value: propsRef.current.fluidScale },
            uColor1: { value: new THREE.Color(propsRef.current.color1) },
            uColor2: { value: new THREE.Color(propsRef.current.color2) },
            uColor3: { value: new THREE.Color(propsRef.current.color3) },
            uColor4: { value: new THREE.Color(propsRef.current.color4) },
        }

        // 3. Shaders
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `

        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uResolution;
            
            // Media Uniforms
            uniform sampler2D uTexture;
            uniform float uHasTexture;
            uniform vec2 uMediaResolution;

            // Glass Uniforms
            uniform float uFluteCount;
            uniform float uFluteAngle;
            uniform float uCurvature;
            uniform float uFluteOffset;
            uniform float uRefraction;
            uniform float uEdgeRefraction;
            uniform float uChromaticAberration;
            uniform float uFluidScale;

            // Colors
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;

            varying vec2 vUv;

            const float PI = 3.14159265359;

            // --- Simplex 2D Noise ---
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ) );
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            // --- Background Object Cover Calculation ---
            vec2 getCoverUv(vec2 uv) {
                vec2 s = uResolution;
                vec2 t = uMediaResolution;
                float rs = s.x / s.y;
                float rt = t.x / t.y;
                vec2 newUv = uv;
                if (rs < rt) {
                    newUv.x = (uv.x - 0.5) * (rs / rt) + 0.5;
                } else {
                    newUv.y = (uv.y - 0.5) * (rt / rs) + 0.5;
                }
                return newUv;
            }

            // --- Background Generator / Fetcher ---
            vec3 getBackground(vec2 uv) {
                if (uHasTexture > 0.5) {
                    // Sample Texture
                    vec2 coverUv = getCoverUv(uv);
                    return texture2D(uTexture, fract(coverUv)).rgb;
                }

                // Fallback to Animated Shader
                float aspect = uResolution.x / uResolution.y;
                vec2 flowUv = uv;
                
                // Stretch noise horizontally to match layout aspect, compress vertically for tall sweeping strokes
                flowUv.x *= uFluidScale * aspect;
                flowUv.y *= uFluidScale * 0.25;

                float t = uTime;
                
                // Double-layered smooth noise. No dense warping, just smooth ambient movement
                float n1 = snoise(flowUv + vec2(t * 0.15, t * 0.2));
                float n2 = snoise(flowUv * 1.5 + vec2(-t * 0.1, t * 0.15));
                float finalNoise = (n1 * 0.65) + (n2 * 0.35);

                vec3 color = uColor1;
                color = mix(color, uColor2, smoothstep(-0.6, -0.1, finalNoise));
                color = mix(color, uColor3, smoothstep(-0.1, 0.4, finalNoise));
                color = mix(color, uColor4, smoothstep(0.3, 0.9, finalNoise));
                
                return color;
            }

            void main() {
                // 1. Precise Flute Mapping with Aspect-Aware Rotation & Curvature
                float aspect = uResolution.x / uResolution.y;
                vec2 centeredUv = vUv - 0.5;
                vec2 aspectUv = vec2(centeredUv.x * aspect, centeredUv.y);

                float cosA = cos(uFluteAngle);
                float sinA = sin(uFluteAngle);
                mat2 rot = mat2(cosA, -sinA, sinA, cosA);
                vec2 rotatedUv = rot * aspectUv;

                // Map straight vs circular coordinates
                float linearCoord = rotatedUv.x / aspect;
                float circleCoord = length(aspectUv) / aspect;
                float blendedCoord = mix(linearCoord, circleCoord, uCurvature);

                // fluteCoord mapped so the physical width remains constant regardless of shape
                float fluteCoord = blendedCoord * uFluteCount + uFluteOffset;
                float fluteUv = fract(fluteCoord); // 0.0 to 1.0 across single flute
                float fx = fluteUv * 2.0 - 1.0;    // -1.0 to 1.0 across single flute
                
                // 2. Accurate Glass Curvature (Convex half-cylinder)
                float normalX = sin(fx * PI * 0.5); // Smooth arc from -1 to 1

                // 3. Chromatic Aberration, Refraction & Edge Refraction
                float refStrength = normalX * uRefraction;
                
                // Edge Refraction (Intensifies light bend specifically at the flute grooves)
                float edgeBend = pow(abs(fx), 3.0) * sign(fx) * uEdgeRefraction;
                refStrength += edgeBend;

                // Gradient direction for accurate refraction bending
                vec2 linearDir = vec2(cosA, sinA);
                // add a tiny offset to avoid div by 0 at perfect center
                vec2 radialDir = normalize(aspectUv + vec2(0.00001, 0.0)); 
                vec2 refDir = normalize(mix(linearDir, radialDir, uCurvature));

                // RGB split mapping directed by the refDir
                vec2 uvOffsetR = refDir * (refStrength * (1.0 + uChromaticAberration));
                vec2 uvOffsetG = refDir * (refStrength * 1.0);
                vec2 uvOffsetB = refDir * (refStrength * (1.0 - uChromaticAberration));
                
                // Correct displacement for uniform appearance regardless of container proportions
                uvOffsetR.x /= aspect;
                uvOffsetG.x /= aspect;
                uvOffsetB.x /= aspect;

                vec2 uvR = vUv + uvOffsetR;
                vec2 uvG = vUv + uvOffsetG;
                vec2 uvB = vUv + uvOffsetB;

                // Fetch separated color channels
                vec3 colR = getBackground(uvR);
                vec3 colG = getBackground(uvG);
                vec3 colB = getBackground(uvB);
                vec3 baseColor = vec3(colR.r, colG.g, colB.b);

                // 4. Pure Liquid Refraction (No artificial shading or white highlights)
                vec3 finalColor = baseColor;

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `

        // 4. Mesh
        const geometry = new THREE.PlaneGeometry(2, 2)
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            depthWrite: false,
            depthTest: false,
        })
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // 5. Resizing
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries.length) return
            const { width, height } = entries[0].contentRect
            renderer.setSize(width, height)
            uniforms.uResolution.value.set(width, height)
        })
        resizeObserver.observe(container)

        // 6. Viewport Optimization
        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isIntersecting.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(container)

        // 7. Animation Loop
        const render = () => {
            frameId = requestAnimationFrame(render)

            // Editor Preview Toggle
            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !propsRef.current.editorPreview) return

            // Viewport Gating
            if (!isIntersecting.current && !inEditor) return

            const currentProps = propsRef.current

            // 7a. Dynamic Media Handling Logic
            if (currentProps.mediaType === "Image") {
                if (lastImageUrl !== currentProps.image) {
                    lastImageUrl = currentProps.image
                    if (currentProps.image) {
                        new THREE.TextureLoader().load(
                            currentProps.image,
                            (tex) => {
                                if (
                                    currentTexture &&
                                    currentTexture !== dummyTex
                                ) {
                                    currentTexture.dispose()
                                }
                                currentTexture = tex
                                currentTexture.colorSpace = THREE.SRGBColorSpace
                                uniforms.uTexture.value = currentTexture
                                uniforms.uMediaResolution.value.set(
                                    tex.image.width,
                                    tex.image.height
                                )
                                uniforms.uHasTexture.value = 1.0
                            }
                        )
                    } else {
                        uniforms.uHasTexture.value = 0.0
                    }
                }
                if (activeMedia !== "Image" && currentTexture) {
                    uniforms.uHasTexture.value = 1.0
                    if (videoElement.readyState >= 2) videoElement.pause()
                }
                activeMedia = "Image"
            } else if (currentProps.mediaType === "Video") {
                if (lastVideoUrl !== currentProps.videoUrl) {
                    lastVideoUrl = currentProps.videoUrl
                    if (currentProps.videoUrl) {
                        videoElement.src = currentProps.videoUrl
                        videoElement
                            .play()
                            .then(() => {
                                if (
                                    currentTexture &&
                                    currentTexture !== dummyTex
                                ) {
                                    currentTexture.dispose()
                                }
                                currentTexture = new THREE.VideoTexture(
                                    videoElement
                                )
                                currentTexture.colorSpace = THREE.SRGBColorSpace
                                uniforms.uTexture.value = currentTexture
                                uniforms.uMediaResolution.value.set(
                                    videoElement.videoWidth,
                                    videoElement.videoHeight
                                )
                                uniforms.uHasTexture.value = 1.0
                            })
                            .catch((e) =>
                                console.log(
                                    "Video setup pending user interaction."
                                )
                            )
                    } else {
                        uniforms.uHasTexture.value = 0.0
                    }
                } else if (activeMedia !== "Video") {
                    if (videoElement.src) {
                        videoElement.play().catch(() => {})
                        if (currentTexture) uniforms.uHasTexture.value = 1.0
                    }
                }
                // Continuously check for video resolution in case it loads slowly
                if (videoElement.readyState >= 2 && currentTexture) {
                    uniforms.uMediaResolution.value.set(
                        videoElement.videoWidth,
                        videoElement.videoHeight
                    )
                }
                activeMedia = "Video"
            } else {
                if (activeMedia !== "Shader") {
                    uniforms.uHasTexture.value = 0.0
                    videoElement.pause()
                }
                activeMedia = "Shader"
            }

            // 7b. Sync uniforms to props safely

            // Handle flute flow direction & offset accumulation
            let directionMultiplier = 0
            if (currentProps.fluteDirection === "Left to Right")
                directionMultiplier = -1
            if (currentProps.fluteDirection === "Right to Left")
                directionMultiplier = 1

            let offsetDelta =
                0.01 * currentProps.fluteMoveSpeed * directionMultiplier
            // Keep the value safely between 0 and 1 to prevent float precision breakdown
            uniforms.uFluteOffset.value =
                (uniforms.uFluteOffset.value + offsetDelta) % 1.0
            if (uniforms.uFluteOffset.value < 0)
                uniforms.uFluteOffset.value += 1.0

            uniforms.uTime.value += 0.01 * currentProps.speed
            uniforms.uFluteCount.value = currentProps.fluteCount
            uniforms.uFluteAngle.value =
                currentProps.fluteAngle * (Math.PI / 180)
            uniforms.uCurvature.value = currentProps.curvature
            uniforms.uRefraction.value = currentProps.refraction
            uniforms.uEdgeRefraction.value = currentProps.edgeRefraction
            uniforms.uChromaticAberration.value =
                currentProps.chromaticAberration
            uniforms.uFluidScale.value = currentProps.fluidScale
            uniforms.uColor1.value.set(currentProps.color1)
            uniforms.uColor2.value.set(currentProps.color2)
            uniforms.uColor3.value.set(currentProps.color3)
            uniforms.uColor4.value.set(currentProps.color4)

            renderer.render(scene, camera)
        }
        render()

        // 8. Strict WebGL Cleanup
        return () => {
            cancelAnimationFrame(frameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            geometry.dispose()
            material.dispose()

            if (currentTexture && currentTexture !== dummyTex) {
                currentTexture.dispose()
            }
            dummyTex.dispose()

            videoElement.pause()
            videoElement.src = ""
            videoElement.load()
            videoElement.remove()

            // Crucial for Framer stability
            renderer.forceContextLoss()
            renderer.dispose()

            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [])

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

// STEP 2 & 3: Nested Defaults & UI Categorization
PremiumFlutedGlass.defaultProps = defaultProps

addPropertyControls(PremiumFlutedGlass, {
    editorPreview: {
        title: "Preview",
        type: ControlType.Boolean,
        defaultValue: true,
        description: "Toggle active preview mode inside the Framer canvas.",
    },
    media: {
        title: "Background Media",
        type: ControlType.Object,
        controls: {
            mediaType: {
                title: "Media Type",
                type: ControlType.Enum,
                options: ["Shader", "Image", "Video"],
                optionTitles: ["Animated Shader", "Static Image", "Video File"],
                description: "Select what is rendered behind the glass.",
            },
            image: {
                title: "Upload Image",
                type: ControlType.Image,
                hidden: (props) => props.mediaType !== "Image",
                description: "The static image to display behind the glass.",
            },
            videoUrl: {
                title: "Upload Video",
                type: ControlType.File,
                allowedFileTypes: ["mp4", "webm", "mov"],
                hidden: (props) => props.mediaType !== "Video",
                description: "Upload a video file to display behind the glass.",
            },
        },
    },
    styling: {
        title: "Shader Styling",
        type: ControlType.Object,
        controls: {
            color1: { type: ControlType.Color, title: "Deep Base" },
            color2: { type: ControlType.Color, title: "Ambient Blue" },
            color3: { type: ControlType.Color, title: "Bright Cyan" },
            color4: { type: ControlType.Color, title: "Warm Yellow" },
        },
    },
    layout: {
        title: "Optical Glass Settings",
        type: ControlType.Object,
        controls: {
            fluteCount: {
                type: ControlType.Number,
                title: "Glass Flutes (Count)",
                min: 5,
                max: 150,
                step: 1,
                description: "Total amount of vertical glass ridges across.",
            },
            fluteAngle: {
                type: ControlType.Number,
                title: "Flute Angle",
                min: -180,
                max: 180,
                step: 1,
                description: "Rotate the angle of the glass flutes in degrees.",
            },
            curvature: {
                type: ControlType.Number,
                title: "Curvature",
                min: 0,
                max: 1,
                step: 0.01,
                description:
                    "Curve the straight flutes into perfect concentric circles.",
            },
            fluteDirection: {
                type: ControlType.Enum,
                title: "Flute Flow",
                options: ["None", "Left to Right", "Right to Left"],
                description:
                    "Animate the direction the flutes travel over time.",
            },
            fluteMoveSpeed: {
                type: ControlType.Number,
                title: "Flow Speed",
                min: 0.1,
                max: 5,
                step: 0.1,
                description:
                    "The speed at which the flutes animate across the glass.",
                hidden: (props) => props.fluteDirection === "None",
            },
            speed: {
                type: ControlType.Number,
                title: "Ambient Speed",
                min: 0,
                max: 2,
                step: 0.1,
                description:
                    "Speed multiplier for the background shader animation.",
            },
            refraction: {
                type: ControlType.Number,
                title: "Lens Bend (%)",
                min: 0,
                max: 0.1,
                step: 0.01,
                description:
                    "How sharply the glass bends the background light.",
            },
            edgeRefraction: {
                type: ControlType.Number,
                title: "Edge Refraction",
                min: 0,
                max: 0.2,
                step: 0.005,
                description:
                    "Intensifies the light bending at the sharp crevices between the flutes.",
            },
            chromaticAberration: {
                type: ControlType.Number,
                title: "RGB Split (px)",
                min: 0,
                max: 0.1,
                step: 0.005,
                description:
                    "Amount of color separation seen at extreme glass angles.",
            },
            fluidScale: {
                type: ControlType.Number,
                title: "Ambient Scale",
                min: 0.5,
                max: 5,
                step: 0.1,
                description: "Scale of the procedural animated shader pattern.",
            },
        },
    },
})
