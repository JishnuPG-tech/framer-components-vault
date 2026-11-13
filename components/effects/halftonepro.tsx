import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type DitherType =
    | "None"
    | "FloydSteinberg"
    | "JarvisJudiceNinke"
    | "Stucki"
    | "Burkes"
    | "Ordered"
    | "Noise"

type RenderShape =
    | "circle"
    | "square"
    | "diamond"
    | "binary"
    | "bitmap"
    | "matrix"

type PerformanceMode = "low" | "balanced" | "high"
type MotionMode = "none" | "pulse"
type MaskMode = "none" | "luma" | "chroma"
type ChromaColor = "green" | "blue"
type MediaKind = "image" | "video"
type MouseMode =
    | "repel"
    | "attract"
    | "grow"
    | "ripple"
    | "gravity"
    | "explode"
    | "orbit"

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface FontControlValue {
    fontFamily?: string
    fontWeight?: number | string
    family?: string
    weight?: number | string
}

interface GridAnalysis {
    key: string
    rows: number
    cols: number
    gridHi: number
    drawHi: { x: number; y: number; width: number; height: number }
    cellValues: Float32Array
    maskValues: Float32Array
}

interface MediaSettings {
    preferUpload: boolean
    mediaType: MediaKind
    image?: ResponsiveImageValue
    imageUrl: string
    videoSrc: string
    uploadedMedia: string
    autoplay: boolean
    loop: boolean
    muted: boolean
    animate: boolean
}

interface GridSettings {
    gridSize: number
    cellGap: number
    brightness: number
    contrast: number
    gamma: number
    smoothing: number
    ditherType: DitherType
}

interface ShapeSettings {
    renderShape: RenderShape
    organicDots: boolean
    edgeSoftness: number
    radiusCurve: number
    motionMode: MotionMode
    motionAmount: number
    useScreenAngle: boolean
    screenAngle: number
    textFont: FontControlValue
    textScale: number
}

interface MouseSettings {
    mouseInteraction: boolean
    mouseMode: MouseMode
    mouseRadius: number
    mouseStrength: number
    mouseSmoothness: number
}

interface ColorSettings {
    backgroundColor: string
    backgroundMediaOpacity: number
    backgroundMediaBlur: number
    dotColor: string
    dotColor2: string
    useDuotone: boolean
    multicolor: boolean
    frameBackground: string
}

interface MaskSettings {
    maskMode: MaskMode
    chromaColor: ChromaColor
    maskThreshold: number
    maskSoftness: number
}

interface LayoutSettings {
    fit: "contain" | "cover"
    borderRadius: number
    padding: number
    performanceMode: PerformanceMode
}

interface Props {
    media: MediaSettings
    grid: GridSettings
    shape: ShapeSettings
    mouse: MouseSettings
    colors: ColorSettings
    mask: MaskSettings
    layout: LayoutSettings
    width?: number
    height?: number
}

const DEFAULT_VIDEO =
    "https://res.cloudinary.com/deel5czt3/video/upload/v1776847878/vecteezy_majestic-black-horse-galloping-with-powerful-energy_70796105_zxfqws.mp4"

const DEFAULT_IMAGE =
    "https://res.cloudinary.com/deel5czt3/image/upload/v1776847544/bb1122_wxqg6z.png"

const DEFAULT_MEDIA: MediaSettings = {
    preferUpload: true,
    mediaType: "video",
    image: { src: DEFAULT_IMAGE },
    imageUrl: DEFAULT_IMAGE,
    videoSrc: DEFAULT_VIDEO,
    uploadedMedia: "",
    autoplay: true,
    loop: true,
    muted: true,
    animate: true,
}

const DEFAULT_GRID: GridSettings = {
    gridSize: 5,
    cellGap: -3,
    brightness: 14,
    contrast: -20,
    gamma: 1.4,
    smoothing: 0,
    ditherType: "None",
}

const DEFAULT_SHAPE: ShapeSettings = {
    renderShape: "square",
    organicDots: false,
    edgeSoftness: 0,
    radiusCurve: 1,
    motionMode: "none",
    motionAmount: 0.5,
    useScreenAngle: false,
    screenAngle: 15,
    textFont: {
        fontFamily: "IBM Plex Mono",
        fontWeight: 500,
    },
    textScale: 0.9,
}

const DEFAULT_MOUSE: MouseSettings = {
    mouseInteraction: true,
    mouseMode: "attract",
    mouseRadius: 200,
    mouseStrength: 3,
    mouseSmoothness: 1,
}

const DEFAULT_COLORS: ColorSettings = {
    backgroundColor: "#21263F",
    backgroundMediaOpacity: 0,
    backgroundMediaBlur: 0,
    dotColor: "#EDE6CC",
    dotColor2: "#7A7A7A",
    useDuotone: false,
    multicolor: false,
    frameBackground: "#21263F",
}

const DEFAULT_MASK: MaskSettings = {
    maskMode: "none",
    chromaColor: "green",
    maskThreshold: 0.22,
    maskSoftness: 0.18,
}

const DEFAULT_LAYOUT: LayoutSettings = {
    fit: "contain",
    borderRadius: 0,
    padding: 0,
    performanceMode: "high",
}

const BITMAP_CHARS = [" ", "░", "▒", "▓", "█"]
const ALPHA_MASK_CUTOFF = 0.06

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, x: number) {
    const t = clamp((x - edge0) / Math.max(0.00001, edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
}

function hexToRgb(hex: string) {
    const safe = hex.replace("#", "")
    const normalized =
        safe.length === 3
            ? safe
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : safe

    const int = parseInt(normalized, 16)
    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    }
}

function hslToRgb(h: number, s: number, l: number) {
    const hue = ((h % 360) + 360) % 360
    const sat = clamp(s / 100, 0, 1)
    const lig = clamp(l / 100, 0, 1)
    const c = (1 - Math.abs(2 * lig - 1)) * sat
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
    const m = lig - c / 2

    let r1 = 0
    let g1 = 0
    let b1 = 0

    if (hue < 60) {
        r1 = c
        g1 = x
    } else if (hue < 120) {
        r1 = x
        g1 = c
    } else if (hue < 180) {
        g1 = c
        b1 = x
    } else if (hue < 240) {
        g1 = x
        b1 = c
    } else if (hue < 300) {
        r1 = x
        b1 = c
    } else {
        r1 = c
        b1 = x
    }

    return {
        r: Math.round((r1 + m) * 255),
        g: Math.round((g1 + m) * 255),
        b: Math.round((b1 + m) * 255),
    }
}

function parseColorToRgb(color: string) {
    const value = color.trim()

    if (value.startsWith("#")) return hexToRgb(value)

    const rgbMatch = value.match(
        /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/i
    )

    if (rgbMatch) {
        return {
            r: clamp(Number(rgbMatch[1]), 0, 255),
            g: clamp(Number(rgbMatch[2]), 0, 255),
            b: clamp(Number(rgbMatch[3]), 0, 255),
        }
    }

    const hslMatch = value.match(
        /hsla?\(\s*([0-9.\-]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%(?:\s*,\s*([0-9.]+))?\s*\)/i
    )

    if (hslMatch) {
        return hslToRgb(
            Number(hslMatch[1]),
            Number(hslMatch[2]),
            Number(hslMatch[3])
        )
    }

    return { r: 0, g: 0, b: 0 }
}

function rgbaString(color: string, alpha: number) {
    const rgb = parseColorToRgb(color)
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`
}

function mixColors(colorA: string, colorB: string, t: number) {
    const a = parseColorToRgb(colorA)
    const b = parseColorToRgb(colorB)
    const r = Math.round(lerp(a.r, b.r, t))
    const g = Math.round(lerp(a.g, b.g, t))
    const bb = Math.round(lerp(a.b, b.b, t))
    return `rgb(${r}, ${g}, ${bb})`
}

function hash2D(x: number, y: number) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
    return s - Math.floor(s)
}

function getPerfSettings(mode: PerformanceMode) {
    if (mode === "low") {
        return { quality: 1, sampleMax: 900, fpsDivisor: 2, maxDpr: 1 }
    }
    if (mode === "high") {
        return { quality: 1.35, sampleMax: 1600, fpsDivisor: 1, maxDpr: 1.35 }
    }
    return { quality: 1.15, sampleMax: 1300, fpsDivisor: 1, maxDpr: 1.2 }
}

function getFileExtension(value: string) {
    const clean = value.split("?")[0].split("#")[0]
    const parts = clean.split(".")
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

function detectUploadKind(src: string): MediaKind {
    const ext = getFileExtension(src)
    if (["mp4", "webm", "mov", "m4v", "ogg"].includes(ext)) return "video"
    if (["gif", "png", "jpg", "jpeg", "webp", "avif"].includes(ext))
        return "image"
    return "video"
}

function getFontFamily(font: FontControlValue | undefined) {
    return font?.fontFamily || font?.family || "monospace"
}

function getFontWeight(font: FontControlValue | undefined) {
    return font?.fontWeight || font?.weight || 500
}

export default function HalftoneMaskedFX(props: Props) {
    const media = { ...DEFAULT_MEDIA, ...(props.media || {}) }
    const grid = { ...DEFAULT_GRID, ...(props.grid || {}) }
    const shape = { ...DEFAULT_SHAPE, ...(props.shape || {}) }
    const mouse = { ...DEFAULT_MOUSE, ...(props.mouse || {}) }
    const colors = { ...DEFAULT_COLORS, ...(props.colors || {}) }
    const mask = { ...DEFAULT_MASK, ...(props.mask || {}) }
    const layout = { ...DEFAULT_LAYOUT, ...(props.layout || {}) }

    const {
        preferUpload,
        mediaType,
        image,
        imageUrl,
        videoSrc,
        uploadedMedia,
        autoplay,
        loop,
        muted,
        animate,
    } = media

    const {
        gridSize,
        cellGap,
        brightness,
        contrast,
        gamma,
        smoothing,
        ditherType,
    } = grid

    const {
        renderShape,
        organicDots,
        edgeSoftness,
        radiusCurve,
        motionMode,
        motionAmount,
        useScreenAngle,
        screenAngle,
        textFont,
        textScale,
    } = shape

    const {
        mouseInteraction,
        mouseMode,
        mouseRadius,
        mouseStrength,
        mouseSmoothness,
    } = mouse

    const { maskMode, chromaColor, maskThreshold, maskSoftness } = mask

    const {
        backgroundColor,
        backgroundMediaOpacity,
        backgroundMediaBlur,
        dotColor,
        dotColor2,
        useDuotone,
        multicolor,
        frameBackground,
    } = colors

    const { fit, borderRadius, padding, performanceMode } = layout

    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const sampleCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const renderCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const imageRef = React.useRef<HTMLImageElement | null>(null)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const resizeObserverRef = React.useRef<ResizeObserver | null>(null)
    const startTimeRef = React.useRef<number>(0)
    const needsStillRenderRef = React.useRef(false)
    const cachedGridRef = React.useRef<GridAnalysis | null>(null)
    const renderMetaRef = React.useRef({
        canvasWidth: 0,
        canvasHeight: 0,
        cssWidth: 0,
        cssHeight: 0,
    })
    const pointerTickRef = React.useRef<number | null>(null)
    const lastPointerEventRef = React.useRef<PointerEvent | null>(null)
    const lastPointerTimeRef = React.useRef(0)
    const mountedRef = React.useRef(false)

    const targetMouseRef = React.useRef({ active: false, x: 0, y: 0 })
    const smoothMouseRef = React.useRef({ active: false, x: 0, y: 0 })

    const [ready, setReady] = React.useState(false)
    const [wrapperSize, setWrapperSize] = React.useState({
        width: 600,
        height: 400,
    })

    const perf = React.useMemo(
        () => getPerfSettings(performanceMode),
        [performanceMode]
    )

    const resolvedUpload =
        preferUpload && uploadedMedia && uploadedMedia.trim()
            ? uploadedMedia.trim()
            : ""

    const uploadedKind = detectUploadKind(resolvedUpload || "")
    const manualImageSrc = DEFAULT_IMAGE
    const manualVideoSrc = DEFAULT_VIDEO

    const activeKind: MediaKind =
        preferUpload && resolvedUpload ? uploadedKind : mediaType

    const currentSrc = preferUpload
        ? activeKind === "video"
            ? resolvedUpload || videoSrc?.trim() || DEFAULT_VIDEO
            : resolvedUpload ||
              imageUrl?.trim() ||
              image?.src?.trim() ||
              DEFAULT_IMAGE
        : activeKind === "video"
          ? manualVideoSrc
          : manualImageSrc

    const resolvedKind: MediaKind = activeKind
    const safeSrc =
        currentSrc || (activeKind === "video" ? DEFAULT_VIDEO : DEFAULT_IMAGE)

    const stageSize = React.useMemo(
        () => ({
            width: Math.max(1, Math.round(wrapperSize.width - padding * 2)),
            height: Math.max(1, Math.round(wrapperSize.height - padding * 2)),
        }),
        [wrapperSize, padding]
    )

    const isTextShape =
        renderShape === "binary" ||
        renderShape === "bitmap" ||
        renderShape === "matrix"

    const stopAnimation = React.useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    const cleanupMedia = React.useCallback(() => {
        stopAnimation()

        if (pointerTickRef.current !== null) {
            cancelAnimationFrame(pointerTickRef.current)
            pointerTickRef.current = null
        }

        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.removeAttribute("src")
            videoRef.current.load()
            videoRef.current = null
        }

        imageRef.current = null
        cachedGridRef.current = null
        setReady(false)
    }, [stopAnimation])

    const getSourceDimensions = React.useCallback(() => {
        if (resolvedKind === "video" && videoRef.current) {
            return {
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
            }
        }

        if (resolvedKind === "image" && imageRef.current) {
            return {
                width: imageRef.current.naturalWidth,
                height: imageRef.current.naturalHeight,
            }
        }

        return { width: 0, height: 0 }
    }, [resolvedKind])

    const getDrawRect = React.useCallback(
        (
            containerW: number,
            containerH: number,
            sourceW: number,
            sourceH: number
        ) => {
            if (
                containerW <= 0 ||
                containerH <= 0 ||
                sourceW <= 0 ||
                sourceH <= 0
            ) {
                return { x: 0, y: 0, width: 0, height: 0 }
            }

            const sourceRatio = sourceW / sourceH
            const containerRatio = containerW / containerH

            let drawWidth = containerW
            let drawHeight = containerH

            if (fit === "contain") {
                if (sourceRatio > containerRatio) {
                    drawWidth = containerW
                    drawHeight = containerW / sourceRatio
                } else {
                    drawHeight = containerH
                    drawWidth = containerH * sourceRatio
                }
            } else {
                if (sourceRatio > containerRatio) {
                    drawHeight = containerH
                    drawWidth = containerH * sourceRatio
                } else {
                    drawWidth = containerW
                    drawHeight = containerW / sourceRatio
                }
            }

            return {
                x: (containerW - drawWidth) / 2,
                y: (containerH - drawHeight) / 2,
                width: drawWidth,
                height: drawHeight,
            }
        },
        [fit]
    )

    const applyBoxBlur = React.useCallback(
        (
            values: Float32Array,
            rows: number,
            cols: number,
            strength: number
        ) => {
            let result = new Float32Array(values)
            const passes = Math.floor(strength)

            for (let p = 0; p < passes; p++) {
                const temp = new Float32Array(result.length)

                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        let sum = 0
                        let count = 0

                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const r = row + dy
                                const c = col + dx
                                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                                    sum += result[r * cols + c]
                                    count++
                                }
                            }
                        }

                        temp[row * cols + col] = count
                            ? sum / count
                            : result[row * cols + col]
                    }
                }

                result = temp
            }

            const frac = strength - Math.floor(strength)
            if (frac > 0) {
                for (let i = 0; i < result.length; i++) {
                    result[i] = values[i] * (1 - frac) + result[i] * frac
                }
            }

            return result
        },
        []
    )

    const applyFloydSteinberg = React.useCallback(
        (values: Float32Array, rows: number, cols: number) => {
            const threshold = 128

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const i = row * cols + col
                    const oldVal = values[i]
                    const newVal = oldVal < threshold ? 0 : 255
                    const error = oldVal - newVal
                    values[i] = newVal

                    if (col + 1 < cols)
                        values[row * cols + col + 1] += error * (7 / 16)

                    if (row + 1 < rows) {
                        if (col - 1 >= 0) {
                            values[(row + 1) * cols + col - 1] +=
                                error * (3 / 16)
                        }
                        values[(row + 1) * cols + col] += error * (5 / 16)
                        if (col + 1 < cols) {
                            values[(row + 1) * cols + col + 1] +=
                                error * (1 / 16)
                        }
                    }
                }
            }
        },
        []
    )

    const diffuseWithMatrix = React.useCallback(
        (
            values: Float32Array,
            rows: number,
            cols: number,
            matrix: number[][]
        ) => {
            const threshold = 128
            const centerOffset = Math.floor(matrix[0].length / 2)

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const i = row * cols + col
                    const oldVal = values[i]
                    const newVal = oldVal < threshold ? 0 : 255
                    const error = oldVal - newVal
                    values[i] = newVal

                    for (let my = 0; my < matrix.length; my++) {
                        for (let mx = 0; mx < matrix[my].length; mx++) {
                            const weight = matrix[my][mx]
                            if (!weight) continue

                            const x = col + mx - centerOffset
                            const y = row + my

                            if (x >= 0 && x < cols && y >= 0 && y < rows) {
                                values[y * cols + x] += error * weight
                            }
                        }
                    }
                }
            }
        },
        []
    )

    const applyOrdered = React.useCallback(
        (values: Float32Array, rows: number, cols: number) => {
            const bayer = [
                [0, 2],
                [3, 1],
            ]
            const size = 2

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const i = row * cols + col
                    const threshold =
                        (bayer[row % size][col % size] + 0.5) *
                        (255 / (size * size))
                    values[i] = values[i] < threshold ? 0 : 255
                }
            }
        },
        []
    )

    const applyStableNoise = React.useCallback(
        (values: Float32Array, rows: number, cols: number) => {
            const threshold = 128
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const i = row * cols + col
                    const noise = (hash2D(col + 0.37, row + 0.91) - 0.5) * 50
                    values[i] = values[i] + noise < threshold ? 0 : 255
                }
            }
        },
        []
    )

    const getDotFill = React.useCallback(
        (brightnessValue: number) => {
            const darkness = 1 - brightnessValue / 255

            if (multicolor) {
                const hue = 220 - darkness * 220
                const sat = 70 + darkness * 30
                const light = 60 - darkness * 22
                return `hsl(${hue}, ${sat}%, ${light}%)`
            }

            if (useDuotone) {
                return mixColors(dotColor2, dotColor, darkness)
            }

            return dotColor || "#000000"
        },
        [multicolor, useDuotone, dotColor, dotColor2]
    )

    const drawDot = React.useCallback(
        (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            radius: number,
            shapeValue: RenderShape,
            softness: number,
            fill: string
        ) => {
            if (radius <= 0) return

            if (shapeValue === "circle" && softness > 0.001) {
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
                gradient.addColorStop(0, rgbaString(fill, 1))
                gradient.addColorStop(
                    clamp(1 - softness * 0.8, 0, 1),
                    rgbaString(fill, 1)
                )
                gradient.addColorStop(1, rgbaString(fill, 0))
                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(x, y, radius, 0, Math.PI * 2)
                ctx.fill()
                return
            }

            ctx.fillStyle = fill
            ctx.beginPath()

            if (shapeValue === "square") {
                const size = radius * 2
                ctx.rect(x - size / 2, y - size / 2, size, size)
            } else if (shapeValue === "diamond") {
                ctx.moveTo(x, y - radius)
                ctx.lineTo(x + radius, y)
                ctx.lineTo(x, y + radius)
                ctx.lineTo(x - radius, y)
                ctx.closePath()
            } else {
                ctx.arc(x, y, radius, 0, Math.PI * 2)
            }

            ctx.fill()
        },
        []
    )

    const getMaskAlpha = React.useCallback(
        (r: number, g: number, b: number, gray: number) => {
            if (maskMode === "none") return 1

            if (maskMode === "luma") {
                const darkness = 1 - gray / 255
                return smoothstep(
                    maskThreshold,
                    maskThreshold + maskSoftness,
                    darkness
                )
            }

            const dominant = chromaColor === "green" ? g : b
            const otherA = r
            const otherB = chromaColor === "green" ? b : g
            const dominance = dominant - Math.max(otherA, otherB)

            const keyStrength = smoothstep(
                maskThreshold * 255,
                (maskThreshold + maskSoftness) * 255,
                dominance
            )

            return 1 - keyStrength
        },
        [maskMode, chromaColor, maskThreshold, maskSoftness]
    )

    const getAnalysisKey = React.useCallback(
        (
            sampleWidth: number,
            sampleHeight: number,
            drawHi: { x: number; y: number; width: number; height: number },
            gridHi: number
        ) => {
            return [
                resolvedKind,
                safeSrc,
                sampleWidth,
                sampleHeight,
                Math.round(drawHi.x),
                Math.round(drawHi.y),
                Math.round(drawHi.width),
                Math.round(drawHi.height),
                Math.round(gridHi * 100) / 100,
                brightness,
                contrast,
                gamma,
                smoothing,
                ditherType,
                maskMode,
                chromaColor,
                maskThreshold,
                maskSoftness,
            ].join("|")
        },
        [
            resolvedKind,
            safeSrc,
            brightness,
            contrast,
            gamma,
            smoothing,
            ditherType,
            maskMode,
            chromaColor,
            maskThreshold,
            maskSoftness,
        ]
    )

    const buildGridAnalysis = React.useCallback(
        (
            source: CanvasImageSource,
            sampleWidth: number,
            sampleHeight: number,
            drawHi: { x: number; y: number; width: number; height: number },
            gridHi: number
        ): GridAnalysis | null => {
            let sampleCanvas = sampleCanvasRef.current
            if (!sampleCanvas) {
                sampleCanvas = document.createElement("canvas")
                sampleCanvasRef.current = sampleCanvas
            }

            sampleCanvas.width = sampleWidth
            sampleCanvas.height = sampleHeight

            const sampleCtx = sampleCanvas.getContext("2d", {
                willReadFrequently: true,
            })
            if (!sampleCtx) return null

            sampleCtx.setTransform(1, 0, 0, 1, 0, 0)
            sampleCtx.clearRect(0, 0, sampleWidth, sampleHeight)
            sampleCtx.imageSmoothingEnabled = true
            sampleCtx.imageSmoothingQuality = "high"
            sampleCtx.drawImage(source, 0, 0, sampleWidth, sampleHeight)

            const imgData = sampleCtx.getImageData(
                0,
                0,
                sampleWidth,
                sampleHeight
            )
            const data = imgData.data

            const contrastFactor =
                (259 * (contrast + 255)) / (255 * (259 - contrast))
            const safeGamma = Math.max(0.1, gamma)

            const cols = Math.max(1, Math.ceil(drawHi.width / gridHi))
            const rows = Math.max(1, Math.ceil(drawHi.height / gridHi))

            let cellValues = new Float32Array(rows * cols)
            let maskValues = new Float32Array(rows * cols)

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const rx0 = col * gridHi
                    const ry0 = row * gridHi
                    const rx1 = Math.min(rx0 + gridHi, drawHi.width)
                    const ry1 = Math.min(ry0 + gridHi, drawHi.height)

                    const sx0 = Math.max(
                        0,
                        Math.floor((rx0 / drawHi.width) * sampleWidth)
                    )
                    const sy0 = Math.max(
                        0,
                        Math.floor((ry0 / drawHi.height) * sampleHeight)
                    )
                    const sx1 = Math.min(
                        sampleWidth,
                        Math.max(
                            sx0 + 1,
                            Math.ceil((rx1 / drawHi.width) * sampleWidth)
                        )
                    )
                    const sy1 = Math.min(
                        sampleHeight,
                        Math.max(
                            sy0 + 1,
                            Math.ceil((ry1 / drawHi.height) * sampleHeight)
                        )
                    )

                    let graySum = 0
                    let alphaWeightedMaskSum = 0
                    let alphaSum = 0
                    let pixelCount = 0

                    for (let y = sy0; y < sy1; y++) {
                        for (let x = sx0; x < sx1; x++) {
                            const i = (y * sampleWidth + x) * 4
                            const r = data[i]
                            const g = data[i + 1]
                            const b = data[i + 2]
                            const a = data[i + 3] / 255

                            let gray = 0.299 * r + 0.587 * g + 0.114 * b
                            gray =
                                contrastFactor * (gray - 128) + 128 + brightness
                            gray = clamp(gray, 0, 255)
                            gray = 255 * Math.pow(gray / 255, 1 / safeGamma)

                            const computedMask = getMaskAlpha(r, g, b, gray)
                            const effectiveMask = computedMask * a

                            graySum += gray * a
                            alphaWeightedMaskSum += effectiveMask
                            alphaSum += a
                            pixelCount++
                        }
                    }

                    const index = row * cols + col
                    cellValues[index] =
                        alphaSum > 0.0001 ? graySum / alphaSum : 255
                    maskValues[index] =
                        pixelCount > 0 ? alphaWeightedMaskSum / pixelCount : 0
                }
            }

            if (smoothing > 0) {
                cellValues = applyBoxBlur(cellValues, rows, cols, smoothing)
                maskValues = applyBoxBlur(
                    maskValues,
                    rows,
                    cols,
                    Math.max(0.5, smoothing)
                )
            }

            switch (ditherType) {
                case "FloydSteinberg":
                    applyFloydSteinberg(cellValues, rows, cols)
                    break
                case "JarvisJudiceNinke":
                    diffuseWithMatrix(cellValues, rows, cols, [
                        [0, 0, 0, 7 / 48, 5 / 48],
                        [3 / 48, 5 / 48, 7 / 48, 5 / 48, 3 / 48],
                        [1 / 48, 3 / 48, 5 / 48, 3 / 48, 1 / 48],
                    ])
                    break
                case "Stucki":
                    diffuseWithMatrix(cellValues, rows, cols, [
                        [0, 0, 0, 8 / 42, 4 / 42],
                        [2 / 42, 4 / 42, 8 / 42, 4 / 42, 2 / 42],
                        [1 / 42, 2 / 42, 4 / 42, 2 / 42, 1 / 42],
                    ])
                    break
                case "Burkes":
                    diffuseWithMatrix(cellValues, rows, cols, [
                        [0, 0, 0, 8 / 32, 4 / 32],
                        [2 / 32, 4 / 32, 8 / 32, 4 / 32, 2 / 32],
                    ])
                    break
                case "Ordered":
                    applyOrdered(cellValues, rows, cols)
                    break
                case "Noise":
                    applyStableNoise(cellValues, rows, cols)
                    break
                default:
                    break
            }

            return {
                key: getAnalysisKey(sampleWidth, sampleHeight, drawHi, gridHi),
                rows,
                cols,
                gridHi,
                drawHi,
                cellValues,
                maskValues,
            }
        },
        [
            contrast,
            brightness,
            gamma,
            smoothing,
            ditherType,
            getMaskAlpha,
            applyBoxBlur,
            applyFloydSteinberg,
            diffuseWithMatrix,
            applyOrdered,
            applyStableNoise,
            getAnalysisKey,
        ]
    )

    const renderFrame = React.useCallback(
        (timestamp?: number) => {
            const canvas = canvasRef.current
            if (!canvas || !ready) return

            const source =
                resolvedKind === "video" ? videoRef.current : imageRef.current
            if (!source) return

            if (!startTimeRef.current && timestamp) {
                startTimeRef.current = timestamp
            }

            const cssWidth = Math.max(1, Math.floor(stageSize.width))
            const cssHeight = Math.max(1, Math.floor(stageSize.height))
            const rawDpr =
                typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
            const dpr = Math.min(rawDpr, perf.maxDpr)
            const quality = perf.quality

            const targetCanvasWidth = Math.max(1, Math.round(cssWidth * dpr))
            const targetCanvasHeight = Math.max(1, Math.round(cssHeight * dpr))

            if (
                renderMetaRef.current.canvasWidth !== targetCanvasWidth ||
                renderMetaRef.current.canvasHeight !== targetCanvasHeight
            ) {
                canvas.width = targetCanvasWidth
                canvas.height = targetCanvasHeight
                renderMetaRef.current.canvasWidth = targetCanvasWidth
                renderMetaRef.current.canvasHeight = targetCanvasHeight
            }

            if (
                renderMetaRef.current.cssWidth !== cssWidth ||
                renderMetaRef.current.cssHeight !== cssHeight
            ) {
                canvas.style.width = `${cssWidth}px`
                canvas.style.height = `${cssHeight}px`
                renderMetaRef.current.cssWidth = cssWidth
                renderMetaRef.current.cssHeight = cssHeight
            }

            const displayCtx = canvas.getContext("2d")
            if (!displayCtx) return

            displayCtx.setTransform(1, 0, 0, 1, 0, 0)
            displayCtx.clearRect(0, 0, canvas.width, canvas.height)
            displayCtx.imageSmoothingEnabled = true
            displayCtx.imageSmoothingQuality = "high"

            const src = getSourceDimensions()
            if (!src.width || !src.height) return

            const draw = getDrawRect(cssWidth, cssHeight, src.width, src.height)

            const renderWidth = Math.max(
                1,
                Math.round(cssWidth * dpr * quality)
            )
            const renderHeight = Math.max(
                1,
                Math.round(cssHeight * dpr * quality)
            )

            const drawHi = {
                x: draw.x * dpr * quality,
                y: draw.y * dpr * quality,
                width: draw.width * dpr * quality,
                height: draw.height * dpr * quality,
            }

            let renderCanvas = renderCanvasRef.current
            if (!renderCanvas) {
                renderCanvas = document.createElement("canvas")
                renderCanvasRef.current = renderCanvas
            }

            if (
                renderCanvas.width !== renderWidth ||
                renderCanvas.height !== renderHeight
            ) {
                renderCanvas.width = renderWidth
                renderCanvas.height = renderHeight
            }

            const renderCtx = renderCanvas.getContext("2d")
            if (!renderCtx) return

            renderCtx.setTransform(1, 0, 0, 1, 0, 0)
            renderCtx.clearRect(0, 0, renderWidth, renderHeight)
            renderCtx.fillStyle = backgroundColor
            renderCtx.fillRect(0, 0, renderWidth, renderHeight)
            renderCtx.imageSmoothingEnabled = true
            renderCtx.imageSmoothingQuality = "high"

            if (backgroundMediaOpacity > 0.001) {
                renderCtx.save()
                renderCtx.globalAlpha = clamp(backgroundMediaOpacity, 0, 1)
                if (backgroundMediaBlur > 0.01) {
                    renderCtx.filter = `blur(${(
                        backgroundMediaBlur *
                        dpr *
                        quality
                    ).toFixed(2)}px)`
                }
                renderCtx.drawImage(
                    source,
                    drawHi.x,
                    drawHi.y,
                    drawHi.width,
                    drawHi.height
                )
                renderCtx.restore()
            }

            const maxSourceDim = Math.max(src.width, src.height)
            const sourceSamplingScale =
                resolvedKind === "image"
                    ? Math.min(1, perf.sampleMax / Math.max(maxSourceDim, 1600))
                    : Math.min(1, perf.sampleMax / maxSourceDim)

            const sampleWidth = Math.max(
                1,
                Math.round(src.width * sourceSamplingScale)
            )
            const sampleHeight = Math.max(
                1,
                Math.round(src.height * sourceSamplingScale)
            )

            const gridHi = Math.max(1, Math.round(gridSize * dpr * quality))
            const analysisKey = getAnalysisKey(
                sampleWidth,
                sampleHeight,
                drawHi,
                gridHi
            )

            let analysis = cachedGridRef.current
            const canReuseAnalysis =
                resolvedKind === "image" &&
                analysis &&
                analysis.key === analysisKey

            if (!canReuseAnalysis) {
                const nextAnalysis = buildGridAnalysis(
                    source,
                    sampleWidth,
                    sampleHeight,
                    drawHi,
                    gridHi
                )
                if (!nextAnalysis) return
                analysis = nextAnalysis
                if (resolvedKind === "image") {
                    cachedGridRef.current = nextAnalysis
                }
            }

            if (!analysis) return

            const rows = analysis.rows
            const cols = analysis.cols
            const elapsed = timestamp
                ? (timestamp - startTimeRef.current) / 1000
                : 0

            const angleRad = (screenAngle * Math.PI) / 180
            const cosA = Math.cos(angleRad)
            const sinA = Math.sin(angleRad)
            const rotateCx = analysis.drawHi.x + analysis.drawHi.width / 2
            const rotateCy = analysis.drawHi.y + analysis.drawHi.height / 2

            const fontFamily = getFontFamily(textFont)
            const fontWeight = getFontWeight(textFont)

            renderCtx.textAlign = "center"
            renderCtx.textBaseline = "middle"

            const mouseEase = clamp(mouseSmoothness, 0.01, 1)
            if (mouseInteraction) {
                smoothMouseRef.current.x = lerp(
                    smoothMouseRef.current.x,
                    targetMouseRef.current.x,
                    mouseEase
                )
                smoothMouseRef.current.y = lerp(
                    smoothMouseRef.current.y,
                    targetMouseRef.current.y,
                    mouseEase
                )

                if (targetMouseRef.current.active) {
                    smoothMouseRef.current.active = true
                } else if (smoothMouseRef.current.active) {
                    if (
                        Math.abs(
                            smoothMouseRef.current.x - targetMouseRef.current.x
                        ) < 0.5 &&
                        Math.abs(
                            smoothMouseRef.current.y - targetMouseRef.current.y
                        ) < 0.5
                    ) {
                        smoothMouseRef.current.active = false
                    }
                }
            } else {
                smoothMouseRef.current.active = false
            }

            const mouseActive =
                mouseInteraction && smoothMouseRef.current.active
            const mouseXHi = smoothMouseRef.current.x * dpr * quality
            const mouseYHi = smoothMouseRef.current.y * dpr * quality
            const mouseRadiusHi = Math.max(1, mouseRadius * dpr * quality)
            const mouseRadiusHiSq = mouseRadiusHi * mouseRadiusHi
            const gapHi = cellGap * dpr * quality
            const maxRadius = Math.max(0.25, (analysis.gridHi - gapHi) * 0.5)

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const index = row * cols + col
                    const value = clamp(analysis.cellValues[index], 0, 255)
                    const maskAlphaValue = clamp(
                        analysis.maskValues[index],
                        0,
                        1
                    )

                    if (maskAlphaValue <= ALPHA_MASK_CUTOFF) continue

                    const darkness = 1 - value / 255

                    let radius =
                        maxRadius *
                        Math.pow(darkness, clamp(radiusCurve, 0.2, 2))

                    radius *= maskAlphaValue

                    if (organicDots && !isTextShape) {
                        const rand = hash2D(col + 0.17, row + 0.43)
                        radius *= lerp(0.94, 1.06, rand)
                    }

                    if (
                        motionMode === "pulse" &&
                        resolvedKind === "video" &&
                        animate
                    ) {
                        const pulse =
                            Math.sin(elapsed * 3 + col * 0.35 + row * 0.18) *
                            motionAmount *
                            0.08
                        radius *= 1 + pulse
                    }

                    radius = clamp(
                        radius,
                        0,
                        Math.max(maxRadius, analysis.gridHi * 0.9)
                    )

                    let centerX =
                        analysis.drawHi.x +
                        col * analysis.gridHi +
                        analysis.gridHi / 2
                    let centerY =
                        analysis.drawHi.y +
                        row * analysis.gridHi +
                        analysis.gridHi / 2

                    if (useScreenAngle) {
                        const dx = centerX - rotateCx
                        const dy = centerY - rotateCy
                        const rotatedX = dx * cosA - dy * sinA
                        const rotatedY = dx * sinA + dy * cosA
                        centerX = rotateCx + rotatedX
                        centerY = rotateCy + rotatedY
                    }

                    let offsetX = 0
                    let offsetY = 0
                    let sizeBoost = 1

                    if (organicDots && !isTextShape) {
                        const jitterX = hash2D(col + 10.3, row + 3.7) - 0.5
                        const jitterY = hash2D(col + 22.9, row + 19.2) - 0.5
                        const jitterStrength =
                            analysis.gridHi * 0.05 * maskAlphaValue
                        offsetX += jitterX * jitterStrength
                        offsetY += jitterY * jitterStrength
                    }

                    if (mouseActive) {
                        const dx = centerX - mouseXHi
                        const dy = centerY - mouseYHi
                        const distSq = dx * dx + dy * dy

                        if (distSq < mouseRadiusHiSq) {
                            const dist = Math.sqrt(distSq)
                            const t = 1 - dist / mouseRadiusHi
                            const influence = t * t * clamp(mouseStrength, 0, 3)
                            const safeDist = Math.max(dist, 0.001)
                            const nx = dx / safeDist
                            const ny = dy / safeDist
                            const tx = -ny
                            const ty = nx

                            if (mouseMode === "repel") {
                                offsetX +=
                                    nx * influence * analysis.gridHi * 0.6
                                offsetY +=
                                    ny * influence * analysis.gridHi * 0.6
                            } else if (mouseMode === "attract") {
                                offsetX -=
                                    nx * influence * analysis.gridHi * 0.6
                                offsetY -=
                                    ny * influence * analysis.gridHi * 0.6
                            } else if (mouseMode === "grow") {
                                sizeBoost += influence * 0.9
                            } else if (mouseMode === "ripple") {
                                const wave =
                                    Math.sin(dist * 0.06 - elapsed * 5) *
                                    influence
                                offsetX += nx * wave * analysis.gridHi * 0.35
                                offsetY += ny * wave * analysis.gridHi * 0.35
                                sizeBoost += Math.abs(wave) * 0.45
                            } else if (mouseMode === "gravity") {
                                offsetX -=
                                    nx * influence * analysis.gridHi * 0.95
                                offsetY -=
                                    ny * influence * analysis.gridHi * 0.95
                                sizeBoost += influence * 0.35
                            } else if (mouseMode === "explode") {
                                offsetX +=
                                    nx * influence * analysis.gridHi * 1.1
                                offsetY +=
                                    ny * influence * analysis.gridHi * 1.1
                                sizeBoost = Math.max(
                                    0.55,
                                    sizeBoost - influence * 0.35
                                )
                            } else if (mouseMode === "orbit") {
                                offsetX +=
                                    tx * influence * analysis.gridHi * 0.8
                                offsetY +=
                                    ty * influence * analysis.gridHi * 0.8
                                offsetX -=
                                    nx * influence * analysis.gridHi * 0.12
                                offsetY -=
                                    ny * influence * analysis.gridHi * 0.12
                                sizeBoost += influence * 0.12
                            }
                        }
                    }

                    radius = clamp(
                        radius * sizeBoost,
                        0,
                        Math.max(maxRadius, analysis.gridHi)
                    )

                    if (radius <= 0.2) continue

                    const fill = getDotFill(value)

                    renderCtx.save()
                    renderCtx.globalAlpha = maskAlphaValue

                    if (renderShape === "binary") {
                        const char = value < 128 ? "1" : "0"
                        const fontSize = Math.max(
                            8,
                            analysis.gridHi *
                                clamp(textScale, 0.2, 2) *
                                sizeBoost
                        )
                        renderCtx.fillStyle = fill
                        renderCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
                        renderCtx.fillText(
                            char,
                            centerX + offsetX,
                            centerY + offsetY
                        )
                        renderCtx.restore()
                        continue
                    }

                    if (renderShape === "bitmap") {
                        const glyphIndex = Math.round(
                            darkness * (BITMAP_CHARS.length - 1)
                        )
                        const char = BITMAP_CHARS[glyphIndex]
                        if (char !== " ") {
                            const fontSize = Math.max(
                                8,
                                analysis.gridHi *
                                    clamp(textScale, 0.2, 2) *
                                    sizeBoost
                            )
                            renderCtx.fillStyle = fill
                            renderCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
                            renderCtx.fillText(
                                char,
                                centerX + offsetX,
                                centerY + offsetY
                            )
                        }
                        renderCtx.restore()
                        continue
                    }

                    if (renderShape === "matrix") {
                        let char = ""
                        if (darkness > 0.66) {
                            char =
                                hash2D(col + 1.7, row + 2.9) > 0.5 ? "1" : "0"
                        } else if (darkness > 0.33) {
                            char =
                                hash2D(col + 3.4, row + 7.1) > 0.5 ? "0" : "·"
                        } else if (darkness > 0.15) {
                            char = "·"
                        }

                        if (char) {
                            const fontSize = Math.max(
                                8,
                                analysis.gridHi *
                                    clamp(textScale, 0.2, 2) *
                                    sizeBoost
                            )
                            renderCtx.fillStyle = fill
                            renderCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
                            renderCtx.fillText(
                                char,
                                centerX + offsetX,
                                centerY + offsetY
                            )
                        }

                        renderCtx.restore()
                        continue
                    }

                    drawDot(
                        renderCtx,
                        centerX + offsetX,
                        centerY + offsetY,
                        radius,
                        renderShape,
                        edgeSoftness,
                        fill
                    )

                    renderCtx.restore()
                }
            }

            displayCtx.drawImage(
                renderCanvas,
                0,
                0,
                renderWidth,
                renderHeight,
                0,
                0,
                canvas.width,
                canvas.height
            )
        },
        [
            ready,
            resolvedKind,
            stageSize,
            perf,
            getSourceDimensions,
            getDrawRect,
            gridSize,
            cellGap,
            backgroundColor,
            backgroundMediaOpacity,
            backgroundMediaBlur,
            renderShape,
            organicDots,
            edgeSoftness,
            radiusCurve,
            motionMode,
            motionAmount,
            useScreenAngle,
            screenAngle,
            mouseInteraction,
            mouseMode,
            mouseRadius,
            mouseStrength,
            mouseSmoothness,
            animate,
            textFont,
            textScale,
            getDotFill,
            drawDot,
            isTextShape,
            getAnalysisKey,
            buildGridAnalysis,
        ]
    )

    const startLoop = React.useCallback(() => {
        stopAnimation()

        let frameCount = 0
        let lastMouseX = smoothMouseRef.current.x
        let lastMouseY = smoothMouseRef.current.y
        let lastMouseActive = smoothMouseRef.current.active

        const tick = (time: number) => {
            frameCount += 1

            const beforeX = smoothMouseRef.current.x
            const beforeY = smoothMouseRef.current.y
            const beforeActive = smoothMouseRef.current.active

            const shouldRenderVideo = resolvedKind === "video" && animate
            const shouldRenderStill = needsStillRenderRef.current
            const maybeMouse =
                mouseInteraction &&
                (targetMouseRef.current.active || needsStillRenderRef.current)

            if (shouldRenderVideo || shouldRenderStill || maybeMouse) {
                if (frameCount % perf.fpsDivisor === 0) {
                    renderFrame(time)
                    needsStillRenderRef.current = false

                    const moved =
                        Math.abs(smoothMouseRef.current.x - lastMouseX) >
                            0.75 ||
                        Math.abs(smoothMouseRef.current.y - lastMouseY) >
                            0.75 ||
                        smoothMouseRef.current.active !== lastMouseActive

                    lastMouseX = smoothMouseRef.current.x
                    lastMouseY = smoothMouseRef.current.y
                    lastMouseActive = smoothMouseRef.current.active

                    if (
                        !shouldRenderVideo &&
                        !targetMouseRef.current.active &&
                        !moved &&
                        !needsStillRenderRef.current
                    ) {
                        smoothMouseRef.current.active = false
                        stopAnimation()
                        return
                    }
                }
            } else {
                stopAnimation()
                return
            }

            if (
                Math.abs(beforeX - smoothMouseRef.current.x) > 0.001 ||
                Math.abs(beforeY - smoothMouseRef.current.y) > 0.001 ||
                beforeActive !== smoothMouseRef.current.active
            ) {
                needsStillRenderRef.current = true
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
    }, [
        renderFrame,
        stopAnimation,
        perf,
        resolvedKind,
        animate,
        mouseInteraction,
    ])

    React.useLayoutEffect(() => {
        const node = wrapperRef.current
        if (!node) return

        const measure = () => {
            const rect = node.getBoundingClientRect()
            const nextWidth = Math.max(1, Math.round(rect.width))
            const nextHeight = Math.max(1, Math.round(rect.height))

            setWrapperSize((prev) => {
                if (prev.width === nextWidth && prev.height === nextHeight) {
                    return prev
                }

                cachedGridRef.current = null
                needsStillRenderRef.current = true

                return {
                    width: nextWidth,
                    height: nextHeight,
                }
            })
        }

        measure()
        resizeObserverRef.current = new ResizeObserver(measure)
        resizeObserverRef.current.observe(node)

        return () => {
            resizeObserverRef.current?.disconnect()
            resizeObserverRef.current = null
        }
    }, [])

    React.useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
        }
    }, [])

    React.useEffect(() => {
        const node = wrapperRef.current
        if (!node) return

        const applyPointer = (event: PointerEvent) => {
            const rect = node.getBoundingClientRect()
            const localX = clamp(
                event.clientX - rect.left - padding,
                0,
                stageSize.width
            )
            const localY = clamp(
                event.clientY - rect.top - padding,
                0,
                stageSize.height
            )

            const prevX = targetMouseRef.current.x
            const prevY = targetMouseRef.current.y
            const prevActive = targetMouseRef.current.active

            targetMouseRef.current = {
                active: true,
                x: localX,
                y: localY,
            }

            if (!smoothMouseRef.current.active) {
                smoothMouseRef.current = {
                    active: true,
                    x: localX,
                    y: localY,
                }
            }

            if (
                Math.abs(prevX - localX) > 0.5 ||
                Math.abs(prevY - localY) > 0.5 ||
                !prevActive
            ) {
                needsStillRenderRef.current = true
                if (ready && rafRef.current === null) startLoop()
            }
        }

        const schedulePointer = (event: PointerEvent) => {
            lastPointerEventRef.current = event
            if (pointerTickRef.current !== null) return

            pointerTickRef.current = requestAnimationFrame((now) => {
                pointerTickRef.current = null
                if (now - lastPointerTimeRef.current < 16) return
                lastPointerTimeRef.current = now
                if (lastPointerEventRef.current) {
                    applyPointer(lastPointerEventRef.current)
                }
            })
        }

        const onPointerMove = (event: PointerEvent) => schedulePointer(event)
        const onPointerEnter = (event: PointerEvent) => schedulePointer(event)
        const onPointerLeave = () => {
            targetMouseRef.current.active = false
            needsStillRenderRef.current = true
            if (ready && rafRef.current === null) startLoop()
        }

        node.addEventListener("pointermove", onPointerMove, { passive: true })
        node.addEventListener("pointerenter", onPointerEnter, { passive: true })
        node.addEventListener("pointerleave", onPointerLeave, { passive: true })

        return () => {
            node.removeEventListener("pointermove", onPointerMove)
            node.removeEventListener("pointerenter", onPointerEnter)
            node.removeEventListener("pointerleave", onPointerLeave)
        }
    }, [padding, ready, stageSize.width, stageSize.height, startLoop])

    React.useEffect(() => {
        cleanupMedia()
        startTimeRef.current = 0
        cachedGridRef.current = null
        needsStillRenderRef.current = true

        if (resolvedKind === "image") {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"

            img.onload = () => {
                if (!mountedRef.current) return
                imageRef.current = img
                cachedGridRef.current = null
                setReady(true)
                needsStillRenderRef.current = true
            }

            img.onerror = () => {
                if (!mountedRef.current) return
                setReady(false)
            }

            img.src = safeSrc
            return cleanupMedia
        }

        const video = document.createElement("video")
        video.crossOrigin = "anonymous"
        video.playsInline = true
        video.preload = "auto"
        video.autoplay = autoplay
        video.loop = loop
        video.muted = muted
        video.src = safeSrc

        const onLoaded = async () => {
            if (!mountedRef.current) return
            videoRef.current = video
            cachedGridRef.current = null
            setReady(true)
            needsStillRenderRef.current = true
            if (autoplay) {
                try {
                    await video.play()
                } catch {}
            }
        }

        const onError = () => {
            if (!mountedRef.current) return
            setReady(false)
        }

        video.addEventListener("loadeddata", onLoaded)
        video.addEventListener("error", onError)

        return () => {
            video.removeEventListener("loadeddata", onLoaded)
            video.removeEventListener("error", onError)
            cleanupMedia()
        }
    }, [resolvedKind, safeSrc, autoplay, loop, muted, cleanupMedia])

    React.useEffect(() => {
        if (!ready) return
        needsStillRenderRef.current = true
        startLoop()
        return stopAnimation
    }, [ready, startLoop, stopAnimation])

    React.useEffect(() => {
        if (!ready) return
        cachedGridRef.current = null
        needsStillRenderRef.current = true
        if (rafRef.current === null) startLoop()
    }, [
        ready,
        stageSize.width,
        stageSize.height,
        gridSize,
        cellGap,
        brightness,
        contrast,
        gamma,
        smoothing,
        ditherType,
        renderShape,
        organicDots,
        edgeSoftness,
        radiusCurve,
        motionMode,
        motionAmount,
        useScreenAngle,
        screenAngle,
        mouseInteraction,
        mouseMode,
        mouseRadius,
        mouseStrength,
        mouseSmoothness,
        maskMode,
        chromaColor,
        maskThreshold,
        maskSoftness,
        backgroundColor,
        backgroundMediaOpacity,
        backgroundMediaBlur,
        dotColor,
        dotColor2,
        useDuotone,
        multicolor,
        textFont,
        textScale,
        fit,
        performanceMode,
        startLoop,
    ])

    return (
        <div
            ref={wrapperRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 600,
                minHeight: 400,
                position: "relative",
                overflow: "hidden",
                borderRadius,
                background: frameBackground,
                touchAction: "none",
                cursor: mouseInteraction ? "crosshair" : "default",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: padding,
                    top: padding,
                    right: padding,
                    bottom: padding,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: Math.max(0, borderRadius - padding * 0.25),
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        maxWidth: "100%",
                        maxHeight: "100%",
                    }}
                />
            </div>
        </div>
    )
}

HalftoneMaskedFX.defaultProps = {
    width: 600,
    height: 400,
    media: DEFAULT_MEDIA,
    grid: DEFAULT_GRID,
    shape: DEFAULT_SHAPE,
    mouse: DEFAULT_MOUSE,
    colors: DEFAULT_COLORS,
    mask: DEFAULT_MASK,
    layout: DEFAULT_LAYOUT,
}

addPropertyControls(HalftoneMaskedFX, {
    media: {
        type: ControlType.Object,
        title: "Media",
        controls: {
            preferUpload: {
                type: ControlType.Boolean,
                title: "Use Upload",
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Enable manual upload or use default media.",
            },
            mediaType: {
                type: ControlType.Enum,
                title: "Type",
                options: ["image", "video"],
                optionTitles: ["Image", "Video"],
            },
            uploadedMedia: {
                type: ControlType.File,
                title: "Upload File",
                allowedFileTypes: [
                    "mp4",
                    "webm",
                    "mov",
                    "m4v",
                    "ogg",
                    "gif",
                    "png",
                    "jpg",
                    "jpeg",
                    "webp",
                    "avif",
                ],
                hidden: (props: any) => !props?.preferUpload,
            },
            imageUrl: {
                type: ControlType.String,
                title: "Image Link",
                placeholder: "https://...",
                hidden: (props: any) =>
                    !props?.preferUpload || props?.mediaType !== "image",
            },
            videoSrc: {
                type: ControlType.String,
                title: "Video Link",
                placeholder: "https://...",
                hidden: (props: any) =>
                    !props?.preferUpload || props?.mediaType !== "video",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: (props: any) => props?.mediaType !== "video",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: (props: any) => props?.mediaType !== "video",
            },
            muted: {
                type: ControlType.Boolean,
                title: "Muted",
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (props: any) => props?.mediaType !== "video",
            },
            animate: {
                type: ControlType.Boolean,
                title: "Animate",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },

    grid: {
        type: ControlType.Object,
        title: "Grid",
        controls: {
            gridSize: {
                type: ControlType.Number,
                title: "Size",
                min: 1,
                max: 50,
                step: 1,
                displayStepper: true,
                description: "Lower values create denser cells.",
            },
            cellGap: {
                type: ControlType.Number,
                title: "Gap",
                min: -8,
                max: 16,
                step: 0.25,
                displayStepper: true,
            },
            brightness: {
                type: ControlType.Number,
                title: "Brightness",
                min: -100,
                max: 100,
                step: 1,
                displayStepper: true,
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                min: -100,
                max: 100,
                step: 1,
                displayStepper: true,
            },
            gamma: {
                type: ControlType.Number,
                title: "Gamma",
                min: 0.1,
                max: 3,
                step: 0.1,
                displayStepper: true,
            },
            smoothing: {
                type: ControlType.Number,
                title: "Smooth",
                min: 0,
                max: 5,
                step: 0.5,
                displayStepper: true,
            },
            ditherType: {
                type: ControlType.Enum,
                title: "Dither",
                options: [
                    "None",
                    "FloydSteinberg",
                    "JarvisJudiceNinke",
                    "Stucki",
                    "Burkes",
                    "Ordered",
                    "Noise",
                ],
                optionTitles: [
                    "None",
                    "Floyd",
                    "Jarvis",
                    "Stucki",
                    "Burkes",
                    "Ordered",
                    "Noise",
                ],
            },
        },
    },

    shape: {
        type: ControlType.Object,
        title: "Shape",
        controls: {
            renderShape: {
                type: ControlType.Enum,
                title: "Type",
                options: [
                    "circle",
                    "square",
                    "diamond",
                    "binary",
                    "bitmap",
                    "matrix",
                ],
                optionTitles: [
                    "Circle",
                    "Square",
                    "Diamond",
                    "Binary",
                    "Bitmap",
                    "Matrix",
                ],
                description: "Choose how each sampled cell is drawn.",
            },
            organicDots: {
                type: ControlType.Boolean,
                title: "Organic",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            edgeSoftness: {
                type: ControlType.Number,
                title: "Softness",
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
            radiusCurve: {
                type: ControlType.Number,
                title: "Radius",
                min: 0.4,
                max: 1.5,
                step: 0.02,
                displayStepper: true,
            },
            motionMode: {
                type: ControlType.Enum,
                title: "Motion",
                options: ["none", "pulse"],
                optionTitles: ["None", "Pulse"],
            },
            motionAmount: {
                type: ControlType.Number,
                title: "Motion Amt",
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
            useScreenAngle: {
                type: ControlType.Boolean,
                title: "Screen Angle",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            screenAngle: {
                type: ControlType.Number,
                title: "Angle",
                min: 0,
                max: 90,
                step: 1,
                displayStepper: true,
            },
            textFont: {
                type: ControlType.Font,
                title: "Font",
            },
            textScale: {
                type: ControlType.Number,
                title: "Text Scale",
                min: 0.2,
                max: 2,
                step: 0.05,
                displayStepper: true,
            },
        },
    },

    mouse: {
        type: ControlType.Object,
        title: "Mouse",
        controls: {
            mouseInteraction: {
                type: ControlType.Boolean,
                title: "Enabled",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            mouseMode: {
                type: ControlType.Enum,
                title: "Mode",
                options: [
                    "repel",
                    "attract",
                    "grow",
                    "ripple",
                    "gravity",
                    "explode",
                    "orbit",
                ],
                optionTitles: [
                    "Repel",
                    "Attract",
                    "Grow",
                    "Ripple",
                    "Gravity",
                    "Explode",
                    "Orbit",
                ],
            },
            mouseRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 20,
                max: 400,
                step: 1,
                displayStepper: true,
            },
            mouseStrength: {
                type: ControlType.Number,
                title: "Strength",
                min: 0,
                max: 3,
                step: 0.05,
                displayStepper: true,
            },
            mouseSmoothness: {
                type: ControlType.Number,
                title: "Smooth",
                min: 0.02,
                max: 1,
                step: 0.01,
                displayStepper: true,
                description: "Higher values feel softer and smoother.",
            },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Canvas BG",
            },
            dotColor: {
                type: ControlType.Color,
                title: "Dot 1",
            },
            dotColor2: {
                type: ControlType.Color,
                title: "Dot 2",
            },
            useDuotone: {
                type: ControlType.Boolean,
                title: "Duotone",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            multicolor: {
                type: ControlType.Boolean,
                title: "Multicolor",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            backgroundMediaOpacity: {
                type: ControlType.Number,
                title: "Img Fill",
                min: 0,
                max: 1,
                step: 0.01,
                displayStepper: true,
                description: "Blend original media under the halftone.",
            },
            backgroundMediaBlur: {
                type: ControlType.Number,
                title: "Fill Blur",
                min: 0,
                max: 24,
                step: 0.5,
                displayStepper: true,
            },
            frameBackground: {
                type: ControlType.Color,
                title: "Frame BG",
            },
        },
    },

    mask: {
        type: ControlType.Object,
        title: "Mask",
        controls: {
            maskMode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["none", "luma", "chroma"],
                optionTitles: ["None", "Luma", "Chroma"],
            },
            chromaColor: {
                type: ControlType.Enum,
                title: "Chroma",
                options: ["green", "blue"],
                optionTitles: ["Green", "Blue"],
            },
            maskThreshold: {
                type: ControlType.Number,
                title: "Threshold",
                min: 0,
                max: 1,
                step: 0.01,
                displayStepper: true,
            },
            maskSoftness: {
                type: ControlType.Number,
                title: "Softness",
                min: 0.01,
                max: 1,
                step: 0.01,
                displayStepper: true,
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["contain", "cover"],
                optionTitles: ["Contain", "Cover"],
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                step: 1,
                displayStepper: true,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 120,
                step: 1,
                displayStepper: true,
            },
            performanceMode: {
                type: ControlType.Enum,
                title: "Performance",
                options: ["low", "balanced", "high"],
                optionTitles: ["Low", "Balanced", "High"],
                description: "High = best quality, Low = lighter rendering.",
            },
        },
    },
})
