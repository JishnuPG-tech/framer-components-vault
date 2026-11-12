import * as React from "react"
import { useEffect, useRef } from "react"
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


// Slatted Logo — a standalone Framer component. No CDN, R3F, or external assets.
type Settings = {
    svg: string
    rows: number
    thickness: number
    depth: number
    sections: number
    step: number
    color: string
    sideColor: string
    edgeColor: string
    edge: number
    background: string
    transparent: boolean
    roughness: number
    metalness: number
    lighting: number
    pitch: number
    yaw: number
    roll: number
    zoom: number
    draggable: boolean
    sensitivity: number
    inertia: number
    autoRotate: number
    autoRotateEnabled: boolean
    cursorTilt: boolean
    tiltStrength: number
    quality: number
    adaptive: boolean
    reducedMotion: boolean
}
type Props = Partial<Settings> & {
    livePreview?: boolean
    editorPreview?: boolean
    sculpture?: Partial<Settings>
    appearance?: Partial<Settings>
    view?: Partial<Settings>
    interaction?: Partial<Settings>
    performance?: Partial<Settings>
    style?: React.CSSProperties
    id?: string
    className?: string
}
const defaults: Settings = {
    svg: "",
    rows: 38,
    thickness: 18,
    depth: 30,
    sections: 6,
    step: 0,
    color: "#FF0000",
    sideColor: "#58201F",
    edgeColor: "#FFD0B7",
    edge: 100,
    background: "#000000",
    transparent: true,
    roughness: 20,
    metalness: 0,
    lighting: 100,
    pitch: 18,
    yaw: 29,
    roll: 6,
    zoom: 100,
    draggable: true,
    sensitivity: 70,
    inertia: 95,
    autoRotate: 12,
    autoRotateEnabled: true,
    cursorTilt: true,
    tiltStrength: 25,
    quality: 200,
    adaptive: false,
    reducedMotion: true,
}
const sampleSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500"><path d="M0 0H300V500H0V375H95V405H200V295H95V205H200V95H0Z"/></svg>`
const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v))
const finite = (v: number, fallback: number) =>
    Number.isFinite(v) ? v : fallback
function normalized(s: Settings): Settings {
    const n = (key: keyof Settings, lo: number, hi: number) =>
        clamp(finite(Number(s[key]), Number(defaults[key])), lo, hi)
    return {
        ...s,
        transparent: true,
        svg: typeof s.svg === "string" ? s.svg : "",
        rows: Math.round(n("rows", 6, 90)),
        thickness: n("thickness", 5, 85),
        depth: n("depth", 2, 100),
        sections: Math.round(n("sections", 1, 6)),
        step: n("step", 0, 35),
        edge: n("edge", 0, 100),
        roughness: n("roughness", 20, 100),
        metalness: n("metalness", 0, 80),
        lighting: n("lighting", 20, 200),
        pitch: n("pitch", -85, 85),
        yaw: n("yaw", -180, 180),
        roll: n("roll", -180, 180),
        zoom: n("zoom", 40, 170),
        sensitivity: n("sensitivity", 20, 200),
        inertia: n("inertia", 0, 95),
        autoRotate: n("autoRotate", -45, 45),
        quality: n("quality", 50, 400),
        tiltStrength: n("tiltStrength", 0, 25),
    }
}
type Mask = {
    alpha: Uint8ClampedArray
    width: number
    height: number
    x0: number
    y0: number
    x1: number
    y1: number
}
type Point = [number, number]
type Engine = { update: (s: Settings, animate: boolean) => void }

function area(p: Point[]) {
    let a = 0
    for (let i = 0, j = p.length - 1; i < p.length; j = i++)
        a += p[j][0] * p[i][1] - p[i][0] * p[j][1]
    return a / 2
}
function inside(p: Point, poly: Point[]) {
    let result = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i],
            b = poly[j]
        if (
            a[1] > p[1] !== b[1] > p[1] &&
            p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
        )
            result = !result
    }
    return result
}
// Remove straight pixel runs, then simplify only within half a source pixel.
function simplify(points: Point[]): Point[] {
    const p = points.filter((b, i) => {
        const a = points[(i + points.length - 1) % points.length],
            c = points[(i + 1) % points.length]
        return (b[0] - a[0]) * (c[1] - b[1]) !== (b[1] - a[1]) * (c[0] - b[0])
    })
    if (p.length < 5) return p
    let split = 1,
        far = 0
    for (let i = 1; i < p.length; i++) {
        const d = (p[i][0] - p[0][0]) ** 2 + (p[i][1] - p[0][1]) ** 2
        if (d > far) {
            far = d
            split = i
        }
    }
    function part(input: Point[]) {
        const keep = new Uint8Array(input.length),
            stack = [[0, input.length - 1]]
        keep[0] = keep[input.length - 1] = 1
        while (stack.length) {
            const [lo, hi] = stack.pop()!,
                a = input[lo],
                b = input[hi]
            const dx = b[0] - a[0],
                dy = b[1] - a[1],
                den = dx * dx + dy * dy
            let max = 0.25,
                index = -1
            for (let i = lo + 1; i < hi; i++) {
                const v = input[i],
                    t = den
                        ? clamp(
                              ((v[0] - a[0]) * dx + (v[1] - a[1]) * dy) / den,
                              0,
                              1
                          )
                        : 0
                const distance =
                    (v[0] - a[0] - t * dx) ** 2 + (v[1] - a[1] - t * dy) ** 2
                if (distance > max) {
                    max = distance
                    index = i
                }
            }
            if (index >= 0) {
                keep[index] = 1
                stack.push([lo, index], [index, hi])
            }
        }
        return input.filter((_, i) => keep[i])
    }
    return [
        ...part(p.slice(0, split + 1)).slice(0, -1),
        ...part([...p.slice(split), p[0]]).slice(0, -1),
    ]
}

// Trace the SVG alpha clipped to a horizontal slab. Directed edges retain holes.
function bandContours(
    m: Mask,
    l: number,
    r: number,
    t: number,
    b: number
): Point[][] {
    const stride = m.width + 1,
        edges = new Map<number, number[]>()
    const full = (x: number, y: number) =>
        x >= l &&
        x < r &&
        y >= t &&
        y < b &&
        m.alpha[(y * m.width + x) * 4 + 3] >= 128
    const add = (x: number, y: number, xx: number, yy: number) => {
        const key = y * stride + x,
            end = yy * stride + xx
        const e = edges.get(key)
        if (e) e.push(end)
        else edges.set(key, [end])
    }
    for (let y = t; y < b; y++)
        for (let x = l; x < r; x++)
            if (full(x, y)) {
                if (!full(x, y - 1)) add(x, y, x + 1, y)
                if (!full(x + 1, y)) add(x + 1, y, x + 1, y + 1)
                if (!full(x, y + 1)) add(x + 1, y + 1, x, y + 1)
                if (!full(x - 1, y)) add(x, y + 1, x, y)
            }
    const contours: Point[][] = []
    while (edges.size) {
        const first = edges.keys().next().value as number
        let current = first,
            direction = 0,
            guard = 0
        const loop: Point[] = []
        do {
            loop.push([current % stride, Math.floor(current / stride)])
            const next = edges.get(current)
            if (!next?.length) break
            let choice = 0,
                score = 9
            for (let i = 0; i < next.length; i++) {
                const delta = next[i] - current
                const dir =
                    delta === 1
                        ? 0
                        : delta === stride
                          ? 1
                          : delta === -1
                            ? 2
                            : 3
                const turn = (dir - direction + 4) % 4
                const rank =
                    turn === 1 ? 0 : turn === 0 ? 1 : turn === 3 ? 2 : 3
                if (rank < score) {
                    score = rank
                    choice = i
                }
            }
            const end = next.splice(choice, 1)[0],
                delta = end - current
            direction =
                delta === 1 ? 0 : delta === stride ? 1 : delta === -1 ? 2 : 3
            if (!next.length) edges.delete(current)
            current = end
        } while (current !== first && ++guard < 1000000)
        const clean = simplify(loop)
        if (
            current === first &&
            clean.length >= 3 &&
            Math.abs(area(clean)) >= 0.6
        )
            contours.push(clean)
    }
    return contours
}

function sculptureGeometry(mask: Mask, settings: Settings) {
    const w = mask.x1 - mask.x0,
        h = mask.y1 - mask.y0,
        scale = 3.6 / Math.max(w, h)
    const cx = (mask.x0 + mask.x1) / 2,
        cy = (mask.y0 + mask.y1) / 2
    const pitch = h / settings.rows,
        shapes: THREE.Shape[] = [],
        edges: number[] = []
    let pointCount = 0
    const depth = (settings.depth / 100) * 3.6
    for (let col = 0; col < settings.sections; col++) {
        const l = Math.round(mask.x0 + (w * col) / settings.sections),
            r = Math.round(mask.x0 + (w * (col + 1)) / settings.sections)
        const offset = ((-col * settings.step) / 100) * pitch
        const thick =
            ((pitch * settings.thickness) / 100) *
            (settings.sections === 1
                ? 1
                : 0.72 + (0.56 * col) / (settings.sections - 1))
        for (let row = -1; row <= settings.rows + settings.sections; row++) {
            const t = Math.max(mask.y0, mask.y0 + row * pitch + offset)
            const b = Math.min(mask.y1, mask.y0 + row * pitch + offset + thick)
            if (b <= t) continue
            // Fractional clipping retains the requested thickness even on a very wide SVG.
            const loops = bandContours(
                mask,
                l,
                r,
                Math.floor(t),
                Math.ceil(b)
            ).map((loop) => loop.map(([x, y]) => [x, clamp(y, t, b)] as Point))
            pointCount += loops.reduce((sum, loop) => sum + loop.length, 0)
            if (pointCount > 60000)
                throw new Error(
                    "Logo is too detailed. Simplify the SVG or reduce Slats."
                )
            const outer = loops
                .filter((p) => area(p) > 0)
                .map((p) => ({
                    p,
                    shape: new THREE.Shape(
                        p.map(
                            ([x, y]) =>
                                new THREE.Vector2(
                                    (x - cx) * scale,
                                    (cy - y) * scale
                                )
                        )
                    ),
                }))
            for (const p of loops.filter((p) => area(p) < 0)) {
                // Assign to the smallest enclosing outline, preserving nested islands.
                const parent = outer
                    .filter((o) => inside(p[0], o.p))
                    .sort((a, b) => area(a.p) - area(b.p))[0]
                if (parent)
                    parent.shape.holes.push(
                        new THREE.Path(
                            p.map(
                                ([x, y]) =>
                                    new THREE.Vector2(
                                        (x - cx) * scale,
                                        (cy - y) * scale
                                    )
                            )
                        )
                    )
            }
            for (const o of outer) {
                shapes.push(o.shape)
                // Matching upper/lower lips on both ends of the extrusion.
                for (let i = 0; i < o.p.length; i++) {
                    const a = o.p[i],
                        b = o.p[(i + 1) % o.p.length]
                    if (
                        Math.abs(b[0] - a[0]) > 0.01 &&
                        Math.abs(b[1] - a[1]) < 0.55
                    )
                        for (const sign of [-1, 1])
                            edges.push(
                                (a[0] - cx) * scale,
                                (cy - a[1]) * scale,
                                sign * (depth / 2 + 0.001),
                                (b[0] - cx) * scale,
                                (cy - b[1]) * scale,
                                sign * (depth / 2 + 0.001)
                            )
                }
            }
        }
    }
    if (!shapes.length)
        throw new Error("No visible slices. Increase Slats or Thickness.")
    const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth,
        steps: 2,
        curveSegments: 1,
        bevelEnabled: false,
    })
    geometry.translate(0, 0, -depth / 2)
    geometry.clearGroups() // All surfaces share one draw call and one material.
    const edgeGeometry = new THREE.BufferGeometry()
    edgeGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(edges, 3)
    )
    geometry.computeBoundingSphere()
    return { geometry, edgeGeometry }
}

// The SVG is decoded as an inert image, so SVG clipping, strokes, and compound holes
// are handled by the browser. Raster data builds geometry; it is not a texture.
function prepareSVG(text: string) {
    if (text.length > 4_000_000)
        throw new Error("SVG is too large. Export a simpler logo.")
    const doc = new DOMParser().parseFromString(text, "image/svg+xml"),
        root = doc.documentElement
    if (root.localName !== "svg" || doc.querySelector("parsererror"))
        throw new Error("This file is not a valid SVG.")
    root.querySelectorAll(
        "script,foreignObject,animate,animateTransform,animateMotion,set"
    ).forEach((n) => n.remove())
    for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
        for (const attribute of Array.from(element.attributes)) {
            const name = attribute.name.toLowerCase(),
                value = attribute.value.trim()
            const externalURL = Array.from(
                value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)
            ).some((match) => !match[2].trim().startsWith("#"))
            if (
                name.startsWith("on") ||
                ((name === "href" || name === "xlink:href") &&
                    !value.startsWith("#")) ||
                externalURL
            )
                element.removeAttribute(attribute.name)
        }
    }
    root.querySelectorAll("style").forEach((n) => {
        n.textContent = (n.textContent || "")
            .replace(/@import[^;]*;/gi, "")
            .replace(/url\([^)]*\)/gi, (value) =>
                /url\(\s*['"]?#/.test(value) ? value : "none"
            )
    })
    const vb = (root.getAttribute("viewBox") || "")
        .trim()
        .split(/[\s,]+/)
        .map(Number)
    let width =
        vb.length === 4 && vb[2] > 0
            ? vb[2]
            : parseFloat(root.getAttribute("width") || "512")
    let height =
        vb.length === 4 && vb[3] > 0
            ? vb[3]
            : parseFloat(root.getAttribute("height") || "512")
    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
    )
        throw new Error("SVG needs a valid viewBox or dimensions.")
    if (
        vb.length !== 4 ||
        !vb.every(Number.isFinite) ||
        vb[2] <= 0 ||
        vb[3] <= 0
    )
        root.setAttribute("viewBox", `0 0 ${width} ${height}`)
    const factor = 2048 / Math.max(width, height)
    width = Math.max(1, Math.round(width * factor))
    height = Math.max(1, Math.round(height * factor))
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    root.setAttribute("width", String(width))
    root.setAttribute("height", String(height))
    root.style.color = "black"
    return { text: new XMLSerializer().serializeToString(root), width, height }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 720
 * @framerDisableUnlink
 */
export default function SlattedLogo(incomingProps: Props) {
    const props = {
        ...defaults,
        ...incomingProps,
        ...(incomingProps.sculpture || {}),
        ...(incomingProps.appearance || {}),
        ...(incomingProps.view || {}),
        ...(incomingProps.interaction || {}),
        ...(incomingProps.performance || {}),
    }
    const isStatic = useIsStaticRenderer()
    const shouldAnimate =
        !isStatic && (props.editorPreview ?? props.livePreview ?? true)
    const mountRef = useRef<HTMLDivElement>(null),
        statusRef = useRef<HTMLDivElement>(null)
    const isIntersecting = useRef(true),
        engineRef = useRef<Engine | null>(null)
    const latest = useRef({
        settings: props as Settings,
        animate: shouldAnimate,
    })
    latest.current = { settings: props as Settings, animate: shouldAnimate }

    useEffect(() => {
        const container = mountRef.current
        if (!container) return
        let renderer: THREE.WebGLRenderer | null = null,
            scene: THREE.Scene | null = null
        let camera: THREE.PerspectiveCamera | null = null,
            object: THREE.Group | null = null
        let tiltGroup: THREE.Group | null = null
        let body: THREE.Mesh | null = null,
            lips: THREE.LineSegments | null = null
        let geometry: THREE.BufferGeometry | null = null,
            edgeGeometry: THREE.BufferGeometry | null = null
        let material: THREE.MeshStandardMaterial | null = null,
            edgeMaterial: THREE.LineBasicMaterial | null = null
        let key: THREE.DirectionalLight | null = null,
            fill: THREE.DirectionalLight | null = null,
            ambient: THREE.HemisphereLight | null = null
        let frameId = 0,
            resizeObserver: ResizeObserver | null = null,
            intersectionObserver: IntersectionObserver | null = null
        let abort: AbortController | null = null,
            image: HTMLImageElement | null = null,
            objectURL = ""
        let rasterCanvas: HTMLCanvasElement | null = null,
            mask: Mask | null = null
        let disposed = false,
            generation = 0,
            width = 1,
            height = 1,
            radius = 2.5
        let settings = normalized(latest.current.settings),
            animate = latest.current.animate
        let nextDraw = 0,
            lastDraw = 0,
            ema = 16.67,
            resolution = 1,
            pressure = 0,
            recovery = 0
        let pointer: number | null = null,
            lastX = 0,
            lastY = 0,
            lastMove = 0
        let vx = 0,
            vy = 0,
            yaw = (settings.yaw * Math.PI) / 180,
            pitch = (settings.pitch * Math.PI) / 180
        let targetYaw = yaw,
            targetPitch = pitch,
            spin = 0,
            reduced = false
        let tiltX = 0,
            tiltY = 0,
            targetTiltX = 0,
            targetTiltY = 0
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        reduced = media.matches
        const status = (message: string) => {
            if (statusRef.current) {
                statusRef.current.textContent = message
                statusRef.current.style.display = message ? "flex" : "none"
            }
        }
        const canAnimate = () =>
            animate &&
            isIntersecting.current &&
            !document.hidden &&
            !(settings.reducedMotion && reduced)
        const moving = () =>
            pointer !== null ||
            Math.abs(vx) + Math.abs(vy) > 0.002 ||
            Math.abs(targetYaw - yaw) +
                Math.abs(targetPitch - pitch) +
                Math.abs(targetTiltX - tiltX) +
                Math.abs(targetTiltY - tiltY) >
                0.0001 ||
            (settings.autoRotateEnabled && settings.autoRotate !== 0)
        function stop() {
            cancelAnimationFrame(frameId)
            frameId = 0
            nextDraw = 0
            lastDraw = 0
        }
        function fit() {
            if (!camera) return
            camera.aspect = width / height
            const half = THREE.MathUtils.degToRad(camera.fov / 2)
            const limiting = Math.min(
                half,
                Math.atan(Math.tan(half) * camera.aspect)
            )
            camera.position.set(0, 0, (radius / Math.sin(limiting)) * 1.08)
            camera.zoom = settings.zoom / 100
            camera.near = Math.max(0.01, camera.position.z - radius * 3)
            camera.far = camera.position.z + radius * 4
            camera.updateProjectionMatrix()
        }
        function resizeBuffer() {
            if (!renderer) return
            const requested =
                (((window.devicePixelRatio || 1) * settings.quality) / 100) *
                resolution
            const dpr = Math.min(
                requested,
                4,
                Math.sqrt(33_177_600 / Math.max(1, width * height))
            )
            renderer.setPixelRatio(dpr)
            renderer.setSize(width, height, false)
        }
        function resize() {
            const box = container!.getBoundingClientRect()
            width = Math.max(1, box.width)
            height = Math.max(1, box.height)
            resizeBuffer()
            fit()
            push()
        }
        function draw() {
            if (
                disposed ||
                !renderer ||
                !scene ||
                !camera ||
                !object ||
                !isIntersecting.current ||
                document.hidden
            )
                return
            object.rotation.set(
                pitch,
                yaw + spin,
                (settings.roll * Math.PI) / 180,
                "YXZ"
            )
            tiltGroup?.rotation.set(tiltX, tiltY, 0, "YXZ")
            renderer.render(scene, camera)
        }
        function tick(time: number) {
            frameId = 0
            if (disposed || !canAnimate()) return
            // Cap rendering to 60 Hz on 120/144 Hz displays while preserving elapsed time.
            if (nextDraw && time + 0.5 < nextDraw) {
                frameId = requestAnimationFrame(tick)
                return
            }
            const raw = lastDraw ? time - lastDraw : 16.67,
                dt = Math.min(raw / 1000, 0.05)
            lastDraw = time
            nextDraw = nextDraw ? nextDraw + 1000 / 60 : time + 1000 / 60
            if (nextDraw < time - 1000 / 60) nextDraw = time + 1000 / 60
            if (pointer === null) {
                targetYaw += vx * dt
                targetPitch = clamp(
                    targetPitch + vy * dt,
                    -Math.PI * 0.49,
                    Math.PI * 0.49
                )
                const decay =
                    settings.inertia > 0
                        ? Math.exp(-dt * (3 + (100 - settings.inertia) * 0.15))
                        : 0
                vx *= decay
                vy *= decay
                if (settings.autoRotateEnabled)
                    spin += ((settings.autoRotate * Math.PI) / 180) * dt
            }
            const ease = 1 - Math.exp(-dt * 24)
            yaw += (targetYaw - yaw) * ease
            pitch += (targetPitch - pitch) * ease
            tiltX += (targetTiltX - tiltX) * ease
            tiltY += (targetTiltY - tiltY) * ease
            draw()
            // Adapt only during continuous motion; idle components use no animation loop.
            if (settings.adaptive && raw < 150) {
                ema += (raw - ema) * 0.06
                pressure = ema > 21 ? pressure + dt : Math.max(0, pressure - dt)
                recovery = ema < 18 ? recovery + dt : 0
                if (pressure > 0.8 && resolution > 0.55) {
                    resolution = Math.max(0.55, resolution * 0.85)
                    pressure = 0
                    ema = 16.67
                    resizeBuffer()
                } else if (recovery > 5 && resolution < 1) {
                    resolution = Math.min(1, resolution + 0.05)
                    recovery = 0
                    resizeBuffer()
                }
            }
            if (moving()) frameId = requestAnimationFrame(tick)
            else {
                yaw = targetYaw
                pitch = targetPitch
                tiltX = targetTiltX
                tiltY = targetTiltY
                draw()
                lastDraw = 0
                nextDraw = 0
            }
        }
        function push() {
            if (disposed) return
            if (!canAnimate()) {
                stop()
                yaw = targetYaw
                pitch = targetPitch
                tiltX = targetTiltX
                tiltY = targetTiltY
                draw()
                return
            }
            if (!frameId) {
                lastDraw = 0
                nextDraw = 0
                frameId = requestAnimationFrame(tick)
            }
        }
        function shade() {
            if (
                !geometry ||
                !material ||
                !renderer ||
                !key ||
                !fill ||
                !ambient ||
                !edgeMaterial
            )
                return
            const top = new THREE.Color(settings.color),
                side = new THREE.Color(settings.sideColor),
                rim = new THREE.Color(settings.edgeColor)
            const normals = geometry.getAttribute("normal"),
                positions = geometry.getAttribute("position"),
                previous = geometry.getAttribute("color") as
                    | THREE.BufferAttribute
                    | undefined
            const attribute =
                previous ||
                new THREE.BufferAttribute(
                    new Float32Array(normals.count * 3),
                    3
                )
            const colors = attribute.array,
                color = new THREE.Color()
            for (let i = 0; i < normals.count; i++) {
                const ny = normals.getY(i),
                    nz = normals.getZ(i),
                    nx = normals.getX(i)
                color
                    .copy(side)
                    .lerp(
                        top,
                        Math.abs(ny) > 0.3
                            ? 1
                            : Math.abs(nz) > 0.5
                              ? 0.92
                              : Math.abs(nx) > 0.3
                                ? 0.5
                                : 0.15
                    )
                if (Math.abs(ny) > 0.3)
                    color.lerp(
                        side,
                        0.46 *
                            (1 -
                                clamp(
                                    Math.abs(positions.getZ(i)) /
                                        ((settings.depth / 100) * 1.8),
                                    0,
                                    1
                                ))
                    )
                if (Math.abs(nz) > 0.5) color.lerp(rim, 0.12)
                colors[i * 3] = color.r
                colors[i * 3 + 1] = color.g
                colors[i * 3 + 2] = color.b
            }
            if (!previous) geometry.setAttribute("color", attribute)
            attribute.needsUpdate = true
            material.roughness = settings.roughness / 100
            material.metalness = settings.metalness / 100
            edgeMaterial.color.copy(rim)
            edgeMaterial.opacity = settings.edge / 100
            edgeMaterial.visible = settings.edge > 0
            key.intensity = fill.intensity = (1.6 * settings.lighting) / 100
            ambient.intensity = (0.9 * settings.lighting) / 100
            renderer.setClearColor(0x000000, 0)
        }
        function rebuild() {
            if (!mask || !object || !material || !edgeMaterial) return
            try {
                const next = sculptureGeometry(mask, settings)
                if (body) object.remove(body)
                if (lips) object.remove(lips)
                geometry?.dispose()
                edgeGeometry?.dispose()
                geometry = next.geometry
                edgeGeometry = next.edgeGeometry
                body = new THREE.Mesh(geometry, material)
                lips = new THREE.LineSegments(edgeGeometry, edgeMaterial)
                body.castShadow = body.receiveShadow = true
                object.add(body, lips)
                radius = Math.max(0.1, geometry.boundingSphere?.radius || 2.5)
                // Conservative sphere fit keeps arbitrary SVGs framed throughout a rotation.
                for (const light of [key, fill])
                    if (light) {
                        const extent = Math.max(2.5, radius * 1.3),
                            shadowCamera = light.shadow.camera
                        shadowCamera.left = shadowCamera.bottom = -extent
                        shadowCamera.right = shadowCamera.top = extent
                        shadowCamera.near = 0.1
                        shadowCamera.far = 25
                        shadowCamera.updateProjectionMatrix()
                        light.shadow.needsUpdate = true
                    }
                shade()
                fit()
                status("")
                push()
            } catch (error) {
                status(
                    error instanceof Error
                        ? error.message
                        : "Could not build this SVG."
                )
            }
        }
        function releaseImage() {
            if (image) {
                image.onload = null
                image.onerror = null
                image.src = ""
                image = null
            }
            if (objectURL) {
                URL.revokeObjectURL(objectURL)
                objectURL = ""
            }
        }
        async function load(source: string) {
            const token = ++generation
            abort?.abort()
            abort = new AbortController()
            releaseImage()
            status("Building logo…")
            try {
                let text = sampleSVG
                if (source) {
                    const response = await fetch(source, {
                        signal: abort.signal,
                    })
                    if (!response.ok)
                        throw new Error(
                            "SVG could not be loaded. Choose the file again."
                        )
                    const length = Number(
                        response.headers.get("content-length") || 0
                    )
                    if (length > 4_000_000)
                        throw new Error(
                            "SVG is too large. Export a simpler logo."
                        )
                    text = await response.text()
                }
                if (disposed || token !== generation) return
                const svg = prepareSVG(text)
                const localURL = URL.createObjectURL(
                    new Blob([svg.text], { type: "image/svg+xml" })
                )
                objectURL = localURL
                const img = new Image()
                image = img
                img.onload = () => {
                    if (disposed || token !== generation) return
                    try {
                        const canvas = document.createElement("canvas")
                        rasterCanvas = canvas
                        canvas.width = svg.width
                        canvas.height = svg.height
                        const context = canvas.getContext("2d", {
                            willReadFrequently: true,
                        })
                        if (!context)
                            throw new Error("SVG conversion is unavailable.")
                        context.drawImage(img, 0, 0, svg.width, svg.height)
                        const alpha = context.getImageData(
                            0,
                            0,
                            svg.width,
                            svg.height
                        ).data
                        let maxAlpha = 0
                        for (let i = 3; i < alpha.length; i += 4)
                            maxAlpha = Math.max(maxAlpha, alpha[i])
                        if (maxAlpha > 0 && maxAlpha < 255)
                            for (let i = 3; i < alpha.length; i += 4)
                                alpha[i] = Math.round(
                                    (alpha[i] * 255) / maxAlpha
                                )
                        let x0 = svg.width,
                            y0 = svg.height,
                            x1 = 0,
                            y1 = 0
                        for (let y = 0; y < svg.height; y++)
                            for (let x = 0; x < svg.width; x++)
                                if (alpha[(y * svg.width + x) * 4 + 3] >= 128) {
                                    x0 = Math.min(x0, x)
                                    y0 = Math.min(y0, y)
                                    x1 = Math.max(x1, x + 1)
                                    y1 = Math.max(y1, y + 1)
                                }
                        if (x1 <= x0 || y1 <= y0)
                            throw new Error(
                                "SVG has no visible shape. Outline the logo before exporting."
                            )
                        mask = {
                            alpha,
                            width: svg.width,
                            height: svg.height,
                            x0,
                            y0,
                            x1,
                            y1,
                        }
                        canvas.width = canvas.height = 1
                        rasterCanvas = null
                        releaseImage()
                        rebuild() // Push an explicit frame when async decoding finishes.
                    } catch (error) {
                        releaseImage()
                        status(
                            error instanceof Error
                                ? error.message
                                : "Could not read the SVG."
                        )
                    }
                }
                img.onerror = () => {
                    if (!disposed && token === generation) {
                        releaseImage()
                        status("SVG could not be decoded. Export a plain SVG.")
                    }
                }
                img.src = localURL
            } catch (error) {
                if (
                    !disposed &&
                    token === generation &&
                    !(
                        error instanceof DOMException &&
                        error.name === "AbortError"
                    )
                )
                    status(
                        error instanceof Error
                            ? error.message
                            : "SVG could not be loaded."
                    )
            }
        }
        function reset() {
            vx = vy = spin = 0
            targetTiltX = targetTiltY = 0
            targetYaw = (settings.yaw * Math.PI) / 180
            targetPitch = (settings.pitch * Math.PI) / 180
            push()
        }
        function down(event: PointerEvent) {
            if (!settings.draggable || pointer !== null || event.button !== 0)
                return
            pointer = event.pointerId
            lastX = event.clientX
            lastY = event.clientY
            lastMove = performance.now()
            vx = vy = 0
            targetYaw = yaw + spin
            yaw = targetYaw
            spin = 0
            targetPitch = pitch
            targetTiltX = targetTiltY = 0
            container!.setPointerCapture(event.pointerId)
            container!.style.cursor = "grabbing"
            push()
        }
        function move(event: PointerEvent) {
            if (pointer !== event.pointerId) {
                if (
                    pointer === null &&
                    settings.cursorTilt &&
                    event.pointerType !== "touch"
                ) {
                    const rect = container!.getBoundingClientRect(),
                        strength = (settings.tiltStrength * Math.PI) / 180
                    targetTiltX =
                        -clamp(
                            ((event.clientY - rect.top) /
                                Math.max(1, rect.height)) *
                                2 -
                                1,
                            -1,
                            1
                        ) * strength
                    targetTiltY =
                        clamp(
                            ((event.clientX - rect.left) /
                                Math.max(1, rect.width)) *
                                2 -
                                1,
                            -1,
                            1
                        ) * strength
                    push()
                }
                return
            }
            const time = performance.now(),
                dt = Math.max(0.008, (time - lastMove) / 1000)
            const sensitivity =
                ((settings.sensitivity / 100) * 5) /
                Math.max(150, Math.min(width, height))
            const dx = (event.clientX - lastX) * sensitivity,
                dy = (event.clientY - lastY) * sensitivity
            targetYaw += dx
            targetPitch = clamp(
                targetPitch + dy,
                -Math.PI * 0.49,
                Math.PI * 0.49
            )
            vx = clamp(dx / dt, -8, 8)
            vy = clamp(dy / dt, -6, 6)
            lastX = event.clientX
            lastY = event.clientY
            lastMove = time
            push()
        }
        function leave() {
            targetTiltX = targetTiltY = 0
            push()
        }
        function up(event: PointerEvent) {
            if (pointer !== event.pointerId) return
            pointer = null
            if (container!.hasPointerCapture(event.pointerId))
                container!.releasePointerCapture(event.pointerId)
            if (
                performance.now() - lastMove > 100 ||
                !canAnimate() ||
                settings.inertia === 0
            )
                vx = vy = 0
            container!.style.cursor = settings.draggable ? "grab" : "default"
            push()
        }
        function keyboard(event: KeyboardEvent) {
            if (!settings.draggable) return
            const amount = ((event.shiftKey ? 15 : 5) * Math.PI) / 180
            if (event.key === "ArrowLeft") targetYaw -= amount
            else if (event.key === "ArrowRight") targetYaw += amount
            else if (event.key === "ArrowUp")
                targetPitch = clamp(targetPitch - amount, -1.53, 1.53)
            else if (event.key === "ArrowDown")
                targetPitch = clamp(targetPitch + amount, -1.53, 1.53)
            else if (event.key === "Home") reset()
            else return
            event.preventDefault()
            vx = vy = 0
            push()
        }
        const visibility = () => {
            if (document.hidden) {
                vx = vy = 0
                targetTiltX = targetTiltY = tiltX = tiltY = 0
                stop()
            } else push()
        }
        const motionChange = () => {
            reduced = media.matches
            vx = vy = 0
            push()
        }
        const contextLost = (event: Event) => {
            event.preventDefault()
            stop()
            status("Graphics paused. Reload to restore the logo.")
        }
        const cleanup = () => {
            if (disposed) return
            disposed = true
            generation++
            stop()
            abort?.abort()
            releaseImage()
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            container.removeEventListener("pointerdown", down)
            container.removeEventListener("pointermove", move)
            container.removeEventListener("pointerup", up)
            container.removeEventListener("pointercancel", up)
            container.removeEventListener("lostpointercapture", up)
            container.removeEventListener("dblclick", reset)
            container.removeEventListener("pointerleave", leave)
            container.removeEventListener("keydown", keyboard)
            document.removeEventListener("visibilitychange", visibility)
            media.removeEventListener("change", motionChange)
            if (pointer !== null && container.hasPointerCapture(pointer))
                container.releasePointerCapture(pointer)
            renderer?.domElement.removeEventListener(
                "webglcontextlost",
                contextLost
            )
            geometry?.dispose()
            edgeGeometry?.dispose()
            material?.dispose()
            edgeMaterial?.dispose()
            for (const light of [key, fill])
                if (light) {
                    light.shadow.map?.dispose()
                    light.shadow.mapPass?.dispose()
                    light.shadow.map = null
                    light.shadow.mapPass = null
                }
            key?.dispose()
            fill?.dispose()
            ambient?.dispose()
            scene?.clear()
            mask = null
            if (rasterCanvas) rasterCanvas.width = rasterCanvas.height = 1
            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (container && container.contains(renderer.domElement))
                    container.removeChild(renderer.domElement)
            }
            engineRef.current = null
        }
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
            })
            renderer.setClearColor(0x000000, 0)
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.toneMapping = THREE.ACESFilmicToneMapping
            renderer.toneMappingExposure = 1.05
            renderer.shadowMap.enabled = true
            renderer.shadowMap.type = THREE.PCFShadowMap
            renderer.domElement.style.cssText =
                "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none"
            renderer.domElement.setAttribute("aria-hidden", "true")
            renderer.domElement.addEventListener(
                "webglcontextlost",
                contextLost
            )
            container.appendChild(renderer.domElement)
            scene = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100)
            object = new THREE.Group()
            tiltGroup = new THREE.Group()
            tiltGroup.add(object)
            scene.add(tiltGroup)
            material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.62,
                metalness: 0.08,
            })
            edgeMaterial = new THREE.LineBasicMaterial({
                transparent: true,
                opacity: 0.52,
                depthWrite: false,
            })
            ambient = new THREE.HemisphereLight(0xffe5db, 0xffe5db, 0.9)
            key = new THREE.DirectionalLight(0xffe5d6, 1.6)
            key.position.set(0, 6, 7)
            fill = new THREE.DirectionalLight(0xffe5d6, 1.6)
            fill.position.set(0, -6, 7)
            for (const light of [key, fill]) {
                light.castShadow = true
                light.shadow.mapSize.set(1024, 1024)
                light.shadow.bias = -0.00015
                light.shadow.normalBias = 0.007
            }
            scene.add(ambient, key, fill)
            container.style.cursor = settings.draggable ? "grab" : "default"
            container.style.touchAction = settings.draggable ? "none" : "auto"
            container.addEventListener("pointerdown", down)
            container.addEventListener("pointermove", move)
            container.addEventListener("pointerup", up)
            container.addEventListener("pointercancel", up)
            container.addEventListener("lostpointercapture", up)
            container.addEventListener("dblclick", reset)
            container.addEventListener("pointerleave", leave)
            container.addEventListener("keydown", keyboard)
            document.addEventListener("visibilitychange", visibility)
            media.addEventListener("change", motionChange)
            resizeObserver = new ResizeObserver(resize)
            resizeObserver.observe(container)
            if (typeof IntersectionObserver !== "undefined") {
                intersectionObserver = new IntersectionObserver(
                    (entries) => {
                        isIntersecting.current =
                            entries[0]?.isIntersecting ?? true
                        if (isIntersecting.current) push()
                        else {
                            vx = vy = 0
                            targetTiltX = targetTiltY = tiltX = tiltY = 0
                            stop()
                        }
                    },
                    { threshold: 0 }
                )
                intersectionObserver.observe(container)
            }
            engineRef.current = {
                update(next, nextAnimate) {
                    const previous = settings
                    settings = normalized(next)
                    animate = nextAnimate
                    container.style.cursor = settings.draggable
                        ? "grab"
                        : "default"
                    container.style.touchAction = settings.draggable
                        ? "none"
                        : "auto"
                    if (!settings.draggable && pointer !== null) {
                        const id = pointer
                        pointer = null
                        if (container.hasPointerCapture(id))
                            container.releasePointerCapture(id)
                        vx = vy = 0
                    }
                    if (
                        previous.pitch !== settings.pitch ||
                        previous.yaw !== settings.yaw
                    )
                        reset()
                    if (
                        !settings.cursorTilt ||
                        previous.tiltStrength !== settings.tiltStrength
                    )
                        targetTiltX = targetTiltY = 0
                    if (previous.svg !== settings.svg) {
                        void load(settings.svg)
                    } else if (
                        previous.rows !== settings.rows ||
                        previous.thickness !== settings.thickness ||
                        previous.depth !== settings.depth ||
                        previous.sections !== settings.sections ||
                        previous.step !== settings.step
                    )
                        rebuild()
                    else if (
                        previous.color !== settings.color ||
                        previous.sideColor !== settings.sideColor ||
                        previous.edgeColor !== settings.edgeColor ||
                        previous.edge !== settings.edge ||
                        previous.roughness !== settings.roughness ||
                        previous.metalness !== settings.metalness ||
                        previous.lighting !== settings.lighting ||
                        previous.background !== settings.background ||
                        previous.transparent !== settings.transparent
                    )
                        shade()
                    if (
                        previous.quality !== settings.quality ||
                        previous.adaptive !== settings.adaptive
                    ) {
                        resolution = 1
                        resizeBuffer()
                    }
                    fit()
                    push()
                },
            }
            resize()
            void load(settings.svg)
        } catch {
            status("WebGL is unavailable in this browser.")
            cleanup()
        }
        return cleanup
    }, [])

    useEffect(() => {
        engineRef.current?.update(props as Settings, shouldAnimate)
    }, [
        shouldAnimate,
        props.svg,
        props.rows,
        props.thickness,
        props.depth,
        props.sections,
        props.step,
        props.color,
        props.sideColor,
        props.edgeColor,
        props.edge,
        props.background,
        props.transparent,
        props.roughness,
        props.metalness,
        props.lighting,
        props.pitch,
        props.yaw,
        props.roll,
        props.zoom,
        props.draggable,
        props.sensitivity,
        props.inertia,
        props.autoRotate,
        props.autoRotateEnabled,
        props.cursorTilt,
        props.tiltStrength,
        props.quality,
        props.adaptive,
        props.reducedMotion,
    ])
    return (
        <div
            ref={mountRef}
            id={props.id}
            className={props.className}
            role="img"
            aria-label="3D slatted logo. Drag to rotate, use arrow keys, or double click to reset."
            tabIndex={props.draggable ? 0 : undefined}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                ...props.style,
                background: "transparent",
                backgroundColor: "transparent",
                backgroundImage: "none",
            }}
        >
            <div
                ref={statusRef}
                role="status"
                aria-live="polite"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    display: "none",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    padding: 24,
                    textAlign: "center",
                    font: "12px/1.5 system-ui, sans-serif",
                    color: "#c2b8b2",
                }}
            />
        </div>
    )
}

SlattedLogo.defaultProps = {
    width: 720,
    height: 720,
    livePreview: true,
    svg: "",
    sculpture: {
        rows: defaults.rows,
        thickness: defaults.thickness,
        depth: defaults.depth,
        sections: defaults.sections,
        step: defaults.step,
    },
    appearance: {
        color: defaults.color,
        sideColor: defaults.sideColor,
        edgeColor: defaults.edgeColor,
        edge: defaults.edge,
        background: defaults.background,
        transparent: defaults.transparent,
        roughness: defaults.roughness,
        metalness: defaults.metalness,
        lighting: defaults.lighting,
    },
    view: {
        pitch: defaults.pitch,
        yaw: defaults.yaw,
        roll: defaults.roll,
        zoom: defaults.zoom,
    },
    interaction: {
        draggable: defaults.draggable,
        sensitivity: defaults.sensitivity,
        inertia: defaults.inertia,
        autoRotate: defaults.autoRotate,
        autoRotateEnabled: defaults.autoRotateEnabled,
        cursorTilt: defaults.cursorTilt,
        tiltStrength: defaults.tiltStrength,
    },
    performance: {
        quality: defaults.quality,
        adaptive: defaults.adaptive,
        reducedMotion: defaults.reducedMotion,
    },
}

addPropertyControls(SlattedLogo, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Motion in the editor.",
    },
    svg: {
        type: ControlType.File,
        title: "SVG Logo",
        allowedFileTypes: ["svg"],
        description: "Upload a transparent SVG.",
    },
    sculpture: {
        type: ControlType.Object,
        title: "Sculpture",
        controls: {
            rows: {
                type: ControlType.Number,
                title: "Slats",
                min: 6,
                max: 90,
                step: 1,
                unit: "slats",
                defaultValue: 38,
                description: "More slats retain fine details.",
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                min: 5,
                max: 85,
                step: 1,
                unit: "%",
                defaultValue: 18,
                description: "Share of each row filled.",
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 2,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 30,
                description: "Extrusion relative to the logo.",
            },
            sections: {
                type: ControlType.Number,
                title: "Sections",
                min: 1,
                max: 6,
                step: 1,
                unit: "cols",
                defaultValue: 6,
                description: "Vertical terrace divisions.",
            },
            step: {
                type: ControlType.Number,
                title: "Step",
                min: 0,
                max: 35,
                step: 1,
                unit: "%",
                defaultValue: 0,
                description: "Height offset per section.",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Faces",
                defaultValue: defaults.color,
            },
            sideColor: {
                type: ControlType.Color,
                title: "Sides",
                defaultValue: defaults.sideColor,
            },
            edgeColor: {
                type: ControlType.Color,
                title: "Edges",
                defaultValue: defaults.edgeColor,
            },
            edge: {
                type: ControlType.Number,
                title: "Edge Light",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 100,
            },
            roughness: {
                type: ControlType.Number,
                title: "Roughness",
                min: 20,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 20,
                description: "Higher gives a matte finish.",
            },
            metalness: {
                type: ControlType.Number,
                title: "Metallic",
                min: 0,
                max: 80,
                step: 1,
                unit: "%",
                defaultValue: 0,
            },
            lighting: {
                type: ControlType.Number,
                title: "Lighting",
                min: 20,
                max: 200,
                step: 1,
                unit: "%",
                defaultValue: 100,
            },
        },
    },
    view: {
        type: ControlType.Object,
        title: "View",
        controls: {
            pitch: {
                type: ControlType.Number,
                title: "Tilt X",
                min: -85,
                max: 85,
                step: 1,
                unit: "°",
                defaultValue: 18,
            },
            yaw: {
                type: ControlType.Number,
                title: "Rotate Y",
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
                defaultValue: 29,
            },
            roll: {
                type: ControlType.Number,
                title: "Rotate Z",
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
                defaultValue: 6,
            },
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                min: 40,
                max: 170,
                step: 1,
                unit: "%",
                defaultValue: 100,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            draggable: {
                type: ControlType.Boolean,
                title: "Drag Rotate",
                defaultValue: true,
            },
            sensitivity: {
                type: ControlType.Number,
                title: "Sensitivity",
                min: 20,
                max: 200,
                step: 1,
                unit: "%",
                defaultValue: 70,
            },
            inertia: {
                type: ControlType.Number,
                title: "Momentum",
                min: 0,
                max: 95,
                step: 1,
                unit: "%",
                defaultValue: 95,
                description: "Glide after releasing a drag.",
            },
            autoRotateEnabled: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
            },
            autoRotate: {
                type: ControlType.Number,
                title: "Spin Speed",
                min: -45,
                max: 45,
                step: 1,
                unit: "°/s",
                defaultValue: 12,
                description: "Negative reverses direction.",
            },
            cursorTilt: {
                type: ControlType.Boolean,
                title: "Cursor Tilt",
                defaultValue: true,
                description: "Lean toward the pointer.",
            },
            tiltStrength: {
                type: ControlType.Number,
                title: "Tilt Amount",
                min: 0,
                max: 25,
                step: 1,
                unit: "°",
                defaultValue: 25,
            },
        },
    },
})
