// Webカメラの映像を表示するコンポーネント
import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface WebCamEffectsProps {
    borderRadius: number
    flipHorizontal: boolean
    hue: number
    saturation: number
    brightness: number
    effect: "none" | "ascii" | "fisheye" | "glitch"
    asciiResolution: number
    asciiPixelSize: number
    showControls: boolean
    onFlipToggle?: () => void
    onHueChange?: (value: number) => void
    onSaturationChange?: (value: number) => void
    onBrightnessChange?: (value: number) => void
    onEffectChange?: (effect: string) => void
    onAsciiResolutionChange?: (value: number) => void
    onAsciiPixelSizeChange?: (value: number) => void
    onCapture?: () => void
    style?: CSSProperties
}

/**
 * Web Cam Effects
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function WebCamEffects(props: WebCamEffectsProps) {
    const { borderRadius, style, showControls = true } = props
    
    // 内部stateで管理（初期値はpropsから）
    const [flipHorizontal, setFlipHorizontal] = useState(props.flipHorizontal)
    const [hue, setHue] = useState(props.hue)
    const [saturation, setSaturation] = useState(props.saturation)
    const [brightness, setBrightness] = useState(props.brightness)
    const [effect, setEffect] = useState(props.effect)
    const [asciiResolution, setAsciiResolution] = useState(props.asciiResolution)
    const [asciiPixelSize, setAsciiPixelSize] = useState(props.asciiPixelSize)
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [hasPermission, setHasPermission] = useState(true)
    const [isVideoReady, setIsVideoReady] = useState(false)

    // スクリーンショット機能
    const handleCapture = () => {
        if (!canvasRef.current) return
        
        try {
            // キャンバスの内容をBlobに変換してダウンロード
            canvasRef.current.toBlob((blob) => {
                if (!blob) return
                
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
                link.download = `webcam-capture-${timestamp}.png`
                link.href = url
                link.click()
                URL.revokeObjectURL(url)
            }, 'image/png')
            
            // イベントハンドラーを呼び出し
            if (props.onCapture) {
                props.onCapture()
            }
        } catch (error) {
            console.error('Screenshot failed:', error)
        }
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        let stream: MediaStream | null = null
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(s => {
                stream = s
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
                startTransition(() => setHasPermission(true))
            })
            .catch(() => {
                startTransition(() => setHasPermission(false))
            })
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const handleVideoLoaded = () => {
        if (videoRef.current) {
            videoRef.current.play().then(() => {
                startTransition(() => setIsVideoReady(true))
            }).catch((err) => {
                console.error("Video play failed:", err)
            })
        }
    }

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return
        if (!isVideoReady) return
        let animationId: number
        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        function draw() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                // キャンバスの解像度を1.5倍にして文字を鮮明に
                const w = canvas.width = video.videoWidth * 1.5
                const h = canvas.height = video.videoHeight * 1.5
                
                if (w === 0 || h === 0) {
                    animationId = requestAnimationFrame(draw)
                    return
                }
                
                // 元の映像を描画
                ctx.save()
                ctx.clearRect(0, 0, w, h)
                if (flipHorizontal) {
                    ctx.translate(w, 0)
                    ctx.scale(-1, 1)
                }
                ctx.drawImage(video, 0, 0, w, h)
                ctx.restore()
                
                // 元の画像データを保存（エフェクト前）
                const originalImageData = ctx.getImageData(0, 0, w, h)
                const originalData = new Uint8ClampedArray(originalImageData.data)
                
                // 色相・彩度変更
                if (hue !== 0 || saturation !== 1) {
                    const imageData = ctx.getImageData(0, 0, w, h)
                    const data = imageData.data
                    for (let i = 0; i < data.length; i += 4) {
                        let r = data[i] / 255, g = data[i+1] / 255, b = data[i+2] / 255
                        let max = Math.max(r, g, b), min = Math.min(r, g, b)
                        let hVal = 0, s = 0, l = (max + min) / 2
                        if (max !== min) {
                            let d = max - min
                            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
                            switch (max) {
                                case r: hVal = (g - b) / d + (g < b ? 6 : 0); break
                                case g: hVal = (b - r) / d + 2; break
                                case b: hVal = (r - g) / d + 4; break
                            }
                            hVal /= 6
                        }
                        hVal = (hVal + hue / 360) % 1
                        s = Math.max(0, Math.min(1, s * saturation))
                        let q = l < 0.5 ? l * (1 + s) : l + s - l * s
                        let p = 2 * l - q
                        function hue2rgb(p, q, t) {
                            if (t < 0) t += 1
                            if (t > 1) t -= 1
                            if (t < 1/6) return p + (q - p) * 6 * t
                            if (t < 1/2) return q
                            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
                            return p
                        }
                        r = hue2rgb(p, q, hVal + 1/3)
                        g = hue2rgb(p, q, hVal)
                        b = hue2rgb(p, q, hVal - 1/3)
                        data[i] = Math.round(r * 255)
                        data[i+1] = Math.round(g * 255)
                        data[i+2] = Math.round(b * 255)
                    }
                    ctx.putImageData(imageData, 0, 0)
                }
                
                // 明るさ調整
                if (brightness !== 1) {
                    const imageData = ctx.getImageData(0, 0, w, h)
                    const data = imageData.data
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.min(255, Math.max(0, data[i] * brightness))
                        data[i+1] = Math.min(255, Math.max(0, data[i+1] * brightness))
                        data[i+2] = Math.min(255, Math.max(0, data[i+2] * brightness))
                    }
                    ctx.putImageData(imageData, 0, 0)
                }
                
                // エフェクト適用
                if (effect === "ascii") {
                    // アスキーアート: 色調整後の画像データを使用
                    const currentImageData = ctx.getImageData(0, 0, w, h)
                    const data = currentImageData.data
                    
                    ctx.fillStyle = "#000"
                    ctx.fillRect(0, 0, w, h)
                    
                    const chars = "+%&*~:</"
                    // フォントサイズを1.5倍に
                    const fontSize = asciiPixelSize * 1.5
                    ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`
                    ctx.textBaseline = "top"
                    
                    // テキストレンダリングの品質を最大限に向上
                    ctx.imageSmoothingEnabled = false
                    
                    const stepX = fontSize * 0.6
                    const stepY = fontSize
                    
                    // 解像度に基づいてサンプリング間隔を調整
                    const resolutionFactor = 100 / asciiResolution
                    const samplingStepX = stepX * resolutionFactor
                    const samplingStepY = stepY * resolutionFactor
                    
                    for (let y = 0; y < h; y += samplingStepY) {
                        for (let x = 0; x < w; x += samplingStepX) {
                            const pixelIndex = (Math.floor(y) * w + Math.floor(x)) * 4
                            const r = data[pixelIndex]
                            const g = data[pixelIndex + 1]
                            const b = data[pixelIndex + 2]
                            
                            // 明度計算
                            const brightness = (r + g + b) / 3
                            
                            // 肌色検出
                            const max = Math.max(r, g, b)
                            const min = Math.min(r, g, b)
                            const isSkin = (
                                r > 95 && g > 40 && b > 20 &&
                                (max - min) > 15 &&
                                Math.abs(r - g) > 15 &&
                                r > g && r > b
                            )
                            
                            if (brightness > 30) {
                                let char
                                if (isSkin) {
                                    // 人物部分: ランダムな記号
                                    char = chars[Math.floor(Math.random() * chars.length)]
                                    ctx.fillStyle = `rgb(${r},${g},${b})`
                                } else {
                                    // 背景: 明度に応じた文字
                                    const charIndex = Math.floor((brightness / 255) * (chars.length - 1))
                                    char = chars[chars.length - 1 - charIndex]
                                    ctx.fillStyle = `rgb(${r},${g},${b})`
                                }
                                
                                // シャープなテキストレンダリング
                                ctx.save()
                                ctx.translate(x, y)
                                ctx.fillText(char, 0, 0)
                                ctx.restore()
                            }
                        }
                    }
                } else if (effect === "fisheye") {
                    const imageData = ctx.getImageData(0, 0, w, h)
                    const data = imageData.data
                    const newData = ctx.createImageData(w, h)
                    const nd = newData.data
                    const cx = w/2, cy = h/2, r = Math.min(w, h)/2
                    for (let y = 0; y < h; y++) {
                        for (let x = 0; x < w; x++) {
                            const dx = x - cx, dy = y - cy
                            const dist = Math.sqrt(dx*dx + dy*dy)
                            let theta = Math.atan2(dy, dx)
                            let r2 = dist / r
                            let r3 = Math.pow(r2, 2)
                            let srcR = r * r3
                            let sx = Math.round(cx + srcR * Math.cos(theta))
                            let sy = Math.round(cy + srcR * Math.sin(theta))
                            if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                                let si = (sy*w+sx)*4, di = (y*w+x)*4
                                nd[di] = data[si]
                                nd[di+1] = data[si+1]
                                nd[di+2] = data[si+2]
                                nd[di+3] = data[si+3]
                            }
                        }
                    }
                    ctx.putImageData(newData, 0, 0)
                } else if (effect === "glitch") {
                    const imageData = ctx.getImageData(0, 0, w, h)
                    const data = imageData.data
                    const newData = new Uint8ClampedArray(data)
                    for (let y = 0; y < h; y++) {
                        for (let x = 0; x < w; x++) {
                            const i = (y*w+x)*4
                            if (x+5 < w) {
                                newData[i] = data[i+20]
                            }
                            if (x-5 >= 0) {
                                newData[i+2] = data[i-20+2]
                            }
                        }
                    }
                    const glitchData = ctx.createImageData(w, h)
                    glitchData.data.set(newData)
                    ctx.putImageData(glitchData, 0, 0)
                }
            }
            animationId = requestAnimationFrame(draw)
        }
        animationId = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(animationId)
    }, [flipHorizontal, hue, saturation, brightness, effect, asciiResolution, asciiPixelSize, isVideoReady])

    if (RenderTarget.current() === RenderTarget.thumbnail) {
        return <div style={{ width: "100%", height: "100%", borderRadius, display: "flex", alignItems: "center", justifyContent: "center" }}>📷</div>
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                background: "#000000",
                borderRadius,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
            }}
        >
            {hasPermission ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={handleVideoLoaded}
                        style={{ display: "none" }}
                        aria-label="Webcam feed"
                    />
                    <canvas
                        ref={canvasRef}
                        style={{ width: "100%", height: "100%", borderRadius }}
                        aria-label="Webcam feed (with effects)"
                    />
                    
                    {/* コントロールパネル */}
                    {/* Control panel */}
                    {showControls && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: 16,
                                right: 16,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: 8,
                            }}
                        >
                            {/* トグルボタン */}
                            {/* Toggle button */}
                            <button
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    border: "none",
                                    background: "rgba(0, 0, 0, 0.7)",
                                    backdropFilter: "blur(10px)",
                                    color: "#fff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                                }}
                                aria-label={isPanelOpen ? "Close controls" : "Open controls"}
                            >
                                {isPanelOpen ? "✕" : "⚙"}
                            </button>
                            
                            {/* 撮影ボタン */}
                            {/* Capture button */}
                            <button
                                onClick={handleCapture}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    border: "none",
                                    background: "rgba(255, 255, 255, 0.9)",
                                    backdropFilter: "blur(10px)",
                                    color: "#000",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                                }}
                                aria-label="Take screenshot"
                                title="Take screenshot"
                            >
                                📷
                            </button>

                            {/* コントロールパネル */}
                            {/* Control panel */}
                            {isPanelOpen && (
                                <div
                                    style={{
                                        background: "rgba(0, 0, 0, 0.85)",
                                        backdropFilter: "blur(10px)",
                                        borderRadius: 12,
                                        padding: 16,
                                        color: "#fff",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 12,
                                        minWidth: 280,
                                        maxWidth: 320,
                                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                                        animation: "slideIn 0.2s ease",
                                    }}
                                >
                                    <style>
                                        {`
                                            @keyframes slideIn {
                                                from {
                                                    opacity: 0;
                                                    transform: translateY(10px);
                                                }
                                                to {
                                                    opacity: 1;
                                                    transform: translateY(0);
                                                }
                                            }
                                        `}
                                    </style>

                                    {/* 左右反転 */}
                                    {/* Horizontal flip */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <label style={{ fontSize: 13, fontWeight: 500 }}>Flip Horizontal</label>
                                        <button
                                            onClick={() => setFlipHorizontal(!flipHorizontal)}
                                            style={{
                                                padding: "4px 12px",
                                                borderRadius: 6,
                                                border: "none",
                                                background: flipHorizontal ? "#0099FF" : "#444",
                                                color: "#fff",
                                                cursor: "pointer",
                                                fontSize: 12,
                                                fontWeight: 500,
                                                transition: "background 0.2s ease",
                                            }}
                                        >
                                            {flipHorizontal ? "ON" : "OFF"}
                                        </button>
                                    </div>

                                    {/* エフェクト選択 */}
                                    {/* Effect selection */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 13, fontWeight: 500 }}>Effect</label>
                                        <select
                                            value={effect}
                                            onChange={(e) => setEffect(e.target.value as any)}
                                            style={{
                                                padding: "6px 10px",
                                                borderRadius: 6,
                                                border: "none",
                                                background: "#444",
                                                color: "#fff",
                                                cursor: "pointer",
                                                fontSize: 12,
                                            }}
                                        >
                                            <option value="none">None</option>
                                            <option value="ascii">ASCII Art</option>
                                            <option value="fisheye">Fisheye</option>
                                            <option value="glitch">Glitch</option>
                                        </select>
                                    </div>

                                    {/* 色相 */}
                                    {/* Hue */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <label style={{ fontSize: 13, fontWeight: 500 }}>Hue</label>
                                            <span style={{ fontSize: 11, color: "#aaa" }}>{hue}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            step="1"
                                            value={hue}
                                            onChange={(e) => setHue(Number(e.target.value))}
                                            style={{ width: "100%", cursor: "pointer" }}
                                        />
                                    </div>

                                    {/* 彩度 */}
                                    {/* Saturation */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <label style={{ fontSize: 13, fontWeight: 500 }}>Saturation</label>
                                            <span style={{ fontSize: 11, color: "#aaa" }}>{saturation.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.01"
                                            value={saturation}
                                            onChange={(e) => setSaturation(Number(e.target.value))}
                                            style={{ width: "100%", cursor: "pointer" }}
                                        />
                                    </div>

                                    {/* 明るさ */}
                                    {/* Brightness */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <label style={{ fontSize: 13, fontWeight: 500 }}>Brightness</label>
                                            <span style={{ fontSize: 11, color: "#aaa" }}>{brightness.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.01"
                                            value={brightness}
                                            onChange={(e) => setBrightness(Number(e.target.value))}
                                            style={{ width: "100%", cursor: "pointer" }}
                                        />
                                    </div>

                                    {/* ASCII解像度 */}
                                    {/* ASCII resolution */}
                                    {effect === "ascii" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <label style={{ fontSize: 13, fontWeight: 500 }}>ASCII Resolution</label>
                                                <span style={{ fontSize: 11, color: "#aaa" }}>{asciiResolution}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="200"
                                                step="1"
                                                value={asciiResolution}
                                                onChange={(e) => setAsciiResolution(Number(e.target.value))}
                                                style={{ width: "100%", cursor: "pointer" }}
                                            />
                                        </div>
                                    )}

                                    {/* ASCIIピクセルサイズ */}
                                    {/* ASCII pixel size */}
                                    {effect === "ascii" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <label style={{ fontSize: 13, fontWeight: 500 }}>ASCII Pixel Size</label>
                                                <span style={{ fontSize: 11, color: "#aaa" }}>{asciiPixelSize}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="4"
                                                max="20"
                                                step="1"
                                                value={asciiPixelSize}
                                                onChange={(e) => setAsciiPixelSize(Number(e.target.value))}
                                                style={{ width: "100%", cursor: "pointer" }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#888", fontSize: 16 }}>カメラの許可がありません</span>
                    <span style={{ color: "#888", fontSize: 16 }}>Camera permission denied</span>
                </div>
            )}
        </div>
    )
}

addPropertyControls(WebCamEffects, {
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 64,
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Show Controls",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    flipHorizontal: {
        type: ControlType.Boolean,
        title: "Flip Horizontal (Initial)",
        defaultValue: false,
        enabledTitle: "Flipped",
        disabledTitle: "Normal",
    },
    hue: {
        type: ControlType.Number,
        title: "Hue (Initial)",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    saturation: {
        type: ControlType.Number,
        title: "Saturation (Initial)",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness (Initial)",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
    },
    effect: {
        type: ControlType.Enum,
        title: "Effect (Initial)",
        options: ["none", "ascii", "fisheye", "glitch"],
        optionTitles: ["None", "ASCII Art", "Fisheye", "Glitch"],
        defaultValue: "none",
    },
    asciiResolution: {
        type: ControlType.Number,
        title: "ASCII Resolution (Initial)",
        defaultValue: 100,
        min: 10,
        max: 200,
        step: 1,
    },
    asciiPixelSize: {
        type: ControlType.Number,
        title: "ASCII Pixel Size (Initial)",
        defaultValue: 8,
        min: 4,
        max: 20,
        step: 1,
    },
    onFlipToggle: {
        type: ControlType.EventHandler,
    },
    onHueChange: {
        type: ControlType.EventHandler,
    },
    onSaturationChange: {
        type: ControlType.EventHandler,
    },
    onBrightnessChange: {
        type: ControlType.EventHandler,
    },
    onEffectChange: {
        type: ControlType.EventHandler,
    },
    onAsciiResolutionChange: {
        type: ControlType.EventHandler,
    },
    onAsciiPixelSizeChange: {
        type: ControlType.EventHandler,
    },
    onCapture: {
        type: ControlType.EventHandler,
    },
})
