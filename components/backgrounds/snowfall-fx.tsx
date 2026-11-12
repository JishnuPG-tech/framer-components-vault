// Snowflake Image Component (Stable Version, No Intersection Observer)
// Features:
// - Snowflakes fall from the top and accumulate at the bottom (optional, up to 30% height)
// - Basic stacking/collision: flakes land on the pile or each other
// - Activation mode: 'hover' (hover/tap) or 'scroll' (always on)
// - Fully customizable: flakeColor, fallSpeed, flakeSize, flakesPerSecond, activationMode, accumulateAtBottom, flakeShape
// - Snowflake container always matches image size
// - Performance and smoothness prioritized
//
// @framerSupportedLayoutWidth any-prefer-fixed
// @framerSupportedLayoutHeight any-prefer-fixed

import {
    useRef,
    useState,
    useEffect,
    useCallback,
    startTransition,
    useMemo,
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


const defaultImage = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Gradient 1 - Blue",
}

function randomBetween(a, b) {
    return a + Math.random() * (b - a)
}

/**
 * SnowflakeImage
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 */
export default function SnowflakeImage(props) {
    const {
        image = defaultImage,
        borderRadius = "8px",
        flakeColor = "#fff",
        flakeSize = 16,
        fallSpeed = 1,
        flakesPerSecond = 6,
        activationMode = "hover",
        accumulateAtBottom = true,
        flakeShape = "snowflake",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = useState(false)
    const containerRef = useRef(null)
    const [containerRect, setContainerRect] = useState({ width: 1, height: 1 })
    const [touched, setTouched] = useState(false)

    // Snowflake state
    const [snowflakes, setSnowflakes] = useState([])
    const [pile, setPile] = useState([]) // [{x, y, size}]
    const snowflakeId = useRef(0)
    const [animationActive, setAnimationActive] = useState(false)

    // Activation logic
    const showSnow = useMemo(() => {
        if (activationMode === "scroll") return true
        if (activationMode === "hover") return hovered || touched
        return false
    }, [activationMode, hovered, touched])

    // On trigger, start/stop animation
    useEffect(() => {
        if (!showSnow) {
            setSnowflakes([])
            setAnimationActive(false)
            // Do NOT clear pile: accumulated snow persists
            return
        }
        setAnimationActive(true)
    }, [showSnow])

    // Pile grid for stacking (simple 1D array for bottom row, per X slot)
    const pileGridSlots = 40
    const pileGrid = useRef(Array(pileGridSlots).fill(0)) // heights in px
    // Store landed flakes for persistent rendering
    const [landedFlakes, setLandedFlakes] = useState([])
    // Max pile height: 30% of image height
    const maxPileHeight = useMemo(() => containerRect.height * 0.3, [containerRect.height])

    // Snowflake spawner and animation
    useEffect(() => {
        if (!animationActive || isStatic) return
        let running = true
        let lastTime = performance.now()
        let spawnAccum = 0
        function spawnFlake() {
            snowflakeId.current += 1
            const size = randomBetween(0.7, 1.3) * flakeSize
            const x = randomBetween(0, 1)
            return {
                id: snowflakeId.current,
                x, // 0-1
                y: 0, // top
                drift: randomBetween(-0.2, 0.2),
                speed: randomBetween(0.7, 1.3) * fallSpeed,
                size,
                phase: Math.random() * Math.PI * 2,
                landed: false,
            }
        }
        // Spawn at regular intervals
        let spawnInterval = 1000 / Math.max(1, flakesPerSecond)
        function animate(now) {
            if (!running) return
            const dt = Math.min(0.05, (now - lastTime) / 1000)
            lastTime = now
            spawnAccum += dt * 1000
            setSnowflakes((flakes) => {
                let updated = flakes
                    .map((f) => {
                        if (f.landed) return f
                        let y = f.y + f.speed * dt
                        let x = f.x + Math.sin(f.phase + y * 6) * 0.003 + f.drift * dt * 0.05
                        // Collision/pile check
                        let px = Math.floor(x * pileGridSlots)
                        px = Math.max(0, Math.min(pileGridSlots - 1, px))
                        let pileHeight = accumulateAtBottom ? pileGrid.current[px] : 0
                        // Clamp pileHeight to maxPileHeight
                        pileHeight = Math.min(pileHeight, maxPileHeight)
                        let maxY = 1 - (pileHeight + f.size / 2) / (containerRect.height || 1)
                        // If pile is at max, flake should not add to pile
                        const pileFull = accumulateAtBottom && pileGrid.current[px] >= maxPileHeight - 1
                        if (accumulateAtBottom && y * (containerRect.height || 1) + f.size / 2 >= (containerRect.height - pileHeight)) {
                            if (pileFull) {
                                // Slide off or disappear: let it fall past bottom, mark as not landed
                                y = 1.05 // let it fall out
                                f.landed = false
                                f.slideOff = true
                            } else {
                                // Landed
                                y = maxY
                                f.landed = true
                                f.slideOff = false
                            }
                        }
                        return { ...f, x, y }
                    })
                // Remove flakes that are out of bounds (bottom + a bit)
                const landed = updated.filter(f => f.landed && !f._addedToPile)
                // Add new flakes
                let toSpawn = 0
                while (updated.filter(f => !f.landed).length + toSpawn < pileGridSlots && spawnAccum >= spawnInterval) {
                    toSpawn++
                    spawnAccum -= spawnInterval
                }
                for (let i = 0; i < toSpawn; i++) {
                    updated.push(spawnFlake())
                }
                // Update pile grid and landed flakes
                if (accumulateAtBottom && landed.length) {
                    landed.forEach((f) => {
                        let px = Math.floor(f.x * pileGridSlots)
                        px = Math.max(0, Math.min(pileGridSlots - 1, px))
                        // Only add to pile if not full
                        if (pileGrid.current[px] < maxPileHeight - 1) {
                            pileGrid.current[px] = Math.min(pileGrid.current[px] + f.size * 0.7, maxPileHeight)
                            f._addedToPile = true
                        }
                    })
                    setLandedFlakes(prev => [
                        ...prev,
                        ...landed.filter(f => !f.slideOff && f._addedToPile).map(f => ({
                            x: f.x,
                            y: 1 - (pileGrid.current[Math.floor(f.x * pileGridSlots)] + f.size / 2) / (containerRect.height || 1),
                            size: f.size,
                            color: flakeColor,
                            shape: flakeShape,
                        }))
                    ])
                }
                return updated
            })
            // Update pile state for rendering
            if (accumulateAtBottom) {
                setPile([...pileGrid.current])
            }
            if (running) {
                requestAnimationFrame(animate)
            }
        }
        requestAnimationFrame(animate)
        return () => {
            running = false
        }
    }, [animationActive, isStatic, accumulateAtBottom, flakesPerSecond, fallSpeed, flakeSize, containerRect.height, flakeColor, flakeShape])

    // Accessibility: alt text
    const alt = image.alt || "Image"

    // Pile rendering: draw as a soft white curve at the bottom
    function renderPile() {
        if (!accumulateAtBottom || !pile.length || !containerRect.width) return null
        // Clamp pile heights to maxPileHeight
        const clampedPile = pile.map(h => Math.min(h, maxPileHeight))
        const points = clampedPile.map((h, i) => {
            const x = (i / (clampedPile.length - 1)) * containerRect.width
            const y = containerRect.height - h
            return `${x},${y}`
        })
        // Close the path at the bottom corners
        const path = [
            `M0,${containerRect.height}`,
            `L${points.join(" ")}`,
            `L${containerRect.width},${containerRect.height}`,
            "Z",
        ].join(" ")
        return (
            <path d={path} fill={flakeColor} opacity={0.7} />
        )
    }

    // Render landed flakes (persist)
    function renderLandedFlakes() {
        if (!accumulateAtBottom || !landedFlakes.length) return null
        return landedFlakes.map((f, i) => {
            const x = f.x * containerRect.width
            const y = f.y * containerRect.height
            const size = f.size
            if (f.shape === "circle") {
                return (
                    <circle key={"landed-"+i} cx={x} cy={y} r={size/2} fill={f.color} opacity={0.85} />
                )
            }
            // default: snowflake
            return (
                <g key={"landed-"+i} style={{opacity:0.85}}>
                    <SnowflakeSVG x={x} y={y} size={size} color={f.color} />
                </g>
            )
        })
    }

    // Track container size
    useEffect(() => {
        function updateRect() {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            setContainerRect({ width: rect.width, height: rect.height })
        }
        updateRect()
        window.addEventListener("resize", updateRect)
        return () => window.removeEventListener("resize", updateRect)
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                cursor: activationMode === "hover" ? "pointer" : "default",
                userSelect: "none",
                background: "#eee",
                transition: "box-shadow 0.2s",
                boxShadow: hovered ? "0 4px 24px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.04)",
                touchAction: "manipulation",
            }}
            onMouseEnter={() => activationMode === "hover" && startTransition(() => setHovered(true))}
            onMouseLeave={() => activationMode === "hover" && startTransition(() => setHovered(false))}
            onTouchStart={() => activationMode === "hover" && startTransition(() => setTouched(true))}
            onTouchEnd={() => activationMode === "hover" && startTransition(() => setTouched(false))}
            tabIndex={0}
            aria-label={alt}
        >
            {/* Main image */}
            <img
                src={image.src}
                alt={alt}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius,
                    display: "block",
                    pointerEvents: "none",
                    userSelect: "none",
                }}
                draggable={false}
            />
            {/* Snowflakes and pile */}
            {showSnow && !isStatic && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 10,
                        overflow: "hidden",
                    }}
                >
                    <svg
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                        }}
                        width={containerRect.width}
                        height={containerRect.height}
                        aria-hidden="true"
                    >
                        {/* Pile at bottom */}
                        {renderPile()}
                        {/* Landed flakes (persist) */}
                        {renderLandedFlakes()}
                        {/* Snowflakes (falling) */}
                        {snowflakes.map((f) => {
                            if (f.landed) return null
                            const x = f.x * containerRect.width
                            const y = f.y * containerRect.height
                            const size = f.size
                            if (y > containerRect.height + size) return null
                            if (flakeShape === "circle") {
                                return (
                                    <circle key={f.id} cx={x} cy={y} r={size/2} fill={flakeColor} opacity={0.85} />
                                )
                            }
                            return (
                                <g
                                    key={f.id}
                                    style={{
                                        opacity: 0.85,
                                        transition: `opacity 0.2s`,
                                    }}
                                >
                                    <SnowflakeSVG
                                        x={x}
                                        y={y}
                                        size={size}
                                        color={flakeColor}
                                    />
                                </g>
                            )
                        })}
                    </svg>
                </div>
            )}
        </div>
    )
}

function SnowflakeSVG({ x, y, size, color }) {
    // Simple 6-arm snowflake
    return (
        <g transform={`translate(${x},${y}) scale(${size / 16})`}>
            <circle cx={0} cy={0} r={3.5} fill={color} opacity={0.7} />
            {[...Array(6)].map((_, i) => {
                const angle = (i * Math.PI) / 3
                return (
                    <g key={i} transform={`rotate(${(angle * 180) / Math.PI})`}>
                        <rect x={-0.7} y={-7} width={1.4} height={7} rx={0.7} fill={color} />
                    </g>
                )
            })}
        </g>
    )
}

addPropertyControls(SnowflakeImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "8px",
    },
    flakeColor: {
        type: ControlType.Color,
        title: "Flake Color",
        defaultValue: "#fff",
    },
    flakeSize: {
        type: ControlType.Number,
        title: "Flake Size",
        defaultValue: 16,
        min: 6,
        max: 48,
        unit: "px",
    },
    fallSpeed: {
        type: ControlType.Number,
        title: "Fall Speed",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.05,
    },
    flakesPerSecond: {
        type: ControlType.Number,
        title: "Flakes/sec",
        defaultValue: 6,
        min: 1,
        max: 30,
        step: 1,
    },
    activationMode: {
        type: ControlType.Enum,
        title: "Activation",
        options: ["hover", "scroll"],
        optionTitles: ["On Hover", "On Scroll"],
        defaultValue: "hover",
    },
    accumulateAtBottom: {
        type: ControlType.Boolean,
        title: "Accumulate",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    flakeShape: {
        type: ControlType.Enum,
        title: "Flake Shape",
        options: ["snowflake", "circle"],
        optionTitles: ["Snowflake", "Circle"],
        defaultValue: "snowflake",
    },
})
