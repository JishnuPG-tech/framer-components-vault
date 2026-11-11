// Interactive dot grid background - CRISP GRID PERFORMANCE & BUGFIXED SVG PARSER
import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface DotBackgroundProps {
    gridSettings: {
        gridShape: "dot" | "plus" | "minus" | "star" | "custom"
        customSvgCode: string
        dotColor: string
        dotSize: number
        dotSpacing: number
        showGridLines: boolean
        gridLineOpacity: number
    }
    hoverSettings: {
        hoverColor: string
        fadeRadius: number
        followCursor: boolean
        followSpeed: number
    }
    morphSettings: {
        enableMorph: boolean
        morphType: "zoomIn" | "zoomOut"
        morphStrength: number
    }
    edgeFadeSettings: {
        enableEdgeFade: boolean
        edgeFadeSize: number
        edgeFadeStrength: number
        hoverIgnoresEdgeFade: boolean
    }
    style?: CSSProperties
}

/**
 * Interactive Dot Background
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DotBackground(props: DotBackgroundProps) {
    const {
        gridSettings = {
            gridShape: "dot" as const,
            customSvgCode:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>',
            dotColor: "#CCCCCC",
            dotSize: 2,
            dotSpacing: 30,
            showGridLines: false,
            gridLineOpacity: 0.3,
        },
        hoverSettings = {
            hoverColor: "#000000",
            fadeRadius: 100,
            followCursor: true,
            followSpeed: 0.05,
        },
        morphSettings = {
            enableMorph: false,
            morphType: "zoomIn" as const,
            morphStrength: 1.5,
        },
        edgeFadeSettings = {
            enableEdgeFade: true,
            edgeFadeSize: 40,
            edgeFadeStrength: 1,
            hoverIgnoresEdgeFade: false,
        },
    } = props

    const {
        gridShape,
        customSvgCode,
        dotColor,
        dotSize,
        dotSpacing,
        showGridLines,
        gridLineOpacity,
    } = gridSettings
    const { hoverColor, fadeRadius, followCursor, followSpeed } = hoverSettings
    const { enableMorph, morphType, morphStrength } = morphSettings
    const {
        enableEdgeFade,
        edgeFadeSize,
        edgeFadeStrength,
        hoverIgnoresEdgeFade,
    } = edgeFadeSettings

    const isStaticRenderer = useIsStaticRenderer()

    const sizeNum = Number(dotSize)
    const spacingNum = Number(dotSpacing)
    const radiusNum = Number(fadeRadius)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mousePos = useRef({ x: -1000, y: -1000 })
    const targetPos = useRef({ x: -1000, y: -1000 })
    const canvasSize = useRef({ width: 0, height: 0 })
    const animationFrameId = useRef<number | undefined>(undefined)
    const isHovering = useRef(true)

    const parsedSvgRef = useRef<{ path: Path2D; size: number } | null>(null)

    useEffect(() => {
        if (gridShape === "custom" && customSvgCode) {
            try {
                let originalSize = 24
                const codeStr = customSvgCode.trim()

                const viewBoxMatch = codeStr.match(
                    /viewBox=["'][\d\.\-\s]+[\d\.\-\s]+([\d\.\-]+)\s+([\d\.\-]+)["']/i
                )
                if (viewBoxMatch) {
                    originalSize = Math.max(
                        parseFloat(viewBoxMatch[1]),
                        parseFloat(viewBoxMatch[2])
                    )
                } else {
                    const widthMatch = codeStr.match(
                        /width=["']([\d\.\-]+)["']/i
                    )
                    const heightMatch = codeStr.match(
                        /height=["']([\d\.\-]+)["']/i
                    )
                    if (widthMatch && heightMatch) {
                        originalSize = Math.max(
                            parseFloat(widthMatch[1]),
                            parseFloat(heightMatch[1])
                        )
                    }
                }

                let combinedPath = ""

                if (
                    /^[a-zA-Z][\d\.\-\s,]+/.test(codeStr) &&
                    !codeStr.includes("<svg")
                ) {
                    combinedPath = codeStr
                } else {
                    const pathRegex = /d=["']([^"']+)["']/g
                    let match
                    const paths = []
                    while ((match = pathRegex.exec(codeStr)) !== null) {
                        paths.push(match[1])
                    }
                    combinedPath = paths.join(" ")
                }

                if (combinedPath) {
                    parsedSvgRef.current = {
                        path: new Path2D(combinedPath),
                        size: originalSize || 24,
                    }
                } else {
                    parsedSvgRef.current = null
                }
            } catch (error) {
                console.error("SVG Extraction Error:", error)
                parsedSvgRef.current = null
            }
        } else {
            parsedSvgRef.current = null
        }
    }, [customSvgCode, gridShape])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { alpha: false })
        if (!ctx) return

        const offscreenCanvas = document.createElement("canvas")
        const oCtx = offscreenCanvas.getContext("2d", { alpha: true })

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect()
            const width = rect.width
            const height = rect.height
            canvasSize.current = { width, height }

            const dpr = window.devicePixelRatio || 1

            canvas.width = width * dpr
            canvas.height = height * dpr
            ctx.resetTransform()
            ctx.scale(dpr, dpr)

            offscreenCanvas.width = width * dpr
            offscreenCanvas.height = height * dpr
            if (oCtx) {
                oCtx.resetTransform()
                oCtx.scale(dpr, dpr)
            }

            drawStaticBackground()
        }

        const drawStaticBackground = () => {
            if (!oCtx || !ctx) return
            const { width, height } = canvasSize.current

            oCtx.clearRect(0, 0, width, height)

            const cols = Math.ceil(width / spacingNum)
            const rows = Math.ceil(height / spacingNum)
            const offsetX = (width % spacingNum) / 2
            const offsetY = (height % spacingNum) / 2

            if (showGridLines) {
                oCtx.beginPath()
                oCtx.strokeStyle = dotColor
                oCtx.lineWidth = 1
                oCtx.globalAlpha = gridLineOpacity

                for (let i = -1; i <= cols + 1; i++) {
                    const crispX = Math.floor(offsetX + i * spacingNum) + 0.5
                    oCtx.moveTo(crispX, 0)
                    oCtx.lineTo(crispX, height)
                }

                for (let j = -1; j <= rows + 1; j++) {
                    const crispY = Math.floor(offsetY + j * spacingNum) + 0.5
                    oCtx.moveTo(0, crispY)
                    oCtx.lineTo(width, crispY)
                }
                oCtx.stroke()
                oCtx.globalAlpha = 1
            }

            oCtx.fillStyle = dotColor
            oCtx.strokeStyle = dotColor

            for (let i = -1; i <= cols + 1; i++) {
                for (let j = -1; j <= rows + 1; j++) {
                    const x = offsetX + i * spacingNum
                    const y = offsetY + j * spacingNum

                    let opacity = 1
                    if (enableEdgeFade) {
                        const minDistanceFromEdge = Math.min(
                            x,
                            width - x,
                            y,
                            height - y
                        )
                        if (minDistanceFromEdge < edgeFadeSize) {
                            const fadeRatio = minDistanceFromEdge / edgeFadeSize
                            opacity = Math.pow(fadeRatio, edgeFadeStrength)
                        }
                    }

                    oCtx.lineWidth = Math.max(1, sizeNum * 0.3)
                    oCtx.globalAlpha = opacity

                    drawShape(
                        oCtx,
                        x,
                        y,
                        sizeNum,
                        gridShape,
                        parsedSvgRef.current
                    )
                    oCtx.globalAlpha = 1
                }
            }

            ctx.clearRect(0, 0, width, height)
            ctx.drawImage(offscreenCanvas, 0, 0, width, height)
        }

        updateCanvasSize()

        const resizeObserver = new ResizeObserver(() => updateCanvasSize())
        resizeObserver.observe(canvas)

        if (isStaticRenderer) {
            return () => {
                resizeObserver.disconnect()
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()

            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom

            if (isInside) {
                targetPos.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                }
                isHovering.current = true
                if (!followCursor) mousePos.current = { ...targetPos.current }
            } else {
                isHovering.current = false
            }
        }

        const drawLoop = () => {
            if (!ctx || !canvas) return

            const { width, height } = canvasSize.current

            if (followCursor) {
                mousePos.current.x +=
                    (targetPos.current.x - mousePos.current.x) * followSpeed
                mousePos.current.y +=
                    (targetPos.current.y - mousePos.current.y) * followSpeed
            }

            ctx.fillStyle = "transparent"
            ctx.clearRect(0, 0, width, height)
            ctx.drawImage(offscreenCanvas, 0, 0, width, height)

            const maxMorphSpread =
                enableMorph && morphType === "zoomIn"
                    ? sizeNum * morphStrength
                    : sizeNum

            const maxShapeRadius = maxMorphSpread * 2.5
            const boxPadding = radiusNum + maxShapeRadius

            const safeBoxX = Math.floor(mousePos.current.x - boxPadding)
            const safeBoxY = Math.floor(mousePos.current.y - boxPadding)
            const safeBoxSize = Math.ceil(boxPadding * 2)

            ctx.clearRect(safeBoxX, safeBoxY, safeBoxSize, safeBoxSize)

            ctx.save()
            ctx.beginPath()
            ctx.rect(safeBoxX, safeBoxY, safeBoxSize, safeBoxSize)
            ctx.clip()

            const offsetX = (width % spacingNum) / 2
            const offsetY = (height % spacingNum) / 2

            const colMargin = Math.ceil(maxShapeRadius / spacingNum) + 1
            const startCol =
                Math.floor((safeBoxX - offsetX) / spacingNum) - colMargin
            const endCol =
                Math.ceil((safeBoxX + safeBoxSize - offsetX) / spacingNum) +
                colMargin
            const startRow =
                Math.floor((safeBoxY - offsetY) / spacingNum) - colMargin
            const endRow =
                Math.ceil((safeBoxY + safeBoxSize - offsetY) / spacingNum) +
                colMargin

            if (showGridLines) {
                ctx.beginPath()
                ctx.strokeStyle = dotColor
                ctx.lineWidth = 1
                ctx.globalAlpha = gridLineOpacity

                for (let i = startCol; i <= endCol; i++) {
                    const crispX = Math.floor(offsetX + i * spacingNum) + 0.5
                    if (
                        crispX >= safeBoxX &&
                        crispX <= safeBoxX + safeBoxSize
                    ) {
                        ctx.moveTo(crispX, safeBoxY)
                        ctx.lineTo(crispX, safeBoxY + safeBoxSize)
                    }
                }

                for (let j = startRow; j <= endRow; j++) {
                    const crispY = Math.floor(offsetY + j * spacingNum) + 0.5
                    if (
                        crispY >= safeBoxY &&
                        crispY <= safeBoxY + safeBoxSize
                    ) {
                        ctx.moveTo(safeBoxX, crispY)
                        ctx.lineTo(safeBoxX + safeBoxSize, crispY)
                    }
                }
                ctx.stroke()
                ctx.globalAlpha = 1
            }

            for (let i = startCol; i <= endCol; i++) {
                for (let j = startRow; j <= endRow; j++) {
                    const x = offsetX + i * spacingNum
                    const y = offsetY + j * spacingNum

                    if (
                        x < -spacingNum * 2 ||
                        x > width + spacingNum * 2 ||
                        y < -spacingNum * 2 ||
                        y > height + spacingNum * 2
                    ) {
                        continue
                    }

                    const dx = x - mousePos.current.x
                    const dy = y - mousePos.current.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    let color = dotColor
                    const isInHoverRange = distance < radiusNum

                    if (isInHoverRange) {
                        const ratio = 1 - distance / radiusNum
                        color = blendColors(dotColor, hoverColor, ratio)
                    }

                    let morphedSize = sizeNum
                    if (enableMorph && isInHoverRange) {
                        const morphRatio = 1 - distance / radiusNum
                        if (morphType === "zoomIn") {
                            morphedSize =
                                sizeNum * (1 + (morphStrength - 1) * morphRatio)
                        } else {
                            morphedSize =
                                sizeNum *
                                (1 - (1 - 1 / morphStrength) * morphRatio)
                        }
                    }

                    let opacity = 1
                    if (enableEdgeFade) {
                        if (hoverIgnoresEdgeFade && isInHoverRange) {
                            opacity = 1
                        } else {
                            const minDistanceFromEdge = Math.min(
                                x,
                                width - x,
                                y,
                                height - y
                            )
                            if (minDistanceFromEdge < edgeFadeSize) {
                                const fadeRatio =
                                    minDistanceFromEdge / edgeFadeSize
                                opacity = Math.pow(fadeRatio, edgeFadeStrength)
                            }
                        }
                    }

                    ctx.fillStyle = color
                    ctx.strokeStyle = color
                    ctx.lineWidth = Math.max(1, morphedSize * 0.3)
                    ctx.globalAlpha = opacity

                    drawShape(
                        ctx,
                        x,
                        y,
                        morphedSize,
                        gridShape,
                        parsedSvgRef.current
                    )
                    ctx.globalAlpha = 1
                }
            }

            ctx.restore()
            animationFrameId.current = requestAnimationFrame(drawLoop)
        }

        window.addEventListener("mousemove", handleMouseMove)

        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (!animationFrameId.current) {
                        drawLoop()
                    }
                } else {
                    if (animationFrameId.current) {
                        cancelAnimationFrame(animationFrameId.current)
                        // BEHEBUNG: ID zurücksetzen, damit der Loop beim Scrollen neu starten kann
                        animationFrameId.current = undefined
                    }
                }
            },
            { threshold: 0 }
        )

        visibilityObserver.observe(canvas)

        return () => {
            resizeObserver.disconnect()
            visibilityObserver.disconnect()
            window.removeEventListener("mousemove", handleMouseMove)
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current)
                // BEHEBUNG: Auch beim Unmounten zwingend zurücksetzen
                animationFrameId.current = undefined
            }
        }
    }, [
        dotColor,
        hoverColor,
        sizeNum,
        spacingNum,
        radiusNum,
        followCursor,
        followSpeed,
        gridShape,
        customSvgCode,
        showGridLines,
        gridLineOpacity,
        enableMorph,
        morphType,
        morphStrength,
        enableEdgeFade,
        edgeFadeSize,
        edgeFadeStrength,
        hoverIgnoresEdgeFade,
        isStaticRenderer,
    ])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                cursor: "default",
            }}
        />
    )
}

DotBackground.displayName = "Grid BG Hover"

function drawShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    shape: "dot" | "plus" | "minus" | "star" | "custom",
    parsedSvg: { path: Path2D; size: number } | null
) {
    switch (shape) {
        case "dot":
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
            break
        case "plus":
            ctx.beginPath()
            const plusSize = size * 2
            ctx.moveTo(x, y - plusSize)
            ctx.lineTo(x, y + plusSize)
            ctx.moveTo(x - plusSize, y)
            ctx.lineTo(x + plusSize, y)
            ctx.stroke()
            break
        case "minus":
            ctx.beginPath()
            const minusSize = size * 2
            ctx.moveTo(x - minusSize, y)
            ctx.lineTo(x + minusSize, y)
            ctx.stroke()
            break
        case "star":
            ctx.beginPath()
            const starSize = size * 1.5
            const spikes = 4
            const outerRadius = starSize
            const innerRadius = starSize * 0.4

            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius
                const angle = (i * Math.PI) / spikes - Math.PI / 2
                const px = x + Math.cos(angle) * radius
                const py = y + Math.sin(angle) * radius

                if (i === 0) {
                    ctx.moveTo(px, py)
                } else {
                    ctx.lineTo(px, py)
                }
            }
            ctx.closePath()
            ctx.fill()
            break
        case "custom":
            if (parsedSvg && parsedSvg.path) {
                const targetSize = size * 2
                const scale = targetSize / parsedSvg.size

                ctx.save()
                ctx.translate(x, y)
                ctx.scale(scale, scale)
                ctx.translate(-parsedSvg.size / 2, -parsedSvg.size / 2)
                ctx.fill(parsedSvg.path)
                ctx.restore()
            } else {
                ctx.beginPath()
                ctx.arc(x, y, size, 0, Math.PI * 2)
                ctx.fill()
            }
            break
    }
}

function blendColors(color1: string, color2: string, ratio: number): string {
    const c1 = hexToRgb(color1)
    const c2 = hexToRgb(color2)

    if (!c1 || !c2) return color1

    const r = Math.round(c1.r + (c2.r - c1.r) * ratio)
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio)
    const b = Math.round(c1.b + (c2.b - c1.b) * ratio)

    return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (hex.startsWith("rgb")) {
        const match = hex.match(/\d+/g)
        if (match && match.length >= 3) {
            return {
                r: parseInt(match[0]),
                g: parseInt(match[1]),
                b: parseInt(match[2]),
            }
        }
    }

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null
}

addPropertyControls(DotBackground, {
    gridSettings: {
        type: ControlType.Object,
        title: "Grid Settings",
        controls: {
            gridShape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["dot", "plus", "minus", "star", "custom"],
                optionTitles: ["Dot", "Plus", "Minus", "Star", "Custom"],
                defaultValue: "dot",
            },
            customSvgCode: {
                type: ControlType.String,
                title: "SVG Code",
                displayTextArea: true,
                defaultValue:
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>',
                hidden: (values) => values.gridShape !== "custom",
            },
            dotColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#545454",
            },
            dotSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 2,
                min: 1,
                max: 10,
                step: 0.5,
            },
            dotSpacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 30,
                min: 10,
                max: 100,
                step: 5,
            },
            showGridLines: {
                type: ControlType.Boolean,
                title: "Grid Lines",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            gridLineOpacity: {
                type: ControlType.Number,
                title: "Line Opacity",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (values) => !values.showGridLines,
            },
        },
    },
    hoverSettings: {
        type: ControlType.Object,
        title: "Hover Effect",
        controls: {
            hoverColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#ffffff",
            },
            fadeRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 250,
                min: 20,
                max: 500,
                step: 10,
            },
            followCursor: {
                type: ControlType.Boolean,
                title: "Following",
                defaultValue: true,
                enabledTitle: "Follow",
                disabledTitle: "Direct",
            },
            followSpeed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.05,
                min: 0.01,
                max: 1,
                step: 0.01,
                hidden: (values) => !values.followCursor,
            },
        },
    },
    morphSettings: {
        type: ControlType.Object,
        title: "Morph Effect",
        controls: {
            enableMorph: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            morphType: {
                type: ControlType.Enum,
                title: "Type",
                options: ["zoomIn", "zoomOut"],
                optionTitles: ["Zoom In", "Zoom Out"],
                defaultValue: "zoomIn",
                hidden: (values) => !values.enableMorph,
            },
            morphStrength: {
                type: ControlType.Number,
                title: "Strength",
                defaultValue: 2.5,
                min: 1,
                max: 10,
                step: 0.1,
                hidden: (values) => !values.enableMorph,
            },
        },
    },
    edgeFadeSettings: {
        type: ControlType.Object,
        title: "Edge Fade",
        controls: {
            enableEdgeFade: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            edgeFadeSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 40,
                min: 0,
                max: 500,
                step: 5,
                hidden: (values) => !values.enableEdgeFade,
            },
            edgeFadeStrength: {
                type: ControlType.Number,
                title: "Strength",
                defaultValue: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
                hidden: (values) => !values.enableEdgeFade,
            },
            hoverIgnoresEdgeFade: {
                type: ControlType.Boolean,
                title: "Hover Ignore",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (values) => !values.enableEdgeFade,
            },
        },
    },
})

DotBackground.displayName = "Proximity BG Hover"
