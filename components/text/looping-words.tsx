/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * Made with 💛 by Karim Saif
 */

import React, { useRef, useEffect, useCallback, useMemo, useId } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { gsap } from "gsap"

interface LoopingWordsProps {
    words: string[]
    textColor: string
    fontSize: number
    fontWeight: number | string
    fontFamily: string
    lineHeight: number
    paddingX: number
    paddingY: number
    edgeColor: string
    edgeBorderWidth: number
    edgeBorderRadius: number
    edgeSize: number
    speed: number
    pauseDuration: number
    fadeStrength: number
    ariaLabel?: string
}

export default function LoopingWords({
    words = ["Design", "Develop", "Animate", "Create", "Inspire"],
    textColor = "#000000",
    fontSize = 32,
    fontWeight = 700,
    fontFamily = "Inter, sans-serif",
    lineHeight = 1.4,
    paddingX = 20,
    paddingY = 6,
    edgeColor = "#000000",
    edgeBorderWidth = 2,
    edgeBorderRadius = 6,
    edgeSize = 12,
    speed = 1.2,
    pauseDuration = 1.8,
    fadeStrength = 32,
    ariaLabel = "Looping words headline",
}: LoopingWordsProps) {
    const id = useId().replace(/:/g, "")
    const isStaticRenderer = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const wordListRef = useRef<HTMLUListElement>(null)
    const edgeElementRef = useRef<HTMLDivElement>(null)
    const timelineRef = useRef<gsap.core.Timeline | null>(null)
    const currentIndexRef = useRef(0)

    const singleItemHeight = Math.round(fontSize * lineHeight)
    const totalViewportHeight = singleItemHeight * 3
    const selectorHeight = singleItemHeight + paddingY * 2

    // Build a minimum safe buffer of 8 items so shifting never empties the 3-row viewport
    const normalizedWords = useMemo(() => {
        const safe =
            words && words.length > 0
                ? words.filter((w) => typeof w === "string" && w.trim() !== "")
                : ["Karim Saif"]
        const fallback = safe.length > 0 ? safe : ["Karim Saif"]

        let padded = [...fallback]
        while (padded.length < 8) {
            padded = [...padded, ...fallback]
        }
        return padded
    }, [words])

    const totalWords = normalizedWords.length

    const updateEdgeWidth = useCallback(() => {
        if (isStaticRenderer) return

        const wordList = wordListRef.current
        const edgeElement = edgeElementRef.current
        if (!wordList || !edgeElement) return

        // Target the element entering the center slot
        const centerIndex =
            (currentIndexRef.current + 1) % wordList.children.length
        const centerItem = wordList.children[centerIndex] as HTMLElement

        if (centerItem) {
            const textElement = centerItem.querySelector("span") || centerItem
            const textWidth = textElement.getBoundingClientRect().width
            const targetWidth = Math.ceil(textWidth + paddingX * 2)

            gsap.to(edgeElement, {
                width: `${targetWidth}px`,
                duration: 0.45,
                ease: "expo.out",
                overwrite: "auto",
            })
        }
    }, [paddingX, isStaticRenderer])

    const stepWord = useCallback(() => {
        if (isStaticRenderer) return

        const wordList = wordListRef.current
        if (!wordList) return

        currentIndexRef.current += 1
        const targetY = -singleItemHeight * currentIndexRef.current

        gsap.to(wordList, {
            y: targetY,
            duration: speed,
            ease: "elastic.out(1, 0.85)",
            onStart: updateEdgeWidth,
            onComplete: () => {
                // Recycle leading DOM node once we scroll past the threshold
                if (currentIndexRef.current >= totalWords - 3) {
                    if (wordList.children.length > 0) {
                        wordList.appendChild(wordList.children[0])
                        currentIndexRef.current -= 1
                        gsap.set(wordList, {
                            y: -singleItemHeight * currentIndexRef.current,
                        })
                    }
                }
            },
        })
    }, [singleItemHeight, speed, updateEdgeWidth, totalWords, isStaticRenderer])

    useEffect(() => {
        const container = containerRef.current
        const wordList = wordListRef.current

        currentIndexRef.current = 0

        // Reset to initial deterministic static layout position
        if (wordList) {
            gsap.set(wordList, { y: 0 })
        }

        // Halt continuous timelines, observers, and DOM mutations in static render context
        if (isStaticRenderer || !container) return

        updateEdgeWidth()

        const tl = gsap.timeline({ repeat: -1, delay: 0.4 })
        tl.call(stepWord).to({}, { duration: Math.max(0.2, pauseDuration) })
        timelineRef.current = tl

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    timelineRef.current?.play()
                } else {
                    timelineRef.current?.pause()
                }
            },
            { threshold: 0.05 }
        )

        observer.observe(container)

        return () => {
            observer.disconnect()
            tl.kill()

            if (wordList) gsap.killTweensOf(wordList)
            if (edgeElementRef.current)
                gsap.killTweensOf(edgeElementRef.current)
        }
    }, [
        stepWord,
        updateEdgeWidth,
        pauseDuration,
        normalizedWords,
        isStaticRenderer,
    ])

    return (
        <section
            ref={containerRef}
            aria-label={ariaLabel}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: totalViewportHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <style>{`
                .lw-root-${id} {
                    position: relative;
                    width: 100%;
                    height: ${totalViewportHeight}px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .lw-viewport-${id} {
                    position: relative;
                    height: ${totalViewportHeight}px;
                    width: 100%;
                    overflow: hidden;
                    display: flex;
                    justify-content: center;
                    -webkit-mask-image: linear-gradient(
                        to bottom,
                        transparent 0%,
                        black ${fadeStrength}%,
                        black ${100 - fadeStrength}%,
                        transparent 100%
                    );
                    mask-image: linear-gradient(
                        to bottom,
                        transparent 0%,
                        black ${fadeStrength}%,
                        black ${100 - fadeStrength}%,
                        transparent 100%
                    );
                }
                .lw-list-${id} {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    will-change: transform;
                }
                .lw-item-${id} {
                    height: ${singleItemHeight}px;
                    min-height: ${singleItemHeight}px;
                    max-height: ${singleItemHeight}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    white-space: nowrap;
                    width: 100%;
                    box-sizing: border-box;
                }
                .lw-text-${id} {
                    margin: 0;
                    padding: 0;
                    color: ${textColor};
                    font-size: ${fontSize}px;
                    font-weight: ${fontWeight};
                    font-family: ${fontFamily};
                    line-height: 1;
                    letter-spacing: -0.02em;
                    text-align: center;
                    user-select: none;
                    display: inline-block;
                }
                .lw-selector-${id} {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    height: ${selectorHeight}px;
                    pointer-events: none;
                    z-index: 3;
                    box-sizing: border-box;
                }
                .lw-edge-${id} {
                    position: absolute;
                    width: ${edgeSize}px;
                    height: ${edgeSize}px;
                    border-color: ${edgeColor};
                    border-style: solid;
                }
                .lw-edge-${id}.is-tl {
                    top: 0;
                    left: 0;
                    border-width: ${edgeBorderWidth}px 0 0 ${edgeBorderWidth}px;
                    border-top-left-radius: ${edgeBorderRadius}px;
                }
                .lw-edge-${id}.is-tr {
                    top: 0;
                    right: 0;
                    border-width: ${edgeBorderWidth}px ${edgeBorderWidth}px 0 0;
                    border-top-right-radius: ${edgeBorderRadius}px;
                }
                .lw-edge-${id}.is-bl {
                    bottom: 0;
                    left: 0;
                    border-width: 0 0 ${edgeBorderWidth}px ${edgeBorderWidth}px;
                    border-bottom-left-radius: ${edgeBorderRadius}px;
                }
                .lw-edge-${id}.is-br {
                    bottom: 0;
                    right: 0;
                    border-width: 0 ${edgeBorderWidth}px ${edgeBorderWidth}px 0;
                    border-bottom-right-radius: ${edgeBorderRadius}px;
                }
            `}</style>

            <div className={`lw-root-${id}`}>
                <div className={`lw-viewport-${id}`}>
                    <ul ref={wordListRef} className={`lw-list-${id}`}>
                        {normalizedWords.map((word, index) => (
                            <li
                                key={`${word}-${index}`}
                                className={`lw-item-${id}`}
                            >
                                <span className={`lw-text-${id}`}>{word}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div ref={edgeElementRef} className={`lw-selector-${id}`}>
                    <div className={`lw-edge-${id} is-tl`} />
                    <div className={`lw-edge-${id} is-tr`} />
                    <div className={`lw-edge-${id} is-bl`} />
                    <div className={`lw-edge-${id} is-br`} />
                </div>
            </div>
        </section>
    )
}

addPropertyControls(LoopingWords, {
    words: {
        type: ControlType.Array,
        title: "Words",
        control: { type: ControlType.String },
        defaultValue: ["Design", "Develop", "Animate", "Create", "Inspire"],
        description: "List of words to rotate through seamlessly in loop.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 32,
        min: 14,
        max: 140,
        step: 1,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: ["300", "400", "500", "600", "700", "800", "900"],
        optionTitles: [
            "Light (300)",
            "Regular (400)",
            "Medium (500)",
            "Semi Bold (600)",
            "Bold (700)",
            "Extra Bold (800)",
            "Black (900)",
        ],
        defaultValue: "700",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.4,
        min: 1,
        max: 3,
        step: 0.1,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
    },
    edgeColor: {
        type: ControlType.Color,
        title: "Edge Color",
        defaultValue: "#000000",
    },
    edgeSize: {
        type: ControlType.Number,
        title: "Edge Size",
        defaultValue: 12,
        min: 4,
        max: 30,
        step: 1,
        unit: "px",
    },
    edgeBorderWidth: {
        type: ControlType.Number,
        title: "Edge Width",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 0.5,
        unit: "px",
    },
    edgeBorderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        defaultValue: 1.2,
        min: 0.2,
        max: 4,
        step: 0.1,
        unit: "s",
    },
    pauseDuration: {
        type: ControlType.Number,
        title: "Pause Time",
        defaultValue: 1.8,
        min: 0.5,
        max: 8,
        step: 0.1,
        unit: "s",
    },
    fadeStrength: {
        type: ControlType.Number,
        title: "Fade Range",
        defaultValue: 32,
        min: 15,
        max: 45,
        step: 1,
        unit: "%",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Looping words headline",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
