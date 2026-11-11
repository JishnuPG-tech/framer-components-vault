import React, { useRef } from "react"
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
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
    useMotionValueEvent,
    type MotionValue,
    type SpringOptions,
    type Transition,
} from "framer-motion"

interface TextRevealOnScrollProps {
    text?: string
    mutedColor?: string
    primaryColor?: string
    font?: React.CSSProperties
    balance?: boolean
    replay?: boolean
    mode?: "character" | "word" | "sentence"
    style?: React.CSSProperties
    transition?: Transition
}

function toSpringOptions(transition?: Transition): SpringOptions {
    const hasSpringValues =
        typeof transition?.stiffness === "number" ||
        typeof transition?.damping === "number" ||
        typeof transition?.mass === "number"

    if (!hasSpringValues && typeof transition?.duration === "number") {
        const duration = Math.max(transition.duration, 0.05)
        return {
            stiffness: 170 / (duration * duration),
            damping: 26 / duration,
            mass: 1,
            restDelta: 0.001,
        }
    }

    return {
        stiffness:
            typeof transition?.stiffness === "number"
                ? transition.stiffness
                : 100,
        damping:
            typeof transition?.damping === "number" ? transition.damping : 30,
        mass: typeof transition?.mass === "number" ? transition.mass : 1,
        restDelta: 0.001,
    }
}

/**
 * @framerDisableUnlink
 */
export default function TextRevealOnScroll(props: TextRevealOnScrollProps) {
    const isStatic = useIsStaticRenderer()

    if (isStatic) {
        const {
            text = "Framer text reveal on scroll effect",
            primaryColor = "#000000",
            font,
            balance = true,
            style,
        } = props

        return (
            <div
                role="region"
                aria-label={text}
                style={{
                    ...style,
                    ...font,
                    textWrap: balance ? "balance" : "wrap",
                    whiteSpace: "pre-wrap",
                    display: "block",
                    color: primaryColor,
                }}
            >
                {text}
            </div>
        )
    }

    return <AnimatedTextRevealOnScroll {...props} />
}

function AnimatedTextRevealOnScroll(props: TextRevealOnScrollProps) {
    const {
        text = "Framer text reveal on scroll effect",
        mutedColor = "#888888",
        primaryColor = "#000000",
        font,
        balance = true,
        replay = true,
        mode = "word",
        style,
        transition,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end center"],
        layoutEffect: false,
    })

    const maxProgress = useMotionValue(0)
    useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
        if (latest > maxProgress.get()) {
            maxProgress.set(latest)
        }
    })

    const sourceProgress = replay ? scrollYProgress : maxProgress
    const progressToUse = useSpring(sourceProgress, toSpringOptions(transition))

    const renderText = () => {
        if (!text) return null

        let items: string[] = []

        if (mode === "character") {
            // Split string identically into characters including spaces
            items = text.split("")
        } else if (mode === "word") {
            // Split into exact word blocks and space blocks
            items = text.match(/([\S]+|\s+)/g) || []
        } else if (mode === "sentence") {
            // Split into exact sentence strings and spaces/returns
            items = text.match(/[^.!?\n]+(?:[.!?]+)?|\n|\s+/g) || []
        }

        // Count how many trackable items (non-whitespace) exist for % offsets
        let totalValids = 0
        items.forEach((item) => {
            if (item.trim().length > 0) totalValids++
        })

        let currentIdx = 0

        return items.map((itemStr, idx) => {
            // Let the DOM render straight text nodes for spaces and indents
            if (itemStr.trim().length === 0 && itemStr !== "\n") {
                return (
                    <React.Fragment key={`${mode}-space-${idx}`}>
                        {itemStr}
                    </React.Fragment>
                )
            }
            if (itemStr === "\n") {
                return <br key={`${mode}-br-${idx}`} />
            }

            const start = currentIdx / Math.max(totalValids, 1)
            const end = (currentIdx + 1) / Math.max(totalValids, 1)
            currentIdx++

            return (
                <RevealItem
                    key={`${mode}-${idx}`}
                    progress={progressToUse}
                    range={[start, end]}
                    mutedColor={mutedColor}
                    primaryColor={primaryColor}
                >
                    {itemStr}
                </RevealItem>
            )
        })
    }

    return (
        <motion.div
            ref={containerRef}
            layout
            role="region"
            aria-label={text}
            style={{
                ...style,
                ...font,
                textWrap: balance ? "balance" : "wrap",
                whiteSpace: "pre-wrap", // Handle spacing homogeneously at root
                display: "block",
                color: mutedColor, // Fallback base color
            }}
        >
            <span aria-hidden="true">{renderText()}</span>
        </motion.div>
    )
}

// Friendly display name for Framer's UI (allows spaces)
TextRevealOnScroll.displayName = "Text Reveal on Scroll"

type RevealItemProps = {
    children: React.ReactNode
    progress: MotionValue<number>
    range: [number, number]
    mutedColor: string
    primaryColor: string
}

const RevealItem = ({
    children,
    progress,
    range,
    mutedColor,
    primaryColor,
}: RevealItemProps) => {
    const color = useTransform(progress, range, [mutedColor, primaryColor])

    return <motion.span style={{ color }}>{children}</motion.span>
}

TextRevealOnScroll.defaultProps = {
    text: "Framer text reveal on scroll effect",
    mutedColor: "#888888",
    primaryColor: "#000000",
    replay: true,
    balance: true,
    mode: "word",
    font: {
        fontFamily: "Inter, sans-serif",
        fontSize: "32px",
        fontWeight: 600,
    },
    style: {
        width: "100%",
        height: "100%",
    },
    transition: { duration: 0.4 },
}

const DEMO_LINK = "https://text-reveal-on-scroll.framer.website/"

addPropertyControls(TextRevealOnScroll, {
    _info: {
        type: ControlType.Enum,
        title: "Developed by",
        options: ["kaniyanstudio"],
        optionTitles: ["KaniyanStudio"],
        displaySegmentedControl: true,
        defaultValue: "kaniyanstudio",
        description: `Made with ❤️ by [@kaniyanstudio](https://www.x.com/kaniyanstudio)\n[Live Demo](${DEMO_LINK})`,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Framer text reveal on scroll effect",
        displayTextArea: true,
    },
    mode: {
        type: ControlType.Enum,
        title: "Reveal By",
        options: ["character", "word", "sentence"],
        optionTitles: ["Character", "Word", "Sentence"],
        defaultValue: "word",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Color",
        defaultValue: "#888888",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#000000",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: true,
    },
    balance: {
        type: ControlType.Boolean,
        title: "Balance",
        defaultValue: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
    },
})
