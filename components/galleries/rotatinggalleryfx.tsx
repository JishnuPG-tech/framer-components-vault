import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "three"

// ─── Default images ────────────────────────────────────────────────────────────
const DEFAULT_IMAGES = [
    "https://i.ibb.co.com/fYZm79Sn/Blurred-Portrait-Outdoors.png",
    "https://i.ibb.co.com/Cs8cwFTP/Serene-Portrait-Outdoors.png",
    "https://i.ibb.co.com/h1VGFCg2/Sunset-Serenity.png",
    "https://i.ibb.co.com/6JLnbpfz/visualelectric-1759560749255.png",
    "https://i.ibb.co.com/2YvKtrYg/visualelectric-1759560765488.png",
    "https://i.ibb.co.com/Z6bz0qss/visualelectric-1759560770609.png",
    "https://i.ibb.co.com/8DywMStz/visualelectric-1760165011067.png",
    "https://i.ibb.co.com/Y4pb4Bbx/visualelectric-1760165065844.jpg",
    "https://i.ibb.co.com/ZR4SyfRB/Woman-in-Green-Jacket.png",
    "https://i.ibb.co.com/kgQhD7QS/visualelectric-1771663523750.png",
    "https://i.ibb.co.com/mCCVNWQc/Man-Relaxing-Outdoors.png",
    "https://i.ibb.co.com/whtHQDTQ/Playful-Starry-Portrait.png",
    "https://i.ibb.co.com/DDg9CmcY/Cheerful-Sunglasses-Portrait.png",
]

// ─── Vertex shader ─────────────────────────────────────────────────────────────
const VS = `precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uPosition;
uniform float uTime;
uniform float uSpeed;
uniform vec3 distortionAxis;
uniform vec3 rotationAxis;
uniform float uDistortion;
varying vec2 vUv;
varying vec3 vNormal;
float PI = 3.141592653589793238;
mat4 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle); float c = cos(angle); float oc = 1.0 - c;
  return mat4(
    oc*axis.x*axis.x+c,          oc*axis.x*axis.y-axis.z*s, oc*axis.z*axis.x+axis.y*s, 0.0,
    oc*axis.x*axis.y+axis.z*s,   oc*axis.y*axis.y+c,          oc*axis.y*axis.z-axis.x*s, 0.0,
    oc*axis.z*axis.x-axis.y*s,   oc*axis.y*axis.z+axis.x*s,   oc*axis.z*axis.z+c,         0.0,
    0.0, 0.0, 0.0, 1.0
  );
}
vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}
float qinticInOut(float t) {
  return t < 0.5
    ? +16.0 * pow(t, 5.0)
    : -0.5 * abs(pow(2.0 * t - 2.0, 5.0)) + 1.0;
}
void main() {
  vUv = uv;
  float norm = 0.5;
  vec3 newpos = position;
  float offset = (dot(distortionAxis, position) + norm / 2.0) / norm;
  float localprogress = clamp(
    (fract(uPosition * 5.0 * 0.01) - 0.01 * uDistortion * offset) / (1.0 - 0.01 * uDistortion),
    0.0, 2.0
  );
  localprogress = qinticInOut(localprogress) * PI;
  newpos = rotate(newpos, rotationAxis, localprogress);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newpos, 1.0);
}`

// ─── Fragment shader ───────────────────────────────────────────────────────────
const FS = `precision highp float;
uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform sampler2D tMap;
varying vec2 vUv;
void main() {
  vec2 ratio = vec2(
    min((uPlaneSize.x / uPlaneSize.y) / (uImageSize.x / uImageSize.y), 1.0),
    min((uPlaneSize.y / uPlaneSize.x) / (uImageSize.y / uImageSize.x), 1.0)
  );
  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
  gl_FragColor.rgb = texture2D(tMap, uv).rgb;
  gl_FragColor.a = 1.0;
}`

// ─── Helpers ───────────────────────────────────────────────────────────────────
function mapRange(n: number, a: number, b: number, c: number, d: number) {
    return c + (d - c) * ((n - a) / (b - a))
}
function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

type VP = { width: number; height: number }

// ─── One image plane + infinite-scroll state ───────────────────────────────────
class MediaItem {
    mesh: THREE.Mesh
    mat: THREE.RawShaderMaterial
    imageUrl: string // exposed for raycaster lookup
    private extra = 0
    y = 0
    height = 0
    heightTotal = 0
    private screen: VP
    private vp: VP
    private length: number
    private idx: number
    private planeW: number
    private planeH: number
    private sp: number
    private align: string
    private tex: THREE.Texture | null = null
    private dead = false

    constructor(p: {
        scene: THREE.Scene
        geometry: THREE.BufferGeometry
        vp: VP
        screen: VP
        image: string
        length: number
        idx: number
        planeW: number
        planeH: number
        sp: number
        distortion: number
        align: string
    }) {
        this.screen = p.screen
        this.vp = p.vp
        this.length = p.length
        this.idx = p.idx
        this.planeW = p.planeW
        this.planeH = p.planeH
        this.sp = p.sp
        this.align = p.align
        this.imageUrl = p.image

        this.mat = new THREE.RawShaderMaterial({
            vertexShader: VS,
            fragmentShader: FS,
            uniforms: {
                tMap: { value: null },
                uPosition: { value: 0 },
                uPlaneSize: { value: new THREE.Vector2(0, 0) },
                uImageSize: { value: new THREE.Vector2(1, 1) },
                uSpeed: { value: 0 },
                rotationAxis: { value: new THREE.Vector3(0, 1, 0) },
                distortionAxis: { value: new THREE.Vector3(1, 1, 0) },
                uDistortion: { value: p.distortion },
                uViewportSize: {
                    value: new THREE.Vector2(p.vp.width, p.vp.height),
                },
                uTime: { value: 0 },
            },
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
        })

        this.mesh = new THREE.Mesh(p.geometry, this.mat)
        this.mesh.renderOrder = p.idx
        p.scene.add(this.mesh)

        const loader = new THREE.TextureLoader()
        loader.crossOrigin = "anonymous"
        loader.load(
            p.image,
            (tex) => {
                if (this.dead) {
                    tex.dispose()
                    return
                }
                tex.generateMipmaps = false
                tex.minFilter = THREE.LinearFilter
                tex.needsUpdate = true
                this.mat.uniforms.tMap.value = tex
                const img = tex.image as HTMLImageElement
                this.mat.uniforms.uImageSize.value.set(
                    img?.naturalWidth || img?.width || 1,
                    img?.naturalHeight || img?.height || 1
                )
                this.tex = tex
            },
            undefined,
            () => {
                /* silent on error */
            }
        )

        this.onResize()
    }

    private setScale() {
        if (!this.screen.width || !this.screen.height) return
        const sw = (this.vp.width * this.planeW) / this.screen.width
        const sh = (this.vp.height * this.planeH) / this.screen.height
        this.mesh.scale.set(sw, sh, 1)
        this.mat.uniforms.uPlaneSize.value.set(sw, sh)
    }

    private setX() {
        const hw = this.mesh.scale.x / 2
        const vHW = this.vp.width / 2
        this.mesh.position.x =
            this.align === "right"
                ? vHW - hw
                : this.align === "center"
                  ? 0
                  : -vHW + hw
    }

    onResize(o: { screen?: VP; vp?: VP; align?: string } = {}) {
        if (o.screen) this.screen = o.screen
        if (o.vp) {
            this.vp = o.vp
            this.mat.uniforms.uViewportSize.value.set(o.vp.width, o.vp.height)
        }
        if (o.align) this.align = o.align
        this.setScale()
        this.height = this.mesh.scale.y + this.sp
        this.heightTotal = this.height * this.length
        this.y = this.height * this.idx
        this.setX()
    }

    update(s: { current: number; last: number }, dir: "up" | "down", vp: VP) {
        this.mesh.position.y = this.y - s.current - this.extra
        this.mat.uniforms.uPosition.value = mapRange(
            this.mesh.position.y,
            -vp.height,
            vp.height,
            5,
            15
        )
        this.mat.uniforms.uTime.value += 0.04
        this.mat.uniforms.uSpeed.value = s.current
        const pOff = this.mesh.scale.y / 2
        if (dir === "up" && this.mesh.position.y + pOff < -vp.height)
            this.extra -= this.heightTotal
        if (dir === "down" && this.mesh.position.y - pOff > vp.height)
            this.extra += this.heightTotal
    }

    setDistortion(v: number) {
        if (this.mat) this.mat.uniforms.uDistortion.value = v
    }

    dispose() {
        this.dead = true
        this.tex?.dispose()
        this.tex = null
        this.mat?.dispose()
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function RotatingGallery(props: {
    images?: string[]
    backgroundColor?: string
    distortion?: number
    scrollEase?: number
    scrollSpeed?: number
    planeWidth?: number
    planeHeight?: number
    spacing?: number
    alignment?: string
    enableLightbox?: boolean
    style?: React.CSSProperties
}) {
    const {
        images: rawImages,
        backgroundColor = "#0f0f1a",
        distortion = 3,
        scrollEase = 0.05,
        scrollSpeed = 0.005,
        planeWidth = 320,
        planeHeight = 300,
        spacing = 0.8,
        alignment = "center",
        enableLightbox = true,
        style,
    } = props
    const images =
        rawImages && rawImages.length > 0 ? rawImages : DEFAULT_IMAGES

    // ── Three.js refs ───────────────────────────────────────────────────────────
    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null)
    const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null)
    const sceneRef = React.useRef<THREE.Scene | null>(null)
    const geoRef = React.useRef<THREE.PlaneGeometry | null>(null)
    const mediasRef = React.useRef<MediaItem[]>([])

    // ── Scroll / drag refs ──────────────────────────────────────────────────────
    const scrollRef = React.useRef({ current: 0, target: 0, last: 0 })
    const dirRef = React.useRef<"up" | "down">("down")
    const downRef = React.useRef(false)
    const startYRef = React.useRef(0)
    const sPosRef = React.useRef(0)
    const dragStartRef = React.useRef({ x: 0, y: 0 })
    const isDragRef = React.useRef(false) // true when pointer moved > 5 px

    // ── Viewport refs ───────────────────────────────────────────────────────────
    const screenRef = React.useRef<VP>({ width: 0, height: 0 })
    const vpRef = React.useRef<VP>({ width: 0, height: 0 })
    const rafRef = React.useRef(0)

    // ── Live prop refs (accessible inside RAF / event handlers) ─────────────────
    const liveRef = React.useRef({ scrollEase, scrollSpeed })
    liveRef.current = { scrollEase, scrollSpeed }
    const distRef = React.useRef(distortion)
    distRef.current = distortion
    const enableLbRef = React.useRef(enableLightbox)
    enableLbRef.current = enableLightbox

    // ── Lightbox state ──────────────────────────────────────────────────────────
    const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null)
    const [lightboxOpen, setLightboxOpen] = React.useState(false)

    const openLightbox = React.useCallback((src: string) => {
        setLightboxSrc(src)
        // double-rAF ensures the element renders before the CSS transition fires
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setLightboxOpen(true))
        )
    }, [])

    const closeLightbox = React.useCallback(() => {
        setLightboxOpen(false)
        setTimeout(() => setLightboxSrc(null), 420) // matches transition duration
    }, [])

    // Stable ref so the click handler (inside Effect 1) always calls latest version
    const openLightboxRef = React.useRef(openLightbox)
    openLightboxRef.current = openLightbox

    // Escape key closes lightbox
    React.useEffect(() => {
        if (!lightboxOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [lightboxOpen, closeLightbox])

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // ── EFFECT 1: renderer / camera / scene / geometry / RAF / events ───────────
    React.useEffect(() => {
        if (isCanvas) return
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
        })
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        rendererRef.current = renderer

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
        camera.position.z = 20
        cameraRef.current = camera

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const geo = new THREE.PlaneGeometry(1, 1, 100, 1)
        geoRef.current = geo

        const rect = container.getBoundingClientRect()
        const w = rect.width || container.clientWidth
        const h = rect.height || container.clientHeight
        if (w > 0 && h > 0) {
            renderer.setSize(w, h)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            const vpH =
                2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
            screenRef.current = { width: w, height: h }
            vpRef.current = { width: vpH * camera.aspect, height: vpH }
        }

        // Render loop
        const tick = () => {
            const s = scrollRef.current
            s.current = lerp(s.current, s.target, liveRef.current.scrollEase)
            if (s.current > s.last + 1e-4) dirRef.current = "up"
            else if (s.current < s.last - 1e-4) dirRef.current = "down"
            mediasRef.current.forEach((m) =>
                m.update(s, dirRef.current, vpRef.current)
            )
            renderer.render(scene, camera)
            s.last = s.current
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)

        // ── Wheel + drag scroll ─────────────────────────────────────────────────
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            scrollRef.current.target += e.deltaY * liveRef.current.scrollSpeed
        }

        const onDown = (e: MouseEvent | TouchEvent) => {
            downRef.current = true
            isDragRef.current = false // reset drag flag on each new press
            sPosRef.current = scrollRef.current.current
            const x = "touches" in e ? e.touches[0].clientX : e.clientX
            const y = "touches" in e ? e.touches[0].clientY : e.clientY
            startYRef.current = y
            dragStartRef.current = { x, y }
        }

        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!downRef.current) return
            const x = "touches" in e ? e.touches[0].clientX : e.clientX
            const y = "touches" in e ? e.touches[0].clientY : e.clientY
            // Mark as drag once pointer moves more than 5 px
            const dx = x - dragStartRef.current.x
            const dy = y - dragStartRef.current.y
            if (Math.abs(dx) + Math.abs(dy) > 5) isDragRef.current = true
            scrollRef.current.target =
                sPosRef.current + (startYRef.current - y) * 0.1
        }

        const onUp = () => {
            downRef.current = false
        }

        // ── Lightbox click (raycasting) ─────────────────────────────────────────
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        const onClick = (e: MouseEvent) => {
            if (!enableLbRef.current) return
            if (isDragRef.current) return // was a scroll drag, not a tap

            const cam = cameraRef.current
            if (!cam) return

            const cr = canvas.getBoundingClientRect()
            mouse.set(
                ((e.clientX - cr.left) / cr.width) * 2 - 1,
                ((e.clientY - cr.top) / cr.height) * -2 + 1
            )
            raycaster.setFromCamera(mouse, cam)

            const meshes = mediasRef.current.map((m) => m.mesh)
            const intersects = raycaster.intersectObjects(meshes)

            if (intersects.length > 0) {
                const hit = intersects[0].object as THREE.Mesh
                const media = mediasRef.current.find((m) => m.mesh === hit)
                if (media?.imageUrl) openLightboxRef.current(media.imageUrl)
            }
        }

        container.addEventListener("wheel", onWheel, { passive: false })
        container.addEventListener("mousedown", onDown)
        container.addEventListener("click", onClick)
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", onUp)
        container.addEventListener("touchstart", onDown as EventListener, {
            passive: true,
        })
        window.addEventListener("touchmove", onMove as EventListener, {
            passive: true,
        })
        window.addEventListener("touchend", onUp)

        return () => {
            cancelAnimationFrame(rafRef.current)
            container.removeEventListener("wheel", onWheel)
            container.removeEventListener("mousedown", onDown)
            container.removeEventListener("click", onClick)
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", onUp)
            container.removeEventListener("touchstart", onDown as EventListener)
            window.removeEventListener("touchmove", onMove as EventListener)
            window.removeEventListener("touchend", onUp)
            mediasRef.current.forEach((m) => m.dispose())
            mediasRef.current = []
            geo.dispose()
            renderer.dispose()
            rendererRef.current = null
            sceneRef.current = null
            geoRef.current = null
        }
    }, [isCanvas])

    // ── EFFECT 2: create / recreate MediaItems ──────────────────────────────────
    const imagesKey = images.filter(Boolean).join("|")
    React.useEffect(() => {
        if (isCanvas) return
        const scene = sceneRef.current
        const geo = geoRef.current
        if (!scene || !geo) return

        mediasRef.current.forEach((m) => {
            scene.remove(m.mesh)
            m.dispose()
        })
        mediasRef.current = []
        scrollRef.current = { current: 0, target: 0, last: 0 }

        const imgs = images.filter(Boolean)
        if (!imgs.length) return

        mediasRef.current = imgs.map(
            (img, i) =>
                new MediaItem({
                    scene,
                    geometry: geo,
                    vp: { ...vpRef.current },
                    screen: { ...screenRef.current },
                    image: img,
                    length: imgs.length,
                    idx: i,
                    planeW: planeWidth,
                    planeH: planeHeight,
                    sp: spacing,
                    distortion: distRef.current,
                    align: alignment,
                })
        )

        return () => {
            mediasRef.current.forEach((m) => {
                sceneRef.current?.remove(m.mesh)
                m.dispose()
            })
            mediasRef.current = []
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCanvas, imagesKey, planeWidth, planeHeight, spacing, alignment])

    // ── EFFECT 3: live distortion ───────────────────────────────────────────────
    React.useEffect(() => {
        if (isCanvas) return
        mediasRef.current.forEach((m) => m.setDistortion(distortion))
    }, [isCanvas, distortion])

    // ── EFFECT 4: ResizeObserver ────────────────────────────────────────────────
    React.useEffect(() => {
        if (isCanvas) return
        const container = containerRef.current
        if (!container) return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width: w, height: h } = entry.contentRect
                if (!w || !h) continue
                const r = rendererRef.current
                const c = cameraRef.current
                if (!r || !c) continue
                r.setSize(w, h)
                c.aspect = w / h
                c.updateProjectionMatrix()
                const vpH = 2 * Math.tan((c.fov * Math.PI) / 360) * c.position.z
                screenRef.current = { width: w, height: h }
                vpRef.current = { width: vpH * c.aspect, height: vpH }
                mediasRef.current.forEach((m) =>
                    m.onResize({ screen: screenRef.current, vp: vpRef.current })
                )
            }
        })
        ro.observe(container)
        return () => ro.disconnect()
    }, [isCanvas])

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                backgroundColor,
            }}
        >
            {isCanvas ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 14,
                        fontFamily: "sans-serif",
                        pointerEvents: "none",
                    }}
                >
                    View preview to watch animation
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    style={{ position: "absolute", top: 0, left: 0 }}
                />
            )}

            {/* ── Lightbox overlay ─────────────────────────────────────────── */}
            {lightboxSrc && (
                <div
                    onClick={closeLightbox}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        cursor: "zoom-out",
                        // fade in/out
                        opacity: lightboxOpen ? 1 : 0,
                        transition: "opacity 0.4s ease",
                    }}
                >
                    {/* Image card — stop propagation so clicking it doesn't close */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            maxWidth: "80%",
                            maxHeight: "80%",
                            borderRadius: 16,
                            overflow: "hidden",
                            boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
                            // spring-like scale on open/close
                            transform: lightboxOpen
                                ? "scale(1)"
                                : "scale(0.82)",
                            opacity: lightboxOpen ? 1 : 0,
                            transition: [
                                "transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1)",
                                "opacity   0.35s ease",
                            ].join(", "),
                        }}
                    >
                        <img
                            src={lightboxSrc}
                            style={{
                                display: "block",
                                maxWidth: "100%",
                                maxHeight: "80vh",
                                objectFit: "contain",
                                userSelect: "none",
                            }}
                        />

                        {/* Close button */}
                        <button
                            onClick={closeLightbox}
                            style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                border: "none",
                                background: "rgba(0,0,0,0.55)",
                                backdropFilter: "blur(6px)",
                                WebkitBackdropFilter: "blur(6px)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                transition:
                                    "background 0.2s ease, transform 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                ;(
                                    e.currentTarget as HTMLButtonElement
                                ).style.background = "rgba(255,255,255,0.2)"
                                ;(
                                    e.currentTarget as HTMLButtonElement
                                ).style.transform = "scale(1.1)"
                            }}
                            onMouseLeave={(e) => {
                                ;(
                                    e.currentTarget as HTMLButtonElement
                                ).style.background = "rgba(0,0,0,0.55)"
                                ;(
                                    e.currentTarget as HTMLButtonElement
                                ).style.transform = "scale(1)"
                            }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M1 1L13 13M13 1L1 13"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Dismiss hint */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 20,
                            left: "50%",
                            transform: "translateX(-50%)",
                            color: "rgba(255,255,255,0.35)",
                            fontSize: 12,
                            fontFamily: "sans-serif",
                            letterSpacing: "0.05em",
                            pointerEvents: "none",
                            opacity: lightboxOpen ? 1 : 0,
                            transition: "opacity 0.4s ease 0.15s",
                        }}
                    >
                        Click anywhere or press Esc to close
                    </div>
                </div>
            )}
        </div>
    )
}

RotatingGallery.defaultProps = {
    backgroundColor: "#0f0f1a",
    distortion: 3,
    scrollEase: 0.05,
    scrollSpeed: 0.005,
    planeWidth: 320,
    planeHeight: 300,
    spacing: 0.8,
    alignment: "center",
    enableLightbox: true,
}

addPropertyControls(RotatingGallery, {
    images: {
        title: "Images",
        type: ControlType.Array,
        control: { type: ControlType.Image },
    },
    enableLightbox: {
        title: "Lightbox",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#0f0f1a",
    },
    distortion: {
        title: "Distortion",
        type: ControlType.Number,
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 0.1,
        description: "Wave intensity of the Y-axis rotation sweep",
    },
    scrollEase: {
        title: "Scroll Ease",
        type: ControlType.Number,
        defaultValue: 0.05,
        min: 0.001,
        max: 0.3,
        step: 0.001,
        description: "Scroll smoothing — lower = smoother / slower",
    },
    scrollSpeed: {
        title: "Scroll Speed",
        type: ControlType.Number,
        defaultValue: 0.005,
        min: 0.001,
        max: 0.03,
        step: 0.001,
        description: "Mouse-wheel and touch sensitivity",
    },
    planeWidth: {
        title: "Image Width",
        type: ControlType.Number,
        defaultValue: 320,
        min: 50,
        max: 800,
        step: 10,
        unit: "px",
    },
    planeHeight: {
        title: "Image Height",
        type: ControlType.Number,
        defaultValue: 300,
        min: 50,
        max: 600,
        step: 10,
        unit: "px",
    },
    spacing: {
        title: "Gap",
        type: ControlType.Number,
        defaultValue: 0.8,
        min: 0,
        max: 5,
        step: 0.1,
        description: "Gap between images (world units)",
    },
    alignment: {
        title: "Alignment",
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
})
