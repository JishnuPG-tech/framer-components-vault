import * as React from "react"
import { useRef, useEffect, useCallback } from "react"
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


export interface PremiumShaderButtonProps {
    link?: string
    text: string
    textFont: React.CSSProperties
    padding: string
    baseColor: string
    glassColor: string
    hoverSpeed: number
    borderRadius: number
    livePreview: boolean
    onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
}

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform float uHover;
uniform float uClick;
uniform vec3 uBaseColor;
uniform vec3 uGlassColor;
uniform vec2 uResolution;

// Hash function for pseudo-randomness
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Simplex-style noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Fractal Brownian Motion for liquid distortion
float fbm(vec2 p) {
    float f = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++) {
        f += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return f;
}

void main() {
    // Aspect-corrected coordinates for perfect pill shape math
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vUv * 2.0 - 1.0;
    p.x *= aspect;

    // Center calculations for the liquid click surge
    vec2 center = vec2(0.5);
    vec2 dirToCenter = normalize(vUv - center + vec2(0.0001));
    float distToCenter = length(vUv - center);

    // 1. SDF (Signed Distance Field) for a Pill Shape
    float r = 1.0; 
    vec2 b = vec2(max(aspect - 1.0, 0.0), 0.0);
    vec2 d = abs(p) - b;
    float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
    
    // Normalized distance from edge (0 = edge, 1 = center)
    float innerDist = clamp(abs(dist), 0.0, 1.0);

    // 2. Dynamic Liquid Noise Field
    float t = uTime;
    
    // Stretch noise horizontally
    vec2 noiseUv = vUv * vec2(2.0, 1.0); 
    
    // Dynamic warping on hover + Liquid Surge on Click
    vec2 warp = vec2(fbm(noiseUv + t * 0.5), fbm(noiseUv + t * 0.5 + 12.34)) * mix(0.0, 0.4, uHover);
    warp -= dirToCenter * uClick * 0.25 * smoothstep(0.8, 0.0, distToCenter); 
    
    float n1 = fbm(noiseUv + warp + vec2(t, 0.0));
    float n2 = fbm(noiseUv + warp + vec2(n1, t * 1.2));

    // 3. Glassy Rim & Specular Highlights
    float rimWidth = mix(0.15, 0.35, n2) * mix(1.0, 1.4, uHover);
    rimWidth += uClick * 0.15; // Rim expands on click
    float rim = smoothstep(rimWidth, 0.0, innerDist);
    
    float specDist = abs(innerDist - 0.12 + n1 * 0.08);
    float specular = smoothstep(0.03, 0.0, specDist);

    float rightBias = smoothstep(0.2, 1.0, vUv.x);
    rim *= mix(0.6, 1.5, rightBias);
    specular *= mix(0.5, 2.0, rightBias);

    // 4. Highly Dynamic Stars / Particles
    vec2 starUv = vUv * vec2(aspect * 6.0, 6.0);
    
    // Drift uses the accumulated uTime so it accelerates smoothly without jumping
    starUv.x -= uTime * 0.2; 
    starUv.y += sin(uTime * 0.5 + starUv.x) * mix(0.2, 0.6, uHover); 
    
    // Star Burst on Click
    starUv += dirToCenter * uClick * 1.5;

    vec2 id = floor(starUv);
    vec2 gv = fract(starUv) - 0.5;
    float nStar = hash(id);
    float star = 0.0;
    
    float starThreshold = mix(0.94, 0.86, uHover); 
    
    if (nStar > starThreshold) { 
        // Randomize size per star
        float sizeMod = mix(0.5, 2.5, hash(id + 13.37)); 
        
        // Local micro-movements (wiggling inside their cell on hover)
        vec2 localWiggle = vec2(
            sin(uTime * 2.0 + nStar * 50.0),
            cos(uTime * 2.3 + nStar * 40.0)
        ) * 0.25 * uHover;

        float starDist = length(gv - localWiggle) * sizeMod;
        
        // Core brightness + Outer glow
        star = smoothstep(0.12, 0.0, starDist);
        star += smoothstep(0.25, 0.0, starDist) * 0.3;

        // Twinkle phase uses accumulated time to naturally speed up
        float twinklePhase = uTime * mix(5.0, 15.0, hash(id + 42.0));
        star *= sin(twinklePhase + nStar * 100.0) * 0.5 + 0.5; 
        
        // Fade stars out near the edge
        star *= smoothstep(0.05, 0.2, innerDist); 
    }

    // 5. Compositing
    vec3 color = uBaseColor;
    
    float innerLiquid = smoothstep(0.2, 0.9, n2) * (1.0 - innerDist) * mix(0.2, 0.45, uHover);
    color += uGlassColor * innerLiquid;
    
    color += uGlassColor * rim * mix(0.6, 1.2, uHover);
    color += vec3(1.0) * specular * mix(0.8, 2.0, uHover);
    
    color += vec3(1.0) * star * mix(0.8, 1.5, uHover);

    // Click Flash Effects
    color += uGlassColor * rim * uClick * 0.8;
    color += vec3(1.0) * specular * uClick * 1.5;
    color += uGlassColor * exp(-distToCenter * 6.0) * uClick * 0.6; // Volumetric center glow

    color *= smoothstep(1.5, 0.2, length(vUv - 0.5));

    gl_FragColor = vec4(color, 1.0);
}
`

export default function PremiumShaderButton(props: PremiumShaderButtonProps) {
    const {
        text = "Get Started",
        textFont = {},
        padding = "24px 48px 24px 48px",
        baseColor = "#000000",
        glassColor = "#C2C2C2",
        hoverSpeed = 0.6,
        borderRadius = 999,
        livePreview = false,
        onClick,
        link,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const hoverRef = useRef<number>(0)
    const clickRef = useRef<number>(0)
    // Ref points to semantic interactive element (either a or button)
    const outerRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null)

    // Store references to shader uniforms so we don't recreate the material for prop changes
    const uniformsRef = useRef({
        uTime: { value: 0 },
        uHover: { value: 0 },
        uClick: { value: 0 },
        uBaseColor: { value: new THREE.Color() },
        uGlassColor: { value: new THREE.Color() },
        uResolution: { value: new THREE.Vector2(1, 1) },
    })

    // Update uniform colors when props change
    useEffect(() => {
        if (isStatic) return
        uniformsRef.current.uBaseColor.value.set(baseColor)
        uniformsRef.current.uGlassColor.value.set(glassColor)
    }, [baseColor, glassColor, isStatic])

    // Vanilla three.js loop & setup inside useEffect
    useEffect(() => {
        if (isStatic) return

        const container = containerRef.current
        if (!container) return

        const scene = new THREE.Scene()
        // Orthographic camera ensures the shader plane fits perfectly 2D without perspective distortion
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        container.appendChild(renderer.domElement)

        const geometry = new THREE.PlaneGeometry(2, 2)
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: uniformsRef.current,
            transparent: true,
        })
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        let animationFrameId: number
        let timeAccumulator = 0
        let lastTime = performance.now()
        let isIntersecting = false

        let currentHoverValue = 0
        let currentClickValue = 0

        const renderLoop = (time: number) => {
            animationFrameId = requestAnimationFrame(renderLoop)

            // Canvas freezing strategy: only render if onscreen or the user enables live preview overriding
            if (!isIntersecting && !livePreview) {
                lastTime = time
                return
            }

            const delta = (time - lastTime) / 1000
            lastTime = time

            // Smoothly interpolate hover state targeting
            const targetHover = hoverRef.current
            currentHoverValue = THREE.MathUtils.lerp(
                currentHoverValue,
                targetHover,
                delta * 4
            )

            // Consume click trigger
            if (clickRef.current > 0) {
                currentClickValue = clickRef.current
                clickRef.current = 0
            }

            // Fade click effect
            currentClickValue = THREE.MathUtils.lerp(
                currentClickValue,
                0,
                delta * 6
            )

            // Accumulate time based dynamically on hover speed to prevent jumping
            const currentSpeed = THREE.MathUtils.lerp(
                0.15,
                hoverSpeed,
                currentHoverValue
            )
            timeAccumulator += delta * currentSpeed

            uniformsRef.current.uTime.value = timeAccumulator
            uniformsRef.current.uHover.value = currentHoverValue
            uniformsRef.current.uClick.value = currentClickValue

            renderer.render(scene, camera)
        }

        animationFrameId = requestAnimationFrame(renderLoop)

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                renderer.setSize(width, height)
                uniformsRef.current.uResolution.value.set(width, height)
            }
        })
        resizeObserver.observe(container)

        const intersectionObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                isIntersecting = entry.isIntersecting
            }
        })
        intersectionObserver.observe(container)

        return () => {
            cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            geometry.dispose()
            material.dispose()
            renderer.dispose()
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [livePreview, hoverSpeed, isStatic])

    const isLink = Boolean(link && link !== "")

    const handleMouseDownEvt = useCallback((e: React.MouseEvent) => {
        clickRef.current = 1.0
        if (outerRef.current) {
            outerRef.current.style.transform = "scale(0.96)"
        }
    }, [])

    const handleMouseUpEvt = useCallback(() => {
        if (outerRef.current) {
            outerRef.current.style.transform = "scale(1)"
        }
    }, [])

    const handleMouseEnterEvt = useCallback(() => {
        hoverRef.current = 1
        if (outerRef.current) {
            outerRef.current.style.zIndex = "10"
        }
    }, [])

    const handleMouseLeaveEvt = useCallback(() => {
        hoverRef.current = 0
        if (outerRef.current) {
            outerRef.current.style.transform = "scale(1)"
            outerRef.current.style.zIndex = "1"
        }
    }, [])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                clickRef.current = 1.0

                // Visual click scale simulation
                if (outerRef.current) {
                    outerRef.current.style.transform = "scale(0.96)"
                    setTimeout(() => {
                        if (outerRef.current) {
                            outerRef.current.style.transform = "scale(1)"
                        }
                    }, 150)
                }

                if (onClick) {
                    onClick(e as any)
                } else if (
                    isLink &&
                    outerRef.current &&
                    outerRef.current instanceof HTMLAnchorElement
                ) {
                    outerRef.current.click()
                }
            }
        },
        [onClick, isLink]
    )

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        borderRadius: borderRadius,
        cursor: "pointer",
        padding: padding,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        backgroundColor: baseColor,
        boxShadow:
            "inset 0 0 0 1px rgba(255, 255, 255, 0.15), 0 10px 30px -10px rgba(0,0,0,0.5)",
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), z-index 0s",
        zIndex: 1,
        textDecoration: "none",
        outline: "none",
        border: "none",
        margin: 0,
        fontFamily: "inherit",
    }

    const content = (
        <>
            {/* Conditional webgl mount target to prevent unnecessary SSR elements */}
            {!isStatic && (
                <div
                    ref={containerRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 0,
                        borderRadius: borderRadius,
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Overlay html safely stacked above */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    color: "white",
                    pointerEvents: "none",
                    textAlign: "center",
                    textShadow: "0px 2px 10px rgba(255,255,255,0.3)",
                    ...textFont,
                }}
            >
                {text}
            </div>
        </>
    )

    if (isLink) {
        return (
            <a
                href={link}
                ref={outerRef as React.Ref<HTMLAnchorElement>}
                style={containerStyle}
                onMouseEnter={handleMouseEnterEvt}
                onMouseLeave={handleMouseLeaveEvt}
                onMouseDown={handleMouseDownEvt}
                onMouseUp={handleMouseUpEvt}
                onClick={onClick as any}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
            >
                {content}
            </a>
        )
    }

    return (
        <button
            ref={outerRef as React.Ref<HTMLButtonElement>}
            style={containerStyle}
            onMouseEnter={handleMouseEnterEvt}
            onMouseLeave={handleMouseLeaveEvt}
            onMouseDown={handleMouseDownEvt}
            onMouseUp={handleMouseUpEvt}
            onClick={onClick as any}
            onKeyDown={handleKeyDown}
        >
            {content}
        </button>
    )
}

addPropertyControls(PremiumShaderButton, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: false,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Get Started",
    },
    textFont: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: {
            fontFamily: "Aileron",
            fontSize: "24px",
            variant: "600",
            letterSpacing: "0.01em",
            lineHeight: "1.5em",
            textAlign: "left",
        },
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "24px 48px 24px 48px",
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#000000",
    },
    glassColor: {
        type: ControlType.Color,
        title: "Glass Color",
        defaultValue: "#C2C2C2",
    },
    hoverSpeed: {
        type: ControlType.Number,
        title: "Hover Speed",
        defaultValue: 0.6,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
    },
})
