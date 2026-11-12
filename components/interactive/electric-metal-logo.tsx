import * as React from "react"
import { useRef, useEffect } from "react"
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


/** SteelStormLogo — local SVG, machined steel and distance-reactive electrical arcs. */
type ShapeSettings = {
    svg: string
    example: "five" | "cross" | "flower"
    depth: number
    rounding: number
    softness: number
    crown: number
}
type SteelSettings = {
    finish: "brushed" | "machined" | "dark" | "polished"
    steelTint: string
    roughness: number
    brushing: number
    scratches: number
    grainScale: number
    seed: number
}
type ElectricSettings = {
    attraction: boolean
    idleElectricity: boolean
    reach: number
    falloff: number
    response: number
    arcCount: number
    branching: number
    jaggedness: number
    retrace: number
    boltWidth: number
    glow: number
    power: number
    cracks: number
    crackScale: number
    boltColor: string
}
type MotionSettings = {
    drag: boolean
    sensitivity: number
    inertia: number
    tilt: boolean
    tiltAngle: number
    autoRotate: boolean
    speed: number
}
type ViewSettings = {
    zoom: number
    pitch: number
    yaw: number
    roll: number
    transparent: boolean
    background: string
    radius: number
}
type RenderSettings = {
    quality: "balanced" | "high" | "4k"
    exposure: number
    environment: number
}
type Settings = ShapeSettings &
    SteelSettings &
    ElectricSettings &
    MotionSettings &
    ViewSettings &
    RenderSettings & { animate: boolean }
type Props = Partial<Settings> & {
    livePreview?: boolean
    editorPreview?: boolean
    sculpture?: Partial<ShapeSettings>
    steel?: Partial<SteelSettings>
    electricity?: Partial<ElectricSettings>
    interaction?: Partial<MotionSettings>
    view?: Partial<ViewSettings>
    rendering?: Partial<RenderSettings>
    style?: React.CSSProperties
    id?: string
    className?: string
}
const defaults = {
    livePreview: true,
    sculpture: {
        svg: "",
        example: "cross",
        depth: 23,
        rounding: 28,
        softness: 0.25,
        crown: 4,
    } as ShapeSettings,
    steel: {
        finish: "brushed",
        steelTint: "#BBC2CD",
        roughness: 28,
        brushing: 64,
        scratches: 48,
        grainScale: 100,
        seed: 12,
    } as SteelSettings,
    electricity: {
        attraction: true,
        idleElectricity: true,
        reach: 260,
        falloff: 1.35,
        response: 9,
        arcCount: 3,
        branching: 2,
        jaggedness: 64,
        retrace: 24,
        boltWidth: 1.25,
        glow: 66,
        power: 70,
        cracks: 58,
        crackScale: 100,
        boltColor: "#7BB7FF",
    } as ElectricSettings,
    interaction: {
        drag: true,
        sensitivity: 0.85,
        inertia: 38,
        tilt: true,
        tiltAngle: 5,
        autoRotate: false,
        speed: 8,
    } as MotionSettings,
    view: {
        zoom: 1,
        pitch: 12,
        yaw: -20,
        roll: -5,
        transparent: false,
        background: "#040609",
        radius: 0,
    } as ViewSettings,
    rendering: {
        quality: "4k",
        exposure: 1.08,
        environment: 1.25,
    } as RenderSettings,
}
const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n))
const rad = (n: number) => (n * Math.PI) / 180
const finite = (n: unknown, fallback: number, lo: number, hi: number) =>
    typeof n === "number" && Number.isFinite(n) ? clamp(n, lo, hi) : fallback
function sanitize(p: Record<string, any>): Settings {
    return {
        ...defaults.sculpture,
        ...defaults.steel,
        ...defaults.electricity,
        ...defaults.interaction,
        ...defaults.view,
        ...defaults.rendering,
        ...p,
        animate: !!p.animate,
        svg: typeof p.svg === "string" ? p.svg : "",
        example: ["five", "cross", "flower"].includes(p.example)
            ? p.example
            : "cross",
        finish: ["brushed", "machined", "dark", "polished"].includes(p.finish)
            ? p.finish
            : "brushed",
        depth: finite(p.depth, 23, 5, 70),
        rounding: finite(p.rounding, 28, 0, 100),
        softness: finite(p.softness, 0.25, 0, 3),
        crown: finite(p.crown, 4, 0, 60),
        roughness: finite(p.roughness, 28, 10, 70),
        brushing: finite(p.brushing, 64, 0, 100),
        scratches: finite(p.scratches, 48, 0, 100),
        grainScale: finite(p.grainScale, 100, 25, 300),
        seed: Math.round(finite(p.seed, 12, 1, 9999)),
        reach: finite(p.reach, 260, 60, 700),
        falloff: finite(p.falloff, 1.35, 0.4, 3),
        response: finite(p.response, 9, 3, 20),
        arcCount: Math.round(finite(p.arcCount, 3, 1, 5)),
        branching: Math.round(finite(p.branching, 2, 0, 3)),
        jaggedness: finite(p.jaggedness, 64, 10, 100),
        retrace: finite(p.retrace, 24, 10, 40),
        boltWidth: finite(p.boltWidth, 1.25, 0.5, 3),
        glow: finite(p.glow, 66, 0, 100),
        power: finite(p.power, 70, 10, 100),
        cracks: finite(p.cracks, 58, 0, 100),
        crackScale: finite(p.crackScale, 100, 25, 250),
        sensitivity: finite(p.sensitivity, 0.85, 0.1, 3),
        inertia: finite(p.inertia, 38, 0, 90),
        tiltAngle: finite(p.tiltAngle, 5, 0, 20),
        speed: finite(p.speed, 8, -60, 60),
        zoom: finite(p.zoom, 1, 0.2, 2.5),
        pitch: finite(p.pitch, 12, -180, 180),
        yaw: finite(p.yaw, -20, -180, 180),
        roll: finite(p.roll, -5, -180, 180),
        radius: finite(p.radius, 0, 0, 120),
        quality: ["balanced", "high", "4k"].includes(p.quality)
            ? p.quality
            : "high",
        exposure: finite(p.exposure, 1.08, 0.3, 2),
        environment: finite(p.environment, 1.25, 0.1, 3),
    }
}
const examples: Record<string, string> = {
    five: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 460"><path d="M75 18H288Q316 18 316 46V85Q316 113 288 113H119L112 183Q143 165 182 165C276 165 328 220 328 303C328 394 268 445 169 445C84 445 18 414 14 354Q12 327 39 320L78 309Q103 301 115 326C126 346 144 355 171 355C210 355 232 338 232 305C232 272 211 254 174 254Q143 254 121 274Q110 285 91 280L51 269Q26 263 30 236L47 45Q50 18 75 18Z"/></svg>`,
    cross: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460"><path d="M63 26Q81 13 99 32L200 153L301 32Q319 13 337 26L369 51Q392 68 373 91L266 224L374 361Q391 384 369 402L338 427Q319 443 300 420L200 297L100 420Q81 443 62 427L31 402Q9 384 26 361L134 224L27 91Q8 68 31 51Z"/></svg>`,
    flower: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><path d="M200 28C230 -4 286 35 276 78C320 59 365 111 338 152C389 166 389 234 338 248C365 289 320 341 276 322C286 365 230 404 200 372C170 404 114 365 124 322C80 341 35 289 62 248C11 234 11 166 62 152C35 111 80 59 124 78C114 35 170 -4 200 28Z"/></svg>`,
}

function prepareSVG(text: string): {
    text: string
    width: number
    height: number
} {
    if (typeof text !== "string" || text.length > 4_000_000)
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
    if (width / height > 160 || height / width > 160)
        throw new Error("SVG is too narrow. Export tighter logo bounds.")
    if (
        vb.length !== 4 ||
        !vb.every(Number.isFinite) ||
        vb[2] <= 0 ||
        vb[3] <= 0
    )
        root.setAttribute("viewBox", `0 0 ${width} ${height}`)
    const factor = 768 / Math.max(width, height)
    width = Math.max(2, Math.round(width * factor))
    height = Math.max(2, Math.round(height * factor))
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    root.setAttribute("width", String(width))
    root.setAttribute("height", String(height))
    root.style.color = "black"
    return { text: new XMLSerializer().serializeToString(root), width, height }
}

function distanceTransform(
    mask: Uint8Array,
    width: number,
    height: number,
    targetInside: boolean
) {
    const temporary = new Float32Array(width * height),
        result = new Float32Array(width * height)
    const size = Math.max(width, height),
        input = new Float64Array(size),
        output = new Float64Array(size)
    const sites = new Int32Array(size),
        breaks = new Float64Array(size + 1)
    function line(length: number) {
        let k = 0
        sites[0] = 0
        breaks[0] = -Infinity
        breaks[1] = Infinity
        for (let q = 1; q < length; q++) {
            let s =
                (input[q] + q * q - (input[sites[k]] + sites[k] * sites[k])) /
                (2 * q - 2 * sites[k])
            while (s <= breaks[k]) {
                k--
                s =
                    (input[q] +
                        q * q -
                        (input[sites[k]] + sites[k] * sites[k])) /
                    (2 * q - 2 * sites[k])
            }
            sites[++k] = q
            breaks[k] = s
            breaks[k + 1] = Infinity
        }
        k = 0
        for (let q = 0; q < length; q++) {
            while (breaks[k + 1] < q) k++
            const delta = q - sites[k]
            output[q] = delta * delta + input[sites[k]]
        }
    }
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++)
            input[y] = mask[y * width + x] >= 128 === targetInside ? 0 : 1e12
        line(height)
        for (let y = 0; y < height; y++) temporary[y * width + x] = output[y]
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) input[x] = temporary[y * width + x]
        line(width)
        for (let x = 0; x < width; x++) result[y * width + x] = output[x]
    }
    return result
}

type Field = {
    maxDistance: number
    width: number
    height: number
    scale: number
    worldWidth: number
    worldHeight: number
    data: Float32Array
    at: (x: number, y: number) => number
}

// Blur the distance field to soften small corners without adding polygons.
function soften(
    data: Float32Array,
    width: number,
    height: number,
    radius: number
) {
    if (!radius) return data
    const a = data,
        b = new Float32Array(data.length)
    for (let pass = 0; pass < 3; pass++) {
        for (let y = 0; y < height; y++) {
            let sum = 0
            for (let k = -radius; k <= radius; k++)
                sum += a[y * width + clamp(k, 0, width - 1)]
            for (let x = 0; x < width; x++) {
                b[y * width + x] = sum / (radius * 2 + 1)
                sum +=
                    a[y * width + clamp(x + radius + 1, 0, width - 1)] -
                    a[y * width + clamp(x - radius, 0, width - 1)]
            }
        }
        for (let x = 0; x < width; x++) {
            let sum = 0
            for (let k = -radius; k <= radius; k++)
                sum += b[clamp(k, 0, height - 1) * width + x]
            for (let y = 0; y < height; y++) {
                a[y * width + x] = sum / (radius * 2 + 1)
                sum +=
                    b[clamp(y + radius + 1, 0, height - 1) * width + x] -
                    b[clamp(y - radius, 0, height - 1) * width + x]
            }
        }
    }
    return a
}
function makeField(
    alpha: Uint8Array,
    width: number,
    height: number,
    softness: number
): Field {
    if (alpha.length !== width * height || width < 2 || height < 2)
        throw new Error("Invalid SVG silhouette.")
    let x0 = width,
        y0 = height,
        x1 = 0,
        y1 = 0,
        count = 0
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
            if (alpha[y * width + x] >= 128) {
                x0 = Math.min(x0, x)
                y0 = Math.min(y0, y)
                x1 = Math.max(x1, x + 1)
                y1 = Math.max(y1, y + 1)
                count++
            }
    if (count < 6)
        throw new Error(
            "SVG is empty. Convert text to outlines and upload again."
        )
    const blur = Math.round((Math.max(x1 - x0, y1 - y0) * softness) / 200)
    const pad = Math.max(4, blur * 4 + 2),
        w = x1 - x0 + pad * 2,
        h = y1 - y0 + pad * 2
    const mask = new Uint8Array(w * h),
        scale = 3.6 / Math.max(x1 - x0, y1 - y0)
    for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++)
            mask[(y - y0 + pad) * w + x - x0 + pad] = alpha[y * width + x]
    const inside = distanceTransform(mask, w, h, true),
        outside = distanceTransform(mask, w, h, false)
    const values = new Float32Array(w * h)
    for (let i = 0; i < values.length; i++) {
        const aa = mask[i] / 255
        values[i] =
            (aa > 0.01 && aa < 0.99
                ? aa - 0.5
                : aa >= 0.5
                  ? Math.sqrt(outside[i]) - 0.5
                  : 0.5 - Math.sqrt(inside[i])) * scale
    }
    const data = soften(values, w, h, blur)
    let maxDistance = 0
    for (const d of data) maxDistance = Math.max(maxDistance, d)
    return {
        maxDistance,
        width: w,
        height: h,
        scale,
        worldWidth: w * scale,
        worldHeight: h * scale,
        data,
        at(x, y) {
            const u = clamp(x / scale + w / 2 - 0.5, 0, w - 1.000001),
                v = clamp(h / 2 - y / scale - 0.5, 0, h - 1.000001)
            const ix = Math.floor(u),
                iy = Math.floor(v),
                fx = u - ix,
                fy = v - iy,
                i = iy * w + ix
            return (
                (data[i] * (1 - fx) + data[i + 1] * fx) * (1 - fy) +
                (data[i + w] * (1 - fx) + data[i + w + 1] * fx) * fy
            )
        },
    }
}
function rasterMask(image: CanvasImageSource, width: number, height: number) {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) throw new Error("SVG decoding is unavailable.")
    try {
        ctx.drawImage(image, 0, 0, width, height)
        const rgba = ctx.getImageData(0, 0, width, height).data,
            alpha = new Uint8Array(width * height)
        for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3]
        return { alpha, width, height }
    } finally {
        canvas.width = canvas.height = 1
    }
}

// The caps and sidewalls share one clipped grid boundary, preserving SVG holes.
// The rounded surface rolls inward, so thin strokes cannot grow into counters.
function buildSculpture(
    field: Field,
    depthPercent: number,
    roundPercent: number,
    resolution: number,
    crownPercent = 16
) {
    const depth = (depthPercent / 100) * 3.6,
        half = depth / 2,
        radius = Math.max(0.00001, (half * 0.98 * roundPercent) / 100)
    const crownHeight = ((half * crownPercent) / 100) * 0.32,
        heightScale = half / (half + crownHeight),
        maxDistance = Math.max(field.scale, field.maxDistance)
    const nx = Math.max(
        4,
        Math.round(
            (resolution * field.worldWidth) /
                Math.max(field.worldWidth, field.worldHeight)
        )
    )
    const ny = Math.max(
        4,
        Math.round(
            (resolution * field.worldHeight) /
                Math.max(field.worldWidth, field.worldHeight)
        )
    )
    const dx = field.worldWidth / nx,
        dy = field.worldHeight / ny
    type Node = { x: number; y: number; d: number; id: number; vertex?: number }
    const grid: Node[] = [],
        cuts = new Map<string, Node>(),
        boundaries = new Map<string, [Node, Node]>()
    const positions: number[] = [],
        normals: number[] = [],
        indices: number[] = []
    let nextID = (nx + 1) * (ny + 1)
    for (let y = 0; y <= ny; y++)
        for (let x = 0; x <= nx; x++) {
            const px = x * dx - field.worldWidth / 2,
                py = y * dy - field.worldHeight / 2
            let d = field.at(px, py)
            if (Math.abs(d) < 1e-7) d = 0
            grid.push({ x: px, y: py, d, id: y * (nx + 1) + x })
        }
    function normal(n: Node) {
        const e = field.scale * 1.5
        const gx = field.at(n.x + e, n.y) - field.at(n.x - e, n.y),
            gy = field.at(n.x, n.y + e) - field.at(n.x, n.y - e)
        const length = Math.hypot(gx, gy)
        return length > 1e-10 ? [gx / length, gy / length] : [0, 0]
    }
    function vertex(n: Node) {
        if (n.vertex !== undefined) return n.vertex
        const d = clamp(n.d, 0, radius),
            side = (radius - d) / radius,
            top = Math.sqrt(Math.max(0, 1 - side * side))
        const t = clamp(n.d / maxDistance, 0, 1),
            crown = crownHeight * t * t * (3 - 2 * t),
            slope = side + ((crownHeight * 6 * t * (1 - t)) / maxDistance) * top
        const z = (half - radius + radius * top + crown) * heightScale,
            [gx, gy] = normal(n)
        const length =
            Math.hypot(
                gx * slope * heightScale,
                gy * slope * heightScale,
                top
            ) || 1
        n.vertex = positions.length / 3
        positions.push(n.x, n.y, z, n.x, n.y, -z)
        normals.push(
            (-gx * slope * heightScale) / length,
            (-gy * slope * heightScale) / length,
            top / length,
            (-gx * slope * heightScale) / length,
            (-gy * slope * heightScale) / length,
            -top / length
        )
        return n.vertex
    }
    function intersection(a: Node, b: Node) {
        if (a.d === 0) return a
        if (b.d === 0) return b
        const key = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`
        let n = cuts.get(key)
        if (!n) {
            // Linear endpoint interpolation misses the zero contour where the
            // signed-distance field bends within a cell. Refine the same shared
            // edge root for caps and walls, rather than producing alternating
            // inward/outward teeth along the silhouette.
            let low = 0,
                high = 1
            let t = clamp(a.d / (a.d - b.d), 0, 1)
            for (let iteration = 0; iteration < 12; iteration++) {
                const d = field.at(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
                if (Math.abs(d) < 1e-9) break
                if (d >= 0 === a.d >= 0) low = t
                else high = t
                t = (low + high) * 0.5
            }
            n = {
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t,
                d: 0,
                id: nextID++,
            }
            cuts.set(key, n)
        }
        return n
    }
    function triangle(a: Node, b: Node, c: Node) {
        const input = [a, b, c],
            clipped: Node[] = []
        for (let i = 0; i < 3; i++) {
            const p = input[i],
                q = input[(i + 1) % 3]
            if (p.d >= 0) clipped.push(p)
            if (p.d >= 0 !== q.d >= 0) clipped.push(intersection(p, q))
        }
        const polygon = clipped.filter(
            (n, i) =>
                n.id !== clipped[(i + clipped.length - 1) % clipped.length].id
        )
        if (polygon.length < 3) return
        const base = vertex(polygon[0])
        for (let i = 1; i < polygon.length - 1; i++) {
            const u = vertex(polygon[i]),
                v = vertex(polygon[i + 1])
            indices.push(base, u, v, base + 1, v + 1, u + 1)
        }
        for (let i = 0; i < polygon.length; i++) {
            const p = polygon[i],
                q = polygon[(i + 1) % polygon.length]
            if (p.d === 0 && q.d === 0) {
                const key = p.id < q.id ? `${p.id}:${q.id}` : `${q.id}:${p.id}`
                if (boundaries.has(key)) boundaries.delete(key)
                else boundaries.set(key, [p, q])
            }
        }
    }
    for (let y = 0; y < ny; y++)
        for (let x = 0; x < nx; x++) {
            const i = y * (nx + 1) + x,
                a = grid[i],
                b = grid[i + 1],
                c = grid[i + nx + 2],
                d = grid[i + nx + 1]
            triangle(a, b, c)
            triangle(a, c, d)
        }
    for (const [a, b] of boundaries.values()) {
        const z = (half - radius) * heightScale,
            an = normal(a),
            bn = normal(b)
        const segments = Math.max(1, Math.ceil((z * 2) / Math.max(dx, dy)))
        const start = positions.length / 3
        for (let k = 0; k <= segments; k++) {
            const pz = z * (1 - (2 * k) / segments)
            positions.push(a.x, a.y, pz, b.x, b.y, pz)
            normals.push(-an[0], -an[1], 0, -bn[0], -bn[1], 0)
        }
        for (let k = 0; k < segments; k++) {
            const i = start + k * 2
            indices.push(i, i + 2, i + 1, i + 1, i + 2, i + 3)
        }
    }
    if (positions.length < 18)
        throw new Error(
            "Logo details are too small. Use a simpler SVG or increase geometry quality."
        )
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    )
    geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(normals, 3)
    )
    geometry.setIndex(indices)
    geometry.computeBoundingBox()
    geometry.center()
    geometry.computeBoundingSphere()
    geometry.userData.triangles = indices.length / 3
    return geometry
}

function makeStudio(renderer: THREE.WebGLRenderer) {
    const w = 512,
        h = 256,
        data = new Uint16Array(w * h * 4),
        direction = new THREE.Vector3(),
        up = new THREE.Vector3(0, 1, 0)
    const cards = [
        [-0.8, 0.55, 1, 0.34, 0.75, 4.8],
        [1, 0.15, 0.6, 0.15, 0.9, 1.8],
        [-0.4, 0.8, -1, 0.6, 0.28, 3.8],
        [0.1, 1, 0.2, 0.8, 0.4, 3.5],
        [0.85, 0.3, -0.8, 0.045, 1.1, 3.1],
    ].map((a) => {
        const n = new THREE.Vector3(a[0], a[1], a[2]).normalize(),
            right = new THREE.Vector3().crossVectors(up, n).normalize(),
            v = new THREE.Vector3().crossVectors(n, right)
        return { n, right, v, w: a[3], h: a[4], power: a[5] }
    })
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const phi = ((x + 0.5) / w) * Math.PI * 2,
                theta = ((y + 0.5) / h) * Math.PI
            direction.set(
                -Math.cos(phi) * Math.sin(theta),
                Math.cos(theta),
                Math.sin(phi) * Math.sin(theta)
            )
            let value = 0.025 + 0.065 * Math.max(0, direction.y)
            for (const c of cards) {
                const facing = direction.dot(c.n)
                if (facing > 0) {
                    const ex = Math.abs(direction.dot(c.right) / facing) / c.w,
                        ey = Math.abs(direction.dot(c.v) / facing) / c.h
                    value +=
                        Math.exp(-Math.pow(ex, 8) - Math.pow(ey, 8)) * c.power
                }
            }
            const i = (y * w + x) * 4
            data[i] = THREE.DataUtils.toHalfFloat(value * 1.018)
            data[i + 1] = THREE.DataUtils.toHalfFloat(value)
            data[i + 2] = THREE.DataUtils.toHalfFloat(value * 0.988)
            data[i + 3] = THREE.DataUtils.toHalfFloat(1)
        }
    const texture = new THREE.DataTexture(
        data,
        w,
        h,
        THREE.RGBAFormat,
        THREE.HalfFloatType
    )
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.needsUpdate = true
    let generator: THREE.PMREMGenerator | undefined
    try {
        generator = new THREE.PMREMGenerator(renderer)
        return generator.fromEquirectangular(texture)
    } finally {
        generator?.dispose()
        texture.dispose()
    }
}
function bufferRatio(
    w: number,
    h: number,
    dpr: number,
    quality: Settings["quality"]
) {
    const pixels =
        quality === "balanced"
            ? 1_400_000
            : quality === "4k"
              ? 3840 * 2160
              : 3_200_000
    return Math.min(
        quality === "balanced" ? 1.5 : quality === "4k" ? 3 : 2,
        Math.max(1.5, dpr || 1),
        Math.sqrt(pixels / Math.max(1, w * h)),
        4096 / Math.max(w, h)
    )
}
function inertiaStep(v: number, dt: number, amount: number) {
    if (amount <= 0) return { delta: 0, velocity: 0 }
    const d = 16 - (amount / 100) * 14,
        e = Math.exp(-d * dt)
    return { delta: (v * (1 - e)) / d, velocity: v * e }
}
function spinStep(v: number, target: number, dt: number) {
    const d = 4.5,
        e = Math.exp(-d * dt)
    return {
        delta: target * dt + ((v - target) * (1 - e)) / d,
        velocity: target + (v - target) * e,
    }
}

function randomSource(seed: number) {
    return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let n = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        n ^= n + Math.imul(n ^ (n >>> 7), 61 | n)
        return ((n ^ (n >>> 14)) >>> 0) / 4294967296
    }
}
function hash2(x: number, y: number, seed: number) {
    let n =
        Math.imul(x, 374761393) ^
        Math.imul(y, 668265263) ^
        Math.imul(seed, 1274126177)
    n = Math.imul(n ^ (n >>> 13), 1274126177)
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}
const metalPixels = new Map<string, Uint8Array>()
const fracturePixels = new Map<string, Uint8Array>()

/** Packed fracture relief: R=recess, G=raised lip, B=path phase, A=aperture.
 * Correlated, tapered stress paths branch from their actual parent segments.
 * The toroidal raster stays seamless and is generated only when the seed changes.
 */
function makeFracturePixels(size: number, seed: number) {
    const key = `${size}|${seed}`,
        cached = fracturePixels.get(key)
    if (cached) return cached
    const data = new Uint8Array(size * size * 4),
        rng = randomSource(seed ^ 0x5f3a91)
    const scale = size / 1024
    const stroke = (
        ax: number,
        ay: number,
        bx: number,
        by: number,
        wa: number,
        wb: number,
        phase: number,
        travel: number
    ) => {
        const dx = bx - ax,
            dy = by - ay,
            l2 = dx * dx + dy * dy || 1
        const support = Math.max(wa, wb) * 1.8 + 1
        for (
            let y = Math.floor(Math.min(ay, by) - support);
            y <= Math.ceil(Math.max(ay, by) + support);
            y++
        ) {
            for (
                let x = Math.floor(Math.min(ax, bx) - support);
                x <= Math.ceil(Math.max(ax, bx) + support);
                x++
            ) {
                const t = clamp(
                    ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2,
                    0,
                    1
                )
                const width = Math.max(0.16 * scale, wa + (wb - wa) * t)
                const distance = Math.hypot(
                    x + 0.5 - ax - t * dx,
                    y + 0.5 - ay - t * dy
                )
                const d = distance / width
                if (d > 1.8) continue
                const opening = clamp((1 - d) * width + 0.5, 0, 1)
                const relief =
                    Math.pow(opening, 0.65) * Math.min(1, width / (0.6 * scale))
                const lip =
                    Math.exp(
                        -Math.pow(
                            (distance - width * 1.1) /
                                Math.max(0.6, width * 0.28),
                            2
                        )
                    ) * Math.min(1, width / scale)
                const i =
                    ((((y % size) + size) % size) * size +
                        (((x % size) + size) % size)) *
                    4
                const depth = Math.round(relief * 255)
                if (depth > data[i]) {
                    data[i] = depth
                    data[i + 2] = Math.round(((phase + t * travel) % 1) * 255)
                }
                data[i + 1] = Math.max(data[i + 1], Math.round(lip * 255))
                data[i + 3] = Math.max(
                    data[i + 3],
                    Math.round(opening * Math.max(0, 1 - d * 0.34) * 255)
                )
            }
        }
    }
    function path(
        x: number,
        y: number,
        angle: number,
        length: number,
        width: number,
        phase: number,
        order: number
    ) {
        const steps = Math.max(5, Math.round(length / (size * 0.009))),
            step = length / steps
        const heading = angle
        let previousWidth = order ? width : 0,
            drift = 0
        for (let j = 0; j < steps; j++) {
            drift = drift * 0.63 + (rng() - 0.5) * 0.38
            angle +=
                (heading - angle) * 0.12 + drift * 0.35 + (rng() - 0.5) * 0.48
            const distance = step * (0.72 + rng() * 0.56),
                nx = x + Math.cos(angle) * distance,
                ny = y + Math.sin(angle) * distance
            const t = (j + 1) / steps
            const taper = order
                ? Math.pow(1 - t, 0.8)
                : Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.48)
            const nextWidth = width * taper * (0.76 + rng() * 0.42)
            const travel = distance / (size * 0.9)
            stroke(x, y, nx, ny, previousWidth, nextWidth, phase, travel)
            if (
                order < 2 &&
                j > steps * 0.2 &&
                j < steps * 0.78 &&
                rng() < (order ? 0.035 : 0.09)
            ) {
                const turn = (rng() > 0.5 ? 1 : -1) * (0.48 + rng() * 0.63)
                path(
                    nx,
                    ny,
                    angle + turn,
                    length * (0.16 + rng() * 0.2),
                    Math.max(0.3 * scale, nextWidth * 0.54),
                    phase + travel,
                    order + 1
                )
            }
            x = nx
            y = ny
            phase += travel
            previousWidth = nextWidth
        }
    }
    for (let i = 0; i < 7; i++) {
        path(
            rng() * size,
            rng() * size,
            rng() * Math.PI * 2,
            size * (0.28 + rng() * 0.39),
            scale * (i === 0 ? 2.5 : 0.8 + rng() * 1.15),
            rng(),
            0
        )
    }
    if (fracturePixels.size >= 2)
        fracturePixels.delete(fracturePixels.keys().next().value!)
    fracturePixels.set(key, data)
    return data
}

function makeFractureTexture(size: number, seed: number) {
    const texture = new THREE.DataTexture(
        new Uint8Array(makeFracturePixels(size, seed)),
        size,
        size,
        THREE.RGBAFormat
    )
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.generateMipmaps = true
    texture.needsUpdate = true
    return texture
}

function makeMetalTexture(size: number, seed: number) {
    const key = `${size}|${seed}`
    let data = metalPixels.get(key)
    if (!data) {
        data = new Uint8Array(size * size * 4)
        const rng = randomSource(seed)
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4,
                    grain = hash2(x, 0, seed),
                    slow = hash2(x, Math.floor(y / 48), seed + 3),
                    micro = hash2(x, y, seed + 17)
                data[i] = Math.round(
                    128 +
                        (grain - 0.5) * 36 +
                        (slow - 0.5) * 8 +
                        (micro - 0.5) * 12
                )
                data[i + 1] = Math.round(
                    140 + (grain - 0.5) * 65 + (micro - 0.5) * 20
                )
                data[i + 2] = Math.round(186 + (micro - 0.5) * 26)
                data[i + 3] = 0
            }
        const line = (
            ax: number,
            ay: number,
            bx: number,
            by: number,
            width: number,
            channel: number,
            value: number
        ) => {
            const minX = Math.floor(Math.min(ax, bx) - width * 2 - 1),
                maxX = Math.ceil(Math.max(ax, bx) + width * 2 + 1),
                minY = Math.floor(Math.min(ay, by) - width * 2 - 1),
                maxY = Math.ceil(Math.max(ay, by) + width * 2 + 1),
                dx = bx - ax,
                dy = by - ay,
                l2 = dx * dx + dy * dy || 1
            for (let y = minY; y <= maxY; y++)
                for (let x = minX; x <= maxX; x++) {
                    const t = clamp(
                            ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2,
                            0,
                            1
                        ),
                        distance = Math.hypot(
                            x + 0.5 - ax - t * dx,
                            y + 0.5 - ay - t * dy
                        ),
                        v = Math.exp((-distance * distance) / (width * width))
                    if (v < 0.006) continue
                    const i =
                        ((((y % size) + size) % size) * size +
                            (((x % size) + size) % size)) *
                            4 +
                        channel
                    data![i] =
                        channel === 3
                            ? Math.max(data![i], Math.round(v * value))
                            : Math.round(
                                  data![i] * (1 - v * 0.65) + value * v * 0.65
                              )
                }
        }
        // Sparse, fine scratches with occasional cross-grain machining marks.
        for (let i = 0; i < 190; i++) {
            const x = rng() * size,
                y = rng() * size,
                l = size * (0.012 + rng() * 0.12)
            line(
                x,
                y,
                x + (rng() - 0.5) * l * 0.12,
                y + l,
                0.32 + size / 2048,
                2,
                25 + rng() * 75
            )
        }
        for (let i = 0; i < 24; i++) {
            const x = rng() * size,
                y = rng() * size
            line(
                x,
                y,
                x + size * (0.015 + rng() * 0.05),
                y + size * (rng() - 0.5) * 0.035,
                0.3 + size / 2500,
                2,
                75
            )
        }
        const fractures = makeFracturePixels(size, seed)
        for (let i = 3; i < data.length; i += 4) data[i] = fractures[i]
        if (metalPixels.size >= 3)
            metalPixels.delete(metalPixels.keys().next().value!)
        metalPixels.set(key, data)
    }
    const texture = new THREE.DataTexture(
        new Uint8Array(data),
        size,
        size,
        THREE.RGBAFormat
    )
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.generateMipmaps = true
    texture.needsUpdate = true
    return texture
}
function addSteelTangents(g: THREE.BufferGeometry) {
    const normals = g.getAttribute("normal"),
        t = new Float32Array(normals.count * 4),
        n = new THREE.Vector3(),
        d = new THREE.Vector3()
    for (let i = 0; i < normals.count; i++) {
        n.fromBufferAttribute(normals, i)
        d.set(0, 1, 0).addScaledVector(n, -n.y)
        if (d.lengthSq() < 0.001) d.set(1, 0, 0).addScaledVector(n, -n.x)
        d.normalize()
        t.set([d.x, d.y, d.z, 1], i * 4)
    }
    g.setAttribute("tangent", new THREE.BufferAttribute(t, 4))
    return g
}
type SteelUniforms = {
    uSteelMap: { value: THREE.Texture }
    uFractureMap: { value: THREE.Texture }
    uContact: { value: THREE.Vector3 }
    uMachined: { value: number }
    uSteelScale: { value: number }
    uCrackScale: { value: number }
    uBrushing: { value: number }
    uScratches: { value: number }
    uCracks: { value: number }
    uTime: { value: number }
    uCharge: { value: number }
    uIdle: { value: number }
    uBoltColor: { value: THREE.Color }
    uPower: { value: number }
}
function steelUniforms(
    texture: THREE.Texture,
    fractures: THREE.Texture = texture
): SteelUniforms {
    return {
        uSteelMap: { value: texture },
        uFractureMap: { value: fractures },
        uContact: { value: new THREE.Vector3(0, 0, 1) },
        uMachined: { value: 0 },
        uSteelScale: { value: 1 },
        uCrackScale: { value: 1 },
        uBrushing: { value: 0.64 },
        uScratches: { value: 0.48 },
        uCracks: { value: 0.58 },
        uTime: { value: 0 },
        uCharge: { value: 0 },
        uIdle: { value: 1 },
        uBoltColor: { value: new THREE.Color("#7BB7FF") },
        uPower: { value: 0.7 },
    }
}
function replaceChunk(text: string, chunk: string, replacement: string) {
    if (!text.includes(chunk))
        throw new Error("Three shader chunk unavailable: " + chunk)
    return text.replace(chunk, replacement)
}
function makeSteelMaterial(u: SteelUniforms) {
    const m = new THREE.MeshPhysicalMaterial({
        color: "#BBC2CD",
        metalness: 1,
        roughness: 0.28,
        anisotropy: 0.64,
        anisotropyRotation: 0,
        envMapIntensity: 1.25,
        clearcoat: 0.025,
        clearcoatRoughness: 0.3,
    })
    m.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, u)
        shader.vertexShader =
            "varying vec3 vSteelPosition;\nvarying vec3 vSteelNormal;\nvarying vec3 vSteelEye;\n" +
            shader.vertexShader
        shader.vertexShader = replaceChunk(
            shader.vertexShader,
            "#include <begin_vertex>",
            `#include <begin_vertex>
vSteelPosition=position;vSteelNormal=normal;
vec3 steelEyeWorld=cameraPosition-(modelMatrix*vec4(position,1.)).xyz;
vSteelEye=vec3(dot(modelMatrix[0].xyz,steelEyeWorld),dot(modelMatrix[1].xyz,steelEyeWorld),dot(modelMatrix[2].xyz,steelEyeWorld));`
        )
        shader.fragmentShader =
            `
uniform sampler2D uSteelMap,uFractureMap;
uniform float uSteelScale,uCrackScale,uBrushing,uScratches,uCracks,uTime,uCharge,uIdle,uPower;
uniform float uMachined;
uniform vec3 uBoltColor,uContact;
varying vec3 vSteelPosition;
varying vec3 vSteelNormal;
varying vec3 vSteelEye;
vec4 steelSample(vec3 p,vec3 w){return texture2D(uSteelMap,p.yz)*w.x+texture2D(uSteelMap,p.xz)*w.y+texture2D(uSteelMap,p.xy)*w.z;}
vec4 fractureSample(vec3 p,vec3 w){return texture2D(uFractureMap,p.yz)*w.x+texture2D(uFractureMap,p.xz)*w.y+texture2D(uFractureMap,p.xy)*w.z;}
vec3 steelBump(vec3 p,vec3 n,float h){
    vec3 sx=dFdx(p),sy=dFdy(p),r1=cross(sy,n),r2=cross(n,sx);float d=dot(sx,r1);
    return normalize(max(abs(d),0.000000001)*n-sign(d)*(dFdx(h)*r1+dFdy(h)*r2));
}
` + shader.fragmentShader
        shader.fragmentShader = replaceChunk(
            shader.fragmentShader,
            "#include <color_fragment>",
            `#include <color_fragment>
vec3 steelN=normalize(vSteelNormal),steelWeights=pow(abs(steelN),vec3(8.));steelWeights/=max(dot(steelWeights,vec3(1.)),.0001);
vec4 steelSurface=steelSample(vSteelPosition*uSteelScale,steelWeights);
vec4 steelFracture=fractureSample(vSteelPosition*uCrackScale,steelWeights);
vec3 steelView=normalize(vSteelEye);
vec3 steelParallax=steelView*(.005*steelFracture.r/max(abs(dot(steelView,steelN)),.28));
vec4 steelFloor=fractureSample((vSteelPosition-steelParallax)*uCrackScale,steelWeights);
float steelCut=steelFracture.r*uCracks;
float steelAperture=steelFracture.a*steelFloor.a*uCracks;
float steelLip=steelFracture.g*uCracks;
float steelScratch=(1.0-steelSurface.b)*uScratches;
float steelWall=clamp(steelFracture.r-steelFloor.r,0.,1.);
diffuseColor.rgb*=mix(.95,1.025,steelSurface.r)*(1.0-steelCut*.77-steelWall*.12-steelScratch*.055+steelLip*.055);
float steelToolPhase=length(vSteelPosition.xy+vec2(.31,-.27))*220.*uSteelScale;
float steelTool=sin(steelToolPhase)*exp(-fwidth(steelToolPhase)*1.4)*uMachined;
float steelHeight=(steelSurface.r-.5)*.0007*uBrushing-steelScratch*.00085-steelCut*.012+steelLip*.0022+steelTool*.00038;
`
        )
        shader.fragmentShader = replaceChunk(
            shader.fragmentShader,
            "#include <roughnessmap_fragment>",
            "#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(steelSurface.g-.55)*.13*uBrushing+steelScratch*.045+steelCut*.28-steelLip*.075+steelTool*.016,.075,.92);"
        )
        shader.fragmentShader = replaceChunk(
            shader.fragmentShader,
            "#include <metalnessmap_fragment>",
            "#include <metalnessmap_fragment>\nmetalnessFactor*=1.0-steelCut*.12;"
        )
        shader.fragmentShader = replaceChunk(
            shader.fragmentShader,
            "#include <normal_fragment_maps>",
            "#include <normal_fragment_maps>\nnormal=steelBump(-vViewPosition,normal,steelHeight);"
        )
        shader.fragmentShader = replaceChunk(
            shader.fragmentShader,
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
float steelPhase=steelFracture.b*18.8495559+dot(vSteelPosition,vec3(.63,-.41,.27));
float steelPulse=pow(max(0.,sin(uTime*3.4-steelPhase)),22.);
float steelAfterglow=pow(max(0.,sin(uTime*3.4-steelPhase-.38)),8.);
vec3 steelContactDelta=vSteelPosition-uContact;
float steelLocal=exp(-dot(steelContactDelta,steelContactDelta)*1.25);
float steelCurrent=uIdle*(.004+.11*steelPulse)+uCharge*(.12+.8*steelPulse+.075*steelAfterglow)*(.2+.8*steelLocal);
vec3 steelArcColor=mix(uBoltColor,vec3(.92,.965,1.),steelPulse*.3);
totalEmissiveRadiance+=steelArcColor*(steelAperture*steelCurrent*3.1+steelLip*steelCurrent*.025)*uPower;
`
        )
    }
    m.customProgramCacheKey = () => "steel-storm-fracture-relief-v2"
    return m
}
function sampleSurface(g: THREE.BufferGeometry, count: number, seed: number) {
    const p = g.getAttribute("position"),
        n = g.getAttribute("normal"),
        ix = g.getIndex()!,
        triangles = ix.count / 3,
        cdf = new Float64Array(triangles),
        a = new THREE.Vector3(),
        b = new THREE.Vector3(),
        c = new THREE.Vector3(),
        ab = new THREE.Vector3(),
        ac = new THREE.Vector3()
    let total = 0
    for (let i = 0; i < triangles; i++) {
        a.fromBufferAttribute(p, ix.getX(i * 3))
        b.fromBufferAttribute(p, ix.getX(i * 3 + 1))
        c.fromBufferAttribute(p, ix.getX(i * 3 + 2))
        total += ab.copy(b).sub(a).cross(ac.copy(c).sub(a)).length() * 0.5
        cdf[i] = total
    }
    const rng = randomSource(seed),
        points: THREE.Vector3[] = [],
        normals: THREE.Vector3[] = []
    for (let k = 0; k < count; k++) {
        const r = rng() * total
        let lo = 0,
            hi = triangles - 1
        while (lo < hi) {
            const mid = (lo + hi) >>> 1
            if (cdf[mid] < r) lo = mid + 1
            else hi = mid
        }
        const i = lo * 3,
            j0 = ix.getX(i),
            j1 = ix.getX(i + 1),
            j2 = ix.getX(i + 2),
            s = Math.sqrt(rng()),
            t = rng(),
            w0 = 1 - s,
            w1 = s * (1 - t),
            w2 = s * t
        a.fromBufferAttribute(p, j0)
        b.fromBufferAttribute(p, j1)
        c.fromBufferAttribute(p, j2)
        points.push(
            a
                .multiplyScalar(w0)
                .addScaledVector(b, w1)
                .addScaledVector(c, w2)
                .clone()
        )
        a.fromBufferAttribute(n, j0)
        b.fromBufferAttribute(n, j1)
        c.fromBufferAttribute(n, j2)
        normals.push(
            a
                .multiplyScalar(w0)
                .addScaledVector(b, w1)
                .addScaledVector(c, w2)
                .normalize()
                .clone()
        )
    }
    return { points, normals }
}
function proximityWeight(distance: number, reach: number, falloff: number) {
    const x = clamp(1 - distance / reach, 0, 1)
    return Math.pow(x * x * (3 - 2 * x), falloff)
}

/** Midpoint-displaced leader. Endpoints are exact; subdivision adds multiple scales of branching detail. */
function boltPoints(
    start: THREE.Vector3,
    end: THREE.Vector3,
    count: number,
    roughness: number,
    seed: number,
    out: Float32Array
) {
    const rng = randomSource(seed),
        direction = new THREE.Vector3().subVectors(end, start),
        length = direction.length(),
        axis = direction.clone().normalize(),
        right = new THREE.Vector3()
            .crossVectors(
                axis,
                Math.abs(axis.y) < 0.9
                    ? new THREE.Vector3(0, 1, 0)
                    : new THREE.Vector3(1, 0, 0)
            )
            .normalize(),
        up = new THREE.Vector3().crossVectors(axis, right).normalize()
    if (length < 0.00001) {
        for (let i = 0; i < count; i++)
            out.set([start.x, start.y, start.z], i * 3)
        return out
    }
    out.set([start.x, start.y, start.z], 0)
    out.set([end.x, end.y, end.z], (count - 1) * 3)
    let span = count - 1,
        amplitude = length * roughness
    while (span > 1) {
        const half = span >> 1
        for (let i = 0; i < count - 1; i += span) {
            const m = i + half,
                j = i + span,
                a = (rng() - 0.5) * 2 * amplitude,
                b = (rng() - 0.5) * 2 * amplitude
            for (let k = 0; k < 3; k++)
                out[m * 3 + k] =
                    (out[i * 3 + k] + out[j * 3 + k]) * 0.5 +
                    right.getComponent(k) * a +
                    up.getComponent(k) * b
        }
        span = half
        amplitude *= 0.54
    }
    return out
}
const arcVertex = `
attribute vec4 aCurrent,aFrom,aNext,aNextFrom,aPrevious,aPreviousFrom,aMeta;
uniform vec2 uViewport;
uniform vec3 uCursorDelta;
uniform float uMorph,uWidth,uGlow;
varying float vAcross,vEnergy,vKind,vProgress;
void main(){
    vec4 p=mix(aFrom,aCurrent,uMorph),pn=mix(aNextFrom,aNext,uMorph),pp=mix(aPreviousFrom,aPrevious,uMorph);
    vec4 clip=projectionMatrix*modelViewMatrix*vec4(p.xyz+uCursorDelta*p.w,1.);
    vec4 nextClip=projectionMatrix*modelViewMatrix*vec4(pn.xyz+uCursorDelta*pn.w,1.);
    vec4 prevClip=projectionMatrix*modelViewMatrix*vec4(pp.xyz+uCursorDelta*pp.w,1.);
    vec2 tangent=(nextClip.xy/max(nextClip.w,.001)-prevClip.xy/max(prevClip.w,.001))*uViewport;
    tangent=length(tangent)>.00001?normalize(tangent):vec2(1.,0.);
    vec2 perpendicular=vec2(-tangent.y,tangent.x);
    float radius=uWidth*.7+uGlow*12.;
    clip.xy+=perpendicular*aMeta.x*radius*2./uViewport*clip.w;
    gl_Position=clip;vAcross=aMeta.x;vEnergy=aMeta.y;vKind=aMeta.z;vProgress=aMeta.w;
}
`
const arcFragment = `
uniform vec3 uColor;
uniform float uTime,uWidth,uGlow,uCharge,uIdle,uPower;
varying float vAcross,vEnergy,vKind,vProgress;
void main(){
    float activation=vKind>1.5?uIdle*(.15+.25*uCharge):uCharge;
    if(activation<.00005||vEnergy<.00001)discard;
    float radius=uWidth*.7+uGlow*12.,d=abs(vAcross)*radius,aa=max(fwidth(d),.2);
    float filament=uWidth*(.86+.14*sin(vProgress*39.+vEnergy*23.));
    float core=1.-smoothstep(filament*.26-aa*.4,filament*.58+aa*.4,d);
    float inner=exp(-d*d/max(filament*filament*1.7,.01));
    float halo=exp(-d*d/max(uGlow*uGlow*38.+.01,.02))*uGlow*.115;
    float phase=uTime*31.+vEnergy*71.,tick=floor(phase);
    float r0=fract(sin(tick*17.13+vEnergy*132.7)*43758.5453);
    float r1=fract(sin((tick+1.)*17.13+vEnergy*132.7)*43758.5453);
    float flicker=.66+.34*mix(r0,r1,smoothstep(0.,1.,fract(phase)));
    float branch=(vKind>.5&&vKind<1.5)?pow(max(0.,1.-vProgress),.7):1.;
    float energy=activation*vEnergy*uPower*flicker*branch;
    vec3 radiance=(vec3(1.,.985,.97)*core*1.7+uColor*(inner*.78+halo))*energy;
    gl_FragColor=vec4(radiance,clamp((core+inner*.5+halo)*energy,0.,1.));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`
const glowVertex = `
attribute vec4 aCenter;
attribute vec3 aStyle;
uniform vec2 uViewport;
uniform vec3 uCursorDelta;
varying vec2 vUv;
varying float vEnergy,vKind;
void main(){
    vec4 center=projectionMatrix*modelViewMatrix*vec4(aCenter.xyz+uCursorDelta*aCenter.w,1.);
    center.xy+=position.xy*aStyle.z*2./uViewport*center.w;
    gl_Position=center;vUv=position.xy;vEnergy=aStyle.x;vKind=aStyle.y;
}
`
const glowFragment = `
uniform vec3 uColor;
uniform float uCharge,uIdle,uPower,uTime,uGlow;
varying vec2 vUv;
varying float vEnergy,vKind;
void main(){
    float r=length(vUv);if(r>1.)discard;
    float active=vKind>1.5?uIdle*.08:uCharge;
    float halo=exp(-r*r*7.)*(1.-smoothstep(.7,1.,r));
    float core=exp(-r*r*220.);
    float e=vEnergy*active*uPower*(.9+.1*sin(uTime*19.+vEnergy*7.))*uGlow;
    gl_FragColor=vec4((uColor*halo*.4+vec3(1.)*core)*e,clamp((halo*.25+core)*e,0.,1.));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`
const arcPairs = [
    ["aFrom", "aCurrent"],
    ["aNextFrom", "aNext"],
    ["aPreviousFrom", "aPrevious"],
]
function write4(
    a: Float32Array,
    i: number,
    x: number,
    y: number,
    z: number,
    w: number
) {
    a[i] = x
    a[i + 1] = y
    a[i + 2] = z
    a[i + 3] = w
}
class ArcBank {
    geometry = new THREE.BufferGeometry()
    glowGeometry = new THREE.InstancedBufferGeometry()
    material: THREE.ShaderMaterial
    glowMaterial: THREE.ShaderMaterial
    mesh: THREE.Mesh
    glows: THREE.Mesh
    arrays: Record<string, Float32Array> = {}
    attributes: Record<string, THREE.BufferAttribute> = {}
    index: Uint16Array
    centers = new Float32Array(9 * 4)
    styles = new Float32Array(9 * 3)
    uniforms = {
        uViewport: { value: new THREE.Vector2(1, 1) },
        uCursorDelta: { value: new THREE.Vector3() },
        uMorph: { value: 1 },
        uWidth: { value: 1.25 },
        uGlow: { value: 0.66 },
        uTime: { value: 0 },
        uCharge: { value: 0 },
        uIdle: { value: 1 },
        uPower: { value: 0.7 },
        uColor: { value: new THREE.Color("#7BB7FF") },
    }
    referenceCursor = new THREE.Vector3()
    rootShift = new THREE.Vector3()
    vertices = 0
    indices = 0
    oldVertices = 0
    glowCount = 0
    fresh = true
    disposed = false
    capacity = 4096
    constructor() {
        for (const name of [
            "aCurrent",
            "aFrom",
            "aNext",
            "aNextFrom",
            "aPrevious",
            "aPreviousFrom",
            "aMeta",
        ]) {
            const data = new Float32Array(this.capacity * 4),
                attr = new THREE.BufferAttribute(data, 4).setUsage(
                    THREE.DynamicDrawUsage
                )
            this.arrays[name] = data
            this.attributes[name] = attr
            this.geometry.setAttribute(name, attr)
        }
        this.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                new Float32Array(this.capacity * 3),
                3
            ).setUsage(THREE.DynamicDrawUsage)
        )
        this.index = new Uint16Array(this.capacity * 3)
        this.geometry.setIndex(
            new THREE.BufferAttribute(this.index, 1).setUsage(
                THREE.DynamicDrawUsage
            )
        )
        this.geometry.setDrawRange(0, 0)
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: arcVertex,
            fragmentShader: arcFragment,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            premultipliedAlpha: true,
            toneMapped: true,
            side: THREE.DoubleSide,
        })
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.name = "branching lightning ribbons"
        this.mesh.frustumCulled = false
        this.mesh.renderOrder = 2
        this.glowGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
                [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
                3
            )
        )
        this.glowGeometry.setIndex([0, 1, 2, 0, 2, 3])
        this.glowGeometry.setAttribute(
            "aCenter",
            new THREE.InstancedBufferAttribute(this.centers, 4).setUsage(
                THREE.DynamicDrawUsage
            )
        )
        this.glowGeometry.setAttribute(
            "aStyle",
            new THREE.InstancedBufferAttribute(this.styles, 3).setUsage(
                THREE.DynamicDrawUsage
            )
        )
        this.glowGeometry.instanceCount = 0
        this.glowMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: glowVertex,
            fragmentShader: glowFragment,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            premultipliedAlpha: true,
            toneMapped: true,
            side: THREE.DoubleSide,
        })
        this.glows = new THREE.Mesh(this.glowGeometry, this.glowMaterial)
        this.glows.name = "electrical contact glow"
        this.glows.frustumCulled = false
        this.glows.renderOrder = 3
    }
    begin(cursor: THREE.Vector3) {
        const delta = this.uniforms.uCursorDelta.value
            .copy(cursor)
            .sub(this.referenceCursor)
        for (const [to, from] of arcPairs) {
            const src = this.arrays[from],
                dst = this.arrays[to]
            for (let i = 0; i < this.oldVertices; i++) {
                const j = i * 4,
                    w = src[j + 3]
                dst[j] = src[j] + delta.x * w
                dst[j + 1] = src[j + 1] + delta.y * w
                dst[j + 2] = src[j + 2] + delta.z * w
                dst[j + 3] = w
            }
        }
        this.referenceCursor.copy(cursor)
        this.uniforms.uCursorDelta.value.set(0, 0, 0)
        this.vertices = this.indices = this.glowCount = 0
    }
    path(
        points: Float32Array,
        count: number,
        startWeight: number,
        endWeight: number,
        energy: number,
        kind: number
    ) {
        if (this.vertices + count * 2 > this.capacity)
            throw new Error("Lightning buffer limit exceeded.")
        const base = this.vertices,
            position = this.geometry.getAttribute(
                "position"
            ) as THREE.BufferAttribute
        if (kind === 0) {
            const j = base * 4
            this.rootShift.set(
                points[0] - this.arrays.aFrom[j],
                points[1] - this.arrays.aFrom[j + 1],
                points[2] - this.arrays.aFrom[j + 2]
            )
        }
        for (let i = 0; i < count; i++)
            for (let side = 0; side < 2; side++) {
                const vertex = this.vertices++,
                    j = vertex * 4,
                    k = i * 3,
                    t = i / (count - 1),
                    previous = Math.max(0, i - 1),
                    next = Math.min(count - 1, i + 1)
                write4(
                    this.arrays.aCurrent,
                    j,
                    points[k],
                    points[k + 1],
                    points[k + 2],
                    startWeight + (endWeight - startWeight) * t
                )
                write4(
                    this.arrays.aPrevious,
                    j,
                    points[previous * 3],
                    points[previous * 3 + 1],
                    points[previous * 3 + 2],
                    startWeight +
                        ((endWeight - startWeight) * previous) / (count - 1)
                )
                write4(
                    this.arrays.aNext,
                    j,
                    points[next * 3],
                    points[next * 3 + 1],
                    points[next * 3 + 2],
                    startWeight +
                        ((endWeight - startWeight) * next) / (count - 1)
                )
                write4(this.arrays.aMeta, j, side ? 1 : -1, energy, kind, t)
                position.setXYZ(vertex, points[k], points[k + 1], points[k + 2])
                for (const [to, from] of arcPairs) {
                    const a = this.arrays[to],
                        b = this.arrays[from]
                    if (kind === 2) {
                        a[j] = b[j]
                        a[j + 1] = b[j + 1]
                        a[j + 2] = b[j + 2]
                        a[j + 3] = b[j + 3]
                    } else if (!this.fresh) {
                        const factor = 1 - a[j + 3]
                        a[j] += this.rootShift.x * factor
                        a[j + 1] += this.rootShift.y * factor
                        a[j + 2] += this.rootShift.z * factor
                    }
                }
            }
        for (let i = 0; i < count - 1; i++) {
            const j = base + i * 2
            const k = this.indices
            this.index[k] = j
            this.index[k + 1] = j + 1
            this.index[k + 2] = j + 2
            this.index[k + 3] = j + 2
            this.index[k + 4] = j + 1
            this.index[k + 5] = j + 3
            this.indices += 6
        }
    }
    glow(
        point: THREE.Vector3,
        weight: number,
        energy: number,
        kind: number,
        radius: number
    ) {
        if (this.glowCount >= 9) return
        this.centers.set(
            [point.x, point.y, point.z, weight],
            this.glowCount * 4
        )
        this.styles.set([energy, kind, radius], this.glowCount * 3)
        this.glowCount++
    }
    finish(snap = false) {
        if (this.fresh || this.oldVertices !== this.vertices || snap) {
            for (const [to, from] of arcPairs)
                this.arrays[to].set(this.arrays[from])
            this.uniforms.uMorph.value = 1
        } else this.uniforms.uMorph.value = 0
        this.oldVertices = this.vertices
        this.fresh = false
        for (const attr of Object.values(this.attributes))
            attr.needsUpdate = true
        this.geometry.getAttribute("position").needsUpdate = true
        this.geometry.getIndex()!.needsUpdate = true
        this.geometry.setDrawRange(0, this.indices)
        this.glowGeometry.getAttribute("aCenter").needsUpdate = true
        this.glowGeometry.getAttribute("aStyle").needsUpdate = true
        this.glowGeometry.instanceCount = this.glowCount
    }
    follow(cursor: THREE.Vector3) {
        this.uniforms.uCursorDelta.value.copy(cursor).sub(this.referenceCursor)
    }
    dispose() {
        if (this.disposed) return
        this.disposed = true
        this.geometry.dispose()
        this.glowGeometry.dispose()
        this.material.dispose()
        this.glowMaterial.dispose()
    }
}

function textureFracture(
    texture: THREE.Texture,
    p: THREE.Vector3,
    n: THREE.Vector3,
    scale: number
) {
    const image = texture.image as {
            data: Uint8Array
            width: number
            height: number
        },
        data = image.data,
        w = image.width,
        h = image.height
    const alpha = (u: number, v: number) => {
        const x = (((u % 1) + 1) % 1) * w - 0.5,
            y = (((v % 1) + 1) % 1) * h - 0.5,
            ix = Math.floor(x),
            iy = Math.floor(y),
            fx = x - ix,
            fy = y - iy
        const a = (xx: number, yy: number) =>
            data[((((yy % h) + h) % h) * w + (((xx % w) + w) % w)) * 4 + 3] /
            255
        return (
            (a(ix, iy) * (1 - fx) + a(ix + 1, iy) * fx) * (1 - fy) +
            (a(ix, iy + 1) * (1 - fx) + a(ix + 1, iy + 1) * fx) * fy
        )
    }
    const x = Math.pow(Math.abs(n.x), 8),
        y = Math.pow(Math.abs(n.y), 8),
        z = Math.pow(Math.abs(n.z), 8),
        sum = x + y + z || 1
    return (
        (alpha(p.y * scale, p.z * scale) * x +
            alpha(p.x * scale, p.z * scale) * y +
            alpha(p.x * scale, p.y * scale) * z) /
        sum
    )
}
/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 760
 */
export default function SteelStormLogo(incomingProps: Props) {
    const props = {
        ...defaults,
        ...defaults.sculpture,
        ...defaults.steel,
        ...defaults.electricity,
        ...defaults.interaction,
        ...defaults.view,
        ...defaults.rendering,
        ...incomingProps,
        ...(incomingProps.sculpture || {}),
        ...(incomingProps.steel || {}),
        ...(incomingProps.electricity || {}),
        ...(incomingProps.interaction || {}),
        ...(incomingProps.view || {}),
        ...(incomingProps.rendering || {}),
    }
    const isStatic = useIsStaticRenderer(),
        shouldAnimate =
            !isStatic &&
            (incomingProps.editorPreview ?? true) &&
            (incomingProps.livePreview ?? true),
        s = sanitize({ ...props, animate: shouldAnimate })
    const mountRef = useRef<HTMLDivElement>(null),
        statusRef = useRef<HTMLDivElement>(null),
        isIntersecting = useRef(true),
        latest = useRef(s)
    latest.current = s
    const controller = useRef<{ update: (next: Settings) => void } | null>(null)
    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return
        const container: HTMLDivElement = mount
        const scene = new THREE.Scene(),
            camera = new THREE.PerspectiveCamera(32, 1, 0.05, 120),
            group = new THREE.Group()
        group.name = "steel electrical sculpture"
        scene.add(group)
        const geometries = new Set<THREE.BufferGeometry>(),
            materials = new Set<THREE.Material>(),
            textures = new Set<THREE.Texture>(),
            targets = new Set<THREE.WebGLRenderTarget>(),
            removers: (() => void)[] = []
        const key = new THREE.DirectionalLight(0xecf3ff, 1.8),
            fill = new THREE.DirectionalLight(0x7893b9, 0.55),
            ambient = new THREE.HemisphereLight(0xb8c5d8, 0x080a12, 0.18)
        key.position.set(-4, 6, 6)
        fill.position.set(4, 1, -3)
        scene.add(key, fill, ambient)
        const electricalLights = Array.from(
            { length: 3 },
            () => new THREE.PointLight(0x7bb7ff, 0, 6, 2)
        )
        electricalLights.forEach((l) => scene.add(l))
        let renderer: THREE.WebGLRenderer | undefined,
            frameId = 0,
            resizeObserver: ResizeObserver | undefined,
            intersectionObserver: IntersectionObserver | undefined
        let geometry: THREE.BufferGeometry | undefined,
            pickGeometry: THREE.BufferGeometry | undefined,
            steelMesh: THREE.Mesh | undefined,
            pickMesh: THREE.Mesh | undefined,
            steelMaterial: THREE.MeshPhysicalMaterial | undefined,
            metalTexture: THREE.Texture | undefined,
            fractureTexture: THREE.Texture | undefined,
            uniforms: SteelUniforms | undefined,
            bank: ArcBank | undefined,
            environmentTarget: THREE.WebGLRenderTarget | undefined
        let sample: ReturnType<typeof sampleSurface> | undefined,
            distances = new Float32Array(0),
            cracked = new Uint8Array(0),
            fractureIDs: number[] = [],
            rootIDs = [0, 0, 0, 0, 0],
            lastTextureKey = ""
        let mask: ReturnType<typeof rasterMask> | undefined,
            field: Field | undefined,
            fieldSoftness = -1,
            config = latest.current,
            alive = true,
            cleaned = false,
            contextReady = true,
            lastTime = 0,
            time = 0,
            charge = 0,
            targetCharge = 0,
            lastTrace = -1,
            traceID = 0,
            arcDirty = true,
            pickDirty = true,
            nearestDistance = Infinity
        let sourceKey = "",
            modelKey = "",
            poseKey = "",
            lastQuality = "",
            token = 0,
            buildTimer: ReturnType<typeof setTimeout> | undefined,
            textureTimer: ReturnType<typeof setTimeout> | undefined,
            abort: AbortController | undefined,
            image: HTMLImageElement | undefined,
            objectURL = ""
        let manualX = rad(config.pitch),
            manualY = rad(config.yaw),
            autoY = 0,
            spinVelocity = 0,
            vx = 0,
            vy = 0,
            pointerX = 0,
            pointerY = 0,
            pointerKnown = false,
            hovered = false,
            keyboardUntil = 0
        let rect = { left: 0, top: 0, width: 1, height: 1 },
            drag: { id: number; x: number; y: number; time: number } | null =
                null
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        let reduced = query.matches
        const euler = new THREE.Euler(0, 0, 0, "YXZ"),
            target = new THREE.Quaternion(),
            current = new THREE.Quaternion(),
            before = new THREE.Quaternion(),
            raycaster = new THREE.Raycaster(),
            pointer = new THREE.Vector2()
        const worldPoint = new THREE.Vector3(),
            viewProjection = new THREE.Matrix4(),
            worldNormal = new THREE.Vector3(),
            viewVector = new THREE.Vector3(),
            projected = new THREE.Vector3(),
            cursor = new THREE.Vector3(),
            targetCursor = new THREE.Vector3(),
            plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.8),
            temp = new THREE.Vector3(),
            start = new THREE.Vector3(),
            end = new THREE.Vector3(),
            branchStart = new THREE.Vector3(),
            branchEnd = new THREE.Vector3(),
            normal = new THREE.Vector3()
        const mainWork = new Float32Array(65 * 3),
            branchWork = new Float32Array(33 * 3),
            dormantWork = new Float32Array(17 * 3)
        const canAnimate = () =>
            alive &&
            contextReady &&
            config.animate &&
            !reduced &&
            isIntersecting.current &&
            !document.hidden
        const on = (
            t: EventTarget,
            type: string,
            fn: EventListener,
            options?: AddEventListenerOptions
        ) => {
            t.addEventListener(type, fn, options)
            removers.push(() => t.removeEventListener(type, fn, options))
        }
        const stop = () => {
            cancelAnimationFrame(frameId)
            frameId = 0
            lastTime = 0
        }
        const status = (text: string) => {
            if (statusRef.current) {
                statusRef.current.textContent = text
                statusRef.current.style.display = text ? "flex" : "none"
            }
        }
        const releaseGeometry = (g: THREE.BufferGeometry | undefined) => {
            if (g && geometries.delete(g)) g.dispose()
        }
        const readPointer = (e: PointerEvent) => {
            pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1
            pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1
            pointerKnown = true
            hovered = Math.abs(pointerX) <= 1 && Math.abs(pointerY) <= 1
            pickDirty = true
        }
        function updateProximity() {
            pickDirty = false
            if (!canAnimate()) arcDirty = true
            if (!sample || !geometry) return
            group.updateWorldMatrix(true, true)
            camera.updateMatrixWorld()
            viewProjection.multiplyMatrices(
                camera.projectionMatrix,
                camera.matrixWorldInverse
            )
            pointer.set(pointerX, -pointerY)
            raycaster.setFromCamera(pointer, camera)
            let frontZ = 0
            const box = geometry.boundingBox!
            for (const x of [box.min.x, box.max.x])
                for (const y of [box.min.y, box.max.y])
                    for (const z of [box.min.z, box.max.z]) {
                        worldPoint.set(x, y, z).applyQuaternion(current)
                        frontZ = Math.max(frontZ, worldPoint.z)
                    }
            plane.constant = -(frontZ + 0.32)
            if (raycaster.ray.intersectPlane(plane, worldPoint)) {
                targetCursor.copy(worldPoint)
                group.worldToLocal(targetCursor)
            }
            nearestDistance = Infinity
            const px = (pointerX + 1) * 0.5 * rect.width,
                py = (pointerY + 1) * 0.5 * rect.height
            for (let i = 0; i < sample.points.length; i++) {
                worldPoint
                    .copy(sample.points[i])
                    .applyMatrix4(group.matrixWorld)
                worldNormal.copy(sample.normals[i]).applyQuaternion(current)
                viewVector.copy(camera.position).sub(worldPoint)
                if (worldNormal.dot(viewVector) <= 0) {
                    distances[i] = Infinity
                    continue
                }
                projected.copy(worldPoint).applyMatrix4(viewProjection)
                const dx = (projected.x * 0.5 + 0.5) * rect.width - px,
                    dy = (0.5 - projected.y * 0.5) * rect.height - py,
                    d = Math.hypot(dx, dy)
                distances[i] = d
                nearestDistance = Math.min(nearestDistance, d)
            }
            if (
                pointerKnown &&
                hovered &&
                pickMesh &&
                raycaster.intersectObject(pickMesh, false).length
            )
                nearestDistance = 0
            targetCharge =
                config.attraction && pointerKnown
                    ? proximityWeight(
                          nearestDistance,
                          config.reach,
                          config.falloff
                      )
                    : 0
            if (time < keyboardUntil) {
                targetCharge = 1
                targetCursor.set(0, 0.15, 0)
                group.localToWorld(targetCursor)
                targetCursor.x += 1.8
                targetCursor.z = frontZ + 0.65
                group.worldToLocal(targetCursor)
            }
        }
        function markFractures() {
            if (!sample || !metalTexture) return
            cracked = new Uint8Array(sample.points.length)
            fractureIDs = []
            for (let i = 0; i < sample.points.length; i++) {
                cracked[i] =
                    textureFracture(
                        metalTexture,
                        sample.points[i],
                        sample.normals[i],
                        (config.crackScale / 100) * 0.65
                    ) > 0.12
                        ? 1
                        : 0
                if (cracked[i]) fractureIDs.push(i)
            }
            arcDirty = pickDirty = true
        }
        function chooseRoots() {
            if (!sample) return
            const length = sample.points.length,
                ideal = Math.min(rect.width, rect.height) * 0.13
            for (let k = 0; k < config.arcCount; k++) {
                let best = rootIDs[k] || 0,
                    score = Infinity
                for (let i = 0; i < length; i++) {
                    if (!Number.isFinite(distances[i])) continue
                    let cost =
                        Math.abs(
                            distances[i] -
                                Math.max(
                                    nearestDistance + 18,
                                    ideal * (1 + k * 0.19)
                                )
                        ) + (cracked[i] ? 0 : 48)
                    for (let j = 0; j < k; j++) {
                        const d = sample.points[i].distanceTo(
                            sample.points[rootIDs[j]]
                        )
                        if (d < 0.48) cost += (0.48 - d) * 420
                    }
                    if (i === rootIDs[k]) cost -= 24
                    if (cost < score) {
                        score = cost
                        best = i
                    }
                }
                rootIDs[k] = best
            }
        }
        function buildArcs(snap = false) {
            if (!sample || !bank || !sample.points.length) return
            chooseRoots()
            bank.begin(cursor)
            const count = config.quality === "4k" ? 65 : 33,
                branches =
                    config.quality === "balanced"
                        ? Math.min(1, config.branching)
                        : config.branching,
                branchCount = config.quality === "4k" ? 33 : 17,
                seed = config.seed + traceID * 931
            const roughness = 0.028 + (config.jaggedness / 100) * 0.12
            for (let i = 0; i < config.arcCount; i++) {
                const id = rootIDs[i]
                start
                    .copy(sample.points[id])
                    .addScaledVector(sample.normals[id], 0.014)
                end.copy(cursor)
                boltPoints(
                    start,
                    end,
                    count,
                    roughness,
                    seed + i * 231,
                    mainWork
                )
                // An outward leader leaves the metal before bending to the cursor.
                const lift = Math.min(0.28, start.distanceTo(end) * 0.15)
                for (let j = 1; j < count - 1; j++) {
                    const t = j / (count - 1),
                        h = lift * Math.sin(Math.PI * t) * Math.exp(-t * 5),
                        k = j * 3
                    mainWork[k] += sample.normals[id].x * h
                    mainWork[k + 1] += sample.normals[id].y * h
                    mainWork[k + 2] += sample.normals[id].z * h
                }
                bank.path(
                    mainWork,
                    count,
                    0,
                    1,
                    i === 0 ? 1 : 0.76 - i * 0.045,
                    0
                )
                bank.glow(start, 0, 0.8, 0, 20)
                const rng = randomSource(seed + i * 1027)
                for (let b = 0; b < branches; b++) {
                    const at = Math.round((count - 1) * (0.3 + b * 0.2)),
                        t = at / (count - 1)
                    branchStart.fromArray(mainWork, at * 3)
                    branchEnd
                        .copy(end)
                        .sub(branchStart)
                        .multiplyScalar(0.16 + rng() * 0.2)
                        .add(branchStart)
                    const distance = start.distanceTo(end)
                    branchEnd.add(
                        temp
                            .set(rng() - 0.5, rng() - 0.5, rng() - 0.5)
                            .multiplyScalar(distance * 0.32)
                    )
                    boltPoints(
                        branchStart,
                        branchEnd,
                        branchCount,
                        roughness * 1.15,
                        seed + i * 177 + b * 137,
                        branchWork
                    )
                    bank.path(
                        branchWork,
                        branchCount,
                        t,
                        t + (1 - t) * 0.32,
                        0.42 - b * 0.07,
                        1
                    )
                }
            }
            bank.glow(cursor, 1, 0.85, 0, 31)
            const rng = randomSource(
                config.seed + Math.floor(traceID / 3) * 9917
            )
            for (let k = 0; k < 3; k++) {
                if (fractureIDs.length < 2) break
                let a = fractureIDs[Math.floor(rng() * fractureIDs.length)],
                    b = a,
                    best = Infinity
                for (let j = 0; j < 45; j++) {
                    const candidate =
                            fractureIDs[Math.floor(rng() * fractureIDs.length)],
                        d = sample.points[a].distanceTo(
                            sample.points[candidate]
                        ),
                        align = sample.normals[a].dot(sample.normals[candidate])
                    if (
                        align > 0.8 &&
                        d > 0.045 &&
                        d < 0.3 &&
                        Math.abs(d - 0.16) < best
                    ) {
                        best = Math.abs(d - 0.16)
                        b = candidate
                    }
                }
                start
                    .copy(sample.points[a])
                    .addScaledVector(sample.normals[a], 0.018)
                end.copy(sample.points[b]).addScaledVector(
                    sample.normals[b],
                    0.018
                )
                boltPoints(start, end, 17, 0.17, seed + k * 877, dormantWork)
                bank.path(
                    dormantWork,
                    17,
                    0,
                    0,
                    Number.isFinite(best) ? (config.cracks / 100) * 0.36 : 0,
                    2
                )
                bank.glow(start, 0, (0.3 * config.cracks) / 100, 2, 9)
            }
            bank.finish(snap)
            lastTrace = time
            traceID++
            arcDirty = false
        }
        function draw(dt = 0, snap = false) {
            if (
                !alive ||
                !contextReady ||
                !renderer ||
                !isIntersecting.current ||
                document.hidden
            )
                return false
            const active = canAnimate()
            if (active) time += dt
            if (active && !drag) {
                const x = inertiaStep(vx, dt, config.inertia),
                    y = inertiaStep(vy, dt, config.inertia)
                manualX += x.delta
                manualY += y.delta
                vx = Math.abs(x.velocity) > 0.002 ? x.velocity : 0
                vy = Math.abs(y.velocity) > 0.002 ? y.velocity : 0
                const spin = spinStep(
                    spinVelocity,
                    config.autoRotate && !hovered ? rad(config.speed) : 0,
                    dt
                )
                spinVelocity =
                    Math.abs(spin.velocity) > 0.0001 ? spin.velocity : 0
                autoY = (autoY + spin.delta) % (Math.PI * 2)
            } else if (!active) vx = vy = spinVelocity = 0
            const tilt =
                config.tilt && hovered && !drag ? rad(config.tiltAngle) : 0
            euler.set(
                manualX + clamp(pointerY, -1, 1) * tilt,
                manualY + autoY + clamp(pointerX, -1, 1) * tilt,
                rad(config.roll),
                "YXZ"
            )
            target.setFromEuler(euler)
            before.copy(current)
            current.slerp(target, snap || !active ? 1 : 1 - Math.exp(-7 * dt))
            group.quaternion.copy(current)
            const moved = before.angleTo(current) > 0.000001
            if (pickDirty || moved || time < keyboardUntil) updateProximity()
            if (time >= keyboardUntil && keyboardUntil > 0) {
                keyboardUntil = 0
                pickDirty = true
            }
            const blend =
                snap || !active
                    ? 1
                    : 1 -
                      Math.exp(
                          -config.response *
                              (targetCharge < charge ? 0.65 : 1) *
                              dt
                      )
            charge += (targetCharge - charge) * blend
            if (Math.abs(targetCharge - charge) < 0.0001) charge = targetCharge
            cursor.copy(targetCursor)
            if (uniforms) {
                uniforms.uCharge.value = charge
                uniforms.uTime.value = time
                uniforms.uContact.value.copy(cursor)
            }
            if (bank) {
                bank.uniforms.uTime.value = time
                bank.uniforms.uCharge.value = charge
                bank.follow(cursor)
                if (
                    arcDirty ||
                    lastTrace < 0 ||
                    ((charge > 0.001 ||
                        (config.idleElectricity && config.cracks > 0)) &&
                        time - lastTrace >= 1 / config.retrace)
                )
                    buildArcs(snap || !active)
                else {
                    const t = clamp(
                        (time - lastTrace) /
                            Math.min(0.06, 0.78 / config.retrace),
                        0,
                        1
                    )
                    bank.uniforms.uMorph.value = t * t * (3 - 2 * t)
                }
            }
            for (let i = 0; i < electricalLights.length; i++) {
                const light = electricalLights[i]
                if (i === 0) worldPoint.copy(cursor)
                else if (sample)
                    worldPoint
                        .copy(sample.points[rootIDs[i - 1]])
                        .addScaledVector(sample.normals[rootIDs[i - 1]], 0.11)
                else worldPoint.set(0, 0, 0)
                group.localToWorld(worldPoint)
                light.position.copy(worldPoint)
                light.intensity =
                    ((charge * config.power) / 100) *
                    (i === 0 ? 2.3 : 1.8) *
                    (0.9 + 0.1 * Math.sin(time * 11.3 + i * 2.1))
            }
            renderer.render(scene, camera)
            return (
                active &&
                ((config.idleElectricity && config.cracks > 0) ||
                    charge > 0.0001 ||
                    targetCharge > 0.0001 ||
                    current.angleTo(target) > 0.00003 ||
                    (!drag &&
                        Math.abs(vx) + Math.abs(vy) + Math.abs(spinVelocity) >
                            0.0002) ||
                    (config.autoRotate &&
                        Math.abs(config.speed) > 0.001 &&
                        !hovered) ||
                    time < keyboardUntil)
            )
        }
        const loop = (now: number) => {
            frameId = 0
            if (!canAnimate()) return
            const elapsed = lastTime ? (now - lastTime) / 1000 : 1 / 60
            const quiet =
                charge < 0.0001 &&
                targetCharge < 0.0001 &&
                !pickDirty &&
                !drag &&
                !config.autoRotate &&
                current.angleTo(target) < 0.00003 &&
                Math.abs(vx) + Math.abs(vy) < 0.001
            if (quiet && lastTime && elapsed < 1 / 30 - 0.001) {
                frameId = requestAnimationFrame(loop)
                return
            }
            lastTime = now
            if (draw(Math.min(0.05, elapsed)))
                frameId = requestAnimationFrame(loop)
            else lastTime = 0
        }
        function invalidate() {
            if (
                !alive ||
                !contextReady ||
                !isIntersecting.current ||
                document.hidden
            )
                return
            if (canAnimate()) {
                if (!frameId) frameId = requestAnimationFrame(loop)
            } else {
                stop()
                draw(0, true)
            }
        }
        const measureRect = () => {
            const r = container.getBoundingClientRect()
            rect = {
                left: r.left,
                top: r.top,
                width: Math.max(1, r.width),
                height: Math.max(1, r.height),
            }
        }
        function measure() {
            if (!renderer || !alive) return
            const width = Math.max(1, container.clientWidth),
                height = Math.max(1, container.clientHeight)
            measureRect()
            camera.aspect = width / height
            const box = geometry?.boundingBox,
                min = box?.min || new THREE.Vector3(-1.8, -1.8, -0.5),
                max = box?.max || new THREE.Vector3(1.8, 1.8, 0.5),
                q = new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(
                        rad(config.pitch),
                        rad(config.yaw),
                        rad(config.roll),
                        "YXZ"
                    )
                ),
                corner = new THREE.Vector3(),
                tangent = Math.tan(rad(16))
            let distance = 1
            for (const x of [min.x, max.x])
                for (const y of [min.y, max.y])
                    for (const z of [min.z, max.z]) {
                        corner.set(x, y, z).applyQuaternion(q)
                        distance = Math.max(
                            distance,
                            (Math.abs(corner.x) * 1.27) /
                                (tangent * camera.aspect) +
                                corner.z,
                            (Math.abs(corner.y) * 1.27) / tangent + corner.z
                        )
                    }
            camera.position.set(0, 0, distance / config.zoom)
            camera.lookAt(0, 0, 0)
            camera.updateProjectionMatrix()
            renderer.setPixelRatio(
                bufferRatio(
                    width,
                    height,
                    window.devicePixelRatio,
                    config.quality
                )
            )
            renderer.setSize(width, height, false)
            bank?.uniforms.uViewport.value.set(width, height)
            pickDirty = arcDirty = true
            invalidate()
        }

        function reseedSources() {
            if (!geometry) return
            sample = sampleSurface(
                geometry,
                config.quality === "balanced"
                    ? 700
                    : config.quality === "4k"
                      ? 1800
                      : 1200,
                config.seed
            )
            distances = new Float32Array(sample.points.length)
            distances.fill(Infinity)
            rootIDs = [0, 0, 0, 0, 0]
            markFractures()
        }
        function updateMaterial(refreshTexture = false) {
            if (!renderer) return
            const textureKey = `${config.quality === "balanced" ? 512 : 1024}|${config.seed}`
            if (
                (!metalTexture || refreshTexture) &&
                lastTextureKey !== textureKey
            ) {
                const size = config.quality === "balanced" ? 512 : 1024
                const next = makeMetalTexture(size, config.seed),
                    old = metalTexture,
                    oldFractures = fractureTexture
                let nextFractures: THREE.Texture
                try {
                    nextFractures = makeFractureTexture(size, config.seed)
                } catch (error) {
                    next.dispose()
                    throw error
                }
                const anisotropy = Math.min(
                    8,
                    renderer.capabilities?.getMaxAnisotropy?.() || 1
                )
                next.anisotropy = nextFractures.anisotropy = anisotropy
                metalTexture = next
                fractureTexture = nextFractures
                textures.add(next)
                textures.add(nextFractures)
                lastTextureKey = textureKey
                if (uniforms) uniforms.uSteelMap.value = next
                if (uniforms) uniforms.uFractureMap.value = nextFractures
                if (old && textures.delete(old)) old.dispose()
                if (oldFractures && textures.delete(oldFractures))
                    oldFractures.dispose()
                markFractures()
            }
            if (
                metalTexture &&
                lastTextureKey !== textureKey &&
                !refreshTexture
            ) {
                if (textureTimer !== undefined) clearTimeout(textureTimer)
                textureTimer = setTimeout(() => {
                    textureTimer = undefined
                    if (!alive) return
                    updateMaterial(true)
                    reseedSources()
                    invalidate()
                }, 100)
            } else if (
                lastTextureKey === textureKey &&
                textureTimer !== undefined
            ) {
                clearTimeout(textureTimer)
                textureTimer = undefined
            }
            if (!uniforms && metalTexture && fractureTexture) {
                uniforms = steelUniforms(metalTexture, fractureTexture)
                steelMaterial = makeSteelMaterial(uniforms)
                materials.add(steelMaterial)
            }
            if (!uniforms || !steelMaterial) return
            steelMaterial.color.set(config.steelTint)
            if (config.finish === "dark")
                steelMaterial.color.multiplyScalar(0.43)
            steelMaterial.roughness = clamp(
                (config.roughness / 100) *
                    (config.finish === "polished"
                        ? 0.55
                        : config.finish === "dark"
                          ? 1.2
                          : config.finish === "machined"
                            ? 1.05
                            : 1),
                0.075,
                0.9
            )
            steelMaterial.anisotropy =
                (config.brushing / 100) *
                (config.finish === "polished" ? 0.3 : 0.88)
            steelMaterial.envMapIntensity = config.environment
            uniforms.uSteelScale.value =
                (config.grainScale / 100) *
                (config.finish === "machined" ? 1.15 : 0.8)
            uniforms.uCrackScale.value = (config.crackScale / 100) * 0.65
            uniforms.uMachined.value = config.finish === "machined" ? 1 : 0
            uniforms.uBrushing.value = config.brushing / 100
            uniforms.uScratches.value = config.scratches / 100
            uniforms.uCracks.value = config.cracks / 100
            uniforms.uPower.value = config.power / 100
            uniforms.uIdle.value = config.idleElectricity ? 1 : 0
            uniforms.uBoltColor.value.set(config.boltColor)
            if (bank) {
                bank.uniforms.uColor.value.set(config.boltColor)
                bank.uniforms.uWidth.value = config.boltWidth
                bank.uniforms.uGlow.value = config.glow / 100
                bank.uniforms.uPower.value = config.power / 100
                bank.uniforms.uIdle.value = config.idleElectricity ? 1 : 0
            }
            electricalLights.forEach((l) => l.color.set(config.boltColor))
            renderer.toneMappingExposure = config.exposure
            scene.background = config.transparent
                ? null
                : new THREE.Color(config.background)
        }
        function rebuild() {
            buildTimer = undefined
            if (!alive || !mask) return
            const pending: THREE.BufferGeometry[] = []
            try {
                if (!field || fieldSoftness !== config.softness) {
                    field = makeField(
                        mask.alpha,
                        mask.width,
                        mask.height,
                        config.softness
                    )
                    fieldSoftness = config.softness
                }
                const resolution =
                        config.quality === "balanced"
                            ? 176
                            : config.quality === "4k"
                              ? 384
                              : 288,
                    next = addSteelTangents(
                        buildSculpture(
                            field,
                            config.depth,
                            config.rounding,
                            resolution,
                            config.crown
                        )
                    ),
                    proxy = buildSculpture(
                        field,
                        config.depth,
                        config.rounding,
                        44,
                        config.crown
                    )
                pending.push(next, proxy)
                const old = geometry,
                    oldPick = pickGeometry
                geometry = next
                pickGeometry = proxy
                geometries.add(next)
                geometries.add(proxy)
                pending.length = 0
                if (!steelMesh && steelMaterial) {
                    steelMesh = new THREE.Mesh(next, steelMaterial)
                    steelMesh.name = "machined steel logo"
                    group.add(steelMesh)
                    const proxyMaterial = new THREE.MeshBasicMaterial()
                    materials.add(proxyMaterial)
                    pickMesh = new THREE.Mesh(proxy, proxyMaterial)
                    pickMesh.name = "steel picking proxy"
                    pickMesh.visible = false
                    group.add(pickMesh)
                } else if (steelMesh) {
                    steelMesh.geometry = next
                    pickMesh!.geometry = proxy
                }
                releaseGeometry(old)
                releaseGeometry(oldPick)
                reseedSources()
                if (bank) bank.fresh = true
                lastTrace = -1
                traceID = 0
                updateMaterial()
                status("")
                container.dataset.logo = "ready"
                measure()
                invalidate()
            } catch (error) {
                pending.forEach((g) => g.dispose())
                status(
                    error instanceof Error
                        ? error.message
                        : "Unable to build this SVG."
                )
                container.dataset.logo = "error"
            }
        }
        function cancelDecode() {
            abort?.abort()
            abort = undefined
            if (image) {
                image.onload = null
                image.onerror = null
                image.src = ""
                image = undefined
            }
            if (objectURL) {
                URL.revokeObjectURL(objectURL)
                objectURL = ""
            }
        }
        async function loadSVG(source: string) {
            cancelDecode()
            const id = ++token,
                request = new AbortController()
            abort = request
            status("Forging steel logo…")
            container.dataset.logo = "loading"
            try {
                let text: string
                if (config.svg) {
                    // Only load local SVGs or Framer-hosted uploaded assets.
                    // Never request an arbitrary host from a component property.
                    let svgURL: URL
                    try {
                        svgURL = new URL(config.svg, window.location.href)
                    } catch {
                        throw new Error(
                            "Invalid SVG asset URL. Upload it again."
                        )
                    }
                    const sameOrigin =
                        (svgURL.protocol === "https:" ||
                            svgURL.protocol === "http:") &&
                        svgURL.origin === window.location.origin
                    const localBlob =
                        svgURL.protocol === "blob:" &&
                        svgURL.origin === window.location.origin
                    const framerAsset =
                        svgURL.protocol === "https:" &&
                        svgURL.hostname === "framerusercontent.com" &&
                        svgURL.port === "" &&
                        svgURL.username === "" &&
                        svgURL.password === ""
                    if (!sameOrigin && !localBlob && !framerAsset)
                        throw new Error(
                            "SVG must be a Framer-uploaded file or a local asset."
                        )
                    const response = await fetch(svgURL.href, {
                        signal: request.signal,
                        credentials: "omit",
                        redirect: "error",
                        referrerPolicy: "no-referrer",
                        mode: framerAsset ? "cors" : "same-origin",
                    })
                    if (!response.ok)
                        throw new Error(
                            "SVG could not be loaded. Upload it again."
                        )
                    if (
                        Number(response.headers.get("content-length") || 0) >
                        4_000_000
                    )
                        throw new Error(
                            "SVG is too large. Simplify the artwork."
                        )
                    text = await response.text()
                } else text = examples[config.example]
                if (!alive || id !== token || source !== sourceKey) return
                const prepared = prepareSVG(text),
                    element = new Image(),
                    url = URL.createObjectURL(
                        new Blob([prepared.text], { type: "image/svg+xml" })
                    )
                objectURL = url
                image = element
                element.onload = () => {
                    element.onload = element.onerror = null
                    if (!alive || id !== token) {
                        URL.revokeObjectURL(url)
                        return
                    }
                    try {
                        mask = rasterMask(
                            element,
                            prepared.width,
                            prepared.height
                        )
                        field = undefined
                        rebuild()
                    } catch (error) {
                        status(
                            error instanceof Error
                                ? error.message
                                : "SVG decoding failed."
                        )
                        container.dataset.logo = "error"
                    } finally {
                        if (objectURL === url) objectURL = ""
                        if (image === element) image = undefined
                        URL.revokeObjectURL(url)
                    }
                }
                element.onerror = () => {
                    element.onload = element.onerror = null
                    URL.revokeObjectURL(url)
                    if (objectURL === url) objectURL = ""
                    if (image === element) image = undefined
                    if (alive && id === token) {
                        status(
                            "Cannot decode this SVG. Export text as outlines."
                        )
                        container.dataset.logo = "error"
                    }
                }
                element.src = url
            } catch (error) {
                if (alive && id === token && !request.signal.aborted) {
                    status(
                        error instanceof Error
                            ? error.message
                            : "SVG could not be loaded."
                    )
                    container.dataset.logo = "error"
                }
            }
        }
        function scheduleRebuild() {
            if (buildTimer !== undefined) clearTimeout(buildTimer)
            buildTimer = setTimeout(() => {
                buildTimer = undefined
                if (alive) rebuild()
            }, 100)
        }
        function update(next: Settings) {
            const previous = config
            config = next
            if (!renderer) return
            updateMaterial()
            container.style.cursor = config.drag ? "grab" : "default"
            container.style.touchAction = config.drag ? "none" : "pan-y"
            if (!config.drag && drag) {
                const id = drag.id
                drag = null
                if (container.hasPointerCapture(id))
                    container.releasePointerCapture(id)
            }
            const pose = `${config.pitch}|${config.yaw}|${config.roll}`
            if (pose !== poseKey) {
                poseKey = pose
                manualX = rad(config.pitch)
                manualY = rad(config.yaw)
                autoY = vx = vy = spinVelocity = 0
                current.setFromEuler(
                    new THREE.Euler(manualX, manualY, rad(config.roll), "YXZ")
                )
                pickDirty = true
            }
            const source = config.svg || `example:${config.example}`,
                model = `${config.depth}|${config.rounding}|${config.crown}|${config.softness}|${config.quality}`
            if (source !== sourceKey) {
                sourceKey = source
                mask = undefined
                field = undefined
                if (buildTimer !== undefined) clearTimeout(buildTimer)
                buildTimer = undefined
                void loadSVG(source)
            } else if (mask && model !== modelKey) scheduleRebuild()

            modelKey = model
            if (previous.crackScale !== config.crackScale) markFractures()
            pickDirty = arcDirty = true
            if (!config.animate || reduced) stop()
            if (
                lastQuality !== config.quality ||
                previous.zoom !== config.zoom ||
                pose !== `${previous.pitch}|${previous.yaw}|${previous.roll}`
            ) {
                lastQuality = config.quality
                measure()
            }
            invalidate()
        }
        function cancelDrag() {
            if (drag) {
                const id = drag.id
                drag = null
                if (container.hasPointerCapture(id))
                    container.releasePointerCapture(id)
            }
            vx = vy = spinVelocity = 0
            container.style.cursor = config.drag ? "grab" : "default"
        }
        function activity() {
            if (!canAnimate()) {
                stop()
                cancelDrag()
                pointerKnown = hovered = false
                charge = targetCharge = 0
                keyboardUntil = 0
            }
            pickDirty = arcDirty = true
            invalidate()
        }
        function rebuildEnvironment() {
            if (!renderer) return
            const previous = environmentTarget,
                next = makeStudio(renderer)
            environmentTarget = next
            targets.add(next)
            scene.environment = next.texture
            if (previous) {
                targets.delete(previous)
                previous.texture.dispose()
                previous.dispose()
            }
        }
        function cleanup() {
            if (cleaned) return
            cleaned = true
            alive = false
            token++
            stop()
            cancelDecode()
            if (buildTimer !== undefined) clearTimeout(buildTimer)
            if (textureTimer !== undefined) clearTimeout(textureTimer)
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            removers.splice(0).forEach((fn) => fn())
            if (drag && container.hasPointerCapture(drag.id))
                container.releasePointerCapture(drag.id)
            drag = null
            controller.current = null
            scene.environment = null
            scene.background = null
            scene.clear()
            group.clear()
            mask = undefined
            field = undefined
            sample = undefined
            fractureIDs = []
            bank?.dispose()
            geometries.forEach((g) => g.dispose())
            geometries.clear()
            materials.forEach((m) => m.dispose())
            materials.clear()
            textures.forEach((t) => t.dispose())
            textures.clear()
            targets.forEach((t) => {
                t.texture.dispose()
                t.depthTexture?.dispose()
                t.dispose()
            })
            targets.clear()
            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (container && container.contains(renderer.domElement))
                    container.removeChild(renderer.domElement)
            }
        }
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
            })
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.toneMapping = THREE.ACESFilmicToneMapping
            renderer.setClearColor(0, 0)
            renderer.domElement.style.cssText =
                "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none"
            renderer.domElement.setAttribute("aria-hidden", "true")
            container.appendChild(renderer.domElement)
            rebuildEnvironment()
            bank = new ArcBank()
            group.add(bank.mesh, bank.glows)
            controller.current = { update }
            update(latest.current)
            measure()
            const down = (e: PointerEvent) => {
                if (e.button !== 0 || e.isPrimary === false || drag) return
                measureRect()
                readPointer(e)
                if (config.drag) {
                    vx = vy = spinVelocity = 0
                    drag = {
                        id: e.pointerId,
                        x: e.clientX,
                        y: e.clientY,
                        time: e.timeStamp,
                    }
                    container.setPointerCapture(e.pointerId)
                    container.style.cursor = "grabbing"
                }
                container.focus({ preventScroll: true })
                invalidate()
            }
            const move = (e: PointerEvent) => {
                if (e.isPrimary === false || !alive) return
                const margin = config.reach
                if (
                    !drag &&
                    (e.clientX < rect.left - margin ||
                        e.clientX > rect.left + rect.width + margin ||
                        e.clientY < rect.top - margin ||
                        e.clientY > rect.top + rect.height + margin)
                ) {
                    if (pointerKnown) {
                        pointerKnown = hovered = false
                        pickDirty = true
                        invalidate()
                    }
                    return
                }
                readPointer(e)
                if (drag && e.pointerId === drag.id) {
                    const scale =
                            (config.sensitivity * 4) /
                            Math.max(180, Math.min(rect.width, rect.height)),
                        dx = (e.clientY - drag.y) * scale,
                        dy = (e.clientX - drag.x) * scale,
                        dt = clamp(
                            (e.timeStamp - drag.time) / 1000,
                            0.008,
                            0.1
                        ),
                        blend = 1 - Math.exp(-20 * dt)
                    manualX += dx
                    manualY += dy
                    vx += (clamp(dx / dt, -4, 4) - vx) * blend
                    vy += (clamp(dy / dt, -4, 4) - vy) * blend
                    drag.x = e.clientX
                    drag.y = e.clientY
                    drag.time = e.timeStamp
                }
                invalidate()
            }
            const up = (e: PointerEvent) => {
                if (drag && e.pointerId === drag.id) {
                    const id = drag.id
                    if (e.type !== "pointerup" || e.timeStamp - drag.time > 100)
                        vx = vy = 0
                    drag = null
                    if (container.hasPointerCapture(id))
                        container.releasePointerCapture(id)
                    container.style.cursor = config.drag ? "grab" : "default"
                }
                if (e.pointerType === "touch") {
                    pointerKnown = hovered = false
                    pickDirty = true
                }
                invalidate()
            }
            on(container, "pointerdown", down as EventListener)
            on(window, "pointermove", move as EventListener, { passive: true })
            for (const type of [
                "pointerup",
                "pointercancel",
                "lostpointercapture",
            ])
                on(container, type, up as EventListener)
            on(container, "pointerenter", ((e: PointerEvent) => {
                measureRect()
                readPointer(e)
                invalidate()
            }) as EventListener)
            on(container, "pointerleave", (() => {
                hovered = false
                invalidate()
            }) as EventListener)
            on(window, "pointerout", ((e: PointerEvent) => {
                if (!e.relatedTarget && !drag) {
                    pointerKnown = hovered = false
                    pickDirty = true
                    invalidate()
                }
            }) as EventListener)
            const reset = () => {
                cancelDrag()
                manualX = rad(config.pitch)
                manualY = rad(config.yaw)
                autoY = 0
                keyboardUntil = 0
                pointerKnown = hovered = false
                pickDirty = arcDirty = true
                invalidate()
            }
            on(container, "dblclick", reset as EventListener)
            on(container, "keydown", ((e: KeyboardEvent) => {
                if (e.key === "ArrowLeft") manualY -= 0.16
                else if (e.key === "ArrowRight") manualY += 0.16
                else if (e.key === "ArrowUp") manualX -= 0.16
                else if (e.key === "ArrowDown") manualX += 0.16
                else if (e.key === "Home" || e.key.toLowerCase() === "r") {
                    reset()
                    e.preventDefault()
                    return
                } else if (e.key === "Enter" || e.key === " ") {
                    keyboardUntil = time + 1.2
                    pointerKnown = false
                } else return
                e.preventDefault()
                vx = vy = 0
                pickDirty = arcDirty = true
                invalidate()
            }) as EventListener)
            on(container, "keyup", ((e: KeyboardEvent) => {
                if ((e.key === "Enter" || e.key === " ") && !canAnimate()) {
                    keyboardUntil = 0
                    pickDirty = arcDirty = true
                    invalidate()
                }
            }) as EventListener)
            on(window, "blur", (() => {
                cancelDrag()
                keyboardUntil = 0
                pointerKnown = hovered = false
                pickDirty = true
                invalidate()
            }) as EventListener)
            on(
                window,
                "scroll",
                (() => {
                    if (isIntersecting.current) measureRect()
                    pickDirty = true
                    if (!canAnimate()) invalidate()
                }) as EventListener,
                { passive: true }
            )
            on(document, "visibilitychange", activity as EventListener)
            on(query, "change", (() => {
                reduced = query.matches
                activity()
            }) as EventListener)
            on(renderer.domElement, "webglcontextlost", ((e: Event) => {
                e.preventDefault()
                contextReady = false
                stop()
                status("3D preview paused. Waiting for graphics…")
                container.dataset.webgl = "lost"
            }) as EventListener)
            on(renderer.domElement, "webglcontextrestored", (() => {
                try {
                    contextReady = true
                    rebuildEnvironment()
                    container.dataset.webgl = "ready"
                    if (steelMesh) status("")
                    measure()
                    activity()
                } catch {
                    contextReady = false
                    stop()
                    status("Graphics could not be restored. Reload the page.")
                }
            }) as EventListener)
            if (typeof ResizeObserver !== "undefined") {
                resizeObserver = new ResizeObserver(measure)
                resizeObserver.observe(container)
            } else on(window, "resize", measure as EventListener)
            if (typeof IntersectionObserver !== "undefined") {
                intersectionObserver = new IntersectionObserver(
                    (entries) => {
                        if (!entries[0]) return
                        isIntersecting.current = entries[0].isIntersecting
                        activity()
                    },
                    { threshold: 0 }
                )
                intersectionObserver.observe(container)
            }
            container.dataset.webgl = "ready"
            activity()
        } catch (error) {
            cleanup()
            container.dataset.webgl = "unavailable"
            status("3D graphics are unavailable in this browser.")
            console.warn("SteelStormLogo: initialization failed.", error)
        }
        return cleanup
    }, [])
    useEffect(() => {
        controller.current?.update(s)
    }, [
        shouldAnimate,
        s.svg,
        s.example,
        s.depth,
        s.rounding,
        s.softness,
        s.crown,
        s.finish,
        s.steelTint,
        s.roughness,
        s.brushing,
        s.scratches,
        s.grainScale,
        s.seed,
        s.attraction,
        s.idleElectricity,
        s.reach,
        s.falloff,
        s.response,
        s.arcCount,
        s.branching,
        s.jaggedness,
        s.retrace,
        s.boltWidth,
        s.glow,
        s.power,
        s.cracks,
        s.crackScale,
        s.boltColor,
        s.drag,
        s.sensitivity,
        s.inertia,
        s.tilt,
        s.tiltAngle,
        s.autoRotate,
        s.speed,
        s.zoom,
        s.pitch,
        s.yaw,
        s.roll,
        s.transparent,
        s.background,
        s.quality,
        s.exposure,
        s.environment,
    ])
    return (
        <div
            id={props.id}
            className={props.className}
            ref={mountRef}
            role="group"
            tabIndex={0}
            aria-label="Interactive steel logo. Move your cursor near it to charge electrical arcs. Drag or use arrow keys to rotate. Enter creates an electrical pulse. Home resets."
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                ...props.style,
                overflow: "hidden",
                background: s.transparent ? "transparent" : s.background,
                borderRadius: s.radius,
                isolation: "isolate",
            }}
        >
            <div
                ref={statusRef}
                role="status"
                aria-live="polite"
                style={{
                    position: "absolute",
                    inset: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#8B95A5",
                    fontFamily: "Inter,system-ui,sans-serif",
                    fontSize: 12,
                    lineHeight: 1.5,
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            >
                Forging steel logo…
            </div>
        </div>
    )
}
SteelStormLogo.defaultProps = defaults

addPropertyControls(SteelStormLogo, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate the canvas preview.",
    },
    sculpture: {
        type: ControlType.Object,
        title: "Logo & Shape",
        controls: {
            svg: {
                type: ControlType.File,
                title: "SVG Logo",
                allowedFileTypes: ["svg"],
                description: "Upload outlined vector artwork.",
            },
            example: {
                type: ControlType.Enum,
                title: "Example",
                options: ["five", "cross", "flower"],
                optionTitles: ["Number 5", "Letter X", "Soft Flower"],
                defaultValue: "cross",
                hidden: (p: ShapeSettings) => !!p.svg,
            },
            depth: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 23,
                min: 5,
                max: 70,
                step: 1,
                unit: "%",
                description: "Relative to the longest side.",
            },
            rounding: {
                type: ControlType.Number,
                title: "Edge Bevel",
                defaultValue: 28,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            crown: {
                type: ControlType.Number,
                title: "Face Curve",
                defaultValue: 4,
                min: 0,
                max: 60,
                step: 1,
                unit: "%",
                description: "Keeps machined faces almost flat.",
            },
            softness: {
                type: ControlType.Number,
                title: "Corners",
                defaultValue: 0.25,
                min: 0,
                max: 3,
                step: 0.05,
                unit: "%",
                description: "Softens sharp SVG corners.",
            },
        },
    },
    steel: {
        type: ControlType.Object,
        title: "Steel Material",
        controls: {
            finish: {
                type: ControlType.Enum,
                title: "Finish",
                options: ["brushed", "machined", "dark", "polished"],
                optionTitles: [
                    "Brushed Steel",
                    "Machined Steel",
                    "Dark Steel",
                    "Polished Steel",
                ],
                defaultValue: "brushed",
            },
            steelTint: {
                type: ControlType.Color,
                title: "Steel Tint",
                defaultValue: "#BBC2CD",
            },
            roughness: {
                type: ControlType.Number,
                title: "Roughness",
                defaultValue: 28,
                min: 10,
                max: 70,
                step: 1,
                unit: "%",
                description: "Lower gives sharper reflections.",
            },
            brushing: {
                type: ControlType.Number,
                title: "Brushed Grain",
                defaultValue: 64,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "Directional machining texture.",
            },
            scratches: {
                type: ControlType.Number,
                title: "Scratches",
                defaultValue: 48,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            grainScale: {
                type: ControlType.Number,
                title: "Grain Scale",
                defaultValue: 100,
                min: 25,
                max: 300,
                step: 5,
                unit: "%",
                description: "Higher gives finer texture.",
            },
            seed: {
                type: ControlType.Number,
                title: "Variation",
                defaultValue: 12,
                min: 1,
                max: 9999,
                step: 1,
                unit: "seed",
                description: "Changes scratches and fissures.",
            },
        },
    },
    electricity: {
        type: ControlType.Object,
        title: "Electricity",
        controls: {
            attraction: {
                type: ControlType.Boolean,
                title: "Cursor Arcs",
                defaultValue: true,
            },
            idleElectricity: {
                type: ControlType.Boolean,
                title: "Dormant Current",
                defaultValue: true,
                description: "Subtle moving charge when idle.",
            },
            reach: {
                type: ControlType.Number,
                title: "Attraction Range",
                defaultValue: 260,
                min: 60,
                max: 700,
                step: 10,
                unit: "px",
                description: "Cursor distance that wakes the logo.",
            },
            falloff: {
                type: ControlType.Number,
                title: "Distance Curve",
                defaultValue: 1.35,
                min: 0.4,
                max: 3,
                step: 0.05,
                unit: "×",
                description: "Higher concentrates charge nearby.",
            },
            response: {
                type: ControlType.Number,
                title: "Charge Response",
                defaultValue: 9,
                min: 3,
                max: 20,
                step: 1,
                unit: "s⁻¹",
                description: "Lower charges and fades more slowly.",
            },
            arcCount: {
                type: ControlType.Number,
                title: "Main Bolts",
                defaultValue: 3,
                min: 1,
                max: 5,
                step: 1,
                unit: "arcs",
            },
            branching: {
                type: ControlType.Number,
                title: "Branches",
                defaultValue: 2,
                min: 0,
                max: 3,
                step: 1,
                unit: "forks",
                description: "Forks on each main bolt.",
            },
            jaggedness: {
                type: ControlType.Number,
                title: "Irregularity",
                defaultValue: 64,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
                description: "Makes the leader more jagged.",
            },
            retrace: {
                type: ControlType.Number,
                title: "Retrace",
                defaultValue: 24,
                min: 10,
                max: 40,
                step: 1,
                unit: "Hz",
                description: "How often paths change shape.",
            },
            boltWidth: {
                type: ControlType.Number,
                title: "Core Width",
                defaultValue: 1.25,
                min: 0.5,
                max: 3,
                step: 0.05,
                unit: "px",
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                defaultValue: 66,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            power: {
                type: ControlType.Number,
                title: "Power",
                defaultValue: 70,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
                description: "Bolt and reflected light intensity.",
            },
            cracks: {
                type: ControlType.Number,
                title: "Fissures",
                defaultValue: 58,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "Depth and glow of the cuts.",
            },
            crackScale: {
                type: ControlType.Number,
                title: "Fissure Scale",
                defaultValue: 100,
                min: 25,
                max: 250,
                step: 5,
                unit: "%",
                description: "Higher gives smaller fissures.",
            },
            boltColor: {
                type: ControlType.Color,
                title: "Electric Color",
                defaultValue: "#7BB7FF",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Rotation & Tilt",
        controls: {
            drag: {
                type: ControlType.Boolean,
                title: "Drag Rotate",
                defaultValue: true,
            },
            sensitivity: {
                type: ControlType.Number,
                title: "Drag Speed",
                defaultValue: 0.85,
                min: 0.1,
                max: 3,
                step: 0.05,
                unit: "×",
                hidden: (p: MotionSettings) => !p.drag,
            },
            inertia: {
                type: ControlType.Number,
                title: "Momentum",
                defaultValue: 38,
                min: 0,
                max: 90,
                step: 1,
                unit: "%",
                hidden: (p: MotionSettings) => !p.drag,
            },
            tilt: {
                type: ControlType.Boolean,
                title: "Cursor Tilt",
                defaultValue: true,
            },
            tiltAngle: {
                type: ControlType.Number,
                title: "Tilt Angle",
                defaultValue: 5,
                min: 0,
                max: 20,
                step: 1,
                unit: "°",
                hidden: (p: MotionSettings) => !p.tilt,
            },
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: false,
            },
            speed: {
                type: ControlType.Number,
                title: "Spin Speed",
                defaultValue: 8,
                min: -60,
                max: 60,
                step: 1,
                unit: "°/s",
                hidden: (p: MotionSettings) => !p.autoRotate,
            },
        },
    },
    view: {
        type: ControlType.Object,
        title: "View & Background",
        controls: {
            zoom: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 1,
                min: 0.2,
                max: 2.5,
                step: 0.05,
                unit: "×",
            },
            pitch: {
                type: ControlType.Number,
                title: "Pitch",
                defaultValue: 12,
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
            },
            yaw: {
                type: ControlType.Number,
                title: "Turn",
                defaultValue: -20,
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
            },
            roll: {
                type: ControlType.Number,
                title: "Roll",
                defaultValue: -5,
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
            },
            transparent: {
                type: ControlType.Boolean,
                title: "Transparent",
                defaultValue: false,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#040609",
                hidden: (p: ViewSettings) => p.transparent,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 0,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
            },
        },
    },
    rendering: {
        type: ControlType.Object,
        title: "Rendering & Light",
        description:
            "More components by 👉 [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                options: ["balanced", "high", "4k"],
                optionTitles: ["Balanced", "High", "4K"],
                defaultValue: "4k",
                description: "Limits pixels and geometry.",
            },
            exposure: {
                type: ControlType.Number,
                title: "Brightness",
                defaultValue: 1.08,
                min: 0.3,
                max: 2,
                step: 0.05,
                unit: "×",
            },
            environment: {
                type: ControlType.Number,
                title: "Studio Light",
                defaultValue: 1.25,
                min: 0.1,
                max: 3,
                step: 0.05,
                unit: "×",
                description: "Brightness of steel reflections.",
            },
        },
    },
})
