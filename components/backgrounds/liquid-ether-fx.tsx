// Liquid Ether
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
    color1?: string
    color2?: string
    color3?: string
    backgroundColor?: string
    speed?: number
    scale?: number
    intensity?: number
    interactive?: boolean
    mouseStrength?: number
    effectType?: string
}

const EFFECT_MAP: Record<string, number> = {
    aurora: 0,
    ripple: 1,
    attract: 2,
    repel: 3,
    spotlight: 4,
    vortex: 5,
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
uniform float uSpeed;
uniform float uScale;
uniform float uIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uBgColor;
uniform vec2 uMouse;
uniform vec2 uSmoothMouse;
uniform bool uInteractive;
uniform float uMouseStrength;
uniform float uInfluence;
uniform int uEffectType;

#define PI 3.14159265359

#define EFFECT_AURORA 0
#define EFFECT_RIPPLE 1
#define EFFECT_ATTRACT 2
#define EFFECT_REPEL 3
#define EFFECT_SPOTLIGHT 4
#define EFFECT_VORTEX 5

// Smooth noise
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// Liquid-like warped FBM
float liquidNoise(vec2 p, float t) {
    float f = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    
    p += 0.5 * vec2(noise(p * 0.5 + t * 0.1), noise(p * 0.5 + 100.0 + t * 0.15));
    
    for (int i = 0; i < 4; i++) {
        f += amp * noise(p * freq + t * 0.2);
        freq *= 2.0;
        amp *= 0.5;
        p = mat2(0.8, 0.6, -0.6, 0.8) * p;
    }
    return f;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    p *= uScale;
    
    float t = uTime * uSpeed * 0.3;
    
    // Mouse positions
    vec2 mousePos = (uMouse - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y) * uScale;
    vec2 smoothMousePos = (uSmoothMouse - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y) * uScale;
    float mouseDist = length(p - mousePos);
    float smoothDist = length(p - smoothMousePos);
    
    // Effect-specific variables
    float mouseGlow = 0.0;
    vec2 mouseWarp = vec2(0.0);
    float extraEffect = 0.0;
    vec3 effectColor = vec3(0.0);
    
    if (uInteractive && uInfluence > 0.0) {
        float strength = uMouseStrength * uInfluence;
        
        // AURORA - smooth trailing glow
        if (uEffectType == EFFECT_AURORA) {
            mouseGlow = exp(-mouseDist * 1.2) * strength;
            vec2 dir = p - smoothMousePos;
            float warpStrength = exp(-smoothDist * 0.6) * strength * 0.4;
            mouseWarp = dir * warpStrength;
        }
        
        // RIPPLE - expanding rings from cursor
        else if (uEffectType == EFFECT_RIPPLE) {
            float ripple = sin(mouseDist * 15.0 - t * 8.0) * 0.5 + 0.5;
            ripple *= exp(-mouseDist * 2.0) * strength;
            mouseGlow = ripple;
            mouseWarp = normalize(p - mousePos + 0.001) * ripple * 0.2;
        }
        
        // ATTRACT - pulls liquid toward cursor
        else if (uEffectType == EFFECT_ATTRACT) {
            mouseGlow = exp(-mouseDist * 1.5) * strength * 0.8;
            vec2 dir = mousePos - p;
            float pullStrength = exp(-mouseDist * 0.8) * strength * 0.5;
            mouseWarp = dir * pullStrength;
        }
        
        // REPEL - pushes liquid away from cursor
        else if (uEffectType == EFFECT_REPEL) {
            mouseGlow = exp(-mouseDist * 1.5) * strength * 0.5;
            vec2 dir = p - mousePos;
            float pushStrength = exp(-mouseDist * 0.8) * strength * 0.6;
            mouseWarp = normalize(dir + 0.001) * pushStrength;
        }
        
        // SPOTLIGHT - brightens area under cursor
        else if (uEffectType == EFFECT_SPOTLIGHT) {
            float spot = exp(-mouseDist * mouseDist * 2.0) * strength;
            mouseGlow = spot * 1.5;
            extraEffect = spot;
        }
        
        // VORTEX - swirling motion around cursor
        else if (uEffectType == EFFECT_VORTEX) {
            mouseGlow = exp(-mouseDist * 1.2) * strength * 0.6;
            vec2 dir = p - smoothMousePos;
            float angle = atan(dir.y, dir.x) + t * 2.0;
            float vortexStrength = exp(-smoothDist * 0.5) * strength * 0.4;
            vec2 tangent = vec2(-dir.y, dir.x);
            mouseWarp = normalize(tangent + 0.001) * vortexStrength;
            mouseWarp += dir * vortexStrength * 0.3; // slight inward pull
        }
    }
    
    // Apply mouse warp to coordinates
    vec2 warpedP = p + mouseWarp;
    
    // Create multiple liquid layers
    float n1 = liquidNoise(warpedP + vec2(t * 0.3, t * 0.2), t);
    float n2 = liquidNoise(warpedP * 1.2 + vec2(-t * 0.2, t * 0.25) + 50.0, t * 0.8);
    float n3 = liquidNoise(warpedP * 0.8 + vec2(t * 0.15, -t * 0.3) + 100.0, t * 1.2);
    
    // Combine for liquid blobs
    float liquid1 = smoothstep(0.0, 0.5, n1 + 0.3);
    float liquid2 = smoothstep(0.0, 0.5, n2 + 0.2);
    float liquid3 = smoothstep(0.0, 0.5, n3 + 0.25);
    
    // Color mixing
    vec3 col = uBgColor;
    
    // Layer colors with liquid blending
    col = mix(col, uColor1, liquid1 * uIntensity * 0.6);
    col = mix(col, uColor2, liquid2 * uIntensity * 0.5);
    col = mix(col, uColor3, liquid3 * uIntensity * 0.4);
    
    // Add glow/bloom effect
    float glow = (liquid1 + liquid2 + liquid3) * 0.15;
    col += glow * mix(uColor1, uColor2, 0.5) * uIntensity;
    
    // Spotlight extra brightness
    if (uEffectType == EFFECT_SPOTLIGHT && extraEffect > 0.0) {
        col = mix(col, col * 2.0 + vec3(0.1), extraEffect);
    }
    
    // Mouse glow effect
    if (uInteractive && mouseGlow > 0.01) {
        vec3 glowColor;
        
        if (uEffectType == EFFECT_AURORA) {
            glowColor = mix(uColor2, uColor3, 0.5 + 0.5 * sin(t * 2.0));
        } else if (uEffectType == EFFECT_RIPPLE) {
            glowColor = mix(uColor1, uColor3, 0.5 + 0.5 * sin(mouseDist * 10.0 - t * 5.0));
        } else if (uEffectType == EFFECT_VORTEX) {
            float angle = atan(p.y - smoothMousePos.y, p.x - smoothMousePos.x);
            glowColor = mix(uColor1, uColor2, 0.5 + 0.5 * sin(angle * 3.0 + t * 4.0));
        } else {
            glowColor = mix(uColor2, uColor3, 0.5);
        }
        
        col += mouseGlow * glowColor * 1.5;
        col += mouseGlow * mouseGlow * vec3(1.0) * 0.3;
    }
    
    gl_FragColor = vec4(col, 1.0);
}
`

const parseColor = (color: string): [number, number, number] => {
    if (!color) return [0, 0, 0]

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

    return [0, 0, 0]
}

export default function LiquidEther({
    color1 = "#6B2D5C",
    color2 = "#3B1E54",
    color3 = "#1B998B",
    backgroundColor = "#0a0a0f",
    speed = 1,
    scale = 2,
    intensity = 1.2,
    interactive = true,
    mouseStrength = 1,
    effectType = "aurora",
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
        color1,
        color2,
        color3,
        backgroundColor,
        speed,
        scale,
        intensity,
        interactive,
        mouseStrength,
        effectType,
    })

    useEffect(() => {
        propsRef.current = {
            color1,
            color2,
            color3,
            backgroundColor,
            speed,
            scale,
            intensity,
            interactive,
            mouseStrength,
            effectType,
        }
    }, [
        color1,
        color2,
        color3,
        backgroundColor,
        speed,
        scale,
        intensity,
        interactive,
        mouseStrength,
        effectType,
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
            uSpeed: gl.getUniformLocation(program, "uSpeed"),
            uScale: gl.getUniformLocation(program, "uScale"),
            uIntensity: gl.getUniformLocation(program, "uIntensity"),
            uColor1: gl.getUniformLocation(program, "uColor1"),
            uColor2: gl.getUniformLocation(program, "uColor2"),
            uColor3: gl.getUniformLocation(program, "uColor3"),
            uBgColor: gl.getUniformLocation(program, "uBgColor"),
            uMouse: gl.getUniformLocation(program, "uMouse"),
            uSmoothMouse: gl.getUniformLocation(program, "uSmoothMouse"),
            uInteractive: gl.getUniformLocation(program, "uInteractive"),
            uMouseStrength: gl.getUniformLocation(program, "uMouseStrength"),
            uInfluence: gl.getUniformLocation(program, "uInfluence"),
            uEffectType: gl.getUniformLocation(program, "uEffectType"),
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

            // Fast smooth for immediate glow
            mouseRef.current.x +=
                (targetMouseRef.current.x - mouseRef.current.x) * 0.15
            mouseRef.current.y +=
                (targetMouseRef.current.y - mouseRef.current.y) * 0.15

            // Slow smooth for aurora-like trailing effect
            smoothMouseRef.current.x +=
                (mouseRef.current.x - smoothMouseRef.current.x) * 0.03
            smoothMouseRef.current.y +=
                (mouseRef.current.y - smoothMouseRef.current.y) * 0.03

            // Smooth influence fade in/out
            influenceRef.current +=
                (targetInfluenceRef.current - influenceRef.current) * 0.08

            gl.uniform1f(uniforms.uTime, time)
            gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)
            gl.uniform1f(uniforms.uSpeed, props.speed)
            gl.uniform1f(uniforms.uScale, props.scale)
            gl.uniform1f(uniforms.uIntensity, props.intensity)

            const [r1, g1, b1] = parseColor(props.color1)
            const [r2, g2, b2] = parseColor(props.color2)
            const [r3, g3, b3] = parseColor(props.color3)
            const [bgR, bgG, bgB] = parseColor(props.backgroundColor)

            gl.uniform3f(uniforms.uColor1, r1, g1, b1)
            gl.uniform3f(uniforms.uColor2, r2, g2, b2)
            gl.uniform3f(uniforms.uColor3, r3, g3, b3)
            gl.uniform3f(uniforms.uBgColor, bgR, bgG, bgB)

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
            gl.uniform1f(uniforms.uMouseStrength, props.mouseStrength)
            gl.uniform1f(uniforms.uInfluence, influenceRef.current)
            gl.uniform1i(
                uniforms.uEffectType,
                EFFECT_MAP[props.effectType] ?? 0
            )

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

addPropertyControls(LiquidEther, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0f",
    },
    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#6B2D5C",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#3B1E54",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#1B998B",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.5,
        max: 5,
        step: 0.1,
        defaultValue: 2,
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0.5,
        max: 2,
        step: 0.1,
        defaultValue: 1.2,
    },
    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: true,
    },
    effectType: {
        type: ControlType.Enum,
        title: "↳ Effect",
        options: [
            "aurora",
            "ripple",
            "attract",
            "repel",
            "spotlight",
            "vortex",
        ],
        optionTitles: [
            "Aurora",
            "Ripple",
            "Attract",
            "Repel",
            "Spotlight",
            "Vortex",
        ],
        defaultValue: "aurora",
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
;(LiquidEther as any).defaultProps = {
    width: "100%",
    height: 400,
}
