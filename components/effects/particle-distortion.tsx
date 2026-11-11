import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// User request: restore original particle interaction feel/physics as closely as possible and only optimize Safari via implementation efficiency (no behavior-shaping changes).

type ResponsiveImage = {
    src?: string
    alt?: string
}

interface MyComponentProps {
    uploadTransparentPNGSVG?: ResponsiveImage
    radius?: number
    force?: number
    maxMove?: number
    return?: number
    quality?: "low" | "medium" | "high"

    // Legacy aliases (kept for backwards compatibility)
    logo?: ResponsiveImage
    logoSize: number
    pointSize: number
    distortionRadius: number
    forceStrength: number
    maxDisplacement: number
    returnForce: number
}

const vertexShader = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_pointSize;
attribute vec2 a_position;
attribute vec4 a_color;
varying vec4 v_color;

void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 clipSpace = zeroToOne * 2.0 - 1.0;

    v_color = a_color;
    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
    gl_PointSize = u_pointSize;
}
`

const fragmentShader = `
precision highp float;

varying vec4 v_color;

void main() {
    if (v_color.a < 0.01) discard;

    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

    gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
}
`
/**


 * @framerSupportedLayoutWidth any

 * @framerSupportedLayoutHeight fixed

 * @framerIntrinsicWidth 1200

 * @framerIntrinsicHeight 600

 */

export default function LogoParticleDistortion(props: MyComponentProps) {
    const {
        uploadTransparentPNGSVG,
        logo,
        logoSize = 800,
        pointSize = 4,
        radius,
        force,
        maxMove,
        return: returnAlias,
        quality = "medium",
        distortionRadius,
        forceStrength,
        maxDisplacement,
        returnForce,
    } = props

    const resolvedLogo = uploadTransparentPNGSVG ?? logo
    const resolvedRadius = radius ?? distortionRadius ?? 350
    const resolvedForce = force ?? forceStrength ?? 0.0027
    const resolvedMaxDisplacement = maxMove ?? maxDisplacement ?? 100
    const resolvedReturnForce = returnAlias ?? returnForce ?? 0.01
    const isStatic = useIsStaticRenderer()

    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return
        }
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        let gl: WebGLRenderingContext | null = null
        let program: WebGLProgram | null = null
        let particleCount = 0

        let positionArray: Float32Array | null = null
        let originArray: Float32Array | null = null
        let velocityArray: Float32Array | null = null
        let colorArray: Float32Array | null = null
        let positionBuffer: WebGLBuffer | null = null
        let colorBuffer: WebGLBuffer | null = null
        let resolutionLoc: WebGLUniformLocation | null = null
        let pointSizeLoc: WebGLUniformLocation | null = null
        let positionLoc = -1
        let colorLoc = -1

        let mouse = { x: 0, y: 0 }
        let animationCount = 0
        let raf = 0
        let isVisible = true
        let loadedPixels: Uint8ClampedArray | null = null

        const logoPath = resolvedLogo?.src || ""
        const isSafari = /^((?!chrome|android).)*safari/i.test(
            window.navigator.userAgent
        )
        const effectiveReturnForce = isSafari
            ? Math.min(resolvedReturnForce * 4.0, 0.12)
            : resolvedReturnForce
        const maxParticleBudget =
            quality === "low" ? 12000 : quality === "high" ? 40000 : 24000

        function setupCanvas() {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()

            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))
        }

        function setupWebGL() {
            gl = canvas.getContext("webgl", {
                alpha: true,
                depth: false,
                stencil: false,
                antialias: false,
                powerPreference: "high-performance",
                premultipliedAlpha: false,
            })

            if (!gl) return

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            gl.clearColor(0, 0, 0, 0)
        }

        function compileShader(type: number, source: string) {
            if (!gl) return null

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

        function setupShaders() {
            if (!gl) return

            const vs = compileShader(gl.VERTEX_SHADER, vertexShader)
            const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShader)
            if (!vs || !fs) return

            program = gl.createProgram()
            if (!program) return

            gl.attachShader(program, vs)
            gl.attachShader(program, fs)
            gl.linkProgram(program)

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(program))
                return
            }

            resolutionLoc = gl.getUniformLocation(program, "u_resolution")
            pointSizeLoc = gl.getUniformLocation(program, "u_pointSize")
            positionLoc = gl.getAttribLocation(program, "a_position")
            colorLoc = gl.getAttribLocation(program, "a_color")
        }

        function loadLogo() {
            if (!logoPath) return

            const image = new Image()
            image.crossOrigin = "anonymous"

            image.onload = () => {
                const tempCanvas = document.createElement("canvas")
                const ctx = tempCanvas.getContext("2d")
                if (!ctx) return

                tempCanvas.width = logoSize
                tempCanvas.height = logoSize

                ctx.clearRect(0, 0, logoSize, logoSize)

                const scale = 0.9
                const size = logoSize * scale
                const offset = (logoSize - size) / 2

                ctx.drawImage(image, offset, offset, size, size)

                loadedPixels = ctx.getImageData(0, 0, logoSize, logoSize).data

                createParticles()
            }

            image.src = logoPath
        }

        function createParticles() {
            if (!gl || !loadedPixels) return

            const centerX = canvas.width / 2
            const centerY = canvas.height / 2
            const sampleStep = Math.max(
                1,
                Math.ceil(Math.sqrt((logoSize * logoSize) / maxParticleBudget))
            )
            let count = 0

            for (let i = 0; i < logoSize; i += sampleStep) {
                for (let j = 0; j < logoSize; j += sampleStep) {
                    const pixelIndex = (i * logoSize + j) * 4
                    const alpha = loadedPixels[pixelIndex + 3]
                    if (alpha > 10) count++
                }
            }

            particleCount = count
            positionArray = new Float32Array(count * 2)
            originArray = new Float32Array(count * 2)
            velocityArray = new Float32Array(count * 2)
            colorArray = new Float32Array(count * 4)

            let p = 0
            let c = 0
            for (let i = 0; i < logoSize; i += sampleStep) {
                for (let j = 0; j < logoSize; j += sampleStep) {
                    const pixelIndex = (i * logoSize + j) * 4
                    const alpha = loadedPixels[pixelIndex + 3]
                    if (alpha > 10) {
                        const particleX = centerX + (j - logoSize / 2)
                        const particleY = centerY + (i - logoSize / 2)

                        positionArray[p] = particleX
                        positionArray[p + 1] = particleY
                        originArray[p] = particleX
                        originArray[p + 1] = particleY
                        velocityArray[p] = 0
                        velocityArray[p + 1] = 0
                        p += 2

                        const originalA = loadedPixels[pixelIndex + 3] / 255

                        colorArray[c] = 1
                        colorArray[c + 1] = 1
                        colorArray[c + 2] = 1
                        colorArray[c + 3] = originalA
                        c += 4
                    }
                }
            }

            positionBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.DYNAMIC_DRAW)

            colorBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW)
        }

        function updatePhysics() {
            if (
                !gl ||
                !positionBuffer ||
                !positionArray ||
                !originArray ||
                !velocityArray
            )
                return

            if (animationCount > 0) animationCount--

            const radiusSquared = resolvedRadius * resolvedRadius

            for (let i = 0; i < particleCount; i++) {
                const idx = i * 2
                const currentX = positionArray[idx]
                const currentY = positionArray[idx + 1]
                const originalX = originArray[idx]
                const originalY = originArray[idx + 1]
                let velocityX = velocityArray[idx]
                let velocityY = velocityArray[idx + 1]

                if (animationCount > 0) {
                    const deltaX = mouse.x - currentX
                    const deltaY = mouse.y - currentY
                    const distanceSquared = deltaX * deltaX + deltaY * deltaY

                    if (
                        distanceSquared < radiusSquared &&
                        distanceSquared > 0
                    ) {
                        const force = -radiusSquared / distanceSquared
                        const angle = Math.atan2(deltaY, deltaX)

                        velocityX += force * Math.cos(angle) * resolvedForce
                        velocityY += force * Math.sin(angle) * resolvedForce
                    }
                }

                velocityX *= 0.82
                velocityY *= 0.82

                const targetX =
                    currentX +
                    velocityX +
                    (originalX - currentX) * effectiveReturnForce

                const targetY =
                    currentY +
                    velocityY +
                    (originalY - currentY) * effectiveReturnForce

                const offsetX = targetX - originalX
                const offsetY = targetY - originalY
                const distFromOrigin = Math.sqrt(
                    offsetX * offsetX + offsetY * offsetY
                )

                if (distFromOrigin > resolvedMaxDisplacement) {
                    const scale = resolvedMaxDisplacement / distFromOrigin

                    positionArray[idx] = originalX + offsetX * scale
                    positionArray[idx + 1] = originalY + offsetY * scale

                    velocityX *= 0.7
                    velocityY *= 0.7
                } else {
                    positionArray[idx] = targetX
                    positionArray[idx + 1] = targetY
                }

                velocityArray[idx] = velocityX
                velocityArray[idx + 1] = velocityY
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, positionArray)
        }

        function render() {
            if (!gl || !program || !positionBuffer || !colorBuffer) return

            gl.viewport(0, 0, canvas.width, canvas.height)

            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            if (particleCount === 0) return

            gl.useProgram(program)

            if (resolutionLoc)
                gl.uniform2f(resolutionLoc, canvas.width, canvas.height)
            if (pointSizeLoc) gl.uniform1f(pointSizeLoc, pointSize)

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            if (positionLoc >= 0) {
                gl.enableVertexAttribArray(positionLoc)
                gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
            if (colorLoc >= 0) {
                gl.enableVertexAttribArray(colorLoc)
                gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
            }

            gl.drawArrays(gl.POINTS, 0, particleCount)
        }

        function animate() {
            if (!isVisible) {
                raf = 0
                return
            }
            updatePhysics()
            render()
            raf = requestAnimationFrame(animate)
        }

        function startAnimation() {
            if (raf === 0 && isVisible) {
                raf = requestAnimationFrame(animate)
            }
        }

        function stopAnimation() {
            if (raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }

        function onMouseMove(event: MouseEvent) {
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            mouse.x = (event.clientX - rect.left) * dpr
            mouse.y = (event.clientY - rect.top) * dpr

            animationCount = 300
        }

        const resizeObserver = new ResizeObserver(() => {
            setupCanvas()
            createParticles()
        })
        const visibilityObserver =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      (entries) => {
                          const entry = entries[0]
                          isVisible = Boolean(entry?.isIntersecting)
                          if (isVisible) {
                              startAnimation()
                          } else {
                              stopAnimation()
                          }
                      },
                      { threshold: 0.01 }
                  )
                : null

        setupCanvas()
        setupWebGL()
        setupShaders()
        loadLogo()
        startAnimation()

        resizeObserver.observe(canvas)
        visibilityObserver?.observe(canvas)
        window.addEventListener("mousemove", onMouseMove, { passive: true })

        return () => {
            stopAnimation()
            resizeObserver.disconnect()
            visibilityObserver?.disconnect()
            window.removeEventListener("mousemove", onMouseMove)
            if (gl) {
                if (positionBuffer) gl.deleteBuffer(positionBuffer)
                if (colorBuffer) gl.deleteBuffer(colorBuffer)
                if (program) gl.deleteProgram(program)
            }
        }
    }, [
        isStatic,
        resolvedLogo,
        logoSize,
        quality,
        pointSize,
        resolvedRadius,
        resolvedForce,
        resolvedMaxDisplacement,
        resolvedReturnForce,
    ])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: "transparent",
            }}
        >
            {isStatic ? (
                <img
                    src={resolvedLogo?.src}
                    alt={resolvedLogo?.alt || ""}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "contain",
                        filter: "brightness(0) invert(1)",
                    }}
                />
            ) : (
                <canvas
                    ref={canvasRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        background: "transparent",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(LogoParticleDistortion, {
    uploadTransparentPNGSVG: {
        type: ControlType.ResponsiveImage,
        title: "Upload Transparent PNG/ SVG",
        description: "Use a transparent PNG/ SVG logo",
    },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Upload Transparent PNG/ SVG (Legacy)",
        description: "Legacy alias for compatibility",
        hidden: () => true,
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        description: "Rendered logo scale",
        defaultValue: 800,
        min: 100,
        max: 800,
        step: 50,
    },
    pointSize: {
        type: ControlType.Number,
        title: "Point Size",
        description: "Particle dot size",
        defaultValue: 8,
        min: 1,
        max: 10,
        step: 0.5,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        description: "Mouse influence radius",
        defaultValue: 350,
        min: 100,
        max: 5000,
        step: 50,
    },
    distortionRadius: {
        type: ControlType.Number,
        title: "Radius (Legacy)",
        description: "Legacy alias for compatibility",
        defaultValue: 350,
        min: 100,
        max: 5000,
        step: 50,
        hidden: () => true,
    },
    force: {
        type: ControlType.Number,
        title: "Force",
        description: "Push strength",
        defaultValue: 0.0027,
        min: 0.0001,
        max: 0.02,
        step: 0.0001,
    },
    forceStrength: {
        type: ControlType.Number,
        title: "Force (Legacy)",
        description: "Legacy alias for compatibility",
        defaultValue: 0.0027,
        min: 0.0001,
        max: 0.02,
        step: 0.0001,
        hidden: () => true,
    },
    maxMove: {
        type: ControlType.Number,
        title: "Max Move",
        description: "Maximum displacement",
        defaultValue: 100,
        min: 10,
        max: 500,
        step: 5,
    },
    maxDisplacement: {
        type: ControlType.Number,
        title: "Max Move (Legacy)",
        description: "Legacy alias for compatibility",
        defaultValue: 100,
        min: 10,
        max: 500,
        step: 5,
        hidden: () => true,
    },
    return: {
        type: ControlType.Number,
        title: "Return",
        description: "Return speed",
        defaultValue: 0.01,
        min: 0.001,
        max: 0.1,
        step: 0.001,
    },
    returnForce: {
        type: ControlType.Number,
        title: "Return (Legacy)",
        description: "Legacy alias for compatibility",
        defaultValue: 0.01,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        hidden: () => true,
    },
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        options: ["low", "medium", "high"],
        optionTitles: ["Low", "Medium", "High"],
        defaultValue: "medium",
    },
})
