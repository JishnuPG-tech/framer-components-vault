// ASCII Reveal Animation Component
// Converts images to ASCII art with animated reveal effect
// Features: threshold/dither modes, invert, customizable columns, scramble animation

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"

interface ASCIIRevealProps {
    image: { src: string; alt?: string }
    method: "threshold" | "dither"
    threshold: number
    invert: boolean
    columns: number
    trigger: "auto" | "hover" | "click"
    backgroundColor: string
    textColor: string
    asciiChars: string
    fontSize: number
    cellAppearMs: number
    scrambleCount: number
    scrambleSpeedMs: number
    revealDelayMs: number
    showControls: boolean
    style?: CSSProperties
}

/**
 * ASCII Reveal Animation
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ASCIIReveal(props: ASCIIRevealProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Sample image",
        },
        method = "threshold",
        threshold = 128,
        invert = false,
        columns = 35,
        trigger = "click",
        backgroundColor = "#111111",
        textColor = "#c8c8c8",
        asciiChars = "......:::=+xX#@",
        fontSize = 14,
        cellAppearMs = 2,
        scrambleCount = 10,
        scrambleSpeedMs = 80,
        revealDelayMs = 200,
        showControls = false,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const animTimeoutRef = useRef<number | null>(null)
    const scrambleIntervalRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)

    const [isRevealed, setIsRevealed] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [imgLoaded, setImgLoaded] = useState(false)
    const [hasPlayedOnce, setHasPlayedOnce] = useState(false)

    const isStatic = useIsStaticRenderer()

    const stopAnimation = useCallback(() => {
        if (animTimeoutRef.current !== null) {
            clearTimeout(animTimeoutRef.current)
            animTimeoutRef.current = null
        }
        if (scrambleIntervalRef.current !== null) {
            clearInterval(scrambleIntervalRef.current)
            scrambleIntervalRef.current = null
        }
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    // In some browsers the image can be loaded from cache and onLoad won't fire reliably.
    // Ensure we mark the image as loaded if it's already complete.
    useEffect(() => {
        stopAnimation()
        startTransition(() => {
            setImgLoaded(false)
            setIsRevealed(false)
            setIsPlaying(false)
            setHasPlayedOnce(false)
        })

        if (typeof window === "undefined") return

        const img = imgRef.current
        if (img && img.complete && img.naturalWidth > 0) {
            startTransition(() => setImgLoaded(true))
        }
    }, [image?.src, stopAnimation])

    const ASPECT_WIDTH = 4
    const ASPECT_HEIGHT = 5

    const asciiLayout = useMemo(() => {
        if (typeof document === "undefined") {
            const charWidth = 8
            const charHeight = fontSize
            const ASCII_COLUMNS = columns
            const ASCII_ROWS = Math.round(
                ASCII_COLUMNS *
                    (ASPECT_HEIGHT / ASPECT_WIDTH) *
                    (charWidth / charHeight)
            )
            return {
                charWidth,
                charHeight,
                rows: ASCII_ROWS,
                dispW: ASCII_COLUMNS * charWidth,
                dispH: ASCII_ROWS * charHeight,
            }
        }

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const charHeight = fontSize
        let charWidth = 8
        if (ctx) {
            ctx.font = `${fontSize}px monospace`
            charWidth = Math.ceil(ctx.measureText("M").width)
        }

        const ASCII_COLUMNS = columns
        const ASCII_ROWS = Math.round(
            ASCII_COLUMNS *
                (ASPECT_HEIGHT / ASPECT_WIDTH) *
                (charWidth / charHeight)
        )
        return {
            charWidth,
            charHeight,
            rows: ASCII_ROWS,
            dispW: ASCII_COLUMNS * charWidth,
            dispH: ASCII_ROWS * charHeight,
        }
    }, [columns, fontSize])

    // Calculate character dimensions
    const getCharDimensions = useCallback(() => {
        return { width: asciiLayout.charWidth, height: asciiLayout.charHeight }
    }, [asciiLayout.charWidth, asciiLayout.charHeight])

    const getLuma = useCallback((r: number, g: number, b: number) => {
        return 0.299 * r + 0.587 * g + 0.114 * b
    }, [])

    const toBW = useCallback(
        (
            pixels: Uint8ClampedArray,
            W: number,
            H: number,
            thresh: number,
            inv: boolean
        ) => {
            const out = new Uint8Array(W * H)
            for (let i = 0; i < pixels.length; i += 4) {
                const l = getLuma(pixels[i], pixels[i + 1], pixels[i + 2])
                let v = l >= thresh ? 255 : 0
                if (inv) v = 255 - v
                out[i / 4] = v
            }
            return out
        },
        [getLuma]
    )

    const toDither = useCallback(
        (
            pixels: Uint8ClampedArray,
            W: number,
            H: number,
            thresh: number,
            inv: boolean
        ) => {
            const buf = new Float32Array(W * H)
            for (let i = 0; i < pixels.length; i += 4) {
                buf[i / 4] = getLuma(pixels[i], pixels[i + 1], pixels[i + 2])
            }
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const idx = y * W + x
                    const old = buf[idx]
                    const nw = old < thresh ? 0 : 255
                    buf[idx] = nw
                    const e = old - nw
                    if (x + 1 < W) buf[idx + 1] += (e * 7) / 16
                    if (y + 1 < H) {
                        if (x - 1 >= 0) buf[idx + W - 1] += (e * 3) / 16
                        buf[idx + W] += (e * 5) / 16
                        if (x + 1 < W) buf[idx + W + 1] += (e * 1) / 16
                    }
                }
            }
            const out = new Uint8Array(W * H)
            for (let i = 0; i < buf.length; i++) {
                let v = buf[i] >= 128 ? 255 : 0
                if (inv) v = 255 - v
                out[i] = v
            }
            return out
        },
        [getLuma]
    )

    const shuffleArray = useCallback((array: number[]) => {
        const arr = [...array]
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }, [])

    const drawCharacter = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            col: number,
            row: number,
            char: string,
            cw: number,
            ch: number,
            bgCol: string,
            fgCol: string
        ) => {
            ctx.fillStyle = bgCol
            ctx.fillRect(col * cw, row * ch, cw, ch)
            ctx.fillStyle = fgCol
            ctx.fillText(char, col * cw, row * ch)
        },
        []
    )

    const startEffect = useCallback(() => {
        if (!imgRef.current || !canvasRef.current || !imgLoaded) return

        stopAnimation()
        startTransition(() => {
            setIsRevealed(false)
            setIsPlaying(true)
            setHasPlayedOnce(true)
        })

        const srcImg = imgRef.current
        const cv = canvasRef.current
        const { width: charWidth, height: charHeight } = getCharDimensions()

        const ASCII_COLUMNS = columns
        const ASCII_ROWS = asciiLayout.rows

        const dpr = 2
        const dispW = asciiLayout.dispW
        const dispH = asciiLayout.dispH

        cv.width = dispW * dpr
        cv.height = dispH * dpr
        cv.style.width = "100%"
        cv.style.height = "100%"

        if (wrapperRef.current) {
            wrapperRef.current.style.width = dispW + "px"
            wrapperRef.current.style.height = dispH + "px"
        }

        const BG = invert ? "#f0ece0" : backgroundColor
        const FG = invert ? "#111111" : textColor

        const ctx = cv.getContext("2d")
        if (!ctx) return

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.fillStyle = BG
        ctx.fillRect(0, 0, dispW, dispH)
        ctx.font = `${charHeight}px monospace`
        ctx.textBaseline = "top"

        // Sample image
        const imgAR = srcImg.naturalWidth / srcImg.naturalHeight
        const tgtAR = ASPECT_WIDTH / ASPECT_HEIGHT
        let cx = 0,
            cy = 0,
            cw = srcImg.naturalWidth,
            ch = srcImg.naturalHeight
        if (imgAR > tgtAR) {
            cw = ch * tgtAR
            cx = (srcImg.naturalWidth - cw) / 2
        } else {
            ch = cw / tgtAR
            cy = (srcImg.naturalHeight - ch) / 2
        }

        const sc = document.createElement("canvas")
        sc.width = ASCII_COLUMNS
        sc.height = ASCII_ROWS
        const sctx = sc.getContext("2d")
        if (!sctx) return
        sctx.drawImage(srcImg, cx, cy, cw, ch, 0, 0, ASCII_COLUMNS, ASCII_ROWS)
        const rawPx = sctx.getImageData(0, 0, ASCII_COLUMNS, ASCII_ROWS).data

        // Apply B&W conversion
        const bwPx =
            method === "dither"
                ? toDither(rawPx, ASCII_COLUMNS, ASCII_ROWS, threshold, invert)
                : toBW(rawPx, ASCII_COLUMNS, ASCII_ROWS, threshold, invert)

        // Build ASCII grid
        const LEN = asciiChars.length - 1
        const asciiGrid: string[][] = []
        const brightnessGrid: number[][] = []

        for (let row = 0; row < ASCII_ROWS; row++) {
            const aRow: string[] = []
            const bRow: number[] = []
            for (let col = 0; col < ASCII_COLUMNS; col++) {
                const v = bwPx[row * ASCII_COLUMNS + col]
                const idx = Math.min(
                    LEN,
                    Math.floor((1 - v / 255) * asciiChars.length)
                )
                aRow.push(asciiChars[idx])
                bRow.push(idx)
            }
            asciiGrid.push(aRow)
            brightnessGrid.push(bRow)
        }

        // Animation
        const totalCells = ASCII_COLUMNS * ASCII_ROWS
        const scrambleState = new Array(totalCells).fill(null)
        let settledCount = 0
        let done = false

        const denseCharIndex = asciiChars.lastIndexOf(".")
        const denseChars = asciiChars.slice(denseCharIndex + 1).split("")

        function scheduleReveal() {
            if (done) return
            done = true
            animTimeoutRef.current = window.setTimeout(() => {
                startTransition(() => {
                    setIsRevealed(true)
                    setIsPlaying(false)
                })
            }, revealDelayMs)
        }

        const cellOrder = shuffleArray(
            Array.from({ length: totalCells }, (_, i) => i)
        )

        // Replace per-cell timeouts with RAF loop
        const startTime = performance.now()
        const cellRevealTimes = cellOrder.map((_, i) => i * cellAppearMs)
        const revealedCells = new Set<number>()

        function animateFrame(currentTime: number) {
            if (done) return

            const elapsed = currentTime - startTime

            // Reveal cells whose time has come
            cellOrder.forEach((cellIndex, i) => {
                if (revealedCells.has(cellIndex)) return
                if (elapsed < cellRevealTimes[i]) return

                revealedCells.add(cellIndex)

                const row = Math.floor(cellIndex / ASCII_COLUMNS)
                const col = cellIndex % ASCII_COLUMNS
                const isDark = brightnessGrid[row][col] > denseCharIndex

                if (!isDark) {
                    drawCharacter(
                        ctx,
                        col,
                        row,
                        asciiGrid[row][col],
                        charWidth,
                        charHeight,
                        BG,
                        FG
                    )
                    scrambleState[cellIndex] = 0
                    settledCount++
                    if (settledCount === totalCells) scheduleReveal()
                } else {
                    drawCharacter(
                        ctx,
                        col,
                        row,
                        denseChars[
                            Math.floor(Math.random() * denseChars.length)
                        ],
                        charWidth,
                        charHeight,
                        BG,
                        FG
                    )
                    scrambleState[cellIndex] = scrambleCount
                }
            })

            // Continue animation if not all cells revealed
            if (revealedCells.size < totalCells) {
                rafRef.current = requestAnimationFrame(animateFrame)
            }
        }

        rafRef.current = requestAnimationFrame(animateFrame)

        scrambleIntervalRef.current = window.setInterval(() => {
            if (done) {
                if (scrambleIntervalRef.current !== null) {
                    clearInterval(scrambleIntervalRef.current)
                }
                return
            }
            let stillScrambling = false
            for (let ci = 0; ci < totalCells; ci++) {
                const remaining = scrambleState[ci]
                if (remaining === null || remaining === 0) continue
                stillScrambling = true
                const row = Math.floor(ci / ASCII_COLUMNS)
                const col = ci % ASCII_COLUMNS
                if (remaining === 1) {
                    drawCharacter(
                        ctx,
                        col,
                        row,
                        asciiGrid[row][col],
                        charWidth,
                        charHeight,
                        BG,
                        FG
                    )
                    scrambleState[ci] = 0
                    settledCount++
                    if (settledCount === totalCells) {
                        if (scrambleIntervalRef.current !== null) {
                            clearInterval(scrambleIntervalRef.current)
                        }
                        scheduleReveal()
                        return
                    }
                } else {
                    drawCharacter(
                        ctx,
                        col,
                        row,
                        denseChars[
                            Math.floor(Math.random() * denseChars.length)
                        ],
                        charWidth,
                        charHeight,
                        BG,
                        FG
                    )
                    scrambleState[ci] = remaining - 1
                }
            }
            if (!stillScrambling && settledCount === totalCells) {
                if (scrambleIntervalRef.current !== null) {
                    clearInterval(scrambleIntervalRef.current)
                }
                scheduleReveal()
            }
        }, scrambleSpeedMs)
    }, [
        imgLoaded,
        columns,
        method,
        threshold,
        invert,
        backgroundColor,
        textColor,
        asciiChars,
        fontSize,
        cellAppearMs,
        scrambleCount,
        scrambleSpeedMs,
        revealDelayMs,
        getCharDimensions,
        toBW,
        toDither,
        shuffleArray,
        drawCharacter,
        stopAnimation,
        asciiLayout.rows,
        asciiLayout.dispW,
        asciiLayout.dispH,
    ])

    useEffect(() => {
        return () => stopAnimation()
    }, [stopAnimation])

    useEffect(() => {
        if (imgLoaded && trigger === "auto" && !hasPlayedOnce) {
            startEffect()
        }
    }, [imgLoaded, trigger, startEffect, hasPlayedOnce])

    const handleImageLoad = useCallback(() => {
        startTransition(() => setImgLoaded(true))
    }, [])

    const handleImageError = useCallback(() => {
        startTransition(() => setImgLoaded(false))
    }, [])

    const handleReplay = useCallback(() => {
        startEffect()
    }, [startEffect])

    const handleClick = useCallback(() => {
        if (trigger === "click" && !isPlaying) {
            startEffect()
        }
    }, [trigger, isPlaying, startEffect])

    const handleMouseEnter = useCallback(() => {
        if (trigger === "hover" && !isPlaying) {
            startEffect()
        }
    }, [trigger, isPlaying, startEffect])

    // Render simple fallback in static contexts
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: backgroundColor,
                    padding: 20,
                    overflow: "hidden",
                }}
            >
                <img
                    src={image.src}
                    alt={image.alt || "ASCII Reveal Preview"}
                    style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: 8,
                    }}
                />
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: backgroundColor,
                padding: 20,
                gap: 16,
                overflow: "hidden",
            }}
        >
            <div
                ref={wrapperRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    aspectRatio: `${asciiLayout.dispW} / ${asciiLayout.dispH}`,
                    display: imgLoaded ? "block" : "none",
                    cursor: trigger === "click" ? "pointer" : "default",
                }}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        borderRadius: 8,
                        opacity: isRevealed ? 0 : 1,
                        transition: "opacity 0.7s ease",
                    }}
                />
                <img
                    key={image.src}
                    ref={imgRef}
                    src={image.src}
                    alt={image.alt || ""}
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: isRevealed ? 1 : 0,
                        transition: "opacity 0.9s ease",
                        borderRadius: 8,
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                />
            </div>

            {showControls && imgLoaded && (
                <button
                    onClick={handleReplay}
                    style={{
                        fontSize: 12,
                        padding: "8px 20px",
                        borderRadius: 6,
                        border: "1px solid #333",
                        background: "#ddd",
                        color: "#111",
                        cursor: "pointer",
                        fontFamily: "inherit",
                    }}
                >
                    ↺ Replay
                </button>
            )}
        </div>
    )
}

addPropertyControls(ASCIIReveal, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description: "Source image used for the ASCII conversion and final reveal.",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        description: "When the animation should start.",
        options: ["auto", "hover", "click"],
        optionTitles: ["Auto", "Hover", "Click"],
        defaultValue: "click",
        displaySegmentedControl: true,
    },
    method: {
        type: ControlType.Enum,
        title: "Method",
        description: "How the image is converted to black & white before ASCII mapping.",
        options: ["threshold", "dither"],
        optionTitles: ["Threshold", "Dither"],
        defaultValue: "threshold",
        displaySegmentedControl: true,
    },
    threshold: {
        type: ControlType.Number,
        title: "Threshold",
        description: "Cutoff value (0–255). Lower = more dark pixels.",
        defaultValue: 128,
        min: 0,
        max: 255,
        step: 1,
    },
    invert: {
        type: ControlType.Boolean,
        title: "Invert",
        description: "Invert the black/white conversion (and swap background/foreground colors).",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        description: "ASCII grid width. Higher values = smaller characters and more detail.",
        defaultValue: 60,
        min: 20,
        max: 80,
        step: 1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Canvas background color (used when Invert is off).",
        defaultValue: "#111111",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "ASCII character color (used when Invert is off).",
        defaultValue: "#c8c8c8",
    },
    asciiChars: {
        type: ControlType.String,
        title: "ASCII Chars",
        description: "Character ramp from light → dark. First chars are used for highlights.",
        defaultValue: "......:::=+xX#@",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        description: "Monospace font size used to render the ASCII characters.",
        defaultValue: 14,
        min: 8,
        max: 24,
        step: 1,
        unit: "px",
    },
    cellAppearMs: {
        type: ControlType.Number,
        title: "Cell Appear",
        description: "Delay between revealing each cell (lower = faster build-up).",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        unit: "ms",
    },
    scrambleCount: {
        type: ControlType.Number,
        title: "Scramble Count",
        description: "How many random characters a dark cell cycles through before settling.",
        defaultValue: 10,
        min: 1,
        max: 20,
        step: 1,
    },
    scrambleSpeedMs: {
        type: ControlType.Number,
        title: "Scramble Speed",
        description: "Interval for updating scrambled cells.",
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 10,
        unit: "ms",
    },
    revealDelayMs: {
        type: ControlType.Number,
        title: "Reveal Delay",
        description: "Wait time after the ASCII settles before crossfading to the original image.",
        defaultValue: 200,
        min: 0,
        max: 2000,
        step: 100,
        unit: "ms",
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Show Controls",
        description: "Show a Replay button under the stage (Preview only).",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
