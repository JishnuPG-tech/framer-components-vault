import * as React from "react"
import { useLayoutEffect, useRef } from "react"
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
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

export interface ScrollWordHighlightProps {
    prefixText: string
    items: string[]
    screenReaderText: string
    // Animation
    animationMode: "fade-in" | "spotlight" | "slide"
    inactiveOpacity: number
    scrubAmount: number
    // Snap
    snap: boolean
    snapDuration: number
    snapDelay: number
    snapEase: string
    // Prefix placement
    prefixPlacement: "top" | "middle" | "bottom"
    placementOffset: number
    // Visual
    backgroundColor: string
    textColor: string
    // Typography (Framer Font control — CSS properties object)
    font: React.CSSProperties
    // Layout
    gap: number
    style?: React.CSSProperties
}

/** Parse fontSize from a number or a CSS string like "96px" / "96". */
function parseFontSize(value: unknown, fallback: number): number {
    if (typeof value === "number" && isFinite(value) && value > 0) return value
    if (typeof value === "string") {
        const n = parseFloat(value)
        if (isFinite(n) && n > 0) return n
    }
    return fallback
}

/**
 * Parse lineHeight as a unitless multiplier from a number or CSS string:
 *   1.1   → 1.1
 *   "1.1" → 1.1
 *   "110%" → 1.1
 *   "136px" → 136 / fontSizePx
 */
function parseLineHeight(
    value: unknown,
    fontSizePx: number,
    fallback: number
): number {
    if (typeof value === "number" && isFinite(value) && value > 0) return value
    if (typeof value === "string") {
        if (value.endsWith("%")) {
            const n = parseFloat(value)
            if (isFinite(n) && n > 0) return n / 100
        }
        if (value.endsWith("px")) {
            const n = parseFloat(value)
            if (isFinite(n) && n > 0 && fontSizePx > 0) return n / fontSizePx
        }
        const n = parseFloat(value)
        if (isFinite(n) && n > 0) return n
    }
    return fallback
}

/**
 * Scroll Triggered Word Highlight
 *
 * Three animation modes:
 * - fade-in   : words fade from inactiveOpacity → 1 and stay lit
 * - spotlight : words fade inactiveOpacity → 1 → inactiveOpacity (only the aligned word is fully visible)
 * - slide     : a single clip window reveals one word at a time (slot-machine effect)
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScrollWordHighlight(props: ScrollWordHighlightProps) {
    const {
        prefixText,
        items,
        screenReaderText,
        animationMode,
        prefixPlacement,
        placementOffset,
        inactiveOpacity,
        scrubAmount,
        snap,
        snapDuration,
        snapDelay,
        snapEase,
        backgroundColor,
        textColor,
        font,
        gap,
        style,
    } = props

    const sectionRef = useRef<HTMLElement | null>(null)
    const listRef = useRef<HTMLUListElement | null>(null)

    const safeItems = (items || []).filter(Boolean)

    // Extract numeric values needed for scroll calculations.
    // ControlType.Font can return fontSize / lineHeight as a number OR a string
    // (e.g. "96px", "1.1", "110%"), so we parse all formats explicitly.
    const fontSizePx: number = parseFontSize(font?.fontSize, 124)
    const fontLineHeight: number = parseLineHeight(
        font?.lineHeight,
        fontSizePx,
        1.1
    )
    const lineHeightPx = fontSizePx * fontLineHeight
    const halfLine = lineHeightPx / 2

    // CSS top for sticky elements
    const stickyTop =
        prefixPlacement === "top"
            ? `${placementOffset}px`
            : prefixPlacement === "bottom"
              ? `calc(100vh - ${lineHeightPx}px - ${placementOffset}px)`
              : `calc(50vh - ${halfLine}px)`

    useLayoutEffect(() => {
        const list = listRef.current
        if (!list || safeItems.length === 0) return

        // Pixel position of the prefix center from the viewport top
        const vpH = window.innerHeight
        const vpY =
            prefixPlacement === "top"
                ? placementOffset + halfLine
                : prefixPlacement === "bottom"
                  ? vpH - placementOffset - halfLine
                  : vpH / 2

        // Shorthand position strings for ScrollTrigger
        const at = `${vpY}px`
        const before = `${vpY + lineHeightPx}px`
        const after = `${vpY - lineHeightPx}px`

        const ctx = gsap.context(() => {
            const nodes = Array.from(list.children) as HTMLElement[]

            if (animationMode === "fade-in") {
                nodes.forEach((el, i) => {
                    // First item is always visible so there's no visual hole on arrival
                    if (i === 0) {
                        gsap.set(el, { opacity: 1 })
                        return
                    }
                    gsap.fromTo(
                        el,
                        { opacity: inactiveOpacity },
                        {
                            opacity: 1,
                            ease: "none",
                            scrollTrigger: {
                                trigger: el,
                                start: `center ${before}`,
                                end: `center ${at}`,
                                scrub: scrubAmount,
                            },
                        }
                    )
                })
            } else if (animationMode === "spotlight") {
                nodes.forEach((el, i) => {
                    const isFirst = i === 0
                    const isLast = i === nodes.length - 1

                    if (isFirst && isLast) {
                        gsap.set(el, { opacity: 1 })
                        return
                    }

                    if (isFirst) {
                        // Visible on arrival, fades out as it leaves center
                        gsap.fromTo(
                            el,
                            { opacity: 1 },
                            {
                                opacity: inactiveOpacity,
                                ease: "none",
                                scrollTrigger: {
                                    trigger: el,
                                    start: `center ${at}`,
                                    end: `center ${after}`,
                                    scrub: scrubAmount,
                                },
                            }
                        )
                        return
                    }

                    if (isLast) {
                        // Fades in normally, stays visible after
                        gsap.fromTo(
                            el,
                            { opacity: inactiveOpacity },
                            {
                                opacity: 1,
                                ease: "none",
                                scrollTrigger: {
                                    trigger: el,
                                    start: `center ${before}`,
                                    end: `center ${at}`,
                                    scrub: scrubAmount,
                                },
                            }
                        )
                        return
                    }

                    // Middle items: full spotlight (in → out)
                    gsap.timeline({
                        scrollTrigger: {
                            trigger: el,
                            start: `center ${before}`,
                            end: `center ${after}`,
                            scrub: scrubAmount,
                        },
                    })
                        .fromTo(
                            el,
                            { opacity: inactiveOpacity },
                            { opacity: 1, ease: "none" }
                        )
                        .to(el, { opacity: inactiveOpacity, ease: "none" })
                })
            } else if (animationMode === "slide") {
                gsap.to(list, {
                    y: -(safeItems.length - 1) * lineHeightPx,
                    ease: "none",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: `top ${vpY - halfLine}px`,
                        end: `+=${(safeItems.length - 1) * lineHeightPx}`,
                        scrub: scrubAmount,
                    },
                })
            }

            if (snap && nodes.length > 1) {
                const snapConfig = {
                    snapTo: 1 / (nodes.length - 1),
                    duration: {
                        min: Math.min(0.2, snapDuration),
                        max: snapDuration,
                    },
                    delay: snapDelay,
                    ease: snapEase,
                    directional: false,
                }

                ScrollTrigger.create(
                    animationMode === "slide"
                        ? {
                              trigger: sectionRef.current,
                              start: `top ${vpY - halfLine}px`,
                              end: `+=${(nodes.length - 1) * lineHeightPx}`,
                              snap: snapConfig,
                          }
                        : {
                              trigger: list,
                              start: `top ${vpY - halfLine}px`,
                              end: `bottom ${vpY + halfLine}px`,
                              snap: snapConfig,
                          }
                )
            }
        }, sectionRef)

        return () => ctx.revert()
    }, [
        animationMode,
        prefixPlacement,
        safeItems.join("|"),
        inactiveOpacity,
        scrubAmount,
        snap,
        snapDuration,
        snapDelay,
        snapEase,
        lineHeightPx,
    ])

    const isSlide = animationMode === "slide"

    return (
        <section
            ref={sectionRef}
            style={{
                width: "100%",
                overflow: "clip",
                ...font,
                backgroundColor,
                color: textColor,
                boxSizing: "border-box",
                ...style,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap,
                    boxSizing: "border-box",
                    // In slide mode, an explicit height provides the scroll distance
                    // while both sticky children (h2 and clip div) remain fixed.
                    ...(isSlide
                        ? { height: safeItems.length * lineHeightPx }
                        : {}),
                }}
            >
                <h2
                    style={{
                        position: "sticky",
                        top: stickyTop,
                        margin: 0,
                        font: "inherit",
                        height: "fit-content",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                    }}
                >
                    <span aria-hidden="true">{prefixText}&nbsp;</span>
                    <span style={srOnly}>
                        {screenReaderText ||
                            `${prefixText} ${safeItems.join(", ")}`}
                    </span>
                </h2>

                {isSlide ? (
                    <div
                        style={{
                            overflow: "hidden",
                            height: lineHeightPx,
                            position: "sticky",
                            top: stickyTop,
                            flex: 1,
                        }}
                    >
                        <ul
                            ref={listRef}
                            style={{
                                listStyle: "none",
                                margin: 0,
                                padding: 0,
                                willChange: "transform",
                            }}
                        >
                            {safeItems.map((item, i) => (
                                <li
                                    key={`${item}-${i}`}
                                    style={{ height: lineHeightPx }}
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <ul
                        ref={listRef}
                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                    >
                        {safeItems.map((item, i) => (
                            <li
                                key={`${item}-${i}`}
                                style={{ willChange: "opacity" }}
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    )
}

const srOnly: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
}

ScrollWordHighlight.defaultProps = {
    prefixText: "We shape",
    items: [
        "ideas",
        "brands",
        "identities",
        "interactions",
        "interfaces",
        "experiences",
    ],
    screenReaderText:
        "We shape ideas, brands, identities, interactions, interfaces, experiences",
    animationMode: "fade-in",
    prefixPlacement: "middle",
    placementOffset: 40,
    inactiveOpacity: 0.2,
    scrubAmount: 0.7,
    snap: true,
    snapDuration: 0.2,
    snapDelay: 0.02,
    snapEase: "power2.inOut",
    backgroundColor: "rgba(0, 0, 0, 0)",
    textColor: "#000000",
    font: {
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontWeight: 800,
        fontSize: 124,
        lineHeight: 1.1,
    },
    gap: 16,
}

addPropertyControls(ScrollWordHighlight, {
    prefixText: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "We shape",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        control: { type: ControlType.String, placeholder: "word" },
        defaultValue: [
            "ideas",
            "brands",
            "identities",
            "interactions",
            "interfaces",
            "experiences",
        ],
    },
    screenReaderText: {
        type: ControlType.String,
        title: "A11y Text",
        defaultValue:
            "We shape ideas, brands, identities, interactions, interfaces, experiences",
        displayTextArea: true,
    },

    // ----- Animation -----
    prefixPlacement: {
        type: ControlType.Enum,
        title: "Placement",
        options: ["top", "middle", "bottom"],
        optionTitles: ["Top", "Middle", "Bottom"],
        defaultValue: "middle",
    },
    placementOffset: {
        type: ControlType.Number,
        title: "Offset",
        defaultValue: 40,
        min: 0,
        max: 300,
        step: 4,
        unit: "px",
        hidden: (p: ScrollWordHighlightProps) => p.prefixPlacement === "middle",
    },
    animationMode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["fade-in", "spotlight", "slide"],
        optionTitles: ["Fade In", "Spotlight", "Slide"],
        defaultValue: "fade-in",
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive α",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: ScrollWordHighlightProps) => p.animationMode === "slide",
    },
    scrubAmount: {
        type: ControlType.Number,
        title: "Scrub",
        defaultValue: 0.7,
        min: 0,
        max: 1.5,
        step: 0.05,
    },

    // ----- Snap -----
    snap: {
        type: ControlType.Boolean,
        title: "Snap",
        defaultValue: true,
        description: "Snap each item to the prefix line.",
    },
    snapDuration: {
        type: ControlType.Number,
        title: "Snap Dur.",
        defaultValue: 0.2,
        min: 0.05,
        max: 0.8,
        step: 0.01,
        unit: "s",
        hidden: (p: ScrollWordHighlightProps) => !p.snap,
    },
    snapDelay: {
        type: ControlType.Number,
        title: "Snap Delay",
        defaultValue: 0.02,
        min: 0,
        max: 0.3,
        step: 0.01,
        unit: "s",
        hidden: (p: ScrollWordHighlightProps) => !p.snap,
    },
    snapEase: {
        type: ControlType.Enum,
        title: "Snap Ease",
        options: [
            "none",
            "power1.inOut",
            "power2.inOut",
            "power3.inOut",
            "power4.inOut",
            "expo.inOut",
            "sine.inOut",
        ],
        defaultValue: "power2.inOut",
        hidden: (p: ScrollWordHighlightProps) => !p.snap,
    },

    // ----- Visual -----
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0, 0, 0, 0)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },

    // ----- Typography -----
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontWeight: 800,
            fontSize: 124,
            lineHeight: 1.1,
        },
    },

    // ----- Layout -----
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
})
