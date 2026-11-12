/**
 * FloorPerspective
 * An infinite WebGL image/video strip (Three.js) laid flat on a tilted "floor" that
 * recedes into the distance like a runway. Tilt, yaw, camera position and an optional
 * rolling wave are all adjustable; slides fade out toward the horizon. The strip loops
 * forever, drag has momentum, and it auto-scrolls.
 * Renders only while visible; shows a static preview on the Framer canvas.
 *
 * Needs the "three" package. In Framer, `import * as THREE from "three"` resolves it
 * automatically. No CDNs are used.
 */
import { useRef, useState, useEffect } from "react"
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

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FloorPerspective(props: any) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [inView, setInView] = useState(false)
    const paramsRef = useRef(props)
    paramsRef.current = props
    const apiRef = useRef<any>(null)
    const itemsKey = JSON.stringify(props.items || [])

    // --- Viewport detection ---
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    // --- Three.js setup (once) ---
    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (isStatic || !container || !canvas) return

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        const scene = new THREE.Scene()
        const H = 10 // visible world height at the focal plane
        const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 400)
        const geo = new THREE.PlaneGeometry(1, 1, 32, 8)
        const MAX_MESHES = 90

        const shared = {
            uTime: { value: 0 },
            uSize: { value: new THREE.Vector2(5, 3.4) },
            uTilt: { value: 0 },
            uYaw: { value: 0 },
            uOffset: { value: new THREE.Vector3() },
            uWave: { value: 0 },
            uWaveFreq: { value: 0.3 },
            uRadius: { value: 0.15 },
            uCamDist: { value: 13 },
            uFadeOn: { value: 1 },
            uFadeStart: { value: 4 },
            uFadeLen: { value: 14 },
        }

        const vs = `
            uniform float uTime, uTilt, uYaw, uWave, uWaveFreq;
            uniform vec2 uSize;
            uniform vec3 uOffset;
            varying vec2 vUv;
            varying float vDepth;
            void main(){
                vUv = uv;
                vec3 p = position;
                p.x *= uSize.x;
                p.y *= uSize.y;
                // Position along the strip
                float x = p.x + modelMatrix[3].x;
                // Optional rolling wave across the floor surface
                vec3 q = vec3(x, p.y, uWave * sin(x * uWaveFreq + uTime));
                // Lay the strip back onto the floor (rotate around X)
                float ct = cos(uTilt);
                float st = sin(uTilt);
                q = vec3(q.x, q.y * ct + q.z * st, -q.y * st + q.z * ct);
                // Angle the runway into the distance (rotate around Y)
                float ca = cos(uYaw);
                float sa = sin(uYaw);
                q = vec3(q.x * ca + q.z * sa, q.y, -q.x * sa + q.z * ca);
                q += uOffset;
                vec4 mv = viewMatrix * vec4(q, 1.0);
                vDepth = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`

        const fs = `
            uniform sampler2D map;
            uniform float uAsp, uSlideAsp, uRadius, uCamDist, uFadeOn, uFadeStart, uFadeLen;
            uniform vec2 uSize;
            varying vec2 vUv;
            varying float vDepth;
            void main(){
                // Rounded corners
                vec2 h = uSize * 0.5;
                vec2 pp = (vUv - 0.5) * uSize;
                float r = min(uRadius, min(h.x, h.y));
                vec2 d = abs(pp) - (h - r);
                if (length(max(d, 0.0)) > r) discard;

                vec2 uv = vUv - 0.5;
                if (uAsp > uSlideAsp) uv.x *= uSlideAsp / uAsp; else uv.y *= uAsp / uSlideAsp;
                vec4 col = texture2D(map, uv + 0.5);

                // Fade toward the horizon
                float far = vDepth - uCamDist;
                float fade = 1.0 - uFadeOn * smoothstep(uFadeStart, uFadeStart + max(uFadeLen, 0.001), far);
                if (fade <= 0.001) discard;
                gl_FragColor = vec4(col.rgb, col.a * fade);
            }`

        const state = {
            scroll: 0,
            vel: 0,
            dragging: false,
            lastX: 0,
            hover: false,
            auto: 1,
            time: 0,
            playing: false,
            last: 0,
            unit: 1,
            viewW: 20,
        }
        let sources: {
            mat: THREE.ShaderMaterial
            tex: THREE.Texture
            video?: HTMLVideoElement
        }[] = []
        let loadGen = 0
        let meshes: THREE.Mesh[] = []
        let disposed = false

        // Placeholder slides shown when no media is set
        const fallback = () => {
            const palettes = [
                ["#f3b27a", "#e27d5c", "#8a3d4c", "#fff1d6"],
                ["#6f97bd", "#b7cde0", "#2f4f6b", "#ffffff"],
                ["#9cc3a4", "#d9e8c9", "#3d5a40", "#f7f3d0"],
                ["#b9a2e0", "#e6dcf6", "#4b3a73", "#fff6e8"],
                ["#2b2d42", "#4f5d75", "#ef8354", "#ffd6a5"],
            ]
            return palettes.map(([a, b, c, sun]) => {
                const cv = document.createElement("canvas")
                cv.width = 800
                cv.height = 540
                const g = cv.getContext("2d")!
                const grad = g.createLinearGradient(0, 0, 0, 540)
                grad.addColorStop(0, a)
                grad.addColorStop(1, b)
                g.fillStyle = grad
                g.fillRect(0, 0, 800, 540)
                g.fillStyle = sun
                g.beginPath()
                g.arc(560, 200, 70, 0, Math.PI * 2)
                g.fill()
                g.fillStyle = c
                g.beginPath()
                g.moveTo(0, 540)
                for (let x = 0; x <= 800; x += 10)
                    g.lineTo(x, 380 + Math.sin(x * 0.01) * 40)
                g.lineTo(800, 540)
                g.fill()
                return cv
            })
        }

        const clearSlides = () => {
            meshes.forEach((m) => scene.remove(m))
            meshes = []
            sources.forEach((s) => {
                if (s.video) {
                    s.video.pause()
                    s.video.removeAttribute("src")
                    s.video.load()
                }
                s.tex.dispose()
                s.mat.dispose()
            })
            sources = []
        }

        const playVideos = () =>
            sources.forEach((s) => {
                if (!s.video) return
                if (state.playing) s.video.play().catch(() => {})
                else s.video.pause()
            })

        const makeSource = (
            media: any,
            w: number,
            h: number,
            video?: HTMLVideoElement
        ) => {
            const tex: THREE.Texture = video
                ? new THREE.VideoTexture(video)
                : new THREE.Texture(media)
            tex.minFilter = THREE.LinearFilter
            tex.generateMipmaps = false
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
            tex.needsUpdate = true
            const mat = new THREE.ShaderMaterial({
                vertexShader: vs,
                fragmentShader: fs,
                side: THREE.DoubleSide,
                transparent: true,
                uniforms: {
                    ...shared,
                    map: { value: tex },
                    uAsp: { value: w / h },
                    uSlideAsp: { value: 1 },
                },
            })
            return { mat, tex, video }
        }

        // Length of strip needed so the runway reaches the horizon fade
        const span = () => {
            const p = paramsRef.current
            const yaw = Math.abs(shared.uYaw.value)
            const cover = state.viewW / Math.max(Math.cos(yaw), 0.25)
            const fadeReach = p.fade
                ? ((p.fadeStart ?? 4) + (p.fadeLength ?? 14)) /
                  Math.max(Math.sin(yaw), 0.25)
                : cover
            return cover + fadeReach * 2
        }

        // Make enough meshes to cover the runway, reusing sources
        const layout = () => {
            if (!sources.length) return
            const step = shared.uSize.value.x + (paramsRef.current.gap ?? 0.3)
            const need = Math.min(
                Math.ceil((span() + step * 2) / step),
                MAX_MESHES
            )
            const count = Math.max(need, sources.length)
            const total = Math.ceil(count / sources.length) * sources.length
            if (meshes.length === total) return
            meshes.forEach((m) => scene.remove(m))
            meshes = []
            for (let i = 0; i < total; i++) {
                const m = new THREE.Mesh(geo, sources[i % sources.length].mat)
                m.frustumCulled = false
                scene.add(m)
                meshes.push(m)
            }
        }

        // Only Framer-managed uploads are used as media sources
        const resolveItem = (it: any) => {
            if (!it) return null
            const type = it.type === "video" ? "video" : "image"
            const url = type === "video" ? it.video : it.image
            return url ? { type, url: String(url).trim() } : null
        }

        const loadSlides = (items: any[]) => {
            clearSlides()
            const gen = ++loadGen
            const list = (items || []).map(resolveItem).filter(Boolean) as {
                type: string
                url: string
            }[]
            const finish = (loaded: any[]) => {
                if (disposed || gen !== loadGen) return
                loaded.forEach((l) => {
                    if (l)
                        sources.push(
                            makeSource(l.img || l.video, l.w, l.h, l.video)
                        )
                })
                if (!sources.length)
                    fallback().forEach((c) =>
                        sources.push(makeSource(c, 800, 540))
                    )
                layout()
                playVideos()
                render()
            }
            if (!list.length) return finish([])
            const loader = new THREE.ImageLoader()
            loader.setCrossOrigin("anonymous")
            let pending = list.length
            const loaded: any[] = new Array(list.length)
            const done = () => {
                if (--pending <= 0) finish(loaded)
            }
            list.forEach((item, i) => {
                if (item.type === "video") {
                    const v = document.createElement("video")
                    v.crossOrigin = "anonymous"
                    v.muted = true
                    v.loop = true
                    v.playsInline = true
                    v.preload = "auto"
                    v.setAttribute("playsinline", "")
                    v.onloadeddata = () => {
                        if (loaded[i]) return
                        loaded[i] = {
                            video: v,
                            w: v.videoWidth || 16,
                            h: v.videoHeight || 9,
                        }
                        done()
                    }
                    v.onerror = () => done()
                    v.src = item.url
                } else {
                    loader.load(
                        item.url,
                        (img) => {
                            loaded[i] = { img, w: img.width, h: img.height }
                            done()
                        },
                        undefined,
                        () => done()
                    )
                }
            })
        }

        const updateCamera = () => {
            const fov = paramsRef.current.fov ?? 40
            cam.fov = fov
            const dist = H / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2))
            cam.position.set(0, 0, dist)
            cam.updateProjectionMatrix()
            shared.uCamDist.value = dist
        }

        const resize = () => {
            const w = container.clientWidth || 1
            const h = container.clientHeight || 1
            renderer.setSize(w, h, false)
            const a = w / h
            cam.aspect = a
            state.unit = (H * a) / w
            state.viewW = H * a
            updateCamera()
            layout()
            render()
        }

        const render = () => {
            const p = paramsRef.current
            const deg = THREE.MathUtils.degToRad
            shared.uSize.value.set(p.slideWidth ?? 5, p.slideHeight ?? 3.4)
            shared.uTilt.value = deg(p.tilt ?? 55)
            shared.uYaw.value = deg(p.yaw ?? 25)
            shared.uOffset.value.set(
                p.offsetX ?? 0,
                p.offsetY ?? -0.5,
                p.depth ?? 0
            )
            shared.uWave.value = p.wave ?? 0
            shared.uWaveFreq.value = p.waveFreq ?? 0.3
            shared.uRadius.value = p.radius ?? 0.15
            shared.uFadeOn.value = p.fade ? 1 : 0
            shared.uFadeStart.value = p.fadeStart ?? 4
            shared.uFadeLen.value = p.fadeLength ?? 14
            sources.forEach(
                (s) =>
                    (s.mat.uniforms.uSlideAsp.value =
                        shared.uSize.value.x / shared.uSize.value.y)
            )
            updateCamera()
            const step = shared.uSize.value.x + (p.gap ?? 0.3)
            layout()
            const total = meshes.length * step
            meshes.forEach((m, i) => {
                let x = (((i * step + state.scroll) % total) + total) % total
                if (x > total / 2) x -= total
                m.position.x = x
                // Draw far slides first so the fade blends cleanly
                m.renderOrder = -Math.round(
                    x * Math.sign(shared.uYaw.value || 1)
                )
            })
            renderer.render(scene, cam)
        }

        const tick = (now: number) => {
            const p = paramsRef.current
            const dt = Math.min((now - (state.last || now)) / 1000, 0.05)
            state.last = now
            state.time += dt * (p.waveSpeed ?? 0.5)
            shared.uTime.value = state.time
            if (!state.dragging) {
                state.scroll += state.vel * dt * 60
                state.vel *= Math.pow(p.friction ?? 0.95, dt * 60)
                const idle =
                    Math.abs(state.vel) < 0.03 &&
                    !(p.pauseOnHover && state.hover)
                const target = p.autoScroll && idle ? 1 : 0
                state.auto += (target - state.auto) * Math.min(dt * 2.5, 1)
                const dir = p.direction === "right" ? 1 : -1
                state.scroll += dir * (p.autoSpeed ?? 1.5) * state.auto * dt
            }
            render()
        }

        // --- Pointer interaction ---
        const down = (e: PointerEvent) => {
            state.dragging = true
            state.lastX = e.clientX
            state.vel = 0
            container.setPointerCapture(e.pointerId)
            container.style.cursor = "grabbing"
        }
        const move = (e: PointerEvent) => {
            if (!state.dragging) return
            const d =
                (e.clientX - state.lastX) *
                state.unit *
                (paramsRef.current.dragSpeed ?? 1.5)
            state.lastX = e.clientX
            state.scroll += d
            state.vel = d
        }
        const up = () => {
            state.dragging = false
            container.style.cursor = "grab"
        }
        const enter = () => (state.hover = true)
        const leave = () => (state.hover = false)
        const wheel = (e: WheelEvent) => {
            if (!paramsRef.current.wheel) return
            e.preventDefault()
            state.vel -= (e.deltaX || e.deltaY) * state.unit * 0.05
        }
        container.addEventListener("pointerdown", down)
        container.addEventListener("pointermove", move)
        container.addEventListener("pointerup", up)
        container.addEventListener("pointercancel", up)
        container.addEventListener("pointerenter", enter)
        container.addEventListener("pointerleave", leave)
        container.addEventListener("wheel", wheel, { passive: false })

        const ro = new ResizeObserver(resize)
        ro.observe(container)
        resize()

        apiRef.current = {
            tick,
            render,
            loadSlides,
            resetClock: () => (state.last = 0),
            setPlaying: (b: boolean) => {
                state.playing = b
                playVideos()
            },
        }

        return () => {
            disposed = true
            apiRef.current = null
            ro.disconnect()
            container.removeEventListener("pointerdown", down)
            container.removeEventListener("pointermove", move)
            container.removeEventListener("pointerup", up)
            container.removeEventListener("pointercancel", up)
            container.removeEventListener("pointerenter", enter)
            container.removeEventListener("pointerleave", leave)
            container.removeEventListener("wheel", wheel)
            clearSlides()
            geo.dispose()
            renderer.dispose()
        }
    }, [isStatic])

    // --- Reload when the media list changes ---
    useEffect(() => {
        apiRef.current?.loadSlides(paramsRef.current.items || [])
    }, [itemsKey, isStatic])

    // --- Play videos only while in view ---
    useEffect(() => {
        apiRef.current?.setPlaying(inView && !isStatic)
    }, [inView, isStatic, itemsKey])

    // --- Animation loop: runs only while in view ---
    useEffect(() => {
        if (isStatic || !inView) return
        let raf = 0
        apiRef.current?.resetClock()
        const loop = (t: number) => {
            apiRef.current?.tick(t)
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [inView, isStatic])

    // --- Static canvas fallback ---
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    background: props.backgroundColor || "#f8f5ee",
                    borderRadius: 12,
                    color: "#999",
                    fontFamily: "sans-serif",
                    fontSize: 16,
                    overflow: "hidden",
                }}
            >
                <svg width="80%" viewBox="0 0 400 160">
                    <polygon
                        points="0,150 90,150 120,95 40,95"
                        fill="#9db6cb"
                    />
                    <polygon
                        points="100,150 180,150 195,95 128,95"
                        fill="#b7cde0"
                    />
                    <polygon
                        points="190,150 260,148 262,98 203,96"
                        fill="#9db6cb"
                        opacity="0.8"
                    />
                    <polygon
                        points="268,146 322,140 312,104 268,100"
                        fill="#b7cde0"
                        opacity="0.55"
                    />
                    <polygon
                        points="328,138 368,132 352,108 318,104"
                        fill="#9db6cb"
                        opacity="0.3"
                    />
                </svg>
                FloorPerspective Preview
            </div>
        )
    }

    // --- Live component ---
    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: props.backgroundColor,
                cursor: "grab",
                touchAction: "pan-y",
                userSelect: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    )
}

FloorPerspective.defaultProps = {
    width: 1000,
    height: 800,
    items: [],
    backgroundColor: "#f8f5ee",
    slideWidth: 5,
    slideHeight: 3.4,
    gap: 0.3,
    radius: 0.15,
    tilt: 55,
    yaw: 25,
    fov: 40,
    offsetX: 0,
    offsetY: -0.5,
    depth: 0,
    wave: 0,
    waveFreq: 0.3,
    waveSpeed: 0.5,
    fade: true,
    fadeStart: 4,
    fadeLength: 14,
    autoScroll: true,
    autoSpeed: 1.5,
    direction: "left",
    pauseOnHover: false,
    dragSpeed: 1.5,
    friction: 0.95,
    wheel: true,
}

addPropertyControls(FloorPerspective, {
    items: {
        type: ControlType.Array,
        title: "Media",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (o: any) => o.type !== "image",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (o: any) => o.type !== "video",
                },
            },
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f8f5ee",
    },

    // --- Slides ---
    slideWidth: {
        type: ControlType.Number,
        title: "Slide W",
        min: 1,
        max: 12,
        step: 0.1,
        defaultValue: 5,
    },
    slideHeight: {
        type: ControlType.Number,
        title: "Slide H",
        min: 1,
        max: 8,
        step: 0.1,
        defaultValue: 3.4,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 0.3,
    },
    radius: {
        type: ControlType.Number,
        title: "Corners",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.15,
    },

    // --- Floor ---
    tilt: {
        type: ControlType.Number,
        title: "Floor Tilt",
        min: 0,
        max: 85,
        step: 1,
        unit: "°",
        defaultValue: 55,
    },
    yaw: {
        type: ControlType.Number,
        title: "Angle",
        min: -80,
        max: 80,
        step: 1,
        unit: "°",
        defaultValue: 25,
    },
    fov: {
        type: ControlType.Number,
        title: "Perspective",
        min: 15,
        max: 90,
        step: 1,
        unit: "°",
        defaultValue: 40,
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        min: -10,
        max: 10,
        step: 0.1,
        defaultValue: 0,
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        min: -6,
        max: 6,
        step: 0.1,
        defaultValue: -0.5,
    },
    depth: {
        type: ControlType.Number,
        title: "Depth",
        min: -20,
        max: 8,
        step: 0.1,
        defaultValue: 0,
    },

    // --- Wave ---
    wave: {
        type: ControlType.Number,
        title: "Wave",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 0,
    },
    waveFreq: {
        type: ControlType.Number,
        title: "Wave Freq",
        min: 0.02,
        max: 1.5,
        step: 0.01,
        defaultValue: 0.3,
        hidden: (p: any) => !p.wave,
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 0.5,
        hidden: (p: any) => !p.wave,
    },

    // --- Fade ---
    fade: {
        type: ControlType.Boolean,
        title: "Fade Out",
        defaultValue: true,
    },
    fadeStart: {
        type: ControlType.Number,
        title: "Fade Start",
        min: -10,
        max: 40,
        step: 0.5,
        defaultValue: 4,
        hidden: (p: any) => !p.fade,
    },
    fadeLength: {
        type: ControlType.Number,
        title: "Fade Length",
        min: 0,
        max: 60,
        step: 0.5,
        defaultValue: 14,
        hidden: (p: any) => !p.fade,
    },

    // --- Motion ---
    autoScroll: {
        type: ControlType.Boolean,
        title: "Auto Scroll",
        defaultValue: true,
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 1.5,
        hidden: (p: any) => !p.autoScroll,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: (p: any) => !p.autoScroll,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: false,
        hidden: (p: any) => !p.autoScroll,
    },
    dragSpeed: {
        type: ControlType.Number,
        title: "Drag Speed",
        min: 0.2,
        max: 4,
        step: 0.1,
        defaultValue: 1.5,
    },
    friction: {
        type: ControlType.Number,
        title: "Momentum",
        min: 0.8,
        max: 0.99,
        step: 0.01,
        defaultValue: 0.95,
    },
    wheel: {
        type: ControlType.Boolean,
        title: "Mouse Wheel",
        defaultValue: true,
    },
})
