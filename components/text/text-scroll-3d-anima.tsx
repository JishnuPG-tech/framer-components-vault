// Made with 💛 by Karim Saif

import React, { useRef, useMemo } from "react"
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionTemplate,
    useReducedMotion,
    MotionValue,
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


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 200
 * @framerDisableUnlink
 */

type CharacterProps = {
    char: string
    index: number
    centerIndex: number
    smoothProgress: MotionValue<number>
    color: string
    spreadAmount: number
    rotationAmount: number
    initialBlur: number
    initialScale: number
    isStatic: boolean
    shouldReduceMotion: boolean
}

// Safely split text by grapheme clusters (supports RTL, Arabic, Emojis, and Unicode)
const splitTextIntoGraphemes = (text: string): string[] => {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        const segmenter = new Intl.Segmenter(undefined, {
            granularity: "grapheme",
        })
        return Array.from(segmenter.segment(text), (s) => s.segment)
    }
    return Array.from(text)
}

const AnimatedCharacter = ({
    char,
    index,
    centerIndex,
    smoothProgress,
    color,
    spreadAmount,
    rotationAmount,
    initialBlur,
    initialScale,
    isStatic,
    shouldReduceMotion,
}: CharacterProps) => {
    const isSpace = char === " " || char === "\u00A0"
    const distanceFromCenter = index - centerIndex

    // Motion transforms mapped to self-contained scroll progress
    const x = useTransform(
        smoothProgress,
        [0, 0.5],
        [distanceFromCenter * spreadAmount, 0]
    )
    const rotateX = useTransform(
        smoothProgress,
        [0, 0.5],
        [distanceFromCenter * rotationAmount, 0]
    )
    const z = useTransform(
        smoothProgress,
        [0, 0.5],
        [Math.abs(distanceFromCenter) * -60, 0]
    )
    const scale = useTransform(smoothProgress, [0, 0.5], [initialScale, 1])
    const opacity = useTransform(smoothProgress, [0, 0.2, 0.5], [0, 0.5, 1])
    const blur = useTransform(smoothProgress, [0, 0.5], [initialBlur, 0])
    const filter = useMotionTemplate`blur(${blur}px)`

    // Fallback for canvas static previews or reduced motion preferences
    if (isStatic || shouldReduceMotion) {
        return (
            <span
                style={{
                    display: "inline-block",
                    color: color,
                    width: isSpace ? "0.3em" : "auto",
                }}
            >
                {char}
            </span>
        )
    }

    return (
        <motion.span
            style={{
                display: "inline-block",
                x,
                rotateX,
                z,
                scale,
                opacity,
                filter,
                color: color,
                width: isSpace ? "0.3em" : "auto",
                transformStyle: "preserve-3d",
                willChange: "transform, filter, opacity",
            }}
        >
            {char}
        </motion.span>
    )
}

// Made with 💛 by Karim Saif

export default function TextScrollAnimation(props) {
    const {
        text,
        textColor,
        fontSize,
        fontFamily,
        perspective,
        spreadAmount,
        rotationAmount,
        initialBlur,
        initialScale,
        stiffness,
        damping,
        mass,
        ariaLabel,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const shouldReduceMotion = Boolean(prefersReducedMotion)

    // Element-based scroll progress targeting containerRef
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    // Custom spring physics mapping
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: stiffness ?? 120,
        damping: damping ?? 24,
        mass: mass ?? 0.8,
    })

    // Extract text into grapheme clusters for proper RTL/Unicode support
    const characters = useMemo(() => {
        const rawText = text || "SEE MORE FROM KARIM SAIF"
        return splitTextIntoGraphemes(rawText)
    }, [text])

    const centerIndex = Math.floor(characters.length / 2)

    // Robust font style object extraction
    const fontStyles = useMemo(() => {
        if (typeof fontFamily === "object" && fontFamily !== null) {
            return {
                fontFamily: fontFamily.fontFamily || "Inter, sans-serif",
                fontWeight: fontFamily.fontWeight ?? 700,
                fontStyle: fontFamily.fontStyle ?? "normal",
            }
        }
        return {
            fontFamily: fontFamily || "Inter, sans-serif",
            fontWeight: 700,
            fontStyle: "normal",
        }
    }, [fontFamily])

    return (
        <div
            ref={containerRef}
            aria-label={ariaLabel}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "56rem",
                    padding: "0 20px",
                    textAlign: "center",
                    fontSize: `${fontSize}px`,
                    ...fontStyles,
                    textTransform: "uppercase",
                    letterSpacing: "-0.05em",
                    lineHeight: 1.1,
                    perspective: `${perspective}px`,
                    perspectiveOrigin: "center",
                    transformStyle: "preserve-3d",
                    willChange: "transform, filter, opacity",
                }}
            >
                {characters.map((char, index) => (
                    <AnimatedCharacter
                        key={`${char}-${index}`}
                        char={char}
                        index={index}
                        centerIndex={centerIndex}
                        smoothProgress={smoothProgress}
                        color={textColor}
                        spreadAmount={spreadAmount}
                        rotationAmount={rotationAmount}
                        initialBlur={initialBlur}
                        initialScale={initialScale}
                        isStatic={isStatic}
                        shouldReduceMotion={shouldReduceMotion}
                    />
                ))}
            </div>
        </div>
    )
}

TextScrollAnimation.defaultProps = {
    text: "SEE MORE FROM KARIM SAIF",
    textColor: "#2563EB",
    fontSize: 60,
    fontFamily: { fontFamily: "Inter", fontWeight: 700 },
    perspective: 500,
    spreadAmount: 50,
    rotationAmount: 12,
    initialBlur: 8,
    initialScale: 0.75,
    stiffness: 120,
    damping: 24,
    mass: 0.8,
    ariaLabel: "Typer text visualization",
}

addPropertyControls(TextScrollAnimation, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "SEE MORE FROM KARIM SAIF",
        description: "Text content to split and animate on scroll.",
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: { fontFamily: "Inter", fontWeight: 700 },
        controls: "standard",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#2563EB",
        description: "Color of the animated text characters.",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 60,
        min: 16,
        max: 180,
        step: 2,
        description: "Text size in pixels.",
    },
    spreadAmount: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 50,
        min: 10,
        max: 150,
        step: 5,
        description: "How far apart letters scatter horizontally.",
    },
    rotationAmount: {
        type: ControlType.Number,
        title: "3D Rotation",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 2,
        description: "X-axis rotation multiplier per character distance.",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 500,
        min: 100,
        max: 2000,
        step: 50,
        description: "Depth effect intensity for 3D rotations.",
    },
    initialBlur: {
        type: ControlType.Number,
        title: "Start Blur",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
        description: "Initial blur intensity before letters converge.",
    },
    initialScale: {
        type: ControlType.Number,
        title: "Start Scale",
        defaultValue: 0.75,
        min: 0.1,
        max: 1,
        step: 0.05,
        description: "Initial character scale size.",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 120,
        min: 10,
        max: 500,
        step: 10,
        description: "Spring stiffness for scroll physics.",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 24,
        min: 5,
        max: 100,
        step: 1,
        description: "Spring damping factor.",
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 0.8,
        min: 0.1,
        max: 5,
        step: 0.1,
        description: "Spring mass weight.",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Text Scroll Animation",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

// Made with 💛 by Karim Saif
