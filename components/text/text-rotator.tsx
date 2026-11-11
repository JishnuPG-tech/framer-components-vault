import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    staticText: string
    staticFont: any
    staticSize: number
    staticWeight: number
    staticColor: string
    staticSpacing: number

    words: string[]
    rotatingFont: any
    rotatingSize: number
    rotatingWeight: number
    rotatingColor: string
    rotatingSpacing: number

    interval: number
    animation: "Fade" | "Slide" | "Blur"
    transitionDuration: number
    gap: number
}

export default function TextRotator(props: Props) {
    const {
        staticText,
        staticFont,
        staticSize,
        staticWeight,
        staticColor,
        staticSpacing,
        words,
        rotatingFont,
        rotatingSize,
        rotatingWeight,
        rotatingColor,
        rotatingSpacing,
        interval,
        animation,
        transitionDuration,
        gap,
    } = props

    const validWords = words.filter((word) => word.trim() !== "")

    const [index, setIndex] = React.useState(0)

    const wordsKey = validWords.join("|")

    React.useEffect(() => {
        setIndex(0)

        if (validWords.length <= 1) return

        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % validWords.length)
        }, interval * 1000)

        return () => clearInterval(timer)
    }, [interval, wordsKey])

    const currentIndex = validWords.length > 0 ? index % validWords.length : 0

    const animations = {
        Fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
        },
        Slide: {
            initial: { opacity: 0, y: 15 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -15 },
        },
        Blur: {
            initial: { opacity: 0, filter: "blur(8px)" },
            animate: { opacity: 1, filter: "blur(0px)" },
            exit: { opacity: 0, filter: "blur(8px)" },
        },
    }

    const currentAnimation = animations[animation] || animations.Fade

    const longestWord = validWords.reduce(
        (longest, word) => (word.length > longest.length ? word : longest),
        ""
    )

    const staticStyle: React.CSSProperties = {
        ...staticFont,
        fontSize: `${staticSize}px`,
        fontWeight: staticWeight,
        color: staticColor,
        letterSpacing: `${staticSpacing}px`,
        lineHeight: 1.2,
        whiteSpace: "pre-wrap",
        flexShrink: 0,
    }

    const rotatingStyle: React.CSSProperties = {
        ...rotatingFont,
        fontSize: `${rotatingSize}px`,
        fontWeight: rotatingWeight,
        color: rotatingColor,
        letterSpacing: `${rotatingSpacing}px`,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "baseline",
                gap: `${gap}px`,
                overflow: "hidden",
            }}
        >
            {/* STATIC TEXT */}
            {staticText && <span style={staticStyle}>{staticText}</span>}

            {/* ROTATING TEXT */}
            {validWords.length > 0 && (
                <span
                    style={{
                        display: "inline-grid",
                        gridTemplateColumns: "max-content",
                        gridTemplateRows: "max-content",
                        flexShrink: 0,
                        minWidth: 0,
                    }}
                >
                    {/* Hidden word reserves maximum width */}
                    <span
                        aria-hidden="true"
                        style={{
                            ...rotatingStyle,
                            gridArea: "1 / 1",
                            visibility: "hidden",
                            pointerEvents: "none",
                        }}
                    >
                        {longestWord}
                    </span>

                    {/* Animated word */}
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={currentIndex}
                            initial={currentAnimation.initial}
                            animate={currentAnimation.animate}
                            exit={currentAnimation.exit}
                            transition={{
                                duration: transitionDuration,
                                ease: "easeInOut",
                            }}
                            style={{
                                ...rotatingStyle,
                                gridArea: "1 / 1",
                            }}
                        >
                            {validWords[currentIndex]}
                        </motion.span>
                    </AnimatePresence>
                </span>
            )}
        </div>
    )
}

TextRotator.defaultProps = {
    staticText: "Need help with your",
    staticSize: 48,
    staticWeight: 600,
    staticColor: "#000000",
    staticSpacing: -1,

    words: ["website?", "landing page?", "Framer project?"],
    rotatingSize: 48,
    rotatingWeight: 600,
    rotatingColor: "#7BEE1F",
    rotatingSpacing: -1,

    interval: 2,
    animation: "Slide",
    transitionDuration: 0.35,
    gap: 8,
}

addPropertyControls(TextRotator, {
    staticText: {
        type: ControlType.String,
        title: "Static Text",
        defaultValue: "Need help with your",
    },

    staticFont: {
        type: ControlType.Font,
        title: "Static Font",
        controls: "extended",
    },

    staticSize: {
        type: ControlType.Number,
        title: "Static Size",
        defaultValue: 48,
        min: 10,
        max: 160,
        step: 1,
    },

    staticWeight: {
        type: ControlType.Number,
        title: "Static Weight",
        defaultValue: 600,
        min: 100,
        max: 900,
        step: 100,
    },

    staticColor: {
        type: ControlType.Color,
        title: "Static Color",
        defaultValue: "#000000",
    },

    staticSpacing: {
        type: ControlType.Number,
        title: "Static Spacing",
        defaultValue: -1,
        min: -5,
        max: 20,
        step: 0.1,
    },

    words: {
        type: ControlType.Array,
        title: "Rotating Words",
        control: {
            type: ControlType.String,
            defaultValue: "website?",
        },
        defaultValue: ["website?", "landing page?", "Framer project?"],
    },

    rotatingFont: {
        type: ControlType.Font,
        title: "Rotating Font",
        controls: "extended",
    },

    rotatingSize: {
        type: ControlType.Number,
        title: "Rotating Size",
        defaultValue: 48,
        min: 10,
        max: 160,
        step: 1,
    },

    rotatingWeight: {
        type: ControlType.Number,
        title: "Rotating Weight",
        defaultValue: 600,
        min: 100,
        max: 900,
        step: 100,
    },

    rotatingColor: {
        type: ControlType.Color,
        title: "Rotating Color",
        defaultValue: "#7BEE1F",
    },

    rotatingSpacing: {
        type: ControlType.Number,
        title: "Rotating Spacing",
        defaultValue: -1,
        min: -5,
        max: 20,
        step: 0.1,
    },

    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
    },

    animation: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["Fade", "Slide", "Blur"],
        optionTitles: ["Fade", "Slide", "Blur"],
        defaultValue: "Slide",
    },

    transitionDuration: {
        type: ControlType.Number,
        title: "Transition",
        defaultValue: 0.35,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },

    gap: {
        type: ControlType.Number,
        title: "Text Gap",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
    },
})
