/**
 * @name 3D Circular Gallery
 * @author Karim Saif
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    Camera,
    Mesh,
    Plane,
    Program,
    Renderer,
    Texture,
    Transform,
    type OGLRenderingContext,
} from "ogl"
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"

/* --------------------------------
 * Types
 ----------------------------------- */
export interface GalleryItem {
    image?: string
    text: string
}

interface CircularGalleryProps {
    items?: GalleryItem[]
    backgroundColor?: string
    bend?: number
    distortion?: number
    borderRadius?: number
    scrollSpeed?: number
    scrollEase?: number
    preventPageScroll?: boolean
    showArrows?: boolean
    arrowColor?: string
    arrowBgColor?: string
    textColor?: string
    fontSize?: number
    fontWeight?: string
    fontFamily?: string
    customFontFamily?: string
    ariaLabel?: string
    style?: React.CSSProperties
    className?: string
}

interface ScrollState {
    ease: number
    current: number
    target: number
    last: number
    position: number
}

/* --------------------------------
 * Defaults
 ----------------------------------- */
const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
    {
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
        text: "Cosmic Array",
    },
    {
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        text: "Coastline",
    },
    {
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80",
        text: "Mountain Pass",
    },
]

const MAX_ITEMS = 12

/* --------------------------------
 * Utilities
 ----------------------------------- */
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null

    const debounced = (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
            timeout = null
            func(...args)
        }, wait)
    }

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout)
            timeout = null
        }
    }

    return debounced as typeof debounced & { cancel: () => void }
}

function lerp(p1: number, p2: number, t: number) {
    return p1 + (p2 - p1) * t
}

function disposeTexture(texture?: Texture) {
    if (
        texture &&
        typeof (texture as unknown as { remove?: () => void }).remove ===
            "function"
    ) {
        ;(texture as unknown as { remove: () => void }).remove()
    }
}

function createTextTexture(
    gl: OGLRenderingContext,
    text: string,
    font: string,
    color: string
) {
    if (typeof document === "undefined") return null

    try {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")
        if (!context) return null

        context.font = font
        const metrics = context.measureText(text)
        const textWidth = Math.ceil(metrics.width)
        const textHeight = Math.ceil(parseInt(font, 10) * 1.2) || 40

        canvas.width = Math.max(textWidth + 20, 2)
        canvas.height = Math.max(textHeight + 20, 2)

        context.font = font
        context.fillStyle = color
        context.textBaseline = "middle"
        context.textAlign = "center"
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.fillText(text, canvas.width / 2, canvas.height / 2)

        const texture = new Texture(gl, { generateMipmaps: false })
        texture.image = canvas
        return { texture, width: canvas.width, height: canvas.height }
    } catch {
        return null
    }
}

function createFallbackCanvas(label = ""): HTMLCanvasElement | null {
    if (typeof document === "undefined") return null

    try {
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 650
        const ctx = canvas.getContext("2d")
        if (ctx) {
            const gradient = ctx.createLinearGradient(0, 0, 512, 650)
            gradient.addColorStop(0, "#22252a")
            gradient.addColorStop(1, "#363a40")
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, 512, 650)
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 28px sans-serif"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(label || "Gallery Item", 256, 325)
        }
        return canvas
    } catch {
        return null
    }
}

/* --------------------------------
 * OGL Classes
 ----------------------------------- */
class Title {
    gl: OGLRenderingContext
    plane: Mesh
    text: string
    textColor: string
    font: string
    mesh?: Mesh
    program?: Program
    texture?: Texture
    geometry?: Plane

    constructor({
        gl,
        plane,
        text,
        textColor,
        font,
    }: {
        gl: OGLRenderingContext
        plane: Mesh
        text: string
        textColor: string
        font: string
    }) {
        this.gl = gl
        this.plane = plane
        this.text = text
        this.textColor = textColor
        this.font = font
        this.createMesh()
    }

    createMesh() {
        const textResult = createTextTexture(
            this.gl,
            this.text,
            this.font,
            this.textColor
        )
        if (!textResult) return

        const { texture, width, height } = textResult
        this.texture = texture
        this.geometry = new Plane(this.gl)
        this.program = new Program(this.gl, {
            vertex: `
                attribute vec3 position;
                attribute vec2 uv;
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: `
                precision highp float;
                uniform sampler2D tMap;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tMap, vUv);
                    if (color.a < 0.1) discard;
                    gl_FragColor = color;
                }
            `,
            uniforms: { tMap: { value: texture } },
            transparent: true,
        })

        this.mesh = new Mesh(this.gl, {
            geometry: this.geometry,
            program: this.program,
        })

        const aspect = width / height
        const textHeight = this.plane.scale.y * 0.15
        const textWidth = textHeight * aspect
        this.mesh.scale.set(textWidth, textHeight, 1)
        this.mesh.position.y =
            -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05
        this.mesh.setParent(this.plane)
    }

    updateFont(font: string, textColor: string) {
        if (this.font === font && this.textColor === textColor) return
        this.font = font
        this.textColor = textColor

        const textResult = createTextTexture(
            this.gl,
            this.text,
            this.font,
            this.textColor
        )
        if (!textResult || !this.mesh || !this.program) return

        disposeTexture(this.texture)
        this.texture = textResult.texture
        this.program.uniforms.tMap.value = this.texture

        const aspect = textResult.width / textResult.height
        const textHeight = this.plane.scale.y * 0.15
        const textWidth = textHeight * aspect
        this.mesh.scale.set(textWidth, textHeight, 1)
        this.mesh.position.y =
            -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05
    }

    destroy() {
        if (this.mesh) this.mesh.setParent(null)
        disposeTexture(this.texture)
        if (this.geometry) this.geometry.remove()
        if (this.program) this.program.remove()
    }
}

class Media {
    gl: OGLRenderingContext
    geometry: Plane
    image?: string
    index: number
    length: number
    scene: Transform
    screen: { width: number; height: number }
    text: string
    viewport: { width: number; height: number }
    bend: number
    distortion: number
    textColor: string
    borderRadius: number
    font: string
    program!: Program
    plane!: Mesh
    title?: Title
    texture?: Texture
    fallbackCanvas?: HTMLCanvasElement | null
    imageElement?: HTMLImageElement
    destroyed = false
    extra = 0
    widthTotal = 0
    width = 0
    x = 0
    scale = 1
    padding = 2
    isBefore = false
    isAfter = false

    constructor(opts: {
        geometry: Plane
        gl: OGLRenderingContext
        image?: string
        index: number
        length: number
        scene: Transform
        screen: { width: number; height: number }
        text: string
        viewport: { width: number; height: number }
        bend: number
        distortion: number
        textColor: string
        borderRadius: number
        font: string
    }) {
        Object.assign(this, opts)
        this.createShader()
        this.createMesh()
        this.createTitle()
        this.onResize()
    }

    private getNormalizedRadius() {
        return Math.min(0.5, Math.max(0.0, this.borderRadius / 180))
    }

    createShader() {
        this.texture = new Texture(this.gl, { generateMipmaps: false })

        this.program = new Program(this.gl, {
            depthTest: false,
            depthWrite: false,
            vertex: `
                precision highp float;
                attribute vec3 position;
                attribute vec2 uv;
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                uniform float uTime;
                uniform float uSpeed;
                uniform float uDistortion;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 p = position;
                    float wave = sin(p.x * 3.5 + uTime * 2.0) * cos(p.y * 2.0 + uTime * 1.5);
                    p.z += wave * (uSpeed * 0.45 * uDistortion);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                }
            `,
            fragment: `
                precision highp float;
                uniform vec2 uImageSizes;
                uniform vec2 uPlaneSizes;
                uniform sampler2D tMap;
                uniform float uBorderRadius;
                uniform float uTime;
                uniform float uSpeed;
                uniform float uDistortion;
                varying vec2 vUv;

                float roundedBoxSDF(vec2 p, vec2 b, float r) {
                    vec2 d = abs(p) - b;
                    return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
                }

                void main() {
                    vec2 ratio = vec2(
                        min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
                        min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
                    );
                    vec2 baseUv = vec2(
                        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
                        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
                    );

                    vec2 distortedUv = baseUv;
                    if (uDistortion > 0.001 && uSpeed > 0.001) {
                        float uvWave = sin(baseUv.y * 10.0 + uTime * 3.0) * (uSpeed * 0.035 * uDistortion);
                        distortedUv.x += uvWave;
                    }

                    vec4 color = texture2D(tMap, distortedUv);
                    float r = clamp(uBorderRadius, 0.0, 0.5);
                    float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - r), r);
                    float alpha = 1.0 - smoothstep(-0.0025, 0.0025, d);
                    if (alpha <= 0.001) discard;
                    gl_FragColor = vec4(color.rgb, color.a * alpha);
                }
            `,
            uniforms: {
                tMap: { value: this.texture },
                uPlaneSizes: { value: [0, 0] },
                uImageSizes: { value: [512, 650] },
                uSpeed: { value: 0 },
                uTime: { value: 100 * Math.random() },
                uDistortion: { value: this.distortion },
                uBorderRadius: { value: this.getNormalizedRadius() },
            },
            transparent: true,
        })

        this.fallbackCanvas = createFallbackCanvas(this.text)
        if (this.fallbackCanvas) {
            this.texture.image = this.fallbackCanvas
        }

        if (
            typeof window !== "undefined" &&
            this.image &&
            typeof this.image === "string" &&
            this.image.trim() !== ""
        ) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            this.imageElement = img

            img.onload = () => {
                if (this.destroyed) return
                if (this.texture && this.program?.uniforms?.uImageSizes) {
                    this.texture.image = img
                    this.program.uniforms.uImageSizes.value = [
                        img.naturalWidth || 512,
                        img.naturalHeight || 650,
                    ]
                }
            }
            img.onerror = () => {
                if (this.destroyed) return
                if (
                    this.texture &&
                    this.fallbackCanvas &&
                    this.program?.uniforms?.uImageSizes
                ) {
                    this.texture.image = this.fallbackCanvas
                    this.program.uniforms.uImageSizes.value = [512, 650]
                }
            }
            img.src = this.image
        }
    }

    createMesh() {
        this.plane = new Mesh(this.gl, {
            geometry: this.geometry,
            program: this.program,
        })
        this.plane.setParent(this.scene)
    }

    createTitle() {
        if (this.text) {
            this.title = new Title({
                gl: this.gl,
                plane: this.plane,
                text: this.text,
                textColor: this.textColor,
                font: this.font,
            })
        }
    }

    updateConfig({
        bend,
        distortion,
        borderRadius,
        textColor,
        font,
    }: {
        bend: number
        distortion: number
        borderRadius: number
        textColor: string
        font: string
    }) {
        this.bend = bend
        this.distortion = distortion
        this.borderRadius = borderRadius

        if (this.program?.uniforms?.uDistortion) {
            this.program.uniforms.uDistortion.value = distortion
        }
        if (this.program?.uniforms?.uBorderRadius) {
            this.program.uniforms.uBorderRadius.value =
                this.getNormalizedRadius()
        }
        if (this.title) this.title.updateFont(font, textColor)

        this.textColor = textColor
        this.font = font
    }

    update(
        scroll: ScrollState,
        direction: "right" | "left" | "none",
        globalTime: number,
        globalSpeed: number
    ) {
        this.plane.position.x = this.x - scroll.current - this.extra

        const x = this.plane.position.x
        const H = this.viewport.width / 2

        if (Math.abs(this.bend) < 0.001) {
            this.plane.position.y = 0
            this.plane.rotation.z = 0
        } else {
            const B_abs = Math.max(Math.abs(this.bend), 0.001)
            const R = (H * H + B_abs * B_abs) / (2 * B_abs)
            const effectiveX = Math.min(Math.abs(x), H)
            const arc =
                R - Math.sqrt(Math.max(0, R * R - effectiveX * effectiveX))

            if (this.bend > 0) {
                this.plane.position.y = -arc
                this.plane.rotation.z =
                    -Math.sign(x) * Math.asin(effectiveX / R)
            } else {
                this.plane.position.y = arc
                this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R)
            }
        }

        this.program.uniforms.uTime.value = globalTime
        this.program.uniforms.uSpeed.value = globalSpeed

        const planeOffset = this.plane.scale.x / 2
        const viewportOffset = this.viewport.width / 2
        this.isBefore = this.plane.position.x + planeOffset < -viewportOffset
        this.isAfter = this.plane.position.x - planeOffset > viewportOffset

        if (direction === "right" && this.isBefore) {
            this.extra -= this.widthTotal
            this.isBefore = this.isAfter = false
        } else if (direction === "left" && this.isAfter) {
            this.extra += this.widthTotal
            this.isBefore = this.isAfter = false
        }
    }

    onResize({
        screen,
        viewport,
    }: {
        screen?: { width: number; height: number }
        viewport?: { width: number; height: number }
    } = {}) {
        if (screen) this.screen = screen
        if (viewport) this.viewport = viewport

        this.scale = this.screen.height / 1500
        this.plane.scale.y =
            (this.viewport.height * (900 * this.scale)) / this.screen.height
        this.plane.scale.x =
            (this.viewport.width * (700 * this.scale)) / this.screen.width

        this.program.uniforms.uPlaneSizes.value = [
            this.plane.scale.x,
            this.plane.scale.y,
        ]

        this.padding = 2
        this.width = this.plane.scale.x + this.padding
        this.widthTotal = this.width * this.length
        this.x = this.width * this.index
    }

    destroy() {
        this.destroyed = true
        if (this.imageElement) {
            this.imageElement.onload = null
            this.imageElement.onerror = null
            this.imageElement.src = ""
            this.imageElement = undefined
        }
        if (this.title) this.title.destroy()
        if (this.plane) this.plane.setParent(null)
        disposeTexture(this.texture)
        if (this.program) this.program.remove()
    }
}

/* --------------------------------
 * App Controller
 ----------------------------------- */
class App {
    container: HTMLElement
    config: any
    scroll: ScrollState
    onCheckDebounce: ReturnType<typeof debounce>
    renderer!: Renderer
    gl!: OGLRenderingContext
    camera!: Camera
    scene!: Transform
    planeGeometry!: Plane
    mediasImages: GalleryItem[] = []
    medias: Media[] = []
    isDown = false
    start = 0
    screen = { width: 0, height: 0 }
    viewport = { width: 0, height: 0 }
    raf = 0
    time = 0
    lastFrameTime = 0
    isRunning = false
    isVisible = false
    resizeObserver: ResizeObserver | null = null
    reducedMotion = false

    boundOnResize: () => void
    boundOnWheel: (e: WheelEvent) => void
    boundOnPointerDown: (e: PointerEvent) => void
    boundOnPointerMove: (e: PointerEvent) => void
    boundOnPointerUp: (e: PointerEvent) => void
    boundUpdate: () => void

    constructor(
        container: HTMLElement,
        options: {
            items?: GalleryItem[]
            bend: number
            distortion?: number
            textColor: string
            fontSize?: number
            fontWeight?: string
            fontFamily?: string
            borderRadius: number
            scrollSpeed: number
            scrollEase: number
            preventPageScroll?: boolean
        }
    ) {
        this.container = container
        const {
            items = [],
            bend,
            distortion = 0.5,
            textColor,
            fontSize = 30,
            fontWeight = "bold",
            fontFamily = "sans-serif",
            borderRadius = 16,
            scrollSpeed,
            scrollEase,
            preventPageScroll = false,
        } = options

        this.reducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const computedFont = `${fontWeight} ${fontSize}px ${fontFamily}`
        this.config = {
            bend,
            distortion: this.reducedMotion ? 0 : distortion,
            borderRadius,
            scrollSpeed,
            // Near-instant ease when reduced motion is preferred
            scrollEase: this.reducedMotion ? 0.85 : scrollEase,
            textColor,
            fontSize,
            fontWeight,
            fontFamily,
            font: computedFont,
            preventPageScroll,
        }

        this.scroll = {
            ease: this.config.scrollEase,
            current: 0,
            target: 0,
            last: 0,
            position: 0,
        }

        this.onCheckDebounce = debounce(this.onCheck.bind(this), 200)

        this.boundOnResize = this.onResize.bind(this)
        this.boundOnWheel = this.onWheel.bind(this)
        this.boundOnPointerDown = this.onPointerDown.bind(this)
        this.boundOnPointerMove = this.onPointerMove.bind(this)
        this.boundOnPointerUp = this.onPointerUp.bind(this)
        this.boundUpdate = this.update.bind(this)

        this.createRenderer()
        this.createCamera()
        this.createScene()
        this.onResize()
        this.createGeometry()
        this.createMedias(items)
        this.addEventListeners()
    }

    createRenderer() {
        const dpr =
            typeof window !== "undefined"
                ? Math.min(window.devicePixelRatio || 1, 1.5)
                : 1

        this.renderer = new Renderer({
            alpha: true,
            antialias: true,
            dpr,
        })
        this.gl = this.renderer.gl
        this.gl.clearColor(0, 0, 0, 0)

        this.gl.canvas.style.display = "block"
        this.gl.canvas.style.width = "100%"
        this.gl.canvas.style.height = "100%"

        this.container.appendChild(this.gl.canvas)
    }

    createCamera() {
        this.camera = new Camera(this.gl)
        this.camera.fov = 45
        this.camera.position.z = 20
    }

    createScene() {
        this.scene = new Transform()
    }

    createGeometry() {
        this.planeGeometry = new Plane(this.gl, {
            heightSegments: 16,
            widthSegments: 40,
        })
    }

    createMedias(items: GalleryItem[]) {
        if (!items || items.length === 0) return

        const safeItems = items.slice(0, MAX_ITEMS)
        this.mediasImages = [...safeItems, ...safeItems]

        this.medias = this.mediasImages.map((data, index) => {
            return new Media({
                geometry: this.planeGeometry,
                gl: this.gl,
                image: data.image,
                index,
                length: this.mediasImages.length,
                scene: this.scene,
                screen: this.screen,
                text: data.text,
                viewport: this.viewport,
                bend: this.config.bend,
                distortion: this.config.distortion,
                textColor: this.config.textColor,
                borderRadius: this.config.borderRadius,
                font: this.config.font,
            })
        })
    }

    updateItems(items: GalleryItem[]) {
        this.medias.forEach((m) => m.destroy())
        this.medias = []
        this.createMedias(items)
        this.scroll.current = 0
        this.scroll.target = 0
        this.scroll.last = 0
        this.scroll.position = 0
        this.onResize()
    }

    updateConfig(cfg: any) {
        const prevPrevent = this.config.preventPageScroll
        const computedFont = `${cfg.fontWeight} ${cfg.fontSize}px ${cfg.fontFamily}`

        this.config = {
            ...this.config,
            ...cfg,
            distortion: this.reducedMotion ? 0 : cfg.distortion,
            scrollEase: this.reducedMotion ? 0.85 : cfg.scrollEase,
            font: computedFont,
        }

        this.scroll.ease = this.config.scrollEase

        if (prevPrevent !== cfg.preventPageScroll) {
            this.updateWheelListener()
        }

        this.medias.forEach((media) => {
            media.updateConfig({
                bend: this.config.bend,
                distortion: this.config.distortion,
                borderRadius: this.config.borderRadius,
                textColor: this.config.textColor,
                font: computedFont,
            })
        })
    }

    updateWheelListener() {
        this.container.removeEventListener("wheel", this.boundOnWheel)
        this.container.addEventListener("wheel", this.boundOnWheel, {
            passive: !this.config.preventPageScroll,
        })
    }

    onPointerDown(e: PointerEvent) {
        if (this.medias.length === 0) return
        this.isDown = true
        this.scroll.position = this.scroll.current
        this.start = e.clientX
        this.container.style.cursor = "grabbing"
        try {
            this.container.setPointerCapture(e.pointerId)
        } catch {}
    }

    onPointerMove(e: PointerEvent) {
        if (!this.isDown) return
        const distance =
            (this.start - e.clientX) * (this.config.scrollSpeed * 0.025)
        this.scroll.target = this.scroll.position + distance
    }

    onPointerUp(e: PointerEvent) {
        if (!this.isDown) return
        this.isDown = false
        this.container.style.cursor = "grab"
        try {
            this.container.releasePointerCapture(e.pointerId)
        } catch {}
        this.onCheck()
    }

    onWheel(e: WheelEvent) {
        if (this.medias.length === 0) return
        if (this.config.preventPageScroll) e.preventDefault()

        const deltaX = e.deltaX || 0
        const deltaY = e.deltaY || 0
        const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY

        this.scroll.target += delta * this.config.scrollSpeed * 0.01
        this.onCheckDebounce()
    }

    onCheck() {
        if (!this.medias?.[0]) return
        const width = this.medias[0].width
        if (!width || width <= 0) return
        const itemIndex = Math.round(Math.abs(this.scroll.target) / width)
        const item = width * itemIndex
        this.scroll.target = this.scroll.target < 0 ? -item : item
    }

    navigate(direction: "prev" | "next") {
        if (!this.medias?.[0]) return
        const width = this.medias[0].width
        if (!width || width <= 0) return
        this.scroll.target += direction === "next" ? width : -width
        this.onCheck()
    }

    onResize() {
        if (!this.container) return
        this.screen = {
            width: this.container.clientWidth || 300,
            height: this.container.clientHeight || 300,
        }
        this.renderer.setSize(this.screen.width, this.screen.height)
        this.camera.perspective({
            aspect: this.screen.width / this.screen.height,
        })
        const fov = (this.camera.fov * Math.PI) / 180
        const height = 2 * Math.tan(fov / 2) * this.camera.position.z
        const width = height * this.camera.aspect
        this.viewport = { width, height }

        this.medias.forEach((media) =>
            media.onResize({ screen: this.screen, viewport: this.viewport })
        )
    }

    setVisibility(visible: boolean) {
        this.isVisible = visible
        if (visible && !this.isRunning) this.startLoop()
        else if (!visible && this.isRunning) this.stopLoop()
    }

    startLoop() {
        if (this.isRunning) return
        this.isRunning = true
        if (typeof window !== "undefined") {
            this.raf = window.requestAnimationFrame(this.boundUpdate)
        }
    }

    stopLoop() {
        this.isRunning = false
        this.lastFrameTime = 0
        if (this.raf && typeof window !== "undefined") {
            window.cancelAnimationFrame(this.raf)
            this.raf = 0
        }
    }

    update() {
        if (!this.isRunning || !this.isVisible) return

        const now = performance.now()
        if (!this.lastFrameTime) this.lastFrameTime = now
        const delta = Math.min((now - this.lastFrameTime) / 1000, 0.05)
        this.lastFrameTime = now
        this.time += delta * 2.5

        this.scroll.current = lerp(
            this.scroll.current,
            this.scroll.target,
            this.scroll.ease
        )
        const diff = this.scroll.current - this.scroll.last
        const speed = Math.abs(diff)
        const direction: "right" | "left" | "none" =
            diff > 0.0001 ? "right" : diff < -0.0001 ? "left" : "none"

        this.medias.forEach((media) =>
            media.update(this.scroll, direction, this.time, speed)
        )

        this.renderer.render({ scene: this.scene, camera: this.camera })
        this.scroll.last = this.scroll.current

        if (typeof window !== "undefined") {
            this.raf = window.requestAnimationFrame(this.boundUpdate)
        }
    }

    addEventListeners() {
        if (typeof window === "undefined" || !this.container) return

        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(() => this.onResize())
            this.resizeObserver.observe(this.container)
        }

        this.updateWheelListener()
        this.container.addEventListener("pointerdown", this.boundOnPointerDown)
        this.container.addEventListener("pointermove", this.boundOnPointerMove)
        this.container.addEventListener("pointerup", this.boundOnPointerUp)
        this.container.addEventListener("pointercancel", this.boundOnPointerUp)
    }

    destroy() {
        this.stopLoop()
        this.onCheckDebounce.cancel()

        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }

        if (this.container) {
            this.container.removeEventListener("wheel", this.boundOnWheel)
            this.container.removeEventListener(
                "pointerdown",
                this.boundOnPointerDown
            )
            this.container.removeEventListener(
                "pointermove",
                this.boundOnPointerMove
            )
            this.container.removeEventListener(
                "pointerup",
                this.boundOnPointerUp
            )
            this.container.removeEventListener(
                "pointercancel",
                this.boundOnPointerUp
            )
        }

        this.medias.forEach((m) => m.destroy())
        this.medias = []

        if (this.planeGeometry) this.planeGeometry.remove()

        if (this.renderer?.gl?.canvas?.parentNode) {
            this.renderer.gl.canvas.parentNode.removeChild(
                this.renderer.gl.canvas
            )
        }
    }
}

/* --------------------------------
 * Static Fallback Card
 ----------------------------------- */
function StaticCardFallback({
    item,
    idx,
    transform,
    zIndex,
    opacity,
    textColor,
    fontSize,
    fontWeight,
    fontFamily,
    borderRadius,
}: {
    item: GalleryItem
    idx: number
    transform: string
    zIndex: number
    opacity: number
    textColor: string
    fontSize: number
    fontWeight: string
    fontFamily: string
    borderRadius: number
}) {
    const [imgFailed, setImgFailed] = useState(false)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform,
                opacity,
                zIndex,
            }}
        >
            <div
                style={{
                    width: 210,
                    height: 270,
                    borderRadius: Math.max(0, borderRadius),
                    overflow: "hidden",
                    background:
                        "linear-gradient(145deg, #2a2d32 0%, #17181c 100%)",
                    position: "relative",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {item.image && !imgFailed ? (
                    <img
                        src={item.image}
                        alt={item.text || `Gallery item ${idx + 1}`}
                        draggable={false}
                        onError={() => setImgFailed(true)}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <div style={{ opacity: 0.6 }}>
                        <svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
            </div>
            <span
                style={{
                    marginTop: 14,
                    color: textColor,
                    fontSize: Math.min(fontSize, 22),
                    fontWeight,
                    fontFamily,
                    textAlign: "center",
                }}
            >
                {item.text}
            </span>
        </div>
    )
}

/* --------------------------------
 * Main Component
 ----------------------------------- */
export default function CircularGallery(props: CircularGalleryProps) {
    const {
        items = DEFAULT_GALLERY_ITEMS,
        backgroundColor = "#0d0d0d",
        bend = 3,
        distortion = 0.5,
        borderRadius = 16,
        scrollSpeed = 2,
        scrollEase = 0.05,
        preventPageScroll = false,
        showArrows = true,
        arrowColor = "#ffffff",
        arrowBgColor = "#262626",
        textColor = "#ffffff",
        fontSize = 30,
        fontWeight = "bold",
        fontFamily = "sans-serif",
        customFontFamily = "",
        ariaLabel = "3D Circular Gallery",
        style,
        className,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<App | null>(null)
    const prevItemsKeyRef = useRef("")
    const isStatic = useIsStaticRenderer()

    const [webglError, setWebglError] = useState(false)
    const [prevFocused, setPrevFocused] = useState(false)
    const [nextFocused, setNextFocused] = useState(false)

    const safeItems = useMemo(() => {
        const source = items && items.length > 0 ? items : DEFAULT_GALLERY_ITEMS
        return source
            .filter(Boolean)
            .slice(0, MAX_ITEMS)
            .map((item, idx) => ({
                image: item?.image || "",
                text: item?.text || `Gallery Item ${idx + 1}`,
            }))
    }, [items])

    const hasItems = safeItems.length > 0
    const activeFontFamily =
        fontFamily === "custom" && customFontFamily.trim() !== ""
            ? customFontFamily
            : fontFamily === "custom"
              ? "sans-serif"
              : fontFamily

    // Initialization – intentionally limited dependencies
    useEffect(() => {
        if (isStatic || !containerRef.current || !hasItems) return

        let observer: IntersectionObserver | null = null
        let appInstance: App | null = null
        let destroyed = false

        const initApp = () => {
            if (appInstance || destroyed || !containerRef.current) return

            setWebglError(false)

            try {
                appInstance = new App(containerRef.current, {
                    items: safeItems,
                    bend,
                    distortion,
                    textColor,
                    fontSize,
                    fontWeight,
                    fontFamily: activeFontFamily,
                    borderRadius,
                    scrollSpeed,
                    scrollEase,
                    preventPageScroll,
                })
                appRef.current = appInstance
                prevItemsKeyRef.current = JSON.stringify(safeItems)
            } catch (err) {
                console.error("CircularGallery WebGL init failed:", err)
                setWebglError(true)
            }
        }

        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        initApp()
                        appInstance?.setVisibility(true)
                    } else {
                        appInstance?.setVisibility(false)
                    }
                },
                { threshold: 0.01, rootMargin: "200px" }
            )
            observer.observe(containerRef.current)
        } else {
            initApp()
            appInstance?.setVisibility(true)
        }

        return () => {
            destroyed = true
            if (observer) observer.disconnect()
            if (appInstance) appInstance.destroy()
            appRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, hasItems])

    // Item content updates
    useEffect(() => {
        if (!appRef.current) return
        const key = JSON.stringify(safeItems)
        if (prevItemsKeyRef.current !== key) {
            prevItemsKeyRef.current = key
            appRef.current.updateItems(safeItems)
        }
    }, [safeItems])

    // Runtime config updates
    useEffect(() => {
        if (appRef.current) {
            appRef.current.updateConfig({
                bend,
                distortion,
                borderRadius,
                scrollSpeed,
                scrollEase,
                textColor,
                fontSize,
                fontWeight,
                fontFamily: activeFontFamily,
                preventPageScroll,
            })
        }
    }, [
        bend,
        distortion,
        borderRadius,
        scrollSpeed,
        scrollEase,
        textColor,
        fontSize,
        fontWeight,
        activeFontFamily,
        preventPageScroll,
    ])

    const handlePrev = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        appRef.current?.navigate("prev")
    }, [])

    const handleNext = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        appRef.current?.navigate("next")
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            appRef.current?.navigate("prev")
        }
        if (e.key === "ArrowRight") {
            e.preventDefault()
            appRef.current?.navigate("next")
        }
    }, [])

    // Static renderer
    if (isStatic) {
        const previewItems = safeItems.slice(0, 3)
        return (
            <div
                role="region"
                aria-roledescription="carousel"
                aria-label={ariaLabel}
                className={className}
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor,
                    ...style,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        padding: 32,
                    }}
                >
                    {previewItems.map((item, idx) => {
                        const isCenter = idx === 1 || previewItems.length === 1
                        const isLeft = idx === 0 && previewItems.length > 1
                        const isRight = idx === 2

                        let transform = "scale(1)"
                        let zIndex = 1
                        let opacity = 1

                        if (isCenter) {
                            transform = "scale(1.05)"
                            zIndex = 10
                        } else if (isLeft) {
                            const rotation = Math.min(
                                Math.max(bend * 2, -15),
                                15
                            )
                            transform = `translateX(15%) translateY(${Math.abs(bend) * 2}%) rotate(${-rotation}deg) scale(0.9)`
                            opacity = 0.75
                        } else if (isRight) {
                            const rotation = Math.min(
                                Math.max(bend * 2, -15),
                                15
                            )
                            transform = `translateX(-15%) translateY(${Math.abs(bend) * 2}%) rotate(${rotation}deg) scale(0.9)`
                            opacity = 0.75
                        }

                        return (
                            <StaticCardFallback
                                key={idx}
                                item={item}
                                idx={idx}
                                transform={transform}
                                zIndex={zIndex}
                                opacity={opacity}
                                textColor={textColor}
                                fontSize={fontSize}
                                fontWeight={fontWeight}
                                fontFamily={activeFontFamily}
                                borderRadius={borderRadius}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }

    // Error fallback
    if (webglError) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor,
                    color: textColor,
                    fontFamily: activeFontFamily,
                    fontSize: 14,
                    opacity: 0.7,
                    ...style,
                }}
                className={className}
            >
                3D Gallery unavailable
            </div>
        )
    }

    // Live component
    return (
        <div
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                ...style,
            }}
            className={className}
        >
            {/* Scoped styles for arrow hover (no imperative DOM mutation) */}
            <style>{`
                .cg-arrow {
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .cg-arrow:hover {
                    transform: translateY(-50%) scale(1.08) !important;
                }
                .cg-arrow:focus-visible {
                    outline: none;
                }
            `}</style>

            <div
                ref={containerRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    cursor: "grab",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    touchAction: "pan-y",
                    outline: "none",
                }}
            >
                {!hasItems && (
                    <div
                        style={{
                            color: textColor,
                            fontSize: 14,
                            opacity: 0.6,
                            fontFamily: activeFontFamily,
                        }}
                    >
                        Add items in the properties panel
                    </div>
                )}

                {hasItems && (
                    <ul
                        aria-label={`${ariaLabel} items`}
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            padding: 0,
                            margin: -1,
                            overflow: "hidden",
                            clip: "rect(0, 0, 0, 0)",
                            whiteSpace: "nowrap",
                            border: 0,
                        }}
                    >
                        {safeItems.map((item, index) => (
                            <li key={`${item.text}-${index}`}>{item.text}</li>
                        ))}
                    </ul>
                )}
            </div>

            {showArrows && hasItems && (
                <>
                    <button
                        type="button"
                        className="cg-arrow"
                        onClick={handlePrev}
                        onFocus={() => setPrevFocused(true)}
                        onBlur={() => setPrevFocused(false)}
                        aria-label="Previous gallery item"
                        style={{
                            position: "absolute",
                            left: 24,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: arrowBgColor,
                            color: arrowColor,
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            boxShadow: prevFocused
                                ? `0 0 0 3px ${arrowColor}40`
                                : "0 4px 12px rgba(0,0,0,0.15)",
                            outline: "none",
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <button
                        type="button"
                        className="cg-arrow"
                        onClick={handleNext}
                        onFocus={() => setNextFocused(true)}
                        onBlur={() => setNextFocused(false)}
                        aria-label="Next gallery item"
                        style={{
                            position: "absolute",
                            right: 24,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: arrowBgColor,
                            color: arrowColor,
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            boxShadow: nextFocused
                                ? `0 0 0 3px ${arrowColor}40`
                                : "0 4px 12px rgba(0,0,0,0.15)",
                            outline: "none",
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    )
}

CircularGallery.defaultProps = {
    items: DEFAULT_GALLERY_ITEMS,
    backgroundColor: "#0d0d0d",
    bend: 3,
    distortion: 0.5,
    borderRadius: 16,
    scrollSpeed: 2,
    scrollEase: 0.05,
    preventPageScroll: false,
    showArrows: true,
    arrowColor: "#ffffff",
    arrowBgColor: "#262626",
    textColor: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    fontFamily: "sans-serif",
    customFontFamily: "",
    ariaLabel: "3D Circular Gallery",
}

/* --------------------------------
 * Property Controls
 ----------------------------------- */
addPropertyControls(CircularGallery, {
    items: {
        type: ControlType.Array,
        title: "Items",
        description: `Gallery images + titles (max ${MAX_ITEMS} for performance)`,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                text: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Gallery Item",
                },
            },
        },
        defaultValue: DEFAULT_GALLERY_ITEMS,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0d0d0d",
    },
    bend: {
        type: ControlType.Number,
        title: "Curvature",
        description: "Horizontal bend of the gallery",
        defaultValue: 3,
        min: -10,
        max: 10,
        step: 0.1,
        displayStepper: true,
    },
    distortion: {
        type: ControlType.Number,
        title: "Distortion",
        description:
            "Wave distortion while scrolling (disabled with reduced motion)",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.05,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#ffffff",
        hidden: (props) => !props.showArrows,
    },
    arrowBgColor: {
        type: ControlType.Color,
        title: "Arrow BG",
        defaultValue: "#262626",
        hidden: (props) => !props.showArrows,
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        displayStepper: true,
    },
    scrollEase: {
        type: ControlType.Number,
        title: "Scroll Smoothness",
        description: "Lower = smoother inertia (overridden by reduced motion)",
        defaultValue: 0.05,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        displayStepper: true,
    },
    preventPageScroll: {
        type: ControlType.Boolean,
        title: "Lock Page Scroll",
        description:
            "Prevent page scrolling while interacting with the gallery",
        defaultValue: false,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    fontFamily: {
        type: ControlType.Enum,
        title: "Font Family",
        options: [
            "sans-serif",
            "serif",
            "monospace",
            "Inter, sans-serif",
            "Playfair Display, serif",
            "Plus Jakarta Sans, sans-serif",
            "custom",
        ],
        optionTitles: [
            "Sans-Serif",
            "Serif",
            "Monospace",
            "Inter",
            "Playfair Display",
            "Plus Jakarta Sans",
            "Custom...",
        ],
        defaultValue: "sans-serif",
    },
    customFontFamily: {
        type: ControlType.String,
        title: "Custom Font",
        description:
            "CSS font-family name. The font must already be loaded on the page.",
        defaultValue: "",
        hidden: (props) => props.fontFamily !== "custom",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 30,
        min: 12,
        max: 80,
        step: 1,
        displayStepper: true,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: ["normal", "500", "bold", "900"],
        optionTitles: ["Regular", "Medium", "Bold", "Black"],
        defaultValue: "bold",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "3D Circular Gallery",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
