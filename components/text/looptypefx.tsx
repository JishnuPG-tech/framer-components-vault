// Text typing effect component with customizable speed, cursor, and animation options
import {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
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
    text: string[]
    typingSpeed: number
    pauseDuration: number
    deletingSpeed: number
    initialDelay: number
    loop: boolean
    showCursor: boolean
    cursorCharacter: string
    cursorBlinkDuration: number
    hideCursorWhileTyping: boolean
    startOnVisible: boolean
    reverseMode: boolean
    textColor: string
    backgroundColor: string
    font: any
    cursorColor: string
    style?: CSSProperties
}

/**
 * Text Typing Effect
 *
 * A component that creates a typewriter effect with customizable typing speed, cursor, and animation options.
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 50
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function TypewriterEffect(props: TypewriterEffectProps) {
    const {
        text = ["Text typing effect", "for your websites", "Happy coding!"],
        typingSpeed = 75,
        pauseDuration = 1500,
        deletingSpeed = 30,
        initialDelay = 0,
        loop = true,
        showCursor = true,
        cursorCharacter = "|",
        cursorBlinkDuration = 500,
        hideCursorWhileTyping = false,
        startOnVisible = false,
        reverseMode = false,
        textColor = "#000000",
        backgroundColor = "#FFFFFF",
        font,
        cursorColor = "#000000",
    } = props

    const [displayedText, setDisplayedText] = useState("")
    const [currentCharIndex, setCurrentCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [currentTextIndex, setCurrentTextIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(!startOnVisible)
    const [cursorVisible, setCursorVisible] = useState(true)

    const containerRef = useRef<HTMLDivElement>(null)
    const cursorIntervalRef = useRef<number | null>(null)
    const typingTimeoutRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()

    const textArray = useMemo(
        () => (Array.isArray(text) ? text : [text]),
        [text]
    )

    // Cursor blinking effect
    useEffect(() => {
        if (!showCursor || isStatic) return

        if (cursorIntervalRef.current) {
            clearInterval(cursorIntervalRef.current)
        }

        cursorIntervalRef.current = window.setInterval(() => {
            startTransition(() => {
                setCursorVisible((prev) => !prev)
            })
        }, cursorBlinkDuration)

        return () => {
            if (cursorIntervalRef.current) {
                clearInterval(cursorIntervalRef.current)
            }
        }
    }, [showCursor, cursorBlinkDuration, isStatic])

    // Intersection observer for start on visible
    useEffect(() => {
        if (!startOnVisible || !containerRef.current || isStatic) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        startTransition(() => {
                            setIsVisible(true)
                        })
                    }
                })
            },
            { threshold: 0.1 }
        )

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [startOnVisible, isStatic])

    // Main typing effect
    useEffect(() => {
        if (!isVisible || isStatic) {
            // Show complete first text in static mode
            if (isStatic && textArray.length > 0) {
                setDisplayedText(textArray[0])
            }
            return
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        const currentText = textArray[currentTextIndex]
        const processedText = reverseMode
            ? currentText.split("").reverse().join("")
            : currentText

        const executeTypingAnimation = () => {
            if (isDeleting) {
                if (displayedText === "") {
                    startTransition(() => {
                        setIsDeleting(false)
                        if (
                            currentTextIndex === textArray.length - 1 &&
                            !loop
                        ) {
                            return
                        }
                        setCurrentTextIndex(
                            (prev) => (prev + 1) % textArray.length
                        )
                        setCurrentCharIndex(0)
                    })
                    typingTimeoutRef.current = window.setTimeout(
                        () => {},
                        pauseDuration
                    )
                } else {
                    typingTimeoutRef.current = window.setTimeout(() => {
                        startTransition(() => {
                            setDisplayedText((prev) => prev.slice(0, -1))
                        })
                    }, deletingSpeed)
                }
            } else {
                if (currentCharIndex < processedText.length) {
                    typingTimeoutRef.current = window.setTimeout(() => {
                        startTransition(() => {
                            setDisplayedText(
                                (prev) => prev + processedText[currentCharIndex]
                            )
                            setCurrentCharIndex((prev) => prev + 1)
                        })
                    }, typingSpeed)
                } else if (textArray.length > 1) {
                    typingTimeoutRef.current = window.setTimeout(() => {
                        startTransition(() => {
                            setIsDeleting(true)
                        })
                    }, pauseDuration)
                }
            }
        }

        if (currentCharIndex === 0 && !isDeleting && displayedText === "") {
            typingTimeoutRef.current = window.setTimeout(
                executeTypingAnimation,
                initialDelay
            )
        } else {
            executeTypingAnimation()
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [
        currentCharIndex,
        displayedText,
        isDeleting,
        typingSpeed,
        deletingSpeed,
        pauseDuration,
        textArray,
        currentTextIndex,
        loop,
        initialDelay,
        isVisible,
        reverseMode,
        isStatic,
    ])

    const shouldHideCursor =
        hideCursorWhileTyping &&
        (currentCharIndex < textArray[currentTextIndex]?.length || isDeleting)

    const isFixedWidth = props?.style && props.style.width === "100%"

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                display: "inline-block",
                whiteSpace: "pre-wrap",
                backgroundColor,
                ...(isFixedWidth
                    ? { ...props?.style }
                    : { minWidth: "max-content" }),
                ...font,
            }}
        >
            <span
                style={{
                    color: textColor,
                }}
            >
                {displayedText}
            </span>
            {showCursor && !shouldHideCursor && (
                <span
                    style={{
                        marginLeft: "0.25rem",
                        display: "inline-block",
                        opacity: cursorVisible ? 1 : 0,
                        color: cursorColor,
                    }}
                >
                    {cursorCharacter}
                </span>
            )}
        </div>
    )
}

addPropertyControls(TypewriterEffect, {
    text: {
        type: ControlType.Array,
        title: "Text Array",
        control: {
            type: ControlType.String,
            placeholder: "Enter text...",
        },
        defaultValue: [
            "Text typing effect",
            "for your websites",
            "Happy coding!",
        ],
        maxCount: 10,
    },
    typingSpeed: {
        type: ControlType.Number,
        title: "Typing Speed",
        defaultValue: 75,
        min: 10,
        max: 500,
        step: 5,
        unit: "ms",
    },
    pauseDuration: {
        type: ControlType.Number,
        title: "Pause Duration",
        defaultValue: 1500,
        min: 100,
        max: 5000,
        step: 100,
        unit: "ms",
    },
    deletingSpeed: {
        type: ControlType.Number,
        title: "Deleting Speed",
        defaultValue: 30,
        min: 10,
        max: 200,
        step: 5,
        unit: "ms",
    },
    initialDelay: {
        type: ControlType.Number,
        title: "Initial Delay",
        defaultValue: 0,
        min: 0,
        max: 3000,
        step: 100,
        unit: "ms",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showCursor: {
        type: ControlType.Boolean,
        title: "Show Cursor",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cursorCharacter: {
        type: ControlType.String,
        title: "Cursor Character",
        defaultValue: "|",
        hidden: ({ showCursor }) => !showCursor,
    },
    cursorBlinkDuration: {
        type: ControlType.Number,
        title: "Cursor Blink Speed",
        defaultValue: 500,
        min: 100,
        max: 2000,
        step: 100,
        unit: "ms",
        hidden: ({ showCursor }) => !showCursor,
    },
    hideCursorWhileTyping: {
        type: ControlType.Boolean,
        title: "Hide Cursor While Typing",
        defaultValue: false,
        enabledTitle: "Hide",
        disabledTitle: "Show",
        hidden: ({ showCursor }) => !showCursor,
    },
    startOnVisible: {
        type: ControlType.Boolean,
        title: "Start On Visible",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    reverseMode: {
        type: ControlType.Boolean,
        title: "Reverse Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#000000",
        hidden: ({ showCursor }) => !showCursor,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
