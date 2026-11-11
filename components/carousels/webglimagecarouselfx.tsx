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


// ─── Default images ───────────────────────────────────────────────────────────

const DEFAULT_IMAGES = [
    "https://i.ibb.co.com/fYZm79Sn/Blurred-Portrait-Outdoors.png",
    "https://i.ibb.co.com/Cs8cwFTP/Serene-Portrait-Outdoors.png",
    "https://i.ibb.co.com/7d8VtycV/Skier-in-Snowy-Forest.png",
    "https://i.ibb.co.com/h1VGFCg2/Sunset-Serenity.png",
    "https://i.ibb.co.com/6JLnbpfz/visualelectric-1759560749255.png",
    "https://i.ibb.co.com/2YvKtrYg/visualelectric-1759560765488.png",
    "https://i.ibb.co.com/Z6bz0qss/visualelectric-1759560770609.png",
    "https://i.ibb.co.com/8DywMStz/visualelectric-1760165011067.png",
    "https://i.ibb.co.com/Y4pb4Bbx/visualelectric-1760165065844.jpg",
    "https://i.ibb.co.com/PsL75TgK/visualelectric-1760165086031.png",
    "https://i.ibb.co.com/ZR4SyfRB/Woman-in-Green-Jacket.png",
    "https://i.ibb.co.com/kgQhD7QS/visualelectric-1771663523750.png",
    "https://i.ibb.co.com/NnSzLT32/Joyful-Portrait-Outdoors.png",
    "https://i.ibb.co.com/mCCVNWQc/Man-Relaxing-Outdoors.png",
    "https://i.ibb.co.com/whtHQDTQ/Playful-Starry-Portrait.png",
    "https://i.ibb.co.com/HTSTYBCt/Neutral-Portrait.png",
    "https://i.ibb.co.com/DDg9CmcY/Cheerful-Sunglasses-Portrait.png",
]

// ─── Constants (matches original planeSettings exactly) ──────────────────────

const PLANE_W = 1.0 // planeSettings.width
const PLANE_H = 2.5 // planeSettings.height
const SPEED_WHEEL = 0.02 // original speedWheel
const SPEED_DRAG = -0.3 // original speedDrag
const CAM_FOV = 75
const CAM_Z = 5

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Same lerp used in original utils/index.js
const lerp = (v0: number, v1: number, t: number) => v0 * (1 - t) + v1 * t

// power3.out easing — matches GSAP default used in original
const p3out = (t: number) => 1 - Math.pow(1 - t, 3)

// Compute Three.js world-space viewport dimensions for PerspectiveCamera
const worldViewport = (w: number, h: number) => {
    const fovRad = (CAM_FOV * Math.PI) / 180
    const vh = 2 * CAM_Z * Math.tan(fovRad / 2)
    return { vw: vh * (w / h), vh }
}

// ─── Plane vertex shader — exact copy from Plane.js ──────────────────────────

const VERT = `
varying vec2 vUv;
uniform float uProgress;
uniform vec2 uZoomScale;

void main() {
    vUv = uv;
    vec3 pos = position;
    float angle = uProgress * 3.14159265 / 2.;
    float wave = cos(angle);
    float c = sin(length(uv - .5) * 15. + uProgress * 12.) * .5 + .5;
    pos.x *= mix(1., uZoomScale.x + wave * c, uProgress);
    pos.y *= mix(1., uZoomScale.y + wave * c, uProgress);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

// ─── Plane fragment shader — exact copy from Plane.js ────────────────────────

const FRAG = `
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uZoomScale;
uniform vec2 uImageRes;

/*------------------------------
Background Cover UV
--------------------------------
u = basic UV
s = screensize
i = image size
------------------------------*/
vec2 CoverUV(vec2 u, vec2 s, vec2 i) {
    float rs = s.x / s.y; // Aspect screen size
    float ri = i.x / i.y; // Aspect image size
    vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x); // New st
    vec2 o = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, (st.y - s.y) / 2.0)) / st; // Offset
    return u * s / st + o;
}

varying vec2 vUv;
void main() {
    vec2 uv = CoverUV(vUv, uRes, uImageRes);
    vec3 tex = texture2D(uTex, uv).rgb;
    gl_FragColor = vec4(tex, 1.0);
}
`

// ─── Post-processing shaders — approximates MeshTransmissionMaterial ──────────
// Original: speed → thickness on MeshTransmissionMaterial with
//   transmission=0.7, chromaticAberration=0.06, ior=0.9, roughness=0
// We approximate: render scene to RT → fullscreen quad with wave warp + chroma split

const POST_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`

const POST_FRAG = `
uniform sampler2D uTex;
uniform float uThickness; // directly = speed, same as original thickness = speed.current
varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    // Wave distortion proportional to scroll speed
    float s = uThickness * 0.012;
    uv.x += sin(uv.y * 20.0) * s;
    uv.y += cos(uv.x * 20.0) * s;
    // Chromatic aberration (matches original chromaticAberration=0.06 feel)
    float ch = 0.003 + uThickness * 0.006;
    float r = texture2D(uTex, clamp(uv + vec2(ch, 0.0), 0.0, 1.0)).r;
    float g = texture2D(uTex, clamp(uv, 0.0, 1.0)).g;
    float b = texture2D(uTex, clamp(uv - vec2(ch, 0.0), 0.0, 1.0)).b;
    gl_FragColor = vec4(r, g, b, 1.0);
}
`

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function WebGLCarousel(props: any) {
    const {
        images,
        backgroundColor,
        gap,
        enableDistortion,
        scrollSpeed,
        dragSpeed,
        enableClick,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const rafRef = React.useRef<number>(0)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Deep-compare images array by value (avoids re-runs on stable arrays)
    const imageKey = React.useMemo(
        () => (Array.isArray(images) ? images.filter(Boolean).join(",") : ""),
        [images]
    )

    React.useEffect(() => {
        if (isCanvas) return
        const container = containerRef.current
        if (!container) return

        // Resolve prop values
        const imgs: string[] =
            Array.isArray(images) && images.filter(Boolean).length
                ? images.filter(Boolean)
                : DEFAULT_IMAGES
        const gapVal = typeof gap === "number" ? gap : 0.1
        const bgHex = backgroundColor ?? "#111111"
        const spdW = typeof scrollSpeed === "number" ? scrollSpeed : SPEED_WHEEL
        // dragSpeed prop is the magnitude; negate internally to match original speedDrag=-0.3
        const spdD = -(typeof dragSpeed === "number" ? dragSpeed : 0.3)
        const clickOn = enableClick !== false
        const count = imgs.length

        // ── Renderer ──────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        renderer.setClearColor(new THREE.Color(bgHex), 1)
        const canvas = renderer.domElement
        container.appendChild(canvas)

        // ── Scene + Camera ────────────────────────────────────────────────────
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 1000)
        camera.position.z = CAM_Z

        // ── Initial size — must happen before item creation so uZoomScale is correct
        const W0 = container.clientWidth || 1200
        const H0 = container.clientHeight || 800
        renderer.setSize(W0, H0)
        camera.aspect = W0 / H0
        camera.updateProjectionMatrix()
        let { vw, vh } = worldViewport(W0, H0)

        // ── Render target + post-processing quad ──────────────────────────────
        const rt = new THREE.WebGLRenderTarget(W0, H0, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
        })
        const postMat = new THREE.ShaderMaterial({
            uniforms: {
                uTex: { value: rt.texture },
                uThickness: { value: 0 },
            },
            vertexShader: POST_VERT,
            fragmentShader: POST_FRAG,
            depthTest: false,
            depthWrite: false,
        })
        const postScene = new THREE.Scene()
        const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat))

        // ── Placeholder texture (1×1 mid-gray) ───────────────────────────────
        const phTex = new THREE.DataTexture(
            new Uint8Array([70, 70, 70, 255]),
            1,
            1,
            THREE.RGBAFormat
        )
        phTex.needsUpdate = true

        // ── Build carousel items ──────────────────────────────────────────────
        type ProgAnim = { from: number; to: number; t0: number; dur: number }
        type ResAnim = {
            fx: number
            fy: number
            tx: number
            ty: number
            t0: number
            dur: number
        }
        type Item = {
            mesh: THREE.Mesh
            u: {
                uProgress: { value: number }
                uZoomScale: { value: THREE.Vector2 }
                uTex: { value: THREE.Texture }
                uRes: { value: THREE.Vector2 }
                uImageRes: { value: THREE.Vector2 }
            }
            pa: ProgAnim | null // progress (expand) animation
            ra: ResAnim | null // uRes (cover UV) animation
            scaleTgt: number
            scaleCur: number
        }

        const items: Item[] = imgs.map((_: string, i: number) => {
            const u = {
                uProgress: { value: 0 },
                uZoomScale: {
                    value: new THREE.Vector2(vw / PLANE_W, vh / PLANE_H),
                },
                uTex: { value: phTex as THREE.Texture },
                uRes: { value: new THREE.Vector2(PLANE_W, PLANE_H) },
                uImageRes: { value: new THREE.Vector2(1, 1) },
            }
            const mat = new THREE.ShaderMaterial({
                uniforms: u as any,
                vertexShader: VERT,
                fragmentShader: FRAG,
            })
            // PlaneGeometry with 30 segments each side — matches original args=[width, height, 30, 30]
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(PLANE_W, PLANE_H, 30, 30),
                mat
            )
            // Initial position: spread out linearly like original (active=0 at center)
            mesh.position.set(i * (PLANE_W + gapVal), 0, -0.01)
            scene.add(mesh)
            return { mesh, u, pa: null, ra: null, scaleTgt: 1, scaleCur: 1 }
        })

        // ── Texture loader ────────────────────────────────────────────────────
        let dead = false
        const loader = new THREE.TextureLoader()
        ;(loader as any).crossOrigin = "anonymous"
        imgs.forEach((url: string, i: number) => {
            loader.load(
                url,
                (tex) => {
                    if (dead) {
                        tex.dispose()
                        return
                    }
                    tex.needsUpdate = true
                    items[i].u.uTex.value = tex
                    // Same as original: tex.source.data.width / height
                    const img = tex.image as HTMLImageElement
                    items[i].u.uImageRes.value.set(
                        img.naturalWidth || img.width || 1,
                        img.naturalHeight || img.height || 1
                    )
                },
                undefined,
                () => {
                    /* ignore load errors — placeholder stays */
                }
            )
        })

        // ── Interaction state (plain mutable vars — no React state) ───────────
        // Original uses useRef for all of these
        let progress = 0 // clamped to 0–100 each frame (original behaviour)
        let oldProgress = 0 // for speed calculation (original: oldProgress.current)
        let speed = 0 // for post-processing thickness (original: speed.current)
        let isDown = false
        let startX = 0
        let activeIdx = -1 // which item is expanded (-1 = none)
        let hoveredIdx = -1 // which item is hovered
        let mx = 0,
            my = 0 // normalized mouse coords for raycasting
        let frame = 0

        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        // ── Animation helpers ─────────────────────────────────────────────────
        // Original uses gsap.to with duration=2.5, ease=power3.out
        // We replicate with explicit timed easing
        const animProg = (item: Item, to: number) => {
            item.pa = {
                from: item.u.uProgress.value,
                to,
                t0: performance.now(),
                dur: 2500,
            }
        }
        const animRes = (item: Item, tx: number, ty: number) => {
            item.ra = {
                fx: item.u.uRes.value.x,
                fy: item.u.uRes.value.y,
                tx,
                ty,
                t0: performance.now(),
                dur: 2500,
            }
        }

        // ── getPiramidalIndex — exact port of original utils/index.js ─────────
        // array.map((_, i) => index === i ? array.length : array.length - Math.abs(index - i))
        const getPiramidalIndex = (active: number): number[] =>
            Array.from({ length: count }, (_, i) =>
                i === active ? count : count - Math.abs(active - i)
            )

        // ── RAF render loop — matches original useFrame ───────────────────────
        const tick = () => {
            if (dead) return
            rafRef.current = requestAnimationFrame(tick)
            frame++

            // Clamp progress 0–100 — exact match to original
            progress = Math.max(0, Math.min(progress, 100))

            // active index — exact match to original
            const active = Math.floor((progress / 100) * (count - 1))
            const pyr = getPiramidalIndex(active)

            // ── Position each item — matches original displayItems ─────────────
            // gsap.to(item.position, { x: (index-active)*(w+gap), y: count*-0.1+pyr[i]*0.1 })
            items.forEach(({ mesh }, i) => {
                const tx = (i - active) * (PLANE_W + gapVal)
                const ty = count * -0.1 + pyr[i] * 0.1
                // z: active item slightly forward (original: z=0 active, z=-0.01 otherwise)
                const tz = i === activeIdx ? 0 : -0.01

                // Lerp ≈ gsap.to duration:2.5 power3.out (initial velocity 1.2/s → 0.02/frame)
                mesh.position.x = lerp(mesh.position.x, tx, 0.02)
                mesh.position.y = lerp(mesh.position.y, ty, 0.02)
                // z uses original's 0.2s duration → factor ≈ 0.15
                mesh.position.z = lerp(mesh.position.z, tz, 0.15)
            })

            // ── Speed — exact match to original ──────────────────────────────
            // speed.current = lerp(speed, |oldProgress - progress|, 0.1)
            // oldProgress = lerp(oldProgress, progress, 0.1)
            speed = lerp(speed, Math.abs(oldProgress - progress), 0.1)
            oldProgress = lerp(oldProgress, progress, 0.1)

            // ── Post-processing thickness — DIRECT assignment, matches original ─
            // Original: $post.current.thickness = speed.current  (no extra lerp)
            postMat.uniforms.uThickness.value = activeIdx !== -1 ? 0 : speed

            // ── Per-item animation ticks (uProgress + uRes) ───────────────────
            const now = performance.now()
            items.forEach((item) => {
                if (item.pa) {
                    const { from, to, t0, dur } = item.pa
                    const raw = Math.min(1, (now - t0) / dur)
                    item.u.uProgress.value = lerp(from, to, p3out(raw))
                    if (raw >= 1) {
                        item.u.uProgress.value = to
                        item.pa = null
                    }
                }
                if (item.ra) {
                    const { fx, fy, tx, ty, t0, dur } = item.ra
                    const raw = Math.min(1, (now - t0) / dur)
                    const t = p3out(raw)
                    item.u.uRes.value.set(lerp(fx, tx, t), lerp(fy, ty, t))
                    if (raw >= 1) {
                        item.u.uRes.value.set(tx, ty)
                        item.ra = null
                    }
                }
                // Scale lerp — original gsap ~0.5s power3.out → factor ≈ 0.1
                item.scaleCur = lerp(item.scaleCur, item.scaleTgt, 0.1)
                item.mesh.scale.setScalar(item.scaleCur)
            })

            // ── Hover raycasting (every 3 frames for performance) ─────────────
            if (activeIdx === -1 && frame % 3 === 0) {
                mouse.set(mx, my)
                raycaster.setFromCamera(mouse, camera)
                const hits = raycaster.intersectObjects(
                    items.map((it) => it.mesh)
                )
                const hIdx =
                    hits.length > 0
                        ? items.findIndex((it) => it.mesh === hits[0].object)
                        : -1
                if (hIdx !== hoveredIdx) {
                    if (hoveredIdx >= 0) items[hoveredIdx].scaleTgt = 1
                    hoveredIdx = hIdx
                    if (hIdx >= 0) items[hIdx].scaleTgt = 1.1 // original hover scale
                }
            }

            // ── Render ────────────────────────────────────────────────────────
            if (enableDistortion) {
                // 1. Render scene to render target
                renderer.setRenderTarget(rt)
                renderer.render(scene, camera)
                // 2. Post-process to screen (glass warp + chromatic aberration)
                renderer.setRenderTarget(null)
                renderer.render(postScene, postCam)
            } else {
                renderer.setRenderTarget(null)
                renderer.render(scene, camera)
            }
        }
        tick()

        // ── Input event handlers — match original exactly ─────────────────────
        canvas.style.cursor = "grab"

        // handleWheel — identical logic to original
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            if (activeIdx !== -1) return
            const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX)
            const wheelProgress = isVerticalScroll ? e.deltaY : e.deltaX
            progress += wheelProgress * spdW
        }

        // handleDown — original: isDown=true, record startX
        const onDown = (e: PointerEvent) => {
            if (activeIdx !== -1) return
            isDown = true
            startX = e.clientX || 0
            canvas.style.cursor = "grabbing"
        }

        // handleUp
        const onUp = () => {
            isDown = false
            canvas.style.cursor = activeIdx !== -1 ? "default" : "grab"
        }

        // handleMove — original: (x - startX) * speedDrag
        const onMove = (e: PointerEvent) => {
            // Update mouse for raycasting
            const rect = canvas.getBoundingClientRect()
            mx = ((e.clientX - rect.left) / rect.width) * 2 - 1
            my = -((e.clientY - rect.top) / rect.height) * 2 + 1

            if (activeIdx !== -1 || !isDown) return
            const x = e.clientX || 0
            const mouseProgress = (x - startX) * spdD // spdD is negative = inverted drag
            progress += mouseProgress
            startX = x
        }

        // Click — activate or close expanded card
        const onClick = (e: MouseEvent) => {
            if (!clickOn) return

            if (activeIdx !== -1) {
                // Close — reset the active item
                const ai = activeIdx
                activeIdx = -1
                hoveredIdx = -1
                animProg(items[ai], 0)
                animRes(items[ai], PLANE_W, PLANE_H)
                items[ai].scaleTgt = 1
                canvas.style.cursor = "grab"
                return
            }

            // Raycast to find clicked card
            const rect = canvas.getBoundingClientRect()
            mouse.set(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            )
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(items.map((it) => it.mesh))

            if (hits.length > 0) {
                const idx = items.findIndex((it) => it.mesh === hits[0].object)
                if (idx >= 0) {
                    // Reset previous hover
                    if (hoveredIdx >= 0) {
                        items[hoveredIdx].scaleTgt = 1
                        hoveredIdx = -1
                    }

                    activeIdx = idx

                    // Original: progress.current = (activePlane / ($items.length - 1)) * 100
                    progress = count > 1 ? (idx / (count - 1)) * 100 : 0

                    animProg(items[idx], 1)
                    animRes(items[idx], vw, vh)
                    items[idx].scaleTgt = 1
                    canvas.style.cursor = "default"
                }
            }
        }

        canvas.addEventListener("wheel", onWheel, { passive: false })
        canvas.addEventListener("pointerdown", onDown)
        window.addEventListener("pointerup", onUp)
        canvas.addEventListener("pointerleave", onUp) // original: onPointerLeave → handleUp
        canvas.addEventListener("pointercancel", onUp) // original: onPointerCancel → handleUp
        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("click", onClick)

        // ── ResizeObserver — update renderer, RT, camera, uniforms ───────────
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width: w, height: h } = entry.contentRect
                if (!w || !h) continue
                renderer.setSize(w, h)
                rt.setSize(w, h)
                camera.aspect = w / h
                camera.updateProjectionMatrix()
                const vp = worldViewport(w, h)
                vw = vp.vw
                vh = vp.vh
                items.forEach((item, i) => {
                    item.u.uZoomScale.value.set(vw / PLANE_W, vh / PLANE_H)
                    // Keep uRes in sync for the expanded item
                    if (activeIdx === i) item.u.uRes.value.set(vw, vh)
                })
            }
        })
        ro.observe(container)

        // ── Cleanup ───────────────────────────────────────────────────────────
        return () => {
            dead = true
            cancelAnimationFrame(rafRef.current)
            canvas.removeEventListener("wheel", onWheel)
            canvas.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointerup", onUp)
            canvas.removeEventListener("pointerleave", onUp)
            canvas.removeEventListener("pointercancel", onUp)
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("click", onClick)
            ro.disconnect()
            items.forEach(({ mesh, u }) => {
                mesh.geometry.dispose()
                ;(mesh.material as THREE.ShaderMaterial).dispose()
                if (u.uTex.value !== phTex) u.uTex.value.dispose()
            })
            phTex.dispose()
            rt.dispose()
            postMat.dispose()
            renderer.dispose()
            if (container.contains(canvas)) container.removeChild(canvas)
        }
    }, [
        imageKey,
        backgroundColor,
        gap,
        enableDistortion,
        scrollSpeed,
        dragSpeed,
        enableClick,
        isCanvas,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background: isCanvas
                    ? (backgroundColor ?? "#111111")
                    : undefined,
            }}
        >
            {isCanvas && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        fontSize: 14,
                        fontFamily: "sans-serif",
                        letterSpacing: "0.05em",
                        userSelect: "none",
                    }}
                >
                    View preview to watch animation
                </div>
            )}
        </div>
    )
}

WebGLCarousel.defaultProps = {
    images: DEFAULT_IMAGES,
    backgroundColor: "#111111",
    gap: 0.1,
    enableDistortion: true,
    scrollSpeed: SPEED_WHEEL,
    dragSpeed: 0.3,
    enableClick: true,
}

addPropertyControls(WebGLCarousel, {
    images: {
        title: "Images",
        type: ControlType.Array,
        control: { type: ControlType.Image },
        defaultValue: DEFAULT_IMAGES,
        maxCount: 30,
    },
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#111111",
    },
    gap: {
        title: "Card Gap",
        type: ControlType.Number,
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
        description:
            "Space between cards (3D world units, matches original gap: 0.1)",
    },
    enableDistortion: {
        title: "Glass Warp",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Speed-driven glass distortion + chromatic aberration",
    },
    scrollSpeed: {
        title: "Scroll Speed",
        type: ControlType.Number,
        defaultValue: SPEED_WHEEL,
        min: 0.005,
        max: 0.1,
        step: 0.005,
        displayStepper: true,
        description: "Original default: 0.02",
    },
    dragSpeed: {
        title: "Drag Speed",
        type: ControlType.Number,
        defaultValue: 0.3,
        min: 0.05,
        max: 1.0,
        step: 0.05,
        displayStepper: true,
        description:
            "Original default: 0.3 (negated internally for natural drag)",
    },
    enableClick: {
        title: "Click to Expand",
        type: ControlType.Boolean,
        defaultValue: true,
        description: "Click a card to expand it fullscreen with ripple shader",
    },
})
