/**
 * @framerDisableUnlink
 * @framerDisplayName "Loader Counter"
 */

/**
 * Loader Counter v1.0.0
 * Professional animated number counter with authentic loader and linear modes.
 *
 * ✨ Features:
 * • Authentic loader animation with realistic pauses and speed variations
 * • Linear counting mode for smooth, consistent animations
 * • Smart number formatting with thousands separators and abbreviations (K/M/B)
 * • Color transitions that interpolate smoothly during animation
 * • Intersection Observer for viewport-triggered animations
 * • Full accessibility support with ARIA labels and announcements
 * • Respects user motion preferences automatically
 * • High-performance RAF-based animation loop
 *
 * 🎨 Customization:
 * • Native Framer font controls with full typography support
 * • Dynamic color transitions between start and end colors
 * • Flexible prefix/suffix system with independent colors
 * • Auto-duration calculation based on number range
 * • Customizable animation delay and replay options
 *
 * 🚀 Perfect for:
 * • Loading screens with realistic progress indicators
 * • Statistics and metrics displays
 * • Achievement counters and milestones
 * • Dynamic data visualizations
 * • Marketing landing pages with animated numbers
 *
 * © 2025 Amr Rashed - All rights reserved
 * Author: Amr Rashed (https://amrrashed.com)
 * Documentation: https://loadercounter.framer.website/demo
 * Support: hello@amrrashed.com
 * License: Commercial use allowed with attribution
 */

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Disable unlinking to protect the component
export const framerDisableUnlinking = true

/* ===== UTILITIES ===== */
const clamp = (value: number, min = 0, max = 1) =>
    Math.max(min, Math.min(max, value))

// Color interpolation with support for hex and rgb
const parseColor = (color: string): { r: number; g: number; b: number } => {
    // Handle hex colors
    if (color.startsWith("#")) {
        const hex = color.slice(1)
        const fullHex =
            hex.length === 3
                ? hex
                      .split("")
                      .map((c) => c + c)
                      .join("")
                : hex
        const bigint = parseInt(fullHex, 16)
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        }
    }

    // Handle rgb/rgba colors
    const match = color.match(
        /rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/
    )
    if (match) {
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
        }
    }

    // Default to black
    return { r: 0, g: 0, b: 0 }
}

const interpolateColor = (start: string, end: string, progress: number) => {
    const from = parseColor(start)
    const to = parseColor(end)

    const r = Math.round(from.r + (to.r - from.r) * progress)
    const g = Math.round(from.g + (to.g - from.g) * progress)
    const b = Math.round(from.b + (to.b - from.b) * progress)

    return `rgb(${r}, ${g}, ${b})`
}

// Loader-specific easing - more dramatic speed changes
const loaderEase = (t: number) => {
    // Very fast start (0-25%) - shoots up quickly
    if (t < 0.25) {
        return 3.2 * t * t
    }
    // Steady middle (25-65%) - consistent progress
    if (t < 0.65) {
        const adjusted = (t - 0.25) / 0.4
        return 0.2 + adjusted * 0.5
    }
    // Slow section (65-88%) - crawling
    if (t < 0.88) {
        const adjusted = (t - 0.65) / 0.23
        return 0.7 + Math.pow(adjusted, 1.5) * 0.18
    }
    // Extremely slow finish (88-100%) - classic loader struggle
    const final = (t - 0.88) / 0.12
    return 0.88 + Math.pow(final, 4) * 0.12
}

// Generate random micro-pauses for authentic loader feel
function generateLoaderPauses() {
    const pauses = []

    // Add 3-5 noticeable pauses
    const pauseCount = 3 + Math.floor(Math.random() * 3)

    for (let i = 0; i < pauseCount; i++) {
        // Pauses occur between 15-85% progress
        const center = 0.15 + Math.random() * 0.7
        // Longer pause duration (100-300ms relative to total duration)
        const width = 0.04 + Math.random() * 0.08

        pauses.push({
            start: Math.max(0.15, center - width / 2),
            end: Math.min(0.85, center + width / 2),
        })
    }

    // Add one longer pause around 75-85% (the classic "almost there" pause)
    pauses.push({
        start: 0.75 + Math.random() * 0.05,
        end: 0.82 + Math.random() * 0.03,
    })

    return pauses
}

/* ===== NUMBER FORMATTING ===== */
function formatNumber(
    value: number,
    options: {
        thousands: boolean
        abbreviate: boolean
        locale: string
        decimals: number
        from: number
        to: number
    }
) {
    const { thousands, abbreviate, locale, decimals } = options

    if (abbreviate) {
        const absValue = Math.abs(value)
        let divisor = 1
        let suffix = ""
        let precision = 0

        // Determine scale based on current value, not range
        if (absValue >= 1e9) {
            divisor = 1e9
            suffix = "B"
            // For billions, show 2 decimals if under 10B, 1 decimal if under 100B
            if (absValue < 10e9) precision = 2
            else if (absValue < 100e9) precision = 1
        } else if (absValue >= 1e6) {
            divisor = 1e6
            suffix = "M"
            // For millions, show 2 decimals if under 10M, 1 decimal if under 100M
            if (absValue < 10e6) precision = 2
            else if (absValue < 100e6) precision = 1
        } else if (absValue >= 1e3) {
            divisor = 1e3
            suffix = "K"
            // For thousands, show 2 decimals if under 10K, 1 decimal if under 100K
            if (absValue < 10e3) precision = 2
            else if (absValue < 100e3) precision = 1
        }

        // If no abbreviation needed, show the normal number
        if (divisor === 1) {
            const fixedValue = Number(value.toFixed(decimals))
            if (thousands) {
                try {
                    return new Intl.NumberFormat(locale, {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals,
                        useGrouping: true,
                    }).format(fixedValue)
                } catch {
                    return fixedValue.toString()
                }
            }
            return fixedValue.toString()
        }

        // Apply abbreviation with appropriate precision
        const scaled = value / divisor
        const factor = Math.pow(10, precision)
        const rounded = Math.round(scaled * factor) / factor

        // Format with appropriate decimal places
        let text
        if (precision === 0 || Number.isInteger(rounded)) {
            text = rounded.toFixed(0)
        } else {
            text = rounded.toFixed(precision).replace(/\.?0+$/, "")
        }

        return (value < 0 ? "-" : "") + text + suffix
    }

    const fixedValue = Number(value.toFixed(decimals))

    if (thousands) {
        try {
            return new Intl.NumberFormat(locale, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                useGrouping: true,
            }).format(fixedValue)
        } catch {
            return new Intl.NumberFormat("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                useGrouping: true,
            }).format(fixedValue)
        }
    }

    return fixedValue.toString()
}

function getDecimalPlaces(num: number): number {
    const str = String(num)
    const idx = str.indexOf(".")
    return idx >= 0 ? Math.min(3, str.length - idx - 1) : 0
}

/* ===== ANIMATION HOOK ===== */
function useCounterAnimation(config: {
    from: number
    to: number
    duration: number
    delay: number
    isLoader: boolean
    startOnView: boolean
    replay: boolean
}) {
    const [value, setValue] = React.useState(config.from)
    const [progress, setProgress] = React.useState(0)
    const [isVisible, setIsVisible] = React.useState(!config.startOnView)
    const [isAnimating, setIsAnimating] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const animationRef = React.useRef<number>()
    const pausesRef = React.useRef<Array<{ start: number; end: number }>>([])
    const lastPausedRef = React.useRef(false)

    // Visibility observer
    React.useEffect(() => {
        if (!config.startOnView) {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                } else if (config.replay) {
                    setIsVisible(false)
                    setValue(config.from)
                    setProgress(0)
                    setIsAnimating(false)
                }
            },
            { threshold: 0.1 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [config.startOnView, config.replay, config.from])

    // Prefer reduced motion support
    React.useEffect(() => {
        const prefersReducedMotion = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches

        if (prefersReducedMotion) {
            // Skip animation for users who prefer reduced motion
            setValue(config.to)
            setProgress(1)
            return
        }
    }, [config.to])

    // Animation loop
    React.useEffect(() => {
        if (!isVisible) return

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches
        if (prefersReducedMotion) {
            setValue(config.to)
            setProgress(1)
            return
        }

        // Cancel any existing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }

        // Generate pauses for loader mode
        pausesRef.current = config.isLoader ? generateLoaderPauses() : []
        lastPausedRef.current = false
        setIsAnimating(true)

        const startTime = performance.now() + config.delay * 1000
        const duration = config.duration * 1000
        const range = config.to - config.from

        const animate = () => {
            const now = performance.now()
            const elapsed = now - startTime

            // Handle delay
            if (elapsed < 0) {
                animationRef.current = requestAnimationFrame(animate)
                return
            }

            let rawProgress = clamp(elapsed / duration)

            // For loader mode, apply pauses
            if (config.isLoader && rawProgress < 0.95) {
                const isPaused = pausesRef.current.some(
                    (p) => rawProgress >= p.start && rawProgress <= p.end
                )

                if (isPaused) {
                    if (!lastPausedRef.current) {
                        // Just entered a pause, hold current value
                        lastPausedRef.current = true
                    }
                    // Don't update during pause
                    animationRef.current = requestAnimationFrame(animate)
                    return
                } else {
                    lastPausedRef.current = false
                }
            }

            // Apply easing
            const easedProgress = config.isLoader
                ? loaderEase(rawProgress)
                : rawProgress

            // Update values
            setProgress(easedProgress)
            setValue(config.from + range * easedProgress)

            if (rawProgress < 1) {
                animationRef.current = requestAnimationFrame(animate)
            } else {
                // Ensure we end exactly at the target
                setProgress(1)
                setValue(config.to)
                setIsAnimating(false)
            }
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            setIsAnimating(false)
        }
    }, [
        isVisible,
        config.from,
        config.to,
        config.duration,
        config.delay,
        config.isLoader,
    ])

    return { containerRef, value, progress, isAnimating }
}

/* ===== MAIN COMPONENT ===== */
export default function LoaderCounter(props: any) {
    const {
        // Animation
        isLoader = true,
        from = 0,
        to = 100,
        duration = false,
        customDuration = 3.2,
        delay = 0,
        startOnView = true,
        replay = true,

        // Formatting
        formatThousands = false,
        abbreviate = false,
        locale = false,
        customLocale = "en-US",

        // Styling
        font = {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 64,
            letterSpacing: 0,
            lineHeight: 1.1,
            textAlign: "left",
        },
        color = "#000000",

        // Color transition
        colorTransition = false,
        startColor = "#3b82f6",
        endColor = "#ef4444",

        // Affixes
        prefix = "",
        prefixColor = "#000000",
        suffix = "",
        suffixColor = "#000000",
        gap = 8,
    } = props

    // Calculate auto duration based on range (longer for loader effect)
    const calculatedDuration = React.useMemo(() => {
        if (!duration) {
            const range = Math.abs(to - from)
            // Loader mode: 3-4.5s for authentic loading feel
            if (isLoader) {
                const seconds = 3.0 + Math.log10(Math.max(1, range)) * 0.5
                return clamp(seconds, 3.0, 4.5)
            } else {
                // Linear mode: faster 1-2.5s
                const seconds = 1.0 + Math.log10(Math.max(1, range)) * 0.4
                return clamp(seconds, 1.0, 2.5)
            }
        }
        return customDuration
    }, [duration, customDuration, from, to, isLoader])

    // Resolve locale
    const resolvedLocale = React.useMemo(() => {
        if (!formatThousands) return "en-US"
        if (!locale && typeof window !== "undefined") {
            return window.navigator?.language || "en-US"
        }
        return customLocale || "en-US"
    }, [locale, customLocale, formatThousands])

    // Calculate decimal places
    const decimals = React.useMemo(() => {
        return Math.max(getDecimalPlaces(from), getDecimalPlaces(to))
    }, [from, to])

    // Use animation hook
    const { containerRef, value, progress, isAnimating } = useCounterAnimation({
        from,
        to,
        duration: calculatedDuration,
        delay,
        isLoader,
        startOnView,
        replay,
    })

    // Format current value
    const displayValue = React.useMemo(() => {
        return formatNumber(value, {
            thousands: formatThousands,
            abbreviate,
            locale: resolvedLocale,
            decimals,
            from,
            to,
        })
    }, [value, formatThousands, abbreviate, resolvedLocale, decimals, from, to])

    // Calculate interpolated color
    const currentColor = React.useMemo(() => {
        if (colorTransition && startColor && endColor) {
            return interpolateColor(startColor, endColor, progress)
        }
        return color
    }, [colorTransition, startColor, endColor, progress, color])

    // Build font styles
    const fontStyles = React.useMemo(
        () => ({
            fontFamily: font?.fontFamily || "Inter",
            fontWeight: font?.fontWeight || 600,
            fontSize: font?.fontSize || 64,
            letterSpacing: font?.letterSpacing || 0,
            lineHeight: font?.lineHeight || 1.1,
            textAlign: (font?.textAlign || "left") as any,
        }),
        [font]
    )

    return (
        <div
            ref={containerRef}
            role="status"
            aria-live="polite"
            aria-label={`Counter: ${displayValue}`}
            style={{
                width: "100%",
                display: "flex",
                justifyContent:
                    fontStyles.textAlign === "center"
                        ? "center"
                        : fontStyles.textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
                ...fontStyles,
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: prefix || suffix ? `${gap}px` : "0px",
                    fontVariantNumeric: "tabular-nums",
                    // Prevent text selection during animation for cleaner UX
                    userSelect: isAnimating ? "none" : "auto",
                    // Smooth color transitions
                    transition: colorTransition ? "color 0.3s ease" : undefined,
                }}
            >
                {prefix && (
                    <span style={{ color: prefixColor }} aria-hidden="true">
                        {prefix}
                    </span>
                )}
                <span
                    style={{ color: currentColor }}
                    data-value={value}
                    data-progress={progress}
                >
                    {displayValue}
                </span>
                {suffix && (
                    <span style={{ color: suffixColor }} aria-hidden="true">
                        {suffix}
                    </span>
                )}
            </div>
            {/* Screen reader only announcement for completion */}
            {progress === 1 && (
                <span
                    style={{
                        position: "absolute",
                        width: "1px",
                        height: "1px",
                        padding: "0",
                        margin: "-1px",
                        overflow: "hidden",
                        clip: "rect(0, 0, 0, 0)",
                        whiteSpace: "nowrap",
                        borderWidth: "0",
                    }}
                    aria-live="assertive"
                >
                    Counter complete: {prefix}
                    {displayValue}
                    {suffix}
                </span>
            )}
        </div>
    )
}

/* ===== DEFAULT PROPS ===== */
LoaderCounter.defaultProps = {
    font: {
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: 64,
        letterSpacing: 0,
        lineHeight: 1.1,
        textAlign: "left",
    },
}

/* ===== PROPERTY CONTROLS ===== */
addPropertyControls(LoaderCounter, {
    isLoader: {
        type: ControlType.Boolean,
        title: "Style",
        defaultValue: true,
        enabledTitle: "Loader",
        disabledTitle: "Linear",
    },

    from: {
        type: ControlType.Number,
        title: "From",
        defaultValue: 0,
        displayStepper: true,
    },

    to: {
        type: ControlType.Number,
        title: "To",
        defaultValue: 100,
        displayStepper: true,
    },

    duration: {
        type: ControlType.Boolean,
        title: "Duration",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Auto",
    },

    customDuration: {
        type: ControlType.Number,
        title: "Seconds",
        defaultValue: 3.2,
        min: 0.5,
        max: 10,
        step: 0.1,
        hidden: (props) => !props.duration,
    },

    delay: {
        type: ControlType.Number,
        title: "Delay (s)",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },

    abbreviate: {
        type: ControlType.Boolean,
        title: "Shorten",
        defaultValue: false,
        enabledTitle: "K/M/B",
        disabledTitle: "Full",
    },

    formatThousands: {
        type: ControlType.Boolean,
        title: "Format",
        defaultValue: false,
        enabledTitle: "1,000",
        disabledTitle: "1000",
    },

    locale: {
        type: ControlType.Boolean,
        title: "Locale",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Auto",
        hidden: (props) => !props.formatThousands,
    },

    customLocale: {
        type: ControlType.String,
        title: "Code",
        defaultValue: "en-US",
        placeholder: "en-US, nl-NL, etc",
        hidden: (props) => !props.formatThousands || !props.locale,
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
    },

    colorTransition: {
        type: ControlType.Boolean,
        title: "Color fade",
        defaultValue: false,
    },

    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
        hidden: (props) => props.colorTransition,
    },

    startColor: {
        type: ControlType.Color,
        title: "From color",
        defaultValue: "#3b82f6",
        hidden: (props) => !props.colorTransition,
    },

    endColor: {
        type: ControlType.Color,
        title: "To color",
        defaultValue: "#ef4444",
        hidden: (props) => !props.colorTransition,
    },

    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "$, €, etc",
    },

    prefixColor: {
        type: ControlType.Color,
        title: "Prefix color",
        defaultValue: "#000000",
        hidden: (props) => !props.prefix,
    },

    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        placeholder: "%, pts, etc",
    },

    suffixColor: {
        type: ControlType.Color,
        title: "Suffix color",
        defaultValue: "#000000",
        hidden: (props) => !props.suffix,
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        hidden: (props) => !props.prefix && !props.suffix,
    },

    startOnView: {
        type: ControlType.Boolean,
        title: "On view",
        defaultValue: true,
    },

    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: true,
        hidden: (props) => !props.startOnView,
        description: "[Built by Amr Rashed](https://amrrashed.com)",
    },
})
