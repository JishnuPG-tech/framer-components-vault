import {
    useEffect,
    useState,
    useMemo,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

type RevealMode =
    | "random"
    | "vertical"
    | "horizontal"
    | "diagonal"
    | "antidiagonal"
    | "center"
    | "rain"
    | "spiral"

interface MatrixRevealLoaderProps {
    columns: number
    tileColor: string
    autoPlay: boolean
    timeAdjustment: number
    delay: number
    revealMode: RevealMode
    onComplete?: () => void
    style?: CSSProperties
}

function generateSpiralOrder(rows: number, cols: number): number[] {
    const order: number[] = []
    let top = 0,
        bottom = rows - 1,
        left = 0,
        right = cols - 1
    while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) order.push(top * cols + c)
        top++
        for (let r = top; r <= bottom; r++) order.push(r * cols + right)
        right--
        if (top <= bottom) {
            for (let c = right; c >= left; c--) order.push(bottom * cols + c)
            bottom--
        }
        if (left <= right) {
            for (let r = bottom; r >= top; r--) order.push(r * cols + left)
            left++
        }
    }
    return order
}

function computeTileDelays(
    totalTiles: number,
    revealMode: RevealMode,
    rows: number,
    cols: number,
    totalSecs: number
): Float32Array {
    const delays = new Float32Array(totalTiles)
    const r = () => Math.random()

    switch (revealMode) {
        case "random": {
            for (let i = 0; i < totalTiles; i++) delays[i] = r() * totalSecs
            break
        }
        case "vertical": {
            const step = totalSecs / cols
            for (let i = 0; i < totalTiles; i++) {
                const col = i % cols
                delays[i] = col * step + r() * step * 0.8
            }
            break
        }
        case "horizontal": {
            const step = totalSecs / rows
            for (let i = 0; i < totalTiles; i++) {
                const row = Math.floor(i / cols)
                delays[i] = row * step + r() * step * 0.8
            }
            break
        }
        case "rain": {
            const step = totalSecs / rows
            for (let i = 0; i < totalTiles; i++) {
                const row = Math.floor(i / cols)
                delays[i] = row * step + r() * step * 1.6
            }
            break
        }
        case "diagonal": {
            const numGroups = rows + cols - 1
            const step = totalSecs / numGroups
            for (let i = 0; i < totalTiles; i++) {
                const row = Math.floor(i / cols)
                const col = i % cols
                delays[i] = (row + col) * step + r() * step * 0.8
            }
            break
        }
        case "antidiagonal": {
            const numGroups = rows + cols - 1
            const step = totalSecs / numGroups
            for (let i = 0; i < totalTiles; i++) {
                const row = Math.floor(i / cols)
                const col = i % cols
                delays[i] = (row + (cols - 1 - col)) * step + r() * step * 0.8
            }
            break
        }
        case "center": {
            const cr = Math.floor(rows / 2)
            const cc = Math.floor(cols / 2)
            const maxDist = Math.max(cr, cc, rows - cr - 1, cols - cc - 1)
            const step = totalSecs / (maxDist + 1)
            for (let i = 0; i < totalTiles; i++) {
                const row = Math.floor(i / cols)
                const col = i % cols
                const dist = Math.floor(Math.hypot(row - cr, col - cc))
                delays[i] = dist * step + r() * step * 0.8
            }
            break
        }
        case "spiral": {
            const spiralOrder = generateSpiralOrder(rows, cols)
            const step = totalSecs / spiralOrder.length
            const jitterSpan = step * 8
            spiralOrder.forEach((tileIdx, pos) => {
                delays[tileIdx] = pos * step + r() * jitterSpan
            })
            break
        }
        default: {
            for (let i = 0; i < totalTiles; i++) delays[i] = r() * totalSecs
        }
    }

    return delays
}

export default function MatrixRevealLoader(props: MatrixRevealLoaderProps) {
    const {
        columns = 10,
        tileColor = "#000000",
        autoPlay = true,
        timeAdjustment = 1,
        delay = 0,
        revealMode = "random",
        onComplete,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [isVisible, setIsVisible] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)
    const [loadDuration, setLoadDuration] = useState(1200)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            startTransition(() => setDimensions({ width, height }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        const t0 = performance.now()
        const onLoad = () => {
            const elapsed = performance.now() - t0
            startTransition(() =>
                setLoadDuration(Math.max(1200, Math.min(3000, elapsed)))
            )
        }
        if (document.readyState === "complete") onLoad()
        else window.addEventListener("load", onLoad, { once: true })
    }, [])

    const { rows, tileSize, totalTiles } = useMemo(() => {
        if (dimensions.width === 0 || dimensions.height === 0)
            return { rows: 0, tileSize: 0, totalTiles: 0 }
        const tileSize = dimensions.width / columns
        const rows = Math.ceil(dimensions.height / tileSize)
        return { rows, tileSize, totalTiles: columns * rows }
    }, [dimensions, columns])

    const tileDelays = useMemo(() => {
        if (totalTiles === 0) return new Float32Array(0)
        const totalSecs = (loadDuration * timeAdjustment) / 1000
        return computeTileDelays(
            totalTiles,
            revealMode,
            rows,
            columns,
            totalSecs
        )
    }, [totalTiles, revealMode, rows, columns, loadDuration, timeAdjustment])

    useEffect(() => {
        if (
            !autoPlay ||
            totalTiles === 0 ||
            tileDelays.length === 0 ||
            RenderTarget.current() === RenderTarget.thumbnail
        )
            return

        setIsAnimating(false)
        setIsVisible(true)

        const startTimeout = setTimeout(() => {
            setIsAnimating(true)
        }, delay)

        let maxDelay = 0
        for (let i = 0; i < tileDelays.length; i++) {
            if (tileDelays[i] > maxDelay) maxDelay = tileDelays[i]
        }

        const hideTimeout = setTimeout(
            () => {
                startTransition(() => setIsVisible(false))
                onComplete?.()
            },
            delay + maxDelay * 1000 + 200
        )

        return () => {
            clearTimeout(startTimeout)
            clearTimeout(hideTimeout)
        }
    }, [autoPlay, totalTiles, tileDelays, delay, onComplete])

    if (!isVisible) return null

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: isAnimating ? "none" : "auto",
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, ${tileSize}px)`,
                    gridTemplateRows: `repeat(${rows}, ${tileSize}px)`,
                }}
            >
                {Array.from({ length: totalTiles }, (_, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: isAnimating ? 0 : 1 }}
                        transition={{
                            opacity: {
                                duration: 0.15,
                                delay: isAnimating
                                    ? (tileDelays[index] ?? 0)
                                    : 0,
                                ease: "easeIn",
                            },
                        }}
                        style={{
                            width: tileSize,
                            height: tileSize,
                            backgroundColor: tileColor,
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

addPropertyControls(MatrixRevealLoader, {
    columns: {
        type: ControlType.Number,
        title: "Grid Columns",
        defaultValue: 10,
        min: 5,
        max: 30,
        step: 1,
        displayStepper: true,
    },
    tileColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    revealMode: {
        type: ControlType.Enum,
        title: "Reveal Mode",
        defaultValue: "random",
        options: [
            "random",
            "vertical",
            "horizontal",
            "diagonal",
            "antidiagonal",
            "center",
            "rain",
            "spiral",
        ],
        optionTitles: [
            "Random",
            "Vertical Wipe",
            "Horizontal Wipe",
            "Diagonal",
            "Anti-Diagonal",
            "From Center",
            "Rain",
            "Spiral",
        ],
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    delay: {
        type: ControlType.Number,
        title: "Start Delay",
        defaultValue: 0,
        min: 0,
        max: 5000,
        step: 100,
        unit: "ms",
    },
    timeAdjustment: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.1,
        unit: "×",
    },
})
