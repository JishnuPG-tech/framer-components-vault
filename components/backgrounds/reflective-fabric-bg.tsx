// Made with 💛 by Karim Saif
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
import React, { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ==========================================
// PRESETS & INTERFACES
// ==========================================
type PresetType =
    | "Signature"
    | "Aurora"
    | "Cosmic"
    | "Electric"
    | "Ocean"
    | "Sunset"
    | "Mono"
    | "Custom"

interface PresetConfig {
    primary: string
    secondary: string
    background: string
    scale: number
    distortion: number
    intensity: number
}

interface Props {
    preset: PresetType
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    intensity: number
    opacity: number
    patternScale: number
    distortion: number
    detail: number
    rotation: number
    animate: boolean
    speed: number
    direction: "Forward" | "Reverse"
    interaction: "None" | "Mouse"
    interactionStrength: number
    smoothing: number
    resolution: "Performance" | "Balanced" | "Quality"
    blendMode: "normal" | "screen" | "overlay" | "soft-light" | "multiply"
    ariaLabel: string
    decorative: boolean
}

// Defensive hex to RGB vector converter
const hexToRgbVector = (hex: string): [number, number, number] => {
    let cleanHex = (hex || "").replace("#", "")
    if (cleanHex.length === 3) {
        cleanHex = cleanHex
            .split("")
            .map((char) => char + char)
            .join("")
    }
    const num = parseInt(cleanHex, 16)
    if (isNaN(num)) {
        return [0.06, 0.12, 0.19] // Safe default fallback color
    }
    return [
        ((num >> 16) & 255) / 255,
        ((num >> 8) & 255) / 255,
        (num & 255) / 255,
    ]
}

const PRESETS: Record<Exclude<PresetType, "Custom">, PresetConfig> = {
    Signature: {
        primary: "#102030",
        secondary: "#3060ff",
        background: "#222222",
        scale: 8.0,
        distortion: 1.0,
        intensity: 1.0,
    },
    Aurora: {
        primary: "#052e16",
        secondary: "#10b981",
        background: "#021c0d",
        scale: 7.0,
        distortion: 0.7,
        intensity: 1.1,
    },
    Cosmic: {
        primary: "#2e1065",
        secondary: "#d946ef",
        background: "#130526",
        scale: 10.0,
        distortion: 1.5,
        intensity: 1.3,
    },
    Electric: {
        primary: "#0f172a",
        secondary: "#38bdf8",
        background: "#020617",
        scale: 8.5,
        distortion: 1.2,
        intensity: 1.2,
    },
    Ocean: {
        primary: "#082f49",
        secondary: "#0ea5e9",
        background: "#030d16",
        scale: 9.0,
        distortion: 0.9,
        intensity: 1.0,
    },
    Sunset: {
        primary: "#451a03",
        secondary: "#f97316",
        background: "#1a0901",
        scale: 7.5,
        distortion: 1.1,
        intensity: 1.2,
    },
    Mono: {
        primary: "#09090b",
        secondary: "#71717a",
        background: "#000000",
        scale: 8.0,
        distortion: 1.0,
        intensity: 0.9,
    },
}

// ==========================================
// COMPONENT: Karim Saif Shader Flow Pro
// ==========================================
export default function KarimSaifShaderFlowPro({
    preset = "Signature",
    primaryColor = "#102030",
    secondaryColor = "#3060ff",
    backgroundColor = "#222222",
    intensity = 1.0,
    opacity = 100,
    patternScale = 8.0,
    distortion = 1.0,
    detail = 12,
    rotation = 0.0,
    animate = true,
    speed = 1.0,
    direction = "Forward",
    interaction = "Mouse",
    interactionStrength = 1.0,
    smoothing = 0.1,
    resolution = "Balanced",
    blendMode = "normal",
    ariaLabel = "Animated WebGL shader background",
    decorative = true,
}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const isStaticRenderer = useIsStaticRenderer()

    // React state for fallback rendering safeguards
    const [webglSupported, setWebglSupported] = useState<boolean>(true)

    // Viewport visibility & reduced motion preference refs
    const isVisibleRef = useRef<boolean>(true)
    const prefersReducedMotion = useRef<boolean>(false)

    // Mouse tracking refs
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

    // Resolve preset configuration vs custom props
    const activeConfig: PresetConfig =
        preset !== "Custom" && PRESETS[preset]
            ? PRESETS[preset]
            : {
                  primary: primaryColor,
                  secondary: secondaryColor,
                  background: backgroundColor,
                  scale: patternScale,
                  distortion,
                  intensity,
              }

    const effectiveScale =
        preset !== "Custom" ? activeConfig.scale : patternScale
    const effectiveDistortion =
        preset !== "Custom" ? activeConfig.distortion : distortion
    const effectiveIntensity =
        preset !== "Custom" ? activeConfig.intensity : intensity
    const effectiveBackground =
        preset !== "Custom" ? activeConfig.background : backgroundColor

    // Check system reduced-motion preference
    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia) {
            const mediaQuery = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            )
            prefersReducedMotion.current = mediaQuery.matches
            const listener = (e: MediaQueryListEvent) => {
                prefersReducedMotion.current = e.matches
            }
            mediaQuery.addEventListener("change", listener)
            return () => mediaQuery.removeEventListener("change", listener)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl2", {
            powerPreference: "high-performance",
        })
        if (!gl) {
            setWebglSupported(false)
            return
        }

        // --- SHADER SOURCES (With safe clamp handling to prevent tangent overflow) ---
        const vsSource = `#version 300 es
        precision highp float;
        in vec4 position;
        void main() {
            gl_Position = vec4(position);
        }`

        const fsSource = `#version 300 es
        precision highp float;
        out vec4 fragColor;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform float u_scale;
        uniform float u_distortion;
        uniform float u_intensity;
        uniform float u_detail;
        uniform float u_rotation;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
          
        #define R u_resolution
        #define T u_time

        vec2 rotate(vec2 v, float a) {
            float s = sin(a);
            float c = cos(a);
            mat2 m = mat2(c, -s, s, c);
            return m * v;
        }

        void mainImage0(out vec4 O, in vec2 I) {
            vec2 p = (I + I - R) / R.y * u_scale;
            p = rotate(p, u_rotation);
            p += u_mouse * 0.5;
            
            // Safe clamping to avoid mathematical instability in tangent calculations
            vec2 safeCoord = clamp(p - T, -12.0, 12.0);
            vec2 warped = tan(abs(safeCoord)) + (8.0 * u_distortion) * sin(p.x + T) + p;
            float len = length(warped);
            
            vec3 blendedColor = mix(u_color1, u_color2, clamp(len * 0.2, 0.0, 1.0));
            O = tanh(vec4(blendedColor, 1.0) / (len + 0.001)) * u_intensity;
        }

        void mainImage(out vec4 o, in vec2 u) {
            float s = u_detail;
            float k;
            vec2 j = vec2(0.5);
            o = vec4(0.0);
            vec4 c;

            mainImage0(c, u);
            for (k = s; k-- > 0.5; ) {
                mainImage0(c, u + j - 0.5);
                o += c;
                j = fract(j + vec2(0.755, 0.57).yx);
            }

            o /= s;
            o.a = 1.0;
        }

        void main() {
            vec4 color;
            mainImage(color, gl_FragCoord.xy);
            fragColor = color;
        }`

        const createShader = (
            glContext: WebGL2RenderingContext,
            type: number,
            source: string
        ) => {
            const shader = glContext.createShader(type)
            if (!shader) return null
            glContext.shaderSource(shader, source)
            glContext.compileShader(shader)
            if (
                !glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)
            ) {
                glContext.deleteShader(shader)
                return null
            }
            return shader
        }

        const vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource)
        const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
        if (!vertShader || !fragShader) {
            setWebglSupported(false)
            return
        }

        const program = gl.createProgram()
        if (!program) {
            setWebglSupported(false)
            return
        }
        gl.attachShader(program, vertShader)
        gl.attachShader(program, fragShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program)
            setWebglSupported(false)
            return
        }

        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        const positions = new Float32Array([
            -1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0,
        ])
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

        const positionAttributeLocation = gl.getAttribLocation(
            program,
            "position"
        )
        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        gl.enableVertexAttribArray(positionAttributeLocation)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.vertexAttribPointer(
            positionAttributeLocation,
            3,
            gl.FLOAT,
            false,
            0,
            0
        )

        const timeLocation = gl.getUniformLocation(program, "u_time")
        const resolutionLocation = gl.getUniformLocation(
            program,
            "u_resolution"
        )
        const mouseLocation = gl.getUniformLocation(program, "u_mouse")
        const scaleLocation = gl.getUniformLocation(program, "u_scale")
        const distortionLocation = gl.getUniformLocation(
            program,
            "u_distortion"
        )
        const intensityLocation = gl.getUniformLocation(program, "u_intensity")
        const detailLocation = gl.getUniformLocation(program, "u_detail")
        const rotationLocation = gl.getUniformLocation(program, "u_rotation")
        const color1Location = gl.getUniformLocation(program, "u_color1")
        const color2Location = gl.getUniformLocation(program, "u_color2")

        let animationFrameId: number | null = null
        let currentTime = 10.0
        let lastTimestamp: number | null = null

        // Cache color uniform vectors once outside loop to optimize frame rate performance
        const rgb1 = hexToRgbVector(activeConfig.primary)
        const rgb2 = hexToRgbVector(activeConfig.secondary)

        // Adaptive DPR multiplier strategy
        const dprMultiplier =
            resolution === "Performance"
                ? 0.5
                : resolution === "Quality"
                  ? Math.min(window.devicePixelRatio, 1.5)
                  : Math.min(window.devicePixelRatio, 1.0)

        // ResizeObserver implementation to gracefully manage sizing across responsive Framer bounds
        const updateCanvasSize = () => {
            if (!canvas) return
            const displayWidth = Math.floor(canvas.clientWidth * dprMultiplier)
            const displayHeight = Math.floor(
                canvas.clientHeight * dprMultiplier
            )
            if (
                canvas.width !== displayWidth ||
                canvas.height !== displayHeight
            ) {
                canvas.width = displayWidth
                canvas.height = displayHeight
            }
        }

        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize()
        })
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }
        updateCanvasSize()

        // WebGL Context loss listener (no forceful page reloads)
        const handleContextLost = (e: Event) => {
            e.preventDefault()
            stopAnimation()
        }
        canvas.addEventListener("webglcontextlost", handleContextLost, false)

        const drawFrame = (timestamp: number) => {
            if (lastTimestamp === null) {
                lastTimestamp = timestamp
            }
            const deltaTime = Math.min((timestamp - lastTimestamp) * 0.001, 0.1)
            lastTimestamp = timestamp

            updateCanvasSize()

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
            gl.useProgram(program)
            gl.bindVertexArray(vao)

            if (interaction !== "None") {
                mouseRef.current.x +=
                    (mouseRef.current.targetX - mouseRef.current.x) *
                    smoothing *
                    0.5
                mouseRef.current.y +=
                    (mouseRef.current.targetY - mouseRef.current.y) *
                    smoothing *
                    0.5
            }

            const dirFactor = direction === "Forward" ? 1.0 : -1.0
            const normalizedSpeed = speed * 0.001
            const shouldAnimate =
                animate && !isStaticRenderer && !prefersReducedMotion.current

            if (shouldAnimate && isVisibleRef.current) {
                currentTime += deltaTime * 60 * normalizedSpeed * 60 * dirFactor
            }

            gl.uniform1f(timeLocation, currentTime)
            gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)
            gl.uniform2f(
                mouseLocation,
                mouseRef.current.x * interactionStrength,
                mouseRef.current.y * interactionStrength
            )
            gl.uniform1f(scaleLocation, effectiveScale)
            gl.uniform1f(distortionLocation, effectiveDistortion)
            gl.uniform1f(intensityLocation, effectiveIntensity)
            gl.uniform1f(detailLocation, detail)
            gl.uniform1f(rotationLocation, (rotation * Math.PI) / 180)
            gl.uniform3f(color1Location, rgb1[0], rgb1[1], rgb1[2])
            gl.uniform3f(color2Location, rgb2[0], rgb2[1], rgb2[2])

            gl.drawArrays(gl.TRIANGLES, 0, 6)
        }

        const renderLoop = (timestamp: number) => {
            drawFrame(timestamp)
            animationFrameId = requestAnimationFrame(renderLoop)
        }

        const stopAnimation = () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }

        const startAnimation = () => {
            const shouldAnimate =
                animate && !isStaticRenderer && !prefersReducedMotion.current
            if (
                shouldAnimate &&
                isVisibleRef.current &&
                animationFrameId === null
            ) {
                lastTimestamp = null
                animationFrameId = requestAnimationFrame(renderLoop)
            }
        }

        // Direct IntersectionObserver lifecycle management for high-density Framer pages
        let observer: IntersectionObserver | null = null
        if (containerRef.current) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    isVisibleRef.current = entry.isIntersecting
                    if (entry.isIntersecting) {
                        startAnimation()
                    } else {
                        stopAnimation()
                    }
                },
                { threshold: 0.05 }
            )
            observer.observe(containerRef.current)
        }

        const shouldAnimate =
            animate && !isStaticRenderer && !prefersReducedMotion.current
        if (!shouldAnimate) {
            drawFrame(0)
        } else if (isVisibleRef.current) {
            startAnimation()
        }

        return () => {
            stopAnimation()
            if (observer) observer.disconnect()
            resizeObserver.disconnect()
            if (canvas) {
                canvas.removeEventListener(
                    "webglcontextlost",
                    handleContextLost
                )
            }
            gl.deleteProgram(program)
            gl.deleteShader(vertShader)
            gl.deleteShader(fragShader)
            gl.deleteBuffer(positionBuffer)
            gl.deleteVertexArray(vao)
        }
    }, [
        preset,
        effectiveIntensity,
        effectiveScale,
        effectiveDistortion,
        detail,
        rotation,
        animate,
        speed,
        direction,
        interaction,
        interactionStrength,
        smoothing,
        resolution,
        isStaticRenderer,
    ])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (interaction === "None") return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
        mouseRef.current.targetX = x
        mouseRef.current.targetY = y
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                background: webglSupported
                    ? effectiveBackground
                    : `radial-gradient(circle at 50% 50%, ${activeConfig.primary}, ${activeConfig.secondary})`,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: opacity / 100,
                mixBlendMode: blendMode,
                pointerEvents: interaction === "None" ? "none" : "auto",
            }}
            onMouseMove={interaction !== "None" ? handleMouseMove : undefined}
            aria-label={decorative ? undefined : ariaLabel}
            aria-hidden={decorative}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: webglSupported ? "block" : "none",
                }}
            />
        </div>
    )
}

// Default Props Fallback for Framer Component Distribution
KarimSaifShaderFlowPro.defaultProps = {
    preset: "Signature",
    primaryColor: "#102030",
    secondaryColor: "#3060ff",
    backgroundColor: "#222222",
    intensity: 1.0,
    opacity: 100,
    patternScale: 8.0,
    distortion: 1.0,
    detail: 12,
    rotation: 0.0,
    animate: true,
    speed: 1.0,
    direction: "Forward",
    interaction: "Mouse",
    interactionStrength: 1.0,
    smoothing: 0.1,
    resolution: "Balanced",
    blendMode: "normal",
    ariaLabel: "Animated WebGL shader background",
    decorative: true,
}

// ==========================================
// FRAMER PROPERTY CONTROLS
// ==========================================
addPropertyControls(KarimSaifShaderFlowPro, {
    // 🎨 Appearance
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "Signature",
            "Aurora",
            "Cosmic",
            "Electric",
            "Ocean",
            "Sunset",
            "Mono",
            "Custom",
        ],
        defaultValue: "Signature",
        description: "Choose a curated visual style.",
        section: "Appearance",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#102030",
        hidden: (props) => props.preset !== "Custom",
        description: "Base tone for the shader gradient.",
        section: "Appearance",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#3060ff",
        hidden: (props) => props.preset !== "Custom",
        description: "Highlight tone for the shader gradient.",
        section: "Appearance",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#222222",
        hidden: (props) => props.preset !== "Custom",
        description: "Container canvas backdrop color.",
        section: "Appearance",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        hidden: (props) => props.preset !== "Custom",
        description: "Overall brightness and glow intensity.",
        section: "Appearance",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        display: "slider",
        description: "Component transparency layer.",
        section: "Appearance",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: ["normal", "screen", "overlay", "soft-light", "multiply"],
        defaultValue: "normal",
        description: "CSS blend mode for layering over content.",
        section: "Appearance",
    },

    // 🌊 Shader Geometry
    patternScale: {
        type: ControlType.Number,
        title: "Pattern Scale",
        defaultValue: 8.0,
        min: 1.0,
        max: 30.0,
        step: 0.5,
        hidden: (props) => props.preset !== "Custom",
        description: "Coordinate scale frequency of the fractal math.",
        section: "Shader Geometry",
    },
    distortion: {
        type: ControlType.Number,
        title: "Distortion",
        defaultValue: 1.0,
        min: 0.0,
        max: 3.0,
        step: 0.1,
        hidden: (props) => props.preset !== "Custom",
        description: "Wave chaos and warp intensity.",
        section: "Shader Geometry",
    },
    detail: {
        type: ControlType.Enum,
        title: "Shader Samples",
        options: [4, 8, 12, 16],
        optionTitles: ["Low (4)", "Medium (8)", "High (12)", "Ultra (16)"],
        defaultValue: 12,
        description:
            "Sample loops per pixel balancing quality and rendering cost.",
        section: "Shader Geometry",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        description: "Angle rotation of the coordinates.",
        section: "Shader Geometry",
    },

    // ⚡ Animation
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        description: "Toggles continuous time movement.",
        section: "Animation",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        description: "Normalized speed of the shader time loop.",
        section: "Animation",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Forward", "Reverse"],
        defaultValue: "Forward",
        description: "Flow direction of the shader pattern.",
        section: "Animation",
    },

    // 🖱️ Interaction
    interaction: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["None", "Mouse"],
        defaultValue: "Mouse",
        description: "Enables cursor reactivity.",
        section: "Interaction",
    },
    interactionStrength: {
        type: ControlType.Number,
        title: "Influence",
        defaultValue: 1.0,
        min: 0.0,
        max: 3.0,
        step: 0.1,
        description: "How strongly the mouse position bends the effect.",
        section: "Interaction",
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.1,
        min: 0.01,
        max: 1.0,
        step: 0.01,
        description: "Lag/easing applied to mouse movement.",
        section: "Interaction",
    },

    // 🚀 Performance
    resolution: {
        type: ControlType.Enum,
        title: "Resolution Quality",
        options: ["Performance", "Balanced", "Quality"],
        defaultValue: "Balanced",
        description: "Pixel density scaling for high-performance displays.",
        section: "Performance",
    },

    // ♿ Accessibility
    decorative: {
        type: ControlType.Boolean,
        title: "Decorative",
        defaultValue: true,
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
        section: "Accessibility",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Animated WebGL shader background",
        description: "Screen reader text description.",
        hidden: (props) => props.decorative,
        section: "Accessibility",
    },
})
