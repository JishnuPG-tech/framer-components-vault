// Interactive dots component that appear in proximity to cursor
// Clean design with subtle gray dots on customizable background
// Background grid layer always visible, dots become more visible on hover

import {
    useState,
    useEffect,
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


interface GridProps {
    backgroundColor: string
    dotColor: string
    dotSize: number
    spacing: number
    proximityRadius: number
    maxOpacity: number
    backgroundOpacity: number
    gridType: "dots-lines" | "lines" | "dots" | "plus" | "plus-lines"
    fadeDelay: number
    thickness: number
    hoverDarken: number
    showBackground: boolean
    style?: CSSProperties
}

/**
 * Interactive Dots
 *
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function Grid(props: GridProps) {
    const {
        backgroundColor = "#E8F5A8",
        dotColor = "#9CA3AF",
        dotSize = 4,
        spacing = 60,
        proximityRadius = 150,
        maxOpacity = 1,
        backgroundOpacity = 0.15,
        gridType = "dots-lines",
        fadeDelay = 0,
        thickness = 1.5,
        hoverDarken = 0.3,
        showBackground = false,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const [activeDots, setActiveDots] = useState<Set<string>>(new Set())
    const [fadingDots, setFadingDots] = useState<Map<string, number>>(new Map())
    const isStatic = useIsStaticRenderer()

    // Measure the container with a ResizeObserver so the grid fills the full
    // bounds even on the Framer canvas (where isStatic is true). contentRect
    // reports the unscaled layout size, so it stays correct when the canvas
    // is zoomed.
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const { width, height } = entry.contentRect
            startTransition(() => {
                setDimensions({ width, height })
            })
        })

        observer.observe(el)

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (isStatic) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            startTransition(() => {
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
            })
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [isStatic])

    const dots = useMemo(() => {
        const dotsArray = []
        const cols = Math.ceil(dimensions.width / spacing)
        const rows = Math.ceil(dimensions.height / spacing)

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * spacing + spacing / 2
                const y = row * spacing + spacing / 2

                dotsArray.push({ x, y, key: `${col}-${row}` })
            }
        }

        return dotsArray
    }, [dimensions.width, dimensions.height, spacing])

    const getOpacity = (dotX: number, dotY: number) => {
        if (isStatic) return backgroundOpacity

        const distance = Math.sqrt(
            Math.pow(mousePos.x - dotX, 2) + Math.pow(mousePos.y - dotY, 2)
        )

        if (distance > proximityRadius) return backgroundOpacity

        const hoverOpacity = (1 - distance / proximityRadius) * maxOpacity
        return Math.max(backgroundOpacity, hoverOpacity)
    }

    useEffect(() => {
        if (isStatic || fadeDelay === 0) return

        const newActiveDots = new Set<string>()
        dots.forEach((dot) => {
            const distance = Math.sqrt(
                Math.pow(mousePos.x - dot.x, 2) +
                    Math.pow(mousePos.y - dot.y, 2)
            )
            if (distance <= proximityRadius) {
                newActiveDots.add(dot.key)
            }
        })

        // Add newly active dots immediately and remove from fading
        setActiveDots(newActiveDots)
        setFadingDots((prev) => {
            const next = new Map(prev)
            newActiveDots.forEach((key) => next.delete(key))
            return next
        })

        // Start fading for dots that are no longer in proximity
        const dotsToFade = Array.from(activeDots).filter(
            (key) => !newActiveDots.has(key)
        )

        if (dotsToFade.length > 0) {
            const startTime = Date.now()
            startTransition(() => {
                setFadingDots((prev) => {
                    const next = new Map(prev)
                    dotsToFade.forEach((key) => {
                        if (!next.has(key)) {
                            next.set(key, startTime)
                        }
                    })
                    return next
                })
            })
        }
    }, [mousePos, dots, proximityRadius, fadeDelay, isStatic])

    // Animation loop for fading dots
    useEffect(() => {
        if (isStatic || fadeDelay === 0 || fadingDots.size === 0) return

        let animationFrame: number

        const animate = () => {
            const now = Date.now()
            let hasChanges = false

            setFadingDots((prev) => {
                const next = new Map(prev)
                prev.forEach((startTime, key) => {
                    const elapsed = now - startTime
                    if (elapsed >= fadeDelay) {
                        next.delete(key)
                        hasChanges = true
                    }
                })
                return hasChanges ? next : prev
            })

            if (fadingDots.size > 0) {
                animationFrame = requestAnimationFrame(animate)
            }
        }

        animationFrame = requestAnimationFrame(animate)

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame)
            }
        }
    }, [fadingDots.size, fadeDelay, isStatic])

    const getOpacityWithDelay = (
        dotX: number,
        dotY: number,
        dotKey: string
    ) => {
        if (isStatic) return backgroundOpacity

        const distance = Math.sqrt(
            Math.pow(mousePos.x - dotX, 2) + Math.pow(mousePos.y - dotY, 2)
        )

        // If within proximity
        if (distance <= proximityRadius) {
            const hoverOpacity = (1 - distance / proximityRadius) * maxOpacity
            return Math.max(backgroundOpacity, hoverOpacity)
        }

        // If fading
        if (fadeDelay > 0 && fadingDots.has(dotKey)) {
            const startTime = fadingDots.get(dotKey)!
            const elapsed = Date.now() - startTime
            const fadeProgress = Math.min(elapsed / fadeDelay, 1)
            const fadingOpacity = maxOpacity * (1 - fadeProgress)
            return Math.max(backgroundOpacity, fadingOpacity)
        }

        return backgroundOpacity
    }

    const getColorWithHover = (dotX: number, dotY: number, dotKey: string) => {
        const opacity =
            fadeDelay > 0
                ? getOpacityWithDelay(dotX, dotY, dotKey)
                : getOpacity(dotX, dotY)

        // If opacity is higher than background, darken the color
        if (opacity > backgroundOpacity) {
            const hoverAmount =
                (opacity - backgroundOpacity) / (maxOpacity - backgroundOpacity)
            return {
                color: dotColor,
                opacity: opacity + hoverAmount * hoverDarken,
            }
        }

        return { color: dotColor, opacity }
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                backgroundColor: showBackground
                    ? backgroundColor
                    : "transparent",
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            {/* Background grid lines */}
            {(gridType === "dots-lines" ||
                gridType === "lines" ||
                gridType === "plus-lines") && (
                <svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                >
                    {/* Vertical lines */}
                    {Array.from({
                        length: Math.ceil(dimensions.width / spacing),
                    }).map((_, i) => {
                        const x = i * spacing + spacing / 2
                        return (
                            <line
                                key={`v-${i}`}
                                x1={x}
                                y1={0}
                                x2={x}
                                y2={dimensions.height}
                                stroke={dotColor}
                                strokeWidth={1}
                                opacity={backgroundOpacity}
                            />
                        )
                    })}
                    {/* Horizontal lines */}
                    {Array.from({
                        length: Math.ceil(dimensions.height / spacing),
                    }).map((_, i) => {
                        const y = i * spacing + spacing / 2
                        return (
                            <line
                                key={`h-${i}`}
                                x1={0}
                                y1={y}
                                x2={dimensions.width}
                                y2={y}
                                stroke={dotColor}
                                strokeWidth={1}
                                opacity={backgroundOpacity}
                            />
                        )
                    })}
                </svg>
            )}

            {/* Interactive dots or lines on hover */}
            {gridType === "dots-lines" || gridType === "dots" ? (
                dots.map((dot) => {
                    const opacity =
                        fadeDelay > 0
                            ? getOpacityWithDelay(dot.x, dot.y, dot.key)
                            : getOpacity(dot.x, dot.y)
                    return (
                        <div
                            key={dot.key}
                            style={{
                                position: "absolute",
                                left: dot.x,
                                top: dot.y,
                                width: dotSize,
                                height: dotSize,
                                borderRadius: "50%",
                                backgroundColor: dotColor,
                                opacity,
                                transform: "translate(-50%, -50%)",
                                transition: "opacity 0.2s ease-out",
                                pointerEvents: "none",
                            }}
                        />
                    )
                })
            ) : gridType === "plus" || gridType === "plus-lines" ? (
                dots.map((dot) => {
                    const { color, opacity } = getColorWithHover(
                        dot.x,
                        dot.y,
                        dot.key
                    )
                    const plusSize = dotSize * 2
                    const halfThickness = thickness / 2
                    return (
                        <svg
                            key={dot.key}
                            style={{
                                position: "absolute",
                                left: dot.x,
                                top: dot.y,
                                width: plusSize,
                                height: plusSize,
                                opacity,
                                transform: "translate(-50%, -50%)",
                                transition: "opacity 0.2s ease-out",
                                pointerEvents: "none",
                            }}
                        >
                            <path
                                d={`
                                    M ${plusSize / 2 - halfThickness} 0
                                    L ${plusSize / 2 + halfThickness} 0
                                    L ${plusSize / 2 + halfThickness} ${plusSize / 2 - halfThickness}
                                    L ${plusSize} ${plusSize / 2 - halfThickness}
                                    L ${plusSize} ${plusSize / 2 + halfThickness}
                                    L ${plusSize / 2 + halfThickness} ${plusSize / 2 + halfThickness}
                                    L ${plusSize / 2 + halfThickness} ${plusSize}
                                    L ${plusSize / 2 - halfThickness} ${plusSize}
                                    L ${plusSize / 2 - halfThickness} ${plusSize / 2 + halfThickness}
                                    L 0 ${plusSize / 2 + halfThickness}
                                    L 0 ${plusSize / 2 - halfThickness}
                                    L ${plusSize / 2 - halfThickness} ${plusSize / 2 - halfThickness}
                                    Z
                                `}
                                fill={color}
                            />
                        </svg>
                    )
                })
            ) : (
                <svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                >
                    {/* Vertical lines with hover effect */}
                    {Array.from({
                        length: Math.ceil(dimensions.width / spacing),
                    }).map((_, i) => {
                        const x = i * spacing + spacing / 2
                        const opacity = getOpacity(x, mousePos.y)
                        return (
                            <line
                                key={`v-hover-${i}`}
                                x1={x}
                                y1={0}
                                x2={x}
                                y2={dimensions.height}
                                stroke={dotColor}
                                strokeWidth={1}
                                opacity={opacity}
                                style={{ transition: "opacity 0.2s ease-out" }}
                            />
                        )
                    })}
                    {/* Horizontal lines with hover effect */}
                    {Array.from({
                        length: Math.ceil(dimensions.height / spacing),
                    }).map((_, i) => {
                        const y = i * spacing + spacing / 2
                        const opacity = getOpacity(mousePos.x, y)
                        return (
                            <line
                                key={`h-hover-${i}`}
                                x1={0}
                                y1={y}
                                x2={dimensions.width}
                                y2={y}
                                stroke={dotColor}
                                strokeWidth={1}
                                opacity={opacity}
                                style={{ transition: "opacity 0.2s ease-out" }}
                            />
                        )
                    })}
                </svg>
            )}
        </div>
    )
}

addPropertyControls(Grid, {
    gridType: {
        type: ControlType.Enum,
        title: "Grid Type",
        options: ["dots-lines", "lines", "dots", "plus", "plus-lines"],
        optionTitles: ["Dots + Lines", "Lines", "Dots", "Plus", "Plus + Lines"],
        defaultValue: "dots-lines",
    },
    showBackground: {
        type: ControlType.Boolean,
        title: "Show Background",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E8F5A8",
        hidden: ({ showBackground }) => !showBackground,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#9CA3AF",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Element Size",
        defaultValue: 4,
        min: 0.5,
        step: 0.1,
        unit: "px",
        displayStepper: true,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 60,
        min: 30,
        max: 500,
        step: 5,
        unit: "px",
        displayStepper: true,
    },
    proximityRadius: {
        type: ControlType.Number,
        title: "Proximity Radius",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
        displayStepper: true,
    },
    maxOpacity: {
        type: ControlType.Number,
        title: "Max Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.1,
        displayStepper: true,
    },
    backgroundOpacity: {
        type: ControlType.Number,
        title: "Background Opacity",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    fadeDelay: {
        type: ControlType.Number,
        title: "Fade Delay",
        defaultValue: 0,
        min: 0,
        max: 2000,
        step: 100,
        unit: "ms",
        displayStepper: true,
    },
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 1.5,
        min: 0.1,
        step: 0.1,
        unit: "px",
        displayStepper: true,
    },
    hoverDarken: {
        type: ControlType.Number,
        title: "Hover Darken",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
})
