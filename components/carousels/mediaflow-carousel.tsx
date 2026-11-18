/**
 * MediaCarousel
 * Two infinite carousels in one component, sharing the same media list:
 *   • Flat — portrait tiles on a 2D canvas, staggered up/down, drag with momentum.
 *   • Wave — WebGL (Three.js) strip that bends along a sine wave.
 *
 * Pick the starting carousel in the property controls ("Carousel"); only that
 * carousel's settings are shown. Optional on-screen buttons let visitors switch
 * between the two live. Media (images or videos, by upload or URL) is shared.
 * Leave "Media" empty to see placeholders.
 *
 * Needs the "three" package. In Framer, `import * as THREE from "three"`
 * resolves automatically. No CDNs are used.
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

// ---------------------------------------------------------------------------
// Shared types & helpers
// ---------------------------------------------------------------------------

type Mode = "flat" | "wave"

type MediaInput = {
    type?: "image" | "video"
    source?: "upload" | "link"
    image?: { src?: string; srcSet?: string; alt?: string }
    video?: string
    url?: string
}

type MediaItem = { isVideo: boolean; src: string }

function resolveItems(media: MediaInput[] = []): MediaItem[] {
    return (media || [])
        .map((m) => {
            if (!m) return null
            const isVideo = m.type === "video"
            const raw =
                m.source === "link"
                    ? m.url
                    : isVideo
                      ? m.video
                      : m.image && m.image.src
            const src = raw ? String(raw).trim() : ""
            return src ? { isVideo, src } : null
        })
        .filter(Boolean) as MediaItem[]
}

// ---------------------------------------------------------------------------
// FLAT carousel (2D canvas)
// ---------------------------------------------------------------------------

type FlatProps = {
    tw: number
    th: number
    gap: number
    radius: number
    offset: number
    speed: number
    direction: "left" | "right"
    draggable: boolean
    pauseOnHover: boolean
}

type Media = HTMLImageElement | HTMLVideoElement

const PLACEHOLDER_COUNT = 8
const COLORS = [
    "#185FA5",
    "#0F6E56",
    "#993C1D",
    "#534AB7",
    "#854F0B",
    "#993556",
    "#3B6D11",
    "#5F5E5A",
]
const LIGHTS = [
    "#85B7EB",
    "#5DCAA5",
    "#F0997B",
    "#AFA9EC",
    "#EF9F27",
    "#ED93B1",
    "#97C459",
    "#B4B2A9",
]

function roundRect(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const rad = Math.max(0, Math.min(r, w / 2, h / 2))
    c.beginPath()
    c.moveTo(x + rad, y)
    c.arcTo(x + w, y, x + w, y + h, rad)
    c.arcTo(x + w, y + h, x, y + h, rad)
    c.arcTo(x, y + h, x, y, rad)
    c.arcTo(x, y, x + w, y, rad)
    c.closePath()
}

function circle(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
    c.beginPath()
    c.arc(x, y, r, 0, Math.PI * 2)
    c.fill()
}

// Flat placeholder artwork drawn on a 150x225 grid, scaled to the tile.
function drawPlaceholder(
    c: CanvasRenderingContext2D,
    i: number,
    w: number,
    h: number
) {
    const b = COLORS[i % COLORS.length]
    const l = LIGHTS[i % LIGHTS.length]
    const t = i % 4
    c.save()
    c.scale(w / 150, h / 225)
    c.fillStyle = b
    c.fillRect(0, 0, 150, 225)
    c.fillStyle = l
    if (t === 0) {
        circle(c, 105, 60, 22)
        c.globalAlpha = 0.6
        c.fill(new Path2D("M0 225V150L45 100L85 145L115 115L150 155V225Z"))
    } else if (t === 1) {
        circle(c, 75, 100, 40)
        c.fillStyle = b
        circle(c, 75, 100, 18)
        c.fillStyle = l
        c.globalAlpha = 0.6
        roundRect(c, 45, 150, 60, 8, 4)
        c.fill()
    } else if (t === 2) {
        roundRect(c, 28, 50, 94, 110, 4)
        c.fill()
        c.fillStyle = b
        c.globalAlpha = 0.6
        c.fill(new Path2D("M28 160L58 115L85 145L100 128L122 160Z"))
    } else {
        c.globalAlpha = 0.7
        c.fill(new Path2D("M0 140Q38 100 75 140T150 140V225H0Z"))
        c.globalAlpha = 1
        circle(c, 105, 60, 18)
    }
    c.restore()
}

function mediaSize(m: Media): [number, number] {
    return m instanceof HTMLVideoElement
        ? [m.videoWidth, m.videoHeight]
        : [m.naturalWidth, m.naturalHeight]
}

function mediaReady(m: Media | undefined): m is Media {
    if (!m) return false
    if (m instanceof HTMLVideoElement)
        return m.readyState >= 2 && m.videoWidth > 0
    return m.complete && m.naturalWidth > 0
}

function FlatCarousel({
    items,
    srcKey,
    inView,
    p,
}: {
    items: MediaItem[]
    srcKey: string
    inView: boolean
    p: FlatProps
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const n = items.length || PLACEHOLDER_COUNT

    const itemsRef = useRef<MediaItem[]>(items)
    itemsRef.current = items
    const inViewRef = useRef(inView)
    inViewRef.current = inView

    const propsRef = useRef({
        tw: 1,
        th: 1,
        gap: 0,
        radius: 0,
        offset: 0,
        speed: 0,
        dir: -1,
        n: 8,
    })
    propsRef.current = {
        tw: Math.max(1, p.tw),
        th: Math.max(1, p.th),
        gap: Math.max(0, p.gap),
        radius: Math.max(0, p.radius),
        offset: p.offset,
        speed: Math.max(0, p.speed),
        dir: p.direction === "right" ? 1 : -1,
        n,
    }

    const xRef = useRef(0)
    const velRef = useRef(0)
    const draggingRef = useRef(false)
    const lastXRef = useRef(0)
    const lastTRef = useRef(0)
    const hoverRef = useRef(false)
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
    const mediaRef = useRef<Media[]>([])
    const drawRef = useRef<(() => void) | null>(null)

    // --- Load images and videos ---
    useEffect(() => {
        const list: Media[] = itemsRef.current.map((item) => {
            if (item.isVideo) {
                const v = document.createElement("video")
                v.muted = true
                v.loop = true
                v.playsInline = true
                v.preload = "auto"
                v.setAttribute("playsinline", "")
                v.onloadeddata = () => {
                    drawRef.current && drawRef.current()
                    if (inViewRef.current) v.play().catch(() => {})
                }
                v.src = item.src
                return v
            }
            const im = new Image()
            im.onload = () => drawRef.current && drawRef.current()
            im.src = item.src
            return im
        })
        mediaRef.current = list
        drawRef.current && drawRef.current()
        return () => {
            list.forEach((m) => {
                if (m instanceof HTMLVideoElement) {
                    m.onloadeddata = null
                    m.pause()
                    m.removeAttribute("src")
                    m.load()
                } else {
                    m.onload = null
                }
            })
        }
    }, [srcKey])

    // Play videos only while visible.
    useEffect(() => {
        mediaRef.current.forEach((m) => {
            if (m instanceof HTMLVideoElement) {
                if (inView) m.play().catch(() => {})
                else m.pause()
            }
        })
    }, [inView, srcKey])

    // --- Canvas setup, sizing and drawing ---
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const draw = () => {
            const { w, h, dpr } = sizeRef.current
            if (!w || !h) return
            const q = propsRef.current
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)

            const step = q.tw + q.gap
            const need = Math.ceil((w + step) / step) + 1
            let m = q.n
            while (m < need || m % 2 !== 0) m += q.n
            const total = m * step

            xRef.current = xRef.current % total
            const absOff = Math.abs(q.offset)
            const y0 = (h - (q.th + absOff)) / 2 + (q.offset < 0 ? absOff : 0)
            const media = mediaRef.current

            for (let j = 0; j < m; j++) {
                let pos = (((j * step + xRef.current) % total) + total) % total
                if (pos > total - step) pos -= total
                if (pos >= w || pos + q.tw <= 0) continue
                const idx = j % q.n
                const y = y0 + (j % 2 ? q.offset : 0)
                ctx.save()
                ctx.translate(pos, y)
                roundRect(ctx, 0, 0, q.tw, q.th, q.radius)
                ctx.clip()
                const item = media[idx]
                if (mediaReady(item)) {
                    const [iw, ih] = mediaSize(item)
                    const s = Math.max(q.tw / iw, q.th / ih)
                    const dw = iw * s
                    const dh = ih * s
                    ctx.drawImage(
                        item,
                        (q.tw - dw) / 2,
                        (q.th - dh) / 2,
                        dw,
                        dh
                    )
                } else if (!media.length) {
                    drawPlaceholder(ctx, idx, q.tw, q.th)
                } else {
                    ctx.fillStyle = "rgba(128,128,128,0.2)"
                    ctx.fillRect(0, 0, q.tw, q.th)
                }
                ctx.restore()
            }
        }
        drawRef.current = draw

        const resize = () => {
            const rect = container.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, 3)
            sizeRef.current = { w: rect.width, h: rect.height, dpr }
            canvas.width = Math.round(rect.width * dpr)
            canvas.height = Math.round(rect.height * dpr)
            draw()
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(container)
        return () => {
            ro.disconnect()
            drawRef.current = null
        }
    }, [])

    // Redraw when visual props change.
    useEffect(() => {
        drawRef.current && drawRef.current()
    }, [p.tw, p.th, p.gap, p.radius, p.offset, n])

    // --- Auto rotation: only runs while visible ---
    useEffect(() => {
        if (!inView) return
        let raf = 0
        let prev = 0
        const loop = (t: number) => {
            const dt = prev ? Math.min((t - prev) / 1000, 0.034) : 0
            prev = t
            if (!draggingRef.current) {
                const q = propsRef.current
                const target =
                    p.pauseOnHover && hoverRef.current ? 0 : q.dir * q.speed
                velRef.current +=
                    (target - velRef.current) * (1 - Math.exp(-dt * 2.5))
                xRef.current += velRef.current * dt
            }
            drawRef.current && drawRef.current()
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [inView, p.pauseOnHover])

    const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!p.draggable) return
        draggingRef.current = true
        velRef.current = 0
        lastXRef.current = e.clientX
        lastTRef.current = performance.now()
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!draggingRef.current) return
        const now = performance.now()
        const dx = e.clientX - lastXRef.current
        const dt = (now - lastTRef.current) / 1000
        xRef.current += dx
        if (dt > 0) velRef.current = 0.6 * velRef.current + 0.4 * (dx / dt)
        lastXRef.current = e.clientX
        lastTRef.current = now
        drawRef.current && drawRef.current()
    }
    const onUp = () => {
        if (!draggingRef.current) return
        draggingRef.current = false
        if (performance.now() - lastTRef.current > 100) velRef.current = 0
    }

    return (
        <div
            ref={containerRef}
            style={{ position: "absolute", inset: 0, overflow: "hidden" }}
            onPointerEnter={() => (hoverRef.current = true)}
            onPointerLeave={() => (hoverRef.current = false)}
        >
            <canvas
                ref={canvasRef}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    cursor: p.draggable ? "grab" : "default",
                    touchAction: "pan-y",
                    userSelect: "none",
                }}
            />
        </div>
    )
}

function FlatStatic({ items, p }: { items: MediaItem[]; p: FlatProps }) {
    const count = Math.min(items.length || PLACEHOLDER_COUNT, 8)
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                gap: p.gap,
            }}
        >
            {Array.from({ length: count }).map((_, i) => {
                const item = items[i]
                const fill = {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover" as const,
                    display: "block",
                }
                return (
                    <div
                        key={i}
                        style={{
                            flex: "none",
                            width: p.tw,
                            height: p.th,
                            borderRadius: p.radius,
                            overflow: "hidden",
                            transform: `translateY(${i % 2 ? p.offset / 2 : -p.offset / 2}px)`,
                            background: item
                                ? "rgba(128,128,128,0.2)"
                                : COLORS[i % COLORS.length],
                            position: "relative",
                        }}
                    >
                        {item && item.isVideo ? (
                            <video
                                src={item.src}
                                muted
                                playsInline
                                preload="metadata"
                                style={fill}
                            />
                        ) : item ? (
                            <img src={item.src} alt="" style={fill} />
                        ) : (
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "28%",
                                    width: "36%",
                                    aspectRatio: "1 / 1",
                                    transform: "translateX(-50%)",
                                    borderRadius: "50%",
                                    background: LIGHTS[i % LIGHTS.length],
                                }}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ---------------------------------------------------------------------------
// WAVE carousel (WebGL / Three.js)
// ---------------------------------------------------------------------------

type WaveProps = {
    slideWidth: number
    slideHeight: number
    gap: number
    amplitude: number
    frequency: number
    stretch: number
    waveSpeed: number
    autoRotate: boolean
    autoSpeed: number
    direction: "left" | "right"
    pauseOnHover: boolean
    dragSpeed: number
    friction: number
    wheel: boolean
}

function waveFallback() {
    const mk = (fn: (g: CanvasRenderingContext2D) => void) => {
        const c = document.createElement("canvas")
        c.width = 800
        c.height = 600
        fn(c.getContext("2d")!)
        return c
    }
    const grad = (
        g: CanvasRenderingContext2D,
        a: string,
        b: string,
        c: string
    ) => {
        const r = g.createLinearGradient(0, 0, 0, 600)
        r.addColorStop(0, a)
        r.addColorStop(0.55, b)
        r.addColorStop(1, c)
        g.fillStyle = r
        g.fillRect(0, 0, 800, 600)
    }
    const poly = (g: CanvasRenderingContext2D, pts: number[][], f: string) => {
        g.beginPath()
        pts.forEach((pt, i) =>
            i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1])
        )
        g.fillStyle = f
        g.fill()
    }
    return [
        mk((g) => {
            grad(g, "#6b7273", "#2d3234", "#15181a")
            poly(
                g,
                [
                    [0, 330],
                    [260, 150],
                    [330, 150],
                    [800, 330],
                ],
                "#23282b"
            )
            poly(
                g,
                [
                    [200, 200],
                    [290, 140],
                    [360, 200],
                    [300, 185],
                    [270, 205],
                    [240, 185],
                ],
                "#e8ecec"
            )
        }),
        mk((g) => {
            grad(g, "#6f97bd", "#b7cde0", "#f2f6f9")
            poly(
                g,
                [
                    [0, 420],
                    [120, 350],
                    [260, 400],
                    [420, 440],
                    [600, 380],
                    [700, 340],
                    [800, 400],
                    [800, 600],
                    [0, 600],
                ],
                "#eef3f7"
            )
        }),
        mk((g) => {
            grad(g, "#9cc3dc", "#cfe2ee", "#cfe2ee")
            g.fillStyle = "#8a9a52"
            g.fillRect(0, 440, 800, 160)
            g.fillStyle = "#f3f4f4"
            g.fillRect(60, 160, 300, 320)
            g.fillRect(300, 60, 220, 200)
            g.fillRect(480, 200, 240, 260)
            g.fillStyle = "#2f3a3d"
            g.fillRect(420, 110, 34, 28)
            g.fillRect(560, 260, 34, 28)
        }),
        mk((g) => {
            g.fillStyle = "#262726"
            g.fillRect(0, 0, 800, 600)
            g.lineCap = "round"
            g.strokeStyle = "#4a3b30"
            g.lineWidth = 70
            g.beginPath()
            g.moveTo(-20, 60)
            g.quadraticCurveTo(200, 260, 420, 460)
            g.stroke()
            ;[
                ["#1f7a2c", 64],
                ["#2fae3d", 54],
                ["#58d04a", 44],
            ].forEach((a) => {
                g.strokeStyle = a[0] as string
                g.lineWidth = a[1] as number
                g.beginPath()
                g.moveTo(780, 200)
                g.bezierCurveTo(780, 560, 360, 520, 420, 360)
                g.bezierCurveTo(470, 230, 700, 230, 640, 330)
                g.bezierCurveTo(600, 400, 500, 380, 510, 330)
                g.stroke()
            })
        }),
        mk((g) => {
            grad(g, "#f3b27a", "#e27d5c", "#8a3d4c")
            ;[
                ["#b5523f", 380],
                ["#8f3a46", 450],
                ["#5d2a3e", 520],
            ].forEach((l, i) => {
                g.fillStyle = l[0] as string
                g.beginPath()
                g.moveTo(0, 600)
                for (let x = 0; x <= 800; x += 10)
                    g.lineTo(
                        x,
                        (l[1] as number) + Math.sin(x * 0.008 + i * 2) * 50
                    )
                g.lineTo(800, 600)
                g.fill()
            })
        }),
    ]
}

function WaveCarousel({
    items,
    srcKey,
    inView,
    p,
}: {
    items: MediaItem[]
    srcKey: string
    inView: boolean
    p: WaveProps
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const paramsRef = useRef(p)
    paramsRef.current = p
    const itemsRef = useRef(items)
    itemsRef.current = items
    const apiRef = useRef<any>(null)

    // --- Three.js setup (once) ---
    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        const scene = new THREE.Scene()
        const H = 10
        const cam = new THREE.OrthographicCamera(-1, 1, H / 2, -H / 2, -10, 10)
        const geo = new THREE.PlaneGeometry(1, 1, 48, 16)

        const shared = {
            uTime: { value: 0 },
            uSize: { value: new THREE.Vector2(6.2, 5.4) },
            uAmp: { value: 1.5 },
            uFreq: { value: 0.16 },
            uStretch: { value: 0.2 },
        }
        const vs = `
            uniform float uTime, uAmp, uFreq, uStretch;
            uniform vec2 uSize;
            varying vec2 vUv;
            void main(){
                vUv = uv;
                vec3 p = position;
                p.x *= uSize.x;
                p.y *= uSize.y;
                float x = p.x + modelMatrix[3].x;
                float wv = sin(x*uFreq + uTime) + 0.35*sin(x*uFreq*2.05 - uTime*0.7);
                p.y *= 1.0 + uStretch*wv;
                p.y += wv*uAmp;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`
        const fs = `
            uniform sampler2D map;
            uniform float uAsp, uSlideAsp;
            varying vec2 vUv;
            void main(){
                vec2 uv = vUv - 0.5;
                if (uAsp > uSlideAsp) uv.x *= uSlideAsp / uAsp; else uv.y *= uAsp / uSlideAsp;
                gl_FragColor = texture2D(map, uv + 0.5);
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
            tex.needsUpdate = true
            const mat = new THREE.ShaderMaterial({
                vertexShader: vs,
                fragmentShader: fs,
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

        // Make enough meshes to cover the screen, reusing sources
        const layout = () => {
            if (!sources.length) return
            const step = shared.uSize.value.x + (paramsRef.current.gap ?? 0.1)
            const need = Math.ceil((state.viewW + step * 2) / step)
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

        const loadSlides = (list: MediaItem[]) => {
            clearSlides()
            const gen = ++loadGen
            const finish = (loaded: any[]) => {
                if (disposed || gen !== loadGen) return
                loaded.forEach((l) => {
                    if (l)
                        sources.push(
                            makeSource(l.img || l.video, l.w, l.h, l.video)
                        )
                })
                if (!sources.length)
                    waveFallback().forEach((c) =>
                        sources.push(makeSource(c, 800, 600))
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
                if (item.isVideo) {
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
                    v.src = item.src
                } else {
                    loader.load(
                        item.src,
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

        const resize = () => {
            const w = container.clientWidth || 1
            const h = container.clientHeight || 1
            renderer.setSize(w, h, false)
            const a = w / h
            cam.left = (-H / 2) * a
            cam.right = (H / 2) * a
            cam.updateProjectionMatrix()
            state.unit = (H * a) / w
            state.viewW = H * a
            layout()
            render()
        }

        const render = () => {
            const q = paramsRef.current
            shared.uSize.value.set(q.slideWidth ?? 6.2, q.slideHeight ?? 5.4)
            shared.uAmp.value = q.amplitude ?? 1.5
            shared.uFreq.value = q.frequency ?? 0.16
            shared.uStretch.value = q.stretch ?? 0.2
            sources.forEach(
                (s) =>
                    (s.mat.uniforms.uSlideAsp.value =
                        shared.uSize.value.x / shared.uSize.value.y)
            )
            const step = shared.uSize.value.x + (q.gap ?? 0.1)
            layout()
            const total = meshes.length * step
            meshes.forEach((m, i) => {
                let x = (((i * step + state.scroll) % total) + total) % total
                if (x > total / 2) x -= total
                m.position.x = x
            })
            renderer.render(scene, cam)
        }

        const tick = (now: number) => {
            const q = paramsRef.current
            const dt = Math.min((now - (state.last || now)) / 1000, 0.05)
            state.last = now
            state.time += dt * (q.waveSpeed ?? 0.25)
            shared.uTime.value = state.time
            if (!state.dragging) {
                state.scroll += state.vel * dt * 60
                state.vel *= Math.pow(q.friction ?? 0.95, dt * 60)
                const idle =
                    Math.abs(state.vel) < 0.03 &&
                    !(q.pauseOnHover && state.hover)
                const target = q.autoRotate && idle ? 1 : 0
                state.auto += (target - state.auto) * Math.min(dt * 2.5, 1)
                const dir = q.direction === "right" ? 1 : -1
                state.scroll += dir * (q.autoSpeed ?? 1.5) * state.auto * dt
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
                (paramsRef.current.dragSpeed ?? 1)
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
    }, [])

    // --- Reload when the media list changes ---
    useEffect(() => {
        apiRef.current?.loadSlides(itemsRef.current)
    }, [srcKey])

    // --- Play videos only while in view ---
    useEffect(() => {
        apiRef.current?.setPlaying(inView)
    }, [inView, srcKey])

    // --- Redraw a frame when settings change (even if paused) ---
    useEffect(() => {
        apiRef.current?.render()
    })

    // --- Animation loop: runs only while in view ---
    useEffect(() => {
        if (!inView) return
        let raf = 0
        apiRef.current?.resetClock()
        const loop = (t: number) => {
            apiRef.current?.tick(t)
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [inView])

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
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

function WaveStatic() {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#999",
                fontFamily: "sans-serif",
                fontSize: 16,
            }}
        >
            <svg width="70%" viewBox="0 0 400 120">
                <path
                    d="M0 40 Q50 0 100 30 T200 40 T300 20 T400 40 V90 Q350 120 300 90 T200 100 T100 80 T0 100Z"
                    fill="#9db6cb"
                />
            </svg>
            Wave Carousel Preview
        </div>
    )
}

// ---------------------------------------------------------------------------
// On-screen switcher
// ---------------------------------------------------------------------------

function Switcher({
    active,
    onChange,
    props,
}: {
    active: Mode
    onChange: (m: Mode) => void
    props: Props
}) {
    const options: [Mode, string][] = [
        ["flat", props.flatLabel || "Flat"],
        ["wave", props.waveLabel || "Wave"],
    ]
    const edge = props.switcherOffset
    return (
        <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                ...(props.switcherPosition === "top"
                    ? { top: edge }
                    : { bottom: edge }),
                zIndex: 2,
                display: "flex",
                gap: 4,
                padding: 4,
                borderRadius: 999,
                background: props.switcherBackground,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                ...props.switcherFont,
            }}
        >
            {options.map(([value, label]) => {
                const on = active === value
                return (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(value)}
                        style={{
                            appearance: "none",
                            border: "none",
                            margin: 0,
                            padding: "8px 18px",
                            borderRadius: 999,
                            cursor: "pointer",
                            font: "inherit",
                            background: on
                                ? props.switcherActive
                                : "transparent",
                            color: on
                                ? props.switcherActiveText
                                : props.switcherText,
                            transition: "background 0.2s ease, color 0.2s ease",
                        }}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
    carousel: Mode
    media: MediaInput[]

    // Flat
    flatWidth: number
    flatHeight: number
    flatGap: number
    flatRadius: number
    flatOffset: number
    flatSpeed: number
    flatDirection: "left" | "right"
    flatDraggable: boolean
    flatPauseOnHover: boolean
    flatBackground: string

    // Wave
    waveSlideWidth: number
    waveSlideHeight: number
    waveGap: number
    waveAmplitude: number
    waveFrequency: number
    waveStretch: number
    waveSpeed: number
    waveAutoRotate: boolean
    waveAutoSpeed: number
    waveDirection: "left" | "right"
    wavePauseOnHover: boolean
    waveDragSpeed: number
    waveFriction: number
    waveWheel: boolean
    waveBackground: string

    // Switcher
    showSwitcher: boolean
    switcherPosition: "top" | "bottom"
    switcherOffset: number
    flatLabel: string
    waveLabel: string
    switcherFont: React.CSSProperties
    switcherBackground: string
    switcherActive: string
    switcherText: string
    switcherActiveText: string

    width?: number
    height?: number
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MediaCarousel(props: Props) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)
    const [active, setActive] = useState<Mode>(props.carousel || "flat")

    // Property control sets which carousel is shown; buttons switch it live.
    useEffect(() => {
        setActive(props.carousel || "flat")
    }, [props.carousel])

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
    }, [])

    const items = resolveItems(props.media)
    const srcKey = items.map((i) => (i.isVideo ? "v:" : "i:") + i.src).join("|")

    const flat: FlatProps = {
        tw: props.flatWidth,
        th: props.flatHeight,
        gap: props.flatGap,
        radius: props.flatRadius,
        offset: props.flatOffset,
        speed: props.flatSpeed,
        direction: props.flatDirection,
        draggable: props.flatDraggable,
        pauseOnHover: props.flatPauseOnHover,
    }
    const wave: WaveProps = {
        slideWidth: props.waveSlideWidth,
        slideHeight: props.waveSlideHeight,
        gap: props.waveGap,
        amplitude: props.waveAmplitude,
        frequency: props.waveFrequency,
        stretch: props.waveStretch,
        waveSpeed: props.waveSpeed,
        autoRotate: props.waveAutoRotate,
        autoSpeed: props.waveAutoSpeed,
        direction: props.waveDirection,
        pauseOnHover: props.wavePauseOnHover,
        dragSpeed: props.waveDragSpeed,
        friction: props.waveFriction,
        wheel: props.waveWheel,
    }

    const background =
        active === "flat" ? props.flatBackground : props.waveBackground

    let body: React.ReactNode
    if (isStatic) {
        // --- Static canvas fallback (Framer edit mode) ---
        body =
            active === "flat" ? (
                <FlatStatic items={items} p={flat} />
            ) : (
                <WaveStatic />
            )
    } else {
        // --- Live component: only the active carousel is mounted ---
        body =
            active === "flat" ? (
                <FlatCarousel
                    key="flat"
                    items={items}
                    srcKey={srcKey}
                    inView={inView}
                    p={flat}
                />
            ) : (
                <WaveCarousel
                    key="wave"
                    items={items}
                    srcKey={srcKey}
                    inView={inView}
                    p={wave}
                />
            )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background,
                transition: "background 0.3s ease",
            }}
        >
            {body}
            {props.showSwitcher && (
                <Switcher active={active} onChange={setActive} props={props} />
            )}
        </div>
    )
}

MediaCarousel.defaultProps = {
    width: 1000,
    height: 800,
    carousel: "flat",
    media: [],

    flatWidth: 240,
    flatHeight: 360,
    flatGap: 20,
    flatRadius: 12,
    flatOffset: 25,
    flatSpeed: 50,
    flatDirection: "left",
    flatDraggable: true,
    flatPauseOnHover: false,
    flatBackground: "rgba(0,0,0,0)",

    waveSlideWidth: 6.2,
    waveSlideHeight: 5.4,
    waveGap: 0.1,
    waveAmplitude: 1.5,
    waveFrequency: 0.16,
    waveStretch: 0.2,
    waveSpeed: 0.25,
    waveAutoRotate: true,
    waveAutoSpeed: 1.5,
    waveDirection: "left",
    wavePauseOnHover: false,
    waveDragSpeed: 1,
    waveFriction: 0.95,
    waveWheel: true,
    waveBackground: "#f8f5ee",

    showSwitcher: true,
    switcherPosition: "bottom",
    switcherOffset: 24,
    flatLabel: "Flat",
    waveLabel: "Wave",
    switcherFont: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 500,
    },
    switcherBackground: "rgba(0,0,0,0.55)",
    switcherActive: "#FFFFFF",
    switcherText: "rgba(255,255,255,0.8)",
    switcherActiveText: "#000000",
}

const hideUnlessFlat = (p: any) => p.carousel !== "flat"
const hideUnlessWave = (p: any) => p.carousel !== "wave"

addPropertyControls(MediaCarousel, {
    carousel: {
        type: ControlType.Enum,
        title: "Carousel",
        options: ["flat", "wave"],
        optionTitles: ["Flat", "Wave"],
        displaySegmentedControl: true,
        defaultValue: "flat",
    },

    // ---------- Shared media ----------
    media: {
        type: ControlType.Array,
        title: "Media",
        description: "Shared by both carousels. Empty shows placeholders.",
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
                source: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["upload", "link"],
                    optionTitles: ["Upload", "Link"],
                    defaultValue: "upload",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (o: any) =>
                        o.type === "video" || o.source === "link",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (o: any) =>
                        o.type !== "video" || o.source === "link",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    placeholder: "https://…",
                    hidden: (o: any) => o.source !== "link",
                },
            },
        },
    },

    // ---------- Flat carousel ----------
    flatWidth: {
        type: ControlType.Number,
        title: "Slide width",
        min: 40,
        max: 800,
        step: 1,
        unit: "px",
        defaultValue: 240,
        hidden: hideUnlessFlat,
    },
    flatHeight: {
        type: ControlType.Number,
        title: "Slide height",
        min: 40,
        max: 1200,
        step: 1,
        unit: "px",
        defaultValue: 360,
        hidden: hideUnlessFlat,
    },
    flatGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 20,
        hidden: hideUnlessFlat,
    },
    flatRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 12,
        hidden: hideUnlessFlat,
    },
    flatOffset: {
        type: ControlType.Number,
        title: "Vertical offset",
        description: "Up/down stagger",
        min: -200,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 25,
        hidden: hideUnlessFlat,
    },
    flatSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 500,
        step: 5,
        unit: "px/s",
        defaultValue: 50,
        hidden: hideUnlessFlat,
    },
    flatDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
        hidden: hideUnlessFlat,
    },
    flatDraggable: {
        type: ControlType.Boolean,
        title: "Draggable",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        hidden: hideUnlessFlat,
    },
    flatPauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on hover",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
        hidden: hideUnlessFlat,
    },
    flatBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
        hidden: hideUnlessFlat,
    },

    // ---------- Wave carousel ----------
    waveSlideWidth: {
        type: ControlType.Number,
        title: "Slide W",
        min: 2,
        max: 12,
        step: 0.1,
        defaultValue: 6.2,
        hidden: hideUnlessWave,
    },
    waveSlideHeight: {
        type: ControlType.Number,
        title: "Slide H",
        min: 2,
        max: 8,
        step: 0.1,
        defaultValue: 5.4,
        hidden: hideUnlessWave,
    },
    waveGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.1,
        hidden: hideUnlessWave,
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Height",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1.5,
        hidden: hideUnlessWave,
    },
    waveFrequency: {
        type: ControlType.Number,
        title: "Wave Freq",
        min: 0.04,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.16,
        hidden: hideUnlessWave,
    },
    waveStretch: {
        type: ControlType.Number,
        title: "Stretch",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.2,
        hidden: hideUnlessWave,
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.25,
        hidden: hideUnlessWave,
    },
    waveAutoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        hidden: hideUnlessWave,
    },
    waveAutoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 1.5,
        hidden: (p: any) => hideUnlessWave(p) || !p.waveAutoRotate,
    },
    waveDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: (p: any) => hideUnlessWave(p) || !p.waveAutoRotate,
    },
    wavePauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: false,
        hidden: (p: any) => hideUnlessWave(p) || !p.waveAutoRotate,
    },
    waveDragSpeed: {
        type: ControlType.Number,
        title: "Drag Speed",
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 1,
        hidden: hideUnlessWave,
    },
    waveFriction: {
        type: ControlType.Number,
        title: "Momentum",
        min: 0.8,
        max: 0.99,
        step: 0.01,
        defaultValue: 0.95,
        hidden: hideUnlessWave,
    },
    waveWheel: {
        type: ControlType.Boolean,
        title: "Mouse Wheel",
        defaultValue: true,
        hidden: hideUnlessWave,
    },
    waveBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f8f5ee",
        hidden: hideUnlessWave,
    },

    // ---------- On-screen switcher ----------
    showSwitcher: {
        type: ControlType.Boolean,
        title: "Switch Buttons",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    switcherPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        displaySegmentedControl: true,
        defaultValue: "bottom",
        hidden: (p: any) => !p.showSwitcher,
    },
    switcherOffset: {
        type: ControlType.Number,
        title: "Edge Offset",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 24,
        hidden: (p: any) => !p.showSwitcher,
    },
    flatLabel: {
        type: ControlType.String,
        title: "Flat Label",
        defaultValue: "Flat",
        hidden: (p: any) => !p.showSwitcher,
    },
    waveLabel: {
        type: ControlType.String,
        title: "Wave Label",
        defaultValue: "Wave",
        hidden: (p: any) => !p.showSwitcher,
    },
    switcherFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14, fontWeight: 500 } as any,
        hidden: (p: any) => !p.showSwitcher,
    },
    switcherBackground: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "rgba(0,0,0,0.55)",
        hidden: (p: any) => !p.showSwitcher,
    },
    switcherActive: {
        type: ControlType.Color,
        title: "Active Fill",
        defaultValue: "#FFFFFF",
        hidden: (p: any) => !p.showSwitcher,
    },
    switcherActiveText: {
        type: ControlType.Color,
        title: "Active Text",
        defaultValue: "#000000",
        hidden: (p: any) => !p.showSwitcher,
    },
    switcherText: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "rgba(255,255,255,0.8)",
        hidden: (p: any) => !p.showSwitcher,
    },
})
