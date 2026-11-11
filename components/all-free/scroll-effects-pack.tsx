import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, MotionValue, useMotionValueEvent } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React from "react"

interface TextScrollEffectsPackProps {
    text: string
    font: any
    effect: "blur" | "scale" | "kerning" | "typewriter" | "smarttypewriter" | "handwrite" | "scramble" | "magic"
    color: string
    accentColor: string
    magicMixIntensity: number
    handwriteSmoothness: number
    kernTightSpacing: number
    scaleUpHeight: number
    blurRevealIntensity: number
    smartTypeCaretSpeed: number
    smartTypeShowCaret: boolean
    scrambleSpeed: number
    typewriterCaretSpace: number
    typewriterCaretSpeed: number
    typewriterShowCaret: boolean
}

interface AnimatedElementProps {
    element: string
    index: number
    totalElements: number
    scrollYProgress: MotionValue<number>
    effect: "blur" | "scale" | "kerning" | "typewriter" | "smarttypewriter" | "handwrite" | "scramble" | "magic"
    color: string
    accentColor: string
    visibleCount: number
    fontLetterSpacing?: string
    isLastWord: boolean
    isStatic: boolean
    magicMixIntensity?: number
    handwriteSmoothness?: number
    kernTightSpacing?: number
    scaleUpHeight?: number
    blurRevealIntensity?: number
    smartTypeCaretSpeed?: number
    smartTypeShowCaret?: boolean
    scrambleSpeed?: number
    typewriterCaretSpace?: number
    typewriterCaretSpeed?: number
    typewriterShowCaret?: boolean
}

function AnimatedElement({
    element,
    index,
    totalElements,
    scrollYProgress,
    effect,
    color,
    accentColor,
    visibleCount,
    fontLetterSpacing,
    isLastWord,
    isStatic,
    magicMixIntensity = 50,
    handwriteSmoothness = 50,
    kernTightSpacing = 0.15,
    scaleUpHeight = 20,
    blurRevealIntensity = 0.6,
    smartTypeCaretSpeed = 0.8,
    smartTypeShowCaret = true,
    scrambleSpeed = 30,
    typewriterCaretSpace = 0.05,
    typewriterCaretSpeed = 0.8,
    typewriterShowCaret = true,
}: AnimatedElementProps) {
    const elementProgress = useTransform(
        scrollYProgress,
        [index / totalElements, (index + 1) / totalElements],
        [0, 1]
    )

    const opacity = useTransform(elementProgress, [0, 1], [0.2, 1])
    const y = useTransform(elementProgress, [0, 1], [scaleUpHeight, 0])
    const blurValue = useTransform(elementProgress, [0, 1], [4, 0])
    const blurOpacity = useTransform(elementProgress, [0, 1], [0.4, 1])
    const scaleValue = useTransform(elementProgress, [0, 1], [0.8, 1])
    const letterSpacingValue = useTransform(elementProgress, [0, 1], [`${kernTightSpacing}em`, "0em"])
    const translateY = useTransform(y, (v) => `${v}px`)

    // 3D scale effect transforms
    const rotateXValue = useTransform(elementProgress, [0, 1], [45, 0])
    const rotateYValue = useTransform(elementProgress, [0, 1], [0, 0])
    const translateZValue = useTransform(elementProgress, [0, 1], [-100, 0])
    const shadowOpacity = useTransform(elementProgress, [0, 1], [0.3, 0])
    const textShadowValue = useTransform(
        shadowOpacity,
        (v) => `0 ${4 + v * 10}px ${15 + v * 20}px rgba(0,0,0,${v * 0.4})`
    )

    const scale3DTransform = useTransform(
        [scaleValue, rotateXValue, rotateYValue, translateZValue],
        (values) => {
            const [latestScale, latestRotateX, latestRotateY, latestTranslateZ] = values
            return `scale(${latestScale}) rotateX(${latestRotateX}deg) rotateY(${latestRotateY}deg) translateZ(${latestTranslateZ}px)`
        }
    )

    // Progressive depth blur for blur effect - uses blurRevealIntensity
    const depthBlur = useTransform(
        scrollYProgress,
        [0, 1],
        [index * blurRevealIntensity, 0]
    )
    const depthOpacity = useTransform(
        scrollYProgress,
        [0, 1],
        [0.4 + (index / totalElements) * 0.2, 1]
    )
    const depthFilter = useTransform(depthBlur, (v) => `blur(${Math.max(0, v)}px)`)

    // Random offset based on character index for consistent but varied starting positions
    const randomOffset = React.useMemo(() => ({
        x: (Math.sin(index * 123.45) * magicMixIntensity) + (Math.cos(index * 67.89) * magicMixIntensity * 0.6),
        y: (Math.cos(index * 234.56) * magicMixIntensity * 0.8) + (Math.sin(index * 45.67) * magicMixIntensity * 0.7),
        rotate: (Math.sin(index * 89.01) * magicMixIntensity * 0.6),
    }), [index, magicMixIntensity])

    // Scramble effect state
    const scrambleChars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    const [displayChar, setDisplayChar] = useState(element)
    const isVisibleScramble = index < visibleCount
    
    useEffect(() => {
        if (effect !== "scramble") return
        
        if (!isVisibleScramble) {
            setDisplayChar(scrambleChars[Math.floor(Math.random() * scrambleChars.length)])
            return
        }
        
        let iteration = 0
        const maxIterations = 8
        const interval = setInterval(() => {
            if (iteration >= maxIterations) {
                setDisplayChar(element)
                clearInterval(interval)
                return
            }
            setDisplayChar(scrambleChars[Math.floor(Math.random() * scrambleChars.length)])
            iteration++
        }, scrambleSpeed)
        
        return () => clearInterval(interval)
    }, [isVisibleScramble, element, effect])

    // Magic effect state
    const [isHovered, setIsHovered] = useState(false)
    const [hasBeenHovered, setHasBeenHovered] = useState(false)
    const isVisibleMagic = index < visibleCount
    
    const handleMouseEnter = () => {
        setIsHovered(true)
        setHasBeenHovered(true)
    }
    
    const handleMouseLeave = () => {
        setIsHovered(false)
    }

    // In static renderer (canvas), show everything fully visible
    if (isStatic) {
        return (
            <span
                style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    color,
                    letterSpacing: fontLetterSpacing || "inherit",
                }}
            >
                {element}
            </span>
        )
    }

    if (effect === "kerning") {
        return (
            <motion.span
                style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    color,
                    letterSpacing: letterSpacingValue,
                }}
            >
                {element}
            </motion.span>
        )
    }

    if (effect === "blur") {
        return (
            <span style={{ display: "inline-block", whiteSpace: "pre", willChange: "filter, opacity" }}>
                <motion.span
                    style={{
                        display: "inline-block",
                        color,
                        filter: depthFilter,
                        opacity: depthOpacity,
                    }}
                >
                    {element}
                </motion.span>
            </span>
        )
    }

    if (effect === "scale") {
        return (
            <span 
                style={{ 
                    display: "inline-block", 
                    whiteSpace: "pre",
                    perspective: "1000px",
                    transformStyle: "preserve-3d",
                }}
            >
                <motion.span
                    style={{
                        display: "inline-block",
                        color,
                        opacity,
                        transform: scale3DTransform,
                        transformStyle: "preserve-3d",
                        willChange: "transform, opacity",
                    }}
                >
                    <motion.span
                        style={{
                            display: "inline-block",
                            textShadow: textShadowValue,
                        }}
                    >
                        {element}
                    </motion.span>
                </motion.span>
            </span>
        )
    }

    if (effect === "typewriter") {
        const isVisible = index < visibleCount
        const isCaretPosition = index === visibleCount - 1
        
        return (
            <>
                <motion.span
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 3 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={{
                        display: "inline-block",
                        whiteSpace: "pre",
                        color,
                        letterSpacing: fontLetterSpacing || "inherit",
                    }}
                >
                    {element}
                </motion.span>
                {isCaretPosition && typewriterShowCaret && (
                    <motion.span
                        initial={{ opacity: 1 }}
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{
                            duration: typewriterCaretSpeed,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            display: "inline-block",
                            color,
                            marginLeft: `-${typewriterCaretSpace}em`,
                            fontWeight: "100",
                            position: "relative",
                        }}
                    >
                        |
                    </motion.span>
                )}
            </>
        )
    }

    if (effect === "smarttypewriter") {
        const isVisible = index < visibleCount
        const isCaretPosition = index === visibleCount - 1
        const textColor = isLastWord && isVisible ? accentColor : color
        
        return (
            <>
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isVisible ? 1 : 0 }}
                    transition={{ duration: 0.05 }}
                    style={{
                        display: "inline-block",
                        whiteSpace: "pre",
                        color: textColor,
                        letterSpacing: fontLetterSpacing || "inherit",
                    }}
                >
                    {element}
                </motion.span>
                {isCaretPosition && smartTypeShowCaret && (
                    <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{
                            duration: smartTypeCaretSpeed,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            display: "inline-block",
                            color: accentColor,
                            marginLeft: "0.02em",
                            fontWeight: "300",
                            transform: "translateY(0.05em)",
                        }}
                    >
                        _
                    </motion.span>
                )}
            </>
        )
    }

    if (effect === "handwrite") {
        const isVisible = index < visibleCount
        
        // Calculate spring parameters based on smoothness (0-100)
        // Higher smoothness = lower stiffness, higher damping for smoother/slower animation
        // Lower smoothness = higher stiffness, lower damping for snappier/faster animation
        const stiffness = 100 + (100 - handwriteSmoothness) * 6 // 100 to 700
        const damping = 10 + handwriteSmoothness * 0.4 // 10 to 50
        
        return (
            <motion.span
                initial={{ opacity: 0, x: -8, rotate: -5 }}
                animate={{ 
                    opacity: isVisible ? 1 : 0,
                    x: isVisible ? 0 : -8,
                    rotate: isVisible ? 0 : -5,
                }}
                transition={{ 
                    type: "spring",
                    stiffness: stiffness,
                    damping: damping,
                    mass: 0.8,
                }}
                style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    color,
                    letterSpacing: fontLetterSpacing || "inherit",
                    transformOrigin: "left center",
                }}
            >
                {element}
            </motion.span>
        )
    }

    if (effect === "scramble") {
        return (
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisibleScramble ? 1 : 0.3 }}
                transition={{ duration: 0.1 }}
                style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    color,
                    letterSpacing: fontLetterSpacing || "inherit",
                }}
            >
                {displayChar}
            </motion.span>
        )
    }

    if (effect === "magic") {
        return (
            <motion.span
                initial={{ 
                    opacity: 0, 
                    x: randomOffset.x,
                    y: randomOffset.y,
                    rotate: randomOffset.rotate,
                }}
                animate={{ 
                    opacity: isVisibleMagic ? 1 : 0.2,
                    x: isVisibleMagic ? 0 : randomOffset.x,
                    y: isVisibleMagic ? 0 : randomOffset.y,
                    rotate: isVisibleMagic ? 0 : randomOffset.rotate,
                    scale: isHovered ? 1.15 : 1,
                }}
                transition={{ 
                    opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                    x: { type: "spring", stiffness: 120, damping: 25, mass: 1.2 },
                    y: { type: "spring", stiffness: 120, damping: 25, mass: 1.2 },
                    rotate: { type: "spring", stiffness: 100, damping: 20, mass: 1.2 },
                    scale: { type: "spring", stiffness: 300, damping: 25 },
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    color: hasBeenHovered ? accentColor : color,
                    letterSpacing: fontLetterSpacing || "inherit",
                    cursor: "default",
                }}
            >
                {element}
            </motion.span>
        )
    }

    return (
        <span style={{ display: "inline-block", whiteSpace: "pre" }}>
            <motion.span
                style={{
                    display: "inline-block",
                    color,
                    opacity,
                    transform: translateY,
                }}
            >
                {element}
            </motion.span>
        </span>
    )
}

/**
 * Text Scroll Effects Pack
 *
 * A text component that animates as you scroll through it.
 * Characters, words, or lines reveal progressively based on scroll position.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function TextScrollEffectsPack(props: TextScrollEffectsPackProps) {
    const {
        text = "Scroll to reveal this text animation",
        font = {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        effect = "blur",
        color = "#000000",
        accentColor = "#FF5500",
        magicMixIntensity = 50,
        handwriteSmoothness = 50,
        kernTightSpacing = 0.15,
        scaleUpHeight = 20,
        blurRevealIntensity = 0.6,
        smartTypeCaretSpeed = 0.8,
        smartTypeShowCaret = true,
        scrambleSpeed = 30,
        typewriterCaretSpace = 0.05,
        typewriterCaretSpeed = 0.8,
        typewriterShowCaret = true,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [visibleCount, setVisibleCount] = useState(0)
    const isStatic = useIsStaticRenderer()

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "center center"],
    })

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const characters = text.split("")
        const newVisibleCount = Math.max(0, Math.ceil(latest * characters.length))
        setVisibleCount(newVisibleCount)
    })

    useEffect(() => {
        setVisibleCount(0)
    }, [effect, text])

    const characters = text.split("")
    
    const wordBoundaries = React.useMemo(() => {
        const boundaries = []
        let wordStart = 0
        
        for (let i = 0; i <= characters.length; i++) {
            if (i === characters.length || characters[i] === " ") {
                if (i > wordStart) {
                    boundaries.push({ start: wordStart, end: i - 1 })
                }
                wordStart = i + 1
            }
        }
        
        return boundaries
    }, [characters])
    
    const lastVisibleWord = React.useMemo(() => {
        if (visibleCount === 0) return { start: -1, end: -1 }
        
        const lastVisibleCharIndex = visibleCount - 1
        
        for (const word of wordBoundaries) {
            if (lastVisibleCharIndex >= word.start && lastVisibleCharIndex <= word.end) {
                return word
            }
        }
        
        return { start: -1, end: -1 }
    }, [visibleCount, wordBoundaries])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                minHeight: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                flexWrap: "wrap",
                ...font,
                lineHeight: "1.4em",
                cursor: effect === "magic" ? "pointer" : "default",
            }}
        >
            {characters.map((char, index) => (
                <AnimatedElement
                    key={index}
                    element={char}
                    index={index}
                    totalElements={characters.length}
                    scrollYProgress={scrollYProgress}
                    effect={effect}
                    color={color}
                    accentColor={accentColor}
                    visibleCount={visibleCount}
                    fontLetterSpacing={font?.letterSpacing}
                    isLastWord={effect === "smarttypewriter" && index >= lastVisibleWord.start && index <= lastVisibleWord.end}
                    isStatic={isStatic}
                    magicMixIntensity={magicMixIntensity}
                    handwriteSmoothness={handwriteSmoothness}
                    kernTightSpacing={kernTightSpacing}
                    scaleUpHeight={scaleUpHeight}
                    blurRevealIntensity={blurRevealIntensity}
                    smartTypeCaretSpeed={smartTypeCaretSpeed}
                    smartTypeShowCaret={smartTypeShowCaret}
                    scrambleSpeed={scrambleSpeed}
                    typewriterCaretSpace={typewriterCaretSpace}
                    typewriterCaretSpeed={typewriterCaretSpeed}
                    typewriterShowCaret={typewriterShowCaret}
                />
            ))}
        </div>
    )
}

addPropertyControls(TextScrollEffectsPack, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Scroll to reveal this text animation",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font Style",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        options: ["blur", "scale", "kerning", "typewriter", "smarttypewriter", "handwrite", "scramble", "magic"],
        optionTitles: ["Blur Reveal", "Scale Up", "Kern Tight", "Type Writer", "Smart Type", "Hand Write", "Scramble In", "Magic Text"],
        defaultValue: "blur",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#FF5500",
        hidden: ({ effect }) => effect !== "smarttypewriter" && effect !== "magic",
    },
    magicMixIntensity: {
        type: ControlType.Number,
        title: "Mix Intensity",
        defaultValue: 50,
        min: 10,
        max: 150,
        step: 5,
        unit: "px",
        hidden: ({ effect }) => effect !== "magic",
    },
    handwriteSmoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        hidden: ({ effect }) => effect !== "handwrite",
    },
    kernTightSpacing: {
        type: ControlType.Number,
        title: "Start Spacing",
        defaultValue: 0.15,
        min: 0.05,
        max: 0.5,
        step: 0.01,
        unit: "em",
        hidden: ({ effect }) => effect !== "kerning",
    },
    scaleUpHeight: {
        type: ControlType.Number,
        title: "Height Offset",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
        hidden: ({ effect }) => effect !== "scale",
    },
    blurRevealIntensity: {
        type: ControlType.Number,
        title: "Blur Intensity",
        defaultValue: 0.6,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        unit: "x",
        hidden: ({ effect }) => effect !== "blur",
    },
    smartTypeCaretSpeed: {
        type: ControlType.Number,
        title: "Caret Speed",
        defaultValue: 0.8,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        unit: "s",
        hidden: ({ effect }) => effect !== "smarttypewriter",
    },
    smartTypeShowCaret: {
        type: ControlType.Boolean,
        title: "Show Caret",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ effect }) => effect !== "smarttypewriter",
    },
    scrambleSpeed: {
        type: ControlType.Number,
        title: "Scramble Speed",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 5,
        unit: "ms",
        hidden: ({ effect }) => effect !== "scramble",
    },
    typewriterCaretSpace: {
        type: ControlType.Number,
        title: "Caret Space",
        defaultValue: 0.05,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "em",
        hidden: ({ effect }) => effect !== "typewriter",
    },
    typewriterCaretSpeed: {
        type: ControlType.Number,
        title: "Blink Speed",
        defaultValue: 0.8,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        unit: "s",
        hidden: ({ effect }) => effect !== "typewriter",
    },
    typewriterShowCaret: {
        type: ControlType.Boolean,
        title: "Show Caret",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ effect }) => effect !== "typewriter",
    },
})
