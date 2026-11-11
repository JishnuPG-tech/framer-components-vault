import { motion, useScroll, useTransform, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo } from "react"

export default function ScrollingArrow(props) {
    const { color, startHeight, headSize, thickness, scale } = props

    const isStaticRenderer = useIsStaticRenderer()
    const isEditorOrStaticTarget =
        isStaticRenderer ||
        [
            RenderTarget.canvas,
            RenderTarget.export,
            RenderTarget.thumbnail,
        ].includes(RenderTarget.current())

    const { scrollYProgress } = useScroll({
        offset: ["start start", "end end"],
    })

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    })

    // Memoize tipY — pure function of headSize, startHeight; never changes at runtime
    const tipY = useMemo(
        () => startHeight + headSize + 10,
        [startHeight, headSize]
    )

    // Tail shrinks from startHeight → 0 as user scrolls
    const tailHeight = useTransform(smoothProgress, [0, 1], [startHeight, 0])

    // tailTopY is always derived from tailHeight (hook called unconditionally)
    const tailTopYAnimated = useTransform(tailHeight, (latest) => tipY - latest)

    // Fade out over the last 3% of scroll
    const opacityAnimated = useTransform(
        scrollYProgress,
        [0, 0.97, 1],
        [1, 1, 0]
    )

    // In editor/static targets: pin tail top and keep fully opaque
    const tailTopY = isEditorOrStaticTarget
        ? tipY - startHeight
        : tailTopYAnimated
    const opacity = isEditorOrStaticTarget ? 1 : opacityAnimated

    // SVG path for the arrowhead tip (memoized — only changes when headSize/tipY changes)
    const tipPath = useMemo(() => {
        const arm = headSize / 1.5
        return `M ${headSize - arm} ${tipY - arm} L ${headSize} ${tipY} L ${headSize + arm} ${tipY - arm}`
    }, [headSize, tipY])

    return (
        <motion.div
            style={{
                ...containerStyle,
                height: tipY + 10,
                opacity,
                scale,
            }}
        >
            <svg
                width={headSize * 2}
                height="100%"
                viewBox={`0 0 ${headSize * 2} ${tipY + 10}`}
                fill="none"
                style={{ overflow: "visible" }}
            >
                {/* Animated tail — draws upward from the tip */}
                <motion.line
                    x1={headSize}
                    y1={tipY}
                    x2={headSize}
                    y2={tailTopY}
                    stroke={color}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                />

                {/* Static arrowhead — fixed at the bottom */}
                <path
                    d={tipPath}
                    stroke={color}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </motion.div>
    )
}

ScrollingArrow.defaultProps = {
    color: "#000000",
    startHeight: 200,
    thickness: 2,
    headSize: 20,
    scale: 1,
}

addPropertyControls(ScrollingArrow, {
    color: { type: ControlType.Color, title: "Color" },
    startHeight: {
        type: ControlType.Number,
        title: "Max Length",
        min: 50,
        max: 800,
    },
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        min: 1,
        max: 20,
    },
    headSize: {
        type: ControlType.Number,
        title: "Arrow Tip Size",
        min: 5,
        max: 100,
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.1,
        max: 2,
        step: 0.1,
    },
})

const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    width: "50px",
    pointerEvents: "none" as const,
}
