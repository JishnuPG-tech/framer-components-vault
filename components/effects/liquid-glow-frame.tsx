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


export default function LiquidConnection(incomingProps) {
    const isStatic = useIsStaticRenderer()

    const props = {
        ...incomingProps,
        ...(incomingProps.appearance || {}),
        ...(incomingProps.bg || {}),
    }

    const propsRef = useRef(props)
    propsRef.current = props

    const mountRef = useRef(null)
    const childWrapperRef = useRef(null)
    const materialRef = useRef(null)

    useEffect(() => {
        if (!mountRef.current) return

        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: "high-performance",
        })

        const dpr = Math.min(window.devicePixelRatio, 2.0)
        renderer.setPixelRatio(dpr)

        const geometry = new THREE.PlaneGeometry(2, 2)

        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform float uDpr;
            uniform float uHasBg;
            
            // DOM Layout syncing
            uniform vec2 uBoxDim;
            uniform vec2 uBoxCenter;
            
            // Characteristics
            const int MAX_COLORS = 16;
            uniform vec3 uColors[MAX_COLORS];
            uniform int uColorCount;
            uniform int uGlowStyle; // 0 = Orbit, 1 = Ambient
            
            uniform vec3 uBgColor;
            uniform float uBoxR;
            uniform float uSpeed;
            uniform float uAuraSize;
            uniform float uCoreSize;

            // Background Grid FX
            uniform float uShowGrid;
            uniform vec3 uGridColor;
            uniform float uGridSize;
            uniform float uGridDotSize;
            uniform float uGridOpacity;

            float sdBox( in vec2 p, in vec2 b, in float r ) {
                vec2 d = abs(p) - b + r;
                return length(max(d,0.0)) + min(max(d.x,d.y),0.0) - r;
            }

            void main() {
                vec2 p = gl_FragCoord.xy - uResolution.xy * 0.5;
                float t = uTime * uSpeed;

                // 1. Box Bounds
                vec2 bp = p - uBoxCenter;
                
                vec2 dim = max(uBoxDim, vec2(1.0));
                float safeR = min(uBoxR * uDpr, min(dim.x, dim.y));
                float d = sdBox(bp, dim, safeR);

                // 2. Animated Perimeter Sweep 
                vec2 polarP = bp / dim; 
                float angle = atan(polarP.y, polarP.x);
                
                float phase = angle - t * 6.2831853; // Fast spin for orbit
                float slowPhase = angle - t * 1.5;   // Slow gentle rotation for ambient

                // 3. Distance to edge
                float absD = abs(d);
                float auraRadius = max(0.001, uAuraSize * uDpr);
                float coreRadius = max(0.001, uCoreSize * uDpr);
                
                // Use exponential decay for the aura so it acts as a soft translucent spread, NOT inflating line thickness
                float aura = exp(-absD / max(0.001, auraRadius * 0.35)) * 0.4;
                float core = pow(coreRadius / (absD + coreRadius), 2.5);

                // --- BASE COLOR & GRID ---
                float baseAlpha = uHasBg;
                vec3 finalCol = uBgColor;

                if (uHasBg > 0.5 && uShowGrid > 0.5) {
                    vec2 gridFract = fract((p - uBoxCenter) / (max(uGridSize, 1.0) * uDpr)) - 0.5;
                    float dotDist = max(abs(gridFract.x), abs(gridFract.y));
                    float dotRadius = uGridDotSize * 0.5;
                    float dotMask = smoothstep(dotRadius + 0.04, dotRadius, dotDist);
                    finalCol = mix(finalCol, uGridColor, dotMask * uGridOpacity);
                }

                // 4. Mixing the Continuous Light Layers dynamically based on color count
                vec3 currentGlow = vec3(0.0);
                vec3 sumColor = vec3(0.0);
                float whiteHotTotal = 0.0;
                
                float fCount = max(1.0, float(uColorCount));
                float phaseStep = 6.2831853 / fCount;
                
                vec3 ambientGlow = vec3(0.0);
                float ambientWeightSum = 0.0;
                
                for(int i = 0; i < MAX_COLORS; i++) {
                    if (i < uColorCount) {
                        float pOffset = phase + float(i) * phaseStep;
                        float slowOffset = slowPhase + float(i) * phaseStep;
                        
                        if (uGlowStyle == 0) {
                            // ORBIT STYLE
                            float orb = pow(0.5 + 0.5 * cos(pOffset), 6.0); // Smooth wide bleed
                            orb += pow(0.5 + 0.5 * cos(pOffset), 16.0);    // Focused bright center
                            
                            currentGlow += uColors[i] * orb;
                            whiteHotTotal += pow(0.5 + 0.5 * cos(pOffset), 40.0);
                        } else {
                            // AMBIENT STYLE
                            float pwr = fCount > 2.5 ? 2.0 : 1.0;
                            float weight = pow(0.5 + 0.5 * cos(slowOffset), pwr);
                            
                            ambientGlow += uColors[i] * weight;
                            ambientWeightSum += weight;
                        }

                        sumColor += uColors[i];
                    }
                }
                
                if (uGlowStyle == 1) {
                    currentGlow = (ambientGlow / max(ambientWeightSum, 0.001)) * 1.2;
                } else {
                    currentGlow += (sumColor / fCount) * 0.24;
                }

                // Combine structural layers
                vec3 totalGlow = currentGlow * aura;
                
                if (uGlowStyle == 0) {
                    totalGlow += currentGlow * core * 1.8;
                    
                    vec3 whiteHot = vec3(1.0) * whiteHotTotal * pow(coreRadius * 0.7 / (absD + coreRadius * 0.7), 3.0);
                    totalGlow += whiteHot;
                } else {
                    totalGlow += currentGlow * core * 1.2;
                }

                // Calculate glow intensity to use as an alpha mask
                float glowAlpha = max(max(totalGlow.r, totalGlow.g), totalGlow.b);
                float blendAlpha = clamp(glowAlpha, 0.0, 1.0);
                
                // Normalize the glow color
                vec3 overlayGlow = totalGlow / max(blendAlpha, 0.00001);

                // Dynamically Output Based on Solid BG or Transparent Fitting
                float outAlpha = baseAlpha + blendAlpha - baseAlpha * blendAlpha;
                vec3 outColor = vec3(0.0);
                
                if (outAlpha > 0.0) {
                    outColor = (overlayGlow * blendAlpha + finalCol * baseAlpha * (1.0 - blendAlpha)) / outAlpha;
                }

                gl_FragColor = vec4(outColor, outAlpha);
            }
        `

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2() },
                uDpr: { value: dpr },
                uBoxDim: { value: new THREE.Vector2() },
                uBoxCenter: { value: new THREE.Vector2() },
                uHasBg: { value: 1.0 },

                // Aesthetic
                uColors: {
                    value: Array.from({ length: 16 }, () => new THREE.Color()),
                },
                uColorCount: { value: 0 },
                uGlowStyle: { value: 0 },
                uBgColor: { value: new THREE.Color() },

                uBoxR: { value: 0 },
                uSpeed: { value: 0 },
                uAuraSize: { value: 0 },
                uCoreSize: { value: 0 },

                // Background Grid
                uShowGrid: { value: 0 },
                uGridColor: { value: new THREE.Color() },
                uGridSize: { value: 0 },
                uGridDotSize: { value: 0 },
                uGridOpacity: { value: 0 },
            },
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: fragmentShader,
            transparent: true,
        })

        materialRef.current = material
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        const el = renderer.domElement
        el.style.position = "absolute"
        el.style.pointerEvents = "none"
        el.style.zIndex = "0"
        mountRef.current.appendChild(el)

        const updateSize = () => {
            if (!mountRef.current || !childWrapperRef.current) return

            const activeProps = propsRef.current
            const hasBg = activeProps.hasBackground

            const mountRect = mountRef.current.getBoundingClientRect()
            const childNode = childWrapperRef.current.children[0]

            let childRect = childNode
                ? childNode.getBoundingClientRect()
                : {
                      width: 160,
                      height: 160,
                      left: mountRect.left + mountRect.width / 2 - 80,
                      top: mountRect.top + mountRect.height / 2 - 80,
                  }

            // If background is toggled off, we expand the canvas size dynamically
            // so that WebGL does not clip the aura bounding box.
            const padding = hasBg ? 0 : (activeProps.auraSize + 50) * 1.5

            const canvasWidth = hasBg
                ? mountRect.width
                : childRect.width + padding * 2
            const canvasHeight = hasBg
                ? mountRect.height
                : childRect.height + padding * 2

            renderer.setSize(canvasWidth, canvasHeight)

            if (!hasBg) {
                const offsetLeft = childRect.left - mountRect.left - padding
                const offsetTop = childRect.top - mountRect.top - padding
                el.style.left = `${offsetLeft}px`
                el.style.top = `${offsetTop}px`
                el.style.width = `${canvasWidth}px`
                el.style.height = `${canvasHeight}px`
            } else {
                el.style.left = `0px`
                el.style.top = `0px`
                el.style.width = `${canvasWidth}px`
                el.style.height = `${canvasHeight}px`
            }

            if (materialRef.current) {
                materialRef.current.uniforms.uResolution.value.set(
                    canvasWidth * dpr,
                    canvasHeight * dpr
                )

                const canvasCx = hasBg
                    ? mountRect.left + mountRect.width / 2
                    : childRect.left + childRect.width / 2

                const canvasCy = hasBg
                    ? mountRect.top + mountRect.height / 2
                    : childRect.top + childRect.height / 2

                const childCx = childRect.left + childRect.width / 2
                const childCy = childRect.top + childRect.height / 2

                const ox = (childCx - canvasCx) * dpr
                const oy = -(childCy - canvasCy) * dpr // Y inverted WebGL

                materialRef.current.uniforms.uBoxCenter.value.set(ox, oy)
                materialRef.current.uniforms.uBoxDim.value.set(
                    (childRect.width / 2) * dpr,
                    (childRect.height / 2) * dpr
                )
            }

            const isPlaying = propsRef.current.livePreview || !isStatic
            if (!isPlaying) renderer.render(scene, camera)
        }

        const resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(mountRef.current)
        if (childWrapperRef.current)
            resizeObserver.observe(childWrapperRef.current)

        setTimeout(updateSize, 0)

        let isIntersecting = true
        const intersectionObserver = new IntersectionObserver(([e]) => {
            isIntersecting = e.isIntersecting
        })
        intersectionObserver.observe(mountRef.current)

        let reqId
        let clock = new THREE.Clock()
        let prevHasBg = propsRef.current.hasBackground

        const animate = () => {
            reqId = requestAnimationFrame(animate)

            if (!isIntersecting && !isStatic) return

            const activeProps = propsRef.current

            // Adjusts sizing instantly inside Framer toggles without needing layouts to shift.
            if (activeProps.hasBackground !== prevHasBg) {
                prevHasBg = activeProps.hasBackground
                updateSize()
            }

            const isPlaying = activeProps.livePreview || !isStatic

            const dt = clock.getDelta()

            if (materialRef.current) {
                if (isPlaying && isIntersecting) {
                    materialRef.current.uniforms.uTime.value += dt
                }

                const u = materialRef.current.uniforms

                // SYNC PROPS
                const colorsList = activeProps.colors || ["#00E5FF", "#FF0073"]
                const count = Math.min(colorsList.length, 16)
                u.uColorCount.value = count
                for (let i = 0; i < count; i++) {
                    u.uColors.value[i].set(colorsList[i])
                }

                u.uHasBg.value = activeProps.hasBackground ? 1.0 : 0.0
                u.uGlowStyle.value = activeProps.glowStyle === "ambient" ? 1 : 0
                u.uBgColor.value.set(activeProps.bgColor)
                u.uBoxR.value = activeProps.boxRadius
                u.uSpeed.value = activeProps.speed
                u.uAuraSize.value = activeProps.auraSize
                u.uCoreSize.value = activeProps.coreSize

                u.uShowGrid.value = activeProps.showGrid ? 1.0 : 0.0
                u.uGridColor.value.set(activeProps.gridColor)
                u.uGridSize.value = activeProps.gridSize
                u.uGridDotSize.value = activeProps.gridDotSize
                u.uGridOpacity.value = activeProps.gridOpacity
            }

            if ((isPlaying && isIntersecting) || isStatic) {
                renderer.render(scene, camera)
            }
        }

        animate()

        return () => {
            cancelAnimationFrame(reqId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            geometry.dispose()
            material.dispose()
            renderer.dispose()
            if (mountRef.current && mountRef.current.contains(el)) {
                mountRef.current.removeChild(el)
            }
        }
    }, [])

    return (
        <div
            ref={mountRef}
            style={{
                width: props.hasBackground ? "100%" : "max-content",
                height: props.hasBackground ? "100%" : "max-content",
                position: "relative",
                backgroundColor: props.hasBackground
                    ? props.bgColor
                    : "transparent",
                overflow: "visible",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                ref={childWrapperRef}
                style={{
                    position: props.hasBackground ? "absolute" : "relative",
                    inset: props.hasBackground ? 0 : "auto",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: props.hasBackground ? "100%" : "max-content",
                    height: props.hasBackground ? "100%" : "max-content",
                    overflow: "visible",
                }}
            >
                {props.children}
            </div>
        </div>
    )
}

LiquidConnection.defaultProps = {
    livePreview: true,
    hasBackground: true,
    children: null,
    appearance: {
        glowStyle: "orbit",
        colors: ["#00E5FF", "#FF0073"],
        bgColor: "#09090b",
        speed: 0.5,
        auraSize: 80,
        coreSize: 4,
        boxRadius: 16,
    },
    bg: {
        showGrid: true,
        gridColor: "#ffffff",
        gridSize: 22,
        gridDotSize: 0.35,
        gridOpacity: 0.05,
    },
}

addPropertyControls(LiquidConnection, {
    livePreview: { title: "Live Preview", type: ControlType.Boolean },
    hasBackground: {
        title: "Optional BG",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    children: { title: "Connect Card", type: ControlType.ComponentInstance },
    appearance: {
        title: "Appearance",
        type: ControlType.Object,
        controls: {
            glowStyle: {
                title: "Glow Style",
                type: ControlType.Enum,
                options: ["orbit", "ambient"],
                optionTitles: ["Orbit Sweep", "Ambient Light"],
                defaultValue: "orbit",
            },
            colors: {
                title: "Glow Colors",
                type: ControlType.Array,
                control: { type: ControlType.Color },
            },
            bgColor: { title: "Background", type: ControlType.Color },
            speed: {
                title: "Anim Speed",
                type: ControlType.Number,
                min: 0.1,
                max: 5.0,
                step: 0.1,
            },
            auraSize: {
                title: "Aura Spread",
                type: ControlType.Number,
                min: 10,
                max: 300,
                step: 1,
            },
            coreSize: {
                title: "Line Thickness",
                type: ControlType.Number,
                min: 1,
                max: 100,
                step: 1,
            },
            boxRadius: {
                title: "Match Radius",
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
            },
        },
    },
    bg: {
        title: "Grid Texture",
        type: ControlType.Object,
        controls: {
            showGrid: { title: "Show Dot Grid", type: ControlType.Boolean },
            gridColor: { title: "Grid Color", type: ControlType.Color },
            gridSize: {
                title: "Cell Sizing",
                type: ControlType.Number,
                min: 0,
                max: 150,
                step: 1,
            },
            gridDotSize: {
                title: "Dot Scale",
                type: ControlType.Number,
                min: 0.05,
                max: 1.0,
                step: 0.05,
            },
            gridOpacity: {
                title: "Grid Visibility",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
    },
})
