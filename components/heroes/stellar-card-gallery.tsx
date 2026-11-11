// Stellar Card Gallery — orbitable 3D sphere of photo cards over a starfield, with a detail modal.
// Single self-contained component. Dependency-free: no three.js, no CDN imports. Cards are CSS 3D
// planes viewed through a perspective camera that mirrors the original drei <OrbitControls> setup
// (fov 60, start z=15, rotate 0.5, zoom 1.2, pan 0.8, distance 5–40, damping 0.05); the starfield
// (10,000 points, fov 75 camera, slow rotation) and wireframe spheres are drawn on 2D canvases.
// The rAF loop only runs while there is something to animate (orbit damping, auto-rotate, star
// drift), stops itself when idle, pauses off-screen / in hidden tabs / under reduced motion, and
// never runs in Framer's static renderer, which shows a still frame instead.
import * as React from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ResponsiveImage {
    src: string
    srcSet?: string
    alt?: string
}

interface CardItem {
    image?: ResponsiveImage
    title?: string
}

interface StellarCardGalleryProps {
    cards: CardItem[]
    accent: string
    cardColor: string
    textColor: string
    cardFont: CSSProperties
    modalFont: CSSProperties
    cameraDistance: number
    minDistance: number
    maxDistance: number
    autoRotate: boolean
    autoRotateSpeed: number
    damping: boolean
    wheelZoom: boolean
    enablePan: boolean
    touchScroll: boolean
    showSpheres: boolean
    showStars: boolean
    starSpeed: number
    background: string
    responsive: boolean
    showModal: boolean
    showActions: boolean
    downloadLabel: string
    style?: CSSProperties
}

const BASE = "https://framerusercontent.com/images/"
const DEFAULT_CARDS: { src: string; title: string }[] = [
    ["J2XgGCOvRP5mEkgPwHEoJ6DnH0", "Portrait Session"],
    ["y11DN5pLFzv1LrRLzeilhJtjh0E", "Sushi Rolls"],
    ["VJTDz7qViYXsVv8JrXQXigwSsc", "Plated Dessert"],
    ["1BxR25UzMG6qPrSSnuW0TQSzCE", "Evening Pairing"],
    ["57Wu8Y3TmB3aX3JuCE9kwqeBPpc", "Temple Courtyard"],
    ["diIKWrS1jLrNSZPeyl8qJUK4Vs", "Canapé Tray"],
    ["AHjeEkTMaGwAEz0P0felP6VAwI", "Juice Shots"],
    ["HOiknjgUoxHh1JIVQNYfOaXc1Hs", "Hand-Painted"],
    ["rwcxxzw4Qob5nXKBpP14KmRdjUI", "Greenhouse Portrait"],
    ["0MJAjAoAaQR8lnhINkWoyX00MEo", "Humayun's Tomb"],
    ["JovpSqY6qsK0AgLzgEOMHK4JDVM", "Garden Buffet"],
    ["6f3SOg8k20CQEm6TMqiooMNJQ", "Dining Room"],
    ["X4Y7IbMe36CboqWFumx34T1x10", "Fresh Pour"],
    ["cNiVXn0fCb678NcgEOmdyfe8wU", "Lakeside Lunch"],
    ["gFskrqbqSCjhFvUCwAwKtw0lUI", "Pancake Stack"],
    ["jkoJdta0CZxQqNUezhMjWvw0Uo", "Smoothie Bowl"],
    ["Id2dI2v23ikCMGelsK89X7cVETE", "Berry Parfait"],
    ["vMlOqIjImiVzDjytSEgAwICagQ", "Crisp Dosa"],
    ["DUiGfPPslnTh1xBDsc9WwCS6s", "Shoreline Dusk"],
    ["2u1I2xq43LVlC9DpP16iCvo2yHo", "Morning Flow"],
].map(([id, title]) => ({ src: `${BASE}${id}.jpg`, title }))

// Original scene constants
const FOV = 60
const NEAR = 0.1
const CARD_W = 160 // w-40
const CARD_H = 208 // h-52
const CARD_WORLD_W = 4 // 160px * distanceFactor(10) / 400
const ROTATE_SPEED = 0.5
const ZOOM_SPEED = 1.2
const PAN_SPEED = 0.8
// drei's <OrbitControls> enables damping by default (dampingFactor 0.05 per 60fps frame).
const DAMPING = 0.05
const SPHERES = [
    { r: 2, color: "#1a1a2e", opacity: 0.15 },
    { r: 12, color: "", opacity: 0.05 },
    { r: 16, color: "", opacity: 0.03 },
    { r: 20, color: "", opacity: 0.02 },
]
const SEG = 32

// Original starfield: 10,000 points in a 2000-unit cube, size 0.7 with attenuation, seen by a
// fov-75 camera at z=10; rotation.y += 0.0001 and rotation.x += 0.00005 per frame.
const STAR_COUNT = 10000
const STAR_FOV = 75
const STAR_SIZE = 0.7
const STARS = (() => {
    let seed = 0x9e3779b9
    const rand = () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const pos = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < pos.length; i++) pos[i] = (rand() - 0.5) * 2000
    return pos
})()

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

type Vec3 = [number, number, number]

interface Camera {
    theta: number
    phi: number
    dist: number
    target: Vec3
}

interface Basis {
    pos: Vec3
    right: Vec3
    up: Vec3
    fwd: Vec3
    focal: number
}

function cardPositions(count: number): Vec3[] {
    const out: Vec3[] = []
    const golden = (1 + Math.sqrt(5)) / 2
    for (let i = 0; i < count; i++) {
        const y = count > 1 ? 1 - (i / (count - 1)) * 2 : 0
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
        const theta = (2 * Math.PI * i) / golden
        const layer = 12 + (i % 3) * 4
        out.push([
            Math.cos(theta) * radiusAtY * layer,
            y * layer,
            Math.sin(theta) * radiusAtY * layer,
        ])
    }
    return out
}

// Unit sphere vertices + wireframe edges, matching THREE.SphereGeometry(r, 32, 32) wireframe.
const UNIT_SPHERE = (() => {
    const verts: Vec3[] = []
    for (let iy = 0; iy <= SEG; iy++) {
        const v = iy / SEG
        for (let ix = 0; ix <= SEG; ix++) {
            const u = ix / SEG
            verts.push([
                -Math.cos(u * 2 * Math.PI) * Math.sin(v * Math.PI),
                Math.cos(v * Math.PI),
                Math.sin(u * 2 * Math.PI) * Math.sin(v * Math.PI),
            ])
        }
    }
    const idx = (iy: number, ix: number) => iy * (SEG + 1) + ix
    const edges: number[] = []
    for (let iy = 0; iy < SEG; iy++) {
        for (let ix = 0; ix < SEG; ix++) {
            const a = idx(iy, ix + 1)
            const b = idx(iy, ix)
            const c = idx(iy + 1, ix)
            const d = idx(iy + 1, ix + 1)
            if (iy !== 0) edges.push(a, b, b, d, d, a)
            if (iy !== SEG - 1) edges.push(b, c, c, d)
        }
    }
    return { verts, edges }
})()

function cameraBasis(cam: Camera, h: number): Basis {
    const s = Math.sin(cam.phi)
    const pos: Vec3 = [
        cam.target[0] + cam.dist * s * Math.sin(cam.theta),
        cam.target[1] + cam.dist * Math.cos(cam.phi),
        cam.target[2] + cam.dist * s * Math.cos(cam.theta),
    ]
    let fx = cam.target[0] - pos[0]
    let fy = cam.target[1] - pos[1]
    let fz = cam.target[2] - pos[2]
    const fl = Math.hypot(fx, fy, fz) || 1
    fx /= fl
    fy /= fl
    fz /= fl
    // right = fwd × worldUp(0,1,0)
    let rx = -fz
    let rz = fx
    const rl = Math.hypot(rx, rz) || 1
    rx /= rl
    rz /= rl
    // up = right × fwd
    const ux = -rz * fy
    const uy = rz * fx - rx * fz
    const uz = rx * fy
    return {
        pos,
        right: [rx, 0, rz],
        up: [ux, uy, uz],
        fwd: [fx, fy, fz],
        focal: h / 2 / Math.tan(((FOV / 2) * Math.PI) / 180),
    }
}

function toView(b: Basis, p: Vec3): Vec3 {
    const vx = p[0] - b.pos[0]
    const vy = p[1] - b.pos[1]
    const vz = p[2] - b.pos[2]
    return [
        vx * b.right[0] + vy * b.right[1] + vz * b.right[2],
        vx * b.up[0] + vy * b.up[1] + vz * b.up[2],
        vx * b.fwd[0] + vy * b.fwd[1] + vz * b.fwd[2],
    ]
}

interface CardLayout {
    transform: string
    zIndex: number
    opacity: number
    visible: boolean
}

// Cards are real CSS 3D planes: the layer's `perspective` equals the camera focal length, each
// card sits at its view-space position (40px per world unit, so the 160px card is 4 units wide —
// drei <Html transform distanceFactor={10}>) and is rotated to face the camera like group.lookAt().
const PX_PER_UNIT = CARD_W / CARD_WORLD_W

function layoutCard(b: Basis, p: Vec3): CardLayout {
    const [x, y, z] = toView(b, p)
    if (z <= 0.5) return { transform: "none", zIndex: 0, opacity: 0, visible: false }
    const len = Math.hypot(x, y, z) || 1
    const rotX = -Math.asin(y / len)
    const rotY = Math.atan2(-x, z)
    const tx = x * PX_PER_UNIT
    const ty = -y * PX_PER_UNIT
    const tz = b.focal - z * PX_PER_UNIT
    return {
        transform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, ${tz.toFixed(2)}px) rotateY(${rotY.toFixed(5)}rad) rotateX(${rotX.toFixed(5)}rad)`,
        zIndex: Math.max(1, Math.round(10000 - z * 100)),
        // Cards that end up almost on the lens would fill the screen; fade them out.
        opacity: Math.min(1, Math.max(0, (z - 1.5) / 2)),
        visible: true,
    }
}

function clampPhi(phi: number) {
    const eps = 0.000001
    return Math.min(Math.PI - eps, Math.max(eps, phi))
}

/**
 * Stellar Card Gallery
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function StellarCardGallery(props: StellarCardGalleryProps) {
    const {
        cards: cardsProp,
        accent = "#31b8c6",
        cardColor = "#1F2121",
        textColor = "#FFFFFF",
        cardFont,
        modalFont,
        cameraDistance = 15,
        minDistance = 5,
        maxDistance = 40,
        autoRotate = false,
        autoRotateSpeed = 2,
        damping = true,
        wheelZoom = true,
        enablePan = true,
        touchScroll = true,
        showSpheres = true,
        showStars = true,
        starSpeed = 1,
        background = "#000000",
        responsive = true,
        showModal = true,
        showActions = true,
        downloadLabel = "Download",
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const cards = useMemo(() => {
        const list: CardItem[] = cardsProp && cardsProp.length > 0 ? cardsProp : DEFAULT_CARDS.map((c) => ({ title: c.title }))
        return list.map((c, i) => {
            const fallback = DEFAULT_CARDS[i % DEFAULT_CARDS.length]
            const src = c.image?.src || fallback.src
            const title = c.title ?? fallback.title
            return {
                id: String(i),
                src,
                srcSet: c.image?.src ? c.image.srcSet : undefined,
                alt: c.image?.alt || title,
                title,
            }
        })
    }, [cardsProp])

    const positions = useMemo(() => cardPositions(cards.length), [cards.length])

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const starsRef = useRef<HTMLCanvasElement>(null)
    const starRot = useRef({ x: 0, y: 0 })
    const layerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const sizeRef = useRef({ w: 1200, h: 800 })
    const camRef = useRef<Camera>({
        theta: 0,
        phi: Math.PI / 2,
        dist: Math.min(maxDistance, Math.max(minDistance, cameraDistance)),
        target: [0, 0, 0],
    })
    const accentRgbRef = useRef("rgb(49, 184, 198)")
    // Pending orbit input (OrbitControls' sphericalDelta / panOffset) and the render loop state.
    const motion = useRef({ dTheta: 0, dPhi: 0, pan: [0, 0, 0] as Vec3 })
    const loop = useRef({ raf: 0, last: 0, auto: false, stars: false })
    const settings = useRef({ damping, autoRotateSpeed, starSpeed, showStars })
    settings.current = { damping, autoRotateSpeed, starSpeed, showStars }
    // Camera distance = base distance (prop, widened for tall/narrow frames when Responsive is on)
    // × the visitor's own zoom.
    const distSettings = useRef({ cameraDistance, minDistance, maxDistance, responsive })
    distSettings.current = { cameraDistance, minDistance, maxDistance, responsive }
    const zoomRef = useRef(1)

    const [hovered, setHovered] = useState<number | null>(null)
    const [selected, setSelected] = useState<number | null>(null)

    const baseDistance = () => {
        const d = distSettings.current
        const { w, h } = sizeRef.current
        // 1.5 aspect (desktop) keeps the original distance; portrait frames move the camera back
        // (≈24 on a 810×1080 tablet, ≈32 on a 390×844 phone) so the whole galaxy stays in view.
        const k = d.responsive ? Math.pow(Math.max(1, 1.5 / Math.max(0.1, w / h)), 0.65) : 1
        return d.cameraDistance * k
    }
    const applyDistance = () => {
        const d = distSettings.current
        camRef.current.dist = Math.min(d.maxDistance, Math.max(d.minDistance, baseDistance() * zoomRef.current))
    }

    useEffect(() => {
        applyDistance()
        invalidate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraDistance, minDistance, maxDistance, responsive])

    const drawStars = () => {
        const canvas = starsRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const { w, h } = sizeRef.current
        const dpr = canvas.width / Math.max(1, w)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)
        if (!settings.current.showStars) return
        const f = h / 2 / Math.tan(((STAR_FOV / 2) * Math.PI) / 180)
        const { x: rx, y: ry } = starRot.current
        const cx = Math.cos(rx)
        const sx = Math.sin(rx)
        const cy = Math.cos(ry)
        const sy = Math.sin(ry)
        const minSize = 1 / dpr
        ctx.fillStyle = "#ffffff"
        for (let i = 0; i < STARS.length; i += 3) {
            const px = STARS[i]
            const py = STARS[i + 1]
            const pz = STARS[i + 2]
            // Euler XYZ (three.js default): rotate around Y, then X.
            const x1 = px * cy + pz * sy
            const z1 = -px * sy + pz * cy
            const y2 = py * cx - z1 * sx
            const z2 = py * sx + z1 * cx
            const depth = 10 - z2
            if (depth <= 0.1 || depth > 2000) continue
            const X = w / 2 + (x1 * f) / depth
            const Y = h / 2 - (y2 * f) / depth
            if (X < -4 || Y < -4 || X > w + 4 || Y > h + 4) continue
            const size = Math.max(minSize, (STAR_SIZE * f) / depth)
            ctx.fillRect(X - size / 2, Y - size / 2, size, size)
        }
    }
    const drawStarsRef = useRef(drawStars)
    drawStarsRef.current = drawStars

    const drawSpheres = useCallback(
        (b: Basis) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            const { w, h } = sizeRef.current
            const dpr = canvas.width / Math.max(1, w)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)
            if (!showSpheres) return
            const { verts, edges } = UNIT_SPHERE
            const view: Vec3[] = new Array(verts.length)
            // WebGL wireframe lines are one device pixel wide.
            ctx.lineWidth = 1 / dpr
            for (const sphere of SPHERES) {
                for (let i = 0; i < verts.length; i++) {
                    const v = verts[i]
                    view[i] = toView(b, [v[0] * sphere.r, v[1] * sphere.r, v[2] * sphere.r])
                }
                ctx.beginPath()
                for (let e = 0; e < edges.length; e += 2) {
                    let p = view[edges[e]]
                    let q = view[edges[e + 1]]
                    if (p[2] < NEAR && q[2] < NEAR) continue
                    if (p[2] < NEAR || q[2] < NEAR) {
                        // Clip the segment to the near plane.
                        if (p[2] < NEAR) [p, q] = [q, p]
                        const t = (p[2] - NEAR) / (p[2] - q[2])
                        q = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, NEAR]
                    }
                    ctx.moveTo(w / 2 + (p[0] * b.focal) / p[2], h / 2 - (p[1] * b.focal) / p[2])
                    ctx.lineTo(w / 2 + (q[0] * b.focal) / q[2], h / 2 - (q[1] * b.focal) / q[2])
                }
                ctx.strokeStyle = sphere.color || accentRgbRef.current
                ctx.globalAlpha = sphere.opacity
                ctx.stroke()
            }
            ctx.globalAlpha = 1
        },
        [showSpheres]
    )

    const renderScene = useCallback(() => {
        const { h } = sizeRef.current
        const b = cameraBasis(camRef.current, h)
        if (layerRef.current) layerRef.current.style.perspective = `${b.focal.toFixed(2)}px`
        for (let i = 0; i < positions.length; i++) {
            const el = cardRefs.current[i]
            if (!el) continue
            const l = layoutCard(b, positions[i])
            el.style.transform = l.transform
            el.style.zIndex = String(l.zIndex)
            el.style.opacity = String(l.opacity)
            el.style.visibility = l.visible && l.opacity > 0 ? "visible" : "hidden"
        }
        drawSpheres(b)
    }, [positions, drawSpheres])

    const renderRef = useRef(renderScene)
    renderRef.current = renderScene

    const hasMomentum = () => {
        const m = motion.current
        return Math.abs(m.dTheta) > 1e-5 || Math.abs(m.dPhi) > 1e-5 || Math.hypot(m.pan[0], m.pan[1], m.pan[2]) > 1e-5
    }

    // Apply pending input like OrbitControls.update(): with damping, 5% of the remaining delta per
    // 60fps frame (scaled by real frame time), otherwise all at once.
    const step = (dt: number) => {
        const m = motion.current
        const cam = camRef.current
        const keep = settings.current.damping ? Math.pow(1 - DAMPING, dt * 60) : 0
        const k = 1 - keep
        cam.theta += m.dTheta * k
        cam.phi = clampPhi(cam.phi + m.dPhi * k)
        for (let i = 0; i < 3; i++) {
            cam.target[i] += m.pan[i] * k
            m.pan[i] *= keep
        }
        m.dTheta *= keep
        m.dPhi *= keep
        if (!hasMomentum()) {
            m.dTheta = m.dPhi = 0
            m.pan = [0, 0, 0]
        }
        if (loop.current.auto && pointers.current.size === 0) {
            cam.theta -= ((2 * Math.PI) / 60) * settings.current.autoRotateSpeed * dt
        }
    }

    // One rAF loop that only runs while there is something to animate (momentum or auto-rotate),
    // then stops itself. Never started in static renderers.
    const tick = (t: number) => {
        const L = loop.current
        L.raf = 0
        const dt = L.last ? Math.min(0.1, (t - L.last) / 1000) : 1 / 60
        L.last = t
        const cameraMoving = hasMomentum() || L.auto
        step(dt)
        if (cameraMoving) renderRef.current()
        if (L.stars) {
            const frames = dt * 60 * settings.current.starSpeed
            starRot.current.y += 0.0001 * frames
            starRot.current.x += 0.00005 * frames
            drawStarsRef.current()
        }
        if (hasMomentum() || L.auto || L.stars) L.raf = window.requestAnimationFrame(tick)
        else L.last = 0
    }

    function invalidate() {
        if (typeof window === "undefined") return
        if (!loop.current.raf) loop.current.raf = window.requestAnimationFrame(tick)
    }

    // Size, accent colour, first paint
    useIsoLayoutEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return
        const resolveAccent = () => {
            const c = getComputedStyle(root).color
            if (c) accentRgbRef.current = c
        }
        const measure = () => {
            const w = Math.max(1, root.clientWidth)
            const h = Math.max(1, root.clientHeight)
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            sizeRef.current = { w, h }
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            const stars = starsRef.current
            if (stars) {
                stars.width = Math.round(w * dpr)
                stars.height = Math.round(h * dpr)
                stars.style.width = `${w}px`
                stars.style.height = `${h}px`
            }
            resolveAccent()
            applyDistance()
            renderRef.current()
            drawStarsRef.current()
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(root)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        const root = rootRef.current
        if (root) accentRgbRef.current = getComputedStyle(root).color || accentRgbRef.current
        renderRef.current()
    }, [accent, renderScene])

    useEffect(() => {
        return () => {
            if (loop.current.raf) cancelAnimationFrame(loop.current.raf)
            loop.current.raf = 0
        }
    }, [])

    // ---------- Interaction (disabled in static renderers) ----------
    const pointers = useRef(new Map<number, { x: number; y: number }>())
    const drag = useRef({ moved: false, startX: 0, startY: 0, mode: "rotate" as "rotate" | "pan", card: -1, pinch: 0 })

    const rotate = (dx: number, dy: number) => {
        const h = sizeRef.current.h
        motion.current.dTheta -= ((2 * Math.PI * dx) / h) * ROTATE_SPEED
        motion.current.dPhi -= ((2 * Math.PI * dy) / h) * ROTATE_SPEED
    }

    const pan = (dx: number, dy: number) => {
        if (!enablePan) return
        const { h } = sizeRef.current
        const cam = camRef.current
        const b = cameraBasis(cam, h)
        const td = cam.dist * Math.tan(((FOV / 2) * Math.PI) / 180)
        const left = ((2 * dx * td) / h) * PAN_SPEED
        const up = ((2 * dy * td) / h) * PAN_SPEED
        for (let k = 0; k < 3; k++) motion.current.pan[k] += -b.right[k] * left + b.up[k] * up
    }

    const setDistance = (next: number) => {
        const cam = camRef.current
        const clamped = Math.min(distSettings.current.maxDistance, Math.max(distSettings.current.minDistance, next))
        const changed = Math.abs(clamped - cam.dist) > 1e-6
        cam.dist = clamped
        zoomRef.current = clamped / Math.max(0.001, baseDistance())
        return changed
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic) return
        const cardEl = (e.target as HTMLElement).closest?.("[data-card]") as HTMLElement | null
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
        const d = drag.current
        if (pointers.current.size === 1) {
            d.moved = false
            d.startX = e.clientX
            d.startY = e.clientY
            d.mode = e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey ? "pan" : "rotate"
            d.card = cardEl ? Number(cardEl.dataset.card) : -1
        } else {
            d.moved = true
            d.card = -1
            const [a, b] = Array.from(pointers.current.values())
            d.pinch = Math.hypot(a.x - b.x, a.y - b.y)
        }
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const prev = pointers.current.get(e.pointerId)
        if (!prev || isStatic) return
        const d = drag.current
        if (pointers.current.size >= 2) {
            const before = Array.from(pointers.current.values())
            const cx0 = (before[0].x + before[1].x) / 2
            const cy0 = (before[0].y + before[1].y) / 2
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
            const after = Array.from(pointers.current.values())
            const cx1 = (after[0].x + after[1].x) / 2
            const cy1 = (after[0].y + after[1].y) / 2
            const dist = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y)
            if (d.pinch > 0 && dist > 0) setDistance(camRef.current.dist * Math.pow(d.pinch / dist, ZOOM_SPEED))
            d.pinch = dist
            pan(cx1 - cx0, cy1 - cy0)
            invalidate()
            return
        }
        const dx = e.clientX - prev.x
        const dy = e.clientY - prev.y
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4) d.moved = true
        if (!d.moved) return
        if (d.mode === "pan") pan(dx, dy)
        else rotate(dx, dy)
        invalidate()
    }

    const endPointer = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
        if (!pointers.current.has(e.pointerId)) return
        pointers.current.delete(e.pointerId)
        const d = drag.current
        if (pointers.current.size === 0) {
            if (!cancelled && !d.moved && d.card >= 0 && showModal) {
                const idx = d.card
                startTransition(() => setSelected(idx))
            }
            d.card = -1
        } else if (pointers.current.size === 1) {
            d.pinch = 0
        }
    }

    // Wheel zoom: needs a non-passive listener so it can stop the page from scrolling, but
    // lets the page scroll once the camera hits its zoom limit.
    useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic || !wheelZoom) return
        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return
            const scale = Math.pow(0.95, ZOOM_SPEED)
            const next = e.deltaY > 0 ? camRef.current.dist / scale : camRef.current.dist * scale
            if (setDistance(next)) {
                e.preventDefault()
                invalidate()
            }
        }
        root.addEventListener("wheel", onWheel, { passive: false })
        return () => root.removeEventListener("wheel", onWheel)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, wheelZoom, minDistance, maxDistance])

    // Ambient motion: star drift (on by default, like the original) and optional auto-rotate (off
    // by default). Only runs while the gallery is on screen, the tab is visible and the visitor
    // hasn't asked for reduced motion.
    useEffect(() => {
        const root = rootRef.current
        drawStarsRef.current()
        if (!root || isStatic || (!autoRotate && !showStars) || typeof window === "undefined") return
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")
        let inView = true
        const update = () => {
            const active = inView && document.visibilityState === "visible" && !reduce?.matches
            loop.current.auto = autoRotate && active
            loop.current.stars = showStars && active
            if (loop.current.auto || loop.current.stars) invalidate()
        }
        const io =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver((entries) => {
                      inView = entries[0]?.isIntersecting ?? true
                      update()
                  })
                : null
        io?.observe(root)
        document.addEventListener("visibilitychange", update)
        reduce?.addEventListener?.("change", update)
        update()
        return () => {
            loop.current.auto = false
            loop.current.stars = false
            io?.disconnect()
            document.removeEventListener("visibilitychange", update)
            reduce?.removeEventListener?.("change", update)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, autoRotate, showStars])

    // Initial (SSR / static) layout so the first paint already shows the sphere.
    const initialBasis = cameraBasis(camRef.current, sizeRef.current.h)
    const glowStrong = `color-mix(in srgb, ${accent} 50%, transparent)`
    const glowSoft = `color-mix(in srgb, ${accent} 30%, transparent)`

    return (
        <div
            ref={rootRef}
            role="region"
            aria-label="3D card gallery"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                color: accent,
                background,
                touchAction: isStatic ? "auto" : touchScroll ? "pan-y" : "none",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endPointer(e, false)}
            onPointerCancel={(e) => endPointer(e, true)}
            onContextMenu={(e) => {
                if (enablePan && !isStatic) e.preventDefault()
            }}
        >
            <canvas
                ref={starsRef}
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            />
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            />
            <div
                ref={layerRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: `${initialBasis.focal.toFixed(2)}px`,
                    perspectiveOrigin: "50% 50%",
                    pointerEvents: "none",
                }}
            >
            {cards.map((card, i) => {
                const l = layoutCard(initialBasis, positions[i])
                const isHover = hovered === i
                return (
                    <div
                        key={card.id}
                        ref={(el) => {
                            cardRefs.current[i] = el
                        }}
                        data-card={i}
                        role="button"
                        tabIndex={isStatic ? -1 : 0}
                        aria-label={`Open ${card.title}`}
                        onPointerEnter={(e) => {
                            if (e.pointerType !== "touch" && pointers.current.size === 0) setHovered(i)
                        }}
                        onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                        onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && showModal && !isStatic) {
                                e.preventDefault()
                                setSelected(i)
                            }
                        }}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: CARD_W,
                            height: CARD_H,
                            marginLeft: -CARD_W / 2,
                            marginTop: -CARD_H / 2,
                            pointerEvents: "auto",
                            transform: l.transform,
                            zIndex: l.zIndex,
                            opacity: l.opacity,
                            visibility: l.visible && l.opacity > 0 ? "visible" : "hidden",
                            cursor: "pointer",
                            outline: "none",
                            willChange: "transform",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                boxSizing: "border-box",
                                padding: 12,
                                borderRadius: 8,
                                overflow: "hidden",
                                background: cardColor,
                                transition: "all 0.3s ease",
                                transform: isHover ? "scale(1.15)" : "scale(1)",
                                boxShadow: isHover
                                    ? `0 25px 50px ${glowStrong}, 0 0 30px ${glowSoft}`
                                    : "0 15px 30px rgba(0, 0, 0, 0.6)",
                                border: isHover ? `2px solid ${glowStrong}` : "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                        >
                            <img
                                src={card.src}
                                srcSet={card.srcSet}
                                sizes="160px"
                                alt={card.alt}
                                loading="lazy"
                                draggable={false}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: 160,
                                    objectFit: "cover",
                                    borderRadius: 6,
                                    pointerEvents: "none",
                                }}
                            />
                            <div style={{ marginTop: 4, textAlign: "center" }}>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 12,
                                        lineHeight: "16px",
                                        fontWeight: 500,
                                        ...cardFont,
                                        color: textColor,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {card.title}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}
            </div>
            {!isStatic && showModal && selected !== null && cards[selected] ? (
                <CardModal
                    card={cards[selected]}
                    accent={accent}
                    cardColor={cardColor}
                    textColor={textColor}
                    font={modalFont}
                    showActions={showActions}
                    downloadLabel={downloadLabel}
                    onClose={() => setSelected(null)}
                />
            ) : null}
        </div>
    )
}

// ---------- Modal ----------

interface CardModalProps {
    card: { id: string; src: string; srcSet?: string; alt: string; title: string }
    accent: string
    cardColor: string
    textColor: string
    font: CSSProperties
    showActions: boolean
    downloadLabel: string
    onClose: () => void
}

const favorites = new Set<string>()

async function downloadImage(src: string, title: string) {
    try {
        const res = await fetch(src)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${(title || "image").replace(/[^\w\- ]+/g, "").trim() || "image"}.jpg`
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
        window.open(src, "_blank", "noopener")
    }
}

function CardModal({ card, accent, cardColor, textColor, font, showActions, downloadLabel, onClose }: CardModalProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [fav, setFav] = useState(() => favorites.has(card.src))

    useEffect(() => {
        setFav(favorites.has(card.src))
    }, [card.src])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    if (typeof document === "undefined") return null

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = cardRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const rotateX = (e.clientY - rect.top - rect.height / 2) / 15
        const rotateY = (rect.width / 2 - (e.clientX - rect.left)) / 15
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }
    const onMouseLeave = () => {
        const el = cardRef.current
        if (!el) return
        el.style.transition = "transform 0.5s ease-out"
        el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
    }

    const toggleFav = () => {
        if (favorites.has(card.src)) favorites.delete(card.src)
        else favorites.add(card.src)
        setFav(favorites.has(card.src))
    }

    const btn: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 36,
        borderRadius: 8,
        border: "none",
        background: accent,
        color: "#000",
        cursor: "pointer",
        fontSize: 16,
        fontWeight: 500,
        fontFamily: "inherit",
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
    }

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={card.title}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    // max-w-md, narrowed on short screens so the 3:4 photo + actions always fit
                    maxWidth: "min(448px, calc((100vh - 200px) * 0.75 + 32px))",
                    margin: "0 16px",
                }}
            >
                <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: -48,
                        right: 0,
                        zIndex: 1,
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "#fff",
                        cursor: "pointer",
                        lineHeight: 0,
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
                <div style={{ perspective: "1000px", width: "100%" }}>
                    <div
                        ref={cardRef}
                        onMouseMove={onMouseMove}
                        onMouseLeave={onMouseLeave}
                        style={{
                            position: "relative",
                            width: "100%",
                            boxSizing: "border-box",
                            padding: 16,
                            borderRadius: 16,
                            background: cardColor,
                            cursor: "pointer",
                            transformStyle: "preserve-3d",
                            transition: "all 0.5s ease-out",
                            boxShadow:
                                "rgba(0, 0, 0, 0.01) 0px 520px 146px 0px, rgba(0, 0, 0, 0.04) 0px 333px 133px 0px, rgba(0, 0, 0, 0.26) 0px 83px 83px 0px, rgba(0, 0, 0, 0.29) 0px 21px 46px 0px",
                        }}
                    >
                        <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 4", marginBottom: 16 }}>
                            <img
                                src={card.src}
                                srcSet={card.srcSet}
                                sizes="448px"
                                alt={card.alt}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: 16,
                                    background: "#000",
                                    boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                                }}
                            />
                        </div>
                        <h3
                            style={{
                                margin: "0 0 16px",
                                fontSize: 18,
                                lineHeight: "28px",
                                fontWeight: 600,
                                textAlign: "center",
                                ...font,
                                color: textColor,
                            }}
                        >
                            {card.title}
                        </h3>
                        {showActions ? (
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => downloadImage(card.src, card.title)}
                                    style={{ ...btn, flex: 1 }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" x2="12" y1="15" y2="3" />
                                        </svg>
                                        <span>{downloadLabel}</span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                                    aria-pressed={fav}
                                    onClick={toggleFav}
                                    style={{ ...btn, width: 36 }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                    </svg>
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}

addPropertyControls(StellarCardGallery, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Card" },
            },
        },
        defaultValue: DEFAULT_CARDS.map((c) => ({ title: c.title })),
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#31b8c6" },
    cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#1F2121" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    cardFont: {
        type: ControlType.Font,
        title: "Card Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Medium", lineHeight: "1.33em", textAlign: "center" },
    },
    modalFont: {
        type: ControlType.Font,
        title: "Modal Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "18px", variant: "Semibold", lineHeight: "1.55em", textAlign: "center" },
    },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#000000" },
    showStars: { type: ControlType.Boolean, title: "Stars", defaultValue: true },
    starSpeed: {
        type: ControlType.Number,
        title: "Star Speed",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 0.1,
        hidden: (p: Partial<StellarCardGalleryProps>) => !p.showStars,
    },
    cameraDistance: { type: ControlType.Number, title: "Distance", defaultValue: 15, min: 5, max: 40, step: 0.5 },
    responsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        description: "Moves the camera back on tall, narrow frames (tablet, phone) so every card stays in view.",
        defaultValue: true,
    },
    minDistance: { type: ControlType.Number, title: "Min Zoom", defaultValue: 5, min: 1, max: 40, step: 0.5 },
    maxDistance: { type: ControlType.Number, title: "Max Zoom", defaultValue: 40, min: 5, max: 80, step: 0.5 },
    autoRotate: { type: ControlType.Boolean, title: "Auto Rotate", defaultValue: false },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        hidden: (p: Partial<StellarCardGalleryProps>) => !p.autoRotate,
    },
    damping: { type: ControlType.Boolean, title: "Damping", defaultValue: true },
    wheelZoom: { type: ControlType.Boolean, title: "Wheel Zoom", defaultValue: true },
    enablePan: { type: ControlType.Boolean, title: "Pan", defaultValue: true },
    touchScroll: {
        type: ControlType.Boolean,
        title: "Touch Scroll",
        description: "On touch screens, vertical swipes scroll the page; horizontal swipes orbit.",
        defaultValue: true,
    },
    showSpheres: { type: ControlType.Boolean, title: "Spheres", defaultValue: true },
    showModal: { type: ControlType.Boolean, title: "Modal", defaultValue: true },
    showActions: {
        type: ControlType.Boolean,
        title: "Actions",
        defaultValue: true,
        hidden: (p: Partial<StellarCardGalleryProps>) => !p.showModal,
    },
    downloadLabel: {
        type: ControlType.String,
        title: "Download",
        defaultValue: "Download",
        hidden: (p: Partial<StellarCardGalleryProps>) => !p.showModal || !p.showActions,
    },
})
