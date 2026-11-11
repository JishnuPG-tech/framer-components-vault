// Night sky particle background with customizable background color, star count, star color, star lightness, and more
import { useMemo, useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


function randomBetween(min, max) {
    return Math.random() * (max - min) + min
}

// Helper for random angle in radians
function randomAngle() {
    return Math.random() * 2 * Math.PI
}

/**
 * Night Sky Particle Background
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NightSkyParticles(props) {
    const {
        backgroundColor,
        starCount,
        starMinSize,
        starMaxSize,
        starLightness,
        twinkle,
        style,
        starColors = ["#FFFFFF", "#B5CFFF"],
    } = props

    // Parallax: assign a depth to each star (0 = far, 1 = near)
    // Generate stars only once per starCount
    const stars = useMemo(() => {
        return Array.from({ length: starCount }).map(() => {
            const x = randomBetween(0, 100)
            const y = randomBetween(0, 100)
            const size = randomBetween(starMinSize, starMaxSize)
            // Pick a color from starColors array
            const colorIdx = Math.floor(randomBetween(0, starColors.length))
            const fillColor = starColors[colorIdx] || "#FFFFFF"
            const depth = randomBetween(0.2, 1) // 0.2 = far, 1 = near
            const angle = randomBetween(0, 360) // Angle in degrees
            return { x, y, size, fillColor, depth, angle }
        })
    }, [starCount, starMinSize, starMaxSize, starColors])

    // Shooting stars state
    const {
        shootingStars,
        shootingStarFrequency,
        shootingStarSpeed,
        shootingStarTrailLength,
        shootingStarColor,
        shootingStarOpacity,
    } = props
    const [meteors, setMeteors] = useState([])

    // Meteor logic
    useEffect(() => {
        if (!shootingStars) return
        let running = true
        let timeoutId
        function spawnMeteor() {
            if (!running) return
            // Random start position (top 0-30% of sky, left 0-100%)
            const startY = randomBetween(0, 30)
            const startX = randomBetween(0, 100)
            // Random angle: mostly diagonal, but a bit of spread
            const angle = randomBetween(Math.PI * 0.7, Math.PI * 0.95)
            // Speed in px/ms
            const speed = shootingStarSpeed
            // Trail length in px
            const trail = shootingStarTrailLength
            // Color
            const color = shootingStarColor
            // Opacity
            const opacity = shootingStarOpacity
            // Each meteor has a unique id
            const id = Math.random().toString(36).slice(2)
            setMeteors(meteors => [...meteors, {
                id,
                x: startX,
                y: startY,
                angle,
                speed,
                trail,
                color,
                opacity,
                created: Date.now(),
            }])
            // Next meteor after random interval
            timeoutId = setTimeout(spawnMeteor, randomBetween(1000 / shootingStarFrequency, 3000 / shootingStarFrequency))
        }
        spawnMeteor()
        return () => {
            running = false
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [shootingStars, shootingStarFrequency, shootingStarSpeed, shootingStarTrailLength, shootingStarColor, shootingStarOpacity])

    // Animate meteors
    useEffect(() => {
        if (!shootingStars) return
        let rafId
        function animate() {
            setMeteors(meteors => meteors.filter(meteor => {
                // Remove if out of bounds
                const dx = Math.cos(meteor.angle) * meteor.speed * ((Date.now() - meteor.created) / 16)
                const dy = Math.sin(meteor.angle) * meteor.speed * ((Date.now() - meteor.created) / 16)
                const x = meteor.x + dx
                const y = meteor.y + dy
                return x >= -10 && x <= 110 && y >= -10 && y <= 110
            }))
            rafId = requestAnimationFrame(animate)
        }
        rafId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafId)
    }, [shootingStars])

    // Parallax: track scroll position
    const [scrollY, setScrollY] = useState(0)
    useEffect(() => {
        function onScroll() {
            setScrollY(window.scrollY || window.pageYOffset || 0)
        }
        if (typeof window !== "undefined") {
            window.addEventListener("scroll", onScroll, { passive: true })
            return () => window.removeEventListener("scroll", onScroll)
        }
    }, [])

    // Dynamic star density based on scroll position
    const [dynamicStarCount, setDynamicStarCount] = useState(starCount)
    useEffect(() => {
        // Adjust star count based on scroll position (simulate depth)
        // More stars when scrolled up, fewer when scrolled down
        // Clamp between 40% and 100% of starCount
        const minStars = Math.max(10, Math.floor(starCount * 0.4))
        const maxStars = starCount
        const docHeight = typeof document !== "undefined" ? document.body.scrollHeight - window.innerHeight : 1
        const scrollRatio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0
        const newCount = Math.round(maxStars - (maxStars - minStars) * scrollRatio)
        setDynamicStarCount(newCount)
    }, [scrollY, starCount])

    // Animation curve and duration for parallax
    const { parallaxEasing, parallaxDuration } = props
    // Easing function map
    const easingFns = {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    }
    const ease = easingFns[parallaxEasing] || easingFns.linear

    const isFixedWidth = style && style.width === "100%"
    const isFixedHeight = style && style.height === "100%"

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: backgroundColor,
                overflow: "hidden",
                borderRadius: style?.borderRadius,
            }}
        >
            {/* Atmospheric haze overlay */}
            {props.atmosphere && (
                <div
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: `radial-gradient(ellipse at 50% 60%, ${props.atmosphereColor} ${props.atmosphereIntensity * 80}%, transparent 100%)`,
                        opacity: props.atmosphereIntensity,
                        zIndex: 1,
                        mixBlendMode: "lighten",
                    }}
                    aria-hidden="true"
                />
            )}
            <svg
                width="100%"
                height="100%"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
                aria-hidden="true"
            >
                {stars.slice(0, dynamicStarCount).map((star, i) => {
                    // Parallax: stars at different depths move at different speeds
                    // The closer the star (depth ~1), the more it moves with scroll
                    // The farther (depth ~0.2), the less it moves
                    // Apply easing and duration
                    const t = Math.min(1, Math.abs(scrollY) / (parallaxDuration || 1000))
                    const easedT = ease(t)
                    const parallaxY = star.y + (scrollY * (1 - star.depth) * 0.03 * easedT)
                    const cy = `${parallaxY % 100}%`
                    // Pulsate: animate radius with a slow sine wave
                    const now = Date.now()
                    const pulse = 0.5 + 0.5 * Math.sin((now / 2000) + i)
                    const pulsateAmount = 0.25 * star.size // 25% of star size
                    const r = star.size + (pulse - 0.5) * pulsateAmount
                    const twinkleAnim = twinkle
                        ? {
                              animation: `twinkle 2s linear infinite`,
                              animationDelay: `${randomBetween(0, 2)}s`,
                          }
                        : {}
                    // Always render as circle
                    return (
                        <circle
                            key={i}
                            cx={`${star.x}%`}
                            cy={cy}
                            r={r}
                            fill={star.fillColor}
                            fillOpacity={starLightness}
                            style={twinkleAnim}
                        />
                    )
                })}
                {/* Shooting stars */}
                {shootingStars && meteors.map(meteor => {
                    // Animate position
                    const elapsed = (Date.now() - meteor.created) / 16
                    const dx = Math.cos(meteor.angle) * meteor.speed * elapsed
                    const dy = Math.sin(meteor.angle) * meteor.speed * elapsed
                    const x = meteor.x + dx
                    const y = meteor.y + dy
                    // Trail
                    const trailX = x - Math.cos(meteor.angle) * meteor.trail
                    const trailY = y - Math.sin(meteor.angle) * meteor.trail
                    return (
                        <g key={meteor.id}>
                            <line
                                x1={`${trailX}%`}
                                y1={`${trailY}%`}
                                x2={`${x}%`}
                                y2={`${y}%`}
                                stroke={meteor.color}
                                strokeWidth={2}
                                strokeLinecap="round"
                                opacity={meteor.opacity}
                                style={{ filter: `blur(0.5px)` }}
                            />
                            <circle
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r={2.5}
                                fill={meteor.color}
                                opacity={meteor.opacity}
                                style={{ filter: `blur(0.5px)` }}
                            />
                        </g>
                    )
                })}
            </svg>
            <style>{`
                @keyframes twinkle {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    )
}

addPropertyControls(NightSkyParticles, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A1026",
    },
    starCount: {
        type: ControlType.Number,
        title: "Stars",
        defaultValue: 80,
        min: 10,
        max: 300,
        step: 1,
        displayStepper: true,
    },
    starMinSize: {
        type: ControlType.Number,
        title: "Min Size",
        defaultValue: 0.5,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "px",
    },
    starMaxSize: {
        type: ControlType.Number,
        title: "Max Size",
        defaultValue: 1.5,
        min: 0.5,
        max: 4,
        step: 0.1,
        unit: "px",
    },
    starColors: {
        type: ControlType.Array,
        title: "Star Colors",
        control: {
            type: ControlType.Color,
            defaultValue: "#FFFFFF",
        },
        maxCount: 8,
        defaultValue: ["#FFFFFF", "#B5CFFF"],
    },
    starLightness: {
        type: ControlType.Number,
        title: "Lightness",
        defaultValue: 0.85,
        min: 0.1,
        max: 1,
        step: 0.01,
    },
    twinkle: {
        type: ControlType.Boolean,
        title: "Twinkle",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    parallaxEasing: {
        type: ControlType.Enum,
        title: "Parallax Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out"],
        defaultValue: "linear",
    },
    parallaxDuration: {
        type: ControlType.Number,
        title: "Parallax Duration",
        defaultValue: 1000,
        min: 100,
        max: 5000,
        step: 50,
        unit: "ms",
    },
    // Shooting star controls
    shootingStars: {
        type: ControlType.Boolean,
        title: "Shooting Stars",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shootingStarFrequency: {
        type: ControlType.Number,
        title: "Meteor Freq",
        defaultValue: 0.5,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "/s",
        hidden: ({ shootingStars }) => !shootingStars,
    },
    shootingStarSpeed: {
        type: ControlType.Number,
        title: "Meteor Speed",
        defaultValue: 0.25,
        min: 0.05,
        max: 1,
        step: 0.01,
        unit: "%/ms",
        hidden: ({ shootingStars }) => !shootingStars,
    },
    shootingStarTrailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        defaultValue: 12,
        min: 4,
        max: 40,
        step: 1,
        unit: "%",
        hidden: ({ shootingStars }) => !shootingStars,
    },
    shootingStarColor: {
        type: ControlType.Color,
        title: "Meteor Color",
        defaultValue: "#FFF7C2",
        hidden: ({ shootingStars }) => !shootingStars,
    },
    shootingStarOpacity: {
        type: ControlType.Number,
        title: "Meteor Opacity",
        defaultValue: 0.7,
        min: 0.1,
        max: 1,
        step: 0.01,
        hidden: ({ shootingStars }) => !shootingStars,
    },
    // Atmospheric haze controls
    atmosphere: {
        type: ControlType.Boolean,
        title: "Atmosphere",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    atmosphereIntensity: {
        type: ControlType.Number,
        title: "Haze Intensity",
        defaultValue: 0.18,
        min: 0,
        max: 0.7,
        step: 0.01,
        hidden: ({ atmosphere }) => !atmosphere,
    },
    atmosphereColor: {
        type: ControlType.Color,
        title: "Haze Color",
        defaultValue: "#B6B6C9",
        hidden: ({ atmosphere }) => !atmosphere,
    },
})