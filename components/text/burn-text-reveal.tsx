/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import gsap from "gsap"

interface KarimSaifTextBurnNeonProps {
    text: string
    font: any
    fontSize: number
    letterSpacing: number
    lineHeight: number
    align: "left" | "center" | "right"
    baseColor: string
    burnColor: string
    hotColor: string
    glowColor: string
    glowIntensity: number
    duration: number
    flickerCount: number
    randomDelay: number
    repeat: boolean
    repeatDelay: number
}

const COMPONENT_AUTHOR = "Karim Saif"

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

function getSafeNumber(
    value: number,
    fallback: number,
    min: number,
    max: number
): number {
    const safeValue = Number.isFinite(value) ? value : fallback
    return clamp(safeValue, min, max)
}

function getCharacters(text: string): string[] {
    return Array.from(typeof text === "string" ? text : "")
}

export default function KarimSaifTextBurnNeon(
    props: KarimSaifTextBurnNeonProps
) {
    const {
        text,
        font,
        fontSize,
        letterSpacing,
        lineHeight,
        align,
        baseColor,
        burnColor,
        hotColor,
        glowColor,
        glowIntensity,
        duration,
        flickerCount,
        randomDelay,
        repeat,
        repeatDelay,
    } = props

    const isStatic = useIsStaticRenderer()
    const textRef = useRef<HTMLSpanElement>(null)
    const timelineRef = useRef<gsap.core.Timeline | null>(null)

    const characters = getCharacters(text)

    useEffect(() => {
        if (isStatic) return

        const element = textRef.current

        if (!element) return

        if (timelineRef.current) {
            timelineRef.current.kill()
            timelineRef.current = null
        }

        const animatedCharacters = Array.from(
            element.querySelectorAll<HTMLElement>(
                "[data-burn-character='true']"
            )
        )

        if (animatedCharacters.length === 0) return

        const safeDuration = getSafeNumber(duration, 2, 0.1, 30)

        const safeFlickerCount = Math.round(
            getSafeNumber(flickerCount, 5, 1, 30)
        )

        const safeRandomDelay = getSafeNumber(randomDelay, 0.5, 0, 10)

        const safeGlowIntensity = getSafeNumber(glowIntensity, 1, 0, 10)

        const safeRepeatDelay = Math.max(
            0,
            Number.isFinite(repeatDelay) ? repeatDelay : 1
        )

        const glow8 = Math.round(8 * safeGlowIntensity)
        const glow18 = Math.round(18 * safeGlowIntensity)
        const glow34 = Math.round(34 * safeGlowIntensity)

        const glow5 = Math.round(5 * safeGlowIntensity)
        const glow12 = Math.round(12 * safeGlowIntensity)
        const glow26 = Math.round(26 * safeGlowIntensity)

        const glow3 = Math.round(3 * safeGlowIntensity)
        const glow8Small = Math.round(8 * safeGlowIntensity)

        const masterTimeline = gsap.timeline({
            repeat: repeat ? -1 : 0,
            repeatDelay: safeRepeatDelay,
        })

        gsap.set(animatedCharacters, {
            opacity: 0,
            color: burnColor,
            textShadow: "0 0 0 transparent",
        })

        animatedCharacters.forEach((character) => {
            const startDelay = Math.random() * safeRandomDelay

            const flickerDuration = Math.max(0.015, safeDuration * 0.025)

            const burnDuration = safeDuration * 0.18

            const hotDuration = safeDuration * 0.22

            const fadeDuration = safeDuration * 0.28

            const finalDuration = safeDuration * 0.18

            const characterTimeline = gsap.timeline({
                delay: startDelay,
            })

            characterTimeline.to(character, {
                opacity: 1,
                duration: flickerDuration,
                repeat: safeFlickerCount * 2 - 1,
                yoyo: true,
                ease: "none",
            })

            characterTimeline.to(character, {
                opacity: 1,
                color: burnColor,
                textShadow: `
                    0 0 ${glow8}px ${glowColor},
                    0 0 ${glow18}px ${burnColor},
                    0 0 ${glow34}px ${burnColor}
                `,
                duration: burnDuration,
                ease: "power2.in",
            })

            characterTimeline.to(character, {
                opacity: 1,
                color: hotColor,
                textShadow: `
                    0 0 ${glow5}px ${glowColor},
                    0 0 ${glow12}px ${glowColor},
                    0 0 ${glow26}px ${burnColor}
                `,
                duration: hotDuration,
                ease: "power2.out",
            })

            characterTimeline.to(character, {
                opacity: 1,
                color: baseColor,
                textShadow: `
                    0 0 ${glow3}px ${glowColor},
                    0 0 ${glow8Small}px transparent
                `,
                duration: fadeDuration,
                ease: "power2.out",
            })

            characterTimeline.to(character, {
                opacity: 1,
                color: baseColor,
                textShadow: "0 0 0 transparent",
                duration: finalDuration,
                ease: "power2.out",
            })

            masterTimeline.add(characterTimeline, 0)
        })

        timelineRef.current = masterTimeline

        return () => {
            masterTimeline.kill()

            if (timelineRef.current === masterTimeline) {
                timelineRef.current = null
            }

            gsap.set(animatedCharacters, {
                clearProps: "opacity,color,textShadow",
            })
        }
    }, [
        text,
        baseColor,
        burnColor,
        hotColor,
        glowColor,
        glowIntensity,
        duration,
        flickerCount,
        randomDelay,
        repeat,
        repeatDelay,
        isStatic,
    ])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        align === "left"
                            ? "flex-start"
                            : align === "right"
                              ? "flex-end"
                              : "center",
                    overflow: "hidden",
                    boxSizing: "border-box",
                }}
            >
                <span
                    aria-label={text}
                    style={{
                        ...font,
                        fontSize,
                        letterSpacing,
                        lineHeight,
                        color: baseColor,
                        textAlign: align,
                        whiteSpace: "pre-wrap",
                        wordBreak: "normal",
                        overflowWrap: "normal",
                        display: "inline-block",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        WebkitFontSmoothing: "antialiased",
                    }}
                >
                    {text}
                </span>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent:
                    align === "left"
                        ? "flex-start"
                        : align === "right"
                          ? "flex-end"
                          : "center",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            <span
                ref={textRef}
                aria-label={text}
                style={{
                    ...font,
                    fontSize,
                    letterSpacing,
                    lineHeight,
                    color: baseColor,
                    textAlign: align,
                    whiteSpace: "pre-wrap",
                    wordBreak: "normal",
                    overflowWrap: "normal",
                    display: "inline-block",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    WebkitFontSmoothing: "antialiased",
                }}
            >
                {characters.map((character, index) => {
                    if (character === "\n") {
                        return <br key={`break-${index}`} />
                    }

                    return (
                        <span
                            key={`${character}-${index}`}
                            data-burn-character="true"
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre",
                            }}
                        >
                            {character === " " ? "\u00A0" : character}
                        </span>
                    )
                })}
            </span>
        </div>
    )
}

KarimSaifTextBurnNeon.displayName = COMPONENT_AUTHOR

KarimSaifTextBurnNeon.defaultProps = {
    text: "BURN NEON",
    font: {
        fontFamily: "Inter",
        fontWeight: 700,
        fontStyle: "normal",
    },
    fontSize: 72,
    letterSpacing: -2,
    lineHeight: 1,
    align: "center",
    baseColor: "#FFFFFF",
    burnColor: "#FF3300",
    hotColor: "#FFFFFF",
    glowColor: "#FFAA00",
    glowIntensity: 1,
    duration: 2,
    flickerCount: 5,
    randomDelay: 0.5,
    repeat: true,
    repeatDelay: 1,
}

addPropertyControls(KarimSaifTextBurnNeon, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "BURN NEON",
        description: "Controls the text displayed by the neon burn animation.",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: KarimSaifTextBurnNeon.defaultProps.font,
        description:
            "Controls the font family, weight, style, and typography settings.",
    },

    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 72,
        min: 8,
        max: 300,
        step: 1,
        unit: "px",
        description: "Controls the size of the animated text.",
    },

    letterSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: -2,
        min: -20,
        max: 50,
        step: 0.5,
        unit: "px",
        description: "Controls the spacing between individual characters.",
    },

    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.05,
        description: "Controls the vertical spacing between text lines.",
    },

    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        description:
            "Controls the horizontal alignment of the text inside the component.",
    },

    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#FFFFFF",
        description:
            "Controls the final resting color of the text after the burn animation.",
    },

    burnColor: {
        type: ControlType.Color,
        title: "Burn Color",
        defaultValue: "#FF3300",
        description:
            "Controls the fiery color used during the main burn stage.",
    },

    hotColor: {
        type: ControlType.Color,
        title: "Hot Color",
        defaultValue: "#FFFFFF",
        description:
            "Controls the bright hot color used at the peak of the burn.",
    },

    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#FFAA00",
        description: "Controls the color used for the surrounding neon glow.",
    },

    glowIntensity: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
        description:
            "Controls the strength of the neon glow around each character.",
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.25,
        max: 10,
        step: 0.05,
        unit: "s",
        description:
            "Controls the overall duration of each character burn sequence.",
    },

    flickerCount: {
        type: ControlType.Number,
        title: "Flickers",
        defaultValue: 5,
        min: 1,
        max: 15,
        step: 1,
        description:
            "Controls how many times each character flickers before igniting.",
    },

    randomDelay: {
        type: ControlType.Number,
        title: "Random Delay",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
        description:
            "Controls the maximum randomized delay between individual character animations.",
    },

    repeat: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        description:
            "Controls whether the neon burn animation continuously repeats.",
    },

    repeatDelay: {
        type: ControlType.Number,
        title: "Loop Delay",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
