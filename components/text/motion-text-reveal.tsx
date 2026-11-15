import { useRef } from "react"
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    useMotionTemplate,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ═══ Tokenizer ═════════════════════════════════════════════════════════════
function splitText(text, mode) {
    if (mode === "character") {
        return text.split(" ").flatMap((word, wi, arr) => {
            const chars = word.split("").map((char, ci) => ({
                content: char,
                key: `w${wi}c${ci}`,
                isSpace: false,
            }))
            if (wi < arr.length - 1) {
                chars.push({
                    content: "\u00A0",
                    key: `w${wi}sp`,
                    isSpace: true,
                })
            }
            return chars
        })
    }
    return text.split(" ").map((word, i) => ({
        content: word,
        key: `w${i}`,
        isSpace: false,
    }))
}

// ═══ Animated Token (scroll-linked, hooks called at top level) ═════════════
function AnimatedToken({
    children,
    progress,
    range,
    mode,
    dimOpacity,
    baseColor,
    highlightColor,
    isSpace,
}) {
    const opacity = useTransform(progress, range, [dimOpacity, 1])
    const y = useTransform(progress, range, [40, 0])
    const scale = useTransform(progress, range, [0.5, 1])
    const rotateY = useTransform(progress, [range[0] - 0.05, range[1]], [65, 0])
    const blurAmount = useTransform(progress, range, [14, 0])
    const filter = useMotionTemplate`blur(${blurAmount}px)`
    const color = useTransform(progress, range, [baseColor, highlightColor])

    if (isSpace) {
        return <span style={{ display: "inline-block" }}>{children}</span>
    }

    const needsClip = mode === "slide-mask"

    const animatedStyle = {
        display: "inline-block",
        willChange: "opacity, transform, filter",
        transformStyle: "preserve-3d",
        opacity: mode === "none" ? 1 : opacity,
        y: mode === "wave-3d" || mode === "slide-mask" ? y : 0,
        rotateY: mode === "wave-3d" ? rotateY : 0,
        filter: mode === "blur-fade" ? filter : "none",
        scale: mode === "scale-in" ? scale : 1,
        color: mode === "color-shift" ? color : undefined,
    }

    return (
        <span
            style={{
                display: "inline-block",
                overflow: needsClip ? "hidden" : "visible",
            }}
        >
            <motion.span style={animatedStyle}>{children}</motion.span>
        </span>
    )
}

// ═══ Animated Reveal (live preview / published mode) ═══════════════════════
function AnimatedReveal({
    text,
    splitMode,
    animationMode,
    dimOpacity,
    baseColor,
    highlightColor,
    scrollStart,
    scrollEnd,
    smoothing,
    overlap,
    font,
    textAlign,
    style,
}) {
    const ref = useRef(null)

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [`start ${scrollStart}`, `end ${scrollEnd}`],
    })

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 60 + (1 - smoothing) * 240,
        damping: 20 + smoothing * 30,
        mass: 0.4,
    })

    const tokens = splitText(text, splitMode)
    const totalTokens = Math.max(tokens.filter((t) => !t.isSpace).length, 1)

    let tokenIndex = -1

    return (
        <motion.div
            ref={ref}
            style={{
                ...style,
                ...font,
                display: "flex",
                flexWrap: "wrap",
                columnGap: splitMode === "character" ? "0px" : "0.28em",
                rowGap: "0.1em",
                textAlign,
                color: baseColor,
                perspective: "800px",
                width: "100%",
            }}
        >
            {tokens.map((token) => {
                if (!token.isSpace) tokenIndex++
                const stepSize = 1 / totalTokens
                const start = tokenIndex * stepSize
                const end = Math.min(start + stepSize * overlap, 1)

                return (
                    <AnimatedToken
                        key={token.key}
                        progress={smoothProgress}
                        range={[start, end]}
                        mode={animationMode}
                        dimOpacity={dimOpacity}
                        baseColor={baseColor}
                        highlightColor={highlightColor}
                        isSpace={token.isSpace}
                    >
                        {token.content}
                    </AnimatedToken>
                )
            })}
        </motion.div>
    )
}

// ═══ Static Reveal (canvas / export — no scroll, final state) ══════════════
function StaticReveal({
    text,
    splitMode,
    animationMode,
    baseColor,
    highlightColor,
    font,
    textAlign,
    style,
}) {
    const tokens = splitText(text, splitMode)

    // In static rendering, text is shown in its FINAL revealed state
    const finalColor =
        animationMode === "color-shift" ? highlightColor : baseColor

    return (
        <div
            style={{
                ...style,
                ...font,
                display: "flex",
                flexWrap: "wrap",
                columnGap: splitMode === "character" ? "0px" : "0.28em",
                rowGap: "0.1em",
                textAlign,
                color: finalColor,
                width: "100%",
            }}
        >
            {tokens.map((token) => (
                <span key={token.key} style={{ display: "inline-block" }}>
                    {token.content}
                </span>
            ))}
        </div>
    )
}

// ═══ Main component — chooses static or animated based on context ══════════

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 200
 */
export default function ImmersiveScrollReveal(props) {
    const isStatic = useIsStaticRenderer()

    if (isStatic) {
        return <StaticReveal {...props} />
    }
    return <AnimatedReveal {...props} />
}

// ═══ Default props ═════════════════════════════════════════════════════════
ImmersiveScrollReveal.defaultProps = {
    text: "Craft experiences people remember. Every scroll tells part of the story.",
    splitMode: "word",
    animationMode: "dimming",
    dimOpacity: 0.15,
    baseColor: "#0A0A0A",
    highlightColor: "#7C5CFF",
    scrollStart: 0.85,
    scrollEnd: 0.35,
    smoothing: 0.7,
    overlap: 1.6,
    textAlign: "left",
    font: {
        fontSize: 56,
        fontWeight: 600,
        lineHeight: "1.2em",
        letterSpacing: "-0.01em",
    },
}

// ═══ Property Controls ═════════════════════════════════════════════════════
addPropertyControls(ImmersiveScrollReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue:
            "Craft experiences people remember. Every scroll tells part of the story.",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 56,
            fontWeight: 600,
            lineHeight: "1.2em",
            letterSpacing: "-0.01em",
        },
    },

    splitMode: {
        type: ControlType.Enum,
        title: "Split by",
        options: ["word", "character"],
        optionTitles: ["Word", "Character"],
        displaySegmentedControl: true,
        defaultValue: "word",
    },

    animationMode: {
        type: ControlType.Enum,
        title: "Effect",
        options: [
            "dimming",
            "color-shift",
            "blur-fade",
            "wave-3d",
            "slide-mask",
            "scale-in",
        ],
        optionTitles: [
            "Dimming",
            "Color Shift",
            "Blur Fade",
            "Wave 3D",
            "Slide Mask",
            "Scale In",
        ],
        defaultValue: "dimming",
        description:
            "**Dimming** — classic Linear/Apple feel.\n**Color Shift** — highlights with accent color.\n**Wave 3D** — rotates each word like a ribbon.",
    },

    dimOpacity: {
        type: ControlType.Number,
        title: "Base opacity",
        min: 0,
        max: 0.6,
        step: 0.01,
        defaultValue: 0.15,
        description: "Opacity of text before it's revealed.",
        hidden(props) {
            return props.animationMode === "slide-mask"
        },
    },

    baseColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0A0A0A",
    },

    highlightColor: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: "#7C5CFF",
        description: "Accent color for reveal.",
        hidden(props) {
            return props.animationMode !== "color-shift"
        },
    },

    scrollStart: {
        type: ControlType.Number,
        title: "Scroll start",
        min: 0.2,
        max: 1,
        step: 0.05,
        defaultValue: 0.85,
        description:
            "When text starts revealing. 1 = viewport bottom, 0 = viewport top.",
    },

    scrollEnd: {
        type: ControlType.Number,
        title: "Scroll end",
        min: 0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.35,
        description: "When text is fully revealed.",
    },

    overlap: {
        type: ControlType.Number,
        title: "Overlap",
        min: 1,
        max: 4,
        step: 0.1,
        defaultValue: 1.6,
        description: "Smoothness between words. Higher = softer flow.",
    },

    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.7,
        description: "Scroll inertia. 0 = instant, 1 = buttery smooth.",
    },

    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },
})
