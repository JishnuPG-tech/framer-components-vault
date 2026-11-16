import React, { useState, useEffect, useRef, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import WebGL2Renderer from "./WebGL2Renderer.tsx"
import BackgroundCover from "./BackgroundCover.tsx"

/**
 * InteractiveDistortion - WebGL Interactive Distortion Effect with Video Support
 *
 * Based on original work by Yuriy Artyukh (Akella)
 * https://github.com/akella/DistortedPixels (MIT License)
 * Adapted for Framer by Fugu 4D
 *
 * © 2025 Fugu 4D Agency. All rights reserved.
 *
 * This component is provided for free use in Framer projects.
 * Please do not reuse, redistribute, or repurpose the source code
 * to create derivative components or for commercial use without permission.
 *
 * If you’re interested in licensing or collaboration, feel free to reach out.
 *
 * Have fun and build cool stuff.
 */

// Presets originales para imágenes
const IMAGE_PRESETS = {
    smoothDistortion: {
        grid: 50,
        mouseInfluence: 0.25,
        strength: 0.11,
        relaxation: 0.9,
        distortionStrength: 1.0,
    },
    highDetail: {
        grid: 607,
        mouseInfluence: 0.11,
        strength: 0.36,
        relaxation: 0.96,
        distortionStrength: 1.0,
    },
    pixelated: {
        grid: 15,
        mouseInfluence: 0.13,
        strength: 0.15,
        relaxation: 0.9,
        distortionStrength: 1.0,
    },
}

// Presets optimizados para video (menor resolución de grid)
const VIDEO_PRESETS = {
    smoothDistortion: {
        grid: 30, // Reducido desde 50
        mouseInfluence: 0.25,
        strength: 0.11,
        relaxation: 0.9,
        distortionStrength: 1.0,
    },
    highDetail: {
        grid: 80, // Reducido drásticamente desde 607
        mouseInfluence: 0.11,
        strength: 0.36,
        relaxation: 0.96,
        distortionStrength: 1.0,
    },
    pixelated: {
        grid: 12, // Ligeramente reducido desde 15
        mouseInfluence: 0.13,
        strength: 0.15,
        relaxation: 0.9,
        distortionStrength: 1.0,
    },
}

// Títulos para los presets en la UI
const PRESET_TITLES = {
    smoothDistortion: "Smooth Distortion",
    highDetail: "High Detail",
    pixelated: "Pixelated",
    custom: "Custom",
}

// Vertex shader básico para WebGL2
const vertexShaderSource = `#version 300 es
  in vec2 aPosition;
  out vec2 vUv;
  
  void main() {
    vUv = vec2((aPosition.x + 1.0) / 2.0, 1.0 - (aPosition.y + 1.0) / 2.0);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

// Fragment shader adaptado de Three.js para WebGL2
const fragmentShaderSource = `#version 300 es
  precision highp float;
  
  in vec2 vUv;
  out vec4 fragColor;
  
  uniform float uTime;
  uniform sampler2D uTexture;
  uniform sampler2D uDataTexture;
  uniform vec4 uResolution; // width, height, imageAspectX, imageAspectY
  uniform float uDistortionStrength;
  
  void main() {
    // Ajustar UV para object-fit cover/contain (similar a Three.js resolution.zw)
    vec2 newUV = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
    
    // Obtener el offset de distorsión de la data texture
    vec4 offset = texture(uDataTexture, vUv);
    
    // Aplicar la distorsión desplazando las coordenadas UV
    vec2 distortedUV = newUV - (uDistortionStrength * 0.02) * offset.rg;
    
    // Verificar límites para evitar artefactos
    if (distortedUV.x < 0.0 || distortedUV.x > 1.0 || distortedUV.y < 0.0 || distortedUV.y > 1.0) {
      fragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      fragColor = texture(uTexture, distortedUV);
    }
  }
`

// Función clamp helper
function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max))
}

// Monitor de rendimiento para ajuste automático
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0
        this.lastTime = performance.now()
        this.avgFPS = 60
        this.samples = []
        this.maxSamples = 30
    }

    update() {
        this.frameCount++
        const now = performance.now()

        if (now - this.lastTime >= 1000) {
            const currentFPS = this.frameCount
            this.samples.push(currentFPS)

            if (this.samples.length > this.maxSamples) {
                this.samples.shift()
            }

            // Calcular promedio de FPS
            this.avgFPS =
                this.samples.reduce((a, b) => a + b, 0) / this.samples.length

            this.frameCount = 0
            this.lastTime = now
        }
    }

    shouldReduceQuality() {
        return this.avgFPS < 25 && this.samples.length >= 10
    }

    shouldIncreaseQuality() {
        return this.avgFPS > 50 && this.samples.length >= 10
    }
}

// Loading Spinner Component
const LoadingSpinner = ({ color = "#ffffff" }) => {
    return (
        <div
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 20,
            }}
        >
            <div
                style={{
                    width: "40px",
                    height: "40px",
                    border: `3px solid rgba(255, 255, 255, 0.2)`,
                    borderTop: `3px solid ${color}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                }}
            />
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    )
}

// Preset Inspector Component
const PresetInspector = ({ presetName, presetValues, mediaType }) => {
    if (!presetValues) return null

    return (
        <div
            style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                padding: "10px",
                borderRadius: "6px",
                color: "white",
                fontSize: "12px",
                maxWidth: "280px",
                zIndex: 10,
                fontFamily: "Arial, sans-serif",
            }}
        >
            <div
                style={{
                    marginBottom: "8px",
                    borderBottom: "1px solid rgba(255,255,255,0.3)",
                    paddingBottom: "5px",
                }}
            >
                <strong style={{ color: "#fff" }}>
                    Preset values: {presetName} ({mediaType})
                </strong>
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px",
                    fontSize: "11px",
                }}
            >
                <div>Grid:</div>
                <div>{presetValues.grid}</div>

                <div>Mouse Influence:</div>
                <div>{presetValues.mouseInfluence}</div>

                <div>Strength:</div>
                <div>{presetValues.strength}</div>

                <div>Relaxation:</div>
                <div>{presetValues.relaxation}</div>

                <div>Distortion Strength:</div>
                <div>{presetValues.distortionStrength}</div>
            </div>
        </div>
    )
}

/**
 * @framerDisableUnlink
 */
export default function InteractiveDistortion(props) {
    const isStaticRenderer = useIsStaticRenderer()
    const {
        preset = "pixelated",
        mediaType = "video",
        imageUrl,
        videoUrl,
        backgroundColor,
        objectFit = "cover",
        spinnerColor = "#ffffff",
        autoPlay = true,
        autoLoop = true,
        videoPerformanceMode = true,
        adaptiveQuality = true,
        grid = 15,
        mouseInfluence = 0.12,
        strength = 0.15,
        relaxation = 0.9,
        distortionStrength = 1.0,
        showPresetInfo = false,
        inspectPreset = "pixelated",
    } = props

    // Estados para media
    const [image, setImage] = useState(null)
    const [video, setVideo] = useState(null)
    const [isVideoPlaying, setIsVideoPlaying] = useState(false)
    const [imageDimensions, setImageDimensions] = useState({
        width: 1,
        height: 1,
    })

    // Estados para loading
    const [isLoading, setIsLoading] = useState(true)
    const [loadingError, setLoadingError] = useState(null)
    const [isWebGLReady, setIsWebGLReady] = useState(false)

    // Estados para contenedor
    const containerRef = useRef(null)
    const [containerSize, setContainerSize] = useState({ width: 1, height: 1 })

    // Referencias para optimización
    const videoRef = useRef(null)
    const performanceMonitorRef = useRef(new PerformanceMonitor())
    const videoUpdateCounterRef = useRef(0)
    const lastQualityAdjustmentRef = useRef(0)

    // Estado para la configuración efectiva basada en preset
    const [effectiveConfig, setEffectiveConfig] = useState(() => {
        if (preset !== "custom") {
            const presets =
                mediaType === "video" && videoPerformanceMode
                    ? VIDEO_PRESETS
                    : IMAGE_PRESETS
            return presets[preset] || presets.pixelated
        }

        return {
            grid,
            mouseInfluence,
            strength,
            relaxation,
            distortionStrength,
        }
    })

    // Referencias para el mouse tracking
    const mouseRef = useRef({
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vX: 0,
        vY: 0,
    })

    // Actualizar configuración efectiva cuando cambian los props
    useEffect(() => {
        setIsWebGLReady(false) // Reset WebGL ready state when config changes

        if (preset !== "custom") {
            const presets =
                mediaType === "video" && videoPerformanceMode
                    ? VIDEO_PRESETS
                    : IMAGE_PRESETS
            setEffectiveConfig(presets[preset] || presets.pixelated)
        } else {
            // En modo custom usamos los valores de las props
            setEffectiveConfig({
                grid,
                mouseInfluence,
                strength,
                relaxation,
                distortionStrength,
            })
        }
    }, [
        preset,
        mediaType,
        videoPerformanceMode,
        grid,
        mouseInfluence,
        strength,
        relaxation,
        distortionStrength,
    ])

    // Observar el tamaño del contenedor
    useEffect(() => {
        if (!containerRef.current) return

        const updateSize = () => {
            const rect = containerRef.current.getBoundingClientRect()
            setContainerSize({ width: rect.width, height: rect.height })
        }

        updateSize()

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries.length > 0) {
                updateSize()
            }
        })

        resizeObserver.observe(containerRef.current)

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    // Cargar imagen
    useEffect(() => {
        if (mediaType === "image" && imageUrl) {
            setIsLoading(true)
            setLoadingError(null)
            setIsWebGLReady(false)

            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                setImage(img)
                setImageDimensions({ width: img.width, height: img.height })
                setVideo(null) // Limpiar video anterior
                // No establecer isLoading=false aquí, esperar a WebGL
            }
            img.onerror = (err) => {
                console.error("Error cargando la imagen:", err)
                setLoadingError("Failed to load image")
                setIsLoading(false)
                setIsWebGLReady(false)
            }
            img.src = imageUrl
        } else if (mediaType === "image") {
            setImage(null)
            setIsLoading(false)
            setIsWebGLReady(false)
        }
    }, [imageUrl, mediaType])

    // Cargar video
    useEffect(() => {
        if (mediaType === "video" && videoUrl) {
            setIsLoading(true)
            setLoadingError(null)
            setIsWebGLReady(false)

            const videoElement = document.createElement("video")
            videoElement.crossOrigin = "anonymous"
            videoElement.muted = true
            videoElement.loop = autoLoop
            videoElement.playsInline = true
            videoElement.preload = "metadata"

            videoElement.onloadedmetadata = () => {
                setVideo(videoElement)
                setImageDimensions({
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight,
                })
                setImage(null) // Limpiar imagen anterior
                // No establecer isLoading=false aquí, esperar a WebGL

                if (autoPlay) {
                    videoElement
                        .play()
                        .then(() => {
                            setIsVideoPlaying(true)
                        })
                        .catch((err) => {
                            console.warn("Auto-play bloqueado:", err)
                            setIsVideoPlaying(false)
                        })
                }
            }

            videoElement.onplay = () => setIsVideoPlaying(true)
            videoElement.onpause = () => setIsVideoPlaying(false)
            videoElement.onended = () => {
                if (!autoLoop) {
                    setIsVideoPlaying(false)
                }
            }

            videoElement.onerror = (err) => {
                console.error("Error cargando el video:", err)
                setLoadingError("Failed to load video")
                setIsLoading(false)
                setIsWebGLReady(false)
            }

            videoRef.current = videoElement
            videoElement.src = videoUrl
        } else if (mediaType === "video") {
            if (videoRef.current) {
                videoRef.current.pause()
                videoRef.current = null
            }
            setVideo(null)
            setIsVideoPlaying(false)
            setIsLoading(false)
            setIsWebGLReady(false)
        }

        // Cleanup
        return () => {
            if (videoRef.current) {
                videoRef.current.pause()
                videoRef.current = null
            }
        }
    }, [videoUrl, mediaType, autoPlay, autoLoop])

    // Controlar loading: ocultar solo cuando tanto media como WebGL estén listos
    useEffect(() => {
        if (
            isWebGLReady &&
            ((mediaType === "image" && image) ||
                (mediaType === "video" && video) ||
                (!imageUrl && !videoUrl))
        ) {
            setIsLoading(false)
        }
    }, [isWebGLReady, image, video, mediaType, imageUrl, videoUrl])

    // Control de reproducción manual del video
    const toggleVideoPlayback = () => {
        if (video) {
            if (isVideoPlaying) {
                video.pause()
            } else {
                video.play().catch(console.error)
            }
        }
    }

    // Calcular aspect ratio para object-fit cover/contain
    const imageAspectValues = useMemo(() => {
        if (!image && !video) return { a1: 1, a2: 1 }

        const imageAspect = imageDimensions.width / imageDimensions.height
        const containerAspect = containerSize.width / containerSize.height

        let a1, a2

        if (objectFit === "contain") {
            // Para contain: la imagen debe caber completamente dentro del contenedor
            if (containerAspect > imageAspect) {
                a1 = containerAspect / imageAspect
                a2 = 1
            } else {
                a1 = 1
                a2 = imageAspect / containerAspect
            }
        } else {
            // Para cover: la imagen debe cubrir completamente el contenedor
            if (containerAspect > imageAspect) {
                a1 = 1
                a2 = imageAspect / containerAspect
            } else {
                a1 = containerAspect / imageAspect
                a2 = 1
            }
        }

        return { a1, a2 }
    }, [image, video, imageDimensions, containerSize, objectFit])

    // Generar data texture
    const generateDataTexture = (gl, size) => {
        const width = size
        const height = size
        const totalSize = width * height
        const data = new Float32Array(3 * totalSize)

        // Llenar con valores aleatorios iniciales
        for (let i = 0; i < totalSize; i++) {
            const r = Math.random() * 255 - 125
            const r1 = Math.random() * 255 - 125
            const stride = i * 3

            data[stride] = r
            data[stride + 1] = r1
            data[stride + 2] = r
        }

        // Crear textura
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB32F,
            width,
            height,
            0,
            gl.RGB,
            gl.FLOAT,
            data
        )

        gl.bindTexture(gl.TEXTURE_2D, null)

        return { texture, data, width, height }
    }

    // Actualizar data texture
    const updateDataTexture = (
        gl,
        dataTexture,
        mouseData,
        settings,
        containerSize
    ) => {
        const { data, width, height } = dataTexture
        const { x, y, vX, vY } = mouseData

        // Aplicar relajación
        for (let i = 0; i < data.length; i += 3) {
            data[i] *= settings.relaxation
            data[i + 1] *= settings.relaxation
        }

        // Calcular posición del mouse en la grilla
        const gridMouseX = width * x
        const gridMouseY = width * y
        const maxDist = width * settings.mouseInfluence
        const aspect = containerSize.height / containerSize.width

        // Aplicar efecto del mouse
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const distance =
                    (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2
                const maxDistSq = maxDist ** 2

                if (distance < maxDistSq) {
                    const index = 3 * (i + width * j)
                    let power = maxDist / Math.sqrt(distance)
                    power = clamp(power, 0, 10)

                    data[index] += settings.strength * 100 * vX * power
                    data[index + 1] -= settings.strength * 100 * vY * power
                }
            }
        }

        // Actualizar textura
        gl.bindTexture(gl.TEXTURE_2D, dataTexture.texture)
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0,
            0,
            width,
            height,
            gl.RGB,
            gl.FLOAT,
            data
        )
        gl.bindTexture(gl.TEXTURE_2D, null)
    }

    // Convertir color hex a RGB
    const hexToRgb = (hex) => {
        if (!hex || hex === "transparent" || hex === "none") {
            return [0, 0, 0, 0]
        }

        let formattedHex = hex.trim()
        if (formattedHex.startsWith("rgba") || formattedHex.startsWith("rgb")) {
            const parts = formattedHex.replace(/rgba?\(|\)/g, "").split(",")
            if (parts.length >= 3) {
                return [
                    parseInt(parts[0], 10) / 255,
                    parseInt(parts[1], 10) / 255,
                    parseInt(parts[2], 10) / 255,
                    parts.length === 4 ? parseFloat(parts[3]) : 1.0,
                ]
            }
            return [1, 1, 1, 1]
        }

        if (!formattedHex.startsWith("#")) {
            formattedHex = "#" + formattedHex
        }

        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
        formattedHex = formattedHex.replace(
            shorthandRegex,
            (m, r, g, b) => r + r + g + g + b + b
        )

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
            formattedHex
        )

        return result
            ? [
                  parseInt(result[1], 16) / 255,
                  parseInt(result[2], 16) / 255,
                  parseInt(result[3], 16) / 255,
                  1.0,
              ]
            : [1, 1, 1, 0]
    }

    // Setup mouse events
    useEffect(() => {
        if (!containerRef.current) return

        const container = containerRef.current

        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height

            const mouse = mouseRef.current
            mouse.vX = x - mouse.prevX
            mouse.vY = y - mouse.prevY

            mouse.x = x
            mouse.y = y
            mouse.prevX = x
            mouse.prevY = y
        }

        // Touch events para móviles
        const handleTouchMove = (e) => {
            e.preventDefault()
            const rect = container.getBoundingClientRect()
            const touch = e.touches[0]
            const x = (touch.clientX - rect.left) / rect.width
            const y = (touch.clientY - rect.top) / rect.height

            const mouse = mouseRef.current
            mouse.vX = x - mouse.prevX
            mouse.vY = y - mouse.prevY

            mouse.x = x
            mouse.y = y
            mouse.prevX = x
            mouse.prevY = y
        }

        container.addEventListener("mousemove", handleMouseMove)
        container.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        })

        return () => {
            container.removeEventListener("mousemove", handleMouseMove)
            container.removeEventListener("touchmove", handleTouchMove)
        }
    }, [])

    // Inicializar recursos WebGL
    const handleInit = (gl, width, height, { resources, programs }) => {
        // Crear textura principal
        const mainTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, mainTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        if (video && mediaType === "video") {
            // Para video: crear textura vacía que se actualizará en render
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                1,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 0, 255])
            )
            resources.isVideo = true
            resources.hasValidMedia = true
        } else if (image && mediaType === "image") {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            )
            resources.isVideo = false
            resources.hasValidMedia = true
        } else {
            // Crear textura de color sólido como fallback
            const size = 256
            const data = new Uint8Array(size * size * 4)
            const [r, g, b, a] = hexToRgb(backgroundColor)

            for (let i = 0; i < size * size; i++) {
                const idx = i * 4
                data[idx] = Math.floor(r * 255)
                data[idx + 1] = Math.floor(g * 255)
                data[idx + 2] = Math.floor(b * 255)
                data[idx + 3] = Math.floor(a * 255)
            }

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                size,
                size,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                data
            )
            resources.isVideo = false
            resources.hasValidMedia = false
        }

        gl.bindTexture(gl.TEXTURE_2D, null)
        resources.mainTexture = mainTexture

        // Generar data texture con la configuración efectiva
        const config = effectiveConfig
        resources.dataTexture = generateDataTexture(gl, config.grid)
        resources.originalGrid = config.grid

        // Configurar uniforms
        const program = programs.distortion
        gl.useProgram(program)

        resources.uniforms = {
            time: gl.getUniformLocation(program, "uTime"),
            texture: gl.getUniformLocation(program, "uTexture"),
            dataTexture: gl.getUniformLocation(program, "uDataTexture"),
            resolution: gl.getUniformLocation(program, "uResolution"),
            distortionStrength: gl.getUniformLocation(
                program,
                "uDistortionStrength"
            ),
        }

        // Configurar settings
        resources.settings = { ...config }
        resources.performanceMonitor = performanceMonitorRef.current

        // Marcar WebGL como listo
        setIsWebGLReady(true)
    }

    // Manejar renderizado
    const handleRender = (
        gl,
        { programs, resources, vao, frame, width, height }
    ) => {
        if (!programs.distortion || !resources.dataTexture) return

        const program = programs.distortion
        gl.useProgram(program)

        // Actualizar monitor de rendimiento
        if (adaptiveQuality && resources.performanceMonitor) {
            resources.performanceMonitor.update()
        }

        // Actualizar textura de video si es necesario
        if (
            resources.isVideo &&
            video &&
            isVideoPlaying &&
            !video.paused &&
            !video.ended
        ) {
            // Actualizar cada frame para video fluido, pero podemos optimizar si es necesario
            const VIDEO_UPDATE_INTERVAL =
                resources.performanceMonitor?.avgFPS < 30 ? 2 : 1
            videoUpdateCounterRef.current++

            if (videoUpdateCounterRef.current >= VIDEO_UPDATE_INTERVAL) {
                gl.bindTexture(gl.TEXTURE_2D, resources.mainTexture)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    video
                )
                gl.bindTexture(gl.TEXTURE_2D, null)
                videoUpdateCounterRef.current = 0
            }
        }

        // Ajuste adaptativo de calidad (solo cada 2 segundos)
        if (
            adaptiveQuality &&
            resources.performanceMonitor &&
            frame - lastQualityAdjustmentRef.current > 120 && // 2 segundos a 60fps
            resources.isVideo
        ) {
            const monitor = resources.performanceMonitor
            let needsRegeneration = false

            if (monitor.shouldReduceQuality() && resources.settings.grid > 10) {
                resources.settings.grid = Math.max(
                    10,
                    Math.floor(resources.settings.grid * 0.8)
                )
                needsRegeneration = true
                console.log(
                    `Calidad reducida: grid=${resources.settings.grid}, FPS=${monitor.avgFPS.toFixed(1)}`
                )
            } else if (
                monitor.shouldIncreaseQuality() &&
                resources.settings.grid < resources.originalGrid
            ) {
                resources.settings.grid = Math.min(
                    resources.originalGrid,
                    Math.floor(resources.settings.grid * 1.2)
                )
                needsRegeneration = true
                console.log(
                    `Calidad aumentada: grid=${resources.settings.grid}, FPS=${monitor.avgFPS.toFixed(1)}`
                )
            }

            if (needsRegeneration) {
                // Regenerar data texture con nuevo grid
                gl.deleteTexture(resources.dataTexture.texture)
                resources.dataTexture = generateDataTexture(
                    gl,
                    resources.settings.grid
                )
                lastQualityAdjustmentRef.current = frame
            }
        }

        // Limpiar canvas
        const bgColor = hexToRgb(backgroundColor)
        gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3])
        gl.clear(gl.COLOR_BUFFER_BIT)

        // Habilitar transparencia
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        // Actualizar settings con la configuración efectiva (excepto si se ajustó adaptativamente)
        if (!adaptiveQuality || !resources.isVideo) {
            const config = effectiveConfig
            resources.settings = { ...config }
        }

        // Actualizar data texture
        const mouse = mouseRef.current
        updateDataTexture(
            gl,
            resources.dataTexture,
            mouse,
            resources.settings,
            { width, height }
        )

        // Aplicar decay a la velocidad del mouse
        mouse.vX *= 0.9
        mouse.vY *= 0.9

        // Configurar uniforms
        const { uniforms } = resources
        gl.uniform1f(uniforms.time, frame * 0.01)
        gl.uniform4f(
            uniforms.resolution,
            width,
            height,
            imageAspectValues.a1,
            imageAspectValues.a2
        )
        gl.uniform1f(
            uniforms.distortionStrength,
            resources.settings.distortionStrength
        )

        // Bind texturas
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, resources.mainTexture)
        gl.uniform1i(uniforms.texture, 0)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, resources.dataTexture.texture)
        gl.uniform1i(uniforms.dataTexture, 1)

        // Dibujar
        gl.bindVertexArray(vao)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.bindVertexArray(null)

        gl.disable(gl.BLEND)
    }

    // Manejar resize
    const handleResize = (gl, width, height, resources) => {
        const config = effectiveConfig

        // Regenerar data texture si cambió el grid y no estamos en modo adaptativo
        if (
            resources.dataTexture &&
            resources.settings.grid !== config.grid &&
            (!adaptiveQuality || !resources.isVideo)
        ) {
            gl.deleteTexture(resources.dataTexture.texture)
            resources.dataTexture = generateDataTexture(gl, config.grid)
        }

        // Actualizar textura principal si cambió la imagen
        if (image && resources.mainTexture && resources.lastImage !== image) {
            gl.bindTexture(gl.TEXTURE_2D, resources.mainTexture)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            )
            gl.bindTexture(gl.TEXTURE_2D, null)
            resources.lastImage = image
            resources.isVideo = false
            resources.hasValidMedia = true
        }

        // Actualizar para video si cambió
        if (video && resources.mainTexture && resources.lastVideo !== video) {
            resources.lastVideo = video
            resources.isVideo = true
            resources.hasValidMedia = true
        }
    }

    // Limpiar recursos
    const handleCleanup = (gl, resources) => {
        if (resources.mainTexture) {
            gl.deleteTexture(resources.mainTexture)
        }
        if (resources.dataTexture?.texture) {
            gl.deleteTexture(resources.dataTexture.texture)
        }
    }

    // Obtener preset values para el inspector
    const getInspectPresetValues = () => {
        if (inspectPreset === "custom") {
            return {
                grid,
                mouseInfluence,
                strength,
                relaxation,
                distortionStrength,
            }
        }

        const presets =
            mediaType === "video" && videoPerformanceMode
                ? VIDEO_PRESETS
                : IMAGE_PRESETS
        return presets[inspectPreset] || presets.pixelated
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: backgroundColor,
            }}
        >
            {!(isStaticRenderer && !props.renderInStaticMode) && (
                <WebGL2Renderer
                    fragmentShaders={[
                        { id: "distortion", source: fragmentShaderSource },
                    ]}
                    vertexShaderSource={vertexShaderSource}
                    onInit={handleInit}
                    onRender={handleRender}
                    onResize={handleResize}
                    onCleanup={handleCleanup}
                    bgColor={backgroundColor}
                />
            )}

            {isStaticRenderer && !props.renderInStaticMode && (
                <BackgroundCover />
            )}

            {/* Loading Spinner */}
            {isLoading && <LoadingSpinner color={spinnerColor} />}

            {/* Error Message */}
            {loadingError && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(255, 0, 0, 0.8)",
                        color: "white",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        zIndex: 20,
                    }}
                >
                    {loadingError}
                </div>
            )}

            {/* Control de video manual si autoPlay está desactivado */}
            {mediaType === "video" && video && !autoPlay && !isLoading && (
                <button
                    onClick={toggleVideoPlayback}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        border: "none",
                        borderRadius: "50%",
                        width: "60px",
                        height: "60px",
                        color: "white",
                        fontSize: "20px",
                        cursor: "pointer",
                        zIndex: 10,
                        display: isVideoPlaying ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    ▶️
                </button>
            )}

            {/* Preset Inspector Panel */}
            {preset === "custom" &&
                showPresetInfo &&
                !(isStaticRenderer && !props.renderInStaticMode) && (
                    <PresetInspector
                        presetName={
                            inspectPreset === "custom"
                                ? PRESET_TITLES.custom
                                : PRESET_TITLES[inspectPreset] || inspectPreset
                        }
                        presetValues={getInspectPresetValues()}
                        mediaType={mediaType}
                    />
                )}
        </div>
    )
}

// Propiedades por defecto
InteractiveDistortion.defaultProps = {
    preset: "pixelated",
    mediaType: "video",
    imageUrl:
        "https://framer-plugins-assets.world-d8f.workers.dev/PixelWarpImage.jpg",
    videoUrl:
        "https://framer-plugins-assets.world-d8f.workers.dev/PixelWarpVideo.mp4",
    backgroundColor: "transparent",
    objectFit: "cover",
    spinnerColor: "#ffffff",
    autoPlay: true,
    autoLoop: true,
    videoPerformanceMode: true,
    adaptiveQuality: true,
    grid: 50,
    mouseInfluence: 0.25,
    strength: 0.11,
    relaxation: 0.9,
    distortionStrength: 1.0,
    showPresetInfo: false,
    inspectPreset: "pixelated",
}

// Property controls para Framer
addPropertyControls(InteractiveDistortion, {
    renderInStaticMode: {
        type: ControlType.Boolean,
        title: "Render in Framer Static Mode",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "Enable rendering in Canvas/Export mode (may affect Framer performance)",
    },

    // ===== Sección: Media =====
    mediaType: {
        type: ControlType.Enum,
        title: "Media Type",
        defaultValue: "video",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        description: "Choose between image or video input",
        section: "Media",
    },

    imageUrl: {
        type: ControlType.Image,
        title: "Image",
        hidden: (props) => props.mediaType !== "image",
        description: "Source image to apply the interactive distortion effect",
        section: "Media",
    },

    videoUrl: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov", "avi"],
        title: "Video",
        hidden: (props) => props.mediaType !== "video",
        description: "Source video to apply the interactive distortion effect",
        section: "Media",
    },

    // ===== Sección: Video Settings =====
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        hidden: (props) => props.mediaType !== "video",
        description: "Automatically start playing the video",
        section: "Video Settings",
    },

    autoLoop: {
        type: ControlType.Boolean,
        title: "Loop Video",
        defaultValue: true,
        hidden: (props) => props.mediaType !== "video",
        description: "Loop the video when it reaches the end",
        section: "Video Settings",
    },

    videoPerformanceMode: {
        type: ControlType.Boolean,
        title: "Performance Mode",
        defaultValue: true,
        hidden: (props) =>
            props.mediaType !== "video" || props.preset === "custom",
        description:
            "Use optimized presets for better video performance (lower grid resolution)",
        section: "Video Settings",
    },

    adaptiveQuality: {
        type: ControlType.Boolean,
        title: "Adaptive Quality",
        defaultValue: true,
        hidden: (props) => props.mediaType !== "video",
        description:
            "Automatically adjust quality based on performance (reduces grid when FPS drops)",
        section: "Video Settings",
    },

    // ===== Sección: Appearance =====
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "transparent",
        description: "Background color of the container",
        section: "Appearance",
    },

    objectFit: {
        type: ControlType.Enum,
        title: "Object Fit",
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        description:
            "How the media should fit within the container - Cover fills completely (may crop), Contain fits entirely (may show empty space)",
        section: "Appearance",
    },

    spinnerColor: {
        type: ControlType.Color,
        title: "Loading Spinner Color",
        defaultValue: "#ffffff",
        description: "Color of the loading spinner",
        section: "Appearance",
    },

    // ===== Sección: Preset =====
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        defaultValue: "pixelated",
        options: ["smoothDistortion", "highDetail", "pixelated", "custom"],
        optionTitles: [
            PRESET_TITLES.smoothDistortion,
            PRESET_TITLES.highDetail,
            PRESET_TITLES.pixelated,
            PRESET_TITLES.custom,
        ],
        description:
            "Choose a predefined distortion style or select 'Custom' to create your own effect",
        section: "Preset",
    },

    // Preset inspector (only visible in custom mode)
    showPresetInfo: {
        type: ControlType.Boolean,
        title: "Show Preset Values",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => props.preset !== "custom",
        description:
            "Display a reference panel with preset values that you can manually copy to your custom settings",
        section: "Preset",
    },
    inspectPreset: {
        type: ControlType.Enum,
        title: "Reference Preset",
        defaultValue: "pixelated",
        options: ["smoothDistortion", "highDetail", "pixelated", "custom"],
        optionTitles: [
            PRESET_TITLES.smoothDistortion,
            PRESET_TITLES.highDetail,
            PRESET_TITLES.pixelated,
            PRESET_TITLES.custom,
        ],
        hidden: (props) => props.preset !== "custom" || !props.showPresetInfo,
        description:
            "Choose which preset or custom values to view as reference",
        section: "Preset",
    },

    // ===== Sección: Custom Settings (solo visibles cuando preset = "custom") =====
    grid: {
        type: ControlType.Number,
        title: "Grid Resolution",
        defaultValue: 50,
        min: 2,
        max: 1000,
        step: 1,
        description:
            "Resolution of the distortion grid (higher = more detail, more performance cost)",
        section: "Custom Settings",
        hidden: (props) => props.preset !== "custom",
    },
    mouseInfluence: {
        type: ControlType.Number,
        title: "Mouse Influence",
        defaultValue: 0.25,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        description:
            "Radius of mouse influence (0.05 = small area, 1.0 = full canvas)",
        section: "Custom Settings",
        hidden: (props) => props.preset !== "custom",
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 0.11,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        description: "Intensity of the mouse interaction effect",
        section: "Custom Settings",
        hidden: (props) => props.preset !== "custom",
    },
    relaxation: {
        type: ControlType.Number,
        title: "Relaxation",
        defaultValue: 0.9,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        description:
            "How quickly the distortion fades (0.7 = fast fade, 0.99 = very slow fade)",
        section: "Custom Settings",
        hidden: (props) => props.preset !== "custom",
    },
    distortionStrength: {
        type: ControlType.Number,
        title: "Distortion Strength",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        description: "Overall strength of the visual distortion effect",
        section: "Custom Settings",
        hidden: (props) => props.preset !== "custom",
    },
})
