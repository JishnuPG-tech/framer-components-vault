import { useRef, useEffect, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface PixelBlock {
    x: number
    y: number
    w: number
    h: number
    cx: number
    cy: number
    col: number
    row: number
    seed: number
}

function clamp(value: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value))
}

function hash(x: number, y: number): number {
    const n = Math.sin(x * 127.1 + y * 311.7 + 43.3) * 43758.5453
    return n - Math.floor(n)
}

function drawCoverFull(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    fullW: number,
    fullH: number
) {
    if (!img.naturalWidth || !img.naturalHeight) return

    const imageRatio = img.naturalWidth / img.naturalHeight
    const targetRatio = fullW / fullH

    let sx = 0
    let sy = 0
    let sw = img.naturalWidth
    let sh = img.naturalHeight

    if (imageRatio > targetRatio) {
        sh = img.naturalHeight
        sw = sh * targetRatio
        sx = (img.naturalWidth - sw) / 2
    } else {
        sw = img.naturalWidth
        sh = sw / targetRatio
        sy = (img.naturalHeight - sh) / 2
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, fullW, fullH)
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function PixelImageHover({
    baseImage,
    hoverImage,

    blockSize = 28,
    revealPercent = 25,
    maskShape = "circle",

    stableZone = 0.38,
    softEdge = 50,
    edgeBreakup = 0.35,
    edgeWarp = 0.35,

    noiseScale = 0.9,
    noiseSpeed = 0.6,
    density = 0.55,

    irregularStrength = 0.4,
    irregularSpeed = 0.3,

    fadeOnLeave = true,
    borderRadius = 0,

    renderScale = 0.8,
    fpsLimit = 30,

    style,
    ...rest
}: {
    baseImage?: string
    hoverImage?: string

    blockSize?: number
    revealPercent?: number
    maskShape?: "circle" | "square" | "diamond" | "strip" | "irregular"

    stableZone?: number
    softEdge?: number
    edgeBreakup?: number
    edgeWarp?: number

    noiseScale?: number
    noiseSpeed?: number
    density?: number

    irregularStrength?: number
    irregularSpeed?: number

    fadeOnLeave?: boolean
    borderRadius?: number

    renderScale?: number
    fpsLimit?: number

    style?: React.CSSProperties
    [key: string]: any
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const baseImgRef = useRef<HTMLImageElement | null>(null)
    const hoverImgRef = useRef<HTMLImageElement | null>(null)

    const blocksRef = useRef<PixelBlock[]>([])
    const mousePosRef = useRef({ x: 0, y: 0 })

    const isInsideRef = useRef(false)
    const overallAlphaRef = useRef(0)
    const targetAlphaRef = useRef(0)

    const fadeRafRef = useRef<number | null>(null)
    const animRafRef = useRef<number | null>(null)
    const lastFrameTimeRef = useRef(0)

    const baseOffRef = useRef<HTMLCanvasElement | null>(null)
    const hoverOffRef = useRef<HTMLCanvasElement | null>(null)
    const compCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)

    const getEffectiveDpr = useCallback(() => {
        const nativeDpr =
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

        return Math.max(
            0.5,
            Math.min(1.5, nativeDpr * clamp(renderScale, 0.5, 1))
        )
    }, [renderScale])

    const ensureCanvas = useCallback(
        (
            ref: React.MutableRefObject<HTMLCanvasElement | null>,
            width: number,
            height: number
        ) => {
            let canvas = ref.current

            if (!canvas || canvas.width !== width || canvas.height !== height) {
                canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height
                ref.current = canvas
            }

            return canvas
        },
        []
    )

    const renderOffscreen = useCallback(
        (
            img: HTMLImageElement | null,
            offRef: React.MutableRefObject<HTMLCanvasElement | null>,
            width: number,
            height: number,
            dpr: number
        ) => {
            if (!img || width <= 0 || height <= 0) {
                offRef.current = null
                return
            }

            const pixelWidth = Math.max(1, Math.round(width * dpr))
            const pixelHeight = Math.max(1, Math.round(height * dpr))

            const offscreen = ensureCanvas(offRef, pixelWidth, pixelHeight)

            const ctx = offscreen.getContext("2d", {
                alpha: true,
            })

            if (!ctx) return

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, width, height)
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "medium"

            drawCoverFull(ctx, img, width, height)
        },
        [ensureCanvas]
    )

    const rebuildOffscreens = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const dpr = getEffectiveDpr()
        const width = canvas.width / dpr
        const height = canvas.height / dpr

        renderOffscreen(baseImgRef.current, baseOffRef, width, height, dpr)

        renderOffscreen(hoverImgRef.current, hoverOffRef, width, height, dpr)
    }, [getEffectiveDpr, renderOffscreen])

    const buildBlocks = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const dpr = getEffectiveDpr()
        const width = canvas.width / dpr
        const height = canvas.height / dpr

        if (width <= 0 || height <= 0) return

        const size = Math.max(4, blockSize)
        const cols = Math.ceil(width / size)
        const rows = Math.ceil(height / size)

        const blocks: PixelBlock[] = []

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * size
                const y = row * size

                const w = Math.min(size, width - x)
                const h = Math.min(size, height - y)

                blocks.push({
                    x,
                    y,
                    w,
                    h,
                    cx: x + w / 2,
                    cy: y + h / 2,
                    col,
                    row,
                    seed: hash(col * 1.31, row * 0.87),
                })
            }
        }

        blocksRef.current = blocks
    }, [blockSize, getEffectiveDpr])

    const draw = useCallback(
        (timestamp = performance.now()) => {
            const canvas = canvasRef.current
            if (!canvas) return

            const ctx = canvas.getContext("2d", {
                alpha: true,
            })

            if (!ctx) return

            const dpr = getEffectiveDpr()
            const width = canvas.width / dpr
            const height = canvas.height / dpr

            const pixelWidth = canvas.width
            const pixelHeight = canvas.height

            const baseOffscreen = baseOffRef.current
            const hoverOffscreen = hoverOffRef.current

            const mouseX = mousePosRef.current.x
            const mouseY = mousePosRef.current.y
            const overallAlpha = overallAlphaRef.current
            const time = timestamp / 1000

            const diagonal = Math.hypot(width, height)
            const revealRadius = ((revealPercent / 100) * diagonal) / 2

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, width, height)

            if (baseOffscreen) {
                ctx.drawImage(baseOffscreen, 0, 0, width, height)
            }

            if (!hoverOffscreen || overallAlpha <= 0.001) return

            const baseOuterRadius = revealRadius
            const baseStableRadius =
                baseOuterRadius * clamp(stableZone, 0, 0.95)

            const threshold = 1 - density
            const isStrip = maskShape === "strip"

            const maskCanvas = ensureCanvas(
                maskCanvasRef,
                pixelWidth,
                pixelHeight
            )

            const maskCtx = maskCanvas.getContext("2d", {
                alpha: true,
            })

            if (!maskCtx) return

            maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
            maskCtx.clearRect(0, 0, width, height)
            maskCtx.fillStyle = "#ffffff"

            for (const block of blocksRef.current) {
                /*
                 * Edge Warp：
                 * 每一列產生水平偏移，
                 * 每一欄產生垂直偏移，
                 * 避免同一排像素同時形成水平切線。
                 */
                const rowWarp =
                    Math.sin(
                        block.row * 0.83 +
                            block.col * 0.09 +
                            time * noiseSpeed * 0.42
                    ) *
                    blockSize *
                    edgeWarp

                const colWarp =
                    Math.sin(
                        block.col * 0.71 -
                            block.row * 0.07 -
                            time * noiseSpeed * 0.34
                    ) *
                    blockSize *
                    edgeWarp

                const secondaryWarpX =
                    Math.sin(
                        block.row * 1.73 -
                            block.col * 0.21 +
                            time * noiseSpeed * 0.2
                    ) *
                    blockSize *
                    edgeWarp *
                    0.22

                const secondaryWarpY =
                    Math.sin(
                        block.col * 1.41 +
                            block.row * 0.19 -
                            time * noiseSpeed * 0.17
                    ) *
                    blockSize *
                    edgeWarp *
                    0.22

                const warpedX = block.cx + rowWarp + secondaryWarpX

                const warpedY = block.cy + colWarp + secondaryWarpY

                const dx = warpedX - mouseX
                const dy = warpedY - mouseY

                const animatedSeed =
                    Math.sin(
                        block.col * 1.17 + block.row * 0.73 + time * noiseSpeed
                    ) *
                        0.5 +
                    0.5

                /*
                 * Edge Breakup：
                 * 每個 block 使用不同有效半徑，
                 * 再打散遮罩外圍輪廓。
                 */
                const breakup = (block.seed * 2 - 1) * blockSize * edgeBreakup

                const animatedBreakup =
                    (animatedSeed * 2 - 1) * blockSize * edgeBreakup * 0.35

                let effectiveOuterRadius =
                    baseOuterRadius + breakup + animatedBreakup

                let effectiveStableRadius =
                    baseStableRadius + breakup * 0.45 + animatedBreakup * 0.25

                effectiveOuterRadius = Math.max(blockSize, effectiveOuterRadius)

                effectiveStableRadius = clamp(
                    effectiveStableRadius,
                    0,
                    effectiveOuterRadius - 1
                )

                let distance: number

                if (maskShape === "square") {
                    distance = Math.max(Math.abs(dx), Math.abs(dy))
                } else if (maskShape === "diamond") {
                    distance = (Math.abs(dx) + Math.abs(dy)) / 2
                } else if (isStrip) {
                    distance = Math.abs(dx)
                } else if (maskShape === "irregular") {
                    const rawDistance = Math.hypot(dx, dy)
                    const angle = Math.atan2(dy, dx)
                    const speed = time * irregularSpeed

                    const angularVariation =
                        (Math.sin(angle * 2 + speed * 0.9) * 0.3 +
                            Math.sin(angle * 3.3 - speed * 0.6) * 0.25 +
                            Math.sin(angle * 5.7 + speed * 0.4) * 0.2 +
                            Math.sin(angle * 7.1 - speed * 0.3) * 0.15 +
                            Math.sin(angle * 11.3 + speed * 0.2) * 0.1) *
                        irregularStrength

                    effectiveOuterRadius *= 1 + angularVariation
                    distance = rawDistance
                } else {
                    distance = Math.hypot(dx, dy)
                }

                if (distance > effectiveOuterRadius) continue

                const effectiveInnerRadius = Math.max(
                    effectiveStableRadius,
                    effectiveOuterRadius - softEdge
                )

                const edgeAlpha =
                    distance > effectiveInnerRadius
                        ? 1 -
                          (distance - effectiveInnerRadius) /
                              Math.max(
                                  1,
                                  effectiveOuterRadius - effectiveInnerRadius
                              )
                        : 1

                let blockAlpha = 1

                if (distance > effectiveStableRadius) {
                    const colNoise = block.col * noiseScale
                    const rowNoise = block.row * noiseScale
                    const speed = time * noiseSpeed

                    const patternNoise =
                        (Math.sin(colNoise + speed * 1.3) *
                            Math.sin(rowNoise - speed * 0.9) *
                            0.4 +
                            Math.sin(colNoise * 1.4 - speed * 0.7) *
                                Math.sin(rowNoise * 1.2 + speed * 1.1) *
                                0.35 +
                            Math.sin(
                                (colNoise + rowNoise) * 0.8 + speed * 0.5
                            ) *
                                0.25) *
                            0.5 +
                        0.5

                    const noiseAlpha =
                        patternNoise <= threshold
                            ? 0
                            : clamp(
                                  (patternNoise - threshold) /
                                      Math.max(0.01, 0.3 * (1 - threshold))
                              )

                    const noiseZoneProgress = clamp(
                        (distance - effectiveStableRadius) /
                            Math.max(
                                1,
                                effectiveInnerRadius - effectiveStableRadius
                            )
                    )

                    blockAlpha =
                        1 - noiseZoneProgress + noiseAlpha * noiseZoneProgress
                }

                const finalAlpha = blockAlpha * edgeAlpha * overallAlpha

                if (finalAlpha <= 0.01) continue

                maskCtx.globalAlpha = finalAlpha

                /*
                 * 多畫 1px 避免像素格細縫。
                 */
                maskCtx.fillRect(
                    Math.floor(block.x),
                    Math.floor(block.y),
                    Math.ceil(block.w) + 1,
                    Math.ceil(block.h) + 1
                )
            }

            maskCtx.globalAlpha = 1

            const compositeCanvas = ensureCanvas(
                compCanvasRef,
                pixelWidth,
                pixelHeight
            )

            const compositeCtx = compositeCanvas.getContext("2d", {
                alpha: true,
            })

            if (!compositeCtx) return

            compositeCtx.setTransform(1, 0, 0, 1, 0, 0)
            compositeCtx.clearRect(0, 0, pixelWidth, pixelHeight)

            compositeCtx.drawImage(
                hoverOffscreen,
                0,
                0,
                pixelWidth,
                pixelHeight
            )

            compositeCtx.globalCompositeOperation = "destination-in"

            compositeCtx.drawImage(maskCanvas, 0, 0, pixelWidth, pixelHeight)

            compositeCtx.globalCompositeOperation = "source-over"

            ctx.drawImage(compositeCanvas, 0, 0, width, height)
        },
        [
            getEffectiveDpr,
            ensureCanvas,
            revealPercent,
            blockSize,
            maskShape,
            stableZone,
            softEdge,
            edgeBreakup,
            edgeWarp,
            noiseScale,
            noiseSpeed,
            density,
            irregularStrength,
            irregularSpeed,
        ]
    )

    const stopAnimLoop = useCallback(() => {
        if (animRafRef.current !== null) {
            cancelAnimationFrame(animRafRef.current)
            animRafRef.current = null
        }
    }, [])

    const startAnimLoop = useCallback(() => {
        if (animRafRef.current !== null) return

        const frameInterval = 1000 / Math.max(1, fpsLimit)

        const loop = (timestamp: number) => {
            const elapsed = timestamp - lastFrameTimeRef.current

            if (elapsed >= frameInterval) {
                lastFrameTimeRef.current = timestamp - (elapsed % frameInterval)

                draw(timestamp)
            }

            if (overallAlphaRef.current > 0.001 || isInsideRef.current) {
                animRafRef.current = requestAnimationFrame(loop)
            } else {
                animRafRef.current = null
            }
        }

        animRafRef.current = requestAnimationFrame(loop)
    }, [draw, fpsLimit])

    const fadeTick = useCallback(() => {
        const current = overallAlphaRef.current
        const target = targetAlphaRef.current
        const step = 0.075

        overallAlphaRef.current =
            Math.abs(current - target) <= step
                ? target
                : current + Math.sign(target - current) * step

        if (Math.abs(overallAlphaRef.current - target) > 0.005) {
            fadeRafRef.current = requestAnimationFrame(fadeTick)
        } else {
            fadeRafRef.current = null

            if (!isInsideRef.current && overallAlphaRef.current <= 0) {
                stopAnimLoop()
                draw()
            }
        }
    }, [draw, stopAnimLoop])

    const startFade = useCallback(() => {
        if (fadeRafRef.current !== null) {
            cancelAnimationFrame(fadeRafRef.current)
        }

        fadeRafRef.current = requestAnimationFrame(fadeTick)
    }, [fadeTick])

    const loadImage = useCallback(
        (
            src: string | undefined,
            ref: React.MutableRefObject<HTMLImageElement | null>
        ) => {
            if (!src) {
                ref.current = null
                rebuildOffscreens()
                draw()
                return
            }

            const img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"

            img.onload = () => {
                ref.current = img
                rebuildOffscreens()
                draw()
            }

            img.onerror = () => {
                ref.current = null
            }

            img.src = src
        },
        [draw, rebuildOffscreens]
    )

    useEffect(() => {
        loadImage(baseImage, baseImgRef)
    }, [baseImage, loadImage])

    useEffect(() => {
        loadImage(hoverImage, hoverImgRef)
    }, [hoverImage, loadImage])

    const syncSize = useCallback(() => {
        const container = containerRef.current
        const canvas = canvasRef.current

        if (!container || !canvas) return

        const width = container.clientWidth
        const height = container.clientHeight

        if (width <= 0 || height <= 0) return

        const dpr = getEffectiveDpr()

        const pixelWidth = Math.max(1, Math.round(width * dpr))

        const pixelHeight = Math.max(1, Math.round(height * dpr))

        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth
            canvas.height = pixelHeight
        }

        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        rebuildOffscreens()
        buildBlocks()
        draw()
    }, [getEffectiveDpr, rebuildOffscreens, buildBlocks, draw])

    useEffect(() => {
        syncSize()
    }, [syncSize])

    useEffect(() => {
        const element = containerRef.current
        if (!element) return

        let resizeFrame = 0

        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(resizeFrame)
            resizeFrame = requestAnimationFrame(syncSize)
        })

        observer.observe(element)

        return () => {
            cancelAnimationFrame(resizeFrame)
            observer.disconnect()
        }
    }, [syncSize])

    useEffect(() => {
        return () => {
            if (fadeRafRef.current !== null) {
                cancelAnimationFrame(fadeRafRef.current)
            }

            if (animRafRef.current !== null) {
                cancelAnimationFrame(animRafRef.current)
            }
        }
    }, [])

    const onMouseEnter = useCallback(
        (event: React.MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()

            if (!rect) return

            mousePosRef.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            }

            isInsideRef.current = true
            targetAlphaRef.current = 1

            if (fadeOnLeave) {
                startFade()
            } else {
                overallAlphaRef.current = 1
            }

            startAnimLoop()
        },
        [fadeOnLeave, startFade, startAnimLoop]
    )

    const onMouseMove = useCallback(
        (event: React.MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()

            if (!rect) return

            mousePosRef.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            }

            if (animRafRef.current === null) {
                startAnimLoop()
            }
        },
        [startAnimLoop]
    )

    const onMouseLeave = useCallback(() => {
        isInsideRef.current = false

        if (fadeOnLeave) {
            targetAlphaRef.current = 0
            startFade()
        } else {
            overallAlphaRef.current = 0
            stopAnimLoop()
            draw()
        }
    }, [fadeOnLeave, startFade, stopAnimLoop, draw])

    return (
        <div
            ref={containerRef}
            onMouseEnter={onMouseEnter}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                isolation: "isolate",
                ...style,
            }}
            {...rest}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

addPropertyControls(PixelImageHover, {
    baseImage: {
        type: ControlType.Image,
        title: "Base Image",
    },
    hoverImage: {
        type: ControlType.Image,
        title: "Hover Image",
    },

    blockSize: {
        type: ControlType.Number,
        title: "Block Size",
        defaultValue: 28,
        min: 6,
        max: 100,
        step: 2,
    },
    revealPercent: {
        type: ControlType.Number,
        title: "Reveal Size",
        defaultValue: 25,
        min: 5,
        max: 100,
        step: 1,
        unit: "%",
    },
    maskShape: {
        type: ControlType.Enum,
        title: "Shape",
        defaultValue: "circle",
        options: ["circle", "square", "diamond", "strip", "irregular"],
        optionTitles: ["Circle", "Square", "Diamond", "Strip", "Irregular"],
    },

    irregularStrength: {
        type: ControlType.Number,
        title: "Blob Strength",
        defaultValue: 0.4,
        min: 0.05,
        max: 0.8,
        step: 0.05,
        hidden(props) {
            return props.maskShape !== "irregular"
        },
    },
    irregularSpeed: {
        type: ControlType.Number,
        title: "Blob Speed",
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.05,
        hidden(props) {
            return props.maskShape !== "irregular"
        },
    },

    stableZone: {
        type: ControlType.Number,
        title: "Stable Center",
        defaultValue: 0.38,
        min: 0.05,
        max: 0.8,
        step: 0.05,
    },
    softEdge: {
        type: ControlType.Number,
        title: "Soft Edge",
        defaultValue: 50,
        min: 0,
        max: 200,
        step: 5,
    },
    edgeBreakup: {
        type: ControlType.Number,
        title: "Edge Breakup",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Randomizes each block's reveal boundary",
    },
    edgeWarp: {
        type: ControlType.Number,
        title: "Edge Warp",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Breaks horizontal and vertical edge lines",
    },

    noiseScale: {
        type: ControlType.Number,
        title: "Pattern Scale",
        defaultValue: 0.9,
        min: 0.2,
        max: 3,
        step: 0.1,
    },
    noiseSpeed: {
        type: ControlType.Number,
        title: "Flow Speed",
        defaultValue: 0.6,
        min: 0,
        max: 3,
        step: 0.05,
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        defaultValue: 0.55,
        min: 0.1,
        max: 0.9,
        step: 0.05,
    },

    fadeOnLeave: {
        type: ControlType.Boolean,
        title: "Fade on Leave",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
    },

    renderScale: {
        type: ControlType.Number,
        title: "Render Scale",
        defaultValue: 0.8,
        min: 0.5,
        max: 1,
        step: 0.05,
        description: "Lower values improve performance",
    },
    fpsLimit: {
        type: ControlType.Number,
        title: "FPS Limit",
        defaultValue: 30,
        min: 15,
        max: 60,
        step: 5,
    },
})
