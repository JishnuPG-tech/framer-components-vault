// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"

interface Props {
    maskRadius: number
    maskSpeed: number
    mouseSmoothness: number
    radiusSmoothness: number
    turbulenceIntensity: number
    lensColor: string
}

export default function InversionLens({
    maskRadius = 0.15,
    maskSpeed = 0.75,
    mouseSmoothness = 0.05,
    radiusSmoothness = 0.1,
    turbulenceIntensity = 0.06,
    lensColor = "#ffffff",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cleanupRef = useRef<() => void>()

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        const script = document.createElement("script")
        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        script.async = true

        script.onload = () => {
            if (typeof window.THREE === "undefined") return

            const THREE = window.THREE
            const canvas = canvasRef.current
            const container = containerRef.current
            if (!canvas || !container) return

            let scene: any
            let camera: any
            let renderer: any
            let uniforms: any
            let animationId: number

            const targetMouse = new THREE.Vector2(0.5, 0.5)
            const lerpedMouse = new THREE.Vector2(0.5, 0.5)
            let targetRadius = 0.0

            const setupScene = () => {
                const containerWidth = container.clientWidth
                const containerHeight = container.clientHeight

                scene = new THREE.Scene()
                camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

                const vertexShader = `
                    varying vec2 v_uv;
                    
                    void main() {
                        v_uv = uv;
                        gl_Position = vec4(position, 1.0);
                    }
                `

                const fragmentShader = `
                    precision highp float;

                    uniform vec2 u_mouse;
                    uniform float u_time;
                    uniform vec2 u_resolution;
                    uniform float u_radius;
                    uniform float u_speed;
                    uniform float u_turbulenceIntensity;
                    uniform vec3 u_color;

                    varying vec2 v_uv;

                    float hash(vec2 p) {
                        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                    }

                    float noise(vec2 p) {
                        vec2 i = floor(p);
                        vec2 f = fract(p);
                        vec2 u = f * f * (3.0 - 2.0 * f);
                        return mix(
                            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                            u.y
                        );
                    }

                    float turbulence(vec2 p) {
                        float t = 0.0;
                        float w = 0.5;
                        for (int i = 0; i < 8; i++) {
                            t += abs(noise(p)) * w;
                            p *= 2.0;
                            w *= 0.5;
                        }
                        return t;
                    }

                    void main() {
                        vec2 uv = v_uv;
                        float screenAspect = u_resolution.x / u_resolution.y;

                        vec2 correctedUV = uv;
                        correctedUV.x *= screenAspect;
                        vec2 correctedMouse = u_mouse;
                        correctedMouse.x *= screenAspect;

                        float dist = distance(correctedUV, correctedMouse);
                        
                        float jaggedDist = dist + (turbulence(uv * 25.0 + u_time * u_speed) - 0.5) * u_turbulenceIntensity;
                        
                        float mask = step(jaggedDist, u_radius);

                        gl_FragColor = vec4(u_color, mask);
                    }
                `

                uniforms = {
                    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
                    u_time: { value: 0.0 },
                    u_resolution: {
                        value: new THREE.Vector2(
                            containerWidth,
                            containerHeight
                        ),
                    },
                    u_radius: { value: 0.0 },
                    u_speed: { value: maskSpeed },
                    u_turbulenceIntensity: { value: turbulenceIntensity },
                    u_color: { value: new THREE.Color(lensColor) },
                }

                const geometry = new THREE.PlaneGeometry(2, 2)
                const material = new THREE.ShaderMaterial({
                    uniforms,
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                })

                const mesh = new THREE.Mesh(geometry, material)
                scene.add(mesh)

                renderer = new THREE.WebGLRenderer({
                    canvas: canvas,
                    antialias: true,
                    alpha: true,
                })
                renderer.setClearColor(0x000000, 0)
                renderer.setPixelRatio(window.devicePixelRatio)
                renderer.setSize(containerWidth, containerHeight)
            }

            const handleMouseMove = (e: MouseEvent) => {
                if (!container) return
                const rect = container.getBoundingClientRect()
                const inside =
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom

                if (inside) {
                    targetMouse.x = (e.clientX - rect.left) / rect.width
                    targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height
                    targetRadius = maskRadius
                } else {
                    targetRadius = 0.0
                }
            }

            const animate = () => {
                animationId = requestAnimationFrame(animate)

                lerpedMouse.lerp(targetMouse, mouseSmoothness)

                if (uniforms) {
                    uniforms.u_mouse.value.copy(lerpedMouse)
                    uniforms.u_time.value += 0.01
                    uniforms.u_speed.value = maskSpeed
                    uniforms.u_turbulenceIntensity.value = turbulenceIntensity
                    uniforms.u_radius.value +=
                        (targetRadius - uniforms.u_radius.value) *
                        radiusSmoothness

                    // Update color
                    uniforms.u_color.value.set(lensColor)
                }

                if (renderer && scene && camera) {
                    renderer.render(scene, camera)
                }
            }

            document.addEventListener("mousemove", handleMouseMove)

            setupScene()
            animate()

            cleanupRef.current = () => {
                document.removeEventListener("mousemove", handleMouseMove)
                cancelAnimationFrame(animationId)
                if (renderer) {
                    renderer.dispose()
                }
            }
        }

        document.head.appendChild(script)

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current()
            }
            if (document.head.contains(script)) {
                document.head.removeChild(script)
            }
        }
    }, [
        maskRadius,
        maskSpeed,
        mouseSmoothness,
        radiusSmoothness,
        turbulenceIntensity,
        lensColor,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 50,
                minHeight: 50,
                pointerEvents: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "block",
                    width: "100%",
                    height: "100%",
                    mixBlendMode: "difference",
                }}
            />
        </div>
    )
}

declare global {
    interface Window {
        THREE: any
    }
}

addPropertyControls(InversionLens, {
    lensColor: {
        type: ControlType.Color,
        title: "Lens Color",
        defaultValue: "#ffffff",
    },
    maskRadius: {
        type: ControlType.Number,
        title: "Lens Size",
        min: 0.05,
        max: 1.0,
        step: 0.01,
        defaultValue: 0.15,
        displayStepper: true,
    },
    turbulenceIntensity: {
        type: ControlType.Number,
        title: "Turbulence",
        description: "Edge distortion intensity",
        min: 0,
        max: 0.2,
        step: 0.001,
        defaultValue: 0.06,
        displayStepper: true,
    },
    maskSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.75,
        displayStepper: true,
    },
    mouseSmoothness: {
        type: ControlType.Number,
        title: "Mouse Smoothness",
        min: 0.01,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.05,
        displayStepper: true,
    },
    radiusSmoothness: {
        type: ControlType.Number,
        title: "Fade Speed",
        min: 0.01,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
        displayStepper: true,
    },
})
