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


type Props = {
    text: string
    fontFamily: string
    fontWeight: number
    textColor: string
    backgroundColor: string
    gridColor: string
    dotSize: number
    gap: number
    padding: number
    textScale: number
    lineHeight: number
    align: "left" | "center" | "right"
    animation: "reveal" | "loop" | "none"
    duration: number
    stagger: number
    loopDelay: number
    backgroundReveal: boolean
    backgroundDuration: number
    randomDensity: number
    mobileBreakpoint: number
    mobileDotSize: number
    mobileGap: number
    mobilePadding: number
    mobileTextScale: number
    style?: React.CSSProperties
}

type Mask = {
    cells: Uint8Array
    columns: number
    rows: number
}

const EMPTY_MASK: Mask = { cells: new Uint8Array(), columns: 0, rows: 0 }

function makeTextMask(
    text: string,
    width: number,
    height: number,
    step: number,
    padding: number,
    fontFamily: string,
    fontWeight: number,
    textScale: number,
    lineHeight: number,
    align: Props["align"]
): Mask {
    if (width <= 0 || height <= 0 || !text.trim()) return EMPTY_MASK

    const dpr = 2
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.floor(width * dpr))
    canvas.height = Math.max(1, Math.floor(height * dpr))
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return EMPTY_MASK

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "#fff"
    ctx.textBaseline = "top"
    ctx.textAlign = align

    const lines = text.split("\n")
    const availableWidth = Math.max(1, width - padding * 2)
    const availableHeight = Math.max(1, height - padding * 2)
    let fontSize = Math.max(
        step * 2,
        Math.min(availableHeight / Math.max(1, lines.length), textScale)
    )

    const setFont = () => {
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    }
    setFont()

    const widest = () =>
        Math.max(...lines.map((line) => ctx.measureText(line || " ").width))
    const measured = widest()
    if (measured > availableWidth) {
        fontSize *= availableWidth / measured
        setFont()
    }

    const actualLineHeight = fontSize * lineHeight
    const blockHeight = actualLineHeight * lines.length
    const startY = padding + Math.max(0, (availableHeight - blockHeight) / 2)
    const x =
        align === "left"
            ? padding
            : align === "right"
              ? width - padding
              : width / 2

    lines.forEach((line, index) =>
        ctx.fillText(line, x, startY + index * actualLineHeight)
    )

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const columns = Math.floor((width - padding * 2 + step) / step)
    const rows = Math.floor((height - padding * 2 + step) / step)
    const cells = new Uint8Array(Math.max(0, columns * rows))

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const cx = padding + column * step
            const cy = padding + row * step
            let alpha = 0
            const radius = Math.max(1, Math.floor(step * 0.38))
            for (let sy = -radius; sy <= radius && alpha < 100; sy += 2) {
                for (let sx = -radius; sx <= radius && alpha < 100; sx += 2) {
                    const px = Math.min(
                        canvas.width - 1,
                        Math.max(0, Math.floor((cx + sx) * dpr))
                    )
                    const py = Math.min(
                        canvas.height - 1,
                        Math.max(0, Math.floor((cy + sy) * dpr))
                    )
                    alpha = Math.max(
                        alpha,
                        pixels[(py * canvas.width + px) * 4 + 3]
                    )
                }
            }
            if (alpha > 90) cells[row * columns + column] = 1
        }
    }
    return { cells, columns, rows }
}

export default function DotMatrixText(props: Props) {
    const { style, ...settings } = props
    const hostRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [size, setSize] = React.useState({ width: 800, height: 400 })
    const [isVisible, setIsVisible] = React.useState(true)
    const isStatic = useIsStaticRenderer()

    React.useEffect(() => {
        const host = hostRef.current
        if (!host) return
        const update = () =>
            setSize({ width: host.clientWidth, height: host.clientHeight })
        update()
        const observer = new ResizeObserver(update)
        observer.observe(host)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        const host = hostRef.current
        if (!host || isStatic || typeof IntersectionObserver === "undefined")
            return
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin: "100px", threshold: 0.01 }
        )
        observer.observe(host)
        return () => observer.disconnect()
    }, [isStatic])

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || size.width <= 0 || size.height <= 0) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.floor(size.width * dpr)
        canvas.height = Math.floor(size.height * dpr)
        canvas.style.width = `${size.width}px`
        canvas.style.height = `${size.height}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const isMobileSize = size.width <= settings.mobileBreakpoint
        const dotSize = isMobileSize ? settings.mobileDotSize : settings.dotSize
        const gap = isMobileSize ? settings.mobileGap : settings.gap
        const padding = Math.min(
            isMobileSize ? settings.mobilePadding : settings.padding,
            Math.max(0, Math.min(size.width, size.height) / 3)
        )
        const textScale = isMobileSize
            ? settings.mobileTextScale
            : settings.textScale
        const step = Math.max(2, dotSize + gap)
        const mask = makeTextMask(
            settings.text,
            size.width,
            size.height,
            step,
            padding,
            settings.fontFamily,
            settings.fontWeight,
            textScale,
            settings.lineHeight,
            settings.align
        )

        let frame = 0
        let start = performance.now()
        let cycleStart = start
        let stopped = false

        const draw = (now: number) => {
            if (stopped) return
            const elapsed = now - cycleStart
            const duration = Math.max(100, settings.duration * 1000)
            const stagger = Math.max(0, settings.stagger * 1000)
            const totalReveal = duration + stagger
            let progress =
                settings.animation === "none" || isStatic
                    ? 1
                    : Math.min(1, elapsed / totalReveal)

            if (
                settings.animation === "loop" &&
                elapsed > totalReveal + settings.loopDelay * 1000
            ) {
                cycleStart = now
                progress = 0
            }

            ctx.clearRect(0, 0, size.width, size.height)
            ctx.fillStyle = settings.backgroundColor
            ctx.fillRect(0, 0, size.width, size.height)

            const bgProgress =
                !settings.backgroundReveal || isStatic
                    ? 1
                    : Math.min(
                          1,
                          (now - start) /
                              Math.max(100, settings.backgroundDuration * 1000)
                      )
            const bgHeight = size.height * (1 - Math.pow(1 - bgProgress, 3))
            ctx.fillStyle = settings.gridColor
            const radius = dotSize / 2
            for (let y = padding; y <= bgHeight - padding; y += step) {
                for (let x = padding; x <= size.width - padding; x += step) {
                    ctx.beginPath()
                    ctx.arc(x, y, radius, 0, Math.PI * 2)
                    ctx.fill()
                }
            }

            ctx.fillStyle = settings.textColor
            const revealColumn = progress * (mask.columns + 4)
            for (let row = 0; row < mask.rows; row++) {
                for (let column = 0; column < mask.columns; column++) {
                    const target = mask.cells[row * mask.columns + column] === 1
                    const settled = column <= revealColumn
                    const noise =
                        !settled &&
                        Math.random() < settings.randomDensity * (1 - progress)
                    if (!(settled ? target : noise)) continue
                    const x = padding + column * step
                    const y = padding + row * step
                    ctx.beginPath()
                    ctx.arc(x, y, radius, 0, Math.PI * 2)
                    ctx.fill()
                }
            }

            const revealFinished = progress >= 1 && bgProgress >= 1
            const needsNextFrame =
                !isStatic &&
                isVisible &&
                (settings.animation === "loop" ||
                    (settings.animation === "reveal" && !revealFinished))

            if (needsNextFrame) frame = requestAnimationFrame(draw)
        }
        // Static/export contexts and the non-animated mode are drawn exactly once.
        // Animated modes only run while the component intersects the viewport.
        draw(performance.now())
        return () => {
            stopped = true
            cancelAnimationFrame(frame)
        }
    }, [
        size,
        isStatic,
        isVisible,
        settings.text,
        settings.fontFamily,
        settings.fontWeight,
        settings.textColor,
        settings.backgroundColor,
        settings.gridColor,
        settings.dotSize,
        settings.gap,
        settings.padding,
        settings.textScale,
        settings.mobileBreakpoint,
        settings.mobileDotSize,
        settings.mobileGap,
        settings.mobilePadding,
        settings.mobileTextScale,
        settings.lineHeight,
        settings.align,
        settings.animation,
        settings.duration,
        settings.stagger,
        settings.loopDelay,
        settings.backgroundReveal,
        settings.backgroundDuration,
        settings.randomDensity,
    ])

    return (
        <div
            ref={hostRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    )
}

DotMatrixText.defaultProps = {
    text: "FRAMER",
    fontFamily: "Arial, sans-serif",
    fontWeight: 800,
    textColor: "#FF3B30",
    backgroundColor: "#FFFFFF",
    gridColor: "rgba(0, 0, 0, 0.08)",
    dotSize: 8,
    gap: 5,
    padding: 30,
    textScale: 180,
    lineHeight: 1,
    align: "center",
    animation: "reveal",
    duration: 1,
    stagger: 0.8,
    loopDelay: 2,
    backgroundReveal: true,
    backgroundDuration: 1.3,
    randomDensity: 0.18,
    mobileBreakpoint: 600,
    mobileDotSize: 4,
    mobileGap: 3,
    mobilePadding: 16,
    mobileTextScale: 96,
}

addPropertyControls(DotMatrixText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "FRAMER",
        displayTextArea: true,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Arial, sans-serif",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: 800,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FF3B30",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    gridColor: {
        type: ControlType.Color,
        title: "Grid",
        defaultValue: "rgba(0, 0, 0, 0.08)",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 2,
        max: 30,
        step: 1,
        defaultValue: 8,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 5,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 30,
    },
    textScale: {
        type: ControlType.Number,
        title: "Text Size",
        min: 20,
        max: 600,
        step: 1,
        defaultValue: 180,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 0.7,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "center",
    },
    animation: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["reveal", "loop", "none"],
        optionTitles: ["Reveal", "Loop", "None"],
        displaySegmentedControl: true,
        defaultValue: "reveal",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 1,
        unit: "s",
        hidden: (p) => p.animation === "none",
    },
    stagger: {
        type: ControlType.Number,
        title: "Sweep",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 0.8,
        unit: "s",
        hidden: (p) => p.animation === "none",
    },
    loopDelay: {
        type: ControlType.Number,
        title: "Loop Delay",
        min: 0,
        max: 20,
        step: 0.1,
        defaultValue: 2,
        unit: "s",
        hidden: (p) => p.animation !== "loop",
    },
    randomDensity: {
        type: ControlType.Number,
        title: "Glitch",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.18,
        hidden: (p) => p.animation === "none",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile At",
        min: 240,
        max: 1000,
        step: 10,
        defaultValue: 600,
        unit: "px",
    },
    mobileDotSize: {
        type: ControlType.Number,
        title: "M Dot Size",
        min: 1,
        max: 15,
        step: 0.5,
        defaultValue: 4,
    },
    mobileGap: {
        type: ControlType.Number,
        title: "M Gap",
        min: 1,
        max: 15,
        step: 0.5,
        defaultValue: 3,
    },
    mobilePadding: {
        type: ControlType.Number,
        title: "M Padding",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 16,
    },
    mobileTextScale: {
        type: ControlType.Number,
        title: "M Text Size",
        min: 16,
        max: 300,
        step: 1,
        defaultValue: 96,
    },
    backgroundReveal: {
        type: ControlType.Boolean,
        title: "BG Reveal",
        defaultValue: true,
    },
    backgroundDuration: {
        type: ControlType.Number,
        title: "BG Duration",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 1.3,
        unit: "s",
        hidden: (p) => !p.backgroundReveal,
    },
})
