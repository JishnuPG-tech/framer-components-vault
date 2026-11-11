// Neon Cursor - A stylish glowing animated trail that follows mouse movements using WebGL
import { useEffect, useRef, useMemo, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface NeonCursorProps {
    colorStart: string
    colorEnd: string
    curveLerp1: number
    curveLerp2: number
    lineRadius: number
    glowRadius: number
    sleepXRadius: number
    sleepYRadius: number
    sleepTimeScale1: number
    sleepTimeScale2: number
    previewText: string
    previewTextColor: string
    previewTextSize: number
    colorCycleSpeed: number
    sectionColorChange: boolean
    style?: React.CSSProperties
}

/**
 * Neon Cursor Component
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function NeonCursor(props: NeonCursorProps) {
    const {
        colorStart = "#00FFFF",
        colorEnd = "#FF00FF",
        curveLerp1 = 0.15,
        curveLerp2 = 0.3,
        lineRadius = 0.015,
        glowRadius = 0.04,
        sleepXRadius = 0.3,
        sleepYRadius = 0.3,
        sleepTimeScale1 = 1.0,
        sleepTimeScale2 = 1.0,
        previewText = "Preview mode - Publish to see effect",
        previewTextColor = "#666666",
        previewTextSize = 12,
        colorCycleSpeed = 2.0,
        sectionColorChange = true,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic || !canvasRef.current) return

        const canvas = canvasRef.current
        const gl = canvas.getContext("webgl", { 
            alpha: true, 
            antialias: true,
            premultipliedAlpha: false 
        })
        
        if (!gl) {
            console.error("WebGL not supported")
            return
        }

        // Vertex shader
        const vertexShaderSource = `
            attribute vec2 position;
            attribute float alpha;
            varying float vAlpha;
            void main() {
                vAlpha = alpha;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `

        // Fragment shader with glow
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec3 color;
            varying float vAlpha;
            void main() {
                gl_FragColor = vec4(color, vAlpha);
            }
        `

        // Compile shader
        function compileShader(source: string, type: number) {
            const shader = gl.createShader(type)!
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader))
                gl.deleteShader(shader)
                return null
            }
            return shader
        }

        const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER)
        const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER)

        if (!vertexShader || !fragmentShader) return

        const program = gl.createProgram()!
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program))
            return
        }

        gl.useProgram(program)

        const positionLocation = gl.getAttribLocation(program, "position")
        const alphaLocation = gl.getAttribLocation(program, "alpha")
        const colorLocation = gl.getUniformLocation(program, "color")

        // Trail points
        const numPoints = 30
        const points: { x: number; y: number; vx: number; vy: number }[] = []
        
        for (let i = 0; i < numPoints; i++) {
            points.push({ x: 0, y: 0, vx: 0, vy: 0 })
        }

        let mouseX = 0
        let mouseY = 0
        let targetX = 0
        let targetY = 0
        let lastMouseX = 0
        let lastMouseY = 0
        let velocity = 0
        let time = 0
        let isMouseOver = false
        let colorCycleTime = 0
        let currentSection = 0

        // Convert hex to RGB
        function hexToRgb(hex: string): [number, number, number] {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
            return result
                ? [
                      parseInt(result[1], 16) / 255,
                      parseInt(result[2], 16) / 255,
                      parseInt(result[3], 16) / 255,
                  ]
                : [0, 1, 1]
        }

        const colorStartRgb = hexToRgb(colorStart)
        const colorEndRgb = hexToRgb(colorEnd)

        function handleMouseMove(e: MouseEvent) {
            const rect = canvas.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
            
            targetX = x
            targetY = y
            
            const dx = e.clientX - lastMouseX
            const dy = e.clientY - lastMouseY
            velocity = Math.sqrt(dx * dx + dy * dy) * 0.1
            
            lastMouseX = e.clientX
            lastMouseY = e.clientY
            isMouseOver = true
            
            // Determine section based on mouse position
            if (sectionColorChange) {
                const normalizedX = (e.clientX - rect.left) / rect.width
                const normalizedY = (e.clientY - rect.top) / rect.height
                
                // Divide canvas into 4 sections
                if (normalizedX < 0.5 && normalizedY < 0.5) {
                    currentSection = 0 // Top-left
                } else if (normalizedX >= 0.5 && normalizedY < 0.5) {
                    currentSection = 1 // Top-right
                } else if (normalizedX < 0.5 && normalizedY >= 0.5) {
                    currentSection = 2 // Bottom-left
                } else {
                    currentSection = 3 // Bottom-right
                }
            }
        }

        function handleMouseEnter() {
            isMouseOver = true
            startTransition(() => setIsHovered(true))
        }

        function handleMouseLeave() {
            isMouseOver = false
            startTransition(() => setIsHovered(false))
        }

        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("mouseenter", handleMouseEnter)
        canvas.addEventListener("mouseleave", handleMouseLeave)

        let animationId: number

        function render() {
            time += 0.016
            
            // Increment color cycle time when mouse is moving
            if (velocity > 0.1) {
                colorCycleTime += 0.016 * colorCycleSpeed
            }

            // Update mouse position with lerp
            mouseX += (targetX - mouseX) * curveLerp1
            mouseY += (targetY - mouseY) * curveLerp1

            // Sleep mode - animate in pattern when not hovering
            if (!isMouseOver) {
                velocity *= 0.95
                const t1 = time * sleepTimeScale1
                const t2 = time * sleepTimeScale2
                targetX = Math.cos(t1) * sleepXRadius
                targetY = Math.sin(t2) * sleepYRadius
            }

            // Update first point
            points[0].x = mouseX
            points[0].y = mouseY

            // Update trail points
            for (let i = 1; i < numPoints; i++) {
                const dx = points[i - 1].x - points[i].x
                const dy = points[i - 1].y - points[i].y
                points[i].x += dx * curveLerp2
                points[i].y += dy * curveLerp2
            }

            // Decay velocity
            velocity *= 0.9

            // Clear canvas
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

            // Only draw glow when cursor is moving
            if (velocity > 0.05) {
                drawTrail(glowRadius, 0.3)
            }
            
            // Draw core line
            drawTrail(lineRadius, 0.8)

            animationId = requestAnimationFrame(render)
        }

        function drawTrail(radius: number, alphaMultiplier: number) {
            const vertices: number[] = []
            const alphas: number[] = []

            for (let i = 0; i < numPoints - 1; i++) {
                const p1 = points[i]
                const p2 = points[i + 1]

                const dx = p2.x - p1.x
                const dy = p2.y - p1.y
                const len = Math.sqrt(dx * dx + dy * dy) || 0.001
                const nx = -dy / len
                const ny = dx / len

                const progress = i / (numPoints - 1)
                const alpha = (1 - progress) * alphaMultiplier

                const r = radius * (1 - progress * 0.5)

                vertices.push(
                    p1.x + nx * r, p1.y + ny * r,
                    p1.x - nx * r, p1.y - ny * r,
                    p2.x + nx * r, p2.y + ny * r,
                    p2.x - nx * r, p2.y - ny * r
                )

                alphas.push(alpha, alpha, alpha, alpha)
            }

            // Color based on velocity and time cycling
            const velocityT = Math.min(velocity / 10, 1)
            const cycleT = (Math.sin(colorCycleTime) + 1) / 2
            
            // Section-based color shift
            let sectionShift = 0
            if (sectionColorChange) {
                sectionShift = currentSection * 0.25
            }
            
            const combinedT = Math.min(Math.max(velocityT * 0.5 + cycleT * 0.3 + sectionShift, 0), 1)
            
            const color: [number, number, number] = [
                colorStartRgb[0] + (colorEndRgb[0] - colorStartRgb[0]) * combinedT,
                colorStartRgb[1] + (colorEndRgb[1] - colorStartRgb[1]) * combinedT,
                colorStartRgb[2] + (colorEndRgb[2] - colorStartRgb[2]) * combinedT,
            ]

            gl.uniform3fv(colorLocation, color)

            const positionBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
            gl.enableVertexAttribArray(positionLocation)
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

            const alphaBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW)
            gl.enableVertexAttribArray(alphaLocation)
            gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2)

            gl.deleteBuffer(positionBuffer)
            gl.deleteBuffer(alphaBuffer)
        }

        // Handle resize
        function handleResize() {
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * window.devicePixelRatio
            canvas.height = rect.height * window.devicePixelRatio
        }

        handleResize()
        window.addEventListener("resize", handleResize)

        render()

        return () => {
            cancelAnimationFrame(animationId)
            canvas.removeEventListener("mousemove", handleMouseMove)
            canvas.removeEventListener("mouseenter", handleMouseEnter)
            canvas.removeEventListener("mouseleave", handleMouseLeave)
            window.removeEventListener("resize", handleResize)
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
        }
    }, [
        colorStart,
        colorEnd,
        curveLerp1,
        curveLerp2,
        lineRadius,
        glowRadius,
        sleepXRadius,
        sleepYRadius,
        sleepTimeScale1,
        sleepTimeScale2,
        isStatic,
        colorCycleSpeed,
        sectionColorChange,
    ])

    // Static preview
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <svg
                    width="200"
                    height="100"
                    viewBox="0 0 200 100"
                    style={{ filter: `drop-shadow(0 0 10px ${colorStart})` }}
                >
                    <path
                        d="M 20 50 Q 60 20, 100 50 T 180 50"
                        stroke={colorStart}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.8"
                    />
                    <path
                        d="M 20 50 Q 60 20, 100 50 T 180 50"
                        stroke={colorEnd}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.3"
                    />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        bottom: 20,
                        fontSize: previewTextSize,
                        color: previewTextColor,
                        fontFamily: "sans-serif",
                    }}
                >
                    {previewText}
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    cursor: isHovered ? "none" : "default",
                }}
            />
        </div>
    )
}

addPropertyControls(NeonCursor, {
    colorStart: {
        type: ControlType.Color,
        title: "Color Start",
        defaultValue: "#00FFFF",
    },
    colorEnd: {
        type: ControlType.Color,
        title: "Color End",
        defaultValue: "#FF00FF",
    },
    colorCycleSpeed: {
        type: ControlType.Number,
        title: "Color Cycle Speed",
        defaultValue: 2.0,
        min: 0.1,
        max: 10,
        step: 0.1,
        displayStepper: false,
    },
    sectionColorChange: {
        type: ControlType.Boolean,
        title: "Section Color Change",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    curveLerp1: {
        type: ControlType.Number,
        title: "Curve Lerp 1",
        defaultValue: 0.15,
        min: 0.01,
        max: 1,
        step: 0.01,
        displayStepper: false,
    },
    curveLerp2: {
        type: ControlType.Number,
        title: "Curve Lerp 2",
        defaultValue: 0.3,
        min: 0.01,
        max: 1,
        step: 0.01,
        displayStepper: false,
    },
    lineRadius: {
        type: ControlType.Number,
        title: "Line Radius",
        defaultValue: 0.015,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        displayStepper: false,
    },
    glowRadius: {
        type: ControlType.Number,
        title: "Glow Radius",
        defaultValue: 0.04,
        min: 0.001,
        max: 0.2,
        step: 0.001,
        displayStepper: false,
    },
    sleepXRadius: {
        type: ControlType.Number,
        title: "Sleep X Radius",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
    },
    sleepYRadius: {
        type: ControlType.Number,
        title: "Sleep Y Radius",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
    },
    sleepTimeScale1: {
        type: ControlType.Number,
        title: "Sleep Time Scale 1",
        defaultValue: 1.0,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: false,
    },
    sleepTimeScale2: {
        type: ControlType.Number,
        title: "Sleep Time Scale 2",
        defaultValue: 1.0,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: false,
    },
    previewText: {
        type: ControlType.String,
        title: "Preview Text",
        defaultValue: "Preview mode - Publish to see effect",
        displayTextArea: true,
    },
    previewTextColor: {
        type: ControlType.Color,
        title: "Preview Text Color",
        defaultValue: "#666666",
    },
    previewTextSize: {
        type: ControlType.Number,
        title: "Preview Text Size",
        defaultValue: 12,
        min: 8,
        max: 24,
        step: 1,
        displayStepper: false,
    },
})

NeonCursor.displayName = "Neon Cursor Trail Effect"