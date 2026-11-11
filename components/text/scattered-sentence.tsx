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

import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useMotionValueEvent,
    useScroll,
    useInView,
} from "framer-motion"

type WordScatter = {
    x: number
    y: number
    r: number
    s: number
}

type Props = {
    sentence: string

    backgroundColor: string
    textColor: string

    font: any

    padding: string

    scatter: number
    rotation: number
    scale: number

    start: number
    end: number
    smoothness: number

    wordGap: number

    textAlign: "left" | "center" | "right"

    style?: React.CSSProperties
}

function clamp01(v: number) {
    if (!Number.isFinite(v)) return 0
    return Math.max(0, Math.min(1, v))
}

function stableRandom01(seed: number) {
    // Deterministic pseudo random in [0..1)
    const x = Math.sin(seed * 999.123 + 0.12345) * 43758.5453123
    return x - Math.floor(x)
}

function computeScatter(index: number, scatter: number, rotation: number, scale: number): WordScatter {
    const a = stableRandom01(index + 1) * Math.PI * 2
    const r = stableRandom01(index + 11)
    const x = Math.cos(a) * scatter * (0.35 + 0.65 * r)
    const y = Math.sin(a) * scatter * (0.35 + 0.65 * r)

    const r2 = (stableRandom01(index + 21) * 2 - 1) * rotation
    const s2 = 1 + (stableRandom01(index + 31) * 2 - 1) * scale

    return { x, y, r: r2, s: s2 }
}

function WordSpan(props: {
    word: string
    index: number
    scatter: WordScatter
    progress: any
    textColor: string
    font: any
}) {
    const { word, scatter, progress, textColor, font } = props

    const x = useTransform(progress, [0, 1], [scatter.x, 0])
    const y = useTransform(progress, [0, 1], [scatter.y, 0])
    const r = useTransform(progress, [0, 1], [scatter.r, 0])
    const s = useTransform(progress, [0, 1], [scatter.s, 1])

    return (
        <motion.span
            style={{
                display: "inline-block",
                position: "relative",
                color: textColor,
                willChange: "transform",
                x,
                y,
                rotateZ: r,
                scale: s,
                ...font,
            }}
        >
            {word}
        </motion.span>
    )
}

/**
 * Scattered Sentence
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScatteredSentence(props: Props) {
    const {
        sentence,
        backgroundColor,
        textColor,
        font,
        padding,
        scatter,
        rotation,
        scale,
        start,
        end,
        smoothness,
        wordGap,
        textAlign,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = React.useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { amount: 0.15 })

    // Avoid expensive subscriptions when static-rendering (Canvas thumbnails / Export) or off-screen.
    const { scrollY } = useScroll()

    const progress = useMotionValue(1)

    // Keep the sentence aligned on initial page load (no scroll yet).
    const hasUserScrolledRef = React.useRef(false)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        // If the page loads already scrolled (e.g. anchor link), enable scroll-driven behavior immediately.
        if (window.scrollY > 0) hasUserScrolledRef.current = true
    }, [])

    // Keep spring params finite to prevent runtime issues that can cause loader timeouts.
    const damping = React.useMemo(() => {
        const s = clamp01(smoothness)
        // Higher smoothness => lower damping (more easing). Clamp to safe bounds.
        return Math.max(8, Math.min(40, 40 - Math.round(s * 22)))
    }, [smoothness])

    const easedProgress = useSpring(progress, {
        stiffness: 260,
        damping,
        mass: 0.6,
    })

    const startPct = React.useMemo(() => (Number.isFinite(start) ? start : 40), [start])
    const endPct = React.useMemo(() => (Number.isFinite(end) ? end : 40), [end])

    const updateProgressFromScroll = React.useCallback(
        (latest: number) => {
            if (isStatic) return
            if (!inView) return
            if (typeof window === "undefined") return
            if (!ref.current) return

            // Default state should be unscattered/aligned on page load.
            // Only start the scroll-driven scattering/alignment once the user actually scrolls.
            if (!hasUserScrolledRef.current) {
                if (latest <= 0) return
                hasUserScrolledRef.current = true
            }

            const rect = ref.current.getBoundingClientRect()
            const vh = Math.max(1, window.innerHeight || 1)

            // Trigger point defaults to center of the viewport.
            const triggerY = vh * 0.5

            const startDist = (startPct / 100) * vh
            const endDist = (endPct / 100) * vh
            const denom = Math.max(1, startDist + endDist)

            // progress = 0 when the component is `startDist` below trigger.
            // progress = 1 when the component is `endDist` above trigger.
            const t = clamp01((triggerY + startDist - rect.top) / denom)
            progress.set(t)
        },
        [endPct, inView, isStatic, progress, startPct],
    )

    // Ensure correct state when the page loads already scrolled (or when entering view)
    React.useEffect(() => {
        if (isStatic) return
        if (!inView) return
        updateProgressFromScroll(scrollY.get())
    }, [inView, isStatic, scrollY, updateProgressFromScroll])

    useMotionValueEvent(scrollY, "change", (latest) => {
        updateProgressFromScroll(latest)
    })

    const words = React.useMemo(() => {
        const raw = (sentence ?? "").trim()
        if (!raw) return ["Fine-tune", "the", "exact", "point", "in", "the", "viewport", "where", "the", "sentence", "becomes", "perfectly", "aligned."]
        return raw.split(/\s+/g)
    }, [sentence])

    const scatters = React.useMemo(() => {
        return words.map((_, i) => computeScatter(i, scatter, rotation, scale))
    }, [words, scatter, rotation, scale])

    const usedProgress = isStatic ? progress : easedProgress

    const justifyContent = React.useMemo(() => {
        if (textAlign === "center") return "center"
        if (textAlign === "right") return "flex-end"
        return "flex-start"
    }, [textAlign])

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding,
                boxSizing: "border-box",
                overflow: "visible",
                background: backgroundColor,
                ...style,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "1100px",
                    textAlign,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: wordGap,
                    alignItems: "baseline",
                    justifyContent,
                }}
                aria-label={words.join(" ")}
                role="text"
            >
                {words.map((word, i) => (
                    <WordSpan
                        key={`${word}-${i}`}
                        word={word}
                        index={i}
                        scatter={scatters[i]}
                        progress={usedProgress}
                        textColor={textColor}
                        font={font}
                    />
                ))}
            </div>
        </div>
    )
}

addPropertyControls(ScatteredSentence, {
    sentence: {
        type: ControlType.String,
        title: "Sentence",
        description: "Text to animate. It is automatically split into words.",
        defaultValue: "Fine-tune the exact point in the viewport where the sentence becomes perfectly aligned.",
        displayTextArea: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color of the component container.",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        description: "Color used for all words in the sentence.",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        description: "Typography for the sentence (size/weight/spacing).",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "60px",
            variant: "Semibold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
            textAlign: "left",
        },
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        description: "Alignment for the sentence container.",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        description: "Inner spacing around the sentence container.",
        defaultValue: "0px",
    },
    scatter: {
        type: ControlType.Number,
        title: "Scatter",
        description: "Maximum distance (in px) words start away from their final aligned position.",
        defaultValue: 400,
        min: 0,
        max: 1200,
        step: 1,
        unit: "px",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        description: "Max random rotation (in degrees) applied to scattered words before aligning.",
        defaultValue: 22,
        min: 0,
        max: 180,
        step: 1,
        unit: "deg",
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        description: "Max random scale variation for scattered words (0.25 = up to ±25%).",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
    },
    start: {
        type: ControlType.Number,
        title: "Start %",
        description:
            "How far (in % of viewport height) below the trigger point the alignment starts (higher = starts earlier).",
        defaultValue: 75,
        min: 0,
        max: 200,
        step: 1,
        unit: "%",
    },
    end: {
        type: ControlType.Number,
        title: "End %",
        description:
            "How far (in % of viewport height) above the trigger point the sentence becomes fully aligned (higher = finishes later).",
        defaultValue: 10,
        min: 0,
        max: 200,
        step: 1,
        unit: "%",
    },
    smoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        description: "Adds spring easing to the scroll-driven progress (higher = smoother/more eased).",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    wordGap: {
        type: ControlType.Number,
        title: "Word Gap",
        description: "Spacing between words in the final aligned sentence (also affects scattered spacing).",
        defaultValue: 8,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
})

ScatteredSentence.displayName = "Scattered Sentence"
