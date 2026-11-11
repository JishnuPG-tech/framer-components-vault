import * as React from "react"
import { useRef, useEffect } from "react"
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


type Media = {
    type?: "image" | "video"
    image?: string | { src: string }
    video?: string
    alt?: string
}
const defaults: Media[] = [
    "photo-1534528741775-53994a69daeb",
    "photo-1524504388940-b1c1722653e1",
    "photo-1526510747491-58f928ec870f",
    "photo-1517841905240-472988babdf9",
    "photo-1531123897727-8f129e1688ce",
    "photo-1515886657613-9f3515b0c78f",
].map((id) => ({
    type: "image",
    image: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`,
    alt: "Portrait photography",
}))
const layoutDefaults = { columns: 3, mobileColumns: 3, gap: 5 }
const motionDefaults = {
    speed: 1,
    smoothing: 0.1,
    drag: true,
    respectReducedMotion: true,
}
const appearanceDefaults = {
    pixelRatio: 2,
    showLinks: true,
    textColor: "#ffffff",
}
const source = (item: Media) =>
    item.type === "video"
        ? item.video || ""
        : typeof item.image === "string"
          ? item.image
          : item.image?.src || ""
const modulo = (n: number, d: number) => ((n % d) + d) % d
const clamp = (n: number) => Math.min(1, Math.max(0, n))

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function InfiniteLoopGrid(incomingProps: any) {
    const props = {
        ...incomingProps,
        ...layoutDefaults,
        ...incomingProps.layout,
        ...motionDefaults,
        ...incomingProps.motion,
        ...appearanceDefaults,
        ...incomingProps.appearance,
    }
    const mountRef = useRef<HTMLDivElement>(null)
    const fallbackRef = useRef<HTMLDivElement>(null)
    const isIntersecting = useRef(true)
    const isStatic = useIsStaticRenderer()
    const shouldAnimate =
        !isStatic &&
        (props.editorPreview ?? true) &&
        (props.livePreview ?? true)
    const media: Media[] = props.media?.length ? props.media : defaults
    const mediaKey = JSON.stringify(media)

    useEffect(() => {
        const container = mountRef.current
        if (!container) return
        let frameId = 0,
            disposed = false,
            width = 0,
            height = 0,
            columns = 3,
            hasRenderedMedia = false
        let current = 0,
            target = 0,
            lastTime = 0,
            dragging = false,
            lastY = 0,
            pointerId = -1
        let resizeObserver: ResizeObserver | undefined,
            intersectionObserver: IntersectionObserver | undefined
        let renderer: THREE.WebGLRenderer | undefined
        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10)
        const geometry = new THREE.PlaneGeometry(1, 1)
        const assets = new Map<
            string,
            {
                texture?: THREE.Texture
                video?: HTMLVideoElement
                image?: HTMLImageElement
                cleanup: () => void
            }
        >()
        const tiles: {
            mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
            key: string
        }[] = []
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        const canAnimate = () =>
            shouldAnimate &&
            !(props.respectReducedMotion && reducedMotion.matches)
        const visible = () => isIntersecting.current && !document.hidden
        const rowCount = () => Math.ceil(media.length / columns)
        const pitch = () => height * (1 + props.gap / 100)
        const cycle = () => rowCount() * pitch()

        function invalidate() {
            if (disposed || !renderer || !visible() || frameId) return
            frameId = requestAnimationFrame(renderLoop)
        }
        function load(item: Media, key: string) {
            const existing = assets.get(key)
            if (existing) return existing
            const asset: {
                texture?: THREE.Texture
                video?: HTMLVideoElement
                image?: HTMLImageElement
                cleanup: () => void
            } = { cleanup: () => {} }
            assets.set(key, asset)
            const ready = (texture: THREE.Texture) => {
                if (disposed || assets.get(key) !== asset) {
                    texture.dispose()
                    return
                }
                texture.colorSpace = THREE.SRGBColorSpace
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.generateMipmaps = false
                texture.needsUpdate = true
                asset.texture = texture
                invalidate()
            }
            if (item.type === "video") {
                const video = document.createElement("video")
                asset.video = video
                video.crossOrigin = "anonymous"
                video.muted = true
                video.loop = true
                video.playsInline = true
                video.preload = "metadata"
                const onReady = () => {
                    if (!asset.texture) ready(new THREE.VideoTexture(video))
                    invalidate()
                }
                const onSeek = () => invalidate()
                video.addEventListener("loadeddata", onReady)
                video.addEventListener("seeked", onSeek)
                asset.cleanup = () => {
                    video.removeEventListener("loadeddata", onReady)
                    video.removeEventListener("seeked", onSeek)
                    video.pause()
                    video.removeAttribute("src")
                    video.load()
                }
                video.src = source(item)
                video.load()
            } else {
                const image = new Image()
                asset.image = image
                image.crossOrigin = "anonymous"
                image.onload = () => ready(new THREE.Texture(image))
                image.onerror = () => invalidate()
                asset.cleanup = () => {
                    image.onload = null
                    image.onerror = null
                    image.src = ""
                }
                image.src = source(item)
            }
            return asset
        }
        function pauseVideos() {
            assets.forEach((asset) => asset.video?.pause())
        }
        function renderLoop(time = performance.now()) {
            frameId = 0
            if (disposed || !renderer || !visible() || !height) return
            const dt = lastTime ? Math.min(64, time - lastTime) : 16.667
            lastTime = time
            current = canAnimate()
                ? current +
                  (target - current) *
                      (1 - Math.pow(1 - props.smoothing, dt / 16.667))
                : target
            if (Math.abs(target - current) < 0.01) current = target
            // Rebase both values together; the loop never accumulates floating-point drift.
            const total = cycle()
            if (Math.abs(current) > total * 100) {
                const shift = Math.trunc(current / total) * total
                current -= shift
                target -= shift
            }
            const first = Math.floor(current / pitch())
            const gap = (height * props.gap) / 100
            const tileWidth = (width - gap * (columns - 1)) / columns
            const used = new Set<string>()
            let active = 0,
                playing = false
            const visibleVideoKeys = new Set<string>()
            for (let row = first; row <= first + 1; row++) {
                const top = row * pitch() - current
                if (top >= height || top + height <= 0) continue
                const factor = clamp(
                    top >= 0 ? (height - top) / height : (top + height) / height
                )
                for (let col = 0; col < columns; col++) {
                    // A partial final row stays partial; every supplied item appears exactly once per cycle.
                    const index = modulo(row, rowCount()) * columns + col
                    if (index >= media.length) continue
                    const item = media[index],
                        url = source(item)
                    if (!url) continue
                    const key = `${item.type || "image"}:${url}`
                    used.add(key)
                    const asset = load(item, key)
                    let tile = tiles[active++]
                    if (!tile) {
                        const material = new THREE.MeshBasicMaterial({
                            transparent: true,
                            depthTest: false,
                            depthWrite: false,
                            toneMapped: false,
                        })
                        tile = {
                            mesh: new THREE.Mesh(geometry, material),
                            key: "",
                        }
                        tiles.push(tile)
                        scene.add(tile.mesh)
                    }
                    tile.key = key
                    const mesh = tile.mesh,
                        texture = asset.texture
                    mesh.visible = !!texture
                    if (!texture) continue
                    const image = texture.image as any
                    const iw =
                        image.videoWidth ||
                        image.naturalWidth ||
                        image.width ||
                        1
                    const ih =
                        image.videoHeight ||
                        image.naturalHeight ||
                        image.height ||
                        1
                    const ratio = tileWidth / height / (iw / ih)
                    texture.repeat.set(
                        Math.min(1, ratio),
                        Math.min(1, 1 / ratio)
                    )
                    texture.offset.set(
                        (1 - texture.repeat.x) / 2,
                        (1 - texture.repeat.y) / 2
                    )
                    if (mesh.material.map !== texture) {
                        mesh.material.map = texture
                        mesh.material.needsUpdate = true
                    }
                    mesh.material.opacity = factor
                    mesh.scale.set(tileWidth, height * factor, 1)
                    const visualTop =
                        top < 0 ? top + height * (1 - factor) : top
                    mesh.position.set(
                        col * (tileWidth + gap) + tileWidth / 2,
                        height - visualTop - (height * factor) / 2,
                        0
                    )
                    if (asset.video) {
                        visibleVideoKeys.add(key)
                        if (canAnimate()) {
                            if (asset.video.paused)
                                asset.video.play().catch(() => {})
                            playing = true
                        } else asset.video.pause()
                    }
                }
            }
            tiles.forEach((tile, i) => {
                if (i >= active) {
                    tile.mesh.visible = false
                    tile.mesh.material.map = null
                }
            })
            // Preload one row on either side to keep both scroll directions responsive.
            for (const row of [first - 1, first + 2])
                for (let col = 0; col < columns; col++) {
                    const item = media[modulo(row, rowCount()) * columns + col]
                    if (!item || !source(item)) continue
                    const key = `${item.type || "image"}:${source(item)}`
                    used.add(key)
                    load(item, key)
                }
            // At most four rows occupy GPU/video memory, regardless of list length.
            assets.forEach((asset, key) => {
                if (!visibleVideoKeys.has(key)) asset.video?.pause()
                if (!used.has(key)) {
                    tiles.forEach((tile) => {
                        if (tile.key === key) tile.mesh.material.map = null
                    })
                    asset.cleanup()
                    asset.texture?.dispose()
                    assets.delete(key)
                }
            })
            renderer.render(scene, camera)
            hasRenderedMedia ||= tiles
                .slice(0, active)
                .some((tile) => tile.mesh.visible)
            renderer.domElement.style.visibility = hasRenderedMedia
                ? "visible"
                : "hidden"
            if (fallbackRef.current)
                fallbackRef.current.style.visibility = hasRenderedMedia
                    ? "hidden"
                    : "visible"
            if (canAnimate() && (current !== target || playing)) invalidate()
        }
        function resize() {
            const oldPitch = pitch() || 1
            width = Math.max(1, container!.clientWidth)
            height = Math.max(1, container!.clientHeight)
            columns = Math.max(
                1,
                Math.round(width < 600 ? props.mobileColumns : props.columns)
            )
            // Keep a positive media width even in unusually small Framer frames.
            columns = Math.min(
                columns,
                Math.max(
                    1,
                    Math.floor(
                        width / Math.max(1, (height * props.gap) / 100 + 1)
                    )
                )
            )
            current = (current / oldPitch) * pitch()
            target = (target / oldPitch) * pitch()
            camera.left = 0
            camera.right = width
            camera.top = height
            camera.bottom = 0
            camera.updateProjectionMatrix()
            renderer?.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, props.pixelRatio)
            )
            renderer?.setSize(width, height, false)
            invalidate()
        }
        function wheel(event: WheelEvent) {
            if (event.ctrlKey) return
            event.preventDefault()
            target +=
                event.deltaY *
                (event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? height
                      : 1) *
                props.speed
            invalidate()
        }
        function down(event: PointerEvent) {
            if (
                !props.drag ||
                event.button !== 0 ||
                (event.target as HTMLElement).closest("a,button,input")
            )
                return
            dragging = true
            pointerId = event.pointerId
            lastY = event.clientY
            container!.setPointerCapture(pointerId)
            container!.style.cursor = "grabbing"
        }
        function move(event: PointerEvent) {
            if (!dragging || event.pointerId !== pointerId) return
            target += (lastY - event.clientY) * props.speed
            lastY = event.clientY
            invalidate()
        }
        function up() {
            dragging = false
            if (container!.hasPointerCapture(pointerId))
                container!.releasePointerCapture(pointerId)
            container!.style.cursor = props.drag ? "grab" : "auto"
        }
        function key(event: KeyboardEvent) {
            let delta = 0
            if (event.key === "ArrowDown") delta = 100
            if (event.key === "ArrowUp") delta = -100
            if (event.key === "PageDown" || event.key === " ")
                delta = height * (event.shiftKey ? -1 : 1)
            if (event.key === "PageUp") delta = -height
            if (event.key === "Home") {
                target = 0
                event.preventDefault()
                invalidate()
                return
            }
            if (delta) {
                event.preventDefault()
                target += delta * props.speed
                invalidate()
            }
        }
        function visibilityChanged() {
            lastTime = 0
            if (visible()) invalidate()
            else {
                cancelAnimationFrame(frameId)
                frameId = 0
                pauseVideos()
            }
        }
        function motionChanged() {
            pauseVideos()
            invalidate()
        }
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: false,
                powerPreference: "high-performance",
            })
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.domElement.style.cssText =
                "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;visibility:hidden"
            renderer.domElement.setAttribute("aria-hidden", "true")
            container.appendChild(renderer.domElement)
            resizeObserver = new ResizeObserver(resize)
            resizeObserver.observe(container)
            intersectionObserver = new IntersectionObserver((entries) => {
                isIntersecting.current = entries[0].isIntersecting
                visibilityChanged()
            })
            intersectionObserver.observe(container)
            container.addEventListener("wheel", wheel, { passive: false })
            container.addEventListener("pointerdown", down)
            container.addEventListener("pointermove", move)
            container.addEventListener("pointerup", up)
            container.addEventListener("pointercancel", up)
            container.addEventListener("keydown", key)
            document.addEventListener("visibilitychange", visibilityChanged)
            reducedMotion.addEventListener("change", motionChanged)
            resize()
        } catch (error) {
            // SSR/unsupported GPUs keep the HTML image fallback instead of an empty frame.
            console.warn(
                "InfiniteLoopGrid: WebGL unavailable; displaying static media.",
                error
            )
        }
        return () => {
            disposed = true
            cancelAnimationFrame(frameId)
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            container.removeEventListener("wheel", wheel)
            container.removeEventListener("pointerdown", down)
            container.removeEventListener("pointermove", move)
            container.removeEventListener("pointerup", up)
            container.removeEventListener("pointercancel", up)
            container.removeEventListener("keydown", key)
            document.removeEventListener("visibilitychange", visibilityChanged)
            reducedMotion.removeEventListener("change", motionChanged)
            if (pointerId >= 0 && container.hasPointerCapture(pointerId))
                container.releasePointerCapture(pointerId)
            assets.forEach((asset) => {
                asset.cleanup()
                asset.texture?.dispose()
            })
            assets.clear()
            tiles.forEach((tile) => tile.mesh.material.dispose())
            geometry.dispose()
            scene.clear()
            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (container && container.contains(renderer.domElement))
                    container.removeChild(renderer.domElement)
            }
            if (fallbackRef.current)
                fallbackRef.current.style.visibility = "visible"
        }
    }, [
        mediaKey,
        shouldAnimate,
        props.columns,
        props.mobileColumns,
        props.gap,
        props.speed,
        props.smoothing,
        props.drag,
        props.respectReducedMotion,
        props.pixelRatio,
    ])

    // Forward only valid DOM attributes; grouped controls must never become DOM attributes.
    const { style, id, className } = incomingProps
    const domProps = {
        id,
        className,
        tabIndex: 0,
        role: "region",
        "aria-label":
            "Infinite media grid. Scroll, drag, or use arrow keys to explore.",
    }
    return (
        <div
            {...domProps}
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                ...style,
                position: "relative",
                overflow: "hidden",
                background: "transparent",
                touchAction: props.drag ? "none" : "auto",
                cursor: props.drag ? "grab" : "auto",
                isolation: "isolate",
            }}
        >
            <div
                ref={fallbackRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
                    gap: `${props.gap}cqh`,
                    pointerEvents: "none",
                }}
            >
                {media.slice(0, props.columns).map((item, index) =>
                    item.type === "video" ? (
                        <video
                            key={index}
                            src={source(item)}
                            muted
                            playsInline
                            preload="metadata"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        <img
                            key={index}
                            src={source(item)}
                            alt={item.alt || ""}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    )
                )}
            </div>
            {props.showLinks && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        top: 22.5,
                        left: 30,
                        right: 30,
                        pointerEvents: "none",
                        color: props.textColor,
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
                        fontSize: 15,
                        fontWeight: 500,
                        lineHeight: 1.4,
                        display: "flex",
                        gap: "3vw",
                        alignItems: "start",
                    }}
                >
                    <nav
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0 15px",
                        }}
                    >
                        <a
                            style={{
                                pointerEvents: "auto",
                                color: props.textColor,
                                opacity: 0.7,
                                textDecoration: "none",
                            }}
                            href="https://github.com/codrops/codrops-sketches/tree/main/027-infinite-loop-scrolling-animation-2"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub
                        </a>
                        <a
                            style={{
                                pointerEvents: "auto",
                                color: props.textColor,
                                opacity: 0.7,
                                textDecoration: "none",
                            }}
                            href="https://tympanus.net/codrops/sketches"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Archive
                        </a>
                    </nav>
                </div>
            )}
        </div>
    )
}

InfiniteLoopGrid.defaultProps = {
    width: 1200,
    height: 800,
    livePreview: true,
    editorPreview: true,
    media: defaults,
    layout: layoutDefaults,
    motion: motionDefaults,
    appearance: appearanceDefaults,
}
addPropertyControls(InfiniteLoopGrid, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Enable smooth motion.",
    },
    editorPreview: {
        type: ControlType.Boolean,
        title: "Editor Preview",
        defaultValue: true,
        description: "Animate in the editor.",
    },
    media: {
        type: ControlType.Array,
        title: "Media",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (p: any) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.type !== "video",
                    description: "Muted, looping playback.",
                },
                alt: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    description: "Accessible image text.",
                },
            },
        },
        description: "Add images and videos in order.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            columns: {
                type: ControlType.Number,
                title: "Columns",
                min: 1,
                max: 8,
                step: 1,
                defaultValue: 3,
                unit: "cols",
            },
            mobileColumns: {
                type: ControlType.Number,
                title: "Mobile",
                min: 1,
                max: 4,
                step: 1,
                defaultValue: 3,
                unit: "cols",
                description: "Below 600 px width.",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 20,
                step: 0.5,
                unit: "%",
                defaultValue: 5,
                description: "Percent of frame height.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Scroll Speed",
                min: 0.1,
                max: 4,
                step: 0.1,
                unit: "×",
                defaultValue: 1,
            },
            smoothing: {
                type: ControlType.Number,
                title: "Response",
                min: 0.01,
                max: 1,
                step: 0.01,
                unit: "×",
                defaultValue: 0.1,
                description: "Lower feels softer.",
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
            },
            respectReducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                defaultValue: true,
                description: "Follow device preference.",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            pixelRatio: {
                type: ControlType.Number,
                title: "Resolution",
                min: 1,
                max: 3,
                step: 0.5,
                unit: "×",
                defaultValue: 2,
                description: "Maximum screen density.",
            },
            showLinks: {
                type: ControlType.Boolean,
                title: "Source Links",
                defaultValue: true,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#ffffff",
            },
        },
    },
})
