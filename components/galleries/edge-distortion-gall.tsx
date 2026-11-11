import * as React from "react"
import * as THREE from "three"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Made with 💛 by Karim Saif

const DEFAULT_IMAGES = [
    "https://i.pinimg.com/736x/aa/07/71/aa0771966b0d5b5060bf2c658c04b189.jpg",
    "https://i.pinimg.com/736x/c7/ce/94/c7ce943d488adaed5d08095d47561eb6.jpg",
    "https://i.pinimg.com/1200x/f6/39/84/f63984b0872a25e95bcadbe3bda3a275.jpg",
    "https://i.pinimg.com/236x/5d/7d/c4/5d7dc470354274887e4bfaf684906d0f.jpg",
    "https://i.pinimg.com/1200x/1b/06/4f/1b064f821cccc5aad2fb6adbd8325fad.jpg",
    "https://i.pinimg.com/736x/f6/7b/c8/f67bc8f81a69fef994f5d44d29fca451.jpg",
]

type GalleryProps = {
    images: string[]
    backgroundColor: string
    columns: number
    rows: number
    cardWidth: number
    cardHeight: number
    gapX: number
    gapY: number
    cornerRadius: number
    distortion: number
    chromatic: number
    edgeStart: number
    driftX: number
    driftY: number
    dragSpeed: number
    inertia: number
    zoom: number
    autoDrift: boolean
    enableDrag: boolean
    touchDrag: boolean
    paused: boolean
    maxDpr: number
    maxTextureSize: number
    style?: React.CSSProperties
}

type GalleryEngine = {
    render: () => void
    resize: () => void
    dispose: () => void
    setActive: (active: boolean) => void
    setPaused: (paused: boolean) => void
    setReducedMotion: (reduced: boolean) => void
    pointerDown: (event: PointerEvent) => void
    pointerMove: (event: PointerEvent) => void
    pointerUp: (event: PointerEvent) => void
    isDragging: () => boolean
}

const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform sampler2D tDiffuse;
uniform float uDistortion;
uniform float uChromatic;
uniform float uEdgeStart;
uniform vec3 uBackground;

varying vec2 vUv;

void main() {
    vec2 pos = vUv * 2.0 - 1.0;

    float r = max(abs(pos.x), abs(pos.y));

    float edgeStrength = smoothstep(
        uEdgeStart,
        1.05,
        r
    );

    float k = uDistortion * edgeStrength;

    vec2 distortedPos =
        pos / (1.0 + k * r * r);

    vec2 warpUv = distortedPos * 0.5 + 0.5;

    vec2 direction =
        pos / max(length(pos), 0.00001);

    vec2 offset =
        direction * uChromatic * edgeStrength;

    vec2 redUV = warpUv + offset;
    vec2 greenUV = warpUv;
    vec2 blueUV = warpUv - offset;

    vec3 result = vec3(
        texture2D(
            tDiffuse,
            clamp(redUV, 0.0, 1.0)
        ).r,
        texture2D(
            tDiffuse,
            clamp(greenUV, 0.0, 1.0)
        ).g,
        texture2D(
            tDiffuse,
            clamp(blueUV, 0.0, 1.0)
        ).b
    );

    float inside =
        step(0.0, redUV.x) *
        step(redUV.x, 1.0) *
        step(0.0, redUV.y) *
        step(redUV.y, 1.0);

    gl_FragColor = vec4(
        mix(uBackground, result, inside),
        1.0
    );
}
`

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(maximum, Math.max(minimum, value))
}

function wrap(value: number, period: number) {
    if (period <= 0) return value

    return ((((value + period / 2) % period) + period) % period) - period / 2
}

function normalizeImage(url: string) {
    if (!url) return ""

    if (url.includes("i.pinimg.com/") && !url.includes("wsrv.nl")) {
        return "https://wsrv.nl/?url=" + encodeURIComponent(url)
    }

    return url
}

function makeMask(cardWidth: number, cardHeight: number, radius: number) {
    const canvas = document.createElement("canvas")

    const w = 512
    const h = Math.max(1, Math.round((512 * cardHeight) / cardWidth))

    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d")

    if (!ctx) return null

    const r = clamp((radius / cardWidth) * w, 0, Math.min(w, h) / 2)

    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = "#ffffff"

    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(w - r, 0)
    ctx.quadraticCurveTo(w, 0, w, r)
    ctx.lineTo(w, h - r)
    ctx.quadraticCurveTo(w, h, w - r, h)
    ctx.lineTo(r, h)
    ctx.quadraticCurveTo(0, h, 0, h - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
    ctx.fill()

    const texture = new THREE.CanvasTexture(canvas)

    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false

    return texture
}

function makePlaceholder(index: number) {
    const canvas = document.createElement("canvas")

    canvas.width = 256
    canvas.height = 320

    const ctx = canvas.getContext("2d")

    const colors = [
        "#D9D0C5",
        "#B9C8D4",
        "#D9BDB4",
        "#BBC8B5",
        "#C9BFD5",
        "#C8C0B0",
    ]

    if (ctx) {
        ctx.fillStyle = colors[index % colors.length]
        ctx.fillRect(0, 0, 256, 320)

        ctx.fillStyle = "rgba(255,255,255,0.24)"
        ctx.beginPath()
        ctx.arc(128, 130, 80, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "rgba(0,0,0,0.06)"
        ctx.fillRect(35, 245, 186, 2)
    }

    const texture = new THREE.CanvasTexture(canvas)

    texture.colorSpace = THREE.SRGBColorSpace

    return texture
}

function prepareImage(image: HTMLImageElement, maxSize: number) {
    const sourceWidth = image.naturalWidth || image.width

    const sourceHeight = image.naturalHeight || image.height

    const longest = Math.max(sourceWidth, sourceHeight)

    const scale = Math.min(1, maxSize / Math.max(1, longest))

    const width = Math.max(1, Math.round(sourceWidth * scale))

    const height = Math.max(1, Math.round(sourceHeight * scale))

    const canvas = document.createElement("canvas")

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")

    if (!ctx) return null

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    ctx.drawImage(image, 0, 0, width, height)

    return canvas
}

function applyCover(
    texture: THREE.Texture,
    imageWidth: number,
    imageHeight: number,
    cardWidth: number,
    cardHeight: number
) {
    const imageAspect = imageWidth / imageHeight
    const cardAspect = cardWidth / cardHeight

    let repeatX = 1
    let repeatY = 1

    if (imageAspect > cardAspect) {
        repeatX = cardAspect / imageAspect
    } else {
        repeatY = imageAspect / cardAspect
    }

    texture.repeat.set(repeatX, repeatY)

    texture.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2)

    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    texture.needsUpdate = true
}

function createEngine(
    canvas: HTMLCanvasElement,
    container: HTMLDivElement,
    props: GalleryProps,
    onFailure: () => void
): GalleryEngine | null {
    let renderer: THREE.WebGLRenderer

    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,
            alpha: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
        })
    } catch {
        return null
    }

    const {
        images,
        backgroundColor,
        columns,
        rows,
        cardWidth,
        cardHeight,
        gapX,
        gapY,
        cornerRadius,
        distortion,
        chromatic,
        edgeStart,
        driftX,
        driftY,
        dragSpeed,
        inertia,
        zoom,
        autoDrift,
        enableDrag,
        touchDrag,
        maxDpr,
        maxTextureSize,
    } = props

    const scene = new THREE.Scene()

    const background = new THREE.Color(backgroundColor)

    scene.background = background

    const camera = new THREE.OrthographicCamera(
        -1000,
        1000,
        1000,
        -1000,
        -1000,
        1000
    )

    camera.position.z = 100

    const target = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        depthBuffer: false,
        stencilBuffer: false,
    })

    const postScene = new THREE.Scene()

    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const postMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            tDiffuse: {
                value: target.texture,
            },
            uDistortion: {
                value: distortion,
            },
            uChromatic: {
                value: chromatic,
            },
            uEdgeStart: {
                value: edgeStart,
            },
            uBackground: {
                value: background.clone(),
            },
        },
        depthTest: false,
        depthWrite: false,
    })

    const postGeometry = new THREE.PlaneGeometry(2, 2)

    const postQuad = new THREE.Mesh(postGeometry, postMaterial)

    postScene.add(postQuad)

    const width = Math.max(1, cardWidth)
    const height = Math.max(1, cardHeight)

    const stepX = width + Math.max(0, gapX)
    const stepY = height + Math.max(0, gapY)

    const requestedColumns = Math.max(2, Math.round(columns))

    const requestedRows = Math.max(2, Math.round(rows))

    const geometry = new THREE.PlaneGeometry(width, height)

    const mask = makeMask(width, height, cornerRadius)

    const sourceImages =
        images && images.filter(Boolean).length
            ? images.filter(Boolean)
            : DEFAULT_IMAGES

    const textures: THREE.Texture[] = []
    const materials: THREE.MeshBasicMaterial[] = []

    const textureEntries = sourceImages.map((_, index) => {
        const texture = makePlaceholder(index)

        textures.push(texture)

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            alphaMap: mask || undefined,
            transparent: true,
            alphaTest: 0.1,
            depthWrite: false,
            side: THREE.DoubleSide,
        })

        materials.push(material)

        return {
            texture,
            material,
        }
    })

    const cards: THREE.Mesh[] = []

    let actualColumns = requestedColumns
    let actualRows = requestedRows

    let periodX = actualColumns * stepX
    let periodY = actualRows * stepY

    let viewWidth = 1
    let viewHeight = 1

    let offsetX = 0
    let offsetY = 0

    let velocityX = 0
    let velocityY = 0

    let dragging = false
    let pointerId: number | null = null

    let lastPointerX = 0
    let lastPointerY = 0

    let active = true
    let paused = props.paused
    let reducedMotion = false

    let disposed = false
    let contextLost = false

    let frame = 0
    let lastTime = 0

    const buildGrid = () => {
        cards.forEach((card) => {
            scene.remove(card)
        })

        cards.length = 0

        periodX = actualColumns * stepX
        periodY = actualRows * stepY

        for (let y = 0; y < actualRows; y++) {
            for (let x = 0; x < actualColumns; x++) {
                const index = y * actualColumns + x

                const material =
                    textureEntries[index % textureEntries.length].material

                const card = new THREE.Mesh(geometry, material)

                card.userData.gridX = x
                card.userData.gridY = y

                scene.add(card)
                cards.push(card)
            }
        }
    }

    const updateCards = () => {
        const centerX = (actualColumns - 1) / 2
        const centerY = (actualRows - 1) / 2

        cards.forEach((card) => {
            const x = card.userData.gridX as number
            const y = card.userData.gridY as number

            const baseX = (x - centerX) * stepX

            const baseY = (centerY - y) * stepY

            card.position.x = wrap(baseX + offsetX, periodX)

            card.position.y = wrap(baseY + offsetY, periodY)
        })
    }

    const render = () => {
        if (disposed || contextLost || !active) {
            return
        }

        updateCards()

        try {
            renderer.setRenderTarget(target)
            renderer.clear()
            renderer.render(scene, camera)

            renderer.setRenderTarget(null)
            renderer.render(postScene, postCamera)
        } catch {
            onFailure()
        }
    }

    const resize = () => {
        if (disposed || contextLost) return

        const rect = container.getBoundingClientRect()

        const pixelWidth = Math.max(1, rect.width)
        const pixelHeight = Math.max(1, rect.height)

        const dpr = Math.min(window.devicePixelRatio || 1, clamp(maxDpr, 1, 2))

        renderer.setPixelRatio(dpr)

        renderer.setSize(pixelWidth, pixelHeight, false)

        target.setSize(
            Math.max(1, Math.round(pixelWidth * dpr)),
            Math.max(1, Math.round(pixelHeight * dpr))
        )

        viewHeight = 2000 / Math.max(0.1, zoom)

        viewWidth = (viewHeight * pixelWidth) / pixelHeight

        camera.left = -viewWidth / 2
        camera.right = viewWidth / 2
        camera.top = viewHeight / 2
        camera.bottom = -viewHeight / 2

        camera.updateProjectionMatrix()

        const warpOverscan = 1 + Math.max(0, distortion) * 0.7

        const requiredColumns =
            Math.ceil((viewWidth * warpOverscan) / stepX) + 3

        const requiredRows = Math.ceil((viewHeight * warpOverscan) / stepY) + 3

        const nextColumns = Math.max(requestedColumns, requiredColumns)

        const nextRows = Math.max(requestedRows, requiredRows)

        if (
            nextColumns !== actualColumns ||
            nextRows !== actualRows ||
            cards.length === 0
        ) {
            actualColumns = nextColumns
            actualRows = nextRows

            buildGrid()
        }

        render()
    }

    const stop = () => {
        if (frame) {
            cancelAnimationFrame(frame)
            frame = 0
        }

        lastTime = 0
    }

    const shouldAnimate = () => {
        if (
            disposed ||
            contextLost ||
            !active ||
            paused ||
            reducedMotion ||
            document.hidden
        ) {
            return false
        }

        return (
            autoDrift ||
            Math.abs(velocityX) > 0.005 ||
            Math.abs(velocityY) > 0.005
        )
    }

    const animate = (time: number) => {
        frame = 0

        if (!shouldAnimate()) return

        const delta = lastTime
            ? Math.min(0.05, (time - lastTime) / 1000)
            : 1 / 60

        lastTime = time

        if (!dragging) {
            const friction = Math.pow(clamp(inertia, 0, 0.99), delta * 60)

            offsetX += velocityX * delta * 60
            offsetY += velocityY * delta * 60

            velocityX *= friction
            velocityY *= friction

            if (autoDrift) {
                offsetX += driftX * delta * 60
                offsetY += driftY * delta * 60
            }
        }

        render()

        if (shouldAnimate()) {
            frame = requestAnimationFrame(animate)
        }
    }

    const start = () => {
        if (disposed || contextLost) return

        if (frame) return

        lastTime = 0

        if (shouldAnimate()) {
            frame = requestAnimationFrame(animate)
        } else {
            render()
        }
    }

    const pointerDown = (event: PointerEvent) => {
        if (!enableDrag || paused || !active) {
            return
        }

        if (event.pointerType === "touch" && !touchDrag) {
            return
        }

        if (event.pointerType === "mouse" && event.button !== 0) {
            return
        }

        pointerId = event.pointerId
        dragging = true

        lastPointerX = event.clientX
        lastPointerY = event.clientY

        velocityX = 0
        velocityY = 0

        try {
            canvas.setPointerCapture(event.pointerId)
        } catch {}
    }

    const pointerMove = (event: PointerEvent) => {
        if (!dragging || pointerId !== event.pointerId) {
            return
        }

        const dx = event.clientX - lastPointerX
        const dy = event.clientY - lastPointerY

        lastPointerX = event.clientX
        lastPointerY = event.clientY

        const factor =
            (viewHeight / Math.max(1, container.clientHeight)) * dragSpeed

        const movementX = dx * factor
        const movementY = -dy * factor

        offsetX += movementX
        offsetY += movementY

        velocityX = movementX
        velocityY = movementY

        render()
    }

    const pointerUp = (event: PointerEvent) => {
        if (pointerId !== event.pointerId) return

        pointerId = null
        dragging = false

        try {
            if (canvas.hasPointerCapture(event.pointerId)) {
                canvas.releasePointerCapture(event.pointerId)
            }
        } catch {}

        if (reducedMotion) {
            velocityX = 0
            velocityY = 0
        }

        start()
    }

    const setActive = (value: boolean) => {
        active = value

        if (active) {
            resize()
            start()
        } else {
            stop()
        }
    }

    const setPaused = (value: boolean) => {
        paused = value

        if (paused) {
            velocityX = 0
            velocityY = 0
            dragging = false
            pointerId = null
            stop()
            render()
        } else {
            start()
        }
    }

    const setReducedMotion = (value: boolean) => {
        reducedMotion = value

        if (reducedMotion) {
            velocityX = 0
            velocityY = 0
            stop()
            render()
        } else {
            start()
        }
    }

    const handleContextLost = (event: Event) => {
        event.preventDefault()

        contextLost = true
        stop()
        onFailure()
    }

    canvas.addEventListener("webglcontextlost", handleContextLost, false)

    const imageElements: HTMLImageElement[] = []

    sourceImages.forEach((source, index) => {
        const url = normalizeImage(source)

        if (!url) return

        const image = new Image()

        image.crossOrigin = "anonymous"
        image.decoding = "async"

        image.onload = () => {
            if (disposed || contextLost) return

            try {
                const prepared = prepareImage(
                    image,
                    Math.max(256, maxTextureSize)
                )

                if (!prepared) return

                const texture = new THREE.CanvasTexture(prepared)

                texture.colorSpace = THREE.SRGBColorSpace

                texture.minFilter = THREE.LinearMipmapLinearFilter

                texture.magFilter = THREE.LinearFilter

                texture.generateMipmaps = true

                applyCover(
                    texture,
                    prepared.width,
                    prepared.height,
                    width,
                    height
                )

                textures.push(texture)

                textureEntries[index].material.map = texture

                textureEntries[index].material.needsUpdate = true

                render()
            } catch {}
        }

        image.onerror = () => {}

        image.src = url

        imageElements.push(image)
    })

    resize()

    const dispose = () => {
        if (disposed) return

        disposed = true
        stop()

        canvas.removeEventListener("webglcontextlost", handleContextLost)

        imageElements.forEach((image) => {
            image.onload = null
            image.onerror = null
            image.src = ""
        })

        cards.forEach((card) => {
            scene.remove(card)
        })

        cards.length = 0

        geometry.dispose()
        mask?.dispose()

        textures.forEach((texture) => {
            texture.dispose()
        })

        materials.forEach((material) => {
            material.dispose()
        })

        postGeometry.dispose()
        postMaterial.dispose()

        target.dispose()
        renderer.dispose()
    }

    return {
        render,
        resize,
        dispose,
        setActive,
        setPaused,
        setReducedMotion,
        pointerDown,
        pointerMove,
        pointerUp,
        isDragging: () => dragging,
    }
}

export default function KarimSaifEdgeDistortionGallery(props: GalleryProps) {
    const {
        images = DEFAULT_IMAGES,
        backgroundColor = "#FFFFFF",
        columns = 5,
        rows = 5,
        cardWidth = 600,
        cardHeight = 750,
        gapX = 200,
        gapY = 200,
        cornerRadius = 40,
        distortion = 0.3,
        chromatic = 0.008,
        edgeStart = 0.75,
        driftX = 1,
        driftY = -0.5,
        dragSpeed = 1.5,
        inertia = 0.92,
        zoom = 1,
        autoDrift = true,
        enableDrag = true,
        touchDrag = true,
        paused = false,
        maxDpr = 2,
        maxTextureSize = 1024,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const engineRef = React.useRef<GalleryEngine | null>(null)

    const staticRenderer = useIsStaticRenderer()

    const [reducedMotion, setReducedMotion] = React.useState(false)

    const [visible, setVisible] = React.useState(true)

    const [dragging, setDragging] = React.useState(false)

    const [failed, setFailed] = React.useState(false)

    const [size, setSize] = React.useState({
        width: 1200,
        height: 800,
    })

    const activeImages = React.useMemo(() => {
        const valid = (images || []).filter(Boolean)

        return valid.length ? valid : DEFAULT_IMAGES
    }, [images])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const media = window.matchMedia("(prefers-reduced-motion: reduce)")

        const update = () => {
            setReducedMotion(media.matches)
        }

        update()

        media.addEventListener?.("change", update)

        return () => {
            media.removeEventListener?.("change", update)
        }
    }, [])

    React.useEffect(() => {
        const element = containerRef.current

        if (!element || typeof ResizeObserver === "undefined") {
            return
        }

        const observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect

            if (!rect) return

            setSize({
                width: Math.max(1, rect.width),
                height: Math.max(1, rect.height),
            })

            engineRef.current?.resize()
        })

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        const element = containerRef.current

        if (!element || typeof IntersectionObserver === "undefined") {
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                setVisible(entries[0]?.isIntersecting ?? true)
            },
            {
                threshold: 0.01,
            }
        )

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        engineRef.current?.setActive(visible)
    }, [visible])

    React.useEffect(() => {
        engineRef.current?.setPaused(paused)
    }, [paused])

    React.useEffect(() => {
        engineRef.current?.setReducedMotion(reducedMotion)
    }, [reducedMotion])

    React.useEffect(() => {
        if (
            staticRenderer ||
            failed ||
            !canvasRef.current ||
            !containerRef.current
        ) {
            return
        }

        const canvas = canvasRef.current
        const container = containerRef.current

        const engine = createEngine(
            canvas,
            container,
            {
                ...props,
                images: activeImages,
                backgroundColor,
                columns,
                rows,
                cardWidth,
                cardHeight,
                gapX,
                gapY,
                cornerRadius,
                distortion,
                chromatic,
                edgeStart,
                driftX,
                driftY,
                dragSpeed,
                inertia,
                zoom,
                autoDrift,
                enableDrag,
                touchDrag,
                paused,
                maxDpr,
                maxTextureSize,
            },
            () => setFailed(true)
        )

        if (!engine) {
            setFailed(true)
            return
        }

        engineRef.current = engine

        engine.setReducedMotion(reducedMotion)
        engine.setPaused(paused)
        engine.setActive(visible)

        const onDown = (event: PointerEvent) => {
            engine.pointerDown(event)

            setDragging(engine.isDragging())
        }

        const onMove = (event: PointerEvent) => {
            engine.pointerMove(event)
        }

        const onUp = (event: PointerEvent) => {
            engine.pointerUp(event)

            setDragging(engine.isDragging())
        }

        const onVisibility = () => {
            engine.setActive(visible && !document.hidden)
        }

        canvas.addEventListener("pointerdown", onDown)

        canvas.addEventListener("pointermove", onMove)

        canvas.addEventListener("pointerup", onUp)

        canvas.addEventListener("pointercancel", onUp)

        canvas.addEventListener("lostpointercapture", onUp)

        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            canvas.removeEventListener("pointerdown", onDown)

            canvas.removeEventListener("pointermove", onMove)

            canvas.removeEventListener("pointerup", onUp)

            canvas.removeEventListener("pointercancel", onUp)

            canvas.removeEventListener("lostpointercapture", onUp)

            document.removeEventListener("visibilitychange", onVisibility)

            engine.dispose()

            if (engineRef.current === engine) {
                engineRef.current = null
            }
        }
    }, [
        staticRenderer,
        failed,
        activeImages,
        backgroundColor,
        columns,
        rows,
        cardWidth,
        cardHeight,
        gapX,
        gapY,
        cornerRadius,
        distortion,
        chromatic,
        edgeStart,
        driftX,
        driftY,
        dragSpeed,
        inertia,
        zoom,
        autoDrift,
        enableDrag,
        touchDrag,
        maxDpr,
        maxTextureSize,
    ])

    const fallback = staticRenderer || failed

    const fallbackCards = React.useMemo(() => {
        const result: {
            x: number
            y: number
            image: string
        }[] = []

        const width = Math.max(1, cardWidth)
        const height = Math.max(1, cardHeight)

        const stepX = width + gapX
        const stepY = height + gapY

        const scale = size.height / (2000 / Math.max(0.1, zoom))

        const visibleWidth = size.width / scale

        const visibleHeight = size.height / scale

        const countX = Math.max(columns, Math.ceil(visibleWidth / stepX) + 3)

        const countY = Math.max(rows, Math.ceil(visibleHeight / stepY) + 3)

        for (let y = 0; y < countY; y++) {
            for (let x = 0; x < countX; x++) {
                result.push({
                    x: (x - (countX - 1) / 2) * stepX * scale,
                    y: (y - (countY - 1) / 2) * stepY * scale,
                    image: activeImages[(y * countX + x) % activeImages.length],
                })
            }
        }

        return result
    }, [
        size,
        columns,
        rows,
        cardWidth,
        cardHeight,
        gapX,
        gapY,
        zoom,
        activeImages,
    ])

    const fallbackScale = size.height / (2000 / Math.max(0.1, zoom))

    return (
        <div
            ref={containerRef}
            role="group"
            aria-label="Interactive infinite image gallery"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                isolation: "isolate",
                background: backgroundColor,
            }}
        >
            {fallback ? (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {fallbackCards.map((card, index) => (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: cardWidth * fallbackScale,
                                height: cardHeight * fallbackScale,
                                transform: `translate(-50%, -50%) translate(${card.x}px, ${card.y}px)`,
                                borderRadius: cornerRadius * fallbackScale,
                                overflow: "hidden",
                                background: "#DDDDDD",
                            }}
                        >
                            <img
                                src={normalizeImage(card.image)}
                                alt=""
                                draggable={false}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        cursor: enableDrag
                            ? dragging
                                ? "grabbing"
                                : "grab"
                            : "default",
                        touchAction: enableDrag && touchDrag ? "none" : "auto",
                    }}
                />
            )}
        </div>
    )
}

KarimSaifEdgeDistortionGallery.defaultProps = {
    images: DEFAULT_IMAGES,
    backgroundColor: "#FFFFFF",
    columns: 5,
    rows: 5,
    cardWidth: 600,
    cardHeight: 750,
    gapX: 200,
    gapY: 200,
    cornerRadius: 40,
    distortion: 0.3,
    chromatic: 0.008,
    edgeStart: 0.75,
    driftX: 1,
    driftY: -0.5,
    dragSpeed: 1.5,
    inertia: 0.92,
    zoom: 1,
    autoDrift: true,
    enableDrag: true,
    touchDrag: true,
    paused: false,
    maxDpr: 2,
    maxTextureSize: 1024,
}

addPropertyControls(KarimSaifEdgeDistortionGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        description:
            "Upload images to populate the infinite repeating gallery. Use images you own or are licensed to distribute.",
        control: {
            type: ControlType.Image,
        },
        maxCount: 30,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color visible between the image cards.",
        defaultValue: "#FFFFFF",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        description:
            "Minimum number of repeating grid columns. Additional columns are generated automatically when needed.",
        min: 2,
        max: 12,
        step: 1,
        defaultValue: 5,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        description:
            "Minimum number of repeating grid rows. Additional rows are generated automatically when needed.",
        min: 2,
        max: 12,
        step: 1,
        defaultValue: 5,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        description: "Width of each image card in gallery world units.",
        min: 100,
        max: 1200,
        step: 10,
        defaultValue: 600,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        description: "Height of each image card in gallery world units.",
        min: 100,
        max: 1500,
        step: 10,
        defaultValue: 750,
    },
    gapX: {
        type: ControlType.Number,
        title: "Horizontal Gap",
        description: "Horizontal space between adjacent image cards.",
        min: 0,
        max: 600,
        step: 10,
        defaultValue: 200,
    },
    gapY: {
        type: ControlType.Number,
        title: "Vertical Gap",
        description: "Vertical space between adjacent image cards.",
        min: 0,
        max: 600,
        step: 10,
        defaultValue: 200,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        description: "Corner rounding applied to every image card.",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 40,
    },
    distortion: {
        type: ControlType.Number,
        title: "Fisheye",
        description:
            "Controls the strength of the WebGL fisheye distortion around the viewport edges.",
        min: 0,
        max: 0.8,
        step: 0.01,
        defaultValue: 0.3,
    },
    chromatic: {
        type: ControlType.Number,
        title: "RGB Split",
        description:
            "Controls the red and blue chromatic aberration effect near the gallery edges.",
        min: 0,
        max: 0.03,
        step: 0.001,
        defaultValue: 0.008,
    },
    edgeStart: {
        type: ControlType.Number,
        title: "Edge Start",
        description:
            "Defines where distortion begins. Lower values extend the effect farther toward the center.",
        min: 0.2,
        max: 0.95,
        step: 0.01,
        defaultValue: 0.75,
    },
    zoom: {
        type: ControlType.Number,
        title: "Zoom",
        description:
            "Adjusts the apparent size of cards and the amount of gallery visible.",
        min: 0.3,
        max: 3,
        step: 0.05,
        defaultValue: 1,
    },
    autoDrift: {
        type: ControlType.Boolean,
        title: "Auto Drift",
        description:
            "Enables automatic diagonal movement when the gallery is not being dragged.",
        defaultValue: true,
    },
    driftX: {
        type: ControlType.Number,
        title: "Drift X",
        description:
            "Horizontal automatic movement speed. Negative values reverse the direction.",
        min: -5,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        hidden: (props) => !props.autoDrift,
    },
    driftY: {
        type: ControlType.Number,
        title: "Drift Y",
        description:
            "Vertical automatic movement speed. Negative values reverse the direction.",
        min: -5,
        max: 5,
        step: 0.1,
        defaultValue: -0.5,
        hidden: (props) => !props.autoDrift,
    },
    enableDrag: {
        type: ControlType.Boolean,
        title: "Drag",
        description:
            "Allows visitors to move the gallery using a mouse, pen, or supported touch gesture.",
        defaultValue: true,
    },
    touchDrag: {
        type: ControlType.Boolean,
        title: "Touch Drag",
        description:
            "Enables touch dragging on mobile. Turn off to preserve normal page scrolling over the component.",
        defaultValue: true,
        hidden: (props) => !props.enableDrag,
    },
    dragSpeed: {
        type: ControlType.Number,
        title: "Drag Speed",
        description:
            "Controls how far the gallery moves in response to pointer dragging.",
        min: 0.1,
        max: 4,
        step: 0.1,
        defaultValue: 1.5,
        hidden: (props) => !props.enableDrag,
    },
    inertia: {
        type: ControlType.Number,
        title: "Inertia",
        description:
            "Controls momentum after dragging. Higher values create longer gliding movement.",
        min: 0,
        max: 0.99,
        step: 0.01,
        defaultValue: 0.92,
        hidden: (props) => !props.enableDrag,
    },
    paused: {
        type: ControlType.Boolean,
        title: "Paused",
        description:
            "Stops gallery animation and interaction while keeping the current visual state.",
        defaultValue: false,
    },
    maxDpr: {
        type: ControlType.Number,
        title: "Max DPR",
        description:
            "Limits WebGL pixel density to reduce GPU usage on high-resolution displays.",
        min: 1,
        max: 2,
        step: 0.5,
        defaultValue: 2,
    },
    maxTextureSize: {
        type: ControlType.Number,
        title: "Texture Size",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
        min: 256,
        max: 2048,
        step: 256,
        defaultValue: 1024,
    },
})
