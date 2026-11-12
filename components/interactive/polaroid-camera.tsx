/**
 * InstantCamera.tsx
 * -----------------------------------------------------------------------
 * A fully interactive, self-contained instant-camera component styled
 * after a classic two-tone instant camera: round fresnel flash, round
 * autofocus lens (doubles as the live viewfinder) with curved ring text,
 * a chrome viewfinder window, a red shutter button, and a film-eject slot
 * that "ejects" a print with a classic gradual develop-fade. Point, shoot,
 * and develop your photos — all in the browser.
 *
 * Zero required dependencies beyond React. If you have `jszip` installed
 * ("npm install jszip"), "DEVELOP ALL" will bundle photos into a single
 * .zip; otherwise it gracefully falls back to downloading each photo
 * individually.
 *
 * Note: this uses an original wordmark ("moment") rather than any real
 * camera brand's trademarked name/logo, since those are protected marks —
 * everything else (silhouette, layout, color-blocking) is an homage, not
 * a reproduction of a specific product's artwork.
 *
 * Usage:
 *   <InstantCamera
 *     cameraColor="#FFFFFF"
 *     accentColor="#2E86DE"
 *     filmPreset="kodakGold"
 *     effectIntensity={0.6}
 *     maxShots={8}
 *     borderRadius={38}
 *     enableShutterSound
 *   />
 * -----------------------------------------------------------------------
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react"

/* ============================================================================
 * TYPES
 * ========================================================================== */

export type FilmPresetId = "kodakGold" | "fuji400" | "bw"

export interface Photo {
    id: string
    dataUrl: string
    preset: FilmPresetId
    timestamp: number
}

export interface InstantCameraProps {
    /** Main body color (the top/white shell in a classic two-tone body). */
    cameraColor?: string
    /** Trim color: lens ring, base bezel, wordmark. */
    accentColor?: string
    /** Which film preset develops the shots. */
    filmPreset?: FilmPresetId
    /** 0 (subtle) – 1 (heavy). Scales grain, vignette, color shift, leaks. */
    effectIntensity?: number
    /** Photos per pack. Clamped to 4–36. */
    maxShots?: number
    /** Corner rounding (px) applied to the body. */
    borderRadius?: number
    /** Play a synthesized shutter click on capture. */
    enableShutterSound?: boolean
    /** Show the settings panel so end users can tweak everything live. */
    allowUserCustomization?: boolean
    /** Called whenever the photo roll changes. */
    onPhotosChange?: (photos: Photo[]) => void
}

/* ============================================================================
 * FILM PRESET CONFIG
 * ========================================================================== */

interface PresetConfig {
    label: string
    grainBase: number
    vignetteBase: number
    contrast: number
    tint: { r: number; g: number; b: number }
    desaturate: number
    lightLeaks: boolean
    leakChance: number
}

const FILM_PRESETS: Record<FilmPresetId, PresetConfig> = {
    kodakGold: {
        label: "Gold 200",
        grainBase: 16,
        vignetteBase: 0.35,
        contrast: 1.08,
        tint: { r: 1.12, g: 1.02, b: 0.86 },
        desaturate: 0,
        lightLeaks: true,
        leakChance: 0.5,
    },
    fuji400: {
        label: "Fuji 400",
        grainBase: 12,
        vignetteBase: 0.3,
        contrast: 1.22,
        tint: { r: 0.92, g: 1.08, b: 1.02 },
        desaturate: 0,
        lightLeaks: false,
        leakChance: 0,
    },
    bw: {
        label: "B&W",
        grainBase: 32,
        vignetteBase: 0.5,
        contrast: 1.35,
        tint: { r: 1, g: 1, b: 1 },
        desaturate: 1,
        lightLeaks: false,
        leakChance: 0,
    },
}

const PRESET_ORDER: FilmPresetId[] = ["kodakGold", "fuji400", "bw"]

/* ============================================================================
 * PURE HELPERS — pixel & canvas processing
 * ========================================================================== */

function clamp8(v: number): number {
    return v < 0 ? 0 : v > 255 ? 255 : v
}

function developFrame(
    imageData: ImageData,
    preset: PresetConfig,
    intensity: number,
    exposureFactor: number
) {
    const data = imageData.data
    const grainAmount = preset.grainBase * intensity
    const contrast = 1 + (preset.contrast - 1) * intensity

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i] * exposureFactor
        let g = data[i + 1] * exposureFactor
        let b = data[i + 2] * exposureFactor

        r *= 1 + (preset.tint.r - 1) * intensity
        g *= 1 + (preset.tint.g - 1) * intensity
        b *= 1 + (preset.tint.b - 1) * intensity

        if (preset.desaturate > 0) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b
            const d = preset.desaturate
            r = r * (1 - d) + lum * d
            g = g * (1 - d) + lum * d
            b = b * (1 - d) + lum * d
        }

        r = (r - 128) * contrast + 128
        g = (g - 128) * contrast + 128
        b = (b - 128) * contrast + 128

        if (grainAmount > 0) {
            const n = (Math.random() - 0.5) * grainAmount
            r += n
            g += n
            b += n
        }

        data[i] = clamp8(r)
        data[i + 1] = clamp8(g)
        data[i + 2] = clamp8(b)
    }
}

function applyVignette(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    preset: PresetConfig,
    intensity: number
) {
    const strength = preset.vignetteBase * intensity
    if (strength <= 0) return
    const cx = w / 2
    const cy = h / 2
    const radius = Math.sqrt(cx * cx + cy * cy)
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius)
    grad.addColorStop(0, "rgba(0,0,0,0)")
    grad.addColorStop(1, `rgba(0,0,0,${Math.min(0.85, strength)})`)
    ctx.save()
    ctx.globalCompositeOperation = "multiply"
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
}

function applyLightLeak(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    intensity: number
) {
    const leakColors = [
        ["rgba(255,140,60,0.55)", "rgba(255,140,60,0)"],
        ["rgba(255,60,120,0.45)", "rgba(255,60,120,0)"],
        ["rgba(255,220,90,0.5)", "rgba(255,220,90,0)"],
    ]
    const leaks = 1 + Math.round(Math.random())
    ctx.save()
    ctx.globalCompositeOperation = "screen"
    for (let i = 0; i < leaks; i++) {
        const [inner, outer] =
            leakColors[Math.floor(Math.random() * leakColors.length)]
        const edge = Math.floor(Math.random() * 4)
        let x = w / 2
        let y = h / 2
        if (edge === 0) x = -w * 0.1
        if (edge === 1) x = w * 1.1
        if (edge === 2) y = -h * 0.1
        if (edge === 3) y = h * 1.1
        const r = Math.max(w, h) * (0.5 + Math.random() * 0.5) * intensity + 40
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
        grad.addColorStop(0, inner)
        grad.addColorStop(1, outer)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()
}

function playShutterSound() {
    try {
        const AudioCtx =
            (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx: AudioContext = new AudioCtx()
        const now = ctx.currentTime

        const click = ctx.createOscillator()
        const clickGain = ctx.createGain()
        click.type = "square"
        click.frequency.setValueAtTime(1800, now)
        click.frequency.exponentialRampToValueAtTime(400, now + 0.04)
        clickGain.gain.setValueAtTime(0.25, now)
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
        click.connect(clickGain).connect(ctx.destination)
        click.start(now)
        click.stop(now + 0.06)

        const whir = ctx.createOscillator()
        const whirGain = ctx.createGain()
        whir.type = "sawtooth"
        whir.frequency.setValueAtTime(90, now + 0.05)
        whir.frequency.linearRampToValueAtTime(70, now + 0.4)
        whirGain.gain.setValueAtTime(0.05, now + 0.05)
        whirGain.gain.linearRampToValueAtTime(0.0001, now + 0.45)
        whir.connect(whirGain).connect(ctx.destination)
        whir.start(now + 0.05)
        whir.stop(now + 0.46)

        setTimeout(() => ctx.close().catch(() => {}), 600)
    } catch {
        /* silently ignore — sound is a nice-to-have */
    }
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [meta, b64] = dataUrl.split(",")
    const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg"
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return new Blob([arr], { type: mime })
}

function triggerDownload(href: string, filename: string) {
    const a = document.createElement("a")
    a.href = href
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
}

async function downloadAllPhotos(photos: Photo[]) {
    if (photos.length === 0) return
    try {
        // @ts-ignore — optional dependency, resolved only if installed
        const JSZipModule = await import(/* webpackIgnore: true */ "jszip")
        const JSZip = JSZipModule.default || JSZipModule
        const zip = new JSZip()
        photos.forEach((p, i) => {
            const blob = dataUrlToBlob(p.dataUrl)
            zip.file(
                `print-${String(i + 1).padStart(2, "0")}-${p.id}.jpg`,
                blob
            )
        })
        const blob = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(blob)
        triggerDownload(url, "instant-camera-photos.zip")
        setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch {
        photos.forEach((p, i) => {
            setTimeout(() => {
                triggerDownload(
                    p.dataUrl,
                    `print-${String(i + 1).padStart(2, "0")}.jpg`
                )
            }, i * 250)
        })
    }
}

/* ============================================================================
 * INLINE ICONS
 * ========================================================================== */

const Icon = {
    Flip: () => (
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
            <path
                d="M17 2l4 4-4 4M7 22l-4-4 4-4M3 12a9 9 0 0114-7.3M21 12a9 9 0 01-14 7.3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    Gear: () => (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
            <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M12 2v3m0 14v3M4.2 4.2l2.1 2.1m11.4 11.4l2.1 2.1M2 12h3m14 0h3M4.2 19.8l2.1-2.1m11.4-11.4l2.1-2.1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    ),
    Download: () => (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path
                d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    Close: () => (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    ),
    Chevron: ({ dir }: { dir: "left" | "right" }) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path
                d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    CameraOff: () => (
        <svg viewBox="0 0 64 64" width="30" height="30" fill="none">
            <path
                d="M8 22h9l4-6h14l4 6h9a3 3 0 013 3v24a3 3 0 01-3 3H11a3 3 0 01-3-3V25a3 3 0 013-3z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
            <circle
                cx="32"
                cy="36"
                r="9"
                stroke="currentColor"
                strokeWidth="2.5"
            />
            <path
                d="M6 6l52 52"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    ),
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function InstantCamera({
    cameraColor = "#FFFFFF",
    accentColor = "#2E86DE",
    filmPreset = "kodakGold",
    effectIntensity = 0.6,
    maxShots = 8,
    borderRadius = 38,
    enableShutterSound = true,
    allowUserCustomization = true,
    onPhotosChange,
}: InstantCameraProps) {
    const clampedMax = Math.min(36, Math.max(4, Math.round(maxShots)))

    const [bodyColor, setBodyColor] = useState(cameraColor)
    const [accent, setAccent] = useState(accentColor)
    const [preset, setPreset] = useState<FilmPresetId>(filmPreset)
    const [intensity, setIntensity] = useState(
        Math.min(1, Math.max(0, effectIntensity))
    )
    const [packSize, setPackSize] = useState(clampedMax)
    const [radius, setRadius] = useState(borderRadius)
    const [soundOn, setSoundOn] = useState(enableShutterSound)
    const [settingsOpen, setSettingsOpen] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [facing, setFacing] = useState<"user" | "environment">("environment")
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [ready, setReady] = useState(false)

    const [photos, setPhotos] = useState<Photo[]>([])
    const [developingIds, setDevelopingIds] = useState<Set<string>>(new Set())
    const [flash, setFlash] = useState(false)
    const [ejecting, setEjecting] = useState<Photo | null>(null)
    const [viewerIndex, setViewerIndex] = useState<number | null>(null)

    const shotsLeft = Math.max(0, packSize - photos.length)
    const packEmpty = shotsLeft === 0

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
    }, [])

    useEffect(() => {
        let cancelled = false
        async function start() {
            setReady(false)
            setCameraError(null)
            stopStream()
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facing },
                    audio: false,
                })
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play().catch(() => {})
                }
                setReady(true)
            } catch {
                setCameraError("Camera access denied.")
            }
        }
        start()
        return () => {
            cancelled = true
            stopStream()
        }
    }, [facing, stopStream])

    useEffect(() => () => stopStream(), [stopStream])

    useEffect(() => {
        onPhotosChange?.(photos)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [photos])

    const capture = useCallback(() => {
        if (packEmpty || !ready || !videoRef.current || !canvasRef.current)
            return

        const video = videoRef.current
        const vw = video.videoWidth || 1280
        const vh = video.videoHeight || 720
        const canvas = canvasRef.current
        canvas.width = vw
        canvas.height = vh
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.save()
        if (facing === "user") {
            ctx.translate(vw, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, vw, vh)
        ctx.restore()

        const cfg = FILM_PRESETS[preset]
        const exposureFactor = 1 + (Math.random() - 0.5) * 0.3 * intensity

        const imageData = ctx.getImageData(0, 0, vw, vh)
        developFrame(imageData, cfg, intensity, exposureFactor)
        ctx.putImageData(imageData, 0, 0)

        applyVignette(ctx, vw, vh, cfg, intensity)

        if (
            cfg.lightLeaks &&
            Math.random() < cfg.leakChance * (0.5 + intensity)
        ) {
            applyLightLeak(ctx, vw, vh, intensity)
        }

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
        const photo: Photo = {
            id: Math.random().toString(36).slice(2, 10),
            dataUrl,
            preset,
            timestamp: Date.now(),
        }

        setPhotos((prev) => [...prev, photo])
        setDevelopingIds((prev) => new Set(prev).add(photo.id))
        // let the "washed out" frame paint once before transitioning to clear —
        // this is what produces the classic gradual develop fade.
        setTimeout(() => {
            setDevelopingIds((prev) => {
                const next = new Set(prev)
                next.delete(photo.id)
                return next
            })
        }, 80)

        // eject animation: a print visibly slides out of the film slot
        setEjecting(photo)
        setTimeout(() => setEjecting(null), 1300)

        if (soundOn) playShutterSound()
        setFlash(true)
        setTimeout(() => setFlash(false), 160)
    }, [facing, intensity, preset, ready, packEmpty, soundOn])

    const toggleFacing = () =>
        setFacing((f) => (f === "user" ? "environment" : "user"))

    const cfg = FILM_PRESETS[preset]

    const openViewer = (idx: number) => setViewerIndex(idx)
    const closeViewer = () => setViewerIndex(null)
    const nextPhoto = useCallback(
        () =>
            setViewerIndex((i) =>
                i === null ? null : (i + 1) % Math.max(1, photos.length)
            ),
        [photos.length]
    )
    const prevPhoto = useCallback(
        () =>
            setViewerIndex((i) =>
                i === null
                    ? null
                    : (i - 1 + photos.length) % Math.max(1, photos.length)
            ),
        [photos.length]
    )

    useEffect(() => {
        if (viewerIndex === null) return
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") closeViewer()
            if (e.key === "ArrowRight") nextPhoto()
            if (e.key === "ArrowLeft") prevPhoto()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [viewerIndex, nextPhoto, prevPhoto])

    /* ================================ RENDER =============================== */

    return (
        <div
            className="ic-root"
            style={{
                ["--ic-radius" as any]: `${radius}px`,
                ["--ic-accent" as any]: accent,
            }}
        >
            <style>{CSS}</style>

            <div className="ic-card">
                <div className="ic-body" style={{ background: bodyColor }}>
                    <div className="ic-sheen" />

                    {/* rainbow accent stripe */}
                    <div className="ic-stripe">
                        <span style={{ background: "#e63946" }} />
                        <span style={{ background: "#f4a300" }} />
                        <span style={{ background: "#f1c40f" }} />
                        <span style={{ background: "#2ecc71" }} />
                        <span style={{ background: "#3498db" }} />
                        <span style={{ background: "#8e44ad" }} />
                    </div>

                    {/* fresnel flash */}
                    <div className="ic-flash-lens">
                        <div className="ic-flash-rings" />
                        <div className="ic-flash-glare" />
                    </div>

                    {/* red shutter button */}
                    <button
                        className="ic-shutter"
                        onClick={capture}
                        disabled={packEmpty || !ready}
                        aria-label="Take photo"
                        title={packEmpty ? "Pack finished" : "Take photo"}
                    />

                    {/* lens / live viewfinder */}
                    <div className="ic-lens">
                        <div className="ic-lens-ring">
                            <div className="ic-lens-shine" />
                        </div>
                        <div className="ic-lens-glass">
                            {cameraError ? (
                                <div className="ic-placeholder">
                                    <Icon.CameraOff />
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    className="ic-video"
                                    muted
                                    playsInline
                                    style={{
                                        transform:
                                            facing === "user"
                                                ? "scaleX(-1)"
                                                : "none",
                                    }}
                                />
                            )}
                            <div className="ic-lens-iridescence" />
                            <div
                                className={`ic-flash-overlay ${flash ? "ic-flash-on" : ""}`}
                            />
                        </div>
                    </div>

                    {/* chrome viewfinder window */}
                    <div className="ic-viewfinder-deco">
                        <div className="ic-viewfinder-glass" />
                    </div>

                    {/* decorative status dots (matches reference; controls live below) */}
                    <div className="ic-status-cluster">
                        <span className="ic-dot" />
                        <span className="ic-dot" />
                        <span className="ic-dot ic-dot-on" />
                    </div>

                    {/* base bezel + film slot */}
                    <div className="ic-base">
                        <div className="ic-slot" />
                    </div>

                    {/* ejecting print animation */}
                    {ejecting && (
                        <div
                            key={ejecting.id}
                            className="ic-eject-print"
                            onAnimationEnd={() => setEjecting(null)}
                        >
                            <img src={ejecting.dataUrl} alt="" />
                        </div>
                    )}
                </div>
            </div>

            {cameraError && (
                <div className="ic-error-note">
                    {cameraError} Please allow camera access and reload.
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* controls row (kept off the camera face to match the reference) */}
            {allowUserCustomization && (
                <div className="ic-controls-row">
                    <button className="ic-text-btn" onClick={toggleFacing}>
                        <Icon.Flip /> Flip camera
                    </button>
                    <button
                        className="ic-text-btn"
                        onClick={() => setSettingsOpen((s) => !s)}
                    >
                        <Icon.Gear /> Settings
                    </button>
                </div>
            )}

            {/* settings panel */}
            {allowUserCustomization && settingsOpen && (
                <div className="ic-settings">
                    <div className="ic-setting">
                        <label>Film</label>
                        <div className="ic-preset-row">
                            {PRESET_ORDER.map((p) => (
                                <button
                                    key={p}
                                    className={`ic-chip ${preset === p ? "ic-chip-on" : ""}`}
                                    onClick={() => setPreset(p)}
                                >
                                    {FILM_PRESETS[p].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="ic-setting ic-setting-row">
                        <div>
                            <label>Body color</label>
                            <input
                                type="color"
                                value={bodyColor}
                                onChange={(e) => setBodyColor(e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Accent color</label>
                            <input
                                type="color"
                                value={accent}
                                onChange={(e) => setAccent(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="ic-setting">
                        <label>Effect intensity</label>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={intensity}
                            onChange={(e) =>
                                setIntensity(Number(e.target.value))
                            }
                        />
                    </div>

                    <div className="ic-setting ic-setting-row">
                        <div>
                            <label>Corner radius</label>
                            <input
                                type="range"
                                min={0}
                                max={48}
                                step={2}
                                value={radius}
                                onChange={(e) =>
                                    setRadius(Number(e.target.value))
                                }
                            />
                        </div>
                        <div>
                            <label>Pack size ({packSize})</label>
                            <input
                                type="range"
                                min={4}
                                max={36}
                                step={1}
                                value={packSize}
                                onChange={(e) =>
                                    setPackSize(
                                        Math.min(
                                            36,
                                            Math.max(4, Number(e.target.value))
                                        )
                                    )
                                }
                                disabled={photos.length > 0}
                            />
                        </div>
                    </div>

                    <button
                        className="ic-sound-toggle"
                        onClick={() => setSoundOn((s) => !s)}
                    >
                        {soundOn ? "Shutter sound on" : "Shutter sound off"}
                    </button>
                </div>
            )}

            {/* develop row */}
            <div className="ic-develop-row">
                <button
                    className="ic-develop"
                    onClick={() => downloadAllPhotos(photos)}
                    disabled={photos.length === 0}
                >
                    <Icon.Download /> DEVELOP ALL
                </button>
                <span className="ic-develop-count">
                    {shotsLeft} left · {photos.length} printed
                </span>
            </div>

            {/* print gallery */}
            <div className="ic-gallery">
                {photos.length === 0 ? (
                    <div className="ic-gallery-empty">
                        No prints yet — press the shutter.
                    </div>
                ) : (
                    <div className="ic-print-row">
                        {photos.map((photo, i) => (
                            <button
                                key={photo.id}
                                className="ic-print"
                                onClick={() => openViewer(i)}
                                aria-label={`Open print ${i + 1}`}
                            >
                                <span className="ic-print-photo">
                                    <img
                                        src={photo.dataUrl}
                                        alt={`Print ${i + 1}`}
                                        className={
                                            developingIds.has(photo.id)
                                                ? "ic-developing"
                                                : ""
                                        }
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* fullscreen viewer */}
            {viewerIndex !== null && photos[viewerIndex] && (
                <div className="ic-viewer" onClick={closeViewer}>
                    <button
                        className="ic-viewer-close"
                        onClick={closeViewer}
                        aria-label="Close"
                    >
                        <Icon.Close />
                    </button>
                    <button
                        className="ic-viewer-nav ic-viewer-nav-left"
                        onClick={(e) => {
                            e.stopPropagation()
                            prevPhoto()
                        }}
                        aria-label="Previous photo"
                    >
                        <Icon.Chevron dir="left" />
                    </button>
                    <img
                        className="ic-viewer-img"
                        src={photos[viewerIndex].dataUrl}
                        alt={`Print ${viewerIndex + 1}`}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        className="ic-viewer-nav ic-viewer-nav-right"
                        onClick={(e) => {
                            e.stopPropagation()
                            nextPhoto()
                        }}
                        aria-label="Next photo"
                    >
                        <Icon.Chevron dir="right" />
                    </button>
                    <button
                        className="ic-viewer-download"
                        onClick={(e) => {
                            e.stopPropagation()
                            triggerDownload(
                                photos[viewerIndex].dataUrl,
                                `print-${String(viewerIndex + 1).padStart(2, "0")}.jpg`
                            )
                        }}
                    >
                        <Icon.Download /> Save this print
                    </button>
                </div>
            )}
        </div>
    )
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const CSS = `
.ic-root {
  --ic-ink: #1c1a17;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--ic-ink);
  max-width: 420px;
  margin: 0 auto;
}

.ic-card {
  filter: drop-shadow(0 20px 28px rgba(0,0,0,0.28)) drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}
.ic-body {
  position: relative;
  aspect-ratio: 1 / 0.92;
  border-radius: var(--ic-radius);
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.5),
    inset 0 0 0 1px rgba(0,0,0,0.04);
}
.ic-sheen {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background:
    linear-gradient(120deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 26%),
    radial-gradient(140% 90% at 30% 120%, rgba(0,0,0,0.05), transparent 60%);
}

.ic-stripe {
  position: absolute;
  top: 6%;
  left: 18%;
  right: 18%;
  height: 3.5%;
  display: flex;
  border-radius: 2px;
  overflow: hidden;
  z-index: 0;
}
.ic-stripe span { flex: 1; }

.ic-flash-lens {
  position: absolute;
  top: 15%;
  left: 6%;
  width: 24%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle at 40% 35%, #e9e9e9, #b9b9b9 70%, #8f8f8f 100%);
  box-shadow:
    inset 0 0 0 6px rgba(255,255,255,0.55),
    inset 0 4px 8px rgba(0,0,0,0.25),
    0 2px 4px rgba(0,0,0,0.2);
}
.ic-flash-rings {
  position: absolute;
  inset: 14%;
  border-radius: 50%;
  background: repeating-radial-gradient(circle, rgba(120,120,120,0.5) 0px, rgba(120,120,120,0.5) 1.5px, rgba(230,230,230,0.4) 1.5px, rgba(230,230,230,0.4) 4px);
}
.ic-flash-glare {
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 20%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.3) 100%);
}

.ic-shutter {
  position: absolute;
  top: 46%;
  left: 9%;
  width: 15%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: radial-gradient(circle at 35% 28%, #ff6a5c, #d3271b 70%, #a3160c 100%);
  box-shadow:
    inset 0 2px 3px rgba(255,255,255,0.5),
    inset 0 -3px 5px rgba(0,0,0,0.35),
    0 3px 5px rgba(0,0,0,0.3);
  z-index: 2;
  transition: transform 0.05s ease;
}
.ic-shutter:active:not(:disabled) {
  transform: scale(0.93);
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.45);
}
.ic-shutter:disabled { opacity: 0.4; cursor: not-allowed; }

.ic-lens {
  position: absolute;
  top: 13%;
  left: 33%;
  width: 34%;
  aspect-ratio: 1 / 1;
}
.ic-lens-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--ic-accent);
  box-shadow:
    inset 0 2px 4px rgba(255,255,255,0.35),
    inset 0 -6px 10px rgba(0,0,0,0.25),
    0 2px 5px rgba(0,0,0,0.25);
  overflow: hidden;
}
.ic-lens-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 75%, rgba(0,0,0,0.12) 100%);
}
.ic-lens-glass {
  position: absolute;
  inset: 19%;
  border-radius: 50%;
  overflow: hidden;
  background: #050505;
  z-index: 1;
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.6);
}
.ic-lens-iridescence {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0.5;
  background: radial-gradient(circle at 30% 70%, rgba(140,90,220,0.55), transparent 45%),
    radial-gradient(circle at 65% 35%, rgba(60,160,220,0.4), transparent 40%);
}
.ic-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.ic-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.35);
}
.ic-flash-overlay {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.08s ease;
}
.ic-flash-on { opacity: 0.9; transition: opacity 0.02s ease; }

.ic-viewfinder-deco {
  position: absolute;
  top: 16%;
  right: 7%;
  width: 18%;
  aspect-ratio: 1 / 1;
  border-radius: 26%;
  background: linear-gradient(155deg, #d8d8d8, #8a8a8a 60%, #5a5a5a 100%);
  box-shadow:
    inset 0 0 0 3px rgba(255,255,255,0.4),
    0 2px 4px rgba(0,0,0,0.2);
}
.ic-viewfinder-glass {
  position: absolute;
  inset: 20%;
  border-radius: 22%;
  background: radial-gradient(circle at 35% 30%, #e8e8e8, #3a3a3a 70%, #1a1a1a 100%);
  box-shadow: inset 0 2px 3px rgba(0,0,0,0.6);
}

.ic-status-cluster {
  position: absolute;
  top: 44%;
  right: 11%;
  display: flex;
  gap: 5px;
}
.ic-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0,0,0,0.15);
  box-shadow: inset 0 1px 1px rgba(0,0,0,0.3);
}
.ic-dot-on { background: var(--ic-accent); box-shadow: 0 0 4px var(--ic-accent); }

.ic-base {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 20%;
  background: var(--ic-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.15);
}
.ic-slot {
  width: 80%;
  height: 10px;
  border-radius: 3px;
  background: linear-gradient(180deg, #000, #1a1a1a);
  box-shadow: inset 0 2px 3px rgba(0,0,0,0.8);
}

@keyframes ic-eject {
  0% { transform: translate(-50%, 0); opacity: 1; }
  70% { transform: translate(-50%, 46px); opacity: 1; }
  100% { transform: translate(-50%, 60px); opacity: 0; }
}
.ic-eject-print {
  position: absolute;
  left: 50%;
  bottom: 4%;
  width: 34%;
  aspect-ratio: 0.86 / 1;
  background: #fff;
  padding: 4% 4% 16%;
  box-shadow: 0 6px 14px rgba(0,0,0,0.3);
  z-index: 3;
  animation: ic-eject 1.3s ease-in forwards;
  pointer-events: none;
}
.ic-eject-print img { width: 100%; height: 100%; object-fit: cover; display: block; }

.ic-error-note {
  margin: 10px 10px 0;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(0,0,0,0.55);
  text-align: center;
}

/* ---------- settings panel ---------- */
/* ---------- controls row (off the camera face) ---------- */
.ic-controls-row {
  margin: 14px 10px 0;
  display: flex;
  gap: 16px;
}
.ic-text-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0,0,0,0.65);
  cursor: pointer;
}
.ic-text-btn:active { transform: scale(0.97); }

/* ---------- settings panel ---------- */
.ic-preset-row { display: flex; gap: 6px; flex-wrap: wrap; }
.ic-chip {
  border: none;
  background: rgba(0,0,0,0.1);
  color: rgba(0,0,0,0.75);
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
}
.ic-chip-on { background: var(--ic-ink); color: #fff; }
.ic-settings {
  margin: 14px 10px 0;
  background: rgba(0,0,0,0.06);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ic-setting label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: rgba(0,0,0,0.6);
  margin-bottom: 6px;
}
.ic-setting input[type="range"] { width: 100%; }
.ic-setting-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }
.ic-sound-toggle {
  border: none;
  background: rgba(0,0,0,0.1);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  color: rgba(0,0,0,0.75);
  align-self: flex-start;
}

/* ---------- develop row ---------- */
.ic-develop-row {
  margin: 16px 10px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ic-develop {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: rgba(0,0,0,0.65);
  cursor: pointer;
  padding: 0;
}
.ic-develop:disabled { opacity: 0.4; cursor: default; }
.ic-develop-count { font-size: 11px; color: rgba(0,0,0,0.45); }

/* ---------- print gallery ---------- */
.ic-gallery { margin: 10px 10px 0; }
.ic-gallery-empty {
  font-size: 12px;
  color: rgba(0,0,0,0.45);
  padding: 18px 0;
  text-align: center;
  border: 1px dashed rgba(0,0,0,0.15);
  border-radius: 10px;
}
.ic-print-row {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 2px 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.ic-print-row::-webkit-scrollbar { display: none; width: 0; height: 0; }
.ic-print {
  flex: 0 0 auto;
  border: none;
  background: #fdfdfb;
  padding: 6% 6% 22%;
  width: 84px;
  cursor: pointer;
  box-shadow:
    0 3px 6px rgba(0,0,0,0.25),
    0 1px 2px rgba(0,0,0,0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.ic-print:hover { transform: translateY(-2px) rotate(-1deg); box-shadow: 0 6px 12px rgba(0,0,0,0.3); }
.ic-print-photo { display: block; width: 100%; aspect-ratio: 1 / 1; background: #111; overflow: hidden; }
.ic-print-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: brightness(1) contrast(1) saturate(1);
  transition: filter 2.6s ease-out;
}
.ic-print-photo img.ic-developing {
  filter: brightness(2.4) contrast(0.5) saturate(0.15);
  transition: none;
}

/* ---------- fullscreen viewer ---------- */
.ic-viewer {
  position: fixed;
  inset: 0;
  background: rgba(6,6,6,0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}
.ic-viewer-img {
  max-width: min(92vw, 720px);
  max-height: 80vh;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.ic-viewer-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255,255,255,0.12);
  color: #fff;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ic-viewer-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.12);
  color: #fff;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ic-viewer-nav-left { left: 20px; }
.ic-viewer-nav-right { right: 20px; }
.ic-viewer-download {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: #fff;
  color: #111;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
@media (max-width: 480px) {
  .ic-viewer-nav-left { left: 8px; }
  .ic-viewer-nav-right { right: 8px; }
}
`
