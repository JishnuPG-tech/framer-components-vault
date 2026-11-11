// RGB glowing thin flowy animated string mouse trail component, customizable size, color, and properties
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


const DEFAULT_COLOR = "#00FFFF"
const DEFAULT_TRAIL_LENGTH = 24
const DEFAULT_THICKNESS = 3
const DEFAULT_GLOW = 16
const DEFAULT_SPEED = 0.22
const DEFAULT_OPACITY = 0.7

/**
 * RGB Glowing Mouse Trail
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RGBMouseTrail(props) {
    const {
        color,
        trailLength,
        thickness,
        glow,
        speed,
        opacity,
        colorMode, // new prop
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const [points, setPoints] = useState([])
    const [mouse, setMouse] = useState({ x: 0, y: 0 })
    const rafRef = useRef(null)
    const containerRef = useRef(null)

    // Mouse move handler
    useEffect(() => {
        if (isStatic) return
        function handleMove(e) {
            let x = e.clientX, y = e.clientY
            startTransition(() => setMouse({ x, y }))
        }
        window.addEventListener("mousemove", handleMove)
        return () => window.removeEventListener("mousemove", handleMove)
    }, [isStatic])

    // Animate trail
    useEffect(() => {
        if (isStatic) return
        let running = true
        function animate() {
            setPoints(prev => {
                let next = prev.length ? [...prev] : Array(trailLength).fill({ x: mouse.x, y: mouse.y })
                // Move each point towards the previous one
                for (let i = next.length - 1; i > 0; i--) {
                    next[i] = {
                        x: next[i].x + (next[i - 1].x - next[i].x) * speed,
                        y: next[i].y + (next[i - 1].y - next[i].y) * speed,
                    }
                }
                // Head follows mouse
                next[0] = { x: mouse.x, y: mouse.y }
                return next
            })
            if (running) rafRef.current = requestAnimationFrame(animate)
        }
        rafRef.current = requestAnimationFrame(animate)
        return () => {
            running = false
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [mouse.x, mouse.y, trailLength, speed, isStatic])

    // Responsive sizing
    // const width = style?.width === "100%" ? 400 : style?.width || 400
    // const height = style?.height === "100%" ? 300 : style?.height || 300
    const width = typeof window !== "undefined" ? window.innerWidth : 1920
    const height = typeof window !== "undefined" ? window.innerHeight : 1080

    // Generate SVG path
    function getPath(pts) {
        if (!pts.length) return ""
        // Use Catmull-Rom to Bezier for smooth curve
        function catmullRom2bezier(points) {
            if (points.length < 2) return ""
            let d = `M${points[0].x},${points[0].y}`
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i - 1] || points[i]
                const p1 = points[i]
                const p2 = points[i + 1]
                const p3 = points[i + 2] || p2
                const c1x = p1.x + (p2.x - p0.x) / 6
                const c1y = p1.y + (p2.y - p0.y) / 6
                const c2x = p2.x - (p3.x - p1.x) / 6
                const c2y = p2.y - (p3.y - p1.y) / 6
                d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
            }
            return d
        }
        return catmullRom2bezier(pts)
    }

    // --- FULLSCREEN RENDERING ---
    // Always render a single absolutely-positioned div at the end of the body
    // so the trail overlays the entire viewport, regardless of Framer container
    useEffect(() => {
        if (isStatic) return
        if (!containerRef.current) return
        // Move the container to the end of body
        const el = containerRef.current
        if (el.parentNode !== document.body) {
            document.body.appendChild(el)
        }
        return () => {
            if (el.parentNode === document.body) {
                document.body.removeChild(el)
            }
        }
    }, [isStatic])

    // RGB animated gradient
    const gradientId = "trail-gradient"
    const now = Date.now() / 1000
    const rgb = [
        `hsl(${(now * 120) % 360},100%,60%)`,
        `hsl(${(now * 120 + 120) % 360},100%,60%)`,
        `hsl(${(now * 120 + 240) % 360},100%,60%)`,
    ]

    // Solid color glow filter (extra blur for solid mode)
    const solidGlowFilter = colorMode === "solid" ? `drop-shadow(0 0 ${glow * 2}px ${color}) blur(${glow / 2}px)` : `drop-shadow(0 0 ${glow}px ${color})`

    // Center glow for solid mode
    const centerGlow = colorMode === "solid"
        ? `drop-shadow(0 0 ${glow * 2}px ${color}) blur(${glow / 2}px) drop-shadow(0 0 24px ${color})`
        : `drop-shadow(0 0 ${glow}px ${color})`

    // Static preview
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...style,
                    width: "100vw",
                    height: "100vh",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                    zIndex: 9999,
                    background: "transparent",
                }}
            >
                <svg width="100vw" height="100vh" style={{ position: "absolute", top: 0, left: 0 }}>
                    <defs>
                        {colorMode === "rgb" ? (
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                {typeof window === "undefined" ? null : <stop offset="0%" stopColor={color} />}
                                {typeof window === "undefined" ? null : <stop offset="50%" stopColor="#fff" />}
                                {typeof window === "undefined" ? null : <stop offset="100%" stopColor={color} />}
                            </linearGradient>
                        ) : (
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                {typeof window === "undefined" ? null : <stop offset="0%" stopColor={color} />}
                                {typeof window === "undefined" ? null : <stop offset="100%" stopColor={color} />}
                            </linearGradient>
                        )}
                    </defs>
                    <path
                        d={`M${width * 0.2},${height * 0.7} Q${width * 0.5},${height * 0.1} ${width * 0.8},${height * 0.7}`}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={thickness}
                        strokeLinecap="round"
                        fill="none"
                        opacity={opacity}
                        filter={colorMode === "solid" ? centerGlow : `drop-shadow(0 0 ${glow}px ${color})`}
                    />
                </svg>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100vw",
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
                pointerEvents: "none",
                zIndex: 9999,
                background: "transparent",
                overflow: "visible",
            }}
        >
            <svg width="100vw" height="100vh" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                <defs>
                    {colorMode === "rgb" ? (
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            {typeof window === "undefined" ? null : <stop offset="0%" stopColor={rgb[0]} />}
                            {typeof window === "undefined" ? null : <stop offset="50%" stopColor={rgb[1]} />}
                            {typeof window === "undefined" ? null : <stop offset="100%" stopColor={rgb[2]} />}
                        </linearGradient>
                    ) : (
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            {typeof window === "undefined" ? null : <stop offset="0%" stopColor={color} />}
                            {typeof window === "undefined" ? null : <stop offset="100%" stopColor={color} />}
                        </linearGradient>
                    )}
                </defs>
                <path
                    d={getPath(points)}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    fill="none"
                    opacity={opacity}
                    filter={colorMode === "solid" ? centerGlow : `drop-shadow(0 0 ${glow}px ${color})`}
                />
            </svg>
        </div>
    )
}

addPropertyControls(RGBMouseTrail, {
    colorMode: {
        type: ControlType.Enum,
        title: "Color Mode",
        options: ["rgb", "solid"],
        optionTitles: ["RGB Glow", "Solid Glow"],
        defaultValue: "rgb",
    },
    color: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: DEFAULT_COLOR,
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        defaultValue: DEFAULT_TRAIL_LENGTH,
        min: 8,
        max: 64,
        step: 1,
        displayStepper: true,
    },
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: DEFAULT_THICKNESS,
        min: 1,
        max: 12,
        step: 0.5,
        displayStepper: true,
    },
    glow: {
        type: ControlType.Number,
        title: "Glow/Blur",
        defaultValue: DEFAULT_GLOW,
        min: 0,
        max: 48,
        step: 1,
        displayStepper: true,
        description: "Glow/Blur amount for solid mode (also affects RGB mode)",
    },
    speed: {
        type: ControlType.Number,
        title: "Flowiness",
        defaultValue: DEFAULT_SPEED,
        min: 0.05,
        max: 0.5,
        step: 0.01,
        displayStepper: true,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: DEFAULT_OPACITY,
        min: 0.1,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
})