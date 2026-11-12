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


export default function SmokeBackground(incomingProps) {
    // STEP 1: Intercept & Flatten all grouped control objects
    const props = {
        ...incomingProps,
        ...(incomingProps.appearance || {}),
        ...(incomingProps.smokeSettings || {}),
        ...(incomingProps.behavior || {}),
    }

    const {
        flipHorizontal = false,
        flipVertical = false,
        backgroundColor = "#020203",
        grainIntensity = 0.04,
        smokeColor = "#2a4875",
        secondarySmokeColor = "#482a75",
        lightColor = "#d0e5ff",
        smokeDensity = 2.5,
        smokeScale = 2.0,
        rayIntensity = 1.8,
        deflectionForce = 4.0,
        crashMultiplier = 3.5,
        shadowOpacity = 0.7,
        speed = 0.15,
        windAngle = 4.0,
        turbulence = 1.0,
        startX = 0.0,
        startY = 0.0,
        editorPreview = true,
    } = props

    const mountRef = useRef(null)
    const containerRef = useRef(null)
    const contentRef = useRef(null)

    // Track latest props without triggering React useEffect re-renders
    const propsRef = useRef(props)
    propsRef.current = props

    useEffect(() => {
        if (!containerRef.current) return

        let width = containerRef.current.clientWidth
        let height = containerRef.current.clientHeight
        const dpr = Math.min(window.devicePixelRatio, 2)
        const targetW = Math.floor(width * dpr)
        const targetH = Math.floor(height * dpr)

        // 1. Scene Setup
        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
            depth: false,
            stencil: false,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(dpr)
        const container = containerRef.current
        container.appendChild(renderer.domElement)

        const bgScene = new THREE.Scene()
        const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        // 2. Pure Smoke Shader running BEHIND the Native DOM Element
        const bgMaterial = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(targetW, targetH) },
                u_bgColor: {
                    value: new THREE.Color(propsRef.current.backgroundColor),
                },
                u_smokeColor: {
                    value: new THREE.Color(propsRef.current.smokeColor),
                },
                u_secondarySmokeColor: {
                    value: new THREE.Color(
                        propsRef.current.secondarySmokeColor
                    ),
                },
                u_lightColor: {
                    value: new THREE.Color(propsRef.current.lightColor),
                },
                u_smokeDensity: { value: propsRef.current.smokeDensity },
                u_smokeScale: { value: propsRef.current.smokeScale },
                u_rayIntensity: { value: propsRef.current.rayIntensity },
                u_deflectionForce: { value: propsRef.current.deflectionForce },
                u_crashMultiplier: { value: propsRef.current.crashMultiplier },
                u_shadowOpacity: { value: propsRef.current.shadowOpacity },
                u_speed: { value: propsRef.current.speed },
                u_windAngle: { value: propsRef.current.windAngle },
                u_turbulence: { value: propsRef.current.turbulence },
                u_grainIntensity: { value: propsRef.current.grainIntensity },
                u_startX: { value: propsRef.current.startX },
                u_startY: { value: propsRef.current.startY },

                u_flipHorizontal: {
                    value: propsRef.current.flipHorizontal ? 1.0 : 0.0,
                },
                u_flipVertical: {
                    value: propsRef.current.flipVertical ? 1.0 : 0.0,
                },

                // Mathematical Bounding Box Tracking
                u_wallPos: { value: new THREE.Vector2(0, 0) },
                u_wallSize: { value: new THREE.Vector2(0, 0) },
                u_hasWall: { value: 0.0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float u_time;
                uniform vec2 u_resolution;
                uniform vec3 u_bgColor;
                uniform vec3 u_smokeColor;
                uniform vec3 u_secondarySmokeColor;
                uniform vec3 u_lightColor;
                
                uniform float u_smokeDensity;
                uniform float u_smokeScale;
                uniform float u_rayIntensity;
                uniform float u_deflectionForce;
                uniform float u_crashMultiplier;
                uniform float u_shadowOpacity;
                uniform float u_speed;
                uniform float u_windAngle;
                uniform float u_turbulence;
                uniform float u_grainIntensity;
                uniform float u_startX;
                uniform float u_startY;

                uniform float u_flipHorizontal;
                uniform float u_flipVertical;

                uniform vec2 u_wallPos;
                uniform vec2 u_wallSize;
                uniform float u_hasWall;

                varying vec2 vUv;

                float hash(vec3 p) {
                    p = fract(p * 0.3183099 + 0.1);
                    p *= 17.0;
                    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
                }

                float noise(vec3 x) {
                    vec3 i = floor(x);
                    vec3 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
                    );
                }

                float fbm(vec3 p) {
                    float f = 0.0;
                    float a = 0.5;
                    mat3 rot = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
                    for (int i = 0; i < 5; i++) {
                        f += a * noise(p);
                        p = rot * p * 2.0;
                        a *= 0.5;
                    }
                    return f;
                }

                // Mathematical Box Shape (SDF) 
                float sdRoundBox( vec2 p, vec2 b, float r ) {
                    vec2 q = abs(p) - b + r;
                    return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - r;
                }

                float getMask(vec2 p) {
                    if (u_hasWall < 0.5) return 0.0;
                    vec2 padding = vec2(0.08); 
                    float d = sdRoundBox(p - u_wallPos, (u_wallSize * 0.5) + padding, 0.04);
                    return 1.0 - smoothstep(-0.02, 0.08, d); 
                }

                void main() {
                    vec2 uv = vUv;
                    vec2 uvCentered = uv * 2.0 - 1.0;
                    float aspect = u_resolution.x / u_resolution.y;
                    
                    // --- ORIENTATION & FLIP LOGIC ---
                    if (u_flipVertical > 0.5) {
                        // Swaps axes to force the white core to the Top/Bottom
                        uvCentered = vec2(uvCentered.y, uvCentered.x);
                        // Re-calculate math aspect ratio for new orientation
                        aspect = u_resolution.y / u_resolution.x;
                    }
                    
                    if (u_flipHorizontal > 0.5) {
                        // Flips primary axis. Moves core from Left -> Right, or Top -> Bottom
                        uvCentered.x = -uvCentered.x;
                    }
                    
                    uvCentered.x *= aspect;

                    float t = u_time * u_speed;
                    
                    // Wind/Direction calculations
                    float angle = u_windAngle * 3.14159 / 180.0;
                    vec2 windDir = vec2(cos(angle), sin(angle));
                    vec2 drift = windDir * t * 1.5;

                    // --- 1. COLLISION MAP ---
                    float edgeOff = 0.05;
                    float mRight = getMask(uvCentered + vec2(edgeOff, 0.0));
                    float mLeft  = getMask(uvCentered - vec2(edgeOff, 0.0));
                    float mUp    = getMask(uvCentered + vec2(0.0, edgeOff));
                    float mDown  = getMask(uvCentered - vec2(0.0, edgeOff));
                    vec2 maskGrad = vec2(mRight - mLeft, mUp - mDown);

                    float windwardEdge = clamp(-(mRight - mLeft), 0.0, 1.0);
                    float leewardEdge = clamp((mRight - mLeft), 0.0, 1.0);

                    // Deflect the noise domain around the frame and apply starting point offset
                    vec2 startPoint = vec2(u_startX, u_startY);
                    vec2 baseDomain = ((uvCentered + startPoint) * u_smokeScale) + drift;
                    vec2 deflectedDomain = baseDomain + maskGrad * u_deflectionForce; 

                    // --- 2. GENERATE FRACTAL SMOKE ---
                    vec3 q = vec3(0.0);
                    q.x = fbm(vec3(deflectedDomain, t));
                    q.y = fbm(vec3(deflectedDomain + vec2(1.0), t));

                    vec3 r = vec3(0.0);
                    r.x = fbm(vec3(deflectedDomain + u_turbulence * q.xy + vec2(1.7, 9.2), t * 1.2));
                    r.y = fbm(vec3(deflectedDomain + u_turbulence * q.xy + vec2(8.3, 2.8), t * 1.3));

                    float f = fbm(vec3(deflectedDomain + r.xy, t * 0.5));
                    float smokeIntensity = (f * f) * u_smokeDensity;

                    // --- 3. LIGHTING RAYS ---
                    float rightGlow = smoothstep(0.0, aspect * 1.5, uvCentered.x + aspect); 
                    float blindingCore = smoothstep(aspect * 0.5, aspect * 1.2, uvCentered.x);
                    
                    float streak = fbm(vec3(uvCentered.y * 12.0, 0.0, t * 0.25));
                    streak = pow(smoothstep(0.35, 1.0, streak), 2.0);
                    float streakGlow = streak * smoothstep(-aspect, aspect, uvCentered.x);

                    // --- 4. COMPOSITING ---
                    // Premium Duotone Smoke
                    vec3 smokeMix = mix(u_smokeColor, u_secondarySmokeColor, smoothstep(0.1, 0.8, q.y));
                    vec3 color = mix(u_bgColor, smokeMix, clamp(smokeIntensity, 0.0, 1.0));
                    
                    color += u_lightColor * smokeIntensity * rightGlow * u_rayIntensity;
                    color += vec3(1.0) * blindingCore * 2.0;
                    color += u_lightColor * streakGlow * u_rayIntensity;

                    // Physical hit
                    float crash = windwardEdge * u_crashMultiplier * f; 
                    color += u_lightColor * crash * rightGlow;

                    // Physical shadow
                    float shadow = leewardEdge * u_shadowOpacity;
                    color = mix(color, u_bgColor, shadow);

                    // Cinematic Film Grain overlay
                    float grain = (fract(sin(dot(uvCentered + t * 0.1, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * u_grainIntensity;
                    color += grain;

                    // Outer Vignette wraps dynamically across orientation
                    float vX = smoothstep(0.0, -aspect, uvCentered.x); 
                    float vY = smoothstep(0.3, 1.5, abs(uvCentered.y));
                    float vignette = clamp(vX * 0.8 + vY * 0.8, 0.0, 1.0);
                    color *= 1.0 - vignette * 0.85;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        })

        const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial)
        bgScene.add(bgMesh)

        // 3. Global Interactions (Resize Only)
        const resizeObserver = new ResizeObserver((entries) => {
            width = entries[0].contentRect.width
            height = entries[0].contentRect.height
            renderer.setSize(width, height)

            const newTargetW = Math.floor(width * dpr)
            const newTargetH = Math.floor(height * dpr)
            bgMaterial.uniforms.u_resolution.value.set(newTargetW, newTargetH)
        })
        resizeObserver.observe(container)

        // 4. Render Loop & Dynamic Bounding Box Tracking
        const clock = new THREE.Clock()
        let time = 0
        let reqId

        const renderLoop = () => {
            reqId = requestAnimationFrame(renderLoop)

            // Render Target Verification logic strictly inside loop
            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !propsRef.current.editorPreview) return

            const delta = Math.min(clock.getDelta(), 0.1)
            time += delta

            // Extract latest variables gracefully avoiding re-renders
            const p = propsRef.current

            // Sync dynamic Framer Properties strictly through uniform pipeline
            bgMaterial.uniforms.u_time.value = time
            bgMaterial.uniforms.u_bgColor.value.set(p.backgroundColor)
            bgMaterial.uniforms.u_smokeColor.value.set(p.smokeColor)
            bgMaterial.uniforms.u_secondarySmokeColor.value.set(
                p.secondarySmokeColor
            )
            bgMaterial.uniforms.u_lightColor.value.set(p.lightColor)
            bgMaterial.uniforms.u_smokeDensity.value = p.smokeDensity
            bgMaterial.uniforms.u_smokeScale.value = p.smokeScale
            bgMaterial.uniforms.u_rayIntensity.value = p.rayIntensity
            bgMaterial.uniforms.u_deflectionForce.value = p.deflectionForce
            bgMaterial.uniforms.u_crashMultiplier.value = p.crashMultiplier
            bgMaterial.uniforms.u_shadowOpacity.value = p.shadowOpacity
            bgMaterial.uniforms.u_speed.value = p.speed
            bgMaterial.uniforms.u_windAngle.value = p.windAngle
            bgMaterial.uniforms.u_turbulence.value = p.turbulence
            bgMaterial.uniforms.u_grainIntensity.value = p.grainIntensity
            bgMaterial.uniforms.u_startX.value = p.startX
            bgMaterial.uniforms.u_startY.value = p.startY

            bgMaterial.uniforms.u_flipHorizontal.value = p.flipHorizontal
                ? 1.0
                : 0.0
            bgMaterial.uniforms.u_flipVertical.value = p.flipVertical
                ? 1.0
                : 0.0

            // Perfectly track the physical DOM bounds of the Framer component
            if (contentRef.current && contentRef.current.children.length > 0) {
                const containerRect =
                    containerRef.current.getBoundingClientRect()
                const el =
                    contentRef.current.firstElementChild || contentRef.current
                const childRect = el.getBoundingClientRect()

                if (childRect.width > 0 && childRect.height > 0) {
                    let wallX =
                        (childRect.left +
                            childRect.width / 2.0 -
                            containerRect.left) /
                        containerRect.width
                    wallX = wallX * 2.0 - 1.0

                    let wallY =
                        (childRect.top +
                            childRect.height / 2.0 -
                            containerRect.top) /
                        containerRect.height
                    wallY = -(wallY * 2.0 - 1.0) // Invert Y naturally for WebGL

                    let wallSizeX =
                        (childRect.width / containerRect.width) * 2.0
                    let wallSizeY =
                        (childRect.height / containerRect.height) * 2.0

                    // Mathematically align the collision map to match the Shader's new flipped orientation
                    if (p.flipVertical) {
                        const tempX = wallX
                        wallX = wallY
                        wallY = tempX

                        const tempSize = wallSizeX
                        wallSizeX = wallSizeY
                        wallSizeY = tempSize
                    }

                    if (p.flipHorizontal) {
                        wallX = -wallX
                    }

                    const activeAspect = p.flipVertical
                        ? containerRect.height / (containerRect.width || 1)
                        : containerRect.width / (containerRect.height || 1)

                    wallX *= activeAspect
                    wallSizeX *= activeAspect

                    bgMaterial.uniforms.u_wallPos.value.set(wallX, wallY)
                    bgMaterial.uniforms.u_wallSize.value.set(
                        wallSizeX,
                        wallSizeY
                    )
                    bgMaterial.uniforms.u_hasWall.value = 1.0
                } else {
                    bgMaterial.uniforms.u_hasWall.value = 0.0
                }
            } else {
                bgMaterial.uniforms.u_hasWall.value = 0.0
            }

            renderer.render(bgScene, bgCamera)
        }

        renderLoop()

        return () => {
            resizeObserver.disconnect()
            cancelAnimationFrame(reqId)

            renderer.dispose()
            bgMaterial.dispose()
            bgMesh.geometry.dispose()

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, []) // EMPTY DEPENDENCY ARRAY - Fixes the Framer UI crash

    return (
        <div
            {...incomingProps}
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 500,
                minHeight: 400,
                ...incomingProps.style,
                position: "relative",
                overflow: "hidden",
                backgroundColor: backgroundColor,
            }}
        >
            <div
                ref={containerRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                }}
            />

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    pointerEvents: "none",
                }}
            >
                <div
                    ref={contentRef}
                    style={{ display: "flex", pointerEvents: "auto" }}
                ></div>
            </div>
        </div>
    )
}

// STEP 2: Nested Defaults Architecture
SmokeBackground.defaultProps = {
    editorPreview: true,
    flipHorizontal: false,
    flipVertical: false,
    appearance: {
        backgroundColor: "#020203",
        grainIntensity: 0.04,
    },
    smokeSettings: {
        smokeColor: "#2a4875",
        secondarySmokeColor: "#482a75",
        lightColor: "#d0e5ff",
        smokeDensity: 2.5,
        smokeScale: 2.0,
        rayIntensity: 1.8,
    },
    behavior: {
        speed: 0.15,
        windAngle: 4.0,
        turbulence: 1.0,
        startX: 0.0,
        startY: 0.0,
    },
}

// STEP 3: UI Categorization Architecture
addPropertyControls(SmokeBackground, {
    editorPreview: {
        type: ControlType.Boolean,
        title: "Editor Preview",
        defaultValue: true,
    },
    flipHorizontal: {
        type: ControlType.Boolean,
        title: "Flip Horizontal",
        defaultValue: false,
    },
    flipVertical: {
        type: ControlType.Boolean,
        title: "Flip Vertical",
        defaultValue: false,
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                defaultValue: "#020203",
                title: "Background",
            },
            grainIntensity: {
                type: ControlType.Number,
                defaultValue: 0.04,
                min: 0.0,
                max: 0.2,
                step: 0.01,
                title: "Film Grain",
            },
        },
    },
    smokeSettings: {
        type: ControlType.Object,
        title: "Smoke Settings",
        controls: {
            smokeColor: {
                type: ControlType.Color,
                defaultValue: "#2a4875",
                title: "Primary Tint",
            },
            secondarySmokeColor: {
                type: ControlType.Color,
                defaultValue: "#482a75",
                title: "Duotone Mix",
            },
            lightColor: {
                type: ControlType.Color,
                defaultValue: "#d0e5ff",
                title: "God Rays",
            },
            rayIntensity: {
                type: ControlType.Number,
                defaultValue: 1.8,
                min: 0.0,
                max: 5.0,
                step: 0.1,
                title: "Ray Brightness",
            },
            smokeDensity: {
                type: ControlType.Number,
                defaultValue: 2.5,
                min: 0.0,
                max: 10.0,
                step: 0.1,
                title: "Density",
            },
            smokeScale: {
                type: ControlType.Number,
                defaultValue: 2.0,
                min: 0.1,
                max: 10.0,
                step: 0.1,
                title: "Zoom Scale",
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Wind Speed",
                defaultValue: 0.15,
                min: 0.0,
                max: 1.0,
                step: 0.01,
            },
            windAngle: {
                type: ControlType.Number,
                title: "Direction (Angle)",
                defaultValue: 4.0,
                min: -180,
                max: 180,
                step: 1.0,
            },
            turbulence: {
                type: ControlType.Number,
                title: "Turbulence",
                defaultValue: 1.0,
                min: 0.0,
                max: 3.0,
                step: 0.1,
            },
            startX: {
                type: ControlType.Number,
                title: "Start Point X",
                defaultValue: 0.0,
                min: -10.0,
                max: 10.0,
                step: 0.1,
            },
            startY: {
                type: ControlType.Number,
                title: "Start Point Y",
                defaultValue: 0.0,
                min: -10.0,
                max: 10.0,
                step: 0.1,
            },
        },
    },
})
