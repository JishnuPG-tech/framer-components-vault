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


export default function SmoothLiquidGlassBackground(incomingProps) {
    const isStatic = useIsStaticRenderer()

    // STEP 1: Intercept & Flatten Props
    // Flatten grouped objects into a single 'props' object using spread operators
    // and defensive fallbacks to maintain flat internal references.
    const props = {
        ...SmoothLiquidGlassBackground.defaultProps,
        ...(SmoothLiquidGlassBackground.defaultProps.layout || {}),
        ...(SmoothLiquidGlassBackground.defaultProps.appearance || {}),
        ...(SmoothLiquidGlassBackground.defaultProps.animation || {}),
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.appearance || {}),
        ...(incomingProps.animation || {}),
    }

    const mountRef = useRef(null)
    const propsRef = useRef(props)

    // Keep props ref updated without triggering re-renders
    useEffect(() => {
        propsRef.current = props
    }, [props])

    // RULE 2 & 3: Strict WebGL Cleanup & Scene Lifecycle
    useEffect(() => {
        // STATIC RENDERING GUARD: Skip all WebGL and Observer initialization if statically rendering
        if (isStatic) return

        const container = mountRef.current
        if (!container) return

        let frameId
        const width = container.clientWidth || window.innerWidth
        const height = container.clientHeight || window.innerHeight

        // Scene Setup
        const scene = new THREE.Scene()
        // Orthographic camera for full-screen quad raymarching
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            powerPreference: "high-performance",
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(renderer.domElement)

        // Raymarching Shader Material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(width, height) },
                u_shapeStyle: {
                    value:
                        props.shapeStyle === "vertical"
                            ? 1.0
                            : props.shapeStyle === "corrugated"
                              ? 2.0
                              : props.shapeStyle === "fold"
                                ? 3.0
                                : 0.0,
                },
                u_twistSpeed: { value: props.twistSpeed },
                u_position: {
                    value: new THREE.Vector2(props.positionX, props.positionY),
                },

                // 16 New Specific Layout Properties
                u_diagThickness: { value: props.diagThickness },
                u_diagTwist: { value: props.diagTwist },
                u_diagReach: { value: props.diagReach },
                u_diagRotation: { value: props.diagRotation },

                u_vertWidth: { value: props.vertWidth },
                u_vertWaveAmp: { value: props.vertWaveAmp },
                u_vertTwist: { value: props.vertTwist },
                u_vertMicroFold: { value: props.vertMicroFold },

                u_corrWidth: { value: props.corrWidth },
                u_corrSnakeAmp: { value: props.corrSnakeAmp },
                u_corrPleatFreq: { value: props.corrPleatFreq },
                u_corrPleatDepth: { value: props.corrPleatDepth },

                u_foldWidth: { value: props.foldWidth },
                u_foldBillow: { value: props.foldBillow },
                u_foldTension: { value: props.foldTension },
                u_foldRotation: { value: props.foldRotation },

                u_coreColor: { value: new THREE.Color(props.coreColor) },
                u_blueBand: { value: new THREE.Color(props.blueBand) },
                u_purpleBand: { value: new THREE.Color(props.purpleBand) },
                u_cyanBand: { value: new THREE.Color(props.cyanBand) },
                u_orangeBand: { value: new THREE.Color(props.orangeBand) },
                u_highlightColor: {
                    value: new THREE.Color(props.highlightColor),
                },
            },
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float u_time;
                uniform vec2 u_resolution;
                
                uniform float u_shapeStyle;
                uniform float u_twistSpeed;
                
                uniform vec2 u_position;
                
                // Diagonal Controls
                uniform float u_diagThickness;
                uniform float u_diagTwist;
                uniform float u_diagReach;
                uniform float u_diagRotation;
                
                // Vertical Controls
                uniform float u_vertWidth;
                uniform float u_vertWaveAmp;
                uniform float u_vertTwist;
                uniform float u_vertMicroFold;
                
                // Corrugated Controls
                uniform float u_corrWidth;
                uniform float u_corrSnakeAmp;
                uniform float u_corrPleatFreq;
                uniform float u_corrPleatDepth;
                
                // Fold Controls
                uniform float u_foldWidth;
                uniform float u_foldBillow;
                uniform float u_foldTension;
                uniform float u_foldRotation;
                
                uniform vec3 u_coreColor;
                uniform vec3 u_blueBand;
                uniform vec3 u_purpleBand;
                uniform vec3 u_cyanBand;
                uniform vec3 u_orangeBand;
                uniform vec3 u_highlightColor;

                // Increased steps for extremely soft/fat geometries
                #define MAX_STEPS 120
                #define MAX_DIST 15.0
                #define SURF_DIST 0.002

                mat2 rot(float a) {
                    float s = sin(a), c = cos(a);
                    return mat2(c, -s, s, c);
                }

                float map(vec3 p) {
                    vec3 q = p;
                    
                    if (u_shapeStyle < 0.5) {
                        // 0: Diagonal Style
                        q.xy *= rot(u_diagRotation); 
                        float taper = smoothstep(4.5, 0.0, abs(q.x));
                        
                        float reach = 1.0 - smoothstep(max(0.0, u_diagReach - 2.0), u_diagReach, abs(q.x));
                        float twistPhase = (q.x * u_diagTwist) * reach - u_time * u_twistSpeed;
                        
                        q.yz *= rot(twistPhase);
                        float w = u_diagThickness * taper; 
                        float t = 0.06 * taper; 
                        
                        vec2 d2 = vec2(max(abs(q.y) - w, 0.0), max(abs(q.z) - t, 0.0));
                        // Large subtraction value forces ultra-smooth, pillow-like edges
                        float d = length(d2) - 0.35; 
                        
                        d += 0.015 * sin(q.y * 5.0 + u_time);
                        return d * 0.5; // Scaled down ray distance for safety on fat edges
                        
                    } else if (u_shapeStyle < 1.5) {
                        // 1: Vertical Wave Style
                        q.x += sin(q.y * 0.8 + u_time * 0.3) * u_vertWaveAmp;
                        q.z += cos(q.y * 0.6 + u_time * 0.2) * 0.4;
                        
                        float taper = smoothstep(8.0, 0.0, abs(q.y));
                        
                        float reach = smoothstep(8.0, 0.0, abs(q.y)); 
                        float twistPhase = (q.y * u_vertTwist) * reach - u_time * u_twistSpeed;
                        
                        q.xz *= rot(twistPhase);
                        
                        q.z += sin(q.x * 2.0) * u_vertMicroFold; 
                        
                        float w = u_vertWidth * taper; 
                        float t = 0.12 * taper; 
                        
                        vec2 d2 = vec2(max(abs(q.x) - w, 0.0), max(abs(q.z) - t, 0.0));
                        float d = length(d2) - 0.45; // Soft fluid edge
                        
                        return d * 0.5;
                        
                    } else if (u_shapeStyle < 2.5) {
                        // 2: Corrugated Style
                        q.xy *= rot(0.65); 
                        
                        q.y += sin(q.x * 1.5 - u_time * u_twistSpeed * 0.6) * u_corrSnakeAmp;
                        q.z += cos(q.x * 1.0 - u_time * u_twistSpeed * 0.4) * (u_corrSnakeAmp * 0.75);
                        
                        float taper = smoothstep(7.0, 0.0, abs(q.x));
                        
                        float reach = smoothstep(8.0, 0.0, abs(q.x));
                        float twistPhase = (q.x * 0.8) * reach - u_time * (u_twistSpeed * 0.4);
                        q.yz *= rot(twistPhase);
                        
                        float pleats = (sin(q.x * u_corrPleatFreq - u_time * 2.0) * 0.5 + 0.5) * u_corrPleatDepth;
                        
                        float w = u_corrWidth * taper; 
                        float t = (0.04 + pleats) * taper; 
                        
                        vec2 d2 = vec2(max(abs(q.y) - w, 0.0), max(abs(q.z) - t, 0.0));
                        float d = length(d2) - 0.2; // Softened ridges
                        
                        d += 0.005 * sin(q.y * 20.0);
                        
                        return d * 0.35; 
                    } else {
                        // 3: Sweeping Fold Style
                        q.xy *= rot(u_foldRotation); 
                        
                        float billow = sin(q.y * 1.2 + u_time * u_twistSpeed * 0.15) * u_foldBillow;
                        q.z += billow;
                        
                        float taper = smoothstep(7.0, 1.0, abs(q.y));
                        
                        float reach = smoothstep(8.0, 0.0, abs(q.y));
                        float twistPhase = (q.y * 0.8) * reach - u_time * (u_twistSpeed * 0.2);
                        q.xz *= rot(twistPhase);
                        
                        q.z += sin(q.x * 1.0) * u_foldTension;
                        
                        float w = u_foldWidth * taper; 
                        float t = 0.015 * taper; 
                        
                        vec2 d2 = vec2(max(abs(q.x) - w, 0.0), max(abs(q.z) - t, 0.0));
                        float d = length(d2) - 0.25; // Perfectly round edges for paper fold
                        
                        return d * 0.4;
                    }
                }

                // Generous normal epsilon to completely smooth out shading and geometry banding
                vec3 getNormal(vec3 p) {
                    vec2 e = vec2(0.003, 0); 
                    vec3 n = vec3(
                        map(p + e.xyy) - map(p - e.xyy),
                        map(p + e.yxy) - map(p - e.yxy),
                        map(p + e.yyx) - map(p - e.yyx)
                    );
                    return normalize(n);
                }

                void main() {
                    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
                    
                    // Fixed implicit scale
                    uv /= 1.15;
                    
                    // Apply XY Position
                    uv -= u_position;
                    
                    vec3 ro = vec3(0.0, 0.0, 6.0);
                    vec3 rd = normalize(vec3(uv, -1.5));
                    
                    float d0 = 0.0;
                    vec3 p;
                    bool hit = false;
                    
                    for(int i = 0; i < MAX_STEPS; i++) {
                        p = ro + rd * d0;
                        float ds = map(p);
                        d0 += ds;
                        if(d0 > MAX_DIST) break;
                        if(abs(ds) < SURF_DIST) {
                            hit = true;
                            break;
                        }
                    }

                    // Background color logic based on active style
                    vec3 color = vec3(0.0);
                    if (u_shapeStyle > 2.5) {
                        // Light, bright background for Sweeping Fold
                        vec3 bg1 = vec3(0.9, 0.96, 1.0); 
                        vec3 bg2 = vec3(0.7, 0.88, 0.98);
                        color = mix(bg1, bg2, smoothstep(0.0, 1.5, length(uv)));
                    } else if (u_shapeStyle > 1.5) {
                        // Corrugated background
                        color = mix(vec3(0.96, 0.97, 0.98), vec3(0.88, 0.89, 0.91), uv.y * 0.5 + 0.5);
                    }
                    
                    if(hit) {
                        vec3 n = getNormal(p);
                        vec3 v = normalize(ro - p);
                        
                        float fresnel = 1.0 - max(dot(n, v), 0.0);
                        float f2 = pow(fresnel, 1.4); 
                        float f4 = pow(fresnel, 4.0);
                        
                        color = u_coreColor;
                        
                        color = mix(color, u_blueBand, smoothstep(0.0, 0.35, f2));
                        color = mix(color, u_cyanBand, smoothstep(0.35, 0.55, f2));
                        color = mix(color, u_purpleBand, smoothstep(0.55, 0.75, f2));
                        color = mix(color, u_orangeBand, smoothstep(0.75, 1.0, f2));
                        
                        vec3 l1 = normalize(vec3(1.5, 2.0, 2.5));
                        vec3 h1 = normalize(l1 + v);
                        float spec1 = pow(max(dot(n, h1), 0.0), 8.0); 
                        
                        vec3 l2 = normalize(vec3(-2.0, -1.0, -1.0));
                        vec3 h2 = normalize(l2 + v);
                        float spec2 = pow(max(dot(n, h2), 0.0), 5.0); 
                        
                        float edgeGlow = smoothstep(0.6, 1.0, f2) * 0.5;
                        vec3 ref = reflect(-v, n);
                        float envMap = smoothstep(-0.2, 1.0, ref.y);
                        
                        // Extremely soft highlight processing for all modes to avoid hard edge dots
                        if (u_shapeStyle > 2.5) {
                            spec1 = pow(max(dot(n, h1), 0.0), 12.0);
                            spec2 = pow(max(dot(n, h2), 0.0), 8.0);
                            
                            color += u_blueBand * envMap * 0.5; 
                            color += spec1 * u_highlightColor * 1.1; 
                            color += spec2 * u_highlightColor * 0.7; 
                            color += u_orangeBand * edgeGlow * f4 * 2.5; 
                        } else if (u_shapeStyle > 1.5) {
                            spec1 = pow(max(dot(n, h1), 0.0), 16.0);
                            spec2 = pow(max(dot(n, h2), 0.0), 12.0);
                            color += u_blueBand * envMap * 0.4; 
                            color += spec1 * u_highlightColor * 2.0; 
                            color += spec2 * u_highlightColor * 1.0; 
                            color += u_orangeBand * edgeGlow * f4 * 0.5; 
                        } else {
                            color += u_blueBand * envMap * 0.2; 
                            color += spec1 * u_highlightColor * 1.5; 
                            color += spec2 * u_highlightColor * 0.8; 
                            color += u_orangeBand * edgeGlow * f4; 
                        }
                        
                        color = pow(color, vec3(0.9)); 
                    }

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        })

        const geometry = new THREE.PlaneGeometry(2, 2)
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // RULE 5: Viewport Rendering Optimization
        let isVisible = true
        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting
        })
        observer.observe(container)

        // RULE 4: Responsive Sizing
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const w = entry.contentRect.width
                const h = entry.contentRect.height
                if (w === 0 || h === 0) continue
                renderer.setSize(w, h)
                material.uniforms.u_resolution.value.set(w, h)
            }
        })
        resizeObserver.observe(container)

        const clock = new THREE.Clock()

        // RULE 6: Animation & Performance Loop
        const animate = () => {
            frameId = requestAnimationFrame(animate)

            if (!isVisible) return

            // RULE 11: Editor Preview Toggle
            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !propsRef.current.editorPreview) return

            const time = clock.getElapsedTime()
            const currentProps = propsRef.current

            material.uniforms.u_time.value = time * currentProps.speed

            let currentShapeStyle = 0.0
            if (currentProps.shapeStyle === "vertical") currentShapeStyle = 1.0
            else if (currentProps.shapeStyle === "corrugated")
                currentShapeStyle = 2.0
            else if (currentProps.shapeStyle === "fold") currentShapeStyle = 3.0

            material.uniforms.u_shapeStyle.value = currentShapeStyle
            material.uniforms.u_twistSpeed.value = currentProps.twistSpeed
            material.uniforms.u_position.value.set(
                currentProps.positionX,
                currentProps.positionY
            )

            // Pass style-specific layout properties
            material.uniforms.u_diagThickness.value = currentProps.diagThickness
            material.uniforms.u_diagTwist.value = currentProps.diagTwist
            material.uniforms.u_diagReach.value = currentProps.diagReach
            material.uniforms.u_diagRotation.value = currentProps.diagRotation

            material.uniforms.u_vertWidth.value = currentProps.vertWidth
            material.uniforms.u_vertWaveAmp.value = currentProps.vertWaveAmp
            material.uniforms.u_vertTwist.value = currentProps.vertTwist
            material.uniforms.u_vertMicroFold.value = currentProps.vertMicroFold

            material.uniforms.u_corrWidth.value = currentProps.corrWidth
            material.uniforms.u_corrSnakeAmp.value = currentProps.corrSnakeAmp
            material.uniforms.u_corrPleatFreq.value = currentProps.corrPleatFreq
            material.uniforms.u_corrPleatDepth.value =
                currentProps.corrPleatDepth

            material.uniforms.u_foldWidth.value = currentProps.foldWidth
            material.uniforms.u_foldBillow.value = currentProps.foldBillow
            material.uniforms.u_foldTension.value = currentProps.foldTension
            material.uniforms.u_foldRotation.value = currentProps.foldRotation

            // Implement specific beautiful palettes automatically if custom colors are disabled
            let currentCoreColor = currentProps.coreColor
            let currentBlueBand = currentProps.blueBand
            let currentCyanBand = currentProps.cyanBand
            let currentPurpleBand = currentProps.purpleBand
            let currentOrangeBand = currentProps.orangeBand
            let currentHighlightColor = currentProps.highlightColor

            if (!currentProps.useCustomColors) {
                if (currentProps.shapeStyle === "diagonal") {
                    currentCoreColor = "#0d0221"
                    currentBlueBand = "#ff0055"
                    currentCyanBand = "#8800ff"
                    currentPurpleBand = "#00eeff"
                    currentOrangeBand = "#ffaa00"
                    currentHighlightColor = "#ffffff"
                } else if (currentProps.shapeStyle === "vertical") {
                    currentCoreColor = "#020d0a"
                    currentBlueBand = "#00ff88"
                    currentCyanBand = "#0088ff"
                    currentPurpleBand = "#0022ff"
                    currentOrangeBand = "#aaff00"
                    currentHighlightColor = "#ffffff"
                } else if (currentProps.shapeStyle === "corrugated") {
                    currentCoreColor = "#0a0a0a"
                    currentBlueBand = "#262626"
                    currentCyanBand = "#4d4d4d"
                    currentPurpleBand = "#808080"
                    currentOrangeBand = "#cccccc"
                    currentHighlightColor = "#ffffff"
                } else if (currentProps.shapeStyle === "fold") {
                    currentCoreColor = "#0044ff"
                    currentBlueBand = "#0099ff"
                    currentCyanBand = "#00e5ff"
                    currentPurpleBand = "#ffffff"
                    currentOrangeBand = "#ccff00"
                    currentHighlightColor = "#ffffff"
                }
            }

            material.uniforms.u_coreColor.value.set(currentCoreColor)
            material.uniforms.u_blueBand.value.set(currentBlueBand)
            material.uniforms.u_purpleBand.value.set(currentPurpleBand)
            material.uniforms.u_cyanBand.value.set(currentCyanBand)
            material.uniforms.u_orangeBand.value.set(currentOrangeBand)
            material.uniforms.u_highlightColor.value.set(currentHighlightColor)

            renderer.render(scene, camera)
        }
        animate()

        // RULE 2: Aggressive WebGL Cleanup
        return () => {
            cancelAnimationFrame(frameId)
            observer.disconnect()
            resizeObserver.disconnect()

            geometry.dispose()
            material.dispose()
            scene.clear()

            renderer.forceContextLoss()
            renderer.dispose()

            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [isStatic]) // Added isStatic to dependency array just in case

    // STATIC FALLBACK: Generate lightweight background colors to match active style
    let backgroundStyle = "#000000"
    if (isStatic) {
        let fallbackCore = props.coreColor
        let fallbackEdge = props.blueBand

        if (!props.useCustomColors) {
            if (props.shapeStyle === "diagonal") {
                fallbackCore = "#0d0221"
                fallbackEdge = "#ff0055"
            } else if (props.shapeStyle === "vertical") {
                fallbackCore = "#020d0a"
                fallbackEdge = "#00ff88"
            } else if (props.shapeStyle === "corrugated") {
                fallbackCore = "#0a0a0a"
                fallbackEdge = "#262626"
            } else if (props.shapeStyle === "fold") {
                fallbackCore = "#0044ff"
                fallbackEdge = "#0099ff"
            }
        }
        backgroundStyle = `linear-gradient(135deg, ${fallbackCore}, ${fallbackEdge})`
    }

    // RULE 10: Prevent 0x0px Canvas Mounting
    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                background: isStatic ? backgroundStyle : "#000000",
                ...incomingProps.style,
            }}
        />
    )
}

// STEP 2: Nested Defaults
// Grouped properties must be nested inside their respective group object keys.
SmoothLiquidGlassBackground.defaultProps = {
    layout: {
        shapeStyle: "fold",
        positionX: 0.0,
        positionY: 0.0,

        diagThickness: 1.3,
        diagTwist: 1.0,
        diagReach: 8.0,
        diagRotation: 0.55,

        vertWidth: 1.2,
        vertWaveAmp: 1.2,
        vertTwist: 1.0,
        vertMicroFold: 0.3,

        corrWidth: 1.5,
        corrSnakeAmp: 0.8,
        corrPleatFreq: 45.0,
        corrPleatDepth: 0.035,

        foldWidth: 4.0,
        foldBillow: 1.5,
        foldTension: 0.6,
        foldRotation: -0.35,
    },
    appearance: {
        useCustomColors: false,
        highlightColor: "#ffffff",
        coreColor: "#0044ff",
        blueBand: "#0099ff",
        cyanBand: "#00e5ff",
        purpleBand: "#ffffff",
        orangeBand: "#ccff00",
    },
    animation: {
        editorPreview: true,
        speed: 1.0,
        twistSpeed: 0.35,
    },
}

// STEP 3: UI Categorization
// Use ControlType.Object to create collapsible sections mirroring the nested defaults.
addPropertyControls(SmoothLiquidGlassBackground, {
    layout: {
        type: ControlType.Object,
        title: "Layout & Shape",
        controls: {
            shapeStyle: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["diagonal", "vertical", "corrugated", "fold"],
                optionTitles: ["Diagonal", "Vertical", "Corrugated", "Fold"],
                defaultValue: "fold",
            },
            positionX: {
                type: ControlType.Number,
                title: "Position X",
                min: -5,
                max: 5,
                step: 0.05,
                defaultValue: 0.0,
                displayStepper: true,
            },
            positionY: {
                type: ControlType.Number,
                title: "Position Y",
                min: -5,
                max: 5,
                step: 0.05,
                defaultValue: 0.0,
                displayStepper: true,
            },

            // Diagonal controls
            diagThickness: {
                type: ControlType.Number,
                title: "Thickness",
                min: 0.5,
                max: 3.0,
                step: 0.1,
                defaultValue: 1.3,
                hidden: (p) => p.shapeStyle !== "diagonal",
            },
            diagTwist: {
                type: ControlType.Number,
                title: "Twist Amount",
                min: 0,
                max: 3.0,
                step: 0.1,
                defaultValue: 1.0,
                hidden: (p) => p.shapeStyle !== "diagonal",
            },
            diagReach: {
                type: ControlType.Number,
                title: "Twist Reach",
                min: 0,
                max: 15.0,
                step: 0.5,
                defaultValue: 8.0,
                hidden: (p) => p.shapeStyle !== "diagonal",
            },
            diagRotation: {
                type: ControlType.Number,
                title: "Rotation",
                min: -3.14,
                max: 3.14,
                step: 0.05,
                defaultValue: 0.55,
                hidden: (p) => p.shapeStyle !== "diagonal",
            },

            // Vertical controls
            vertWidth: {
                type: ControlType.Number,
                title: "Width",
                min: 0.5,
                max: 3.0,
                step: 0.1,
                defaultValue: 1.2,
                hidden: (p) => p.shapeStyle !== "vertical",
            },
            vertWaveAmp: {
                type: ControlType.Number,
                title: "Wave Amp",
                min: 0.0,
                max: 3.0,
                step: 0.1,
                defaultValue: 1.2,
                hidden: (p) => p.shapeStyle !== "vertical",
            },
            vertTwist: {
                type: ControlType.Number,
                title: "Twist",
                min: 0.0,
                max: 3.0,
                step: 0.1,
                defaultValue: 1.0,
                hidden: (p) => p.shapeStyle !== "vertical",
            },
            vertMicroFold: {
                type: ControlType.Number,
                title: "Micro Fold",
                min: 0.0,
                max: 1.0,
                step: 0.05,
                defaultValue: 0.3,
                hidden: (p) => p.shapeStyle !== "vertical",
            },

            // Corrugated controls
            corrWidth: {
                type: ControlType.Number,
                title: "Width",
                min: 0.5,
                max: 3.0,
                step: 0.1,
                defaultValue: 1.5,
                hidden: (p) => p.shapeStyle !== "corrugated",
            },
            corrSnakeAmp: {
                type: ControlType.Number,
                title: "Snake Amp",
                min: 0.0,
                max: 2.0,
                step: 0.1,
                defaultValue: 0.8,
                hidden: (p) => p.shapeStyle !== "corrugated",
            },
            corrPleatFreq: {
                type: ControlType.Number,
                title: "Pleat Freq",
                min: 10.0,
                max: 100.0,
                step: 1.0,
                defaultValue: 45.0,
                hidden: (p) => p.shapeStyle !== "corrugated",
            },
            corrPleatDepth: {
                type: ControlType.Number,
                title: "Pleat Depth",
                min: 0.0,
                max: 0.1,
                step: 0.005,
                defaultValue: 0.035,
                hidden: (p) => p.shapeStyle !== "corrugated",
            },

            // Fold controls
            foldWidth: {
                type: ControlType.Number,
                title: "Width",
                min: 1.0,
                max: 8.0,
                step: 0.5,
                defaultValue: 4.0,
                hidden: (p) => p.shapeStyle !== "fold",
            },
            foldBillow: {
                type: ControlType.Number,
                title: "Billow",
                min: 0.0,
                max: 3.0,
                step: 0.1,
                defaultValue: 1.5,
                hidden: (p) => p.shapeStyle !== "fold",
            },
            foldTension: {
                type: ControlType.Number,
                title: "Tension",
                min: 0.0,
                max: 2.0,
                step: 0.1,
                defaultValue: 0.6,
                hidden: (p) => p.shapeStyle !== "fold",
            },
            foldRotation: {
                type: ControlType.Number,
                title: "Rotation",
                min: -3.14,
                max: 3.14,
                step: 0.05,
                defaultValue: -0.35,
                hidden: (p) => p.shapeStyle !== "fold",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            useCustomColors: {
                type: ControlType.Boolean,
                title: "Custom Colors",
                defaultValue: false,
            },
            highlightColor: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: "#ffffff",
                hidden: (p) => !p.useCustomColors,
            },
            coreColor: {
                type: ControlType.Color,
                title: "Core",
                defaultValue: "#0044ff",
                hidden: (p) => !p.useCustomColors,
            },
            blueBand: {
                type: ControlType.Color,
                title: "Inner",
                defaultValue: "#0099ff",
                hidden: (p) => !p.useCustomColors,
            },
            cyanBand: {
                type: ControlType.Color,
                title: "Mid",
                defaultValue: "#00e5ff",
                hidden: (p) => !p.useCustomColors,
            },
            purpleBand: {
                type: ControlType.Color,
                title: "Outer",
                defaultValue: "#ffffff",
                hidden: (p) => !p.useCustomColors,
            },
            orangeBand: {
                type: ControlType.Color,
                title: "Edge",
                defaultValue: "#ccff00",
                hidden: (p) => !p.useCustomColors,
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            editorPreview: {
                type: ControlType.Boolean,
                title: "Preview",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 3,
                step: 0.1,
                defaultValue: 1.0,
            },
            twistSpeed: {
                type: ControlType.Number,
                title: "Twist Speed",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 0.35,
            },
        },
    },
})
