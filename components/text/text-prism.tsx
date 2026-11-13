// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"

// =============================================================================
// TYPES
// =============================================================================

type TextAlign = "left" | "center" | "right"
type SweepDirection = "forward" | "backward" | "bounce"

interface AnimationConfig {
    speed: number
    intensity: number
    waveWidth: number
    displacement: number
    direction: SweepDirection
    glow: number
    gap: number
}

interface Props {
    text: string
    fontFamily?: { fontFamily?: string; fontWeight?: number | string }
    fontSize: number
    letterSpacing: number
    lineHeight: number
    textAlign: TextAlign
    uppercase: boolean
    textColor: string
    splitColorA: string
    splitColorB: string
    animation: AnimationConfig
    style?: React.CSSProperties
}

// =============================================================================
// HELPERS
// =============================================================================

const DEFAULT_FONT =
    "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif"

function bellCurve(t: number): number {
    return Math.sin(t * Math.PI)
}

interface CharInfo {
    char: string
    isSpace: boolean
    waveIndex: number
}

function buildCharData(lines: string[]) {
    let idx = 0
    const charsByLine = lines.map((line) =>
        line.split("").map((char) => {
            if (char === " ") return { char, isSpace: true, waveIndex: -1 }
            const info = { char, isSpace: false, waveIndex: idx }
            idx++
            return info
        })
    )
    return { charsByLine, totalNonSpace: idx }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Text Prism
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 250
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TextPrism(props: Props) {
    const {
        text = "DESIGN\nSTUDIO",
        fontFamily: fontFamilyProp,
        fontSize = 120,
        letterSpacing = -2,
        lineHeight = 0.9,
        textAlign = "center",
        uppercase = true,
        textColor = "#1a1a2e",
        splitColorA = "rgba(0, 200, 255, 0.7)",
        splitColorB = "rgba(255, 0, 128, 0.7)",
        animation = {} as AnimationConfig,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const speed = animation.speed ?? 8
    const intensity = animation.intensity ?? 5
    const waveWidth = animation.waveWidth ?? 4
    const displacement = animation.displacement ?? 3
    const direction = animation.direction ?? "bounce"
    const glow = animation.glow ?? 10
    const gap = animation.gap ?? 1

    const fontFamily = fontFamilyProp?.fontFamily
        ? `${fontFamilyProp.fontFamily}, 'Impact', sans-serif`
        : DEFAULT_FONT
    const fontWeight = fontFamilyProp?.fontWeight || 400

    const displayText = uppercase ? text.toUpperCase() : text
    const lines = useMemo(() => displayText.split("\n"), [displayText])
    const { charsByLine, totalNonSpace } = useMemo(
        () => buildCharData(lines),
        [lines]
    )

    // ── Wave position state ──────────────────────────────────────────
    const [wavePos, setWavePos] = useState(-100)
    const rafRef = useRef<number | null>(null)
    const timeRef = useRef(0)
    const lastTsRef = useRef<number | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const isVisibleRef = useRef(false)

    const animate = useCallback(
        (ts: number) => {
            if (lastTsRef.current === null) lastTsRef.current = ts
            const dt = (ts - lastTsRef.current) / 1000
            lastTsRef.current = ts
            timeRef.current += dt

            const passLength = totalNonSpace + waveWidth
            const passTime = passLength / speed
            const halfGap = gap / 2
            let wp: number

            if (direction === "bounce") {
                const cycleTime = passTime * 2 + gap
                const t = timeRef.current % cycleTime
                if (t < passTime) {
                    wp = t * speed
                } else if (t < passTime + halfGap) {
                    wp = passLength + 100
                } else if (t < passTime * 2 + halfGap) {
                    wp = passLength - (t - passTime - halfGap) * speed
                } else {
                    wp = -100
                }
            } else if (direction === "backward") {
                const cycleTime = passTime + gap
                const t = timeRef.current % cycleTime
                wp = t < passTime ? passLength - t * speed : -100
            } else {
                const cycleTime = passTime + gap
                const t = timeRef.current % cycleTime
                wp = t < passTime ? t * speed : -100
            }

            setWavePos(wp)
            rafRef.current = requestAnimationFrame(animate)
        },
        [totalNonSpace, speed, waveWidth, gap, direction]
    )

    // ── Start / stop loop based on visibility ────────────────────────
    const startLoop = useCallback(() => {
        if (rafRef.current) return
        lastTsRef.current = null
        rafRef.current = requestAnimationFrame(animate)
    }, [animate])

    const stopLoop = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    // ── IntersectionObserver: pause when offscreen ───────────────────
    useEffect(() => {
        if (isStatic) return
        const node = containerRef.current
        if (!node) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
                if (entry.isIntersecting) {
                    startLoop()
                } else {
                    stopLoop()
                }
            },
            { threshold: 0 }
        )

        observer.observe(node)
        return () => {
            observer.disconnect()
            stopLoop()
        }
    }, [isStatic, startLoop, stopLoop])

    // ── Reset timing when animation params change ────────────────────
    useEffect(() => {
        if (isStatic) return
        timeRef.current = 0
        lastTsRef.current = null
    }, [animate, isStatic])

    const justifyContent =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center"

    const spaceWidth = fontSize * 0.3

    // ── Render character ─────────────────────────────────────────────
    const renderChar = (charInfo: CharInfo, charIdx: number, wp: number) => {
        if (charInfo.isSpace) {
            return (
                <span
                    key={charIdx}
                    style={{ display: "inline-block", width: spaceWidth }}
                />
            )
        }

        const waveDelta = wp - charInfo.waveIndex
        let effect = 0
        if (waveDelta >= 0 && waveDelta < waveWidth) {
            effect = bellCurve(waveDelta / waveWidth)
        }

        const splitOffset = effect * intensity
        const yOffset = effect * displacement * -1
        const scale = effect > 0.1 ? 1 + effect * 0.04 : 1
        const shadowBlur = effect * 1.5

        const shadows: string[] = []
        if (splitOffset > 0.15) {
            shadows.push(
                `${-splitOffset}px ${splitOffset * 0.3}px ${shadowBlur}px ${splitColorA}`
            )
            shadows.push(
                `${splitOffset}px ${-splitOffset * 0.3}px ${shadowBlur}px ${splitColorB}`
            )
        }
        if (glow > 0 && effect > 0.1) {
            shadows.push(
                `0 0 ${glow * effect}px rgba(255,255,255,${effect * 0.25})`
            )
        }

        return (
            <span
                key={charIdx}
                style={{
                    display: "inline-block",
                    fontFamily,
                    fontWeight: fontWeight as any,
                    fontSize,
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight,
                    color: textColor,
                    transform: `translateY(${yOffset}px) scale(${scale})`,
                    textShadow:
                        shadows.length > 0 ? shadows.join(", ") : "none",
                    willChange: "transform, text-shadow",
                }}
            >
                {charInfo.char}
            </span>
        )
    }

    // ── Static fallback (canvas / export / rendering) ─────────────────
    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems:
                        textAlign === "left"
                            ? "flex-start"
                            : textAlign === "right"
                              ? "flex-end"
                              : "center",
                    overflow: "visible",
                }}
            >
                {charsByLine.map((lineChars, lineIdx) => (
                    <div
                        key={lineIdx}
                        style={{
                            display: "flex",
                            justifyContent,
                            alignItems: "baseline",
                            lineHeight,
                        }}
                    >
                        {lineChars.map((ci, i) => renderChar(ci, i, 4))}
                    </div>
                ))}
            </div>
        )
    }

    // ── Live render ──────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems:
                    textAlign === "left"
                        ? "flex-start"
                        : textAlign === "right"
                          ? "flex-end"
                          : "center",
                overflow: "visible",
                isolation: "isolate",
                zIndex: 0,
                position: "relative",
            }}
        >
            {charsByLine.map((lineChars, lineIdx) => (
                <div
                    key={lineIdx}
                    style={{
                        display: "flex",
                        justifyContent,
                        alignItems: "baseline",
                        lineHeight,
                    }}
                >
                    {lineChars.map((ci, i) => renderChar(ci, i, wavePos))}
                </div>
            ))}
        </div>
    )
}

TextPrism.displayName = "Text Prism"

TextPrism.defaultProps = {
    text: "DESIGN\nSTUDIO",
    fontSize: 120,
    letterSpacing: -2,
    lineHeight: 0.9,
    textAlign: "center",
    uppercase: true,
    textColor: "#1a1a2e",
    splitColorA: "rgba(0, 200, 255, 0.7)",
    splitColorB: "rgba(255, 0, 128, 0.7)",
    animation: {
        speed: 8,
        intensity: 5,
        waveWidth: 4,
        displacement: 3,
        direction: "bounce",
        glow: 10,
        gap: 1,
    },
}

// =============================================================================
// PROPERTY CONTROLS
// =============================================================================

addPropertyControls(TextPrism, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "DESIGN\nSTUDIO",
        displayTextArea: true,
        description: "Use line breaks to split into multiple lines",
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 120,
        min: 24,
        max: 300,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: -2,
        min: -20,
        max: 40,
        step: 0.5,
        unit: "px",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 0.9,
        min: 0.5,
        max: 2,
        step: 0.05,
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1a1a2e",
    },
    splitColorA: {
        type: ControlType.Color,
        title: "Split Color A",
        defaultValue: "rgba(0, 200, 255, 0.7)",
        description: "Left chromatic shift color (cyan by default)",
    },
    splitColorB: {
        type: ControlType.Color,
        title: "Split Color B",
        defaultValue: "rgba(255, 0, 128, 0.7)",
        description: "Right chromatic shift color (magenta by default)",
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        icon: "effect",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 8,
                min: 1,
                max: 30,
                step: 0.5,
                description: "How fast the sweep travels across the text",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 5,
                min: 1,
                max: 20,
                step: 0.5,
                unit: "px",
                description: "How far the color channels split apart",
            },
            waveWidth: {
                type: ControlType.Number,
                title: "Wave Width",
                defaultValue: 4,
                min: 1,
                max: 12,
                step: 0.5,
                description: "How many letters are affected at once",
            },
            displacement: {
                type: ControlType.Number,
                title: "Displacement",
                defaultValue: 3,
                min: 0,
                max: 15,
                step: 0.5,
                unit: "px",
                description: "Vertical bounce as the sweep passes",
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                defaultValue: 10,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                description: "Glow intensity during the sweep",
            },
            gap: {
                type: ControlType.Number,
                title: "Pause",
                defaultValue: 1,
                min: 0,
                max: 5,
                step: 0.1,
                unit: "s",
                description: "Rest time between sweep passes",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["forward", "backward", "bounce"],
                optionTitles: ["Forward →", "← Backward", "↔ Bounce"],
                defaultValue: "bounce",
            },
        },
    },
})
