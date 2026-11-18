import React, { useRef, useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const parseColor = (colorStr: string) => {
    if (typeof document === "undefined") return [1, 1, 1]
    const canvas2d = document.createElement("canvas")
    canvas2d.width = 1
    canvas2d.height = 1
    const ctx = canvas2d.getContext("2d", { willReadFrequently: true })
    if (!ctx) return [1, 1, 1]

    ctx.fillStyle = colorStr
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    return [data[0] / 255, data[1] / 255, data[2] / 255]
}

const vertexShaderSource = `
attribute vec3 a_position;
attribute vec3 a_target;
attribute float a_size;
attribute float a_type;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_rotationAngle;
uniform float u_scatter;
uniform vec3 u_colorShell;
uniform vec3 u_colorCore;

uniform float u_scale;
uniform float u_coreScale;
uniform vec2 u_offset;

varying vec3 v_color;
varying float v_alpha;

mat3 getRotation(float t) {
    float c = cos(t), s = sin(t);
    mat3 ry = mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
    float c2 = cos(t * 0.8), s2 = sin(t * 0.8);
    mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, c2, -s2, 0.0, s2, c2);
    return ry * rx;
}

void main() {
    mat3 rot = getRotation(u_rotationAngle * 0.5);
    
    vec3 pos = a_position;
    float origRadius = length(pos);
    
    vec3 flow = vec3(
        sin(pos.y * 5.0 + u_time),
        cos(pos.z * 5.0 + u_time),
        sin(pos.x * 5.0 + u_time)
    ) * 0.15;
    
    pos = normalize(pos + flow * (1.0 - u_scatter)) * origRadius;
    pos = rot * pos;
    
    vec3 scatteredPos = a_target + (rot * a_target * 0.2);
    pos = mix(pos, scatteredPos, u_scatter);
    
    if (a_type > 0.5) {
        pos *= mix(u_coreScale, 1.0, u_scatter);
    }
    pos *= u_scale;
    
    float zDist = 2.5;
    float z = pos.z + zDist;
    
    vec2 projected = pos.xy / z;
    float aspect = u_resolution.x / u_resolution.y;
    projected.x /= aspect;
    projected += u_offset;
    
    gl_Position = vec4(projected, 0.0, 1.0);
    
    float pSize = a_size / z;
    if (a_type > 0.5) {
        v_color = u_colorCore * 1.5; 
        pSize *= 4.0 * mix(u_coreScale, 1.0, u_scatter) * u_scale;
    } else {
        v_color = u_colorShell * 1.2; 
        pSize *= u_scale;
    }
    
    gl_PointSize = pSize * (u_resolution.y / 800.0);
    v_alpha = smoothstep(3.5, 1.5, z);
    v_alpha *= mix(1.0, 0.25, u_scatter);
}
`

const fragmentShaderSource = `
precision highp float;
varying vec3 v_color;
varying float v_alpha;

void main() {
    vec2 pt = gl_PointCoord - vec2(0.5);
    float r = length(pt);
    
    if (r > 0.5) discard;
    
    float intensity = pow(1.0 - (r * 2.0), 1.5) * 2.5;
    
    gl_FragColor = vec4(v_color * intensity * v_alpha, 1.0);
}
`

interface Props {
    colorShell: string
    colorCore: string
    colorBackground: string
    particleCount: number
    speed: number
    hoverSpeed: number
    scatterDuration: number
    sphereSize: number
    coreSize: number
    offsetX: number
    offsetY: number
    style?: React.CSSProperties
}

/**
 * Interactive WebGL Particle Sphere
 *
 * A GPU-accelerated 3D sphere made of particles that reacts to hover and clicks.
 * Optimized for Framer with automatic viewport culling and static rendering fallbacks.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ParticleGlobe3D(props: Props) {
    const {
        colorShell = "#00FFFF",
        colorCore = "#0055FF",
        colorBackground = "#000000",
        particleCount = 15000,
        speed = 1.0,
        hoverSpeed = 3.5,
        scatterDuration = 3.0,
        sphereSize = 1.0,
        coreSize = 1.0,
        offsetX = 0.0,
        offsetY = 0.0,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const shouldDisableWebGL = isCanvas || isStatic

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number>()
    const timeoutRef = useRef<number | null>(null)

    const [isInView, setIsInView] = useState(false)

    const elapsedTimeRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)
    const targetMousePos = useRef({ x: 9999, y: 9999 })

    const currentSpeedRef = useRef<number>(speed)
    const currentCoreScaleRef = useRef<number>(coreSize)
    const accumulatedRotationRef = useRef<number>(0)

    const targetScatter = useRef<number>(0)
    const currentScatter = useRef<number>(0)

    useEffect(() => {
        return () => {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        }
    }, [])

    useEffect(() => {
        if (shouldDisableWebGL) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)
            },
            { threshold: 0 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [shouldDisableWebGL])

    useEffect(() => {
        if (shouldDisableWebGL || !isInView) return

        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: false,
        })
        if (!gl) return

        const compileShader = (type: number, source: string) => {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader))
                gl.deleteShader(shader)
                return null
            }
            return shader
        }

        const vShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource)
        const fShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
        if (!vShader || !fShader) return

        const program = gl.createProgram()
        if (!program) return
        gl.attachShader(program, vShader)
        gl.attachShader(program, fShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
        gl.useProgram(program)

        const actualParticleCount = Math.min(
            Math.max(particleCount, 1000),
            30000
        )

        const positions = new Float32Array(actualParticleCount * 3)
        const targets = new Float32Array(actualParticleCount * 3)
        const sizes = new Float32Array(actualParticleCount)
        const types = new Float32Array(actualParticleCount)

        const coreCount = Math.floor(actualParticleCount * 0.003)

        for (let i = 0; i < actualParticleCount; i++) {
            const isCore = i < coreCount

            const r = isCore ? Math.random() * 0.4 : 0.98 + Math.random() * 0.02
            const theta = Math.random() * 2 * Math.PI
            const phi = Math.acos(Math.random() * 2 - 1)

            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.sin(phi) * Math.sin(theta)
            const z = r * Math.cos(phi)

            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z

            const scatterRadius = 1.1 + Math.random() * 1.4
            targets[i * 3] = x * scatterRadius + (Math.random() - 0.5) * 1.2
            targets[i * 3 + 1] = y * scatterRadius + (Math.random() - 0.5) * 1.2
            targets[i * 3 + 2] = z * scatterRadius + (Math.random() - 0.5) * 1.2

            sizes[i] = isCore
                ? 25.0 + Math.random() * 15.0
                : 1.5 + Math.random() * 2.5
            types[i] = isCore ? 1.0 : 0.0
        }

        const createBuffer = (
            data: Float32Array,
            attributeName: string,
            size: number
        ) => {
            const buffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
            const location = gl.getAttribLocation(program, attributeName)
            gl.enableVertexAttribArray(location)
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
            return buffer
        }

        const posBuffer = createBuffer(positions, "a_position", 3)
        const targetBuffer = createBuffer(targets, "a_target", 3)
        const sizeBuffer = createBuffer(sizes, "a_size", 1)
        const typeBuffer = createBuffer(types, "a_type", 1)

        const resolutionLoc = gl.getUniformLocation(program, "u_resolution")
        const timeLoc = gl.getUniformLocation(program, "u_time")
        const rotationAngleLoc = gl.getUniformLocation(
            program,
            "u_rotationAngle"
        )
        const scatterLoc = gl.getUniformLocation(program, "u_scatter")
        const colorShellLoc = gl.getUniformLocation(program, "u_colorShell")
        const colorCoreLoc = gl.getUniformLocation(program, "u_colorCore")
        const scaleLoc = gl.getUniformLocation(program, "u_scale")
        const coreScaleLoc = gl.getUniformLocation(program, "u_coreScale")
        const offsetLoc = gl.getUniformLocation(program, "u_offset")

        const rgbShell = parseColor(colorShell)
        const rgbCore = parseColor(colorCore)
        const rgbBg = parseColor(colorBackground)

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const width = canvas.clientWidth * dpr
            const height = canvas.clientHeight * dpr

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
            }
        }

        const render = (now: number) => {
            resize()

            if (lastTimeRef.current === 0) {
                lastTimeRef.current = now
            }
            const deltaTime = (now - lastTimeRef.current) / 1000
            lastTimeRef.current = now
            elapsedTimeRef.current += deltaTime

            const aspect = canvas.width / canvas.height
            const sphereScreenX = offsetX * aspect
            const sphereScreenY = -offsetY

            const dx = targetMousePos.current.x * aspect - sphereScreenX
            const dy = targetMousePos.current.y - sphereScreenY
            const dist = Math.sqrt(dx * dx + dy * dy)

            const hitRadius = 0.45 * sphereSize
            const isHovered = dist < hitRadius

            const targetSpeed = isHovered ? hoverSpeed : speed

            const maxAllowedCoreScale = Math.max(coreSize, 2.2)
            const targetCoreScale = isHovered
                ? Math.min(coreSize * 1.5, maxAllowedCoreScale)
                : coreSize

            currentSpeedRef.current +=
                (targetSpeed - currentSpeedRef.current) * 0.08
            currentCoreScaleRef.current +=
                (targetCoreScale - currentCoreScaleRef.current) * 0.08
            accumulatedRotationRef.current +=
                deltaTime * currentSpeedRef.current

            currentScatter.current +=
                (targetScatter.current - currentScatter.current) * 0.06

            gl.clearColor(rgbBg[0], rgbBg[1], rgbBg[2], 1.0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

            gl.uniform2f(resolutionLoc, canvas.width, canvas.height)
            gl.uniform1f(timeLoc, elapsedTimeRef.current)
            gl.uniform1f(rotationAngleLoc, accumulatedRotationRef.current)
            gl.uniform1f(scatterLoc, currentScatter.current)
            gl.uniform3f(colorShellLoc, rgbShell[0], rgbShell[1], rgbShell[2])
            gl.uniform3f(colorCoreLoc, rgbCore[0], rgbCore[1], rgbCore[2])
            gl.uniform1f(scaleLoc, sphereSize)
            gl.uniform1f(coreScaleLoc, currentCoreScaleRef.current)
            gl.uniform2f(offsetLoc, offsetX, -offsetY)

            gl.drawArrays(gl.POINTS, 0, actualParticleCount)

            requestRef.current = requestAnimationFrame(render)
        }

        requestRef.current = requestAnimationFrame(render)

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            lastTimeRef.current = 0
            gl.deleteProgram(program)
            gl.deleteShader(vShader)
            gl.deleteShader(fShader)
            gl.deleteBuffer(posBuffer)
            gl.deleteBuffer(targetBuffer)
            gl.deleteBuffer(sizeBuffer)
            gl.deleteBuffer(typeBuffer)
        }
    }, [
        shouldDisableWebGL,
        isInView,
        colorShell,
        colorCore,
        colorBackground,
        particleCount,
        speed,
        hoverSpeed,
        sphereSize,
        coreSize,
        offsetX,
        offsetY,
    ])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (shouldDisableWebGL) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0
        const y = -(((e.clientY - rect.top) / rect.height) * 2.0 - 1.0)
        targetMousePos.current = { x, y }
    }

    const handleMouseLeave = () => {
        if (shouldDisableWebGL) return
        targetMousePos.current = { x: 9999, y: 9999 }
    }

    const handleClick = () => {
        if (shouldDisableWebGL) return

        targetScatter.current = 1.0

        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)

        timeoutRef.current = window.setTimeout(() => {
            targetScatter.current = 0.0
        }, scatterDuration * 1000)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
        }
    }

    if (shouldDisableWebGL) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colorBackground,
                    color: colorShell,
                    fontFamily: "sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    border: "1px dashed rgba(255,255,255,0.2)",
                    ...style,
                }}
            >
                WebGL Particle Sphere [Preview Mode]
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Interactive Particle Sphere"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                outline: "none",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    backgroundColor: colorBackground,
                }}
            />
        </div>
    )
}

addPropertyControls(ParticleGlobe3D, {
    colorShell: {
        type: ControlType.Color,
        title: "Shell Color",
        defaultValue: "#00FFFF",
    },
    colorCore: {
        type: ControlType.Color,
        title: "Core Color",
        defaultValue: "#0055FF",
    },
    colorBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    sphereSize: {
        type: ControlType.Number,
        title: "Sphere Size",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },
    coreSize: {
        type: ControlType.Number,
        title: "Core Size",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },
    offsetX: {
        type: ControlType.Number,
        title: "Position X",
        defaultValue: 0.0,
        min: -2.0,
        max: 2.0,
        step: 0.05,
        displayStepper: true,
    },
    offsetY: {
        type: ControlType.Number,
        title: "Position Y",
        defaultValue: 0.0,
        min: -2.0,
        max: 2.0,
        step: 0.05,
        displayStepper: true,
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 15000,
        min: 1000,
        max: 30000,
        step: 1000,
        displayStepper: true,
    },
    scatterDuration: {
        type: ControlType.Number,
        title: "Scatter Time",
        defaultValue: 3.0,
        min: 1.0,
        max: 10.0,
        step: 0.5,
        unit: "s",
        displayStepper: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Base Speed",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },
    hoverSpeed: {
        type: ControlType.Number,
        title: "Hover Speed",
        defaultValue: 3.5,
        min: 0.1,
        max: 10.0,
        step: 0.1,
        displayStepper: true,
    },
})
