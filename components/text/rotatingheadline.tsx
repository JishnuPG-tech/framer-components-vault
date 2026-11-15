// Rotating headline component with customizable font controls and smooth animations
import {
    useState,
    useEffect,
    useRef,
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


interface RotatingHeadlineProps {
    words: string[]
    prefix: string
    suffix: string
    interval: number
    color: string
    highlightColor: string
    prefixFont: any
    highlightFont: any
    suffixFont: any
    gap: number
    textAlign: "left" | "center" | "right"
    prefixPosition: "left" | "top"
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function RotatingHeadline(props: RotatingHeadlineProps) {
    const {
        words = ["Custom", "Branded", "Eco-Friendly"],
        prefix = "Get All Kinds Of",
        suffix = "Packaging",
        interval = 3000,
        color = "#000000",
        highlightColor = "#CCA761",
        prefixFont,
        highlightFont,
        suffixFont,
        gap = 8,
        textAlign = "left",
        prefixPosition = "left",
    } = props

    const [index, setIndex] = useState(0)
    const containerRef = useRef<HTMLSpanElement>(null)
    const wordRef = useRef<HTMLSpanElement>(null)

    // Cycle through words
    useEffect(() => {
        if (words.length <= 1) return

        const id = setInterval(() => {
            startTransition(() => {
                setIndex((i) => (i + 1) % words.length)
            })
        }, interval)
        return () => clearInterval(id)
    }, [interval, words.length])

    // Adjust container width to match current word
    useEffect(() => {
        if (containerRef.current && wordRef.current) {
            // Defensive: Only set width if wordRef has a valid offsetWidth
            const width = wordRef.current.offsetWidth
            if (typeof width === "number" && !isNaN(width)) {
                containerRef.current.style.width = `${width}px`
            }
        }
    }, [index, words])

    const currentWord = words[index] || ""

    return (
        <div
            style={{
                textAlign,
                color,
                width: "100%",
                position: "relative",
            }}
        >
            {prefixPosition === "top" ? (
                <div
                    style={{
                        marginBottom: `${gap}px`,
                        ...prefixFont,
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                    }}
                >
                    {prefix}
                </div>
            ) : null}

            <div
                style={{
                    display: "inline",
                    textAlign,
                }}
            >
                {prefixPosition === "left" ? (
                    <span style={{ marginRight: `${gap}px`, ...prefixFont }}>
                        {prefix}
                    </span>
                ) : null}
                <span
                    ref={containerRef}
                    style={{
                        display: "inline-block",
                        /*overflow: "hidden",*/
                        position: "relative",
                        transition: "width 0.6s ease-in-out",
                    }}
                >
                    <span
                        ref={wordRef}
                        className="rotating-word"
                        key={index}
                        style={{
                            display: "inline",
                            color: highlightColor,
                            whiteSpace: "nowrap",
                            ...highlightFont,
                        }}
                    >
                        {currentWord}
                    </span>
                </span>
                <span
                    style={{
                        marginLeft: `${gap}px`,
                        ...suffixFont,
                    }}
                >
                    {suffix}
                </span>
            </div>

            <style>{`
                .rotating-word {
                    animation: fadeIn 0.6s cubic-bezier(0.645,0.045,0.355,1) forwards,
                               stay ${interval - 1200}ms linear 0.6s forwards,
                               fadeOut 0.6s cubic-bezier(0.645,0.045,0.355,1) forwards ${interval - 600}ms;
                }
                @keyframes fadeIn { 
                    from { opacity: 0; } 
                    to { opacity: 1; } 
                }
                @keyframes stay { 
                    from { opacity: 1; } 
                    to { opacity: 1; } 
                }
                @keyframes fadeOut { 
                    from { opacity: 1; } 
                    to { opacity: 0; } 
                }
            `}</style>
        </div>
    )
}

addPropertyControls(RotatingHeadline, {
    words: {
        title: "Words",
        type: ControlType.Array,
        control: { type: ControlType.String },
        defaultValue: ["Custom", "Branded", "Eco-Friendly"],
    },
    prefix: {
        title: "Prefix",
        type: ControlType.String,
        defaultValue: "Get All Kinds Of",
    },
    suffix: {
        title: "Suffix",
        type: ControlType.String,
        defaultValue: "Packaging",
    },
    interval: {
        title: "Interval",
        type: ControlType.Number,
        min: 500,
        max: 10000,
        step: 100,
        defaultValue: 3000,
        unit: "ms",
    },
    color: {
        title: "Text Color",
        type: ControlType.Color,
        defaultValue: "#000000",
    },
    highlightColor: {
        title: "Highlight Color",
        type: ControlType.Color,
        defaultValue: "#CCA761",
    },
    gap: {
        title: "Gap",
        type: ControlType.Number,
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 8,
        unit: "px",
    },
    prefixFont: {
        type: ControlType.Font,
        title: "Prefix Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    highlightFont: {
        type: ControlType.Font,
        title: "Highlight Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    suffixFont: {
        type: ControlType.Font,
        title: "Suffix Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    prefixPosition: {
        type: ControlType.Enum,
        title: "Prefix Position",
        options: ["left", "top"],
        optionTitles: ["Left", "Top"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
})
