// Cursor-follow firework streak with adjustable settings: color, direction, particles, etc.
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


const defaultColors = ["#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF", "#5856D6"]

function lerp(a, b, t) {
    return a + (b - a) * t
}

function randomBetween(a, b) {
    return a + Math.random() * (b - a)
}

/**
 * Cursor Firework Streak
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FireworkCursor(props) {
    const {
        particleCount,
        particleSize,
        streakLength,
        color1,
        color2,
        color3,
        direction,
        speed,
        spread,
        fade,
        style,
        particleShape,
    } = props
    const isStatic = useIsStaticRenderer()
    const [particles, setParticles] = useState([])
    const [mouse, setMouse] = useState({ x: 300, y: 200 })
    const requestRef = useRef(null)
    const containerRef = useRef(null)

    // Color palette
    const colors = [color1, color2, color3].filter(Boolean)

    // Direction in radians
    const baseAngle = {
        any: null,
        up: -Math.PI / 2,
        down: Math.PI / 2,
        left: Math.PI,
        right: 0,
    }[direction]

    // Mouse tracking
    useEffect(() => {
        if (isStatic) return
        function handleMove(e) {
            let rect = containerRef.current?.getBoundingClientRect()
            let x = e.clientX, y = e.clientY
            if (rect) {
                x -= rect.left
                y -= rect.top
            }
            startTransition(() => setMouse({ x, y }))
        }
        window.addEventListener("mousemove", handleMove)
        return () => window.removeEventListener("mousemove", handleMove)
    }, [isStatic])

    // Animation loop
    useEffect(() => {
        if (isStatic) return
        function animate() {
            setParticles((prev) => {
                // Move particles, apply burn (shrink/dim), and gravity
                let next = prev
                    .map((p) => {
                        // Burn: shrink and dim
                        const burn = props.burn
                        let newSize = p.size
                        let newAlpha = p.alpha
                        if (burn) {
                            newSize = Math.max(0.5, p.size * 0.97)
                            newAlpha = Math.max(0, p.alpha * 0.96)
                        }
                        // Gravity
                        const gravity = 0.18
                        return {
                            ...p,
                            x: p.x + p.vx,
                            y: p.y + p.vy,
                            vy: p.vy + gravity,
                            life: p.life - 1,
                            size: newSize,
                            alpha: newAlpha,
                        }
                    })
                    .filter((p) => p.life > 0 && p.alpha > 0.01 && p.size > 0.3)
                // Add new particles
                for (let i = 0; i < particleCount; i++) {
                    let angle = baseAngle !== null ? baseAngle + randomBetween(-spread, spread) : randomBetween(0, Math.PI * 2)
                    let v = speed * randomBetween(0.7, 1.2)
                    next.push({
                        x: mouse.x,
                        y: mouse.y,
                        vx: Math.cos(angle) * v,
                        vy: Math.sin(angle) * v,
                        color: colors[Math.floor(Math.random() * colors.length)] || defaultColors[i % defaultColors.length],
                        size: randomBetween(particleSize * 0.7, particleSize * 1.3),
                        life: streakLength,
                        maxLife: streakLength,
                        alpha: 1,
                    })
                }
                return next.slice(-particleCount * streakLength * 2)
            })
            requestRef.current = requestAnimationFrame(animate)
        }
        requestRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(requestRef.current)
    }, [mouse, particleCount, streakLength, colors, baseAngle, speed, spread, particleSize, isStatic, props.burn])

    // Static preview
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    background: "#111",
                    borderRadius: 8,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <svg width="100%" height="100%" style={{ display: "block" }}>
                    <circle cx="50%" cy="50%" r={particleSize * 2} fill={color1} opacity={0.7} />
                </svg>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "transparent",
                borderRadius: 0,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 9999,
                touchAction: "none",
            }}
        >
            <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                {particles.map((p, i) => (
                    particleShape === "circle" ? (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={p.size}
                            fill={p.color}
                            opacity={fade ? Math.max(0, p.life / p.maxLife) * (p.alpha ?? 1) : (p.alpha ?? 1)}
                            filter="url(#glow)"
                        />
                    ) : particleShape === "square" ? (
                        <rect
                            key={i}
                            x={p.x - p.size}
                            y={p.y - p.size}
                            width={p.size * 2}
                            height={p.size * 2}
                            fill={p.color}
                            opacity={fade ? Math.max(0, p.life / p.maxLife) * (p.alpha ?? 1) : (p.alpha ?? 1)}
                            filter="url(#glow)"
                        />
                    ) : particleShape === "triangle" ? (
                        <polygon
                            key={i}
                            points={`
                                ${p.x},${p.y - p.size}
                                ${p.x - p.size * Math.sin(Math.PI / 3)},${p.y + p.size / 2}
                                ${p.x + p.size * Math.sin(Math.PI / 3)},${p.y + p.size / 2}
                            `}
                            fill={p.color}
                            opacity={fade ? Math.max(0, p.life / p.maxLife) * (p.alpha ?? 1) : (p.alpha ?? 1)}
                            filter="url(#glow)"
                        />
                    ) : particleShape === "diamond" ? (
                        <polygon
                            key={i}
                            points={`
                                ${p.x},${p.y - p.size}
                                ${p.x - p.size},${p.y}
                                ${p.x},${p.y + p.size}
                                ${p.x + p.size},${p.y}
                            `}
                            fill={p.color}
                            opacity={fade ? Math.max(0, p.life / p.maxLife) * (p.alpha ?? 1) : (p.alpha ?? 1)}
                            filter="url(#glow)"
                        />
                    ) : particleShape === "star" ? (
                        <polygon
                            key={i}
                            points={(() => {
                                const spikes = 5
                                const outerRadius = p.size
                                const innerRadius = p.size * 0.5
                                let points = []
                                for (let j = 0; j < spikes * 2; j++) {
                                    const angle = Math.PI / spikes * j
                                    const r = j % 2 === 0 ? outerRadius : innerRadius
                                    const x = p.x + Math.cos(angle - Math.PI / 2) * r
                                    const y = p.y + Math.sin(angle - Math.PI / 2) * r
                                    points.push(`${x},${y}`)
                                }
                                return points.join(" ")
                            })()}
                            fill={p.color}
                            opacity={fade ? Math.max(0, p.life / p.maxLife) * (p.alpha ?? 1) : (p.alpha ?? 1)}
                            filter="url(#glow)"
                        />
                    ) : null
                ))}
            </svg>
        </div>
    )
}

addPropertyControls(FireworkCursor, {
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 6,
        min: 1,
        max: 32,
        step: 1,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 6,
        min: 1,
        max: 32,
        step: 1,
    },
    streakLength: {
        type: ControlType.Number,
        title: "Streak",
        defaultValue: 24,
        min: 4,
        max: 64,
        step: 1,
    },
    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#FF3B30",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#FFCC00",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#007AFF",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["any", "up", "down", "left", "right"],
        optionTitles: ["Any", "Up", "Down", "Left", "Right"],
        defaultValue: "any",
        displaySegmentedControl: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 4,
        min: 1,
        max: 16,
        step: 0.1,
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 0.7,
        min: 0,
        max: Math.PI,
        step: 0.01,
    },
    fade: {
        type: ControlType.Boolean,
        title: "Fade",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    particleShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "square", "triangle", "diamond", "star"],
        optionTitles: ["Circle", "Square", "Triangle", "Diamond", "Star"],
        defaultValue: "circle",
    },
})
