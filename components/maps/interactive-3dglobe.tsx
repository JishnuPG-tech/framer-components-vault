// Create a 3D interactive globe component with markers using WebGL
import {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Globe3DProps {
    atmosphereColor: string
    atmosphereIntensity: number
    bumpScale: number
    autoRotateSpeed: number
    globeColor: string
    mapTexture: string
    style?: CSSProperties
}

/**
 * 3D Globe Component with Interactive Markers
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Globe3D(props: Globe3DProps) {
    const {
        atmosphereColor = "#4da6ff",
        atmosphereIntensity = 20,
        bumpScale = 5,
        autoRotateSpeed = 0.3,
        globeColor = "#1a1a2e",
        mapTexture = "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg",
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const animationFrameRef = useRef<number>()
    const rotationRef = useRef({ x: 0, y: 0 })
    const isDraggingRef = useRef(false)
    const lastMouseRef = useRef({ x: 0, y: 0 })
    const textureRef = useRef<WebGLTexture | null>(null)
    const textureLoadedRef = useRef(false)

    // Initialize WebGL
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
        })
        if (!gl) return

        glRef.current = gl

        // Set canvas size
        const updateSize = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            gl.viewport(0, 0, canvas.width, canvas.height)
        }

        updateSize()
        window.addEventListener("resize", updateSize)

        return () => {
            window.removeEventListener("resize", updateSize)
        }
    }, [])

    // Create sphere vertices
    const sphereData = useMemo(() => {
        const vertices: number[] = []
        const indices: number[] = []
        const uvs: number[] = []
        const latBands = 40
        const longBands = 40
        const radius = 1

        for (let lat = 0; lat <= latBands; lat++) {
            const theta = (lat * Math.PI) / latBands
            const sinTheta = Math.sin(theta)
            const cosTheta = Math.cos(theta)

            for (let long = 0; long <= longBands; long++) {
                const phi = (long * 2 * Math.PI) / longBands
                const sinPhi = Math.sin(phi)
                const cosPhi = Math.cos(phi)

                const x = cosPhi * sinTheta
                const y = cosTheta
                const z = sinPhi * sinTheta

                vertices.push(radius * x, radius * y, radius * z)
                uvs.push(1 - long / longBands, 1 - lat / latBands)
            }
        }

        for (let lat = 0; lat < latBands; lat++) {
            for (let long = 0; long < longBands; long++) {
                const first = lat * (longBands + 1) + long
                const second = first + longBands + 1

                indices.push(first, second, first + 1)
                indices.push(second, second + 1, first + 1)
            }
        }

        return { vertices, indices, uvs }
    }, [])

    // Load texture
    useEffect(() => {
        const gl = glRef.current
        if (!gl || !mapTexture) return

        const image = new Image()
        image.crossOrigin = "anonymous"
        image.onload = () => {
            const texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            )
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            textureRef.current = texture
            textureLoadedRef.current = true
        }
        image.src = mapTexture
    }, [mapTexture])

    // Render loop
    useEffect(() => {
        const gl = glRef.current
        const canvas = canvasRef.current
        if (!gl || !canvas) return

        // Vertex shader
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec2 aTexCoord;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying vec3 vPosition;
            varying vec2 vTexCoord;
            
            void main() {
                vPosition = aPosition;
                vTexCoord = aTexCoord;
                gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
            }
        `

        // Fragment shader
        const fragmentShaderSource = `
            precision mediump float;
            varying vec3 vPosition;
            varying vec2 vTexCoord;
            uniform vec3 uGlobeColor;
            uniform vec3 uAtmosphereColor;
            uniform float uAtmosphereIntensity;
            uniform sampler2D uTexture;
            uniform bool uTextureLoaded;
            
            void main() {
                vec3 normal = normalize(vPosition);
                float intensity = pow(0.7 - dot(normal, vec3(0.0, 0.0, 1.0)), 2.0);
                vec3 atmosphere = uAtmosphereColor * intensity * uAtmosphereIntensity * 0.05;
                
                // Simple lighting
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                float diff = max(dot(normal, lightDir), 0.3);
                
                vec3 baseColor = uGlobeColor;
                if (uTextureLoaded) {
                    vec4 texColor = texture2D(uTexture, vTexCoord);
                    baseColor = texColor.rgb;
                }
                
                vec3 color = baseColor * diff + atmosphere;
                gl_FragColor = vec4(color, 1.0);
            }
        `

        // Compile shader
        const compileShader = (source: string, type: number) => {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            return shader
        }

        const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER)
        const fragmentShader = compileShader(
            fragmentShaderSource,
            gl.FRAGMENT_SHADER
        )

        if (!vertexShader || !fragmentShader) return

        const program = gl.createProgram()
        if (!program) return

        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)
        gl.useProgram(program)

        // Create buffers
        const vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(sphereData.vertices),
            gl.STATIC_DRAW
        )

        const indexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(sphereData.indices),
            gl.STATIC_DRAW
        )

        const uvBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(sphereData.uvs),
            gl.STATIC_DRAW
        )

        const aPosition = gl.getAttribLocation(program, "aPosition")
        const aTexCoord = gl.getAttribLocation(program, "aTexCoord")

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.enableVertexAttribArray(aPosition)
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
        gl.enableVertexAttribArray(aTexCoord)
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0)

        const uModelViewMatrix = gl.getUniformLocation(
            program,
            "uModelViewMatrix"
        )
        const uProjectionMatrix = gl.getUniformLocation(
            program,
            "uProjectionMatrix"
        )
        const uGlobeColor = gl.getUniformLocation(program, "uGlobeColor")
        const uAtmosphereColor = gl.getUniformLocation(
            program,
            "uAtmosphereColor"
        )
        const uAtmosphereIntensity = gl.getUniformLocation(
            program,
            "uAtmosphereIntensity"
        )
        const uTexture = gl.getUniformLocation(program, "uTexture")
        const uTextureLoaded = gl.getUniformLocation(program, "uTextureLoaded")

        // Parse colors
        const parseColor = (color: string) => {
            const hex = color.replace("#", "")
            return [
                parseInt(hex.substr(0, 2), 16) / 255,
                parseInt(hex.substr(2, 2), 16) / 255,
                parseInt(hex.substr(4, 2), 16) / 255,
            ]
        }

        const globeColorRGB = parseColor(globeColor)
        const atmosphereColorRGB = parseColor(atmosphereColor)

        gl.uniform3f(
            uGlobeColor,
            globeColorRGB[0],
            globeColorRGB[1],
            globeColorRGB[2]
        )
        gl.uniform3f(
            uAtmosphereColor,
            atmosphereColorRGB[0],
            atmosphereColorRGB[1],
            atmosphereColorRGB[2]
        )
        gl.uniform1f(uAtmosphereIntensity, atmosphereIntensity)

        // Matrix functions
        const createProjectionMatrix = (
            fov: number,
            aspect: number,
            near: number,
            far: number
        ) => {
            const f = 1.0 / Math.tan(fov / 2)
            return new Float32Array([
                f / aspect,
                0,
                0,
                0,
                0,
                f,
                0,
                0,
                0,
                0,
                (far + near) / (near - far),
                -1,
                0,
                0,
                (2 * far * near) / (near - far),
                0,
            ])
        }

        const createModelViewMatrix = (rotX: number, rotY: number) => {
            const cosX = Math.cos(rotX)
            const sinX = Math.sin(rotX)
            const cosY = Math.cos(rotY)
            const sinY = Math.sin(rotY)

            return new Float32Array([
                cosY,
                sinX * sinY,
                -cosX * sinY,
                0,
                0,
                cosX,
                sinX,
                0,
                sinY,
                -sinX * cosY,
                cosX * cosY,
                0,
                0,
                0,
                -3,
                1,
            ])
        }

        // Animation loop
        const render = () => {
            if (!isDraggingRef.current) {
                rotationRef.current.y += autoRotateSpeed * 0.01
            }

            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.enable(gl.DEPTH_TEST)

            const aspect = canvas.width / canvas.height
            const projectionMatrix = createProjectionMatrix(
                Math.PI / 4,
                aspect,
                0.1,
                100
            )
            const modelViewMatrix = createModelViewMatrix(
                rotationRef.current.x,
                rotationRef.current.y
            )

            gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix)
            gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix)

            // Bind texture
            if (textureLoadedRef.current && textureRef.current) {
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, textureRef.current)
                gl.uniform1i(uTexture, 0)
                gl.uniform1i(uTextureLoaded, 1)
            } else {
                gl.uniform1i(uTextureLoaded, 0)
            }

            gl.drawElements(
                gl.TRIANGLES,
                sphereData.indices.length,
                gl.UNSIGNED_SHORT,
                0
            )

            animationFrameRef.current = requestAnimationFrame(render)
        }

        render()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [
        sphereData,
        autoRotateSpeed,
        globeColor,
        atmosphereColor,
        atmosphereIntensity,
    ])

    // Mouse interaction
    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (isDraggingRef.current) {
                const deltaX = e.clientX - lastMouseRef.current.x
                const deltaY = e.clientY - lastMouseRef.current.y

                rotationRef.current.y += deltaX * 0.005
                rotationRef.current.x += deltaY * 0.005

                lastMouseRef.current = { x: e.clientX, y: e.clientY }
            }
        },
        []
    )

    const handleMouseUp = () => {
        isDraggingRef.current = false
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: isDraggingRef.current ? "grabbing" : "grab",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    )
}

addPropertyControls(Globe3D, {
    mapTexture: {
        type: ControlType.String,
        title: "Map Texture URL",
        defaultValue:
            "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg",
    },
    globeColor: {
        type: ControlType.Color,
        title: "Globe Color",
        defaultValue: "#1a1a2e",
    },
    atmosphereColor: {
        type: ControlType.Color,
        title: "Atmosphere",
        defaultValue: "#4da6ff",
    },
    atmosphereIntensity: {
        type: ControlType.Number,
        title: "Atmosphere Intensity",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
    },
    bumpScale: {
        type: ControlType.Number,
        title: "Bump Scale",
        defaultValue: 5,
        min: 0,
        max: 10,
        step: 0.1,
    },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.1,
    },
})
