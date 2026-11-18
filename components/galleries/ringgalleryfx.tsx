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

import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"
import gsap from "gsap"

// ─── Shaders ─────────────────────────────────────────────────────────────────

const VERT_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG_SHADER = /* glsl */ `
uniform float iTime;
uniform vec2 iResolution;
uniform sampler2D tDiffuse;
varying vec2 vUv;
uniform vec3 uBgColor;
uniform float uRGBShiftIntensity;
uniform float uGrainIntensity;
uniform float uVignetteIntensity;
uniform float uTransitionProgress;

highp float rng(vec2 co) {
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt = dot(co.xy, vec2(a, b));
    highp float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}

vec4 rgbShift(sampler2D tex, vec2 uv, float amt) {
    float n = rng(uv + iTime) * 0.5 + 0.5;
    vec2 off = amt * vec2(cos(n), sin(n));
    return vec4(
        texture2D(tex, uv + off).r,
        texture2D(tex, uv + off * 0.5).g,
        texture2D(tex, uv + off * 0.25).b,
        1.0
    );
}

vec3 applyGrain(vec2 uv, vec3 col, float amt) {
    return col + (rng(uv + iTime) - 0.5) * amt;
}

vec3 applyVignette(vec2 uv, vec3 col, vec3 vigCol, float amt) {
    vec2 p = uv - 0.5;
    float mask = pow(smoothstep(0.5, 0.3, length(p)), 0.6);
    return mix(col, vigCol, (1.0 - mask) * amt);
}

vec3 applyReveal(vec2 uv, vec3 col, float prog) {
    float ratio = iResolution.x / iResolution.y;
    vec2 p = (uv - 0.5) * vec2(ratio, 1.0);
    float d = length(p) - prog * sqrt(2.2);
    float c = smoothstep(-0.2, 0.0, d);
    return mix(vec3(1.0), col, 1.0 - c);
}

void main() {
    vec4 tex = rgbShift(tDiffuse, vUv, uRGBShiftIntensity);
    vec3 col = applyGrain(vUv, tex.rgb, uGrainIntensity);
    col = applyVignette(vUv, col, uBgColor, uVignetteIntensity);
    col = applyReveal(vUv, col, uTransitionProgress);
    gl_FragColor = vec4(col, 1.0);
}
`

// ─── Utilities ────────────────────────────────────────────────────────────────

const sumFormula = (n: number) => (n * (n + 1)) / 2
const isOdd = (n: number) => n % 2 === 1

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function RingGallery(props: any) {
    const {
        bgColor,
        rotateSpeed,
        rgbShiftIntensity,
        grainIntensity,
        vignetteIntensity,
        showTitle,
        titleText,
        font,
        titleColor,
        images,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rafRef = React.useRef<number>(0)
    const uniformsRef = React.useRef<any>(null)
    const sceneRef = React.useRef<THREE.Scene | null>(null)
    const entryRef = React.useRef({
        transitionProgress: 0,
        enterProgress: 0,
        speedBoost: 9,
    })
    const speedRef = React.useRef<number>(rotateSpeed)

    // mesh → full-size URL map, populated when rings are built
    const meshUrlMapRef = React.useRef<Map<THREE.Mesh, string>>(new Map())
    // stable ref to state setter so the Three.js effect can trigger React state
    const openLightboxRef = React.useRef<(url: string) => void>(() => {})

    const [loading, setLoading] = React.useState(true)
    const [revealed, setRevealed] = React.useState(false)
    const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null)

    // Keep openLightboxRef current on every render
    openLightboxRef.current = setLightboxUrl

    // ── Live prop sync (no remount) ────────────────────────────────────────────
    React.useEffect(() => {
        speedRef.current = rotateSpeed
        const u = uniformsRef.current
        if (!u) return
        u.uRGBShiftIntensity.value = rgbShiftIntensity
        u.uGrainIntensity.value = grainIntensity
        u.uVignetteIntensity.value = vignetteIntensity
        u.uBgColor.value.set(bgColor)
        if (sceneRef.current) {
            sceneRef.current.background = new THREE.Color(bgColor)
        }
    }, [
        rotateSpeed,
        rgbShiftIntensity,
        grainIntensity,
        vignetteIntensity,
        bgColor,
    ])

    // Rebuild when images change
    const imagesKey = (images || []).filter(Boolean).join(",")

    React.useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        // Reset state for this run
        setLoading(true)
        setRevealed(false)
        meshUrlMapRef.current.clear()

        let alive = true

        const rect = container.getBoundingClientRect()
        const W = rect.width || 800
        const H = rect.height || 600

        // ── Renderer ──────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
        renderer.setSize(W, H, false)
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))

        // ── 3D scene ──────────────────────────────────────────────────────────
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(bgColor)
        sceneRef.current = scene
        const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 100)
        camera.position.z = 16

        // ── Post-processing ────────────────────────────────────────────────────
        const rt = new THREE.WebGLRenderTarget(W, H)
        const postScene = new THREE.Scene()
        const postCam = new THREE.OrthographicCamera(
            -0.5,
            0.5,
            0.5,
            -0.5,
            0.1,
            10
        )
        postCam.position.z = 1

        const uniforms: Record<string, { value: any }> = {
            tDiffuse: { value: rt.texture },
            iTime: { value: 0 },
            iResolution: { value: new THREE.Vector2(W, H) },
            uBgColor: { value: new THREE.Color(bgColor) },
            uRGBShiftIntensity: { value: rgbShiftIntensity },
            uGrainIntensity: { value: grainIntensity },
            uVignetteIntensity: { value: vignetteIntensity },
            uTransitionProgress: { value: 0 },
        }
        uniformsRef.current = uniforms

        const postMat = new THREE.ShaderMaterial({
            vertexShader: VERT_SHADER,
            fragmentShader: FRAG_SHADER,
            uniforms,
        })
        const postGeo = new THREE.PlaneGeometry(1, 1)
        postScene.add(new THREE.Mesh(postGeo, postMat))

        // ── Scroll state ──────────────────────────────────────────────────────
        const scroll = { current: 0, target: 0, delta: 0 }

        // ── Ring disposables ──────────────────────────────────────────────────
        const rings: THREE.Group[] = []
        const lines: THREE.Group[] = []
        const toDispose: Array<
            THREE.BufferGeometry | THREE.Material | THREE.Texture
        > = []

        // ── Image sources ─────────────────────────────────────────────────────
        // User images take priority; fall back to picsum
        const userImgs: string[] = (images || []).filter(Boolean)
        const hasUser = userImgs.length > 0

        // Build per-slot URL lists (72 total slots: 12+24+36)
        const CC = 3
        const CIU = 12
        const totalSlots = sumFormula(CC) * CIU // 72

        const texUrlFor = (slot: number) =>
            hasUser
                ? userImgs[slot % userImgs.length]
                : `https://picsum.photos/id/${(slot % 12) + 1}/320/400`

        const fullUrlFor = (slot: number) =>
            hasUser
                ? userImgs[slot % userImgs.length]
                : `https://picsum.photos/id/${(slot % 12) + 1}/1200/1600`

        // Deduplicate texture URLs to avoid loading the same image twice
        const uniqueTexUrls = [
            ...new Set(
                Array.from({ length: totalSlots }, (_, i) => texUrlFor(i))
            ),
        ]

        // ── Texture loading ────────────────────────────────────────────────────
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin("anonymous")

        const loadUrl = (url: string): Promise<THREE.Texture> =>
            new Promise((resolve) => {
                loader.load(
                    url,
                    (t) => {
                        if ((THREE as any).SRGBColorSpace) {
                            t.colorSpace = (THREE as any).SRGBColorSpace
                        }
                        resolve(t)
                    },
                    undefined,
                    () => {
                        const fb = new THREE.DataTexture(
                            new Uint8Array([55, 55, 65, 255]),
                            1,
                            1
                        )
                        fb.needsUpdate = true
                        resolve(fb)
                    }
                )
            })

        Promise.all(uniqueTexUrls.map(loadUrl)).then((loadedTextures) => {
            if (!alive) return

            // URL → texture lookup
            const texByUrl = new Map<string, THREE.Texture>()
            uniqueTexUrls.forEach((url, i) =>
                texByUrl.set(url, loadedTextures[i])
            )
            loadedTextures.forEach((t) => toDispose.push(t))

            const R = 6.4
            const scl = 0.8
            let slotIndex = 0

            for (let i = 0; i < CC; i++) {
                const c1 = sumFormula(i) * CIU
                const c2 = sumFormula(i + 1) * CIU
                const cnt = c2 - c1

                const ring = new THREE.Group()
                scene.add(ring)
                rings.push(ring)

                for (let j = 0; j < cnt; j++, slotIndex++) {
                    const line = new THREE.Group()
                    ring.add(line)
                    lines.push(line)

                    const tUrl = texUrlFor(slotIndex)
                    const fUrl = fullUrlFor(slotIndex)
                    const tex = texByUrl.get(tUrl)!

                    const imgScl = 0.005 * scl * (i * 0.36 + 1)
                    const geo = new THREE.PlaneGeometry(
                        320 * imgScl,
                        400 * imgScl
                    )
                    const mat = new THREE.MeshBasicMaterial({
                        map: tex,
                        side: THREE.DoubleSide,
                    })
                    const mesh = new THREE.Mesh(geo, mat)

                    // Register for raycasting + lightbox
                    meshUrlMapRef.current.set(mesh, fUrl)

                    mesh.position.x = R * (i + 1)
                    mesh.rotation.z = -Math.PI / 2
                    line.rotation.z = (j / cnt) * Math.PI * 2
                    line.add(mesh)
                    toDispose.push(geo, mat)
                }
            }

            if (!alive) return
            setLoading(false)

            const ep = entryRef.current
            ep.transitionProgress = 0
            ep.enterProgress = 0
            ep.speedBoost = 9

            gsap.to(ep, {
                transitionProgress: 1,
                duration: 1,
                ease: "power1.inOut",
            })
            gsap.to(ep, {
                speedBoost: 0,
                enterProgress: 1,
                duration: 1.5,
                ease: "power1.inOut",
                onComplete: () => {
                    if (alive) setRevealed(true)
                },
            })
        })

        // ── Raycaster (shared instance) ────────────────────────────────────────
        const raycaster = new THREE.Raycaster()

        const raycastAt = (clientX: number, clientY: number) => {
            const r = container.getBoundingClientRect()
            const nx = ((clientX - r.left) / r.width) * 2 - 1
            const ny = -((clientY - r.top) / r.height) * 2 + 1
            raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera)
            return raycaster.intersectObjects([...meshUrlMapRef.current.keys()])
        }

        // ── Input handlers ─────────────────────────────────────────────────────
        const onWheel = (e: WheelEvent) => {
            scroll.target += e.deltaY
        }

        let dragPrev: { x: number; y: number } | null = null
        let pointerDownAt: { x: number; y: number } | null = null

        const onDown = (e: PointerEvent) => {
            pointerDownAt = { x: e.clientX, y: e.clientY }
            dragPrev = { x: e.clientX, y: e.clientY }
        }

        const onMove = (e: PointerEvent) => {
            // Drag scroll (on window so it works outside container)
            if (dragPrev) {
                const dx = e.clientX - dragPrev.x
                const dy = e.clientY - dragPrev.y
                scroll.target -= (dx + dy) * 2
                dragPrev = { x: e.clientX, y: e.clientY }
                container.style.cursor = "grabbing"
                return
            }

            // Hover cursor — raycast to check if over a mesh
            const r = container.getBoundingClientRect()
            const inside =
                e.clientX >= r.left &&
                e.clientX <= r.right &&
                e.clientY >= r.top &&
                e.clientY <= r.bottom
            if (!inside) return

            const hits = raycastAt(e.clientX, e.clientY)
            container.style.cursor = hits.length > 0 ? "pointer" : "grab"
        }

        const onUp = (e: PointerEvent) => {
            if (pointerDownAt) {
                const dx = e.clientX - pointerDownAt.x
                const dy = e.clientY - pointerDownAt.y
                // Treat as a click if pointer moved less than 8px
                if (Math.sqrt(dx * dx + dy * dy) < 8) {
                    const hits = raycastAt(e.clientX, e.clientY)
                    if (hits.length > 0) {
                        const url = meshUrlMapRef.current.get(
                            hits[0].object as THREE.Mesh
                        )
                        if (url) openLightboxRef.current(url)
                    }
                }
            }
            dragPrev = null
            pointerDownAt = null
        }

        container.addEventListener("wheel", onWheel, { passive: true })
        container.addEventListener("pointerdown", onDown)
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)

        // ── Render loop ────────────────────────────────────────────────────────
        const t0 = performance.now()

        const tick = () => {
            if (!alive) return
            rafRef.current = requestAnimationFrame(tick)

            scroll.current = THREE.MathUtils.lerp(
                scroll.current,
                scroll.target,
                0.1
            )
            scroll.delta = scroll.target - scroll.current

            const ep = entryRef.current

            rings.forEach((ring, i) => {
                ring.rotation.z +=
                    0.0025 *
                    (isOdd(i) ? -1 : 1) *
                    (1 + scroll.delta) *
                    (speedRef.current + ep.speedBoost)
            })

            const zNorm = THREE.MathUtils.clamp(
                THREE.MathUtils.mapLinear(scroll.delta, 0, 1000, 0, 1),
                0,
                1
            )
            lines.forEach((line) => {
                line.position.z =
                    -THREE.MathUtils.lerp(0, 100, zNorm) +
                    THREE.MathUtils.lerp(10, 0, ep.enterProgress)
            })

            uniforms.iTime.value = (performance.now() - t0) / 1000
            uniforms.uTransitionProgress.value = ep.transitionProgress

            renderer.setRenderTarget(rt)
            renderer.render(scene, camera)
            renderer.setRenderTarget(null)
            renderer.render(postScene, postCam)
        }
        tick()

        // ── Resize observer ────────────────────────────────────────────────────
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect
            if (!width || !height) return
            renderer.setSize(width, height, false)
            rt.setSize(width, height)
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            uniforms.iResolution.value.set(width, height)
        })
        ro.observe(container)

        return () => {
            alive = false
            cancelAnimationFrame(rafRef.current)
            ro.disconnect()
            container.removeEventListener("wheel", onWheel)
            container.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            meshUrlMapRef.current.clear()
            toDispose.forEach((d) => d.dispose())
            rt.dispose()
            postGeo.dispose()
            postMat.dispose()
            renderer.dispose()
            sceneRef.current = null
            uniformsRef.current = null
        }
    }, [imagesKey]) // rebuilds when image set changes

    // ── Lightbox close on Escape ───────────────────────────────────────────────
    React.useEffect(() => {
        if (!lightboxUrl) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxUrl(null)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [lightboxUrl])

    // ── Editor placeholder ─────────────────────────────────────────────────────
    if (RenderTarget.current() === RenderTarget.canvas) {
        return (
            <div
                style={{
                    ...style,
                    background: bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div style={{ textAlign: "center", pointerEvents: "none" }}>
                    <div
                        style={{
                            ...font,
                            color: titleColor,
                            letterSpacing: "0.15em",
                        }}
                    >
                        {titleText}
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            color: "#555",
                            marginTop: 8,
                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        View preview to watch animation
                    </div>
                </div>
            </div>
        )
    }

    // ── Live render ────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background: bgColor,
                touchAction: "none",
                userSelect: "none",
            }}
        >
            {/* Three.js canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />

            {/* Loading screen */}
            {loading && (
                <>
                    <style>{`@keyframes rf-blur { to { filter: blur(5px); } }`}</style>
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        <div style={{ display: "flex", gap: 2 }}>
                            {"LOADING".split("").map((ch, i) => (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: 28,
                                        fontWeight: 700,
                                        letterSpacing: "0.1em",
                                        animation: `rf-blur 1.5s ${(i * 0.2).toFixed(1)}s alternate infinite`,
                                    }}
                                >
                                    {ch}
                                </span>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Hero title */}
            {showTitle && !loading && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 5,
                        opacity: revealed ? 1 : 0,
                        transition: "opacity 0.8s ease",
                    }}
                >
                    <div
                        style={{
                            ...font,
                            color: titleColor,
                            textAlign: "center",
                        }}
                    >
                        {titleText}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxUrl && (
                    <motion.div
                        key="lightbox-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onClick={() => setLightboxUrl(null)}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0,0,0,0.92)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 9999,
                            cursor: "zoom-out",
                        }}
                    >
                        {/* Close button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.7 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, delay: 0.15 }}
                            onClick={() => setLightboxUrl(null)}
                            style={{
                                position: "absolute",
                                top: 20,
                                right: 24,
                                background: "none",
                                border: "none",
                                color: "white",
                                fontSize: 36,
                                lineHeight: 1,
                                cursor: "pointer",
                                padding: 0,
                            }}
                        >
                            ×
                        </motion.button>

                        {/* Image — stops click-through so clicking image doesn't close */}
                        <motion.img
                            key={lightboxUrl}
                            src={lightboxUrl}
                            initial={{ opacity: 0, scale: 0.88 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.88 }}
                            transition={{
                                duration: 0.35,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: "90vw",
                                maxHeight: "90vh",
                                objectFit: "contain",
                                borderRadius: 4,
                                boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
                                cursor: "default",
                                display: "block",
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

RingGallery.defaultProps = {
    bgColor: "#0c0c0c",
    rotateSpeed: 1,
    rgbShiftIntensity: 0.0025,
    grainIntensity: 0.025,
    vignetteIntensity: 0.8,
    showTitle: true,
    titleText: "RING",
    titleColor: "#ffffff",
    images: [],
}

addPropertyControls(RingGallery, {
    images: {
        title: "Images",
        type: ControlType.Array,
        control: { type: ControlType.Image },
        defaultValue: [],
        description: "Upload images. Leave empty to use default picsum photos.",
    },
    bgColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#0c0c0c",
    },
    rotateSpeed: {
        title: "Rotate Speed",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
        description: "Steady-state speed after entry animation",
    },
    rgbShiftIntensity: {
        title: "RGB Shift",
        type: ControlType.Number,
        defaultValue: 0.0025,
        min: 0,
        max: 0.02,
        step: 0.0005,
    },
    grainIntensity: {
        title: "Grain",
        type: ControlType.Number,
        defaultValue: 0.025,
        min: 0,
        max: 0.15,
        step: 0.005,
    },
    vignetteIntensity: {
        title: "Vignette",
        type: ControlType.Number,
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    showTitle: {
        title: "Show Title",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    titleText: {
        title: "Title",
        type: ControlType.String,
        defaultValue: "FRAMER",
        hidden: (p: any) => !p.showTitle,
    },
    font: {
        title: "Font",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "80px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            lineHeight: "1em",
        },
        hidden: (p: any) => !p.showTitle,
    },
    titleColor: {
        title: "Color",
        type: ControlType.Color,
        defaultValue: "#ffffff",
        hidden: (p: any) => !p.showTitle,
    },
})
