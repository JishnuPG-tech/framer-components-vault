// Grid of interactive dots with wavy, fluid distortion effect on mouse move or scroll
import { useRef, useEffect, useState, useCallback, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface InteractiveGridProps {
    dotColor: string
    background: string
    useGradient: boolean
    gradientFrom: string
    gradientTo: string
    gradientDirection: string
    dotRadius: number
    columns: number
    rows: number
    spacing: number
    waveStrength: number
    waveRadius: number
    style?: React.CSSProperties
}

/**
 * Interactive Dot Grid
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InteractiveGrid(props: InteractiveGridProps) {
    const {
        dotColor,
        background,
        useGradient,
        gradientFrom,
        gradientTo,
        gradientDirection,
        dotRadius,
        columns,
        rows,
        spacing,
        waveStrength,
        waveRadius,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
    const [animatedMouse, setAnimatedMouse] = useState<{ x: number; y: number } | null>(null)
    const [scrollY, setScrollY] = useState(0)

    // Animate mouse position for smooth transitions
    useEffect(() => {
        if (mouse === null && animatedMouse === null) return
        let frame: number
        function animate() {
            if (mouse === null && animatedMouse !== null) {
                // Animate out to null
                const dx = -animatedMouse.x * 0.2
                const dy = -animatedMouse.y * 0.2
                const next = {
                    x: animatedMouse.x + dx,
                    y: animatedMouse.y + dy,
                }
                if (Math.abs(next.x) < 1 && Math.abs(next.y) < 1) {
                    startTransition(() => setAnimatedMouse(null))
                } else {
                    startTransition(() => setAnimatedMouse(next))
                    frame = requestAnimationFrame(animate)
                }
            } else if (mouse && animatedMouse) {
                // Animate towards mouse
                const dx = (mouse.x - animatedMouse.x) * 0.2
                const dy = (mouse.y - animatedMouse.y) * 0.2
                const next = {
                    x: animatedMouse.x + dx,
                    y: animatedMouse.y + dy,
                }
                if (Math.abs(next.x - mouse.x) < 1 && Math.abs(next.y - mouse.y) < 1) {
                    startTransition(() => setAnimatedMouse(mouse))
                } else {
                    startTransition(() => setAnimatedMouse(next))
                    frame = requestAnimationFrame(animate)
                }
            } else if (mouse && !animatedMouse) {
                startTransition(() => setAnimatedMouse(mouse))
            }
        }
        frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [mouse, animatedMouse])

    // Mouse move handler
    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        // Use SVG coordinates for the mouse pointer, accounting for scaling
        const svgWidth = (columns - 1) * spacing + dotRadius * 2
        const svgHeight = (rows - 1) * spacing + dotRadius * 2
        const x = ((e.clientX - rect.left) / rect.width) * svgWidth
        const y = ((e.clientY - rect.top) / rect.height) * svgHeight
        startTransition(() => setMouse({ x, y }))
    }, [columns, rows, spacing, dotRadius])
    const handleMouseLeave = useCallback(() => {
        // Do not animate out, just keep the last animatedMouse position
        startTransition(() => setMouse(null))
    }, [])

    // Scroll handler
    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        const onScroll = () => {
            startTransition(() => setScrollY(window.scrollY || 0))
        }
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [isStatic])

    // Grid size
    const width = (columns - 1) * spacing + dotRadius * 2
    const height = (rows - 1) * spacing + dotRadius * 2

    // Render dots
    const dots = []
    // Determine effective wave strength
    const effectiveWaveStrength = animatedMouse ? waveStrength : 0
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let x = col * spacing + dotRadius
            let y = row * spacing + dotRadius
            let dx = 0, dy = 0
            // Mouse-based wave
            if (animatedMouse) {
                // Use the actual SVG coordinates for the mouse pointer
                const dist = Math.hypot(animatedMouse.x - x, animatedMouse.y - y)
                if (dist < waveRadius) {
                    const angle = Math.atan2(y - animatedMouse.y, x - animatedMouse.x)
                    const force = (1 - dist / waveRadius) * effectiveWaveStrength
                    dx += Math.cos(angle) * force
                    dy += Math.sin(angle) * force
                }
            }
            // Scroll-based wave
            if (!animatedMouse && !isStatic) {
                const t = (scrollY / 100) + (col + row) * 0.2
                dy += Math.sin(t) * 0 // No wave when not hovered
            }
            dots.push(
                <circle
                    key={row + "," + col}
                    cx={x + dx}
                    cy={y + dy}
                    r={dotRadius}
                    fill={dotColor}
                />
            )
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                background: useGradient
                    ? `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`
                    : background,
                overflow: "hidden",
                position: "relative",
                touchAction: "none",
            }}
            onMouseMove={isStatic ? undefined : handleMouseMove}
            onMouseLeave={isStatic ? undefined : handleMouseLeave}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                style={{ display: "block" }}
                aria-hidden="true"
            >
                {dots}
            </svg>
        </div>
    )
}

addPropertyControls(InteractiveGrid, {
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FFBFBF",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        hidden: (props) => props.useGradient,
    },
    useGradient: {
        type: ControlType.Boolean,
        title: "Use Gradient",
        defaultValue: true,
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient From",
        defaultValue: "#000000",
        hidden: (props) => !props.useGradient,
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient To",
        defaultValue: "#FF4D4D",
        hidden: (props) => !props.useGradient,
    },
    gradientDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["90deg", "180deg", "270deg", "0deg"],
        optionTitles: ["Right", "Down", "Left", "Up"],
        defaultValue: "270deg",
        hidden: (props) => !props.useGradient,
    },
    dotRadius: {
        type: ControlType.Number,
        title: "Dot Radius",
        defaultValue: 1,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 40,
        min: 2,
        max: 40,
        step: 1,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 20,
        min: 2,
        max: 40,
        step: 1,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 41,
        min: 10,
        max: 100,
        step: 1,
        unit: "px",
    },
    waveStrength: {
        type: ControlType.Number,
        title: "Wave Strength",
        defaultValue: 60,
        min: 1,
        max: 60,
        step: 1,
        unit: "px",
    },
    waveRadius: {
        type: ControlType.Number,
        title: "Wave Radius",
        defaultValue: 166,
        min: 20,
        max: 400,
        step: 1,
        unit: "px",
    },
})
