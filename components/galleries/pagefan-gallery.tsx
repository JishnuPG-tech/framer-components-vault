/**
 * Paper Fan Book — Framer code component
 * ---------------------------------------------------------------
 * A vertical "fan book": pages hinge on a horizontal spine and fan
 * out up and down. Drag up/down to flip — pages bend and trail like
 * paper. Each page can show an image or a video, from an upload or
 * a URL. Built with three.js (WebGL).
 *
 * Notes
 * - URL media must allow cross-origin access (CORS), otherwise WebGL
 *   can't draw it. Framer uploads always work.
 * - Videos autoplay muted & looped, and pause when off-screen.
 * - On the Framer canvas a static preview is shown; the live 3D
 *   version runs in Preview and on the published site.
 */
import { useEffect, useRef, useState } from "react"
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

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type PageItem = {
    type?: "image" | "video"
    source?: "upload" | "url"
    image?: { src?: string } | string
    imageUrl?: string
    video?: string
    videoUrl?: string
}

type Media = { type: "image" | "video"; url: string }

function resolveItem(it?: PageItem): Media | null {
    if (!it) return null
    const type = it.type === "video" ? "video" : "image"
    const fromUrl = it.source === "url"
    if (type === "image") {
        const up = typeof it.image === "string" ? it.image : it.image?.src
        const url = (fromUrl ? it.imageUrl : up)?.trim()
        return url ? { type, url } : null
    }
    const url = (fromUrl ? it.videoUrl : it.video)?.trim()
    return url ? { type, url } : null
}

const T: any = THREE
function setSRGB(t: THREE.Texture) {
    if ("colorSpace" in t && T.SRGBColorSpace)
        (t as any).colorSpace = T.SRGBColorSpace
    else (t as any).encoding = T.sRGBEncoding
}

let _ctx: CanvasRenderingContext2D | null = null
function cssColor(str: string): string {
    if (!str) return "#ffffff"
    let s = str.trim()
    const m = s.match(/^var\([^,]+,\s*(.+)\)$/) // Framer color tokens
    if (m) s = m[1]
    if (!_ctx) _ctx = document.createElement("canvas").getContext("2d")
    if (!_ctx) return "#ffffff"
    _ctx.fillStyle = "#ffffff"
    _ctx.fillStyle = s
    const out = String(_ctx.fillStyle)
    // strip alpha so THREE.Color can read it
    const rgba = out.match(/^rgba?\(([^,]+),([^,]+),([^,)]+)/)
    return rgba ? `rgb(${rgba[1]},${rgba[2]},${rgba[3]})` : out
}

const GRADIENTS = [
    ["#f6d365", "#fda085"],
    ["#89f7fe", "#66a6ff"],
    ["#c471f5", "#fa71cd"],
    ["#43e97b", "#38f9d7"],
    ["#fa709a", "#fee140"],
    ["#30cfd0", "#330867"],
    ["#a1c4fd", "#c2e9fb"],
    ["#ff9a9e", "#fad0c4"],
    ["#667eea", "#764ba2"],
    ["#f093fb", "#f5576c"],
]

function gradientTexture(i: number) {
    const cv = document.createElement("canvas")
    cv.width = 640
    cv.height = 480
    const x = cv.getContext("2d")!
    const g = x.createLinearGradient(0, 0, 640, 480)
    const c = GRADIENTS[i % GRADIENTS.length]
    g.addColorStop(0, c[0])
    g.addColorStop(1, c[1])
    x.fillStyle = g
    x.fillRect(0, 0, 640, 480)
    const t = new THREE.CanvasTexture(cv)
    setSRGB(t)
    return t
}

/* Material: unlit (exact image colours) + rounded corners, border,
   object-fit: cover and optional soft paper shading — all in-shader. */
function makeMaterial(map: THREE.Texture, uniforms: Record<string, any>) {
    const m = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide })
    m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uniforms)
        sh.vertexShader =
            "varying vec2 vPUv;\nvarying float vShade;\n" +
            sh.vertexShader
                .replace(
                    "#include <uv_vertex>",
                    "#include <uv_vertex>\n vPUv = uv;"
                )
                .replace(
                    "#include <project_vertex>",
                    `#include <project_vertex>
 vec3 wn = normalize(mat3(modelMatrix) * normal);
 vShade = abs(dot(wn, normalize(vec3(0.35, 0.55, 0.75))));`
                )
        const chunk = THREE.ShaderChunk.map_fragment.replace(
            /vMapUv|vUv/g,
            "cuv"
        )
        sh.fragmentShader =
            `varying vec2 vPUv;
varying float vShade;
uniform float uAspect;
uniform float uRadius;
uniform float uBorder;
uniform float uShading;
uniform vec3 uBorderColor;
uniform vec2 uCover;
` +
            sh.fragmentShader.replace(
                "#include <map_fragment>",
                `
 vec2 sz = vec2(uAspect, 1.0);
 vec2 cp = (vPUv - 0.5) * sz;
 float rr = min(uRadius, 0.5 * min(sz.x, sz.y));
 vec2 q = abs(cp) - (0.5 * sz - rr);
 float dd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rr;
 if (dd > 0.0) discard;
 vec2 inner = max(sz - 2.0 * uBorder, vec2(0.001));
 vec2 cuv = (cp / inner) * uCover + 0.5;
 if (!gl_FrontFacing) cuv.y = 1.0 - cuv.y;
 ${chunk}
 float ir = max(rr - uBorder, 0.0);
 vec2 q2 = abs(cp) - (0.5 * inner - ir);
 float d2 = length(max(q2, 0.0)) + min(max(q2.x, q2.y), 0.0) - ir;
 if (uBorder > 0.0) diffuseColor.rgb = mix(diffuseColor.rgb, uBorderColor, step(0.0, d2));
 diffuseColor.rgb *= mix(1.0, 0.62 + 0.38 * vShade, uShading);
`
            )
    }
    return m
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PaperFanBook(props) {
    const {
        items = [],
        pageCount = 10,
        ratioW = 4,
        ratioH = 3,
        background = "rgba(0,0,0,0)",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const mountRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)

    // live props for the render loop (no rebuild needed)
    const propsRef = useRef(props)
    propsRef.current = props

    const drag = useRef({
        rot: 0,
        target: 0,
        vel: -0.004,
        down: false,
        py: 0,
        lastMove: -9999,
        dragV: 0,
    })
    const api = useRef<{ start: () => void; stop: () => void } | null>(null)

    const media: Media[] = (items as PageItem[])
        .map(resolveItem)
        .filter(Boolean) as Media[]
    const mediaKey = JSON.stringify(media)

    /* --- viewport detection --- */
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const io = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.1 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    /* --- build the 3D scene --- */
    useEffect(() => {
        if (isStatic) return
        const mount = mountRef.current
        if (!mount) return

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        if ("outputColorSpace" in renderer && T.SRGBColorSpace)
            (renderer as any).outputColorSpace = T.SRGBColorSpace
        else (renderer as any).outputEncoding = T.sRGBEncoding
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.style.display = "block"
        mount.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200)
        const book = new THREE.Group()
        scene.add(book)

        const PH = 2.4
        const PW = PH * (Math.max(0.1, ratioW) / Math.max(0.1, ratioH))
        const SX = 20,
            SY = 72
        const N = Math.max(1, Math.round(pageCount))
        const STEP = (Math.PI * 2) / N

        /* textures (shared per URL so a video decodes once) */
        type Entry = {
            tex: THREE.Texture
            aspect: number
            video?: HTMLVideoElement
        }
        const cache = new Map<string, Entry>()
        const videos: HTMLVideoElement[] = []
        const maxAniso = renderer.capabilities.getMaxAnisotropy()

        function load(m: Media): Entry {
            const key = m.type + "|" + m.url
            const hit = cache.get(key)
            if (hit) return hit
            let entry: Entry
            if (m.type === "video") {
                const v = document.createElement("video")
                v.crossOrigin = "anonymous"
                v.src = m.url
                v.muted = true
                v.loop = true
                v.playsInline = true
                v.setAttribute("playsinline", "")
                v.setAttribute("muted", "")
                v.preload = "auto"
                const tex = new THREE.VideoTexture(v)
                setSRGB(tex)
                entry = { tex, aspect: 4 / 3, video: v }
                v.addEventListener("loadedmetadata", () => {
                    if (v.videoWidth)
                        entry.aspect = v.videoWidth / v.videoHeight
                })
                videos.push(v)
            } else {
                const loader = new THREE.TextureLoader()
                loader.setCrossOrigin("anonymous")
                const tex = loader.load(m.url, (t) => {
                    const img: any = t.image
                    if (img?.width) entry.aspect = img.width / img.height
                })
                setSRGB(tex)
                tex.anisotropy = maxAniso
                entry = { tex, aspect: 4 / 3 }
            }
            cache.set(key, entry)
            return entry
        }

        const placeholders: THREE.Texture[] = []
        const pages = Array.from({ length: N }, (_, i) => {
            let entry: Entry
            if (media.length) entry = load(media[i % media.length])
            else {
                const tex = gradientTexture(i)
                placeholders.push(tex)
                entry = { tex, aspect: 4 / 3 }
            }
            const geo = new THREE.PlaneGeometry(PW, PH, SX, SY)
            geo.translate(0, PH / 2, 0)
            const base = (geo.attributes.position.array as Float32Array).slice()
            const uniforms = {
                uAspect: { value: PW / PH },
                uRadius: { value: 0 },
                uBorder: { value: 0 },
                uShading: { value: 0 },
                uBorderColor: { value: new THREE.Color("#ffffff") },
                uCover: { value: new THREE.Vector2(1, 1) },
            }
            const mat = makeMaterial(entry.tex, uniforms)
            const mesh = new THREE.Mesh(geo, mat)
            const pivot = new THREE.Group()
            pivot.add(mesh)
            book.add(pivot)
            return {
                pivot,
                geo,
                mat,
                base,
                entry,
                uniforms,
                angle: i * STEP + STEP / 2,
                off: 0,
                offV: 0,
                bend: 0,
                bendV: 0,
                phase: Math.random() * 6,
                stiff: 0.1 + Math.random() * 0.05,
            }
        })

        /* render loop */
        let raf = 0
        let running = false
        let lastW = 0,
            lastH = 0
        let prevRot = drag.current.rot
        let smoothV = 0
        let colorStr = ""
        const borderColor = new THREE.Color("#ffffff")
        const t0 = performance.now()
        const tanHalf = Math.tan(THREE.MathUtils.degToRad(17.5))
        const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v))

        function frame(now: number) {
            if (!running) return
            const p = propsRef.current
            const s = drag.current
            const t = (now - t0) / 1000

            // size + camera fit (always camera-facing, no tilt)
            const w = mount!.clientWidth || 1
            const h = mount!.clientHeight || 1
            if (w !== lastW || h !== lastH) {
                renderer.setSize(w, h, false)
                renderer.domElement.style.width = "100%"
                renderer.domElement.style.height = "100%"
                lastW = w
                lastH = h
            }
            camera.aspect = w / h
            const needH = 2 * PH * 1.08
            const needW = PW * 1.08
            const dist =
                Math.max(
                    needH / (2 * tanHalf),
                    needW / (2 * tanHalf * camera.aspect)
                ) / Math.max(0.2, p.scale ?? 1)
            camera.position.set(0, 0, dist)
            camera.lookAt(0, 0, 0)
            camera.updateProjectionMatrix()

            // motion
            const dir = p.autoDirection === "down" ? 1 : -1
            if (s.down) {
                const st = (s.target - s.rot) * 0.25
                s.dragV = st
                s.rot += st
            } else {
                s.vel *= 0.95
                if (p.autoRotate !== false && now - s.lastMove > 1500)
                    s.vel += (dir * 0.004 * (p.autoSpeed ?? 1) - s.vel) * 0.02
                s.rot += s.vel
                s.target = s.rot
            }
            const angV = s.rot - prevRot
            prevRot = s.rot
            smoothV += (angV - smoothV) * 0.25

            // look
            const k = p.bend ?? 1
            const border = Math.max(0, (p.borderWidth ?? 1) / 100)
            const radius = Math.max(0, (p.radius ?? 1.5) / 100)
            const shading = Math.max(0, Math.min(1, p.shading ?? 0.35))
            const flutterAmp = p.idleFlutter === false ? 0 : 0.025
            const bc = p.borderColor ?? "#ffffff"
            if (bc !== colorStr) {
                colorStr = bc
                borderColor.setStyle(cssColor(bc))
            }

            const innerW = Math.max(0.001, PW / PH - 2 * border)
            const innerH = Math.max(0.001, 1 - 2 * border)
            const pa = innerW / innerH

            for (const pg of pages) {
                // page trails the spine on its own spring
                pg.offV +=
                    (clamp(-smoothV * 6 * k, 0.3 * k) - pg.off) * pg.stiff
                pg.offV *= 0.82
                pg.off += pg.offV
                pg.pivot.rotation.x = pg.angle + s.rot + pg.off

                // paper bend spring
                pg.bendV += (clamp(-smoothV * 10 * k, 0.6 * k) - pg.bend) * 0.16
                pg.bendV *= 0.8
                pg.bend += pg.bendV

                const bb = pg.bend
                const arr = pg.geo.attributes.position.array as Float32Array
                const base = pg.base
                const mag = Math.min(1, Math.abs(bb) * 3)
                const sg = Math.sign(bb) || 1
                for (let i = 0; i < arr.length; i += 3) {
                    const x = base[i],
                        y = base[i + 1],
                        u = y / PH
                    const flutter =
                        Math.sin(t * 1.5 + pg.phase + u * 2.5) *
                        flutterAmp *
                        u *
                        u
                    const cup = x * x * 0.06 * u * mag * sg
                    const twist = x * u * bb * 0.12
                    const z = bb * u * u * 1.8 + cup + twist + flutter
                    arr[i] = x
                    arr[i + 1] = y - z * z * 0.18
                    arr[i + 2] = z
                }
                pg.geo.attributes.position.needsUpdate = true
                pg.geo.computeVertexNormals()

                // uniforms
                const ma = pg.entry.aspect || 4 / 3
                pg.uniforms.uBorder.value = border
                pg.uniforms.uRadius.value = radius
                pg.uniforms.uShading.value = shading
                pg.uniforms.uBorderColor.value.copy(borderColor)
                if (ma > pa) pg.uniforms.uCover.value.set(pa / ma, 1)
                else pg.uniforms.uCover.value.set(1, ma / pa)
            }

            renderer.render(scene, camera)
            raf = requestAnimationFrame(frame)
        }

        api.current = {
            start() {
                if (running) return
                running = true
                videos.forEach((v) => v.play().catch(() => {}))
                raf = requestAnimationFrame(frame)
            },
            stop() {
                running = false
                cancelAnimationFrame(raf)
                videos.forEach((v) => v.pause())
            },
        }
        if (inViewRef.current) api.current.start()

        return () => {
            api.current?.stop()
            api.current = null
            pages.forEach((pg) => {
                pg.geo.dispose()
                pg.mat.dispose()
            })
            cache.forEach((e) => e.tex.dispose())
            placeholders.forEach((t) => t.dispose())
            videos.forEach((v) => {
                v.pause()
                v.removeAttribute("src")
                v.load()
            })
            renderer.dispose()
            renderer.domElement.remove()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, mediaKey, pageCount, ratioW, ratioH])

    /* --- start/stop with visibility --- */
    const inViewRef = useRef(false)
    inViewRef.current = inView
    useEffect(() => {
        if (!api.current) return
        if (inView) api.current.start()
        else api.current.stop()
        return () => api.current?.stop()
    }, [inView, mediaKey, pageCount, ratioW, ratioH])

    /* --- static canvas preview --- */
    if (isStatic) {
        const first = media[0]
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    background: "#f0f0f0",
                    borderRadius: 12,
                    color: "#999",
                    fontFamily: "sans-serif",
                    fontSize: 14,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: "40%",
                        aspectRatio: `${ratioW} / ${ratioH}`,
                        borderRadius: 8,
                        border: `4px solid ${props.borderColor ?? "#fff"}`,
                        boxShadow: "0 10px 30px rgba(0,0,0,.15)",
                        background:
                            first?.type === "image"
                                ? `center / cover no-repeat url("${first.url}")`
                                : "linear-gradient(135deg,#f6d365,#fda085)",
                    }}
                />
                Paper Fan Book · interactive in Preview
            </div>
        )
    }

    /* --- live --- */
    const onDown = (e: React.PointerEvent) => {
        const s = drag.current
        s.down = true
        s.py = e.clientY
        s.target = s.rot
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    const onMove = (e: React.PointerEvent) => {
        const s = drag.current
        if (!s.down) return
        const sens = (props.dragSensitivity ?? 1) * (props.invertDrag ? -1 : 1)
        s.target += (e.clientY - s.py) * 0.006 * sens
        s.py = e.clientY
        s.lastMove = performance.now()
    }
    const onUp = () => {
        const s = drag.current
        if (!s.down) return
        s.down = false
        s.vel = Math.max(-0.08, Math.min(0.08, s.dragV))
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background,
                touchAction: "pan-x",
                cursor: "ns-resize",
                userSelect: "none",
            }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
        >
            <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
        </div>
    )
}

PaperFanBook.displayName = "Paper Fan Book"

PaperFanBook.defaultProps = {
    width: 1000,
    height: 800,
    items: [],
    pageCount: 10,
    ratioW: 4,
    ratioH: 3,
    scale: 1,
    borderWidth: 1,
    borderColor: "#ffffff",
    radius: 1.5,
    shading: 0.35,
    background: "rgba(0,0,0,0)",
    bend: 1,
    idleFlutter: true,
    dragSensitivity: 1,
    invertDrag: false,
    autoRotate: true,
    autoSpeed: 1,
    autoDirection: "up",
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(PaperFanBook, {
    items: {
        type: ControlType.Array,
        title: "Pages",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                source: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["upload", "url"],
                    optionTitles: ["Upload", "URL"],
                    displaySegmentedControl: true,
                    defaultValue: "upload",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) =>
                        p.type === "video" || p.source === "url",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…/photo.jpg",
                    hidden: (p: any) =>
                        p.type === "video" || p.source !== "url",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) =>
                        p.type !== "video" || p.source === "url",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    hidden: (p: any) =>
                        p.type !== "video" || p.source !== "url",
                },
            },
        },
    },
    pageCount: {
        type: ControlType.Number,
        title: "Page Count",
        min: 3,
        max: 30,
        step: 1,
        displayStepper: true,
        description: "Pages repeat if there are fewer items.",
    },
    ratioW: {
        type: ControlType.Number,
        title: "Ratio W",
        min: 1,
        max: 32,
        step: 1,
        displayStepper: true,
    },
    ratioH: {
        type: ControlType.Number,
        title: "Ratio H",
        min: 1,
        max: 32,
        step: 1,
        displayStepper: true,
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.3,
        max: 2,
        step: 0.05,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        min: 0,
        max: 10,
        step: 0.1,
        unit: "%",
    },
    borderColor: { type: ControlType.Color, title: "Border Color" },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 25,
        step: 0.5,
        unit: "%",
    },
    shading: {
        type: ControlType.Number,
        title: "Shading",
        min: 0,
        max: 1,
        step: 0.05,
    },
    background: { type: ControlType.Color, title: "Background" },
    bend: {
        type: ControlType.Number,
        title: "Paper Bend",
        min: 0,
        max: 2,
        step: 0.05,
    },
    idleFlutter: {
        type: ControlType.Boolean,
        title: "Flutter",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Speed",
        min: 0.2,
        max: 3,
        step: 0.1,
    },
    invertDrag: {
        type: ControlType.Boolean,
        title: "Invert Drag",
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Spin",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Spin Speed",
        min: 0,
        max: 5,
        step: 0.1,
        hidden: (p: any) => !p.autoRotate,
    },
    autoDirection: {
        type: ControlType.Enum,
        title: "Spin Dir",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        displaySegmentedControl: true,
        hidden: (p: any) => !p.autoRotate,
    },
})
