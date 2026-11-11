import * as React from "react"
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


/**
 * Heatmap / Gradient Map Effect
 * -----------------------------
 * Recreates Photoshop's "Gradient Map" adjustment: every pixel's luminance
 * (0-255) is remapped through a color gradient, exactly like the effect
 * shown in the Properties panel gradient map presets.
 *
 * Drop an image in, pick a gradient preset (or use the built-in Thermal /
 * Rainbow / Ironbow looks), and tune contrast + brightness to match the
 * source photo.
 */

// ---------- Gradient presets (color stops match common PS gradient maps) ----------

type Stop = { pos: number; color: [number, number, number] }

const PRESETS: Record<string, Stop[]> = {
    Thermal: [
        { pos: 0.0, color: [8, 10, 74] }, // deep navy
        { pos: 0.18, color: [30, 60, 200] }, // blue
        { pos: 0.36, color: [20, 190, 210] }, // cyan
        { pos: 0.5, color: [50, 200, 90] }, // green
        { pos: 0.62, color: [235, 225, 40] }, // yellow
        { pos: 0.76, color: [235, 110, 20] }, // orange
        { pos: 0.88, color: [235, 30, 90] }, // pink/red
        { pos: 1.0, color: [255, 245, 250] }, // near white
    ],
    Ironbow: [
        { pos: 0.0, color: [0, 0, 20] },
        { pos: 0.25, color: [80, 0, 140] },
        { pos: 0.5, color: [200, 30, 40] },
        { pos: 0.75, color: [250, 160, 20] },
        { pos: 1.0, color: [255, 255, 220] },
    ],
    Rainbow: [
        { pos: 0.0, color: [10, 10, 40] },
        { pos: 0.2, color: [120, 30, 200] },
        { pos: 0.4, color: [30, 90, 235] },
        { pos: 0.55, color: [30, 210, 210] },
        { pos: 0.7, color: [80, 220, 60] },
        { pos: 0.85, color: [240, 220, 40] },
        { pos: 1.0, color: [235, 40, 60] },
    ],
    "Neon Magenta": [
        { pos: 0.0, color: [15, 5, 40] },
        { pos: 0.3, color: [60, 20, 160] },
        { pos: 0.55, color: [220, 30, 180] },
        { pos: 0.75, color: [255, 140, 60] },
        { pos: 1.0, color: [255, 240, 120] },
    ],
    "Classic Heat": [
        { pos: 0.0, color: [0, 0, 0] },
        { pos: 0.4, color: [160, 10, 10] },
        { pos: 0.7, color: [240, 160, 10] },
        { pos: 1.0, color: [255, 255, 255] },
    ],
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

// Precompute a 256-entry lookup table for a given set of stops
function buildLUT(stops: Stop[]): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256 * 3)
    const sorted = [...stops].sort((a, b) => a.pos - b.pos)
    for (let i = 0; i < 256; i++) {
        const t = i / 255
        let lo = sorted[0]
        let hi = sorted[sorted.length - 1]
        for (let s = 0; s < sorted.length - 1; s++) {
            if (t >= sorted[s].pos && t <= sorted[s + 1].pos) {
                lo = sorted[s]
                hi = sorted[s + 1]
                break
            }
        }
        const span = hi.pos - lo.pos || 1
        const localT = (t - lo.pos) / span
        lut[i * 3 + 0] = lerp(lo.color[0], hi.color[0], localT)
        lut[i * 3 + 1] = lerp(lo.color[1], hi.color[1], localT)
        lut[i * 3 + 2] = lerp(lo.color[2], hi.color[2], localT)
    }
    return lut
}

// ---------- Performance limits ----------

// Longest side (in px) of the working canvas. The per-pixel loop is the
// expensive part, so capping resolution bounds the main-thread cost no
// matter how large the source image is. The editor gets a lower cap so
// dragging sliders in the Framer canvas stays responsive.
const MAX_DIMENSION_PUBLISHED = 1600
const MAX_DIMENSION_EDITOR = 640

// Wait briefly after the last settings change before reprocessing, so
// dragging a slider doesn't queue a full pass for every intermediate value.
const SETTINGS_DEBOUNCE_MS = 60

function getMaxDimension() {
    return RenderTarget.current() === RenderTarget.canvas
        ? MAX_DIMENSION_EDITOR
        : MAX_DIMENSION_PUBLISHED
}

// ---------- Component ----------

type ImageProp = string | { src: string } | undefined

function getImageSrc(image: ImageProp): string | undefined {
    if (!image) return undefined
    if (typeof image === "string") return image
    return image.src
}

interface Props {
    image?: ImageProp
    preset: keyof typeof PRESETS
    contrast: number // -100..100
    brightness: number // -100..100
    invert: boolean
    grainReduction: number // 0..100, simple blur before mapping
    style?: React.CSSProperties
}

function HeatmapEffect(props: Props) {
    const {
        image,
        preset,
        contrast,
        brightness,
        invert,
        grainReduction,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imgRef = useRef<HTMLImageElement | null>(null)
    const [imageReady, setImageReady] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const src = getImageSrc(image)

    // 1) Load the image once per source. Settings changes reuse the loaded
    //    image instead of re-fetching/decoding it.
    useEffect(() => {
        imgRef.current = null
        setImageReady(false)
        setErrorMsg(null)
        if (!src) return

        let cancelled = false

        const tryLoad = (useCors: boolean) => {
            const img = new Image()
            if (useCors) img.crossOrigin = "anonymous"
            img.onload = () => {
                if (cancelled) return
                imgRef.current = img
                setImageReady(true)
            }
            img.onerror = () => {
                if (cancelled) return
                if (useCors) {
                    // Retry without crossOrigin — the effect can still work,
                    // it just can't be re-exported/re-processed cross-origin
                    // if the host doesn't send CORS headers.
                    tryLoad(false)
                } else {
                    setErrorMsg(
                        "Couldn't load this image (network or format error)."
                    )
                }
            }
            img.src = src
        }

        tryLoad(true)

        return () => {
            cancelled = true
        }
    }, [src])

    // 2) Apply the gradient map whenever the image or settings change.
    //    Debounced, scheduled on an animation frame, and run on a
    //    downscaled canvas to keep main-thread work small.
    useEffect(() => {
        const img = imgRef.current
        if (!imageReady || !img) return

        let cancelled = false
        let rafId = 0

        const timeoutId = window.setTimeout(() => {
            rafId = window.requestAnimationFrame(() => {
                if (cancelled) return
                const error = render(img)
                setErrorMsg(error)
            })
        }, SETTINGS_DEBOUNCE_MS)

        return () => {
            cancelled = true
            window.clearTimeout(timeoutId)
            if (rafId) window.cancelAnimationFrame(rafId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageReady, preset, contrast, brightness, invert, grainReduction])

    // Returns an error message, or null on success.
    function render(img: HTMLImageElement): string | null {
        const canvas = canvasRef.current
        if (!canvas) return null

        const srcW = img.naturalWidth
        const srcH = img.naturalHeight
        if (!srcW || !srcH) return null

        // Downscale so the longest side fits within the cap (never upscale).
        const scale = Math.min(1, getMaxDimension() / Math.max(srcW, srcH))
        const w = Math.max(1, Math.round(srcW * scale))
        const h = Math.max(1, Math.round(srcH * scale))

        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return null

        // Optional soft blur pre-pass to tame sensor noise, mimicking a
        // slight "reduce grain" step before applying the gradient map.
        // Scaled with the downscale factor so the look stays consistent.
        const blurPx = (grainReduction / 100) * 3 * scale
        ctx.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none"
        ctx.drawImage(img, 0, 0, w, h)
        ctx.filter = "none"

        let imageData: ImageData
        try {
            imageData = ctx.getImageData(0, 0, w, h)
        } catch (e) {
            // Canvas got "tainted" by a cross-origin image with no CORS
            // headers — pixel access is blocked by the browser. Leave the
            // plain (unprocessed) image visible and surface the reason.
            return "This image's host doesn't allow pixel access (CORS), so the gradient map can't be applied. Try re-uploading it directly in Framer instead of linking an external URL."
        }
        const data = imageData.data

        const contrastFactor =
            (259 * (contrast + 255)) / (255 * (259 - contrast))
        const lut = buildLUT(PRESETS[preset] ?? PRESETS.Thermal)

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            // Perceptual luminance (Rec. 601-ish, matches PS grayscale conv.)
            let lum = 0.299 * r + 0.587 * g + 0.114 * b

            // Brightness + contrast, same formula PS uses under the hood
            lum = contrastFactor * (lum - 128) + 128 + brightness
            lum = Math.max(0, Math.min(255, lum))

            if (invert) lum = 255 - lum

            const idx = Math.round(lum) * 3
            data[i] = lut[idx]
            data[i + 1] = lut[idx + 1]
            data[i + 2] = lut[idx + 2]
            // alpha (data[i+3]) untouched
        }

        ctx.putImageData(imageData, 0, 0)
        return null
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0B0B10",
                overflow: "hidden",
                ...style,
            }}
        >
            {src ? (
                <>
                    <canvas
                        ref={canvasRef}
                        role="img"
                        aria-label="Image with gradient map effect applied"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: errorMsg ? "none" : "block",
                        }}
                    />
                    {errorMsg && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            style={{
                                color: "#f5a3a3",
                                fontFamily: "Inter, sans-serif",
                                fontSize: 12,
                                lineHeight: 1.5,
                                textAlign: "center",
                                padding: 20,
                                maxWidth: 320,
                            }}
                        >
                            {errorMsg}
                        </div>
                    )}
                </>
            ) : (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        color: "#666",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        textAlign: "center",
                        padding: 16,
                    }}
                >
                    Add an image in the properties panel
                </div>
            )}
        </div>
    )
}

HeatmapEffect.defaultProps = {
    preset: "Thermal",
    contrast: 20,
    brightness: 0,
    invert: false,
    grainReduction: 20,
}

addPropertyControls(HeatmapEffect, {
    image: {
        type: ControlType.Image,
        title: "Image",
    },
    preset: {
        type: ControlType.Enum,
        title: "Gradient",
        options: Object.keys(PRESETS),
        optionTitles: Object.keys(PRESETS),
        defaultValue: "Thermal",
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 20,
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
    },
    invert: {
        type: ControlType.Boolean,
        title: "Invert",
        defaultValue: false,
    },
    grainReduction: {
        type: ControlType.Number,
        title: "Smooth",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 20,
        description: "Softens noise before the gradient map is applied",
    },
})

export default HeatmapEffect
