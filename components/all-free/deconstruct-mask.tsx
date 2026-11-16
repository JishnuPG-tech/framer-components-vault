// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useCallback } from "react"

/**
 * PixalateTale — v3 (Reveal Edition)
 *
 * Cursor pixelates and destroys the TOP image — pixels fall with gravity,
 * revealing a SECOND image underneath.
 * Top image heals back over time (~4s default).
 *
 * — Image: top layer that gets destroyed by cursor
 * — Reveal Image: bottom layer that gets uncovered (falls back to black if empty)
 * — Gravity Drop: torn pieces physically fall from where they originated
 * — Image Sampling: falling blocks carry the real top-image color with them
 */

export default function PixalateTale(props) {
    const isStatic = useIsStaticRenderer()

    const {
        image,
        revealImage,
        pixelSize,
        brushRadius,
        trailFadeSpeed,
        trailOpacity,
        gravityEnabled,
        gravityStrength,
        imageSampling,
        showFallingBlocks,
    } = props

    // ── Canvas refs ────────────────────────────────────────────────────────
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const originalRef = useRef<HTMLCanvasElement>(null)
    const pixelatedRef = useRef<HTMLCanvasElement>(null)
    const topMaskRef = useRef<HTMLCanvasElement | null>(null) // offscreen: top image with holes

    // ── Data maps ──────────────────────────────────────────────────────────
    const trailMapRef = useRef<Float32Array | null>(null) // intensity per cell
    const gravOffsetRef = useRef<Float32Array | null>(null) // y-drop in CSS px per cell
    const gravVelocityRef = useRef<Float32Array | null>(null) // y-velocity in px/s per cell
    const sampledColorsRef = useRef<Uint8ClampedArray | null>(null) // RGBA per cell from original

    // ── State refs ─────────────────────────────────────────────────────────
    const animRef = useRef<number>(0)
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const isHoverRef = useRef(false)
    const imgLoadedRef = useRef(false)
    const imgRef = useRef<HTMLImageElement | null>(null)
    const revealLoadedRef = useRef(false)
    const revealImgRef = useRef<HTMLImageElement | null>(null)
    const revealDimsRef = useRef({ x: 0, y: 0, w: 0, h: 0 })
    const sizeRef = useRef({ w: 0, h: 0 })
    const gridSizeRef = useRef({ w: 0, h: 0 })

    // ── Static renderer: show placeholder thumbnail ──────────────────────────
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    background: "#111111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 12,
                }}
            >
                {image ? (
                    <img
                        src={image}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: 0.85,
                        }}
                    />
                ) : null}
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 13,
                        fontFamily: "Inter, sans-serif",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        background: "rgba(0,0,0,0.5)",
                        padding: "6px 14px",
                        borderRadius: 4,
                        backdropFilter: "blur(8px)",
                    }}
                >
                    Pixalate Tale
                </div>
            </div>
        )
    }

    // ── Load TOP image ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!image) return
        imgLoadedRef.current = false

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            imgRef.current = img
            imgLoadedRef.current = true
            prepareCanvases()
        }
        img.src = image
    }, [image])

    // ── Load REVEAL image (the one underneath) ─────────────────────────────
    useEffect(() => {
        if (!revealImage) {
            console.log("[PixalateTale] No revealImage prop provided")
            revealLoadedRef.current = false
            revealImgRef.current = null
            if (imgLoadedRef.current) prepareCanvases()
            return
        }

        console.log(" Loading reveal image:", revealImage)
        revealLoadedRef.current = false

        const img = new Image()
        // NO crossOrigin — reveal image isn't sampled, just drawn.
        // Adding crossOrigin would require CORS headers on the image host.
        img.onload = () => {
            console.log(
                "[PixalateTale] Reveal image LOADED successfully",
                img.width,
                "x",
                img.height
            )
            revealImgRef.current = img
            revealLoadedRef.current = true
            prepareCanvases()
        }
        img.onerror = (e) => {
            console.error(
                "[PixalateTale] Reveal image FAILED to load:",
                revealImage,
                e
            )
            revealLoadedRef.current = false
            revealImgRef.current = null
        }
        img.src = revealImage
    }, [revealImage])

    // ── Prepare canvases + precompute sampled colors ───────────────────────
    const prepareCanvases = useCallback(() => {
        const canvas = canvasRef.current
        const original = originalRef.current
        const pixelated = pixelatedRef.current
        const img = imgRef.current
        if (!canvas || !original || !pixelated || !img) return

        const parent = canvas.parentElement
        if (!parent) return

        const dpr = window.devicePixelRatio || 1
        const w = parent.clientWidth
        const h = parent.clientHeight
        sizeRef.current = { w, h }

        // Resize all canvases to physical pixels
        ;[canvas, original, pixelated].forEach((c) => {
            c.width = w * dpr
            c.height = h * dpr
            c.style.width = `${w}px`
            c.style.height = `${h}px`
        })

        // Offscreen canvas for top layer + holes (created once, resized as needed)
        if (!topMaskRef.current) {
            topMaskRef.current = document.createElement("canvas")
        }
        topMaskRef.current.width = w * dpr
        topMaskRef.current.height = h * dpr

        // ── Draw original at DPR scale (cover fit) ──
        const origCtx = original.getContext("2d")
        if (!origCtx) return

        const imgRatio = img.width / img.height
        const canvasRatio = w / h
        let drawW: number, drawH: number, drawX: number, drawY: number

        if (imgRatio > canvasRatio) {
            drawH = h
            drawW = h * imgRatio
            drawX = (w - drawW) / 2
            drawY = 0
        } else {
            drawW = w
            drawH = w / imgRatio
            drawX = 0
            drawY = (h - drawH) / 2
        }

        origCtx.save()
        origCtx.scale(dpr, dpr)
        origCtx.drawImage(img, drawX, drawY, drawW, drawH)
        origCtx.restore()

        // ── Compute REVEAL image cover-fit dimensions (drawn directly in render loop) ──
        const revImg = revealImgRef.current
        if (revImg && revealLoadedRef.current) {
            const rRatio = revImg.width / revImg.height
            let rW: number, rH: number, rX: number, rY: number
            if (rRatio > canvasRatio) {
                rH = h
                rW = h * rRatio
                rX = (w - rW) / 2
                rY = 0
            } else {
                rW = w
                rH = w / rRatio
                rX = 0
                rY = (h - rH) / 2
            }
            revealDimsRef.current = { x: rX, y: rY, w: rW, h: rH }
        }

        // ── Create pixelated version via small canvas scale-up ──
        const pixCtx = pixelated.getContext("2d")
        if (!pixCtx) return

        const gridW = Math.ceil(w / pixelSize)
        const gridH = Math.ceil(h / pixelSize)
        gridSizeRef.current = { w: gridW, h: gridH }

        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = gridW
        tempCanvas.height = gridH
        const tempCtx = tempCanvas.getContext("2d")
        if (!tempCtx) return

        tempCtx.imageSmoothingEnabled = false
        tempCtx.drawImage(
            img,
            drawX / (w / gridW),
            drawY / (h / gridH),
            drawW / (w / gridW),
            drawH / (h / gridH)
        )

        pixCtx.save()
        pixCtx.scale(dpr, dpr)
        pixCtx.imageSmoothingEnabled = false
        pixCtx.drawImage(tempCanvas, 0, 0, gridW, gridH, 0, 0, w, h)
        pixCtx.restore()

        // ── Init data maps ──
        const cellCount = gridW * gridH
        trailMapRef.current = new Float32Array(cellCount).fill(0)
        gravOffsetRef.current = new Float32Array(cellCount).fill(0)
        gravVelocityRef.current = new Float32Array(cellCount).fill(0)

        // ── Pre-sample center pixel of each cell from original image ──
        // getImageData works in physical pixels regardless of context transform
        const origData = origCtx.getImageData(0, 0, w * dpr, h * dpr)
        const origPixels = origData.data
        const physW = w * dpr
        const sampled = new Uint8ClampedArray(cellCount * 4)

        for (let gy = 0; gy < gridH; gy++) {
            for (let gx = 0; gx < gridW; gx++) {
                const cx = Math.min(
                    Math.round((gx + 0.5) * pixelSize * dpr),
                    physW - 1
                )
                const cy = Math.min(
                    Math.round((gy + 0.5) * pixelSize * dpr),
                    h * dpr - 1
                )
                const pIdx = (cy * physW + cx) * 4
                const cIdx = (gy * gridW + gx) * 4
                sampled[cIdx] = origPixels[pIdx]
                sampled[cIdx + 1] = origPixels[pIdx + 1]
                sampled[cIdx + 2] = origPixels[pIdx + 2]
                sampled[cIdx + 3] = 255
            }
        }
        sampledColorsRef.current = sampled

        // ── Initial draw: show original image ──
        const mainCtx = canvas.getContext("2d")
        if (!mainCtx) return
        mainCtx.drawImage(original, 0, 0)
    }, [pixelSize])

    // Re-prepare if pixelSize changes after image is loaded
    useEffect(() => {
        if (imgLoadedRef.current) prepareCanvases()
    }, [prepareCanvases])

    // Resize handler
    useEffect(() => {
        const onResize = () => {
            if (imgLoadedRef.current) prepareCanvases()
        }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [prepareCanvases])

    // ── Mouse ──────────────────────────────────────────────────────────────
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }
            isHoverRef.current = true
        },
        []
    )

    const handleMouseLeave = useCallback(() => {
        isHoverRef.current = false
        mouseRef.current = { x: -1000, y: -1000 }
    }, [])

    // ── Render loop ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!image) return

        const render = () => {
            const canvas = canvasRef.current
            const original = originalRef.current
            const pixelated = pixelatedRef.current
            const trailMap = trailMapRef.current
            const gravOffset = gravOffsetRef.current
            const gravVelocity = gravVelocityRef.current
            const sampledColors = sampledColorsRef.current

            if (
                !canvas ||
                !original ||
                !pixelated ||
                !trailMap ||
                !imgLoadedRef.current
            ) {
                animRef.current = requestAnimationFrame(render)
                return
            }

            const { w, h } = sizeRef.current
            const { w: gridW, h: gridH } = gridSizeRef.current
            if (w === 0 || h === 0 || gridW === 0) {
                animRef.current = requestAnimationFrame(render)
                return
            }

            const dpr = window.devicePixelRatio || 1
            const dt = 1 / 60
            const mx = mouseRef.current.x
            const my = mouseRef.current.y

            // ── 1. Paint trail where cursor is ──
            if (isHoverRef.current && mx > 0 && my > 0) {
                const gridX = Math.floor(mx / pixelSize)
                const gridY = Math.floor(my / pixelSize)
                const gridR = Math.ceil(brushRadius / pixelSize)

                for (let dy = -gridR; dy <= gridR; dy++) {
                    for (let dx = -gridR; dx <= gridR; dx++) {
                        const gx = gridX + dx
                        const gy = gridY + dy
                        if (gx < 0 || gx >= gridW || gy < 0 || gy >= gridH)
                            continue

                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist > gridR) continue

                        const falloff = 1 - dist / gridR
                        const idx = gy * gridW + gx

                        // Reset gravity for cells being repainted from low intensity
                        if (
                            gravOffset &&
                            gravVelocity &&
                            trailMap[idx] < 0.15
                        ) {
                            gravOffset[idx] = 0
                            gravVelocity[idx] = 0
                        }

                        trailMap[idx] = Math.min(
                            1,
                            trailMap[idx] + falloff * 0.3
                        )
                    }
                }
            }

            // ── 2. Fade + gravity physics ──
            const fadeAmount = trailFadeSpeed * dt
            for (let i = 0; i < trailMap.length; i++) {
                if (trailMap[i] <= 0) continue

                trailMap[i] = Math.max(0, trailMap[i] - fadeAmount)

                if (gravityEnabled && gravOffset && gravVelocity) {
                    // Euler integration: a → v → offset
                    gravVelocity[i] += gravityStrength * dt
                    gravOffset[i] += gravVelocity[i] * dt
                }

                // Fully faded: reset gravity so next paint starts clean
                if (trailMap[i] === 0 && gravOffset && gravVelocity) {
                    gravOffset[i] = 0
                    gravVelocity[i] = 0
                }
            }

            // ── 3. Composite frame ──
            const mainCtx = canvas.getContext("2d")
            if (!mainCtx) {
                animRef.current = requestAnimationFrame(render)
                return
            }

            // Reset transform to identity (physical pixel space)
            mainCtx.setTransform(1, 0, 0, 1, 0, 0)
            mainCtx.clearRect(0, 0, canvas.width, canvas.height)

            // ── LAYER 1: REVEAL IMAGE on main canvas (bottom) ──
            const revImg = revealImgRef.current
            if (
                revImg &&
                revealLoadedRef.current &&
                revImg.complete &&
                revImg.naturalWidth > 0
            ) {
                let d = revealDimsRef.current
                // Compute cover-fit on the fly if not cached yet
                if (d.w === 0 || d.h === 0) {
                    const rRatio = revImg.width / revImg.height
                    const cRatio = w / h
                    let rW: number, rH: number, rX: number, rY: number
                    if (rRatio > cRatio) {
                        rH = h
                        rW = h * rRatio
                        rX = (w - rW) / 2
                        rY = 0
                    } else {
                        rW = w
                        rH = w / rRatio
                        rX = 0
                        rY = (h - rH) / 2
                    }
                    revealDimsRef.current = { x: rX, y: rY, w: rW, h: rH }
                    d = revealDimsRef.current
                }
                mainCtx.drawImage(
                    revImg,
                    d.x * dpr,
                    d.y * dpr,
                    d.w * dpr,
                    d.h * dpr
                )
            } else {
                mainCtx.fillStyle = "#000000"
                mainCtx.fillRect(0, 0, canvas.width, canvas.height)
            }

            // ── LAYER 2: TOP IMAGE WITH HOLES (built offscreen, then composited) ──
            // This is the correct architecture: punching holes via destination-out
            // must happen on an isolated buffer, NOT on the main canvas where reveal lives.
            const topMask = topMaskRef.current
            if (topMask) {
                const topCtx = topMask.getContext("2d")
                if (topCtx) {
                    // Clear offscreen and draw fresh top image
                    topCtx.globalAlpha = 1
                    topCtx.globalCompositeOperation = "source-over"
                    topCtx.clearRect(0, 0, topMask.width, topMask.height)
                    topCtx.drawImage(original, 0, 0)

                    // Punch holes — only affects this offscreen canvas
                    topCtx.globalCompositeOperation = "destination-out"
                    for (let gy = 0; gy < gridH; gy++) {
                        for (let gx = 0; gx < gridW; gx++) {
                            const idx = gy * gridW + gx
                            const intensity = trailMap[idx]
                            if (intensity < 0.01) continue

                            const sx = gx * pixelSize * dpr
                            const sy = gy * pixelSize * dpr
                            const sw = pixelSize * dpr
                            const sh = pixelSize * dpr

                            topCtx.globalAlpha = Math.min(1, intensity * 2)
                            topCtx.fillRect(sx, sy, sw, sh)
                        }
                    }

                    // Reset offscreen state
                    topCtx.globalAlpha = 1
                    topCtx.globalCompositeOperation = "source-over"

                    // Composite onto main canvas — holes show reveal beneath
                    mainCtx.globalAlpha = 1
                    mainCtx.globalCompositeOperation = "source-over"
                    mainCtx.drawImage(topMask, 0, 0)
                }
            }

            // ── Draw falling blocks OVER everything (optional) ──
            // These are the torn-off pieces of the top image, with gravity.
            // Disable if you only want clean reveal without debris.
            if (showFallingBlocks) {
                mainCtx.globalCompositeOperation = "source-over"

                for (let gy = 0; gy < gridH; gy++) {
                    for (let gx = 0; gx < gridW; gx++) {
                        const idx = gy * gridW + gx
                        const intensity = trailMap[idx]
                        if (intensity < 0.01) continue

                        const sx = gx * pixelSize * dpr
                        const sy = gy * pixelSize * dpr
                        const sw = pixelSize * dpr
                        const sh = pixelSize * dpr

                        const dropY =
                            gravityEnabled && gravOffset
                                ? gravOffset[idx] * dpr
                                : 0
                        const dx = sx
                        const dy = sy + dropY

                        mainCtx.globalAlpha = intensity * trailOpacity

                        if (imageSampling && sampledColors) {
                            const cIdx = idx * 4
                            mainCtx.fillStyle = `rgb(${sampledColors[cIdx]},${sampledColors[cIdx + 1]},${sampledColors[cIdx + 2]})`
                            mainCtx.fillRect(dx, dy, sw, sh)
                        } else {
                            mainCtx.drawImage(
                                pixelated,
                                sx,
                                sy,
                                sw,
                                sh,
                                dx,
                                dy,
                                sw,
                                sh
                            )
                        }
                    }
                }
            }

            // ── Reset context state ──
            mainCtx.globalAlpha = 1
            mainCtx.globalCompositeOperation = "source-over"

            animRef.current = requestAnimationFrame(render)
        }

        animRef.current = requestAnimationFrame(render)
        return () => cancelAnimationFrame(animRef.current)
    }, [
        image,
        revealImage,
        pixelSize,
        brushRadius,
        trailFadeSpeed,
        trailOpacity,
        gravityEnabled,
        gravityStrength,
        imageSampling,
        showFallingBlocks,
    ])

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: "crosshair",
            }}
        >
            {/* Hidden helper canvases */}
            <canvas ref={originalRef} style={{ display: "none" }} />
            <canvas ref={pixelatedRef} style={{ display: "none" }} />

            {/* Visible composite canvas */}
            <canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ width: "100%", height: "100%", display: "block" }}
            />

            {/* Placeholder when no image is loaded */}
            {!image && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.3)",
                        fontSize: 14,
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: "0.05em",
                    }}
                >
                    Upload top image + reveal image →
                </div>
            )}
        </div>
    )
}

// ── Default props ──────────────────────────────────────────────────────────
PixalateTale.defaultProps = {
    image: "",
    revealImage: "",
    pixelSize: 16,
    brushRadius: 60,
    trailFadeSpeed: 0.25, // ~4s heal time at intensity 1.0
    trailOpacity: 1,
    gravityEnabled: true,
    gravityStrength: 250,
    imageSampling: true,
    showFallingBlocks: true,
}

// ── Property controls ──────────────────────────────────────────────────────
addPropertyControls(PixalateTale, {
    image: {
        type: ControlType.Image,
        title: "Top Image",
    },
    revealImage: {
        type: ControlType.Image,
        title: "Reveal Image",
    },

    // ── Trail core ──
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 16,
        min: 4,
        max: 64,
        step: 2,
        displayStepper: true,
    },
    brushRadius: {
        type: ControlType.Number,
        title: "Brush Radius",
        defaultValue: 60,
        min: 20,
        max: 200,
        step: 10,
        displayStepper: true,
    },
    trailFadeSpeed: {
        type: ControlType.Number,
        title: "Heal Speed",
        defaultValue: 0.25, // 1.0 / 0.25 ≈ 4s
        min: 0.05, // 20s — extremely slow
        max: 2, // 0.5s — snappy
        step: 0.05,
    },
    trailOpacity: {
        type: ControlType.Number,
        title: "Trail Opacity",
        defaultValue: 1,
        min: 0.3,
        max: 1,
        step: 0.05,
    },

    // ── Image Sampling ──
    imageSampling: {
        type: ControlType.Boolean,
        title: "Image Sampling",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // ── Image Sampling already declared above ──

    // ── Falling Blocks toggle ──
    showFallingBlocks: {
        type: ControlType.Boolean,
        title: "Falling Debris",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // ── Gravity ──
    gravityEnabled: {
        type: ControlType.Boolean,
        title: "Gravity Drop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    gravityStrength: {
        type: ControlType.Number,
        title: "↳ Gravity (px/s²)",
        defaultValue: 250,
        min: 20,
        max: 1200,
        step: 20,
        displayStepper: true,
        hidden: (props) => !props.gravityEnabled,
    },
})
