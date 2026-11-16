// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"
// All executable segmentation code is bundled at publish via npm — no
// runtime JS or WASM from CDNs (per Framer review). The only remote fetch
// is the model weights below: non-executable data, version-pinned.
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import { loadGraphModel } from "@tensorflow/tfjs-converter"

/**
 * GridMosaic v2 — the AE "grid takeover" effect with automatic subject cutout.
 *
 * Drop in a normal video or image. The component rotoscopes the subject
 * in-browser (MediaPipe selfie segmentation, lazy-loaded only when the
 * component scrolls into view), builds the matte per frame, and composites:
 *
 *   auto cutout → live matte → per-cell mosaic + exposure jitter →
 *   canvas alpha compositing (= Track Matte Key) → grid overlay
 *
 * Cutout modes:
 *   Auto      — any footage/photo of a person. Zero prep. Engine is
 *               bundled; ~1 MB model weights fetched once when visible.
 *   Pre-keyed — alpha WebM/HEVC if you already have roto'd footage.
 *               Best edge quality, zero external fetches (marketplace-safe).
 *
 * One canvas, detached media elements, no per-tile DOM.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */

// Model weights (non-executable data), loaded lazily on first visibility.
// Version-pinned path — content is fixed post-review.
const TFJS_MODEL =
    "https://storage.googleapis.com/tfhub-tfjs-modules/mediapipe/tfjs-model/selfie_segmentation/general/1/model.json"
const SEG_SIZE = 256 // the model's native input resolution

function mulberry32(a: number) {
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

type Cell = {
    tint: number
    mosaic: boolean
    cover: boolean
    dx: number
    dy: number
}

function buildCells(
    seed: number,
    cols: number,
    rows: number,
    mosaicAmount: number,
    coverAmount: number,
    shuffleAmount: number,
    tintJitter: number
): Cell[] {
    const rnd = mulberry32(seed)
    const cells: Cell[] = []
    for (let i = 0; i < cols * rows; i++) {
        const shuffled = rnd() < shuffleAmount
        cells.push({
            tint: (rnd() - 0.5) * tintJitter,
            mosaic: rnd() < mosaicAmount,
            cover: rnd() < coverAmount,
            dx: shuffled ? Math.round((rnd() - 0.5) * 4) : 0,
            dy: shuffled ? Math.round((rnd() - 0.5) * 4) : 0,
        })
    }
    return cells
}

// cover-fit: canvas rect -> source rect in media coordinates.
// zoom > 1 overscans so pan (in canvas px) has slack to move within.
function coverMap(
    mw: number,
    mh: number,
    W: number,
    H: number,
    zoom = 1,
    panX = 0,
    panY = 0
) {
    const s = Math.max(W / mw, H / mh) * zoom
    const slackX = (mw * s - W) / 2
    const slackY = (mh * s - H) / 2
    const ox = slackX + Math.max(-slackX, Math.min(slackX, panX))
    const oy = slackY + Math.max(-slackY, Math.min(slackY, panY))
    return (x: number, y: number, w: number, h: number) =>
        [(x + ox) / s, (y + oy) / s, w / s, h / s] as const
}

export default function GridMosaic(props: any) {
    const {
        mode = "video",
        cutout = "auto",
        subjectVideo,
        subjectWebm,
        subjectHevc,
        subjectImage,
        backgroundVideo,
        backgroundImage,
        bgDirection = "forward",
        parallax = "scroll",
        parallaxStrength = 0.5,
        columns = 7,
        rows = 5,
        seed = 7,
        mosaicAmount = 0.18,
        pixelSize = 14,
        coverAmount = 0.06,
        shuffleAmount = 0.3,
        tintJitter = 0.5,
        maskFeather = 0.5,
        segmentFPS = 24,
        subjectFit = "contain",
        subjectScale = 1,
        subjectX = 0,
        subjectY = 0,
        outlineWidth = 6,
        outlineColor = "#FFFFFF",
        outlineOpacity = 1,
        bwSubject = false,
        bgSaturation = 0.85,
        gridColor = "#0d0d0d",
        gridOpacity = 0.55,
        lineWidth = 1,
        animateCells = true,
        animateInterval = 900,
        headline = "social",
        headlineFont,
        headlineColor = "#F5F4EF",
        headlineCol = 0.3,
        headlineRow = 1.5,
        hoverEffect = "pixelate",
        hoverRadius = 0.35,
        ariaLabel = "Grid video collage",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        let raf = 0
        let disposed = false
        let visible = false
        let cellSeed = seed
        let cells = buildCells(
            cellSeed,
            columns,
            rows,
            mosaicAmount,
            coverAmount,
            shuffleAmount,
            tintJitter
        )
        // rendered state eases toward `cells` targets every frame, so
        // re-rolls drift and fade instead of flashing
        const live = cells.map((c) => ({
            tint: c.tint,
            mos: c.mosaic ? 1 : 0,
            cov: c.cover ? 1 : 0,
            ox: c.dx,
            oy: c.dy,
        }))

        // ---- buffers -----------------------------------------------------
        const subjBuf = document.createElement("canvas") // masked subject
        const subjCtx = subjBuf.getContext("2d")!
        const pixBuf = document.createElement("canvas") // mosaic scratch
        const pixCtx = pixBuf.getContext("2d")!
        const maskBuf = document.createElement("canvas") // segmentation matte
        const maskCtx = maskBuf.getContext("2d")!
        const segInput = document.createElement("canvas") // ~256px model feed
        const segCtx = segInput.getContext("2d")!
        const outlineBuf = document.createElement("canvas") // decoupage edge
        const outCtx = outlineBuf.getContext("2d")!
        let maskReady = false // an up-to-date matte exists
        let maskImageData: ImageData | null = null
        let maskPrev: Float32Array | null = null // temporal smoothing

        // ---- media -------------------------------------------------------
        let bgMedia: HTMLVideoElement | HTMLImageElement | null = null
        let fgMedia: HTMLVideoElement | HTMLImageElement | null = null

        function makeVideo(sources: { src: string; type: string }[]) {
            const v = document.createElement("video")
            v.muted = true
            v.loop = true
            v.playsInline = true
            v.crossOrigin = "anonymous"
            v.preload = "metadata" // full download starts on first play()
            for (const s of sources) {
                if (!s.src) continue
                const el = document.createElement("source")
                el.src = s.src
                if (s.type) el.type = s.type
                v.appendChild(el)
            }
            v.load()
            return v
        }

        function makeImage(src: string, onload?: () => void) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.src = src
            img.onload = () => {
                onload?.()
                draw()
            }
            return img
        }

        if (!isStatic) {
            // background
            if (mode === "video" && backgroundVideo) {
                bgMedia = makeVideo([{ src: backgroundVideo, type: "" }])
                // reverse stepping seeks constantly — needs the data resident
                if (bgDirection === "reverse") bgMedia.preload = "auto"
            }
            if (mode === "image" && backgroundImage)
                bgMedia = makeImage(backgroundImage)

            // subject
            if (mode === "video") {
                if (cutout === "auto" && subjectVideo) {
                    fgMedia = makeVideo([{ src: subjectVideo, type: "" }])
                } else if (cutout === "alpha") {
                    const s = []
                    if (subjectHevc)
                        s.push({
                            src: subjectHevc,
                            type: 'video/mp4; codecs="hvc1"',
                        })
                    if (subjectWebm)
                        s.push({ src: subjectWebm, type: "video/webm" })
                    if (s.length) fgMedia = makeVideo(s)
                }
            } else if (subjectImage) {
                fgMedia = makeImage(subjectImage, () => {
                    if (cutout === "auto") segmentImageOnce()
                })
            }
        }

        function mediaSize(m: HTMLVideoElement | HTMLImageElement | null) {
            if (!m) return null
            if (m instanceof HTMLVideoElement) {
                if (m.readyState < 2 || !m.videoWidth) return null
                return { w: m.videoWidth, h: m.videoHeight }
            }
            if (!m.complete || !m.naturalWidth) return null
            return { w: m.naturalWidth, h: m.naturalHeight }
        }

        // ---- automatic cutout (bundled tfjs, lazy weights) ---------------
        let segmenter: any = null
        let segmenterLoading = false
        let segmenterFailed = false
        let segBusy = false
        let lastSegAt = 0

        async function loadSegmenter() {
            if (segmenter || segmenterLoading || segmenterFailed) return
            segmenterLoading = true
            try {
                // Executable code (tfjs) is bundled with the component.
                // Only the model weights (data) load here, once, on first
                // visibility.
                try {
                    await tf.setBackend("webgl")
                } catch {
                    await tf.setBackend("cpu")
                }
                await tf.ready()
                segmenter = await loadGraphModel(TFJS_MODEL)
                if (disposed) {
                    segmenter.dispose?.()
                    segmenter = null
                    return
                }
                if (mode === "image") segmentImageOnce()
            } catch (e) {
                segmenterFailed = true
                console.warn(
                    "[GridMosaic] auto cutout unavailable, showing subject unmasked:",
                    e
                )
            } finally {
                segmenterLoading = false
            }
        }

        // Stretch the footage to the model's square input. The mask comes
        // back square too and un-stretches when drawn into the subject rect.
        function fillSegInput(): boolean {
            const size = mediaSize(fgMedia)
            if (!fgMedia || !size) return false
            if (segInput.width !== SEG_SIZE || segInput.height !== SEG_SIZE) {
                segInput.width = SEG_SIZE
                segInput.height = SEG_SIZE
            }
            segCtx.drawImage(fgMedia, 0, 0, SEG_SIZE, SEG_SIZE)
            return true
        }

        // Fold soft mask values (0..1 per pixel) into the matte canvas with
        // the feather ramp and temporal EMA (smooths edges across frames).
        function applyMaskValues(vals: Float32Array, mw: number, mh: number) {
            if (maskBuf.width !== mw || maskBuf.height !== mh) {
                maskBuf.width = mw
                maskBuf.height = mh
                maskImageData = null
                maskPrev = null
            }
            if (!maskImageData) maskImageData = maskCtx.createImageData(mw, mh)
            const px = maskImageData.data
            const n = mw * mh
            // soften the confidence edge: feather widens the ramp
            const lo = 0.5 - 0.35 * maskFeather
            const hi = 0.5 + 0.35 * maskFeather
            const inv = 1 / Math.max(hi - lo, 0.001)
            if (!maskPrev || maskPrev.length !== n) maskPrev = null
            const hadPrev = maskPrev !== null
            if (!maskPrev) maskPrev = new Float32Array(n)
            for (let i = 0; i < n; i++) {
                let a = (vals[i] - lo) * inv
                a = a < 0 ? 0 : a > 1 ? 1 : a
                // temporal EMA: 55% new, 45% previous — kills edge flicker
                if (hadPrev) a = maskPrev[i] * 0.45 + a * 0.55
                maskPrev[i] = a
                px[i * 4 + 3] = (a * 255) | 0
            }
            maskCtx.putImageData(maskImageData, 0, 0)
            maskReady = true
        }

        async function runSegmentation() {
            if (!segmenter || segBusy) return
            if (!fillSegInput()) return
            segBusy = true
            try {
                const out = tf.tidy(() => {
                    const x = tf.browser.fromPixels(segInput)
                    const inp = tf.expandDims(
                        tf.div(tf.cast(x, "float32"), 255),
                        0
                    )
                    let y: any = segmenter.predict(inp)
                    if (Array.isArray(y)) y = y[0]
                    return tf.squeeze(y)
                })
                const data = (await out.data()) as Float32Array
                out.dispose()
                const n = SEG_SIZE * SEG_SIZE
                let vals: Float32Array
                if (data.length === n) {
                    vals = data
                } else if (data.length === 2 * n) {
                    // two-class output: take the person channel
                    vals = new Float32Array(n)
                    for (let i = 0; i < n; i++) vals[i] = data[i * 2 + 1]
                } else {
                    vals = data.subarray(0, n) as Float32Array
                }
                // defensively map logits to probabilities if the converted
                // model skips the final sigmoid
                let mn = 1
                let mx = 0
                for (let i = 0; i < n; i += 997) {
                    const v = vals[i]
                    if (v < mn) mn = v
                    if (v > mx) mx = v
                }
                if (mn < -0.01 || mx > 1.01) {
                    const sig = new Float32Array(n)
                    for (let i = 0; i < n; i++)
                        sig[i] = 1 / (1 + Math.exp(-vals[i]))
                    vals = sig
                }
                applyMaskValues(vals, SEG_SIZE, SEG_SIZE)
            } catch (e) {
                /* skip frame */
            } finally {
                segBusy = false
            }
        }

        function segmentImageOnce() {
            if (!(fgMedia instanceof HTMLImageElement)) return
            if (!fgMedia.complete || !fgMedia.naturalWidth) return
            runSegmentation().then(() => draw())
        }

        function segmentVideoFrame(now: number) {
            if (!segmenter || !(fgMedia instanceof HTMLVideoElement)) return
            if (fgMedia.readyState < 2) return
            if (now - lastSegAt < 1000 / Math.max(segmentFPS, 1)) return
            lastSegAt = now
            runSegmentation()
        }

        // Where the subject sits inside the canvas: Fit shows the whole
        // person, Fill crops like the background. Scale/X/Y nudge from there.
        function subjectRect(mw: number, mh: number, W: number, H: number) {
            const base =
                subjectFit === "cover"
                    ? Math.max(W / mw, H / mh)
                    : Math.min(W / mw, H / mh)
            const s = base * subjectScale
            const dw = mw * s
            const dh = mh * s
            let dx = (W - dw) / 2 + (subjectX / 100) * W
            let dy = (H - dh) / 2 + (subjectY / 100) * H
            // depth: subject drifts slightly against the background pan
            if (parallaxOn) {
                dx -= parEX * 0.35
                dy -= parEY * 0.35
            }
            return [dx, dy, dw, dh] as const
        }

        const canBlur =
            typeof CanvasRenderingContext2D !== "undefined" &&
            "filter" in CanvasRenderingContext2D.prototype

        // Build the masked (and optionally B&W) subject into subjBuf.
        // Returns true when there is a subject to draw.
        function composeSubject(W: number, H: number): boolean {
            const size = mediaSize(fgMedia)
            if (!fgMedia || !size) return false
            const needsMask = cutout === "auto"
            if (needsMask && !maskReady && !segmenterFailed) return false

            if (subjBuf.width !== W || subjBuf.height !== H) {
                subjBuf.width = W
                subjBuf.height = H
            }
            const [dx, dy, dw, dh] = subjectRect(size.w, size.h, W, H)

            subjCtx.clearRect(0, 0, W, H)
            subjCtx.imageSmoothingEnabled = true
            subjCtx.drawImage(fgMedia, dx, dy, dw, dh)

            // matte, softened — hides the stair-steps of the 256px model mask
            if (needsMask && maskReady) {
                subjCtx.globalCompositeOperation = "destination-in"
                if (canBlur)
                    subjCtx.filter = `blur(${(0.5 + maskFeather * 2) * dpr}px)`
                subjCtx.drawImage(maskBuf, dx, dy, dw, dh)
                if (canBlur) subjCtx.filter = "none"
                subjCtx.globalCompositeOperation = "source-over"
            }

            if (bwSubject) {
                subjCtx.globalCompositeOperation = "saturation"
                subjCtx.fillStyle = "rgb(128,128,128)"
                subjCtx.fillRect(0, 0, W, H)
                // the gray fill flattens alpha — restore it from the buffer
                subjCtx.globalCompositeOperation = "destination-in"
                subjCtx.drawImage(fgMedia, dx, dy, dw, dh)
                if (needsMask && maskReady) {
                    if (canBlur)
                        subjCtx.filter = `blur(${(0.5 + maskFeather * 2) * dpr}px)`
                    subjCtx.drawImage(maskBuf, dx, dy, dw, dh)
                    if (canBlur) subjCtx.filter = "none"
                }
                subjCtx.globalCompositeOperation = "source-over"
            }
            return true
        }

        // ---- hover -------------------------------------------------------
        // Target and eased pointer positions in canvas pixels. Far offscreen
        // by default so strength is zero until the pointer actually enters.
        let ptX = -1e6
        let ptY = -1e6
        let hovX = -1e6
        let hovY = -1e6
        let loopActive = false
        let hoverPending = false

        function hoverStrength(cx: number, cy: number, W: number, H: number) {
            if (hoverEffect === "none") return 0
            const R = hoverRadius * Math.min(W, H)
            if (R <= 0) return 0
            const d = Math.hypot(cx - hovX, cy - hovY)
            return d >= R ? 0 : 1 - d / R
        }

        function hoverLoop() {
            hoverPending = false
            if (disposed) return
            draw()
            // keep easing toward the pointer/parallax targets until settled
            if (
                Math.abs(ptX - hovX) + Math.abs(ptY - hovY) > 0.5 ||
                Math.abs(parX - parEX) + Math.abs(parY - parEY) > 0.5
            ) {
                hoverPending = true
                requestAnimationFrame(hoverLoop)
            }
        }

        function requestHoverDraw() {
            // the main video loop already redraws every frame
            if (loopActive || hoverPending) return
            hoverPending = true
            requestAnimationFrame(hoverLoop)
        }

        // ---- parallax (image mode) --------------------------------------
        // The background samples through a slightly overscanned window that
        // pans with scroll or the cursor; the subject counter-shifts a touch
        // for depth. Targets are set here, eased in draw().
        const parallaxOn =
            mode === "image" && parallax !== "off" && !reducedMotion
        let parX = 0
        let parY = 0
        let parEX = 0
        let parEY = 0

        function onScroll() {
            const rect = canvas.getBoundingClientRect()
            if (!rect.height) return
            const vh = window.innerHeight || 1
            // -1 … 1 as the element travels through the viewport
            const p = (rect.top + rect.height / 2 - vh / 2) / vh
            parY = -p * parallaxStrength * canvas.height * 0.25
            requestHoverDraw()
        }

        function onPointerMove(e: PointerEvent) {
            const rect = canvas.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            ptX = (e.clientX - rect.left) * (canvas.width / rect.width)
            ptY = (e.clientY - rect.top) * (canvas.height / rect.height)
            if (parallaxOn && parallax === "pointer") {
                parX = -(ptX - canvas.width / 2) * parallaxStrength * 0.12
                parY = -(ptY - canvas.height / 2) * parallaxStrength * 0.12
            }
            requestHoverDraw()
        }

        function onPointerLeave() {
            ptX = -1e6
            ptY = -1e6
            if (parallaxOn && parallax === "pointer") {
                parX = 0
                parY = 0
            }
            requestHoverDraw()
        }

        function onPointerEnd(e: PointerEvent) {
            // touch pointers often skip pointerleave — reset on lift/cancel
            if (e.type === "pointercancel" || e.pointerType !== "mouse")
                onPointerLeave()
        }

        // cursor-following animation is motion — skip it entirely for
        // prefers-reduced-motion users
        const wantsPointer =
            hoverEffect !== "none" || (parallaxOn && parallax === "pointer")
        if (wantsPointer && !reducedMotion) {
            canvas.addEventListener("pointermove", onPointerMove)
            canvas.addEventListener("pointerleave", onPointerLeave)
            canvas.addEventListener("pointerup", onPointerEnd)
            canvas.addEventListener("pointercancel", onPointerEnd)
        }
        if (parallaxOn && parallax === "scroll") {
            window.addEventListener("scroll", onScroll, { passive: true })
            onScroll()
        }

        // ---- drawing -----------------------------------------------------
        function draw() {
            if (disposed) return
            const W = canvas.width
            const H = canvas.height
            if (!W || !H) return

            // eased pointer trail — draw() runs once per frame in every loop
            hovX += (ptX - hovX) * 0.28
            hovY += (ptY - hovY) * 0.28
            if (hovX < -1e5) {
                hovX = ptX
                hovY = ptY
            }
            parEX += (parX - parEX) * 0.1
            parEY += (parY - parEY) * 0.1

            // ease every cell toward its target state (~smooth 0.4s settle)
            const ek = 0.08
            for (let i = 0; i < cells.length; i++) {
                const T = cells[i]
                const L = live[i]
                L.tint += (T.tint - L.tint) * ek
                L.mos += ((T.mosaic ? 1 : 0) - L.mos) * ek
                L.cov += ((T.cover ? 1 : 0) - L.cov) * ek
                L.ox += (T.dx - L.ox) * ek
                L.oy += (T.dy - L.oy) * ek
            }

            const cw = W / columns
            const ch = H / rows

            ctx.clearRect(0, 0, W, H)
            ctx.imageSmoothingEnabled = true

            // resolve the background source: live media, or a frame from
            // the reverse buffer once it's captured
            let bgM: CanvasImageSource | null = bgMedia
            let bgSize = mediaSize(bgMedia)
            if (bgDirection === "reverse" && revReady && revFrames.length) {
                const f = revFrames[revIdx]
                bgM = f
                bgSize = { w: f.width, h: f.height }
            }
            const bgZoom = parallaxOn ? 1 + parallaxStrength * 0.3 : 1

            // 1 — background, per cell: offset sampling + exposure jitter
            if (bgM && bgSize) {
                const map = coverMap(
                    bgSize.w,
                    bgSize.h,
                    W,
                    H,
                    bgZoom,
                    parEX,
                    parEY
                )
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < columns; c++) {
                        const L = live[r * columns + c]
                        const x = c * cw
                        const y = r * ch
                        // sample position, shifted for "shuffled" tiles, clamped
                        let ox = L.ox * cw
                        let oy = L.oy * ch
                        if (hoverEffect === "scramble") {
                            const hs = hoverStrength(
                                x + cw / 2,
                                y + ch / 2,
                                W,
                                H
                            )
                            if (hs > 0) {
                                // per-cell direction via golden-angle hash
                                const a = (r * columns + c) * 2.39996
                                ox += Math.cos(a) * hs * cw * 1.4
                                oy += Math.sin(a) * hs * ch * 1.4
                            }
                        }
                        const sxCanvas = Math.min(Math.max(x + ox, 0), W - cw)
                        const syCanvas = Math.min(Math.max(y + oy, 0), H - ch)
                        const [sx, sy, sw, sh] = map(sxCanvas, syCanvas, cw, ch)
                        ctx.drawImage(bgM, sx, sy, sw, sh, x, y, cw, ch)
                        if (Math.abs(L.tint) > 0.01) {
                            ctx.fillStyle =
                                L.tint > 0
                                    ? `rgba(255,255,240,${Math.min(L.tint, 0.5)})`
                                    : `rgba(0,0,0,${Math.min(-L.tint, 0.5)})`
                            ctx.fillRect(x, y, cw, ch)
                        }
                    }
                }
                if (bgSaturation < 1) {
                    ctx.globalCompositeOperation = "saturation"
                    ctx.fillStyle = `rgba(128,128,128,${1 - bgSaturation})`
                    ctx.fillRect(0, 0, W, H)
                    ctx.globalCompositeOperation = "source-over"
                }
            } else {
                ctx.fillStyle = "#1a1a1a"
                ctx.fillRect(0, 0, W, H)
            }

            // 2 — subject over background (matte handled in composeSubject)
            if (composeSubject(W, H)) {
                // decoupage edge: the silhouette, dilated and filled white,
                // drawn underneath — the paper-cutout look of the original
                const matteOk = cutout !== "auto" || maskReady
                if (outlineWidth > 0 && outlineOpacity > 0 && matteOk) {
                    if (outlineBuf.width !== W || outlineBuf.height !== H) {
                        outlineBuf.width = W
                        outlineBuf.height = H
                    }
                    outCtx.clearRect(0, 0, W, H)
                    const ow = outlineWidth * dpr
                    for (let i = 0; i < 12; i++) {
                        const a = (i / 12) * Math.PI * 2
                        outCtx.drawImage(
                            subjBuf,
                            Math.cos(a) * ow,
                            Math.sin(a) * ow
                        )
                    }
                    for (let i = 0; i < 6; i++) {
                        const a = (i / 6) * Math.PI * 2 + 0.4
                        outCtx.drawImage(
                            subjBuf,
                            Math.cos(a) * ow * 0.55,
                            Math.sin(a) * ow * 0.55
                        )
                    }
                    outCtx.globalCompositeOperation = "source-in"
                    outCtx.fillStyle = outlineColor
                    outCtx.fillRect(0, 0, W, H)
                    outCtx.globalCompositeOperation = "source-over"
                    ctx.globalAlpha = outlineOpacity
                    ctx.drawImage(outlineBuf, 0, 0)
                    ctx.globalAlpha = 1
                }
                ctx.drawImage(subjBuf, 0, 0)

                // cover cells + reveal hover: background wins back in tiles
                if (bgM && bgSize) {
                    const bmap = coverMap(
                        bgSize.w,
                        bgSize.h,
                        W,
                        H,
                        bgZoom,
                        parEX,
                        parEY
                    )
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < columns; c++) {
                            const L = live[r * columns + c]
                            const x = c * cw
                            const y = r * ch
                            let a = L.cov
                            if (hoverEffect === "reveal") {
                                const hs = hoverStrength(
                                    x + cw / 2,
                                    y + ch / 2,
                                    W,
                                    H
                                )
                                a = Math.max(a, hs * 0.95)
                            }
                            if (a <= 0.01) continue
                            const [bx, by, bw2, bh2] = bmap(x, y, cw, ch)
                            ctx.globalAlpha = a
                            ctx.drawImage(bgM, bx, by, bw2, bh2, x, y, cw, ch)
                            ctx.globalAlpha = 1
                        }
                    }
                }
            }

            // 3 — mosaic pass on flagged cells (+ pixelate hover)
            const basePx = Math.max(2, pixelSize)
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < columns; c++) {
                    const L = live[r * columns + c]
                    const x = c * cw
                    const y = r * ch
                    let px = L.mos > 0.05 ? basePx * L.mos : 0
                    if (hoverEffect === "pixelate") {
                        const hs = hoverStrength(x + cw / 2, y + ch / 2, W, H)
                        // ramps from ~2px blocks at the radius edge instead
                        // of popping straight to half-size chunks
                        const hp = hs * basePx * 1.5
                        if (hp >= 2.5) px = Math.max(px, hp)
                    }
                    if (px < 2.5) continue
                    const tw = Math.max(1, Math.round(cw / px))
                    const th = Math.max(1, Math.round(ch / px))
                    if (pixBuf.width !== tw || pixBuf.height !== th) {
                        pixBuf.width = tw
                        pixBuf.height = th
                    }
                    pixCtx.imageSmoothingEnabled = true
                    pixCtx.drawImage(canvas, x, y, cw, ch, 0, 0, tw, th)
                    ctx.imageSmoothingEnabled = false
                    ctx.drawImage(pixBuf, 0, 0, tw, th, x, y, cw, ch)
                    ctx.imageSmoothingEnabled = true
                }
            }

            // 4 — grid overlay
            if (gridOpacity > 0 && lineWidth > 0) {
                ctx.globalAlpha = gridOpacity
                ctx.strokeStyle = gridColor
                ctx.lineWidth = lineWidth
                ctx.beginPath()
                for (let c = 1; c < columns; c++) {
                    const x = Math.round(c * cw) + 0.5
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x, H)
                }
                for (let r = 1; r < rows; r++) {
                    const y = Math.round(r * ch) + 0.5
                    ctx.moveTo(0, y)
                    ctx.lineTo(W, y)
                }
                ctx.stroke()
                ctx.globalAlpha = 1
            }
        }

        // ---- loop / visibility ------------------------------------------
        let framesDrawn = 0

        // ---- reverse background -----------------------------------------
        // play() can't run backwards and per-frame seeking never matches
        // forward smoothness. So: while the clip plays forward once, its
        // frames are captured into a downscaled buffer, then the buffer
        // plays backwards at full rate — the same motion quality as forward.
        // Seek-stepping stays as the fallback if capture isn't possible.
        const REV_FPS = 20
        const REV_MAX_MB = 96
        let revFrames: HTMLCanvasElement[] = []
        let revReady = false
        let revFailed = false
        let revLastCap = 0
        let revLastTime = -1
        let revClock = 0
        let revPrevNow = 0
        let revIdx = 0

        function captureReverseFrame(now: number) {
            if (!(bgMedia instanceof HTMLVideoElement)) return
            if (bgMedia.readyState < 2 || !bgMedia.videoWidth) return
            if (bgMedia.paused) bgMedia.play().catch(() => {})
            if (now - revLastCap < 1000 / REV_FPS) return
            revLastCap = now
            const t = bgMedia.currentTime
            // the loop wrapped — one full pass captured
            if (revLastTime >= 0 && t + 0.05 < revLastTime) {
                finishReverseCapture()
                return
            }
            revLastTime = t
            const vw = bgMedia.videoWidth
            const vh = bgMedia.videoHeight
            const tw = Math.min(720, vw)
            const th = Math.max(1, Math.round(vh * (tw / vw)))
            const frameMB = (tw * th * 4) / 1048576
            if ((revFrames.length + 1) * frameMB > REV_MAX_MB) {
                finishReverseCapture()
                return
            }
            const f = document.createElement("canvas")
            f.width = tw
            f.height = th
            try {
                f.getContext("2d")!.drawImage(bgMedia, 0, 0, tw, th)
            } catch (e) {
                // CORS-tainted or decode failure — fall back to seeking
                revFailed = true
                console.warn("[GridMosaic] reverse buffer unavailable:", e)
                return
            }
            revFrames.push(f)
        }

        function finishReverseCapture() {
            if (revFrames.length > REV_FPS / 2) {
                revReady = true
                revClock = 0
                revPrevNow = 0
                if (bgMedia instanceof HTMLVideoElement) bgMedia.pause()
            } else {
                revFailed = true
            }
        }

        function advanceReverse(now: number) {
            if (!revPrevNow) revPrevNow = now
            revClock += now - revPrevNow
            revPrevNow = now
            const n = revFrames.length
            revIdx = n - 1 - (Math.floor((revClock / 1000) * REV_FPS) % n)
        }

        // fallback: seek backwards manually, throttled to ~30 steps/s
        let revT = -1
        let lastStepAt = 0

        function stepBackgroundReverse(now: number) {
            if (!(bgMedia instanceof HTMLVideoElement)) return
            if (bgMedia.readyState < 1 || !isFinite(bgMedia.duration)) return
            if (bgMedia.seeking) return // let the last seek finish decoding
            if (revT < 0) {
                revT = bgMedia.duration - 0.05
                lastStepAt = now
                bgMedia.currentTime = revT
                return
            }
            if (now - lastStepAt < 33) return
            revT -= (now - lastStepAt) / 1000
            lastStepAt = now
            if (revT <= 0) revT = bgMedia.duration - 0.05
            bgMedia.currentTime = revT
        }

        function loop(now: number) {
            if (cutout === "auto" && mode === "video") segmentVideoFrame(now)
            if (bgDirection === "reverse" && mode === "video") {
                if (revReady) advanceReverse(now)
                else if (revFailed) stepBackgroundReverse(now)
                else captureReverseFrame(now)
            }
            draw()
            framesDrawn++
            // prefers-reduced-motion: let the matte settle, then hold a still
            if (reducedMotion && framesDrawn > 12) {
                if (bgMedia instanceof HTMLVideoElement) bgMedia.pause()
                if (fgMedia instanceof HTMLVideoElement) fgMedia.pause()
                loopActive = false
                return
            }
            if (visible && mode === "video") {
                loopActive = true
                raf = requestAnimationFrame(loop)
            } else {
                loopActive = false
            }
        }

        const io = new IntersectionObserver(
            (entries) => {
                visible = entries[0]?.isIntersecting ?? false
                if (isStatic) return
                if (visible) {
                    if (cutout === "auto") loadSegmenter()
                    revPrevNow = 0 // re-anchor reverse clock after being away
                    if (bgMedia instanceof HTMLVideoElement) {
                        if (bgDirection === "reverse") {
                            if (bgMedia.readyState === 0) bgMedia.load()
                        } else bgMedia.play().catch(() => {})
                    }
                    if (fgMedia instanceof HTMLVideoElement)
                        fgMedia.play().catch(() => {})
                    cancelAnimationFrame(raf)
                    if (mode === "video") {
                        loopActive = true
                        raf = requestAnimationFrame(loop)
                    } else draw()
                } else {
                    if (bgMedia instanceof HTMLVideoElement) bgMedia.pause()
                    if (fgMedia instanceof HTMLVideoElement) fgMedia.pause()
                    loopActive = false
                    cancelAnimationFrame(raf)
                }
            },
            { threshold: 0.05 }
        )
        io.observe(canvas)

        // periodic cell re-roll (the flicker of the original edit)
        // in image mode the easing needs frames to play out, so a short
        // settle loop runs after each re-roll; the video loop covers it live
        let settleRaf = 0
        let settleFrames = 0
        function settleLoop() {
            settleFrames--
            draw()
            if (settleFrames > 0 && visible && !disposed)
                settleRaf = requestAnimationFrame(settleLoop)
        }
        function startSettle() {
            settleFrames = 80
            if (loopActive) return
            cancelAnimationFrame(settleRaf)
            settleRaf = requestAnimationFrame(settleLoop)
        }

        let interval = 0
        if (animateCells && !isStatic && !reducedMotion) {
            interval = window.setInterval(
                () => {
                    cellSeed++
                    cells = buildCells(
                        cellSeed,
                        columns,
                        rows,
                        mosaicAmount,
                        coverAmount,
                        shuffleAmount,
                        tintJitter
                    )
                    if (visible) startSettle()
                },
                Math.max(200, animateInterval)
            )
        }

        // ---- sizing ------------------------------------------------------
        const ro = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect
            canvas.width = Math.round(rect.width * dpr)
            canvas.height = Math.round(rect.height * dpr)
            draw()
        })
        ro.observe(canvas)

        return () => {
            disposed = true
            cancelAnimationFrame(raf)
            cancelAnimationFrame(settleRaf)
            if (interval) clearInterval(interval)
            canvas.removeEventListener("pointermove", onPointerMove)
            canvas.removeEventListener("pointerleave", onPointerLeave)
            canvas.removeEventListener("pointerup", onPointerEnd)
            canvas.removeEventListener("pointercancel", onPointerEnd)
            window.removeEventListener("scroll", onScroll)
            revFrames = []
            io.disconnect()
            ro.disconnect()
            segmenter?.dispose?.()
            segmenter = null
            for (const m of [bgMedia, fgMedia]) {
                if (m instanceof HTMLVideoElement) {
                    m.pause()
                    m.removeAttribute("src")
                    m.load()
                }
            }
        }
    }, [
        mode,
        cutout,
        subjectVideo,
        subjectWebm,
        subjectHevc,
        subjectImage,
        backgroundVideo,
        backgroundImage,
        bgDirection,
        parallax,
        parallaxStrength,
        columns,
        rows,
        seed,
        mosaicAmount,
        pixelSize,
        coverAmount,
        shuffleAmount,
        tintJitter,
        maskFeather,
        segmentFPS,
        bwSubject,
        bgSaturation,
        gridColor,
        gridOpacity,
        lineWidth,
        subjectFit,
        subjectScale,
        subjectX,
        subjectY,
        outlineWidth,
        outlineColor,
        outlineOpacity,
        animateCells,
        animateInterval,
        hoverEffect,
        hoverRadius,
        isStatic,
    ])

    // ---- typography overlays (DOM text, not pixels) ---------------------
    // The headline anchors to grid coordinates: its left edge sits on
    // vertical line `headlineCol`, vertically centered on horizontal line
    // `headlineRow` — the way the reference sets type across the grid.
    const overlays = (
        <>
            {headline ? (
                <div
                    style={{
                        position: "absolute",
                        left: `${(headlineCol / columns) * 100}%`,
                        top: `${(headlineRow / rows) * 100}%`,
                        transform: "translateY(-50%)",
                        color: headlineColor,
                        fontWeight: 900,
                        fontSize: `${(100 / rows) * 1.4}cqh`,
                        lineHeight: 0.85,
                        letterSpacing: "-0.02em",
                        whiteSpace: "pre-line",
                        pointerEvents: "none",
                        ...headlineFont,
                    }}
                >
                    {headline}
                </div>
            ) : null}
        </>
    )

    const frameStyle = {
        width: "100%",
        height: "100%",
        minWidth: 240,
        minHeight: 180,
        position: "relative" as const,
        containerType: "size" as const,
    }

    // The Framer editor canvas never runs effects, so the real composite
    // can't render there — show a CSS-only stand-in with the same grid.
    if (isStatic) {
        const cw = 100 / columns
        const ch = 100 / rows
        return (
            <div
                style={{
                    ...frameStyle,
                    overflow: "hidden",
                    backgroundColor: "#22262d",
                    backgroundImage: `
                        repeating-linear-gradient(0deg, ${gridColor} 0, ${gridColor} 1px, transparent 1px, transparent ${ch}%),
                        repeating-linear-gradient(90deg, ${gridColor} 0, ${gridColor} 1px, transparent 1px, transparent ${cw}%),
                        repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 48px, rgba(0,0,0,0.14) 48px 96px)
                    `,
                    ...style,
                }}
            >
                {overlays}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        textAlign: "center",
                        color: "rgba(255,255,255,0.6)",
                        font: "500 12px/1.5 Inter, system-ui, sans-serif",
                        pointerEvents: "none",
                    }}
                >
                    GridMosaic
                    <br />
                    Open Preview to see the live composite
                </div>
            </div>
        )
    }

    return (
        <div style={{ ...frameStyle, ...style }}>
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={ariaLabel}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            {overlays}
        </div>
    )
}

addPropertyControls(GridMosaic, {
    mode: {
        type: ControlType.Enum,
        defaultValue: "video",
        title: "Mode",
        options: ["video", "image"],
        optionTitles: ["Video", "Image"],
        displaySegmentedControl: true,
    },
    cutout: {
        type: ControlType.Enum,
        defaultValue: "auto",
        title: "Cutout",
        options: ["auto", "alpha"],
        optionTitles: ["Auto", "Pre-keyed"],
        displaySegmentedControl: true,
        description:
            "Auto rotoscopes any footage in-browser. Pre-keyed expects alpha video.",
    },
    subjectVideo: {
        type: ControlType.File,
        title: "Subject",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: (p: any) => p.mode !== "video" || p.cutout !== "auto",
        description: "Any clip of a person. No keying needed.",
    },
    subjectWebm: {
        type: ControlType.File,
        title: "Subject WebM",
        allowedFileTypes: ["webm"],
        hidden: (p: any) => p.mode !== "video" || p.cutout !== "alpha",
        description: "Keyed subject with alpha (VP9).",
    },
    subjectHevc: {
        type: ControlType.File,
        title: "Subject HEVC",
        allowedFileTypes: ["mov", "mp4"],
        hidden: (p: any) => p.mode !== "video" || p.cutout !== "alpha",
        description: "Same clip as HEVC alpha for Safari.",
    },
    backgroundVideo: {
        type: ControlType.File,
        title: "Background",
        allowedFileTypes: ["mp4", "webm"],
        hidden: (p: any) => p.mode !== "video",
    },
    bgDirection: {
        type: ControlType.Enum,
        defaultValue: "forward",
        title: "BG direction",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        displaySegmentedControl: true,
        hidden: (p: any) => p.mode !== "video",
        description:
            "Reverse steps time backwards. A pre-reversed file is smoother.",
    },
    subjectImage: {
        type: ControlType.Image,
        title: "Subject",
        hidden: (p: any) => p.mode !== "image",
        description: "Auto mode cuts out any photo. Pre-keyed expects a PNG.",
    },
    backgroundImage: {
        type: ControlType.Image,
        title: "Background",
        hidden: (p: any) => p.mode !== "image",
    },
    parallax: {
        type: ControlType.Enum,
        defaultValue: "scroll",
        title: "Parallax",
        options: ["off", "scroll", "pointer"],
        optionTitles: ["Off", "Scroll", "Pointer"],
        displaySegmentedControl: true,
        hidden: (p: any) => p.mode !== "image",
        description: "Background drifts with the page or the cursor.",
    },
    parallaxStrength: {
        type: ControlType.Number,
        defaultValue: 0.5,
        title: "Parallax depth",
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: (p: any) => p.mode !== "image" || p.parallax === "off",
    },
    maskFeather: {
        type: ControlType.Number,
        defaultValue: 0.5,
        title: "Edge feather",
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: any) => p.cutout !== "auto",
    },
    segmentFPS: {
        type: ControlType.Number,
        defaultValue: 24,
        title: "Cutout FPS",
        min: 8,
        max: 30,
        step: 1,
        hidden: (p: any) => p.cutout !== "auto" || p.mode !== "video",
        description: "Lower = cheaper. The matte lags a touch below 15.",
    },
    subjectFit: {
        type: ControlType.Enum,
        defaultValue: "contain",
        title: "Subject fit",
        options: ["contain", "cover"],
        optionTitles: ["Fit", "Fill"],
        displaySegmentedControl: true,
        description: "Fit shows the whole person. Fill crops like the BG.",
    },
    subjectScale: {
        type: ControlType.Number,
        defaultValue: 1,
        title: "Subject scale",
        min: 0.5,
        max: 2,
        step: 0.05,
    },
    subjectX: {
        type: ControlType.Number,
        defaultValue: 0,
        title: "Subject X %",
        min: -50,
        max: 50,
        step: 1,
    },
    subjectY: {
        type: ControlType.Number,
        defaultValue: 0,
        title: "Subject Y %",
        min: -50,
        max: 50,
        step: 1,
    },
    outlineWidth: {
        type: ControlType.Number,
        defaultValue: 6,
        title: "Cut edge",
        min: 0,
        max: 24,
        step: 1,
        description: "White paper-cut edge around the subject.",
    },
    outlineColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        title: "Edge color",
        hidden: (p: any) => !p.outlineWidth,
    },
    outlineOpacity: {
        type: ControlType.Number,
        defaultValue: 1,
        title: "Edge opacity",
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.outlineWidth,
    },
    columns: {
        type: ControlType.Number,
        defaultValue: 7,
        min: 2,
        max: 16,
        step: 1,
    },
    rows: {
        type: ControlType.Number,
        defaultValue: 5,
        min: 2,
        max: 12,
        step: 1,
    },
    seed: {
        type: ControlType.Number,
        defaultValue: 7,
        min: 0,
        max: 999,
        step: 1,
    },
    shuffleAmount: {
        type: ControlType.Number,
        defaultValue: 0.3,
        title: "Tile shuffle",
        min: 0,
        max: 1,
        step: 0.05,
    },
    tintJitter: {
        type: ControlType.Number,
        defaultValue: 0.5,
        title: "Exposure jitter",
        min: 0,
        max: 1,
        step: 0.05,
    },
    mosaicAmount: {
        type: ControlType.Number,
        defaultValue: 0.18,
        title: "Mosaic tiles",
        min: 0,
        max: 1,
        step: 0.05,
    },
    pixelSize: {
        type: ControlType.Number,
        defaultValue: 14,
        title: "Pixel size",
        min: 4,
        max: 48,
        step: 1,
    },
    coverAmount: {
        type: ControlType.Number,
        defaultValue: 0.06,
        title: "Cover tiles",
        min: 0,
        max: 0.5,
        step: 0.02,
    },
    bwSubject: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "B&W subject",
    },
    bgSaturation: {
        type: ControlType.Number,
        defaultValue: 0.85,
        title: "BG saturation",
        min: 0,
        max: 1,
        step: 0.05,
    },
    gridColor: {
        type: ControlType.Color,
        defaultValue: "#0d0d0d",
        title: "Grid color",
    },
    gridOpacity: {
        type: ControlType.Number,
        defaultValue: 0.55,
        title: "Grid opacity",
        min: 0,
        max: 1,
        step: 0.05,
    },
    lineWidth: {
        type: ControlType.Number,
        defaultValue: 1,
        title: "Line width",
        min: 0,
        max: 6,
        step: 0.5,
    },
    animateCells: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Re-roll tiles",
    },
    animateInterval: {
        type: ControlType.Number,
        defaultValue: 900,
        title: "Interval (ms)",
        min: 200,
        max: 4000,
        step: 100,
        hidden: (p: any) => !p.animateCells,
    },
    headline: {
        type: ControlType.String,
        defaultValue: "social",
        title: "Headline",
        displayTextArea: true,
        description: "Line breaks stack the type like the reference.",
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Type",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        hidden: (p: any) => !p.headline,
    },
    headlineColor: {
        type: ControlType.Color,
        defaultValue: "#F5F4EF",
        title: "Type color",
        hidden: (p: any) => !p.headline,
    },
    headlineCol: {
        type: ControlType.Number,
        defaultValue: 0.3,
        title: "Type column",
        min: -1,
        max: 16,
        step: 0.1,
        hidden: (p: any) => !p.headline,
        description: "Grid line the text starts on. Negative hangs outside.",
    },
    headlineRow: {
        type: ControlType.Number,
        defaultValue: 1.5,
        title: "Type row",
        min: 0,
        max: 12,
        step: 0.1,
        hidden: (p: any) => !p.headline,
    },
    hoverEffect: {
        type: ControlType.Enum,
        defaultValue: "pixelate",
        title: "Hover",
        options: ["none", "pixelate", "reveal", "scramble"],
        optionTitles: ["None", "Pixelate", "Reveal", "Scramble"],
        description:
            "Tiles near the cursor pixelate, show the background, or shift.",
    },
    hoverRadius: {
        type: ControlType.Number,
        defaultValue: 0.35,
        title: "Hover radius",
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: (p: any) => p.hoverEffect === "none",
    },
    ariaLabel: {
        type: ControlType.String,
        defaultValue: "Grid video collage",
        title: "Alt text",
        description: "Read by screen readers.",
    },
})
