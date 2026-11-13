import React, { useRef, useState, useLayoutEffect } from "react"
import {
    Renderer,
    Camera,
    Transform,
    Texture,
    Program,
    Mesh,
    Geometry,
    type OGLRenderingContext,
} from "ogl"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { CustomEase } from "gsap/CustomEase"
import { ScrollSmoother } from "gsap/ScrollSmoother"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- Types ---
export interface ParticleUserData {
    baseAngle: number
    angleSpan: number
    baseY: number
    speed: number
    radius: number
}

export interface CameraAnimation {
    x: number
    y: number
    z: number
}

export interface CylinderConfig {
    radius: number
    height: number
    radialSegments: number
    heightSegments: number
}

export interface ParticleConfig {
    numParticles: number
    particleRadius: number
    segments: number
    angleSpan: number
}

export type ParticleMesh = Mesh & { userData: ParticleUserData }

// --- Data ---
export const cylinderConfig: CylinderConfig = {
    radius: 2.5,
    height: 2,
    radialSegments: 64,
    heightSegments: 1,
}

export const particleConfig: ParticleConfig = {
    numParticles: 12,
    particleRadius: 3.3,
    segments: 20,
    angleSpan: 0.3,
}

export const imageConfig = {
    width: 1024,
    height: 1024,
}

// --- Shaders ---
export const cylinderVertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec3 position;
  
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const cylinderFragment = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform float uDarkness;

  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(tMap, vUv);
    tex.rgb *= (1.0 - uDarkness);
    gl_FragColor = tex;
  }
`

export const particleVertex = /* glsl */ `
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const particleFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  
  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`

// --- Utils ---
export function drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
) {
    const imgRatio = img.naturalWidth / img.naturalHeight
    const canvasRatio = w / h

    let sourceX = 0
    let sourceY = 0
    let sourceWidth = img.naturalWidth
    let sourceHeight = img.naturalHeight

    if (imgRatio > canvasRatio) {
        sourceWidth = img.naturalHeight * canvasRatio
        sourceX = (img.naturalWidth - sourceWidth) / 2
    } else {
        sourceHeight = img.naturalWidth / canvasRatio
        sourceY = (img.naturalHeight - sourceHeight) / 2
    }

    ctx.save()
    ctx.translate(x, y + h)
    ctx.scale(1, -1)
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, w, h)
    ctx.restore()
}

export function createCylinderGeometry(
    gl: WebGLRenderingContext,
    config: CylinderConfig
) {
    const { radius, height, radialSegments, heightSegments } = config

    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments
        const yPos = (v - 0.5) * height

        for (let x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments
            const theta = u * Math.PI * 2

            const xPos = Math.cos(theta) * radius
            const zPos = Math.sin(theta) * radius

            positions.push(xPos, yPos, zPos)
            uvs.push(u, 1 - v)
        }
    }

    for (let y = 0; y < heightSegments; y++) {
        for (let x = 0; x < radialSegments; x++) {
            const a = y * (radialSegments + 1) + x
            const b = a + radialSegments + 1
            const c = a + 1
            const d = b + 1

            indices.push(a, b, c)
            indices.push(b, d, c)
        }
    }

    return new Geometry(gl as unknown as OGLRenderingContext, {
        position: { size: 3, data: new Float32Array(positions) },
        uv: { size: 2, data: new Float32Array(uvs) },
        index: { data: new Uint16Array(indices) },
    })
}

export function createParticleGeometry(
    gl: WebGLRenderingContext,
    config: ParticleConfig,
    index: number,
    height: number
) {
    const { numParticles, particleRadius, segments, angleSpan } = config

    const linePositions: number[] = []
    const startAngle = (index / numParticles) * Math.PI * 2

    const isTopHalf = index < numParticles / 2
    const yPosition = isTopHalf
        ? height * 0.7 + Math.random() * height * 0.3
        : -height * 1.0 + Math.random() * height * 0.3

    for (let j = 0; j <= segments; j++) {
        const t = j / segments
        const angle = startAngle + angleSpan * t
        const x = Math.cos(angle) * particleRadius
        const z = Math.sin(angle) * particleRadius

        linePositions.push(x, yPosition, z)
    }

    return {
        geometry: new Geometry(gl as unknown as OGLRenderingContext, {
            position: { size: 3, data: new Float32Array(linePositions) },
        }),
        userData: {
            baseAngle: startAngle,
            angleSpan: angleSpan,
            baseY: yPosition,
            speed: 0.5 + Math.random() * 1.0,
            radius: particleRadius,
        },
    }
}

let gsapRegistered = false
function ensureGsapRegistered() {
    if (gsapRegistered) return
    gsap.registerPlugin(ScrollTrigger, CustomEase, ScrollSmoother)

    CustomEase.create("cinematicSilk", "0.45, 0.05, 0.55, 0.95")
    CustomEase.create("cinematicSmooth", "0.25, 0.1, 0.25, 1")
    CustomEase.create("cinematicFlow", "0.33, 0, 0.2, 1")
    CustomEase.create("cinematicLinear", "0.4, 0, 0.6, 1")

    gsapRegistered = true
}

/**
 * @framerSupportedLayoutWidth 100%
 * @framerSupportedLayoutHeight 100%
 */
export function SushCinematicCarousel(props: {
    scrollLength?: string
    darkness?: number
    backgroundColor?: string
    rotationSpeed?: number
    smoothness?: number

    image1?: string
    image2?: string
    image3?: string
    image4?: string
    image5?: string
    image6?: string
    image7?: string
    image8?: string
    image9?: string
    image10?: string
    image11?: string
    image12?: string
}) {
    const isStatic = useIsStaticRenderer()

    const {
        scrollLength = "500svh",
        darkness = 0.3,
        backgroundColor = "#000000",
        rotationSpeed = 28.27,
        smoothness = 4,
        image1 = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&auto=format&fit=crop",
        image2 = "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1024&auto=format&fit=crop",
        image3 = "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1024&auto=format&fit=crop",
        image4 = "https://images.unsplash.com/photo-1618172193763-c511deb635ca?q=80&w=1024&auto=format&fit=crop",
        image5 = "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=1024&auto=format&fit=crop",
        image6 = "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1024&auto=format&fit=crop",
        image7 = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&auto=format&fit=crop",
        image8 = "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1024&auto=format&fit=crop",
        image9 = "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1024&auto=format&fit=crop",
        image10 = "https://images.unsplash.com/photo-1618172193763-c511deb635ca?q=80&w=1024&auto=format&fit=crop",
        image11 = "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=1024&auto=format&fit=crop",
        image12 = "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1024&auto=format&fit=crop",
    } = props

    const images = [
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9,
        image10,
        image11,
        image12,
    ]

    const [isLoading, setIsLoading] = useState(true)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const smoothWrapperRef = useRef<HTMLDivElement>(null)
    const smoothContentRef = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        if (isStatic) return
        if (
            !canvasRef.current ||
            !containerRef.current ||
            !smoothWrapperRef.current ||
            !smoothContentRef.current
        )
            return

        ensureGsapRegistered()

        // Guards against the classic "stale async effect" race: if this
        // effect re-runs or unmounts before image loading finishes, the
        // browser still fires the pending onload/onerror callbacks. Without
        // this flag those callbacks would build a scene and kick off a new
        // requestAnimationFrame loop *after* cleanup already ran, orphaning
        // it forever (the bug the moderator flagged).
        let isActive = true
        let animationFrameId: number | undefined

        // Viewport visibility gating: the rAF loop should only run while the
        // canvas is actually on screen. `isInView` defaults to true so we
        // don't stall the very first render before the observer's initial
        // callback fires; the observer then keeps it accurate going forward.
        let isInView = true
        let sceneReady = false

        const smoother = ScrollSmoother.create({
            wrapper: smoothWrapperRef.current,
            content: smoothContentRef.current,
            smooth: smoothness,
            effects: false,
            smoothTouch: 0.1,
        })

        const renderer = new Renderer({
            canvas: canvasRef.current,
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: Math.min(window.devicePixelRatio, 2),
            alpha: true,
            antialias: true,
        })
        const gl = renderer.gl
        gl.clearColor(0, 0, 0, 1)
        gl.disable(gl.CULL_FACE)

        const getResponsiveDimensions = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            const isMobile = width < 768
            const isTablet = width >= 768 && width < 1024

            const baseScaleFactor = Math.min(width, height) / 1000
            const targetRadius = isMobile
                ? Math.max(1.5, baseScaleFactor * 3.5)
                : Math.max(2.0, baseScaleFactor * 2.8)
            const targetHeight = isMobile
                ? targetRadius * 0.75
                : targetRadius * 0.9

            const cameraZ = isMobile ? 6 : isTablet ? 7 : 8
            const fov = isMobile ? 50 : 45

            return {
                cylinderScale: targetRadius / cylinderConfig.radius,
                targetHeight,
                cameraZ,
                fov,
                isMobile,
            }
        }

        const dimensions = getResponsiveDimensions()

        const cameraOptions: any = { fov: dimensions.fov }
        if (dimensions.isMobile) {
            cameraOptions.aspect = window.innerWidth / window.innerHeight
        }
        const camera = new Camera(gl, cameraOptions)
        camera.position.set(0, 0, dimensions.cameraZ)

        const scene = new Transform()

        const activeCylinderConfig = {
            ...cylinderConfig,
            height: dimensions.targetHeight,
        }

        const geometry = createCylinderGeometry(gl, activeCylinderConfig)
        const hardwareLimit = gl.getParameter(gl.MAX_TEXTURE_SIZE)
        const isMobileDevice = window.innerWidth < 768
        const safeLimit = isMobileDevice ? 2048 : Math.min(hardwareLimit, 8192)

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", {
            willReadFrequently: false,
            alpha: false,
        })!
        const numImages = images.length

        const totalWidthOriginal = imageConfig.width * numImages
        const heightOriginal = imageConfig.height

        const scale = Math.min(1, safeLimit / totalWidthOriginal)

        canvas.width = Math.floor(totalWidthOriginal * scale)
        canvas.height = Math.floor(heightOriginal * scale)

        let loadedImages = 0
        const imageElements: HTMLImageElement[] = []
        const imageTags: HTMLImageElement[] = []
        let scrollTriggerInstance: ScrollTrigger | null = null
        let cylinderMesh: Mesh | null = null
        let textureObj: Texture | null = null
        const particles: ParticleMesh[] = []
        const cameraAnim = { x: 0, y: 0, z: dimensions.cameraZ }
        const lastRotation = { current: 0 }
        const velocity = { current: 0 }

        const circumference = 2 * Math.PI * cylinderConfig.radius
        const textureAspectRatio =
            imageConfig.height / (imageConfig.width * images.length)
        const idealHeight = circumference * textureAspectRatio
        const heightCorrection = idealHeight / activeCylinderConfig.height

        let lastWidth = window.innerWidth

        const handleResize = () => {
            const currentWidth = window.innerWidth
            const newDimensions = getResponsiveDimensions()

            if (newDimensions.isMobile && currentWidth === lastWidth) {
                return
            }
            lastWidth = currentWidth

            renderer.setSize(currentWidth, window.innerHeight)

            camera.perspective({
                fov: newDimensions.fov,
                aspect: currentWidth / window.innerHeight,
            })

            if (cylinderMesh) {
                if (newDimensions.isMobile) {
                    cylinderMesh.scale.set(
                        newDimensions.cylinderScale,
                        newDimensions.cylinderScale * heightCorrection,
                        newDimensions.cylinderScale
                    )
                } else {
                    cylinderMesh.scale.set(
                        newDimensions.cylinderScale,
                        newDimensions.cylinderScale,
                        newDimensions.cylinderScale
                    )
                }
            }

            if (
                cameraAnim.z === 8 ||
                cameraAnim.z === 7 ||
                cameraAnim.z === 6
            ) {
                cameraAnim.z = newDimensions.cameraZ
            }
        }

        window.addEventListener("resize", handleResize)

        const animate = () => {
            // Top-level guard: if the effect has been cleaned up, stop
            // scheduling new frames instead of relying solely on the
            // cancelAnimationFrame call in the cleanup function below.
            if (!isActive) return

            // Viewport guard: if the canvas isn't visible, stop scheduling
            // frames entirely rather than rendering into thin air. The
            // IntersectionObserver callback below is responsible for
            // calling animate() again once the canvas re-enters view.
            if (!isInView) {
                animationFrameId = undefined
                return
            }

            animationFrameId = requestAnimationFrame(animate)

            camera.position.set(cameraAnim.x, cameraAnim.y, cameraAnim.z)
            camera.lookAt([0, 0, 0])

            if (cylinderMesh) {
                const currentRotation = cylinderMesh.rotation.y
                velocity.current = currentRotation - lastRotation.current
                lastRotation.current = currentRotation

                const speed = Math.abs(velocity.current) * 100
                const isRotating = Math.abs(velocity.current) > 0.0001

                particles.forEach((particle) => {
                    const particleData = particle.userData

                    const targetOpacity = isRotating
                        ? Math.min(speed * 3, 0.95)
                        : 0
                    const currentOpacity = particle.program.uniforms.uOpacity
                        .value as number
                    particle.program.uniforms.uOpacity.value =
                        currentOpacity + (targetOpacity - currentOpacity) * 0.15

                    if (isRotating) {
                        const rotationOffset =
                            velocity.current * particleData.speed * 1.5
                        const newBaseAngle =
                            particleData.baseAngle + rotationOffset
                        particleData.baseAngle = newBaseAngle

                        const segments = particleConfig.segments
                        const positions = particle.geometry.attributes.position
                            .data as Float32Array

                        for (let j = 0; j <= segments; j++) {
                            const t = j / segments
                            const angle =
                                newBaseAngle + particleData.angleSpan * t
                            const radiusWithSpeed = particleData.radius

                            positions[j * 3] = Math.cos(angle) * radiusWithSpeed
                            positions[j * 3 + 1] = particleData.baseY
                            positions[j * 3 + 2] =
                                Math.sin(angle) * radiusWithSpeed
                        }

                        particle.geometry.attributes.position.needsUpdate = true
                    }
                })
            }

            renderer.render({ scene, camera })
        }

        // Resume the loop only if the scene has actually been built and no
        // frame is currently in flight — avoids double-scheduling if the
        // observer fires multiple times in a row.
        const resumeIfNeeded = () => {
            if (
                isActive &&
                isInView &&
                sceneReady &&
                animationFrameId === undefined
            ) {
                animate()
            }
        }

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                isInView = entry.isIntersecting
                if (isInView) {
                    resumeIfNeeded()
                }
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(canvasRef.current)

        images.forEach((imageSrc, index) => {
            const img = new window.Image()
            imageTags[index] = img
            img.crossOrigin = "anonymous"
            img.onload = () => {
                // Bail out if the effect was cleaned up while this image
                // was still in flight — prevents building a scene and
                // starting a rAF loop for an instance that no longer exists.
                if (!isActive) return

                imageElements[index] = img
                loadedImages++

                const totalCanvasWidth = canvas.width
                const canvasHeight = canvas.height

                if (loadedImages === numImages) {
                    imageElements.forEach((imgEl, i) => {
                        const xStartExact = (i / numImages) * totalCanvasWidth
                        const xEndExact =
                            ((i + 1) / numImages) * totalCanvasWidth

                        const xPos = Math.floor(xStartExact)
                        const xEnd = Math.floor(xEndExact)

                        const drawWidthActual = xEnd - xPos
                        drawImageCover(
                            ctx,
                            imgEl,
                            xPos,
                            0,
                            drawWidthActual,
                            canvasHeight
                        )
                    })

                    textureObj = new Texture(gl, {
                        wrapS: gl.CLAMP_TO_EDGE,
                        wrapT: gl.CLAMP_TO_EDGE,
                        minFilter: gl.LINEAR,
                        magFilter: gl.LINEAR,
                        generateMipmaps: false,
                    })

                    textureObj.image = canvas
                    textureObj.needsUpdate = true

                    const program = new Program(gl, {
                        vertex: cylinderVertex,
                        fragment: cylinderFragment,
                        uniforms: {
                            tMap: { value: textureObj },
                            uDarkness: { value: darkness },
                        },
                        cullFace: null,
                    })

                    cylinderMesh = new Mesh(gl, { geometry, program })
                    cylinderMesh.setParent(scene)
                    cylinderMesh.rotation.y = 0.5
                    cylinderMesh.scale.set(
                        dimensions.cylinderScale,
                        dimensions.cylinderScale,
                        dimensions.cylinderScale
                    )

                    setIsLoading(false)

                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: "top top",
                            end: "bottom bottom",
                            scrub: 1,
                        },
                    })
                    scrollTriggerInstance = tl.scrollTrigger || null

                    tl.to(cameraAnim, {
                        x: 0,
                        y: 0,
                        z: dimensions.cameraZ,
                        duration: 1,
                        ease: "cinematicSilk",
                    })
                        .to(cameraAnim, {
                            x: 0,
                            y: 5,
                            z: 5,
                            duration: 1,
                            ease: "cinematicFlow",
                        })
                        .to(cameraAnim, {
                            x: 1.5,
                            y: 2,
                            z: 2,
                            duration: 2,
                            ease: "cinematicLinear",
                        })
                        .to(cameraAnim, {
                            x: 0.5,
                            y: 0,
                            z: 0.8,
                            duration: 3.5,
                            ease: "power1.inOut",
                        })
                        .to(cameraAnim, {
                            x: -6,
                            y: -1,
                            z: dimensions.cameraZ,
                            duration: 1,
                            ease: "cinematicSmooth",
                        })

                    tl.to(
                        cylinderMesh.rotation,
                        {
                            y: `+=${rotationSpeed}`,
                            duration: 8.5,
                            ease: "none",
                        },
                        0
                    )

                    for (let i = 0; i < particleConfig.numParticles; i++) {
                        const { geometry: lineGeometry, userData } =
                            createParticleGeometry(
                                gl,
                                particleConfig,
                                i,
                                activeCylinderConfig.height
                            )

                        const lineProgram = new Program(gl, {
                            vertex: particleVertex,
                            fragment: particleFragment,
                            uniforms: {
                                uColor: { value: [1.0, 1.0, 1.0] },
                                uOpacity: { value: 0.0 },
                            },
                            transparent: true,
                            depthTest: true,
                        })

                        const particle = new Mesh(gl, {
                            geometry: lineGeometry,
                            program: lineProgram,
                            mode: gl.LINE_STRIP,
                        }) as ParticleMesh

                        particle.userData = userData
                        particle.setParent(scene)
                        particles.push(particle)
                    }

                    sceneReady = true

                    // Re-check isActive one more time: setState above and
                    // the scroll-trigger timeline creation can, in theory,
                    // span a tick. Don't kick off rendering for a torn-down
                    // effect instance. Also respect current viewport state —
                    // if the canvas isn't in view yet, the observer callback
                    // (via resumeIfNeeded) will start the loop once it is.
                    if (isActive && isInView) {
                        animate()
                    }
                }
            }
            img.onerror = () => {
                if (!isActive) return
                console.error("Failed to load image:", imageSrc)
                setIsLoading(false)
            }
            img.src = imageSrc
        })

        return () => {
            // Flip the guard first, before anything else. Any onload/onerror
            // callbacks that fire after this point (from images that were
            // still in flight) will see isActive === false and no-op.
            isActive = false

            if (animationFrameId !== undefined) {
                cancelAnimationFrame(animationFrameId)
            }

            intersectionObserver.disconnect()

            // Detach handlers and abort in-flight requests so late network
            // responses can't touch anything from this effect instance.
            imageTags.forEach((img) => {
                img.onload = null
                img.onerror = null
                img.src = ""
            })

            window.removeEventListener("resize", handleResize)
            if (scrollTriggerInstance) {
                scrollTriggerInstance.kill()
            }
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
            smoother.kill()

            geometry.remove()
            particles.forEach((p) => p.geometry.remove())
            if (textureObj) {
                // OGL texture cleanup if available
            }
        }
    }, [
        isStatic,
        darkness,
        rotationSpeed,
        smoothness,
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9,
        image10,
        image11,
        image12,
    ])

    if (isStatic) {
        return (
            <div
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                    backgroundColor,
                    width: "100%",
                    height: "100%",
                    minHeight: "100vh",
                }}
            >
                {image1 ? (
                    <img
                        src={image1}
                        alt="Static Preview"
                        className="w-full h-full object-cover absolute inset-0"
                    />
                ) : (
                    <div className="w-full h-full opacity-25 bg-gradient-to-tr from-white to-neutral-600 absolute inset-0" />
                )}
            </div>
        )
    }

    return (
        <div
            className="relative w-full h-full overflow-hidden"
            style={{ backgroundColor }}
        >
            {isLoading && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor }}
                >
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
                </div>
            )}

            <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
                <canvas ref={canvasRef} className="h-full w-full block" />
            </div>

            <div
                ref={smoothWrapperRef}
                id="smooth-wrapper"
                className="relative z-20 h-full w-full"
            >
                <div
                    ref={smoothContentRef}
                    id="smooth-content"
                    className="h-full w-full"
                >
                    <div ref={containerRef} style={{ height: scrollLength }} />
                </div>
            </div>
        </div>
    )
}

addPropertyControls(SushCinematicCarousel, {
    scrollLength: {
        type: ControlType.String,
        title: "Scroll Length",
        defaultValue: "500svh",
    },
    darkness: {
        type: ControlType.Number,
        title: "Texture Darkness",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Amount",
        defaultValue: 28.27,
        min: 5,
        max: 100,
        step: 1,
    },
    smoothness: {
        type: ControlType.Number,
        title: "Scroll Smoothness",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 0.5,
    },
    image1: { type: ControlType.Image, title: "Image 1" },
    image2: { type: ControlType.Image, title: "Image 2" },
    image3: { type: ControlType.Image, title: "Image 3" },
    image4: { type: ControlType.Image, title: "Image 4" },
    image5: { type: ControlType.Image, title: "Image 5" },
    image6: { type: ControlType.Image, title: "Image 6" },
    image7: { type: ControlType.Image, title: "Image 7" },
    image8: { type: ControlType.Image, title: "Image 8" },
    image9: { type: ControlType.Image, title: "Image 9" },
    image10: { type: ControlType.Image, title: "Image 10" },
    image11: { type: ControlType.Image, title: "Image 11" },
    image12: { type: ControlType.Image, title: "Image 12" },
})
