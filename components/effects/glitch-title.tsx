// Get Started: https://www.framer.com/developers/

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation } from "framer-motion"
import { useEffect, useRef, useState, useMemo } from "react"

interface GlitchTitleProps {
    text?: string
    intensity?: number
    color?: string
    colorGlithOne?: string
    colorGlithTwo?: string
    colorGlithThree?: string
    font?: any
    sliceCount?: number
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GlitchTitle({
    text = "Glitch",
    intensity = 8,
    color = "#ffffff",
    colorGlithOne = "#ff0000",
    colorGlithTwo = "#00ff00",
    colorGlithThree = "#0000ff",
    font = {
        textAlign: "left",
        fontSize: "3rem",
    },
    sliceCount = 5,
}: GlitchTitleProps) {
    const redControls = useAnimation()
    const blueControls = useAnimation()
    const greenControls = useAnimation()
    const baseControls = useAnimation()
    const timersRef = useRef<number[]>([])

    // Add: ref for the root element to set CSS variables for slice offsets
    const rootRef = useRef<HTMLDivElement | null>(null)

    // Remove React re-renders for slice offsets: store in ref and apply as CSS vars
    // const [sliceOffsets, setSliceOffsets] = useState<number[]>(() => new Array(sliceCount).fill(0));
    const sliceOffsetsRef = useRef<number[]>(new Array(sliceCount).fill(0))

    // Random horizontal lines overlay (during glitch)
    type GlitchLine = {
        top: number // % from top
        left: number // % from left
        width: number // % width
        thickness: number // px height
        opacity: number // 0..1
    }
    const [glitchLines, setGlitchLines] = useState<GlitchLine[]>([])

    // Pre-computed zero offsets array for quick resets
    const zeroOffsets = useMemo(
        () => new Array(sliceCount).fill(0),
        [sliceCount]
    )

    // Helper: apply slice offsets via CSS variables
    const applySliceOffsets = (offsets: number[]) => {
        sliceOffsetsRef.current = offsets
        const el = rootRef.current
        if (!el) return
        for (let i = 0; i < offsets.length; i++) {
            el.style.setProperty(`--slice-${i}`, `${offsets[i]}px`)
        }
    }

    // Initialize CSS vars whenever sliceCount changes
    useEffect(() => {
        applySliceOffsets(zeroOffsets)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sliceCount, zeroOffsets])

    useEffect(() => {
        let mounted = true

        const clearAllTimers = () => {
            timersRef.current.forEach(clearTimeout)
            timersRef.current = []
        }

        const scheduleNextBurst = () => {
            const idle = 200 + Math.random() * 1500 // Slightly more idle time for performance
            const t = window.setTimeout(() => {
                if (!mounted) return
                runBurst()
            }, idle)
            timersRef.current.push(t)
        }

        const runBurst = async () => {
            const steps = Math.floor(Math.random() * 4) + 4 // Fewer steps for lower load
            for (let i = 0; i < steps; i++) {
                if (!mounted) return

                const stepMs = 40 + Math.random() * 120
                const stepSec = stepMs / 1000

                // Main glitch displacements
                const x = (Math.random() - 0.5) * 14 * (intensity / 8)
                const y = (Math.random() - 0.5) * 6 * (intensity / 8)
                const x2 = -x + (Math.random() - 0.5) * 5
                const y2 = -y + (Math.random() - 0.5) * 3
                const skew = (Math.random() - 0.5) * 6

                const gx = (Math.random() - 0.6) * 10 * (intensity / 8)
                const gy = (Math.random() - 0.6) * 4 * (intensity / 8)
                const gskew = (Math.random() - 0.5) * 8

                redControls.start({
                    x,
                    y,
                    skewX: skew,
                    transition: { duration: stepSec, ease: "linear" },
                })
                blueControls.start({
                    x: x2,
                    y: y2,
                    skewX: -skew,
                    transition: { duration: stepSec, ease: "linear" },
                })
                greenControls.start({
                    x: gx,
                    y: gy,
                    skewX: gskew,
                    transition: { duration: stepSec, ease: "linear" },
                })
                baseControls.start({
                    x: (Math.random() - 0.5) * 1.5,
                    y: (Math.random() - 0.5) * 0.8,
                    transition: { duration: stepSec, ease: "linear" },
                })

                // Generate random slice offsets
                const newOffsets = [...zeroOffsets]
                if (Math.random() > 0.5) {
                    // 50% chance to offset one slice
                    const sliceIndex = Math.floor(Math.random() * sliceCount)
                    newOffsets[sliceIndex] = (Math.random() - 0.5) * 30

                    if (Math.random() > 0.6) {
                        // 30% chance to offset a second slice
                        const sliceIndex2 = Math.floor(
                            Math.random() * sliceCount
                        )
                        newOffsets[sliceIndex2] = (Math.random() - 0.5) * 35
                    }
                }
                // setSliceOffsets(newOffsets);
                applySliceOffsets(newOffsets)

                // Random horizontal lines overlay (changes every step)
                if (Math.random() > 0.4) {
                    const count = Math.floor(Math.random() * 3) + 10 // 5..7 lines
                    const lines: GlitchLine[] = Array.from({
                        length: count,
                    }).map(() => ({
                        top: 25 + Math.random() * 55, // 25%..80% from top
                        left: 5 + Math.random() * 85, // keep some margin
                        width: 1 + Math.random() * 15, // 1%..16%
                        thickness: 1 + Math.floor(Math.random() * 3), // 1..4 px
                        opacity: 0.3 + Math.random() * 0.5, // 0.3..0.8
                    }))
                    setGlitchLines(lines)
                }

                const gap = stepMs * (0.7 + Math.random() * 0.8)
                await new Promise<void>((resolve) => {
                    const tid = window.setTimeout(resolve, gap)
                    timersRef.current.push(tid)
                })
            }

            // Reset animations and overlays
            redControls.start({
                x: 0,
                y: 0,
                skewX: 0,
                transition: { duration: 0.1 },
            })
            blueControls.start({
                x: 0,
                y: 0,
                skewX: 0,
                transition: { duration: 0.1 },
            })
            greenControls.start({
                x: 0,
                y: 0,
                skewX: 0,
                transition: { duration: 0.1 },
            })
            baseControls.start({
                x: 0,
                y: 0,
                skewX: 0,
                transition: { duration: 0.1 },
            })

            // setSliceOffsets(zeroOffsets);
            applySliceOffsets(zeroOffsets)
            setGlitchLines([])

            scheduleNextBurst()
        }

        scheduleNextBurst()

        return () => {
            mounted = false
            clearAllTimers()
            redControls.stop()
            blueControls.stop()
            greenControls.stop()
            baseControls.stop()
            setGlitchLines([])
            applySliceOffsets(zeroOffsets)
        }
    }, [
        intensity,
        redControls,
        blueControls,
        greenControls,
        baseControls,
        sliceCount,
        zeroOffsets,
    ])

    const spacedText = <>&nbsp;{text}&nbsp;</>

    // Helper for rendering sliced text
    const renderSlices = (layerColor: string, customStyle: object = {}) => (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                ...customStyle,
            }}
        >
            {Array.from({ length: sliceCount }).map((_, i) => (
                <span
                    key={i}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        color: layerColor,
                        clipPath: `inset(${(i / sliceCount) * 100}% 0 ${100 - ((i + 1) / sliceCount) * 100}% 0)`,
                        // Use CSS variable for offset to avoid React re-render
                        transform: `translateX(var(--slice-${i}, 0px))`,
                        transition: "transform 0.1s linear",
                        pointerEvents: "none",
                        ...font,
                    }}
                >
                    {spacedText}
                </span>
            ))}
        </div>
    )

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                display: "inline-block",
                color: color,
                userSelect: "none",
                pointerEvents: "none",
                verticalAlign: "middle",
                lineHeight: 1,
            }}
        >
            {/* Base layer with slicing */}
            <motion.div
                animate={baseControls}
                style={{
                    display: "inline-block",
                    position: "relative",
                    zIndex: 4,
                    textShadow: `1px 1px 3px ${color}`,
                }}
            >
                {/* Invisible reference text for sizing */}
                <h1
                    style={{
                        ...font,
                        visibility: "hidden",
                        margin: 0,
                        lineHeight: 1.2,
                        display: "block",
                    }}
                >
                    {spacedText}
                </h1>
                {/* Visible sliced text */}
                {renderSlices(color)}
            </motion.div>

            {/* Random horizontal lines overlay */}
            {glitchLines.map((l, idx) => (
                <div
                    key={idx}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: `${l.top}%`,
                        left: `${l.left}%`,
                        width: `${l.width}%`,
                        maxWidth: "30px",
                        height: `${l.thickness}px`,
                        backgroundColor: color,
                        opacity: l.opacity,
                        zIndex: 5,
                        pointerEvents: "none",
                        filter: `drop-shadow(0 0 1px ${color})`,
                    }}
                />
            ))}

            {/* Red glitch layer */}
            <motion.div
                initial={{ x: 0, y: 0, skewX: 0 }}
                animate={redControls}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 3,
                    pointerEvents: "none",
                }}
            >
                {renderSlices(colorGlithOne, {
                    mixBlendMode: "screen",
                    filter: "saturate(1.2)",
                })}
            </motion.div>

            {/* Green glitch layer */}
            <motion.div
                initial={{ x: 0, y: 0, skewX: 0 }}
                animate={greenControls}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 2,
                    pointerEvents: "none",
                }}
            >
                {renderSlices(colorGlithThree, {
                    mixBlendMode: "screen",
                    filter: "saturate(1.2)",
                })}
            </motion.div>

            {/* Blue glitch layer */}
            <motion.div
                initial={{ x: 0, y: 0, skewX: 0 }}
                animate={blueControls}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            >
                {renderSlices(colorGlithTwo, {
                    mixBlendMode: "screen",
                    filter: "saturate(1.2)",
                })}
            </motion.div>
        </div>
    )
}

GlitchTitle.defaultProps = {
    text: "Glitch Title",
    intensity: 8,
    color: "#ffffff",
    colorGlithOne: "#ff0000",
    colorGlithTwo: "#00ff00",
    colorGlithThree: "#0000ff",
    font: {
        textAlign: "left",
        fontSize: "3rem",
    },
    sliceCount: 10,
}

addPropertyControls(GlitchTitle, {
    text: {
        title: "Glitch Text",
        type: ControlType.String,
        default: "Title value",
        description: "Text you want to add.",
    },
    intensity: {
        title: "Intensity",
        type: ControlType.Number,
        default: 8,
        min: 1,
        max: 40,
        description:
            "How strong should the glitch be? The higher the value, the stronger the glitch.",
    },
    sliceCount: {
        title: "Slice Count",
        type: ControlType.Number,
        default: 10,
        min: 2,
        max: 20,
        description:
            "The number of horizontal 'slices' into which the text will be divided.",
    },
    color: {
        title: "Color",
        type: ControlType.Color,
        default: "#ffffff",
        description: "Color of the text.",
    },
    colorGlithOne: {
        title: "Glitch Color One",
        type: ControlType.Color,
        default: "#ff0000",
        description: "First color of the glitch.",
    },
    colorGlithTwo: {
        title: "Glitch Color Two",
        type: ControlType.Color,
        default: "#00ff00",
        description: "Second color of the glitch.",
    },
    colorGlithThree: {
        title: "Glitch Color Three",
        type: ControlType.Color,
        default: "#0000ff",
        description: "Third color of the glitch.",
    },
    font: {
        title: "Font",
        type: ControlType.Font,
        defaultFontType: "sans-serif",
        defaultValue: {
            textAlign: "left",
            fontSize: "3rem",
        },
        controls: "extended",
    },
})
