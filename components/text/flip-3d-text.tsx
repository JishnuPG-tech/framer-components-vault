// Made with 💛 by Karim Saif
// 3D Stagger Flip Component for Framer
// Created & Maintained by Karim Saif

"use client"

import React, { memo, useCallback, useEffect, useMemo, useRef } from "react"
import { useAnimate, type AnimationOptions } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type FontStyle = React.CSSProperties & {
    fontFamily?: string
    fontWeight?: number | string
    fontSize?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
}

type StaggerFrom = "first" | "last" | "center" | "random"
type RotateDirection = "top" | "right" | "bottom" | "left"
type AnimationTrigger = "hover" | "click" | "enter"
type TextTag =
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "p"
    | "span"
    | "div"
    | "section"

type Text3DFlipProps = {
    text?: string
    font?: FontStyle
    color?: string
    flipColor?: string
    staggerDuration?: number
    staggerFrom?: StaggerFrom
    animation?: AnimationTrigger
    tag?: TextTag
    rotateDirection?: RotateDirection
    style?: React.CSSProperties
    ariaLabel?: string
}

type WordPart = {
    characters: string[]
    needsSpace: boolean
}

type CharBoxProps = {
    char: string
    color: string
    flipColor: string
    rotateDirection: RotateDirection
}

const HAS_SEGMENTER = typeof Intl !== "undefined" && "Segmenter" in Intl

const splitIntoCharacters = (text: string): string[] => {
    if (HAS_SEGMENTER) {
        const segmenter = new (Intl as any).Segmenter("en", {
            granularity: "grapheme",
        })
        return Array.from(
            segmenter.segment(text),
            ({ segment }: any) => segment
        )
    }

    return Array.from(text)
}

const SECOND_FACE_TRANSFORMS = {
    top: "rotateX(-90deg) translateZ(0.5lh)",
    right: "rotateY(90deg) translateX(50%) rotateY(-90deg) translateX(-50%) rotateY(-90deg) translateX(50%)",
    bottom: "rotateX(90deg) translateZ(0.5lh)",
    left: "rotateY(90deg) translateX(50%) rotateY(-90deg) translateX(50%) rotateY(-90deg) translateX(50%)",
} as const

const FRONT_FACE_TRANSFORMS = {
    top: "translateZ(0.5lh)",
    bottom: "translateZ(0.5lh)",
    left: "rotateY(90deg) translateX(50%) rotateY(-90deg)",
    right: "rotateY(-90deg) translateX(50%) rotateY(90deg)",
} as const

const CONTAINER_TRANSFORMS = {
    top: "translateZ(-0.5lh) rotateX(0deg)",
    bottom: "translateZ(-0.5lh) rotateX(0deg)",
    left: "rotateY(90deg) translateX(50%) rotateY(-90deg) rotateY(0deg)",
    right: "rotateY(90deg) translateX(50%) rotateY(-90deg) rotateY(0deg)",
} as const

const FLIPPED_TRANSFORMS = {
    top: "translateZ(-0.5lh) rotateX(90deg)",
    bottom: "translateZ(-0.5lh) rotateX(-90deg)",
    left: "rotateY(90deg) translateX(50%) rotateY(-90deg) rotateY(-90deg)",
    right: "rotateY(90deg) translateX(50%) rotateY(-90deg) rotateY(90deg)",
} as const

const DEFAULT_FONT: FontStyle = {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 600,
    fontSize: "64px",
    letterSpacing: "-0.02em",
    lineHeight: "1em",
    textAlign: "center",
}

// Made with 💛 by Karim Saif — Optimization & Static Renderer Safeguards

const CharBox = memo(
    ({ char, color, flipColor, rotateDirection }: CharBoxProps) => (
        <span
            className="text-3d-flip-char"
            style={{
                display: "inline-block",
                transformStyle: "preserve-3d",
                transform: CONTAINER_TRANSFORMS[rotateDirection],
                WebkitTransform: CONTAINER_TRANSFORMS[rotateDirection],
            }}
        >
            <span
                style={{
                    position: "relative",
                    display: "block",
                    height: "1lh",
                    color,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: FRONT_FACE_TRANSFORMS[rotateDirection],
                    WebkitTransform: FRONT_FACE_TRANSFORMS[rotateDirection],
                }}
            >
                {char}
            </span>
            <span
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "block",
                    height: "1lh",
                    color: flipColor,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: SECOND_FACE_TRANSFORMS[rotateDirection],
                    WebkitTransform: SECOND_FACE_TRANSFORMS[rotateDirection],
                }}
            >
                {char}
            </span>
        </span>
    )
)

CharBox.displayName = "CharBox"

export default function Text3DFlip(props: Text3DFlipProps) {
    const {
        text = "KARIM SAIF",
        font = DEFAULT_FONT,
        color = "#111111",
        flipColor = "#FFC700",
        staggerDuration = 0.05,
        staggerFrom = "first",
        animation = "hover",
        tag = "p",
        rotateDirection = "top",
        ariaLabel = "3D Flip Text Visualization",
        style,
    } = props

    const content = text || "Hover me"
    const isStaticRenderer = useIsStaticRenderer()
    const isAnimatingRef = useRef(false)
    const isMountedRef = useRef(false)
    const canTriggerHoverRef = useRef(true)
    const [scope, animate] = useAnimate()

    const restingTransform = CONTAINER_TRANSFORMS[rotateDirection]
    const flippedTransform = FLIPPED_TRANSFORMS[rotateDirection]

    useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
            isAnimatingRef.current = false
        }
    }, [])

    const characters = useMemo((): WordPart[] => {
        const normalizedContent = content.replace(/\s+/g, " ").trim()
        if (!normalizedContent) return []

        const words = normalizedContent.split(" ")
        return words.map((word, index) => ({
            characters: splitIntoCharacters(word),
            needsSpace: index !== words.length - 1,
        }))
    }, [content])

    const charOffsets = useMemo(() => {
        const offsets = [0]

        for (const word of characters) {
            offsets.push(offsets[offsets.length - 1]! + word.characters.length)
        }

        return offsets
    }, [characters])

    const totalCharsCount = useMemo(
        () => characters.reduce((sum, word) => sum + word.characters.length, 0),
        [characters]
    )

    const randomIndices = useMemo(() => {
        if (staggerFrom !== "random" || totalCharsCount === 0) return []
        const arr = Array.from({ length: totalCharsCount }, (_, i) => i)
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
        }
        return arr
    }, [staggerFrom, totalCharsCount])

    const getStaggerDelay = useCallback(
        (index: number, totalChars: number) => {
            if (staggerFrom === "first") return index * staggerDuration
            if (staggerFrom === "last") {
                return (totalChars - 1 - index) * staggerDuration
            }
            if (staggerFrom === "center") {
                const center = Math.floor(totalChars / 2)
                return Math.abs(center - index) * staggerDuration
            }

            const assignedRandomIndex = randomIndices[index] ?? index
            return assignedRandomIndex * staggerDuration
        },
        [randomIndices, staggerDuration, staggerFrom]
    )

    const playAnimation = useCallback(async () => {
        if (isAnimatingRef.current || isStaticRenderer || totalCharsCount === 0)
            return
        isAnimatingRef.current = true

        try {
            const delays = Array.from({ length: totalCharsCount }, (_, index) =>
                getStaggerDelay(index, totalCharsCount)
            )

            await animate(
                ".text-3d-flip-char",
                { transform: flippedTransform },
                {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 1,
                    delay: (index: number) => delays[index] ?? 0,
                } as AnimationOptions
            )

            if (!isMountedRef.current) return

            await animate(
                ".text-3d-flip-char",
                { transform: restingTransform },
                { duration: 0, delay: 0 }
            )
        } finally {
            if (isMountedRef.current) {
                isAnimatingRef.current = false
            }
        }
    }, [
        animate,
        flippedTransform,
        getStaggerDelay,
        isStaticRenderer,
        restingTransform,
        totalCharsCount,
    ])

    useEffect(() => {
        if (isStaticRenderer) return
        if (animation !== "enter") return
        playAnimation()
    }, [animation, content, isStaticRenderer, playAnimation])

    const handlePointerEnter = () => {
        if (isStaticRenderer) return
        if (animation !== "hover" || !canTriggerHoverRef.current) return
        canTriggerHoverRef.current = false
        playAnimation()
    }

    const handlePointerLeave = () => {
        if (isStaticRenderer) return
        canTriggerHoverRef.current = true
    }

    const handleClick = () => {
        if (isStaticRenderer) return
        if (animation !== "click") return
        playAnimation()
    }

    const textAlign =
        (font.textAlign as React.CSSProperties["textAlign"]) ?? "center"
    const justifyContent =
        textAlign === "center"
            ? "center"
            : textAlign === "right" || textAlign === "end"
              ? "flex-end"
              : "flex-start"

    return (
        <div
            onPointerEnter={
                animation === "hover" ? handlePointerEnter : undefined
            }
            onPointerLeave={
                animation === "hover" ? handlePointerLeave : undefined
            }
            onClick={animation === "click" ? handleClick : undefined}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            {React.createElement(
                tag,
                {
                    ref: scope,
                    "aria-label": ariaLabel || content,
                    style: {
                        ...font,
                        position: "relative",
                        margin: 0,
                        width: "100%",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent,
                        perspective: 800,
                        perspectiveOrigin: "center center",
                        cursor:
                            !isStaticRenderer &&
                            (animation === "hover" || animation === "click")
                                ? "pointer"
                                : "default",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        color,
                    },
                },
                characters.map((wordObject, wordIndex) => (
                    <span
                        key={wordIndex}
                        aria-hidden="true"
                        style={{
                            display: "inline-flex",
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {wordObject.characters.map((char, charIndex) => (
                            <CharBox
                                key={charOffsets[wordIndex]! + charIndex}
                                char={char}
                                color={color}
                                flipColor={flipColor}
                                rotateDirection={rotateDirection}
                            />
                        ))}
                        {wordObject.needsSpace ? (
                            <span style={{ whiteSpace: "pre" }}> </span>
                        ) : null}
                    </span>
                ))
            )}
        </div>
    )
}

// Framer Property Controls Setup
addPropertyControls(Text3DFlip, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "KARIM SAIF",
        description: "The primary string to render with 3D flip effect",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: DEFAULT_FONT,
    },
    color: {
        type: ControlType.Color,
        title: "Front Color",
        defaultValue: "#111111",
        description: "Initial text color before triggering animation",
    },
    flipColor: {
        type: ControlType.Color,
        title: "Flip Color",
        defaultValue: "#FFC700",
        description: "Color revealed during the 3D rotation face",
    },
    animation: {
        type: ControlType.Enum,
        title: "Trigger Mode",
        options: ["hover", "click", "enter"],
        optionTitles: ["On Hover", "On Click", "On Mount (Enter)"],
        defaultValue: "hover",
        description: "Choose how and when the animation triggers",
    },
    rotateDirection: {
        type: ControlType.Enum,
        title: "Flip Direction",
        options: ["top", "bottom", "left", "right"],
        optionTitles: ["Top", "Bottom", "Left", "Right"],
        defaultValue: "top",
        description: "Direction the 3D text face rotates towards",
    },
    staggerFrom: {
        type: ControlType.Enum,
        title: "Stagger Origin",
        options: ["first", "last", "center", "random"],
        optionTitles: ["First Char", "Last Char", "Center", "Random"],
        defaultValue: "first",
        description: "Starting position of character stagger sequence",
    },
    staggerDuration: {
        type: ControlType.Number,
        title: "Stagger Delay",
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
        defaultValue: 0.05,
        description: "Time offset between each character flip",
    },
    tag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "p", "span", "div", "section"],
        defaultValue: "p",
        description: "Semantic HTML element used to render text",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "3D Flip Text Visualization",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

// Made with 💛 by Karim Saif — End of Component File
