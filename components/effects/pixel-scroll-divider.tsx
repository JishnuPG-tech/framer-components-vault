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


/**
 * Pixelated Section Divider
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 220
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 */

type Props = {
    topColor: string
    bottomColor: string
    pixelSize: number
    depth: number
    density: number
    direction: "down" | "up"
    reveal: "left" | "right" | "center" | "random"
    duration: number
    stagger: number
    triggerAmount: number
    replay: boolean
    seed: number
    style?: React.CSSProperties
}

function seededRandom(index: number, seed: number) {
    const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453
    return value - Math.floor(value)
}

export default function PixelScrollDivider(props: Props) {
    const {
        topColor = "#090A0D",
        bottomColor = "#7C5CFF",
        pixelSize = 18,
        depth = 9,
        density = 0.72,
        direction = "down",
        reveal = "random",
        duration = 0.55,
        stagger = 0.018,
        triggerAmount = 0.25,
        replay = false,
        seed = 8,
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const inView = useInView(rootRef, {
        amount: triggerAmount,
        once: !replay,
    })

    const [width, setWidth] = React.useState(1200)

    React.useLayoutEffect(() => {
        const node = rootRef.current
        if (!node) return

        const update = () => {
            setWidth(Math.max(1, node.getBoundingClientRect().width))
        }

        update()

        const observer = new ResizeObserver(update)
        observer.observe(node)

        return () => observer.disconnect()
    }, [])

    const columns = Math.ceil(width / pixelSize)
    const rows = Math.max(2, depth)
    const active = isStatic || inView

    function getDelay(column: number, row: number, random: number) {
        if (reveal === "right") {
            return (columns - column + row * 0.3) * stagger
        }

        if (reveal === "center") {
            const center = (columns - 1) / 2
            return Math.abs(column - center) * stagger + row * stagger * 0.3
        }

        if (reveal === "random") {
            return random * columns * stagger
        }

        return (column + row * 0.3) * stagger
    }

    const pixels: React.ReactNode[] = []

    for (let column = 0; column < columns; column++) {
        const columnNoise = seededRandom(column, seed)

        const columnDepth = Math.max(
            2,
            Math.round(rows * (0.35 + columnNoise * 0.65))
        )

        for (let row = 0; row < rows; row++) {
            const index = column * rows + row
            const noise = seededRandom(index + 100, seed)

            const insideMainShape = row < columnDepth
            const probability = insideMainShape ? density : density * 0.18

            if (noise > probability) continue

            const delay = getDelay(column, row, noise)

            const edgeDistance = direction === "down" ? row : rows - row - 1

            const opacity = Math.max(0.2, 1 - edgeDistance / (rows + 1))

            pixels.push(
                <div
                    key={`${column}-${row}`}
                    style={{
                        position: "absolute",
                        left: column * pixelSize,
                        top: direction === "down" ? row * pixelSize : undefined,
                        bottom:
                            direction === "up" ? row * pixelSize : undefined,
                        width: pixelSize + 1,
                        height: pixelSize + 1,
                        background: bottomColor,
                        opacity: active ? opacity : 0,
                        transform: active ? "scale(1)" : "scale(0)",
                        transformOrigin:
                            direction === "down" ? "top" : "bottom",
                        transitionProperty: "opacity, transform",
                        transitionDuration: `${duration}s`,
                        transitionDelay: `${delay}s`,
                        transitionTimingFunction: "steps(5, end)",
                        willChange: "opacity, transform",
                    }}
                />
            )
        }
    }

    const solidHeight = `calc(100% - ${rows * pixelSize * 0.72}px)`

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: pixelSize * rows,
                overflow: "hidden",
                background: topColor,
            }}
        >
            {/* Solid destination section */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: solidHeight,
                    background: bottomColor,
                    bottom: direction === "down" ? 0 : undefined,
                    top: direction === "up" ? 0 : undefined,
                }}
            />

            {/* Pixelated transition edge */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: rows * pixelSize,
                    top: direction === "down" ? 0 : undefined,
                    bottom: direction === "up" ? 0 : undefined,
                    overflow: "hidden",
                }}
            >
                {pixels}
            </div>
        </div>
    )
}

PixelScrollDivider.defaultProps = {
    topColor: "#090A0D",
    bottomColor: "#7C5CFF",
    pixelSize: 18,
    depth: 9,
    density: 0.72,
    direction: "down",
    reveal: "random",
    duration: 0.55,
    stagger: 0.018,
    triggerAmount: 0.25,
    replay: false,
    seed: 8,
}

addPropertyControls(PixelScrollDivider, {
    topColor: {
        type: ControlType.Color,
        title: "Top",
        defaultValue: "#090A0D",
    },

    bottomColor: {
        type: ControlType.Color,
        title: "Bottom",
        defaultValue: "#7C5CFF",
    },

    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 18,
        min: 4,
        max: 60,
        step: 1,
        unit: "px",
    },

    depth: {
        type: ControlType.Number,
        title: "Depth",
        defaultValue: 9,
        min: 3,
        max: 20,
        step: 1,
    },

    density: {
        type: ControlType.Number,
        title: "Density",
        defaultValue: 0.72,
        min: 0.1,
        max: 1,
        step: 0.01,
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["down", "up"],
        optionTitles: ["Down", "Up"],
        defaultValue: "down",
    },

    reveal: {
        type: ControlType.Enum,
        title: "Reveal",
        options: ["left", "right", "center", "random"],
        optionTitles: ["Left", "Right", "Center", "Random"],
        defaultValue: "random",
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.55,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },

    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.018,
        min: 0,
        max: 0.1,
        step: 0.002,
        unit: "s",
    },

    triggerAmount: {
        type: ControlType.Number,
        title: "Trigger",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
    },

    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: false,
    },

    seed: {
        type: ControlType.Number,
        title: "Pattern",
        defaultValue: 8,
        min: 1,
        max: 100,
        step: 1,
    },
})
