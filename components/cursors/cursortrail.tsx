// Mouse grid tail effect with fading squares following the mouse, positioned on an invisible grid. Square size is user-controllable.
import { useRef, useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CursorTrailProps {
    squareSize: number
    fadeDuration: number
    color: string
    maxSquares: number
    shape: "square" | "circle"
    style?: React.CSSProperties
}

/**
 *
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function CursorTrail(props: CursorTrailProps) {
    const { squareSize, fadeDuration, color, maxSquares, shape, style } = props
    const [squares, setSquares] = useState<
        {
            x: number
            y: number
            key: number
            created: number
        }[]
    >([])
    const isStatic = useIsStaticRenderer()
    const keyRef = useRef(0)
    const rafRef = useRef<number>()

    // Mouse move handler
    useEffect(() => {
        if (isStatic) return
        function handle(e: MouseEvent) {
            const rect = (
                e.target as HTMLElement
            )?.getBoundingClientRect?.() || { left: 0, top: 0 }
            // Snap to grid
            const x =
                Math.floor((e.clientX - rect.left) / squareSize) * squareSize
            const y =
                Math.floor((e.clientY - rect.top) / squareSize) * squareSize
            const now = Date.now()
            startTransition(() => {
                setSquares((prev) => {
                    // Avoid duplicate squares at same grid position
                    if (prev.length > 0) {
                        const last = prev[prev.length - 1]
                        if (last.x === x && last.y === y) return prev
                    }
                    const next = [
                        ...prev,
                        { x, y, key: keyRef.current++, created: now },
                    ]
                    // Limit to maxSquares
                    return next.slice(-maxSquares)
                })
            })
        }
        window.addEventListener("mousemove", handle)
        return () => window.removeEventListener("mousemove", handle)
    }, [squareSize, maxSquares, isStatic])

    // Remove old squares
    useEffect(() => {
        if (isStatic) return
        function clean() {
            const now = Date.now()
            startTransition(() => {
                setSquares((prev) =>
                    prev.filter((sq) => now - sq.created < fadeDuration)
                )
            })
            rafRef.current = requestAnimationFrame(clean)
        }
        rafRef.current = requestAnimationFrame(clean)
        return () => rafRef.current && cancelAnimationFrame(rafRef.current)
    }, [fadeDuration, isStatic])

    // Render squares
    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            {squares.map((sq) => {
                const age = Date.now() - sq.created
                const opacity = 1 - Math.min(1, age / fadeDuration)
                return (
                    <div
                        key={sq.key}
                        style={{
                            position: "absolute",
                            left: sq.x,
                            top: sq.y,
                            width: squareSize,
                            height: squareSize,
                            background: color,
                            opacity,
                            borderRadius: shape === "circle" ? "50%" : 0,
                            pointerEvents: "none",
                            transition: "opacity 0.2s linear",
                            willChange: "opacity",
                        }}
                        aria-hidden="true"
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(CursorTrail, {
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        description: "Shape of the trail elements.",
        options: ["square", "circle"],
        optionTitles: ["Square", "Circle"],
        defaultValue: "square",
        displaySegmentedControl: true,
    },
    squareSize: {
        type: ControlType.Number,
        title: "Size",
        description: "Size of the shapes.",
        defaultValue: 32,
        min: 8,
        max: 128,
        step: 1,
        unit: "px",
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade",
        description: "How long squares take to fade out (ms).",
        defaultValue: 700,
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        description: "Color of the squares.",
        defaultValue: "#222",
    },
    maxSquares: {
        type: ControlType.Number,
        title: "Tail",
        description: "Maximum number of squares in the tail.",
        defaultValue: 30,
        min: 5,
        max: 100,
        step: 1,
    },
})
