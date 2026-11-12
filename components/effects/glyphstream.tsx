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


// GlyphStream
//
// Renders any video OR image as an animated ASCII character stream on a canvas.
// All settings live in Framer's property panel; there is no on-canvas UI.
//
// Video  -> the video plays and is re-sampled to ASCII every frame (throttled to Frame Rate).
// Image  -> the source is sampled ONCE into a low-res brightness grid; the animation only
//           modulates that stored array (shimmer) or gates its reveal, never re-samples and
//           never calls setState per frame.
//
// Source type (video vs image) is auto-detected from the file extension.

interface GlyphStreamProps {
    media?: string
    cellSize: number
    characters: string
    colorMode: "monochrome" | "sampled"
    invert: boolean
    contrast: number
    darkCutoff: number
    minOpacity: number
    glyphColor: string
    backgroundColor: string
    font: {
        fontFamily?: string
        fontSize?: string | number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string | number
        lineHeight?: string | number
        textAlign?: "left" | "center" | "right"
    }
    // Video-only
    playback: "inView" | "hover" | "always"
    loop: boolean
    frameRate: number
    // Image-only
    imageAnimation: "shimmer" | "reveal" | "off"
    animationIntensity: number
    animationSpeed: number
    style?: React.CSSProperties
}

type GridConfig = {
    width: number
    height: number
    columns: number
    rows: number
}

const REVEAL_SPAN_MS = 800
const REVEAL_TOTAL_MS = 1050

const isImageUrl = (url?: string) =>
    /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(url ?? "")

/**
 * GlyphStream
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
 */
export default function GlyphStream(props: GlyphStreamProps) {
    const {
        media = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        cellSize = 8,
        characters = "@%#*+=-:. ",
        colorMode = "monochrome",
        invert = false,
        contrast = 1,
        darkCutoff = 0.12,
        minOpacity = 0.15,
        glyphColor = "#FFFFFF",
        backgroundColor = "#0A0A0A",
        font,
        playback = "inView",
        loop = true,
        frameRate = 24,
        imageAnimation = "shimmer",
        animationIntensity = 0.25,
        animationSpeed = 10,
        style,
    } = props

    const isImageMode = isImageUrl(media)

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const offscreenRef = React.useRef<HTMLCanvasElement | null>(null)
    const offscreenCtxRef = React.useRef<CanvasRenderingContext2D | null>(null)
    const renderCtxRef = React.useRef<CanvasRenderingContext2D | null>(null)
    const renderFontSignatureRef = React.useRef("")
    const taintedRef = React.useRef(false)

    // Video loop bookkeeping.
    const rafRef = React.useRef<number | null>(null)
    const lastFrameTimeRef = React.useRef(0)
    const targetFrameIntervalRef = React.useRef(1000 / 24)
    const shouldPlayVideoRef = React.useRef(false)
    const metadataReadyRef = React.useRef(false)

    // Image sampled-once base data + animation scratch (all ref-driven; no setState in loop).
    const baseLumRef = React.useRef<Float32Array | null>(null)
    const baseRGBARef = React.useRef<Uint8ClampedArray | null>(null)
    const jitterRef = React.useRef<Int8Array | null>(null)
    const revealDelaysRef = React.useRef<Float32Array | null>(null)
    const baseReadyRef = React.useRef(false)
    const revealActiveRef = React.useRef(false)
    const revealStartRef = React.useRef(0)
    const imageRafRef = React.useRef<number | null>(null)

    // Ref-held callbacks so the rAF loops always read the latest values without being
    // torn down and rebuilt every frame (avoids stale closures).
    const drawAsciiFrameRef = React.useRef<() => void>(() => {})
    const startLoopRef = React.useRef<() => void>(() => {})
    const stopLoopRef = React.useRef<() => void>(() => {})
    const updateShimmerJitterRef = React.useRef<() => void>(() => {})

    const isStaticRenderer = useIsStaticRenderer()

    const [size, setSize] = React.useState({ width: 640, height: 360 })
    const [grid, setGrid] = React.useState<GridConfig>({
        width: 640,
        height: 360,
        columns: Math.max(1, Math.floor(640 / Math.max(1, cellSize))),
        rows: Math.max(1, Math.floor(360 / Math.max(1, cellSize))),
    })
    const [prefersReducedMotion, setPrefersReducedMotion] =
        React.useState(false)
    const [isTouchLikeDevice, setIsTouchLikeDevice] = React.useState(false)
    const [isInView, setIsInView] = React.useState(false)
    const [hoverIntent, setHoverIntent] = React.useState(false)
    // Bumped whenever the image base array is rebuilt, to restart paints / reveal.
    const [baseVersion, setBaseVersion] = React.useState(0)
    const [resolvedCanvasColors, setResolvedCanvasColors] = React.useState(
        () => ({ glyph: glyphColor, background: backgroundColor })
    )

    const fallbackMonospace =
        'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
    const fontFamily = font?.fontFamily || fallbackMonospace
    const fontWeight = font?.fontWeight ?? 400
    const fontStyle = font?.fontStyle ?? "normal"
    const safeCharacters = characters.length > 0 ? characters : " "

    React.useEffect(() => {
        targetFrameIntervalRef.current =
            1000 / Math.max(1, Math.min(60, frameRate || 24))
    }, [frameRate])

    const normalizeColor = React.useCallback(
        (color: string) => color.trim().toLowerCase(),
        []
    )

    // CSS var() values do not resolve inside a 2D canvas context, so any var() passed
    // as a color prop is resolved to a raw hex/rgb string here, before it reaches canvas.
    // Literal colors (the usual case when binding Framer color styles) pass straight through.
    const resolveCanvasColor = React.useCallback(
        (input: string, fallbackLiteral: string) => {
            const safeInput = (input ?? "").trim()
            if (!safeInput) return fallbackLiteral
            if (!safeInput.startsWith("var(")) return safeInput
            const varMatch = safeInput.match(
                /^var\(\s*(--[^,\s)]+)\s*(?:,\s*([^)]+))?\s*\)$/
            )
            if (!varMatch) return safeInput
            const propertyName = varMatch[1]
            const inlineFallback = varMatch[2]?.trim() || fallbackLiteral
            if (typeof window === "undefined") return inlineFallback
            const target = rootRef.current ?? document.documentElement
            const computed = window
                .getComputedStyle(target)
                .getPropertyValue(propertyName)
                .trim()
            return computed || inlineFallback
        },
        []
    )

    const resolvedInputGlyphColor = resolvedCanvasColors.glyph
    const resolvedInputBackgroundColor = resolvedCanvasColors.background

    const parseColorToRgb = React.useCallback(
        (color: string) => {
            const normalized = normalizeColor(color)
            const shortHexMatch = normalized.match(/^#([\da-f]{3})$/i)
            if (shortHexMatch) {
                const hex = shortHexMatch[1]
                return {
                    r: Number.parseInt(`${hex[0]}${hex[0]}`, 16),
                    g: Number.parseInt(`${hex[1]}${hex[1]}`, 16),
                    b: Number.parseInt(`${hex[2]}${hex[2]}`, 16),
                }
            }
            const longHexMatch = normalized.match(/^#([\da-f]{6})$/i)
            if (longHexMatch) {
                const hex = longHexMatch[1]
                return {
                    r: Number.parseInt(hex.slice(0, 2), 16),
                    g: Number.parseInt(hex.slice(2, 4), 16),
                    b: Number.parseInt(hex.slice(4, 6), 16),
                }
            }
            const rgbMatch = normalized.match(
                /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/
            )
            if (rgbMatch) {
                return {
                    r: Math.max(
                        0,
                        Math.min(255, Number.parseFloat(rgbMatch[1]))
                    ),
                    g: Math.max(
                        0,
                        Math.min(255, Number.parseFloat(rgbMatch[2]))
                    ),
                    b: Math.max(
                        0,
                        Math.min(255, Number.parseFloat(rgbMatch[3]))
                    ),
                }
            }
            return null
        },
        [normalizeColor]
    )

    const backgroundRelativeLuminance = React.useMemo(() => {
        const rgb = parseColorToRgb(resolvedInputBackgroundColor ?? "")
        if (!rgb) return 0
        const channelToLinear = (channel: number) => {
            const value = channel / 255
            return value <= 0.03928
                ? value / 12.92
                : Math.pow((value + 0.055) / 1.055, 2.4)
        }
        const r = channelToLinear(rgb.r)
        const g = channelToLinear(rgb.g)
        const b = channelToLinear(rgb.b)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }, [parseColorToRgb, resolvedInputBackgroundColor])

    // Safeguard: in monochrome mode, glyphs become invisible if the glyph color matches
    // the background. Fall back to a contrasting default in that case.
    const resolvedGlyphColor = React.useMemo(() => {
        const normalizedGlyph = normalizeColor(resolvedInputGlyphColor ?? "")
        const normalizedBackground = normalizeColor(
            resolvedInputBackgroundColor ?? ""
        )
        if (!normalizedGlyph || normalizedGlyph !== normalizedBackground)
            return resolvedInputGlyphColor
        return backgroundRelativeLuminance > 0.5 ? "#0A0A0A" : "#FFFFFF"
    }, [
        backgroundRelativeLuminance,
        normalizeColor,
        resolvedInputBackgroundColor,
        resolvedInputGlyphColor,
    ])

    React.useEffect(() => {
        const updateResolvedCanvasColors = () => {
            const nextGlyph = resolveCanvasColor(glyphColor, "#FFFFFF")
            const nextBackground = resolveCanvasColor(
                backgroundColor,
                "#0A0A0A"
            )
            React.startTransition(() => {
                setResolvedCanvasColors((current) => {
                    if (
                        current.glyph === nextGlyph &&
                        current.background === nextBackground
                    ) {
                        return current
                    }
                    return { glyph: nextGlyph, background: nextBackground }
                })
            })
        }

        updateResolvedCanvasColors()
        if (
            typeof window === "undefined" ||
            typeof MutationObserver === "undefined"
        )
            return
        // Re-resolve when a theme class/attribute on the document changes, so canvas
        // colours track a CSS-variable-based theme toggle.
        const observer = new MutationObserver(() => {
            updateResolvedCanvasColors()
        })
        const observeOptions: MutationObserverInit = {
            attributes: true,
            subtree: false,
        }
        if (document.documentElement)
            observer.observe(document.documentElement, observeOptions)
        if (document.body) observer.observe(document.body, observeOptions)
        return () => observer.disconnect()
    }, [backgroundColor, glyphColor, resolveCanvasColor])

    const computeGrid = React.useCallback(
        (width: number, height: number): GridConfig => {
            const safeWidth = Number.isFinite(width) && width > 0 ? width : 1
            const safeHeight =
                Number.isFinite(height) && height > 0 ? height : 1
            const baseCell =
                Number.isFinite(cellSize) && cellSize > 0 ? cellSize : 8

            // Caps bound per-frame work for video (getImageData + glyph loop).
            const maxCols = 100
            const maxRows = 240
            let columns = Math.max(1, Math.floor(safeWidth / baseCell))
            columns = Math.min(columns, maxCols)
            const effectiveCell = safeWidth / columns
            let rows = Math.max(1, Math.round(safeHeight / effectiveCell))
            rows = Math.min(rows, maxRows)

            return { width: safeWidth, height: safeHeight, columns, rows }
        },
        [cellSize]
    )

    const setupVisibleCanvas = React.useCallback(
        (width: number, height: number) => {
            const canvas = canvasRef.current
            if (!canvas) return null
            const ctx = canvas.getContext("2d")
            if (!ctx) return null

            const dpr = 1
            canvas.width = Math.max(1, Math.floor(width * dpr))
            canvas.height = Math.max(1, Math.floor(height * dpr))
            canvas.style.width = "100%"
            canvas.style.height = "100%"
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.imageSmoothingEnabled = false
            renderCtxRef.current = ctx
            renderFontSignatureRef.current = ""
            return ctx
        },
        []
    )

    // Single draw routine. The per-cell brightness/colour source is the only thing that
    // differs between modes: video reads a freshly-sampled frame, image reads the stored
    // base array (plus jitter / reveal gating). The glyph maths runs once, here.
    const drawAsciiFrame = React.useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const renderCtx =
            renderCtxRef.current ?? setupVisibleCanvas(size.width, size.height)
        if (!renderCtx) return

        const cols = grid.columns
        const rows = grid.rows

        const paintBackgroundOnly = () => {
            renderCtx.fillStyle = resolvedInputBackgroundColor
            renderCtx.fillRect(0, 0, grid.width, grid.height)
        }

        if (taintedRef.current) {
            paintBackgroundOnly()
            return
        }

        let liveData: Uint8ClampedArray | null = null

        if (!isImageMode) {
            const videoEl = videoRef.current
            if (
                !videoEl ||
                videoEl.readyState < 2 ||
                videoEl.videoWidth <= 0 ||
                videoEl.videoHeight <= 0
            ) {
                paintBackgroundOnly()
                return
            }
            if (!offscreenRef.current) {
                if (typeof document === "undefined") return
                offscreenRef.current = document.createElement("canvas")
            }
            const offscreen = offscreenRef.current
            if (offscreen.width !== cols) offscreen.width = cols
            if (offscreen.height !== rows) offscreen.height = rows
            if (!offscreenCtxRef.current) {
                offscreenCtxRef.current = offscreen.getContext("2d", {
                    willReadFrequently: true,
                })
            }
            const offCtx = offscreenCtxRef.current
            if (!offCtx) return
            offCtx.imageSmoothingEnabled = true
            offCtx.drawImage(videoEl, 0, 0, cols, rows)
            try {
                liveData = offCtx.getImageData(0, 0, cols, rows).data
            } catch (error) {
                taintedRef.current = true
                paintBackgroundOnly()
                return
            }
        } else if (!baseReadyRef.current || !baseLumRef.current) {
            paintBackgroundOnly()
            return
        }

        renderCtx.fillStyle = resolvedInputBackgroundColor
        renderCtx.fillRect(0, 0, grid.width, grid.height)

        const fontSizePx = Math.max(
            4,
            Math.floor(Math.min(size.width / cols, size.height / rows))
        )
        const fontSignature = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`
        if (renderFontSignatureRef.current !== fontSignature) {
            renderCtx.textBaseline = "top"
            renderCtx.textAlign = "left"
            renderCtx.font = fontSignature
            renderFontSignatureRef.current = fontSignature
        }

        const charCount = safeCharacters.length
        const cellW = grid.width / cols
        const cellH = grid.height / rows
        const isLightBg = backgroundRelativeLuminance > 0.5
        const themeInvert = isLightBg ? !invert : invert

        const baseLum = baseLumRef.current
        const baseRGBA = baseRGBARef.current
        const jitter = jitterRef.current
        const reveal = revealDelaysRef.current

        const isShimmer =
            isImageMode && imageAnimation === "shimmer" && !!jitter
        const revealing =
            isImageMode &&
            imageAnimation === "reveal" &&
            revealActiveRef.current &&
            !!reveal
        const now =
            typeof performance !== "undefined" ? performance.now() : Date.now()
        const revealElapsed = revealing
            ? now - revealStartRef.current
            : Infinity

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const ci = y * cols + x

                let r = 0
                let g = 0
                let b = 0
                let a = 1
                let lum: number

                if (!isImageMode && liveData) {
                    const i = ci * 4
                    r = liveData[i]
                    g = liveData[i + 1]
                    b = liveData[i + 2]
                    a = liveData[i + 3] / 255
                    if (a <= 0) continue
                    lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                } else {
                    if (revealing && reveal && revealElapsed < reveal[ci])
                        continue
                    lum = baseLum ? baseLum[ci] : 0
                    if (colorMode === "sampled" && baseRGBA) {
                        const o = ci * 4
                        r = baseRGBA[o]
                        g = baseRGBA[o + 1]
                        b = baseRGBA[o + 2]
                        a = baseRGBA[o + 3] / 255
                        if (a <= 0) continue
                    }
                }

                let adjustedLuminance = (lum - 0.5) * contrast + 0.5
                if (themeInvert) adjustedLuminance = 1 - adjustedLuminance
                adjustedLuminance = Math.max(0, Math.min(1, adjustedLuminance))

                if (colorMode !== "sampled" && adjustedLuminance < darkCutoff)
                    continue

                let idx = Math.floor(adjustedLuminance * (charCount - 1))
                if (isShimmer && jitter) idx += jitter[ci]
                idx = Math.max(0, Math.min(charCount - 1, idx))
                const glyph = safeCharacters[idx]

                if (colorMode === "sampled") {
                    let sampledR = r
                    let sampledG = g
                    let sampledB = b
                    // On a light background, near-white source pixels become near-invisible
                    // glyphs. Scale toward 0 so glyph luminance is capped around 0.7.
                    if (isLightBg && lum > 0.7) {
                        const scale = 0.7 / lum
                        sampledR = r * scale
                        sampledG = g * scale
                        sampledB = b * scale
                    }
                    renderCtx.globalAlpha = 1
                    renderCtx.fillStyle = `rgba(${sampledR}, ${sampledG}, ${sampledB}, ${a})`
                } else {
                    renderCtx.globalAlpha =
                        a * (minOpacity + (1 - minOpacity) * adjustedLuminance)
                    renderCtx.fillStyle = resolvedGlyphColor
                }
                renderCtx.fillText(glyph, x * cellW, y * cellH)
            }
        }
        renderCtx.globalAlpha = 1
    }, [
        backgroundRelativeLuminance,
        colorMode,
        contrast,
        darkCutoff,
        fontFamily,
        fontStyle,
        fontWeight,
        grid.columns,
        grid.height,
        grid.rows,
        grid.width,
        imageAnimation,
        invert,
        isImageMode,
        minOpacity,
        resolvedGlyphColor,
        resolvedInputBackgroundColor,
        safeCharacters,
        setupVisibleCanvas,
        size.height,
        size.width,
    ])

    // Recompute per-cell shimmer jitter: only cells whose brightness sits near a ramp
    // boundary get a chance to nudge their glyph index by +/-1.
    const updateShimmerJitter = React.useCallback(() => {
        const lum = baseLumRef.current
        const jitter = jitterRef.current
        if (!lum || !jitter) return
        const charCount = safeCharacters.length
        const isLightBg = backgroundRelativeLuminance > 0.5
        const themeInvert = isLightBg ? !invert : invert

        for (let ci = 0; ci < lum.length; ci++) {
            let adjustedLuminance = (lum[ci] - 0.5) * contrast + 0.5
            if (themeInvert) adjustedLuminance = 1 - adjustedLuminance
            adjustedLuminance = Math.max(0, Math.min(1, adjustedLuminance))
            const ramp = adjustedLuminance * (charCount - 1)
            const frac = ramp - Math.floor(ramp)
            const nearBoundary = frac < 0.2 || frac > 0.8
            if (nearBoundary && Math.random() < animationIntensity) {
                jitter[ci] = Math.random() < 0.5 ? -1 : 1
            } else {
                jitter[ci] = 0
            }
        }
    }, [
        animationIntensity,
        backgroundRelativeLuminance,
        contrast,
        invert,
        safeCharacters,
    ])

    const stopLoop = React.useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        lastFrameTimeRef.current = 0
    }, [])

    const startLoop = React.useCallback(() => {
        if (
            isStaticRenderer ||
            prefersReducedMotion ||
            rafRef.current !== null ||
            !metadataReadyRef.current
        ) {
            return
        }
        const tick = (timestamp: number) => {
            const videoEl = videoRef.current
            if (
                !videoEl ||
                !canvasRef.current ||
                !shouldPlayVideoRef.current ||
                (videoEl.ended && !videoEl.loop)
            ) {
                stopLoopRef.current()
                return
            }
            if (lastFrameTimeRef.current === 0)
                lastFrameTimeRef.current = timestamp
            if (
                timestamp - lastFrameTimeRef.current >=
                targetFrameIntervalRef.current
            ) {
                lastFrameTimeRef.current = timestamp
                drawAsciiFrameRef.current()
            }
            rafRef.current = requestAnimationFrame(tick)
        }
        lastFrameTimeRef.current = 0
        rafRef.current = requestAnimationFrame(tick)
    }, [isStaticRenderer, prefersReducedMotion])

    React.useEffect(() => {
        drawAsciiFrameRef.current = drawAsciiFrame
        startLoopRef.current = startLoop
        stopLoopRef.current = stopLoop
        updateShimmerJitterRef.current = updateShimmerJitter
    })

    // Responsive sizing.
    React.useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof ResizeObserver === "undefined"
        )
            return
        const node = rootRef.current
        if (!node) return

        const updateSize = () => {
            const rect = node.getBoundingClientRect()
            const nextWidth = Math.max(1, Math.floor(rect.width || 640))
            const nextHeight = Math.max(1, Math.floor(rect.height || 360))
            const nextGrid = computeGrid(nextWidth, nextHeight)
            setupVisibleCanvas(nextWidth, nextHeight)
            React.startTransition(() => {
                setSize({ width: nextWidth, height: nextHeight })
                setGrid(nextGrid)
            })
        }

        updateSize()
        const ro = new ResizeObserver(updateSize)
        ro.observe(node)
        return () => ro.disconnect()
    }, [computeGrid, setupVisibleCanvas])

    React.useEffect(() => {
        const nextGrid = computeGrid(size.width, size.height)
        React.startTransition(() => {
            setGrid(nextGrid)
        })
    }, [cellSize, computeGrid, size.height, size.width])

    // prefers-reduced-motion.
    React.useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        )
            return
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = (matches: boolean) => {
            React.startTransition(() => setPrefersReducedMotion(matches))
        }
        update(mediaQuery.matches)
        const onChange = (event: MediaQueryListEvent) => update(event.matches)
        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", onChange)
            return () => mediaQuery.removeEventListener("change", onChange)
        }
        mediaQuery.addListener(onChange)
        return () => mediaQuery.removeListener(onChange)
    }, [])

    // Touch / no-hover detection (so Hover playback can fall back to In View on phones).
    React.useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        )
            return
        const hoverNoneQuery = window.matchMedia("(hover: none)")
        const coarsePointerQuery = window.matchMedia("(pointer: coarse)")
        const update = () => {
            const matches = hoverNoneQuery.matches || coarsePointerQuery.matches
            React.startTransition(() => setIsTouchLikeDevice(matches))
        }
        update()
        const onChange = () => update()
        if (typeof hoverNoneQuery.addEventListener === "function") {
            hoverNoneQuery.addEventListener("change", onChange)
            coarsePointerQuery.addEventListener("change", onChange)
            return () => {
                hoverNoneQuery.removeEventListener("change", onChange)
                coarsePointerQuery.removeEventListener("change", onChange)
            }
        }
        hoverNoneQuery.addListener(onChange)
        coarsePointerQuery.addListener(onChange)
        return () => {
            hoverNoneQuery.removeListener(onChange)
            coarsePointerQuery.removeListener(onChange)
        }
    }, [])

    // In-view detection (drives In View playback and off-screen pausing).
    React.useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof IntersectionObserver === "undefined"
        )
            return
        const node = rootRef.current
        if (!node) return
        const io = new IntersectionObserver((entries) => {
            const entry = entries[0]
            React.startTransition(() =>
                setIsInView(Boolean(entry?.isIntersecting))
            )
        })
        io.observe(node)
        return () => io.disconnect()
    }, [])

    const isHoverWithTouchFallback = playback === "hover" && isTouchLikeDevice

    const shouldPlayVideo =
        !isImageMode &&
        !isStaticRenderer &&
        !prefersReducedMotion &&
        (playback === "always"
            ? true
            : playback === "hover"
              ? isHoverWithTouchFallback
                  ? isInView
                  : hoverIntent
              : isInView)

    // ----- IMAGE: sample the source ONCE into the grid -----
    React.useEffect(() => {
        if (!isImageMode) {
            baseReadyRef.current = false
            return
        }
        if (typeof document === "undefined" || typeof Image === "undefined")
            return
        const cols = grid.columns
        const rows = grid.rows
        if (cols < 1 || rows < 1 || !media) return

        let cancelled = false
        baseReadyRef.current = false
        taintedRef.current = false

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            if (cancelled) return
            const naturalW = img.naturalWidth
            const naturalH = img.naturalHeight
            if (naturalW <= 0 || naturalH <= 0) return
            const off =
                offscreenRef.current ??
                (offscreenRef.current = document.createElement("canvas"))
            off.width = cols
            off.height = rows
            const offCtx = off.getContext("2d", { willReadFrequently: true })
            if (!offCtx) return
            offscreenCtxRef.current = offCtx

            offCtx.imageSmoothingEnabled = true
            offCtx.clearRect(0, 0, cols, rows)
            // Cover-fit the source into the grid.
            const scale = Math.max(cols / naturalW, rows / naturalH)
            const drawW = naturalW * scale
            const drawH = naturalH * scale
            offCtx.drawImage(
                img,
                (cols - drawW) / 2,
                (rows - drawH) / 2,
                drawW,
                drawH
            )

            let data: Uint8ClampedArray
            try {
                data = offCtx.getImageData(0, 0, cols, rows).data
            } catch (error) {
                taintedRef.current = true
                baseReadyRef.current = false
                return
            }

            const n = cols * rows
            const lum = new Float32Array(n)
            const rgba = new Uint8ClampedArray(n * 4)
            for (let i = 0; i < n; i++) {
                const o = i * 4
                const rr = data[o]
                const gg = data[o + 1]
                const bb = data[o + 2]
                lum[i] = (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255
                rgba[o] = rr
                rgba[o + 1] = gg
                rgba[o + 2] = bb
                rgba[o + 3] = data[o + 3]
            }
            const delays = new Float32Array(n)
            for (let i = 0; i < n; i++)
                delays[i] = Math.random() * REVEAL_SPAN_MS

            baseLumRef.current = lum
            baseRGBARef.current = rgba
            jitterRef.current = new Int8Array(n)
            revealDelaysRef.current = delays
            baseReadyRef.current = true
            setBaseVersion((v) => v + 1)
        }
        img.onerror = () => {
            baseReadyRef.current = false
        }
        img.src = media

        return () => {
            cancelled = true
        }
    }, [grid.columns, grid.rows, isImageMode, media])

    // ----- IMAGE: animation driver (entirely ref-driven, no setState per frame) -----
    React.useEffect(() => {
        if (!isImageMode) return
        const cancel = () => {
            if (imageRafRef.current !== null) {
                cancelAnimationFrame(imageRafRef.current)
                imageRafRef.current = null
            }
        }

        if (
            isStaticRenderer ||
            prefersReducedMotion ||
            imageAnimation === "off"
        ) {
            revealActiveRef.current = false
            if (jitterRef.current) jitterRef.current.fill(0)
            drawAsciiFrameRef.current()
            return cancel
        }
        if (typeof window === "undefined") return cancel

        if (imageAnimation === "reveal") {
            revealActiveRef.current = true
            revealStartRef.current =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
            if (jitterRef.current) jitterRef.current.fill(0)
            const loop = () => {
                drawAsciiFrameRef.current()
                const now =
                    typeof performance !== "undefined"
                        ? performance.now()
                        : Date.now()
                if (now - revealStartRef.current >= REVEAL_TOTAL_MS) {
                    revealActiveRef.current = false
                    drawAsciiFrameRef.current()
                    imageRafRef.current = null
                    return
                }
                imageRafRef.current = requestAnimationFrame(loop)
            }
            imageRafRef.current = requestAnimationFrame(loop)
            return cancel
        }

        // Shimmer — throttle to ~animationSpeed fps.
        revealActiveRef.current = false
        const interval = 1000 / Math.max(1, animationSpeed)
        let last = 0
        const loop = (timestamp: number) => {
            if (!last) last = timestamp
            if (timestamp - last >= interval) {
                last = timestamp
                updateShimmerJitterRef.current()
                drawAsciiFrameRef.current()
            }
            imageRafRef.current = requestAnimationFrame(loop)
        }
        imageRafRef.current = requestAnimationFrame(loop)
        return cancel
    }, [
        animationSpeed,
        baseVersion,
        imageAnimation,
        isImageMode,
        isStaticRenderer,
        prefersReducedMotion,
    ])

    // ----- VIDEO: wire up the element + play/pause-aware loop -----
    React.useEffect(() => {
        if (isImageMode) return
        const videoEl = videoRef.current
        if (!videoEl) return

        taintedRef.current = false
        metadataReadyRef.current = false
        videoEl.loop = loop
        videoEl.muted = true

        const tryPlay = async () => {
            try {
                await videoEl.play()
            } catch (error) {
                // Autoplay may be blocked; the loop only runs once playback starts.
            }
        }

        const onLoadedMetadata = () => {
            metadataReadyRef.current = true
            drawAsciiFrameRef.current()
            if (isStaticRenderer || prefersReducedMotion) {
                videoEl.pause()
                return
            }
            if (shouldPlayVideoRef.current) {
                void tryPlay()
                startLoopRef.current()
            } else {
                videoEl.pause()
            }
        }
        const onLoadedData = () => drawAsciiFrameRef.current()
        const onPlay = () => {
            if (prefersReducedMotion || !shouldPlayVideoRef.current) {
                videoEl.pause()
                return
            }
            startLoopRef.current()
        }
        const onPause = () => stopLoopRef.current()
        const onEnded = () => {
            if (videoEl.loop && shouldPlayVideoRef.current) {
                startLoopRef.current()
            } else {
                stopLoopRef.current()
            }
        }

        videoEl.addEventListener("loadedmetadata", onLoadedMetadata)
        videoEl.addEventListener("loadeddata", onLoadedData)
        videoEl.addEventListener("play", onPlay)
        videoEl.addEventListener("pause", onPause)
        videoEl.addEventListener("ended", onEnded)

        drawAsciiFrameRef.current()
        if (
            !isStaticRenderer &&
            !prefersReducedMotion &&
            shouldPlayVideoRef.current
        ) {
            void tryPlay()
            startLoopRef.current()
        }
        if (prefersReducedMotion) videoEl.pause()

        return () => {
            videoEl.removeEventListener("loadedmetadata", onLoadedMetadata)
            videoEl.removeEventListener("loadeddata", onLoadedData)
            videoEl.removeEventListener("play", onPlay)
            videoEl.removeEventListener("pause", onPause)
            videoEl.removeEventListener("ended", onEnded)
        }
    }, [isImageMode, isStaticRenderer, loop, media, prefersReducedMotion])

    // ----- VIDEO: react to playback-gate changes (in view / hover / always) -----
    React.useEffect(() => {
        if (isImageMode) return
        shouldPlayVideoRef.current = shouldPlayVideo
        const videoEl = videoRef.current
        if (!videoEl) return

        if (!shouldPlayVideo || !metadataReadyRef.current) {
            videoEl.pause()
            stopLoopRef.current()
            drawAsciiFrameRef.current()
            return
        }
        void videoEl.play().catch(() => {})
        startLoopRef.current()
    }, [isImageMode, shouldPlayVideo])

    // Repaint once on any setting / colour / size change (covers static, Off, and paused).
    React.useEffect(() => {
        const videoLoopRunning =
            !isImageMode &&
            shouldPlayVideoRef.current &&
            metadataReadyRef.current
        if (!videoLoopRunning) drawAsciiFrameRef.current()
    }, [
        backgroundRelativeLuminance,
        baseVersion,
        colorMode,
        contrast,
        darkCutoff,
        fontFamily,
        fontStyle,
        fontWeight,
        invert,
        isImageMode,
        minOpacity,
        resolvedGlyphColor,
        resolvedInputBackgroundColor,
        safeCharacters,
        size.height,
        size.width,
    ])

    // Cleanup.
    React.useEffect(() => {
        return () => {
            stopLoop()
            if (imageRafRef.current !== null) {
                cancelAnimationFrame(imageRafRef.current)
                imageRafRef.current = null
            }
            const videoEl = videoRef.current
            if (videoEl) videoEl.pause()
        }
    }, [stopLoop])

    return (
        <div
            ref={rootRef}
            onPointerEnter={() => {
                if (playback !== "hover" || isHoverWithTouchFallback) return
                setHoverIntent(true)
            }}
            onPointerLeave={() => {
                if (playback !== "hover" || isHoverWithTouchFallback) return
                setHoverIntent(false)
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...style,
            }}
        >
            {!isImageMode && (
                <video
                    ref={videoRef}
                    src={media}
                    crossOrigin="anonymous"
                    playsInline
                    muted
                    loop={loop}
                    preload="auto"
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        // Kept rendered (not display:none) so frames stay drawable in
                        // Safari, but invisible so it never shows through the canvas.
                        opacity: 0,
                        pointerEvents: "none",
                    }}
                />
            )}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
                role="img"
                aria-label="ASCII rendering"
            />
        </div>
    )
}

GlyphStream.displayName = "GlyphStream"

addPropertyControls(GlyphStream, {
    media: {
        type: ControlType.File,
        title: "Media",
        allowedFileTypes: [
            "mp4",
            "webm",
            "mov",
            "png",
            "jpg",
            "jpeg",
            "gif",
            "webp",
            "avif",
        ],
        description:
            "Video or image. External URLs must allow cross-origin access or the output stays blank.",
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        min: 4,
        max: 20,
        step: 1,
        defaultValue: 8,
        unit: "px",
        description: "Smaller is more detailed and heavier to render.",
    },
    characters: {
        type: ControlType.String,
        title: "Characters",
        defaultValue: "@%#*+=-:. ",
        description: "Dark to light. The order is the brightness ramp.",
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Color",
        displaySegmentedControl: true,
        options: ["monochrome", "sampled"],
        optionTitles: ["Mono", "Sampled"],
        defaultValue: "monochrome",
    },
    glyphColor: {
        type: ControlType.Color,
        title: "Glyph",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.colorMode === "sampled",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0A",
    },
    invert: {
        type: ControlType.Boolean,
        title: "Invert",
        defaultValue: false,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: 1,
    },
    darkCutoff: {
        type: ControlType.Number,
        title: "Dark Cutoff",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.12,
        hidden: (props) => props.colorMode === "sampled",
        description: "Drops the darkest glyphs so the background stays clean.",
    },
    minOpacity: {
        type: ControlType.Number,
        title: "Min Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.15,
        hidden: (props) => props.colorMode === "sampled",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 12,
            lineHeight: "1em",
            letterSpacing: "0em",
        },
        description: "Family and weight only. Size is auto-fit to the grid.",
    },
    playback: {
        type: ControlType.Enum,
        title: "Playback",
        options: ["inView", "hover", "always"],
        optionTitles: ["In View", "Hover", "Always"],
        defaultValue: "inView",
        hidden: (props) => isImageUrl(props.media),
        description:
            "In View and Hover pause off-screen to save battery. Always never pauses.",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        hidden: (props) => isImageUrl(props.media),
    },
    frameRate: {
        type: ControlType.Number,
        title: "Frame Rate",
        min: 1,
        max: 60,
        step: 1,
        defaultValue: 24,
        unit: "fps",
        hidden: (props) => isImageUrl(props.media),
    },
    imageAnimation: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["shimmer", "reveal", "off"],
        optionTitles: ["Shimmer", "Reveal", "Off"],
        defaultValue: "shimmer",
        hidden: (props) => !isImageUrl(props.media),
    },
    animationIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.25,
        hidden: (props) =>
            !isImageUrl(props.media) || props.imageAnimation !== "shimmer",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 1,
        max: 30,
        step: 1,
        unit: "fps",
        defaultValue: 10,
        hidden: (props) =>
            !isImageUrl(props.media) || props.imageAnimation !== "shimmer",
    },
})
