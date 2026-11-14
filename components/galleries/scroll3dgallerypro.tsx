import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
} from "react"
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


type ResponsiveImageLike = {
    src?: string
    srcSet?: string
    alt?: string
    url?: string
}

type GalleryItem = {
    src?: string | ResponsiveImageLike
    title?: string
    link?: string
    alt?: string
}

type NormalizedGalleryItem = {
    src: string
    srcSet?: string
    alt: string
    title?: string
    link?: string
}

type TitleFontValue = {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number
    fontStyle?: "normal" | "italic"
    lineHeight?: number | string
    letterSpacing?: number | string
    textAlign?: "left" | "center" | "right"
    variant?: string
}

const DEFAULT_ITEMS: GalleryItem[] = [
    { src: "https://picsum.photos/id/1015/900/700", title: "River Valley" },
    { src: "https://picsum.photos/id/1025/700/900", title: "Companion" },
    { src: "https://picsum.photos/id/1035/900/600", title: "Ridgeline" },
    { src: "https://picsum.photos/id/1043/800/800", title: "Passage" },
    { src: "https://picsum.photos/id/1050/900/650", title: "Skylight" },
    { src: "https://picsum.photos/id/1062/700/880", title: "Stillness" },
    { src: "https://picsum.photos/id/1074/900/700", title: "Wilder" },
    { src: "https://picsum.photos/id/110/860/640", title: "Northbound" },
]

const MAX_TEXTURE_SIZE = 1024

// Framer's Image control can hand us a plain URL string or an object
// like { src: "...", srcSet: "..." } — accept both.
function normalizeSrc(v?: string | ResponsiveImageLike): string | undefined {
    if (!v) return undefined
    if (typeof v === "string") return v
    if (typeof v === "object") {
        if (typeof v.src === "string") return v.src
        if (typeof v.url === "string") return v.url
    }
    return undefined
}

function normalizeAlt(v?: string | ResponsiveImageLike, fallback?: string): string {
    if (v && typeof v === "object" && typeof v.alt === "string" && v.alt.trim()) {
        return v.alt.trim()
    }
    if (typeof fallback === "string" && fallback.trim()) return fallback.trim()
    return "Gallery image"
}

function normalizeSrcSet(v?: string | ResponsiveImageLike): string | undefined {
    if (!v || typeof v === "string") return undefined
    return typeof v.srcSet === "string" ? v.srcSet : undefined
}

// Deterministic random so canvas + preview layouts match
function mulberry32(a: number) {
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v))

// ---------- Robust image loading ----------

function loadImg(url: string, cors: boolean): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        if (cors) img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = async () => {
            try {
                if (img.decode) await img.decode()
            } catch (_) {}
            resolve(img)
        }
        img.onerror = () => reject(new Error("load failed"))
        img.src = url
    })
}

function buildTexture(
    img: HTMLImageElement,
    canUseCanvas: boolean,
    renderer: THREE.WebGLRenderer
): { tex: THREE.Texture; aspect: number } {
    const w = img.naturalWidth || img.width || 1
    const h = img.naturalHeight || img.height || 1
    const aspect = w / h || 1
    let tex: THREE.Texture
    const maxDim = Math.max(w, h)
    if (canUseCanvas && maxDim > MAX_TEXTURE_SIZE) {
        // Downscale huge uploads to save GPU memory
        const s = MAX_TEXTURE_SIZE / maxDim
        const cv = document.createElement("canvas")
        cv.width = Math.round(w * s)
        cv.height = Math.round(h * s)
        cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height)
        tex = new THREE.CanvasTexture(cv)
    } else {
        tex = new THREE.Texture(img)
        tex.needsUpdate = true
    }
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    // Pre-upload to GPU now — this also surfaces tainted-canvas errors
    // immediately so the fallback chain can react.
    renderer.initTexture(tex)
    return { tex, aspect }
}

// 1) CORS  →  2) CORS + cache-bust (beats editor caches that stored a
// non-CORS response)  →  3) plain load (same-origin editor assets).
async function robustLoadTexture(
    url: string,
    renderer: THREE.WebGLRenderer
): Promise<{ tex: THREE.Texture; aspect: number }> {
    try {
        const img = await loadImg(url, true)
        return buildTexture(img, true, renderer)
    } catch (_) {}
    try {
        const sep = url.includes("?") ? "&" : "?"
        const img = await loadImg(url + sep + "fcors=1", true)
        return buildTexture(img, true, renderer)
    } catch (_) {}
    const img = await loadImg(url, false)
    return buildTexture(img, false, renderer)
}

// Draw a title string onto a crisp canvas texture
const variantToStyle: Record<string, { fontWeight: number; fontStyle: "normal" | "italic" }> = {
    Regular: { fontWeight: 400, fontStyle: "normal" },
    Thin: { fontWeight: 100, fontStyle: "normal" },
    "Extra Light": { fontWeight: 200, fontStyle: "normal" },
    Light: { fontWeight: 300, fontStyle: "normal" },
    Medium: { fontWeight: 500, fontStyle: "normal" },
    Semibold: { fontWeight: 600, fontStyle: "normal" },
    Bold: { fontWeight: 700, fontStyle: "normal" },
    "Extra Bold": { fontWeight: 800, fontStyle: "normal" },
    Black: { fontWeight: 900, fontStyle: "normal" },
    Italic: { fontWeight: 400, fontStyle: "italic" },
    "Regular Italic": { fontWeight: 400, fontStyle: "italic" },
    "Medium Italic": { fontWeight: 500, fontStyle: "italic" },
    "Semibold Italic": { fontWeight: 600, fontStyle: "italic" },
    "Bold Italic": { fontWeight: 700, fontStyle: "italic" },
}

function toPx(v: number | string | undefined, fallback: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return v
    if (typeof v === "string") {
        const n = parseFloat(v)
        if (Number.isFinite(n)) return n
    }
    return fallback
}

function makeTitleTexture(
    text: string,
    color: string,
    titleFont: TitleFontValue
): { tex: THREE.CanvasTexture; aspect: number } {
    const variant = titleFont.variant ? variantToStyle[titleFont.variant] : undefined
    const fontPx = Math.max(12, toPx(titleFont.fontSize, 72))
    const fontWeight = titleFont.fontWeight ?? variant?.fontWeight ?? 600
    const fontStyle = titleFont.fontStyle ?? variant?.fontStyle ?? "normal"
    const fontFamily =
        typeof titleFont.fontFamily === "string" && titleFont.fontFamily.trim().length > 0
            ? titleFont.fontFamily
            : `"Inter", "Helvetica Neue", Arial, sans-serif`
    const pad = 24
    const font = `${fontStyle} ${fontWeight} ${fontPx}px ${fontFamily}`
    const measure = document.createElement("canvas").getContext("2d")!
    measure.font = font
    const textW = Math.ceil(measure.measureText(text).width)
    const cv = document.createElement("canvas")
    cv.width = Math.max(4, textW + pad * 2)
    cv.height = fontPx + pad * 2
    const ctx = cv.getContext("2d")!
    ctx.font = font
    ctx.fillStyle = color
    ctx.textBaseline = "middle"
    ctx.fillText(text, pad, cv.height / 2 + fontPx * 0.06)
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    return { tex, aspect: cv.width / cv.height }
}

interface MyComponentProps {
    images: GalleryItem[]
    count: number
    imageSize: number
    sizeVariation: number
    spreadX: number
    spreadY: number
    depth: number
    scrollSpeed: number
    smoothness: number
    fadeDistance: number
    imageOpacity: number
    mouseParallax: number
    hoverZoom: number
    captureScroll: boolean
    showTitles: boolean
    titleColor: string
    titleSize: number
    titleFont: TitleFontValue
    enableLinks: boolean
    transparentBg: boolean
    backgroundColor: string
    seed: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function Scroll3DGallery(props: MyComponentProps) {
    const {
        images = [],
        count = 24,
        imageSize = 5,
        sizeVariation = 0.35,
        spreadX = 26,
        spreadY = 16,
        depth = 60,
        scrollSpeed = 1,
        smoothness = 0.075,
        fadeDistance = 5,
        imageOpacity = 1,
        mouseParallax = 1,
        hoverZoom = 0.07,
        captureScroll = true,
        showTitles = true,
        titleColor = "#ffffff",
        titleSize = 0.45,
        titleFont = {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        enableLinks = true,
        transparentBg = false,
        backgroundColor = "#0a0a0a",
        seed = 7,
        style,
    } = props
    const containerRef = useRef<HTMLDivElement>(null)
    const isStaticRenderer = useIsStaticRenderer()
    const [keyboardIndex, setKeyboardIndex] = useState(0)
    const live = useRef({
        scrollSpeed,
        smoothness,
        fadeDistance,
        imageOpacity,
        mouseParallax,
        hoverZoom,
        captureScroll,
        enableLinks,
    })
    live.current = {
        scrollSpeed,
        smoothness,
        fadeDistance,
        imageOpacity,
        mouseParallax,
        hoverZoom,
        captureScroll,
        enableLinks,
    }

    const safeCount = clamp(Math.floor(count || 0), 1, 500)
    const safeDepth = Math.max(1, depth || 0.001)
    const safeImageSize = Math.max(0.2, imageSize || 0.2)
    const safeVariation = clamp(sizeVariation, 0, 0.95)
    const safeSpreadX = Math.max(0.1, spreadX)
    const safeSpreadY = Math.max(0.1, spreadY)
    const safeTitleSize = Math.max(0.1, titleSize)
    const safeSeed = Math.floor(seed) || 1

    const normalizedInputItems = useMemo(
        () =>
            images
                .map((i) => ({
                    src: normalizeSrc(i?.src),
                    srcSet: normalizeSrcSet(i?.src),
                    alt: normalizeAlt(i?.src, i?.alt || i?.title),
                    title: i?.title,
                    link: i?.link,
                }))
                .filter((i) => !!i.src),
        [images]
    )
    const fallbackItems = useMemo<NormalizedGalleryItem[]>(
        () =>
            DEFAULT_ITEMS.map((i) => ({
                src: normalizeSrc(i.src) || "",
                srcSet: normalizeSrcSet(i.src),
                alt: normalizeAlt(i.src, i.title),
                title: i.title,
                link: i.link,
            })).filter((i) => !!i.src),
        []
    )
    const effectiveItems = useMemo<NormalizedGalleryItem[]>(
        () =>
            (normalizedInputItems.length > 0
                ? normalizedInputItems
                : fallbackItems) as NormalizedGalleryItem[],
        [fallbackItems, normalizedInputItems]
    )
    const safeItems = useMemo<NormalizedGalleryItem[]>(
        () =>
            effectiveItems.length > 0
                ? effectiveItems
                : [
                      {
                          src: "https://picsum.photos/id/1015/900/700",
                          alt: "Gallery image",
                          title: "Gallery image",
                      },
                  ],
        [effectiveItems]
    )
    const keyboardItems = useMemo(
        () => safeItems.filter((i) => !!i.link),
        [safeItems]
    )

    const imagesKey = useMemo(
        () =>
            JSON.stringify(
                safeItems.map((i) => [i.src, i.srcSet, i.alt, i.title, i.link])
            ),
        [safeItems]
    )

    const openLink = useCallback((url: string, newTab: boolean) => {
        if (typeof window === "undefined" || typeof document === "undefined") return
        const safeUrl = url.trim()
        if (!safeUrl || /^javascript:/i.test(safeUrl)) return
        if (/^https?:\/\//i.test(safeUrl)) {
            window.open(safeUrl, newTab ? "_blank" : "_self", "noopener,noreferrer")
            return
        }
        const anchor = document.createElement("a")
        anchor.href = safeUrl
        if (newTab) {
            anchor.target = "_blank"
            anchor.rel = "noopener noreferrer"
        }
        anchor.style.display = "none"
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
    }, [])

    const onKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (!enableLinks || keyboardItems.length === 0) return
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                startTransition(() => {
                    setKeyboardIndex((v) => (v + 1) % keyboardItems.length)
                })
                return
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                startTransition(() => {
                    setKeyboardIndex((v) => (v - 1 + keyboardItems.length) % keyboardItems.length)
                })
                return
            }
            if (e.key === "Home") {
                e.preventDefault()
                startTransition(() => setKeyboardIndex(0))
                return
            }
            if (e.key === "End") {
                e.preventDefault()
                startTransition(() => setKeyboardIndex(Math.max(0, keyboardItems.length - 1)))
                return
            }
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                const selected = keyboardItems[keyboardIndex]
                if (selected?.link) openLink(selected.link, false)
            }
        },
        [enableLinks, keyboardItems, keyboardIndex, openLink]
    )

    useEffect(() => {
        if (isStaticRenderer) return
        if (typeof window === "undefined" || typeof document === "undefined") return
        const container = containerRef.current
        if (!container) return

        const isCanvas = RenderTarget.current() === RenderTarget.canvas
        const list = safeItems
        let disposed = false

        // ---------- Renderer / Scene / Camera ----------
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: isCanvas ? "low-power" : "high-performance",
        })
        renderer.domElement.style.display = "block"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        container.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, safeDepth + 30)
        camera.position.set(0, 0, 0)

        // ---------- Shared texture cache ----------
        const textureCache = new Map<
            string,
            Promise<{ tex: THREE.Texture; aspect: number }>
        >()
        const getTexture = (url: string) => {
            let p = textureCache.get(url)
            if (!p) {
                p = robustLoadTexture(url, renderer)
                p.catch((err) =>
                    console.warn(
                        "[Scroll3DGallery] Could not load image:",
                        url,
                        err
                    )
                )
                textureCache.set(url, p)
            }
            return p
        }

        // ---------- Build image field ----------
        const rand = mulberry32(safeSeed)
        const geometry = new THREE.PlaneGeometry(1, 1)

        type Item = {
            group: THREE.Group
            imgMesh: THREE.Mesh
            imgMat: THREE.MeshBasicMaterial
            titleMat: THREE.MeshBasicMaterial | null
            z0: number
            x0: number
            baseScale: number
            loadFade: number
            loaded: boolean
            hover: number
            link?: string
        }
        const items: Item[] = []
        const clickMeshes: THREE.Mesh[] = []
        const NEAR_OFFSET = 1.5

        for (let i = 0; i < safeCount; i++) {
            const data = list[i % list.length]
            const imgMat = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false,
            })
            const imgMesh = new THREE.Mesh(geometry, imgMat)

            const sv = 1 + (rand() * 2 - 1) * safeVariation
            const baseScale = Math.max(0.2, safeImageSize * sv)
            imgMesh.scale.set(baseScale, baseScale, 1)

            const group = new THREE.Group()
            group.add(imgMesh)

            const x0 = (rand() * 2 - 1) * (safeSpreadX / 2)
            group.position.x = x0
            group.position.y = (rand() * 2 - 1) * (safeSpreadY / 2)

            let titleMat: THREE.MeshBasicMaterial | null = null
            if (showTitles && data.title) {
                const { tex, aspect } = makeTitleTexture(
                    data.title,
                    titleColor,
                    titleFont
                )
                titleMat = new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    opacity: 0,
                    depthWrite: false,
                })
                const h = safeTitleSize
                const titleMesh = new THREE.Mesh(geometry, titleMat)
                titleMesh.scale.set(h * aspect, h, 1)
                titleMesh.position.y = -(baseScale / 2 + h / 2 + 0.18)
                group.add(titleMesh)
            }

            const item: Item = {
                group,
                imgMesh,
                imgMat,
                titleMat,
                z0: (i / safeCount) * safeDepth + rand() * (safeDepth / safeCount),
                x0,
                baseScale,
                loadFade: 0,
                loaded: false,
                hover: 0,
                link: data.link,
            }
            imgMesh.userData.item = item
            items.push(item)
            clickMeshes.push(imgMesh)
            scene.add(group)

            const url = normalizeSrc(data.src)
            if (url) {
                getTexture(url)
                    .then(({ tex, aspect }) => {
                        if (disposed) return
                        imgMat.map = tex
                        imgMat.needsUpdate = true
                        imgMesh.scale.set(baseScale * aspect, baseScale, 1)
                        item.loaded = true
                        wake() // make sure the loop runs to show it
                    })
                    .catch(() => {
                        /* warned in getTexture; plane stays hidden */
                    })
            }
        }

        // ---------- Scroll / pointer state ----------
        let target = 0
        let current = 0
        let velocity = 0
        let mouseX = 0
        let mouseY = 0
        let rotX = 0
        let rotY = 0
        let mouseDirty = false
        let downX = 0
        let downY = 0
        let hoveredItem: Item | null = null

        const raycaster = new THREE.Raycaster()
        const pointerNDC = new THREE.Vector2()

        // ---------- Resize (responsive) ----------
        let spreadFactor = 1
        const resize = () => {
            const w = container.clientWidth || 1
            const h = container.clientHeight || 1
            renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    isCanvas ? 1.5 : w < 810 ? 1.5 : 2
                )
            )
            renderer.setSize(w, h, false)
            camera.aspect = w / h
            camera.fov = w < 810 ? 72 : 60
            spreadFactor = w < 810 ? clamp(w / 810, 0.45, 1) : 1
            camera.updateProjectionMatrix()
            wake()
        }

        // ---------- Input ----------
        const onWheel = (e: WheelEvent) => {
            if (live.current.captureScroll) e.preventDefault()
            target += e.deltaY * 0.012 * live.current.scrollSpeed
        }
        let lastTouchY = 0
        let lastTouchT = 0
        const onTouchStart = (e: TouchEvent) => {
            lastTouchY = e.touches[0].clientY
            lastTouchT = performance.now()
            velocity = 0
        }
        const onTouchMove = (e: TouchEvent) => {
            if (live.current.captureScroll) e.preventDefault()
            const y = e.touches[0].clientY
            const now = performance.now()
            const dy = lastTouchY - y
            const dt = Math.max(now - lastTouchT, 1)
            const sp = live.current.scrollSpeed
            target += dy * 0.035 * sp
            velocity = (dy / dt) * 16 * 0.035 * sp
            lastTouchY = y
            lastTouchT = now
        }
        const onMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1
            mouseDirty = true
        }
        const onPointerDown = (e: PointerEvent) => {
            downX = e.clientX
            downY = e.clientY
        }
        const onPointerUp = (e: PointerEvent) => {
            if (!live.current.enableLinks) return
            if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return
            const rect = container.getBoundingClientRect()
            pointerNDC.set(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -(((e.clientY - rect.top) / rect.height) * 2 - 1)
            )
            raycaster.setFromCamera(pointerNDC, camera)
            const hits = raycaster.intersectObjects(clickMeshes, false)
            for (const hit of hits) {
                const item = hit.object.userData.item as Item
                if (item && item.imgMat.opacity > 0.15 && item.link) {
                    const url = item.link
                    openLink(url, /^https?:\/\//i.test(url))
                    break
                }
            }
        }

        if (!isCanvas) {
            container.addEventListener("wheel", onWheel, { passive: false })
            container.addEventListener("touchstart", onTouchStart, {
                passive: true,
            })
            container.addEventListener("touchmove", onTouchMove, {
                passive: false,
            })
            container.addEventListener("mousemove", onMouseMove)
            container.addEventListener("pointerdown", onPointerDown)
            container.addEventListener("pointerup", onPointerUp)
        }

        // ---------- Animation loop ----------
        let raf = 0
        let running = false
        let lastT = performance.now()
        // On the editor canvas the loop auto-stops once everything has
        // loaded and faded in, so the editor stays fast. wake() restarts it.
        let settleFrames = 0

        const frame = () => {
            raf = requestAnimationFrame(frame)
            const now = performance.now()
            const dtN = clamp(now - lastT, 4, 50) / 16.667 // 60fps units
            lastT = now
            const p = live.current

            // touch momentum (frame-rate independent decay)
            if (Math.abs(velocity) > 0.0005) {
                target += velocity * dtN
                velocity *= Math.pow(0.94, dtN)
            } else {
                velocity = 0
            }

            // frame-rate independent scroll easing
            const delta = target - current
            if (Math.abs(delta) > 0.0004) {
                const k =
                    1 - Math.pow(1 - clamp(p.smoothness, 0.005, 0.3), dtN)
                current += delta * k
            } else {
                current = target
            }

            // mouse parallax (lerped)
            const px = p.mouseParallax * 0.06
            const kp = 1 - Math.pow(1 - 0.06, dtN)
            rotY += (-mouseX * px - rotY) * kp
            rotX += (-mouseY * px - rotX) * kp
            camera.rotation.set(rotX, rotY, 0)

            // hover raycast only when the mouse actually moved
            if (mouseDirty) {
                mouseDirty = false
                if (p.enableLinks) {
                    pointerNDC.set(mouseX, -mouseY)
                    raycaster.setFromCamera(pointerNDC, camera)
                    const hits = raycaster.intersectObjects(
                        clickMeshes,
                        false
                    )
                    const hit = hits.find((h) => {
                        const it = h.object.userData.item as Item
                        return it && it.link && it.imgMat.opacity > 0.15
                    })
                    hoveredItem = hit
                        ? (hit.object.userData.item as Item)
                        : null
                    container.style.cursor = hoveredItem ? "pointer" : "grab"
                } else {
                    hoveredItem = null
                }
            }

            const d = safeDepth
            const farFadeZone = Math.max(d * 0.18, 0.001)
            const fadeDist = Math.max(p.fadeDistance, 0.001)
            const kFade = 1 - Math.pow(1 - 0.08, dtN)
            const kHover = 1 - Math.pow(1 - 0.14, dtN)
            const zoom = clamp(p.hoverZoom, 0, 0.3)
            let allSettled = true

            for (const it of items) {
                let rel = (it.z0 - current) % d
                if (rel < 0) rel += d
                it.group.position.z = -(rel + NEAR_OFFSET)
                it.group.position.x = it.x0 * spreadFactor

                // graceful fade-in once the texture is ready
                if (it.loaded && it.loadFade < 1) {
                    it.loadFade = Math.min(
                        1,
                        it.loadFade + (1 - it.loadFade) * kFade + 0.003
                    )
                    allSettled = false
                }

                // hover zoom (whole card: image + title)
                const hoverTarget = it === hoveredItem ? 1 : 0
                it.hover += (hoverTarget - it.hover) * kHover
                const s = 1 + it.hover * zoom
                it.group.scale.set(s, s, 1)

                const nearFade = clamp(rel / fadeDist, 0, 1)
                const farFade = clamp((d - rel) / farFadeZone, 0, 1)
                const op = nearFade * farFade * p.imageOpacity * it.loadFade
                it.imgMat.opacity = op
                if (it.titleMat) it.titleMat.opacity = op
            }

            renderer.render(scene, camera)

            // Editor canvas: once the picture is fully settled, park the
            // loop to keep the Framer editor snappy.
            if (isCanvas) {
                if (allSettled) {
                    settleFrames++
                    if (settleFrames > 30) stop()
                } else {
                    settleFrames = 0
                }
            }
        }

        const start = () => {
            if (!running) {
                running = true
                lastT = performance.now()
                settleFrames = 0
                raf = requestAnimationFrame(frame)
            }
        }
        const stop = () => {
            if (running) {
                running = false
                cancelAnimationFrame(raf)
            }
        }
        const wake = () => {
            settleFrames = 0
            if (!running) start()
        }

        // Observe size AFTER wake/start exist
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(container)

        let io: IntersectionObserver | null = null
        const onVisibility = () => {
            document.hidden ? stop() : start()
        }
        if (!isCanvas) {
            // Pause while off-screen or tab hidden (preview + published only;
            // these observers misreport inside the editor canvas)
            document.addEventListener("visibilitychange", onVisibility)
            io = new IntersectionObserver(
                (entries) => {
                    entries[0].isIntersecting ? start() : stop()
                },
                { threshold: 0.01 }
            )
            io.observe(container)
        }
        start()

        // ---------- Cleanup ----------
        return () => {
            disposed = true
            stop()
            ro.disconnect()
            if (io) io.disconnect()
            if (!isCanvas) {
                document.removeEventListener("visibilitychange", onVisibility)
                container.removeEventListener("wheel", onWheel)
                container.removeEventListener("touchstart", onTouchStart)
                container.removeEventListener("touchmove", onTouchMove)
                container.removeEventListener("mousemove", onMouseMove)
                container.removeEventListener("pointerdown", onPointerDown)
                container.removeEventListener("pointerup", onPointerUp)
            }
            textureCache.forEach((p) =>
                p.then((r) => r.tex.dispose()).catch(() => {})
            )
            for (const it of items) {
                it.imgMat.dispose()
                if (it.titleMat) {
                    if (it.titleMat.map) it.titleMat.map.dispose()
                    it.titleMat.dispose()
                }
            }
            geometry.dispose()
            renderer.dispose()
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        isStaticRenderer,
        openLink,
        safeItems,
        imagesKey,
        safeCount,
        safeImageSize,
        safeVariation,
        safeSpreadX,
        safeSpreadY,
        safeDepth,
        showTitles,
        titleColor,
        safeTitleSize,
        titleFont,
        safeSeed,
    ])

    const staticItem = safeItems[0]
    if (isStaticRenderer) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    position: "relative",
                    background: transparentBg ? "transparent" : backgroundColor,
                    ...style,
                }}
                aria-label="3D gallery static preview"
            >
                {staticItem?.src ? (
                    <img
                        src={staticItem.src}
                        srcSet={staticItem.srcSet}
                        alt={staticItem.alt || staticItem.title || "Gallery image"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: 0.9,
                            display: "block",
                        }}
                    />
                ) : null}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)",
                    }}
                />
                {showTitles && staticItem?.title ? (
                    <div
                        style={{
                            position: "absolute",
                            left: 20,
                            bottom: 16,
                            color: titleColor,
                            fontFamily: titleFont.fontFamily,
                            fontSize: titleFont.fontSize,
                            fontStyle: titleFont.fontStyle,
                            fontWeight: titleFont.fontWeight,
                            letterSpacing: titleFont.letterSpacing,
                            lineHeight: titleFont.lineHeight,
                            pointerEvents: "none",
                        }}
                    >
                        {staticItem.title}
                    </div>
                ) : null}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            role={enableLinks ? "region" : undefined}
            aria-label={
                enableLinks
                    ? `Interactive 3D gallery. Use arrow keys to choose an item and Enter to open${
                          keyboardItems[keyboardIndex]?.title
                              ? `. Current: ${keyboardItems[keyboardIndex]?.title}`
                              : ""
                      }.`
                    : "3D gallery"
            }
            tabIndex={enableLinks ? 0 : -1}
            onKeyDown={onKeyDown}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
                background: transparentBg ? "transparent" : backgroundColor,
                touchAction: captureScroll ? "pan-x pinch-zoom" : "auto",
                cursor: "grab",
                ...style,
            }}
        >
            <span
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
                {enableLinks && keyboardItems.length > 0
                    ? `Use Arrow keys to select gallery links. Press Enter to open ${keyboardItems[keyboardIndex]?.title || "selected item"}.`
                    : "3D gallery preview"}
            </span>
        </div>
    )
}

addPropertyControls(Scroll3DGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        defaultValue: [
            {
                src: {
                    src: "https://picsum.photos/id/1015/900/700",
                    alt: "River Valley",
                },
                title: "River Valley",
                link: "https://example.com",
            },
            {
                src: {
                    src: "https://picsum.photos/id/1043/800/800",
                    alt: "Passage",
                },
                title: "Passage",
                link: "https://example.com/work",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                    placeholder: "Optional title",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                    placeholder: "Image description",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        description: "Empty = demo images",
    },
    count: {
        type: ControlType.Number,
        title: "Count",
        min: 4,
        max: 100,
        step: 1,
        defaultValue: 24,
        description: "Total planes (images repeat)",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        min: 1,
        max: 15,
        step: 0.1,
        defaultValue: 5,
    },
    sizeVariation: {
        type: ControlType.Number,
        title: "Size Variance",
        min: 0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.35,
    },
    spreadX: {
        type: ControlType.Number,
        title: "Spread X",
        min: 4,
        max: 80,
        step: 1,
        defaultValue: 26,
    },
    spreadY: {
        type: ControlType.Number,
        title: "Spread Y",
        min: 2,
        max: 60,
        step: 1,
        defaultValue: 16,
    },
    depth: {
        type: ControlType.Number,
        title: "Depth",
        min: 20,
        max: 200,
        step: 1,
        defaultValue: 60,
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        min: 0.1,
        max: 4,
        step: 0.1,
        defaultValue: 1,
    },
    smoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        min: 0.01,
        max: 0.25,
        step: 0.005,
        defaultValue: 0.075,
        description: "Lower = more glide/inertia",
    },
    fadeDistance: {
        type: ControlType.Number,
        title: "Fade Distance",
        min: 0.5,
        max: 20,
        step: 0.5,
        defaultValue: 5,
    },
    imageOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 1,
    },
    mouseParallax: {
        type: ControlType.Number,
        title: "Mouse Parallax",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    hoverZoom: {
        type: ControlType.Number,
        title: "Hover Zoom",
        min: 0,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.07,
        description: "Zoom on hover for linked images (0 = off)",
    },
    showTitles: {
        type: ControlType.Boolean,
        title: "Show Titles",
        defaultValue: true,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#ffffff",
        hidden: (p: Partial<MyComponentProps>) => !p.showTitles,
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 0.15,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.45,
        hidden: (p: Partial<MyComponentProps>) => !p.showTitles,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: (p: Partial<MyComponentProps>) => !p.showTitles,
    },
    enableLinks: {
        type: ControlType.Boolean,
        title: "Enable Links",
        defaultValue: true,
        description: "Click an image to open its link",
    },
    captureScroll: {
        type: ControlType.Boolean,
        title: "Capture Scroll",
        defaultValue: true,
        description: "Wheel/touch drives gallery instead of page",
    },
    transparentBg: {
        type: ControlType.Boolean,
        title: "Transparent BG",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
        hidden: (p: Partial<MyComponentProps>) => !!p.transparentBg,
    },
    seed: {
        type: ControlType.Number,
        title: "Layout Seed",
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 7,
        description: "Change to reshuffle positions",
    },
})
