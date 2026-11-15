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


// ============================================================================
// URL NORMALIZATION HELPER (RULE 17: PERFECT FRAMER LINK HANDLING)
// ============================================================================
function normalizeUrl(rawUrl?: string): string | null {
    if (!rawUrl || typeof rawUrl !== "string") return null
    const trimmed = rawUrl.trim()
    if (!trimmed) return null

    const lower = trimmed.toLowerCase()
    if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:") ||
        lower.startsWith("vbscript:")
    ) {
        return null
    }

    if (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("mailto:") ||
        lower.startsWith("tel:") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("#")
    ) {
        return trimmed
    }

    if (lower.startsWith("www.")) {
        return `https://${trimmed}`
    }

    if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/.test(trimmed)) {
        return `https://${trimmed}`
    }

    return trimmed
}

// ============================================================================
// BUILT-IN SVG PRESETS (INCLUDING VIDEO REFERENCE HEART)
// ============================================================================
function getPresetSvgString(preset: string): string {
    switch (preset) {
        case "star":
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="#ffffff" d="M256 32l65.8 140.6 154.9 19.6-114.6 106.5 29.9 152.3L256 376.8 120 451l29.9-152.3L35.3 192.2l154.9-19.6L256 32z"/>
            </svg>`
        case "infinity":
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="none" stroke="#ffffff" stroke-width="68" stroke-linecap="round" stroke-linejoin="round" d="M148 176c-53 0-92 36-92 80s39 80 92 80c68 0 148-160 216-160 53 0 92 36 92 80s-39 80-92 80c-68 0-148-160-216-160z"/>
            </svg>`
        case "bolt":
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="#ffffff" d="M298 28L98 284h130l-34 200 220-260H282L298 28z"/>
            </svg>`
        case "heart":
        default:
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="none" stroke="#ffffff" stroke-width="84" stroke-linecap="round" stroke-linejoin="round"
                    d="M256 424 C208 386 76 290 76 178 C76 110 128 68 186 68 C222 68 244 88 256 114 C268 88 290 68 326 68 C384 68 436 110 436 178 C436 290 304 386 256 424 Z" />
            </svg>`
    }
}

// ============================================================================
// DETERMINISTIC PSEUDO-RANDOM GENERATOR
// ============================================================================
function createSeededRandom(seed = 1337) {
    let s = seed % 2147483647
    if (s <= 0) s += 2147483646
    return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
    }
}

// ============================================================================
// SPHERE DATA INTERFACE
// ============================================================================
interface PackedSphere {
    tx: number
    ty: number
    tz: number
    ox: number
    oy: number
    oz: number
    vx: number
    vy: number
    vz: number
    r: number
    scaleOffset: number
    scaleVel: number
    color: THREE.Color
    ao: number
    outX: number
    outY: number
    outZ: number
    order: number
    phase: number
    freq: number
    spawnOriginX: number
    spawnOriginY: number
    spawnOriginZ: number
    hasTriggeredWave: boolean
    neighbors: number[]
}

// ============================================================================
// SVG SECURITY: FRAMER ASSET URL VALIDATION & STRICT ALLOWLIST SANITIZER
// ============================================================================
const SVG_NS = "http://www.w3.org/2000/svg"
const MAX_SVG_BYTES = 512 * 1024

const ALLOWED_SVG_TAGS: Record<string, string> = {
    svg: "svg",
    g: "g",
    path: "path",
    circle: "circle",
    ellipse: "ellipse",
    rect: "rect",
    line: "line",
    polyline: "polyline",
    polygon: "polygon",
    defs: "defs",
    lineargradient: "linearGradient",
    radialgradient: "radialGradient",
    stop: "stop",
    clippath: "clipPath",
    mask: "mask",
    symbol: "symbol",
}

const ALLOWED_SVG_ATTRS: Record<string, string> = {
    viewbox: "viewBox",
    preserveaspectratio: "preserveAspectRatio",
    width: "width",
    height: "height",
    id: "id",
    d: "d",
    cx: "cx",
    cy: "cy",
    r: "r",
    rx: "rx",
    ry: "ry",
    x: "x",
    y: "y",
    x1: "x1",
    y1: "y1",
    x2: "x2",
    y2: "y2",
    fx: "fx",
    fy: "fy",
    points: "points",
    transform: "transform",
    fill: "fill",
    "fill-rule": "fill-rule",
    "fill-opacity": "fill-opacity",
    stroke: "stroke",
    "stroke-width": "stroke-width",
    "stroke-linecap": "stroke-linecap",
    "stroke-linejoin": "stroke-linejoin",
    "stroke-miterlimit": "stroke-miterlimit",
    "stroke-dasharray": "stroke-dasharray",
    "stroke-dashoffset": "stroke-dashoffset",
    "stroke-opacity": "stroke-opacity",
    opacity: "opacity",
    color: "color",
    "stop-color": "stop-color",
    "stop-opacity": "stop-opacity",
    offset: "offset",
    gradientunits: "gradientUnits",
    gradienttransform: "gradientTransform",
    spreadmethod: "spreadMethod",
    "clip-path": "clip-path",
    "clip-rule": "clip-rule",
    clippathunits: "clipPathUnits",
    mask: "mask",
    maskunits: "maskUnits",
    maskcontentunits: "maskContentUnits",
    display: "display",
    visibility: "visibility",
}

const ALLOWED_INLINE_STYLE_PROPS = new Set([
    "fill",
    "fill-rule",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-opacity",
    "opacity",
    "color",
    "stop-color",
    "stop-opacity",
    "display",
    "visibility",
    "clip-rule",
])

function isAllowedFramerAssetUrl(rawUrl: string): boolean {
    if (!rawUrl || typeof rawUrl !== "string") return false
    const trimmed = rawUrl.trim()
    if (!trimmed) return false

    try {
        const baseOrigin =
            typeof window !== "undefined" && window.location?.origin
                ? window.location.origin
                : "https://framer.com"
        const parsed = new URL(trimmed, baseOrigin)

        if (parsed.username || parsed.password) return false

        const isHttps = parsed.protocol === "https:"
        const isLocalDev =
            parsed.protocol === "http:" &&
            (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")

        if (!isHttps && !isLocalDev) return false

        const host = parsed.hostname.toLowerCase()
        const isFramerHost =
            host === "framerusercontent.com" ||
            host.endsWith(".framerusercontent.com") ||
            host === "assets.framer.com" ||
            host.endsWith(".framer.com") ||
            host.endsWith(".framer.app") ||
            (typeof window !== "undefined" &&
                parsed.origin === window.location.origin)

        return isFramerHost
    } catch {
        return false
    }
}

function isSafeSvgAttributeValue(attrName: string, rawVal: string): boolean {
    const val = rawVal.trim()
    if (!val || val.length > 32768) return false

    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(val)) {
        return false
    }

    if (
        /javascript\s*:|vbscript\s*:|data\s*:|file\s*:|about\s*:|blob\s*:|http\s*:|https\s*:|\/\/|expression\s*\(|@import|-moz-binding|behavior\s*:/i.test(
            val
        )
    ) {
        return false
    }

    if (/url\s*\(/i.test(val)) {
        return /^url\(\s*#[a-zA-Z0-9_-]{1,64}\s*\)$/i.test(val)
    }

    if (attrName === "id") {
        return /^[a-zA-Z0-9_-]{1,64}$/.test(val)
    }

    if (attrName === "viewBox") {
        return /^\s*-?\d+(\.\d+)?([\s,]+-?\d+(\.\d+)?){3}\s*$/.test(val)
    }

    return true
}

function sanitizeSvgWithAllowlist(svgText: string): string | null {
    if (!svgText || typeof svgText !== "string") return null
    const trimmed = svgText.trim()
    if (!trimmed || trimmed.length > MAX_SVG_BYTES) return null

    // Reject XML entity declarations / DOCTYPE to prevent XXE or billion-laughs payloads
    if (/<!ENTITY|<!DOCTYPE/i.test(trimmed)) return null

    try {
        const parser = new DOMParser()
        const parsedDoc = parser.parseFromString(trimmed, "image/svg+xml")
        if (parsedDoc.querySelector("parsererror")) return null

        const sourceRoot = parsedDoc.documentElement
        if (!sourceRoot || sourceRoot.localName.toLowerCase() !== "svg") {
            return null
        }

        const cleanDoc = document.implementation.createDocument(
            SVG_NS,
            "svg",
            null
        )
        const cleanRoot = cleanDoc.documentElement

        const copyAllowedAttributes = (srcEl: Element, destEl: Element) => {
            for (let i = 0; i < srcEl.attributes.length; i++) {
                const attr = srcEl.attributes[i]
                const rawName = (attr.localName || attr.name).toLowerCase()

                if (rawName.startsWith("on") || rawName.startsWith("xmlns")) {
                    continue
                }

                if (rawName === "style") {
                    const declarations = attr.value.split(";")
                    for (let d = 0; d < declarations.length; d++) {
                        const pair = declarations[d].split(":")
                        if (pair.length !== 2) continue
                        const propName = pair[0].trim().toLowerCase()
                        const propVal = pair[1].trim()
                        if (
                            ALLOWED_INLINE_STYLE_PROPS.has(propName) &&
                            isSafeSvgAttributeValue(propName, propVal) &&
                            !destEl.hasAttribute(propName)
                        ) {
                            destEl.setAttribute(propName, propVal)
                        }
                    }
                    continue
                }

                const canonicalAttr = ALLOWED_SVG_ATTRS[rawName]
                if (!canonicalAttr) continue

                if (isSafeSvgAttributeValue(canonicalAttr, attr.value)) {
                    destEl.setAttribute(canonicalAttr, attr.value.trim())
                }
            }
        }

        const sanitizeNodeRecursive = (
            srcNode: Element,
            destParent: Element,
            depth: number
        ) => {
            if (depth > 32) return
            const children = srcNode.children
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                const tagKey = (child.localName || child.tagName).toLowerCase()
                const canonicalTag = ALLOWED_SVG_TAGS[tagKey]
                if (!canonicalTag || canonicalTag === "svg") continue

                const cleanChild = cleanDoc.createElementNS(
                    SVG_NS,
                    canonicalTag
                )
                copyAllowedAttributes(child, cleanChild)
                sanitizeNodeRecursive(child, cleanChild, depth + 1)
                destParent.appendChild(cleanChild)
            }
        }

        copyAllowedAttributes(sourceRoot, cleanRoot)
        cleanRoot.setAttribute("xmlns", SVG_NS)

        if (!cleanRoot.getAttribute("width")) {
            cleanRoot.setAttribute("width", "512")
        }
        if (!cleanRoot.getAttribute("height")) {
            cleanRoot.setAttribute("height", "512")
        }

        sanitizeNodeRecursive(sourceRoot, cleanRoot, 0)

        return new XMLSerializer().serializeToString(cleanRoot)
    } catch {
        return null
    }
}

// ============================================================================
// SVG RASTERIZATION & MEDIAL-AXIS DISTANCE FIELD ENGINE
// ============================================================================
async function rasterizeSvgToGrid(
    svgFile: string,
    svgCode: string,
    presetShape: string,
    gridSize = 256
): Promise<{
    mask: Uint8Array
    distField: Float32Array
    gradX: Float32Array
    gradY: Float32Array
    colors: Uint8ClampedArray
    maxDist: number
    centerX: number
    centerY: number
    span: number
}> {
    const canvas = document.createElement("canvas")
    canvas.width = gridSize
    canvas.height = gridSize
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    ctx.clearRect(0, 0, gridSize, gridSize)

    let loaded = false

    const drawImageCentered = (img: HTMLImageElement) => {
        const pad = gridSize * 0.08
        const avail = gridSize - pad * 2
        const iw = img.naturalWidth || img.width || 512
        const ih = img.naturalHeight || img.height || 512
        const scale = Math.min(avail / iw, avail / ih)
        const dw = iw * scale
        const dh = ih * scale
        const dx = (gridSize - dw) * 0.5
        const dy = (gridSize - dh) * 0.5
        ctx.drawImage(img, dx, dy, dw, dh)
    }

    const loadFromSvgString = (rawSvg: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const sanitized = sanitizeSvgWithAllowlist(rawSvg)
            if (!sanitized) {
                resolve(false)
                return
            }
            const blob = new Blob([sanitized], {
                type: "image/svg+xml;charset=utf-8",
            })
            const url = URL.createObjectURL(blob)
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                drawImageCentered(img)
                URL.revokeObjectURL(url)
                resolve(true)
            }
            img.onerror = () => {
                URL.revokeObjectURL(url)
                resolve(false)
            }
            img.src = url
        })
    }

    const loadFromUrl = async (url: string): Promise<boolean> => {
        if (!isAllowedFramerAssetUrl(url)) {
            return false
        }
        try {
            const resp = await fetch(url, {
                method: "GET",
                credentials: "omit",
                mode: "cors",
            })
            if (!resp.ok) return false
            const text = await resp.text()
            if (text.length > MAX_SVG_BYTES || !text.includes("<svg")) {
                return false
            }
            return await loadFromSvgString(text)
        } catch {
            return false
        }
    }

    if (svgFile && svgFile.trim().length > 0) {
        loaded = await loadFromUrl(svgFile.trim())
    }
    if (!loaded && svgCode && svgCode.trim().includes("<svg")) {
        loaded = await loadFromSvgString(svgCode.trim())
    }
    if (!loaded) {
        await loadFromSvgString(getPresetSvgString(presetShape))
    }

    const imgData = ctx.getImageData(0, 0, gridSize, gridSize)
    const data = imgData.data
    const total = gridSize * gridSize
    const mask = new Uint8Array(total)

    let opaqueCount = 0
    for (let i = 0; i < total; i++) {
        if (data[i * 4 + 3] > 42) {
            mask[i] = 1
            opaqueCount++
        }
    }

    // Handle SVGs that include a full-bleed background rectangle
    if (opaqueCount > total * 0.92) {
        const bgR = data[0]
        const bgG = data[1]
        const bgB = data[2]
        opaqueCount = 0
        for (let i = 0; i < total; i++) {
            const idx = i * 4
            const diff =
                Math.abs(data[idx] - bgR) +
                Math.abs(data[idx + 1] - bgG) +
                Math.abs(data[idx + 2] - bgB)
            if (diff > 36) {
                mask[i] = 1
                opaqueCount++
            } else {
                mask[i] = 0
            }
        }
    }

    if (opaqueCount < 20) {
        ctx.clearRect(0, 0, gridSize, gridSize)
        await loadFromSvgString(getPresetSvgString("heart"))
        const fallbackData = ctx.getImageData(0, 0, gridSize, gridSize).data
        for (let i = 0; i < total; i++) {
            mask[i] = fallbackData[i * 4 + 3] > 42 ? 1 : 0
        }
    }

    // Chamfer Euclidean Distance Transform
    const distField = new Float32Array(total)
    const INF = 1e6
    for (let i = 0; i < total; i++) {
        distField[i] = mask[i] ? INF : 0
    }

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const idx = y * gridSize + x
            if (!mask[idx]) continue
            let d = distField[idx]
            if (x > 0) d = Math.min(d, distField[idx - 1] + 1)
            if (y > 0) d = Math.min(d, distField[idx - gridSize] + 1)
            if (x > 0 && y > 0)
                d = Math.min(d, distField[idx - gridSize - 1] + 1.4142)
            if (x < gridSize - 1 && y > 0)
                d = Math.min(d, distField[idx - gridSize + 1] + 1.4142)
            distField[idx] = d
        }
    }

    let maxDist = 1
    let minX = gridSize
    let maxX = 0
    let minY = gridSize
    let maxY = 0

    for (let y = gridSize - 1; y >= 0; y--) {
        for (let x = gridSize - 1; x >= 0; x--) {
            const idx = y * gridSize + x
            if (!mask[idx]) continue
            let d = distField[idx]
            if (x < gridSize - 1) d = Math.min(d, distField[idx + 1] + 1)
            if (y < gridSize - 1) d = Math.min(d, distField[idx + gridSize] + 1)
            if (x < gridSize - 1 && y < gridSize - 1)
                d = Math.min(d, distField[idx + gridSize + 1] + 1.4142)
            if (x > 0 && y < gridSize - 1)
                d = Math.min(d, distField[idx + gridSize - 1] + 1.4142)
            distField[idx] = d
            if (d > maxDist) maxDist = d

            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
    }

    // Compute 2D outward boundary gradient (pointing from medial ridge toward nearest edge)
    const gradX = new Float32Array(total)
    const gradY = new Float32Array(total)
    for (let y = 1; y < gridSize - 1; y++) {
        for (let x = 1; x < gridSize - 1; x++) {
            const idx = y * gridSize + x
            if (!mask[idx]) continue
            // Gradient of distance field points INWARD; negate it so it points OUTWARD
            const gx = -(distField[idx + 1] - distField[idx - 1]) * 0.5
            const gy =
                -(distField[idx + gridSize] - distField[idx - gridSize]) * 0.5
            const len = Math.sqrt(gx * gx + gy * gy)
            if (len > 0.0001) {
                gradX[idx] = gx / len
                gradY[idx] = gy / len
            }
        }
    }

    const centerX = (minX + maxX) * 0.5
    const centerY = (minY + maxY) * 0.5
    const span = Math.max(maxX - minX, maxY - minY, 32)

    return {
        mask,
        distField,
        gradX,
        gradY,
        colors: data,
        maxDist,
        centerX,
        centerY,
        span,
    }
}

// ============================================================================
// VOLUMETRIC SPHERE PACKING WITH SILHOUETTE CLAMPING & CREVICE NESTLING
// ============================================================================
function packVolumetricSpheres(
    grid: {
        mask: Uint8Array
        distField: Float32Array
        gradX: Float32Array
        gradY: Float32Array
        colors: Uint8ClampedArray
        maxDist: number
        centerX: number
        centerY: number
        span: number
    },
    gridSize: number,
    options: {
        density: number
        minSphereSize: number
        maxSphereSize: number
        depthThickness: number
        useSvgColors: boolean
        palette: string[]
        growthStyle: string
    }
): PackedSphere[] {
    const rand = createSeededRandom(77319)
    const worldScale = 8.4 / grid.span

    const insideIndices: number[] = []
    for (let i = 0; i < grid.mask.length; i++) {
        if (grid.mask[i]) insideIndices.push(i)
    }
    if (insideIndices.length === 0) return []

    const paletteColors = options.palette.map((hex) => new THREE.Color(hex))
    const minScale = Math.max(0.25, options.minSphereSize / 100)
    const maxScale = Math.max(minScale + 0.1, options.maxSphereSize / 100)
    const depthMult = Math.max(0.25, options.depthThickness / 100)
    const densityFactor = Math.max(0.25, options.density / 100)

    // Calibrated radii so spheres respect thin SVG features while creating rich multi-scale clusters
    const maxTubeWorldRadius = Math.min(grid.maxDist * worldScale, 0.92)
    const rHero = Math.min(0.42 * maxScale, maxTubeWorldRadius * 0.86)
    const rLarge = Math.min(0.32 * maxScale, maxTubeWorldRadius * 0.72)
    const rMed = 0.22 * ((minScale + maxScale) * 0.5)
    const rSmall = 0.145 * minScale
    const rMicro = 0.095 * minScale

    const maxHalfDepth =
        Math.min(grid.maxDist * worldScale * 0.95, 1.05) * depthMult

    const cellSize = Math.max(rHero * 2.1, 0.38)
    const spatialMap = new Map<string, number[]>()
    const spheres: PackedSphere[] = []

    const getCellKey = (x: number, y: number, z: number) =>
        `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)},${Math.floor(z / cellSize)}`

    const insertToHash = (idx: number, x: number, y: number, z: number) => {
        const key = getCellKey(x, y, z)
        let bucket = spatialMap.get(key)
        if (!bucket) {
            bucket = []
            spatialMap.set(key, bucket)
        }
        bucket.push(idx)
    }

    const evaluatePlacement = (
        x: number,
        y: number,
        z: number,
        r: number,
        overlapAllowance: number,
        requireTouch: boolean
    ): boolean => {
        const cx = Math.floor(x / cellSize)
        const cy = Math.floor(y / cellSize)
        const cz = Math.floor(z / cellSize)
        let touchesExisting = !requireTouch

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const bucket = spatialMap.get(
                        `${cx + dx},${cy + dy},${cz + dz}`
                    )
                    if (!bucket) continue
                    for (let i = 0; i < bucket.length; i++) {
                        const other = spheres[bucket[i]]
                        const ddx = x - other.tx
                        const ddy = y - other.ty
                        const ddz = z - other.tz
                        const distSq = ddx * ddx + ddy * ddy + ddz * ddz
                        const sumR = r + other.r
                        const minAllowed = sumR * overlapAllowance
                        if (distSq < minAllowed * minAllowed) {
                            return false
                        }
                        if (
                            requireTouch &&
                            distSq <= sumR * 1.16 * (sumR * 1.16)
                        ) {
                            touchesExisting = true
                        }
                    }
                }
            }
        }
        return touchesExisting
    }

    const pickColor = (pixelIdx: number): THREE.Color => {
        if (options.useSvgColors) {
            const r = grid.colors[pixelIdx * 4] / 255
            const g = grid.colors[pixelIdx * 4 + 1] / 255
            const b = grid.colors[pixelIdx * 4 + 2] / 255
            const isMono =
                (r > 0.94 && g > 0.94 && b > 0.94) ||
                (r < 0.06 && g < 0.06 && b < 0.06)
            if (!isMono) {
                const c = new THREE.Color(r, g, b)
                c.offsetHSL(
                    (rand() - 0.5) * 0.02,
                    (rand() - 0.5) * 0.05,
                    (rand() - 0.5) * 0.05
                )
                return c
            }
        }
        // Weighted selection matching the reference video's vibrant berry/magenta/orchid/lilac/plum balance
        const weights = [0.31, 0.25, 0.22, 0.12, 0.1]
        const rv = rand()
        let acc = 0
        let chosen = paletteColors[0]
        for (let i = 0; i < paletteColors.length; i++) {
            acc += weights[i] ?? 0.2
            if (rv <= acc) {
                chosen = paletteColors[i]
                break
            }
        }
        const col = chosen.clone()
        col.offsetHSL(
            (rand() - 0.5) * 0.018,
            (rand() - 0.5) * 0.04,
            (rand() - 0.5) * 0.035
        )
        return col
    }

    // 5-tier volumetric packing: Core Hero -> Large Body -> Medium Contour -> Small Crevice -> Micro Surface
    const tiers = [
        {
            rMin: rLarge,
            rMax: rHero,
            attempts: Math.floor(3200 * densityFactor),
            minEdgeRatio: 0.45,
            shellBias: 0.2,
            overlap: 0.92,
            requireTouch: false,
            edgeOverhang: 0.04,
        },
        {
            rMin: rMed * 0.95,
            rMax: rLarge * 0.95,
            attempts: Math.floor(5500 * densityFactor),
            minEdgeRatio: 0.24,
            shellBias: 0.48,
            overlap: 0.91,
            requireTouch: false,
            edgeOverhang: 0.05,
        },
        {
            rMin: rSmall * 1.05,
            rMax: rMed * 0.92,
            attempts: Math.floor(9500 * densityFactor),
            minEdgeRatio: 0.06,
            shellBias: 0.72,
            overlap: 0.9,
            requireTouch: spheres.length > 20,
            edgeOverhang: 0.045,
        },
        {
            rMin: rMicro * 1.15,
            rMax: rSmall * 0.98,
            attempts: Math.floor(14000 * densityFactor),
            minEdgeRatio: 0.0,
            shellBias: 0.88,
            overlap: 0.89,
            requireTouch: true,
            edgeOverhang: 0.035,
        },
        {
            rMin: rMicro * 0.85,
            rMax: rMicro * 1.15,
            attempts: Math.floor(16000 * densityFactor),
            minEdgeRatio: 0.0,
            shellBias: 0.95,
            overlap: 0.88,
            requireTouch: true,
            edgeOverhang: 0.025,
        },
    ]

    const maxTotalSpheres = Math.floor(1750 * densityFactor)

    for (let t = 0; t < tiers.length; t++) {
        const tier = tiers[t]
        for (let a = 0; a < tier.attempts; a++) {
            if (spheres.length >= maxTotalSpheres) break

            const pIdx =
                insideIndices[Math.floor(rand() * insideIndices.length)]
            const d = grid.distField[pIdx]
            const distToEdgeWorld = d * worldScale
            const normD = Math.min(1, d / Math.max(1, grid.maxDist * 0.78))

            if (normD < tier.minEdgeRatio && rand() > 0.15) continue

            // Clamp sphere radius so it never spills outside the SVG boundary
            const maxAllowedR = Math.min(
                tier.rMax,
                distToEdgeWorld + tier.edgeOverhang
            )
            if (maxAllowedR < tier.rMin * 0.85) continue

            const r =
                tier.rMin + rand() * Math.max(0.001, maxAllowedR - tier.rMin)

            const px = (pIdx % gridSize) + (rand() - 0.5) * 0.75
            const py = Math.floor(pIdx / gridSize) + (rand() - 0.5) * 0.75

            const wx = (px - grid.centerX) * worldScale
            const wy = -(py - grid.centerY) * worldScale

            // Rounded 3D tubular cross-section profile
            const localMaxZ = Math.max(
                0,
                Math.sqrt(Math.max(0.02, normD)) * maxHalfDepth - r * 0.35
            )
            const zDir = rand() < 0.5 ? 1 : -1
            const zMag =
                rand() < tier.shellBias
                    ? Math.pow(rand(), 0.32) * localMaxZ
                    : rand() * localMaxZ
            const wz = zDir * zMag

            const mustTouch = tier.requireTouch && spheres.length > 12
            if (evaluatePlacement(wx, wy, wz, r, tier.overlap, mustTouch)) {
                // Outward normal from medial core through this sphere
                let ox = grid.gradX[pIdx] * (1 - normD * 0.5)
                let oy = -grid.gradY[pIdx] * (1 - normD * 0.5)
                let oz =
                    localMaxZ > 0.01
                        ? (wz / (localMaxZ + 0.05)) * 0.85
                        : zDir * 0.5
                const oLen = Math.sqrt(ox * ox + oy * oy + oz * oz)
                if (oLen > 0.001) {
                    ox /= oLen
                    oy /= oLen
                    oz /= oLen
                } else {
                    ox = 0
                    oy = 0
                    oz = 1
                }

                const idx = spheres.length
                spheres.push({
                    tx: wx,
                    ty: wy,
                    tz: wz,
                    ox: 0,
                    oy: 0,
                    oz: 0,
                    vx: 0,
                    vy: 0,
                    vz: 0,
                    r,
                    scaleOffset: 0,
                    scaleVel: 0,
                    color: pickColor(pIdx),
                    ao: 1,
                    outX: ox,
                    outY: oy,
                    outZ: oz,
                    order: 0,
                    phase: rand() * Math.PI * 2,
                    freq: 1.6 + rand() * 1.2,
                    spawnOriginX: wx,
                    spawnOriginY: wy,
                    spawnOriginZ: wz,
                    hasTriggeredWave: false,
                    neighbors: [],
                })
                insertToHash(idx, wx, wy, wz)
            }
        }
    }

    // Build neighbor graph + bake 3D crevice ambient occlusion & refined outward normals
    for (let i = 0; i < spheres.length; i++) {
        const s = spheres[i]
        const cx = Math.floor(s.tx / cellSize)
        const cy = Math.floor(s.ty / cellSize)
        const cz = Math.floor(s.tz / cellSize)
        let occlusion = 0
        let awayX = s.outX * 0.6
        let awayY = s.outY * 0.6
        let awayZ = s.outZ * 0.6

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const bucket = spatialMap.get(
                        `${cx + dx},${cy + dy},${cz + dz}`
                    )
                    if (!bucket) continue
                    for (let k = 0; k < bucket.length; k++) {
                        const j = bucket[k]
                        if (i === j) continue
                        const other = spheres[j]
                        const ddx = other.tx - s.tx
                        const ddy = other.ty - s.ty
                        const ddz = other.tz - s.tz
                        const dist = Math.sqrt(
                            ddx * ddx + ddy * ddy + ddz * ddz
                        )
                        const touchDist = (s.r + other.r) * 1.45

                        if (dist < touchDist && dist > 0.0001) {
                            if (s.neighbors.length < 10) {
                                s.neighbors.push(j)
                            }
                            const weight = 1 - dist / touchDist
                            const sizeRatio = Math.min(1.5, other.r / s.r)
                            const frontBias = ddz > 0 ? 1.3 : 0.75
                            occlusion += weight * 0.082 * frontBias * sizeRatio

                            // Accumulate vector pointing away from larger/surrounding neighbors
                            awayX -= (ddx / dist) * weight * sizeRatio
                            awayY -= (ddy / dist) * weight * sizeRatio
                            awayZ -= (ddz / dist) * weight * sizeRatio
                        }
                    }
                }
            }
        }

        const aLen = Math.sqrt(awayX * awayX + awayY * awayY + awayZ * awayZ)
        if (aLen > 0.001) {
            s.outX = awayX / aLen
            s.outY = awayY / aLen
            s.outZ = awayZ / aLen
        }
        s.ao = Math.max(0.58, Math.min(1.04, 1.03 - occlusion))
    }

    // Compute Growth Wave Order & Core-to-Shell Spawn Origins (matching Reference Video)
    let minOrder = Infinity
    let maxOrder = -Infinity

    for (let i = 0; i < spheres.length; i++) {
        const s = spheres[i]
        const jitter = (rand() - 0.5) * 0.028
        // Core spheres trigger slightly earlier than outer surface/small spheres
        const radialShellLag =
            (1 - Math.min(1, s.r / rHero)) * 0.038 +
            Math.abs(s.tz / Math.max(0.1, maxHalfDepth)) * 0.025
        let rawOrder = 0

        switch (options.growthStyle) {
            case "counterClockwise": {
                let angle = Math.atan2(-s.tx, s.ty) - 0.25
                if (angle < 0) angle += Math.PI * 2
                rawOrder = angle / (Math.PI * 2) + radialShellLag + jitter
                break
            }
            case "bottomUp": {
                rawOrder = s.ty * 0.15 + radialShellLag + jitter
                break
            }
            case "centerOut": {
                rawOrder =
                    Math.sqrt(s.tx * s.tx + s.ty * s.ty + s.tz * s.tz) * 0.2 +
                    radialShellLag +
                    jitter
                break
            }
            case "leftToRight": {
                rawOrder = s.tx * 0.15 + radialShellLag + jitter
                break
            }
            case "randomPop": {
                rawOrder = rand()
                break
            }
            case "clockwise":
            default: {
                // Video reference: starts at top-right (~18 deg clockwise from top center)
                // and sweeps smoothly clockwise around the perimeter
                let angle = Math.atan2(s.tx, s.ty) - 0.22
                if (angle < 0) angle += Math.PI * 2
                rawOrder = angle / (Math.PI * 2) + radialShellLag + jitter
                break
            }
        }

        s.order = rawOrder
        if (rawOrder < minOrder) minOrder = rawOrder
        if (rawOrder > maxOrder) maxOrder = rawOrder
    }

    const orderSpan = Math.max(0.0001, maxOrder - minOrder)
    for (let i = 0; i < spheres.length; i++) {
        const s = spheres[i]
        s.order = Math.max(0, Math.min(1, (s.order - minOrder) / orderSpan))

        // Compute tangent direction along the clockwise sweep so balloons emerge from the growing tip
        const radLen = Math.max(0.2, Math.sqrt(s.tx * s.tx + s.ty * s.ty))
        const tangX = s.ty / radLen
        const tangY = -s.tx / radLen

        // Balloons originate from inside the local tube core and slightly upstream along the path
        const pullIn = 0.32 + s.r * 0.65
        s.spawnOriginX = s.tx - s.outX * pullIn - tangX * 0.35
        s.spawnOriginY = s.ty - s.outY * pullIn - tangY * 0.35
        s.spawnOriginZ = s.tz * 0.22
    }

    return spheres
}

// ============================================================================
// PROCEDURAL SKY & SOFT CIRRUS CLOUDS SHADER (MATCHING REFERENCE VIDEO)
// ============================================================================
function createSkyBackdropMesh(
    topColor: string,
    bottomColor: string,
    cloudOpacity: number
) {
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        uniforms: {
            uTopColor: { value: new THREE.Color(topColor) },
            uBottomColor: { value: new THREE.Color(bottomColor) },
            uCloudOpacity: { value: cloudOpacity / 100 },
            uTime: { value: 0 },
            uAspect: { value: 1 },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position.xy, 0.999, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform vec3 uTopColor;
            uniform vec3 uBottomColor;
            uniform float uCloudOpacity;
            uniform float uTime;
            uniform float uAspect;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                    u.y
                );
            }

            float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
                for (int i = 0; i < 5; i++) {
                    v += a * noise(p);
                    p = rot * p * 2.05 + vec2(0.17, 0.31);
                    a *= 0.5;
                }
                return v;
            }

            void main() {
                float grad = smoothstep(0.0, 1.0, pow(clamp(vUv.y, 0.0, 1.0), 0.72));
                vec3 sky = mix(uBottomColor, uTopColor, grad);

                // Warm upper-left sun scatter matching the reference video
                vec2 sunPos = vec2(0.12, 0.84);
                float sunDist = length((vUv - sunPos) * vec2(uAspect, 1.0));
                sky += vec3(0.08, 0.11, 0.15) * exp(-sunDist * 2.1);

                // Wispy cirrus clouds in lower-left and horizon
                vec2 uvCloud = vec2(vUv.x * uAspect * 1.9 + uTime * 0.014, vUv.y * 3.8);
                float c1 = fbm(uvCloud);
                float c2 = fbm(uvCloud * 2.1 - vec2(uTime * 0.01, 0.4));
                float cloud = c1 * 0.62 + c2 * 0.38;

                float horizonBand = smoothstep(0.66, 0.04, vUv.y);
                float leftWisp = exp(-length((vUv - vec2(0.18, 0.34)) * vec2(1.4, 2.6)) * 2.4) * 0.55;
                float cloudMask = (smoothstep(0.48, 0.78, cloud) * horizonBand + leftWisp * smoothstep(0.42, 0.72, c1));

                vec3 cloudCol = mix(uBottomColor * 1.08, vec3(0.95, 0.98, 1.0), 0.82);
                vec3 finalCol = mix(sky, cloudCol, clamp(cloudMask, 0.0, 1.0) * uCloudOpacity * 0.68);

                gl_FragColor = vec4(finalCol, 1.0);
            }
        `,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    mesh.renderOrder = -100
    return { mesh, geometry, material }
}

// ============================================================================
// PROCEDURAL HDR-STYLE ENVIRONMENT MAP FOR REALISTIC LATEX BALLOONS
// ============================================================================
function createStudioEnvironment(renderer: THREE.WebGLRenderer): {
    pmremGenerator: THREE.PMREMGenerator
    renderTarget: THREE.WebGLRenderTarget
} {
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    const envScene = new THREE.Scene()
    const envGeo = new THREE.SphereGeometry(10, 32, 16)
    const envMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec3 dir = normalize(vWorldPosition);
                float y = dir.y * 0.5 + 0.5;
                vec3 ground = vec3(0.45, 0.38, 0.52);
                vec3 horizon = vec3(0.62, 0.80, 0.96);
                vec3 zenith = vec3(0.18, 0.46, 0.84);
                vec3 sky = y < 0.5
                    ? mix(ground, horizon, y * 2.0)
                    : mix(horizon, zenith, (y - 0.5) * 2.0);
                vec3 sunDir = normalize(vec3(-0.62, 0.72, 0.68));
                float sun = pow(max(0.0, dot(dir, sunDir)), 28.0);
                vec3 col = sky + vec3(1.5, 1.42, 1.35) * sun * 2.1;
                gl_FragColor = vec4(col, 1.0);
            }
        `,
    })
    const envMesh = new THREE.Mesh(envGeo, envMat)
    envScene.add(envMesh)

    const renderTarget = pmremGenerator.fromScene(envScene, 0.04)
    envGeo.dispose()
    envMat.dispose()
    envScene.clear()

    return { pmremGenerator, renderTarget }
}

// ============================================================================
// MAIN FRAMER COMPONENT (RULE 15: @framerDisableUnlink)
// ============================================================================
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerDisableUnlink
 */
export default function SVGBalloonLogo(incomingProps: Record<string, any>) {
    // ========================================================================
    // RULE 9 STEP 1: INTERCEPT & FLATTEN GROUPED PROPS
    // ========================================================================
    const props = {
        ...incomingProps,
        ...(incomingProps.svgSource || {}),
        ...(incomingProps.balloonStyle || {}),
        ...(incomingProps.animation || {}),
        ...(incomingProps.interaction || {}),
        ...(incomingProps.environment || {}),
    }

    const mountRef = useRef<HTMLDivElement | null>(null)
    const isIntersectingRef = useRef<boolean>(true)
    const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const wasDraggedRef = useRef<boolean>(false)

    // ========================================================================
    // RULE 12: SMART CAMERA STATIC RENDERER CHECK
    // ========================================================================
    const isStatic = useIsStaticRenderer()
    const shouldAnimate =
        !isStatic && (props.livePreview ?? props.editorPreview ?? true)

    const normalizedLink = normalizeUrl(props.linkUrl)

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        // Top-level scoped references for strict cleanup (Rule 2)
        let frameId: number | null = null
        let resizeObserver: ResizeObserver | null = null
        let intersectionObserver: IntersectionObserver | null = null
        let isDisposed = false

        const geometriesToDispose: THREE.BufferGeometry[] = []
        const materialsToDispose: THREE.Material[] = []
        const texturesToDispose: THREE.Texture[] = []
        const renderTargetsToDispose: THREE.WebGLRenderTarget[] = []
        let pmremGenToDispose: THREE.PMREMGenerator | null = null

        // Scene, Camera & Renderer Setup
        const scene = new THREE.Scene()
        const width = Math.max(container.clientWidth, 100)
        const height = Math.max(container.clientHeight, 100)

        const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100)
        camera.position.set(0, 0, 14.5)

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.15
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        renderer.domElement.style.display = "block"
        container.appendChild(renderer.domElement)

        // Procedural Studio Environment Map
        const { pmremGenerator, renderTarget: envRT } =
            createStudioEnvironment(renderer)
        pmremGenToDispose = pmremGenerator
        renderTargetsToDispose.push(envRT)
        scene.environment = envRT.texture

        // Background Setup
        const bgMode = props.backgroundMode || "sky"
        const skyBackdrop = createSkyBackdropMesh(
            props.skyTopColor || "#2161a8",
            props.skyBottomColor || "#66b3e6",
            props.cloudOpacity ?? 70
        )
        geometriesToDispose.push(skyBackdrop.geometry)
        materialsToDispose.push(skyBackdrop.material)

        if (bgMode === "sky") {
            scene.add(skyBackdrop.mesh)
            scene.background = null
        } else if (bgMode === "solid") {
            scene.background = new THREE.Color(props.skyTopColor || "#2161a8")
        } else {
            scene.background = null
        }

        // Studio + Outdoor Sunlight Lighting matching Reference Video
        const lightMult = (props.lightIntensity ?? 100) / 100

        const hemiLight = new THREE.HemisphereLight(
            0xa8dcff,
            0xc882b5,
            1.05 * lightMult
        )
        hemiLight.position.set(0, 10, 0)
        scene.add(hemiLight)

        const sunLight = new THREE.DirectionalLight(0xfff8f2, 2.35 * lightMult)
        sunLight.position.set(-7.5, 9.2, 8.8)
        sunLight.castShadow = true
        sunLight.shadow.mapSize.width = 2048
        sunLight.shadow.mapSize.height = 2048
        sunLight.shadow.camera.near = 2
        sunLight.shadow.camera.far = 26
        const frustum = 6.8
        sunLight.shadow.camera.left = -frustum
        sunLight.shadow.camera.right = frustum
        sunLight.shadow.camera.top = frustum
        sunLight.shadow.camera.bottom = -frustum
        sunLight.shadow.bias = -0.0005
        sunLight.shadow.normalBias = 0.022
        scene.add(sunLight)

        const rimLight = new THREE.DirectionalLight(0xb8e0ff, 0.95 * lightMult)
        rimLight.position.set(7.5, -3.5, -6.5)
        scene.add(rimLight)

        const fillLight = new THREE.DirectionalLight(0xffbfe0, 0.55 * lightMult)
        fillLight.position.set(2.0, -7.5, 6.0)
        scene.add(fillLight)

        // Root Group for the SVG Balloon Sculpture
        const sculptureGroup = new THREE.Group()
        const baseScale = (props.logoScale ?? 100) / 100
        sculptureGroup.scale.setScalar(baseScale)

        // Default heart preset uses the video's -10 deg tilt; custom uploaded SVGs stay upright unless tilted
        const hasCustomSvg =
            Boolean(props.svgFile && props.svgFile.trim()) ||
            Boolean(props.svgCode && props.svgCode.trim())
        const effectiveTiltDeg =
            props.logoTilt !== undefined
                ? props.logoTilt
                : hasCustomSvg
                  ? 0
                  : -10
        const baseTiltRad = THREE.MathUtils.degToRad(effectiveTiltDeg)
        sculptureGroup.rotation.z = baseTiltRad
        scene.add(sculptureGroup)

        // High-detail Sphere Geometry with custom per-instance crevice AO & SSS shader
        const sphereGeo = new THREE.SphereGeometry(1, 32, 24)
        geometriesToDispose.push(sphereGeo)

        const sphereMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: Math.max(
                0.08,
                Math.min(0.95, (props.roughness ?? 32) / 100)
            ),
            metalness: 0.01,
            clearcoat: Math.max(0, Math.min(1, (props.glossiness ?? 30) / 100)),
            clearcoatRoughness: 0.28,
            envMapIntensity: 0.85,
        })

        // Inject Per-Pixel Directional Crevice AO + Subsurface Scattering + Fresnel Rim
        sphereMat.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader
                .replace(
                    "#include <common>",
                    `#include <common>
                    attribute vec4 aBalloonData;
                    varying vec3 vLocalSphereNormal;
                    varying vec4 vBalloonData;
                    varying vec3 vWorldPos;`
                )
                .replace(
                    "#include <beginnormal_vertex>",
                    `#include <beginnormal_vertex>
                    vLocalSphereNormal = normalize(position);
                    vBalloonData = aBalloonData;`
                )
                .replace(
                    "#include <worldpos_vertex>",
                    `#include <worldpos_vertex>
                    vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;`
                )

            shader.fragmentShader = shader.fragmentShader
                .replace(
                    "#include <common>",
                    `#include <common>
                    varying vec3 vLocalSphereNormal;
                    varying vec4 vBalloonData;
                    varying vec3 vWorldPos;`
                )
                .replace(
                    "#include <dithering_fragment>",
                    `
                    // 1. Directional Crevice Contact AO (darkens inward-facing hemisphere tucked into the cluster)
                    vec3 outDir = normalize(vBalloonData.xyz + vec3(0.0, 0.0, 0.0001));
                    float alignment = dot(normalize(vLocalSphereNormal), outDir);
                    float directionalAO = smoothstep(-0.85, 0.55, alignment);
                    float combinedAO = mix(0.46, 1.0, directionalAO) * vBalloonData.w;

                    // Rich plum/berry crevice shadow color instead of muddy grey
                    vec3 creviceTint = mix(vec3(0.32, 0.12, 0.45), vec3(1.0), clamp(combinedAO, 0.0, 1.0));
                    gl_FragColor.rgb *= mix(vec3(combinedAO), creviceTint, 0.42);

                    // 2. Latex Subsurface Scattering (warm wrap glow across sunlight terminator)
                    vec3 sunDirW = normalize(vec3(-0.6, 0.72, 0.68));
                    vec3 nW = normalize(vNormal);
                    float ndl = dot(nW, sunDirW);
                    float sssWrap = smoothstep(-0.55, 0.35, ndl) * (1.0 - smoothstep(0.1, 0.85, ndl));
                    gl_FragColor.rgb += diffuseColor.rgb * vec3(0.28, 0.09, 0.22) * sssWrap * 0.75;

                    // 3. Soft Sky Fresnel Grazing Rim
                    vec3 viewDirW = normalize(cameraPosition - vWorldPos);
                    float fresnel = pow(1.0 - max(0.0, dot(nW, viewDirW)), 3.2);
                    gl_FragColor.rgb += vec3(0.68, 0.82, 1.0) * fresnel * 0.14 * directionalAO;

                    #include <dithering_fragment>
                    `
                )
        }
        materialsToDispose.push(sphereMat)

        let instancedMesh: THREE.InstancedMesh | null = null
        let packedSpheres: PackedSphere[] = []
        const dummy = new THREE.Object3D()

        // Mutable animation & interaction state (Rule 6: Bypass React State)
        const startTime = performance.now()
        let lastFrameTime = startTime
        const pointerNDC = new THREE.Vector2(999, 999)
        const prevPointerLocal = new THREE.Vector3(999, 999, 0)
        const pointerLocal = new THREE.Vector3(999, 999, 0)
        const pointerVel = new THREE.Vector3(0, 0, 0)
        let isPointerInside = false
        let isPointerDragging = false
        let dragOrbitX = 0
        let dragOrbitY = 0
        let targetRotX = 0
        let targetRotY = 0
        let currentRotX = 0
        let currentRotY = 0

        const raycaster = new THREE.Raycaster()
        const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        const invGroupMatrix = new THREE.Matrix4()

        // Underdamped elastic spring curve for balloon inflation
        const bouncinessFactor = (props.bounciness ?? 90) / 100
        const evaluateElasticScale = (u: number): number => {
            if (u <= 0) return 0
            if (u >= 1) return 1
            const damp = 5.2 - bouncinessFactor * 1.35
            const freq = 8.2 + bouncinessFactor * 3.8
            const env = Math.exp(-damp * u)
            return Math.max(
                0,
                1 -
                    env *
                        (Math.cos(freq * u) +
                            (damp / freq) * Math.sin(freq * u) * 0.35)
            )
        }

        // Core frame update function
        const updateAndRenderScene = (now: number) => {
            if (isDisposed) return

            const dt = Math.min(
                0.04,
                Math.max(0.001, (now - lastFrameTime) / 1000)
            )
            lastFrameTime = now
            const elapsedSec = (now - startTime) / 1000

            // Update sky clouds shader
            if (bgMode === "sky") {
                skyBackdrop.material.uniforms.uTime.value = shouldAnimate
                    ? elapsedSec
                    : 2.5
                skyBackdrop.material.uniforms.uAspect.value = camera.aspect || 1
            }

            // Compute animation fill progress
            const fillDuration = Math.max(0.6, props.fillDuration ?? 3.8)
            const holdDuration = Math.max(0.5, props.holdDuration ?? 4.5)
            const loopAnim = props.loopAnimation ?? false

            let fillProgress = 1.0

            if (shouldAnimate) {
                if (loopAnim) {
                    const cycleTime = fillDuration + holdDuration
                    const tCycle = elapsedSec % cycleTime
                    if (tCycle < 0.05 && elapsedSec > 0.5) {
                        for (let i = 0; i < packedSpheres.length; i++) {
                            packedSpheres[i].hasTriggeredWave = false
                        }
                    }
                    fillProgress = Math.min(1.0, tCycle / fillDuration)
                } else {
                    fillProgress = Math.min(1.0, elapsedSec / fillDuration)
                }
            } else {
                // Rule 12: Static mode renders 100% settled state immediately
                fillProgress = 1.0
            }

            // Cinematic 3D Intro Sweep matching 00:00 -> 00:05 of the Reference Video
            const introEase = shouldAnimate
                ? Math.pow(1.0 - Math.min(1.0, fillProgress * 0.92), 2.1)
                : 0.0
            const floatAmt = shouldAnimate ? (props.floatAmount ?? 70) / 100 : 0

            const floatY = Math.sin(elapsedSec * 1.05) * 0.14 * floatAmt
            const floatX = Math.cos(elapsedSec * 0.78) * 0.08 * floatAmt
            const floatRotZ = Math.sin(elapsedSec * 0.85) * 0.028 * floatAmt
            const floatRotY = Math.cos(elapsedSec * 0.65) * 0.045 * floatAmt

            if (shouldAnimate) {
                const rotFollow = 1 - Math.exp(-8.5 * dt)
                currentRotX +=
                    (targetRotX + dragOrbitX - currentRotX) * rotFollow
                currentRotY +=
                    (targetRotY + dragOrbitY - currentRotY) * rotFollow
                if (!isPointerDragging) {
                    dragOrbitX *= Math.exp(-3.5 * dt)
                    dragOrbitY *= Math.exp(-3.5 * dt)
                }
            } else {
                currentRotX = targetRotX + dragOrbitX
                currentRotY = targetRotY + dragOrbitY
            }

            sculptureGroup.position.set(
                floatX + introEase * 0.95,
                floatY + introEase * 0.75,
                -introEase * 2.6
            )
            sculptureGroup.rotation.set(
                currentRotX + introEase * 0.18,
                currentRotY + floatRotY - introEase * 0.34,
                baseTiltRad + floatRotZ + introEase * 0.14
            )
            sculptureGroup.updateMatrixWorld()

            // Transform pointer ray into sculpture local 3D space
            const isInteractive = props.interactive ?? true
            const worldPushRadius = ((props.pushRadius ?? 105) / 100) * 2.15
            const pushStrength = ((props.pushStrength ?? 115) / 100) * 1.65

            if (isPointerInside && isInteractive) {
                raycaster.setFromCamera(pointerNDC, camera)
                const hitPoint = new THREE.Vector3()
                if (raycaster.ray.intersectPlane(interactionPlane, hitPoint)) {
                    invGroupMatrix.copy(sculptureGroup.matrixWorld).invert()
                    hitPoint.applyMatrix4(invGroupMatrix)
                    if (prevPointerLocal.x < 500) {
                        pointerVel
                            .subVectors(hitPoint, prevPointerLocal)
                            .divideScalar(Math.max(0.006, dt))
                        pointerVel.clampLength(0, 28)
                    }
                    prevPointerLocal.copy(hitPoint)
                    pointerLocal.copy(hitPoint)
                }
            } else {
                pointerVel.multiplyScalar(Math.exp(-10 * dt))
            }

            // Update all packed sphere instances
            if (instancedMesh && packedSpheres.length > 0) {
                const inflateWindow = 0.24
                const totalProgress = fillProgress * (1.0 + inflateWindow)
                const springStiffness = 46
                const springDamping = Math.exp(-4.4 * dt)
                const scaleDamping = Math.exp(-5.2 * dt)

                for (let i = 0; i < packedSpheres.length; i++) {
                    const s = packedSpheres[i]

                    let u = 1.0
                    if (shouldAnimate) {
                        u = (totalProgress - s.order) / inflateWindow
                        u = Math.max(0, Math.min(1, u))
                    }

                    if (u <= 0.001) {
                        dummy.position.set(0, 0, -999)
                        dummy.scale.setScalar(0.0001)
                        dummy.updateMatrix()
                        instancedMesh.setMatrixAt(i, dummy.matrix)
                        continue
                    }

                    // Wavefront Jostle: When a sphere pops in, it nudges already-inflated neighbors!
                    if (shouldAnimate && u > 0.08 && !s.hasTriggeredWave) {
                        s.hasTriggeredWave = true
                        for (let k = 0; k < s.neighbors.length; k++) {
                            const nIdx = s.neighbors[k]
                            const nb = packedSpheres[nIdx]
                            if (nb.order < s.order) {
                                const dx = nb.tx - s.tx
                                const dy = nb.ty - s.ty
                                const dz = nb.tz - s.tz
                                const d = Math.max(
                                    0.05,
                                    Math.sqrt(dx * dx + dy * dy + dz * dz)
                                )
                                const kick = (s.r / nb.r) * 0.95
                                nb.vx += (dx / d) * kick
                                nb.vy += (dy / d) * kick
                                nb.vz += (dz / d) * kick
                                nb.scaleVel += 0.55 * Math.min(1.2, s.r / nb.r)
                            }
                        }
                    }

                    const elasticScale = shouldAnimate
                        ? evaluateElasticScale(u)
                        : 1.0

                    // Smooth emergence from inner tube core + upstream tangent
                    const posEase = 1 - Math.pow(1 - u, 2.8)
                    const baseX =
                        s.spawnOriginX + (s.tx - s.spawnOriginX) * posEase
                    const baseY =
                        s.spawnOriginY + (s.ty - s.spawnOriginY) * posEase
                    const baseZ =
                        s.spawnOriginZ + (s.tz - s.spawnOriginZ) * posEase

                    // Continuous buoyant cluster breathing (never freezes like a statue)
                    const wavePhase =
                        elapsedSec * s.freq +
                        s.phase +
                        s.tx * 0.45 +
                        s.ty * 0.45
                    const liveX = shouldAnimate
                        ? (Math.sin(wavePhase) * 0.024 +
                              s.outX *
                                  Math.sin(elapsedSec * 1.9 + s.phase) *
                                  0.018) *
                          floatAmt
                        : 0
                    const liveY = shouldAnimate
                        ? (Math.cos(wavePhase * 0.9) * 0.028 +
                              s.outY *
                                  Math.sin(elapsedSec * 1.9 + s.phase) *
                                  0.018) *
                          floatAmt
                        : 0
                    const liveZ = shouldAnimate
                        ? Math.sin(wavePhase * 1.1) * 0.022 * floatAmt
                        : 0
                    const liveScale = shouldAnimate
                        ? Math.sin(elapsedSec * 2.4 + s.phase) *
                          0.016 *
                          floatAmt
                        : 0

                    // Interactive 3D Pointer Repulsion & Neighbor Coupling
                    if (isInteractive) {
                        const curX = baseX + s.ox
                        const curY = baseY + s.oy
                        const curZ = baseZ + s.oz

                        if (isPointerInside) {
                            const dx = curX - pointerLocal.x
                            const dy = curY - pointerLocal.y
                            const dz = curZ - pointerLocal.z
                            // Account for Z depth with slight Z compression so front and back spheres react naturally
                            const dist3D = Math.sqrt(
                                dx * dx + dy * dy + dz * dz * 0.35
                            )
                            const effRadius = worldPushRadius + s.r * 1.2

                            if (dist3D < effRadius && dist3D > 0.0001) {
                                const falloff = Math.pow(
                                    1 - dist3D / effRadius,
                                    1.5
                                )
                                const nx = dx / dist3D
                                const ny = dy / dist3D
                                const nz =
                                    s.outZ * 0.65 + (dz >= 0 ? 0.45 : -0.45)

                                if (shouldAnimate) {
                                    const force =
                                        falloff * pushStrength * 42 * dt
                                    s.vx +=
                                        (nx * 1.35 + pointerVel.x * 0.14) *
                                        force
                                    s.vy +=
                                        (ny * 1.35 + pointerVel.y * 0.14) *
                                        force
                                    s.vz += nz * force * 1.1
                                    s.scaleVel += falloff * 5.5 * dt
                                } else {
                                    // Rule 12: Direct snap displacement in static mode
                                    s.ox = nx * falloff * pushStrength * 0.65
                                    s.oy = ny * falloff * pushStrength * 0.65
                                    s.oz = nz * falloff * pushStrength * 0.45
                                }
                            }
                        } else if (!shouldAnimate) {
                            s.ox = 0
                            s.oy = 0
                            s.oz = 0
                        }

                        if (shouldAnimate) {
                            // Neighbor-to-neighbor velocity ripple coupling
                            const dispMagSq =
                                s.ox * s.ox + s.oy * s.oy + s.oz * s.oz
                            if (dispMagSq > 0.002) {
                                for (let k = 0; k < s.neighbors.length; k++) {
                                    const nb = packedSpheres[s.neighbors[k]]
                                    nb.vx += (s.ox - nb.ox) * 6.5 * dt
                                    nb.vy += (s.oy - nb.oy) * 6.5 * dt
                                    nb.vz += (s.oz - nb.oz) * 6.5 * dt
                                }
                            }

                            // Underdamped Hooke's law spring restoration
                            s.vx += -s.ox * springStiffness * dt
                            s.vy += -s.oy * springStiffness * dt
                            s.vz += -s.oz * springStiffness * dt
                            s.vx *= springDamping
                            s.vy *= springDamping
                            s.vz *= springDamping

                            s.ox += s.vx * dt
                            s.oy += s.vy * dt
                            s.oz += s.vz * dt

                            // Clamp max displacement so balloons stay cohesive
                            const maxDisp = 1.65
                            const dSq = s.ox * s.ox + s.oy * s.oy + s.oz * s.oz
                            if (dSq > maxDisp * maxDisp) {
                                const scaleBack = maxDisp / Math.sqrt(dSq)
                                s.ox *= scaleBack
                                s.oy *= scaleBack
                                s.oz *= scaleBack
                            }

                            // Elastic scale squish & pop recovery
                            s.scaleVel += -s.scaleOffset * 58 * dt
                            s.scaleVel *= scaleDamping
                            s.scaleOffset += s.scaleVel * dt
                            s.scaleOffset = Math.max(
                                -0.35,
                                Math.min(0.45, s.scaleOffset)
                            )
                        }
                    }

                    dummy.position.set(
                        baseX + s.ox + liveX,
                        baseY + s.oy + liveY,
                        baseZ + s.oz + liveZ
                    )

                    const finalRadius = Math.max(
                        0.001,
                        s.r * elasticScale * (1 + s.scaleOffset + liveScale)
                    )
                    dummy.scale.setScalar(finalRadius)
                    dummy.updateMatrix()
                    instancedMesh.setMatrixAt(i, dummy.matrix)
                }

                instancedMesh.instanceMatrix.needsUpdate = true
            }

            renderer.render(scene, camera)
        }

        // Load SVG & build 3D packed sphere instanced mesh
        const buildSculpture = async () => {
            const gridSize = 256
            const grid = await rasterizeSvgToGrid(
                props.svgFile || "",
                props.svgCode || "",
                props.presetShape || "heart",
                gridSize
            )
            if (isDisposed) return

            packedSpheres = packVolumetricSpheres(grid, gridSize, {
                density: props.density ?? 82,
                minSphereSize: props.minSphereSize ?? 78,
                maxSphereSize: props.maxSphereSize ?? 100,
                depthThickness: props.depthThickness ?? 100,
                useSvgColors: props.useSvgColors ?? false,
                palette: [
                    props.color1 || "#d84b8a",
                    props.color2 || "#8c46d4",
                    props.color3 || "#c9649b",
                    props.color4 || "#e4d5ed",
                    props.color5 || "#692ca8",
                ],
                growthStyle: props.growthStyle || "clockwise",
            })

            if (instancedMesh) {
                sculptureGroup.remove(instancedMesh)
                instancedMesh.dispose()
                instancedMesh = null
            }

            if (packedSpheres.length > 0) {
                const count = packedSpheres.length
                const balloonDataArray = new Float32Array(count * 4)

                for (let i = 0; i < count; i++) {
                    const s = packedSpheres[i]
                    balloonDataArray[i * 4 + 0] = s.outX
                    balloonDataArray[i * 4 + 1] = s.outY
                    balloonDataArray[i * 4 + 2] = s.outZ
                    balloonDataArray[i * 4 + 3] = s.ao
                }

                sphereGeo.setAttribute(
                    "aBalloonData",
                    new THREE.InstancedBufferAttribute(balloonDataArray, 4)
                )

                instancedMesh = new THREE.InstancedMesh(
                    sphereGeo,
                    sphereMat,
                    count
                )
                instancedMesh.castShadow = true
                instancedMesh.receiveShadow = true

                for (let i = 0; i < count; i++) {
                    instancedMesh.setColorAt(i, packedSpheres[i].color)
                }
                if (instancedMesh.instanceColor) {
                    instancedMesh.instanceColor.needsUpdate = true
                }
                sculptureGroup.add(instancedMesh)
            }

            // Rule 12: Push manual frame once async SVG processing finishes
            updateAndRenderScene(performance.now())
        }

        buildSculpture()

        // Animation Loop (Rule 5, 11 & 12: Viewport-gated & Static-checked)
        const animateLoop = (now: number) => {
            if (isDisposed) return
            if (shouldAnimate) {
                frameId = requestAnimationFrame(animateLoop)
                if (!isIntersectingRef.current) return
                updateAndRenderScene(now)
            }
        }

        if (shouldAnimate) {
            frameId = requestAnimationFrame(animateLoop)
        } else {
            updateAndRenderScene(performance.now())
        }

        // Pointer, Drag Orbit & Click Shockwave Interaction Listeners
        const maxTiltRad = THREE.MathUtils.degToRad(props.parallaxTilt ?? 14)
        let lastDragClientX = 0
        let lastDragClientY = 0

        const handlePointerMove = (e: PointerEvent) => {
            const rect = container.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return

            const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
            pointerNDC.set(nx, ny)
            isPointerInside = true

            targetRotY = nx * maxTiltRad
            targetRotX = -ny * maxTiltRad

            if (isPointerDragging && (props.interactive ?? true)) {
                const dClientX = e.clientX - lastDragClientX
                const dClientY = e.clientY - lastDragClientY
                lastDragClientX = e.clientX
                lastDragClientY = e.clientY
                dragOrbitY = Math.max(
                    -0.65,
                    Math.min(0.65, dragOrbitY + dClientX * 0.0055)
                )
                dragOrbitX = Math.max(
                    -0.55,
                    Math.min(0.55, dragOrbitX + dClientY * 0.0055)
                )
            }

            const dx = e.clientX - pointerDownPosRef.current.x
            const dy = e.clientY - pointerDownPosRef.current.y
            if (dx * dx + dy * dy > 36) {
                wasDraggedRef.current = true
            }

            if (!shouldAnimate) {
                updateAndRenderScene(performance.now())
            }
        }

        const handlePointerLeave = () => {
            isPointerInside = false
            isPointerDragging = false
            pointerNDC.set(999, 999)
            prevPointerLocal.set(999, 999, 0)
            targetRotX = 0
            targetRotY = 0
            if (!shouldAnimate) {
                updateAndRenderScene(performance.now())
            }
        }

        const handlePointerDown = (e: PointerEvent) => {
            pointerDownPosRef.current = { x: e.clientX, y: e.clientY }
            lastDragClientX = e.clientX
            lastDragClientY = e.clientY
            wasDraggedRef.current = false
            isPointerDragging = true
            handlePointerMove(e)

            // Tactile 3D radial shockwave on click/tap
            if ((props.interactive ?? true) && packedSpheres.length > 0) {
                const shockRadius = 3.8
                for (let i = 0; i < packedSpheres.length; i++) {
                    const s = packedSpheres[i]
                    const dx = s.tx + s.ox - pointerLocal.x
                    const dy = s.ty + s.oy - pointerLocal.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < shockRadius) {
                        const factor = Math.pow(1 - dist / shockRadius, 1.4)
                        const invD = dist > 0.001 ? 1 / dist : 0
                        s.vx += (dx * invD + s.outX * 0.5) * factor * 7.5
                        s.vy += (dy * invD + s.outY * 0.5) * factor * 7.5
                        s.vz += s.outZ * factor * 6.5
                        s.scaleVel += factor * 3.8
                    }
                }
            }

            if (!shouldAnimate) {
                updateAndRenderScene(performance.now())
            }
        }

        const handlePointerUp = () => {
            isPointerDragging = false
        }

        container.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })
        container.addEventListener("pointerleave", handlePointerLeave, {
            passive: true,
        })
        container.addEventListener("pointerdown", handlePointerDown, {
            passive: true,
        })
        window.addEventListener("pointerup", handlePointerUp, {
            passive: true,
        })

        // Rule 4: Responsive Sizing via ResizeObserver
        resizeObserver = new ResizeObserver((entries) => {
            if (isDisposed) return
            for (const entry of entries) {
                const cw = Math.max(entry.contentRect.width, 100)
                const ch = Math.max(entry.contentRect.height, 100)
                camera.aspect = cw / ch
                const aspectFit = cw / ch < 1 ? 1 / Math.max(0.55, cw / ch) : 1
                camera.position.z = 14.2 * Math.min(1.65, aspectFit)
                camera.updateProjectionMatrix()
                renderer.setSize(cw, ch)
                if (!shouldAnimate) {
                    updateAndRenderScene(performance.now())
                }
            }
        })
        resizeObserver.observe(container)

        // Rule 5 & 11: IntersectionObserver for Offscreen Pausing
        intersectionObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    isIntersectingRef.current = entry.isIntersecting
                    if (entry.isIntersecting && !shouldAnimate) {
                        updateAndRenderScene(performance.now())
                    }
                }
            },
            { threshold: 0.05 }
        )
        intersectionObserver.observe(container)

        // ====================================================================
        // RULE 2: STRICT WEBGL CLEANUP FOR FRAMER HOT-RELOADING
        // ====================================================================
        return () => {
            isDisposed = true
            if (frameId !== null) {
                cancelAnimationFrame(frameId)
            }
            if (resizeObserver) {
                resizeObserver.disconnect()
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect()
            }

            container.removeEventListener("pointermove", handlePointerMove)
            container.removeEventListener("pointerleave", handlePointerLeave)
            container.removeEventListener("pointerdown", handlePointerDown)
            window.removeEventListener("pointerup", handlePointerUp)

            if (instancedMesh) {
                sculptureGroup.remove(instancedMesh)
                instancedMesh.dispose()
                instancedMesh = null
            }

            geometriesToDispose.forEach((g) => g.dispose())
            materialsToDispose.forEach((m) => m.dispose())
            texturesToDispose.forEach((t) => t.dispose())
            renderTargetsToDispose.forEach((rt) => rt.dispose())
            if (pmremGenToDispose) {
                pmremGenToDispose.dispose()
            }

            scene.clear()
            renderer.forceContextLoss()
            renderer.dispose()

            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        shouldAnimate,
        props.svgFile,
        props.svgCode,
        props.presetShape,
        props.logoScale,
        props.logoTilt,
        props.density,
        props.minSphereSize,
        props.maxSphereSize,
        props.depthThickness,
        props.roughness,
        props.glossiness,
        props.useSvgColors,
        props.color1,
        props.color2,
        props.color3,
        props.color4,
        props.color5,
        props.growthStyle,
        props.fillDuration,
        props.bounciness,
        props.floatAmount,
        props.loopAnimation,
        props.holdDuration,
        props.interactive,
        props.pushRadius,
        props.pushStrength,
        props.parallaxTilt,
        props.backgroundMode,
        props.skyTopColor,
        props.skyBottomColor,
        props.cloudOpacity,
        props.lightIntensity,
    ])

    // Rule 10: Prevent 0x0px canvas mounting
    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        minWidth: 100,
        minHeight: 100,
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: normalizedLink
            ? "pointer"
            : (props.interactive ?? true)
              ? "pointer"
              : "default",
        ...props.style,
    }

    return (
        <div ref={mountRef} style={containerStyle}>
            {/* Rule 17: Native HTML Anchor for Clickable Links with Drag Guard */}
            {normalizedLink && (
                <a
                    href={normalizedLink}
                    target={props.openInNewTab ? "_blank" : undefined}
                    rel={props.openInNewTab ? "noopener noreferrer" : undefined}
                    aria-label="3D SVG Balloon Logo Link"
                    onClick={(e) => {
                        if (wasDraggedRef.current) {
                            e.preventDefault()
                            e.stopPropagation()
                        }
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        display: "block",
                        background: "transparent",
                        cursor: "pointer",
                    }}
                />
            )}
        </div>
    )
}

// ============================================================================
// RULE 9 STEP 2: NESTED DEFAULT PROPS
// ============================================================================
SVGBalloonLogo.defaultProps = {
    livePreview: true,
    svgSource: {
        svgFile: "",
        svgCode: "",
        presetShape: "heart",
        logoScale: 100,
        logoTilt: 0,
        linkUrl: "",
        openInNewTab: false,
    },
    balloonStyle: {
        density: 82,
        minSphereSize: 78,
        maxSphereSize: 100,
        depthThickness: 100,
        roughness: 32,
        glossiness: 30,
        useSvgColors: false,
        color1: "#d84b8a",
        color2: "#8c46d4",
        color3: "#c9649b",
        color4: "#e4d5ed",
        color5: "#692ca8",
    },
    animation: {
        growthStyle: "clockwise",
        fillDuration: 3.8,
        bounciness: 90,
        floatAmount: 70,
        loopAnimation: false,
        holdDuration: 4.5,
    },
    interaction: {
        interactive: true,
        pushRadius: 105,
        pushStrength: 115,
        parallaxTilt: 14,
    },
    environment: {
        backgroundMode: "sky",
        skyTopColor: "#2161a8",
        skyBottomColor: "#66b3e6",
        cloudOpacity: 70,
        lightIntensity: 100,
    },
}

// ============================================================================
// RULE 8, 9 STEP 3, 13, 14 & 16: FRAMER PROPERTY CONTROLS
// ============================================================================
addPropertyControls(SVGBalloonLogo, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Run interactive 3D animation in editor.",
    },
    svgSource: {
        type: ControlType.Object,
        title: "SVG Logo",
        description: "Upload custom SVG or pick preset shape.",
        controls: {
            svgFile: {
                type: ControlType.File,
                title: "Upload SVG",
                allowedFileTypes: ["svg"],
                description: "Upload a Framer-managed SVG asset.",
            },
            svgCode: {
                type: ControlType.String,
                title: "SVG Code",
                placeholder: "<svg>...</svg>",
                displayTextArea: true,
                description: "Or paste sanitized inline SVG markup.",
            },
            presetShape: {
                type: ControlType.Enum,
                title: "Fallback Shape",
                options: ["heart", "star", "infinity", "bolt"],
                optionTitles: [
                    "Heart (Video Ref)",
                    "Star",
                    "Infinity",
                    "Lightning",
                ],
                defaultValue: "heart",
                description: "Used when no custom SVG is provided.",
            },
            logoScale: {
                type: ControlType.Number,
                title: "Logo Scale",
                min: 40,
                max: 160,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Overall size of the 3D logo.",
            },
            logoTilt: {
                type: ControlType.Number,
                title: "Logo Tilt",
                min: -45,
                max: 45,
                step: 1,
                unit: "deg",
                defaultValue: 0,
                description: "Rotation angle of the SVG shape.",
            },
            linkUrl: {
                type: ControlType.Link,
                title: "Click Link",
                description: "Optional URL opened on click.",
            },
            openInNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Open link in a new tab.",
            },
        },
    },
    balloonStyle: {
        type: ControlType.Object,
        title: "Balloons",
        description: "Configure sphere packing and colors.",
        controls: {
            density: {
                type: ControlType.Number,
                title: "Fill Density",
                min: 25,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 82,
                description: "How tightly balloons pack the SVG.",
            },
            minSphereSize: {
                type: ControlType.Number,
                title: "Min Size",
                min: 30,
                max: 120,
                step: 1,
                unit: "%",
                defaultValue: 78,
                description: "Smallest crevice balloon size.",
            },
            maxSphereSize: {
                type: ControlType.Number,
                title: "Max Size",
                min: 50,
                max: 180,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Largest hero balloon size.",
            },
            depthThickness: {
                type: ControlType.Number,
                title: "3D Depth",
                min: 25,
                max: 180,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Volumetric thickness in Z space.",
            },
            roughness: {
                type: ControlType.Number,
                title: "Matte Finish",
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 32,
                description: "Satin matte texture of latex.",
            },
            glossiness: {
                type: ControlType.Number,
                title: "Clearcoat",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 30,
                description: "Specular highlight shine.",
            },
            useSvgColors: {
                type: ControlType.Boolean,
                title: "SVG Colors",
                defaultValue: false,
                enabledTitle: "Use SVG",
                disabledTitle: "Palette",
                description: "Sample colors from uploaded SVG.",
            },
            color1: {
                type: ControlType.Color,
                title: "Color 1",
                defaultValue: "#d84b8a",
                description: "Primary berry pink balloon.",
            },
            color2: {
                type: ControlType.Color,
                title: "Color 2",
                defaultValue: "#8c46d4",
                description: "Vibrant orchid purple balloon.",
            },
            color3: {
                type: ControlType.Color,
                title: "Color 3",
                defaultValue: "#c9649b",
                description: "Warm flamingo rose shade.",
            },
            color4: {
                type: ControlType.Color,
                title: "Color 4",
                defaultValue: "#e4d5ed",
                description: "Soft lilac pearl balloon.",
            },
            color5: {
                type: ControlType.Color,
                title: "Color 5",
                defaultValue: "#692ca8",
                description: "Deep plum violet accent.",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        description: "Control inflation sweep and floating.",
        controls: {
            growthStyle: {
                type: ControlType.Enum,
                title: "Fill Path",
                options: [
                    "clockwise",
                    "counterClockwise",
                    "bottomUp",
                    "centerOut",
                    "leftToRight",
                    "randomPop",
                ],
                optionTitles: [
                    "Clockwise (Video)",
                    "Counter-Clockwise",
                    "Bottom to Top",
                    "Center Outward",
                    "Left to Right",
                    "Random Pop",
                ],
                defaultValue: "clockwise",
                description: "Direction balloons fill the SVG.",
            },
            fillDuration: {
                type: ControlType.Number,
                title: "Fill Time",
                min: 0.8,
                max: 10,
                step: 0.1,
                unit: "s",
                defaultValue: 3.8,
                description: "Duration of the fill animation.",
            },
            bounciness: {
                type: ControlType.Number,
                title: "Pop Bounce",
                min: 0,
                max: 150,
                step: 1,
                unit: "%",
                defaultValue: 90,
                description: "Elastic spring overshoot on pop.",
            },
            floatAmount: {
                type: ControlType.Number,
                title: "Sky Float",
                min: 0,
                max: 150,
                step: 1,
                unit: "%",
                defaultValue: 70,
                description: "Gentle breeze floating motion.",
            },
            loopAnimation: {
                type: ControlType.Boolean,
                title: "Loop Fill",
                defaultValue: false,
                enabledTitle: "Loop",
                disabledTitle: "Once",
                description: "Repeat fill animation after hold.",
            },
            holdDuration: {
                type: ControlType.Number,
                title: "Hold Time",
                min: 0.5,
                max: 15,
                step: 0.5,
                unit: "s",
                defaultValue: 4.5,
                description: "Pause duration when looping.",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        description: "Cursor balloon push, wave, and 3D tilt.",
        controls: {
            interactive: {
                type: ControlType.Boolean,
                title: "Interactive",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "React to hover, drag, and clicks.",
            },
            pushRadius: {
                type: ControlType.Number,
                title: "Push Radius",
                min: 20,
                max: 220,
                step: 1,
                unit: "px",
                defaultValue: 105,
                description: "Hover area that pushes balloons.",
            },
            pushStrength: {
                type: ControlType.Number,
                title: "Push Force",
                min: 0,
                max: 220,
                step: 1,
                unit: "%",
                defaultValue: 115,
                description: "Strength of balloon repulsion.",
            },
            parallaxTilt: {
                type: ControlType.Number,
                title: "3D Tilt",
                min: 0,
                max: 35,
                step: 1,
                unit: "deg",
                defaultValue: 14,
                description: "Parallax rotation on mouse move.",
            },
        },
    },
    environment: {
        type: ControlType.Object,
        title: "Environment",
        description:
            "Sky gradient, clouds, and sun intensity.\n\nMore components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            backgroundMode: {
                type: ControlType.Enum,
                title: "Background",
                options: ["sky", "solid", "transparent"],
                optionTitles: ["Sky & Clouds", "Solid Color", "Transparent"],
                defaultValue: "sky",
                description: "Choose sky scene or transparent.",
            },
            skyTopColor: {
                type: ControlType.Color,
                title: "Sky Top",
                defaultValue: "#2161a8",
                description: "Upper sky gradient color.",
            },
            skyBottomColor: {
                type: ControlType.Color,
                title: "Sky Horizon",
                defaultValue: "#66b3e6",
                description: "Lower horizon sky color.",
            },
            cloudOpacity: {
                type: ControlType.Number,
                title: "Clouds",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 70,
                description: "Visibility of soft sky clouds.",
            },
            lightIntensity: {
                type: ControlType.Number,
                title: "Sunlight",
                min: 20,
                max: 200,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Overall scene lighting intensity.",
            },
        },
    },
})
