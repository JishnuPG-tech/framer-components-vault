/**
 * Paper Wheel — Framer code component
 * ---------------------------------------------------------------
 * A ring of paper pages standing around an open centre, spinning on
 * a vertical axis. On first show it plays a "fan open" intro: the
 * pages start bunched together and sweep open into the full circle.
 * Drag sideways to spin — pages bow and trail like paper.
 * Each page shows an image or a video, from an upload or a URL.
 * Built with three.js (WebGL).
 *
 * Notes
 * - URL media must allow cross-origin access (CORS), otherwise WebGL
 *   can't draw it. Framer uploads always work.
 * - Videos autoplay muted & looped, and pause when off-screen.
 * - On the Framer canvas a static preview is shown; the live 3D
 *   version (and the intro) runs in Preview and on the published site.
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
/* Helpers                                                             */
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
    const rgba = out.match(/^rgba?\(([^,]+),([^,]+),([^,)]+)/)
    return rgba ? `rgb(${rgba[1]},${rgba[2]},${rgba[3]})` : out
}

const PALETTE = [
    ["#CECBF6", "#7F77DD", "#534AB7"],
    ["#9FE1CB", "#1D9E75", "#0F6E56"],
    ["#F5C4B3", "#D85A30", "#993C1D"],
    ["#F4C0D1", "#D4537E", "#993556"],
    ["#B5D4F4", "#378ADD", "#185FA5"],
    ["#FAC775", "#BA7517", "#854F0B"],
    ["#C0DD97", "#639922", "#3B6D11"],
    ["#D3D1C7", "#888780", "#5F5E5A"],
]

/** Simple flat "landscape" placeholder shown when no media is set. */
function placeholderTexture(i: number) {
    const w = 400,
        h = 300
    const cv = document.createElement("canvas")
    cv.width = w
    cv.height = h
    const x = cv.getContext("2d")!
    const c = PALETTE[i % PALETTE.length]
    x.fillStyle = c[0]
    x.fillRect(0, 0, w, h)
    x.fillStyle = c[1]
    x.beginPath()
    x.arc(w * (0.25 + ((i * 37) % 40) / 100), h * 0.36, h * 0.14, 0, 7)
    x.fill()
    x.fillStyle = c[2]
    x.beginPath()
    x.moveTo(0, h)
    x.lineTo(0, h * 0.72)
    x.lineTo(w * 0.35, h * (0.48 + (i % 3) * 0.04))
    x.lineTo(w * 0.62, h * 0.7)
    x.lineTo(w * 0.8, h * (0.56 + (i % 2) * 0.05))
    x.lineTo(w, h * 0.68)
    x.lineTo(w, h)
    x.fill()
    const t = new THREE.CanvasTexture(cv)
    setSRGB(t)
    return t
}

/* Unlit material (exact media colours) with rounded corners, border,
   object-fit: cover, readable back side and optional soft shading. */
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
 if (!gl_FrontFacing) cuv.x = 1.0 - cuv.x;
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

const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v))
const c01 = (v: number) => Math.max(0, Math.min(1, v))
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3)

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
export default function PaperWheel(props) {
    const {
        items = [],
        pageCount = 28,
        ratioW = 4,
        ratioH = 3,
        holeSize = 1.1,
        background = "rgba(0,0,0,0)",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const mountRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)
    const inViewRef = useRef(false)
    inViewRef.current = inView

    const propsRef = useRef(props)
    propsRef.current = props

    const drag = useRef({ down: false, lx: 0, vel: 0, push: 0 })
    const api = useRef<{
        start: () => void
        stop: () => void
        replay: () => void
    } | null>(null)

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
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 400)
        const ring = new THREE.Group()
        scene.add(ring)

        // page geometry: PW = radial length (image width), PH = height
        const PH = 0.9
        const PW = PH * (Math.max(0.1, ratioW) / Math.max(0.1, ratioH))
        const R0 = Math.max(0, holeSize) * PW
        const SX = 10,
            SY = 16
        const N = Math.max(3, Math.round(pageCount))
        const STEP = (Math.PI * 2) / N

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
                const tex = placeholderTexture(i)
                placeholders.push(tex)
                entry = { tex, aspect: 4 / 3 }
            }
            // built along +Y, then turned so the page extends outward (+X)
            const geo = new THREE.PlaneGeometry(PH, PW, SX, SY)
            geo.translate(0, PW / 2, 0)
            const uv = geo.attributes.uv
            for (let k = 0; k < uv.count; k++) {
                const u = uv.getX(k),
                    v = uv.getY(k)
                uv.setXY(k, v, 1 - u)
            }
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
            mesh.rotation.z = -Math.PI / 2
            const holder = new THREE.Group()
            holder.position.x = R0
            holder.add(mesh)
            const pivot = new THREE.Group()
            pivot.add(holder)
            ring.add(pivot)
            return {
                pivot,
                holder,
                geo,
                mat,
                base,
                entry,
                uniforms,
                off: 0,
                offV: 0,
                bend: 0,
                bendV: 0,
                phase: i * 0.6,
                stiff: 0.1 + Math.random() * 0.05,
            }
        })

        /* loop state */
        let raf = 0
        let running = false
        let rot = 0
        let vel = 0
        let prevRot = 0
        let smoothV = 0
        let intro = propsRef.current.intro === false ? 1 : 0 // 0..1 progress
        let last = performance.now()
        let lastW = 0,
            lastH = 0
        let colorStr = ""
        const borderColor = new THREE.Color("#ffffff")
        const t0 = performance.now()

        function bendPage(pg: (typeof pages)[number], B: number) {
            const arr = pg.geo.attributes.position.array as Float32Array
            const base = pg.base
            const cols = SX + 1,
                rows = SY + 1,
                ds = PW / SY
            for (let c = 0; c < cols; c++) {
                const x = base[c * 3]
                let y = 0,
                    z = 0
                for (let r = rows - 1; r >= 0; r--) {
                    const i = (r * cols + c) * 3
                    const u = (rows - 1 - r) / SY
                    if (r < rows - 1) {
                        const th = B * u * u
                        y += Math.cos(th) * ds
                        z += Math.sin(th) * ds
                    }
                    arr[i] = x
                    arr[i + 1] = y
                    arr[i + 2] = z
                }
            }
            pg.geo.attributes.position.needsUpdate = true
            pg.geo.computeVertexNormals()
        }

        /* Camera fit: project the ring's outline and find the distance at
           which every point fits in view (perspective-correct, so the near
           side of the ring never gets cut off), then centre it. */
        let lastFit = ""
        const outline: THREE.Vector3[] = []
        {
            const outer = R0 + PW * 1.04
            const bow = PW * 0.35 // room for the paper bend
            for (let a = 0; a < 48; a++) {
                const th = (a / 48) * Math.PI * 2
                for (const r of [Math.max(0.001, R0), outer])
                    for (const y of [-PH / 2 - 0.02, PH / 2 + 0.02])
                        outline.push(
                            new THREE.Vector3(
                                Math.cos(th) * r,
                                y,
                                Math.sin(th) * r
                            )
                        )
                outline.push(
                    new THREE.Vector3(
                        Math.cos(th) * (outer + bow * 0.2),
                        0,
                        Math.sin(th) * (outer + bow * 0.2)
                    )
                )
            }
        }
        const tmp = new THREE.Vector3()
        function bounds() {
            camera.updateMatrixWorld()
            let x0 = Infinity,
                x1 = -Infinity,
                y0 = Infinity,
                y1 = -Infinity
            for (const pt of outline) {
                tmp.copy(pt).applyMatrix4(camera.matrixWorldInverse)
                if (tmp.z > -camera.near) return null // point behind camera
                tmp.applyMatrix4(camera.projectionMatrix)
                x0 = Math.min(x0, tmp.x)
                x1 = Math.max(x1, tmp.x)
                y0 = Math.min(y0, tmp.y)
                y1 = Math.max(y1, tmp.y)
            }
            return { x0, x1, y0, y1 }
        }
        function place(d: number, tilt: number) {
            camera.position.set(0, Math.sin(tilt) * d, Math.cos(tilt) * d)
            camera.lookAt(0, 0, 0)
        }
        function fitCamera(w: number, h: number, tilt: number, zoom: number) {
            camera.aspect = w / h
            camera.clearViewOffset()
            camera.updateProjectionMatrix()
            const margin = 0.9
            let lo = 0.5,
                hi = 400
            for (let it = 0; it < 30; it++) {
                const mid = (lo + hi) / 2
                place(mid, tilt)
                const b = bounds()
                const fits =
                    b &&
                    (b.x1 - b.x0) / 2 <= margin &&
                    (b.y1 - b.y0) / 2 <= margin
                if (fits) hi = mid
                else lo = mid
            }
            place(hi / zoom, tilt)
            const b = bounds()
            if (b) {
                // shift the view so the ring sits in the middle of the frame
                const cx = (b.x0 + b.x1) / 2,
                    cy = (b.y0 + b.y1) / 2
                camera.setViewOffset(w, h, (cx * w) / 2, (-cy * h) / 2, w, h)
            }
            camera.updateProjectionMatrix()
        }

        function frame(now: number) {
            if (!running) return
            const p = propsRef.current
            const s = drag.current
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const t = (now - t0) / 1000

            // size + camera
            const w = mount!.clientWidth || 1
            const h = mount!.clientHeight || 1
            if (w !== lastW || h !== lastH) {
                renderer.setSize(w, h, false)
                renderer.domElement.style.width = "100%"
                renderer.domElement.style.height = "100%"
                lastW = w
                lastH = h
            }
            const tiltDeg = Math.max(0, Math.min(85, p.tilt ?? 24))
            const zoom = Math.max(0.2, p.zoom ?? 1)
            const fitKey = `${w}x${h}|${tiltDeg}|${zoom}`
            if (fitKey !== lastFit) {
                lastFit = fitKey
                fitCamera(w, h, THREE.MathUtils.degToRad(tiltDeg), zoom)
            }

            // intro (fan open)
            if (intro < 1)
                intro = Math.min(
                    1,
                    intro + dt / Math.max(0.2, p.introDuration ?? 3)
                )
            const introDone = intro >= 1

            // spin
            const dir = p.direction === "right" ? 1 : -1
            if (s.down && introDone) {
                vel = s.push
                rot += vel
                s.push = 0
            } else {
                s.push = 0
                vel *= 0.96
                if (p.autoRotate !== false)
                    vel += (dir * 0.004 * (p.autoSpeed ?? 1) - vel) * 0.01
                rot += vel
            }
            const angV = rot - prevRot
            prevRot = rot
            smoothV += (angV - smoothV) * 0.3

            // look
            const k = p.bend ?? 1
            const border = Math.max(0, (p.borderWidth ?? 1) / 100)
            const radius = Math.max(0, (p.radius ?? 1.5) / 100)
            const shading = c01(p.shading ?? 0.35)
            const flutter = p.idleFlutter === false ? 0 : 0.035
            const bc = p.borderColor ?? "#ffffff"
            if (bc !== colorStr) {
                colorStr = bc
                borderColor.setStyle(cssColor(bc))
            }
            const innerW = Math.max(0.001, PW / PH - 2 * border)
            const innerH = Math.max(0.001, 1 - 2 * border)
            const pa = innerW / innerH

            pages.forEach((pg, i) => {
                // fan open: pages start bunched at angle 0 and sweep out
                const q = c01(intro * 1.25 - (i / N) * 0.25)
                const e = easeOut(q)
                const introBend = introDone
                    ? 0
                    : Math.sin(q * Math.PI) * (0.3 + 0.7 * (i / N)) * k

                pg.offV += (clamp(-smoothV * 4 * k, 0.12) - pg.off) * pg.stiff
                pg.offV *= 0.82
                pg.off += pg.offV
                pg.pivot.rotation.y = i * STEP * e + rot + pg.off

                pg.bendV += (clamp(-smoothV * 20 * k, 1.0 * k) - pg.bend) * 0.14
                pg.bendV *= 0.8
                pg.bend += pg.bendV
                bendPage(
                    pg,
                    pg.bend + introBend + Math.sin(t * 1.5 + pg.phase) * flutter
                )

                const ma = pg.entry.aspect || 4 / 3
                pg.uniforms.uBorder.value = border
                pg.uniforms.uRadius.value = radius
                pg.uniforms.uShading.value = shading
                pg.uniforms.uBorderColor.value.copy(borderColor)
                if (ma > pa) pg.uniforms.uCover.value.set(pa / ma, 1)
                else pg.uniforms.uCover.value.set(1, ma / pa)
            })

            renderer.render(scene, camera)
            raf = requestAnimationFrame(frame)
        }

        api.current = {
            start() {
                if (running) return
                running = true
                last = performance.now()
                videos.forEach((v) => v.play().catch(() => {}))
                raf = requestAnimationFrame(frame)
            },
            stop() {
                running = false
                cancelAnimationFrame(raf)
                videos.forEach((v) => v.pause())
            },
            replay() {
                intro = propsRef.current.intro === false ? 1 : 0
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
    }, [isStatic, mediaKey, pageCount, ratioW, ratioH, holeSize])

    /* --- start/stop with visibility; optionally replay intro each time --- */
    const seenRef = useRef(false)
    useEffect(() => {
        const a = api.current
        if (!a) return
        if (inView) {
            if (seenRef.current && props.replayIntro) a.replay()
            seenRef.current = true
            a.start()
        } else a.stop()
        return () => api.current?.stop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView, mediaKey, pageCount, ratioW, ratioH, holeSize])

    /* --- static canvas preview (no animation) --- */
    if (isStatic) {
        const n = Math.max(3, Math.round(pageCount))
        const first = media[0]
        const cardW = 70,
            cardH = (cardW * ratioH) / ratioW
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    background:
                        background === "rgba(0,0,0,0)" ? "#f0f0f0" : background,
                    borderRadius: 12,
                    fontFamily: "sans-serif",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 0,
                        height: 0,
                        transform: "scaleY(0.42)",
                    }}
                >
                    {Array.from({ length: n }, (_, i) => {
                        const c = PALETTE[i % PALETTE.length]
                        const bg =
                            first?.type === "image"
                                ? `center / cover no-repeat url("${first.url}")`
                                : c[1]
                        return (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: -cardH / 2,
                                    width: cardW,
                                    height: cardH,
                                    transformOrigin: "0 50%",
                                    transform: `rotate(${(360 / n) * i}deg) translateX(${holeSize * cardW}px)`,
                                    background: bg,
                                    border: `2px solid ${props.borderColor ?? "#fff"}`,
                                    borderRadius: 4,
                                }}
                            />
                        )
                    })}
                </div>
                <div
                    style={{
                        position: "absolute",
                        bottom: 12,
                        width: "100%",
                        textAlign: "center",
                        color: "#999",
                        fontSize: 13,
                    }}
                >
                    Paper Wheel · interactive in Preview
                </div>
            </div>
        )
    }

    /* --- live --- */
    const onDown = (e: React.PointerEvent) => {
        const s = drag.current
        s.down = true
        s.lx = e.clientX
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    const onMove = (e: React.PointerEvent) => {
        const s = drag.current
        if (!s.down) return
        const sens = (props.dragSensitivity ?? 1) * (props.invertDrag ? -1 : 1)
        s.push += (e.clientX - s.lx) * 0.004 * sens
        s.lx = e.clientX
    }
    const onUp = () => {
        drag.current.down = false
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
                touchAction: "pan-y",
                cursor: "grab",
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

PaperWheel.displayName = "Paper Wheel"

PaperWheel.defaultProps = {
    width: 1000,
    height: 800,
    items: [],
    pageCount: 28,
    ratioW: 4,
    ratioH: 3,
    holeSize: 1.1,
    tilt: 24,
    zoom: 1,
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
    direction: "left",
    intro: true,
    introDuration: 3,
    replayIntro: false,
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(PaperWheel, {
    items: {
        type: ControlType.Array,
        title: "Pages",
        maxCount: 60,
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
        max: 60,
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
    holeSize: {
        type: ControlType.Number,
        title: "Hole Size",
        min: 0,
        max: 4,
        step: 0.05,
        description: "Open centre, in page widths.",
    },
    tilt: {
        type: ControlType.Number,
        title: "Camera Tilt",
        min: 0,
        max: 85,
        step: 1,
        unit: "°",
    },
    zoom: {
        type: ControlType.Number,
        title: "Zoom",
        min: 0.3,
        max: 3,
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
    direction: {
        type: ControlType.Enum,
        title: "Spin Dir",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        hidden: (p: any) => !p.autoRotate,
    },
    intro: {
        type: ControlType.Boolean,
        title: "Fan Intro",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    introDuration: {
        type: ControlType.Number,
        title: "Intro Time",
        min: 0.5,
        max: 8,
        step: 0.1,
        unit: "s",
        hidden: (p: any) => !p.intro,
    },
    replayIntro: {
        type: ControlType.Boolean,
        title: "Replay On View",
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p: any) => !p.intro,
        description: "Play the intro again each time it scrolls into view.",
    },
})
