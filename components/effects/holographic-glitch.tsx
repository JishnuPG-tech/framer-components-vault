import { useEffect, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

/**
 * Analog TV Glitch Effect that follows cursor position
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScanlineGlitch(props) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Glitch Image",
        },
        scanlineOpacity = 0.7,
        scanlineSpeed = 1,
        scanlineColor = "#000000",
        scanlineBlendMode = "normal",
        scanlineThickness = 4,
        noiseOpacity = 0.1,
        glitchColor1 = "#FF0000",
        glitchColor2 = "#00FFFF",
        glitchIntensity = 10,
        glitchSpeed = 0.5,
        glitchEasing = "easeInOut",
        followCursor = true,
        borderRadius = 0,
        distortionType = "offset",
        waveFrequency = 5,
        waveAmplitude = 10,
        pixelationAmount = 8,
        rippleStrength = 20,
        glitchBlendMode1 = "multiply",
        glitchBlendMode2 = "screen",
        style,
    } = props

    const containerRef = useRef(null)
    const isStatic = useIsStaticRenderer()
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    useEffect(() => {
        if (isStatic || !followCursor || !containerRef.current) return

        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                startTransition(() => {
                    setDimensions({ width: rect.width, height: rect.height })
                })
            }
        }

        updateDimensions()
        window.addEventListener("resize", updateDimensions)

        return () => {
            window.removeEventListener("resize", updateDimensions)
        }
    }, [isStatic, followCursor])

    const handleMouseMove = (e) => {
        if (!followCursor || isStatic) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        startTransition(() => {
            setMousePosition({ x, y })
        })
    }

    // Calculate glitch offsets based on mouse position
    const calculateOffset = (axis, multiplier = 1) => {
        if (!followCursor) return 0

        const maxOffset = glitchIntensity * multiplier
        const position = axis === "x" ? mousePosition.x : mousePosition.y
        const size = axis === "x" ? dimensions.width : dimensions.height

        if (size === 0) return 0

        // Normalize position to -1 to 1 range
        const normalizedPos = (position / size) * 2 - 1
        return normalizedPos * maxOffset
    }

    // For static rendering, show a simpler version
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: `${borderRadius}px`,
                    ...style,
                }}
            >
                <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        )
    }

    // Create keyframes for scanline animation
    const scanlineKeyframes = `
        @keyframes scanlines {
            0% { background-position: 0 0; }
            100% { background-position: 0 100%; }
        }
    `

    // Create keyframes for noise animation
    const noiseKeyframes = `
        @keyframes noise {
            0%, 100% { transform: translateX(0) translateY(0); }
            10% { transform: translateX(-1%) translateY(1%); }
            20% { transform: translateX(1%) translateY(-1%); }
            30% { transform: translateX(-2%) translateY(-1%); }
            40% { transform: translateX(2%) translateY(1%); }
            50% { transform: translateX(-1%) translateY(2%); }
            60% { transform: translateX(1%) translateY(-2%); }
            70% { transform: translateX(3%) translateY(1%); }
            80% { transform: translateX(-3%) translateY(-1%); }
            90% { transform: translateX(2%) translateY(3%); }
        }
    `

    // Function to get distortion filter based on selected type
    const getDistortionFilter = () => {
        switch (distortionType) {
            case "wave":
                return `url(#waveFilter)`
            case "ripple":
                return `url(#rippleFilter)`
            case "pixelate":
                return "none" // Pixelation is handled with CSS
            case "offset":
            default:
                return "none"
        }
    }

    // Function to get pixelation style if that distortion is selected
    const getPixelationStyle = () => {
        if (distortionType !== "pixelate") return {}

        return {
            filter: `blur(0.5px)`,
            transform: `scale(1)`,
            imageRendering: "pixelated",
        }
    }

    // Generate a unique ID for the filters to avoid conflicts
    const filterId = useRef(
        `filter-${Math.random().toString(36).substr(2, 9)}`
    ).current
    const waveFilterId = `${filterId}-wave`
    const rippleFilterId = `${filterId}-ripple`

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                cursor: followCursor ? "crosshair" : "default",
                borderRadius: `${borderRadius}px`,
                ...style,
            }}
            onMouseMove={handleMouseMove}
        >
            <style>{scanlineKeyframes + noiseKeyframes}</style>

            {/* SVG Filters for Distortion Effects */}
            <svg style={{ position: "absolute", width: 0, height: 0 }}>
                <defs>
                    {/* Chromatic Aberration Filters */}
                    <filter id="redFilter">
                        <feColorMatrix
                            type="matrix"
                            values="1 0 0 0 0
                                    0 0 0 0 0
                                    0 0 0 0 0
                                    0 0 0 1 0"
                        />
                    </filter>
                    <filter id="blueFilter">
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0
                                    0 0 0 0 0
                                    0 0 1 0 0
                                    0 0 0 1 0"
                        />
                    </filter>

                    {/* Wave Distortion Filter */}
                    <filter id={waveFilterId}>
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency={`${waveFrequency * 0.01} 0.01`}
                            numOctaves="1"
                            result="turbulence"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="turbulence"
                            scale={waveAmplitude}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>

                    {/* Ripple Distortion Filter */}
                    <filter id={rippleFilterId}>
                        <feTurbulence
                            type="turbulence"
                            baseFrequency="0.05"
                            numOctaves="2"
                            result="turbulence"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="turbulence"
                            scale={rippleStrength}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>

            {/* Base Image */}
            <img
                src={image.src}
                alt={image.alt}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 1,
                    filter:
                        distortionType === "pixelate"
                            ? `blur(0px)`
                            : getDistortionFilter(),
                    borderRadius: `${borderRadius}px`,
                    ...(distortionType === "pixelate"
                        ? {
                              imageRendering: "pixelated",
                              transform: `scale(${1 / pixelationAmount})`,
                              transformOrigin: "0 0",
                              width: `${pixelationAmount * 100}%`,
                              height: `${pixelationAmount * 100}%`,
                          }
                        : {}),
                }}
            />

            {/* Glitch Layer 1 */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    zIndex: 2,
                    mixBlendMode: glitchBlendMode1,
                    opacity: 0.8,
                    filter:
                        distortionType === "pixelate"
                            ? `blur(0px)`
                            : getDistortionFilter(),
                    borderRadius: `${borderRadius}px`,
                    ...(distortionType === "pixelate"
                        ? getPixelationStyle()
                        : {}),
                }}
                animate={{
                    x: calculateOffset("x", 1.5),
                    y: calculateOffset("y", 0.5),
                }}
                transition={{
                    type: props.glitchTransition.type,
                    stiffness:
                        props.glitchTransition.type === "spring"
                            ? props.glitchTransition.stiffness
                            : undefined,
                    damping:
                        props.glitchTransition.type === "spring"
                            ? props.glitchTransition.damping
                            : undefined,
                    mass:
                        props.glitchTransition.type === "spring"
                            ? props.glitchTransition.mass
                            : undefined,
                    bounce:
                        props.glitchTransition.type === "spring"
                            ? props.glitchTransition.bounce
                            : undefined,
                    duration:
                        props.glitchTransition.type === "tween"
                            ? props.glitchTransition.duration / glitchSpeed
                            : undefined,
                    ease: props.glitchEasing,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: glitchColor1,
                        mixBlendMode: "multiply",
                        opacity: 0.7,
                    }}
                />
            </motion.div>

            {/* Blue Channel (Glitch Layer 2) */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    zIndex: 3,
                    mixBlendMode: glitchBlendMode2,
                    filter: `url(#blueFilter) ${distortionType === "pixelate" ? `blur(0px)` : getDistortionFilter()}`,
                    opacity: 0.8,
                    borderRadius: `${borderRadius}px`,
                    ...(distortionType === "pixelate"
                        ? getPixelationStyle()
                        : {}),
                }}
                animate={{
                    x: calculateOffset("x", -1),
                    y: calculateOffset("y", -1),
                }}
                transition={{
                    type: props.glitchTransition.type,
                    stiffness:
                        props.glitchTransition.type === "spring"
                            ? props.glitchTransition.stiffness
                            : undefined,
                    damping:
                        props.glitchTransition.type === "spring"
                            ? props.glitchTransition.damping
                            : undefined,
                    mass:
                        props.glitchTransition.type === "spring"
                            ? props.glitchTransition.mass
                            : undefined,
                    bounce:
                        props.glitchTransition.type === "spring"
                            ? props.glitchTransition.bounce
                            : undefined,
                    duration:
                        props.glitchTransition.type === "tween"
                            ? props.glitchTransition.duration / glitchSpeed
                            : undefined,
                    ease: props.glitchEasing,
                }}
            />

            {/* Scanlines */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `linear-gradient(transparent 50%, ${scanlineColor} 50%)`,
                    backgroundSize: `100% ${scanlineThickness}px`,
                    zIndex: 4,
                    pointerEvents: "none",
                    opacity: scanlineOpacity,
                    animation: `scanlines ${3 / scanlineSpeed}s linear infinite`,
                    mixBlendMode: scanlineBlendMode,
                    borderRadius: `${borderRadius}px`,
                }}
            />

            {/* Noise Overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                    zIndex: 5,
                    opacity: noiseOpacity,
                    mixBlendMode: "overlay",
                    pointerEvents: "none",
                    animation: `noise 1s steps(2) infinite`,
                    borderRadius: `${borderRadius}px`,
                }}
            />
        </div>
    )
}

addPropertyControls(ScanlineGlitch, {
    // Image Settings
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
    },
    followCursor: {
        type: ControlType.Boolean,
        title: "Follow Cursor",
        defaultValue: true,
    },

    // Scanline Settings
    scanlineOpacity: {
        type: ControlType.Number,
        title: "Scanline Opacity",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
    },
    scanlineColor: {
        type: ControlType.Color,
        title: "Scanline Color",
        defaultValue: "#000000",
    },
    scanlineBlendMode: {
        type: ControlType.Enum,
        title: "Scanline Blend Mode",
        defaultValue: "normal",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
        ],
    },
    scanlineSpeed: {
        type: ControlType.Number,
        title: "Scanline Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    scanlineThickness: {
        type: ControlType.Number,
        title: "Scanline Thickness",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
    },

    // Noise Settings
    noiseOpacity: {
        type: ControlType.Number,
        title: "Noise Opacity",
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
    },

    // Glitch Settings
    glitchIntensity: {
        type: ControlType.Number,
        title: "Glitch Intensity",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
    },
    glitchEasing: {
        type: ControlType.Enum,
        title: "Glitch Easing",
        defaultValue: "easeInOut",
        options: [
            "linear",
            "easeIn",
            "easeOut",
            "easeInOut",
            "circIn",
            "circOut",
            "circInOut",
            "backIn",
            "backOut",
            "backInOut",
        ],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease InOut",
            "Circular In",
            "Circular Out",
            "Circular InOut",
            "Back In",
            "Back Out",
            "Back InOut",
        ],
    },
    glitchSpeed: {
        type: ControlType.Number,
        title: "Glitch Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    glitchTransition: {
        type: ControlType.Object,
        title: "Glitch Transition",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                defaultValue: "spring",
                options: ["spring", "tween"],
                optionTitles: ["Spring", "Tween"],
            },
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                defaultValue: 100,
                min: 10,
                max: 1000,
                step: 10,
                hidden: ({ type }) => type !== "spring",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: 10,
                min: 1,
                max: 100,
                step: 1,
                hidden: ({ type }) => type !== "spring",
            },
            mass: {
                type: ControlType.Number,
                title: "Mass",
                defaultValue: 0.5,
                min: 0.1,
                max: 10,
                step: 0.1,
                hidden: ({ type }) => type !== "spring",
            },
            bounce: {
                type: ControlType.Number,
                title: "Bounce",
                defaultValue: 0.25,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ type }) => type !== "spring",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.5,
                min: 0.1,
                max: 5,
                step: 0.1,
                hidden: ({ type }) => type !== "tween",
            },
        },
        defaultValue: {
            type: "spring",
            stiffness: 100,
            damping: 10,
            mass: 0.5,
            bounce: 0.25,
            duration: 0.5,
        },
    },
    glitchColor1: {
        type: ControlType.Color,
        title: "Glitch Color 1",
        defaultValue: "#FF0000",
    },
    glitchBlendMode1: {
        type: ControlType.Enum,
        title: "Blend Mode 1",
        defaultValue: "multiply",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
        ],
    },
    glitchColor2: {
        type: ControlType.Color,
        title: "Glitch Color 2",
        defaultValue: "#00FFFF",
    },
    glitchBlendMode2: {
        type: ControlType.Enum,
        title: "Blend Mode 2",
        defaultValue: "screen",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
        ],
    },

    // Distortion Settings
    distortionType: {
        type: ControlType.Enum,
        title: "Distortion Type",
        defaultValue: "offset",
        options: ["offset", "wave", "ripple", "pixelate"],
        optionTitles: ["Offset", "Wave", "Ripple", "Pixelate"],
    },
    waveFrequency: {
        type: ControlType.Number,
        title: "Wave Frequency",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 1,
        hidden: ({ distortionType }) => distortionType !== "wave",
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Amplitude",
        defaultValue: 10,
        min: 1,
        max: 50,
        step: 1,
        hidden: ({ distortionType }) => distortionType !== "wave",
    },
    rippleStrength: {
        type: ControlType.Number,
        title: "Ripple Strength",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 1,
        hidden: ({ distortionType }) => distortionType !== "ripple",
    },
    pixelationAmount: {
        type: ControlType.Number,
        title: "Pixelation Amount",
        defaultValue: 8,
        min: 2,
        max: 32,
        step: 1,
        hidden: ({ distortionType }) => distortionType !== "pixelate",
    },
})