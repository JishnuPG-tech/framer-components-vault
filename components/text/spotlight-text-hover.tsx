// Spotlight Text Hover Effect with fully native Framer font controls and responsive text
import {
    useRef,
    useState,
    useEffect,
    useCallback,
    useMemo,
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


// Predefined gradient presets for the spotlight effect
const gradientPresets = {
    rainbow:
        "linear-gradient(90deg, #ff0080, #7928ca, #007cf0, #00dfd8, #ff8c00, #ff0080)",
    sunset: "linear-gradient(90deg, #ff5858, #f09819, #ff5858)",
    cyberpunk: "linear-gradient(90deg, #00ffe7, #ff00ea, #fffb00)",
    neon: "radial-gradient(circle, #fff 0%, #0ff 60%, #00f 100%)",
}

/**
 * Converts a custom gradient object to a CSS gradient string
 * @param {Object} gradient - Gradient object with type, angle, and stops
 * @returns {string} CSS gradient string or empty string if invalid
 */
function customGradientToCSS(gradient) {
    if (!gradient || !gradient.stops || gradient.stops.length < 2) {
        return ""
    }

    const stops = gradient.stops
        .map((stop) => `${stop.color} ${stop.position}%`)
        .join(", ")

    if (gradient.type === "linear") {
        return `linear-gradient(${gradient.angle || 90}deg, ${stops})`
    } else if (gradient.type === "radial") {
        return `radial-gradient(circle, ${stops})`
    }

    return ""
}

/**
 * SpotlightText Component
 * A customizable text component with a dynamic spotlight effect on hover/touch
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 60
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @param {Object} props - Component properties
 */
export default function SpotlightText({
    text = "Spotlight Hover",
    font = {
        fontSize: "40px",
        variant: "Bold",
        letterSpacing: "-0.04em",
        lineHeight: "1em",
    },
    textColor = "#E0E0E0",
    spotlightType = "gradient",
    spotlightColor = "#fff200",
    spotlightGradient = "rainbow",
    spotlightImage,
    spotlightSize = 120,
    spotlightShape = "circle",
    blendMode = "screen",
    transitionSpeed = 18,
    style = {},
    showOriginalText = false,
    parallaxOn = true,
    customGradient,
    useCustomGradient = false,
    ...framerNativeProps
}) {
    // References and state
    const containerRef = useRef(null) // Reference to the container element
    const [isHovered, setIsHovered] = useState(false) // Tracks hover state
    const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 }) // Mouse/touch position (normalized)
    const [spotPosition, setSpotPosition] = useState({ x: 0.5, y: 0.5 }) // Spotlight position with lag effect
    const [isTouchActive, setIsTouchActive] = useState(false) // Tracks touch interaction
    const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 }) // Parallax effect offset
    const isStatic = useIsStaticRenderer() // Checks if running in static rendering mode

    /**
     * Animates the spotlight position with a smooth lag effect
     * Runs only when the component is hovered or touched
     */
    useEffect(() => {
        if (!isHovered && !isTouchActive) return

        let raf
        function animate() {
            setSpotPosition((prev) => {
                const dx = mousePosition.x - prev.x
                const dy = mousePosition.y - prev.y
                const speed = transitionSpeed / 100 // Normalize speed (1-40 to 0.01-0.4)
                return {
                    x: prev.x + dx * speed,
                    y: prev.y + dy * speed,
                }
            })
            raf = requestAnimationFrame(animate)
        }

        raf = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(raf) // Cleanup animation frame
    }, [isHovered, isTouchActive, mousePosition, transitionSpeed])

    /**
     * Handles mouse and touch movement, updating normalized position and parallax offset
     * @param {Object} event - Mouse or touch event
     */
    const handleMove = useCallback(
        (event) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            let x, y

            // Calculate normalized position (0 to 1) based on event type
            if (event.touches && event.touches.length > 0) {
                x = (event.touches[0].clientX - rect.left) / rect.width
                y = (event.touches[0].clientY - rect.top) / rect.height
            } else {
                x = (event.clientX - rect.left) / rect.width
                y = (event.clientY - rect.top) / rect.height
            }

            // Clamp position to [0, 1]
            x = Math.max(0, Math.min(1, x))
            y = Math.max(0, Math.min(1, y))

            // Update mouse position
            startTransition(() => setMousePosition({ x, y }))

            // Apply parallax effect if enabled (max offset: 20px)
            if (parallaxOn) {
                const px = (x - 0.5) * 40 // Scale to ±20px
                const py = (y - 0.5) * 40
                startTransition(() => setParallaxOffset({ x: px, y: py }))
            } else {
                startTransition(() => setParallaxOffset({ x: 0, y: 0 }))
            }
        },
        [parallaxOn]
    )

    /**
     * Handles touch start event
     * @param {Object} event - Touch event
     */
    const handleTouchStart = (event) => {
        setIsTouchActive(true)
        handleMove(event)
    }

    /**
     * Handles touch end event, resetting states
     */
    const handleTouchEnd = () => {
        setIsTouchActive(false)
        setIsHovered(false)
    }

    /**
     * Converts normalized spotlight position to pixel coordinates
     * @returns {Object} Pixel coordinates { x, y }
     */
    const spotPixelPosition = useMemo(() => {
        if (!containerRef.current) return { x: 0, y: 0 }
        const rect = containerRef.current.getBoundingClientRect()
        return {
            x: spotPosition.x * rect.width,
            y: spotPosition.y * rect.height,
        }
    }, [spotPosition])

    /**
     * Determines the background style for the spotlight effect based on type
     * @returns {string} CSS background style
     */
    const spotlightBackground = useMemo(() => {
        if (spotlightType === "gradient") {
            if (useCustomGradient && customGradient) {
                return customGradientToCSS(customGradient)
            }
            return gradientPresets[spotlightGradient] || spotlightGradient
        }
        if (spotlightType === "image" && spotlightImage?.src) {
            return `url(${spotlightImage.src}) center/cover`
        }
        return "none" // Default for color type
    }, [
        spotlightType,
        spotlightGradient,
        spotlightImage,
        customGradient,
        useCustomGradient,
    ])

    /**
     * Generates the mask style for the spotlight shape
     * @returns {string} CSS mask style
     */
    const textMaskStyle = useMemo(() => {
        const size = spotlightSize
        const { x: px, y: py } = spotPixelPosition
        if (spotlightShape === "ellipse") {
            return `radial-gradient(ellipse ${size * 1.2}px ${size}px at ${px}px ${py}px, #fff 60%, transparent 100%)`
        }
        return `radial-gradient(circle ${size}px at ${px}px ${py}px, #fff 60%, transparent 100%)`
    }, [spotPixelPosition, spotlightSize, spotlightShape])

    // Static rendering fallback for non-interactive environments
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                }}
                {...framerNativeProps}
            >
                <span
                    style={{
                        ...font,
                        color: textColor,
                        userSelect: "none",
                        whiteSpace: "pre-line",
                        width: "100%",
                        display: "block",
                    }}
                >
                    {text}
                </span>
            </div>
        )
    }

    // Main render with interactive spotlight effect
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                overflow: "hidden",
                cursor: "pointer",
                padding: parallaxOn ? 32 : 0, // Add padding for parallax to prevent clipping
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                setIsTouchActive(false)
            }}
            onMouseMove={handleMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleMove}
            onTouchEnd={handleTouchEnd}
            tabIndex={0}
            {...framerNativeProps}
        >
            {/* Original text layer (visible when showOriginalText is true and spotlight is active) */}
            {showOriginalText && (isHovered || isTouchActive) && (
                <span
                    style={{
                        ...font,
                        userSelect: "none",
                        whiteSpace: "pre-line",
                        width: "100%",
                        display: "block",
                        position: "absolute",
                        zIndex: 2,
                        color: textColor,
                        left: 0,
                        top: 0,
                        pointerEvents: "none",
                        opacity: 0.7,
                        transform: parallaxOn
                            ? `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`
                            : undefined,
                        padding: parallaxOn ? 32 : 0, // Match container padding
                    }}
                    aria-hidden="true"
                >
                    {text}
                </span>
            )}

            {/* Spotlight effect text layer */}
            <span
                style={{
                    ...font,
                    userSelect: "none",
                    whiteSpace: "pre-line",
                    width: "100%",
                    display: "block",
                    position: "relative",
                    zIndex: 3,
                    color:
                        isHovered || isTouchActive
                            ? spotlightType === "color"
                                ? spotlightColor
                                : "transparent"
                            : textColor,
                    background:
                        isHovered || isTouchActive
                            ? spotlightType === "color"
                                ? "none"
                                : spotlightBackground
                            : "none",
                    WebkitBackgroundClip:
                        isHovered ||
                        (isTouchActive && spotlightType !== "color")
                            ? "text"
                            : undefined,
                    backgroundClip:
                        isHovered ||
                        (isTouchActive && spotlightType !== "color")
                            ? "text"
                            : undefined,
                    WebkitTextFillColor:
                        isHovered || isTouchActive
                            ? spotlightType === "color"
                                ? spotlightColor
                                : "transparent"
                            : textColor,
                    maskImage:
                        isHovered || isTouchActive ? textMaskStyle : "none",
                    WebkitMaskImage:
                        isHovered || isTouchActive ? textMaskStyle : "none",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    mixBlendMode: blendMode,
                    transition: "all 0.3s ease",
                    transform: parallaxOn
                        ? `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`
                        : undefined,
                }}
            >
                {text}
            </span>
        </div>
    )
}

// Property controls for Framer
addPropertyControls(SpotlightText, {
    // Text Properties
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Spotlight Hover",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#E0E0E0",
    },
    showOriginalText: {
        type: ControlType.Boolean,
        title: "Show Default Text",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    parallaxOn: {
        type: ControlType.Boolean,
        title: "Parallax",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // Spotlight Properties
    spotlightType: {
        type: ControlType.Enum,
        title: "Spotlight Type",
        options: ["color", "gradient", "image"],
        optionTitles: ["Color", "Gradient", "Image"],
        defaultValue: "gradient",
    },
    spotlightColor: {
        type: ControlType.Color,
        title: "Spotlight Color",
        defaultValue: "#fff200",
        hidden: ({ spotlightType }) => spotlightType !== "color",
    },
    useCustomGradient: {
        type: ControlType.Boolean,
        title: "Custom Gradient",
        defaultValue: false,
        hidden: ({ spotlightType }) => spotlightType !== "gradient",
    },
    spotlightGradient: {
        type: ControlType.Enum,
        title: "Spotlight Gradient",
        options: Object.keys(gradientPresets),
        optionTitles: ["Rainbow", "Sunset", "Cyberpunk", "Neon"],
        defaultValue: "rainbow",
        hidden: ({ spotlightType, useCustomGradient }) =>
            spotlightType !== "gradient" || useCustomGradient,
    },
    customGradient: {
        type: ControlType.Object,
        title: "Gradient",
        controls: {
            type: {
                type: ControlType.Enum,
                options: ["linear", "radial"],
                optionTitles: ["Linear", "Radial"],
                defaultValue: "linear",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 90,
                min: 0,
                max: 360,
                step: 1,
                hidden: (g) => g.type !== "linear",
            },
            stops: {
                type: ControlType.Array,
                title: "Stops",
                control: {
                    type: ControlType.Object,
                    controls: {
                        color: {
                            type: ControlType.Color,
                            defaultValue: "#44CCFF",
                        },
                        position: {
                            type: ControlType.Number,
                            defaultValue: 0,
                            min: 0,
                            max: 100,
                            unit: "%",
                        },
                    },
                },
                defaultValue: [
                    { color: "#44CCFF", position: 0 },
                    { color: "#007CF0", position: 100 },
                ],
                maxCount: 5,
            },
        },
        defaultValue: {
            type: "linear",
            angle: 90,
            stops: [
                { color: "#44CCFF", position: 0 },
                { color: "#007CF0", position: 100 },
            ],
        },
        hidden: ({ spotlightType, useCustomGradient }) =>
            spotlightType !== "gradient" || !useCustomGradient,
    },
    spotlightImage: {
        type: ControlType.ResponsiveImage,
        title: "Spotlight Image",
        hidden: ({ spotlightType }) => spotlightType !== "image",
    },
    spotlightVideo: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov"],
        title: "Spotlight Video",
        hidden: ({ spotlightType }) => spotlightType !== "video",
    },
    spotlightSize: {
        type: ControlType.Number,
        title: "Spotlight Size",
        defaultValue: 120,
        min: 40,
        max: 400,
        step: 1,
        unit: "px",
    },
    spotlightShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "ellipse"],
        optionTitles: ["Circle", "Ellipse"],
        defaultValue: "circle",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: [
            "normal",
            "screen",
            "multiply",
            "overlay",
            "lighten",
            "darken",
        ],
        optionTitles: [
            "Normal",
            "Screen",
            "Multiply",
            "Overlay",
            "Lighten",
            "Darken",
        ],
        defaultValue: "screen",
    },
    transitionSpeed: {
        type: ControlType.Number,
        title: "Follow Speed",
        defaultValue: 18,
        min: 1,
        max: 40,
        step: 1,
    },
})
