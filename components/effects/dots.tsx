// Dots component with full control: size, count, spacing, shape, animation, masking, and interactivity
import { useState, useMemo, useRef, useEffect, startTransition } from "react"
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
    alt: "Gradient 1 - Blue"
}

const shapes = {
    circle: (size, color, opacity) => <circle cx={size/2} cy={size/2} r={size/2} fill={color} fillOpacity={opacity} />,
    square: (size, color, opacity) => <rect width={size} height={size} fill={color} fillOpacity={opacity} rx={0} />,
}

function getDotShape(shape, size, color, opacity) {
    if (shape === "circle") return shapes.circle(size, color, opacity)
    if (shape === "square") return shapes.square(size, color, opacity)
    // fallback
    return shapes.circle(size, color, opacity)
}

function getMaskStyle(maskType, maskImage, gradient, shape) {
    if (maskType === "image" && maskImage?.src) {
        return {
            WebkitMaskImage: `url(${maskImage.src})`,
            maskImage: `url(${maskImage.src})`,
            WebkitMaskSize: "cover",
            maskSize: "cover",
        }
    }
    if (maskType === "gradient") {
        return {
            WebkitMaskImage: gradient,
            maskImage: gradient,
        }
    }
    // shape masking not implemented yet
    return {}
}

/**
 * Dots Component
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Dots(props) {
    const {
        dotSize,
        dotCountX,
        dotCountY,
        spacingX,
        spacingY,
        dotColor,
        dotOpacity,
        shape,
        maskType,
        maskImage = defaultImage,
        maskGradient,
        blendMode,
        animate,
        randomize,
        interactive,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = useState(false)
    const [mouse, setMouse] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)

    // Responsive dot count
    const [counts, setCounts] = useState({ x: dotCountX, y: dotCountY })
    useEffect(() => {
        if (!props.responsive) return
        function updateCounts() {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const x = Math.max(1, Math.floor(rect.width / (dotSize + spacingX)))
            const y = Math.max(1, Math.floor(rect.height / (dotSize + spacingY)))
            startTransition(() => setCounts({ x, y }))
        }
        updateCounts()
        window.addEventListener("resize", updateCounts)
        return () => window.removeEventListener("resize", updateCounts)
    }, [props.responsive, dotSize, spacingX, spacingY])

    const countX = props.responsive ? counts.x : dotCountX
    const countY = props.responsive ? counts.y : dotCountY

    // Generate dot positions
    const dots = useMemo(() => {
        let arr = []
        for (let y = 0; y < countY; y++) {
            for (let x = 0; x < countX; x++) {
                let dx = x * (dotSize + spacingX)
                let dy = y * (dotSize + spacingY)
                if (randomize) {
                    dx += (Math.random() - 0.5) * spacingX
                    dy += (Math.random() - 0.5) * spacingY
                }
                arr.push({ x: dx, y: dy, key: `${x}-${y}` })
            }
        }
        return arr
    }, [countX, countY, dotSize, spacingX, spacingY, randomize])

    // Looping staggered opacity animation with controls
    const [dotOpacities, setDotOpacities] = useState([])
    useEffect(() => {
        if (!props.animEnabled) {
            setDotOpacities(Array(dots.length).fill(props.animOpacityMax))
            return
        }
        let running = true
        function animateLoop() {
            if (!running) return
            setDotOpacities(Array(dots.length).fill(props.animOpacityMin))
            let timeouts = []
            const durationMs = (props.animDuration || 0) * 1000
            const loopDelayMs = (props.animLoopDelay || 0) * 1000
            dots.forEach((_, i) => {
                const baseDelay = props.animRandomize ? Math.random() * durationMs : (i * durationMs) / dots.length
                timeouts.push(
                    setTimeout(() => {
                        startTransition(() => {
                            setDotOpacities(prev => {
                                const arr = prev.slice()
                                arr[i] = props.animOpacityMax
                                return arr
                            })
                        })
                    }, baseDelay)
                )
            })
            // After all dots are visible, reset and loop
            const totalDelay = durationMs + loopDelayMs
            timeouts.push(
                setTimeout(() => {
                    if (running) animateLoop()
                }, totalDelay)
            )
            return () => timeouts.forEach(clearTimeout)
        }
        const cleanup = animateLoop()
        return () => {
            running = false
            if (cleanup) cleanup()
        }
    }, [dots.length, props.animEnabled, props.animDuration, props.animLoopDelay, props.animRandomize, props.animOpacityMin, props.animOpacityMax])

    function handleMouseMove(e) {
        if (!interactive || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setMouse({ x, y })
    }

    // Masking style
    const maskStyle = getMaskStyle(maskType, maskImage, maskGradient, shape)

    // Container size
    const width = countX * dotSize + (countX - 1) * spacingX
    const height = countY * dotSize + (countY - 1) * spacingY

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                display: "block",
                background: "transparent",
                ...maskStyle,
                mixBlendMode: blendMode,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="Dots background"
        >
            <svg
                width={width}
                height={height}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            >
                {dots.map((dot, i) => {
                    let opacity = dotOpacities[i] ?? 0
                    let color = dotColor
                    let tx = dot.x
                    let ty = dot.y
                    let size = dotSize
                    return (
                        <g key={dot.key} transform={`translate(${tx},${ty})`}>
                            {getDotShape(shape, size, color, opacity)}
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

addPropertyControls(Dots, {
    animEnabled: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animLoopDelay: {
        type: ControlType.Number,
        title: "Loop Delay (s)",
        defaultValue: 0.6,
        min: 0,
        max: 30,
        step: 0.1,
        unit: "s",
        hidden: ({ animEnabled }) => !animEnabled,
    },
    animDuration: {
        type: ControlType.Number,
        title: "Duration (s)",
        defaultValue: 2,
        min: 0.1,
        max: 30,
        step: 0.1,
        unit: "s",
        hidden: ({ animEnabled }) => !animEnabled,
    },
    animRandomize: {
        type: ControlType.Boolean,
        title: "Randomize",
        defaultValue: true,
        enabledTitle: "Random",
        disabledTitle: "Staggered",
        hidden: ({ animEnabled }) => !animEnabled,
    },
    animOpacityMin: {
        type: ControlType.Number,
        title: "Opacity Min",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ animEnabled }) => !animEnabled,
    },
    animOpacityMax: {
        type: ControlType.Number,
        title: "Opacity Max",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ animEnabled }) => !animEnabled,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 16,
        min: 1,
        max: 64,
        step: 1,
        unit: "px",
    },
    dotCountX: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 12,
        min: 1,
        max: 100,
        step: 1,
    },
    dotCountY: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 8,
        min: 1,
        max: 100,
        step: 1,
    },
    spacingX: {
        type: ControlType.Number,
        title: "Spacing X",
        defaultValue: 12,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    spacingY: {
        type: ControlType.Number,
        title: "Spacing Y",
        defaultValue: 12,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#111111",
    },
    dotOpacity: {
        type: ControlType.Number,
        title: "Dot Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "square"],
        optionTitles: ["Circle", "Square"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    maskType: {
        type: ControlType.Enum,
        title: "Mask",
        options: ["none", "image", "gradient"],
        optionTitles: ["None", "Image", "Gradient"],
        defaultValue: "none",
    },
    maskImage: {
        type: ControlType.ResponsiveImage,
        title: "Mask Image",
        hidden: ({ maskType }) => maskType !== "image",
    },
    maskGradient: {
        type: ControlType.String,
        title: "Mask Gradient",
        defaultValue: "linear-gradient(90deg, #fff 0%, #000 100%)",
        hidden: ({ maskType }) => maskType !== "gradient",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"],
        optionTitles: ["Normal", "Multiply", "Screen", "Overlay", "Darken", "Lighten", "Dodge", "Burn", "Hard Light", "Soft Light", "Difference", "Exclusion"],
        defaultValue: "normal",
    },

})
