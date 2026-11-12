// Text Scrambler Effect
// Animates each character from random symbols to reveal a customizable word
import { useEffect, useRef, useState, startTransition } from "react"
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

const SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=<>?".split("")

function randomChar() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
}

function scrambleText(target, progress, scrambleSeed) {
    return target.split("").map((char, i) => {
        if (i < progress) return { char, isScrambled: false }
        // Use scrambleSeed to change the character per frame
        const idx = Math.floor(Math.random() * SYMBOLS.length + scrambleSeed * (i + 1)) % SYMBOLS.length
        return { char: SYMBOLS[idx], isScrambled: true }
    })
}

/**
 * Text Scrambler Effect
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TextScrambler(props) {
    const {
        word = "Framer",
        duration = 1200,
        speed = 1,
        font,
        color,
        style,
    } = props
    const [progress, setProgress] = useState(0)
    const [display, setDisplay] = useState(scrambleText(word, word.length, 0))
    const raf = useRef(null)
    const isStatic = useIsStaticRenderer()
    const spanRef = useRef(null)
    const inView = useInView(spanRef, { once: false, margin: "-10% 0px -10% 0px" })
    const [hasAnimated, setHasAnimated] = useState(false)
    const scrambleSeedRef = useRef(Math.random())

    // Scramble animation
    useEffect(() => {
        if (isStatic) {
            setDisplay(scrambleText(word, word.length, 0))
            setProgress(word.length)
            return
        }
        if (!inView) return
        if (hasAnimated && display.every(d => !d.isScrambled)) return
        setHasAnimated(true)
        let start = null
        let lastScramble = 0
        const scrambleInterval = 1000 / (speed * 20)
        function animate(ts) {
            if (!start) start = ts
            const elapsed = ts - start
            const totalFrames = word.length
            const effectiveDuration = duration
            const reveal = Math.min(totalFrames, Math.floor((elapsed / effectiveDuration) * totalFrames) + 1)
            // Update scramble seed at a rate based on speed
            if (ts - lastScramble > scrambleInterval) {
                scrambleSeedRef.current = Math.random()
                lastScramble = ts
            }
            startTransition(() => {
                setProgress(reveal)
                setDisplay(scrambleText(word, reveal, scrambleSeedRef.current))
            })
            if (reveal < totalFrames) {
                raf.current = requestAnimationFrame(animate)
            } else {
                setDisplay(scrambleText(word, word.length, 0))
            }
        }
        setProgress(0)
        setDisplay(scrambleText(word, 0, scrambleSeedRef.current))
        raf.current = requestAnimationFrame(animate)
        return () => raf.current && cancelAnimationFrame(raf.current)
    }, [word, duration, speed, inView, isStatic])

    useEffect(() => {
        if (!inView) setHasAnimated(false)
    }, [inView])

    // Render logic
    return (
        <span
            ref={spanRef}
            style={{
                ...style,
                ...font,
                color,
                width: "max-content",
                display: "inline-block",
                whiteSpace: "pre",
                letterSpacing: font?.letterSpacing,
            }}
            aria-label={word}
        >
            {display.map((d, i) => (
                <span key={i} style={{ color: d.isScrambled ? props.scrambleColor : color }}>
                    {d.char}
                </span>
            ))}
        </span>
    )
}

addPropertyControls(TextScrambler, {
    word: {
        type: ControlType.String,
        title: "Word",
        defaultValue: "Framer",
    },
    scrambleColor: {
        type: ControlType.Color,
        title: "Scramble Color",
        defaultValue: "#CCCCCC",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1200,
        min: 200,
        max: 5000,
        unit: "ms",
        step: 50,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
})
