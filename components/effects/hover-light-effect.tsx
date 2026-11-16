import * as React from "react"
import { useRef, useEffect, useMemo } from "react"
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


export default function PremiumEdgeSpotlight(incomingProps) {
    // STEP 1: Intercept & Flatten Framer grouped properties
    const props = {
        ...incomingProps,
        ...(incomingProps.visuals || {}),
        ...(incomingProps.layout || {}),
        ...(incomingProps.physics || {}),
    }

    const containerRef = useRef(null)
    const glowRef = useRef(null)
    const ambientGlowRef = useRef(null)

    // Interaction State
    const targetMouse = useRef({ x: -999, y: -999, isHovering: false })
    const currentMouse = useRef({
        opacity: 0,
        edgeX: -999,
        edgeY: -999,
    })

    const handlePointerEnter = (e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        targetMouse.current.x = x
        targetMouse.current.y = y
        targetMouse.current.isHovering = true
    }

    const handlePointerMove = (e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        targetMouse.current.x = e.clientX - rect.left
        targetMouse.current.y = e.clientY - rect.top
        targetMouse.current.isHovering = true
    }

    const handlePointerLeave = () => {
        targetMouse.current.isHovering = false
    }

    // Safely track color string to trigger re-renders only when it changes
    const colorString = props.glowColor || "rgba(255, 185, 80, 1)"

    // Strict WebGL Lifecycle & Animation Loop
    useEffect(() => {
        if (
            !containerRef.current ||
            !glowRef.current ||
            !ambientGlowRef.current
        )
            return

        let frameId
        let isIntersecting = true

        const observer = new IntersectionObserver(
            ([entry]) => {
                isIntersecting = entry.isIntersecting
            },
            { rootMargin: "500px" }
        )
        observer.observe(containerRef.current)

        // --- GLSL SHADER DEFINITIONS ---
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `

        const fragmentShader = `
            uniform vec3 uColor;
            uniform vec2 uLightPos;
            uniform float uSpread;
            uniform float uOpacity;
            uniform vec2 uResolution;
            
            varying vec2 vUv;
            
            void main() {
                // Convert UV to logical pixel coordinates
                vec2 pixelPos = vUv * uResolution;
                
                // Calculate distance to edge light
                float dist = distance(pixelPos, uLightPos);
                
                // Normalize distance based on the spread radius
                float t = clamp(dist / uSpread, 0.0, 1.0);
                
                // Premium non-linear falloff
                float alpha = pow(1.0 - t, 1.5) * uOpacity;
                
                gl_FragColor = vec4(uColor, alpha);
            }
        `

        // --- WEBGL INSTANCE SETUP FACTORY ---
        const createWebGLContext = (container, isAmbient) => {
            const renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: false, // Not needed for pure gradient shaders
                powerPreference: "high-performance",
            })
            renderer.setPixelRatio(window.devicePixelRatio || 1)

            renderer.domElement.style.width = "100%"
            renderer.domElement.style.height = "100%"
            renderer.domElement.style.position = "absolute"
            renderer.domElement.style.top = "0"
            renderer.domElement.style.left = "0"

            container.appendChild(renderer.domElement)

            const scene = new THREE.Scene()
            // Orthographic camera covering exactly -1 to 1 for the full-screen plane
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
            const geometry = new THREE.PlaneGeometry(2, 2)

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uColor: { value: new THREE.Color() },
                    uLightPos: { value: new THREE.Vector2(-999, -999) },
                    uSpread: {
                        value: isAmbient
                            ? props.glowSpread * 1.5
                            : props.glowSpread * 0.8,
                    },
                    uOpacity: { value: 0.0 },
                    uResolution: { value: new THREE.Vector2(100, 100) },
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending,
            })

            scene.add(new THREE.Mesh(geometry, material))

            return { renderer, scene, camera, material, geometry }
        }

        const ctxAmbient = createWebGLContext(ambientGlowRef.current, true)
        const ctxBorder = createWebGLContext(glowRef.current, false)

        // --- COLOR RESOLUTION ---
        const getRealColor = (colorStr) => {
            if (!colorStr) return "#ffffff"
            if (colorStr.startsWith("#")) return colorStr
            const temp = document.createElement("div")
            temp.style.color = colorStr
            temp.style.display = "none"
            document.body.appendChild(temp)
            const resolved = window.getComputedStyle(temp).color
            document.body.removeChild(temp)
            return resolved
        }

        const parsedColor = new THREE.Color(getRealColor(colorString))

        ctxAmbient.material.uniforms.uColor.value = parsedColor
        ctxBorder.material.uniforms.uColor.value = parsedColor

        // --- RESPONSIVE RESIZING ---
        let w = containerRef.current.clientWidth || 100
        let h = containerRef.current.clientHeight || 100
        let bw = props.borderWidth
        let aw = w + bw * 2
        let ah = h + bw * 2

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                w = entry.contentRect.width
                h = entry.contentRect.height
                bw = props.borderWidth
                aw = w + bw * 2
                ah = h + bw * 2

                ctxAmbient.renderer.setSize(aw, ah, false)
                ctxAmbient.material.uniforms.uResolution.value.set(aw, ah)

                ctxBorder.renderer.setSize(w, h, false)
                ctxBorder.material.uniforms.uResolution.value.set(w, h)
            }
        })
        resizeObserver.observe(containerRef.current)

        // --- RENDER LOOP ---
        const animate = () => {
            frameId = requestAnimationFrame(animate)

            const tm = targetMouse.current
            const cm = currentMouse.current

            if (!isIntersecting && cm.opacity <= 0.01) return

            if (tm.x !== -999) {
                // --- LOCALIZED EDGE HOVER LOGIC ---
                const distLeft = tm.x
                const distRight = w - tm.x
                const distTop = tm.y
                const distBottom = h - tm.y
                const tmMinDist = Math.min(
                    distLeft,
                    distRight,
                    distTop,
                    distBottom
                )

                // Only trigger hover if strictly within the edge threshold distance
                const isNearEdge = tmMinDist <= props.edgeThreshold
                const targetOpacity = tm.isHovering && isNearEdge ? 1 : 0

                // Calculate the TARGET edge coordinate (removes immediate snapping jump)
                let targetEdgeX = Math.max(0, Math.min(w, tm.x))
                let targetEdgeY = Math.max(0, Math.min(h, tm.y))

                // If mouse is inside the box, target snaps to strictly closest edge
                if (tm.x > 0 && tm.x < w && tm.y > 0 && tm.y < h) {
                    if (tmMinDist === distLeft) targetEdgeX = 0
                    else if (tmMinDist === distRight) targetEdgeX = w
                    else if (tmMinDist === distTop) targetEdgeY = 0
                    else if (tmMinDist === distBottom) targetEdgeY = h
                }

                // Initialize if first hover
                if (cm.edgeX === -999) {
                    cm.edgeX = targetEdgeX
                    cm.edgeY = targetEdgeY
                }

                // --- DAMPING PHYSICS (SMOOTH MOVEMENT) ---
                const dampFactor = props.damping

                // Smoothly animate the current edge towards the target edge
                cm.edgeX += (targetEdgeX - cm.edgeX) * dampFactor
                cm.edgeY += (targetEdgeY - cm.edgeY) * dampFactor
                cm.opacity += (targetOpacity - cm.opacity) * (dampFactor * 1.5)
            }

            // --- UPDATE SHADER UNIFORMS ---
            // Three.js Y-axis is flipped relative to DOM

            // Border Canvas matches container exactly
            ctxBorder.material.uniforms.uLightPos.value.set(
                cm.edgeX,
                h - cm.edgeY
            )
            ctxBorder.material.uniforms.uOpacity.value = cm.opacity
            ctxBorder.renderer.render(ctxBorder.scene, ctxBorder.camera)

            // Ambient Canvas is padded by borderWidth
            ctxAmbient.material.uniforms.uLightPos.value.set(
                cm.edgeX + bw,
                ah - (cm.edgeY + bw)
            )
            ctxAmbient.material.uniforms.uOpacity.value = cm.opacity
            ctxAmbient.renderer.render(ctxAmbient.scene, ctxAmbient.camera)
        }

        frameId = requestAnimationFrame(animate)

        // Strict Cleanup Routine to prevent Framer Canvas Crashes
        return () => {
            cancelAnimationFrame(frameId)
            observer.disconnect()
            resizeObserver.disconnect()
            ;[ctxAmbient, ctxBorder].forEach((ctx) => {
                ctx.geometry.dispose()
                ctx.material.dispose()
                ctx.scene.clear()
                ctx.renderer.forceContextLoss()
                ctx.renderer.dispose()
            })

            if (
                ambientGlowRef.current &&
                ambientGlowRef.current.contains(ctxAmbient.renderer.domElement)
            ) {
                ambientGlowRef.current.removeChild(
                    ctxAmbient.renderer.domElement
                )
            }
            if (
                glowRef.current &&
                glowRef.current.contains(ctxBorder.renderer.domElement)
            ) {
                glowRef.current.removeChild(ctxBorder.renderer.domElement)
            }
        }
    }, [
        props.damping,
        props.edgeThreshold,
        props.glowSpread,
        props.borderWidth,
        colorString,
    ])

    const content = props.children || (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "sans-serif",
                fontSize: 14,
                background: "rgba(255,255,255,0.03)",
            }}
        >
            Connect UI/Frame
        </div>
    )

    return (
        <div
            ref={containerRef}
            onPointerEnter={handlePointerEnter}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {/* Ambient Overflow Spill (Premium GLSL Nearby Light Spread) */}
            <div
                style={{
                    position: "absolute",
                    inset: -props.borderWidth,
                    borderRadius: props.borderRadius,
                    filter: "blur(24px)", // Premium optical softening over the GLSL gradient
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            >
                {/* Canvas attaches here */}
                <div
                    ref={ambientGlowRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "inherit",
                        overflow: "hidden",
                    }}
                />
            </div>

            {/* Base Layer: The Connected Framer UI (zIndex: 1) */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    height: "100%",
                    borderRadius: props.borderRadius,
                    overflow: "hidden",
                    backgroundColor: props.frameBackground,
                }}
            >
                {content}
            </div>

            {/* Glowing Border Spotlight Mask (Sharp Inner Edge) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: props.borderRadius,
                    pointerEvents: "none",
                    padding: props.borderWidth,
                    background: props.baseBorderColor,
                    zIndex: 2,
                    WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                    WebkitMaskComposite: "xor",
                    mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                    maskComposite: "exclude",
                    boxSizing: "border-box",
                }}
            >
                {/* Canvas attaches here */}
                <div
                    ref={glowRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "inherit",
                        overflow: "hidden",
                    }}
                />
            </div>
        </div>
    )
}

// STEP 2: Nested Defaults
PremiumEdgeSpotlight.defaultProps = {
    children: null,
    visuals: {
        glowColor: "rgba(255, 185, 80, 1)",
        baseBorderColor: "rgba(255, 255, 255, 0.08)",
        frameBackground: "#1A1A1A",
        glowSpread: 150,
    },
    layout: {
        borderRadius: 24,
        borderWidth: 1,
    },
    physics: {
        damping: 0.15,
        edgeThreshold: 60,
    },
}

// STEP 3: Framer Property Controls
addPropertyControls(PremiumEdgeSpotlight, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    visuals: {
        type: ControlType.Object,
        title: "Visuals",
        controls: {
            glowColor: {
                type: ControlType.Color,
                title: "Glow Color",
            },
            baseBorderColor: { type: ControlType.Color, title: "Base Outline" },
            frameBackground: { type: ControlType.Color, title: "Backdrop" },
            glowSpread: {
                type: ControlType.Number,
                title: "Light Spread",
                min: 40,
                max: 800,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            borderRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 100,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Stroke Width",
                min: 1,
                max: 10,
            },
        },
    },
    physics: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            edgeThreshold: {
                type: ControlType.Number,
                title: "Edge Area",
                min: 10,
                max: 300,
                step: 1,
            },
            damping: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 0.01,
                max: 1.0,
                step: 0.01,
                displaySegmentedControl: false,
            },
        },
    },
})
