// Made with 💛 by Karim Saif
import * as React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type PresetType =
    | "Classic"
    | "Soft"
    | "Energetic"
    | "Deep"
    | "Minimal"
    | "Pulse"
    | "Custom"
type WaveShape = "Sine" | "Soft" | "Triangle" | "Square"
type Direction = "Forward" | "Reverse"
type ColorMode = "Solid" | "Gradient"

interface MotionPresetConfig {
    barCount: number
    amplitude: number
    frequency: number
    speed: number
    waveShape: WaveShape
}

const MOTION_PRESET_MAP: Record<
    Exclude<PresetType, "Custom">,
    MotionPresetConfig
> = {
    Classic: {
        barCount: 23,
        amplitude: 20,
        frequency: 0.3,
        speed: 2.5,
        waveShape: "Sine",
    },
    Soft: {
        barCount: 18,
        amplitude: 10,
        frequency: 0.2,
        speed: 1.4,
        waveShape: "Soft",
    },
    Energetic: {
        barCount: 28,
        amplitude: 35,
        frequency: 0.42,
        speed: 5.0,
        waveShape: "Sine",
    },
    Deep: {
        barCount: 32,
        amplitude: 45,
        frequency: 0.18,
        speed: 1.8,
        waveShape: "Sine",
    },
    Minimal: {
        barCount: 12,
        amplitude: 8,
        frequency: 0.25,
        speed: 1.0,
        waveShape: "Sine",
    },
    Pulse: {
        barCount: 20,
        amplitude: 30,
        frequency: 0.55,
        speed: 3.8,
        waveShape: "Soft",
    },
}

interface Props {
    preset: PresetType
    barCount: number
    amplitude: number
    frequency: number
    waveShape: WaveShape
    speed: number
    direction: Direction
    phase: number
    colorMode: ColorMode
    barColor: string
    gradientStart: string
    gradientEnd: string
    backgroundColor: string
    waveWidth: number
    barSpacing: number
    barRadius: number
    fadeEdges: boolean
    interactive: boolean
    interactionStrength: number
    ariaLabel: string
}

function calculateWaveValue(theta: number, shape: WaveShape): number {
    const normTheta = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

    switch (shape) {
        case "Triangle": {
            const normalized = normTheta / (2 * Math.PI)
            return normalized < 0.5 ? 4 * normalized - 1 : 3 - 4 * normalized
        }
        case "Square": {
            return Math.sin(theta) >= 0 ? 1 : -1
        }
        case "Soft": {
            const rawSin = (Math.sin(theta) + 1) / 2
            const smooth = rawSin * rawSin * (3 - 2 * rawSin)
            return smooth * 2 - 1
        }
        case "Sine":
        default:
            return Math.sin(theta)
    }
}

// Linear RGB interpolation helper for gradient bars
function interpolateColor(
    color1: string,
    color2: string,
    factor: number
): string {
    const hexToRgb = (hex: string) => {
        const clean = hex.replace("#", "")
        if (clean.length === 3) {
            return [
                parseInt(clean[0] + clean[0], 16),
                parseInt(clean[1] + clean[1], 16),
                parseInt(clean[2] + clean[2], 16),
            ]
        }
        return [
            parseInt(clean.substring(0, 2), 16) || 0,
            parseInt(clean.substring(2, 4), 16) || 0,
            parseInt(clean.substring(4, 6), 16) || 0,
        ]
    }

    const rgb1 = hexToRgb(color1)
    const rgb2 = hexToRgb(color2)

    const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * factor)
    const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * factor)
    const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * factor)

    return `rgb(${r}, ${g}, ${b})`
}

export default function AnimatedWave(props: Props) {
    const {
        preset = "Classic",
        barCount = 23,
        amplitude = 20,
        frequency = 0.3,
        speed = 2.5,
        waveShape = "Sine",
        direction = "Forward",
        phase = 0,
        colorMode = "Solid",
        barColor = "#ffffff",
        gradientStart = "#a855f7",
        gradientEnd = "#06b6d4",
        backgroundColor = "#000000",
        waveWidth = 100,
        barSpacing = 0,
        barRadius = 0,
        fadeEdges = false,
        interactive = true,
        interactionStrength = 1.5,
        ariaLabel = "",
    } = props

    const isStatic = useIsStaticRenderer()
    const waveRefs = useRef<(HTMLDivElement | null)[]>([])
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [isInView, setIsInView] = useState(false)
    const animationFrameRef = useRef<number | null>(null)
    const hoverScaleRef = useRef<number>(1)
    const targetHoverScaleRef = useRef<number>(1)

    // Preset drives core physics & wave geometry while allowing universal style customization
    const activeMotionConfig: MotionPresetConfig = useMemo(() => {
        if (preset !== "Custom" && MOTION_PRESET_MAP[preset]) {
            return MOTION_PRESET_MAP[preset]
        }
        return {
            barCount,
            amplitude,
            frequency,
            speed,
            waveShape,
        }
    }, [preset, barCount, amplitude, frequency, speed, waveShape])

    // Reset hover scale if interactivity is toggled off
    useEffect(() => {
        if (!interactive) {
            targetHoverScaleRef.current = 1
            hoverScaleRef.current = 1
        }
    }, [interactive])

    // Made with 💛 by Karim Saif - Viewport Lifecycle & RAF
    useEffect(() => {
        if (
            isStatic ||
            typeof window === "undefined" ||
            !("IntersectionObserver" in window)
        ) {
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries
                if (entry) {
                    setIsInView(entry.isIntersecting)
                }
            },
            { threshold: 0.1 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic || !isInView) {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
            return
        }

        const dirFactor = direction === "Reverse" ? -1 : 1

        const animateWave = (currentTime: number) => {
            hoverScaleRef.current +=
                (targetHoverScaleRef.current - hoverScaleRef.current) * 0.1

            const t =
                (currentTime / 1000) * activeMotionConfig.speed * dirFactor
            const effectiveAmplitude =
                activeMotionConfig.amplitude * hoverScaleRef.current
            const waveElements = waveRefs.current

            waveElements.forEach((element, index) => {
                if (element) {
                    const theta =
                        t + index * activeMotionConfig.frequency + phase
                    const offset =
                        effectiveAmplitude *
                        calculateWaveValue(theta, activeMotionConfig.waveShape)
                    // Hardware-accelerated 3D transform for maximum frame-rate consistency
                    element.style.transform = `translate3d(0, ${offset}px, 0)`
                }
            })

            animationFrameRef.current = requestAnimationFrame(animateWave)
        }

        animationFrameRef.current = requestAnimationFrame(animateWave)

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [isStatic, isInView, activeMotionConfig, direction, phase])

    const handleMouseEnter = () => {
        if (interactive) {
            targetHoverScaleRef.current = interactionStrength
        }
    }

    const handleMouseLeave = () => {
        if (interactive) {
            targetHoverScaleRef.current = 1
        }
    }

    const isDecorative = !ariaLabel || ariaLabel.trim() === ""

    return (
        <div
            ref={containerRef}
            aria-hidden={isDecorative ? true : undefined}
            aria-label={!isDecorative ? ariaLabel : undefined}
            role={!isDecorative ? "img" : undefined}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                backgroundColor: backgroundColor,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: `${waveWidth}%`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: `${barSpacing}px`,
                }}
            >
                {Array.from({ length: activeMotionConfig.barCount }).map(
                    (_, index) => {
                        const total = activeMotionConfig.barCount
                        const factor = total > 1 ? index / (total - 1) : 0

                        let fill = barColor
                        if (colorMode === "Gradient") {
                            fill = interpolateColor(
                                gradientStart,
                                gradientEnd,
                                factor
                            )
                        }

                        let opacity = 1
                        if (fadeEdges) {
                            const mid = (total - 1) / 2
                            const dist = Math.abs(index - mid) / (mid || 1)
                            opacity = Math.max(0.15, 1 - dist * 0.7)
                        }

                        return (
                            <div
                                key={index}
                                ref={(el) => {
                                    waveRefs.current[index] = el
                                }}
                                style={{
                                    height: `${index + 1}px`,
                                    backgroundColor: fill,
                                    borderRadius: `${barRadius}px`,
                                    opacity: opacity,
                                    willChange: isStatic ? "auto" : "transform",
                                    width: "100%",
                                }}
                            />
                        )
                    }
                )}
            </div>
        </div>
    )
}

// --- Framer Property Controls ---

addPropertyControls(AnimatedWave, {
    // PRESET
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "Classic",
            "Soft",
            "Energetic",
            "Deep",
            "Minimal",
            "Pulse",
            "Custom",
        ],
        optionTitles: [
            "Classic",
            "Soft",
            "Energetic",
            "Deep",
            "Minimal",
            "Pulse",
            "Custom",
        ],
        defaultValue: "Classic",
        description:
            "Select a motion & shape preset or choose Custom to tune physics manually.",
    },

    // WAVE (Custom Mode)
    barCount: {
        type: ControlType.Number,
        title: "Bar Count",
        min: 6,
        max: 50,
        step: 1,
        defaultValue: 23,
        hidden(props) {
            return props.preset !== "Custom"
        },
        description: "Total number of horizontal wave bars.",
    },
    amplitude: {
        type: ControlType.Number,
        title: "Amplitude",
        min: 2,
        max: 80,
        step: 1,
        defaultValue: 20,
        hidden(props) {
            return props.preset !== "Custom"
        },
        description: "Vertical wave displacement in pixels.",
    },
    frequency: {
        type: ControlType.Number,
        title: "Frequency",
        min: 0.05,
        max: 1.0,
        step: 0.02,
        defaultValue: 0.3,
        hidden(props) {
            return props.preset !== "Custom"
        },
        description: "Spatial offset between adjacent wave bars.",
    },
    waveShape: {
        type: ControlType.Enum,
        title: "Wave Shape",
        options: ["Sine", "Soft", "Triangle", "Square"],
        optionTitles: ["Sine", "Soft", "Triangle", "Square"],
        defaultValue: "Sine",
        hidden(props) {
            return props.preset !== "Custom"
        },
        description: "Wave curve profile applied to displacement.",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.2,
        max: 10.0,
        step: 0.1,
        defaultValue: 2.5,
        hidden(props) {
            return props.preset !== "Custom"
        },
        description: "Oscillation rate in radians per second.",
    },

    // MOTION
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Forward", "Reverse"],
        optionTitles: ["Forward", "Reverse"],
        defaultValue: "Forward",
        description: "Flow direction of the wave propagation.",
    },
    phase: {
        type: ControlType.Number,
        title: "Phase Offset",
        min: -6.28,
        max: 6.28,
        step: 0.1,
        defaultValue: 0,
        description: "Starting phase offset in radians (-2π to +2π).",
    },

    // STYLE (Always accessible across presets)
    colorMode: {
        type: ControlType.Enum,
        title: "Color Mode",
        options: ["Solid", "Gradient"],
        optionTitles: ["Solid", "Gradient"],
        defaultValue: "Solid",
        description:
            "Choose between a uniform color or a multi-stop vertical gradient.",
    },
    barColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#ffffff",
        hidden(props) {
            return props.colorMode === "Gradient"
        },
        description: "Uniform fill color for all wave bars.",
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Start Color",
        defaultValue: "#a855f7",
        hidden(props) {
            return props.colorMode === "Solid"
        },
        description:
            "Color applied to the first (top/thinnest) bar in the stack.",
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "End Color",
        defaultValue: "#06b6d4",
        hidden(props) {
            return props.colorMode === "Solid"
        },
        description:
            "Color applied to the last (bottom/thickest) bar in the stack.",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        description: "Background container fill color.",
    },
    waveWidth: {
        type: ControlType.Number,
        title: "Wave Width (%)",
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 100,
        description: "Horizontal width percentage of the wave stack.",
    },
    barSpacing: {
        type: ControlType.Number,
        title: "Bar Spacing",
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        defaultValue: 0,
        description: "Vertical gap spacing between adjacent bars.",
    },
    barRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        defaultValue: 0,
        description: "Corner rounding applied to individual bars.",
    },
    fadeEdges: {
        type: ControlType.Boolean,
        title: "Fade Edges",
        defaultValue: false,
        description:
            "Applies subtle opacity falloff toward the top and bottom bars.",
    },

    // INTERACTION
    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: true,
        description: "Boost wave motion when hovered with a pointer.",
    },
    interactionStrength: {
        type: ControlType.Number,
        title: "Hover Intensity",
        min: 1.0,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.5,
        hidden(props) {
            return !props.interactive
        },
        description:
            "Multiplies wave amplitude while hovering. 1 = normal, 2 = double.",
    },

    // ACCESSIBILITY
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

// Made with 💛 by Karim Saif
