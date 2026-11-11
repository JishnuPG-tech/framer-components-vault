// Dynamic Typing Animation Component with Customizable Cursor and Typography
import {
    useState,
    useEffect,
    useRef,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TypewriterEffectProps {
    words: { word: string }[]
    typingSpeed: number
    deletingSpeed: number
    pauseDuration: number
    cursorColor: string
    cursorWidth: number
    cursorHeight: number
    font: any
    textColor: string
    style?: CSSProperties
}

/**
 * Dynamic Typing Animation
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TypewriterEffect(props: TypewriterEffectProps) {
    const {
        words = [{ word: "Hello" }, { word: "World" }, { word: "Framer" }],
        typingSpeed,
        deletingSpeed,
        pauseDuration,
        cursorColor,
        cursorWidth,
        cursorHeight,
        font,
        textColor,
        style,
    } = props

    const [displayed, setDisplayed] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [wordIndex, setWordIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [pause, setPause] = useState(false)
    const [showCursor, setShowCursor] = useState(true)
    const timeoutRef = useRef<number | null>(null)
    const blinkRef = useRef<number | null>(null)

    const currentWord =
        words.length > 0 ? words[wordIndex % words.length].word : ""

    // Typing/Deleting Effect
    useEffect(() => {
        if (pause) return
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        let delay = typingSpeed
        if (!isDeleting && charIndex < currentWord.length) {
            delay = typingSpeed
            timeoutRef.current = window.setTimeout(() => {
                startTransition(() => {
                    setDisplayed(currentWord.slice(0, charIndex + 1))
                    setCharIndex(charIndex + 1)
                })
            }, delay)
        } else if (!isDeleting && charIndex === currentWord.length) {
            // Pause at end of word
            timeoutRef.current = window.setTimeout(() => {
                startTransition(() => setIsDeleting(true))
            }, pauseDuration)
        } else if (isDeleting && charIndex > 0) {
            delay = deletingSpeed
            timeoutRef.current = window.setTimeout(() => {
                startTransition(() => {
                    setDisplayed(currentWord.slice(0, charIndex - 1))
                    setCharIndex(charIndex - 1)
                })
            }, delay)
        } else if (isDeleting && charIndex === 0) {
            // Pause before next word
            timeoutRef.current = window.setTimeout(() => {
                startTransition(() => {
                    setIsDeleting(false)
                    setWordIndex((wordIndex + 1) % words.length)
                })
            }, pauseDuration)
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [
        charIndex,
        isDeleting,
        pause,
        wordIndex,
        currentWord,
        typingSpeed,
        deletingSpeed,
        pauseDuration,
        words.length,
    ])

    // Reset charIndex when wordIndex changes
    useEffect(() => {
        if (!isDeleting) {
            startTransition(() => setCharIndex(0))
        }
    }, [wordIndex, isDeleting])

    // Blinking Cursor Effect
    useEffect(() => {
        if (blinkRef.current) clearInterval(blinkRef.current)
        blinkRef.current = window.setInterval(() => {
            startTransition(() => setShowCursor((v) => !v))
        }, 500)
        return () => {
            if (blinkRef.current) clearInterval(blinkRef.current)
        }
    }, [])

    // Font size for cursor height calculation
    const fontSize = useMemo(() => {
        if (font && font.fontSize) {
            if (
                typeof font.fontSize === "string" &&
                font.fontSize.endsWith("px")
            ) {
                return parseFloat(font.fontSize)
            } else if (typeof font.fontSize === "number") {
                return font.fontSize
            }
        }
        return 32
    }, [font])

    return (
        <span
            style={{
                ...style,
                ...font,
                color: textColor,
                display: "inline-flex",
                alignItems: "center",
                minWidth: 1,
                minHeight: 1,
                width: "max-content",
                height: "max-content",
                whiteSpace: "pre",
            }}
            aria-live="polite"
        >
            {displayed}
            <span
                aria-hidden="true"
                style={{
                    display: "inline-block",
                    background: cursorColor,
                    width: cursorWidth,
                    height: fontSize * (cursorHeight / 100),
                    marginLeft: 2,
                    marginRight: 2,
                    verticalAlign: "bottom",
                    opacity: showCursor ? 1 : 0,
                    transition: "opacity 0.1s",
                    borderRadius: 2,
                }}
            />
        </span>
    )
}

addPropertyControls(TypewriterEffect, {
    words: {
        type: ControlType.Array,
        title: "Words",
        control: {
            type: ControlType.Object,
            controls: {
                word: { type: ControlType.String, defaultValue: "Hello" },
            },
        },
        defaultValue: [
            { word: "Hello" },
            { word: "World" },
            { word: "Framer" },
        ],
        maxCount: 10,
    },
    typingSpeed: {
        type: ControlType.Number,
        title: "Typing Speed",
        defaultValue: 100,
        min: 20,
        max: 500,
        unit: "ms",
        step: 5,
    },
    deletingSpeed: {
        type: ControlType.Number,
        title: "Deleting Speed",
        defaultValue: 60,
        min: 10,
        max: 500,
        unit: "ms",
        step: 5,
    },
    pauseDuration: {
        type: ControlType.Number,
        title: "Pause Duration",
        defaultValue: 1000,
        min: 200,
        max: 3000,
        unit: "ms",
        step: 50,
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#FFFFFF",
    },
    cursorWidth: {
        type: ControlType.Number,
        title: "Cursor Width",
        defaultValue: 2,
        min: 1,
        max: 8,
        unit: "px",
        step: 1,
    },
    cursorHeight: {
        type: ControlType.Number,
        title: "Cursor Height",
        defaultValue: 100,
        min: 50,
        max: 120,
        unit: "%",
        step: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
})
