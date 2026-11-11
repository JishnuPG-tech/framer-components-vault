import * as React from "react"
import {
    motion,
    useScroll,
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


// Interactive Animated Line Component (Only runs in live client viewports)
function AnimatingLine({
    lineText,
    index,
    totalLines,
    scrollYProgress,
    textStyles,
    wipeColor,
}) {
    const lineRef = React.useRef<HTMLDivElement>(null)

    const start = (index / totalLines) * 0.5
    const end = start + 0.35

    const wipeX = useTransform(scrollYProgress, [start, end], ["-102%", "102%"])

    const wipeOpacity = useTransform(
        scrollYProgress,
        [Math.max(0, start - 0.01), start, end, Math.min(1, end + 0.01)],
        [0, 1, 1, 0]
    )

    const textRevealPercent = useTransform(
        scrollYProgress,
        [start, end],
        [0, 100]
    )
    const textClipPath = useMotionTemplate`inset(0px ${useTransform(textRevealPercent, (v) => 100 - v)}% 0px 0px)`
    const textX = useTransform(scrollYProgress, [start, end], [-15, 0])

    return (
        <div
            ref={lineRef}
            style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                display: "block",
                paddingBottom: "8px",
                marginBottom: "4px",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: wipeColor,
                    x: wipeX,
                    opacity: wipeOpacity,
                    zIndex: 2,
                    pointerEvents: "none",
                    willChange: "transform, opacity",
                }}
            />

            <motion.div
                style={{
                    ...textStyles,
                    x: textX,
                    clipPath: textClipPath,
                    zIndex: 1,
                }}
            >
                {lineText}
            </motion.div>
        </div>
    )
}

export default function DynamicWipeReveal(props) {
    const {
        lines,
        fontSize,
        textColor,
        wipeColor,
        fontFamily,
        fontWeight,
        lineHeight,
        textTransform,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const textStyles: React.CSSProperties = {
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        fontWeight: fontWeight,
        lineHeight: lineHeight,
        color: textColor,
        textTransform: textTransform as React.CSSProperties["textTransform"], // Dynamically configured
        letterSpacing: "-0.02em",
        margin: 0,
    }

    const activeLines = lines
        ? lines.filter((line) => line && line.trim() !== "")
        : []

    // Static fallback for Framer canvas & exports (Passes Marketplace sanity check)
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "transparent",
                }}
            >
                {activeLines.map((lineContent, idx) => (
                    <div
                        key={`static-${idx}`}
                        style={{
                            position: "relative",
                            width: "100%",
                            display: "block",
                            paddingBottom: "8px",
                            marginBottom: "4px",
                        }}
                    >
                        <div style={textStyles}>{lineContent}</div>
                    </div>
                ))}
            </div>
        )
    }

    // Scroll engine activation
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 75%", "end 35%"],
    })

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "transparent",
            }}
        >
            {activeLines.map((lineContent, idx) => (
                <AnimatingLine
                    key={`${lineContent}-${idx}`}
                    lineText={lineContent}
                    index={idx}
                    totalLines={activeLines.length}
                    scrollYProgress={scrollYProgress}
                    textStyles={textStyles}
                    wipeColor={wipeColor}
                />
            ))}
        </div>
    )
}

DynamicWipeReveal.defaultProps = {
    lines: ["Boring art", "never sparked", "a beautiful", "revolution."],
    fontSize: 56,
    textColor: "#F5F5FA",
    wipeColor: "#FF5A36",
    fontFamily: "Inter, sans-serif",
    fontWeight: 800,
    lineHeight: 1.1,
    textTransform: "none",
}

addPropertyControls(DynamicWipeReveal, {
    lines: {
        type: ControlType.Array,
        title: "Text Lines",
        control: {
            type: ControlType.String,
            placeholder: "Enter text line...",
        },
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: [
            "None (As typed)",
            "UPPERCASE",
            "lowercase",
            "Capitalize",
        ],
        defaultValue: "none",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 12,
        max: 200,
    },
    textColor: { type: ControlType.Color, title: "Text Color" },
    wipeColor: { type: ControlType.Color, title: "Wipe Color" },
    fontFamily: { type: ControlType.String, title: "Font Family" },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        min: 100,
        max: 900,
        step: 100,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 0.5,
        max: 2,
        step: 0.1,
    },
})
