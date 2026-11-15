// Beams
// Created by Frankie from Framer-Expert.com

import * as React from "react"
import { useRef, useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    beamColor1?: string
    beamColor2?: string
    beamColor3?: string
    backgroundColor?: string
    beamCount?: number
    beamWidth?: number
    beamHeight?: number
    speed?: number
    noiseIntensity?: number
    noiseScale?: number
    rotation?: number
    glowIntensity?: number
    interactive?: boolean
    mouseEffect?: string
    mouseStrength?: number
}

const EFFECT_MAP: Record<string, number> = {
    glow: 0,
    bend: 1,
    intensify: 4,
}

const VERTEX_SRC = `
attribute vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}
`

const FRAGMENT_SRC = `
precision mediump float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uBeamColor1;
uniform vec3 uBeamColor2;
uniform vec3 uBeamColor3;
uniform vec3 uBgColor;
uniform int uBeamCount;
uniform float uBeamWidth;
uniform float uBeamHeight;
uniform float uSpeed;
uniform float uNoiseIntensity;
uniform float uNoiseScale;
uniform float uRotation;
uniform float uGlowIntensity;
uniform vec2 uMouse;
uniform vec2 uSmoothMouse;
uniform bool uInteractive;
uniform int uMouseEffect;
uniform float uMouseStrength;
uniform float uInfluence;

#define PI 3.14159265359

#define EFFECT_GLOW 0
#define EFFECT_BEND 1
#define EFFECT_INTENSIFY 4

// Simple hash
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Value noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM noise
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

// Rotate 2D
vec2 rotate2D(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Single beam with mouse interaction
float beam(vec2 uv, float offset, float seed, float t, vec2 mousePos, vec2 smoothMousePos, float mouseInfluence) {
    // Beam position with noise
    float noiseVal = fbm(vec2(uv.y * uNoiseScale + seed * 10.0, t * 0.5 + seed)) * uNoiseIntensity;
    float xPos = offset + noiseVal;
    
    // Mouse effects
    if (uInteractive && mouseInfluence > 0.0) {
        float distToMouse = length(uv - smoothMousePos);
        float influence = exp(-distToMouse * 2.0) * uMouseStrength * mouseInfluence;
        
        // BEND - beams curve toward/away from mouse
        if (uMouseEffect == EFFECT_BEND) {
            float bendAmount = (smoothMousePos.x - xPos) * influence * 0.5;
            xPos += bendAmount;
        }
    }
    
    // Distance from beam center
    float dist = abs(uv.x - xPos);
    
    // Beam shape - sharp center with glow falloff
    float width = uBeamWidth * 0.01;
    float beamShape = smoothstep(width, 0.0, dist);
    
    // Add glow
    float glow = exp(-dist * 50.0 / uBeamWidth) * uGlowIntensity;
    
    // Vertical fade (beam height)
    float heightFade = 1.0 - smoothstep(0.0, uBeamHeight * 0.02, abs(uv.y));
    heightFade = pow(heightFade, 0.5);
    
    // Animate brightness
    float flicker = 0.7 + 0.3 * sin(t * 3.0 + seed * 20.0);
    
    // INTENSIFY effect - brighten near mouse
    if (uInteractive && mouseInfluence > 0.0 && uMouseEffect == EFFECT_INTENSIFY) {
        float distToMouse = length(uv - smoothMousePos);
        float boost = exp(-distToMouse * 3.0) * uMouseStrength * mouseInfluence;
        flicker += boost * 2.0;
    }
    
    return (beamShape + glow) * heightFade * flicker;
}

// Get beam color based on index
vec3 getBeamColor(float seed) {
    float colorIndex = fract(seed * 3.0) * 3.0;
    if (colorIndex < 1.0) {
        return uBeamColor1;
    } else if (colorIndex < 2.0) {
        return uBeamColor2;
    } else {
        return uBeamColor3;
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    
    // Apply rotation
    float angle = uRotation * PI / 180.0;
    uv = rotate2D(uv, angle);
    
    // Mouse positions (also rotated)
    vec2 mousePos = (uMouse - 0.5 * uResolution.xy) / uResolution.y;
    vec2 smoothMousePos = (uSmoothMouse - 0.5 * uResolution.xy) / uResolution.y;
    mousePos = rotate2D(mousePos, angle);
    smoothMousePos = rotate2D(smoothMousePos, angle);
    
    float t = uTime * uSpeed;
    
    vec3 col = uBgColor;
    
    // Generate beams
    float spacing = 2.0 / float(uBeamCount);
    
    for (int i = 0; i < 50; i++) {
        if (i >= uBeamCount) break;
        
        float fi = float(i);
        float seed = hash(vec2(fi, fi * 1.5));
        
        // Distribute beams across screen
        float basePos = -1.0 + spacing * fi + spacing * 0.5;
        
        // Add movement over time
        float movement = sin(t * 0.5 + seed * PI * 2.0) * 0.1;
        
        float b = beam(uv, basePos + movement, seed, t, mousePos, smoothMousePos, uInfluence);
        
        // Get color for this beam
        vec3 beamCol = getBeamColor(seed);
        
        // Add beam with its color
        col += beamCol * b;
        
        // Add subtle glow
        col += beamCol * b * b * 0.5;
    }
    
    // GLOW effect - add extra glow around mouse
    if (uInteractive && uInfluence > 0.0 && uMouseEffect == EFFECT_GLOW) {
        float distToMouse = length(uv - smoothMousePos);
        float mouseGlow = exp(-distToMouse * 2.5) * uMouseStrength * uInfluence;
        vec3 glowColor = mix(uBeamColor1, uBeamColor2, 0.5);
        col += glowColor * mouseGlow * 1.5;
        col += vec3(1.0) * mouseGlow * mouseGlow * 0.3;
    }
    
    gl_FragColor = vec4(col, 1.0);
}
`

const parseColor = (color: string): [number, number, number] => {
    if (!color) return [1, 1, 1]

    const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgbaMatch) {
        return [
            parseInt(rgbaMatch[1]) / 255,
            parseInt(rgbaMatch[2]) / 255,
            parseInt(rgbaMatch[3]) / 255,
        ]
    }

    let hex = color.replace(/^#/, "")
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    if (hex.length === 8) {
        hex = hex.slice(0, 6)
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
        return [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255,
        ]
    }

    return [1, 1, 1]
}

export default function Beams({
    beamColor1 = "#6366F1",
    beamColor2 = "#8B5CF6",
    beamColor3 = "#EC4899",
    backgroundColor = "#030014",
    beamCount = 20,
    beamWidth = 3,
    beamHeight = 30,
    speed = 2,
    noiseIntensity = 1.75,
    noiseScale = 0.2,
    rotation = 30,
    glowIntensity = 1,
    interactive = true,
    mouseEffect = "glow",
    mouseStrength = 1,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({})
    const rafRef = useRef<number>(0)
    const startTimeRef = useRef<number>(
        performance.now() / 1000 + Math.random() * 1000
    )

    const mouseRef = useRef({ x: 0, y: 0 })
    const smoothMouseRef = useRef({ x: 0, y: 0 })
    const targetMouseRef = useRef({ x: 0, y: 0 })
    const influenceRef = useRef(0)
    const targetInfluenceRef = useRef(0)

    const [ready, setReady] = useState(false)

    const propsRef = useRef({
        beamColor1,
        beamColor2,
        beamColor3,
        backgroundColor,
        beamCount,
        beamWidth,
        beamHeight,
        speed,
        noiseIntensity,
        noiseScale,
        rotation,
        glowIntensity,
        interactive,
        mouseEffect,
        mouseStrength,
    })

    useEffect(() => {
        propsRef.current = {
            beamColor1,
            beamColor2,
            beamColor3,
            backgroundColor,
            beamCount,
            beamWidth,
            beamHeight,
            speed,
            noiseIntensity,
            noiseScale,
            rotation,
            glowIntensity,
            interactive,
            mouseEffect,
            mouseStrength,
        }
    }, [
        beamColor1,
        beamColor2,
        beamColor3,
        backgroundColor,
        beamCount,
        beamWidth,
        beamHeight,
        speed,
        noiseIntensity,
        noiseScale,
        rotation,
        glowIntensity,
        interactive,
        mouseEffect,
        mouseStrength,
    ])

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const gl = canvas.getContext("webgl", {
            antialias: false,
            alpha: false,
            powerPreference: "high-performance",
        })

        if (!gl) {
            console.error("WebGL not supported")
            return
        }

        glRef.current = gl

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(vertexShader, VERTEX_SRC)
        gl.compileShader(vertexShader)

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(
                "Vertex shader error:",
                gl.getShaderInfoLog(vertexShader)
            )
            return
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(fragmentShader, FRAGMENT_SRC)
        gl.compileShader(fragmentShader)

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(
                "Fragment shader error:",
                gl.getShaderInfoLog(fragmentShader)
            )
            return
        }

        const program = gl.createProgram()!
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program))
            return
        }

        gl.useProgram(program)

        const positions = new Float32Array([
            -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0,
        ])
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

        const positionLoc = gl.getAttribLocation(program, "position")
        gl.enableVertexAttribArray(positionLoc)
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0)

        uniformsRef.current = {
            uTime: gl.getUniformLocation(program, "uTime"),
            uResolution: gl.getUniformLocation(program, "uResolution"),
            uBeamColor1: gl.getUniformLocation(program, "uBeamColor1"),
            uBeamColor2: gl.getUniformLocation(program, "uBeamColor2"),
            uBeamColor3: gl.getUniformLocation(program, "uBeamColor3"),
            uBgColor: gl.getUniformLocation(program, "uBgColor"),
            uBeamCount: gl.getUniformLocation(program, "uBeamCount"),
            uBeamWidth: gl.getUniformLocation(program, "uBeamWidth"),
            uBeamHeight: gl.getUniformLocation(program, "uBeamHeight"),
            uSpeed: gl.getUniformLocation(program, "uSpeed"),
            uNoiseIntensity: gl.getUniformLocation(program, "uNoiseIntensity"),
            uNoiseScale: gl.getUniformLocation(program, "uNoiseScale"),
            uRotation: gl.getUniformLocation(program, "uRotation"),
            uGlowIntensity: gl.getUniformLocation(program, "uGlowIntensity"),
            uMouse: gl.getUniformLocation(program, "uMouse"),
            uSmoothMouse: gl.getUniformLocation(program, "uSmoothMouse"),
            uInteractive: gl.getUniformLocation(program, "uInteractive"),
            uMouseEffect: gl.getUniformLocation(program, "uMouseEffect"),
            uMouseStrength: gl.getUniformLocation(program, "uMouseStrength"),
            uInfluence: gl.getUniformLocation(program, "uInfluence"),
        }

        setReady(true)

        return () => {
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
            cancelAnimationFrame(rafRef.current)
        }
    }, [])

    // Resize
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        const gl = glRef.current
        if (!canvas || !container || !gl || !ready) return

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            const w = container.clientWidth
            const h = container.clientHeight
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            gl.viewport(0, 0, canvas.width, canvas.height)
        }

        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(container)

        return () => ro.disconnect()
    }, [ready])

    // Mouse
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !ready) return

        const handleMove = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            targetMouseRef.current = {
                x: (e.clientX - rect.left) * dpr,
                y: (rect.height - (e.clientY - rect.top)) * dpr,
            }
            targetInfluenceRef.current = 1
        }

        const handleLeave = () => {
            targetInfluenceRef.current = 0
        }

        canvas.addEventListener("pointermove", handleMove, { passive: true })
        canvas.addEventListener("pointerleave", handleLeave, { passive: true })

        return () => {
            canvas.removeEventListener("pointermove", handleMove)
            canvas.removeEventListener("pointerleave", handleLeave)
        }
    }, [ready])

    // Animation
    useEffect(() => {
        if (!ready) return

        const gl = glRef.current
        const canvas = canvasRef.current
        const uniforms = uniformsRef.current
        if (!gl || !canvas) return

        const animate = () => {
            const props = propsRef.current
            const time = performance.now() / 1000 - startTimeRef.current

            // Fast smooth for immediate response
            mouseRef.current.x +=
                (targetMouseRef.current.x - mouseRef.current.x) * 0.15
            mouseRef.current.y +=
                (targetMouseRef.current.y - mouseRef.current.y) * 0.15

            // Slow smooth for trailing effect
            smoothMouseRef.current.x +=
                (mouseRef.current.x - smoothMouseRef.current.x) * 0.05
            smoothMouseRef.current.y +=
                (mouseRef.current.y - smoothMouseRef.current.y) * 0.05

            // Smooth influence fade
            influenceRef.current +=
                (targetInfluenceRef.current - influenceRef.current) * 0.08

            gl.uniform1f(uniforms.uTime, time)
            gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)

            const [r1, g1, b1] = parseColor(props.beamColor1)
            const [r2, g2, b2] = parseColor(props.beamColor2)
            const [r3, g3, b3] = parseColor(props.beamColor3)
            const [bgR, bgG, bgB] = parseColor(props.backgroundColor)

            gl.uniform3f(uniforms.uBeamColor1, r1, g1, b1)
            gl.uniform3f(uniforms.uBeamColor2, r2, g2, b2)
            gl.uniform3f(uniforms.uBeamColor3, r3, g3, b3)
            gl.uniform3f(uniforms.uBgColor, bgR, bgG, bgB)
            gl.uniform1i(uniforms.uBeamCount, props.beamCount)
            gl.uniform1f(uniforms.uBeamWidth, props.beamWidth)
            gl.uniform1f(uniforms.uBeamHeight, props.beamHeight)
            gl.uniform1f(uniforms.uSpeed, props.speed)
            gl.uniform1f(uniforms.uNoiseIntensity, props.noiseIntensity)
            gl.uniform1f(uniforms.uNoiseScale, props.noiseScale)
            gl.uniform1f(uniforms.uRotation, props.rotation)
            gl.uniform1f(uniforms.uGlowIntensity, props.glowIntensity)

            // Mouse uniforms
            gl.uniform2f(
                uniforms.uMouse,
                mouseRef.current.x,
                mouseRef.current.y
            )
            gl.uniform2f(
                uniforms.uSmoothMouse,
                smoothMouseRef.current.x,
                smoothMouseRef.current.y
            )
            gl.uniform1i(uniforms.uInteractive, props.interactive ? 1 : 0)
            gl.uniform1i(
                uniforms.uMouseEffect,
                EFFECT_MAP[props.mouseEffect] ?? 0
            )
            gl.uniform1f(uniforms.uMouseStrength, props.mouseStrength)
            gl.uniform1f(uniforms.uInfluence, influenceRef.current)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(rafRef.current)
    }, [ready])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    )
}

addPropertyControls(Beams, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#030014",
    },
    beamColor1: {
        type: ControlType.Color,
        title: "Beam Color 1",
        defaultValue: "#6366F1",
    },
    beamColor2: {
        type: ControlType.Color,
        title: "Beam Color 2",
        defaultValue: "#8B5CF6",
    },
    beamColor3: {
        type: ControlType.Color,
        title: "Beam Color 3",
        defaultValue: "#EC4899",
    },
    beamCount: {
        type: ControlType.Number,
        title: "Beam Count",
        min: 5,
        max: 50,
        step: 1,
        defaultValue: 20,
    },
    beamWidth: {
        type: ControlType.Number,
        title: "Beam Width",
        min: 1,
        max: 10,
        step: 0.5,
        defaultValue: 3,
    },
    beamHeight: {
        type: ControlType.Number,
        title: "Beam Height",
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 30,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 2,
    },
    noiseIntensity: {
        type: ControlType.Number,
        title: "Noise Intensity",
        min: 0,
        max: 5,
        step: 0.25,
        defaultValue: 1.75,
    },
    noiseScale: {
        type: ControlType.Number,
        title: "Noise Scale",
        min: 0.05,
        max: 1,
        step: 0.05,
        defaultValue: 0.2,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        min: -90,
        max: 90,
        step: 5,
        defaultValue: 30,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: true,
    },
    mouseEffect: {
        type: ControlType.Enum,
        title: "↳ Effect",
        options: ["glow", "bend", "intensify"],
        optionTitles: ["Glow", "Bend", "Intensify"],
        defaultValue: "glow",
        hidden: (p) => !p.interactive,
    },
    mouseStrength: {
        type: ControlType.Number,
        title: "↳ Strength",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 1,
        hidden: (p) => !p.interactive,
    },
})
;(Beams as any).defaultProps = {
    width: "100%",
    height: 400,
}
