// Text typewriter component that types out words with customizable speed and styling
import {
    useState,
    useEffect,
    startTransition,
    type CSSProperties,
    useRef,
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


interface LiveTextProps {
    texts: { text: string }[]
    speed: number
    deleteSpeed: number
    pauseDuration: number
    loop: boolean
    showCursor: boolean
    cursorType: "underscore" | "pipe" | "block"
    cursorColor: string
    font: any
    textColor: string
    containerWidth: number
    containerHeight: number
    enableSound: boolean
    soundVolume: number
    lastLetterColor: string
    highlightLastLetter: boolean
    highlightCount: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LiveText(props: LiveTextProps) {
    const {
        texts = [{ text: "Hello, World!" }],
        speed = 100,
        deleteSpeed = 50,
        showCursor = true,
        cursorType = "underscore",
        cursorColor = "#000000",
        loop = false,
        pauseDuration = 1000,
        font,
        textColor = "#000000",
        containerWidth = 300,
        containerHeight = 100,
        enableSound = false,
        soundVolume = 0.3,
        lastLetterColor = "#FF0000",
        highlightLastLetter = false,
        highlightCount = 1,
    } = props

    const [displayText, setDisplayText] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentTextIndex, setCurrentTextIndex] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showCursorBlink, setShowCursorBlink] = useState(true)
    const [isTyping, setIsTyping] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const isCanvasOrThumbnail =
        RenderTarget.current() === RenderTarget.canvas ||
        RenderTarget.current() === RenderTarget.thumbnail

    const currentText = texts[currentTextIndex]?.text || ""

    // Initialize audio
    useEffect(() => {
        if (enableSound && typeof window !== "undefined") {
            // Create a simple typing sound using Web Audio API
            const audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)()

            const playTypingSound = () => {
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.frequency.value = 800
                oscillator.type = "sine"

                gainNode.gain.setValueAtTime(
                    soundVolume,
                    audioContext.currentTime
                )
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    audioContext.currentTime + 0.03
                )

                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.03)
            }

            audioRef.current = { play: playTypingSound } as any
        }
    }, [enableSound, soundVolume])

    // Reset when texts change
    useEffect(() => {
        startTransition(() => {
            setDisplayText("")
            setCurrentIndex(0)
            setCurrentTextIndex(0)
            setIsComplete(false)
            setIsDeleting(false)
        })
    }, [texts])

    // Typing and deleting animation
    useEffect(() => {
        if (isCanvasOrThumbnail) {
            // In canvas/thumbnail mode, show all texts joined
            setDisplayText(texts.map((t) => t.text).join(" "))
            setIsComplete(true)
            return
        }

        if (isDeleting) {
            // Deleting phase
            if (displayText.length > 0) {
                const timer = setTimeout(() => {
                    startTransition(() => {
                        setDisplayText((prev) => prev.slice(0, -1))
                    })
                }, deleteSpeed)

                return () => clearTimeout(timer)
            } else {
                // Deletion complete, move to next text
                startTransition(() => {
                    setIsDeleting(false)
                    setCurrentIndex(0)
                    setCurrentTextIndex((prev) => (prev + 1) % texts.length)
                })
            }
        } else {
            // Typing phase
            if (currentIndex < currentText.length) {
                const timer = setTimeout(() => {
                    startTransition(() => {
                        setDisplayText(currentText.slice(0, currentIndex + 1))
                        setCurrentIndex(currentIndex + 1)
                        setIsTyping(true)

                        // Play typing sound
                        if (enableSound && audioRef.current) {
                            audioRef.current.play()
                        }
                    })
                }, speed)

                return () => clearTimeout(timer)
            } else if (currentIndex >= currentText.length && !isComplete) {
                // Current text is complete
                startTransition(() => setIsTyping(false))
                
                if (currentTextIndex < texts.length - 1) {
                    // More texts to show, start deleting after pause
                    const deleteTimer = setTimeout(() => {
                        startTransition(() => {
                            setIsDeleting(true)
                        })
                    }, pauseDuration)

                    return () => clearTimeout(deleteTimer)
                } else if (loop) {
                    // All texts shown and looping is enabled, start deleting after pause
                    const deleteTimer = setTimeout(() => {
                        startTransition(() => {
                            setIsDeleting(true)
                        })
                    }, pauseDuration)

                    return () => clearTimeout(deleteTimer)
                } else {
                    // All texts complete and not looping
                    startTransition(() => setIsComplete(true))
                }
            }
        }
    }, [
        currentIndex,
        currentText,
        currentTextIndex,
        texts,
        speed,
        deleteSpeed,
        isComplete,
        isDeleting,
        loop,
        pauseDuration,
        displayText,
        isCanvasOrThumbnail,
        enableSound,
    ])

    // Cursor blinking
    useEffect(() => {
        if (!showCursor || isCanvasOrThumbnail) return

        const blinkTimer = setInterval(() => {
            startTransition(() => setShowCursorBlink((prev) => !prev))
        }, 530)

        return () => clearInterval(blinkTimer)
    }, [showCursor, isCanvasOrThumbnail])

    const isFixedWidth = props?.style && props.style.width === "100%"
    const isFixedHeight = props?.style && props.style.height === "100%"

    const getCursorDisplay = () => {
        switch (cursorType) {
            case "underscore":
                return "_"
            case "pipe":
                return "|"
            case "block":
                return "█"
            default:
                return "_"
        }
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: isFixedWidth ? "100%" : `${containerWidth}px`,
                height: isFixedHeight ? "100%" : `${containerHeight}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                color: textColor,
                ...font,
            }}
        >
            <span>
                {highlightLastLetter && displayText.length > 0 && isTyping ? (
                    <>
                        {displayText.slice(0, -highlightCount)}
                        <span style={{ color: lastLetterColor }}>
                            {displayText.slice(-highlightCount)}
                        </span>
                    </>
                ) : (
                    displayText
                )}
                {showCursor && (
                    <span
                        style={{
                            color: cursorColor,
                            opacity: showCursorBlink ? 1 : 0,
                            transition: isCanvasOrThumbnail
                                ? "none"
                                : "opacity 0.1s ease-in-out",
                        }}
                    >
                        {getCursorDisplay()}
                    </span>
                )}
            </span>
        </div>
    )
}

addPropertyControls(LiveText, {
    // Content
    texts: {
        type: ControlType.Array,
        title: "Texts",
        description: "Array of text strings to type out in sequence",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    description: "Individual text string to be typed",
                    defaultValue: "Hello, World!",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            { text: "Hello, World!" },
            { text: "Welcome to Framer!" },
            { text: "Create amazing components!" },
        ],
        maxCount: 10,
    },

    // Animation
    speed: {
        type: ControlType.Number,
        title: "Type Speed",
        description: "Delay between each character being typed (10-500ms)",
        defaultValue: 100,
        min: 10,
        max: 500,
        step: 10,
        unit: "ms",
    },
    deleteSpeed: {
        type: ControlType.Number,
        title: "Delete Speed",
        description: "Delay between each character being deleted (10-200ms)",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 10,
        unit: "ms",
    },
    pauseDuration: {
        type: ControlType.Number,
        title: "Pause Duration",
        description:
            "Time to wait before deleting text and moving to next (500-5000ms)",
        defaultValue: 1000,
        min: 500,
        max: 5000,
        step: 100,
        unit: "ms",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        description: "Continuously cycle through all texts when enabled",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // Cursor
    showCursor: {
        type: ControlType.Boolean,
        title: "Cursor",
        description: "Display animated cursor next to typed text",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    cursorType: {
        type: ControlType.Enum,
        title: "Cursor Type",
        description: "Visual style of the cursor character",
        options: ["underscore", "pipe", "block"],
        optionTitles: ["Underscore (_)", "Pipe (|)", "Block (█)"],
        defaultValue: "underscore",
        displaySegmentedControl: true,
        hidden: ({ showCursor }) => !showCursor,
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        description: "Color of the blinking cursor",
        defaultValue: "#000000",
        hidden: ({ showCursor }) => !showCursor,
    },

    // Style
    font: {
        type: ControlType.Font,
        title: "Font",
        description: "Typography settings for the typed text",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Color of the typed text content",
        defaultValue: "#000000",
    },
    highlightLastLetter: {
        type: ControlType.Boolean,
        title: "Highlight Last Letter",
        description: "Apply a different color to the last letter of the text",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lastLetterColor: {
        type: ControlType.Color,
        title: "Last Letter Color",
        description: "Color applied to the last letter when highlighting is enabled",
        defaultValue: "#FF0000",
        hidden: ({ highlightLastLetter }) => !highlightLastLetter,
    },
    highlightCount: {
        type: ControlType.Number,
        title: "Highlight Count",
        description: "Number of characters to highlight from the end (1-10)",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ highlightLastLetter }) => !highlightLastLetter,
    },

    // Layout
    containerWidth: {
        type: ControlType.Number,
        title: "Width",
        description: "Fixed width of the component container (100-800px)",
        defaultValue: 300,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
    },
    containerHeight: {
        type: ControlType.Number,
        title: "Height",
        //description: "Fixed height of the component container (50-400px)",
        defaultValue: 100,
        min: 50,
        max: 400,
        step: 10,
        unit: "px",
        description:
            "More components at [8ighty8 Studio](https://8ighty8studio.lemonsqueezy.com)",
    },
})
