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


export default function AsciiPixels(props) {
    const {
        videoFile,
        muted,
        loop,
        autoPlay,
        contrast,
        charSet,
        backgroundColor,
        textColor,
        useCustomTextColor,
        resolutionWidth,
        resolutionHeight,
        fitMode,
    } = props

    const videoRef = React.useRef(null)
    const hiddenCanvasRef = React.useRef(null)
    const visibleCanvasRef = React.useRef(null)
    const containerRef = React.useRef(null)
    const requestRef = React.useRef(null)

    // Syarat Wajib Framer Marketplace: Deteksi Static Renderer
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const chars = React.useMemo(() => charSet.split(""), [charSet])

    // Cache array warna RGB untuk performa rendering
    const colorCache = React.useMemo(() => {
        const cache = new Array(256)
        for (let i = 0; i < 256; i++) {
            cache[i] = `rgb(${i},${i},${i})`
        }
        return cache
    }, [])

    React.useEffect(() => {
        // Jika sedang dalam Static Renderer, batalkan seluruh siklus animasi & event listener
        if (isStatic) return

        const video = videoRef.current
        const hiddenCanvas = hiddenCanvasRef.current
        const visibleCanvas = visibleCanvasRef.current
        const container = containerRef.current

        if (
            !video ||
            !hiddenCanvas ||
            !visibleCanvas ||
            !container ||
            !videoFile
        )
            return

        const hCtx = hiddenCanvas.getContext("2d", { willReadFrequently: true })
        const vCtx = visibleCanvas.getContext("2d")
        if (!hCtx || !vCtx) return

        hiddenCanvas.width = resolutionWidth
        hiddenCanvas.height = resolutionHeight

        const resizeVisibleCanvas = () => {
            const rect = container.getBoundingClientRect()
            visibleCanvas.width = Math.floor(rect.width)
            visibleCanvas.height = Math.floor(rect.height)
        }

        resizeVisibleCanvas()
        const resizeObserver = new ResizeObserver(() => resizeVisibleCanvas())
        resizeObserver.observe(container)

        const renderAscii = () => {
            if (!isCanvas && (video.paused || video.ended)) {
                requestRef.current = requestAnimationFrame(renderAscii)
                return
            }

            const vWidth = video.videoWidth || resolutionWidth
            const vHeight = video.videoHeight || resolutionHeight

            vCtx.fillStyle = backgroundColor
            vCtx.fillRect(0, 0, visibleCanvas.width, visibleCanvas.height)

            let renderWidth = visibleCanvas.width
            let renderHeight = visibleCanvas.height
            let renderX = 0
            let renderY = 0

            const containerRatio = visibleCanvas.width / visibleCanvas.height
            const videoRatio = vWidth / vHeight

            if (fitMode === "cover") {
                if (videoRatio > containerRatio) {
                    renderWidth = visibleCanvas.height * videoRatio
                    renderX = (visibleCanvas.width - renderWidth) / 2
                } else {
                    renderHeight = visibleCanvas.width / videoRatio
                    renderY = (visibleCanvas.height - renderHeight) / 2
                }
            } else if (fitMode === "contain") {
                if (videoRatio > containerRatio) {
                    renderHeight = visibleCanvas.width / videoRatio
                    renderY = (visibleCanvas.height - renderHeight) / 2
                } else {
                    renderWidth = visibleCanvas.height * videoRatio
                    renderX = (visibleCanvas.width - renderWidth) / 2
                }
            } else if (fitMode === "none") {
                renderWidth = vWidth
                renderHeight = vHeight
                renderX = (visibleCanvas.width - vWidth) / 2
                renderY = (visibleCanvas.height - vHeight) / 2
            } else if (fitMode === "scale-down") {
                if (
                    vWidth > visibleCanvas.width ||
                    vHeight > visibleCanvas.height
                ) {
                    if (videoRatio > containerRatio) {
                        renderHeight = visibleCanvas.width / videoRatio
                        renderY = (visibleCanvas.height - renderHeight) / 2
                    } else {
                        renderWidth = visibleCanvas.height * videoRatio
                        renderX = (visibleCanvas.width - renderWidth) / 2
                    }
                } else {
                    renderWidth = vWidth
                    renderHeight = vHeight
                    renderX = (visibleCanvas.width - vWidth) / 2
                    renderY = (visibleCanvas.height - vHeight) / 2
                }
            }

            hCtx.drawImage(video, 0, 0, resolutionWidth, resolutionHeight)

            try {
                const imgData = hCtx.getImageData(
                    0,
                    0,
                    resolutionWidth,
                    resolutionHeight
                )
                const data = imgData.data

                const cellWidth = renderWidth / resolutionWidth
                const cellHeight = renderHeight / resolutionHeight
                const fontSize = Math.min(cellWidth * 1.5, cellHeight * 1.5)

                vCtx.font = `bold ${fontSize}px 'Courier New', Courier, monospace`
                vCtx.textAlign = "center"
                vCtx.textBaseline = "middle"

                const charsLenMinusOne = chars.length - 1
                const vCanvasWidth = visibleCanvas.width
                const vCanvasHeight = visibleCanvas.height

                for (let y = 0; y < resolutionHeight; y++) {
                    const posY = renderY + y * cellHeight + cellHeight / 2
                    if (posY < 0 || posY > vCanvasHeight) continue

                    const rowOffset = y * resolutionWidth

                    for (let x = 0; x < resolutionWidth; x++) {
                        const posX = renderX + x * cellWidth + cellWidth / 2
                        if (posX < 0 || posX > vCanvasWidth) continue

                        const idx = (rowOffset + x) * 4

                        let brightness =
                            0.2126 * data[idx] +
                            0.7152 * data[idx + 1] +
                            0.0722 * data[idx + 2]

                        if (contrast !== 1) {
                            brightness =
                                ((brightness / 255 - 0.5) * contrast + 0.5) *
                                255
                            if (brightness < 0) brightness = 0
                            if (brightness > 255) brightness = 255
                        }

                        const charIdx =
                            ((brightness / 255) * charsLenMinusOne) | 0
                        const char = chars[charIdx] || " "

                        // Menentukan warna font: kustom warna tunggal atau skala abu-abu sesuai kecerahan
                        vCtx.fillStyle = useCustomTextColor
                            ? textColor
                            : colorCache[brightness | 0]

                        vCtx.fillText(char, posX, posY)
                    }
                }
            } catch (e) {
                console.error("Frame processing error:", e)
            }

            if (!isCanvas) {
                requestRef.current = requestAnimationFrame(renderAscii)
            }
        }

        const handlePlay = () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            requestRef.current = requestAnimationFrame(renderAscii)
        }

        if (isCanvas) {
            video.addEventListener("loadeddata", renderAscii, { once: true })
            if (video.readyState >= 2) renderAscii()
        } else {
            video.addEventListener("play", handlePlay)
            if (autoPlay && !video.paused) handlePlay()
        }

        return () => {
            video.removeEventListener("play", handlePlay)
            video.removeEventListener("loadeddata", renderAscii)
            resizeObserver.disconnect()
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [
        resolutionWidth,
        resolutionHeight,
        chars,
        contrast,
        autoPlay,
        videoFile,
        backgroundColor,
        textColor,
        useCustomTextColor,
        fitMode,
        isCanvas,
        isStatic,
        colorCache,
    ])

    const containerStyle = {
        width: "100%",
        height: "100%",
        backgroundColor: backgroundColor,
        overflow: "hidden",
        position: "relative",
    }

    const canvasStyle = {
        width: "100%",
        height: "100%",
        display: "block",
    }

    const hiddenStyle = {
        position: "absolute",
        width: "1px",
        height: "1px",
        opacity: 0,
        pointerEvents: "none",
    }

    // Tampilan Fallback Statis Sederhana untuk SSG/Static Renderer
    if (isStatic) {
        return (
            <div style={containerStyle}>
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: useCustomTextColor
                            ? textColor
                            : "rgba(255, 255, 255, 0.4)",
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: "14px",
                        textAlign: "center",
                        padding: "16px",
                        userSelect: "none",
                    }}
                >
                    ASCII Video
                </div>
            </div>
        )
    }

    const actualAutoPlay = isCanvas ? false : autoPlay

    return (
        <div style={containerStyle} ref={containerRef}>
            {videoFile ? (
                <video
                    key={videoFile}
                    ref={videoRef}
                    src={videoFile}
                    muted={muted}
                    loop={loop}
                    autoPlay={actualAutoPlay}
                    playsInline
                    crossOrigin="anonymous"
                    style={hiddenStyle}
                />
            ) : (
                <div
                    style={{
                        color: useCustomTextColor ? textColor : "#fff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        fontFamily: "sans-serif",
                    }}
                >
                    Please upload an MP4 video file.
                </div>
            )}
            <canvas ref={hiddenCanvasRef} style={hiddenStyle} />
            <canvas ref={visibleCanvasRef} style={canvasStyle} />
        </div>
    )
}

AsciiPixels.defaultProps = {
    videoFile: "",
    muted: true,
    loop: true,
    autoPlay: true,
    contrast: 1.8,
    charSet: " .:-=+*#%@",
    backgroundColor: "#000000",
    useCustomTextColor: false,
    textColor: "#00FF66",
    resolutionWidth: 120,
    resolutionHeight: 70,
    fitMode: "cover",
}

addPropertyControls(AsciiPixels, {
    videoFile: {
        type: ControlType.File,
        title: "Upload Video",
        allowedFileTypes: ["mp4"],
    },
    fitMode: {
        type: ControlType.Enum,
        title: "Fit Mode",
        options: ["cover", "fill", "contain", "scale-down", "none"],
        optionTitles: ["Cover", "Fill", "Contain", "Scale Down", "None"],
        defaultValue: AsciiPixels.defaultProps.fitMode,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: AsciiPixels.defaultProps.backgroundColor,
    },
    useCustomTextColor: {
        type: ControlType.Boolean,
        title: "Custom Color",
        defaultValue: AsciiPixels.defaultProps.useCustomTextColor,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: AsciiPixels.defaultProps.textColor,
        hidden(props) {
            return !props.useCustomTextColor
        },
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: 0.5,
        max: 5,
        step: 0.1,
        defaultValue: AsciiPixels.defaultProps.contrast,
    },
    charSet: {
        type: ControlType.String,
        title: "ASCII Chars",
        defaultValue: AsciiPixels.defaultProps.charSet,
    },
    resolutionWidth: {
        type: ControlType.Number,
        title: "Res Width",
        min: 40,
        max: 250,
        step: 2,
        defaultValue: AsciiPixels.defaultProps.resolutionWidth,
    },
    resolutionHeight: {
        type: ControlType.Number,
        title: "Res Height",
        min: 40,
        max: 250,
        step: 2,
        defaultValue: AsciiPixels.defaultProps.resolutionHeight,
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: AsciiPixels.defaultProps.autoPlay,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: AsciiPixels.defaultProps.loop,
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: AsciiPixels.defaultProps.muted,
    },
})
