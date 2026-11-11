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

import { animate, useMotionValue } from "framer-motion"

// --- GLSL Shaders ---

const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
        v_uv = a_position * 0.5 + 0.5;
        v_uv.y = 1.0 - v_uv.y; 
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`

const fragmentShaderSource = `
    precision highp float;
    
    uniform sampler2D u_image1;
    uniform sampler2D u_image2;
    uniform float u_progress;
    uniform vec2 u_scale1;
    uniform vec2 u_scale2;
    uniform int u_effect; 
    
    varying vec2 v_uv;

    // --- Helper Functions ---
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix( mix( random( i + vec2(0.0,0.0) ),
                         random( i + vec2(1.0,0.0) ), u.x),
                    mix( random( i + vec2(0.0,1.0) ),
                         random( i + vec2(1.0,1.0) ), u.x), u.y);
    }

    void main() {
        vec2 uv = v_uv;
        float PI = 3.14159265359;
        float intensity = sin(u_progress * PI);
        
        vec2 distortedUv1 = uv;
        vec2 distortedUv2 = uv;
        float mixFactor = u_progress; 
        
        // --- 0: LIQUID MELT ---
        if (u_effect == 0) {
            float waveX = sin(uv.y * 15.0 + u_progress * 10.0) * 0.08 * intensity;
            float waveY = cos(uv.x * 15.0 + u_progress * 10.0) * 0.08 * intensity;
            float melt = intensity * 0.15 * sin(uv.x * 20.0);
            distortedUv1 = vec2(uv.x + waveX, uv.y + waveY + melt);
            distortedUv2 = vec2(uv.x - waveX, uv.y - waveY - melt);
        }
        
        // --- 1: GLASS SHATTER ---
        else if (u_effect == 1) {
            vec2 grid = floor(uv * 12.0) / 12.0;
            float rnd = random(grid);
            vec2 shift = vec2(rnd - 0.5, random(grid + 0.1) - 0.5) * 0.5 * intensity;
            distortedUv1 = uv + shift;
            distortedUv2 = uv - shift;
        }
        
        // --- 2: TSUNAMI WIPE ---
        else if (u_effect == 2) {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(uv, center);
            float ripple = sin(dist * 30.0 - u_progress * 15.0) * 0.05 * intensity;
            vec2 dir = normalize(uv - center);
            distortedUv1 = uv + dir * ripple;
            distortedUv2 = uv + dir * ripple;
            float wipe = smoothstep(u_progress * 1.5 - 0.2, u_progress * 1.5, dist + ripple);
            mixFactor = 1.0 - wipe;
        }

        // --- 3: NOISE BURN ---
        else if (u_effect == 3) {
            float n = noise(uv * 8.0);
            distortedUv1 = uv + (n - 0.5) * intensity * 0.1;
            distortedUv2 = uv - (n - 0.5) * intensity * 0.1;
            mixFactor = smoothstep(n - 0.2, n + 0.2, u_progress);
        }

        // --- 4: GLITCH SLICER ---
        else if (u_effect == 4) {
            float bands = floor(uv.y * 40.0);
            float shift = (random(vec2(bands, bands)) - 0.5) * 2.0; 
            distortedUv1 = uv + vec2(shift * intensity * 0.3, 0.0);
            distortedUv2 = uv - vec2(shift * intensity * 0.3, 0.0);
        }

        // --- 5: VORTEX TWIST ---
        else if (u_effect == 5) {
            vec2 center = vec2(0.5);
            vec2 dir = uv - center;
            float dist = length(dir);
            float angle = intensity * 3.0 * (1.0 - dist * 2.0);
            float s = sin(angle);
            float c = cos(angle);
            mat2 rot = mat2(c, -s, s, c);
            distortedUv1 = center + rot * dir;
            mat2 rot2 = mat2(c, s, -s, c);
            distortedUv2 = center + rot2 * dir;
        }
        
        // --- Apply Object Fit Cropping ---
        vec2 finalUv1 = (distortedUv1 - 0.5) * u_scale1 + 0.5;
        vec2 finalUv2 = (distortedUv2 - 0.5) * u_scale2 + 0.5;
        
        vec4 color1 = texture2D(u_image1, finalUv1);
        vec4 color2 = texture2D(u_image2, finalUv2);
        
        gl_FragColor = mix(color1, color2, mixFactor);
    }
`

/**
 * @framerDisableUnlink
 */
export default function WebGlHover(props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const progress = useMotionValue(0)

    // NEW: State to store the natural aspect ratio of Image 1
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(
        undefined
    )

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl")
        if (!gl) return

        const imgSizes = {
            1: { w: 1, h: 1, loaded: false },
            2: { w: 1, h: 1, loaded: false },
        }

        const compileShader = (type: number, source: string) => {
            const shader = gl.createShader(type)
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            return shader
        }

        const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource)
        const fragmentShader = compileShader(
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        )

        const program = gl.createProgram()
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)
        gl.useProgram(program)

        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
                1.0,
            ]),
            gl.STATIC_DRAW
        )

        const positionLocation = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

        const progressLoc = gl.getUniformLocation(program, "u_progress")
        const scale1Loc = gl.getUniformLocation(program, "u_scale1")
        const scale2Loc = gl.getUniformLocation(program, "u_scale2")
        const effectLoc = gl.getUniformLocation(program, "u_effect")

        gl.uniform1i(gl.getUniformLocation(program, "u_image1"), 0)
        gl.uniform1i(gl.getUniformLocation(program, "u_image2"), 1)

        const calculateScale = (imgW: number, imgH: number) => {
            if (imgW === 0 || imgH === 0) return [1, 1]
            const canvasW = canvas.clientWidth
            const canvasH = canvas.clientHeight
            const canvasRatio = canvasW / canvasH
            const imgRatio = imgW / imgH

            if (props.fit === "cover") {
                if (canvasRatio > imgRatio) return [1, imgRatio / canvasRatio]
                return [canvasRatio / imgRatio, 1]
            } else if (props.fit === "contain") {
                if (canvasRatio > imgRatio) return [canvasRatio / imgRatio, 1]
                return [1, imgRatio / canvasRatio]
            }
            return [1, 1]
        }

        const draw = () => {
            const s1 = calculateScale(imgSizes[1].w, imgSizes[1].h)
            const s2 = calculateScale(imgSizes[2].w, imgSizes[2].h)
            gl.uniform2f(scale1Loc, s1[0], s1[1])
            gl.uniform2f(scale2Loc, s2[0], s2[1])

            gl.uniform1f(progressLoc, progress.get())
            gl.uniform1i(effectLoc, parseInt(props.effect, 10))

            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.drawArrays(gl.TRIANGLES, 0, 6)
        }

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1
            const w = canvas.clientWidth * dpr
            const h = canvas.clientHeight * dpr

            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
                gl.viewport(0, 0, w, h)
            }
            draw()
        }

        const loadTexture = (url: string, unit: number, id: 1 | 2) => {
            const texture = gl.createTexture()
            gl.activeTexture(gl.TEXTURE0 + unit)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                1,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 0, 0])
            )

            const image = new Image()
            image.crossOrigin = "anonymous"
            image.src = url
            image.onload = () => {
                imgSizes[id] = { w: image.width, h: image.height, loaded: true }

                // NEW: Calculate and set the aspect ratio based on Image 1
                if (id === 1) {
                    setAspectRatio(image.width / image.height)
                }

                gl.activeTexture(gl.TEXTURE0 + unit)
                gl.bindTexture(gl.TEXTURE_2D, texture)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    image
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MAG_FILTER,
                    gl.LINEAR
                )
                draw()
            }
        }

        loadTexture(props.image1, 0, 1)
        loadTexture(props.image2, 1, 2)

        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(canvas)

        const unsubscribe = progress.on("change", () =>
            requestAnimationFrame(draw)
        )

        handleResize()

        return () => {
            unsubscribe()
            resizeObserver.disconnect()
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
        }
    }, [props.image1, props.image2, props.fit, props.effect])

    return (
        <canvas
            ref={canvasRef}
            onMouseEnter={() =>
                animate(progress, 1, {
                    duration: props.duration,
                    ease: "easeOut",
                })
            }
            onMouseLeave={() =>
                animate(progress, 0, {
                    duration: props.duration,
                    ease: "easeOut",
                })
            }
            style={{
                display: "block",
                width: "100%",
                // NEW: Dynamic height based on the toggle and the loaded image ratio
                height: props.autoHeight ? "auto" : "100%",
                aspectRatio:
                    props.autoHeight && aspectRatio ? aspectRatio : undefined,
                cursor: "pointer",
                borderRadius: props.borderRadius,
            }}
        />
    )
}

// --- Framer Property Controls ---

WebGlHover.defaultProps = {
    image1: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    image2: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1000&auto=format&fit=crop",
    effect: "0",
    fit: "cover",
    autoHeight: true,
    duration: 0.8,
    borderRadius: 16,
}

addPropertyControls(WebGlHover, {
    image1: { type: ControlType.Image, title: "Image 1" },
    image2: { type: ControlType.Image, title: "Image 2" },
    effect: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["0", "1", "2", "3", "4", "5"],
        optionTitles: [
            "Liquid Melt",
            "Glass Shatter",
            "Tsunami Wipe",
            "Noise Burn",
            "Glitch Slicer",
            "Vortex Twist",
        ],
    },
    fit: {
        type: ControlType.Enum,
        title: "Object Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
    },
    autoHeight: {
        type: ControlType.Boolean,
        title: "Auto Height",
        description: "Wraps component height to match Image 1's proportions.",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (s)",
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
    },
})
