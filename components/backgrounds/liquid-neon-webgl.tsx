/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import { useEffect, useRef, type CSSProperties } from "react"

interface LiquidNeonWebGLProps {
    interactiveMode: boolean
    mouseRadius: number
    mouseStrength: number
    animationSpeed: number
    flowAngle: number
    distortionAmount: number
    complexity: number
    scale: number
    glossiness: number
    lightIntensity: number
    colorPink: string
    colorCyan: string
    colorPurple: string
    backgroundColor: string
    style?: CSSProperties
}

const parseColor = (color: string): [number, number, number] => {
    if (!color) return [0, 0, 0]
    if (color.startsWith("#")) {
        let hex = color.replace("#", "")
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        if (hex.length === 8) hex = hex.substring(0, 6)
        return [
            parseInt(hex.slice(0, 2), 16) / 255,
            parseInt(hex.slice(2, 4), 16) / 255,
            parseInt(hex.slice(4, 6), 16) / 255,
        ]
    }
    if (color.startsWith("rgb")) {
        const match = color.match(/\d+(\.\d+)?/g)
        if (match && match.length >= 3) {
            return [
                parseFloat(match[0]) / 255,
                parseFloat(match[1]) / 255,
                parseFloat(match[2]) / 255,
            ]
        }
    }
    return [0, 0, 0]
}

export default function LiquidNeonWebGL(props: LiquidNeonWebGLProps) {
    const {
        interactiveMode = true,
        mouseRadius = 3.5,
        mouseStrength = 0.8,
        animationSpeed = 0.5,
        flowAngle = 0,
        distortionAmount = 1.2,
        complexity = 1.0,
        scale = 1.5,
        glossiness = 1.0,
        lightIntensity = 1.0,
        colorPink = "#FF0080",
        colorCyan = "#00F0FF",
        colorPurple = "#7000FF",
        backgroundColor = "#03000A",
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const targetMouse = useRef({ x: 0.5, y: 0.5 })
    const currentMouse = useRef({ x: 0.5, y: 0.5 })
    const accumulatedTime = useRef(0)

    const isStatic = useIsStaticRenderer()

    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `

    const fragmentShaderSource = `
        precision highp float;
        
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_speed;
        uniform float u_flowAngle;
        uniform float u_distortion;
        uniform float u_complexity;
        uniform float u_scale;
        
        uniform vec2 u_mouse;
        uniform float u_interactive;
        uniform float u_mouseRadius;
        uniform float u_mouseStrength;
        
        uniform float u_glossiness;
        uniform float u_lightIntensity;

        uniform vec3 u_colorPink;
        uniform vec3 u_colorCyan;
        uniform vec3 u_colorPurple;
        uniform vec3 u_bgColor;

        mat2 rot(float a) {
            float s = sin(a), c = cos(a);
            return mat2(c, -s, s, c);
        }

        float map(vec3 p) {
            vec3 q = p;
            float t = u_time * u_speed;
            
            float d = q.z;
            
            q.xy *= rot(u_flowAngle + t * 0.15);
            q *= u_scale;
            
            float cx = u_complexity;
            
            float f1 = sin(q.x * 1.5 * cx + t * 1.2) * cos(q.y * 1.2 * cx - t * 0.8);
            float f2 = sin(q.x * 0.8 * cx - t * 0.5 + q.y * 1.5 * cx);
            float f3 = cos(q.x * 2.0 * cx + t * 0.9 + sin(q.y * 1.5 * cx));
            
            float displacement = (f1 + f2 * 0.8 + f3 * 0.4) * 0.4 * u_distortion;
            
            vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
            vec2 mouseWorld = (u_mouse - 0.5) * 2.0 * aspect;
            float mouseDist = length(p.xy - mouseWorld * 2.0); 
            
            float mousePush = exp(-mouseDist * u_mouseRadius) * u_mouseStrength * u_interactive;
            float ripple = sin(mouseDist * 12.0 - t * 8.0) * exp(-mouseDist * (u_mouseRadius * 1.2)) * (u_mouseStrength * 0.2) * u_interactive;
            
            displacement += mousePush + ripple;

            d -= displacement;
            
            return d * 0.5; 
        }

        vec3 calcNormal(vec3 p) {
            vec2 e = vec2(0.01, 0.0);
            return normalize(vec3(
                map(p + e.xyy) - map(p - e.xyy),
                map(p + e.yxy) - map(p - e.yxy),
                map(p + e.yyx) - map(p - e.yyx)
            ));
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
            
            vec3 ro = vec3(0.0, 0.0, 2.5); 
            vec3 rd = normalize(vec3(uv, -1.0)); 
            
            float t = 0.0;
            const int MAX_STEPS = 80; 
            const float MAX_DIST = 10.0;
            const float SURF_DIST = 0.005;
            
            vec3 p;
            bool hit = false;
            
            for(int i = 0; i < MAX_STEPS; i++) {
                p = ro + rd * t;
                float d = map(p);
                if(abs(d) < SURF_DIST) {
                    hit = true;
                    break;
                }
                if(t > MAX_DIST) break;
                t += d;
            }
            
            vec3 col = u_bgColor; 
            
            if(hit) {
                vec3 n = calcNormal(p);
                vec3 v = -rd;
                vec3 ref = reflect(rd, n);
                
                float fresnel = pow(1.0 - max(dot(n, v), 0.0), 5.0);
                
                float specPower = 90.0 * u_glossiness; 
                
                vec3 l1 = normalize(vec3(1.0, 1.5, 1.0));
                float spec1 = pow(max(dot(ref, l1), 0.0), specPower); 
                float diff1 = max(dot(n, l1), 0.0);
                
                vec3 l2 = normalize(vec3(-1.5, 1.0, 1.0));
                float spec2 = pow(max(dot(ref, l2), 0.0), specPower * 1.33); 
                float diff2 = max(dot(n, l2), 0.0);
                
                vec3 l3 = normalize(vec3(0.0, -1.5, 1.0));
                float spec3 = pow(max(dot(ref, l3), 0.0), specPower * 0.44);
                
                float rim = smoothstep(0.6, 1.0, fresnel) * 0.8;
                
                vec3 specular = (u_colorPink * spec1 * 3.0 + u_colorCyan * spec2 * 3.0 + u_colorPurple * spec3 * 1.5) * u_lightIntensity;
                vec3 diffuse = (u_colorPink * diff1 * 0.15 + u_colorCyan * diff2 * 0.15) * u_lightIntensity;
                vec3 rimColor = mix(u_colorCyan, u_colorPink, 0.5) * rim * u_lightIntensity;
                
                vec3 material = mix(u_bgColor, vec3(0.02), 0.3); 
                
                col = material + diffuse + specular + rimColor;
            }
            
            vec3 vColor = col * 1.1;
            float a = 2.51;
            float b = 0.03;
            float c = 2.43;
            float d = 0.59;
            float e = 0.14;
            col = clamp((vColor*(a*vColor+b))/(vColor*(c*vColor+d)+e), 0.0, 1.0);
            
            float vig = length(uv);
            col *= smoothstep(1.6, 0.4, vig);
            
            gl_FragColor = vec4(col, 1.0);
        }
    `

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const gl = canvas.getContext("webgl", {
            premultipliedAlpha: true,
            alpha: true,
            antialias: true,
            depth: false,
        })
        if (!gl) return

        const createShader = (type: number, source: string) => {
            const s = gl.createShader(type)!
            gl.shaderSource(s, source)
            gl.compileShader(s)
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s
            return s
        }

        const program = gl.createProgram()!
        gl.attachShader(
            program,
            createShader(gl.VERTEX_SHADER, vertexShaderSource)
        )
        gl.attachShader(
            program,
            createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
        )
        gl.linkProgram(program)
        gl.useProgram(program)

        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
        const vbo = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

        const posLoc = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        const locs = {
            res: gl.getUniformLocation(program, "u_resolution"),
            time: gl.getUniformLocation(program, "u_time"),
            speed: gl.getUniformLocation(program, "u_speed"),
            flowAngle: gl.getUniformLocation(program, "u_flowAngle"),
            distortion: gl.getUniformLocation(program, "u_distortion"),
            complexity: gl.getUniformLocation(program, "u_complexity"),
            scale: gl.getUniformLocation(program, "u_scale"),
            mouse: gl.getUniformLocation(program, "u_mouse"),
            interactive: gl.getUniformLocation(program, "u_interactive"),
            mouseRadius: gl.getUniformLocation(program, "u_mouseRadius"),
            mouseStrength: gl.getUniformLocation(program, "u_mouseStrength"),
            glossiness: gl.getUniformLocation(program, "u_glossiness"),
            lightIntensity: gl.getUniformLocation(program, "u_lightIntensity"),
            colorPink: gl.getUniformLocation(program, "u_colorPink"),
            colorCyan: gl.getUniformLocation(program, "u_colorCyan"),
            colorPurple: gl.getUniformLocation(program, "u_colorPurple"),
            bgColor: gl.getUniformLocation(program, "u_bgColor"),
        }

        const resizeObserver = new ResizeObserver(() => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = container.clientWidth * dpr
            canvas.height = container.clientHeight * dpr
            gl.viewport(0, 0, canvas.width, canvas.height)
        })
        resizeObserver.observe(container)

        const handleMouseMove = (e: MouseEvent) => {
            if (!interactiveMode) return
            const rect = canvas.getBoundingClientRect()
            targetMouse.current = {
                x: (e.clientX - rect.left) / rect.width,
                y: 1.0 - (e.clientY - rect.top) / rect.height,
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!interactiveMode) return
            if (e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect()
                targetMouse.current = {
                    x: (e.touches[0].clientX - rect.left) / rect.width,
                    y: 1.0 - (e.touches[0].clientY - rect.top) / rect.height,
                }
            }
        }

        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("touchmove", handleTouchMove, { passive: true })

        let animId: number
        let lastTime = performance.now()
        let isVisible = true

        const render = (now: number) => {
            if (!isVisible) return

            let dt = (now - lastTime) / 1000
            if (dt > 0.1) dt = 0.016

            lastTime = now
            accumulatedTime.current += dt

            if (canvas.width > 0 && canvas.height > 0) {
                gl.clearColor(0, 0, 0, 1)
                gl.clear(gl.COLOR_BUFFER_BIT)

                currentMouse.current.x +=
                    (targetMouse.current.x - currentMouse.current.x) * 0.08
                currentMouse.current.y +=
                    (targetMouse.current.y - currentMouse.current.y) * 0.08

                gl.uniform2f(locs.res, canvas.width, canvas.height)
                gl.uniform1f(locs.time, accumulatedTime.current)

                const angleRadians = flowAngle * (Math.PI / 180)

                gl.uniform1f(locs.speed, animationSpeed)
                gl.uniform1f(locs.flowAngle, angleRadians)
                gl.uniform1f(locs.distortion, distortionAmount)
                gl.uniform1f(locs.complexity, complexity)
                gl.uniform1f(locs.scale, scale)

                gl.uniform1f(locs.glossiness, glossiness)
                gl.uniform1f(locs.lightIntensity, lightIntensity)

                gl.uniform2f(
                    locs.mouse,
                    currentMouse.current.x,
                    currentMouse.current.y
                )
                gl.uniform1f(locs.interactive, interactiveMode ? 1.0 : 0.0)
                gl.uniform1f(locs.mouseRadius, mouseRadius)
                gl.uniform1f(locs.mouseStrength, mouseStrength)

                gl.uniform3fv(locs.colorPink, parseColor(colorPink))
                gl.uniform3fv(locs.colorCyan, parseColor(colorCyan))
                gl.uniform3fv(locs.colorPurple, parseColor(colorPurple))
                gl.uniform3fv(locs.bgColor, parseColor(backgroundColor))

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            }

            animId = requestAnimationFrame(render)
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry.isIntersecting) {
                    if (!isVisible) {
                        isVisible = true
                        lastTime = performance.now()
                        animId = requestAnimationFrame(render)
                    }
                } else {
                    if (isVisible) {
                        isVisible = false
                        cancelAnimationFrame(animId)
                    }
                }
            },
            { threshold: 0.0 }
        )

        observer.observe(container)

        animId = requestAnimationFrame(render)

        return () => {
            cancelAnimationFrame(animId)
            observer.disconnect()
            resizeObserver.disconnect()
            canvas.removeEventListener("mousemove", handleMouseMove)
            canvas.removeEventListener("touchmove", handleTouchMove)
            gl.deleteProgram(program)
        }
    }, [
        interactiveMode,
        mouseRadius,
        mouseStrength,
        animationSpeed,
        flowAngle,
        distortionAmount,
        complexity,
        scale,
        glossiness,
        lightIntensity,
        colorPink,
        colorCyan,
        colorPurple,
        backgroundColor,
        isStatic,
    ])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    ...style,
                    position: "relative",
                    backgroundColor: backgroundColor,
                    backgroundImage: `linear-gradient(135deg, ${colorPurple}33 0%, transparent 50%, ${colorCyan}33 100%)`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 500,
                    color: colorPink,
                    overflow: "hidden",
                }}
            >
                Interactive Fluid (Play to animate)
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
                backgroundColor: backgroundColor,
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    )
}

// --- FRAMER PROPERTY CONTROLS ---
addPropertyControls(LiquidNeonWebGL, {
    interactiveMode: {
        type: ControlType.Boolean,
        title: "Interactive Mode",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    mouseRadius: {
        type: ControlType.Number,
        title: "Pointer Radius",
        defaultValue: 3.5,
        min: 1.0,
        max: 10.0,
        step: 0.1,
        hidden: (props) => !props.interactiveMode,
    },
    mouseStrength: {
        type: ControlType.Number,
        title: "Pointer Force",
        defaultValue: 0.8,
        min: -2.0,
        max: 2.0,
        step: 0.1,
        hidden: (props) => !props.interactiveMode,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Playback Speed",
        defaultValue: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.05,
    },
    flowAngle: {
        type: ControlType.Number,
        title: "Flow Angle",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
    },
    scale: {
        type: ControlType.Number,
        title: "Zoom Level",
        defaultValue: 1.5,
        min: 0.5,
        max: 4.0,
        step: 0.1,
    },
    distortionAmount: {
        type: ControlType.Number,
        title: "Distortion Level",
        defaultValue: 1,
        min: 0.0,
        max: 3.0,
        step: 0.1,
    },
    complexity: {
        type: ControlType.Number,
        title: "Surface Complexity",
        defaultValue: 1.7,
        min: 0.2,
        max: 3.0,
        step: 0.1,
    },
    glossiness: {
        type: ControlType.Number,
        title: "Glossiness",
        defaultValue: 1.5,
        min: 0.1,
        max: 3.0,
        step: 0.1,
    },
    lightIntensity: {
        type: ControlType.Number,
        title: "Light Intensity",
        defaultValue: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
    },
    colorPink: {
        type: ControlType.Color,
        title: "Primary Accent",
        defaultValue: "#FF0080",
    },
    colorCyan: {
        type: ControlType.Color,
        title: "Secondary Accent",
        defaultValue: "#00F0FF",
    },
    colorPurple: {
        type: ControlType.Color,
        title: "Ambient Light",
        defaultValue: "#7000FF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#03000A",
    },
})
