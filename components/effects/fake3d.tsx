import {
    useCallback,
    useEffect,
    useRef,
    useState,
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


interface ImageSource {
    src?: string
    srcSet?: string
    alt?: string
}

interface Fake3dProps {
    mediaType: "image" | "video"
    originalImage: ImageSource
    depthImage: ImageSource
    originalVideo: string
    depthVideo: string
    videoLoop: boolean
    videoMuted: boolean
    videoAutoplay: boolean
    backgroundColor: string
    fitMode: "cover" | "contain" | "fill"
    xThreshold: number
    yThreshold: number
    parallaxStrength: number
    smoothing: number
    mirrorEdges: boolean
    invertDepth: boolean
    invertX: boolean
    invertY: boolean
    resetOnLeave: boolean
    maxPixelRatio: number
    introEnabled: boolean
    introDuration: number
    introScale: number
    style?: CSSProperties
}

interface MediaSources {
    original: WebGLTexture | null
    depth: WebGLTexture | null
    originalVideo: HTMLVideoElement | null
    depthVideo: HTMLVideoElement | null
    isVideo: boolean
}

interface UniformLocations {
    uMouse: WebGLUniformLocation | null
    uThreshold: WebGLUniformLocation | null
    uCover: WebGLUniformLocation | null
    uMirror: WebGLUniformLocation | null
    uDepthInvert: WebGLUniformLocation | null
    uIntro: WebGLUniformLocation | null
    originalTexture: WebGLUniformLocation | null
    depthTexture: WebGLUniformLocation | null
    aPosition: number
}

type MediaStatus = "loading" | "ready" | "error" | "unsupported" | "empty"

const DEFAULT_ORIGINAL: ImageSource = {
    src: "https://pustitesuki.github.io/HPO_test/car_wall.jpg",
    alt: "Demo photo",
}

const DEFAULT_DEPTH: ImageSource = {
    src: "https://pustitesuki.github.io/HPO_test/car_wall_depth.jpg",
    alt: "Demo depth map",
}

const PLACEHOLDER_STYLE: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: "Inter, system-ui, sans-serif",
}

interface RenderSettings {
    backgroundColor: string
    fitMode: "cover" | "contain" | "fill"
    xThreshold: number
    yThreshold: number
    parallaxStrength: number
    smoothing: number
    mirrorEdges: boolean
    invertDepth: boolean
    invertX: boolean
    invertY: boolean
    resetOnLeave: boolean
    maxPixelRatio: number
    introEnabled: boolean
    introDuration: number
    introScale: number
}

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
    vUv = aPosition * 0.5 + 0.5;
    vUv.y = 1.0 - vUv.y;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D originalTexture;
uniform sampler2D depthTexture;
uniform vec2 uMouse;
uniform vec2 uThreshold;
uniform vec4 uCover;
uniform float uMirror;
uniform float uDepthInvert;
uniform float uIntro;

varying vec2 vUv;

vec2 mapUv(vec2 v) {
    if (uMirror < 0.5) return v;
    vec2 m = mod(v, 2.0);
    return mix(m, 2.0 - m, step(1.0, m));
}

vec2 coverUv(vec2 uv) {
    return uCover.xy + uv * uCover.zw;
}

void main() {
    vec2 baseUv = coverUv(vUv);
    vec4 depthMap = texture2D(depthTexture, mapUv(baseUv));
    float depth = uDepthInvert > 0.5 ? 1.0 - depthMap.r : depthMap.r;
    vec2 offset = vec2(
        (depth - 0.5) * uMouse.x / uThreshold.x,
        (depth - 0.5) * uMouse.y / uThreshold.y
    );
    vec2 fake3d = baseUv + offset * uIntro;
    gl_FragColor = texture2D(originalTexture, mapUv(fake3d));
}
`

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
) {
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

function createProgram(gl: WebGLRenderingContext) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        FRAGMENT_SHADER
    )
    if (!vertexShader || !fragmentShader) return null

    const program = gl.createProgram()
    if (!program) return null

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
    }

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    return program
}

function getUniformLocations(
    gl: WebGLRenderingContext,
    program: WebGLProgram
): UniformLocations {
    return {
        uMouse: gl.getUniformLocation(program, "uMouse"),
        uThreshold: gl.getUniformLocation(program, "uThreshold"),
        uCover: gl.getUniformLocation(program, "uCover"),
        uMirror: gl.getUniformLocation(program, "uMirror"),
        uDepthInvert: gl.getUniformLocation(program, "uDepthInvert"),
        uIntro: gl.getUniformLocation(program, "uIntro"),
        originalTexture: gl.getUniformLocation(program, "originalTexture"),
        depthTexture: gl.getUniformLocation(program, "depthTexture"),
        aPosition: gl.getAttribLocation(program, "aPosition"),
    }
}

function StatusMessage(props: { title: string; message: string }) {
    return (
        <div style={PLACEHOLDER_STYLE} role="status">
            <div>
                <strong style={{ display: "block", marginBottom: 8 }}>
                    {props.title}
                </strong>
                {props.message}
            </div>
        </div>
    )
}

function configureTextureParameters(gl: WebGLRenderingContext) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
}

function createEmptyTexture(gl: WebGLRenderingContext) {
    const texture = gl.createTexture()
    if (!texture) return null

    gl.bindTexture(gl.TEXTURE_2D, texture)
    configureTextureParameters(gl)
    return texture
}

function loadTexture(
    gl: WebGLRenderingContext,
    url: string
): Promise<WebGLTexture | null> {
    return new Promise((resolve) => {
        const texture = createEmptyTexture(gl)
        if (!texture) {
            resolve(null)
            return
        }

        const image = new Image()
        image.crossOrigin = "anonymous"
        image.onload = () => {
            try {
                gl.bindTexture(gl.TEXTURE_2D, texture)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    image
                )
                configureTextureParameters(gl)
                resolve(texture)
            } catch {
                resolve(null)
            }
        }
        image.onerror = () => resolve(null)
        image.src = url
    })
}

function loadVideo(
    url: string,
    options: { loop: boolean; muted: boolean; autoplay: boolean }
): Promise<HTMLVideoElement | null> {
    return new Promise((resolve) => {
        const video = document.createElement("video")
        let settled = false

        const finish = () => {
            if (settled) return
            settled = true
            resolve(video)
        }

        video.crossOrigin = "anonymous"
        video.preload = "auto"
        video.playsInline = true
        video.loop = options.loop
        video.muted = options.muted
        video.autoplay = options.autoplay
        video.src = url

        video.onloadeddata = finish
        video.onerror = () => {
            settled = true
            resolve(null)
        }

        if (options.autoplay) {
            video.play().catch(finish)
        }
    })
}

function updateVideoTexture(
    gl: WebGLRenderingContext,
    texture: WebGLTexture,
    video: HTMLVideoElement
) {
    if (video.readyState < video.HAVE_CURRENT_DATA) return

    try {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            video
        )
    } catch {
        // Cross-origin or unsupported video frame
    }
}

function pauseVideos(videos: HTMLVideoElement[]) {
    for (const video of videos) {
        video.pause()
        video.removeAttribute("src")
        video.load()
    }
}

function getFitUniform(
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
    mode: "cover" | "contain" | "fill"
) {
    if (mode === "fill") return [0, 0, 1, 1] as const

    const containerAspect = width / height
    const imageAspect = imageWidth / imageHeight

    if (mode === "contain") {
        if (containerAspect > imageAspect) {
            const scale = containerAspect / imageAspect
            return [(1 - 1 / scale) * 0.5, 0, 1 / scale, 1] as const
        }

        const scale = imageAspect / containerAspect
        return [0, (1 - 1 / scale) * 0.5, 1, 1 / scale] as const
    }

    if (containerAspect > imageAspect) {
        const scale = imageAspect / containerAspect
        return [0, (1 - scale) * 0.5, 1, scale] as const
    }

    const scale = containerAspect / imageAspect
    return [(1 - scale) * 0.5, 0, scale, 1] as const
}

function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

/**
 * Fake 3D
 *
 * Depth-based parallax for images and synced video clips.
 * Moves with cursor/touch using a grayscale depth map.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Fake3d(props: Fake3dProps) {
    const {
        mediaType = "image",
        originalImage,
        depthImage,
        originalVideo = "",
        depthVideo = "",
        videoLoop = true,
        videoMuted = true,
        videoAutoplay = true,
        backgroundColor = "#000000",
        fitMode = "cover",
        xThreshold = 20,
        yThreshold = 35,
        parallaxStrength = 0.5,
        smoothing = 5,
        mirrorEdges = true,
        invertDepth = false,
        invertX = false,
        invertY = false,
        resetOnLeave = true,
        maxPixelRatio = 2,
        introEnabled = true,
        introDuration = 1.4,
        introScale = 0.06,
        style,
    } = props

    const settingsRef = useRef<RenderSettings>({
        backgroundColor,
        fitMode,
        xThreshold,
        yThreshold,
        parallaxStrength,
        smoothing,
        mirrorEdges,
        invertDepth,
        invertX,
        invertY,
        resetOnLeave,
        maxPixelRatio,
        introEnabled,
        introDuration,
        introScale,
    })

    useEffect(() => {
        settingsRef.current = {
            backgroundColor,
            fitMode,
            xThreshold,
            yThreshold,
            parallaxStrength,
            smoothing,
            mirrorEdges,
            invertDepth,
            invertX,
            invertY,
            resetOnLeave,
            maxPixelRatio,
            introEnabled,
            introDuration,
            introScale,
        }
    }, [
        backgroundColor,
        fitMode,
        xThreshold,
        yThreshold,
        parallaxStrength,
        smoothing,
        mirrorEdges,
        invertDepth,
        invertX,
        invertY,
        resetOnLeave,
        maxPixelRatio,
        introEnabled,
        introDuration,
        introScale,
    ])

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number>(0)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<WebGLProgram | null>(null)
    const uniformsRef = useRef<UniformLocations | null>(null)
    const isInViewRef = useRef(true)
    const texturesRef = useRef<MediaSources>({
        original: null,
        depth: null,
        originalVideo: null,
        depthVideo: null,
        isVideo: false,
    })
    const imageSizeRef = useRef({ width: 1, height: 1 })
    const cursorRef = useRef({ x: 0, y: 0, lerpX: 0, lerpY: 0 })
    const lastTimeRef = useRef<number>(0)
    const introStartRef = useRef<number>(0)
    const bufferRef = useRef<WebGLBuffer | null>(null)
    const [previewSrc, setPreviewSrc] = useState<string>("")
    const [mediaStatus, setMediaStatus] = useState<MediaStatus>("loading")
    const isVideoMode = mediaType === "video"

    const resolvedOriginalImage: ImageSource = {
        src: originalImage?.src || DEFAULT_ORIGINAL.src,
        alt: originalImage?.alt || DEFAULT_ORIGINAL.alt,
        srcSet: originalImage?.srcSet,
    }
    const resolvedDepthImage: ImageSource = {
        src: depthImage?.src || DEFAULT_DEPTH.src,
        alt: depthImage?.alt || DEFAULT_DEPTH.alt,
        srcSet: depthImage?.srcSet,
    }

    const originalUrl = isVideoMode
        ? originalVideo || ""
        : resolvedOriginalImage.src || ""
    const depthUrl = isVideoMode
        ? depthVideo || ""
        : resolvedDepthImage.src || ""
    const hasMedia = Boolean(originalUrl && depthUrl)

    const stopRenderLoop = useCallback(() => {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
    }, [])

    const renderFrame = useCallback((time: number) => {
        const gl = glRef.current
        const program = programRef.current
        const uniforms = uniformsRef.current
        const canvas = canvasRef.current
        const container = containerRef.current

        if (!gl || !program || !uniforms || !canvas || !container) return
        if (!texturesRef.current.original || !texturesRef.current.depth) return
        if (!isInViewRef.current) return

        const media = texturesRef.current
        if (media.isVideo && media.originalVideo && media.depthVideo) {
            const drift = Math.abs(
                media.originalVideo.currentTime - media.depthVideo.currentTime
            )
            if (drift > 0.05) {
                media.depthVideo.currentTime = media.originalVideo.currentTime
            }

            updateVideoTexture(gl, media.original!, media.originalVideo)
            updateVideoTexture(gl, media.depth!, media.depthVideo)
        }

        const delta = Math.min((time - lastTimeRef.current) / 1000, 0.05)
        lastTimeRef.current = time

        const settings = settingsRef.current
        const introProgress = settings.introEnabled
            ? Math.min(
                  1,
                  (time - introStartRef.current) /
                      (settings.introDuration * 1000)
              )
            : 1
        const introEase = easeOutCubic(introProgress)
        const introElapsed = (time - introStartRef.current) / 1000

        const cursor = cursorRef.current
        const signX = settings.invertX ? -1 : 1
        const signY = settings.invertY ? 1 : -1
        const parallaxX =
            cursor.x * settings.parallaxStrength * signX * introEase
        const parallaxY =
            cursor.y * settings.parallaxStrength * signY * introEase
        cursor.lerpX += (parallaxX - cursor.lerpX) * settings.smoothing * delta
        cursor.lerpY += (parallaxY - cursor.lerpY) * settings.smoothing * delta

        const width = container.clientWidth
        const height = container.clientHeight
        const dpr = Math.min(
            typeof window !== "undefined" ? window.devicePixelRatio : 1,
            settings.maxPixelRatio
        )

        canvas.width = Math.max(1, Math.floor(width * dpr))
        canvas.height = Math.max(1, Math.floor(height * dpr))
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvas.style.opacity = String(introEase)
        canvas.style.transformOrigin = "center center"
        canvas.style.transform = `scale(${1 + (1 - introEase) * settings.introScale})`

        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(program)

        const cover = getFitUniform(
            width,
            height,
            imageSizeRef.current.width,
            imageSizeRef.current.height,
            settings.fitMode
        )

        gl.uniform2f(
            uniforms.uMouse,
            cursor.lerpX +
                Math.sin(introElapsed * 3.2) * (1 - introEase) * 0.18,
            cursor.lerpY + Math.cos(introElapsed * 2.6) * (1 - introEase) * 0.12
        )
        gl.uniform2f(
            uniforms.uThreshold,
            Math.max(settings.xThreshold, 0.001),
            Math.max(settings.yThreshold, 0.001)
        )
        gl.uniform4f(uniforms.uCover, cover[0], cover[1], cover[2], cover[3])
        gl.uniform1f(uniforms.uMirror, settings.mirrorEdges ? 1 : 0)
        gl.uniform1f(uniforms.uDepthInvert, settings.invertDepth ? 1 : 0)
        gl.uniform1f(uniforms.uIntro, introEase)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.original)
        gl.uniform1i(uniforms.originalTexture, 0)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.depth)
        gl.uniform1i(uniforms.depthTexture, 1)

        const positionLocation = uniforms.aPosition
        if (!bufferRef.current) {
            bufferRef.current = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
                gl.STATIC_DRAW
            )
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current)
        }
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        if (isInViewRef.current) {
            rafRef.current = requestAnimationFrame(renderFrame)
        }
    }, [])

    const startRenderLoop = useCallback(() => {
        stopRenderLoop()
        lastTimeRef.current = performance.now()
        introStartRef.current = performance.now()
        rafRef.current = requestAnimationFrame(renderFrame)
    }, [renderFrame, stopRenderLoop])

    useEffect(() => {
        if (!isVideoMode) {
            setPreviewSrc(resolvedOriginalImage.src || "")
            return
        }
        setPreviewSrc(originalVideo || "")
    }, [isVideoMode, resolvedOriginalImage.src, originalVideo])

    useEffect(() => {
        if (isStatic) {
            setMediaStatus(hasMedia ? "ready" : isVideoMode ? "empty" : "ready")
            return
        }
        if (typeof window === "undefined") return
        if (!hasMedia) {
            setMediaStatus("empty")
            return
        }

        setMediaStatus("loading")

        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const gl =
            canvas.getContext("webgl", {
                alpha: false,
                antialias: true,
            }) || canvas.getContext("experimental-webgl")
        if (!gl) {
            setMediaStatus("unsupported")
            return
        }

        glRef.current = gl as WebGLRenderingContext

        const program = createProgram(gl as WebGLRenderingContext)
        if (!program) {
            setMediaStatus("unsupported")
            return
        }

        programRef.current = program
        uniformsRef.current = getUniformLocations(
            gl as WebGLRenderingContext,
            program
        )

        let cancelled = false

        const setup = async () => {
            if (isVideoMode) {
                const [originalVid, depthVid] = await Promise.all([
                    loadVideo(originalUrl!, {
                        loop: videoLoop,
                        muted: videoMuted,
                        autoplay: videoAutoplay,
                    }),
                    loadVideo(depthUrl!, {
                        loop: videoLoop,
                        muted: true,
                        autoplay: videoAutoplay,
                    }),
                ])

                if (cancelled || !originalVid || !depthVid) {
                    if (!cancelled) setMediaStatus("error")
                    return
                }

                const originalTex = createEmptyTexture(
                    gl as WebGLRenderingContext
                )
                const depthTex = createEmptyTexture(gl as WebGLRenderingContext)
                if (!originalTex || !depthTex) {
                    setMediaStatus("error")
                    return
                }

                if (videoAutoplay) {
                    depthVid.currentTime = originalVid.currentTime
                    void originalVid.play().catch(() => {})
                    void depthVid.play().catch(() => {})
                }

                texturesRef.current = {
                    original: originalTex,
                    depth: depthTex,
                    originalVideo: originalVid,
                    depthVideo: depthVid,
                    isVideo: true,
                }

                imageSizeRef.current = {
                    width: originalVid.videoWidth || 1,
                    height: originalVid.videoHeight || 1,
                }
                setMediaStatus("ready")
                if (isInViewRef.current) startRenderLoop()
                return
            }

            const [originalTex, depthTex] = await Promise.all([
                loadTexture(gl as WebGLRenderingContext, originalUrl),
                loadTexture(gl as WebGLRenderingContext, depthUrl),
            ])

            if (cancelled) return

            if (!originalTex || !depthTex) {
                setMediaStatus("error")
                return
            }

            texturesRef.current = {
                original: originalTex,
                depth: depthTex,
                originalVideo: null,
                depthVideo: null,
                isVideo: false,
            }

            const probe = new Image()
            probe.crossOrigin = "anonymous"
            probe.onload = () => {
                imageSizeRef.current = {
                    width: probe.width,
                    height: probe.height,
                }
                setMediaStatus("ready")
                if (isInViewRef.current) startRenderLoop()
            }
            probe.onerror = () => setMediaStatus("error")
            probe.src = originalUrl
        }

        setup()

        const updateCursor = (clientX: number, clientY: number) => {
            const rect = container.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) return
            cursorRef.current.x = clientX / rect.width - 0.5
            cursorRef.current.y = clientY / rect.height - 0.5
        }

        const resetCursor = () => {
            cursorRef.current.x = 0
            cursorRef.current.y = 0
        }

        const onMouseMove = (event: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            updateCursor(event.clientX - rect.left, event.clientY - rect.top)

            const media = texturesRef.current
            if (
                media.isVideo &&
                media.originalVideo &&
                media.originalVideo.paused &&
                videoAutoplay
            ) {
                void media.originalVideo.play().catch(() => {})
                void media.depthVideo?.play().catch(() => {})
            }
        }

        const onMouseLeave = () => {
            if (settingsRef.current.resetOnLeave) resetCursor()
        }

        const onTouchMove = (event: TouchEvent) => {
            const touch = event.touches[0]
            if (!touch) return
            const rect = container.getBoundingClientRect()
            updateCursor(touch.clientX - rect.left, touch.clientY - rect.top)
        }

        const onTouchEnd = () => {
            if (settingsRef.current.resetOnLeave) resetCursor()
        }

        const resizeObserver = new ResizeObserver(() => {
            lastTimeRef.current = performance.now()
        })

        resizeObserver.observe(container)
        container.addEventListener("mousemove", onMouseMove)
        container.addEventListener("mouseleave", onMouseLeave)
        container.addEventListener("touchmove", onTouchMove, { passive: true })
        container.addEventListener("touchend", onTouchEnd)

        return () => {
            cancelled = true
            stopRenderLoop()
            resizeObserver.disconnect()
            container.removeEventListener("mousemove", onMouseMove)
            container.removeEventListener("mouseleave", onMouseLeave)
            container.removeEventListener("touchmove", onTouchMove)
            container.removeEventListener("touchend", onTouchEnd)

            const glContext = glRef.current
            const media = texturesRef.current

            if (glContext) {
                if (media.original) glContext.deleteTexture(media.original)
                if (media.depth) glContext.deleteTexture(media.depth)
            }

            if (media.originalVideo || media.depthVideo) {
                pauseVideos(
                    [media.originalVideo, media.depthVideo].filter(
                        Boolean
                    ) as HTMLVideoElement[]
                )
            }

            texturesRef.current = {
                original: null,
                depth: null,
                originalVideo: null,
                depthVideo: null,
                isVideo: false,
            }
            if (bufferRef.current && glRef.current) {
                glRef.current.deleteBuffer(bufferRef.current)
            }
            bufferRef.current = null
            if (programRef.current && glRef.current) {
                glRef.current.deleteProgram(programRef.current)
            }
            programRef.current = null
            uniformsRef.current = null
            glRef.current = null
        }
    }, [
        isStatic,
        hasMedia,
        isVideoMode,
        originalUrl,
        depthUrl,
        videoLoop,
        videoMuted,
        videoAutoplay,
        renderFrame,
        startRenderLoop,
        stopRenderLoop,
    ])

    useEffect(() => {
        if (isStatic || !hasMedia) return

        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                isInViewRef.current = entry.isIntersecting

                if (entry.isIntersecting) {
                    if (mediaStatus === "ready") startRenderLoop()
                    const media = texturesRef.current
                    if (media.isVideo && videoAutoplay) {
                        void media.originalVideo?.play().catch(() => {})
                        void media.depthVideo?.play().catch(() => {})
                    }
                    return
                }

                stopRenderLoop()
                const media = texturesRef.current
                media.originalVideo?.pause()
                media.depthVideo?.pause()
            },
            { threshold: 0.05 }
        )

        observer.observe(container)
        return () => observer.disconnect()
    }, [
        isStatic,
        hasMedia,
        mediaStatus,
        startRenderLoop,
        stopRenderLoop,
        videoAutoplay,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
            }}
        >
            {mediaStatus === "unsupported" ? (
                <StatusMessage
                    title="WebGL unavailable"
                    message="This browser or device does not support WebGL, which is required for the 3D effect."
                />
            ) : mediaStatus === "error" ? (
                <StatusMessage
                    title="Media failed to load"
                    message="Check that both files are uploaded, use supported formats, and allow cross-origin media if hosted externally."
                />
            ) : mediaStatus === "empty" && isVideoMode ? (
                <StatusMessage
                    title="Upload video clips"
                    message="Add a Video and a matching Depth Video to enable the 3D effect."
                />
            ) : isStatic && previewSrc ? (
                isVideoMode ? (
                    <video
                        src={previewSrc}
                        muted
                        playsInline
                        loop={videoLoop}
                        autoPlay={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: fitMode === "fill" ? "fill" : fitMode,
                            display: "block",
                        }}
                    />
                ) : (
                    <img
                        src={previewSrc}
                        alt={resolvedOriginalImage.alt || ""}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: fitMode === "fill" ? "fill" : fitMode,
                            display: "block",
                        }}
                    />
                )
            ) : !isStatic && hasMedia ? (
                <canvas
                    ref={canvasRef}
                    aria-label="Fake 3D depth effect"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        touchAction: "none",
                        opacity: mediaStatus === "ready" ? 1 : 0,
                    }}
                />
            ) : null}
        </div>
    )
}

Fake3d.displayName = "Fake 3D"

addPropertyControls<Fake3dProps>(Fake3d, {
    mediaType: {
        type: ControlType.Enum,
        title: "Media",
        description:
            "Use Image for photo + depth map, or Video for synced clips.",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    originalImage: {
        type: ControlType.ResponsiveImage,
        title: "Photo",
        description: "Main image. Pair it with a matching depth map.",
        hidden: (props) => props.mediaType !== "image",
    },
    depthImage: {
        type: ControlType.ResponsiveImage,
        title: "Depth Map",
        description: "Grayscale depth map aligned with the photo.",
        hidden: (props) => props.mediaType !== "image",
    },
    originalVideo: {
        type: ControlType.File,
        title: "Video",
        description: "Main video clip.",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: (props) => props.mediaType !== "video",
    },
    depthVideo: {
        type: ControlType.File,
        title: "Depth Video",
        description: "Depth map video with the same duration and frame rate.",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: (props) => props.mediaType !== "video",
    },
    videoLoop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.mediaType !== "video",
    },
    videoMuted: {
        type: ControlType.Boolean,
        title: "Muted",
        description: "Required for autoplay in most browsers.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.mediaType !== "video",
    },
    videoAutoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        description: "Falls back to play on first interaction if blocked.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.mediaType !== "video",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    fitMode: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    xThreshold: {
        type: ControlType.Number,
        title: "X Threshold",
        description: "Lower values increase horizontal parallax.",
        defaultValue: 20,
        min: 1,
        max: 100,
        step: 1,
    },
    yThreshold: {
        type: ControlType.Number,
        title: "Y Threshold",
        description: "Lower values increase vertical parallax.",
        defaultValue: 35,
        min: 1,
        max: 100,
        step: 1,
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.05,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        description: "How quickly the effect follows the cursor.",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 0.5,
    },
    mirrorEdges: {
        type: ControlType.Boolean,
        title: "Mirror Edges",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    invertDepth: {
        type: ControlType.Boolean,
        title: "Invert Depth",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    invertX: {
        type: ControlType.Boolean,
        title: "Invert X",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    invertY: {
        type: ControlType.Boolean,
        title: "Invert Y",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    resetOnLeave: {
        type: ControlType.Boolean,
        title: "Reset on Leave",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    maxPixelRatio: {
        type: ControlType.Number,
        title: "Max Pixel Ratio",
        description: "Lower this on heavy pages to improve performance.",
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 0.5,
    },
    introEnabled: {
        type: ControlType.Boolean,
        title: "Intro",
        description: "Fade, zoom, and depth reveal on load.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    introDuration: {
        type: ControlType.Number,
        title: "Intro Duration",
        defaultValue: 1.4,
        min: 0.3,
        max: 4,
        step: 0.1,
        unit: "s",
        hidden: (props) => !props.introEnabled,
    },
    introScale: {
        type: ControlType.Number,
        title: "Intro Zoom",
        defaultValue: 0.06,
        min: 0,
        max: 0.2,
        step: 0.01,
        hidden: (props) => !props.introEnabled,
    },
})
