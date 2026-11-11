import * as React from "react"
import { useRef, useEffect, useState } from "react"
import { motion, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function KinematicSilk(props) {
    const {
        image,
        windSpeed,
        fabricWeight,
        interactionStrength,
        pinEdges,
        lightingIntensity,
    } = props

    // THE FIX: Check if we are in the Framer canvas or exporting
    const isStatic = useIsStaticRenderer()

    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const requestRef = useRef(null)

    // Physics springs for the mouse so the cloth "drags" heavily and snaps back
    const mouseX = useSpring(-999, { stiffness: 100, damping: 20 })
    const mouseY = useSpring(-999, { stiffness: 100, damping: 20 })

    useEffect(() => {
        // THE FIX: Completely abort the WebGL setup if we are in the Framer editor
        if (isStatic) return

        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container || !image) return

        const gl =
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl")
        if (!gl) {
            console.error("WebGL not supported")
            return
        }

        // --- 1. WEBGL SHADER CODE ---
        const vsSource = `
            attribute vec2 a_position;
            attribute vec2 a_uv;
            varying vec2 v_uv;
            void main() {
                v_uv = a_uv;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `
        const fsSource = `
            precision highp float;
            varying vec2 v_uv;
            uniform sampler2D u_image;
            uniform vec2 u_mouse;
            uniform float u_time;
            uniform float u_windSpeed;
            uniform float u_fluidity;
            uniform float u_interaction;
            uniform float u_lighting;
            uniform float u_aspect;
            uniform float u_pinning;

            void main() {
                vec2 uv = v_uv;
                
                // Adjust for aspect ratio so ripples are perfectly circular
                vec2 aspectUV = vec2(uv.x * u_aspect, uv.y);
                vec2 aspectMouse = vec2(u_mouse.x * u_aspect, u_mouse.y);
                
                float dist = distance(aspectUV, aspectMouse);

                // Wind & Ambient Ripples (Silk billow effect)
                float wave1 = sin(uv.x * u_fluidity + u_time * u_windSpeed) * 0.015;
                float wave2 = cos(uv.y * u_fluidity * 0.8 + u_time * u_windSpeed * 1.2) * 0.015;
                float ambient = wave1 + wave2;

                // Mouse Drag Interaction (Liquid pull)
                float ripple = sin(dist * 15.0 - u_time * 5.0) * exp(-dist * 4.0) * 0.05 * u_interaction;

                vec2 distortion = vec2(ambient + ripple, ambient - ripple);

                // Edge Pinning logic
                if (u_pinning > 0.5) {
                    float pinTop = smoothstep(0.0, 0.2, uv.y);
                    distortion *= pinTop;
                }

                // Apply distortion to the image texture coordinates
                vec4 texColor = texture2D(u_image, uv + distortion);

                // Fake 3D Lighting & Shadows
                float shadow = 1.0 + (distortion.x + distortion.y) * (15.0 * u_lighting);
                texColor.rgb *= shadow;

                gl_FragColor = texColor;
            }
        `

        const compileShader = (gl, type, source) => {
            const shader = gl.createShader(type)
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader))
                gl.deleteShader(shader)
                return null
            }
            return shader
        }

        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource)
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)
        const program = gl.createProgram()
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)
        gl.useProgram(program)

        // --- 2. GEOMETRY SETUP ---
        const vertices = new Float32Array([
            -1.0, -1.0, 0.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 0.0,
        ])

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

        const FSIZE = vertices.BYTES_PER_ELEMENT
        const a_position = gl.getAttribLocation(program, "a_position")
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, FSIZE * 4, 0)
        gl.enableVertexAttribArray(a_position)

        const a_uv = gl.getAttribLocation(program, "a_uv")
        gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2)
        gl.enableVertexAttribArray(a_uv)

        // --- 3. TEXTURE LOADING ---
        const texture = gl.createTexture()
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = image

        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            )
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            setIsLoaded(true)
        }

        // --- 4. UNIFORM LOCATIONS ---
        const u_mouse = gl.getUniformLocation(program, "u_mouse")
        const u_time = gl.getUniformLocation(program, "u_time")
        const u_windSpeed = gl.getUniformLocation(program, "u_windSpeed")
        const u_fluidity = gl.getUniformLocation(program, "u_fluidity")
        const u_interaction = gl.getUniformLocation(program, "u_interaction")
        const u_aspect = gl.getUniformLocation(program, "u_aspect")
        const u_pinning = gl.getUniformLocation(program, "u_pinning")
        const u_lighting = gl.getUniformLocation(program, "u_lighting")

        let time = 0

        // --- 5. RENDER LOOP ---
        const render = () => {
            const width = container.offsetWidth
            const height = container.offsetHeight

            if (width !== canvas.width || height !== canvas.height) {
                const dpr = window.devicePixelRatio || 1
                canvas.width = width * dpr
                canvas.height = height * dpr
                canvas.style.width = `${width}px`
                canvas.style.height = `${height}px`
                gl.viewport(0, 0, canvas.width, canvas.height)
            }

            time += 0.01

            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.uniform1f(u_time, time)
            gl.uniform1f(u_windSpeed, windSpeed)
            gl.uniform1f(u_fluidity, fabricWeight)
            gl.uniform1f(u_interaction, interactionStrength)
            gl.uniform1f(u_lighting, lightingIntensity)
            gl.uniform1f(u_pinning, pinEdges ? 1.0 : 0.0)
            gl.uniform1f(u_aspect, canvas.width / canvas.height)

            let normalizedMouseX = -10
            let normalizedMouseY = -10

            if (mouseX.get() !== -999) {
                normalizedMouseX = mouseX.get() / width
                normalizedMouseY = mouseY.get() / height
            }
            gl.uniform2f(u_mouse, normalizedMouseX, normalizedMouseY)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            requestRef.current = requestAnimationFrame(render)
        }

        render()

        return () => {
            cancelAnimationFrame(requestRef.current)
            gl.deleteProgram(program)
            gl.deleteTexture(texture)
        }
    }, [
        image,
        windSpeed,
        fabricWeight,
        interactionStrength,
        pinEdges,
        lightingIntensity,
        isStatic, // ADDED DEPENDENCY
    ])

    const handlePointerMove = (e) => {
        if (isStatic) return
        const rect = containerRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
    }

    const handlePointerLeave = () => {
        if (isStatic) return
        mouseX.set(-999)
        mouseY.set(-999)
    }

    return (
        <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: "inherit",
                backgroundColor: "#000",
            }}
        >
            {isStatic ? (
                /* THE FIX: Render a perfectly safe, static image for the Framer Canvas */
                image ? (
                    <img
                        src={image}
                        alt="Kinematic Silk Static Preview"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#666",
                            fontSize: "12px",
                            fontFamily: "sans-serif",
                        }}
                    >
                        Link a texture to preview
                    </div>
                )
            ) : (
                /* LIVE WEBGL CANVAS */
                <>
                    {!isLoaded && (
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                color: "#666",
                                fontSize: "12px",
                                fontFamily: "sans-serif",
                            }}
                        >
                            Loading Texture...
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </>
            )}
        </div>
    )
}

addPropertyControls(KinematicSilk, {
    image: {
        type: ControlType.Image,
        title: "Image",
    },
    fabricWeight: {
        type: ControlType.Number,
        title: "Fabric Weight",
        defaultValue: 10,
        min: 2,
        max: 30,
    },
    windSpeed: {
        type: ControlType.Number,
        title: "Wind Billow",
        defaultValue: 1.5,
        min: 0,
        max: 5,
        step: 0.1,
    },
    interactionStrength: {
        type: ControlType.Number,
        title: "Drag Force",
        defaultValue: 1.2,
        min: 0,
        max: 3,
        step: 0.1,
    },
    lightingIntensity: {
        type: ControlType.Number,
        title: "3D Shadows",
        defaultValue: 0.8,
        min: 0,
        max: 2,
        step: 0.1,
    },
    pinEdges: {
        type: ControlType.Boolean,
        title: "Pin Top Edge",
        defaultValue: true,
    },
})
