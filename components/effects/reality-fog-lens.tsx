import * as React from "react"
import { useEffect, useRef, useState } from "react"
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


// --- Shaders ---
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    uniform sampler2D u_texture;
    uniform vec2 u_mouse;
    uniform vec2 u_resolution;
    uniform vec2 u_texResolution;
    uniform float u_time;
    uniform float u_velocity;
    uniform float u_hoverSize;
    uniform float u_hoverSoftness;

    varying vec2 vUv;

    // Simplex 3D Noise function for organic warping
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 1.0/7.0;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    // Function to handle CSS-like 'background-size: cover' for the texture
    vec2 getCoverUv(vec2 uv, vec2 resolution, vec2 texResolution) {
        vec2 ratio = vec2(
            min((resolution.x / resolution.y) / (texResolution.x / texResolution.y), 1.0),
            min((resolution.y / resolution.x) / (texResolution.y / texResolution.x), 1.0)
        );
        return vec2(
            uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            uv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );
    }

    void main() {
        // Corrected UV for image cover
        vec2 baseUv = getCoverUv(vUv, u_resolution, u_texResolution);
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        
        // Noise generation for water/refraction effect
        float n1 = snoise(vec3(vUv * 3.0, u_time * 0.5));
        float n2 = snoise(vec3(vUv * 4.0 + 10.0, u_time * 0.6));

        // 1. Calculate spotlight & boundary warping
        vec2 mousePos = u_mouse * aspect;
        vec2 uvPos = vUv * aspect;
        
        float warpAmount = n1 * (u_velocity * 1.5 + 0.01);
        float dist = distance(uvPos, mousePos) + warpAmount;

        // Create the spotlight mask
        float radius = u_hoverSize;
        float softness = u_hoverSoftness + (u_velocity * 0.2); 
        float mask = 1.0 - smoothstep(radius - softness, radius + softness, dist);

        // 2. Refract the raw image inside the boundary based on velocity
        vec2 refractedUv = baseUv;
        float edgeRing = smoothstep(radius + 0.1, radius, dist) * smoothstep(radius - 0.2, radius, dist);
        vec2 distortion = vec2(n1, n2) * edgeRing * u_velocity * 0.5;
        refractedUv += distortion;

        // Sample the photorealistic raw image
        vec4 rawColor = texture2D(u_texture, refractedUv);
        rawColor.rgb = pow(rawColor.rgb, vec3(0.9)); 

        // 3. Generate the Wireframe/Vector effect
        vec2 texel = vec2(1.0) / u_resolution;
        
        vec3 cL = texture2D(u_texture, baseUv + vec2(-texel.x, 0.0) * 1.5).rgb;
        vec3 cR = texture2D(u_texture, baseUv + vec2(texel.x, 0.0) * 1.5).rgb;
        vec3 cU = texture2D(u_texture, baseUv + vec2(0.0, -texel.y) * 1.5).rgb;
        vec3 cD = texture2D(u_texture, baseUv + vec2(0.0, texel.y) * 1.5).rgb;
        
        float edge = length(abs(cL - cR) + abs(cU - cD));
        edge = smoothstep(0.08, 0.3, edge); 

        // Generate topographical/architectural grid lines
        float gridDensity = 30.0;
        float gridX = smoothstep(0.96, 1.0, fract(vUv.x * gridDensity * aspect.x));
        float gridY = smoothstep(0.96, 1.0, fract(vUv.y * gridDensity * aspect.y));
        float grid = max(gridX, gridY) * 0.15;

        // Wireframe styling
        vec3 darkBg = vec3(0.04, 0.05, 0.06); 
        vec3 wireColor = vec3(0.6, 0.7, 0.8); 
        
        vec3 wireframeRender = mix(darkBg, wireColor, edge);
        wireframeRender += vec3(grid) * (1.0 - edge); 

        // 4. Final Composite
        vec3 finalColor = mix(wireframeRender, rawColor.rgb, mask);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`

// --- Framer Component ---
export default function Reality_Fog_Lens(props) {
    const mountRef = useRef<HTMLDivElement>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [bounds, setBounds] = useState({ width: 800, height: 800 })

    // Track latest props for the animation loop without triggering re-renders
    const propsRef = useRef(props)
    useEffect(() => {
        propsRef.current = props
    }, [props])

    useEffect(() => {
        if (!mountRef.current) return

        const container = mountRef.current
        let animationFrameId: number

        // Three.js Setup
        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        })

        // Initial setup (strictly use container dimensions to avoid Framer's IDE window size)
        const initialWidth = container.clientWidth || 390
        const initialHeight = container.clientHeight || 800
        setBounds({ width: initialWidth, height: initialHeight })

        renderer.setSize(initialWidth, initialHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(renderer.domElement)

        // Shader Material & Uniforms
        const uniforms = {
            u_texture: { type: "t", value: null },
            u_mouse: { type: "v2", value: new THREE.Vector2(0.5, 0.5) },
            u_resolution: {
                type: "v2",
                value: new THREE.Vector2(initialWidth, initialHeight),
            },
            u_texResolution: { type: "v2", value: new THREE.Vector2(1, 1) },
            u_time: { type: "f", value: 0.0 },
            u_velocity: { type: "f", value: 0.0 },
            u_hoverSize: { type: "f", value: propsRef.current.hoverSize },
            u_hoverSoftness: {
                type: "f",
                value: propsRef.current.hoverSoftness,
            },
        }

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            depthWrite: false,
            depthTest: false,
        })

        const geometry = new THREE.PlaneGeometry(2, 2)
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // Load Texture
        const textureLoader = new THREE.TextureLoader()
        const imageToLoad =
            props.imageUrl ||
            "https://images.unsplash.com/photo-1541845157-a6d2d100c931?q=80&w=2560&auto=format&fit=crop"

        let activeTexture: THREE.Texture | null = null

        textureLoader.load(imageToLoad, (texture) => {
            texture.minFilter = THREE.LinearFilter
            texture.generateMipmaps = false
            activeTexture = texture

            uniforms.u_texture.value = texture
            uniforms.u_texResolution.value.set(
                texture.image.width,
                texture.image.height
            )
            setIsLoaded(true)
        })

        // Mouse & Velocity Tracking
        let targetMouse = new THREE.Vector2(0.5, 0.5)
        let currentMouse = new THREE.Vector2(0.5, 0.5)
        let currentVelocity = 0
        let targetVelocity = 0

        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            const rect = container.getBoundingClientRect()
            let clientX, clientY

            if ("touches" in e) {
                if (e.touches.length === 0) return
                clientX = e.touches[0].clientX
                clientY = e.touches[0].clientY
            } else {
                clientX = e.clientX
                clientY = e.clientY
            }

            // Calculate relative to the component bounds (safe against 0 division)
            if (rect.width > 0 && rect.height > 0) {
                targetMouse.x = (clientX - rect.left) / rect.width
                targetMouse.y = 1.0 - (clientY - rect.top) / rect.height
            }
        }

        window.addEventListener("mousemove", handlePointerMove)
        window.addEventListener("touchmove", handlePointerMove, {
            passive: true,
        })

        // Robust Resize Handling for Mobile & Framer Breakpoints
        const updateSize = () => {
            if (!container) return
            // Explicitly read container width, NOT window.innerWidth (which breaks in Framer editor)
            const width = container.clientWidth
            const height = container.clientHeight

            if (width > 0 && height > 0) {
                renderer.setSize(width, height)
                uniforms.u_resolution.value.set(width, height)
                setBounds({ width, height })
            }
        }

        // Use both ResizeObserver and window resize listener for max mobile reliability
        const resizeObserver = new ResizeObserver(() => {
            updateSize()
        })
        resizeObserver.observe(container)
        window.addEventListener("resize", updateSize)

        // Animation Loop
        const clock = new THREE.Clock()

        function animate() {
            animationFrameId = requestAnimationFrame(animate)

            const elapsedTime = clock.getElapsedTime()

            // Smooth mouse interpolation (Lerp)
            const dx = targetMouse.x - currentMouse.x
            const dy = targetMouse.y - currentMouse.y

            currentMouse.x += dx * 0.15
            currentMouse.y += dy * 0.15

            // Calculate raw mouse velocity
            targetVelocity = Math.sqrt(dx * dx + dy * dy)

            // Smooth out the velocity reading
            currentVelocity += (targetVelocity - currentVelocity) * 0.1

            // Update Uniforms
            uniforms.u_time.value = elapsedTime
            uniforms.u_mouse.value.copy(currentMouse)
            uniforms.u_velocity.value = currentVelocity
            uniforms.u_hoverSize.value = propsRef.current.hoverSize
            uniforms.u_hoverSoftness.value = propsRef.current.hoverSoftness

            renderer.render(scene, camera)
        }

        animate()

        // Cleanup
        return () => {
            window.removeEventListener("mousemove", handlePointerMove)
            window.removeEventListener("touchmove", handlePointerMove)
            window.removeEventListener("resize", updateSize)
            resizeObserver.disconnect()
            cancelAnimationFrame(animationFrameId)

            // Dispose ThreeJS resources to prevent memory leaks in Framer UI
            if (activeTexture) activeTexture.dispose()
            geometry.dispose()
            material.dispose()
            renderer.dispose()
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [props.imageUrl]) // Re-run effect if image URL changes via Framer props

    // Calculate dynamic responsiveness based purely on the component's actual width
    const isMobile = bounds.width < 450

    return (
        <div style={styles.wrapper}>
            {/* Loading State */}
            <div style={{ ...styles.loader, opacity: isLoaded ? 0 : 1 }}>
                INITIALIZING REALITY LENS...
            </div>

            {/* Three.js Canvas Mount */}
            <div ref={mountRef} style={styles.canvasContainer} />

            {/* Interactive UI Overlay */}
            {props.showUI && (
                <div
                    style={{
                        ...styles.uiLayer,
                        padding: `${Math.max(20, bounds.width * 0.06)}px`,
                    }}
                >
                    <div
                        style={{
                            ...styles.heroContent,
                            marginBottom: `${Math.max(30, bounds.height * 0.08)}px`,
                        }}
                    >
                        <h1
                            style={{
                                ...styles.title,
                                // Dynamically scale font directly against component bounds, maxed out cleanly
                                fontSize: `clamp(2rem, ${bounds.width * 0.18}px, 8rem)`,
                            }}
                            dangerouslySetInnerHTML={{
                                __html: props.titleText.replace(/\n/g, "<br/>"),
                            }}
                        />
                        <p
                            style={{
                                ...styles.subtitle,
                                fontSize: `clamp(0.85rem, ${bounds.width * 0.045}px, 1.15rem)`,
                            }}
                        >
                            {props.subtitleText}
                        </p>
                    </div>

                    <footer
                        style={{
                            ...styles.footer,
                            // Stack vertically on narrow devices so text isn't cramped
                            flexDirection: isMobile ? "column" : "row",
                            alignItems: isMobile ? "flex-start" : "flex-end",
                            gap: isMobile ? "0.75rem" : "1rem",
                        }}
                    >
                        <div>{props.footerLeft}</div>
                        <div>{props.footerRight}</div>
                    </footer>
                </div>
            )}
        </div>
    )
}

// --- Default Props & Framer Controls ---
Reality_Fog_Lens.defaultProps = {
    imageUrl:
        "https://images.unsplash.com/photo-1541845157-a6d2d100c931?q=80&w=2560&auto=format&fit=crop",
    showUI: true,
    titleText: "The Raw\nReality",
    subtitleText:
        "Interact to shatter the framework. Experience the unfiltered, high-end textures hidden beneath the structural grid.",
    footerLeft: "FW // 2026",
    footerRight: "Move cursor rapidly to induce focal refraction",
    hoverSize: 0.22,
    hoverSoftness: 0.15,
}

// Framer property controls integrated for UI editing
addPropertyControls(Reality_Fog_Lens, {
    imageUrl: {
        type: ControlType.Image,
        title: "Background Image",
    },
    showUI: {
        type: ControlType.Boolean,
        title: "Show UI",
        defaultValue: true,
    },
    titleText: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "The Raw\nReality",
        displayTextArea: true,
        hidden(props) {
            return !props.showUI
        },
    },
    subtitleText: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue:
            "Interact to shatter the framework. Experience the unfiltered, high-end textures hidden beneath the structural grid.",
        displayTextArea: true,
        hidden(props) {
            return !props.showUI
        },
    },
    footerLeft: {
        type: ControlType.String,
        title: "Footer Left",
        defaultValue: "FW // 2026",
        hidden(props) {
            return !props.showUI
        },
    },
    footerRight: {
        type: ControlType.String,
        title: "Footer Right",
        defaultValue: "Move cursor rapidly to induce focal refraction",
        hidden(props) {
            return !props.showUI
        },
    },
    hoverSize: {
        type: ControlType.Number,
        title: "Hover Size",
        defaultValue: 0.22,
        min: 0.01,
        max: 1.0,
        step: 0.01,
    },
    hoverSoftness: {
        type: ControlType.Number,
        title: "Hover Softness",
        defaultValue: 0.15,
        min: 0.0,
        max: 1.0,
        step: 0.01,
    },
})

// --- React Inline Styles ---
const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#050608",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        position: "relative",
    },
    canvasContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
    },
    uiLayer: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#ffffff",
        boxSizing: "border-box",
    },
    heroContent: {
        width: "100%",
        maxWidth: "800px",
        mixBlendMode: "difference",
        marginTop: "auto",
    },
    title: {
        lineHeight: 0.9,
        fontWeight: 400,
        letterSpacing: "-0.02em",
        marginBottom: "0.5rem",
        textTransform: "uppercase",
        margin: 0,
        wordWrap: "break-word",
        overflowWrap: "break-word",
        hyphens: "auto",
    },
    subtitle: {
        lineHeight: 1.5,
        color: "#a0a5b0",
        maxWidth: "100%",
        fontWeight: 300,
        marginTop: "1.25rem",
    },
    footer: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        fontSize: "0.75rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: "#a0a5b0",
        width: "100%",
    },
    loader: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "white",
        fontFamily: "monospace",
        fontSize: "1rem",
        zIndex: 10,
        letterSpacing: "0.2em",
        transition: "opacity 0.5s ease",
        pointerEvents: "none",
    },
}
