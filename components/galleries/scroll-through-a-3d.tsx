import * as React from "react"
import { useEffect, useRef } from "react"
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
 * Page Corridor
 * A 3D hallway of image pages. Scroll, drag or let it drift; tap a page to
 * bring it to the front.
 *
 * Original implementation written for Framer (WebGL via three.js).
 * Add your own images through the "Images" property. With no images set,
 * numbered placeholder pages are shown, so the component ships with no
 * third-party artwork.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 */

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const CAM_FOV = 50
const CAM_Z = 8
const VIEW_H = 2 * CAM_Z * Math.tan((CAM_FOV * Math.PI) / 360)
const MAX_PAGES = 40
const PLACEHOLDER_COUNT = 8
const FOCUS_Z = 2
const TAP_SLOP = 6
const TAP_MS = 500

type Img = { src?: string; srcSet?: string; alt?: string }

interface Config {
    images: Img[]
    pages: number
    pageWidth: number
    pageHeight: number
    depthGap: number
    spread: number
    angle: number
    tilt: number
    bend: number
    focusOnClick: boolean
    focusSize: number
    focusSpeed: number
    scrollSpeed: number
    smoothing: number
    autoSpeed: number
    captureScroll: boolean
}

const DEFAULTS: Config = {
    images: [],
    pages: 16,
    pageWidth: 340,
    pageHeight: 440,
    depthGap: 170,
    spread: 250,
    angle: 55,
    tilt: 0,
    bend: 4,
    focusOnClick: true,
    focusSize: 80,
    focusSpeed: 5,
    scrollSpeed: 5,
    smoothing: 5,
    autoSpeed: 1,
    captureScroll: true,
}

const clamp = (v: unknown, lo: number, hi: number, fb: number) => {
    const n = typeof v === "number" && isFinite(v) ? v : fb
    return Math.min(hi, Math.max(lo, n))
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mod = (n: number, m: number) => ((n % m) + m) % m
const smooth = (a: number, b: number, x: number) => {
    const t = clamp01((x - a) / (b - a))
    return t * t * (3 - 2 * t)
}
const easeInOut = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const rad = (deg: number) => (deg * Math.PI) / 180

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const VERT = /* glsl */ `
uniform float uBow;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(uv.y * 3.14159265) * uBow;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

// Cover-fit sampling: the picture fills the page, cropping the overflow.
const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uMapAspect;
uniform float uCardAspect;
uniform float uAlpha;
uniform float uShade;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    float r = uMapAspect / uCardAspect;
    if (r > 1.0) {
        uv.x = (uv.x - 0.5) / r + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * r + 0.5;
    }
    vec4 c = texture2D(uMap, uv);
    gl_FragColor = vec4(c.rgb * uShade, c.a * uAlpha);
}
`

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */

interface MapEntry {
    tex: THREE.Texture
    aspect: number
}

function makePlaceholder(index: number): MapEntry {
    const w = 256
    const h = 320
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (ctx) {
        const hue = (index * 53 + 200) % 360
        const g = ctx.createLinearGradient(0, 0, w, h)
        g.addColorStop(0, `hsl(${hue}, 30%, 34%)`)
        g.addColorStop(1, `hsl(${(hue + 50) % 360}, 34%, 16%)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
        ctx.strokeStyle = "rgba(255,255,255,0.18)"
        ctx.lineWidth = 3
        ctx.strokeRect(10, 10, w - 20, h - 20)
        ctx.fillStyle = "rgba(255,255,255,0.75)"
        ctx.font = "600 84px system-ui, -apple-system, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(String(index + 1), w / 2, h / 2)
    }
    const tex = new THREE.CanvasTexture(canvas)
    return { tex, aspect: w / h }
}

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

interface Card {
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
    alpha: number
}

interface Metrics {
    wpp: number
    pw: number
    ph: number
    step: number
    count: number
    period: number
    spread: number
    yaw: number
    tilt: number
    focusScale: number
    focusDuration: number
    follow: number
    wheelGain: number
    autoPerSec: number
    bend: number
}

class Corridor {
    animated = true
    visible = true
    reducedMotion = false

    private el: HTMLElement
    private cfg: Config
    private renderer: THREE.WebGLRenderer
    private scene = new THREE.Scene()
    private camera: THREE.PerspectiveCamera
    private geometry = new THREE.PlaneGeometry(1, 1, 1, 16)
    private cards: Card[] = []
    private maps: MapEntry[] = []
    private raycaster = new THREE.Raycaster()
    private m!: Metrics

    private w = 1
    private h = 1
    private raf = 0
    private last = 0
    private disposed = false
    private imageKey = "\u0000"
    private loadToken = 0

    private scroll = { target: 0, current: 0 }
    private drag = { on: false, id: -1, x: 0 }
    private tap = { id: -1, x: 0, y: 0, at: 0 }
    private focus = { index: -1, t: 0, goal: 0 }

    constructor(el: HTMLElement, cfg: Config) {
        this.el = el
        this.cfg = cfg

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        this.renderer.setClearColor(0x000000, 0)
        const canvas = this.renderer.domElement
        canvas.style.cssText =
            "position:absolute;inset:0;width:100%;height:100%;display:block"
        el.appendChild(canvas)

        this.camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 300)
        this.camera.position.z = CAM_Z

        this.measure()
        this.rebuildCards()
        this.loadMaps()

        el.addEventListener("wheel", this.onWheel, { passive: false })
        el.addEventListener("pointerdown", this.onPointerDown)
        el.addEventListener("pointermove", this.onPointerMove)
        el.addEventListener("pointerup", this.onPointerUp)
        el.addEventListener("pointercancel", this.onPointerCancel)
        window.addEventListener("keydown", this.onKeyDown)
    }

    /* ---------- configuration ---------- */

    private measure() {
        const c = this.cfg
        const wpp = VIEW_H / Math.max(1, this.h)
        const pw = clamp(c.pageWidth, 40, 1400, DEFAULTS.pageWidth) * wpp
        const ph = clamp(c.pageHeight, 40, 1800, DEFAULTS.pageHeight) * wpp
        const step = Math.max(
            0.05,
            clamp(c.depthGap, 20, 800, DEFAULTS.depthGap) * wpp
        )
        let count = Math.round(clamp(c.pages, 4, MAX_PAGES, DEFAULTS.pages))
        if (count % 2 === 1) count += 1 // pages alternate sides, so keep it even

        const planeH = (VIEW_H * (CAM_Z - FOCUS_Z)) / CAM_Z
        const planeW = (planeH * this.w) / this.h
        const fill = clamp(c.focusSize, 30, 100, DEFAULTS.focusSize) / 100

        const smoothing = clamp(c.smoothing, 0, 10, DEFAULTS.smoothing)
        const sens = clamp(c.scrollSpeed, 0, 10, DEFAULTS.scrollSpeed)
        const auto = this.reducedMotion
            ? 0
            : clamp(c.autoSpeed, -10, 10, DEFAULTS.autoSpeed)

        this.m = {
            wpp,
            pw,
            ph,
            step,
            count,
            period: count * step,
            spread: clamp(c.spread, 0, 1200, DEFAULTS.spread) * wpp,
            yaw: rad(clamp(c.angle, 0, 85, DEFAULTS.angle)),
            tilt: rad(clamp(c.tilt, -45, 45, DEFAULTS.tilt)),
            focusScale: Math.min((planeH * fill) / ph, (planeW * fill) / pw),
            focusDuration:
                1.5 - clamp(c.focusSpeed, 0, 10, DEFAULTS.focusSpeed) * 0.11,
            follow: 0.25 * Math.pow(0.8, smoothing),
            wheelGain: 0.4 + sens * 0.16,
            autoPerSec: auto * step * 0.15,
            bend: clamp(c.bend, 0, 10, DEFAULTS.bend),
        }
    }

    private rebuildCards() {
        for (const card of this.cards) {
            this.scene.remove(card.mesh)
            card.mesh.material.dispose()
        }
        this.cards = []
        for (let i = 0; i < this.m.count; i++) {
            const material = new THREE.ShaderMaterial({
                vertexShader: VERT,
                fragmentShader: FRAG,
                transparent: true,
                side: THREE.DoubleSide,
                uniforms: {
                    uMap: { value: null },
                    uMapAspect: { value: 1 },
                    uCardAspect: { value: 1 },
                    uAlpha: { value: 1 },
                    uShade: { value: 1 },
                    uBow: { value: 0 },
                },
            })
            const mesh = new THREE.Mesh(this.geometry, material)
            mesh.rotation.order = "YXZ"
            mesh.frustumCulled = false
            this.scene.add(mesh)
            this.cards.push({ mesh, alpha: 0 })
        }
        this.bindMaps()
        if (this.focus.index >= this.m.count) this.clearFocus()
    }

    private bindMaps() {
        if (!this.maps.length) return
        this.cards.forEach((card, i) => {
            const entry = this.maps[i % this.maps.length]
            const u = card.mesh.material.uniforms
            u.uMap.value = entry.tex
            u.uMapAspect.value = entry.aspect
        })
    }

    private disposeMaps() {
        for (const entry of this.maps) entry.tex.dispose()
        this.maps = []
    }

    private loadMaps() {
        const list = (this.cfg.images || []).filter((img) => img && img.src)
        const key = list.map((img) => img.src).join("|")
        if (key === this.imageKey) return
        this.imageKey = key
        const token = ++this.loadToken

        this.disposeMaps()
        const n = list.length || PLACEHOLDER_COUNT
        this.maps = Array.from({ length: n }, (_, i) => makePlaceholder(i))
        this.bindMaps()

        if (!list.length) return
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin("anonymous")
        const maxAniso = this.renderer.capabilities.getMaxAnisotropy()

        list.forEach((img, i) => {
            loader.load(
                img.src as string,
                (tex) => {
                    if (this.disposed || token !== this.loadToken) {
                        tex.dispose()
                        return
                    }
                    const src = tex.image as { width?: number; height?: number }
                    const aspect =
                        src && src.width && src.height
                            ? src.width / src.height
                            : 1
                    tex.anisotropy = maxAniso
                    this.maps[i].tex.dispose()
                    this.maps[i] = { tex, aspect }
                    this.bindMaps()
                    this.invalidate()
                },
                undefined,
                () => {
                    /* keep the placeholder if an image fails to load */
                }
            )
        })
    }

    updateConfig(cfg: Config) {
        if (this.disposed) return
        const prevCount = this.m.count
        this.cfg = cfg
        this.measure()
        if (this.m.count !== prevCount) this.rebuildCards()
        if (!cfg.focusOnClick) this.clearFocus()
        this.loadMaps()
        this.invalidate()
    }

    setSize(width: number, height: number) {
        if (this.disposed) return
        this.w = Math.max(1, width)
        this.h = Math.max(1, height)
        this.renderer.setSize(this.w, this.h, false)
        this.camera.aspect = this.w / this.h
        this.camera.updateProjectionMatrix()
        this.measure()
        this.invalidate()
    }

    setMode(animated: boolean, reducedMotion: boolean) {
        this.animated = animated
        if (this.reducedMotion !== reducedMotion) {
            this.reducedMotion = reducedMotion
            this.measure()
        }
        this.invalidate()
    }

    setVisible(visible: boolean) {
        this.visible = visible
        if (visible) this.invalidate()
    }

    /* ---------- interaction ---------- */

    private clearFocus() {
        this.focus = { index: -1, t: 0, goal: 0 }
    }

    private push(delta: number) {
        if (!isFinite(delta)) return
        this.scroll.target += delta
        this.invalidate()
    }

    private onWheel = (e: WheelEvent) => {
        if (this.disposed || !this.cfg.captureScroll) return
        if (this.focus.index >= 0) return
        e.preventDefault()
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.h : 1
        const dx = e.deltaX * unit
        const dy = e.deltaY * unit
        const d = Math.abs(dx) > Math.abs(dy) ? dx : dy
        this.push(d * this.m.wpp * this.m.wheelGain)
    }

    private onPointerDown = (e: PointerEvent) => {
        if (this.disposed || e.button !== 0) return
        this.tap = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            at: performance.now(),
        }
        this.el.setPointerCapture?.(e.pointerId)
        if (this.focus.index < 0) {
            this.drag = { on: true, id: e.pointerId, x: e.clientX }
        }
    }

    private onPointerMove = (e: PointerEvent) => {
        if (!this.drag.on || e.pointerId !== this.drag.id) return
        const dx = this.drag.x - e.clientX
        this.drag.x = e.clientX
        this.push(dx * 2 * this.m.wpp * this.m.wheelGain)
    }

    private onPointerUp = (e: PointerEvent) => {
        if (e.pointerId === this.drag.id)
            this.drag = { on: false, id: -1, x: 0 }
        if (e.pointerId !== this.tap.id) return
        this.el.releasePointerCapture?.(e.pointerId)
        this.tap.id = -1
        const moved = Math.hypot(e.clientX - this.tap.x, e.clientY - this.tap.y)
        if (moved <= TAP_SLOP && performance.now() - this.tap.at <= TAP_MS) {
            this.onTap(e.clientX, e.clientY)
        }
    }

    private onPointerCancel = (e: PointerEvent) => {
        if (e.pointerId === this.drag.id)
            this.drag = { on: false, id: -1, x: 0 }
        if (e.pointerId === this.tap.id) {
            this.el.releasePointerCapture?.(e.pointerId)
            this.tap.id = -1
        }
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && this.focus.index >= 0) {
            this.focus.goal = 0
            this.invalidate()
        }
    }

    private pick(clientX: number, clientY: number): number {
        const r = this.el.getBoundingClientRect()
        if (r.width <= 0 || r.height <= 0) return -1
        const ndc = new THREE.Vector2(
            ((clientX - r.left) / r.width) * 2 - 1,
            -((clientY - r.top) / r.height) * 2 + 1
        )
        this.camera.updateMatrixWorld()
        this.raycaster.setFromCamera(ndc, this.camera)
        const targets = this.cards
            .filter((c) => c.alpha > 0.25)
            .map((c) => c.mesh)
        const hit = this.raycaster.intersectObjects(targets, false)[0]
        if (!hit) return -1
        return this.cards.findIndex((c) => c.mesh === hit.object)
    }

    private onTap(clientX: number, clientY: number) {
        if (!this.cfg.focusOnClick) return
        if (this.focus.index >= 0) {
            this.focus.goal = 0
        } else {
            const hit = this.pick(clientX, clientY)
            if (hit >= 0) this.focus = { index: hit, t: 0, goal: 1 }
        }
        this.invalidate()
    }

    /* ---------- frame loop ---------- */

    private tick = () => {
        this.raf = 0
        if (this.disposed) return
        this.step()
        if (this.animated && this.visible && !this.settled()) {
            this.raf = requestAnimationFrame(this.tick)
        }
    }

    invalidate() {
        if (this.disposed || this.raf) return
        this.last = performance.now()
        this.raf = requestAnimationFrame(this.tick)
    }

    private settled() {
        const f = this.focus
        const focusIdle = f.index < 0 || f.t === f.goal
        return (
            focusIdle &&
            this.m.autoPerSec === 0 &&
            Math.abs(this.scroll.target - this.scroll.current) < 0.0005
        )
    }

    private step() {
        const now = performance.now()
        let dt = (now - this.last) / 1000
        this.last = now
        if (!isFinite(dt) || dt < 0) dt = 0
        dt = Math.min(dt, 0.05)
        const m = this.m

        // focus transition
        const f = this.focus
        if (f.index >= 0) {
            const rate = dt / Math.max(0.05, m.focusDuration)
            f.t = clamp01(f.t + (f.goal ? rate : -rate))
            if (f.t === 0 && f.goal === 0) f.index = -1
        }
        const fe = easeInOut(f.t)

        // scroll
        if (m.autoPerSec !== 0 && f.index < 0 && this.animated) {
            this.scroll.target += m.autoPerSec * dt
        }
        const lag = this.scroll.target - this.scroll.current
        this.scroll.current += lag * (1 - Math.pow(1 - m.follow, dt * 60))
        if (Math.abs(this.scroll.current) > m.period * 4) {
            const wrap = Math.sign(this.scroll.current) * m.period * 4
            this.scroll.current -= wrap
            this.scroll.target -= wrap
        }
        const bowAmount = clamp(lag / (m.pw * 3), -1, 1) * m.bend * m.pw * 0.04

        // lay out pages
        const cur = this.scroll.current
        const zFront = 2
        this.cards.forEach((card, i) => {
            const d = mod(i * m.step - cur, m.period)
            const side = i % 2 === 0 ? -1 : 1
            const fadeIn = smooth(0, m.step * 1.2, d)
            const fadeOut = 1 - smooth(m.period * 0.55, m.period * 0.98, d)

            const isFocus = i === f.index
            const e = isFocus ? fe : 0
            const mesh = card.mesh

            mesh.position.set(
                lerp(side * m.spread, 0, e),
                0,
                lerp(zFront - d, FOCUS_Z, e)
            )
            mesh.rotation.y = lerp(-side * m.yaw, 0, e)
            mesh.rotation.x = lerp(m.tilt, 0, e)
            const s = lerp(1, m.focusScale, e)
            mesh.scale.set(m.pw * s, m.ph * s, 1)

            card.alpha = lerp(fadeIn * fadeOut, 1, e)
            const u = mesh.material.uniforms
            u.uAlpha.value = card.alpha
            u.uShade.value = isFocus ? 1 : 1 - 0.7 * fe
            u.uBow.value = bowAmount * (1 - e)
            u.uCardAspect.value = m.pw / m.ph
            mesh.visible = card.alpha > 0.003
        })

        this.el.style.cursor =
            this.focus.index >= 0 && this.focus.goal === 1
                ? "zoom-out"
                : this.cfg.focusOnClick
                  ? "grab"
                  : "default"

        this.renderer.render(this.scene, this.camera)
    }

    /* ---------- teardown ---------- */

    dispose() {
        this.disposed = true
        cancelAnimationFrame(this.raf)
        const el = this.el
        el.removeEventListener("wheel", this.onWheel)
        el.removeEventListener("pointerdown", this.onPointerDown)
        el.removeEventListener("pointermove", this.onPointerMove)
        el.removeEventListener("pointerup", this.onPointerUp)
        el.removeEventListener("pointercancel", this.onPointerCancel)
        window.removeEventListener("keydown", this.onKeyDown)
        for (const card of this.cards) card.mesh.material.dispose()
        this.disposeMaps()
        this.geometry.dispose()
        this.renderer.dispose()
        this.renderer.domElement.parentNode?.removeChild(
            this.renderer.domElement
        )
    }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type Props = Partial<Config> & {
    background?: string
    style?: React.CSSProperties
}

export default function PageCorridor(props: Props) {
    const { background = "#0A0A0A", style, ...rest } = props
    const cfg: Config = { ...DEFAULTS }
    ;(Object.keys(DEFAULTS) as (keyof Config)[]).forEach((key) => {
        const v = (rest as Record<string, unknown>)[key]
        if (v !== undefined && v !== null)
            (cfg as Record<string, unknown>)[key] = v
    })
    if (!Array.isArray(cfg.images)) cfg.images = []

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<Corridor | null>(null)
    const cfgRef = useRef<Config>(cfg)
    cfgRef.current = cfg

    const configKey = JSON.stringify([
        cfg.images.map((i) => (i && i.src) || ""),
        cfg.pages,
        cfg.pageWidth,
        cfg.pageHeight,
        cfg.depthGap,
        cfg.spread,
        cfg.angle,
        cfg.tilt,
        cfg.bend,
        cfg.focusOnClick,
        cfg.focusSize,
        cfg.focusSpeed,
        cfg.scrollSpeed,
        cfg.smoothing,
        cfg.autoSpeed,
        cfg.captureScroll,
    ])

    // create / destroy the WebGL scene
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        let engine: Corridor
        try {
            engine = new Corridor(el, cfgRef.current)
        } catch {
            return // WebGL unavailable: the background colour still renders
        }
        engineRef.current = engine
        engine.setSize(el.clientWidth, el.clientHeight)

        const ro = new ResizeObserver(() =>
            engine.setSize(el.clientWidth, el.clientHeight)
        )
        ro.observe(el)

        const io = new IntersectionObserver(
            (entries) =>
                engine.setVisible(entries.some((e) => e.isIntersecting)),
            { threshold: 0 }
        )
        io.observe(el)

        return () => {
            ro.disconnect()
            io.disconnect()
            engine.dispose()
            engineRef.current = null
        }
    }, [])

    // push prop changes into the scene
    useEffect(() => {
        engineRef.current?.updateConfig(cfgRef.current)
    }, [configKey])

    // static on the Framer canvas / exports, animated everywhere else
    useEffect(() => {
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        engineRef.current?.setMode(!isStatic, !!reduce)
    }, [isStatic])

    const firstAlt = cfg.images[0]?.alt

    return (
        <div
            ref={containerRef}
            role="img"
            aria-label={
                firstAlt ||
                "A 3D corridor of pages. Scroll or drag to move through them."
            }
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 120,
                minHeight: 120,
                overflow: "hidden",
                background,
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: "grab",
                ...style,
            }}
        />
    )
}

PageCorridor.defaultProps = {
    ...DEFAULTS,
    background: "#0A0A0A",
    width: 900,
    height: 600,
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(PageCorridor, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        description: "Leave empty to preview numbered placeholder pages.",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0A",
    },
    pages: {
        type: ControlType.Number,
        title: "Pages",
        min: 4,
        max: MAX_PAGES,
        step: 2,
        displayStepper: true,
        defaultValue: DEFAULTS.pages,
    },
    pageWidth: {
        type: ControlType.Number,
        title: "Page Width",
        min: 80,
        max: 1000,
        step: 10,
        unit: "px",
        defaultValue: DEFAULTS.pageWidth,
    },
    pageHeight: {
        type: ControlType.Number,
        title: "Page Height",
        min: 80,
        max: 1200,
        step: 10,
        unit: "px",
        defaultValue: DEFAULTS.pageHeight,
    },
    depthGap: {
        type: ControlType.Number,
        title: "Depth Gap",
        min: 40,
        max: 600,
        step: 10,
        unit: "px",
        defaultValue: DEFAULTS.depthGap,
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        min: 0,
        max: 800,
        step: 10,
        unit: "px",
        defaultValue: DEFAULTS.spread,
    },
    angle: {
        type: ControlType.Number,
        title: "Page Angle",
        min: 0,
        max: 85,
        step: 1,
        unit: "°",
        defaultValue: DEFAULTS.angle,
    },
    tilt: {
        type: ControlType.Number,
        title: "Page Tilt",
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
        defaultValue: DEFAULTS.tilt,
    },
    bend: {
        type: ControlType.Number,
        title: "Bend",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: DEFAULTS.bend,
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: DEFAULTS.scrollSpeed,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: DEFAULTS.smoothing,
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Drift",
        min: -10,
        max: 10,
        step: 0.5,
        defaultValue: DEFAULTS.autoSpeed,
        description: "0 turns drifting off. Negative reverses direction.",
    },
    captureScroll: {
        type: ControlType.Boolean,
        title: "Page Scroll",
        enabledTitle: "Capture",
        disabledTitle: "Pass Through",
        defaultValue: DEFAULTS.captureScroll,
        description:
            "Capture uses the mouse wheel for the corridor. Pass Through lets the page scroll normally.",
    },
    focusOnClick: {
        type: ControlType.Boolean,
        title: "Tap to View",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: DEFAULTS.focusOnClick,
    },
    focusSize: {
        type: ControlType.Number,
        title: "Viewed Size",
        min: 30,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: DEFAULTS.focusSize,
        hidden: (props: Props) => props.focusOnClick === false,
    },
    focusSpeed: {
        type: ControlType.Number,
        title: "View Speed",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: DEFAULTS.focusSpeed,
        hidden: (props: Props) => props.focusOnClick === false,
    },
})
