// Soft, glowing, transparent falling stars with twinkle effect, reduced star size, for overlay use
import { useRef, useEffect, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const DEFAULT_STAR_COUNT = 48
const STAR_COLORS = [
    "#fffbe9",
    "#e0e7ff",
    "#f0f9ff",
    "#f3e8ff",
    "#ffe4fa",
]

function randomBetween(min, max) {
    return Math.random() * (max - min) + min
}

/**
 * Transparent, soft, glowing, falling stars effect with twinkle
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FallingStars(props) {
    const {
        starCount,
        minSize,
        maxSize,
        minSpeed,
        maxSpeed,
        blur,
        opacity,
        starColor,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [stars, setStars] = useState([])
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const containerRef = useRef(null)

    // Generate initial stars
    useEffect(() => {
        const w = dimensions.width
        const h = dimensions.height
        const arr = Array.from({ length: starCount }, () => {
            const size = randomBetween(minSize, maxSize)
            return {
                x: randomBetween(0, w),
                y: randomBetween(0, h),
                size,
                speed: randomBetween(minSpeed, maxSpeed) * 1.15,
                color: starColor === "random" ? STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)] : starColor,
                blur: blur,
                opacity: opacity,
                twinkleSeed: Math.random(),
            }
        })
        setStars(arr)
    }, [starCount, minSize, maxSize, minSpeed, maxSpeed, blur, opacity, starColor, dimensions.width, dimensions.height])

    // Track container size
    useEffect(() => {
        function updateSize() {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setDimensions({ width: rect.width, height: rect.height })
            }
        }
        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
    }, [])

    // Animate stars
    useEffect(() => {
        if (isStatic) return
        let frame
        function animate() {
            setStars((prev) =>
                prev.map((star) => {
                    let y = star.y + star.speed
                    if (y - star.size > dimensions.height) {
                        // Reset to top
                        y = -star.size
                        return {
                            ...star,
                            x: randomBetween(0, dimensions.width),
                            y,
                            size: randomBetween(minSize, maxSize),
                            speed: randomBetween(minSpeed, maxSpeed) * 1.15,
                            color: starColor === "random" ? STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)] : starColor,
                            twinkleSeed: Math.random(),
                        }
                    }
                    return { ...star, y }
                })
            )
            frame = requestAnimationFrame(animate)
        }
        frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [isStatic, dimensions.height, dimensions.width, minSize, maxSize, minSpeed, maxSpeed, starColor])

    // Twinkle effect: use a style tag for keyframes
    useEffect(() => {
        if (typeof window === "undefined") return
        if (!document.getElementById("falling-stars-twinkle")) {
            const styleSheet = document.createElement("style")
            styleSheet.id = "falling-stars-twinkle"
            styleSheet.innerHTML = `
            @keyframes twinkle {
                0% { opacity: 0.5; filter: brightness(0.95); }
                20% { opacity: 0.8; filter: brightness(1.1); }
                40% { opacity: 1; filter: brightness(1.25); }
                60% { opacity: 0.8; filter: brightness(1.1); }
                100% { opacity: 0.5; filter: brightness(0.95); }
            }
            `
            document.head.appendChild(styleSheet)
        }
    }, [])

    // Static preview
    const staticStars = useMemo(() => {
        const w = dimensions.width
        const h = dimensions.height
        return Array.from({ length: starCount }, () => {
            const size = randomBetween(minSize, maxSize)
            return {
                x: randomBetween(0, w),
                y: randomBetween(0, h),
                size,
                color: starColor === "random" ? STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)] : starColor,
                blur: blur,
                opacity: opacity,
                twinkleSeed: Math.random(),
            }
        })
    }, [starCount, minSize, maxSize, blur, opacity, starColor, dimensions.width, dimensions.height])

    const starsToRender = isStatic ? staticStars : stars

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "transparent",
                pointerEvents: "none",
                touchAction: "none",
            }}
            aria-hidden="true"
        >

            {starsToRender.map((star, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: star.x,
                        top: star.y,
                        width: star.size * 0.65, // reduced size
                        height: star.size * 0.65,
                        borderRadius: "50%",
                        background: star.color,
                        opacity: star.opacity,
                        animation: isStatic ? undefined : `twinkle 1.3s cubic-bezier(.4,0,.2,1) ${(star.twinkleSeed * 1.3).toFixed(2)}s infinite alternate`,
                        boxShadow: `0 0 ${star.size * 2.7}px ${star.color}, 0 0 ${star.size * 4.5}px ${star.color}, 0 0 ${star.size * 2.2}px ${star.color}`,
                        filter: `blur(${star.blur}px)`,
                        pointerEvents: "none",
                        transition: isStatic ? "all 0.5s cubic-bezier(.4,0,.2,1)" : undefined,
                    }}
                />
            ))}
        </div>
    )
}

// Shimmering light rays overlay
function ShimmeringRays({ width, height }) {
    // 3-5 rays, each with random angle, speed, and opacity
    const rayCount = 4
    // Rays originate from top right, angles negative (down/left), left positions near right edge
    const rays = useMemo(() => {
        return Array.from({ length: rayCount }, (_, i) => {
            const angle = randomBetween(-38, -12) // more negative, so rays go down/left
            const speed = randomBetween(18, 32)
            const opacity = randomBetween(0.16, 0.28) // more visible
            const widthPercent = randomBetween(22, 36)
            // left position: cluster near right edge (70-98%)
            const left = randomBetween(70, 98 - widthPercent)
            return { angle, speed, opacity, widthPercent, left, i }
        })
    }, [width, height])

    // Animate rays using CSS keyframes
    useEffect(() => {
        if (typeof window === "undefined") return
        if (!document.getElementById("falling-stars-rays")) {
            const styleSheet = document.createElement("style")
            styleSheet.id = "falling-stars-rays"
            styleSheet.innerHTML = `
            @keyframes shimmer-ray {
                0% { transform: translateY(-20%) scaleY(1) }
                100% { transform: translateY(120%) scaleY(1) }
            }
            `
            document.head.appendChild(styleSheet)
        }
    }, [])

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: width,
                height: height,
                pointerEvents: "none",
                zIndex: 0,
            }}
            aria-hidden="true"
        >
            {rays.map((ray) => (
                <div
                    key={ray.i}
                    style={{
                        position: "absolute",
                        left: `${ray.left}%`,
                        top: 0,
                        width: `${ray.widthPercent}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0) 100%)",
                        opacity: ray.opacity,
                        filter: "blur(24px)",
                        transform: `rotate(${ray.angle}deg)`,
                        mixBlendMode: "screen",
                        animation: `shimmer-ray ${ray.speed}s linear infinite`,
                        animationDelay: `${ray.i * 2.5}s`,
                    }}
                />
            ))}
        </div>
    )
}

addPropertyControls(FallingStars, {
    starCount: {
        type: ControlType.Number,
        title: "Stars",
        defaultValue: DEFAULT_STAR_COUNT,
        min: 8,
        max: 128,
        step: 1,
    },
    minSize: {
        type: ControlType.Number,
        title: "Min Size",
        defaultValue: 1.2,
        min: 0.5,
        max: 8,
        step: 0.2,
        unit: "px",
    },
    maxSize: {
        type: ControlType.Number,
        title: "Max Size",
        defaultValue: 3.5,
        min: 1.5,
        max: 12,
        step: 0.2,
        unit: "px",
    },
    minSpeed: {
        type: ControlType.Number,
        title: "Min Speed",
        defaultValue: 0.22,
        min: 0.05,
        max: 1.5,
        step: 0.01,
        unit: "px/frame",
    },
    maxSpeed: {
        type: ControlType.Number,
        title: "Max Speed",
        defaultValue: 0.7,
        min: 0.1,
        max: 2.5,
        step: 0.01,
        unit: "px/frame",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 2,
        min: 0,
        max: 8,
        step: 0.2,
        unit: "px",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.7,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    starColor: {
        type: ControlType.Enum,
        title: "Star Color",
        options: ["random", ...STAR_COLORS],
        optionTitles: ["Random", "Warm White", "Blue", "Aqua", "Purple", "Pink"],
        defaultValue: "random",
    },
})
