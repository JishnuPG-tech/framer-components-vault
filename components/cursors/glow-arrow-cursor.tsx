// Glowing Arrow Cursor
// Follows cursor, white glowing arrow, customizable glow blur, arrow size, trail fade speed, tilt, and optional particle sparks
import {
    useEffect,
    useRef,
    useState,
    useCallback,
    startTransition,
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


/**
 * Glowing Arrow Mouse Trail
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function GlowingArrowCursor(props) {
    const {
        glowBlur,
        arrowSize,
        tilt,
        arrowColor,
        arrowHeadType,
        style,
        glowColor,
        showDefaultCursor = true,
    } = props
    const isStatic = useIsStaticRenderer()
    const [trail, setTrail] = useState([])
    const [mouse, setMouse] = useState({ x: -100, y: -100 })
    const [lastMove, setLastMove] = useState(Date.now())
    const [inViewport, setInViewport] = useState(false)
    const raf = useRef(null)
    const containerRef = useRef(null)

    // Mouse move handler
    const handleMove = useCallback(
        (e) => {
            let x, y
            if (typeof window !== "undefined") {
                x = e.clientX
                y = e.clientY
                const w = window.innerWidth
                const h = window.innerHeight
                // If out of bounds, hide cursor
                if (x < 0 || y < 0 || x >= w || y >= h) {
                    if (inViewport) startTransition(() => setInViewport(false))
                } else {
                    if (!inViewport) startTransition(() => setInViewport(true))
                    // Clamp to [0, w-1] and [0, h-1]
                    x = Math.max(0, Math.min(x, w - 1))
                    y = Math.max(0, Math.min(y, h - 1))
                }
            } else {
                x = 200
                y = 200
            }
            startTransition(() => setMouse({ x, y }))
            setLastMove(Date.now())
        },
        [inViewport]
    )

    // Trail update
    useEffect(() => {
        if (isStatic) return
        let running = true
        function animate() {
            if (!running) return
            setTrail((prev) => {
                const now = Date.now()
                if (prev.length > 0) {
                    const last = prev[0]
                    const dx = mouse.x - last.x
                    const dy = mouse.y - last.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (
                        (mouse.x !== last.x || mouse.y !== last.y) &&
                        dist > 20
                    ) {
                        return [
                            { x: mouse.x, y: mouse.y, t: now },
                            ...prev.slice(0, 19),
                        ]
                    } else {
                        return prev
                    }
                } else {
                    return [{ x: mouse.x, y: mouse.y, t: now }]
                }
            })
            raf.current = requestAnimationFrame(animate)
        }
        raf.current = requestAnimationFrame(animate)
        return () => {
            running = false
            if (raf.current) cancelAnimationFrame(raf.current)
        }
    }, [mouse.x, mouse.y, isStatic])

    // Mouse listeners
    useEffect(() => {
        if (isStatic) return
        window.addEventListener("pointermove", handleMove)
        // Listen for mouseleave/enter on window
        function handleMouseLeave(e) {
            if (typeof window !== "undefined") {
                // Explicitly check mouse position on leave
                if (e && e.relatedTarget === null) {
                    // Mouse left window
                    startTransition(() => setInViewport(false))
                }
            }
        }
        function handleMouseEnter(e) {
            if (typeof window !== "undefined") {
                // Explicitly check mouse position on enter
                if (e && e.relatedTarget === null) {
                    // Mouse entered window
                    startTransition(() => setInViewport(true))
                }
            }
        }
        // Listen for pointerout to catch all cases
        function handlePointerOut(e) {
            if (typeof window !== "undefined") {
                let x = e.clientX
                let y = e.clientY
                const w = window.innerWidth
                const h = window.innerHeight
                // If out of bounds, hide cursor
                if (x < 0 || y < 0 || x >= w || y >= h) {
                    startTransition(() => setInViewport(false))
                }
            }
        }
        window.addEventListener("mouseout", handleMouseLeave)
        window.addEventListener("mouseover", handleMouseEnter)
        window.addEventListener("pointerout", handlePointerOut)
        return () => {
            window.removeEventListener("pointermove", handleMove)
            window.removeEventListener("mouseout", handleMouseLeave)
            window.removeEventListener("mouseover", handleMouseEnter)
            window.removeEventListener("pointerout", handlePointerOut)
        }
    }, [handleMove, isStatic])

    // Arrow SVG path (upward by default, tilt in degrees)
    // const arrowPath = `M${arrowSize / 2},0 L0,${arrowSize} L${arrowSize},${arrowSize} Z`
    // Arrow shape: previous version (triangle with stem)
    // const stemLength = arrowSize * 0.7
    // const stemWidth = arrowSize * 0.18
    // const headHeight = arrowSize * 0.45
    // const headWidth = arrowSize * 0.5
    // const cx = arrowSize / 2
    // const cy = arrowSize / 2
    // Arrow points upward by default
    // const arrowPath = `M${cx},${cy - stemLength / 2} L${cx - headWidth / 2},${cy - stemLength / 2 + headHeight} L${cx - stemWidth / 2},${cy - stemLength / 2 + headHeight} L${cx - stemWidth / 2},${cy + stemLength / 2} L${cx + stemWidth / 2},${cy + stemLength / 2} L${cx + stemWidth / 2},${cy - stemLength / 2 + headHeight} L${cx + headWidth / 2},${cy - stemLength / 2 + headHeight} Z`
    // Arrow rotates around its own center
    // const arrowTransform = `translate(${mouse.x - arrowSize / 2},${mouse.y - arrowSize / 2}) rotate(${tilt} ${arrowSize / 2} ${arrowSize / 2})`

    // Rounded vertex, inverted V shape
    const cx = arrowSize / 2
    const cy = arrowSize / 2
    const gridSize = 7
    const dotSize = arrowSize * 0.13
    const spacing = arrowSize * 0.12
    // Arrow pixel grid (rightward arrow)
    // 7x7 grid, 1 = dot, 0 = empty
    const arrowGrid = [
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
    ]
    // Center grid in SVG
    const gridOffset = (arrowSize - (gridSize - 1) * spacing) / 2

    // Second arrow head option: triangle made with circles (previous version)
    const triangleGrid = [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
    ]
    const triangleGridSize = 5
    const triangleDotSize = arrowSize * 0.15
    const triangleSpacing = arrowSize * 0.16
    const triangleGridOffset =
        (arrowSize - (triangleGridSize - 1) * triangleSpacing) / 2
    function renderTriangleDots() {
        const dots = []
        for (let y = 0; y < triangleGridSize; y++) {
            for (let x = 0; x < triangleGridSize; x++) {
                if (triangleGrid[y][x]) {
                    dots.push(
                        <circle
                            key={x + "-" + y}
                            cx={triangleGridOffset + x * triangleSpacing}
                            cy={triangleGridOffset + y * triangleSpacing}
                            r={triangleDotSize / 2}
                            fill={arrowColor}
                            filter={`drop-shadow(0 0 ${glowBlur * 0.5}px ${glowColor || arrowColor})`}
                        />
                    )
                }
            }
        }
        return dots
    }
    function renderArrowDots() {
        const dots = []
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (arrowGrid[y][x]) {
                    dots.push(
                        <circle
                            key={x + "-" + y}
                            cx={gridOffset + x * spacing}
                            cy={gridOffset + y * spacing}
                            r={dotSize / 2}
                            fill={arrowColor}
                            filter={`drop-shadow(0 0 ${glowBlur * 0.5}px ${glowColor || arrowColor})`}
                        />
                    )
                }
            }
        }
        return dots
    }
    // Tilt: 0 = up, negative = left, positive = right
    // For both arrow types, tilt is from upright (upwards) position, only left/right
    const arrowTransform = `translate(${mouse.x - arrowSize / 2},${mouse.y - arrowSize / 2}) rotate(${tilt} ${arrowSize / 2} ${arrowSize / 2})`

    // Particle sparks
    function renderSparks(x, y) {
        return null
    }

    // Render trail (fading)
    function renderTrail() {
        return trail.map((p, i) => {
            const age = (Date.now() - p.t) / (700 / 1000)
            const opacity = Math.max(0, 1 - age)
            return (
                <g key={p.t + "-" + i} style={{ opacity }}>
                    <g
                        transform={`translate(${p.x - arrowSize / 2},${p.y - arrowSize / 2}) rotate(${tilt} ${arrowSize / 2} ${arrowSize / 2})`}
                    >
                        {arrowHeadType === "triangle"
                            ? renderTriangleDots()
                            : renderArrowDots()}
                    </g>
                </g>
            )
        })
    }

    // Static preview
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...style,
                    width: "100vw",
                    height: "100vh",
                    borderRadius: 16,
                    overflow: "hidden",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            >
                <svg
                    width="100vw"
                    height="100vh"
                    style={{ position: "absolute", left: 0, top: 0 }}
                >
                    <g transform={arrowTransform}>
                        {arrowHeadType === "triangle"
                            ? renderTriangleDots()
                            : renderArrowDots()}
                    </g>
                </svg>
            </div>
        )
    }

    // Hide system cursor if showDefaultCursor is false
    useEffect(() => {
        if (typeof window === "undefined") return
        if (!showDefaultCursor) {
            const prev = document.body.style.cursor
            document.body.style.cursor = "none"
            return () => {
                document.body.style.cursor = prev
            }
        }
    }, [showDefaultCursor])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100vw",
                height: "100vh",
                borderRadius: 16,
                overflow: "hidden",
                position: "fixed",
                left: 0,
                top: 0,
                pointerEvents: "none",
                zIndex: 1,
                touchAction: "none",
                transition: "opacity 0.25s cubic-bezier(.4,0,.2,1)",
                opacity: inViewport ? 1 : 0,
            }}
            tabIndex={0}
            aria-label="Glowing Arrow Mouse Trail"
        >
            <svg
                width="100vw"
                height="100vh"
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                }}
            >
                {renderTrail()}
                <g transform={arrowTransform}>
                    {arrowHeadType === "triangle"
                        ? renderTriangleDots()
                        : renderArrowDots()}
                </g>
            </svg>
        </div>
    )
}

addPropertyControls(GlowingArrowCursor, {
    arrowHeadType: {
        type: ControlType.Enum,
        title: "Arrow Head",
        options: ["dotgrid", "triangle"],
        optionTitles: ["Dotted arrow", "Triangle"],
        defaultValue: "dotgrid",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#fff",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 48,
        min: 16,
        max: 128,
        step: 1,
        unit: "px",
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 16,
        min: 2,
        max: 64,
        step: 1,
        unit: "px",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Colour",
        defaultValue: "#fff",
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 0,
        min: -60,
        max: 60,
        step: 1,
        unit: "deg",
        description: "Negative tilts left, positive tilts right, 0 is up",
    },
    showDefaultCursor: {
        type: ControlType.Boolean,
        title: "Cursor",
        defaultValue: true,
        enabledTitle: "ON",
        disabledTitle: "OFF",
    },
})

export default GlowingArrowCursor
