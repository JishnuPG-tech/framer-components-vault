/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 350
 * @framerIntrinsicHeight 70
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

"use client"

import * as React from "react"
import { useEffect, useId, useRef } from "react"
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

type Variant = "morph" | "slide-x" | "slide-y"

type FramerFont = {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    fontStyle?: string
    fontStretch?: string
    letterSpacing?: number | string
    lineHeight?: number | string
    textAlign?: "left" | "right" | "center" | "justify"
    variant?: string
    [key: string]: unknown
}

type Props = {
    variant: Variant
    textA: string
    textB: string
    font: FramerFont
    color: string
    blurAmount: number
    animationDuration: number
    slideAmount: number
    holdDuration: number
    loop: boolean
    hover: boolean
    startOnSecondText: boolean
}

type ComponentType = React.FC<Partial<Props>> & {
    defaultProps?: Partial<Props>
}

type VariantConfig = {
    matrix: string
    stdPeak: number
    axis: "x" | "y" | null
    ease: string
}

const VARIANTS: Record<Variant, VariantConfig> = {
    morph: {
        matrix: "1 0 0 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 15 -8",
        stdPeak: 1,
        axis: null,
        ease: "none",
    },

    "slide-x": {
        matrix: "1 0 0 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 16 -7",
        stdPeak: 1.5,
        axis: "x",
        ease: "power2.inOut",
    },

    "slide-y": {
        matrix: "1 0 0 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 18 -8",
        stdPeak: 1,
        axis: "y",
        ease: "power1.inOut",
    },
}

function getFontFamily(font: FramerFont | undefined): string {
    if (
        font &&
        typeof font.fontFamily === "string" &&
        font.fontFamily.trim().length > 0
    ) {
        return font.fontFamily
    }

    return "Inter, system-ui, sans-serif"
}

function getFontSize(font: FramerFont | undefined): string {
    if (
        font &&
        (typeof font.fontSize === "number" || typeof font.fontSize === "string")
    ) {
        const value = String(font.fontSize).trim()

        if (value.length > 0) {
            return value.endsWith("px") ||
                value.endsWith("rem") ||
                value.endsWith("em") ||
                value.endsWith("%")
                ? value
                : `${value}px`
        }
    }

    return "16px"
}

function getFontWeight(font: FramerFont | undefined): number | string {
    if (
        font &&
        (typeof font.fontWeight === "number" ||
            typeof font.fontWeight === "string")
    ) {
        return font.fontWeight
    }

    return 700
}

function getTextAnchor(
    textAlign: FramerFont["textAlign"] | undefined
): "start" | "middle" | "end" {
    if (textAlign === "left") return "start"
    if (textAlign === "right") return "end"
    return "middle"
}

function getTextX(textAlign: FramerFont["textAlign"] | undefined): number {
    if (textAlign === "left") return 4
    if (textAlign === "right") return 136
    return 70
}

function getTypography(font: FramerFont | undefined): React.CSSProperties {
    return {
        fontFamily: getFontFamily(font),
        fontSize: getFontSize(font),
        fontWeight: getFontWeight(font),
        fontStyle:
            typeof font?.fontStyle === "string"
                ? (font.fontStyle as React.CSSProperties["fontStyle"])
                : undefined,
        fontStretch:
            typeof font?.fontStretch === "string"
                ? (font.fontStretch as React.CSSProperties["fontStretch"])
                : undefined,
        letterSpacing:
            typeof font?.letterSpacing === "number" ||
            typeof font?.letterSpacing === "string"
                ? font.letterSpacing
                : undefined,
    }
}

function setTextTransform(
    element: SVGTextElement,
    axis: "x" | "y" | null,
    amount: number
) {
    if (!axis || amount === 0) {
        element.style.transform = "translate(0px, 0px)"
        return
    }

    if (axis === "x") {
        element.style.transform = `translate(${amount}px, 0px)`
    } else {
        element.style.transform = `translate(0px, ${amount}px)`
    }
}

const KarimSaifGooeyText: ComponentType = (props) => {
    const {
        variant = "morph",
        textA = "Hey Framer",
        textB = "Karim Saif",
        font = {
            textAlign: "center",
            fontSize: 16,
            lineHeight: 1,
            variant: "Bold",
        },
        color = "#000000",
        blurAmount = 1,
        animationDuration = 1,
        slideAmount = 8,
        holdDuration = 900,
        loop = true,
        hover = true,
        startOnSecondText = false,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const groupRef = useRef<SVGGElement>(null)
    const textARef = useRef<SVGTextElement>(null)
    const textBRef = useRef<SVGTextElement>(null)
    const blurRef = useRef<SVGFEGaussianBlurElement>(null)

    const hoverRef = useRef(false)
    const destroyedRef = useRef(false)
    const timerRef = useRef<number | null>(null)

    const reactId = useId()

    const filterId = `karim-saif-gooey-${reactId}`.replace(
        /[^a-zA-Z0-9_-]/g,
        ""
    )

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const config = VARIANTS[variant] ?? VARIANTS.morph

    const safeDuration = Math.max(0.05, Number(animationDuration) || 1)

    const safeHold = Math.max(0, Number(holdDuration) || 0)

    const safeBlur = Math.max(0, Number(blurAmount) || 0)

    const safeSlide = Number(slideAmount) || 0

    const alignment = font?.textAlign ?? "center"

    const textAnchor = getTextAnchor(alignment)

    const textX = getTextX(alignment)

    useEffect(() => {
        const container = containerRef.current
        const group = groupRef.current
        const textAElement = textARef.current
        const textBElement = textBRef.current
        const blur = blurRef.current

        if (!container || !group || !textAElement || !textBElement || !blur) {
            return
        }

        destroyedRef.current = false
        hoverRef.current = false

        let timeline: gsap.core.Timeline | null = null

        const clearTimer = () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current)
                timerRef.current = null
            }
        }

        const setBlur = (value: number) => {
            blur.setAttribute("stdDeviation", String(Math.max(0, value)))
        }

        const enableFilter = () => {
            group.style.filter = `url(#${filterId})`
        }

        const disableFilter = () => {
            group.style.filter = "none"
        }

        const setStaticA = () => {
            textAElement.style.opacity = "1"
            textBElement.style.opacity = "0"

            setTextTransform(textAElement, config.axis, 0)

            setTextTransform(
                textBElement,
                config.axis,
                config.axis ? -safeSlide : 0
            )

            setBlur(0)
            disableFilter()
        }

        const setStaticB = () => {
            textAElement.style.opacity = "0"
            textBElement.style.opacity = "1"

            setTextTransform(
                textAElement,
                config.axis,
                config.axis ? safeSlide : 0
            )

            setTextTransform(textBElement, config.axis, 0)

            setBlur(0)
            disableFilter()
        }

        if (isStatic || reducedMotion) {
            clearTimer()

            if (startOnSecondText) {
                setStaticB()
            } else {
                setStaticA()
            }

            return () => {
                destroyedRef.current = true
                clearTimer()
            }
        }

        const state = {
            blur: 0,
        }

        timeline = gsap.timeline({
            paused: true,
        })

        const halfDuration = safeDuration * 0.5

        const peakBlur = safeBlur * config.stdPeak

        timeline.to(
            state,
            {
                duration: halfDuration,
                blur: peakBlur,
                ease: "none",
                onUpdate: () => {
                    setBlur(state.blur)
                },
            },
            0
        )

        timeline.to(
            state,
            {
                duration: halfDuration,
                blur: 0,
                ease: "none",
                onUpdate: () => {
                    setBlur(state.blur)
                },
            },
            halfDuration
        )

        timeline.to(
            textAElement,
            {
                duration: safeDuration,
                opacity: 0,
                ease: "none",
            },
            0
        )

        timeline.to(
            textBElement,
            {
                duration: safeDuration,
                opacity: 1,
                ease: "none",
            },
            0
        )

        if (config.axis) {
            timeline.to(
                textAElement,
                {
                    duration: safeDuration,
                    [config.axis]: safeSlide,
                    ease: config.ease,
                },
                0
            )

            timeline.to(
                textBElement,
                {
                    duration: safeDuration,
                    [config.axis]: 0,
                    ease: config.ease,
                },
                0
            )
        }

        const setInitialState = () => {
            if (!timeline) return

            clearTimer()
            disableFilter()
            setBlur(0)

            if (startOnSecondText) {
                gsap.set(textAElement, {
                    opacity: 0,
                    x: config.axis === "x" ? safeSlide : 0,
                    y: config.axis === "y" ? safeSlide : 0,
                })

                gsap.set(textBElement, {
                    opacity: 1,
                    x: 0,
                    y: 0,
                })

                timeline.progress(1)
            } else {
                gsap.set(textAElement, {
                    opacity: 1,
                    x: 0,
                    y: 0,
                })

                gsap.set(textBElement, {
                    opacity: 0,
                    x: config.axis === "x" ? -safeSlide : 0,
                    y: config.axis === "y" ? -safeSlide : 0,
                })

                timeline.progress(0)
            }

            setBlur(0)
        }

        setInitialState()

        let direction: 1 | -1 = startOnSecondText ? -1 : 1

        const scheduleLoop = () => {
            clearTimer()

            if (destroyedRef.current || !loop || hoverRef.current) {
                return
            }

            timerRef.current = window.setTimeout(() => {
                timerRef.current = null

                if (
                    destroyedRef.current ||
                    !timeline ||
                    !loop ||
                    hoverRef.current
                ) {
                    return
                }

                enableFilter()

                if (direction === 1) {
                    timeline.play()
                } else {
                    timeline.reverse()
                }

                direction = direction === 1 ? -1 : 1
            }, safeHold)
        }

        const finishForward = () => {
            if (destroyedRef.current) return

            setBlur(0)
            disableFilter()

            if (loop && !hoverRef.current) {
                scheduleLoop()
            }
        }

        const finishReverse = () => {
            if (destroyedRef.current) return

            setBlur(0)
            disableFilter()

            if (loop && !hoverRef.current) {
                scheduleLoop()
            }
        }

        timeline.eventCallback("onComplete", finishForward)

        timeline.eventCallback("onReverseComplete", finishReverse)

        const playForward = () => {
            if (destroyedRef.current || !timeline) {
                return
            }

            clearTimer()
            enableFilter()

            direction = -1

            timeline.play()
        }

        const playReverse = () => {
            if (destroyedRef.current || !timeline) {
                return
            }

            clearTimer()
            enableFilter()

            direction = 1

            timeline.reverse()
        }

        const handlePointerEnter = () => {
            if (!hover) return

            hoverRef.current = true
            clearTimer()

            playForward()
        }

        const handlePointerLeave = () => {
            if (!hover) return

            hoverRef.current = false

            playReverse()
        }

        if (hover) {
            container.addEventListener("pointerenter", handlePointerEnter)

            container.addEventListener("pointerleave", handlePointerLeave)
        }

        if (loop && !hoverRef.current) {
            scheduleLoop()
        }

        return () => {
            destroyedRef.current = true
            hoverRef.current = false

            clearTimer()

            container.removeEventListener("pointerenter", handlePointerEnter)

            container.removeEventListener("pointerleave", handlePointerLeave)

            if (timeline) {
                timeline.eventCallback("onComplete", null)

                timeline.eventCallback("onReverseComplete", null)

                timeline.kill()
                timeline = null
            }

            gsap.killTweensOf(state)
            gsap.killTweensOf(textAElement)
            gsap.killTweensOf(textBElement)

            disableFilter()
            setBlur(0)

            textAElement.style.transform = ""
            textBElement.style.transform = ""
        }
    }, [
        variant,
        textA,
        textB,
        blurAmount,
        animationDuration,
        slideAmount,
        holdDuration,
        loop,
        hover,
        startOnSecondText,
        isStatic,
        reducedMotion,
        filterId,
    ])

    const typography = getTypography(font)

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                color,
                cursor: hover ? "pointer" : "default",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: hover ? "manipulation" : "auto",
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 140 28"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
                aria-hidden="true"
            >
                <defs>
                    <filter
                        id={filterId}
                        x="-50%"
                        y="-100%"
                        width="200%"
                        height="300%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feGaussianBlur
                            ref={blurRef}
                            in="SourceGraphic"
                            stdDeviation="0"
                            result="blur"
                        />

                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values={config.matrix}
                            result="goo"
                        />

                        <feComposite
                            in="SourceGraphic"
                            in2="goo"
                            operator="atop"
                        />
                    </filter>
                </defs>

                <g ref={groupRef}>
                    <text
                        ref={textARef}
                        x={textX}
                        y="14"
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        fill="currentColor"
                        style={{
                            ...typography,
                            transformBox: "fill-box",
                            transformOrigin: "center center",
                        }}
                    >
                        {textA}
                    </text>

                    <text
                        ref={textBRef}
                        x={textX}
                        y="14"
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        fill="currentColor"
                        opacity={0}
                        style={{
                            ...typography,
                            transformBox: "fill-box",
                            transformOrigin: "center center",
                        }}
                    >
                        {textB}
                    </text>
                </g>
            </svg>
        </div>
    )
}

KarimSaifGooeyText.displayName = "Karim Saif Gooey Text"

KarimSaifGooeyText.defaultProps = {
    variant: "morph",
    textA: "Hey Framer",
    textB: "Karim Saif",
    font: {
        textAlign: "center",
        fontSize: 16,
        lineHeight: 1,
        variant: "Bold",
    },
    color: "#000000",
    blurAmount: 1,
    animationDuration: 1,
    slideAmount: 8,
    holdDuration: 900,
    loop: true,
    hover: true,
    startOnSecondText: false,
}

addPropertyControls(KarimSaifGooeyText, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["morph", "slide-x", "slide-y"],
        optionTitles: ["Morph", "Slide X", "Slide Y"],
        defaultValue: "morph",
        description: "Choose the gooey transition style.",
    },

    textA: {
        type: ControlType.String,
        title: "Text A",
        defaultValue: "Hey Framer",
        description: "Set the first text state.",
    },

    textB: {
        type: ControlType.String,
        title: "Text B",
        defaultValue: "Karim Saif",
        description: "Set the second text state.",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            textAlign: "center",
            fontSize: 16,
            lineHeight: 1,
            variant: "Bold",
        },
        defaultFontType: "sans-serif",
        defaultFontSize: "16px",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "extended",
        description: "Choose the font and typography used by both text states.",
    },

    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
        description: "Choose the text color.",
    },

    blurAmount: {
        type: ControlType.Number,
        title: "Goo Strength",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 1,
        description: "Control the intensity of the gooey distortion.",
    },

    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.05,
        max: 5,
        step: 0.05,
        defaultValue: 1,
        unit: "s",
        description: "Control the total duration of each text transformation.",
    },

    slideAmount: {
        type: ControlType.Number,
        title: "Slide",
        min: -30,
        max: 30,
        step: 1,
        defaultValue: 8,
        unit: "px",
        hidden: ({ variant }) => variant === "morph",
        description: "Control the movement distance for Slide X and Slide Y.",
    },

    holdDuration: {
        type: ControlType.Number,
        title: "Hold",
        min: 0,
        max: 5000,
        step: 50,
        defaultValue: 900,
        unit: "ms",
        hidden: ({ loop }) => !loop,
        description: "Set the pause between automatic loop transitions.",
    },

    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Automatically alternate between Text A and Text B.",
    },

    hover: {
        type: ControlType.Boolean,
        title: "Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Use pointer enter and leave to control the transition. Automatic looping resumes after hover.",
    },

    startOnSecondText: {
        type: ControlType.Boolean,
        title: "Start B",
        defaultValue: false,
        enabledTitle: "B",
        disabledTitle: "A",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

export default KarimSaifGooeyText
