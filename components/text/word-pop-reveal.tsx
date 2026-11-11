import React, { useRef, useState, useEffect, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

// ─── CSS Generator ────────────────────────────────────────────────────────────

const generateCSS = (id, color, duration) => `
.reveal-container-${id} {
    display: block;
    word-break: break-word;
}
.reveal-container-${id} .wr {
    display: inline-block;
    position: relative;
}
.reveal-container-${id} .wr-text {
    display: inline-block;
    color: transparent;
}
.reveal-container-${id} .wr[data-side="left"] .wr-text { transform-origin: left bottom; }
.reveal-container-${id} .wr[data-side="right"] .wr-text { transform-origin: right bottom; }

.reveal-container-${id} .wr .wr-text::before {
    content: "";
    position: absolute;
    width: 0.12em;
    height: 0.12em;
    background: ${color};
    bottom: 0.02em;
    visibility: hidden;
    scale: 1;
}

.reveal-container-${id} .wr[data-side="left"] .wr-text::before { 
    right: 100%; 
    transform-origin: right bottom; 
}
.reveal-container-${id} .wr[data-side="right"] .wr-text::before { 
    left: calc(100% + 0.06em); 
    transform-origin: left bottom; 
}
.reveal-container-${id} .wr[data-shape="circle"] .wr-text::before { 
    border-radius: 50%; 
}

.reveal-container-${id} .wr.revealed .wr-text::before {
    animation: wr-shape-${id} ${duration}s step-end var(--wr-delay, 0s) both;
}
.reveal-container-${id} .wr.revealed .wr-text {
    animation: 
        wr-text-${id} ${duration}s step-end var(--wr-delay, 0s) forwards, 
        wr-drift-${id} ${duration * 0.25}s ease-out calc(var(--wr-delay, 0s) + ${duration * 0.55}s) both;
}

@keyframes wr-shape-${id} {
    0% { visibility: hidden; scale: 1; }
    0.5% { visibility: visible; scale: 1; }
    15% { visibility: visible; scale: 1.5; }
    30% { visibility: visible; scale: 2; }
    45% { visibility: visible; scale: 2; }
    55% { visibility: hidden; scale: 0; }
}

@keyframes wr-text-${id} {
    0%, 15% { color: transparent; transform: scale(0.35); }
    30% { color: inherit; transform: scale(0.35); }
    45% { color: inherit; transform: scale(0.65); }
    55%, 100% { color: inherit; transform: scale(1); }
}

@keyframes wr-drift-${id} {
    from { translate: calc(var(--wr-drift-dir, -1) * 0.08em) 0; }
    to { translate: 0 0; }
}
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getShape = (index, pattern) => {
    if (pattern === "circle") return "circle"
    if (pattern === "square") return "square"
    return index % 3 === 0 ? "square" : "circle"
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 100
 * @framerDisableUnlink
 */
export default function WordsPopReveal(props) {
    const {
        text,
        font,
        color,
        headingTag,
        trigger,
        reverse,
        delayAmount,
        staggerAmount,
        shapePattern,
        transition,
        style,
    } = props

    // Stable ID that survives SSR without collisions
    const id = useRef(`wpr-${Math.random().toString(36).slice(2)}`).current

    const containerRef = useRef(null)
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const isInView = useInView(containerRef, {
        once: !reverse,
        margin: "-15% 0px -15% 0px",
    })

    // Show revealed on canvas/export so designers always see legible text
    const [isRevealed, setIsRevealed] = useState(isStatic || isCanvas)

    useEffect(() => {
        if (isStatic || isCanvas) {
            setIsRevealed(true)
            return
        }

        if (trigger === "Appear") {
            setIsRevealed(true) // Fixed: Triggers immediately without arbitrary 100ms timeout
        } else if (trigger === "Scroll") {
            setIsRevealed(isInView)
        }
    }, [trigger, isInView, isStatic, isCanvas]) // Fixed: Added missing dependencies

    const words = useMemo(
        () => (text || "").trim().split(/\s+/).filter(Boolean),
        [text]
    )

    // Extract duration from Framer's native transition prop (fallback to 1s if Spring is used)
    const animDuration =
        transition?.type === "tween" ? (transition?.duration ?? 1) : 1

    // Memoize CSS string — only rebuilds when id, color, or duration changes
    const css = useMemo(
        () => generateCSS(id, color, animDuration),
        [id, color, animDuration]
    )

    const Tag = headingTag || "h1"

    return (
        <Tag
            ref={containerRef}
            aria-label={text}
            className={`reveal-container-${id}`}
            style={{
                margin: 0,
                padding: 0,
                width: "100%",
                color,
                ...font,
                ...style,
            }}
        >
            <style>{css}</style>

            {words.map((word, index) => {
                const side = index % 2 === 0 ? "left" : "right"
                const shape = getShape(index, shapePattern)
                const delay = delayAmount + index * staggerAmount
                const driftDir = side === "left" ? "-1" : "1"

                return (
                    <React.Fragment key={index}>
                        <span
                            className={`wr ${isRevealed ? "revealed" : ""}`}
                            data-side={side}
                            data-shape={shape}
                            style={{
                                "--wr-delay": `${delay.toFixed(2)}s`,
                                "--wr-drift-dir": driftDir,
                            }}
                        >
                            <span className="wr-text" aria-hidden="true">
                                {word}
                            </span>
                        </span>
                        {index < words.length - 1 && " "}
                    </React.Fragment>
                )
            })}
        </Tag>
    )
}

WordsPopReveal.displayName = "Words Pop Reveal"

WordsPopReveal.defaultProps = {
    text: "Make the new normal",
    headingTag: "h1",
    font: {
        fontFamily: "Inter",
        fontWeight: 500,
        fontSize: 64,
        lineHeight: "1.1em",
        letterSpacing: "-0.04em",
        textAlign: "center",
    },
    color: "#171717",
    trigger: "Appear",
    reverse: false,
    delayAmount: 0,
    staggerAmount: 0.12,
    shapePattern: "mixed",
    transition: {
        type: "tween",
        duration: 1,
        ease: "easeOut",
    },
}

addPropertyControls(WordsPopReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "Make the new normal",
    },
    headingTag: {
        type: ControlType.Enum,
        title: "Tag",
        defaultValue: "h1",
        options: ["h1", "h2", "h3", "h4", "p"],
        optionTitles: ["H1", "H2", "H3", "H4", "P"],
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 64,
            lineHeight: "1.1em",
            letterSpacing: "-0.04em",
            textAlign: "center",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#171717",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["Appear", "Scroll"],
        optionTitles: ["Appear", "Layer in View"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        defaultValue: "Appear",
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: false,
        hidden: (p) => p.trigger !== "Scroll",
    },
    delayAmount: {
        type: ControlType.Number,
        title: "Delay",
        unit: "s",
        min: 0,
        max: 5,
        step: 0.05,
        defaultValue: 0,
    },
    staggerAmount: {
        type: ControlType.Number,
        title: "Stagger",
        unit: "s",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.12,
    },
    shapePattern: {
        type: ControlType.Enum,
        title: "Shapes",
        options: ["mixed", "circle", "square"],
        optionTitles: ["Mixed", "Circle Only", "Square Only"],
        defaultValue: "mixed",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        description:
            "Explore [more components](https://dub.sh/daniyal-framer)\nMade by [Daniyal](https://dub.sh/daniyal-threads)",
    },
})
